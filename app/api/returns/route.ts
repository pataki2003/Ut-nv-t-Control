import { ZodError } from 'zod';

import { requireMerchant } from '@/lib/auth/require-merchant';
import { AuthRequiredError } from '@/lib/auth/require-user';
import { getReturnsList } from '@/lib/db/queries/returns';
import { returnsListQuerySchema } from '@/lib/validations/return';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

function getValidationDetails(error: ZodError) {
  return error.flatten();
}

export async function GET(request: Request) {
  try {
    const auth = await requireMerchant();
    const url = new URL(request.url);
    const queryResult = returnsListQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!queryResult.success) {
      return errorResponse(
        'Invalid returns query parameters.',
        400,
        getValidationDetails(queryResult.error)
      );
    }

    const returnsList = await getReturnsList(auth.merchantId, queryResult.data);

    return successResponse(returnsList);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to load returns.', 500);
  }
}
