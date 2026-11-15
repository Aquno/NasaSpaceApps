/**
 * What: One site card, in two layers (D39, D49). Compact: rank, name, verdict icon, the two
 *   scores and a one-line reason (the best compromise also shows its direct-link line).
 *   Expanded (selected card): landing hour, next viable landing, direct-link line, key metrics,
 *   how each score is built and the details button. Hover/focus highlights the matching marker
 *   in the 3D view (onHover); Enter, Space or a click selects. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { SiteEvaluation } from '../calc/evaluate';
import type { ViableWindow } from '../calc/nextViable';
import type { SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { VERDICT_ICON } from '../ui/format';
import { ScoreParts } from './ScoreParts';
import { InfoTip } from './InfoTip';
import type { MissionRules } from '../config/scoring';
import { ruleMsg, scienceReason, scienceRule } from '../ui/ruleText';
import { siteStatus } from '../calc/evaluate';

interface Props {
  site: SiteSummary;
  evaluation: SiteEvaluation | undefined;
  /** Next viable landing (undefined when the site is viable now; null when none is left). */
  next: ViableWindow | null | undefined;
  rank: number;
  best: boolean;
  /** Shows the second layer (the selected card). */
  expanded: boolean;
  /** Mission rules, to name the rule that decided the verdict (D50). */
  rules: MissionRules;
  /** Highlighted because its 3D marker is hovered (D49). */
  linked: boolean;
  onHover: (hovered: boolean) => void;
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
  linked,
  rules,
  onHover,
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
  // Displayed status: a site left out by the science filter is never shown as viable (D53).
  const status = siteStatus(evaluation);
  const belowScience = status === 'below-science';
  const reason = belowScience ? scienceReason(science, rules) : v.reason;
  const classes = [
    'card',
    'glass',
    status,
    best ? 'best' : '',
    expanded ? 'expanded' : '',
    linked ? 'linked' : '',
  ].join(' ');
  const linkKey: MessageKey =
    link.kind === 'low'
      ? 'card.linkLow'
      : link.kind === 'gaps'
        ? 'card.linkGaps'
        : 'card.linkContinuous';
  const rule = belowScience ? scienceRule(rules) : ruleMsg(v.rule, rules);
  const linkLine = (
    <p className={link.kind === 'low' ? 'link alert' : 'link earth'}>
      {link.kind === 'low' ? '△' : '▲'} {t(linkKey, { p: link.fraction, g: link.longestGapHours })}
      {link.kind === 'gaps' && <InfoTip>{t('card.linkTip')}</InfoTip>}
    </p>
  );
  return (
    <article
      className={classes}
      aria-label={t(best ? 'card.ariaBest' : 'card.aria', {
        site: site.name,
        rank,
        verdict: status,
      })}
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
    >
      <div className="card-head">
        <span className="rank">{rank}</span>
        <div className="card-title">
          {best && <span className="tag-best caps">{t('card.best')}</span>}
          <h3>{site.name}</h3>
          <span className={`verdict ${status}`}>
            <span aria-hidden="true">{VERDICT_ICON[status]}</span> {t(`verdict.${status}`)}
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
      <p className="reason" title={msg(reason)}>
        {msg(reason)}
      </p>
      {(best || expanded) && linkLine}
      {expanded && (
        <div className="card-more">
          {rule && <p className="rule">{t('card.rule', { rule: msg(rule) })}</p>}
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
          <div className="metrics">
            <span className="sun" title={t('card.sunTitle')}>
              ● {t('card.sun', { p: m.sunFraction })}
            </span>
            <span className="science" title={t('card.psrTitle')}>
              ◆{' '}
              {site.psrDistanceKm === null
                ? t('unit.na')
                : t('card.psr', { km: site.psrDistanceKm, a: site.psrAreaKm2 ?? 0 })}
            </span>
            <span title={t('card.slopeTitle')}>
              ⟋ {t('card.slope', { s: site.terrainSlopeDeg })}
            </span>
          </div>
          <details onClick={(e) => e.stopPropagation()}>
            <summary>{t('card.howBuilt')}</summary>
            <ScoreParts engineering={engineering} science={science} metrics={m} site={site} />
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
