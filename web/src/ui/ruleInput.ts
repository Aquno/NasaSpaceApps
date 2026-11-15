/**
 * What: Parse a typed mission-rule value (D53): accepts a number inside the field's range,
 *   rounded to its step; anything else (empty, text, out of range) is rejected so the last valid
 *   value is kept. Pure function. Presentation only; the rules are applied by calc/scores.ts.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
export interface RuleLimit {
  min: number;
  max: number;
  step: number;
}

/** Valid value in screen units, or null when the text is empty, not a number or out of range. */
export function parseRuleInput(text: string, limit: RuleLimit): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < limit.min || n > limit.max) return null;
  const stepped = Math.round(n / limit.step) * limit.step;
  // Avoid binary noise such as 2.5000000000000004 from the step multiplication.
  return Number(stepped.toFixed(6));
}
