/**
 * What: React hook that loads sites.json, every sites/<id>.json and the terrain, exposing
 *   loading / error / ready states and a retry (D53). If only some site files fail, the others
 *   are ready and the failed sites are listed as unavailable. No calculation here.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: none (reads files through data/load.ts).
 * Outputs: LoadState with the validated data or the problems (file, network or contract).
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 */
import { useCallback, useEffect, useState } from 'react';
import type { SiteData, SiteSummary, Terrain } from './contract';
import {
  collectSiteData,
  loadSiteData,
  loadSites,
  loadTerrain,
  problemsOf,
  type DataProblem,
} from './load';

export type LoadState =
  | { status: 'loading' }
  | { status: 'error'; problems: DataProblem[] }
  | {
      status: 'ready';
      sites: SiteSummary[];
      data: Map<string, SiteData>;
      terrain: Terrain;
      /** Sites whose own data file failed; the rest of the app works without them. */
      unavailable: Map<string, DataProblem[]>;
    };

export function useSites(): { state: LoadState; retry: () => void } {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sites, terrain] = await Promise.all([loadSites(), loadTerrain()]);
        const results = await Promise.allSettled(sites.map((s) => loadSiteData(s.id)));
        const { data, unavailable } = collectSiteData(
          sites.map((s) => s.id),
          results,
        );
        if (cancelled) return;
        if (data.size === 0 && sites.length > 0) {
          setState({ status: 'error', problems: [...unavailable.values()].flat() });
        } else {
          setState({ status: 'ready', sites, data, terrain, unavailable });
        }
      } catch (err) {
        if (!cancelled) setState({ status: 'error', problems: problemsOf(err, 'data') });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);
  return { state, retry };
}
