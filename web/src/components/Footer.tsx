/**
 * What: Footer: sources, nature of the site points, the independent-project notice and the one
 *   line on a possible education version (D26). Text from the dictionaries.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useI18n } from '../i18n/I18nProvider';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <p>{t('footer.sources')}</p>
      <p>
        <strong>{t('footer.points')}</strong> <strong>{t('footer.independent')}</strong>{' '}
        {t('footer.event')}
      </p>
      <p>{t('footer.future')}</p>
    </footer>
  );
}
