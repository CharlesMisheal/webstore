import React from 'react';
import Link from 'next/link';
import { Users, Search } from 'lucide-react';
import { getCustomers } from '@/lib/db';
import { formatNaira } from '@/lib/money';
import { AdminPageHeader, EmptyState, formatDate } from '@/components/admin/AdminPageHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Customers' };

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const all = await getCustomers();
  const q = searchParams.q?.trim().toLowerCase() ?? '';
  const customers = q ? all.filter((c) => [c.full_name, c.email, c.phone].some((v) => v?.toLowerCase().includes(q))) : all;

  const accounts = all.filter((c) => !c.is_guest).length;
  const guests = all.length - accounts;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="People"
        title="Customers"
        description={`${accounts} Google account(s) · ${guests} guest checkout(s) grouped by email`}
      />

      <form className="bg-white p-4 rounded-lg border border-stone" role="search">
        <div className="relative max-w-md">
          <label htmlFor="cust-search" className="sr-only">Search customers</label>
          <input id="cust-search" name="q" defaultValue={searchParams.q ?? ''} placeholder="Name, email or phone…" className="w-full pl-8 pr-3 py-2 bg-ivory-2 border border-stone rounded text-xs" />
          <Search className="w-3.5 h-3.5 text-text-3 absolute left-2.5 top-2.5" aria-hidden="true" />
        </div>
      </form>

      <div className="bg-white rounded-lg border border-stone overflow-hidden shadow-subtle">
        {customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" body="Customers appear after their first sign-in or order." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-ivory-2 text-navy font-semibold border-b border-stone">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Orders</th>
                  <th className="p-3 text-right">Spent</th>
                  <th className="p-3">Last order</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory-2/50">
                    <td className="p-3">
                      <p className="font-medium text-navy">{c.full_name || '—'}</p>
                      <p className="text-[11px] text-text-3">{c.email}</p>
                    </td>
                    <td className="p-3">{c.phone || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${c.is_guest ? 'bg-ivory-2 text-text-3' : 'bg-navy/10 text-navy'}`}>{c.is_guest ? 'Guest' : 'Account'}</span>
                    </td>
                    <td className="p-3 text-right">{c.order_count}</td>
                    <td className="p-3 text-right font-semibold text-navy">{formatNaira(c.total_spent_kobo)}</td>
                    <td className="p-3 text-text-3">{formatDate(c.last_order_at)}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/customers/${encodeURIComponent(c.id)}`} className="px-2.5 py-1 bg-ivory-2 hover:bg-stone text-navy rounded border border-stone font-medium inline-block text-[11px]">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
