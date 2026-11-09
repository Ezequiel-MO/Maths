import { $, RM, sleep, pick, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';
import { PROJECTS, CIRCLES, POOL, POINTS, EXAM_PASS, VALID, VISITORS, shuffle, starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen,
  circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn, servedIn, starsOf, tapSay, meets, bottomOf, COLORS, cap, fmt } from './logic.js';
import { card, GUIA } from './cards.js';
import { park } from './world.js';

const KEY = 'parc-de-l-estany';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, lv, piscina, exams, fulls, visitants }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
const fresh = tokens();
const W = park($('#world'));
const parkState = () => W.state({ piscina: prog.piscina || OPEN, valid: OPEN ? PROJECTS.map((_, i) => i) : validated(prog), stars: starsOf(prog) });

/* ---------- the sounds: a click for each key, a bell for a visitor helped, a fanfare for a level, the organ of the carousel ---------- */
const { chime } = voice(() => prog.so), { tone: snd } = voice(() => prog.so, false);
const tick = () => snd(1900, 0, 0.035, 0.035, 'square');
const ding = () => { snd(1568, 0, 1.2, 0.11); snd(1568 * 2.76, 0, 0.6, 0.03); snd(2093, 0.08, 0.9, 0.06); };
const bonk = () => { snd(250, 0, 0.13, 0.09, 'triangle'); snd(175, 0.1, 0.24, 0.09, 'triangle'); };
const fanfare = () => { chime([523, 659, 784, 1047, 784, 1047, 1319], 0.085); setTimeout(ding, 640); };
const clink = (k = 0) => snd(2200 + k * 140, 0, 0.09, 0.04, 'triangle');
const ratchet = up => snd(up ? 620 : 470, 0, 0.05, 0.05, 'square');
const plop = (k = 0) => { snd(520 + k * 40, 0, 0.12, 0.07, 'sine'); snd(780 + k * 40, 0.05, 0.1, 0.04, 'triangle'); };
const boom = () => { for (let i = 0; i < 5; i++) snd(90 + i * 30, i * 0.03, 0.4, 0.05, 'sawtooth'); };

const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Visitant content!', 'Bona feina!', 'Així es porta un parc!'];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const plain = s => String(s).replace(/<[^>]+>/g, '');

/* ---------- the frame ---------- */
const HUB = ownPage(KEY);
const WIDE = matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');
// the 3D park is framed in the part of the screen the panel leaves free: on the left of it when the screen is wide, above it otherwise
function frame3d() {
  if (WIDE.matches) W.layout('right', $('#app').getBoundingClientRect().width + 24);
  else { const v = $('.view'); W.layout('bottom', v ? Math.max(0.3, 1 - v.getBoundingClientRect().bottom / innerHeight) : 0.55); }
}
WIDE.addEventListener?.('change', () => frame3d());
function show(kicker, playing) {
  document.body.classList.toggle('playing', playing);
  $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; W.highlight(null); W.crowd();
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => ding());
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });
let openAt = 0;
const view = h => `<div class="view" style="height:${h}" aria-hidden="true"></div>`;

/* ---------- the map: the plan of the park, over the park itself ---------- */
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN });
// the plates of the plan: each project and each circle with its picture
const ico = d => `<svg class="ico" viewBox="0 0 32 32" aria-hidden="true">${d}</svg>`;
const ICONS = [
  '<path d="M5 10H27V14A2.5 2.5 0 0 0 27 19V23H5V19A2.5 2.5 0 0 0 5 14Z"/><path d="M12 10V23" stroke-dasharray="2 2.5"/>',
  '<path d="M10 4V28M10 7H15M10 11H13M10 15H15M10 19H13M10 23H15"/><circle cx="22" cy="10" r="3" class="f"/><path d="M22 14V22M18 28L22 22L26 28M18 17H26"/>',
  '<path d="M16 3V29"/><path d="M6 15C6 11 10 10 14 10H20L23 5C24 4 27 4 27 7V9L24 13C25 16 24 18 22 19L23 24H20L19 20H11L9 24H7L8 19C6.5 18 6 17 6 15Z" class="f"/>',
  '<circle cx="16" cy="13" r="10"/><path d="M16 3V23M6 13H26M9 6L23 20M23 6L9 20"/><path d="M10 29L16 13L22 29"/>',
  '<path d="M3 25C8 25 8 7 13 7S17 20 21 20S25 12 29 12"/><path d="M7 25V28M13 9V28M21 22V28M27 13V28"/>',
  '<circle cx="16" cy="16" r="11"/><path d="M16 16L16 5M16 16L25.5 21.5M16 16L6.5 21.5"/><circle cx="12" cy="11" r="1.6" class="f"/><circle cx="20" cy="12" r="1.6" class="f"/><circle cx="16" cy="22" r="1.6" class="f"/>',
  '<path d="M6 12H18V26H6Z"/><path d="M6 12L11 7H23L18 12M23 7V21L18 26"/>',
  '<path d="M4 6H28V26H4Z"/><path d="M4 12H28M12 6V26M20 6V26"/>',
  '<circle cx="16" cy="17" r="11"/><path d="M16 17L16 6M16 17L25 23M16 17L7 23"/><path d="M13 2H19L16 7Z" class="f"/>'
].map(ico);
const WING = [
  '<path d="M5 27V11A11 11 0 0 1 27 11V27"/><path d="M9 27V13A7 7 0 0 1 23 13V27"/><circle cx="16" cy="4" r="1.8" class="f"/>',
  '<circle cx="16" cy="13" r="10"/><path d="M16 3V23M6 13H26"/><path d="M10 29L16 13L22 29"/>',
  '<path d="M4 27H28"/><path d="M6 27V18H12V27M14 27L18 12L22 27M23 27A3.5 3.5 0 0 1 30 27"/>'
].map(ico);
const STAR = ico('<path d="M16 5L19.1 12.2L26.8 12.9L21 18L22.7 25.6L16 21.6L9.3 25.6L11 18L5.2 12.9L12.9 12.2Z" class="f"/>');
let here = -1;
function mapa() {
  fresh(); show("El plànol del parc", false);
  parkState(); W.go('map');
  const v = validated(prog), stars = starsOf(prog), tip = M.advice();
  const row = i => {
    const n = noteOf(prog, i), ok = n >= VALID, st = prog.lv.slice(i * 10, i * 10 + 10);
    return `<li><button class="row${ok ? ' ok' : ''}" data-p="${i}"${M.openC(circleOf(i)) ? '' : ' disabled'}>
      <span class="plate" aria-hidden="true">${ICONS[i]}</span><span class="what"><b>${PROJECTS[i].name}</b><small>${PROJECTS[i].sub}</small>
      <span class="pp" aria-hidden="true">${st.map(s => `<i class="s${s}"></i>`).join('')}</span></span><span class="mk">${M.noteText(i)}</span></button></li>`;
  };
  const exRow = c => { const done = prog.exams[c], op = M.openX(c); return `<li><button class="row exam${done ? ' ok' : ''}" data-x="${c}"${op ? '' : ' disabled'}><span class="plate" aria-hidden="true">${STAR}</span><span class="what"><b>Revisió del cercle ${c}</b><small>L'examen: sis visitants, un intent cada un</small></span><span class="mk">${done ? 'Superat ✓' : op ? 'Sis preguntes' : M.openC(c) ? 'Valida els projectes' : 'Tancat'}</span></button></li>`; };
  $('#game').innerHTML = `${view('44vh')}<div class="sheet map">
    <div class="rating" role="img" aria-label="Parc de ${stars} ${stars === 1 ? 'estrella' : 'estrelles'}"><span>${'★'.repeat(stars)}<em>${'★'.repeat(3 - stars)}</em></span>
      <p>${v.length >= 9 ? 'El parc és sencer: totes les atraccions funcionen!' : `Cada projecte validat posa en marxa una atracció: <b>${v.length} de 9</b>.`}${prog.visitants ? ` Has ajudat <b>${prog.visitants}</b> ${prog.visitants === 1 ? 'visitant' : 'visitants'}.` : ''}</p></div>
    ${tip ? `<p class="next">${tip}</p>` : ''}
    ${CIRCLES.map((C, c) => `<section class="wing${M.openC(c) ? '' : ' shut'}" aria-labelledby="w${c}"><h2 id="w${c}"><span aria-hidden="true">${WING[c]}</span> Cercle ${c} · ${C.name}</h2>
      ${M.openC(c) ? '' : `<p class="why">Supera la revisió del cercle ${c - 1} per obrir-lo.</p>`}<ol>${C.projects.map(row).join('')}${exRow(c)}</ol></section>`).join('')}
    <div class="extra"><button class="btn soft" id="full"${OPEN || v.length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>${badgeList(BADGES, badges(prog))}</div></div>`;
  const root = $('#game');
  root.onclick = e => {
    const b = e.target.closest('.row:not(.exam)'), x = e.target.closest('.row.exam');
    if (b && !b.disabled) { here = +b.dataset.p; level(here, M.nextLevel(here)); }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
  };
  // a project under the finger, or with the focus, lights its ride
  const lit = e => { const b = e.target.closest?.('.row:not(.exam)'); W.highlight(b ? +b.dataset.p : null); };
  root.onpointerover = lit; root.onfocusin = lit; root.onpointerleave = () => W.highlight(null);
  ($(`[data-p="${here}"]:not(:disabled)`, root) || $('.row:not(:disabled)', root))?.focus({ preventScroll: true });
  frame3d(); here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the guide with her tip, the stage and the room under it
function shell(n, label, h = '30vh') {
  $('#game').innerHTML = `${view(h)}<div class="sheet play"><div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${GUIA}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  frame3d();
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: three tests at the gate, and the park opens ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  parkState(); W.go('gate');
  const { stage, dots, say } = shell(POOL.length, 'Tres proves');
  say("Hola! Sóc la guia del parc. Abans d'obrir-lo, tres proves: les entrades, el mesurador i la sínia.");
  let k = 0;
  play({ t, rounds: POOL, set: 'gate', stage, tip: say, slip: bonk, step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say('El parc obre les portes! Ja pots dirigir-lo.', 'go'); W.go('sky');
      await sleep(1300); if (!t.on) return; boom(); await W.openSign(); fanfare(); W.celebrate(3);
      await sleep(2600); if (t.on) mapa();
    } });
}

/* ---------- one level of a project ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(), P = PROJECTS[sec], L = P.levels[idx]; show(`Cercle ${c} · ${P.name}`, true); here = sec;
  W.go(P.set);
  const root = $('#game');
  let slips = 0, over = false;
  root.innerHTML = `${view('34vh')}<div class="sheet play">${levelRow(P.levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.title}</span><span class="chip st" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${GUIA}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><span class="combo" id="cb" hidden></span><div class="stage" id="stage"></div></div>`;
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.lv[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  frame3d();
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); bonk(); };
  const rounds = L.make(Math.random);

  // the level is handed in at once, before any wait
  async function win(line) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = servedIn(r.prog, rounds.length); save();
    fanfare(); W.celebrate(end || r.valid ? 3 : 2);
    // a project validated: the camera goes out to the whole park, and the ride of this project starts before the child's eyes
    if (r.valid) W.go('map').then(() => { if (!t.on) return; parkState(); W.highlight(sec); W.fireworks(4); boom(); setTimeout(() => { if (t.on) W.highlight(null); }, 2800); });
    await sleep(1000); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.valid ? `<p class="lead go">S'ha posat en marxa una atracció nova.</p>` : ''}
      ${r.exam ? `<p class="lead go">S'ha obert la revisió del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al plànol' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  let streak = 0;
  const help = play({ t, rounds, set: P.set, stage, tip, slip: () => { streak = 0; combo(0); slip(); }, win, good: () => combo(++streak) });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars(); tip(L.say);
}

/* ---------- the safety check of a circle: six visitors of its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`La revisió del cercle ${c}`, true);
  const qs = exam(c, Math.random), run = [], { stage, tail, dots, say } = shell(qs.length, 'Sis visitants');
  let k = -1, res = null;
  const next = () => k === qs.length - 1 ? finish() : arm();
  function arm() {
    k++;
    const Q = qs[k], last = k === qs.length - 1, qt = { get on() { return t.on && !done; } };
    let done = false;
    const end = ok => {
      if (done || !t.on) return;
      done = true; keyFn = null; stage.inert = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
      if (last) { res = examIn(prog, c, qs, run); res.first = res.good && !prog.exams[c]; prog = res.prog; save(); }
      if (ok) { say('Correcte!', 'go'); ding(); W.happy(); return sleep(1100).then(() => { if (t.on) next(); }); }
      say(`No és correcte. ${Q.round.say}`, 'oops'); bonk(); openAt = performance.now() + SETTLE;
      tail.innerHTML = `<button class="btn" id="nx">${last ? 'Mira el resultat' : 'Segueix'}</button>`;
      $('#nx').onclick = e => { if (e.timeStamp >= openAt) next(); };
    };
    const tip = (txt, cls = '') => { if (cls === 'go' && !done) say(txt, cls); else if (!cls && !done) say(txt); };
    stage.inert = false; tail.innerHTML = ''; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[Q.p].name}`;
    W.go(PROJECTS[Q.p].set);
    say('Resol-ho. Només hi ha un intent!');
    play({ t: qt, rounds: [Q.round], set: PROJECTS[Q.p].set, stage, tip, slip: () => end(false), win: () => end(true), exam: true });
    scrollTo({ top: 0, behavior: 'auto' });
  }
  async function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    r.good ? fanfare() : bonk();
    say(r.good ? 'Revisió superada!' : 'Revisió acabada. Mira què cal repassar.', r.good ? 'go' : '');
    // the first time it is passed, a star of the arch lights up, with fireworks
    if (r.first) { boom(); await W.star(starsOf(prog) - 1); if (!t.on) return; parkState(); } else { W.go('map'); if (r.good) W.celebrate(3); }
    panel(stage, `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superada ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja la tenies superada.'}` : r.score >= EXAM_PASS ? 'Molt bé! Però la revisió només compta amb tots els projectes del cercle validats.' : `Per superar-la calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first ? `<p class="lead go">El parc guanya una estrella: ${'★'.repeat(starsOf(prog))}</p>` : ''}
      ${r.first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al plànol</button><button class="link" id="rp">Una altra revisió</button>`);
    scrollTo({ top: 0, behavior: 'auto' });
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  }
  arm();
}

/* ---------- «Caça l'errada»: three lines written on the board of the park; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true); W.go('board');
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = shell(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    W.board(["Caça l'errada", `Frase ${k + 1} de ${cs.length}`]);
    stage.innerHTML = `<div class="cardbox">${card(C.card)}</div><p class="ask claim">Al tauler del parc hi diu:</p><p class="claimbox">«${C.says}»</p>`;
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Pensa-hi bé: el tauler diu la veritat?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(said, 'go'); ding(); W.board([{ t: 'Ben vist!', c: '#7CF5B0' }]); } else { say(said, 'oops'); bonk(); W.board([{ t: 'Uix!', c: '#FF8A8A' }]); }
    await sleep(ok ? 1400 : 2900); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}»)`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? fanfare() : bonk();
    say(r.good ? 'Tauler perfecte!' : 'Tauler revisat.', r.good ? 'go' : '');
    W.board(r.good ? [{ t: 'Tauler perfecte!', c: '#7CF5B0' }] : ['Tauler revisat']);
    if (r.good) W.celebrate(2);
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al plànol</button><button class="link" id="rp">Un altre full</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era. La bona és: «${C.real}»` : 'Sí, era correcta!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: «${C.real}»`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="opts col">${C.opts.map((v, i) => `<button class="btn soft" data-v="${i}">${v}</button>`).join('')}</div>`;
      say('Ben vist! Ara tria la frase que diu la veritat.', 'go');
    } else if ('v' in b.dataset) { const ok = C.opts[+b.dataset.v] === C.real; answer(ok, ok ? `Arreglada: «${C.real}»` : `No era aquesta. La bona és: «${C.real}»`); }
  };
  arm();
}

/* ---------- the visitors of a level, one after another ---------- */
// Each round is a visitor with a card and a question. The answer is typed on the keypad (taken as soon as it is right; ✓ sends one that is
// not, and that is a slip), picked from the options, or done on the card (a number of the ruler, a point of the track, a horse, a slice, a
// shape...), with the tickets, the big wheel, the paint pots, the pillars of the track or the bag of the tombola. A slip says how to work it
// out, never the answer. step(k), when given, hears of every new round (the dots of the Piscina); good() of every round right at the first go
const TURN_NAME = { 2: 'un quart de volta', 4: 'mitja volta', 6: 'tres quarts de volta', 8: 'una volta sencera' };
const turnName = n => n === 0 ? 'res' : `${TURN_NAME[Math.abs(n)] || `${Math.abs(n)} ${Math.abs(n) === 1 ? 'cabina' : 'cabines'}`} ${n > 0 ? '↻' : '↺'}`;
const PACK_LABEL = ['Caixes de 1.000', 'Paquets de 100', 'Tires de 10', 'Soltes'];
const MANY = { vermella: 'vermelles', blava: 'blaves', groga: 'grogues', verda: 'verdes' };
function play({ t, rounds, set, stage, tip, slip, win, step, good, exam = false }) {
  const n = rounds.length;
  let k = -1, R = null, busy = false, buf = '', clean1 = true, S = {};
  stage.innerHTML = `<p class="ask" id="q"></p><div class="cardbox" id="cardbox"></div><div class="made" id="made"></div><div class="ans" id="ans"></div>`;
  const box = $('#cardbox'), ans = $('#ans');
  const sp = () => R.sp || VISITORS[Math.floor(Math.random() * VISITORS.length)];
  const keypad = () => `<div class="disp" aria-live="polite"><output id="buf"></output><span class="unit">${R.unit || ''}</span><button class="del" data-d="del" aria-label="Esborra">⌫</button></div>
    <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}<span></span><button class="key" data-d="0">0</button><button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`;
  const writeBuf = () => { $('#buf').textContent = buf || ' '; box.querySelectorAll('.blank').forEach(b => { b.textContent = buf || '?'; }); };
  const hintText = () => { if (!exam) box.classList.add('hint'); return R.hint; };
  // the card drawn again with what changes in it (the tickets, the wheel, the paint, the pillars, the balls)
  const redraw = c => { R.card = c; box.innerHTML = card(c); };

  function arm() {
    // the round on screen is also window.__parc, for a browser check that answers it
    k++; R = { ...rounds[k], card: { ...rounds[k].card } }; window.__parc = R; busy = false; buf = ''; clean1 = true; openAt = performance.now() + SETTLE; step?.(k); S = {};
    $('#q').innerHTML = `${n > 1 ? `<small>Visitant ${k + 1} de ${n}</small>` : ''}${R.text}`; again($('#q')).add('pop');
    box.innerHTML = card(R.card); box.classList.remove('hint', 'won'); $('#made').innerHTML = '';
    const here = R.set || set;
    if (R.set) W.go(R.set);
    W.crowd(); W.guest(R.kid ? R.kid.sp : sp(), here, R.kid ? { h: R.kid.h } : {});
    if (R.card.k === 'counter') W.counter(R.card.n);
    if (R.card.k === 'wheel') W.wheelTo(R.card.r, { fresh: true });
    if (R.card.k === 'horses') W.horses(R.card.model || R.card.row);
    if (R.stack) W.stack(R.stack);
    const ty = R.type;
    if (ty === 'num') { ans.innerHTML = keypad(); writeBuf(); }
    else if (ty === 'pick') { S.opts = R.order || shuffle(R.opts.slice(), Math.random); ans.innerHTML = `<div class="opts${S.opts.every(o => plain(o).length < 14) ? '' : ' col'}">${S.opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; }
    else if (ty === 'tap') ans.innerHTML = '<p class="how">👆 Toca-ho al dibuix.</p>';
    else if (ty === 'mark') { S.on = new Set(); ans.innerHTML = `<div class="opts"><span class="chip" id="cnt">Marcats: 0</span><button class="btn soft" id="fet">✓ Fet</button></div>`; }
    else if (ty === 'packs') { S.v = [0, 0, 0, 0]; ans.innerHTML = packPanel(); }
    else if (ty === 'turn') { S.r = R.card.r; S.turned = 0; ans.innerHTML = turnPanel(); }
    else if (ty === 'paint') { S.sel = R.pal[0]; ans.innerHTML = paintPanel(); }
    else if (ty === 'track') { S.v = R.card.ys.slice(); ans.innerHTML = '<p class="how">👆 Toca cada columna a la seva altura.</p>'; }
    else if (ty === 'draw') { S.drawn = []; ans.innerHTML = `<div class="opts"><button class="btn" id="draw">Treu una bola</button><span class="chip" id="cnt">0 de ${R.n}</span></div>`; }
  }

  // the tickets: a − and a + for each kind, and how many there are now
  const packPanel = () => `<div class="packs-p">${PACK_LABEL.map((l, i) => `<div class="pk"><small>${l}</small><span><button class="key mini" data-p="${i}-" aria-label="Treu">−</button><b>${S.v[i]}</b><button class="key mini" data-p="${i}+" aria-label="Posa">+</button></span></div>`).join('')}</div>
    <p class="how">Ara tens: <b id="tot">${fmt(S.v[0] * 1000 + S.v[1] * 100 + S.v[2] * 10 + S.v[3])}</b> entrades</p>`;
  // the big wheel: the two arrows and the stop; in a warm-up, what has been turned so far
  const turnPanel = () => `<div class="lpanel">${R.free ? `<output class="ld" id="ld">${turnName(S.turned)}</output>` : ''}<div class="larr"><button class="key arr" data-t="-1" aria-label="Gira al revés de les agulles del rellotge">↺</button><button class="key arr" data-t="1" aria-label="Gira com les agulles del rellotge">↻</button></div><button class="btn" id="stop">Atura la sínia</button></div>`;
  // the paint pots, and ✓ for a roulette
  const paintPanel = () => `<div class="pots">${R.pal.map(c => `<button class="pot${c === S.sel ? ' sel' : ''}" data-c="${c}" style="--c:${COLORS[c]}" aria-label="${cap(c)}"><i></i>${cap(c)}</button>`).join('')}</div>${R.goal ? '<div class="opts"><button class="btn soft" id="fet">✓ Fet</button></div>' : ''}`;

  async function right(el) {
    busy = true; if (clean1) good?.();
    if (el) el.classList.add('ok');
    tip(`${pick(HURRAY)} ${R.say}`, 'go'); ding(); W.happy();
    ans.querySelectorAll('button').forEach(b => { b.disabled = true; });
    box.classList.add('won'); box.classList.remove('hint');
    const here = R.set || set;
    W.ride(here);
    if (R.solid) W.shape(R.solid);
    let extra = 0;
    // the photo of the drone, or the view from the front, seen for real
    if (R.view) { extra = 1400; W.drone(R.view).then(() => sleep(900)).then(() => { if (t.on) W.go(here); }); }
    await sleep(800 + extra); if (!t.on) return;
    W.leave();
    await sleep(k === n - 1 ? 500 : 900); if (!t.on) return;
    if (k === n - 1) { keyFn = null; win(`${n === 1 ? 'Un visitant content' : `${n} visitants contents`}`); } else arm();
  }
  function wrong(el, text) {
    slip(); clean1 = false; W.sad();
    if (el) again(el).add('shake');
    tip(`Ui! ${text || hintText()}`, 'oops'); hintText();
  }
  function press(d) {
    if (busy || R?.type !== 'num') return;
    const goal = String(R.ans);
    if (d === 'ok') { if (!buf) return; if (buf === goal) return right(null); buf = ''; writeBuf(); return wrong(null); }
    if (d === 'del') buf = buf.slice(0, -1);
    else { if (buf.length >= 6) return; buf = (buf + d).replace(/^0+(?=\d)/, ''); }
    tick(); const kb = ans.querySelector(`[data-d="${d}"]`); if (kb) again(kb).add('pop'); writeBuf();
    // the right number is taken as soon as it is written, with no ✓; a wrong one waits for ✓ (1 may still become 12)
    if (buf === goal) right(null);
  }
  // something of the card touched
  function onCard(key, el) {
    const ty = R.type;
    if (ty === 'tap') { if (key === R.ans) { clink(); return right(el); } el.classList.add('no'); setTimeout(() => el.classList.remove('no'), 900); return wrong(el, `${tapSay(R.card, key)} ${R.hint}`); }
    if (ty === 'mark') {
      const on = !S.on.has(key); on ? S.on.add(key) : S.on.delete(key); el.classList.toggle('on', on); snd(on ? 520 + S.on.size * 40 : 380, 0, 0.07, 0.05, 'triangle');
      $('#cnt').textContent = `Marcats: ${S.on.size}`;
      if (R.need != null ? S.on.size === R.need : S.on.size === R.ans.length && R.ans.every(a => S.on.has(a))) right(null);
      return;
    }
    if (ty === 'paint') {
      const i = +key.slice(1);
      if (R.goal) { const s = R.card.sectors.slice(); s[i] = S.sel; redraw({ ...R.card, sectors: s }); plop(i); return; }
      if (R.card.row[i] !== null) return;
      if (S.sel !== R.ans[i]) { again(el).add('shake'); return wrong(null, `Aquest cavall no és ${S.sel}. ${R.hint}`); }
      const row = R.card.row.slice(); row[i] = S.sel; redraw({ ...R.card, row }); plop(i); W.horses(row);
      if (!row.includes(null)) right(null);
      return;
    }
    if (ty === 'track') {
      const [i, v] = key.split('-').map(Number); S.v[i] = v; redraw({ ...R.card, ys: S.v.slice() }); snd(380 + v * 14, 0, 0.08, 0.05, 'triangle');
      if (S.v.every((x, j) => x === R.ans[j])) right(null);
    }
  }
  box.onclick = e => {
    const el = e.target.closest('[data-k]'); if (!el || busy || !t.on || e.timeStamp < openAt) return;
    if (!['tap', 'mark', 'paint', 'track'].includes(R.type)) return;
    onCard(el.dataset.k, el);
  };
  ans.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || !t.on || e.timeStamp < openAt) return;
    if ('d' in b.dataset) return press(b.dataset.d);
    if ('v' in b.dataset) { const ok = S.opts[+b.dataset.v] === R.ans; if (ok) right(b); else { b.disabled = true; wrong(b); } return; }
    if (b.id === 'fet') {
      if (R.type === 'paint') { if (meets(R.goal, R.card.sectors)) { W.spin(); return right(null); } return wrong(null, R.card.sectors.includes(null) ? `Encara hi ha trossos blancs. ${R.hint}` : null); }
      const ok = R.need != null ? S.on.size === R.need : S.on.size === R.ans.length && R.ans.every(a => S.on.has(a));
      return ok ? right(null) : wrong(null);
    }
    if ('p' in b.dataset) {
      const i = +b.dataset.p[0], up = b.dataset.p[1] === '+';
      if (up ? S.v[i] >= 9 : S.v[i] <= 0) return;
      S.v[i] += up ? 1 : -1; tick(); redraw({ ...R.card, v: S.v.slice() }); ans.innerHTML = packPanel();
      const tot = S.v[0] * 1000 + S.v[1] * 100 + S.v[2] * 10 + S.v[3]; W.counter(tot);
      if (tot === R.ans) right(null);
      return;
    }
    if ('t' in b.dataset) {
      const d = +b.dataset.t * (R.step || 1); S.r += d; S.turned += d; ratchet(d > 0);
      redraw({ ...R.card, r: S.r }); if (R.free) $('#ld').textContent = turnName(S.turned);
      W.wheelTo(S.r);
      return;
    }
    if (b.id === 'stop') {
      const ok = R.by === 'bottom' ? bottomOf(S.r) === R.ans : S.turned === R.ans;
      if (ok) return right(b);
      const told = R.by === 'bottom' ? `A baix hi ha la cabina ${bottomOf(S.r)}.` : `Has girat ${turnName(S.turned)}.`;
      if (R.free) return tip(`${told} ${R.text}`);
      S.r -= S.turned; S.turned = 0; redraw({ ...R.card, r: S.r }); W.wheelTo(S.r);
      return wrong(b, `${told} ${R.hint}`);
    }
    if ('c' in b.dataset) { S.sel = b.dataset.c; ans.querySelectorAll('.pot').forEach(p => p.classList.toggle('sel', p.dataset.c === S.sel)); clink(); return; }
    if (b.id === 'draw') {
      const bag = Object.entries(R.card.balls).flatMap(([c, m]) => Array(m).fill(c)), ball = bag[Math.floor(Math.random() * bag.length)];
      S.drawn.push(ball); redraw({ ...R.card, drawn: S.drawn.slice() }); plop(S.drawn.length); $('#cnt').textContent = `${S.drawn.length} de ${R.n}`;
      if (S.drawn.length >= R.n) {
        const cs = Object.keys(R.card.balls), got = cs.map(c => { const m = S.drawn.filter(x => x === c).length; return `${m} ${m === 1 ? c : MANY[c] || c}`; });
        R.say = `Han sortit ${list(got)}. ${R.say}`; right(null);
      }
    }
  };
  // a real keyboard: digits, Backspace and Enter on the keypad
  keyFn = e => {
    if (R?.type !== 'num') return;
    const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null;
    if (d) { e.preventDefault(); press(d); }
  };
  arm();
  return () => busy ? '' : hintText();
}

soBtn(); paintXp(); parkState();
prog.piscina || OPEN ? mapa() : piscina();
