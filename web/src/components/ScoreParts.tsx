/**
 * What: How the scores are built: each part's value, weight and points, plus the full-disc hours.
 *   Used in the card's second layer and on the site detail. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { MissionMetrics } from '../calc/metrics';
import type { Score } from '../calc/scores';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  engineering: Score;
  science: Score | null;
  metrics: MissionMetrics;
}

export function ScoreParts({ engineering, science, metrics: m }: Props) {
  const { t } = useI18n();
  return (
    <>
      <table className="score-parts">
        <tbody>
          {[...engineering.parts, ...(science?.parts ?? [])].map((p) => (
            <tr key={p.key}>
              <td>{t(`part.${p.key}`)}</td>
              <td className="num">{t('card.partValue', { v: p.value, w: p.weight * 100 })}</td>
              <td className="num">{t('card.partPoints', { p: p.points })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{t('card.fullDisc', { s: m.sunHoursFull, e: m.earthHoursFull })}</p>
    </>
  );
}
