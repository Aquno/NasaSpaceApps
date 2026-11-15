/**
 * What: Compact facts of one site from sites.json (point type, position, terrain, permanent
 *   shadow, NASA averages). Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import { lonDisplay } from '../ui/format';

export function SiteFacts({ site }: { site: SiteSummary | undefined }) {
  const { t, num } = useI18n();
  if (!site) return <p className="note">{t('facts.pick')}</p>;
  const lon = lonDisplay(site.lon);
  const pct = (v: number | null) => (v === null ? t('unit.na') : `${num(v, 1)}%`);
  return (
    <dl className="facts">
      <dt className="caps">{t('facts.site')}</dt>
      <dd>
        <strong>{site.name}</strong>
      </dd>
      <dt className="caps">{t('facts.point')}</dt>
      <dd>{t(site.sourceType === 'derived_point' ? 'facts.derived' : 'facts.published')}</dd>
      <dt className="caps">{t('facts.position')}</dt>
      <dd className="mono">
        {t(lon.east ? 'facts.positionEast' : 'facts.positionWest', {
          lat: site.lat,
          lon: lon.deg,
        })}
      </dd>
      <dt className="caps">{t('facts.terrain')}</dt>
      <dd className="mono">
        {t('facts.terrainValue', { h: site.terrainHeightM, s: site.terrainSlopeDeg })}
      </dd>
      <dt className="caps science">◆ {t('facts.psr')}</dt>
      <dd className="mono">
        {site.psrDistanceKm === null
          ? t('unit.na')
          : t('facts.psrValue', { km: site.psrDistanceKm, a: site.psrAreaKm2 ?? 0 })}
      </dd>
      <dt className="caps">{t('facts.nasa')}</dt>
      <dd className="mono">
        <span className="sun">● {pct(site.nasaAvgIlluminationPct)}</span>{' '}
        <span className="earth">▲ {pct(site.nasaAvgEarthVisibilityPct)}</span>
      </dd>
    </dl>
  );
}
