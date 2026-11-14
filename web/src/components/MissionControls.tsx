/**
 * What: Mission controls: landing day (within the data year), mission duration and launch delay;
 *   shows the landing day with the delay. Display and input only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { MAX_DELAY_DAYS, MISSION_DURATION_OPTIONS_H, PITCH_DELAY_DAYS } from '../config/scoring';
import { useI18n } from '../i18n/I18nProvider';
import type { MissionInputs } from '../state/useMission';

interface Props {
  inputs: MissionInputs;
  landingMs: number;
  dataStartMs: number;
  dataEndMs: number;
  onChange: (patch: Partial<MissionInputs>) => void;
}

/** yyyy-mm-dd for the native date input (UTC). */
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function MissionControls({ inputs, landingMs, dataStartMs, dataEndMs, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="controls">
      <label className="control">
        <span className="caps">{t('controls.landing')}</span>
        <input
          type="date"
          value={isoDay(inputs.plannedMs)}
          min={isoDay(dataStartMs)}
          max={isoDay(dataEndMs)}
          onChange={(e) => {
            const ms = Date.parse(`${e.target.value}T00:00:00Z`);
            if (Number.isFinite(ms)) onChange({ plannedMs: ms });
          }}
        />
      </label>
      <label className="control">
        <span className="caps">{t('controls.duration')}</span>
        <select
          value={inputs.durationH}
          onChange={(e) => onChange({ durationH: Number(e.target.value) })}
        >
          {MISSION_DURATION_OPTIONS_H.map((h) => (
            <option key={h} value={h}>
              {t('controls.durationOption', { n: h / 24 })}
            </option>
          ))}
        </select>
      </label>
      <label className="control">
        <span className="caps">{t('controls.delay')}</span>
        <input
          type="range"
          min={0}
          max={MAX_DELAY_DAYS}
          step={1}
          value={inputs.delayDays}
          onChange={(e) => onChange({ delayDays: Number(e.target.value) })}
          aria-valuetext={t('controls.delayAria', { d: inputs.delayDays })}
        />
      </label>
      <div className="control">
        <span className="caps">{t('controls.withDelay')}</span>
        <span className="delay-readout">
          {t('controls.delayReadout', { d: inputs.delayDays, date: landingMs })}
        </span>
      </div>
      <button
        type="button"
        className="linkbtn"
        onClick={() => onChange({ delayDays: PITCH_DELAY_DAYS })}
      >
        {t('controls.slip', { n: PITCH_DELAY_DAYS })}
      </button>
      <button type="button" className="linkbtn" onClick={() => onChange({ delayDays: 0 })}>
        {t('controls.noDelay')}
      </button>
    </div>
  );
}
