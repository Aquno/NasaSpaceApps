/**
 * What: True while a scrollable box has content hidden below its bottom edge, so the interface
 *   can show that the list continues (D52). Presentation only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useEffect, useRef, useState } from 'react';

/** Pixels of slack before the end counts as reached (sub-pixel rounding). */
const END_SLACK_PX = 4;

export function useMoreBelow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > END_SLACK_PX);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, []);
  return { ref, more };
}
