/**
 * What: Language toggle (EN / PT); the choice is saved (D38). Short codes are shown, the full
 *   language name is the accessible label.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useI18n } from '../i18n/I18nProvider';
import { LOCALES } from '../i18n/translate';

export function LanguageSelect() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="lang" role="group" aria-label={t('header.language')}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          aria-label={t(`lang.${l}`)}
          onClick={() => setLocale(l)}
        >
          {t(`langShort.${l}`)}
        </button>
      ))}
    </div>
  );
}
