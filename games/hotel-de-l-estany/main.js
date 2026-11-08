import { $, RM, sleep, pick, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';
import { PROJECTS, CIRCLES, POOL, POINTS, EXAM_PASS, VALID, GUESTS, shuffle, starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen,
  circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn, servedIn, starsOf, tapSay } from './logic.js';
import { card, face, GRUM } from './cards.js';
import { hotel } from './world.js';

const KEY = 'hotel-de-l-estany';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, lv, piscina, exams, fulls, clients }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
const fresh = tokens();
const W = hotel($('#world'));
const hotelState = () => W.state({ piscina: prog.piscina || OPEN, valid: OPEN ? PROJECTS.map((_, i) => i) : validated(prog), stars: starsOf(prog) });

/* ---------- the sounds: a click for each key, the bell of the desk for a guest served, a fanfare for a level ---------- */
const { chime } = voice(() => prog.so), { tone: snd } = voice(() => prog.so, false);
const tick = () => snd(1900, 0, 0.035, 0.035, 'square');
const ding = () => { snd(1568, 0, 1.5, 0.12); snd(1568 * 2.76, 0, 0.7, 0.03); snd(1568 * 5.4, 0, 0.3, 0.012); };
const bonk = () => { snd(250, 0, 0.13, 0.09, 'triangle'); snd(175, 0.1, 0.24, 0.09, 'triangle'); };
const dingdong = () => { snd(1319, 0, 0.7, 0.07); snd(1047, 0.3, 0.9, 0.07); };
const fanfare = () => { chime([523, 659, 784, 1047, 1319], 0.09); setTimeout(ding, 520); };
const clink = (k = 0) => { snd(2200 + k * 140, 0, 0.09, 0.04, 'triangle'); };
const floorTick = up => snd(up ? 520 : 400, 0, 0.06, 0.04, 'triangle');
const buzz = () => snd(118, 0, 0.09, 0.04, 'sawtooth');

const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Client content!', 'Bona feina!', 'Així es porta un hotel!'];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };

/* ---------- the frame ---------- */
const HUB = ownPage(KEY);
const WIDE = matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');
// the 3D hotel is framed in the part of the screen the panel leaves free: on the left of it when the screen is wide, above it otherwise
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

/* ---------- the map: the directory of the hotel, over the hotel itself ---------- */
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN });
// the plates of the directory: each project engraved on brass, and each circle (the reception bell, a bed, the cloche of the restaurant)
const ico = d => `<svg class="ico" viewBox="0 0 32 32" aria-hidden="true">${d}</svg>`;
const BED = '<path d="M5 24V11M5 19H27V24M27 19V15.5A2.5 2.5 0 0 0 24.5 13H13V19"/><circle cx="9" cy="15.5" r="2.2" class="f"/>';
const BELL = '<path d="M6 23H26M8.5 22.5A7.5 7.5 0 0 1 23.5 22.5M16 15V12.5"/><circle cx="16" cy="11" r="1.6" class="f"/>';
const CLOCHE = '<path d="M5 23H27M7.5 22.5A8.5 8.5 0 0 1 24.5 22.5"/><circle cx="16" cy="12.5" r="1.7" class="f"/>';
const ICONS = [
  '<circle cx="10" cy="16" r="5.2"/><path d="M15.2 16H27M22 16V20.5M26 16V19.5"/>',
  '<rect x="8" y="4.5" width="16" height="23" rx="2.5"/><path d="M16 8.5L12.5 13H19.5Z M16 23.5L12.5 19H19.5Z" class="f"/>',
  '<rect x="5.5" y="8" width="21" height="18.5" rx="2.5"/><path d="M5.5 13.5H26.5M11 5V10M21 5V10"/><path d="M10 17h3v3h-3zM15 17h3v3h-3zM20 17h3v3h-3zM10 21.5h3v2.5h-3z" class="f"/>',
  BED,
  '<path d="M8.5 14H23.5L21.5 27H10.5Z"/><path d="M10 14A6 6 0 0 1 22 14"/><path d="M12 19H20" />',
  '<path d="M5 8.5L12 5.5L20 8.5L27 5.5V24L20 27L12 24L5 27Z M12 5.5V24M20 8.5V27"/><circle cx="16" cy="15" r="1.8" class="f"/>',
  CLOCHE,
  '<path d="M9 4.5H23V27.5L20.7 25.9L18.3 27.5L16 25.9L13.7 27.5L11.3 25.9L9 27.5Z M12.5 10.5H19.5M12.5 15H19.5M12.5 19.5H16.5"/>',
  '<path d="M5 26.5H27"/><path d="M8 18h4v8.5H8zM14 12h4v14.5h-4zM20 7h4v19.5h-4z" class="f"/>'
].map(ico);
const WING = [BELL, BED, CLOCHE].map(ico);
const STAR = ico('<path d="M16 5L19.1 12.2L26.8 12.9L21 18L22.7 25.6L16 21.6L9.3 25.6L11 18L5.2 12.9L12.9 12.2Z" class="f"/>');
let here = -1;
function mapa() {
  const t = fresh(); show("El directori de l'hotel", false);
  hotelState(); W.go('map');
  const v = validated(prog), stars = starsOf(prog), tip = M.advice();
  const row = i => {
    const n = noteOf(prog, i), ok = n >= VALID, st = prog.lv.slice(i * 10, i * 10 + 10);
    return `<li><button class="row${ok ? ' ok' : ''}" data-p="${i}"${M.openC(circleOf(i)) ? '' : ' disabled'}>
      <span class="plate" aria-hidden="true">${ICONS[i]}</span><span class="what"><b>${PROJECTS[i].name}</b><small>${PROJECTS[i].sub}</small>
      <span class="pp" aria-hidden="true">${st.map(s => `<i class="s${s}"></i>`).join('')}</span></span><span class="mk">${M.noteText(i)}</span></button></li>`;
  };
  const exRow = c => { const done = prog.exams[c], op = M.openX(c); return `<li><button class="row exam${done ? ' ok' : ''}" data-x="${c}"${op ? '' : ' disabled'}><span class="plate" aria-hidden="true">${STAR}</span><span class="what"><b>Inspecció del cercle ${c}</b><small>L'examen: sis clients, un intent cada un</small></span><span class="mk">${done ? 'Superat ✓' : op ? 'Sis preguntes' : M.openC(c) ? 'Valida els projectes' : 'Tancat'}</span></button></li>`; };
  $('#game').innerHTML = `${view('44vh')}<div class="sheet map">
    <div class="rating" role="img" aria-label="Hotel de ${stars} ${stars === 1 ? 'estrella' : 'estrelles'}"><span>${'★'.repeat(stars)}<em>${'★'.repeat(3 - stars)}</em></span>
      <p>${v.length >= 9 ? "L'hotel és sencer: totes les plantes enceses!" : `Cada projecte validat encén una part de l'hotel: <b>${v.length} de 9</b>.`}${prog.clients ? ` Has atès <b>${prog.clients}</b> ${prog.clients === 1 ? 'client' : 'clients'}.` : ''}</p></div>
    ${tip ? `<p class="next">${tip}</p>` : ''}
    ${CIRCLES.map((C, c) => `<section class="wing${M.openC(c) ? '' : ' shut'}" aria-labelledby="w${c}"><h2 id="w${c}"><span aria-hidden="true">${WING[c]}</span> Cercle ${c} · ${C.name}</h2>
      ${M.openC(c) ? '' : `<p class="why">Supera la inspecció del cercle ${c - 1} per obrir-lo.</p>`}<ol>${C.projects.map(row).join('')}${exRow(c)}</ol></section>`).join('')}
    <div class="extra"><button class="btn soft" id="full"${OPEN || v.length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>${badgeList(BADGES, badges(prog))}</div></div>`;
  const root = $('#game');
  root.onclick = e => {
    const b = e.target.closest('.row:not(.exam)'), x = e.target.closest('.row.exam');
    if (b && !b.disabled) { here = +b.dataset.p; level(here, M.nextLevel(here)); }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
  };
  // a project under the finger, or with the focus, lights its part of the hotel
  const lit = e => { const b = e.target.closest?.('.row:not(.exam)'); W.highlight(b ? +b.dataset.p : null); };
  root.onpointerover = lit; root.onfocusin = lit; root.onpointerleave = () => W.highlight(null);
  ($(`[data-p="${here}"]:not(:disabled)`, root) || $('.row:not(:disabled)', root))?.focus({ preventScroll: true });
  frame3d(); here = -1;

}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the bellhop with his tip, the stage and the room under it
function shell(n, label, h = '30vh') {
  $('#game').innerHTML = `${view(h)}<div class="sheet play"><div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${GRUM}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  frame3d();
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: three tests at the pool, and the hotel opens ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  hotelState(); W.go('pool');
  const { stage, dots, say } = shell(POOL.length, 'Tres proves');
  say("Hola! Sóc el grum de l'hotel. Abans d'obrir-lo, tres proves a la piscina: una clau, l'ascensor i una factura.");
  let k = 0;
  play({ t, rounds: POOL, set: 'pool', stage, tip: say, slip: bonk, step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say("L'hotel obre les portes! Ja pots dirigir-lo.", 'go'); W.go('map');
      for (let i = 0; i < 6; i++) setTimeout(buzz, 1300 + i * 110);
      await sleep(1300); await W.openSign(); fanfare(); W.celebrate(3);
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
    <div class="coach" id="coach">${GRUM}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><span class="combo" id="cb" hidden></span><div class="stage" id="stage"></div></div>`;
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
    // a project validated: the camera goes out to the whole hotel, and the part this project lights comes on before the child's eyes
    if (r.valid) W.go('map').then(() => { if (!t.on) return; hotelState(); W.highlight(sec); W.celebrate(3); setTimeout(() => { if (t.on) W.highlight(null); }, 2800); });
    await sleep(1000); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.valid ? `<p class="lead go">S'ha encès una part nova de l'hotel.</p>` : ''}
      ${r.exam ? `<p class="lead go">S'ha obert la inspecció del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  let streak = 0;
  const help = play({ t, rounds, set: P.set, stage, tip, slip: () => { streak = 0; combo(0); slip(); }, win, good: () => combo(++streak), title: L.title });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars(); tip(L.say);
}

/* ---------- the inspection of a circle: six guests of its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`La inspecció del cercle ${c}`, true);
  const qs = exam(c, Math.random), run = [], { stage, tail, dots, say } = shell(qs.length, 'Sis clients');
  let k = -1, res = null;
  const next = () => k === qs.length - 1 ? finish() : arm();
  function arm() {
    k++;
    const Q = qs[k], last = k === qs.length - 1, qt = { get on() { return t.on && !done; } };
    let done = false, failed = false;
    const end = ok => {
      if (done || !t.on) return;
      done = true; failed = !ok; keyFn = null; stage.inert = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
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
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    W.go('map'); if (r.first) hotelState();
    r.good ? fanfare() : bonk();
    say(r.good ? 'Inspecció superada!' : 'Inspecció acabada. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) W.celebrate(3);
    panel(stage, `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superada ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja la tenies superada.'}` : r.score >= EXAM_PASS ? "Molt bé! Però la inspecció només compta amb tots els projectes del cercle validats." : `Per superar-la calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first ? `<p class="lead go">L'hotel guanya una estrella: ${'★'.repeat(starsOf(prog))}</p>` : ''}
      ${r.first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra inspecció</button>`);
    scrollTo({ top: 0, behavior: 'auto' });
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  }
  arm();
}

/* ---------- «Caça l'errada»: three lines written in the book of the reception; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true); W.go('desk');
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = shell(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="cardbox">${card(C.card)}</div><p class="ask claim">Al llibre de recepció hi diu:</p><p class="claimbox">«${C.says}»</p>`;
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Pensa-hi bé: el llibre diu la veritat?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(said, 'go'); ding(); } else { say(said, 'oops'); bonk(); }
    await sleep(ok ? 1400 : 2900); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}»)`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? fanfare() : bonk();
    say(r.good ? 'Llibre perfecte!' : 'Llibre revisat.', r.good ? 'go' : '');
    if (r.good) W.celebrate(2);
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre full</button>`);
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

/* ---------- the guests of a level, one after another ---------- */
// Each round is a guest with a card and a question. The answer is typed on the brass keypad (taken as soon as it is right; ✓ sends one
// that is not, and that is a slip), picked from the options, or done on the card (a key, a day, a tile, a room, a dish, a bar) or with
// the lift. A slip says how to work it out, never the answer. step(k), when given, hears of every new round (the dots of the Piscina);
// good() of every round done right at the first go
function play({ t, rounds, set, stage, tip, slip, win, step, good, exam = false }) {
  const n = rounds.length, kind = set === 'restaurant' ? 'table' : 'room';
  let k = -1, R = null, busy = false, buf = '', clean1 = true, S = {};
  stage.innerHTML = `<p class="ask" id="q"></p><div class="cardbox" id="cardbox"></div><div class="made" id="made"></div><div class="ans" id="ans"></div>`;
  const box = $('#cardbox'), ans = $('#ans'), made = $('#made');
  const sp = () => R.sp || GUESTS[Math.floor(Math.random() * GUESTS.length)].sp;
  const keypad = () => `<div class="disp" aria-live="polite">${R.neg ? '<button class="key minus" data-d="neg" aria-label="Menys">−</button>' : ''}<output id="buf"></output><span class="unit">${R.unit || ''}</span><button class="del" data-d="del" aria-label="Esborra">⌫</button></div>
    <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}<span></span><button class="key" data-d="0">0</button><button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`;
  const writeBuf = () => { $('#buf').textContent = buf || ' '; box.querySelectorAll('.blank').forEach(b => { b.textContent = buf || '?'; }); };
  const hintText = () => { if (!exam) box.classList.add('hint'); return R.hint; };

  function arm() {
    k++; R = rounds[k]; busy = false; buf = ''; clean1 = true; openAt = performance.now() + SETTLE; step?.(k); S = {};
    $('#q').innerHTML = `${n > 1 ? `<small>Client ${k + 1} de ${n}</small>` : ''}${R.text}`; again($('#q')).add('pop');
    box.innerHTML = card(R.card); box.classList.remove('hint', 'won'); made.innerHTML = '';
    W.crowd(); W.guest(sp(), set === 'facade' ? null : set);
    if (R.card.k === 'rack' && R.card.lit.length) { const [f, d] = R.card.lit[0].split('-').map(Number); W.key(f, d); } else W.key(0, 0);
    const ty = R.type;
    if (ty === 'num') { ans.innerHTML = keypad(); writeBuf(); }
    else if (ty === 'pick') { S.opts = R.order || shuffle(R.opts.slice(), Math.random); ans.innerHTML = `<div class="opts${S.opts.every(o => o.length < 14) ? '' : ' col'}">${S.opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; }
    else if (ty === 'tap') ans.innerHTML = '<p class="how">👆 Toca-ho a la targeta.</p>';
    else if (ty === 'mark') { S.on = new Set(); ans.innerHTML = `<div class="opts"><span class="chip" id="cnt">${R.count ? 'Rajoles: 0' : 'Marcades: 0'}</span><button class="btn soft" id="fet">✓ Fet</button></div>`; }
    else if (ty === 'lift') { S.at = R.card.at; W.lift.set(S.at); ans.innerHTML = liftPanel(); paintLift(); }
    else if (ty === 'fill') { S.left = R.card.n; S.seated = Array(R.card.rooms).fill(0); ans.innerHTML = `<p class="how">👆 Toca ${R.card.table ? 'una taula' : 'una habitació'}. Queden <b id="left">${S.left}</b>.</p>`; }
    else if (ty === 'combo') { S.made = new Set(); S.sel = [null, null]; S.all = R.card.cols[0].length * R.card.cols[1].length; ans.innerHTML = `<p class="how">👆 Un primer i un segon. Menús fets: <b id="left">0</b></p>`; }
    else if (ty === 'bars') { S.v = R.card.values.map(() => 0); ans.innerHTML = '<p class="how">👆 Toca cada columna a la seva altura.</p>'; }
  }

  // the lift: buttons for every floor, or the two arrows and the doors
  const liftPanel = () => R.card.mode === 'buttons'
    ? `<div class="lpanel"><output class="ld" id="ld"></output><div class="lbtns">${[5, 4, 3, 2, 1, 0, -1, -2].map(f => `<button class="key lb" data-f="${f}">${f}</button>`).join('')}</div></div>`
    : `<div class="lpanel"><output class="ld" id="ld"></output><div class="larr"><button class="key arr" data-a="1" aria-label="Puja">▲</button><button class="key arr" data-a="-1" aria-label="Baixa">▼</button></div><button class="btn" id="obre">Obre les portes</button></div>`;
  const paintLift = () => { const d = $('#ld'); if (d) d.textContent = S.at; const cab = box.querySelector('.cab'); if (cab) cab.style.transform = `translateY(${8 + (R.card.hi - S.at) * 24}px)`; box.querySelectorAll('.k-lift .lab').forEach(l => l.classList.toggle('gold', +l.textContent === S.at)); };
  async function ride(f) {
    if (S.moving) return; S.moving = true; const up = f > S.at;
    for (let x = S.at; x !== f; x += up ? 1 : -1) setTimeout(() => floorTick(up), Math.abs(x - S.at) * 200);
    S.at = f; paintLift(); await W.lift.go(f); S.moving = false; if (!t.on || busy) return; dingdong();
  }

  async function right(el) {
    busy = true; if (clean1) good?.();
    if (el) { el.classList.add('ok'); }
    tip(`${pick(HURRAY)} ${R.say}`, 'go'); ding(); W.bell(); W.happy();
    if (R.card.k === 'rack' && typeof R.ans === 'string') { const [f, d] = R.ans.split('-').map(Number); W.key(f, d); }
    if (set === 'facade') W.occupancy(typeof R.ans === 'number' ? Math.max(4, Math.min(40, R.ans)) : 24);
    ans.querySelectorAll('button').forEach(b => { b.disabled = true; });
    box.classList.add('won'); box.classList.remove('hint');
    await sleep(800); if (!t.on) return;
    W.leave({ room: R.room });
    await sleep(k === n - 1 ? 500 : 900); if (!t.on) return;
    if (k === n - 1) { keyFn = null; win(`${n === 1 ? 'Un client atès' : `${n} clients atesos`}`); } else arm();
  }
  function wrong(el, text) {
    slip(); clean1 = false; W.sad();
    if (el) { again(el).add('shake'); }
    tip(`Ui! ${text || hintText()}`, 'oops'); hintText();
  }
  function press(d) {
    if (busy || R?.type !== 'num') return;
    const goal = String(R.ans);
    if (d === 'ok') { if (!buf || buf === '-') return; if (buf === goal) return right(null); buf = ''; writeBuf(); return wrong(null); }
    if (d === 'del') buf = buf.slice(0, -1);
    else if (d === 'neg') buf = buf.startsWith('-') ? buf.slice(1) : '-' + buf;
    else { if (buf.replace('-', '').length >= 5) return; buf = (buf + d).replace(/^(-?)0+(?=\d)/, '$1'); }
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
      $('#cnt').textContent = `${R.count ? 'Rajoles' : 'Marcades'}: ${S.on.size}`;
      if (S.on.size === R.ans.length && R.ans.every(a => S.on.has(a))) right(null);
      return;
    }
    if (ty === 'fill') {
      const i = +key.slice(1), cap = R.card.cap;
      if (S.seated[i] >= cap) return tip(`${R.card.table ? 'Aquesta taula' : 'Aquesta habitació'} ja és plena. Toca'n una altra.`);
      const put = Math.min(cap - S.seated[i], S.left), q = [...box.querySelectorAll('.tok:not(.gone)')].slice(0, put);
      q.forEach(x => x.classList.add('gone'));
      // each guest sits on its bed or its chair, with its face on it
      const seats = [...el.querySelectorAll('.seat')], sit = el.querySelector('.sit'), who = R.card.sp;
      for (let j = S.seated[i]; j < S.seated[i] + put; j++) {
        const s = seats[j]; if (!s) continue; s.classList.add('on');
        const b = s.getBBox(); sit.insertAdjacentHTML('beforeend', `<g class="pop">${face(who, b.x + b.width / 2, b.y + b.height / 2, 9)}</g>`);
      }
      S.seated[i] += put; S.left -= put; $('#left').textContent = S.left; snd(600 + put * 60, 0, 0.1, 0.06, 'triangle');
      W.seat(kind, i, put, sp(), set === 'clean' ? 3 : 2);
      if (!S.left) right(null);
      return;
    }
    if (ty === 'combo') {
      const [col, i] = key.split('-').map(Number); S.sel[col] = i; box.querySelectorAll(`.dish[data-k^="${col}-"]`).forEach(d => d.classList.toggle('sel', d.dataset.k === key)); clink(col);
      if (S.sel[0] != null && S.sel[1] != null) {
        const id = `${S.sel[0]}-${S.sel[1]}`, name = `${R.card.cols[0][S.sel[0]]} + ${R.card.cols[1][S.sel[1]]}`;
        if (S.made.has(id)) tip(`El menú ${name} ja el tens. Prova'n un altre.`);
        else { S.made.add(id); made.insertAdjacentHTML('beforeend', `<span class="chip pop">${name}</span>`); $('#left').textContent = S.made.size; snd(700 + S.made.size * 50, 0, 0.1, 0.06, 'triangle'); }
        S.sel = [null, null]; setTimeout(() => box.querySelectorAll('.dish.sel').forEach(d => d.classList.remove('sel')), 250);
        if (S.made.size === S.all) right(null);
      }
      return;
    }
    if (ty === 'bars') {
      const [i, v] = key.split('-').map(Number); S.v[i] = v;
      const bar = box.querySelector(`.bar[data-i="${i}"] .b`), H = 170, top = 14, sc = H / R.card.max;
      bar.setAttribute('y', top + H - v * sc); bar.setAttribute('height', v * sc); snd(400 + v * 12, 0, 0.08, 0.05, 'triangle');
      if (S.v.every((x, j) => x === R.card.values[j])) right(null);
    }
  }
  box.onclick = e => {
    const el = e.target.closest('[data-k]'); if (!el || busy || !t.on || e.timeStamp < openAt) return;
    if (!['tap', 'mark', 'fill', 'combo', 'bars'].includes(R.type)) return;
    onCard(el.dataset.k, el);
  };
  ans.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || !t.on || e.timeStamp < openAt) return;
    if ('d' in b.dataset) return press(b.dataset.d);
    if ('v' in b.dataset) { const ok = S.opts[+b.dataset.v] === R.ans; if (ok) right(b); else { b.disabled = true; wrong(b); } return; }
    if (b.id === 'fet') { if (S.on.size === R.ans.length && R.ans.every(a => S.on.has(a))) return right(null); return wrong(null); }
    if ('f' in b.dataset) {
      const f = +b.dataset.f; tick();
      ride(f).then(() => { if (busy || !t.on) return; if (f === R.ans) right(b); else if (R.free) tip(`Hem arribat a la planta ${f}. ${R.text}`); else wrong(b, `Això és la planta ${f}. ${R.hint}`); });
      return;
    }
    if ('a' in b.dataset) { const f = S.at + +b.dataset.a; if (f < R.card.lo || f > R.card.hi || S.moving) return; tick(); ride(f); return; }
    if (b.id === 'obre') { if (S.moving) return; if (S.at === R.ans) { dingdong(); right(b); } else wrong(b, `Som a la planta ${S.at}. ${R.hint}`); }
  };
  // a real keyboard: digits, minus, Backspace and Enter on the keypad
  keyFn = e => {
    if (R?.type !== 'num') return;
    const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === '-' && R.neg ? 'neg' : /^\d$/.test(e.key) ? e.key : null;
    if (d) { e.preventDefault(); press(d); }
  };
  arm();
  return () => busy ? '' : hintText();
}

soBtn(); paintXp(); hotelState();
prog.piscina || OPEN ? mapa() : piscina();
