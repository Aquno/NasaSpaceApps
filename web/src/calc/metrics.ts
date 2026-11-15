/**
 * What: Mission metrics for one site, landing time and duration, from the visibility flags.
 *   Pure functions.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: SiteData (hourly series, horizon), visibility flags, landing time (ms UTC),
 *   mission duration (hours).
 * Outputs: MissionMetrics (hours, fractions 0-1, degrees) or an "outside data" result.
 * NASA data source: Horizons ephemerides and LOLA horizon via data/app.
 */
import { indexAtOrAfter, type SiteData } from '../data/contract';
import type { VisibilitySeries } from './visibility';

export interface MissionWindow {
  /** First record index (at or after landing). */
  start: number;
  /** Number of hourly records in the mission. */
  length: number;
}

export type WindowResult =
  | { ok: true; window: MissionWindow }
  | { ok: false; reason: 'before-data' | 'after-data'; dataStartMs: number; dataEndMs: number };

/** Records covered by a mission; refuses missions that leave the data interval. */
export function missionWindow(
  meta: SiteData['meta'],
  landingMs: number,
  durationHours: number,
): WindowResult {
  const start = indexAtOrAfter(meta, landingMs);
  const length = Math.round((durationHours * 60) / meta.stepMinutes);
  const fail = { dataStartMs: meta.startMs, dataEndMs: meta.endMs };
  if (start < 0) return { ok: false, reason: 'before-data', ...fail };
  if (start + length > meta.count) return { ok: false, reason: 'after-data', ...fail };
  return { ok: true, window: { start, length } };
}

const DAY_MS = 86_400_000;

/**
 * Last landing DAY (ms UTC at 00:00) whose whole mission fits in the data, with the same test as
 * missionWindow (D53): the date controls never offer a day whose mission runs past the data.
 */
export function lastLandingDayMs(meta: SiteData['meta'], durationHours: number): number {
  const stepMs = meta.stepMinutes * 60_000;
  const length = Math.round((durationHours * 60) / meta.stepMinutes);
  const lastStartMs = meta.startMs + (meta.count - length) * stepMs;
  return Math.floor(lastStartMs / DAY_MS) * DAY_MS;
}

/** Number of 1s in flags[start, start + length). */
export function countOn(flags: Uint8Array, start: number, length: number): number {
  let n = 0;
  for (let i = start; i < start + length; i++) n += flags[i] as number;
  return n;
}

/** Length of the run of 1s starting exactly at `start`, limited to `limit` records. */
export function runFrom(flags: Uint8Array, start: number, limit: number): number {
  let n = 0;
  while (n < limit && flags[start + n] === 1) n++;
  return n;
}

/** Longest run of 0s inside flags[start, start + length). */
export function longestOffRun(flags: Uint8Array, start: number, length: number): number {
  let best = 0;
  let current = 0;
  for (let i = start; i < start + length; i++) {
    current = flags[i] === 0 ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}

/**
 * Records from `index` until the body next sets (first 1 -> 0 transition at or after index).
 * If the body is down at `index`, the search continues through the next rise.
 * Returns null if no setting happens before the end of the data.
 */
export function recordsToNextSet(flags: Uint8Array, index: number): number | null {
  let i = index;
  while (i < flags.length && flags[i] === 0) i++;
  while (i < flags.length && flags[i] === 1) i++;
  return i < flags.length ? i - index : null;
}

/** Records from `index` until the body next rises (0 -> 1), or null beyond the data. */
export function recordsToNextRise(flags: Uint8Array, index: number): number | null {
  let i = index;
  while (i < flags.length && flags[i] === 1) i++;
  while (i < flags.length && flags[i] === 0) i++;
  return i < flags.length ? i - index : null;
}

export interface MissionMetrics {
  durationHours: number;
  /** Hours with some part of the Sun visible. */
  sunHours: number;
  /** Hours with the whole solar disc visible (secondary). */
  sunHoursFull: number;
  sunFraction: number;
  /** Continuous hours of sunlight from landing (0 if dark at landing), capped at the mission. */
  sunHoursFromLanding: number;
  /** Mean and max geometric solar elevation (ideal horizon) during the mission, degrees. */
  sunElMeanDeg: number;
  sunElMaxDeg: number;
  earthHours: number;
  earthHoursFull: number;
  earthFraction: number;
  /** Longest gap without Earth contact during the mission, hours. */
  longestNoContactHours: number;
  /** Hours from landing to the next sunset / Earth-set (null: not before the data ends). */
  hoursToNextSunset: number | null;
  hoursToNextEarthSet: number | null;
  sunVisibleAtLanding: boolean;
  earthVisibleAtLanding: boolean;
  /** Longest continuous period without any part of the Sun visible during the mission, hours. */
  longestDarkHours: number;
}

/** Metrics of a mission window. Hours assume the data step (60 min). */
export function missionMetrics(
  data: Pick<SiteData, 'series' | 'meta'>,
  vis: VisibilitySeries,
  window: MissionWindow,
): MissionMetrics {
  const { start, length } = window;
  const hoursPerRecord = data.meta.stepMinutes / 60;
  let elSum = 0;
  let elMax = -Infinity;
  for (let i = start; i < start + length; i++) {
    const el = data.series.sunEl[i] as number;
    elSum += el;
    if (el > elMax) elMax = el;
  }
  const sunOn = countOn(vis.sunAny, start, length);
  const earthOn = countOn(vis.earthAny, start, length);
  const toHours = (records: number | null) => (records === null ? null : records * hoursPerRecord);
  return {
    durationHours: length * hoursPerRecord,
    sunHours: sunOn * hoursPerRecord,
    sunHoursFull: countOn(vis.sunFull, start, length) * hoursPerRecord,
    sunFraction: sunOn / length,
    sunHoursFromLanding: runFrom(vis.sunAny, start, length) * hoursPerRecord,
    sunElMeanDeg: elSum / length,
    sunElMaxDeg: elMax,
    earthHours: earthOn * hoursPerRecord,
    earthHoursFull: countOn(vis.earthFull, start, length) * hoursPerRecord,
    earthFraction: earthOn / length,
    longestNoContactHours: longestOffRun(vis.earthAny, start, length) * hoursPerRecord,
    hoursToNextSunset: toHours(recordsToNextSet(vis.sunAny, start)),
    hoursToNextEarthSet: toHours(recordsToNextSet(vis.earthAny, start)),
    sunVisibleAtLanding: vis.sunAny[start] === 1,
    earthVisibleAtLanding: vis.earthAny[start] === 1,
    longestDarkHours: longestOffRun(vis.sunAny, start, length) * hoursPerRecord,
  };
}
