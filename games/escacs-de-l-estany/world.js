// Els escacs de l'estany in 3D, built on shared/diorama.js: a stone terrace at the edge of the pond, at dusk, on a block of earth that floats
// in the air. The floor of the terrace is the board, of light and dark stone in a wooden frame with the letters and the numbers carved on it;
// white always plays from the side of the camera (a1 at the bottom left). Around it, the water with its lily pads and reeds, a jetty,
// fireflies and the moon.
// The map is the garden of the board: nine statues on their pedestals, in four groups round the terrace (one per circle), the same figures
// as the map of the page. A project validated turns its statue to gold, with a little lantern; every exam passed lights a star of a
// constellation in the shape of a knight's jump.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL terrace() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, glowTex, ease, SPH, V } from '../../shared/diorama.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RM } from '../../shared/util.js';
import { FILES, fr, dark, white, CIRCLES } from './logic.js';
import { SHAPE } from './viz.js';

/* ---------- the measures of the world ---------- */
// one unit is one square. The grass at GY, the top of the terrace at 0, the top of the board at TY; the block from YB up, x from X0 to X1
// and z from Z0 (back) to Z1 (front); the water at WY over a bottom at BY
const GY = -0.35, TY = 0.06, YB = -4.6, WY = -0.62, BY = -1.7, X0 = -11.6, X1 = 11.6, Z0 = -13.2, Z1 = 8.8;
// the pond: an ellipse round PC with radii PR, at the back of the terrace
const PC = [0.4, -9.7], PR = [10.2, 2.7];
const wob = a => 1 + 0.03 * Math.sin(3 * a + 0.4) + 0.025 * Math.sin(5 * a + 1.3);
const SHORE = Array.from({ length: 72 }, (_, i) => { const a = i / 72 * Math.PI * 2, k = wob(a); return [PC[0] + PR[0] * Math.cos(a) * k, PC[1] + PR[1] * Math.sin(a) * k]; });
// the terrace of stone: x from -TX to TX, z from TZ0 to TZ1
const TX = 6.2, TZ0 = -6.3, TZ1 = 6.4;
// the middle of a square on top of the board: a1 at the front on the left, h8 at the back on the right
export const at3 = s => { const [f, r] = fr(s); return V(f - 3.5, TY, 3.5 - r); };
// the statue of each project, in the order of PROJECTS: four groups round the terrace, one per circle
const STATUES = [[-8.9, 4.7], [-8.9, 1.9], [-9.4, -1.7], [-7.8, -4.8], [7.8, -4.8], [9.4, -3.0], [9.7, -0.7], [8.9, 2.0], [8.9, 4.8]];
// what each statue shows: the star of the map of the board, then the pieces; the last two are black
const FIG = ['*', 'R', 'B', 'Q', 'K', 'N', 'P', 'r', 'k'];
const GROUPS = CIRCLES.map(c => c.projects);
const PED = 0.62;   // the height of a pedestal

const C = {
  grass: 0x6DBB6A, grass2: 0x4F9C58, water: 0x2B8FA8, pad: 0x4FA65A, padDark: 0x2F7F40, wood: 0x8B5A3C, wood2: 0x6E4426, frame: 0x5A3420,
  stone: 0xC9BFAE, stone2: 0xA89C88, ivory: 0xF3E8D2, ebony: 0x3D2617, gold: 0xF2C14E, leaf: [0x4E9F5B, 0x67B565, 0x3F8A4E]
};

/* ---------- the pieces ---------- */
// Turned on a lathe from their profile, all of them but the knight, which is cut out of the drawing of the page (SHAPE.N) and given some
// thickness. About one unit tall for the king; the base fits a square with room to spare. Built once and shared.
const V2 = (x, y) => new THREE.Vector2(x, y);
// a ball of radius r round height cy, from where its side is at radius x0 up to the top
const ball = (cy, r, x0) => { const a0 = -Math.acos(Math.min(1, x0 / r)), out = []; for (let i = 0; i <= 8; i++) { const a = a0 + (Math.PI / 2 - a0) * i / 8; out.push([Math.max(0.0001, r * Math.cos(a)), cy + r * Math.sin(a)]); } return out; };
const FOOTP = [[0.0001, 0], [0.34, 0], [0.345, 0.035], [0.335, 0.07], [0.3, 0.1], [0.25, 0.13]];
const PROFILE = {
  P: [...FOOTP, [0.2, 0.16], [0.15, 0.22], [0.12, 0.33], [0.11, 0.38], [0.19, 0.4], [0.19, 0.43], [0.1, 0.45], ...ball(0.54, 0.125, 0.1)],
  R: [...FOOTP, [0.25, 0.16], [0.22, 0.2], [0.2, 0.5], [0.25, 0.53], [0.28, 0.56], [0.28, 0.66], [0.2, 0.66], [0.2, 0.62], [0.0001, 0.62]],
  B: [...FOOTP, [0.22, 0.16], [0.18, 0.22], [0.13, 0.45], [0.21, 0.48], [0.21, 0.51], [0.12, 0.53], [0.15, 0.57], [0.18, 0.63], [0.17, 0.7], [0.12, 0.77], [0.05, 0.82], [0.035, 0.83], ...ball(0.865, 0.045, 0.035)],
  Q: [...FOOTP, [0.24, 0.16], [0.2, 0.22], [0.14, 0.5], [0.23, 0.54], [0.23, 0.57], [0.14, 0.6], [0.16, 0.66], [0.22, 0.79], [0.24, 0.83], [0.16, 0.84], [0.1, 0.86], ...ball(0.91, 0.06, 0.05)],
  K: [...FOOTP, [0.25, 0.16], [0.21, 0.22], [0.15, 0.52], [0.24, 0.56], [0.24, 0.59], [0.15, 0.62], [0.19, 0.77], [0.21, 0.82], [0.14, 0.86], [0.07, 0.88], [0.0001, 0.885]],
  N: [...FOOTP, [0.25, 0.16], [0.24, 0.19], [0.0001, 0.19]]
};
const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => V2(x, y)), 32);
const merge = gs => { const m = mergeAll(gs); m.computeBoundingSphere(); return m; };
// the knight: the body of the drawing, from its 100 box to one unit, standing on its round base and looking to -x
function knightGeo() {
  const d = SHAPE.N.match(/class="body" d="([^"]+)"/)[1], s = 0.0098;
  const paths = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths;
  const shapes = paths.flatMap(p => p.toShapes(true)).map(sh => new THREE.Shape(sh.getPoints(10).map(p => V2((p.x - 48) * s, (81 - p.y) * s + 0.17))));
  const body = new THREE.ExtrudeGeometry(shapes, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 10 }).translate(0, 0, -0.1);
  return merge([lathe(PROFILE.N), body]);
}
function pieceGeo(t) {
  if (t === 'N') return knightGeo();
  const gs = [lathe(PROFILE[t])];
  // the battlements of the rook, the crown of the queen, the cross of the king
  if (t === 'R') for (let i = 0; i < 6; i++) gs.push(new THREE.BoxGeometry(0.11, 0.09, 0.12).translate(0.235, 0.705, 0).rotateY(i / 6 * Math.PI * 2));
  if (t === 'Q') for (let i = 0; i < 9; i++) gs.push(new THREE.SphereGeometry(0.038, 10, 8).translate(0.225, 0.85, 0).rotateY(i / 9 * Math.PI * 2));
  if (t === 'K') { gs.push(new THREE.BoxGeometry(0.065, 0.24, 0.065).translate(0, 0.99, 0)); gs.push(new THREE.BoxGeometry(0.19, 0.065, 0.065).translate(0, 1.01, 0)); }
  return merge(gs);
}
const GEO = {};
export const geoOf = t => { t = t.toUpperCase(); if (!GEO[t]) { GEO[t] = pieceGeo(t); GEO[t].userData.shared = true; } return GEO[t]; };
// a star of five points standing up, for the statue of the map of the board
function starGeo(r = 0.42, depth = 0.14) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.43 : r; i ? s.lineTo(Math.cos(a) * q, Math.sin(a) * q) : s.moveTo(Math.cos(a) * q, Math.sin(a) * q); }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }).translate(0, 0, -depth / 2);
}

/* ---------- the world ---------- */
export function terrace(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('escacs 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, hear() {}, lamps() {}, tauler: () => null, spark() {},
    bring: p, frog: p, walk: p, rest() {}, topple: p, validate: p, open: p, judge() {}, star: p, clock() {}, sheet() {} };
}

function build(canvas) {
  const VIEWS = {
    map: { t: [0, -0.6, -1.6], dir: [0.3, 1.0, 1], R: 11.6 },
    // the board from the side of white, high enough to count the rows at the back
    board: { t: [0, 0, 0.3], dir: [0, 1.62, 1], R: 4.95 },
    sky: { t: [-1.2, 9.6, -26], dir: [0.1, -0.08, 1], R: 4.2 }
  };
  // one view per circle: its group of statues
  GROUPS.forEach((ps, c) => {
    const xs = ps.map(i => STATUES[i][0]), zs = ps.map(i => STATUES[i][1]), x = (Math.min(...xs) + Math.max(...xs)) / 2, z = (Math.min(...zs) + Math.max(...zs)) / 2;
    VIEWS['c' + c] = { t: [x, GY + 1.2, z], dir: [-x * 0.06, 0.55, 1], R: Math.max(2.3, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) / 2 + 1.3) };
  });
  const D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-14, 18, 14], shadow: { left: -14, right: 14, top: 12, bottom: -14 }, floor: YB - 4, under: [0, YB - 2.5, -2, 34, 30] });
  const { scene, glow, tween } = D;
  const fixed = new THREE.Group(); scene.add(fixed);
  // The view on show, by name. diorama's layout() flies the camera again with the view itself and forgets its name, and the sway of the
  // map only comes with the name: so the name is kept here and given back after a layout
  let viewName = 'map';
  const go = (v, o) => { viewName = typeof v === 'string' ? v : null; return D.go(v, o); };
  const layout = (kind, x) => { D.layout(kind, x); if (viewName && D.view !== viewName) D.go(viewName, { dur: 700 }); };

  /* ---------- the block of earth, with the pond cut into its top ---------- */
  const soilTex = canvasTex(256, 512, (g, w, h) => {
    const bands = ['#6E9F4E', '#7A4E2D', '#8E5E36', '#6B4226', '#9A6B43', '#5C3820', '#7E5131'], hs = [10, 70, 60, 80, 70, 110, 120];
    let y = 0; bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, y, w, hs[i]); y += hs[i]; });
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 3 ? '40,25,15' : '200,180,150'},${0.15 + Math.random() * 0.25})`; const r = 1 + Math.random() * 5; g.beginPath(); g.ellipse(Math.random() * w, 14 + Math.random() * (h - 14), r * 1.6, r, 0, 0, 7); g.fill(); }
  });
  soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  const HB = GY - YB;
  {
    // the grass round the pond, down to the bottom of the water; the walls of the hole and of the block are earth
    const s = new THREE.Shape();
    s.moveTo(X0, -Z1); s.lineTo(X1, -Z1); s.lineTo(X1, -Z0); s.lineTo(X0, -Z0); s.closePath();
    const hole = new THREE.Path(); SHORE.forEach(([x, z], i) => i ? hole.lineTo(x, -z) : hole.moveTo(x, -z)); hole.closePath(); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: GY - BY, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2).translate(0, BY, 0);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 + (p.getY(i) - GY) / HB);
    const wallTex = soilTex.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(0.12, 1);
    scene.add(mesh(g, [std(C.grass, { roughness: 0.9 }), std(0xffffff, { map: wallTex, roughness: 0.95 })], { cast: false }));
    const bt = soilTex.clone(); bt.needsUpdate = true; bt.repeat.set(1.5, (BY - YB) / HB);
    const side = std(0xffffff, { map: bt, roughness: 0.95 }), mud = std(0x4A3A26, { roughness: 1 }), dark = std(0x3A2617, { roughness: 1 });
    scene.add(mesh(boxG(X1 - X0, BY - YB, Z1 - Z0, (X0 + X1) / 2, (BY + YB) / 2, (Z0 + Z1) / 2), [side, side, mud, dark, side, side], { cast: false }));
  }
  // the water, with lily pads and reeds round the shore
  {
    const sh = new THREE.Shape(); SHORE.forEach(([x, z], i) => i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)); sh.closePath();
    const water = mesh(new THREE.ShapeGeometry(sh, 4).rotateX(-Math.PI / 2).translate(0, WY, 0), std(C.water, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.88, envMapIntensity: 1.25, emissive: 0x0B3F52, emissiveIntensity: 0.35 }), { cast: false });
    water.renderOrder = 1; scene.add(water);
  }
  const padM = std(C.pad, { roughness: 0.6, side: THREE.DoubleSide }), flowerM = std(0xFFB3D9, { emissive: 0xFF5FA8, emissiveIntensity: 0.15 });
  for (const [x, z, r] of [[-6.2, -9.2, 0.42], [-5.4, -10.4, 0.34], [-3.6, -11.2, 0.5], [-1.2, -10.6, 0.36], [5.6, -10.8, 0.46], [6.8, -9.6, 0.38], [8.2, -10.4, 0.32], [1.4, -11.6, 0.4]]) {
    fixed.add(mesh(new THREE.CircleGeometry(r, 24, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2).translate(x, WY + 0.02, z), padM, { cast: false }));
    if (r > 0.4) fixed.add(part(SPH, flowerM, [0.12, 0.09, 0.12], [x + 0.08, WY + 0.08, z - 0.05]));
  }
  const IC = new THREE.IcosahedronGeometry(1, 0), stoneM = std(0xA69C8A, { roughness: 0.9, flatShading: true });
  for (let i = 0; i < 48; i++) { const [x, z] = SHORE[(i * 3) % 72], s = 0.16 + (i * 37 % 10) / 40; fixed.add(part(IC, stoneM, [s, s * 0.55, s], [x, GY + 0.02, z])); }
  const reedM = std(0x3E7F47), catM = std(0x6B4226, { roughness: 0.9 });
  for (const [i0, n] of [[2, 6], [12, 5], [26, 6], [44, 5], [60, 6]]) for (let j = 0; j < n; j++) {
    const [x, z] = SHORE[(i0 + j) % 72], h = 0.9 + (j % 3) * 0.3, dx = (x - PC[0]) * 0.02, dz = (z - PC[1]) * 0.06;
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5).translate(x - dx, WY + h / 2, z - dz), reedM));
    if (j % 2 === 0) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8).translate(x - dx, WY + h - 0.05, z - dz), catM));
  }
  // the jetty, from the back of the terrace into the water
  const woodM = std(C.wood, { roughness: 0.7 }), wood2 = std(C.wood2, { roughness: 0.75 }), JX = 3.8;
  for (let i = 0; i < 14; i++) fixed.add(mesh(boxG(1.3, 0.07, 0.24, JX + (i % 2 ? 0.02 : -0.02), GY + 0.05, TZ0 - 0.2 - i * 0.3), i % 3 ? woodM : wood2));
  for (const dx of [-0.6, 0.6]) for (const z of [TZ0 - 1.4, TZ0 - 2.8, TZ0 - 4.2]) fixed.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, GY - BY + 0.3, 8).translate(JX + dx, (GY + BY) / 2 + 0.1, z), wood2));
  // trees and bushes on the grass
  const trunkM = std(0x7A5230);
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, GY + 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(C.leaf[(i + Math.round(Math.abs(x))) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, GY + (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-10.6, -6.6, 1.3], [10.4, -7.0, 1.2], [-10.7, 7.6, 0.9], [10.6, 7.8, 0.85], [-2.2, -12.6, 1.1], [6.4, -12.6, 0.9]]) tree(x, z, s);
  const bushM = std(C.grass2, { flatShading: true });
  for (const [x, z, s] of [[-10.8, 3.3, 0.5], [-10.9, -3.4, 0.45], [10.9, 0.6, 0.5], [10.8, -5.0, 0.45], [-6.9, 7.7, 0.45], [6.9, 7.8, 0.5], [-10.6, 0.2, 0.4]])
    fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, GY + s * 0.5, z]));
  for (let i = 0; i < 26; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.06, 0.05, 0.06], [i % 2 ? -10.8 + (i * 13 % 30) / 10 : 7.8 + (i * 7 % 30) / 10, GY + 0.06, -5.5 + (i * 47 % 120) / 10]));

  /* ---------- the terrace and the board ---------- */
  const flagTex = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#B8AD99'; g.fillRect(0, 0, w, w);
    // flagstones of different sizes, with dark joints
    for (let y = 0; y < w; y += 64) for (let x = (y / 64) % 2 ? -48 : 0; x < w; x += 96) {
      const c = 170 + Math.floor(Math.random() * 30); g.fillStyle = `rgb(${c},${c - 8},${c - 22})`; g.fillRect(x + 3, y + 3, 90, 58);
      for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,50,40' : '240,230,210'},0.12)`; g.fillRect(x + 3 + Math.random() * 86, y + 3 + Math.random() * 54, 3 + Math.random() * 8, 2 + Math.random() * 4); }
    }
  });
  flagTex.wrapS = flagTex.wrapT = THREE.RepeatWrapping; flagTex.repeat.set(3, 3);
  const flagM = std(0xffffff, { map: flagTex, roughness: 0.85 }), edgeM = std(C.stone2, { roughness: 0.85 });
  scene.add(mesh(boxG(TX * 2, 0 - GY + 0.12, TZ1 - TZ0, 0, (0 + GY - 0.12) / 2, (TZ0 + TZ1) / 2), [edgeM, edgeM, flagM, edgeM, edgeM, edgeM], { cast: false }));
  // a step of stone all round
  scene.add(mesh(boxG(TX * 2 + 0.6, 0.14, TZ1 - TZ0 + 0.6, 0, GY + 0.05, (TZ0 + TZ1) / 2), edgeM, { cast: false }));
  // the squares: one picture of the 64, and another of one stone only for the questions of colour (plain)
  const boardTex = plain => canvasTex(1024, 1024, (g, w) => {
    const q = w / 8;
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const d = !plain && dark(FILES[f] + (8 - r)), base = plain ? [168, 156, 136] : d ? [118, 96, 74] : [226, 214, 190];
      g.fillStyle = `rgb(${base})`; g.fillRect(f * q, r * q, q, q);
      // veins and grains of the stone
      for (let i = 0; i < 26; i++) { const k = Math.random() < 0.5 ? -1 : 1; g.fillStyle = `rgba(${k > 0 ? '255,250,240' : '40,30,20'},${0.04 + Math.random() * 0.06})`; g.beginPath(); g.ellipse(f * q + Math.random() * q, r * q + Math.random() * q, 2 + Math.random() * 14, 1 + Math.random() * 4, Math.random() * 3, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(30,20,10,0.35)'; g.lineWidth = 2; g.strokeRect(f * q + 1, r * q + 1, q - 2, q - 2);
    }
  });
  const TEX = { board: boardTex(false), plain: boardTex(true) };
  const boardM = std(0xffffff, { map: TEX.board, roughness: 0.55, envMapIntensity: 0.6 });
  const top = mesh(new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2).translate(0, TY, 0), boardM, { cast: false });
  top.userData.keep = true; scene.add(top);
  scene.add(mesh(boxG(8, TY + 0.096, 8, 0, (TY - 0.104) / 2, 0), edgeM, { cast: false }));
  // the wooden frame, a bit above the squares, with the letters at the front and the numbers on the left carved into it
  const frameM = std(C.frame, { roughness: 0.55 });
  const FR = 4.85, FW = FR - 4, FY = 0.1;
  for (const [w, d, x, z] of [[FR * 2, FW, 0, 4 + FW / 2], [FR * 2, FW, 0, -4 - FW / 2], [FW, 8, -4 - FW / 2, 0], [FW, 8, 4 + FW / 2, 0]]) fixed.add(mesh(boxG(w, FY + 0.12, d, x, (FY - 0.12) / 2, z), frameM));
  const glyphTex = ch => canvasTex(128, 128, (g, w) => { g.font = '800 104px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(ch, w / 2, w / 2 + 8); });
  const GLYPH = new THREE.PlaneGeometry(0.62, 0.62).rotateX(-Math.PI / 2); GLYPH.userData.shared = true;
  const INK = 0xE9D9B4, LIT = 0xFFD36B;
  // the 16 signs of the frame, made once: a..h at the front, 1..8 on the left
  const signs = {};
  [...FILES].forEach((ch, f) => { const m = new THREE.Mesh(GLYPH, new THREE.MeshBasicMaterial({ map: glyphTex(ch), color: INK, transparent: true, depthWrite: false, toneMapped: false })); m.position.set(f - 3.5, FY + 0.005, 4 + FW / 2); signs[ch] = m; });
  for (let r = 0; r < 8; r++) { const m = new THREE.Mesh(GLYPH, new THREE.MeshBasicMaterial({ map: glyphTex(String(r + 1)), color: INK, transparent: true, depthWrite: false, toneMapped: false })); m.position.set(-4 - FW / 2, FY + 0.005, 3.5 - r); signs[r + 1] = m; }
  for (const m of Object.values(signs)) { m.renderOrder = 2; m.userData.keep = true; scene.add(m); }

  // the four lanterns at the corners of the terrace: lit once the Piscina is done, in the colour of the project on show
  const lamps = [[-TX + 0.45, TZ0 + 0.45], [TX - 0.45, TZ0 + 0.45], [-TX + 0.45, TZ1 - 0.45], [TX - 0.45, TZ1 - 0.45]].map(([x, z]) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.5, 8).translate(x, 0.75, z), std(0x2A2F3A, { metalness: 0.5, roughness: 0.4 })));
    fixed.add(mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.06, 8).translate(x, 1.5, z), std(0x2A2F3A, { metalness: 0.5, roughness: 0.4 })));
    const bulb = mesh(new THREE.SphereGeometry(0.13, 12, 8).translate(x, 1.66, z), new THREE.MeshBasicMaterial({ color: 0x8A8170, toneMapped: false }), { cast: false });
    bulb.userData.keep = true; scene.add(bulb);
    return { bulb, gl: glow(x, 1.66, z, 1.8, 0xFFC46A, false) };
  });
  let lampHue = null, piscinaOn = false;
  function paintLamps(on = piscinaOn) {
    const c = new THREE.Color(lampHue == null ? 0xFFE6A0 : new THREE.Color().setHSL(lampHue / 360, 0.85, 0.72));
    for (const L of lamps) { L.bulb.material.color.copy(on ? c : new THREE.Color(0x8A8170)); L.gl.material.color.copy(c); L.gl.material.opacity = on ? 0.95 : 0; }
    D.wake();
  }

  /* ---------- the garden: nine statues on their pedestals ---------- */
  const garden = new THREE.Group(); scene.add(garden);
  const pedM = std(0xBDB3A2, { roughness: 0.85 }), capM = std(0xD8CFBF, { roughness: 0.8 });
  const stoneW = std(0xC6BFB2, { roughness: 0.6 }), stoneB = std(0x4E4C57, { roughness: 0.5 });
  const goldM = () => std(C.gold, { metalness: 0.6, roughness: 0.3, emissive: 0x6A4A00, emissiveIntensity: 0.3 });
  const statues = STATUES.map(([x, z], i) => {
    const ped = new THREE.Group(); ped.position.set(x, GY, z); garden.add(ped);
    ped.add(mesh(boxG(1.0, 0.12, 1.0, 0, 0.06, 0), capM));
    ped.add(mesh(boxG(0.78, PED - 0.24, 0.78, 0, 0.12 + (PED - 0.24) / 2, 0), pedM));
    ped.add(mesh(boxG(0.92, 0.12, 0.92, 0, PED - 0.06, 0), capM));
    const black = FIG[i] === 'r' || FIG[i] === 'k', m = (black ? stoneB : stoneW).clone();
    const fig = new THREE.Mesh(FIG[i] === '*' ? starGeo() : geoOf(FIG[i]), m); fig.castShadow = true; fig.userData.keep = true;
    const s = FIG[i] === '*' ? 1.5 : 1.55;
    fig.scale.setScalar(s); fig.position.set(x, GY + PED + (FIG[i] === '*' ? 0.62 : 0), z);
    // the statues look at the terrace; the star turns slowly on its point
    fig.rotation.y = FIG[i] === '*' ? 0.3 : Math.atan2(-x, -z) + (FIG[i] === 'N' ? Math.PI / 2 : 0);
    scene.add(fig);
    // the lantern beside it, on when the project is validated
    const lx = x + (x < 0 ? 0.55 : -0.55), lz = z + 0.45;
    const post = mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.9, 6).translate(lx, GY + 0.45, lz), mat(0x2A2F3A), { cast: false });
    const lamp = mesh(new THREE.SphereGeometry(0.08, 10, 8).translate(lx, GY + 0.95, lz), new THREE.MeshBasicMaterial({ color: 0xFFE6A0, toneMapped: false }), { cast: false });
    post.visible = lamp.visible = false; post.userData.keep = lamp.userData.keep = true; garden.add(post); garden.add(lamp);
    return { x, z, fig, m, base: m.color.clone(), gold: goldM(), lamp, post, gl: glow(lx, GY + 0.95, lz, 1.0, 0xFFC46A, false), lit: false };
  });
  // a statue lit (k 1) or of stone (k 0)
  function setStatue(S, k) {
    S.fig.material = k > 0.5 ? S.gold : S.m;
    S.lamp.visible = S.post.visible = k > 0.5; S.gl.material.opacity = k > 0.5 ? 0.8 : 0;
  }

  /* ---------- the sky: the moon and the knight of four stars ---------- */
  const moon = mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-15, 8, -24] });
  scene.add(moon); glow(-15, 8, -24, 9, 0xFFE9B8, true).material.opacity = 0.55;
  // a knight's jump: two stars straight up, then one to the side
  const SKY = [[0, 0], [0, 1.6], [0, 3.2], [1.6, 3.2]].map(([x, y]) => V(-2.0 + x, 7.8 + y, -26));
  const starShape = (() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.42; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return s; })();
  const stars = SKY.map(p => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(starShape), new THREE.MeshBasicMaterial({ color: 0x4A4870, toneMapped: false, transparent: true }));
    m.position.copy(p); scene.add(m); return { m, gl: glow(p.x, p.y, p.z + 0.1, 3.2, 0xFFD36B, false), on: false };
  });
  const lines = [[0, 1], [1, 2], [2, 3]].map(([a, b]) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([SKY[a], SKY[b]]), new THREE.LineBasicMaterial({ color: 0xFFE9A8, transparent: true, opacity: 0.08, toneMapped: false }));
    scene.add(l); return { l, a, b };
  });
  const paintLines = () => lines.forEach(L => { L.l.material.opacity = stars[L.a].on && stars[L.b].on ? 0.55 : 0.08; });

  /* ---------- fireflies ---------- */
  const NFL = RM ? 0 : 24, flies = Array.from({ length: NFL }, (_, i) => ({ p: Math.random() * 7, x: (i % 2 ? -1 : 1) * (7 + Math.random() * 3.5), z: -8 + Math.random() * 15, y: 0.4 + Math.random() * 1.4 }));
  for (let i = 0; i < 8; i++) Object.assign(flies[i] || {}, { x: -6 + Math.random() * 12, z: -11 + Math.random() * 3 });
  const flyPos = new Float32Array(NFL * 3), flyCol = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3)); flyGeo.setAttribute('color', new THREE.BufferAttribute(flyCol, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: softTex(), size: 0.42, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- everything that never moves, baked into a few meshes ---------- */
  bake(fixed); bake(garden);

  /* ---------- the map: what is lit, and what is under the finger ---------- */
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 8, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xFFE08A, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  const ringGlow = glow(0, -50, 0, 3, 0xFFD36B, false);
  scene.add(ring);
  let hlOn = -1, hlTimer = 0;
  // a project under the finger: its statue shines and the camera goes to its group; null gives the whole garden back
  function highlight(i) {
    const was = hlOn;
    hlOn = Number.isInteger(i) && STATUES[i] ? i : -1;
    if (hlOn >= 0) { const [x, z] = STATUES[hlOn]; ring.position.set(x, GY + 0.08, z); ringGlow.position.set(x, GY + PED + 1.0, z); }
    clearTimeout(hlTimer);
    if (hlOn === was) return D.wake();
    const c = hlOn >= 0 ? GROUPS.findIndex(g => g.includes(hlOn)) : -1, to = c >= 0 ? 'c' + c : 'map';
    // a short wait, so a finger that crosses the list does not shake the camera
    if (viewName === 'map' || viewName?.[0] === 'c') hlTimer = setTimeout(() => { if (viewName !== to) go(to, { dur: 900 }); }, 220);
    D.wake();
  }
  // the garden as the progress has it: piscina, valid (the projects validated) and stars (the exams passed)
  function state({ piscina = false, valid = [], stars: n = 0 } = {}) {
    piscinaOn = piscina;
    statues.forEach((S, i) => { S.lit = valid.includes(i); setStatue(S, S.lit ? 1 : 0); });
    stars.forEach((s, i) => { s.on = i < n; s.m.material.color.setHex(s.on ? 0xFFD36B : 0x4A4870); s.gl.material.opacity = s.on ? 0.75 : 0; });
    paintLines();
    // before the Piscina the garden is shut: no statues, no fireflies, the lanterns off, a dimmer dusk
    garden.visible = piscina; statues.forEach((S, i) => { S.fig.visible = piscina; S.fig.scale.setScalar(FIG[i] === '*' ? 1.5 : 1.55); });
    canvas.dataset.jardi = piscina ? 'obert' : 'tancat';
    flyPts.visible = piscina; D.hemi.intensity = piscina ? 0.7 : 0.55; paintLamps();
    canvas.dataset.estatues = statues.filter(S => S.lit).length; canvas.dataset.estrelles = stars.filter(s => s.on).length;
    D.wake();
  }

  /* ---------- what moves by itself ---------- */
  D.every((dt, now, raw) => {
    let busy = false;
    if (!RM) {
      flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; const k = 0.3 + 0.7 * Math.sin(q.p * 2.1) ** 2; flyCol[i * 3] = 0.85 * k; flyCol[i * 3 + 1] = k; flyCol[i * 3 + 2] = 0.55 * k; });
      if (NFL) { flyGeo.attributes.position.needsUpdate = true; flyGeo.attributes.color.needsUpdate = true; }
      stars.forEach((s, i) => { if (s.on) s.gl.material.opacity = 0.6 + Math.sin(now * 0.002 + i) * 0.15; });
      statues[0].fig.rotation.y = 0.3 + Math.sin(now * 0.0005) * 0.6;
      for (const g of stars3.values()) { const b = g.userData.bob; g.rotation.y = Math.sin(now * 0.0016 + b) * 0.55; if (!g.userData.carried) g.position.y = TY + 0.52 + Math.sin(now * 0.002 + b) * 0.06; if (g.scale.x < 1.05) g.scale.setScalar(1 + Math.sin(now * 0.0026 + b) * 0.04); }
      // the frog breathes; the wings of the fireflies beat
      if (frog.visible) { busy = true; frog.userData.t += dt; const sq = frog.userData.sq; frog.userData.body.scale.set((1 + Math.sin(frog.userData.t * 2.2) * 0.02) * (1 - 0.12 * sq), (1 + Math.sin(frog.userData.t * 2.2) * 0.03) * (1 + 0.24 * sq), 1 - 0.12 * sq); }
      for (const f of fireflies) { const a = 0.3 + 0.6 * Math.abs(Math.sin(now * 0.04)); f.userData.wings[0].rotation.x = -a; f.userData.wings[1].rotation.x = a; busy = true; }
      // the owl looks about; judging, it nods or shakes its head (on the clock, not the frames)
      if (owlDo) {
        const h = owlDo; h.t += raw; const k = Math.min(1, h.t / 0.9);
        if (h.ok) owlHead.rotation.x = Math.sin(k * Math.PI * 2) * 0.3 * (1 - k); else owlHead.rotation.y = Math.sin(k * Math.PI * 4) * 0.6 * (1 - k);
        if (k >= 1) { owlDo = null; owlHead.rotation.x = 0; }
        busy = true;
      } else owlHead.rotation.y = Math.sin(now * 0.0005) * 0.6;
      for (const g of marks.children) if (g.userData.cls === 'sel' || g.userData.cls === 'risk') { const k = 0.65 + 0.35 * Math.sin(now * 0.006); g.children.forEach(x => { x.material.opacity = (g.userData.cls === 'sel' ? 0.95 : 0.5) * k; }); }
      if (stars3.size || marks.children.some(g => g.userData.cls === 'sel' || g.userData.cls === 'risk')) busy = true;
      if (hlOn >= 0) { const p = Math.sin(now * 0.006); ring.material.opacity = 0.7 + p * 0.25; ring.scale.setScalar(1 + p * 0.05); ringGlow.material.opacity = 0.55 + p * 0.2; busy = true; }
    }
    if (hlOn < 0) { ring.material.opacity = 0; ringGlow.material.opacity = 0; } else if (RM) { ring.material.opacity = 0.9; ringGlow.material.opacity = 0.6; }
    return busy;
  });

  /* ---------- the board of the game: the pieces, the stars and the pebbles main.js puts on it ---------- */
  // Each thing is its own mesh (a piece is one geometry already, a single draw), kept by its square. The board says what it shows in
  // canvas.dataset.pos, keyed as logic.js keys a position (square and piece, by square), with the stars and the pebbles after it
  const ivoryM = std(C.ivory, { roughness: 0.32, envMapIntensity: 0.9 }), ebonyM = std(C.ebony, { roughness: 0.38, envMapIntensity: 0.8 });
  const PS = 1.05;
  const things = new THREE.Group(); scene.add(things);
  const pcs = new Map(), stars3 = new Map(), rocks3 = new Map();
  const STARG = starGeo(0.3, 0.1); STARG.userData.shared = true;
  const starM = std(0xF7C64E, { emissive: 0xB07A10, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.3 });
  const PEBBLE = new THREE.IcosahedronGeometry(1, 1); PEBBLE.userData.shared = true;
  const rockM = std(0x8C877C, { roughness: 0.9, flatShading: true }), GLOWT = glowTex();
  // takes away a thing and gives back what it holds, but for the shapes many things share
  function drop(o) { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); if (x.isSprite) x.material.dispose(); }); }
  const keyNow = () => [...pcs.keys()].sort().map(s => s + pcs.get(s).userData.p).join() + '|' + [...stars3.keys()].sort().join() + '|' + [...rocks3.keys()].sort().join();
  const said = () => { canvas.dataset.pos = keyNow(); };
  const hash = s => (s.charCodeAt(0) * 7 + s.charCodeAt(1) * 13) % 10 / 10;
  // a white knight looks to the left of the screen, a black one to the right: both show their side to the camera
  function newPiece(p, s) {
    const m = new THREE.Mesh(geoOf(p), white(p) ? ivoryM : ebonyM); m.castShadow = true; m.receiveShadow = true;
    m.scale.setScalar(PS); m.position.copy(at3(s)); m.rotation.y = p === 'n' ? Math.PI : 0;
    m.userData.p = p; things.add(m); pcs.set(s, m); return m;
  }
  function newStar(s) {
    const g = new THREE.Group(), m = new THREE.Mesh(STARG, starM); m.castShadow = true; g.add(m);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOWT, color: 0xFFD36B, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    gl.scale.setScalar(1.4); g.add(gl);
    // leaning back, so its face looks up at the camera; it rocks from side to side (a star that spun round would show its edge)
    g.rotation.order = 'YXZ'; g.rotation.x = -0.85;
    g.position.copy(at3(s)).add(V(0, 0.52, 0)); g.userData.bob = hash(s) * 6; things.add(g); stars3.set(s, g); return g;
  }
  // a pebble of the pond
  function newRock(s) {
    const m = part(PEBBLE, rockM, [0.36, 0.2, 0.31], at3(s).add(V(0, 0.1, 0)).toArray(), [0, hash(s) * 3, 0.1]); m.receiveShadow = true;
    things.add(m); rocks3.set(s, m); return m;
  }
  // gen counts the positions put on the board: a move still running stops when a new one comes
  let gen = 0, moving = 0;
  const still = () => { canvas.dataset.ocupat = moving ? '1' : '0'; };
  function setThings(pos) {
    gen++;
    for (const m of [...pcs.values(), ...stars3.values(), ...rocks3.values()]) drop(m);
    pcs.clear(); stars3.clear(); rocks3.clear();
    for (const s of Object.keys(pos.at)) newPiece(pos.at[s], s);
    pos.stars.forEach(newStar); pos.rocks.forEach(newRock);
    said(); D.wake();
  }

  // the marks: tiles of light a little above the squares, never painted on them (the squares are one picture)
  const marks = new THREE.Group(); scene.add(marks);
  const TILE = new THREE.PlaneGeometry(0.9, 0.9).rotateX(-Math.PI / 2), DOT = new THREE.CircleGeometry(0.17, 24).rotateX(-Math.PI / 2);
  // a square ring: outer half side 0.47, inner 0.39
  const FRAMEG = new THREE.RingGeometry(0.39 * Math.SQRT2, 0.47 * Math.SQRT2, 4, 1).rotateZ(Math.PI / 4).rotateX(-Math.PI / 2);
  for (const g of [TILE, DOT, FRAMEG]) g.userData.shared = true;
  // the light of a mark: plain colour, so it still shows on the light stone; add for the strips of light that glow over the board
  const glowM = (c, o = 0.5, add = false) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
  const MARK = { ok: [0x7CF5B0, 0.55], bad: [0xFF5A4A, 0.7], sel: [0xF7C64E, 0.9], dot: [0x7CF5B0, 0.9], risk: [0xFF5A4A, 0.5], ask: [0xFFFFFF, 0.9] };
  function mark(cls, list) {
    const [c, o] = MARK[cls] || [0xFFFFFF, 0.6];
    for (const s of list) {
      const g = new THREE.Group(); g.position.copy(at3(s)).add(V(0, 0.012 + (marks.children.length % 8) * 0.0005, 0)); g.userData.cls = cls;
      const ring = cls === 'sel' || cls === 'ask';
      if (!ring) g.add(new THREE.Mesh(cls === 'dot' ? DOT : TILE, glowM(c, o)));
      if (ring || cls === 'ok' || cls === 'bad' || cls === 'risk') g.add(new THREE.Mesh(FRAMEG, glowM(c, ring ? o : 0.9)));
      g.children.forEach(m => { m.renderOrder = 3; });
      marks.add(g);
      if (cls === 'ok' || cls === 'dot') tween(RM ? 0 : 260, k => g.scale.setScalar(0.3 + 0.7 * k), k => 1 - (1 - k) ** 3);
    }
    D.wake();
  }
  function clear(cls) { for (const g of marks.children.slice()) if (!cls || g.userData.cls === cls) { g.traverse(x => x.material?.dispose()); marks.remove(g); } D.wake(); }

  // what is typed: a letter raises a strip of light along its column and lights its letter on the frame; the number does the same with its
  // row, and the square where they cross shines
  const fadeTex = canvasTex(8, 64, (g, w, h) => { const r = g.createLinearGradient(0, h, 0, 0); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  function beam(along) {
    const g = new THREE.Group(), wall = new THREE.MeshBasicMaterial({ map: fadeTex, color: 0xF7C64E, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(along ? 8 : 1, along ? 1 : 8).rotateX(-Math.PI / 2), glowM(0xF7C64E, 0.3, true)));
    for (const d of [-0.5, 0.5]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.45), wall); w.position.y = 0.225; if (along) w.position.z = d; else { w.rotation.y = Math.PI / 2; w.position.x = d; } g.add(w); }
    g.children.forEach(x => { x.renderOrder = 2; });
    g.position.y = TY + 0.008; g.visible = false; scene.add(g); return g;
  }
  const colBeam = beam(false), rowBeam = beam(true);
  const cell = new THREE.Group();
  cell.add(new THREE.Mesh(TILE, glowM(0xF7C64E, 0.45))); cell.add(new THREE.Mesh(FRAMEG, glowM(0xFFE08A, 1)));
  cell.children.forEach(x => { x.renderOrder = 3; }); cell.visible = false; scene.add(cell);
  let lit = '';
  function preview(part = '') {
    const f = FILES.indexOf(part[0] || '?'), r = part[1] ? +part[1] - 1 : -1, now = (f >= 0 ? part[0] : '') + (r >= 0 ? part[1] : '');
    if (now === lit) return;
    const rise = b => { b.scale.y = 0.01; tween(RM ? 0 : 200, k => { b.scale.y = Math.max(0.01, k); }, k => 1 - (1 - k) ** 2); };
    if (f >= 0 && (!colBeam.visible || colBeam.position.x !== f - 3.5)) { colBeam.position.x = f - 3.5; rise(colBeam); }
    if (r >= 0 && (!rowBeam.visible || rowBeam.position.z !== 3.5 - r)) { rowBeam.position.z = 3.5 - r; rise(rowBeam); }
    colBeam.visible = f >= 0; rowBeam.visible = r >= 0;
    cell.visible = f >= 0 && r >= 0;
    if (cell.visible) { cell.position.copy(at3(part)).add(V(0, 0.02, 0)); D.sparkle(cell.position.clone().add(V(0, 0.2, 0)), 6, 0xFFE08A, 0.22, 0.8, 1.5); }
    for (const [k, m] of Object.entries(signs)) { const on = k === part[0] || k === part[1]; m.material.color.setHex(on ? LIT : INK); m.scale.setScalar(on ? 1.3 : 1); }
    lit = now; canvas.dataset.llum = now; D.wake();
  }

  // the tray at the front of the terrace, for the questions of points: the pieces wait in a row, and their values come out when shown
  const TRAYZ = 5.62, tray = new THREE.Group(); scene.add(tray);
  {
    const t = new THREE.Group(); t.add(mesh(boxG(3.9, 0.06, 0.95, 0, 0.03, TRAYZ), woodM));
    for (const dz of [-0.47, 0.47]) t.add(mesh(boxG(3.9, 0.12, 0.05, 0, 0.06, TRAYZ + dz), wood2));
    for (const dx of [-1.95, 1.95]) t.add(mesh(boxG(0.05, 0.12, 0.95, dx, 0.06, TRAYZ), wood2));
    bake(t); scene.add(t);
  }
  let trayBack = 'board';
  VIEWS.tray = { t: [0, 0.6, TRAYZ - 0.2], dir: [0, 0.9, 1], R: 2.4 };
  function lot(ps, vals) {
    for (const o of tray.children.slice()) drop(o);
    ps.forEach((p, i) => {
      const x = (i - (ps.length - 1) / 2) * 1.2, m = new THREE.Mesh(geoOf(p), white(p) ? ivoryM : ebonyM); m.castShadow = true; m.scale.setScalar(1.1); m.position.set(x, 0.06, TRAYZ); tray.add(m);
      const tag = label(vals ? String(vals[i]) : '?', { ink: vals ? '#F7C64E' : '#EAF8F4', edge: 'rgba(4,19,28,0.9)', h: 0.5 }); tag.position.set(x, 1.6, TRAYZ); tray.add(tag);
      if (vals) D.sparkle(V(x, 1.45, TRAYZ), 8, 0xFFD36B, 0.3, 1.2, 2);
    });
    if (viewName !== 'tray') { trayBack = viewName || 'board'; go('tray', { dur: 900 }); }
    D.wake();
  }

  // the sounds of the wood and of the water
  const toc = () => { sound.tone(196, 0, 0.07, 0.09, 'triangle'); sound.tone(392, 0.01, 0.05, 0.04, 'triangle'); };
  const plof = () => { sound.tone(440, 0, 0.06, 0.09); sound.tone(170, 0.05, 0.2, 0.12, 'triangle'); };
  const RIPPLE = new THREE.RingGeometry(0.11, 0.16, 36).rotateX(-Math.PI / 2); RIPPLE.userData.shared = true;
  function splash(at, big = 1) {
    D.sparkle(V(at.x, WY + 0.05, at.z), Math.round(10 * big), 0xCFF6FF, 0.22, 1.4 * big, 7);
    if (RM) return;
    const m = new THREE.Mesh(RIPPLE, new THREE.MeshBasicMaterial({ color: 0xCFF6FF, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
    m.position.set(at.x, WY + 0.02, at.z); scene.add(m);
    tween(750, k => { m.scale.setScalar(1 + k * 6 * big); m.material.opacity = 0.85 * (1 - k); }, k => k).then(() => { scene.remove(m); m.material.dispose(); });
  }
  // a piece captured flies off the board and falls in the pond with a «plof»
  function toWater(m, from) {
    moving++; still();
    const a = m.position.clone(), b = V(Math.max(-7, Math.min(7, from.x * 1.4 + (Math.random() - 0.5) * 3)), WY - 0.1, -8.6 - Math.random() * 1.6), spin = (Math.random() - 0.5) * 8;
    return tween(RM ? 0 : 1100, k => { m.position.lerpVectors(a, b, k); m.position.y += Math.sin(k * Math.PI) * 3.2; m.rotation.x = k * spin; m.rotation.z = k * 2; }, k => k)
      .then(() => { splash(b, 1.2); plof(); drop(m); moving--; still(); D.wake(); });
  }
  // a column of light where a pawn becomes a queen
  function column(at) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 4, 24, 1, true).translate(0, 2, 0), new THREE.MeshBasicMaterial({ map: fadeTex, color: 0xFFC94A, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.copy(at); scene.add(m);
    sound.tone(523, 0, 0.3, 0.06); sound.tone(784, 0.12, 0.4, 0.06); sound.tone(1047, 0.24, 0.5, 0.06);
    D.sparkle(at.clone().add(V(0, 0.6, 0)), 22, 0xFFE08A, 0.35, 1.8, 0.5);
    return tween(RM ? 0 : 1100, k => { m.material.opacity = Math.min(1, Math.sin(k * Math.PI) * 1.6); m.scale.set(1 - k * 0.3, 0.6 + k * 0.6, 1 - k * 0.3); }, k => k).then(() => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  }
  // A move: the piece slides over the board, the knight jumps over everything; what it lands on is taken. It resolves when the piece is
  // on its square (and a pawn is a queen); the piece taken goes on falling to the water, and ocupat says so
  async function goMove(from, to, pos) {
    const m = pcs.get(from), my = gen;
    if (!m) { setThings(pos); return; }
    moving++; still();
    const victim = pcs.get(to), star = stars3.get(to);
    pcs.delete(from); pcs.set(to, m);
    if (star) stars3.delete(to);
    said();
    const a = at3(from), b = at3(to), d = a.distanceTo(b), jump = m.userData.p.toUpperCase() === 'N';
    sound.tone(330, 0, 0.12, 0.06, 'triangle');
    const dur = jump ? 620 : Math.min(820, 300 + d * 75), h = jump ? 1.25 : 0.16;
    let hit = false;
    await tween(RM ? 0 : dur, k => {
      if (my !== gen) return;
      m.position.lerpVectors(a, b, k); m.position.y = TY + Math.sin(k * Math.PI) * h;
      // the piece in the way of the one that arrives is knocked off a little before
      if (!hit && victim && k > 0.82) { hit = true; toWater(victim, b); }
    }, jump ? k => k : ease);
    if (my !== gen) { moving--; still(); return; }
    if (victim && !hit) toWater(victim, b);
    m.position.copy(b); toc();
    if (star) {
      const at = star.position.clone();
      star.traverse(x => { if (x.material && !x.isSprite) { x.material = x.material.clone(); x.material.transparent = true; } });
      tween(RM ? 0 : 380, k => { star.scale.setScalar(1 + k); star.traverse(x => { if (x.material) x.material.opacity = 1 - k; }); }, k => k).then(() => { star.traverse(x => { if (x.material && !x.isSprite) x.material.dispose(); }); drop(star); });
      D.sparkle(at, 20, 0xFFD36B, 0.4, 2.2, 2);
    }
    // a pawn at the end of the board becomes a queen inside a column of light
    if (pos.at[to] && pos.at[to] !== m.userData.p) {
      const c = column(b);
      await new Promise(r => setTimeout(r, RM ? 0 : 420));
      if (my === gen) { m.geometry = geoOf(pos.at[to]); m.userData.p = pos.at[to]; said(); }
      await c;
    }
    moving--; still(); D.wake();
  }
  // the board of the game, with the same calls as tauler() of viz.js, and lot() for the pieces of a question of points
  const B = {
    draw(pos, o = {}) {
      clear(); for (const x of [...tray.children, ...guests.children]) drop(x);
      preview(''); setThings(pos);
      boardM.map = o.plain ? TEX.plain : TEX.board;
      for (const m of Object.values(signs)) m.visible = !o.blind;
      if (o.sel?.length) mark('sel', o.sel);
      if (o.ask?.length) mark('ask', o.ask);
      if (viewName === 'tray') go(trayBack, { dur: 900 });
      D.wake();
    },
    set: setThings,
    go: goMove,
    mark, clear, preview, lot,
    point(s) { const c = D.onScreen(at3(s)), e = D.onScreen(at3(s).add(V(0.5, 0, 0))); return { x: c.x, y: c.y, w: 2 * Math.abs(e.x - c.x), bottom: c.y }; }
  };
  canvas.dataset.ocupat = '0'; canvas.dataset.pos = ''; canvas.dataset.llum = ''; canvas.dataset.granota = '';

  /* ---------- a guest for each question ---------- */
  // what a guest leaves on the board (the labels of the frog's steps): gone with the next position
  const guests = new THREE.Group(); scene.add(guests);
  const sg = n => n > 0 ? '+' + n : '−' + -n;
  // The questions of a star: a firefly brings the star and leaves it on its square. dur is the flight, short in a lightning round
  const fireflies = [];
  function firefly() {
    const g = new THREE.Group();
    g.add(part(SPH, mat(0x2A2416), [0.07, 0.06, 0.12], [0, 0, 0.04]));
    const tail = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOWT, color: 0xD8FF6A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    tail.scale.setScalar(0.8); tail.position.set(0, -0.02, -0.1); g.add(tail);
    const wingM = new THREE.MeshBasicMaterial({ color: 0xDFF8FF, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
    g.userData.wings = [-1, 1].map(s => { const w = new THREE.Mesh(new THREE.CircleGeometry(0.11, 10).scale(1, 0.5, 1).rotateX(-Math.PI / 2).translate(s * 0.1, 0.05, 0.02), wingM); g.add(w); return w; });
    g.scale.setScalar(1.3); scene.add(g); fireflies.push(g);
    return g;
  }
  function bring(s, dur = 850) {
    const st = stars3.get(s);
    if (!st || RM) return Promise.resolve();
    const end = st.position.clone(), from = end.clone().add(V(end.x < 0 ? 4.5 : -4.5, 3.4, -2.5)), f = firefly();
    st.userData.carried = true; st.position.copy(from); moving++; still();
    sound.tone(1320, 0, 0.06, 0.03); sound.tone(1760, 0.08, 0.08, 0.03);
    return tween(dur, k => { const p = from.clone().lerp(end, k); p.y += Math.sin(k * Math.PI) * 0.9; if (st.parent) st.position.copy(p); f.position.copy(p).add(V(0, 0.42, 0)); f.rotation.y = Math.atan2(end.x - from.x, end.z - from.z); }, ease)
      .then(() => {
        st.userData.carried = false; D.sparkle(end, 6, 0xFFE08A, 0.2, 0.8, 1.5);
        const a = f.position.clone(), b = a.clone().add(V(end.x < 0 ? -3 : 3, 3, -3));
        return tween(RM ? 0 : 600, k => { f.position.lerpVectors(a, b, k); f.scale.setScalar(1.3 * (1 - k)); }, k => k);
      })
      .then(() => { fireflies.splice(fireflies.indexOf(f), 1); drop(f); moving--; still(); });
  }
  // The questions of steps («Surt de b2 i fes…»): the frog sits on the square it starts from and, when the answer is right, makes the
  // steps: first the letters, then the numbers, with the label of each stretch
  const frog = makeFrog(); frog.scale.setScalar(0.5); frog.visible = false; frog.userData.t = 0; frog.userData.sq = 0; scene.add(frog);
  let frogAt = null;
  const hop = (to, dur = 260, h = 0.4) => { const a = frog.position.clone(); return tween(RM ? 0 : dur, k => { frog.position.lerpVectors(a, to, k); frog.position.y += Math.sin(k * Math.PI) * h; frog.userData.sq = Math.sin(k * Math.PI); }, k => k).then(() => { frog.userData.sq = 0; }); };
  // the frog on square s; null sends it away
  function frogOn(s) {
    frogAt = s || null; canvas.dataset.granota = frogAt || '';
    if (!s) { frog.visible = false; D.wake(); return Promise.resolve(); }
    const to = at3(s);
    frog.rotation.y = 0;
    if (!frog.visible) { frog.visible = true; frog.position.copy(to).add(V(0, 1.2, 0)); return hop(to, 320, 0); }
    return hop(to, 360, 0.6);
  }
  // All the hops in one tween, so the steps end on the clock even when the frames are slow: hop i of the way goes from way[i] to way[i + 1]
  async function walk(from, df, dr) {
    if (frogAt !== from) await frogOn(from);
    const [f0, r0] = fr(from), way = [from], legs = [];
    for (const [d, along] of [[df, 'f'], [dr, 'r']]) {
      if (!d) continue;
      const [f, r] = fr(way[way.length - 1]);
      legs.push({ at: way.length - 1, d, along, from: way[way.length - 1], to: along === 'f' ? FILES[f + d] + (r + 1) : FILES[f] + (r + 1 + d) });
      for (let i = 1; i <= Math.abs(d); i++) way.push(along === 'f' ? FILES[f + i * Math.sign(d)] + (r + 1) : FILES[f] + (r + 1 + i * Math.sign(d)));
    }
    const n = way.length - 1, end = way[n];
    if (!n || f0 < 0 || r0 < 0) return;
    moving++; still();
    const per = Math.max(110, Math.min(240, 1400 / n));
    let at = -1;
    await tween(RM ? 0 : n * per, k => {
      const x = Math.min(n - 1e-6, k * n), i = Math.floor(x), q = x - i;
      if (i !== at) {
        at = i;
        // a new stretch: its label, and the frog turns to where it goes
        const L = legs.find(l => l.at === i);
        if (L) {
          const tag = label(sg(L.d), { ink: L.along === 'f' ? '#6FE3FF' : '#FF8FD0', edge: 'rgba(4,19,28,0.9)', h: 0.55 });
          tag.position.copy(at3(L.from).add(at3(L.to)).multiplyScalar(0.5)).add(V(0, 1.15, 0)); guests.add(tag);
          frog.rotation.y = L.along === 'f' ? (L.d > 0 ? Math.PI / 2 : -Math.PI / 2) : (L.d > 0 ? Math.PI : 0);
        }
        sound.tone(523 * 2 ** ((i % 8) / 12), 0, 0.08, 0.05);
      }
      frog.position.lerpVectors(at3(way[i]), at3(way[i + 1]), q); frog.position.y += Math.sin(q * Math.PI) * 0.35; frog.userData.sq = Math.sin(q * Math.PI);
    }, k => k);
    if (RM) { for (const L of legs) { const tag = label(sg(L.d), { ink: L.along === 'f' ? '#6FE3FF' : '#FF8FD0', edge: 'rgba(4,19,28,0.9)', h: 0.55 }); tag.position.copy(at3(L.from).add(at3(L.to)).multiplyScalar(0.5)).add(V(0, 1.15, 0)); guests.add(tag); } }
    frog.position.copy(at3(end)); frog.userData.sq = 0; frog.rotation.y = 0; frogAt = end; canvas.dataset.granota = end;
    moving--; still(); D.wake();
  }
  // the guests go away (another screen)
  function rest() { frogOn(null); for (const x of guests.children.slice()) drop(x); clock(0); writeSheet([]); }

  /* ---------- the places of the modes ---------- */
  // The Piscina: the garden is shut until it is done (no statues, the lanterns off, no fireflies); open() lights it before the child's eyes
  function open() {
    piscinaOn = true;
    return go('map').then(async () => {
      sound.tone(523, 0, 0.3, 0.07); sound.tone(659, 0.12, 0.3, 0.07); sound.tone(784, 0.24, 0.5, 0.08);
      garden.visible = true; flyPts.visible = true; flyPts.material.opacity = 0;
      const ys = statues.map(S => S.fig.position.y);
      statues.forEach(S => { S.fig.visible = true; S.fig.scale.multiplyScalar(0.001); });
      paintLamps(true);
      lamps.forEach(L => { L.gl.material.opacity = 0; });
      await tween(RM ? 0 : 1800, k => {
        statues.forEach((S, i) => { const q = Math.max(0, Math.min(1, k * 1.6 - i * 0.07)); S.fig.scale.setScalar((FIG[i] === '*' ? 1.5 : 1.55) * Math.max(0.001, 1 - (1 - q) ** 3)); S.fig.position.y = ys[i] - (1 - q) * 0.6; });
        lamps.forEach(L => { L.gl.material.opacity = 0.95 * k; }); flyPts.material.opacity = k; D.hemi.intensity = 0.55 + 0.15 * k;
      }, k => k);
      canvas.dataset.jardi = 'obert';
      D.celebrate(3, V(0, 2, 0));
    });
  }

  // The exam: an owl watches from the branch of a tree behind the board; it nods to a right answer and shakes its head at a wrong one
  VIEWS.exam = { t: [-0.2, 0.2, -1.6], dir: [0, 1.45, 1], R: 5.5 };
  const owl = new THREE.Group(), owlHead = new THREE.Group();
  {
    const tx = -3.9, tz = -6.9;
    const branch = new THREE.Group();
    branch.add(mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.6, 8).translate(tx, GY + 1.3, tz), trunkM));
    branch.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.4, 6).rotateX(Math.PI / 2 - 0.2).translate(tx, GY + 1.3, tz + 0.65), trunkM));
    for (let i = 0; i < 3; i++) branch.add(part(new THREE.IcosahedronGeometry(1, 1), std(C.leaf[i], { flatShading: true, roughness: 0.8 }), [0.9, 0.7, 0.9], [tx + (i - 1) * 0.55, GY + 2.9 + (i % 2) * 0.3, tz - 0.2]));
    bake(branch); scene.add(branch);
    const brown = mat(0x8A6A4A), light = mat(0xE8D6B8), dark = mat(0x2A1C10), yellow = mat(0xF7C64E, { emissive: 0x6A4A00, emissiveIntensity: 0.4 });
    owl.add(part(SPH, brown, [0.26, 0.32, 0.24], [0, 0.32, 0]));
    owl.add(part(SPH, light, [0.17, 0.22, 0.1], [0, 0.28, 0.16]));
    for (const s of [-1, 1]) owl.add(part(SPH, brown, [0.08, 0.2, 0.16], [s * 0.24, 0.32, -0.02], [0, 0, s * 0.2]));
    owlHead.position.set(0, 0.66, 0); owl.add(owlHead);
    owlHead.add(part(SPH, brown, [0.24, 0.21, 0.21], [0, 0, 0]));
    for (const s of [-1, 1]) {
      owlHead.add(part(SPH, light, [0.1, 0.1, 0.04], [s * 0.1, 0.02, 0.18]));
      owlHead.add(part(SPH, yellow, [0.062, 0.062, 0.03], [s * 0.1, 0.02, 0.21]));
      owlHead.add(part(SPH, dark, [0.034, 0.034, 0.02], [s * 0.1, 0.02, 0.235]));
      owlHead.add(part(new THREE.ConeGeometry(1, 1, 6), brown, [0.05, 0.14, 0.05], [s * 0.15, 0.2, 0], [0, 0, -s * 0.35]));
    }
    owlHead.add(part(new THREE.ConeGeometry(1, 1, 6), mat(0xD9A441), [0.03, 0.07, 0.03], [0, -0.06, 0.22], [Math.PI, 0, 0]));
    bake(owlHead); owlHead.userData.own = true; bake(owl);
    owl.position.set(tx, GY + 1.33, tz + 1.3); owl.scale.setScalar(1.15); scene.add(owl);
  }
  let owlDo = null;
  function judge(ok) { owlDo = { ok, t: 0 }; D.wake(); }
  // a star of the knight in the sky comes on: the camera goes up to it and back
  function star(i) {
    const s = stars[i]; if (!s) return Promise.resolve();
    const back = viewName;
    return go('sky').then(async () => {
      sound.tone(988, 0, 0.5, 0.07); sound.tone(1319, 0.2, 0.6, 0.06);
      await tween(RM ? 0 : 900, k => { s.m.material.color.setHex(0x4A4870).lerp(new THREE.Color(0xFFD36B), k); s.gl.material.opacity = 0.75 * k; s.m.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.8); }, k => k);
      s.on = true; paintLines(); canvas.dataset.estrelles = stars.filter(q => q.on).length;
      D.sparkle(s.m.position.clone(), 16, 0xFFD36B, 0.6, 2.5, 1);
      await new Promise(r => setTimeout(r, RM ? 0 : 1100));
      if (back) go(back);
    });
  }

  // The lightning round: a chess clock at the front of the terrace counts the minute (k from 0 to 1); its flag falls when it is over
  VIEWS.rapid = { t: [0.5, 0.3, 1.0], dir: [0, 1.5, 1], R: 5.6 };
  const CLK = { x: 4.0, z: 5.7 };
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.17, 0.02).translate(0, 0.075, 0), mat(0x1A1A1A)), flag = new THREE.Group();
  {
    const c = new THREE.Group(), woodC = std(0x6B3E22, { roughness: 0.5 }), face = mat(0xF4EEDF, { roughness: 0.4 });
    c.add(mesh(boxG(1.25, 0.5, 0.42, 0, 0.25, 0), woodC));
    c.add(mesh(boxG(1.3, 0.06, 0.48, 0, 0.53, 0), woodC));
    for (const s of [-1, 1]) {
      c.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 28).rotateX(Math.PI / 2).translate(s * 0.3, 0.27, 0.22), face));
      c.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12).translate(s * 0.3, 0.61, 0), s < 0 ? mat(0xD9474F) : mat(0x2A2F3A)));
    }
    const clk = new THREE.Group(); clk.position.set(CLK.x, 0, CLK.z); clk.scale.setScalar(1.4); clk.rotation.y = -0.25; scene.add(clk);
    bake(c); clk.add(c);
    // the hand of the left dial, and its red flag at the twelve
    hand.position.set(-0.3, 0.27, 0.255); hand.userData.keep = true; clk.add(hand);
    flag.add(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([V2(0, 0), V2(0.09, 0.03), V2(0, 0.07)])), mat(0xD9474F, { side: THREE.DoubleSide })));
    flag.position.set(-0.3, 0.44, 0.25); clk.add(flag);
  }
  let clockSec = -1;
  function clock(k) {
    k = Math.max(0, Math.min(1, k || 0));
    hand.rotation.z = -k * Math.PI * 2;
    // a soft tick each second; at the end the flag falls
    const sec = Math.floor(k * 60);
    if (k > 0 && k < 1 && sec !== clockSec) sound.tone(1250, 0, 0.02, 0.025, 'square');
    clockSec = sec;
    if (k >= 1 && flag.rotation.z === 0) { tween(RM ? 0 : 500, q => { flag.rotation.z = -q * 2.2; }, q => q * q); sound.tone(220, 0, 0.3, 0.1, 'triangle'); }
    if (k < 1) flag.rotation.z = 0;
    canvas.dataset.rellotge = k >= 1 ? 'temps' : sec;
    D.wake();
  }

  // «Caça l'errada»: a lectern at the front of the terrace with the sheet on it; what the sheet says is written on its paper
  VIEWS.lectern = { t: [-4.1, 1.05, 5.7], dir: [0.2, 0.42, 1], R: 1.45 };
  const paper = canvasTex(512, 384, () => {});
  function writeSheet(lines = []) {
    const c = paper.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.fillStyle = '#FFF8E1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#E4D9B6'; for (let y = 46; y < h; y += 46) g.fillRect(0, y, w, 2);
    let y = 70;
    for (const L0 of lines) {
      const L = typeof L0 === 'string' ? { t: L0 } : L0;
      g.font = `800 ${L.s || 50}px "Baloo 2", system-ui, sans-serif`; g.fillStyle = L.c || '#2A2416'; g.textAlign = 'center'; g.textBaseline = 'middle';
      // the words wrapped to the width of the sheet
      const words = L.t.split(' '); let row = '';
      for (const wd of words) { const next = row ? row + ' ' + wd : wd; if (g.measureText(next).width > w - 50 && row) { g.fillText(row, w / 2, y); y += (L.s || 50) * 1.15; row = wd; } else row = next; }
      if (row) { g.fillText(row, w / 2, y); y += (L.s || 50) * 1.3; }
    }
    paper.needsUpdate = true; D.wake();
  }
  {
    const l = new THREE.Group(), woodL = std(C.wood, { roughness: 0.6 });
    l.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.0, 8).translate(0, 0.5, 0), woodL));
    l.add(mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.06, 12).translate(0, 0.03, 0), woodL));
    const desk = new THREE.Group(); desk.position.set(0, 1.05, 0); desk.rotation.x = 0.55; l.add(desk);
    desk.add(mesh(boxG(1.3, 0.05, 1.0, 0, 0, 0), woodL));
    desk.add(mesh(boxG(1.3, 0.08, 0.05, 0, 0.04, 0.5), woodL));
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.87).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: paper, roughness: 0.9 }));
    sheet.position.y = 0.03; sheet.userData.keep = true; desk.add(sheet);
    bake(l); l.position.set(-4.1, 0, 5.7); scene.add(l);
  }
  writeSheet([]);

  /* ---------- check and mate ---------- */
  // the king mated falls on its side
  function topple(s) {
    const m = pcs.get(s); if (!m) return Promise.resolve();
    const p0 = m.position.clone(), my = gen;
    return tween(RM ? 0 : 750, k => { if (my !== gen) return; m.rotation.z = -k * 1.42; m.position.x = p0.x + k * 0.15; m.position.y = p0.y + k * 0.3 * PS; }, k => k * k).then(() => { if (my === gen) { toc(); D.shake(0.06); } });
  }

  /* ---------- a project validated: the camera goes back to the garden and its statue turns to gold before the child's eyes ---------- */
  function validate(i) {
    const S = statues[i]; if (!S) return Promise.resolve();
    const c = GROUPS.findIndex(g => g.includes(i)), gold = new THREE.Color(C.gold);
    return go('c' + c).then(async () => {
      S.fig.material = S.m; S.fig.visible = true;
      sound.tone(523, 0, 0.3, 0.08); sound.tone(784, 0.15, 0.4, 0.08); sound.tone(1047, 0.3, 0.5, 0.07);
      await tween(RM ? 0 : 1200, k => { S.m.color.lerpColors(S.base, gold, k); S.m.emissive.setHex(0x6A4A00).multiplyScalar(k); }, k => k);
      S.m.color.copy(S.base); S.m.emissive.setHex(0); S.lit = true; setStatue(S, 1);
      canvas.dataset.estatues = statues.filter(q => q.lit).length;
      const top = S.fig.position.clone().add(V(0, 1.4, 0));
      D.sparkle(top, 20, 0xFFD36B, 0.45, 2.2, 2); D.celebrate(3, top);
    });
  }
  // sparkles over a square, of the hue of the old sparks of the page
  const spark = (s, hue = 48) => D.sparkle(at3(s).add(V(0, 0.35, 0)), 16, new THREE.Color().setHSL(hue / 360, 0.95, 0.65).getHex(), 0.32, 1.8, 2.2);

  let sound = { tone() {} };
  return { ok: true, layout, go, get view() { return viewName; }, state, highlight, pause: D.pause, celebrate: (t, at) => D.celebrate(t, at), shake: D.shake,
    tauler: () => B, spark, bring, frog: frogOn, walk, rest, topple, validate, open, judge, star, clock, sheet: writeSheet,
    hear: o => { sound = { ...sound, ...o }; }, lamps: hue => { lampHue = hue; paintLamps(); },
    // for the checks (scripts/flow-escacs.mjs): the pieces still in the scene, the ones falling to the water too
    _: { D, statues, stars, signs, TEX, boardM, tween, setStatue, pieces: () => things.children.filter(m => m.userData.p).length,
      marks: () => marks.children.map(g => g.userData.cls), owl: () => D.onScreen(owlHead.getWorldPosition(V(0, 0, 0))) } };
}

/* ---------- the frog of the steps: Salts de Granota's, a bit simpler ---------- */
// about one unit tall, looking at +z; its body breathes (userData.body)
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4) };
  g.add(body);
  body.add(part(SPH, k.body, [0.5, 0.36, 0.46], [0, 0.38, 0]));
  body.add(part(SPH, k.belly, [0.34, 0.24, 0.12], [0, 0.32, 0.36]));
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
  bake(body);
  g.userData.body = body;
  return g;
}

// many geometries into one, with their positions and normals only
function mergeAll(gs) {
  const g = new THREE.BufferGeometry(), pos = [], nor = [];
  for (const x of gs) { const y = x.index ? x.toNonIndexed() : x; pos.push(...y.attributes.position.array); nor.push(...y.attributes.normal.array); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
// the soft light of a firefly
function softTex() {
  return canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
