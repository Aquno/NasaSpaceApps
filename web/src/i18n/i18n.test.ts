import { describe, expect, it } from 'vitest';
import { en } from './en';
import type { MessageKey } from './messages';
import { ptBR } from './ptBR';
import { createTranslator, placeholders } from './translate';

describe('dictionaries', () => {
  it('every key has the same placeholders in en and pt-BR', () => {
    for (const key of Object.keys(en) as MessageKey[]) {
      expect([key, placeholders(ptBR[key])]).toEqual([key, placeholders(en[key])]);
    }
  });
  it('formats numbers, percent, hours and dates per locale', () => {
    const EN = createTranslator(en, 'en');
    const PT = createTranslator(ptBR, 'pt-BR');
    expect(EN.t('card.sun', { p: 0.86 })).toBe('86% sun');
    expect(PT.t('card.sun', { p: 0.86 })).toBe('86% de Sol');
    expect(EN.hours(9)).toBe('9 h');
    expect(PT.hours(120)).toBe('5 dias');
    expect(EN.t('card.psr', { km: 2.657 })).toBe('2.7 km to permanent shadow');
    expect(PT.t('card.psr', { km: 2.657 })).toBe('2,7 km até a sombra permanente');
    const day = Date.parse('2027-03-04T05:00:00Z');
    expect(EN.dateTime(day)).toContain('05:00');
    expect(PT.date(day)).toContain('2027');
  });
});
