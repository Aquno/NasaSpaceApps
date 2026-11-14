/**
 * What: Opening screen (D40). First screen (full window height): star field, slowly rotating
 *   Moon globe with the south polar cap glowing, label, product name, one sentence, the delay
 *   question, "Open mission panel" and "How it works". Second section: three glass cards and a
 *   strip of big numbers computed in the browser from the data files (calc module, D9). Third
 *   section: "What this adds", "What this tool covers" and "Data sources", closed by default.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { delayChangeDays, landingCensus } from '../calc/census';
import { rankedSites } from '../calc/evaluate';
import { visibilitySeries } from '../calc/visibility';
import {
  DEFAULT_MISSION_DURATION_H,
  DEFAULT_RULES,
  PITCH_DELAY_DAYS,
  SMALL_MOVE_SITE_IDS,
} from '../config/scoring';
import { Footer } from '../components/Footer';
import { GlobeStill } from '../components/GlobeStill';
import { LanguageSelect } from '../components/LanguageSelect';
import { Starfield } from '../components/Starfield';
import { WhatThisAddsTable } from '../components/WhatThisAdds';
import { WhatThisCovers } from '../components/WhatThisCovers';
import type { SiteData, SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { useReveal } from '../ui/useReveal';
import { surfaceDistanceKm } from '../calc/mapGeometry';

// three.js loads only with the globe; the static picture shows meanwhile.
const MoonGlobe = lazy(() => import('../components/MoonGlobe'));
/** Globe size: share of the window height, capped by a share of the width (no overlap). */
const GLOBE_VH = 0.82;
const GLOBE_VW = 0.46;
const PERCENT = 100;

interface Props {
  /** Site data once loaded (the numbers wait for it; the rest does not). */
  ready: { sites: SiteSummary[]; data: Map<string, SiteData>; sphereRadiusM: number } | null;
}

const FEATURES: { icon: ReactNode; title: MessageKey; text: MessageKey }[] = [
  {
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="14" cy="16" r="6" fill="var(--sun)" />
        <circle cx="28" cy="26" r="5" fill="none" stroke="var(--earth)" strokeWidth="2.5" />
        <path d="M4 34h32" stroke="var(--muted)" strokeWidth="2" />
      </svg>
    ),
    title: 'intro.f1Title',
    text: 'intro.f1',
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="5" y="14" width="8" height="20" rx="2" fill="var(--sun)" />
        <rect x="16" y="8" width="8" height="26" rx="2" fill="var(--science)" />
        <rect x="27" y="20" width="8" height="14" rx="2" fill="var(--muted)" />
      </svg>
    ),
    title: 'intro.f2Title',
    text: 'intro.f2',
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="13" fill="none" stroke="var(--muted)" strokeWidth="2.5" />
        <path d="M20 12v8l6 4" stroke="var(--text)" strokeWidth="2.5" fill="none" />
        <path d="M31 6l4 4-4 4" stroke="var(--sun)" strokeWidth="2.5" fill="none" />
      </svg>
    ),
    title: 'intro.f3Title',
    text: 'intro.f3',
  },
];

function useOpeningNumbers(ready: Props['ready']) {
  const sites = ready?.sites;
  const data = ready?.data;
  const radiusM = ready?.sphereRadiusM;
  // Keyed on the loaded arrays (not the wrapper object) so a re-render does not recompute.
  return useMemo(() => {
    if (!sites || !data || radiusM === undefined) return null;
    const ready = { sites, data };
    const ranked = rankedSites(ready.sites);
    const vis = new Map(
      ranked.flatMap((s) => {
        const d = ready.data.get(s.id);
        return d ? [[s.id, visibilitySeries(d)] as const] : [];
      }),
    );
    const meta = ready.data.values().next().value?.meta;
    const census = landingCensus(
      ranked,
      ready.data,
      vis,
      DEFAULT_MISSION_DURATION_H,
      DEFAULT_RULES,
    );
    const delay = delayChangeDays(
      ranked,
      ready.data,
      vis,
      DEFAULT_MISSION_DURATION_H,
      PITCH_DELAY_DAYS,
      DEFAULT_RULES,
    );
    // Shackleton rim and inner wall: NASA average sunlight and the distance between them.
    const [rim, wall] = SMALL_MOVE_SITE_IDS.map((id) => sites.find((s) => s.id === id));
    const shackleton =
      rim && wall && rim.nasaAvgIlluminationPct !== null && wall.nasaAvgIlluminationPct !== null
        ? {
            rimPct: rim.nasaAvgIlluminationPct,
            wallPct: wall.nasaAvgIlluminationPct,
            km: surfaceDistanceKm(rim.lat, rim.lon, wall.lat, wall.lon, radiusM),
          }
        : null;
    // Best site of the year: the most landing days that meet the rules.
    let best: { site: string; days: number } | null = null;
    for (const s of ranked) {
      const days = census.perSite.get(s.id)?.viable ?? 0;
      if (!best || days > best.days) best = { site: s.name, days };
    }
    return {
      points: ranked.length,
      hours: meta?.count ?? 0,
      shackleton,
      best,
      year: meta ? String(new Date(meta.startMs).getUTCFullYear()) : '',
      census,
      delay,
    };
  }, [sites, data, radiusM]);
}

export function Intro({ ready }: Props) {
  const { t, num } = useI18n();
  const [globePx] = useState(() =>
    Math.round(Math.min(window.innerHeight * GLOBE_VH, window.innerWidth * GLOBE_VW)),
  );
  const n = useOpeningNumbers(ready);
  const featuresRef = useReveal<HTMLElement>();
  const statsRef = useReveal<HTMLElement>();
  const moreRef = useReveal<HTMLElement>();

  return (
    <div className="opening">
      <Starfield />
      <section className="hero">
        <div className="hero-globe">
          <Suspense fallback={<GlobeStill size={globePx} light="75% 40%" />}>
            <MoonGlobe size={globePx} variant="hero" spin label={false} />
          </Suspense>
        </div>
        <div className="hero-lang">
          <LanguageSelect />
        </div>
        <div className="hero-text">
          <p className="caps hero-kicker">{t('intro.kicker')}</p>
          <h1 className="hero-title">{t('header.title')}</h1>
          <p className="hero-lead">{t('intro.lead')}</p>
          <p className="hero-question">{t('intro.question')}</p>
          <div className="hero-actions">
            <a className="btn-primary" href="#/mission">
              {t('intro.open')}
            </a>
            <button
              type="button"
              className="btn-text"
              onClick={() =>
                document.getElementById('how')?.scrollIntoView({
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'auto'
                    : 'smooth',
                })
              }
            >
              {t('intro.how')} ↓
            </button>
          </div>
        </div>
      </section>

      <section id="how" className="opening-section reveal" ref={featuresRef}>
        <h2 className="visually-hidden">{t('intro.how')}</h2>
        <ul className="features">
          {FEATURES.map((f) => (
            <li key={f.title} className="glass feature">
              {f.icon}
              <h3>{t(f.title)}</h3>
              <p>{t(f.text)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="opening-section reveal" ref={statsRef}>
        {n ? (
          <>
            <ul className="stats">
              {n.shackleton && (
                <li>
                  <span className="stat-value">
                    {t('intro.statShackValue', {
                      a: n.shackleton.rimPct / PERCENT,
                      b: n.shackleton.wallPct / PERCENT,
                    })}
                  </span>
                  <span className="stat-caption">
                    {t('intro.statShack', { km: n.shackleton.km })}
                  </span>
                </li>
              )}
              {n.best && (
                <li>
                  <span className="stat-value">{num(n.best.days)}</span>
                  <span className="stat-caption">
                    {t('intro.statBest', {
                      year: n.year,
                      site: n.best.site,
                      total: n.census.daysInData,
                    })}
                  </span>
                </li>
              )}
              <li>
                <span className="stat-value sun">{num(n.census.noViableDays)}</span>
                <span className="stat-caption">
                  {t('intro.statNone', { year: n.year, total: n.census.daysInData })}
                </span>
              </li>
              <li>
                <span className="stat-value">{num(n.delay.siteToSite)}</span>
                <span className="stat-caption">
                  {t('intro.statDelay', { d: PITCH_DELAY_DAYS })}
                </span>
              </li>
            </ul>
            <p className="note stats-note">
              {t('intro.statsNote', { days: DEFAULT_MISSION_DURATION_H / 24 })}
            </p>
          </>
        ) : (
          <p className="note" role="status">
            {t('app.loading')}
          </p>
        )}
      </section>

      <section className="opening-section reveal more-info" ref={moreRef}>
        <details className="glass">
          <summary>{t('intro.whatThisAdds')}</summary>
          <WhatThisAddsTable />
        </details>
        <details className="glass">
          <summary>{t('covers.title')}</summary>
          <WhatThisCovers heading={false} />
        </details>
        <details className="glass">
          <summary>{t('intro.sources')}</summary>
          <p>{t('footer.sources')}</p>
          {n && <p>{t('intro.dataScope', { n: n.points, h: n.hours, year: n.year })}</p>}
        </details>
        <Footer sources={false} />
      </section>
    </div>
  );
}
