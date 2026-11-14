/**
 * What: Validate parsed JSON against the data contract v2 and convert it to the typed model.
 *   Pure functions; every error names the file and the field.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: `unknown` JSON values and the file name.
 * Outputs: Result with SiteSummary[] or SiteData, or a list of errors.
 * NASA data source: none directly (format only; docs/CONTRATO_DE_DADOS.md).
 */
import {
  CONTRACT_VERSION,
  HORIZON_LENGTH,
  type Purpose,
  type SiteData,
  type SiteSummary,
  type SourceType,
} from './contract';

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const SOURCE_TYPES: readonly SourceType[] = ['published_point', 'derived_point'];
const PURPOSES: readonly Purpose[] = [null, 'sensitivity_demo'];
const SERIES_KEYS = ['sun_az', 'sun_el', 'sun_diam', 'earth_az', 'earth_el', 'earth_diam'] as const;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Collects errors while reading typed fields from an object. */
class Reader {
  readonly errors: string[] = [];
  constructor(private readonly where: string) {}

  num(o: Obj, key: string): number {
    const v = o[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      this.errors.push(`${this.where}: field '${key}' must be a finite number`);
      return Number.NaN;
    }
    return v;
  }
  numOrNull(o: Obj, key: string): number | null {
    if (!(key in o)) this.errors.push(`${this.where}: missing field '${key}'`);
    return o[key] === null ? null : this.num(o, key);
  }
  str(o: Obj, key: string): string {
    const v = o[key];
    if (typeof v !== 'string') {
      this.errors.push(`${this.where}: field '${key}' must be a string`);
      return '';
    }
    return v;
  }
  strOrNull(o: Obj, key: string): string | null {
    if (!(key in o)) this.errors.push(`${this.where}: missing field '${key}'`);
    return o[key] === null ? null : this.str(o, key);
  }
  bool(o: Obj, key: string): boolean {
    const v = o[key];
    if (typeof v !== 'boolean') this.errors.push(`${this.where}: field '${key}' must be a boolean`);
    return v === true;
  }
  numArray(o: Obj, key: string, length: number | null, allowNull = false): Float64Array {
    const v = o[key];
    if (!Array.isArray(v)) {
      this.errors.push(`${this.where}: field '${key}' must be an array`);
      return new Float64Array(0);
    }
    if (length !== null && v.length !== length) {
      this.errors.push(`${this.where}: field '${key}' has ${v.length} values, expected ${length}`);
    }
    const out = new Float64Array(v.length);
    let bad = -1;
    v.forEach((x, i) => {
      if (x === null && allowNull) out[i] = Number.NaN;
      else if (typeof x === 'number' && Number.isFinite(x)) out[i] = x;
      else if (bad < 0) bad = i;
    });
    if (bad >= 0)
      this.errors.push(`${this.where}: field '${key}' has an invalid value at index ${bad}`);
    return out;
  }
}

/** Validate and convert sites.json. */
export function parseSites(json: unknown, file = 'sites.json'): Result<SiteSummary[]> {
  if (!Array.isArray(json) || json.length === 0) {
    return { ok: false, errors: [`${file}: must be a non-empty array`] };
  }
  const errors: string[] = [];
  const sites: SiteSummary[] = [];
  const ids = new Set<string>();
  json.forEach((item, index) => {
    const r = new Reader(`${file}[${index}]`);
    if (!isObj(item)) {
      errors.push(`${file}[${index}]: must be an object`);
      return;
    }
    const sourceType = r.str(item, 'source_type') as SourceType;
    if (!SOURCE_TYPES.includes(sourceType))
      r.errors.push(`${file}[${index}]: invalid 'source_type'`);
    const purpose = r.strOrNull(item, 'purpose') as Purpose;
    if (!PURPOSES.includes(purpose)) r.errors.push(`${file}[${index}]: invalid 'purpose'`);
    const site: SiteSummary = {
      id: r.str(item, 'id'),
      name: r.str(item, 'name'),
      lat: r.num(item, 'lat'),
      lon: r.num(item, 'lon'),
      description: r.str(item, 'description'),
      sourceType,
      purpose,
      terrainHeightM: r.num(item, 'terrain_height_m'),
      terrainSlopeDeg: r.num(item, 'terrain_slope_deg'),
      observerHeightM: r.num(item, 'observer_height_m'),
      psrDistanceKm: r.numOrNull(item, 'psr_distance_km'),
      psrAreaKm2: r.numOrNull(item, 'psr_area_km2'),
      psrName: r.strOrNull(item, 'psr_name'),
      nasaAvgIlluminationPct: r.numOrNull(item, 'nasa_avg_illumination_pct'),
      nasaAvgEarthVisibilityPct: r.numOrNull(item, 'nasa_avg_earth_visibility_pct'),
    };
    if (ids.has(site.id)) r.errors.push(`${file}[${index}]: duplicate id '${site.id}'`);
    ids.add(site.id);
    errors.push(...r.errors);
    sites.push(site);
  });
  return errors.length ? { ok: false, errors } : { ok: true, value: sites };
}

/** Validate and convert one sites/<id>.json. */
export function parseSiteData(json: unknown, file: string, expectedId?: string): Result<SiteData> {
  if (!isObj(json)) return { ok: false, errors: [`${file}: must be an object`] };
  const meta = json['meta'];
  const series = json['series'];
  if (!isObj(meta)) return { ok: false, errors: [`${file}: missing object 'meta'`] };
  if (!isObj(series))
    return { ok: false, errors: [`${file}: 'series' must be an object of columns`] };

  const rm = new Reader(`${file}: meta`);
  const start = rm.str(meta, 'start');
  const end = rm.str(meta, 'end');
  const generatedAt = rm.str(meta, 'generated_at');
  if (!ISO_UTC.test(start) || !ISO_UTC.test(end))
    rm.errors.push(`${file}: meta.start/end must be ISO UTC with Z`);
  if (!ISO_DATE.test(generatedAt)) rm.errors.push(`${file}: meta.generated_at must be YYYY-MM-DD`);
  const bandsRaw = meta['horizon_bands'];
  const bands = Array.isArray(bandsRaw)
    ? bandsRaw
        .filter(isObj)
        .map((b) => ({ maxDistanceKm: rm.num(b, 'max_distance_km'), pixelM: rm.num(b, 'pixel_m') }))
    : (rm.errors.push(`${file}: meta.horizon_bands must be an array`), []);
  const sourcesRaw = meta['sources'];
  const sources = Array.isArray(sourcesRaw)
    ? sourcesRaw.filter((s): s is string => typeof s === 'string')
    : [];
  const m = {
    contractVersion: rm.num(meta, 'contract_version'),
    siteId: rm.str(meta, 'site_id'),
    sources,
    demResolutionM: rm.numOrNull(meta, 'dem_resolution_m'),
    horizonBands: bands,
    horizonMethod: rm.str(meta, 'horizon_method'),
    terrainHeightM: rm.num(meta, 'terrain_height_m'),
    mastHeightM: rm.num(meta, 'mast_height_m'),
    observerHeightM: rm.num(meta, 'observer_height_m'),
    startMs: Date.parse(start),
    endMs: Date.parse(end),
    stepMinutes: rm.num(meta, 'step_minutes'),
    count: rm.num(meta, 'count'),
    sample: rm.bool(meta, 'sample'),
    generatedAt,
  };
  if (m.contractVersion !== CONTRACT_VERSION)
    rm.errors.push(`${file}: meta.contract_version must be ${CONTRACT_VERSION}`);
  if (expectedId !== undefined && m.siteId !== expectedId)
    rm.errors.push(`${file}: meta.site_id '${m.siteId}' != '${expectedId}'`);
  if (
    Number.isFinite(m.startMs) &&
    m.startMs + (m.count - 1) * m.stepMinutes * 60_000 !== m.endMs
  ) {
    rm.errors.push(`${file}: meta.start + (count - 1) * step_minutes != meta.end`);
  }

  const rd = new Reader(file);
  const horizon = rd.numArray(json, 'horizon', HORIZON_LENGTH);
  const horizonObstacleKm = rd.numArray(json, 'horizon_obstacle_km', HORIZON_LENGTH);
  const horizonCutKm = rd.numArray(json, 'horizon_cut_km', HORIZON_LENGTH, true);

  const rs = new Reader(`${file}: series`);
  const cols = SERIES_KEYS.map((k) =>
    rs.numArray(series, k, Number.isFinite(m.count) ? m.count : null),
  );
  const [sunAz, sunEl, sunDiam, earthAz, earthEl, earthDiam] = cols as [
    Float64Array,
    Float64Array,
    Float64Array,
    Float64Array,
    Float64Array,
    Float64Array,
  ];
  for (const [name, arr] of [
    ['sun_az', sunAz],
    ['earth_az', earthAz],
  ] as const) {
    if (arr.some((v) => v < 0 || v >= 360))
      rs.errors.push(`${file}: series.${name} outside [0, 360)`);
  }
  for (const [name, arr] of [
    ['sun_el', sunEl],
    ['earth_el', earthEl],
  ] as const) {
    if (arr.some((v) => v < -90 || v > 90))
      rs.errors.push(`${file}: series.${name} outside [-90, 90]`);
  }

  const errors = [...rm.errors, ...rd.errors, ...rs.errors];
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      horizon,
      horizonObstacleKm,
      horizonCutKm,
      series: { sunAz, sunEl, sunDiam, earthAz, earthEl, earthDiam },
      meta: m,
    },
  };
}
