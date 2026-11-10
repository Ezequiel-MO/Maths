// El castell dels números in 3D, built on shared/diorama.js: a block of earth floating in the dusk with a castle being built on it. At the
// back, the castle of nine parts (three foundations, three walls with the gate in the middle, three towers) behind a moat; in front of it,
// the yard of the works, and the pond on the right. A part not built yet is a blueprint of light; a project validated raises it in stone,
// with its windows lit. Every exam passed raises a banner by the moat.
// Every puzzle that is a thing has its place, and the camera flies there: the tower of bricks and the balance in the yard, the padlock
// at the head of the bridge, the machine on its bench, the series on the lily pads of the moat and the path of stones in the pond. The
// puzzles that are paper stay drawn in the panel (draw.js), and the frog of the works waits at its table of plans.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL castle() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, glowTex, ease, easeOut, SPH, V } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';
import { CIRCLES } from './logic.js';

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
export const SPOT = { pyr: [-6.6, 2.1], bal: [0, 2.7], mach: [6.7, 1.45], lock: [0, -1.25], ser: [-5.8, MZ], path: [PC[0], PC[1]], desk: [-6.9, 6.7] };
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
  // three banners by the moat, one per exam: furled and grey at the foot of their pole, raised in the colour of their circle
  const banners = RING.map((h, c) => {
    const x = -10.0 + c * 1.15, z = -1.0;
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
  const lamps = [[-2.3, -0.9], [2.3, -0.9], [-3.4, 8.3], [3.4, 8.3]].map(([x, z]) => {
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
  function frogAt(x, z, ry = 0, y = 0) { frog.position.set(x, y, z); frog.rotation.y = ry; frog.userData.y0 = y; frog.visible = true; D.wake(); }
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
      if (hlOn >= 0) { const P = parts[hlOn], p = 0.5 + 0.5 * Math.sin(now * 0.006); if (P.built) P.gl.material.opacity = 0.35 + p * 0.45; else { P.fill.opacity = 0.12 + p * 0.12; P.line.opacity = 0.75 + p * 0.25; } busy = true; }
    }
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
    // a short wait, so a finger that crosses the list does not shake the camera
    if (viewName === 'map' || viewName?.[0] === 'c') hlTimer = setTimeout(() => { if (viewName !== to) go(to, { dur: 900 }); }, 220);
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
  // what is on the stage now: its objects go away with rest()
  const stageG = new THREE.Group(); scene.add(stageG);
  // takes away a thing and gives back what it holds, but for the shapes many things share
  function drop(o) { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); if (x.isSprite) x.material.dispose(); }); }
  let gen = 0;
  function rest() { gen++; for (const o of [...stageG.children]) drop(o); canvas.dataset.escena = ''; frogHome(); D.wake(); }
  // the scene of a round: null for the paper puzzles, which the panel draws (the frog waits at its table of plans, the camera with it)
  function stage(sc, o = {}) {
    rest();
    go('desk'); canvas.dataset.escena = 'paper';
    return null;
  }
  // the point of the screen where a thing of the scene on show is: for the checks, and to touch it
  function where() { return null; }
  // a number right in its hole is a brick of the castle: one flies from there to the castle
  function brick() {}

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
