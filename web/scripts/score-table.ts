/**
 * What: Scores and verdicts of the ranked sites for a few landing dates (review aid), using the
 *   same calc module as the interface.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: ../data/app; mission duration (hours) and landing dates (UTC ISO) as arguments.
 * Outputs: Markdown table on stdout.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 *
 * Usage: npm run report:scores -- [durationHours] [ISO dates...]
 */
import { evaluateSites, rankedSites } from '../src/calc/evaluate';
import { loadAppData } from './lib/app-data';

const [durationArg, ...dateArgs] = process.argv.slice(2);
const duration = Number(durationArg ?? 336);
const dates = dateArgs.length
  ? dateArgs
  : ['2027-02-01T00:00:00Z', '2027-06-15T00:00:00Z', '2027-10-01T00:00:00Z'];

const { sites, data, vis } = loadAppData();
const ranked = rankedSites(sites);

for (const date of dates) {
  const ev = evaluateSites(ranked, data, vis, Date.parse(date), duration);
  console.log(`\n### Landing ${date.slice(0, 10)}, ${duration / 24} days\n`);
  console.log(
    '| Rank | Site | Eng | Sci | Verdict | Sun % | Longest dark (h) | Earth % | Longest gap (h) | Reason |',
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
      `| ${k + 1} | ${id}${star} | ${e.engineering.total.toFixed(0)} | ` +
        `${(e.science?.total ?? 0).toFixed(0)} | ${e.verdict.kind} | ` +
        `${(m.sunFraction * 100).toFixed(0)} | ${m.longestDarkHours} | ` +
        `${(m.earthFraction * 100).toFixed(0)} | ${m.longestNoContactHours} | ${e.verdict.reason} |`,
    );
  });
}
