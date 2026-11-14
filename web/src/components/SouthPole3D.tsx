/**
 * What: 3D view of the lunar south pole (D28): LOLA height map as a lit mesh with the Moon's
 *   curvature, regolith tone with cavity shading (craters read at a glance), light from the real
 *   Sun direction at the chosen instant (shadows move with the date and the delay), Earth
 *   direction arrow, site markers with non-overlapping labels and leader lines, an orientation
 *   globe in the corner, declared vertical exaggeration.
 *   VISUAL ONLY: numbers come from the horizon calculation, not from these shadows.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 * Inputs: Terrain, sites, Sun/Earth directions in the pole frame (from calc/scene3d.ts).
 * Dependency: three.js (WebGL rendering + OrbitControls), see web/README.md.
 * Calls onUnavailable() when WebGL cannot start (the dashboard then shows the 2D map, plan B).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  cavityShade,
  exaggerateDirection,
  sceneHeightM,
  terrainPositions,
  type Vec3,
} from '../calc/scene3d';
import { toMapXY, toPixel } from '../calc/mapGeometry';
import type { SiteSummary, Terrain } from '../data/contract';
import { useI18n } from '../i18n/I18nProvider';
import { shortName } from '../ui/format';
import { placeBoxes } from '../ui/labelLayout';
import { MoonGlobe } from './MoonGlobe';

/** Visual parameters (presentation only). */
const DEFAULT_EXAGGERATION = 3;
const MIN_EXAGGERATION = 1;
const MAX_EXAGGERATION = 10;
// Start view: from the Earth side (+y), about 55° down, aimed between the sites so the terrain
// fills the frame (km).
const CAMERA_TARGET: Vec3 = [-20, 72, 0];
const CAMERA_START: Vec3 = [-20, 250, 205];
const LIGHT_DISTANCE_KM = 400;
const SHADOW_HALF_EXTENT_KM = 165;
const SHADOW_MAP_SIZE = 2048;
const ARROW_LENGTH_KM = 70;
const KEY_ROTATE_RAD = Math.PI / 36;
// Ambient keeps shadowed relief readable; the Sun light stays on even when it grazes the pole
// frame from slightly below (high terrain can still see it).
const AMBIENT_INTENSITY = 0.22;
const SUN_INTENSITY = 4.5;
// Regolith tone (warm grey) modulated by cavity shading: window ~7 km, ±900 m of local relief.
const REGOLITH_RGB: Vec3 = [0.62, 0.58, 0.53];
const CAVITY_RADIUS_PX = 12;
const CAVITY_RELIEF_M = 1800;
const CAVITY_CONTRAST = 0.9;
const LABEL_GAP_PX = 14;
const GLOBE_PX = 116;

interface Props {
  terrain: Terrain;
  sites: SiteSummary[];
  selectedId: string | null;
  bestId: string | null;
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
  const { t } = useI18n();
  const {
    terrain,
    sites,
    selectedId,
    bestId,
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
  const dotRefs = useRef(new Map<string, HTMLSpanElement>());
  const lineRefs = useRef(new Map<string, SVGLineElement>());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  /** Label shown in full (the demo point shows only its marker until selected or hovered). */
  const expanded = (id: string) =>
    sites.find((x) => x.id === id)?.purpose !== 'sensitivity_demo' ||
    id === selectedId ||
    id === hoveredId;

  const render = () => {
    const st = stage.current;
    const el = host.current;
    if (!st || !el) return;
    st.renderer.render(st.scene, st.camera);
    const w = el.clientWidth;
    const h = el.clientHeight;
    const anchors = new Map<string, { x: number; y: number }>();
    for (const a of siteAnchors) {
      const z = sceneHeightM(a.heightM, a.rho, terrain.sphereRadiusM, exagRef.current, true) / 1000;
      const p = new THREE.Vector3(a.x / 1000, a.y / 1000, z).project(st.camera);
      const visible = p.z < 1 && Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1;
      const pt = { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h };
      const dot = dotRefs.current.get(a.id);
      if (dot) {
        dot.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
        dot.style.visibility = visible ? 'visible' : 'hidden';
      }
      if (visible) anchors.set(a.id, pt);
    }
    // Priority: selected, best compromise, then the others top to bottom.
    const rank = (id: string) => (id === selectedId ? 0 : id === bestId ? 1 : 2);
    const boxes = [...anchors.entries()]
      .filter(([id]) => expanded(id))
      .sort(([a, pa], [b, pb]) => rank(a) - rank(b) || pa.y - pb.y)
      .map(([id, pt]) => {
        const label = labelRefs.current.get(id);
        return { id, x: pt.x, y: pt.y, w: label?.offsetWidth ?? 0, h: label?.offsetHeight ?? 0 };
      });
    const placed = new Map(
      placeBoxes(boxes, w, h, LABEL_GAP_PX, [...anchors.values()]).map((b) => [b.id, b]),
    );
    for (const a of siteAnchors) {
      const label = labelRefs.current.get(a.id);
      const line = lineRefs.current.get(a.id);
      const pt = anchors.get(a.id);
      const box = placed.get(a.id);
      const size = boxes.find((x) => x.id === a.id);
      if (label) {
        if (box) label.style.transform = `translate(${box.left}px, ${box.top}px)`;
        else if (pt) label.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
        label.style.visibility = pt ? 'visible' : 'hidden';
      }
      if (!line) continue;
      if (!pt || !box || !size) {
        line.style.visibility = 'hidden';
        continue;
      }
      // Leader line from the marker to the nearest point of the label box.
      line.setAttribute('x1', String(pt.x));
      line.setAttribute('y1', String(pt.y));
      line.setAttribute('x2', String(Math.min(Math.max(pt.x, box.left), box.left + size.w)));
      line.setAttribute('y2', String(Math.min(Math.max(pt.y, box.top), box.top + size.h)));
      line.style.visibility = 'visible';
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
    renderer.setClearColor(0x0d1117);
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
    const shade = cavityShade(terrain.heights, w, h, CAVITY_RADIUS_PX, CAVITY_RELIEF_M);
    const colors = new Float32Array(w * h * 3);
    for (let k = 0; k < w * h; k++) {
      const f = 1 + CAVITY_CONTRAST * ((shade[k] as number) - 0.5);
      for (let j = 0; j < 3; j++) colors[k * 3 + j] = Math.min(1, (REGOLITH_RGB[j] as number) * f);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
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
  }, [selectedId, bestId, hoveredId]);

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
        aria-label={t('scene.aria')}
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
        <svg className="scene3d-lines" aria-hidden="true">
          {sites.map((s) => (
            <line
              key={s.id}
              ref={(l) => {
                if (l) lineRefs.current.set(s.id, l);
                else lineRefs.current.delete(s.id);
              }}
            />
          ))}
        </svg>
        {sites.map((s) => {
          const cls = [
            s.purpose === 'sensitivity_demo' ? 'demo' : '',
            s.id === selectedId ? 'selected' : '',
            s.id === bestId ? 'best' : '',
          ].join(' ');
          const hover = {
            onMouseEnter: () => setHoveredId(s.id),
            onMouseLeave: () => setHoveredId(null),
          };
          return (
            <span key={s.id}>
              <span
                className={`scene3d-dot ${cls}`}
                ref={(d) => {
                  if (d) dotRefs.current.set(s.id, d);
                  else dotRefs.current.delete(s.id);
                }}
                onClick={() => onSelect(s.id)}
                aria-hidden="true"
                {...hover}
              />
              <button
                type="button"
                ref={(b) => {
                  if (b) labelRefs.current.set(s.id, b);
                  else labelRefs.current.delete(s.id);
                }}
                className={`scene3d-label ${cls}${expanded(s.id) ? '' : ' collapsed'}`}
                onClick={() => onSelect(s.id)}
                onFocus={() => setHoveredId(s.id)}
                onBlur={() => setHoveredId(null)}
                aria-pressed={s.id === selectedId}
                {...hover}
              >
                {shortName(s.name)}
              </button>
            </span>
          );
        })}
        <div className="scene3d-globe">
          <MoonGlobe size={GLOBE_PX} />
        </div>
      </div>
      <div className="scene3d-bar">
        <label>
          <span className="caps">{t('scene.vertical', { n: exaggeration })}</span>{' '}
          <input
            type="range"
            min={MIN_EXAGGERATION}
            max={MAX_EXAGGERATION}
            step={1}
            value={exaggeration}
            onChange={(e) => setExaggeration(Number(e.target.value))}
            aria-label={t('scene.verticalAria')}
          />
        </label>
        <button type="button" className="linkbtn" onClick={reset}>
          {t('scene.reset')}
        </button>
        <span className="note">
          <span className="sun">━▶ {t('scene.sun', { el: sunElDeg })}</span>{' '}
          {t('scene.at', { site: lightSiteName })} ·{' '}
          <span className="earth">━▶ {t('scene.earth')}</span> · {t('scene.curvature')} ·{' '}
          {t('scene.visualOnly')}
        </span>
      </div>
    </div>
  );
}

/** Default export for React.lazy (three.js is loaded only when the 3D view is shown). */
export default SouthPole3D;
