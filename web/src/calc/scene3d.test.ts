import { describe, expect, it } from 'vitest';
import {
  bodyDirectionPoleFrame,
  curvatureDropM,
  exaggerateDirection,
  sceneHeightM,
  shadowLength,
  terrainPositions,
} from './scene3d';

const R = 1_737_400;
const close = (a: number[], b: number[], digits = 6) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i] as number, digits));

describe('body direction in the pole frame', () => {
  it('at the pole region, north = away from the pole along the meridian', () => {
    // Site at lon 0: north on the horizon points to map +y (Earth side); east to map +x.
    close(bodyDirectionPoleFrame(-89.999999, 0, 0, 0), [0, 1, 0], 5);
    close(bodyDirectionPoleFrame(-89.999999, 0, 90, 0), [1, 0, 0], 5);
    close(bodyDirectionPoleFrame(-89.999999, 0, 0, 90), [0, 0, 1], 5);
  });
  it('site at lon 90 E: north points to map +x', () => {
    close(bodyDirectionPoleFrame(-89.999999, 90, 0, 0), [1, 0, 0], 5);
  });
  it('a site 4 degrees from the pole has its zenith tilted 4 degrees', () => {
    const up = bodyDirectionPoleFrame(-86, 0, 0, 90);
    expect(Math.acos(up[2]) / (Math.PI / 180)).toBeCloseTo(4, 6);
  });
});

describe('exaggeration keeps shadows in place', () => {
  it('shadow of a step is the same at 1x and 3x', () => {
    const sun = bodyDirectionPoleFrame(-89.5, 30, 120, 1.5);
    const h = 100;
    const at1 = shadowLength(h * 1, exaggerateDirection(sun, 1));
    const at3 = shadowLength(h * 3, exaggerateDirection(sun, 3));
    expect(at3).toBeCloseTo(at1, 6);
    // and the elevation tangent is tripled
    const t1 = sun[2] / Math.hypot(sun[0], sun[1]);
    const d3 = exaggerateDirection(sun, 3);
    expect(d3[2] / Math.hypot(d3[0], d3[1])).toBeCloseTo(3 * t1, 9);
  });
});

describe('curvature', () => {
  it('drop ~ rho^2 / 2R for small rho; 0 at the pole', () => {
    expect(curvatureDropM(0, R)).toBe(0);
    expect(curvatureDropM(10_000, R)).toBeCloseTo(10_000 ** 2 / (2 * R), 1);
    expect(curvatureDropM(150_000, R)).toBeGreaterThan(6400);
  });
  it('scene height applies drop and exaggeration', () => {
    expect(sceneHeightM(1000, 0, R, 3, true)).toBe(3000);
    expect(sceneHeightM(1000, 10_000, R, 1, false)).toBe(1000);
  });
});

describe('terrain positions', () => {
  it('pixel centres in km, height with exaggeration', () => {
    const t = {
      width: 2,
      height: 1,
      pixelM: 1000,
      xMinM: -1000,
      yMaxM: 500,
      sphereRadiusM: R,
      heights: [100, 200],
    };
    const p = terrainPositions(t, 2, false);
    close(Array.from(p), [-0.5, 0, 0.2, 0.5, 0, 0.4]);
  });
});
