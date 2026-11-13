// L'estany parla anglès in 3D, built on shared/diorama.js: a block of earth floating in the dusk with Ràdio Granota on it. At the back
// the wooden studio of the radio, with its sign and its ON AIR lamp, and the antenna, with a light for each exam passed; in front of
// them the frog of the radio on its stage, with headphones and a microphone, and the board where the picture of a question goes. The
// options with a picture float on lily pads in the pond and can be touched there too. Each project validated raises a hot-air balloon
// with its icon over the pond; until then it is a balloon of light.
// The frog is the one of the page, alive: it breathes, blinks, moves its mouth while the recording plays (and the waves of the antenna
// go out with it), leaps after a right answer, shakes its head after a wrong one and says what was learnt in a bubble. It sleeps until
// the Piscina wakes it.
// Everything 3D is drawn here and only here; main.js tells it what happens. Without WebGL studio() gives the same calls doing nothing.
import { THREE, diorama, hasGL, canvasTex, boxG, std, mesh, part, mat, bake, label, easeOut, SPH, CONE, V } from '../../shared/diorama.js';
import { RM } from '../../shared/util.js';
import { PROJECTS, CIRCLES } from './logic.js';

/* ---------- the measures of the world ---------- */
// One unit is about the height of the frog. The grass at 0; the block from YB up, x from X0 to X1 and z from Z0 (back) to Z1 (front)
const YB = -4.4, WY = -0.3, BY = -1.2, X0 = -11.5, X1 = 11.5, Z0 = -9.4, Z1 = 8.4;
// the pond: an ellipse round PC with radii PR, in front of the stage; the lily pads of the options float in it along PAD_Z
const PC = [0.2, 3.2], PR = [6.9, 3.2], PAD_Z = 3.0;
const wob = a => 1 + 0.04 * Math.sin(3 * a + 0.4) + 0.03 * Math.sin(5 * a + 1.3);
const POND = Array.from({ length: 64 }, (_, i) => { const a = i / 64 * Math.PI * 2, k = wob(a); return [PC[0] + PR[0] * Math.cos(a) * k, PC[1] + PR[1] * Math.sin(a) * k]; });
// the frog on its stage, the board of the pictures, the studio and the antenna
const FROG = [0.6, -1.1], EASEL = [-3.5, -0.6], HUT = { x: -0.8, z: -5.9, w: 6.0, d: 3.0, h: 2.8 }, TOWER = [8.2, -6.2], TH = 7.0;
// a balloon for each project, in an arc high over the studio: in view on the map, over the sign when the camera is on the stage
const BALLOON = i => [-7.6 + i * 1.85, 6.3 + [0, 0.6, 0.2, 0.7, 0.1, 0.6, 0.3, 0.8][i % 8], -7.0 - [0, 0.6, 0.3, 0.8, 0.4, 0.7, 0.2, 0.5][i % 8]];
// the colour of each balloon, and of the light of each circle on the antenna (the rings of the map)
const HUE = [45, 140, 28, 200, 262, 318, 12, 170];
export const RING = [45, 200, 320, 140];
const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, s, l);
const backOut = k => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

export function studio(canvas) {
  if (!hasGL()) return none();
  try { return build(canvas); } catch (e) { console.warn('ràdio 3D:', e); return none(); }
}
// the same calls, doing nothing
export function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, pause() {}, celebrate() {}, shake() {}, hear() {}, lamps() {}, rest() {},
    question() {}, mark() {}, talk() {}, bot() {}, wake() {}, say() {}, where: () => null, validate: p, beacon: p, onPick: null };
}

/* ---------- the pictures, painted on a canvas: the same ones as the page draws (art.js picHtml) ---------- */
const graphemes = s => typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(s)].map(x => x.segment) : [s];
// pic centred at (x, y) in a square of side s: an emoji (or a few), «~#hex» a colour, «=n» a number, { marks } pictures with ✓ or ✗,
// { a, b, rel } a thing in a place. False when it is none of them
function drawPic(g, pic, x, y, s) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (pic && typeof pic === 'object') {
    if (pic.marks) {
      const n = pic.marks.length, w = s / n;
      pic.marks.forEach(([p, yes], i) => {
        const cx = x + (i - (n - 1) / 2) * w; drawPic(g, p, cx, y - s * 0.05, w * 0.92);
        const bx = cx + w * 0.3, by = y + s * 0.24, r = s * 0.11;
        g.fillStyle = yes ? '#2FB36B' : '#E8476A'; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill(); g.lineWidth = s * 0.02; g.strokeStyle = '#fff'; g.stroke();
        g.fillStyle = '#fff'; g.font = `800 ${r * 1.4}px "Baloo 2", system-ui, sans-serif`; g.fillText(yes ? '✓' : '✗', bx, by + r * 0.08);
      });
      return true;
    }
    if (pic.rel) {
      const big = s * 0.5, sm = s * 0.3, at = { on: [0, -0.3], under: [0, 0.34], 'next to': [0.3, 0.06], in: [0, -0.12] }[pic.rel] || [0, -0.3];
      const bx = pic.rel === 'next to' ? x - s * 0.12 : x, by = y + (pic.rel === 'under' ? -s * 0.08 : s * 0.1);
      const thing = () => { g.font = `${sm}px ${EMOJI}`; g.fillText(pic.a, x + at[0] * s, y + at[1] * s); };
      if (pic.rel === 'in') thing();
      g.font = `${big}px ${EMOJI}`; g.fillText(pic.b, bx, by);
      if (pic.rel !== 'in') thing();
      return true;
    }
    return false;
  }
  const t = String(pic ?? '');
  if (!t) return false;
  if (t.startsWith('~')) {
    g.fillStyle = t.slice(1); g.beginPath(); g.arc(x, y, s * 0.36, 0, 7); g.fill(); g.lineWidth = s * 0.035; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.stroke(); return true;
  }
  if (t.startsWith('=')) {
    const n = t.slice(1), w = Math.max(s * 0.5, s * 0.22 * n.length + s * 0.2), h = s * 0.5;
    g.fillStyle = '#FFF0C7'; g.strokeStyle = '#1B3F52'; g.lineWidth = s * 0.035; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, s * 0.1); g.fill(); g.stroke();
    g.fillStyle = '#1B3F52'; g.font = `800 ${s * 0.36}px "Baloo 2", system-ui, sans-serif`; g.fillText(n, x, y + s * 0.03); return true;
  }
  const cs = graphemes(t), n = cs.length;
  if (n <= 1) { g.font = `${s * 0.72}px ${EMOJI}`; g.fillText(t, x, y + s * 0.05); return true; }
  const cols = n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols), c = s / Math.max(cols, rows + 0.4);
  g.font = `${c * 0.82}px ${EMOJI}`;
  cs.forEach((ch, i) => { const r = Math.floor(i / cols), k = i % cols, inRow = Math.min(cols, n - r * cols); g.fillText(ch, x + (k - (inRow - 1) / 2) * c, y + (r - (rows - 1) / 2) * c + c * 0.05); });
  return true;
}

function build(canvas) {
  const VIEWS = {
    map: { t: [0, 1.0, -1.2], dir: [0.22, 0.78, 1], R: 12.4 },
    // The frog, the board and the lily pads. Where the free part of the screen is small (a phone held upright) the camera comes closer
    stage: { get t() { return small() ? [-0.2, 1.0, 1.2] : [-0.4, 1.1, 1.0]; }, dir: [0.02, 0.42, 1], get R() { return small() ? 4.3 : 5.0; } },
    balloons: { t: [-1.1, 6.4, -7.3], dir: [0.05, 0.16, 1], R: 8.4 }
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
  // lily pads at the edges of the pond, pebbles, reeds
  const padM = std(0x4FA65A, { roughness: 0.6, side: THREE.DoubleSide }), flowerM = std(0xFFB3D9, { emissive: 0xFF5FA8, emissiveIntensity: 0.15 });
  for (const [x, z, r] of [[-5.6, 4.4, 0.42], [-4.6, 5.6, 0.32], [5.8, 4.8, 0.4], [4.9, 5.9, 0.34], [-1.2, 5.8, 0.3], [2.4, 5.9, 0.36]]) {
    fixed.add(mesh(new THREE.CircleGeometry(r, 24, 0.25, Math.PI * 2 - 0.35).rotateX(-Math.PI / 2).translate(x, WY + 0.02, z), padM, { cast: false }));
    if (r > 0.38) fixed.add(part(SPH, flowerM, [0.12, 0.09, 0.12], [x + 0.08, WY + 0.08, z - 0.05]));
  }
  const IC = new THREE.IcosahedronGeometry(1, 0), pebM = std(0xA69C8A, { roughness: 0.9, flatShading: true });
  for (let i = 0; i < 40; i++) { const [x, z] = POND[(i * 5) % 64], s = 0.14 + (i * 37 % 10) / 44; fixed.add(part(IC, pebM, [s, s * 0.55, s], [x, 0.02, z])); }
  const reedM = std(0x3E7F47), catM = std(0x6B4226, { roughness: 0.9 });
  for (const [i0, n] of [[2, 4], [12, 3], [26, 4], [40, 3], [54, 4]]) for (let j = 0; j < n; j++) {
    const [x, z] = POND[(i0 + j) % 64], h = 0.9 + (j % 3) * 0.3, dx = (x - PC[0]) * 0.04, dz = (z - PC[1]) * 0.06;
    if (z < 0.6 && Math.abs(x - FROG[0]) < 2.4) continue;
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5).translate(x - dx, WY + h / 2, z - dz), reedM));
    if (j % 2 === 0) fixed.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8).translate(x - dx, WY + h - 0.05, z - dz), catM));
  }
  // trees, bushes and flowers on the grass
  const trunkM = std(0x7A5230), LEAF = [0x4E9F5B, 0x67B565, 0x3F8A4E];
  const tree = (x, z, s) => {
    fixed.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) fixed.add(part(new THREE.IcosahedronGeometry(1, 1), std(LEAF[(i + Math.round(Math.abs(x))) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-10.2, -8.0, 1.3], [-6.4, -8.3, 1.0], [10.4, -1.6, 0.95], [-10.4, 6.6, 0.85], [10.4, 3.2, 0.9], [-10.6, 0.8, 0.8], [1.6, 7.6, 0.7]]) tree(x, z, s);
  const bushM = std(0x4F9C58, { flatShading: true });
  for (const [x, z, s] of [[-10.6, -4.2, 0.5], [10.7, -4.4, 0.45], [-4.2, 7.6, 0.4], [-10.5, 3.6, 0.45], [10.8, 7.2, 0.4], [4.6, 7.2, 0.35], [-6.8, -1.8, 0.4], [6.2, -2.6, 0.42]])
    fixed.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [s, s * 0.75, s], [x, s * 0.5, z]));
  for (let i = 0; i < 32; i++) fixed.add(part(SPH, mat([0xFF8FD0, 0xFFE08A, 0xFFFFFF, 0xB79CFF][i % 4]), [0.06, 0.05, 0.06], [i % 2 ? -10.8 + (i * 13 % 34) / 10 : 7.4 + (i * 7 % 30) / 10, 0.06, i % 2 ? 2.2 + (i * 47 % 56) / 10 : -0.5 + (i * 29 % 60) / 10]));
  // stepping stones from the stage to the door of the studio
  for (const [x, z] of [[-0.2, -2.9], [-0.5, -3.6], [-0.7, -4.3]]) fixed.add(mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 9).translate(x, 0.04, z), std(0xB8AE9C, { roughness: 0.9, flatShading: true }), { cast: false }));

  /* ---------- the studio of the radio: a wooden cabin with its sign and its ON AIR lamp ---------- */
  const woodM = std(0xC8913A, { roughness: 0.75 }), wood2M = std(0x8B5A3C, { roughness: 0.8 }), roofM = std(0xD9574C, { roughness: 0.6 }), trimM = std(0xF7C64E, { roughness: 0.45 });
  const darkM = std(0x1D2B36, { roughness: 0.7 }), steelM = std(0x6F8C9E, { roughness: 0.45, metalness: 0.45 }), steel2M = std(0x4B6475, { roughness: 0.5, metalness: 0.4 });
  const warmM = std(0xFFD46B, { emissive: 0xFFB030, emissiveIntensity: 1.4, roughness: 0.4 });
  const FZ = HUT.z + HUT.d / 2;
  {
    const { x, z, w, d, h } = HUT;
    fixed.add(mesh(boxG(w + 0.4, 0.24, d + 0.4, x, 0.12, z), wood2M));
    fixed.add(mesh(boxG(w, h, d, x, 0.24 + h / 2, z), woodM));
    for (let y = 0.6; y < h; y += 0.5) fixed.add(mesh(boxG(w + 0.02, 0.04, d + 0.02, x, 0.24 + y, z), wood2M, { cast: false }));
    for (const s of [-1, 1]) {
      const r = mesh(boxG(w + 0.7, 0.16, d * 0.62, 0, 0, 0), roofM); r.position.set(x, 0.24 + h + 0.55, z + s * d * 0.27); r.rotation.x = s * 0.62; fixed.add(r);
    }
    fixed.add(mesh(boxG(w + 0.8, 0.14, 0.18, x, 0.24 + h + 0.98, z), trimM));
    // the door, two round windows with the warm light of the studio inside and a microphone drawn in each
    fixed.add(mesh(boxG(1.1, 1.9, 0.08, x, 0.24 + 0.95, FZ + 0.02), darkM, { cast: false }));
    fixed.add(part(SPH, trimM, [0.07, 0.07, 0.07], [x + 0.36, 1.2, FZ + 0.08]));
    for (const dx of [-1.9, 1.9]) {
      fixed.add(mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 24).rotateX(Math.PI / 2).translate(x + dx, 1.7, FZ + 0.02), warmM, { cast: false }));
      fixed.add(mesh(new THREE.TorusGeometry(0.48, 0.07, 6, 24).translate(x + dx, 1.7, FZ + 0.05), wood2M, { cast: false }));
    }
  }
  // the ON AIR lamp over the door: dark until the recording plays
  const airTex = canvasTex(256, 80, (g, w, h) => { g.fillStyle = '#2A0B0B'; g.beginPath(); g.roundRect(0, 0, w, h, 18); g.fill(); g.font = '800 54px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFFFFF'; g.fillText('ON AIR', w / 2, h / 2 + 4); });
  const airM = new THREE.MeshBasicMaterial({ map: airTex, color: 0x5A2A2A, toneMapped: false });
  const air = mesh(new THREE.PlaneGeometry(1.25, 0.4), airM, { cast: false, at: [HUT.x, 2.62, FZ + 0.06] }); air.userData.keep = true; scene.add(air);
  const airGlow = glow(HUT.x, 2.62, FZ + 0.3, 1.8, 0xFF4A4A, false);
  // the sign over the roof, written again once the font of the page is there
  const signTex = canvasTex(1024, 180, () => {}), signM = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false });
  function paintSign() {
    const g = signTex.image.getContext('2d'), w = 1024, h = 180;
    g.clearRect(0, 0, w, h); g.fillStyle = '#3A1A08'; g.beginPath(); g.roundRect(0, 0, w, h, 40); g.fill(); g.lineWidth = 10; g.strokeStyle = '#FF8C2F'; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 34); g.stroke();
    g.font = '800 116px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#FF8C2F'; g.shadowBlur = 26; g.fillStyle = '#FFE2C2'; g.fillText('RÀDIO GRANOTA', w / 2, h / 2 + 10);
    signTex.needsUpdate = true; D.wake();
  }
  paintSign(); document.fonts?.load?.('800 120px "Baloo 2"').then(paintSign).catch(() => {});
  const SIGN_Y = 0.24 + HUT.h + 1.75;
  const sign = mesh(new THREE.PlaneGeometry(6.0, 1.05), signM, { cast: false, at: [HUT.x, SIGN_Y, HUT.z + 0.1] }); sign.userData.keep = true; scene.add(sign);
  for (const dx of [-2.2, 2.2]) fixed.add(mesh(boxG(0.12, 0.8, 0.12, HUT.x + dx, SIGN_Y - 0.75, HUT.z), wood2M));

  /* ---------- the antenna: a mast with a light for each circle; its waves go out while the radio talks ---------- */
  const redM = std(0xE8443A, { roughness: 0.5 }), whiteM = std(0xF4F1E8, { roughness: 0.5 });
  {
    const [x, z] = TOWER, b = 0.75, t = 0.14;
    fixed.add(mesh(boxG(1.9, 0.3, 1.9, x, 0.15, z), steel2M));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const from = V(x + sx * b, 0.3, z + sz * b), to = V(x + sx * t, TH, z + sz * t), len = from.distanceTo(to);
      const leg = mesh(new THREE.CylinderGeometry(0.04, 0.06, len, 6), steelM); leg.position.copy(from).add(to).multiplyScalar(0.5); leg.quaternion.setFromUnitVectors(V(0, 1, 0), to.clone().sub(from).normalize()); fixed.add(leg);
    }
    for (let k = 1; k <= 6; k++) {
      const y = 0.3 + k * (TH - 0.3) / 7, r = b + (t - b) * (y - 0.3) / (TH - 0.3), m = k % 2 ? redM : whiteM;
      for (const [w, d, dx, dz] of [[2 * r, 0.06, 0, r], [2 * r, 0.06, 0, -r], [0.06, 2 * r, r, 0], [0.06, 2 * r, -r, 0]]) fixed.add(mesh(boxG(w, 0.07, d, x + dx, y, z + dz), m));
    }
    fixed.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6).translate(x, TH + 0.45, z), steelM));
  }
  const tipM = new THREE.MeshBasicMaterial({ color: 0xFF5A4A, toneMapped: false });
  const tip = part(SPH, tipM, [0.14, 0.14, 0.14], [TOWER[0], TH + 0.95, TOWER[1]]); tip.userData.keep = true; tip.castShadow = false; scene.add(tip);
  const tipGlow = glow(TOWER[0], TH + 0.95, TOWER[1], 1.2, 0xFF5A4A, true);
  const waveM = Array.from({ length: 3 }, () => new THREE.MeshBasicMaterial({ color: 0x6FE3FF, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  const waves = waveM.map((m, i) => { const w = mesh(new THREE.TorusGeometry(1, 0.03, 6, 48).rotateX(Math.PI / 2), m, { cast: false, at: [TOWER[0], TH + 0.95, TOWER[1]] }); w.userData.k = i / 3; scene.add(w); return w; });
  // a light on the mast for each circle: it lights with its colour when its exam is passed
  const beacons = CIRCLES.map((_, c) => {
    const y = 1.5 + c * 1.35, r = 0.75 + (0.14 - 0.75) * (y - 0.3) / (TH - 0.3), x = TOWER[0], z = TOWER[1] + r + 0.12;
    const m = std(0x51606B, { roughness: 0.4, emissive: hsl(RING[c % RING.length], 0.9, 0.55), emissiveIntensity: 0 });
    const b = part(SPH, m, [0.2, 0.2, 0.2], [x, y, z]); b.userData.keep = true; scene.add(b);
    const gl = glow(x, y, z + 0.1, 1.5, hsl(RING[c % RING.length], 0.9, 0.6), false);
    return { m, gl, on: false, pos: V(x, y, z) };
  });
  const setBeacon = (B, k) => { B.m.emissiveIntensity = 2.2 * k; B.gl.material.opacity = 0.9 * k; };

  /* ---------- the stage of the frog: a round deck by the water, two lanterns and the microphone ---------- */
  fixed.add(mesh(new THREE.CylinderGeometry(1.55, 1.65, 0.3, 32).translate(FROG[0], 0.15, FROG[1]), wood2M));
  fixed.add(mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.04, 32).translate(FROG[0], 0.31, FROG[1]), woodM, { cast: false }));
  fixed.add(mesh(new THREE.TorusGeometry(1.5, 0.06, 6, 40).rotateX(Math.PI / 2).translate(FROG[0], 0.31, FROG[1]), trimM, { cast: false }));
  const lampGlows = [FROG[0] - 2.2, FROG[0] + 2.2].map(x => {
    const z = FROG[1] - 0.5;
    fixed.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.2, 8).translate(x, 1.1, z), steel2M));
    fixed.add(mesh(new THREE.CylinderGeometry(0.18, 0.1, 0.18, 10).translate(x, 2.25, z), steel2M));
    const bulb = part(SPH, new THREE.MeshBasicMaterial({ color: 0xFFE9B8, toneMapped: false }), [0.15, 0.15, 0.15], [x, 2.06, z]); bulb.castShadow = false; bulb.userData.keep = true; scene.add(bulb);
    return { g: glow(x, 2.06, z, 2.2, 0xFFC46A, true), bulb };
  });
  function lamps(hue) { for (const L of lampGlows) { const c = hue == null ? new THREE.Color(0xFFC46A) : hsl(hue, 0.85, 0.62); L.g.material.color.copy(c); L.bulb.material.color.copy(c).lerp(new THREE.Color(0xffffff), 0.5); } D.wake(); }
  // the microphone on its stand, in front of the frog and to one side, so it does not hide its face
  {
    const [x, z] = [FROG[0] + 0.62, FROG[1] + 0.9];
    fixed.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 16).translate(x, 0.34, z), darkM));
    fixed.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 8).translate(x, 0.65, z), steelM));
    const head = part(SPH, std(0x30363B, { roughness: 0.35, metalness: 0.5 }), [0.12, 0.16, 0.12], [x - 0.08, 1.02, z]); head.rotation.z = 0.45; fixed.add(head);
    fixed.add(mesh(new THREE.TorusGeometry(0.125, 0.02, 6, 20).rotateX(Math.PI / 2).rotateZ(0.45).translate(x - 0.08, 1.0, z), trimM, { cast: false }));
  }

  /* ---------- the board of the pictures, on its easel ---------- */
  const boardTex = canvasTex(512, 512, () => {}), boardM = new THREE.MeshBasicMaterial({ map: boardTex, toneMapped: false });
  const easel = new THREE.Group(); easel.position.set(EASEL[0], 0, EASEL[1]); easel.rotation.y = 0.32; scene.add(easel);
  {
    for (const [dx, dz, rz, rx] of [[-0.62, 0.12, 0.12, -0.08], [0.62, 0.12, -0.12, -0.08], [0, -0.5, 0, 0.32]]) {
      const l = mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.9, 6), wood2M); l.position.set(dx, 1.4, dz); l.rotation.set(rx, 0, rz); easel.add(l);
    }
    easel.add(mesh(boxG(1.98, 1.98, 0.08, 0, 1.68, 0.2), wood2M));
    easel.add(mesh(boxG(1.9, 0.08, 0.3, 0, 0.66, 0.26), wood2M));
    bake(easel);
    const b = mesh(new THREE.PlaneGeometry(1.8, 1.8), boardM, { cast: false, at: [0, 1.68, 0.25] }); b.userData.keep = true; easel.add(b);
  }
  // What the board shows: a picture (pic), a drawing of the page (svg, a string) or, with nothing, the note of the radio
  let boardGen = 0;
  function paintBoard(pic, svg) {
    const my = ++boardGen, g = boardTex.image.getContext('2d'), w = 512;
    g.clearRect(0, 0, w, w); g.fillStyle = '#FFFDF8'; g.beginPath(); g.roundRect(0, 0, w, w, 40); g.fill();
    const done = () => { boardTex.needsUpdate = true; D.wake(); };
    if (svg) {
      const img = new Image();
      img.onload = () => { if (my !== boardGen) return; g.drawImage(img, w * 0.1, w * 0.1, w * 0.8, w * 0.8); done(); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
    } else if (!pic || !drawPic(g, pic, w / 2, w / 2, w * 0.86)) {
      g.fillStyle = 'rgba(29,111,168,0.28)'; g.font = `800 ${w * 0.5}px "Baloo 2", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', w / 2, w / 2);
    }
    done();
  }
  paintBoard(null);

  /* ---------- the balloons: one for each project ---------- */
  const ghostFill = new THREE.MeshBasicMaterial({ color: 0x6FE3FF, transparent: true, opacity: 0.07, depthWrite: false, toneMapped: false });
  const ghostLine = new THREE.LineBasicMaterial({ color: 0x9FEFFF, transparent: true, opacity: 0.5, toneMapped: false });
  const ENV = new THREE.SphereGeometry(0.8, 24, 16).scale(1, 1.18, 1);
  const balloons = PROJECTS.map((P, i) => {
    const [x, y, z] = BALLOON(i), g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    const real = makeBalloon(i, P.icon), ghost = new THREE.Group();
    const eg = new THREE.SphereGeometry(0.8, 10, 7).scale(1, 1.18, 1), bg = new THREE.BoxGeometry(0.4, 0.3, 0.4).translate(0, -1.32, 0);
    for (const geo of [eg, bg]) { ghost.add(new THREE.Mesh(geo, ghostFill)); ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), ghostLine)); }
    g.add(real, ghost);
    return { g, real, ghost, built: false, t: i * 1.3, y, top: V(x, y + 1.1, z) };
  });
  function makeBalloon(i, icon) {
    const g = new THREE.Group(), h = HUE[i % HUE.length];
    const tex = canvasTex(256, 128, (c, w, hh) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? `hsl(${h} 80% 62%)` : `hsl(${h} 85% 86%)`; c.fillRect(k * w / 8, 0, w / 8 + 1, hh); } });
    const env = mesh(ENV, std(0xffffff, { map: tex, roughness: 0.55 })); env.userData.keep = true; g.add(env);
    const wood = std(0x9A6B43, { roughness: 0.8 });
    g.add(mesh(boxG(0.42, 0.3, 0.42, 0, -1.32, 0), wood));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const from = V(sx * 0.19, -1.18, sz * 0.19), to = V(sx * 0.34, -0.74, sz * 0.34), r = mesh(new THREE.CylinderGeometry(0.012, 0.012, from.distanceTo(to), 4), wood);
      r.position.copy(from).add(to).multiplyScalar(0.5); r.quaternion.setFromUnitVectors(V(0, 1, 0), to.clone().sub(from).normalize()); g.add(r);
    }
    const ic = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (c, w) => { c.font = `${w * 0.74}px ${EMOJI}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icon, w / 2, w * 0.56); }), transparent: true, depthWrite: false, toneMapped: false }));
    ic.scale.set(0.72, 0.72, 1); ic.position.set(0, 0.06, 0.86); ic.renderOrder = 3; g.add(ic);
    return g;
  }
  const setBalloon = (B, on) => { B.built = on; B.real.visible = on; B.ghost.visible = !on; B.real.scale.setScalar(1); B.real.position.y = 0; };

  /* ---------- the sky: the moon and the fireflies ---------- */
  scene.add(mesh(new THREE.SphereGeometry(1.7, 32, 16), new THREE.MeshBasicMaterial({ color: 0xFFF4D6, toneMapped: false }), { cast: false, at: [-16, 10, -26] }));
  glow(-16, 10, -26, 9, 0xFFE9B8, true).material.opacity = 0.55;
  const NFL = RM ? 0 : 20, flies = Array.from({ length: NFL }, (_, i) => ({ p: Math.random() * 7, x: (i % 2 ? -1 : 1) * (6.5 + Math.random() * 4), z: -1 + Math.random() * 8, y: 0.4 + Math.random() * 1.5 }));
  const flyPos = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: softTex(), size: 0.4, color: 0xE8FF9A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- the frog of the radio ---------- */
  const frog = makeFrog(); frog.g.position.set(FROG[0], 0.33, FROG[1]); frog.g.scale.setScalar(1.55); scene.add(frog.g);
  // the «z z» of a frog asleep
  const zz = label('z z', { h: 0.5, ink: '#C9F7FF', glow: '#6FE3FF', depthTest: false, order: 6 }); zz.position.set(FROG[0] + 0.7, 2.3, FROG[1]); scene.add(zz);
  // mood: '' waiting, 'ok' after a right answer, 'err' after a wrong one; awake goes from 0 (asleep) to 1; talking while the voice plays
  let act = null, awake = 1, awakeTo = 1, blink = 2, talking = false, talkT = 0;
  function bot(m = '') { act = RM ? null : m === 'ok' ? { kind: 'ok', t: 0, dur: 0.8 } : m === 'err' ? { kind: 'err', t: 0, dur: 0.6 } : null; D.wake(); }
  function wake(k) { awakeTo = Math.max(0, Math.min(1, k)); if (RM) awake = awakeTo; D.wake(); }
  function talk(on) { talking = !!on && awakeTo > 0.5; airM.color.setHex(talking ? 0xFFFFFF : 0x5A2A2A); airGlow.material.opacity = talking ? 0.85 : 0; canvas.dataset.parla = talking ? '1' : '0'; D.wake(); }
  // what the frog says, in a bubble over its head; hold keeps it until the next one or rest()
  let bubble = null, bubbleGen = 0;
  function say(text, hold = false) {
    const my = ++bubbleGen;
    if (bubble) { drop(bubble); bubble = null; }
    if (!text) return D.wake();
    const b = label(text, { h: 0.6, bg: '#FFFFFF', ring: '#6FE3FF', ink: '#06202B', depthTest: false, order: 9 });
    const k = Math.min(1, 7.4 / b.scale.x); b.userData.s = [b.scale.x * k, b.scale.y * k];
    b.position.set(FROG[0] - 0.4, 3.35, FROG[1] + 0.3); scene.add(b); bubble = b;
    tween(RM ? 0 : 380, q => { if (bubble === b) b.scale.set(b.userData.s[0] * q, b.userData.s[1] * q, 1); }, backOut);
    if (!hold) setTimeout(() => { if (bubbleGen === my && bubble === b) { drop(b); bubble = null; D.wake(); } }, 3400);
  }

  /* ---------- everything that never moves, baked into a few meshes ---------- */
  bake(fixed);

  /* ---------- the question: the picture on the board and the options on lily pads ---------- */
  const stageG = new THREE.Group(); scene.add(stageG);
  function drop(o) { o.parent?.remove(o); o.traverse(x => { if (x.userData.dispose) x.userData.dispose(); else if (x.isSprite && !x.userData.shared) x.material.dispose(); else if (x.geometry && !x.geometry.userData.shared) x.geometry.dispose(); }); }
  const CARDS = new Map();
  const cardTex = pic => {
    const key = JSON.stringify(pic);
    if (!CARDS.has(key)) CARDS.set(key, canvasTex(256, 256, (g, w) => {
      g.fillStyle = '#FFFDF8'; g.strokeStyle = '#4D7486'; g.lineWidth = 10; g.beginPath(); g.roundRect(6, 6, w - 12, w - 12, 44); g.fill(); g.stroke();
      drawPic(g, pic, w / 2, w / 2, w * 0.78);
    }));
    return CARDS.get(key);
  };
  const PAD = new THREE.CircleGeometry(0.82, 32, 0.3, Math.PI * 2 - 0.42).rotateX(-Math.PI / 2), HITG = new THREE.BoxGeometry(1.5, 1.9, 1.3); PAD.userData.shared = HITG.userData.shared = true;
  const padMat = std(0x5DBB63, { roughness: 0.55, side: THREE.DoubleSide, emissive: 0x6FE3FF, emissiveIntensity: 0 });
  let pads = [], gen = 0;
  // A pad: its lily pad, the card with the picture over it and, once it is answered, its word under it
  function padOf(o, i, n) {
    const span = n > 3 ? 1.95 : 2.3, x = PC[0] + (i - (n - 1) / 2) * span, g = new THREE.Group(); g.position.set(x, WY + 0.03, PAD_Z + (i % 2 ? 0.25 : 0)); stageG.add(g);
    const lily = new THREE.Mesh(PAD, padMat.clone()); lily.rotation.y = i * 1.7; lily.receiveShadow = true; lily.userData.dispose = () => lily.material.dispose(); g.add(lily);
    const card = new THREE.Sprite(new THREE.SpriteMaterial({ map: cardTex(o.place || o.pic), transparent: true, depthWrite: false, toneMapped: false }));
    card.scale.set(1.2, 1.2, 1); card.position.y = 1.0; card.renderOrder = 4; card.userData.dispose = () => card.material.dispose(); g.add(card);
    const hit = new THREE.Mesh(HITG, HIT()); hit.position.y = 0.8; hit.userData.pick = { kind: 'pad', key: i }; g.add(hit);
    return { g, lily, card, hit, word: o.word || '', tag: null, x, t: Math.random() * 6, sink: 0, jump: 0 };
  }
  // the question of the round: big on the board (a picture, or svg drawn by the page) and the options with a picture on the pads
  function question({ big = null, svg = null, opts = null } = {}) {
    const my = ++gen;
    for (const P of pads) drop(P.g);
    pads = [];
    paintBoard(big, svg);
    const list = (opts || []).filter(o => o && (o.pic || o.place));
    if (list.length === (opts || []).length && list.length) {
      pads = list.map((o, i) => padOf(o, i, list.length));
      pads.forEach((P, i) => { P.g.scale.setScalar(RM ? 1 : 0.01); tween(RM ? 0 : 420 + i * 90, k => { if (gen === my) P.g.scale.setScalar(Math.max(0.01, k)); }, backOut); });
      if (!RM) sound.tone(520, 0, 0.12, 0.03);
    }
    canvas.dataset.nenufars = pads.length; D.wake();
  }
  // a pad answered: a right one jumps and shows its word (or text instead); a wrong one goes dim and sinks a little
  function mark(i, ok, text = null) {
    const P = pads[i]; if (!P) return;
    if (ok) {
      P.jump = RM ? 0 : 0.6; P.lily.material.emissiveIntensity = 0.9; P.lily.material.emissive.setHex(0x7CF5B0); P.hit.userData.pick = null;
      const w = text || P.word;
      if (w && !P.tag) { P.tag = label(w, { h: 0.38, bg: '#06202B', ring: '#7CF5B0', ink: '#FFFFFF', depthTest: false, order: 7 }); P.tag.position.set(0, 0.1, 0.9); P.g.add(P.tag); }
      D.sparkle(P.g.position.clone().add(V(0, 1.2, 0)), 12, 0x7CF5B0, 0.35, 1.6, 2.5);
    } else { P.card.material.opacity = 0.35; P.sink = 1; P.hit.userData.pick = null; P.lily.material.emissive.setHex(0xFF6B5E); P.lily.material.emissiveIntensity = 0.5; }
    D.wake();
  }
  // the stage empty again: no pads, the board with the note, the frog waiting, no bubble
  function rest() {
    gen++; bubbleGen++; for (const P of pads) drop(P.g); pads = [];
    if (bubble) { drop(bubble); bubble = null; }
    paintBoard(null); act = null; talk(false); canvas.dataset.nenufars = 0; D.wake();
  }
  function HIT() { return HIT.m || (HIT.m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 })); }
  // a tap on the pond: a pad under the finger
  const pickables = () => pads.map(P => P.hit).filter(h => h.userData.pick);
  canvas.addEventListener('click', e => {
    if (!api.onPick) return;
    const hit = D.pick(e.clientX, e.clientY, pickables())[0];
    if (hit) api.onPick(hit.object.userData.pick.kind, hit.object.userData.pick.key);
  });
  // the point of the screen where a pad is: for the checks in the browser, which touch it there
  function where(kind, key) {
    const o = pickables().find(h => h.userData.pick.kind === kind && h.userData.pick.key === key); if (!o) return null;
    return D.onScreen(new THREE.Box3().setFromObject(o).getCenter(V(0, 0, 0)));
  }

  /* ---------- what moves by itself ---------- */
  let hlOn = -1;
  D.every((dt, now, raw) => {
    // the first frame after the loop wakes can come with a time a little before the wake: never backwards
    dt = Math.max(0, dt); raw = Math.max(0, raw);
    awake += (awakeTo - awake) * Math.min(1, dt * 2.5);
    if (RM) { frog.pose({ awake, t: 0, hop: 0, shake: 0, mouth: 0, blink: false, squash: 0 }); zz.visible = awake < 0.5; return false; }
    const t = now / 1000;
    flies.forEach((q, i) => { q.p += dt; flyPos[i * 3] = q.x + Math.sin(q.p * 0.7) * 0.8; flyPos[i * 3 + 1] = q.y + Math.sin(q.p * 1.3) * 0.35; flyPos[i * 3 + 2] = q.z + Math.cos(q.p * 0.5) * 0.6; });
    if (NFL) flyGeo.attributes.position.needsUpdate = true;
    // the frog: it wakes little by little, breathes, blinks, talks, leaps or shakes its head
    const P = { awake, t, hop: 0, shake: 0, mouth: 0, blink: false, squash: 0 };
    if (act) {
      act.t += raw; const k = Math.min(1, act.t / act.dur), e = Math.sin(k * Math.PI);
      if (act.kind === 'ok') { P.hop = e * 0.55; P.squash = k < 0.15 ? k / 0.15 : 0; } else P.shake = Math.sin(k * Math.PI * 5) * 0.45 * (1 - k);
      if (k >= 1) act = null;
    }
    if (talking) { talkT += dt; P.mouth = 0.5 + 0.5 * Math.sin(talkT * 15) * Math.sin(talkT * 3.1 + 1); }
    blink -= dt; if (blink < -0.14) blink = 2 + Math.random() * 3;
    P.blink = blink < 0;
    frog.pose(P);
    zz.visible = awake < 0.5; if (zz.visible) { const z = (t * 0.35) % 1; zz.position.y = 2.1 + z * 0.7; zz.material.opacity = Math.sin(z * Math.PI); }
    // the antenna: its tip blinks; while the radio talks, three rings go out from it
    tipGlow.material.opacity = 0.35 + 0.45 * Math.sin(t * 2.2) ** 2;
    waves.forEach((w, i) => {
      const k = (t * 0.7 + i / 3) % 1;
      w.scale.setScalar(0.3 + k * 2.4); waveM[i].opacity = talking ? 0.75 * (1 - k) : Math.max(0, waveM[i].opacity - raw * 2);
    });
    if (talking) airGlow.material.opacity = 0.65 + 0.25 * Math.sin(t * 6);
    // the pads float; a right one jumps, a wrong one sinks
    for (const Pd of pads) {
      Pd.t += dt; Pd.card.position.y = 1.0 + Math.sin(Pd.t * 2.2) * 0.05 - Pd.sink * 0.35;
      if (Pd.jump > 0) { Pd.jump -= raw; Pd.card.position.y += Math.sin(Math.max(0, Pd.jump) / 0.6 * Math.PI) * 0.6; }
    }
    // the balloons sway; the one under the finger shines
    balloons.forEach((B, i) => {
      B.t += dt;
      if (B.built) { B.real.position.y = Math.sin(B.t * 0.9) * 0.18; B.real.rotation.y = Math.sin(B.t * 0.4) * 0.25; }
      if (i === hlOn) { const p = 0.5 + 0.5 * Math.sin(now * 0.008); (B.built ? B.real : B.ghost).scale.setScalar(1 + 0.12 * p); }
    });
    return true;
  });

  /* ---------- the map: what is built, and what is under the finger ---------- */
  // a project under the finger: its balloon shines; null puts it out. The camera stays where it is
  function highlight(i) {
    if (hlOn >= 0) { balloons[hlOn].real.scale.setScalar(1); balloons[hlOn].ghost.scale.setScalar(1); }
    hlOn = Number.isInteger(i) && balloons[i] ? i : -1;
    D.wake();
  }
  let piscinaOn = false;
  // the radio as the progress has it: piscina (the frog awake), valid (the projects validated) and exams (the circles passed)
  function state({ piscina = false, valid = [], exams = [] } = {}) {
    piscinaOn = piscina;
    balloons.forEach((B, i) => setBalloon(B, valid.includes(i)));
    beacons.forEach((B, c) => { B.on = exams.includes(c); setBeacon(B, B.on ? 1 : 0); });
    awakeTo = piscina ? 1 : 0; awake = awakeTo; flyPts.visible = piscina;
    said();
  }
  const said = () => { canvas.dataset.globus = balloons.filter(B => B.built).length; canvas.dataset.llums = beacons.filter(B => B.on).length; canvas.dataset.piscina = piscinaOn ? '1' : '0'; D.wake(); };
  // a project validated: the camera goes to the balloons and its balloon fills and rises
  function validate(i) {
    const B = balloons[i]; if (!B || B.built) return Promise.resolve();
    return go('balloons').then(async () => {
      setBalloon(B, true); B.real.scale.setScalar(0.01); said();
      sound.tone(523, 0, 0.3, 0.08); sound.tone(784, 0.15, 0.4, 0.08); sound.tone(1047, 0.3, 0.5, 0.07);
      await tween(RM ? 0 : 1100, k => { B.real.scale.setScalar(Math.max(0.01, k)); B.real.position.y = -1.6 * (1 - k); }, backOut);
      D.sparkle(B.top.clone(), 20, hsl(HUE[i % HUE.length], 0.9, 0.7), 0.4, 2.2, 2); D.celebrate(3, B.top.clone());
    });
  }
  // an exam passed: the light of its circle on the antenna lights up
  function beacon(c) {
    const B = beacons[c]; if (!B || B.on) return Promise.resolve();
    B.on = true;
    return go('map').then(() => tween(RM ? 0 : 1400, k => setBeacon(B, k), easeOut)).then(() => { said(); D.sparkle(B.pos.clone(), 16, hsl(RING[c % RING.length], 0.9, 0.7), 0.4, 1.8, 2); D.celebrate(3, B.pos.clone()); });
  }

  state({});
  const api = { ok: true, layout, go, get view() { return viewName; }, state, highlight, pause: D.pause, celebrate: (t, at) => D.celebrate(t, at), shake: D.shake,
    hear: o => { sound = { ...sound, ...o }; }, lamps, rest, question, mark, talk, bot, wake, say, where, validate, beacon, onPick: null,
    _: { D, balloons, beacons, frog, get pads() { return pads; } } };
  return api;
}

/* ---------- the frog of the radio, with headphones ---------- */
// About one unit tall, looking at +z. pose(P) puts it as P says: awake (0 to 1), hop (how high), squash, shake (its body round), mouth
// (how open, while it talks), blink, t
function makeFrog() {
  const g = new THREE.Group(), body = new THREE.Group();
  const k = { body: mat(0x5DBB63), dark: mat(0x3C9A50), belly: mat(0xD5F8C4), band: mat(0x1B3F52, { roughness: 0.5 }), cup: mat(0xFF6B9A, { roughness: 0.45 }), white: mat(0xffffff, { roughness: 0.3 }), pupil: mat(0x06220D, { roughness: 0.15 }) };
  g.add(body);
  body.add(part(SPH, k.body, [0.5, 0.36, 0.46], [0, 0.38, 0]));
  body.add(part(SPH, k.belly, [0.34, 0.24, 0.12], [0, 0.32, 0.36]));
  for (const s of [-1, 1]) {
    body.add(part(SPH, k.dark, [0.2, 0.17, 0.34], [s * 0.42, 0.18, -0.05]));
    body.add(part(SPH, k.dark, [0.17, 0.06, 0.26], [s * 0.46, 0.04, 0.18]));
    body.add(part(SPH, k.dark, [0.09, 0.05, 0.13], [s * 0.2, 0.04, 0.38]));
    body.add(part(SPH, k.body, [0.17, 0.17, 0.17], [s * 0.23, 0.68, 0.16]));
    body.add(part(SPH, mat(0xFF8FD0, { roughness: 0.6 }), [0.07, 0.04, 0.02], [s * 0.3, 0.43, 0.37]));
  }
  // the eyes, each in its own group so they can close (blink, sleep)
  const eyes = [-1, 1].map(s => {
    const e = new THREE.Group(); e.position.set(s * 0.24, 0.72, 0.24); e.userData.own = true;
    e.add(part(SPH, k.white, [0.12, 0.12, 0.12], [0, 0, 0])); e.add(part(SPH, k.pupil, [0.065, 0.075, 0.05], [s * 0.01, 0.01, 0.1]));
    body.add(e); return e;
  });
  body.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 6, 20, Math.PI * 0.7).rotateZ(Math.PI + Math.PI * 0.15).translate(0, 0.5, 0.41), mat(0x1F6030)));
  // the mouth that opens while it talks
  const mouth = part(SPH, mat(0x7A1F3A, { roughness: 0.6 }), [0.1, 0.02, 0.03], [0, 0.46, 0.42]); mouth.userData.keep = true; body.add(mouth);
  // the headphones: a band over the head and two pink cups
  body.add(mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 28, Math.PI).translate(0, 0.62, 0.04), k.band));
  for (const s of [-1, 1]) body.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16).rotateZ(Math.PI / 2).translate(s * 0.42, 0.6, 0.04), k.cup));
  bake(body);
  function pose(P) {
    const a = P.awake, breath = Math.sin(P.t * 2.2);
    g.position.y = 0.33 + P.hop * 1.0;
    body.scale.set(1 + breath * 0.02 * a + P.squash * 0.12, 1 + breath * 0.03 * a - P.squash * 0.15, 1);
    body.rotation.y = P.shake; body.rotation.x = 0.22 * (1 - a);
    const open = a < 0.5 ? 0.1 : P.blink ? 0.12 : 1;
    for (const e of eyes) e.scale.y = open;
    mouth.scale.y = 0.02 + 0.06 * P.mouth * a;
  }
  pose({ awake: 1, t: 0, hop: 0, shake: 0, mouth: 0, blink: false, squash: 0 });
  return { g, body, pose };
}
// the soft light of a firefly
function softTex() {
  return canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,200,0.5)'); r.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
}
