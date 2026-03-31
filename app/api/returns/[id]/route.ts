import { ZodError } from 'zod';

import { requireMerchant } from '@/lib/auth/require-merchant';
import { AuthRequiredError } from '@/lib/auth/require-user';
import { getReturnDetail, updateReturnDetail } from '@/lib/db/queries/returns';
import { updateReturnSchema } from '@/lib/validations/return';
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
    const returnRecord = await getReturnDetail(auth.merchantId, id);

    if (!returnRecord) {
      return errorResponse('Return not found.', 404);
    }

    return successResponse({ returnRecord });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to load return detail.', 500);
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

    const patchResult = updateReturnSchema.safeParse(payload);

    if (!patchResult.success) {
      return errorResponse(
        'Invalid return update payload.',
        400,
        getValidationDetails(patchResult.error)
      );
    }

    const returnRecord = await updateReturnDetail({
      merchantId: auth.merchantId,
      returnId: id,
      input: patchResult.data,
    });

    if (!returnRecord) {
      return errorResponse('Return not found.', 404);
    }

    return successResponse({ returnRecord });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to update return.', 500);
  }
}
