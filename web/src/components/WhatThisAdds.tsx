/**
 * What: "Today / With this tool" comparison (D27): factual, names the existing NASA tools as the
 *   sources and the tools for detailed analysis. Text from the dictionaries.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const ROWS: [MessageKey, MessageKey][] = [
  ['adds.r1a', 'adds.r1b'],
  ['adds.r2a', 'adds.r2b'],
  ['adds.r3a', 'adds.r3b'],
  ['adds.r4a', 'adds.r4b'],
  ['adds.r5a', 'adds.r5b'],
];

export function WhatThisAddsTable() {
  const { t } = useI18n();
  return (
    <>
      <table className="compare">
        <thead>
          <tr>
            <th scope="col">{t('adds.today')}</th>
            <th scope="col">{t('adds.withTool')}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([today, tool]) => (
            <tr key={today}>
              <td>{t(today)}</td>
              <td>{t(tool)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{t('adds.note')}</p>
    </>
  );
}
