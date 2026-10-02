import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentUser, safeNextPath } from '@/lib/auth';
import {
  ADMIN_LAST_SEEN_COOKIE,
  ADMIN_STARTED_COOKIE,
  HttpError,
  authorizeAdminUser,
} from '@/lib/admin-guard';
import { addAuditLog, claimWelcomeEmail, getStoreSettings } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Google OAuth callback (developer-note.md §3).
 * Supabase redirects here with ?code=...; we exchange it for a cookie session.
 *  - Customer sign-in: send the welcome email once, then go to `next`.
 *  - Admin sign-in (`next` under /admin): verify the allow-list + is_admin().
 *    Non-owners are signed out and shown the "Access denied" state.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));
  const wantsAdmin = next.startsWith('/admin');
  const loginPath = wantsAdmin ? '/admin/login' : '/auth/login';

  if (!code) {
    return NextResponse.redirect(new URL(`${loginPath}?error=missing_code`, url.origin));
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[auth] exchangeCodeForSession failed:', error.message);
    return NextResponse.redirect(new URL(`${loginPath}?error=oauth`, url.origin));
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL(`${loginPath}?error=no_user`, url.origin));
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  if (wantsAdmin) {
    try {
      await authorizeAdminUser(user);
    } catch (err) {
      const reason = err instanceof HttpError ? err.message : 'not authorized';
      await addAuditLog({
        actor_id: user.id,
        actor_email: user.email,
        action: 'admin.sign_in_denied',
        entity: 'admins',
        entity_id: user.email,
        after: { reason },
        ip,
        user_agent: userAgent,
      });
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(`/admin/login?denied=${encodeURIComponent(user.email)}`, url.origin));
    }

    await addAuditLog({
      actor_id: user.id,
      actor_email: user.email,
      action: 'admin.sign_in',
      entity: 'admins',
      entity_id: user.email,
      ip,
      user_agent: userAgent,
    });

    const now = String(Date.now());
    const opts = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
    cookies().set(ADMIN_LAST_SEEN_COOKIE, now, opts);
    cookies().set(ADMIN_STARTED_COOKIE, now, opts);
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // Customer: welcome email exactly once per profile (claim is atomic in Postgres).
  try {
    if (await claimWelcomeEmail(user.id)) {
      const settings = await getStoreSettings();
      await sendWelcomeEmail({ customerName: user.full_name, customerEmail: user.email, settings });
    }
  } catch (err) {
    console.error('[auth] welcome email step failed (non-fatal):', err);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
