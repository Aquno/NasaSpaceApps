/**
 * What: TypeScript types of the data contract, version 2 — defined once, used everywhere.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs/outputs: types only. Source of truth: docs/CONTRATO_DE_DADOS.md (D23).
 * NASA data source: describes files built from JPL Horizons and PGDA products 69/90.
 *
 * Units: angles in degrees (azimuth clockwise from north, elevation above the ideal horizon),
 * distances in km, heights in m, times in UTC. Frame: MOON_ME (DE421 mean Earth/polar axis).
 */

export const CONTRACT_VERSION = 3;
export const HORIZON_LENGTH = 360;

export type SourceType = 'published_point' | 'derived_point';
export type Purpose = 'sensitivity_demo' | null;

/** One entry of sites.json. */
export interface SiteSummary {
  id: string;
  name: string;
  /** Latitude, degrees (MOON_ME). */
  lat: number;
  /** East longitude, degrees, [-180, 180). */
  lon: number;
  description: string;
  sourceType: SourceType;
  purpose: Purpose;
  /** Terrain height above the 1737.4 km sphere, m. */
  terrainHeightM: number;
  /** Local terrain slope, degrees. */
  terrainSlopeDeg: number;
  /** Observer height above the 1737.4 km sphere (terrain + mast), m. */
  observerHeightM: number;
  /** Distance to the nearest permanently shadowed region (>= 1 km2), km; 0 if inside. */
  psrDistanceKm: number | null;
  psrAreaKm2: number | null;
  psrName: string | null;
  /** NASA average solar illumination (PGDA product 69), percent. */
  nasaAvgIlluminationPct: number | null;
  /** NASA average Earth visibility (PGDA product 69), percent. */
  nasaAvgEarthVisibilityPct: number | null;
}

/** Hourly series in columns; record i is at meta.start + i * meta.stepMinutes (UTC). */
export interface SeriesColumns {
  sunAz: Float64Array;
  sunEl: Float64Array;
  sunDiam: Float64Array;
  earthAz: Float64Array;
  earthEl: Float64Array;
  earthDiam: Float64Array;
}

export interface HorizonBand {
  maxDistanceKm: number;
  pixelM: number;
}

export interface SiteMeta {
  contractVersion: number;
  siteId: string;
  sources: string[];
  demResolutionM: number | null;
  horizonBands: HorizonBand[];
  horizonMethod: string;
  terrainHeightM: number;
  mastHeightM: number;
  observerHeightM: number;
  /** First record time, ms since epoch (UTC). */
  startMs: number;
  /** Last record time (inclusive), ms since epoch (UTC). */
  endMs: number;
  stepMinutes: number;
  count: number;
  sample: boolean;
  generatedAt: string;
}

/** One sites/<id>.json file. */
export interface SiteData {
  /** Terrain elevation per whole degree of azimuth, degrees; may be negative. */
  horizon: Float64Array;
  horizonObstacleKm: Float64Array;
  /** Where the search left the DEM, km; NaN where it did not. */
  horizonCutKm: Float64Array;
  series: SeriesColumns;
  meta: SiteMeta;
}

/** Time (ms since epoch, UTC) of record i. */
export function timeOfIndex(
  meta: Pick<SiteMeta, 'startMs' | 'stepMinutes'>,
  index: number,
): number {
  return meta.startMs + index * meta.stepMinutes * 60_000;
}

/** Index of the record at or after a time (ms, UTC); may be outside [0, count). */
export function indexAtOrAfter(
  meta: Pick<SiteMeta, 'startMs' | 'stepMinutes'>,
  timeMs: number,
): number {
  return Math.ceil((timeMs - meta.startMs) / (meta.stepMinutes * 60_000));
}

/** Small south polar height map for the map views (terrain.json + terrain.bin, v3). Visual only. */
export interface Terrain {
  width: number;
  height: number;
  /** Pixel size, m. */
  pixelM: number;
  /** Extent in polar stereographic metres (x = rho sin lon, y = rho cos lon). */
  xMinM: number;
  xMaxM: number;
  yMinM: number;
  yMaxM: number;
  sphereRadiusM: number;
  minHeightM: number;
  maxHeightM: number;
  /** Heights, m above the 1737.4 km sphere; row 0 = north edge (+y), column 0 = west (-x). */
  heights: Int16Array;
  source: string;
}
