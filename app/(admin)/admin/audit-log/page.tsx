import React from 'react';
import { ScrollText } from 'lucide-react';
import { getAuditLogs } from '@/lib/db';
import { AdminPageHeader, EmptyState, formatDateTime } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit log' };

const ENTITY_LINK: Record<string, (id: string) => string | null> = {
  orders: (id) => `/admin/orders/${id}`,
  products: (id) => `/admin/products/${id}`,
  payments: (id) => `/admin/payments?q=${encodeURIComponent(id)}`,
  quotes: () => '/admin/requests?tab=quotes&show=all',
  bookings: () => '/admin/requests?tab=bookings&show=all',
  contact_messages: () => '/admin/requests?tab=messages&show=all',
  reviews: () => '/admin/reviews?status=all',
  store_settings: () => '/admin/content',
  categories: () => '/admin/categories',
};

function summarize(obj: Record<string, unknown> | null | undefined): string {
  if (!obj) return '';
  const parts = Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
    .slice(0, 4)
    .map(([k, v]) => `${k}=${String(v).slice(0, 40)}`);
  return parts.join(' · ');
}

export default async function AdminAuditLogPage({ searchParams }: { searchParams: { entity?: string; actor?: string } }) {
  const logs = await getAuditLogs(500);
  const entities = Array.from(new Set(logs.map((l) => l.entity))).sort();
  const actors = Array.from(new Set(logs.map((l) => l.actor_email))).sort();
  const filtered = logs.filter((l) => (!searchParams.entity || l.entity === searchParams.entity) && (!searchParams.actor || l.actor_email === searchParams.actor));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Security"
        title="Audit log"
        description="Every admin change and payment event, append-only. Admin sign-ins and denied attempts are recorded too."
      />

      <form className="bg-white p-4 rounded-lg border border-stone flex flex-wrap items-end gap-3 text-xs">
        <div>
          <label htmlFor="entity" className="block text-text-3 mb-1">Entity</label>
          <select id="entity" name="entity" defaultValue={searchParams.entity ?? ''} className="px-2 py-2 bg-ivory-2 border border-stone rounded min-w-[160px]">
            <option value="">All</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="actor" className="block text-text-3 mb-1">Actor</label>
          <select id="actor" name="actor" defaultValue={searchParams.actor ?? ''} className="px-2 py-2 bg-ivory-2 border border-stone rounded min-w-[200px]">
            <option value="">Everyone</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button type="submit" className="px-3 py-2 bg-navy text-ivory rounded font-medium">Filter</button>
        <span className="text-text-3 ml-auto">{filtered.length} of {logs.length} entries (latest 500)</span>
      </form>

      <div className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
        {filtered.length === 0 ? (
          <EmptyState icon={ScrollText} title="No entries" body="Admin actions will be recorded here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                  <th className="p-3">When</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Change</th>
                  <th className="p-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {filtered.map((l) => {
                  const href = l.entity_id ? ENTITY_LINK[l.entity]?.(l.entity_id) ?? null : null;
                  return (
                    <tr key={l.id} className="hover:bg-ivory-2/50 align-top">
                      <td className="p-3 whitespace-nowrap text-text-3"><time dateTime={l.created_at}>{formatDateTime(l.created_at)}</time></td>
                      <td className="p-3 text-navy">{l.actor_email}</td>
                      <td className="p-3"><code className="px-1.5 py-0.5 bg-ivory-2 rounded text-[11px]">{l.action}</code></td>
                      <td className="p-3">
                        <span className="text-text-2">{l.entity}</span>
                        {l.entity_id && (
                          <span className="block font-mono text-[10px] text-text-3 truncate max-w-[180px]">
                            {href ? <a href={href} className="hover:underline">{l.entity_id}</a> : l.entity_id}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-text-2 max-w-md">
                        {l.before && <p className="text-text-3"><span className="font-semibold">before:</span> {summarize(l.before)}</p>}
                        {l.after && <p><span className="font-semibold text-navy">after:</span> {summarize(l.after)}</p>}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-text-3">{l.ip || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
