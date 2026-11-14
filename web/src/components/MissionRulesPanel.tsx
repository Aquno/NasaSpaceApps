/**
 * What: "Mission rules" block: shows and edits the verdict rules (team choices, not NASA
 *   requirements). Input only; the rules are applied by the calc module.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D25.
 */
import { DEFAULT_RULES, type MissionRules } from '../config/scoring';

interface Props {
  rules: MissionRules;
  onChange: (rules: MissionRules) => void;
}

const PERCENT = 100;

export function MissionRulesPanel({ rules, onChange }: Props) {
  const set = (patch: Partial<MissionRules>) => onChange({ ...rules, ...patch });
  const num = (v: string, fallback: number) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
  return (
    <details className="panel rules">
      <summary>
        <strong>Mission rules</strong>{' '}
        <span className="note">
          — defaults are our team&apos;s choices for this demo, not NASA requirements
        </span>
      </summary>
      <div className="rules-grid">
        <label className="control">
          <span className="caps">Sun visible at landing</span>
          <input
            type="checkbox"
            checked={rules.requireSunAtLanding}
            onChange={(e) => set({ requireSunAtLanding: e.target.checked })}
          />
        </label>
        <label className="control">
          <span className="caps">Survival limit: longest darkness (h)</span>
          <input
            type="number"
            min={1}
            value={rules.survivalDarknessHours}
            onChange={(e) =>
              set({ survivalDarknessHours: num(e.target.value, rules.survivalDarknessHours) })
            }
          />
        </label>
        <label className="control">
          <span className="caps">Minimum sunlit share (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(rules.minSunFraction * PERCENT)}
            onChange={(e) => set({ minSunFraction: num(e.target.value, 0) / PERCENT })}
          />
        </label>
        <label className="control">
          <span className="caps">Marginal below sunlit share (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(rules.marginalBelowSunFraction * PERCENT)}
            onChange={(e) => set({ marginalBelowSunFraction: num(e.target.value, 0) / PERCENT })}
          />
        </label>
        <label className="control">
          <span className="caps">Viable: engineering ≥</span>
          <input
            type="number"
            min={0}
            max={100}
            value={rules.viableMinEngineering}
            onChange={(e) => set({ viableMinEngineering: num(e.target.value, 0) })}
          />
        </label>
        <label className="control">
          <span className="caps">Viable: science ≥</span>
          <input
            type="number"
            min={0}
            max={100}
            value={rules.viableMinScience}
            onChange={(e) => set({ viableMinScience: num(e.target.value, 0) })}
          />
        </label>
        <label className="control">
          <span className="caps">Max terrain slope (°)</span>
          <input
            type="number"
            min={0}
            max={45}
            value={rules.maxSlopeDeg}
            onChange={(e) => set({ maxSlopeDeg: num(e.target.value, rules.maxSlopeDeg) })}
          />
        </label>
        <button type="button" className="linkbtn" onClick={() => onChange(DEFAULT_RULES)}>
          Reset to defaults
        </button>
      </div>
      <p className="note">
        Not viable: dark at landing, a darkness longer than the survival limit, or too little
        sunlight. Marginal: sunlight below the comfort share, or a score below the viable minimum.
        Earth contact counts through the engineering score. A terrain slope above the limit lowers
        the verdict by one level. Best compromise: the site with the highest of min(engineering,
        science) among sites that are not &quot;not viable&quot;.
      </p>
    </details>
  );
}
