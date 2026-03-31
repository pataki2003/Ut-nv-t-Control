import { ZodError } from 'zod';

import { requireMerchant } from '@/lib/auth/require-merchant';
import { AuthRequiredError } from '@/lib/auth/require-user';
import {
  createManualShipment,
  getShipmentsList,
} from '@/lib/db/queries/shipments';
import {
  createShipmentSchema,
  shipmentListQuerySchema,
} from '@/lib/validations/shipment';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

function getValidationDetails(error: ZodError) {
  return error.flatten();
}

export async function GET(request: Request) {
  try {
    const auth = await requireMerchant();
    const url = new URL(request.url);
    const queryResult = shipmentListQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!queryResult.success) {
      return errorResponse(
        'Invalid shipment list query parameters.',
        400,
        getValidationDetails(queryResult.error)
      );
    }

    const shipments = await getShipmentsList(auth.merchantId, queryResult.data);

    return successResponse(shipments);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to load shipments.', 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMerchant();

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return errorResponse('Invalid JSON body.', 400);
    }

    const createResult = createShipmentSchema.safeParse(payload);

    if (!createResult.success) {
      return errorResponse(
        'Invalid shipment payload.',
        400,
        getValidationDetails(createResult.error)
      );
    }

    const shipment = await createManualShipment({
      merchantId: auth.merchantId,
      userId: auth.userId,
      input: createResult.data,
    });

    return successResponse({ shipment }, 'Shipment created successfully.', {
      status: 201,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to create shipment.', 500);
  }
}
