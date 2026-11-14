/**
 * What: One strip per site across 2027: daily share of hours with the Sun (top) and with the
 *   Earth (bottom) visible, with the planned and delayed landing dates and the mission span.
 *   Display only (fractions come from calc/annual.ts).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { DailyFractions } from '../calc/annual';
import type { SiteSummary } from '../data/contract';
import { fmtDate } from '../ui/format';

const DAY_MS = 86_400_000;
const ROW_H = 10;
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

interface Props {
  sites: SiteSummary[];
  daily: Map<string, DailyFractions>;
  plannedMs: number;
  landingMs: number;
  durationH: number;
  selectedId: string | null;
}

export function AnnualStrips({ sites, daily, plannedMs, landingMs, durationH, selectedId }: Props) {
  const first = daily.values().next().value?.firstDayMs ?? 0;
  const dayOf = (ms: number) => (ms - first) / DAY_MS;
  const days = daily.values().next().value?.sun.length ?? 365;
  const missionDays = durationH / 24;
  const year = new Date(first).getUTCFullYear();
  return (
    <section className="panel strips" aria-label={`${year} at a glance`}>
      <h2>{year} at a glance: when each site has Sun and Earth</h2>
      <div className="legend">
        <span>
          <span className="swatch" style={{ background: 'var(--sun)' }} />● share of the day with
          the Sun visible
        </span>
        <span>
          <span className="swatch" style={{ background: 'var(--earth)' }} />▲ share of the day with
          the Earth visible
        </span>
        <span>┆ planned landing {fmtDate(plannedMs)}</span>
        <span>┃ landing with delay {fmtDate(landingMs)} + mission</span>
      </div>
      {sites.map((s) => {
        const d = daily.get(s.id);
        if (!d) return null;
        return (
          <div className="strip-row" key={s.id}>
            <div className="name" style={{ fontWeight: s.id === selectedId ? 700 : 400 }}>
              {s.name}
            </div>
            <svg
              viewBox={`0 0 ${days} ${ROW_H * 2 + 2}`}
              preserveAspectRatio="none"
              style={{ width: '100%', height: 26 }}
              role="img"
              aria-label={`${s.name}: daily Sun and Earth visibility in ${year}`}
            >
              {Array.from(d.sun, (f, i) => (
                <rect
                  key={`s${i}`}
                  x={i}
                  y={0}
                  width={1.05}
                  height={ROW_H}
                  fill="var(--sun)"
                  opacity={f}
                />
              ))}
              {Array.from(d.earth, (f, i) => (
                <rect
                  key={`e${i}`}
                  x={i}
                  y={ROW_H + 2}
                  width={1.05}
                  height={ROW_H}
                  fill="var(--earth)"
                  opacity={f}
                />
              ))}
              <rect
                x={dayOf(landingMs)}
                y={0}
                width={missionDays}
                height={ROW_H * 2 + 2}
                fill="none"
                stroke="var(--text)"
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={dayOf(plannedMs)}
                x2={dayOf(plannedMs)}
                y1={0}
                y2={ROW_H * 2 + 2}
                stroke="var(--text)"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        );
      })}
      <div className="strip-row">
        <div />
        <div style={{ position: 'relative', height: 16 }} aria-hidden="true">
          {MONTHS.map((m, k) => (
            <span
              key={k}
              className="caps"
              style={{
                position: 'absolute',
                left: `${(dayOf(Date.UTC(year, k, 1)) / days) * 100}%`,
              }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
