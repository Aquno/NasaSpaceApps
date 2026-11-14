/**
 * What: Site detail page (D42). Main element: the 360° horizon panorama with the Sun and the
 *   Earth at the selected mission hour and their paths, with a time control (play). Below: the
 *   mission timeline (sunlight and direct-contact bands, count to the next sunset), the verdict
 *   and how the scores are built, and "Data and limits" (closed by default).
 *   Composes components; calculation comes from the calc module (D9).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: one site's summary and data, the mission inputs of the dashboard.
 */
import { useEffect, useMemo, useState } from 'react';
import { evaluateSite } from '../calc/evaluate';
import { trackSegments } from '../calc/panorama';
import { visibilitySeries } from '../calc/visibility';
import { indexAtOrAfter, type SiteData, type SiteSummary } from '../data/contract';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { HorizonPanorama } from '../components/HorizonPanorama';
import { MissionTimeline } from '../components/MissionTimeline';
import { ScoreParts } from '../components/ScoreParts';
import { SiteFacts } from '../components/SiteFacts';
import { Starfield } from '../components/Starfield';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { DAY_MS, type MissionInputs } from '../state/useMission';
import { VERDICT_ICON } from '../ui/format';

/** Playback speed: one mission hour per frame step (ms). */
const PLAY_STEP_MS = 60;
const DASH_STAR_ALPHA = 0.1;

interface Props {
  site: SiteSummary;
  data: SiteData;
  inputs: MissionInputs;
}

function stateKey(any: number | undefined, full: number | undefined): MessageKey {
  if (full === 1) return 'detail.visible';
  if (any === 1) return 'detail.partial';
  return 'detail.hidden';
}

export function SiteDetail({ site, data, inputs }: Props) {
  const { t, msg, num } = useI18n();
  const vis = useMemo(() => visibilitySeries(data), [data]);
  const landingDayMs = inputs.plannedMs + inputs.delayDays * DAY_MS;
  const ev = useMemo(
    () => evaluateSite(site, data, vis, landingDayMs, inputs.durationH, inputs.rules),
    [site, data, vis, landingDayMs, inputs.durationH, inputs.rules],
  );
  const start = ev.ok ? indexAtOrAfter(data.meta, ev.landingMs) : 0;
  const length = Math.round((inputs.durationH * 60) / data.meta.stepMinutes);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const s = data.series;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCursor((c) => {
        if (c >= length - 1) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, PLAY_STEP_MS);
    return () => window.clearInterval(id);
  }, [playing, length]);

  const paths = useMemo(
    () => ({
      sun: trackSegments(s.sunAz, s.sunEl, start, length),
      earth: trackSegments(s.earthAz, s.earthEl, start, length),
    }),
    [s, start, length],
  );

  if (!ev.ok) {
    return (
      <div className="app detail">
        <Starfield still maxAlpha={DASH_STAR_ALPHA} />
        <Header sample={data.meta.sample} />
        <a className="linkbtn" href="#/mission">
          ◂ {t('app.backToDashboard')}
        </a>
        <h1 className="detail-title">{site.name}</h1>
        <p className="warning">{t('card.outside')}</p>
      </div>
    );
  }

  const i = start + Math.min(cursor, length - 1);
  const nowMs = data.meta.startMs + i * data.meta.stepMinutes * 60_000;
  const at = (arr: ArrayLike<number>) => arr[i] as number;
  const horizonAtAz = (az: number) => data.horizon[((Math.round(az) % 360) + 360) % 360] as number;
  const { verdict: v, engineering, science, metrics, link } = ev;
  const linkKey: MessageKey =
    link.kind === 'low'
      ? 'card.linkLow'
      : link.kind === 'gaps'
        ? 'card.linkGaps'
        : 'card.linkContinuous';

  return (
    <div className="app detail">
      <Starfield still maxAlpha={DASH_STAR_ALPHA} />
      <Header sample={data.meta.sample} />
      <div className="detail-head">
        <a className="linkbtn" href="#/mission">
          ◂ {t('app.backToDashboard')}
        </a>
        <h1 className="detail-title">{site.name}</h1>
        <span className={`verdict ${v.kind}`}>
          <span aria-hidden="true">{VERDICT_ICON[v.kind]}</span> {t(`verdict.${v.kind}`)}
        </span>
        <span className="detail-scores">
          <span className="sun">{num(engineering.total)}</span>{' '}
          <span className="caps">{t('card.engineering')}</span>{' '}
          <span className="science">{science ? num(science.total) : '–'}</span>{' '}
          <span className="caps">{t('card.science')}</span>
        </span>
      </div>

      <section className="glass detail-main" aria-label={t('detail.panorama', { site: site.name })}>
        <h2 className="caps">{t('detail.panorama', { site: site.name })}</h2>
        <HorizonPanorama
          horizons={[{ values: data.horizon, className: 'main' }]}
          bodies={[
            {
              kind: 'sun',
              path: paths.sun,
              now: { az: at(s.sunAz), el: at(s.sunEl), diam: at(s.sunDiam) },
            },
            {
              kind: 'earth',
              path: paths.earth,
              now: { az: at(s.earthAz), el: at(s.earthEl), diam: at(s.earthDiam) },
            },
          ]}
          ariaLabel={t('detail.panoramaAria', { site: site.name, t: nowMs })}
        />
        <div className="time-control">
          <button
            type="button"
            className="linkbtn play"
            onClick={() => {
              if (!playing && cursor >= length - 1) setCursor(0);
              setPlaying((p) => !p);
            }}
            aria-pressed={playing}
          >
            {playing ? `❚❚ ${t('detail.pause')}` : `▶ ${t('detail.play')}`}
          </button>
          <label className="time-slider">
            <span className="visually-hidden">{t('detail.time')}</span>
            <input
              type="range"
              min={0}
              max={length - 1}
              value={cursor}
              onChange={(e) => {
                setPlaying(false);
                setCursor(Number(e.target.value));
              }}
              aria-valuetext={t('detail.hourOf', { h: cursor + 1, n: length })}
            />
          </label>
          <span className="mono time-readout">{t('detail.now', { t: nowMs })}</span>
        </div>
        <p className="body-readout">
          <span className="sun">
            ● {t('detail.sun')}: {t(stateKey(vis.sunAny[i], vis.sunFull[i]))} ·{' '}
            {t('detail.bodyAt', { el: at(s.sunEl), h: horizonAtAz(at(s.sunAz)) })}
          </span>
          <span className="earth">
            ▲ {t('detail.earth')}: {t(stateKey(vis.earthAny[i], vis.earthFull[i]))} ·{' '}
            {t('detail.bodyAt', { el: at(s.earthEl), h: horizonAtAz(at(s.earthAz)) })}
          </span>
        </p>
      </section>

      <section className="glass detail-block" aria-label={t('detail.timeline')}>
        <h2 className="caps">{t('detail.timeline')}</h2>
        <MissionTimeline
          sunAny={vis.sunAny}
          earthAny={vis.earthAny}
          start={start}
          length={length}
          cursor={Math.min(cursor, length - 1)}
        />
      </section>

      <section className="glass detail-block" aria-label={t('detail.scores')}>
        <h2 className="caps">{t('detail.scores')}</h2>
        <p className="detail-reason">{msg(v.reason)}</p>
        <p className="next mono">
          {ev.landingHourFound ? t('card.landingAt', { t: ev.landingMs }) : t('card.noLandingHour')}
        </p>
        <p className={link.kind === 'low' ? 'link alert' : 'link earth'}>
          {link.kind === 'low' ? '△' : '▲'}{' '}
          {t(linkKey, { p: link.fraction, g: link.longestGapHours })}
        </p>
        <h3 className="caps">{t('card.howBuilt')}</h3>
        <ScoreParts engineering={engineering} science={science} metrics={metrics} />
      </section>

      <details className="glass detail-block section-details">
        <summary>{t('detail.dataLimits')}</summary>
        <div className="limits">
          <SiteFacts site={site} />
          <dl className="facts">
            <dt className="caps">{t('detail.demRes')}</dt>
            <dd>
              {data.meta.horizonBands
                .map((b) => t('detail.band', { px: b.pixelM, km: b.maxDistanceKm }))
                .join(' · ')}
            </dd>
            <dt className="caps">{t('detail.observer')}</dt>
            <dd>{t('detail.observerValue', { m: data.meta.mastHeightM })}</dd>
            <dt className="caps">{t('detail.sources')}</dt>
            <dd>
              <ul>
                {data.meta.sources.map((src) => (
                  <li key={src}>{src}</li>
                ))}
              </ul>
            </dd>
            <dt className="caps">{t('detail.limitBestCase')}</dt>
            <dd>
              {t('covers.bestCaseTitle')} {t('covers.bestCase')}
            </dd>
            <dt className="caps">{t('detail.limitLink')}</dt>
            <dd>{t('detail.directOnly')}</dd>
            <dt className="caps">{t('detail.limitSignal')}</dt>
            <dd>{t('detail.signal')}</dd>
            <dt className="caps">{t('detail.limitRules')}</dt>
            <dd>{t('detail.teamRules')}</dd>
          </dl>
        </div>
      </details>
      <Footer />
    </div>
  );
}
