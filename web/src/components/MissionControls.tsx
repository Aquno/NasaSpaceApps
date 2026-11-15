/**
 * What: Mission controls: landing day (within the data year), mission duration and launch delay;
 *   shows the landing day with the delay. The landing day is shown in the interface language
 *   ("Mar 4, 2027" / "4 mar 2027"), never in the operating system's date format, with a calendar
 *   picker and previous / next day buttons (D52). Display and input only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useId, useRef } from 'react';
import { MAX_DELAY_DAYS, MISSION_DURATION_OPTIONS_H, PITCH_DELAY_DAYS } from '../config/scoring';
import { useI18n } from '../i18n/I18nProvider';
import { DAY_MS, type MissionInputs } from '../state/useMission';

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
  const { t, date } = useI18n();
  const picker = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const firstDay = Date.parse(`${isoDay(dataStartMs)}T00:00:00Z`);
  const lastDay = Date.parse(`${isoDay(dataEndMs)}T00:00:00Z`);
  const setDay = (ms: number) => onChange({ plannedMs: Math.min(Math.max(ms, firstDay), lastDay) });
  const openPicker = () => {
    const el = picker.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };
  return (
    <div className="controls">
      <div className="control" role="group" aria-labelledby={labelId}>
        <span className="caps" id={labelId}>
          {t('controls.landing')}
        </span>
        <span className="date-field">
          <button
            type="button"
            className="date-step"
            aria-label={t('controls.prevDay')}
            disabled={inputs.plannedMs <= firstDay}
            onClick={() => setDay(inputs.plannedMs - DAY_MS)}
          >
            ◂
          </button>
          <span className="date-pick">
            <button
              type="button"
              className="date-display"
              aria-label={t('controls.pickDay', { date: inputs.plannedMs })}
              onClick={openPicker}
            >
              {date(inputs.plannedMs)} <span aria-hidden="true">▾</span>
            </button>
            {/* Native calendar, invisible: only its picker is used (its text follows the OS). */}
            <input
              ref={picker}
              type="date"
              className="date-native"
              tabIndex={-1}
              aria-hidden="true"
              value={isoDay(inputs.plannedMs)}
              min={isoDay(dataStartMs)}
              max={isoDay(dataEndMs)}
              onChange={(e) => {
                const ms = Date.parse(`${e.target.value}T00:00:00Z`);
                if (Number.isFinite(ms)) setDay(ms);
              }}
            />
          </span>
          <button
            type="button"
            className="date-step"
            aria-label={t('controls.nextDay')}
            disabled={inputs.plannedMs >= lastDay}
            onClick={() => setDay(inputs.plannedMs + DAY_MS)}
          >
            ▸
          </button>
        </span>
      </div>
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
          {inputs.delayDays > 0
            ? t('controls.delayReadout', { d: inputs.delayDays, date: landingMs })
            : t('controls.noDelayReadout')}
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
