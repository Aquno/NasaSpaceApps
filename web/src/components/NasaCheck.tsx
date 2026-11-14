/**
 * What: Stage 6 comparison on the dashboard (D45): for each site, % of the data year's hours
 *   with the Sun / the Earth visible, computed by the same calc module, beside NASA's averages
 *   (PGDA product 69), with the short reasons why equality is not expected. Display only.
 * Roadmap stage: 6 — Validation (see docs/ROTEIRO.md).
 */
import { yearVisibility } from '../calc/validation';
import type { VisibilitySeries } from '../calc/visibility';
import type { SiteSummary } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

interface Props {
  sites: SiteSummary[];
  vis: Map<string, VisibilitySeries>;
  year: string;
}

/** Half of the 0.1-point display step. */
const DISPLAY_HALF_STEP = 0.05;
const WHY: MessageKey[] = ['check.why1', 'check.why2', 'check.why3', 'check.why4'];

export function NasaCheck({ sites, vis, year }: Props) {
  const { t } = useI18n();
  const pct = (v: number | null) => (v === null ? t('unit.na') : t('check.pct', { v }));
  const diff = (a: number, b: number | null) => {
    if (b === null) return t('unit.na');
    // Below the display precision the difference is shown as 0.0 (no "-0.0").
    const d = Math.abs(a - b) < DISPLAY_HALF_STEP ? 0 : a - b;
    return t('check.diff', { sign: d > 0 ? '+' : '', d });
  };
  return (
    <div className="nasa-check">
      <p>{t('check.lead', { year })}</p>
      <table className="compare small-table">
        <thead>
          <tr>
            <th scope="col">{t('check.site')}</th>
            <th scope="col">{t('check.sunOurs', { year })}</th>
            <th scope="col">{t('check.sunNasa')}</th>
            <th scope="col">{t('check.difference')}</th>
            <th scope="col">{t('check.earthOurs', { year })}</th>
            <th scope="col">{t('check.earthNasa')}</th>
            <th scope="col">{t('check.difference')}</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((s) => {
            const v = vis.get(s.id);
            if (!v) return null;
            const y = yearVisibility(v);
            return (
              <tr key={s.id}>
                <th scope="row">{s.name}</th>
                <td className="num sun">{pct(y.sunPct)}</td>
                <td className="num">{pct(s.nasaAvgIlluminationPct)}</td>
                <td className="num">{diff(y.sunPct, s.nasaAvgIlluminationPct)}</td>
                <td className="num earth">{pct(y.earthPct)}</td>
                <td className="num">{pct(s.nasaAvgEarthVisibilityPct)}</td>
                <td className="num">{diff(y.earthPct, s.nasaAvgEarthVisibilityPct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="caps">{t('check.whyTitle')}</p>
      <ul className="why">
        {WHY.map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ul>
      <p className="note">{t('check.notTuned')}</p>
    </div>
  );
}
