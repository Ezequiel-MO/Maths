// The solid of a stage in 3D, with Three.js: lit faces in the solid's colour, its edges in white and the edges behind it dashed
// (they help to count), round solids smooth. It is loaded only when a level shows a solid, so the map and the other levels
// do not carry Three.js. The SVG solid of main.js is on screen until this is ready, and stays there when there is no WebGL.
import * as THREE from 'three';
import { frames, whenGone } from '../../shared/scene.js';

// one world unit is K pixels of the 220 of the picture, as in the SVG solid; the light comes from the upper left, in front
const K = 46, HALF = 110 / K, LIGHT = [-0.45, 0.75, 0.5];

// the faces of a solid as triangles, each face a fan from its first corner (every face is convex). The loops of logic.js go either
// way round; the solid sits round the middle of the space, so a face is turned to look away from there, as the SVG solid does
function facesGeometry(S) {
  const pos = [], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  for (let f of S.F) {
    const [a, b, c] = f.map(i => S.V[i]), u = sub(b, a), v = sub(c, a);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = f.reduce((s, i) => [s[0] + S.V[i][0], s[1] + S.V[i][1], s[2] + S.V[i][2]], [0, 0, 0]);
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) f = [...f].reverse();
    for (let i = 1; i < f.length - 1; i++) for (const k of [f[0], f[i], f[i + 1]]) pos.push(...S.V[k]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
// the round solids, smooth, of the same size as their meshes in logic.js (prism(28, 2.4, 1.1) and pyramid(28, 2.6, 1.25))
function roundGeometry(id) {
  if (id === 'cilindre') return new THREE.CylinderGeometry(1.1, 1.1, 2.4, 64);
  const g = new THREE.ConeGeometry(1.25, 2.6, 64); g.translate(0, 0.26, 0); return g;
}
// three parallels and three meridians of a ball of radius r, as pairs of points
function ballLines(r) {
  const pts = [], loop = f => { for (let i = 0; i < 64; i++) pts.push(...f(i / 64 * 2 * Math.PI), ...f((i + 1) / 64 * 2 * Math.PI)); };
  for (const y of [-0.5, 0, 0.5]) { const c = Math.sqrt(1 - y * y); loop(a => [r * c * Math.cos(a), r * y, r * c * Math.sin(a)]); }
  for (const k of [0, 1, 2]) loop(a => [r * Math.cos(a) * Math.cos(k * Math.PI / 3), r * Math.sin(a), r * Math.cos(a) * Math.sin(k * Math.PI / 3)]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
}

// Draws solid id of SOLIDS (S) in canvas, turned by view.yaw and view.pitch (shared with the SVG solid, so the turn goes on where it
// was). It turns by itself while view.spin; a finger on it stops that and turns it. Returns false when there is no WebGL.
export function mount3d(canvas, id, S, view, t) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return false; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setSize(220, 220, false);
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, -10, 10);
  camera.position.z = 5;
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1); sun.position.set(...LIGHT); scene.add(sun);

  const body = new THREE.Group(), made = [];
  const keep = x => { made.push(x); return x; };
  const color = new THREE.Color().setHSL(S.hue / 360, 0.72, 0.5, THREE.SRGBColorSpace);
  // the faces are pushed a little back, so the edges on them are always in front
  const skin = keep(new THREE.MeshLambertMaterial({ color, flatShading: !S.round && !S.ball, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
  const line = keep(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
  if (S.ball) {
    const r = 72 / K;
    body.add(new THREE.Mesh(keep(new THREE.SphereGeometry(r, 48, 32)), skin));
    body.add(new THREE.LineSegments(keep(ballLines(r * 1.002)), keep(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }))));
  } else {
    const faces = keep(S.round ? roundGeometry(id) : facesGeometry(S));
    body.add(new THREE.Mesh(faces, skin));
    // the edges: on a round solid only the rims of its bases (the sides meet at small angles)
    const edges = keep(new THREE.EdgesGeometry(faces, S.round ? 30 : 1));
    body.add(new THREE.LineSegments(edges, line));
    if (!S.round) {
      // the edges behind the solid, dashed: they are drawn only where something is in front of them
      const hid = new THREE.LineSegments(edges, keep(new THREE.LineDashedMaterial({ color: 0xeaf8f4, transparent: true, opacity: 0.4, dashSize: 0.09, gapSize: 0.09, depthFunc: THREE.GreaterDepth, depthWrite: false })));
      hid.computeLineDistances(); body.add(hid);
    }
  }
  scene.add(body);

  const draw = () => { body.rotation.set(view.pitch, view.yaw, 0, 'XYZ'); renderer.render(scene, camera); };
  let drag = null;
  canvas.onpointerdown = e => { drag = [e.clientX, e.clientY]; view.spin = false; canvas.setPointerCapture(e.pointerId); };
  canvas.onpointermove = e => {
    if (!drag) return;
    view.yaw += (e.clientX - drag[0]) * 0.012; view.pitch = Math.min(1.35, Math.max(-1.35, view.pitch + (e.clientY - drag[1]) * 0.012));
    drag = [e.clientX, e.clientY]; draw();
  };
  canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
  const turn = frames(t, canvas, dt => { if (!view.spin) return false; view.yaw += dt * 0.5; draw(); });
  draw();
  if (view.spin) turn.start();
  whenGone(t, canvas, () => { turn.stop(); for (const x of made) x.dispose(); renderer.dispose(); renderer.forceContextLoss(); });
  return true;
}
