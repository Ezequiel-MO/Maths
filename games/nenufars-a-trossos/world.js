// Nenúfars a trossos in 3D, built on shared/diorama.js: a block of earth floating in the dusk with the pond of the party on it.
// The map is the pond: a lily pad for each project, cut in ten pieces, one for each of its levels. A level with stars puts its piece in
// place (the pad shows the fraction of the project that is done), a project validated opens its flower, and every exam passed lights a
// paper lantern on the far shore. Round the pond, each kind of figure has its place and the camera flies to it: the picnic table (the
// pizzas, the tablets of chocolate, the jug of juice, the carton of eggs, the clock), the front of the pond (lily pads that light up),
// the stump of the fireflies, the pool of the walkways (planks that get painted, and the walkways that are compared, added and
// repeated) and the river of the jumps, where the frog hops from pad to pad along the line from 0 to 1, 2 or 3.
// Everything 3D is drawn here and only here; main.js says what is on show (show(sc)) and hears the taps (onPick(kind, key)).
// Without WebGL pond3d() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, easeOut, SPH, CONE, CYL, V } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';

/* ---------- the measures of the world ---------- */
// The grass at 0; the block from YB up, x from X0 to X1 and z from Z0 (back) to Z1 (front); the water at WY, the mud at BY
const YB = -4.2, WY = -0.3, BY = -1.1, X0 = -13, X1 = 13, Z0 = -9.6, Z1 = 9.0;
// the big pond of the map, an ellipse round PC with radii PR; the pool of the walkways, at the back on the left; the river of the jumps,
// at the front on the right
const PC = [1.6, -2.6], PR = [7.2, 5.0];
const POOL = { x0: -11.8, x1: -7.0, z0: -7.9, z1: -0.7 }, WALK = { x: -9.4, L: 5.4 };
const RIV = { x0: -3.4, x1: 11.9, z0: 5.6, z1: 7.4 }, RZ = 6.5, RX = 4.25;
// the picnic table (its top at y), the stump of the fireflies, the place of the lily pads of a question
const TABLE = { x: -7.4, y: 0.95, z: 4.5, w: 5.8, d: 2.7 }, STUMP = [9.9, 2.0], STUMPY = 0.7, FIGPAD = [1.9, 0.75];
// the pads of the map, one for each project in its order, and their radius; the rock where the frog waits
const MAP = [[-4.1, -1.6], [-3.3, -3.3], [-3.4, -4.9], [-1.8, -5.9], [-0.6, -4.8], [-1.4, -3.0], [0.2, -1.6], [1.8, -3.0], [1.3, -4.9], [2.9, -6.4],
  [4.3, -4.8], [3.6, -2.9], [5.5, -2.0], [6.6, -3.8]], MAPR = 0.66, ROCK = [-4.7, 1.5];
// the circle of each project, and the colour of each circle (the rings of the map in main.js)
const CIRC = [0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4];
export const RING = [140, 195, 262, 28, 318];
const LANT = [-3.4, -0.4, 2.6, 5.6, 8.6].map(x => [x, -8.55]);
const TAU = Math.PI * 2;
const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);
const backOut = k => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
const wob = a => 1 + 0.04 * Math.sin(3 * a + 0.4) + 0.03 * Math.sin(5 * a + 1.3);
const POND = Array.from({ length: 64 }, (_, i) => { const a = i / 64 * TAU, k = wob(a); return [PC[0] + PR[0] * Math.cos(a) * k, PC[1] + PR[1] * Math.sin(a) * k]; });
// a rounded rectangle as a ring of points
function rrect({ x0, x1, z0, z1 }, r) {
  const out = [];
  for (const [cx, cz, a0] of [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, Math.PI / 2], [x0 + r, z0 + r, Math.PI], [x1 - r, z0 + r, Math.PI * 1.5]])
    for (let k = 0; k <= 6; k++) { const a = a0 + k / 6 * Math.PI / 2; out.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
  return out;
}
const POOLP = rrect(POOL, 0.9), RIVP = rrect(RIV, 0.8);
// where the D parts of a figure start, as shares of the whole: equal, or with the weights w
function edges(D, w) {
  if (!w) return Array.from({ length: D + 1 }, (_, i) => i / D);
  const s = w.reduce((a, b) => a + b, 0), e = [0];
  let t = 0; for (const x of w) { t += x / s; e.push(t); }
  e[e.length - 1] = 1; return e;
}

export function pond3d(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('nenúfars 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, view: null, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, hear() {}, rest() {}, frogSay() {},
    show() {}, home() {}, cheer() {}, oops() {}, piece: p, lantern: p, festa() {}, where: () => null, onPick: null };
}

function build(canvas) {
  // a small screen: the free part of it once the diorama is there, the whole window while it is being made
  let D = null;
  const small = () => { const { w, h } = D ? D.size() : { w: innerWidth, h: innerHeight }; return Math.min(w, h) < 430; };
  const VIEWS = {
    map: { t: [1.2, -0.2, -3.2], dir: [0, 1.25, 1], get R() { return small() ? 7.2 : 7.8; } },
    home: { t: [ROCK[0] + 0.2, 0.55, ROCK[1]], dir: [0.3, 0.5, 1], R: 1.5 }
  };
  D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-14, 18, 16], shadow: { left: -15, right: 15, top: 13, bottom: -13 }, floor: YB - 4, under: [0, YB - 2.4, -0.3, 34, 27] });
  const { scene, glow, tween } = D;
  const fixed = new THREE.Group(); scene.add(fixed);
  let viewName = 'map', viewKey = '';
  const go = (v, o) => { viewName = typeof v === 'string' ? v : null; viewKey = typeof v === 'string' ? v : JSON.stringify(v); return D.go(v, o); };
  const layout = (kind, x) => { D.layout(kind, x); };
  let sound = { tone() {}, chime() {} };
  const HIT = () => HIT.m || (HIT.m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }));
  const drop = o => { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.isSprite) x.material.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); }); };

  /* ---------- the block of earth, with the pond, the pool and the river cut into its top ---------- */
  const soilTex = canvasTex(256, 512, (g, w, h) => {
    const bands = ['#6E9F4E', '#7A4E2D', '#8E5E36', '#6B4226', '#9A6B43', '#5C3820', '#7E5131'], hs = [10, 70, 60, 80, 70, 110, 120];
    let y = 0; bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, y, w, hs[i]); y += hs[i]; });
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 3 ? '40,25,15' : '200,180,150'},${0.15 + Math.random() * 0.25})`; const r = 1 + Math.random() * 5; g.beginPath(); g.ellipse(Math.random() * w, 14 + Math.random() * (h - 14), r * 1.6, r, 0, 0, 7); g.fill(); }
  });
  soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  const outline = (pts, path) => { pts.forEach(([x, z], i) => i ? path.lineTo(x, -z) : path.moveTo(x, -z)); path.closePath(); return path; };
  {
    const HB = -YB, s = new THREE.Shape();
    s.moveTo(X0, -Z1); s.lineTo(X1, -Z1); s.lineTo(X1, -Z0); s.lineTo(X0, -Z0); s.closePath();
    for (const pts of [POND, POOLP, RIVP]) s.holes.push(outline(pts, new THREE.Path()));
    const g = new THREE.ExtrudeGeometry(s, { depth: -BY, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2).translate(0, BY, 0);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 + p.getY(i) / HB);
    const wallTex = soilTex.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(0.12, 1);
    scene.add(mesh(g, [std(0x6DBB6A, { roughness: 0.9 }), std(0xffffff, { map: wallTex, roughness: 0.95 })], { cast: false }));
    const bt = soilTex.clone(); bt.needsUpdate = true; bt.repeat.set(1.5, (BY - YB) / HB);
    const side = std(0xffffff, { map: bt, roughness: 0.95 }), mud = std(0x4A3A26, { roughness: 1 }), dark = std(0x3A2617, { roughness: 1 });
    scene.add(mesh(boxG(X1 - X0, BY - YB, Z1 - Z0, (X0 + X1) / 2, (BY + YB) / 2, (Z0 + Z1) / 2), [side, side, mud, dark, side, side], { cast: false }));
  }
  const waterM = std(0x2B8FA8, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.88, envMapIntensity: 1.25, emissive: 0x0B3F52, emissiveIntensity: 0.35 });
  for (const pts of [POND, POOLP, RIVP]) { const w = mesh(new THREE.ShapeGeometry(outline(pts, new THREE.Shape()), 4).rotateX(-Math.PI / 2).translate(0, WY, 0), waterM, { cast: false }); w.renderOrder = 1; scene.add(w); }
  // pebbles and reeds on the shores, trees, bushes and flowers
  const IC = new THREE.IcosahedronGeometry(1, 0), pebM = std(0xA69C8A, { roughness: 0.9, flatShading: true });
  POND.forEach(([x, z], i) => { if (i % 2) return; const s = 0.14 + (i * 37 % 10) / 44; fixed.add(part(IC, pebM, [s, s * 0.55, s], [x, 0.02, z])); });
  [...POOLP, ...RIVP].forEach(([x, z], i) => { if (i % 3) return; const s = 0.12 + (i * 29 % 10) / 50; fixed.add(part(IC, pebM, [s, s * 0.55, s], [x, 0.02, z])); });
  const reedM = std(0x3E7F47), catM = std(0x6B4226, { roughness: 0.9 });
  const reeds = (pts, i0, n, c) => { for (let j = 0; j < n; j++) {
    const [x, z] = pts[(i0 + j) % pts.length], h = 0.9 + (j % 3) * 0.3, dx = (x - c[0]) * 0.03, dz = (z - c[1]) * 0.05;
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5).translate(x - dx, WY + h / 2, z - dz), reedM));
    if (j % 2 === 0) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8).translate(x - dx, WY + h - 0.05, z - dz), catM));
  } };
  reeds(POND, 10, 4, PC); reeds(POND, 36, 4, PC); reeds(POND, 52, 3, PC); reeds(POOLP, 3, 3, [-9.4, -4.3]); reeds(RIVP, 13, 3, [4.2, 6.5]);
  const trunkM = std(0x7A5230), LEAF = [0x4E9F5B, 0x67B565, 0x3F8A4E];
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(LEAF[(i + Math.round(Math.abs(x))) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-11.8, -8.9, 1.2], [11.6, -8.6, 1.3], [-12.0, 7.9, 0.9], [11.9, -2.6, 0.9], [-5.2, -8.9, 0.8], [12.1, 3.8, 0.7], [-2.8, 8.2, 0.7]]) tree(x, z, s);
  const bushM = std(0x4F9C58, { flatShading: true });
  for (const [x, z, s] of [[-12.2, 0.6, 0.5], [-4.0, 7.8, 0.45], [12.2, 8.2, 0.4], [-12.2, 2.6, 0.4], [9.6, -8.9, 0.5], [12.0, 0.6, 0.4]])
    fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  for (let i = 0; i < 30; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.06, 0.05, 0.06], [i % 2 ? -12.4 + (i * 13 % 50) / 10 : 6.2 + (i * 7 % 50) / 10, 0.06, i % 2 ? 6.0 + (i * 47 % 26) / 10 : -1.0 - (i * 29 % 50) / 10]));
  // the lily pads that are only there to be pretty, with their flowers
  const padM = std(0x4FA65A, { roughness: 0.6, side: THREE.DoubleSide }), flowerM = std(0xFFB3D9, { emissive: 0xFF5FA8, emissiveIntensity: 0.15 });
  for (const [x, z, r] of [[-3.2, 0.2, 0.36], [6.4, -0.4, 0.4], [7.6, -2.2, 0.3], [-10.6, -1.6, 0.3], [-7.6, -7.2, 0.32], [11.1, 6.6, 0.34], [-2.6, 6.9, 0.3]]) {
    fixed.add(mesh(new THREE.CircleGeometry(r, 24, 0.25, TAU - 0.35).rotateX(-Math.PI / 2).translate(x, WY + 0.02, z), padM, { cast: false }));
    if (r > 0.33) fixed.add(part(SPH, flowerM, [0.11, 0.08, 0.11], [x + 0.08, WY + 0.08, z - 0.05]));
  }

  /* ---------- the places of the party ---------- */
  const woodM = std(0xB9793F, { roughness: 0.75 }), wood2M = std(0x8B5A3C, { roughness: 0.8 }), wood3M = std(0x6B3E1C, { roughness: 0.85 });
  // the picnic table, its checked cloth and its two benches
  {
    const { x, y, z, w, d } = TABLE;
    const cloth = canvasTex(256, 128, (g, W, H) => { g.fillStyle = '#FFF3E0'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(214,72,72,0.55)'; for (let i = 0; i < 16; i++) { g.fillRect(i * 16, 0, 8, H); } for (let j = 0; j < 8; j++) g.fillRect(0, j * 16, W, 8); });
    cloth.wrapS = cloth.wrapT = THREE.RepeatWrapping; cloth.repeat.set(2.2, 2);
    fixed.add(mesh(boxG(w, 0.1, d, x, y - 0.05, z), woodM));
    scene.add(mesh(boxG(w - 0.3, 0.012, d - 0.3, x, y + 0.006, z), std(0xffffff, { map: cloth, roughness: 0.9 }), { cast: false }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.add(mesh(boxG(0.14, y - 0.1, 0.14, x + sx * (w / 2 - 0.4), (y - 0.1) / 2, z + sz * (d / 2 - 0.3)), wood2M));
    for (const sz of [-1, 1]) {
      fixed.add(mesh(boxG(w - 0.4, 0.08, 0.42, x, 0.52, z + sz * (d / 2 + 0.45)), woodM));
      for (const sx of [-1, 1]) fixed.add(mesh(boxG(0.1, 0.48, 0.1, x + sx * (w / 2 - 0.6), 0.24, z + sz * (d / 2 + 0.45)), wood2M));
    }
  }
  // the stump where the fireflies come
  {
    const [x, z] = STUMP, ringsTex = canvasTex(128, 128, (g, W) => { g.fillStyle = '#C89A62'; g.fillRect(0, 0, W, W); g.strokeStyle = 'rgba(110,70,30,0.6)'; g.lineWidth = 3; for (let r = 8; r < 64; r += 9) { g.beginPath(); g.arc(W / 2, W / 2, r, 0, 7); g.stroke(); } });
    fixed.add(mesh(new THREE.CylinderGeometry(0.62, 0.78, STUMPY, 14).translate(x, STUMPY / 2, z), wood3M));
    scene.add(mesh(new THREE.CircleGeometry(0.6, 24).rotateX(-Math.PI / 2).translate(x, STUMPY + 0.004, z), std(0xffffff, { map: ringsTex, roughness: 0.9 }), { cast: false }));
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; fixed.add(mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.7, 6).rotateZ(Math.PI / 2).rotateY(-a).translate(x + Math.cos(a) * 0.85, 0.08, z + Math.sin(a) * 0.85), wood3M)); }
  }
  // the rock where the frog waits, and the stone it stands on at the pool
  fixed.add(part(IC, std(0x9A9286, { roughness: 0.9, flatShading: true }), [0.62, 0.32, 0.5], [ROCK[0], 0.12, ROCK[1]]));
  // the posts with the paper lanterns, one for each exam
  const lanterns = LANT.map(([x, z], c) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 6).translate(x, 1.1, z), wood3M));
    fixed.add(mesh(boxG(0.5, 0.05, 0.05, x + 0.2, 2.15, z), wood3M));
    const off = std(hsl(RING[c], 0.35, 0.42), { roughness: 0.8 }), on = std(hsl(RING[c], 0.85, 0.62), { roughness: 0.6, emissive: hsl(RING[c], 0.9, 0.55), emissiveIntensity: 0.9 });
    const m = part(SPH, off, [0.24, 0.3, 0.24], [x + 0.4, 1.78, z]); m.userData.keep = true; scene.add(m);
    const gl = glow(x + 0.4, 1.78, z + 0.05, 1.8, hsl(RING[c], 0.9, 0.65), false);
    return { m, off, on, gl, lit: false, pos: V(x + 0.4, 1.78, z) };
  });
  const setLantern = (L, k) => { L.m.material = k > 0.5 ? L.on : L.off; L.gl.material.opacity = k * 0.9; };
  // the sky: the moon and the fireflies of the party
  scene.add(mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-17, 11, -27] }));
  glow(-17, 11, -27, 9, 0xFFE9B8, true).material.opacity = 0.55;
  const NFL = RM ? 0 : 22, flies = Array.from({ length: NFL }, (_, i) => ({ p: Math.random() * 7, x: PC[0] + (Math.random() - 0.5) * 16, z: PC[1] + (Math.random() - 0.5) * 9, y: 0.5 + Math.random() * 1.6 }));
  const flyPos = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: softTex(), size: 0.4, color: 0xE8FF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- the frog of the party, with its hat ---------- */
  const frog = makeFrog(); frog.scale.setScalar(0.78); frog.position.set(ROCK[0], 0.36, ROCK[1]); frog.rotation.y = 0.35; frog.userData.t = 0; scene.add(frog);
  let frogDo = null, frogHop = null;
  function frogSay(cls) { if (!RM && (cls === 'go' || cls === 'oops')) { frogDo = { ok: cls === 'go', t: 0 }; D.wake(); } }
  // the frog jumps to a spot (x, y, z), facing the camera a little turned by ry; a long way is one big leap
  function frogTo(x, y, z, ry = 0, dur) {
    // a new jump replaces the one under way (a jump home cut short by the next scene must not go on)
    if (frogHop) { const r = frogHop.res; frogHop = null; r?.(); }
    const from = frog.position.clone(), to = V(x, y, z), far = from.distanceTo(to);
    if (far < 0.01) { frog.rotation.y = ry; return Promise.resolve(); }
    const h = Math.min(2.4, 0.35 + far * 0.25), t = dur ?? Math.min(900, 280 + far * 60);
    frogHop = { from, to, h, ry0: frog.rotation.y, ry, t0: performance.now(), dur: RM ? 0 : t };
    D.wake();
    return new Promise(r => { frogHop.res = r; if (RM) { frog.position.copy(to); frog.rotation.y = ry; frogHop = null; r(); } });
  }

  bake(fixed);

  /* ---------- the map: a lily pad for each project, cut in ten pieces ---------- */
  const mapG = new THREE.Group(); scene.add(mapG);
  const pieceG = [], ghostM = new THREE.MeshBasicMaterial({ color: 0xBFF2D2, transparent: true, opacity: 0.3, depthWrite: false }), shutGhostM = new THREE.MeshBasicMaterial({ color: 0x9AB0B8, transparent: true, opacity: 0.12, depthWrite: false });
  const greyM = std(0x6E8A78, { roughness: 0.7 }), petalM = std(0xFFB3D9, { roughness: 0.5, emissive: 0xFF5FA8, emissiveIntensity: 0.25 }), heartM = std(0xFFE08A, { emissive: 0xFFC040, emissiveIntensity: 0.5 });
  const pads = MAP.map(([x, z], p) => {
    const g = new THREE.Group(); g.position.set(x, WY + 0.03, z); mapG.add(g);
    const leaf = std(0x3E9B55, { roughness: 0.6, emissive: 0x7CF5B0, emissiveIntensity: 0 });
    const pieces = Array.from({ length: 10 }, (_, k) => {
      const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, m = new THREE.Mesh(wedge(MAPR, a0, a1, 0.05), ghostM), mid = (a0 + a1) / 2;
      m.position.set(Math.sin(mid) * 0.025, 0, -Math.cos(mid) * 0.025); m.userData.home = m.position.clone(); m.receiveShadow = true; g.add(m); return m;
    });
    // the ring of the colour of its circle round the pad
    const ring = new THREE.Mesh(new THREE.TorusGeometry(MAPR + 0.08, 0.025, 6, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: hsl(RING[CIRC[p]], 0.7, 0.6), transparent: true, opacity: 0.55, toneMapped: false }));
    g.add(ring);
    // the flower of a project validated, closed until then
    const flower = new THREE.Group(); flower.position.y = 0.05;
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; const pt = part(SPH, petalM, [0.09, 0.05, 0.2], [Math.sin(a) * 0.17, 0.08, Math.cos(a) * 0.17], [0.5, a, 0]); flower.add(pt); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; flower.add(part(SPH, petalM, [0.07, 0.05, 0.15], [Math.sin(a) * 0.09, 0.16, Math.cos(a) * 0.09], [0.9, a, 0])); }
    flower.add(part(SPH, heartM, [0.07, 0.05, 0.07], [0, 0.18, 0]));
    flower.visible = false; g.add(flower);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(MAPR + 0.1, MAPR + 0.1, 0.4, 16), HIT()); hit.userData.pick = { kind: 'proj', key: String(p) }; g.add(hit);
    pieceG.push(pieces);
    return { g, leaf, pieces, ring, flower, hit, have: Array(10).fill(false), valid: false, open: false, name: '' };
  });
  let hl = null, hlLabel = null, nextPad = -1, piscinaOn = false;
  function paintPad(P) {
    P.pieces.forEach((m, k) => { m.material = P.have[k] ? (P.open ? P.leaf : greyM) : P.open ? ghostM : shutGhostM; m.castShadow = P.have[k]; m.visible = true; m.position.copy(m.userData.home); m.rotation.y = 0; });
    P.flower.visible = P.valid; P.flower.scale.setScalar(1);
    P.ring.material.opacity = P.open ? 0.55 : 0.18;
  }
  // the pond as the progress has it: piscina (the party lit), lv (the stars of every level), valid and open (for each project), exams
  // (for each circle), names (of the projects) and next (the project to play now, which breathes)
  function state({ piscina = false, lv = [], valid = [], open = [], exams = [], names = [], next = -1 } = {}) {
    piscinaOn = piscina; nextPad = next;
    pads.forEach((P, p) => { P.have = P.have.map((_, k) => (lv[p * 10 + k] || 0) > 0); P.valid = !!valid[p]; P.open = !!open[p]; P.name = names[p] || ''; paintPad(P); });
    lanterns.forEach((L, c) => { L.lit = !!exams[c]; setLantern(L, L.lit ? 1 : 0); });
    flyPts.visible = piscina; said();
  }
  const said = () => {
    canvas.dataset.trossos = pads.reduce((s, P) => s + P.have.filter(Boolean).length, 0); canvas.dataset.flors = pads.filter(P => P.valid).length;
    canvas.dataset.fanals = lanterns.filter(L => L.lit).length; canvas.dataset.piscina = piscinaOn ? '1' : '0'; D.wake();
  };
  // a project under the finger or with the focus: its pad shines and says its name
  function highlight(i) {
    if (hlLabel) { drop(hlLabel); hlLabel = null; }
    hl = Number.isInteger(i) && pads[i] ? i : null;
    if (hl != null && pads[hl].name) {
      hlLabel = label(pads[hl].name, { bg: 'rgba(7,28,40,0.88)', ring: '#' + hsl(RING[CIRC[hl]], 0.7, 0.6).getHexString(), h: small() ? 0.95 : 0.7, depthTest: false, order: 12 });
      hlLabel.position.set(MAP[hl][0], 1.5, MAP[hl][1]); scene.add(hlLabel);
    }
    D.wake();
  }
  // a level done: the camera flies to its project's pad, and the piece of that level falls into place (fresh: it was not there);
  // bloom: the project has just been validated, and its flower opens
  async function piece(p, k, o = {}) {
    const P = pads[p]; if (!P) return;
    const m = P.pieces[k];
    rest(); frogTo(ROCK[0], 0.36, ROCK[1], 0.35);
    // what is new waits until the camera is there
    if (o.fresh && m) m.visible = false;
    if (o.bloom) P.flower.visible = false;
    await go({ t: [MAP[p][0], 0, MAP[p][1]], dir: [0, 1.5, 1], R: small() ? 1.6 : 1.8 }, { dur: 1100 });
    if (o.fresh && m) {
      P.have[k] = true; m.material = P.open ? P.leaf : greyM; m.castShadow = true; said(); m.visible = true;
      const home = m.userData.home;
      await tween(RM ? 0 : 650, e => { m.position.set(home.x, (1 - e) * 1.6, home.z); m.rotation.y = (1 - e) * 1.5; }, easeOut);
      m.position.copy(home); m.rotation.y = 0;
      sound.tone(660, 0, 0.12, 0.08); sound.tone(990, 0.08, 0.2, 0.07);
      D.sparkle(P.g.position.clone().add(V(0, 0.2, 0)), 14, 0xB8FFCF, 0.3, 1.6, 2.4);
    }
    if (o.bloom) {
      P.valid = true; P.flower.visible = true; said();
      await tween(RM ? 0 : 900, e => P.flower.scale.setScalar(Math.max(0.01, e)), backOut);
      sound.chime([523, 659, 784, 1047]);
      D.sparkle(P.g.position.clone().add(V(0, 0.4, 0)), 22, 0xFFB3D9, 0.36, 2, 2); D.celebrate(3, P.g.position.clone().add(V(0, 0.6, 0)));
    }
  }
  // an exam passed for the first time: its lantern lights up
  async function lantern(c) {
    const L = lanterns[c]; if (!L || L.lit) return;
    L.lit = true; rest();
    await go({ t: [L.pos.x, 1.4, L.pos.z + 0.5], dir: [0, 0.35, 1], R: 1.6 }, { dur: 1200 });
    await tween(RM ? 0 : 1200, k => setLantern(L, k), easeOut);
    said(); D.sparkle(L.pos.clone(), 16, hsl(RING[c], 0.9, 0.7), 0.4, 1.8, 2); D.celebrate(3, L.pos.clone());
  }
  // the Piscina done: the fireflies of the party come out
  function festa() { piscinaOn = true; flyPts.visible = true; said(); D.celebrate(3, V(PC[0], 1.5, PC[1])); }

  /* ---------- what a question shows ---------- */
  const stageG = new THREE.Group(); scene.add(stageG);
  let picks = [], cur = null, parts = [], figsOn = [], lineOn = null, pops = [], spreadK = 1, spreadT = 0;
  const pickable = (o, kind, key) => { o.userData.pick = { kind, key: String(key) }; picks.push(o); };
  const M = {
    sauce: mat(0xC8412A, { roughness: 0.7 }), cheese: mat(0xF6C445, { roughness: 0.6, emissive: 0x6A4A00, emissiveIntensity: 0.15 }), crust: mat(0xE0A45A, { roughness: 0.8 }),
    crust2: mat(0xC9873F, { roughness: 0.8 }), pep: mat(0x9E1B14, { roughness: 0.6 }),
    leaf: mat(0x3E9B55, { roughness: 0.6 }), sunny: mat(0xF7C64E, { roughness: 0.45, emissive: 0xC98A0E, emissiveIntensity: 0.55 }),
    face: mat(0x10364A, { roughness: 0.5 }), slot: mat(0x1D5068, { roughness: 0.5 }), gold: mat(0xF0BA3C, { roughness: 0.45, emissive: 0x8A5A00, emissiveIntensity: 0.35 }), ink: mat(0xEAF8F4, { roughness: 0.4 }),
    choc: mat(0x9A5530, { roughness: 0.5 }), choc2: mat(0xB06640, { roughness: 0.5 }), white: mat(0xF4E7CB, { roughness: 0.5 }), white2: mat(0xE6D2AA, { roughness: 0.5 }),
    plank: mat(0xB07A45, { roughness: 0.75 }), plank2: mat(0xA06A38, { roughness: 0.75 }), paint: mat(0xF4B829, { roughness: 0.5, emissive: 0x6A4A00, emissiveIntensity: 0.2 }), beam: mat(0x6B3E1C, { roughness: 0.85 }),
    carton: mat(0x9A7B58, { roughness: 0.9 }), cup: mat(0x5A452F, { roughness: 0.95 }), egg: mat(0xF8EBD5, { roughness: 0.4 }),
    bug: mat(0x2E3B2A, { roughness: 0.6 }), tailOff: mat(0x6E7A4A, { roughness: 0.6 }), tailOn: mat(0xFFE27A, { roughness: 0.3, emissive: 0xFFD040, emissiveIntensity: 1.6 }),
    wing: mat(0xCFE8F0, { roughness: 0.3, transparent: true, opacity: 0.55 }), juice: mat(0xF39A2A, { roughness: 0.25, emissive: 0x7A3000, emissiveIntensity: 0.25 }), juice2: mat(0xFFC25C, { roughness: 0.3 }),
    good: new THREE.MeshBasicMaterial({ color: 0x7CF5B0, transparent: true, opacity: 0.75, toneMapped: false })
  };
  const glassM = new THREE.MeshStandardMaterial({ color: 0x9FDCF5, emissive: 0x2A6A86, emissiveIntensity: 0.25, transparent: true, opacity: 0.34, roughness: 0.05, metalness: 0, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.6 });

  // A round figure lying flat, part 0 from twelve o'clock (the far side) and on clockwise, as the drawings of the page. f is
  // { D, on, w (weights), hand }; a pizza has sauce or cheese and pepperoni, a lily pad lights up, a clock fills with gold.
  function roundFig(shape, f) {
    const g = new THREE.Group(), pizza = shape === 'pizza', clock = shape === 'clock', e = edges(f.D, f.w), ps = [];
    const r = pizza ? 0.94 : 1, y0 = pizza ? 0.1 : clock ? 0.08 : 0.01, h = 0.05;
    if (pizza) { g.add(mesh(new THREE.CylinderGeometry(1.06, 1.1, 0.1, 40).translate(0, 0.05, 0), M.crust)); g.add(mesh(new THREE.TorusGeometry(1.0, 0.075, 8, 48).rotateX(Math.PI / 2).translate(0, 0.12, 0), M.crust2)); }
    if (clock) { g.add(mesh(new THREE.CylinderGeometry(1.1, 1.12, 0.08, 48).translate(0, 0.04, 0), M.face)); g.add(mesh(new THREE.TorusGeometry(1.08, 0.04, 6, 48).rotateX(Math.PI / 2).translate(0, 0.09, 0), M.ink)); }
    for (let i = 0; i < f.D; i++) {
      const a0 = e[i] * TAU, a1 = e[i + 1] * TAU, mid = (a0 + a1) / 2;
      const m = mesh(f.D === 1 ? new THREE.CylinderGeometry(r, r, h, 48).translate(0, h / 2, 0) : wedge(r, a0, a1, h), M.leaf);
      m.userData.p0 = V(0, y0, 0); m.userData.pd = f.D === 1 ? V(0, 0, 0) : V(Math.sin(mid), 0, -Math.cos(mid)).multiplyScalar(0.065);
      m.position.copy(m.userData.p0).add(m.userData.pd);
      if (pizza) {
        const pep = new THREE.Group(), span = e[i + 1] - e[i], pr = Math.min(0.14, 1.07 * span);
        for (const [fr, at] of span >= 0.2 ? [[0.25, 0.64], [0.75, 0.64], [0.5, 0.32]] : [[0.5, 0.6]]) { const a = a0 + (a1 - a0) * fr; pep.add(mesh(new THREE.CylinderGeometry(pr, pr, 0.03, 16).translate(Math.sin(a) * at, h + 0.012, -Math.cos(a) * at), M.pep)); }
        m.add(pep); m.userData.pep = pep;
      }
      m.userData.skin = pizza ? [M.sauce, M.cheese] : clock ? [M.slot, M.gold] : [M.leaf, M.sunny];
      g.add(m); ps.push(m);
    }
    if (shape === 'pad') { g.add(part(SPH, flowerM, [0.13, 0.09, 0.13], [0, 0.08, 0])); g.add(part(SPH, heartM, [0.06, 0.05, 0.06], [0, 0.14, 0])); }
    if (clock) {
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.add(mesh(boxG(0.04, 0.02, i % 3 ? 0.08 : 0.14, 0, 0, 0).rotateY(-a).translate(Math.sin(a) * 0.95, 0.145, -Math.cos(a) * 0.95), M.ink, { cast: false })); }
      for (const n of [12, 3, 6, 9]) { const a = n / 12 * TAU, s = label(String(n), { h: 0.3, ink: '#EAF8F4', edge: '#082230' }); s.position.set(Math.sin(a) * 0.74, 0.2, -Math.cos(a) * 0.74); g.add(s); }
      if (f.hand != null) { const hand = mesh(boxG(0.07, 0.04, 0.62, 0, 0, -0.31), M.ink); hand.position.y = 0.16; hand.rotation.y = -f.hand * TAU; hand.userData.keep = true; g.add(hand); g.userData.hand = hand; }
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16).translate(0, 0.17, 0), M.ink));
    }
    g.userData.parts = ps; g.userData.w = 2.2; g.userData.d = 2.2;
    return g;
  }
  // A tablet of chocolate, part 0 on the left: f.D columns (f.w their widths), each of f.rows squares; the chosen columns are white
  function chocFig(f) {
    const g = new THREE.Group(), e = edges(f.D, f.w), rows = f.rows || 1, W = 2.4, Dp = f.tall ? 1.5 : 1.0, ps = [];
    g.add(mesh(boxG(W + 0.1, 0.05, Dp + 0.1, 0, 0.025, 0), M.beam));
    for (let i = 0; i < f.D; i++) {
      const cw = (e[i + 1] - e[i]) * W, cx = ((e[i] + e[i + 1]) / 2 - 0.5) * W, col = new THREE.Group(), rh = Dp / rows;
      for (let r = 0; r < rows; r++) {
        const sq = new THREE.Group(), z = ((r + 0.5) / rows - 0.5) * Dp;
        const a = mesh(boxG(cw - 0.03, 0.08, rh - 0.03, 0, 0.09, 0), M.choc), b = mesh(boxG(Math.max(0.02, cw * 0.72 - 0.02), 0.025, Math.max(0.02, rh * 0.72 - 0.02), 0, 0.14, 0), M.choc2);
        sq.add(a, b); sq.userData.p0 = V(0, 0, z); sq.userData.pd = V(0, 0, (r - (rows - 1) / 2) * 0.03); sq.position.copy(sq.userData.p0).add(sq.userData.pd);
        sq.userData.meshes = [a, b]; col.add(sq);
      }
      col.userData.p0 = V(cx, 0, 0); col.userData.pd = V((i - (f.D - 1) / 2) * 0.03, 0, 0); col.position.copy(col.userData.p0).add(col.userData.pd);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.3, Dp), HIT()); hb.position.y = 0.1; col.add(hb); col.userData.hit = hb;
      col.userData.skin = [[M.choc, M.choc2], [M.white, M.white2]]; g.add(col); ps.push(col);
    }
    g.userData.parts = ps; g.userData.w = W + 0.1; g.userData.d = Dp + 0.1;
    return g;
  }
  // a glass jug with a mark for each part: the chosen parts are the juice, from the bottom up; lab writes the fraction at every mark
  function jugFig(f, lab) {
    const g = new THREE.Group(), H = 1.8, R = 0.55, ps = [];
    g.add(mesh(new THREE.CylinderGeometry(R + 0.22, R + 0.25, 0.05, 32).translate(0, -0.025, 0), M.beam));
    g.add(mesh(new THREE.CylinderGeometry(R, R * 0.94, H, 36, 1, true).translate(0, H / 2, 0), glassM, { cast: false }));
    g.add(mesh(new THREE.CylinderGeometry(R * 0.94, R * 0.94, 0.04, 36).translate(0, 0.02, 0), glassM, { cast: false }));
    g.add(mesh(new THREE.TorusGeometry(R, 0.035, 6, 36).rotateX(Math.PI / 2).translate(0, H, 0), M.slot, { cast: false }));
    g.add(mesh(new THREE.TorusGeometry(R * 0.95, 0.03, 6, 36).rotateX(Math.PI / 2).translate(0, 0.03, 0), M.slot, { cast: false }));
    g.add(mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 20, Math.PI).rotateZ(-Math.PI / 2).translate(R + 0.02, H * 0.55, 0), glassM, { cast: false }));
    const juice = mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.86, 1, 36).translate(0, 0.5, 0), M.juice, { cast: false }), top = mesh(new THREE.CircleGeometry(R * 0.9, 36).rotateX(-Math.PI / 2), M.juice2, { cast: false });
    juice.position.y = 0.04; juice.scale.y = 0.001; top.position.y = 0.04; top.visible = false; juice.userData.keep = top.userData.keep = true; g.add(juice, top);
    for (let i = 1; i <= f.D; i++) {
      const y = 0.04 + i / f.D * (H - 0.08), last = i === f.D;
      g.add(mesh(boxG(last ? 0.4 : 0.26, 0.035, 0.03, -R * 0.4, y, R * 0.98), M.slot, { cast: false }));
      if (lab) { const s = label(`${i}/${f.D}`, { h: 0.24, ink: '#F7C64E', edge: '#0B2A38' }); s.position.set(-R - 0.32, y, 0.2); g.add(s); }
    }
    for (let i = 0; i < f.D; i++) {
      // a thin sheet in front of the glass for each part: seen from above, boxes as deep as the jug would hide the ones under them
      const hb = new THREE.Mesh(new THREE.BoxGeometry(R * 2.6, (H - 0.08) / f.D, 0.04), HIT()); hb.position.set(0, 0.04 + (i + 0.5) / f.D * (H - 0.08), R + 0.08); g.add(hb); ps.push(hb);
    }
    g.userData.parts = ps; g.userData.jug = { juice, top, H, now: 0 }; g.userData.w = 1.6; g.userData.d = 1.2; g.userData.tall = true;
    return g;
  }
  // a carton of eggs (one row, or two when there are more than six), or fireflies that light up, in the same rows
  const gridOf = n => { const cols = n > 6 ? Math.ceil(n / 2) : n; return { cols, rows: n > 6 ? 2 : 1 }; };
  function eggsFig(f) {
    const g = new THREE.Group(), { cols, rows } = gridOf(f.D), sp = 0.46, ps = [];
    g.add(mesh(boxG(cols * sp + 0.14, 0.16, rows * sp + 0.14, 0, 0.08, 0), M.carton));
    for (let i = 0; i < f.D; i++) {
      const c = i % cols, r = Math.floor(i / cols), x = (c - (cols - 1) / 2) * sp, z = (r - (rows - 1) / 2) * sp;
      const cup = mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.04, 18).translate(0, 0, 0), M.cup, { cast: false }); cup.position.set(x, 0.165, z);
      const egg = part(SPH, M.egg, [0.15, 0.19, 0.15], [0, 0.17, 0]); egg.userData.keep = true; cup.add(egg); cup.userData.egg = egg;
      const hb = new THREE.Mesh(new THREE.BoxGeometry(sp, 0.4, sp), HIT()); hb.position.y = 0.1; cup.add(hb); cup.userData.hit = hb;
      cup.userData.p0 = cup.position.clone(); cup.userData.pd = V(0, 0, 0); cup.userData.skin = null; g.add(cup); ps.push(cup);
    }
    g.userData.parts = ps; g.userData.w = cols * sp + 0.14; g.userData.d = rows * sp + 0.14;
    return g;
  }
  function bugsFig(f) {
    const g = new THREE.Group(), { cols, rows } = gridOf(f.D), sp = 0.72, ps = [];
    for (let i = 0; i < f.D; i++) {
      const c = i % cols, r = Math.floor(i / cols), b = new THREE.Group();
      // seen from the side: the head on the left, the tail that lights up on the right, the wings up
      b.add(part(SPH, M.bug, [0.12, 0.11, 0.17], [0, 0, -0.04]));
      b.add(part(SPH, M.bug, [0.08, 0.08, 0.08], [0, 0.02, -0.2]));
      for (const s of [-1, 1]) b.add(part(SPH, M.wing, [0.16, 0.025, 0.1], [s * 0.1, 0.11, -0.02], [0, 0, s * 0.6]));
      const tail = part(SPH, M.tailOff, [0.12, 0.12, 0.15], [0, -0.02, 0.17]); b.add(tail);
      const gl = glow(0, 0, 0.2, 1.3, 0xFFE27A, false, b);
      const hb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), HIT()); b.add(hb);
      b.userData.p0 = V((c - (cols - 1) / 2) * sp, 0.6 + (rows - 1 - r) * 0.72, 0); b.userData.pd = V(0, 0, 0); b.position.copy(b.userData.p0);
      b.userData.tail = tail; b.userData.gl = gl; b.userData.hit = hb; b.userData.ph = i * 1.7; b.rotation.y = Math.PI / 2;
      g.add(b); ps.push(b);
    }
    g.userData.parts = ps; g.userData.w = cols * sp; g.userData.d = 0.6; g.userData.bugs = true;
    return g;
  }
  // a walkway of planks, part 0 on the left, L long and d deep: the chosen planks are painted
  function walkFig(f, L, d) {
    const g = new THREE.Group(), e = edges(f.D, f.w), ps = [];
    for (const s of [-1, 1]) g.add(mesh(boxG(L + 0.2, 0.07, 0.08, 0, -0.03, s * d * 0.32), M.beam));
    for (let i = 0; i < f.D; i++) {
      const w = (e[i + 1] - e[i]) * L, x = ((e[i] + e[i + 1]) / 2 - 0.5) * L;
      const m = mesh(boxG(Math.max(0.02, w - 0.025), 0.07, d, 0, 0.035, 0), i % 2 ? M.plank2 : M.plank);
      m.userData.p0 = V(x, 0.02, 0); m.userData.pd = V((i - (f.D - 1) / 2) * 0.02, 0, 0); m.position.copy(m.userData.p0).add(m.userData.pd);
      m.userData.skin = [i % 2 ? M.plank2 : M.plank, M.paint]; g.add(m); ps.push(m);
    }
    g.userData.parts = ps;
    return g;
  }
  // a part chosen or not; pop makes it jump a little
  function paintPart(m, on, pop) {
    const u = m.userData, was = u.on; u.on = on;
    if (u.skin) {
      if (Array.isArray(u.skin[0])) for (const sq of m.children) sq.userData.meshes?.forEach((x, j) => { x.material = u.skin[on ? 1 : 0][j]; });
      else m.material = u.skin[on ? 1 : 0];
    }
    if (u.pep) u.pep.visible = on;
    if (u.egg) u.egg.visible = on;
    if (u.tail) { u.tail.material = on ? M.tailOn : M.tailOff; u.gl.material.opacity = on ? 1 : 0; }
    if (pop && was !== undefined && was !== on && !RM) { u.popT = 0.32; pops.push(m); D.wake(); if (u.egg && on) u.dropT = 0.35; }
  }
  // the ring round the right figure, once the answer is shown
  function goodRing(g, w, d, flat = true) {
    const r = new THREE.Mesh(flat ? new THREE.TorusGeometry(Math.max(w, d) / 2 + 0.12, 0.035, 6, 48).rotateX(Math.PI / 2) : boxG(w + 0.3, 0.02, d + 0.3), M.good);
    r.position.y = 0.02; g.add(r); return r;
  }

  // where a figure of each shape goes, and the frog beside it
  const PLACE = {
    table: { at: V(TABLE.x - 0.45, TABLE.y, TABLE.z + 0.05), room: 4.3, frog: [TABLE.x + 2.25, TABLE.y, TABLE.z - 0.55, -0.5] },
    pond: { at: V(FIGPAD[0], WY + 0.03, FIGPAD[1]), room: 6.4, frog: [FIGPAD[0] - 3.4, 0, FIGPAD[1] + 2.0, 0.5] },
    stump: { at: V(STUMP[0], STUMPY, STUMP[1]), room: 4.4, frog: [STUMP[0] - 2.7, 0, STUMP[1] + 0.1, 0.6] },
    pool: { at: V(WALK.x, 0.06, (POOL.z0 + POOL.z1) / 2), room: 0, frog: [POOL.x1 + 0.45, 0, POOL.z1 + 0.25, -0.6] }
  };
  const placeOf = shape => shape === 'pad' ? 'pond' : shape === 'bugs' ? 'stump' : shape === 'bar' ? 'pool' : 'table';
  // a view that frames the box from (x0, z0) to (x1, z1) at height y, seen from dir
  const frameBox = (x0, x1, z0, z1, y, dir, m = 0.35) => ({ t: [(x0 + x1) / 2, y, (z0 + z1) / 2], dir, R: Math.max(1.3, (x1 - x0) / 2 + m, (z1 - z0) / 2 + m) });

  function clear() {
    for (const o of [...stageG.children]) drop(o);
    picks = []; parts = []; figsOn = []; lineOn = null; pops = []; cur = null; spreadK = 1; spreadT = 0;
  }
  // Figures on the table, on the water or at the stump: sc is { shape, figs: [{ D, on, w, rows, tall, hand }], tap: 'part' | 'pick' | null,
  // good (the figure that was right, once shown), lab, was (the parts before the last cut or join) }
  function buildFigs(sc) {
    const where = placeOf(sc.shape), P = PLACE[where], n = sc.figs.length;
    const make = f => sc.shape === 'choc' ? chocFig(f) : sc.shape === 'jug' ? jugFig(f, sc.lab) : sc.shape === 'eggs' ? eggsFig(f) : sc.shape === 'bugs' ? bugsFig(f) : roundFig(sc.shape, f);
    const gs = sc.figs.map(make), gap = where === 'pond' ? 0.25 : 0.3, sumW = gs.reduce((s, g) => s + g.userData.w, 0) + gap * (n - 1);
    const k = Math.min(where === 'stump' ? 1.7 : where === 'pond' ? 0.95 : 1.05, P.room / sumW), wAll = sumW * k;
    let x = P.at.x - wAll / 2, zMax = 0;
    gs.forEach((g, j) => {
      const w = g.userData.w * k; g.scale.setScalar(k); g.position.set(x + w / 2, P.at.y, P.at.z + (where === 'stump' ? -0.15 : 0)); x += w + gap * k; stageG.add(g);
      zMax = Math.max(zMax, g.userData.d * k);
      g.userData.parts.forEach((m, i) => { paintPart(m, !!sc.figs[j].on[i]); if (sc.tap === 'part' && n === 1) pickable(m.userData.hit || m, 'part', i); });
      if (sc.tap === 'pick') { const hb = new THREE.Mesh(new THREE.BoxGeometry(g.userData.w + 0.1, 0.6, g.userData.d + 0.1), HIT()); hb.position.y = 0.25; g.add(hb); pickable(hb, 'pick', j); }
      if (sc.good === j) goodRing(g, g.userData.w, g.userData.d, sc.shape !== 'choc');
    });
    figsOn = gs; parts = n === 1 ? gs[0].userData.parts : [];
    if (sc.was && n === 1 && !RM) { spreadK = 0; spreadT = 0.5; setSpread(0); D.sparkle(P.at.clone().add(V(0, 0.4, 0)), 10, 0xFFFFFF, 0.25, 1.2, 1.5); }
    const tall = gs.some(g => g.userData.tall), bugs = where === 'stump';
    const fx = P.frog[0], x0 = Math.min(P.at.x - wAll / 2, fx - 0.3), x1 = Math.max(P.at.x + wAll / 2, fx + 0.3);
    frogTo(...P.frog);
    // the fireflies stand up in the air: the view takes in their height too
    if (bugs) { const bb = new THREE.Box3().setFromObject(stageG), v = frameBox(x0, x1, P.at.z - 0.4, P.at.z + 0.9, (bb.min.y + bb.max.y) / 2 - 0.1, [0, 0.32, 1], 0.4); v.R = Math.max(v.R, (bb.max.y - 0.2) / 2 + 0.4); return v; }
    return tall ? frameBox(x0, x1, P.at.z - 1.0, P.at.z + 1.0, P.at.y + 1.0, [0, 0.55, 1], 0.4)
      : frameBox(x0, x1, P.at.z - zMax / 2, P.at.z + zMax / 2, P.at.y + 0.1, [0, 1.3, 1], 0.3);
  }
  // Walkways over the pool, one under the other: sc.rows is [{ D, on, w, lab, res }]; tap 'part' (one walkway) or 'pick' (choose one)
  function buildRows(sc) {
    const rows = sc.rows, n = rows.length, res = rows.some(r => r.res) ? 0.35 : 0;
    const rd = n <= 2 ? 0.85 : n <= 3 ? 0.7 : 0.55, gap = n <= 2 ? 0.8 : n <= 3 ? 0.6 : 0.42, total = n * rd + (n - 1) * gap + res;
    const z0 = PLACE.pool.at.z - total / 2, L = WALK.L - (rows.some(r => r.lab) ? 0.9 : 0), x = WALK.x + (rows.some(r => r.lab) ? 0.45 : 0);
    let z = z0;
    rows.forEach((r, j) => {
      if (r.res) z += res;
      const g = walkFig(r, L, rd); g.position.set(x, 0.06, z + rd / 2); stageG.add(g); figsOn.push(g);
      g.userData.parts.forEach((m, i) => { paintPart(m, !!r.on[i]); if (sc.tap === 'part' && n === 1) pickable(m, 'part', i); });
      if (sc.tap === 'pick') { const hb = new THREE.Mesh(new THREE.BoxGeometry(L + 0.2, 0.5, rd + 0.2), HIT()); g.add(hb); pickable(hb, 'pick', j); }
      if (sc.good === j) goodRing(g, L, rd, false);
      if (r.lab) { const s = label(r.lab, { bg: r.res ? 'rgba(20,70,50,0.92)' : 'rgba(7,28,40,0.9)', ring: r.res ? '#7CF5B0' : '#4D7486', ink: r.res ? '#7CF5B0' : '#FFFFFF', h: n > 3 ? 0.34 : 0.42, depthTest: false, order: 9 }); s.position.set(x - L / 2 - 0.5, 0.45, z + rd / 2); stageG.add(s); }
      z += rd + gap;
    });
    parts = n === 1 ? figsOn[0].userData.parts : [];
    if (sc.was && n === 1 && !RM) { spreadK = 0; spreadT = 0.5; setSpread(0); }
    frogTo(...PLACE.pool.frog);
    return frameBox(WALK.x - WALK.L / 2 - 0.2, WALK.x + WALK.L / 2 + 0.2, z0, z0 + total, 0.05, [0, n > 3 ? 1.6 : 1.3, 1], 0.25);
  }
  // The river of the jumps: a pad every 1/d from 0 to max, the whole numbers on bigger pads with their sign, the frog on pad pos and a
  // dotted arc for every jump it has made. tap: the pads can be touched; lab: every pad says its fraction
  function buildLine(sc) {
    const N = sc.d * sc.max, Lr = Math.min(RIV.x1 - RIV.x0 - 1.8, Math.max(5.2, N * 1.05)), xa = RX - Lr / 2, sp = Lr / N, r = Math.min(0.4, sp * 0.36);
    const X = i => xa + i * sp, ps = [];
    for (let i = 0; i <= N; i++) {
      const big = i % sc.d === 0, rr = big ? r + 0.09 : r;
      const m = mesh(new THREE.CylinderGeometry(rr, rr, 0.05, 24).translate(0, 0.025, 0), big ? mat(0x2F7F40) : M.leaf, { cast: false });
      m.position.set(X(i), WY + 0.02, RZ); m.userData.big = big; stageG.add(m); ps.push(m);
      if (sc.tap) { const hb = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(rr, sp * 0.48), Math.max(rr, sp * 0.48), 0.5, 10), HIT()); hb.position.copy(m.position); stageG.add(hb); pickable(hb, 'pad', i); }
      if (big) { const s = label(String(i / sc.d), { bg: 'rgba(255,243,224,0.95)', ink: '#3A2614', ring: '#6B3E1C', h: 0.42, order: 8 }); s.position.set(X(i), 0.55, RIV.z1 + 0.35); stageG.add(s); stageG.add(mesh(boxG(0.06, 0.4, 0.06, X(i), 0.2, RIV.z1 + 0.32), wood3M)); }
      else if (sc.lab) { const s = label(`${i}/${sc.d}`, { h: 0.3, ink: '#F7C64E', edge: '#0B2A38', order: 8 }); s.position.set(X(i), 0.35, RZ + 0.62); stageG.add(s); }
    }
    const arcs = new THREE.Group(); stageG.add(arcs);
    lineOn = { sc, X, ps, arcs, at: sc.from ?? sc.pos, target: sc.pos, hop: null, sp, pops: [] };
    paintLine();
    frogHop?.res?.(); frogHop = null;
    frog.position.set(X(lineOn.at), WY + 0.06, RZ); frog.rotation.y = -Math.PI / 2 + 0.25;
    if (lineOn.at !== lineOn.target) startHop();
    return frameBox(xa - 0.4, xa + Lr + 0.4, RZ - 0.9, RIV.z1 + 0.6, 0.1, [0, 1.7, 1], 0.2);
  }
  // the pads the frog has passed are gold, and the arcs of its jumps are drawn
  const dotTex = softTex();
  function paintLine() {
    const L = lineOn; if (!L) return;
    const at = Math.round(L.at);
    L.ps.forEach((m, i) => { m.material = i <= at && (i > 0 || at > 0) ? M.sunny : m.userData.big ? mat(0x2F7F40) : M.leaf; });
    for (const o of [...L.arcs.children]) drop(o);
    for (let i = 0; i < at; i++) for (let k = 1; k < 8; k++) {
      const t = k / 8, x = L.X(i) + t * L.sp, y = WY + 0.12 + Math.sin(t * Math.PI) * Math.min(0.9, L.sp * 0.55);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xF7C64E, transparent: true, depthWrite: false, toneMapped: false })); s.scale.setScalar(0.16); s.position.set(x, y, RZ); L.arcs.add(s);
    }
  }
  function startHop() {
    const L = lineOn; if (!L || L.hop || L.at === L.target) return;
    const to = L.at + Math.sign(L.target - L.at);
    L.hop = { from: L.at, to, t: 0, dur: RM ? 0 : 0.24 }; D.wake();
    if (RM) finishHop();
  }
  function finishHop() {
    const L = lineOn, h = L.hop; L.at = h.to; L.hop = null;
    frog.position.set(L.X(L.at), WY + 0.06, RZ);
    sound.tone(500 + 40 * L.at, 0, 0.1, 0.06);
    paintLine();
    // the pad landed on says how many jumps from the 0 it is
    if (L.at > 0 && !L.sc.lab && L.at % L.sc.d) {
      const s = label(`${L.at}/${L.sc.d}`, { h: 0.34, ink: '#F7C64E', edge: '#0B2A38', depthTest: false, order: 11 }); s.position.set(L.X(L.at), 0.7, RZ); stageG.add(s);
      L.pops.push({ s, t: 0.9 });
    }
    if (L.at !== L.target) startHop();
  }
  // where the parts sit: 0 all together, 1 with their cuts open
  function setSpread(k) { for (const g of figsOn) for (const m of g.userData.parts) { const u = m.userData; if (u.p0) m.position.copy(u.p0).addScaledVector(u.pd, k); } }

  // what a question shows: a scene of figures, walkways or the river (null: nothing, and the camera goes to the frog). The same scene
  // with other parts chosen, or the frog somewhere else, is updated without building it again
  const sigOf = sc => JSON.stringify(sc.s === 'line' ? [sc.s, sc.d, sc.max, sc.tap, sc.lab] : sc.s === 'bars' ? [sc.s, sc.tap, sc.good, sc.rows.map(r => [r.D, r.w, r.lab, r.res])]
    : [sc.s, sc.shape, sc.tap, sc.good, sc.lab, sc.figs.map(f => [f.D, f.w, f.rows, f.tall])]);
  function show(sc, o = {}) {
    if (!sc) return home(o);
    const sig = sigOf(sc);
    if (cur && cur.sig === sig) return update(sc);
    clear(); cur = { sig, sc };
    if (sc.s === 'line') cur.view = buildLine(sc);
    else if (sc.s === 'bars' || sc.shape === 'bar') cur.view = buildRows(sc.s === 'bars' ? sc : { ...sc, rows: sc.figs });
    else cur.view = buildFigs(sc);
    update(sc, true);
    const key = JSON.stringify(cur.view);
    if (key !== viewKey) go(cur.view, { dur: o.dur || 1000 });
    D.wake();
  }
  function update(sc, first = false) {
    cur.sc = sc;
    if (sc.s === 'line') { const L = lineOn; L.target = sc.pos; L.sc = sc; if (!L.hop) startHop(); return; }
    const list = sc.s === 'bars' ? sc.rows : sc.figs;
    figsOn.forEach((g, j) => {
      g.userData.parts.forEach((m, i) => paintPart(m, !!list[j]?.on[i], !first));
      const f = list[j]; if (g.userData.hand && f?.hand != null) { const hand = g.userData.hand, to = -f.hand * TAU, fr = hand.rotation.y; tween(RM ? 0 : 300, k => { hand.rotation.y = fr + (to - fr) * k; }, easeOut); }
      if (g.userData.jug) { g.userData.jug.to = list[j].on.filter(Boolean).length / list[j].D; D.wake(); }
    });
  }
  function home(o = {}) {
    clear(); frogTo(ROCK[0], 0.36, ROCK[1], 0.35);
    if (viewName !== 'home') go('home', { dur: o.dur || 900 });
  }
  // everything empty again, the frog back on its rock (the camera stays where it is)
  function rest() { clear(); frogTo(ROCK[0], 0.36, ROCK[1], 0.35, RM ? 0 : 500); highlight(null); D.wake(); }
  // a right answer: the chosen parts jump and sparkle
  function cheer() {
    frogSay('go');
    for (const g of figsOn) for (const m of g.userData.parts) if (m.userData.on && !RM) { m.userData.popT = 0.4; pops.push(m); }
    const c = figsOn.length ? new THREE.Box3().setFromObject(stageG).getCenter(V(0, 0, 0)) : frog.position.clone();
    D.sparkle(c.add(V(0, 0.4, 0)), 14, 0xFFE08A, 0.32, 1.8, 2.4); D.wake();
  }
  // a wrong answer: the frog shakes its head and the figures shake
  let shakeT = 0;
  function oops() { frogSay('oops'); if (!RM) { shakeT = 0.35; D.wake(); } }

  /* ---------- a tap on the pond ---------- */
  canvas.addEventListener('click', e => {
    if (!api.onPick) return;
    const list = picks.length ? picks : pads.map(P => P.hit);
    const hit = D.pick(e.clientX, e.clientY, list.filter(h => h.userData.pick))[0];
    if (hit) api.onPick(hit.object.userData.pick.kind, hit.object.userData.pick.key);
  });
  // the point of the screen where a thing that can be tapped is: for the checks in the browser, which touch it there
  function where(kind, key) {
    const list = kind === 'proj' ? pads.map(P => P.hit) : picks;
    const o = list.find(h => h.userData.pick?.kind === kind && (key == null || h.userData.pick.key === String(key))); if (!o) return null;
    return D.onScreen(new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0)));
  }

  /* ---------- what moves by itself ---------- */
  D.every((dt0, now0, raw0) => {
    const dt = Math.max(0, dt0), raw = Math.max(0, raw0), t = now0 / 1000;
    if (frogHop) {
      const h = frogHop, k = h.dur ? Math.min(1, (now0 - h.t0) / h.dur) : 1, e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      frog.position.lerpVectors(h.from, h.to, e); frog.position.y += Math.sin(k * Math.PI) * h.h; frog.rotation.y = h.ry0 + (h.ry - h.ry0) * e;
      if (k >= 1) { frogHop = null; h.res?.(); }
    }
    if (RM) return !!frogHop;
    flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; });
    if (NFL) flyGeo.attributes.position.needsUpdate = true;
    // the frog breathes, and leaps or shakes its head with what the tip says
    frog.userData.t += dt; frog.userData.body.scale.set(1 + Math.sin(frog.userData.t * 2.2) * 0.02, 1 + Math.sin(frog.userData.t * 2.2) * 0.03, 1);
    if (frogDo) {
      const h = frogDo; h.t += raw; const k = Math.min(1, h.t / 0.7);
      if (h.ok) frog.userData.body.position.y = Math.sin(k * Math.PI) * 0.5; else frog.userData.body.rotation.y = Math.sin(k * Math.PI * 4) * 0.4 * (1 - k);
      if (k >= 1) { frogDo = null; frog.userData.body.position.y = 0; frog.userData.body.rotation.y = 0; }
    }
    // the frog on the river: a hop from pad to pad
    const L = lineOn;
    if (L?.hop) {
      const h = L.hop; h.t += raw; const k = Math.min(1, h.t / h.dur), x = L.X(h.from) + (L.X(h.to) - L.X(h.from)) * k;
      frog.position.set(x, WY + 0.06 + Math.sin(k * Math.PI) * Math.min(0.9, L.sp * 0.55), RZ); frog.rotation.y = (h.to > h.from ? -1 : 1) * Math.PI / 2 * 0.75;
      if (k >= 1) finishHop();
    }
    if (L) for (let i = L.pops.length - 1; i >= 0; i--) { const p = L.pops[i]; p.t -= raw; p.s.position.y = 0.7 + (0.9 - p.t) * 0.35; p.s.material.opacity = Math.min(1, p.t * 2); if (p.t <= 0) { drop(p.s); L.pops.splice(i, 1); } }
    // a cut opens; the parts that change jump; an egg falls into its hole; the jug fills
    if (spreadT > 0) { spreadT -= raw; spreadK = Math.min(1, 1 - Math.max(0, spreadT) / 0.5); setSpread(easeOut(spreadK)); }
    for (let i = pops.length - 1; i >= 0; i--) {
      const m = pops[i], u = m.userData; u.popT -= raw;
      const k = Math.max(0, u.popT), lift = Math.sin(k / 0.4 * Math.PI) * 0.12;
      if (u.p0) { m.position.copy(u.p0).addScaledVector(u.pd, spreadK); m.position.y += lift; }
      if (u.egg) { u.dropT = Math.max(0, (u.dropT || 0) - raw); u.egg.position.y = 0.17 + u.dropT * 2.4; }
      if (u.popT <= 0) { if (u.p0) m.position.copy(u.p0).addScaledVector(u.pd, spreadK); if (u.egg) u.egg.position.y = 0.17; pops.splice(i, 1); }
    }
    for (const g of figsOn) {
      const j = g.userData.jug;
      if (j && j.to != null && Math.abs(j.now - j.to) > 0.001) { j.now += (j.to - j.now) * Math.min(1, raw * 8); if (Math.abs(j.now - j.to) < 0.003) j.now = j.to; const h = Math.max(0.001, j.now * (j.H - 0.08)); j.juice.scale.y = h; j.top.position.y = 0.04 + h; j.top.visible = j.now > 0.002; }
      if (g.userData.bugs) for (const b of g.userData.parts) b.position.y = b.userData.p0.y + Math.sin(t * 2 + b.userData.ph) * 0.05;
    }
    if (shakeT > 0) { shakeT -= raw; stageG.position.x = Math.sin(shakeT * 60) * 0.05 * Math.max(0, shakeT / 0.35); } else stageG.position.x = 0;
    // the pad of the project to play now breathes; the one under the finger shines
    pads.forEach((P, p) => { P.leaf.emissiveIntensity = p === hl ? 0.32 + 0.18 * Math.sin(t * 6) : p === nextPad ? 0.1 + 0.08 * Math.sin(t * 2.4) : 0; });
    if (hl != null) pads[hl].ring.material.opacity = 0.7 + 0.3 * Math.sin(t * 6);
    return true;
  });

  state({});
  const api = { ok: true, layout, go, get view() { return viewName; }, state, highlight, pause: D.pause, celebrate: (t, a) => D.celebrate(t, a), shake: D.shake,
    hear: o => { sound = { ...sound, ...o }; }, rest, frogSay, show, home, cheer, oops, piece, lantern, festa, where, onPick: null,
    get frogAt() { return lineOn ? Math.round(lineOn.at) : null; }, _: { D, pads, lanterns, frog } };
  return api;
}

// a wedge of a round figure lying flat, from angle a0 to a1 (0 at the far side, clockwise seen from above), r its radius and h its height
function wedge(r, a0, a1, h) {
  const s = new THREE.Shape(), n = Math.max(3, Math.ceil((a1 - a0) / TAU * 64));
  s.moveTo(0, 0);
  for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; s.lineTo(r * Math.sin(a), r * Math.cos(a)); }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2);
}
/* ---------- the frog of the party, with a paper hat ---------- */
// about one unit tall, looking at +z; its body breathes (userData.body)
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4), hat: mat(0xFF6BB0, { roughness: 0.5 }), dot: mat(0xFFE08A) };
  g.add(body);
  body.add(part(SPH, k.body, [0.5, 0.36, 0.46], [0, 0.38, 0]));
  body.add(part(SPH, k.belly, [0.36, 0.25, 0.12], [0, 0.3, 0.37]));
  for (const s of [-1, 1]) {
    body.add(part(SPH, k.dark, [0.2, 0.17, 0.34], [s * 0.42, 0.18, -0.05]));
    body.add(part(SPH, k.dark, [0.17, 0.06, 0.26], [s * 0.46, 0.04, 0.18]));
    body.add(part(SPH, k.dark, [0.09, 0.05, 0.13], [s * 0.2, 0.04, 0.38]));
    body.add(part(SPH, k.body, [0.17, 0.17, 0.17], [s * 0.23, 0.68, 0.16]));
    body.add(part(SPH, mat(0xffffff, { roughness: 0.3 }), [0.12, 0.12, 0.12], [s * 0.24, 0.72, 0.24]));
    body.add(part(SPH, mat(0x06220D, { roughness: 0.15 }), [0.065, 0.075, 0.05], [s * 0.25, 0.73, 0.34]));
    body.add(part(SPH, mat(0xFF8FD0, { roughness: 0.6 }), [0.07, 0.04, 0.02], [s * 0.3, 0.43, 0.37]));
  }
  body.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 6, 20, Math.PI * 0.7).rotateZ(Math.PI + Math.PI * 0.15).translate(0, 0.5, 0.41), mat(0x1F6030)));
  // the paper hat of the party, a little to one side, with its pompom
  body.add(part(CONE, k.hat, [0.17, 0.36, 0.17], [-0.06, 0.86, -0.02], [0, 0, 0.18]));
  body.add(part(SPH, k.dot, [0.06, 0.06, 0.06], [-0.09, 1.05, -0.02]));
  bake(body);
  g.userData.body = body;
  return g;
}
// the soft light of a firefly
function softTex() {
  return canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
