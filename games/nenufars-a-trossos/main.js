import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { levelRow, wireLevels, panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, RAPID, ROOM, want, right, kindOf, sumOf, decOpts, cuts, tipFor, explain, starsFor,
  clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, streakIn, rapidIn, exam, examIn, sprint, sheet, sheetIn } from './logic.js';

const KEY = 'nenufars-a-trossos';
// ?obert at the end of the address opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = new URLSearchParams(location.search).has('obert');

// Facts only: { so, lv, piscina, exams, fulls, rapid, ratxa }. clean() makes a complete progress out of anything the browser holds,
// the save from before the cursus too
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);
const buzz = () => tone(150, 0, 0.45, 0.16, 'triangle');
// right answers in a row at the first try, and the longest run since the page opened
let streak = 0, top = 0;

/* ---------- figures ---------- */
// the colours every figure is painted with, kept once at the top of the page
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <radialGradient id="gLeaf" gradientUnits="userSpaceOnUse" cx="-16" cy="-20" r="80"><stop offset="0" stop-color="#4DBB78"/><stop offset="1" stop-color="#124E36"/></radialGradient>
  <radialGradient id="gSun" gradientUnits="userSpaceOnUse" cx="-16" cy="-20" r="80"><stop offset="0" stop-color="#FFF3B8"/><stop offset="1" stop-color="#EFA91C"/></radialGradient>
  <radialGradient id="gCrust" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="50"><stop offset="0.82" stop-color="#F0C277"/><stop offset="1" stop-color="#A9651F"/></radialGradient>
  <radialGradient id="gSauce" gradientUnits="userSpaceOnUse" cx="-12" cy="-14" r="64"><stop offset="0" stop-color="#EE6A4A"/><stop offset="1" stop-color="#A92F1B"/></radialGradient>
  <radialGradient id="gCheese" gradientUnits="userSpaceOnUse" cx="-12" cy="-14" r="64"><stop offset="0" stop-color="#FFEDA3"/><stop offset="1" stop-color="#F3B032"/></radialGradient>
  <radialGradient id="gFace" gradientUnits="userSpaceOnUse" cx="-14" cy="-18" r="76"><stop offset="0" stop-color="#1D586E"/><stop offset="1" stop-color="#082230"/></radialGradient>
  <linearGradient id="gWood" x2="0" y2="1"><stop offset="0" stop-color="#C08A55"/><stop offset="1" stop-color="#84552B"/></linearGradient>
  <linearGradient id="gPaint" x2="0" y2="1"><stop offset="0" stop-color="#FFE68F"/><stop offset="1" stop-color="#ECA41A"/></linearGradient>
  <linearGradient id="gChoc" x2="1" y2="1"><stop offset="0" stop-color="#93593A"/><stop offset="1" stop-color="#57301A"/></linearGradient>
  <linearGradient id="gWhite" x2="1" y2="1"><stop offset="0" stop-color="#FFF8E3"/><stop offset="1" stop-color="#E6C286"/></linearGradient>
  <linearGradient id="gJuice"><stop offset="0" stop-color="#FFC25C"/><stop offset="1" stop-color="#EE7F16"/></linearGradient>
  <clipPath id="jugClip"><path d="M30 14H114V174a12 12 0 0 1 -12 12H42a12 12 0 0 1 -12 -12Z"/></clipPath></defs></svg>`);
const FROG = `<ellipse cx="0" cy="7" rx="30" ry="10" fill="#2F7F40"/><ellipse cx="0" cy="-12" rx="22" ry="17" fill="#58C06D" stroke="#2F7F40" stroke-width="2"/><ellipse cx="0" cy="-6" rx="13" ry="8" fill="#C9F2C4" opacity="0.5"/>
  <circle cx="-10" cy="-27" r="8.500" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="10" cy="-27" r="8.500" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="-9" cy="-26" r="3.600" fill="#0F3A40"/><circle cx="11" cy="-26" r="3.600" fill="#0F3A40"/>
  <circle cx="-7.800" cy="-27.500" r="1.200" fill="#fff"/><circle cx="12.200" cy="-27.500" r="1.200" fill="#fff"/><circle cx="-15" cy="-11" r="3" fill="#FF8FD0" opacity="0.55"/><circle cx="15" cy="-11" r="3" fill="#FF8FD0" opacity="0.55"/>
  <path d="M-8 -9 Q0 -2 8 -9" fill="none" stroke="#1C5A3C" stroke-width="2.500" stroke-linecap="round"/>`;
const TAU = 6.2832;
// parts of different sizes, for the figures that are not cut in equal parts
const UNEVEN = [[1.7, 0.6, 1.2, 0.5, 1.5, 0.8, 1.3, 0.6], [0.5, 1.5, 0.7, 1.6, 0.9, 1.4, 0.6, 1.3]];
// Where the D parts of a figure start, as shares of the whole, and the cuts to draw over them. o.w gives parts of different sizes;
// o.was animates the last cut or join (see cuts in logic.js). The chosen area itself never moves.
function layout(D, o) {
  if (!o.w) return { edge: Array.from({ length: D }, (_, i) => i / D), lines: cuts(D, o.was || D) };
  const sum = o.w.reduce((s, x) => s + x, 0), edge = [];
  let t = 0;
  for (const x of o.w) { edge.push(t); t += x / sum; }
  return { edge, lines: edge.map(e => [e, '']) };
}
// A round figure from above, part 0 from twelve o'clock and on clockwise: a lily pad that lights up, a pizza whose chosen parts
// have cheese and pepperoni, or a clock whose chosen parts are the time gone by (o.hand is where its hand points)
function roundSvg(skin, D, on, o = {}) {
  const pizza = skin === 'pizza', clock = skin === 'clock', R = pizza ? 44 : 50, { edge, lines } = layout(D, o);
  const xy = (t, r = R) => [(r * Math.sin(t * TAU)).toFixed(2), (-r * Math.cos(t * TAU)).toFixed(2)], P = (t, r) => xy(t, r).join(' ');
  const paint = l => clock ? (l ? 'rgb(247 198 78 / 0.9)' : 'transparent') : `url(#${pizza ? (l ? 'gCheese' : 'gSauce') : l ? 'gSun' : 'gLeaf'})`;
  let parts = '', deco = '';
  edge.forEach((t, i) => {
    const span = (edge[i + 1] ?? 1) - t, l = on(i), c = `class="pt${l ? ' on' : ''}" data-i="${i}" fill="${paint(l)}"`;
    parts += D === 1 ? `<circle r="${R}" ${c}/>` : `<path ${c} d="M0 0L${P(t)}A${R} ${R} 0 ${span > 0.5 ? 1 : 0} 1 ${P(t + span)}Z"/>`;
    if (pizza && l) for (const [f, at] of span >= 0.2 ? [[0.25, 30], [0.75, 30], [0.5, 15]] : [[0.5, 28]]) deco += `<circle class="pep" r="${Math.min(6.5, 50 * span).toFixed(1)}" transform="translate(${P(t + span * f, at)})"/>`;
    if (skin === 'pad') deco += `<path class="vein" d="M${P(t + span / 2, 11)}L${P(t + span / 2, 43)}"/>`;
  });
  const top = pizza ? '<circle r="44" fill="none" stroke="rgb(90 36 8 / 0.45)" stroke-width="1.500"/>'
    : clock ? `${Array.from({ length: 12 }, (_, i) => `<path class="tick" d="M${P(i / 12, 43)}L${P(i / 12, 48)}"/>`).join('')}${[12, 3, 6, 9].map(h => { const [x, y] = xy(h / 12, 36); return `<text x="${x}" y="${+y + 3.5}">${h}</text>`; }).join('')}
      <circle r="50" fill="none" stroke="#EAF8F4" stroke-width="3"/>${o.hand == null ? '' : `<path class="hand" d="M0 0L${P(o.hand, 27)}"/>`}<circle r="3.500" fill="#EAF8F4"/>`
    : '<circle r="49" fill="none" stroke="#2F7F40" stroke-width="2.500"/><circle r="4.500" fill="#FF8FD0"/><circle r="2" fill="#FFE9A0"/>';
  return `<svg class="fig round ${skin}${o.tap ? ' tap' : ''}" viewBox="-54 -54 108 108" aria-hidden="true">${pizza ? '<circle r="50" fill="url(#gCrust)"/>' : clock ? '<circle r="50" fill="url(#gFace)"/>' : ''}
    ${parts}<g class="deco">${deco}</g>${lines.map(([t, c]) => `<path class="ct ${c}" d="M0 0L${P(t, pizza ? 49 : R)}"/>`).join('')}<g class="deco">${top}</g></svg>`;
}
// A long figure, part 0 on the left: a walkway of planks that get painted, or a tablet of chocolate whose chosen parts are white.
// The tablet can also be cut across, in o.rows rows (o.wasRows before the last cut): the same columns, more squares
function barSvg(skin, D, on, o = {}) {
  const choc = skin === 'choc', rows = o.rows || 1, H = choc ? (o.tall ? 108 : 64) : 46, { edge, lines } = layout(D, o), f = x => x.toFixed(2);
  const cells = edge.map((t, i) => {
    const x = t * 240, w = ((edge[i + 1] ?? 1) - t) * 240, l = on(i), h = H / rows, m = Math.min(w, h) * 0.16;
    return `<g class="pt${l ? ' on' : ''}" data-i="${i}">${choc
      ? Array.from({ length: rows }, (_, r) => `<rect x="${f(x)}" y="${f(r * h)}" width="${f(w + 0.3)}" height="${f(h + 0.3)}" fill="url(#${l ? 'gWhite' : 'gChoc'})"/><rect class="emb" x="${f(x + m)}" y="${f(r * h + m)}" width="${f(w - 2 * m)}" height="${f(h - 2 * m)}" rx="2"/>`).join('')
      : `<rect x="${f(x)}" width="${f(w + 0.3)}" height="${H}" fill="url(#${l ? 'gPaint' : 'gWood'})"/><circle class="nail" cx="${f(x + w / 2)}" cy="6" r="1.400"/><circle class="nail" cx="${f(x + w / 2)}" cy="${H - 6}" r="1.400"/>`}</g>`;
  }).join('');
  return `<svg class="fig plank ${skin}${o.tap ? ' tap' : ''}" viewBox="0 0 240 ${H}" aria-hidden="true">${cells}${lines.filter(c => c[0] > 0).map(([t, c]) => `<path class="ct ${c}" d="M${f(t * 240)} 0V${H}"/>`).join('')}
    ${cuts(rows, o.wasRows || rows).filter(c => c[0] > 0).map(([t, c]) => `<path class="ct ${c}" d="M0 ${f(t * H)}H240"/>`).join('')}</svg>`;
}
// a glass jug with a mark for each part: the chosen parts are the juice, from the bottom up. o.lab writes the fraction at every mark
function jugSvg(D, on, o = {}) {
  const Y = i => 186 - i * 160 / D, n = Array.from({ length: D }, (_, i) => i).filter(on).length, glass = 'M30 14H114V174a12 12 0 0 1 -12 12H42a12 12 0 0 1 -12 -12Z';
  return `<svg class="fig jug${o.tap ? ' tap' : ''}" viewBox="-16 0 170 200" aria-hidden="true"><path class="deco" d="M114 52q34 0 34 38t-34 38" fill="none" stroke="rgb(234 248 244 / 0.7)" stroke-width="7" stroke-linecap="round"/>
    <path d="${glass}" fill="rgb(220 246 255 / 0.1)"/><g clip-path="url(#jugClip)">${Array.from({ length: D }, (_, i) => `<rect class="pt${on(i) ? ' on' : ''}" data-i="${i}" x="30" y="${Y(i + 1).toFixed(2)}" width="84" height="${(160 / D + 0.4).toFixed(2)}" fill="${on(i) ? 'url(#gJuice)' : 'transparent'}"/>`).join('')}
      ${n ? `<ellipse class="deco" cx="72" cy="${Y(n).toFixed(2)}" rx="42" ry="4" fill="#FFE2B0"/>` : ''}</g>
    <g class="deco">${Array.from({ length: D }, (_, i) => `<path class="tick" d="M30 ${Y(i + 1).toFixed(2)}h${i + 1 === D ? 18 : 11}"/>${o.lab ? `<text x="24" y="${(Y(i + 1) + 4).toFixed(2)}">${i + 1}/${D}</text>` : ''}`).join('')}
      <path d="${glass}" fill="none" stroke="rgb(234 248 244 / 0.85)" stroke-width="3.500" stroke-linejoin="round"/><path d="M41 26V158" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.22"/></g></svg>`;
}
// a group of things, some of them chosen: eggs in a carton, or fireflies that light up
function setHtml(skin, D, on, o = {}) {
  const tag = o.tap ? 'button' : 'i';
  return `<div class="bugs ${skin}${o.tap ? ' tap' : ''}" style="--bc:${D > 6 ? Math.ceil(D / 2) : D}">${Array.from({ length: D }, (_, i) => `<${tag} class="bug${on(i) ? ' on' : ''}" data-i="${i}"${o.tap ? ` aria-label="${skin === 'eggs' ? 'Forat' : 'Cuca'} ${i + 1}"` : ''}></${tag}>`).join('')}</div>`;
}
const fig = (shape, D, on, o) => shape === 'jug' ? jugSvg(D, on, o) : shape === 'eggs' || shape === 'bugs' ? setHtml(shape, D, on, o) : shape === 'bar' || shape === 'choc' ? barSvg(shape, D, on, o) : roundSvg(shape, D, on, o);
// The river from 0 to o.max, a lily pad every 1/d and the frog on pad `pos`, with an arc for every jump it has made. o.lab writes
// the fraction under every pad; o.from is the pad the frog comes from
function lineSvg(d, pos, o = {}) {
  const N = d * (o.max || 1), X = i => 26 + i / N * 268, w = 268 / N, r = Math.min(9, w * 0.4);
  let s = `<svg class="fig nl${o.tap ? ' tap' : ''}" viewBox="0 0 320 112" aria-hidden="true"><rect class="river" x="6" y="47" width="308" height="34" rx="17"/>`;
  for (let i = 0; i < pos; i++) s += `<path class="arc" d="M${X(i).toFixed(1)} 58Q${(X(i) + w / 2).toFixed(1)} ${(58 - Math.min(24, w)).toFixed(1)} ${X(i + 1).toFixed(1)} 58"/>`;
  for (let i = 0; i <= N; i++) {
    const big = i % d === 0;
    s += `<ellipse class="lpad${big ? ' big' : ''}${i <= pos ? ' done' : ''}" cx="${X(i).toFixed(1)}" cy="64" rx="${(big ? r + 2.5 : r).toFixed(1)}" ry="${((big ? r + 2.5 : r) * 0.55).toFixed(1)}"/>`;
    if (big) s += `<text x="${X(i).toFixed(1)}" y="101">${i / d}</text>`;
    else if (o.lab) s += `<text class="sm" x="${X(i).toFixed(1)}" y="${N > 6 && i % 2 ? 105 : 94}">${i}/${d}</text>`;
  }
  s += `<g class="nf${o.from != null && o.from !== pos ? ' mv' : ''}" style="--x:${X(pos).toFixed(1)}px;--x0:${X(o.from ?? pos).toFixed(1)}px"><g transform="scale(0.44)">${FROG}</g></g>`;
  if (o.tap) for (let i = 0; i <= N; i++) s += `<rect class="hit" data-i="${i}" x="${(X(i) - w / 2).toFixed(1)}" y="0" width="${w.toFixed(1)}" height="112"/>`;
  return s + '</svg>';
}
const TOOMANY = '<p class="think">Massa parts per dibuixar-les: pensa-hi amb la regla!</p>', HIDDEN = '<p class="think">Sense dibuix! Pensa-hi de cap.</p>';
// two walkways one under the other, each with its fraction; too many planks cannot be drawn
const pair = (a, b, c, d, la, lc) => b > 24 || d > 24 ? TOOMANY
  : `<div class="row"><span class="lbl">${la}</span>${barSvg('bar', b, i => i < a)}</div><div class="row"><span class="lbl">${lc}</span>${barSvg('bar', d, i => i < c)}</div>`;
// w whole figures and one more with n of its d parts
const many = (shape, w, n, d) => `<div class="many${shape === 'choc' || shape === 'bar' ? ' bars' : ''}">${fig(shape, d, () => true, {}).repeat(w)}${n ? fig(shape, d, i => i < n, {}) : ''}</div>`;
// Two fractions to add or to take away, as walkways. At help 2 both are cut to the same parts and the result is drawn under them
function sumHtml(q, lv) {
  const [s, L, A, C] = sumOf(q), deep = lv > 1;
  if (L > 24) return TOOMANY;
  return `<div class="row"><span class="lbl">${q.a}/${q.b}</span>${barSvg('bar', deep ? L : q.b, i => i < (deep ? A : q.a), { was: deep ? q.b : 0 })}</div>
    <div class="row"><span class="lbl">${q.op} ${q.c}/${q.d}</span>${barSvg('bar', deep ? L : q.d, i => i < (deep ? C : q.c), { was: deep ? q.d : 0 })}</div>
    ${deep ? `<div class="row res"><span class="lbl">= ${s}/${L}</span>${barSvg('bar', L * Math.max(1, Math.ceil(s / L)), i => i < s)}</div>` : ''}`;
}
// A fraction of a quantity. An hour is a clock; anything else is a strip split in d equal parts with the quantity over it:
// at help 1 every part says what it holds (as dots while they fit), at help 2 the chosen parts are counted
function ofHtml(q, lv) {
  const each = q.T / q.d;
  if (q.unit === 'min' && q.T === 60 && [2, 3, 4, 6, 12].includes(q.d)) return `${roundSvg('clock', q.d, i => i < q.n, { hand: q.n / q.d })}
    <p class="cap${lv > 1 ? ' ok' : ''}">${lv > 1 ? `${q.n} × ${each} = ${each * q.n} minuts` : lv ? `Cada part del rellotge són ${each} minuts` : '1 hora = 60 minuts'}</p>`;
  return `<div class="model"><p class="brace"><b>${q.T} ${q.unit}</b></p><div class="cells">${Array.from({ length: q.d }, (_, i) => `<span class="cell${i < q.n ? ' on' : ''}">${lv ? (q.T <= 24 ? '<i></i>'.repeat(each) : `<b>${each}</b>`) : '<b>?</b>'}</span>`).join('')}</div>
    <p class="cap${lv > 1 ? ' ok' : ''}">${lv > 1 ? `${q.n} ${q.n > 1 ? 'parts' : 'part'}: ${each * q.n} ${q.unit}` : lv ? `Cada part: ${each} ${q.unit}` : `${q.d} parts iguals`}</p></div>`;
}
// a fraction over a hundred squares, which fill as the fraction does once there has been a hint
function hundred(q, lv) {
  const p = q.n * 100 / q.d, show = lv || q.d === 100;
  return `${q.d <= 25 ? barSvg('bar', q.d, i => i < q.n) : ''}<div class="grid100" role="img" aria-label="Cent quadrets">${Array.from({ length: 100 }, (_, i) => `<i${show && i < p ? ' class="on"' : ''}></i>`).join('')}</div>
    <p class="cap${lv > 1 ? ' ok' : ''}">${lv > 1 ? `${p} de cada 100` : 'Cent quadrets: quants se n\'omplen?'}</p>`;
}

/* ---------- words ---------- */
const KEYS = `<div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k =>
  `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quin salt!', 'Així es fa!'];
const HUES = [140, 28, 195, 262, 318, 165, 210, 48, 285, 350, 120, 20, 230, 300];
const RING = [140, 195, 262, 28, 318];   // the colour of each circle
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
const F = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const fr = s => F(...String(s).split('/'));
// after a new question comes up, touches are ignored for this long: a second tap on the button that was there must not answer it
const SETTLE = 450;
// what to say after a right answer
function said(q) {
  const { n, d } = q, w = want(q);
  switch (q.mode) {
    case 'equal': return `Sí! ${d} parts igual de grans.`;
    case 'paint': return `${n}/${d}: ${n} de ${d}. ${pick(HURRAY)}`;
    case 'name': return `${n}/${d}. ${pick(HURRAY)}`;
    case 'line': return n === d ? `${n}/${d} és 1: tot el camí!` : n === 0 ? `0/${d} és 0: encara no ha saltat.` : `${n}/${d}. ${pick(HURRAY)}`;
    case 'cmp': return `${q.a}/${q.b} ${w} ${q.c}/${d}. ${pick(HURRAY)}`;
    case 'same': return w ? `Sí: ${q.a}/${q.b} = ${q.c}/${d}.` : `Exacte: ${q.a}/${q.b} i ${q.c}/${d} no valen el mateix.`;
    case 'cut': return `${n}/${d} = ${n * q.k}/${d * q.k}: la mateixa part, amb parts més petites.`;
    case 'fill': return `${n}/${d} = ${q.N}/${q.D}. ${pick(HURRAY)}`;
    case 'join': return `${n}/${d} = ${w[0]}/${w[1]}: la mateixa part, amb menys parts.`;
    case 'imp': return `${q.w}${n ? ` i ${n}/${d}` : ''} = ${w}/${d}. ${pick(HURRAY)}`;
    case 'mix': return `${q.a}/${d} = ${w[0]} i ${w[1]}/${d}. ${pick(HURRAY)}`;
    case 'add': { const [s, L] = sumOf(q); return `${q.a}/${q.b} ${q.op} ${q.c}/${d} = ${q.D ? `${w}/${q.D}` : `${s}/${L}`}. ${pick(HURRAY)}`; }
    case 'times': return `${q.k} × ${n}/${d} = ${w}/${d}. ${pick(HURRAY)}`;
    case 'of': return `${n}/${d} de ${q.T} ${q.unit} són ${w} ${q.unit}. ${pick(HURRAY)}`;
    case 'pct': return `${n}/${d} = ${w} %. ${pick(HURRAY)}`;
    default: return `${n}/${d} = ${w}. ${pick(HURRAY)}`;
  }
}

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /nenufars-a-trossos\.html$/.test(location.pathname);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toS').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

// The keys on the screen and a real keyboard both end up here. Enter on a button that is not a key of the pad is left alone:
// it presses that button, as Space does.
let keyFn = null;
addEventListener('keydown', e => {
  if (!keyFn || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter' && e.target.closest?.('button:not([data-k]), a')) return;
  const k = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null;
  if (k) { e.preventDefault(); keyFn(k); }
});

/* ---------- the map: a band for each circle, a button for each project and the exam of the circle at the end ---------- */
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 60% 60%)" stroke-width="2.400" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c);
const starsOf = i => prog.lv.slice(i * 10, i * 10 + 10);
const noteText = i => { const n = noteOf(prog, i), d = starsOf(i).filter(Boolean).length; return n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer'; };
const examBtn = c => `<button class="proj exam${prog.exams[c] ? ' ok' : ''}" data-x="${c}" aria-label="Examen del cercle ${c}"${openX(c) ? '' : ' disabled'}><b>Examen</b><span class="mk">${prog.exams[c] ? 'Superat ✓' : openX(c) ? 'Sis preguntes' : openC(c) ? 'Valida els projectes' : 'Tancat'}</span></button>`;
// one line that says what to do now: the first project of an open circle that is not validated, or its exam; nothing when all is done
function advice() {
  for (let c = 0; c < CIRCLES.length && isOpen(prog, c); c++) {
    const i = CIRCLES[c].projects.find(i => noteOf(prog, i) < VALID);
    if (i !== undefined) return `Ara toca: ${PROJECTS[i].name}`;
    if (!prog.exams[c]) return `Ara toca: l'examen del cercle ${c}`;
  }
  return '';
}
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  fresh(); show('El mapa', false, 165);
  const band = c => `<section class="ring${openC(c) ? '' : ' shut'}" style="--rh:${RING[c]}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}"${openC(c) ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span>
        <span class="pp" aria-hidden="true">${starsOf(i).map(s => `<i class="s${s}"></i>`).join('')}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice(), any = OPEN || validated(prog).length > 0;
  $('#game').innerHTML = `<div class="map">${tip ? `<p class="next">${tip}</p>` : ''}${CIRCLES.map((_, c) => band(c)).join('')}
    <div class="extra"><button class="btn soft" id="full"${any ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      <button class="btn soft" id="rapid"${any ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Repte llampec${prog.rapid ? ` · rècord ${prog.rapid}` : ''}</button>
      <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div></div>`;
  $('#game').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level that still has something to win, as far as the project is open
      const i = +b.dataset.p, k = starsOf(i).findIndex(n => n < 3);
      level(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : reached(prog, i), 9));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
    else if (e.target.closest('#rapid:not(:disabled)')) llampec();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

/* ---------- the board: a run of questions, one at a time. A level, the Piscina, an exam and a lightning round all play on it ---------- */
// o is { t, qs, how, secs, chip(st), onLast(st), onEnd(st) }. how 'level' and 'pool' let the child try again, with what went wrong said
// and drawn; 'exam' and 'rapid' give one try. st is { slips, hits, marks, missed }: slips are wrong answers and hints, marks 'ok' or 'bad'
// per question. onLast is called the moment the last question is decided, so what was won is saved before any wait; onEnd when the
// board is over (with secs, when the time is). It is drawn inside #board and gives back hint(), for the button that asks for one.
function board(o) {
  const { t, qs, how } = o, once = how === 'exam' || how === 'rapid', host = $('#board'), st = { slips: 0, hits: 0, marks: [], missed: [] };
  // the state of the question being asked: what is typed (buf, and the slot being typed in), what is chosen, where the frog is and where it
  // comes from, the fraction a cut or joined figure shows now (and how many parts it had just before), and what the hints have uncovered
  let k = 0, q, help = 0, busy = false, over = false, openAt = 0, buf, slot, lit, pos, from, cur, was, shown, lab;
  host.style.setProperty('--n', qs.length); host.style.setProperty('--k', 0);
  host.innerHTML = `${o.secs ? '<div class="fuse" role="img" aria-label="El temps que queda"><i id="fuse"></i></div>'
    : `<div class="lane" id="lane" aria-hidden="true">${qs.map(() => '<i class="lp"></i>').join('')}<span class="fg" id="fg"><svg viewBox="-34 -40 68 58">${FROG}</svg></span></div>`}
    <p class="status tip${o.secs ? ' flat' : ''}" id="tip" role="status" aria-live="polite"></p>
    <div class="split" id="split"><div class="field" id="field"></div><div class="desk"><p class="ask" id="ask"></p><div id="ctl"></div></div><span class="combo" id="cb" hidden></span></div>`;
  const field = $('#field'), ctl = $('#ctl');
  const tip = (txt, cls) => { const e = $('#tip'); e.className = `status tip${o.secs ? ' flat' : ''}${cls ? ' ' + cls : ''}`; e.textContent = txt; };
  const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };
  const typed = () => kindOf(q) === 'frac' || kindOf(q) === 'num';

  function drawField() {
    const lv = lab ? 2 : help ? 1 : 0;
    let h;
    switch (q.mode) {
      // once the answer has been told (lab), the right figure is marked
      case 'equal': h = `<div class="trio${q.shape === 'bar' || q.shape === 'choc' ? ' tall' : ''}">${[0, 1, 2].map(i => `<button class="opt${lab && i === q.at ? ' good' : ''}" data-pick="${i}" aria-label="Figura ${i + 1}">${fig(q.shape, q.d, () => false, { w: i === q.at ? null : UNEVEN[i < q.at ? i : i - 1].slice(0, q.d) })}</button>`).join('')}</div>`; break;
      case 'paint': h = fig(q.shape, q.d, i => lit.has(i), { tap: !busy, lab, hand: lit.size / q.d }); break;
      case 'name': h = fig(q.shape, q.d, i => i < q.n, { hand: q.n / q.d, lab }); break;
      case 'line': h = lineSvg(q.d, q.ask === 'put' ? pos : q.n, { max: q.max, tap: q.ask === 'put' && !busy, lab, from }); break;
      case 'cmp': case 'same': h = shown ? pair(q.a, q.b, q.c, q.d, `${q.a}/${q.b}`, `${q.c}/${q.d}`) : HIDDEN; break;
      case 'fill': h = shown ? pair(q.n, q.d, q.N, q.D, `${q.n}/${q.d}`, q.miss === 'N' ? `?/${q.D}` : `${q.N}/?`) : HIDDEN; break;
      case 'imp': h = shown ? many(q.shape, q.w, q.n, q.d) : HIDDEN; break;
      case 'mix': h = shown ? many(q.shape, Math.floor(q.a / q.d), q.a % q.d, q.d) : HIDDEN; break;
      case 'add': h = shown ? sumHtml(q, lv) : HIDDEN; break;
      case 'times': h = shown ? `<div class="many bars">${barSvg('bar', q.d, i => i < q.n).repeat(q.k)}</div>` : HIDDEN; break;
      case 'of': h = shown ? ofHtml(q, lv) : HIDDEN; break;
      case 'pct': case 'dec': h = shown ? hundred(q, lv) : HIDDEN; break;
      default: {
        if (!shown) { h = HIDDEN; break; }
        if (q.d > ROOM[q.shape]) { h = TOOMANY; break; }
        const cut = q.mode === 'cut', goal = cut ? q.d * q.k : 0;
        // the tablet is cut across, in rows: its columns stay as they were
        h = (cut && q.shape === 'choc' ? barSvg('choc', q.d, i => i < q.n, { rows: cur.d / q.d, wasRows: was ? was / q.d : 0, tall: true }) : fig(q.shape, cur.d, i => i < cur.n, { was }))
          + `<p class="cap${cur.d === goal ? ' ok' : ''}">${cur.d === 1 ? 'Una sola part' : `${cur.d} parts`}${cut && cur.d > goal ? ': massa! Prem ↺' : ''}</p>`
          + (busy ? '' : `<div class="tools">${[2, 3, 5].map(x => `<button class="tool" data-t="${x}">${cut ? `✂ en ${x}` : `De ${x} en ${x}`}</button>`).join('')}<button class="tool" data-t="0" aria-label="Torna a començar">↺</button></div>`);
      }
    }
    field.innerHTML = h;
  }
  function drawAsk() {
    const box = i => `<output class="in${slot === i && !busy ? ' cur' : ''}" data-slot="${i}" aria-label="${kindOf(q) === 'num' ? 'Resposta' : q.mode === 'mix' ? (i ? 'Parts' : 'Sencers') : i ? 'Denominador' : 'Numerador'}">${buf[i]}</output>`;
    const m = q.mode;
    $('#ask').innerHTML = m === 'equal' ? `${q.d} parts iguals?` : m === 'paint' ? F(q.n, q.d) : m === 'name' ? F(box(0), box(1))
      : m === 'line' ? (q.ask === 'put' ? `Granota a ${F(q.n, q.d)}` : F(box(0), box(1)))
      : m === 'cmp' ? `${F(q.a, q.b)} <i>?</i> ${F(q.c, q.d)}` : m === 'same' ? `${F(q.a, q.b)} = ${F(q.c, q.d)} <i>?</i>`
      : m === 'cut' ? `${F(q.n, q.d)} = ${F(box(0), q.d * q.k)}` : m === 'fill' ? `${F(q.n, q.d)} = ${F(q.miss === 'N' ? box(0) : q.N, q.miss === 'D' ? box(0) : q.D)}`
      : m === 'join' ? `${F(q.n, q.d)} = ${F(box(0), box(1))}` : m === 'imp' ? `${q.w}${q.n ? ' ' + F(q.n, q.d) : ''} = ${F(box(0), q.d)}`
      : m === 'mix' ? `${F(q.a, q.d)} = ${box(0)} ${F(box(1), q.d)}` : m === 'add' ? `${F(q.a, q.b)} ${q.op} ${F(q.c, q.d)} = ${q.D ? F(box(0), q.D) : F(box(0), box(1))}`
      : m === 'times' ? `${q.k} × ${F(q.n, q.d)} = ${F(box(0), q.d)}` : m === 'of' ? `${F(q.n, q.d)} de ${q.T} = ${box(0)} <small>${q.unit}</small>`
      : m === 'pct' ? `${F(q.n, q.d)} = ${box(0)} %` : `${F(q.n, q.d)} = <i>?</i>`;
  }
  function drawCtl() {
    const row = (list, c) => `<div class="choices" style="--c:${c}">${list.map(([v, txt, label]) => `<button class="key" data-pick="${v}"${label ? ` aria-label="${label}"` : ''}>${txt}</button>`).join('')}</div>`;
    ctl.innerHTML = typed() ? KEYS : kindOf(q) === 'check' ? '<button class="btn" id="chk">Comprova ✓</button>'
      : q.mode === 'cmp' ? row([['&lt;', '&lt;', 'Més petita'], ['=', '=', 'Iguals'], ['>', '>', 'Més gran']], 3)
      : q.mode === 'same' ? row([['true', 'Sí'], ['false', 'No']], 2) : q.mode === 'dec' ? row(decOpts(q).map(v => [v, v]), 3) : '';
  }
  // the lily pads of the lane, one per question, and the frog on the one being asked
  function drawLane() {
    host.style.setProperty('--k', Math.min(k, qs.length - 1));
    host.querySelectorAll('.lp').forEach((e, i) => { e.className = 'lp ' + (st.marks[i] || ''); });
  }
  function drawCombo() {
    const e = $('#cb'); e.hidden = streak < 3; e.textContent = `Ratxa ×${streak}`;
    if (streak >= 3) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
  }

  // gets the next question ready
  function arm() {
    q = qs[k]; buf = ['', '']; slot = 0; lit = new Set(); pos = 0; from = undefined; cur = { n: q.n, d: q.d }; was = 0; shown = !q.hide; lab = false; help = 0; busy = false;
    openAt = k ? performance.now() + SETTLE : 0;
    drawLane(); drawField(); drawAsk(); drawCtl(); tip(tipFor(q)); o.chip?.(st);
    // on a phone the figure can be off screen after the last answer: bring the tip and the field back
    if ($('#tip').getBoundingClientRect().top < 0) $('#tip').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  // a hint or a wrong answer uncovers the figures; the second one also shows the answer on them
  function uncover(deep) {
    shown = true;
    if (deep) { lab = true; if (q.mode === 'cut' || q.mode === 'join') { const [a, b] = q.mode === 'cut' ? [q.n * q.k, q.d * q.k] : want(q); if (b !== cur.d) { was = cur.d; cur = { n: a, d: b }; } } }
    drawField(); was = 0;
  }
  // cutting every part in x, joining them x by x (x = 0 starts again): the figure changes, the answer is still typed
  function tool(x) {
    if (!x) { cur = { n: q.n, d: q.d }; tip(tipFor(q)); }
    else if (q.mode === 'cut') {
      if (cur.d * x > ROOM[q.shape]) { tip('Sortirien massa parts! Prem ↺ per tornar a començar.', 'oops'); return shake(field); }
      was = cur.d; cur = { n: cur.n * x, d: cur.d * x }; tone(880, 0, 0.12, 0.07);
      tip(cur.d === q.d * q.k ? `Ara hi ha ${cur.d} parts. Quantes n'hi ha de triades?` : tipFor(q));
    } else {
      if (cur.n % x || cur.d % x) { tip(`De ${x} en ${x} no surt just: ${cur.n % x ? cur.n : cur.d} no es pot repartir en grups de ${x}.`, 'oops'); return shake(field); }
      was = cur.d; cur = { n: cur.n / x, d: cur.d / x }; tone(523, 0, 0.16, 0.07);
      tip([2, 3, 5].some(y => cur.n % y === 0 && cur.d % y === 0) ? 'Encara es poden ajuntar més!' : `Ja no es pot ajuntar més: ${cur.d === 1 ? 'una sola part' : `${cur.d} parts`}. Escriu la fracció.`);
    }
    drawField(); was = 0;
  }

  async function submit(ans) {
    if (busy || over || !t.on || performance.now() < openAt) return;
    const ok = right(q, ans), last = k === qs.length - 1;
    if (!ok && !once) {   // try again, with what went wrong said and drawn
      buzz(); shake(typed() ? $('#ask') : field);
      st.slips++; help++; streak = 0; drawCombo(); o.chip?.(st); tip('Ui! ' + explain(q, help > 1, ans), 'oops'); uncover(help > 1);
      buf = ['', '']; slot = 0; drawAsk();
      return;
    }
    busy = true; st.marks[k] = ok ? 'ok' : 'bad';
    if (ok) { st.hits++; streak = help ? 0 : streak + 1; top = Math.max(top, streak); } else { st.missed.push(q); streak = 0; }
    if (last) o.onLast?.(st);
    drawLane(); drawCombo(); o.chip?.(st); uncover(true); drawAsk();
    if (!ok) {   // one try only: show the right answer, and in an exam wait for the child to go on
      buzz(); shake(typed() ? $('#ask') : field); tip('No. ' + explain(q, true), 'oops');
      if (how === 'rapid') { await sleep(1900); if (t.on && !over) next(); return; }
      ctl.innerHTML = '<button class="btn" id="go">Segueix</button>'; $('#go').focus({ preventScroll: true });
      return;
    }
    // the notes climb with the run
    { const f = 784 * 2 ** (Math.min(streak, 8) / 12); tone(f, 0, 0.14, 0.08); tone(f * 4 / 3, 0.1, 0.2, 0.08); }
    tip(streak && streak % 5 === 0 ? `${streak} seguides! ${said(q)}` : said(q), 'go');
    { const p = mid(field); FX.burst(p.x, p.y, 48, 22 + 4 * Math.min(streak, 8), 190); FX.ring(p.x, p.y, 48, 10, 90); if (streak && streak % 5 === 0) FX.celebrate(4); }
    await sleep(how === 'rapid' ? 700 : once ? 1100 : 1500); if (t.on && !over) next();
  }
  async function next() {
    k++;
    if (k < qs.length) { arm(); const f = $('#fg'); if (f) { f.classList.remove('hop'); void f.offsetWidth; f.classList.add('hop'); } return; }
    // the panel comes up where the last button was: wait until a second tap on that button has passed
    over = true; keyFn = null; ctl.innerHTML = ''; await sleep(SETTLE); if (t.on) o.onEnd(st);
  }

  keyFn = key => {
    if (over) return;
    if (busy) { if (key === 'ok') $('#go')?.click(); return; }
    const kind = kindOf(q);
    if (kind === 'check') { if (key === 'ok') $('#chk').click(); return; }
    if (kind === 'pick') return;
    if (key === 'ok') {
      if (!buf[slot]) return;
      if (kind === 'frac' && !(buf[0] && buf[1])) { slot = buf[0] ? 1 : 0; return drawAsk(); }
      return submit(kind === 'frac' ? [+buf[0], +buf[1]] : +buf[0]);
    }
    buf[slot] = key === 'del' ? buf[slot].slice(0, -1) : (buf[slot] + key).slice(0, 4);
    tone(key === 'del' ? 392 : 660, 0, 0.08, 0.05);
    // a box of a fraction is full when it has as many digits as its answer: the typing moves on to the other box, and with both full
    // the fraction is checked without ✓. A sum can be written in more than one way, so it always waits for ✓
    if (kind === 'frac' && key !== 'del' && q.mode !== 'add') {
      const w = want(q), full = i => buf[i].length >= String(w[i]).length;
      if (full(slot)) { if (full(1 - slot)) { drawAsk(); return submit([+buf[0], +buf[1]]); } slot = 1 - slot; }
    }
    drawAsk();
  };
  ctl.onclick = e => {
    if (e.target.closest('#go')) return next();
    if (busy || over) return;
    const key = e.target.closest('[data-k]'), opt = e.target.closest('[data-pick]');
    if (key) keyFn(key.dataset.k);
    else if (opt) submit(opt.dataset.pick);
    else if (e.target.closest('#chk')) submit(q.mode === 'paint' ? lit.size : pos);
  };
  field.onclick = e => {
    if (busy || over) return;
    const tl = e.target.closest('[data-t]'), opt = e.target.closest('[data-pick]'), part = e.target.closest('[data-i]');
    if (tl) return tool(+tl.dataset.t);
    if (opt) return submit(opt.dataset.pick);
    if (!part) return;
    const i = +part.dataset.i;
    if (q.mode === 'paint') {
      // a jug fills from the bottom up to the mark touched; anything else is chosen part by part
      if (q.shape === 'jug') lit = new Set(Array.from({ length: lit.size === i + 1 ? i : i + 1 }, (_, j) => j));
      else lit.has(i) ? lit.delete(i) : lit.add(i);
      tone(lit.has(i) ? 740 : 440, 0, 0.1, 0.06); drawField();
    }
    else if (q.mode === 'line' && q.ask === 'put') { from = pos; pos = i; tone(500 + 40 * i, 0, 0.1, 0.06); drawField(); }
  };
  $('#ask').onclick = e => { const b = e.target.closest('[data-slot]'); if (b && !busy) { slot = +b.dataset.slot; drawAsk(); } };
  // the fuse of a lightning round: when it burns out the board is over, whatever was going on
  if (o.secs) {
    const t0 = performance.now(), iv = setInterval(() => {
      const left = o.secs - (performance.now() - t0) / 1000;
      if (!t.on || over) return clearInterval(iv);
      $('#fuse').style.width = Math.max(0, left / o.secs * 100) + '%';
      if (left <= 0) { clearInterval(iv); over = true; keyFn = null; ctl.innerHTML = ''; field.inert = true; o.onEnd(st); }
    }, 100);
  }
  arm();
  return { hint() { if (busy || over) return; st.slips++; help++; streak = 0; drawCombo(); o.chip?.(st); tip(explain(q, help > 1)); uncover(help > 1); } };
}
// the end of a board comes up over its two halves
function curtain(html) {
  panel($('#split'), html);
  $('#split .panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
}
// the longest run goes in with whatever is being handed in: gives back the badges it earns
function run() { const r = streakIn(prog, top); prog = r.prog; return r.news; }

/* ---------- the Piscina: three first questions, the first thing a profile with nothing saved meets ---------- */
// The third one saves piscina and opens the map. There is no «← Mapa» here: the map would have every circle shut, so the way
// out is the page of all games.
function piscina() {
  const t = fresh(); show('La Piscina', true, 165); $('#toS').hidden = true; $('#toG').hidden = !HUB;
  let got = [];
  $('#game').innerHTML = '<div class="hud mid"><span class="chip">Tres reptes per entrar a l\'estany</span></div><div id="board"></div>';
  board({ t, qs: POOL, how: 'pool',
    onLast: () => { const was = badges(prog); prog = { ...prog, piscina: true }; got = BADGES.filter((_, j) => badges(prog)[j] && !was[j]).map(b => b.name); save(); },
    onEnd: () => {
      chime([523, 659, 784, 1047, 1319]); FX.celebrate(16);
      curtain(`<h2>Piscina acabada!</h2><p class="lead go">+50 XP · ja ets dins del cursus de les fraccions</p>${news(got)}
        <p class="lead">Al mapa hi ha cinc cercles. Valida els projectes d'un cercle i supera'n l'examen per obrir el següent.</p><button class="btn" id="nx">Obre el mapa</button>`);
      $('#nx').onclick = () => mapa();
    } });
}

/* ---------- one level of a project: five questions, with hints ---------- */
function level(sec, idx) {
  const c = circleOf(sec), P = PROJECTS[sec], L = P.levels[idx], t = fresh(); show(`Cercle ${c} · ${P.name}`, true, HUES[sec]); here = sec;
  const root = $('#game');
  let r;
  root.innerHTML = `${levelRow(P.levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.name}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div><div id="board"></div>`;
  // a level is marked done when it has a star
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.lv[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const B = board({ t, qs: L.qs, how: 'level', chip: st => { $('#st').textContent = starRow(starsFor(st.slips)); },
    // the level is handed in with its last answer: its stars go to the mark of the project, and the mark to the XP once the project is validated
    onLast: st => { const got = run(); r = levelIn(prog, sec, idx, st.slips); r.news = [...got, ...r.news]; prog = r.prog; save(); },
    onEnd: () => {
      const n = r.n, end = idx === 9;
      chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8);
      curtain(`<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
        <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
        ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
        ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
        <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
      $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
      if (n < 3) $('#ag').onclick = () => level(sec, idx);
    } });
  $('#hintb').onclick = B.hint;
}

/* ---------- the exam of a circle: six new questions of its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]);
  const qs = exam(c, Math.random);
  let r;
  $('#game').innerHTML = '<div class="hud"><span class="chip">Sis preguntes · un sol intent</span><span class="chip" id="st"></span></div><div id="board"></div>';
  board({ t, qs, how: 'exam', chip: st => { $('#st').textContent = `${st.hits} de ${qs.length}`; },
    onLast: st => { const got = run(), first = !prog.exams[c]; r = examIn(prog, c, qs, qs.map((_, i) => st.marks[i] === 'ok')); r.news = [...got, ...r.news]; r.first = r.good && first; prog = r.prog; save(); },
    onEnd: () => {
      r.good ? (chime([523, 659, 784, 1047, 1319]), FX.celebrate(16)) : tone(196, 0, 0.5, 0.12, 'triangle');
      curtain(`<h2>${r.good ? 'Examen superat!' : 'Encara no!'}</h2><p class="score">${r.score} de ${qs.length}</p>
        <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
        ${r.first ? `<p class="lead go">${c < CIRCLES.length - 1 ? `S'ha obert el cercle ${c + 1}: ${CIRCLES[c + 1].name}.` : 'Has acabat el cursus de les fraccions!'}</p>` : ''}
        ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
        <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
      $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
    } });
}

/* ---------- the lightning round: as many right answers as fit in a minute, one try each; only the record is kept ---------- */
function llampec() {
  const t = fresh(); show('Repte llampec', true, 48);
  $('#game').innerHTML = `<div class="intro"><h2>Repte llampec</h2><p class="lead">${RAPID} segons. Preguntes dels projectes que ja has validat, un sol intent per a cada una. Quantes n'encertaràs?</p>
    ${prog.rapid ? `<p class="lead sun">El teu rècord: ${prog.rapid}</p>` : ''}<button class="btn" id="go">Comença!</button></div>`;
  $('#go').focus({ preventScroll: true });
  $('#go').onclick = () => {
    if (!t.on) return;
    $('#game').innerHTML = '<div class="hud"><span class="chip">Repte llampec</span><span class="chip" id="st"></span></div><div id="board"></div>';
    board({ t, qs: sprint(prog, Math.random), how: 'rapid', secs: RAPID, chip: st => { $('#st').textContent = `${st.hits} ${st.hits === 1 ? 'encert' : 'encerts'}`; },
      onEnd: st => {
        const got = run(), r = rapidIn(prog, st.hits); prog = r.prog; save();
        chime([523, 659, 784, 1047, 1319]); if (r.best) FX.celebrate(16);
        curtain(`<h2>Temps!</h2><p class="score">${st.hits} ${st.hits === 1 ? 'encert' : 'encerts'}</p><p class="lead${r.best ? ' go' : ''}">${r.best ? 'Rècord nou!' : `El teu rècord: ${prog.rapid}`}</p>${news([...got, ...r.news])}
          <button class="btn" id="rp">Torna-hi</button><button class="link" id="bk">Torna al mapa</button>`);
        $('#bk').onclick = () => mapa(); $('#rp').onclick = () => llampec();
      } });
  };
}

/* ---------- «Caça l'errada»: three things a sheet says, one after the other; from none to two of them are wrong ---------- */
// What each kind of claim draws, what it says, how one of its values is written and what was true
const CLAIMS = {
  name: C => ({ pic: fig(C.shape, C.d, i => i < C.n, {}), txt: `La part ${C.shape === 'pizza' ? 'amb pepperoni' : 'de xocolata blanca'} és <b>${fr(C.says)}</b>`, val: fr, truth: `és ${C.real}` }),
  equiv: C => ({ pic: '', txt: `${F(C.a, C.b)} val el mateix que <b>${fr(C.says)}</b>`, val: fr, truth: `${C.a}/${C.b} = ${C.real}` }),
  cmp: C => ({ pic: '', txt: `${F(C.a, C.b)} <b>és més ${C.says === '<' ? 'petita' : 'gran'} que</b> ${F(C.c, C.d)}`, val: v => v === '<' ? 'És més petita' : v === '>' ? 'És més gran' : 'Són iguals', truth: `${C.a}/${C.b} ${C.real} ${C.c}/${C.d}` }),
  add: C => ({ pic: '', txt: `${F(C.a, C.d)} + ${F(C.c, C.d)} = <b>${fr(C.says)}</b>`, val: fr, truth: `${C.a}/${C.d} + ${C.c}/${C.d} = ${C.real}` }),
  of: C => ({ pic: ofHtml({ ...C, unit: '€' }, 0), txt: `${F(C.n, C.d)} de ${C.T} € són <b>${C.says} €</b>.`, val: v => `${v} €`, truth: `són ${C.real} €` })
};
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the value that makes it true,
// with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), marks = [];
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="Tres fulls">${'<i></i>'.repeat(cs.length)}</span></div>
    <div class="coach" id="coach"><svg class="frog" viewBox="-34 -40 68 58" aria-hidden="true">${FROG}</svg><p class="status tip" id="tip" role="status" aria-live="polite"></p></div>
    <div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const stage = $('#stage'), tail = $('#tail'), dots = [...$('#dots').children];
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').textContent = txt; const c = $('#coach'); c.className = 'coach'; void c.offsetWidth; c.className = 'coach ' + cls; };
  let k = -1, C, D, busy, openAt = 0, res = null;
  function arm() {
    k++; C = cs[k]; D = CLAIMS[C.kind](C); busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="sheet">${D.pic}<p class="ask claim">${D.txt}</p></div>`;
    tail.innerHTML = '<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>';
    say('Mira-ho bé: és veritat, el que diu el full?');
  }
  async function answer(ok, txt) {
    const last = k === cs.length - 1;
    busy = true; marks[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, marks); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(txt, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { say(txt, 'oops'); buzz(); }
    await sleep(ok ? 1200 : 2600); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`el ${i + 1} (${CLAIMS[c.kind](c).truth})`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? chime([523, 659, 784, 1047, 1319]) : tone(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar els tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Tots tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre full</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era: ${D.truth}.` : 'Sí, era correcte!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: ${D.truth}.`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="opts">${C.opts.map(v => `<button class="btn soft" data-v="${v}">${D.val(v)}</button>`).join('')}</div>`;
      say('Ben vist! Ara tria el valor bo.', 'go');
    }
    else if ('v' in b.dataset) { const ok = b.dataset.v === C.real; answer(ok, ok ? `Arreglat: ${D.truth}.` : `No era aquest: ${D.truth}.`); }
  };
  arm();
}

soBtn(); paintXp();
prog.piscina ? mapa() : piscina();
