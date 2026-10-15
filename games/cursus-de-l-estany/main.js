import { $, RM, sleep, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, clean, xpOf, levelText, isOpen, examOpen, BADGES, badges, TEAMS, VALID, right, tipFor, explain, said, handIn, firstTry, sheet, judge, told, sheetIn, validated, exam, examIn, EXAM_PASS, roundIn, rapidIn, RACO_CAP } from './logic.js';
import { problems, statements, fact, SVM, ROUND, ROUND_PASS } from './raco.js';
import { fireflies, FIGURES, how, KEYS, boxes, labelsOf } from './material.js';
import { SETTLE, ownPage, tokens, soundButton } from '../../shared/shell.js';

const KEY = 'cursus-de-l-estany';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and the corner of thinking, to look at any of it; what is done there is judged and kept by the same rules as ever
const OPEN = OBERT;

// Facts only: { so, piscina, equip, notes, exams, fulls, probs, savi, rapid }. clean() makes a complete progress inside its limits out of anything the browser
// holds (not JSON, a string, notes that are not a list ...). XP, level and badges are worked out when painted, never kept.
let prog = clean(load(KEY));
function save() { const { so, piscina, equip, notes, exams, fulls, probs, savi, rapid } = prog; store(KEY, { so, piscina, equip, notes, exams, fulls, probs, savi, rapid }); paintXp(); }

// every new screen cancels the running one through this token
const fresh = tokens();

const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);

let openAt = 0, keyFn = null, tight = false;
const ready = () => performance.now() >= openAt;
// A question screen (tight) ignores every tap for SETTLE after a new question, a choice, «Segueix» coming up or a panel: a second tap lands on what took the place of the first
// button, and so must reach neither a key nor a pad nor the hint. The capture phase stops it before the figure's own handler.
$('#game').addEventListener('click', e => { if (tight && !ready()) e.stopPropagation(); }, true);
const hsl = (h, l = 62) => `hsl(${h} 75% ${l}%)`;

/* ---------- the shell: every screen starts with enter() and gets its token back ---------- */
// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = ownPage('cursus-de-l-estany');
// inner screens show ← Mapa instead of ← Tots els jocs; the pond drifts to the colour of the team once there is one
function enter(kicker, inner) {
  const t = fresh(); keyFn = null; tight = false; openAt = performance.now() + SETTLE;
  $('#app').classList.toggle('wide', inner); document.body.classList.remove('work'); $('#toG').hidden = inner || !HUB; $('#toM').hidden = !inner; $('#kick').textContent = kicker;
  $('#game').onclick = null; FX.mood(TEAMS[prog.equip]?.hue ?? 165); paintXp();
  return t;
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));
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
// A tip in a question screen lives in a box of two lines (.tipbox) and grows upwards from it, over the head, when the text is longer: it never moves what is under it (.tall paints it as a card)
const tip = (txt, cls) => { const e = $('#tip'), box = e.parentElement; e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; if (box.classList.contains('tipbox')) e.classList.toggle('tall', e.offsetHeight > box.offsetHeight + 1); };

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
// the four activities of «El racó de pensar», with what the child has done in each
const count = (n, one, many) => n ? `${n} ${n === 1 ? one : many}` : 'Per fer';
const RACO = [
  { go: 'prob', name: 'Problemes de l\'estany', sub: 'Històries per resoldre amb el material', mk: p => count(p.probs, 'ronda ben resolta', 'rondes ben resoltes') },
  { go: 'savi', name: 'Sempre, de vegades o mai', sub: 'Raona si una frase és certa', mk: p => count(p.savi, 'ronda ben raonada', 'rondes ben raonades') },
  { go: 'rapid', name: 'Repte llampec', sub: 'Un minut de càlcul mental', mk: p => p.rapid ? `Rècord ${p.rapid}` : 'Per fer' },
  { id: 'cor', name: 'Caça l\'errada', sub: 'Tres divisions fetes: són bones?', mk: p => count(p.fulls, 'full ben corregit', 'fulls ben corregits') }
];
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c), inside = () => OPEN || prog.piscina;
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  const t = enter('El mapa', false), got = badges(prog);
  // a save with the Piscina done and no team (damaged, or from before the team panel): choose one first
  if (prog.piscina && prog.equip < 0) {
    $('#kick').textContent = 'El teu equip'; $('#game').innerHTML = '<p class="status tip" id="tip" role="status" aria-live="polite"></p><div class="stage pool" id="stage"></div>';
    return team(t, $('#stage'));
  }
  const ring = (c) => {
    const open = openC(c), exam = openX(c), todo = CIRCLES[c].projects.filter(i => prog.notes[i] < VALID).map(i => PROJECTS[i].name);
    return `<section class="ring r${c}${open ? '' : ' shut'}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${open ? '' : `<p class="why">${c === 0 ? 'Acaba la Piscina per obrir aquest cercle.' : `Supera l'examen del cercle ${c - 1} per obrir aquest cercle.`}</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${prog.notes[i] >= VALID ? ' ok' : ''}" data-p="${i}"${open ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${noteText(prog.notes[i])}</span></button>`).join('')}</div>
      <button class="exam${prog.exams[c] ? ' pass' : ''}" data-x="${c}"${exam ? '' : ' disabled'}><b>Examen del cercle ${c}</b><span>${prog.exams[c] ? 'Superat ✓ · el pots repetir' : exam ? 'Obert: fes-lo quan vulguis' : open ? `Falta validar: ${todo.join(', ')}` : 'Primer cal obrir el cercle'}</span></button></section>`;
  };
  $('#game').innerHTML = `<p class="status tip" id="tip">${nextTip()}</p>
    <div class="map">${prog.piscina ? '' : '<button class="btn" id="pool">Fes la Piscina</button>'}${CIRCLES.map((_, c) => ring(c)).join('')}
      <section class="ring raco" aria-labelledby="rhr"><h2 id="rhr"><span>El racó de pensar</span></h2>
        ${inside() ? '' : '<p class="why">Acaba la Piscina per obrir el racó.</p>'}
        <div class="projs">${RACO.map(a => `<button class="proj" ${a.id ? `id="${a.id}"` : `data-a="${a.go}"`}${inside() ? '' : ' disabled'}><b>${a.name}</b><span>${a.sub}</span><span class="mk">${a.mk(prog)}</span></button>`).join('')}</div></section></div>
    <h2 class="bh">Insígnies</h2><ul class="badges" aria-label="Insígnies">${BADGES.map((b, i) => `<li class="bd${got[i] ? ' got' : ''}"><b>${b.name}</b><span>${b.what}</span><span class="st">${got[i] ? 'Aconseguida ✓' : 'Encara no'}</span></li>`).join('')}</ul>`;
  $('#game').onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.disabled || !ready()) return;
    if (b.dataset.p) projecte(+b.dataset.p); else if (b.dataset.x) examen(+b.dataset.x); else if (b.dataset.a) ({ prob: problemes, savi: raona, rapid: llampec })[b.dataset.a](); else if (b.id === 'cor') corregir(); else if (b.id === 'pool') piscina();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

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
// the two choices of a sheet look the same and neither is chosen beforehand (the focus goes to the group): one sheet in five has no mistake, and a button that stands out would be right by itself
const CHOICE = '<div class="verd" role="group" aria-label="És correcta?" tabindex="-1"><button class="btn soft" id="yes">És correcta</button><button class="btn soft" id="no">No és correcta</button></div>';
const eq = q => q.mode === 'story' ? q.text : q.mode === 'proof' ? `${q.d} × ${q.q}${q.r ? ` + ${q.r}` : ''} =` : `${q.D} ÷ ${q.d} =`;
const llista = a => a.length > 1 ? `${a.slice(0, -1).join(', ')} i ${a[a.length - 1]}` : a[0];
const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };
const showTip = () => { const e = $('#tip'); if (e.getBoundingClientRect().top < 0) e.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' }); };

// The question loop. o: help (material and the hint button), per (questions in a row of the head, labels), settle(res) and end(out, stage), and two ways of asking:
// once (one try: right or wrong, the answer is told and a «Segueix» takes the place of the keys, so no timer ends it; the exam calls quiz(t, exam(c), { once: true, settle, end })),
// items (a sheet: each question is shown with an answer, «És correcta» / «No és correcta» come before the keys, and judge() decides; implies once).
// res[k] is { tries, helped } of question k (what handIn in logic.js judges; a miss with once is tries 1). settle runs at once on the last answer, BEFORE any wait, and what it
// returns goes to end() after the pause. Without once a wrong answer repeats the question: the second one also shows the material solved.
function quiz(t, qs, o) {
  const per = o.per || qs.length, res = []; tight = true; document.body.classList.add('work');   // the column as tall as the screen (style.css)
  $('#game').innerHTML = `<div class="hud col">${o.labels ? `<nav class="exrow" aria-label="Exercicis">${o.labels.map(l => `<span>${l}</span>`).join('')}</nav>` : ''}
    <span class="steps" id="dots" role="img" aria-label="Preguntes">${qs.map((_, j) => `<i${j && j % per === 0 ? ' class="gap"' : ''}></i>`).join('')}</span><span class="ratxa" id="ratxa" role="status" hidden></span></div>
    <div class="tipbox"><p class="status tip" id="tip" role="status" aria-live="polite"></p></div>${o.help ? '<button class="btn soft" id="hintb">Dona\'m una pista</button>' : ''}
    <div class="stage work" id="stage"><div class="mat" id="mat"></div><div class="desk"><div class="ask" id="ask"></div><div id="keys"></div></div></div>`;
  const dots = [...$('#dots').children], chips = [...document.querySelectorAll('.exrow span')], stage = $('#stage'), mat = $('#mat');
  const desk = $('.desk', stage), open = on => { desk.hidden = $('#ask').hidden = $('#keys').hidden = !on; };
  let k = 0, q, B, fig, tries, helped, busy, it, verd, go, streak = 0;   // it: the sheet item being judged; verd: its choice is still to be made; go: what «Segueix» resolves
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
    it = o.items?.[k]; verd = !!it; go = null;
    $('#ask').innerHTML = `<span class="eq${it ? ' sh' : q.mode === 'story' ? ' story' : ''}">${eq(q)}${it ? ' ' + told(q, it.shown) : ''}</span><span class="bxs"${it ? ' hidden' : ''}></span>`; B = boxes($('.bxs', stage), q, labelsOf(q));
    $('#keys').innerHTML = it ? CHOICE : KEYS;
    $('#ask').classList.remove('far');
    const wait = o.help && q.hands && FIGURES[q.mode] && !FIGURES[q.mode].still;   // the keys come up when the material is done
    open(!wait);
    tip(it ? `Mira bé ${q.mode === 'proof' ? 'l\'operació' : 'la divisió'}. És correcta?` : tipFor(q) + (wait ? ' ' + how(q) : '')); if (!q.hide) figure(false);
    typing(B, submit, () => busy || verd || $('#ask').hidden); showTip(); $('.verd', stage)?.focus({ preventScroll: true });
  }
  async function submit(ans, yes) {
    const ok = it ? judge(it, !!yes, ans) : right(q, ans), once = o.once || it;
    if (!ok) {
      tries++; tone(150, 0, 0.45, 0.16, 'triangle'); shake(fig ? mat : $('#ask'));
      if (!once) { tip(`Ui! ${explain(q, tries > 1, ans)}`, 'oops'); fig?.mark?.(ans); if (tries > 1) figure(true); B.clear(); showTip(); return; }
    }
    busy = true; fig?.stop(); res[k] = { tries, helped }; dots[k].classList.add(firstTry(res[k]) ? 'ok' : once ? 'miss' : 'late');
    if (ok) { tone(784, 0, 0.14, 0.08); tone(1047, 0.1, 0.2, 0.08); }
    // the streak: answers right at the first try, one after the other; it shows from the second and every fifth is a small party
    streak = firstTry(res[k]) ? streak + 1 : 0;
    const rx = $('#ratxa'); rx.hidden = streak < 2; rx.textContent = `Ratxa ${streak}`;
    if (streak > 1) { shake(rx); if (streak % 5 === 0) { chime([659, 784, 988, 1319]); FX.celebrate(3); } }
    tip(it ? `${ok ? 'Ben vist.' : it.ok ? 'Aquesta ja era bona.' : 'Aquesta tenia una errada.'} ${said(q)}` : ok ? said(q) : `Ui! ${explain(q, true, ans)}`, ok ? 'go' : 'oops'); showTip();
    if (ok) { const p = mid($('#ask')); FX.burst(p.x, p.y, 48, 22, 190); FX.ring(p.x, p.y, 48, 10, 90); }
    const last = k === qs.length - 1, out = last ? o.settle(res) : null;
    if (once) { $('#keys').innerHTML = '<button class="btn" id="go">Segueix</button>'; $('#keys').hidden = false; openAt = performance.now() + SETTLE; $('#go').focus({ preventScroll: true }); await new Promise(r => { go = r; }); }
    else await sleep(1500);
    if (!t.on) return;
    if (last) { $('#hintb')?.remove(); return o.end(out, stage); }   // the hint button is outside the stage that end() clears
    k++; arm();
  }
  // the hint: the game's own explanation of what is typed (nothing, if the boxes are not all full) in the place of the tip, and the material of a hidden question; the question stops counting
  function hint() {
    if (busy || !ready()) return;
    helped = true; figure(false); tip(explain(q, false, B.ans() ?? undefined), 'hint'); showTip();
  }
  $('#game').onclick = e => {
    if (e.target.closest('#go')) { go?.(); return; }
    const c = e.target.closest('#yes, #no');
    if (c && verd) {
      verd = false;
      if (c.id === 'yes') return submit(undefined, true);
      $('#keys').innerHTML = KEYS; $('.bxs', stage).hidden = false; openAt = performance.now() + SETTLE; tip('Escriu el resultat bo.');
    } else if (!tapEntry(B, e) && e.target.closest('#hintb')) hint();
  };
  arm();
}

// The end panel of a project, a sheet and an exam. The stage is cleared and the panel comes up once a second tap on the last button has passed (SETTLE), so its buttons
// work only from then; good (true, or a number of bursts for a bigger party) says how it sounds; again is the restart that «label» offers next to «Torna al mapa».
async function finish(t, stage, good, said, html, label, again) {
  keyFn = null; stage.innerHTML = ''; stage.classList.add('pool'); tip(said);
  await sleep(SETTLE); if (!t.on) return;
  openAt = performance.now() + SETTLE;   // the buttons of the panel ignore a tap that was meant for what was here before
  good ? (chime([523, 659, 784, 1047, 1319]), FX.celebrate(good === true ? 8 : good)) : tone(196, 0, 0.5, 0.12, 'triangle');
  panel(stage, `${html}<button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">${label}</button>`);
  $('#game').onclick = e => { const b = e.target.closest('button'); if (!b || !ready()) return; if (b.id === 'bk') mapa(); else if (b.id === 'rp') again(); };
}
const nova = r => r.news.length ? `<p class="lead go">${r.news.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${llista(r.news)}</p>` : '';
// what is true of the misses of a sheet (ok: the division of that miss was a good one, that was called wrong); a miss may be an error not found or a good division called wrong
const missText = oks => oks.every(Boolean) ? (oks.length > 1 ? 'Algunes divisions bones no tenien cap errada.' : 'Una divisió bona no tenia cap errada.') : oks.length > 1 ? 'Se t\'han escapat algunes errades.' : 'Se t\'ha escapat una errada.';
const redo = r => r.redo.length ? ` Repassa ${llista(r.redo.map(i => PROJECTS[i].name))}.` : '';

// Repartir, Fer grups, En sobra ... : the mark is kept (if it is the best) before the pause, and only then the panel comes
function projecte(i) {
  const P = PROJECTS[i], t = enter(P.name, true); here = i;
  quiz(t, P.ex.flat(), { help: true, per: 5, labels: ['ex00', 'ex01', 'ex02'],
    // prog is replaced here and nowhere else (handIn works the mark out, keeps the better one and never touches prog): leaving in the middle saves nothing, and the sound button's save() never writes a mark that was not earned
    settle(res) { const r = handIn(prog, i, res); prog = r.prog; save(); return r; },
    end: (r, stage) => finish(t, stage, r.n >= VALID, r.n >= VALID ? 'Projecte acabat!' : 'Projecte acabat. Mira què cal repassar.', `<h2>Nota ${r.n}</h2>
        ${r.n >= VALID ? `<p class="lead go">Validat ✓${r.gain ? ` · +${r.gain} XP` : ''}</p>` : `<p class="lead">${r.best >= VALID ? `Aquesta vegada no arriba a ${VALID}, però ja el tens validat.` : `Per validar cal una nota de ${VALID}.`} Repassa ${llista(r.redo)}.</p>`}
        ${r.best && r.best >= r.n ? `<p class="lead">La teva millor nota continua sent ${r.best}.</p>` : ''}${nova(r)}`, 'Torna-hi', () => projecte(i)) });
}
// Caça l'errada: a sheet of three divisions, each judged once; fulls + 1 only when all three are right, and nothing is kept before the last one is judged
function corregir() {
  const items = sheet(OPEN ? PROJECTS.map((_, i) => i) : validated(prog)), t = enter('Caça l\'errada', true);
  quiz(t, items.map(i => i.q), { items,
    settle(res) { const r = sheetIn(prog, res.map(firstTry)); prog = r.prog; save(); return r; },
    end: (r, stage) => finish(t, stage, r.good, r.good ? 'Full ben corregit!' : missText(r.missed.map(i => items[i].ok)), `<h2>${r.good ? 'Full ben corregit' : 'Full per repassar'}</h2>
        ${r.good ? `<p class="lead go">${r.gain ? `+${r.gain} XP` : '0 XP: per guanyar-ne cal validar més projectes.'}</p>` : `<p class="lead">${r.missed.length > 1 ? 'Aquestes no les has jutjades bé' : 'Aquesta no l\'has jutjada bé'}:<br>${r.missed.map(i => `${i + 1}. ${said(items[i].q)}`).join('<br>')}</p>`}${nova(r)}`, 'Un altre full', corregir) });
}
// The exam of a circle: six questions with no material and no hint, one try each (the rule is examIn). Like the other two it is kept at once on the last answer, before the
// «Segueix» pause; leaving before that keeps nothing. The third pass is the party of the whole course.
function examen(c) {
  const qs = exam(c), t = enter(`Examen del cercle ${c}`, true);
  quiz(t, qs, { once: true,
    settle(res) { const r = examIn(prog, c, qs, res.map(firstTry)); prog = r.prog; save(); return r; },
    end(r, stage) {
      const first = r.good && r.gain > 0, all = first && r.prog.exams.every(Boolean);
      return finish(t, stage, r.good && (all ? 24 : true), r.good ? 'Examen superat!' : 'Examen per repassar.', `<h2>${r.good ? 'Examen superat' : 'Examen per repassar'}</h2>
        <p class="${r.good ? 'lead go' : 'lead'}">${r.score} de 6${r.good ? ` · ${first ? `+${r.gain} XP` : '0 XP: ja el tenies superat.'}` : `: en calen ${EXAM_PASS}.${r.prog.exams[c] ? ' El teu examen superat continua superat.' : ''}`}${redo(r)}</p>
        ${first && c < 2 ? `<p class="lead go">S'ha obert el cercle ${c + 1}: ${CIRCLES[c + 1].name}.</p>` : ''}${all ? '<p class="lead go">Has superat els tres exàmens: el cursus és complet!</p>' : ''}${nova(r)}`, 'Un altre examen', () => examen(c));
    } });
}


/* ---------- «El racó de pensar»: stories, sentences to reason about, and the lightning round (raco.js) ---------- */
const capText = (gain, n) => gain ? `+${gain} XP` : n > RACO_CAP ? `0 XP: les ${RACO_CAP} primeres rondes ja te n'han donat.` : '';
// Stories: the question loop with the material in view from the start, as a tool; a story counts when the first answer written is the right one (the hint and the material are free)
function problemes() {
  const qs = problems(openC(1)), t = enter('Problemes de l\'estany', true);
  quiz(t, qs, { help: true,
    settle(res) { const hits = res.filter(r => r.tries === 0).length, r = roundIn(prog, 'probs', hits >= ROUND_PASS); prog = r.prog; save(); return { ...r, hits }; },
    end: (r, stage) => finish(t, stage, r.hits >= ROUND_PASS, r.hits >= ROUND_PASS ? 'Ronda ben resolta!' : 'Ronda acabada.', `<h2>${r.hits} de ${ROUND} a la primera</h2>
        <p class="${r.hits >= ROUND_PASS ? 'lead go' : 'lead'}">${r.hits >= ROUND_PASS ? `Ronda ben resolta. ${capText(r.gain, prog.probs)}` : `Per comptar la ronda en calen ${ROUND_PASS}. Llegeix bé què et demana cada problema: no sempre és el quocient.`}</p>`, 'Més problemes', problemes) });
}
// Sentences: one at a time with the three choices; the reason comes with the answer, right or wrong, and «Segueix» goes on
function raona() {
  const qs = statements(openC(1)), t = enter('Sempre, de vegades o mai', true); let k = 0, hits = 0, done = false;
  tight = true;
  $('#game').innerHTML = `<div class="hud"><span class="steps" id="dots" role="img" aria-label="Frases">${qs.map(() => '<i></i>').join('')}</span></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p><div class="stage" id="stage"></div>`;
  const stage = $('#stage'), dots = [...$('#dots').children];
  function ask() {
    done = false; openAt = performance.now() + SETTLE; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    tip('Passa sempre, només de vegades, o mai? Busca un exemple que ho compleixi i un que no.');
    stage.innerHTML = `<div class="fly say"><p class="sq">${qs[k].s}</p><div class="svm" role="group" aria-label="Quan passa?">${SVM.map((n, i) => `<button class="btn soft" data-v="${i}">${n}</button>`).join('')}</div>
      <p class="swhy" hidden></p><button class="btn" id="go" hidden>Segueix</button></div>`;
  }
  $('#game').onclick = e => {
    const b = e.target.closest('[data-v]');
    if (b && !done) {
      const q = qs[k], ok = +b.dataset.v === q.a; done = true; if (ok) hits++;
      stage.querySelectorAll('[data-v]').forEach((x, i) => { x.disabled = true; x.classList.toggle('yes', i === q.a); x.classList.toggle('no', x === b && !ok); });
      dots[k].classList.add(ok ? 'ok' : 'miss'); tip(ok ? 'Ben raonat!' : `No: la resposta és «${SVM[q.a]}».`, ok ? 'go' : 'oops');
      if (ok) { tone(784, 0, 0.14, 0.08); tone(1047, 0.1, 0.2, 0.08); const p = mid(b); FX.burst(p.x, p.y, 48, 22, 190); } else { tone(150, 0, 0.45, 0.16, 'triangle'); shake($('.say', stage)); }
      const w = $('.swhy', stage), g = $('#go'); w.textContent = q.why; w.hidden = g.hidden = false; openAt = performance.now() + SETTLE; g.focus({ preventScroll: true });
    } else if (e.target.closest('#go') && done) {
      if (++k < qs.length) return ask();
      const good = hits >= ROUND_PASS, r = roundIn(prog, 'savi', good); prog = r.prog; save(); tight = false;
      finish(t, stage, good, good ? 'Ronda ben raonada!' : 'Ronda acabada.', `<h2>${hits} de ${ROUND}</h2>
        <p class="${good ? 'lead go' : 'lead'}">${good ? `Ronda ben raonada. ${capText(r.gain, prog.savi)}` : `Per comptar la ronda en calen ${ROUND_PASS}. Un sol exemple que no ho compleix ja fa que no sigui «Sempre».`}</p>`, 'Una altra ronda', raona);
    }
  };
  ask();
}
// The lightning round: RAPID seconds of facts with four choices, one tap each. A miss shows the right one for a moment and the clock keeps running. Only a better record is kept.
const RAPID = 60;
function llampec() {
  const t = enter('Repte llampec', true), wide = openC(1);
  $('#game').innerHTML = '<p class="status tip" id="tip" role="status" aria-live="polite"></p><div class="stage pool" id="stage"></div>';
  const stage = $('#stage');
  tip('Dividir i multiplicar són la mateixa taula mirada de dos costats.');
  panel(stage, `<h2>Repte llampec</h2><p class="lead">${RAPID} segons. Toca el número que falta a cada operació: quantes n'encertaràs?</p>
    ${prog.rapid ? `<p class="lead go">El teu rècord: ${prog.rapid}</p>` : ''}<button class="btn" id="go">Comença!</button>`);
  function run() {
    stage.classList.remove('pool');
    stage.innerHTML = '<div class="fly rapid"><div class="clock" role="img" aria-label="El temps que queda"><i></i></div><p class="rq" id="rq" aria-live="polite"></p><div class="ropts" id="ro"></div><p class="rn"><b id="rn">0</b> encerts</p></div>';
    const end = performance.now() + RAPID * 1000, bar = $('.clock i', stage);
    let hits = 0, q = null, lock = false, over = false, miss = null;
    tip('Toca el número que falta.');
    function next() {
      let n; do n = fact(wide); while (q && n.text === q.text);
      q = n; lock = false; $('#rq').textContent = q.text; $('#ro').innerHTML = q.opts.map(o => `<button class="key" data-o="${o}">${o}</button>`).join('');
    }
    function stop() {
      over = true; const r = rapidIn(prog, hits); prog = r.prog; if (r.best) save();
      finish(t, stage, r.best ? 12 : hits >= 10, 'Temps!', `<h2>${hits} ${hits === 1 ? 'encert' : 'encerts'}</h2>
        <p class="${r.best ? 'lead go' : 'lead'}">${r.best ? 'Rècord nou!' : `El teu rècord: ${prog.rapid}`}</p>${miss ? `<p class="lead">Per recordar: ${miss}.</p>` : ''}`, 'Torna-hi', llampec);
    }
    (function tick() {
      if (!t.on || over) return;
      const left = end - performance.now(); bar.style.width = Math.max(0, left / RAPID / 10) + '%';
      left <= 0 ? stop() : setTimeout(tick, 100);
    })();
    $('#game').onclick = async e => {
      const b = e.target.closest('[data-o]'); if (!b || lock || over) return;
      if (+b.dataset.o === q.w) { hits++; $('#rn').textContent = hits; tone(660 + 40 * Math.min(hits, 12), 0, 0.1, 0.07); const p = mid(b); FX.burst(p.x, p.y, 48, 12, 150); return next(); }
      lock = true; miss = q.told; tone(150, 0, 0.3, 0.14, 'triangle'); b.classList.add('no'); $(`#ro [data-o="${q.w}"]`).classList.add('yes'); shake($('#rq'));
      await sleep(900); if (t.on && !over) next();
    };
    next();
  }
  $('#game').onclick = e => { if (e.target.closest('#go') && ready()) run(); };
}

soBtn();
inside() ? mapa() : piscina();
