// El mercat de l'estany in 3D, built on shared/diorama.js: a block of earth floating in the dusk with the market square of the pond on it.
// In the middle, the stall of the frog: a counter with its green mat where the money lands, the register that rings and opens, the kitchen
// scale with its needle, and a bench in front with the crates of what is sold and their price tags. On the left the table with the
// scales of two pans; on the right the piggy bank; at the front the crate of fruit, the lemonade stand and the pond; at the back the bank
// of the pond and, when they come, the stalls next door. The frog behind the counter is alive: it breathes, leaps when something is
// right and shakes its head when it is not. The customers are the people of the hotel: they walk to the counter, ask, pay and go away
// with what they bought. Every project validated adds a piece to the stall (the twelve of MARKET_STEPS, draw.js), and the next one waits
// as a ghost of light; every exam passed lights a paper lantern.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL market3d() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, glowTex, boxG, std, mesh, part, mat, bake, label, easeOut, SPH, CONE, CYL, V } from '../../shared/diorama.js';
import { makeGuest } from '../hotel-de-l-estany/world.js';
import { RM } from '../../shared/util.js';
import { eur, gr, isBill } from './logic.js';

/* ---------- the measures of the world ---------- */
// One unit is about a hand of the frog. The grass at 0; the block from YB up, x from X0 to X1 and z from Z0 (back) to Z1 (front)
const YB = -4.4, WY = -0.3, BY = -1.2, X0 = -12, X1 = 12, Z0 = -9.6, Z1 = 8.6;
// the pond: an ellipse round PC with radii PR, at the front on the right
const PC = [7.4, 5.9], PR = [3.2, 1.9];
const wob = a => 1 + 0.04 * Math.sin(3 * a + 0.4) + 0.03 * Math.sin(5 * a + 1.3);
const POND = Array.from({ length: 56 }, (_, i) => { const a = i / 56 * Math.PI * 2, k = wob(a); return [PC[0] + PR[0] * Math.cos(a) * k, PC[1] + PR[1] * Math.sin(a) * k]; });
// the counter of the stall (its top at TOP, its front at z = CZ), the mat on it, the register, the kitchen scale and the bench in front
const TOP = 1.18, CZ = -0.4, MAT = { x: -0.15, z: -1.0, w: 3.0, d: 0.95, y: TOP + 0.012 }, REG = [2.75, -1.05], DIAL = [-2.75, -1.0], BENCH = { y: 0.62, z: 0.1 };
// the places round the square: the scales of two pans, the piggy bank, the crate of fruit, the lemonade, the bank and its little counter
const SCALE = [-7.4, -0.8], PIG = [7.4, -1.2], CRATE = [-4.4, 4.0], LEMON = [-8.6, 4.6], BANK = [8.0, -6.6];
const BANK_MAT = { x: 8.3, z: -5.12, w: 1.3, d: 0.44, y: 1.1 };
// where a customer stands to be served, and the line of the rush hour behind; the way in and the way out
const SPOT = [2.9, 1.75], LINE = [[4.4, 2.35], [5.8, 2.8], [7.2, 3.1], [8.6, 3.3]], IN = [11.4, 2.6], NEAR = [7.4, 2.5], OUT = [[4.6, 0.9], [5.0, -4.4], [5.2, -9.8]];
// the colour of the paper lantern of each circle: the rings of the map
export const RING = [45, 140, 320, 195];
const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);
const backOut = k => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
const FONT = s => `800 ${s}px "Baloo 2", system-ui, sans-serif`;
const EMOJI = s => `${s}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`;
// the twelve pieces the stall gets, one for each project validated (the same order as MARKET_STEPS in draw.js)
const STEPS = 12;

export function market3d(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('mercat 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, hear() {}, rest() {}, frogSay() {},
    coins() {}, items() {}, mark() {}, unmark() {}, seq() {}, dial() {}, crate() {}, piggy() {}, receipt() {}, counter() {}, lcd() {}, ring() {}, scale() {}, pan() {},
    client: p, served: p, upset() {}, queue() {}, grow: p, lantern: p, open() {}, where: () => null, onPick: null };
}

function build(canvas) {
  const small = () => { const { w, h } = D.size(); return Math.min(w, h) < 430; };
  const VIEWS = {
    map: { t: [0, 0.8, -0.8], dir: [0.18, 0.78, 1], R: 12.6 },
    // the stall seen from the front: the frog, the counter and the bench with its crates
    stall: { get t() { return [small() ? 0 : -0.1, 1.15, -0.5]; }, dir: [0, 0.38, 1], get R() { return small() ? 3.7 : 4.5; } },
    // the green mat seen from above, where coins are read and counted
    counter: { t: [MAT.x, TOP, MAT.z + 0.05], dir: [0, 1.5, 1], get R() { return small() ? 1.55 : 1.85; } },
    // paying: the mat, the register and the bench in front
    pay: { get t() { return [0.5, 1.0, -0.35]; }, dir: [0, 0.95, 1], get R() { return small() ? 2.6 : 3.2; } },
    // giving the change: the customer in front of the register
    shop: { t: [1.3, 1.25, 0.2], dir: [-0.05, 0.55, 1], get R() { return small() ? 2.7 : 3.4; } },
    dial: { t: [DIAL[0], TOP + 0.5, DIAL[1] + 0.3], dir: [0, 0.18, 1], R: 0.95 },
    weigh: { t: [SCALE[0], 1.95, SCALE[1]], dir: [0.45, 0.3, 1], R: 1.75 },
    piggy: { t: [PIG[0] + 0.35, 1.5, PIG[1] + 0.1], dir: [-0.1, 0.28, 1], R: 1.75 },
    crate: { t: [CRATE[0], 0.3, CRATE[1]], dir: [0, 1.9, 1], R: 2 },
    lemon: { t: [LEMON[0] + 0.3, 1.2, LEMON[1]], dir: [0.3, 0.38, 1], R: 2.3 },
    bank: { t: [BANK[0] + 0.3, 1.65, BANK[1] + 1.1], dir: [0.35, 0.42, 1], get R() { return small() ? 2.0 : 2.4; } },
    queue: { t: [3.2, 1.15, 1.0], dir: [-0.05, 0.42, 1], get R() { return small() ? 3.8 : 4.5; } }
  };
  const D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-13, 18, 14], shadow: { left: -14, right: 14, top: 13, bottom: -13 }, floor: YB - 4, under: [0, YB - 2.4, -0.5, 33, 28] });
  const { scene, glow, tween } = D;
  const fixed = new THREE.Group(); scene.add(fixed);
  // the view on show, by name: diorama's layout() forgets it, so it is kept here and given back
  let viewName = 'map';
  // The pieces of the stall over the counter (the awning, its lights, the sign, the bunting, the balloons and the star) would stand between
  // the camera and the green mat when it looks down at the money: in those views they are put away
  const ROOF = [0, 1, 3, 5, 10, 11], LOW = new Set(['counter', 'pay']);
  let roofOn = true;
  const roof = on => { if (on === roofOn) return; roofOn = on; setBuilt(built + 1); };
  const go = (v, o) => { viewName = typeof v === 'string' ? v : null; roof(!LOW.has(viewName)); return D.go(v, o); };
  const layout = (kind, x) => { D.layout(kind, x); if (viewName && D.view !== viewName) D.go(viewName, { dur: 700 }); };
  let sound = { tone() {}, chime() {} };
  const HIT = () => HIT.m || (HIT.m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }));
  const drop = o => { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.isSprite) x.material.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); }); };

  /* ---------- the block of earth, with the pond cut into its top ---------- */
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
    s.holes.push(outline(POND, new THREE.Path()));
    const g = new THREE.ExtrudeGeometry(s, { depth: -BY, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2).translate(0, BY, 0);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 + p.getY(i) / HB);
    const wallTex = soilTex.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(0.12, 1);
    scene.add(mesh(g, [std(0x6DBB6A, { roughness: 0.9 }), std(0xffffff, { map: wallTex, roughness: 0.95 })], { cast: false }));
    const bt = soilTex.clone(); bt.needsUpdate = true; bt.repeat.set(1.5, (BY - YB) / HB);
    const side = std(0xffffff, { map: bt, roughness: 0.95 }), mud = std(0x4A3A26, { roughness: 1 }), dark = std(0x3A2617, { roughness: 1 });
    scene.add(mesh(boxG(X1 - X0, BY - YB, Z1 - Z0, (X0 + X1) / 2, (BY + YB) / 2, (Z0 + Z1) / 2), [side, side, mud, dark, side, side], { cast: false }));
  }
  const water = mesh(new THREE.ShapeGeometry(outline(POND, new THREE.Shape()), 4).rotateX(-Math.PI / 2).translate(0, WY, 0),
    std(0x2B8FA8, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.88, envMapIntensity: 1.25, emissive: 0x0B3F52, emissiveIntensity: 0.35 }), { cast: false });
  water.renderOrder = 1; scene.add(water);
  const padM = std(0x4FA65A, { roughness: 0.6, side: THREE.DoubleSide }), flowerM = std(0xFFB3D9, { emissive: 0xFF5FA8, emissiveIntensity: 0.15 });
  for (const [x, z, r] of [[5.4, 5.6, 0.42], [6.4, 6.6, 0.32], [9.4, 5.0, 0.4], [8.8, 6.8, 0.34], [7.2, 4.6, 0.3]]) {
    fixed.add(mesh(new THREE.CircleGeometry(r, 24, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2).translate(x, WY + 0.02, z), padM, { cast: false }));
    if (r > 0.38) fixed.add(part(SPH, flowerM, [0.12, 0.09, 0.12], [x + 0.08, WY + 0.08, z - 0.05]));
  }
  const IC = new THREE.IcosahedronGeometry(1, 0), pebM = std(0xA69C8A, { roughness: 0.9, flatShading: true });
  for (let i = 0; i < 34; i++) { const [x, z] = POND[(i * 5) % 56], s = 0.14 + (i * 37 % 10) / 44; fixed.add(part(IC, pebM, [s, s * 0.55, s], [x, 0.02, z])); }
  const reedM = std(0x3E7F47), catM = std(0x6B4226, { roughness: 0.9 });
  for (const [i0, n] of [[4, 4], [18, 4], [36, 5], [48, 3]]) for (let j = 0; j < n; j++) {
    const [x, z] = POND[(i0 + j) % 56], h = 0.9 + (j % 3) * 0.3, dx = (x - PC[0]) * 0.04, dz = (z - PC[1]) * 0.06;
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5).translate(x - dx, WY + h / 2, z - dz), reedM));
    if (j % 2 === 0) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8).translate(x - dx, WY + h - 0.05, z - dz), catM));
  }
  // trees, bushes and flowers round the square
  const trunkM = std(0x7A5230), LEAF = [0x4E9F5B, 0x67B565, 0x3F8A4E];
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(LEAF[(i + Math.round(Math.abs(x))) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-10.6, -8.4, 1.3], [11.0, -8.8, 1.1], [-11.0, 7.4, 0.85], [11.1, 0.4, 0.8], [-11.1, 1.2, 0.8], [1.6, 7.8, 0.7], [-1.2, -8.8, 0.9]]) tree(x, z, s);
  const bushM = std(0x4F9C58, { flatShading: true });
  for (const [x, z, s] of [[-11.2, -3.8, 0.5], [11.2, -4.4, 0.45], [-1.4, 7.6, 0.4], [-11.0, 4.0, 0.45], [11.2, 7.6, 0.4], [3.4, 7.4, 0.35]])
    fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  for (let i = 0; i < 26; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.06, 0.05, 0.06], [i % 2 ? -11.2 + (i * 13 % 30) / 10 : -2.6 + (i * 7 % 40) / 10, 0.06, i % 2 ? 2.6 + (i * 47 % 50) / 10 : 6.0 + (i * 29 % 24) / 10]));

  /* ---------- the square: paving stones ---------- */
  const paveTex = canvasTex(512, 512, (g, w) => {
    g.fillStyle = '#B9A88E'; g.fillRect(0, 0, w, w);
    for (let y = 0, r = 0; y < w; y += 64, r++) for (let x = (r % 2) * -32; x < w; x += 64) {
      g.fillStyle = ['#CDBCA0', '#C4B191', '#D6C7AC', '#BFAB8B'][(x * 7 + y * 3) / 32 & 3]; g.beginPath(); g.roundRect(x + 3, y + 3, 58, 58, 10); g.fill();
    }
  });
  paveTex.wrapS = paveTex.wrapT = THREE.RepeatWrapping; paveTex.repeat.set(8, 4);
  scene.add(mesh(new THREE.PlaneGeometry(21.6, 11.2).rotateX(-Math.PI / 2).translate(0, 0.012, -3.1), std(0xffffff, { map: paveTex, roughness: 0.92 }), { cast: false }));

  /* ---------- the stall of the frog ---------- */
  const woodM = std(0xB9793F, { roughness: 0.75 }), wood2M = std(0x8B5A3C, { roughness: 0.8 }), wood3M = std(0x6B3E1C, { roughness: 0.85 });
  const creamM = std(0xFFF3E0, { roughness: 0.7 }), redM = std(0xFF6B5E, { roughness: 0.6 }), red2M = std(0xB5392F, { roughness: 0.6 });
  const steelM = std(0x6F8C9E, { roughness: 0.45, metalness: 0.45 }), steel2M = std(0x4B6475, { roughness: 0.5, metalness: 0.4 }), goldM = std(0xF7C64E, { roughness: 0.35, metalness: 0.5 });
  // the counter, its top board and its front of planks
  fixed.add(mesh(boxG(7.2, TOP - 0.08, 1.2, 0, (TOP - 0.08) / 2, CZ - 0.6), woodM));
  fixed.add(mesh(boxG(7.4, 0.08, 1.34, 0, TOP - 0.04, CZ - 0.6), wood2M));
  for (let x = -3.3; x <= 3.3; x += 0.6) fixed.add(mesh(boxG(0.04, TOP - 0.2, 0.03, x, (TOP - 0.1) / 2, CZ + 0.005), wood2M, { cast: false }));
  // the green mat where the money lands
  fixed.add(mesh(boxG(MAT.w, 0.02, MAT.d, MAT.x, TOP + 0.002, MAT.z), std(0x2E7D5B, { roughness: 0.95 }), { cast: false }));
  fixed.add(mesh(boxG(MAT.w + 0.08, 0.015, MAT.d + 0.08, MAT.x, TOP - 0.002, MAT.z), goldM, { cast: false }));
  // the bench in front, with two steps
  fixed.add(mesh(boxG(7.0, BENCH.y, 0.9, 0, BENCH.y / 2, BENCH.z), wood2M));
  fixed.add(mesh(boxG(7.1, 0.05, 0.96, 0, BENCH.y + 0.02, BENCH.z), woodM));
  // the four posts, the back shelf and the step the frog stands on
  for (const x of [-3.85, 3.85]) for (const z of [CZ + 0.05, -3.1]) fixed.add(mesh(boxG(0.18, 3.5, 0.18, x, 1.75, z), wood3M));
  for (const y of [0.5, 1.25, 2.0]) fixed.add(mesh(boxG(6.8, 0.08, 0.7, 0, y, -2.85), woodM));
  fixed.add(mesh(boxG(6.9, 2.1, 0.08, 0, 1.05, -3.22), wood2M));
  fixed.add(mesh(boxG(1.6, 0.5, 1.0, -0.6, 0.25, -1.95), wood3M));
  // the crates of the back shelf that are always there: apples, pears, bread
  const PICS = new Map();
  const picTex = pic => { if (!PICS.has(pic)) PICS.set(pic, canvasTex(160, 160, (g, w) => { g.font = EMOJI(w * 0.72); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(pic, w / 2, w * 0.55); })); return PICS.get(pic); };
  function pic(p, s, o = {}) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: picTex(p), transparent: true, depthWrite: false, toneMapped: false, depthTest: o.depthTest ?? true }));
    sp.scale.set(s, s, 1); sp.renderOrder = o.order ?? 4; sp.userData.dispose = () => sp.material.dispose(); return sp;
  }
  // a crate of wood with a pile of p on top: w its width; into parent at x, y, z
  function crateOf(parent, p, x, y, z, w = 0.9, n = 5) {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    g.add(mesh(boxG(w, 0.34, 0.62, 0, 0.17, 0), woodM));
    for (const dy of [0.1, 0.24]) g.add(mesh(boxG(w + 0.02, 0.04, 0.64, 0, dy, 0), wood3M, { cast: false }));
    const s = Math.min(0.36, w / 2.6);
    for (let i = 0; i < n; i++) { const row = i < 3 ? 0 : 1, k = row ? i - 3 : i, inRow = row ? n - 3 : Math.min(3, n), sp = pic(p, s); sp.position.set((k - (inRow - 1) / 2) * s * 0.85, 0.34 + s * 0.38 + row * s * 0.42, row ? -0.08 : 0.08); g.add(sp); }
    return g;
  }
  crateOf(fixed, '🍎', -2.6, 1.29, -2.85, 0.9); crateOf(fixed, '🍐', 0.9, 1.29, -2.85, 0.9); crateOf(fixed, '🥖', 0.3, 2.04, -2.85, 0.9, 3);
  crateOf(fixed, '🥛', 2.4, 0.54, -2.85, 0.9, 3); crateOf(fixed, '🧀', -2.2, 0.54, -2.85, 0.9, 3);

  /* ---------- the register: its screen, its keys, its drawer and the slot of the receipt ---------- */
  const reg = new THREE.Group(); reg.position.set(REG[0], TOP, REG[1]); scene.add(reg);
  reg.add(mesh(boxG(0.95, 0.32, 0.8, 0, 0.16, 0), steel2M));
  const drawer = mesh(boxG(0.85, 0.16, 0.7, 0, 0.1, 0.05), steelM); drawer.userData.keep = true; reg.add(drawer);
  reg.add(mesh(new THREE.BoxGeometry(0.9, 0.24, 0.6).rotateX(-0.5).translate(0, 0.42, 0.05), std(0x4D7486, { roughness: 0.5 })));
  for (let i = 0; i < 9; i++) reg.add(part(new THREE.BoxGeometry(1, 1, 1), std([0xEAF7FF, 0xF7C64E, 0x7CF5B0][i % 3], { roughness: 0.4 }), [0.12, 0.04, 0.09], [-0.25 + (i % 3) * 0.17, 0.46 - Math.floor(i / 3) * 0.055, 0.12 + Math.floor(i / 3) * 0.1], [-0.5, 0, 0]));
  reg.add(mesh(boxG(0.5, 0.36, 0.12, 0, 0.66, -0.3), std(0x2A4B5C, { roughness: 0.5 })));
  reg.add(mesh(boxG(0.3, 0.05, 0.08, 0.28, 0.86, -0.28), std(0x111111), { cast: false }));
  const lcdTex = canvasTex(320, 200, () => {}), lcdM = new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false });
  const lcdS = mesh(new THREE.PlaneGeometry(0.46, 0.29), lcdM, { cast: false, at: [0, 0.66, -0.235] }); lcdS.userData.keep = true; reg.add(lcdS);
  bake(reg);
  // the screen of the cash machine of the bank, the other place money is put
  const atmTex = canvasTex(320, 200, () => {}), atmM = new THREE.MeshBasicMaterial({ map: atmTex, toneMapped: false });
  function paintLcd(tex, top, cents, hue = 160) {
    const g = tex.image.getContext('2d'), w = 320, h = 200;
    g.fillStyle = '#062019'; g.fillRect(0, 0, w, h); g.strokeStyle = `hsl(${hue} 80% 55%)`; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = `hsl(${hue} 90% 60%)`; g.shadowBlur = 14; g.fillStyle = `hsl(${hue} 90% 72%)`;
    g.font = FONT(46); g.fillText(top, w / 2, 52); g.font = FONT(84); g.fillText(cents == null ? '' : `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')} €`, w / 2, 132);
    tex.needsUpdate = true; D.wake();
  }
  let lcdNow = 0, lcdShown = 0, lcdTop = 'MERCAT', place = 'stall';
  // what the screen of the register (or of the bank) says: a word on top and an amount, counted up from the one before
  function lcd(top, cents = null) {
    lcdTop = top; const from = lcdShown, to = cents ?? 0; lcdNow = to;
    const tex = place === 'bank' ? atmTex : lcdTex;
    if (cents == null || RM) { lcdShown = to; return paintLcd(tex, top, cents); }
    tween(260, k => { lcdShown = Math.round(from + (to - from) * k); paintLcd(tex, lcdTop, lcdShown); });
  }
  paintLcd(lcdTex, 'MERCAT', null); paintLcd(atmTex, 'BANC', null);
  let drawerOpen = 0;
  // the drawer comes out, and the coins in it shine
  function openDrawer() { drawerOpen = 1; const at = V(REG[0], TOP + 0.3, REG[1] + 0.5); D.sparkle(at, 14, 0xFFE08A, 0.32, 1.8, 2.6); tween(RM ? 0 : 260, k => { drawer.position.z = 0.05 + 0.42 * k; }, easeOut); }
  function shutDrawer() { if (!drawerOpen) return; drawerOpen = 0; drawer.position.z = 0.05; }

  /* ---------- the kitchen scale on the counter ---------- */
  const dialTex = canvasTex(256, 256, () => {});
  const ks = new THREE.Group(); ks.position.set(DIAL[0], TOP, DIAL[1]); scene.add(ks);
  ks.add(mesh(new THREE.BoxGeometry(0.86, 0.72, 0.6).translate(0, 0.36, 0), redM));
  ks.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.14, 10).translate(0, 0.79, 0), steel2M));
  ks.add(mesh(new THREE.CylinderGeometry(0.44, 0.4, 0.05, 28).translate(0, 0.88, 0), std(0xC9D6DB, { roughness: 0.35, metalness: 0.5 })));
  ks.add(mesh(new THREE.TorusGeometry(0.33, 0.03, 8, 32).translate(0, 0.38, 0.305), red2M, { cast: false }));
  const dialFace = mesh(new THREE.CircleGeometry(0.32, 40), new THREE.MeshBasicMaterial({ map: dialTex, toneMapped: false }), { cast: false, at: [0, 0.38, 0.302] }); dialFace.userData.keep = true; ks.add(dialFace);
  const needle = new THREE.Group(); needle.position.set(0, 0.38, 0.31); needle.userData.keep = true; ks.add(needle);
  needle.add(mesh(new THREE.BoxGeometry(0.018, 0.27, 0.008).translate(0, 0.12, 0), new THREE.MeshBasicMaterial({ color: 0x04131C }), { cast: false }));
  needle.add(mesh(new THREE.CircleGeometry(0.03, 16).translate(0, 0, 0.006), new THREE.MeshBasicMaterial({ color: 0xF7C64E }), { cast: false }));
  bake(ks);
  function paintDial(max) {
    const g = dialTex.image.getContext('2d'), w = 256, c = w / 2, big = max > 2000 ? 1000 : 500;
    g.fillStyle = '#FFF8E6'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
    g.strokeStyle = '#04131C'; g.fillStyle = '#04131C'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let x = 0; x <= max; x += 100) {
      const a = (-120 + 240 * x / max) * Math.PI / 180, long = x % big === 0, r0 = long ? 92 : 102;
      g.lineWidth = long ? 6 : 3; g.beginPath(); g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c + Math.sin(a) * 118, c - Math.cos(a) * 118); g.stroke();
      if (long) { g.font = FONT(24); g.fillText(String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), c + Math.sin(a) * 70, c - Math.cos(a) * 70 + 2); }
    }
    g.font = FONT(22); g.fillStyle = '#7A5A1E'; g.fillText('grams', c, c + 62);
    dialTex.needsUpdate = true;
  }
  paintDial(2000);
  let needleAt = -120, needleTo = -120, needleV = 0;
  const setNeedle = a => { needleAt = a; needle.rotation.z = -a * Math.PI / 180; };
  setNeedle(-120);

  /* ---------- the scales of two pans, on their table ---------- */
  fixed.add(mesh(boxG(2.8, 0.1, 1.4, SCALE[0], 0.85, SCALE[1]), woodM));
  for (const dx of [-1.25, 1.25]) for (const dz of [-0.55, 0.55]) fixed.add(mesh(boxG(0.1, 0.8, 0.1, SCALE[0] + dx, 0.4, SCALE[1] + dz), wood3M));
  const brassM = std(0xE2BA4C, { roughness: 0.3, metalness: 0.75 }), PIV = V(SCALE[0], 2.55, SCALE[1]), ARM = 1.05, HANG = 0.8;
  fixed.add(mesh(boxG(0.8, 0.1, 0.5, SCALE[0], 0.95, SCALE[1]), brassM));
  fixed.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, PIV.y - 1.0, 12).translate(SCALE[0], (PIV.y + 1.0) / 2, SCALE[1]), brassM));
  const beam = new THREE.Group(); beam.position.copy(PIV); beam.userData.keep = true; scene.add(beam);
  beam.add(mesh(new THREE.BoxGeometry(ARM * 2 + 0.2, 0.07, 0.09), brassM));
  beam.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16).rotateX(Math.PI / 2), goldM));
  const cordM = new THREE.MeshStandardMaterial({ color: 0xC9D6DB, roughness: 0.5 });
  const makePan = () => {
    const g = new THREE.Group(); g.userData.keep = true; scene.add(g);
    for (const s of [-1, 1]) { const c = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.82, 4), cordM, { cast: false }); c.position.set(s * 0.21, -0.39, 0); c.rotation.z = s * 0.5; g.add(c); }
    g.add(mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.06, 28).translate(0, -HANG, 0), std(0xC9D6DB, { roughness: 0.3, metalness: 0.6 })));
    const load = new THREE.Group(); load.position.y = -HANG + 0.03; g.add(load); g.userData.load = load;
    return g;
  };
  const panL = makePan(), panR = makePan();
  const panHit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.0), HIT()); panHit.position.y = -HANG + 0.25; panR.add(panHit);
  let beamA = -16, beamTo = -16, beamV = 0, scaleQ = null, panVals = [];
  const placeBeam = a => {
    beamA = a; const r = -a * Math.PI / 180; beam.rotation.z = r;
    panL.position.set(PIV.x - ARM * Math.cos(r), PIV.y - ARM * Math.sin(r), PIV.z); panR.position.set(PIV.x + ARM * Math.cos(r), PIV.y + ARM * Math.sin(r), PIV.z);
  };
  placeBeam(-16);
  let tagL = null, tagR = null;

  /* ---------- the piggy bank on its table ---------- */
  fixed.add(mesh(boxG(2.6, 0.1, 1.3, PIG[0] + 0.4, 0.85, PIG[1]), woodM));
  for (const dx of [-0.85, 1.65]) for (const dz of [-0.5, 0.5]) fixed.add(mesh(boxG(0.1, 0.8, 0.1, PIG[0] + dx, 0.4, PIG[1] + dz), wood3M));
  const pig = new THREE.Group(); pig.position.set(PIG[0], 0.9, PIG[1]); pig.userData.keep = true; scene.add(pig);
  {
    const pink = mat(0xF48FB5, { roughness: 0.45 }), pink2 = mat(0xE86E9C, { roughness: 0.5 }), dark = mat(0x7A1E44);
    pig.add(part(SPH, pink, [0.62, 0.46, 0.44], [0, 0.52, 0]));
    pig.add(part(CYL, pink2, [0.17, 0.12, 0.17], [0.64, 0.5, 0], [0, 0, Math.PI / 2]));
    for (const s of [-1, 1]) { pig.add(part(SPH, dark, [0.025, 0.035, 0.025], [0.71, 0.5, s * 0.06])); pig.add(part(CONE, pink2, [0.11, 0.18, 0.08], [0.36, 0.95, s * 0.2], [0, 0, -0.4])); pig.add(part(SPH, mat(0x04131C, { roughness: 0.2 }), [0.045, 0.045, 0.045], [0.5, 0.68, s * 0.24])); }
    for (const [x, z] of [[-0.32, -0.22], [-0.32, 0.22], [0.3, -0.22], [0.3, 0.22]]) pig.add(part(CYL, pink2, [0.08, 0.2, 0.08], [x, 0.1, z]));
    pig.add(mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 16, Math.PI * 1.5).translate(-0.66, 0.6, 0), pink2));
    pig.add(part(new THREE.BoxGeometry(1, 1, 1), dark, [0.3, 0.03, 0.07], [-0.02, 0.98, 0]));
    bake(pig);
  }
  pig.rotation.y = -0.25;
  // the goal of the savings stands on a little stand next to the pig
  fixed.add(mesh(boxG(0.6, 0.28, 0.5, PIG[0] + 1.3, 1.04, PIG[1] + 0.05), wood2M));

  /* ---------- the lemonade stand ---------- */
  {
    const [x, z] = LEMON, yel = std(0xFFE04A, { roughness: 0.6 });
    fixed.add(mesh(boxG(2.4, 0.9, 1.0, x, 0.45, z), std(0xF3FBF8, { roughness: 0.7 })));
    fixed.add(mesh(boxG(2.5, 0.07, 1.1, x, 0.93, z), yel));
    for (let i = 0; i < 6; i++) fixed.add(mesh(boxG(0.4, 0.86, 0.02, x - 1.0 + i * 0.4, 0.45, z + 0.505), i % 2 ? creamM : yel, { cast: false }));
    for (const dx of [-1.15, 1.15]) fixed.add(mesh(boxG(0.08, 2.3, 0.08, x + dx, 1.15, z - 0.4), wood3M));
    for (let i = 0; i < 6; i++) fixed.add(mesh(new THREE.BoxGeometry(0.45, 0.05, 1.2).rotateX(0.32).translate(x - 1.125 + i * 0.45, 2.32, z - 0.1), i % 2 ? creamM : yel));
    // a jug of lemonade, glasses and a pile of lemons
    fixed.add(mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.5, 18).translate(x - 0.6, 1.22, z - 0.1), std(0xFFE97A, { roughness: 0.15, emissive: 0xFFC400, emissiveIntensity: 0.25 })));
    for (let i = 0; i < 4; i++) fixed.add(mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.2, 12).translate(x + 0.05 + i * 0.22, 1.07, z + 0.15), std(0xFFF2A0, { roughness: 0.2, emissive: 0xFFC400, emissiveIntensity: 0.2 })));
    for (let i = 0; i < 5; i++) fixed.add(part(SPH, yel, [0.11, 0.09, 0.09], [x + 0.65 + (i % 3) * 0.17, 1.03 + (i > 2 ? 0.12 : 0), z - 0.2 + (i > 2 ? 0.04 : 0)]));
    const sign = label('LLIMONADA', { h: 0.36, bg: '#FFE04A', ring: '#B5822A', ink: '#5A3A00' }); sign.position.set(x, 2.68, z + 0.35); scene.add(sign);
  }

  /* ---------- the bank of the pond ---------- */
  {
    const [x, z] = BANK, stone = std(0xE9DCC6, { roughness: 0.8 }), stone2 = std(0xD2C2A6, { roughness: 0.85 }), roofM = std(0x4D7486, { roughness: 0.6 });
    fixed.add(mesh(boxG(4.6, 0.25, 2.9, x, 0.12, z + 0.1), stone2));
    fixed.add(mesh(boxG(4.4, 0.12, 0.5, x, 0.06, z + 1.65), stone2));
    fixed.add(mesh(boxG(4.2, 2.9, 2.2, x, 1.7, z - 0.3), stone));
    fixed.add(mesh(boxG(4.6, 0.24, 2.7, x, 3.25, z), stone2));
    fixed.add(mesh(new THREE.CylinderGeometry(1, 1, 2.7, 3, 1, false, Math.PI).rotateX(Math.PI / 2).scale(2.35, 0.7, 1).translate(x, 3.72, z), roofM));
    for (const dx of [-2.0, -0.4, 1.1, 2.0]) {
      fixed.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 2.85, 14).translate(x + dx, 1.67, z + 1.05), stone));
      fixed.add(mesh(boxG(0.42, 0.12, 0.42, x + dx, 3.07, z + 1.05), stone2));
    }
    fixed.add(mesh(boxG(0.95, 1.8, 0.06, x - 1.05, 1.15, z + 0.82), std(0x5A3A22, { roughness: 0.7 })));
    fixed.add(part(SPH, goldM, [0.05, 0.05, 0.05], [x - 0.75, 1.15, z + 0.86]));
    // the window with its little counter, where money is paid in, and the screen of the cash machine over it
    fixed.add(mesh(boxG(1.2, 0.9, 0.05, BANK_MAT.x, 1.75, z + 0.82), std(0x1F3A5C, { roughness: 0.15, metalness: 0.3 })));
    fixed.add(mesh(boxG(BANK_MAT.w + 0.2, 0.08, BANK_MAT.d + 0.12, BANK_MAT.x, BANK_MAT.y - 0.05, BANK_MAT.z), wood2M));
    fixed.add(mesh(boxG(BANK_MAT.w, 0.015, BANK_MAT.d, BANK_MAT.x, BANK_MAT.y - 0.004, BANK_MAT.z), std(0x2E7D5B, { roughness: 0.95 }), { cast: false }));
    const atm = mesh(new THREE.PlaneGeometry(0.66, 0.41), atmM, { cast: false, at: [BANK_MAT.x, 1.75, z + 0.85] }); atm.userData.keep = true; scene.add(atm);
    const sign = label("BANC DE L'ESTANY", { h: 0.42, bg: '#0A2A3A', ring: '#F7C64E', ink: '#F7C64E' }); sign.position.set(x, 3.25, z + 1.42); sign.scale.multiplyScalar(0.95); scene.add(sign);
    fixed.add(part(new THREE.CylinderGeometry(1, 1, 0.08, 24), goldM, [0.22, 1, 0.22], [x, 3.72, z + 1.36], [Math.PI / 2, 0, 0]));
  }

  /* ---------- the paper lanterns of the exams, on a wire behind the stall ---------- */
  for (const x of [-4.6, 4.6]) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.8, 8).translate(x, 2.4, -3.7), wood3M));
  {
    const pts = Array.from({ length: 21 }, (_, i) => { const k = i / 20; return V(-4.6 + 9.2 * k, 4.7 - Math.sin(k * Math.PI) * 0.35, -3.7); });
    const g = new THREE.BufferGeometry().setFromPoints(pts); scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x3B2A1A })));
  }
  const lanterns = RING.map((h, c) => {
    const x = -2.4 + c * 1.6, y = 4.7 - Math.sin((x + 4.6) / 9.2 * Math.PI) * 0.35 - 0.38, m = std(0xD8C7A8, { roughness: 0.6, emissive: hsl(h, 0.9, 0.55), emissiveIntensity: 0 });
    const L = mesh(new THREE.SphereGeometry(0.3, 16, 12).scale(1, 1.25, 1), m, { cast: false, at: [x, y, -3.7] }); L.userData.keep = true; scene.add(L);
    for (const dy of [0.36, -0.36]) fixed.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12).translate(x, y + dy, -3.7), red2M, { cast: false }));
    const gl = glow(x, y, -3.7, 1.8, hsl(h, 0.9, 0.62), false);
    return { m, gl, on: false, pos: V(x, y, -3.7) };
  });
  const setLantern = (L, k) => { L.m.emissiveIntensity = 1.6 * k; L.gl.material.opacity = 0.9 * k; };

  /* ---------- the twelve pieces the stall gets ---------- */
  // Each is a group of its own, baked on its own; until it is built, the next one to come waits as a ghost of light
  const ghostFill = new THREE.MeshBasicMaterial({ color: 0x6FE3FF, transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false });
  const steps = Array.from({ length: STEPS }, () => { const g = new THREE.Group(); g.userData.own = true; return g; });
  const S = steps;
  // 0 the awning: stripes, a scalloped edge and its beam
  {
    const g = S[0], n = 10, w = 8.2 / n;
    for (let i = 0; i < n; i++) g.add(mesh(new THREE.BoxGeometry(w, 0.06, 3.7).rotateX(0.17).translate(-4.1 + w * (i + 0.5), 3.42, -1.35), i % 2 ? creamM : redM));
    for (let i = 0; i < n; i++) g.add(mesh(new THREE.CircleGeometry(w / 2, 12, Math.PI, Math.PI).translate(-4.1 + w * (i + 0.5), 3.1, 0.5), i % 2 ? creamM : redM, { cast: false }));
    g.add(mesh(boxG(8.4, 0.12, 0.12, 0, 3.12, 0.44), red2M));
  }
  // 1 the lights under the awning
  const bulbs = [];
  {
    const g = S[1];
    for (let i = 0; i < 11; i++) { const x = -3.7 + i * 0.74, y = 2.9 - Math.sin(i / 10 * Math.PI) * 0.18, c = [0xFFE59A, 0x7CF5B0, 0xFF8FD0, 0x6FE3FF][i % 4];
      g.add(part(SPH, std(c, { emissive: c, emissiveIntensity: 1.2 }), [0.07, 0.09, 0.07], [x, y, 0.42])); bulbs.push([x, y, c]); }
  }
  // 2 and 4: crates of oranges and of watermelons on the bench ends; 6 the pots of flowers
  crateOf(S[2], '🍊', -1.1, 2.04, -2.85, 0.9, 3); crateOf(S[4], '🍉', 2.6, 2.04, -2.85, 0.9, 3);
  for (const [x, c] of [[-3.75, 0xFF8FD0], [3.75, 0xFFE59A]]) {
    S[6].add(mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.42, 14).translate(x, 0.21, 0.95), std(0xC2693A, { roughness: 0.8 })));
    for (let i = 0; i < 5; i++) S[6].add(part(SPH, std(c, { emissive: c, emissiveIntensity: 0.2 }), [0.12, 0.12, 0.12], [x + Math.cos(i * 1.3) * 0.13, 0.6 + (i % 2) * 0.1, 0.95 + Math.sin(i * 1.3) * 0.13]));
    S[6].add(part(SPH, std(0x4F9C58, { flatShading: true }), [0.22, 0.16, 0.22], [x, 0.48, 0.95]));
  }
  // 3 the sign over the awning
  const signTex = canvasTex(1024, 180, () => {});
  function paintSign() {
    const g = signTex.image.getContext('2d'), w = 1024, h = 180;
    g.fillStyle = '#0A2A3A'; g.beginPath(); g.roundRect(0, 0, w, h, 40); g.fill(); g.lineWidth = 10; g.strokeStyle = '#F7C64E'; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 34); g.stroke();
    g.font = FONT(112); g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#F7C64E'; g.shadowBlur = 22; g.fillStyle = '#FFE59A'; g.fillText("MERCAT DE L'ESTANY", w / 2, h / 2 + 10);
    signTex.needsUpdate = true; D.wake();
  }
  paintSign(); document.fonts?.load?.(FONT(120)).then(paintSign).catch(() => {});
  {
    const sg = mesh(new THREE.PlaneGeometry(5.4, 0.95), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false }), { cast: false, at: [0, 4.05, 0.42] }); sg.userData.keep = true; S[3].add(sg);
    for (const x of [-2.2, 2.2]) S[3].add(mesh(boxG(0.1, 0.5, 0.1, x, 3.45, 0.42), wood3M));
  }
  // 5 bunting from the front posts of the stall to two tall poles behind the tables at the sides, out of the way of the cameras
  {
    const g = S[5], a0 = [3.85, 3.45, CZ + 0.05], a1 = [7.6, 3.75, -3.3];
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.0, 8).translate(s * a1[0], 2.0, a1[2]), wood3M));
      const n = 12;
      for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = s * (a0[0] + (a1[0] - a0[0]) * k), z = a0[2] + (a1[2] - a0[2]) * k, y = a0[1] + (a1[1] - a0[1]) * k - Math.sin(k * Math.PI) * 0.4;
        g.add(mesh(new THREE.ConeGeometry(0.12, 0.28, 3).rotateX(Math.PI).rotateY(Math.atan2(a1[0] - a0[0], a1[2] - a0[2]) * s).translate(x, y - 0.14, z), std([0xFF6B5E, 0xF7C64E, 0x7CF5B0, 0x6FE3FF][i % 4], { roughness: 0.6, side: THREE.DoubleSide }), { cast: false })); }
    }
  }
  // 7 the stalls next door: cheese and fish
  for (const [x, z, p, c] of [[-6.6, -6.4, '🧀', 0x6FE3FF], [2.4, -6.8, '🐟', 0xB79CFF]]) {
    const g = S[7];
    g.add(mesh(boxG(2.6, 1.0, 1.0, x, 0.5, z), wood2M)); g.add(mesh(boxG(2.7, 0.06, 1.1, x, 1.02, z), woodM));
    for (const dx of [-1.25, 1.25]) g.add(mesh(boxG(0.1, 2.4, 0.1, x + dx, 1.2, z - 0.4), wood3M));
    for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(0.46, 0.05, 1.3).rotateX(-0.25).translate(x - 1.15 + i * 0.46, 2.45, z), i % 2 ? creamM : std(c, { roughness: 0.6 })));
    crateOf(g, p, x - 0.6, 1.05, z, 0.8, 3); crateOf(g, p, x + 0.6, 1.05, z, 0.8, 3);
  }
  // 8 a street lamp
  {
    const g = S[8];
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 10).translate(-5.3, 1.6, -2.4), std(0x2A4B5C, { roughness: 0.4, metalness: 0.5 })));
    g.add(mesh(new THREE.ConeGeometry(0.32, 0.36, 6).translate(-5.3, 3.52, -2.4), std(0x2A4B5C, { roughness: 0.4, metalness: 0.5 })));
    g.add(part(SPH, std(0xFFE59A, { emissive: 0xFFC46A, emissiveIntensity: 1.6 }), [0.18, 0.2, 0.18], [-5.3, 3.22, -2.4]));
  }
  // 9 the fountain of coins
  {
    const g = S[9], [x, z] = [0.6, 4.9];
    g.add(mesh(new THREE.CylinderGeometry(1.0, 1.08, 0.36, 28).translate(x, 0.18, z), std(0xD2C2A6, { roughness: 0.8 })));
    g.add(mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.04, 28).translate(x, 0.33, z), std(0x46D3E3, { roughness: 0.1, metalness: 0.2, emissive: 0x0B5F72, emissiveIntensity: 0.4 }), { cast: false }));
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 10).translate(x, 0.75, z), std(0xD2C2A6, { roughness: 0.8 })));
    g.add(mesh(new THREE.CylinderGeometry(0.36, 0.2, 0.12, 18).translate(x, 1.22, z), std(0xD2C2A6, { roughness: 0.8 })));
    for (let i = 0; i < 9; i++) g.add(part(CYL, goldM, [0.07, 0.012, 0.07], [x + Math.cos(i * 2.4) * (0.3 + (i % 3) * 0.17), 0.36, z + Math.sin(i * 2.4) * (0.3 + (i % 3) * 0.17)]));
  }
  // 10 balloons tied to the post on the right
  const balloons = [];
  {
    const g = S[10];
    for (const [dx, dy, c] of [[0.3, 1.4, 0xFF6B5E], [0.75, 1.1, 0x7CF5B0], [0.05, 0.95, 0x6FE3FF], [0.55, 1.75, 0xF7C64E]]) {
      const b = part(SPH, std(c, { roughness: 0.25, emissive: c, emissiveIntensity: 0.15 }), [0.26, 0.32, 0.26], [3.95 + dx, 3.4 + dy, 0.2]); g.add(b);
      g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, dy + 0.1, 3).translate(3.95 + dx / 2, 3.4 + dy / 2 - 0.1, 0.2), cordM, { cast: false }));
    }
  }
  // 11 the gold star on top
  {
    const st = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? 0.2 : 0.48; i ? st.lineTo(Math.sin(a) * r, Math.cos(a) * r) : st.moveTo(Math.sin(a) * r, Math.cos(a) * r); }
    const star = mesh(new THREE.ExtrudeGeometry(st, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }).translate(0, 0, -0.06), std(0xF7C64E, { roughness: 0.3, metalness: 0.6, emissive: 0xFFB030, emissiveIntensity: 0.6 }));
    star.position.set(0, 4.95, 0.42); S[11].add(star);
  }
  const stepTop = [V(0, 3.6, -1.2), V(0, 3.0, 0.4), V(-1.1, 2.4, -2.85), V(0, 4.1, 0.4), V(2.6, 2.4, -2.85), V(0, 3.0, 0.6), V(0, 0.7, 0.95), V(-2, 1.5, -6.6), V(-5.3, 3.3, -2.4), V(0.6, 0.6, 4.9), V(4.4, 4.8, 0.2), V(0, 5, 0.42)];
  const ghosts = steps.map(g => {
    bake(g); scene.add(g);
    const gh = new THREE.Group(); gh.userData.own = true;
    g.traverse(o => { if (o.isMesh && !o.userData.keep) { const m = new THREE.Mesh(o.geometry, ghostFill); m.matrixAutoUpdate = false; o.updateWorldMatrix(true, false); m.matrix.copy(o.matrixWorld); gh.add(m); } });
    gh.visible = false; scene.add(gh); return gh;
  });
  let built = -1;

  /* ---------- the closed sign, until the Piscina ---------- */
  const shutTex = canvasTex(320, 140, (g, w, h) => { g.fillStyle = '#B5392F'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 22); g.fill(); g.strokeStyle = '#FFF3E0'; g.lineWidth = 8; g.stroke(); g.font = FONT(80); g.fillStyle = '#FFF3E0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TANCAT', w / 2, h / 2 + 6); });
  const shut = mesh(new THREE.PlaneGeometry(1.1, 0.48), new THREE.MeshBasicMaterial({ map: shutTex, toneMapped: false, side: THREE.DoubleSide }), { cast: false, at: [-0.15, 0.82, CZ + 0.03] }); shut.userData.keep = true; scene.add(shut);

  /* ---------- the sky: the moon and the fireflies ---------- */
  scene.add(mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-16, 10, -26] }));
  glow(-16, 10, -26, 9, 0xFFE9B8, true).material.opacity = 0.55;
  const NFL = RM ? 0 : 18, flies = Array.from({ length: NFL }, (_, i) => ({ p: Math.random() * 7, x: (i % 2 ? -1 : 1) * (5 + Math.random() * 5.5), z: 2 + Math.random() * 6, y: 0.4 + Math.random() * 1.5 }));
  const flyPos = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: softTex(), size: 0.4, color: 0xE8FF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);
  const bulbGlows = bulbs.map(([x, y, c]) => { const g = glow(x, y, 0.42, 0.55, c, false); return g; });

  /* ---------- the frog of the stall, in its cap and its apron ---------- */
  const frog = makeFrog(); frog.position.set(-0.6, 0.5, -1.95); frog.scale.setScalar(1.45); frog.userData.t = 0; scene.add(frog);
  let frogDo = null;
  function frogSay(cls) { if (!RM && (cls === 'go' || cls === 'oops')) { frogDo = { ok: cls === 'go', t: 0 }; D.wake(); } }

  bake(fixed);

  /* ---------- what is on show: money, crates, the scales, the crate of fruit, the pig ---------- */
  // What a question puts on the stage goes away with rest()
  const stageG = new THREE.Group(); scene.add(stageG);
  let picks = [], gen = 0;
  const pickable = (o, kind, key) => { o.userData.pick = { kind, key: String(key) }; picks.push(o); };

  // The money: a coin is a disc of its metal with its face drawn on top; a note, a sheet of its colour. Their sizes are the real ones
  // (a 1 € coin is 23,25 mm), a little bigger
  const MM = { 1: 16.25, 2: 18.75, 5: 21.25, 10: 19.75, 20: 22.25, 50: 24.25, 100: 23.25, 200: 25.75 };
  const METAL = v => v < 10 ? 'cu' : v < 100 ? 'au' : v === 100 ? 'one' : 'two';
  const MC = { cu: ['#FFC79A', '#C9733F', '#6E3216'], au: ['#FFF0B0', '#E2BA4C', '#8E6A1E'], ag: ['#FFFFFF', '#CBD3D9', '#6F7C86'] }, INK = { cu: '#5A2810', au: '#6B4A10', ag: '#3E4A54' };
  const PAPER = { 500: ['#B9CBBF', '#7E9888'], 1000: ['#F09A8E', '#C25A4E'], 2000: ['#8FBAF0', '#4E7FC2'], 5000: ['#F8BE7A', '#D0843A'] };
  const R1 = 0.34, NOTE = [1.36, 0.72], rOf = v => R1 * MM[v] / 23.25;
  const FACES = new Map();
  function face(v) {
    if (FACES.has(v)) return FACES.get(v);
    const t = isBill(v) ? canvasTex(340, 180, (g, w, h) => {
      const [hi, lo] = PAPER[v], gr2 = g.createLinearGradient(0, 0, w, h); gr2.addColorStop(0, hi); gr2.addColorStop(1, lo);
      g.fillStyle = gr2; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 16); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.stroke();
      g.setLineDash([2, 6]); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.roundRect(14, 14, w - 28, h - 28, 10); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(94, 160); g.lineTo(94, 76); g.arc(132, 76, 38, Math.PI, 0); g.lineTo(170, 160); g.fill();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT(96); g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.strokeText(String(v / 100), 256, 92); g.fillStyle = '#fff'; g.fillText(String(v / 100), 256, 92);
      g.font = FONT(26); g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillText('EURO', 256, 148); g.font = FONT(34); g.fillText('€', 42, 150);
    }) : canvasTex(256, 256, (g, w) => {
      const m = METAL(v), outer = m === 'two' ? 'au' : m === 'one' ? 'ag' : m, inner = m === 'two' ? 'ag' : m === 'one' ? 'au' : null, c = w / 2;
      const disc = (r, k) => { const gg = g.createRadialGradient(c * 0.7, c * 0.6, 0, c, c, r * 1.2); gg.addColorStop(0, MC[k][0]); gg.addColorStop(0.55, MC[k][1]); gg.addColorStop(1, MC[k][2]); g.fillStyle = gg; g.beginPath(); g.arc(c, c, r, 0, 7); g.fill(); };
      disc(126, outer); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 5; g.beginPath(); g.arc(c, c, 112, 0, 7); g.stroke();
      if (inner) disc(82, inner); else for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(c + Math.cos(a) * 100, c + Math.sin(a) * 100, 5, 0, 7); g.fill(); }
      const n = v >= 100 ? v / 100 : v, ink = INK[inner || outer];
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT(inner ? 92 : n > 9 ? 100 : 118); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillText(String(n), c + 2, c + 2); g.fillStyle = ink; g.fillText(String(n), c, c - 4);
      g.font = FONT(inner ? 24 : 30); g.fillText(v >= 100 ? 'EURO' : 'CENT', c, c + (inner ? 56 : 74));
    });
    FACES.set(v, t); return t;
  }
  const SIDE = { cu: std(0xB86B3A, { roughness: 0.35, metalness: 0.75 }), au: std(0xD9A93A, { roughness: 0.3, metalness: 0.8 }), ag: std(0xC9D0D6, { roughness: 0.3, metalness: 0.8 }) };
  const FACEM = new Map();
  const faceM = v => { if (!FACEM.has(v)) FACEM.set(v, new THREE.MeshStandardMaterial({ map: face(v), roughness: isBill(v) ? 0.8 : 0.35, metalness: isBill(v) ? 0 : 0.45, side: isBill(v) ? THREE.DoubleSide : THREE.FrontSide })); return FACEM.get(v); };
  const HITC = new THREE.BoxGeometry(1, 1, 1); HITC.userData.shared = true;
  // a coin or a note lying face up, its centre at the origin; userData.v its value, userData.hit what the finger touches
  function moneyMesh(v) {
    const g = new THREE.Group(); g.userData.v = v;
    if (isBill(v)) {
      const p = mesh(new THREE.PlaneGeometry(...NOTE).rotateX(-Math.PI / 2), faceM(v)); p.position.y = 0.004; g.add(p);
      const h = new THREE.Mesh(HITC, HIT()); h.scale.set(NOTE[0], 0.2, NOTE[1]); g.add(h); g.userData.hit = h; g.userData.w = NOTE[0]; g.userData.d = NOTE[1];
    } else {
      const r = rOf(v), m = METAL(v), outer = m === 'two' ? 'au' : m === 'one' ? 'ag' : m, th = 0.055;
      g.add(mesh(new THREE.CylinderGeometry(r, r, th, 36, 1, true).translate(0, th / 2, 0), SIDE[outer]));
      g.add(mesh(new THREE.CircleGeometry(r, 36).rotateX(-Math.PI / 2).translate(0, th + 0.001, 0), faceM(v)));
      const h = new THREE.Mesh(HITC, HIT()); h.scale.set(r * 2, 0.25, r * 2); g.add(h); g.userData.hit = h; g.userData.w = g.userData.d = r * 2;
    }
    return g;
  }
  // Money laid out on an area { x, z, y, w, d }: notes and coins in rows from the back, in the order given; smaller when they do not fit
  function layMoney(list, A, parent) {
    const pieces = list.map(v => moneyMesh(v)), gap = 0.07;
    let s = 1, rows;
    for (let tries = 0; tries < 6; tries++) {
      rows = [[]]; let w = 0;
      for (const p of pieces) { const pw = p.userData.w * s; if (rows.at(-1).length && w + pw > A.w) { rows.push([]); w = 0; } rows.at(-1).push(p); w += pw + gap; }
      const depth = rows.reduce((d, r) => d + Math.max(...r.map(p => p.userData.d)) * s + gap, 0);
      if (depth <= A.d + 0.05) break; s *= 0.86;
    }
    let z = A.z - A.d / 2;
    for (const r of rows) {
      const rd = Math.max(...r.map(p => p.userData.d)) * s, rw = r.reduce((w, p) => w + p.userData.w * s + gap, -gap);
      let x = A.x - rw / 2;
      for (const p of r) { p.scale.setScalar(s); p.position.set(x + p.userData.w * s / 2, A.y, z + rd / 2); p.rotation.y = (((p.userData.v * 37) % 17) - 8) * 0.012; x += p.userData.w * s + gap; parent.add(p); }
      z += rd + gap;
    }
    return pieces;
  }
  let coinsOn = [], bigCoin = null;
  // the coins of a question on the mat: tap them (kind 'coin', key their place in the list); big: one alone, standing and turning
  function coins(list, o = {}) {
    for (const p of coinsOn) drop(p); coinsOn = []; if (bigCoin) { drop(bigCoin); bigCoin = null; }
    picks = picks.filter(h => h.userData.pick?.kind !== 'coin');
    if (o.big) {
      const v = list[0], g = moneyMesh(v); g.rotation.x = Math.PI / 2; g.scale.setScalar(isBill(v) ? 1.15 : 2.1);
      const holder = new THREE.Group(); holder.position.set(MAT.x, TOP + (isBill(v) ? 0.55 : 0.8), MAT.z + 0.1); holder.add(g); stageG.add(holder); bigCoin = holder;
      holder.scale.setScalar(0.01); tween(RM ? 0 : 520, k => holder.scale.setScalar(Math.max(0.01, k)), backOut);
      return go('counter');
    }
    coinsOn = layMoney(list, MAT, stageG);
    coinsOn.forEach((p, i) => { pickable(p.userData.hit, 'coin', i); const y = p.position.y; p.position.y = y + 0.8; tween(RM ? 0 : 360 + i * 70, k => { p.position.y = y + 0.8 * (1 - k); }, easeOut); });
    sound.tone(2400, 0.2, 0.06, 0.04); return go('counter');
  }
  // the money on the mat of the counter (or of the bank) while the child pays: tap one to take it back (kind 'mat', key its value)
  let matOn = [];
  function counter(list) {
    for (const p of matOn) drop(p); matOn = [];
    picks = picks.filter(h => h.userData.pick?.kind !== 'mat');
    const sorted = list.slice().sort((a, b) => b - a);
    matOn = layMoney(sorted, place === 'bank' ? BANK_MAT : MAT, stageG);
    for (const p of matOn) pickable(p.userData.hit, 'mat', p.userData.v);
    D.wake();
  }

  // The crates of the bench: what is sold, with its price tag (hide: «?»; deal: red; unit under the price) and its name (or its weight)
  const tagTex = (price, unit, deal) => canvasTex(300, unit ? 156 : 124, (g, W, H) => {
    g.fillStyle = deal ? '#FF6B5E' : '#FFF8E6'; g.strokeStyle = deal ? '#B5392F' : '#C9A55A'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(16, 6); g.lineTo(W - 62, 6); g.lineTo(W - 8, H / 2); g.lineTo(W - 62, H - 6); g.lineTo(16, H - 6); g.quadraticCurveTo(6, H - 6, 6, H - 16); g.lineTo(6, 16); g.quadraticCurveTo(6, 6, 16, 6); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#04131C'; g.beginPath(); g.arc(W - 50, H / 2, 9, 0, 7); g.fill();
    g.fillStyle = deal ? '#FFFFFF' : '#2A1C00'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = FONT(unit ? 66 : 74); g.fillText(price, (W - 62) / 2 + 8, unit ? 54 : H / 2 + 5);
    if (unit) { g.font = FONT(36); g.fillStyle = deal ? '#FFE6E2' : '#7A5A1E'; g.fillText(unit, (W - 62) / 2 + 8, 118); }
  });
  function tagSprite(price, unit, deal, h = 0.4) {
    const t = tagTex(price, unit, deal), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
    sp.scale.set(h * 300 / (unit ? 156 : 124), h, 1); sp.renderOrder = 6; sp.userData.dispose = () => { t.dispose(); sp.material.dispose(); }; return sp;
  }
  let itemsOn = [];
  function items(list, o = {}) {
    for (const it of itemsOn) drop(it.g); itemsOn = [];
    picks = picks.filter(h => h.userData.pick?.kind !== 'item');
    const n = list.length, w = Math.min(1.35, 6.4 / Math.max(1, n)), x0 = -w * (n - 1) / 2 + (o.left ? -0.9 : 0);
    list.forEach((T, i) => {
      const x = x0 + i * w, g = crateOf(stageG, T.e, x, BENCH.y + 0.02, BENCH.z, w * 0.82, n > 3 ? 3 : 5);
      const tag = tagSprite(o.hide ? '?' : eur(T.p), o.weights ? '' : T.u || '', o.deal, n > 4 ? 0.34 : 0.4); tag.position.set(0, 1.05, 0.1); g.add(tag);
      const nm = label(o.weights ? T.u : T.n, { h: 0.2, bg: '#06202B', ring: o.weights ? '#F7C64E' : '#6FE3FF', ink: '#FFFFFF', order: 6 }); nm.position.set(0, -0.08, 0.36); nm.scale.multiplyScalar(Math.min(1, w * 0.9 / nm.scale.x)); g.add(nm);
      const hit = new THREE.Mesh(HITC, HIT()); hit.scale.set(w * 0.9, 1.5, 0.8); hit.position.y = 0.6; g.add(hit); pickable(hit, 'item', i);
      g.scale.setScalar(0.01); tween(RM ? 0 : 420 + i * 90, k => g.scale.setScalar(Math.max(0.01, k)), backOut);
      itemsOn.push({ g, tag, hit });
    });
    D.wake();
  }
  // a thing tapped: right (it shines green and hops) or wrong (red, and shakes)
  const MARK = glowTex(), marks = [];
  function mark(kind, key, ok) {
    const o = picks.find(h => h.userData.pick.kind === kind && h.userData.pick.key === String(key)); if (!o) return;
    const at = new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0));
    const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: MARK, color: ok ? 0x7CF5B0 : 0xFF6B5E, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.position.copy(at); g.scale.setScalar(1.1); stageG.add(g); marks.push(g); D.wake();
    if (ok) D.sparkle(at.clone().add(V(0, 0.2, 0)), 10, 0x7CF5B0, 0.3, 1.5, 2.5);
    else { const host = o.parent, x0 = host.position.x; tween(RM ? 0 : 400, k => { host.position.x = x0 + Math.sin(k * Math.PI * 6) * 0.05 * (1 - k); }); setTimeout(() => { g.material.opacity = 0; D.wake(); }, 900); }
  }
  // the marks of the round before go away, for the next question over the same things
  function unmark() { for (const g of marks.splice(0)) drop(g); D.wake(); }
  // the order a thing was tapped in, written over it
  function seq(kind, key, n) {
    const o = picks.find(h => h.userData.pick.kind === kind && h.userData.pick.key === String(key)); if (!o) return;
    const at = new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0)), s = label(String(n), { h: 0.3, bg: '#F7C64E', ring: '#FFFFFF', ink: '#2A1C00', depthTest: false, order: 9 });
    s.position.copy(at).add(V(0.12, 0.35, 0)); stageG.add(s);
  }

  // the kitchen scale: what is on its pan, and the needle that swings to g grams of a dial up to max
  let dialPics = [];
  function dial(g, max, e) {
    for (const p of dialPics) drop(p); dialPics = [];
    paintDial(max); setNeedle(-120); needleTo = -120 + 240 * g / max; needleV = 0;
    [-0.18, 0, 0.18, -0.09, 0.09].forEach((dx, i) => { const p = pic(e, 0.3); p.position.set(DIAL[0] + dx, TOP + 1.05 + (i > 2 ? 0.16 : 0), DIAL[1] + (i > 2 ? -0.05 : 0.05)); stageG.add(p); dialPics.push(p); });
    setTimeout(() => D.wake(), 400);
    return go('dial');
  }

  // The scales of two pans: on the left what is weighed (q.e), with its weight or, for a barter, a «?»; on the right what the child
  // puts. pan(list) draws the right pan and lets the beam swing; tapping the right pan takes the lightest off (kind 'pan')
  const WG = new Map();
  const weightGeo = w => { if (!WG.has(w)) { const r = w >= 1000 ? 0.15 : w >= 500 ? 0.13 : w >= 200 ? 0.105 : w >= 100 ? 0.09 : 0.075, h = w >= 1000 ? 0.28 : w >= 500 ? 0.22 : w >= 200 ? 0.17 : w >= 100 ? 0.14 : 0.11; const g = new THREE.CylinderGeometry(r * 0.85, r, h, 18).translate(0, h / 2, 0); g.userData.shared = true; g.userData.h = h; g.userData.r = r; WG.set(w, g); } return WG.get(w); };
  function scale(q) {
    scaleQ = q; panVals = [];
    for (const P of [panL, panR]) for (const o of [...P.userData.load.children]) drop(o);
    if (tagL) { drop(tagL); tagL = null; } if (tagR) { drop(tagR); tagR = null; }
    const B = q.barter, left = B ? B.left : [q.e];
    left.forEach((e, i) => { const s = left.length > 2 ? 0.42 : left.length > 1 ? 0.5 : 0.62, p = pic(e, s); p.position.set((i - (left.length - 1) / 2) * s * 0.8, s / 2, 0); panL.userData.load.add(p); });
    tagL = label(B ? '?' : gr(q.target), { h: 0.24, bg: '#04131C', ring: '#F7C64E', ink: '#FFFFFF', order: 7 }); tagL.position.set(0, -HANG - 0.22, 0.3); panL.add(tagL);
    pickable(panHit, 'pan', 'r'); placeBeam(-16); beamTo = -16; beamV = 0; pan([]);
    return go('weigh');
  }
  const unitSay = w => scaleQ?.barter ? `${w} ${w === 1 ? 'poma' : 'pomes'}` : gr(w);
  function pan(list) {
    if (!scaleQ) return;
    panVals = list.slice();
    const load = panR.userData.load; for (const o of [...load.children]) drop(o);
    const B = scaleQ.barter, sorted = list.slice().sort((a, b) => b - a);
    sorted.forEach((w, i) => {
      if (B) { const pc = B.pieces.find(x => x.v === w), cols = 4, p = pic(pc.e, 0.3); p.position.set(((i % cols) - 1.5) * 0.2, 0.15 + Math.floor(i / cols) * 0.2, (i % 2) * 0.04); load.add(p); return; }
      const cols = 3, m = mesh(weightGeo(w), brassM); m.position.set(((i % cols) - 1) * 0.3, Math.floor(i / cols) * 0.3, Math.floor(i / cols) % 2 ? 0.05 : -0.05); load.add(m);
    });
    if (tagR) drop(tagR);
    tagR = label(unitSay(list.reduce((s, x) => s + x, 0)), { h: 0.24, bg: '#04131C', ring: '#6FE3FF', ink: '#FFFFFF', order: 7 }); tagR.position.set(0, -HANG - 0.22, 0.3); panR.add(tagR);
    const d = list.reduce((s, x) => s + x, 0) - scaleQ.target;
    beamTo = d === 0 ? 0 : Math.sign(d) * Math.min(16, 4 + Math.abs(d) / scaleQ.target * 30); D.wake();
  }

  // the crate of fruit in rows and columns, on the ground
  function crate(rows, cols, e) {
    const s = Math.min(0.42, 4.2 / cols), egg = e === '🥚', w = cols * s + 0.24, d = rows * s + 0.24, g = new THREE.Group(); g.position.set(CRATE[0], 0, CRATE[1]); stageG.add(g);
    g.add(mesh(boxG(w, 0.12, d, 0, 0.06, 0), egg ? std(0xC9B79C, { roughness: 0.9 }) : woodM));
    for (const [bw, bd, dx, dz] of [[w, 0.06, 0, d / 2], [w, 0.06, 0, -d / 2], [0.06, d, w / 2, 0], [0.06, d, -w / 2, 0]]) g.add(mesh(boxG(bw, 0.26, bd, dx, 0.13, dz), egg ? std(0xB09C7E, { roughness: 0.9 }) : wood3M));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const p = pic(e, s * 0.92), x = -w / 2 + 0.12 + (c + 0.5) * s, z = -d / 2 + 0.12 + (r + 0.5) * s, y = 0.12 + s * 0.42; p.position.set(x, y + 1, z); g.add(p);
      tween(RM ? 0 : 300 + r * 90 + c * 25, k => { p.position.y = y + (1 - k); }, easeOut);
    }
    VIEWS.crate.R = Math.max(w, d) / 2 + 0.35; return go('crate');
  }

  // the piggy bank: per goes in every week (weeks of them, falling one after the other), the goal stands next to it with its price, and
  // have is written on the pig (a «?» once the weeks have fallen)
  let pigOn = null;
  function piggy(sc, t) {
    if (pigOn) drop(pigOn); const g = new THREE.Group(); stageG.add(g); pigOn = g;
    const per = label(`+${eur(sc.per)} cada setmana`, { h: 0.26, bg: '#7A1E44', ring: '#FFB3CF', ink: '#FFFFFF', order: 7 }); per.position.set(PIG[0], 2.55, PIG[1] + 0.1); g.add(per);
    const have = sc.have ? label(eur(sc.have), { h: 0.24, bg: '#FFFFFF', ring: '#E86E9C', ink: '#7A1E44', order: 7 }) : null; if (have) { have.position.set(PIG[0], 1.45, PIG[1] + 0.6); g.add(have); }
    if (sc.goal) { const p = pic(sc.goal.e, 0.6); p.position.set(PIG[0] + 1.3, 1.5, PIG[1] + 0.05); g.add(p); const tg = tagSprite(eur(sc.goal.p), '', false, 0.3); tg.position.set(PIG[0] + 1.3, 0.98, PIG[1] + 0.4); g.add(tg); }
    // what falls in each week: the biggest coin or note that is not more than it (1,50 € falls as a coin of 1 €)
    const v = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1].find(d => d <= sc.per) || 1;
    const coin = moneyMesh(v); coin.rotation.x = Math.PI / 2; coin.scale.setScalar(isBill(v) ? 0.45 : 0.8); coin.position.set(PIG[0] - 0.02, 2.2, PIG[1]); g.add(coin);
    let week = null;
    const weekSay = txt => { if (week) drop(week); week = label(txt, { h: 0.22, bg: '#06202B', ring: '#F7C64E', ink: '#FFFFFF', order: 7 }); week.position.set(PIG[0] + 0.3, 0.62, PIG[1] + 0.72); g.add(week); D.wake(); };
    if (!sc.weeks) return go('piggy');
    const n = Math.min(sc.weeks, 12), my = gen;
    go('piggy').then(async () => {
      for (let i = 1; i <= n && my === gen && (!t || t.on); i++) {
        await tween(RM ? 0 : Math.max(180, 520 - i * 25), k => { coin.position.y = 2.2 - k * k * 0.95; coin.scale.setScalar((isBill(v) ? 0.45 : 0.8) * (1 - k * 0.4)); });
        coin.position.y = 2.2; coin.scale.setScalar(isBill(v) ? 0.45 : 0.8); pigWob = 0.4; sound.tone(2400 + i * 40, 0, 0.05, 0.04);
        weekSay(`Setmana ${i === n ? sc.weeks : i}`);
        if (i === n && have) { drop(have); const q = label('?', { h: 0.26, bg: '#FFFFFF', ring: '#E86E9C', ink: '#7A1E44', order: 7 }); q.position.set(PIG[0], 1.45, PIG[1] + 0.6); g.add(q); }
      }
    });
  }
  let pigWob = 0;

  // the receipt comes out of the register, line after line
  let paper = null;
  function receipt(lines) {
    if (paper) drop(paper);
    const H = 90 + lines.length * 46, t = canvasTex(256, H, (g, w, h) => {
      g.fillStyle = '#FFFDF5'; g.fillRect(0, 0, w, h); g.fillStyle = '#2A1C00'; g.textAlign = 'center'; g.font = FONT(26); g.fillText("MERCAT DE L'ESTANY", w / 2, 34);
      g.textAlign = 'left'; g.font = FONT(24); lines.forEach((l, i) => { g.fillText(`${l.q > 1 ? l.q + '× ' : ''}${l.n}`, 14, 78 + i * 46); g.textAlign = 'right'; g.fillText(l.gone ? '?' : eur(l.p * l.q), w - 14, 78 + i * 46); g.textAlign = 'left'; });
      g.setLineDash([6, 6]); g.strokeStyle = '#B9A88E'; g.beginPath(); g.moveTo(10, 50); g.lineTo(w - 10, 50); g.stroke();
    });
    const hgt = 0.5 * H / 256, m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, hgt).translate(0, hgt / 2, 0), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false }));
    m.userData.dispose = () => { t.dispose(); m.material.dispose(); m.geometry.dispose(); };
    m.position.set(REG[0] + 0.28, TOP + 0.86, REG[1] - 0.28); m.rotation.x = -0.25; m.scale.y = 0.01; stageG.add(m); paper = m;
    tween(RM ? 0 : 900, k => { m.scale.y = Math.max(0.01, k); }, k => k);
  }

  /* ---------- the customers: people who walk to the counter ---------- */
  const actors = [];
  function person(kind, at) { const a = makeGuest(kind || 'turista'); a.scale.setScalar(1.55); a.position.set(at[0], 0, at[1]); a.rotation.y = -Math.PI / 2; scene.add(a); actors.push(a); return a; }
  const walkTo = (a, pts, speed = 2.6) => { a.userData.path = pts.map(([x, z]) => V(x, 0, z)); a.userData.speed = speed; D.wake(); return new Promise(res => { a.userData.done = res; if (RM) { const p = a.userData.path.at(-1); if (p) a.position.copy(p); a.userData.path = []; res(); } }); };
  const gone = a => { drop(a); const i = actors.indexOf(a); if (i >= 0) actors.splice(i, 1); if (now === a) now = null; };
  let now = null, line = [], bubble = null, paidNote = null;
  function say(a, text) {
    if (bubble) { drop(bubble); bubble = null; }
    if (!text || !a) return;
    const b = label(text, { h: 0.34, bg: '#FFFFFF', ring: '#F7C64E', ink: '#2A1C00', depthTest: false, order: 9 }); b.userData.s = [b.scale.x, b.scale.y];
    b.position.set(0, 1.62, 0.1); b.scale.set(0.01, 0.01, 1); a.add(b); bubble = b;
    // the bubble keeps its size whatever the scale of the person
    const k = 1 / a.scale.x; tween(RM ? 0 : 320, q => { if (bubble === b) b.scale.set(b.userData.s[0] * q * k, b.userData.s[1] * q * k, 1); }, backOut);
  }
  // Somebody comes to the counter: who [face, name, kind], with what they want said in a bubble and the note they pay with on the counter.
  // In the rush hour (o.rush) they come from the front of the line, and the line moves on. Resolves when they are there
  async function client(who, o = {}) {
    if (now) gone(now);
    if (paidNote) { drop(paidNote); paidNote = null; }
    let a;
    if (o.rush) {
      while (line.length < LINE.length) line.push(person(pickKind(), IN));
      a = line.shift(); line.push(person(who[2] && Math.random() < 0.5 ? who[2] : pickKind(), IN));
      line.forEach((p, i) => walkTo(p, [LINE[i]], 2.2));
    } else a = person(who[2], NEAR);
    now = a;
    await walkTo(a, [SPOT], o.rush ? 4 : 2.8);
    if (now !== a) return;
    face0(a);
    if (o.paid) { const m = moneyMesh(o.paid); m.position.set(SPOT[0] - 1.05, TOP + 0.01, CZ - 0.32); m.rotation.y = 0.25; m.scale.setScalar(isBill(o.paid) ? 0.6 : 1); stageG.add(m); paidNote = m; sound.tone(isBill(o.paid) ? 320 : 2400, 0, 0.05, 0.05); }
    if (o.say) say(a, o.say);
  }
  const KINDS = ['excursionista', 'ciclista', 'turista', 'avi'];
  const pickKind = () => KINDS[Math.floor(Math.random() * KINDS.length)];
  const face0 = a => { a.userData.turnTo = Math.PI; };
  // the customer is served: they take what they bought (pics), hop for joy and go away
  async function served(pics = []) {
    const a = now; if (!a) return;
    say(a, ''); if (paidNote) { drop(paidNote); paidNote = null; }
    if (pics.length) { const bag = new THREE.Group(); pics.slice(0, 2).forEach((p, i) => { const s = pic(p, 0.28); s.position.set(i * 0.18 - (pics.length > 1 ? 0.09 : 0), 0.62, 0.25); bag.add(s); }); a.add(bag); }
    a.userData.hop = 0.55; D.wake();
    await new Promise(r => setTimeout(r, RM ? 0 : 450));
    if (now === a) now = null;
    walkTo(a, OUT, 3.2).then(() => gone(a));
  }
  // the customer does not agree: a shake of the head
  function upset() { if (now) { now.userData.shake = 0.6; D.wake(); } }
  // the line of the rush hour: n people waiting (0 sends them all away)
  function queue(n) {
    if (!n) { for (const a of line) walkTo(a, OUT, 3).then(() => gone(a)); line = []; return; }
    while (line.length < n) { const a = person(pickKind(), IN); line.push(a); }
    line.forEach((p, i) => walkTo(p, [LINE[i]], 2.4));
  }

  /* ---------- a tap on the market ---------- */
  canvas.addEventListener('click', e => {
    if (!api.onPick) return;
    const hit = D.pick(e.clientX, e.clientY, picks.filter(h => h.userData.pick))[0];
    if (hit) api.onPick(hit.object.userData.pick.kind, hit.object.userData.pick.key);
  });
  // the point of the screen where a thing that can be tapped is: for the checks in the browser, which touch it there
  function where(kind, key) {
    const o = picks.find(h => h.userData.pick?.kind === kind && (key == null || h.userData.pick.key === String(key))); if (!o) return null;
    return D.onScreen(new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0)));
  }

  /* ---------- everything empty again ---------- */
  function rest() {
    gen++; for (const o of [...stageG.children]) drop(o);
    coinsOn = []; matOn = []; itemsOn = []; dialPics = []; bigCoin = null; pigOn = null; paper = null; paidNote = null; marks.length = 0;
    picks = []; scaleQ = null; panVals = [];
    for (const P of [panL, panR]) for (const o of [...P.userData.load.children]) drop(o);
    if (tagL) { drop(tagL); tagL = null; } if (tagR) { drop(tagR); tagR = null; }
    placeBeam(-16); beamTo = -16; needleTo = -120; setNeedle(-120); shutDrawer();
    if (now) { const a = now; now = null; say(a, ''); walkTo(a, OUT, 3.2).then(() => gone(a)); }
    if (line.length) queue(0);
    place = 'stall'; paintLcd(lcdTex, 'MERCAT', null); paintLcd(atmTex, 'BANC', null); lcdShown = 0;
    D.wake();
  }
  // the place money is paid at: 'stall' (the register) or 'bank' (the cash machine)
  function at(p) { place = p; }

  /* ---------- what moves by itself ---------- */
  let hlOn = false;
  D.every((dt0, now0, raw0) => {
    const dt = Math.max(0, dt0), raw = Math.max(0, raw0), t = now0 / 1000;
    if (RM) { needle.rotation.z = -needleTo * Math.PI / 180; placeBeam(beamTo); return false; }
    flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; });
    if (NFL) flyGeo.attributes.position.needsUpdate = true;
    // the frog breathes, and leaps or shakes its head with what the tip says
    frog.userData.t += dt; frog.userData.body.scale.set(1 + Math.sin(frog.userData.t * 2.2) * 0.02, 1 + Math.sin(frog.userData.t * 2.2) * 0.03, 1);
    if (frogDo) {
      const h = frogDo; h.t += raw; const k = Math.min(1, h.t / 0.7);
      if (h.ok) frog.position.y = 0.5 + Math.sin(k * Math.PI) * 0.55; else frog.userData.body.rotation.y = Math.sin(k * Math.PI * 4) * 0.4 * (1 - k);
      if (k >= 1) { frogDo = null; frog.position.y = 0.5; frog.userData.body.rotation.y = 0; }
    }
    // the needle of the kitchen scale and the beam of the scales, on springs
    { const a = -40 * (needleAt - needleTo) - 5 * needleV; needleV += a * dt; setNeedle(needleAt + needleV * dt); }
    { const a = -60 * (beamA - beamTo) - 6 * beamV; beamV += a * dt; placeBeam(beamA + beamV * dt); }
    // the big coin turns; the coin over a pig that saves nothing yet bobs; the pig wobbles when a coin falls in
    if (bigCoin) bigCoin.rotation.y = Math.sin(t * 1.4) * 0.6;
    if (pigWob > 0) { pigWob -= raw; pig.rotation.z = Math.sin(pigWob * 30) * 0.06 * pigWob; } else pig.rotation.z = 0;
    // the lights of the stall twinkle; the balloons sway
    bulbGlows.forEach((g, i) => { if (g.visible) g.material.opacity = 0.55 + 0.35 * Math.sin(t * 2 + i * 1.7); });
    S[10].rotation.z = Math.sin(t * 1.1) * 0.012;
    // the ghost of the next piece breathes, more when a project is under the finger
    const gh = ghosts[built + 1]; if (gh && gh.visible) ghostFill.opacity = (hlOn ? 0.22 : 0.1) + (hlOn ? 0.14 : 0.06) * Math.sin(t * (hlOn ? 6 : 2.4));
    // the people: they walk along their path swinging their legs, turn to the counter, hop and shake their heads
    for (const a of actors) {
      const u = a.userData; u.t += dt;
      if (u.path?.length) {
        const p = u.path[0], d = V(p.x - a.position.x, 0, p.z - a.position.z), L = d.length(), step = u.speed * Math.min(raw, 0.25);
        if (L <= step || L < 1e-4) { a.position.set(p.x, 0, p.z); u.path.shift(); if (!u.path.length) { const r = u.done; u.done = null; r?.(); } }
        else { a.position.addScaledVector(d.normalize(), step); u.turnTo = Math.atan2(d.x, d.z); }
        if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = Math.sin(u.t * 10 + i * Math.PI) * 0.55; });
        u.body.position.y = Math.abs(Math.sin(u.t * 10)) * 0.03;
      } else if (u.legs) { u.legs.forEach(l => { l.rotation.x *= 0.8; }); u.body.position.y = 0; }
      if (u.turnTo != null) { let da = u.turnTo - a.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); a.rotation.y += da * Math.min(1, dt * 8); }
      if (u.hop > 0) { u.hop -= raw; u.body.position.y = Math.sin(Math.max(0, u.hop) / 0.55 * Math.PI) * 0.22; }
      if (u.shake > 0) { u.shake -= raw; u.body.rotation.y = Math.sin(u.shake * 25) * 0.25 * u.shake; } else if (u.body.rotation.y) u.body.rotation.y = 0;
    }
    return true;
  });

  /* ---------- the progress: what is built, the lanterns, open or closed ---------- */
  function setBuilt(n) {
    built = Math.min(STEPS, n) - 1;
    const shown = i => roofOn || !ROOF.includes(i);
    steps.forEach((g, i) => { g.visible = i <= built && shown(i); });
    ghosts.forEach((g, i) => { g.visible = i === built + 1 && shown(i); });
    bulbGlows.forEach(g => { g.visible = built >= 1 && roofOn; });
  }
  let piscinaOn = false;
  // the market as the progress has it: piscina (the stall open), built (the projects validated: so many pieces) and exams (the circles passed)
  function state({ piscina = false, built: n = 0, exams = [] } = {}) {
    piscinaOn = piscina; shut.visible = !piscina; setBuilt(n);
    lanterns.forEach((L, c) => { L.on = exams.includes(c); setLantern(L, L.on ? 1 : 0); });
    flyPts.visible = piscina; said();
  }
  const said = () => { canvas.dataset.millores = built + 1; canvas.dataset.fanals = lanterns.filter(L => L.on).length; canvas.dataset.piscina = piscinaOn ? '1' : '0'; D.wake(); };
  // a project validated: the camera flies to the new piece of the stall, n the pieces there are now
  function grow(n) {
    const i = Math.min(STEPS, n) - 1; if (i <= built || i < 0) return Promise.resolve();
    const at = stepTop[i];
    return go({ t: [at.x, at.y - 0.6, at.z], dir: [0.1, 0.45, 1], R: 4.2 }).then(async () => {
      setBuilt(i + 1); const g = steps[i]; g.scale.setScalar(0.01); said();
      sound.tone(523, 0, 0.3, 0.08); sound.tone(784, 0.15, 0.4, 0.08); sound.tone(1047, 0.3, 0.5, 0.07);
      await tween(RM ? 0 : 900, k => { const s = Math.max(0.01, k); g.scale.setScalar(s); g.position.set(at.x * (1 - s), at.y * (1 - s), at.z * (1 - s)); }, backOut);
      g.scale.setScalar(1); g.position.set(0, 0, 0);
      D.sparkle(at.clone(), 22, 0xFFE08A, 0.4, 2.2, 2); D.celebrate(3, at.clone());
    });
  }
  // an exam passed: its paper lantern lights up
  function lantern(c) {
    const L = lanterns[c]; if (!L || L.on) return Promise.resolve();
    L.on = true;
    return go({ t: [0, 3.6, -3.7], dir: [0, 0.2, 1], R: 3.6 }).then(() => tween(RM ? 0 : 1400, k => setLantern(L, k), easeOut)).then(() => { said(); D.sparkle(L.pos.clone(), 16, hsl(RING[c], 0.9, 0.7), 0.4, 1.8, 2); D.celebrate(3, L.pos.clone()); });
  }
  // the Piscina opens the stall: the closed sign turns and goes
  function open() {
    if (!shut.visible) return;
    tween(RM ? 0 : 700, k => { shut.rotation.y = k * Math.PI; shut.position.y = 0.82 - k * 0.3; shut.scale.setScalar(1 - k * 0.9); }).then(() => { shut.visible = false; shut.rotation.y = 0; shut.position.y = 0.82; shut.scale.setScalar(1); });
    piscinaOn = true; flyPts.visible = true; said();
  }
  function highlight(i) { hlOn = Number.isInteger(i); D.wake(); }

  state({});
  const api = { ok: true, layout, go, get view() { return viewName; }, state, highlight, pause: D.pause, celebrate: (t, a) => D.celebrate(t, a), shake: D.shake,
    hear: o => { sound = { ...sound, ...o }; }, rest, at, frogSay, coins, items, mark, unmark, seq, dial, crate, piggy, receipt, counter, lcd, ring: openDrawer, scale, pan,
    client, served, upset, queue, grow, lantern, open, where, onPick: null, _: { D, actors, steps, lanterns } };
  return api;
}

/* ---------- the frog of the stall, in its cap and its apron ---------- */
// about one unit tall, looking at +z; its body breathes (userData.body)
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4), cap: mat(0xFF6B5E, { roughness: 0.5 }), cap2: mat(0xB5392F), apron: mat(0xF3FBF8, { roughness: 0.6 }) };
  g.add(body);
  body.add(part(SPH, k.body, [0.5, 0.36, 0.46], [0, 0.38, 0]));
  body.add(part(SPH, k.apron, [0.38, 0.27, 0.13], [0, 0.3, 0.36]));
  body.add(part(new THREE.BoxGeometry(1, 1, 1), k.cap2, [0.5, 0.04, 0.05], [0, 0.48, 0.43]));
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
  // the cap of the shopkeeper, with its peak to the front
  body.add(mesh(new THREE.SphereGeometry(0.29, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.8, 1).translate(0, 0.8, -0.02), k.cap));
  body.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16, 1, false, -Math.PI / 2, Math.PI).translate(0, 0.8, 0.2), k.cap2));
  body.add(part(SPH, mat(0xFFD9D4), [0.05, 0.05, 0.05], [0, 1.04, -0.02]));
  bake(body);
  g.userData.body = body;
  return g;
}
// the soft light of a firefly
function softTex() {
  return canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
