'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { updateProfile } from '@/lib/db';

const measurementField = z.string().trim().max(20).optional().transform((v) => v || undefined);

const measurementsSchema = z.object({
  chest: measurementField,
  waist: measurementField,
  shoulder: measurementField,
  sleeve: measurementField,
  height: measurementField,
  notes: z.string().trim().max(500).optional().transform((v) => v || undefined),
});

export interface MeasurementsFormState {
  ok: boolean;
  message: string;
}

export async function saveMeasurementsAction(_prev: MeasurementsFormState, formData: FormData): Promise<MeasurementsFormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Please sign in again to save your measurements.' };

  const parsed = measurementsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || 'Please check the values you entered.' };
  }

  try {
    await updateProfile(user.id, { measurements: parsed.data });
    revalidatePath('/account');
    return { ok: true, message: 'Measurements saved. Our tailors will reference these for your bespoke orders.' };
  } catch (err) {
    console.error('[account] saveMeasurements failed:', err);
    return { ok: false, message: 'We could not save your measurements right now. Please try again.' };
  }
}
