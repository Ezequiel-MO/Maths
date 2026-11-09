// What a 3D game of the pond shares, with Three.js: a diorama that floats in the dusk, a camera that flies from one place of it to another
// and frames it in the part of the screen the panel leaves free, the loop that draws only while something moves, confetti and sparkles.
// Copied from the hotel (games/hotel-de-l-estany/world.js), which keeps its own copy until it has been tried on the tablet. Each game
// builds its own world on top: diorama() gives the scene, the camera and these tools, and the game adds what is its own.
// Without WebGL diorama() throws: the game catches it and gives the same calls doing nothing.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RM } from './util.js';
export { THREE };

export const ease = k => k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
export const easeOut = k => 1 - (1 - k) ** 3;
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- small makers ---------- */
export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export const boxG = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
export const merge = gs => mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g), false);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
export function mesh(g, m, o = {}) {
  const x = new THREE.Mesh(g, m);
  if (o.cast !== false) x.castShadow = true;
  if (o.receive !== false) x.receiveShadow = true;
  if (o.at) x.position.set(...o.at);
  return x;
}
export const SPH = new THREE.SphereGeometry(1, 20, 14), CONE = new THREE.ConeGeometry(1, 1, 16), CYL = new THREE.CylinderGeometry(1, 1, 1, 20);
// shapes many things share: a picture that goes away never gives them back
for (const g of [SPH, CONE, CYL]) g.userData.shared = true;
export function part(g, m, s, p, r) { const x = new THREE.Mesh(g, m); x.scale.set(...s); x.position.set(...p); if (r) x.rotation.set(...r); x.castShadow = true; return x; }
// one material per colour and finish, shared
const MAT = new Map();
export const mat = (c, o) => { const k = c + JSON.stringify(o || {}); if (!MAT.has(k)) MAT.set(k, std(c, { roughness: 0.55, ...o })); return MAT.get(k); };

// Static furniture drawn at once. Every plain mesh under root (a MeshStandardMaterial with no texture, opaque, shown) is merged with the
// others of the same finish into a single mesh that keeps its colours in its vertices: hundreds of little shapes become a handful of draws,
// which is what a tablet can keep at sixty frames a second. What moves or changes (userData.keep) and the groups baked on their own
// (userData.own) are left as they are; the groups stay where they were, only their meshes go.
export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), dead = [], M = new THREE.Matrix4();
  (function visit(o) {
    for (const c of o.children) {
      if (c.userData.keep || c.userData.own) continue;
      const m = c.material;
      if (c.isMesh && !c.isInstancedMesh && m && !Array.isArray(m) && m.isMeshStandardMaterial && !m.map && !m.transparent && c.visible) {
        const key = [m.roughness, m.metalness, m.flatShading, m.emissive.getHex(), m.emissiveIntensity, m.envMapIntensity, m.side, c.castShadow].join();
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
    const mm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: m.roughness, metalness: m.metalness, flatShading: m.flatShading, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, envMapIntensity: m.envMapIntensity, side: m.side });
    const x = new THREE.Mesh(mergeGeometries(gs), mm); x.castShadow = cast; x.receiveShadow = true; root.add(x);
  }
  return root;
}
// a soft round light, for the glows and the sparkles
export const glowTex = () => canvasTex(128, 128, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,240,200,0.55)'); r.addColorStop(1, 'rgba(255,220,160,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, w);
});
// A word on a sign that always looks at the camera: draw(g, w, h) paints it, or text with the colours of o (bg, ring, ink, font).
// The sprite is h tall in the world and as wide as its text
export function label(text, o = {}) {
  const font = o.font || '800 120px "Baloo 2", system-ui, sans-serif', H = 160;
  const probe = document.createElement('canvas').getContext('2d'); probe.font = font;
  const W = Math.max(H, Math.ceil(probe.measureText(text).width + (o.bg ? 70 : 24)));
  const t = canvasTex(W, H, g => {
    if (o.bg) { g.fillStyle = o.bg; g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, (H - 12) / 2); g.fill(); if (o.ring) { g.lineWidth = 10; g.strokeStyle = o.ring; g.stroke(); } }
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = 24; }
    if (o.edge) { g.lineWidth = 16; g.strokeStyle = o.edge; g.lineJoin = 'round'; g.strokeText(text, W / 2, H / 2 + 8); }
    g.fillStyle = o.ink || '#FFFFFF'; g.fillText(text, W / 2, H / 2 + 8);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: o.depthTest ?? true, toneMapped: false }));
  const h = o.h || 0.5; s.scale.set(h * W / H, h, 1); s.renderOrder = o.order ?? 5;
  s.userData.dispose = () => { t.dispose(); s.material.dispose(); };
  return s;
}

// whether this browser can draw WebGL at all: asked of a canvas of its own, so a browser without it says nothing in the console
export function hasGL() {
  try {
    const g = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    g?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!g;
  } catch (e) { return false; }
}

/* ---------- the diorama ---------- */
// cfg: views { name: { t: [x, y, z] looked at, dir: [x, y, z] the way to the camera, R the radius that must fit, fit: 'w' | 'h' } },
// start the first view, shadow { left, right, top, bottom } of the sun, sunAt [x, y, z], floor (y below which confetti is gone),
// sky [top, mid, low] colours of the dusk the shiny things reflect
export function diorama(canvas, cfg) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const small = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.75 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(cfg.fov || 32, 1, 0.5, 300);

  // the sky the shiny things reflect: dusk, the same as the page behind
  {
    const env = new THREE.Scene(), sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
      uniforms: {}, vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'varying vec3 p; void main(){ float h = p.y; vec3 top = vec3(.16,.18,.42), mid = vec3(.75,.45,.55), low = vec3(1.,.72,.5), gr = vec3(.2,.16,.14);' +
        'vec3 c = h > .0 ? mix(mid, top, smoothstep(.0,.6,h)) : mix(low, gr, smoothstep(.0,-.4,h)); c = mix(c, low, smoothstep(.25,.0,abs(h)) * .6); gl_FragColor = vec4(c,1.); }' }));
    env.add(sky);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 })); ball.position.set(-30, 12, 30); env.add(ball);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();
  }
  const hemi = new THREE.HemisphereLight(0xA8B8FF, 0x5A4636, 0.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFD2A4, 2.3); sun.position.set(...(cfg.sunAt || [-18, 16, 18])); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 22, bottom: -10, near: 1, far: 80, ...(cfg.shadow || {}) });
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8FA6FF, 0.6); rim.position.set(16, 8, -14); scene.add(rim);

  const GLOW = glowTex(), glows = [];
  // a glow sprite: s its size, c its colour; it shines only while on. parent: where it hangs (the scene)
  function glow(x, y, z, s, c = 0xFFC46A, on = true, parent = scene) {
    const m = new THREE.SpriteMaterial({ map: GLOW, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: on ? 1 : 0 });
    const sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s, s); parent.add(sp); glows.push(sp); return sp;
  }

  // the far stars of the sky
  {
    const n = 220, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 220; pos[i * 3 + 1] = 15 + Math.random() * 70; pos[i * 3 + 2] = -70 - Math.random() * 30; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xFFF6E0, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false })));
  }
  // the shadow of the block on the air below it
  if (cfg.under) {
    const [x, y, z, w, d] = cfg.under;
    const t = canvasTex(256, 256, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(10,8,30,0.55)'); r.addColorStop(1, 'rgba(10,8,30,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.set(x, y, z); scene.add(s);
  }

  /* ---------- the party: confetti and sparkles ---------- */
  const N = 260, confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 0.22), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), N);
  confetti.frustumCulled = false; confetti.count = 0; scene.add(confetti);
  const bits = [], tmp = new THREE.Object3D(), PAL = (cfg.confetti || [0xFF5FA8, 0xFFD36B, 0x7CF5B0, 0x6FE3FF, 0xFFFFFF, 0xD9474F]).map(c => new THREE.Color(c));
  const sparks = [], floor = cfg.floor ?? -20;
  function burst(at, n, power = 6, size = 1) {
    if (RM) return;
    for (let i = 0; i < n && bits.length < N; i++) {
      const a = Math.random() * Math.PI * 2, u = Math.random() * 0.8 + 0.4;
      bits.push({ p: at.clone(), v: V(Math.cos(a) * power * (0.3 + Math.random() * 0.6), power * u, Math.sin(a) * power * (0.3 + Math.random() * 0.6)), r: V(Math.random() * 6, Math.random() * 6, 0), w: V(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4), life: 2.2 + Math.random(), c: PAL[i % PAL.length], s: size });
    }
    wake();
  }
  // sparkles that rise and fall: n of them, of colour c and size s, with power the speed they leave at and fall the gravity on them
  function sparkle(at, n = 10, c = 0xFFE08A, s = 0.45, power = 1.6, fall = 2.5) {
    if (RM) return;
    for (let i = 0; i < n; i++) { const g = glow(at.x, at.y, at.z, s, c); const a = Math.random() * Math.PI * 2; g.userData = { v: V(Math.cos(a) * power, power * (0.9 + Math.random()), Math.sin(a) * power), life: 0.8 + Math.random() * 0.4, s, fall }; sparks.push(g); }
    wake();
  }

  /* ---------- the camera ---------- */
  const VIEWS = cfg.views;
  const cam = { t: V(0, 0, 0), p: V(0, 10, 30), ox: 0, oy: 0, name: cfg.start || 'map' };
  let lay = { kind: 'full', f: 0, px: 0 }, W0 = 1, H1 = 1;
  // where the camera goes for view v in the free part of the screen: the distance that makes a ball of radius R fit it (or its width, or its height)
  function place(v) {
    const fw = lay.kind === 'right' ? W0 - lay.px : W0, fh = lay.kind === 'bottom' ? H1 * (1 - lay.f) : H1;
    const fit = v.fit === 'w' ? fw : v.fit === 'h' ? fh : Math.min(fw, fh);
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = v.R * H1 / (tan * fit) * 1.05;
    const dir = V(...v.dir).normalize(), t = V(...v.t);
    return { t, p: t.clone().add(dir.multiplyScalar(d)), ox: lay.kind === 'right' ? lay.px / 2 : 0, oy: lay.kind === 'bottom' ? H1 * lay.f / 2 : 0 };
  }
  // the part of the screen the panel leaves free, in pixels
  const size = () => ({ w: lay.kind === 'right' ? W0 - lay.px : W0, h: lay.kind === 'bottom' ? H1 * (1 - lay.f) : H1 });
  // how many pixels of the screen a unit of the world takes at the place view v looks at
  const ppu = v => H1 / (2 * place(v).p.distanceTo(V(...v.t)) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  let flight = null;
  // to view name (a name of cfg.views, or a view itself); resolves on arriving. o.instant, o.dur
  function go(name, o = {}) {
    const v = typeof name === 'string' ? VIEWS[name] || VIEWS[cfg.start || 'map'] : name;
    cam.name = typeof name === 'string' ? name : null; cam.v = v;
    const to = place(v), from = { t: cam.t.clone(), p: cam.p.clone(), ox: cam.ox, oy: cam.oy };
    wake();
    if (RM || o.instant) { Object.assign(cam, { t: to.t, p: to.p, ox: to.ox, oy: to.oy }); if (flight) flight.res(); flight = null; return Promise.resolve(); }
    if (flight) flight.res();
    const dur = o.dur || 1300;
    return new Promise(res => { flight = { t0: performance.now(), dur, from, to, res, arc: from.p.distanceTo(to.p) > 12 ? Math.min(3, from.p.distanceTo(to.p) / 10) : 0 }; });
  }
  function layout(kind, x = 0) {
    const was = JSON.stringify(lay);
    lay = kind === 'bottom' ? { kind, f: x, px: 0 } : kind === 'right' ? { kind, f: 0, px: x } : { kind: 'full', f: 0, px: 0 };
    if (JSON.stringify(lay) !== was) go(cam.v || cam.name, { dur: 700 });
  }
  function resize() {
    W0 = innerWidth; H1 = innerHeight;
    renderer.setSize(W0, H1, false); camera.aspect = W0 / H1; camera.updateProjectionMatrix();
    const to = place(cam.v || VIEWS[cam.name] || VIEWS[cfg.start || 'map']); if (!flight) Object.assign(cam, { t: to.t, p: to.p, ox: to.ox, oy: to.oy }); wake();
  }
  addEventListener('resize', resize);
  // the camera shakes for a heavy moment
  let shakeT = 0, shakeA = 0;
  const shake = (a = 0.12) => { if (!RM) { shakeT = 0.35; shakeA = a; wake(); } };
  // confetti over the place on show: tier 1, 2 or 3
  function celebrate(tier = 1, at = null) {
    const c = at || cam.t.clone().add(V(0, 1.5, 0)), n = [0, 40, 90, 200][tier] || 40;
    burst(c, n, 4 + tier * 1.5);
    if (tier >= 3) shake(0.08);
  }
  // the place of the screen (client pixels) where a point of the world is, and the ray under a point of the screen
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(x, y, objects) {
    const r = canvas.getBoundingClientRect(); ndc.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    camera.updateMatrixWorld(); ray.setFromCamera(ndc, camera); return ray.intersectObjects(objects, false);
  }
  function onScreen(p) { const v = p.clone().project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }

  /* ---------- the loop ---------- */
  const tw = [], every = [];
  function tween(dur, step, e = ease) { wake(); if (!dur || RM) { step(1); return Promise.resolve(); } return new Promise(res => tw.push({ t0: performance.now(), dur, step, e, res })); }
  let last = performance.now(), quiet = 0, paused = false, frame = 0, raf = 0;
  function wake() { quiet = 0; if (!raf && !paused) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  const look = new THREE.Vector3();
  function loop(now) {
    if (paused) { raf = 0; return; }
    // a still scene draws only now and then (the fireflies and the sway are slow); with reduced motion, not at all
    if (quiet > 90 && RM) { raf = 0; return; }
    raf = requestAnimationFrame(loop); frame++;
    if (quiet > 90 && frame % 3) return;
    // dt moves things (at most a twentieth of a second a frame, so nothing jumps); raw is the real time, for what only fades
    const raw = Math.min(0.5, (now - last) / 1000), dt = Math.min(0.05, raw); last = now;
    let busy = tw.length > 0 || !!flight || bits.length > 0 || sparks.length > 0 || shakeT > 0;
    for (let i = tw.length - 1; i >= 0; i--) { const x = tw[i], k = Math.min(1, (now - x.t0) / x.dur); x.step(x.e(k)); if (k >= 1) { tw.splice(i, 1); x.res(); } }
    if (flight) {
      const k = Math.min(1, (now - flight.t0) / flight.dur), e = ease(k), f = flight.from, to = flight.to;
      cam.t.lerpVectors(f.t, to.t, e); cam.p.lerpVectors(f.p, to.p, e); if (flight.arc) cam.p.y += Math.sin(e * Math.PI) * flight.arc;
      cam.ox = f.ox + (to.ox - f.ox) * e; cam.oy = f.oy + (to.oy - f.oy) * e;
      if (k >= 1) { const r = flight.res; flight = null; r(); }
    }
    for (const f of every) if (f(dt, now, raw)) busy = true;
    // confetti and sparkles
    let n = 0;
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i]; b.life -= dt; if (b.life <= 0 || b.p.y < floor) { bits.splice(i, 1); continue; }
      b.v.y -= 7 * dt; b.v.multiplyScalar(0.985); b.p.addScaledVector(b.v, dt); b.r.addScaledVector(b.w, dt);
      tmp.position.copy(b.p); tmp.rotation.set(b.r.x, b.r.y, b.r.z); tmp.scale.setScalar(Math.min(1, b.life) * b.s); tmp.updateMatrix();
      confetti.setMatrixAt(n, tmp.matrix); confetti.setColorAt(n, b.c); n++;
    }
    confetti.count = n; confetti.instanceMatrix.needsUpdate = true; if (confetti.instanceColor) confetti.instanceColor.needsUpdate = true;
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i], u = s.userData; u.life -= dt; if (u.life <= 0) { s.parent?.remove(s); s.material.dispose(); sparks.splice(i, 1); glows.splice(glows.indexOf(s), 1); continue; } u.v.y -= u.fall * dt; s.position.addScaledVector(u.v, dt); s.material.opacity = Math.min(1, u.life * 2); s.scale.setScalar(u.s * Math.min(1, u.life * 1.5)); }
    // the camera, with a slow sway on the map
    let sway = 0;
    if (cam.name === (cfg.start || 'map') && !RM) sway = Math.sin(now * 0.00018) * 0.09;
    look.copy(cam.p).sub(cam.t).applyAxisAngle(V(0, 1, 0), sway).add(cam.t);
    if (shakeT > 0) { shakeT -= dt; const a = shakeA * (shakeT / 0.35); look.add(V((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, 0)); }
    camera.position.copy(look); camera.lookAt(cam.t);
    camera.setViewOffset(W0, H1, cam.ox, cam.oy, W0, H1);
    renderer.render(scene, camera);
    quiet = busy ? 0 : quiet + 1;
  }
  document.addEventListener('visibilitychange', () => { paused = document.hidden; if (!paused) wake(); });
  resize(); go(cfg.start || 'map', { instant: true });

  return { THREE, renderer, scene, camera, sun, hemi, rim, glow, burst, sparkle, celebrate, shake, go, layout, tween, wake, pick, onScreen,
    every: f => every.push(f), get view() { return cam.name; }, get target() { return cam.t; }, views: VIEWS, place, ppu, size,
    pause(on) { paused = on; if (!on) wake(); } };
}
