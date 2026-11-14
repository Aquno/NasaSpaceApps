/**
 * What: React hook that loads sites.json and every sites/<id>.json once, exposing
 *   loading / error / ready states. No calculation here.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: none (reads files through data/load.ts).
 * Outputs: LoadState with the validated data or the error details (file and field).
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 */
import { useEffect, useState } from 'react';
import type { SiteData, SiteSummary } from './contract';
import { DataError, loadSiteData, loadSites } from './load';

export type LoadState =
  | { status: 'loading' }
  | { status: 'error'; details: string[] }
  | { status: 'ready'; sites: SiteSummary[]; data: Map<string, SiteData> };

export function useSites(): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sites = await loadSites();
        const entries = await Promise.all(
          sites.map(async (s) => [s.id, await loadSiteData(s.id)] as const),
        );
        if (!cancelled) setState({ status: 'ready', sites, data: new Map(entries) });
      } catch (err) {
        const details = err instanceof DataError ? err.details : [String(err)];
        if (!cancelled) setState({ status: 'error', details });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}
