import 'server-only';

import type { User } from '@supabase/supabase-js';

import { AuthRequiredError } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';

type MerchantProfileRecord = {
  merchant_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type MerchantAuthContext = {
  user: User;
  userId: string;
  merchantId: string;
  email: string | null;
  profile: {
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export async function requireMerchant(): Promise<MerchantAuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthRequiredError();
  }

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('merchant_id, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const profile = data as MerchantProfileRecord | null;

  if (!profile?.merchant_id) {
    throw new AuthRequiredError(
      'Merchant access is not configured for this account.',
      403
    );
  }

  return {
    user,
    userId: user.id,
    merchantId: profile.merchant_id,
    email: user.email ?? null,
    profile: {
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
    },
  };
}
