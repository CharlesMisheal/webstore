import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth';
import { ADMIN_LAST_SEEN_COOKIE, ADMIN_STARTED_COOKIE } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** POST /auth/signout — clears the Supabase session and admin timers. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const next = safeNextPath(form?.get('next')?.toString(), '/');

  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  cookies().delete(ADMIN_LAST_SEEN_COOKIE);
  cookies().delete(ADMIN_STARTED_COOKIE);

  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
