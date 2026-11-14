/**
 * What: Fetch and validate the data files (the only network access of the app).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: files under `${import.meta.env.BASE_URL}data/` (copied from data/app by sync-data, D10).
 * Outputs: SiteSummary[] and SiteData per id, or an error naming the file and field.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 */
import type { SiteData, SiteSummary } from './contract';
import { parseSiteData, parseSites } from './validate';

export class DataError extends Error {
  constructor(readonly details: string[]) {
    super(details.join('\n'));
  }
}

const dataUrl = (path: string): string => `${import.meta.env.BASE_URL}data/${path}`;

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(dataUrl(path));
  if (!response.ok) throw new DataError([`${path}: HTTP ${response.status}`]);
  try {
    return await response.json();
  } catch {
    throw new DataError([`${path}: not valid JSON`]);
  }
}

/** Load and validate sites.json. */
export async function loadSites(): Promise<SiteSummary[]> {
  const result = parseSites(await fetchJson('sites.json'));
  if (!result.ok) throw new DataError(result.errors);
  return result.value;
}

/** Load and validate sites/<id>.json. */
export async function loadSiteData(id: string): Promise<SiteData> {
  const file = `sites/${id}.json`;
  const result = parseSiteData(await fetchJson(file), file, id);
  if (!result.ok) throw new DataError(result.errors);
  return result.value;
}
