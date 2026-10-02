'use client';

import React, { createContext, useContext } from 'react';
import { StoreSettings } from '@/lib/types';
import { DEFAULT_STORE_SETTINGS } from '@/lib/store-defaults';

const StoreSettingsContext = createContext<StoreSettings>(DEFAULT_STORE_SETTINGS);

/**
 * Makes the published store_settings (contact, delivery rules, FX rates, social
 * links) available to client components. The root layout loads them once on
 * the server and passes them down, so there is no client-side fetch.
 */
export function StoreSettingsProvider({ settings, children }: { settings: StoreSettings; children: React.ReactNode }) {
  return <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}
