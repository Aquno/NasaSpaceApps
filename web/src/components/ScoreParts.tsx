/**
 * What: How the scores are built, in two blocks (Engineering, Science) with subtitle, total and
 *   each score's colour (D52): each part's value, weight and points; the full-disc hours; why the
 *   two Earth-contact terms can match; the permanent-shadow distance beside its region's area.
 *   Used in the card's second layer and on the site detail. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { MissionMetrics } from '../calc/metrics';
import type { Score, ScorePart } from '../calc/scores';
import type { SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import { InfoTip } from './InfoTip';

interface Props {
  engineering: Score;
  science: Score | null;
  metrics: MissionMetrics;
  site: Pick<SiteSummary, 'psrDistanceKm' | 'psrAreaKm2'>;
}

export function ScoreParts({ engineering, science, metrics: m, site }: Props) {
  const { t, num } = useI18n();
  const rows = (parts: ScorePart[]) => (
    <table className="score-parts">
      <tbody>
        {parts.map((p) => (
          <tr key={p.key}>
            <td>
              {t(`part.${p.key}`)}
              {p.key === 'contactGaps' && <InfoTip>{t('part.gapsTip')}</InfoTip>}
            </td>
            <td className="num">{t('card.partValue', { v: p.value, w: p.weight * 100 })}</td>
            <td className="num">{t('card.partPoints', { p: p.points })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <div className="score-groups">
      <section className="score-group">
        <h4 className="score-group-title">
          <span className="caps">{t('card.engineering')}</span>{' '}
          <span className="sun score-total">{num(engineering.total)}</span>
        </h4>
        {rows(engineering.parts)}
        <p className="note">{t('card.fullDisc', { s: m.sunHoursFull, e: m.earthHoursFull })}</p>
      </section>
      <section className="score-group">
        <h4 className="score-group-title">
          <span className="caps">{t('card.science')}</span>{' '}
          <span className="science score-total">{science ? num(science.total) : '–'}</span>
        </h4>
        {science && rows(science.parts)}
        <p className="note">
          {site.psrDistanceKm === null
            ? t('unit.na')
            : t('part.psrFact', { km: site.psrDistanceKm, a: site.psrAreaKm2 ?? 0 })}
        </p>
      </section>
    </div>
  );
}
