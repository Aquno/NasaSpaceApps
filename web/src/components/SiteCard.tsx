/**
 * What: One site card, in two layers (D39). Compact: rank, name, verdict icon, the two scores and
 *   a one-line reason. Expanded (selected card): landing hour, next viable landing, direct-link
 *   line, key metrics, how each score is built and the details button. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { SiteEvaluation } from '../calc/evaluate';
import type { ViableWindow } from '../calc/nextViable';
import type { SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { VERDICT_ICON } from '../ui/format';

interface Props {
  site: SiteSummary;
  evaluation: SiteEvaluation | undefined;
  /** Next viable landing (undefined when the site is viable now; null when none is left). */
  next: ViableWindow | null | undefined;
  rank: number;
  best: boolean;
  /** Shows the second layer (the selected card, or the best compromise when none is). */
  expanded: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

export function SiteCard({
  site,
  evaluation,
  next,
  rank,
  best,
  expanded,
  onSelect,
  onOpen,
}: Props) {
  const { t, msg, num } = useI18n();
  if (!evaluation || !evaluation.ok) {
    return (
      <article className="card not-viable" aria-label={t('card.outsideAria', { site: site.name })}>
        <h3>{site.name}</h3>
        <p className="reason">{t('card.outside')}</p>
      </article>
    );
  }
  const { engineering, science, verdict: v, metrics: m, link } = evaluation;
  const classes = ['card', v.kind, best ? 'best' : '', expanded ? 'expanded' : ''].join(' ');
  const linkKey: MessageKey =
    link.kind === 'low'
      ? 'card.linkLow'
      : link.kind === 'gaps'
        ? 'card.linkGaps'
        : 'card.linkContinuous';
  return (
    <article
      className={classes}
      aria-label={t(best ? 'card.ariaBest' : 'card.aria', {
        site: site.name,
        rank,
        verdict: v.kind,
      })}
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onSelect}
      onFocus={(e) => {
        if (e.target === e.currentTarget) onSelect();
      }}
    >
      <div className="card-head">
        <span className="rank">{rank}</span>
        <div className="card-title">
          {best && <span className="tag-best caps">{t('card.best')}</span>}
          <h3>{site.name}</h3>
          <span className={`verdict ${v.kind}`}>
            <span aria-hidden="true">{VERDICT_ICON[v.kind]}</span> {t(`verdict.${v.kind}`)}
          </span>
        </div>
        <div className="scores">
          <div className="score">
            <div className="value sun">{num(engineering.total)}</div>
            <div className="caps">{t('card.engineering')}</div>
          </div>
          <div className="score">
            <div className="value science">{science ? num(science.total) : '–'}</div>
            <div className="caps">{t('card.science')}</div>
          </div>
        </div>
      </div>
      <p className="reason" title={msg(v.reason)}>
        {msg(v.reason)}
      </p>
      {expanded && (
        <div className="card-more">
          <p className="next">
            {evaluation.landingHourFound
              ? t('card.landingAt', { t: evaluation.landingMs })
              : t('card.noLandingHour')}
          </p>
          {next !== undefined && (
            <p className="next">
              {next ? t('card.next', { date: next.startMs, n: next.windowDays }) : t('card.noNext')}
            </p>
          )}
          <p className={link.kind === 'low' ? 'link alert' : 'link earth'}>
            {link.kind === 'low' ? '△' : '▲'}{' '}
            {t(linkKey, { p: link.fraction, g: link.longestGapHours })}
          </p>
          <div className="metrics">
            <span className="sun" title={t('card.sunTitle')}>
              ● {t('card.sun', { p: m.sunFraction })}
            </span>
            <span className="science" title={t('card.psrTitle')}>
              ◆{' '}
              {site.psrDistanceKm === null
                ? t('unit.na')
                : t('card.psr', { km: site.psrDistanceKm })}
            </span>
            <span title={t('card.slopeTitle')}>
              ⟋ {t('card.slope', { s: site.terrainSlopeDeg })}
            </span>
          </div>
          <details onClick={(e) => e.stopPropagation()}>
            <summary>{t('card.howBuilt')}</summary>
            <table>
              <tbody>
                {[...engineering.parts, ...(science?.parts ?? [])].map((p) => (
                  <tr key={p.key}>
                    <td>{t(`part.${p.key}`)}</td>
                    <td className="num">
                      {t('card.partValue', { v: p.value, w: p.weight * 100 })}
                    </td>
                    <td className="num">{t('card.partPoints', { p: p.points })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>{t('card.fullDisc', { s: m.sunHoursFull, e: m.earthHoursFull })}</div>
          </details>
          <button
            type="button"
            className="linkbtn open"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {t('card.details')} ▸
          </button>
        </div>
      )}
    </article>
  );
}
