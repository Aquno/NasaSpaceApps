/**
 * What: Stage 6 comparison table: for each site, % of 2027 hours with the Sun / the Earth
 *   visible (any part of the disc above the terrain horizon), computed by the app's calc module,
 *   beside NASA's 18.6-year averages (PGDA product 69) and their 3 x 3-pixel range. Nothing is
 *   tuned to bring the numbers closer.
 * Roadmap stage: 6 — Validation (see docs/ROTEIRO.md); decision D45.
 * Inputs: ../data/app (sites, series, horizon); ../data/validation/nasa_reference.json (3 x 3
 *   range, optional).
 * Outputs: Markdown on stdout (saved to data/validation/COMPARISON.md by the npm script).
 * NASA data source: JPL Horizons, LOLA (PGDA 90) and PGDA product 69.
 *
 * Usage: npm run report:nasa
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { yearVisibility } from '../src/calc/validation';
import { loadAppData } from './lib/app-data';

interface RefSite {
  site_id: string;
  nasa_avg_illumination_3x3_min_pct: number | null;
  nasa_avg_illumination_3x3_max_pct: number | null;
  nasa_avg_earth_visibility_3x3_min_pct: number | null;
  nasa_avg_earth_visibility_3x3_max_pct: number | null;
}

const REF = resolve(import.meta.dirname, '../../data/validation/nasa_reference.json');
const ref: RefSite[] = existsSync(REF)
  ? (JSON.parse(readFileSync(REF, 'utf-8')) as { sites: RefSite[] }).sites
  : [];

const { sites, vis, data } = loadAppData();
const f1 = (v: number | null | undefined) => (v === null || v === undefined ? 'n/a' : v.toFixed(1));
const diff = (a: number, b: number | null) => {
  if (b === null) return 'n/a';
  const d = Number((a - b).toFixed(1)) + 0; // + 0 turns -0 into 0
  return `${d > 0 ? '+' : ''}${d.toFixed(1)}`;
};
const range = (lo: number | null | undefined, hi: number | null | undefined) =>
  lo === null || lo === undefined || hi === null || hi === undefined
    ? 'n/a'
    : `${f1(lo)}–${f1(hi)}`;

let hours = 0;
const year = new Date(data.values().next().value?.meta.startMs ?? 0).getUTCFullYear();
console.log(`### Stage 6: our ${year} visibility vs NASA averages (PGDA product 69)\n`);
console.log(
  '| Site | Sun, ours (%) | Sun, NASA (%) | Difference (pts) | NASA 3×3 range | Earth, ours (%) | Earth, NASA (%) | Difference (pts) | NASA 3×3 range |',
);
console.log('|---|---:|---:|---:|---|---:|---:|---:|---|');
for (const s of sites) {
  const v = vis.get(s.id);
  if (!v) continue;
  const y = yearVisibility(v);
  hours = y.hours;
  const r = ref.find((x) => x.site_id === s.id);
  console.log(
    `| ${s.name}${s.purpose ? ' (demo)' : ''} | ${f1(y.sunPct)} | ${f1(s.nasaAvgIlluminationPct)} | ${diff(y.sunPct, s.nasaAvgIlluminationPct)} | ${range(r?.nasa_avg_illumination_3x3_min_pct, r?.nasa_avg_illumination_3x3_max_pct)} | ${f1(y.earthPct)} | ${f1(s.nasaAvgEarthVisibilityPct)} | ${diff(y.earthPct, s.nasaAvgEarthVisibilityPct)} | ${range(r?.nasa_avg_earth_visibility_3x3_min_pct, r?.nasa_avg_earth_visibility_3x3_max_pct)} |`,
  );
}
console.log(
  `\nOurs: share of the ${year} hourly records (${hours} per site) with any part of the disc above the terrain horizon (same visibility module as the app). NASA: share of hourly timesteps over 18.6 years with any fraction of the disc visible, on the 60 m map, at the pixel that contains the site; the 3×3 range shows how much the value changes within about 90 m.`,
);
