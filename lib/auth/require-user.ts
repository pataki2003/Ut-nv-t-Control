import 'server-only';

import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';

export class AuthRequiredError extends Error {
  status: number;

  constructor(message = 'Authentication required.', status = 401) {
    super(message);
    this.name = 'AuthRequiredError';
    this.status = status;
  }
}

export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthRequiredError();
  }

  return user;
}
