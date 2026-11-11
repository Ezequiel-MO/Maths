// El robot dels pronoms febles in 3D, built on shared/diorama.js: a block of earth floating in the dusk with the workshop of a robot on it.
// At the back, the wall of the workshop with its sign, its gears and a beacon for each exam; in front of it the robot on its platform,
// the belt that brings the things and the crate they go to. On the left the four drawers of the articles (el, la, els, les), each in its
// colour; on the right the stand of the little robots: a project validated builds one, and until then it is a blueprint of light.
// The robot is the one of the page, alive: it floats, blinks, hands the thing over after a good sentence, shakes its head after one it
// does not understand and says the good ones in a bubble. It sleeps until the Piscina wakes it.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL workshop() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, easeOut, SPH, CONE, V } from '../../shared/diorama.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RM } from '../../shared/util.js';
import { TYPES, ALL, PROJECTS, CIRCLES } from './logic.js';

/* ---------- the measures of the world ---------- */
// One unit is about a hand of the robot. The grass at 0; the block from YB up, x from X0 to X1 and z from Z0 (back) to Z1 (front)
const YB = -4.4, WY = -0.3, BY = -1.2, X0 = -11.5, X1 = 11.5, Z0 = -9.4, Z1 = 8.4;
// the pond: an ellipse round PC with radii PR, at the front on the right
const PC = [6.6, 5.0], PR = [3.5, 2.1];
const wob = a => 1 + 0.04 * Math.sin(3 * a + 0.4) + 0.03 * Math.sin(5 * a + 1.3);
const POND = Array.from({ length: 56 }, (_, i) => { const a = i / 56 * Math.PI * 2, k = wob(a); return [PC[0] + PR[0] * Math.cos(a) * k, PC[1] + PR[1] * Math.sin(a) * k]; });
// the robot, the belt (its top at BELT_Y, from BX0 to BX1 along z = BZ), the crate at its right end, the drawers and the stand
const BOT = [0.2, -2.5], BZ = 0.7, BELT_Y = 0.95, BX0 = -5.6, BX1 = 3.9, BAG = [5.3, BZ];
const BIN_X = [-8.5, -6.9, -5.3, -3.7], BIN_Z = -4.7;
const MINI = i => [3.3 + (i % 5) * 1.12, i < 5 ? 0.4 : 0.8, i < 5 ? -4.3 : -5.5];
// the colour of each little robot, and of the beacon of each circle (the rings of the map)
const MINI_HUE = [140, 48, 28, 195, 262, 318, 12, 170, 215, 290];
export const RING = [140, 195, 262, 318];
const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);
const backOut = k => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;

export function workshop(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('robot 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, hear() {}, lamps() {}, rest() {}, scene() {},
    bot() {}, wake() {}, things() {}, lit() {}, send: p, made: p, say() {}, where: () => null, validate: p, beacon: p, frogSay() {}, onPick: null };
}

function build(canvas) {
  const VIEWS = {
    map: { t: [0, 0.6, -0.9], dir: [0.24, 0.8, 1], R: 12.3 },
    // The robot, the belt and the crate; the same with the drawers; the stand of the little robots. Where the free part of the screen
    // is small (a phone held upright) the camera comes closer: the robot and the things of the belt, without the crate
    stage: { get t() { return [small() ? -0.3 : -0.4, 1.75, -0.4]; }, dir: [0.05, 0.25, 1], get R() { return small() ? 4.0 : 6.3; } },
    sort: { get t() { return small() ? [-3.6, 1.7, -1.6] : [-2.9, 1.8, -1.4]; }, dir: [0.1, 0.26, 1], get R() { return small() ? 5.3 : 5.9; } },
    minis: { t: [5.5, 1.3, -4.8], dir: [-0.15, 0.4, 1], R: 3.6 }
  };
  const small = () => { const { w, h } = D.size(); return Math.min(w, h) < 430; };
  const D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-13, 18, 14], shadow: { left: -14, right: 14, top: 13, bottom: -13 }, floor: YB - 4, under: [0, YB - 2.4, -0.5, 33, 28] });
  const { scene, glow, tween } = D;
  const fixed = new THREE.Group(); scene.add(fixed);
  // the view on show, by name: diorama's layout() forgets it (and with it the sway of the map), so it is kept here and given back
  let viewName = 'map';
  const go = (v, o) => { viewName = typeof v === 'string' ? v : null; return D.go(v, o); };
  const layout = (kind, x) => { D.layout(kind, x); if (viewName && D.view !== viewName) D.go(viewName, { dur: 700 }); };
  let sound = { tone() {}, chime() {} };

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
  for (const [x, z, r] of [[4.6, 5.4, 0.42], [5.6, 6.2, 0.32], [8.6, 4.2, 0.4], [8.0, 6.1, 0.34], [6.4, 3.8, 0.3]]) {
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
  // trees, bushes and flowers on the grass
  const trunkM = std(0x7A5230), LEAF = [0x4E9F5B, 0x67B565, 0x3F8A4E];
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(LEAF[(i + Math.round(Math.abs(x))) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-10.2, -8.0, 1.3], [10.3, -8.2, 1.25], [-10.4, 6.6, 0.85], [10.6, 0.6, 0.9], [-10.6, 0.8, 0.8], [1.6, 7.4, 0.7]]) tree(x, z, s);
  const bushM = std(0x4F9C58, { flatShading: true });
  for (const [x, z, s] of [[-10.6, -4.2, 0.5], [10.7, -4.4, 0.45], [-4.2, 7.6, 0.4], [-10.5, 3.6, 0.45], [10.8, 7.2, 0.4], [3.2, 6.6, 0.35]])
    fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  for (let i = 0; i < 28; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.06, 0.05, 0.06], [i % 2 ? -10.8 + (i * 13 % 34) / 10 : -2.6 + (i * 7 % 50) / 10, 0.06, i % 2 ? 2.2 + (i * 47 % 56) / 10 : 5.2 + (i * 29 % 28) / 10]));

  /* ---------- the workshop: its floor, its wall, its sign, its gears ---------- */
  const steelM = std(0x6F8C9E, { roughness: 0.45, metalness: 0.45 }), steel2M = std(0x4B6475, { roughness: 0.5, metalness: 0.4 }), darkM = std(0x1D2B36, { roughness: 0.7 });
  const wallM = std(0x3F6E8C, { roughness: 0.7 }), wall2M = std(0x2F566E, { roughness: 0.75 }), trimM = std(0xF7C64E, { roughness: 0.45 }), rubberM = std(0x20262B, { roughness: 0.9 });
  const warmM = std(0xFFD46B, { emissive: 0xFFB030, emissiveIntensity: 1.4, roughness: 0.4 });
  // the floor of tiles under everything, and the round platform of the robot with its yellow ring
  fixed.add(mesh(boxG(19.4, 0.08, 9.6, -0.4, 0.04, -3.0), std(0xB8C4CC, { roughness: 0.85 }), { cast: false }));
  for (let x = -9.6; x <= 9; x += 1.6) fixed.add(mesh(boxG(0.04, 0.02, 9.6, x, 0.09, -3.0), std(0x93A2AD, { roughness: 0.9 }), { cast: false }));
  for (let z = -7.4; z <= 1.6; z += 1.6) fixed.add(mesh(boxG(19.4, 0.02, 0.04, -0.4, 0.09, z), std(0x93A2AD, { roughness: 0.9 }), { cast: false }));
  fixed.add(mesh(new THREE.CylinderGeometry(2.3, 2.45, 0.2, 40).translate(BOT[0], 0.18, BOT[1]), steelM));
  fixed.add(mesh(new THREE.TorusGeometry(2.05, 0.09, 8, 48).rotateX(Math.PI / 2).translate(BOT[0], 0.29, BOT[1]), trimM, { cast: false }));
  const ringM = std(0x6FE3FF, { emissive: 0x6FE3FF, emissiveIntensity: 1.2, roughness: 0.4 });
  const ring = mesh(new THREE.TorusGeometry(1.35, 0.05, 6, 40).rotateX(Math.PI / 2).translate(BOT[0], 0.29, BOT[1]), ringM, { cast: false }); ring.userData.keep = true; scene.add(ring);
  // the wall at the back: panels, a base, a trim, two pillars and round windows with light inside
  const WZ = -7.6, WH = 4.4;
  fixed.add(mesh(boxG(17.6, WH, 0.5, -0.4, WH / 2, WZ), wallM));
  fixed.add(mesh(boxG(17.7, 0.5, 0.6, -0.4, 0.25, WZ), wall2M));
  fixed.add(mesh(boxG(17.8, 0.22, 0.7, -0.4, WH + 0.11, WZ), trimM));
  for (let x = -8.4; x <= 7.7; x += 2.3) fixed.add(mesh(boxG(0.08, WH - 0.6, 0.06, x, WH / 2 + 0.2, WZ + 0.27), wall2M, { cast: false }));
  for (const x of [-9.4, 8.6]) { fixed.add(mesh(boxG(0.9, WH + 0.9, 0.9, x, (WH + 0.9) / 2, WZ), wall2M)); fixed.add(mesh(new THREE.ConeGeometry(0.75, 0.8, 4).rotateY(Math.PI / 4).translate(x, WH + 1.3, WZ), std(0xD9574C, { roughness: 0.6 }))); }
  for (const x of [-1.5, 0.2, 1.9]) { fixed.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24).rotateX(Math.PI / 2).translate(x, 3.25, WZ + 0.28), warmM, { cast: false })); fixed.add(mesh(new THREE.TorusGeometry(0.44, 0.07, 6, 24).translate(x, 3.25, WZ + 0.3), steelM, { cast: false })); }
  // the door the little robots come out of, with its stripes
  fixed.add(mesh(boxG(2.3, 2.5, 0.1, 5.5, 1.25, WZ + 0.28), darkM, { cast: false }));
  for (let i = 0; i < 6; i++) fixed.add(mesh(boxG(0.42, 0.14, 0.12, 4.45 + i * 0.42, 2.58, WZ + 0.3), i % 2 ? darkM : trimM, { cast: false }));
  // pipes and a chimney
  fixed.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.4, 10).rotateZ(Math.PI / 2).translate(-5.4, 1.25, WZ + 0.42), steel2M));
  fixed.add(mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.6, 12).translate(7.2, WH + 0.9, WZ), steel2M));
  fixed.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 12).translate(7.2, WH + 1.72, WZ), trimM));
  // the gears on the wall: they turn (not baked)
  const gearGeo = (r, n) => {
    const s = new THREE.Shape();
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, q = i % 2 ? r * 0.8 : r; for (const da of [-0.25, 0.25]) { const b = a + da * Math.PI / n; i || da > 0 ? s.lineTo(Math.cos(b) * q, Math.sin(b) * q) : s.moveTo(Math.cos(b) * q, Math.sin(b) * q); } }
    s.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.28, 0, Math.PI * 2, true); s.holes.push(hole);
    return new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false, curveSegments: 8 });
  };
  const gears = [[-6.6, 3.0, 1.05, 12, 0xF7C64E, 1], [-4.92, 2.36, 0.72, 8, 0xFF8FD0, -1.5], [-3.7, 3.25, 0.74, 8, 0x7CF5B0, 1.5]].map(([x, y, r, n, c, v]) => {
    const g = mesh(gearGeo(r, n), std(c, { roughness: 0.45, metalness: 0.25 })); g.position.set(x, y, WZ + 0.28); g.userData.keep = true; g.userData.v = v; scene.add(g); return g;
  });
  // the sign over the wall, written again once the font of the page is there
  const signTex = canvasTex(1024, 180, () => {}), signM = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false });
  function paintSign() {
    const g = signTex.image.getContext('2d'), w = 1024, h = 180;
    g.fillStyle = '#06202B'; g.beginPath(); g.roundRect(0, 0, w, h, 40); g.fill(); g.lineWidth = 10; g.strokeStyle = '#6FE3FF'; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 34); g.stroke();
    g.font = '800 118px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#6FE3FF'; g.shadowBlur = 26; g.fillStyle = '#C9F7FF'; g.fillText('TALLER DE ROBOTS', w / 2, h / 2 + 10);
    signTex.needsUpdate = true; D.wake();
  }
  paintSign(); document.fonts?.load?.('800 120px "Baloo 2"').then(paintSign).catch(() => {});
  const sign = mesh(new THREE.PlaneGeometry(7.4, 1.3), signM, { cast: false, at: [-0.4, WH + 1.15, WZ + 0.1] }); sign.userData.keep = true; scene.add(sign);
  for (const x of [-3.4, 2.6]) fixed.add(mesh(boxG(0.14, 0.5, 0.14, x, WH + 0.4, WZ), steel2M));
  // a beacon on the wall for each circle: it lights with its colour when its exam is passed
  const beacons = CIRCLES.map((_, c) => {
    const x = [-8.0, -5.6, 4.6, 6.0][c] ?? -8 + c * 2, m = std(0x51606B, { roughness: 0.4, emissive: hsl(RING[c % RING.length], 0.9, 0.55), emissiveIntensity: 0 });
    fixed.add(mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.24, 12).translate(x, WH + 0.34, WZ), steel2M));
    const b = mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, WH + 0.44, WZ), m, { cast: false }); b.userData.keep = true; scene.add(b);
    const gl = glow(x, WH + 0.6, WZ, 1.7, hsl(RING[c % RING.length], 0.9, 0.6), false);
    return { m, gl, x, on: false, pos: V(x, WH + 0.6, WZ) };
  });
  const setBeacon = (B, k) => { B.m.emissiveIntensity = 2.2 * k; B.gl.material.opacity = 0.9 * k; };
  // two lamps by the platform, of the colour of the project on show
  const lampGlows = [-2.5, 2.9].map(x => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.5, 8).translate(x, 1.25, BOT[1] - 1.9), steel2M));
    fixed.add(mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.2, 10).translate(x, 2.55, BOT[1] - 1.9), steel2M));
    const bulb = part(SPH, new THREE.MeshBasicMaterial({ color: 0xFFE9B8, toneMapped: false }), [0.17, 0.17, 0.17], [x, 2.36, BOT[1] - 1.9]); bulb.castShadow = false; bulb.userData.keep = true; scene.add(bulb);
    return { g: glow(x, 2.36, BOT[1] - 1.9, 2.4, 0xFFC46A, true), bulb };
  });
  function lamps(hue) { for (const L of lampGlows) { const c = hue == null ? new THREE.Color(0xFFC46A) : hsl(hue, 0.85, 0.62); L.g.material.color.copy(c); L.bulb.material.color.copy(c).lerp(new THREE.Color(0xffffff), 0.5); } ringM.emissive.copy(hue == null ? new THREE.Color(0x6FE3FF) : hsl(hue, 0.9, 0.6)); ringM.color.copy(ringM.emissive); D.wake(); }

  /* ---------- the belt and the crate ---------- */
  const beltTex = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#20262B'; g.fillRect(0, 0, w, h); g.fillStyle = '#39434B'; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 26, h); g.lineTo(x + 12, h); g.fill(); } });
  beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping; beltTex.repeat.set(9, 1);
  const BL = BX1 - BX0, BMX = (BX0 + BX1) / 2;
  const belt = mesh(new THREE.PlaneGeometry(BL, 1.0).rotateX(-Math.PI / 2).translate(BMX, BELT_Y + 0.005, BZ), std(0xffffff, { map: beltTex, roughness: 0.9 }), { cast: false }); belt.userData.keep = true; scene.add(belt);
  fixed.add(mesh(boxG(BL, 0.22, 1.0, BMX, BELT_Y - 0.11, BZ), rubberM));
  for (const dz of [-0.56, 0.56]) fixed.add(mesh(boxG(BL + 0.3, 0.3, 0.12, BMX, BELT_Y - 0.1, BZ + dz), steelM));
  for (const x of [BX0, BX1]) fixed.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 14).rotateX(Math.PI / 2).translate(x, BELT_Y - 0.11, BZ), steel2M));
  for (const x of [BX0 + 0.5, BMX, BX1 - 0.5]) for (const dz of [-0.45, 0.45]) fixed.add(mesh(boxG(0.14, BELT_Y - 0.2, 0.14, x, (BELT_Y - 0.2) / 2, BZ + dz), steel2M));
  // its box of buttons
  fixed.add(mesh(boxG(0.7, 0.5, 0.2, BX0 + 0.9, 0.55, BZ + 0.72), steel2M));
  [0xFF6B5E, 0xF7C64E, 0x7CF5B0].forEach((c, i) => fixed.add(part(SPH, std(c, { emissive: c, emissiveIntensity: 0.7 }), [0.08, 0.08, 0.05], [BX0 + 0.7 + i * 0.2, 0.58, BZ + 0.83])));
  // the crate the things go to: open on top, with a band of gold
  {
    const [x, z] = BAG, wood = std(0xB9793F, { roughness: 0.75 }), wood2 = std(0x8B5A3C, { roughness: 0.8 });
    fixed.add(mesh(boxG(1.7, 0.1, 1.3, x, 0.13, z), wood2));
    for (const [w, d, dx, dz] of [[1.7, 0.1, 0, 0.6], [1.7, 0.1, 0, -0.6], [0.1, 1.3, 0.8, 0], [0.1, 1.3, -0.8, 0]]) fixed.add(mesh(boxG(w, 0.85, d, x + dx, 0.5, z + dz), wood));
    fixed.add(mesh(boxG(1.76, 0.12, 0.04, x, 0.72, z + 0.66), trimM, { cast: false }));
    for (const dx of [-0.5, 0.5]) fixed.add(mesh(boxG(0.1, 0.85, 0.03, x + dx, 0.5, z + 0.66), wood2, { cast: false }));
  }

  /* ---------- the four drawers of the articles ---------- */
  const bins = ALL.map((type, i) => {
    const h = TYPES[type].hue, x = BIN_X[i], c = hsl(h, 0.62, 0.52), c2 = hsl(h, 0.6, 0.36);
    const g = new THREE.Group(); g.position.set(x, 0.08, BIN_Z); scene.add(g);
    const body = std(c, { roughness: 0.5 }), dark = std(c2, { roughness: 0.6 });
    g.add(mesh(boxG(1.34, 0.1, 1.2, 0, 0.05, 0), dark));
    for (const [w, d, dx, dz] of [[1.34, 0.1, 0, 0.55], [1.34, 0.1, 0, -0.55], [0.1, 1.2, 0.62, 0], [0.1, 1.2, -0.62, 0]]) g.add(mesh(boxG(w, 1.05, d, dx, 0.6, dz), body));
    g.add(mesh(boxG(0.5, 0.1, 0.08, 0, 0.42, 0.62), dark, { cast: false }));
    bake(g);
    const tag = label(TYPES[type].art, { h: 0.62, bg: `hsl(${h} 70% 30%)`, ring: `hsl(${h} 90% 72%)`, ink: '#FFFFFF' }); tag.position.set(0, 0.86, 0.72); g.add(tag);
    const hit = new THREE.Mesh(boxG(1.5, 1.9, 1.4, 0, 0.9, 0), HIT()); hit.userData.pick = { kind: 'bin', key: type }; g.add(hit);
    return { type, g, tag, hit, n: 0, top: V(x, 1.35, BIN_Z) };
  });
  function HIT() { return HIT.m || (HIT.m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 })); }

  /* ---------- the stand of the little robots: one for each project ---------- */
  fixed.add(mesh(boxG(6.0, 0.4, 1.2, 5.55, 0.2, -4.3), steel2M)); fixed.add(mesh(boxG(6.0, 0.8, 1.2, 5.55, 0.4, -5.5), steel2M));
  for (const z of [-3.72, -4.92]) fixed.add(mesh(boxG(6.0, 0.06, 0.06, 5.55, z < -4 ? 0.8 : 0.4, z), trimM, { cast: false }));
  const ghostFill = new THREE.MeshBasicMaterial({ color: 0x6FE3FF, transparent: true, opacity: 0.08, depthWrite: false, toneMapped: false });
  const ghostLine = new THREE.LineBasicMaterial({ color: 0x9FEFFF, transparent: true, opacity: 0.55, toneMapped: false });
  const minis = PROJECTS.map((_, i) => {
    const [x, y, z] = MINI(i), g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    const real = makeMini(i), ghost = new THREE.Group();
    for (const geo of [new RoundedBoxGeometry(0.5, 0.46, 0.42, 2, 0.1).translate(0, 0.4, 0), new RoundedBoxGeometry(0.46, 0.36, 0.4, 2, 0.1).translate(0, 0.86, 0)]) {
      ghost.add(new THREE.Mesh(geo, ghostFill)); ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), ghostLine));
    }
    g.add(real, ghost);
    return { g, real, ghost, built: false, t: i * 1.7, hop: 0, top: V(x, y + 1.2, z) };
  });
  const setMini = (Mi, on) => { Mi.built = on; Mi.real.visible = on; Mi.ghost.visible = !on; Mi.real.scale.setScalar(1); };

  /* ---------- the sky: the moon and the fireflies ---------- */
  scene.add(mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-16, 10, -26] }));
  glow(-16, 10, -26, 9, 0xFFE9B8, true).material.opacity = 0.55;
  const NFL = RM ? 0 : 20, flies = Array.from({ length: NFL }, (_, i) => ({ p: Math.random() * 7, x: (i % 2 ? -1 : 1) * (5 + Math.random() * 5.5), z: 1.5 + Math.random() * 6, y: 0.4 + Math.random() * 1.5 }));
  const flyPos = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: softTex(), size: 0.4, color: 0xE8FF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- the frog, commander of the robot, on its box ---------- */
  const FROG_AT = [-4.9, 2.9];
  fixed.add(mesh(boxG(1.3, 0.5, 1.3, FROG_AT[0], 0.25, FROG_AT[1]), std(0x8B5A3C, { roughness: 0.8 })));
  fixed.add(mesh(boxG(1.4, 0.08, 1.4, FROG_AT[0], 0.52, FROG_AT[1]), trimM));
  const frog = makeFrog(); frog.position.set(FROG_AT[0], 0.56, FROG_AT[1]); frog.rotation.y = 0.5; frog.scale.setScalar(1.25); frog.userData.t = 0; scene.add(frog);
  let frogDo = null;
  function frogSay(cls) { if (!RM && (cls === 'go' || cls === 'oops')) { frogDo = { ok: cls === 'go', t: 0 }; D.wake(); } }

  /* ---------- the robot ---------- */
  const robot = makeRobot(); robot.g.position.set(BOT[0], 0.3, BOT[1]); scene.add(robot.g);
  const jetGlow = glow(0, 0.2, 0, 1.5, 0x6FE3FF, true, robot.g), antGlow = glow(0, 0, 0, 0.9, 0xF7C64E, true, robot.ant);
  // mood: '' waiting, 'ok' after a good sentence, 'err' after one it does not understand. awake goes from 0 (asleep) to 1
  let mood = '', act = null, awake = 1, awakeTo = 1, blink = 2;
  function bot(m = '') {
    mood = m; robot.face(m, awakeTo > 0.5);
    act = RM ? null : m === 'ok' ? { kind: 'ok', t: 0, dur: 0.95 } : m === 'err' ? { kind: 'err', t: 0, dur: 0.6 } : act?.kind === 'give' ? act : null;
    D.wake();
  }
  // how awake the robot is, from 0 to 1 (the Piscina wakes it a third at a time)
  function wake(k) { awakeTo = Math.max(0, Math.min(1, k)); if (RM) awake = awakeTo; robot.face(mood, awakeTo > 0.5); D.wake(); }
  // what the robot says, in a bubble over its head; hold keeps it until the next one or rest()
  let bubble = null, bubbleGen = 0;
  function say(text, hold = false) {
    const my = ++bubbleGen;
    if (bubble) { drop(bubble); bubble = null; }
    if (!text) return D.wake();
    const b = label(text, { h: 0.66, bg: '#FFFFFF', ring: '#6FE3FF', ink: '#06202B', depthTest: false, order: 9 });
    const w = b.scale.x, k = Math.min(1, 7.2 / w); b.userData.s = [b.scale.x * k, b.scale.y * k];
    b.position.set(BOT[0], 3.95, BOT[1] + 0.2); scene.add(b); bubble = b;
    tween(RM ? 0 : 380, q => { if (bubble === b) b.scale.set(b.userData.s[0] * q, b.userData.s[1] * q, 1); }, backOut);
    if (!hold) setTimeout(() => { if (bubbleGen === my && bubble === b) { drop(b); bubble = null; D.wake(); } }, 3200);
  }

  /* ---------- everything that never moves, baked into a few meshes ---------- */
  bake(fixed);

  /* ---------- the things on the belt ---------- */
  // What is on the stage now goes away with rest(): the things of the belt (items, by key), what the crate and the drawers hold
  const stageG = new THREE.Group(); scene.add(stageG);
  function drop(o) { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.isSprite) x.material.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); }); }
  const PICS = new Map();
  const picTex = pic => { if (!PICS.has(pic)) PICS.set(pic, canvasTex(160, 160, (g, w) => { g.font = `${w * 0.72}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(pic, w / 2, w * 0.55); })); return PICS.get(pic); };
  function picSprite(pic, s) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: picTex(pic), transparent: true, depthWrite: false, toneMapped: false }));
    sp.scale.set(s, s, 1); sp.renderOrder = 4; sp.userData.dispose = () => sp.material.dispose(); return sp;
  }
  const TRAY = new THREE.CylinderGeometry(0.6, 0.66, 0.08, 24), HITG = new THREE.BoxGeometry(1.5, 1.7, 1.2); TRAY.userData.shared = HITG.userData.shared = true;
  let items = new Map(), gen = 0, bagN = 0, onPick = null, beltRun = 0, madeS = null;
  // a thing on its tray: its drawings (n of them) and its name on a tag at the front of the belt
  function item(T) {
    const g = new THREE.Group(), n = T.n || 1, s = n > 3 ? 0.7 : n > 1 ? 0.9 : 1.25, gap = n > 3 ? 0.42 : 0.52, pics = new THREE.Group();
    const tray = mesh(TRAY, std(0x2A4B5C, { roughness: 0.4, metalness: 0.3, emissive: 0x6FE3FF, emissiveIntensity: 0.15 }), { at: [0, 0.04, 0] }); g.add(tray);
    for (let i = 0; i < n; i++) { const sp = picSprite(T.pic, s); sp.position.set((i - (n - 1) / 2) * gap, 0.14 + s / 2 + (n > 1 && i % 2 ? 0.1 : 0), (i % 2) * 0.02); pics.add(sp); }
    g.add(pics);
    let tag = null;
    if (T.text) { tag = label(T.text, { h: 0.36, bg: '#06202B', ring: '#6FE3FF', ink: '#FFFFFF', depthTest: false, order: 7 }); tag.position.set(0, -0.2, 0.62); g.add(tag); }
    const hit = new THREE.Mesh(HITG, HIT()); hit.position.y = 0.7; hit.userData.pick = { kind: 'thing', key: T.key }; g.add(hit);
    return { g, tray, pics, tag, hit, T, t: Math.random() * 6 };
  }
  // The things of a round on the belt: they ride in from the left. list: [{ key, pic, n, text, off }] (off: a thing the robot has not got)
  function things(list) {
    const my = ++gen;
    for (const it of items.values()) drop(it.g);
    items = new Map();
    const n = list.length, span = n > 1 ? Math.min(2.05, 7.4 / (n - 1)) : 0, x0 = -0.75 - span * (n - 1) / 2 + (n > 3 ? 0.4 : 0);
    list.forEach((T, i) => {
      const it = item(T), x = x0 + i * span; it.x = x;
      if (T.off) for (const sp of it.pics.children) sp.material.opacity = 0.3;
      it.g.position.set(RM ? x : BX0 - 0.6 - i * 0.2, BELT_Y, BZ); stageG.add(it.g); items.set(T.key, it);
      const from = it.g.position.x;
      tween(RM ? 0 : 520 + i * 90, k => { if (gen === my) it.g.position.x = from + (x - from) * k; }, easeOut);
    });
    if (!RM && n) { beltRun = 0.7; sound.tone(180, 0, 0.25, 0.04, 'sawtooth'); }
    D.wake();
  }
  // a thing lit in the colour of its article (hue), or put out (null)
  function lit(key, hue) {
    const it = items.get(key); if (!it) return;
    it.tray.material.emissive.copy(hue == null ? new THREE.Color(0x6FE3FF) : hsl(hue, 0.9, 0.6)); it.tray.material.emissiveIntensity = hue == null ? 0.15 : 1.6; D.wake();
  }
  // A thing leaves the belt: to the crate ({ bag: true }), to a drawer ({ bin: type }) or away along the belt ({ away: true }).
  // The robot hands it over. Resolves when it is there
  function send(key, to = { bag: true }) {
    const it = items.get(key), my = gen; if (!it) return Promise.resolve();
    items.delete(key); it.hit.userData.pick = null;
    if (to.away) return tween(RM ? 0 : 700, k => { it.g.position.x = it.x + (BX1 + 1.2 - it.x) * k; it.g.scale.setScalar(1 - 0.6 * k); }).then(() => drop(it.g));
    const B = to.bin ? bins.find(b => b.type === to.bin) : null, slot = B ? B.n++ : bagN++;
    const end = B ? B.top.clone().add(V((slot % 3 - 1) * 0.36, Math.floor(slot / 3) * 0.34, 0.1)) : V(BAG[0] + (slot % 4 - 1.5) * 0.38, 1.12 + Math.floor(slot / 4) * 0.36, BAG[1] + 0.12);
    const from = it.g.position.clone(), top = Math.max(from.y, end.y) + 1.6;
    if (it.tag) { drop(it.tag); it.tag = null; }
    it.tray.visible = false;
    if (!RM && !B) act = { kind: 'give', t: 0, dur: 0.75 };
    return tween(RM ? 0 : 640, k => {
      it.g.position.lerpVectors(from, end, k); it.g.position.y = from.y + (end.y - from.y) * k + Math.sin(k * Math.PI) * (top - Math.max(from.y, end.y)); it.g.scale.setScalar(1 - 0.52 * k);
    }, k => k).then(() => {
      if (my !== gen) return drop(it.g);
      // what stays there: one small drawing
      drop(it.g); const sp = picSprite(it.T.pic, 0.46); sp.position.copy(end); stageG.add(sp);
      D.sparkle(end.clone(), 8, B ? hsl(TYPES[B.type].hue, 0.9, 0.7) : 0xFFE08A, 0.3, 1.3, 2.5);
    });
  }
  // what a mission builds comes out of the crate, big
  function made(pic) {
    const my = gen, sp = picSprite(pic, 0.1), at = V(BAG[0], 1.3, BAG[1] + 0.1); sp.position.copy(at); sp.renderOrder = 8; sp.material.depthTest = false; stageG.add(sp); madeS = sp;
    D.sparkle(at.clone(), 16, 0xFFE08A, 0.4, 2, 2); D.celebrate(2, at.clone());
    return tween(RM ? 0 : 900, k => { if (my === gen) { sp.scale.setScalar(0.1 + 1.9 * k); sp.position.y = 1.3 + 1.5 * k; } }, backOut);
  }
  // the stage empty again: nothing on the belt, in the crate or in the drawers, the robot waiting
  function rest() {
    gen++; bubbleGen++; for (const o of [...stageG.children]) drop(o);
    if (bubble) { drop(bubble); bubble = null; }
    items = new Map(); bagN = 0; madeS = null; for (const B of bins) B.n = 0; bot(''); canvas.dataset.escena = ''; D.wake();
  }
  // The place of a level: 'stage' (the robot, the belt and the crate) or 'sort' (with the drawers); types: the drawers of the level,
  // the others stay dim
  function setScene(kind, types = ALL) {
    canvas.dataset.escena = kind;
    for (const B of bins) { const on = kind === 'sort' && types.includes(B.type); B.tag.material.opacity = kind !== 'sort' || on ? 1 : 0.25; B.hit.userData.pick = on ? { kind: 'bin', key: B.type } : null; }
    go(kind === 'sort' ? 'sort' : 'stage');
  }
  // a tap on the workshop: a thing of the belt or a drawer under the finger
  const pickables = () => [...[...items.values()].map(it => it.hit), ...bins.map(B => B.hit)].filter(h => h.userData.pick);
  canvas.addEventListener('click', e => {
    if (!api.onPick) return;
    const hit = D.pick(e.clientX, e.clientY, pickables())[0];
    if (hit) api.onPick(hit.object.userData.pick.kind, hit.object.userData.pick.key);
  });
  // the point of the screen where a thing of the belt or a drawer is: for the checks in the browser, which touch it there
  function where(kind, key) {
    const o = pickables().find(h => h.userData.pick.kind === kind && h.userData.pick.key === key); if (!o) return null;
    return D.onScreen(new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0)));
  }

  /* ---------- what moves by itself ---------- */
  let hlOn = -1;
  D.every((dt, now, raw) => {
    if (RM) { robot.pose({ awake, hop: 0, lz: 0.12, rz: 0.12, rx: 0, turn: 0, shakeH: 0, t: 0 }); return false; }
    const t = now / 1000;
    for (const g of gears) g.rotation.z += dt * 0.5 * g.userData.v;
    flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; });
    if (NFL) flyGeo.attributes.position.needsUpdate = true;
    if (beltRun > 0) { beltRun -= raw; beltTex.offset.x -= dt * 1.6; }
    // the frog breathes, and leaps or shakes its head with what the tip says
    frog.userData.t += dt; frog.userData.body.scale.set(1 + Math.sin(frog.userData.t * 2.2) * 0.02, 1 + Math.sin(frog.userData.t * 2.2) * 0.03, 1);
    if (frogDo) {
      const h = frogDo; h.t += raw; const k = Math.min(1, h.t / 0.7);
      if (h.ok) frog.position.y = 0.56 + Math.sin(k * Math.PI) * 0.6; else frog.userData.body.rotation.y = Math.sin(k * Math.PI * 4) * 0.4 * (1 - k);
      if (k >= 1) { frogDo = null; frog.position.y = 0.56; frog.userData.body.rotation.y = 0; }
    }
    // the robot: it wakes little by little, floats, blinks, and does what its mood says
    awake += (awakeTo - awake) * Math.min(1, dt * 2.5);
    const P = { awake, hop: 0, lz: 0.12, rz: 0.12, rx: 0, turn: 0, shakeH: 0, t };
    if (act) {
      act.t += raw; const k = Math.min(1, act.t / act.dur), e = Math.sin(k * Math.PI);
      if (act.kind === 'ok') { P.hop = e * 0.45; P.lz = P.rz = 0.12 + e * 2.3; P.turn = easeOut(k) * Math.PI * 2; }
      else if (act.kind === 'err') { P.shakeH = Math.sin(k * Math.PI * 5) * 0.4 * (1 - k); P.lz = P.rz = 0.12 + e * 0.5; }
      else { P.rx = e * 1.75; P.turn = e * 0.55; }
      if (k >= 1) act = null;
    }
    blink -= dt; if (blink < -0.14) blink = 2 + Math.random() * 3;
    P.blink = blink < 0;
    robot.pose(P);
    jetGlow.material.opacity = awake * (0.55 + 0.25 * Math.sin(t * 23)); jetGlow.scale.setScalar(1.5 * (0.9 + 0.1 * Math.sin(t * 17)));
    antGlow.material.opacity = awake * (0.45 + 0.45 * Math.sin(t * 4) ** 2);
    ringM.emissiveIntensity = 0.5 + awake * (0.7 + 0.4 * Math.sin(t * 2.4));
    // the things on the belt float a little; the one a mission built turns
    for (const it of items.values()) it.pics.position.y = Math.sin(t * 2.4 + it.t) * 0.05;
    if (madeS) madeS.material.rotation = Math.sin(t * 2.2) * 0.12;
    // the little robots: the built ones sway, and hop now and then; the one under the finger shines
    minis.forEach((Mi, i) => {
      Mi.t += dt;
      if (Mi.built) {
        if (Mi.hop > 0) { Mi.hop -= raw; Mi.real.position.y = Math.sin(Math.max(0, Mi.hop) / 0.5 * Math.PI) * 0.35; } else { Mi.real.position.y = 0; if (Math.random() < dt * 0.06) Mi.hop = 0.5; }
        Mi.real.rotation.y = Math.sin(Mi.t * 1.3) * 0.3;
      }
      if (i === hlOn) { const p = 0.5 + 0.5 * Math.sin(now * 0.008); if (Mi.built) Mi.real.scale.setScalar(1 + 0.12 * p); else Mi.ghost.scale.setScalar(1 + 0.1 * p); }
    });
    return true;
  });

  /* ---------- the map: what is built, and what is under the finger ---------- */
  // a project under the finger: its little robot hops and shines; null puts it out. The camera stays where it is
  function highlight(i) {
    if (hlOn >= 0) { minis[hlOn].real.scale.setScalar(1); minis[hlOn].ghost.scale.setScalar(1); }
    hlOn = Number.isInteger(i) && minis[i] ? i : -1;
    if (hlOn >= 0 && minis[hlOn].built) minis[hlOn].hop = 0.5;
    D.wake();
  }
  let piscinaOn = false;
  // the workshop as the progress has it: piscina (the robot awake), valid (the projects validated) and exams (the circles passed)
  function state({ piscina = false, valid = [], exams = [] } = {}) {
    piscinaOn = piscina;
    minis.forEach((Mi, i) => setMini(Mi, valid.includes(i)));
    beacons.forEach((B, c) => { B.on = exams.includes(c); setBeacon(B, B.on ? 1 : 0); });
    awakeTo = piscina ? 1 : 0; awake = awakeTo; robot.face(mood, piscina); flyPts.visible = piscina;
    said();
  }
  const said = () => { canvas.dataset.robotets = minis.filter(Mi => Mi.built).length; canvas.dataset.fars = beacons.filter(B => B.on).length; canvas.dataset.piscina = piscinaOn ? '1' : '0'; D.wake(); };
  // a project validated: the camera goes to the stand and its little robot is built
  function validate(i) {
    const Mi = minis[i]; if (!Mi || Mi.built) return Promise.resolve();
    return go('minis').then(async () => {
      setMini(Mi, true); Mi.real.scale.setScalar(0.01); said();
      sound.tone(523, 0, 0.3, 0.08); sound.tone(784, 0.15, 0.4, 0.08); sound.tone(1047, 0.3, 0.5, 0.07);
      await tween(RM ? 0 : 900, k => Mi.real.scale.setScalar(Math.max(0.01, k)), backOut);
      Mi.hop = 0.5; D.sparkle(Mi.top.clone(), 20, hsl(MINI_HUE[i], 0.9, 0.7), 0.4, 2.2, 2); D.celebrate(3, Mi.top.clone());
    });
  }
  // an exam passed: the beacon of its circle lights up
  function beacon(c) {
    const B = beacons[c]; if (!B || B.on) return Promise.resolve();
    B.on = true;
    return go('map').then(() => tween(RM ? 0 : 1400, k => setBeacon(B, k), easeOut)).then(() => { said(); D.sparkle(B.pos.clone(), 16, hsl(RING[c % RING.length], 0.9, 0.7), 0.4, 1.8, 2); D.celebrate(3, B.pos.clone()); });
  }

  state({});
  const api = { ok: true, layout, go, get view() { return viewName; }, state, highlight, pause: D.pause, celebrate: (t, at) => D.celebrate(t, at), shake: D.shake,
    hear: o => { sound = { ...sound, ...o }; }, lamps, rest, scene: setScene, bot, wake, things, lit, send, made, say, where, validate, beacon, frogSay, onPick: null,
    _: { D, minis, beacons, robot, bins } };
  return api;
}

/* ---------- the robot: the one of the page, with a body ---------- */
// About 3 units tall, looking at +z. Its head, its arms and its eyes move: pose(P) puts them where P says, face(mood, awake) changes
// its eyes and the sign on the screen of its chest. ant is the ball of its aerial (its glow hangs from it)
function makeRobot() {
  const g = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(); g.add(body);
  const white = std(0xEAF7FF, { roughness: 0.32, metalness: 0.05 }), steel = std(0x7FA3B5, { roughness: 0.45, metalness: 0.45 }), glass = std(0x06202B, { roughness: 0.12, metalness: 0.3 });
  const basic = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  const put = (parent, geo, m, x = 0, y = 0, z = 0, keep = false) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; if (keep) o.userData.keep = true; parent.add(o); return o; };
  // the torso, with the screen of its chest and three lights
  put(body, new RoundedBoxGeometry(1.55, 1.3, 1.1, 5, 0.34), white, 0, 1.25, 0);
  put(body, new THREE.TorusGeometry(0.6, 0.09, 8, 28).rotateX(Math.PI / 2), steel, 0, 0.62, 0);
  put(body, new RoundedBoxGeometry(1.0, 0.56, 0.1, 3, 0.12), glass, 0, 1.4, 0.53);
  const chestTex = canvasTex(192, 96, () => {});
  put(body, new THREE.PlaneGeometry(0.88, 0.44), new THREE.MeshBasicMaterial({ map: chestTex, toneMapped: false, transparent: true }), 0, 1.4, 0.59, true).castShadow = false;
  const leds = [0xFF6B5E, 0xF7C64E, 0x7CF5B0].map((c, i) => put(body, new THREE.SphereGeometry(0.07, 10, 8), basic(c), -0.3 + i * 0.3, 0.9, 0.55, true));
  put(body, new THREE.CylinderGeometry(0.2, 0.24, 0.24, 14), steel, 0, 2.0, 0);
  // the jet it floats on
  const jet = put(body, new THREE.ConeGeometry(0.42, 0.6, 18).rotateX(Math.PI), new THREE.MeshBasicMaterial({ color: 0x6FE3FF, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false }), 0, 0.28, 0, true); jet.castShadow = false;
  // the head: a visor with its eyes (round, happy or crossed), two ears and the aerial
  head.position.set(0, 2.08, 0); head.userData.own = true; body.add(head);
  put(head, new RoundedBoxGeometry(1.5, 1.04, 1.08, 5, 0.36), white, 0, 0.56, 0);
  put(head, new RoundedBoxGeometry(1.16, 0.6, 0.16, 4, 0.2), glass, 0, 0.58, 0.5);
  for (const s of [-1, 1]) put(head, new THREE.CylinderGeometry(0.15, 0.15, 0.2, 14).rotateZ(Math.PI / 2), steel, s * 0.82, 0.56, 0);
  put(head, new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), steel, 0, 1.26, 0);
  const ant = put(head, new THREE.SphereGeometry(0.11, 14, 10), basic(0xF7C64E), 0, 1.5, 0, true);
  put(head, new THREE.BoxGeometry(0.34, 0.05, 0.04), glass, 0, 0.17, 0.53);
  const eyes = new THREE.Group(), eyesOk = new THREE.Group(), eyesErr = new THREE.Group();
  for (const G of [eyes, eyesOk, eyesErr]) { G.position.set(0, 0.6, 0.6); G.userData.keep = true; head.add(G); }
  const cyan = basic(0x6FE3FF), mint = basic(0x7CF5B0), red = basic(0xFF6B5E);
  for (const s of [-1, 1]) {
    put(eyes, new THREE.CircleGeometry(0.13, 20), cyan, s * 0.28, 0, 0).castShadow = false;
    put(eyesOk, new THREE.TorusGeometry(0.12, 0.035, 6, 16, Math.PI), mint, s * 0.28, -0.05, 0).castShadow = false;
    for (const a of [-1, 1]) { const x = put(eyesErr, new THREE.BoxGeometry(0.3, 0.06, 0.02), red, s * 0.28, 0, 0); x.rotation.z = a * Math.PI / 4; x.castShadow = false; }
  }
  // the arms, each hanging from its shoulder
  const arm = s => {
    const a = new THREE.Group(); a.position.set(s * 0.9, 1.68, 0); a.userData.own = true; body.add(a);
    put(a, new THREE.SphereGeometry(0.18, 12, 10), steel, 0, 0, 0);
    put(a, new THREE.CylinderGeometry(0.1, 0.1, 0.62, 10), steel, 0, -0.38, 0);
    put(a, new THREE.SphereGeometry(0.2, 14, 10), white, 0, -0.78, 0);
    for (const d of [-1, 1]) put(a, new THREE.BoxGeometry(0.07, 0.2, 0.1), white, d * 0.12, -0.98, 0);
    bake(a); return a;
  };
  const armL = arm(-1), armR = arm(1);
  bake(head); bake(body);
  const SIGN = { '': ['?', '#6FE3FF'], ok: ['✓', '#7CF5B0'], err: ['✗', '#FF6B5E'], zz: ['z z', '#4D7486'] };
  function face(mood, up) {
    eyes.visible = !mood || !up; eyesOk.visible = up && mood === 'ok'; eyesErr.visible = up && mood === 'err';
    const [txt, c] = SIGN[up ? mood : 'zz'] || SIGN[''], x = chestTex.image.getContext('2d');
    x.clearRect(0, 0, 192, 96); x.font = '800 78px "Baloo 2", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = c; x.shadowBlur = 14; x.fillStyle = c; x.fillText(txt, 96, 54);
    chestTex.needsUpdate = true;
  }
  // P: awake (0 to 1), hop (how high), lz and rz (the arms opened sideways), rx (the right arm forward), turn (the body round), shakeH (the head), t, blink
  function pose(P) {
    const a = P.awake, bob = Math.sin(P.t * 2) * 0.07 * a;
    body.position.y = -0.24 * (1 - a) + bob + P.hop; body.rotation.y = P.turn; body.rotation.z = Math.sin(P.t * 1.1) * 0.02 * a;
    head.rotation.x = 0.42 * (1 - a) + Math.sin(P.t * 0.9) * 0.03 * a; head.rotation.y = P.shakeH + Math.sin(P.t * 0.6) * 0.08 * a; head.rotation.z = 0.12 * (1 - a);
    armL.rotation.z = -P.lz - Math.sin(P.t * 2) * 0.04 * a; armR.rotation.z = P.rz + Math.sin(P.t * 2) * 0.04 * a; armR.rotation.x = -P.rx; armL.rotation.x = 0;
    eyes.scale.y = a < 0.5 ? 0.12 : P.blink ? 0.1 : 1; cyan.color.setHex(a < 0.5 ? 0x2F6F85 : 0x6FE3FF);
    jet.scale.set(a, Math.max(0.01, a * (0.85 + 0.15 * Math.sin(P.t * 23))), a); jet.visible = a > 0.05;
    ant.material.color.setHex(a < 0.5 ? 0x6B5A2A : 0xF7C64E);
    leds.forEach((l, i) => { l.material.opacity = 1; l.visible = a > 0.5 ? Math.sin(P.t * 5 + i * 2.1) > -0.4 : false; });
  }
  face('', true);
  return { g, body, head, ant, face, pose };
}

/* ---------- a little robot: what a validated project builds ---------- */
// about one unit tall, of the colour of its project, with something of its own on its head
function makeMini(i) {
  const g = new THREE.Group(), c = hsl(MINI_HUE[i], 0.72, 0.56), c2 = hsl(MINI_HUE[i], 0.65, 0.4);
  const body = std(c, { roughness: 0.4 }), dark = std(c2, { roughness: 0.5 }), white = std(0xEAF7FF, { roughness: 0.35 }), glass = std(0x06202B, { roughness: 0.15 });
  const put = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  put(new RoundedBoxGeometry(0.5, 0.46, 0.42, 3, 0.12), body, 0, 0.4, 0);
  put(new RoundedBoxGeometry(0.46, 0.36, 0.4, 3, 0.12), white, 0, 0.86, 0);
  put(new RoundedBoxGeometry(0.34, 0.18, 0.06, 2, 0.05), glass, 0, 0.87, 0.19);
  for (const s of [-1, 1]) {
    put(new THREE.BoxGeometry(0.16, 0.12, 0.26), dark, s * 0.14, 0.07, 0.02);
    put(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), dark, s * 0.31, 0.42, 0).rotation.z = s * 0.25;
    const e = put(new THREE.CircleGeometry(0.045, 12), new THREE.MeshBasicMaterial({ color: 0x6FE3FF, toneMapped: false }), s * 0.08, 0.88, 0.225); e.castShadow = false;
  }
  put(new THREE.CircleGeometry(0.1, 16), new THREE.MeshBasicMaterial({ color: 0xFFE08A, toneMapped: false }), 0, 0.42, 0.215).castShadow = false;
  if (i % 3 === 0) { put(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), dark, 0, 1.14, 0); put(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xF7C64E, toneMapped: false }), 0, 1.27, 0); }
  else if (i % 3 === 1) for (const s of [-1, 1]) put(new THREE.ConeGeometry(0.07, 0.2, 10), body, s * 0.15, 1.13, 0);
  else { put(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), dark, 0, 1.1, 0); put(new THREE.BoxGeometry(0.5, 0.03, 0.09), body, 0, 1.17, 0); }
  bake(g);
  return g;
}

/* ---------- the frog of the pond, in its commander's cap ---------- */
// about one unit tall, looking at +z; its body breathes (userData.body)
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4), cap: mat(0x1B3F52, { roughness: 0.5 }), gold: mat(0xF7C64E, { roughness: 0.4 }) };
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
  // the cap of a commander, with its band of gold and its star
  body.add(mesh(new THREE.SphereGeometry(0.3, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.75, 1).translate(0, 0.8, 0.0), k.cap));
  body.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.07, 20).translate(0, 0.81, 0.0), k.gold));
  body.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16, 1, false, -Math.PI / 2, Math.PI).translate(0, 0.79, 0.2), k.cap));
  body.add(part(CONE, k.gold, [0.07, 0.1, 0.07], [0, 1.05, 0]));
  bake(body);
  g.userData.body = body;
  return g;
}
// the soft light of a firefly
function softTex() {
  return canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
