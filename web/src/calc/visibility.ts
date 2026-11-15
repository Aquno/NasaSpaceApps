/**
 * What: THE visibility rule (the only place it exists, D9): is the Sun or the Earth above the
 *   terrain horizon? Pure functions.
 * Roadmap stage: 5 — Interface; reused by stage 6 (see docs/ROTEIRO.md).
 * Inputs: body azimuth, elevation and angular diameter (degrees) and the 360-value horizon.
 * Outputs: visibility flags.
 * NASA data source: Horizons ephemerides and LOLA horizon via data/app.
 *
 * Rule (D19, D24): the body's azimuth is rounded to the whole degree, matching horizon[i] = max
 * of the terrain over [i - 0.5, i + 0.5). The horizon may be negative; it is never clamped.
 * - "any part visible": top of the disc above the horizon  (el + diam/2 > h) — same convention
 *   as NASA's illumination maps ("any fraction of the disc").
 * - "fully visible":    bottom of the disc above the horizon (el - diam/2 > h).
 * Simplification: only the horizon at the disc centre's azimuth is used.
 */
import type { SiteData } from '../data/contract';

export const DEGREES_PER_TURN = 360;

/** Horizon bin (0-359) for an azimuth in degrees. */
export function azimuthBin(azDeg: number): number {
  const bin = ((Math.round(azDeg) % DEGREES_PER_TURN) + DEGREES_PER_TURN) % DEGREES_PER_TURN;
  return bin === 0 ? 0 : bin; // normalise -0 to 0
}

/** Horizon elevation (degrees) in the direction of an azimuth (degrees). */
export function horizonAt(horizon: ArrayLike<number>, azDeg: number): number {
  return horizon[azimuthBin(azDeg)] as number;
}

/**
 * Clearance (degrees) of the disc centre above the terrain horizon in its direction; negative
 * when the centre is below the terrain. Display aid (D52): visibility itself uses the disc rule.
 */
export function clearanceDeg(horizon: ArrayLike<number>, azDeg: number, elDeg: number): number {
  return elDeg - horizonAt(horizon, azDeg);
}

/** True if some part of a disc (centre az/el, diameter, degrees) is above the horizon. */
export function isAnyPartVisible(
  horizon: ArrayLike<number>,
  azDeg: number,
  elDeg: number,
  diamDeg: number,
): boolean {
  return elDeg + diamDeg / 2 > horizonAt(horizon, azDeg);
}

/** True if the whole disc is above the horizon. */
export function isFullyVisible(
  horizon: ArrayLike<number>,
  azDeg: number,
  elDeg: number,
  diamDeg: number,
): boolean {
  return elDeg - diamDeg / 2 > horizonAt(horizon, azDeg);
}

export interface VisibilitySeries {
  /** 1 where some part of the Sun is visible, per hourly record. */
  sunAny: Uint8Array;
  sunFull: Uint8Array;
  earthAny: Uint8Array;
  earthFull: Uint8Array;
}

/** Visibility flags for every record of a site (whole data interval). */
export function visibilitySeries(data: Pick<SiteData, 'horizon' | 'series'>): VisibilitySeries {
  const { horizon, series: s } = data;
  const n = s.sunAz.length;
  const out: VisibilitySeries = {
    sunAny: new Uint8Array(n),
    sunFull: new Uint8Array(n),
    earthAny: new Uint8Array(n),
    earthFull: new Uint8Array(n),
  };
  for (let i = 0; i < n; i++) {
    const sa = s.sunAz[i] as number;
    const se = s.sunEl[i] as number;
    const sd = s.sunDiam[i] as number;
    const ea = s.earthAz[i] as number;
    const ee = s.earthEl[i] as number;
    const ed = s.earthDiam[i] as number;
    out.sunAny[i] = isAnyPartVisible(horizon, sa, se, sd) ? 1 : 0;
    out.sunFull[i] = isFullyVisible(horizon, sa, se, sd) ? 1 : 0;
    out.earthAny[i] = isAnyPartVisible(horizon, ea, ee, ed) ? 1 : 0;
    out.earthFull[i] = isFullyVisible(horizon, ea, ee, ed) ? 1 : 0;
  }
  return out;
}
