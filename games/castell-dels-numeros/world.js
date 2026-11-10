// El castell dels números in 3D, built on shared/diorama.js: a block of earth floating in the dusk with a castle being built on it. At the
// back, the castle of nine parts (three foundations, three walls with the gate in the middle, three towers) behind a moat; in front of it,
// the yard of the works, and the pond on the right. A part not built yet is a blueprint of light; a project validated raises it in stone,
// with its windows lit. Every exam passed raises a banner by the moat.
// Every puzzle that is a thing has its place, and the camera flies there: the tower of bricks and the balance in the yard, the padlock
// at the head of the bridge, the machine on its bench, the series on the lily pads of the moat and the path of stones in the pond. The
// puzzles that are paper stay drawn in the panel (draw.js), and the frog of the works waits at its table of plans.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL castle() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, glowTex, ease, easeOut, SPH, V } from '../../shared/diorama.js';
import { RM, sleep } from '../../shared/util.js';
import { CIRCLES, barOf, undo, stone } from './logic.js';
import { api, cellHTML, barSVG } from './draw.js';

/* ---------- the measures of the world ---------- */
// One unit is about a brick. The grass at 0; the block from YB up, x from X0 to X1 and z from Z0 (back) to Z1 (front); the water at WY
// over a bottom at BY
const YB = -4.6, WY = -0.3, BY = -1.25, X0 = -12, X1 = 12, Z0 = -12.4, Z1 = 9.2;
// the moat: a long stadium in front of the castle, from -MX to MX, MZ its middle and MR half its width
const MZ = -2.9, MR = 0.95, MX = 10.4;
const MOAT = [
  ...Array.from({ length: 13 }, (_, i) => { const a = -Math.PI / 2 + i / 12 * Math.PI; return [MX - MR + Math.cos(a) * MR, MZ + Math.sin(a) * MR]; }),
  ...Array.from({ length: 13 }, (_, i) => { const a = Math.PI / 2 + i / 12 * Math.PI; return [-MX + MR + Math.cos(a) * MR, MZ + Math.sin(a) * MR]; })
];
// the pond: an ellipse round PC with radii PR, at the front on the right
const PC = [5.7, 5.9], PR = [4.6, 2.65];
const wob = a => 1 + 0.035 * Math.sin(3 * a + 0.4) + 0.025 * Math.sin(5 * a + 1.3);
const POND = Array.from({ length: 64 }, (_, i) => { const a = i / 64 * Math.PI * 2, k = wob(a); return [PC[0] + PR[0] * Math.cos(a) * k, PC[1] + PR[1] * Math.sin(a) * k]; });
// the plinth of the castle (its three foundations) is FH tall; the walls and the towers stand on it
const FH = 0.7;
// where each scene is played, on the grass or on the water: [x, z]
export const SPOT = { pyr: [-6.6, 2.1], bal: [0, 2.7], mach: [6.7, 1.45], lock: [0, -1.25], ser: [-5.0, MZ], path: [PC[0], PC[1]], desk: [-6.9, 6.7] };
const GROUPS = CIRCLES.map(c => c.projects);
// the colour of the banner of each circle (the rings of the map)
const RING = [28, 205, 330];

const C = {
  grass: 0x6DBB6A, grass2: 0x4F9C58, water: 0x2B8FA8, pad: 0x4FA65A, wood: 0x8B5A3C, wood2: 0x6E4426,
  stone: 0xD9CFBC, stone2: 0xB8AA93, stone3: 0x9C8E78, dark: 0x241A12, roof: 0xD9574C, roof2: 0x5E7BE0, iron: 0x4A4F57, gold: 0xF2C14E,
  leaf: [0x4E9F5B, 0x67B565, 0x3F8A4E]
};

export function castle(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('castell 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, hear() {}, lamps() {}, rest() {},
    stage: () => null, where: () => null, validate: p, banner: p, brick() {}, frogSay() {} };
}

function build(canvas) {
  const VIEWS = {
    map: { t: [0, 0.6, -2.2], dir: [0.22, 0.86, 1], R: 12.2 },
    // the castle whole, and one view per circle: its height of the castle
    castle: { t: [0, 3.0, -6.6], dir: [0, 0.42, 1], R: 6.9 },
    c0: { t: [0, 0.5, -6.6], dir: [0.15, 0.75, 1], R: 6.2 },
    c1: { t: [0, 1.9, -5.4], dir: [0.1, 0.5, 1], R: 5.7 },
    c2: { t: [0, 4.0, -6.4], dir: [0.1, 0.38, 1], R: 6.0 },
    desk: { t: [SPOT.desk[0] + 0.3, 1.0, SPOT.desk[1]], dir: [0.35, 0.75, 1], R: 2.3 }
  };
  const D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-14, 18, 14], shadow: { left: -14, right: 14, top: 13, bottom: -14 }, floor: YB - 4, under: [0, YB - 2.5, -1.6, 34, 32] });
  const { scene, glow, tween } = D;
  const fixed = new THREE.Group(); scene.add(fixed);
  // the view on show, by name: diorama's layout() flies the camera again with the view itself and forgets its name, and the sway of the map
  // only comes with the name, so it is kept here and given back after a layout
  let viewName = 'map';
  const go = (v, o) => { viewName = typeof v === 'string' ? v : null; return D.go(v, o); };
  const layout = (kind, x) => { D.layout(kind, x); if (viewName && D.view !== viewName) D.go(viewName, { dur: 700 }); };
  // the numbers are written with the font of the page: drawn again once it is there
  document.fonts?.load?.('800 120px "Baloo 2"').then(() => D.wake()).catch(() => {});

  /* ---------- the block of earth, with the moat and the pond cut into its top ---------- */
  const soilTex = canvasTex(256, 512, (g, w, h) => {
    const bands = ['#6E9F4E', '#7A4E2D', '#8E5E36', '#6B4226', '#9A6B43', '#5C3820', '#7E5131'], hs = [10, 70, 60, 80, 70, 110, 120];
    let y = 0; bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, y, w, hs[i]); y += hs[i]; });
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 3 ? '40,25,15' : '200,180,150'},${0.15 + Math.random() * 0.25})`; const r = 1 + Math.random() * 5; g.beginPath(); g.ellipse(Math.random() * w, 14 + Math.random() * (h - 14), r * 1.6, r, 0, 0, 7); g.fill(); }
  });
  soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  const HB = -YB;
  const outline = (pts, path) => { pts.forEach(([x, z], i) => i ? path.lineTo(x, -z) : path.moveTo(x, -z)); path.closePath(); return path; };
  {
    const s = new THREE.Shape();
    s.moveTo(X0, -Z1); s.lineTo(X1, -Z1); s.lineTo(X1, -Z0); s.lineTo(X0, -Z0); s.closePath();
    s.holes.push(outline(MOAT, new THREE.Path()), outline(POND, new THREE.Path()));
    const g = new THREE.ExtrudeGeometry(s, { depth: -BY, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2).translate(0, BY, 0);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 + p.getY(i) / HB);
    const wallTex = soilTex.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(0.12, 1);
    scene.add(mesh(g, [std(C.grass, { roughness: 0.9 }), std(0xffffff, { map: wallTex, roughness: 0.95 })], { cast: false }));
    const bt = soilTex.clone(); bt.needsUpdate = true; bt.repeat.set(1.5, (BY - YB) / HB);
    const side = std(0xffffff, { map: bt, roughness: 0.95 }), mud = std(0x4A3A26, { roughness: 1 }), dark = std(0x3A2617, { roughness: 1 });
    scene.add(mesh(boxG(X1 - X0, BY - YB, Z1 - Z0, (X0 + X1) / 2, (BY + YB) / 2, (Z0 + Z1) / 2), [side, side, mud, dark, side, side], { cast: false }));
  }
  // the water of the moat and of the pond
  const waterM = std(C.water, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.88, envMapIntensity: 1.25, emissive: 0x0B3F52, emissiveIntensity: 0.35 });
  for (const pts of [MOAT, POND]) {
    const w = mesh(new THREE.ShapeGeometry(outline(pts, new THREE.Shape()), 4).rotateX(-Math.PI / 2).translate(0, WY, 0), waterM, { cast: false });
    w.renderOrder = 1; scene.add(w);
  }
  // lily pads, reeds and pebbles round the pond
  const padM = std(C.pad, { roughness: 0.6, side: THREE.DoubleSide }), flowerM = std(0xFFB3D9, { emissive: 0xFF5FA8, emissiveIntensity: 0.15 });
  for (const [x, z, r] of [[1.9, 6.4, 0.42], [2.5, 7.6, 0.34], [9.6, 5.0, 0.4], [9.0, 7.4, 0.36], [3.2, 4.0, 0.3], [-9.6, MZ + 0.3, 0.36], [9.4, MZ - 0.2, 0.4]]) {
    fixed.add(mesh(new THREE.CircleGeometry(r, 24, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2).translate(x, WY + 0.02, z), padM, { cast: false }));
    if (r > 0.38) fixed.add(part(SPH, flowerM, [0.12, 0.09, 0.12], [x + 0.08, WY + 0.08, z - 0.05]));
  }
  const IC = new THREE.IcosahedronGeometry(1, 0), pebM = std(0xA69C8A, { roughness: 0.9, flatShading: true });
  for (let i = 0; i < 40; i++) { const [x, z] = POND[(i * 5) % 64], s = 0.15 + (i * 37 % 10) / 42; fixed.add(part(IC, pebM, [s, s * 0.55, s], [x, 0.02, z])); }
  const reedM = std(0x3E7F47), catM = std(0x6B4226, { roughness: 0.9 });
  for (const [i0, n] of [[6, 5], [20, 4], [40, 5], [54, 4]]) for (let j = 0; j < n; j++) {
    const [x, z] = POND[(i0 + j) % 64], h = 0.9 + (j % 3) * 0.3, dx = (x - PC[0]) * 0.03, dz = (z - PC[1]) * 0.05;
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5).translate(x - dx, WY + h / 2, z - dz), reedM));
    if (j % 2 === 0) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8).translate(x - dx, WY + h - 0.05, z - dz), catM));
  }
  // trees, bushes and flowers on the grass
  const trunkM = std(0x7A5230);
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(C.leaf[(i + Math.round(Math.abs(x))) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-10.4, -8.6, 1.4], [10.3, -8.8, 1.3], [-8.0, -11.0, 1.0], [8.2, -11.2, 1.1], [-10.9, 8.2, 0.8], [11.0, 0.4, 0.85], [-11.0, 3.6, 0.8]]) tree(x, z, s);
  const bushM = std(C.grass2, { flatShading: true });
  for (const [x, z, s] of [[-10.8, -5.0, 0.5], [10.9, -5.4, 0.45], [-6.4, -10.6, 0.5], [6.4, -10.8, 0.45], [-3.8, 8.4, 0.4], [-10.8, 6.0, 0.45], [11.1, 3.2, 0.4]])
    fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  for (let i = 0; i < 30; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.06, 0.05, 0.06], [i % 2 ? -10.9 + (i * 13 % 30) / 10 : 7.6 + (i * 7 % 36) / 10, 0.06, i % 2 ? -1 + (i * 47 % 90) / 10 : -10.6 + (i * 29 % 60) / 10]));
  // rocks round the castle, as if it stood on the hill
  const rockM = std(0x8F877A, { roughness: 0.95, flatShading: true });
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI, x = Math.cos(a) * 6.6, z = -7.2 - Math.sin(a) * 3.6, s = 0.35 + (i * 17 % 7) / 14; fixed.add(part(IC, rockM, [s * 1.3, s * 0.7, s], [x, 0.05, z], [0, i, 0])); }

  /* ---------- the castle: nine parts, each a blueprint or stone ---------- */
  const stoneM = std(C.stone, { roughness: 0.85 }), stone2M = std(C.stone2, { roughness: 0.85 }), stone3M = std(C.stone3, { roughness: 0.9 });
  const darkM = std(C.dark, { roughness: 1 }), roofM = std(C.roof, { roughness: 0.6 }), roof2M = std(C.roof2, { roughness: 0.55 }), ironM = std(C.iron, { metalness: 0.5, roughness: 0.45 });
  const woodM = std(C.wood, { roughness: 0.7 }), wood2M = std(C.wood2, { roughness: 0.75 });
  const winM = std(0xFFD46B, { emissive: 0xFFB030, emissiveIntensity: 1.4, roughness: 0.4 });
  // the battlements along a wall from xa to xb (or round a tower) at height y
  const merlons = (xa, xb, z, y, d = 0.5) => { const out = []; for (let x = xa + 0.16; x < xb - 0.05; x += 0.62) out.push(boxG(0.32, 0.32, d, x + 0.0, y + 0.16, z)); return out; };
  const ringMerlons = (cx, cz, r, y, n = 12) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return new THREE.BoxGeometry(0.3, 0.32, 0.3).rotateY(-a).translate(cx + Math.cos(a) * r, y + 0.16, cz + Math.sin(a) * r); });
  // the lines of the stone courses on a face looking at +z
  const courses = (xa, xb, z, y0, y1) => { const out = []; for (let y = y0 + 0.42; y < y1 - 0.1; y += 0.42) out.push(boxG(xb - xa, 0.04, 0.03, (xa + xb) / 2, y, z + 0.015)); return out; };
  const arch = (w, h) => { const s = new THREE.Shape(), r = w / 2; s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.closePath(); return new THREE.ShapeGeometry(s, 12); };
  // [the geometries of a part with their material], each part standing on y = 0 of its own (it is raised to where it stands)
  function partOf(i) {
    const L = [], add = (m, ...gs) => gs.flat().forEach(g => L.push([g, m]));
    const plinth = (xa, xb) => {
      add(stone3M, boxG(xb - xa, FH, 5.6, (xa + xb) / 2, FH / 2, -7.1));
      add(stone2M, boxG(xb - xa + 0.08, 0.1, 5.68, (xa + xb) / 2, FH - 0.03, -7.1));
      add(stone2M, courses(xa, xb, -4.3, 0, FH + 0.4));
    };
    if (i === 0) plinth(-5.5, -1.7);
    if (i === 2) plinth(1.7, 5.5);
    if (i === 1) plinth(-1.7, 1.7);
    const side = sg => {
      // a curtain wall at the front and one going back, on the side sg (-1 the left)
      const xa = sg < 0 ? -4.1 : 1.7, xb = sg < 0 ? -1.7 : 4.1, H = 1.9;
      add(stoneM, boxG(xb - xa, H, 0.5, (xa + xb) / 2, H / 2, -4.95));
      add(stone2M, courses(xa, xb, -4.7, 0, H));
      add(stoneM, merlons(xa, xb, -4.83, H, 0.24));
      add(stoneM, boxG(0.5, H, 4.2, sg * 4.65, H / 2, -7.5));
      add(stoneM, merlons(0, 4.2, 0, 0).map(g => g.rotateY(Math.PI / 2).translate(sg * 4.65, H, -5.4)));
      for (const x of [(xa + xb) / 2 - 0.6, (xa + xb) / 2 + 0.6]) add(darkM, boxG(0.1, 0.5, 0.04, x, 1.0, -4.69));
    };
    if (i === 3) side(-1);
    if (i === 5) side(1);
    if (i === 4) {
      const H = 2.7;
      add(stoneM, boxG(3.4, H, 0.9, 0, H / 2, -5.05));
      add(stone2M, courses(-1.7, 1.7, -4.6, 0, H));
      add(stoneM, merlons(-1.7, 1.7, -4.75, H, 0.3));
      add(stone2M, boxG(0.5, H + 0.3, 1.1, -1.55, (H + 0.3) / 2, -5.05), boxG(0.5, H + 0.3, 1.1, 1.55, (H + 0.3) / 2, -5.05));
      // the gate: a dark arch with the portcullis in it
      add(darkM, arch(1.25, 1.6).translate(0, 0, -4.585));
      for (let x = -0.45; x <= 0.46; x += 0.225) add(ironM, boxG(0.05, 1.45, 0.05, x, 0.72, -4.56));
      for (const y of [0.4, 0.85, 1.25]) add(ironM, boxG(1.1, 0.05, 0.05, 0, y, -4.555));
    }
    const tower = sg => {
      const x = sg * 4.6, z = -5.25, H = 3.9;
      add(stoneM, new THREE.CylinderGeometry(0.95, 1.02, H, 20).translate(x, H / 2, z));
      add(stone2M, new THREE.CylinderGeometry(1.08, 1.08, 0.16, 20).translate(x, H - 0.05, z));
      add(stoneM, ringMerlons(x, z, 0.98, H));
      add(roofM, new THREE.ConeGeometry(1.15, 1.7, 20).translate(x, H + 0.32 + 0.85, z));
      for (const y of [1.3, 2.6]) add(winM, boxG(0.22, 0.42, 0.06, x, y, z + 0.97));
    };
    if (i === 6) tower(-1);
    if (i === 8) tower(1);
    if (i === 7) {
      const H = 4.8;
      add(stoneM, boxG(2.6, H, 2.6, 0, H / 2, -7.6));
      add(stone2M, courses(-1.3, 1.3, -6.3, 0, H));
      add(stone2M, boxG(2.8, 0.16, 2.8, 0, H - 0.05, -7.6));
      for (const [a, b] of [[0, -6.4], [0, -8.8]]) add(stoneM, merlons(-1.3, 1.3, b, H, 0.3).map(g => g.translate(a, 0, 0)));
      add(roof2M, new THREE.ConeGeometry(2.05, 2.0, 4).rotateY(Math.PI / 4).translate(0, H + 0.32 + 1.0, -7.6));
      for (const [x, y] of [[-0.5, 2.0], [0.5, 2.0], [-0.5, 3.4], [0.5, 3.4]]) add(winM, boxG(0.26, 0.5, 0.06, x, y, -6.29));
    }
    return L;
  }
  const BASE = i => i < 3 ? 0 : FH;
  // the blueprint: the same shapes in light, see-through, with their edges drawn
  const ghostFill = () => new THREE.MeshBasicMaterial({ color: 0x6FE3FF, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const ghostLine = () => new THREE.LineBasicMaterial({ color: 0x9FEFFF, transparent: true, opacity: 0.5, toneMapped: false });
  const parts = Array.from({ length: 9 }, (_, i) => {
    const L = partOf(i), y0 = BASE(i);
    const real = new THREE.Group(); real.position.y = y0;
    for (const [g, m] of L) real.add(mesh(g, m));
    const box = new THREE.Box3().setFromObject(real);
    bake(real); real.userData.own = true; scene.add(real);
    const ghost = new THREE.Group(); ghost.position.y = y0;
    const merged = mergeAll(L.map(([g]) => g)), fill = ghostFill(), line = ghostLine();
    ghost.add(new THREE.Mesh(merged, fill));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(merged, 30), line); ghost.add(edges);
    scene.add(ghost);
    const c = box.getCenter(V(0, 0, 0)), top = V(c.x, box.max.y + 0.4, Math.max(c.z, -5.0) + 0.4);
    return { real, ghost, fill, line, top, built: false, gl: glow(top.x, top.y, top.z, 2.6, 0xFFE08A, false) };
  });
  // the flag on the keep waves; it is part of the keep, kept apart from the bake
  const flag = new THREE.Group();
  {
    flag.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8).translate(0, 0.6, 0), ironM));
    const cloth = mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.75, -0.18), new THREE.Vector2(0, -0.45)])), mat(C.gold, { side: THREE.DoubleSide }));
    cloth.position.set(0.03, 1.18, 0); flag.add(cloth); flag.userData.cloth = cloth;
    flag.position.set(0, 4.8 + 0.32 + 1.85, -7.6); flag.userData.keep = true; parts[7].real.add(flag);
  }
  function setPart(P, on) {
    P.built = on; P.real.visible = on; P.real.scale.y = 1; P.ghost.visible = !on;
    P.fill.opacity = 0.07; P.line.opacity = 0.5;
  }

  /* ---------- the bridge, the posts of the chain, the banners and the lanterns ---------- */
  // the bridge over the moat, a ramp from the gate down to the yard
  {
    const za = -4.4, zb = -1.8, ya = FH + 0.03, yb = 0.06, n = 10, a = Math.atan2(ya - yb, zb - za);
    for (let k = 0; k < n; k++) { const f = k / (n - 1); fixed.add(part(new THREE.BoxGeometry(1.6, 0.08, 0.27), k % 3 ? woodM : wood2M, [1, 1, 1], [0, ya + (yb - ya) * f, za + (zb - za) * f + (k % 2) * 0.005], [a, 0, 0])); }
    const len = Math.hypot(zb - za, ya - yb);
    for (const x of [-0.82, 0.82]) fixed.add(part(new THREE.BoxGeometry(0.1, 0.12, len), wood2M, [1, 1, 1], [x, (ya + yb) / 2 + 0.1, (za + zb) / 2], [a, 0, 0]));
  }
  for (const x of [-1.35, 1.35]) {
    fixed.add(mesh(boxG(0.5, 1.55, 0.5, x, 0.775, SPOT.lock[1]), stone2M));
    fixed.add(mesh(boxG(0.62, 0.14, 0.62, x, 1.62, SPOT.lock[1]), stoneM));
    fixed.add(mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 14).translate(x + (x < 0 ? 0.27 : -0.27), 1.25, SPOT.lock[1]), ironM));
  }
  // three banners on the far bank of the moat, left of the castle, one per exam: furled and grey at the foot of their pole, raised in the
  // colour of their circle
  const banners = RING.map((h, c) => {
    const x = -9.9 + c * 1.2, z = -4.75;
    fixed.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.0, 8).translate(x, 1.5, z), wood2M));
    fixed.add(part(SPH, mat(C.gold, { metalness: 0.5, roughness: 0.35 }), [0.09, 0.09, 0.09], [x, 3.05, z]));
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55, 8, 1).translate(0.42, 0, 0), new THREE.MeshStandardMaterial({ color: 0x777777, side: THREE.DoubleSide, roughness: 0.7 }));
    cloth.castShadow = true; cloth.position.set(x + 0.04, 0.7, z); cloth.userData.keep = true; scene.add(cloth);
    return { cloth, x, z, color: new THREE.Color().setHSL(h / 360, 0.8, 0.55), raised: false, k: 0 };
  });
  function setBanner(B, k) {
    B.k = k; B.cloth.position.y = 0.7 + k * 2.0; B.cloth.scale.set(0.45 + 0.55 * k, 0.45 + 0.55 * k, 1);
    B.cloth.material.color.copy(new THREE.Color(0x777777).lerp(B.color, k));
  }
  // the lanterns of the bridge and of the yard: lit once the Piscina is done, in the colour of the project on show
  const lamps = [[-3.6, -0.9], [3.6, -0.9], [-3.4, 8.3], [3.4, 8.3]].map(([x, z]) => {
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

  /* ---------- the furniture of the places of the scenes ---------- */
  // the tower of bricks stands on a slab, with a pile of bricks beside it
  const brickM = std(0xD9824A, { roughness: 0.75 });
  fixed.add(mesh(boxG(6.4, 0.1, 1.5, SPOT.pyr[0], 0.05, SPOT.pyr[1]), stone2M, { cast: false }));
  for (let r = 0; r < 3; r++) for (let j = 0; j < 3 - r; j++) fixed.add(mesh(boxG(0.5, 0.25, 0.26, -10.4 + j * 0.52 + r * 0.26, 0.13 + r * 0.26, 3.6), brickM));
  // the balance stands on a round step of stone
  fixed.add(mesh(new THREE.CylinderGeometry(2.6, 2.75, 0.16, 36).translate(SPOT.bal[0], 0.08, SPOT.bal[1]), stone2M, { cast: false }));
  // the machine stands on a low bench of planks
  fixed.add(mesh(boxG(7.6, 0.2, 1.3, SPOT.mach[0], 0.18, SPOT.mach[1]), woodM));
  for (const x of [-3.6, 3.6]) for (const z of [-0.5, 0.5]) fixed.add(mesh(boxG(0.14, 0.1, 0.14, SPOT.mach[0] + x, 0.04, SPOT.mach[1] + z), wood2M));
  // the table of plans, its board leaning towards the camera, with the plan of the castle pinned on it
  const planTex = canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#123A6E'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(160,220,255,0.18)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#BFF4FF'; g.lineWidth = 4; g.strokeRect(70, 210, 372, 110);
    g.strokeRect(110, 140, 110, 70); g.strokeRect(292, 140, 110, 70); g.strokeRect(206, 70, 100, 140);
    g.beginPath(); g.moveTo(70, 210); g.lineTo(256, 30); g.lineTo(442, 210); g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(256, 320, 36, Math.PI, 0); g.stroke();
    g.font = '800 30px "Baloo 2", system-ui, sans-serif'; g.fillStyle = '#BFF4FF'; g.fillText('El castell', 24, 44);
  });
  {
    const t = new THREE.Group(), [x, z] = SPOT.desk;
    for (const [a, b] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) t.add(mesh(boxG(0.08, 0.9, 0.08, a, 0.45, b), wood2M));
    const board = new THREE.Group(); board.position.set(0, 0.95, 0); board.rotation.x = -0.5; t.add(board);
    board.add(mesh(boxG(1.8, 0.06, 1.1, 0, 0, 0), woodM));
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.95).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: planTex, roughness: 0.9 }));
    sheet.position.y = 0.035; sheet.userData.keep = true; board.add(sheet);
    // rolled plans in a basket beside it
    t.add(mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.5, 12).translate(1.25, 0.25, 0.1), wood2M));
    for (const [a, b, r] of [[1.18, 0.05, 0.2], [1.3, 0.16, -0.15], [1.22, 0.2, 0.05]]) t.add(part(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10), mat(0xF4E7C6), [1, 1, 1], [a, 0.62, b], [r, 0, r * 0.6]));
    bake(t); t.position.set(x, 0, z); t.rotation.y = 0.25; scene.add(t);
  }

  /* ---------- the sky: the moon and the fireflies ---------- */
  const moon = mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-16, 9, -26] });
  scene.add(moon); glow(-16, 9, -26, 9, 0xFFE9B8, true).material.opacity = 0.55;
  const NFL = RM ? 0 : 24, flies = Array.from({ length: NFL }, (_, i) => ({ p: Math.random() * 7, x: (i % 2 ? -1 : 1) * (6 + Math.random() * 5), z: -8 + Math.random() * 16, y: 0.4 + Math.random() * 1.6 }));
  const flyPos = new Float32Array(NFL * 3), flyCol = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3)); flyGeo.setAttribute('color', new THREE.BufferAttribute(flyCol, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: softTex(), size: 0.42, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- the frog of the works ---------- */
  const frog = makeFrog(); frog.userData.t = 0; frog.userData.sq = 0; scene.add(frog);
  const frogHome = () => frogAt(SPOT.desk[0] - 1.25, SPOT.desk[1] + 0.35, 0.5);
  function frogAt(x, z, ry = 0, y = 0) { frog.position.set(x, y, z); if (y === 0) frog.scale.setScalar(1); frog.rotation.y = ry; frog.userData.y0 = y; frog.visible = true; D.wake(); }
  frogHome();
  // the frog says what the tip says: a leap for a cheer, its head shaken for a slip
  let frogDo = null;
  function frogSay(cls) { if (RM || !frog.visible) return; if (cls === 'go' || cls === 'oops') { frogDo = { ok: cls === 'go', t: 0 }; D.wake(); } }

  /* ---------- everything that never moves, baked into a few meshes ---------- */
  bake(fixed);

  /* ---------- what moves by itself ---------- */
  D.every((dt, now, raw) => {
    let busy = false;
    if (!RM) {
      flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; const k = 0.3 + 0.7 * Math.sin(q.p * 2.1) ** 2; flyCol[i * 3] = 0.85 * k; flyCol[i * 3 + 1] = k; flyCol[i * 3 + 2] = 0.55 * k; });
      if (NFL) { flyGeo.attributes.position.needsUpdate = true; flyGeo.attributes.color.needsUpdate = true; }
      flag.userData.cloth.rotation.y = Math.sin(now * 0.004) * 0.35;
      for (const B of banners) if (B.k > 0) B.cloth.rotation.y = Math.sin(now * 0.003 + B.x) * 0.3 * B.k;
      if (frog.visible) {
        busy = true; frog.userData.t += dt; const sq = frog.userData.sq, b = frog.userData.body;
        b.scale.set((1 + Math.sin(frog.userData.t * 2.2) * 0.02) * (1 - 0.12 * sq), (1 + Math.sin(frog.userData.t * 2.2) * 0.03) * (1 + 0.24 * sq), 1 - 0.12 * sq);
      }
      // the frog leaps or shakes its head (on the clock, not the frames)
      if (frogDo) {
        const h = frogDo; h.t += raw; const k = Math.min(1, h.t / 0.7);
        if (h.ok) frog.position.y = frog.userData.y0 + Math.sin(k * Math.PI) * 0.6; else frog.userData.body.rotation.y = Math.sin(k * Math.PI * 4) * 0.4 * (1 - k);
        if (k >= 1) { frogDo = null; frog.position.y = frog.userData.y0; frog.userData.body.rotation.y = 0; }
        busy = true;
      }
      if ([...cells3.values()].some(C => C.cur)) { CUR_M.emissiveIntensity = 0.45 + 0.35 * Math.sin(now * 0.008); busy = true; }
      if (hlOn >= 0) { const P = parts[hlOn], p = 0.5 + 0.5 * Math.sin(now * 0.006); if (P.built) P.gl.material.opacity = 0.35 + p * 0.45; else { P.fill.opacity = 0.12 + p * 0.12; P.line.opacity = 0.75 + p * 0.25; } busy = true; }
    }
    if (tick3 && tick3(dt, now, raw)) busy = true;
    return busy;
  });

  /* ---------- the map: what is built, and what is under the finger ---------- */
  let hlOn = -1, hlTimer = 0;
  // a project under the finger: its part shines and the camera goes to its height of the castle; null gives the whole map back
  function highlight(i) {
    const was = hlOn;
    if (was >= 0) { const P = parts[was]; P.gl.material.opacity = 0; P.fill.opacity = 0.07; P.line.opacity = 0.5; }
    hlOn = Number.isInteger(i) && parts[i] ? i : -1;
    if (hlOn >= 0 && RM) { const P = parts[hlOn]; if (P.built) P.gl.material.opacity = 0.6; else { P.fill.opacity = 0.18; P.line.opacity = 1; } }
    clearTimeout(hlTimer);
    if (hlOn === was) return D.wake();
    const c = hlOn >= 0 ? GROUPS.findIndex(g => g.includes(hlOn)) : -1, to = c >= 0 ? 'c' + c : 'map';
    // a short wait, so a finger that crosses the list does not shake the camera. Only while the map is still on show: a level that
    // opened meanwhile has taken the camera to its scene, and it must stay there
    const onMap = () => viewName === 'map' || /^c\d$/.test(viewName || '');
    if (onMap()) hlTimer = setTimeout(() => { if (onMap() && viewName !== to) go(to, { dur: 900 }); }, 220);
    D.wake();
  }
  // the castle as the progress has it: piscina, valid (the projects validated) and banners (the circles whose exam is passed)
  function state({ piscina = false, valid = [], banners: up = [] } = {}) {
    piscinaOn = piscina;
    parts.forEach((P, i) => setPart(P, valid.includes(i)));
    banners.forEach((B, c) => { B.raised = up.includes(c); setBanner(B, B.raised ? 1 : 0); });
    flyPts.visible = piscina; D.hemi.intensity = piscina ? 0.7 : 0.55; paintLamps();
    said();
  }
  const said = () => {
    canvas.dataset.parts = parts.filter(P => P.built).length; canvas.dataset.estendards = banners.filter(B => B.raised).length;
    canvas.dataset.piscina = piscinaOn ? '1' : '0'; D.wake();
  };

  /* ---------- a project validated: the camera goes to the castle and its part rises in stone ---------- */
  function validate(i) {
    const P = parts[i]; if (!P || P.built) return Promise.resolve();
    const c = GROUPS.findIndex(g => g.includes(i));
    return go('c' + c).then(async () => {
      P.built = true; P.real.visible = true; P.real.scale.y = 0.02;
      sound.tone(523, 0, 0.3, 0.08); sound.tone(784, 0.15, 0.4, 0.08); sound.tone(1047, 0.3, 0.5, 0.07);
      await tween(RM ? 0 : 1300, k => { P.real.scale.y = Math.max(0.02, k); P.fill.opacity = 0.07 * (1 - k); P.line.opacity = 0.5 * (1 - k); }, easeOut);
      P.ghost.visible = false; P.real.scale.y = 1; said();
      D.sparkle(P.top.clone(), 22, 0xFFD36B, 0.45, 2.2, 2); D.celebrate(3, P.top.clone());
    });
  }
  // an exam passed: its banner climbs its pole and takes its colour
  function banner(c) {
    const B = banners[c]; if (!B || B.raised) return Promise.resolve();
    B.raised = true;
    return go('map').then(() => tween(RM ? 0 : 1600, k => setBanner(B, k), easeOut)).then(() => { said(); D.sparkle(V(B.x + 0.4, 2.8, B.z), 14, 0xFFD36B, 0.4, 1.6, 2); });
  }

  /* ---------- the scenes ---------- */
  // What is on the stage now goes away with rest(). picks are the meshes a tap can find (each with userData.pick = { kind, key }), onPick
  // what the scene does with one, cells3 its cells with a number, tick3 what it moves every frame
  const stageG = new THREE.Group(); scene.add(stageG);
  // takes away a thing and gives back what it holds, but for the shapes many things share
  function drop(o) { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); if (x.isSprite) x.material.dispose(); }); }
  let gen = 0, picks = [], onPick = null, cells3 = new Map(), tick3 = null;
  function rest() { clearTimeout(hlTimer); gen++; for (const o of [...stageG.children]) drop(o); picks = []; onPick = null; cells3 = new Map(); tick3 = null; canvas.dataset.escena = ''; frogHome(); D.wake(); }
  // a tap on the castle: the thing of the scene under the finger
  canvas.addEventListener('click', e => {
    if (!onPick || !picks.length) return;
    const hit = D.pick(e.clientX, e.clientY, picks)[0];
    if (hit) onPick(hit.object.userData.pick);
  });
  // the point of the screen where a thing of the scene on show is: for the checks in the browser, which touch it there
  function where(kind, key) {
    const o = picks.find(p => p.userData.pick?.kind === kind && String(p.userData.pick.key) === String(key)); if (!o) return null;
    return D.onScreen(new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0)));
  }
  const pickable = (o, kind, key) => { o.userData.pick = { kind, key }; picks.push(o); return o; };
  // a box nobody sees that takes the taps of a thing made of many small pieces
  const HIT_M = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 });
  const hitBox = (w, h, d, x, y, z) => { const m = new THREE.Mesh(boxG(w, h, d, x, y, z), HIT_M); m.userData.keep = true; return m; };

  // A number written on a little canvas on a plane, w × h: the face of a brick, of an orb, of a weight. write(text, o) draws it again
  // (o: ink, edge, bg, ring, dash, size); the faces on show are written again once the font of the page is there
  const FONT = '"Baloo 2", system-ui, sans-serif', faces = new Set();
  function face(w, h, res = 160) {
    const c = document.createElement('canvas'); c.width = Math.max(32, Math.round(res * w / h)); c.height = res;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
    m.renderOrder = 3; faces.add(m);
    m.userData.dispose = () => { faces.delete(m); tex.dispose(); m.material.dispose(); m.geometry.dispose(); };
    m.userData.write = (text, o = {}) => {
      m.userData.last = [text, o];
      const g = c.getContext('2d'), W = c.width, H = c.height; g.clearRect(0, 0, W, H);
      if (o.bg || o.ring) {
        g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, o.r ?? H * 0.24);
        if (o.bg) { g.fillStyle = o.bg; g.fill(); }
        if (o.ring) { g.lineWidth = 9; g.setLineDash(o.dash ? [20, 12] : []); g.strokeStyle = o.ring; g.stroke(); g.setLineDash([]); }
      }
      const t = String(text); let fs = H * (o.size || 0.72); g.font = `800 ${fs}px ${FONT}`;
      const tw = g.measureText(t).width, max = W * 0.84; if (tw > max) { fs *= max / tw; g.font = `800 ${fs}px ${FONT}`; }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (o.edge) { g.lineWidth = fs * 0.14; g.strokeStyle = o.edge; g.lineJoin = 'round'; g.strokeText(t, W / 2, H / 2 + fs * 0.07); }
      g.fillStyle = o.ink || '#fff'; g.fillText(t, W / 2, H / 2 + fs * 0.07);
      tex.needsUpdate = true; D.wake();
    };
    return m;
  }
  document.fonts?.ready?.then(() => { for (const f of faces) if (f.userData.last) f.userData.write(...f.userData.last); }).catch(() => {});

  // the look of a hole: a blueprint of light, gold while it is the one typed in; a thing a hint talks of glows
  const HOLE_M = new THREE.MeshStandardMaterial({ color: 0x8FE9FF, transparent: true, opacity: 0.78, emissive: 0x2A8DAF, emissiveIntensity: 0.5, roughness: 0.4 });
  const CUR_M = new THREE.MeshStandardMaterial({ color: 0xFFD970, transparent: true, opacity: 0.88, emissive: 0xF7C64E, emissiveIntensity: 0.6, roughness: 0.4 });
  const EDGE_M = new THREE.LineBasicMaterial({ color: 0x9FEFFF, transparent: true, opacity: 0.9, toneMapped: false }), EDGE_CUR = new THREE.LineBasicMaterial({ color: 0xFFE69A, toneMapped: false });
  const LIT = new Map();
  const litM = m => { if (!LIT.has(m)) { const x = m.clone(); x.emissive = new THREE.Color(0xF7C64E); x.emissiveIntensity = 0.6; LIT.set(m, x); } return LIT.get(m); };
  // A cell of a scene with a number: body is the mesh of the thing (a brick, an orb, a pad), f its face, real its material when it is
  // not a hole, ink the colour of its number. A hole is its blueprint until it is filled; one the child can tap (o.tap) is a pick.
  // o.hole makes a hole of what the scene has no hole for (the sign of a padlock), o.fmt writes the number, o.edges its outline
  function cell3(k, sc, body, f, real, ink, o = {}) {
    const C = { k, body, f, real, ink, hole: o.hole || sc.holes.includes(k), done: false, cur: false, buf: '', lit: false, v: sc.cells[k], fmt: o.fmt || (v => v) };
    if (C.hole) {
      C.edges = new THREE.LineSegments(o.edges || new THREE.EdgesGeometry(body.geometry), EDGE_M); C.edges.userData.keep = true; body.add(C.edges);
      if (o.tap !== false && sc.holes.includes(k)) pickable(body, 'hole', k);
    }
    C.paint = () => {
      const open = C.hole && !C.done;
      body.material = C.lit ? litM(real) : open ? (C.cur ? CUR_M : HOLE_M) : real; body.castShadow = !open;
      if (C.edges) { C.edges.visible = open; C.edges.material = C.cur ? EDGE_CUR : EDGE_M; }
      f.userData.write(open ? (C.buf || '?') : C.fmt(C.v), { ink: open ? '#FFFFFF' : ink, edge: open ? 'rgba(4,19,28,0.9)' : o.edge, size: open ? Math.max(o.size || 0, 0.86) : o.size, bg: open ? null : o.bg });
    };
    C.paint(); cells3.set(k, C); return C;
  }
  const worldOf = o => new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0));
  // a thing that pops when it is filled, and one that shakes no
  function pop(o) { const s = o.userData.s0 ?? (o.userData.s0 = o.scale.x); return tween(RM ? 0 : 450, k => o.scale.setScalar(s * (1 + 0.3 * (1 - k))), backOut); }
  function wobble(o) { const x = o.position.x; return tween(RM ? 0 : 550, k => { o.position.x = x + Math.sin(k * Math.PI * 6) * 0.08 * (1 - k); }, k => k).then(() => { o.position.x = x; }); }
  // What the screen does to a scene, as draw.js's api(): light the hole typed in, write in it, fill it, shake it, light what a hint talks
  // of, and the end (finish). The cells left in the panel (the legend of a balance) are driven by draw.js's own, H
  function api3(o) {
    const H = o.board ? api(o.board) : null;
    return {
      el: k => H?.el(k) || null,
      active(k) { for (const C of cells3.values()) if (C.cur) { C.cur = false; C.paint(); } const C = cells3.get(k); if (C) { C.cur = true; C.paint(); } H?.active(k); },
      type(k, txt) { const C = cells3.get(k); if (C) { C.buf = txt; C.paint(); } else H?.type(k, txt); },
      solve(k, v) { const C = cells3.get(k); if (C) { C.done = true; C.cur = false; C.buf = ''; C.v = v; C.paint(); pop(C.body); } else H?.solve(k, v); },
      wrong(k) { const C = cells3.get(k); if (C) wobble(C.body); else H?.wrong(k); },
      lit(keys) { for (const C of cells3.values()) { const on = keys.includes(C.k); if (on !== C.lit) { C.lit = on; C.paint(); } } H?.lit(keys); },
      spark(k) { const C = cells3.get(k); if (C) D.sparkle(worldOf(C.body).add(V(0, 0.2, 0.3)), 12, 0xFFE08A, 0.3, 1.6, 2.2); },
      hint() {}, async finish() {}
    };
  }
  // The view of a scene: the box of half width hw and half height hh round (x, y, z), seen from the front and from up above. It is as
  // close as the free part of the screen allows, wide or tall, and follows it when the panel changes size
  const frame = (x, y, z, hw, hh, up = 0.36) => ({ t: [x, y, z], dir: [0.04, up, 1], get R() { const { w, h } = D.size(), m = Math.min(w, h); return Math.max(hw * m / w, hh * m / h); } });
  // the view of a scene: the ball of radius R round t, seen from the front and a bit above
  const look = (x, y, z, R, up = 0.36) => ({ t: [x, y, z], dir: [0.06, up, 1], R });
  const backOut = k => { const c = 1.70158; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
  const bounce = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; };
  const rod = (a, b, r, m) => { const d = b.clone().sub(a), g = new THREE.CylinderGeometry(r, r, d.length(), 6).translate(0, d.length() / 2, 0); const x = new THREE.Mesh(g, m); x.position.copy(a); x.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); x.castShadow = true; return x; };
  const redM = std(0xFF6B5E, { roughness: 0.5 }), V2 = (x, y) => new THREE.Vector2(x, y);
  const pennant = (c, w = 0.55, h = 0.34) => mesh(new THREE.ShapeGeometry(new THREE.Shape([V2(0, 0), V2(w, -h * 0.42), V2(0, -h)])), mat(c, { side: THREE.DoubleSide }));

  /* ---------- the tower of bricks: each brick stands on the two whose sum it is ---------- */
  const BRICK = new THREE.BoxGeometry(1, 0.5, 0.5), BRICK_E = new THREE.EdgesGeometry(BRICK); BRICK.userData.shared = BRICK_E.userData.shared = true;
  const terraM = std(0xD9824A, { roughness: 0.72 }), ametM = std(0x9C84F4, { roughness: 0.32, metalness: 0.1, emissive: 0x2A1660, emissiveIntensity: 0.25 });
  function pyrStage(sc, o) {
    const n = sc.n, times = sc.op === '×', [sx, sz] = SPOT.pyr, BW = 1.0, BH = 0.5, GP = 0.06, Y0 = 0.1;
    const at = (r, i) => V(sx + (i - (n - 1 - r) / 2) * (BW + GP), Y0 + BH / 2 + r * (BH + 0.02), sz);
    const real = times ? ametM : terraM, ink = times ? '#1A0B4A' : '#3B2208';
    for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) {
      const b = new THREE.Mesh(BRICK, real); b.position.copy(at(r, i)); b.castShadow = b.receiveShadow = true;
      const f = face(0.9, 0.44); f.position.z = 0.256; b.add(f); stageG.add(b);
      cell3(`${r}-${i}`, sc, b, f, real, ink, { edges: BRICK_E });
    }
    // the flag on top, raised at the end
    const top = at(n - 1, 0).add(V(0, BH / 2, 0)), fl = new THREE.Group(); fl.position.copy(top); fl.visible = false; stageG.add(fl);
    fl.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8).translate(0, 0.5, 0), ironM));
    const cloth = pennant(times ? 0xB79CFF : 0xFF6B5E); cloth.position.set(0.03, 0.98, 0); fl.add(cloth);
    const w = n * (BW + GP), h = n * (BH + 0.02);
    go(frame(sx + 0.3, Y0 + h / 2 + 0.25, sz, w / 2 + 0.95, h / 2 + 0.75, 0.42));
    frogAt(sx + w / 2 + 0.55, sz + 0.6, -0.7);
    onPick = p => o.on?.('hole', p.key);
    const S = api3(o), solve0 = S.solve;
    // a brick put right falls into its place from above
    S.solve = (k, v) => {
      solve0(k, v); const C = cells3.get(k); if (!C || RM) return;
      const y = at(...k.split('-').map(Number)).y; C.body.position.y = y + 1.1;
      tween(420, q => { C.body.position.y = y + 1.1 * (1 - bounce(q)); }, q => q);
    };
    S.finish = async () => {
      const cs = [...cells3.values()];
      if (!RM) cs.forEach((C, j) => { const b = C.body, y = b.position.y; setTimeout(() => tween(300, q => { b.position.y = y + Math.sin(q * Math.PI) * 0.16; }, q => q), j * 50); });
      fl.visible = true; fl.scale.y = 0.01;
      await tween(RM ? 0 : 600, q => { fl.scale.y = Math.max(0.01, q); }, easeOut);
      D.sparkle(top.clone().add(V(0, 1.1, 0)), 14, 0xFFD36B, 0.35, 1.6, 2);
      await sleep(RM ? 0 : 50 * cs.length + 300);
    };
    return S;
  }

  /* ---------- the balances ---------- */
  const copperM = std(0xC8773F, { metalness: 0.55, roughness: 0.35 }), brassM = std(C.gold, { metalness: 0.6, roughness: 0.3 }), weightM = std(0x3A444E, { metalness: 0.45, roughness: 0.45 });
  const crateM = std(0xB57A44, { roughness: 0.7 }), crate2M = std(0x7A4E26, { roughness: 0.8 });
  const WGT = [new THREE.CylinderGeometry(0.19, 0.28, 0.37, 20), new THREE.CylinderGeometry(0.22, 0.33, 0.42, 20)], CRATE = new THREE.BoxGeometry(0.52, 0.52, 0.52);
  for (const g of [...WGT, CRATE]) g.userData.shared = true;
  const PH = 2.7, LB = 1.75, HANG = 1.3, PANR = 0.86;
  // One balance standing at (x, z), s times its size: its foot and column, the beam that swings on the pivot, and two pans hanging from
  // its ends by three chains each (pans[side].items holds what is on it). Its pivot is where a hint lights it
  function balance(x, z, s, lb = LB) {
    const g = new THREE.Group(); g.position.set(x, 0.16, z); g.scale.setScalar(s); stageG.add(g);
    g.add(mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.2, 24).translate(0, 0.1, 0), copperM));
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, PH, 12).translate(0, PH / 2 + 0.2, 0), copperM));
    // the ticks of the needle, on a little plate at the top of the column
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 24, 1, false, -0.7, 1.4).rotateX(Math.PI / 2).translate(0, PH - 0.05, 0.07), mat(0xF4EEDF)));
    const beam = new THREE.Group(); beam.position.set(0, PH + 0.2, 0); g.add(beam);
    const bar = mesh(boxG(2 * lb + 0.2, 0.09, 0.1, 0, 0, 0), brassM); beam.add(bar);
    beam.add(mesh(new THREE.ConeGeometry(0.045, 0.55, 8).rotateX(Math.PI).translate(0, -0.3, 0.1), redM));
    beam.add(mesh(new THREE.SphereGeometry(0.12, 16, 10), brassM));
    const pans = [0, 1].map(() => {
      const p = new THREE.Group(); g.add(p);
      p.add(mesh(new THREE.CylinderGeometry(PANR, PANR - 0.2, 0.08, 32), brassM));
      // three chains: one at the back and one at each side, so none crosses what is on the pan
      for (const a of [-Math.PI / 2, 0.3, Math.PI - 0.3]) p.add(rod(V(Math.cos(a) * (PANR - 0.06), 0.04, Math.sin(a) * (PANR - 0.06)), V(0, HANG, 0), 0.014, ironM));
      const items = new THREE.Group(); items.position.y = 0.04; p.add(items);
      return { g: p, items };
    });
    return { g, beam, bar, pans, lb, th: 0, w: 0 };
  }
  // the beam and the pans where the angle th puts them (th > 0: the right pan lower)
  function place(B) {
    B.beam.rotation.z = -B.th;
    const c = Math.cos(B.th), s = Math.sin(B.th);
    B.pans[0].g.position.set(-B.lb * c, PH + 0.2 + B.lb * s - HANG, 0); B.pans[1].g.position.set(B.lb * c, PH + 0.2 - B.lb * s - HANG, 0);
  }
  // the beam swings like a spring towards the angle aim
  function swing(B, aim, dt) {
    if (RM) { B.th = aim; B.w = 0; } else { B.w += ((aim - B.th) * 80 - B.w * 9) * dt; B.th += B.w * dt; }
    place(B); return Math.abs(B.w) > 0.002 || Math.abs(aim - B.th) > 0.002;
  }
  // What is on a pan: a weight, a box (? until its weight is known) or a fruit (with its weight once known), k times its size. Its number
  // is on a round badge that always faces the camera and is never hidden, so it reads from any side; the thing itself is inside a box
  // nobody sees that takes the taps, bigger than a finger needs
  const badge = (txt, bg, ring, ink = '#1B1206') => label(String(txt), { h: 0.42, bg, ring, ink, depthTest: false, order: 6 });
  function item(t, known, k = 1) {
    const num = typeof t === 'number', big = num && t >= 10, w = num ? (big ? 0.72 : 0.62) : 0.6, h = num ? (big ? 0.56 : 0.5) : t === 'x' ? 0.54 : 0.6;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.7), HIT_M); m.scale.setScalar(k); m.position.y = h * k / 2;
    const y0 = -h / 2;
    if (num) {
      const body = mesh(WGT[big ? 1 : 0], weightM); body.position.y = y0 + (big ? 0.21 : 0.185); m.add(body);
      m.add(mesh(new THREE.TorusGeometry(0.075, 0.024, 6, 14).translate(0, y0 + (big ? 0.47 : 0.42), 0), weightM));
      const b = badge(t, '#FFF8E1', '#F7C64E'); b.position.set(0, y0 + (big ? 0.2 : 0.18), 0.36); m.add(b);
    } else if (t === 'x') {
      const body = mesh(CRATE, crateM); body.position.y = y0 + 0.26; m.add(body);
      for (const sg of [-1, 1]) body.add(mesh(new THREE.BoxGeometry(0.6, 0.06, 0.02).rotateZ(sg * 0.78).translate(0, 0, 0.265), crate2M, { cast: false }));
      const b = known.has('x') ? badge(known.get('x'), '#F7C64E', '#7A4E26') : badge('?', '#FFF3D6', '#7A4E26'); b.position.set(0, y0 + 0.26, 0.36); m.add(b);
    } else {
      const f = label(t, { h: 0.6, depthTest: false, order: 6 }); f.position.set(0, 0, 0.1); m.add(f);
      if (known.has(t)) { const b = badge(known.get(t), '#F7C64E', '#7A4E26'); b.scale.multiplyScalar(0.75); b.position.set(0.22, -0.16, 0.2); m.add(b); }
    }
    return { m, w: w * k, h: h * k };
  }
  // the things on a pan in rows, from the rim up
  function lay(items) {
    const rows = [[]]; let w = 0;
    items.forEach((it, i) => { if (w + it.w > 1.62 && rows[rows.length - 1].length) { rows.push([]); w = 0; } rows[rows.length - 1].push(i); w += it.w; });
    let y = 0;
    for (const r of rows) { const tw = r.reduce((a, i) => a + items[i].w, 0); let x = -tw / 2; for (const i of r) { items[i].m.position.x = x + items[i].w / 2; items[i].m.position.y += y; x += items[i].w; } y += Math.max(...r.map(i => items[i].h)) + 0.02; }
  }
  // the legend and the equation of a balance stay in the panel, as cells to type in
  const CRATE_SVG = '<svg viewBox="-22 -38 44 40" width="38" height="34" aria-hidden="true"><rect x="-20" y="-36" width="40" height="36" rx="4" fill="#B57A44" stroke="#4E3014" stroke-width="2"/><path d="M-17 -33L17 -3M17 -33L-17 -3" stroke="#6E4520" stroke-opacity="0.5" stroke-width="3"/><rect x="-13" y="-28" width="26" height="18" rx="4" fill="#FFF3D6"/><text y="-14" text-anchor="middle" font-size="15" font-weight="800" fill="#3B2208">?</text></svg>';
  function balStage(sc, o) {
    const multi = sc.pans.length > 1, mode = sc.mode || 'solve', [sx, sz] = SPOT.bal, s = multi ? 0.68 : 0.9, known = new Map(), my = gen;
    const bs = sc.pans.map(([L, R], b) => Object.assign(balance(multi ? sx + (b ? 1.95 : -1.95) : sx, sz, s), { side: [L.slice(), R.slice()], fixed: R.length, lit: false }));
    const weigh = a => a.reduce((t, x) => t + (typeof x === 'number' ? x : sc.vals[x] ?? 0), 0);
    const side = a => a.map(t => t === 'x' ? (known.has('x') ? known.get('x') : '?') : t).join(' + ');
    if (o.board) o.board.innerHTML = mode === 'level' ? '' : `<div class="scene s-bal">${!multi ? '<p class="eqn" aria-live="polite"></p>' : ''}<div class="legend">${sc.holes.map(k => `<span class="lg"><span class="e">${k === 'x' ? CRATE_SVG : k}</span><span class="op">=</span>${cellHTML(sc, k, o.still)}</span>`).join('')}</div></div>`;
    const eqn = o.board?.querySelector('.eqn'), writeEq = () => { if (eqn) eqn.textContent = `${side(bs[0].side[0])} = ${side(bs[0].side[1])}`; };
    // what is on the pans of balance b, drawn again: each thing is a pick
    function paint(b, last = false) {
      const B = bs[b];
      B.pans.forEach((P, sd) => {
        for (const c of [...P.items.children]) drop(c);
        picks = picks.filter(p => !(p.userData.pick?.kind === 'item' && p.userData.pick.key.startsWith(`${b}.${sd}.`)));
        const its = B.side[sd].map(t => item(t, known)); lay(its);
        its.forEach((it, i) => { P.items.add(it.m); if (!o.still) pickable(it.m, 'item', `${b}.${sd}.${i}`); });
        // a weight just put falls onto the pan
        if (last && sd === 1 && its.length && !RM) { const m = its[its.length - 1].m, y = m.position.y; m.position.y = y + 1.2; tween(380, q => { m.position.y = y + 1.2 * (1 - bounce(q)); }, q => q); }
      });
    }
    bs.forEach((B, b) => { paint(b); place(B); });
    writeEq();
    const aim = B => { const d = weigh(B.side[1]) - weigh(B.side[0]); return d ? Math.sign(d) * Math.min(0.3, 0.07 + Math.abs(d) * 0.018) : 0; };
    tick3 = dt => { let moving = false; for (const B of bs) if (swing(B, aim(B), dt)) moving = true; return moving; };
    const emitLevel = () => o.on?.('balance', { L: weigh(bs[0].side[0]), R: weigh(bs[0].side[1]) });
    onPick = o.still ? null : p => {
      if (p.kind === 'hole') return o.on?.('hole', p.key);
      if (p.kind !== 'item') return;
      const [b, sd, i] = p.key.split('.').map(Number), B = bs[b];
      if (mode === 'level') { if (sd !== 1 || i < B.fixed) return; B.side[1].splice(i, 1); paint(b); emitLevel(); D.wake(); return; }
      const t = B.side[sd][i], j = B.side[1 - sd].findIndex(x => x === t), mine = B.pans[sd].items.children[i];
      if (j < 0) { if (mine) wobble(mine); o.on?.('nomatch', t); return; }
      const other = B.pans[1 - sd].items.children[j];
      B.side[sd].splice(i, 1); B.side[1 - sd].splice(j, 1);
      // the two go up and away together: the balance stays level
      const gone = [mine, other].filter(Boolean), y0 = gone.map(m => m.position.y);
      picks = picks.filter(q => !gone.includes(q));
      tween(RM ? 0 : 380, q => gone.forEach((m, n) => { m.position.y = y0[n] + q * 0.6; m.scale.setScalar(1 - q * 0.6); }), q => q * q).then(() => { if (my === gen) paint(b); });
      writeEq(); o.on?.('cancel', t);
    };
    const S = api3(o), solve0 = S.solve;
    S.solve = (k, v) => { solve0(k, v); known.set(k, v); bs.forEach((_, b) => paint(b)); writeEq(); };
    // a hint of a balance (b0, b1) lights its beam
    const lit0 = S.lit;
    S.lit = keys => { lit0(keys); bs.forEach((B, b) => { B.bar.material = keys.includes('b' + b) ? litM(brassM) : brassM; }); D.wake(); };
    S.spark = k => { for (const B of bs) for (const P of B.pans) B.side[B.pans.indexOf(P)].forEach((t, i) => { if (t === k) { const m = P.items.children[i]; if (m) D.sparkle(worldOf(m), 6, 0xFFE08A, 0.25, 1.2, 2); } }); };
    S.add = w => { const B = bs[0]; if (B.side[1].length >= 10) return; B.side[1].push(w); paint(0, true); emitLevel(); D.wake(); };
    S.finish = async () => { for (const B of bs) { B.bar.material = litM(brassM); D.sparkle(worldOf(B.beam), 14, 0xFFD36B, 0.35, 1.6, 2); } await sleep(RM ? 0 : 700); };
    go(multi ? frame(sx, 1.3, sz, 3.95, 1.55, 0.5) : frame(sx, 1.6, sz, 2.6, 1.85, 0.5));
    frogAt(sx + (multi ? 0 : 1.2), sz + (multi ? 1.5 : 1.35), multi ? 0 : -0.5);
    return S;
  }
  // Three small balances held level by a pin. tilt(k) takes out the pin of one; mark(k, 'ok' | 'no') lights the ring under it; finish()
  // takes out every pin. A balance is touched anywhere on it
  function bal3Stage(sc, o) {
    const [sx, sz] = SPOT.bal, s = 0.62, GAPX = 2.55;
    const bs = sc.items.map((it, j) => {
      const x = sx + (j - 1) * GAPX, B = Object.assign(balance(x, sz + 0.1, s, 1.12), { k: it.k, side: [it.L, it.R], pinned: true });
      B.pans.forEach((P, sd) => { const its = B.side[sd].map(t => item(t, new Map(), 1.05)); lay(its); its.forEach(i2 => P.items.add(i2.m)); });
      // the pin: a needle with a red head through the pivot
      const pin = new THREE.Group(); pin.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6).rotateX(Math.PI / 2 - 0.35).translate(0, 0.05, 0.2), mat(0xDCE6EE, { metalness: 0.6 })), mesh(new THREE.SphereGeometry(0.08, 12, 8).translate(0, 0.17, 0.52), redM));
      pin.position.copy(B.beam.position); B.g.add(pin); B.pin = pin;
      const tag = label(it.k.toUpperCase(), { h: 0.4, ink: '#F7C64E', edge: '#1B1206' }); tag.position.set(x, 0.16 + (PH + 0.75) * s, sz + 0.1); stageG.add(tag);
      const ring = mesh(new THREE.TorusGeometry(0.95, 0.05, 8, 40).rotateX(Math.PI / 2).translate(x, 0.2, sz + 0.1), new THREE.MeshBasicMaterial({ color: 0x7CF5B0, toneMapped: false, transparent: true, opacity: 0 }), { cast: false });
      stageG.add(ring); B.ring = ring;
      if (!o.still) { const hb = hitBox(GAPX - 0.1, 2.5, 1.2, x, 1.2, sz + 0.1); stageG.add(hb); pickable(hb, 'bal3', it.k); }
      place(B); return B;
    });
    const sum = a => a.reduce((t, x) => t + x, 0);
    const aim = B => { if (B.pinned) return 0; const d = sum(B.side[1]) - sum(B.side[0]); return d ? Math.sign(d) * Math.min(0.32, 0.12 + Math.abs(d) * 0.04) : 0; };
    tick3 = dt => { let moving = false; for (const B of bs) if (swing(B, aim(B), dt)) moving = true; return moving; };
    const unpin = B => { if (!B.pinned) return; B.pinned = false; const p = B.pin, y = p.position.y; tween(RM ? 0 : 350, q => { p.position.y = y + q * 0.8; p.scale.setScalar(1 - q); }, q => q).then(() => { p.visible = false; }); D.wake(); };
    onPick = o.still ? null : p => { if (p.kind === 'bal3') o.on?.('hit', p.key); };
    const S = api3(o);
    S.tilt = k => { const B = bs.find(B => B.k === k); if (B) unpin(B); };
    S.mark = (k, cls) => { const B = bs.find(B => B.k === k); if (!B) return; B.ring.material.color.setHex(cls === 'ok' ? 0x7CF5B0 : 0xFF6B5E); B.ring.material.opacity = 0.95; D.wake(); };
    S.finish = async () => { bs.forEach(unpin); await sleep(RM ? 0 : 1300); };
    go(frame(sx, 1.25, sz + 0.1, GAPX * 1.5 + 0.1, 1.45, 0.45));
    frogAt(sx, sz + 1.6, 0);
    return S;
  }

  /* ---------- the padlock: on the chain across the head of the bridge ---------- */
  const goldLockM = std(0xF2C14E, { metalness: 0.7, roughness: 0.28, emissive: 0x3A2400, emissiveIntensity: 0.2 }), plateM = std(0x2A1C00, { roughness: 0.6 });
  const steelM = std(0xAEBDCB, { metalness: 0.85, roughness: 0.25 }), codeM = std(0x4A3510, { roughness: 0.5 });
  function lockStage(sc, o) {
    const [lx, lz] = SPOT.lock, ts = sc.toks, TH = 0.42, GAP = 0.06;
    const len = t => String(t).length, holeW = Math.max(0.5, len(sc.cells.x) * 0.24 + 0.2);
    const ws = ts.map((t, i) => i === sc.hole ? holeW : typeof t === 'number' ? len(t) * 0.23 + 0.06 : 0.28), total = ws.reduce((a, w) => a + w, 0) + GAP * (ts.length - 1);
    const plateW = Math.max(1.5, total + 0.3), bodyW = plateW + 0.36, bodyH = 0.95, Y0 = 0.32, Z = lz + 0.16;
    const g = new THREE.Group(); g.position.set(lx, Y0, Z); stageG.add(g);
    // the body, with its rounded corners, the dark plate of the code and the keyhole
    const rr = new THREE.Shape(), r = 0.2, w2 = bodyW / 2;
    rr.moveTo(-w2 + r, 0); rr.lineTo(w2 - r, 0); rr.quadraticCurveTo(w2, 0, w2, r); rr.lineTo(w2, bodyH - r); rr.quadraticCurveTo(w2, bodyH, w2 - r, bodyH); rr.lineTo(-w2 + r, bodyH); rr.quadraticCurveTo(-w2, bodyH, -w2, bodyH - r); rr.lineTo(-w2, r); rr.quadraticCurveTo(-w2, 0, -w2 + r, 0);
    g.add(mesh(new THREE.ExtrudeGeometry(rr, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 6 }).translate(0, 0, -0.15), goldLockM));
    g.add(mesh(boxG(plateW, 0.58, 0.03, 0, bodyH - 0.4, 0.19), plateM, { cast: false }));
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12).rotateX(Math.PI / 2).translate(0, 0.17, 0.2), plateM, { cast: false }));
    // the code: the numbers and the signs, and the hole in its place
    let x = -total / 2;
    ts.forEach((t, i) => {
      const w = ws[i], cx = x + w / 2; x += w + GAP;
      if (i === sc.hole) {
        const hb = new THREE.Mesh(boxG(w, 0.48, 0.05), codeM); hb.position.set(cx, bodyH - 0.4, 0.22); g.add(hb);
        const f = face(w * 0.92, 0.42); f.position.z = 0.03; hb.add(f);
        cell3('x', sc, hb, f, codeM, '#FFE69A', { hole: true, tap: !sc.sign, size: 0.78 });
      } else { const f = face(w, TH); f.position.set(cx, bodyH - 0.4, 0.21); f.userData.write(t, { ink: '#FFE69A', size: 0.78 }); g.add(f); }
    });
    // the shackle, through the chain
    const sh = new THREE.Group(), SR = Math.min(0.42, bodyW / 2 - 0.25); sh.position.set(-SR, bodyH, 0); g.add(sh);
    sh.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12).translate(0, 0.15, 0), steelM), mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12).translate(2 * SR, 0.15, 0), steelM));
    sh.add(mesh(new THREE.TorusGeometry(SR, 0.07, 10, 24, Math.PI).translate(SR, 0.3, 0), steelM));
    // the chain: links from each post to the top of the shackle, sagging a little
    const topY = Y0 + bodyH + 0.3 + SR, links = [];
    for (const sg of [-1, 1]) {
      const a = V(sg * 1.08, 1.25, lz), b = V(lx + sg * 0.12, topY - 0.02, Z), n = 9;
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n, p = a.clone().lerp(b, k); p.y -= Math.sin(k * Math.PI) * 0.12;
        const l = mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 14), steelM); l.position.copy(p);
        l.lookAt(b); l.rotateX(Math.PI / 2); if (i % 2) l.rotateY(Math.PI / 2);
        stageG.add(l); links.push(l);
      }
    }
    // the bar of the hint (part and whole) stays in the panel, under the castle
    const bar = barOf(sc);
    if (o.board) o.board.innerHTML = bar ? `<div class="scene s-lock"><svg class="hxs" viewBox="44 -4 312 82" role="img" aria-label="La barra de la pista">${barSVG(bar, 200, 0)}</svg></div>` : '';
    const S = api3(o);
    S.finish = async () => {
      if (sc.sign) S.solve('x', sc.cells.x);
      await tween(RM ? 0 : 550, q => { sh.position.y = bodyH + q * 0.3; sh.rotation.y = -q * 0.9; }, backOut);
      links.forEach((l, i) => { const y = l.position.y, rx = Math.random() * 3; setTimeout(() => tween(RM ? 0 : 700, q => { l.position.y = y + (WY - 0.4 - y) * q; l.rotation.x += rx * 0.05; }, q => q * q).then(() => { l.visible = false; }), RM ? 0 : i * 25); });
      D.shake(0.05);
      await sleep(RM ? 0 : 1000);
    };
    onPick = o.still ? null : p => o.on?.('hole', p.key);
    go(frame(lx, Y0 + 0.66, Z, Math.max(1.75, bodyW / 2 + 0.6), 1.2, 0.24));
    frogAt(lx - Math.max(1.75, bodyW / 2 + 0.45), lz + 0.6, 0.6);
    return S;
  }

  /* ---------- the machine: chambers of copper on the bench, and a ball of light through them ---------- */
  const orbM = std(0xA8F2FF, { roughness: 0.08, metalness: 0.1, emissive: 0x1E6F8A, emissiveIntensity: 0.35, envMapIntensity: 1.4 });
  const ORB = new THREE.SphereGeometry(0.34, 28, 18), ORB_E = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.35, 1)); ORB.userData.shared = ORB_E.userData.shared = true;
  const pipeM = new THREE.MeshStandardMaterial({ color: 0x9FEFFF, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false });
  const gearGeo = (r, n) => { const s = new THREE.Shape(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, q = i % 2 ? r * 0.76 : r; i ? s.lineTo(Math.cos(a) * q, Math.sin(a) * q) : s.moveTo(Math.cos(a) * q, Math.sin(a) * q); } s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }); };
  const GEAR = [gearGeo(0.17, 9), gearGeo(0.13, 7)]; for (const g of GEAR) g.userData.shared = true;
  function machStage(sc, o) {
    const N = sc.steps.length, rule = sc.mode === 'rule', [mx, mz] = SPOT.mach, Y = 0.28, OY = Y + 0.72, CW = 1.0, GAP = 0.5;
    const width = (N + 1) * 0.7 + N * CW + 2 * N * GAP, ox = i => mx - width / 2 + 0.35 + i * (0.7 + CW + 2 * GAP), chx = i => ox(i) + 0.35 + GAP + CW / 2;
    // the glass pipe along the bench, through every chamber
    stageG.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, width + 0.2, 20, 1, true).rotateZ(Math.PI / 2).translate(mx, OY, mz), pipeM, { cast: false }));
    const chambers = sc.steps.map((st, i) => {
      const g = new THREE.Group(); g.position.set(chx(i), Y, mz); stageG.add(g);
      const box = mesh(boxG(CW, 1.2, 0.8, 0, 0.6, 0), copperM); g.add(box);
      g.add(mesh(boxG(CW - 0.2, 0.1, 0.7, 0, 1.25, 0), mat(0x7A3E1A)));
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 20).rotateX(Math.PI / 2).translate(0, OY - Y, 0.41), mat(0x0B2733, { roughness: 0.2 })));
      // the plate with the operation
      g.add(mesh(boxG(CW - 0.16, 0.36, 0.03, 0, 1.0, 0.405), plateM, { cast: false }));
      const lab = face(CW - 0.2, 0.32); lab.position.set(0, 1.0, 0.425); lab.userData.write(rule ? '?' : st, { ink: '#FFE69A' }); g.add(lab);
      const gears = GEAR.map((G, j) => { const m = mesh(G, mat(0x4E2A12), { cast: false }); m.position.set(j ? 0.3 : -0.3, j ? 0.22 : 0.25, 0.4); g.add(m); return m; });
      // the hint of a machine run backwards: under the chamber, what it does the other way
      let back = null;
      if (sc.mode === 'in') { back = label(`al revés: ${undo(st)}`, { h: 0.26, ink: '#F7C64E', edge: '#1B1206' }); back.position.set(0, -0.1, 0.6); back.visible = false; g.add(back); }
      return { g, box, lab, gears, back, st, run: 0 };
    });
    // the orbs between the chambers: the numbers that go in and come out
    for (let i = 0; i <= N; i++) {
      if (rule) continue;
      const b = new THREE.Mesh(ORB, orbM); b.position.set(ox(i), OY, mz); b.castShadow = true; stageG.add(b);
      stageG.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, OY - Y - 0.3, 10).translate(ox(i), Y + (OY - Y - 0.3) / 2, mz), copperM));
      const f = face(0.56, 0.38); f.position.z = 0.36; b.add(f);
      cell3(`m${i}`, sc, b, f, orbM, '#05313F', { edges: ORB_E, bg: 'rgba(255,255,255,0.92)' });
    }
    if (rule && o.board) o.board.innerHTML = `<div class="scene s-mach"><table class="io"><tr><th>Entra</th>${sc.table.map(([a]) => `<td>${a}</td>`).join('')}</tr><tr><th>Surt</th>${sc.table.map(([, b]) => `<td>${b}</td>`).join('')}</tr></table></div>`;
    // the ball of light that carries a number through a chamber
    const ball = mesh(new THREE.SphereGeometry(0.13, 16, 10), new THREE.MeshBasicMaterial({ color: 0xFFFBE6, toneMapped: false }), { cast: false }); ball.visible = false; stageG.add(ball);
    const ballGl = glow(0, -50, 0, 1.0, 0xFFE9A0, false, stageG);
    tick3 = dt => { let on = false; for (const C of chambers) if (C.run) { C.gears[0].rotation.z += dt * 4 * C.run; C.gears[1].rotation.z -= dt * 5 * C.run; on = true; } if (ball.visible) ballGl.position.copy(ball.position); return on; };
    let queue = Promise.resolve();
    async function run(a, b) {
      const dir = Math.sign(b - a);
      for (let i = a; i !== b; i += dir) {
        const C = chambers[dir > 0 ? i : i - 1];
        C.run = dir; C.box.material = litM(copperM); if (dir < 0) C.lab.userData.write(undo(C.st), { ink: '#6FE3FF' });
        ball.visible = true; ballGl.material.opacity = 0.9;
        await tween(RM ? 0 : 750, q => ball.position.set(ox(i) + (ox(i + dir) - ox(i)) * q, OY, mz), ease);
        C.run = 0; C.box.material = copperM; C.lab.userData.write(rule && !C.shown ? '?' : C.st, { ink: '#FFE69A' });
      }
      ball.visible = false; ballGl.material.opacity = 0; D.wake();
    }
    const S = api3(o), solve0 = S.solve;
    S.solve = (k, v) => { solve0(k, v); const i = +k.slice(1); queue = queue.then(() => sc.mode === 'out' ? run(i - 1, i) : run(i + 1, i)); };
    S.hint = () => { for (const C of chambers) if (C.back) C.back.visible = true; D.wake(); };
    S.finish = async () => {
      await queue;
      if (rule) for (const C of chambers) { C.shown = true; C.lab.userData.write(C.st, { ink: '#FFE69A' }); pop(C.lab); }
      await run(0, N);
    };
    onPick = o.still ? null : p => o.on?.('hole', p.key);
    go(frame(mx - 0.2, OY + 0.1, mz, width / 2 + 0.75, 1.25, 0.3));
    frogAt(mx - width / 2 - 0.2, mz + 1.0, 0.7);
    return S;
  }

  /* ---------- the series: lily pads on the moat, and the frog that hops along them ---------- */
  const padCellM = std(0x46A85A, { roughness: 0.6 }), PAD = new THREE.CylinderGeometry(0.42, 0.44, 0.07, 26), PAD_E = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.43, 0.43, 0.07, 18));
  PAD.userData.shared = PAD_E.userData.shared = true;
  function serStage(sc, o) {
    const n = sc.vals.length, [cx, cz] = SPOT.ser, STEP = 1.02, x = i => cx + (i - (n - 1) / 2) * STEP, z = i => cz + (i % 2 ? -0.2 : 0.2), Y = WY + 0.04;
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(PAD, padCellM); b.position.set(x(i), Y, z(i)); b.receiveShadow = true; stageG.add(b);
      // the number stands over its pad, looking at the yard
      const f = face(0.86, 0.56); f.position.set(0, 0.52, 0.05); b.add(f);
      cell3(`t${i}`, sc, b, f, padCellM, '#0E3A1C', { edges: PAD_E, bg: 'rgba(234,248,228,0.92)' });
    }
    // the jumps of the hint: an arc and its label between two pads
    const jumps = sc.jumps.map((j, i) => {
      const a = V(x(i), Y + 0.15, z(i)), b = V(x(i + 1), Y + 0.15, z(i + 1)), pts = [];
      for (let k = 0; k <= 16; k++) { const p = a.clone().lerp(b, k / 16); p.y += Math.sin(k / 16 * Math.PI) * 0.75; pts.push(p); }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0xFFFFFF, dashSize: 0.1, gapSize: 0.08, transparent: true, opacity: 0.6, toneMapped: false }));
      line.computeLineDistances(); line.visible = false; stageG.add(line);
      const tag = label(j, { h: 0.32, bg: '#F7C64E', ink: '#2A1C00' }); tag.position.copy(a.clone().lerp(b, 0.5)).add(V(0, 1.05, 0)); tag.visible = false; stageG.add(tag);
      return [line, tag];
    });
    const S = api3(o);
    S.hint = () => { for (const [l, t] of jumps) l.visible = t.visible = true; D.wake(); };
    // the frog waits on a pad of its own before the first number, and hops along the series at the end
    const home = V(x(0) - STEP * 0.95, Y + 0.04, cz - 0.1);
    stageG.add(mesh(new THREE.CircleGeometry(0.4, 24, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2).translate(home.x, WY + 0.03, home.z), padM, { cast: false }));
    frog.scale.setScalar(0.55); frogAt(home.x, home.z, 0.4, home.y);
    const padAt = i => i < 0 ? home : V(x(i), Y + 0.04, z(i) - 0.05);
    S.finish = async () => {
      for (let i = -1; i < n - 1 && !RM; i++) {
        const a = padAt(i), b = padAt(i + 1);
        await tween(300, q => { frog.position.lerpVectors(a, b, q); frog.position.y += Math.sin(q * Math.PI) * 0.7; }, q => q);
        frog.userData.y0 = frog.position.y; D.sparkle(b.clone().add(V(0, 0.1, 0)), 4, 0x9FEFFF, 0.2, 0.8, 2);
      }
      await sleep(RM ? 0 : 250);
    };
    onPick = o.still ? null : p => o.on?.('hole', p.key);
    go(frame(cx - STEP * 0.45, Y + 0.5, cz, (n + 1) * STEP / 2 + 0.1, 1.1, 0.3));
    return S;
  }

  /* ---------- the path of stones in the pond, to the door that opens with a number ---------- */
  const slateM = std(0x5E6F80, { roughness: 0.75, flatShading: true }), slateOnM = std(0x2E6A58, { roughness: 0.6, flatShading: true, emissive: 0x1E5A40, emissiveIntensity: 0.5 });
  const STONE = new THREE.CylinderGeometry(0.42, 0.47, 0.24, 7); STONE.userData.shared = true;
  function pathStage(sc, o) {
    const { R, C, grid } = sc, [pcx, pcz] = SPOT.path, STEP = 1.02, Y = WY + 0.1;
    const sx = c => pcx + (c - (C - 1) / 2) * STEP, sz = r => pcz + (r - (R - 1) / 2) * STEP;
    const stones = new Map();
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const m = new THREE.Mesh(STONE, slateM); m.position.set(sx(c), Y, sz(r)); m.rotation.y = (r * 7 + c * 13) % 5 * 0.3; m.castShadow = m.receiveShadow = true; stageG.add(m);
      const f = face(0.7, 0.44); f.position.set(sx(c), Y + 0.16, sz(r) + 0.05); f.rotation.x = -1.05; f.userData.write(grid[r][c], { ink: '#EAF8F4', edge: '#1B2730', size: 0.8 }); stageG.add(f);
      if (!o.still) pickable(m, 'stone', `${r}-${c}`);
      stones.set(`${r}-${c}`, m);
    }
    // where the frog starts, a lily pad on the left of the first stone; the door at the right of the last one, with its number
    const start = V(sx(0) - 1.1, Y, sz(0)), doorAt = V(sx(C - 1) + 1.2, Y, sz(R - 1));
    stageG.add(mesh(new THREE.CircleGeometry(0.48, 24, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2).translate(start.x, WY + 0.03, start.z), padM, { cast: false }));
    const door = new THREE.Group(); door.position.copy(doorAt); door.rotation.y = -0.5; stageG.add(door);
    door.add(mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.3, 9).translate(0, -0.05, 0), stone2M));
    door.add(mesh(arch(1.05, 1.5).translate(0, 0.1, -0.02), darkM), mesh(boxG(1.25, 0.18, 0.2, 0, 1.6, -0.02), stoneM));
    door.add(mesh(boxG(0.14, 1.5, 0.22, -0.6, 0.85, 0), stoneM), mesh(boxG(0.14, 1.5, 0.22, 0.6, 0.85, 0), stoneM));
    const leaf = new THREE.Group(); leaf.position.set(-0.46, 0.1, 0.06); door.add(leaf);
    leaf.add(mesh(arch(0.92, 1.38).translate(0.46, 0, 0), woodM));
    leaf.add(mesh(boxG(0.66, 0.4, 0.03, 0.46, 0.85, 0.03), plateM, { cast: false }));
    const plate = face(0.6, 0.36); plate.position.set(0.46, 0.85, 0.05); plate.userData.write(sc.target, { ink: '#FFE69A' }); leaf.add(plate);
    // the trail of the stones stepped on, and the number the frog carries in its bubble
    let trail = [], x = sc.start, hopping = Promise.resolve(), bubble = null;
    const trailLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xF7C64E, dashSize: 0.12, gapSize: 0.1, toneMapped: false })); stageG.add(trailLine);
    const posOf = () => trail.length ? stones.get(trail[trail.length - 1].join('-')).position.clone().add(V(0, 0.12, -0.05)) : start.clone().add(V(0, 0.03, 0));
    const say = () => { if (bubble) { stageG.remove(bubble); bubble.userData.dispose(); } bubble = label(String(x), { h: 0.42, bg: '#FFFDF5', ring: '#22304F', ink: '#22304F' }); stageG.add(bubble); bubble.position.copy(posOf()).add(V(0, 1.05, 0)); };
    const draw = () => {
      for (const m of stones.values()) m.material = slateM;
      for (const [r, c] of trail) stones.get(`${r}-${c}`).material = slateOnM;
      trailLine.geometry.dispose(); trailLine.geometry = new THREE.BufferGeometry().setFromPoints([start.clone().add(V(0, 0.2, 0)), ...trail.map(([r, c]) => V(sx(c), Y + 0.2, sz(r)))]); trailLine.computeLineDistances();
      D.wake();
    };
    const recompute = () => { x = trail.reduce((v, [r, c]) => stone(v, grid[r][c]), sc.start); };
    frog.scale.setScalar(0.55); frogAt(start.x, start.z, 0.6, Y + 0.03); say();
    const my = gen;
    const hop = () => { const to = posOf(); hopping = hopping.then(() => { if (my !== gen) return; const from = frog.position.clone(); return tween(RM ? 0 : 260, q => { frog.position.lerpVectors(from, to, q); frog.position.y += Math.sin(q * Math.PI) * 0.5; }, q => q).then(() => { frog.userData.y0 = to.y; if (bubble) bubble.position.copy(to).add(V(0, 1.05, 0)); }); }); };
    const S = api3(o);
    S.back = () => { if (!trail.length) return; trail.pop(); recompute(); draw(); say(); hop(); o.on?.('back', { x }); };
    S.reset = () => { trail = []; recompute(); draw(); say(); hop(); o.on?.('back', { x }); };
    onPick = o.still ? null : p => {
      if (p.kind !== 'stone') return;
      const [r, c] = p.key.split('-').map(Number), last = trail[trail.length - 1], prev = trail[trail.length - 2], st = stones.get(p.key);
      if (last && last[0] === r && last[1] === c) return;
      if (prev && prev[0] === r && prev[1] === c) return S.back();
      const near = last ? Math.abs(last[0] - r) + Math.abs(last[1] - c) === 1 : r === 0 && c === 0, seen = trail.some(([a, b]) => a === r && b === c);
      if (!near || seen) { wobble(st); return o.on?.('far', { first: !last }); }
      const y = stone(x, grid[r][c]);
      if (Number.isNaN(y)) { wobble(st); return o.on?.('blocked', { x, cell: grid[r][c] }); }
      trail.push([r, c]); x = y; draw(); say(); hop();
      o.on?.('step', { x, exit: r === R - 1 && c === C - 1 });
    };
    S.finish = async () => {
      await hopping;
      await tween(RM ? 0 : 500, q => { leaf.rotation.y = -q * 1.7; }, ease);
      const from = frog.position.clone(), to = doorAt.clone().add(V(0, 0.1, 0));
      if (bubble) bubble.visible = false;
      await tween(RM ? 0 : 400, q => { frog.position.lerpVectors(from, to, q); frog.position.y += Math.sin(q * Math.PI) * 0.6; }, q => q);
      frog.visible = false; D.sparkle(to.clone().add(V(0, 0.8, 0)), 14, 0xFFD36B, 0.35, 1.4, 2);
      await sleep(RM ? 0 : 400);
    };
    go(frame(pcx + 0.1, Y + 0.3, pcz + 0.1, C * STEP / 2 + 1.75, R * STEP / 2 * 0.8 + 1.0, 0.95));
    return S;
  }

  const STAGES = { pyr: pyrStage, bal: balStage, bal3: bal3Stage, lock: lockStage, mach: machStage, ser: serStage, path: pathStage };
  // The scene of a round, built at its place, and the camera flies there: the calls of draw.js's scene() for it. null for the paper
  // puzzles, which the panel draws (the frog waits at its table of plans, the camera with it). o: { t, on(event, data), board (the
  // board of the panel, for what of the scene is paper), still (a picture only, for «Caça l'errada») }
  function stage(sc, o = {}) {
    rest();
    const f = sc && STAGES[sc.s];
    if (!f) { go('desk'); canvas.dataset.escena = 'paper'; return null; }
    if (o.board) { o.board.innerHTML = ''; o.board.classList.remove('hint', 'won'); }
    canvas.dataset.escena = sc.s;
    return f(sc, o);
  }
  // A number right in its hole is a brick of the castle: one flies from there (or from the frog, for a cell in the panel) over the moat to
  // the castle, and lands with a spark
  const FLY = new THREE.BoxGeometry(0.34, 0.17, 0.17); FLY.userData.shared = true;
  function brick(k) {
    if (RM) return;
    const C = cells3.get(k), from = C ? worldOf(C.body) : frog.position.clone().add(V(0, 0.8, 0)), to = V((Math.random() - 0.5) * 6, FH + 1.6 + Math.random() * 1.6, -5.4);
    const b = mesh(FLY, terraM); b.position.copy(from); scene.add(b);
    const top = Math.max(from.y, to.y) + 2.2;
    tween(950, q => { b.position.lerpVectors(from, to, q); b.position.y = from.y + (to.y - from.y) * q + Math.sin(q * Math.PI) * (top - Math.max(from.y, to.y)); b.rotation.set(q * 6, q * 4, 0); b.scale.setScalar(1 - q * 0.5); }, q => q)
      .then(() => { scene.remove(b); D.sparkle(to, 6, 0xFFB070, 0.25, 1.0, 2.5); });
  }

  let sound = { tone() {}, chime() {} };
  state({});
  return { ok: true, layout, go, get view() { return viewName; }, state, highlight, pause: D.pause, celebrate: (t, at) => D.celebrate(t, at), shake: D.shake,
    hear: o => { sound = { ...sound, ...o }; }, lamps: hue => { lampHue = hue; paintLamps(); }, rest, stage, where, validate, banner, brick, frogSay,
    _: { D, parts, banners, frog } };
}

/* ---------- the frog of the works: the one of the other games, in a builder's hard hat ---------- */
// about one unit tall, looking at +z; its body breathes (userData.body)
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4), hat: mat(0xF7C64E, { roughness: 0.4 }), brim: mat(0xE9B23A, { roughness: 0.4 }) };
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
  // the hard hat, over the eyes
  body.add(mesh(new THREE.SphereGeometry(0.3, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.78, 0.02), k.hat));
  body.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 20).translate(0, 0.79, 0.05), k.brim));
  body.add(mesh(new THREE.BoxGeometry(0.06, 0.2, 0.5).translate(0, 0.94, 0.02), k.brim));
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
