import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Trim: values pasted into hosting dashboards often carry a trailing space/newline,
// which makes `new URL()` inside the Supabase client throw and 500s every request.
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/^["']|["']$/g, '');
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim().replace(/^["']|["']$/g, '');

const ADMIN_IDLE_MS = 30 * 60 * 1000;
const ADMIN_ABSOLUTE_MS = 8 * 60 * 60 * 1000;
const ADMIN_LAST_SEEN_COOKIE = 'aplus_admin_last_seen';
const ADMIN_STARTED_COOKIE = 'aplus_admin_started';

// Android app (Capacitor) marker. Capacitor appends this token to the WebView's
// default User-Agent, so every request the app makes carries it and we can tell an
// app install from a normal browser visit without any handshake or cookie.
const MOBILE_APP_UA_TOKEN = 'APlusFashionApp';
/** Flip to true to let the Android app reach /admin as well as the storefront. */
const MOBILE_APP_ADMIN_ALLOWED = false;

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/**
 * 1. Refreshes the Supabase session cookie on every request (required by @supabase/ssr).
 * 2. UX-only redirects: unauthenticated /admin/* -> /admin/login, /account, /cart and /checkout -> /auth/login.
 *    The real gate is requireAdmin() inside every admin page/action/route.
 * 3. Slides the 30-minute admin idle timer on each admin navigation.
 *
 * Fails open: if anything here throws (bad env value, Supabase unreachable), the
 * request proceeds without a session refresh. Security does not depend on this
 * file — requireAdmin() runs in every admin layout/action/route.
 */
export async function middleware(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.next();
  try {
    return await handle(request);
  } catch (err) {
    console.error('[middleware] failed open:', err instanceof Error ? err.message : err);
    const { pathname } = request.nextUrl;
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '?error=session';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
}

async function handle(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The app ships the storefront only; /admin stays web-only. This narrows the
  // surface, it is not the security boundary (a User-Agent is trivially spoofed) -
  // requireAdmin() still gates every admin page, action and route.
  if (
    !MOBILE_APP_ADMIN_ALLOWED &&
    pathname.startsWith('/admin') &&
    (request.headers.get('user-agent') ?? '').includes(MOBILE_APP_UA_TOKEN)
  ) {
    return new NextResponse('Not found', { status: 404 });
  }

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

  if ((pathname.startsWith('/account') || pathname.startsWith('/checkout') || pathname === '/cart') && !user) {
    return redirectWithCookies(`/auth/login?next=${encodeURIComponent(pathname + search)}`);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and the Paystack webhook (machine-to-machine, no cookies).
    '/((?!_next/static|_next/image|favicon.ico|images/|api/paystack/webhook).*)',
  ],
};
