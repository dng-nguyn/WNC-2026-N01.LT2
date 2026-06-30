import vi, { type TranslationKey } from './vi';

const locales = { vi } as const;
type Locale = keyof typeof locales;

const currentLocale: Locale = 'vi';

/**
 * Type-safe translation lookup.
 * Usage: const { t } = useTranslation(); t('pos.title')
 */
export function useTranslation() {
  function t(key: TranslationKey): string {
    return locales[currentLocale][key] ?? key;
  }
  return { t, locale: currentLocale };
}

/**
 * Direct lookup (for outside React components).
 */
export function t(key: TranslationKey): string {
  return locales[currentLocale][key] ?? key;
}

export type { TranslationKey, Locale };
