'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { Measurements } from '@/lib/types';
import { saveMeasurementsAction, type MeasurementsFormState } from './actions';

const FIELDS: Array<{ name: keyof Measurements; label: string; placeholder: string }> = [
  { name: 'chest', label: 'Chest (inches)', placeholder: 'e.g. 40' },
  { name: 'waist', label: 'Trouser waist (inches)', placeholder: 'e.g. 34' },
  { name: 'shoulder', label: 'Shoulder width (inches)', placeholder: 'e.g. 18.5' },
  { name: 'sleeve', label: 'Sleeve length (inches)', placeholder: 'e.g. 25' },
  { name: 'height', label: 'Height', placeholder: `e.g. 5'10"` },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 bg-navy hover:bg-navy-2 text-ivory text-xs font-semibold rounded shadow transition disabled:opacity-60 min-h-[44px]"
    >
      {pending ? 'Saving…' : 'Save measurements'}
    </button>
  );
}

export function MeasurementsForm({ initial }: { initial: Measurements | null | undefined }) {
  const [state, formAction] = useFormState<MeasurementsFormState, FormData>(saveMeasurementsAction, { ok: false, message: '' });

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
      {state.message && (
        <div
          role={state.ok ? 'status' : 'alert'}
          className={`sm:col-span-3 p-3 text-xs rounded border ${
            state.ok ? 'bg-emerald-50 text-aplus-success border-emerald-200' : 'bg-red-50 text-aplus-error border-red-200'
          }`}
        >
          {state.message}
        </div>
      )}

      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={`m-${f.name}`} className="block font-medium text-navy mb-1">
            {f.label}
          </label>
          <input
            id={`m-${f.name}`}
            name={f.name}
            type="text"
            inputMode="decimal"
            maxLength={20}
            defaultValue={initial?.[f.name] ?? ''}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy min-h-[44px]"
          />
        </div>
      ))}

      <div className="sm:col-span-3">
        <label htmlFor="m-notes" className="block font-medium text-navy mb-1">
          Fit notes (optional)
        </label>
        <textarea
          id="m-notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={initial?.notes ?? ''}
          placeholder="Posture, preferred jacket length, trouser break, etc."
          className="w-full px-3 py-2 bg-ivory-2 border border-stone rounded focus:ring-1 focus:ring-navy"
        />
      </div>

      <div className="sm:col-span-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
