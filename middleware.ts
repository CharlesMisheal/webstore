import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const ADMIN_IDLE_MS = 30 * 60 * 1000;
const ADMIN_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
const ADMIN_LAST_SEEN_COOKIE = 'aplus_admin_last_seen';
const ADMIN_STARTED_COOKIE = 'aplus_admin_started';

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/**
 * 1. Refreshes the Supabase session cookie on every request (required by @supabase/ssr).
 * 2. UX-only redirects: unauthenticated /admin/* -> /admin/login, /account -> /auth/login.
 *    The real gate is requireAdmin() inside every admin page/action/route.
 * 3. Slides the 30-minute admin idle timer on each admin navigation.
 */
export async function middleware(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  const redirectWithCookies = (to: string) => {
    const url = request.nextUrl.clone();
    const [path, query] = to.split('?');
    url.pathname = path;
    url.search = query ? `?${query}` : '';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value, c));
    return redirect;
  };

  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login';

  if (isAdminArea) {
    if (!user) {
      return redirectWithCookies(`/admin/login?next=${encodeURIComponent(pathname + search)}`);
    }
    const now = Date.now();
    const lastSeen = Number(request.cookies.get(ADMIN_LAST_SEEN_COOKIE)?.value ?? NaN);
    const started = Number(request.cookies.get(ADMIN_STARTED_COOKIE)?.value ?? NaN);

    const idle = Number.isFinite(lastSeen) && now - lastSeen > ADMIN_IDLE_MS;
    const tooOld = Number.isFinite(started) && now - started > ADMIN_ABSOLUTE_MS;
    if (idle || tooOld) {
      const redirect = redirectWithCookies(`/admin/login?timeout=${idle ? 'idle' : 'expired'}`);
      redirect.cookies.delete(ADMIN_LAST_SEEN_COOKIE);
      redirect.cookies.delete(ADMIN_STARTED_COOKIE);
      return redirect;
    }

    response.cookies.set(ADMIN_LAST_SEEN_COOKIE, String(now), cookieOpts);
    if (!Number.isFinite(started)) response.cookies.set(ADMIN_STARTED_COOKIE, String(now), cookieOpts);
  }

  if (pathname.startsWith('/account') && !user) {
    return redirectWithCookies(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and the Paystack webhook (machine-to-machine, no cookies).
    '/((?!_next/static|_next/image|favicon.ico|images/|api/paystack/webhook).*)',
  ],
};
