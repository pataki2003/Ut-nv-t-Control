import { AuthRequiredError, requireUser } from '@/lib/auth/require-user';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

function getBasicProfile(
  metadata: Record<string, unknown> | null | undefined
) {
  const fullName =
    typeof metadata?.full_name === 'string'
      ? metadata.full_name
      : typeof metadata?.name === 'string'
        ? metadata.name
        : null;

  const avatarUrl =
    typeof metadata?.avatar_url === 'string' ? metadata.avatar_url : null;

  if (!fullName && !avatarUrl) {
    return null;
  }

  return {
    fullName,
    avatarUrl,
  };
}

export async function GET() {
  try {
    const user = await requireUser();

    return successResponse({
      user: {
        id: user.id,
        email: user.email ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
      },
      profile: getBasicProfile(user.user_metadata),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse('Unable to load the current session.', 500);
  }
}
