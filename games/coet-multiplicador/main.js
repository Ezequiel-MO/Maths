import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { sectionMenu, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { SECTIONS, LEVELS, digitsOf, zerosOf, pieces, plan, starsFor } from './logic.js';

const KEY = 'coet-multiplicador';

// secs counts the levels done in each section; stars keeps the best of each level
let prog = { so: true, secs: SECTIONS.map(() => 0), stars: LEVELS.map(() => 0) };
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

/* ---------- screens ---------- */
const ROCKET = `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="flame" d="M25 48 Q32 68 39 48Z" fill="#F7C64E"/><path d="M22 38 L11 52 L24 47Z M42 38 L53 52 L40 47Z" fill="#FF6B9A"/><path d="M32 3 C45 14 46 34 42 48 H22 C18 34 19 14 32 3Z" fill="#EAF8F4" stroke="#0A2A3A" stroke-width="2"/><circle cx="32" cy="24" r="6.5" fill="#6FE3FF" stroke="#0A2A3A" stroke-width="2"/></svg>`;
const KEYS = `<div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k =>
  `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Així es fa!', 'Combustible carregat!'];
const HURRAY = ['Enlairament!', 'Molt bé!', 'Perfecte!', 'Genial!', 'Bon viatge!'];
// one sky colour and one planet per section; the strip of the units is blue and the strip of the tens is pink, on the field and on the desk
const HUES = [165, 205, 262, 318, 28, 48], STRIP = [190, 318];
const zeros = z => z === 1 ? 'un zero' : `${z} zeros`;
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /coet-multiplicador\.html$/.test(location.pathname);
function show(kicker, playing) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
}
$('#toS').onclick = () => seccions();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

// the keys on the screen and a real keyboard both end up here
let keyFn = null;
addEventListener('keydown', e => {
  if (!keyFn || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null;
  if (k) { e.preventDefault(); keyFn(k); }
});

function seccions() {
  fresh(); keyFn = null; show('Multiplicar', false); FX.mood(HUES[0]);
  const stars = i => prog.stars.slice(i * 10, i * 10 + 10).reduce((x, y) => x + y, 0);
  sectionMenu($('#game'), 'Tria una secció. A cada una el coet aprèn un tros de la multiplicació.', SECTIONS, prog.secs, level, i => stars(i) ? ` · ★ ${stars(i)}` : '');
}

/* ---------- one level: the steps of plan() asked one by one ---------- */
function level(sec, idx) {
  const t = fresh(); show(`Secció ${sec + 1} · ${SECTIONS[sec].name}`, true); FX.mood(HUES[sec]);
  const root = $('#game'), L = LEVELS[sec * 10 + idx], { a, b, mode } = L, steps = plan(L);
  const A = digitsOf(a), B = digitsOf(b), W = Math.max(String(a * b).length, A.length), ps = mode === 'zeros' ? [] : pieces(a, b);
  const za = zerosOf(a), zb = zerosOf(b), da = a / 10 ** za, db = b / 10 ** zb, unit = 10 ** (za + zb);
  // what is written on the sheet so far, by 'row:column', and the cells that glow or shake
  const cells = {}, marks = {}, eqs = [];
  let k = 0, slips = 0, help = 0, buf = '', busy = false;

  const cols = A.map((x, ai) => ({ x, ai })).filter(c => c.x).reverse();
  const field = mode === 'free' ? '' : mode === 'zeros'
    ? `<div class="field"><div class="tokens" id="toks" style="--tc:${db}">${`<i class="tok">${unit}</i>`.repeat(da * db)}</div><p class="cap">${da} files de ${db} peces · cada peça val ${unit}</p></div>`
    : `<div class="field"><div class="rect" style="grid-template-columns:auto ${cols.map(c => [1, 1.2, 1.5][c.ai] + 'fr').join(' ')}"><span class="side">×</span>${cols.map(c => `<span class="side">${c.x * 10 ** c.ai}</span>`).join('')}
      ${B.map((d, bi) => `<span class="side c${bi}">${d * 10 ** bi}</span>` + cols.map(c => `<div class="piece" data-p="${c.ai},${bi}" style="--h:${STRIP[bi]}"><span>${c.x * 10 ** c.ai} × ${d * 10 ** bi}</span></div>`).join('')).join('')}</div></div>`;
  root.innerHTML = `<div class="hud"><span class="chip">Nivell ${idx + 1} · ${a} × ${b}</span><span class="chip" id="st"></span></div>
    ${levelRow(SECTIONS[sec].levels, prog.secs[sec], idx)}
    <div class="lane" id="lane" style="--p:0;--ph:${HUES[sec]}" aria-hidden="true"><i class="fuel"></i><span class="rk">${ROCKET}</span><i class="planet"></i></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <div class="split" id="split">${field}<div class="desk"><div class="sheet${mode === 'zeros' ? ' eqs' : ''}" id="sheet"></div>
      <div class="askrow"><p class="ask" id="ask"></p><button class="btn soft" id="hintb">Pista</button></div>${KEYS}</div></div>`;
  const sheet = $('#sheet'), lane = $('#lane');
  wireLevels(root, i => level(sec, i));
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const cell = key => sheet.querySelector(`[data-k="${key}"]`);
  const pieceEl = st => root.querySelector(`.piece[data-p="${st.ai},${st.bi}"]`);
  const write = (row, col, n) => [...String(n)].reverse().forEach((ch, i) => { cells[row + ':' + (col + i)] = ch; });

  if (mode === 'guided' || mode === 'free') { write('a', 0, a); write('b', 0, b); }
  function drawSheet() {
    if (mode === 'zeros') { sheet.innerHTML = eqs.map(e => `<p>${e}</p>`).join(''); return; }
    const line = (id, cls = '', sign = '') => `<span class="sg ${cls}">${sign}</span>` + Array.from({ length: W }, (_, i) => {
      const key = id + ':' + (W - 1 - i); return `<span class="${cls} ${marks[key] || ''}" data-k="${key}">${cells[key] ?? ''}</span>`; }).join('');
    const LN = '<i class="ln"></i>';
    sheet.style.setProperty('--w', W + 1);
    sheet.innerHTML = mode === 'pieces'
      ? line('sc', 'cy') + ps.map((p, i) => line('p' + i, 'c' + p.bi, i === ps.length - 1 ? '+' : '')).join('') + LN + line('sum')
      : line('mc', 'cy') + line('a') + line('b', '', '×') + LN + (B.length > 1 ? line('sc', 'cy') + line('r0', 'c0') + line('r1', 'c1', '+') + LN + line('sum') : line('r0', 'c0'));
  }
  function donePiece(st) {
    const el = pieceEl(st); if (!el) return;
    el.classList.remove('now'); el.classList.add('done'); el.innerHTML = `<span>${st.x * 10 ** st.ai} × ${st.d * 10 ** st.bi}</span><b>${st.x * st.d * 10 ** (st.ai + st.bi)}</b>`;
  }
  // the cells where the answer of a step will be written
  const targets = st => st.kind === 'digit' ? [st.row + ':' + st.col] : st.part === 'prod' ? [st.row + ':' + st.col, ...(st.last && st.v > 9 ? [st.row + ':' + (st.col + 1)] : [])] : [];

  const carried = n => n === 1 ? ' més 1 que portaves' : ` més ${n} que portaves`;
  function tipFor(st) {
    switch (st.part) {
      case 'core': return `Primer sense zeros: ${da} × ${db}. Són ${da} files de ${db} peces.`;
      case 'full': return `Cada peça val ${unit}. Escriu ${st.core} i torna-hi a posar ${st.z === 1 ? 'el zero' : `els ${st.z} zeros`}.`;
      case 'piece': { const z = st.ai + st.bi; return z ? `Tros ${st.av} × ${st.bv}. Truc dels zeros: fes ${st.x} × ${st.d} i afegeix-hi ${zeros(z)}.` : `Tros ${st.av} × ${st.bv}: aquest surt de la taula del ${st.d}.`; }
      case 'zero': return `Ara toca el ${st.d}, que és a les desenes i val ${st.d * 10}. Per això la fila comença amb un zero: escriu-lo!`;
      case 'prod': return (st.ai === 0 && st.bi === 0 ? `Comencem per la dreta: ${st.d} × ${st.x}.` : st.carry ? `Ara ${st.d} × ${st.x},${carried(st.carry)}.` : `Ara ${st.d} × ${st.x}.`)
        + (st.last && st.v > 9 ? " És l'última: s'escriu el número sencer." : '');
      case 'mul': return st.ai === 0 && st.bi === 0 ? 'Multiplica de dreta a esquerra i escriu només la xifra de la casella que brilla. La que et portes s\'apunta sola a dalt.'
        : st.ai === 0 ? `Ara multiplica pel ${st.d}, també de dreta a esquerra.` : 'Segueix cap a l\'esquerra. No t\'oblidis de la que portes!';
      case 'top': return 'I la que portaves, al davant.';
      default: return st.col ? 'Segueix sumant la columna que brilla.' : mode === 'pieces' ? 'Ara suma tots els trossos, columna a columna, començant per la dreta.' : 'Ara suma les dues files, columna a columna, començant per la dreta.';
    }
  }
  // what to say after a wrong answer or a hint: first what to work out, then the whole sum
  function explain(st, deep) {
    const mul = `${st.d} × ${st.x}`;
    switch (st.part) {
      case 'core': return deep ? `${da} × ${db} = ${st.want}. Compta les peces: ${da} files de ${db}.` : `Mira les peces: hi ha ${da} files de ${db}. Quantes són?`;
      case 'full': return deep ? `${st.core} peces de ${unit} són ${st.want}: ${st.core} i ${zeros(st.z)}.` : `Són ${st.core} peces, i cada una val ${unit}.`;
      case 'piece': { const z = st.ai + st.bi; return deep ? `${st.x} × ${st.d} = ${st.x * st.d}${z ? `, i amb ${zeros(z)}: ${st.val}` : ''}.` : z ? `Primer ${st.x} × ${st.d}, i després ${zeros(z)}.` : `Repassa la taula del ${st.d}: ${st.x} × ${st.d}.`; }
      case 'zero': return 'Aquesta fila comença amb un 0, perquè ara multipliquem per desenes.';
      case 'prod': return deep ? `${mul} = ${st.x * st.d}${st.carry ? `,${carried(st.carry)} fan ${st.v}` : ''}.` : `Pensa-hi bé: ${mul}${st.carry ? carried(st.carry) : ''}.`;
      case 'mul': return deep ? `${mul} = ${st.x * st.d}${st.carry ? `,${carried(st.carry)} fan ${st.v}` : ''}. S'escriu el ${st.v % 10}${st.v > 9 ? ` i te'n portes ${Math.floor(st.v / 10)}` : ''}.` : `En aquesta casella: ${mul}${st.carry ? carried(st.carry) : ''}. Escriu-ne només l'última xifra.`;
      case 'top': return `${mul}${st.carry ? carried(st.carry) : ''} fan ${st.v}. El ${st.want} que et portes va al davant.`;
      default: { const sum = st.adds.join(' + ') + (st.carry ? ` + ${st.carry} que portaves` : ''); return deep ? `${sum} = ${st.v}. S'escriu el ${st.want}${st.out ? ` i te'n portes ${st.out}` : ''}.` : `Suma la columna que brilla: ${sum}.`; }
    }
  }

  function drawAsk(st) {
    const box = '<output class="in" id="in" aria-label="La teva resposta"></output>';
    $('#ask').innerHTML = st.kind === 'digit' ? '' : st.part === 'core' ? `${da} × ${db} = ${box}` : st.part === 'full' ? `${a} × ${b} = ${box}`
      : st.part === 'piece' ? `${st.av} × ${st.bv} = ${box}` : `${st.d} × ${st.x}${st.carry ? ` <i>+ ${st.carry}</i>` : ''} = ${box}`;
  }
  // gets the next step ready: its cells glow, its piece of the field glows, its question and its tip are shown
  function arm() {
    const st = steps[k]; buf = ''; help = 0;
    for (const key in marks) delete marks[key];
    targets(st).forEach(key => { marks[key] = 'next'; });
    // the carries of one row of the multiplication do not belong to the next one
    if (st.part === 'zero' || st.part === 'sum' || st.ai === 0) for (const key in cells) if (key.startsWith('mc:')) delete cells[key];
    root.querySelectorAll('.piece.now').forEach(e => e.classList.remove('now'));
    if (st.part !== 'zero' && st.part !== 'sum') pieceEl(st)?.classList.add('now');
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

  // a right answer lands where it is written; resolves when the next step can be asked
  async function land(st) {
    let msg = '', wait = 220;
    if (mode === 'zeros') {
      eqs.push(st.part === 'core' ? `${da} × ${db} = <b>${st.want}</b>` : `${a} × ${b} = <b>${st.want}</b>`);
      $('#toks').classList.add(st.part === 'core' ? 'counted' : 'lit'); spark($('#toks'), 190);
      msg = st.part === 'core' ? `${st.want} peces!` : ''; wait = 700;
    } else if (st.part === 'piece') {
      const el = pieceEl(st); donePiece(st); spark(el, STRIP[st.bi]);
      await fly(st.val, el, cell(st.row + ':0'), 'c' + st.bi);
      write(st.row, 0, st.val); msg = pick(BRAVO); wait = 500;
    } else if (st.part === 'prod') {
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
      msg = st.bi ? `Segona fila: ${a} × ${st.d * 10} = ${a * st.d * 10}.` : `Primera fila: ${a} × ${st.d} = ${a * st.d}.`; wait = 1700;
    }
    if (msg) tip(msg, 'go');
    await sleep(wait);
  }

  function wrong(st, n) {
    slips++; help++; stars(); tone(150, 0, 0.45, 0.16, 'triangle'); tip('Ui! ' + explain(st, help > 1), 'oops');
    if (st.kind === 'val') { buf = ''; const o = $('#in'); o.textContent = ''; o.className = 'in'; void o.offsetWidth; o.className = 'in shake'; return; }
    // the wrong digit shows in its cell for a moment
    const key = st.row + ':' + st.col; busy = true; cells[key] = n; marks[key] = 'bad'; drawSheet();
    setTimeout(() => { if (!t.on) return; delete cells[key]; marks[key] = 'next'; drawSheet(); busy = false; }, 600);
  }

  async function answer(n) {
    const st = steps[k];
    if (n !== st.want) return wrong(st, n);
    busy = true; tone(784, 0, 0.14, 0.08);
    await land(st); if (!t.on) return;
    k++; lane.style.setProperty('--p', k / steps.length);
    if (k === steps.length) return win();
    busy = false; arm();
  }

  async function win() {
    const n = starsFor(slips), i = sec * 10 + idx, end = idx === 9, last = end && sec === SECTIONS.length - 1;
    keyFn = null; if (idx + 1 > prog.secs[sec]) prog.secs[sec] = idx + 1;
    prog.stars[i] = Math.max(prog.stars[i], n); save();
    root.querySelectorAll('.piece.now').forEach(e => e.classList.remove('now'));
    tip(`${a} × ${b} = ${a * b}. ${pick(HURRAY)}`, 'go'); lane.classList.add('won'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(end ? 16 : 8);
    await sleep(1200); if (!t.on) return;
    $('#split').insertAdjacentHTML('beforeend', `<div class="panel"><h2>${last ? 'Missió complerta!' : end ? 'Secció superada!' : pick(HURRAY)}</h2>
      <p class="score">${a} × ${b} = ${a * b}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead">${last ? 'Ja saps multiplicar números de tres xifres per números de dues, com els grans.' : end ? `Has obert la secció ${sec + 2}: ${SECTIONS[sec + 1].name}.` : n === 3 ? 'Ni un sol error!' : 'Si hi tornes sense errors ni pistes, tindràs les tres estrelles.'}</p>
      <button class="btn" id="nx">${last ? 'Torna a les seccions' : end ? 'Secció següent' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}</div>`);
    const p = root.querySelector('.panel'); p.scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').focus({ preventScroll: true });
    $('#nx').onclick = () => last ? seccions() : end ? level(sec + 1, 0) : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  keyFn = key => {
    if (busy) return;
    const st = steps[k];
    if (st.kind === 'digit') { if (key > -1) answer(+key); return; }
    if (key === 'ok') { if (buf) answer(+buf); return; }
    buf = key === 'del' ? buf.slice(0, -1) : (buf + key).slice(0, 6);
    const o = $('#in'); o.className = 'in'; o.textContent = buf; tone(key === 'del' ? 392 : 660, 0, 0.08, 0.05);
  };
  root.querySelector('.keys').onclick = e => { const b = e.target.closest('button'); if (b && keyFn) keyFn(b.dataset.k); };
  $('#hintb').onclick = () => { if (busy || !keyFn) return; slips++; help++; stars(); tip(explain(steps[k], help > 1)); };
  stars(); arm();
}

soBtn();
seccions();
