/**
 * What: Mission dashboard (main screen), layered (D35, D39): controls on top, the 3D view large on
 *   the left, five compact ranked cards on the right (the selected one expands); the year census,
 *   science x engineering scatter, data-year strips and mission rules sit in collapsible sections
 *   below. Composes components; no calculation.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { lastLandingDayMs } from '../calc/metrics';
import { bodyDirectionsAt } from '../calc/scene3d';
import { AnnualStrips } from '../components/AnnualStrips';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { InfoTip } from '../components/InfoTip';
import { Loading } from '../components/Loading';
import { MissionControls } from '../components/MissionControls';
import { MissionRulesPanel } from '../components/MissionRulesPanel';
import { NasaCheck } from '../components/NasaCheck';
import { ScatterPlot } from '../components/ScatterPlot';
import { ShadedMap } from '../components/ShadedMap';
import { SiteCard } from '../components/SiteCard';
import { SmallMove } from '../components/SmallMove';
import { Starfield } from '../components/Starfield';
import type { SiteData, SiteSummary, Terrain } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import { useEvaluations, usePrecomputed, type MissionInputs } from '../state/useMission';
import { useFlip } from '../ui/useFlip';
import { useMoreBelow } from '../ui/useMoreBelow';

const SouthPole3D = lazy(() => import('../components/SouthPole3D'));
/** Faint, still sky behind the panel (contrast checked in D41). */
const DASH_STAR_ALPHA = 0.1;

interface Props {
  sites: SiteSummary[];
  data: Map<string, SiteData>;
  /** Sites whose data file failed to load: shown as unavailable cards (D53). */
  unavailable: string[];
  terrain: Terrain;
  inputs: MissionInputs;
  onInputs: (patch: Partial<MissionInputs>) => void;
  onOpenSite: (id: string) => void;
}

export function Dashboard({
  sites,
  data,
  unavailable,
  terrain,
  inputs,
  onInputs,
  onOpenSite,
}: Props) {
  const { t } = useI18n();
  const pre = usePrecomputed(sites, data);
  const d = useEvaluations(pre, data, inputs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view3d, setView3d] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const focusId = selectedId ?? d.now.bestId;
  const lightSite = sites.find((s) => s.id === focusId) ?? d.ranked[0] ?? sites[0];
  const lightData = lightSite ? data.get(lightSite.id) : undefined;
  const lightDirs = useMemo(
    () =>
      lightSite && lightData
        ? { ...bodyDirectionsAt(lightSite, lightData, d.landingMs), horizon: lightData.horizon }
        : null,
    [lightSite, lightData, d.landingMs],
  );
  const { ref: sideRef, more: sideMore } = useMoreBelow<HTMLElement>();
  const flipRef = useFlip<HTMLLIElement>(d.now.order.join('|'));
  const anyMeta = data.values().next().value?.meta;
  const year = anyMeta ? String(new Date(anyMeta.startMs).getUTCFullYear()) : '';
  const sample = [...data.values()].some((x) => x.meta.sample);
  const outside = d.now.sites.find((e) => !e.ok);
  const bestName = sites.find((s) => s.id === d.now.bestId)?.name;
  const earliestName = sites.find((s) => s.id === d.earliest?.siteId)?.name;
  const px = Math.round(terrain.pixelM);
  const smallMove = useRef<HTMLDetailsElement>(null);
  const openSmallMove = () => {
    const el = smallMove.current;
    if (!el) return;
    el.open = true;
    el.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="app dash">
      <Starfield still maxAlpha={DASH_STAR_ALPHA} />
      <div className="dash-screen">
        <Header
          sample={sample}
          current="mission"
          dataScope={anyMeta ? { points: d.ranked.length, hours: anyMeta.count, year } : null}
        />
        {anyMeta && (
          <MissionControls
            inputs={inputs}
            landingMs={d.landingMs}
            dataStartMs={anyMeta.startMs}
            lastLandingDayMs={lastLandingDayMs(anyMeta, inputs.durationH)}
            onChange={onInputs}
          />
        )}
        {outside && !outside.ok && (
          <p className="warning" role="alert">
            {t('warn.outside', {
              days: inputs.durationH / 24,
              date: d.landingMs,
              start: outside.window.dataStartMs,
              end: outside.window.dataEndMs,
            })}
          </p>
        )}
        <p className="visually-hidden" aria-live="polite">
          {bestName ? t('aria.best', { site: bestName }) : t('aria.noBest')}
        </p>

        <div className="dash-main">
          <section className="stage" aria-label={t('section.map')}>
            <p className="stage-title caps">
              {t(view3d ? 'map.title3d' : 'map.title2d')}{' '}
              <InfoTip>
                {t('map.resolution', { px })} {t(view3d ? 'map.how3d' : 'map.how2d')}{' '}
                {t('map.numbersNote')} {t('map.demoNote')}
              </InfoTip>
            </p>
            {view3d && lightSite && lightDirs ? (
              <Suspense
                fallback={
                  <div className="scene3d fill">
                    <div className="scene3d-canvas scene3d-loading">
                      <Loading text={t('scene.loading')} />
                    </div>
                  </div>
                }
              >
                <SouthPole3D
                  terrain={terrain}
                  sites={sites}
                  selectedId={selectedId}
                  bestId={d.now.bestId}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                  onSelect={setSelectedId}
                  sun={lightDirs.sun}
                  earth={lightDirs.earth}
                  sunAzDeg={lightDirs.sunAzDeg}
                  sunElDeg={lightDirs.sunElDeg}
                  lightHorizon={lightDirs.horizon}
                  lightSiteName={lightSite.name}
                  outside={Boolean(outside)}
                  onUnavailable={() => setView3d(false)}
                />
              </Suspense>
            ) : (
              <ShadedMap
                terrain={terrain}
                sites={sites}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
            <p className="stage-note note">
              <span className="stage-actions">
                <button type="button" className="linkbtn" onClick={openSmallMove}>
                  {t('small.title')} ↓
                </button>
                <button type="button" className="linkbtn" onClick={() => setView3d((v) => !v)}>
                  {t(view3d ? 'map.show2d' : 'map.show3d')}
                </button>
              </span>
            </p>
          </section>

          <aside className={`dash-side${sideMore ? ' more-below' : ''}`} ref={sideRef}>
            <p className={`earliest${d.now.bestId === null ? ' warning' : ''}`} aria-live="polite">
              {d.now.bestId === null && !outside && <>{t('warn.noSite', { date: d.landingMs })} </>}
              <span className="caps">
                {t(inputs.delayDays > 0 ? 'earliest.after' : 'earliest.from')}
              </span>{' '}
              {d.earliest && earliestName
                ? t('earliest.value', {
                    site: earliestName,
                    date: d.earliest.window.startMs,
                    n: d.earliest.window.windowDays,
                  })
                : t('earliest.none')}
            </p>
            <ol className="cards" aria-label={t('cards.aria')}>
              {d.now.order.map((id, k) => {
                const site = d.ranked.find((s) => s.id === id);
                if (!site) return null;
                return (
                  <li key={id} ref={flipRef(id)}>
                    <SiteCard
                      // Remounts when the card becomes (or stops being) the best compromise, so
                      // its entrance highlight plays after a slip (D49).
                      key={id === d.now.bestId ? 'best' : 'other'}
                      site={site}
                      evaluation={d.now.sites.find((e) => e.siteId === id)}
                      next={d.next.has(id) ? (d.next.get(id) ?? null) : undefined}
                      rank={k + 1}
                      best={id === d.now.bestId}
                      expanded={id === selectedId}
                      linked={id === hoveredId}
                      rules={inputs.rules}
                      onHover={(on) => setHoveredId(on ? id : null)}
                      onSelect={() => setSelectedId(id)}
                      onOpen={() => onOpenSite(id)}
                    />
                  </li>
                );
              })}
              {sites
                .filter((s) => unavailable.includes(s.id) && s.purpose === null)
                .map((s) => (
                  <li key={s.id}>
                    <article className="card glass unavailable">
                      <h3>{s.name}</h3>
                      <p className="reason">{t('unavailable.card')}</p>
                    </article>
                  </li>
                ))}
            </ol>
            {sideMore && (
              <p className="more-hint" aria-hidden="true">
                ↓ {t('cards.more')}
              </p>
            )}
          </aside>
        </div>
      </div>

      <div className="more">
        <details className="section glass">
          <summary>
            {t('census.title', { year })}{' '}
            <InfoTip>{t('census.tip', { days: inputs.durationH / 24 })}</InfoTip>
          </summary>
          <ul className="indicators">
            {d.ranked.map((s) => (
              <li key={s.id}>
                <span className="big">{d.census.perSite.get(s.id)?.viable ?? 0}</span>
                <span className="caption">{s.name}</span>
              </li>
            ))}
            <li>
              <span className="big alert">{d.census.noViableDays}</span>
              <span className="caption">
                {t('census.noneShort', { total: d.census.daysInData })}
              </span>
            </li>
          </ul>
        </details>
        <details className="section glass">
          <summary>
            {t('scatter.title')}
            {inputs.delayDays !== 0 && ` · ${t('scatter.trail', { d: inputs.delayDays })}`}
          </summary>
          <p className="note">{t('scatter.legend')}</p>
          <div className="scatter-wrap">
            <ScatterPlot
              sites={d.ranked}
              now={d.now}
              planned={d.planned}
              rules={inputs.rules}
              delayDays={inputs.delayDays}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </details>
        <details className="section glass">
          <summary>{t('strips.title', { year })}</summary>
          <AnnualStrips
            sites={d.ranked}
            daily={d.daily}
            plannedMs={inputs.plannedMs}
            landingMs={d.landingMs}
            durationH={inputs.durationH}
            selectedId={selectedId}
          />
        </details>
        <details className="section glass" id="small-move" ref={smallMove}>
          <summary>{t('small.title')}</summary>
          <SmallMove
            sites={sites}
            data={data}
            landingDayMs={d.landingMs}
            durationH={inputs.durationH}
            rules={inputs.rules}
            sphereRadiusM={terrain.sphereRadiusM}
          />
        </details>
        <details className="section glass" id="nasa-check">
          <summary>{t('check.title')}</summary>
          <NasaCheck sites={sites} vis={pre.vis} year={year} />
        </details>
        <details className="section glass">
          <summary>{t('rules.title')}</summary>
          <MissionRulesPanel rules={inputs.rules} onChange={(rules) => onInputs({ rules })} />
        </details>
      </div>
      <Footer />
    </div>
  );
}
