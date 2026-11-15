/**
 * What: Where to put an information bubble so it stays inside the window (D53): below the icon,
 *   or above it when there is no room below; shifted sideways to stay within the margins.
 *   Pure function, pixels in viewport coordinates. Presentation only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */

/** Distance kept from the window edges and from the icon, pixels. */
export const TIP_MARGIN_PX = 8;
export const TIP_GAP_PX = 6;

export function placeTip(
  anchor: { left: number; right: number; top: number; bottom: number },
  size: { w: number; h: number },
  viewport: { w: number; h: number },
  align: 'left' | 'right' = 'left',
): { left: number; top: number } {
  const preferred = align === 'left' ? anchor.left : anchor.right - size.w;
  const maxLeft = viewport.w - size.w - TIP_MARGIN_PX;
  const left = Math.max(TIP_MARGIN_PX, Math.min(preferred, maxLeft));
  const below = anchor.bottom + TIP_GAP_PX;
  const above = anchor.top - TIP_GAP_PX - size.h;
  const fitsBelow = below + size.h <= viewport.h - TIP_MARGIN_PX;
  const top = fitsBelow || above < TIP_MARGIN_PX ? below : above;
  return { left, top };
}
