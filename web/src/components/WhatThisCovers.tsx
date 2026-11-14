/**
 * What: "What this tool covers" block: scope of the planning tool. Text from the dictionaries.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decisions D31, D34.
 */
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const COVERS: MessageKey[] = ['covers.c1', 'covers.c2', 'covers.c3', 'covers.c4'];
const NOT_COVERS: MessageKey[] = ['covers.n1', 'covers.n2', 'covers.n3', 'covers.n4'];

/** @param heading false when a surrounding block already shows the title. */
export function WhatThisCovers({ heading = true }: { heading?: boolean }) {
  const { t } = useI18n();
  return (
    <section aria-label={t('covers.title')}>
      {heading && <h2 className="caps">{t('covers.title')}</h2>}
      <p>{t('intro.problem')}</p>
      <p className="note">{t('covers.planning')}</p>
      <p className="note">
        <strong>{t('covers.bestCaseTitle')}</strong> {t('covers.bestCase')}
      </p>
      <div className="covers">
        <div>
          <strong>{t('covers.covers')}</strong>
          <ul>
            {COVERS.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>{t('covers.notCovers')}</strong>
          <ul>
            {NOT_COVERS.map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
