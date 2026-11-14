/**
 * What: Geometry for the 3D south pole view (D28): body directions in the pole frame, vertical
 *   exaggeration applied consistently to terrain and light, and the Moon's curvature drop.
 *   Pure functions; the 3D view is a visualization only (numbers come from the horizon rule).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: site latitude/longitude (degrees, MOON_ME), body azimuth/elevation at the site
 *   (degrees, Horizons convention), heights and map radii (m), sphere radius (m).
 * Outputs: unit vectors and heights in the pole frame.
 * NASA data source: Horizons ephemerides and LOLA height map via data/app.
 *
 * Pole frame: x = map x (toward 90° E), y = map y (toward 0° E, the Earth side), z = up at the
 * south pole. In Moon-fixed axes: x = +Y, y = +X, z = -Z (right-handed).
 */

const DEG = Math.PI / 180;
export type Vec3 = [number, number, number];

/** Unit vector toward a body seen from a site (az clockwise from north, el above horizontal). */
export function bodyDirectionPoleFrame(
  siteLatDeg: number,
  siteLonDeg: number,
  azDeg: number,
  elDeg: number,
): Vec3 {
  const lat = siteLatDeg * DEG;
  const lon = siteLonDeg * DEG;
  const az = azDeg * DEG;
  const el = elDeg * DEG;
  // Site east/north/up in Moon-fixed axes (X, Y, Z).
  const e = [-Math.sin(lon), Math.cos(lon), 0];
  const n = [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)];
  const u = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const h = Math.cos(el);
  const v = [0, 1, 2].map(
    (k) =>
      h * Math.cos(az) * (n[k] as number) +
      h * Math.sin(az) * (e[k] as number) +
      Math.sin(el) * (u[k] as number),
  ) as Vec3;
  return [v[1], v[0], -v[2]];
}

/**
 * Light direction for a vertically exaggerated scene: the tangent of the elevation is multiplied
 * by the same factor as the heights, so shadows fall where they would without exaggeration.
 */
export function exaggerateDirection(dir: Vec3, exaggeration: number): Vec3 {
  const [x, y, z] = dir;
  const scaled: Vec3 = [x, y, z * exaggeration];
  const norm = Math.hypot(...scaled);
  return [scaled[0] / norm, scaled[1] / norm, scaled[2] / norm];
}

/**
 * Height (m) by which the sphere surface lies below the tangent plane at the pole, at polar
 * stereographic radius rho (m): R (1 - cos(s / R)), with arc s = 2 R atan(rho / 2R).
 */
export function curvatureDropM(rhoM: number, radiusM: number): number {
  const s = 2 * radiusM * Math.atan(rhoM / (2 * radiusM));
  return radiusM * (1 - Math.cos(s / radiusM));
}

/** Scene height (m) of a terrain point: (height - curvature drop) x exaggeration. */
export function sceneHeightM(
  heightM: number,
  rhoM: number,
  radiusM: number,
  exaggeration: number,
  curved: boolean,
): number {
  return (heightM - (curved ? curvatureDropM(rhoM, radiusM) : 0)) * exaggeration;
}

/** Horizontal length of the shadow cast by a vertical step of height h under a light dir. */
export function shadowLength(stepHeight: number, lightDir: Vec3): number {
  return (stepHeight * Math.hypot(lightDir[0], lightDir[1])) / lightDir[2];
}

/**
 * Vertex positions (scene units: km) of the terrain grid: x/y = map coordinates of each pixel
 * centre, z = scene height. Row 0 is the north (+y) edge of the map.
 */
export function terrainPositions(
  terrain: {
    width: number;
    height: number;
    pixelM: number;
    xMinM: number;
    yMaxM: number;
    sphereRadiusM: number;
    heights: ArrayLike<number>;
  },
  exaggeration: number,
  curved: boolean,
): Float32Array {
  const { width: w, height: h, pixelM, xMinM, yMaxM, sphereRadiusM, heights } = terrain;
  const out = new Float32Array(w * h * 3);
  for (let r = 0; r < h; r++) {
    const y = yMaxM - (r + 0.5) * pixelM;
    for (let c = 0; c < w; c++) {
      const x = xMinM + (c + 0.5) * pixelM;
      const k = r * w + c;
      const z = sceneHeightM(
        heights[k] as number,
        Math.hypot(x, y),
        sphereRadiusM,
        exaggeration,
        curved,
      );
      out[k * 3] = x / 1000;
      out[k * 3 + 1] = y / 1000;
      out[k * 3 + 2] = z / 1000;
    }
  }
  return out;
}

export interface BodyDirections {
  /** Unit vectors in the pole frame (not exaggerated). */
  sun: Vec3;
  earth: Vec3;
  sunElDeg: number;
  earthElDeg: number;
  /** Record index used (clamped to the data). */
  index: number;
}

/** Sun and Earth directions seen from a site at the record at or after `timeMs`. */
export function bodyDirectionsAt(
  site: { lat: number; lon: number },
  data: {
    series: {
      sunAz: ArrayLike<number>;
      sunEl: ArrayLike<number>;
      earthAz: ArrayLike<number>;
      earthEl: ArrayLike<number>;
    };
    meta: { startMs: number; stepMinutes: number; count: number };
  },
  timeMs: number,
): BodyDirections {
  const raw = Math.ceil((timeMs - data.meta.startMs) / (data.meta.stepMinutes * 60_000));
  const index = Math.min(Math.max(raw, 0), data.meta.count - 1);
  const s = data.series;
  const sunEl = s.sunEl[index] as number;
  const earthEl = s.earthEl[index] as number;
  return {
    sun: bodyDirectionPoleFrame(site.lat, site.lon, s.sunAz[index] as number, sunEl),
    earth: bodyDirectionPoleFrame(site.lat, site.lon, s.earthAz[index] as number, earthEl),
    sunElDeg: sunEl,
    earthElDeg: earthEl,
    index,
  };
}

/**
 * Cavity shading factor per pixel (0-1): heights compared with the mean of a square window of
 * `radiusPx` around each pixel (integral image). Crater floors (below the local mean) get lower
 * values, rims higher; `reliefScaleM` is the relief that maps to the full range. Visual only.
 */
export function cavityShade(
  heights: ArrayLike<number>,
  width: number,
  height: number,
  radiusPx: number,
  reliefScaleM: number,
): Float32Array {
  const iw = width + 1;
  const integral = new Float64Array(iw * (height + 1));
  for (let r = 0; r < height; r++) {
    let rowSum = 0;
    for (let c = 0; c < width; c++) {
      rowSum += heights[r * width + c] as number;
      integral[(r + 1) * iw + c + 1] = (integral[r * iw + c + 1] as number) + rowSum;
    }
  }
  const out = new Float32Array(width * height);
  for (let r = 0; r < height; r++) {
    const r0 = Math.max(0, r - radiusPx);
    const r1 = Math.min(height, r + radiusPx + 1);
    for (let c = 0; c < width; c++) {
      const c0 = Math.max(0, c - radiusPx);
      const c1 = Math.min(width, c + radiusPx + 1);
      const sum =
        (integral[r1 * iw + c1] as number) -
        (integral[r0 * iw + c1] as number) -
        (integral[r1 * iw + c0] as number) +
        (integral[r0 * iw + c0] as number);
      const mean = sum / ((r1 - r0) * (c1 - c0));
      const relief = (heights[r * width + c] as number) - mean;
      out[r * width + c] = Math.min(1, Math.max(0, 0.5 + relief / reliefScaleM));
    }
  }
  return out;
}
