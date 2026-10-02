import React from 'react';
import { redirect } from 'next/navigation';
import { HttpError, requireAdmin } from '@/lib/admin-guard';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

/**
 * Server-side gate for every /admin/* page (except /admin/login, which lives
 * outside this route group). requireAdmin() re-runs on every navigation, so
 * even if the middleware were bypassed nothing here renders for non-owners.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let adminEmail: string;
  try {
    const admin = await requireAdmin();
    adminEmail = admin.email;
  } catch (err) {
    if (err instanceof HttpError && err.status === 440) redirect('/admin/login?timeout=idle');
    if (err instanceof HttpError && err.status === 403) redirect('/admin/login?denied=1');
    redirect('/admin/login');
  }

  return <AdminShell adminEmail={adminEmail}>{children}</AdminShell>;
}
