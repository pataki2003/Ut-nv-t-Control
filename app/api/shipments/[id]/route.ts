import { ZodError } from 'zod';

import { requireMerchant } from '@/lib/auth/require-merchant';
import { AuthRequiredError } from '@/lib/auth/require-user';
import {
  getShipmentDetail,
  updateShipmentDetail,
} from '@/lib/db/queries/shipments';
import { updateShipmentSchema } from '@/lib/validations/shipment';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getValidationDetails(error: ZodError) {
  return error.flatten();
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireMerchant();
    const { id } = await context.params;
    const shipmentDetail = await getShipmentDetail(auth.merchantId, id);

    if (!shipmentDetail) {
      return errorResponse('Shipment not found.', 404);
    }

    return successResponse({
      shipment: shipmentDetail,
      statusHistory: shipmentDetail.statusHistory,
      returnRecord: shipmentDetail.returnRecord,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to load shipment detail.', 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireMerchant();
    const { id } = await context.params;

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return errorResponse('Invalid JSON body.', 400);
    }

    const patchResult = updateShipmentSchema.safeParse(payload);

    if (!patchResult.success) {
      return errorResponse(
        'Invalid shipment update payload.',
        400,
        getValidationDetails(patchResult.error)
      );
    }

    const shipmentDetail = await updateShipmentDetail({
      merchantId: auth.merchantId,
      shipmentId: id,
      input: patchResult.data,
    });

    if (!shipmentDetail) {
      return errorResponse('Shipment not found.', 404);
    }

    return successResponse({
      shipment: shipmentDetail,
      statusHistory: shipmentDetail.statusHistory,
      returnRecord: shipmentDetail.returnRecord,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to update shipment detail.', 500);
  }
}
