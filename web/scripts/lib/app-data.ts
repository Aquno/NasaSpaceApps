/**
 * What: Load and validate data/app for the report scripts (Node), with visibility precomputed.
 * Roadmap stage: 5 — Interface / 6 — Validation (see docs/ROTEIRO.md).
 * Inputs: ../data/app/sites.json and sites/<id>.json.
 * Outputs: sites, SiteData and VisibilitySeries maps.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { visibilitySeries, type VisibilitySeries } from '../../src/calc/visibility';
import type { SiteData, SiteSummary } from '../../src/data/contract';
import { parseSiteData, parseSites } from '../../src/data/validate';
import { en } from '../../src/i18n/en';
import { createTranslator } from '../../src/i18n/translate';

/** English translator for report text (verdict reasons are message keys, D38). */
export const EN = createTranslator(en, 'en');

export interface AppData {
  sites: SiteSummary[];
  data: Map<string, SiteData>;
  vis: Map<string, VisibilitySeries>;
}

const APP_DIR = resolve(import.meta.dirname, '../../../data/app');

export function loadAppData(): AppData {
  const read = (p: string): unknown => JSON.parse(readFileSync(resolve(APP_DIR, p), 'utf-8'));
  const parsed = parseSites(read('sites.json'));
  if (!parsed.ok) throw new Error(parsed.errors.join('\n'));
  const data = new Map<string, SiteData>();
  const vis = new Map<string, VisibilitySeries>();
  for (const s of parsed.value) {
    const file = `sites/${s.id}.json`;
    const r = parseSiteData(read(file), file, s.id);
    if (!r.ok) throw new Error(r.errors.join('\n'));
    data.set(s.id, r.value);
    vis.set(s.id, visibilitySeries(r.value));
  }
  return { sites: parsed.value, data, vis };
}

export const DAY_MS = 86_400_000;
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
