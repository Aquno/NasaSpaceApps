/**
 * What: Print scores and verdicts of the ranked sites for a few landing dates (review aid),
 *   using the same calc module as the interface.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: ../data/app files; landing dates (UTC) and duration (hours) as arguments.
 * Outputs: Markdown table on stdout.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 *
 * Usage: npx tsx scripts/score-table.ts [durationHours] [ISO dates...]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateSites, rankedSites } from '../src/calc/evaluate';
import { visibilitySeries, type VisibilitySeries } from '../src/calc/visibility';
import type { SiteData } from '../src/data/contract';
import { parseSiteData, parseSites } from '../src/data/validate';

const app = resolve(import.meta.dirname, '../../data/app');
const read = (p: string): unknown => JSON.parse(readFileSync(resolve(app, p), 'utf-8'));

const [durationArg, ...dateArgs] = process.argv.slice(2);
const duration = Number(durationArg ?? 336);
const dates = dateArgs.length
  ? dateArgs
  : ['2027-02-01T00:00:00Z', '2027-06-15T00:00:00Z', '2027-10-01T00:00:00Z'];

const parsed = parseSites(read('sites.json'));
if (!parsed.ok) throw new Error(parsed.errors.join('\n'));
const sites = rankedSites(parsed.value);
const data = new Map<string, SiteData>();
const vis = new Map<string, VisibilitySeries>();
for (const s of parsed.value) {
  const r = parseSiteData(read(`sites/${s.id}.json`), s.id, s.id);
  if (!r.ok) throw new Error(r.errors.join('\n'));
  data.set(s.id, r.value);
  vis.set(s.id, visibilitySeries(r.value));
}

for (const date of dates) {
  const ev = evaluateSites(sites, data, vis, Date.parse(date), duration);
  console.log(`\n### Landing ${date.slice(0, 10)}, ${duration / 24} days\n`);
  console.log(
    '| Rank | Site | Eng | Sci | Verdict | Sun % | Sun from landing (h) | Earth % | Longest gap (h) | Reason |',
  );
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  ev.order.forEach((id, k) => {
    const e = ev.sites.find((x) => x.siteId === id);
    if (!e) return;
    if (!e.ok) {
      console.log(`| ${k + 1} | ${id} | - | - | - | | | | | outside data (${e.window.reason}) |`);
      return;
    }
    const m = e.metrics;
    const star = id === ev.bestId ? ' **(best)**' : '';
    console.log(
      `| ${k + 1} | ${id}${star} | ${e.engineering.total.toFixed(0)} | ${(e.science?.total ?? 0).toFixed(0)} | ${e.verdict.kind} | ` +
        `${(m.sunFraction * 100).toFixed(0)} | ${m.sunHoursFromLanding} | ${(m.earthFraction * 100).toFixed(0)} | ${m.longestNoContactHours} | ${e.verdict.reason} |`,
    );
  });
}
