import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, shuffle, starsFor, punt,
  clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn } from './logic.js';
import { FROG, scene, fairMap } from './draw.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';

const KEY = 'fira-de-l-atzar';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls, tirades }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
// every throw of an experiment counts for the badge of the thousand throws
const thrown = n => { prog = { ...prog, tirades: prog.tirades + n }; save(); };
// every new screen cancels the running one through this token
const fresh = tokens();

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');
// the sounds of the fair: dice that rattle, the bell of the stall
const rattle = () => { for (let i = 0; i < 4; i++) click(900 + Math.random() * 500, i * 0.05, 0.03, 0.05, 'square'); };
const bell = () => { click(1047, 0, 0.5, 0.07); click(1319, 0.08, 0.6, 0.06); };

const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quina sort... i quin cap!', 'Bona jugada!', 'Molt ben pensat!'];
const HUES = [52, 28, 325, 150, 190, 258, 355, 205, 140];
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

/* ---------- the map ---------- */
const RING = [52, 150, 355];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><circle r="13" fill="#1B2730" stroke="hsl(${RING[c]} 75% 60%)" stroke-width="3"/><text y="5" text-anchor="middle" font-size="13">${['🎲', '👕', '🎡'][c]}</text></svg>`;
const ICONS = PROJECTS.map(p => p.ico);
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
function mapa() {
  fresh(); show('El mapa de la fira', false, 52);
  const v = validated(prog), n = v.length;
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${ICONS[i]}</span>`,
    before: `<div class="fairmap" id="fairmap"></div><p class="grow">${n >= 9 ? 'Totes les parades de la fira són obertes!' : `Cada projecte validat obre una parada de la fira: <b>${n} de 9</b>.`}${prog.tirades ? ` Has tirat <b>${punt(prog.tirades)}</b> vegades.` : ''}</p>`,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="full"${OPEN || n ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full]] });
  fairMap($('#fairmap'), v, ICONS);
  here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: a bag, a spinner and the first outfits ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true, 52); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  say('Benvingut a la fira de l\'atzar! Aquí hi ha daus, bosses de boles, ruletes i monedes. Primer, tres proves per entrar.');
  let k = 0;
  play({ t, L: { rounds: POOL }, stage, tip: say, slip: buzz, step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say('Ja tens l\'entrada de la fira! Ara pots entrar al mapa.', 'go'); bell(); FX.celebrate(16);
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
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    bell(); chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.valid ? `<p class="lead go">S'obre una parada nova a la fira: ${PROJECTS[sec].ico}</p>` : ''}
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
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
    const tip = (txt, cls = '') => { if (cls === 'oops' ? failed : cls === 'go' && !done) say(txt.replace(/^Ui! /, ''), cls); else if (!cls && !done) say(txt); };
    stage.inert = false; tail.innerHTML = ''; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[L.p].name}`;
    say('Resol-ho tot. Només hi ha un intent!');
    play({ t: qt, L, stage, tip, slip: () => end(false), win: () => end(true), exam: true });
    scrollTo({ top: 0, behavior: 'auto' });
  }
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    r.good ? (bell(), chime([523, 659, 784, 1047, 1319])) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) FX.celebrate(16);
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

/* ---------- «Caça l'errada»: three sentences written in the notebook of the fair; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="board" id="board"></div><p class="ask claim">A la llibreta de la fira hi diu:</p><p class="claimbox">«${C.says}»</p>`;
    scene($('#board'), C.scene);
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Pensa-hi bé: la llibreta diu la veritat?');
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
    say(r.good ? 'Llibreta perfecta!' : 'Llibreta acabada.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra llibreta</button>`);
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
// Each round has a scene and a question. The scene stays while the next round has the same one (an experiment keeps its throws). A wrong
// answer is a slip, and the frog says how to think it while the scene shows its hint (never in an exam); a right one lights up what
// answered it and says why. step(k), when given, hears of every new round (the dots of the Piscina); good() of every right answer
function play({ t, L, stage, tip, slip, win, step, good, exam = false }) {
  const n = L.rounds.length;
  let k = -1, R = null, busy = false, buf = '', seq = 0, shown = null, opts = [], S = null, asking = false;
  stage.innerHTML = `<p class="ask" id="q"></p><div class="board" id="board"></div><div class="ans" id="ans"></div>`;
  const board = $('#board'), ans = $('#ans');
  const keypad = () => `<p class="display" id="disp" aria-live="polite"></p><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
    <button class="key del" data-d="del" aria-label="Esborra">⌫</button><button class="key" data-d="0">0</button><button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`;
  const choices = () => { opts = R.q.fixed ? R.q.opts.slice() : shuffle(R.q.opts.slice(), Math.random);
    return `<div class="opts${R.q.fixed && R.q.opts.length <= 3 && R.q.opts.every(o => o.length < 14) ? '' : ' col'}">${opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; };
  function arm() {
    k++; R = L.rounds[k]; busy = false; buf = ''; seq = 0; asking = false; openAt = performance.now() + SETTLE; step?.(k);
    const ty = R.q.type, tap = ty === 'tap' || ty === 'order', key = JSON.stringify([R.scene, tap]);
    if (key !== shown || ty === 'build' || ty === 'all') { S = scene(board, R.scene, { tap }); shown = key; if (R.scene?.s === 'dev' || R.scene?.s === 'exp') rattle(); }
    else { board.classList.remove('hint'); board.querySelectorAll('.ok, .no').forEach(e => e.classList.remove('ok', 'no')); }
    board.querySelectorAll('.seq').forEach(e => e.remove());
    $('#q').innerHTML = `${n > 1 ? `<small>Pregunta ${k + 1} de ${n}</small>` : ''}${R.q.text}`; again($('#q')).add('pop');
    if (tap) ans.innerHTML = `<p class="how">👆 ${ty === 'order' ? 'Toca\'ls per ordre.' : 'Toca la resposta.'}</p>`;
    else if (ty === 'pick') ans.innerHTML = choices();
    else if (ty === 'exp') throws();
    else if (ty === 'build') ans.innerHTML = '<button class="btn" id="go">Comprova</button>';
    else if (ty === 'all') { ans.innerHTML = '<div class="opts"><button class="btn soft" id="keep">Desa-la</button><button class="btn" id="done">Ja estan totes!</button></div>'; S.changed = () => blip(520); }
    else { ans.innerHTML = keypad(); paint(); }
  }
  // an experiment: the buttons to throw until there are enough, then its question
  function throws() {
    if (S.total() >= R.q.need) return ask();
    ans.innerHTML = `<div class="opts">${R.q.steps.map(m => `<button class="btn soft" data-t="${m}">Tira ${m === 1 ? '1 vegada' : `${punt(m)} vegades`}</button>`).join('')}</div><p class="how" id="need"></p>`;
    need();
  }
  const need = () => { const e = $('#need'), left = R.q.need - S.total(); if (e) e.textContent = left > 0 ? `${left === 1 ? 'Falta 1 tirada' : `Falten ${punt(left)} tirades`}.` : ''; };
  async function throwN(m) {
    busy = true; rattle(); await S.run(m, t); if (!t.on) return; busy = false; thrown(m); need();
    if (S.total() >= R.q.need) { await sleep(400); if (t.on) ask(); }
  }
  function ask() {
    asking = true; openAt = performance.now() + SETTLE;
    $('#q').innerHTML = `${n > 1 ? `<small>Pregunta ${k + 1} de ${n}</small>` : ''}${R.q.text2}`; again($('#q')).add('pop');
    if (R.q.ask === 'most') { S.tapBars(); ans.innerHTML = '<p class="how">👆 Toca la barra.</p>'; }
    else if (R.q.ask === 'count') { ans.innerHTML = keypad(); paint(); }
    else ans.innerHTML = choices();
  }
  // the number the keys must give: in an experiment, how many times its outcome came out
  const want = () => R.q.type === 'exp' ? S.counts()[R.q.target] : R.q.ans;
  // what is typed, with its unit after it
  const paint = () => { const d = $('#disp'); if (!d) return; d.innerHTML = `${buf || '<i class="caret"></i>'}${R.q.unit ? ` <small>${R.q.unit}</small>` : ''}`; };
  // the hint on the scene: what the frog says comes with a picture
  const hint = () => { if (!exam) board.classList.add('hint'); };
  async function right(el) {
    busy = true; good?.();
    if (el) { el.classList.add('ok'); spark(el, 140); }
    blip(880); tip(`${pick(HURRAY)} ${R.q.say}`, 'go');
    ans.querySelectorAll('button').forEach(b => b.disabled = true);
    $('#disp')?.classList.add('ok');
    if (R.q.type === 'all' || R.q.type === 'build') { if (S) S.locked = true; board.querySelector('.scene')?.classList.add('done'); spark(board.querySelector('.prev, .thing'), 52); }
    await sleep(k === n - 1 ? 1500 : 2000); if (!t.on) return;
    if (k === n - 1) { keyFn = null; win(`${n === 1 ? 'Un repte resolt' : `${n} reptes resolts`}<br><small>${L.title || ''}</small>`); } else arm();
  }
  const ty = () => R?.q.type;
  function wrong(el, text = R.q.hint) {
    slip(); if (el) { again(el).add('shake'); el.classList.add('no'); }
    tip(`Ui! ${text}`, 'oops'); hint();
  }
  // a tap on the scene
  function touch(el) {
    if (busy || !R || !t.on || performance.now() < openAt) return;
    const key = el.dataset.k, Q = R.q;
    if (Q.type === 'exp') {
      if (!asking || Q.ask !== 'most') return;
      const c = S.counts(), hi = Math.max(...Object.values(c));
      return c[key] === hi ? right(el) : wrong(el, `Aquesta barra no és la més alta. ${Q.hint}`);
    }
    if (Q.type === 'tap') return Q.ans.includes(key) ? right(el) : wrong(el);
    if (Q.type !== 'order' || el.classList.contains('ok')) return;
    if (key !== Q.ans[seq]) return wrong(el);
    seq++; el.classList.add('ok'); blip(520 + seq * 60);
    el.insertAdjacentHTML('beforeend', `<b class="seq">${seq}</b>`);
    if (seq === Q.ans.length) right(null);
  }
  board.onclick = e => { const el = e.target.closest('.hit[data-k]'); if (el) touch(el); };
  board.onkeydown = e => { const el = e.target.closest?.('.hit[data-k]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); touch(el); } };
  function press(d) {
    if (busy || !R || !(R.q.type === 'num' || R.q.type === 'exp' && asking && R.q.ask === 'count')) return;
    const goal = String(want());
    if (d === 'ok') {
      if (!buf) return;
      if (buf === goal) return right(null);
      buf = ''; paint(); again($('#disp')).add('shake');
      return wrong(null);
    }
    if (d === 'del') buf = buf.slice(0, -1); else { if (buf.length >= 5) return; buf = (buf + d).replace(/^0+(?=\d)/, ''); }
    blip(); paint();
    // the right number is taken as soon as it is written, with no ✓; a wrong one waits for ✓ (1 may still become 12)
    if (d !== 'del' && buf === goal) right(null);
  }
  // the bag or the spinner made: good when it does what was asked (many are)
  function check() {
    if (!S.full()) return tip(R.scene.look === 'spin' ? 'Primer pinta tots els trossos de la ruleta.' : 'Primer posa alguna bola a la bossa.');
    if (R.q.ok(S.counts())) right(null); else { again(board.querySelector('.thing')).add('shake'); wrong(null); }
  }
  // one combination kept, or the claim that they are all there
  function keep() {
    const r = S.keep();
    if (r === 'part') tip(`Tria una cosa de cada fila: ${list(R.scene.slots.map(s => s.name.toLowerCase()))}.`);
    else if (r === 'twice') tip('Aquí no es pot repetir: tria coses diferents.');
    else if (r === 'dup') { buzz(); tip('Aquesta ja la tens! Busca\'n una altra.'); }
    else { chime([660, 880]); spark(board.querySelector('.gallery .gc:last-child'), 140); tip(`Nova! Ja en tens ${S.found()}.`); }
  }
  ans.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || !t.on || e.timeStamp < openAt) return;
    if (b.dataset.t) return throwN(+b.dataset.t);
    if (b.id === 'go') return check();
    if (b.id === 'keep') return keep();
    if (b.id === 'done') return S.found() === R.q.ans ? right(null) : wrong(null, `Encara en falten. ${R.q.hint}`);
    if ('d' in b.dataset) return press(b.dataset.d);
    if ('v' in b.dataset) { const ok = opts[+b.dataset.v] === R.q.ans; if (ok) right(b); else { b.disabled = true; wrong(b); } }
  };
  keyFn = e => { const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null;
    if (d && (ty() === 'num' || ty() === 'exp' && asking)) { e.preventDefault(); press(d); } };
  arm(); if (L.say) tip(L.say);
  return () => { if (busy) return ''; hint(); return R.q.hint; };
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
