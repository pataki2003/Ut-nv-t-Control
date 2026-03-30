import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getSupabaseProxyEnv() {
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

function isProtectedRoute(pathname: string) {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/shipments' ||
    pathname.startsWith('/shipments/') ||
    pathname === '/returns' ||
    pathname.startsWith('/returns/') ||
    pathname === '/import' ||
    pathname.startsWith('/import/')
  );
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const { supabaseAnonKey, supabaseUrl } = getSupabaseProxyEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, options, value }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims && isProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/shipments/:path*',
    '/returns/:path*',
    '/import/:path*',
  ],
};
