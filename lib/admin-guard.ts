/**
 * Admin authorization guard — developer-note.md §2.3.
 *
 * UI hiding is not security. Every /admin page, server action and /api/admin
 * route handler calls requireAdmin() before doing anything. The checks, in order:
 *   1. a valid Supabase session (JWT verified server-side)
 *   2. Google reported a verified email
 *   3. the email is on the ADMIN_EMAILS env allow-list
 *   4. the database agrees (is_admin(): profiles.role = 'owner' OR admins table)
 *   5. the admin session is not idle > 30 min and not older than 8 h
 */

import { cookies } from 'next/headers';
import { getCurrentUser, SessionUser } from './auth';
import { createServerSupabase } from './supabase/server';
import { isAdminEmailInDb } from './db';

export const ADMIN_IDLE_MS = 30 * 60 * 1000; // 30 minutes sliding
export const ADMIN_ABSOLUTE_MS = 8 * 60 * 60 * 1000; // 8 hours hard cap
export const ADMIN_LAST_SEEN_COOKIE = 'aplus_admin_last_seen';
export const ADMIN_STARTED_COOKIE = 'aplus_admin_started';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface AdminUser extends SessionUser {
  role: 'owner';
}

/** Parses ADMIN_EMAILS. No default: if the env var is missing, nobody is an admin. */
export function getAdminAllowList(env: string | undefined = process.env.ADMIN_EMAILS): string[] {
  return (env ?? '')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

export function isEmailAllowedAdmin(email?: string | null, env?: string): boolean {
  if (!email) return false;
  return getAdminAllowList(env).includes(email.trim().toLowerCase());
}

/** Pure session-age check, kept separate so it can be unit-tested. */
export function isAdminSessionExpired(
  lastSeenMs: number | null,
  startedMs: number | null,
  nowMs = Date.now()
): 'idle' | 'absolute' | null {
  if (startedMs !== null && nowMs - startedMs > ADMIN_ABSOLUTE_MS) return 'absolute';
  if (lastSeenMs !== null && nowMs - lastSeenMs > ADMIN_IDLE_MS) return 'idle';
  return null;
}

/** Asks Postgres: is the current session's user an admin? (is_admin() security-definer function). */
async function isAdminInDatabase(user: SessionUser): Promise<boolean> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.rpc('is_admin');
    if (!error && data === true) return true;
  } catch {
    // fall through to the service-role check
  }
  return isAdminEmailInDb(user.id, user.email);
}

/**
 * Checks that the signed-in user may administer the store. Does NOT check the
 * idle timer — use requireAdmin() for that. Used by the OAuth callback to decide
 * whether to let a Google account into /admin at all.
 */
export async function authorizeAdminUser(user: SessionUser | null): Promise<AdminUser> {
  if (!user) throw new HttpError(401, 'Sign in with Google to continue.');
  if (!user.email_verified) throw new HttpError(401, 'Your Google account email is not verified.');
  if (!isEmailAllowedAdmin(user.email)) throw new HttpError(403, `${user.email} is not on the owner allow-list.`);
  if (!(await isAdminInDatabase(user))) throw new HttpError(403, `${user.email} is not registered as an admin in the database.`);
  return { ...user, role: 'owner' };
}

function readCookieMs(name: string): number | null {
  const raw = cookies().get(name)?.value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * The guard. Throws HttpError(401|403|440) — route handlers convert that to a
 * JSON response, pages redirect to /admin/login.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  const admin = await authorizeAdminUser(user);

  const expired = isAdminSessionExpired(readCookieMs(ADMIN_LAST_SEEN_COOKIE), readCookieMs(ADMIN_STARTED_COOKIE));
  if (expired) throw new HttpError(440, expired === 'idle' ? 'Admin session timed out after 30 minutes of inactivity.' : 'Admin session expired. Please sign in again.');

  return admin;
}

/** Turns a thrown HttpError into a JSON Response for route handlers. */
export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ message: err.message }, { status: err.status });
  }
  console.error('[api] unexpected error:', err);
  return Response.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
}
