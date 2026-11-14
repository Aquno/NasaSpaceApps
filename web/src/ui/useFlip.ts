/**
 * What: FLIP animation for reordered children (cards move to their new place in ~600 ms).
 *   Skipped when the user prefers reduced motion.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useLayoutEffect, useRef } from 'react';

/** Long enough to follow which card moved where after a slip (D49). */
const DURATION_MS = 600;

export function useFlip<T extends HTMLElement>(orderKey: string) {
  const refs = useRef(new Map<string, T>());
  const last = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const next = new Map<string, DOMRect>();
    refs.current.forEach((el, key) => {
      const rect = el.getBoundingClientRect();
      next.set(key, rect);
      const prev = last.current.get(key);
      if (!reduce && prev && typeof el.animate === 'function') {
        const dx = prev.left - rect.left;
        const dy = prev.top - rect.top;
        if (dx !== 0 || dy !== 0) {
          el.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
            { duration: DURATION_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
          );
        }
      }
    });
    last.current = next;
  }, [orderKey]);

  return (key: string) => (el: T | null) => {
    if (el) refs.current.set(key, el);
    else refs.current.delete(key);
  };
}
