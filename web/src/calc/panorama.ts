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
