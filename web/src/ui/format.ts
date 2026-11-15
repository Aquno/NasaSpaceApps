/**
 * What: Display helpers that are not language text: verdict icons and short site names.
 *   (All words, numbers and dates are formatted by the i18n translator, D38.)
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { SiteStatus } from '../calc/evaluate';

export const VERDICT_ICON: Record<SiteStatus, string> = {
  viable: '✓',
  marginal: '◐',
  'not-viable': '✕',
  'below-science': '◇',
};

/** Short display names for tight places (drops a parenthesised suffix). Proper names stay. */
export const shortName = (name: string) => name.replace(/\s*\(.*\)$/, '');

/**
 * Longitude for display (D53): 0-180 with East or West instead of a signed value. Only the
 * display changes; the data keep east-positive longitudes. 180° is shown as East.
 */
export function lonDisplay(lonDeg: number): { deg: number; east: boolean } {
  let w = lonDeg; // wrapped to (-180, 180]; values already in range are kept exactly
  while (w > 180) w -= 360;
  while (w <= -180) w += 360;
  return { deg: Math.abs(w), east: w >= 0 };
}
