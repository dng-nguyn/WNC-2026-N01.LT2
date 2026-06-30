import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import vi from './vi';
import en from './en';
import type { TranslationKey } from './vi';

const locales = { vi, en } as const;
export type Locale = keyof typeof locales;

const STORAGE_KEY = 'locale';

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in locales) return stored as Locale;
  } catch {}
  return 'en';
}

interface I18nContextValue {
  t: (key: TranslationKey) => string;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  function t(key: TranslationKey): string {
    return locales[locale][key] ?? key;
  }

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Type-safe translation hook. Must be used inside <I18nProvider>.
 * Usage: const { t, locale, setLocale } = useTranslation();
 */
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside <I18nProvider>');
  return ctx;
}

/**
 * Direct lookup (for outside React components).
 * Falls back to stored locale or 'vi'.
 */
export function t(key: TranslationKey): string {
  let locale: Locale = 'vi';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in locales) locale = stored as Locale;
  } catch {}
  return locales[locale][key] ?? key;
}

export type { TranslationKey };
