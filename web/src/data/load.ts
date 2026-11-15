/**
 * What: Fetch and validate the data files (the only network access of the app). Failures are
 *   classified (D53): "network" when a file cannot be downloaded (no response or an HTTP error)
 *   and "contract" when it was downloaded but is not valid JSON or does not match the contract.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: files under `${import.meta.env.BASE_URL}data/` (copied from data/app by sync-data, D10).
 * Outputs: SiteSummary[] and SiteData per id, or a DataError naming the file and the problem.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 */
import type { SiteData, SiteSummary, Terrain } from './contract';
import { parseSiteData, parseSites, parseTerrain } from './validate';

/** One problem with one data file. */
export type DataProblem =
  | {
      kind: 'network';
      file: string;
      /** HTTP status, or null when there was no response. */
      status: number | null;
    }
  | {
      kind: 'contract';
      file: string;
      /** Technical detail (field and rule). */
      detail: string;
    };

export class DataError extends Error {
  constructor(readonly problems: DataProblem[]) {
    super(problems.map((p) => `${p.file}: ${p.kind}`).join('\n'));
  }
}

const dataUrl = (path: string): string => `${import.meta.env.BASE_URL}data/${path}`;

async function fetchOk(path: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(dataUrl(path));
  } catch {
    throw new DataError([{ kind: 'network', file: path, status: null }]);
  }
  if (!response.ok) throw new DataError([{ kind: 'network', file: path, status: response.status }]);
  return response;
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetchOk(path);
  try {
    return await response.json();
  } catch {
    throw new DataError([{ kind: 'contract', file: path, detail: 'not valid JSON' }]);
  }
}

const contractError = (file: string, errors: string[]) =>
  new DataError(errors.map((detail) => ({ kind: 'contract', file, detail })));

/** Load and validate sites.json. */
export async function loadSites(): Promise<SiteSummary[]> {
  const result = parseSites(await fetchJson('sites.json'));
  if (!result.ok) throw contractError('sites.json', result.errors);
  return result.value;
}

/** Load and validate sites/<id>.json. */
export async function loadSiteData(id: string): Promise<SiteData> {
  const file = `sites/${id}.json`;
  const result = parseSiteData(await fetchJson(file), file, id);
  if (!result.ok) throw contractError(file, result.errors);
  return result.value;
}

/** Load and validate terrain.json + terrain.bin (map views only). */
export async function loadTerrain(): Promise<Terrain> {
  const json = await fetchJson('terrain.json');
  const response = await fetchOk('terrain.bin');
  const result = parseTerrain(json, await response.arrayBuffer());
  if (!result.ok) throw contractError('terrain.json', result.errors);
  return result.value;
}

/**
 * Split the per-site load results (D53): loaded data by id, and the problems of the sites whose
 * file failed, so one bad file does not stop the others.
 */
export function collectSiteData(
  ids: string[],
  results: PromiseSettledResult<SiteData>[],
): { data: Map<string, SiteData>; unavailable: Map<string, DataProblem[]> } {
  const data = new Map<string, SiteData>();
  const unavailable = new Map<string, DataProblem[]>();
  results.forEach((r, k) => {
    const id = ids[k];
    if (id === undefined) return;
    if (r.status === 'fulfilled') data.set(id, r.value);
    else unavailable.set(id, problemsOf(r.reason, `sites/${id}.json`));
  });
  return { data, unavailable };
}

/** Problems carried by an unknown thrown value (anything unexpected counts as a contract issue). */
export function problemsOf(err: unknown, file: string): DataProblem[] {
  return err instanceof DataError
    ? err.problems
    : [{ kind: 'contract', file, detail: String(err) }];
}
