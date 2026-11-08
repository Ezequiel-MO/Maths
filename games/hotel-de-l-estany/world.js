// The hotel in 3D, with Three.js: a diorama that floats in the dusk, on a block of earth cut open on its right side, where the lift goes
// down to the two floors of the car park. The garden in front has the pond, the pool and the lamps; the hotel has a lobby and a restaurant
// on the ground floor, five floors of rooms and a neon sign on the roof. It grows with the progress (state): every project validated
// lights a part, and every exam passed lights a star of the sign.
//
// The camera flies to the place of each project (go). A floor seen from inside opens like a doll's house: its front fades away. The
// guests are pond animals made of round shapes that walk, wait and hop for joy. Everything is drawn here and only here; main.js tells
// it what happens. Without WebGL hotel() gives the same calls doing nothing, and the game is played on the cards alone.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RM } from '../../shared/util.js';

/* ---------- the measures of the hotel ---------- */
const W = 12, D = 6, H0 = 3.2, FH = 2.5, NF = 5, ROOF = H0 + NF * FH, UG = 2.3;
// the bottom of floor k: the car park under 0, the ground floor taller than the others
export const yOf = k => k <= 0 ? k * UG : H0 + (k - 1) * FH;
const SX = 7.3, SW = 2.2, PL = { x0: -13, x1: SX + SW / 2, z0: -5.5, z1: 10, y0: -5.8 };
const WIN = i => -W / 2 + 0.75 + 1.5 * i;

const C = {
  facade: 0xA9DCC6, trim: 0xFFF3DD, cherry: 0xD9474F, brass: 0xE0A93E, glass: 0x1F3A5C, lit: 0xFFC46A, grass: 0x6DBB6A, grass2: 0x4F9C58,
  soil: 0x7A4E2D, path: 0xE8D6AE, water: 0x2B93B2, pool: 0x46D3E3, wood: 0x8B5A3C, wall: 0xF6E2C6, leaf: [0x4E9F5B, 0x67B565, 0x3F8A4E]
};
const ease = k => k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
const easeOut = k => 1 - (1 - k) ** 3;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- small makers ---------- */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const boxG = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const merge = gs => mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g), false);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
function mesh(g, m, o = {}) {
  const x = new THREE.Mesh(g, m);
  if (o.cast !== false) x.castShadow = true;
  if (o.receive !== false) x.receiveShadow = true;
  if (o.at) x.position.set(...o.at);
  return x;
}
// Static furniture drawn at once. Every plain mesh under root (a MeshStandardMaterial with no texture, opaque, shown) is merged with the
// others of the same finish into a single mesh that keeps its colours in its vertices: hundreds of little shapes become a handful of draws,
// which is what a tablet can keep at sixty frames a second. What moves or changes (userData.keep) and the groups baked on their own
// (userData.own) are left as they are; the groups stay where they were, only their meshes go.
function bake(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), dead = [], M = new THREE.Matrix4();
  (function visit(o) {
    for (const c of o.children) {
      if (c.userData.keep || c.userData.own) continue;
      const m = c.material;
      if (c.isMesh && !c.isInstancedMesh && m && !Array.isArray(m) && m.isMeshStandardMaterial && !m.map && !m.transparent && c.visible) {
        const key = [m.roughness, m.metalness, m.flatShading, m.emissive.getHex(), m.emissiveIntensity, m.envMapIntensity, c.castShadow].join();
        const g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
        for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal') g.deleteAttribute(a);
        g.clearGroups(); g.applyMatrix4(M.multiplyMatrices(inv, c.matrixWorld));
        const n = g.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { col[i * 3] = m.color.r; col[i * 3 + 1] = m.color.g; col[i * 3 + 2] = m.color.b; }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        if (!buckets.has(key)) buckets.set(key, { gs: [], m, cast: c.castShadow });
        buckets.get(key).gs.push(g); dead.push(c);
      } else if (c.children.length) visit(c);
    }
  })(root);
  for (const c of dead) c.parent.remove(c);
  for (const { gs, m, cast } of buckets.values()) {
    const mm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: m.roughness, metalness: m.metalness, flatShading: m.flatShading, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, envMapIntensity: m.envMapIntensity });
    const x = new THREE.Mesh(mergeGeometries(gs), mm); x.castShadow = cast; x.receiveShadow = true; root.add(x);
  }
  return root;
}
// a soft round light, for the glow round the lamps and the sparkles
const glowTex = () => canvasTex(128, 128, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,240,200,0.55)'); r.addColorStop(1, 'rgba(255,220,160,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
// a label that always looks at the camera: the floors of the lift
function label(text, tex = null) {
  const t = tex || canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#123B35'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 8, 0, 7); g.fill();
    g.lineWidth = 12; g.strokeStyle = '#E0A93E'; g.stroke();
    g.fillStyle = '#FFF3DD'; g.font = '800 120px "Fraunces", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, w / 2 + 8);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  return s;
}

/* ---------- the guests ---------- */
const SKIN = {
  granota: { body: 0x5DBB63, belly: 0xCFEAB0 }, anec: { body: 0xFBF7EC, belly: 0xFFFFFF }, tortuga: { body: 0x9CC77A, belly: 0x4E8A4A }, lludriga: { body: 0x8A5A3B, belly: 0xEED9B8 }
};
const MAT = new Map();
const mat = (c, o) => { const k = c + JSON.stringify(o || {}); if (!MAT.has(k)) MAT.set(k, std(c, { roughness: 0.55, ...o })); return MAT.get(k); };
const SPH = new THREE.SphereGeometry(1, 20, 14), CONE = new THREE.ConeGeometry(1, 1, 16), CYL = new THREE.CylinderGeometry(1, 1, 1, 20);
function part(g, m, s, p, r) { const x = new THREE.Mesh(g, m); x.scale.set(...s); x.position.set(...p); if (r) x.rotation.set(...r); x.castShadow = true; return x; }
function eyes(body, y, z, dx, r = 0.075) {
  for (const s of [-1, 1]) {
    body.add(part(SPH, mat(0xffffff), [r, r, r], [s * dx, y, z]));
    body.add(part(SPH, mat(0x111111, { roughness: 0.2 }), [r * 0.55, r * 0.55, r * 0.55], [s * dx, y, z + r * 0.6]));
  }
}
// a guest of species sp, about one unit tall, looking at +z. bell: the cap of the bellhop
export function makeGuest(sp, bell = false) {
  const g = new THREE.Group(), body = new THREE.Group(), k = SKIN[sp] || SKIN.granota;
  g.add(body);
  if (sp === 'anec') {
    body.add(part(SPH, mat(k.body), [0.42, 0.34, 0.5], [0, 0.36, 0]));
    body.add(part(SPH, mat(k.body), [0.25, 0.25, 0.25], [0, 0.82, 0.14]));
    body.add(part(CONE, mat(0xF2A23C), [0.09, 0.22, 0.06], [0, 0.78, 0.42], [Math.PI / 2, 0, 0]));
    body.add(part(CONE, mat(k.body), [0.12, 0.25, 0.12], [0, 0.48, -0.45], [-1.1, 0, 0]));
    for (const s of [-1, 1]) body.add(part(SPH, mat(0xF2A23C), [0.1, 0.04, 0.15], [s * 0.16, 0.03, 0.1]));
    eyes(body, 0.9, 0.32, 0.11, 0.05);
  } else if (sp === 'tortuga') {
    body.add(part(SPH, mat(k.belly, { roughness: 0.4 }), [0.46, 0.34, 0.5], [0, 0.3, -0.05]));
    body.add(part(CYL, mat(0x3A6E3A), [0.47, 0.06, 0.51], [0, 0.3, -0.05]));
    body.add(part(SPH, mat(k.body), [0.2, 0.19, 0.22], [0, 0.42, 0.5]));
    for (const [x, z] of [[-0.3, 0.25], [0.3, 0.25], [-0.3, -0.3], [0.3, -0.3]]) body.add(part(SPH, mat(k.body), [0.12, 0.12, 0.14], [x, 0.1, z]));
    eyes(body, 0.5, 0.64, 0.09, 0.05);
  } else if (sp === 'lludriga') {
    body.add(part(SPH, mat(k.body), [0.3, 0.42, 0.28], [0, 0.48, 0]));
    body.add(part(SPH, mat(k.belly), [0.2, 0.3, 0.12], [0, 0.45, 0.2]));
    body.add(part(SPH, mat(k.body), [0.24, 0.22, 0.22], [0, 0.98, 0.03]));
    body.add(part(SPH, mat(k.belly), [0.12, 0.08, 0.08], [0, 0.92, 0.22]));
    body.add(part(SPH, mat(0x221511), [0.04, 0.03, 0.03], [0, 0.96, 0.3]));
    for (const s of [-1, 1]) body.add(part(SPH, mat(k.body), [0.06, 0.06, 0.04], [s * 0.17, 1.16, 0]));
    body.add(part(SPH, mat(k.body), [0.08, 0.08, 0.32], [0, 0.18, -0.38], [0.4, 0, 0]));
    eyes(body, 1.03, 0.2, 0.09, 0.045);
  } else {
    body.add(part(SPH, mat(k.body), [0.42, 0.33, 0.38], [0, 0.34, 0]));
    body.add(part(SPH, mat(k.belly), [0.3, 0.22, 0.1], [0, 0.3, 0.3]));
    for (const s of [-1, 1]) {
      body.add(part(SPH, mat(k.body), [0.15, 0.15, 0.15], [s * 0.2, 0.66, 0.12]));
      body.add(part(SPH, mat(k.body), [0.16, 0.06, 0.22], [s * 0.28, 0.05, 0.12]));
    }
    eyes(body, 0.71, 0.24, 0.2, 0.085);
    if (bell) {
      body.add(part(CYL, mat(C.cherry), [0.16, 0.14, 0.16], [0, 0.78, -0.05]));
      body.add(part(CYL, mat(C.brass, { metalness: 0.8, roughness: 0.3 }), [0.165, 0.03, 0.165], [0, 0.73, -0.05]));
      body.add(part(SPH, mat(C.brass, { metalness: 0.8, roughness: 0.3 }), [0.03, 0.03, 0.03], [0, 0.89, -0.05]));
    }
  }
  bake(body);
  g.userData = { body, path: [], speed: 1.7, t: Math.random() * 10, hop: 0, done: null, face: null };
  return g;
}

/* ---------- the world ---------- */
export function hotel(canvas) {
  try { return build(canvas); } catch (e) { console.warn('hotel 3D:', e); return none(); }
}
// the same calls, doing nothing
function none() {
  const p = () => Promise.resolve();
  return { ok: false, layout() {}, go: p, state() {}, highlight() {}, guest: p, happy: p, sad() {}, leave: p, bell() {}, key() {}, lift: { go: p, at: 0, set() {} },
    seat() {}, crowd() {}, occupancy() {}, celebrate() {}, shake() {}, openSign: p, room() {}, pause() {} };
}

function build(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const small = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.75 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.5, 300);

  // the sky the shiny things reflect: dusk, the same as the page behind
  {
    const env = new THREE.Scene(), sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
      uniforms: {}, vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'varying vec3 p; void main(){ float h = p.y; vec3 top = vec3(.16,.18,.42), mid = vec3(.75,.45,.55), low = vec3(1.,.72,.5), gr = vec3(.2,.16,.14);' +
        'vec3 c = h > .0 ? mix(mid, top, smoothstep(.0,.6,h)) : mix(low, gr, smoothstep(.0,-.4,h)); c = mix(c, low, smoothstep(.25,.0,abs(h)) * .6); gl_FragColor = vec4(c,1.); }' }));
    env.add(sky);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 })); sun.position.set(-30, 12, 30); env.add(sun);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();
  }
  scene.add(new THREE.HemisphereLight(0xA8B8FF, 0x5A4636, 0.7));
  const sun = new THREE.DirectionalLight(0xFFD2A4, 2.3); sun.position.set(-18, 16, 18); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 22, bottom: -10, near: 1, far: 80 });
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8FA6FF, 0.6); rim.position.set(16, 8, -14); scene.add(rim);

  const GLOW = glowTex(), glows = [];
  // a glow sprite: s its size, c its colour; it shines only while on
  function glow(x, y, z, s, c = 0xFFC46A, on = true) {
    const m = new THREE.SpriteMaterial({ map: GLOW, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: on ? 1 : 0 });
    const sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s, s); scene.add(sp); glows.push(sp); return sp;
  }

  /* ---------- the block of earth ---------- */
  const soilTex = canvasTex(256, 512, (g, w, h) => {
    const bands = ['#6E9F4E', '#7A4E2D', '#8E5E36', '#6B4226', '#9A6B43', '#5C3820', '#7E5131'], hs = [10, 70, 60, 80, 70, 110, 120];
    let y = 0; bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, y, w, hs[i]); y += hs[i]; });
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${i % 3 ? '40,25,15' : '200,180,150'},${0.15 + Math.random() * 0.25})`; const r = 1 + Math.random() * 5; g.beginPath(); g.ellipse(Math.random() * w, 14 + Math.random() * (h - 14), r * 1.6, r, 0, 0, 7); g.fill(); }
  });
  soilTex.wrapS = THREE.RepeatWrapping;
  const soilM = std(0xffffff, { map: soilTex, roughness: 0.95 }), grassM = std(C.grass, { roughness: 0.9 }), darkM = std(0x3A2617, { roughness: 1 });
  const H = -PL.y0;
  function earth(x0, x1, z0, z1, y0, y1, top = true) {
    const w = x1 - x0, d = z1 - z0, h = y1 - y0, g = new THREE.BoxGeometry(w, h, d);
    const side = soilM.clone(); side.map = soilTex.clone(); side.map.needsUpdate = true; side.map.repeat.set(Math.max(1, Math.round(Math.max(w, d) / 6)), h / H); side.map.offset.set(0, (y0 - PL.y0) / H);
    const b = mesh(g, [side, side, top ? grassM : darkM, darkM, side, side], { at: [x0 + w / 2, y0 + h / 2, z0 + d / 2] });
    scene.add(b); return b;
  }
  // around the hollow of the car park: under it, in front, behind and on its left; the right side stays open
  const GX0 = -W / 2, GZ0 = -D / 2, GZ1 = D / 2, GY = -2 * UG - 0.25;
  earth(PL.x0, PL.x1, PL.z0, PL.z1, PL.y0, GY, false);
  earth(PL.x0, PL.x1, GZ1, PL.z1, GY, 0);
  earth(PL.x0, PL.x1, PL.z0, GZ0, GY, 0);
  earth(PL.x0, GX0, GZ0, GZ1, GY, 0);
  // the lip of grass round the top, like a cake
  scene.add(mesh(boxG(PL.x1 - PL.x0 + 0.3, 0.22, PL.z1 - PL.z0 + 0.3, (PL.x0 + PL.x1) / 2, -0.08, (PL.z0 + PL.z1) / 2), grassM, { cast: false }));
  // its shadow on the air below
  {
    const t = canvasTex(256, 256, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(10,8,30,0.55)'); r.addColorStop(1, 'rgba(10,8,30,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.set(-2, PL.y0 - 2.5, 2); scene.add(s);
  }

  /* ---------- the car park ---------- */
  const park = new THREE.Group(); scene.add(park);
  {
    const conc = std(0x8E949A, { roughness: 0.9 }), lines = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#5E646B'; g.fillRect(0, 0, w, h); g.strokeStyle = '#F2E6A8'; g.lineWidth = 4; for (let x = 16; x < w; x += 60) { g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 70); g.stroke(); } });
    lines.wrapS = THREE.RepeatWrapping; lines.repeat.set(3, 1);
    const flr = std(0xffffff, { map: lines, roughness: 0.8 });
    for (const k of [-1, -2]) {
      const y = yOf(k);
      park.add(mesh(boxG(W + SW + 0.2, 0.2, D, (GX0 + PL.x1) / 2, y - 0.1, 0), flr, { cast: false }));
      for (let i = 0; i < 4; i++) {
        const car = new THREE.Group(), col = [0xD9474F, 0x3E7CB1, 0xF2C14E, 0xF7F3EA][(i + (k === -2 ? 2 : 0)) % 4];
        car.add(mesh(boxG(1.1, 0.4, 1.9, 0, 0.35, 0), std(col, { roughness: 0.35, metalness: 0.2 })));
        car.add(mesh(boxG(0.9, 0.35, 1.0, 0, 0.72, -0.1), std(0x24384F, { roughness: 0.1, metalness: 0.5 })));
        for (const [x, z] of [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]]) car.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 12).rotateZ(Math.PI / 2).translate(x, 0.17, z), std(0x1B1B1B)));
        car.position.set(-4.6 + i * 2.6, y, -1); if (!(i === 1 && k === -1)) park.add(car);
      }
      for (const x of [-3.3, 0, 3.3]) park.add(mesh(boxG(0.3, UG - 0.2, 0.3, x, y + UG / 2, 1.9), conc));
      const lamp = mesh(boxG(9, 0.06, 0.25, 0, y + UG - 0.2, 0), new THREE.MeshBasicMaterial({ color: 0xFFF1C8 }), { cast: false }); park.add(lamp);
      const pl = new THREE.PointLight(0xFFE7C2, 9, 16, 1.6); pl.position.set(2, y + UG - 0.5, 0.5); park.add(pl);
    }
    park.add(mesh(boxG(W + SW + 0.2, 0.25, D, (GX0 + PL.x1) / 2, -0.12, 0), conc, { cast: false }));
  }

  /* ---------- the garden ---------- */
  const garden = new THREE.Group(); scene.add(garden);
  const pathM = std(C.path, { roughness: 0.9 });
  garden.add(mesh(boxG(1.8, 0.06, PL.z1 - D / 2, 1.5, 0.03, (D / 2 + PL.z1) / 2), pathM, { cast: false }));
  garden.add(mesh(boxG(8, 0.06, 1.4, -2.5, 0.031, 7.4), pathM, { cast: false }));
  // the pond, with its stones, its lily pads and the fireflies
  const pondM = std(C.water, { roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.92, envMapIntensity: 1.2 });
  const pond = mesh(new THREE.CircleGeometry(1, 40).scale(3.4, 2.4, 1).rotateX(-Math.PI / 2).translate(-8.2, 0.04, 6.2), pondM, { cast: false }); garden.add(pond);
  const stoneM = std(0xB7AE9E, { roughness: 0.9, flatShading: true }), IC = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, s = 0.22 + (i * 37 % 10) / 40; garden.add(part(IC, stoneM, [s, s * 0.6, s], [-8.2 + Math.cos(a) * 3.5, 0.06, 6.2 + Math.sin(a) * 2.5])); }
  const padM = std(0x4FA65A, { roughness: 0.6, side: THREE.DoubleSide }), pads = [];
  for (const [x, z, r] of [[-9.4, 5.6, 0.45], [-7.2, 7.1, 0.38], [-8.6, 7.3, 0.3], [-6.9, 5.4, 0.33], [-9.9, 6.9, 0.28]]) {
    const pd = mesh(new THREE.CircleGeometry(r, 20, 0.3, Math.PI * 2 - 0.4).rotateX(-Math.PI / 2), padM, { cast: false, at: [x, 0.07, z] }); pd.userData.keep = true; garden.add(pd); pads.push(pd);
  }
  garden.add(part(SPH, mat(0xF7A8C8), [0.12, 0.1, 0.12], [-7.2, 0.15, 7.1]));
  const lilyFrog = makeGuest('granota'); lilyFrog.scale.setScalar(0.42); lilyFrog.position.set(-9.4, 0.07, 5.6); lilyFrog.rotation.y = 0.5; lilyFrog.userData.keep = true; garden.add(lilyFrog);
  const reedM = std(0x3E7F47);
  for (let i = 0; i < 14; i++) { const a = 2.2 + i * 0.16, x = -8.2 + Math.cos(a) * 3.2, z = 6.2 + Math.sin(a) * 2.2; garden.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9 + (i % 3) * 0.25, 5).translate(x, 0.5, z), reedM)); }
  // the pool, with two deck chairs and a sunshade
  const poolM = std(C.pool, { roughness: 0.05, metalness: 0.1, envMapIntensity: 1.3, emissive: 0x0C5560, emissiveIntensity: 0.25 });
  garden.add(mesh(boxG(4.4, 0.16, 3.6, 5.6, 0.08, 6.9), std(0xFFFDF6, { roughness: 0.5 }), { cast: false }));
  const pool = mesh(boxG(3.8, 0.05, 3.0, 5.6, 0.15, 6.9), poolM, { cast: false }); pool.userData.keep = true; garden.add(pool);
  const stripes = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#FFF3DD' : '#D9474F'; g.fillRect(i * w / 8, 0, w / 8, h); } });
  const stripeM = std(0xffffff, { map: stripes, roughness: 0.7, side: THREE.DoubleSide });
  for (const x of [4.2, 5.4]) {
    const ch = new THREE.Group(); ch.add(mesh(boxG(0.6, 0.12, 1.4, 0, 0.3, 0), stripeM)); ch.add(mesh(boxG(0.6, 0.12, 0.6, 0, 0.55, -0.75).rotateX(0), stripeM));
    ch.children[1].rotation.x = -0.6; ch.position.set(x, 0, 9.2); garden.add(ch);
  }
  garden.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6).translate(6.9, 1.1, 9.0), std(0xEEE6D8)));
  garden.add(mesh(new THREE.ConeGeometry(1.2, 0.5, 16, 1, true).translate(6.9, 2.2, 9.0), stripeM));
  // trees and bushes
  const trunkM = std(0x7A5230);
  const tree = (x, z, s) => {
    garden.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.4 * s, 7).translate(x, 0.7 * s, z), trunkM));
    for (let i = 0; i < 3; i++) garden.add(part(new THREE.IcosahedronGeometry(1, 1), std(C.leaf[(((i + Math.round(x)) % 3) + 3) % 3], { flatShading: true, roughness: 0.8 }), [0.8 * s, 0.75 * s, 0.8 * s], [x + (i - 1) * 0.45 * s, (1.7 + (i % 2) * 0.35) * s, z + (i === 1 ? 0.2 : -0.1) * s]));
  };
  for (const [x, z, s] of [[-11.6, -3.8, 1.3], [-11.8, 1.2, 1.1], [-12, 8.8, 0.9], [-4.8, -4.6, 1.1], [3.5, -4.6, 1.2], [-10.3, -1.4, 0.8], [8.6, 9.1, 0.7]]) tree(x, z, s);
  // what stands right in front of the ground floor: hidden while the ground floor is seen from inside, so nothing stands in the way
  const fore = new THREE.Group(); fore.userData.own = true; garden.add(fore);
  const bushM = std(C.grass2, { flatShading: true });
  for (let i = 0; i < 9; i++) if (Math.abs(-5.6 + i * 1.4 - 1.5) > 1.2) fore.add(part(new THREE.IcosahedronGeometry(1, 1), bushM, [0.45, 0.35, 0.4], [-5.6 + i * 1.4, 0.25, 3.45]));
  // the lamps of the paths, lit with the plan
  const lampGlows = [], lampHeads = [];
  for (const [x, z] of [[0.3, 4.8], [2.7, 4.8], [0.3, 7.6], [2.7, 7.6], [-5.5, 8.3], [-2.5, 8.3]]) {
    const g = x > 0 ? fore : garden;
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 8).translate(x, 0.8, z), std(0x1F3B33, { metalness: 0.5, roughness: 0.4 })));
    const head = mesh(new THREE.SphereGeometry(0.15, 12, 8).translate(x, 1.7, z), new THREE.MeshBasicMaterial({ color: 0x8A8170 }), { cast: false }); g.add(head); lampHeads.push(head);
    const gl = glow(x, 1.7, z, 1.6, 0xFFC46A, false); if (x > 0) fore.add(gl); lampGlows.push(gl);
  }

  /* ---------- the building ---------- */
  const shell = new THREE.Group(); scene.add(shell);
  const facadeM = std(C.facade, { roughness: 0.85 }), trimM = std(C.trim, { roughness: 0.6 }), brassM = std(C.brass, { metalness: 0.85, roughness: 0.3 });
  shell.add(mesh(boxG(0.3, ROOF + 0.3, D, -W / 2 + 0.15, ROOF / 2, 0), facadeM));
  shell.add(mesh(boxG(0.3, ROOF + 0.3, D, W / 2 - 0.15, ROOF / 2, 0), facadeM));
  shell.add(mesh(boxG(W, ROOF, 0.3, 0, ROOF / 2, -D / 2 + 0.15), facadeM));
  for (let k = 1; k <= NF + 1; k++) shell.add(mesh(boxG(W + 0.4, 0.26, D + 0.3, 0, yOf(k) - 0.02, 0.1), trimM));
  shell.add(mesh(boxG(W + 0.2, 0.2, D, 0, 0.05, 0), trimM, { cast: false }));
  // the corners of the building, in cream, from the ground to the roof
  for (const x of [-W / 2, W / 2]) shell.add(mesh(boxG(0.4, ROOF, 0.4, x, ROOF / 2, D / 2), trimM));
  // the floors: front (fades when the floor is seen from inside) and inside (shown then)
  const floors = [], CUTS = [0, 2, 3];
  const GLASS = std(C.glass, { roughness: 0.08, metalness: 0.6, envMapIntensity: 1.4 });
  for (let k = 0; k <= NF; k++) {
    const y = yOf(k), h = k ? FH : H0, front = new THREE.Group(), inside = new THREE.Group(), mats = [facadeM.clone(), trimM.clone(), brassM.clone(), stripeM.clone()], cuts = CUTS.includes(k);
    if (cuts) for (const m of mats) m.transparent = true;
    const shape = new THREE.Shape(); shape.moveTo(-W / 2 + 0.2, 0); shape.lineTo(W / 2 - 0.2, 0); shape.lineTo(W / 2 - 0.2, h); shape.lineTo(-W / 2 + 0.2, h); shape.closePath();
    const holes = k ? WINS() : [[-4.2, 2.6, 0.5, 2.3], [-1.6, 1.6, 0.5, 2.3], [1.5, 1.3, 0.25, 2.55], [3.5, 2.0, 0.5, 2.3]];
    function WINS() { return Array.from({ length: 8 }, (_, i) => [WIN(i), 0.9, 0.55, 1.3]); }
    const frames = [], panes = [];
    for (const [cx, ww, y0, wh] of holes) {
      const p = new THREE.Path(), x0 = cx - ww / 2; p.moveTo(x0, y0); p.lineTo(x0, y0 + wh); p.lineTo(x0 + ww, y0 + wh); p.lineTo(x0 + ww, y0); p.closePath(); shape.holes.push(p);
      frames.push(boxG(ww + 0.16, 0.08, 0.14, cx, y0 - 0.04, 0.12), boxG(ww + 0.16, 0.08, 0.1, cx, y0 + wh + 0.04, 0.1), boxG(0.08, wh, 0.1, x0 - 0.04, y0 + wh / 2, 0.1), boxG(0.08, wh, 0.1, x0 + ww + 0.04, y0 + wh / 2, 0.1));
      if (k) frames.push(boxG(0.05, wh, 0.06, cx, y0 + wh / 2, 0.05), boxG(ww, 0.05, 0.06, cx, y0 + wh * 0.62, 0.05));
      panes.push([cx, ww, y0, wh]);
    }
    const wall = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false }), mats[0], { at: [0, y, D / 2 - 0.2] }); front.add(wall);
    const fr = mesh(merge(frames), mats[1], { at: [0, y, D / 2 - 0.05] }); front.add(fr);
    const glass = panes.map(([cx, ww, y0, wh], i) => {
      const unlit = GLASS.clone(), litM = new THREE.MeshBasicMaterial({ color: k ? C.lit : 0xFFD995, toneMapped: false, transparent: cuts }); unlit.transparent = cuts;
      const g = mesh(new THREE.PlaneGeometry(ww, wh), unlit, { cast: false, at: [cx, y + y0 + wh / 2, D / 2 - 0.12] });
      g.userData = { unlit, litM, on: false, i, keep: true }; front.add(g); return g;
    });
    // flower boxes under the windows of the first floor, an awning over the door and brass lamps by it
    if (k === 1) for (let i = 0; i < 8; i++) { front.add(mesh(boxG(0.75, 0.16, 0.22, WIN(i), y + 0.42, D / 2 + 0.12), mats[2])); for (let j = -1; j <= 1; j++) front.add(part(SPH, mat([0xE84A5F, 0xFFB347, 0xF7F3EA][(i + j + 3) % 3]), [0.09, 0.08, 0.09], [WIN(i) + j * 0.22, y + 0.55, D / 2 + 0.14])); }
    if (k === 3 || k === 5) for (const i of [1, 2, 5, 6]) { front.add(mesh(boxG(1.1, 0.06, 0.55, WIN(i), y + 0.5, D / 2 + 0.28), mats[1])); front.add(mesh(merge([boxG(1.1, 0.04, 0.04, 0, 0.45, 0.25), ...[-0.5, -0.25, 0, 0.25, 0.5].map(x => boxG(0.03, 0.45, 0.03, x, 0.22, 0.25))]), mats[2], { at: [WIN(i), y + 0.5, D / 2 + 0.28] })); }
    if (!k) {
      const aw = mesh(new THREE.BoxGeometry(2.0, 0.08, 1.4).translate(0, 0, 0.6), mats[3], { at: [1.5, y + 2.95, D / 2] }); aw.rotation.x = 0.28; front.add(aw);
      for (const x of [0.15, 2.85]) { front.add(mesh(boxG(0.12, 0.35, 0.12, x, y + 2.2, D / 2 + 0.12), mats[2])); glows.push(Object.assign(glow(x, y + 2.25, D / 2 + 0.25, 0.9, 0xFFC46A, false), { userData: { door: true } })); }
    }
    floors.push({ k, y, front, inside, mats, glass, fade: 1, cut: false });
    scene.add(front); scene.add(inside); inside.visible = false;
  }
  // the roof: a low wall, a water tank and the neon sign with its three stars
  shell.add(mesh(boxG(W + 0.4, 0.5, 0.25, 0, ROOF + 0.35, D / 2 + 0.1), trimM));
  for (const [x, z] of [[-3.6, -1.6], [-1.8, -1.6], [3.4, -1.8]]) { shell.add(mesh(boxG(1.2, 0.6, 0.9, x, ROOF + 0.45, z), std(0xD7D2C8, { roughness: 0.6 }))); shell.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16).translate(x, ROOF + 0.78, z), std(0x6B6F78, { metalness: 0.6, roughness: 0.4 }))); }
  for (const x of [-4.6, 4.6]) shell.add(mesh(boxG(0.12, 2.6, 0.12, x, ROOF + 1.4, 1.2), std(0x2A2F3A, { metalness: 0.6, roughness: 0.4 })));
  shell.add(mesh(boxG(9.6, 0.1, 0.1, 0, ROOF + 2.6, 1.2), std(0x2A2F3A, { metalness: 0.6, roughness: 0.4 })));
  let signLit = 0;
  const signTex = canvasTex(1024, 256, () => {}), drawSign = on => {
    const c = signTex.image, g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    g.font = '800 132px "Fraunces", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (on) { g.shadowColor = '#FF5FA8'; g.shadowBlur = 36; g.fillStyle = '#FF8AC2'; g.fillText("Hotel de l'Estany", w / 2, h / 2 + 6); g.shadowBlur = 10; g.fillStyle = '#FFE6F3'; g.fillText("Hotel de l'Estany", w / 2, h / 2 + 6); }
    else { g.fillStyle = '#5C5566'; g.fillText("Hotel de l'Estany", w / 2, h / 2 + 6); }
    signTex.needsUpdate = true;
  };
  drawSign(false); document.fonts?.ready.then(() => drawSign(signLit > 0.5));
  const sign = mesh(new THREE.PlaneGeometry(9.6, 2.4), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false, depthWrite: false }), { cast: false, at: [0, ROOF + 1.45, 1.28] });
  shell.add(sign);
  const signGlow = glow(0, ROOF + 1.4, 1.6, 9, 0xFF5FA8, false); signGlow.scale.set(13, 4.5, 1);
  const starShape = (() => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.17 : 0.4; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return s; })();
  const stars = [-1.1, 0, 1.1].map(x => {
    const m = mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.08, bevelEnabled: false }), std(0x6A5A3A, { metalness: 0.7, roughness: 0.4 }), { at: [x, ROOF + 3.25, 1.2] });
    m.userData.keep = true; shell.add(m); const gl = glow(x, ROOF + 3.25, 1.4, 1.6, 0xFFD36B, false); return { m, gl, on: false };
  });
  // the string of lights round the terrace of the roof
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 17);
  for (let i = 0; i <= 16; i++) { const x = -W / 2 + 0.2 + i * (W - 0.4) / 16, y = ROOF + 0.85 - Math.sin(i / 16 * Math.PI * 4) ** 2 * 0.25; bulbs.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, y, D / 2 + 0.2)); bulbs.setColorAt(i, new THREE.Color(0x6B5F50)); }
  shell.add(bulbs);

  /* ---------- inside: the lobby and the restaurant ---------- */
  const lobby = floors[0].inside;
  {
    const check = canvasTex(256, 256, (g, w) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#F3EAD7' : '#2F7A6C'; g.fillRect(i * 32, j * 32, 32, 32); } });
    check.wrapS = check.wrapT = THREE.RepeatWrapping; check.repeat.set(3, 3);
    lobby.add(mesh(boxG(W / 2 - 0.3, 0.04, D - 0.4, W / 4, 0.17, 0), std(0xffffff, { map: check, roughness: 0.35, envMapIntensity: 0.6 }), { cast: false }));
    const planks = canvasTex(256, 256, (g, w) => { for (let i = 0; i < 8; i++) { g.fillStyle = ['#B07B4F', '#A06E45', '#BC8758'][i % 3]; g.fillRect(0, i * 32, w, 31); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect((i * 97) % w, i * 32, 2, 32); } });
    planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(2, 2);
    lobby.add(mesh(boxG(W / 2 - 0.3, 0.04, D - 0.4, -W / 4, 0.17, 0), std(0xffffff, { map: planks, roughness: 0.6 }), { cast: false }));
    lobby.add(mesh(boxG(W - 0.6, H0 - 0.2, 0.05, 0, H0 / 2, -D / 2 + 0.33), std(C.wall)));
    lobby.add(mesh(boxG(0.12, H0 - 0.3, D - 1.6, 0, H0 / 2, -0.8), std(C.wall)));
    // the desk, the bell and the rack of keys
    const woodM = std(C.wood, { roughness: 0.55 });
    lobby.add(mesh(boxG(2.6, 1.0, 0.7, 3, 0.65, -0.8), woodM));
    lobby.add(mesh(boxG(2.75, 0.08, 0.85, 3, 1.18, -0.8), brassM));
    lobby.add(mesh(boxG(3.6, 2.2, 0.08, 3, 1.95, -2.62), std(0x6E4426, { roughness: 0.7 })));
    for (let i = 0; i < 5; i++) lobby.add(mesh(boxG(3.3, 0.05, 0.06, 3, 1.15 + i * 0.4, -2.55), brassM, { cast: false }));
    lobby.add(mesh(boxG(0.06, 2.1, 1.3, W / 2 - 0.33, 1.2, 0.2), std(0x3A3226, { metalness: 0.5, roughness: 0.4 })));
    lobby.add(mesh(boxG(0.08, 2.3, 1.5, W / 2 - 0.32, 1.25, 0.2), brassM));
  }
  const keyGeo = merge([boxG(0.06, 0.16, 0.03, 0, -0.1, 0), new THREE.TorusGeometry(0.05, 0.015, 6, 12).translate(0, 0.02, 0), boxG(0.12, 0.08, 0.02, 0, -0.24, 0)]);
  const keys = new THREE.InstancedMesh(keyGeo, std(C.brass, { metalness: 0.85, roughness: 0.3 }), 40), keyAt = (f, d) => V(3 - 1.4 + (d - 1) * 0.4, 1.12 + (f - 1) * 0.4 + 0.02, -2.5);
  { const m = new THREE.Matrix4(); for (let f = 1; f <= 5; f++) for (let d = 1; d <= 8; d++) { m.makeTranslation(keyAt(f, d)); keys.setMatrixAt((f - 1) * 8 + d - 1, m); } }
  lobby.add(keys);
  const keyLit = glow(0, -10, 0, 0.7, 0xFFE08A, false); lobby.add(keyLit);
  const bell = new THREE.Group(); bell.add(mesh(new THREE.SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), brassM)); bell.add(mesh(boxG(0.36, 0.03, 0.36, 0, 0, 0), std(0x2A2F3A)));
  const bellBtn = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8).translate(0, 0.19, 0), brassM); bell.add(bellBtn); bell.position.set(3.8, 1.23, -0.75); bell.userData.keep = true; lobby.add(bell);
  const grum = makeGuest('granota', true); grum.position.set(2.3, 0.62, -1.55); grum.userData.keep = true; lobby.add(grum);
  lobby.add(mesh(boxG(0.9, 0.45, 0.7, 2.3, 0.4, -1.55), std(0x5A3A24)));
  // the restaurant: tables with their cloths and chairs, the buffet and the lamps
  const tables = [];
  {
    const cloth = std(0xFFFDF6, { roughness: 0.8 }), chairM = std(C.cherry, { roughness: 0.6 }), legM = std(0x3A2A20);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x = -5.0 + c * 2.0, z = r ? 1.6 : -0.9, t = new THREE.Group();
      t.add(mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.55, 20).translate(0, 0.45, 0), cloth));
      t.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 20).translate(0, 0.75, 0), cloth));
      t.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8).translate(0, 0.9, 0), std(0xF2C14E, { emissive: 0xFFB347, emissiveIntensity: 0.6 })));
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; t.add(mesh(merge([boxG(0.32, 0.06, 0.32, 0, 0.42, 0), boxG(0.32, 0.4, 0.05, 0, 0.62, -0.16), ...[[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].map(([a, b]) => boxG(0.04, 0.4, 0.04, a, 0.2, b))]).rotateY(-a + Math.PI / 2).translate(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85), chairM)); }
      t.position.set(x, 0.17, z); lobby.add(t); tables.push(t);
    }
    lobby.add(mesh(boxG(4.2, 0.9, 0.6, -3, 0.62, -2.3), std(C.wood, { roughness: 0.55 })));
    for (let i = 0; i < 6; i++) lobby.add(part(SPH, mat([0xF2C14E, 0xE84A5F, 0x67B565][i % 3]), [0.14, 0.1, 0.14], [-4.6 + i * 0.64, 1.15, -2.3]));
  }
  // the rooms of each floor: eight, with a bed, a lamp and a rug each
  const rooms = [];
  for (let k = 1; k <= NF; k++) {
    const F = floors[k], y = F.y, list = [];
    F.inside.add(mesh(boxG(W - 0.6, FH - 0.3, 0.05, 0, y + FH / 2, -1.65), std([0xF6E2C6, 0xE4F1E8, 0xF3DCE0, 0xE6E4F6, 0xF7EBC8][k - 1])));
    for (let i = 1; i < 8; i++) F.inside.add(mesh(boxG(0.08, FH - 0.3, 2.85, -W / 2 + i * 1.5, y + FH / 2, -0.22), std(0xEFE6D6)));
    for (let i = 0; i < 8; i++) {
      const x = WIN(i), r = new THREE.Group(), blanket = [0xD9474F, 0x2F7A6C, 0xF2C14E, 0x6C7FD8][(i + k) % 4];
      r.add(mesh(boxG(1.38, 0.03, 2.8, 0, 0.13, -0.25), std([0xC9DCC9, 0xE9D2B4, 0xD6CBE8, 0xF0CBC8][(i + k) % 4], { roughness: 0.95 }), { cast: false }));
      r.add(mesh(boxG(1.2, 0.3, 0.85, 0, 0.3, -0.9), std(0xFFFDF6, { roughness: 0.8 })));
      r.add(mesh(boxG(0.82, 0.07, 0.87, 0.2, 0.48, -0.9), std(blanket, { roughness: 0.85 })));
      r.add(part(SPH, mat(0xffffff), [0.15, 0.08, 0.3], [-0.4, 0.5, -0.9]));
      r.add(mesh(boxG(0.06, 0.62, 0.85, -0.62, 0.45, -0.9), std(C.wood)));
      r.add(mesh(boxG(0.25, 0.4, 0.25, 0.5, 0.33, -1.45), std(C.wood)));
      const lamp = mesh(new THREE.SphereGeometry(0.09, 10, 8).translate(0.5, 0.65, -1.45), new THREE.MeshBasicMaterial({ color: 0x8A8170 }), { cast: false }); r.add(lamp);
      r.position.set(x, y, 0); F.inside.add(r); list.push({ r, lamp, on: false });
    }
    rooms[k] = list;
  }

  /* ---------- the lift ---------- */
  const lift = new THREE.Group(); scene.add(lift);
  const liftGlassM = new THREE.MeshPhysicalMaterial({ color: 0xBFE8F2, roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.22, envMapIntensity: 1.2, depthWrite: false });
  const LZ = 0, top = ROOF + 0.4, bot = yOf(-2);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lift.add(mesh(boxG(0.1, top - bot, 0.1, SX + x * SW / 2, (top + bot) / 2, LZ + z * SW / 2), brassM));
  for (let k = -2; k <= NF + 1; k++) lift.add(mesh(merge([boxG(SW, 0.06, 0.06, 0, 0, SW / 2), boxG(SW, 0.06, 0.06, 0, 0, -SW / 2), boxG(0.06, 0.06, SW, SW / 2, 0, 0)]), trimM, { at: [SX, k > NF ? top : yOf(k), LZ] }));
  const shaftGlass = new THREE.Mesh(new THREE.BoxGeometry(SW - 0.05, top, SW - 0.05).translate(SX, top / 2, LZ), liftGlassM); shaftGlass.renderOrder = 2; lift.add(shaftGlass);
  for (let k = 0; k <= NF; k++) shell.add(mesh(boxG(0.4, 0.15, 1.4, W / 2 + 0.05, yOf(k) + 0.08, 0), trimM, { cast: false }));
  const cabin = new THREE.Group(), cabinLight = new THREE.MeshBasicMaterial({ color: 0x8A8170 });
  cabin.add(mesh(boxG(1.8, 0.12, 1.8, 0, 0.06, 0), brassM));
  cabin.add(mesh(boxG(1.8, 0.1, 1.8, 0, 2.05, 0), brassM));
  for (const [x, z] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]]) cabin.add(mesh(boxG(0.07, 2.0, 0.07, x, 1.05, z), brassM));
  cabin.add(mesh(boxG(1.7, 0.04, 0.6, 0, 1.98, 0), cabinLight, { cast: false }));
  const doors = [-1, 1].map(s => { const d = mesh(boxG(0.05, 1.8, 0.82, 0, 1.0, 0), std(C.brass, { metalness: 0.7, roughness: 0.35, transparent: true, opacity: 0.85 })); d.position.set(-0.88, 0, s * 0.82); cabin.add(d); return d; });
  const cabinGlow = glow(0, 1.2, 0, 2.2, 0xFFD995, false); cabin.add(cabinGlow);
  cabin.position.set(SX, yOf(0) + 0.1, LZ); cabin.userData.keep = true; lift.add(cabin);
  const floorLabels = [];
  for (let k = -2; k <= NF; k++) { const l = label(k === 0 ? '0' : String(k)); l.position.set(SX + SW / 2 + 0.6, yOf(k) + 1.0, LZ + SW / 2 + 0.2); l.scale.set(0.8, 0.8, 0.8); scene.add(l); floorLabels.push(l); }

  /* ---------- the sky: far stars, clouds and fireflies ---------- */
  {
    const n = 220, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 220; pos[i * 3 + 1] = 15 + Math.random() * 70; pos[i * 3 + 2] = -70 - Math.random() * 30; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xFFF6E0, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false })));
  }
  const clouds = [];
  const cloudM = std(0xFFE6E0, { roughness: 1, flatShading: true, emissive: 0x553355, emissiveIntensity: 0.25 });
  for (const [x, y, z, s] of [[-30, 26, -40, 3], [18, 30, -45, 4], [40, 20, -35, 2.5], [-8, 34, -55, 3.5]]) {
    const c = new THREE.Group();
    for (let i = 0; i < 5; i++) c.add(part(new THREE.IcosahedronGeometry(1, 1), cloudM, [s * (1 - Math.abs(i - 2) * 0.18), s * 0.7, s * 0.8], [(i - 2) * s * 0.8, (i % 2) * s * 0.3, 0]));
    c.position.set(x, y, z); c.children.forEach(m => { m.castShadow = false; }); scene.add(c); clouds.push(c);
  }
  const NFL = RM ? 0 : 16, flies = Array.from({ length: NFL }, () => ({ p: Math.random() * 7, x: -8.2 + (Math.random() - 0.5) * 6, z: 6.2 + (Math.random() - 0.5) * 4 }));
  const flyPos = new Float32Array(NFL * 3), flyCol = new Float32Array(NFL * 3), flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3)); flyGeo.setAttribute('color', new THREE.BufferAttribute(flyCol, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: GLOW, size: 0.45, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flyPts.frustumCulled = false; if (NFL) scene.add(flyPts);

  /* ---------- the party: confetti and sparkles ---------- */
  const N = 260, confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 0.22), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N);
  confetti.frustumCulled = false; confetti.count = 0; scene.add(confetti);
  const bits = [], tmp = new THREE.Object3D(), PAL = [0xFF5FA8, 0xFFD36B, 0x7CF5B0, 0x6FE3FF, 0xFFFFFF, 0xD9474F].map(c => new THREE.Color(c));
  const sparks = [];
  function burst(at, n, power = 6) {
    if (RM) return;
    for (let i = 0; i < n && bits.length < N; i++) {
      const a = Math.random() * Math.PI * 2, u = Math.random() * 0.8 + 0.4;
      bits.push({ p: at.clone(), v: V(Math.cos(a) * power * (0.3 + Math.random() * 0.6), power * u, Math.sin(a) * power * (0.3 + Math.random() * 0.6)), r: V(Math.random() * 6, Math.random() * 6, 0), w: V(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4), life: 2.2 + Math.random(), c: PAL[i % PAL.length] });
    }
  }
  function sparkle(at, n = 10, c = 0xFFE08A) {
    if (RM) return;
    for (let i = 0; i < n; i++) { const s = glow(at.x, at.y, at.z, 0.45, c); const a = Math.random() * Math.PI * 2; s.userData = { v: V(Math.cos(a) * 1.6, 1.5 + Math.random() * 1.6, Math.sin(a) * 1.6), life: 0.8 + Math.random() * 0.4 }; sparks.push(s); }
  }

  /* ---------- everything that never moves, baked into a few meshes ---------- */
  bake(fore); bake(garden); bake(park); bake(shell); bake(lift);
  for (const F of floors) { if (!CUTS.includes(F.k)) bake(F.front); bake(F.inside); }
  clouds.forEach(bake);

  /* ---------- the camera ---------- */
  // a view: what it looks at (t), where from (dir, the way from t to the camera) and how big the thing is (R), so it fits the free part
  // of the screen; cut the floors seen from inside
  const VIEWS = {
    map: { t: [-1.2, 5.6, 1.5], dir: [0.5, 0.3, 1], R: 14.2 },
    pool: { t: [3.2, 1.6, 6.2], dir: [0.35, 0.42, 1], R: 6.2 },
    lobby: { t: [2.7, 1.55, -0.8], dir: [0.06, 0.13, 1], R: 3.3, cut: [0] },
    desk: { t: [3, 1.45, -1.3], dir: [0.12, 0.16, 1], R: 2.9, cut: [0] },
    restaurant: { t: [-3, 1.0, 0.3], dir: [-0.08, 0.55, 1], R: 3.9, cut: [0] },
    rooms: { t: [-1.5, yOf(2) + 0.95, 0], dir: [0, 0.3, 1], R: 4.3, cut: [2] },
    clean: { t: [WIN(1), yOf(3) + 0.8, -0.2], dir: [0.08, 0.55, 1], R: 2.4, cut: [3] },
    garden: { t: [-1.2, 0, 5.8], dir: [0, 1.5, 1], R: 7.6 },
    facade: { t: [0, ROOF / 2 + 0.6, 0], dir: [0, 0.12, 1], R: 10.2 },
    lift: { t: [SX, 2, 0], dir: [1, 0.22, 0.42], R: 4.8, follow: true },
    roof: { t: [0, ROOF + 1.6, 0], dir: [-0.2, 0.5, 1], R: 6.2 }
  };
  const cam = { t: V(0, 5, 0), p: V(-14, 13, 34), ox: 0, oy: 0, name: 'map', R: 14 };
  let lay = { kind: 'full', f: 0, px: 0 }, W0 = 1, H1 = 1, follow = false;
  // where the camera goes for view v in the free part of the screen: the distance that makes a ball of radius R fit it
  function place(v) {
    const fw = lay.kind === 'right' ? W0 - lay.px : W0, fh = lay.kind === 'bottom' ? H1 * (1 - lay.f) : H1;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = v.R * H1 / (tan * Math.min(fw, fh)) * 1.05;
    const dir = V(...v.dir).normalize(), t = V(...v.t);
    return { t, p: t.clone().add(dir.multiplyScalar(d)), ox: lay.kind === 'right' ? lay.px / 2 : 0, oy: lay.kind === 'bottom' ? H1 * lay.f / 2 : 0 };
  }
  let flight = null;
  function go(name, o = {}) {
    const v = VIEWS[name] || VIEWS.map; cam.name = name; follow = !!v.follow;
    const to = place(follow ? { ...v, t: [SX, cabin.position.y + 1.1, 0] } : v), from = { t: cam.t.clone(), p: cam.p.clone(), ox: cam.ox, oy: cam.oy };
    for (const F of floors) setCut(F, (v.cut || []).includes(F.k));
    wake();
    if (RM || o.instant) { Object.assign(cam, { t: to.t, p: to.p, ox: to.ox, oy: to.oy }); flight = null; return Promise.resolve(); }
    const dur = o.dur || 1300;
    return new Promise(res => { flight = { t0: performance.now(), dur, from, to, res, arc: from.p.distanceTo(to.p) > 12 }; });
  }
  function setCut(F, on) { if (F.cut === on) return; F.cut = on; if (on) F.inside.visible = true; }
  function layout(kind, x = 0) {
    lay = kind === 'bottom' ? { kind, f: x, px: 0 } : kind === 'right' ? { kind, f: 0, px: x } : { kind: 'full', f: 0, px: 0 };
    go(cam.name, { dur: 700 });
  }
  function resize() {
    W0 = innerWidth; H1 = innerHeight;
    renderer.setSize(W0, H1, false); camera.aspect = W0 / H1; camera.updateProjectionMatrix();
    const to = place(VIEWS[cam.name] || VIEWS.map); if (!flight) Object.assign(cam, { t: follow ? cam.t : to.t, p: follow ? cam.p : to.p, ox: to.ox, oy: to.oy }); wake();
  }
  addEventListener('resize', resize);

  /* ---------- the guests that come and go ---------- */
  // where a guest comes in (door), the way to where it waits (to) and the way out (out), at each place; pop: it appears there instead of
  // walking in from outside
  const Y0 = 0.19, Y2 = yOf(2) + 0.2, Y3 = yOf(3) + 0.2;
  const SPOTS = {
    lobby: { door: [1.5, Y0, 2.9], to: [[1.5, Y0, 2.0], [3.0, Y0, 0.25]], out: [[4.6, Y0, 0.7], [5.55, Y0, 0.2]], s: 0.9, pop: true },
    restaurant: { door: [1.2, Y0, 2.9], to: [[1.2, Y0, 2.3], [-1.4, Y0, 2.1]], out: [[-2.6, Y0, 2.3], [-3.0, Y0, 0.35]], s: 0.8, pop: true },
    pool: { door: [8.6, 0.05, 4.3], to: [[4.2, 0.05, 4.3]], out: [[1.5, 0.05, 4.4], [1.5, 0.05, 9.9]], s: 0.9 },
    garden: { door: [1.5, 0.05, 9.9], to: [[1.5, 0.05, 6.4]], out: [[1.5, 0.05, 7.4], [-3.5, 0.05, 7.4]], s: 1.0 },
    rooms: { door: [-5.2, Y2, 2.0], to: [[-3.0, Y2, 2.0]], out: [[5.3, Y2, 2.0]], s: 0.8, pop: true },
    clean: { door: [-5.2, Y3, 2.0], to: [[-3.0, Y3, 1.9]], out: [[5.3, Y3, 2.0]], s: 0.8, pop: true }
  };
  SPOTS.desk = SPOTS.lobby;
  const actors = [];
  let guestNow = null;
  function walk(a, pts, speed) { a.userData.path = pts.map(p => V(...p)); if (speed) a.userData.speed = speed; wake(); return new Promise(res => { a.userData.done = res; }); }
  function toward(a, p) { a.userData.face = p; }
  function remove(a) { a.parent?.remove(a); const i = actors.indexOf(a); if (i >= 0) actors.splice(i, 1); }
  // the guest before goes away by the way out of its place
  function shoo() { const old = guestNow; guestNow = null; if (!old) return; if (old.userData.cabin) { remove(old); return; } walk(old, old.userData.out, 2.4).then(() => remove(old)); }
  // a guest of species sp comes to the place of the view on show; resolves when it is waiting there
  function guest(sp, where = cam.name) {
    shoo();
    if (!sp) return Promise.resolve();
    if (where === 'lift') {
      const a = makeGuest(sp); a.scale.setScalar(0.85); a.position.set(-0.1, 0.12, 0.1); a.rotation.y = 0.9; cabin.add(a); actors.push(a); guestNow = a; a.userData.cabin = true;
      return pop(a);
    }
    const S = SPOTS[where]; if (!S) return Promise.resolve();
    const a = makeGuest(sp); a.scale.setScalar(S.s); a.position.set(...S.door); a.userData.out = S.out; scene.add(a); actors.push(a); guestNow = a;
    if (S.pop) pop(a);
    return walk(a, S.to, 1.9).then(() => { if (guestNow === a) toward(a, camera.position.clone()); });
  }
  function pop(a) { const s = a.scale.x; a.scale.setScalar(0.01); return tween(380, k => a.scale.setScalar(Math.max(0.01, s * (k < 0.7 ? k / 0.7 * 1.15 : 1.15 - (k - 0.7) / 0.3 * 0.15))), easeOut); }
  // the hop of joy: down to gather, up stretched, down squashed, back; with sparkles over the head
  function hop(a) {
    const b = a.userData.body;
    const wp = new THREE.Vector3(); a.getWorldPosition(wp); wp.y += 1.1 * a.scale.y; sparkle(wp, 9);
    return tween(620, k => {
      let sy = 1, y = 0;
      if (k < 0.18) sy = 1 - 0.25 * (k / 0.18);
      else if (k < 0.62) { const j = (k - 0.18) / 0.44; y = Math.sin(j * Math.PI) * 0.55; sy = 1.18 - 0.18 * j; }
      else if (k < 0.8) sy = 1 - 0.22 * Math.sin((k - 0.62) / 0.18 * Math.PI);
      b.position.y = y; b.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    }, k => k);
  }
  const happy = () => guestNow ? hop(guestNow) : Promise.resolve();
  // a no: the head shakes a little
  function sad() {
    const a = guestNow; if (!a) return; const b = a.userData.body;
    tween(420, k => { b.rotation.y = Math.sin(k * Math.PI * 4) * 0.35 * (1 - k); }, k => k);
  }
  // the guest goes by the way out of its place (to the lift, at the lobby); with a room, its window lights when it is gone
  function leave(o = {}) {
    const a = guestNow; guestNow = null; if (!a) return Promise.resolve();
    if (a.userData.cabin) return tween(300, k => a.scale.setScalar(Math.max(0.01, 0.85 * (1 - k)))).then(() => remove(a));
    return walk(a, a.userData.out, 2.2).then(() => {
      remove(a);
      if (o.room) { const f = Math.floor(o.room / 100), d = o.room % 100; if (f >= 1 && f <= NF && d >= 1 && d <= 8) setWindow(f, d - 1, true, true); }
    });
  }
  // guests sat at table i (or in room i of floor k): n of them, at once, with a pop each
  const crowdList = [];
  function seat(kind, i, n, sp, k = 2) {
    const spots = [];
    if (kind === 'table') { const t = tables[i]; if (!t) return; for (let j = 0; j < n; j++) { const a = j / Math.max(4, n) * Math.PI * 2 + Math.PI / 4; spots.push([t.position.x + Math.cos(a) * 0.85, 0.42, t.position.z + Math.sin(a) * 0.85, Math.atan2(-Math.cos(a), -Math.sin(a))]); } }
    else { const r = rooms[k]?.[i]; if (!r) return; for (let j = 0; j < n; j++) spots.push([r.r.position.x + (j % 2 ? 0.3 : -0.3), r.r.position.y + 0.15, 0.15 + Math.floor(j / 2) * 0.6, 0]); setRoom(k, i, true); }
    spots.forEach(([x, y, z, ry], j) => { const a = makeGuest(sp); a.scale.setScalar(0.62); a.position.set(x, y, z); a.rotation.y = ry; scene.add(a); crowdList.push(a); actors.push(a); setTimeout(() => pop(a), j * 90); });
    wake();
  }
  function crowd() { for (const a of crowdList.splice(0)) remove(a); for (let k = 1; k <= NF; k++) rooms[k].forEach((_, i) => setRoom(k, i, false)); }

  /* ---------- the lights that go on ---------- */
  function setWindow(k, i, on, flash = false) {
    const g = floors[k]?.glass[i]; if (!g || g.userData.on === on) return;
    g.userData.on = on; g.material = on ? g.userData.litM : g.userData.unlit;
    if (on && flash && !RM) { const m = g.userData.litM; tween(900, x => { m.color.setHex(C.lit).multiplyScalar(1 + 2.2 * (1 - x)); }); const wp = new THREE.Vector3(); g.getWorldPosition(wp); sparkle(wp.add(V(0, 0, 0.3)), 8, 0xFFD36B); }
    wake();
  }
  function setRoom(k, i, on) { const r = rooms[k]?.[i]; if (!r) return; r.on = on; r.lamp.material.color.setHex(on ? 0xFFE6A0 : 0x8A8170); }
  // which windows are lit when a floor is open: most of them, never all, always the same
  const LITMAP = Array.from({ length: NF + 1 }, (_, k) => Array.from({ length: 8 }, (_, i) => ((i * 7 + k * 3) % 10) < 7));
  let parts = [];
  // the hotel as the progress has it: p.piscina, valid (the projects validated) and stars (the exams passed)
  function state({ piscina = false, valid = [], stars: n = 0 } = {}) {
    const has = i => valid.includes(i);
    parts = valid;
    signTo(piscina ? 1 : 0);
    // the ground floor with the keys; the lift; floors 1, 2 and 3 with the bookings, the rooms and the cleaning; the garden with the plan;
    // the restaurant; floor 4 with the bill; floor 5 and the roof with the numbers
    floors[0].glass.forEach((g, i) => setWindow(0, i, i < 2 ? has(6) : has(0) || (i === 2 && piscina)));
    glows.filter(g => g.userData.door).forEach(g => { g.userData.on = piscina; g.material.opacity = piscina ? floors[0].fade : 0; });
    cabinLight.color.setHex(has(1) ? 0xFFF1C8 : 0x8A8170); cabinGlow.material.opacity = has(1) ? 0.8 : 0;
    [[1, 2], [2, 3], [3, 4], [4, 7], [5, 8]].forEach(([k, p]) => floors[k].glass.forEach((_, i) => setWindow(k, i, has(p) && LITMAP[k][i])));
    lampGlows.forEach(g => { g.material.opacity = has(5) ? 1 : 0; }); lampHeads.forEach(h => h.material.color.setHex(has(5) ? 0xFFE6A0 : 0x8A8170));
    for (let i = 0; i <= 16; i++) bulbs.setColorAt(i, new THREE.Color(has(8) ? [0xFFD36B, 0xFF8AC2, 0x7CF5B0, 0x6FE3FF][i % 4] : 0x6B5F50)); bulbs.instanceColor.needsUpdate = true;
    stars.forEach((s, i) => { const on = i < n; s.on = on; s.m.material.color.setHex(on ? 0xFFD36B : 0x6A5A3A); s.m.material.emissive?.setHex(on ? 0xB07A10 : 0); s.gl.material.opacity = on ? 0.9 : 0; });
    wake();
  }
  function signTo(v) { if ((v > 0.5) !== (signLit > 0.5)) drawSign(v > 0.5); signLit = v; signGlow.material.opacity = v * 0.55; }
  // the sign lights up, with the flicker of a neon that starts
  function openSign() {
    if (RM) { signTo(1); return Promise.resolve(); }
    const steps = [1, 0, 1, 0, 0, 1, 0.3, 1];
    return steps.reduce((p, v, i) => p.then(() => new Promise(r => setTimeout(() => { signTo(v); wake(); r(); }, i ? 90 + (i % 3) * 70 : 0))), Promise.resolve())
      .then(() => { const at = V(0, ROOF + 1.5, 2); burst(at, 120, 7); });
  }
  // the hotel lit as a chart: n of the 40 windows of the rooms, one after another
  function occupancy(n) {
    const order = Array.from({ length: 40 }, (_, i) => i).sort((a, b) => ((a * 17) % 40) - ((b * 17) % 40));
    order.forEach((j, x) => setTimeout(() => setWindow(1 + Math.floor(j / 8), j % 8, x < n, x < n), RM ? 0 : x * 35));
    if (n === 0) state({ piscina: signLit > 0.5, valid: parts, stars: stars.filter(s => s.on).length });
  }
  // a part of the hotel that glows while its project is under the finger on the map
  const hl = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xFFD36B, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const hlEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xFFE08A, transparent: true, opacity: 0, toneMapped: false }));
  scene.add(hl); scene.add(hlEdge);
  const HL = [[3, H0 / 2, 0, 6, H0, D], [SX, (ROOF + yOf(-2)) / 2, 0, SW, ROOF - yOf(-2), SW], [0, yOf(1) + FH / 2, 0, W, FH, D], [0, yOf(2) + FH / 2, 0, W, FH, D], [0, yOf(3) + FH / 2, 0, W, FH, D],
    [-1.5, 0.3, 6.5, 19, 0.6, 7], [-3, H0 / 2, 0, 6, H0, D], [0, yOf(4) + FH / 2, 0, W, FH, D], [0, yOf(5) + FH / 2 + 0.8, 0, W, FH + 1.6, D]];
  let hlOn = -1;
  function highlight(i) { hlOn = i ?? -1; if (hlOn >= 0) { const [x, y, z, w, h, d] = HL[hlOn]; for (const b of [hl, hlEdge]) { b.position.set(x, y, z); b.scale.set(w + 0.3, h + 0.2, d + 0.3); } } wake(); }

  /* ---------- the lift moves ---------- */
  let liftAt = 0;
  const L = {
    get at() { return liftAt; },
    set(f) { liftAt = f; cabin.position.y = yOf(f) + 0.1; },
    // to floor f, with its doors shut on the way and open at the end; resolves on arriving
    go(f) {
      const from = cabin.position.y, to = yOf(f) + 0.1, n = Math.abs(f - liftAt); liftAt = f;
      if (!n) return Promise.resolve();
      const dur = RM ? 0 : 420 + 260 * Math.min(n, 7);
      return doorsTo(0).then(() => tween(dur, k => { cabin.position.y = from + (to - from) * k; }, ease)).then(() => doorsTo(1));
    }
  };
  // the doors of the cabin: 1 open, 0 shut
  function doorsTo(o) { const z0 = doors[1].position.z, z1 = o ? 0.82 : 0.42; return tween(RM ? 0 : 240, k => { const z = z0 + (z1 - z0) * k; doors[1].position.z = z; doors[0].position.z = -z; }); }
  function key(f, d) { if (f < 1 || f > 5 || d < 1 || d > 8) { keyLit.material.opacity = 0; return; } keyLit.position.copy(keyAt(f, d)).add(V(0, -0.1, 0.08)); keyLit.material.opacity = 1; wake(); }
  function ding() { tween(220, k => { bellBtn.position.y = -Math.sin(k * Math.PI) * 0.05; }); }
  // the camera shakes for a heavy moment
  let shakeT = 0, shakeA = 0;
  const shake = (a = 0.12) => { if (!RM) { shakeT = 0.35; shakeA = a; wake(); } };
  // confetti over the place on show: tier 1, 2 or 3
  function celebrate(tier = 1) {
    const at = cam.t.clone().add(V(0, 1.5, 0)), n = [0, 40, 90, 200][tier] || 40;
    burst(at, n, 4 + tier * 1.5);
    if (tier >= 3) { setTimeout(() => burst(V(-5, ROOF + 2, 2), 80, 7), 250); setTimeout(() => burst(V(5, ROOF + 2, 2), 80, 7), 500); shake(0.08); }
  }

  /* ---------- the loop ---------- */
  const tw = [];
  function tween(dur, step, e = ease) { wake(); if (!dur) { step(1); return Promise.resolve(); } return new Promise(res => tw.push({ t0: performance.now(), dur, step, e, res })); }
  let last = performance.now(), quiet = 0, paused = false, frame = 0, raf = 0;
  function wake() { quiet = 0; if (!raf && !paused) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  const look = new THREE.Vector3();
  function loop(now) {
    if (paused) { raf = 0; return; }
    raf = requestAnimationFrame(loop); frame++;
    if (quiet > 90 && frame % 3) return;
    // dt moves things (at most a twentieth of a second a frame, so nothing jumps); raw is the real time, for what only fades
    const raw = Math.min(0.5, (now - last) / 1000), dt = Math.min(0.05, raw); last = now;
    let busy = tw.length > 0 || !!flight || bits.length > 0 || sparks.length > 0 || shakeT > 0;
    for (let i = tw.length - 1; i >= 0; i--) { const x = tw[i], k = Math.min(1, (now - x.t0) / x.dur); x.step(x.e(k)); if (k >= 1) { tw.splice(i, 1); x.res(); } }
    if (flight) {
      const k = Math.min(1, (now - flight.t0) / flight.dur), e = ease(k), f = flight.from, to = flight.to;
      cam.t.lerpVectors(f.t, to.t, e); cam.p.lerpVectors(f.p, to.p, e); if (flight.arc) cam.p.y += Math.sin(e * Math.PI) * 3;
      cam.ox = f.ox + (to.ox - f.ox) * e; cam.oy = f.oy + (to.oy - f.oy) * e;
      if (k >= 1) { const r = flight.res; flight = null; r(); }
    }
    for (const F of floors) {
      const target = F.cut ? 0 : 1;
      if (F.fade !== target) { F.fade = THREE.MathUtils.clamp(F.fade + (F.cut ? -1 : 1) * raw * 2.2, 0, 1); busy = true; }
      const o = F.fade, vis = o > 0.01;
      F.front.visible = vis;
      if (CUTS.includes(F.k)) { for (const m of F.mats) m.opacity = o; for (const g of F.glass) { g.userData.unlit.opacity = o; g.userData.litM.opacity = o; } }
      if (!F.cut && o >= 1) F.inside.visible = false;
      if (F.k === 0) { fore.visible = o > 0.05; for (const g of glows) if (g.userData.door) g.material.opacity = Math.min(g.userData.on ? 1 : 0, o); }
    }
    if (follow && !flight) { const ty = cabin.position.y + 1.1; if (Math.abs(cam.t.y - ty) > 0.001) { const d = (ty - cam.t.y) * Math.min(1, raw * 4); cam.t.y += d; cam.p.y += d; busy = true; } }
    // the guests
    for (const a of actors) {
      const u = a.userData; u.t += dt;
      if (u.path.length) {
        busy = true;
        const p = u.path[0], d = p.clone().sub(a.position); d.y = 0;
        const step = u.speed * dt;
        if (d.length() <= step) { a.position.x = p.x; a.position.z = p.z; a.position.y = p.y; u.path.shift(); if (!u.path.length) { const r = u.done; u.done = null; r?.(); } }
        else { d.normalize(); a.position.addScaledVector(d, step); a.position.y += (p.y - a.position.y) * Math.min(1, dt * 6); const want = Math.atan2(d.x, d.z); a.rotation.y += Math.atan2(Math.sin(want - a.rotation.y), Math.cos(want - a.rotation.y)) * Math.min(1, dt * 10); }
        u.body.position.y = Math.abs(Math.sin(u.t * 11)) * 0.07; u.body.rotation.z = Math.sin(u.t * 11) * 0.09;
      } else if (u.face) {
        const want = Math.atan2(u.face.x - a.position.x, u.face.z - a.position.z), dd = Math.atan2(Math.sin(want - a.rotation.y), Math.cos(want - a.rotation.y));
        a.rotation.y += dd * Math.min(1, dt * 6); if (Math.abs(dd) < 0.01) u.face = null; else busy = true; u.body.rotation.z *= 0.8;
      }
      if (!u.path.length && !RM) { u.body.scale.y = u.body.scale.y * 0.8 + (1 + Math.sin(u.t * 2.4) * 0.025) * 0.2; }
    }
    // the bellhop at the desk breathes and looks about
    grum.userData.t += dt; grum.userData.body.scale.y = 1 + Math.sin(grum.userData.t * 2) * 0.03; grum.rotation.y = Math.sin(grum.userData.t * 0.5) * 0.3;
    lilyFrog.rotation.y = 0.5 + Math.sin(now * 0.0004) * 0.4;
    if (!RM) {
      flies.forEach((u, i) => { u.p += dt; flyPos[i * 3] = u.x + Math.sin(u.p * 0.7) * 0.8; flyPos[i * 3 + 1] = 1.1 + Math.sin(u.p * 1.3) * 0.4; flyPos[i * 3 + 2] = u.z + Math.cos(u.p * 0.5) * 0.6; const b = 0.3 + 0.7 * Math.sin(u.p * 2.1) ** 2; flyCol[i * 3] = 0.85 * b; flyCol[i * 3 + 1] = b; flyCol[i * 3 + 2] = 0.55 * b; });
      if (NFL) { flyGeo.attributes.position.needsUpdate = true; flyGeo.attributes.color.needsUpdate = true; }
      for (const c of clouds) { c.position.x += dt * 0.25; if (c.position.x > 70) c.position.x = -70; }
      pads.forEach((p, i) => { p.position.y = 0.07 + Math.sin(now * 0.0012 + i) * 0.012; });
      poolM.emissiveIntensity = 0.22 + Math.sin(now * 0.0015) * 0.06;
      if (hlOn >= 0) { const p = Math.sin(now * 0.005); hl.material.opacity = 0.22 + p * 0.1; hlEdge.material.opacity = 0.75 + p * 0.25; busy = true; } else hl.material.opacity = hlEdge.material.opacity = 0;
    } else { hl.material.opacity = hlOn >= 0 ? 0.25 : 0; hlEdge.material.opacity = hlOn >= 0 ? 1 : 0; }
    // confetti and sparkles
    let n = 0;
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i]; b.life -= dt; if (b.life <= 0 || b.p.y < PL.y0) { bits.splice(i, 1); continue; }
      b.v.y -= 7 * dt; b.v.multiplyScalar(0.985); b.p.addScaledVector(b.v, dt); b.r.addScaledVector(b.w, dt);
      tmp.position.copy(b.p); tmp.rotation.set(b.r.x, b.r.y, b.r.z); tmp.scale.setScalar(Math.min(1, b.life)); tmp.updateMatrix();
      confetti.setMatrixAt(n, tmp.matrix); confetti.setColorAt(n, b.c); n++;
    }
    confetti.count = n; confetti.instanceMatrix.needsUpdate = true; if (confetti.instanceColor) confetti.instanceColor.needsUpdate = true;
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i], u = s.userData; u.life -= dt; if (u.life <= 0) { scene.remove(s); s.material.dispose(); sparks.splice(i, 1); glows.splice(glows.indexOf(s), 1); continue; } u.v.y -= 2.5 * dt; s.position.addScaledVector(u.v, dt); s.material.opacity = Math.min(1, u.life * 2); s.scale.setScalar(0.45 * Math.min(1, u.life * 1.5)); }
    // the camera, with a slow sway on the map
    let sway = 0;
    if (cam.name === 'map' && !RM) { sway = Math.sin(now * 0.00018) * 0.09; busy = busy || false; }
    look.copy(cam.p).sub(cam.t).applyAxisAngle(V(0, 1, 0), sway).add(cam.t);
    if (shakeT > 0) { shakeT -= dt; const a = shakeA * (shakeT / 0.35); look.add(V((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, 0)); }
    camera.position.copy(look); camera.lookAt(cam.t);
    camera.setViewOffset(W0, H1, cam.ox, cam.oy, W0, H1);
    renderer.render(scene, camera);
    // a still scene draws only now and then: the fireflies and the sway are slow
    quiet = busy ? 0 : quiet + 1;
  }
  document.addEventListener('visibilitychange', () => { paused = document.hidden; if (!paused) wake(); });
  resize(); go('map', { instant: true }); wake();

  return { ok: true, layout, go, state, highlight, guest, happy, sad, leave, bell: ding, key, lift: L, seat, crowd, occupancy, celebrate, shake, openSign,
    room: (k, i, on) => setRoom(k, i, on), pause(on) { paused = on; if (!on) wake(); } };
}
