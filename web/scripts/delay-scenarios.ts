/**
 * What: Search demo scenarios: landing days where a delay changes the best compromise from one
 *   site to another, or changes the verdict of the best site. Lists the clearest cases.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: ../data/app; delay in days (default 21), mission hours (default 336), number of cases.
 * Outputs: Markdown on stdout with scores before and after.
 * NASA data source: files built from JPL Horizons and PGDA products 69/90.
 *
 * Clarity (for ranking only): drop of the previous best site's min(eng, sci) after the delay,
 * plus the gain of the new best site, plus 50 if the previous best becomes not viable. Cases are
 * at least MIN_GAP_DAYS apart so the list is not one event repeated.
 *
 * Usage: npm run report:delay -- [delayDays] [durationHours] [count]
 */
import {
  evaluateSites,
  rankedSites,
  type Evaluation,
  type SiteEvaluation,
} from '../src/calc/evaluate';
import { earliestViableSite, nextViableWindow } from '../src/calc/nextViable';
import { DAY_MS, EN, isoDay, loadAppData } from './lib/app-data';

const delayDays = Number(process.argv[2] ?? 21);
const duration = Number(process.argv[3] ?? 336);
const wanted = Number(process.argv[4] ?? 5);
const MIN_GAP_DAYS = 10;
const NOT_VIABLE_BONUS = 50;

const { sites, data, vis } = loadAppData();
const ranked = rankedSites(sites);
const first = Date.parse('2027-01-01T00:00:00Z');

const find = (ev: Evaluation, id: string | null) =>
  ev.sites.find((s): s is Extract<SiteEvaluation, { ok: true }> => s.ok && s.siteId === id);
const minScore = (e: Extract<SiteEvaluation, { ok: true }> | undefined) =>
  e ? Math.min(e.engineering.total, e.science?.total ?? 0) : 0;
const fmt = (e: Extract<SiteEvaluation, { ok: true }> | undefined) =>
  e
    ? `eng ${e.engineering.total.toFixed(0)} / sci ${(e.science?.total ?? 0).toFixed(0)} / ${e.verdict.kind}`
    : 'no site qualifies';

interface Case {
  day: number;
  /** 0: best moves between two sites; 1: best site changes verdict; 2: best becomes none or appears. */
  category: number;
  kind: string;
  clarity: number;
  lines: string[];
}

const cases: Case[] = [];
for (let k = 0; k < 365; k++) {
  const t0 = first + k * DAY_MS;
  const t1 = t0 + delayDays * DAY_MS;
  const before = evaluateSites(ranked, data, vis, t0, duration);
  const after = evaluateSites(ranked, data, vis, t1, duration);
  if (after.sites.some((s) => !s.ok) || before.sites.some((s) => !s.ok)) continue;
  const b0 = before.bestId;
  const b1 = after.bestId;
  const prevBefore = find(before, b0);
  const prevAfter = find(after, b0);
  if (b0 !== b1) {
    const newBefore = find(before, b1);
    const newAfter = find(after, b1);
    const clarity =
      minScore(prevBefore) -
      minScore(prevAfter) +
      (minScore(newAfter) - minScore(newBefore)) +
      (prevAfter?.verdict.kind === 'not-viable' ? NOT_VIABLE_BONUS : 0);
    cases.push({
      day: k,
      category: b0 && b1 ? 0 : 2,
      kind: `best compromise changes: ${b0 ?? 'none'} -> ${b1 ?? 'none'}`,
      clarity,
      lines: [
        `${b0 ?? 'none'}: before ${fmt(prevBefore)}; after ${fmt(prevAfter)}${prevAfter ? ` — ${EN.msg(prevAfter.verdict.reason)}` : ''}`,
        `${b1 ?? 'none'}: before ${fmt(newBefore)}; after ${fmt(newAfter)}`,
      ],
    });
  } else if (b0 && prevBefore && prevAfter && prevBefore.verdict.kind !== prevAfter.verdict.kind) {
    cases.push({
      day: k,
      category: 1,
      kind: `best site ${b0} changes verdict`,
      clarity: Math.abs(minScore(prevBefore) - minScore(prevAfter)),
      lines: [
        `${b0}: before ${fmt(prevBefore)}; after ${fmt(prevAfter)} — ${EN.msg(prevAfter.verdict.reason)}`,
      ],
    });
  }
}

const byCategory = [0, 1, 2].map((k) => cases.filter((c) => c.category === k).length);
const chosen: Case[] = [];
for (const c of [...cases].sort((a, b) => a.category - b.category || b.clarity - a.clarity)) {
  if (chosen.every((x) => Math.abs(x.day - c.day) >= MIN_GAP_DAYS)) chosen.push(c);
  if (chosen.length >= wanted) break;
}

console.log(
  `\n### Delay scenarios: +${delayDays} days, ${duration / 24}-day mission ` +
    `(${cases.length} landing days with a change: ${byCategory[0]} site-to-site, ` +
    `${byCategory[1]} verdict of the same best site, ${byCategory[2]} to or from no qualifying ` +
    `site; ${chosen.length} clearest shown, site-to-site first)\n`,
);
chosen.forEach((c, i) => {
  const t0 = first + c.day * DAY_MS;
  console.log(
    `${i + 1}. **Planned ${isoDay(t0)} -> delayed ${isoDay(t0 + delayDays * DAY_MS)}**: ${c.kind} (clarity ${c.clarity.toFixed(0)})`,
  );
  for (const line of c.lines) console.log(`   - ${line}`);
});

// ---- After the delay, does another site reopen (become viable) before Shackleton rim? ----
const REFERENCE_SITE = 'shackleton-rim';
const refSite = ranked.find((s) => s.id === REFERENCE_SITE);
interface Reopen {
  day: number;
  siteId: string;
  siteStart: number;
  siteWindow: number;
  refStart: number | null;
  refWindow: number;
  gainDays: number;
}
const reopens: Reopen[] = [];
const refData = data.get(REFERENCE_SITE);
const refVis = vis.get(REFERENCE_SITE);
if (refSite && refData && refVis) {
  for (let k = 0; k < 365; k++) {
    const t1 = first + (k + delayDays) * DAY_MS;
    const earliest = earliestViableSite(ranked, data, vis, t1, duration);
    if (!earliest || earliest.siteId === REFERENCE_SITE) continue;
    const ref = nextViableWindow(refSite, refData, refVis, t1, duration);
    if (ref && ref.startMs <= earliest.window.startMs) continue;
    reopens.push({
      day: k,
      siteId: earliest.siteId,
      siteStart: earliest.window.startMs,
      siteWindow: earliest.window.windowDays,
      refStart: ref?.startMs ?? null,
      refWindow: ref?.windowDays ?? 0,
      gainDays: ref ? (ref.startMs - earliest.window.startMs) / DAY_MS : 365,
    });
  }
}
const reopenChosen: Reopen[] = [];
for (const r of [...reopens].sort((a, b) => b.gainDays - a.gainDays)) {
  if (reopenChosen.every((x) => Math.abs(x.day - r.day) >= MIN_GAP_DAYS)) reopenChosen.push(r);
  if (reopenChosen.length >= wanted) break;
}
const reopenSites = new Map<string, number>();
for (const r of reopens) reopenSites.set(r.siteId, (reopenSites.get(r.siteId) ?? 0) + 1);
console.log(
  `\n### After +${delayDays} days, another site reopens before ${REFERENCE_SITE} ` +
    `(${reopens.length} planned landing days; by site: ` +
    `${[...reopenSites.entries()].map(([id, n]) => `${id} ${n}`).join(', ') || 'none'})\n`,
);
reopenChosen.forEach((r, i) => {
  const t0 = first + r.day * DAY_MS;
  const ref =
    r.refStart === null
      ? `${REFERENCE_SITE}: no viable landing left in the data`
      : `${REFERENCE_SITE}: next viable ${isoDay(r.refStart)} (window ${r.refWindow} d)`;
  console.log(
    `${i + 1}. **Planned ${isoDay(t0)} -> delayed ${isoDay(t0 + delayDays * DAY_MS)}**: ` +
      `${r.siteId} viable from ${isoDay(r.siteStart)} (window ${r.siteWindow} d); ${ref}`,
  );
});
