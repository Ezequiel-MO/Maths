import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { levelRow, wireLevels, panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, RAPID, PLACES, digitsOf, zerosOf, pieces, bands, plan, starsFor, wantQ,
  clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, poolIn, streakIn, rapidIn, exam, examIn, sprint, sheet, sheetIn } from './logic.js';

const KEY = 'coet-multiplicador';
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
// the notes climb with the run
const ding = () => { const f = 660 * 2 ** (Math.min(streak, 12) / 12); tone(f, 0, 0.14, 0.08); tone(f * 4 / 3, 0.09, 0.18, 0.07); };

/* ---------- figures ---------- */
const ROCKET = `<svg viewBox="0 0 64 64" aria-hidden="true"><g class="flame"><path d="M24 47 Q32 72 40 47Z" fill="#FF8A3C"/><path d="M27.500 47 Q32 62 36.500 47Z" fill="#FFE08A"/></g><path d="M22 37 L10 53 L24 47Z M42 37 L54 53 L40 47Z" fill="#FF5C8A" stroke="#0A2A3A" stroke-width="1.5" stroke-linejoin="round"/><path d="M32 3 C45 14 46 34 42 48 H22 C18 34 19 14 32 3Z" fill="#F3FBF8" stroke="#0A2A3A" stroke-width="2"/><path d="M36.500 21 C40 30 39.500 40 38.500 47 H41.500 C44.500 37 44.500 28 42.500 21Z" fill="#B9CFD6"/><path d="M32 3 C37.500 7.500 40.800 13 42.600 19.500 H21.400 C23.200 13 26.500 7.500 32 3Z" fill="#FF5C8A" stroke="#0A2A3A" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="30" r="6" fill="#6FE3FF" stroke="#0A2A3A" stroke-width="2"/><path d="M28.500 29 A3.800 3.800 0 0 1 31.500 26.300" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><rect x="23" y="44" width="18" height="4.500" rx="1.800" fill="#B79CFF" stroke="#0A2A3A" stroke-width="1.5"/></svg>`;
// the colour of each place: units, tens, hundreds, thousands, ten thousands. A strip of the field, a band of lines and a row of the sheet share it
const PH = [190, 318, 262, 48, 150];
const fx1 = n => +n.toFixed(1);
// a × b in lines, the Japanese way: one group of lines per digit, those of a falling to the right and those of b rising, so that the
// crossings of the same place fall one over the other in a band. A zero is a dashed line that crosses nothing. bare leaves out the
// numbers and the bands: only the lines and their points
const K = 0.7071, GAP = 70, STEP = 10, OUT = 36;
function linesSvg(a, b, bare) {
  const As = [...String(a)].map(Number), Bs = [...String(b)].map(Number), nA = As.length, nB = Bs.length, pts = [];
  const at = (u, v) => { const p = [fx1((u + v) * K), fx1((v - u) * K)]; pts.push(p); return p; };
  const offs = n => Array.from({ length: n || 1 }, (_, k) => (k - ((n || 1) - 1) / 2) * STEP);
  const u1 = (nA - 1) * GAP + OUT, v1 = (nB - 1) * GAP + OUT;
  let n = 0, lines = '', dots = '', labs = '';
  const seg = (p, q, cls) => `<path class="jl ${cls}" style="--i:${n++}" pathLength="1" d="M${p}L${q}"/>`;
  const lab = (p, txt, cls) => bare ? '' : `<text class="jn ${cls}" x="${p[0]}" y="${p[1] + 6}">${txt}</text>`;
  As.forEach((x, i) => { offs(x).forEach(o => { lines += seg(at(i * GAP + o, -OUT), at(i * GAP + o, v1), 'la' + (x ? '' : ' zero')); }); labs += lab(at(i * GAP, -OUT - 14), x, 'la'); });
  Bs.forEach((d, j) => { offs(d).forEach(o => { lines += seg(at(-OUT, j * GAP + o), at(u1, j * GAP + o), 'lb' + (d ? '' : ' zero')); }); labs += lab(at(-OUT - 14, j * GAP), d, 'lb'); });
  As.forEach((x, i) => Bs.forEach((d, j) => {
    if (!x || !d) return;
    const p = nA + nB - 2 - i - j, c = at(i * GAP, j * GAP), ext = (x + d - 2) * STEP * K / 2;
    dots += `<g class="cl" data-p="${nA - 1 - i},${nB - 1 - j}" style="--h:${PH[p]}">${offs(x).flatMap(o => offs(d).map(w => { const q = at(i * GAP + o, j * GAP + w); return `<circle cx="${q[0]}" cy="${q[1]}" r="3.800"/>`; })).join('')}<text x="${c[0]}" y="${fx1(c[1] - ext - 9)}"></text></g>`;
  }));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs) - 14, y0 = Math.min(...ys) - 14, x1 = Math.max(...xs) + 14, y1 = Math.max(...ys) + 14, bw = fx1(GAP * K);
  const strips = bare ? '' : Array.from({ length: nA + nB - 1 }, (_, s) => { const p = nA + nB - 2 - s, x = fx1(s * GAP * K);
    return `<g class="bd" data-b="${p}" style="--h:${PH[p]}"><rect x="${fx1(x - bw / 2 + 2)}" y="${y0 + 2}" width="${bw - 4}" height="${fx1(y1 - y0 + 34)}" rx="12"/><text class="bt" x="${x}" y="${fx1(y1 + 12)}"></text><text class="bl" x="${x}" y="${fx1(y1 + 30)}">${['U', 'D', 'C', 'M', 'DM'][p]}</text></g>`; }).join('');
  return `<svg class="jp" viewBox="${fx1(x0)} ${fx1(y0)} ${fx1(x1 - x0)} ${fx1(y1 - y0 + (bare ? 0 : 40))}" style="--n:${n}" role="img" aria-label="${bare ? 'Una multiplicació dibuixada amb ratlles' : `${a} × ${b} dibuixat amb ratlles`}">${strips}${lines}${dots}${labs}</svg>`;
}
// The rows of the written operation, from the top: [id, class, sign] or 'ln' for a line. sc and mc are the small rows of what is carried
function rowsOf(mode, a, b) {
  const B = digitsOf(b);
  if (mode === 'pieces') { const ps = pieces(a, b); return [['sc', 'cy'], ...ps.map((p, i) => ['p' + i, 'c' + p.bi, i === ps.length - 1 ? '+' : '']), 'ln', ['sum']]; }
  if (mode === 'lines') { const on = bands(a, b).flatMap((t, p) => t ? [p] : []); return [['sc', 'cy'], ...on.map((p, i) => ['t' + p, 'c' + p, i === on.length - 1 && i ? '+' : '']), 'ln', ['sum']]; }
  return [['mc', 'cy'], ['a'], ['b', '', '×'], 'ln', ...(B.length > 1 ? [['sc', 'cy'], ...B.map((_, bi) => ['r' + bi, 'c' + bi, bi === B.length - 1 ? '+' : '']), 'ln', ['sum']] : [['r0', 'c0']])];
}
// the sheet: W columns of digits after one for the sign; cells is what is written, by 'row:column', and marks the class of the cells that glow or shake
const sheetHtml = (rows, W, cells, marks = {}) => rows.map(r => r === 'ln' ? '<i class="ln"></i>' : `<span class="sg ${r[1] || ''}">${r[2] || ''}</span>` + Array.from({ length: W }, (_, i) => {
  const key = r[0] + ':' + (W - 1 - i); return `<span class="${r[1] || ''} ${marks[key] || ''}" data-k="${key}">${cells[key] ?? ''}</span>`; }).join('')).join('');
const widthOf = (a, b) => Math.max(String(a * b).length, String(a).length);

/* ---------- words ---------- */
const KEYS = `<div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k =>
  `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Així es fa!', 'Combustible carregat!'];
const HURRAY = ['Enlairament!', 'Molt bé!', 'Perfecte!', 'Genial!', 'Bon viatge!'];
// one sky colour and one planet per project, and the colour of each circle
const HUES = [165, 205, 318, 28, 262, 190, 48, 350, 285], RING = [165, 318, 262, 48];
const ORD = ['Primera', 'Segona', 'Tercera'];
const zeros = z => z === 1 ? 'un zero' : `${z} zeros`;
const art = n => n === 1 ? "l'1" : `el ${n}`;
const rat = n => n === 1 ? '1 ratlla' : `${n} ratlles`;
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
const carried = n => ` més ${n} que portaves`;
// after a new question comes up, touches are ignored for this long: a second tap on the button that was there must not answer it
const SETTLE = 450;

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /coet-multiplicador\.html$/.test(location.pathname);
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
function drawCombo() {
  const e = $('#cb'); if (!e) return;
  e.hidden = streak < 3; e.textContent = `Ratxa ×${streak}`;
  if (streak >= 3) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
}
// the end of a level or of a board comes up over its two halves
function curtain(html) {
  panel($('#split'), html);
  $('#split .panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
}
// the longest run goes in with whatever is being handed in: gives back the badges it earns
function run() { const r = streakIn(prog, top); prog = r.prog; return r.news; }
// the rocket crosses the whole screen from the bottom, leaving sparks behind
function launch() {
  if (RM) return;
  const e = document.createElement('div'); e.className = 'launch'; e.innerHTML = ROCKET; document.body.append(e);
  [0, 0.1, 0.2, 0.3, 0.4].forEach((d, i) => tone(98 * 2 ** (i / 2), d, 0.5, 0.06, 'sawtooth'));
  const t0 = performance.now(), iv = setInterval(() => {
    const r = e.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.bottom - 14, 32, 7, 80, 320);
    if (performance.now() - t0 > 1500) { clearInterval(iv); e.remove(); }
  }, 50);
}

/* ---------- the map: a band for each circle, a planet for each project and the exam of the circle at the end ---------- */
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 60% 60%)" stroke-width="2.400" opacity="${3 - i <= c ? 1 : 0.25}"/>`).join('')}<circle r="2" fill="hsl(${RING[c]} 80% 70%)"/></svg>`;
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
  fresh(); show('El mapa', false, 205);
  const band = c => `<section class="ring${openC(c) ? '' : ' shut'}" style="--rh:${RING[c]}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}" style="--h:${HUES[i]}"${openC(c) ? '' : ' disabled'}><i class="orb" aria-hidden="true"></i><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span>
        <span class="pp" aria-hidden="true">${starsOf(i).map(s => `<i class="s${s}"></i>`).join('')}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice(), any = OPEN || validated(prog).length > 0;
  $('#game').innerHTML = `<div class="map">${tip ? `<p class="next">${tip}</p>` : ''}${CIRCLES.map((_, c) => band(c)).join('')}
    <div class="extra"><button class="btn soft" id="rapid">⚡ Repte llampec${prog.rapid ? ` · rècord ${prog.rapid}` : ''}</button>
      <button class="btn soft" id="full"${any ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>🔍 Caça l'errada</button>
      <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div></div>`;
  $('#game').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level that still has something to win, as far as the project is open
      const i = +b.dataset.p, k = starsOf(i).findIndex(n => n < 3);
      mission(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : reached(prog, i), 9));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
    else if (e.target.closest('#rapid')) llampec();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

/* ---------- one level: a multiplication, the steps of plan() asked one by one ---------- */
function mission(sec, idx) {
  const c = circleOf(sec), P = PROJECTS[sec], L = P.levels[idx], t = fresh(); show(`Cercle ${c} · ${P.name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), { a, b, mode } = L, steps = plan(L);
  const A = digitsOf(a), B = digitsOf(b), W = widthOf(a, b), rows = mode === 'zeros' ? [] : rowsOf(mode, a, b);
  const za = zerosOf(a), zb = zerosOf(b), da = a / 10 ** za, db = b / 10 ** zb, unit = 10 ** (za + zb);
  // what is written on the sheet so far, by 'row:column', and the cells that glow or shake
  const cells = {}, marks = {}, eqs = [];
  let k = 0, slips = 0, help = 0, buf = '', busy = false;

  const cols = A.map((x, ai) => ({ x, ai })).filter(c => c.x).reverse();
  const field = mode === 'free' ? '' : mode === 'zeros'
    ? `<div class="field"><div class="tokens" id="toks" style="--tc:${db}">${`<i class="tok">${unit}</i>`.repeat(da * db)}</div><p class="cap">${da} files de ${db} peces · cada peça val ${unit}</p></div>`
    : mode === 'lines' ? `<div class="field">${linesSvg(a, b)}<p class="cap"><span class="la">Ratlles verdes: ${a}</span> · <span class="lb">ratlles grogues: ${b}</span></p></div>`
    : `<div class="field"><div class="rect" style="grid-template-columns:auto ${cols.map(c => [1, 1.2, 1.5][c.ai] + 'fr').join(' ')}"><span class="side">×</span>${cols.map(c => `<span class="side">${c.x * 10 ** c.ai}</span>`).join('')}
      ${B.map((d, bi) => d ? `<span class="side c${bi}">${d * 10 ** bi}</span>` + cols.map(c => `<div class="piece" data-p="${c.ai},${bi}" style="--h:${PH[bi]}"><span>${c.x * 10 ** c.ai} × ${d * 10 ** bi}</span></div>`).join('') : '').join('')}</div></div>`;
  root.innerHTML = `${levelRow(P.levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${a} × ${b}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="lane" id="lane" style="--p:0;--ph:${HUES[sec]}" aria-hidden="true"><i class="fuel"></i><span class="rk">${ROCKET}</span><i class="planet"></i></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <div class="split" id="split">${field}<div class="desk"><div class="sheet${mode === 'zeros' ? ' eqs' : ''}" id="sheet"></div><p class="ask" id="ask"></p>${KEYS}</div><span class="combo" id="cb" hidden></span></div>`;
  const sheet = $('#sheet'), lane = $('#lane');
  // a level is marked done when it has a star
  root.querySelectorAll('.levels button').forEach((e, i) => e.classList.toggle('done', prog.lv[sec * 10 + i] > 0));
  wireLevels(root, i => mission(sec, i));
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const cell = key => sheet.querySelector(`[data-k="${key}"]`);
  const pieceEl = st => root.querySelector(`.piece[data-p="${st.ai},${st.bi}"]`);
  const crossEl = st => root.querySelector(`.cl[data-p="${st.ai},${st.bi}"]`), bandEl = p => root.querySelector(`.bd[data-b="${p}"]`);
  const write = (row, col, n) => [...String(n)].reverse().forEach((ch, i) => { cells[row + ':' + (col + i)] = ch; });

  if (mode === 'guided' || mode === 'free') { write('a', 0, a); write('b', 0, b); }
  function drawSheet() {
    if (mode === 'zeros') { sheet.innerHTML = eqs.map(e => `<p>${e}</p>`).join(''); return; }
    sheet.style.setProperty('--w', W + 1); sheet.innerHTML = sheetHtml(rows, W, cells, marks);
  }
  function donePiece(st) {
    const el = pieceEl(st); if (!el) return;
    el.classList.remove('now'); el.classList.add('done'); el.innerHTML = `<span>${st.x * 10 ** st.ai} × ${st.d * 10 ** st.bi}</span><b>${st.x * st.d * 10 ** (st.ai + st.bi)}</b>`;
  }
  // the cells where the answer of a step will be written
  const targets = st => st.kind === 'digit' ? [st.row + ':' + st.col] : st.part === 'prod' ? [st.row + ':' + st.col, ...(st.last && st.v > 9 ? [st.row + ':' + (st.col + 1)] : [])] : [];

  function tipFor(st) {
    switch (st.part) {
      case 'core': return `Primer sense zeros: ${da} × ${db}. Són ${da} files de ${db} peces.`;
      case 'full': return `Cada peça val ${unit}. Escriu ${st.core} i torna-hi a posar ${st.z === 1 ? 'el zero' : `els ${st.z} zeros`}.`;
      case 'piece': { const z = st.ai + st.bi; return z ? `Tros ${st.av} × ${st.bv}. Truc dels zeros: fes ${st.x} × ${st.d} i afegeix-hi ${zeros(z)}.` : `Tros ${st.av} × ${st.bv}: aquest surt de la taula del ${st.d}.`; }
      case 'cross': return k === 0 ? `Cada xifra és un grup de ratlles. Quants punts hi ha on es creuen les ${rat(st.x)} amb les ${rat(st.d)}?`.replace(/les 1 ratlla/g, 'la ratlla')
        : `Ara la franja de les ${PLACES[st.p]}: ${rat(st.x)} per ${rat(st.d)}. Quants punts?`;
      case 'band': return `La franja de les ${PLACES[st.p]} té ${st.adds.length} grups de punts. Quants punts són, tots junts?`;
      case 'zero': return st.bi === 1 ? `Ara toca ${art(st.d)}, que és a les desenes i val ${st.d * 10}. Per això la fila comença amb un zero: escriu-lo!`
        : st.col === 0 ? `Ara toca ${art(st.d)}, que és a les centenes i val ${st.d * 100}. Per això la fila comença amb dos zeros: escriu el primer!` : 'I ara el segon zero.';
      case 'prod': return (st.ai === 0 && st.bi === 0 ? `Comencem per la dreta: ${st.d} × ${st.x}.` : st.carry ? `Ara ${st.d} × ${st.x},${carried(st.carry)}.` : `Ara ${st.d} × ${st.x}.`)
        + (st.last && st.v > 9 ? " És l'última: s'escriu el número sencer." : '');
      case 'mul': return st.ai === 0 && st.bi === 0 ? 'Multiplica de dreta a esquerra i escriu només la xifra de la casella que brilla. La que et portes s\'apunta sola a dalt.'
        : st.ai === 0 ? `Ara multiplica per ${art(st.d)}, també de dreta a esquerra.` : 'Segueix cap a l\'esquerra. No t\'oblidis de la que portes!';
      case 'top': return 'I la que portaves, al davant.';
      default: return st.col ? 'Segueix sumant la columna que brilla.' : `Ara suma ${mode === 'pieces' ? 'tots els trossos' : mode === 'lines' ? 'les franges' : B.length > 2 ? 'les tres files' : 'les dues files'}, columna a columna, començant per la dreta.`;
    }
  }
  // what to say after a wrong answer or a hint: first what to work out, then the whole sum
  function explain(st, deep) {
    const mul = `${st.d} × ${st.x}`;
    switch (st.part) {
      case 'core': return deep ? `${da} × ${db} = ${st.want}. Compta les peces: ${da} files de ${db}.` : `Mira les peces: hi ha ${da} files de ${db}. Quantes són?`;
      case 'full': return deep ? `${st.core} peces de ${unit} són ${st.want}: ${st.core} i ${zeros(st.z)}.` : `Són ${st.core} peces, i cada una val ${unit}.`;
      case 'piece': { const z = st.ai + st.bi; return deep ? `${st.x} × ${st.d} = ${st.x * st.d}${z ? `, i amb ${zeros(z)}: ${st.val}` : ''}.` : z ? `Primer ${st.x} × ${st.d}, i després ${zeros(z)}.` : `Repassa la taula del ${st.d}: ${st.x} × ${st.d}.`; }
      case 'cross': return deep ? `${rat(st.x)} per ${rat(st.d)}: ${st.x} × ${st.d} = ${st.want} punts.` : `Compta els punts que brillen, o fes ${st.x} × ${st.d}.`;
      case 'band': return deep ? `${st.adds.join(' + ')} = ${st.want} punts.` : `Suma els grups de la franja: ${st.adds.join(' + ')}.`;
      case 'zero': return st.bi === 1 ? 'Aquesta fila comença amb un 0, perquè ara multipliquem per desenes.' : 'Aquesta fila comença amb dos zeros, perquè ara multipliquem per centenes.';
      case 'prod': return deep ? `${mul} = ${st.x * st.d}${st.carry ? `,${carried(st.carry)} fan ${st.v}` : ''}.` : `Pensa-hi bé: ${mul}${st.carry ? carried(st.carry) : ''}.`;
      case 'mul': return deep ? `${mul} = ${st.x * st.d}${st.carry ? `,${carried(st.carry)} fan ${st.v}` : ''}. S'escriu el ${st.v % 10}${st.v > 9 ? ` i te'n portes ${Math.floor(st.v / 10)}` : ''}.` : `En aquesta casella: ${mul}${st.carry ? carried(st.carry) : ''}. Escriu-ne només l'última xifra.`;
      case 'top': return `${mul}${st.carry ? carried(st.carry) : ''} fan ${st.v}. El ${st.want} que et portes va al davant.`;
      default: { const sum = st.adds.join(' + ') + (st.carry ? ` + ${st.carry} que portaves` : ''); return deep ? `${sum} = ${st.v}. S'escriu el ${st.want}${st.out ? ` i te'n portes ${st.out}` : ''}.` : `Suma la columna que brilla: ${sum}.`; }
    }
  }

  function drawAsk(st) {
    const box = '<output class="in" id="in" aria-label="La teva resposta"></output>';
    $('#ask').innerHTML = st.kind === 'digit' ? '' : st.part === 'core' ? `${da} × ${db} = ${box}` : st.part === 'full' ? `${a} × ${b} = ${box}`
      : st.part === 'piece' ? `${st.av} × ${st.bv} = ${box}` : st.part === 'cross' ? `${st.x} × ${st.d} = ${box}` : st.part === 'band' ? `${st.adds.join(' + ')} = ${box}`
      : `${st.d} × ${st.x}${st.carry ? ` <i>+ ${st.carry}</i>` : ''} = ${box}`;
  }
  // gets the next step ready: its cells glow, its piece of the field glows, its question and its tip are shown
  function arm() {
    const st = steps[k]; buf = ''; help = 0;
    for (const key in marks) delete marks[key];
    targets(st).forEach(key => { marks[key] = 'next'; });
    // the carries of one row of the multiplication do not belong to the next one
    if (st.part === 'zero' || st.part === 'sum' || st.ai === 0) for (const key in cells) if (key.startsWith('mc:')) delete cells[key];
    root.querySelectorAll('.piece.now, .cl.now, .bd.now').forEach(e => e.classList.remove('now'));
    if (st.part === 'cross') crossEl(st).classList.add('now');
    else if (st.part === 'band') bandEl(st.p).classList.add('now');
    else if (st.part !== 'zero' && st.part !== 'sum') pieceEl(st)?.classList.add('now');
    drawSheet(); drawAsk(st); tip(tipFor(st));
    // on a phone the cell being asked can be off screen or under the keys: bring the tip, the field and the sheet back
    const see = sheet.querySelector('.next') || $('#ask'), r = see.getBoundingClientRect(), keys = root.querySelector('.keys');
    if (r.top < 0 || r.bottom > innerHeight - (getComputedStyle(keys).position === 'sticky' ? keys.offsetHeight : 0)) $('#tip').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };

  async function fly(txt, from, to, cls = '') {
    if (RM || !from || !to) return;
    const p = mid(from), q = mid(to), e = document.createElement('b');
    e.className = 'fly ' + cls; e.textContent = txt; document.body.append(e);
    e.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(1.3)`; void e.offsetWidth;
    e.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%, -50%)`;
    await sleep(520); e.remove();
  }
  const spark = (el, h = 48) => { if (el) { const p = mid(el); FX.burst(p.x, p.y, h, 14, 120); } };
  // a band of lines is counted: its points go to the sheet as what they are worth in their place
  async function bandDone(p, tot) {
    const el = bandEl(p), val = tot * 10 ** p; el.classList.remove('now'); el.classList.add('done'); el.querySelector('.bt').textContent = tot; spark(el.querySelector('.bt'), PH[p]);
    await fly(val, el.querySelector('.bt'), cell('t' + p + ':0'), 'c' + p); write('t' + p, 0, val);
    return p ? `${tot} ${PLACES[p]} són ${val}.` : `${tot} unitats: ${val}.`;
  }

  // a right answer lands where it is written; resolves when the next step can be asked
  async function land(st) {
    let msg = '', wait = 220;
    if (mode === 'zeros') {
      eqs.push(st.part === 'core' ? `${da} × ${db} = <b>${st.want}</b>` : `${a} × ${b} = <b>${st.want}</b>`);
      $('#toks').classList.add(st.part === 'core' ? 'counted' : 'lit'); spark($('#toks'), 190);
      msg = st.part === 'core' ? `${st.want} peces!` : ''; wait = 700;
    } else if (st.part === 'piece') {
      const el = pieceEl(st); donePiece(st); spark(el, PH[st.bi]);
      await fly(st.val, el, cell(st.row + ':0'), 'c' + st.bi);
      write(st.row, 0, st.val); msg = pick(BRAVO); wait = 500;
    } else if (st.part === 'cross') {
      const el = crossEl(st); el.classList.remove('now'); el.classList.add('done'); el.querySelector('text').textContent = st.want; spark(el, PH[st.p]);
      if (st.solo) { msg = await bandDone(st.p, st.tot); wait = 1000; } else { msg = `${st.want} punts.`; wait = 450; }
    } else if (st.part === 'band') { msg = await bandDone(st.p, st.want); wait = 1000; }
    else if (st.part === 'prod') {
      const src = $('#in'), put = st.last ? st.v : st.v % 10; donePiece(st);
      await Promise.all([fly(put, src, cell(st.row + ':' + st.col), 'c' + st.bi), st.out ? fly(st.out, src, cell('mc:' + (st.ai + 1)), 'cy') : 0]);
      write(st.row, st.col, put); if (st.out) cells['mc:' + (st.ai + 1)] = st.out;
      msg = st.out ? `${st.v}: escric el ${st.v % 10} i me'n porto ${st.out}.` : st.v > 9 ? `${st.v}: és l'última, l'escric sencer.` : `Escric el ${st.v}.`; wait = 1000;
    } else {
      cells[st.row + ':' + st.col] = st.want;
      if (st.out) cells[st.part === 'sum' ? 'sc:' + (st.col + 1) : 'mc:' + (st.ai + 1)] = st.out;
    }
    if (!t.on) return;
    for (const key in marks) delete marks[key];
    drawSheet(); drawAsk({ kind: 'digit' }); if (st.row) spark(cell(st.row + ':' + st.col));
    // a row of the multiplication just finished: say what it is worth, which is its strip of the field
    if (B.length > 1 && st.last && (st.part === 'prod' || st.part === 'top' || (st.part === 'mul' && st.v < 10))) {
      msg = `${ORD[st.bi]} fila: ${a} × ${st.d * 10 ** st.bi} = ${a * st.d * 10 ** st.bi}.`; wait = 1700;
    }
    if (msg) tip(msg, 'go');
    await sleep(wait);
  }

  function wrong(st, n) {
    slips++; help++; streak = 0; drawCombo(); stars(); buzz(); tip('Ui! ' + explain(st, help > 1), 'oops');
    if (st.kind === 'val') { buf = ''; const o = $('#in'); o.textContent = ''; o.className = 'in'; void o.offsetWidth; o.className = 'in shake'; return; }
    // the wrong digit shows in its cell for a moment
    const key = st.row + ':' + st.col; busy = true; cells[key] = n; marks[key] = 'bad'; drawSheet();
    setTimeout(() => { if (!t.on) return; delete cells[key]; marks[key] = 'next'; drawSheet(); busy = false; }, 600);
  }

  async function answer(n) {
    const st = steps[k];
    if (n !== st.want) return wrong(st, n);
    busy = true; streak = help ? 0 : streak + 1; top = Math.max(top, streak); ding(); drawCombo();
    await land(st); if (!t.on) return;
    k++; lane.style.setProperty('--p', k / steps.length);
    if (k === steps.length) return win();
    busy = false; arm();
  }

  // the level is handed in with its last step: its stars go to the mark of the project, and the mark to the XP once the project is validated
  async function win() {
    const got = run(), r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    keyFn = null; prog = r.prog; save(); r.news = [...got, ...r.news];
    root.querySelectorAll('.piece.now').forEach(e => e.classList.remove('now'));
    tip(`${a} × ${b} = ${a * b}. ${pick(HURRAY)}`, 'go'); lane.classList.add('won'); chime([523, 659, 784, 1047, 1319]); launch(); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(1300); if (!t.on) return;
    curtain(`<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="score">${a} × ${b} = ${a * b}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}" style="--i:${i}">★</i>`).join('')}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    $('#nx').onclick = () => end ? mapa() : mission(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => mission(sec, idx);
  }

  keyFn = key => {
    if (busy) return;
    const st = steps[k];
    if (st.kind === 'digit') { if (key > -1) answer(+key); return; }
    if (key === 'ok') { if (buf) answer(+buf); return; }
    buf = key === 'del' ? buf.slice(0, -1) : (buf + key).slice(0, 7);
    const o = $('#in'); o.className = 'in'; o.textContent = buf; tone(key === 'del' ? 392 : 660, 0, 0.08, 0.05);
  };
  root.querySelector('.keys').onclick = e => { const b = e.target.closest('button'); if (b && keyFn) keyFn(b.dataset.k); };
  $('#hintb').onclick = () => { if (busy || !keyFn) return; slips++; help++; streak = 0; drawCombo(); stars(); tip(explain(steps[k], help > 1)); };
  stars(); drawCombo(); arm();
}

/* ---------- the board: a run of quick questions, one at a time. The Piscina, an exam and a lightning round all play on it ---------- */
const coreOf = q => { const z = zerosOf(q.a) + zerosOf(q.b); return { z, da: q.a / 10 ** zerosOf(q.a), db: q.b / 10 ** zerosOf(q.b) }; };
const holeOf = q => plan({ a: q.a, b: q.b, mode: 'free' })[q.hole];
function tipQ(q) {
  switch (q.kind) {
    case 'calc': return coreOf(q).z ? 'Truc dels zeros: primer sense zeros, i després torna\'ls a posar.' : 'De cap: quant fa?';
    case 'miss': return 'La multiplicació està feta a trossos i en falta un. Quant val?';
    case 'lines': return 'Compta els punts de cada franja, de dreta a esquerra, i escriu el resultat.';
    case 'which': return 'Compta les ratlles de cada grup: quina multiplicació és?';
    default: return 'Mira la casella que brilla: quina xifra hi falta?';
  }
}
// what to work out, without the answer
function hintQ(q) {
  const { z, da, db } = coreOf(q), st = q.kind === 'hole' ? holeOf(q) : null;
  switch (q.kind) {
    case 'calc': return z ? `Primer ${da} × ${db}, i després ${zeros(z)}.` : `Repassa la taula del ${q.b}: ${q.a} × ${q.b}.`;
    case 'miss': return `És el tros ${q.tens ? q.a - q.a % 10 : q.a % 10} × ${q.b}.`;
    case 'lines': return `Les franges tenen ${list(bands(q.a, q.b).map((n, p) => `${n} ${PLACES[p]}`).reverse())}.`;
    case 'which': return 'Les ratlles verdes són el primer número i les grogues, el segon.';
    default: return st.part === 'zero' ? 'És el començament de la fila de les desenes o de les centenes.' : st.part === 'sum' ? `Suma la columna: ${st.adds.join(' + ')}${st.carry ? ` + ${st.carry} que portaves` : ''}.` : `En aquesta casella: ${st.d} × ${st.x}${st.carry ? carried(st.carry) : ''}.`;
  }
}
// the whole answer
function explainQ(q) {
  const { z, da, db } = coreOf(q), w = wantQ(q), st = q.kind === 'hole' ? holeOf(q) : null;
  switch (q.kind) {
    case 'calc': return z ? `${da} × ${db} = ${da * db}, i amb ${zeros(z)}: ${w}.` : `${q.a} × ${q.b} = ${w}.`;
    case 'miss': return `El tros que falta és ${q.tens ? q.a - q.a % 10 : q.a % 10} × ${q.b} = ${w}.`;
    case 'lines': return `${list(bands(q.a, q.b).map((n, p) => `${n} ${PLACES[p]}`).reverse())}: ${q.a} × ${q.b} = ${w}.`;
    case 'which': return `Era ${w}: cada grup de ratlles és una xifra.`;
    default: return st.part === 'zero' ? `Hi va un 0: aquesta fila multiplica per ${PLACES[st.bi]}.` : st.part === 'sum' ? `${st.adds.join(' + ')}${st.carry ? ` + ${st.carry} que portaves` : ''} = ${st.v}: hi va el ${w}.`
      : `${st.d} × ${st.x}${st.carry ? carried(st.carry) : ''} fan ${st.v}: hi va el ${w}.`;
  }
}
// o is { t, qs, how, hue, secs, chip(st), onLast(st), onEnd(st) }. how 'pool' lets the child try again, with what went wrong said;
// 'exam' and 'rapid' give one try. st is { slips, hits, marks, missed }: marks is 'ok' or 'bad' per question. onLast is called the moment
// the last question is decided, so what was won is saved before any wait; onEnd when the board is over (with secs, when the time is).
function board(o) {
  const { t, qs, how } = o, once = how === 'exam' || how === 'rapid', host = $('#board'), st = { slips: 0, hits: 0, marks: [], missed: [] };
  let k = 0, q, help = 0, busy = false, over = false, openAt = 0, buf = '', lab = false;
  host.innerHTML = `${o.secs ? '<div class="fuse" role="img" aria-label="El temps que queda"><i id="fuse"></i></div>'
    : `<div class="lane" id="lane" style="--p:0;--ph:${o.hue}" aria-hidden="true"><i class="fuel"></i><span class="rk">${ROCKET}</span><i class="planet"></i></div>`}
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <div class="split" id="split"><div class="field" id="field"></div><div class="desk"><p class="ask" id="ask"></p><div id="ctl"></div></div><span class="combo" id="cb" hidden></span></div>`;
  const field = $('#field'), ctl = $('#ctl');
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };

  // the figure of the question; lab shows the answer on it
  function drawField() {
    let h = '';
    if (q.kind === 'lines' || q.kind === 'which') h = linesSvg(q.a, q.b, q.kind === 'which' && !lab);
    else if (q.kind === 'miss') {
      const T = q.a - q.a % 10, U = q.a % 10, cut = (v, miss, h) => `<div class="piece ${miss && !lab ? 'now' : 'done'}" style="--h:${h}"><span>${v} × ${q.b}</span><b>${miss && !lab ? '?' : v * q.b}</b></div>`;
      h = `<div class="rect" style="grid-template-columns:auto 1.3fr 1fr"><span class="side">×</span><span class="side">${T}</span><span class="side">${U}</span><span class="side c0">${q.b}</span>${cut(T, q.tens, PH[1])}${cut(U, !q.tens, PH[0])}</div>`;
    } else if (q.kind === 'hole') {
      const s = holeOf(q), key = s.row + ':' + s.col, cells = {}, put = (row, n) => [...String(n)].reverse().forEach((ch, i) => { cells[row + ':' + i] = ch; });
      put('a', q.a); put('b', q.b); plan({ a: q.a, b: q.b, mode: 'free' }).forEach(x => { cells[x.row + ':' + x.col] = x.want; });
      cells[key] = lab ? s.want : buf;
      h = `<div class="sheet" style="--w:${widthOf(q.a, q.b) + 1}">${sheetHtml(rowsOf('free', q.a, q.b), widthOf(q.a, q.b), cells, { [key]: lab ? 'good' : 'next' })}</div>`;
    }
    field.hidden = !h; field.innerHTML = h;
  }
  function drawAsk() {
    const box = `<output class="in${busy ? '' : ' cur'}" id="in" aria-label="La teva resposta">${lab ? wantQ(q) : buf}</output>`, have = q.a * q.b - wantQ(q);
    $('#ask').innerHTML = q.kind === 'which' ? 'Quina multiplicació és?' : q.kind === 'hole' ? 'Quina xifra hi falta?'
      : q.kind === 'miss' ? `${q.a} × ${q.b} = ${q.tens ? `${box} + ${have}` : `${have} + ${box}`}` : `${q.a} × ${q.b} = ${box}`;
  }
  function drawCtl() {
    ctl.innerHTML = q.kind === 'which' ? `<div class="choices" style="--c:${q.opts.length}">${q.opts.map(v => `<button class="key" data-pick="${v}">${v}</button>`).join('')}</div>` : KEYS;
  }
  // gets the next question ready
  function arm() {
    q = qs[k]; buf = ''; help = 0; busy = false; lab = false; openAt = k && how !== 'rapid' ? performance.now() + SETTLE : 0;
    $('#lane')?.style.setProperty('--p', k / qs.length);
    drawField(); drawAsk(); drawCtl(); tip(how === 'rapid' ? '' : tipQ(q)); o.chip?.(st);
    if ($('#tip').getBoundingClientRect().top < 0) $('#tip').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  // the answer is shown on the figure and in the box; a drawing in lines with its numbers already says it all
  function reveal() { lab = true; if (q.kind !== 'lines') drawField(); drawAsk(); }

  async function submit(ans) {
    if (busy || over || !t.on || performance.now() < openAt) return;
    const ok = ans === wantQ(q), last = k === qs.length - 1;
    if (!ok && !once) {   // try again, with what went wrong said
      buzz(); shake($('#ask')); st.slips++; help++; streak = 0; drawCombo(); o.chip?.(st);
      tip('Ui! ' + (help > 1 ? explainQ(q) : hintQ(q)), 'oops'); buf = ''; if (q.kind === 'hole') drawField(); drawAsk();
      return;
    }
    busy = true; st.marks[k] = ok ? 'ok' : 'bad';
    if (ok) { st.hits++; streak = help ? 0 : streak + 1; top = Math.max(top, streak); } else { st.missed.push(q); streak = 0; }
    if (last) o.onLast?.(st);
    drawCombo(); o.chip?.(st); reveal(); $('#lane')?.style.setProperty('--p', (k + 1) / qs.length);
    if (!ok) {   // one try only: show the right answer, and in an exam wait for the child to go on
      buzz(); shake($('#ask')); tip('No. ' + explainQ(q), 'oops');
      if (how === 'rapid') { await sleep(1600); if (t.on && !over) next(); return; }
      ctl.innerHTML = '<button class="btn" id="go">Segueix</button>'; $('#go').focus({ preventScroll: true });
      return;
    }
    ding(); if (how !== 'rapid') tip(streak && streak % 5 === 0 ? `${streak} seguides! ${pick(BRAVO)}` : pick(BRAVO), 'go');
    { const p = mid($('#ask')); FX.burst(p.x, p.y, 48, 18 + 3 * Math.min(streak, 8), 170); if (streak && streak % 5 === 0) FX.celebrate(3); }
    await sleep(how === 'rapid' ? 350 : 1100); if (t.on && !over) next();
  }
  async function next() {
    k++;
    if (k < qs.length) return arm();
    // the panel comes up where the last button was: wait until a second tap on that button has passed
    over = true; keyFn = null; ctl.innerHTML = ''; await sleep(SETTLE); if (t.on) o.onEnd(st);
  }

  keyFn = key => {
    if (over) return;
    if (busy) { if (key === 'ok') $('#go')?.click(); return; }
    if (q.kind === 'which') return;
    if (key === 'ok') { if (buf) submit(+buf); return; }
    buf = key === 'del' ? buf.slice(0, -1) : q.kind === 'hole' ? key : (buf + key).slice(0, 7);
    tone(key === 'del' ? 392 : 660, 0, 0.08, 0.05);
    q.kind === 'hole' ? drawField() : drawAsk();
    // in a lightning round an answer with all its digits is handed in without ✓
    if (how === 'rapid' && buf.length >= String(wantQ(q)).length) submit(+buf);
  };
  ctl.onclick = e => {
    if (e.target.closest('#go')) return next();
    if (busy || over) return;
    const key = e.target.closest('[data-k]'), opt = e.target.closest('[data-pick]');
    if (key) keyFn(key.dataset.k); else if (opt) submit(opt.dataset.pick);
  };
  // the fuse of a lightning round: when it burns out the board is over, whatever was going on
  if (o.secs) {
    const t0 = performance.now(), iv = setInterval(() => {
      const left = o.secs - (performance.now() - t0) / 1000;
      if (!t.on || over) return clearInterval(iv);
      $('#fuse').style.width = Math.max(0, left / o.secs * 100) + '%';
      if (left <= 0) { clearInterval(iv); over = true; keyFn = null; ctl.innerHTML = ''; o.onEnd(st); }
    }, 100);
  }
  drawCombo(); arm();
}

/* ---------- the Piscina: three first questions, the first thing a profile with nothing saved meets ---------- */
// The third one saves piscina and opens the map. There is no «← Mapa» here: the map would have every circle shut, so the way
// out is the page of all games.
function piscina() {
  const t = fresh(); show('La Piscina', true, 205); $('#toS').hidden = true; $('#toG').hidden = !HUB;
  let got = [];
  $('#game').innerHTML = '<div class="hud mid"><span class="chip">Tres reptes per pujar al coet</span></div><div id="board"></div>';
  board({ t, qs: POOL, how: 'pool', hue: 205,
    onLast: () => { const r = poolIn(prog); prog = r.prog; got = r.news; save(); },
    onEnd: () => {
      chime([523, 659, 784, 1047, 1319]); launch(); FX.celebrate(16);
      curtain(`<h2>Piscina acabada!</h2><p class="lead go">+50 XP · ja ets dins del cursus de multiplicar</p>${news(got)}
        <p class="lead">Al mapa hi ha quatre cercles de planetes. Valida els projectes d'un cercle i supera'n l'examen per obrir el següent.</p><button class="btn" id="nx">Obre el mapa</button>`);
      $('#nx').onclick = () => mapa();
    } });
}

/* ---------- the exam of a circle: six new questions of its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]);
  const qs = exam(c, Math.random);
  let r;
  $('#game').innerHTML = '<div class="hud"><span class="chip">Sis preguntes · un sol intent</span><span class="chip" id="st"></span></div><div id="board"></div>';
  board({ t, qs, how: 'exam', hue: RING[c], chip: st => { $('#st').textContent = `${st.hits} de ${qs.length}`; },
    onLast: st => { const got = run(), first = !prog.exams[c]; r = examIn(prog, c, qs, qs.map((_, i) => st.marks[i] === 'ok')); r.news = [...got, ...r.news]; r.first = r.good && first; prog = r.prog; save(); },
    onEnd: () => {
      r.good ? (chime([523, 659, 784, 1047, 1319]), launch(), FX.celebrate(16)) : tone(196, 0, 0.5, 0.12, 'triangle');
      curtain(`<h2>${r.good ? 'Examen superat!' : 'Encara no!'}</h2><p class="score">${r.score} de ${qs.length}</p>
        <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
        ${r.first ? `<p class="lead go">${c < CIRCLES.length - 1 ? `S'ha obert el cercle ${c + 1}: ${CIRCLES[c + 1].name}.` : 'Has acabat el cursus de multiplicar!'}</p>` : ''}
        ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
        <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
      $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
    } });
}

/* ---------- the lightning round: as many tables as fit in a minute, one try each; only the record is kept ---------- */
function llampec() {
  const t = fresh(); show('Repte llampec', true, 48);
  $('#game').innerHTML = `<div class="intro"><h2>⚡ Repte llampec</h2><p class="lead">${RAPID} segons de taules de multiplicar, un sol intent per a cada una. Escriu el resultat i ja està: no cal prémer ✓. Quantes n'encertaràs?</p>
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
  zeros: C => ({ pic: '', txt: `${C.a} × ${C.b} = <b>${C.says}</b>`, val: v => v, truth: `${C.a} × ${C.b} = ${C.real}` }),
  glue: C => ({ pic: '', txt: `${C.a} × ${C.b} = <b>${C.says}</b>`, val: v => v, truth: `${C.a} × ${C.b} = ${C.real}` }),
  carry: C => ({ pic: '', txt: `En columna, ${C.d} × ${C.x} = ${C.v}: escric el ${C.says === C.real ? C.v % 10 : C.real} i <b>me'n porto ${C.says}</b>`, val: v => `Me'n porto ${v}`, truth: `s'escriu el ${C.v % 10} i se'n porten ${C.real}` }),
  row: C => ({ pic: '', txt: `A ${C.a} × ${C.b} en columna, la fila del ${C.t} fa <b>${C.says}</b>`, val: v => v, truth: `la fila del ${C.t} és ${C.a} × ${C.t * 10} = ${C.real}` }),
  lines: C => ({ pic: linesSvg(C.a, C.b, true), txt: `Aquestes ratlles dibuixen <b>${C.says}</b>`, val: v => v, truth: `són ${C.real}` })
};
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the value that makes it true,
// with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), marks = [];
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="Tres fulls">${'<i></i>'.repeat(cs.length)}</span></div>
    <div class="coach" id="coach"><span class="pilot">${ROCKET}</span><p class="status tip" id="tip" role="status" aria-live="polite"></p></div>
    <div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const stage = $('#stage'), tail = $('#tail'), dots = [...$('#dots').children];
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').textContent = txt; const c = $('#coach'); c.className = 'coach'; void c.offsetWidth; c.className = 'coach ' + cls; };
  let k = -1, C, D, busy, openAt = 0, res = null;
  function arm() {
    k++; C = cs[k]; D = CLAIMS[C.kind](C); busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="paper">${D.pic}<p class="claim">${D.txt}</p></div>`;
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
