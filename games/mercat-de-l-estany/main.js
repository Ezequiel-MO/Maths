import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, shuffle, starsFor, eur, centsOf, verdict, thousands,
  clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn,
  rapidIn, customer, RUSH_SECS, TILL } from './logic.js';
import { FROG, money, scene, payBox, scaleBox, market, MARKET_STEPS, walk } from './draw.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';

const KEY = 'mercat-de-l-estany';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls, rapid }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
// every new screen cancels the running one through this token
const fresh = tokens();

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');
// the sounds of the market: the clink of a coin, the rustle of a note, a weight on the pan, the bell of the register, the printer
const SOUND = {
  coin: () => { click(2400 + Math.random() * 400, 0, 0.06, 0.05); click(3300, 0.04, 0.08, 0.035); },
  bill: () => { click(320, 0, 0.05, 0.05, 'sawtooth'); click(260, 0.04, 0.05, 0.04, 'sawtooth'); },
  back: () => click(900, 0, 0.06, 0.04),
  weight: () => { click(180, 0, 0.12, 0.12, 'triangle'); click(520, 0.02, 0.05, 0.04); }
};
const kaching = () => { click(1568, 0, 0.08, 0.07); chime([2093, 2637], 0.07); };
const printer = n => { for (let i = 0; i < n * 3; i++) click(1800 + (i % 3) * 120, 0.25 + i * 0.07, 0.02, 0.025, 'square'); };

const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Bon compte!', 'Quin mercader!', 'Ben pagat!'];
const HUES = [45, 28, 140, 195, 320, 262, 170, 5, 330];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };
// a shower of coins from a place of the screen, when something is paid just right
function coinRain(e, n = 8) {
  if (RM || !e) return;
  const p = mid(e);
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div'); c.className = 'rain'; c.innerHTML = money(pick([10, 20, 50, 100, 200]), 30);
    c.style.left = p.x + 'px'; c.style.top = p.y + 'px'; c.style.setProperty('--x', `${(Math.random() - 0.5) * 260}px`); c.style.setProperty('--r', `${(Math.random() - 0.5) * 720}deg`);
    c.style.animationDelay = `${i * 40}ms`; document.body.append(c); setTimeout(() => c.remove(), 1400 + i * 40);
  }
}

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

/* ---------- the map ---------- */
const RING = [45, 140, 320];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><circle r="13" fill="url(#m-au)" stroke="hsl(${RING[c]} 70% 62%)" stroke-width="2.4"/><text y="5" text-anchor="middle" font-size="13" font-weight="800" fill="#6B4A10">${c + 1}</text></svg>`;
const ICONS = ['🪙', '💶', '🔁', '🧾', '⚖️', '✖️', '👀', '🏷️', '🐷'];
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
// the rush hour opens with «El canvi» validated
const rushOpen = () => OPEN || noteOf(prog, 2) >= VALID;
function mapa() {
  fresh(); show('El mapa del mercat', false, 45);
  const n = validated(prog).length;
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${ICONS[i]}</span>`,
    before: `<div class="stallmap" id="stallmap"></div><p class="grow">${n >= 9 ? 'La teva parada és la més bonica de l\'estany!' : n ? `La teva parada: ${n} de 9 millores. Valida un projecte més i hi posaràs ${MARKET_STEPS[n]}.` : `Valida projectes i la teva parada creixerà: primer, ${MARKET_STEPS[0]}.`}</p>`,
    foot: got => `\n    <div class="extra"><button class="btn rushb" id="rush"${rushOpen() ? '' : ' disabled title="Valida «El canvi» per obrir-la"'}>⏱️ Hora punta${prog.rapid ? ` <small>Rècord: ${prog.rapid}</small>` : ''}</button>
      <button class="btn soft" id="full"${OPEN || validated(prog).length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full], ['#rush:not(:disabled)', rush]] });
  market($('#stallmap'), n);
  here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: a coin, a payment and a stall, the first thing a profile with nothing saved meets ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true, 45); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  say('Benvingut al mercat de l\'estany! Aquí es compra, es paga i es torna el canvi. Primer, tres proves per obrir la parada.');
  let k = 0;
  play({ t, L: { rounds: POOL }, stage, tip: say, slip: buzz, step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say('La parada és oberta! Ara ja pots entrar al mapa del mercat.', 'go'); kaching(); FX.celebrate(16); coinRain($('#coach'), 14);
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
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip"></p></div><span class="combo" id="cb" hidden></span><div class="stage" id="stage"></div>`;
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); buzz(); };

  // the level is handed in at once, before any wait
  async function win(line) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9, grew = validated(r.prog).length > validated(prog).length;
    over = true; keyFn = null; prog = r.prog; save();
    kaching(); chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8); if (n === 3) coinRain($('#coach'), 10);
    await sleep(900); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${grew ? `<p class="lead go">La teva parada guanya ${MARKET_STEPS[validated(prog).length - 1]}!</p>` : ''}
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${sec === 2 && r.valid ? '<p class="lead go">S\'ha obert l\'hora punta!</p>' : ''}${news(r.news)}
      ${r.exam || r.news.length || grew ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  let streak = 0;
  const help = play({ t, L, stage, tip, slip: () => { streak = 0; combo(0); slip(); }, win, good: () => combo(++streak) });
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
    say('Resol-ho tot. Només hi ha un intent!');
    play({ t: qt, L, stage, tip, slip: () => end(false), win: () => end(true), exam: true });
    scrollTo({ top: 0, behavior: 'auto' });
  }
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    r.good ? (kaching(), chime([523, 659, 784, 1047, 1319])) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) { FX.celebrate(16); coinRain($('#coach'), 16); }
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

/* ---------- «Caça l'errada»: three sentences written at the stall; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="board" id="board"></div><p class="ask claim">A la pissarra de la parada hi diu:</p><p class="claimbox">«${C.says}»</p>`;
    scene($('#board'), C.scene, { t });
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Fes el càlcul: la pissarra diu la veritat?');
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
    say(r.good ? 'Pissarra perfecta!' : 'Pissarra acabada.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra pissarra</button>`);
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

/* ---------- the questions of a level, one after another ---------- */
// Each round has a scene and a question. The scene stays while the next round has the same one. A wrong answer is a slip and the frog
// says how to think it; a right one lights up what answered it and says why. step(k), when given, hears of every new round (the dots of
// the Piscina); good() of every right answer (the run of the level)
function play({ t, L, stage, tip, slip, win, step, good }) {
  const n = L.rounds.length;
  let k = -1, R = null, busy = false, buf = '', seq = 0, shown = null, opts = [], box = null;
  stage.innerHTML = `<p class="ask" id="q"></p><div class="board" id="board"></div><div class="ans" id="ans"></div>`;
  const board = $('#board'), ans = $('#ans');
  function arm() {
    k++; R = L.rounds[k]; busy = false; buf = ''; seq = 0; box = null; openAt = performance.now() + SETTLE; step?.(k);
    const ty = R.q.type, tap = ty === 'tap' || ty === 'order', key = JSON.stringify([R.scene, tap]);
    if (ty === 'pay' || ty === 'weigh') shown = null;
    else if (key !== shown) { scene(board, R.scene, { t, tap }); shown = key; if (R.scene?.s === 'receipt') printer(R.scene.lines.length); }
    else board.querySelectorAll('.ok, .no').forEach(e => e.classList.remove('ok', 'no'));
    board.querySelectorAll('.seq').forEach(e => e.remove());
    $('#q').innerHTML = `${n > 1 ? `<small>Pregunta ${k + 1} de ${n}</small>` : ''}${R.q.text}`; again($('#q')).add('pop');
    if (ty === 'pay') { box = payBox(board, R.q, { sound: s => SOUND[s](), onPut: put }); ans.innerHTML = `<button class="btn" id="go">${R.q.change ? 'Torna el canvi' : 'Paga'}</button>`; }
    else if (ty === 'weigh') { box = scaleBox(board, R.q, { t, sound: s => SOUND[s](), onPut: put }); ans.innerHTML = `<button class="btn" id="go">Comprova</button>`; }
    else if (tap) ans.innerHTML = `<p class="how">👆 ${ty === 'order' ? 'Toca\'ls per ordre.' : 'Toca la resposta.'}</p>`;
    else if (ty === 'pick') { opts = shuffle(R.q.opts.slice(), Math.random); ans.innerHTML = `<div class="opts col">${opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; }
    else { ans.innerHTML = `<p class="display" id="disp" aria-live="polite"></p><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
      ${ty === 'eur' ? '<button class="key" data-d="," aria-label="Coma">,</button>' : '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>'}<button class="key" data-d="0">0</button>${ty === 'eur' ? '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>' : ''}
      <button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`; paint(); }
  }
  // what is typed, with its unit after it
  const paint = () => { const d = $('#disp'); if (!d) return; const u = R.q.type === 'eur' ? '€' : R.q.unit;
    d.innerHTML = `${buf ? (R.q.type === 'eur' ? buf : thousands(buf)) : '<i class="caret"></i>'}${u ? ` <small>${u}</small>` : ''}`; };
  const typed = () => R.q.type === 'eur' ? centsOf(buf) : buf === '' ? NaN : +buf;
  async function right(el) {
    busy = true; good?.();
    if (el) { el.classList.add('ok'); spark(el, 140); }
    blip(880); tip(`${pick(HURRAY)} ${R.q.say}`, 'go');
    if (R.q.type === 'num' || R.q.type === 'eur') { $('#disp')?.classList.add('ok'); ans.querySelectorAll('button').forEach(b => b.disabled = true); }
    if (R.q.type === 'pay') { box.lock(); box.open(); kaching(); coinRain(board.querySelector('.register'), 8); $('#go').disabled = true; }
    if (R.q.type === 'weigh') { box.lock(); box.level(); chime([784, 1047]); spark(board.querySelector('svg'), 50); $('#go').disabled = true; }
    await sleep(k === n - 1 ? 1600 : 2000); if (!t.on) return;
    if (k === n - 1) { keyFn = null; win(`${n === 1 ? 'Un repte resolt' : `${n} reptes resolts`}<br><small>${L.title || ''}</small>`); } else arm();
  }
  const ty = () => R?.q.type;
  function wrong(el, hint = R.q.hint) {
    slip(); if (el) { again(el).add('shake'); el.classList.add('no'); }
    tip(`Ui! ${hint}`, 'oops');
  }
  // a coin, a note or a weight put or taken back: the right amount is taken at once; the right amount with too many pieces is a slip
  function put(vals) {
    if (busy || !t.on) return;
    const v = verdict(R.q, vals);
    if (v === 'ok') return right(null);
    if (v === 'more') { box.shake(); return wrong(null, `Hi arribes, però amb ${vals.length} peces. Es pot fer amb ${R.q.min}: canvia'n algunes per una de més grossa.`); }
  }
  // «Paga» or «Comprova»: what is on the counter is not the right amount
  function submit() {
    if (busy || !box) return;
    const vals = box.value(), v = verdict(R.q, vals), sum = vals.reduce((s, x) => s + x, 0);
    if (v === 'ok') return right(null);
    box.shake();
    const what = R.q.type === 'weigh' ? (v === 'over' ? 'Hi ha massa pes: el plat de les peses baixa. Treu-ne alguna.' : 'Encara falta pes: el plat de les peses puja. Posa-n\'hi més.')
      : v === 'over' ? `Hi has posat ${eur(sum)}: és massa! Toca les monedes del taulell per tornar-les.` : v === 'more' ? `Es pot fer amb ${R.q.min} peces.` : `Hi has posat ${eur(sum)}: encara en falta.`;
    wrong(null, `${what} ${R.q.hint}`);
  }
  // a tap on the scene
  function touch(el) {
    if (busy || !R || !t.on || performance.now() < openAt) return;
    const key = el.dataset.k, Q = R.q;
    if (Q.type === 'tap') return Q.ans.includes(key) ? right(el) : wrong(el);
    if (Q.type !== 'order' || el.classList.contains('ok')) return;
    if (key !== Q.ans[seq]) return wrong(el);
    seq++; el.classList.add('ok'); blip(520 + seq * 60);
    el.insertAdjacentHTML('beforeend', `<b class="seq">${seq}</b>`);
    if (el instanceof SVGElement) { const b = el.getBBox(), g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'seq'); g.innerHTML = `<circle cx="${b.x + b.width - 14}" cy="${b.y + 14}" r="12"/><text x="${b.x + b.width - 14}" y="${b.y + 19}">${seq}</text>`; el.querySelector('b.seq')?.remove(); el.append(g); }
    if (seq === Q.ans.length) right(null);
  }
  board.onclick = e => { const el = e.target.closest('.hit'); if (el) touch(el); };
  board.onkeydown = e => { const el = e.target.closest?.('.hit'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); touch(el); } };
  function press(d) {
    if (busy || !R || (R.q.type !== 'num' && R.q.type !== 'eur')) return;
    if (d === 'ok') {
      if (!buf) return;
      if (typed() === R.q.ans) return right(null);
      buf = ''; paint(); again($('#disp')).add('shake'); return wrong(null);
    }
    if (d === 'del') buf = buf.slice(0, -1);
    else if (d === ',') { if (R.q.type !== 'eur' || buf.includes(',')) return; buf = (buf || '0') + ','; }
    else { if (buf.length >= 7 || /,\d\d$/.test(buf)) return; buf = (buf + d).replace(/^0+(?=\d)/, ''); }
    blip(); paint();
    // the right number is taken as soon as it is written, with no ✓; a wrong one waits for ✓ (12 may still become 120)
    if (d !== 'del' && d !== ',' && typed() === R.q.ans) right(null);
  }
  ans.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || !t.on || e.timeStamp < openAt) return;
    if (b.id === 'go') return submit();
    if ('d' in b.dataset) return press(b.dataset.d);
    if ('v' in b.dataset) { const ok = opts[+b.dataset.v] === R.q.ans; if (ok) right(b); else { b.disabled = true; wrong(b); } }
  };
  keyFn = e => { const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === ',' || e.key === '.' ? ',' : /^\d$/.test(e.key) ? e.key : null;
    if (d && (ty() === 'num' || ty() === 'eur')) { e.preventDefault(); press(d); } };
  arm(); if (L.say) tip(L.say);
  return () => busy ? '' : R.q.hint;
}

/* ---------- the rush hour: customers in a queue, the change against the clock ---------- */
// An animal walks to the counter, asks for its thing and pays with a note; the child gives the change with the coins of the till. The
// right change is taken at once and the next one comes in; the fewest pieces are worth a bonus second. The best is kept (rapid)
function rush() {
  const t = fresh(); show('Hora punta', true, 5);
  let served = 0, streak = 0, end = performance.now() + RUSH_SECS * 1000, C = null, box = null, busy = false, over = false;
  $('#game').innerHTML = `<div class="rushbar"><span class="clock" id="clock">${RUSH_SECS}</span><span class="time"><i id="tbar"></i></span><span class="chip" id="served">0 clients</span></div>
    <div class="queue" id="queue" aria-hidden="true"></div><span class="combo" id="cb" hidden></span>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div>`;
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const queue = $('#queue');
  const paintQueue = () => { queue.innerHTML = Array.from({ length: 4 }, (_, i) => `<span style="--d:${i * 0.15}s">${['🐢', '🦆', '🐌', '🦔', '🐿️', '🦉', '🐇'][(served + i + 1) % 7]}</span>`).join(''); };
  tip('Hora punta! Ve molta gent a la parada. Torna el canvi tan de pressa com puguis: amb les menys peces, guanyes un segon.');
  // the clock: the bar empties and the last ten seconds tick
  let lastSec = RUSH_SECS;
  const tick = () => {
    if (!t.on || over) return;
    const left = Math.max(0, end - performance.now()), s = Math.ceil(left / 1000);
    $('#tbar').style.width = (100 * left / (RUSH_SECS * 1000)).toFixed(1) + '%'; $('#clock').textContent = s;
    if (s !== lastSec) { lastSec = s; if (s <= 10 && s > 0) { click(s <= 3 ? 1200 : 880, 0, 0.05, 0.06); $('#clock').classList.add('hurry'); } }
    if (left <= 0) return finish();
    requestAnimationFrame(tick);
  };
  async function next() {
    C = customer(served, Math.random); busy = false; paintQueue();
    $('#stage').innerHTML = `<div class="board" id="board"></div><div class="ans"><button class="btn" id="go">Torna el canvi</button></div>`;
    box = payBox($('#board'), { type: 'pay', change: true, who: C.who, items: [C.item], paid: C.paid, purse: TILL, target: C.change, min: 0 }, { sound: s => SOUND[s](), onPut: put });
    const who = $('#board .client');
    await walk(who, true);
    $('#go').onclick = () => { if (busy || over) return; const sum = box.value().reduce((s, x) => s + x, 0);
      streak = 0; combo(0); buzz(); box.shake(); tip(`${sum > C.change ? 'És massa' : 'En falta'}: ${C.item.n} costa ${eur(C.item.p)} i t'ha pagat ${eur(C.paid)}.`, 'oops'); };
  }
  async function put(vals) {
    if (busy || over || !t.on) return;
    const sum = vals.reduce((s, x) => s + x, 0);
    if (sum !== C.change) return;
    busy = true; served++; streak++; combo(streak); box.lock(); box.open(); kaching();
    const bonus = vals.length <= C.min;
    if (bonus) end += 1000;
    $('#served').textContent = `${served} client${served === 1 ? '' : 's'}`; again($('#served')).add('pop');
    tip(`${pick(['Gràcies!', 'Fins aviat!', 'Quina rapidesa!', 'Perfecte!'])} ${eur(C.change)}${bonus ? ' amb les menys peces: +1 segon!' : '.'}`, 'go');
    coinRain($('#board .register'), 6);
    await walk($('#board .client'), false); if (!t.on || over) return;
    next();
  }
  function finish() {
    over = true; box?.lock();
    const r = rapidIn(prog, served); prog = r.prog; save();
    r.best ? (kaching(), chime([523, 659, 784, 1047, 1319]), FX.celebrate(16)) : chime([523, 659, 784]);
    tip(served ? `S'ha acabat l'hora punta: has atès ${served} client${served === 1 ? '' : 's'}!` : "S'ha acabat l'hora punta.", 'go');
    panel($('#stage'), `<h2>${served} client${served === 1 ? '' : 's'}</h2>
      <p class="lead${r.best ? ' go' : ''}">${r.best ? 'Rècord nou!' : `El teu rècord: ${prog.rapid}`}</p>${news(r.news)}
      <button class="btn" id="rp">Una altra hora punta</button><button class="link" id="bk">Torna al mapa</button>`);
    $('#rp').onclick = () => rush(); $('#bk').onclick = () => mapa();
  }
  next(); requestAnimationFrame(tick);
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
