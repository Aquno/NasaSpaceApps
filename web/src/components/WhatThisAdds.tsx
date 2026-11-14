/**
 * What: "Today / With this tool" comparison (D27): factual, names the existing NASA tools as the
 *   sources and the tools for detailed analysis. Static text.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
const ROWS: [string, string][] = [
  ['One scenario at a time', 'Several sites side by side'],
  ['Raw data', 'A verdict with its reason'],
  ['Three interfaces', 'One screen'],
  ['Engineering only', 'Science and engineering'],
  ['Redo everything when the date changes', 'A delay control'],
];

export function WhatThisAddsTable() {
  return (
    <>
      <table className="compare">
        <thead>
          <tr>
            <th scope="col">Today</th>
            <th scope="col">With this tool</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([today, tool]) => (
            <tr key={today}>
              <td>{today}</td>
              <td>{tool}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">
        JPL Horizons, LROC Quickmap and NASA Moon Trek remain the sources and the tools for detailed
        analysis.
      </p>
    </>
  );
}
