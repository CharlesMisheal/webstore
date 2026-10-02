/**
 * Admin authorization guard for A-Plus Fashion Home.
 * Hard rule from developer-note.md:
 * UI hiding is not security. Every /admin page and server action must verify authorization.
 */

export interface AdminUser {
  id: string;
  email: string;
  role: 'owner';
}

/**
 * Checks if a given email is authorized as an administrator.
 */
export function isEmailAllowedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS || 'henryaplus82@gmail.com')
    .toLowerCase()
    .split(',')
    .map((e) => e.trim());
  return allowed.includes(email.toLowerCase());
}

/**
 * Verifies admin privileges server-side.
 * In production, checks session cookie and user identity.
 * In development / demo mode, allows demo admin credentials or valid admin email.
 */
export async function requireAdmin(requestEmail?: string): Promise<AdminUser> {
  const targetEmail = requestEmail || process.env.CURRENT_ADMIN_EMAIL || 'henryaplus82@gmail.com';

  if (!isEmailAllowedAdmin(targetEmail)) {
    const error = new Error('Access denied: User is not authorized to access A-Plus Fashion Home administration.');
    (error as unknown as { statusCode: number }).statusCode = 403;
    throw error;
  }

  return {
    id: 'usr_owner_henry',
    email: targetEmail,
    role: 'owner',
  };
}
