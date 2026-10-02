import { StoreSettings } from './types';

/**
 * Fallback store settings, used only when a store_settings key is missing in
 * the database (e.g. before the seed has been run). The owner edits the real
 * values in /admin/content. Pure data: safe to import from client components.
 */
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  homepage_banners: [
    {
      id: 'banner_default',
      headline: 'Wear Class, Live Bold.',
      sub: 'Tailored suits, tuxedos and blazers made to fit you — ready to wear or made to measure in Ijebu-Ode.',
      cta_label: 'Shop the collection',
      cta_href: '/shop',
      secondary_label: 'Request a quote',
      secondary_href: '/quote',
      image_path: '/images/feature-suit-ivory.jpg',
      visible: true,
      sort_order: 1,
    },
  ],
  about: {
    headline: 'Crafting Sartorial Distinction in Ijebu-Ode',
    story_html:
      '<p>Founded by master tailor Henry Abraham, A-Plus Fashion Home combines traditional British tailoring finesse with vibrant Nigerian flair.</p>',
    years: 5,
    product_count: '100+',
    happy_clients: '1,200+',
  },
  contact: {
    whatsapp: '+2347071374515',
    phone: '+2347071374515',
    alt_phone: '',
    email: 'henryaplus82@gmail.com',
    address: '2 Jagunmolu Street, Ondo Road, Ijebu-Ode, Ogun State, Nigeria',
    hours: 'Mon–Sat 9:00 AM – 6:00 PM',
  },
  social: {
    instagram: 'https://instagram.com/aplusfashionhome',
    facebook: 'https://facebook.com/aplusfashionhome',
    tiktok: 'https://tiktok.com/@aplusfashionhome',
    whatsapp_channel: 'https://wa.me/2347071374515',
  },
  fx_rates: { USD: 1550, GBP: 1980 },
  delivery_rules: [
    { id: 'del_lagos_ogun', label: 'Lagos & Ogun Express Courier', fee_kobo: 450000, eta: '1–3 business days' },
    { id: 'del_nationwide', label: 'Nationwide Nigeria (Waybill / Courier)', fee_kobo: 750000, eta: '3–5 business days' },
    { id: 'del_pickup', label: 'Shop Pick-up (Ijebu-Ode)', fee_kobo: 0, eta: 'Ready within 24 hours' },
    { id: 'del_intl', label: 'International Express (DHL Worldwide)', fee_kobo: 4500000, eta: '5–8 business days' },
  ],
};
