/**
 * What: 360° horizon panorama (SVG): terrain silhouette from the LOLA horizon, the flat 0°
 *   line, Sun and Earth paths during the mission, and both discs at their real angular size at
 *   the selected record (stretched by the declared vertical scale, with locator rings).
 *   Can draw several horizons (used by "Small move, big change"). Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decisions D42, D43.
 * Inputs: horizon(s) [360] in degrees; paths and current positions in degrees (topocentric,
 *   azimuth from north clockwise).
 */
import { elevationRange, fitExaggeration, type AzEl } from '../calc/panorama';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

/** Drawing size (viewBox units); the SVG scales to its box. */
const W = 1440;
const PLOT_H = 380;
const AXIS_H = 28;
const PX_PER_DEG = W / 360;
const MARGIN_DEG = 0.5;
const LOCATOR_R = 14;
/** Elevation grid: the smallest of these steps (deg) that gives at most MAX_TICKS lines. */
const TICK_STEPS = [1, 2, 5, 10];
const MAX_TICKS = 8;
const CARDINALS: [number, MessageKey][] = [
  [0, 'dir.N'],
  [90, 'dir.E'],
  [180, 'dir.S'],
  [270, 'dir.W'],
];

export interface PanoramaHorizon {
  values: ArrayLike<number>;
  /** CSS class for the fill/line (first one is the main terrain). */
  className: string;
}

export interface PanoramaBody {
  kind: 'sun' | 'earth';
  path: AzEl[][];
  now: (AzEl & { diam: number }) | null;
}

interface Props {
  horizons: PanoramaHorizon[];
  bodies: PanoramaBody[];
  ariaLabel: string;
  /** Fixed elevation range (deg) to share the scale between panoramas; computed if omitted. */
  range?: { min: number; max: number };
}

export function HorizonPanorama({ horizons, bodies, ariaLabel, range }: Props) {
  const { t } = useI18n();
  // All horizons share one scale: the range covers every contour and every path.
  const r =
    range ??
    elevationRange(
      horizons.flatMap((h) => Array.from(h.values)),
      bodies.flatMap((b) => [...b.path, ...(b.now ? [[b.now]] : [])]),
      MARGIN_DEG,
    );
  const ex = fitExaggeration(r.max - r.min, PLOT_H, PX_PER_DEG);
  const pxPerDegY = PX_PER_DEG * ex;
  const top = (PLOT_H - (r.max - r.min) * pxPerDegY) / 2;
  const x = (az: number) => (((az % 360) + 360) % 360) * PX_PER_DEG;
  const y = (el: number) => top + (r.max - el) * pxPerDegY;
  const bottom = PLOT_H;
  const ticks: number[] = [];
  const step = TICK_STEPS.find((s) => (r.max - r.min) / s <= MAX_TICKS) ?? 10;
  for (let e = Math.ceil(r.min / step) * step; e <= r.max; e += step) ticks.push(e);

  const silhouette = (h: ArrayLike<number>) => {
    const pts: string[] = [`0,${bottom}`];
    for (let i = 0; i < 360; i++) {
      const v = h[i] as number;
      // Bin i covers azimuths [i - 0.5, i + 0.5) (D19): draw it as a flat step.
      pts.push(`${Math.max(0, i - 0.5) * PX_PER_DEG},${y(v)}`, `${(i + 0.5) * PX_PER_DEG},${y(v)}`);
    }
    pts.push(`${W},${y(h[0] as number)}`, `${W},${bottom}`);
    return pts.join(' ');
  };

  return (
    <figure className="panorama">
      <svg viewBox={`0 0 ${W} ${PLOT_H + AXIS_H}`} role="img" aria-label={ariaLabel}>
        {ticks.map((e) => (
          <g key={e}>
            <line
              className={e === 0 ? 'pano-zero' : 'pano-grid'}
              x1={0}
              x2={W}
              y1={y(e)}
              y2={y(e)}
            />
            <text x={6} y={y(e) - 4} className="pano-tick">
              {`${e}°`}
            </text>
          </g>
        ))}
        {horizons.map((h, k) => (
          <polygon
            key={k}
            className={`pano-terrain ${h.className}`}
            points={silhouette(h.values)}
          />
        ))}
        {bodies.map((b) =>
          b.path.map((seg, k) => (
            <polyline
              key={`${b.kind}-${k}`}
              className={`pano-path ${b.kind}`}
              points={seg.map((p) => `${x(p.az)},${y(p.el)}`).join(' ')}
            />
          )),
        )}
        {bodies.map(
          (b) =>
            b.now && (
              <g key={b.kind} className={`pano-body ${b.kind}`}>
                <circle className="pano-ring" cx={x(b.now.az)} cy={y(b.now.el)} r={LOCATOR_R} />
                <ellipse
                  cx={x(b.now.az)}
                  cy={y(b.now.el)}
                  rx={(b.now.diam / 2) * PX_PER_DEG}
                  ry={(b.now.diam / 2) * pxPerDegY}
                />
                <text
                  x={x(b.now.az) + LOCATOR_R + 4}
                  y={y(b.now.el) - LOCATOR_R}
                  className="pano-label"
                >
                  {t(b.kind === 'sun' ? 'detail.sun' : 'detail.earth')}
                </text>
              </g>
            ),
        )}
        {CARDINALS.map(([az, key]) => (
          <text
            key={key}
            x={x(az) + (az === 0 ? 4 : 0)}
            y={PLOT_H + 20}
            className="pano-axis"
            textAnchor={az === 0 ? 'start' : 'middle'}
          >
            {`${t(key)} ${az}°`}
          </text>
        ))}
      </svg>
      <figcaption className="pano-caption">
        <span className="pano-scale">{t('detail.vertical', { n: ex })}</span>
        <span className="note">
          {t('detail.astroHorizon')}
          {bodies.some((b) => b.now) && ' · '}
          {bodies.some((b) => b.now) &&
            t('detail.realSize', {
              s: bodies.find((b) => b.kind === 'sun')?.now?.diam ?? 0,
              e: bodies.find((b) => b.kind === 'earth')?.now?.diam ?? 0,
            })}
        </span>
      </figcaption>
    </figure>
  );
}
