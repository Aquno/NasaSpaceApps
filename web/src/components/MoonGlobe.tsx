/**
 * What: Small orientation globe of the whole Moon with the south polar cap (the area of the map,
 *   about 85° S to the pole) highlighted and a "You are here" label. Visual only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision D39.
 * Texture: NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC color, low resolution),
 *   https://svs.gsfc.nasa.gov/4720 — served from public/textures/. If it fails, a plain grey
 *   sphere is shown.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useI18n } from '../i18n/I18nProvider';

const TEXTURE = 'textures/moon_lroc_color_poles_1k.jpg';
/** Angular radius of the highlighted cap: the map covers about 85° S to the pole. */
const CAP_DEG = 5;
const SEGMENTS = 64;
const SPIN_RAD_PER_S = 0.12;

interface Props {
  size: number;
  spin?: boolean;
}

export function MoonGlobe({ size, spin = false }: Props) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    // Seen from below the equator so the south pole faces the viewer.
    camera.position.set(0, -3.3, 1.7);
    camera.lookAt(0, 0, 0);

    const globe = new THREE.Group();
    // Longitude 0 (the Earth-facing side) toward the camera.
    globe.rotation.y = -Math.PI / 2;
    const material = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 1 });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, SEGMENTS, SEGMENTS / 2), material));
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(
        1.006,
        SEGMENTS,
        8,
        0,
        Math.PI * 2,
        Math.PI - (CAP_DEG * Math.PI) / 180,
        (CAP_DEG * Math.PI) / 180,
      ),
      new THREE.MeshBasicMaterial({ color: 0xf0a500, transparent: true, opacity: 0.75 }),
    );
    globe.add(cap);
    scene.add(globe);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 1, 3);
    scene.add(sun);

    const render = () => renderer.render(scene, camera);
    new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}${TEXTURE}`,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        render();
      },
      undefined,
      () => render(),
    );

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      globe.rotation.y += ((now - last) / 1000) * SPIN_RAD_PER_S;
      last = now;
      render();
      frame = requestAnimationFrame(tick);
    };
    if (spin && !reduce) frame = requestAnimationFrame(tick);
    else render();

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [size, spin]);

  return (
    <div className="globe" ref={host} style={{ width: size }}>
      <span className="globe-label">▲ {t('scene.youAreHere')}</span>
    </div>
  );
}

export default MoonGlobe;
