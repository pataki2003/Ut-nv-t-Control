import { requireMerchant } from '@/lib/auth/require-merchant';
import { AuthRequiredError } from '@/lib/auth/require-user';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

export async function GET() {
  try {
    const auth = await requireMerchant();

    return successResponse({
      user: {
        id: auth.userId,
        email: auth.email,
        merchantId: auth.merchantId,
        createdAt: auth.user.created_at,
        lastSignInAt: auth.user.last_sign_in_at ?? null,
      },
      profile: auth.profile,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to load the current session.', 500);
  }
}
