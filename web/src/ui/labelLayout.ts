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
