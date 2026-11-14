/**
 * What: For each ranked site, how many landing days of 2027 (00:00 UTC) give a viable, marginal
 *   or not-viable verdict for a mission of the given duration, and how many leave the data.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: ../data/app; mission duration in hours (default 336 = 14 days).
 * Outputs: Markdown table on stdout.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 *
 * Usage: npm run report:census -- [durationHours]
 */
import { evaluateSite, evaluateSites, rankedSites } from '../src/calc/evaluate';
import { DAY_MS, loadAppData } from './lib/app-data';

const duration = Number(process.argv[2] ?? 336);
const { sites, data, vis } = loadAppData();
const first = Date.parse('2027-01-01T00:00:00Z');
const days = 365;

console.log(
  `\n### Landing days in 2027 by verdict (${duration / 24}-day mission, landing 00:00 UTC)\n`,
);
console.log(
  '| Site | Viable | Marginal | Not viable | Mission leaves data | Most common not-viable rule |',
);
console.log('|---|---|---|---|---|---|');
for (const site of rankedSites(sites)) {
  const d = data.get(site.id);
  const v = vis.get(site.id);
  if (!d || !v) continue;
  const counts = { viable: 0, marginal: 0, 'not-viable': 0, outside: 0 };
  const rules = new Map<string, number>();
  for (let k = 0; k < days; k++) {
    const e = evaluateSite(site, d, v, first + k * DAY_MS, duration);
    if (!e.ok) {
      counts.outside++;
      continue;
    }
    counts[e.verdict.kind]++;
    if (e.verdict.kind === 'not-viable')
      rules.set(e.verdict.rule, (rules.get(e.verdict.rule) ?? 0) + 1);
  }
  const top = [...rules.entries()].sort((a, b) => b[1] - a[1])[0];
  console.log(
    `| ${site.id} | ${counts.viable} | ${counts.marginal} | ${counts['not-viable']} | ` +
      `${counts.outside} | ${top ? `${top[0]} (${top[1]})` : '-'} |`,
  );
}

// Best compromise per landing day (all ranked sites together).
const bestCount = new Map<string, number>();
let inData = 0;
for (let k = 0; k < days; k++) {
  const ev = evaluateSites(rankedSites(sites), data, vis, first + k * DAY_MS, duration);
  if (ev.sites.some((s) => !s.ok)) continue;
  inData++;
  const key = ev.bestId ?? '(no site qualifies)';
  bestCount.set(key, (bestCount.get(key) ?? 0) + 1);
}
console.log(`\n### Best compromise per landing day (${inData} days with full data)\n`);
console.log('| Best compromise | Days |');
console.log('|---|---|');
for (const [id, n] of [...bestCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`| ${id} | ${n} |`);
}
