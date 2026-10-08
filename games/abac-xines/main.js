import { $, sleep, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { valueOf, tidy, write, plan, nextMove, PROJECTS, CIRCLES, POOL, clean, handIn, exam, examIn, EXAM_PASS, firstTry, isOpen, examOpen, levelText, VALID } from './logic.js';
import { board, HUES } from './board.js';
import { hints } from './hints.js';

const KEY = 'abac-xines';

// Facts only: { so, secs, piscina, notes, exams, fulls }. clean() makes a complete progress out of anything the browser holds (the old { so, secs } too, which
// it translates). It is saved back whole, secs as it came: the new game never writes secs of its own, and nothing it saves is lower than what was loaded.
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen, built once and then updated (so the fill slides): «Nivell 2,27», and the fill is the decimals (27 %), the part of the level
// that is done. It is painted from prog, so it also shows the XP of a save of the old shape before anything is saved, and every save paints it again.
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}

// Every new screen cancels the running one through this token, and lets go of the abacus (and of the hints on it) that it had.
let tok = { on: true }, bd = null, hn = null;
function fresh() { tok.on = false; tok = { on: true }; hn?.stop(); bd?.stop(); bd = hn = null; return tok; }

// each bead clicks with a note of its own (board.js plays it through this tone)
const { tone, chime } = voice(() => prog.so, false);
const FX = pond(tone);

// After a screen or a question comes up, every tap is ignored for SETTLE: a second tap of the same finger must not press what took the place of the first
// button (a «Comprova» twice would count two attempts, and the answer of a question would be recorded twice). The capture phase stops it before any handler.
// Like tryAt, the window is compared with the time of the tap itself (event.timeStamp): a screen that takes longer than SETTLE to build must not let the queued tap through.
const SETTLE = 450;
// A wrong attempt also keeps the next attempt away for SETTLE (tryAt): the second tap of a double tap on «Comprova» must not count as a second mistake. Beads are not held back.
// tryAt is measured in the time of the taps themselves (event.timeStamp, when the finger touched), not in the clock after the handler's work: on a slow tablet the first handler
// may take longer than SETTLE, and the second tap of the same double tap waits in the queue with a time that is still inside the window.
let openAt = 0, tryAt = 0, tight = false;
const ready = at => at >= openAt;
$('#joc').addEventListener('click', e => { if (tight && !ready(e.timeStamp)) e.stopPropagation(); }, true);

/* ---------- the shell: every screen starts with enter() and gets its token back ---------- */
// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /abac-xines\.html$/.test(location.pathname);
// inner screens (a project) show ← Mapa instead of ← Tots els jocs; the sky takes the colour of the circle
function enter(kicker, inner, hue) {
  const t = fresh(); tight = false; openAt = performance.now() + SETTLE;
  $('#app').classList.toggle('wide', inner); $('#joc').classList.toggle('lvl', inner); $('#joc').onclick = null;
  $('#toG').hidden = inner || !HUB; $('#toM').hidden = !inner; $('#kick').textContent = kicker;
  FX.mood(hue);
  return t;
}
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };
$('#toM').onclick = () => mapa();

/* ---------- the map: three bands, one button for each project ---------- */
const HUE = [140, 195, 262];   // the colour of each circle
// a circle of concentric rings, drawn with the rings up to this one filled
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${HUE[c]} 60% 60%)" stroke-width="2.4" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const noteText = n => n >= VALID ? `Nota ${n} · validat ✓` : n ? `Nota ${n} · no validat` : 'Per fer';
// The exam of a circle is one more button in its band, at the end of the projects: active when the circle is open and all its projects are validated (it stays active once
// passed, to do it again). A shut button says what it lacks.
const examBtn = (c, open) => `<button class="proj exam${prog.exams[c] ? ' ok' : ''}" data-x="${c}" aria-label="Examen del cercle ${c}"${examOpen(prog, c) ? '' : ' disabled'}><b>Examen</b><span class="mk">${prog.exams[c] ? 'Superat ✓' : examOpen(prog, c) ? 'Sis preguntes' : open ? 'Valida els projectes' : 'Tancat'}</span></button>`;
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  enter('El mapa', false, 165);
  const band = c => {
    const open = isOpen(prog, c);
    return `<section class="ring r${c}${open ? '' : ' shut'}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${open ? '' : `<p class="why">${c === 0 ? 'Acaba la Piscina per obrir-lo.' : `Supera l'examen del cercle ${c - 1} per obrir-lo.`}</p>`}
      <div class="projs" style="--np:${CIRCLES[c].projects.length}">${CIRCLES[c].projects.map(i => `<button class="proj${prog.notes[i] >= VALID ? ' ok' : ''}" data-p="${i}"${open ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${noteText(prog.notes[i])}</span></button>`).join('')}${examBtn(c, open)}</div></section>`;
  };
  $('#joc').innerHTML = `<div class="map">${CIRCLES.map((_, c) => band(c)).join('')}</div>`;
  $('#joc').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled && ready(e.timeStamp)) projecte(+b.dataset.p);
    else if (x && !x.disabled && ready(e.timeStamp)) examen(+x.dataset.x);
  };
  ($(`#joc [data-p="${here}"]:not(:disabled)`) || $('#joc button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

/* ---------- the Piscina: three numbers, the first thing a profile with nothing saved meets ---------- */
// The number is shown big and the abacus is empty; when it marks the number and is tidy the challenge ends by itself (there is no button). The third one saves piscina
// and opens the map. There is no «← Mapa» here: the map would be a screen with every circle shut and no way back in, so the way out is the page of all games, and a profile
// that leaves in the middle keeps nothing (nothing is saved before the third number).
function piscina() {
  const t = enter('La Piscina', true, 165), root = $('#joc'), goals = POOL.map(Number);
  tight = true; $('#toM').hidden = true; $('#toG').hidden = !HUB;
  root.innerHTML = `<div class="head"><div class="hud"><span class="steps" id="dots" role="img" aria-label="Tres reptes">${goals.map(() => '<i></i>').join('')}</span></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <p class="task big" id="task"></p></div>
    <div class="stage" id="stage"></div>
    <div class="tail" id="tail"></div>`;
  const host = $('#stage'), dots = [...$('#dots').children];
  let k = -1, goal, rods, busy = true;
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  // Every challenge, the first too, ignores taps for SETTLE from the moment its number appears (the capture guard, openAt): a finger still tapping when the pause between two
  // challenges ends must not move a bead of the new abacus before the child has seen the number. It is measured from the new number, never from the old tap, and it only
  // lasts SETTLE: a child who has read the number and starts is never held back.
  function arm() {
    k++; goal = goals[k]; busy = false; rods = write(0, 3); openAt = performance.now() + SETTLE;
    if (!bd) { host.innerHTML = ''; bd = board(host, { n: 3, feet: 'none', tone }); bd.onMove(moved); }
    bd.set(rods); bd.lock(false);
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#task').innerHTML = `<b>${goal}</b>`; tip("Posa el número a l'àbac.");
  }
  function moved(r, m) {
    if (busy) return;
    rods = r;
    if (rods[m.p][m.deck] > m.was) { const c = mid(m.bead); FX.burst(c.x, c.y, m.deck === 'hi' ? 44 : HUES[m.p], 7, c.w * 1.3); }
    if (valueOf(rods) === goal && tidy(rods)) solved();
  }
  // busy first (a second tap finds the challenge over), the board locked; the third number is the end of the Piscina and is saved there and then, before any wait
  async function solved() {
    busy = true; bd.lock(true);
    dots[k].classList.add('ok');
    if (k === goals.length - 1) { prog = { ...prog, piscina: true }; save(); }
    tip(`Sí! L'àbac marca ${goal}.`, 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(k === goals.length - 1 ? 16 : 8);
    await sleep(1100); if (!t.on) return;
    k === goals.length - 1 ? mapa() : arm();
  }
  arm();
}

/* ---------- a project: 15 questions in a row, one abacus ---------- */
const SIGN = { '+': '+', '-': '−', x: '×', ':': ':' };
const FEET = ['full', 'letter', 'none'];   // under the columns of ex00, ex01 and ex02
const llista = a => a.length > 1 ? `${a.slice(0, -1).join(', ')} i ${a[a.length - 1]}` : a[0];

function projecte(i) {
  const P = PROJECTS[i], t = enter(P.name, true, HUE[P.circle]), qs = P.ex.flat(), root = $('#joc');
  here = i; tight = true;
  // three blocks: what is above the abacus, the stage (the box the board measures) and what is under it (style.css)
  root.innerHTML = `<div class="head"><div class="hud col"><nav class="exrow" aria-label="Exercicis">${['ex00', 'ex01', 'ex02'].map(l => `<span>${l}</span>`).join('')}</nav>
      <span class="steps" id="dots" role="img" aria-label="Preguntes">${qs.map((_, j) => `<i${j && j % 5 === 0 ? ' class="gap"' : ''}></i>`).join('')}</span></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <p class="task" id="task"></p></div>
    <div class="stage" id="stage"></div>
    <div class="tail" id="tail"></div>`;
  const host = $('#stage'), tail = $('#tail'), chips = [...root.querySelectorAll('.exrow span')], dots = [...$('#dots').children];
  // run[k] is { tries, helped } of question k, the one thing handIn judges; it is written once, by record(). k is the question on screen.
  const run = [];
  let k = -1, q, pl, n, bn = 0, rods, stage, tries, helped, busy, reading, op, done = null;
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  // the room under the columns, as the spec table «Un projecte» says, for every kind of question: the digits and what they are worth in ex00, the letters in ex01, nothing in ex02 until the hint is asked
  const look = () => { const e = Math.floor(k / 5); return helped && e === 2 ? 'letter' : FEET[e]; };
  const target = () => pl.stages[Math.min(stage, pl.stages.length - 1)];
  const start = () => reading ? "Mira l'àbac i tria el nombre que marca." : op ? "Fes l'operació a l'àbac i prem Comprova." : "Posa el número a l'àbac i prem Comprova.";

  function arm() {
    k++; q = qs[k]; reading = q.read != null;
    pl = reading ? { start: q.read, stages: [q.read], goal: q.read } : plan(q.q);
    n = Math.max(3, String(Math.max(pl.start, ...pl.stages)).length);
    op = !reading && /\D/.test(q.q);
    tries = 0; helped = false; busy = false; stage = 0; rods = write(pl.start, n); openAt = performance.now() + SETTLE;
    tryAt = 0; hn?.stop();
    // one abacus for the questions with the same number of columns; another when the number changes
    if (!bd || bn !== n) {
      bd?.stop(); host.innerHTML = ''; bd = board(host, { n, feet: look(), tone }); hn = hints(bd); bn = n;
      bd.onMove(moved);
      // a question of reading does not let the beads move (the board is locked): say why when one is touched
      bd.el.addEventListener('click', e => { if (reading && !busy && e.target.closest('.bead')) tip("En aquesta pregunta les boles no es mouen. Llegeix el nombre i tria'l a sota."); });
    }
    for (const b of bd.el.querySelectorAll('.wave')) b.classList.remove('wave');
    bd.set(rods); bd.lock(reading); bd.feet(look());
    chips.forEach((c, j) => c.classList.toggle('on', j === Math.floor(k / 5))); dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    tail.innerHTML = reading ? `<div class="opts">${q.opts.map(v => `<button class="btn soft" data-v="${v}">${v}</button>`).join('')}<button class="btn soft" id="hintb">Dona'm una pista</button></div>`
      : `<div class="acts"><button class="btn" id="chk">Comprova</button><button class="btn soft" id="rst">Reinicia</button><button class="btn soft" id="hintb">Dona'm una pista</button></div>`;
    $('#task').innerHTML = reading ? "Quin nombre marca l'àbac?" : op ? q.q.replace(/\D/g, o => ` ${SIGN[o]} `) + ' = <b>?</b>' : `Escriu el <b>${q.q}</b>`;
    tip(start());
  }
  function oops(txt) {
    const ab = bd.el; ab.classList.remove('shake'); void ab.offsetWidth; ab.classList.add('shake'); tone(150, 0, 0.45, 0.16, 'triangle');
    tip(txt, 'oops');
  }
  // The answer to the question on screen, kept once. The last one hands the project in at once, before any wait: leaving in the pause keeps the mark, and
  // leaving earlier keeps nothing (prog is replaced here and nowhere else, so the button of the sound never saves a mark that was not earned).
  function record() {
    run[k] = { tries, helped }; dots[k].classList.add(firstTry(run[k]) ? 'ok' : 'late');
    if (k === qs.length - 1) { done = handIn(prog, i, run); prog = done.prog; save(); }
  }
  const next = () => k === qs.length - 1 ? finish() : arm();
  async function right() {
    busy = true; hn.stop(); bd.lock(true); record();
    const lit = [...bd.el.querySelectorAll('.bead.on')];
    tip(reading ? `Sí! L'àbac marca ${pl.goal}.` : `Correcte! L'àbac marca ${pl.goal}.`, 'go');
    if (op) $('#task').lastElementChild.textContent = pl.goal;
    lit.forEach((b, j) => { const p = mid(b), h = b.dataset.deck === 'hi' ? 44 : HUES[b.dataset.p]; b.style.setProperty('--d', j * 70); b.classList.add('wave'); FX.burst(p.x, p.y, h, 12, p.w * 2); });
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(k === qs.length - 1 ? 16 : 8);
    await sleep(1100); if (!t.on) return;
    next();
  }
  // the second mistake: the question is recorded as missed, and the abacus solves itself step by step (the board is locked while it does) before the next one
  async function solve() {
    busy = true; record(); bd.lock(true); tip('Mira com es fa, pas a pas.', 'oops');
    await hn.play(pl.goal, () => t.on);
    if (!t.on) return;
    rods = bd.rods();   // play moves the beads through set(), which does not tell onMove
    tip(`Ara l'àbac marca ${pl.goal}.${k === qs.length - 1 ? '' : ' Passem a la pregunta següent.'}`);
    await sleep(900); if (!t.on) return;
    next();
  }
  function check(at) {
    if (busy || at < tryAt) return;
    const v = valueOf(rods);
    if (v === pl.goal && tidy(rods)) return right();
    tries++; tryAt = at + SETTLE;   // the right number on an abacus that is not tidy is a miss too
    if (tries > 1) return solve();
    hn.strip(pl.goal);
    oops(v !== pl.goal ? `Ara l'àbac marca ${v}; ha de marcar ${pl.goal}.` : "El nombre és correcte, però cal endreçar l'àbac: fes el canvi.");
  }
  // the hint: the question stops counting (before anything is drawn: the strip of a question of reading prints the answer), and the move to make is drawn on the abacus
  function hint() {
    if (busy) return;
    helped = true; bd.feet(look());
    if (reading) { hn.strip(); return tip('Mira què val cada bola i suma-ho.'); }
    const to = target(), m = nextMove(rods, to);
    hn.strip(to);
    if (!m) return tip("L'àbac ja marca el resultat. Prem Comprova!", 'go');
    hn.show(m, to); tip("Mira la pista dibuixada sobre l'àbac.");
  }
  function moved(r, m) {
    if (busy) return;
    rods = r; hn.stop();
    const j = pl.stages.lastIndexOf(valueOf(rods)); if (j >= stage) stage = j + 1;
    if (rods[m.p][m.deck] > m.was) { const c = mid(m.bead); FX.burst(c.x, c.y, m.deck === 'hi' ? 44 : HUES[m.p], 7, c.w * 1.3); }
  }
  // the end: the mark, what it gives, what to go over and the badges that came with it
  function finish() {
    const r = done; hn.stop(); bd.lock(true);
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    openAt = performance.now() + SETTLE;   // the buttons of the panel ignore a tap that was meant for what was here before
    r.n >= VALID ? chime([523, 659, 784, 1047, 1319]) : tone(196, 0, 0.5, 0.12, 'triangle');
    tip(r.n >= VALID ? 'Projecte acabat!' : 'Projecte acabat. Mira què cal repassar.', r.n >= VALID ? 'go' : '');
    panel(host, `<h2>Nota ${r.n}</h2>
      <p class="lead${r.n >= VALID ? ' go' : ''}">${r.n >= VALID ? `Validat ✓${r.gain ? ` · +${r.gain} XP` : ''}` : r.best >= VALID ? `Aquesta vegada no arriba a ${VALID}, però ja el tens validat.` : `Per validar cal una nota de ${VALID}.`}</p>
      ${r.redo.length ? `<p class="lead">Per repassar: ${llista(r.redo)}.</p>` : ''}
      ${r.best && r.best >= r.n ? `<p class="lead">La teva millor nota continua sent ${r.best}.</p>` : ''}
      ${r.news.length ? `<p class="lead go">${r.news.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${llista(r.news)}</p>` : ''}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Torna-hi</button>`);
  }

  root.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.id === 'bk') mapa();
    else if (b.id === 'rp') projecte(i);
    else if (b.id === 'chk') check(e.timeStamp);
    else if (b.id === 'hintb') hint();
    else if (b.id === 'rst') { if (busy) return; rods = write(pl.start, n); stage = 0; hn.stop(); bd.set(rods); tip(start()); tone(330, 0, 0.12, 0.06); }
    else if ('v' in b.dataset) {
      if (busy || e.timeStamp < tryAt) return;
      if (+b.dataset.v === pl.goal) return right();
      tries++; tryAt = e.timeStamp + SETTLE; b.disabled = true; oops("No és aquest. Compta les boles que toquen la barra.");
    }
  };
  arm();
}

/* ---------- the exam of a circle: six questions of its projects, one answer each, no hints, saved by the sixth ---------- */
// Each question is answered once (right or wrong) and then «Segueix» moves on; the abacus is bare (feet 'none') and there is no hint button. Nothing is saved before the
// sixth answer, so leaving in the middle keeps nothing; the sixth is handed in at once (examIn), before any wait, so leaving in the pause after it keeps the result.
function examen(c) {
  const t = enter(`Examen del cercle ${c}`, true, HUE[c]), qs = exam(c, Math.random), root = $('#joc');
  tight = true;
  root.innerHTML = `<div class="head"><div class="hud"><span class="steps" id="dots" role="img" aria-label="Sis preguntes">${qs.map(() => '<i></i>').join('')}</span></div>
      <p class="status tip" id="tip" role="status" aria-live="polite"></p>
      <p class="task" id="task"></p></div>
    <div class="stage" id="stage"></div>
    <div class="tail" id="tail"></div>`;
  const host = $('#stage'), tail = $('#tail'), dots = [...$('#dots').children];
  // run[k] is true when question k was right at its one answer; res is what examIn says once the sixth is in
  const run = [];
  let k = -1, q, pl, n, bn = 0, rods, busy, reading, op, res = null;
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const start = () => reading ? "Mira l'àbac i tria el nombre que marca." : op ? "Fes l'operació a l'àbac i prem Comprova." : "Posa el número a l'àbac i prem Comprova.";

  function arm() {
    k++; q = qs[k]; reading = q.read != null;
    pl = reading ? { start: q.read, goal: q.read } : plan(q.q);
    n = Math.max(3, String(Math.max(pl.start, ...(pl.stages || []))).length);
    op = !reading && /\D/.test(q.q);
    busy = false; rods = write(pl.start, n); openAt = performance.now() + SETTLE;
    if (!bd || bn !== n) {
      bd?.stop(); host.innerHTML = ''; bd = board(host, { n, feet: 'none', tone }); bn = n;
      bd.onMove(moved);
      bd.el.addEventListener('click', e => { if (reading && !busy && e.target.closest('.bead')) tip("En aquesta pregunta les boles no es mouen. Llegeix el nombre i tria'l a sota."); });
    }
    for (const b of bd.el.querySelectorAll('.wave')) b.classList.remove('wave');
    bd.set(rods); bd.lock(reading);
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    tail.innerHTML = reading ? `<div class="opts">${q.opts.map(v => `<button class="btn soft" data-v="${v}">${v}</button>`).join('')}<button class="btn" id="nx" disabled>Segueix</button></div>`
      : `<div class="acts two"><button class="btn" id="chk">Comprova</button><button class="btn soft" id="nx" disabled>Segueix</button></div>`;
    $('#task').innerHTML = reading ? "Quin nombre marca l'àbac?" : op ? q.q.replace(/\D/g, o => ` ${SIGN[o]} `) + ' = <b>?</b>' : `Escriu el <b>${q.q}</b>`;
    tip(start());
  }
  // The answer of the question on screen, kept once. The sixth is handed in here (examIn), nothing before it is saved.
  function log(ok) {
    run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (k === qs.length - 1) { res = examIn(prog, c, qs, run); res.first = res.good && !prog.exams[c]; prog = res.prog; save(); }
  }
  // busy first (a second tap, or another option together with the first, finds the question answered), then the answer is kept; «Segueix» comes after a pause
  async function answer(ok, said) {
    busy = true; bd.lock(true); log(ok);
    for (const b of tail.querySelectorAll('button:not(#nx)')) b.disabled = true;
    if (ok) { tip(`Correcte! L'àbac marca ${pl.goal}.`, 'go'); chime([523, 659, 784]); FX.celebrate(k === qs.length - 1 ? 16 : 6); }
    else { tip(said, 'oops'); tone(150, 0, 0.45, 0.16, 'triangle'); }
    if (op) $('#task').lastElementChild.textContent = pl.goal;
    await sleep(600);
    if (!t.on) return;   // left during the pause: this screen is over, «Segueix» is not for it to enable
    const nx = $('#nx'); nx.disabled = false; nx.focus({ preventScroll: true });
  }
  function check() {
    if (busy) return;
    const v = valueOf(rods);
    answer(v === pl.goal && tidy(rods), v === pl.goal ? "El nombre és correcte, però l'àbac no està endreçat." : `L'àbac marcava ${v}; havia de marcar ${pl.goal}.`);
  }
  function moved(r, m) {
    if (busy) return;
    rods = r;
    if (rods[m.p][m.deck] > m.was) { const b = mid(m.bead); FX.burst(b.x, b.y, m.deck === 'hi' ? 44 : HUES[m.p], 7, b.w * 1.3); }
  }
  // the end: how many were right, whether the exam is passed and what that gives and opens, and what to go over
  function finish() {
    const r = res; bd.lock(true);
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    openAt = performance.now() + SETTLE;   // the buttons of the panel ignore a tap that was meant for what was here before
    r.good ? chime([523, 659, 784, 1047, 1319]) : tone(196, 0, 0.5, 0.12, 'triangle');
    tip(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    panel(host, `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${llista(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}
      ${r.news.length ? `<p class="lead go">${r.news.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${llista(r.news)}</p>` : ''}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
  }

  root.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.id === 'bk') mapa();
    else if (b.id === 'rp') examen(c);
    else if (b.id === 'chk') check();
    else if (b.id === 'nx') k === qs.length - 1 ? finish() : arm();
    else if ('v' in b.dataset) { if (!busy) answer(+b.dataset.v === pl.goal, `No és aquest: l'àbac marcava ${pl.goal}.`); }
  };
  arm();
}

soBtn(); paintXp();
prog.piscina ? mapa() : piscina();
