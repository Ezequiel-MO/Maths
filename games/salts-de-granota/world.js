// The pond of Salts de Granota in 3D, built on shared/diorama.js: a block of earth that floats in the dusk with a pond on top, cut open on its
// right side so the water is seen from inside. That is the place below zero: the surface is the 0 and the frog dives under it.
// The map is the pond itself: a lily pad for each project, in six groups round the water, one per circle; the flower of a pad opens, with a
// little lantern, when its project is validated, and every exam passed lights a star of a frog in the sky. Around the water: reeds, a
// jetty with a blackboard (the Piscina and «Caça l'errada») and a rock where a heron watches the exams.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL pond() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, SPH, CONE, CYL, V } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';

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
const HOME = [1.2, 2.1], JETTY = { x: -1.5, z0: 5.7, z1: 2.75 }, ROCK = [-2.6, -4.7], GAUGE = [X1 - 0.45, 0.35];

const C = {
  grass: 0x6DBB6A, grass2: 0x4F9C58, water: 0x2B8FA8, pad: 0x4FA65A, padDark: 0x2F7F40, petal: 0xFFB3D9, petal2: 0xFFF0F6, heart: 0xF7C64E,
  wood: 0x8B5A3C, wood2: 0x6E4426, stone: 0xB7AE9E, frog: 0x5DBB63, belly: 0xD5F8C4, leaf: [0x4E9F5B, 0x67B565, 0x3F8A4E]
};

/* ---------- the frog ---------- */
// the turn of an eyelid: open (over the top of the eye) and shut (over its front)
const LID = [-0.55, 1.5];
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
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {} };
}

function build(canvas) {
  const VIEWS = {
    map: { t: [0.4, -1.2, 0], dir: [0.95, 0.68, 1], R: 11.2 },
    home: { t: [HOME[0], 0.2, HOME[1]], dir: [0.15, 0.5, 1], R: 2.6 },
    gauge: { t: [X1, -1, GAUGE[1]], dir: [1, 0.12, 0.38], R: 4.4, fit: 'h' },
    jetty: { t: [JETTY.x - 0.6, 0.6, 4.4], dir: [0.35, 0.42, 1], R: 3.0 },
    rock: { t: [ROCK[0] + 0.6, 0.5, ROCK[1] + 1.6], dir: [0.25, 0.4, 1], R: 3.0 },
    sky: { t: [3, 6, -6], dir: [-0.2, 0.15, 1], R: 9 }
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
    lines.forEach((t, i) => { g.font = `800 ${i ? 64 : 84}px "Baloo 2", system-ui, sans-serif`; g.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * 96); });
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
  const neck = new THREE.Group(); neck.position.set(0, 1.3, 0.35); heron.add(neck);
  neck.add(mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.7, 8).translate(0, 0.35, 0).rotateX(-0.25), white));
  const head = new THREE.Group(); head.position.set(0, 0.68, 0.16); neck.add(head);
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
  const PETAL = new THREE.SphereGeometry(1, 10, 6).scale(0.07, 0.03, 0.17).translate(0, 0, 0.15);
  function flower(s = 1) {
    const f = new THREE.Group(), open = new THREE.Group(), bud = new THREE.Group();
    for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(PETAL, i % 2 ? petal2M : petalM); p.rotation.set(-0.5, i / 8 * Math.PI * 2, 0, 'YXZ'); p.castShadow = true; open.add(p); }
    for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(PETAL, petalM); p.scale.setScalar(0.7); p.rotation.set(-1.0, (i + 0.5) / 6 * Math.PI * 2, 0, 'YXZ'); open.add(p); }
    open.add(part(SPH, heartM, [0.06, 0.04, 0.06], [0, 0.03, 0]));
    bud.add(part(SPH, budM, [0.06, 0.11, 0.06], [0, 0.08, 0])); bud.add(part(CONE, mat(C.padDark), [0.06, 0.07, 0.06], [0, 0.0, 0]));
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
  const frog = makeFrog(); frog.scale.setScalar(0.55); frog.position.set(HOME[0], WY + 0.03, HOME[1]); frog.rotation.y = 0.2; scene.add(frog);

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
    canvas.dataset.flors = pads.filter(P => P.open).length; canvas.dataset.estrelles = stars.filter(s => s.on).length;
    D.wake();
  }

  /* ---------- what moves by itself ---------- */
  const wp = new THREE.Vector3();
  D.every((dt, now) => {
    let busy = false;
    // the frog breathes and blinks
    const u = frog.userData; u.t += dt;
    if (!RM) {
      u.body.scale.set(1 + Math.sin(u.t * 2.2) * 0.02, 1 + Math.sin(u.t * 2.2) * 0.03, 1);
      u.throat.scale.set(0.26 * (1 + Math.max(0, Math.sin(u.t * 4.4)) * 0.25), 0.12 * (1 + Math.max(0, Math.sin(u.t * 4.4)) * 0.4), 0.12);
      u.blink -= dt;
      const b = u.blink < 0.16 && u.blink > 0 ? Math.sin((0.16 - u.blink) / 0.16 * Math.PI) : 0;
      for (const l of u.lids) l.rotation.x = LID[0] + (LID[1] - LID[0]) * b;
      if (u.blink <= 0) u.blink = 2.5 + Math.random() * 3.5;
      for (const P of pads) P.g.position.y = WY + 0.02 + Math.sin(now * 0.0011 + P.bob) * 0.01;
      weeds.forEach((w, i) => { w.rotation.z = Math.sin(now * 0.0009 + i) * 0.12; w.rotation.x = Math.sin(now * 0.0007 + i * 2) * 0.08; });
      fish.forEach((f, i) => { const q = f.userData; q.p += dt * 0.25; const z = q.z + Math.sin(q.p) * 1.6, x = X1 - 1.2 - (1 + Math.cos(q.p * 0.7)) * 1.2; f.position.set(x, q.y + Math.sin(q.p * 2) * 0.15, z); f.rotation.y = Math.cos(q.p) > 0 ? -Math.PI / 2 : Math.PI / 2; });
      flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; const k = 0.3 + 0.7 * Math.sin(q.p * 2.1) ** 2; flyCol[i * 3] = 0.85 * k; flyCol[i * 3 + 1] = k; flyCol[i * 3 + 2] = 0.55 * k; });
      if (NFL) { flyGeo.attributes.position.needsUpdate = true; flyGeo.attributes.color.needsUpdate = true; }
      head.rotation.y = Math.sin(now * 0.0004) * 0.5;
      stars.forEach((s, i) => { if (s.on) s.gl.material.opacity = 0.6 + Math.sin(now * 0.002 + i) * 0.15; });
      if (hlOn >= 0) { const p = Math.sin(now * 0.006); ring.material.opacity = 0.7 + p * 0.25; ring.scale.setScalar(1 + p * 0.05); ringGlow.material.opacity = 0.55 + p * 0.2; busy = true; }
    }
    if (hlOn < 0) { ring.material.opacity = 0; ringGlow.material.opacity = 0; } else if (RM) { ring.material.opacity = 0.9; ringGlow.material.opacity = 0.6; }
    return busy;
  });

  return { ok: true, layout: D.layout, go: (v, o) => D.go(v, o), state, highlight, pause: D.pause, celebrate: (t, at) => D.celebrate(t, at), shake: D.shake,
    _: { D, frog, pads, stars, writeBoard, heron, head, tween, setFlower, piscina: () => piscinaOn } };
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
