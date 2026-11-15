/**
 * What: "Mission rules" block: shows and edits the verdict rules (team choices, not NASA
 *   requirements). Each number is limited to a valid range and step (config RULE_LIMITS, D53);
 *   an empty or invalid entry keeps the last valid value and shows a short note, never zero.
 *   Input only; the rules are applied by the calc module.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decisions D25, D31, D32, D37, D53.
 */
import { useId, useState, type ReactNode } from 'react';
import { DEFAULT_RULES, RULE_LIMITS, type MissionRules } from '../config/scoring';
import { useI18n } from '../i18n/I18nProvider';
import { parseRuleInput, type RuleLimit } from '../ui/ruleInput';

interface Props {
  rules: MissionRules;
  onChange: (rules: MissionRules) => void;
}

const PERCENT = 100;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="control">
      <span className="caps">{label}</span>
      {children}
    </label>
  );
}

interface NumberInputProps {
  label: string;
  /** Current valid value, in screen units. */
  value: number;
  limit: RuleLimit;
  disabled?: boolean;
  onCommit: (value: number) => void;
}

/** Number field that only commits values inside its range (D53). */
function NumberInput({ label, value, limit, disabled = false, onCommit }: NumberInputProps) {
  const { t } = useI18n();
  const noteId = useId();
  // Draft text while typing; it follows the value when the value changes from outside (reset).
  const [draft, setDraft] = useState({ text: String(value), forValue: value });
  if (draft.forValue !== value) setDraft({ text: String(value), forValue: value });
  const invalid = parseRuleInput(draft.text, limit) === null;
  return (
    <>
      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={invalid ? noteId : undefined}
        className={invalid ? 'invalid' : undefined}
        min={limit.min}
        max={limit.max}
        step={limit.step}
        disabled={disabled}
        value={draft.text}
        onChange={(e) => {
          const text = e.target.value;
          const parsed = parseRuleInput(text, limit);
          setDraft({ text, forValue: parsed ?? value });
          if (parsed !== null && parsed !== value) onCommit(parsed);
        }}
        onBlur={() => {
          if (invalid) setDraft({ text: String(value), forValue: value });
        }}
      />
      {invalid && (
        <span id={noteId} className="field-note" role="status">
          {t('rules.invalid', { min: limit.min, max: limit.max, v: String(value) })}
        </span>
      )}
    </>
  );
}

export function MissionRulesPanel({ rules, onChange }: Props) {
  const { t } = useI18n();
  const set = (patch: Partial<MissionRules>) => onChange({ ...rules, ...patch });
  const pct = (key: keyof MissionRules, label: string) => (
    <NumberInput
      label={label}
      value={Math.round((rules[key] as number) * PERCENT)}
      limit={RULE_LIMITS.percent}
      onCommit={(v) => set({ [key]: v / PERCENT } as Partial<MissionRules>)}
    />
  );
  return (
    <div className="rules">
      <p className="note">{t('rules.note')}</p>
      <div className="rules-grid">
        <Field label={t('rules.sunAtLanding')}>
          <input
            type="checkbox"
            aria-label={t('rules.sunAtLanding')}
            checked={rules.requireSunAtLanding}
            onChange={(e) => set({ requireSunAtLanding: e.target.checked })}
          />
        </Field>
        <Field label={t('rules.survival')}>
          <NumberInput
            label={t('rules.survival')}
            value={rules.survivalDarknessHours}
            limit={RULE_LIMITS.survivalDarknessHours}
            onCommit={(v) => set({ survivalDarknessHours: v })}
          />
        </Field>
        <Field label={t('rules.minSun')}>{pct('minSunFraction', t('rules.minSun'))}</Field>
        <Field label={t('rules.marginalSun')}>
          {pct('marginalBelowSunFraction', t('rules.marginalSun'))}
        </Field>
        <Field label={t('rules.viableEng')}>
          <NumberInput
            label={t('rules.viableEng')}
            value={rules.viableMinEngineering}
            limit={RULE_LIMITS.score}
            onCommit={(v) => set({ viableMinEngineering: v })}
          />
        </Field>
        <Field label={t('rules.scienceFilter')}>
          <span>
            <input
              type="checkbox"
              checked={rules.minScienceEnabled}
              onChange={(e) => set({ minScienceEnabled: e.target.checked })}
              aria-label={t('rules.scienceFilterEnable')}
            />{' '}
            <NumberInput
              label={t('rules.scienceFilterValue')}
              value={rules.minScienceScore}
              limit={RULE_LIMITS.score}
              disabled={!rules.minScienceEnabled}
              onCommit={(v) => set({ minScienceScore: v })}
            />
          </span>
        </Field>
        <Field label={t('rules.relay')}>{pct('lowLinkBelowEarthFraction', t('rules.relay'))}</Field>
        <Field label={t('rules.slope')}>
          <NumberInput
            label={t('rules.slope')}
            value={rules.maxSlopeDeg}
            limit={RULE_LIMITS.maxSlopeDeg}
            onCommit={(v) => set({ maxSlopeDeg: v })}
          />
        </Field>
        <button type="button" className="linkbtn" onClick={() => onChange(DEFAULT_RULES)}>
          {t('rules.reset')}
        </button>
      </div>
      <p className="note">{t('rules.explain')}</p>
    </div>
  );
}
