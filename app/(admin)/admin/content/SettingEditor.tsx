'use client';

import React, { useMemo, useState } from 'react';
import { useFormState } from 'react-dom';
import { Eye, Pencil, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import type { HomepageBanner, DeliveryRule, StoreSettingKey, StoreSettingRow, StoreSettings } from '@/lib/types';
import { saveSettingAction, type ActionResult } from '@/app/(admin)/admin/actions';
import { SubmitButton } from '@/components/admin/ActionForm';
import { formatNaira } from '@/lib/money';

interface Props {
  settingKey: StoreSettingKey;
  title: string;
  help: string;
  row: StoreSettingRow;
}

const inputCls = 'w-full px-3 py-2 bg-ivory-2 border border-stone rounded text-xs min-h-[40px] focus:ring-1 focus:ring-navy';
const labelCls = 'block text-[11px] font-medium text-navy mb-1';

/**
 * One settings section. Shows the published value, lets the owner edit a copy
 * (structured fields, with a raw-JSON fallback), and save as draft or publish.
 */
export function SettingEditor({ settingKey, title, help, row }: Props) {
  const initial = (row.draft_value ?? row.value) as unknown;
  const [value, setValue] = useState<unknown>(initial);
  const [rawMode, setRawMode] = useState(false);
  const [raw, setRaw] = useState(() => JSON.stringify(initial, null, 2));
  const [state, formAction] = useFormState<ActionResult, FormData>(saveSettingAction, { ok: false, message: '' });

  const valueJson = useMemo(() => {
    if (rawMode) return raw;
    return JSON.stringify(value);
  }, [rawMode, raw, value]);

  const hasDraft = row.draft_value != null;

  return (
    <section className="bg-white rounded-lg border border-stone shadow-subtle overflow-hidden" aria-labelledby={`h-${settingKey}`}>
      <header className="p-4 border-b border-stone flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`h-${settingKey}`} className="font-serif text-lg font-semibold text-navy">{title}</h2>
          <p className="text-[11px] text-text-3 mt-0.5 max-w-2xl">{help}</p>
          <p className="text-[11px] text-text-3 mt-1">
            Published {row.updated_at ? new Date(row.updated_at).toLocaleString('en-NG') : '—'}{row.updated_by && <> by {row.updated_by}</>}
            {hasDraft && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold uppercase text-[10px]">Unpublished draft</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (rawMode) {
              try {
                setValue(JSON.parse(raw));
                setRawMode(false);
              } catch {
                alert('Fix the JSON first — it is not valid.');
              }
            } else {
              setRaw(JSON.stringify(value, null, 2));
              setRawMode(true);
            }
          }}
          className="text-[11px] px-2.5 py-1.5 border border-stone rounded text-text-2 hover:bg-ivory-2 inline-flex items-center space-x-1"
        >
          {rawMode ? <Eye className="w-3 h-3" aria-hidden="true" /> : <Pencil className="w-3 h-3" aria-hidden="true" />}
          <span>{rawMode ? 'Form view' : 'Edit as JSON'}</span>
        </button>
      </header>

      <form action={formAction} className="p-4 space-y-4">
        <input type="hidden" name="key" value={settingKey} />
        <input type="hidden" name="value_json" value={valueJson} />
        {/* Default intent; the Publish / Discard buttons override it (submitter value comes later in FormData). */}
        <input type="hidden" name="intent" value="draft" />

        {rawMode ? (
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={14} spellCheck={false} className="w-full font-mono text-[11px] p-3 bg-navy text-ivory rounded border border-stone" aria-label={`${title} JSON`} />
        ) : (
          <Fields settingKey={settingKey} value={value} onChange={setValue} />
        )}

        {state.message && (
          <p role={state.ok ? 'status' : 'alert'} className={`text-[11px] px-2.5 py-1.5 rounded border ${state.ok ? 'bg-emerald-50 text-aplus-success border-emerald-200' : 'bg-red-50 text-aplus-error border-red-200'}`}>
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone">
          <SubmitButton pendingLabel="Saving…" className="px-3 py-2 border border-navy text-navy hover:bg-ivory-2 text-xs font-semibold rounded">
            Save draft
          </SubmitButton>
          <button type="submit" name="intent" value="publish" className="px-3 py-2 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded" onClick={(e) => { if (!window.confirm(`Publish ${title.toLowerCase()} to the live store?`)) e.preventDefault(); }}>
            Publish to store
          </button>
          {hasDraft && (
            <button type="submit" name="intent" value="discard" className="px-3 py-2 text-aplus-error hover:bg-red-50 text-xs rounded ml-auto" onClick={(e) => { if (!window.confirm('Discard the unpublished draft?')) e.preventDefault(); }}>
              Discard draft
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function Fields({ settingKey, value, onChange }: { settingKey: StoreSettingKey; value: unknown; onChange: (v: unknown) => void }) {
  switch (settingKey) {
    case 'contact':
      return <ContactFields value={value as StoreSettings['contact']} onChange={onChange} />;
    case 'social':
      return <SocialFields value={value as StoreSettings['social']} onChange={onChange} />;
    case 'about':
      return <AboutFields value={value as StoreSettings['about']} onChange={onChange} />;
    case 'fx_rates':
      return <FxFields value={value as StoreSettings['fx_rates']} onChange={onChange} />;
    case 'delivery_rules':
      return <DeliveryFields value={value as DeliveryRule[]} onChange={onChange} />;
    case 'homepage_banners':
      return <BannerFields value={value as HomepageBanner[]} onChange={onChange} />;
    default:
      return null;
  }
}

function Text({ id, label, value, onChange, type = 'text', hint }: { id: string; label: string; value: string | number; onChange: (v: string) => void; type?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      {hint && <p className="text-[10px] text-text-3 mt-0.5">{hint}</p>}
    </div>
  );
}

function ContactFields({ value, onChange }: { value: StoreSettings['contact']; onChange: (v: unknown) => void }) {
  const set = (k: keyof StoreSettings['contact']) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Text id="c-wa" label="WhatsApp number" value={value.whatsapp} onChange={set('whatsapp')} hint="International format, e.g. +2347071374515" />
        <Text id="c-phone" label="Phone" value={value.phone} onChange={set('phone')} />
        <Text id="c-alt" label="Alternative phone (optional)" value={value.alt_phone ?? ''} onChange={set('alt_phone')} />
        <Text id="c-email" label="Email" type="email" value={value.email} onChange={set('email')} />
        <Text id="c-addr" label="Shop address" value={value.address} onChange={set('address')} />
        <Text id="c-hours" label="Opening hours" value={value.hours} onChange={set('hours')} />
      </div>
    </>
  );
}

function SocialFields({ value, onChange }: { value: StoreSettings['social']; onChange: (v: unknown) => void }) {
  const set = (k: keyof StoreSettings['social']) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Text id="s-ig" label="Instagram URL" type="url" value={value.instagram} onChange={set('instagram')} />
        <Text id="s-fb" label="Facebook URL" type="url" value={value.facebook} onChange={set('facebook')} />
        <Text id="s-tt" label="TikTok URL" type="url" value={value.tiktok} onChange={set('tiktok')} />
        <Text id="s-wa" label="WhatsApp channel URL" type="url" value={value.whatsapp_channel} onChange={set('whatsapp_channel')} />
      </div>
    </>
  );
}

function AboutFields({ value, onChange }: { value: StoreSettings['about']; onChange: (v: unknown) => void }) {
  return (
    <>
      <div className="space-y-3">
        <Text id="a-head" label="Headline" value={value.headline} onChange={(v) => onChange({ ...value, headline: v })} />
        <div>
          <label htmlFor="a-story" className={labelCls}>Brand story (HTML: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;)</label>
          <textarea id="a-story" rows={8} value={value.story_html} onChange={(e) => onChange({ ...value, story_html: e.target.value })} className={`${inputCls} font-mono text-[11px]`} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Text id="a-years" label="Years in business" type="number" value={value.years} onChange={(v) => onChange({ ...value, years: Number(v) || 0 })} />
          <Text id="a-prod" label="Products stat" value={value.product_count} onChange={(v) => onChange({ ...value, product_count: v })} hint="e.g. 500+" />
          <Text id="a-clients" label="Happy clients stat" value={value.happy_clients} onChange={(v) => onChange({ ...value, happy_clients: v })} hint="e.g. 2,000+" />
        </div>
      </div>
    </>
  );
}

function FxFields({ value, onChange }: { value: StoreSettings['fx_rates']; onChange: (v: unknown) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <Text id="fx-usd" label="₦ per 1 USD" type="number" value={value.USD} onChange={(v) => onChange({ ...value, USD: Number(v) || 0 })} />
        <Text id="fx-gbp" label="₦ per 1 GBP" type="number" value={value.GBP} onChange={(v) => onChange({ ...value, GBP: Number(v) || 0 })} />
      </div>
    </>
  );
}

function DeliveryFields({ value, onChange }: { value: DeliveryRule[]; onChange: (v: unknown) => void }) {
  const update = (i: number, patch: Partial<DeliveryRule>) => onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { id: `option_${value.length + 1}`, label: 'New option', fee_kobo: 0, eta: '3–5 business days' }]);
  return (
    <>
      <div className="space-y-3">
        {value.map((r, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 bg-ivory-2/50 rounded border border-stone">
            <div className="sm:col-span-2"><Text id={`d-id-${i}`} label="id" value={r.id} onChange={(v) => update(i, { id: v })} /></div>
            <div className="sm:col-span-4"><Text id={`d-label-${i}`} label="Label" value={r.label} onChange={(v) => update(i, { label: v })} /></div>
            <div className="sm:col-span-2"><Text id={`d-fee-${i}`} label="Fee (kobo)" type="number" value={r.fee_kobo} onChange={(v) => update(i, { fee_kobo: Math.max(0, Math.round(Number(v) || 0)) })} hint={formatNaira(r.fee_kobo)} /></div>
            <div className="sm:col-span-3"><Text id={`d-eta-${i}`} label="ETA" value={r.eta} onChange={(v) => update(i, { eta: v })} /></div>
            <div className="sm:col-span-1 flex justify-end">
              <button type="button" onClick={() => remove(i)} aria-label={`Remove ${r.label}`} className="p-2 text-aplus-error hover:bg-red-50 rounded" disabled={value.length <= 1}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={add} className="text-xs inline-flex items-center space-x-1 px-3 py-2 border border-dashed border-stone rounded text-text-2 hover:bg-ivory-2"><Plus className="w-3.5 h-3.5" aria-hidden="true" /><span>Add delivery option</span></button>
      </div>
    </>
  );
}

function BannerFields({ value, onChange }: { value: HomepageBanner[]; onChange: (v: unknown) => void }) {
  const sorted = [...value].sort((a, b) => a.sort_order - b.sort_order);
  const update = (id: string, patch: Partial<HomepageBanner>) => onChange(sorted.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => onChange(sorted.filter((b) => b.id !== id).map((b, i) => ({ ...b, sort_order: i })));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next.map((b, idx) => ({ ...b, sort_order: idx })));
  };
  const add = () =>
    onChange([
      ...sorted,
      { id: `banner-${Date.now().toString(36)}`, headline: 'New banner', sub: '', cta_label: 'Shop now', cta_href: '/shop', image_path: '/images/feature-suit-ivory.jpg', visible: false, sort_order: sorted.length },
    ]);

  return (
    <>
      <div className="space-y-3">
        {sorted.map((b, i) => (
          <div key={b.id} className="p-3 bg-ivory-2/50 rounded border border-stone space-y-2">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center space-x-2 text-xs font-medium text-navy">
                <input type="checkbox" checked={b.visible} onChange={(e) => update(b.id, { visible: e.target.checked })} />
                <span>{b.visible ? 'Visible' : 'Hidden'} · slide {i + 1}</span>
              </label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="p-1.5 hover:bg-stone rounded" disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="p-1.5 hover:bg-stone rounded" disabled={i === sorted.length - 1}><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => remove(b.id)} aria-label="Remove banner" className="p-1.5 text-aplus-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Text id={`b-h-${b.id}`} label="Headline" value={b.headline} onChange={(v) => update(b.id, { headline: v })} />
              <Text id={`b-s-${b.id}`} label="Sub-headline" value={b.sub} onChange={(v) => update(b.id, { sub: v })} />
              <Text id={`b-cl-${b.id}`} label="Button label" value={b.cta_label} onChange={(v) => update(b.id, { cta_label: v })} />
              <Text id={`b-ch-${b.id}`} label="Button link" value={b.cta_href} onChange={(v) => update(b.id, { cta_href: v })} />
              <Text id={`b-sl-${b.id}`} label="Secondary label (optional)" value={b.secondary_label ?? ''} onChange={(v) => update(b.id, { secondary_label: v || undefined })} />
              <Text id={`b-sh-${b.id}`} label="Secondary link (optional)" value={b.secondary_href ?? ''} onChange={(v) => update(b.id, { secondary_href: v || undefined })} />
              <div className="sm:col-span-2"><Text id={`b-img-${b.id}`} label="Image path or URL" value={b.image_path} onChange={(v) => update(b.id, { image_path: v })} /></div>
            </div>
          </div>
        ))}
        <button type="button" onClick={add} className="text-xs inline-flex items-center space-x-1 px-3 py-2 border border-dashed border-stone rounded text-text-2 hover:bg-ivory-2"><Plus className="w-3.5 h-3.5" aria-hidden="true" /><span>Add banner</span></button>
      </div>
    </>
  );
}
