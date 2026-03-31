import { ZodError } from 'zod';

import { requireMerchant } from '@/lib/auth/require-merchant';
import { AuthRequiredError } from '@/lib/auth/require-user';
import {
  getShipmentDetail,
  updateShipmentStatus,
} from '@/lib/db/queries/shipments';
import { manualShipmentStatusUpdateSchema } from '@/lib/validations/shipment';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import {
  isAllowedCodStatusTransition,
  isAllowedShipmentTransition,
} from '@/lib/utils/status';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getValidationDetails(error: ZodError) {
  return error.flatten();
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireMerchant();
    const { id } = await context.params;
    const currentShipment = await getShipmentDetail(auth.merchantId, id);

    if (!currentShipment) {
      return errorResponse('Shipment not found.', 404);
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return errorResponse('Invalid JSON body.', 400);
    }

    const updateResult = manualShipmentStatusUpdateSchema.safeParse(payload);

    if (!updateResult.success) {
      return errorResponse(
        'Invalid shipment status payload.',
        400,
        getValidationDetails(updateResult.error)
      );
    }

    const nextCodStatus = updateResult.data.codStatus ?? currentShipment.codStatus;

    if (
      !isAllowedShipmentTransition(
        currentShipment.shipmentStatus,
        updateResult.data.shipmentStatus
      )
    ) {
      return errorResponse('Shipment status transition is not allowed.', 400);
    }

    if (!isAllowedCodStatusTransition(currentShipment.codStatus, nextCodStatus)) {
      return errorResponse('COD status transition is not allowed.', 400);
    }

    const shipmentDetail = await updateShipmentStatus({
      merchantId: auth.merchantId,
      userId: auth.userId,
      shipmentId: id,
      currentShipment,
      input: updateResult.data,
    });

    return successResponse({
      shipment: shipmentDetail,
      statusHistory: shipmentDetail.statusHistory,
      returnRecord: shipmentDetail.returnRecord,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to update shipment status.', 500);
  }
}
