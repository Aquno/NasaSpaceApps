/**
 * What: Mission timeline of one site: Sunlight and Direct-contact bands hour by hour (any part
 *   of the disc visible), a cursor at the selected hour, day ticks, and the count to the next
 *   sunset / loss of contact (or next rise when the body is down). The current-instant marker
 *   matches the time control and moves with play; a click on the bands moves it. Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D42.
 * Inputs: visibility flags (calc/visibility.ts), mission window start/length (records = hours),
 *   cursor offset.
 */
import type { MouseEvent } from 'react';
import { recordsToNextRise, recordsToNextSet } from '../calc/metrics';
import { flagRuns } from '../calc/panorama';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const W = 1440;
const ROW_H = 22;
const HOURS_PER_DAY = 24;

interface Props {
  /** Time of the cursor (ms UTC), shown on the marker. */
  nowMs: number;
  /** Moves the cursor when the timeline is clicked (record offset). */
  onSeek?: (offset: number) => void;
  sunAny: Uint8Array;
  earthAny: Uint8Array;
  start: number;
  length: number;
  cursor: number;
}

/** Hours until the next change, limited to the mission; null when none before it ends. */
function untilChange(flags: Uint8Array, index: number, end: number): number | null {
  const down = flags[index] === 0;
  const n = down ? recordsToNextRise(flags, index) : recordsToNextSet(flags, index);
  return n !== null && index + n <= end ? n : null;
}

export function MissionTimeline({ nowMs, onSeek, sunAny, earthAny, start, length, cursor }: Props) {
  const { t } = useI18n();
  const sx = (k: number) => (k / length) * W;
  const end = start + length;
  const index = start + cursor;
  const rows: { flags: Uint8Array; cls: string; label: MessageKey }[] = [
    { flags: sunAny, cls: 'sun', label: 'detail.sunRow' },
    { flags: earthAny, cls: 'earth', label: 'detail.earthRow' },
  ];
  const sunN = untilChange(sunAny, index, end);
  const earthN = untilChange(earthAny, index, end);
  const sunUp = sunAny[index] === 1;
  const earthUp = earthAny[index] === 1;
  const days = Math.floor(length / HOURS_PER_DAY);

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const box = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    onSeek(Math.round(f * (length - 1)));
  };

  return (
    <div className="timeline">
      <div className="timeline-grid">
        <div className="timeline-labels">
          {rows.map((r) => (
            <span key={r.cls} className="caps">
              {t(r.label)}
            </span>
          ))}
        </div>
        <div className="timeline-bars" onClick={seek}>
          {rows.map((r) => (
            <svg
              key={r.cls}
              viewBox={`0 0 ${W} ${ROW_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {flagRuns(r.flags, start, length).map((run) => (
                <rect
                  key={run.from}
                  x={sx(run.from)}
                  width={sx(run.from + run.length) - sx(run.from)}
                  y={0}
                  height={ROW_H}
                  className={run.on ? `tl-on ${r.cls}` : 'tl-off'}
                />
              ))}
            </svg>
          ))}
          <svg viewBox={`0 0 ${W} 8`} preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: days + 1 }, (_, d) => (
              <rect
                key={d}
                x={sx(d * HOURS_PER_DAY)}
                width={1}
                y={0}
                height={6}
                className="tl-tick"
              />
            ))}
          </svg>
          {/* Current instant: the same marker as the time control above (D51). */}
          <div
            className="now-marker"
            style={{ left: `${(cursor / Math.max(1, length - 1)) * 100}%` }}
          >
            <span className="now-chip">{t('detail.now', { t: nowMs })}</span>
          </div>
        </div>
      </div>
      <p className="timeline-counts" aria-live="polite">
        <span className="sun">
          ●{' '}
          {sunUp
            ? sunN === null
              ? t('detail.noSunset')
              : t('detail.nextSunset', { h: sunN })
            : sunN === null
              ? t('detail.noSunrise')
              : t('detail.nextSunrise', { h: sunN })}
        </span>
        <span className="earth">
          ▲{' '}
          {earthUp
            ? earthN === null
              ? t('detail.noEarthLoss')
              : t('detail.nextEarthLoss', { h: earthN })
            : earthN === null
              ? t('detail.noEarthRise')
              : t('detail.nextEarthRise', { h: earthN })}
        </span>
      </p>
    </div>
  );
}
