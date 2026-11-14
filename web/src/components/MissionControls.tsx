/**
 * What: Mission controls: planned landing date (within the data year), mission duration and
 *   launch delay in days; shows the effective landing date. Display and input only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { MAX_DELAY_DAYS, MISSION_DURATION_OPTIONS_H, PITCH_DELAY_DAYS } from '../config/scoring';
import type { MissionInputs } from '../state/useMission';
import { fmtDate } from '../ui/format';

interface Props {
  inputs: MissionInputs;
  landingMs: number;
  dataStartMs: number;
  dataEndMs: number;
  onChange: (patch: Partial<MissionInputs>) => void;
}

export function MissionControls({ inputs, landingMs, dataStartMs, dataEndMs, onChange }: Props) {
  return (
    <div className="controls">
      <label className="control">
        <span className="caps">Planned landing (UTC)</span>
        <input
          type="date"
          value={fmtDate(inputs.plannedMs)}
          min={fmtDate(dataStartMs)}
          max={fmtDate(dataEndMs)}
          onChange={(e) => {
            const ms = Date.parse(`${e.target.value}T00:00:00Z`);
            if (Number.isFinite(ms)) onChange({ plannedMs: ms });
          }}
        />
      </label>
      <label className="control">
        <span className="caps">Mission duration</span>
        <select
          value={inputs.durationH}
          onChange={(e) => onChange({ durationH: Number(e.target.value) })}
        >
          {MISSION_DURATION_OPTIONS_H.map((h) => (
            <option key={h} value={h}>
              {h / 24} days
            </option>
          ))}
        </select>
      </label>
      <label className="control">
        <span className="caps">Launch delay</span>
        <input
          type="range"
          min={0}
          max={MAX_DELAY_DAYS}
          step={1}
          value={inputs.delayDays}
          onChange={(e) => onChange({ delayDays: Number(e.target.value) })}
          aria-valuetext={`${inputs.delayDays} days`}
        />
      </label>
      <div className="control">
        <span className="caps">Landing with delay</span>
        <span className="delay-readout">
          +{inputs.delayDays} d → {fmtDate(landingMs)}
        </span>
      </div>
      <button
        type="button"
        className="linkbtn"
        onClick={() => onChange({ delayDays: PITCH_DELAY_DAYS })}
      >
        Slip launch {PITCH_DELAY_DAYS} days
      </button>
      <button type="button" className="linkbtn" onClick={() => onChange({ delayDays: 0 })}>
        No delay
      </button>
    </div>
  );
}
