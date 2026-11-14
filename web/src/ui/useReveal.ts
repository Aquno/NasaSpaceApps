/**
 * What: Adds the class "in" to an element when it scrolls into view (soft entrance, CSS does the
 *   motion; with reduced motion the CSS keeps everything static and visible).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D40.
 */
import { useEffect, useRef } from 'react';

const THRESHOLD = 0.15;

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: THRESHOLD },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
