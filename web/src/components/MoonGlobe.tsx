/**
 * What: Globe of the whole Moon with the south polar cap (the area of the map, about 85° S to
 *   the pole) highlighted. Two variants: "corner" (small orientation globe in the 3D view, with
 *   "You are here") and "hero" (large, lit from the side, slow rotation, for the opening).
 *   Visual only. A static picture (texture in a shaded circle) shows while three.js loads and
 *   stays if WebGL fails.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decisions D39, D40.
 * Texture: NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC color, low resolution),
 *   https://svs.gsfc.nasa.gov/4720 — served from public/textures/.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useI18n } from '../i18n/I18nProvider';
import { GlobeStill, MOON_TEXTURE } from './GlobeStill';

/** Angular radius of the highlighted cap: the map covers about 85° S to the pole. */
const CAP_DEG = 5;
/** Hero ring and glow (degrees from the pole): ring width, glow from inside to outside. */
const RING_WIDTH_DEG = 0.45;
const GLOW_INNER_DEG = 1.2;
const GLOW_DEG = 7;
/** Glow opacity: mean and pulse amplitude; one slow pulse every few seconds. */
const GLOW_OPACITY = 0.12;
const GLOW_PULSE = 0.08;
const PULSE_PERIOD_S = 3.5;
/** Sphere segments: enough for a smooth outline at 640 px without stalling a laptop. */
const SEGMENTS = 64;
/** About one turn every 70 s. */
const SPIN_RAD_PER_S = 0.09;
const DEG = Math.PI / 180;
/** Lit side of the static picture, matching each variant's light. */
const STILL_LIGHT = { corner: '60% 35%', hero: '75% 40%' } as const;

interface Variant {
  camera: [number, number, number];
  ambient: number;
  sun: number;
  sunPos: [number, number, number];
  glow: boolean;
}
const VARIANTS: Record<'corner' | 'hero', Variant> = {
  // Seen from below the equator so the south pole faces the viewer.
  corner: { camera: [0, -4.0, 2.1], ambient: 0.9, sun: 1.6, sunPos: [3, 1, 3], glow: false },
  // Seen from well below the equator: the south polar region faces the viewer; side light.
  hero: { camera: [0, -4.1, 1.3], ambient: 0.1, sun: 3.4, sunPos: [5, -0.8, 0.6], glow: true },
};

interface Props {
  size: number;
  variant?: 'corner' | 'hero';
  spin?: boolean;
  /** Shows "You are here" under the globe. */
  label?: boolean;
}

/** A ring-shaped piece of sphere around the south pole, from `fromDeg` to `toDeg` away from it. */
function polarBand(radius: number, fromDeg: number, toDeg: number): THREE.SphereGeometry {
  return new THREE.SphereGeometry(
    radius,
    SEGMENTS,
    8,
    0,
    Math.PI * 2,
    Math.PI - toDeg * DEG,
    (toDeg - fromDeg) * DEG,
  );
}

export function MoonGlobe({ size, variant = 'corner', spin = false, label = true }: Props) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const v = VARIANTS[variant];

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // the static picture stays
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(...v.camera);
    camera.lookAt(0, 0, 0);

    const globe = new THREE.Group();
    // Longitude 0 (the Earth-facing side) toward the camera.
    globe.rotation.y = -Math.PI / 2;
    const material = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 1 });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, SEGMENTS, SEGMENTS / 2), material));
    // Corner: filled cap. Hero: thin ring at the cap edge with a soft glow that pulses.
    globe.add(
      new THREE.Mesh(
        polarBand(1.006, v.glow ? CAP_DEG - RING_WIDTH_DEG : 0, CAP_DEG),
        new THREE.MeshBasicMaterial({
          color: 0xf0a500,
          transparent: true,
          opacity: v.glow ? 0.95 : 0.75,
        }),
      ),
    );
    const glow = new THREE.MeshBasicMaterial({
      color: 0xf0a500,
      transparent: true,
      opacity: GLOW_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    if (v.glow) {
      globe.add(new THREE.Mesh(polarBand(1.004, CAP_DEG - GLOW_INNER_DEG, GLOW_DEG), glow));
    }
    scene.add(globe);
    scene.add(new THREE.AmbientLight(0xffffff, v.ambient));
    const sun = new THREE.DirectionalLight(0xffffff, v.sun);
    sun.position.set(...v.sunPos);
    scene.add(sun);

    const render = () => renderer.render(scene, camera);
    const show = () => {
      render();
      setReady(true);
    };
    new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}${MOON_TEXTURE}`,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        show();
      },
      undefined,
      show,
    );

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      globe.rotation.y += ((now - last) / 1000) * SPIN_RAD_PER_S;
      last = now;
      glow.opacity =
        GLOW_OPACITY + GLOW_PULSE * Math.sin(((2 * Math.PI) / PULSE_PERIOD_S) * (now / 1000));
      render();
      frame = requestAnimationFrame(tick);
    };
    if (spin && !reduce) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [size, spin, v]);

  return (
    <div className={`globe globe-${variant}${ready ? ' ready' : ''}`} ref={host}>
      {!ready && <GlobeStill size={size} light={STILL_LIGHT[variant]} />}
      {label && <span className="globe-label">▲ {t('scene.youAreHere')}</span>}
    </div>
  );
}

export default MoonGlobe;
