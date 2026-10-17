// The pixel boards of the workshop: a picture to read (a tap on a pixel answers) or a grid to paint with a finger. The board keeps the
// grid, works out which pixel is under the finger or the keyboard cursor, and draws twice: an SVG, here, that is on screen at once and
// stays when there is no WebGL, and the canvas of lienzo.js (PixiJS, with its GSAP animations), loaded only when the first board comes
// up, that takes its place when it is ready. Both draw from the same layout, so a pixel is in the same place in either.
// A board can sit inside a real screen (a pocket console, an old TV, a phone, a sign of lights...), and its picture can move: frames
// shown one after the other, every pixel flying to its new place when a drawing turns or grows, or turning over to its new colour
// when a filter is put on it.
import { RM } from '../../shared/util.js';
import { whenGone } from '../../shared/scene.js';
import { COLORS, W, H } from './logic.js';

export const EMPTY = ['#0D2B39', '#123747'];
// The screens: the colours of an empty pixel (two, in a checker), round pixels (lights or beads), and the words on the frame
export const SCREENS = {
  gameboy: { name: 'Consola de butxaca', empty: ['#2E4A2E', '#355535'], label: 'PIXEL BOY' },
  tele: { name: 'Tele antiga', empty: ['#0E1D1A', '#122421'] },
  mobil: { name: 'Mòbil', empty: ['#111827', '#172033'] },
  arcade: { name: 'Màquina recreativa', empty: ['#191736', '#1E1C40'], label: 'ARCADE' },
  monitor: { name: 'Ordinador', empty: EMPTY },
  led: { name: 'Rètol de llums', empty: ['#2A0E0E', '#2A0E0E'], round: true },
  rellotge: { name: 'Rellotge digital', empty: ['#0C1512', '#0C1512'] },
  boletes: { name: 'Placa de boletes', empty: ['#33434D', '#33434D'], round: true }
};
// the room the frame of a screen takes, both sides together, in CSS pixels
const PAD = 52;
const lookOf = s => ({ empty: SCREENS[s]?.empty || EMPTY, round: !!SCREENS[s]?.round });
export const hexOf = ch => COLORS[ch]?.hex;
let lib = null;
const pixi = () => (lib ??= import('./lienzo.js').catch(() => null));

// a small drawing of a grid as an SVG of its own, one square per pixel (the empty ones left out, or of colour bg)
export const spriteSvg = (g, cls = '', bg = '') => `<svg class="${cls}" viewBox="0 0 ${W(g)} ${H(g)}" shape-rendering="crispEdges" aria-hidden="true">${bg ? `<rect width="${W(g)}" height="${H(g)}" fill="${bg}"/>` : ''}${g.flatMap((r, i) => [...r].map((c, j) => c === '.' ? '' : `<rect x="${j}" y="${i}" width="1" height="1" fill="${hexOf(c)}"/>`)).join('')}</svg>`;

// Where everything goes, in CSS pixels: the cell, the margins (the numbers of the rows on the left, ox, and of the columns on top,
// oy, as in a matrix; the marks of a grid with no lines on the left and under it), the whole size
export function layout(g, p, maxW) {
  const w = W(g), h = H(g), left = p.axes ? 24 : p.lines === false ? 10 : 3, top = p.axes ? 24 : 3, bottom = p.lines === false ? 10 : 3;
  const cell = Math.max(10, Math.min(44, Math.floor((maxW - left - 6) / w)));
  return { w, h, cell, ox: left, oy: top, bw: left + w * cell + 3, bh: top + h * cell + bottom };
}
// the middle of the pixel (f, c) and the pixel under a point, both in the layout's pixels
export const centre = (Lt, f, c) => [Lt.ox + (c - 0.5) * Lt.cell, Lt.oy + (f - 0.5) * Lt.cell];
const cellAtPoint = (Lt, px, py) => { const c = Math.floor((px - Lt.ox) / Lt.cell) + 1, f = Math.floor((py - Lt.oy) / Lt.cell) + 1;
  return c >= 1 && c <= Lt.w && f >= 1 && f <= Lt.h ? [f, c] : null; };

/* ---------- the SVG ---------- */
function svgOf(st) {
  const { Lt, g, p, marks, locked, look } = st, { cell, ox, oy, w, h } = Lt, out = [], lines = p.lines !== false && !look.round;
  g.forEach((r, i) => [...r].forEach((c, j) => {
    const x = ox + j * cell, y = oy + i * cell, k = `${i + 1},${j + 1}`, fill = c === '.' ? look.empty[(i + j) % 2] : hexOf(c);
    out.push(look.round ? `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${cell * 0.44}" fill="${fill}"/>` : `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}"/>`);
    if (locked.has(k) && c !== '.') out.push(`<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${Math.max(1.5, cell / 12)}" fill="rgb(0 0 0 / 0.3)"/>`);
  }));
  if (lines) for (let j = 0; j <= w; j++) out.push(`<path class="gl" d="M${ox + j * cell} ${oy}v${h * cell}"/>`);
  if (lines) for (let i = 0; i <= h; i++) out.push(`<path class="gl" d="M${ox} ${oy + i * cell}h${w * cell}"/>`);
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
    for (let c = 1; c <= w; c++) out.push(`<text class="an" x="${ox + (c - 0.5) * cell}" y="${oy - 8}">${c}</text>`);
    for (let f = 1; f <= h; f++) out.push(`<text class="an" x="${ox - 12}" y="${oy + (f - 0.5) * cell + 4}">${f}</text>`);
  }
  for (const [k, m] of marks) { const [f, c] = k.split(',').map(Number);
    out.push(`<rect class="mk ${m}" x="${ox + (c - 1) * cell + 1.5}" y="${oy + (f - 1) * cell + 1.5}" width="${cell - 3}" height="${cell - 3}" rx="3"/>`); }
  return out.join('');
}

// A board in host. o.onTap(key) hears a tap on a pixel (a picture to read); o.paint makes it a grid to paint: { given (the pixels that
// come painted and cannot change), brush() (the colour in the finger, '.' rubs out), onChange(f, c, ch), onDown(f, c) (true when it has
// taken the tap itself, as the bucket does) }. o.screen is the screen it sits in (a key of SCREENS; a picture can say its own). Gives:
//   show(pic, { reveal })  draws a picture (a new one comes in pixel by pixel; one with frames plays them)
//   morph(pic, src)        the new picture, every pixel flying from the pixel src(f, c) of the old one (null: it just appears)
//   filter(pic)            the new picture of the same size, every pixel turning over to its new colour
//   fly(src)               the pixels painted (not the given ones) fly in from src(f, c)
//   load(g), put(f, c, ch) the whole grid at once; one pixel, as if painted
//   grid()                 the grid as it is now
//   mark(keys, cls)        rings the pixels ('ok' or 'no'); unmark() takes the rings away
//   cheer()                the drawing jumps for joy; shake(keys) the pixels shake
export function makeBoard(host, t, o = {}) {
  const shell = document.createElement('div'), wrap = document.createElement('div'), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), cur = document.createElement('i'), ov = document.createElement('div');
  ov.className = 'ov'; ov.setAttribute('aria-hidden', 'true');
  wrap.className = 'px' + (o.paint ? ' paint' : o.onTap ? ' tap' : ''); wrap.tabIndex = o.paint || o.onTap ? 0 : -1;
  cur.className = 'cur'; cur.hidden = true;
  wrap.append(svg, ov, cur); shell.append(wrap); host.append(shell);
  const st = { Lt: null, g: null, p: null, marks: new Map(), locked: new Set(), look: lookOf(null) };
  let R = null, want = null, kf = 1, kc = 1, skin, timer = 0;

  function redraw() {
    svg.setAttribute('viewBox', `0 0 ${st.Lt.bw} ${st.Lt.bh}`); svg.innerHTML = svgOf(st);
    wrap.style.setProperty('--bw', st.Lt.bw + 'px'); wrap.style.aspectRatio = `${st.Lt.bw} / ${st.Lt.bh}`;
  }
  // the screen around the board
  function dress(s) {
    if (s === skin) return;
    skin = s; const S = SCREENS[s];
    shell.className = 'scr' + (S ? ` scr-${s}` : '');
    shell.querySelector('.scr-label')?.remove();
    if (S?.label) shell.insertAdjacentHTML('beforeend', `<span class="scr-label" aria-hidden="true">${S.label}</span>`);
  }
  const stop = () => { clearInterval(timer); timer = 0; };
  function play(p) {
    let k = 0;
    timer = setInterval(() => {
      if (!t.on || !wrap.isConnected) return stop();
      k = (k + 1) % p.frames.length; st.g = p.frames[k].slice();
      if (R) R.retint(st); else redraw();
    }, 1000 / (p.fps || 4));
  }
  // the state of a new picture, laid out and drawn in the SVG
  function place(p) {
    stop(); dress(p.screen ?? o.screen ?? null);
    st.p = p; st.g = p.g.slice(); st.marks.clear(); st.look = lookOf(skin); ov.innerHTML = '';
    st.Lt = layout(st.g, p, Math.min(o.max || 520, host.clientWidth || 340) - (skin ? PAD : 0));
    redraw();
  }
  function show(p, { reveal = true } = {}) {
    place(p);
    if (R) R.draw(st, { reveal: reveal && !RM }); else want = reveal;
    if (p.frames && !RM) play(p);
  }
  const before = () => ({ Lt: st.Lt, g: st.g, p: st.p, look: st.look });
  function morph(p, src) {
    const old = before(); place(p);
    if (R && !RM) R.morph(st, old, src); else R?.draw(st, { reveal: false });
    if (p.frames && !RM) play(p);
  }
  function filter(p) {
    place(p);
    if (R && !RM) R.flip(st); else R?.draw(st, { reveal: false });
  }
  if (o.paint) o.paint.given.forEach((r, i) => [...r].forEach((c, j) => { if (c !== '.') st.locked.add(`${i + 1},${j + 1}`); }));

  // the canvas, when PixiJS and WebGL are there; the SVG stays until then
  pixi().then(m => m && m.mount(st, { hexOf, centre }).then(r => {
    if (!r) return;
    if (!t.on || !wrap.isConnected) { r.destroy(); return; }
    R = r; wrap.insertBefore(r.canvas, cur); svg.classList.add('under');
    if (st.Lt) R.draw(st, { reveal: !!want && !RM });
  })).catch(() => {});
  whenGone(t, wrap, () => { stop(); R?.destroy(); R = null; });

  /* ---------- the finger and the keys ---------- */
  const at = e => { const b = wrap.getBoundingClientRect(), k = st.Lt.bw / b.width; return cellAtPoint(st.Lt, (e.clientX - b.left) * k, (e.clientY - b.top) * k); };
  function cursor(c) {
    if (!c) { cur.hidden = true; return; }
    const b = wrap.getBoundingClientRect(), k = b.width / st.Lt.bw, [cx, cy] = centre(st.Lt, ...c), s = st.Lt.cell * k;
    cur.hidden = false; cur.style.cssText = `left:${cx * k - s / 2}px;top:${cy * k - s / 2}px;width:${s}px;height:${s}px`;
  }
  // paints the pixel (f, c) with ch; gives whether it changed
  function set(f, c, ch) {
    const k = `${f},${c}`, i = f - 1;
    if (st.locked.has(k) || !st.g[i] || c < 1 || c > st.Lt.w || st.g[i][c - 1] === ch) return false;
    st.g[i] = st.g[i].slice(0, c - 1) + ch + st.g[i].slice(c);
    st.marks.delete(k); redraw(); R?.cell(st, f, c);
    o.paint?.onChange?.(f, c, ch);
    return true;
  }
  let drag = null;
  wrap.addEventListener('pointerdown', e => {
    const c = at(e); if (!c || !o.paint) return;
    e.preventDefault(); wrap.setPointerCapture?.(e.pointerId);
    if (o.paint.onDown?.(c[0], c[1])) return;
    const b = o.paint.brush(), now = st.g[c[0] - 1][c[1] - 1];
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
    const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (d) { e.preventDefault(); e.stopPropagation(); kf = Math.min(st.Lt.h, Math.max(1, kf + d[0])); kc = Math.min(st.Lt.w, Math.max(1, kc + d[1])); cursor([kf, kc]); return; }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    if (o.onTap) o.onTap(`${kf},${kc}`, [kf, kc]);
    else if (o.paint) { if (o.paint.onDown?.(kf, kc)) return; const b = o.paint.brush(), now = st.g[kf - 1][kc - 1]; set(kf, kc, now === b ? '.' : b); }
  });
  wrap.addEventListener('focus', () => { if (!wrap.matches(':focus-visible')) return; cursor([kf, kc]); });
  wrap.addEventListener('blur', () => cursor(null));

  return {
    el: wrap, show, morph, filter, grid: () => st.g.slice(), keyIn: k => st.locked.has(k),
    fly: src => morph({ ...st.p, g: st.g.slice() }, (f, c) => st.locked.has(`${f},${c}`) ? null : src(f, c)),
    load: g => { place({ ...st.p, g }); R?.draw(st, { reveal: false }); },
    put: (f, c, ch) => set(f, c, ch),
    unlock: () => st.locked.clear(),
    // a step of the frog's hint over the drawing: rows and columns lit, and pixels lit with a number in them (logic.js guide())
    hint(step) {
      if (!step || !st.Lt) { ov.innerHTML = ''; return; }
      const { bw, bh, cell, ox, oy, w, h } = st.Lt, X = x => `${x / bw * 100}%`, Y = y => `${y / bh * 100}%`;
      ov.innerHTML = [...(step?.rows || []).map(f => `<i class="band" style="left:${X(ox)};top:${Y(oy + (f - 1) * cell)};width:${X(w * cell)};height:${Y(cell)}"></i>`),
        ...(step?.cols || []).map(c => `<i class="band" style="left:${X(ox + (c - 1) * cell)};top:${Y(oy)};width:${X(cell)};height:${Y(h * cell)}"></i>`),
        ...(step?.marks || []).filter(([f, c]) => f >= 1 && f <= h && c >= 1 && c <= w).map(([f, c, t, cls]) => `<b class="spot ${cls || ''}" style="left:${X(ox + (c - 1) * cell)};top:${Y(oy + (f - 1) * cell)};width:${X(cell)};height:${Y(cell)};font-size:${Math.max(9, Math.min(18, cell * 0.45))}px">${t ?? ''}</b>`)].join('');
    },
    mark(keys, cls) { for (const k of keys) st.marks.set(k, cls); redraw(); R?.marks(st); },
    unmark() { if (!st.marks.size) return; st.marks.clear(); redraw(); R?.marks(st); },
    cheer() { if (!RM) R?.cheer(st); },
    shake(keys) { if (!RM) R?.shake(st, keys); }
  };
}
