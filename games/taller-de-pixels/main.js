import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, COLORS, POINTS, VALID, EXAM_PASS, shuffle, starsFor, F, simp, ruleText, ruleWhy,
  clean, noteOf, reached, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn,
  brokenRules, wrongCells, one, SPRITES } from './logic.js';
import { makeBoard, spriteSvg } from './pixels.js';
import { studio } from './lliure.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow } from '../../shared/shell.js';

const KEY = 'taller-de-pixels';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
// every new screen cancels the running one through this token
const fresh = tokens();

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');

/* ---------- the drawings ---------- */
// the frog of the pond, a pixel artist: a red beret and a brush with blue paint
const FROG = `<svg class="frog" viewBox="-40 -64 92 86" aria-hidden="true"><ellipse cx="0" cy="16" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 12q-9-2-7-9q7 2 11 6ZM25 12q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-6" rx="25" ry="20" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-26" r="4" fill="#0F3A40"/><circle cx="13" cy="-26" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-28" r="1.4" fill="#fff"/><circle cx="14.5" cy="-28" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -5 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-24 -38q4-16 26-16q20 1 22 13q-22 9-48 3Z" fill="#E8443A" stroke="#9E2A22" stroke-width="2" stroke-linejoin="round"/><circle cx="3" cy="-56" r="3.5" fill="#E8443A" stroke="#9E2A22" stroke-width="1.5"/>
  <path d="M27 10L41 -14" stroke="#C07A48" stroke-width="4.5" stroke-linecap="round"/><path d="M39 -12l4 -7 5 3 -3 7Z" fill="#EAF8F4"/><rect x="42" y="-26" width="8" height="8" fill="#3C7DF0" transform="rotate(30 46 -22)"/></svg>`;
const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Píxel perfecte!', 'Bon ull!'];
const HUES = [195, 28, 320, 262, 45, 140, 15, 200, 300, 170];
// the crab of the workshop walks along the top of the panel of a level done, with its legs open and closed
const WALKER = `<div class="walkway" aria-hidden="true"><div class="walker">${spriteSvg(SPRITES.cranc.g, 'fa')}${spriteSvg(SPRITES.crancB.g, 'fb')}</div></div>`;
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };
const plain = s => s.replace(/<span class="fr"><i>(\d+)<\/i><i>(\d+)<\/i><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');

const HUB = ownPage(KEY);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));

// a real keyboard: the screen on show says what its keys do
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });
// a tap that comes less than SETTLE after a question came up was meant for the one before
let openAt = 0;
const KIND = { read, paint };

/* ---------- the map ---------- */
const RING = [195, 320, 45, 15, 280];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" fill="none" stroke="hsl(${RING[c]} 70% 62%)" stroke-width="2.4" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const ICONS = ['📍', '🟦', '🎨', '🦋', '🧱', '🛍️', '🦀', '🖥️', '🎞️', '🪄'];
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
function mapa() {
  fresh(); show('El mapa del taller', false, 195);
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${ICONS[i]}</span>`,
    foot: got => { const shut = OPEN || PROJECTS.some((_, i) => noteOf(prog, i) >= VALID) ? '' : ' disabled title="Valida un projecte per obrir-lo"';
      return `\n    <div class="extra"><button class="btn soft" id="full"${shut}>Caça l'errada</button><button class="btn soft" id="free"${shut}>🎨 Taller lliure</button>
      ${badgeList(BADGES, got)}</div>`; },
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full], ['#free:not(:disabled)', lliure]] });
  here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: a pixel, a rectangle and a half, the first thing a profile with nothing saved meets ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true, 195); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  say('Benvingut al taller de píxels! Aquí es dibuixen sprites com els dels videojocs, píxel a píxel. Primer, tres reptes.');
  let k = 0;
  read({ t, L: { rounds: POOL }, stage, tip: say, slip: buzz, step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say('Ets a dins! Ara ja pots obrir el mapa del taller.', 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(16);
      await sleep(2200); if (t.on) mapa();
    } });
}

/* ---------- one level of a project ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), L = PROJECTS[sec].levels[idx];
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip"></p></div><div class="stage" id="stage"></div>`;
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); buzz(); };

  // the level is handed in at once, before any wait
  async function win(line) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel(stage, `${RM ? '' : WALKER}<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  const help = KIND[L.kind]({ t, L, stage, tip, slip, win });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars();
  if (stage.getBoundingClientRect().bottom > innerHeight) $('#coach').scrollIntoView({ block: 'start', behavior: 'auto' });
}

/* ---------- the exam of a circle: six levels of its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]);
  const qs = exam(c, Math.random), run = [], { stage, tail, dots, say } = frame(qs.length, 'Sis preguntes');
  let k = -1, res = null;
  const next = () => k === qs.length - 1 ? finish() : arm();
  function arm() {
    k++;
    const L = qs[k], last = k === qs.length - 1, qt = { get on() { return t.on && !done; } };
    let done = false, failed = false;
    const end = ok => {
      if (done || !t.on) return;
      done = true; failed = !ok; keyFn = null; stage.inert = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
      if (last) { res = examIn(prog, c, qs, run); res.first = res.good && !prog.exams[c]; prog = res.prog; save(); }
      if (ok) { say('Correcte!', 'go'); chime([523, 659, 784]); FX.celebrate(6); return sleep(1000).then(() => { if (t.on) next(); }); }
      say('No és correcte.', 'oops'); buzz(); openAt = performance.now() + SETTLE;
      tail.innerHTML = `<button class="btn" id="nx">${last ? 'Mira el resultat' : 'Segueix'}</button>`;
      $('#nx').onclick = e => { if (e.timeStamp >= openAt) next(); };
    };
    // of what the level says, the exam keeps the cheers while it runs and, once missed, what the right answer was
    const tip = (txt, cls = '') => { if (cls === 'oops' ? failed : cls === 'go' && !done) say(txt.replace(/^Ui! /, ''), cls); };
    stage.inert = false; tail.innerHTML = ''; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[L.p].name}`;
    say(L.kind === 'paint' ? `${L.say} Quan acabis, prem «Comprova».` : 'Mira el dibuix i respon. Només hi ha un intent!');
    KIND[L.kind]({ t: qt, L, stage, tip, slip: () => end(false), win: () => end(true), exam: true });
    scrollTo({ top: 0, behavior: 'auto' });
  }
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    panel(stage, `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? 'Molt bé! Però l\'examen només compta amb tots els projectes del cercle validats.' : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    scrollTo({ top: 0, behavior: 'auto' });
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  }
  arm();
}

/* ---------- the free workshop: lliure.js ---------- */
function lliure() {
  const t = fresh(); show('El taller lliure', true, 280);
  studio({ t, root: $('#game'), blip, chime, frog: FROG, celebrate: () => FX.celebrate(8) });
}

/* ---------- «Caça l'errada»: three sentences written about a drawing; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="board" id="board"></div><p class="ask claim">Algú ha escrit, mirant aquest dibuix:</p><p class="claimbox">«${C.says}»</p>`;
    makeBoard($('#board'), t, { max: 420 }).show(C.pic);
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Mira bé el dibuix: la frase diu la veritat?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { say(said, 'oops'); buzz(); }
    await sleep(ok ? 1300 : 2800); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${plain(c.real)}»)`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
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

/* ---------- read a drawing: one question after another, answered on the drawing, with the keys or with a choice ---------- */
// The drawing stays while the next question is about it too. A wrong answer is a slip and the frog says how to look; a right one
// lights up what answered it and says why. step(k), when given, hears of every new question (the dots of the Piscina)
function read({ t, L, stage, tip, slip, win, step }) {
  const n = L.rounds.length;
  let k = -1, R = null, busy = false, buf = '', fr = null, shown = null, opts = [];
  stage.innerHTML = `<p class="ask" id="q"></p><div class="board" id="board"></div><div class="ans" id="ans"></div>`;
  const B = makeBoard($('#board'), t, { onTap: touch, screen: L.screen }), ans = $('#ans');
  const KEYS = d => `<button class="key" data-d="${d}">${d}</button>`;
  function arm() {
    k++; R = L.rounds[k]; busy = false; buf = ''; fr = { n: '', d: '', on: 'n' }; openAt = performance.now() + SETTLE; step?.(k);
    const key = JSON.stringify(R.pic);
    if (key !== shown) { B.show(R.pic); shown = key; } else B.unmark();
    B.el.classList.toggle('tap', R.q.type === 'tap');
    $('#q').innerHTML = `${n > 1 ? `<small>Pregunta ${k + 1} de ${n}</small>` : ''}${R.q.text}`; again($('#q')).add('pop');
    const ty = R.q.type;
    if (ty === 'tap') ans.innerHTML = '<p class="how">👆 Toca el píxel al dibuix.</p>';
    else if (ty === 'pick') { opts = shuffle(R.q.opts.slice(), Math.random); ans.innerHTML = `<div class="opts${opts.some(o => o.length > 14) ? ' col' : ''}">${opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; }
    else ans.innerHTML = `<p class="display" id="disp" aria-live="polite"></p><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(KEYS).join('')}
      <button class="key del" data-d="del" aria-label="Esborra">⌫</button>${KEYS(0)}<button class="key ok" data-d="ok" aria-label="Comprova">✓</button>
      ${ty === 'frac' ? '<button class="key bar" data-d="/" aria-label="Ratlla de la fracció: ara el número de baix">/</button>' : ''}</div>`;
    paint();
  }
  const caret = '<i class="caret"></i>';
  function paint() {
    const d = $('#disp'); if (!d) return;
    if (R.q.type === 'frac') d.innerHTML = `<span class="fr big"><i class="${fr.on === 'n' ? 'on' : ''}">${fr.n || (fr.on === 'n' ? caret : '&nbsp;')}</i><i class="${fr.on === 'd' ? 'on' : ''}">${fr.d || (fr.on === 'd' ? caret : '&nbsp;')}</i></span>`;
    else d.innerHTML = buf || caret;
  }
  async function right(el) {
    busy = true;
    if (el) { el.classList.add('ok'); spark(el, 140); }
    blip(880); tip(`${pick(HURRAY)} ${R.q.say}`, 'go');
    if (R.q.type === 'num' || R.q.type === 'frac') { $('#disp')?.classList.add('ok'); ans.querySelectorAll('button').forEach(b => b.disabled = true); }
    // the answer shown on the drawing: its pixels fly to their new places, or turn over to their new colours
    const S = R.q.show;
    if (S) { await sleep(350); if (!t.on) return; S.src ? B.morph(S.pic, S.src) : B.filter(S.pic); shown = JSON.stringify(S.pic); }
    else B.cheer();
    await sleep((k === n - 1 ? 1500 : 1900) + (S && !RM ? 1200 : 0)); if (!t.on) return;
    if (k === n - 1) { keyFn = null; win(`${n === 1 ? 'Una pregunta resolta' : `${n} preguntes resoltes`}<br><small>${L.title || ''}</small>`); } else arm();
  }
  function wrong(el) {
    slip(); if (el) again(el).add('shake');
    tip(`Ui! ${R.q.hint}`, 'oops');
  }
  // a tap on a pixel of the drawing
  function touch(key) {
    if (busy || !R || !t.on || performance.now() < openAt || R.q.type !== 'tap') return;
    if (R.q.ans.includes(key)) { B.mark([key], 'ok'); return right(null); }
    B.mark([key], 'no'); B.shake([key]); wrong(null);
  }
  // a fraction typed: right when it is the same part as the answer, or only the simplest one when the question asks for it
  const same = (a, b) => a[0] * b[1] === a[1] * b[0];
  function pressFrac(d) {
    const a = R.q.ans;
    if (d === '/') { if (fr.n) fr.on = 'd'; blip(); return paint(); }
    if (d === 'del') { if (fr.on === 'd' && !fr.d) fr.on = 'n'; else fr[fr.on] = fr[fr.on].slice(0, -1); blip(); return paint(); }
    if (d === 'ok') {
      if (!fr.n) return;
      if (!fr.d) { fr.on = 'd'; return paint(); }
      const v = [+fr.n, +fr.d], good = v[1] > 0 && (R.q.simple ? v[0] === a[0] && v[1] === a[1] : same(v, a));
      if (good) return right(null);
      fr = { n: '', d: '', on: 'n' }; paint(); again($('#disp')).add('shake');
      if (R.q.simple && v[1] > 0 && same(v, a)) { const [sn, sd] = simp(...v); return tip(`És la mateixa part, però encara es pot fer més petita: prova de dividir el de dalt i el de baix per ${v[0] / sn}.`, 'oops'); }
      return wrong(null);
    }
    if (fr[fr.on].length >= 3) return;
    fr[fr.on] = (fr[fr.on] + d).replace(/^0+(?=\d)/, ''); blip(); paint();
    // a right fraction is taken as soon as its bottom number is written, with no ✓
    const v = [+fr.n, +fr.d];
    if (fr.on === 'd' && v[1] > 0 && (R.q.simple ? v[0] === a[0] && v[1] === a[1] : same(v, a))) right(null);
  }
  function press(d) {
    if (busy || !R) return;
    if (R.q.type === 'frac') return pressFrac(d);
    if (R.q.type !== 'num') return;
    if (d === 'ok') {
      if (!buf) return;
      if (+buf === R.q.ans) return right(null);
      buf = ''; paint(); again($('#disp')).add('shake'); return wrong(null);
    }
    if (d === '/') return;
    if (d === 'del') buf = buf.slice(0, -1); else if (buf.length < 6) buf = (buf + d).replace(/^0+(?=\d)/, ''); else return;
    blip(); paint();
    // the right number is taken as soon as it is written, with no ✓; a wrong one waits for ✓ (12 may still become 120)
    if (d !== 'del' && +buf === R.q.ans) right(null);
  }
  ans.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || !t.on || e.timeStamp < openAt) return;
    if ('d' in b.dataset) return press(b.dataset.d);
    if ('v' in b.dataset) { const ok = opts[+b.dataset.v] === R.q.ans; if (ok) right(b); else { b.disabled = true; wrong(b); } }
  };
  keyFn = e => {
    const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === '/' ? '/' : /^\d$/.test(e.key) ? e.key : null;
    if (d && (R?.q.type === 'num' || R?.q.type === 'frac') && !e.target.closest?.('.px')) { e.preventDefault(); press(d); }
  };
  arm(); if (L.say) tip(L.say);
  return () => busy ? '' : R.q.hint;
}

/* ---------- paint a drawing, and check it whole ---------- */
// Over the grid, what to follow: the model to copy, the coordinates, or the rules. The palette picks the colour in the finger (the
// rubber rubs out); a pixel tapped again with its own colour is rubbed out too. «Comprova» checks it: a wrong one is a slip and
// rings what is wrong; a right one ends the level
function paint({ t, L, stage, tip, slip, win }) {
  let busy = false, brush = L.colors[0];
  stage.innerHTML = `${L.model ? '<div class="board model" id="model"><p class="cap">El model</p></div>' : ''}${L.steps ? `<ol class="todo" id="todo">${L.steps.map(s => `<li>${s.ch ? `<b class="sw" style="--c:${COLORS[s.ch].hex}"></b>` : ''}<span>${s.text.replace(/\(\d+, \d+\)/g, '<span class="c">$&</span>')}</span></li>`).join('')}</ol>` : ''}
    ${L.rules ? `<ul class="rules" id="rules"><li class="head">El dibuix ha de tenir</li>${L.rules.map(r => `<li>${ruleText(r)}</li>`).join('')}</ul>` : ''}
    <div class="board" id="board"></div><div class="palette" id="pal" role="radiogroup" aria-label="Colors">${[...L.colors, '.'].map(ch => `<button class="pc${ch === '.' ? ' rub' : ''}" data-c="${ch}" role="radio" aria-label="${ch === '.' ? 'Goma' : one(ch)}" style="--c:${ch === '.' ? 'transparent' : COLORS[ch].hex}">${ch === '.' ? 'Goma' : ''}</button>`).join('')}</div>
    <div class="ans"><button class="btn" id="check">Comprova</button></div>`;
  if (L.model) makeBoard($('#model'), t, { max: 260 }).show(L.model);
  const B = makeBoard($('#board'), t, { screen: L.screen, paint: { given: L.given, brush: () => brush, onChange: () => { if (!busy) { B.unmark(); $('#board').classList.remove('wrong'); } } } });
  B.show({ g: L.given, axes: !!L.axes, axis: L.axis, tiles: L.tiles });
  const pal = $('#pal'), pickC = ch => { brush = ch; pal.querySelectorAll('.pc').forEach(b => b.setAttribute('aria-checked', b.dataset.c === ch)); };
  pal.onclick = e => { const b = e.target.closest('.pc'); if (b) { pickC(b.dataset.c); blip(520); } };
  pickC(brush);
  // the steps of the list can be ticked off, to keep the place
  $('#todo')?.addEventListener('click', e => { const li = e.target.closest('li'); if (li) li.classList.toggle('done'); });
  // what is wrong, and what the frog says of it; an empty list when it is right
  function verdict() {
    const g = B.grid();
    if (L.goal) { const bad = wrongCells(L, g);
      return [bad, bad.length ? `${bad.length === 1 ? 'Hi ha 1 píxel que no toca' : `Hi ha ${bad.length} píxels que no toquen`}: els he encerclat.${L.steps ? ' Recorda: primer la fila, després la columna.' : L.axis ? ' Cada píxel té el seu bessó a la mateixa distància del mirall.' : ''}` : ''] }
    const bad = brokenRules(L, g);
    $('#rules').querySelectorAll('li:not(.head)').forEach((li, k) => { li.classList.toggle('no', bad.includes(k)); li.classList.toggle('ok', !bad.includes(k)); });
    return [bad, bad.length ? `No es compleix: ${ruleText(L.rules[bad[0]]).replace(/<b class="sw"[^>]*><\/b>\s*/, '')}. ${ruleWhy(L.rules[bad[0]], g)}` : ''];
  }
  $('#check').onclick = async () => {
    if (busy || !t.on) return;
    const [bad, why] = verdict();
    if (bad.length) {
      if (L.goal) { B.mark(bad, 'no'); B.shake(bad); }
      slip(); again($('#board')).add('shake'); $('#board').classList.add('wrong'); return tip(`Ui! ${why}`, 'oops');
    }
    busy = true; $('#check').disabled = true; pal.inert = true; $('#board').inert = true; $('#board').classList.add('right'); spark($('#board'), 140);
    tip(`${pick(HURRAY)} ${L.done || 'El dibuix és perfecte.'}`, 'go');
    // the reward: the pixels painted fly in from their twins, the drawing is made again before the eyes, or it comes alive
    let more = 0;
    if (RM) B.cheer();
    else if (L.fly) { B.fly(L.fly); more = 900; }
    else if (L.after) {
      const a = L.after(B.grid());
      B.unlock();
      if (a.from) { await sleep(500); if (!t.on) return; B.show(a.from, { reveal: false }); await sleep(450); if (!t.on) return; B.morph(a.pic, a.src); more = 900; }
      else { B.show(a.pic, { reveal: false }); more = 2400; }
    } else B.cheer();
    await sleep(1700 + more); if (!t.on) return;
    win(`${L.title}<br><small>Dibuix acabat</small>`);
  };
  keyFn = e => { const k = +e.key; if (k >= 1 && k <= L.colors.length + 1 && !e.target.closest?.('input')) pickC([...L.colors, '.'][k - 1]); };
  tip(L.say);
  return () => {
    if (busy) return '';
    const [bad, why] = verdict();
    if (L.goal && bad.length) B.mark(bad, 'no');
    return bad.length ? why : 'Ja està bé! Prem «Comprova».';
  };
}
soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
