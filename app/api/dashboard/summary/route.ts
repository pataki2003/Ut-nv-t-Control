import { AuthRequiredError } from '@/lib/auth/require-user';
import { requireMerchant } from '@/lib/auth/require-merchant';
import { getDashboardSummary } from '@/lib/db/queries/dashboard';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

export async function GET() {
  try {
    const auth = await requireMerchant();
    const summary = await getDashboardSummary(auth.merchantId);

    return successResponse(summary);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to load dashboard summary.', 500);
  }
}
