// El cursus de l'estany in 3D: the night pond of the cursus as a diorama (shared/diorama.js), with the page as a panel of glass over it.
// The map is the pond: in the middle the Piscina, a round pool of stone, and round it the three circles of the cursus as three rings of
// lily pads on the water, one pad for each project (a flower opens on it when the project is validated) and a stone lantern for each exam
// (lit when it is passed). The frog waits on the pad of what is next. Round the pond, each kind of material has its place and the camera
// flies to it: the little pond of the sharings (a jar of fireflies on a stump and the lily pads to share them on), the meadow of the groups
// (the fireflies fly out of the jar into rings on the grass, what is left stays in the jar), the jetty of the grids (rows of tiles) and the
// hut of «El racó de pensar», where the papers (tens, pieces, the sticks in columns) are read in the panel.
// Everything 3D is drawn here and only here; main.js and material.js say what happens and hear the taps (onPick(kind, key)).
// Without WebGL cursus3d() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, easeOut, SPH, CONE, CYL, V } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';

/* ---------- the measures of the world ---------- */
// the grass at 0; the block from YB up, x from X0 to X1, z from Z0 (back) to Z1 (front); the water at WY, the mud at BY
const YB = -4.2, WY = -0.3, BY = -1.1, X0 = -13, X1 = 13, Z0 = -9.4, Z1 = 9.2;
// the pond of the circles, an ellipse round PC with radii PR, and the radius of each ring (z is squashed by EZ)
const PC = [0.6, -1.6], PR = [7.8, 5.9], RR = [2.15, 3.65, 5.15], EZ = 0.74;
// the little pond of the sharings (front left), the meadow of the groups (front middle), the jetty of the grids (left), the hut (front right)
const BS = { x: -7.6, z: 6.2, rx: 3.3, rz: 2.0 }, JAR_S = [-11.6, 5.6], MEAD = { x: 2.2, z: 6.6 }, JAR_G = [-2.3, 6.4];
const JET = { x: -10.4, z: -2.6, w: 4.4, d: 4.6 }, HUT = [9.2, 5.6];
export const RING = [140, 195, 262];
const TAU = Math.PI * 2;
const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);
const wob = a => 1 + 0.04 * Math.sin(3 * a + 0.4) + 0.03 * Math.sin(5 * a + 1.3);
const ellipse = (cx, cz, rx, rz, n = 64, w = true) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU, k = w ? wob(a) : 1; return [cx + rx * Math.cos(a) * k, cz + rz * Math.sin(a) * k]; });
const POND = ellipse(PC[0], PC[1], PR[0], PR[1]), BASSA = ellipse(BS.x, BS.z, BS.rx, BS.rz, 40);
// the place of slot s of n round ring c: the first a little to the left of the front, the others round it
const slotAt = (c, s, n) => { const a = Math.PI / 2 + 0.55 + c * 0.5 + s * TAU / n; return [PC[0] + RR[c] * Math.cos(a), PC[1] + RR[c] * EZ * Math.sin(a)]; };

export function cursus3d(canvas, circles) {
  if (!hasGL()) return none();
  try { return build(canvas, circles); } catch (e) { console.warn('cursus 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, view: null, state() {}, highlight() {}, pause() {}, celebrate() {}, hear() {}, rest() {}, home() {}, cheer() {}, oops() {},
    bloom() {}, lantern() {}, poolDone() {}, desk() {}, share() {}, send() {}, back() {}, solveShare() {}, groups() {}, group() {}, solveGroups() {},
    grid() {}, row() {}, spare() {}, solveGrid() {}, where: () => null, onPick: null };
}

function build(canvas, circles) {
  let D = null;
  const small = () => { const { w, h } = D ? D.size() : { w: innerWidth, h: innerHeight }; return Math.min(w, h) < 430; };
  const VIEWS = {
    map: { t: [PC[0], -0.2, PC[1] + 0.2], dir: [0, 1.3, 1], get R() { return small() ? 6.6 : 7.4; } },
    pool: { t: [PC[0], 0, PC[1]], dir: [0.2, 1.1, 1], R: 2.4 },
    share: { t: [BS.x - 1.0, 0.3, BS.z], dir: [0.1, 1.05, 1], R: 3.4 },
    group: { t: [MEAD.x - 1.2, 0.3, MEAD.z], dir: [0, 1.2, 1], R: 3.9 },
    grid: { t: [JET.x, 0.2, JET.z], dir: [0.35, 1.7, 1], R: 2.9 },
    desk: { t: [HUT[0] - 0.4, 0.9, HUT[1]], dir: [-0.35, 0.55, 1], R: 1.9 }
  };
  D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-14, 18, 16], shadow: { left: -15, right: 15, top: 13, bottom: -13 }, floor: YB - 4, under: [0, YB - 2.4, 0, 34, 27] });
  const { scene, glow, tween } = D;
  const fixed = new THREE.Group(); scene.add(fixed);
  let viewName = 'map';
  const go = (v, o) => { viewName = typeof v === 'string' ? v : null; return D.go(v, o); };
  let sound = { tone() {}, chime() {} };
  const HIT = () => HIT.m || (HIT.m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }));
  const hit = (r, h, x, y, z, kind, key) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), HIT()); m.position.set(x, y, z); m.userData.pick = { kind, key: String(key) }; return m; };
  const drop = o => { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.isSprite) x.material.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); }); };

  /* ---------- the block of earth, with the pond and the little pond cut into its top ---------- */
  const soilTex = canvasTex(256, 512, (g, w, h) => {
    const bands = ['#5E9F4E', '#7A4E2D', '#8E5E36', '#6B4226', '#9A6B43', '#5C3820', '#7E5131'], hs = [10, 70, 60, 80, 70, 110, 120];
    let y = 0; bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, y, w, hs[i]); y += hs[i]; });
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 3 ? '40,25,15' : '200,180,150'},${0.15 + Math.random() * 0.25})`; const r = 1 + Math.random() * 5; g.beginPath(); g.ellipse(Math.random() * w, 14 + Math.random() * (h - 14), r * 1.6, r, 0, 0, 7); g.fill(); }
  });
  soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  const outline = (pts, path) => { pts.forEach(([x, z], i) => i ? path.lineTo(x, -z) : path.moveTo(x, -z)); path.closePath(); return path; };
  {
    const HB = -YB, s = new THREE.Shape();
    s.moveTo(X0, -Z1); s.lineTo(X1, -Z1); s.lineTo(X1, -Z0); s.lineTo(X0, -Z0); s.closePath();
    for (const pts of [POND, BASSA]) s.holes.push(outline(pts, new THREE.Path()));
    const g = new THREE.ExtrudeGeometry(s, { depth: -BY, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2).translate(0, BY, 0);
    const uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 + p.getY(i) / HB);
    const wallTex = soilTex.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(0.12, 1);
    scene.add(mesh(g, [std(0x5FAE62, { roughness: 0.9 }), std(0xffffff, { map: wallTex, roughness: 0.95 })], { cast: false }));
    const bt = soilTex.clone(); bt.needsUpdate = true; bt.repeat.set(1.5, (BY - YB) / HB);
    const side = std(0xffffff, { map: bt, roughness: 0.95 }), mud = std(0x4A3A26, { roughness: 1 }), dark = std(0x3A2617, { roughness: 1 });
    scene.add(mesh(boxG(X1 - X0, BY - YB, Z1 - Z0, (X0 + X1) / 2, (BY + YB) / 2, (Z0 + Z1) / 2), [side, side, mud, dark, side, side], { cast: false }));
  }
  const waterM = std(0x22708F, { roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.9, envMapIntensity: 1.3, emissive: 0x0A3448, emissiveIntensity: 0.4 });
  for (const pts of [POND, BASSA]) { const w = mesh(new THREE.ShapeGeometry(outline(pts, new THREE.Shape()), 4).rotateX(-Math.PI / 2).translate(0, WY, 0), waterM, { cast: false }); w.renderOrder = 1; scene.add(w); }
  // pebbles and reeds on the shores, trees, bushes and flowers
  const IC = new THREE.IcosahedronGeometry(1, 0), pebM = std(0xA69C8A, { roughness: 0.9, flatShading: true });
  POND.forEach(([x, z], i) => { if (i % 2) return; const s = 0.14 + (i * 37 % 10) / 44; fixed.add(part(IC, pebM, [s, s * 0.55, s], [x, 0.02, z])); });
  BASSA.forEach(([x, z], i) => { if (i % 3) return; const s = 0.12 + (i * 29 % 10) / 50; fixed.add(part(IC, pebM, [s, s * 0.55, s], [x, 0.02, z])); });
  const reedM = std(0x3E7F47), catM = std(0x6B4226, { roughness: 0.9 });
  const reeds = (pts, i0, n, c) => { for (let j = 0; j < n; j++) {
    const [x, z] = pts[(i0 + j) % pts.length], h = 0.9 + (j % 3) * 0.3, dx = (x - c[0]) * 0.03, dz = (z - c[1]) * 0.05;
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5).translate(x - dx, WY + h / 2, z - dz), reedM));
    if (j % 2 === 0) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8).translate(x - dx, WY + h - 0.05, z - dz), catM));
  } };
  reeds(POND, 6, 4, PC); reeds(POND, 30, 4, PC); reeds(POND, 44, 3, PC); reeds(BASSA, 8, 3, [BS.x, BS.z]);
  const trunkM = std(0x7A5230), LEAF = [0x4E9F5B, 0x67B565, 0x3F8A4E];
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(LEAF[(i + Math.round(Math.abs(x))) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-11.9, -8.6, 1.2], [11.6, -8.4, 1.3], [12.0, -2.8, 0.9], [-5.6, -8.8, 0.8], [6.0, -8.9, 0.9], [12.1, 1.6, 0.7], [-12.2, 8.3, 0.7], [5.8, 8.5, 0.6]]) tree(x, z, s);
  const bushM = std(0x4F9C58, { flatShading: true });
  for (const [x, z, s] of [[-12.3, 1.8, 0.5], [12.3, 8.4, 0.4], [-4.2, 8.6, 0.45], [9.6, -9.0, 0.5], [-8.0, -8.9, 0.45]]) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  for (let i = 0; i < 26; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.06, 0.05, 0.06], [-12.4 + (i * 97 % 250) / 10, 0.06, i % 2 ? 8.3 + (i % 3) * 0.25 : -8.6 - (i % 3) * 0.2]));
  const woodM = std(0xB9793F, { roughness: 0.75 }), wood2M = std(0x8B5A3C, { roughness: 0.8 }), stoneM = std(0x9C968C, { roughness: 0.85, flatShading: true });

  /* ---------- the Piscina, in the middle of the pond ---------- */
  const poolWater = std(0x7FE6FF, { roughness: 0.05, emissive: 0x2BB8E0, emissiveIntensity: 0.25 });
  fixed.add(mesh(new THREE.TorusGeometry(0.95, 0.2, 10, 36).rotateX(Math.PI / 2).translate(PC[0], WY + 0.12, PC[1]), stoneM));
  scene.add(mesh(new THREE.CircleGeometry(0.92, 36).rotateX(-Math.PI / 2).translate(PC[0], WY + 0.16, PC[1]), poolWater, { cast: false }));
  fixed.add(mesh(boxG(0.34, 0.06, 0.9, PC[0] + 0.95, WY + 0.4, PC[1]), woodM)); fixed.add(mesh(boxG(0.1, 0.3, 0.1, PC[0] + 1.05, WY + 0.22, PC[1] - 0.25), wood2M));
  const poolGlow = glow(PC[0], WY + 0.5, PC[1], 2.4, 0x7FE6FF, false);
  const poolHit = hit(1.15, 0.6, PC[0], WY + 0.2, PC[1], 'pool', 0); scene.add(poolHit);

  /* ---------- the hut of «El racó de pensar» ---------- */
  {
    const [x, z] = HUT;
    fixed.add(mesh(boxG(2.0, 0.16, 1.7, x, 0.08, z), wood2M));
    fixed.add(mesh(boxG(1.8, 1.2, 1.5, x, 0.76, z), std(0xE6C79A, { roughness: 0.85 })));
    fixed.add(part(CONE, std(0xB4463C, { roughness: 0.7, flatShading: true }), [1.55, 0.9, 1.35], [x, 1.8, z], [0, Math.PI / 4, 0]));
    fixed.add(mesh(boxG(0.5, 0.8, 0.05, x - 0.4, 0.56, z + 0.76), std(0x6B3E1C)));
    scene.add(mesh(boxG(0.5, 0.4, 0.05, x + 0.4, 0.86, z + 0.76), std(0xFFE3A0, { emissive: 0xFFB24A, emissiveIntensity: 1.1 }), { cast: false }));
    glow(x + 0.4, 0.9, z + 0.95, 1.4, 0xFFC46A, true);
    const sign = label('El racó', { h: 0.42, bg: 'rgba(40,24,10,0.85)', ring: '#F7C64E', ink: '#FFE9A0' }); sign.position.set(x, 2.55, z + 0.2); scene.add(sign);
    scene.add(hit(1.1, 2.4, x, 1.1, z, 'raco', 0));
  }

  /* ---------- the stumps, the jars, the jetty ---------- */
  const stump = (x, z) => { fixed.add(mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.62, 12).translate(x, 0.31, z), wood2M)); fixed.add(mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.02, 12).translate(x, 0.63, z), std(0xD8B07A))); };
  stump(JAR_S[0], JAR_S[1]); stump(JAR_G[0], JAR_G[1]);
  {
    const { x, z, w, d } = JET;
    fixed.add(mesh(boxG(w, 0.14, d, x, 0.12, z), woodM));
    for (let i = 0; i < 9; i++) fixed.add(mesh(boxG(w, 0.02, 0.03, x, 0.2, z - d / 2 + (i + 0.5) * d / 9), wood2M));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8).translate(x + sx * (w / 2 - 0.1), 0.2, z + sz * (d / 2 - 0.1)), wood2M));
  }
  const gridHit = hit(2.6, 0.5, JET.x, 0.3, JET.z, 'grid', 0); scene.add(gridHit);
  // the jar: glass with a cork; it stands on the stump of the place on show
  const jar = new THREE.Group(); scene.add(jar);
  jar.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.92, 24, 1, true).translate(0, 0.46, 0), new THREE.MeshPhysicalMaterial({ color: 0xDFF6FF, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }), { cast: false }));
  jar.add(mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.16, 16).translate(0, 1.0, 0), std(0xC08A55)));
  const jarHit = hit(0.55, 1.2, 0, 0.55, 0, 'jar', 0); jar.add(jarHit);
  const jarGlow = glow(0, 0.5, 0, 1.6, 0xE8FF9A, false, jar);
  jar.visible = false;

  /* ---------- the sky: the moon and the fireflies that drift ---------- */
  scene.add(mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-17, 11, -27] }));
  glow(-17, 11, -27, 9, 0xFFE9B8, true).material.opacity = 0.55;
  const soft = softTex(), NFL = RM ? 0 : 26, flies = Array.from({ length: NFL }, () => ({ p: Math.random() * 7, x: PC[0] + (Math.random() - 0.5) * 20, z: PC[1] + (Math.random() - 0.3) * 12, y: 0.5 + Math.random() * 1.8 }));
  const flyPos = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: soft, size: 0.42, color: 0xE8FF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- the frog ---------- */
  const frog = makeFrog(); frog.scale.setScalar(0.62); frog.position.set(PC[0] + 1.3, WY + 0.2, PC[1] + 0.6); frog.userData.t = 0; scene.add(frog);
  let frogDo = null, frogHop = null;
  function frogSay(ok) { if (!RM) { frogDo = { ok, t: 0 }; D.wake(); } }
  function frogTo(x, y, z, ry = 0, dur) {
    if (frogHop) { const r = frogHop.res; frogHop = null; r?.(); }
    const from = frog.position.clone(), to = V(x, y, z), far = from.distanceTo(to);
    if (far < 0.01) { frog.rotation.y = ry; return Promise.resolve(); }
    const h = Math.min(2.4, 0.35 + far * 0.25), t = dur ?? Math.min(900, 280 + far * 60);
    frogHop = { from, to, h, ry0: frog.rotation.y, ry, t0: performance.now(), dur: RM ? 0 : t };
    D.wake();
    return new Promise(r => { frogHop.res = r; if (RM) { frog.position.copy(to); frog.rotation.y = ry; frogHop = null; r(); } });
  }

  bake(fixed);

  /* ---------- the map: three rings of lily pads, a lantern for each exam ---------- */
  const mapG = new THREE.Group(); scene.add(mapG);
  const ringM = RING.map(h => new THREE.MeshBasicMaterial({ color: hsl(h, 0.7, 0.62), transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
  RR.forEach((r, c) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 96).rotateX(Math.PI / 2).scale(1, 1, EZ).translate(PC[0], WY + 0.04, PC[1]), ringM[c]); mapG.add(t); });
  const petalM = std(0xFFB3D9, { roughness: 0.5, emissive: 0xFF5FA8, emissiveIntensity: 0.25 }), heartM = std(0xFFE08A, { emissive: 0xFFC040, emissiveIntensity: 0.5 });
  const pads = [], lanterns = [], picksMap = [poolHit];
  circles.forEach((ps, c) => {
    const n = ps.length + 1;
    ps.forEach((p, s) => {
      const [x, z] = slotAt(c, s, n), g = new THREE.Group(); g.position.set(x, WY + 0.03, z); mapG.add(g);
      const leaf = std(0x3E9B55, { roughness: 0.6, emissive: 0x7CF5B0, emissiveIntensity: 0, side: THREE.DoubleSide });
      g.add(mesh(new THREE.CircleGeometry(0.62, 28, 0.35, TAU - 0.55).rotateX(-Math.PI / 2), leaf, { cast: false }));
      g.add(mesh(new THREE.CylinderGeometry(0.62, 0.6, 0.04, 28).translate(0, -0.03, 0), std(0x2F7D45), { cast: false }));
      const flower = new THREE.Group(); g.add(flower); flower.visible = false;
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; flower.add(part(SPH, petalM, [0.1, 0.06, 0.22], [Math.sin(a) * 0.16, 0.1, Math.cos(a) * 0.16], [0.5, a, 0])); }
      flower.add(part(SPH, heartM, [0.1, 0.08, 0.1], [0, 0.14, 0]));
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 6, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: hsl(RING[c], 0.8, 0.7), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
      halo.position.y = 0.05; g.add(halo);
      const gl = glow(x, WY + 0.5, z, 1.6, hsl(RING[c], 0.9, 0.65), false);
      const h = hit(0.72, 0.6, x, WY + 0.2, z, 'proj', p); scene.add(h); picksMap.push(h);
      pads[p] = { g, leaf, flower, halo, gl, hit: h, c, pos: V(x, WY + 0.05, z), tag: null };
    });
    // the lantern of the exam, on a rock
    const [x, z] = slotAt(c, ps.length, n);
    mapG.add(part(IC, stoneM, [0.5, 0.32, 0.45], [x, WY + 0.05, z]));
    mapG.add(mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.7, 8).translate(x, 0.45, z), stoneM));
    const off = std(0x4E5A66, { roughness: 0.6 }), on = std(hsl(RING[c], 0.8, 0.75), { emissive: hsl(RING[c], 0.9, 0.6), emissiveIntensity: 1.4 });
    const lamp = mesh(boxG(0.34, 0.36, 0.34, x, 0.98, z), off); mapG.add(lamp);
    mapG.add(part(CONE, stoneM, [0.32, 0.22, 0.32], [x, 1.27, z], [0, Math.PI / 4, 0]));
    const gl = glow(x, 0.98, z, 2.0, hsl(RING[c], 0.9, 0.65), false);
    const h = hit(0.5, 1.6, x, 0.6, z, 'exam', c); scene.add(h); picksMap.push(h);
    lanterns[c] = { lamp, off, on, gl, hit: h, lit: false, pos: V(x, 1.0, z) };
  });
  let S = { open: [], valid: [], exams: [], names: [], next: -1, piscina: false }, hl = null;
  // the pond as the progress has it
  function state(s) {
    S = { ...S, ...s };
    pads.forEach((P, p) => {
      if (!P) return;
      const open = !!S.open[p], valid = !!S.valid[p];
      P.leaf.color.set(open ? 0x3E9B55 : 0x51665A); P.flower.visible = valid;
      P.gl.material.opacity = valid ? 0.55 : 0;
    });
    ringM.forEach((m, c) => { m.opacity = S.open[circles[c][0]] ? 0.55 : 0.14; });
    lanterns.forEach((L, c) => { L.lit = !!S.exams[c]; L.lamp.material = L.lit ? L.on : L.off; L.gl.material.opacity = L.lit ? 0.9 : 0; });
    poolGlow.material.opacity = S.piscina ? 0.5 : 0;
    tagNext();
    D.wake();
  }
  // the name of a pad over it: the one under the finger, or else the one to play now
  function tagOn(p) {
    pads.forEach((P, i) => { if (P?.tag) P.tag.visible = i === p; });
    const P = pads[p]; if (!P || !S.names[p]) return;
    if (!P.tag) { P.tag = label(S.names[p], { h: 0.4, bg: 'rgba(7,28,40,0.86)', ring: '#' + hsl(RING[P.c], 0.7, 0.65).getHexString(), ink: '#FFFFFF', depthTest: false, order: 20 }); P.tag.position.copy(P.pos).add(V(0, 1.05, 0)); scene.add(P.tag); }
    P.tag.visible = true;
  }
  const tagNext = () => tagOn(hl ?? S.next);
  function highlight(p) { hl = p == null || !pads[p] ? null : p; tagNext(); D.wake(); }
  // the frog waits on the pad of what is next, or by the Piscina
  function home(o = {}) {
    clear(); highlight(null);
    const P = pads[S.next];
    if (P && S.piscina) frogTo(P.pos.x + 0.05, P.pos.y + 0.04, P.pos.z + 0.1, 0.2); else frogTo(PC[0] + 1.25, WY + 0.2, PC[1] + 0.5, -0.5);
    if (viewName !== 'map') go('map', { dur: o.dur || 1000 });
  }
  // a project just validated: the flower comes up and sparkles
  function bloom(p) {
    const P = pads[p]; if (!P) return;
    P.flower.visible = true; P.flower.scale.setScalar(0.01); tween(RM ? 0 : 700, k => P.flower.scale.setScalar(Math.max(0.01, k)), easeOut);
    D.sparkle(P.pos.clone().add(V(0, 0.4, 0)), 16, 0xFFB3D9, 0.35, 1.8, 2.2); sound.chime([659, 784, 988]);
  }
  // an exam passed for the first time: its lantern lights up
  function lantern(c) {
    const L = lanterns[c]; if (!L) return;
    L.lit = true; L.lamp.material = L.on; tween(RM ? 0 : 900, k => { L.gl.material.opacity = 0.9 * k; });
    D.sparkle(L.pos.clone(), 20, 0xFFE9A0, 0.4, 2, 2); D.celebrate(2, L.pos.clone());
  }
  function poolDone() { tween(RM ? 0 : 900, k => { poolGlow.material.opacity = 0.5 * k; }); D.sparkle(V(PC[0], WY + 0.4, PC[1]), 24, 0x7FE6FF, 0.4, 2.2, 2); }

  /* ---------- the material of a question ---------- */
  const stageG = new THREE.Group(); scene.add(stageG);
  let picks = [], fig = null, shakeT = 0;
  const flyCore = std(0xFFF3A0, { emissive: 0xFFE070, emissiveIntensity: 2.2, roughness: 0.4 });
  // a firefly: a little light with its glow, at p
  function firefly(p, s = 1) {
    const g = new THREE.Group(); g.position.copy(p);
    g.add(part(SPH, flyCore, [0.07 * s, 0.07 * s, 0.07 * s], [0, 0, 0]));
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0xF2FF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.scale.setScalar(0.36 * s); g.add(sp); g.userData.ph = Math.random() * 7; stageG.add(g); return g;
  }
  // where the k-th of n fireflies sits in the jar at (x, z)
  const inJar = (x, z, k, n) => { const a = k * 2.399, r = 0.3 * Math.sqrt((k + 0.5) / Math.max(1, n)); return V(x + Math.cos(a) * r, 0.78 + (k % 5) * 0.11 + Math.floor(k / 5) * 0.012, z + Math.sin(a) * r); };
  // a flight from where a firefly is to p, on an arc
  function fly(f, p, dur = 340, up = 0.7) {
    const a = f.position.clone(); f.userData.p0 = null;
    return tween(RM ? 0 : dur, k => { f.position.lerpVectors(a, p, k); f.position.y += Math.sin(k * Math.PI) * up; }, easeOut).then(() => { f.userData.p0 = p.clone(); });
  }
  function clear() { for (const c of [...stageG.children]) drop(c); picks = []; fig = null; jar.visible = false; jarGlow.material.opacity = 0; }
  // the jar on the stump at (x, z), with n fireflies in it
  function fillJar([x, z], n) {
    jar.position.set(x, 0.64, z); jar.visible = true; jarGlow.material.opacity = n ? 0.6 : 0;
    return Array.from({ length: n }, (_, k) => { const f = firefly(inJar(x, z + 0, k, n).add(V(0, 0.64 - 0.78 + 0.1, 0)), 0.8); f.userData.p0 = f.position.clone(); return f; });
  }
  // SHARE: D fireflies in the jar and d lily pads on the little pond; a tap on a pad is onPick('pad', i)
  function share(Dn, d) {
    clear();
    const rows = d > 5 ? 2 : 1, per = Math.ceil(d / rows), step = Math.min(1.25, 5.6 / per), r = Math.min(0.55, step * 0.44);
    const src = fillJar(JAR_S, Dn), spots = [];
    for (let i = 0; i < d; i++) {
      const row = Math.floor(i / per), col = i % per, n = row ? d - per : per;
      const x = BS.x + (col - (n - 1) / 2) * step + 0.3, z = BS.z + (rows === 2 ? (row ? 0.75 : -0.75) : 0);
      const g = new THREE.Group(); g.position.set(x, WY + 0.03, z); stageG.add(g);
      g.add(mesh(new THREE.CircleGeometry(r, 24, 0.35, TAU - 0.55).rotateX(-Math.PI / 2), std(0x3E9B55, { roughness: 0.6, side: THREE.DoubleSide }), { cast: false }));
      const tag = label(String(i + 1), { h: 0.26, ink: '#E8FFE8', edge: 'rgba(0,30,10,0.8)', depthTest: false, order: 15 }); tag.position.set(0, 0.55, -r * 0.6); g.add(tag);
      const h = hit(r + 0.05, 0.5, x, WY + 0.2, z, 'pad', i); stageG.add(h); picks.push(h);
      spots.push({ x, z, r, n: 0, flies: [] });
    }
    picks.push(jarHit);
    fig = { kind: 'share', src, spots, Dn, d };
    go({ ...VIEWS.share, R: 3.0 + 0.12 * d }, { dur: 1000 }); frogTo(JAR_S[0] + 0.9, 0, JAR_S[1] + 0.9, 0.3);
  }
  const onPad = (s, k) => { const a = k * 2.399, rr = s.r * 0.75 * Math.sqrt((k + 0.5) / 12); return V(s.x + Math.cos(a) * rr, WY + 0.16, s.z + Math.sin(a) * rr); };
  // one firefly from the jar to pad i
  function send(i) {
    if (fig?.kind !== 'share') return Promise.resolve();
    const f = fig.src.pop(), s = fig.spots[i]; if (!f || !s) return Promise.resolve();
    s.flies.push(f); const k = s.n++;
    jarGlow.material.opacity = fig.src.length ? 0.6 : 0; sound.tone(520 + 40 * Math.min(k, 10), 0, 0.08, 0.04);
    return fly(f, onPad(s, k)).then(() => f.scale.setScalar(0.8));
  }
  // a sharing that did not come out even: they all go back into the jar
  function back() {
    if (!fig || !fig.src) return;
    const all = fig.kind === 'share' ? fig.spots.flatMap(s => { const a = s.flies; s.flies = []; s.n = 0; return a; }) : fig.rings.flatMap(r => { const a = r.flies; drop(r.ring); return a; });
    if (fig.kind === 'group') fig.rings = [];
    const n = fig.Dn, J = fig.kind === 'share' ? JAR_S : JAR_G;
    fig.src.push(...all); fig.src.forEach((f, k) => { f.scale.setScalar(1); fly(f, inJar(J[0], J[1], k, n).add(V(0, -0.04, 0)), 420, 0.4); });
    jarGlow.material.opacity = 0.6;
  }
  function solveShare(counts) {
    if (fig?.kind !== 'share') return;
    const all = [...fig.src, ...fig.spots.flatMap(s => s.flies)]; fig.src = []; jarGlow.material.opacity = 0;
    fig.spots.forEach((s, i) => { s.flies = all.splice(0, counts[i] || 0); s.n = s.flies.length; s.flies.forEach((f, k) => { f.position.copy(onPad(s, k)); f.userData.p0 = f.position.clone(); f.scale.setScalar(0.8); }); });
    all.forEach(f => drop(f)); D.wake();
  }
  // GROUPS: D fireflies in the jar on the meadow; each group is d of them flying into a ring on the grass (onPick('jar') asks for one)
  function groups(Dn, d) {
    clear();
    fig = { kind: 'group', src: fillJar(JAR_G, Dn), rings: [], Dn, d, R: Math.min(0.62, 0.26 + d * 0.035) };
    picks.push(jarHit);
    go({ ...VIEWS.group, R: 3.4 + Math.min(1.4, Dn / 30) }, { dur: 1000 }); frogTo(JAR_G[0] - 0.9, 0, JAR_G[1] + 0.8, 0.5);
  }
  // the place of ring m: rows of five from the jar to the right
  const ringAt = m => { const per = 5, gap = fig.R * 2 + 0.3, row = Math.floor(m / per), col = m % per; return V(JAR_G[0] + 1.55 + fig.R + col * gap, 0.04, MEAD.z - 0.9 + row * (fig.R * 2 + 0.35)); };
  function group() {
    if (fig?.kind !== 'group' || fig.src.length < fig.d) return Promise.resolve();
    const m = fig.rings.length, c = ringAt(m), d = fig.d, R = fig.R;
    const ring = mesh(new THREE.TorusGeometry(R, 0.04, 8, 40).rotateX(Math.PI / 2).translate(c.x, 0.05, c.z), std(0xFFE08A, { emissive: 0xFFC040, emissiveIntensity: 0.9 }), { cast: false });
    stageG.add(ring); ring.scale.setScalar(0.01); tween(RM ? 0 : 300, k => ring.scale.setScalar(Math.max(0.01, k)), easeOut);
    const flies = fig.src.splice(-d, d); fig.rings.push({ ring, flies });
    jarGlow.material.opacity = fig.src.length ? 0.6 : 0; sound.tone(600 + 30 * m, 0, 0.12, 0.05);
    return Promise.all(flies.map((f, k) => { const a = k / d * TAU, rr = d === 1 ? 0 : R * 0.62; return new Promise(r => setTimeout(r, RM ? 0 : k * 35)).then(() => fly(f, V(c.x + Math.cos(a) * rr, 0.22, c.z + Math.sin(a) * rr), 420, 1)); }));
  }
  function solveGroups(made) {
    if (fig?.kind !== 'group') return;
    while (fig.rings.length < made && fig.src.length >= fig.d) group();
    D.wake();
  }
  // GRID: rows of d tiles on the jetty, from the back; spare tiles apart on the front edge
  function grid(d, R, proof) {
    clear();
    const cell = Math.min(0.4, 3.9 / Math.max(d, R + 1.5)); fig = { kind: 'grid', d, R, cell, rows: 0, proof };
    picks.push(gridHit);
    go({ ...VIEWS.grid, R: Math.max(2.4, cell * Math.max(d, R + 2) * 0.8) }, { dur: 1000 }); frogTo(JET.x + JET.w / 2 + 0.5, 0, JET.z + 1.4, -0.8);
  }
  const tileM = [std(0x6FE3FF, { roughness: 0.4, emissive: 0x1C7FA0, emissiveIntensity: 0.3 }), std(0xF7C64E, { roughness: 0.4, emissive: 0xA06A10, emissiveIntensity: 0.3 })];
  function tile(x, z, m, delay = 0) {
    const s = fig.cell * 0.86, t = mesh(new THREE.BoxGeometry(s, 0.12, s).translate(0, 0.06, 0), m); t.position.set(x, 0.19, z); stageG.add(t);
    t.scale.setScalar(0.01); setTimeout(() => tween(RM ? 0 : 260, k => t.scale.setScalar(Math.max(0.01, k)), easeOut), RM ? 0 : delay); return t;
  }
  const cellAt = (r, c) => V(JET.x + (c - (fig.d - 1) / 2) * fig.cell, 0, JET.z - (fig.R + 1.3) * fig.cell / 2 + r * fig.cell);
  function row(n) {
    if (fig?.kind !== 'grid') return;
    const r = fig.rows++; for (let c = 0; c < n; c++) { const p = cellAt(r, c); tile(p.x, p.z, tileM[0], c * 25); }
    sound.tone(500 + 40 * r, 0, 0.1, 0.05);
  }
  function spare(n) {
    if (fig?.kind !== 'grid') return;
    for (let c = 0; c < n; c++) { const p = cellAt(fig.R + 0.6, c); tile(p.x, p.z, tileM[1], c * 40); }
  }
  function solveGrid(rows, last, left) {
    if (fig?.kind !== 'grid') return;
    while (fig.rows < rows) row(fig.rows === rows - 1 && last ? last : fig.d);
    if (left) spare(left);
  }
  // a paper: the frog goes to read it at the hut
  function desk() { clear(); go('desk', { dur: 1000 }); frogTo(HUT[0] - 1.25, 0.16, HUT[1] + 1.1, 0.6); }
  // the Piscina: the camera on the pool, the frog by it
  function rest() { clear(); highlight(null); D.wake(); }
  function cheer(streak = 0) {
    frogSay(true);
    const at = fig ? new THREE.Box3().setFromObject(stageG).getCenter(V(0, 0, 0)) : frog.position.clone();
    D.sparkle(at.add(V(0, 0.4, 0)), 12 + Math.min(streak, 10) * 2, 0xFFE08A, 0.3, 1.8, 2.4); D.wake();
  }
  function oops() { frogSay(false); if (!RM) { shakeT = 0.35; D.wake(); } }

  /* ---------- a tap on the pond ---------- */
  canvas.addEventListener('click', e => {
    if (!api.onPick) return;
    const list = picks.length ? picks : picksMap;
    const h = D.pick(e.clientX, e.clientY, list.filter(x => x.userData.pick && (x !== jarHit || jar.visible)))[0];
    if (h) api.onPick(h.object.userData.pick.kind, h.object.userData.pick.key);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || picks.length) return;
    const h = D.pick(e.clientX, e.clientY, picksMap)[0], p = h?.object.userData.pick;
    canvas.style.cursor = h ? 'pointer' : '';
    const q = p?.kind === 'proj' ? +p.key : null; if (q !== hl) highlight(q);
  });
  // the point of the screen where a thing that can be tapped is: for the checks in the browser, which touch it there
  function where(kind, key) {
    const o = [...picksMap, ...picks].find(h => h.userData.pick?.kind === kind && (key == null || h.userData.pick.key === String(key))); if (!o) return null;
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
    frog.userData.t += dt; frog.userData.body.scale.set(1 + Math.sin(frog.userData.t * 2.2) * 0.02, 1 + Math.sin(frog.userData.t * 2.2) * 0.03, 1);
    if (frogDo) {
      const h = frogDo; h.t += raw; const k = Math.min(1, h.t / 0.7);
      if (h.ok) frog.userData.body.position.y = Math.sin(k * Math.PI) * 0.6; else frog.userData.body.rotation.y = Math.sin(k * Math.PI * 4) * 0.4 * (1 - k);
      if (k >= 1) { frogDo = null; frog.userData.body.position.y = 0; frog.userData.body.rotation.y = 0; }
    }
    // the fireflies of the material hover where they are
    for (const f of stageG.children) if (f.userData.p0) f.position.y = f.userData.p0.y + Math.sin(t * 2.4 + f.userData.ph) * 0.035;
    if (shakeT > 0) { shakeT -= raw; stageG.position.x = Math.sin(shakeT * 60) * 0.06 * Math.max(0, shakeT / 0.35); } else stageG.position.x = 0;
    // the pad of what is next breathes; the one under the finger shines
    pads.forEach((P, p) => { if (!P) return; const on = p === hl ? 0.35 + 0.15 * Math.sin(t * 6) : p === S.next ? 0.12 + 0.1 * Math.sin(t * 2.4) : 0; P.leaf.emissiveIntensity = on; P.halo.material.opacity = p === hl ? 0.8 : p === S.next ? 0.35 + 0.25 * Math.sin(t * 2.4) : 0; });
    return true;
  });

  state({});
  const api = { ok: true, layout: (k, x) => D.layout(k, x), go, get view() { return viewName; }, state, highlight, pause: D.pause, celebrate: (t, a) => D.celebrate(t, a),
    hear: o => { sound = { ...sound, ...o }; }, rest, home, cheer, oops, bloom, lantern, poolDone, desk, share, send, back, solveShare, groups, group, solveGroups,
    grid, row, spare, solveGrid, where, onPick: null, pool: () => { clear(); go('pool', { dur: 1000 }); frogTo(PC[0] + 1.25, WY + 0.2, PC[1] + 0.5, -0.5); }, _: { D, pads, lanterns, frog } };
  return api;
}

/* ---------- the frog of the cursus, with a mortarboard ---------- */
// about one unit tall, looking at +z; its body breathes (userData.body)
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4), cap: mat(0x1E2433, { roughness: 0.5 }), tas: mat(0xF7C64E) };
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
  // the square cap of a student, with its tassel
  body.add(part(CYL, k.cap, [0.2, 0.1, 0.2], [0, 0.8, -0.02]));
  body.add(mesh(boxG(0.56, 0.04, 0.56, 0, 0.87, -0.02), k.cap));
  body.add(part(SPH, k.tas, [0.04, 0.04, 0.04], [0, 0.9, -0.02]));
  body.add(mesh(boxG(0.025, 0.22, 0.025, 0.26, 0.78, 0.2), k.tas));
  bake(body);
  g.userData.body = body;
  return g;
}
// the soft light of a firefly
function softTex() {
  return canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
