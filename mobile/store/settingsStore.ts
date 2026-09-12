import { create } from 'zustand';
import { storage } from '../services/storage';

export type ThemePreference = 'DARK' | 'LIGHT' | 'SYSTEM';

interface SettingsState {
  defaultCurrency: string;
  themePreference: ThemePreference;
  isHydrated: boolean;

  loadSettings: () => Promise<void>;
  setDefaultCurrency: (currency: string) => Promise<void>;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const DEFAULTS = {
  defaultCurrency: 'PLN',
  themePreference: 'DARK' as ThemePreference,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultCurrency: DEFAULTS.defaultCurrency,
  themePreference: DEFAULTS.themePreference,
  isHydrated: false,

  loadSettings: async () => {
    try {
      const [currency, themePref] = await Promise.all([
        storage.getItem('settings.defaultCurrency'),
        storage.getItem('settings.themePreference'),
      ]);

      set({
        defaultCurrency: currency || DEFAULTS.defaultCurrency,
        themePreference: (themePref as ThemePreference) || DEFAULTS.themePreference,
        isHydrated: true,
      });
    } catch {
      set({
        defaultCurrency: DEFAULTS.defaultCurrency,
        themePreference: DEFAULTS.themePreference,
        isHydrated: true,
      });
    }
  },

  setDefaultCurrency: async (currency: string) => {
    const value = (currency || '').trim().toUpperCase();
    if (!value || value.length !== 3) return;

    set({ defaultCurrency: value });
    await storage.setItem('settings.defaultCurrency', value);
  },

  setThemePreference: async (pref: ThemePreference) => {
    set({ themePreference: pref });
    await storage.setItem('settings.themePreference', pref);
  },
}));
