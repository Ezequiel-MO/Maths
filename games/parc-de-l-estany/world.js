// The park of El parc de l'estany in 3D, built on shared/diorama.js: a block of earth that floats in the dusk with a theme park on top.
// The gate at the front with its arch and the box office; a measuring board by the queue of the roller coaster; the merry-go-round, the
// big wheel, the roller coaster with its train, the snack bar, the square of shapes, the queue and the tombola; and a corner of the pond.
// The map is the park itself: each project validated switches its ride on (it lights up and moves), and every exam passed lights a star
// over the arch, with fireworks. Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL park() gives the
// same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, SPH, CONE, CYL, V, easeOut } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';
import { COLORS } from './logic.js';

/* ---------- the measures of the park ---------- */
// the block: x from X0 to X1, z from Z0 (back) to Z1 (front), the grass at 0 and the bottom at YB
const X0 = -13, X1 = 13, Z0 = -9, Z1 = 9, YB = -3.2;
// where each thing stands
const GATE = [0, 8.5], BOOTH = [-3.2, 7.0], INFO = [4.8, 7.6], MEASURE = [2.0, 5.5], CAROUSEL = [-7.6, 3.0], WHEEL = [-7.2, -4.9], HUB = 4.5, WR = 3.3;
const FOOD = [8.0, 5.6], PLAZA = [-1.4, -0.9], QUEUE = [5.0, 2.9], TOMBOLA = [-1.9, -6.9], POND = [-11, 6.9];
// an adult is 1 unit tall (170 cm)
const CM = 1 / 170;
const DX = 0.8;
// the track of the roller coaster: through the station (the first two points), up the lift hill and round, back to the station
const TRACK = [[2.2, 0.75, 0.7], [5.0, 0.75, 0.75], [7.8, 3.0, 0.3], [9.6, 5.6, -0.8], [11.0, 4.9, -2.4], [11.3, 0.9, -4.4], [10.2, 3.6, -6.6], [7.6, 1.3, -7.6], [5.0, 2.9, -7.2], [2.9, 1.1, -5.6], [1.8, 2.0, -3.5], [1.5, 0.9, -1.3]]
  .map(([x, y, z]) => V(x + DX, y, z));
const C = { grass: 0x6DBB6A, grass2: 0x4F9C58, sand: '#E8D2A8', red: 0xE5484D, white: 0xFFF6E8, gold: 0xF2B53A, blue: 0x3D7BE0, wood: 0x8B5A3C, ink: 0x2A2540, leaf: [0x4E9F5B, 0x67B565, 0x3F8A4E] };

/* ---------- the visitors ---------- */
// People of five kinds and the guide of the park, about one unit tall (the children less), looking at +z. Skin and hair change from one
// to the next. o.still: it will not walk, so the legs are drawn with the rest (fewer draws)
const SKINS = [0xF6D2B5, 0xEBB991, 0xC98E63, 0x9A6440, 0x6B4328], HAIRS = [0x2B1D16, 0x5A3A22, 0x8A5A2B, 0xD9A55A, 0xB0442A, 0x161616];
const LOOK = {
  nen: { top: 0x3D7BE0, legs: 0x2A3550, shin: true, cap: 0xE5484D, kid: true }, nena: { top: 0xE86CA8, legs: 0x4E5378, shin: true, tail: true, kid: true },
  pare: { top: 0x38A169, legs: 0x5A4A3A, pack: 0x2E6FA8 }, mare: { top: 0xF28C28, legs: 0x2E3A59, long: true },
  avia: { top: 0x9B6ADB, legs: 0x4E5378, hair: 0xE9E5DC, skirt: 0x4E5378, bun: true }, guia: { top: 0xF5C33B, legs: 0x2A2F3A, cap: 0x3D7BE0 }
};
const DOME = new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), BOX = new THREE.BoxGeometry(1, 1, 1);
const SMILE = new THREE.TorusGeometry(1, 0.22, 5, 10, Math.PI).rotateZ(Math.PI), RING = new THREE.TorusGeometry(1, 0.2, 6, 14);
for (const g of [DOME, BOX, SMILE, RING]) g.userData.shared = true;
const pickA = a => a[Math.floor(Math.random() * a.length)];
export function makePerson(sp, o = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), L = LOOK[sp] || LOOK.pare, still = o.still;
  const skin = mat(pickA(SKINS)), hair = mat(L.hair ?? pickA(HAIRS)), top = mat(L.top);
  g.add(body);
  const legs = [-1, 1].map(s => {
    const leg = new THREE.Group(); leg.position.set(s * 0.09, 0.27, 0);
    leg.add(part(CYL, mat(L.legs), [0.068, L.shin ? 0.12 : 0.22, 0.068], [0, L.shin ? -0.06 : -0.11, 0]));
    if (L.shin) leg.add(part(CYL, skin, [0.056, 0.11, 0.056], [0, -0.165, 0]));
    leg.add(part(SPH, mat(0x2A1D17), [0.075, 0.05, 0.11], [0, -0.23, 0.03]));
    if (!still) { bake(leg); leg.userData.keep = true; }
    body.add(leg); return leg;
  });
  if (L.skirt) body.add(part(CONE, mat(L.skirt), [0.22, 0.26, 0.2], [0, 0.32, 0]));
  body.add(part(SPH, top, [0.23, 0.26, 0.19], [0, 0.46, 0]));
  for (const s of [-1, 1]) { body.add(part(SPH, top, [0.065, 0.18, 0.065], [s * 0.245, 0.46, 0], [0, 0, s * 0.22])); body.add(part(SPH, skin, [0.055, 0.055, 0.055], [s * 0.285, 0.29, 0.01])); }
  // a bigger head for the children
  const hs = L.kid ? 1.18 : 1, hy = L.kid ? 0.88 : 0.86;
  body.add(part(SPH, skin, [0.21 * hs, 0.2 * hs, 0.2 * hs], [0, hy, 0]));
  for (const s of [-1, 1]) {
    body.add(part(SPH, mat(0x1E1611, { roughness: 0.25 }), [0.028 * hs, 0.034 * hs, 0.02], [s * 0.075 * hs, hy + 0.02, 0.185 * hs]));
    body.add(part(SPH, mat(0xF29A8C), [0.034, 0.02, 0.012], [s * 0.125 * hs, hy - 0.05, 0.155 * hs]));
  }
  body.add(part(SMILE, mat(0x8A3A2E), [0.045, 0.045, 0.045], [0, hy - 0.045, 0.193 * hs]));
  body.add(part(DOME, hair, [0.222 * hs, 0.17 * hs, 0.215 * hs], [0, hy + 0.07, -0.01]));
  body.add(part(SPH, hair, [0.2 * hs, 0.2 * hs, 0.17 * hs], [0, hy + 0.02, -0.06]));
  if (L.long) body.add(part(SPH, hair, [0.2, 0.3, 0.12], [0, 0.72, -0.12]));
  if (L.tail) body.add(part(SPH, hair, [0.08, 0.16, 0.08], [0, hy - 0.02, -0.27]));
  if (L.bun) { body.add(part(SPH, hair, [0.09, 0.08, 0.09], [0, 1.1, -0.05])); for (const s of [-1, 1]) body.add(part(RING, mat(0xB5852E, { metalness: 0.7, roughness: 0.3 }), [0.048, 0.048, 0.048], [s * 0.075, hy + 0.02, 0.205])); }
  if (L.cap) { body.add(part(DOME, mat(L.cap), [0.235 * hs, 0.16 * hs, 0.235 * hs], [0, hy + 0.08, 0])); body.add(part(CYL, mat(L.cap), [0.12, 0.015, 0.1], [0, hy + 0.08, 0.2 * hs])); }
  if (L.pack) body.add(part(SPH, mat(L.pack), [0.16, 0.18, 0.09], [0, 0.5, -0.19]));
  // a balloon on a string for some children
  if (o.balloon) {
    const c = pickA([0xE5484D, 0x3D7BE0, 0xF5C33B, 0x38A169, 0x9B6ADB]);
    body.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 4).translate(0.3, 0.72, 0.02), mat(0xEEEEEE)));
    body.add(part(SPH, mat(c, { roughness: 0.3 }), [0.17, 0.2, 0.17], [0.3, 1.32, 0.02]));
  }
  bake(body);
  g.userData = { body, legs: still ? null : legs, path: [], speed: 1.7, t: Math.random() * 10, done: null, face: null };
  return g;
}

/* ---------- the world ---------- */
export function park(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('parc 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, guest: p, happy: p, sad() {}, leave: p, crowd() {},
    openSign: p, star: p, fireworks() {}, counter() {}, wheelTo: p, horses() {}, stack() {}, shape() {}, spin: p, ride: p, board() {}, drone: p, wait() {} };
}

function build(canvas) {
  const VIEWS = {
    map: { t: [-0.2, 0.2, -0.4], dir: [0.42, 0.78, 1], R: 14.6 },
    gate: { t: [BOOTH[0] + 0.5, 1.1, BOOTH[1] + 0.5], dir: [-0.5, 0.32, 1], R: 2.4 },
    height: { t: [MEASURE[0] + 0.25, 0.7, MEASURE[1]], dir: [0.12, 0.38, 1], R: 1.5, fit: 'h' },
    carousel: { t: [CAROUSEL[0], 1.5, CAROUSEL[1]], dir: [0.35, 0.5, 1], R: 3.4 },
    wheel: { t: [WHEEL[0], HUB - 0.3, WHEEL[1]], dir: [0.02, 0.3, 1], R: 4.6, fit: 'h' },
    coaster: { t: [7.2, 2.4, -3.4], dir: [0.15, 0.62, 1], R: 6.6 },
    food: { t: [FOOD[0], 1.4, FOOD[1]], dir: [0.15, 0.35, 1], R: 2.4 },
    shapes: { t: [PLAZA[0], 0.8, PLAZA[1]], dir: [0.2, 0.75, 1], R: 3.5 },
    top: { t: [PLAZA[0], 0.4, PLAZA[1]], dir: [0.0001, 1, 0.012], R: 1.1 },
    front: { t: [PLAZA[0], 0.45, PLAZA[1]], dir: [0, 0.02, 1], R: 0.95 },
    queue: { t: [QUEUE[0], 1.0, QUEUE[1]], dir: [0.25, 0.55, 1], R: 2.8 },
    tombola: { t: [TOMBOLA[0], 1.5, TOMBOLA[1]], dir: [0.12, 0.28, 1], R: 2.5 },
    board: { t: [INFO[0], 1.25, INFO[1]], dir: [0.12, 0.18, 1], R: 1.45 },
    sky: { t: [GATE[0], 4.2, GATE[1]], dir: [0.05, 0.12, 1], R: 3.2 }
  };
  const D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-16, 18, 14], shadow: { left: -17, right: 17, top: 14, bottom: -14 }, floor: YB - 4, under: [0, YB - 2.5, 0, 34, 26], fov: 32 });
  const { scene, glow, tween, sparkle } = D;
  const fixed = new THREE.Group(); scene.add(fixed);

  /* ---------- the block of earth, and the grass with its paths painted on ---------- */
  const soilTex = canvasTex(256, 256, (g, w, h) => {
    const bands = ['#6E9F4E', '#7A4E2D', '#8E5E36', '#6B4226', '#9A6B43', '#5C3820'], hs = [14, 50, 50, 50, 46, 46]; let y = 0;
    bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, y, w, hs[i]); y += hs[i]; });
    for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(${i % 3 ? '40,25,15' : '200,180,150'},${0.15 + Math.random() * 0.25})`; const r = 1 + Math.random() * 4; g.beginPath(); g.ellipse(Math.random() * w, 16 + Math.random() * (h - 16), r * 1.6, r, 0, 0, 7); g.fill(); }
  });
  soilTex.wrapS = THREE.RepeatWrapping; soilTex.repeat.set(4, 1);
  const side = std(0xffffff, { map: soilTex, roughness: 0.95 });
  scene.add(mesh(boxG(X1 - X0, -YB, Z1 - Z0, 0, YB / 2, 0), [side, side, std(C.grass), std(0x3A2617), side, side], { cast: false }));
  const PX = 40, cw = (X1 - X0) * PX, ch = (Z1 - Z0) * PX, cxz = (x, z) => [(x - X0) * PX, (z - Z0) * PX];
  const groundTex = canvasTex(cw, ch, g => {
    g.fillStyle = '#6DBB6A'; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 2600; i++) { g.fillStyle = ['rgba(79,156,88,0.35)', 'rgba(140,205,120,0.3)', 'rgba(60,130,70,0.25)'][i % 3]; g.fillRect(Math.random() * cw, Math.random() * ch, 3 + Math.random() * 5, 2 + Math.random() * 3); }
    const path = (pts, w = 1.1) => { g.lineCap = g.lineJoin = 'round'; for (const [c, k] of [['#C9AE7A', 1.12], [C.sand, 1]]) { g.strokeStyle = c; g.lineWidth = w * PX * k; g.beginPath(); pts.forEach(([x, z], i) => { const [u, v] = cxz(x, z); i ? g.lineTo(u, v) : g.moveTo(u, v); }); g.stroke(); } };
    path([[GATE[0], Z1], [0, 5.2], [PLAZA[0] + 0.6, PLAZA[1] + 2.4]]);
    path([[0, 5.2], [-3.6, 4.6], [CAROUSEL[0] + 2.2, CAROUSEL[1] + 1.2]]);
    path([[0, 5.2], [3.2, 4.0], [QUEUE[0] - 0.4, QUEUE[1]], [FOOD[0] - 0.8, FOOD[1] - 1.2]]);
    path([[PLAZA[0] - 2.2, PLAZA[1] - 1.2], [WHEEL[0] + 1.4, WHEEL[1] + 1.5]]);
    path([[PLAZA[0], PLAZA[1] - 2.4], [TOMBOLA[0], TOMBOLA[1] + 1.0]]);
    path([[PLAZA[0] + 2.4, PLAZA[1] + 0.4], [2.6 + DX, 1.6]]);
    path([[BOOTH[0], BOOTH[1] + 0.6], [GATE[0], GATE[1] - 0.6]], 0.9);
    // the square: a ring of stones
    const [pu, pv] = cxz(PLAZA[0], PLAZA[1]);
    g.fillStyle = '#C9AE7A'; g.beginPath(); g.arc(pu, pv, 2.85 * PX, 0, 7); g.fill();
    g.fillStyle = '#E9DCC0'; g.beginPath(); g.arc(pu, pv, 2.7 * PX, 0, 7); g.fill();
    for (let r = 0.6; r < 2.7; r += 0.55) { g.strokeStyle = 'rgba(160,135,95,0.45)'; g.lineWidth = 2; g.beginPath(); g.arc(pu, pv, r * PX, 0, 7); g.stroke(); }
    for (let a = 0; a < 24; a++) { g.beginPath(); g.moveTo(pu + Math.cos(a / 24 * 6.283) * 0.6 * PX, pv + Math.sin(a / 24 * 6.283) * 0.6 * PX); g.lineTo(pu + Math.cos(a / 24 * 6.283) * 2.7 * PX, pv + Math.sin(a / 24 * 6.283) * 2.7 * PX); g.stroke(); }
    // flower beds
    for (let i = 0; i < 140; i++) { const [u, v] = cxz(-12.4 + Math.random() * 4.6, -0.6 + Math.random() * 1.0); g.fillStyle = ['#FF8FD0', '#FFE08A', '#FFFFFF', '#FF6B5E'][i % 4]; g.beginPath(); g.arc(u, v, 3, 0, 7); g.fill(); }
  });
  const ground = mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI / 2).translate(0, 0.002, 0), std(0xffffff, { map: groundTex, roughness: 0.92 }), { cast: false });
  scene.add(ground);

  /* ---------- trees, bushes, the fence and the lamps ---------- */
  const trunkM = std(0x7A5230);
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(C.leaf[(i + Math.round(Math.abs(x) * 3)) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-12.0, -8.0, 1.2], [-10.3, -8.2, 0.9], [-12.2, -2.8, 1.0], [-12.1, 1.6, 0.9], [-4.6, -8.2, 1.0], [12.2, 7.9, 1.0], [10.6, 8.1, 0.8], [-6.0, 7.8, 0.9], [12.3, 2.6, 0.9], [0.6, -8.3, 0.8]]) tree(x, z, s);
  const bushM = std(C.grass2, { flatShading: true });
  for (const [x, z, s] of [[-9.0, 7.9, 0.45], [5.6, 8.1, 0.5], [-12.4, 4.2, 0.45], [12.3, 5.0, 0.5], [1.4, -2.7, 0.4], [-4.2, 1.9, 0.4], [9.8, 2.2, 0.45]]) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  // the fence along the front, broken by the gate
  const fenceM = std(C.white, { roughness: 0.6 });
  for (const [a, b] of [[X0 + 0.3, GATE[0] - 1.9], [GATE[0] + 1.9, X1 - 0.3]]) {
    for (let x = a; x <= b + 1e-6; x += 0.8) fixed.add(mesh(boxG(0.09, 0.75, 0.09, x, 0.375, Z1 - 0.25), fenceM));
    for (const y of [0.32, 0.62]) fixed.add(mesh(boxG(b - a, 0.06, 0.05, (a + b) / 2, y, Z1 - 0.25), fenceM));
  }
  // the lamps along the paths: lit once the park opens
  const lampAt = [[-1.2, 6.0], [1.2, 3.2], [-2.6, 4.8], [2.4, 4.6], [-4.4, -1.4], [1.0, -3.0], [-0.4, -5.0], [6.4, 4.0]];
  const lampM = std(0x2A2F3A, { metalness: 0.5, roughness: 0.4 }), lampHeads = [], lampGlows = [];
  for (const [x, z] of lampAt) {
    fixed.add(mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.7, 8).translate(x, 0.85, z), lampM));
    const h = mesh(new THREE.SphereGeometry(0.13, 12, 8).translate(x, 1.78, z), new THREE.MeshBasicMaterial({ color: 0x8A8170 }), { cast: false }); h.userData.keep = true; scene.add(h); lampHeads.push(h);
    lampGlows.push(glow(x, 1.78, z, 1.4, 0xFFC46A, false));
  }

  /* ---------- small helpers: bulbs that light up, stripes ---------- */
  // little bulbs at the points pts under parent: one instanced mesh, every bulb its colour; on(true) lights them
  const BULB = new THREE.SphereGeometry(1, 8, 6); BULB.userData.shared = true;
  const LIT = [0xFFD36B, 0xFF8AC2, 0x7CF5B0, 0x6FE3FF, 0xFFFFFF], OFF = new THREE.Color(0x5A5048);
  function bulbs(pts, parent, r = 0.05, palette = LIT) {
    const m = new THREE.InstancedMesh(BULB, new THREE.MeshBasicMaterial({ toneMapped: false }), pts.length), o = new THREE.Object3D();
    pts.forEach((p, i) => { o.position.copy(p); o.scale.setScalar(r); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, OFF); });
    m.userData.keep = true; parent.add(m);
    let on = false;
    const paint = (t = 0) => { pts.forEach((_, i) => m.setColorAt(i, on ? new THREE.Color(palette[(i + t) % palette.length]) : OFF)); m.instanceColor.needsUpdate = true; };
    return { set(v) { on = v; paint(); }, chase(t) { if (on) paint(t); }, get on() { return on; } };
  }
  const stripes = (a, b, n = 12, w = 256, h = 64) => { const t = canvasTex(w, h, (g) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * w / n, 0, w / n + 1, h); } }); return t; };

  /* ---------- the gate: the arch with its neon sign, and the stars of the exams ---------- */
  const arch = new THREE.Group(); arch.position.set(GATE[0], 0, GATE[1]); scene.add(arch);
  for (const s of [-1, 1]) {
    arch.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 16).translate(s * 1.75, 1.6, 0), std(0xffffff, { map: stripes('#E5484D', '#FFF6E8', 8, 256, 64) })));
    arch.add(part(SPH, mat(C.gold, { metalness: 0.6, roughness: 0.35 }), [0.3, 0.3, 0.3], [s * 1.75, 3.35, 0]));
  }
  arch.add(mesh(new THREE.TorusGeometry(1.75, 0.13, 10, 40, Math.PI).translate(0, 3.15, 0), mat(0x2C5DB0)));
  const signCanvas = canvasTex(1024, 220, () => {});
  function drawSign(lit) {
    const c = signCanvas.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.clearRect(0, 0, w, h); g.fillStyle = '#1E1846'; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 60); g.fill(); g.lineWidth = 10; g.strokeStyle = lit ? '#FFD36B' : '#6A5A3A'; g.stroke();
    g.font = '900 104px "Baloo 2", "Fraunces", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (lit) { g.shadowColor = '#FF5FA8'; g.shadowBlur = 34; }
    g.fillStyle = lit ? '#FFF1F8' : '#7A6E8A'; g.fillText("PARC DE L'ESTANY", w / 2, h / 2 + 8);
    signCanvas.needsUpdate = true;
  }
  drawSign(false);
  const sign = mesh(new THREE.PlaneGeometry(3.4, 0.73).translate(0, 2.55, 0.16), new THREE.MeshBasicMaterial({ map: signCanvas, transparent: true, toneMapped: false }), { cast: false }); sign.userData.keep = true; arch.add(sign);
  arch.add(mesh(boxG(3.5, 0.82, 0.12, 0, 2.55, 0.06), mat(0x2C5DB0)));
  const signGlow = glow(GATE[0], 2.6, GATE[1] + 0.4, 4.2, 0xFF7AC0, false);
  // the three stars over the arch
  const starShape = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.16 : 0.38, a = Math.PI / 2 + i * Math.PI / 5; i ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const STARG = new THREE.ExtrudeGeometry(starShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }).translate(0, 0, -0.04);
  const stars = [-0.95, 0, 0.95].map((x, i) => {
    const m = new THREE.Mesh(STARG, std(0x6A5A3A, { metalness: 0.4, roughness: 0.4 })); m.position.set(GATE[0] + x, 4.05 + (i === 1 ? 0.35 : 0), GATE[1] + 0.05); m.castShadow = true; m.userData.keep = true; scene.add(m);
    return { m, gl: glow(GATE[0] + x, 4.05 + (i === 1 ? 0.35 : 0), GATE[1] + 0.3, 1.5, 0xFFD36B, false), on: false };
  });
  const archBulbs = bulbs(Array.from({ length: 19 }, (_, i) => { const a = Math.PI * i / 18; return V(Math.cos(a) * 1.75, 3.15 + Math.sin(a) * 1.75, 0.16); }), arch, 0.06);

  /* ---------- the box office, with the counter of visitors ---------- */
  const booth = new THREE.Group(); booth.position.set(BOOTH[0], 0, BOOTH[1]); scene.add(booth);
  booth.add(mesh(boxG(1.7, 1.5, 1.5, 0, 0.75, 0), mat(0xFFF1D6)));
  booth.add(mesh(boxG(1.0, 0.6, 0.02, 0, 0.95, 0.76), mat(0x1F2A44, { roughness: 0.2 })));
  booth.add(mesh(boxG(1.2, 0.08, 0.3, 0, 0.62, 0.86), mat(C.wood)));
  booth.add(mesh(new THREE.ConeGeometry(1.45, 0.9, 4, 1).rotateY(Math.PI / 4).translate(0, 1.95, 0), std(0xffffff, { map: stripes('#E5484D', '#FFF6E8', 8) })));
  booth.add(part(SPH, mat(C.gold, { metalness: 0.6, roughness: 0.3 }), [0.12, 0.12, 0.12], [0, 2.45, 0]));
  const counterTex = canvasTex(512, 160, () => {});
  function drawCounter(n, lit) {
    const c = counterTex.image, g = c.getContext('2d'), w = c.width, h = c.height, s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    g.fillStyle = '#14112B'; g.fillRect(0, 0, w, h); g.font = '700 40px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = lit ? '#FFD36B' : '#8A7F95'; g.fillText('VISITANTS', w / 2, 42);
    g.font = '800 92px ui-monospace, Menlo, monospace'; g.fillStyle = lit ? '#FF7A5A' : '#A49AB0'; if (lit) { g.shadowColor = '#FF5A3A'; g.shadowBlur = 20; } g.fillText(s, w / 2, 134); g.shadowBlur = 0;
    counterTex.needsUpdate = true;
  }
  let counterN = 3725, counterLit = false; drawCounter(counterN, false);
  const counterM = mesh(new THREE.PlaneGeometry(1.5, 0.47).translate(0, 1.29, 0.762), new THREE.MeshBasicMaterial({ map: counterTex, toneMapped: false }), { cast: false }); counterM.userData.keep = true; booth.add(counterM);
  const guide = makePerson('guia', { still: true }); guide.position.set(1.15, 0, 0.55); guide.rotation.y = -0.4; guide.scale.setScalar(0.9); booth.add(guide); guide.userData.keep = true;
  const boothBulbs = bulbs([-0.85, -0.42, 0, 0.42, 0.85].flatMap(x => [V(x, 1.52, 0.78)]), booth, 0.05);

  /* ---------- the info board («Caça l'errada») ---------- */
  const chalk = canvasTex(512, 320, () => {});
  function writeBoard(lines = []) {
    const c = chalk.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.fillStyle = '#1F3B33'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`; g.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 3); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((t, i) => { const L = typeof t === 'string' ? { t } : t; g.fillStyle = L.c || '#F4F1E6'; g.font = `800 ${L.s || (i ? 58 : 74)}px "Baloo 2", system-ui, sans-serif`; g.fillText(L.t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * 86); });
    chalk.needsUpdate = true;
  }
  writeBoard(['Tauler del parc']);
  const info = new THREE.Group(); info.position.set(INFO[0], 0, INFO[1]); info.rotation.y = -0.2; scene.add(info);
  info.add(mesh(boxG(1.75, 1.15, 0.06, 0, 1.25, 0), mat(C.wood)));
  info.add(mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshStandardMaterial({ map: chalk, roughness: 0.95 }), { cast: false, at: [0, 1.25, 0.035] }));
  for (const x of [-0.7, 0.7]) info.add(mesh(boxG(0.08, 1.3, 0.08, x, 0.65, 0), mat(C.wood)));

  /* ---------- the measuring board by the roller coaster ---------- */
  const measure = new THREE.Group(); measure.position.set(MEASURE[0], 0, MEASURE[1]); scene.add(measure);
  const rulerTex = canvasTex(128, 512, (g, w, h) => {
    g.fillStyle = '#FFE08A'; g.fillRect(0, 0, w, h);
    const Y = cm => h - cm / 180 * h;
    for (let cm = 0; cm <= 180; cm += 20) { g.fillStyle = (cm / 20) % 2 ? '#F28C28' : '#FFE08A'; g.fillRect(0, Y(cm + 20), 26, Y(cm) - Y(cm + 20)); }
    g.fillStyle = '#2A2540'; g.font = '700 30px system-ui, sans-serif'; g.textAlign = 'right';
    for (let cm = 0; cm <= 180; cm += 5) { g.fillRect(26, Y(cm) - 1.5, cm % 10 ? 18 : 34, 3); if (cm % 20 === 0 && cm) g.fillText(cm, w - 8, Y(cm) + 10); }
  });
  measure.add(mesh(boxG(0.42, 180 * CM, 0.06, 0, 90 * CM, 0), [mat(C.wood), mat(C.wood), mat(C.wood), mat(C.wood), std(0xffffff, { map: rulerTex }), mat(C.wood)]));
  measure.add(part(SPH, mat(0xF5C33B), [0.17, 0.15, 0.12], [0, 180 * CM + 0.1, 0]));
  for (const s of [-1, 1]) measure.add(part(SPH, mat(0x111111), [0.025, 0.025, 0.02], [s * 0.06, 180 * CM + 0.13, 0.1]));
  const minLine = mesh(boxG(0.7, 0.025, 0.1, 0.12, 0, 0.02), new THREE.MeshBasicMaterial({ color: 0xE5484D, toneMapped: false }), { cast: false });
  minLine.position.y = 120 * CM; minLine.userData.keep = true; measure.add(minLine);
  const measureBulbs = bulbs(Array.from({ length: 7 }, (_, i) => V(-0.24, 0.1 + i * 0.16, 0.04)), measure, 0.035);

  /* ---------- the merry-go-round ---------- */
  const carousel = new THREE.Group(); carousel.position.set(CAROUSEL[0], 0, CAROUSEL[1]); scene.add(carousel);
  carousel.add(mesh(new THREE.CylinderGeometry(2.15, 2.25, 0.25, 40).translate(0, 0.125, 0), mat(0x6E3B8E)));
  carousel.add(mesh(new THREE.TorusGeometry(2.2, 0.05, 6, 48).rotateX(Math.PI / 2).translate(0, 0.25, 0), mat(C.gold, { metalness: 0.7, roughness: 0.3 })));
  const spinC = new THREE.Group(); spinC.userData.keep = true; carousel.add(spinC);
  const spinFixed = new THREE.Group(); spinC.add(spinFixed);
  spinFixed.add(mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.06, 40).translate(0, 0.28, 0), mat(0xC9A0DC)));
  spinFixed.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.1, 12).translate(0, 1.35, 0), std(0xffffff, { map: stripes('#F5C33B', '#E5484D', 6) })));
  spinFixed.add(mesh(new THREE.ConeGeometry(2.35, 1.05, 24, 1, true).translate(0, 2.92, 0), std(0xffffff, { map: stripes('#E5484D', '#FFF6E8', 24, 512, 64), side: THREE.DoubleSide })));
  spinFixed.add(mesh(new THREE.CylinderGeometry(2.36, 2.36, 0.24, 24, 1, true).translate(0, 2.3, 0), std(0xffffff, { map: stripes('#F5C33B', '#FFF6E8', 24, 512, 64), side: THREE.DoubleSide })));
  spinFixed.add(part(SPH, mat(C.gold, { metalness: 0.6, roughness: 0.3 }), [0.16, 0.16, 0.16], [0, 3.5, 0]));
  spinFixed.add(mesh(new THREE.ConeGeometry(0.12, 0.3, 3).rotateZ(-Math.PI / 2).translate(0.15, 3.75, 0), mat(C.red)));
  spinFixed.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4).translate(0, 3.7, 0), mat(0x555555)));
  const horses = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, x = Math.cos(a) * 1.45, z = Math.sin(a) * 1.45;
    spinFixed.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6).translate(x, 1.3, z), mat(C.gold, { metalness: 0.7, roughness: 0.3 })));
    const h = new THREE.Group(), body = std(0xffffff, { roughness: 0.45 });
    h.add(part(SPH, body, [0.36, 0.17, 0.15], [0, 0, 0]));
    h.add(part(SPH, body, [0.1, 0.2, 0.09], [0.26, 0.15, 0], [0, 0, -0.5]));
    h.add(part(SPH, body, [0.15, 0.08, 0.08], [0.36, 0.3, 0], [0, 0, -0.2]));
    for (const [lx, lz] of [[0.2, 0.08], [0.2, -0.08], [-0.2, 0.08], [-0.2, -0.08]]) h.add(part(CYL, body, [0.03, 0.22, 0.03], [lx, -0.17, lz], [0, 0, lx > 0 ? -0.5 : 0.5]));
    h.add(part(CONE, mat(0x3A2A1A), [0.05, 0.25, 0.05], [-0.38, 0.0, 0], [0, 0, 1.9]));
    for (const s of [-1, 1]) h.add(part(CONE, body, [0.025, 0.07, 0.02], [0.32, 0.38, s * 0.035]));
    h.add(part(SPH, mat(0x3A2A1A), [0.05, 0.16, 0.03], [0.22, 0.24, 0], [0, 0, -0.5]));
    h.add(part(SPH, mat(0x111111), [0.02, 0.02, 0.02], [0.4, 0.33, 0.06]));
    h.add(part(SPH, mat(0x111111), [0.02, 0.02, 0.02], [0.4, 0.33, -0.06]));
    h.add(part(SPH, mat(C.gold), [0.12, 0.05, 0.16], [0, 0.15, 0]));
    h.position.set(x, 0.95, z); h.rotation.y = -a - Math.PI / 2; h.userData = { keep: true, a, m: body }; spinC.add(h); horses.push(h);
  }
  const carBulbs = bulbs(Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return V(Math.cos(a) * 2.38, 2.2, Math.sin(a) * 2.38); }), spinC, 0.055);
  const HCOL = ['vermell', 'blau', 'groc', 'verd', 'lila', 'taronja', 'vermell', 'blau'];
  function setHorses(cs) { horses.forEach((h, i) => h.userData.m.color.set(COLORS[(cs && cs[i]) || HCOL[i]] || '#FFFFFF')); D.wake(); }
  setHorses(null);

  /* ---------- the big wheel ---------- */
  const wheelG = new THREE.Group(); wheelG.position.set(WHEEL[0], 0, WHEEL[1]); scene.add(wheelG);
  const steelM = std(0xB9BFD0, { metalness: 0.5, roughness: 0.4 }), steel2 = std(0x8C93A8, { metalness: 0.5, roughness: 0.45 });
  for (const z of [-0.5, 0.5]) for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, HUB / Math.cos(0.42), 8), steel2); leg.position.set(s * HUB * Math.tan(0.42) / 2, HUB / 2, z); leg.rotation.z = s * 0.42; leg.castShadow = true; wheelG.add(leg);
  }
  wheelG.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.2, 12).rotateX(Math.PI / 2).translate(0, HUB, 0), steel2));
  wheelG.add(mesh(boxG(2.2, 0.35, 1.3, 0, 0.175, 0.2), mat(C.wood)));
  for (let k = 0; k < 3; k++) wheelG.add(mesh(boxG(0.8, 0.12, 0.35, 0, 0.06 + k * 0.12, 1.0 + k * -0.12), mat(0x6E4426)));
  const rotW = new THREE.Group(); rotW.position.set(0, HUB, 0); rotW.userData.keep = true; wheelG.add(rotW);
  const rimFixed = new THREE.Group(); rotW.add(rimFixed);
  for (const z of [-0.22, 0.22]) {
    rimFixed.add(mesh(new THREE.TorusGeometry(WR, 0.07, 8, 64).translate(0, 0, z), steelM));
    rimFixed.add(mesh(new THREE.TorusGeometry(WR * 0.55, 0.04, 6, 40).translate(0, 0, z), steelM));
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, sp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, WR, 5), steelM); sp.position.set(Math.cos(a) * WR / 2, Math.sin(a) * WR / 2, z); sp.rotation.z = a - Math.PI / 2; rimFixed.add(sp); }
  }
  bake(rimFixed);
  const wheelBulbs = bulbs(Array.from({ length: 48 }, (_, i) => { const a = i / 48 * Math.PI * 2; return V(Math.cos(a) * (WR + 0.08), Math.sin(a) * (WR + 0.08), 0.24); }), rotW, 0.05);
  const cabins = [];
  const CAB_C = [0xE5484D, 0x3D7BE0, 0x38A169, 0xF28C28];
  for (let j = 1; j <= 8; j++) {
    // cabin j at rest is at place −(j − 1): an eighth more round the other way from the clock for each number
    const a = (-90 + 45 * (j - 1)) * Math.PI / 180, cab = new THREE.Group(), inner = new THREE.Group();
    cab.position.set(Math.cos(a) * WR, Math.sin(a) * WR, 0); cab.add(inner); cab.userData.keep = true;
    const cm = mat(CAB_C[j % 4]);
    inner.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 4).translate(0, -0.16, 0), steel2));
    inner.add(mesh(boxG(0.62, 0.38, 0.5, 0, -0.5, 0), cm));
    inner.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, -0.3, 0), cm));
    const num = canvasTex(64, 64, (g, w) => { g.fillStyle = '#FFF8EA'; g.beginPath(); g.arc(w / 2, w / 2, 28, 0, 7); g.fill(); g.fillStyle = '#2A2540'; g.font = '900 44px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(j, w / 2, w / 2 + 3); });
    inner.add(mesh(new THREE.PlaneGeometry(0.26, 0.26).translate(0, -0.5, 0.26), new THREE.MeshBasicMaterial({ map: num, transparent: true }), { cast: false }));
    rotW.add(cab); cabins.push(cab);
  }
  const wheelGlow = glow(WHEEL[0], HUB, WHEEL[1] + 0.4, 2.2, 0xFFD36B, false);

  /* ---------- the roller coaster ---------- */
  const curve = new THREE.CatmullRomCurve3(TRACK, true, 'catmullrom', 0.5), N = 260;
  const frames = Array.from({ length: N }, (_, i) => { const u = i / N, p = curve.getPointAt(u), t = curve.getTangentAt(u), s = new THREE.Vector3().crossVectors(t, V(0, 1, 0)).normalize(); return { p, t, s }; });
  const railM = std(C.red, { metalness: 0.3, roughness: 0.4 }), coasterFixed = new THREE.Group(); scene.add(coasterFixed);
  for (const k of [-1, 1]) { const rail = new THREE.CatmullRomCurve3(frames.map(f => f.p.clone().addScaledVector(f.s, k * 0.17)), true); coasterFixed.add(mesh(new THREE.TubeGeometry(rail, N, 0.045, 6, true), railM)); }
  const sleeperM = mat(0x3A3550);
  frames.forEach((f, i) => {
    if (i % 3 === 0) { const sl = mesh(boxG(0.46, 0.04, 0.09), sleeperM); sl.position.copy(f.p).add(V(0, -0.04, 0)); sl.lookAt(f.p.clone().add(f.t).add(V(0, -0.04, 0))); coasterFixed.add(sl); }
    if (i % 10 === 5 && f.p.y > 0.9) for (const k of [-1, 1]) coasterFixed.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, f.p.y - 0.06, 6).translate(f.p.x + f.s.x * k * 0.17, (f.p.y - 0.06) / 2, f.p.z + f.s.z * k * 0.17), mat(C.white)));
  });
  // the station
  const st = new THREE.Group(); coasterFixed.add(st);
  st.add(mesh(boxG(3.2, 0.62, 1.0, 3.6 + DX, 0.31, 1.25), mat(0xC9B994)));
  for (const x of [2.2, 5.0]) for (const z of [0.25, 1.65]) st.add(mesh(boxG(0.08, 1.5, 0.08, x + DX, 1.37, z), mat(C.white)));
  st.add(mesh(boxG(3.4, 0.08, 1.7, 3.6 + DX, 2.15, 0.95), mat(C.red)));
  st.add(mesh(boxG(3.4, 0.28, 0.04, 3.6 + DX, 2.0, 1.8), std(0xffffff, { map: stripes('#E5484D', '#FFF6E8', 20, 512, 32) })));
  const trackBulbs = bulbs(frames.filter((_, i) => i % 6 === 0).map(f => f.p.clone().addScaledVector(f.s, 0.26).add(V(0, 0.02, 0))), scene, 0.045);
  // the train: four cars that follow the track, the first with a face
  const cars = [], carM = [mat(C.red), mat(0xF5C33B), mat(C.blue), mat(0x38A169)];
  for (let i = 0; i < 4; i++) {
    const car = new THREE.Group(), b = new THREE.Group(); car.add(b);
    b.add(mesh(boxG(0.42, 0.2, 0.52, 0, 0.12, 0), carM[i]));
    b.add(mesh(boxG(0.36, 0.06, 0.16, 0, 0.25, -0.1), mat(0x2A2540)));
    if (!i) { b.add(part(SPH, carM[0], [0.21, 0.13, 0.14], [0, 0.13, 0.27])); for (const s of [-1, 1]) b.add(part(SPH, mat(0xffffff), [0.05, 0.05, 0.03], [s * 0.08, 0.18, 0.39])); }
    for (const s of [-1, 1]) b.add(part(SPH, mat(pickA(SKINS)), [0.085, 0.085, 0.085], [s * 0.1, 0.33, -0.05]));
    bake(b); car.userData.keep = true; scene.add(car); cars.push(car);
  }
  let trainU = 0.02, trainRun = false, laps = 0;
  const STATION = 0.02, GAP = 0.016;
  function placeTrain() {
    cars.forEach((c, i) => { const u = ((trainU - i * GAP) % 1 + 1) % 1, p = curve.getPointAt(u), t = curve.getTangentAt(u); c.position.copy(p).add(V(0, 0.02, 0)); c.lookAt(p.clone().add(t).add(V(0, 0.02, 0))); });
  }
  placeTrain();
  const coasterGlow = glow(9.6 + DX, 5.9, -0.8, 1.8, 0xFF8AC2, false);

  /* ---------- the queue of the roller coaster, with its board of minutes ---------- */
  const queueG = new THREE.Group(); queueG.position.set(QUEUE[0], 0, QUEUE[1]); scene.add(queueG);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) queueG.add(mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.75, 8).translate(-1.1 + k * 0.73, 0.375, -0.55 + r * 0.55), mat(C.gold, { metalness: 0.6, roughness: 0.3 })));
  for (let r = 0; r < 3; r++) queueG.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6).rotateZ(Math.PI / 2).translate(0, 0.62, -0.55 + r * 0.55), mat(C.red)));
  const waitTex = canvasTex(256, 160, () => {});
  function drawWait(m, lit) { const c = waitTex.image, g = c.getContext('2d'); g.fillStyle = '#14112B'; g.fillRect(0, 0, 256, 160); g.textAlign = 'center'; g.fillStyle = lit ? '#FFD36B' : '#8A7F95'; g.font = '700 30px system-ui, sans-serif'; g.fillText('CUA', 128, 44); g.font = '800 64px system-ui, sans-serif'; g.fillStyle = lit ? '#7CF5B0' : '#A49AB0'; g.fillText(`${m} min`, 128, 120); waitTex.needsUpdate = true; }
  drawWait(15, false);
  queueG.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6).translate(1.5, 0.8, -0.8), mat(0x2A2F3A)));
  const waitM = mesh(new THREE.PlaneGeometry(0.7, 0.44).translate(1.5, 1.65, -0.76), new THREE.MeshBasicMaterial({ map: waitTex, toneMapped: false }), { cast: false }); waitM.userData.keep = true; queueG.add(waitM);
  const queuers = [];
  [[-0.8, -0.55], [-0.1, -0.55], [0.6, -0.55], [0.3, 0], [-0.5, 0], [-0.1, 0.55], [0.7, 0.55]].forEach(([x, z], i) => {
    const sp = pickA(['nen', 'nena', 'pare', 'mare', 'avia']), p = makePerson(sp, { still: true, balloon: i === 3 });
    p.position.set(x, 0, z); p.scale.setScalar(sp === 'nen' || sp === 'nena' ? 0.62 : 0.85); p.rotation.y = i < 3 ? -Math.PI / 2 : i < 5 ? Math.PI / 2 : -Math.PI / 2; p.visible = false; p.userData.keep = true; queueG.add(p); queuers.push(p);
  });

  /* ---------- the snack bar ---------- */
  const food = new THREE.Group(); food.position.set(FOOD[0], 0, FOOD[1]); scene.add(food);
  food.add(mesh(boxG(2.0, 1.0, 1.1, 0, 0.5, 0), mat(0xFFF1D6)));
  food.add(mesh(boxG(2.1, 0.08, 0.3, 0, 1.0, 0.62), mat(C.wood)));
  for (const x of [-0.95, 0.95]) food.add(mesh(boxG(0.08, 1.2, 0.08, x, 1.6, 0.5), mat(C.white)));
  const awning = mesh(boxG(2.3, 0.06, 1.3, 0, 2.22, 0.15), std(0xffffff, { map: stripes('#38A169', '#FFF6E8', 10) })); awning.rotation.x = 0.18; food.add(awning);
  const pizzaTex = canvasTex(256, 256, (g, w) => { g.fillStyle = '#C98A4B'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); g.fillStyle = '#F5C66B'; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill(); for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 30 + (i * 37) % 70; g.fillStyle = '#E5484D'; g.beginPath(); g.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 13, 0, 7); g.fill(); } g.strokeStyle = '#B07A3A'; g.lineWidth = 4; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(i * Math.PI / 4) * 112, 128 + Math.sin(i * Math.PI / 4) * 112); g.stroke(); } });
  const pizza = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 32).rotateX(Math.PI / 2).translate(0, 2.95, 0.2), [std(0xC98A4B), std(0xffffff, { map: pizzaTex }), std(0xC98A4B)]); pizza.userData.keep = true; food.add(pizza);
  const foodBulbs = bulbs(Array.from({ length: 9 }, (_, i) => V(-1.05 + i * 0.26, 2.1, 0.82)), food, 0.045);

  /* ---------- the square of shapes ---------- */
  const plaza = new THREE.Group(); plaza.position.set(PLAZA[0], 0, PLAZA[1]); scene.add(plaza);
  const SH = { cub: 0xFF9E7A, prisma: 0x7FC8F8, piramide: 0xF5C33B, triangular: 0x9BD77F, cilindre: 0xB79CF0, con: 0xF59CC6, esfera: 0x7FD8D0 };
  const shapeGeo = {
    cub: boxG(0.8, 0.8, 0.8, 0, 0.4, 0), prisma: boxG(1.1, 0.6, 0.6, 0, 0.3, 0), piramide: new THREE.ConeGeometry(0.62, 0.9, 4).rotateY(Math.PI / 4).translate(0, 0.45, 0),
    triangular: new THREE.CylinderGeometry(0.46, 0.46, 1.0, 3).rotateZ(Math.PI / 2).rotateX(Math.PI / 6).translate(0, 0.23, 0), cilindre: new THREE.CylinderGeometry(0.38, 0.38, 0.9, 28).translate(0, 0.45, 0),
    con: new THREE.ConeGeometry(0.42, 1.0, 28).translate(0, 0.5, 0), esfera: new THREE.SphereGeometry(0.42, 28, 18).translate(0, 0.42, 0)
  };
  const shapes = {};
  Object.keys(SH).forEach((k, i) => {
    const a = Math.PI * 0.75 + i / 7 * Math.PI * 2, m = mesh(shapeGeo[k], std(SH[k], { roughness: 0.4, flatShading: k === 'piramide' || k === 'triangular', emissive: SH[k], emissiveIntensity: 0 }));
    m.position.set(Math.cos(a) * 2.0, 0, Math.sin(a) * 2.0); m.rotation.y = -a; m.userData.keep = true; plaza.add(m); shapes[k] = m;
  });
  plaza.add(mesh(new THREE.CylinderGeometry(0.75, 0.82, 0.16, 32).translate(0, 0.08, 0), mat(0xD9CDB2)));
  const pileG = new THREE.Group(); pileG.position.y = 0.16; pileG.userData.keep = true; plaza.add(pileG);

  /* ---------- the tombola ---------- */
  const tomb = new THREE.Group(); tomb.position.set(TOMBOLA[0], 0, TOMBOLA[1]); scene.add(tomb);
  tomb.add(mesh(boxG(2.3, 1.8, 0.12, 0, 0.9, -0.5), mat(0x6E3B8E)));
  for (const x of [-1.1, 1.1]) tomb.add(mesh(boxG(0.12, 1.8, 1.0, x, 0.9, 0), mat(0x6E3B8E)));
  tomb.add(mesh(boxG(2.3, 0.7, 0.5, 0, 0.35, 0.3), mat(0xFFF1D6)));
  const tRoof = mesh(boxG(2.6, 0.08, 1.4, 0, 1.95, 0.05), std(0xffffff, { map: stripes('#9B6ADB', '#FFF6E8', 12) })); tRoof.rotation.x = 0.12; tomb.add(tRoof);
  for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) { const bear = new THREE.Group(), c = mat([0xC98E63, 0xF59CC6, 0x7FC8F8, 0xF5C33B, 0x9BD77F][(i + k) % 5]); bear.add(part(SPH, c, [0.12, 0.13, 0.1], [0, 0.12, 0])); bear.add(part(SPH, c, [0.09, 0.09, 0.09], [0, 0.3, 0])); for (const s of [-1, 1]) bear.add(part(SPH, c, [0.035, 0.035, 0.03], [s * 0.07, 0.38, 0])); bear.position.set(-0.85 + i * 0.42, 0.7 + k * 0.55, -0.35); tomb.add(bear); if (!k) tomb.add(mesh(boxG(2.1, 0.04, 0.2, 0, 1.24, -0.36), mat(C.wood))); }
  const rouTex = canvasTex(256, 256, (g, w) => { const cs = ['#E5484D', '#3D7BE0', '#F5C33B', '#38A169', '#E5484D', '#3D7BE0', '#F5C33B', '#9B6ADB']; cs.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 124, i * Math.PI / 4, (i + 1) * Math.PI / 4); g.fill(); }); g.fillStyle = '#F2B53A'; g.beginPath(); g.arc(128, 128, 18, 0, 7); g.fill(); });
  const roul = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 32).rotateX(Math.PI / 2), [std(C.gold), std(0xffffff, { map: rouTex }), std(C.gold)]); roul.position.set(0, 2.55, 0.0); roul.userData.keep = true; tomb.add(roul);
  tomb.add(mesh(new THREE.ConeGeometry(0.08, 0.2, 3).rotateZ(Math.PI).translate(0, 3.18, 0.06), mat(C.red)));
  tomb.add(mesh(boxG(0.1, 0.6, 0.06, 0, 2.05, -0.06), mat(C.gold)));
  const tombBulbs = bulbs(Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return V(Math.cos(a) * 0.62, 2.55 + Math.sin(a) * 0.62, 0.06); }), tomb, 0.04);

  /* ---------- the corner of the pond, with its frog ---------- */
  {
    const w = mesh(new THREE.CircleGeometry(1.5, 32).rotateX(-Math.PI / 2).translate(POND[0], 0.02, POND[1]), std(0x2B8FA8, { roughness: 0.15, metalness: 0.1, emissive: 0x0B3F52, emissiveIntensity: 0.35 }), { cast: false }); scene.add(w);
    const IC = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; fixed.add(part(IC, std(0xA69C8A, { flatShading: true, roughness: 0.9 }), [0.2, 0.12, 0.2], [POND[0] + Math.cos(a) * 1.55, 0.05, POND[1] + Math.sin(a) * 1.55])); }
    for (const [dx, dz, r] of [[-0.5, 0.3, 0.32], [0.5, -0.4, 0.26], [0.2, 0.6, 0.22]]) fixed.add(mesh(new THREE.CylinderGeometry(r, r, 0.03, 18).translate(POND[0] + dx, 0.05, POND[1] + dz), mat(0x4FA65A)));
    const frog = new THREE.Group(), fm = mat(0x5DBB63);
    frog.add(part(SPH, fm, [0.17, 0.12, 0.15], [0, 0.11, 0])); for (const s of [-1, 1]) { frog.add(part(SPH, fm, [0.06, 0.06, 0.06], [s * 0.08, 0.22, 0.06])); frog.add(part(SPH, mat(0x111111), [0.025, 0.025, 0.02], [s * 0.08, 0.23, 0.11])); }
    frog.position.set(POND[0] - 0.5, 0.06, POND[1] + 0.3); frog.rotation.y = 0.6; fixed.add(frog);
  }

  bake(fixed); bake(coasterFixed); bake(spinFixed); bake(booth); bake(info); bake(measure); bake(carousel); bake(wheelG); bake(queueG); bake(food); bake(tomb); bake(arch); bake(plaza);

  /* ---------- the visitors that come and go ---------- */
  // where a visitor comes in (door), the way to where it waits (to) and the way out (out), at each place
  const SPOTS = {
    gate: { door: [GATE[0] + 0.3, 0, Z1 + 0.6], to: [[GATE[0] + 0.3, 0, GATE[1]], [BOOTH[0] + 0.2, 0, BOOTH[1] + 1.25]], out: [[-0.6, 0, 5.6], [-1.0, 0, 3.0]], s: 0.9 },
    height: { door: [MEASURE[0] - 1.4, 0, MEASURE[1] + 2.4], to: [[MEASURE[0] + 0.42, 0, MEASURE[1] + 0.12]], out: [[QUEUE[0] - 1.4, 0, QUEUE[1] + 0.9]], s: 1, face: true },
    carousel: { door: [-3.6, 0, 5.4], to: [[CAROUSEL[0] + 2.2, 0, CAROUSEL[1] + 1.7]], out: [[CAROUSEL[0] + 1.2, 0, CAROUSEL[1] + 0.6]], s: 0.9 },
    wheel: { door: [PLAZA[0] - 2.6, 0, PLAZA[1] - 1.0], to: [[WHEEL[0] + 0.3, 0, WHEEL[1] + 1.9]], out: [[WHEEL[0], 0.35, WHEEL[1] + 0.9]], s: 0.9 },
    coaster: { door: [3.2, 0, 4.6], to: [[2.6 + DX, 0, 2.2]], out: [[2.6 + DX, 0.62, 1.2]], s: 0.9 },
    food: { door: [4.2, 0, 7.6], to: [[FOOD[0] - 0.3, 0, FOOD[1] + 1.35]], out: [[5.0, 0, 4.4], [3.0, 0, 4.0]], s: 0.9 },
    shapes: { door: [0.6, 0, 3.4], to: [[PLAZA[0] + 0.5, 0, PLAZA[1] + 1.25]], out: [[PLAZA[0] - 1.6, 0, PLAZA[1] + 2.6]], s: 0.85 },
    queue: { door: [2.8, 0, 5.0], to: [[QUEUE[0] - 1.6, 0, QUEUE[1] + 0.9]], out: [[QUEUE[0] - 1.6, 0, QUEUE[1] - 0.6]], s: 0.9 },
    tombola: { door: [0.4, 0, -3.4], to: [[TOMBOLA[0] + 0.3, 0, TOMBOLA[1] + 1.35]], out: [[0.6, 0, -4.6], [1.2, 0, -2.6]], s: 0.9 }
  };
  SPOTS.top = SPOTS.front = SPOTS.shapes;
  const actors = [];
  let guestNow = null;
  function walk(a, pts, speed) { a.userData.path = pts.map(p => V(...p)); if (speed) a.userData.speed = speed; D.wake(); return new Promise(res => { a.userData.done = res; }); }
  function remove(a) { a.parent?.remove(a); const i = actors.indexOf(a); if (i >= 0) actors.splice(i, 1); }
  function shoo() { const old = guestNow; guestNow = null; if (!old) return; walk(old, old.userData.out, 2.4).then(() => remove(old)); }
  // a visitor of kind sp comes to place where; o.h: a child of that height in cm, by the measuring board
  function guest(sp, where = D.view, o = {}) {
    shoo();
    const S = SPOTS[where]; if (!sp || !S) return Promise.resolve();
    const kid = sp === 'nen' || sp === 'nena', a = makePerson(sp, { balloon: kid && !o.h && Math.random() < 0.4 });
    a.scale.setScalar(o.h ? o.h * CM / 1.15 : kid ? 0.66 : S.s); a.position.set(...S.door); a.userData.out = S.out; scene.add(a); actors.push(a); guestNow = a;
    return walk(a, S.to, 1.9).then(() => { if (guestNow === a) a.userData.face = S.face ? V(a.position.x, 0, a.position.z + 5) : D.camera.position.clone(); });
  }
  function pop(a) { const s = a.scale.x; a.scale.setScalar(0.01); return tween(380, k => a.scale.setScalar(Math.max(0.01, s * (k < 0.7 ? k / 0.7 * 1.15 : 1.15 - (k - 0.7) / 0.3 * 0.15))), easeOut); }
  function hop(a) {
    const b = a.userData.body, wp = new THREE.Vector3(); a.getWorldPosition(wp); wp.y += 1.1 * a.scale.y; sparkle(wp, 9);
    return tween(620, k => {
      let sy = 1, y = 0;
      if (k < 0.18) sy = 1 - 0.25 * (k / 0.18);
      else if (k < 0.62) { const j = (k - 0.18) / 0.44; y = Math.sin(j * Math.PI) * 0.55; sy = 1.18 - 0.18 * j; }
      else if (k < 0.8) sy = 1 - 0.22 * Math.sin((k - 0.62) / 0.18 * Math.PI);
      b.position.y = y; b.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    }, k => k);
  }
  const happy = () => guestNow ? hop(guestNow) : Promise.resolve();
  function sad() { const a = guestNow; if (!a) return; const b = a.userData.body; tween(420, k => { b.rotation.y = Math.sin(k * Math.PI * 4) * 0.35 * (1 - k); }, k => k); }
  function leave() { const a = guestNow; guestNow = null; if (!a) return Promise.resolve(); return walk(a, a.userData.out, 2.2).then(() => remove(a)); }
  function crowd() { setStack(null); setShape(null); }

  /* ---------- what lights up ---------- */
  let running = { carousel: false, wheel: false, coaster: false }, valid = [], wheelHeld = false, show = { queue: false };
  function signTo(v) { drawSign(v > 0.5); signGlow.material.opacity = v * 0.6; archBulbs.set(v > 0.5); }
  // the park as the progress has it: piscina, valid (the projects validated) and stars (the exams passed)
  function state({ piscina = false, valid: vs = [], stars: n = 0 } = {}) {
    valid = vs; const has = i => vs.includes(i);
    signTo(piscina ? 1 : 0);
    lampGlows.forEach(g => { g.material.opacity = piscina ? 1 : 0; }); lampHeads.forEach(h => h.material.color.setHex(piscina ? 0xFFE6A0 : 0x8A8170));
    counterLit = has(0); drawCounter(counterN, counterLit); boothBulbs.set(has(0));
    measureBulbs.set(has(1));
    running.carousel = has(2); carBulbs.set(has(2));
    running.wheel = has(3); wheelBulbs.set(has(3)); wheelGlow.material.opacity = has(3) ? 0.7 : 0;
    running.coaster = has(4); trackBulbs.set(has(4)); coasterGlow.material.opacity = has(4) ? 0.8 : 0;
    foodBulbs.set(has(5));
    for (const k in shapes) shapes[k].material.emissiveIntensity = has(6) ? 0.28 : 0;
    drawWait(15, has(7)); queuers.forEach(p => { p.visible = has(7) || show.queue; });
    tombBulbs.set(has(8));
    stars.forEach((s, i) => { const on = i < n; s.on = on; s.m.material.color.setHex(on ? 0xFFD36B : 0x6A5A3A); s.m.material.emissive.setHex(on ? 0xB07A10 : 0); s.gl.material.opacity = on ? 0.9 : 0; });
    D.wake();
  }
  // the sign lights up, with the flicker of a neon that starts, and fireworks
  function openSign() {
    if (RM) { signTo(1); return Promise.resolve(); }
    const steps = [1, 0, 1, 0, 0, 1, 0.3, 1];
    return steps.reduce((p, v, i) => p.then(() => new Promise(r => setTimeout(() => { signTo(v); D.wake(); r(); }, i ? 90 + (i % 3) * 70 : 0))), Promise.resolve()).then(() => { fireworks(5); });
  }
  // rockets that climb from the park and burst in the sky
  const FW = [0xFF5FA8, 0xFFD36B, 0x7CF5B0, 0x6FE3FF, 0xFF6B5E, 0xC9A0FF];
  function rocket(x, y, z, c) {
    const g = glow(x, 0.5, z, 0.45, c);
    tween(650 + Math.random() * 300, k => { g.position.y = 0.5 + (y - 0.5) * easeOut(k); }, k => k).then(() => {
      g.parent?.remove(g); g.material.dispose(); sparkle(V(x, y, z), 26, c, 0.5, 3.4, 1.3); sparkle(V(x, y, z), 10, 0xFFFFFF, 0.3, 2.2, 1.0);
    });
  }
  function fireworks(n = 4, near = null) {
    if (RM) return;
    const at = near || D.target;
    for (let i = 0; i < n; i++) setTimeout(() => rocket(at.x + (Math.random() - 0.5) * 7, at.y + 4.5 + Math.random() * 2.5, at.z - 1.5 - Math.random() * 2, FW[i % FW.length]), i * 260);
  }
  // star i of the arch lights up, with fireworks over it
  function star(i) {
    const s = stars[i]; if (!s) return Promise.resolve();
    return D.go('sky').then(() => {
      s.on = true; s.m.material.color.setHex(0xFFD36B); s.m.material.emissive.setHex(0xB07A10); s.gl.material.opacity = 0.9;
      sparkle(s.m.position.clone(), 22, 0xFFE08A, 0.55, 2.4, 1.2); fireworks(6, V(GATE[0], 0, GATE[1]));
      return new Promise(r => setTimeout(r, 1800));
    });
  }
  // a part of the park that glows while its project is under the finger on the map
  const hl = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xFFD36B, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const hlEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xFFE08A, transparent: true, opacity: 0, toneMapped: false }));
  scene.add(hl); scene.add(hlEdge);
  const HL = [[BOOTH[0], 1.25, BOOTH[1], 1.9, 2.5, 1.9], [MEASURE[0] + 0.2, 0.75, MEASURE[1], 1.2, 1.5, 0.7], [CAROUSEL[0], 1.8, CAROUSEL[1], 4.8, 3.7, 4.8], [WHEEL[0], 4.1, WHEEL[1], 7.6, 8.2, 2.0],
    [7.0 + DX, 2.9, -3.5, 10.6, 5.9, 9.2], [FOOD[0], 1.6, FOOD[1], 2.4, 3.3, 1.8], [PLAZA[0], 0.6, PLAZA[1], 5.6, 1.3, 5.6], [QUEUE[0], 0.85, QUEUE[1], 3.4, 1.8, 2.0], [TOMBOLA[0], 1.6, TOMBOLA[1], 2.6, 3.3, 1.6]];
  let hlOn = -1;
  function highlight(i) { hlOn = i ?? -1; if (hlOn >= 0) { const [x, y, z, w, h, d] = HL[hlOn]; for (const b of [hl, hlEdge]) { b.position.set(x, y, z); b.scale.set(w + 0.3, h + 0.2, d + 0.3); } } D.wake(); }

  /* ---------- the things a level moves ---------- */
  function counter(n) { counterN = n; drawCounter(n, counterLit || true); D.wake(); }
  // the big wheel to r eighths turned like the clock (from cabin 1 at the bottom); held: the wheel stops turning by itself while a level uses it
  // The wheel eases towards its goal every frame, so touches that come while it still turns add up. A new round (fresh) first moves the
  // wheel a whole number of turns, which looks the same, to the turn nearest its goal
  let wheelA = 0, wheelGoal = 0, wheelWait = [];
  function wheelTo(r, o = {}) {
    const to = -r * Math.PI / 4;
    if (!wheelHeld || o.fresh) wheelA += Math.round((to - wheelA) / (2 * Math.PI)) * 2 * Math.PI;
    wheelHeld = true; wheelGoal = to; D.wake();
    return new Promise(res => wheelWait.push(res));
  }
  function setStack(h) {
    while (pileG.children.length) { const c = pileG.children.pop(); c.geometry?.dispose(); }
    if (!h) return;
    const s = 0.3, mt = [std(0x7FC8F8, { roughness: 0.4 }), std(0x4F9AD0, { roughness: 0.4 })];
    for (let d = 0; d < 3; d++) for (let c = 0; c < 3; c++) for (let z = 0; z < h[d][c]; z++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(s * 0.97, s * 0.97, s * 0.97), mt[(d + c + z) % 2]); m.position.set((c - 1) * s, s / 2 + z * s, (d - 1) * s); m.castShadow = true; m.receiveShadow = true; pileG.add(m);
      pop(m);
    }
    D.wake();
  }
  let shapeOn = null;
  function setShape(k) { shapeOn = shapes[k] ? k : null; if (!shapeOn) for (const s in shapes) shapes[s].position.y = 0; D.wake(); }
  function spin() {
    const from = roul.rotation.z, to = from - (Math.PI * 2 * (3 + Math.random() * 2));
    return tween(RM ? 0 : 2200, k => { roul.rotation.z = from + (to - from) * k; }, easeOut);
  }
  // the ride of a right answer: the carousel turns, the train makes a lap, the roulette spins
  let carouselBurst = 0;
  function ride(set) {
    if (set === 'carousel') { carouselBurst = 3.2; D.wake(); }
    else if (set === 'coaster' && !trainRun) { trainRun = true; laps = 1; D.wake(); }
    else if (set === 'tombola') return spin();
    else if (set === 'food') sparkle(V(FOOD[0], 3.2, FOOD[1] + 0.3), 12, 0xFFE08A);
    return Promise.resolve();
  }
  // the camera flies to the drone over the pile, or in front of it, to show the photo just chosen
  function drone(kind) { return D.go(kind === 'top' ? 'top' : 'front', { dur: 1100 }); }
  function wait(m) { drawWait(m, true); D.wake(); }
  function board(lines) { writeBoard(lines); D.wake(); }

  /* ---------- the loop: what moves ---------- */
  let t0 = 0;
  D.every((dt, now, raw) => {
    let busy = false;
    t0 += dt;
    // the visitors
    for (const a of actors) {
      const u = a.userData; u.t += dt;
      if (u.path.length) {
        busy = true;
        const p = u.path[0], d = p.clone().sub(a.position); d.y = 0;
        const step = u.speed * dt;
        if (d.length() <= step) { a.position.copy(p); u.path.shift(); if (!u.path.length) { const r = u.done; u.done = null; r?.(); } }
        else { d.normalize(); a.position.addScaledVector(d, step); a.position.y += (p.y - a.position.y) * Math.min(1, dt * 6); const want = Math.atan2(d.x, d.z); a.rotation.y += Math.atan2(Math.sin(want - a.rotation.y), Math.cos(want - a.rotation.y)) * Math.min(1, dt * 10); }
        u.body.position.y = Math.abs(Math.cos(u.t * 11)) * 0.04; u.body.rotation.z = Math.sin(u.t * 11) * 0.05;
        if (u.legs) { const w = Math.sin(u.t * 11) * 0.6; u.legs[0].rotation.x = w; u.legs[1].rotation.x = -w; }
      } else if (u.face) {
        const want = Math.atan2(u.face.x - a.position.x, u.face.z - a.position.z), dd = Math.atan2(Math.sin(want - a.rotation.y), Math.cos(want - a.rotation.y));
        a.rotation.y += dd * Math.min(1, dt * 6); if (Math.abs(dd) < 0.01) u.face = null; else busy = true; u.body.rotation.z *= 0.8;
      }
      if (!u.path.length && u.legs && Math.abs(u.legs[0].rotation.x) > 0.01) { for (const l of u.legs) l.rotation.x *= 0.8; busy = true; }
    }
    // the big wheel held by a level goes to its goal
    if (wheelHeld) {
      const d = wheelGoal - wheelA;
      if (Math.abs(d) > 0.002 && !RM) { wheelA += d * Math.min(1, raw * 5); busy = true; }
      else { wheelA = wheelGoal; for (const r of wheelWait.splice(0)) r(); }
      rotW.rotation.z = wheelA;
    }
    if (RM) { for (const c of cabins) c.children[0].rotation.z = -rotW.rotation.z; return busy; }
    const view = D.view;
    // the merry-go-round turns while it is open, or for a moment after a right answer
    if (running.carousel || carouselBurst > 0) {
      carouselBurst = Math.max(0, carouselBurst - dt); spinC.rotation.y += dt * 0.55;
      horses.forEach((h, i) => { h.position.y = 0.95 + Math.sin(t0 * 2.4 + i * 1.3) * 0.18; });
      carBulbs.chase(Math.floor(t0 * 4)); if (view === 'carousel' || carouselBurst > 0) busy = true;
    }
    // the big wheel turns slowly while it is open and no level holds it
    if (running.wheel && !wheelHeld) { wheelA -= dt * 0.12; rotW.rotation.z = wheelA; }
    for (const c of cabins) c.children[0].rotation.z = -rotW.rotation.z;
    // the train: slow up the lift hill, fast down the drops
    if (running.coaster || trainRun) {
      const p = curve.getPointAt(trainU), t = curve.getTangentAt(trainU), sp = t.y > 0.05 ? 1.1 : 1.3 + 2.3 * Math.sqrt(Math.max(0, 5.8 - p.y) / 5.8);
      const before = trainU; trainU = (trainU + sp * dt / curve.getLength() + 1) % 1;
      if (before > trainU) { laps--; if (laps <= 0 && !running.coaster) { trainRun = false; trainU = STATION; } }
      placeTrain(); trackBulbs.chase(Math.floor(t0 * 5));
      if (view === 'coaster' || trainRun) busy = true;
    }
    if (shapeOn) { shapes[shapeOn].position.y = Math.abs(Math.sin(t0 * 4)) * 0.25; busy = true; }
    if (valid.includes(8)) tombBulbs.chase(Math.floor(t0 * 6));
    if (valid.includes(3) && view === 'wheel') busy = true;
    // the guide in the box office breathes and looks about
    guide.userData.body.scale.y = 1 + Math.sin(t0 * 2) * 0.03; guide.rotation.y = Math.sin(t0 * 0.5) * 0.3;
    if (hlOn >= 0) { const p = Math.sin(now * 0.005); hl.material.opacity = 0.22 + p * 0.1; hlEdge.material.opacity = 0.75 + p * 0.25; busy = true; } else hl.material.opacity = hlEdge.material.opacity = 0;
    return busy;
  });

  let base = 'map';
  return { ok: true, layout: D.layout,
    go(v, o) { base = v; if (v !== 'wheel') wheelHeld = false; show.queue = v === 'queue'; queuers.forEach(p => { p.visible = valid.includes(7) || show.queue; }); return D.go(v, o); },
    state, highlight, pause: D.pause, celebrate: (t, at) => D.celebrate(t, at), shake: D.shake, guest, happy, sad, leave, crowd, openSign, star, fireworks,
    counter, wheelTo, horses: setHorses, stack: setStack, shape: setShape, spin, ride, board, drone, wait, get view() { return base; } };
}
