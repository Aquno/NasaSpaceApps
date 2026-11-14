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
    expect(EN.t('card.sun', { p: 0.86 })).toBe('Sun 86%');
    expect(PT.t('card.sun', { p: 0.86 })).toBe('Sol 86%');
    expect(EN.hours(9)).toBe('9 h');
    expect(PT.hours(120)).toBe('5 dias');
    expect(EN.t('card.psr', { km: 2.657 })).toBe('2.7 km to permanent shadow');
    expect(PT.t('card.psr', { km: 2.657 })).toBe('2,7 km até a sombra permanente');
    const day = Date.parse('2027-03-04T05:00:00Z');
    expect(EN.dateTime(day)).toContain('05:00');
    expect(PT.date(day)).toContain('2027');
  });
  it('uses the singular for 1 and the plural otherwise, in both languages', () => {
    const EN = createTranslator(en, 'en');
    const PT = createTranslator(ptBR, 'pt-BR');
    expect(EN.t('controls.slip', { n: 1 })).toBe('+1 day');
    expect(EN.t('controls.slip', { n: 21 })).toBe('+21 days');
    expect(EN.t('controls.delayAria', { d: 0 })).toBe('0 days');
    const day = Date.parse('2027-03-25T00:00:00Z');
    expect(PT.t('earliest.value', { site: 'X', date: day, n: 1 })).toContain('(1 dia seguido)');
    expect(PT.t('earliest.value', { site: 'X', date: day, n: 3 })).toContain('(3 dias seguidos)');
  });
});
