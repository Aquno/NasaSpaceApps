/**
 * What: Roadmap screen (D44), from the header: three columns (Now, In 3 months, In 6 months).
 *   Everything that does not exist today carries the visible label "Concept, not implemented".
 *   No numbers; text from the dictionaries.
 * Roadmap stage: 5 — Interface / 7 — Delivery (see docs/ROTEIRO.md).
 */
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Starfield } from '../components/Starfield';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const STAR_ALPHA = 0.1;

const COLUMNS: { title: MessageKey; implemented: boolean; items: MessageKey[] }[] = [
  {
    title: 'roadmap.now',
    implemented: true,
    items: ['roadmap.now1', 'roadmap.now2', 'roadmap.now3'],
  },
  {
    title: 'roadmap.m3',
    implemented: false,
    items: ['roadmap.m3_1', 'roadmap.m3_2', 'roadmap.m3_3', 'roadmap.m3_4', 'roadmap.m3_5'],
  },
  {
    title: 'roadmap.m6',
    implemented: false,
    items: ['roadmap.m6_1', 'roadmap.m6_2', 'roadmap.m6_3'],
  },
];

export function Roadmap({ sample }: { sample: boolean }) {
  const { t } = useI18n();
  return (
    <div className="app roadmap">
      <Starfield still maxAlpha={STAR_ALPHA} />
      <Header sample={sample} />
      <h1 className="detail-title">{t('roadmap.title')}</h1>
      <div className="roadmap-cols">
        {COLUMNS.map((col) => (
          <section
            key={col.title}
            className={`glass roadmap-col${col.implemented ? ' now' : ' concept'}`}
            aria-label={t(col.title)}
          >
            <h2>{t(col.title)}</h2>
            <ul>
              {col.items.map((k) => (
                <li key={k}>
                  <span>{t(k)}</span>
                  <span className={col.implemented ? 'tag tag-now' : 'tag tag-concept'}>
                    {col.implemented ? `✓ ${t('roadmap.available')}` : t('roadmap.concept')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Footer />
    </div>
  );
}
