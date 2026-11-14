/**
 * What: Map geometry for the map views: site position on the south polar stereographic grid and
 *   a hillshade of the terrain height map. Pure functions; visual only (no number on screen
 *   comes from the shading).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: latitude/longitude (degrees, MOON_ME), sphere radius (m); Terrain grid (heights in m).
 * Outputs: map x/y in metres; 8-bit shade per pixel.
 * NASA data source: LOLA height map (PGDA product 90) via data/app/terrain.*.
 *
 * Projection (same as the PGDA files): rho = 2 R tan(lat/2 + 45 deg), x = rho sin(lon),
 * y = rho cos(lon); longitude 0 points up (+y), 90 E to the right (+x).
 */
import type { Terrain } from '../data/contract';

const DEG = Math.PI / 180;

/** South polar stereographic map coordinates (m) of a latitude/longitude (degrees). */
export function toMapXY(latDeg: number, lonDeg: number, radiusM: number): { x: number; y: number } {
  const rho = 2 * radiusM * Math.tan((latDeg * DEG) / 2 + Math.PI / 4);
  return { x: rho * Math.sin(lonDeg * DEG), y: rho * Math.cos(lonDeg * DEG) };
}

/** Fractional pixel (column, row) of a map point on the terrain grid. */
export function toPixel(t: Terrain, x: number, y: number): { col: number; row: number } {
  return { col: (x - t.xMinM) / t.pixelM - 0.5, row: (t.yMaxM - y) / t.pixelM - 0.5 };
}

/**
 * Lambert hillshade (0-255) for a light from azimuth `azDeg` (degrees clockwise from map up)
 * and elevation `altDeg`, with heights multiplied by `exaggeration`.
 */
export function hillshade(
  t: Terrain,
  azDeg: number,
  altDeg: number,
  exaggeration: number,
): Uint8ClampedArray {
  const { width: w, height: h, heights, pixelM } = t;
  const out = new Uint8ClampedArray(w * h);
  const lx = Math.sin(azDeg * DEG) * Math.cos(altDeg * DEG);
  const ly = Math.cos(azDeg * DEG) * Math.cos(altDeg * DEG);
  const lz = Math.sin(altDeg * DEG);
  const at = (r: number, c: number) =>
    heights[Math.min(h - 1, Math.max(0, r)) * w + Math.min(w - 1, Math.max(0, c))] as number;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      // Map x grows with the column; map y grows toward row 0.
      const dzdx = ((at(r, c + 1) - at(r, c - 1)) * exaggeration) / (2 * pixelM);
      const dzdy = ((at(r - 1, c) - at(r + 1, c)) * exaggeration) / (2 * pixelM);
      const norm = Math.hypot(dzdx, dzdy, 1);
      const shade = (-dzdx * lx - dzdy * ly + lz) / norm;
      out[r * w + c] = Math.round(Math.max(0, shade) * 255);
    }
  }
  return out;
}
