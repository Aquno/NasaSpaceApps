/**
 * What: "Small move, big change" (D43): the Shackleton rim reference point and the Shackleton
 *   inner-wall point, with the distance between them, both horizon contours on one panorama
 *   (same scale) and their mission numbers side by side for the current landing day and rules.
 *   Display only; distances, visibility and scores come from the calc module (D9).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useMemo } from 'react';
import { evaluateSite, siteStatus } from '../calc/evaluate';
import { surfaceDistanceKm } from '../calc/mapGeometry';
import { trackSegments } from '../calc/panorama';
import { visibilitySeries } from '../calc/visibility';
import { SMALL_MOVE_SITE_IDS } from '../config/scoring';
import { indexAtOrAfter, type SiteData, type SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import { VERDICT_ICON } from '../ui/format';
import { HorizonPanorama } from './HorizonPanorama';

interface Props {
  sites: SiteSummary[];
  data: Map<string, SiteData>;
  /** Landing day (ms UTC, with the delay), mission hours, rules: as on the dashboard. */
  landingDayMs: number;
  durationH: number;
  rules: Parameters<typeof evaluateSite>[5];
  sphereRadiusM: number;
}

export function SmallMove({ sites, data, landingDayMs, durationH, rules, sphereRadiusM }: Props) {
  const { t, msg, num } = useI18n();
  const pair = SMALL_MOVE_SITE_IDS.map((id) => {
    const site = sites.find((s) => s.id === id);
    const d = data.get(id);
    return site && d ? { site, d } : null;
  });
  const [a, b] = pair;
  const evals = useMemo(
    () =>
      pair.map((p) =>
        p ? evaluateSite(p.site, p.d, visibilitySeries(p.d), landingDayMs, durationH, rules) : null,
      ),
    // pair is rebuilt each render from stable inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sites, data, landingDayMs, durationH, rules],
  );
  if (!a || !b) return null;
  const [ea, eb] = evals;
  const km = surfaceDistanceKm(a.site.lat, a.site.lon, b.site.lat, b.site.lon, sphereRadiusM);
  const length = Math.round((durationH * 60) / a.d.meta.stepMinutes);
  const sunPath =
    ea && ea.ok
      ? trackSegments(
          a.d.series.sunAz,
          a.d.series.sunEl,
          indexAtOrAfter(a.d.meta, ea.landingMs),
          length,
        )
      : [];
  const cell = (e: typeof ea, f: (x: Extract<NonNullable<typeof ea>, { ok: true }>) => string) =>
    e && e.ok ? f(e) : t('unit.na');
  const rows: [string, (x: Extract<NonNullable<typeof ea>, { ok: true }>) => string][] = [
    [t('small.verdict'), (x) => `${VERDICT_ICON[siteStatus(x)]} ${t(`verdict.${siteStatus(x)}`)}`],
    [t('card.engineering'), (x) => num(x.engineering.total)],
    [t('card.science'), (x) => (x.science ? num(x.science.total) : t('unit.na'))],
    [t('small.sun'), (x) => t('small.pct', { p: x.metrics.sunFraction })],
    [t('small.earth'), (x) => t('small.pct', { p: x.metrics.earthFraction })],
    [t('small.dark'), (x) => t('small.hours', { h: x.metrics.longestDarkHours })],
    [t('small.gap'), (x) => t('small.hours', { h: x.metrics.longestNoContactHours })],
  ];

  return (
    <div className="small-move">
      <p className="small-lead">{t('small.lead', { a: a.site.name, b: b.site.name, km })}</p>
      <HorizonPanorama
        horizons={[
          { values: a.d.horizon, className: 'main' },
          { values: b.d.horizon, className: 'alt' },
        ]}
        // The two points see the Sun differently, so the shared path is drawn in one style.
        bodies={[
          { kind: 'sun', runs: sunPath.map((points) => ({ visible: true, points })), now: null },
        ]}
        ariaLabel={t('small.aria', { a: a.site.name, b: b.site.name })}
      />
      <p className="legend">
        <span>
          <span className="swatch" style={{ background: '#b8ad9c' }} /> {a.site.name}
        </span>
        <span>
          <span className="swatch dashed" /> {b.site.name}
        </span>
        <span className="sun">━ {t('small.sunPath')}</span>
      </p>
      <table className="compare small-table">
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">{a.site.name}</th>
            <th scope="col">{b.site.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, f]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td className="num">{cell(ea, f)}</td>
              <td className="num">{cell(eb, f)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">{t('small.slope')}</th>
            <td className="num">{t('small.deg', { s: a.site.terrainSlopeDeg })}</td>
            <td className="num">{t('small.deg', { s: b.site.terrainSlopeDeg })}</td>
          </tr>
          <tr>
            <th scope="row">{t('small.reason')}</th>
            <td>{ea && ea.ok ? msg(ea.verdict.reason) : t('unit.na')}</td>
            <td>{eb && eb.ok ? msg(eb.verdict.reason) : t('unit.na')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
