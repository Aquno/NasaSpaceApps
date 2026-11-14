/**
 * What: Display helpers that are not language text: verdict icons and short site names.
 *   (All words, numbers and dates are formatted by the i18n translator, D38.)
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { VerdictKind } from '../calc/scores';

export const VERDICT_ICON: Record<VerdictKind, string> = {
  viable: '✓',
  marginal: '◐',
  'not-viable': '✕',
};

/** Short display names for tight places (drops a parenthesised suffix). Proper names stay. */
export const shortName = (name: string) => name.replace(/\s*\(.*\)$/, '');
