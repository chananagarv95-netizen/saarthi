import { useEffect, useRef } from 'react';
import {
  AdditiveBlending, BackSide, BufferGeometry, Color, Float32BufferAttribute, Group, Line, Mesh, MeshBasicMaterial,
  PerspectiveCamera, Points, QuadraticBezierCurve3, Scene, ShaderMaterial, SphereGeometry, Vector2, Vector3, WebGLRenderer
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const R = 2;
const DEG = Math.PI / 180;

// Coarse outline of India [lon, lat] — only used to light up dots on the globe.
const INDIA = [
  [68.2, 23.6], [70.6, 25.4], [69.6, 27.2], [70.6, 28.0], [72.9, 29.9], [74.5, 30.9], [74.6, 32.5], [73.9, 34.3], [74.4, 35.0], [76.5, 35.7],
  [77.8, 35.6], [78.7, 34.7], [79.4, 33.0], [78.5, 32.3], [78.9, 31.9], [79.1, 31.2], [80.2, 30.4], [80.3, 29.0], [80.5, 28.6], [82.5, 27.9],
  [84.0, 27.4], [86.0, 26.6], [87.9, 26.4], [88.0, 27.1], [88.8, 28.1], [88.9, 27.0], [89.5, 26.8], [92.0, 26.8], [91.7, 27.8], [93.5, 28.4],
  [96.1, 29.4], [97.3, 28.2], [96.9, 27.2], [95.2, 26.0], [94.4, 24.4], [93.4, 23.5], [93.1, 22.0], [92.6, 21.9], [92.2, 22.6], [92.2, 24.0],
  [92.4, 25.1], [92.0, 25.2], [89.9, 25.2], [89.8, 26.0], [88.6, 26.3], [88.5, 25.3], [88.7, 24.2], [88.9, 23.2], [89.1, 22.0], [88.0, 21.6],
  [87.0, 21.5], [86.7, 20.3], [84.9, 19.3], [83.3, 17.7], [81.5, 16.3], [80.3, 15.7], [80.3, 13.1], [79.8, 11.9], [79.9, 10.3], [79.0, 9.2],
  [77.5, 8.1], [76.6, 8.9], [76.2, 10.0], [75.7, 11.3], [74.8, 12.9], [74.1, 14.8], [73.6, 15.9], [73.2, 17.5], [72.8, 19.0], [72.9, 20.7],
  [72.6, 21.7], [72.5, 22.3], [71.5, 21.0], [70.4, 20.7], [69.4, 21.6], [69.0, 22.4], [70.3, 22.8], [68.6, 23.0]
];

const CITIES = {
  delhi: [28.61, 77.21], mumbai: [19.08, 72.88], bengaluru: [12.97, 77.59], kolkata: [22.57, 88.36], chennai: [13.08, 80.27],
  hyderabad: [17.39, 78.49], guwahati: [26.14, 91.74], lucknow: [26.85, 80.95], jaipur: [26.91, 75.79], srinagar: [34.08, 74.8],
  bhopal: [23.26, 77.41], patna: [25.59, 85.14], thiruvananthapuram: [8.52, 76.94], ahmedabad: [23.02, 72.57]
};
const ARCS = [
  ['delhi', 'mumbai'], ['delhi', 'bengaluru'], ['delhi', 'kolkata'], ['delhi', 'guwahati'], ['delhi', 'srinagar'], ['delhi', 'chennai'],
  ['mumbai', 'bengaluru'], ['mumbai', 'kolkata'], ['bengaluru', 'thiruvananthapuram'], ['hyderabad', 'patna'], ['ahmedabad', 'lucknow'],
  ['chennai', 'kolkata'], ['jaipur', 'bhopal'], ['guwahati', 'kolkata'], ['hyderabad', 'mumbai']
];

const latLon = (lat, lon, r = R) => {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

const inPolygon = (x, y, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const DOT_VERT = /* glsl */ `
  attribute vec3 color; attribute float size; attribute float seed;
  uniform float uTime; uniform float uPixelRatio; uniform float uBoost;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    float tw = 0.78 + 0.22 * sin(uTime * (1.2 + seed) + seed * 40.0);
    gl_PointSize = size * uPixelRatio * (13.0 / -mv.z) * tw;
    vec3 n = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vAlpha = smoothstep(-0.05, 0.45, dot(n, normalize(cameraPosition - world.xyz)));
    vColor = color * tw * uBoost;
  }`;
const DOT_FRAG = /* glsl */ `
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.05, d) * vAlpha);
  }`;

const STAR_VERT = /* glsl */ `
  attribute vec3 color; attribute float size; attribute float seed;
  uniform float uTime; uniform float uPixelRatio; uniform float uBoost;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float tw = 0.6 + 0.4 * sin(uTime * 0.8 + seed * 40.0);
    gl_PointSize = size * uPixelRatio * tw;
    vColor = color * uBoost; vAlpha = tw;
  }`;

const ARC_VERT = /* glsl */ `
  attribute float aT; varying float vT;
  void main() { vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ARC_FRAG = /* glsl */ `
  uniform float uTime; uniform float uOffset; uniform float uSpeed; uniform vec3 uColor; varying float vT;
  void main() {
    float head = fract(uTime * uSpeed + uOffset) * 1.4 - 0.2;
    float d = head - vT;
    float trail = (d > 0.0 && d < 0.28) ? pow(1.0 - d / 0.28, 2.0) : 0.0;
    vec3 col = mix(uColor, vec3(1.0), trail * 0.55);
    gl_FragColor = vec4(col, 0.10 + trail * 0.95);
  }`;

const BEACON_VERT = /* glsl */ `
  attribute float seed; uniform float uPixelRatio; varying float vSeed;
  void main() {
    vSeed = seed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 26.0 * uPixelRatio * (6.0 / -mv.z);
  }`;
const BEACON_FRAG = /* glsl */ `
  uniform float uTime; varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float r = fract(uTime * 0.55 + vSeed) * 0.45;
    float ring = (1.0 - smoothstep(0.0, 0.035, abs(d - r))) * (1.0 - r / 0.45);
    float core = smoothstep(0.09, 0.0, d);
    vec3 col = mix(vec3(1.0, 0.62, 0.26), vec3(1.0), core);
    gl_FragColor = vec4(col, ring * 0.55 + core);
  }`;

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ATMO_FRAG = /* glsl */ `
  varying vec3 vNormal;
  void main() { float i = pow(max(0.0, 0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 4.0) * 0.6; gl_FragColor = vec4(0.42, 0.48, 1.0, 1.0) * i; }`;

/**
 * variant="hero": full-viewport, opaque, bloom, starfield, scroll-choreographed (landing page).
 * variant="orb":  transparent, compact, no bloom (dashboard / chat). `thinking` speeds the pulses.
 */
export default function Scene3D({ variant = 'orb', thinking = false, className = '' }) {
  const mountRef = useRef(null);
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;

  useEffect(() => {
    const mount = mountRef.current;
    const hero = variant === 'hero';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 860px)').matches;
    const lowPower = small || (navigator.hardwareConcurrency || 8) <= 4;

    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: !hero || !lowPower, alpha: !hero, powerPreference: 'high-performance' });
    } catch {
      mount.classList.add('scene-fallback');
      return undefined;
    }
    const pixelRatio = Math.min(window.devicePixelRatio, hero ? 1.6 : 2);
    renderer.setPixelRatio(pixelRatio);
    mount.appendChild(renderer.domElement);

    const scene = new Scene();
    if (hero) scene.background = new Color('#05060b');
    const camera = new PerspectiveCamera(hero ? 38 : 34, 1, 0.1, 200);
    camera.position.set(0, 0, hero ? 8 : 7.3); // orb: whole globe + atmosphere fits a square canvas

    const disposables = [];
    const keep = (x) => { disposables.push(x); return x; };
    const world = new Group(); // parallax / scroll / sway
    const globe = new Group(); // fixed orientation: India facing the camera
    globe.rotation.set(21 * DEG, -Math.PI / 2 - 80 * DEG, 0, 'XYZ');
    world.add(globe);
    scene.add(world);

    const uniforms = { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uBoost: { value: hero ? 1 : 1.25 } };

    // ── dot-matrix globe ──
    const N = hero ? (lowPower ? 12000 : 30000) : 9000;
    const pos = [];
    const col = [];
    const size = [];
    const seed = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    const saffron = new Color('#ff9f43');
    const white = new Color('#f4f6ff');
    const green = new Color('#3ddc84');
    const base = new Color('#4a5cb0');
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = Math.asin(y) / DEG;
      const lon = ((((golden * i) / DEG) % 360) + 540) % 360 - 180;
      const india = inPolygon(lon, lat, INDIA);
      const c = india ? (lat > 25.5 ? saffron : lat > 18 ? white : green) : base;
      const v = latLon(lat, lon);
      pos.push(v.x, v.y, v.z);
      col.push(c.r, c.g, c.b);
      size.push(india ? 1.9 : 1.0);
      seed.push(Math.random());
    }
    const dotGeo = keep(new BufferGeometry());
    dotGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    dotGeo.setAttribute('color', new Float32BufferAttribute(col, 3));
    dotGeo.setAttribute('size', new Float32BufferAttribute(size, 1));
    dotGeo.setAttribute('seed', new Float32BufferAttribute(seed, 1));
    const dotMat = keep(new ShaderMaterial({ uniforms, vertexShader: DOT_VERT, fragmentShader: DOT_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending }));
    globe.add(new Points(dotGeo, dotMat));

    // dark core occludes the far side; atmosphere glows around the rim
    globe.add(new Mesh(keep(new SphereGeometry(R * 0.985, 64, 64)), keep(new MeshBasicMaterial({ color: '#06070f' }))));
    const atmo = new Mesh(keep(new SphereGeometry(R * 1.1, 64, 64)), keep(new ShaderMaterial({ vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG, blending: AdditiveBlending, side: BackSide, transparent: true, depthWrite: false })));
    world.add(atmo);

    // ── arcs with travelling pulses ──
    const arcColors = ['#ff9f43', '#a78bfa', '#7c8cff', '#3ddc84'];
    ARCS.forEach(([a, b], i) => {
      const start = latLon(...CITIES[a], R * 1.002);
      const end = latLon(...CITIES[b], R * 1.002);
      const mid = start.clone().add(end).normalize().multiplyScalar(R + start.distanceTo(end) * 0.32);
      const pts = new QuadraticBezierCurve3(start, mid, end).getPoints(80);
      const g = keep(new BufferGeometry().setFromPoints(pts));
      g.setAttribute('aT', new Float32BufferAttribute(pts.map((_, k) => k / (pts.length - 1)), 1));
      const m = keep(new ShaderMaterial({
        uniforms: { uTime: uniforms.uTime, uOffset: { value: i * 0.137 }, uSpeed: { value: 0.18 + (i % 4) * 0.03 }, uColor: { value: new Color(arcColors[i % arcColors.length]) } },
        vertexShader: ARC_VERT, fragmentShader: ARC_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending
      }));
      globe.add(new Line(g, m));
    });

    // ── city beacons ──
    const beaconPos = [];
    const beaconSeed = [];
    Object.values(CITIES).forEach(([la, lo]) => { const v = latLon(la, lo, R * 1.004); beaconPos.push(v.x, v.y, v.z); beaconSeed.push(Math.random()); });
    const beaconGeo = keep(new BufferGeometry());
    beaconGeo.setAttribute('position', new Float32BufferAttribute(beaconPos, 3));
    beaconGeo.setAttribute('seed', new Float32BufferAttribute(beaconSeed, 1));
    globe.add(new Points(beaconGeo, keep(new ShaderMaterial({ uniforms, vertexShader: BEACON_VERT, fragmentShader: BEACON_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending }))));

    // ── starfield (hero only) ──
    let stars;
    if (hero) {
      const sp = [];
      const sc = [];
      const ss = [];
      const sd = [];
      for (let i = 0; i < 1400; i++) {
        const v = new Vector3().randomDirection().multiplyScalar(25 + Math.random() * 40);
        sp.push(v.x, v.y, v.z);
        const t = 0.5 + Math.random() * 0.5;
        sc.push(t * 0.75, t * 0.8, t);
        ss.push(Math.random() * 1.6 + 0.6);
        sd.push(Math.random());
      }
      const sg = keep(new BufferGeometry());
      sg.setAttribute('position', new Float32BufferAttribute(sp, 3));
      sg.setAttribute('color', new Float32BufferAttribute(sc, 3));
      sg.setAttribute('size', new Float32BufferAttribute(ss, 1));
      sg.setAttribute('seed', new Float32BufferAttribute(sd, 1));
      stars = new Points(sg, keep(new ShaderMaterial({ uniforms, vertexShader: STAR_VERT, fragmentShader: DOT_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending })));
      scene.add(stars);
    }

    // ── post-processing (desktop hero only) ──
    let composer;
    let bloom;
    if (hero && !lowPower) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new Vector2(1, 1), 0.55, 0.4, 0.12);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
    }

    // ── sizing / input / visibility ──
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const pointer = { x: 0, y: 0 };
    const onPointer = (e) => { pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = (e.clientY / window.innerHeight) * 2 - 1; };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(mount);

    // Scroll choreography for the landing page: globe starts right of the headline,
    // glides to centre and recedes as the story scrolls.
    const target = { x: 0, y: 0, z: camera.position.z, s: 1 }; // orb keeps these defaults
    const current = { ...target };
    const updateTargets = () => {
      if (!hero) return;
      const p = Math.min(window.scrollY / window.innerHeight, 3);
      const wide = window.innerWidth > 860;
      const k = Math.min(p, 1);
      target.x = wide ? 2.35 * (1 - k) : 0;
      target.y = wide ? 0 : 1.9 * (1 - k) + 0.2;
      // Portrait phones: pull back so the full globe width fits the screen.
      target.z = (wide ? 7.4 : 2.15 / (Math.tan(19 * DEG) * camera.aspect)) + k * 2.8 + Math.max(0, p - 1) * 3;
      target.s = wide ? 1 : 0.92;
    };
    window.addEventListener('scroll', updateTargets, { passive: true });
    updateTargets();
    Object.assign(current, target);

    let raf;
    let last = performance.now();
    let speed = 1;
    let t = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      speed += ((thinkingRef.current ? 3.2 : 1) - speed) * 0.05;
      if (!reduceMotion) t += dt * speed;
      uniforms.uTime.value = t;

      for (const key of ['x', 'y', 'z', 's']) current[key] += (target[key] - current[key]) * 0.06;
      world.position.set(current.x, current.y, 0);
      world.scale.setScalar(current.s);
      camera.position.z = current.z;
      const sway = reduceMotion ? 0 : Math.sin(t * 0.18) * 0.22;
      world.rotation.y += (sway + pointer.x * 0.28 - world.rotation.y) * 0.05;
      world.rotation.x += (pointer.y * 0.16 - world.rotation.x) * 0.05;
      if (stars) stars.rotation.y = t * 0.01;

      if (composer) composer.render(); else renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', updateTargets);
      disposables.forEach((d) => d.dispose?.());
      bloom?.dispose();
      composer?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant]);

  return <div ref={mountRef} className={`scene ${className}`} aria-hidden="true" />;
}
