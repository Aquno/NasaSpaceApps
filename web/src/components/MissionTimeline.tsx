/**
 * What: Mission timeline of one site: Sunlight and Direct-contact bands hour by hour (any part
 *   of the disc visible), a cursor at the selected hour, day ticks, and the count to the next
 *   sunset / loss of contact (or next rise when the body is down). Display only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D42.
 * Inputs: visibility flags (calc/visibility.ts), mission window start/length (records = hours),
 *   cursor offset.
 */
import { recordsToNextRise, recordsToNextSet } from '../calc/metrics';
import { flagRuns } from '../calc/panorama';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const W = 1440;
const ROW_H = 22;
const HOURS_PER_DAY = 24;

interface Props {
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

export function MissionTimeline({ sunAny, earthAny, start, length, cursor }: Props) {
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

  return (
    <div className="timeline">
      {rows.map((r) => (
        <div key={r.cls} className="timeline-row">
          <span className="caps">{t(r.label)}</span>
          <svg viewBox={`0 0 ${W} ${ROW_H}`} preserveAspectRatio="none" aria-hidden="true">
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
            <rect x={sx(cursor) - 1} width={2} y={0} height={ROW_H} className="tl-cursor" />
          </svg>
        </div>
      ))}
      <div className="timeline-row">
        <span />
        <svg viewBox={`0 0 ${W} 16`} preserveAspectRatio="none" aria-hidden="true">
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
