import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, SETS, VENNS, POINTS, VALID, EXAM_PASS, shuffle, starsFor, num, ruleText,
  clean, noteOf, reached, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn,
  wrongValues, wrongSlices, wrongPlaces, brokenRules, balanced, mean, STATS } from './logic.js';
import { draw, mark, buildBars, buildLine, buildPie, buildVenn, buildGantt, buildBalance } from './charts.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow } from '../../shared/shell.js';

const KEY = 'observatori-de-l-estany';
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
// the frog of the pond, a detective of data: a cap and a magnifying glass
const FROG = `<svg class="frog" viewBox="-40 -60 92 82" aria-hidden="true"><ellipse cx="0" cy="16" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 12q-9-2-7-9q7 2 11 6ZM25 12q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-6" rx="25" ry="20" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-26" r="4" fill="#0F3A40"/><circle cx="13" cy="-26" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-28" r="1.4" fill="#fff"/><circle cx="14.5" cy="-28" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -5 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-21 -37q4-17 21-18q17 1 21 18Z" fill="#8A5A2B" stroke="#5B3A17" stroke-width="2"/><path d="M-27 -37h54" stroke="#5B3A17" stroke-width="4" stroke-linecap="round"/><path d="M-19 -42h38" stroke="#F7C64E" stroke-width="3"/>
  <path d="M30 4l13 13" stroke="#5B3A17" stroke-width="5" stroke-linecap="round"/><circle cx="25" cy="-2" r="11" fill="rgb(111 227 255 / 0.25)" stroke="#F7C64E" stroke-width="3.5"/>
  <path d="M19 -6q4-4 9-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/></svg>`;
const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Bona lectura!', 'Ull de detectiu!'];
const HUES = [195, 48, 320, 28, 140, 262, 170, 45];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };

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
const KIND = { read, build };

/* ---------- the map ---------- */
const RING = [195, 320, 45];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 70% 62%)" stroke-width="2.4" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
// the icon of each project on the map: a little chart of its kind
const ICONS = ['🔢', '📊', '⭕', '🥧', '📈', '🗓️', '⚖️', '🔍'];
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
function mapa() {
  fresh(); show("El mapa de l'observatori", false, 195);
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${ICONS[i]}</span>`,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="full"${OPEN || PROJECTS.some((_, i) => noteOf(prog, i) >= VALID) ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full]] });
  here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: three taps on three charts, the first thing a profile with nothing saved meets ---------- */
// A wrong tap only shakes. The third right one saves piscina and opens the map
function piscina() {
  const t = fresh(); show('La Piscina', true, 195); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  say("Benvingut a l'observatori! Aquí es llegeixen dades: taules, gràfics i diagrames. Primer, tres proves de detectiu.");
  let k = 0;
  read({ t, L: { rounds: POOL }, stage, tip: say, slip: buzz, step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say('Ets a dins! Ara ja pots obrir el mapa de l\'observatori.', 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(16);
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
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
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
    say(L.kind === 'build' ? 'Construeix el gràfic i comprova\'l.' : 'Llegeix el gràfic i respon. Només hi ha un intent!');
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

/* ---------- «Caça l'errada»: three sentences written about a chart; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="board" id="board"></div><p class="ask claim">Algú ha escrit, mirant aquest gràfic:</p><p class="claimbox">«${C.says}»</p>`;
    draw($('#board'), C.chart);
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Llegeix bé el gràfic: la frase diu la veritat?');
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
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}»)`] : []);
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

/* ---------- read a chart: one question after another, answered on the chart, with the keys or with a choice ---------- */
// The chart stays while the next question is about it too. A wrong answer is a slip and the frog says how to look; a right one
// lights up what answered it and says why. step(k), when given, hears of every new question (the dots of the Piscina)
function read({ t, L, stage, tip, slip, win, step }) {
  const n = L.rounds.length;
  let k = -1, R = null, busy = false, buf = '', seq = 0, shown = null, opts = [];
  stage.innerHTML = `<p class="ask" id="q"></p><div class="board" id="board"></div><div class="ans" id="ans"></div>`;
  const board = $('#board'), ans = $('#ans');
  function arm() {
    k++; R = L.rounds[k]; busy = false; buf = ''; seq = 0; openAt = performance.now() + SETTLE; step?.(k);
    const key = JSON.stringify(R.chart);
    if (key !== shown) { draw(board, R.chart); shown = key; }
    else board.querySelectorAll('.ok, .no, .pulse').forEach(e => e.classList.remove('ok', 'no', 'pulse'));
    board.querySelectorAll('.seq').forEach(e => e.remove());
    $('#q').innerHTML = `${n > 1 ? `<small>Pregunta ${k + 1} de ${n}</small>` : ''}${R.q.text}`; again($('#q')).add('pop');
    const ty = R.q.type;
    if (ty === 'tap' || ty === 'order') ans.innerHTML = `<p class="how">👆 ${ty === 'order' ? 'Toca\'ls al gràfic, per ordre.' : 'Toca la resposta al gràfic.'}</p>`;
    else if (ty === 'pick') { opts = shuffle(R.q.opts.slice(), Math.random); ans.innerHTML = `<div class="opts col">${opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; }
    else { ans.innerHTML = `<p class="display" id="disp" aria-live="polite"></p><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
      <button class="key del" data-d="del" aria-label="Esborra">⌫</button><button class="key" data-d="0">0</button><button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`; paint(); }
  }
  const paint = () => { const d = $('#disp'); if (d) d.innerHTML = buf ? num(+buf) : '<i class="caret"></i>'; };
  async function right(el) {
    busy = true;
    if (el) { el.classList.add('ok'); spark(el, 140); }
    blip(880); tip(`${pick(HURRAY)} ${R.q.say}`, 'go');
    if (R.q.type === 'num') { $('#disp')?.classList.add('ok'); ans.querySelectorAll('button').forEach(b => b.disabled = true); }
    await sleep(k === n - 1 ? 1500 : 1900); if (!t.on) return;
    if (k === n - 1) { keyFn = null; win(`${n === 1 ? 'Una pregunta resolta' : `${n} preguntes resoltes`}<br><small>${L.title || ''}</small>`); } else arm();
  }
  const ty = () => R?.q.type;
  function wrong(el) {
    slip(); if (el) { again(el).add('shake'); el.classList.add('no'); }
    tip(`Ui! ${R.q.hint}`, 'oops');
  }
  // a tap on the chart
  function touch(el) {
    if (busy || !R || !t.on || performance.now() < openAt) return;
    const key = el.dataset.k, Q = R.q;
    if (Q.type === 'tap') return Q.ans.includes(key) ? right(el) : wrong(el);
    if (Q.type !== 'order' || el.classList.contains('ok')) return;
    if (key !== Q.ans[seq]) return wrong(el);
    seq++; el.classList.add('ok'); blip(520 + seq * 60);
    badge(el, seq);
    if (seq === Q.ans.length) right(null);
  }
  // the place in the order, on what was tapped
  function badge(el, s) {
    if (el instanceof SVGElement) { const b = el.getBBox(), NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'seq');
      g.innerHTML = `<circle cx="${b.x + 10}" cy="${b.y + 10}" r="10"/><text x="${b.x + 10}" y="${b.y + 14}">${s}</text>`; el.append(g); }
    else el.querySelector('th')?.insertAdjacentHTML('afterbegin', `<b class="seq">${s}</b>`);
  }
  board.onclick = e => { const el = e.target.closest('.hit'); if (el) touch(el); };
  board.onkeydown = e => { const el = e.target.closest?.('.hit'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); touch(el); } };
  function press(d) {
    if (busy || !R || R.q.type !== 'num') return;
    if (d === 'ok') {
      if (!buf) return;
      if (+buf === R.q.ans) return right(null);
      buf = ''; paint(); again($('#disp')).add('shake'); return wrong(null);
    }
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
  keyFn = e => { const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null; if (d && ty() === 'num') { e.preventDefault(); press(d); } };
  arm(); if (L.say) tip(L.say);
  return () => busy ? '' : R.q.hint;
}

/* ---------- build a chart with a finger, and check it whole ---------- */
// Over the chart, where its data comes from: a table, the rules of a plan, nothing for the seesaw. «Comprova» checks it: a wrong one
// is a slip and lights up what is wrong; a right one ends the level
const BUILD = {
  bars: (el, L, f) => buildBars(el, L, f), line: (el, L, f) => buildLine(el, L, f), pie: (el, L, f) => buildPie(el, L, f),
  venn: (el, L, f) => buildVenn(el, L, f), gantt: (el, L, f) => buildGantt(el, L, f), balance: (el, L, f) => buildBalance(el, L, f)
};
function build({ t, L, stage, tip, slip, win }) {
  let busy = false;
  stage.innerHTML = `<div class="board src" id="src"></div><div class="board" id="board"></div><ul class="rules" id="rules"></ul><div class="ans"><button class="btn" id="check">Comprova</button></div>`;
  const src = $('#src');
  if (L.what === 'bars' || L.what === 'line') draw(src, { type: 'table', set: L.set, rows: L.rows, cols: [L.c || 0], noHit: true });
  else if (L.what === 'pie') draw(src, { type: 'table', set: L.set, noHit: true });
  else if (L.table) draw(src, { ...L.table, noHit: true });
  else src.remove();
  if (L.what === 'gantt') $('#rules').innerHTML = `<li class="head">Les normes del pla</li>${L.rules.map(r => `<li>${ruleText(L, r)}</li>`).join('')}`;
  else $('#rules').remove();
  const B = BUILD[L.what]($('#board'), L, () => { if (!busy) $('#board').classList.remove('wrong'); });
  const rows = () => (L.rows || SETS[L.set].rows.map((_, i) => i)).map(i => SETS[L.set].rows[i]);
  // what is wrong, and what the frog says of it; an empty list when it is right
  function verdict() {
    const v = B.value();
    if (L.what === 'bars' || L.what === 'line') { const bad = wrongValues(L, v); return [bad, bad.length ? `Revisa ${list(bad.map(k => rows()[k].n))}. Mira el número de la taula i busca'l a l'escala.` : ''] }
    if (L.what === 'pie') { const bad = wrongSlices(L, v), S = SETS[L.set], tot = S.rows.reduce((s, r) => s + r.v[0], 0);
      return [bad, bad.length ? `Revisa ${list(bad.map(k => S.rows[k].n))}.${L.counts ? ` Són ${tot} en total: cada un és un ${100 / tot} %.` : ''}` : ''] }
    if (L.what === 'venn') { const bad = wrongPlaces(L, v), G = VENNS[L.venn], tray = v.filter(x => x === null).length;
      return [bad, tray ? `Encara en queden ${tray} a la safata: posa'ls tots al diagrama (fora dels cercles també és un lloc).` : bad.length ? `Revisa on has posat ${list(bad.map(j => G.items[L.items[j]].n))}.` : ''] }
    if (L.what === 'gantt') { const bad = brokenRules(L, v); $('#rules').querySelectorAll('li:not(.head)').forEach((li, k) => { li.classList.toggle('no', bad.includes(k)); li.classList.toggle('ok', !bad.includes(k)); });
      return [bad.map(k => L.rules[k][1]), bad.length ? `No es compleix: ${bad.map(k => ruleText(L, L.rules[k])).join(' ')}` : ''] }
    const ok = balanced(L, v), m = mean(STATS[L.stats].vals);
    return [ok ? [] : [0], ok ? '' : v < m ? 'La barra cau cap a la dreta: hi ha més pes a la dreta. Mou el triangle cap allà.' : 'La barra cau cap a l\'esquerra: mou el triangle cap a l\'esquerra.'];
  }
  $('#check').onclick = async () => {
    if (busy || !t.on) return;
    const [bad, why] = verdict();
    B.mark(bad);
    if (bad.length) { slip(); again($('#board')).add('shake'); $('#board').classList.add('wrong'); return tip(`Ui! ${why}`, 'oops'); }
    busy = true; $('#check').disabled = true; $('#board').classList.add('right'); spark($('#board'), 140);
    tip(`${pick(HURRAY)} ${L.what === 'balance' ? `La mitjana és ${num(B.value())}: aquí la barra queda plana.` : L.what === 'gantt' ? 'Totes les normes es compleixen.' : 'El gràfic és perfecte.'}`, 'go');
    await sleep(1600); if (!t.on) return;
    win(`${L.title}<br><small>${L.what === 'balance' ? `Mitjana: ${num(B.value())}` : 'Gràfic construït'}</small>`);
  };
  tip(L.say);
  return () => {
    if (busy) return '';
    const [bad, why] = verdict();
    return bad.length ? why : 'Ja està bé! Prem «Comprova».';
  };
}
soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
