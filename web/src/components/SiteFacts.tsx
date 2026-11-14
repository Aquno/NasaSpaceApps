/**
 * What: Compact facts of one site from sites.json (point type, position, terrain, permanent
 *   shadow, NASA averages). Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { SiteSummary } from '../data/contract';
import { fmtKm } from '../ui/format';

const POINT_TYPE: Record<SiteSummary['sourceType'], string> = {
  published_point: 'Published point (NASA Lunar Surface Data Book)',
  derived_point: 'Derived point (on the rim crest, inside a NASA region)',
};

export function SiteFacts({ site }: { site: SiteSummary | undefined }) {
  if (!site) return <p className="note">Click a site on the map, a card or the scatter.</p>;
  const pct = (v: number | null) => (v === null ? 'n/a' : `${v.toFixed(1)}%`);
  return (
    <dl className="facts">
      <dt className="caps">Site</dt>
      <dd>
        <strong>{site.name}</strong>
      </dd>
      <dt className="caps">Point</dt>
      <dd>{POINT_TYPE[site.sourceType]}</dd>
      <dt className="caps">Position</dt>
      <dd className="mono">
        {site.lat.toFixed(4)}°, {site.lon.toFixed(4)}° E
      </dd>
      <dt className="caps">Terrain</dt>
      <dd className="mono">
        {site.terrainHeightM.toFixed(0)} m · slope {site.terrainSlopeDeg.toFixed(1)}°
      </dd>
      <dt className="caps science">◆ Permanent shadow</dt>
      <dd className="mono">
        {fmtKm(site.psrDistanceKm)}
        {site.psrAreaKm2 !== null && ` · ${site.psrAreaKm2.toFixed(1)} km² region`}
      </dd>
      <dt className="caps">NASA 18.6-yr averages</dt>
      <dd className="mono">
        <span className="sun">● {pct(site.nasaAvgIlluminationPct)}</span>{' '}
        <span className="earth">▲ {pct(site.nasaAvgEarthVisibilityPct)}</span>
      </dd>
    </dl>
  );
}
