/**
 * What: Mission dashboard (main screen): controls, map/3D, science x engineering scatter, five
 *   ranked cards, data-year strips and mission rules. Composes components; no calculation.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { lazy, Suspense, useMemo, useState } from 'react';
import { bodyDirectionsAt } from '../calc/scene3d';
import { AnnualStrips } from '../components/AnnualStrips';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { MissionControls } from '../components/MissionControls';
import { MissionRulesPanel } from '../components/MissionRulesPanel';
import { ScatterPlot } from '../components/ScatterPlot';
import { ShadedMap } from '../components/ShadedMap';
import { SiteCard } from '../components/SiteCard';
import { SiteFacts } from '../components/SiteFacts';
import type { SiteData, SiteSummary, Terrain } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import { useEvaluations, usePrecomputed, type MissionInputs } from '../state/useMission';
import { useFlip } from '../ui/useFlip';

const SouthPole3D = lazy(() => import('../components/SouthPole3D'));

interface Props {
  sites: SiteSummary[];
  data: Map<string, SiteData>;
  terrain: Terrain;
  inputs: MissionInputs;
  onInputs: (patch: Partial<MissionInputs>) => void;
  onOpenSite: (id: string) => void;
}

export function Dashboard({ sites, data, terrain, inputs, onInputs, onOpenSite }: Props) {
  const { t } = useI18n();
  const pre = usePrecomputed(sites, data);
  const d = useEvaluations(pre, data, inputs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view3d, setView3d] = useState(true);
  const lightSite =
    sites.find((s) => s.id === (selectedId ?? d.now.bestId)) ?? d.ranked[0] ?? sites[0];
  const lightData = lightSite ? data.get(lightSite.id) : undefined;
  const lightDirs = useMemo(
    () => (lightSite && lightData ? bodyDirectionsAt(lightSite, lightData, d.landingMs) : null),
    [lightSite, lightData, d.landingMs],
  );
  const flipRef = useFlip<HTMLLIElement>(d.now.order.join('|'));
  const anyMeta = data.values().next().value?.meta;
  const year = anyMeta ? String(new Date(anyMeta.startMs).getUTCFullYear()) : '';
  const sample = [...data.values()].some((x) => x.meta.sample);
  const outside = d.now.sites.find((e) => !e.ok);
  const bestName = sites.find((s) => s.id === d.now.bestId)?.name;
  const earliestName = sites.find((s) => s.id === d.earliest?.siteId)?.name;
  const px = Math.round(terrain.pixelM);

  return (
    <div className="app">
      <Header sample={sample} />
      {anyMeta && (
        <MissionControls
          inputs={inputs}
          landingMs={d.landingMs}
          dataStartMs={anyMeta.startMs}
          dataEndMs={anyMeta.endMs}
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

      <div className="top-row">
        <section className="panel" aria-label={t('section.map')}>
          <h2>{t(view3d ? 'map.title3d' : 'map.title2d', { px })}</h2>
          <div className={`map-row fill${view3d ? ' wide' : ''}`}>
            {view3d && lightSite && lightDirs ? (
              <Suspense fallback={<p className="note">{t('scene.loading')}</p>}>
                <SouthPole3D
                  terrain={terrain}
                  sites={sites}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  sun={lightDirs.sun}
                  earth={lightDirs.earth}
                  sunElDeg={lightDirs.sunElDeg}
                  lightSiteName={lightSite.name}
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
            <div className="map-side">
              <SiteFacts site={sites.find((s) => s.id === (selectedId ?? d.now.bestId))} />
              <p className="note">
                {t('map.demoNote')} {t(view3d ? 'map.how3d' : 'map.how2d')} {t('map.numbersNote')}
              </p>
              <button type="button" className="linkbtn" onClick={() => setView3d((v) => !v)}>
                {t(view3d ? 'map.show2d' : 'map.show3d')}
              </button>
            </div>
          </div>
        </section>
        <section className="panel" aria-label={t('section.scatter')}>
          <h2>
            {t('scatter.title')} · {t('scatter.legend')}
            {inputs.delayDays !== 0 && ` · ${t('scatter.trail', { d: inputs.delayDays })}`}
          </h2>
          <ScatterPlot
            sites={d.ranked}
            now={d.now}
            planned={d.planned}
            rules={inputs.rules}
            delayDays={inputs.delayDays}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>
      </div>

      <p className={`panel earliest ${d.now.bestId === null ? 'warning' : ''}`} aria-live="polite">
        {d.now.bestId === null && !outside && <>{t('warn.noSite', { date: d.landingMs })} </>}
        <strong>{t(inputs.delayDays > 0 ? 'earliest.after' : 'earliest.from')}:</strong>{' '}
        {d.earliest && earliestName
          ? t('earliest.value', {
              site: earliestName,
              date: d.earliest.window.startMs,
              n: d.earliest.window.windowDays,
            })
          : t('earliest.none')}
        <br />
        <span className="census">
          <strong>{t('census.title', { year, days: inputs.durationH / 24 })}:</strong>{' '}
          {d.ranked.map((s, k) => (
            <span key={s.id}>
              {k > 0 && ' · '}
              {t('census.site', { site: s.name, n: d.census.perSite.get(s.id)?.viable ?? 0 })}
            </span>
          ))}
          {' · '}
          <strong>
            {t('census.none', { n: d.census.noViableDays, total: d.census.daysInData })}
          </strong>
        </span>
      </p>
      <ol className="cards" aria-label={t('cards.aria')}>
        {d.now.order.map((id, k) => {
          const site = d.ranked.find((s) => s.id === id);
          if (!site) return null;
          return (
            <li key={id} ref={flipRef(id)}>
              <SiteCard
                site={site}
                evaluation={d.now.sites.find((e) => e.siteId === id)}
                next={d.next.has(id) ? (d.next.get(id) ?? null) : undefined}
                rank={k + 1}
                best={id === d.now.bestId}
                selected={id === selectedId}
                onSelect={() => setSelectedId(id)}
                onOpen={() => onOpenSite(id)}
              />
            </li>
          );
        })}
      </ol>

      <details className="panel section">
        <summary>{t('rules.title')}</summary>
        <MissionRulesPanel rules={inputs.rules} onChange={(rules) => onInputs({ rules })} />
      </details>
      <details className="panel section">
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
      <Footer />
    </div>
  );
}
