/**
 * What: The mission rule that decided a verdict, as a message with its current limit (shown in
 *   the expanded card and on the site detail, D50). Presentation only; the rule itself is applied
 *   by calc/scores.ts.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { RuleKey } from '../calc/scores';
import type { MissionRules } from '../config/scoring';
import type { Msg } from '../i18n/translate';

/** Message for the deciding rule, or null when every rule passed. */
export function ruleMsg(rule: RuleKey, rules: MissionRules): Msg | null {
  switch (rule) {
    case 'sunAtLanding':
      return { key: 'rule.sunAtLanding' };
    case 'survivalDarkness':
      return { key: 'rule.survivalDarkness', params: { h: rules.survivalDarknessHours } };
    case 'minSunFraction':
      return { key: 'rule.minSunFraction', params: { p: rules.minSunFraction } };
    case 'marginalSunFraction':
      return { key: 'rule.marginalSunFraction', params: { p: rules.marginalBelowSunFraction } };
    case 'engineering':
      return { key: 'rule.engineering', params: { n: rules.viableMinEngineering } };
    case 'slope':
      return { key: 'rule.slope', params: { s: rules.maxSlopeDeg } };
    case 'allPassed':
      return null;
  }
}
