/**
 * What: Direct-to-Earth link summary of a mission (one line in the interface): share of the
 *   mission with a direct line of sight, longest gap, and whether coverage is low by the rules.
 *   Pure function.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision docs/DECISOES.md D37.
 * Inputs: MissionMetrics (fractions 0-1, hours), MissionRules (lowLinkBelowEarthFraction).
 * Outputs: LinkStatus.
 * NASA data source: Horizons ephemerides and LOLA horizon via data/app.
 */
import { DEFAULT_RULES, type MissionRules } from '../config/scoring';
import type { MissionMetrics } from './metrics';

export interface LinkStatus {
  /** 'continuous': no gap; 'gaps': some gaps (relay needed during them); 'low': coverage below the rule. */
  kind: 'continuous' | 'gaps' | 'low';
  /** Share of mission hours with some part of the Earth visible, 0-1. */
  fraction: number;
  /** Longest period without direct contact, hours. */
  longestGapHours: number;
}

export function linkStatus(
  m: Pick<MissionMetrics, 'earthFraction' | 'longestNoContactHours'>,
  rules: MissionRules = DEFAULT_RULES,
): LinkStatus {
  const base = { fraction: m.earthFraction, longestGapHours: m.longestNoContactHours };
  if (m.earthFraction < rules.lowLinkBelowEarthFraction) return { kind: 'low', ...base };
  if (m.longestNoContactHours > 0) return { kind: 'gaps', ...base };
  return { kind: 'continuous', ...base };
}
