/**
 * What: One site card: scores, verdict (icon + text + border style), reason, key metrics and
 *   how each score is built. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { SiteEvaluation } from '../calc/evaluate';
import type { ViableWindow } from '../calc/nextViable';
import type { SiteSummary } from '../data/contract';
import {
  fmtDate,
  fmtDateTime,
  fmtHours,
  fmtKm,
  fmtPct,
  fmtScore,
  VERDICT_LABEL,
} from '../ui/format';

interface Props {
  site: SiteSummary;
  evaluation: SiteEvaluation | undefined;
  /** Next viable landing (undefined when the site is viable now; null when none is left). */
  next: ViableWindow | null | undefined;
  rank: number;
  best: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export function SiteCard({
  site,
  evaluation,
  next,
  rank,
  best,
  selected,
  onSelect,
  onOpen,
}: Props) {
  if (!evaluation || !evaluation.ok) {
    return (
      <article className="card not-viable" aria-label={`${site.name}: outside data`}>
        <h3>{site.name}</h3>
        <p className="reason">
          The mission runs past the end of the data interval. Choose an earlier landing date.
        </p>
      </article>
    );
  }
  const { engineering, science, verdict: v, metrics: m } = evaluation;
  const label = VERDICT_LABEL[v.kind];
  const classes = ['card', v.kind, best ? 'best' : '', selected ? 'selected' : ''].join(' ');
  return (
    <article
      className={classes}
      aria-label={`${site.name}, rank ${rank}, ${label.text}${best ? ', best compromise' : ''}`}
      onClick={onSelect}
    >
      {best && <span className="tag-best">BEST COMPROMISE</span>}
      <h3>
        <span className="rank">{rank}</span>
        {site.name}
      </h3>
      <div className="scores">
        <div className="score">
          <div className="caps">Engineering</div>
          <div className="value sun">{fmtScore(engineering.total)}</div>
        </div>
        <div className="score">
          <div className="caps">Science</div>
          <div className="value science">{science ? fmtScore(science.total) : '–'}</div>
        </div>
      </div>
      <div className={`verdict ${v.kind}`}>
        <span aria-hidden="true">{label.icon}</span> {label.text}
      </div>
      <p className="reason">{v.reason}</p>
      <p className="next">
        {evaluation.landingHourFound
          ? `Landing ${fmtDateTime(evaluation.landingMs)}`
          : 'No hour of this day meets the landing rules.'}
      </p>
      {next !== undefined && (
        <p className="next">
          {next
            ? `Next viable landing: ${fmtDate(next.startMs)} (window ${next.windowDays} d)`
            : 'No viable landing left in the data year.'}
        </p>
      )}
      <p className={m.earthVisibleAtLanding ? 'link earth' : 'link'}>
        {m.earthVisibleAtLanding
          ? '▲ Direct link to Earth at landing'
          : '△ No direct link: relay satellite required'}
      </p>
      <div className="metrics">
        <span className="sun" title="Mission hours with some part of the Sun visible">
          ● {fmtPct(m.sunFraction)} sun
        </span>
        <span className="earth" title="Mission hours with some part of the Earth visible">
          ▲ {fmtPct(m.earthFraction)} Earth
        </span>
        <span className="science" title="Distance to the nearest permanently shadowed region">
          ◆ {fmtKm(site.psrDistanceKm)}
        </span>
        <span title="Local terrain slope (20 m DEM)">⟋ {site.terrainSlopeDeg.toFixed(1)}°</span>
      </div>
      <details onClick={(e) => e.stopPropagation()}>
        <summary>How the scores are built</summary>
        <table>
          <tbody>
            {[...engineering.parts, ...(science?.parts ?? [])].map((p) => (
              <tr key={p.key}>
                <td>{p.label}</td>
                <td className="num">
                  {fmtPct(p.value)} × {Math.round(p.weight * 100)}
                </td>
                <td className="num">= {p.points.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          Full solar disc: {fmtHours(m.sunHoursFull)}; full Earth disc: {fmtHours(m.earthHoursFull)}
          . Weights are team choices.
        </div>
      </details>
      <button
        type="button"
        className="linkbtn open"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        Site details ▸
      </button>
    </article>
  );
}
