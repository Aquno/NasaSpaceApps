/**
 * What: One strip per site across the data year: daily share of hours with the Sun (top) and with
 *   the Earth (bottom) visible, with the planned and delayed landing dates and the mission span.
 *   Display only (fractions come from calc/annual.ts).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { DailyFractions } from '../calc/annual';
import type { SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';

const DAY_MS = 86_400_000;
const ROW_H = 10;
const MONTHS = 12;

interface Props {
  sites: SiteSummary[];
  daily: Map<string, DailyFractions>;
  plannedMs: number;
  landingMs: number;
  durationH: number;
  selectedId: string | null;
}

export function AnnualStrips({ sites, daily, plannedMs, landingMs, durationH, selectedId }: Props) {
  const { t, locale } = useI18n();
  const first = daily.values().next().value?.firstDayMs ?? 0;
  const dayOf = (ms: number) => (ms - first) / DAY_MS;
  const days = daily.values().next().value?.sun.length ?? 0;
  const missionDays = durationH / 24;
  const year = new Date(first).getUTCFullYear();
  const monthName = new Intl.DateTimeFormat(locale, { month: 'narrow', timeZone: 'UTC' });
  return (
    <div className="strips">
      <div className="legend">
        <span>
          <span className="swatch" style={{ background: 'var(--sun)' }} />● {t('strips.sun')}
        </span>
        <span>
          <span className="swatch" style={{ background: 'var(--earth)' }} />▲ {t('strips.earth')}
        </span>
        <span>┆ {t('strips.planned', { date: plannedMs })}</span>
        <span>┃ {t('strips.delayed', { date: landingMs })}</span>
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
              aria-label={t('strips.rowAria', { site: s.name, year: String(year) })}
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
          {Array.from({ length: MONTHS }, (_, k) => (
            <span
              key={k}
              className="caps"
              style={{
                position: 'absolute',
                left: `${(dayOf(Date.UTC(year, k, 1)) / days) * 100}%`,
              }}
            >
              {monthName.format(Date.UTC(year, k, 1))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
