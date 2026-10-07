import { $, sleep, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { valueOf, tidy, write, plan, nextMove, PROJECTS, CIRCLES, clean, handIn, firstTry, isOpen, VALID } from './logic.js';
import { board, HUES } from './board.js';
import { hints } from './hints.js';

const KEY = 'abac-xines';

// Facts only: { so, secs, piscina, notes, exams, fulls }. clean() makes a complete progress out of anything the browser holds (the old { so, secs } too, which
// it translates). It is saved back whole, secs as it came: the new game never writes secs of its own, and nothing it saves is lower than what was loaded.
let prog = clean(load(KEY));
const save = () => store(KEY, prog);

// Every new screen cancels the running one through this token, and lets go of the abacus (and of the hints on it) that it had.
let tok = { on: true }, bd = null, hn = null;
function fresh() { tok.on = false; tok = { on: true }; hn?.stop(); bd?.stop(); bd = hn = null; return tok; }

// each bead clicks with a note of its own (board.js plays it through this tone)
const { tone, chime } = voice(() => prog.so, false);
const FX = pond(tone);

// After a screen or a question comes up, every tap is ignored for SETTLE: a second tap of the same finger must not press what took the place of the first
// button (a «Comprova» twice would count two attempts, and the answer of a question would be recorded twice). The capture phase stops it before any handler.
const SETTLE = 450;
// A wrong attempt also keeps the next attempt away for SETTLE (tryAt): the second tap of a double tap on «Comprova» must not count as a second mistake. Beads are not held back.
let openAt = 0, tryAt = 0, tight = false;
const ready = () => performance.now() >= openAt;
$('#joc').addEventListener('click', e => { if (tight && !ready()) e.stopPropagation(); }, true);

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
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  enter('El mapa', false, 165);
  const band = c => {
    const open = isOpen(prog, c);
    return `<section class="ring r${c}${open ? '' : ' shut'}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${open ? '' : `<p class="why">${c === 0 ? 'Acaba la Piscina per obrir-lo.' : `Supera l'examen del cercle ${c - 1} per obrir-lo.`}</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${prog.notes[i] >= VALID ? ' ok' : ''}" data-p="${i}"${open ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${noteText(prog.notes[i])}</span></button>`).join('')}</div></section>`;
  };
  $('#joc').innerHTML = `<div class="map">${CIRCLES.map((_, c) => band(c)).join('')}</div>`;
  $('#joc').onclick = e => {
    const b = e.target.closest('.proj');
    if (b && !b.disabled && ready()) projecte(+b.dataset.p);
  };
  ($(`#joc [data-p="${here}"]:not(:disabled)`) || $('#joc button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
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
  // the room under the columns: the digits and what they are worth in ex00, the letters in ex01, nothing in ex02 until the hint is asked (and never the answer of a question of reading)
  const look = () => { const e = Math.floor(k / 5); return reading ? (e < 2 ? 'letter' : 'none') : helped && e === 2 ? 'letter' : FEET[e]; };
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
    tip(`Ara l'àbac marca ${pl.goal}. Passem a la pregunta següent.`);
    await sleep(900); if (!t.on) return;
    next();
  }
  function check() {
    if (busy || performance.now() < tryAt) return;
    const v = valueOf(rods);
    if (v === pl.goal && tidy(rods)) return right();
    tries++; tryAt = performance.now() + SETTLE;   // the right number on an abacus that is not tidy is a miss too
    if (tries > 1) return solve();
    hn.strip(pl.goal);
    oops(v !== pl.goal ? `Ara l'àbac marca ${v}; ha de marcar ${pl.goal}.` : "El nombre és correcte, però cal endreçar l'àbac: fes el canvi.");
  }
  // the hint: the question stops counting (before anything is drawn: the strip of a question of reading prints the answer), and the move to make is drawn on the abacus
  function hint() {
    if (busy) return;
    helped = true;
    if (reading) { hn.strip(); return tip('Mira què val cada bola i suma-ho.'); }
    const to = target(), m = nextMove(rods, to);
    bd.feet(look());
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
    else if (b.id === 'chk') check();
    else if (b.id === 'hintb') hint();
    else if (b.id === 'rst') { if (busy) return; rods = write(pl.start, n); stage = 0; hn.stop(); bd.set(rods); tip(start()); tone(330, 0, 0.12, 0.06); }
    else if ('v' in b.dataset) {
      if (busy || performance.now() < tryAt) return;
      if (+b.dataset.v === pl.goal) return right();
      tries++; tryAt = performance.now() + SETTLE; b.disabled = true; oops("No és aquest. Compta les boles que toquen la barra.");
    }
  };
  arm();
}

soBtn();
mapa();
