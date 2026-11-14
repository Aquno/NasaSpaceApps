/**
 * What: Subtle star field for the opening background (decoration only, not star data). Stars are
 *   drawn once on two canvases from a fixed seed; the second, sparse layer twinkles through CSS
 *   (static when the system asks for reduced motion). The mission panel uses a still, fainter
 *   version (maxAlpha 0.10 keeps every text colour >= 4.5:1 even on a star, D41).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D40.
 */
import { useEffect, useRef } from 'react';

/** Stars per million square pixels (kept low so it never stalls a laptop). */
const STARS_PER_MPX = 160;
const TWINKLE_SHARE = 0.15;
const SEED = 20270101;
/** Brightest star opacity in the opening. */
const OPENING_MAX_ALPHA = 0.8;

/** Small deterministic generator (mulberry32) so the sky is the same on every load. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Props {
  /** No twinkling layer. */
  still?: boolean;
  /** Brightest star opacity (0-1). */
  maxAlpha?: number;
}

export function Starfield({ still = false, maxAlpha = OPENING_MAX_ALPHA }: Props) {
  const base = useRef<HTMLCanvasElement>(null);
  const twinkle = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const rand = random(SEED);
      const count = Math.round((w * h * STARS_PER_MPX) / 1e6);
      const contexts = [base.current, twinkle.current].map((c) => {
        if (!c) return null;
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx?.clearRect(0, 0, w, h);
        return ctx;
      });
      for (let i = 0; i < count; i++) {
        const ctx = rand() < TWINKLE_SHARE && !still ? contexts[1] : contexts[0];
        const x = rand() * w;
        const y = rand() * h;
        const r = 0.4 + rand() * rand() * 1.2;
        const alpha = ((0.25 + rand() * 0.55) * maxAlpha) / OPENING_MAX_ALPHA;
        if (!ctx) continue;
        ctx.fillStyle = `rgba(233, 237, 242, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [still, maxAlpha]);

  return (
    <div className="starfield" aria-hidden="true">
      <canvas ref={base} />
      <canvas ref={twinkle} className="twinkle" />
    </div>
  );
}
