/**
 * What: Tiny label placement for map/scatter points: puts each label right of its point and
 *   moves it down when it would overlap a label already placed. Presentation only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
export interface LabelInput {
  id: string;
  x: number;
  y: number;
}
export interface LabelPlacement {
  id: string;
  x: number;
  y: number;
}

/**
 * @param points anchor points (same units as the drawing)
 * @param lineHeight vertical space a label needs
 * @param minWidth horizontal distance under which two labels are considered overlapping
 */
export function placeLabels(
  points: LabelInput[],
  lineHeight: number,
  minWidth: number,
): LabelPlacement[] {
  const placed: LabelPlacement[] = [];
  for (const p of [...points].sort((a, b) => a.y - b.y)) {
    let y = p.y;
    for (const q of placed) {
      if (Math.abs(q.x - p.x) < minWidth && Math.abs(q.y - y) < lineHeight) y = q.y + lineHeight;
    }
    placed.push({ id: p.id, x: p.x, y });
  }
  return placed;
}

export interface BoxInput {
  id: string;
  /** Anchor point in pixels. */
  x: number;
  y: number;
  /** Label size in pixels. */
  w: number;
  h: number;
}
export interface BoxPlacement {
  id: string;
  /** Top-left corner of the label in pixels. */
  left: number;
  top: number;
}

/** Candidate offsets (in label-gap units) tried in order around the anchor. */
const BOX_CANDIDATES: [number, number][] = [
  [1, -1],
  [-1, -1],
  [1, 1],
  [-1, 1],
  [1, -2.5],
  [-1, -2.5],
  [1, 2.5],
  [-1, 2.5],
  [2, -4],
  [-2, -4],
  [2, 4],
  [-2, 4],
];

/**
 * Places labels around their anchors (in the given order = priority) so that labels do not
 * overlap each other and stay inside a width x height box. A label that fits nowhere keeps its
 * first candidate clamped to the box. Pixels, top-left origin. Presentation only.
 * @param gap distance from the anchor to the label, pixels
 * @param obstacles points (markers) that labels should not cover, pixels
 */
export function placeBoxes(
  boxes: BoxInput[],
  width: number,
  height: number,
  gap: number,
  obstacles: { x: number; y: number }[] = [],
): BoxPlacement[] {
  const placed: { left: number; top: number; w: number; h: number }[] = [];
  const out: BoxPlacement[] = [];
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
  for (const b of boxes) {
    let chosen: { left: number; top: number } | null = null;
    for (const [dx, dy] of BOX_CANDIDATES) {
      const left = dx > 0 ? b.x + gap * dx : b.x + gap * dx - b.w;
      const top = b.y + gap * dy - b.h / 2;
      const inside = left >= 0 && top >= 0 && left + b.w <= width && top + b.h <= height;
      const free = placed.every(
        (p) =>
          left + b.w <= p.left || p.left + p.w <= left || top + b.h <= p.top || p.top + p.h <= top,
      );
      const clear = obstacles.every(
        (o) =>
          o.x < left - gap / 2 ||
          o.x > left + b.w + gap / 2 ||
          o.y < top - gap / 2 ||
          o.y > top + b.h + gap / 2,
      );
      if (inside && free && clear) {
        chosen = { left, top };
        break;
      }
    }
    if (!chosen) {
      chosen = {
        left: clamp(b.x + gap, 0, width - b.w),
        top: clamp(b.y - gap - b.h / 2, 0, height - b.h),
      };
    }
    placed.push({ ...chosen, w: b.w, h: b.h });
    out.push({ id: b.id, ...chosen });
  }
  return out;
}
