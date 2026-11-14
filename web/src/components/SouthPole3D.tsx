/**
 * What: 3D view of the lunar south pole (D28): LOLA height map as a lit mesh with the Moon's
 *   curvature, light from the real Sun direction at the chosen instant (shadows move with the
 *   date and the delay), Earth direction arrow, clickable sites, declared vertical exaggeration.
 *   VISUAL ONLY: numbers come from the horizon calculation, not from these shadows.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: Terrain, sites, Sun/Earth directions in the pole frame (from calc/scene3d.ts).
 * Dependency: three.js (WebGL rendering + OrbitControls), see web/README.md.
 * Calls onUnavailable() when WebGL cannot start (the dashboard then shows the 2D map, plan B).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { exaggerateDirection, sceneHeightM, terrainPositions, type Vec3 } from '../calc/scene3d';
import { toMapXY, toPixel } from '../calc/mapGeometry';
import type { SiteSummary, Terrain } from '../data/contract';
import { shortName } from '../ui/format';

/** Visual parameters (presentation only). */
const DEFAULT_EXAGGERATION = 3;
const MIN_EXAGGERATION = 1;
const MAX_EXAGGERATION = 10;
// Start view: from the Earth side (+y), 60° down, aimed at the middle of the sites (km).
const CAMERA_TARGET: Vec3 = [-15, 55, 0];
const CAMERA_START: Vec3 = [-15, 205, 315];
const LIGHT_DISTANCE_KM = 400;
const SHADOW_HALF_EXTENT_KM = 165;
const SHADOW_MAP_SIZE = 2048;
const ARROW_LENGTH_KM = 70;
const KEY_ROTATE_RAD = Math.PI / 36;
// Ambient keeps shadowed relief readable; the Sun light stays on even when it grazes the pole
// frame from slightly below (high terrain can still see it).
const AMBIENT_INTENSITY = 0.22;
const SUN_INTENSITY = 4.5;

interface Props {
  terrain: Terrain;
  sites: SiteSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  sun: Vec3;
  earth: Vec3;
  sunElDeg: number;
  lightSiteName: string;
  onUnavailable: () => void;
}

interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  mesh: THREE.Mesh;
  light: THREE.DirectionalLight;
  sunArrow: THREE.ArrowHelper;
  earthArrow: THREE.ArrowHelper;
}

export function SouthPole3D(props: Props) {
  const {
    terrain,
    sites,
    selectedId,
    onSelect,
    sun,
    earth,
    sunElDeg,
    lightSiteName,
    onUnavailable,
  } = props;
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const labelRefs = useRef(new Map<string, HTMLButtonElement>());
  const [exaggeration, setExaggeration] = useState(DEFAULT_EXAGGERATION);
  const exagRef = useRef(exaggeration);

  const siteAnchors = useMemo(
    () =>
      sites.map((s) => {
        const { x, y } = toMapXY(s.lat, s.lon, terrain.sphereRadiusM);
        const { col, row } = toPixel(terrain, x, y);
        const k =
          Math.min(terrain.height - 1, Math.max(0, Math.round(row))) * terrain.width +
          Math.min(terrain.width - 1, Math.max(0, Math.round(col)));
        return { id: s.id, x, y, heightM: terrain.heights[k] ?? 0, rho: Math.hypot(x, y) };
      }),
    [sites, terrain],
  );

  const render = () => {
    const st = stage.current;
    const el = host.current;
    if (!st || !el) return;
    st.renderer.render(st.scene, st.camera);
    const w = el.clientWidth;
    const h = el.clientHeight;
    for (const a of siteAnchors) {
      const label = labelRefs.current.get(a.id);
      if (!label) continue;
      const z = sceneHeightM(a.heightM, a.rho, terrain.sphereRadiusM, exagRef.current, true) / 1000;
      const p = new THREE.Vector3(a.x / 1000, a.y / 1000, z).project(st.camera);
      label.style.transform = `translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
      label.style.visibility = p.z < 1 ? 'visible' : 'hidden';
    }
  };
  const renderRef = useRef(render);
  useLayoutEffect(() => {
    exagRef.current = exaggeration;
    renderRef.current = render;
  });

  // One-time setup.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      onUnavailable();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0b0f14);
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 3000);
    camera.up.set(0, 0, 1);
    camera.position.set(...CAMERA_START);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_TARGET);
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 900;

    const geometry = new THREE.BufferGeometry();
    const index: number[] = [];
    const { width: w, height: h } = terrain;
    for (let r = 0; r < h - 1; r++) {
      for (let c = 0; c < w - 1; c++) {
        const a = r * w + c;
        index.push(a, a + w, a + 1, a + 1, a + w, a + w + 1);
      }
    }
    geometry.setIndex(index);
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(terrainPositions(terrain, exagRef.current, true), 3),
    );
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xa7adb5, roughness: 1, metalness: 0 }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    scene.add(new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY));
    const light = new THREE.DirectionalLight(0xfff4e0, SUN_INTENSITY);
    light.castShadow = true;
    light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    const sc = light.shadow.camera;
    sc.left = -SHADOW_HALF_EXTENT_KM;
    sc.right = SHADOW_HALF_EXTENT_KM;
    sc.top = SHADOW_HALF_EXTENT_KM;
    sc.bottom = -SHADOW_HALF_EXTENT_KM;
    sc.near = 1;
    sc.far = 2 * LIGHT_DISTANCE_KM;
    light.shadow.bias = -0.0005;
    light.target.position.set(0, 0, 0);
    scene.add(light, light.target);

    const sunArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 15),
      ARROW_LENGTH_KM,
      0xf0a500,
      10,
      6,
    );
    const earthArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 15),
      ARROW_LENGTH_KM,
      0x56b4e9,
      10,
      6,
    );
    scene.add(sunArrow, earthArrow);

    stage.current = { renderer, scene, camera, controls, mesh, light, sunArrow, earthArrow };
    const onChange = () => renderRef.current();
    controls.addEventListener('change', onChange);

    const resize = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderRef.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    return () => {
      observer.disconnect();
      controls.removeEventListener('change', onChange);
      controls.dispose();
      geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      stage.current = null;
    };
    // Setup depends only on the terrain grid; other inputs are applied in the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terrain]);

  // Exaggeration: rebuild heights.
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const g = st.mesh.geometry;
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(terrainPositions(terrain, exaggeration, true), 3),
    );
    g.computeVertexNormals();
    renderRef.current();
  }, [exaggeration, terrain]);

  // Light and arrows: Sun/Earth directions, elevation tangent scaled like the heights.
  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const s = exaggerateDirection(sun, exaggeration);
    const e = exaggerateDirection(earth, exaggeration);
    st.light.position.set(
      s[0] * LIGHT_DISTANCE_KM,
      s[1] * LIGHT_DISTANCE_KM,
      s[2] * LIGHT_DISTANCE_KM,
    );
    st.light.intensity = SUN_INTENSITY;
    st.sunArrow.setDirection(new THREE.Vector3(...s));
    st.earthArrow.setDirection(new THREE.Vector3(...e));
    renderRef.current();
  }, [sun, earth, exaggeration]);

  useEffect(() => {
    renderRef.current();
  }, [selectedId]);

  const rotate = (dAz: number, dTilt: number, zoom = 1) => {
    const st = stage.current;
    if (!st) return;
    const offset = st.camera.position.clone().sub(st.controls.target);
    const sph = new THREE.Spherical().setFromVector3(
      new THREE.Vector3(offset.x, offset.z, -offset.y),
    );
    sph.theta += dAz;
    sph.phi = Math.min(Math.PI / 2 - 0.05, Math.max(0.05, sph.phi + dTilt));
    sph.radius *= zoom;
    const v = new THREE.Vector3().setFromSpherical(sph);
    st.camera.position.copy(st.controls.target).add(new THREE.Vector3(v.x, -v.z, v.y));
    st.controls.update();
    renderRef.current();
  };
  const reset = () => {
    const st = stage.current;
    if (!st) return;
    st.camera.position.set(...CAMERA_START);
    st.controls.target.set(...CAMERA_TARGET);
    st.controls.update();
    renderRef.current();
  };

  return (
    <div className="scene3d fill">
      <div
        ref={host}
        className="scene3d-canvas"
        tabIndex={0}
        role="application"
        aria-label="3D south pole view. Arrow keys rotate and tilt, plus and minus zoom, R resets."
        onKeyDown={(e) => {
          const keys: Record<string, () => void> = {
            ArrowLeft: () => rotate(-KEY_ROTATE_RAD, 0),
            ArrowRight: () => rotate(KEY_ROTATE_RAD, 0),
            ArrowUp: () => rotate(0, -KEY_ROTATE_RAD),
            ArrowDown: () => rotate(0, KEY_ROTATE_RAD),
            '+': () => rotate(0, 0, 0.85),
            '=': () => rotate(0, 0, 0.85),
            '-': () => rotate(0, 0, 1.15),
            r: reset,
          };
          const action = keys[e.key];
          if (action) {
            e.preventDefault();
            action();
          }
        }}
      >
        {sites.map((s) => (
          <button
            key={s.id}
            type="button"
            ref={(b) => {
              if (b) labelRefs.current.set(s.id, b);
              else labelRefs.current.delete(s.id);
            }}
            className={`scene3d-label${s.id === selectedId ? ' selected' : ''}${s.purpose === 'sensitivity_demo' ? ' demo' : ''}`}
            onClick={() => onSelect(s.id)}
            aria-pressed={s.id === selectedId}
          >
            {s.purpose === 'sensitivity_demo'
              ? s.id === selectedId
                ? `○ ${shortName(s.name)}`
                : '○'
              : `● ${shortName(s.name)}`}
          </button>
        ))}
      </div>
      <div className="scene3d-bar">
        <label>
          <span className="caps">Vertical ×{exaggeration}</span>{' '}
          <input
            type="range"
            min={MIN_EXAGGERATION}
            max={MAX_EXAGGERATION}
            step={1}
            value={exaggeration}
            onChange={(e) => setExaggeration(Number(e.target.value))}
            aria-label="Vertical exaggeration"
          />
        </label>
        <button type="button" className="linkbtn" onClick={reset}>
          Reset view
        </button>
        <span className="note">
          <span className="sun">━▶ Sun {sunElDeg.toFixed(1)}°</span> at {lightSiteName} ·{' '}
          <span className="earth">━▶ Earth</span> · curvature on · visual only
        </span>
      </div>
    </div>
  );
}

/** Default export for React.lazy (three.js is loaded only when the 3D view is shown). */
export default SouthPole3D;
