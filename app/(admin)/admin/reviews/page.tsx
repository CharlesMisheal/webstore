import React from 'react';
import Link from 'next/link';
import { Star, MessageSquare } from 'lucide-react';
import { getReviews } from '@/lib/db';
import type { ReviewStatus } from '@/lib/types';
import { AdminPageHeader, EmptyState, formatDateTime } from '@/components/admin/AdminPageHeader';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { moderateReviewAction } from '@/app/(admin)/admin/actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reviews' };

const TABS: Array<{ id: ReviewStatus | 'all'; label: string }> = [
  { id: 'under_review', label: 'Awaiting moderation' },
  { id: 'approved', label: 'Published' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'all', label: 'All' },
];

export default async function AdminReviewsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = (TABS.find((t) => t.id === searchParams.status)?.id ?? 'under_review') as ReviewStatus | 'all';
  const all = await getReviews(undefined, false);
  const reviews = status === 'all' ? all : all.filter((r) => r.status === status);
  const pending = all.filter((r) => r.status === 'under_review').length;

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Moderation" title="Customer reviews" description="Reviews are hidden from the store until you publish them." />

      <div className="flex flex-wrap gap-2 text-xs">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/reviews?status=${t.id}`} aria-current={status === t.id ? 'page' : undefined} className={`px-3 py-2 rounded font-medium ${status === t.id ? 'bg-navy text-ivory' : 'bg-white border border-stone text-text-2 hover:bg-ivory-2'}`}>
            {t.label}{t.id === 'under_review' && pending > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gold text-navy text-[10px] font-bold">{pending}</span>}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone"><EmptyState icon={MessageSquare} title="Nothing here" body="New reviews submitted on product pages will appear under Awaiting moderation." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <article key={r.id} className="bg-white rounded-lg border border-stone p-4 space-y-3 text-xs">
              <header className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-1" aria-label={`${r.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-gold fill-gold' : 'text-stone'}`} aria-hidden="true" />)}
                  </div>
                  <p className="font-semibold text-navy mt-1">{r.author_name}{r.author_location && <span className="text-text-3 font-normal"> · {r.author_location}</span>}</p>
                  <p className="text-text-3">{formatDateTime(r.created_at)}{r.product_name && <> · on <strong className="text-text-2">{r.product_name}</strong></>}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : r.status === 'hidden' ? 'bg-stone text-text-3' : 'bg-amber-100 text-amber-800'}`}>{r.status.replace('_', ' ')}</span>
              </header>
              <p className="text-text-2 whitespace-pre-line">{r.body}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {r.status !== 'approved' && (
                  <ActionForm action={moderateReviewAction} hideResult>
                    <input type="hidden" name="review_id" value={r.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <SubmitButton className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded">Publish</SubmitButton>
                  </ActionForm>
                )}
                {r.status !== 'hidden' && (
                  <ActionForm action={moderateReviewAction} hideResult>
                    <input type="hidden" name="review_id" value={r.id} />
                    <input type="hidden" name="decision" value="hidden" />
                    <SubmitButton className="px-3 py-2 border border-stone text-text-2 hover:bg-ivory-2 rounded">Hide</SubmitButton>
                  </ActionForm>
                )}
                <ActionForm action={moderateReviewAction} hideResult confirmMessage="Permanently delete this review?">
                  <input type="hidden" name="review_id" value={r.id} />
                  <input type="hidden" name="decision" value="delete" />
                  <SubmitButton className="px-3 py-2 text-aplus-error hover:bg-red-50 rounded">Delete</SubmitButton>
                </ActionForm>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
