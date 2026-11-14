/**
 * What: Geometry helpers for the 360° horizon panorama and the mission timeline of the site
 *   detail: elevation range to show, Sun/Earth paths split where they cross azimuth 0/360,
 *   on/off runs of a visibility flag series, and the integer vertical exaggeration that fits.
 *   Pure functions; the visibility rule itself stays in visibility.ts (D9).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D42.
 * Inputs: horizon[360] (deg), Sun/Earth azimuth/elevation series (deg, topocentric, azimuth from
 *   north clockwise), record indices of the mission window.
 * NASA data source: Horizons ephemerides and LOLA horizon via data/app.
 */

export interface AzEl {
  az: number;
  el: number;
}

/** Azimuth jump (deg) above which two consecutive samples are drawn as separate segments. */
const WRAP_JUMP_DEG = 180;

/**
 * Path of a body over records [start, start + length), split into segments wherever it crosses
 * azimuth 0/360 (so the line does not run across the whole panorama). Degrees.
 */
export function trackSegments(
  az: ArrayLike<number>,
  el: ArrayLike<number>,
  start: number,
  length: number,
): AzEl[][] {
  const segments: AzEl[][] = [];
  let current: AzEl[] = [];
  for (let i = start; i < start + length && i < az.length; i++) {
    const p = { az: az[i] as number, el: el[i] as number };
    const prev = current[current.length - 1];
    if (prev && Math.abs(p.az - prev.az) > WRAP_JUMP_DEG) {
      segments.push(current);
      current = [];
    }
    current.push(p);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

/**
 * Elevation range (deg) covering the horizon and the given paths, plus a margin, rounded out to
 * whole degrees.
 */
export function elevationRange(
  horizon: ArrayLike<number>,
  paths: AzEl[][],
  marginDeg: number,
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < horizon.length; i++) {
    const h = horizon[i] as number;
    if (h < min) min = h;
    if (h > max) max = h;
  }
  for (const seg of paths) {
    for (const p of seg) {
      if (p.el < min) min = p.el;
      if (p.el > max) max = p.el;
    }
  }
  return { min: Math.floor(min - marginDeg), max: Math.ceil(max + marginDeg) };
}

/**
 * Whole-number vertical exaggeration so that `rangeDeg` of elevation fills about `heightPx` when
 * one degree of azimuth is `pxPerDeg` wide. At least 1.
 */
export function fitExaggeration(rangeDeg: number, heightPx: number, pxPerDeg: number): number {
  if (rangeDeg <= 0 || pxPerDeg <= 0) return 1;
  return Math.max(1, Math.floor(heightPx / (rangeDeg * pxPerDeg)));
}

export interface Run {
  /** First record offset from the mission start. */
  from: number;
  /** Number of records. */
  length: number;
  on: boolean;
}

/** Consecutive on/off runs of flags[start, start + length), offsets relative to start. */
export function flagRuns(flags: ArrayLike<number>, start: number, length: number): Run[] {
  const runs: Run[] = [];
  for (let k = 0; k < length; k++) {
    const on = flags[start + k] === 1;
    const last = runs[runs.length - 1];
    if (last && last.on === on) last.length++;
    else runs.push({ from: k, length: 1, on });
  }
  return runs;
}

export interface TrackRun {
  /** True where the body (any part of the disc) is above the terrain horizon. */
  visible: boolean;
  points: AzEl[];
}

/**
 * Path of a body over records [start, start + length), split into runs of equal visibility
 * (flags: 1 visible, 0 hidden; from calc/visibility.ts) and wherever it crosses azimuth 0/360.
 * A run that starts because the visibility changed repeats the previous point, so the line is
 * continuous. Degrees.
 */
export function trackRuns(
  az: ArrayLike<number>,
  el: ArrayLike<number>,
  flags: ArrayLike<number>,
  start: number,
  length: number,
): TrackRun[] {
  const runs: TrackRun[] = [];
  let current: TrackRun | null = null;
  let prev: AzEl | null = null;
  for (let i = start; i < start + length && i < az.length; i++) {
    const p = { az: az[i] as number, el: el[i] as number };
    const visible = flags[i] === 1;
    const wrapped = prev !== null && Math.abs(p.az - prev.az) > WRAP_JUMP_DEG;
    if (!current || wrapped || current.visible !== visible) {
      current = { visible, points: prev && !wrapped ? [prev, p] : [p] };
      runs.push(current);
    } else {
      current.points.push(p);
    }
    prev = p;
  }
  return runs;
}

export interface TrackEvent {
  kind: 'rise' | 'set';
  /** Record offset from the mission start. */
  offset: number;
  az: number;
  el: number;
}

/** Rises (0 -> 1) and sets (1 -> 0) of a body inside records (start, start + length). */
export function trackEvents(
  az: ArrayLike<number>,
  el: ArrayLike<number>,
  flags: ArrayLike<number>,
  start: number,
  length: number,
): TrackEvent[] {
  const events: TrackEvent[] = [];
  for (let i = start + 1; i < start + length && i < flags.length; i++) {
    if (flags[i] === flags[i - 1]) continue;
    events.push({
      kind: flags[i] === 1 ? 'rise' : 'set',
      offset: i - start,
      az: az[i] as number,
      el: el[i] as number,
    });
  }
  return events;
}
