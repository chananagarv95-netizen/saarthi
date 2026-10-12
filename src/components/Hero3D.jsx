import { useEffect, useRef } from 'react';
import {
  AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, Group, IcosahedronGeometry,
  LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, PerspectiveCamera, Points, PointsMaterial, Scene,
  SphereGeometry, TorusGeometry, WebGLRenderer, WireframeGeometry
} from 'three';
import './Hero3D.css';

const SAFFRON = '#FF9933';
const GREEN = '#138808';

// Soft round sprite so points render as glowing dots instead of squares.
const dotTexture = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
};

/**
 * Tricolour particle globe wrapped by an Ashoka-chakra ring (24 spokes) with two
 * orbiting "service" satellites. `thinking` speeds everything up while the AI works.
 */
export default function Hero3D({ thinking = false, size = 'large' }) {
  const mountRef = useRef(null);
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;

  useEffect(() => {
    const mount = mountRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#1A237E';

    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      mount.classList.add('hero3d-fallback'); // no WebGL: CSS gradient orb instead
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 9.6; // keeps the outer orbits (r=3.55) inside the frame
    const world = new Group();
    scene.add(world);
    const disposables = [];
    const track = (...items) => { disposables.push(...items); return items[0]; };

    // ── globe: fibonacci-distributed points coloured by latitude band ──
    const N = size === 'large' ? 2200 : 900;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const bands = [new Color(SAFFRON), new Color(dark ? '#F4F6FF' : primary), new Color(GREEN)];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const R = 2 + (Math.random() - 0.5) * 0.04;
      pos.set([Math.cos(theta) * r * R, y * R, Math.sin(theta) * r * R], i * 3);
      const c = y > 0.33 ? bands[0] : y < -0.33 ? bands[2] : bands[1];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const globeGeo = track(new BufferGeometry());
    globeGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    globeGeo.setAttribute('color', new Float32BufferAttribute(col, 3));
    const sprite = track(dotTexture());
    const globeMat = track(new PointsMaterial({ size: size === 'large' ? 0.075 : 0.09, vertexColors: true, map: sprite, transparent: true, depthWrite: false, opacity: 0.95, ...(dark && { blending: AdditiveBlending }) }));
    const globe = new Points(globeGeo, globeMat);
    world.add(globe);

    // faint wireframe core
    const coreGeo = track(new WireframeGeometry(track(new IcosahedronGeometry(1.25, 1))));
    const coreMat = track(new LineBasicMaterial({ color: primary, transparent: true, opacity: dark ? 0.25 : 0.18 }));
    world.add(new LineSegments(coreGeo, coreMat));

    // ── Ashoka chakra ring: rim + 24 spokes ──
    const chakra = new Group();
    const rimMat = track(new MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.55 }));
    chakra.add(new Mesh(track(new TorusGeometry(2.75, 0.014, 8, 160)), rimMat));
    const spokePts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      spokePts.push(Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0, Math.cos(a) * 2.95, Math.sin(a) * 2.95, 0);
    }
    const spokeGeo = track(new BufferGeometry());
    spokeGeo.setAttribute('position', new Float32BufferAttribute(spokePts, 3));
    chakra.add(new LineSegments(spokeGeo, track(new LineBasicMaterial({ color: primary, transparent: true, opacity: 0.5 }))));
    chakra.rotation.x = 1.15;
    world.add(chakra);

    // ── orbiting satellites ──
    const orbits = [
      { color: SAFFRON, radius: 3.25, tilt: [0.5, 0, 0.35], speed: 0.55 },
      { color: GREEN, radius: 3.55, tilt: [-0.6, 0, -0.5], speed: -0.4 }
    ].map(({ color, radius, tilt, speed }) => {
      const g = new Group();
      g.rotation.set(...tilt);
      g.add(new Mesh(track(new TorusGeometry(radius, 0.006, 6, 200)), track(new MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }))));
      const sat = new Mesh(track(new SphereGeometry(0.09, 16, 16)), track(new MeshBasicMaterial({ color })));
      const glow = new Points(track(new BufferGeometry().setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3))), track(new PointsMaterial({ size: 0.7, map: sprite, color, transparent: true, opacity: 0.55, depthWrite: false })));
      sat.add(glow);
      g.add(sat);
      world.add(g);
      return { sat, radius, speed, phase: Math.random() * Math.PI * 2 };
    });

    // ── sizing, pointer, visibility ──
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const pointer = { x: 0, y: 0 };
    const onPointer = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(mount);

    let raf;
    let last = performance.now();
    let speed = 1;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (!visible) { last = now; return; } // browsers already pause rAF in hidden tabs
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      speed += ((thinkingRef.current ? 4 : 1) - speed) * 0.05;
      const k = reduceMotion ? 0 : dt * speed;
      globe.rotation.y += 0.12 * k;
      chakra.rotation.z += 0.18 * k;
      orbits.forEach((o) => {
        o.phase += o.speed * k;
        o.sat.position.set(Math.cos(o.phase) * o.radius, Math.sin(o.phase) * o.radius, 0);
      });
      world.rotation.x += (pointer.y * 0.25 - world.rotation.x) * 0.04;
      world.rotation.y += (pointer.x * 0.35 - world.rotation.y) * 0.04;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [size]);

  return <div ref={mountRef} className={`hero3d hero3d-${size}`} aria-hidden="true" />;
}
