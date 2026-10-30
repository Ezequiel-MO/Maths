import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, EXAM_PASS, VALID, shuffle, starsFor, punt, relOf, hintOf, bricksIn,
  clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn } from './logic.js';
import { FROG, scene, castleMap } from './draw.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';

const KEY = 'castell-dels-numeros';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls, maons }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
// every number put right in a hole is a brick of the castle
const lay = n => { if (n > 0) { prog = bricksIn(prog, n); save(); } };
// every new screen cancels the running one through this token
const fresh = tokens();

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');
// the sounds of the castle: a brick laid, a padlock that opens, the fanfare of the end
const thud = () => { click(220, 0, 0.12, 0.1, 'triangle'); click(330, 0.03, 0.1, 0.05); };
const clack = () => { click(1400, 0, 0.04, 0.08, 'square'); click(700, 0.06, 0.08, 0.06, 'square'); };
const fanfare = () => chime([523, 659, 784, 1047, 1319]);

const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quin cap!', 'Bona feina, arquitecte!', 'Molt ben pensat!'];
const HUES = [28, 48, 205, 270, 18, 300, 150, 330, 190];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 40) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 16, 130); } };

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
const RING = [28, 205, 330];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><circle r="13" fill="#1B2730" stroke="hsl(${RING[c]} 75% 60%)" stroke-width="3"/><text y="5" text-anchor="middle" font-size="13">${['🧱', '🛡️', '🏰'][c]}</text></svg>`;
const ICONS = PROJECTS.map(p => p.ico);
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
function mapa() {
  fresh(); show('El mapa del castell', false, 28);
  const v = validated(prog), n = v.length;
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${ICONS[i]}</span>`,
    before: `<div class="castlemap" id="cmap"></div><p class="grow">${n >= 9 ? 'El castell està acabat! Ets l\'arquitecte de l\'estany.' : `Cada projecte validat construeix una part del castell: <b>${n} de 9</b>.`}${prog.maons ? ` Has posat <b>${punt(prog.maons)}</b> ${prog.maons === 1 ? 'maó' : 'maons'}.` : ''}</p>`,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="full"${OPEN || n ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full]] });
  castleMap($('#cmap'), v);
  here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: a tower, a balance and a frog worth a number ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true, 28); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  say('Benvingut al castell dels números! Aquí cada número amagat és un maó del castell. Primer, tres proves per entrar.');
  let k = 0;
  play({ t, L: { rounds: POOL }, stage, tip: say, slip: buzz, step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say('Ja ets arquitecte del castell! Ara pots entrar al mapa.', 'go'); fanfare(); FX.celebrate(16);
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
    fanfare(); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.valid ? `<p class="lead go">Una part nova del castell: ${PROJECTS[sec].ico}</p>` : ''}
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
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
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

/* ---------- «Caça l'errada»: three sentences written in the notebook of the castle; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="board" id="board"></div><p class="ask claim">A la llibreta del castell hi diu:</p><p class="claimbox">«${C.says}»</p>`;
    scene($('#board'), C.scene, { t, still: true });
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
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
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

/* ---------- the rounds of a level, one after another ---------- */
// Each round has a scene and a question. In a round of holes the child picks a hole (the one that can be worked out comes first), types
// its number and it is taken as soon as it is right; ✓ sends one that is not, and that is a slip: the frog says how to work it out
// and the scene lights what it is worked out from (never in an exam). The other rounds are answered on the scene (tiles, a path, a
// balance to make level, lines to touch) or with the buttons under it. step(k), when given, hears of every new round (the dots of the
// Piscina); good() of every round done right at the first go
const TRAY = [1, 2, 5, 10];
function play({ t, L, stage, tip, slip, win, step, good, exam = false }) {
  const n = L.rounds.length;
  let k = -1, R = null, busy = false, buf = '', S = null, opts = [], known = null, cur = null, laid = 0, clean1 = true;
  stage.innerHTML = `<p class="ask" id="q"></p><div class="board" id="board"></div><div class="ans" id="ans"></div>`;
  const board = $('#board'), ans = $('#ans');
  const keypad = () => `<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
    <button class="key del" data-d="del" aria-label="Esborra">⌫</button><button class="key" data-d="0">0</button><button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`;
  const choices = () => { opts = R.q.fixed ? R.q.opts.slice() : shuffle(R.q.opts.slice(), Math.random);
    return `<div class="opts${R.q.signs ? ' signs' : R.q.opts.every(o => o.length < 14) ? '' : ' col'}">${opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; };
  const weights = () => `<div class="tray">${TRAY.map(w => `<button class="wbtn" data-w="${w}" aria-label="Posa una pesa de ${w}"><svg viewBox="-26 -38 52 44" aria-hidden="true"><path d="M-${w >= 10 ? 22 : 18} 0L-${w >= 10 ? 15 : 12} -30H${w >= 10 ? 15 : 12}L${w >= 10 ? 22 : 18} 0Z" fill="#3A444E" stroke="#161B20" stroke-width="1.5"/><circle cy="-34" r="4.5" fill="none" stroke="#5A6672" stroke-width="2.5"/><text y="-8" text-anchor="middle" font-size="16" font-weight="800" fill="#FFE69A">${w}</text></svg></button>`).join('')}</div>`;
  // the hole to type in: the first one its neighbours already give, or the first one left
  const nextHole = () => { const sc = R.scene, left = sc.holes.filter(h => !known.has(h)); return left.find(h => relOf(sc, h, known)) ?? left[0]; };
  const hint = () => { if (!exam) board.classList.add('hint'); };
  const hintText = () => { if (R.q.type !== 'holes') return R.q.hint; const h = hintOf(R.scene, cur, known); if (!exam) S.lit(h.lit); return h.text; };

  // what the child does on the scene
  function on(ev, d) {
    if (busy || !t.on) return;
    if (ev === 'cancel') { blip(760); tip(`Fora ${d === 'x' ? 'una caixa' : typeof d === 'number' ? `el ${d}` : `un ${d}`} dels dos plats: la balança continua recta.`); }
    else if (ev === 'nomatch') { buzz(); tip('A l\'altre plat no n\'hi ha cap d\'igual. Només es pot treure el mateix dels dos plats.'); }
    else if (ev === 'balance') { thud(); if (d.L === d.R) right(null); else if (d.R > d.L) tip('Massa pes! Toca una pesa del plat per treure-la.'); else tip(`Encara hi falta: ${d.L} contra ${d.R}.`); }
    else if (ev === 'tiles') { blip(560); if (d.done) right(null); else if (d.full) tip(`Encara no: mira les línies que no sumen ${R.scene.target} i canvia alguna fitxa.`); }
    else if (ev === 'step') {
      blip(480 + Math.min(600, d.x * 4));
      if (d.exit) d.x === R.scene.target ? right(null) : wrong(null, `Has arribat amb el ${d.x}, i la porta s'obre amb el ${R.scene.target}. Torna enrere i prova un altre camí.`);
    }
    else if (ev === 'blocked') { buzz(); tip(d.cell[0] === '÷' ? `${d.x} entre ${d.cell.slice(1)} no és una divisió exacta: aquesta pedra no et deixa passar.` : `${d.x} ${d.cell} donaria menys de zero: aquesta pedra no et deixa passar.`); }
    else if (ev === 'far') tip(d.first ? 'Comença per la pedra de dalt a l\'esquerra, la que és al costat de la granota.' : 'Només pots saltar a una pedra del costat (no en diagonal) que encara no hagis trepitjat.');
    else if (ev === 'line') { blip(520 + 50 * d.i); tip(`Aquesta línia suma ${d.sum}.`); if (d.all) right(null); }
  }
  function arm() {
    k++; R = L.rounds[k]; busy = false; buf = ''; laid = 0; clean1 = true; openAt = performance.now() + SETTLE; step?.(k);
    const ty = R.q.type;
    S = scene(board, R.scene, { t, on });
    $('#q').innerHTML = `${n > 1 ? `<small>Repte ${k + 1} de ${n}</small>` : ''}${R.q.text}`; again($('#q')).add('pop');
    if (ty === 'holes') {
      known = new Set(Object.keys(R.scene.cells).filter(x => !R.scene.holes.includes(x) && !(R.scene.blank || []).includes(x)));
      cur = nextHole(); S.active(cur); ans.innerHTML = keypad();
    } else if (ty === 'pick') ans.innerHTML = choices();
    else if (ty === 'tap') ans.innerHTML = '<p class="how">👆 Toca la balança.</p>';
    else if (ty === 'level') ans.innerHTML = `${weights()}<p class="how">Toca una pesa per posar-la al plat. Toca-la al plat per treure-la.</p>`;
    else if (ty === 'tiles') ans.innerHTML = `<p class="how">👆 ${R.scene.start ? 'Toca dues fitxes per canviar-les de lloc.' : 'Toca una fitxa i després un cercle buit.'}</p>`;
    else if (ty === 'path') ans.innerHTML = '<div class="opts"><button class="btn soft" id="back">↶ Torna enrere</button><button class="btn soft" id="reset">Comença de nou</button></div>';
    else if (ty === 'explore') ans.innerHTML = '<p class="how">👆 Toca les fletxes del voltant del quadrat.</p>';
  }
  async function right(el) {
    busy = true; if (clean1) good?.();
    if (el) { el.classList.add('ok'); spark(el, 140); }
    tip(`${pick(HURRAY)} ${R.q.say}`, 'go');
    ans.querySelectorAll('button').forEach(b => { b.disabled = true; });
    board.classList.add('won'); board.classList.remove('hint'); S.lit([]);
    if (R.scene?.s === 'lock') clack(); else blip(880);
    spark(board.querySelector('svg, .plqs, .fg, .paper, .scroll'), 52);
    lay(laid);
    await S.finish(); if (!t.on) return;
    await sleep(k === n - 1 ? 900 : 1300); if (!t.on) return;
    if (k === n - 1) { keyFn = null; win(`${n === 1 ? 'Un repte resolt' : `${n} reptes resolts`}<br><small>${L.title || ''}</small>`); } else arm();
  }
  function wrong(el, text) {
    slip(); clean1 = false;
    if (el) { again(el).add('shake'); el.classList.add('no'); }
    tip(`Ui! ${text || hintText()}`, 'oops'); hint();
  }
  // a number right in its hole: the hole is filled, and the next one comes
  function solved() {
    const h = cur; known.add(h); laid++; buf = '';
    S.solve(h, R.scene.cells[h]); spark(S.el(h), 40); thud(); S.lit([]); board.classList.remove('hint');
    if (R.scene.holes.every(x => known.has(x))) return right(null);
    cur = nextHole(); S.active(cur);
  }
  function press(d) {
    if (busy || R?.q.type !== 'holes' || !cur) return;
    const goal = String(R.scene.cells[cur]);
    if (d === 'ok') {
      if (!buf) return;
      if (buf === goal) return solved();
      buf = ''; S.type(cur, ''); S.wrong(cur);
      return wrong(null);
    }
    if (d === 'del') buf = buf.slice(0, -1); else { if (buf.length >= 4) return; buf = (buf + d).replace(/^0+(?=\d)/, ''); }
    blip(); S.type(cur, buf);
    // the right number is taken as soon as it is written, with no ✓; a wrong one waits for ✓ (1 may still become 12)
    if (d !== 'del' && buf === goal) solved();
  }
  // a hole touched: it is the one typed in now
  function choose(h) {
    if (busy || R?.q.type !== 'holes' || known.has(h) || h === cur) return;
    if (buf) S.type(cur, '');
    buf = ''; cur = h; S.active(h); blip(600);
  }
  // a thing of the scene touched (a balance of three)
  function touch(el) {
    if (busy || !R || !t.on || performance.now() < openAt || R.q.type !== 'tap') return;
    const key = el.dataset.k;
    if (R.q.ans.includes(key)) right(el); else { S.tilt?.(key); el.classList.add('no'); wrong(el); }
  }
  board.onclick = e => {
    const h = e.target.closest('.cell.hole[data-k]:not(.done)'); if (h) return choose(h.dataset.k);
    const el = e.target.closest('.hit[data-k]'); if (el) touch(el);
  };
  board.onkeydown = e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const h = e.target.closest?.('.cell.hole[data-k]'), el = e.target.closest?.('.hit[data-k]');
    if (h) { e.preventDefault(); choose(h.dataset.k); } else if (el) { e.preventDefault(); touch(el); }
  };
  ans.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || !t.on || e.timeStamp < openAt) return;
    if ('d' in b.dataset) return press(b.dataset.d);
    if (b.dataset.w) return S.add?.(+b.dataset.w);
    if (b.id === 'back') return S.back?.();
    if (b.id === 'reset') return S.reset?.();
    if ('v' in b.dataset) { const ok = opts[+b.dataset.v] === R.q.ans; if (ok) right(b); else { b.disabled = true; wrong(b); } }
  };
  // the keys of a real keyboard type in the hole; Enter on a hole that has the focus picks it instead
  keyFn = e => {
    if (R?.q.type !== 'holes') return;
    const d = e.key === 'Enter' && !e.target.closest?.('.cell.hole') ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null;
    if (d) { e.preventDefault(); press(d); }
  };
  arm(); if (L.say) tip(L.say);
  return () => { if (busy) return ''; hint(); return hintText(); };
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
