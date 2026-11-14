/**
 * What: React context for the interface language. Choice order: ?lang= in the URL, then the
 *   saved choice (localStorage, best effort), then English. Display only; no calculation.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision docs/DECISOES.md D38.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import type { Messages } from './messages';
import { ptBR } from './ptBR';
import { createTranslator, LOCALES, type Locale, type Translator } from './translate';

const DICTIONARIES: Record<Locale, Messages> = { en, 'pt-BR': ptBR };
const STORAGE_KEY = 'lsn.locale';
const DEFAULT_LOCALE: Locale = 'en';

const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

function initialLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (isLocale(fromUrl)) return fromUrl;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // storage unavailable (private mode): keep the default
  }
  return DEFAULT_LOCALE;
}

interface I18nValue extends Translator {
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo<I18nValue>(
    () => ({
      ...createTranslator(DICTIONARIES[locale], locale),
      setLocale: (next) => {
        setLocaleState(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // storage unavailable: the choice lasts for this session only
        }
      },
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
