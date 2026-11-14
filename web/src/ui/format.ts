/**
 * What: Display formatting helpers (no calculation): dates, hours, percentages, verdict labels.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import type { VerdictKind } from '../calc/scores';

export const fmtDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const fmtPct = (fraction: number) => `${Math.round(fraction * 100)}%`;
export const fmtScore = (score: number) => Math.round(score).toString();
export function fmtHours(h: number | null): string {
  if (h === null) return 'beyond 2027 data';
  return h >= 48 ? `${(h / 24).toFixed(1)} d` : `${Math.round(h)} h`;
}
export const fmtKm = (km: number | null) => (km === null ? 'n/a' : `${km.toFixed(1)} km`);

export const VERDICT_LABEL: Record<VerdictKind, { icon: string; text: string }> = {
  viable: { icon: '✓', text: 'VIABLE' },
  marginal: { icon: '◐', text: 'MARGINAL' },
  'not-viable': { icon: '✕', text: 'NOT VIABLE' },
};

/** Short display names for tight places (scatter labels). */
export const shortName = (name: string) => name.replace(/\s*\(.*\)$/, '');
export const fmtDateTime = (ms: number) =>
  `${new Date(ms).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
