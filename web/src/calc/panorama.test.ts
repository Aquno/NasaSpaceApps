import { describe, expect, it } from 'vitest';
import { elevationRange, fitExaggeration, flagRuns, trackSegments } from './panorama';

describe('panorama helpers', () => {
  it('splits a path where it crosses azimuth 0/360', () => {
    const segs = trackSegments([350, 355, 2, 8], [1, 1, 1, 1], 0, 4);
    expect(segs.map((s) => s.length)).toEqual([2, 2]);
  });

  it('elevation range covers horizon and paths with margin, whole degrees', () => {
    const r = elevationRange([-2.4, 0.3], [[{ az: 10, el: 5.2 }]], 0.5);
    expect(r).toEqual({ min: -3, max: 6 });
  });

  it('exaggeration fills the height and is at least 1', () => {
    expect(fitExaggeration(10, 400, 4)).toBe(10);
    expect(fitExaggeration(100, 10, 4)).toBe(1);
  });

  it('flag runs with offsets from the mission start', () => {
    expect(flagRuns([0, 1, 1, 0, 0, 1], 1, 4)).toEqual([
      { from: 0, length: 2, on: true },
      { from: 2, length: 2, on: false },
    ]);
  });
});
