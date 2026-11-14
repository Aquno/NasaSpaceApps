/**
 * What: Footer with the standing notices: regional reference points (not NASA landing sites),
 *   independent project, event. Sources are in "About"; the education idea is on the Roadmap
 *   (D50). Text from the dictionaries.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useI18n } from '../i18n/I18nProvider';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <p>
        {t('footer.points')} {t('footer.independent')} {t('footer.event')}
      </p>
    </footer>
  );
}
