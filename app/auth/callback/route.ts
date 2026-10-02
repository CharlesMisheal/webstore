import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { safeNextPath, type SessionUser } from '@/lib/auth';
import {
  ADMIN_LAST_SEEN_COOKIE,
  ADMIN_STARTED_COOKIE,
  HttpError,
  authorizeAdminUser,
} from '@/lib/admin-guard';
import { addAuditLog, claimWelcomeEmail, getStoreSettings } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function withWelcome(path: string): string {
  if (path.startsWith('/admin')) return path;
  const joiner = path.includes('?') ? '&' : '?';
  return `${path}${joiner}welcome=1`;
}

/**
 * Google OAuth callback. Supabase redirects here with ?code=...
 * Session cookies MUST be copied onto the redirect response or the next page
 * has no session (sign-in looks successful, then the shopper is still logged out).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));
  const wantsAdmin = next.startsWith('/admin');
  const loginPath = wantsAdmin ? '/admin/login' : '/auth/login';
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`${loginPath}?error=${encodeURIComponent(reason)}&next=${encodeURIComponent(next)}`, url.origin));

  const oauthError = url.searchParams.get('error');
  if (oauthError) return fail(oauthError);
  if (!code) return fail('missing_code');

  const pendingCookies: CookieToSet[] = [];
  const cookieStore = cookies();
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options });
            try {
              cookieStore.set(name, value, options);
            } catch {
              /* ignore if the cookie store is read-only */
            }
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[auth] exchangeCodeForSession failed:', error.message);
    return fail('oauth');
  }

  const sessionUser = await sessionFromAuthUser(supabase);
  if (!sessionUser) return fail('no_user');

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, url.origin));
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options ?? {}));
    return res;
  };

  if (wantsAdmin) {
    try {
      await authorizeAdminUser(sessionUser);
    } catch (err) {
      const reason = err instanceof HttpError ? err.message : 'not authorized';
      await addAuditLog({
        actor_id: sessionUser.id,
        actor_email: sessionUser.email,
        action: 'admin.sign_in_denied',
        entity: 'admins',
        entity_id: sessionUser.email,
        after: { reason, continued_as: 'customer' },
        ip,
        user_agent: userAgent,
      });
      await maybeSendWelcome(sessionUser);
      return redirectTo('/account?welcome=1');
    }

    await addAuditLog({
      actor_id: sessionUser.id,
      actor_email: sessionUser.email,
      action: 'admin.sign_in',
      entity: 'admins',
      entity_id: sessionUser.email,
      ip,
      user_agent: userAgent,
    });

    const now = String(Date.now());
    const opts = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
    pendingCookies.push({ name: ADMIN_LAST_SEEN_COOKIE, value: now, options: opts });
    pendingCookies.push({ name: ADMIN_STARTED_COOKIE, value: now, options: opts });
    return redirectTo(next);
  }

  await maybeSendWelcome(sessionUser);
  return redirectTo(withWelcome(next));
}

async function sessionFromAuthUser(supabase: ReturnType<typeof createServerClient>): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: u.id,
    email: (u.email ?? '').toLowerCase(),
    full_name: String(meta.full_name ?? meta.name ?? u.email?.split('@')[0] ?? ''),
    avatar_url: typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined,
    email_verified: meta.email_verified === true || Boolean(u.email_confirmed_at),
  };
}

async function maybeSendWelcome(user: { id: string; full_name: string; email: string }) {
  try {
    if (await claimWelcomeEmail(user.id)) {
      const settings = await getStoreSettings();
      await sendWelcomeEmail({ customerName: user.full_name, customerEmail: user.email, settings });
    }
  } catch (err) {
    console.error('[auth] welcome email step failed (non-fatal):', err);
  }
}
