import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { sectionMenu, levelRow, wireLevels, panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { SECTIONS, want, right, gen, PASS, starsFor, testStars, cuts, tipFor, explain } from './logic.js';

const KEY = 'nenufars-a-trossos';

// secs counts the screens done in each section (10: its test is passed); stars keeps the best of each screen
let prog = { so: true, secs: SECTIONS.map(() => 0), stars: SECTIONS.flatMap(() => Array(10).fill(0)) };
{
  const d = load(KEY);
  if (d) prog = { so: d.so !== false,
    secs: prog.secs.map((_, i) => Math.min(10, Math.max(0, (Array.isArray(d.secs) && d.secs[i]) | 0))),
    stars: prog.stars.map((_, i) => Math.min(3, Math.max(0, (Array.isArray(d.stars) && d.stars[i]) | 0))) };
}
const save = () => store(KEY, prog);

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);

/* ---------- figures ---------- */
const FROG = `<ellipse cx="0" cy="6" rx="30" ry="10" fill="#2F7F40"/><ellipse cx="0" cy="-12" rx="21" ry="16" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/><circle cx="-10" cy="-27" r="8" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="10" cy="-27" r="8" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="-10" cy="-27" r="3.2" fill="#0F3A40"/><circle cx="10" cy="-27" r="3.2" fill="#0F3A40"/><path d="M-8 -8 Q0 -2 8 -8" fill="none" stroke="#2F7F40" stroke-width="2.5" stroke-linecap="round"/>`;
// parts of different sizes, for the figures that are not cut in equal parts
const UNEVEN = [[1.7, 0.6, 1.2, 0.5, 1.5, 0.8, 1.3, 0.6], [0.5, 1.5, 0.7, 1.6, 0.9, 1.4, 0.6, 1.3]];
// Where the D parts of a figure start, as shares of the whole, and the cuts to draw over them. o.w gives parts of different sizes;
// o.was animates the last cut or join (see cuts in logic.js). The lit area itself never moves.
function layout(D, o) {
  if (!o.w) return { edge: Array.from({ length: D }, (_, i) => i / D), lines: cuts(D, o.was || D) };
  const sum = o.w.reduce((s, x) => s + x, 0), edge = [];
  let t = 0;
  for (const x of o.w) { edge.push(t); t += x / sum; }
  return { edge, lines: edge.map(e => [e, '']) };
}
const cls = (kind, o) => `fig ${kind}${o.tap ? ' tap' : ''}${o.plain ? ' plain' : ''}`;
// a lily pad from above: part 0 starts at twelve o'clock and they go round clockwise
function padSvg(D, on, o = {}) {
  const R = 50, xy = t => `${(R * Math.sin(t * 6.2832)).toFixed(2)} ${(-R * Math.cos(t * 6.2832)).toFixed(2)}`, { edge, lines } = layout(D, o);
  const parts = D === 1 ? `<circle r="${R}" class="pt${on(0) ? ' on' : ''}" data-i="0"/>` : edge.map((t, i) => { const t1 = edge[i + 1] ?? 1;
    return `<path class="pt${on(i) ? ' on' : ''}" data-i="${i}" d="M0 0L${xy(t)}A${R} ${R} 0 ${t1 - t > 0.5 ? 1 : 0} 1 ${xy(t1)}Z"/>`; }).join('');
  return `<svg class="${cls('round', o)}" viewBox="-50 -50 100 100" aria-hidden="true">${parts}${lines.map(([t, c]) => `<path class="ct ${c}" d="M0 0L${xy(t)}"/>`).join('')}</svg>`;
}
// a walkway of planks, part 0 on the left
function barSvg(D, on, o = {}) {
  const { edge, lines } = layout(D, o);
  const parts = edge.map((t, i) => `<rect class="pt${on(i) ? ' on' : ''}" data-i="${i}" x="${(t * 240).toFixed(2)}" y="0" width="${(((edge[i + 1] ?? 1) - t) * 240 + 0.3).toFixed(2)}" height="44"/>`).join('');
  return `<svg class="${cls('plank', o)}" viewBox="0 0 240 44" aria-hidden="true">${parts}${lines.filter(c => c[0] > 0).map(([t, c]) => `<path class="ct ${c}" d="M${(t * 240).toFixed(2)} 0V44"/>`).join('')}</svg>`;
}
// a group of fireflies, some of them lit
function setHtml(D, on, o = {}) {
  const tag = o.tap ? 'button' : 'i';
  return `<div class="bugs${o.tap ? ' tap' : ''}" style="--bc:${D > 6 ? Math.ceil(D / 2) : D}">${Array.from({ length: D }, (_, i) => `<${tag} class="bug${on(i) ? ' on' : ''}" data-i="${i}"${o.tap ? ` aria-label="Cuca ${i + 1}"` : ''}></${tag}>`).join('')}</div>`;
}
const fig = (shape, D, on, o) => (shape === 'pad' ? padSvg : shape === 'set' ? setHtml : barSvg)(D, on, o);
// the line from 0 to 1 cut in d jumps, the frog on mark `pos`; o.lab writes the fraction under every mark
function lineSvg(d, pos, o = {}) {
  const X = i => 28 + i / d * 264, w = 264 / d;
  let s = `<svg class="fig nl${o.tap ? ' tap' : ''}" viewBox="0 0 320 104" aria-hidden="true"><path class="ax" d="M28 62H292"/><path class="gold" d="M28 62H${X(pos)}"/>`;
  for (let i = 0; i <= d; i++) {
    s += `<path class="tk" d="M${X(i)} ${i % d ? 55 : 51}V${i % d ? 69 : 73}"/>`;
    if (i % d === 0) s += `<text x="${X(i)}" y="92">${i / d}</text>`;
    else if (o.lab) s += `<text class="sm" x="${X(i)}" y="${d > 6 && i % 2 ? 94 : 83}">${i}/${d}</text>`;
  }
  s += `<g transform="translate(${X(pos)} 55) scale(0.44)">${FROG}</g>`;
  if (o.tap) for (let i = 0; i <= d; i++) s += `<rect class="hit" data-i="${i}" x="${X(i) - w / 2}" y="0" width="${w}" height="104"/>`;
  return s + '</svg>';
}

/* ---------- screens ---------- */
const KEYS = `<div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k =>
  `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quin salt!', 'Així es fa!'];
const HUES = [140, 165, 195, 262, 318, 28, 48, 210];
// how a test names what went wrong
const MODE = { equal: 'les parts iguals', paint: 'pintar fraccions', name: 'escriure fraccions', line: 'la recta', cmp: 'comparar', cut: 'tallar més fi', fill: 'el número que falta', join: 'simplificar', same: 'les equivalents' };
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const F = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
// the answer is typed as a fraction, typed as one number, built on the figure and checked, or picked with one touch
const kindOf = q => q.mode === 'name' || q.mode === 'join' || (q.mode === 'line' && q.ask === 'read') ? 'frac' : q.mode === 'cut' || q.mode === 'fill' ? 'num' : q.mode === 'paint' || q.mode === 'line' ? 'check' : 'pick';
// the most parts each figure can show
const roomFor = shape => shape === 'pad' ? 12 : 20;
// after a new question comes up, touches are ignored for this long: a second tap on the button that was there must not answer it
const SETTLE = 450;

// what to say after a right answer
function said(q) {
  const { n, d } = q;
  switch (q.mode) {
    case 'equal': return `Sí! ${d} trossos igual de grans.`;
    case 'paint': return `${n}/${d}: ${n} de ${d}. ${pick(HURRAY)}`;
    case 'name': return `${n}/${d}. ${pick(HURRAY)}`;
    case 'line': return n === d ? `${n}/${d} és 1: tot el camí!` : n === 0 ? `0/${d} és 0: encara no ha saltat.` : `${n}/${d}. ${pick(HURRAY)}`;
    case 'cmp': return `${q.a}/${q.b} ${want(q)} ${q.c}/${d}. ${pick(HURRAY)}`;
    case 'same': return want(q) ? `Sí: ${q.a}/${q.b} = ${q.c}/${d}.` : `Exacte: ${q.a}/${q.b} i ${q.c}/${d} no valen el mateix.`;
    case 'cut': return `${n}/${d} = ${n * q.k}/${d * q.k}: la mateixa part, amb trossos més petits.`;
    case 'fill': return `${n}/${d} = ${q.N}/${q.D}. ${pick(HURRAY)}`;
    default: { const [a, b] = want(q); return `${n}/${d} = ${a}/${b}: la mateixa part, amb menys trossos.`; }
  }
}

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /nenufars-a-trossos\.html$/.test(location.pathname);
function show(kicker, playing) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
}
$('#toS').onclick = () => seccions();
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

function seccions() {
  fresh(); keyFn = null; show('Fraccions', false); FX.mood(HUES[0]);
  const stars = i => prog.stars.slice(i * 10, i * 10 + 10).reduce((x, y) => x + y, 0);
  sectionMenu($('#game'), 'Tria una secció. Cada una té nou pantalles i una prova per obrir la següent.', SECTIONS, prog.secs, level,
    i => (prog.secs[i] === 9 ? ' · prova' : '') + (stars(i) ? ` · ★ ${stars(i)}` : ''));
}

/* ---------- one screen: a lesson of five questions, or the test of the section ---------- */
function level(sec, idx) {
  const S = SECTIONS[sec], test = idx === 9, t = fresh();
  show(`Secció ${sec + 1} · ${S.name}`, true); FX.mood(HUES[sec]);
  const root = $('#game'), qs = test ? gen(sec) : S.levels[idx].qs, marks = [], missed = [];
  // the state of the question being asked: what is typed (buf, and the slot being typed in), what is lit, where the frog is,
  // the fraction a cut or joined figure shows now (and how many parts it had just before), and what the hints have uncovered
  let k = 0, q, slips = 0, hits = 0, help = 0, busy = false, openAt = 0, buf, slot, lit, pos, cur, was, shown, lab;

  root.innerHTML = `<div class="hud"><span class="chip">${test ? `Prova · ${S.name}` : `Pantalla ${idx + 1} · ${S.levels[idx].name}`}</span><span class="chip" id="st"></span></div>
    ${levelRow(Array.from({ length: 10 }), prog.secs[sec], idx)}
    <div class="lane" id="lane" style="--n:${qs.length};--k:0" aria-hidden="true">${qs.map(() => '<i class="lp"></i>').join('')}<span class="fg" id="fg"><svg viewBox="-34 -40 68 58">${FROG}</svg></span></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <div class="split" id="split"><div class="field" id="field"></div><div class="desk"><div class="askrow"><p class="ask" id="ask"></p>${test ? '' : '<button class="btn soft" id="hintb">Pista</button>'}</div><div id="ctl"></div></div></div>`;
  const field = $('#field'), lane = $('#lane'), ctl = $('#ctl');
  // the tenth button of the row is the test
  { const ex = $('.levels [data-n="9"]', root); ex.textContent = 'Prova'; ex.classList.add('exam'); if (ex.disabled) ex.title = 'Supera totes les pantalles'; }
  wireLevels(root, n => level(sec, n));
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };
  const chip = () => { $('#st').textContent = test ? `${hits} de ${qs.length}` : starRow(starsFor(slips)); };

  // two walkways one under the other, each with its fraction; too many planks cannot be drawn
  const pair = (a, b, c, d, la, lc) => b > 24 || d > 24 ? '<p class="think">Massa trossos per dibuixar-los: pensa-hi amb la regla!</p>'
    : `<div class="row"><span class="lbl">${la}</span>${barSvg(b, i => i < a)}</div><div class="row"><span class="lbl">${lc}</span>${barSvg(d, i => i < c)}</div>`;
  function drawField() {
    const hidden = '<p class="think">Sense dibuix!</p>';
    let h;
    switch (q.mode) {
      // once the answer has been told (lab), the right figure is marked
      case 'equal': h = `<div class="trio${q.shape === 'bar' ? ' tall' : ''}">${[0, 1, 2].map(i => `<button class="opt${lab && i === q.at ? ' good' : ''}" data-pick="${i}" aria-label="Figura ${i + 1}">${fig(q.shape, q.d, () => false, { plain: true, w: i === q.at ? null : UNEVEN[i < q.at ? i : i - 1].slice(0, q.d) })}</button>`).join('')}</div>`; break;
      case 'paint': h = fig(q.shape, q.d, i => lit.has(i), { tap: !busy }); break;
      case 'name': h = fig(q.shape, q.d, i => i < q.n, {}); break;
      case 'line': h = lineSvg(q.d, q.ask === 'put' ? pos : q.n, { tap: q.ask === 'put' && !busy, lab }); break;
      case 'cmp': case 'same': h = shown ? pair(q.a, q.b, q.c, q.d, `${q.a}/${q.b}`, `${q.c}/${q.d}`) : hidden; break;
      case 'fill': h = shown ? pair(q.n, q.d, q.N, q.D, `${q.n}/${q.d}`, q.miss === 'N' ? `?/${q.D}` : `${q.N}/?`) : hidden; break;
      default: {
        if (!shown) { h = hidden; break; }
        if (q.d > roomFor(q.shape)) { h = '<p class="think">Massa trossos per dibuixar-los: pensa-hi amb la regla!</p>'; break; }
        const cut = q.mode === 'cut', goal = cut ? q.d * q.k : 0;
        h = fig(q.shape, cur.d, i => i < cur.n, { was }) + `<p class="cap${cur.d === goal ? ' ok' : ''}">${cur.d === 1 ? 'Un sol tros' : `${cur.d} trossos`}${cut && cur.d > goal ? ': massa! Prem ↺' : ''}</p>`
          + `<div class="tools">${[2, 3, 5].map(x => `<button class="tool" data-t="${x}">${cut ? `✂ en ${x}` : `De ${x} en ${x}`}</button>`).join('')}<button class="tool" data-t="0" aria-label="Torna a començar">↺</button></div>`;
      }
    }
    field.innerHTML = h;
  }
  function drawAsk() {
    const box = i => `<output class="in${slot === i && !busy ? ' cur' : ''}" data-slot="${i}" aria-label="${i ? 'Denominador' : 'Numerador'}">${buf[i]}</output>`;
    $('#ask').innerHTML = { equal: `${q.d} parts iguals?`, paint: `Pinta ${F(q.n, q.d)}`, name: F(box(0), box(1)),
      line: q.ask === 'put' ? `Granota a ${F(q.n, q.d)}` : F(box(0), box(1)),
      cmp: `${F(q.a, q.b)} <i>?</i> ${F(q.c, q.d)}`, same: `${F(q.a, q.b)} = ${F(q.c, q.d)} <i>?</i>`,
      cut: `${F(q.n, q.d)} = ${F(box(0), q.d * (q.k || 1))}`, fill: `${F(q.n, q.d)} = ${F(q.miss === 'N' ? box(0) : q.N, q.miss === 'D' ? box(0) : q.D)}`,
      join: `${F(q.n, q.d)} = ${F(box(0), box(1))}` }[q.mode];
  }
  function drawCtl() {
    const kind = kindOf(q);
    ctl.innerHTML = kind === 'frac' || kind === 'num' ? KEYS : kind === 'check' ? '<button class="btn" id="chk">Comprova ✓</button>'
      : q.mode === 'cmp' ? `<div class="choices" style="--c:3">${['<', '=', '>'].map(s => `<button class="key" data-pick="${s === '<' ? '&lt;' : s}" aria-label="${s === '<' ? 'Més petita' : s === '=' ? 'Iguals' : 'Més gran'}">${s === '<' ? '&lt;' : s}</button>`).join('')}</div>`
      : q.mode === 'same' ? '<div class="choices" style="--c:2"><button class="key" data-pick="true">Sí</button><button class="key" data-pick="false">No</button></div>' : '';
  }
  function drawLane() {
    lane.style.setProperty('--k', Math.min(k, qs.length - 1));
    lane.querySelectorAll('.lp').forEach((e, i) => { e.className = 'lp ' + (marks[i] || ''); });
  }

  // gets the next question ready
  function arm() {
    q = qs[k]; buf = ['', '']; slot = 0; lit = new Set(); pos = 0; cur = { n: q.n, d: q.d }; was = 0; shown = !q.hide; lab = false; help = 0; busy = false;
    openAt = k ? performance.now() + SETTLE : 0;
    drawLane(); drawField(); drawAsk(); drawCtl(); tip(tipFor(q)); chip();
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
      if (cur.d * x > roomFor(q.shape)) { tip('Sortirien massa trossos! Prem ↺ per tornar a començar.', 'oops'); return shake(field); }
      was = cur.d; cur = { n: cur.n * x, d: cur.d * x }; tone(880, 0, 0.12, 0.07);
      tip(cur.d === q.d * q.k ? `Ara hi ha ${cur.d} trossos. Quants n'hi ha de pintats?` : tipFor(q));
    } else {
      if (cur.n % x || cur.d % x) { tip(`De ${x} en ${x} no surt just: ${cur.n % x ? cur.n : cur.d} no es pot repartir en grups de ${x}.`, 'oops'); return shake(field); }
      was = cur.d; cur = { n: cur.n / x, d: cur.d / x }; tone(523, 0, 0.16, 0.07);
      tip([2, 3, 5].some(y => cur.n % y === 0 && cur.d % y === 0) ? 'Encara es poden ajuntar més!' : `Ja no es pot ajuntar més: ${cur.d === 1 ? 'un sol tros' : `${cur.d} trossos`}. Escriu la fracció.`);
    }
    drawField(); was = 0;
  }

  // The screen is decided with its last answer, and what was won is saved there and then: leaving during the pause that follows loses nothing.
  function settle() {
    if (k < qs.length - 1) return;
    const i = sec * 10 + idx, n = test ? testStars(hits) : starsFor(slips);
    if (test && hits < PASS) return;
    prog.secs[sec] = Math.max(prog.secs[sec], idx + 1); prog.stars[i] = Math.max(prog.stars[i], n); save();
  }
  async function submit(ans) {
    if (busy || performance.now() < openAt) return;
    if (!right(q, ans)) {
      tone(150, 0, 0.45, 0.16, 'triangle'); shake(kindOf(q) === 'frac' || kindOf(q) === 'num' ? $('#ask') : field);
      if (test) {   // one try only: show the right answer and wait for the child to go on
        busy = true; marks[k] = 'bad'; missed.push(q); settle(); drawLane(); tip('No. ' + explain(q, true), 'oops'); uncover(true); drawAsk();
        ctl.innerHTML = '<button class="btn" id="go">Segueix</button>'; $('#go').focus({ preventScroll: true });
        return;
      }
      slips++; help++; chip(); tip('Ui! ' + explain(q, help > 1, ans), 'oops'); uncover(help > 1);
      buf = ['', '']; slot = 0; drawAsk();
      return;
    }
    busy = true; hits++; marks[k] = 'ok'; settle(); drawLane(); chip(); tone(784, 0, 0.14, 0.08); tone(1047, 0.1, 0.2, 0.08);
    if (q.hide || q.mode === 'paint' || q.mode === 'line') uncover(false);
    drawAsk(); tip(said(q), 'go');
    { const p = mid(field); FX.burst(p.x, p.y, 48, 22, 190); FX.ring(p.x, p.y, 48, 10, 90); }
    await sleep(test ? 1100 : 1500); if (t.on) next();
  }
  async function next() {
    k++;
    if (k < qs.length) { arm(); const f = $('#fg'); f.classList.remove('hop'); void f.offsetWidth; f.classList.add('hop'); return; }
    // the panel comes up where the last button was: wait until a second tap on that button has passed
    keyFn = null; ctl.innerHTML = ''; await sleep(SETTLE); if (!t.on) return;
    test ? result() : win();
    $('.panel', root).scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
  }
  // the end of a lesson
  function win() {
    const n = starsFor(slips);
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(6);
    panel($('#split'), `<h2>${pick(HURRAY)}</h2><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead">${idx === 8 ? 'Has acabat les nou pantalles. Ara, la prova: sis preguntes sense pistes.' : n === 3 ? 'Ni un sol error!' : 'Si hi tornes sense errors ni pistes, tindràs les tres estrelles.'}</p>
      <button class="btn" id="nx">${idx === 8 ? 'Fes la prova' : 'Pantalla següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    $('#nx').onclick = () => level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }
  // the end of a test: passed, and the next section opens, or what to go over before trying again
  function result() {
    const last = sec === SECTIONS.length - 1, score = `<p class="score">${hits} de ${qs.length}</p>`;
    if (hits >= PASS) {
      const n = testStars(hits);
      chime([523, 659, 784, 1047, 1319]); FX.celebrate(16);
      panel($('#split'), `<h2>${last ? 'Missió complerta!' : 'Prova superada!'}</h2>${score}<p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
        <p class="lead">${last ? 'Ja saps trobar fraccions equivalents, simplificar-les i comparar-les.' : `Has obert la secció ${sec + 2}: ${SECTIONS[sec + 1].name}.`}</p>
        <button class="btn" id="nx">${last ? 'Torna a les seccions' : 'Secció següent'}</button>`);
      $('#nx').onclick = () => last ? seccions() : level(sec + 1, 0);
      return;
    }
    // one screen to go over for each kind of question that went wrong: the first lesson that teaches it
    const back = [...new Set(missed.map(m => m.mode))].map(m => [m, Math.max(0, S.levels.findIndex(l => l.qs.some(x => x.mode === m)))]);
    tone(196, 0, 0.5, 0.12, 'triangle');
    panel($('#split'), `<h2>Encara no!</h2>${score}<p class="lead">Per passar la prova cal encertar-ne ${PASS}. Repassa ${back.map(([m, i]) => `${MODE[m]} (pantalla ${i + 1})`).join(' i ')} i torna-hi: les preguntes seran noves.</p>
      <button class="btn" id="nx">Repassa la pantalla ${back[0][1] + 1}</button><button class="link" id="ag">Torna a fer la prova</button>`);
    $('#nx').onclick = () => level(sec, back[0][1]);
    $('#ag').onclick = () => level(sec, 9);
  }

  keyFn = key => {
    if (busy) { if (key === 'ok') $('#go')?.click(); return; }
    const kind = kindOf(q);
    if (kind === 'check') { if (key === 'ok') $('#chk').click(); return; }
    if (kind === 'pick') return;
    if (key === 'ok') {
      if (!buf[slot]) return;
      if (kind === 'frac' && !(buf[0] && buf[1])) { slot = buf[0] ? 1 : 0; return drawAsk(); }
      return submit(kind === 'frac' ? [+buf[0], +buf[1]] : +buf[0]);
    }
    buf[slot] = key === 'del' ? buf[slot].slice(0, -1) : (buf[slot] + key).slice(0, 3);
    tone(key === 'del' ? 392 : 660, 0, 0.08, 0.05);
    // a box of a fraction is full when it has as many digits as its answer: the typing moves on to the other box,
    // and with both full the fraction is checked without ✓
    if (kind === 'frac' && key !== 'del') {
      const w = want(q), full = i => buf[i].length >= String(w[i]).length;
      if (full(slot)) { if (full(1 - slot)) { drawAsk(); return submit([+buf[0], +buf[1]]); } slot = 1 - slot; }
    }
    drawAsk();
  };
  ctl.onclick = e => {
    if (e.target.closest('#go')) return next();
    if (busy) return;
    const key = e.target.closest('[data-k]'), opt = e.target.closest('[data-pick]');
    if (key) keyFn(key.dataset.k);
    else if (opt) submit(opt.dataset.pick);
    else if (e.target.closest('#chk')) submit(q.mode === 'paint' ? lit.size : pos);
  };
  field.onclick = e => {
    if (busy) return;
    const tl = e.target.closest('[data-t]'), opt = e.target.closest('[data-pick]'), part = e.target.closest('[data-i]');
    if (tl) return tool(+tl.dataset.t);
    if (opt) return submit(opt.dataset.pick);
    if (!part) return;
    const i = +part.dataset.i;
    if (q.mode === 'paint') { lit.has(i) ? lit.delete(i) : lit.add(i); tone(lit.has(i) ? 740 : 440, 0, 0.1, 0.06); drawField(); }
    else if (q.mode === 'line' && q.ask === 'put') { pos = i; tone(500 + 40 * i, 0, 0.1, 0.06); drawField(); }
  };
  $('#ask').onclick = e => { const b = e.target.closest('[data-slot]'); if (b && !busy) { slot = +b.dataset.slot; drawAsk(); } };
  if (!test) $('#hintb').onclick = () => { if (busy) return; slips++; help++; chip(); tip(explain(q, help > 1)); uncover(help > 1); };
  arm();
}

soBtn();
seccions();
