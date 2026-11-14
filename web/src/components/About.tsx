/**
 * What: "About" content (D50): comparison with the existing tools, scope (including the best-case
 *   notice) and sources, in one place. Used in the header dialog and on the opening.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useI18n } from '../i18n/I18nProvider';
import { WhatThisAddsTable } from './WhatThisAdds';
import { WhatThisCovers } from './WhatThisCovers';

export interface DataScope {
  points: number;
  hours: number;
  year: string;
}

export function About({ dataScope }: { dataScope?: DataScope | null }) {
  const { t } = useI18n();
  return (
    <div className="about">
      <section>
        <h3 className="caps">{t('about.compare')}</h3>
        <WhatThisAddsTable />
      </section>
      <section>
        <h3 className="caps">{t('covers.title')}</h3>
        <WhatThisCovers heading={false} />
      </section>
      <section>
        <h3 className="caps">{t('about.sources')}</h3>
        <p>{t('footer.sources')}</p>
        {dataScope && (
          <p className="note">
            {t('intro.dataScope', {
              n: dataScope.points,
              h: dataScope.hours,
              year: dataScope.year,
            })}
          </p>
        )}
      </section>
    </div>
  );
}
