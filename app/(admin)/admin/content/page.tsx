import React from 'react';
import { getStoreSettingRows } from '@/lib/db';
import type { StoreSettingKey } from '@/lib/types';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { SettingEditor } from './SettingEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Store content' };

const SECTIONS: Array<{ key: StoreSettingKey; title: string; help: string }> = [
  { key: 'homepage_banners', title: 'Homepage banners', help: 'Hero slides. Toggle visibility, reorder with sort_order, and point image_path at a file under /public/images or a Supabase Storage URL.' },
  { key: 'about', title: 'About the brand', help: 'Headline, story (simple HTML allowed) and the three stats shown on the About page.' },
  { key: 'contact', title: 'Contact details', help: 'WhatsApp and phone in international format (+234…). These drive every WhatsApp button, the footer and the emails.' },
  { key: 'social', title: 'Social links', help: 'Full URLs. Leave blank to hide an icon.' },
  { key: 'fx_rates', title: 'Display exchange rates', help: 'NGN per 1 USD / GBP. Only affects the optional price display — all charges are in Naira.' },
  { key: 'delivery_rules', title: 'Delivery options & fees', help: 'Fees are in kobo (₦1 = 100 kobo). The id is referenced by checkout; changing an id only affects new orders.' },
];

export default async function AdminContentPage() {
  const rows = await getStoreSettingRows();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Content"
        title="Store settings"
        description="Save a draft to review, then Publish to push it live. Published changes revalidate the whole storefront immediately."
      />
      <div className="space-y-6">
        {SECTIONS.map((s) => {
          const row = rows.find((r) => r.key === s.key);
          if (!row) return null;
          return <SettingEditor key={s.key} settingKey={s.key} title={s.title} help={s.help} row={row} />;
        })}
      </div>
    </div>
  );
}
