import { createServerSupabase, isSupabaseConfigured } from './supabase/server';

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  email_verified: boolean;
}

/**
 * The signed-in visitor for the current request, validated against Supabase
 * (auth.getUser() verifies the JWT server-side; never trust getSession()).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const u = data.user;
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    return {
      id: u.id,
      email: (u.email ?? '').toLowerCase(),
      full_name: String(meta.full_name ?? meta.name ?? u.email?.split('@')[0] ?? ''),
      avatar_url: typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined,
      // Google reports email_verified in user_metadata; Supabase also sets email_confirmed_at.
      email_verified: meta.email_verified === true || Boolean(u.email_confirmed_at),
    };
  } catch {
    return null;
  }
}

/** Only allow same-origin relative redirects (prevents open redirects after OAuth). */
export function safeNextPath(next: string | null | undefined, fallback = '/account'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) return fallback;
  return next;
}
