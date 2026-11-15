import { describe, expect, it } from 'vitest';
import { placeBoxes } from './labelLayout';

const overlap = (
  a: { left: number; top: number },
  b: { left: number; top: number },
  w: number,
  h: number,
) => a.left < b.left + w && b.left < a.left + w && a.top < b.top + h && b.top < a.top + h;

describe('placeBoxes', () => {
  it('separates labels of two anchors at the same point', () => {
    const [a, b] = placeBoxes(
      [
        { id: 'a', x: 100, y: 100, w: 60, h: 20 },
        { id: 'b', x: 100, y: 100, w: 60, h: 20 },
      ],
      400,
      300,
      10,
    );
    expect(a && b && overlap(a, b, 60, 20)).toBe(false);
  });

  it('keeps a label near the right edge inside the box', () => {
    const [a] = placeBoxes([{ id: 'a', x: 390, y: 150, w: 60, h: 20 }], 400, 300, 10);
    expect(a?.left).toBeGreaterThanOrEqual(0);
    expect((a?.left ?? Infinity) + 60).toBeLessThanOrEqual(400);
  });
});

describe('placeBoxes obstacles', () => {
  it('does not cover another marker', () => {
    const [a] = placeBoxes([{ id: 'a', x: 100, y: 100, w: 60, h: 20 }], 400, 300, 10, [
      { x: 140, y: 90 },
    ]);
    const covers =
      (a?.left ?? 0) <= 140 &&
      140 <= (a?.left ?? 0) + 60 &&
      (a?.top ?? 0) <= 90 &&
      90 <= (a?.top ?? 0) + 20;
    expect(covers).toBe(false);
  });
});

describe('placeBoxes reserved boxes', () => {
  it('does not overlap a box already on screen (arrow label)', () => {
    const reserved = { left: 105, top: 75, w: 50, h: 20 };
    const [a] = placeBoxes(
      [{ id: 'a', x: 100, y: 100, w: 60, h: 20 }],
      400,
      300,
      10,
      [],
      [reserved],
    );
    expect(a && overlap(a, reserved, 60, 20)).toBe(false);
  });
});
