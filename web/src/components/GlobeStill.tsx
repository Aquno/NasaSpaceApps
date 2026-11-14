/**
 * What: Static Moon picture (NASA SVS CGI Moon Kit texture inside a shaded circle). Shown while
 *   three.js loads and kept when WebGL is not available. No three.js import, so it paints at once.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D40.
 */
export const MOON_TEXTURE = 'textures/moon_lroc_color_poles_1k.jpg';

export function GlobeStill({ size, light = '60% 35%' }: { size: number; light?: string }) {
  return (
    <div
      className="globe-fallback"
      style={{
        width: size,
        height: size,
        backgroundImage: `radial-gradient(circle at ${light}, transparent 30%, rgb(0 0 0 / 0.85) 75%), url(${import.meta.env.BASE_URL}${MOON_TEXTURE})`,
      }}
      aria-hidden="true"
    />
  );
}
