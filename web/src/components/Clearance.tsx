/**
 * What: How far the Sun or the Earth (disc centre) is above or below the terrain in its own
 *   direction, as the main number, with the raw elevation and the terrain height in a tip (D52).
 *   Avoids reading a negative elevation as "below the horizon" when the local terrain horizon is
 *   lower still. Display only; the value comes from calc/visibility.ts.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { clearanceDeg, horizonAt } from '../calc/visibility';
import { useI18n } from '../i18n/I18nProvider';
import { InfoTip } from './InfoTip';

/** Below half of the 0.1° display step the body is shown as on the terrain line. */
const DISPLAY_HALF_STEP_DEG = 0.05;

interface Props {
  /** Site terrain horizon, 360 values in degrees. */
  horizon: ArrayLike<number>;
  /** Disc-centre azimuth and elevation, degrees (topocentric, azimuth from north clockwise). */
  az: number;
  el: number;
}

export function Clearance({ horizon, az, el }: Props) {
  const { t } = useI18n();
  const d = clearanceDeg(horizon, az, el);
  const h = horizonAt(horizon, az);
  const text =
    Math.abs(d) < DISPLAY_HALF_STEP_DEG
      ? t('clear.level')
      : t(d > 0 ? 'clear.above' : 'clear.below', { d: Math.abs(d) });
  return (
    <>
      {text} <InfoTip>{t('clear.tip', { el, h })}</InfoTip>
    </>
  );
}
