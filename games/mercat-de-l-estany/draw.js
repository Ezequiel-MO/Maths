// The pictures of the market, hand-written SVG in the colours of the pond, and the two things a finger plays with:
//   money(v, px)         a euro coin or note, metal or paper, worth v cents
//   scene(el, sc, o)     what goes over a question: coins, the stall, a receipt, two purses, two offers, the dial of the scales, a crate,
//                        the piggy bank. What can be tapped carries .hit and data-k (the keys the questions of logic.js answer with)
//   payBox(el, q, o)     the counter, the purse (or the till) and the display of the register: coins fly from the purse to the counter and back
//   scaleBox(el, q, o)   the scales with two pans: weights fly onto the right pan and the beam swings on a spring until it is level
//   market(el, n)        the stall of the frog on the map, with n of its nine improvements
// Every loop hangs from frames() of shared/scene.js, so it stops with its screen.
import { RM, mid } from '../../shared/util.js';
import { frames, tween } from '../../shared/scene.js';
import { eur, short, gr, isBill, valName, thousands } from './logic.js';

/* ---------- the money ---------- */
// the sizes of the real coins, in mm: a 1 € coin is 23,25 mm, a 2 € coin 25,75 mm
const MM = { 1: 16.25, 2: 18.75, 5: 21.25, 10: 19.75, 20: 22.25, 50: 24.25, 100: 23.25, 200: 25.75 };
const METAL = v => v < 10 ? 'cu' : v < 100 ? 'au' : v === 100 ? 'one' : 'two';
const INKS = { cu: '#5A2810', au: '#6B4A10', ag: '#3E4A54' };
const PAPER = { 500: ['#B9CBBF', '#7E9888'], 1000: ['#F09A8E', '#C25A4E'], 2000: ['#8FBAF0', '#4E7FC2'], 5000: ['#F8BE7A', '#D0843A'] };
// the gradients every coin uses, once per page
let defsDone = false;
function defs() {
  if (defsDone || typeof document === 'undefined') return;
  defsDone = true;
  const g = (id, a, b, c) => `<radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${g('m-cu', '#FFC79A', '#C9733F', '#6E3216')}${g('m-au', '#FFF0B0', '#E2BA4C', '#8E6A1E')}${g('m-ag', '#FFFFFF', '#CBD3D9', '#6F7C86')}
    <linearGradient id="m-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D49A5C"/><stop offset="1" stop-color="#9A6234"/></linearGradient>
    <linearGradient id="m-brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E6A1E"/><stop offset="0.35" stop-color="#FFE59A"/><stop offset="1" stop-color="#9C7424"/></linearGradient>
    <radialGradient id="m-pig" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFC4DA"/><stop offset="1" stop-color="#E86E9C"/></radialGradient>
    </defs></svg>`);
}
const stars = (r, n = 12, size = 2.2, fill = 'rgb(0 0 0 / 0.28)') => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2;
  return `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="${size}" fill="${fill}"/>`; }).join('');
// A coin or a note as an SVG string; px is the width of a 1 € coin (the others keep their real sizes) or of a note
export function money(v, px = 56) {
  defs();
  if (isBill(v)) {
    const [hi, lo] = PAPER[v], w = Math.round(px * 1.9), id = 'b' + v;
    return `<svg class="money bill" viewBox="0 0 160 84" width="${w}" height="${Math.round(w * 84 / 160)}" role="img" aria-label="${valName(v)}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient></defs>
      <rect x="1" y="1" width="158" height="82" rx="8" fill="url(#${id})" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.5"/>
      <rect x="6" y="6" width="148" height="72" rx="5" fill="none" stroke="rgb(255 255 255 / 0.45)" stroke-width="1.5" stroke-dasharray="1 3"/>
      <path d="M44 74V36a18 18 0 0 1 36 0V74Z" fill="rgb(255 255 255 / 0.35)" stroke="rgb(255 255 255 / 0.6)" stroke-width="1.5"/>
      <g transform="translate(24 26)">${stars(11, 12, 1.6, 'rgb(255 245 160 / 0.95)')}</g>
      <text x="120" y="50" text-anchor="middle" font-size="38" font-weight="800" fill="#fff" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.2" font-family="Baloo 2, sans-serif">${v / 100}</text>
      <text x="120" y="68" text-anchor="middle" font-size="11" font-weight="800" letter-spacing="2" fill="rgb(255 255 255 / 0.9)">EURO</text>
      <text x="14" y="74" font-size="14" font-weight="800" fill="rgb(255 255 255 / 0.8)">€</text></svg>`;
  }
  const m = METAL(v), size = Math.round(px * MM[v] / 23.25), outer = m === 'two' ? 'au' : m === 'one' ? 'ag' : m, inner = m === 'two' ? 'ag' : m === 'one' ? 'au' : null;
  const ink = INKS[inner || outer], n = v >= 100 ? v / 100 : v;
  return `<svg class="money coin" viewBox="-50 -50 100 100" width="${size}" height="${size}" role="img" aria-label="${valName(v)}">
    <circle r="49" fill="url(#m-${outer})" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.5"/><circle r="44" fill="none" stroke="rgb(255 255 255 / 0.35)" stroke-width="2"/>
    ${inner ? `<circle r="32" fill="url(#m-${inner})" stroke="rgb(0 0 0 / 0.25)" stroke-width="1.5"/>` : stars(39, 12, 2.2)}
    <text y="${inner ? 10 : 12}" text-anchor="middle" font-size="${inner ? 34 : n > 9 ? 36 : 42}" font-weight="800" fill="rgb(255 255 255 / 0.55)" font-family="Baloo 2, sans-serif" dx="1" dy="1">${n}</text>
    <text y="${inner ? 10 : 12}" text-anchor="middle" font-size="${inner ? 34 : n > 9 ? 36 : 42}" font-weight="800" fill="${ink}" font-family="Baloo 2, sans-serif">${n}</text>
    <text y="${inner ? 24 : 30}" text-anchor="middle" font-size="${inner ? 8 : 10}" font-weight="800" letter-spacing="1.5" fill="${ink}">${v >= 100 ? 'EURO' : 'CENT'}</text>
    <ellipse cx="-16" cy="-22" rx="16" ry="9" fill="rgb(255 255 255 / 0.35)" transform="rotate(-30 -16 -22)"/></svg>`;
}

/* ---------- the frog of the stall: a cap and an apron ---------- */
export const FROG = `<svg class="frog" viewBox="-40 -62 84 90" aria-hidden="true"><ellipse cx="0" cy="22" rx="28" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-24 14q-9-2-7-9q7 2 11 6ZM24 14q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-4" rx="25" ry="21" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <path d="M-15 0h30v14q-15 8-30 0Z" fill="#F3FBF8" stroke="#C9D6DB" stroke-width="1.5"/><path d="M-15 0h30" stroke="#FF6B5E" stroke-width="3"/><path d="M-6 6h12" stroke="#FF6B5E" stroke-width="2" stroke-linecap="round"/>
  <circle cx="-12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-25" r="4" fill="#0F3A40"/><circle cx="13" cy="-25" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-27" r="1.4" fill="#fff"/><circle cx="14.5" cy="-27" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -5 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-20 -36q2-16 20-17q18 1 20 17Z" fill="#FF6B5E" stroke="#B5392F" stroke-width="2"/><path d="M-4 -36h36q2 4-4 5h-32Z" fill="#B5392F"/>
  <path d="M-16 -42q16-8 32 0" fill="none" stroke="#FFD9D4" stroke-width="2.5" stroke-linecap="round"/><circle cy="-53" r="3" fill="#FFD9D4"/></svg>`;

/* ---------- the scenes ---------- */
const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// a thing that can be tapped, for the finger, the keyboard and a screen reader
const tapAttr = (o, k, label) => o.tap ? ` class="hit" data-k="${k}" tabindex="0" role="button" aria-label="${H(label)}"` : '';
export function scene(el, sc, o = {}) {
  defs();
  el.innerHTML = '';
  if (!sc) return;
  const draw = DRAW[sc.s];
  el.insertAdjacentHTML('beforeend', `<figure class="scene s-${sc.s}">${draw(sc, o)}</figure>`);
  if (sc.s === 'dial') dialMove(el, sc, o.t);
  if (sc.s === 'piggy') piggyMove(el, sc, o.t);
}
const tag = (x, y, p, u, hide, deal, k, sc = 1) => `<g class="tag" style="--d:${k * 0.12}s; transform-origin:${x}px ${y - 34}px"><path d="M${x} ${y - 34}V${y - 14}" stroke="#C9D6DB" stroke-width="1.5"/>
  <g transform="translate(${x} ${y}) scale(${sc}) translate(${-x} ${-y})"><path d="M${x - 36} ${y - 12}h56l10 14l-10 14h-56a4 4 0 0 1-4-4v-20a4 4 0 0 1 4-4Z" fill="${deal ? '#FF6B5E' : '#FFF8E6'}" stroke="${deal ? '#B5392F' : '#C9A55A'}" stroke-width="2"/>
  <circle cx="${x + 23}" cy="${y + 2}" r="2.6" fill="#04131C"/>
  <text x="${x - 9}" y="${y + (u ? 3 : 8)}" text-anchor="middle" font-size="${hide ? 20 : 15}" font-weight="800" fill="${deal ? '#fff' : '#2A1C00'}" font-family="Baloo 2, sans-serif">${hide ? '?' : H(eur(p))}</text>
  ${u ? `<text x="${x - 9}" y="${y + 13}" text-anchor="middle" font-size="8.5" font-weight="800" fill="${deal ? '#FFE6E2' : '#7A5A1E'}">${H(u)}</text>` : ''}</g></g>`;
// a crate of the stall, with a pile of the thing; w its width
const crate = (x, y, w, e, big, k) => { const n = big ? 5 : 3, s = big ? 34 : Math.min(30, w / 2.4);
  const pile = Array.from({ length: n }, (_, i) => { const row = i < Math.ceil(n / 2) ? 0 : 1, inRow = row ? n - Math.ceil(n / 2) : Math.ceil(n / 2), j = row ? i - Math.ceil(n / 2) : i;
    return `<text x="${(x + (j - (inRow - 1) / 2) * s * 0.78).toFixed(1)}" y="${(y + 4 - row * s * 0.55).toFixed(1)}" font-size="${s}" text-anchor="middle">${e}</text>`; }).join('');
  return `<g class="crate" style="--d:${k * 0.1}s">${pile}<rect x="${x - w / 2}" y="${y}" width="${w}" height="${big ? 44 : 36}" rx="4" fill="url(#m-wood)" stroke="#6B3E1C" stroke-width="2"/>
    <path d="M${x - w / 2 + 4} ${y + (big ? 15 : 12)}h${w - 8}M${x - w / 2 + 4} ${y + (big ? 29 : 24)}h${w - 8}" stroke="#8A5A2B" stroke-width="2"/></g>`; };
// the awning of a stall: stripes and a scalloped edge that waves
const awning = (x0, x1, y, h, n) => { const w = (x1 - x0) / n;
  return `<g class="awning">${Array.from({ length: n }, (_, i) => `<rect x="${x0 + i * w}" y="${y}" width="${w + 0.5}" height="${h}" fill="${i % 2 ? '#FFF3E0' : '#FF6B5E'}"/>`).join('')}
    ${Array.from({ length: n }, (_, i) => `<path class="flap" style="--d:${(i * 0.15).toFixed(2)}s;transform-origin:${x0 + i * w + w / 2}px ${y + h}px" d="M${x0 + i * w} ${y + h}a${w / 2} ${w / 2.4} 0 0 0 ${w} 0Z" fill="${i % 2 ? '#FFF3E0' : '#FF6B5E'}"/>`).join('')}
    <rect x="${x0 - 4}" y="${y - 6}" width="${x1 - x0 + 8}" height="8" rx="4" fill="#B5392F"/></g>`; };
const bulbs = (x0, x1, y, n) => { const pts = Array.from({ length: n }, (_, i) => { const k = i / (n - 1), x = x0 + (x1 - x0) * k; return [x, y + Math.sin(k * Math.PI) * 10]; });
  return `<path d="M${pts.map(p => p.join(' ')).join('L')}" fill="none" stroke="#3B2A1A" stroke-width="1.5"/>${pts.map(([x, yy], i) => `<circle class="bulb" style="--d:${(i * 0.37) % 2}s" cx="${x}" cy="${yy + 4}" r="4" fill="${['#FFE59A', '#7CF5B0', '#FF8FD0', '#6FE3FF'][i % 4]}"/>`).join('')}`; };
const DRAW = {
  coins(sc, o) {
    if (sc.big) return `<div class="coins big"><span class="c spin">${money(sc.coins[0], sc.coins[0] >= 500 ? 120 : 150)}</span></div>`;
    return `<div class="coins">${sc.coins.map((v, i) => `<span${tapAttr(o, i, valName(v)) || ' class="cw"'} style="--d:${i * 0.09}s"><span class="c">${money(v, 58)}</span></span>`).join('')}</div>`;
  },
  stall(sc, o) {
    const n = sc.items.length, W = 360, x0 = 22, x1 = W - 22, w = (x1 - x0) / n, big = n === 1;
    const items = sc.items.map((it, i) => { const x = x0 + w * (i + 0.5);
      return `<g${tapAttr(o, i, `${it.n}: ${eur(it.p)}`)}><rect class="pad" x="${x - w / 2 + 3}" y="70" width="${w - 6}" height="168" rx="12"/>
        ${tag(x, 104, it.p, sc.weights ? '' : it.u, sc.hide, sc.deal, i, n >= 5 ? 0.82 : 1)}${crate(x, 176, Math.min(w - 12, big ? 150 : 90), it.e, big, i)}
        ${sc.weights ? `<text x="${x}" y="231" text-anchor="middle" class="wt">${H(it.u)}</text>` : `<text x="${x}" y="231" text-anchor="middle" class="nm">${H(it.n)}</text>`}</g>`; }).join('');
    return `<svg viewBox="0 0 ${W} 250" role="group" aria-label="La parada">
      <rect x="14" y="20" width="7" height="226" rx="3" fill="#8A5A2B"/><rect x="${W - 21}" y="20" width="7" height="226" rx="3" fill="#8A5A2B"/>
      ${awning(10, W - 10, 14, 30, 10)}${bulbs(18, W - 18, 58, 11)}
      <rect x="8" y="212" width="${W - 16}" height="34" rx="6" fill="url(#m-wood)" stroke="#6B3E1C" stroke-width="2"/><path d="M14 228H${W - 14}" stroke="#8A5A2B" stroke-width="1.5" opacity="0.7"/>
      ${items}</svg>`;
  },
  receipt(sc, o) {
    const t = sc.lines.reduce((s, l) => s + l.p * l.q, 0);
    const row = (l, i) => `<li${tapAttr(o, i, `Línia ${i + 1}: ${l.n}`)} style="--d:${0.25 + i * 0.22}s"><span class="ln"><b>${i + 1}</b>${l.e} ${H(l.n)}</span>
      <span class="qt">${l.q > 1 ? `${l.q} × ${eur(l.p)}` : ''}</span><span class="am">${l.gone ? '❓' : sc.subs ? eur(l.sub) : l.q > 1 ? '' : eur(l.p)}</span></li>`;
    const after = 0.25 + sc.lines.length * 0.22;
    return `<div class="printer"><div class="slot"></div><div class="paper" style="--n:${sc.lines.length}">
      <p class="hd">MERCAT DE L'ESTANY</p><p class="sub">Parada de la granota · tiquet</p><ul>${sc.lines.map(row).join('')}</ul>
      ${sc.total === -1 ? '' : `<p class="tot" style="--d:${after}s"><span>TOTAL</span><b>${sc.total === undefined ? '?' : eur(sc.total)}</b></p>`}
      ${sc.paid ? `<p class="paid" style="--d:${after + 0.2}s"><span>Pagat</span><b>${eur(sc.paid)}</b></p><p class="paid" style="--d:${after + 0.4}s"><span>Canvi</span><b>?</b></p>` : ''}
      <p class="thanks" style="--d:${after + 0.5}s">Gràcies per comprar a l'estany! 🐸</p></div></div>`;
  },
  purses(sc, o) {
    const one = (k, cs) => `<div${tapAttr(o, k, `Moneder ${k.toUpperCase()}`) || ' class="pwrap"'}><div class="purse"><svg class="clasp" viewBox="0 0 120 30" aria-hidden="true"><path d="M10 30Q60 -8 110 30" fill="none" stroke="#F7C64E" stroke-width="5"/><circle cx="50" cy="12" r="5" fill="#F7C64E"/><circle cx="70" cy="12" r="5" fill="#F7C64E"/></svg>
      <p class="pl">Moneder ${k.toUpperCase()}</p><div class="pc">${cs.map((v, i) => `<span class="c" style="--d:${i * 0.08}s">${money(v, 44)}</span>`).join('')}</div></div></div>`;
    return `<div class="purses">${one('a', sc.a)}${one('b', sc.b)}</div>`;
  },
  offers(sc, o) {
    const one = (k, of) => { const cols = Math.min(of.n, 4), size = of.n > 4 ? 26 : 34;
      return `<div${tapAttr(o, k, `Oferta ${k.toUpperCase()}: ${of.n} per ${eur(of.p)}`) || ''}><div class="offer"><p class="ol">Oferta ${k.toUpperCase()}</p>
        <div class="pack" style="--cols:${cols}">${Array.from({ length: of.n }, (_, i) => `<span style="--d:${i * 0.06}s;font-size:${size}px">${of.e}</span>`).join('')}</div>
        <p class="on">${of.n === 1 ? '1 unitat' : `Paquet de ${of.n}`}</p><div class="burst"><svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="${starPath(16, 48, 38)}" fill="#F7C64E" stroke="#B5822A" stroke-width="2"/></svg><b>${eur(of.p)}</b></div></div></div>`; };
    return `<div class="offers">${one('a', sc.a)}${one('b', sc.b)}</div>`;
  },
  dial(sc) {
    const max = sc.max, ticks = [], big = max > 2000 ? 1000 : 500;
    for (let g = 0; g <= max; g += 100) { const a = (-120 + 240 * g / max) * Math.PI / 180, long = g % big === 0, r0 = long ? 58 : 64;
      ticks.push(`<line x1="${(Math.sin(a) * r0).toFixed(1)}" y1="${(-Math.cos(a) * r0).toFixed(1)}" x2="${(Math.sin(a) * 72).toFixed(1)}" y2="${(-Math.cos(a) * 72).toFixed(1)}" stroke="#04131C" stroke-width="${long ? 3 : 1.5}"/>`);
      if (long) ticks.push(`<text x="${(Math.sin(a) * 46).toFixed(1)}" y="${(-Math.cos(a) * 46 + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#04131C">${thousands(g)}</text>`); }
    return `<svg viewBox="0 0 300 250" role="img" aria-label="Una balança de cuina">
      <ellipse cx="150" cy="56" rx="96" ry="14" fill="#C9D6DB" stroke="#6F7C86" stroke-width="2"/><g class="load">${[-40, 0, 40, -20, 20].map((dx, i) => `<text x="${150 + dx}" y="${i < 3 ? 52 : 34}" text-anchor="middle" font-size="34">${sc.e}</text>`).join('')}</g>
      <path d="M120 68h60l6 18h-72Z" fill="#9EC3C0"/>
      <path d="M60 236l20-150h140l20 150Z" fill="#FF6B5E" stroke="#B5392F" stroke-width="3" stroke-linejoin="round"/>
      <g transform="translate(150 160)"><circle r="80" fill="#FFF8E6" stroke="#B5392F" stroke-width="5"/>${ticks.join('')}
        <text y="40" text-anchor="middle" font-size="13" font-weight="800" fill="#7A5A1E">grams</text>
        <g class="needle"><path d="M-4 0L0 -70L4 0Z" fill="#04131C"/><circle r="7" fill="#04131C"/><circle r="3" fill="#F7C64E"/></g></g></svg>`;
  },
  crate(sc) {
    const egg = sc.e === '🥚', s = Math.min(36, 300 / sc.cols), w = sc.cols * s + 20, h = sc.rows * s + 20;
    return `<svg viewBox="0 0 ${w} ${h + 10}" style="max-width:${Math.min(520, w * 1.6)}px" role="img" aria-label="${sc.rows} files de ${sc.cols}">
      <rect x="2" y="2" width="${w - 4}" height="${h}" rx="8" fill="${egg ? '#C9B79C' : 'url(#m-wood)'}" stroke="${egg ? '#8F7A5A' : '#6B3E1C'}" stroke-width="3"/>
      ${Array.from({ length: sc.rows * sc.cols }, (_, i) => { const r = Math.floor(i / sc.cols), c = i % sc.cols, x = 10 + c * s + s / 2, y = 10 + r * s + s / 2;
        return `${egg ? `<circle cx="${x}" cy="${y}" r="${s * 0.42}" fill="#A8957A"/>` : ''}<text class="drop" style="--d:${(r * 0.12 + c * 0.04).toFixed(2)}s" x="${x}" y="${y + s * 0.3}" text-anchor="middle" font-size="${s * 0.8}">${sc.e}</text>`; }).join('')}</svg>`;
  },
  piggy(sc) {
    return `<svg viewBox="0 0 340 230" role="img" aria-label="La guardiola">
      <ellipse cx="130" cy="214" rx="90" ry="10" fill="rgb(0 0 0 / 0.3)"/>
      <g class="pig"><rect x="70" y="176" width="20" height="32" rx="8" fill="#E86E9C"/><rect x="160" y="176" width="20" height="32" rx="8" fill="#E86E9C"/>
        <ellipse cx="128" cy="138" rx="92" ry="66" fill="url(#m-pig)" stroke="#C24E7C" stroke-width="3"/><path d="M70 82l-6-30l30 18Z" fill="#E86E9C" stroke="#C24E7C" stroke-width="3" stroke-linejoin="round"/>
        <ellipse cx="216" cy="146" rx="24" ry="20" fill="#FFB3CF" stroke="#C24E7C" stroke-width="3"/><circle cx="208" cy="146" r="4" fill="#C24E7C"/><circle cx="224" cy="146" r="4" fill="#C24E7C"/>
        <circle cx="178" cy="114" r="7" fill="#04131C"/><circle cx="180" cy="112" r="2.4" fill="#fff"/><path d="M40 132q-22 -6-16 -24" fill="none" stroke="#C24E7C" stroke-width="4" stroke-linecap="round"/>
        <rect x="104" y="72" width="44" height="9" rx="4.5" fill="#7A1E44"/>
        <text x="128" y="160" text-anchor="middle" class="pt">${sc.have ? H(eur(sc.have)) : ''}</text></g>
      <g class="fall"><g transform="translate(126 18)">${coinG(sc.per)}</g></g>
      <text x="126" y="12" text-anchor="middle" class="per">+${H(eur(sc.per))} cada setmana</text>
      ${sc.weeks ? `<text x="126" y="226" text-anchor="middle" class="wk"></text>` : ''}
      ${sc.goal ? `<g class="goal"><rect x="262" y="150" width="64" height="58" rx="8" fill="url(#m-wood)" stroke="#6B3E1C" stroke-width="2"/><text x="294" y="140" text-anchor="middle" font-size="54">${sc.goal.e}</text>
        <rect x="258" y="164" width="72" height="26" rx="6" fill="#FFF8E6" stroke="#C9A55A" stroke-width="2"/><text x="294" y="183" text-anchor="middle" font-size="16" font-weight="800" fill="#2A1C00" font-family="Baloo 2, sans-serif">${H(eur(sc.goal.p))}</text></g>` : ''}</svg>`;
  }
};
// a coin drawn inside an SVG (the piggy bank), not as its own svg
const coinG = v => isBill(v) ? `<g transform="scale(0.45) translate(-80 -42)">${money(v).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>` : `<g transform="scale(0.32)">${money(v).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
const starPath = (n, R, r) => Array.from({ length: n * 2 }, (_, i) => { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r : R; return `${i ? 'L' : 'M'}${(Math.sin(a) * rr).toFixed(1)} ${(-Math.cos(a) * rr).toFixed(1)}`; }).join('') + 'Z';

// a spring: x goes to target and wobbles a little before it rests. Gives step(dt) → whether it still moves
function spring(get, set, target, k = 90, c = 9) {
  let v = 0;
  return dt => { const x = get(), a = -k * (x - target()) - c * v; v += a * dt; set(x + v * dt); return Math.abs(v) > 0.02 || Math.abs(x - target()) > 0.05; };
}
// the needle of the dial swings from 0 to its weight
function dialMove(el, sc, t) {
  const nd = el.querySelector('.needle'), to = -120 + 240 * sc.g / sc.max;
  let a = -120;
  const put = x => { a = x; nd.setAttribute('transform', `rotate(${a.toFixed(2)})`); };
  if (RM || !t) return put(to);
  put(a); const step = spring(() => a, put, () => to, 40, 5);
  setTimeout(() => frames(t, nd, dt => step(dt)).start(), 500);
}
// the coins of the weeks fall into the piggy bank one after the other, and it wobbles each time
function piggyMove(el, sc, t) {
  const coin = el.querySelector('.fall'), pig = el.querySelector('.pig'), wk = el.querySelector('.wk'), pt = el.querySelector('.pt');
  if (!sc.weeks) { coin.classList.add('bob'); return; }
  if (RM || !t) { wk && (wk.textContent = `${sc.weeks} setmanes`); return; }
  const n = Math.min(sc.weeks, 12);
  (async () => {
    for (let i = 1; i <= n && t.on; i++) {
      await tween(Math.max(180, 520 - i * 25), k => coin.setAttribute('transform', `translate(0 ${(k * k * 60).toFixed(1)}) scale(${(1 - k * 0.4).toFixed(2)})`));
      coin.setAttribute('transform', ''); pig.classList.remove('wob'); void pig.getBoundingClientRect(); pig.classList.add('wob');
      if (wk) wk.textContent = `Setmana ${i === n ? sc.weeks : i}`;
      if (pt && i === n) pt.textContent = '?';
    }
  })();
}

/* ---------- flying: a picture goes from one place of the screen to another along an arc ---------- */
function fly(html, from, to, dur = 420, spin = 0) {
  if (RM) return Promise.resolve();
  const e = document.createElement('div');
  e.className = 'flyer'; e.innerHTML = html; document.body.append(e);
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2, lift = Math.min(140, 40 + Math.abs(y1 - y0) * 0.4);
  return tween(dur, k => { const q = 1 - (1 - k) ** 2, x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q - Math.sin(Math.PI * k) * lift;
    e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${(spin * k).toFixed(1)}deg) scale(${(1 + Math.sin(Math.PI * k) * 0.25).toFixed(3)})`; })
    .then(() => e.remove());
}

/* ---------- the counter, the purse and the register ---------- */
// The child pays (or gives the change): a tap on a coin of the purse makes it fly to the counter, a tap on a coin of the counter sends
// it back. o.onPut(list of values) after every move; o.sound(kind) for the clink of a coin ('coin'), a note ('bill') and the way back ('back').
// Gives { value() the list on the counter, lock(), shake(), open() the drawer of the register when it is right }
export function payBox(el, q, o = {}) {
  defs();
  const left = new Map(q.purse.map(([v, n]) => [v, n]));
  const head = q.change ? `<div class="client"><span class="who">${q.who[0]}</span><div class="bubble"><p>Em poses ${H(q.items[0].the)}? <span class="price">${H(eur(q.items[0].p))}</span></p><p class="gives">Té${q.paid >= 500 ? ', un bitllet de' : ''} ${money(q.paid, 40)}</p></div></div>`
    : q.items.length ? `<div class="tags">${q.items.map(x => `<span class="ptag"><b>${x.e}</b>${H(x.n)}<i>${H(eur(x.p))}</i></span>`).join('<span class="plus">+</span>')}</div>` : '';
  el.innerHTML = `<div class="paybox${q.change ? ' change' : ''}">${head}
    <div class="register"><span class="lcd-l">${q.change ? 'Canvi' : 'Al taulell'}</span><span class="lcd" id="lcd">0,00 €</span>${q.min ? `<span class="pcs" id="pcs">0 peces</span>` : ''}<span class="drawer"></span></div>
    <div class="counter" id="counter" aria-label="El taulell"><p class="empty">${q.change ? 'Posa aquí el canvi' : 'Posa aquí els diners'}</p></div>
    <div class="purse-l">${q.change ? 'La caixa' : 'El teu moneder'}</div>
    <div class="wallet" id="wallet">${q.purse.map(([v, n]) => `<button class="mo${isBill(v) ? ' b' : ''}" data-v="${v}" aria-label="${valName(v)}"${n === 0 ? ' disabled' : ''}>${money(v, 50)}${Number.isFinite(n) ? `<i class="n">×${n}</i>` : ''}</button>`).join('')}</div></div>`;
  const counter = el.querySelector('#counter'), wallet = el.querySelector('#wallet'), lcd = el.querySelector('#lcd'), pcs = el.querySelector('#pcs');
  let put = [], shown = 0, locked = false;
  const total = () => put.reduce((s, x) => s + x, 0);
  function paint() {
    const to = total(), from = shown; shown = to;
    if (RM) lcd.textContent = eur(to).replace(/ €$/, '').replace(/^(\d+)$/, '$1,00') + ' €';
    else tween(260, k => { const x = Math.round(from + (to - from) * k); lcd.textContent = `${Math.floor(x / 100)},${String(x % 100).padStart(2, '0')} €`; });
    if (pcs) pcs.textContent = `${put.length} ${put.length === 1 ? 'peça' : 'peces'}`;
    counter.querySelector('.empty').hidden = put.length > 0;
    for (const b of wallet.querySelectorAll('.mo')) { const n = left.get(+b.dataset.v); if (Number.isFinite(n)) { b.disabled = n <= 0; b.querySelector('.n').textContent = `×${n}`; } }
  }
  // the coins on the counter: notes in a row of their own, then the coins from the biggest
  function layout() {
    const sorted = put.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    counter.querySelectorAll('.on').forEach(e => e.remove());
    for (const [v] of sorted) counter.insertAdjacentHTML('beforeend', `<button class="on${isBill(v) ? ' b' : ''}" data-v="${v}" aria-label="Treu ${valName(v)}" style="--r:${((v * 37) % 17) - 8}deg">${money(v, 46)}</button>`);
  }
  wallet.onclick = async e => {
    const b = e.target.closest('.mo'); if (!b || b.disabled || locked) return;
    const v = +b.dataset.v, n = left.get(v);
    if (Number.isFinite(n)) left.set(v, n - 1);
    put.push(v); layout();
    const dest = [...counter.querySelectorAll('.on')].reverse().find(x => +x.dataset.v === v) || counter;
    dest.style.visibility = 'hidden';
    o.sound?.(isBill(v) ? 'bill' : 'coin');
    paint();
    await fly(money(v, 46), b, dest, 380, isBill(v) ? 8 : 540);
    dest.style.visibility = ''; dest.classList.add('land');
    o.onPut?.(put.slice());
  };
  counter.onclick = async e => {
    const b = e.target.closest('.on'); if (!b || locked) return;
    const v = +b.dataset.v, i = put.indexOf(v); if (i < 0) return;
    put.splice(i, 1); if (Number.isFinite(left.get(v))) left.set(v, left.get(v) + 1);
    const home = wallet.querySelector(`[data-v="${v}"]`);
    b.style.visibility = 'hidden'; o.sound?.('back'); paint();
    await fly(money(v, 46), b, home, 300, -360);
    layout();
    o.onPut?.(put.slice());
  };
  paint();
  return {
    value: () => put.slice(),
    lock() { locked = true; wallet.querySelectorAll('button').forEach(b => b.disabled = true); },
    shake() { const r = el.querySelector('.register'); r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); },
    open() { el.querySelector('.register').classList.add('open'); counter.classList.add('right'); },
    clear() { put = []; for (const [v, n] of q.purse) left.set(v, n); layout(); paint(); }
  };
}

/* ---------- the scales with two pans ---------- */
// The thing on the left pan weighs q.target; the weights the child puts go on the right pan and the beam swings on a spring:
// down on the heavy side, level when they weigh the same. Gives { value(), lock(), shake(), level() }
export function scaleBox(el, q, o = {}) {
  const t = o.t;
  el.innerHTML = `<div class="scalebox"><svg viewBox="0 0 340 230" role="img" aria-label="Balança de dos plats">
      <rect x="150" y="196" width="40" height="14" rx="4" fill="#6F7C86"/><path d="M110 222h120l-12 -14h-96Z" fill="#9EC3C0"/><rect x="164" y="64" width="12" height="134" rx="5" fill="url(#m-brass)"/>
      <g class="beam"><rect x="40" y="56" width="260" height="10" rx="5" fill="url(#m-brass)" stroke="#6B4A10" stroke-width="1.5"/><circle cx="170" cy="61" r="9" fill="#F7C64E" stroke="#6B4A10" stroke-width="2"/></g>
      <g class="panL"><path d="M0 0L-38 70M0 0L38 70" stroke="#C9D6DB" stroke-width="1.5"/><path d="M-48 70h96q-6 20 -48 20q-42 0 -48 -20Z" fill="#C9D6DB" stroke="#6F7C86" stroke-width="2"/>
        <text y="64" text-anchor="middle" font-size="42">${q.e}</text><rect x="-34" y="92" width="68" height="20" rx="10" fill="#04131C" stroke="#F7C64E" stroke-width="1.5"/><text y="107" text-anchor="middle" class="kg">${H(gr(q.target))}</text></g>
      <g class="panR"><path d="M0 0L-38 70M0 0L38 70" stroke="#C9D6DB" stroke-width="1.5"/><path d="M-48 70h96q-6 20 -48 20q-42 0 -48 -20Z" fill="#C9D6DB" stroke="#6F7C86" stroke-width="2"/><g class="stack"></g>
        <rect x="-34" y="92" width="68" height="20" rx="10" fill="#04131C" stroke="#6FE3FF" stroke-width="1.5"/><text y="107" text-anchor="middle" class="kg now">0 g</text></g>
      <path class="arrow" d="M170 30v18" stroke="#F7C64E" stroke-width="3" stroke-linecap="round"/><path class="mark" d="M163 40l7 10l7 -10" fill="#F7C64E"/>
    </svg>
    <p class="weights-l">Les peses <small>(toca el plat per treure'n)</small></p>
    <div class="weights">${q.weights.map(w => `<button class="wt" data-w="${w}" aria-label="Pesa de ${gr(w)}"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M22 8h16v8h-16Z" fill="#6B4A10"/><rect x="26" y="2" width="8" height="10" rx="4" fill="none" stroke="#6B4A10" stroke-width="3"/>
      <path d="M12 ${w >= 1000 ? 16 : w >= 500 ? 22 : w >= 200 ? 28 : w >= 100 ? 33 : 38}h36l6 40h-48Z" fill="url(#m-brass)" stroke="#6B4A10" stroke-width="2"/></svg><b>${H(gr(w))}</b></button>`).join('')}</div></div>`;
  const beam = el.querySelector('.beam'), L = el.querySelector('.panL'), Rp = el.querySelector('.panR'), stack = el.querySelector('.stack'), now = el.querySelector('.now');
  let put = [], angle = 0, locked = false;
  const target = () => { const d = put.reduce((s, x) => s + x, 0) - q.target; return d === 0 ? 0 : Math.sign(d) * Math.min(16, 4 + Math.abs(d) / q.target * 30); };
  const place = a => {
    angle = a; beam.setAttribute('transform', `rotate(${a.toFixed(2)} 170 61)`);
    const r = a * Math.PI / 180, dx = 125 * Math.cos(r), dy = 125 * Math.sin(r);
    L.setAttribute('transform', `translate(${(170 - dx).toFixed(1)} ${(61 - dy).toFixed(1)})`); Rp.setAttribute('transform', `translate(${(170 + dx).toFixed(1)} ${(61 + dy).toFixed(1)})`);
  };
  place(-16);
  const step = spring(() => angle, place, target, 60, 6), loop = t && !RM ? frames(t, beam, dt => step(dt)) : null;
  const move = () => { if (loop) loop.start(); else place(target()); };
  move();
  function draw() {
    const sorted = put.slice().sort((a, b) => b - a);
    stack.innerHTML = sorted.map((w, i) => { const h = w >= 1000 ? 22 : w >= 500 ? 18 : w >= 200 ? 15 : w >= 100 ? 12 : 10, row = Math.floor(i / 3), col = i % 3;
      return `<g class="pw" data-w="${w}" transform="translate(${(col - 1) * 28} ${68 - row * 22})"><path d="M-11 0h22l3 -${h}h-28Z" fill="url(#m-brass)" stroke="#6B4A10" stroke-width="1.5"/><text y="-3" text-anchor="middle" font-size="7" font-weight="800" fill="#3B2A00">${w >= 1000 ? w / 1000 + 'kg' : w}</text></g>`; }).join('');
    const sum = put.reduce((s, x) => s + x, 0); now.textContent = gr(sum);
  }
  el.querySelector('.weights').onclick = async e => {
    const b = e.target.closest('.wt'); if (!b || locked) return;
    const w = +b.dataset.w; put.push(w); o.sound?.('weight');
    await fly(`<span class="flyw">${H(gr(w))}</span>`, b, Rp, 360, 0);
    draw(); move(); o.onPut?.(put.slice());
  };
  Rp.style.cursor = 'pointer';
  Rp.addEventListener('click', () => { if (locked || !put.length) return; const w = put.slice().sort((a, b) => a - b)[0]; put.splice(put.indexOf(w), 1); o.sound?.('back'); draw(); move(); o.onPut?.(put.slice()); });
  return {
    value: () => put.slice(),
    lock() { locked = true; el.querySelectorAll('button').forEach(b => b.disabled = true); },
    shake() { const s = el.querySelector('svg'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); },
    level() { el.querySelector('.scalebox').classList.add('right'); }
  };
}

/* ---------- the stall of the frog, on the map ---------- */
// It grows with the projects validated (n of 9): an awning, lights, crates, the sign, flags, the register, the stalls next door and a star
export const MARKET_STEPS = ['un tendal', 'llums', 'una caixa de fruita', 'el rètol', 'una altra caixa', 'banderetes', 'la caixa registradora', 'parades veïnes', "l'estrella d'or"];
export function market(el, n) {
  defs();
  const has = k => n > k;
  el.innerHTML = `<svg class="market" viewBox="0 -26 360 196" role="img" aria-label="La teva parada: ${n} de 9 millores">
    ${has(7) ? `<g class="neigh" opacity="0.75"><rect x="4" y="70" width="58" height="80" fill="#1B3F52"/><path d="M0 70h66l-6 -22h-54Z" fill="#6FE3FF"/><text x="33" y="120" text-anchor="middle" font-size="26">🧀</text>
      <rect x="298" y="70" width="58" height="80" fill="#1B3F52"/><path d="M294 70h66l-6 -22h-54Z" fill="#B79CFF"/><text x="327" y="120" text-anchor="middle" font-size="26">🐟</text></g>` : ''}
    <rect x="84" y="${has(0) ? 40 : 70}" width="6" height="${has(0) ? 110 : 80}" fill="#8A5A2B"/><rect x="270" y="${has(0) ? 40 : 70}" width="6" height="${has(0) ? 110 : 80}" fill="#8A5A2B"/>
    ${has(0) ? awning(78, 282, 36, 22, 8) : ''}${has(1) ? bulbs(86, 274, 66, 9) : ''}
    ${has(5) ? `<path d="M20 20Q180 50 340 20" fill="none" stroke="#C9D6DB" stroke-width="1"/>${Array.from({ length: 12 }, (_, i) => { const x = 30 + i * 27, y = 20 + Math.sin((i + 0.5) / 12 * Math.PI) * 15; return `<path class="flag" style="--d:${i * 0.2}s;transform-origin:${x}px ${y}px" d="M${x - 7} ${y}h14l-7 13Z" fill="${['#FF6B5E', '#F7C64E', '#7CF5B0', '#6FE3FF'][i % 4]}"/>`; }).join('')}` : ''}
    ${has(3) ? `<g class="sign"><rect x="106" y="${has(0) ? 4 : 30}" width="148" height="24" rx="6" fill="#0A2A3A" stroke="#F7C64E" stroke-width="2"/><text x="180" y="${has(0) ? 21 : 47}" text-anchor="middle" font-size="12" font-weight="800" fill="#F7C64E" font-family="Baloo 2, sans-serif">MERCAT DE L'ESTANY</text></g>` : ''}
    ${has(8) ? `<g class="star"><path transform="translate(180 ${has(0) ? -6 : 20}) scale(0.2)" d="${starPath(5, 48, 20)}" fill="#F7C64E" stroke="#FFF3B8" stroke-width="6"/></g>` : ''}
    <rect x="76" y="126" width="208" height="30" rx="6" fill="url(#m-wood)" stroke="#6B3E1C" stroke-width="2"/>
    ${crate(130, 98, 60, '🍎', false, 0)}${has(2) ? crate(180, 98, 60, '🍊', false, 1) : ''}${has(4) ? crate(230, 98, 60, '🍉', false, 2) : ''}
    ${has(6) ? `<g transform="translate(248 104)"><rect width="30" height="22" rx="4" fill="#4D7486" stroke="#04131C" stroke-width="1.5"/><rect x="4" y="4" width="22" height="7" rx="2" fill="#7CF5B0"/><rect x="-2" y="20" width="34" height="6" rx="2" fill="#2A4B5C"/></g>` : ''}
    <g transform="translate(180 152) scale(0.42)">${FROG.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`;
}

/* ---------- the customers of the rush hour ---------- */
// an animal walks to the counter (or out of it, happy, with its thing)
export function walk(el, inn) {
  if (RM) return Promise.resolve();
  el.classList.remove('in', 'out'); void el.offsetWidth; el.classList.add(inn ? 'in' : 'out');
  return new Promise(r => setTimeout(r, inn ? 520 : 480));
}
export { mid, short };
