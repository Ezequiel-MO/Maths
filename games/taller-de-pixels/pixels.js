// The pixel boards of the workshop: a picture to read (a tap on a pixel answers) or a grid to paint with a finger. The board keeps the
// grid, works out which pixel is under the finger or the keyboard cursor, and draws twice: an SVG, here, that is on screen at once and
// stays when there is no WebGL, and the canvas of lienzo.js (PixiJS, with its GSAP animations), loaded only when the first board comes
// up, that takes its place when it is ready. Both draw from the same layout, so a pixel is in the same place in either.
import { RM } from '../../shared/util.js';
import { whenGone } from '../../shared/scene.js';
import { COLORS, W, H } from './logic.js';

export const EMPTY = ['#0D2B39', '#123747'];
export const hexOf = ch => COLORS[ch]?.hex;
let lib = null;
const pixi = () => (lib ??= import('./lienzo.js').catch(() => null));

// Where everything goes, in CSS pixels: the cell, the margin for the numbers on the left (ox) and under the grid, the whole size
export function layout(g, p, maxW) {
  const w = W(g), h = H(g), side = p.axes ? 24 : p.lines === false ? 10 : 3;
  const cell = Math.max(12, Math.min(44, Math.floor((maxW - side - 6) / w)));
  return { w, h, cell, ox: side, oy: 3, bw: side + w * cell + 3, bh: 3 + h * cell + side };
}
// the middle of the pixel (x, y) and the pixel under a point, both in the layout's pixels
export const centre = (Lt, x, y) => [Lt.ox + (x - 0.5) * Lt.cell, Lt.oy + (Lt.h - y + 0.5) * Lt.cell];
const cellAtPoint = (Lt, px, py) => { const x = Math.floor((px - Lt.ox) / Lt.cell) + 1, y = Lt.h - Math.floor((py - Lt.oy) / Lt.cell);
  return x >= 1 && x <= Lt.w && y >= 1 && y <= Lt.h ? [x, y] : null; };

/* ---------- the SVG ---------- */
function svgOf(st) {
  const { Lt, g, p, marks, locked } = st, { cell, ox, oy, w, h } = Lt, out = [];
  g.forEach((r, i) => [...r].forEach((c, j) => {
    const x = ox + j * cell, y = oy + i * cell, k = `${j + 1},${h - i}`;
    out.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${c === '.' ? EMPTY[(i + j) % 2] : hexOf(c)}"/>`);
    if (locked.has(k) && c !== '.') out.push(`<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${Math.max(1.5, cell / 12)}" fill="rgb(0 0 0 / 0.3)"/>`);
  }));
  if (p.lines !== false) for (let j = 0; j <= w; j++) out.push(`<path class="gl" d="M${ox + j * cell} ${oy}v${h * cell}"/>`);
  if (p.lines !== false) for (let i = 0; i <= h; i++) out.push(`<path class="gl" d="M${ox} ${oy + i * cell}h${w * cell}"/>`);
  if (p.lines === false) {
    out.push(`<rect class="edge" x="${ox}" y="${oy}" width="${w * cell}" height="${h * cell}"/>`);
    for (let j = 0; j <= w; j++) out.push(`<path class="tick" d="M${ox + j * cell} ${oy + h * cell}v6"/>`);
    for (let i = 0; i <= h; i++) out.push(`<path class="tick" d="M${ox} ${oy + i * cell}h-6"/>`);
  }
  if (p.tiles) { const [tw, th] = p.tiles;
    for (let j = 0; j <= w; j += tw) out.push(`<path class="tl" d="M${ox + j * cell} ${oy}v${h * cell}"/>`);
    for (let i = 0; i <= h; i += th) out.push(`<path class="tl" d="M${ox} ${oy + i * cell}h${w * cell}"/>`); }
  if (p.axis?.includes('v')) out.push(`<path class="mir" d="M${ox + w * cell / 2} ${oy - 2}v${h * cell + 4}"/>`);
  if (p.axis?.includes('h')) out.push(`<path class="mir" d="M${ox - 2} ${oy + h * cell / 2}h${w * cell + 4}"/>`);
  if (p.axes) {
    for (let j = 1; j <= w; j++) out.push(`<text class="an" x="${ox + (j - 0.5) * cell}" y="${oy + h * cell + 16}">${j}</text>`);
    for (let y = 1; y <= h; y++) out.push(`<text class="an" x="${ox - 12}" y="${oy + (h - y + 0.5) * cell + 4}">${y}</text>`);
  }
  for (const [k, m] of marks) { const [x, y] = k.split(',').map(Number);
    out.push(`<rect class="mk ${m}" x="${ox + (x - 1) * cell + 1.5}" y="${oy + (h - y) * cell + 1.5}" width="${cell - 3}" height="${cell - 3}" rx="3"/>`); }
  return out.join('');
}

// A board in host. o.onTap(key) hears a tap on a pixel (a picture to read); o.paint makes it a grid to paint: { given (the pixels that
// come painted and cannot change), brush() (the colour in the finger, '.' rubs out), onChange() }. Gives the board:
//   show(pic, { reveal })  draws a picture (a new one comes in pixel by pixel)
//   grid()                 the grid as it is now
//   mark(keys, cls)        rings the pixels ('ok' or 'no'); unmark() takes the rings away
//   cheer()                the drawing jumps for joy; shake(keys) the pixels shake
export function makeBoard(host, t, o = {}) {
  const wrap = document.createElement('div'), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), cur = document.createElement('i');
  wrap.className = 'px' + (o.paint ? ' paint' : o.onTap ? ' tap' : ''); wrap.tabIndex = o.paint || o.onTap ? 0 : -1;
  cur.className = 'cur'; cur.hidden = true;
  wrap.append(svg, cur); host.append(wrap);
  const st = { Lt: null, g: null, p: null, marks: new Map(), locked: new Set() };
  let R = null, want = null, kx = 1, ky = 1;

  function redraw() {
    svg.setAttribute('viewBox', `0 0 ${st.Lt.bw} ${st.Lt.bh}`); svg.innerHTML = svgOf(st);
    wrap.style.setProperty('--bw', st.Lt.bw + 'px'); wrap.style.aspectRatio = `${st.Lt.bw} / ${st.Lt.bh}`;
  }
  function show(p, { reveal = true } = {}) {
    st.p = p; st.g = p.g.slice(); st.marks.clear();
    st.Lt = layout(st.g, p, Math.min(o.max || 520, host.clientWidth || 340));
    redraw();
    if (R) R.draw(st, { reveal: reveal && !RM }); else want = reveal;
  }
  if (o.paint) { const gv = o.paint.given; gv.forEach((r, i) => [...r].forEach((c, j) => { if (c !== '.') st.locked.add(`${j + 1},${gv.length - i}`); })); }

  // the canvas, when PixiJS and WebGL are there; the SVG stays until then
  pixi().then(m => m && m.mount(st, { hexOf, EMPTY, centre }).then(r => {
    if (!r) return;
    if (!t.on || !wrap.isConnected) { r.destroy(); return; }
    R = r; wrap.insertBefore(r.canvas, cur); svg.classList.add('under');
    if (st.Lt) R.draw(st, { reveal: !!want && !RM });
  })).catch(() => {});
  whenGone(t, wrap, () => { R?.destroy(); R = null; });

  /* ---------- the finger and the keys ---------- */
  const at = e => { const b = wrap.getBoundingClientRect(), k = st.Lt.bw / b.width; return cellAtPoint(st.Lt, (e.clientX - b.left) * k, (e.clientY - b.top) * k); };
  function cursor(c) {
    if (!c) { cur.hidden = true; return; }
    const b = wrap.getBoundingClientRect(), k = b.width / st.Lt.bw, [cx, cy] = centre(st.Lt, ...c), s = st.Lt.cell * k;
    cur.hidden = false; cur.style.cssText = `left:${cx * k - s / 2}px;top:${cy * k - s / 2}px;width:${s}px;height:${s}px`;
  }
  // paints the pixel (x, y) with ch; gives whether it changed
  function set(x, y, ch) {
    const k = `${x},${y}`, i = st.Lt.h - y;
    if (st.locked.has(k) || st.g[i][x - 1] === ch) return false;
    st.g[i] = st.g[i].slice(0, x - 1) + ch + st.g[i].slice(x);
    st.marks.delete(k); redraw(); R?.cell(st, x, y);
    o.paint.onChange?.(x, y, ch);
    return true;
  }
  let drag = null;
  wrap.addEventListener('pointerdown', e => {
    const c = at(e); if (!c || !o.paint) return;
    e.preventDefault(); wrap.setPointerCapture?.(e.pointerId);
    const b = o.paint.brush(), now = st.g[st.Lt.h - c[1]][c[0] - 1];
    drag = { ch: now === b ? '.' : b, last: '' };   // a pixel already of the colour in the finger is rubbed out, and so is the rest of the stroke
    move(c);
  });
  const move = c => { const k = c.join(','); if (drag && k !== drag.last) { drag.last = k; set(c[0], c[1], drag.ch); } };
  wrap.addEventListener('pointermove', e => { const c = at(e); if (e.pointerType === 'mouse') cursor(c); if (drag && c) move(c); });
  const end = () => { drag = null; };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('pointerleave', () => { if (!drag) cursor(null); });
  wrap.addEventListener('click', e => { if (!o.onTap) return; const c = at(e); if (c) o.onTap(c.join(','), c); });
  wrap.addEventListener('keydown', e => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (d) { e.preventDefault(); e.stopPropagation(); kx = Math.min(st.Lt.w, Math.max(1, kx + d[0])); ky = Math.min(st.Lt.h, Math.max(1, ky + d[1])); cursor([kx, ky]); return; }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    if (o.onTap) o.onTap(`${kx},${ky}`, [kx, ky]);
    else if (o.paint) { const b = o.paint.brush(), now = st.g[st.Lt.h - ky][kx - 1]; set(kx, ky, now === b ? '.' : b); }
  });
  wrap.addEventListener('focus', () => { if (!wrap.matches(':focus-visible')) return; cursor([kx, ky]); });
  wrap.addEventListener('blur', () => cursor(null));

  return {
    el: wrap, show, grid: () => st.g.slice(), keyIn: k => st.locked.has(k),
    mark(keys, cls) { for (const k of keys) st.marks.set(k, cls); redraw(); R?.marks(st); },
    unmark() { if (!st.marks.size) return; st.marks.clear(); redraw(); R?.marks(st); },
    cheer() { if (!RM) R?.cheer(st); },
    shake(keys) { if (!RM) R?.shake(st, keys); }
  };
}
