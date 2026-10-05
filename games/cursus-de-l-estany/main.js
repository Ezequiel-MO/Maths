import { $, RM, sleep, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, clean, xpOf, levelText, isOpen, examOpen, BADGES, badges, TEAMS, VALID, right, tipFor, explain, said, handIn, firstTry } from './logic.js';
import { fireflies, FIGURES, how, KEYS, boxes, labelsOf } from './material.js';

const KEY = 'cursus-de-l-estany';

// Facts only: { so, piscina, equip, notes, exams, fulls }. clean() makes a complete progress inside its limits out of anything the browser
// holds (not JSON, a string, notes that are not a list ...). XP, level and badges are worked out when painted, never kept.
let prog = clean(load(KEY));
function save() { const { so, piscina, equip, notes, exams, fulls } = prog; store(KEY, { so, piscina, equip, notes, exams, fulls }); paintXp(); }

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);

const SETTLE = 450;   // after a screen comes up, touches on what advances are ignored for this long: a second tap must not press what is under the first
let openAt = 0, keyFn = null;
const ready = () => performance.now() >= openAt;
const hsl = (h, l = 62) => `hsl(${h} 75% ${l}%)`;

/* ---------- the shell: every screen starts with enter() and gets its token back ---------- */
// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /cursus-de-l-estany\.html$/.test(location.pathname);
// inner screens show ← Mapa instead of ← Tots els jocs; the pond drifts to the colour of the team once there is one
function enter(kicker, inner) {
  const t = fresh(); keyFn = null; openAt = performance.now() + SETTLE;
  $('#app').classList.toggle('wide', inner); $('#toG').hidden = inner || !HUB; $('#toM').hidden = !inner; $('#kick').textContent = kicker;
  $('#game').onclick = null; FX.mood(TEAMS[prog.equip]?.hue ?? 165); paintXp();
  return t;
}
$('#toM').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };
// The keys on the screen and a real keyboard both end up in keyFn (set by a screen that types; the arrows come as 'next' and 'prev'); keyFn says false when the
// keys are not live, and then the key keeps its own job. This is the rule of the shell for every screen: while the keys are live Enter is ✓, unless the focus is on a
// control that is not part of the figure (the hint, a «Segueix», the choices of a later screen) and nothing was typed since it took the focus: then Enter is that
// control's. Pads, cells and boxes are the figure's and never swallow it. No screen blurs anything: the focus (so the Tab order) stays where the child put it.
let typed = false;
addEventListener('focusin', () => { typed = false; });
addEventListener('keydown', e => {
  if (!keyFn || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === 'ArrowRight' ? 'next' : e.key === 'ArrowLeft' ? 'prev' : /^\d$/.test(e.key) ? e.key : null;
  const own = e.target.closest?.('button:not([data-k]):not(.mat *), a');   // a control that is not a key and not part of the figure
  if (!k || (own && k === 'ok' && !typed) || keyFn(k) === false) return;
  e.preventDefault(); if (k !== 'ok') typed = true;
});

// one emblem per team, drawn in the colour of the team (currentColor)
const EMBLEM = [
  '<ellipse cx="-9" cy="-6" rx="9" ry="4" transform="rotate(-20 -9 -6)" opacity=".7"/><ellipse cx="9" cy="-6" rx="9" ry="4" transform="rotate(20 9 -6)" opacity=".7"/><ellipse cx="-8" cy="3" rx="8" ry="3.5" transform="rotate(15 -8 3)" opacity=".7"/><ellipse cx="8" cy="3" rx="8" ry="3.5" transform="rotate(-15 8 3)" opacity=".7"/><rect x="-2" y="-12" width="4" height="30" rx="2"/><circle cy="-13" r="4"/>',
  '<path d="M-1 -12C8 -12 8 -2 2 2C-4 6 -2 12 6 17" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M-3 -4L-13 -8M5 -4L14 -8M-2 6L-11 10M3 6L12 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="-1" cy="-13" r="6"/><circle cx="-4" cy="-15" r="1.4" fill="#04131C"/><circle cx="2" cy="-15" r="1.4" fill="#04131C"/>',
  '<ellipse cx="-7" cy="-5" rx="8" ry="3.5" transform="rotate(-30 -7 -5)" opacity=".6"/><ellipse cx="7" cy="-5" rx="8" ry="3.5" transform="rotate(30 7 -5)" opacity=".6"/><ellipse cy="-2" rx="5" ry="8"/><circle cy="-11" r="3.6"/><circle cy="10" r="6" fill="#FFF3C4"/>'
];
const emblem = i => `<svg viewBox="-20 -20 40 40" aria-hidden="true">${EMBLEM[i]}</svg>`;

// The bar at the top of every screen, built once and then updated (so the fill slides): "Nivell 2,37", the fill is the decimals, the team's emblem.
function paintXp() {
  const box = $('#xp'), lv = levelText(xpOf(prog)), pct = +lv.split(',')[1], team = TEAMS[prog.equip];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span><span class="xp-team" role="img" hidden></span>';
  const [n, bar, em] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
  em.hidden = !team; if (team) { em.innerHTML = emblem(prog.equip); em.setAttribute('aria-label', `Equip ${team.name}`); }
  box.style.setProperty('--tc', team ? hsl(team.hue) : 'var(--sun)');
}
const MISS = 'Oh! No tots en tenen les mateixes. Les cuques tornen: prova-ho una altra vegada.';
const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };

/* ---------- the Piscina: three sharings with no numbers, then the team ---------- */
const POOL = [{ D: 6, d: 2 }, { D: 12, d: 3 }, { D: 15, d: 5 }];
function piscina() {
  const t = enter('La Piscina', true);
  $('#game').innerHTML = `<div class="hud"><span class="steps" role="img" aria-label="Tres reptes">${POOL.map(() => '<i></i>').join('')}</span></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p><div class="stage pool" id="stage"></div>`;
  const stage = $('#stage'), dots = [...document.querySelectorAll('.steps i')];
  function step(k) {
    tip('Toca un nenúfar: hi vola una cuca. Que a tots els nenúfars els en toquin les mateixes.');
    fireflies(stage, POOL[k], { t,
      onMiss: () => { tone(150, 0, 0.45, 0.16, 'triangle'); tip(MISS, 'oops'); },
      onDone: async () => {
        dots[k].classList.add('ok'); tip('Sí! Tots els nenúfars en tenen les mateixes.', 'go'); tone(784, 0, 0.14, 0.08); tone(1047, 0.1, 0.2, 0.08);
        const p = mid(stage); FX.burst(p.x, p.y, 48, 30, 190); FX.ring(p.x, p.y, 48, 10, 90);
        await sleep(1100); if (!t.on) return;
        k < POOL.length - 1 ? step(k + 1) : team(t, stage);
      } });
  }
  step(0);
}
// The panel is built once the last tap has long passed, so a second tap on the last pad cannot choose a team. Choosing ends the Piscina: it is saved
// there and then, and only the walk to the map waits.
async function team(t, stage) {
  stage.innerHTML = ''; tip('Quin equip vols ser?'); await sleep(SETTLE); if (!t.on) return;
  chime([523, 659, 784]);
  panel(stage, `<h2>Tria el teu equip</h2><p class="lead">Serà el teu equip durant tot el cursus.</p><div class="teams">${TEAMS.map((m, i) =>
    `<button class="team" data-t="${i}" style="--tc:${hsl(m.hue)}"><span>${emblem(i)}</span><b>${m.name}</b></button>`).join('')}</div>`);
  let chosen = false;
  stage.onclick = async e => {
    const b = e.target.closest('.team'); if (!b || chosen) return;
    chosen = true; prog.piscina = true; prog.equip = +b.dataset.t; save(); FX.mood(TEAMS[prog.equip].hue);
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(8); tip(`Ja ets de l'equip ${TEAMS[prog.equip].name}!`, 'go');
    await sleep(1400); if (t.on) mapa();
  };
}

/* ---------- the map ---------- */
// three circles of concentric rings, drawn with the rings up to this one filled
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${[140, 195, 262][c]} 60% 60%)" stroke-width="2.4" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const noteText = n => n >= VALID ? `Nota ${n} · validat ✓` : n ? `Nota ${n} · no validat` : 'Per fer';
// what to do next, in the order the circles go: the Piscina, the projects of the first circle whose exam is not passed, that exam, the end
function nextTip() {
  if (!prog.piscina) return 'Abans de res, cal fer la Piscina.';
  const c = [0, 1, 2].find(x => !prog.exams[x]);
  if (c === undefined) return 'Has superat els tres exàmens: el cursus és complet! Pots tornar a fer projectes per pujar la nota, o corregir fulls.';
  if (examOpen(prog, c)) return `Tens validats tots els projectes del cercle ${c}: ja pots fer-ne l'examen!`;
  return `Cercle ${c}: valida ${CIRCLES[c].projects.filter(i => prog.notes[i] < VALID).map(i => PROJECTS[i].name).join(', ')} (nota de 80 o més) per obrir-ne l'examen.`;
}
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  const t = enter('El mapa', false), got = badges(prog);
  // a save with the Piscina done and no team (damaged, or from before the team panel): choose one first
  if (prog.piscina && prog.equip < 0) {
    $('#kick').textContent = 'El teu equip'; $('#game').innerHTML = '<p class="status tip" id="tip" role="status" aria-live="polite"></p><div class="stage pool" id="stage"></div>';
    return team(t, $('#stage'));
  }
  const ring = (c) => {
    const open = isOpen(prog, c), exam = examOpen(prog, c), todo = CIRCLES[c].projects.filter(i => prog.notes[i] < VALID).map(i => PROJECTS[i].name);
    return `<section class="ring r${c}${open ? '' : ' shut'}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${open ? '' : `<p class="why">${c === 0 ? 'Acaba la Piscina per obrir aquest cercle.' : `Supera l'examen del cercle ${c - 1} per obrir aquest cercle.`}</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${prog.notes[i] >= VALID ? ' ok' : ''}" data-p="${i}"${open ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${noteText(prog.notes[i])}</span></button>`).join('')}</div>
      <button class="exam${prog.exams[c] ? ' pass' : ''}" data-x="${c}"${exam ? '' : ' disabled'}><b>Examen del cercle ${c}</b><span>${prog.exams[c] ? 'Superat ✓ · el pots repetir' : exam ? 'Obert: fes-lo quan vulguis' : open ? `Falta validar: ${todo.join(', ')}` : 'Primer cal obrir el cercle'}</span></button></section>`;
  };
  $('#game').innerHTML = `<p class="status tip" id="tip">${nextTip()}</p>
    <div class="map">${prog.piscina ? '' : '<button class="btn" id="pool">Fes la Piscina</button>'}${CIRCLES.map((_, c) => ring(c)).join('')}
      <button class="btn soft" id="cor"${prog.piscina ? '' : ' disabled'}>Caça l'errada</button></div>
    <h2 class="bh">Insígnies</h2><ul class="badges" aria-label="Insígnies">${BADGES.map((b, i) => `<li class="bd${got[i] ? ' got' : ''}"><b>${b.name}</b><span>${b.what}</span><span class="st">${got[i] ? 'Aconseguida ✓' : 'Encara no'}</span></li>`).join('')}</ul>`;
  $('#game').onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.disabled || !ready()) return;
    if (b.dataset.p) projecte(+b.dataset.p); else if (b.dataset.x) examen(+b.dataset.x); else if (b.id === 'cor') corregir(); else if (b.id === 'pool') piscina();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

// Screens still to come; each one starts with `const t = enter(kicker, true)` and ends in mapa(). For now they take the child straight back.
/* ---------- a project: three exercises of five questions, one after the other ---------- */
// The keys of the pad and of the keyboard write into the boxes B; ✓ on a filled box goes to the next empty one, and hands the whole answer to go(ans) when none is
// left. On an empty box, or before the question has settled, it does nothing at all. off() says when the keys are dead (keyFn then says false). A screen that asks
// for numbers (a project, the exam, correcting) uses these two and boxes().
function typing(B, go, off) {
  typed = false;
  keyFn = k => {
    if (off()) return false;
    if (k !== 'ok') { B.key(k); tone(k === 'del' ? 392 : 660, 0, 0.08, 0.05); return true; }
    const a = B.ans();
    if (a !== null) { if (ready()) go(a); } else if (B.skip()) tone(660, 0, 0.08, 0.05);
    return true;
  };
}
// a tap on a key or on a box; true when it was one
function tapEntry(B, e) {
  const k = e.target.closest('[data-k]'), s = e.target.closest('[data-slot]');
  if (k) keyFn?.(k.dataset.k); else if (s) B.pick(+s.dataset.slot);
  return !!(k || s);
}
const eq = q => q.mode === 'proof' ? `${q.d} × ${q.q}${q.r ? ` + ${q.r}` : ''} =` : `${q.D} ÷ ${q.d} =`;
const llista = a => a.length > 1 ? `${a.slice(0, -1).join(', ')} i ${a[a.length - 1]}` : a[0];
const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };
const showTip = () => { const e = $('#tip'); if (e.getBoundingClientRect().top < 0) e.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' }); };

// The question loop. o: help (material and the hint button), per (questions in a row of the head, labels), settle(res) and end(out, stage).
// res[k] is { tries, helped } of question k (what handIn in logic.js judges). settle runs at once on the last right answer, BEFORE any wait, and what it
// returns goes to end() after the pause. A wrong answer repeats the question: the second one also shows the material solved.
function quiz(t, qs, o) {
  const per = o.per || qs.length, res = [];
  $('#game').innerHTML = `<div class="hud col">${o.labels ? `<nav class="exrow" aria-label="Exercicis">${o.labels.map(l => `<span>${l}</span>`).join('')}</nav>` : ''}
    <span class="steps" id="dots" role="img" aria-label="Preguntes">${qs.map((_, j) => `<i${j && j % per === 0 ? ' class="gap"' : ''}></i>`).join('')}</span></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>${o.help ? '<button class="btn soft" id="hintb">Dona\'m una pista</button>' : ''}
    <div class="stage work" id="stage"><div class="mat" id="mat"></div><div class="desk"><div class="ask" id="ask"></div><div id="keys"></div></div></div>`;
  const dots = [...$('#dots').children], chips = [...document.querySelectorAll('.exrow span')], stage = $('#stage'), mat = $('#mat');
  const desk = $('.desk', stage), open = on => { desk.hidden = $('#ask').hidden = $('#keys').hidden = !on; };
  let k = 0, q, B, fig, tries, helped, busy;
  // the figure of the mode, built when the question is asked, or later (hint, second mistake) for a hidden one; solved on request
  function figure(solved) {
    if (!o.help || !FIGURES[q.mode]) return;
    if (!fig) {
      fig = FIGURES[q.mode](mat, q, { t, onDone: () => { if (q.hands) { open(true); tone(784, 0, 0.14, 0.08); tip('Ja està! Ara escriu la resposta.', 'go'); } },
        onMiss: m => { tone(150, 0, 0.45, 0.16, 'triangle'); tip(m || MISS, 'oops'); } });
      if (fig.hosts) { B.move(fig.hosts); $('#ask').classList.add('far'); }   // a figure with a place for each box (chunks) takes the boxes, whatever was typed in them stays
    }
    if (solved) fig.solve();
  }
  function arm() {
    fig?.stop(); fig = null; mat.innerHTML = ''; q = qs[k]; tries = 0; helped = false; busy = false; openAt = performance.now() + SETTLE;
    chips.forEach((c, j) => c.classList.toggle('on', j === Math.floor(k / per))); dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#ask').innerHTML = `<span class="eq">${eq(q)}</span><span class="bxs"></span>`; B = boxes($('.bxs', stage), q, labelsOf(q));
    $('#keys').innerHTML = KEYS;
    $('#ask').classList.remove('far');
    const wait = o.help && q.hands && FIGURES[q.mode] && !FIGURES[q.mode].still;   // the keys come up when the material is done
    open(!wait);
    tip(tipFor(q) + (wait ? ' ' + how(q) : '')); if (!q.hide) figure(false);
    typing(B, submit, () => busy || $('#ask').hidden); showTip();
  }
  async function submit(ans) {
    if (!right(q, ans)) {
      tries++; tone(150, 0, 0.45, 0.16, 'triangle'); shake(fig ? mat : $('#ask'));
        tip(`Ui! ${explain(q, tries > 1, ans)}`, 'oops'); fig?.mark?.(ans); if (tries > 1) figure(true);
      B.clear(); showTip(); return;
    }
    busy = true; fig?.stop(); res[k] = { tries, helped }; dots[k].classList.add(firstTry(res[k]) ? 'ok' : 'late');
    tone(784, 0, 0.14, 0.08); tone(1047, 0.1, 0.2, 0.08); tip(said(q), 'go'); showTip();
    { const p = mid($('#ask')); FX.burst(p.x, p.y, 48, 22, 190); FX.ring(p.x, p.y, 48, 10, 90); }
    const last = k === qs.length - 1, out = last ? o.settle(res) : null;
    await sleep(1500); if (!t.on) return;
    if (last) { $('#hintb')?.remove(); return o.end(out, stage); }   // the hint button is outside the stage that end() clears
    k++; arm();
  }
  // the hint: the game's own explanation of what is typed (nothing, if the boxes are not all full) in the place of the tip, and the material of a hidden question; the question stops counting
  function hint() {
    if (busy || !ready()) return;
    helped = true; figure(false); tip(explain(q, false, B.ans() ?? undefined), 'hint'); showTip();
  }
  $('#game').onclick = e => {
    if (!tapEntry(B, e) && e.target.closest('#hintb')) hint();
  };
  arm();
}

// Repartir, Fer grups, En sobra ... : the mark is kept (if it is the best) before the pause, and only then the panel comes
function projecte(i) {
  const P = PROJECTS[i], t = enter(P.name, true); here = i;
  quiz(t, P.ex.flat(), { help: true, per: 5, labels: ['ex00', 'ex01', 'ex02'],
    // prog is replaced here and nowhere else (handIn works the mark out, keeps the better one and never touches prog): leaving in the middle saves nothing, and the sound button's save() never writes a mark that was not earned
    settle(res) { const r = handIn(prog, i, res); prog = r.prog; save(); return r; },
    async end(r, stage) {
      keyFn = null; stage.innerHTML = ''; stage.classList.add('pool'); tip(r.n >= VALID ? 'Projecte acabat!' : 'Projecte acabat. Mira què cal repassar.');
      await sleep(SETTLE); if (!t.on) return;   // the panel comes up once a second tap on the last ✓ has passed
      r.n >= VALID ? (chime([523, 659, 784, 1047, 1319]), FX.celebrate(8)) : tone(196, 0, 0.5, 0.12, 'triangle');
      panel(stage, `<h2>Nota ${r.n}</h2>
        ${r.n >= VALID ? `<p class="lead go">Validat ✓${r.gain ? ` · +${r.gain} XP` : ''}</p>` : `<p class="lead">${r.best >= VALID ? `Aquesta vegada no arriba a ${VALID}, però ja el tens validat.` : `Per validar cal una nota de ${VALID}.`} Repassa ${llista(r.redo)}.</p>`}
        ${r.best && r.best >= r.n ? `<p class="lead">La teva millor nota continua sent ${r.best}.</p>` : ''}
        ${r.news.length ? `<p class="lead go">${r.news.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${llista(r.news)}</p>` : ''}
        <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Torna-hi</button>`);
      $('#game').onclick = e => { const b = e.target.closest('button'); if (!b || !ready()) return; if (b.id === 'bk') mapa(); else if (b.id === 'rp') projecte(i); };
    } });
}
function corregir() { mapa(); }
function examen(c) { mapa(); }

soBtn();
prog.piscina ? mapa() : piscina();
