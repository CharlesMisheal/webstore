import { cookies } from 'next/headers';
import { ADMIN_LAST_SEEN_COOKIE, errorResponse, requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/session — keep-alive for the 30-minute idle timer.
 * The admin shell calls this after user activity so a long form edit on one
 * page doesn't time out server-side while the owner is still typing.
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    cookies().set(ADMIN_LAST_SEEN_COOKIE, String(Date.now()), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return Response.json({ ok: true, email: admin.email });
  } catch (err) {
    return errorResponse(err);
  }
}
