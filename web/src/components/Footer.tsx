/**
 * What: Footer: sources, nature of the site points, the independent-project notice and the one
 *   line on a possible education version (D26). Text from the dictionaries.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useI18n } from '../i18n/I18nProvider';

/** @param sources false when the page already shows the sources (opening, D40). */
export function Footer({ sources = true }: { sources?: boolean }) {
  const { t } = useI18n();
  return (
    <footer className="footer">
      {sources && <p>{t('footer.sources')}</p>}
      <p>
        <strong>{t('footer.points')}</strong> <strong>{t('footer.independent')}</strong>{' '}
        {t('footer.event')}
      </p>
      <p>{t('footer.future')}</p>
    </footer>
  );
}
