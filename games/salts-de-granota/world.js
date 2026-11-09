// The pond of Salts de Granota in 3D, built on shared/diorama.js: a block of earth that floats in the dusk with a pond on top, cut open on its
// right side so the water is seen from inside. That is the place below zero: the surface is the 0 and the frog dives under it.
// The map is the pond itself: a lily pad for each project, in six groups round the water, one per circle; the flower of a pad opens, with a
// little lantern, when its project is validated, and every exam passed lights a star of a frog in the sky. Around the water: reeds, a
// jetty with a blackboard (the Piscina and «Caça l'errada») and a rock where a heron watches the exams.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL pond() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, SPH, CONE, V } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';
import { num, bar, cub } from './logic.js';

/* ---------- the measures of the pond ---------- */
// the block: x from X0 to X1 (the cut side), z from Z0 (back) to Z1 (front), the grass at 0, the bottom of the pond at BY and of the block at YB
const X0 = -10, X1 = 10, Z0 = -6.5, Z1 = 6.5, BY = -3.8, YB = -6;
// the water: its surface at WY; its shore an ellipse round (CX, CZ) cut by the side x = X1
export const WY = -0.18;
const CX = 3.5, CZ = 0.2, RX = 11, RZ = 4.4, A0 = Math.acos((X1 - CX) / RX);
const wob = a => 1 + 0.035 * Math.sin(3 * a + 0.4) + 0.025 * Math.sin(5 * a + 1.3);
// the shore at angle a (from A0 round the left side to 2π − A0); the two ends are on the cut side
const shore = a => { const k = a <= A0 + 1e-6 || a >= 2 * Math.PI - A0 - 1e-6 ? 1 : wob(a); return [Math.min(X1, CX + RX * Math.cos(a) * k), CZ + RZ * Math.sin(a) * k]; };
const SHORE = Array.from({ length: 73 }, (_, i) => shore(A0 + i / 72 * (2 * Math.PI - 2 * A0)));
const ZA = SHORE[0][1], ZB = SHORE[72][1];

// the lily pad of each project, in the order of PROJECTS: six groups round the water, one per circle
export const PADS = [
  [-5.7, 1.5], [-4.5, 2.3], [-3.2, 2.9],
  [-6.3, -0.5], [-5.3, -1.6], [-3.9, -2.3], [-2.4, -2.8],
  [-0.8, -3.2], [0.7, -3.4], [2.2, -3.5], [3.7, -3.5],
  [4.9, -3.4], [6.2, -3.1], [7.4, -2.8],
  [0.3, 3.7], [1.8, 4.0], [3.3, 4.1], [4.8, 3.95],
  [8.6, 2.5], [8.15, 1.35], [7.95, 0.15], [8.2, -1.05], [8.65, -2.15]
];
const GROUPS = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9, 10], [11, 12, 13], [14, 15, 16, 17], [18, 19, 20, 21, 22]];
// where the frog waits on the map, the end of the jetty, the pad by the heron's rock, the gauge of the water (the number line below zero)
// the size of the frog on the pond
const FROG = 0.55;
const HOME = [1.2, 2.1], JETTY = { x: -1.5, z0: 5.7, z1: 2.75 }, ROCK = [-2.6, -4.7], GAUGE = [X1 - 0.45, 0.35];

const C = {
  grass: 0x6DBB6A, grass2: 0x4F9C58, water: 0x2B8FA8, pad: 0x4FA65A, padDark: 0x2F7F40, petal: 0xFFB3D9, petal2: 0xFFF0F6, heart: 0xF7C64E,
  wood: 0x8B5A3C, wood2: 0x6E4426, stone: 0xB7AE9E, frog: 0x5DBB63, belly: 0xD5F8C4, leaf: [0x4E9F5B, 0x67B565, 0x3F8A4E]
};

/* ---------- the frog ---------- */
// the turn of an eyelid: open (over the top of the eye) and shut (over its front)
const LID = [-1.45, 1.5];
// about one unit tall, looking at +z; lids that blink, a throat that breathes and a tongue
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(C.frog), dark: mat(0x3C9A50), belly: mat(C.belly) };
  g.add(body);
  body.add(part(SPH, k.body, [0.5, 0.36, 0.46], [0, 0.38, 0]));
  body.add(part(SPH, k.belly, [0.34, 0.24, 0.12], [0, 0.32, 0.36]));
  const throat = part(SPH, k.belly, [0.26, 0.12, 0.12], [0, 0.22, 0.34]); body.add(throat);
  // the back legs folded at the sides, the front feet under the chin
  for (const s of [-1, 1]) {
    body.add(part(SPH, k.dark, [0.2, 0.17, 0.34], [s * 0.42, 0.18, -0.05]));
    body.add(part(SPH, k.dark, [0.17, 0.06, 0.26], [s * 0.46, 0.04, 0.18]));
    body.add(part(SPH, k.dark, [0.09, 0.05, 0.13], [s * 0.2, 0.04, 0.38]));
  }
  // eyes on bumps, with a lid each that closes from the top
  const lids = [];
  for (const s of [-1, 1]) {
    body.add(part(SPH, k.body, [0.17, 0.17, 0.17], [s * 0.23, 0.68, 0.16]));
    body.add(part(SPH, mat(0xffffff, { roughness: 0.3 }), [0.12, 0.12, 0.12], [s * 0.24, 0.72, 0.24]));
    body.add(part(SPH, mat(0x06220D, { roughness: 0.15 }), [0.065, 0.075, 0.05], [s * 0.25, 0.73, 0.34]));
    body.add(part(SPH, mat(0xffffff, { roughness: 0.1 }), [0.02, 0.02, 0.02], [s * 0.23, 0.77, 0.38]));
    // a cap a bit bigger than the eye, over its top: it turns forward to close (see LID)
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), k.body);
    lid.position.set(s * 0.24, 0.72, 0.24); lid.rotation.x = LID[0]; lid.userData.keep = true; body.add(lid); lids.push(lid);
    body.add(part(SPH, mat(0xFF8FD0, { roughness: 0.6 }), [0.07, 0.04, 0.02], [s * 0.3, 0.43, 0.37]));
  }
  // the smile
  body.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 6, 20, Math.PI * 0.7).rotateZ(Math.PI + Math.PI * 0.15).translate(0, 0.5, 0.41), mat(0x1F6030)));
  // the tongue: a pink rope from the mouth, stretched along its z
  const tongue = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 1, 8).rotateX(Math.PI / 2).translate(0, 0, 0.5), mat(0xF2668B, { roughness: 0.4 }));
  tongue.position.set(0, 0.46, 0.38); tongue.scale.set(1, 1, 0.001); tongue.visible = false; tongue.userData.keep = true; body.add(tongue);
  throat.userData.keep = true;
  bake(body);
  g.userData = { body, lids, throat, tongue, t: Math.random() * 10, blink: 2 + Math.random() * 3 };
  return g;
}

/* ---------- the world ---------- */
export function pond(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('estany 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, draws: () => false, clear() {}, hear() {}, where() {},
    rest() {}, fly: p, gulp: p, plof: p, shoo() {}, joy: p, bloom: p, padView: () => 'map',
    open: p, judge() {}, star: p, dusk() {}, chalk() {} };
}

function build(canvas) {
  const VIEWS = {
    map: { t: [0.4, -1.2, 0], dir: [0.95, 0.68, 1], R: 11.2 },
    home: { t: [HOME[0], 0.2, HOME[1]], dir: [0.15, 0.5, 1], R: 2.6 },
    gauge: { t: [X1, -1, GAUGE[1]], dir: [1, 0.12, 0.38], R: 4.4, fit: 'h' },
    jetty: { t: [JETTY.x - 0.6, 0.6, 4.4], dir: [0.35, 0.42, 1], R: 3.0 },
    rock: { t: [ROCK[0] + 0.6, 0.5, ROCK[1] + 1.6], dir: [0.25, 0.4, 1], R: 3.0 },
    sky: { t: [-2.6, 5.4, -13], dir: [0.15, -0.05, 1], R: 4.6 },
    rapid: { t: [HOME[0], 0.9, HOME[1]], dir: [0.12, 0.3, 1], R: 3.2 },
    board: { t: [JETTY.x - 1.15, 1.0, 5.3], dir: [0.34, 0.2, 0.94], R: 1.6 }
  };
  // one view per circle: its group of lily pads
  GROUPS.forEach((ps, c) => {
    const xs = ps.map(i => PADS[i][0]), zs = ps.map(i => PADS[i][1]), x = (Math.min(...xs) + Math.max(...xs)) / 2, z = (Math.min(...zs) + Math.max(...zs)) / 2;
    VIEWS['c' + c] = { t: [x, 0, z], dir: [0.1 + x * 0.02, 0.75, 1], R: Math.max(2.2, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) / 2 + 1.1) };
  });
  const D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-16, 18, 16], shadow: { left: -16, right: 16, top: 16, bottom: -12 }, floor: YB - 4, under: [0, YB - 2.5, 0, 34, 26] });
  const { scene, glow, tween } = D;

  /* ---------- the block of earth ---------- */
  const soilTex = canvasTex(256, 512, (g, w, h) => {
    const bands = ['#6E9F4E', '#7A4E2D', '#8E5E36', '#6B4226', '#9A6B43', '#5C3820', '#7E5131'], hs = [10, 70, 60, 80, 70, 110, 120];
    let y = 0; bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, y, w, hs[i]); y += hs[i]; });
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 3 ? '40,25,15' : '200,180,150'},${0.15 + Math.random() * 0.25})`; const r = 1 + Math.random() * 5; g.beginPath(); g.ellipse(Math.random() * w, 14 + Math.random() * (h - 14), r * 1.6, r, 0, 0, 7); g.fill(); }
  });
  soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  const HB = -YB;
  // the earth round the pond: the top of the block without the water, pushed down to the bottom of the pond. Its sides follow the shore
  // inside and the block outside; the texture runs 1 unit of depth to 1/HB of its height
  {
    const s = new THREE.Shape();
    s.moveTo(X0, -Z1); s.lineTo(X1, -Z1); s.lineTo(X1, -ZA);
    for (const [x, z] of SHORE) s.lineTo(x, -z);
    s.lineTo(X1, -ZB); s.lineTo(X1, -Z0); s.lineTo(X0, -Z0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: -BY, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2).translate(0, BY, 0);
    // the walls: u along the way round, v down the depth (top band at the grass)
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 + p.getY(i) / HB);
    const wallTex = soilTex.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(0.12, 1);
    const side = std(0xffffff, { map: wallTex, roughness: 0.95 });
    const top = mesh(g, [std(C.grass, { roughness: 0.9 }), side], { cast: false });
    scene.add(top);
    // under the pond: the rest of the block, its top the mud at the bottom of the water
    const bt = soilTex.clone(); bt.needsUpdate = true; bt.repeat.set(1.5, (BY - YB) / HB); bt.offset.set(0, 0);
    const sideB = std(0xffffff, { map: bt, roughness: 0.95 }), mud = std(0x4A3A26, { roughness: 1 }), dark = std(0x3A2617, { roughness: 1 });
    scene.add(mesh(boxG(X1 - X0, BY - YB, Z1 - Z0, (X0 + X1) / 2, (BY + YB) / 2, (Z0 + Z1) / 2), [sideB, sideB, mud, dark, sideB, sideB], { cast: false }));
  }
  const fixed = new THREE.Group(); scene.add(fixed);

  /* ---------- the water ---------- */
  const shoreShape = new THREE.Shape(); shoreShape.moveTo(X1, -ZA); for (const [x, z] of SHORE) shoreShape.lineTo(x, -z); shoreShape.closePath();
  const waterM = std(C.water, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.86, envMapIntensity: 1.25, emissive: 0x0B3F52, emissiveIntensity: 0.35 });
  const water = mesh(new THREE.ShapeGeometry(shoreShape, 4).rotateX(-Math.PI / 2).translate(0, WY, 0), waterM, { cast: false }); water.renderOrder = 1; scene.add(water);
  // the water seen through the cut side: light at the top, deep at the bottom, with the light that comes down in rays
  const cutTex = canvasTex(256, 256, (g, w, h) => {
    const r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, 'rgba(120,220,240,0.32)'); r.addColorStop(0.5, 'rgba(40,130,170,0.5)'); r.addColorStop(1, 'rgba(14,40,80,0.82)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) { const x = 20 + i * 36 + Math.random() * 10; g.fillStyle = 'rgba(200,250,255,0.07)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 18, 0); g.lineTo(x + 40, h); g.lineTo(x + 8, h); g.fill(); }
  });
  const cut = new THREE.Mesh(new THREE.PlaneGeometry(ZA - ZB, WY - BY).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ map: cutTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  cut.position.set(X1 + 0.004, (WY + BY) / 2, (ZA + ZB) / 2); cut.renderOrder = 3; scene.add(cut);
  // the line of the surface on the glass
  scene.add(mesh(boxG(0.03, 0.035, ZA - ZB, X1 + 0.01, WY, (ZA + ZB) / 2), new THREE.MeshBasicMaterial({ color: 0xCFF6FF, transparent: true, opacity: 0.8 }), { cast: false }));
  // under the water: pebbles, weeds that sway and two fish
  const stoneM = std(C.stone, { roughness: 0.9, flatShading: true }), IC = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 26; i++) { const s = 0.12 + (i * 37 % 10) / 45; fixed.add(part(IC, std([0x8C8478, 0xA69C8A, 0x6F6A60][i % 3], { roughness: 0.9, flatShading: true }), [s, s * 0.55, s], [4 + (i * 53 % 60) / 10, BY + 0.05, ZB + 0.4 + (i * 29 % 64) / 10])); }
  const weeds = [];
  for (let i = 0; i < 9; i++) {
    const h = 1.0 + (i * 7 % 5) * 0.35, w = new THREE.Mesh(new THREE.ConeGeometry(0.09, h, 5).translate(0, h / 2, 0), std(i % 2 ? 0x3F8A4E : 0x5DAA5A, { roughness: 0.8 }));
    w.position.set(6.5 + (i * 31 % 30) / 10, BY, ZB + 0.7 + i * 0.75); w.userData.keep = true; scene.add(w); weeds.push(w);
  }
  const fish = [0xFF9E5E, 0xFFD36B].map((c, i) => {
    const f = new THREE.Group(); f.add(part(SPH, mat(c), [0.22, 0.12, 0.08], [0, 0, 0])); f.add(part(CONE, mat(c), [0.1, 0.16, 0.04], [-0.27, 0, 0], [0, 0, Math.PI / 2]));
    f.add(part(SPH, mat(0x111111), [0.025, 0.025, 0.025], [0.13, 0.03, 0.05])); bake(f); scene.add(f); f.userData = { p: i * 3, y: BY + 1.2 + i * 0.9, z: i ? -1.4 : 1.6 }; return f;
  });

  /* ---------- the shore: stones, reeds, bushes, trees ---------- */
  for (let i = 0; i < 46; i++) {
    const [x, z] = SHORE[Math.min(72, 1 + Math.round(i * 70 / 45))], s = 0.16 + (i * 37 % 10) / 40;
    fixed.add(part(IC, stoneM, [s, s * 0.55, s], [x + (i % 3 - 1) * 0.08, 0.02, z]));
  }
  const reedM = std(0x3E7F47), catM = std(0x6B4226, { roughness: 0.9 });
  // clumps of reeds on the shore, with their brown heads
  for (const [i0, n] of [[4, 6], [14, 5], [30, 7], [44, 5], [58, 6], [66, 4]]) for (let j = 0; j < n; j++) {
    const [x, z] = SHORE[i0 + j], h = 0.9 + (j % 3) * 0.3, dx = Math.sign(CX - x) * -0.15;
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5).translate(x + dx, h / 2, z), reedM));
    if (j % 2 === 0) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8).translate(x + dx, h - 0.05, z), catM));
  }
  const trunkM = std(0x7A5230);
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(C.leaf[(((i + Math.round(x)) % 3) + 3) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-8.6, -5.1, 1.3], [-9.0, 4.9, 1.0], [5.6, -5.4, 1.1], [-5.6, -5.4, 0.9], [8.6, 5.6, 0.8]]) tree(x, z, s);
  const bushM = std(C.grass2, { flatShading: true });
  for (const [x, z, s] of [[-9.1, 0.4, 0.5], [-8.7, -2.6, 0.45], [-6.2, 5.6, 0.5], [3.8, 5.8, 0.45], [6.8, 5.7, 0.5], [1.5, -5.6, 0.5], [-0.2, -5.8, 0.4], [9.2, -5.6, 0.45]])
    fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  for (let i = 0; i < 18; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF][i % 3]), [0.06, 0.05, 0.06], [-9.4 + (i * 47 % 190) / 10, 0.07, i % 2 ? 5.2 + (i % 5) * 0.25 : -5.0 - (i % 4) * 0.3]));

  /* ---------- the jetty and the blackboard ---------- */
  const woodM = std(C.wood, { roughness: 0.7 }), wood2 = std(C.wood2, { roughness: 0.75 });
  for (let i = 0; i < 12; i++) { const z = JETTY.z0 - 0.12 - i * (JETTY.z0 - JETTY.z1) / 12; fixed.add(mesh(boxG(1.3, 0.07, 0.2, JETTY.x + (i % 2 ? 0.02 : -0.02), 0.14, z), i % 3 ? woodM : wood2)); }
  for (const dx of [-0.6, 0.6]) {
    fixed.add(mesh(boxG(0.08, 0.06, JETTY.z0 - JETTY.z1, JETTY.x + dx, 0.08, (JETTY.z0 + JETTY.z1) / 2), wood2));
    for (const z of [JETTY.z1 + 0.1, (JETTY.z0 + JETTY.z1) / 2, JETTY.z0 - 0.2]) fixed.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3 - BY, 8).translate(JETTY.x + dx, (0.3 + BY) / 2, z), wood2));
  }
  // the lantern at the end of the jetty: lit once the Piscina is done
  fixed.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 8).translate(JETTY.x + 0.6, 0.8, JETTY.z1 + 0.1), std(0x2A2F3A, { metalness: 0.5, roughness: 0.4 })));
  const jettyLamp = mesh(new THREE.SphereGeometry(0.11, 12, 8).translate(JETTY.x + 0.6, 1.5, JETTY.z1 + 0.1), new THREE.MeshBasicMaterial({ color: 0x8A8170 }), { cast: false }); jettyLamp.userData.keep = true; scene.add(jettyLamp);
  const jettyGlow = glow(JETTY.x + 0.6, 1.5, JETTY.z1 + 0.1, 1.5, 0xFFC46A, false);
  // the blackboard on its easel, at the root of the jetty
  const chalk = canvasTex(512, 320, () => {});
  const writeBoard = (lines = []) => {
    const c = chalk.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.fillStyle = '#1F3B33'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`; g.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 3); }
    g.fillStyle = '#F4F1E6'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((t, i) => { const L = typeof t === 'string' ? { t } : t; g.fillStyle = L.c || '#F4F1E6'; g.font = `800 ${L.s || (i ? 64 : 84)}px "Baloo 2", system-ui, sans-serif`; g.fillText(L.t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * 96); });
    chalk.needsUpdate = true;
  };
  writeBoard([]);
  const board = new THREE.Group();
  board.add(mesh(boxG(1.75, 1.15, 0.06, 0, 1.25, 0), woodM));
  const face = mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshStandardMaterial({ map: chalk, roughness: 0.95 }), { cast: false, at: [0, 1.25, 0.035] }); board.add(face);
  for (const [x, r] of [[-0.6, 0.12], [0.6, -0.12]]) { const l = mesh(boxG(0.07, 1.9, 0.07, 0, 0.95, 0), woodM); l.position.x = x; l.rotation.z = r; board.add(l); }
  const back = mesh(boxG(0.07, 1.9, 0.07, 0, 0.95, 0), woodM); back.position.z = -0.45; back.rotation.x = -0.25; board.add(back);
  board.position.set(JETTY.x - 1.55, 0, 5.35); board.rotation.y = 0.35; scene.add(board);

  /* ---------- the heron on its rock ---------- */
  const rock = part(new THREE.IcosahedronGeometry(1, 1), std(0x9A9488, { roughness: 0.95, flatShading: true }), [0.95, 0.6, 0.8], [ROCK[0], 0.2, ROCK[1]]);
  fixed.add(rock);
  const heron = new THREE.Group(), grey = mat(0x9DA9B8), white = mat(0xEEF2F6), dark = mat(0x2A2F3A), beakM = mat(0xF2C14E);
  heron.add(part(SPH, grey, [0.32, 0.3, 0.55], [0, 1.15, 0], [0.35, 0, 0]));
  heron.add(part(CONE, dark, [0.18, 0.45, 0.06], [0, 1.08, -0.55], [-1.9, 0, 0]));
  for (const s of [-1, 1]) heron.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 6).translate(s * 0.1, 0.43, -0.02), mat(0xC9A86A)));
  // the neck bends like an S, forward, back and forward again under the head
  const neck = new THREE.Group(); neck.position.set(0, 1.28, 0.32); heron.add(neck);
  const S = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0, 0.2, 0.16), V(0, 0.42, 0.04), V(0, 0.6, -0.02), V(0, 0.74, 0.08)]);
  neck.add(mesh(new THREE.TubeGeometry(S, 24, 0.065, 8, false), white));
  const head = new THREE.Group(); head.position.set(0, 0.78, 0.12); neck.add(head);
  head.add(part(SPH, white, [0.13, 0.12, 0.17], [0, 0, 0]));
  head.add(part(CONE, beakM, [0.045, 0.5, 0.045], [0, -0.02, 0.36], [Math.PI / 2, 0, 0]));
  head.add(part(CONE, dark, [0.03, 0.35, 0.03], [0, 0.05, -0.24], [-Math.PI / 2 - 0.4, 0, 0]));
  for (const s of [-1, 1]) head.add(part(SPH, mat(0x111111), [0.025, 0.025, 0.025], [s * 0.1, 0.03, 0.06]));
  bake(head); neck.userData.own = true;
  heron.position.set(ROCK[0], 0.62, ROCK[1]); heron.rotation.y = 0.15; heron.scale.setScalar(0.95); scene.add(heron);

  /* ---------- the pads of the projects, their flowers and their lanterns ---------- */
  const padM = std(C.pad, { roughness: 0.6, side: THREE.DoubleSide }), veinM = std(C.padDark, { roughness: 0.6 });
  const petalM = std(C.petal, { roughness: 0.5, emissive: 0xFF5FA8, emissiveIntensity: 0.12 }), petal2M = std(C.petal2, { roughness: 0.5 }), heartM = std(C.heart, { emissive: 0xB07A10, emissiveIntensity: 0.4 });
  const budM = std(0xD96FA0, { roughness: 0.6 });
  const PETAL = new THREE.SphereGeometry(1, 10, 6).scale(0.07, 0.03, 0.17).translate(0, 0, 0.15); PETAL.userData.shared = true;
  function flower(s = 1) {
    const f = new THREE.Group(), open = new THREE.Group(), bud = new THREE.Group();
    for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(PETAL, i % 2 ? petal2M : petalM); p.rotation.set(-0.5, i / 8 * Math.PI * 2, 0, 'YXZ'); p.castShadow = true; open.add(p); }
    for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(PETAL, petalM); p.scale.setScalar(0.7); p.rotation.set(-1.0, (i + 0.5) / 6 * Math.PI * 2, 0, 'YXZ'); open.add(p); }
    open.add(part(SPH, heartM, [0.06, 0.04, 0.06], [0, 0.03, 0]));
    bud.add(part(SPH, budM, [0.06, 0.11, 0.06], [0, 0.08, 0])); bud.add(part(CONE, mat(C.padDark), [0.06, 0.07, 0.06], [0, 0.0, 0]));
    // the petals of a flower and its bud, merged: a few meshes each, so the pond stays light for a tablet
    bake(open); bake(bud);
    open.position.y = 0.03; open.scale.setScalar(0.001); f.add(open); f.add(bud); f.scale.setScalar(s);
    f.userData = { open, bud, k: 0 };
    return f;
  }
  function lilyPad(r) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CircleGeometry(r, 28, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2), padM, { cast: false }));
    g.add(mesh(merge4(r), veinM, { cast: false }));
    return g;
  }
  // the veins of a pad: thin lines from the middle
  function merge4(r) {
    const gs = [];
    for (let i = 0; i < 7; i++) { const a = 0.6 + i * 0.8; gs.push(new THREE.BoxGeometry(r * 0.8, 0.004, 0.02).translate(r * 0.42, 0.004, 0).rotateY(-a)); }
    return mergeAll(gs);
  }
  const pads = PADS.map(([x, z], i) => {
    const g = lilyPad(0.46), f = flower(1.25);
    g.position.set(x, WY + 0.02, z); g.rotation.y = i * 1.7; g.userData.keep = true;
    f.position.set(x + 0.04, WY + 0.03, z - 0.02);
    const lamp = mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFE6A0, toneMapped: false }), { cast: false });
    lamp.position.set(x - 0.22, WY + 0.5, z + 0.12); lamp.visible = false; lamp.userData.keep = true;
    const gl = glow(x - 0.22, WY + 0.5, z + 0.12, 0.9, 0xFFC46A, false);
    const string = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.42).translate(x - 0.22, WY + 0.27, z + 0.12), mat(0x3A2A20), { cast: false }); string.visible = false; string.userData.keep = true;
    scene.add(g); scene.add(f); scene.add(lamp); scene.add(string);
    return { g, f, lamp, gl, string, open: false, bob: Math.random() * 6 };
  });
  // the pad the frog waits on, a bit bigger
  const homePad = lilyPad(0.62); homePad.position.set(HOME[0], WY + 0.02, HOME[1]); homePad.rotation.y = 2.2; homePad.userData.keep = true; scene.add(homePad);

  /* ---------- the sky: the moon and the frog of six stars ---------- */
  const moon = mesh(new THREE.SphereGeometry(1.6, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-12, 5.5, -15] });
  scene.add(moon); glow(-12, 5.5, -15, 8, 0xFFE9B8, true).material.opacity = 0.55;
  // a frog seen from above: two eyes, two front legs and two back legs, round its middle
  const SKY = [[-1.0, 1.7], [1.0, 1.7], [-2.0, 0.2], [2.0, 0.2], [-2.6, -1.8], [2.6, -1.8]].map(([x, y]) => V(-2.6 + x * 1.15, 5.6 + y * 1.15, -13));
  const starShape = (() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.42; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return s; })();
  const stars = SKY.map(p => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(starShape), new THREE.MeshBasicMaterial({ color: 0x4A4870, toneMapped: false, transparent: true }));
    m.position.copy(p); scene.add(m); const gl = glow(p.x, p.y, p.z + 0.1, 3.2, 0xFFD36B, false); return { m, gl, on: false };
  });
  const EDGES = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]];
  const lines = EDGES.map(([a, b]) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([SKY[a], SKY[b]]), new THREE.LineBasicMaterial({ color: 0xFFE9A8, transparent: true, opacity: 0.08, toneMapped: false }));
    scene.add(l); return { l, a, b };
  });

  /* ---------- the frog ---------- */
  const frog = makeFrog(); frog.scale.setScalar(FROG); frog.position.set(HOME[0], WY + 0.03, HOME[1]); frog.rotation.y = 0.2; scene.add(frog);

  /* ---------- fireflies ---------- */
  const NFL = RM ? 0 : 22, flies = Array.from({ length: NFL }, (_, i) => ({ p: Math.random() * 7, x: -7 + Math.random() * 15, z: -3.5 + Math.random() * 7.5, y: 0.5 + Math.random() * 1.2 }));
  const flyPos = new Float32Array(NFL * 3), flyCol = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3)); flyGeo.setAttribute('color', new THREE.BufferAttribute(flyCol, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: glowTex2(), size: 0.42, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- everything that never moves, baked into a few meshes ---------- */
  bake(fixed); bake(board);

  /* ---------- the map: what is lit, and what is under the finger ---------- */
  // a ring of light round a pad
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xFFE08A, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  const ringGlow = glow(0, -50, 0, 2.4, 0xFFD36B, false);
  scene.add(ring);
  let hlOn = -1;
  function highlight(i) {
    hlOn = Number.isInteger(i) && PADS[i] ? i : -1;
    if (hlOn >= 0) { const [x, z] = PADS[hlOn]; ring.position.set(x, WY + 0.06, z); ringGlow.position.set(x, WY + 0.4, z); }
    D.wake();
  }
  // a flower opens (or closes): k from 0 (bud) to 1 (open)
  function setFlower(P, k) {
    const f = P.f.userData; f.k = k;
    f.open.scale.setScalar(Math.max(0.001, k)); f.open.rotation.y = (1 - k) * 1.5;
    f.bud.scale.setScalar(Math.max(0.001, 1 - k));
    P.lamp.visible = P.string.visible = k > 0.6; P.gl.material.opacity = k > 0.6 ? 0.85 : 0;
  }
  let piscinaOn = false;
  // the pond as the progress has it: piscina, valid (the projects validated) and stars (the exams passed)
  function state({ piscina = false, valid = [], stars: n = 0 } = {}) {
    piscinaOn = piscina;
    pads.forEach((P, i) => { P.open = valid.includes(i); setFlower(P, P.open ? 1 : 0); });
    stars.forEach((s, i) => { s.on = i < n; s.m.material.color.setHex(s.on ? 0xFFD36B : 0x4A4870); s.gl.material.opacity = s.on ? 0.75 : 0; });
    lines.forEach(L => { L.l.material.opacity = stars[L.a].on && stars[L.b].on ? 0.55 : 0.08; });
    jettyLamp.material.color.setHex(piscina ? 0xFFE6A0 : 0x8A8170); jettyGlow.material.opacity = piscina ? 1 : 0;
    // before the Piscina the pond is shut: no fireflies, a dimmer dusk
    flyPts.visible = piscina; flyPts.material.opacity = 1; D.hemi.intensity = piscina ? 0.7 : 0.55;
    canvas.dataset.flors = pads.filter(P => P.open).length; canvas.dataset.estrelles = stars.filter(s => s.on).length;
    D.wake();
  }

  /* ---------- the frog moves ---------- */
  // sq: how much the frog is stretched by a leap (0 sitting, 1 in the air); face: where it turns to, slowly
  frog.userData.sq = 0; frog.userData.face = 0.2;
  const facing = (x, z) => Math.atan2(D.camera.position.x - x, D.camera.position.z - z);
  // the frog leaps from where it is to b: an arc h high, in dur ms; it turns to where it goes and, landed, to the camera
  function leapTo(b, o = {}) {
    const a = frog.position.clone(), d = a.distanceTo(b), h = o.h ?? Math.min(2.4, 0.35 + d * 0.22), dur = o.dur ?? Math.min(950, 360 + d * 55);
    if (d < 0.01) return Promise.resolve();
    frog.userData.face = Math.atan2(b.x - a.x, b.z - a.z);
    if (Math.abs(b.x - a.x) + Math.abs(b.z - a.z) < 0.05) frog.userData.face = facing(b.x, b.z);
    return tween(dur, k => { frog.position.lerpVectors(a, b, k); frog.position.y += Math.sin(k * Math.PI) * h; frog.userData.sq = Math.sin(k * Math.PI); }, k => k)
      .then(() => { frog.userData.sq = 0; if (o.turn !== false) frog.userData.face = facing(b.x, b.z); });
  }
  const homeAt = () => V(HOME[0], WY + 0.03, HOME[1]);
  // a ring that spreads on the water where something falls in, and the drops it throws
  const RIPPLE = new THREE.RingGeometry(0.11, 0.16, 36).rotateX(-Math.PI / 2); RIPPLE.userData.shared = true;
  // bubbles that rise from under the water; loud: with the blips of their sound
  const bubbles = (at, n = 8, loud = n > 4) => {
    D.sparkle(at.clone().add(V(0, 0.3, 0)), n, 0xDFF8FF, 0.15, 0.55, -2.2);
    if (loud) for (let i = 0; i < 4; i++) sound.tone(1100 + Math.random() * 700, i * 0.07, 0.05, 0.02);
  };
  function splash(at, big = 1) {
    if (RM) return;
    const m = new THREE.Mesh(RIPPLE, new THREE.MeshBasicMaterial({ color: 0xCFF6FF, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
    m.position.set(at.x, Math.max(at.y, WY) + 0.02, at.z); scene.add(m);
    tween(750, k => { m.scale.setScalar(1 + k * 5 * big); m.material.opacity = 0.85 * (1 - k); }, k => k).then(() => { scene.remove(m); m.material.dispose(); });
    D.sparkle(V(at.x, Math.max(at.y, WY) + 0.05, at.z), Math.round(8 * big), 0xCFF6FF, 0.2, 1.3 * big, 7);
  }

  /* ---------- what the frog does: one thing after another ---------- */
  // Its actions (a leap to its place, a catch, a «plof») wait for the one before, and the pictures wait for them too, so two things
  // never move the frog at once. An action that fails says so in the console and lets the next one go.
  let acts = Promise.resolve();
  let actN = 0;
  const act = f => { actN++; return (acts = acts.then(f).catch(e => console.error('estany:', e)).finally(() => { actN--; })); };
  const pause = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));
  // where the frog waits when there is no picture: its pad on the map, the pad of the project, the jetty, the pad by the heron's rock
  const EXAMPAD = [-1.25, -2.15];
  const examPad = lilyPad(0.5); examPad.position.set(EXAMPAD[0], WY + 0.02, EXAMPAD[1]); examPad.rotation.y = 0.7; scene.add(examPad);
  const SPOTS = { board: () => V(JETTY.x - 0.45, 0.18, 5.1), home: homeAt, jetty: () => V(JETTY.x, 0.18, JETTY.z1 + 0.4), rock: () => V(EXAMPAD[0], WY + 0.03, EXAMPAD[1]) };
  let restAt = homeAt();
  function rest(w) {
    restAt = Number.isInteger(w) && PADS[w] ? V(PADS[w][0], WY + 0.03, PADS[w][1]) : (SPOTS[w] || SPOTS.home)();
    if (!pic) act(() => leapTo(restAt));
  }

  /* ---------- the guest of each question: a fly ---------- */
  const WING = new THREE.CircleGeometry(0.1, 12).scale(1, 0.5, 1); WING.userData.shared = true;
  const wingM = new THREE.MeshBasicMaterial({ color: 0xDFF8FF, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
  let fly = null;
  const flying = [];
  // where a fly hovers: by the frog, a bit up and towards the camera
  const hoverAt = (t = 0) => { const k = frog.scale.x / FROG, c = D.camera.position.clone().sub(frog.position).setY(0).normalize(); return frog.position.clone().add(V(c.x * 0.45 * k + 0.35 * k, 0.95 * k + Math.sin(t * 2.3) * 0.08, c.z * 0.45 * k)).add(V(Math.sin(t * 1.7) * 0.1, 0, Math.cos(t * 1.3) * 0.08)); };
  // a fly comes from far and hovers by the frog; the promise says when it is there
  function newFly() {
    if (fly) shoo();
    const g = new THREE.Group();
    g.add(part(SPH, mat(0x2A1C00), [0.06, 0.055, 0.06], [0.07, 0.01, 0]));
    g.add(part(SPH, mat(0xF7C64E, { emissive: 0x7A5A00, emissiveIntensity: 0.4 }), [0.1, 0.07, 0.075], [-0.04, 0, 0]));
    const wings = [-1, 1].map(s => { const w = new THREE.Mesh(WING, wingM); w.position.set(-0.03, 0.06, s * 0.06); g.add(w); return w; });
    glow(0, 0, 0, 0.55, 0xFFE08A, true, g);
    const from = frog.position.clone().add(V((Math.random() < 0.5 ? -1 : 1) * 4, 3, -1.5));
    g.position.copy(from); g.scale.setScalar(1.4); scene.add(g);
    const F = { g, wings, from, k: 0, t: Math.random() * 9, mode: 'come' }; flying.push(F);
    F.arrived = new Promise(r => { F.done = r; });
    if (RM) { F.mode = 'hover'; F.done(); }
    fly = F; D.wake();
    return F.arrived;
  }
  // the fly goes away, uncaught
  function shoo() { const F = fly; fly = null; if (!F) return; F.mode = 'go'; F.k = 0; F.from = F.g.position.clone(); F.away = F.from.clone().add(V((Math.random() - 0.5) * 6, 3.5, -3)); F.done(); D.wake(); }
  function gone(F) { scene.remove(F.g); F.g.traverse(x => { if (x.isSprite) x.material.dispose(); }); const i = flying.indexOf(F); if (i >= 0) flying.splice(i, 1); }
  // The frog catches the fly with its tongue, from where it is; with leap it jumps up to it first (a level done in the head), and with big the
  // jump is higher and the camera shakes (five right in a row)
  function gulp(o = {}) {
    const F = fly; if (!F) return Promise.resolve();
    fly = null;
    return act(async () => {
      await Promise.race([F.arrived, pause(1200)]);
      const u = frog.userData, start = frog.position.clone(), up = o.big ? 1.5 : o.leap ? 0.75 : 0;
      F.mode = 'held';
      u.face = Math.atan2(F.g.position.x - start.x, F.g.position.z - start.z);
      if (up) { sound.tone(392, 0, 0.12, 0.06); await tween(RM ? 0 : 380, k => { frog.position.y = start.y + up * Math.sin(k * Math.PI / 2); u.sq = 1 - k; }, k => k); }
      // the tongue to the fly, and back with it
      const tg = u.tongue, base = new THREE.Vector3();
      tg.visible = true; tg.lookAt(F.g.position); tg.getWorldPosition(base);
      const tip = F.g.position.clone(), len = base.distanceTo(tip) / (frog.scale.x * u.body.scale.z);
      await tween(RM ? 0 : 130, k => { tg.scale.z = Math.max(0.001, len * k); }, k => k);
      sound.tone(620, 0, 0.05, 0.05); sound.tone(940, 0.04, 0.07, 0.05);
      await tween(RM ? 0 : 170, k => { tg.scale.z = Math.max(0.001, len * (1 - k)); F.g.position.lerpVectors(tip, base, k); F.g.scale.setScalar(1.4 * (1 - k * 0.8)); }, k => k);
      tg.visible = false; tg.scale.z = 0.001; gone(F); u.gulp = 1;
      if (up) { await tween(RM ? 0 : 360, k => { frog.position.y = start.y + up * Math.cos(k * Math.PI / 2); u.sq = k < 0.7 ? 0.4 : 0; }, k => k); frog.position.copy(start); u.sq = 0; splash(start, o.big ? 1.4 : 1); }
      if (o.big) D.shake(0.12);
      u.face = facing(start.x, start.z);
    });
  }
  // a wrong answer: the frog falls in the water with a «plof» and climbs back; under the water it only shakes its head
  function plof() {
    return act(async () => {
      const at = frog.position.clone(), u = frog.userData;
      if (at.y < WY - 0.1) { await tween(RM ? 0 : 420, k => { frog.rotation.z = Math.sin(k * Math.PI * 4) * 0.25 * (1 - k); }, k => k); frog.rotation.z = 0; return; }
      sound.tone(440, 0, 0.06, 0.1); sound.tone(190, 0.05, 0.18, 0.12, 'triangle');
      splash(at, 1.2);
      await tween(RM ? 0 : 320, k => { frog.position.y = at.y - 0.5 * k * k; }, k => k);
      bubbles(frog.position, 6);
      await pause(260);
      await tween(RM ? 0 : 420, k => { frog.position.y = at.y - 0.5 * (1 - k) + Math.sin(k * Math.PI) * 0.35; u.sq = Math.sin(k * Math.PI) * 0.6; }, k => k);
      frog.position.copy(at); u.sq = 0; splash(at, 0.6);
    });
  }
  // the frog hops for joy, twice, where it is
  function joy() {
    return act(async () => {
      const at = frog.position.clone(), u = frog.userData;
      for (const h of [0.6, 0.9]) { await tween(RM ? 0 : 420, k => { frog.position.y = at.y + Math.sin(k * Math.PI) * h; u.sq = Math.sin(k * Math.PI); }, k => k); splash(at, 0.7); }
      frog.position.copy(at); u.sq = 0;
    });
  }
  // a project validated: the camera goes to its group of pads and its flower opens there, with its lantern
  function bloom(i) {
    const P = pads[i]; if (!P) return Promise.resolve();
    const c = GROUPS.findIndex(g => g.includes(i));
    return D.go('c' + c).then(async () => {
      const at = P.f.position.clone();
      sound.tone(523, 0, 0.3, 0.08); sound.tone(784, 0.15, 0.4, 0.08);
      await tween(RM ? 0 : 1100, k => setFlower(P, k), k => 1 - (1 - k) ** 3);
      P.open = true; canvas.dataset.flors = pads.filter(q => q.open).length;
      D.sparkle(at.clone().add(V(0, 0.4, 0)), 18, 0xFFD36B, 0.4, 2);
      D.celebrate(3, at.clone().add(V(0, 1.2, 0)));
    });
  }

  /* ---------- the places of the modes ---------- */
  // The Piscina: the pond is shut until it is done (no fireflies, a dimmer dusk); open() lights it before the child's eyes
  function open() {
    piscinaOn = true;
    jettyLamp.material.color.setHex(0xFFE6A0);
    return D.go('map').then(async () => {
      sound.tone(523, 0, 0.3, 0.07); sound.tone(659, 0.12, 0.3, 0.07); sound.tone(784, 0.24, 0.5, 0.08);
      flyPts.visible = true;
      await tween(RM ? 0 : 1600, k => { jettyGlow.material.opacity = k; flyPts.material.opacity = k; D.hemi.intensity = 0.55 + 0.15 * k; }, k => k);
      D.celebrate(3, V(0, 2, 0)); joy();
    });
  }
  // The exam: the heron on its rock judges each answer; it nods to a right one and shakes its head at a wrong one
  let heronDo = null;
  function judge(ok) {
    heronDo = { ok, t: 0 }; D.wake();
  }
  // a star of the frog in the sky comes on: the camera goes up to it and back
  function star(i) {
    const s = stars[i]; if (!s) return Promise.resolve();
    const back = D.view;
    return D.go('sky').then(async () => {
      sound.tone(988, 0, 0.5, 0.07); sound.tone(1319, 0.2, 0.6, 0.06);
      await tween(RM ? 0 : 900, k => { s.m.material.color.setHex(0x4A4870).lerp(new THREE.Color(0xFFD36B), k); s.gl.material.opacity = 0.75 * k; s.m.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.8); }, k => k);
      s.on = true; lines.forEach(L => { L.l.material.opacity = stars[L.a].on && stars[L.b].on ? 0.55 : 0.08; });
      canvas.dataset.estrelles = stars.filter(q => q.on).length;
      D.sparkle(s.m.position.clone(), 16, 0xFFD36B, 0.6, 2.5, 1);
      await pause(1100);
      if (back) D.go(back);
    });
  }
  // The lightning round: the sun sets while the minute lasts (k from 0 to 1), with a swarm of flies about the frog; dusk(null) gives the
  // evening back
  const sunBall = mesh(new THREE.SphereGeometry(2.4, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFC27A, toneMapped: false, fog: false }), { cast: false, at: [2, 5, -30] });
  sunBall.visible = false; scene.add(sunBall);
  const sunGlow = glow(2, 5, -29.5, 16, 0xFF9E5E, false);
  const SWARM = 16, swarm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2A1C00 }), SWARM);
  swarm.visible = false; swarm.frustumCulled = false; scene.add(swarm);
  const swarmP = Array.from({ length: SWARM }, () => ({ a: Math.random() * 7, b: Math.random() * 7, r: 0.5 + Math.random() * 0.9, h: 0.6 + Math.random() * 0.9 }));
  const LIGHT = { sun: D.sun.intensity, hemi: 0.7, sunC: D.sun.color.clone() };
  function dusk(k) {
    if (k == null) {
      sunBall.visible = false; sunGlow.material.opacity = 0; swarm.visible = false;
      D.sun.intensity = LIGHT.sun; D.sun.color.copy(LIGHT.sunC); D.hemi.intensity = piscinaOn ? LIGHT.hemi : 0.55; D.wake(); return;
    }
    k = Math.max(0, Math.min(1, k));
    sunBall.visible = true; swarm.visible = true;
    const y = 5.5 - 10 * k;
    sunBall.position.y = y; sunGlow.position.y = y; sunGlow.material.opacity = 0.9 * (1 - k * 0.7);
    sunBall.material.color.setHex(0xFFC27A).lerp(new THREE.Color(0xE8463C), k);
    D.sun.intensity = LIGHT.sun * (1 - 0.65 * k); D.sun.color.copy(LIGHT.sunC).lerp(new THREE.Color(0xFF6A4A), k);
    D.hemi.intensity = LIGHT.hemi * (1 - 0.45 * k);
    D.wake();
  }
  // «Caça l'errada»: what the sheet says is written in chalk on the blackboard of the jetty
  const writeChalk = lines => { writeBoard(lines); D.wake(); };

  /* ---------- the pictures of the tricks ---------- */
  // The same calls as the pictures of viz.js: { n, jump(i, mask), reveal(), reset(), hand(h) }. Each draws on the pond and flies the camera
  // to it; host is the place in the panel for the line under the picture (the hops added up) and for the keyboard of hand().
  // A new picture takes the place of the one before; clear() takes it away and gives the camera back to the view main.js asked for last.
  let sound = { tone() {}, noteAt: () => 440 };
  let pic = null, base = 'map';
  const LINE = { x0: -4.6, x1: 6.6, z: 0.75 }, GX = X1 - 0.3, GZ = GAUGE[1];
  const ink = { line: '#EAF8F4', q: '#F7C64E', fwd: '#6FE3FF', back: '#F7C64E', zero: '#B7A8FF' };
  const tagS = (text, color, h = 0.46) => label(text, { ink: color, edge: 'rgba(4,19,28,0.9)', h });
  const LM = new Map(), lineM = c => { if (!LM.has(c)) LM.set(c, new THREE.MeshBasicMaterial({ color: c, toneMapped: false })); return LM.get(c); };
  // takes away a thing of a picture and gives back what it holds, but for the shapes many things share
  function drop(o) { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); }); }
  // leap: the frog goes back to its place (not when another picture comes at once)
  function clear(leap = true) {
    if (!pic) return;
    pic.alive = false; drop(pic.g); pic.cleanup?.(); pic = null; aim = null;
    canvas.dataset.granota = ''; canvas.dataset.ocupat = '0'; canvas.dataset.dibuix = '';
    frog.userData.sq = 0; frog.scale.setScalar(FROG);
    if (leap) { act(() => leapTo(restAt)); if (D.view !== base) D.go(base); }
  }
  // a new picture: its group on the pond, its queue of moves (each waits for the one before) and whether it is still the one on show
  function newPic(host) {
    clear(false);
    const P = { g: new THREE.Group(), alive: true, host, busy: 0 };
    scene.add(P.g); pic = P;
    P.on = () => pic === P && P.alive;
    P.queue = Promise.resolve();
    P.later = f => (P.queue = P.queue.then(() => acts).then(async () => { if (!P.on()) return; P.busy++; canvas.dataset.ocupat = '1'; try { return await f(); } finally { P.busy--; if (P.on()) canvas.dataset.ocupat = P.busy ? '1' : '0'; } }));
    return P;
  }

  /* ---------- the number line: lily pads on the water, or the gauge of the cut side below zero ---------- */
  // The way of the frog from p.from (or p.a) through p.jumps. A pad where it starts and one for each ten, with their numbers; small pads for
  // the units when the stretch is short. Where the frog lands a pad comes up with its number, "?" when it is the result and mask is on.
  // When the numbers go below zero the line is the gauge on the cut side of the pond: the surface is the 0, and the frog dives under it.
  function lineViz(host, p) {
    const P = newPic(host), g = P.g;
    const pts = [p.from ?? p.a, ...p.jumps.map(j => j.to)], min = Math.min(...pts), max = Math.max(...pts), low = min < 0;
    const m = Math.max(1, Math.round((max - min) * 0.05)), lo = min - m, hi = max + m, wide = hi - lo;
    const every = wide <= 46 ? 1 : wide <= 120 ? 5 : 10, named = wide <= 24 ? 5 : wide <= 70 ? 10 : 20;
    // a narrow screen gets a shorter line, so its numbers have more room
    const len = D.size().w < 640 ? 8.6 : LINE.x1 - LINE.x0, x0 = (LINE.x0 + LINE.x1 - len) / 2, S = Math.min(0.42, 3.2 / Math.max(1, -lo), hi > 0 ? 4.4 / hi : 9);
    const at3 = low ? n => V(GX, WY + n * S, GZ) : n => V(x0 + (n - lo) / wide * len, WY + 0.035, LINE.z);
    // where the number of a place goes: in front of the line, or on the right of the gauge as the camera sees it
    const tagAt = (n, up = 0) => low ? at3(n).add(V(0.32, 0.02 + up, -0.5 * big)) : at3(n).add(V(0, 0.02 + up, 0.55 * big));
    const view = low ? { t: [X1 - 0.2, WY + (lo + hi) / 2 * S, GZ], dir: [1, 0.12, 0.34], R: wide * S / 2 + 0.9, fit: 'h' }
      : { t: [(LINE.x0 + LINE.x1) / 2, 0.1, LINE.z + 0.35], dir: [0, 1.05, 1], R: len / 2 + 0.75, fit: 'w' };
    D.go(view);
    // on a small screen the numbers and the frog grow, so the label of a number is never much less than 28 pixels tall
    const big = Math.max(1, Math.min(2.4, 28 / (0.42 * D.ppu(view)))), tag = (t, c, h) => tagS(t, c, h * big);
    frog.scale.setScalar(FROG * Math.min(big, 1.45));
    const flat = (r, c) => mesh(new THREE.CircleGeometry(r, 24, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2), mat(c, { roughness: 0.6 }), { cast: false });
    const ledge = (r, n) => mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.06, 20), mat(n < 0 ? 0x6F7F78 : n === 0 ? 0x4FA65A : C.wood, { roughness: 0.8 }), { cast: false });
    // a place of the line: a pad on the water, a ledge on the gauge
    const spot = (n, r) => { const o = low ? ledge(r * 0.85, n) : flat(r, n % 10 === 0 ? C.pad : 0x5FB86A); o.position.copy(at3(n)).add(V(0, low ? -0.03 : -0.02, 0)); return o; };
    const named$ = [];
    if (!low) {
      // the strip of light water the line runs on
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(len + 1.0, 0.62 * big).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9FEFFF, transparent: true, opacity: 0.16, depthWrite: false }));
      strip.position.set((LINE.x0 + LINE.x1) / 2, WY + 0.008, LINE.z); g.add(strip);
    } else {
      // the gauge: a pole of red and white, a mark for each unit, the 0 at the surface and «sota zero» under it
      const tex = canvasTex(32, 256, (c, w, h) => { const k = Math.min(64, wide); for (let i = 0; i < k; i++) { c.fillStyle = i % 2 ? '#F4F1E6' : '#D9474F'; c.fillRect(0, h - (i + 1) * h / k, w, h / k + 1); } });
      const pole = mesh(new THREE.CylinderGeometry(0.07, 0.07, wide * S + 0.3, 12), std(0xffffff, { map: tex, roughness: 0.6 }));
      pole.position.set(GX - 0.24, WY + (lo + hi) / 2 * S, GZ); g.add(pole);
      const zl = tag('sota zero', ink.zero, 0.36); zl.position.set(X1 + 0.3, WY + Math.max(lo * S / 2, -1.6), GZ + 0.9); g.add(zl);
      g.add(mesh(boxG(0.05, 0.05, 1.5, X1 + 0.03, WY, GZ), lineM(0xF7C64E), { cast: false }));
    }
    for (let n = Math.ceil(lo / every) * every; n <= hi; n += every) {
      const ten = n % 10 === 0;
      if (ten || (every === 1 && wide <= 30)) g.add(spot(n, ten ? 0.17 : 0.08));
      else g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6).translate(0, 0.07, 0), lineM(0xBFEFF5), { cast: false, at: at3(n).toArray() }));
      if (n % named === 0) { const t = tag(num(n), n === 0 && low ? ink.q : ink.line, 0.42); t.position.copy(tagAt(n)); g.add(t); named$.push({ n, t }); }
    }
    // what each hop leaves: its arc, its label, the pad where it lands; reset() takes them away
    let dyn = [], landed = [], hid = null, at = pts[0];
    const sp = p.gap ? (host.insertAdjacentHTML('beforeend', '<p class="split">&nbsp;</p>'), host.querySelector('.split')) : null;
    const added = mask => { sp.innerHTML = `<b>${p.jumps.map(j => j.lab.slice(1)).join(' + ')}</b> = ${mask ? '<b class="q">?</b>' : p.ans}`; };
    const keep = o => { g.add(o); dyn.push(o); return o; };
    function land(n, mask) {
      const x = at3(n);
      named$.forEach(L => { L.t.visible = L.t.visible && x.distanceTo(at3(L.n)) >= 0.5 * big; });
      landed = landed.filter(L => { if (x.distanceTo(L.x) < 0.5 * big) { L.lab.visible = false; return false; } return true; });
      keep(spot(n, 0.27));
      const lab = keep(tag(mask ? '?' : num(n), mask ? ink.q : ink.line, 0.56)); lab.position.copy(tagAt(n, 0.02));
      landed.push({ x, lab });
      if (mask) hid = () => { const t = keep(tag(num(n), ink.line, 0.56)); t.position.copy(lab.position); lab.visible = false; };
    }
    const show = () => { canvas.dataset.granota = String(at); };
    function reset() {
      dyn.forEach(drop); dyn = []; landed = []; hid = null; named$.forEach(L => { L.t.visible = true; });
      if (sp) sp.innerHTML = '&nbsp;';
      at = pts[0]; frog.position.copy(at3(at)); frog.userData.face = facing(frog.position.x, frog.position.z); land(at); show();
    }
    // the hop from pts[i] to pts[i + 1]: the frog flies along its arc and the arc is drawn behind it; its label on top, a pad where it lands
    async function jump(i, mask) {
      const a = at3(pts[i]), b = at3(pts[i + 1]), back = pts[i + 1] < pts[i], end = i === p.jumps.length - 1;
      const d = a.distanceTo(b), h = Math.min(low ? 1.1 : 2.2, 0.4 + d * (low ? 0.12 : 0.16));
      const bulge = low ? V(0, 0, 1) : V(0, 1, 0), behind = low ? V(-0.02, 0.04, 0) : V(0, 0.05, -0.3);
      const top = a.clone().add(b).multiplyScalar(0.5).addScaledVector(bulge, 2 * h);
      const way = new THREE.QuadraticBezierCurve3(a, top, b), trail = new THREE.QuadraticBezierCurve3(a.clone().add(behind), top.clone().add(behind), b.clone().add(behind));
      const tube = keep(new THREE.Mesh(new THREE.TubeGeometry(trail, 40, 0.045, 6, false), lineM(back ? 0xF7C64E : 0x6FE3FF))), total = tube.geometry.index.count;
      tube.geometry.setDrawRange(0, 0);
      sound.tone(back ? 330 : 440, 0, 0.14, 0.06);
      frog.userData.face = low ? facing(b.x, b.z) : Math.atan2(b.x - a.x, 0.6);
      const under = pts[i] >= 0 && pts[i + 1] < 0;
      await tween(RM ? 0 : Math.min(1000, 430 + d * (low ? 110 : 75)), k => {
        tube.geometry.setDrawRange(0, Math.floor(total * k / 36) * 36); frog.position.copy(way.getPoint(k)); frog.userData.sq = Math.sin(Math.PI * k);
      }, k => k);
      if (!P.on()) return;
      frog.userData.sq = 0; frog.userData.face = facing(b.x, b.z);
      // a single hop that is the whole answer keeps its size secret
      const secret = mask && p.gap && p.jumps.length === 1;
      const lab = keep(tag(secret ? '?' : p.jumps[i].lab, secret || back ? ink.back : ink.fwd, 0.5));
      lab.position.copy(way.getPoint(0.5)).add(low ? V(0.1, 0, 0.42) : V(0, 0.36, 0));
      at = pts[i + 1]; show();
      land(at, mask && !p.gap && at === p.ans);
      if (p.gap && end) { added(mask); if (mask) hid = () => { const t = keep(tag(p.jumps[i].lab, back ? ink.back : ink.fwd, 0.5)); t.position.copy(lab.position); lab.visible = false; added(false); }; }
      // the frog lands with a splash; under the water it lands with bubbles, and it splashes at the surface on its way down
      if (low && at < 0) bubbles(b, 10); else splash(b);
      if (under) splash(V(b.x, WY, b.z), 1.2);
      sound.tone(back ? 494 : 659, 0, 0.2, 0.07);
    }
    function reveal() { if (hid) { hid(); hid = null; } }

    // The child makes the hops by touching the place where the frog has to land (or moving it with the arrows of the keyboard). h is what
    // main.js says and hears, as with the picture of viz.js: can(), next(), hopped(), missed(), hold(on). A hop to the right place is drawn
    // as a hint draws it; to any other place the frog jumps there, falls in the water and swims back.
    function hand(h) {
      P.later(() => {
        const hit = new THREE.Mesh(low ? new THREE.PlaneGeometry(2.4, wide * S + 0.9).rotateY(Math.PI / 2) : new THREE.PlaneGeometry(len + 1.2, 1.8).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.copy(low ? V(X1, WY + (lo + hi) / 2 * S, GZ) : V(x0 + len / 2, WY + 0.04, LINE.z)); g.add(hit);
        const mark = new THREE.Group(), ringM = new THREE.MeshBasicMaterial({ color: 0xF7C64E, transparent: true, opacity: 0.9, toneMapped: false, depthTest: false });
        mark.add(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 32).rotateX(low ? 0 : Math.PI / 2).rotateY(low ? Math.PI / 2 : 0), ringM)); mark.renderOrder = 6; mark.visible = false; g.add(mark);
        let markTag = null, kn = null, wait = 0;
        const num$ = e => { const q = D.pick(e.clientX, e.clientY, [hit])[0]; if (!q) return null; const n = low ? (q.point.y - WY) / S : lo + (q.point.x - x0) / len * wide; return Math.max(lo, Math.min(hi, Math.round(n))); };
        const showAt = n => {
          aim.n = n; mark.visible = true; mark.position.copy(at3(n)).add(V(low ? 0.05 : 0, 0.02, 0));
          if (markTag?.userData.n !== n) { if (markTag) drop(markTag); markTag = tag(num(n), ink.q, 0.5); markTag.userData.n = n; markTag.position.copy(at3(n)).add(low ? V(0.2, 0.45, 0.5) : V(0, 0.75, 0)); g.add(markTag); }
          markTag.visible = true; slider.setAttribute('aria-valuenow', n); D.wake();
        };
        const hideMark = () => { mark.visible = false; if (markTag) markTag.visible = false; D.wake(); };
        // the frog lands on n: the next hop is drawn, or it falls in the water and comes back
        async function dropAt(n) {
          const i = h.next();
          hideMark();
          if (n === at || !h.can() || i >= p.jumps.length) return;
          h.hold(true);
          if (n === pts[i + 1]) { await P.later(() => jump(i, i === p.jumps.length - 1)); if (!P.on()) return; h.hold(false); return h.hopped(); }
          await P.later(async () => {
            const back = frog.position.clone(), to = at3(n);
            sound.tone(196, 0, 0.18, 0.05);
            await leapTo(low ? to : to.clone().add(V(0, -0.12, 0)), { h: 0.6, dur: 420, turn: false });
            splash(to, 0.8);
            await tween(RM ? 0 : 420, k => { frog.position.lerpVectors(to, back, k); frog.position.y += Math.sin(k * Math.PI) * 0.25; }, k => k);
            frog.position.copy(back); frog.userData.face = facing(back.x, back.z);
          });
          if (!P.on()) return;
          h.hold(false); h.missed();
        }
        aim = { num: num$, show: showAt, hide: hideMark, drop: dropAt, can: () => h.can(), n: null, down: false };
        canvas.style.touchAction = 'none';
        // the keyboard: the place for it is in the panel
        host.insertAdjacentHTML('beforeend', `<p class="hand3d" tabindex="0" role="slider" aria-valuemin="${lo}" aria-valuemax="${hi}" aria-valuenow="${at}"
          aria-label="La granota a la recta numèrica, de ${num(lo)} a ${num(hi)}. Toca a l'estany el lloc on ha de saltar, o mou-la amb les fletxes.">👆 Toca a l'estany on ha de saltar la granota</p>`);
        const slider = host.querySelector('.hand3d');
        slider.addEventListener('keydown', e => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault(); e.stopPropagation();
          if (!h.can()) return;
          const up = e.key === 'ArrowRight' || e.key === 'ArrowUp';
          kn = Math.max(lo, Math.min(hi, (kn ?? at) + (up ? 1 : -1) * (e.shiftKey ? 10 : 1)));
          showAt(kn); clearTimeout(wait);
          wait = setTimeout(() => { const n = kn; kn = null; dropAt(n); }, 750);
        });
        P.cleanup = () => { canvas.style.touchAction = ''; clearTimeout(wait); };
      });
    }
    P.where = n => D.onScreen(at3(n));
    // the frog leaps to where the line starts
    P.later(async () => { const from = frog.position.clone(); reset(); const s = frog.position.clone(); frog.position.copy(from); await leapTo(s, { dur: 520 }); });
    return { n: p.jumps.length, jump: (i, mask) => P.later(() => jump(i, mask)), reset: () => P.later(reset), reveal: () => P.later(reveal), hand };
  }
  /* ---------- the other pictures: ten lily pads, the raft of bars and cubes, two rows of flowers ---------- */
  // They are drawn in the middle of the pond, with the frog on its pad watching; each says what is on show in canvas.dataset.dibuix
  const MID = { x: 1.0, z: 0.25 };
  const said = o => { canvas.dataset.dibuix = JSON.stringify(o); };
  // a flower that opens (k 1) or is a bud (k 0)
  const openFlower = (f, k) => { const u = f.userData; u.k = k; u.open.scale.setScalar(Math.max(0.001, k)); u.open.rotation.y = (1 - k) * 1.5; u.bud.scale.setScalar(Math.max(0.001, 1 - k)); };
  // what every picture of the middle does first: the frog leaps to its pad to watch
  function middle(host, view) {
    const P = newPic(host);
    D.go(view);
    P.start = reset => P.later(async () => { reset(); await leapTo(homeAt(), { dur: 520 }); });
    return P;
  }
  const numTag = (t, c = ink.line) => tagS(t, c, 0.42);

  // Adding fills the empty pads with new flowers; taking away starts with ten flowers and some fly away
  function frameViz(host, p) {
    const P = middle(host, { t: [MID.x, 0, MID.z + 0.1], dir: [0, 1.3, 1], R: 2.4 }), g = P.g;
    const keep = p.sub ? p.ans : p.a, first = i => p.sub || i < keep;
    const cells = Array.from({ length: 10 }, (_, i) => {
      const x = MID.x + (i % 5 - 2) * 0.82, z = MID.z + (i < 5 ? -0.42 : 0.42), pad = lilyPad(0.33), f = flower(1.05);
      pad.position.set(x, WY + 0.02, z); pad.rotation.y = i * 2.3; f.position.set(x, WY + 0.03, z); g.add(pad); g.add(f);
      return { x, z, f, lab: null };
    });
    const count = () => said({ flors: cells.filter(c => c.f.visible && c.f.userData.k > 0.5).length });
    function reset() {
      cells.forEach((c, i) => { openFlower(c.f, first(i) ? 1 : 0); c.f.visible = true; c.f.position.set(c.x, WY + 0.03, c.z); c.f.rotation.set(0, 0, 0); c.f.scale.setScalar(1.05); if (c.lab) { drop(c.lab); c.lab = null; } });
      count();
    }
    async function jump() {
      for (let i = keep; i < 10 && P.on(); i++) {
        const c = cells[i];
        sound.tone(sound.noteAt(i), 0, 0.12, 0.05);
        if (p.sub) {
          // the flower lifts off the pad and flies away, turning
          const dx = (Math.random() - 0.5) * 1.5;
          tween(RM ? 0 : 900, k => { c.f.position.set(c.x + dx * k, WY + 0.03 + k * 2.2, c.z - k * 0.8); c.f.rotation.set(k * 2, k * 3, 0); c.f.scale.setScalar(1.05 * (1 - k * 0.7)); }, k => k).then(() => { c.f.visible = false; count(); });
          D.sparkle(V(c.x, WY + 0.3, c.z), 4, 0xFFB3D9, 0.25, 1, 1);
        } else {
          tween(RM ? 0 : 260, k => openFlower(c.f, k), k => 1 - (1 - k) ** 3).then(count);
          D.sparkle(V(c.x, WY + 0.25, c.z), 5, 0xFFE08A, 0.25, 1.2, 2.5);
        }
        await new Promise(r => setTimeout(r, RM ? 0 : 240));
      }
      if (p.sub) await new Promise(r => setTimeout(r, RM ? 0 : 700));
      count();
    }
    // counts the flowers that make the result: the new ones when adding, the ones left when taking away
    function reveal() {
      cells.forEach((c, i) => { const k = p.sub ? (i < keep ? i + 1 : 0) : i - keep + 1; if (k > 0 && !c.lab) { c.lab = numTag(String(k), ink.q); c.lab.position.set(c.x, WY + 0.75, c.z); g.add(c.lab); } });
    }
    P.start(reset);
    return { n: 1, jump: () => P.later(jump), reset: () => P.later(reset), reveal: () => P.later(reveal) };
  }

  // Tens as bars, units as cubes, of wood on a raft: ten loose cubes stick into a new bar, or a bar breaks into ten cubes to take some away
  const CUBE = 0.19, STEP = 0.205, CUBEG = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  const BARG = mergeAll(Array.from({ length: 10 }, (_, k) => new THREE.BoxGeometry(CUBE, CUBE, CUBE).translate(0, k * STEP + CUBE / 2, 0)));
  CUBEG.userData.shared = BARG.userData.shared = true;
  const woodCube = mat(0xC9955E, { roughness: 0.7 }), newCube = mat(0xFF8FD0, { roughness: 0.6, emissive: 0xFF5FA8, emissiveIntensity: 0.25 }), barM = mat(0x4FB562, { roughness: 0.7 });
  function blockViz(host, p) {
    const P = middle(host, { t: [MID.x, WY + 0.9, MID.z], dir: [0, 0.5, 1], R: 2.5 }), g = P.g;
    const u = p.a % 10, t = (p.a - u) / 10, Y = WY + 0.14;
    // the raft and the names of its two sides
    for (let i = 0; i < 6; i++) g.add(mesh(boxG(4.3, 0.12, 0.2, MID.x, WY + 0.06, MID.z - 0.55 + i * 0.22), i % 2 ? woodM : wood2));
    const tens = tagS('Desenes', ink.line, 0.3), ones = tagS('Unitats', ink.line, 0.3);
    const BX = i => MID.x - 1.85 + i * 0.3, UX = MID.x + 1.45;
    tens.position.set(MID.x - 0.6, Y + 2.35, MID.z); ones.position.set(UX, Y + 2.35, MID.z); g.add(tens); g.add(ones);
    host.insertAdjacentHTML('beforeend', '<p class="split"></p>');
    const sp = host.querySelector('.split');
    const what = p.sub ? `${bar(t - 1)} i ${cub(10 - p.b)}` : bar(t + 1);
    let bars = [], cubes = [], end = false;
    const count = () => said({ barres: bars.length, cubets: cubes.length });
    const total = mask => { end = true; sp.innerHTML = `<b>${what}</b> = ${mask ? '<b class="q">?</b>' : p.ans}`; };
    const addBar = (fresh) => { const b = mesh(BARG, fresh ? newCube : barM); b.position.set(BX(bars.length), Y, MID.z); g.add(b); bars.push(b); return b; };
    const addCube = (fresh) => { const c = mesh(CUBEG, fresh ? newCube : woodCube); c.position.set(UX, Y + cubes.length * STEP + CUBE / 2, MID.z); g.add(c); cubes.push(c); return c; };
    function reset() {
      for (const o of [...bars, ...cubes]) g.remove(o);
      bars = []; cubes = []; end = false;
      for (let i = 0; i < t; i++) addBar();
      for (let i = 0; i < u; i++) addCube();
      sp.innerHTML = `${bar(t)} i ${cub(u)}`; count();
    }
    const pause = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));
    // a thing glows for a moment: the bar about to break, the ten cubes about to stick
    const glowOn = (os, ms) => { const gl = os.map(o => { const s = glow(o.position.x, o.position.y + (o.geometry === BARG ? 1 : 0), o.position.z + 0.2, o.geometry === BARG ? 2.6 : 0.7, 0xFFD36B); g.add(s); return s; }); return pause(ms).then(() => gl.forEach(s => { g.remove(s); s.material.dispose(); })); };
    async function jump(i, mask) {
      if (p.sub) {
        if (i === 0) {
          // the last bar breaks into ten cubes, that go to the units
          const b = bars[bars.length - 1]; await glowOn([b], 600); if (!P.on()) return;
          g.remove(b); bars.pop(); sound.tone(330, 0, 0.2, 0.08);
          const bx = b.position.x, made = Array.from({ length: 10 }, () => addCube(true));
          await Promise.all(made.map((c, k) => { const to = c.position.clone(), from = V(bx, Y + k * STEP + CUBE / 2, MID.z); c.position.copy(from); return tween(RM ? 0 : 600 + k * 30, q => { c.position.lerpVectors(from, to, q); c.position.y += Math.sin(q * Math.PI) * 0.4; }); }));
          sp.innerHTML = `${bar(t - 1)} i <b>10 cubets</b>`; count();
          return;
        }
        // b of them leave, from the top, and fall in the water
        for (let k = 0; k < p.b && P.on(); k++) {
          const c = cubes.pop(), from = c.position.clone(), to = V(UX + 0.9 + k * 0.08, WY - 0.1, MID.z + 0.6);
          sound.tone(sound.noteAt(9 - k), 0, 0.12, 0.05);
          tween(RM ? 0 : 420, q => { c.position.lerpVectors(from, to, q); c.position.y += Math.sin(q * Math.PI) * 0.6; }, q => q).then(() => { g.remove(c); splash(to, 0.5); });
          count(); await pause(200);
        }
        total(mask); count();
        return;
      }
      if (i === 0) {
        // the cubes that are missing come, one by one
        for (let k = 0; k < p.b && P.on(); k++) {
          const c = addCube(true), to = c.position.clone(), from = to.clone().add(V(0.6, 1.4, 0.3));
          sound.tone(sound.noteAt(u + k), 0, 0.12, 0.05);
          tween(RM ? 0 : 260, q => c.position.lerpVectors(from, to, q), q => 1 - (1 - q) ** 2);
          count(); await pause(200);
        }
        sp.innerHTML = `${bar(t)} i <b>${u} + ${p.b} = 10 cubets</b>`;
        return;
      }
      // the ten loose cubes stick into a bar, that goes with the others
      await glowOn([{ position: V(UX, Y, MID.z), geometry: BARG }], 600); if (!P.on()) return;
      const nb = addBar(true), to = nb.position.clone(), from = V(UX, Y, MID.z);
      for (const c of cubes) g.remove(c);
      cubes = []; nb.position.copy(from);
      await tween(RM ? 0 : 700, q => { nb.position.lerpVectors(from, to, q); nb.position.y += Math.sin(q * Math.PI) * 0.5; });
      sound.tone(523, 0, 0.25, 0.08); D.sparkle(to.clone().add(V(0, 1, 0.2)), 8, 0xFFD36B);
      total(mask); count();
    }
    P.start(reset);
    return { n: 2, jump: (i, mask) => P.later(() => jump(i, mask)), reset: () => P.later(reset), reveal: () => P.later(() => { if (end) total(false); }) };
  }

  // A double is two equal rows of flowers; a near double has one flower more in the second row, with a ring of gold round it
  function twinViz(host, p) {
    const a = p.a, twin = p.b === a, s = Math.min(0.62, 7.4 / p.b), x0 = MID.x - (p.b - 1) * s / 2;
    const P = middle(host, { t: [MID.x, 0, MID.z + 0.1], dir: [0, 1.25, 1], R: Math.max(2.1, p.b * s / 2 + 0.55), fit: 'w' }), g = P.g;
    const rows = [a, p.b].map((n, r) => Array.from({ length: n }, (_, k) => {
      const x = x0 + k * s, z = MID.z + (r ? 0.4 : -0.4), pad = lilyPad(s * 0.42), f = flower(s * 1.5);
      pad.position.set(x, WY + 0.02, z); pad.rotation.y = k * 1.9 + r; f.position.set(x, WY + 0.03, z); g.add(pad); g.add(f);
      if (k >= a) { const ring = new THREE.Mesh(new THREE.TorusGeometry(s * 0.47, 0.025, 6, 28).rotateX(Math.PI / 2), lineM(0xF7C64E)); ring.position.set(x, WY + 0.05, z); g.add(ring); }
      return f;
    }));
    host.insertAdjacentHTML('beforeend', '<p class="split"></p>');
    const sp = host.querySelector('.split');
    let end = false;
    const count = () => said({ fila: rows.map(r => r.filter(f => f.userData.k > 0.5).length) });
    const total = mask => { end = true; sp.innerHTML = `${twin ? `<b>${a} + ${a}</b>` : `<b>${2 * a} + 1</b>`} = ${mask ? '<b class="q">?</b>' : p.ans}`; };
    function reset() { rows.flat().forEach(f => openFlower(f, 0)); end = false; sp.innerHTML = `${a} i ${p.b}`; count(); }
    async function jump(i, mask) {
      if (i === 0) {
        // the two rows open in pairs
        const opening = [];
        for (let k = 0; k < a && P.on(); k++) {
          for (const r of rows) { const f = r[k]; opening.push(tween(RM ? 0 : 220, q => openFlower(f, q), q => 1 - (1 - q) ** 3)); }
          sound.tone(sound.noteAt(k), 0, 0.12, 0.05);
          await new Promise(r => setTimeout(r, RM ? 0 : 150));
        }
        await Promise.all(opening);
        if (twin) total(mask); else sp.innerHTML = `<b>${a} + ${a} = ${2 * a}</b> i 1 més`;
        count();
        return;
      }
      const f = rows[1][a];
      sound.tone(sound.noteAt(a + 2), 0, 0.2, 0.07);
      await tween(RM ? 0 : 300, q => openFlower(f, q), q => 1 - (1 - q) ** 3);
      D.sparkle(f.position.clone().add(V(0, 0.25, 0)), 8, 0xFFD36B);
      total(mask); count();
    }
    P.start(reset);
    return { n: twin ? 1 : 2, jump: (i, mask) => P.later(() => jump(i, mask)), reset: () => P.later(reset), reveal: () => P.later(() => { if (end) total(false); }) };
  }

  // the kinds of picture drawn on the pond; the others are drawn in the panel (viz.js)
  const PICS = { line: lineViz, frame: frameViz, blocks: blockViz, twin: twinViz };
  function viz(host, p) { return PICS[p.viz](host, p); }

  // the taps on the pond while a picture takes them
  let aim = null;
  canvas.addEventListener('pointerdown', e => { if (!aim || !aim.can()) return; const n = aim.num(e); if (n == null) return; aim.down = true; canvas.setPointerCapture?.(e.pointerId); aim.show(n); e.preventDefault(); });
  canvas.addEventListener('pointermove', e => { if (!aim) return; const n = aim.num(e); if (aim.down) { if (n != null) aim.show(n); } else if (e.pointerType === 'mouse' && aim.can()) { if (n == null) aim.hide(); else aim.show(n); } });
  canvas.addEventListener('pointerup', e => { if (!aim || !aim.down) return; aim.down = false; const n = aim.num(e) ?? aim.n; if (n != null) aim.drop(n); else aim.hide(); });
  canvas.addEventListener('pointercancel', () => { if (aim) { aim.down = false; aim.hide(); } });
  canvas.addEventListener('pointerleave', e => { if (aim && !aim.down && e.pointerType === 'mouse') aim.hide(); });

  /* ---------- what moves by itself ---------- */
  const wp = new THREE.Vector3();
  D.every((dt, now, raw) => {
    let busy = false;
    // the frog breathes and blinks
    const u = frog.userData; u.t += dt;
    // the flies: coming, hovering by the frog, going away; their wings beat
    for (const F of flying.slice()) {
      F.t += dt;
      const flap = RM ? 0.5 : 0.3 + 0.6 * Math.abs(Math.sin(F.t * 38));
      F.wings[0].rotation.x = -flap; F.wings[1].rotation.x = flap;
      // the comings and goings follow the clock, not the frames, so a slow device does not make the child wait
      if (F.mode === 'come') { F.k = Math.min(1, F.k + raw / 0.9); F.g.position.lerpVectors(F.from, hoverAt(F.t), 1 - (1 - F.k) ** 2); if (F.k >= 1) { F.mode = 'hover'; F.done(); } busy = true; }
      else if (F.mode === 'hover' && !RM) F.g.position.lerp(hoverAt(F.t), Math.min(1, dt * 5));
      else if (F.mode === 'go') { F.k += raw / 0.8; F.g.position.lerpVectors(F.from, F.away, Math.min(1, F.k)); F.g.scale.setScalar(Math.max(0.01, 1.4 * (1 - F.k))); if (F.k >= 1) gone(F); busy = true; }
      if (F.mode !== 'held') F.g.rotation.y = Math.atan2(D.camera.position.x - F.g.position.x, D.camera.position.z - F.g.position.z) - Math.PI / 2;
    }
    // the frog turns, slowly, to where it goes or to the camera
    const dd = Math.atan2(Math.sin(u.face - frog.rotation.y), Math.cos(u.face - frog.rotation.y));
    if (Math.abs(dd) > 0.003) { frog.rotation.y += RM ? dd : dd * Math.min(1, dt * 9); busy = true; }
    if (!RM) {
      const sq = u.sq || 0;
      u.body.scale.set((1 + Math.sin(u.t * 2.2) * 0.02) * (1 - 0.12 * sq), (1 + Math.sin(u.t * 2.2) * 0.03) * (1 + 0.24 * sq), 1 - 0.12 * sq);
      // under the water the frog lets out a bubble now and then
      if (frog.position.y < WY - 0.15) { u.bub = (u.bub || 0) - dt; if (u.bub <= 0) { u.bub = 0.4; bubbles(frog.position.clone().add(V(0.05, 0.25, 0.05)), 2); } busy = true; }
      // the throat breathes, and swells for a moment after a gulp
      const gl = u.gulp > 0 ? (u.gulp = Math.max(0, u.gulp - dt * 1.8)) : 0;
      u.throat.scale.set(0.26 * (1 + Math.max(0, Math.sin(u.t * 4.4)) * 0.25 + gl * 0.5), 0.12 * (1 + Math.max(0, Math.sin(u.t * 4.4)) * 0.4 + gl * 1.2), 0.12 * (1 + gl * 0.8));
      if (gl) busy = true;
      u.blink -= dt;
      const b = u.blink < 0.16 && u.blink > 0 ? Math.sin((0.16 - u.blink) / 0.16 * Math.PI) : 0;
      for (const l of u.lids) l.rotation.x = LID[0] + (LID[1] - LID[0]) * b;
      if (u.blink <= 0) u.blink = 2.5 + Math.random() * 3.5;
      for (const P of pads) P.g.position.y = WY + 0.02 + Math.sin(now * 0.0011 + P.bob) * 0.01;
      weeds.forEach((w, i) => { w.rotation.z = Math.sin(now * 0.0009 + i) * 0.12; w.rotation.x = Math.sin(now * 0.0007 + i * 2) * 0.08; });
      fish.forEach((f, i) => { const q = f.userData; q.p += dt * 0.25; const z = q.z + Math.sin(q.p) * 1.6, x = X1 - 1.2 - (1 + Math.cos(q.p * 0.7)) * 1.2; f.position.set(x, q.y + Math.sin(q.p * 2) * 0.15, z); f.rotation.y = Math.cos(q.p) > 0 ? -Math.PI / 2 : Math.PI / 2; });
      flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; const k = 0.3 + 0.7 * Math.sin(q.p * 2.1) ** 2; flyCol[i * 3] = 0.85 * k; flyCol[i * 3 + 1] = k; flyCol[i * 3 + 2] = 0.55 * k; });
      if (NFL) { flyGeo.attributes.position.needsUpdate = true; flyGeo.attributes.color.needsUpdate = true; }
      // the heron looks about; judging, it nods or shakes its head
      if (heronDo) {
        const h = heronDo; h.t += raw; const k = Math.min(1, h.t / 0.9);
        if (h.ok) neck.rotation.x = Math.sin(k * Math.PI * 2) * 0.28 * (1 - k); else head.rotation.y = Math.sin(k * Math.PI * 4) * 0.6 * (1 - k);
        if (k >= 1) { heronDo = null; neck.rotation.x = 0; }
        busy = true;
      } else head.rotation.y = Math.sin(now * 0.0004) * 0.5;
      // the swarm of the lightning round buzzes round the frog
      if (swarm.visible) {
        const m = new THREE.Matrix4();
        swarmP.forEach((q, i) => { q.a += raw * (2.2 + i % 3); q.b += raw * 3.1; m.makeTranslation(frog.position.x + Math.cos(q.a) * q.r, frog.position.y + q.h + Math.sin(q.b) * 0.25, frog.position.z + Math.sin(q.a) * q.r * 0.7); swarm.setMatrixAt(i, m); });
        swarm.instanceMatrix.needsUpdate = true; busy = true;
      }
      stars.forEach((s, i) => { if (s.on) s.gl.material.opacity = 0.6 + Math.sin(now * 0.002 + i) * 0.15; });
      if (hlOn >= 0) { const p = Math.sin(now * 0.006); ring.material.opacity = 0.7 + p * 0.25; ring.scale.setScalar(1 + p * 0.05); ringGlow.material.opacity = 0.55 + p * 0.2; busy = true; }
    }
    if (hlOn < 0) { ring.material.opacity = 0; ringGlow.material.opacity = 0; } else if (RM) { ring.material.opacity = 0.9; ringGlow.material.opacity = 0.6; }
    return busy;
  });

  return { ok: true, layout: D.layout, go: (v, o) => { base = v; return D.go(v, o); }, state, highlight, pause: D.pause, celebrate: (t, at) => D.celebrate(t, at), shake: D.shake,
    viz, draws: kind => !!PICS[kind], clear, hear: o => { sound = { ...sound, ...o }; }, where: n => pic?.where?.(n),
    rest, fly: newFly, gulp, plof, shoo, joy, bloom,
    // the camera close to the pad of project i, where the frog plays a level in the head
    open, judge, star, dusk, chalk: writeChalk,
    padView: i => ({ t: [PADS[i][0], WY + 0.6, PADS[i][1]], dir: [0.12, 0.5, 1], R: 1.6 }),
    _: { debug: () => ({ acts: actN, flying: flying.map(F => F.mode), fly: !!fly, pic: pic && { busy: pic.busy, on: pic.on() } }), D, frog, pads, stars, writeBoard, heron, head, tween, setFlower, piscina: () => piscinaOn } };
}

// many geometries into one, with their positions and normals only
function mergeAll(gs) {
  const g = new THREE.BufferGeometry(), pos = [], nor = [];
  for (const x of gs) { const y = x.index ? x.toNonIndexed() : x; pos.push(...y.attributes.position.array); nor.push(...y.attributes.normal.array); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
// the soft light of a firefly
function glowTex2() {
  return canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
