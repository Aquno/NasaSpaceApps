/**
 * What: One site card: scores, verdict (icon + text), reason, landing hour, next viable landing,
 *   direct-link line, key metrics and how each score is built. Display only.
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
  const classes = ['card', v.kind, best ? 'best' : '', selected ? 'selected' : ''].join(' ');
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
      onClick={onSelect}
    >
      {best && <span className="tag-best">{t('card.best')}</span>}
      <h3>
        <span className="rank">{rank}</span>
        {site.name}
      </h3>
      <div className="scores">
        <div className="score">
          <div className="caps">{t('card.engineering')}</div>
          <div className="value sun">{num(engineering.total)}</div>
        </div>
        <div className="score">
          <div className="caps">{t('card.science')}</div>
          <div className="value science">{science ? num(science.total) : '–'}</div>
        </div>
      </div>
      <div className={`verdict ${v.kind}`}>
        <span aria-hidden="true">{VERDICT_ICON[v.kind]}</span> {t(`verdict.${v.kind}`)}
      </div>
      <p className="reason">{msg(v.reason)}</p>
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
          ◆ {site.psrDistanceKm === null ? t('unit.na') : t('card.psr', { km: site.psrDistanceKm })}
        </span>
        <span title={t('card.slopeTitle')}>⟋ {t('card.slope', { s: site.terrainSlopeDeg })}</span>
      </div>
      <details onClick={(e) => e.stopPropagation()}>
        <summary>{t('card.howBuilt')}</summary>
        <table>
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
    </article>
  );
}
