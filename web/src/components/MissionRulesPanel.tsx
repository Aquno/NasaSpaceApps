/**
 * What: "Mission rules" block: shows and edits the verdict rules (team choices, not NASA
 *   requirements). Input only; the rules are applied by the calc module.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decisions D25, D31, D32, D37.
 */
import type { ReactNode } from 'react';
import { DEFAULT_RULES, type MissionRules } from '../config/scoring';
import { useI18n } from '../i18n/I18nProvider';

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

export function MissionRulesPanel({ rules, onChange }: Props) {
  const { t } = useI18n();
  const set = (patch: Partial<MissionRules>) => onChange({ ...rules, ...patch });
  const num = (v: string, fallback: number) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
  const pctInput = (key: keyof MissionRules, value: number) => (
    <input
      type="number"
      min={0}
      max={100}
      value={Math.round(value * PERCENT)}
      onChange={(e) => set({ [key]: num(e.target.value, 0) / PERCENT } as Partial<MissionRules>)}
    />
  );
  return (
    <div className="rules">
      <p className="note">{t('rules.note')}</p>
      <div className="rules-grid">
        <Field label={t('rules.sunAtLanding')}>
          <input
            type="checkbox"
            checked={rules.requireSunAtLanding}
            onChange={(e) => set({ requireSunAtLanding: e.target.checked })}
          />
        </Field>
        <Field label={t('rules.survival')}>
          <input
            type="number"
            min={1}
            value={rules.survivalDarknessHours}
            onChange={(e) =>
              set({ survivalDarknessHours: num(e.target.value, rules.survivalDarknessHours) })
            }
          />
        </Field>
        <Field label={t('rules.minSun')}>{pctInput('minSunFraction', rules.minSunFraction)}</Field>
        <Field label={t('rules.marginalSun')}>
          {pctInput('marginalBelowSunFraction', rules.marginalBelowSunFraction)}
        </Field>
        <Field label={t('rules.viableEng')}>
          <input
            type="number"
            min={0}
            max={100}
            value={rules.viableMinEngineering}
            onChange={(e) => set({ viableMinEngineering: num(e.target.value, 0) })}
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
            <input
              type="number"
              min={0}
              max={100}
              value={rules.minScienceScore}
              disabled={!rules.minScienceEnabled}
              onChange={(e) => set({ minScienceScore: num(e.target.value, 0) })}
              aria-label={t('rules.scienceFilterValue')}
            />
          </span>
        </Field>
        <Field label={t('rules.relay')}>
          {pctInput('lowLinkBelowEarthFraction', rules.lowLinkBelowEarthFraction)}
        </Field>
        <Field label={t('rules.slope')}>
          <input
            type="number"
            min={0}
            max={45}
            value={rules.maxSlopeDeg}
            onChange={(e) => set({ maxSlopeDeg: num(e.target.value, rules.maxSlopeDeg) })}
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
