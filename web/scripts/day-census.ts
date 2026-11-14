/**
 * What: For each ranked site, how many landing days of the data year (00:00 UTC) give a viable,
 *   marginal or not-viable verdict, on how many days no site is viable, and how often each site
 *   is the best compromise. Same calc module as the interface (calc/census.ts, calc/evaluate.ts).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: ../data/app; mission duration in hours (default 336 = 14 days).
 * Outputs: Markdown tables on stdout.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 *
 * Usage: npm run report:census -- [durationHours]
 */
import { landingCensus } from '../src/calc/census';
import { evaluateSites, rankedSites } from '../src/calc/evaluate';
import { DAY_MS, loadAppData } from './lib/app-data';

const duration = Number(process.argv[2] ?? 336);
const { sites, data, vis } = loadAppData();
const ranked = rankedSites(sites);
const census = landingCensus(ranked, data, vis, duration);

console.log(
  `\n### Landing days by verdict (${duration / 24}-day mission, landing 00:00 UTC, ` +
    `${census.daysInData} landing days whose mission fits in the data)\n`,
);
console.log('| Site | Viable | Marginal | Not viable |');
console.log('|---|---|---|---|');
for (const s of ranked) {
  const c = census.perSite.get(s.id);
  if (c) console.log(`| ${s.id} | ${c.viable} | ${c.marginal} | ${c['not-viable']} |`);
}
console.log(`\nDays on which no site is viable: ${census.noViableDays}`);

const first = data.values().next().value?.meta.startMs ?? 0;
const bestCount = new Map<string, number>();
for (let k = 0; k < census.daysInData; k++) {
  const ev = evaluateSites(ranked, data, vis, first + k * DAY_MS, duration);
  const key = ev.bestId ?? '(no site qualifies)';
  bestCount.set(key, (bestCount.get(key) ?? 0) + 1);
}
console.log(`\n### Best compromise per landing day (${census.daysInData} days)\n`);
console.log('| Best compromise | Days |');
console.log('|---|---|');
for (const [id, n] of [...bestCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`| ${id} | ${n} |`);
}
