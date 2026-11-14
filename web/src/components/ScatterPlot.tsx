/**
 * What: Science (x) vs engineering (y) scatter: each site at the planned date (hollow) and with
 *   the delay (filled), with the move between them; the viable zone from the mission rules.
 *   Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { Evaluation, SiteEvaluation } from '../calc/evaluate';
import type { MissionRules } from '../config/scoring';
import type { SiteSummary } from '../data/contract';
import { shortName } from '../ui/format';
import { placeLabels } from '../ui/labelLayout';

interface Props {
  sites: SiteSummary[];
  now: Evaluation;
  planned: Evaluation;
  rules: MissionRules;
  delayDays: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const W = 520;
const H = 300;
const M = { l: 44, r: 16, t: 12, b: 34 };
const sx = (v: number) => M.l + (v / 100) * (W - M.l - M.r);
const sy = (v: number) => H - M.b - (v / 100) * (H - M.t - M.b);
const TICKS = [0, 25, 50, 75, 100];
const LABEL_LINE = 22;
const LABEL_MIN_WIDTH = 110;
// Points closer than this to the right edge get their label on the left.
const RIGHT_EDGE_ROOM = 120;

const point = (e: SiteEvaluation | undefined) =>
  e && e.ok ? { x: e.science?.total ?? 0, y: e.engineering.total, kind: e.verdict.kind } : null;

export function ScatterPlot({
  sites,
  now,
  planned,
  rules,
  delayDays,
  selectedId,
  onSelect,
}: Props) {
  const labels = placeLabels(
    sites.flatMap((s) => {
      const b = point(now.sites.find((e) => e.siteId === s.id));
      return b ? [{ id: s.id, x: sx(b.x), y: sy(b.y) - 8 }] : [];
    }),
    LABEL_LINE,
    LABEL_MIN_WIDTH,
  );
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="fill"
      role="img"
      aria-label="Science score versus engineering score for each site"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x={sx(rules.viableMinScience)}
        y={sy(100)}
        width={sx(100) - sx(rules.viableMinScience)}
        height={sy(rules.viableMinEngineering) - sy(100)}
        fill="rgb(232 238 244 / 0.05)"
        stroke="var(--muted)"
        strokeDasharray="4 4"
      />
      <text x={sx(100) - 4} y={sy(100) + 14} textAnchor="end" fontSize="11">
        viable zone (team rules)
      </text>
      {TICKS.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(0) + 4} stroke="var(--border)" />
          <text x={sx(t)} y={sy(0) + 16} textAnchor="middle" fontSize="11">
            {t}
          </text>
          <line x1={sx(0) - 4} x2={sx(0)} y1={sy(t)} y2={sy(t)} stroke="var(--border)" />
          <text x={sx(0) - 8} y={sy(t) + 4} textAnchor="end" fontSize="11">
            {t}
          </text>
        </g>
      ))}
      <line x1={sx(0)} x2={sx(100)} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
      <line x1={sx(0)} x2={sx(0)} y1={sy(0)} y2={sy(100)} stroke="var(--border)" />
      <text
        x={sx(50)}
        y={H - 4}
        textAnchor="middle"
        fontSize="12"
        style={{ fill: 'var(--science)' }}
      >
        Science score ◆
      </text>
      <text
        x={12}
        y={sy(50)}
        textAnchor="middle"
        fontSize="12"
        transform={`rotate(-90 12 ${sy(50)})`}
        style={{ fill: 'var(--sun)' }}
      >
        Engineering score ●▲
      </text>
      {sites.map((s) => {
        const a = point(planned.sites.find((e) => e.siteId === s.id));
        const b = point(now.sites.find((e) => e.siteId === s.id));
        const selected = s.id === selectedId;
        return (
          <g
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{ cursor: 'pointer' }}
            opacity={selectedId && !selected ? 0.55 : 1}
          >
            {a && delayDays !== 0 && (
              <circle cx={sx(a.x)} cy={sy(a.y)} r={5} fill="none" stroke="var(--muted)" />
            )}
            {a && b && delayDays !== 0 && (
              <line
                x1={sx(a.x)}
                y1={sy(a.y)}
                x2={sx(b.x)}
                y2={sy(b.y)}
                stroke="var(--muted)"
                strokeDasharray="3 3"
              />
            )}
            {b && (
              <>
                <circle
                  cx={sx(b.x)}
                  cy={sy(b.y)}
                  r={selected ? 8 : 6}
                  fill={b.kind === 'not-viable' ? 'var(--bg)' : 'var(--text)'}
                  stroke="var(--text)"
                  strokeWidth={2}
                  style={{ transition: 'cx 300ms, cy 300ms' }}
                />
                <text
                  x={
                    sx(b.x) > W - RIGHT_EDGE_ROOM
                      ? sx(b.x) - 10
                      : (labels.find((l) => l.id === s.id)?.x ?? sx(b.x)) + 10
                  }
                  y={labels.find((l) => l.id === s.id)?.y ?? sy(b.y) - 8}
                  textAnchor={sx(b.x) > W - RIGHT_EDGE_ROOM ? 'end' : 'start'}
                  fontSize="13"
                  style={{ fill: 'var(--text)' }}
                >
                  {shortName(s.name)}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
