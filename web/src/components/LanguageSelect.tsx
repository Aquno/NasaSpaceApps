/**
 * What: Language selector (English / Português do Brasil); the choice is saved (D38).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useI18n } from '../i18n/I18nProvider';
import { LOCALES, type Locale } from '../i18n/translate';

export function LanguageSelect() {
  const { t, locale, setLocale } = useI18n();
  return (
    <label className="lang">
      <span className="visually-hidden">{t('header.language')}</span>
      <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {t(`lang.${l}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
