/**
 * What: Mission dashboard (main screen): controls, map, science x engineering scatter, five
 *   ranked cards, 2027 strips and mission rules. Composes components; no calculation.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useState } from 'react';
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
import { useEvaluations, usePrecomputed, type MissionInputs } from '../state/useMission';
import { fmtDate } from '../ui/format';
import { useFlip } from '../ui/useFlip';

interface Props {
  sites: SiteSummary[];
  data: Map<string, SiteData>;
  terrain: Terrain;
  inputs: MissionInputs;
  onInputs: (patch: Partial<MissionInputs>) => void;
  onOpenSite: (id: string) => void;
}

export function Dashboard({ sites, data, terrain, inputs, onInputs, onOpenSite }: Props) {
  const pre = usePrecomputed(sites, data);
  const d = useEvaluations(pre, data, inputs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const flipRef = useFlip<HTMLLIElement>(d.now.order.join('|'));
  const anyMeta = data.values().next().value?.meta;
  const sample = [...data.values()].some((x) => x.meta.sample);
  const outside = d.now.sites.find((e) => !e.ok);
  const bestName = sites.find((s) => s.id === d.now.bestId)?.name;

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
          The mission ({inputs.durationH / 24} days from {fmtDate(d.landingMs)}) runs past the data,
          which cover {fmtDate(outside.window.dataStartMs)} to {fmtDate(outside.window.dataEndMs)}.
          Results are not computed with incomplete data.
        </p>
      )}
      <p className="visually-hidden" aria-live="polite">
        {bestName ? `Best compromise: ${bestName}` : 'No site qualifies with these rules.'}
      </p>

      <div className="top-row">
        <section className="panel" aria-label="South pole map">
          <h2>South pole · shaded relief (LOLA, visual only)</h2>
          <div className="map-row fill">
            <ShadedMap
              terrain={terrain}
              sites={sites}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <div className="map-side">
              <SiteFacts site={sites.find((s) => s.id === (selectedId ?? d.now.bestId))} />
              <p className="note">
                ○ hollow marker: Shackleton inner wall, kept to show how much the exact position
                matters. Relief {terrain.pixelM.toFixed(0)} m/pixel, static light; numbers come from
                the horizon calculation, not from this shading.
              </p>
            </div>
          </div>
        </section>
        <section className="panel" aria-label="Science versus engineering">
          <h2>
            Science × engineering · ● meets the hard rules ○ not viable
            {inputs.delayDays !== 0 &&
              ` · faint ring = planned date, line = move with +${inputs.delayDays} d`}
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

      {d.now.bestId === null && !outside && (
        <p className="warning">No site meets the mission rules for this date: see each reason.</p>
      )}
      <ol className="cards" aria-label="Sites ranked for this mission">
        {d.now.order.map((id, k) => {
          const site = d.ranked.find((s) => s.id === id);
          if (!site) return null;
          return (
            <li key={id} ref={flipRef(id)}>
              <SiteCard
                site={site}
                evaluation={d.now.sites.find((e) => e.siteId === id)}
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

      <MissionRulesPanel rules={inputs.rules} onChange={(rules) => onInputs({ rules })} />

      <AnnualStrips
        sites={d.ranked}
        daily={d.daily}
        plannedMs={inputs.plannedMs}
        landingMs={d.landingMs}
        durationH={inputs.durationH}
        selectedId={selectedId}
      />
      <Footer />
    </div>
  );
}
