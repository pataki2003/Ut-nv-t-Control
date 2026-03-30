import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseServerEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseAnonKey, supabaseUrl } = getSupabaseServerEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Proxy handles refresh.
        }
      },
    },
  });
}
