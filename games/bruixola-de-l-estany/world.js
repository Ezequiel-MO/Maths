// La brúixola de l'estany in 3D, built on shared/diorama.js: an island floating in the dusk. In the middle, on a round square with a canal
// round it, the great compass with the six stages of a project on its dial; round the canal, one place for each stage, clockwise like
// the hours: the lighthouse of the questions, the tent of the plan, the tower of the magnifying glass, the workshop with its easel, the
// stage with its audience and the lookout with the star. Round the dial, a crystal for each project: it grows with the levels done and
// shines when the project is validated. A flag goes up for each exam passed, the last one on top of the lighthouse.
// Everything 3D is drawn here; main.js and proves.js say what is on show and hear the taps (onPick(kind, key)).
// Without WebGL island3d() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, easeOut, SPH, CONE, CYL, V } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';
import { ETAPES } from './contingut.js';

const TAU = Math.PI * 2, WY = -0.34, ISLE = 15, PLAZA = 4.9, CANAL = 6.6, RS = 10.4, RGEM = 4.45;
export const RING = [45, 200, 330, 280, 130];
const CIRC = [0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4];
const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);
const backOut = k => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
const at = e => { const a = e * TAU / 6; return [RS * Math.sin(a), -RS * Math.cos(a)]; };
const SPOT = ETAPES.map((_, e) => at(e));
const wob = a => 1 + 0.035 * Math.sin(3 * a + 0.4) + 0.025 * Math.sin(5 * a + 1.3) + 0.012 * Math.sin(11 * a);

export function island3d(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('brúixola 3D:', e); return none(); }
}
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, view: null, state() {}, scene: p, visit: p, home() {}, needle() {}, cheer() {}, oops() {}, celebrate() {}, bottle() {}, bottleAt() {}, bottleTo() {}, bottleMiss() {},
    crew() {}, crewHop() {}, mural() {}, crowd() {}, reward: p, flag: p, highlight() {}, where: () => null, onPick: null };
}

function build(canvas) {
  let D = null;
  const small = () => { const { w, h } = D ? D.size() : { w: innerWidth, h: innerHeight }; return Math.min(w, h) < 430; };
  const VIEWS = {
    map: { t: [0, 2.4, -1.5], dir: [0, 1.12, 1], get R() { return small() ? 15.0 : 16.4; } },
    mural: { t: [SPOT[3][0] + 1.0, 1.5, SPOT[3][1] + 0.1], dir: [-0.16, 0.2, 1], R: 1.75 },
    dial: { t: [0, 0.3, 0.5], dir: [0, 2.3, 1], R: 5.3 },
    riu: { t: [0, 0, 4.5], dir: [0, 1.0, 1], R: 5.8 }
  };
  const RV = [3.9, 3.5, 3.5, 3.5, 4.1, 3.3], TY = [2.2, 1.2, 1.7, 1.4, 1.3, 1.5];
  SPOT.forEach(([x, z], e) => { VIEWS['s' + e] = { t: [x, TY[e], z + 0.4], dir: [e === 1 || e === 2 ? -0.35 : e === 4 || e === 5 ? 0.35 : 0.12, 0.5, 1], R: RV[e] }; });
  D = diorama(canvas, { views: VIEWS, start: 'map', sunAt: [-16, 22, 14], shadow: { left: -18, right: 18, top: 18, bottom: -18 }, floor: -11, under: [0, -9, 0, 38, 38] });
  const { scene, glow, tween } = D;
  const fixed = new THREE.Group(); scene.add(fixed);
  const hits = [], HITM = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 });
  const hit = (geo, pos, kind, key, scale = 1) => { const m = new THREE.Mesh(geo, HITM); m.position.set(...pos); m.scale.setScalar(scale); m.userData.hit = { kind, key }; m.renderOrder = -1; scene.add(m); hits.push(m); return m; };

  /* ---------- the island ---------- */
  {
    const n = 96, s = new THREE.Shape();
    for (let i = 0; i < n; i++) { const a = i / n * TAU, r = ISLE * wob(a); i ? s.lineTo(r * Math.cos(a), r * Math.sin(a)) : s.moveTo(r * Math.cos(a), r * Math.sin(a)); }
    s.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, CANAL, 0, TAU, true); s.holes.push(hole);
    const top = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2).translate(0, -0.7, 0);
    scene.add(mesh(top, [std(0x6DBB6A, { roughness: 0.9 }), std(0x7A5233, { roughness: 0.95 })], { cast: false }));
    scene.add(mesh(new THREE.CylinderGeometry(PLAZA, PLAZA, 0.7, 64).translate(0, -0.35, 0), [std(0x7A5233), std(0xC9BFA8, { roughness: 0.85 }), std(0x7A5233)], { cast: false }));
    scene.add(mesh(new THREE.RingGeometry(PLAZA - 0.1, CANAL + 0.1, 72).rotateX(-Math.PI / 2).translate(0, -0.66, 0), std(0x2E4238, { roughness: 1 }), { cast: false }));
    const water = mesh(new THREE.RingGeometry(PLAZA - 0.05, CANAL + 0.05, 72).rotateX(-Math.PI / 2).translate(0, WY, 0), std(0x2B9CB8, { roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.86, envMapIntensity: 1.3, emissive: 0x0B3F52, emissiveIntensity: 0.4 }), { cast: false });
    water.renderOrder = 1; scene.add(water);
    // the rock under the island
    const pts = [[ISLE * 0.99, -0.7], [ISLE * 0.93, -1.8], [ISLE * 0.74, -3.4], [ISLE * 0.5, -5.2], [ISLE * 0.26, -7.0], [0.4, -8.6]].map(([x, y]) => new THREE.Vector2(x, y));
    const rock = new THREE.LatheGeometry(pts, 40), p = rock.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a = Math.atan2(z, x), k = wob(a) * (y < -1 ? 1 + 0.05 * Math.sin(a * 7 + y * 2) : 1); p.setXYZ(i, x * k, y, z * k); }
    rock.computeVertexNormals();
    scene.add(mesh(rock, std(0x6E5340, { roughness: 1, flatShading: true }), { cast: false }));
  }
  // the ring of stepping stones, a branch to each place, three bridges over the canal
  const stoneM = std(0xBDB39E, { roughness: 0.9, flatShading: true }), IC = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 44; i++) { const a = i / 44 * TAU, s = 0.3 + (i * 37 % 7) / 40; fixed.add(part(IC, stoneM, [s, 0.07, s * 0.8], [8.15 * Math.cos(a), 0.03, 8.15 * Math.sin(a)], [0, i, 0])); }
  SPOT.forEach(([x, z]) => { for (let k = 1; k < 3; k++) { const f = (8.15 + k * 0.62) / RS; fixed.add(part(IC, stoneM, [0.3, 0.07, 0.26], [x * f, 0.03, z * f], [0, k, 0])); } });
  const plank = std(0xB9793F, { roughness: 0.75 }), plank2 = std(0x8B5A3C, { roughness: 0.8 });
  for (const deg of [90, 210, 330]) {
    const a = deg / 360 * TAU, b = new THREE.Group(); b.position.set(5.75 * Math.sin(a), 0, -5.75 * Math.cos(a)); b.rotation.y = -a;
    for (let i = -4; i <= 4; i++) b.add(mesh(boxG(1.25, 0.07, 0.24, 0, 0.14 - i * i * 0.008, i * 0.27), plank));
    for (const sx of [-1, 1]) { for (const k of [-1, 0, 1]) b.add(mesh(boxG(0.07, 0.42, 0.07, sx * 0.6, 0.32, k * 1.0), plank2)); b.add(mesh(boxG(0.06, 0.05, 2.3, sx * 0.6, 0.52, 0), plank2)); }
    fixed.add(b);
  }
  // trees, bushes and flowers, away from the places
  {
    let u = 7; const rnd = () => { u = (u * 16807) % 2147483647; return u / 2147483647; };
    const trunk = std(0x7A5230), LEAF = [0x4E9F5B, 0x67B565, 0x3F8A4E, 0x5FAE6E], ball = new THREE.IcosahedronGeometry(1, 1);
    // nothing tall between a place and the camera, which looks at it from the front
    const free = (x, z, d) => SPOT.every(([a, b], e) => {
      if (Math.hypot(x - a, z - b) <= d) return false;
      const v = VIEWS['s' + e].dir, n = Math.hypot(v[0], v[2]), ux = v[0] / n, uz = v[2] / n, along = (x - a) * ux + (z - b) * uz, side = Math.abs((x - a) * uz - (z - b) * ux);
      return !(along > -0.5 && along < 11 && side < 3.3);
    });
    for (let i = 0, n = 0; i < 90 && n < 24; i++) {
      const a = rnd() * TAU, r = 9 + rnd() * 5.4, x = r * Math.cos(a), z = r * Math.sin(a), s = 0.65 + rnd() * 0.65;
      if (r > ISLE * wob(a) - 0.8 || !free(x, z, 3.3) || Math.abs(r - 8.15) < 0.8) continue;
      n++; fixed.add(mesh(new THREE.CylinderGeometry(0.11 * s, 0.17 * s, 1.3 * s, 7).translate(x, 0.65 * s, z), trunk));
      for (let k = 0; k < 3; k++) fixed.add(part(ball, std(LEAF[(i + k) % 4], { flatShading: true, roughness: 0.8 }), [0.75 * s, 0.7 * s, 0.75 * s], [x + (k - 1) * 0.42 * s, (1.6 + (k % 2) * 0.35) * s, z + (k === 1 ? 0.2 : -0.1) * s]));
    }
    for (let i = 0; i < 70; i++) {
      const a = rnd() * TAU, r = 7 + rnd() * 7.6, x = r * Math.cos(a), z = r * Math.sin(a);
      if (r > ISLE * wob(a) - 0.3 || !free(x, z, 2.4)) continue;
      if (i % 3 === 0) { const s = 0.25 + rnd() * 0.3; fixed.add(part(ball, std(0x4F9C58, { flatShading: true }), [s, s * 0.75, s], [x, s * 0.45, z])); } else fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.07, 0.06, 0.07], [x, 0.07, z]));
    }
  }

  /* ---------- the great compass ---------- */
  const gold = std(0xE9B949, { metalness: 0.75, roughness: 0.28 }), goldD = std(0xA87528, { metalness: 0.6, roughness: 0.4 });
  fixed.add(mesh(new THREE.CylinderGeometry(3.95, 4.15, 0.34, 64).translate(0, 0.17, 0), goldD));
  scene.add(mesh(new THREE.TorusGeometry(3.82, 0.13, 12, 72).rotateX(Math.PI / 2).translate(0, 0.38, 0), gold, { cast: false }));
  const dialT = canvasTex(1024, 1024, (g, w) => {
    const c = w / 2, R = c - 4;
    ETAPES.forEach((E, e) => {
      const a0 = -Math.PI / 2 - Math.PI / 6 + e * Math.PI / 3;
      g.beginPath(); g.moveTo(c, c); g.arc(c, c, R, a0, a0 + Math.PI / 3); g.closePath();
      const gr = g.createRadialGradient(c, c, 40, c, c, R); gr.addColorStop(0, 'hsl(' + E.hue + ' 45% 26%)'); gr.addColorStop(1, 'hsl(' + E.hue + ' 62% 46%)'); g.fillStyle = gr; g.fill();
      g.lineWidth = 6; g.strokeStyle = 'rgba(255,240,200,0.7)'; g.stroke();
      const m = a0 + Math.PI / 6, X = c + Math.cos(m) * R * 0.72, Y = c + Math.sin(m) * R * 0.72;
      g.font = '112px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(E.icona, X, Y - 14);
      g.font = '800 46px "Baloo 2", system-ui, sans-serif'; g.fillStyle = '#FFF8E6'; g.fillText((e + 1) + '. ' + E.curt, X, Y + 74);
    });
    g.beginPath(); g.arc(c, c, 118, 0, TAU); g.fillStyle = '#1F3A3A'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#E9B949'; g.stroke();
  });
  scene.add(mesh(new THREE.CircleGeometry(3.74, 64).rotateX(-Math.PI / 2).translate(0, 0.352, 0), std(0xffffff, { map: dialT, roughness: 0.5, metalness: 0.05 }), { cast: false }));
  // the needle
  const needle = new THREE.Group(); needle.position.y = 0.5; scene.add(needle);
  {
    const blade = (len, c, dir) => { const s = new THREE.Shape(); s.moveTo(-0.3, 0); s.lineTo(0, -len); s.lineTo(0.3, 0); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }).rotateX(Math.PI / 2).translate(0, 0.05, 0); if (dir < 0) g.rotateY(Math.PI); return mesh(g, std(c, { metalness: 0.35, roughness: 0.35 })); };
    needle.add(blade(3.05, 0xE23B4E, 1), blade(2.2, 0xE9F3F2, -1));
    needle.add(mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.26, 24).translate(0, 0.1, 0), gold));
    needle.add(part(SPH, gold, [0.19, 0.19, 0.19], [0, 0.28, 0]));
  }
  let needleA = 0;
  function needleTo(e, spin = true) {
    let to = -e * TAU / 6; while (to - needleA > Math.PI) to -= TAU; while (to - needleA < -Math.PI) to += TAU;
    if (spin && !RM) to -= 0;
    const from = needleA; needleA = to;
    tween(850, k => { needle.rotation.y = from + (to - from) * k; }, x => 1 - Math.exp(-5.5 * x) * Math.cos(11 * x));
  }

  /* ---------- the crystals of the projects ---------- */
  const GEM = new THREE.OctahedronGeometry(0.34, 0), gems = Array.from({ length: 12 }, (_, i) => {
    const a = (i + 0.5) / 12 * TAU, x = RGEM * Math.sin(a), z = -RGEM * Math.cos(a), h = RING[CIRC[i]];
    fixed.add(mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.34, 10).translate(x, 0.17, z), goldD));
    const off = std(0x6F7F86, { roughness: 0.5, flatShading: true }), on = std(hsl(h, 0.8, 0.55), { roughness: 0.2, metalness: 0.1, flatShading: true, emissive: hsl(h, 0.85, 0.45), emissiveIntensity: 0.35 }), lit = std(hsl(h, 0.9, 0.62), { roughness: 0.15, flatShading: true, emissive: hsl(h, 0.95, 0.55), emissiveIntensity: 1.2 });
    const m = mesh(GEM, off, { at: [x, 0.72, z] }); m.userData.keep = true; scene.add(m);
    const g = glow(x, 0.75, z, 1.7, hsl(h, 0.9, 0.65), false);
    hit(new THREE.SphereGeometry(0.62, 10, 8), [x, 0.6, z], 'proj', i);
    return { m, g, off, on, lit, x, z, base: 0.5, phase: i * 0.7, state: 'shut' };
  });
  let gemNext = -1, gemHi = -1;

  /* ---------- the six places ---------- */
  const place = e => { const g = new THREE.Group(); g.position.set(SPOT[e][0], 0, SPOT[e][1]); fixed.add(g); return g; };
  const live = o => { o.traverse?.(x => { x.userData.keep = true; }); o.userData.keep = true; return o; };
  // 0: the lighthouse, with its turning beam
  const beam = new THREE.Group();
  {
    const g = place(0), wh = std(0xF5EFE2), red = std(0xD9474F), dark = std(0x35404A);
    g.add(mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.4, 16).translate(0, 0.2, 0), std(0x9A9286, { flatShading: true })));
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.CylinderGeometry(0.98 - i * 0.11, 1.09 - i * 0.11, 0.84, 18).translate(0, 0.82 + i * 0.84, 0), i % 2 ? red : wh));
    g.add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 18).translate(0, 4.65, 0), dark));
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.62, 12).translate(0, 5.0, 0), std(0xFFF2B8, { emissive: 0xFFD36B, emissiveIntensity: 1.3 })));
    g.add(mesh(new THREE.ConeGeometry(0.6, 0.5, 12).translate(0, 5.56, 0), red));
    g.add(mesh(boxG(0.44, 0.7, 0.06, 0, 0.72, 1.08), std(0x6B3E1C)));
    beam.position.set(SPOT[0][0], 5.0, SPOT[0][1]); scene.add(beam);
    const fade = canvasTex(8, 128, (c, w, h) => { const l = c.createLinearGradient(0, 0, 0, h); l.addColorStop(0, 'rgba(255,240,190,0.55)'); l.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = l; c.fillRect(0, 0, w, h); });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.05, 7, 18, 1, true).translate(0, -3.5, 0).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ map: fade, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }));
    beam.add(cone); glow(SPOT[0][0], 5.0, SPOT[0][1] + 0.1, 2.6, 0xFFE9A8, true);
  }
  // 1: the tent of the plan, with its table, its map and the crew
  const crewS = [];
  {
    const g = place(1), tela = std(0xF28C38, { flatShading: true, roughness: 0.8 }), tela2 = std(0xD9702A, { flatShading: true });
    g.add(mesh(new THREE.ConeGeometry(2.0, 2.5, 4).rotateY(Math.PI / 4).translate(-0.3, 1.25, -1.0), tela));
    g.add(mesh(new THREE.ConeGeometry(0.72, 1.7, 3).rotateY(Math.PI).translate(-0.3, 0.85, 0.4), std(0x4A2C18)));
    g.add(mesh(boxG(0.06, 3.0, 0.06, -0.3, 1.5, -1.0), plank2)); g.add(mesh(boxG(0.03, 0.03, 2.6, -0.3, 2.45, 0.1), tela2));
    const mapT = canvasTex(256, 180, (c, w, h) => { c.fillStyle = '#F2E2B8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#A87528'; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, h - 12); c.setLineDash([10, 8]); c.strokeStyle = '#D2283F'; c.beginPath(); c.moveTo(30, 150); c.bezierCurveTo(90, 40, 150, 170, 225, 40); c.stroke(); c.setLineDash([]); c.fillStyle = '#2E8B8B'; c.beginPath(); c.ellipse(70, 60, 34, 22, 0, 0, 7); c.fill(); c.font = '800 44px sans-serif'; c.fillStyle = '#D2283F'; c.fillText('X', 208, 58); });
    g.add(mesh(boxG(2.0, 0.09, 1.25, 0.6, 0.78, 1.3), plank));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(boxG(0.09, 0.74, 0.09, 0.6 + sx * 0.88, 0.37, 1.3 + sz * 0.5), plank2));
    const mp = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.02).rotateX(-Math.PI / 2).translate(0.6, 0.83, 1.3), std(0xffffff, { map: mapT, roughness: 0.8 })); mp.receiveShadow = true; g.add(mp);
    ['🐢', '🐿️', '🐰', '🦊'].forEach((t, i) => { const s = label(t, { h: 0.82, font: '110px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }); const px = SPOT[1][0] + [-0.75, 0.05, 0.85, 1.65][i], pz = SPOT[1][1] + (i % 2 ? 2.3 : 2.45); s.position.set(px, 0.62, pz); scene.add(s); crewS.push({ s, y: 0.62, hop: 0, phase: i * 1.3 }); });
  }
  // 2: the tower of the magnifying glass
  const lens = new THREE.Group();
  {
    const g = place(2), st = std(0xA9B3C4, { flatShading: true, roughness: 0.85 }), dome = std(0x5B4BB7, { roughness: 0.4, metalness: 0.2 });
    g.add(mesh(new THREE.CylinderGeometry(1.25, 1.5, 2.4, 10).translate(-0.3, 1.2, -0.5), st));
    g.add(mesh(new THREE.SphereGeometry(1.25, 18, 10, 0, TAU, 0, Math.PI / 2).translate(-0.3, 2.4, -0.5), dome));
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.17, 1.5, 10).rotateZ(-0.9).translate(0.45, 3.1, -0.4), gold));
    g.add(mesh(boxG(0.5, 0.86, 0.06, -0.3, 0.45, 0.88), std(0x4A2C18)));
    for (const [wx, wy] of [[-0.85, 1.55], [0.2, 1.55]]) g.add(mesh(boxG(0.3, 0.4, 0.05, wx, wy, 0.72), std(0xFFE9A8, { emissive: 0xFFC85A, emissiveIntensity: 0.9 })));
    [[0xD9474F, 0], [0x3F8FD2, 0.17], [0xF2B441, 0.34], [0x52B36B, 0.51]].forEach(([c, y], i) => g.add(mesh(boxG(1.05 - i * 0.08, 0.16, 0.72, 1.4, 0.08 + y, 1.1).rotateY(0.04 * i), std(c))));
    lens.position.set(SPOT[2][0] + 1.4, 1.75, SPOT[2][1] + 1.1); scene.add(lens);
    lens.add(mesh(new THREE.TorusGeometry(0.52, 0.075, 10, 30), gold));
    lens.add(new THREE.Mesh(new THREE.CircleGeometry(0.5, 30), new THREE.MeshStandardMaterial({ color: 0xBFEFFF, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide })));
    lens.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 8).translate(0, -0.92, 0), std(0x6B3E1C)));
  }
  // 3: the workshop: the roof, the bench, a gear that turns and the easel with the mural
  const gear = new THREE.Group(), hammer = new THREE.Group();
  let muralTex, muralState = null;
  const paintMural = () => {
    const c = muralTex.image, g = c.getContext('2d'), w = c.width, h = c.height, m = muralState;
    g.fillStyle = '#FFF8E6'; g.fillRect(0, 0, w, h); g.strokeStyle = m ? 'hsl(' + m.hue + ' 55% 42%)' : '#C9B58E'; g.lineWidth = 14; g.strokeRect(8, 8, w - 16, h - 16);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (!m) { g.fillStyle = '#C9B58E'; g.font = '800 44px "Baloo 2", sans-serif'; g.fillText('El nostre mural', w / 2, h / 2); muralTex.needsUpdate = true; return; }
    const fit = (txt, max, size, weight = 800) => { let s = size; do { g.font = weight + ' ' + s + 'px "Baloo 2", system-ui, sans-serif'; s -= 2; } while (g.measureText(txt).width > max && s > 16); };
    g.fillStyle = 'hsl(' + m.hue + ' 55% 30%)';
    if (m.titol) { fit(m.titol, w - 60, 52); g.fillText(m.titol, w / 2, 62); } else { g.setLineDash([10, 8]); g.lineWidth = 3; g.strokeStyle = '#C9B58E'; g.strokeRect(40, 30, w - 80, 66); g.setLineDash([]); }
    if (m.pic) { g.font = '150px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; g.fillStyle = '#000'; g.fillText(m.pic, w / 2, 212); } else { g.setLineDash([10, 8]); g.lineWidth = 3; g.strokeStyle = '#C9B58E'; g.strokeRect(w / 2 - 90, 122, 180, 180); g.setLineDash([]); }
    const wrap = (t, max) => { const out = []; let l = ''; g.font = '700 25px "Nunito", system-ui, sans-serif'; for (const word of t.split(' ')) { const x = l ? l + ' ' + word : word; if (g.measureText(x).width > max && l) { out.push(l); l = word; } else l = x; } if (l) out.push(l); return out; };
    let y = 334;
    for (let i = 0; i < 3; i++) {
      const t = m.dades?.[i];
      if (t) { g.fillStyle = 'hsl(' + m.hue + ' 60% 90%)'; const ls = wrap(t, w - 90); g.fillRect(30, y - 6, w - 60, ls.length * 28 + 12); g.fillStyle = '#2B2118'; g.textAlign = 'left'; g.font = '700 25px "Nunito", system-ui, sans-serif'; ls.forEach((l, j) => g.fillText(l, 44, y + 14 + j * 28)); g.textAlign = 'center'; y += ls.length * 28 + 22; } else { g.setLineDash([8, 7]); g.lineWidth = 3; g.strokeStyle = '#C9B58E'; g.strokeRect(30, y, w - 60, 42); g.setLineDash([]); y += 56; }
    }
    muralTex.needsUpdate = true;
  };
  {
    const g = place(3);
    for (const [x, z] of [[-2, -1], [2, -1], [-2, 1], [2, 1]]) g.add(mesh(boxG(0.14, 2.3, 0.14, x, 1.15, z), plank2));
    g.add(mesh(new THREE.ConeGeometry(3.1, 1.05, 4).rotateY(Math.PI / 4).scale(1, 1, 0.68).translate(0, 2.8, 0), std(0xB23A48, { flatShading: true })));
    g.add(mesh(boxG(2.3, 0.1, 0.8, -0.85, 0.85, -0.45), plank));
    for (const sx of [-1, 1]) g.add(mesh(boxG(0.09, 0.82, 0.7, -0.85 + sx * 1.05, 0.41, -0.45), plank2));
    g.add(mesh(boxG(0.5, 0.26, 0.4, -1.45, 1.03, -0.5), std(0xD9A441)), mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12).translate(-0.7, 1.05, -0.45), std(0x3F8FD2)), mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 12).translate(-0.4, 1.02, -0.3), std(0xE85D75)));
    muralTex = canvasTex(512, 640, () => {});
    const easel = new THREE.Group(); easel.position.set(1.0, 0, 0.1); easel.rotation.y = -0.16; g.add(easel);
    for (const [x, r] of [[-0.72, -0.09], [0.72, 0.09]]) { const leg = mesh(boxG(0.08, 2.4, 0.08, 0, 1.2, 0), plank2); leg.position.x = x; leg.rotation.z = r; easel.add(leg); }
    easel.add(mesh(boxG(1.6, 0.08, 0.2, 0, 0.62, 0.08), plank));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.76), std(0xffffff, { map: muralTex, roughness: 0.9 })); board.position.set(0, 1.55, 0.13); board.userData.keep = true; easel.add(board);
    gear.position.set(SPOT[3][0] - 1.95, 1.72, SPOT[3][1] - 1.0); scene.add(gear);
    const gs = new THREE.Shape(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 0.46 : 0.6; i ? gs.lineTo(r * Math.cos(a), r * Math.sin(a)) : gs.moveTo(r * Math.cos(a), r * Math.sin(a)); } gs.closePath();
    const gh = new THREE.Path(); gh.absarc(0, 0, 0.16, 0, TAU, true); gs.holes.push(gh);
    gear.add(mesh(new THREE.ExtrudeGeometry(gs, { depth: 0.1, bevelEnabled: false, curveSegments: 12 }), std(0x9FB2BF, { metalness: 0.7, roughness: 0.35 })));
    hammer.position.set(SPOT[3][0] - 0.3, 1.0, SPOT[3][1] - 0.35); scene.add(hammer);
    hammer.add(mesh(boxG(0.07, 0.62, 0.07, 0, 0.3, 0), plank2), mesh(boxG(0.32, 0.16, 0.16, 0, 0.62, 0), std(0x6F7F86, { metalness: 0.6, roughness: 0.4 })));
  }
  paintMural();
  // 4: the stage with its curtains, its spotlight and the audience
  const crowd = [], spot = new THREE.Group();
  {
    const g = place(4), red = std(0xC32F45, { roughness: 0.65 }), redD = std(0x8E1F33, { roughness: 0.7 });
    g.add(mesh(boxG(4.6, 0.5, 2.4, 0, 0.25, -0.8), plank), mesh(boxG(4.7, 0.08, 2.5, 0, 0.53, -0.8), plank2));
    g.add(mesh(boxG(4.6, 3.1, 0.1, 0, 2.05, -2.0), std(0x2A2238)));
    for (const sx of [-1, 1]) { for (let i = 0; i < 4; i++) g.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 3.0, 8).translate(sx * (2.15 - i * 0.3), 2.05, -1.75 + i * 0.03), i % 2 ? red : redD)); }
    g.add(mesh(boxG(4.9, 0.5, 0.3, 0, 3.72, -1.7), red), mesh(boxG(4.9, 0.08, 0.34, 0, 3.46, -1.68), gold));
    const lectern = mesh(boxG(0.62, 0.86, 0.42, 0.9, 0.98, -0.5), std(0x8B5A3C)); g.add(lectern);
    spot.position.set(SPOT[4][0], 3.3, SPOT[4][1] - 1.5); scene.add(spot);
    spot.add(new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.8, 20, 1, true).translate(0, -1.4, 0).rotateX(-0.4), new THREE.MeshBasicMaterial({ color: 0xFFF2C8, transparent: true, opacity: 0.17, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })));
    const COL = [0x5DBB63, 0x6FC7D9, 0xE8A04B, 0xD978B0, 0x8D7BE0, 0xE3D05A, 0x62C49A, 0xE57B6E];
    for (let i = 0; i < 8; i++) {
      const row = i < 4 ? 0 : 1, x = (i % 4 - 1.5) * 1.02 + (row ? 0.3 : 0), z = 1.55 + row * 0.82, b = new THREE.Group();
      b.position.set(SPOT[4][0] + x, 0.02 + row * 0.08, SPOT[4][1] + z); b.rotation.y = Math.PI;
      const m = mat(COL[i]);
      b.add(part(SPH, m, [0.3, 0.24, 0.28], [0, 0.25, 0]));
      for (const s of [-1, 1]) { b.add(part(SPH, m, [0.1, 0.1, 0.1], [s * 0.13, 0.46, -0.05])); }
      scene.add(b); crowd.push({ b, y: b.position.y, ph: i * 0.9 });
    }
  }
  // 5: the lookout with the star
  const star = new THREE.Group();
  {
    const g = place(5);
    g.add(mesh(new THREE.SphereGeometry(2.1, 18, 10, 0, TAU, 0, Math.PI / 2).scale(1, 0.46, 1), std(0x7CC476, { flatShading: true, roughness: 0.9 })));
    g.add(mesh(new THREE.CylinderGeometry(0.52, 0.72, 0.8, 8).translate(0, 1.32, 0), std(0xA9B3C4, { flatShading: true })));
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; g.add(mesh(boxG(0.07, 0.5, 0.07, 1.25 * Math.cos(a), 0.92, 1.25 * Math.sin(a)), plank2)); }
    g.add(mesh(new THREE.TorusGeometry(1.25, 0.04, 6, 36).rotateX(Math.PI / 2).translate(0, 1.16, 0), plank2));
    g.add(mesh(boxG(1.1, 0.08, 0.34, 1.3, 0.42, 1.2).rotateY(-0.3), plank));
    star.position.set(SPOT[5][0], 2.55, SPOT[5][1]); scene.add(star);
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + Math.PI / 2, r = i % 2 ? 0.26 : 0.62; i ? s.lineTo(r * Math.cos(a), r * Math.sin(a)) : s.moveTo(r * Math.cos(a), r * Math.sin(a)); } s.closePath();
    star.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }).translate(0, 0, -0.07), std(0xFFD54F, { metalness: 0.65, roughness: 0.25, emissive: 0xFFB300, emissiveIntensity: 0.5 })));
    glow(SPOT[5][0], 2.55, SPOT[5][1], 3, 0xFFE08A, true).material.opacity = 0.7;
  }
  // the place to tap, the floating sign of each stage
  const icons = ETAPES.map((E, e) => { hit(new THREE.SphereGeometry(2.5, 10, 8), [SPOT[e][0], 1.5, SPOT[e][1]], 'stage', e); return null; });
  const signs = [];
  let signsOn = true;
  const farSigns = on => { signsOn = on; for (const s of signs) s.visible = on; };
  const makeSigns = () => { for (const x of signs.splice(0)) { x.parent?.remove(x); x.userData.dispose?.(); } const TOP = [7.7, 3.5, 4.3, 4.1, 4.7, 3.9]; ETAPES.forEach((E, e) => { const s = label((e + 1) + '. ' + E.nom, { bg: 'hsl(' + E.hue + ' 55% 30%)', ring: 'hsl(' + E.hue + ' 75% 70%)', h: 0.7 }); s.position.set(SPOT[e][0], TOP[e], SPOT[e][1]); s.visible = signsOn; scene.add(s); signs.push(s); }); D.wake(); };
  makeSigns();
  document.fonts?.load?.('800 120px "Baloo 2"').then(() => { makeSigns(); paintMural(); }, () => {});

  // the flags of the exams: four on the shore, the last one on top of the lighthouse
  const FLAGS = [[-60, 13], [-36, 13], [36, 13], [60, 13]].map(([d, r]) => { const a = d / 360 * TAU; return [r * Math.sin(a), 0, -r * Math.cos(a)]; });
  FLAGS.push([SPOT[0][0], 5.78, SPOT[0][1]]);
  const flags = FLAGS.map(([x, y, z], c) => {
    const H = c === 4 ? 1.5 : 3; fixed.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, H, 7).translate(x, y + H / 2, z), plank2));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.56, 8, 2).translate(0.5, 0, 0), std(hsl(RING[c], 0.8, 0.55), { side: THREE.DoubleSide, roughness: 0.7, emissive: hsl(RING[c], 0.7, 0.3), emissiveIntensity: 0.35 }));
    m.position.set(x, y + 0.42, z); m.visible = false; scene.add(m);
    return { m, up: y + H - 0.3, low: y + 0.42, base: m.geometry.attributes.position.array.slice() };
  });

  // moon and fireflies
  scene.add(mesh(new THREE.SphereGeometry(1.9, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-20, 15, -32] }));
  glow(-20, 15, -32, 10, 0xFFE9B8, true).material.opacity = 0.55;
  const NFL = RM ? 0 : 26, flies = Array.from({ length: NFL }, () => ({ p: Math.random() * 7, a: Math.random() * TAU, r: 6 + Math.random() * 8, y: 0.6 + Math.random() * 2.2 })), flyPos = new Float32Array(NFL * 3), flyG = new THREE.BufferGeometry();
  flyG.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyT = canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const flyP = new THREE.Points(flyG, new THREE.PointsMaterial({ map: flyT, size: 0.42, color: 0xE8FF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); flyP.frustumCulled = false; if (NFL) scene.add(flyP);

  bake(fixed);

  /* ---------- the frog, with its explorer's hat ---------- */
  const frog = makeFrog(); frog.scale.setScalar(0.82); scene.add(frog);
  const HOME = [0.9, 0.05, 4.3];
  frog.position.set(...HOME);
  let hop = null, frogDo = null;
  function frogTo(x, y, z, dur = 620) {
    if (hop) { const r = hop.res; hop = null; r(); }
    const from = frog.position.clone(), d = Math.hypot(x - from.x, z - from.z);
    if (RM || d < 0.01) { frog.position.set(x, y, z); return Promise.resolve(); }
    frog.rotation.y = Math.atan2(x - from.x, z - from.z);
    const T = Math.min(1500, dur + d * 45), H = Math.min(3.2, 0.5 + d * 0.22);
    return new Promise(res => { hop = { from, to: V(x, y, z), T, H, t0: performance.now(), res }; D.wake(); });
  }
  const frogSpot = e => { const [x, z] = SPOT[e], o = [[1.55, 1.75], [-1.2, 1.9], [0.75, 1.65], [-0.9, 1.5], [-0.45, -0.5], [0.3, 1.0]][e]; return [x + o[0], e === 4 ? 0.57 : e === 5 ? 0.62 : 0.03, z + o[1]]; };

  /* ---------- the bottle of the river ---------- */
  const bottle = new THREE.Group(); bottle.visible = false; scene.add(bottle);
  {
    const glass = new THREE.MeshStandardMaterial({ color: 0x9FE6C8, transparent: true, opacity: 0.55, roughness: 0.08, metalness: 0.1 });
    bottle.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 6, 14).rotateZ(Math.PI / 2), glass));
    bottle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 0.28, 12).rotateZ(-Math.PI / 2).translate(0.58, 0, 0), glass));
    bottle.add(mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.14, 10).rotateZ(-Math.PI / 2).translate(0.77, 0, 0), std(0xB98A55)));
    bottle.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.46, 10).rotateZ(Math.PI / 2), std(0xFFF3D0)));
  }
  let bottleK = -1, bottleBusy = false;
  const bottleXZ = k => { const a = 1.25 - 2.5 * k, r = (PLAZA + CANAL) / 2; return [r * Math.sin(a), r * Math.cos(a), a]; };

  /* ---------- what moves ---------- */
  let crowdMode = 'idle', crowdT = 0, crowdA = 0;
  D.every((dt, now) => {
    let busy = false;
    const t = now / 1000;
    if (!RM) {
      beam.rotation.y = t * 0.75; gear.rotation.z = t * 0.8; hammer.rotation.z = Math.max(0, Math.sin(t * 2.6)) * 0.9 - 0.2;
      lens.position.y = 1.75 + Math.sin(t * 1.2) * 0.14; lens.rotation.y = Math.sin(t * 0.7) * 0.6;
      star.rotation.y = t * 0.9; star.position.y = 2.55 + Math.sin(t * 1.5) * 0.09; spot.rotation.y = Math.sin(t * 0.8) * 0.3;
      for (const G of gems) { if (G.state === 'shut') continue; G.m.rotation.y = t * 0.9 + G.phase; const hi = G === gems[gemHi] || G === gems[gemNext]; G.m.position.y = 0.72 + Math.sin(t * 1.6 + G.phase) * 0.05; const p = hi ? 1 + Math.sin(t * 4) * 0.12 : 1; G.m.scale.setScalar(G.base * p * (G === gems[gemHi] ? 1.25 : 1)); }
      for (const c of crewS) { c.hop = Math.max(0, c.hop - dt * 1.8); c.s.position.y = c.y + Math.sin(t * 1.4 + c.phase) * 0.03 + Math.sin(c.hop * Math.PI) * 0.55; if (c.hop > 0) busy = true; }
      for (const f of flags) if (f.m.visible) { const p = f.m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = f.base[i * 3]; p.setZ(i, Math.sin(x * 5 - t * 5) * 0.08 * x); } p.needsUpdate = true; }
      for (let i = 0; i < NFL; i++) { const f = flies[i], a = f.a + t * 0.06 + Math.sin(t * 0.3 + f.p); flyPos[i * 3] = f.r * Math.cos(a); flyPos[i * 3 + 1] = f.y + Math.sin(t + f.p) * 0.3; flyPos[i * 3 + 2] = f.r * Math.sin(a); } flyG.attributes.position.needsUpdate = true;
      const B = frog.userData.body; B.scale.y = 1 + Math.sin(t * 2.2) * 0.025;
    }
    if (crowdT > 0) { crowdT -= dt; busy = true; }
    const amp = crowdT > 0 ? crowdA : 0;
    for (const c of crowd) {
      if (crowdMode === 'yawn' && crowdT > 0) { c.b.rotation.z = Math.sin(t * 2 + c.ph) * 0.14; c.b.position.y = c.y; } else { c.b.rotation.z = 0; c.b.position.y = c.y + Math.abs(Math.sin(t * 9 + c.ph)) * amp; }
    }
    if (hop) {
      busy = true; const k = Math.min(1, (now - hop.t0) / hop.T), e = k * (2 - k);
      frog.position.lerpVectors(hop.from, hop.to, e); frog.position.y += Math.sin(k * Math.PI) * hop.H;
      if (k >= 1) { const r = hop.res; hop = null; frog.rotation.y = 0; r(); }
    }
    if (frogDo) {
      busy = true; frogDo.t += dt; const B = frog.userData.body, x = frogDo.t;
      if (frogDo.ok) { B.position.y = Math.abs(Math.sin(x * 8)) * 0.3 * Math.max(0, 1 - x / 0.8); B.rotation.y = x * 8; } else { B.rotation.z = Math.sin(x * 22) * 0.18 * Math.max(0, 1 - x / 0.5); }
      if (x > (frogDo.ok ? 0.8 : 0.5)) { B.position.y = 0; B.rotation.set(0, 0, 0); frogDo = null; }
    }
    if (bottle.visible && bottleK >= 0 && !bottleBusy) { const [x, z, a] = bottleXZ(bottleK); bottle.position.set(x, WY + 0.06 + Math.sin(t * 2.4) * 0.035, z); bottle.rotation.set(Math.sin(t * 1.8) * 0.12, a + Math.PI / 2, Math.sin(t * 1.3) * 0.08); busy = true; }
    return busy;
  });

  /* ---------- the taps ---------- */
  const isSmallTap = { x: 0, y: 0, t: 0 };
  canvas.addEventListener('pointerdown', e => { isSmallTap.x = e.clientX; isSmallTap.y = e.clientY; isSmallTap.t = performance.now(); });
  canvas.addEventListener('click', e => {
    if (!api.onPick || Math.hypot(e.clientX - isSmallTap.x, e.clientY - isSmallTap.y) > 12) return;
    const got = D.pick(e.clientX, e.clientY, hits)[0]; if (got) api.onPick(got.object.userData.hit.kind, got.object.userData.hit.key);
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const got = api.onPick ? D.pick(e.clientX, e.clientY, hits)[0] : null, h = got?.object.userData.hit;
    canvas.style.cursor = h ? 'pointer' : '';
    const g = h?.kind === 'proj' ? h.key : -1; if (g !== gemHi) { gemHi = g; D.wake(); }
  });

  /* ---------- what main.js calls ---------- */
  const api = {
    ok: true, onPick: null, layout: (k, x) => D.layout(k, x), go: (v, o) => { farSigns(v === 'map'); if (v === 'map') bottle.visible = false; return D.go(v, o); }, get view() { return D.view; },
    state({ lv, valid, open, exams, next }) {
      gemNext = next ?? -1;
      gems.forEach((G, i) => {
        const n = lv.slice(i * 10, i * 10 + 10).filter(Boolean).length, ok = valid.includes(i), isOpen = open[i];
        G.state = !isOpen ? 'shut' : ok ? 'lit' : 'open'; G.m.material = ok ? G.lit : isOpen && n ? G.on : G.off;
        G.base = isOpen ? 0.62 + 0.62 * n / 10 + (ok ? 0.14 : 0) : 0.5; G.m.scale.setScalar(G.base); G.g.material.opacity = ok ? 0.85 : 0;
      });
      flags.forEach((f, c) => { const on = exams[c] === true; f.m.visible = on; f.m.position.y = on ? f.up : f.low; });
      canvas.dataset.gems = String(valid.length); canvas.dataset.flags = String(exams.filter(Boolean).length); D.wake();
    },
    // the place an item is played at: 'dial', 'riu' or a stage
    scene(st, o = {}) {
      farSigns(false); if (st !== 'riu') bottle.visible = false;
      if (st === 'dial') { frogTo(...HOME); return D.go('dial', { dur: o.dur || 1000 }); }
      if (st === 'riu') { frogTo(0.2, 0.05, 4.32); return D.go('riu', { dur: o.dur || 1000 }); }
      const e = +st; frogTo(...frogSpot(e)); return D.go(o.view || 's' + e, { dur: o.dur || 1200 });
    },
    visit(e, dur) { needleTo(e); return api.scene(e, { dur }); },
    home() { frogTo(...HOME); },
    needle: e => needleTo(e),
    cheer() { if (!RM) frogDo = { ok: true, t: 0 }; D.sparkle(frog.position.clone().add(V(0, 0.9, 0)), 10, 0xFFE08A, 0.42, 1.8); D.wake(); },
    oops() { if (!RM) frogDo = { ok: false, t: 0 }; D.wake(); },
    celebrate: n => D.celebrate(n),
    // the bottle: k from 0 (just in) to 1 (gone past)
    bottle() { bottleBusy = false; bottleK = 0; bottle.visible = true; bottle.scale.setScalar(1); D.wake(); },
    bottleAt(k) { bottleK = k; D.wake(); },
    bottleTo(e) {
      bottleBusy = true; needleTo(e);
      const from = bottle.position.clone(), [x, z] = SPOT[e], to = V(x, 2.2, z);
      tween(620, k => { bottle.position.lerpVectors(from, to, k); bottle.position.y += Math.sin(k * Math.PI) * 2.2; bottle.rotation.z += 0.3; bottle.scale.setScalar(1 - k * 0.55); }, x => x).then(() => { bottle.visible = false; D.sparkle(to, 12, hsl(ETAPES[e].hue, 0.85, 0.65).getHex(), 0.5, 2); });
    },
    bottleMiss() { bottleBusy = true; const y = bottle.position.y; tween(420, k => { bottle.position.y = y - k * 0.7; bottle.scale.setScalar(1 - k); }, x => x).then(() => { bottle.visible = false; }); },
    crew: () => {},
    crewHop(slot) { if (crewS[slot]) { crewS[slot].hop = 1; D.sparkle(crewS[slot].s.position.clone().add(V(0, 0.4, 0)), 6, 0xFFE08A, 0.32, 1.3); D.wake(); } },
    mural(m) { muralState = m; paintMural(); D.wake(); },
    // the audience: 'clap' (level 0 to 1) or 'yawn'
    crowd(mode, level = 0.5) { crowdMode = mode; crowdT = mode === 'yawn' ? 1.6 : 0.8 + level * 1.2; crowdA = 0.1 + level * 0.32; D.wake(); },
    highlight(i) { gemHi = i ?? -1; D.wake(); },
    // a level done: the camera goes to the map and the project's crystal grows
    async reward(i, { valid = false } = {}) {
      const G = gems[i]; if (!G) return;
      frogTo(...HOME); farSigns(true); await D.go('map', { dur: 900 });
      const b = G.m.scale.x;
      await tween(520, k => G.m.scale.setScalar(b * (1 + 0.5 * Math.sin(k * Math.PI))), x => x);
      D.sparkle(G.m.position.clone().add(V(0, 0.2, 0)), valid ? 26 : 12, hsl(RING[CIRC[i]], 0.9, 0.7).getHex(), 0.5, valid ? 3 : 2);
      if (valid) D.celebrate(2, G.m.position.clone().add(V(0, 0.6, 0)));
    },
    async flag(c) {
      const f = flags[c]; if (!f) return;
      farSigns(true); await D.go('map', { dur: 800 }); f.m.visible = true;
      await tween(1200, k => { f.m.position.y = f.low + (f.up - f.low) * easeOut(k); }, x => x);
      D.celebrate(3, f.m.position.clone());
    },
    // the point of the screen of something that can be tapped, for the browser tests
    where(kind, key) { const m = hits.find(x => x.userData.hit.kind === kind && x.userData.hit.key === key); return m ? D.onScreen(m.position) : null; },
    get frog() { return frog.position.toArray(); }, get needleAngle() { return needleA; }
  };
  return api;
}

/* ---------- the frog of the compass: an explorer's hat and a little compass on its chest ---------- */
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group(), k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4), hat: mat(0xC49A5A, { roughness: 0.7 }), band: mat(0x7A4E26), gold: mat(0xF7C64E, { metalness: 0.6, roughness: 0.3 }) };
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
  }
  body.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 6, 20, Math.PI * 0.7).rotateZ(Math.PI + Math.PI * 0.15).translate(0, 0.5, 0.41), mat(0x1F6030)));
  body.add(part(CYL, k.hat, [0.42, 0.03, 0.42], [0, 0.82, 0]));
  body.add(part(SPH, k.hat, [0.25, 0.2, 0.25], [0, 0.88, 0]));
  body.add(part(CYL, k.band, [0.255, 0.05, 0.255], [0, 0.88, 0]));
  body.add(part(CYL, k.gold, [0.1, 0.02, 0.1], [0, 0.3, 0.47], [Math.PI / 2, 0, 0]));
  body.add(part(CONE, mat(0xD2283F), [0.03, 0.12, 0.012], [0, 0.34, 0.49]));
  bake(body);
  g.userData.body = body;
  return g;
}
