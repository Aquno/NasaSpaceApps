/**
 * What: 360° horizon panorama (SVG): terrain silhouette from the LOLA horizon, the flat 0°
 *   line, Sun and Earth paths during the mission (strong where the body is visible, faint where
 *   it is behind the terrain, small dots at rises and sets), and both discs at the selected
 *   record drawn as circles whose diameter is the real angular size on the vertical scale (the
 *   horizontal scale is compressed, so widths are not to scale; D51). A body behind the terrain
 *   is drawn behind the silhouette as a faint hollow outline, never as a full disc over the
 *   terrain (D52); its name stays readable on top. Elevation labels sit in
 *   a gutter left of the plot. Can draw several horizons ("Position sensitivity"). Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decisions D42, D43, D51.
 * Inputs: horizon(s) [360] in degrees; path runs, events and current positions in degrees
 *   (topocentric, azimuth from north clockwise).
 */
import {
  elevationRange,
  fitExaggeration,
  type AzEl,
  type TrackEvent,
  type TrackRun,
} from '../calc/panorama';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { InfoTip } from './InfoTip';

/** Drawing size (viewBox units); the SVG scales to its box. */
const PLOT_W = 1400;
/** Gutter left of the plot for the elevation labels (never over the terrain). */
const GUTTER_W = 48;
const PLOT_H = 380;
const AXIS_H = 28;
const PX_PER_DEG = PLOT_W / 360;
/** Margin above and below the horizon and the paths, degrees. */
const MARGIN_DEG = 1;
const SUN_RING_GAP_PX = 6;
const SUN_RING_MIN_R = 14;
const EVENT_R = 3.5;
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
  runs: TrackRun[];
  events?: TrackEvent[];
  /** Position at the selected record; `visible` comes from the calc module's disc rule. */
  now: (AzEl & { diam: number; visible: boolean }) | null;
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
  // One scale for everything: the range covers every contour, every path and both discs.
  const r =
    range ??
    elevationRange(
      horizons.flatMap((h) => Array.from(h.values)),
      bodies.flatMap((b) => [...b.runs.map((run) => run.points), ...(b.now ? [[b.now]] : [])]),
      MARGIN_DEG,
    );
  const ex = fitExaggeration(r.max - r.min, PLOT_H, PX_PER_DEG);
  const pxPerDegY = PX_PER_DEG * ex;
  const top = (PLOT_H - (r.max - r.min) * pxPerDegY) / 2;
  const x = (az: number) => GUTTER_W + (((az % 360) + 360) % 360) * PX_PER_DEG;
  const y = (el: number) => top + (r.max - el) * pxPerDegY;
  const right = GUTTER_W + PLOT_W;
  const ticks: number[] = [];
  const step = TICK_STEPS.find((s) => (r.max - r.min) / s <= MAX_TICKS) ?? 10;
  for (let e = Math.ceil(r.min / step) * step; e <= r.max; e += step) ticks.push(e);

  const silhouette = (h: ArrayLike<number>) => {
    const pts: string[] = [`${GUTTER_W},${PLOT_H}`];
    for (let i = 0; i < 360; i++) {
      const v = h[i] as number;
      // Bin i covers azimuths [i - 0.5, i + 0.5) (D19): draw it as a flat step.
      pts.push(
        `${GUTTER_W + Math.max(0, i - 0.5) * PX_PER_DEG},${y(v)}`,
        `${GUTTER_W + (i + 0.5) * PX_PER_DEG},${y(v)}`,
      );
    }
    pts.push(`${right},${y(h[0] as number)}`, `${right},${PLOT_H}`);
    return pts.join(' ');
  };

  return (
    <figure className="panorama">
      <svg viewBox={`0 0 ${right} ${PLOT_H + AXIS_H}`} role="img" aria-label={ariaLabel}>
        {ticks.map((e) => (
          <g key={e}>
            <line
              className={e === 0 ? 'pano-zero' : 'pano-grid'}
              x1={GUTTER_W}
              x2={right}
              y1={y(e)}
              y2={y(e)}
            />
            <text x={GUTTER_W - 8} y={y(e) + 4} className="pano-tick" textAnchor="end">
              {`${e}°`}
            </text>
          </g>
        ))}
        {bodies.map(
          (b) =>
            b.now &&
            !b.now.visible && <Disc key={b.kind} b={b} pxPerDegY={pxPerDegY} x={x} y={y} />,
        )}
        {horizons.map((h, k) => (
          <polygon
            key={k}
            className={`pano-terrain ${h.className}`}
            points={silhouette(h.values)}
          />
        ))}
        {bodies.map((b) =>
          b.runs.map((run, k) => (
            <polyline
              key={`${b.kind}-${k}`}
              className={`pano-path ${b.kind} ${run.visible ? 'visible' : 'hidden'}`}
              points={run.points.map((p) => `${x(p.az)},${y(p.el)}`).join(' ')}
            />
          )),
        )}
        {bodies.map((b) =>
          (b.events ?? []).map((ev) => (
            <circle
              key={`${b.kind}-ev-${ev.offset}`}
              className={`pano-event ${b.kind}`}
              cx={x(ev.az)}
              cy={y(ev.el)}
              r={EVENT_R}
            />
          )),
        )}
        {bodies.map(
          (b) => b.now?.visible && <Disc key={b.kind} b={b} pxPerDegY={pxPerDegY} x={x} y={y} />,
        )}
        {bodies.map((b) => {
          if (!b.now) return null;
          const labelR = bodyRadii(b, pxPerDegY).label;
          return (
            <text
              key={`${b.kind}-label`}
              x={x(b.now.az) + labelR + 4}
              y={y(b.now.el) - labelR}
              className={`pano-label${b.now.visible ? '' : ' hidden'}`}
            >
              {t(b.kind === 'sun' ? 'detail.sun' : 'detail.earth')}
            </text>
          );
        })}
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
        <span className="note">{t('detail.astroHorizon')}</span>
        {bodies.some((b) => b.now) && (
          <InfoTip>
            {t('detail.realSize', {
              s: bodies.find((b) => b.kind === 'sun')?.now?.diam ?? 0,
              e: bodies.find((b) => b.kind === 'earth')?.now?.diam ?? 0,
            })}
          </InfoTip>
        )}
      </figcaption>
    </figure>
  );
}

/** Disc radius (real angular size on the vertical scale), Sun ring radius and label offset, px. */
function bodyRadii(b: PanoramaBody, pxPerDegY: number) {
  const disc = ((b.now?.diam ?? 0) / 2) * pxPerDegY;
  const ring = Math.max(SUN_RING_MIN_R, disc + SUN_RING_GAP_PX);
  return { disc, ring, label: b.kind === 'sun' ? ring : disc };
}

interface DiscProps {
  b: PanoramaBody;
  pxPerDegY: number;
  x: (az: number) => number;
  y: (el: number) => number;
}

/** One body at the selected record: full disc when visible, faint hollow outline when hidden. */
function Disc({ b, pxPerDegY, x, y }: DiscProps) {
  if (!b.now) return null;
  const { disc, ring } = bodyRadii(b, pxPerDegY);
  const cx = x(b.now.az);
  const cy = y(b.now.el);
  return (
    <g className={`pano-body ${b.kind}${b.now.visible ? '' : ' hidden'}`}>
      {b.kind === 'sun' && b.now.visible && (
        <circle className="pano-ring" cx={cx} cy={cy} r={ring} />
      )}
      <circle className="pano-disc" cx={cx} cy={cy} r={disc} />
    </g>
  );
}
