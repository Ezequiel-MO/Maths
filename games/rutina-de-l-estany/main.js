// La rutina de l'estany: the screens. Home (what today brings and the grid of the tables), the routine (the capsetes, then the
// trucs) and the end. Not a cursus: it takes only the frame of shared/shell.js.
import { $, sleep } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { load, save as store } from '../../shared/progress.js';
import { SETTLE, tokens, soundButton } from '../../shared/shell.js';
import { FACTS, clean, dayOf, plan, ask, answer, finish, trucs, family, stage, known, doneToday, factAt, TRUCS } from './logic.js';

const KEY = 'rutina-de-l-estany';
let prog = clean(load(KEY));
const save = () => store(KEY, prog);
let keyFn = null;
const fresh = tokens(() => { keyFn = null; });
addEventListener('keydown', e => { if (keyFn) keyFn(e); });
const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));
const game = $('#game');
const again = el => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

function top() {
  $('#kick').textContent = 'Rutina diària';
  $('#xp').innerHTML = prog.dies ? `<span class="chip">${prog.dies} ${prog.dies === 1 ? 'dia' : 'dies'} de rutina</span>` : '';
  soBtn();
}

// the grid of the tables, 2 to 9: each square coloured by how well its fact is known; the known ones show their product
const NAMES = ['per descobrir', 'aprenent', 'gairebé', 'sabuda'];
function grid() {
  const ns = [2, 3, 4, 5, 6, 7, 8, 9];
  const cell = (a, b) => { const s = stage(prog, factAt(a, b)); return `<td class="s${s}" title="${a} × ${b}: ${NAMES[s]}">${s === 3 ? a * b : ''}</td>`; };
  return `<table class="grid" aria-label="Les taules: ${known(prog)} de ${FACTS.length} sabudes">
    <tr><th>×</th>${ns.map(b => `<th>${b}</th>`).join('')}</tr>
    ${ns.map(a => `<tr><th>${a}</th>${ns.map(b => cell(a, b)).join('')}</tr>`).join('')}
  </table>
  <p class="legend">${NAMES.map((n, s) => `<span><i class="s${s}"></i>${n}</span>`).join('')}</p>
  <p class="lead">Ja en saps <b>${known(prog)} de ${FACTS.length}</b>.</p>`;
}

function home() {
  const t = fresh(), today = dayOf(), done = doneToday(prog, today);
  top();
  const n = done ? 0 : plan(prog, today).length;
  game.innerHTML = `
    <p class="lead">${done ? "La rutina d'avui ja està feta. Torna demà!" : `Avui toca: <b>${n} taules</b> i <b>${TRUCS} trucs</b>. Uns cinc minuts.`}</p>
    ${grid()}
    <div class="row">${done ? '<button class="btn soft" id="more">Practica una mica més</button>' : '<button class="btn" id="go">Comença</button>'}</div>`;
  const openAt = performance.now() + SETTLE;
  const go = more => { if (t.on && performance.now() >= openAt) routine(more); };
  $('#go')?.addEventListener('click', () => go(false));
  $('#more')?.addEventListener('click', () => go(true));
}

/* ---------- one question: the capseta with a number missing, or a truc; the keys of a number ---------- */
const slot = '<span class="slot"><i class="caret"></i></span>';
function capseta(q) {
  const v = h => q.hole === h ? slot : h === 'top' ? q.prod : h === 'l' ? q.x : q.y;
  return `<div class="capsa" aria-label="Capseta: ${q.hole === 'top' ? '?' : q.prod} a dalt, ${q.hole === 'l' ? '?' : q.x} i ${q.hole === 'r' ? '?' : q.y} a baix">
    <div class="c-top${q.hole === 'top' ? ' hole' : ''}">${v('top')}</div>
    <div class="c-l${q.hole === 'l' ? ' hole' : ''}">${v('l')}</div><div class="c-r${q.hole === 'r' ? ' hole' : ''}">${v('r')}</div>
  </div>`;
}
const keys = `<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
  <button class="key" data-d="del" aria-label="Esborra">⌫</button><button class="key" data-d="0">0</button><button class="key ok" data-d="ok" aria-label="Envia">✓</button></div>`;

// shows one question and gives a promise: true when it was answered right, false when ✓ sent a wrong number
function question(t, item, pos, total) {
  const q = item.q;
  game.innerHTML = `
    <div class="bar" role="img" aria-label="${pos} de ${total}"><i style="width:${Math.round(100 * pos / total)}%"></i></div>
    <p class="kicker">${item.type === 'truc' ? 'Truc' : 'Taules'} · ${pos + 1} de ${total}</p>
    ${item.type === 'truc' ? `<p class="known">Ja saps que <b>${q.known}</b>.</p><p class="eq">${q.text} = ${slot}</p>`
      : `${capseta(q)}<p class="eq">${q.text ? `${q.text} = ${slot}` : 'Quin número falta a la capseta?'}</p>`}
    <p class="tip" id="tip" aria-live="polite"></p>
    <div id="ans">${keys}</div>`;
  let buf = '', busy = false;
  const openAt = performance.now() + SETTLE;
  // what is shown once it is answered: the four operations of the capseta, or how the truc goes
  const explain = () => { if (item.type === 'taula') $('#tip').innerHTML = family(q).map(s => `<span>${s}</span>`).join(' '); else $('#tip').textContent = q.tip; };
  const paint = () => game.querySelectorAll('.slot').forEach(s => { s.innerHTML = buf || '<i class="caret"></i>'; });
  return new Promise(done => {
    const right = () => {
      busy = true; explain(); game.querySelectorAll('.slot').forEach(s => s.classList.add('ok'));
      chime([660, 880, 1100]); const b = $('.capsa, .eq')?.getBoundingClientRect(); if (b) FX.burst(b.left + b.width / 2, b.top + b.height / 2, 150, 14, 4);
      done(true);
    };
    const wrong = () => {
      busy = true; explain(); tone(220, 0, 0.3, 0.12, 'triangle');
      game.querySelectorAll('.slot').forEach(s => { s.classList.add('no'); s.textContent = q.ans; again(s); });
      $('#ans').innerHTML = '<button class="btn soft" id="next">Continua</button>';
      const at = performance.now() + SETTLE;
      $('#next').onclick = () => { if (t.on && performance.now() >= at) done(false); };
    };
    function press(d) {
      if (busy || !t.on || performance.now() < openAt) return;
      if (d === 'ok') { if (buf) { if (+buf === q.ans) right(); else wrong(); } return; }
      if (d === 'del') buf = buf.slice(0, -1); else if (buf.length < 3) buf = (buf + d).replace(/^0+(?=\d)/, ''); else return;
      click(500, 0, 0.08, 0.1); paint();
      // the right number is taken as soon as it is written, with no ✓; a wrong one waits for ✓ (1 may still become 12)
      if (d !== 'del' && +buf === q.ans) right();
    }
    $('#ans').onclick = e => { const b = e.target.closest('[data-d]'); if (b) press(b.dataset.d); };
    keyFn = e => { const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null; if (d && !busy) { e.preventDefault(); press(d); } };
  });
}

/* ---------- the routine: the capsetes (a miss comes back once at the end), then the trucs ---------- */
async function routine(more) {
  const t = fresh(), today = dayOf();
  const queue = plan(prog, today, Math.random, more).map(i => ({ type: 'taula', i }));
  if (!more) queue.push(...trucs(prog).map(q => ({ type: 'truc', q })));
  let firsts = 0, asked = 0;
  for (let k = 0; k < queue.length; k++) {
    const item = queue[k];
    if (item.type === 'taula') item.q = ask(prog, item.i);
    const ok = await question(t, item, k, queue.length);
    if (!t.on) return;
    if (item.type === 'taula') {
      answer(prog, item.i, ok, today);
      if (!item.back) { asked++; if (ok) firsts++; }
      if (!ok && !item.back) queue.push({ type: 'taula', i: item.i, back: true });
    } else { asked++; if (ok) { firsts++; prog.trucs += 1; } }
    save();
    // a right answer stays on screen a moment, with its explanation; a wrong one already waited for «Continua»
    if (ok) { await sleep(item.type === 'truc' ? 1900 : 1100); if (!t.on) return; }
  }
  if (!more) finish(prog, today);
  save();
  end(t, firsts, asked, more);
}

function end(t, firsts, asked, more) {
  top();
  FX.celebrate(); chime([523, 659, 784, 1047], 0.1);
  game.innerHTML = `
    <div class="panel">
      <p class="big">${more ? 'Pràctica feta!' : 'Rutina feta!'}</p>
      <p class="lead">${firsts} de ${asked} a la primera.${more ? '' : ` Portes <b>${prog.dies} ${prog.dies === 1 ? 'dia' : 'dies'}</b> de rutina.`}</p>
    </div>
    ${grid()}
    <div class="row"><a class="btn" href="index.html">Tots els jocs</a><button class="btn soft" id="home">Inici</button></div>`;
  const openAt = performance.now() + SETTLE;
  $('#home').onclick = () => { if (t.on && performance.now() >= openAt) home(); };
}

home();
