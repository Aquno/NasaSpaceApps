/**
 * What: Tiny i18n core (no library, D38): message templates with typed placeholders, formatted
 *   with the platform Intl API (numbers, percent, dates in UTC). Pure functions.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: a message dictionary, a locale, a key and parameters.
 * Outputs: the translated string.
 *
 * Placeholder syntax: {name} or {name:type} with type in
 *   int, dec1, dec1floor, pct (fraction 0-1), deg1, km1, hours (h or days), date, datetime,
 *   verdict (VerdictKind, translated with the verdict.* keys), msg (another message key).
 */
import type { MessageKey, Messages } from './messages';

export type Locale = 'en' | 'pt-BR';
export const LOCALES: Locale[] = ['en', 'pt-BR'];
export type ParamValue = string | number;
export type Params = Record<string, ParamValue>;

/** A message to translate later (used by the calc module for verdict reasons). */
export interface Msg {
  key: MessageKey;
  params?: Params;
}

const DAY_HOURS = 24;
const DAYS_FROM_HOURS = 48; // durations of 48 h or more are shown in days

export interface Translator {
  locale: Locale;
  t: (key: MessageKey, params?: Params) => string;
  msg: (m: Msg) => string;
  num: (value: number, decimals?: number) => string;
  pct: (fraction: number) => string;
  hours: (h: number | null) => string;
  date: (ms: number) => string;
  dateTime: (ms: number) => string;
}

export function createTranslator(messages: Messages, locale: Locale): Translator {
  const nf = (decimals: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  const num = (value: number, decimals = 0) => nf(decimals).format(value);
  const pct = (fraction: number) =>
    new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(fraction);
  const date = (ms: number) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(ms);
  const dateTime = (ms: number) =>
    `${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23', timeZone: 'UTC' }).format(ms)} UTC`;

  const t = (key: MessageKey, params: Params = {}): string =>
    messages[key].replace(/\{(\w+)(?::(\w+))?\}/g, (_m, name: string, type?: string) => {
      const v = params[name];
      if (v === undefined) return `{${name}}`;
      if (typeof v === 'string' && type !== 'verdict' && type !== 'msg') return v;
      switch (type) {
        case 'int':
          return num(Number(v), 0);
        case 'dec1':
          return num(Number(v), 1);
        case 'dec1floor':
          return num(Math.floor(Number(v) * 10) / 10, 1);
        case 'pct':
          return pct(Number(v));
        case 'deg1':
          return `${num(Number(v), 1)}°`;
        case 'km1':
          return t('unit.km', { n: num(Number(v), 1) });
        case 'hours':
          return hours(Number(v));
        case 'date':
          return date(Number(v));
        case 'datetime':
          return dateTime(Number(v));
        case 'verdict':
          return t(`verdict.${String(v)}` as MessageKey);
        case 'msg':
          return t(String(v) as MessageKey);
        default:
          return String(v);
      }
    });

  function hours(h: number | null): string {
    if (h === null) return t('unit.beyondData');
    return h >= DAYS_FROM_HOURS
      ? t('unit.days', { n: num(Math.round(h / DAY_HOURS), 0) })
      : t('unit.hours', { n: num(Math.round(h), 0) });
  }

  return { locale, t, msg: (m) => t(m.key, m.params), num, pct, hours, date, dateTime };
}

/** Placeholder names used in a template (for consistency tests between languages). */
export function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)(?::\w+)?\}/g)].map((m) => m[1] as string).sort();
}
