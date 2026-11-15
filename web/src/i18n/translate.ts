/**
 * What: Tiny i18n core (no library, D38): message templates with typed placeholders, formatted
 *   with the platform Intl API (numbers, percent, dates in UTC). Pure functions.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: a message dictionary, a locale, a key and parameters.
 * Outputs: the translated string.
 *
 * Placeholder syntax: {name} or {name:type} with type in
 *   int, dec1, dec1floor, pct (fraction 0-1), deg1, km1, hours (h or days), date, daymonth, datetime,
 *   verdict (VerdictKind, translated with the verdict.* keys), msg (another message key).
 * Plural: {name:plural:singular|plural} picks the singular form when the value is exactly 1 and
 *   the plural form otherwise (0 too), in both languages (D50). Write the number separately,
 *   e.g. "{n:int} {n:plural:day|days}".
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

/** {name}, {name:type} or {name:plural:one|other}. */
const PLACEHOLDER = /\{(\w+)(?::(\w+)(?::([^}]*))?)?\}/g;
const DAY_HOURS = 24;
// Durations up to 72 h are shown in hours; longer ones in days with one decimal (D53).
const MAX_HOURS_SHOWN = 72;

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
  // Day, abbreviated month (and year) in the interface language, never the OS format (D52):
  // "Mar 4, 2027" / "4 mar 2027" (word separators such as "de" and the month's dot dropped).
  const shortDate = (withYear: boolean) => (ms: number) =>
    new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
      timeZone: 'UTC',
    })
      .formatToParts(ms)
      .map((p) => {
        if (p.type === 'month') return p.value.replace(/\.$/, '');
        if (p.type === 'literal' && /^\s*\p{L}+\s*$/u.test(p.value)) return ' ';
        return p.value;
      })
      .join('');
  const date = shortDate(true);
  const dayMonth = shortDate(false);
  const time = (ms: number) =>
    new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'UTC',
    }).format(ms);
  const dateTime = (ms: number) => `${date(ms)} ${time(ms)} UTC`;

  const t = (key: MessageKey, params: Params = {}): string =>
    messages[key].replace(PLACEHOLDER, (_m, name: string, type?: string, forms?: string) => {
      const v = params[name];
      if (v === undefined) return `{${name}}`;
      if (type === 'plural') {
        const [one = '', other = one] = (forms ?? '').split('|');
        return Math.abs(Number(v)) === 1 ? one : other;
      }
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
        case 'daymonth':
          return dayMonth(Number(v));
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
    return h > MAX_HOURS_SHOWN
      ? t('unit.days', { n: num(h / DAY_HOURS, 1) })
      : t('unit.hours', { n: num(Math.round(h), 0) });
  }

  return { locale, t, msg: (m) => t(m.key, m.params), num, pct, hours, date, dateTime };
}

/** Placeholder names used in a template (for consistency tests between languages). */
export function placeholders(template: string): string[] {
  return [...new Set([...template.matchAll(PLACEHOLDER)].map((m) => m[1] as string))].sort();
}
