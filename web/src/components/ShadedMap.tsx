/**
 * What: 2D shaded relief of the south pole (LOLA height map) with the six sites, clickable.
 *   Placeholder for the 3D view (D28). Visual only: no number comes from the shading.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useEffect, useMemo, useRef } from 'react';
import { hillshade, toMapXY, toPixel } from '../calc/mapGeometry';
import type { SiteSummary, Terrain } from '../data/contract';
import { shortName } from '../ui/format';
import { placeLabels } from '../ui/labelLayout';

/** Static light for the placeholder map (visual choice only). */
const LIGHT_AZIMUTH_DEG = 315;
const LIGHT_ELEVATION_DEG = 35;
const MAP_EXAGGERATION = 2;
/** Label size and overlap width in map pixels (the map is drawn in a 512-unit view box). */
const LABEL_FONT = 26;
const LABEL_MIN_WIDTH = 220;

interface Props {
  terrain: Terrain;
  sites: SiteSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ShadedMap({ terrain, sites, selectedId, onSelect }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const shade = useMemo(
    () => hillshade(terrain, LIGHT_AZIMUTH_DEG, LIGHT_ELEVATION_DEG, MAP_EXAGGERATION),
    [terrain],
  );

  const positions = useMemo(() => {
    const out = new Map<string, { col: number; row: number }>();
    for (const s of sites) {
      const { x, y } = toMapXY(s.lat, s.lon, terrain.sphereRadiusM);
      out.set(s.id, toPixel(terrain, x, y));
    }
    return out;
  }, [sites, terrain]);
  const labels = placeLabels(
    sites
      .filter((s) => s.purpose !== 'sensitivity_demo')
      .map((s) => ({
        id: s.id,
        x: positions.get(s.id)?.col ?? 0,
        y: positions.get(s.id)?.row ?? 0,
      })),
    LABEL_FONT + 4,
    LABEL_MIN_WIDTH,
  );

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(terrain.width, terrain.height);
    for (let i = 0; i < shade.length; i++) {
      const v = shade[i] as number;
      img.data[i * 4] = v * 0.78;
      img.data[i * 4 + 1] = v * 0.82;
      img.data[i * 4 + 2] = v * 0.9;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [shade, terrain]);

  return (
    <div className="fill" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${terrain.width} ${terrain.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        role="group"
        aria-label="South polar shaded relief map with the sites"
      >
        <foreignObject x={0} y={0} width={terrain.width} height={terrain.height}>
          <canvas
            ref={canvas}
            width={terrain.width}
            height={terrain.height}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </foreignObject>
        <text
          x={10}
          y={terrain.height - 12}
          textAnchor="start"
          fontSize={LABEL_FONT * 0.8}
          style={{ fill: 'var(--text)', paintOrder: 'stroke', stroke: 'var(--bg)', strokeWidth: 4 }}
        >
          Up = 0° E (toward Earth) · pole at centre
        </text>
        {sites.map((s) => {
          const { col, row } = positions.get(s.id) ?? { col: 0, row: 0 };
          const label = labels.find((l) => l.id === s.id);
          const selected = s.id === selectedId;
          const demo = s.purpose === 'sensitivity_demo';
          return (
            <g
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${s.name}`}
              aria-pressed={selected}
              onClick={() => onSelect(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(s.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={col}
                cy={row}
                r={selected ? 11 : 8}
                fill={demo ? 'none' : 'var(--text)'}
                stroke={selected ? 'var(--sun)' : demo ? 'var(--text)' : 'var(--bg)'}
                strokeWidth={selected ? 5 : 2.5}
              />
              {!demo && label && (
                <text
                  x={label.x + 14}
                  y={label.y + 8}
                  fontSize={LABEL_FONT}
                  style={{
                    fill: 'var(--text)',
                    paintOrder: 'stroke',
                    stroke: 'var(--bg)',
                    strokeWidth: 5,
                  }}
                >
                  {shortName(s.name)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
