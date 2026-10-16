// The canvas of a pixel board, with PixiJS (WebGL) and GSAP. Every pixel is a sprite of its own, so GSAP can move it: a new picture
// comes in pixel by pixel from the top left corner, a pixel just painted bounces, the pixels of a wrong answer shake and a finished
// drawing jumps like a wave. It is loaded only when the first board of the page comes up; pixels.js keeps its SVG on screen until
// mount() has given a board, and for good when it gives null (no WebGL).
import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';

const MUTED = 0x9EC3C0, SUN = 0xF7C64E, MINT = 0x7CF5B0, BAD = 0xFF6B5E;
const num = hex => parseInt(hex.slice(1), 16);

// A canvas for the board whose state is st. Gives { canvas, draw, cell, marks, cheer, shake, destroy }, or null when there is no WebGL
export async function mount(st, { hexOf, EMPTY, centre }) {
  const app = new Application();
  try {
    await app.init({ width: 10, height: 10, backgroundAlpha: 0, antialias: true, preference: 'webgl', autoDensity: true,
      resolution: Math.min(2, globalThis.devicePixelRatio || 1) });
  } catch (e) { return null; }
  const back = new Container(), pix = new Container(), front = new Graphics(), rings = new Graphics();
  app.stage.addChild(back, pix, front, rings);
  let sprites = [], gone = false;
  const tint = (c, i, j) => num(c === '.' ? EMPTY[(i + j) % 2] : hexOf(c));
  // with the grid on, a hair of the dark board shows between the pixels; with it off (only the marks of the edge), they touch
  const size = st => (st.Lt.cell - (st.Lt.cell > 20 && st.p.lines !== false ? 1 : 0)) / Texture.WHITE.width;

  // everything but the pixels: lines, mirrors, tiles, the numbers
  function frame(st) {
    const { Lt, p } = st, { cell, ox, oy, w, h } = Lt;
    back.removeChildren().forEach(c => c.destroy());
    front.clear();
    if (p.lines !== false) {
      for (let j = 0; j <= w; j++) front.moveTo(ox + j * cell, oy).lineTo(ox + j * cell, oy + h * cell);
      for (let i = 0; i <= h; i++) front.moveTo(ox, oy + i * cell).lineTo(ox + w * cell, oy + i * cell);
      front.stroke({ width: 1, color: 0x04131C, alpha: 0.55 });
    } else {
      front.rect(ox, oy, w * cell, h * cell).stroke({ width: 2, color: 0xEAF8F4, alpha: 0.7 });
      for (let j = 0; j <= w; j++) front.moveTo(ox + j * cell, oy + h * cell).lineTo(ox + j * cell, oy + h * cell + 6);
      for (let i = 0; i <= h; i++) front.moveTo(ox, oy + i * cell).lineTo(ox - 6, oy + i * cell);
      front.stroke({ width: 2, color: MUTED });
    }
    if (p.tiles) {
      const [tw, th] = p.tiles;
      for (let j = 0; j <= w; j += tw) front.moveTo(ox + j * cell, oy).lineTo(ox + j * cell, oy + h * cell);
      for (let i = 0; i <= h; i += th) front.moveTo(ox, oy + i * cell).lineTo(ox + w * cell, oy + i * cell);
      front.stroke({ width: 3, color: SUN, alpha: 0.9 });
    }
    // the mirror glows: a wide faint line under a thin bright one
    for (const [a, b] of [p.axis?.includes('v') && [[ox + w * cell / 2, oy - 3], [ox + w * cell / 2, oy + h * cell + 3]], p.axis?.includes('h') && [[ox - 3, oy + h * cell / 2], [ox + w * cell + 3, oy + h * cell / 2]]].filter(Boolean)) {
      front.moveTo(...a).lineTo(...b).stroke({ width: 9, color: SUN, alpha: 0.22 });
      front.moveTo(...a).lineTo(...b).stroke({ width: 3, color: SUN });
    }
    if (p.axes) {
      const style = { fontFamily: 'Nunito, system-ui, sans-serif', fontSize: 12, fontWeight: '800', fill: MUTED };
      for (let j = 1; j <= w; j++) { const t = new Text({ text: String(j), style }); t.anchor.set(0.5); t.position.set(ox + (j - 0.5) * cell, oy + h * cell + 12); back.addChild(t); }
      for (let y = 1; y <= h; y++) { const t = new Text({ text: String(y), style }); t.anchor.set(0.5); t.position.set(ox - 12, oy + (h - y + 0.5) * cell); back.addChild(t); }
    }
    // the pixels that come painted and cannot change carry a dot
    for (const k of st.locked) { const [x, y] = k.split(',').map(Number), [cx, cy] = centre(Lt, x, y); front.circle(cx, cy, Math.max(1.5, cell / 12)).fill({ color: 0x000000, alpha: 0.3 }); }
  }

  function draw(st, { reveal }) {
    const { Lt } = st;
    app.renderer.resize(Lt.bw, Lt.bh);
    gsap.killTweensOf(sprites.flatMap(s => [s, s.scale]));
    pix.removeChildren().forEach(c => c.destroy());
    sprites = [];
    const k = size(st);
    st.g.forEach((r, i) => [...r].forEach((c, j) => {
      const s = new Sprite(Texture.WHITE), [cx, cy] = centre(Lt, j + 1, Lt.h - i);
      s.anchor.set(0.5); s.position.set(cx, cy); s.scale.set(k); s.tint = tint(c, i, j); s.home = cy; s.hx = cx;
      pix.addChild(s); sprites.push(s);
      if (reveal && c !== '.') gsap.from(s.scale, { x: 0, y: 0, duration: 0.35, delay: Math.min(0.9, (i + j) * 0.035), ease: 'back.out(2.2)' });
    }));
    frame(st); marks(st);
  }
  const at = (st, x, y) => sprites[(st.Lt.h - y) * st.Lt.w + x - 1];
  // a pixel just painted: its new colour and a bounce
  function cell(st, x, y) {
    const s = at(st, x, y), k = size(st), i = st.Lt.h - y, c = st.g[i][x - 1];
    if (!s) return;
    s.tint = tint(c, i, x - 1);
    gsap.fromTo(s.scale, { x: k * (c === '.' ? 0.6 : 1.35), y: k * (c === '.' ? 0.6 : 1.35) }, { x: k, y: k, duration: 0.3, ease: 'back.out(3)', overwrite: true });
    marks(st);
  }
  // the rings of the pixels that are right or wrong
  function marks(st) {
    const { Lt } = st;
    rings.clear();
    for (const [key, m] of st.marks) { const [x, y] = key.split(',').map(Number), [cx, cy] = centre(Lt, x, y), r = Lt.cell / 2 - 1.5;
      rings.roundRect(cx - r, cy - r, 2 * r, 2 * r, 3).stroke({ width: 3, color: m === 'ok' ? MINT : BAD }); }
    gsap.killTweensOf(rings);
    rings.alpha = 1;
    if (st.marks.size) gsap.fromTo(rings, { alpha: 0.2 }, { alpha: 1, duration: 0.35, repeat: 3, yoyo: true });
  }
  // the painted pixels jump one after the other, column by column, like a wave
  function cheer(st) {
    sprites.forEach((s, n) => {
      if (st.g[Math.floor(n / st.Lt.w)][n % st.Lt.w] === '.') return;
      gsap.to(s, { y: s.home - st.Lt.cell * 0.45, duration: 0.18, delay: (n % st.Lt.w) * 0.05, yoyo: true, repeat: 1, ease: 'power2.out', overwrite: true });
    });
  }
  function shake(st, keys) {
    for (const k of keys) { const s = at(st, ...k.split(',').map(Number)); if (s) gsap.fromTo(s, { x: s.hx - 4 }, { x: s.hx, duration: 0.5, ease: 'elastic.out(1.2, 0.25)', overwrite: true }); }
  }
  function destroy() {
    if (gone) return;
    gone = true;
    gsap.killTweensOf([rings, ...sprites.flatMap(s => [s, s.scale])]);
    app.destroy({ removeView: true }, { children: true });
  }
  app.canvas.classList.add('pxc');
  return { canvas: app.canvas, draw, cell, marks, cheer, shake, destroy };
}
