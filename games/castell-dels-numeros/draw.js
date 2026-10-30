// The pictures of the castle of numbers: the frog in its hard hat, the castle of the map, and a scene for every kind of puzzle: towers of
// bricks, magic squares on a tablet, padlocks on a chain, balances that swing, machines with gears, lily pads in a series, a wheel of
// lights, a table of multiplying, secret symbols, sums in columns, riddles with bars, tiles to place and paths of stones. Each is drawn
// from the plain data of logic.js. A hole is drawn as a blueprint (dashed, cyan) over the brick or the cell it will be, and the CSS turns
// it into the real thing when it gets the class done. What a hint shows is in the scene already, hidden (.hx), and comes up with
// .board.hint. scene() gives the screen what it needs to drive it; o.on(event, data) hears what the child does on it.
import { gsap } from 'gsap';
import { RM, sleep } from '../../shared/util.js';
import { frames, tween } from '../../shared/scene.js';
import { SHAPES, placesOf, lineSums, tilesDone, stone, undo, barOf, OPS } from './logic.js';

const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const D = s => RM ? 0 : s;
const f1 = x => (+x).toFixed(1);
const isSym = t => typeof t === 'string' && !OPS[t] && t !== '=';

// the frog of the castle, in a builder's hard hat
export const FROG = `<svg class="frog" viewBox="-40 -64 84 92" aria-hidden="true"><ellipse cx="0" cy="22" rx="28" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-24 14q-9-2-7-9q7 2 11 6ZM24 14q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-4" rx="25" ry="21" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <ellipse cx="0" cy="4" rx="15" ry="11" fill="#D9F5C8"/><rect x="-9" y="-2" width="18" height="12" rx="3" fill="#F7C64E" stroke="#8A6A10" stroke-width="1.2" transform="rotate(-8)"/><path d="M-6 3h12M-6 7h9" stroke="#8A6A10" stroke-width="1.2" transform="rotate(-8)"/>
  <circle cx="-12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-25" r="4" fill="#0F3A40"/><circle cx="13" cy="-25" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-27" r="1.4" fill="#fff"/><circle cx="14.5" cy="-27" r="1.4" fill="#fff"/>
  <path d="M-9 -15Q0 -9 9 -15" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-25 -37Q-24 -60 0 -61Q24 -60 25 -37Z" fill="#F7C64E" stroke="#8A6A10" stroke-width="1.8"/><path d="M-4 -60.5V-38M4 -60.5V-38" stroke="#E0A92C" stroke-width="3"/>
  <rect x="-30" y="-39" width="60" height="6" rx="3" fill="#E9B23A" stroke="#8A6A10" stroke-width="1.4"/></svg>`;
// a small frog for the pads and the stones
const MINI = `<g class="mf"><ellipse cx="0" cy="7" rx="16" ry="11" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/><circle cx="-7" cy="-4" r="6" fill="#fff" stroke="#2F7F40" stroke-width="1.6"/><circle cx="7" cy="-4" r="6" fill="#fff" stroke="#2F7F40" stroke-width="1.6"/>
  <circle cx="-6" cy="-3.5" r="2.6" fill="#0F3A40"/><circle cx="8" cy="-3.5" r="2.6" fill="#0F3A40"/><path d="M-6 9Q0 13 6 9" fill="none" stroke="#1C5A3C" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M-11 -9Q-10 -21 0 -21Q10 -21 11 -9Z" fill="#F7C64E" stroke="#8A6A10" stroke-width="1.2"/><rect x="-13" y="-10" width="26" height="3" rx="1.5" fill="#E9B23A"/></g>`;

/* ---------- what every scene shares ---------- */
// the gradients and filters, once in the page
const DEFS = `<svg class="cn-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>
  <linearGradient id="cn-brick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8D08E"/><stop offset="0.55" stop-color="#E09D57"/><stop offset="1" stop-color="#B46E36"/></linearGradient>
  <linearGradient id="cn-amet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCCFFF"/><stop offset="0.5" stop-color="#9C84F4"/><stop offset="1" stop-color="#6247C9"/></linearGradient>
  <linearGradient id="cn-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3BF"/><stop offset="0.45" stop-color="#F7C64E"/><stop offset="1" stop-color="#BE8A22"/></linearGradient>
  <linearGradient id="cn-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F8FB"/><stop offset="0.5" stop-color="#AEBDCB"/><stop offset="1" stop-color="#6B7C8C"/></linearGradient>
  <linearGradient id="cn-iron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A7783"/><stop offset="1" stop-color="#2A3139"/></linearGradient>
  <linearGradient id="cn-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDA56A"/><stop offset="0.6" stop-color="#A8703C"/><stop offset="1" stop-color="#7A4E26"/></linearGradient>
  <linearGradient id="cn-copper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6C194"/><stop offset="0.5" stop-color="#C8773F"/><stop offset="1" stop-color="#8A4620"/></linearGradient>
  <linearGradient id="cn-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3561A3"/><stop offset="1" stop-color="#142A54"/></linearGradient>
  <linearGradient id="cn-slate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A5E73"/><stop offset="1" stop-color="#26323F"/></linearGradient>
  <linearGradient id="cn-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F4258"/><stop offset="1" stop-color="#062231"/></linearGradient>
  <linearGradient id="cn-parch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBF1D6"/><stop offset="1" stop-color="#E0CB98"/></linearGradient>
  <linearGradient id="cn-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8D0C2"/><stop offset="1" stop-color="#9A8F7E"/></linearGradient>
  <linearGradient id="cn-shell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5DBB78"/><stop offset="1" stop-color="#25633C"/></linearGradient>
  <linearGradient id="cn-cst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6DCC8"/><stop offset="1" stop-color="#AE9F86"/></linearGradient>
  <linearGradient id="cn-cst2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B3A58F"/><stop offset="1" stop-color="#7A6C59"/></linearGradient>
  <radialGradient id="cn-pad" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#9BEBA8"/><stop offset="0.55" stop-color="#46A85A"/><stop offset="1" stop-color="#22603A"/></radialGradient>
  <radialGradient id="cn-orb" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="#A8F2FF"/><stop offset="1" stop-color="#2A8DAF"/></radialGradient>
  <radialGradient id="cn-moon" cx="0.4" cy="0.4" r="0.7"><stop offset="0" stop-color="#FFFBEA"/><stop offset="1" stop-color="#F3DFA0"/></radialGradient>
  <pattern id="cn-bk" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 0.5H16M0 5.5H16M8 0.5V5.5M0 5.5V10M16 5.5V10" stroke="#4E4436" stroke-opacity="0.35" stroke-width="1" fill="none"/></pattern>
  <filter id="cn-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="cn-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.45"/></filter>
  <clipPath id="cn-wclip"><rect x="0" y="192" width="360" height="70"/></clipPath>
</defs></svg>`;
const defs = () => { if (!document.querySelector('.cn-defs')) document.body.insertAdjacentHTML('afterbegin', DEFS); };

// the size of a number in a cell of size f: smaller as it grows
const sized = (f, v) => { const n = String(v).length; return f * (n <= 2 ? 1 : n === 3 ? 0.84 : 0.7); };
function setV(e, v) {
  const t = e.querySelector('.v'); if (!t) return;
  t.textContent = (e.dataset.pre || '') + v;
  if (e.dataset.fs) t.setAttribute('font-size', f1(sized(+e.dataset.fs, v)));
}
const pop = e => { if (!RM && e) gsap.fromTo(e, { scale: 1.35 }, { scale: 1, duration: 0.45, ease: 'back.out(3)', transformOrigin: '50% 50%', overwrite: 'auto' }); };
const shake = e => { if (!RM && e) gsap.fromTo(e, { x: -8 }, { x: 0, duration: 0.55, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' }); };

// A cell of a puzzle at (x, y), in SVG: its number, or a hole. Its look: a rect w × h (rx), a circle r, an ellipse ell or a polygon
// poly, filled with fill; pre goes before the number (the × of a wheel); hole forces a hole (the sign of a padlock)
function cellSVG(sc, k, x, y, o) {
  const hole = o.hole || sc.holes.includes(k), blank = sc.blank?.includes(k), f = o.fs || 26, txt = hole ? '?' : blank ? '' : sc.cells[k];
  const st = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 2}"` : '';
  const bg = o.r ? `<circle class="bg" r="${o.r}" fill="${o.fill}"${st}/>` : o.poly ? `<polygon class="bg" points="${o.poly}" fill="${o.fill}"${st}/>`
    : o.ell ? `<ellipse class="bg" rx="${o.ell[0]}" ry="${o.ell[1]}" fill="${o.fill}"${st}/>` : `<rect class="bg" x="${-o.w / 2}" y="${-o.h / 2}" width="${o.w}" height="${o.h}" rx="${o.rx ?? 10}" fill="${o.fill}"${st}/>`;
  return `<g transform="translate(${f1(x)} ${f1(y)})"><g class="cell${hole ? ' hole' : ''}${blank ? ' blank' : ''}${o.cls ? ' ' + o.cls : ''}" data-k="${H(k)}" data-fs="${f}"${o.pre ? ` data-pre="${o.pre}"` : ''}${hole && !o.still ? ' tabindex="0" role="button" aria-label="Forat"' : ''}>${o.under || ''}${bg}${o.over || ''}<text class="v" y="${f1(f * 0.35)}" text-anchor="middle" font-size="${f1(sized(f, txt))}" fill="${o.ink || '#fff'}">${H((o.pre || '') + txt)}</text></g></g>`;
}
// the same, in HTML
const cellHTML = (sc, k, still, cls = '') => { const hole = sc.holes.includes(k); return `<span class="cell${hole ? ' hole' : ''}${cls ? ' ' + cls : ''}" data-k="${H(k)}"${hole && !still ? ' tabindex="0" role="button" aria-label="Forat"' : ''}><b class="v">${hole ? '?' : H(sc.cells[k])}</b></span>`; };

// What the screen does to a scene: light the hole being typed, write in it, fill it, shake it, light what a hint talks of, and the
// end of the puzzle (finish). A scene adds what is its own
function api(root) {
  const map = new Map();
  for (const e of root.querySelectorAll('[data-k]')) map.set(e.dataset.k, e);
  const el = k => map.get(k);
  return {
    el,
    active(k) { root.querySelectorAll('.cell.cur').forEach(e => e.classList.remove('cur')); el(k)?.classList.add('cur'); },
    type(k, txt) { const e = el(k); if (!e) return; e.classList.toggle('typing', !!txt); setV(e, txt || '?'); },
    solve(k, v) { const e = el(k); if (!e) return; e.classList.remove('cur', 'typing'); e.classList.add('done'); e.removeAttribute('tabindex'); e.removeAttribute('role'); setV(e, v); pop(e); },
    wrong(k) { shake(el(k)); },
    lit(keys) {
      root.querySelectorAll('.lit').forEach(e => e.classList.remove('lit'));
      for (const k of keys) { el(k)?.classList.add('lit'); if (/^[\w-]+$/.test(k)) root.querySelectorAll(`.ln-${k}`).forEach(e => e.classList.add('lit')); }
    },
    async finish() {}
  };
}

// The scene of a round in board. o: { t (the token of the screen), on(event, data), still (a picture only, for «Caça l'errada») }
export function scene(board, sc, o = {}) {
  defs();
  board.classList.remove('hint', 'won');
  if (!sc) { board.innerHTML = ''; return api(board); }
  return (SCENES[sc.s] || (() => { board.innerHTML = ''; return api(board); }))(board, sc, o);
}

/* ---------- towers of bricks ---------- */
function pyrScene(board, sc, o) {
  const n = sc.n, W = 74, Hb = 44, G = 6, rowH = Hb + G, width = n * W + (n - 1) * G + 20, top = 46, height = top + n * rowH + 34;
  const x = (r, i) => 10 + r * (W + G) / 2 + i * (W + G) + W / 2, y = r => top + (n - 1 - r) * rowH + Hb / 2;
  const times = sc.op === '×', fill = times ? 'url(#cn-amet)' : 'url(#cn-brick)', stroke = times ? '#40289A' : '#86501F', ink = times ? '#1A0B4A' : '#3B2208';
  const shine = `<path d="M${-W / 2 + 8} ${-Hb / 2 + 5}H${W / 2 - 8}" stroke="#fff" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round"/><path d="M${-W / 2 + 6} ${Hb / 2 - 4}H${W / 2 - 6}" stroke="#000" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>`;
  const bricks = [];
  for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) bricks.push(cellSVG(sc, `${r}-${i}`, x(r, i), y(r), { w: W, h: Hb, rx: 9, fill, stroke, ink, fs: n >= 5 ? 23 : 26, over: shine, cls: 'brick', still: o.still }));
  const fx = x(n - 1, 0), fy = y(n - 1) - Hb / 2;
  board.innerHTML = `<div class="scene s-pyr"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Una torre de maons">
    <ellipse cx="${width / 2}" cy="${height - 24}" rx="${width / 2 + 4}" ry="16" fill="#0F4258" opacity="0.7"/><path d="M${width / 2 - width * 0.48} ${height - 26}Q${width / 2} ${height - 48} ${width / 2 + width * 0.48} ${height - 26}Q${width / 2} ${height - 14} ${width / 2 - width * 0.48} ${height - 26}Z" fill="#2F7F40"/>
    <path d="M${width / 2 - width * 0.4} ${height - 30}Q${width / 2} ${height - 44} ${width / 2 + width * 0.4} ${height - 30}" fill="none" stroke="#7CF5B0" stroke-opacity="0.35" stroke-width="3"/>
    ${bricks.join('')}
    <g class="flag" opacity="0"><path d="M${fx} ${fy}V${fy - 40}" stroke="#E9F2F7" stroke-width="3" stroke-linecap="round"/><path class="cloth" d="M${fx} ${fy - 40}h26l-7 8l7 8h-26Z" fill="${times ? '#B79CFF' : '#FF6B5E'}"/></g></svg></div>`;
  const A = api(board), svg = board.querySelector('svg');
  A.finish = async () => {
    const cells = [...svg.querySelectorAll('.cell')], flag = svg.querySelector('.flag');
    if (!RM) gsap.timeline().to(cells, { y: -7, duration: 0.14, stagger: 0.05, ease: 'power2.out' }).to(cells, { y: 0, duration: 0.4, stagger: 0.05, ease: 'bounce.out' }, 0.14);
    gsap.fromTo(flag, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: D(0.6), delay: D(0.05 * cells.length), ease: 'back.out(2)' });
    await sleep(D(600 + 50 * cells.length));
  };
  return A;
}

/* ---------- magic squares ---------- */
const LOOKS = {
  night: { tab: 'url(#cn-slate)', edge: '#F7C64E', cell: 'url(#cn-glass)', cs: '#7F9EE6', ink: '#FFE69A' },
  turtle: { tab: 'url(#cn-shell)', edge: '#173F27', cell: '#D6F0C9', cs: '#2A6E44', ink: '#123220' },
  durer: { tab: '#3A2A18', edge: '#C9A46A', cell: 'url(#cn-parch)', cs: '#7A5A30', ink: '#2A1A08' },
  gaudi: { tab: 'url(#cn-stone)', edge: '#6E6252', cell: '#EEE7DA', cs: '#8C7F6C', ink: '#33291D' }
};
const ARROW = (i, n) => i < n ? '←' : i < 2 * n ? '↑' : i === 2 * n ? '↖' : '↗';
function magicScene(board, sc, o) {
  const n = sc.n, C = n === 3 ? 76 : 62, G = 6, pad = 16, W = n * C + (n - 1) * G + 2 * pad, x0 = 56, y0 = 82, look = LOOKS[sc.look] || LOOKS.night;
  const cx = c => x0 + pad + c * (C + G) + C / 2, cy = r => y0 + pad + r * (C + G) + C / 2, pos = k => { const [r, c] = k.split('-').map(Number); return [cx(c), cy(r)]; };
  const VW = x0 + W + 56, VH = y0 + W + 58;
  const bpos = i => i < n ? [x0 + W + 25, cy(i)] : i < 2 * n ? [cx(i - n), y0 + W + 25] : i === 2 * n ? [x0 + W + 21, y0 + W + 21] : [x0 - 21, y0 + W + 21];
  const beams = sc.lines.map((L, i) => {
    const [ax, ay] = pos(L[0]), [bx, by] = pos(L[L.length - 1]), len = Math.hypot(bx - ax, by - ay) + C * 0.8, ang = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
    return `<g transform="translate(${f1((ax + bx) / 2)} ${f1((ay + by) / 2)}) rotate(${f1(ang)})"><rect class="beam" data-l="${i}" data-len="${f1(len)}" x="0" y="${f1(-C * 0.3)}" width="0" height="${f1(C * 0.6)}" rx="${f1(C * 0.3)}" fill="url(#cn-gold)" opacity="0"/></g>`;
  });
  const deco = {
    turtle: `<g fill="#7CC48A" stroke="#173F27" stroke-width="3">${[[x0 + 4, y0 + 4, -45], [x0 + W - 4, y0 + 4, 45], [x0 + 4, y0 + W - 4, 45], [x0 + W - 4, y0 + W - 4, -45]].map(([a, b, r]) => `<ellipse cx="${a}" cy="${b}" rx="24" ry="13" transform="rotate(${r} ${a} ${b})"/>`).join('')}
      <ellipse cx="${x0 - 14}" cy="${y0 + W / 2}" rx="26" ry="18"/></g><circle cx="${x0 - 24}" cy="${y0 + W / 2 - 6}" r="4" fill="#123220"/><path d="M${x0 - 34} ${y0 + W / 2 + 6}q6 4 12 0" stroke="#123220" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    gaudi: `<path d="M${x0 + 6} ${y0}V${y0 - 22}Q${x0 + 6} ${y0 - 72} ${x0 + W / 2} ${y0 - 80}Q${x0 + W - 6} ${y0 - 72} ${x0 + W - 6} ${y0 - 22}V${y0}" fill="rgb(238 231 218 / 0.08)" stroke="#9C8F7B" stroke-width="7"/>`,
    durer: `<text x="${x0 + W / 2}" y="${y0 + W + 52}" text-anchor="middle" font-size="14" font-style="italic" fill="#C9A46A">Albert Dürer, 1514</text>`
  }[sc.look] || '';
  const grid = Array.from({ length: n * n }, (_, i) => `${Math.floor(i / n)}-${i % n}`);
  const cells = grid.map(k => cellSVG(sc, k, ...pos(k), { w: C, h: C, rx: 13, fill: look.cell, stroke: look.cs, ink: look.ink, fs: n === 3 ? 30 : 26, still: o.still, cls: 'sq' }));
  const gem = cellSVG(sc, 'S', x0 + W / 2, y0 - 38, { poly: '-48,0 -31,-25 31,-25 48,0 31,25 -31,25', fill: 'url(#cn-gold)', stroke: '#8A5A10', sw: 2.5, ink: '#3A2400', fs: 28, still: o.still, cls: 'gem',
    over: '<path d="M-31 -25L-14 0L-31 25M31 -25L14 0L31 25M-14 0H14" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>' });
  const badges = sc.lines.map((_, i) => `<g class="lsum${sc.explore ? ' hit' : ''}" data-l="${i}" transform="translate(${bpos(i).map(f1).join(' ')})"${sc.explore && !o.still ? ' tabindex="0" role="button" aria-label="Suma aquesta línia"' : ''}><circle r="17"/><text y="6" text-anchor="middle" font-size="${sc.explore ? 20 : 16}">${sc.explore ? ARROW(i, n) : ''}</text></g>`);
  board.innerHTML = `<div class="scene s-magic look-${sc.look || 'night'}"><svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Un quadrat màgic">${deco}
    <rect x="${x0}" y="${y0}" width="${W}" height="${W}" rx="20" fill="${look.tab}" stroke="${look.edge}" stroke-width="4" filter="url(#cn-shadow)"/>
    ${sc.look === 'durer' ? `<rect x="${x0 + 6}" y="${y0 + 6}" width="${W - 12}" height="${W - 12}" rx="15" fill="none" stroke="${look.edge}" stroke-width="1.5"/>` : ''}
    ${[[x0 + 9, y0 + 9], [x0 + W - 9, y0 + 9], [x0 + 9, y0 + W - 9], [x0 + W - 9, y0 + W - 9]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3.5" fill="${look.edge}"/>`).join('')}
    ${cells.join('')}<g class="beams">${beams.join('')}</g>${gem}<text x="${x0 + W / 2 - 62}" y="${y0 - 33}" text-anchor="end" font-size="14" fill="#9EC3C0" class="cap">suma</text>${badges.join('')}</svg></div>`;
  const A = api(board), svg = board.querySelector('svg'), v = sc.cells, lit = new Set(), tapped = new Set();
  const known = new Set([...grid.filter(k => !sc.holes.includes(k) && !sc.blank.includes(k)), ...(sc.gem ? [] : ['S'])]);
  const badge = i => svg.querySelector(`.lsum[data-l="${i}"]`), beamOf = i => svg.querySelector(`.beam[data-l="${i}"]`);
  function show(i, quiet) {
    const L = sc.lines[i], s = L.reduce((t, k) => t + v[k], 0), b = badge(i);
    b.querySelector('text').textContent = s; b.querySelector('text').setAttribute('font-size', s > 99 ? 13 : 16); b.classList.add('ok');
    const bm = beamOf(i), len = +bm.dataset.len;
    if (quiet || RM) { bm.setAttribute('x', f1(-len / 2)); bm.setAttribute('width', f1(len)); bm.setAttribute('opacity', 0.22); }
    else { gsap.fromTo(bm, { attr: { x: 0, width: 0 }, opacity: 0.85 }, { attr: { x: -len / 2, width: len }, duration: 0.45, ease: 'power2.out' }); gsap.to(bm, { opacity: 0.22, duration: 0.6, delay: 0.5 }); pop(b); }
    return s;
  }
  const update = quiet => { if (!known.has('S') || sc.explore) return; sc.lines.forEach((L, i) => { if (!lit.has(i) && L.every(k => known.has(k))) { lit.add(i); show(i, quiet); } }); };
  update(true);
  const solve0 = A.solve;
  A.solve = (k, val) => { solve0(k, val); known.add(k); update(false); };
  if (sc.explore && !o.still) svg.addEventListener('click', e => {
    const b = e.target.closest('.lsum.hit'); if (!b) return;
    const i = +b.dataset.l, first = !tapped.has(i); tapped.add(i);
    const s = show(i, false);
    if (first) o.on?.('line', { i, sum: s, all: tapped.size === sc.lines.length });
  });
  A.finish = async () => {
    const bs = sc.lines.map((_, i) => beamOf(i));
    if (!RM) gsap.timeline().to(bs, { opacity: 0.75, duration: 0.18, stagger: 0.07 }).to(bs, { opacity: 0.22, duration: 0.4, stagger: 0.07 }, 0.3);
    await sleep(D(500 + 70 * bs.length));
  };
  return A;
}

/* ---------- padlocks ---------- */
function barSVG(bar, cx, y) {
  const W = 300, x0 = cx - W / 2, raw = bar.parts.map(p => Math.max(56, W * p / bar.whole)), k = W / raw.reduce((s, w) => s + w, 0), ws = raw.map(w => w * k);
  let x = x0;
  const parts = bar.parts.map((p, i) => { const r = `<rect x="${f1(x)}" y="${y + 40}" width="${f1(ws[i] - 4)}" height="32" rx="8" fill="${bar.hole === i ? 'rgb(111 227 255 / 0.15)' : 'rgb(124 245 176 / 0.25)'}" stroke="${bar.hole === i ? '#6FE3FF' : '#7CF5B0'}" stroke-width="2"${bar.hole === i ? ' stroke-dasharray="6 4"' : ''}/><text x="${f1(x + (ws[i] - 4) / 2)}" y="${y + 63}" text-anchor="middle" font-size="18" fill="#EAF8F4">${bar.hole === i ? '?' : p}</text>`; x += ws[i]; return r; });
  return `<g class="hx bar"><rect x="${x0}" y="${y}" width="${W - 4}" height="32" rx="8" fill="${bar.hole === 'whole' ? 'rgb(111 227 255 / 0.15)' : 'rgb(247 198 78 / 0.25)'}" stroke="${bar.hole === 'whole' ? '#6FE3FF' : '#F7C64E'}" stroke-width="2"/>
    <text x="${cx - 2}" y="${y + 23}" text-anchor="middle" font-size="18" fill="#EAF8F4">${bar.hole === 'whole' ? '?' : bar.whole}</text>${parts.join('')}</g>`;
}
function lockScene(board, sc, o) {
  const ts = sc.toks, wOf = (t, i) => i === sc.hole ? Math.max(62, String(t).length * 19 + 28) : typeof t === 'number' ? String(t).length * 19 + 12 : 30;
  const ws = ts.map(wOf), gap = 9, total = ws.reduce((s, w) => s + w, 0) + gap * (ts.length - 1);
  const plateW = Math.max(220, total + 36), bodyW = plateW + 46, VW = Math.max(400, bodyW + 70), cx = VW / 2, top = 118, bodyH = 158, bar = barOf(sc), VH = bar ? 380 : 296;
  let x = cx - total / 2;
  const row = ts.map((t, i) => { const w = ws[i], c = x + w / 2; x += w + gap; const ty = top + 60;
    return i === sc.hole ? cellSVG(sc, 'x', c, ty, { w, h: 56, rx: 12, fill: '#4A3510', stroke: '#F7C64E', sw: 2.5, ink: '#FFE69A', fs: 32, hole: true, still: o.still || sc.sign, cls: 'code' })
      : `<text x="${f1(c)}" y="${ty + 11}" text-anchor="middle" font-size="32" fill="#FFE69A">${t}</text>`; });
  const links = [];
  for (let lx = 14; lx < cx - bodyW / 2 + 6; lx += 24) links.push(lx);
  const chain = side => links.map((lx, j) => { const X = side ? VW - lx : lx; return `<ellipse class="link" cx="${X}" cy="${top + 78}" rx="${j % 2 ? 13 : 13}" ry="${j % 2 ? 4 : 8}" fill="none" stroke="url(#cn-steel)" stroke-width="5"/>`; }).join('');
  const sh = `M${cx - 66} ${top + 12}V78A66 66 0 0 1 ${cx + 66} 78V${top + 12}`;
  board.innerHTML = `<div class="scene s-lock"><svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Un cadenat">${chain(0)}${chain(1)}
    <g class="shackle"><path d="${sh}" fill="none" stroke="#4E5A66" stroke-width="28"/><path d="${sh}" fill="none" stroke="url(#cn-steel)" stroke-width="20"/><path d="M${cx - 72} ${top + 4}V78A72 72 0 0 1 ${cx - 30} 15" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round"/></g>
    <g class="lbody"><rect x="${cx - bodyW / 2}" y="${top}" width="${bodyW}" height="${bodyH}" rx="30" fill="url(#cn-gold)" stroke="#8A5A10" stroke-width="3" filter="url(#cn-shadow)"/>
    <rect x="${cx - bodyW / 2 + 9}" y="${top + 9}" width="${bodyW - 18}" height="${bodyH - 18}" rx="23" fill="none" stroke="#FFF6CF" stroke-opacity="0.7" stroke-width="2"/>
    ${[[cx - bodyW / 2 + 20, top + 20], [cx + bodyW / 2 - 20, top + 20], [cx - bodyW / 2 + 20, top + bodyH - 20], [cx + bodyW / 2 - 20, top + bodyH - 20]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="5" fill="#C99A2E" stroke="#8A5A10"/>`).join('')}
    <rect x="${cx - plateW / 2}" y="${top + 24}" width="${plateW}" height="72" rx="16" fill="#2A1C00" stroke="#5A3C08" stroke-width="2"/>
    <circle cx="${cx}" cy="${top + bodyH - 34}" r="9" fill="#3A2400"/><path d="M${cx - 5} ${top + bodyH - 30}h10l3 16h-16Z" fill="#3A2400"/>${row.join('')}</g>
    ${bar ? barSVG(bar, cx, top + bodyH + 30) : ''}</svg></div>`;
  const A = api(board), svg = board.querySelector('svg');
  A.finish = async () => {
    if (sc.sign) A.solve('x', sc.cells.x);
    svg.querySelector('.lbody').classList.add('open');
    gsap.to(svg.querySelector('.shackle'), { y: -30, rotation: -24, svgOrigin: `${cx - 66} ${top + 12}`, duration: D(0.55), ease: 'back.out(2.5)' });
    if (!RM) gsap.to([...svg.querySelectorAll('.link')], { y: 110, opacity: 0, rotation: () => gsap.utils.random(-60, 60), duration: 0.8, delay: 0.25, stagger: 0.025, ease: 'power2.in', transformOrigin: '50% 50%' });
    await sleep(D(1100));
  };
  return A;
}

/* ---------- balances ---------- */
const WEIGHT = (n, s = 1) => { const w = (n >= 10 ? 46 : 38) * s, h = 30 * s, t = w * 0.66;
  return `<path d="M${-w / 2} 0L${-t / 2} ${-h}H${t / 2}L${w / 2} 0Z" fill="url(#cn-iron)" stroke="#161B20" stroke-width="1.5"/><circle cy="${-h - 4 * s}" r="${5 * s}" fill="none" stroke="#3A444E" stroke-width="${3 * s}"/><text y="${-h * 0.28}" text-anchor="middle" font-size="${17 * s}" fill="#FFE69A">${n}</text>`; };
const CRATE = (v, s = 1) => { const w = 40 * s, h = 36 * s;
  return `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="${4 * s}" fill="url(#cn-wood)" stroke="#4E3014" stroke-width="1.5"/><path d="M${-w / 2 + 3} ${-h + 3}L${w / 2 - 3} -3M${w / 2 - 3} ${-h + 3}L${-w / 2 + 3} -3" stroke="#6E4520" stroke-opacity="0.45" stroke-width="${2.5 * s}"/>
    <rect x="${-w / 2 + 7 * s}" y="${-h / 2 - 10 * s}" width="${w - 14 * s}" height="${20 * s}" rx="${4 * s}" fill="#FFF3D6"/><text class="xv" y="${-h / 2 + 6 * s}" text-anchor="middle" font-size="${17 * s}" fill="#3B2208">${v ?? '?'}</text>`; };
const itemW = (t, s) => (typeof t === 'number' ? (t >= 10 ? 48 : 40) : t === 'x' ? 44 : 40) * s;
const itemH = (t, s) => (typeof t === 'number' ? 40 : t === 'x' ? 38 : 36) * s;
function itemSVG(t, s, known) {
  if (typeof t === 'number') return WEIGHT(t, s);
  if (t === 'x') return CRATE(known.has('x') ? known.get('x') : null, s);
  return `<text y="${-6 * s}" text-anchor="middle" font-size="${32 * s}">${t}</text>${known.has(t) ? `<g transform="translate(${12 * s} ${-4 * s})"><rect x="${-11 * s}" y="${-9 * s}" width="${22 * s}" height="${16 * s}" rx="${5 * s}" fill="#F7C64E"/><text y="${4 * s}" text-anchor="middle" font-size="${12 * s}" fill="#2A1C00">${known.get(t)}</text></g>` : ''}`;
}
// items laid on a pan, rows of up to 120 wide from the rim upwards
function layout(items, s) {
  const rows = [[]]; let w = 0;
  items.forEach((t, i) => { const iw = itemW(t, s); if (w + iw > 124 * s && rows[rows.length - 1].length) { rows.push([]); w = 0; } rows[rows.length - 1].push(i); w += iw; });
  const pos = []; let y = -3;
  for (const r of rows) {
    const tw = r.reduce((a, i) => a + itemW(items[i], s), 0); let x = -tw / 2;
    for (const i of r) { const iw = itemW(items[i], s); pos[i] = [x + iw / 2, y]; x += iw; }
    y -= Math.max(...r.map(i => itemH(items[i], s))) + 2;
  }
  return pos;
}
// One balance or more, level or to make level. The beam swings like a spring towards where its weights pull it
function balScene(board, sc, o) {
  const multi = sc.pans.length > 1, mode = sc.mode || 'solve', s = multi ? 0.85 : 1;
  const G = multi ? { H: 196, by: 56, Lb: 132, hang: 48, foot: 178 } : { H: 280, by: 94, Lb: 138, hang: 64, foot: 258 };
  const W = 420, cx = W / 2, legendY = sc.pans.length * G.H + 6, VH = mode === 'level' ? G.H : legendY + 74, known = new Map();
  const bs = sc.pans.map(([L, R]) => ({ side: [L.slice(), R.slice()], fixed: R.length, th: 0, w: 0 }));
  const legend = mode === 'level' ? '' : `<g class="legend">${sc.holes.map((k, i) => { const lx = cx + (i - (sc.holes.length - 1) / 2) * 150;
    return `<g transform="translate(${lx - 40} ${legendY + 40})">${k === 'x' ? `<g transform="translate(0 16)">${CRATE('?', 0.8)}</g>` : `<text y="10" text-anchor="middle" font-size="30">${k}</text>`}</g><text x="${lx - 8}" y="${legendY + 50}" text-anchor="middle" font-size="26" fill="#9EC3C0">=</text>${cellSVG(sc, k, lx + 36, legendY + 40, { w: 64, h: 50, rx: 12, fill: 'url(#cn-glass)', stroke: '#7F9EE6', ink: '#FFE69A', fs: 28, still: o.still })}`; }).join('')}</g>`;
  const ticks = [-24, -12, 0, 12, 24].map(a => { const r = a * Math.PI / 180; return `<path d="M${f1(cx + Math.sin(r) * 34)} ${f1(G.by + Math.cos(r) * 34)}L${f1(cx + Math.sin(r) * 42)} ${f1(G.by + Math.cos(r) * 42)}" stroke="${a ? '#9EC3C0' : '#7CF5B0'}" stroke-width="${a ? 2 : 3.5}" stroke-linecap="round"/>`; }).join('');
  const one = (b, i) => `<g class="bset" data-b="${i}" transform="translate(0 ${i * G.H})">
    <path d="M${cx - 74} ${G.foot + 14}L${cx - 44} ${G.foot - 4}H${cx + 44}L${cx + 74} ${G.foot + 14}Z" fill="url(#cn-copper)" stroke="#5A2E10" stroke-width="2"/>
    <rect x="${cx - 8}" y="${G.by}" width="16" height="${G.foot - G.by}" rx="4" fill="url(#cn-copper)" stroke="#5A2E10" stroke-width="1.5"/>${ticks}
    <g class="beam"><rect x="${cx - G.Lb - 10}" y="${G.by - 6}" width="${2 * G.Lb + 20}" height="12" rx="6" fill="url(#cn-gold)" stroke="#8A5A10" stroke-width="1.5"/>
      <path d="M${cx} ${G.by}L${cx - 4} ${G.by + 40}H${cx + 4}Z" fill="#FF6B5E"/><circle cx="${cx - G.Lb}" cy="${G.by}" r="6" fill="#8A5A10"/><circle cx="${cx + G.Lb}" cy="${G.by}" r="6" fill="#8A5A10"/></g>
    <circle cx="${cx}" cy="${G.by}" r="12" fill="url(#cn-gold)" stroke="#8A5A10" stroke-width="2"/><circle cx="${cx}" cy="${G.by}" r="4" fill="#8A5A10"/>
    <g class="pan" data-side="0"></g><g class="pan" data-side="1"></g></g>`;
  board.innerHTML = `<div class="scene s-bal"><svg viewBox="0 0 ${W} ${VH}" role="img" aria-label="${multi ? 'Dues balances' : 'Una balança'}">${bs.map(one).join('')}${legend}</svg>${!multi && mode === 'solve' ? '<p class="eqn" aria-live="polite"></p>' : ''}</div>`;
  const A = api(board), svg = board.querySelector('svg'), sets = [...svg.querySelectorAll('.bset')];
  const weigh = a => a.reduce((t, x) => t + (typeof x === 'number' ? x : sc.vals[x] ?? 0), 0);
  const panHTML = (b, side) => { const items = bs[b].side[side], pos = layout(items, s);
    return `<path d="M-56 -2L0 ${-G.hang}L56 -2" fill="none" stroke="#C9D6E0" stroke-width="2" stroke-dasharray="3 2"/><path d="M-68 0Q0 30 68 0Z" fill="url(#cn-gold)" stroke="#8A5A10" stroke-width="2"/><ellipse rx="68" ry="5" fill="#FFE69A" opacity="0.65"/>
      ${items.map((t, i) => `<g class="item${mode === 'level' && side === 1 && i >= bs[b].fixed ? ' mine' : ''}" data-b="${b}" data-side="${side}" data-i="${i}" transform="translate(${f1(pos[i][0])} ${f1(pos[i][1])})">${itemSVG(t, s, known)}</g>`).join('')}`; };
  const paint = b => { sets[b].querySelectorAll('.pan').forEach(p => { p.innerHTML = panHTML(b, +p.dataset.side); }); };
  const eqn = board.querySelector('.eqn'), side = a => a.map(t => t === 'x' ? (known.has('x') ? known.get('x') : '?') : t).join(' + ');
  const writeEq = () => { if (eqn) eqn.textContent = `${side(bs[0].side[0])} = ${side(bs[0].side[1])}`; };
  bs.forEach((_, b) => paint(b)); writeEq();
  const place = b => {
    const B = bs[b], g = sets[b], c = Math.cos(B.th), sn = Math.sin(B.th);
    g.querySelector('.beam').setAttribute('transform', `rotate(${f1(B.th * 180 / Math.PI)} ${cx} ${G.by})`);
    const [p0, p1] = g.querySelectorAll('.pan');
    p0.setAttribute('transform', `translate(${f1(cx - G.Lb * c)} ${f1(G.by - G.Lb * sn + G.hang)})`);
    p1.setAttribute('transform', `translate(${f1(cx + G.Lb * c)} ${f1(G.by + G.Lb * sn + G.hang)})`);
  };
  const aim = B => { const d = weigh(B.side[1]) - weigh(B.side[0]); return d ? Math.sign(d) * Math.min(0.3, 0.07 + Math.abs(d) * 0.018) : 0; };
  const F = frames(o.t || { on: true }, svg, dt => {
    let moving = false;
    bs.forEach((B, b) => { const a = aim(B); if (RM) { B.th = a; B.w = 0; } else { B.w += ((a - B.th) * 80 - B.w * 9) * dt; B.th += B.w * dt; } place(b); if (Math.abs(B.w) > 0.002 || Math.abs(a - B.th) > 0.002) moving = true; });
    return moving;
  }, { still: true });
  bs.forEach((_, b) => place(b)); F.start();
  const emitLevel = () => o.on?.('balance', { L: weigh(bs[0].side[0]), R: weigh(bs[0].side[1]) });
  if (!o.still) svg.addEventListener('click', e => {
    const it = e.target.closest('.item'); if (!it) return;
    const b = +it.dataset.b, sd = +it.dataset.side, i = +it.dataset.i, B = bs[b];
    if (mode === 'level') { if (sd !== 1 || i < B.fixed) return; B.side[1].splice(i, 1); paint(b); F.start(); emitLevel(); return; }
    const t = B.side[sd][i], j = B.side[1 - sd].findIndex(x => x === t);
    if (j < 0) { shake(it); o.on?.('nomatch', t); return; }
    const other = sets[b].querySelector(`.pan[data-side="${1 - sd}"] .item[data-i="${j}"]`);
    B.side[sd].splice(i, 1); B.side[1 - sd].splice(j, 1);
    gsap.to([it, other], { y: '-=34', opacity: 0, scale: 0.5, duration: D(0.35), ease: 'power2.in', transformOrigin: '50% 100%', onComplete: () => { paint(b); F.start(); } });
    writeEq(); o.on?.('cancel', t);
  });
  A.add = w => { const B = bs[0]; if (B.side[1].length >= 10) return; B.side[1].push(w); paint(0); F.start(); const last = sets[0].querySelector('.pan[data-side="1"] .item:last-child'); if (!RM) gsap.from(last, { y: -60, opacity: 0, duration: 0.35, ease: 'bounce.out' }); emitLevel(); };
  const solve0 = A.solve;
  A.solve = (k, v) => { solve0(k, v); known.set(k, v); bs.forEach((_, b) => paint(b)); writeEq(); };
  A.finish = async () => { svg.classList.add('won'); await sleep(D(700)); };
  return A;
}
// Three small balances held level by a pin. tilt(k) takes out the pin of one; finish() the pins of all
function bal3Scene(board, sc, o) {
  const G = { W: 240, by: 50, Lb: 86, hang: 40, foot: 162 }, cx = G.W / 2, s = 0.62;
  const bs = sc.items.map(it => ({ ...it, th: 0, w: 0, pinned: true }));
  const pan = items => { const pos = layout(items, s); return `<path d="M-40 -2L0 ${-G.hang}L40 -2" fill="none" stroke="#C9D6E0" stroke-width="1.6" stroke-dasharray="3 2"/><path d="M-48 0Q0 22 48 0Z" fill="url(#cn-gold)" stroke="#8A5A10" stroke-width="1.5"/>
    ${items.map((t, i) => `<g transform="translate(${f1(pos[i][0])} ${f1(pos[i][1])})">${WEIGHT(t, s)}</g>`).join('')}`; };
  board.innerHTML = `<div class="scene s-bal3"><div class="trio">${bs.map(B => `<div class="hit one" data-k="${B.k}" tabindex="${o.still ? -1 : 0}" role="button" aria-label="La balança ${B.k.toUpperCase()}">
    <svg viewBox="0 0 ${G.W} 186"><path d="M${cx - 50} ${G.foot + 12}L${cx - 30} ${G.foot - 2}H${cx + 30}L${cx + 50} ${G.foot + 12}Z" fill="url(#cn-copper)" stroke="#5A2E10" stroke-width="1.5"/>
    <rect x="${cx - 6}" y="${G.by}" width="12" height="${G.foot - G.by}" rx="3" fill="url(#cn-copper)"/>
    <g class="beam"><rect x="${cx - G.Lb - 8}" y="${G.by - 5}" width="${2 * G.Lb + 16}" height="10" rx="5" fill="url(#cn-gold)" stroke="#8A5A10"/></g>
    <circle cx="${cx}" cy="${G.by}" r="9" fill="url(#cn-gold)" stroke="#8A5A10" stroke-width="1.5"/>
    <g class="pan">${pan(B.L)}</g><g class="pan">${pan(B.R)}</g>
    <g class="pin"><path d="M${cx + 10} ${G.by - 24}L${cx - 6} ${G.by + 18}" stroke="#DCE6EE" stroke-width="3" stroke-linecap="round"/><circle cx="${cx + 11}" cy="${G.by - 26}" r="7" fill="#FF6B5E" stroke="#8A2A22" stroke-width="1.5"/></g>
    <text x="22" y="30" font-size="22" fill="#F7C64E">${B.k.toUpperCase()}</text></svg></div>`).join('')}</div></div>`;
  const A = api(board), svgs = [...board.querySelectorAll('.one svg')];
  const sum = a => a.reduce((t, x) => t + x, 0);
  const aim = B => { if (B.pinned) return 0; const d = sum(B.R) - sum(B.L); return d ? Math.sign(d) * Math.min(0.32, 0.12 + Math.abs(d) * 0.04) : 0; };
  const place = (B, svg) => {
    const c = Math.cos(B.th), sn = Math.sin(B.th);
    svg.querySelector('.beam').setAttribute('transform', `rotate(${f1(B.th * 180 / Math.PI)} ${cx} ${G.by})`);
    const [p0, p1] = svg.querySelectorAll('.pan');
    p0.setAttribute('transform', `translate(${f1(cx - G.Lb * c)} ${f1(G.by - G.Lb * sn + G.hang)})`); p1.setAttribute('transform', `translate(${f1(cx + G.Lb * c)} ${f1(G.by + G.Lb * sn + G.hang)})`);
  };
  const F = frames(o.t || { on: true }, board.firstChild, dt => {
    let moving = false;
    bs.forEach((B, i) => { const a = aim(B); if (RM) B.th = a; else { B.w += ((a - B.th) * 70 - B.w * 7) * dt; B.th += B.w * dt; } place(B, svgs[i]); if (Math.abs(B.w) > 0.002 || Math.abs(a - B.th) > 0.002) moving = true; });
    return moving;
  }, { still: true });
  bs.forEach((B, i) => place(B, svgs[i])); F.start();
  const unpin = i => { const B = bs[i]; if (!B.pinned) return; B.pinned = false; gsap.to(svgs[i].querySelector('.pin'), { y: -40, opacity: 0, duration: D(0.35) }); F.start(); };
  A.tilt = k => unpin(bs.findIndex(B => B.k === k));
  A.finish = async () => { bs.forEach((_, i) => unpin(i)); await sleep(D(1300)); };
  return A;
}

/* ---------- machines ---------- */
const gear = (r, n) => { const p = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n, h = Math.PI / n;
  for (const [d, rr] of [[-0.42 * h, r], [0.42 * h, r], [h - 0.42 * h, r * 0.74], [h + 0.42 * h, r * 0.74]]) p.push(`${f1(Math.cos(a + d) * rr)},${f1(Math.sin(a + d) * rr)}`); }
  return `<polygon class="gear" points="${p.join(' ')}" fill="#4E2A12" stroke="#2E170A" stroke-width="1.5"/><circle r="${f1(r * 0.28)}" fill="#C8773F"/>`; };
function machScene(board, sc, o) {
  const N = sc.steps.length, CW = 118, GAP = 88, W = GAP + N * (CW + GAP), py = 120, rule = sc.mode === 'rule', VH = sc.mode === 'in' ? 226 : 204;
  const ox = i => GAP / 2 + i * (CW + GAP), chx = i => GAP + i * (CW + GAP) + CW / 2;
  const chambers = sc.steps.map((st, i) => `<g class="chamber" data-i="${i}" transform="translate(${chx(i)} ${py})">
    <rect x="${-CW / 2 + 10}" y="-92" width="${CW - 20}" height="16" rx="6" fill="#7A3E1A"/><rect x="${-CW / 2}" y="-80" width="${CW}" height="132" rx="18" fill="url(#cn-copper)" stroke="#5A2E10" stroke-width="3" filter="url(#cn-shadow)"/>
    <rect x="-46" y="-70" width="92" height="40" rx="10" fill="#1B1206" stroke="#F7C64E" stroke-width="2"/><text class="lab" y="-41" text-anchor="middle" font-size="27" fill="#FFE69A">${rule ? '?' : st}</text>
    <circle cy="8" r="24" fill="#0B2733" stroke="#5A2E10" stroke-width="5"/><path d="M-12 -2a14 14 0 0 1 14 -10" stroke="#fff" stroke-opacity="0.4" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g transform="translate(-34 36)">${gear(15, 9)}</g><g transform="translate(34 34)" class="g2">${gear(12, 7)}</g>
    ${[[-CW / 2 + 10, -70], [CW / 2 - 10, -70], [-CW / 2 + 10, 42], [CW / 2 - 10, 42]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3.5" fill="#F6C194"/>`).join('')}
    ${sc.mode === 'in' ? `<text class="hx" y="80" text-anchor="middle" font-size="18" fill="#F7C64E">al revés: ${undo(st)}</text>` : ''}</g>`);
  const orbs = rule ? '' : sc.steps.concat(['']).map((_, i) => cellSVG(sc, `m${i}`, ox(i), py, { r: 27, fill: 'url(#cn-orb)', stroke: '#D6FAFF', sw: 2, ink: '#05313F', fs: 26, still: o.still, cls: 'orb' })).join('');
  const arrows = Array.from({ length: 2 * N }, (_, j) => { const x = j % 2 ? chx((j - 1) / 2) + CW / 2 + 9 : chx(j / 2) - CW / 2 - 9; return `<path d="M${x - 4} ${py - 7}L${x + 4} ${py}L${x - 4} ${py + 7}" fill="none" stroke="#6FE3FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');
  const table = rule ? `<table class="io"><tr><th>Entra</th>${sc.table.map(([a]) => `<td>${a}</td>`).join('')}</tr><tr><th>Surt</th>${sc.table.map(([, b]) => `<td>${b}</td>`).join('')}</tr></table>` : '';
  board.innerHTML = `<div class="scene s-mach"><svg viewBox="0 0 ${W} ${VH}" role="img" aria-label="Una màquina">
    <rect x="6" y="${py - 15}" width="${W - 12}" height="30" rx="15" fill="rgb(111 227 255 / 0.10)" stroke="rgb(111 227 255 / 0.45)" stroke-width="2"/><path d="M20 ${py - 8}H${W - 20}" stroke="#fff" stroke-opacity="0.16" stroke-width="3" stroke-linecap="round"/>
    ${arrows}${chambers.join('')}${orbs}<circle class="ball" cx="${ox(0)}" cy="${py}" r="11" fill="#FFFBE6" filter="url(#cn-glow)" opacity="0"/></svg>${table}</div>`;
  const A = api(board), svg = board.querySelector('svg'), ball = svg.querySelector('.ball'), chs = [...svg.querySelectorAll('.chamber')];
  let queue = Promise.resolve();
  async function run(a, b) {
    const dir = Math.sign(b - a);
    for (let i = a; i !== b; i += dir) {
      const ch = chs[dir > 0 ? i : i - 1], lab = ch.querySelector('.lab'), st = sc.steps[dir > 0 ? i : i - 1];
      ch.classList.add(dir > 0 ? 'run' : 'rev'); if (dir < 0) lab.textContent = undo(st);
      if (!RM) await gsap.fromTo(ball, { attr: { cx: ox(i) }, opacity: 1 }, { attr: { cx: ox(i + dir) }, duration: 0.7, ease: 'power1.inOut' });
      ch.classList.remove('run', 'rev'); lab.textContent = rule && !ch.classList.contains('shown') ? '?' : st;
    }
    gsap.to(ball, { opacity: 0, duration: D(0.2) });
  }
  const solve0 = A.solve;
  A.solve = (k, v) => { solve0(k, v); const i = +k.slice(1); queue = queue.then(() => sc.mode === 'out' ? run(i - 1, i) : run(i + 1, i)); };
  A.finish = async () => {
    await queue;
    if (rule) chs.forEach((ch, i) => { ch.classList.add('shown'); ch.querySelector('.lab').textContent = sc.steps[i]; pop(ch.querySelector('.lab')); });
    await run(0, N);
  };
  return A;
}

/* ---------- series on lily pads ---------- */
function serScene(board, sc, o) {
  const n = sc.vals.length, step = 86, W = n * step + 16, VH = 186, px = i => 8 + step / 2 + i * step, py = i => 128 + (i % 2 ? -10 : 8);
  const arcs = sc.jumps.map((j, i) => { const a = px(i), b = px(i + 1), m = (a + b) / 2, ya = py(i) - 20, yb = py(i + 1) - 20, top = Math.min(ya, yb) - 46;
    return `<path d="M${a} ${ya}Q${m} ${top} ${b} ${yb}" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="2.5" stroke-dasharray="5 5"/><g class="hx"><rect x="${m - 25}" y="${top - 4}" width="50" height="24" rx="12" fill="#F7C64E"/><text x="${m}" y="${top + 14}" text-anchor="middle" font-size="16" fill="#2A1C00">${j}</text></g>`; });
  const pads = sc.vals.map((_, i) => cellSVG(sc, `t${i}`, px(i), py(i), { ell: [40, 26], fill: 'url(#cn-pad)', stroke: '#1F5A30', sw: 2, ink: '#062A10', fs: 28, still: o.still, cls: 'pad',
    under: '<ellipse rx="44" ry="10" cy="16" fill="#000" opacity="0.22"/>', over: '<path class="notch" d="M24 -6L39 -15L41 -5Z" fill="#0D3B4F"/>' }));
  board.innerHTML = `<div class="scene s-ser"><svg viewBox="0 0 ${W} ${VH}" role="img" aria-label="Una sèrie de nenúfars">
    <rect x="0" y="36" width="${W}" height="${VH - 36}" rx="24" fill="url(#cn-water)"/>
    ${[0.2, 0.5, 0.8].map((f, i) => `<ellipse class="ripple" cx="${W * f}" cy="${VH - 22 - i * 6}" rx="${30 + i * 8}" ry="5" fill="none" stroke="#6FE3FF" stroke-opacity="0.25" stroke-width="2" style="animation-delay:${i * 0.7}s"/>`).join('')}
    ${arcs.join('')}${pads.join('')}<g class="hop" transform="translate(${px(0) - 4} ${py(0) - 42})">${MINI}</g></svg></div>`;
  const A = api(board), frog = board.querySelector('.hop');
  A.finish = async () => {
    for (let i = 0; i < n - 1 && !RM; i++) {
      const a = [px(i) - 4, py(i) - 42], b = [px(i + 1) - 4, py(i + 1) - 42];
      await tween(260, k => frog.setAttribute('transform', `translate(${f1(a[0] + (b[0] - a[0]) * k)} ${f1(a[1] + (b[1] - a[1]) * k - Math.sin(Math.PI * k) * 44)})`));
    }
    await sleep(D(250));
  };
  return A;
}

/* ---------- the wheel ---------- */
function wheelScene(board, sc, o) {
  const n = sc.n, c = 170, R1 = 84, R2 = 136, a = i => (-90 + i * 360 / n) * Math.PI / 180, at = (i, r) => [c + Math.cos(a(i)) * r, c + Math.sin(a(i)) * r];
  const wedges = Array.from({ length: 2 * n }, (_, j) => { const a0 = (-90 + (j - 0.5) * 180 / n) * Math.PI / 180, a1 = (-90 + (j + 0.5) * 180 / n) * Math.PI / 180;
    return `<path d="M${c} ${c}L${f1(c + Math.cos(a0) * 160)} ${f1(c + Math.sin(a0) * 160)}A160 160 0 0 1 ${f1(c + Math.cos(a1) * 160)} ${f1(c + Math.sin(a1) * 160)}Z" fill="${j % 2 ? '#2A1D55' : '#3D2B78'}"/>`; });
  const bulbs = Array.from({ length: 4 * n }, (_, j) => { const r = (-90 + j * 90 / n) * Math.PI / 180; return `<circle class="bulb" cx="${f1(c + Math.cos(r) * 160)}" cy="${f1(c + Math.sin(r) * 160)}" r="4.5" style="animation-delay:${(j % 4) * 0.25}s"/>`; });
  const spokes = Array.from({ length: n }, (_, i) => `<path d="M${c} ${c}L${at(i, R2).map(f1).join(' ')}" stroke="#F7C64E" stroke-opacity="0.4" stroke-width="4"/>`);
  const inner = Array.from({ length: n }, (_, i) => cellSVG(sc, `s${i}`, ...at(i, R1), { r: 26, fill: 'url(#cn-glass)', stroke: '#A9C0FF', sw: 2, ink: '#FFFFFF', fs: 22, still: o.still }));
  const outer = Array.from({ length: n }, (_, i) => cellSVG(sc, `o${i}`, ...at(i, R2), { r: 27, fill: '#FFF3D6', stroke: '#F7C64E', sw: 3, ink: '#3A2400', fs: 22, still: o.still }));
  board.innerHTML = `<div class="scene s-wheel"><svg viewBox="0 0 340 340" role="img" aria-label="Una roda">
    <g class="spin">${wedges.join('')}<circle cx="${c}" cy="${c}" r="160" fill="none" stroke="url(#cn-gold)" stroke-width="8"/>${bulbs.join('')}
    <circle cx="${c}" cy="${c}" r="${R1}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="2" stroke-dasharray="4 6"/>${spokes.join('')}${inner.join('')}${outer.join('')}
    ${cellSVG(sc, 'c', c, c, { r: 42, fill: 'url(#cn-gold)', stroke: '#8A5A10', sw: 3, ink: '#3A2400', fs: 27, pre: sc.op, still: o.still, cls: 'hub' })}</g></svg></div>`;
  const A = api(board), g = board.querySelector('.spin');
  A.finish = async () => { g.classList.add('lit-all'); gsap.to(g, { rotation: 360, svgOrigin: `${c} ${c}`, duration: D(1.4), ease: 'power3.inOut' }); await sleep(D(1450)); };
  return A;
}

/* ---------- the table of multiplying ---------- */
function mgridScene(board, sc, o) {
  const R = sc.R, C = sc.C, w = 68, h = 56, g = 7, W = (C + 1) * (w + g) + 14, VH = (R + 1) * (h + g) + 14, x = j => 7 + j * (w + g) + w / 2, y = i => 7 + i * (h + g) + h / 2;
  const head = { rx: 16, w, h, fill: 'url(#cn-gold)', stroke: '#8A5A10', ink: '#3A2400', fs: 27, still: o.still, cls: 'head' };
  const cells = [`<g transform="translate(${x(0)} ${y(0)})"><circle r="22" fill="#1B1206" stroke="#F7C64E" stroke-width="2"/><text y="10" text-anchor="middle" font-size="30" fill="#F7C64E">×</text></g>`];
  for (let j = 0; j < C; j++) cells.push(cellSVG(sc, `c${j}`, x(j + 1), y(0), head));
  for (let i = 0; i < R; i++) { cells.push(cellSVG(sc, `r${i}`, x(0), y(i + 1), head)); for (let j = 0; j < C; j++) cells.push(cellSVG(sc, `p${i}-${j}`, x(j + 1), y(i + 1), { w, h, rx: 10, fill: 'url(#cn-glass)', stroke: '#7F9EE6', ink: '#FFE69A', fs: 26, still: o.still })); }
  board.innerHTML = `<div class="scene s-mgrid"><svg viewBox="0 0 ${W} ${VH}" role="img" aria-label="Una taula de multiplicar">${cells.join('')}</svg></div>`;
  const A = api(board), all = [...board.querySelectorAll('.cell')];
  A.finish = async () => { if (!RM) gsap.fromTo(all, { scale: 1 }, { scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, stagger: 0.03, transformOrigin: '50% 50%' }); await sleep(D(400 + 30 * all.length)); };
  return A;
}

/* ---------- secret symbols, in HTML ---------- */
const tok = t => isSym(t) ? `<span class="e">${t}<i class="tag" data-s="${H(t)}"></i></span>` : typeof t === 'number' ? `<span class="n">${t}</span>` : `<span class="op">${t}</span>`;
function tagsOf(board, known) {
  for (const tg of board.querySelectorAll('.tag')) if (known.has(tg.dataset.s) && !tg.classList.contains('on')) { tg.textContent = known.get(tg.dataset.s); tg.classList.add('on'); pop(tg); }
}
function legendHTML(sc, o) {
  return `<div class="legend">${sc.holes.filter(k => k !== 'T').map(k => `<span class="lg"><span class="e">${k}</span><span class="op">=</span>${cellHTML(sc, k, o.still)}</span>`).join('')}</div>`;
}
function symScene(board, sc, o) {
  const lines = sc.lines.map(L => `<div class="plq${L.ask ? ' ask' : ''}" data-k="${L.id}">${L.lhs.map(tok).join('')}<span class="op">=</span>${L.ask ? cellHTML(sc, 'T', o.still, 'tot') : `<span class="tot">${L.rhs[0]}</span>`}</div>`);
  board.innerHTML = `<div class="scene s-sym"><div class="plqs">${lines.join('')}</div>${legendHTML(sc, o)}</div>`;
  return symApi(board);
}
function fgridScene(board, sc, o) {
  const R = sc.grid.length, C = sc.grid[0].length, rowSum = i => sc.lines.find(l => l.id === `r${i}`).rhs[0], colSum = j => sc.lines.find(l => l.id === `c${j}`).rhs[0];
  const tiles = [];
  for (let i = 0; i < R; i++) { for (let j = 0; j < C; j++) { const t = sc.grid[i][j]; tiles.push(`<span class="ft ln-r${i} ln-c${j}">${t}<i class="tag" data-s="${H(t)}"></i></span>`); } tiles.push(`<span class="fs" data-k="r${i}">${rowSum(i)}</span>`); }
  for (let j = 0; j < C; j++) tiles.push(`<span class="fs" data-k="c${j}">${colSum(j)}</span>`);
  board.innerHTML = `<div class="scene s-fgrid"><div class="fg" style="--c:${C + 1}">${tiles.join('')}</div>${legendHTML(sc, o)}</div>`;
  return symApi(board);
}
function symApi(board) {
  const A = api(board), known = new Map(), solve0 = A.solve;
  A.solve = (k, v) => { solve0(k, v); known.set(k, v); tagsOf(board, known); };
  A.finish = async () => { const ps = [...board.querySelectorAll('.plq, .ft')]; if (!RM) gsap.fromTo(ps, { y: 0 }, { y: -6, duration: 0.15, yoyo: true, repeat: 1, stagger: 0.05 }); await sleep(D(500 + 50 * ps.length)); };
  return A;
}
// a sum in columns on squared paper
function cryptScene(board, sc, o) {
  const len = sc.len, row = (j, sign) => { const d = String(sc.nums[j]), pad = len - d.length;
    return `<span class="sg">${sign}</span>${Array.from({ length: len }, (_, c) => { const i = len - 1 - c; return c < pad ? '<span class="dg"></span>' : cellHTML(sc, 'abc'[j] + i, o.still, `dg ln-col${i}`); }).join('')}`; };
  board.innerHTML = `<div class="scene s-crypt"><div class="paper" style="--n:${len + 1}">${row(0, '')}${row(1, sc.op)}<span class="rule"></span>${row(2, '')}</div></div>`;
  const A = api(board);
  A.finish = async () => { const ds = [...board.querySelectorAll('.cell')]; if (!RM) gsap.fromTo(ds, { y: 0 }, { y: -8, duration: 0.14, yoyo: true, repeat: 1, stagger: 0.04 }); await sleep(D(400 + 40 * ds.length)); };
  return A;
}
// a riddle on a scroll; a story has its bars; the hint of a number thought is the way back
function riddleScene(board, sc, o) {
  const bars = sc.bars ? `<div class="bars">${sc.bars.rows.map(([name, parts]) => `<div class="br"><span class="bl">${name}</span><span class="segs">${parts.map(p => p === '?' ? '<i class="sg q">?</i>' : `<i class="sg n">${p}</i>`).join('')}</span></div>`).join('')}
    <p class="btot">Entre tots: <b>${sc.bars.total}</b></p></div>` : '';
  const back = sc.steps ? `<p class="hx chain"><b>${sc.out}</b>${sc.steps.slice().reverse().map(s => ` → <i>${undo(s)}</i> → ?`).join('')}</p>` : '';
  board.innerHTML = `<div class="scene s-riddle"><div class="scroll"><span class="orb" aria-hidden="true">🔮</span><p class="rtx">${H(sc.text)}</p></div>${bars}${back}
    <div class="legend"><span class="lg"><span class="w">${sc.steps ? 'El número pensat' : 'La resposta'}</span><span class="op">=</span>${cellHTML(sc, 'x', o.still)}</span></div></div>`;
  const A = api(board);
  A.finish = async () => { const b = board.querySelector('.orb'); if (!RM) gsap.fromTo(b, { rotation: 0, scale: 1 }, { rotation: 360, scale: 1.3, duration: 0.8, ease: 'back.out(2)', yoyo: true, repeat: 1 }); await sleep(D(900)); };
  return A;
}

/* ---------- tiles to place ---------- */
const U = 70;
function geo(shape) {
  const P = (x, y) => [x * U, y * U], mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], at = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  let pts, side = false;
  if (shape === 'cross5') pts = [P(-1, 0), P(0, 0), P(1, 0), P(0, -1), P(0, 1)];
  else if (shape === 'tri6') { const A = P(0, -1.25), B = P(-1.42, 1.2), C = P(1.42, 1.2); pts = [A, B, C, mid(A, B), mid(B, C), mid(C, A)]; side = true; }
  else if (shape === 'tri9') { const A = P(0, -1.75), B = P(-2, 1.7), C = P(2, 1.7); pts = [A, B, C, at(A, B, 1 / 3), at(A, B, 2 / 3), at(B, C, 1 / 3), at(B, C, 2 / 3), at(C, A, 1 / 3), at(C, A, 2 / 3)]; side = true; }
  else if (shape === 'wheel7') pts = [P(0, 0), ...Array.from({ length: 6 }, (_, i) => { const r = (-90 + 60 * i) * Math.PI / 180; return P(1.3 * Math.cos(r), 1.3 * Math.sin(r)); })];
  else if (shape === 'sq9') pts = Array.from({ length: 9 }, (_, i) => P((i % 3 - 1) * 1.18, (Math.floor(i / 3) - 1) * 1.18));
  else { const cs = Array.from({ length: 5 }, (_, i) => { const r = (-90 + 72 * i) * Math.PI / 180; return P(1.8 * Math.cos(r), 1.8 * Math.sin(r)); }); pts = [...cs, ...cs.map((c, i) => mid(c, cs[(i + 1) % 5]))]; side = true; }
  const cen = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const badges = SHAPES[shape].map(L => {
    if (side) { const m = L.reduce((s, i) => [s[0] + pts[i][0] / L.length, s[1] + pts[i][1] / L.length], [0, 0]), d = [m[0] - cen[0], m[1] - cen[1]], len = Math.hypot(...d) || 1; return [m[0] + d[0] / len * 50, m[1] + d[1] / len * 50]; }
    const a = pts[L[0]], b = pts[L[L.length - 1]], d = [b[0] - a[0], b[1] - a[1]], len = Math.hypot(...d) || 1; return [b[0] + d[0] / len * 52, b[1] + d[1] / len * 52];
  });
  return { pts, badges };
}
function tilesScene(board, sc, o) {
  const { pts, badges } = geo(sc.shape), n = placesOf(sc.shape), lines = SHAPES[sc.shape];
  const xs = [...pts, ...badges].map(p => p[0]), ys = [...pts, ...badges].map(p => p[1]);
  const minX = Math.min(...xs) - 34, maxX = Math.max(...xs) + 34, minY = Math.min(...ys) - 34, maxY = Math.max(...ys) + 30;
  const fixedSlots = Object.keys(sc.fixed).map(Number), vals = sc.nums;
  // the tile of every value, and where each one is at first
  const where = vals.map(() => -1), place = Array(n).fill(null), fixedT = new Set();
  for (const s of fixedSlots) { const i = vals.findIndex((v, j) => v === sc.fixed[s] && where[j] < 0); where[i] = s; place[s] = i; fixedT.add(i); }
  if (sc.start) sc.start.forEach((v, s) => { const i = vals.findIndex((x, j) => x === v && where[j] < 0); where[i] = s; place[s] = i; });
  const loose = vals.map((_, i) => i).filter(i => !fixedT.has(i)), per = Math.min(5, loose.length), rows = sc.start ? 0 : Math.ceil(loose.length / per);
  const width = Math.max(maxX - minX, per * 62 + 20), x0 = (minX + maxX) / 2, trayTop = maxY + 12, VH = maxY - minY + (rows ? rows * 62 + 30 : 6);
  const home = {}; loose.forEach((i, j) => { const r = Math.floor(j / per), inRow = Math.min(per, loose.length - r * per), c = j % per; home[i] = [x0 + (c - (inRow - 1) / 2) * 62, trayTop + 36 + r * 62]; });
  const vbX = x0 - width / 2;
  const posOf = i => where[i] >= 0 ? pts[where[i]] : home[i];
  board.innerHTML = `<div class="scene s-tiles"><svg viewBox="${f1(vbX)} ${f1(minY)} ${f1(width)} ${f1(VH)}" role="img" aria-label="Fitxes per col·locar">
    <g class="tlines">${lines.map((L, j) => `<path class="tline" data-j="${j}" d="M${L.map(i => pts[i].map(f1).join(' ')).join('L')}" fill="none" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>
    ${pts.map((p, s) => `<circle class="slot${fixedSlots.includes(s) ? ' fixed' : ''}" data-s="${s}" cx="${f1(p[0])}" cy="${f1(p[1])}" r="27"/>`).join('')}
    ${badges.map((p, j) => `<g class="tsum" data-j="${j}" transform="translate(${p.map(f1).join(' ')})"><circle r="8"/><text y="6" text-anchor="middle" font-size="16"></text></g>`).join('')}
    ${rows ? `<rect class="trayzone" x="${f1(vbX + 6)}" y="${f1(trayTop + 4)}" width="${f1(width - 12)}" height="${rows * 62 + 18}" rx="22"/>` : ''}
    ${vals.map((v, i) => `<g class="tile${fixedT.has(i) ? ' fixed' : ''}" data-t="${i}"><circle r="25" fill="${fixedT.has(i) ? 'url(#cn-steel)' : 'url(#cn-gold)'}" stroke="${fixedT.has(i) ? '#4A5A68' : '#8A5A10'}" stroke-width="2.5"/><circle r="19" fill="none" stroke="#fff" stroke-opacity="0.4"/>
      <text y="${v > 9 ? 7 : 8}" text-anchor="middle" font-size="${v > 9 ? 19 : 23}" fill="#2A1C00">${v}</text>${fixedT.has(i) ? '<circle cx="15" cy="-15" r="5" fill="#FF6B5E" stroke="#8A2A22"/>' : ''}</g>`).join('')}</svg></div>`;
  const A = api(board), svg = board.querySelector('svg'), tileEl = i => svg.querySelector(`.tile[data-t="${i}"]`);
  vals.forEach((_, i) => gsap.set(tileEl(i), { x: posOf(i)[0], y: posOf(i)[1] }));
  let sel = null, locked = !!o.still;
  const move = i => gsap.to(tileEl(i), { x: posOf(i)[0], y: posOf(i)[1], duration: D(0.32), ease: 'back.out(1.6)', overwrite: 'auto' });
  const select = i => { if (sel !== null) tileEl(sel).classList.remove('sel'); sel = i; if (i !== null) tileEl(i).classList.add('sel'); svg.classList.toggle('picking', i !== null); };
  const moveTo = (i, s) => { if (where[i] >= 0) place[where[i]] = null; where[i] = s; if (s >= 0) place[s] = i; move(i); };
  const swap = (i, j) => { const a = where[i], b = where[j]; where[i] = b; where[j] = a; if (a >= 0) place[a] = j; if (b >= 0) place[b] = i; move(i); move(j); };
  function changed(quiet) {
    const placed = place.map(i => i === null ? null : vals[i]), sums = lineSums(sc.shape, placed), done = tilesDone(sc, placed), full = place.every(i => i !== null);
    sums.forEach((s, j) => { const b = svg.querySelector(`.tsum[data-j="${j}"]`), ln = svg.querySelector(`.tline[data-j="${j}"]`);
      b.querySelector('text').textContent = s ?? ''; b.querySelector('circle').setAttribute('r', s === null ? 8 : 18); b.classList.toggle('has', s !== null); b.classList.toggle('ok', s === sc.target); b.classList.toggle('bad', s !== null && s !== sc.target);
      ln.classList.toggle('ok', s === sc.target); ln.classList.toggle('bad', s !== null && s !== sc.target); });
    if (done) locked = true;
    if (!quiet) o.on?.('tiles', { done, full });
  }
  changed(true);
  svg.addEventListener('click', e => {
    if (locked) return;
    const t = e.target.closest('.tile'), s = e.target.closest('.slot'), tray = e.target.closest('.trayzone');
    if (t) {
      const i = +t.dataset.t;
      if (fixedT.has(i)) { shake(t); return; }
      if (sel === null) return select(i);
      if (sel === i) return select(null);
      if (where[sel] < 0 && where[i] < 0) return select(i);
      swap(sel, i); select(null); return changed();
    }
    if (s && sel !== null) { const j = +s.dataset.s; if (place[j] !== null) return; moveTo(sel, j); select(null); return changed(); }
    if (tray && sel !== null && where[sel] >= 0) { moveTo(sel, -1); select(null); changed(); }
  });
  A.finish = async () => {
    const ls = [...svg.querySelectorAll('.tline')], ts = [...svg.querySelectorAll('.tile')];
    if (!RM) { gsap.fromTo(ls, { opacity: 0.4 }, { opacity: 1, duration: 0.2, stagger: 0.12, yoyo: true, repeat: 1 }); ts.forEach((el, i) => gsap.to(el, { y: posOf(i)[1] - 12, duration: 0.18, delay: i * 0.05, yoyo: true, repeat: 1, ease: 'power2.out' })); }
    await sleep(D(900));
  };
  return A;
}

/* ---------- paths of stones ---------- */
function pathScene(board, sc, o) {
  const { R, C, grid } = sc, cs = 78, g = 10, x0 = 96, y0 = 70, W = x0 + C * (cs + g) + 92, VH = y0 + R * (cs + g) + 12;
  const cx = c => x0 + c * (cs + g) + cs / 2, cy = r => y0 + r * (cs + g) + cs / 2, jit = (r, c) => ((r * 7 + c * 13) % 5) - 2;
  const label = t => /^\d+$/.test(t) ? t : t;
  const start = [x0 - 52, cy(0)], door = [cx(C - 1) + cs / 2 + 46, cy(R - 1)];
  const stones = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) stones.push(`<g transform="translate(${cx(c)} ${cy(r)}) rotate(${jit(r, c)})"><g class="stone" data-c="${r}-${c}" role="button" tabindex="${o.still ? -1 : 0}" aria-label="Pedra ${label(grid[r][c])}">
    <rect x="${-cs / 2}" y="${-cs / 2 + 5}" width="${cs}" height="${cs}" rx="22" fill="#000" opacity="0.3"/><rect class="sb" x="${-cs / 2}" y="${-cs / 2}" width="${cs}" height="${cs}" rx="22" fill="url(#cn-slate)" stroke="#6B8296" stroke-width="2"/>
    <path d="M${-cs / 2 + 14} ${-cs / 2 + 9}H${cs / 2 - 14}" stroke="#fff" stroke-opacity="0.22" stroke-width="3" stroke-linecap="round"/>
    <text y="9" text-anchor="middle" font-size="${grid[r][c].length > 3 ? 21 : 25}" fill="#EAF8F4">${label(grid[r][c])}</text></g></g>`);
  board.innerHTML = `<div class="scene s-path"><svg viewBox="0 0 ${W} ${VH}" role="img" aria-label="Un camí de pedres">
    <rect x="0" y="${y0 - 26}" width="${W}" height="${VH - y0 + 26}" rx="26" fill="url(#cn-water)"/>
    ${[0.25, 0.6, 0.85].map((f, i) => `<ellipse class="ripple" cx="${W * f}" cy="${y0 + 20 + i * 60}" rx="40" ry="5" fill="none" stroke="#6FE3FF" stroke-opacity="0.2" stroke-width="2" style="animation-delay:${i * 0.9}s"/>`).join('')}
    <ellipse cx="${start[0]}" cy="${start[1] + 6}" rx="40" ry="24" fill="url(#cn-pad)" stroke="#1F5A30" stroke-width="2"/>
    <g class="door" transform="translate(${door[0]} ${door[1]})"><path d="M-30 38V-14A30 30 0 0 1 30 -14V38Z" fill="#2A1C10" stroke="#8A5A10" stroke-width="3"/>
      <path class="leaf" d="M-26 38V-12A26 26 0 0 1 26 -12V38Z" fill="url(#cn-wood)" stroke="#4E3014" stroke-width="2"/><rect x="-22" y="-8" width="44" height="30" rx="8" fill="#1B1206" stroke="#F7C64E" stroke-width="2"/>
      <text y="15" text-anchor="middle" font-size="${String(sc.target).length > 2 ? 19 : 23}" fill="#FFE69A">${sc.target}</text></g>
    <polyline class="trail" points="" fill="none" stroke="#F7C64E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 10"/>
    ${stones.join('')}
    <g class="pfrog" transform="translate(${start[0]} ${start[1] - 6})">${MINI}<g class="bub" transform="translate(0 -44)"><rect x="-28" y="-17" width="56" height="30" rx="15" fill="#FFFDF5" stroke="#22304F" stroke-width="2"/><path d="M-6 12L0 20L6 12Z" fill="#FFFDF5"/><text y="6" text-anchor="middle" font-size="19" fill="#22304F">${sc.start}</text></g></g></svg></div>`;
  const A = api(board), svg = board.querySelector('svg'), frog = svg.querySelector('.pfrog'), bub = svg.querySelector('.bub text'), trailEl = svg.querySelector('.trail');
  let trail = [], x = sc.start, fp = [start[0], start[1] - 6], hopping = Promise.resolve();
  const stoneEl = (r, c) => svg.querySelector(`.stone[data-c="${r}-${c}"]`);
  const hop = to => { const from = fp.slice(); fp = to;
    hopping = hopping.then(() => RM ? frog.setAttribute('transform', `translate(${to[0]} ${to[1]})`) : tween(240, k => frog.setAttribute('transform', `translate(${f1(from[0] + (to[0] - from[0]) * k)} ${f1(from[1] + (to[1] - from[1]) * k - Math.sin(Math.PI * k) * 34)})`))); };
  const draw = () => { trailEl.setAttribute('points', [start, ...trail.map(([r, c]) => [cx(c), cy(r)])].map(p => p.join(',')).join(' ')); bub.textContent = x; svg.querySelectorAll('.stone.on').forEach(e => e.classList.remove('on')); trail.forEach(([r, c]) => stoneEl(r, c).classList.add('on')); };
  const recompute = () => { x = trail.reduce((v, [r, c]) => stone(v, grid[r][c]), sc.start); };
  const posOf = () => trail.length ? [cx(trail[trail.length - 1][1]), cy(trail[trail.length - 1][0]) - 6] : [start[0], start[1] - 6];
  A.back = () => { if (!trail.length) return; trail.pop(); recompute(); draw(); hop(posOf()); o.on?.('back', { x }); };
  A.reset = () => { trail = []; recompute(); draw(); hop(posOf()); o.on?.('back', { x }); };
  svg.addEventListener('click', e => {
    if (o.still) return;
    const st = e.target.closest('.stone'); if (!st) return;
    const [r, c] = st.dataset.c.split('-').map(Number), last = trail[trail.length - 1], prev = trail[trail.length - 2];
    if (last && last[0] === r && last[1] === c) return;
    if (prev && prev[0] === r && prev[1] === c) return A.back();
    const near = last ? Math.abs(last[0] - r) + Math.abs(last[1] - c) === 1 : r === 0 && c === 0, seen = trail.some(([a, b]) => a === r && b === c);
    if (!near || seen) { shake(st); return o.on?.('far', { first: !last }); }
    const y = stone(x, grid[r][c]);
    if (Number.isNaN(y)) { shake(st); return o.on?.('blocked', { x, cell: grid[r][c] }); }
    trail.push([r, c]); x = y; draw(); hop(posOf()); pop(bub.parentNode);
    o.on?.('step', { x, exit: r === R - 1 && c === C - 1 });
  });
  A.finish = async () => {
    await hopping;
    gsap.to(svg.querySelector('.leaf'), { scaleX: 0.12, svgOrigin: `${door[0] - 26} ${door[1]}`, duration: D(0.5), ease: 'power2.inOut' });
    await sleep(D(350)); hop([door[0], door[1] + 4]); await hopping;
    gsap.to(frog, { opacity: 0, duration: D(0.3) }); await sleep(D(400));
  };
  return A;
}

const SCENES = { pyr: pyrScene, magic: magicScene, lock: lockScene, bal: balScene, bal3: bal3Scene, mach: machScene, ser: serScene, wheel: wheelScene, mgrid: mgridScene,
  sym: symScene, fgrid: fgridScene, crypt: cryptScene, riddle: riddleScene, tiles: tilesScene, path: pathScene };

/* ---------- the castle of the map ---------- */
// Nine parts, one per project: three foundations, three walls and three towers. A part not built yet is a blueprint; a built one is
// stone with its windows lit, and it rises into its place. The water under it shows it upside down
const ROOFS = ['#E2574C', '#6E8BF0', '#E2574C'];
const merlons = (x0, x1, top, bot = 166, h = 8) => { let d = `M${x0} ${bot}V${top}`; for (let x = x0, k = 0; x < x1; x += 10, k++) d += k % 2 ? `H${Math.min(x + 10, x1)}V${top}` : `H${Math.min(x + 10, x1)}V${top + h}`; return d + `V${bot}Z`; };
const PARTS = [
  `<rect class="m" x="56" y="166" width="84" height="24" fill="url(#cn-cst2)" stroke="#4E4436"/><rect class="k" x="56" y="166" width="84" height="24" fill="url(#cn-bk)"/>`,
  `<rect class="m" x="140" y="166" width="80" height="24" fill="url(#cn-cst2)" stroke="#4E4436"/><rect class="k" x="140" y="166" width="80" height="24" fill="url(#cn-bk)"/><path class="m" d="M164 190v-6h32v6Z" fill="#8E7F68" stroke="#4E4436"/>`,
  `<rect class="m" x="220" y="166" width="84" height="24" fill="url(#cn-cst2)" stroke="#4E4436"/><rect class="k" x="220" y="166" width="84" height="24" fill="url(#cn-bk)"/>`,
  `<path class="m" d="${merlons(76, 140, 120)}" fill="url(#cn-cst)" stroke="#5E5242"/><rect class="k" x="76" y="128" width="64" height="38" fill="url(#cn-bk)"/><rect class="win" x="100" y="138" width="8" height="12" rx="4"/>`,
  `<path class="m" d="${merlons(140, 220, 104)}" fill="url(#cn-cst)" stroke="#5E5242"/><rect class="k" x="140" y="112" width="80" height="54" fill="url(#cn-bk)"/>
   <path class="g" d="M162 166V140a18 18 0 0 1 36 0V166Z" fill="#1B140C" stroke="#5E5242"/><path class="g" d="M168 132V166M174 128V166M180 126V166M186 128V166M192 132V166M163 146H197M163 156H197" stroke="#6E624F" stroke-width="1.5"/>`,
  `<path class="m" d="${merlons(220, 284, 120)}" fill="url(#cn-cst)" stroke="#5E5242"/><rect class="k" x="220" y="128" width="64" height="38" fill="url(#cn-bk)"/><rect class="win" x="250" y="138" width="8" height="12" rx="4"/>`,
  `<rect class="m" x="44" y="76" width="42" height="90" fill="url(#cn-cst)" stroke="#5E5242"/><rect class="k" x="44" y="76" width="42" height="90" fill="url(#cn-bk)"/><path class="m roof" d="M38 78L65 30L92 78Z" fill="${ROOFS[0]}" stroke="#7A2A22"/>
   <rect class="win" x="61" y="94" width="9" height="15" rx="4.5"/><rect class="win" x="61" y="128" width="9" height="15" rx="4.5"/>`,
  `<rect class="m" x="154" y="50" width="52" height="56" fill="url(#cn-cst)" stroke="#5E5242"/><rect class="k" x="154" y="50" width="52" height="56" fill="url(#cn-bk)"/><path class="m roof" d="M146 52L180 2L214 52Z" fill="${ROOFS[1]}" stroke="#2E3F8A"/>
   <rect class="win" x="166" y="64" width="9" height="15" rx="4.5"/><rect class="win" x="185" y="64" width="9" height="15" rx="4.5"/><g class="flag"><path d="M180 2V-16" stroke="#E9F2F7" stroke-width="2.5"/><path class="cloth" d="M180 -16h20l-5 6l5 6h-20Z" fill="#F7C64E"/></g>`,
  `<rect class="m" x="274" y="76" width="42" height="90" fill="url(#cn-cst)" stroke="#5E5242"/><rect class="k" x="274" y="76" width="42" height="90" fill="url(#cn-bk)"/><path class="m roof" d="M268 78L295 30L322 78Z" fill="${ROOFS[2]}" stroke="#7A2A22"/>
   <rect class="win" x="291" y="94" width="9" height="15" rx="4.5"/><rect class="win" x="291" y="128" width="9" height="15" rx="4.5"/>`
];
// the order the parts are drawn in: the towers stand in front of the walls, the walls on the foundations
const ORDER = [3, 4, 5, 0, 1, 2, 6, 7, 8];
export function castleMap(el, done) {
  defs();
  const on = new Set(done), all = on.size === PARTS.length;
  const parts = ORDER.map((i, j) => `<g class="part p${i}${on.has(i) ? ' on' : ''}" style="--d:${j * 0.08}s">${PARTS[i]}</g>`).join('');
  const stars = [[24, 14], [70, 4], [118, 22], [236, 8], [260, 30], [344, 50], [20, 60], [334, 4]].map(([x, y], i) => `<circle class="star" cx="${x}" cy="${y}" r="${i % 3 ? 1.4 : 2}" style="animation-delay:${i * 0.4}s"/>`).join('');
  el.innerHTML = `<svg class="castle${all ? ' all' : ''}" viewBox="0 -22 360 262" role="img" aria-label="El castell: ${on.size} de 9 parts construïdes">${stars}
    <circle cx="318" cy="16" r="15" fill="url(#cn-moon)" filter="url(#cn-glow)"/><circle cx="312" cy="12" r="3" fill="#E9D79A" opacity="0.6"/>
    <rect x="0" y="190" width="360" height="50" fill="url(#cn-water)"/>
    <g clip-path="url(#cn-wclip)" opacity="0.2"><g transform="translate(0 382) scale(1 -1)">${parts}</g></g>
    ${[0, 1, 2].map(i => `<path class="ripple" d="M${40 + i * 110} ${206 + i * 9}h${50 - i * 6}" stroke="#6FE3FF" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round" style="animation-delay:${i * 0.6}s"/>`).join('')}
    <path d="M14 192Q180 176 346 192Z" fill="#1F5A35"/><path d="M30 191Q180 180 330 191" fill="none" stroke="#4FB562" stroke-opacity="0.5" stroke-width="2"/>${parts}</svg>`;
}
