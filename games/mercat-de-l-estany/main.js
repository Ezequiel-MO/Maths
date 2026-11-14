import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, shuffle, starsFor, eur, centsOf, verdict, thousands, valName,
  clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetWide, sheetIn,
  rapidIn, customer, RUSH_SECS, TILL } from './logic.js';
import { FROG, money, scene, payBox, scaleBox, market, MARKET_STEPS, walk } from './draw.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';
import { market3d, RING } from './world.js';

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
// the market in 3D behind the panel; without WebGL its calls do nothing, and everything is drawn in the page as before
const W = market3d($('#world'));
document.body.classList.toggle('nogl', !W.ok);
// for the checks in the browser: the market, to ask it where things are, and what is on screen
window.__mercat = W;
const DBG = window.__merc = { what: '', q: null };
// the sparks and the confetti: the market's with WebGL, the pond of the page without it
const FX = W.ok ? { burst() {}, celebrate: n => W.celebrate(n >= 16 ? 3 : n >= 8 ? 2 : 1), mood() {} } : pond(tone);
W.hear({ tone: click, chime });
// the market as the progress has it: a piece of the stall for each project validated, a lantern for each exam passed, open after the Piscina
const worldState = () => W.state({ piscina: prog.piscina || OPEN, built: OPEN ? MARKET_STEPS.length : validated(prog).length, exams: CIRCLES.map((_, c) => c).filter(c => OPEN || prog.exams[c]) });

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
const HUES = [45, 28, 140, 195, 320, 262, 170, 5, 330, 30, 55, 200];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };
const sum = a => a.reduce((s, x) => s + x, 0);
// a shower of coins from a place of the screen, when something is paid just right (in the page; in 3D the register shines)
function coinRain(e, n = 8) {
  if (RM || !e || W.ok) return;
  const p = mid(e);
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div'); c.className = 'rain'; c.innerHTML = money(pick([10, 20, 50, 100, 200]), 30);
    c.style.left = p.x + 'px'; c.style.top = p.y + 'px'; c.style.setProperty('--x', `${(Math.random() - 0.5) * 260}px`); c.style.setProperty('--r', `${(Math.random() - 0.5) * 720}deg`);
    c.style.animationDelay = `${i * 40}ms`; document.body.append(c); setTimeout(() => c.remove(), 1400 + i * 40);
  }
}
// what a customer asks for, in their bubble in the market: «🍐 0,65 €», «🥖 1,20 € + 🧀 3,40 €»
const wish = items => items.map(x => `${x.e} ${eur(x.p)}`).join(' + ');

const HUB = ownPage(KEY);
const root = $('#game');
const WIDE = matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');
// the market is framed in the part of the screen the panel leaves free: on the left of it when the screen is wide, above it otherwise
function frame3d() {
  if (WIDE.matches) W.layout('right', $('#app').getBoundingClientRect().width + 24);
  else { const v = $('.view'); W.layout('bottom', v ? Math.max(0.3, 1 - v.getBoundingClientRect().bottom / innerHeight) : 0.55); }
}
WIDE.addEventListener?.('change', () => frame3d());
{ let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(frame3d, 150); }); }
// a screen: the room the market is seen through (h tall on a narrow screen) and the panel under it
function panel3d(h, html) { root.innerHTML = `<div class="view" style="height:${h}" aria-hidden="true"></div><div class="sheet" id="sheet">${html}</div>`; frame3d(); }
// On a narrow screen the market takes all the room the panel leaves: the view grows down to the panel when the panel is short, and is
// never less than 30 % of the screen
function fitView() {
  const v = $('.view'), sh = $('#sheet'); if (!v || !sh || !W.ok || WIDE.matches) return;
  const top = v.getBoundingClientRect().top + scrollY, free = innerHeight - sh.getBoundingClientRect().height - top - 40;
  v.style.height = Math.round(Math.max(innerHeight * 0.3, Math.min(innerHeight * 0.62, free))) + 'px'; frame3d();
}
const MAP_VIEW = '40vh', LEVEL_VIEW = '36vh';
function show(kicker, playing, hue) {
  document.body.classList.toggle('playing', playing); $('#app').classList.toggle('wide', playing);
  $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  root.onclick = null; keyFn = null; FX.mood(hue); W.onPick = null; W.highlight(null); W.rest();
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));

// a real keyboard: the screen on show says what its keys do
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });
// a tap that comes less than SETTLE after a question came up was meant for the one before
let openAt = 0;

/* ---------- the map ---------- */
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><circle r="13" fill="url(#m-au)" stroke="hsl(${RING[c]} 70% 62%)" stroke-width="2.4"/><text y="5" text-anchor="middle" font-size="13" font-weight="800" fill="#6B4A10">${c + 1}</text></svg>`;
const ICONS = ['🪙', '💶', '🔁', '🧾', '⚖️', '✖️', '👀', '🏷️', '🐷', '🤝', '🍋', '🏦'];
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
// the rush hour opens with «El canvi» validated
const rushOpen = () => OPEN || noteOf(prog, 2) >= VALID;
function mapa() {
  fresh(); show('El mapa del mercat', false, 45); DBG.what = 'mapa';
  worldState(); W.go('map');
  const n = validated(prog).length, all = MARKET_STEPS.length;
  panel3d(MAP_VIEW, '');
  const sheetEl = $('#sheet');
  M.screen({ root: sheetEl, here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${ICONS[i]}</span>`,
    before: `${W.ok ? '' : '<div class="stallmap" id="stallmap"></div>'}<p class="grow">${n >= all ? 'La teva parada és la més bonica de l\'estany!' : n ? `La teva parada: <b>${n} de ${all}</b> millores. Valida un projecte més i hi posaràs ${MARKET_STEPS[n]}.` : `Valida projectes i la teva parada creixerà: primer, ${MARKET_STEPS[0]}.`}</p>`,
    foot: got => `\n    <div class="extra"><button class="btn rushb" id="rush"${rushOpen() ? '' : ' disabled title="Valida «El canvi» per obrir-la"'}>⏱️ Hora punta${prog.rapid ? ` <small>Rècord: ${prog.rapid}</small>` : ''}</button>
      <button class="btn soft" id="full"${OPEN || validated(prog).length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full], ['#rush:not(:disabled)', rush]] });
  if (!W.ok) market($('#stallmap'), n);
  // a project under the finger, or with the focus, makes the next piece of the stall shine
  const lit = e => { const b = e.target.closest?.('.proj[data-p]'); W.highlight(b ? +b.dataset.p : null); };
  sheetEl.onpointerover = lit; sheetEl.onfocusin = lit; sheetEl.onpointerleave = () => W.highlight(null);
  here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  panel3d(LEVEL_VIEW, `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`);
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; W.frogSay(cls); };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the scenes: in the market in 3D or in the page ---------- */
// The things of the market (coins, the crates of the bench, the kitchen scale, the crate of fruit, the piggy bank) are in 3D when there is
// WebGL, and the panel only keeps, for a question answered by touching them, a row of buttons with the same things. The papers (a receipt,
// the purses, the offers, the board of the barter, the book of the bank) stay in the panel as ever
const PHYS = new Set(['coins', 'stall', 'dial', 'crate', 'piggy']);
// where the camera rests for a question with nothing of the stall to show: the lemonade stand, the bank, or the stall
const HOME = p => p === 10 ? 'lemon' : p === 11 ? 'bank' : 'stall';
const chips = sc => sc.s === 'coins' ? sc.coins.map((v, i) => `<button class="hit tchip" data-k="${i}" aria-label="${valName(v)}">${money(v, 40)}</button>`).join('')
  : sc.items.map((x, i) => `<button class="hit tchip" data-k="${i}"><b>${x.e}</b><span>${x.n}</span><i>${sc.hide ? '?' : eur(x.p)}</i></button>`).join('');
function paint(el, sc, o) {
  if (W.ok && sc && PHYS.has(sc.s)) el.innerHTML = o.tap ? `<div class="tchips">${chips(sc)}</div>` : '';
  else scene(el, sc, o);
}
function show3d(sc, t, home) {
  if (!W.ok) return;
  if (!sc) return W.go(home);
  if (sc.s === 'coins') return W.coins(sc.coins, { big: sc.big });
  if (sc.s === 'stall') { W.items(sc.items, { hide: sc.hide, deal: sc.deal, weights: sc.weights }); return W.go('stall'); }
  if (sc.s === 'dial') return W.dial(sc.g, sc.max, sc.e);
  if (sc.s === 'crate') return W.crate(sc.rows, sc.cols, sc.e);
  if (sc.s === 'piggy') return W.piggy(sc, t);
  if (sc.s === 'receipt') { W.receipt(sc.lines); return W.go('stall'); }
  return W.go(home);
}

/* ---------- the Piscina: a coin, a payment and a stall, the first thing a profile with nothing saved meets ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true, 45); $('#toM').hidden = true; $('#toG').hidden = !HUB; DBG.what = 'piscina';
  worldState();
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  say('Benvingut al mercat de l\'estany! Aquí es compra, es paga i es torna el canvi. La parada està tancada: tres proves per obrir-la.');
  let k = 0;
  play({ t, L: { rounds: POOL }, stage, tip: say, slip: buzz, home: 'stall', step: n => { k = n; dots.forEach((d, j) => { d.classList.toggle('cur', j === n); d.classList.toggle('ok', j < n); }); },
    win: async () => {
      dots[k].classList.add('ok'); prog = { ...prog, piscina: true }; save();
      say('La parada és oberta! Ara ja pots entrar al mapa del mercat.', 'go'); kaching(); FX.celebrate(16); coinRain($('#coach'), 14);
      W.rest(); W.go('stall'); W.open();
      await sleep(2400); if (t.on) mapa();
    } });
  fitView();
}

/* ---------- one level of a project ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const L = PROJECTS[sec].levels[idx];
  let slips = 0, over = false;
  DBG.what = 'nivell'; DBG.sec = sec; DBG.idx = idx; Object.defineProperty(DBG, 'slips', { get: () => slips, configurable: true });
  worldState();
  panel3d(LEVEL_VIEW, `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip"></p></div><span class="combo" id="cb" hidden></span><div class="stage" id="stage"></div>`);
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; W.frogSay(cls); };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); buzz(); };

  // the level is handed in at once, before any wait
  async function win(line) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9, grew = validated(r.prog).length > validated(prog).length;
    over = true; keyFn = null; prog = r.prog; save();
    kaching(); chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8); if (n === 3) coinRain($('#coach'), 10);
    await sleep(900); if (!t.on) return;
    const now = validated(prog).length;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${grew && now <= MARKET_STEPS.length ? `<p class="lead go">La teva parada guanya ${MARKET_STEPS[now - 1]}!</p>` : ''}
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${sec === 2 && r.valid ? '<p class="lead go">S\'ha obert l\'hora punta!</p>' : ''}${news(r.news)}
      ${r.exam || r.news.length || grew ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
    // a project validated: the new piece of the stall is built in the market
    if (grew) { W.rest(); W.grow(now); }
  }

  let streak = 0;
  const help = play({ t, L, stage, tip, home: HOME(sec), slip: () => { streak = 0; combo(0); slip(); }, win, good: () => combo(++streak) });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars(); fitView();
  if (!W.ok && stage.getBoundingClientRect().bottom > innerHeight) $('#coach').scrollIntoView({ block: 'start', behavior: 'auto' });
}

/* ---------- the exam of a circle: six levels of its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]); DBG.what = 'examen';
  worldState();
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
    W.rest();
    play({ t: qt, L, stage, tip, home: HOME(L.p), slip: () => end(false), win: () => end(true), exam: true });
    scrollTo({ top: 0, behavior: 'auto' }); fitView();
  }
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true; W.onPick = null;
    r.good ? (kaching(), chime([523, 659, 784, 1047, 1319])) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) { FX.celebrate(16); coinRain($('#coach'), 16); }
    panel(stage, `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? 'Molt bé! Però l\'examen només compta amb tots els projectes del cercle validats.' : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}${r.first ? '<p class="lead go">S\'encén un fanalet al mercat! 🏮</p>' : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    scrollTo({ top: 0, behavior: 'auto' }); fitView();
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
    // a circle passed for the first time lights its lantern; otherwise the market is shown
    W.rest(); r.first ? W.lantern(c) : W.go('map');
  }
  arm();
}

/* ---------- «Caça l'errada»: three sentences written at the stall; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40); DBG.what = 'full';
  worldState();
  // once circle 3 is open, one of the three is about how money works
  const cs = (OPEN || isOpen(prog, 3) ? sheetWide : sheet)(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres frases');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE; DBG.claim = { k, says: C.says, real: C.real, opts: C.opts };
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="board" id="board"></div><p class="ask claim">A la pissarra de la parada hi diu:</p><p class="claimbox">«${C.says}»</p>`;
    W.rest(); paint($('#board'), C.scene, { t }); show3d(C.scene, t, C.kind === 'balance' || C.kind === 'interest' ? 'bank' : C.kind === 'profit' ? 'lemon' : 'stall');
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Fes el càlcul: la pissarra diu la veritat?'); fitView();
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
    stage.innerHTML = tail.innerHTML = ''; W.rest(); W.go('stall');
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Pissarra perfecta!' : 'Pissarra acabada.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra pissarra</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full(); fitView();
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era. La bona és: «${C.real}»` : 'Sí, era correcta!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: «${C.real}»`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="opts col">${C.opts.map((v, i) => `<button class="btn soft" data-v="${i}">${v}</button>`).join('')}</div>`;
      say('Ben vist! Ara tria la frase que diu la veritat.', 'go'); fitView();
    } else if ('v' in b.dataset) { const ok = C.opts[+b.dataset.v] === C.real; answer(ok, ok ? `Arreglada: «${C.real}»` : `No era aquesta. La bona és: «${C.real}»`); }
  };
  arm();
}

/* ---------- the questions of a level, one after another ---------- */
// Each round has a scene and a question. The scene stays while the next round has the same one. A wrong answer is a slip and the frog
// says how to think it; a right one lights up what answered it and says why. step(k), when given, hears of every new round (the dots of
// the Piscina); good() of every right answer (the run of the level). home: where the market in 3D looks when the round has nothing of its own
function play({ t, L, stage, tip, slip, win, step, good, home = 'stall' }) {
  const n = L.rounds.length;
  let k = -1, R = null, busy = false, buf = '', seq = 0, shown = null, opts = [], box = null;
  stage.innerHTML = `<p class="ask" id="q"></p><div class="board" id="board"></div><div class="ans" id="ans"></div>`;
  const board = $('#board'), ans = $('#ans');
  // what a tap in the market touches, by the scene of the round: a coin or a crate of the bench
  const kind3d = () => R?.scene?.s === 'coins' ? 'coin' : 'item';
  function arm() {
    k++; R = L.rounds[k]; busy = false; buf = ''; seq = 0; box = null; openAt = performance.now() + SETTLE; step?.(k);
    DBG.q = R.q; DBG.k = k; DBG.armed = (DBG.armed || 0) + 1;
    const ty = R.q.type, tap = ty === 'tap' || ty === 'order', key = JSON.stringify([R.scene, tap]);
    if (ty === 'pay' || ty === 'weigh') { shown = null; W.rest(); }
    else if (key !== shown) { W.rest(); paint(board, R.scene, { t, tap }); show3d(R.scene, t, home); shown = key; if (R.scene?.s === 'receipt') printer(R.scene.lines.length); }
    else { board.querySelectorAll('.ok, .no').forEach(e => { e.classList.remove('ok', 'no'); if (e.disabled !== undefined) e.disabled = false; }); W.unmark(); }
    board.querySelectorAll('.seq').forEach(e => e.remove());
    $('#q').innerHTML = `${n > 1 ? `<small>Pregunta ${k + 1} de ${n}</small>` : ''}${R.q.text}`; again($('#q')).add('pop');
    if (ty === 'pay') {
      const Q = R.q, top = Q.change ? 'CANVI' : Q.bank ? 'INGRÉS' : 'TOTAL';
      if (W.ok) {
        W.at(Q.bank ? 'bank' : 'stall'); if (!Q.bank) W.items(Q.items, {}); W.lcd(top, 0);
        if (Q.change) { W.client(Q.who, { say: wish(Q.items), paid: Q.paid }); W.go('shop'); } else W.go(Q.bank ? 'bank' : 'pay');
      }
      box = payBox(board, Q, { sound: s => SOUND[s](), onPut: put, onMove: vals => { W.counter(vals); W.lcd(top, sum(vals)); } });
      ans.innerHTML = `<button class="btn" id="go">${Q.change ? 'Torna el canvi' : Q.bank ? 'Ingressa' : 'Paga'}</button>`;
    }
    else if (ty === 'weigh') { W.scale(R.q); box = scaleBox(board, R.q, { t, sound: s => SOUND[s](), onPut: put, onMove: vals => W.pan(vals) }); ans.innerHTML = `<button class="btn" id="go">Comprova</button>`; }
    else if (tap) ans.innerHTML = `<p class="how">👆 ${ty === 'order' ? 'Toca\'ls per ordre.' : 'Toca la resposta.'}</p>`;
    else if (ty === 'pick') { opts = shuffle(R.q.opts.slice(), Math.random); ans.innerHTML = `<div class="opts col">${opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}</button>`).join('')}</div>`; }
    else { ans.innerHTML = `<p class="display" id="disp" aria-live="polite"></p><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
      ${ty === 'eur' ? '<button class="key" data-d="," aria-label="Coma">,</button>' : '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>'}<button class="key" data-d="0">0</button>${ty === 'eur' ? '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>' : ''}
      <button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`; paint1(); }
    W.onPick = (kind, key) => {
      if (!t.on || busy) return;
      if (kind === 'mat') return box?.take?.(+key);
      if (kind === 'pan') return box?.take?.();
      const el = board.querySelector(`.hit[data-k="${key}"]`); if (el) touch(el);
    };
    fitView();
  }
  // what is typed, with its unit after it
  const paint1 = () => { const d = $('#disp'); if (!d) return; const u = R.q.type === 'eur' ? '€' : R.q.unit;
    d.innerHTML = `${buf ? (R.q.type === 'eur' ? buf : thousands(buf)) : '<i class="caret"></i>'}${u ? ` <small>${u}</small>` : ''}`; };
  const typed = () => R.q.type === 'eur' ? centsOf(buf) : buf === '' ? NaN : +buf;
  async function right(el) {
    busy = true; good?.();
    if (el) { el.classList.add('ok'); spark(el, 140); if (el.dataset.k != null && el.closest('#board')) W.mark(kind3d(), el.dataset.k, true); }
    blip(880); tip(`${pick(HURRAY)} ${R.q.say}`, 'go');
    if (R.q.type === 'num' || R.q.type === 'eur') { $('#disp')?.classList.add('ok'); ans.querySelectorAll('button').forEach(b => b.disabled = true); }
    if (R.q.type === 'pay') { box.lock(); box.open(); kaching(); W.ring(); coinRain(board.querySelector('.register'), 8); $('#go').disabled = true; if (R.q.change) W.served(R.q.items.map(x => x.e)); }
    if (R.q.type === 'weigh') { box.lock(); box.level(); chime([784, 1047]); spark(board.querySelector('svg'), 50); $('#go').disabled = true; }
    await sleep(k === n - 1 ? 1600 : 2000); if (!t.on) return;
    if (k === n - 1) { keyFn = null; W.onPick = null; win(`${n === 1 ? 'Un repte resolt' : `${n} reptes resolts`}<br><small>${L.title || ''}</small>`); } else arm();
  }
  const ty = () => R?.q.type;
  function wrong(el, hint = R.q.hint) {
    slip(); if (el) { again(el).add('shake'); el.classList.add('no'); if (el.dataset.k != null && el.closest('#board')) W.mark(kind3d(), el.dataset.k, false); }
    if (R.q.change) W.upset();
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
    const vals = box.value(), v = verdict(R.q, vals), s = sum(vals);
    if (v === 'ok') return right(null);
    box.shake();
    const what = R.q.type === 'weigh' ? (R.q.barter ? (v === 'over' ? 'Hi ha massa: el plat de les peces baixa. Treu-ne alguna.' : 'Encara en falta: el plat de les peces puja. Posa-n\'hi més.')
      : v === 'over' ? 'Hi ha massa pes: el plat de les peses baixa. Treu-ne alguna.' : 'Encara falta pes: el plat de les peses puja. Posa-n\'hi més.')
      : v === 'over' ? `Hi has posat ${eur(s)}: és massa! Toca les monedes del taulell per tornar-les.` : v === 'more' ? `Es pot fer amb ${R.q.min} peces.` : `Hi has posat ${eur(s)}: encara en falta.`;
    wrong(null, `${what} ${R.q.hint}`);
  }
  // a tap on the scene (in the page, or in the market through the row of buttons)
  function touch(el) {
    if (busy || !R || !t.on || performance.now() < openAt) return;
    const key = el.dataset.k, Q = R.q;
    if (Q.type === 'tap') return Q.ans.includes(key) ? right(el) : wrong(el);
    if (Q.type !== 'order' || el.classList.contains('ok')) return;
    if (key !== Q.ans[seq]) return wrong(el);
    seq++; el.classList.add('ok'); blip(520 + seq * 60); W.seq(kind3d(), key, seq);
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
      buf = ''; paint1(); again($('#disp')).add('shake'); return wrong(null);
    }
    if (d === 'del') buf = buf.slice(0, -1);
    else if (d === ',') { if (R.q.type !== 'eur' || buf.includes(',')) return; buf = (buf || '0') + ','; }
    else { if (buf.length >= 7 || /,\d\d$/.test(buf)) return; buf = (buf + d).replace(/^0+(?=\d)/, ''); }
    blip(); paint1();
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
// Somebody walks to the counter, asks for their thing (or their two things) and pays with a note; the child gives the change with the
// coins of the till. The right change is taken at once and the next one comes in. The fewest pieces are worth a bonus second, and five
// served in a row three more. The till counts the takings of the day. The best is kept (rapid)
function rush() {
  const t = fresh(); show('Hora punta', true, 5); DBG.what = 'rush';
  let served = 0, streak = 0, takings = 0, end = performance.now() + RUSH_SECS * 1000, C = null, box = null, busy = false, over = false;
  worldState();
  panel3d(LEVEL_VIEW, `<div class="rushbar"><span class="clock" id="clock">${RUSH_SECS}</span><span class="time"><i id="tbar"></i></span><span class="chip" id="served">0 clients</span><span class="chip till" id="till">Caixa: 0 €</span></div>
    <div class="queue" id="queue" aria-hidden="true"></div><span class="combo" id="cb" hidden></span>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div>`);
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; W.frogSay(cls); };
  const queue = $('#queue');
  const FACES = ['🧑', '👩', '🧔', '👵', '👧', '👨', '👩‍🦰'];
  const paintQueue = () => { queue.innerHTML = Array.from({ length: 4 }, (_, i) => `<span style="--d:${i * 0.15}s">${FACES[(served + i + 1) % FACES.length]}</span>`).join(''); };
  tip('Hora punta! Ve molta gent a la parada. Torna el canvi tan de pressa com puguis: amb les menys peces, guanyes un segon, i cinc clients seguits en donen tres més.');
  W.at('stall'); W.queue(4); W.go('queue');
  // the clock: the bar empties and the last ten seconds tick
  let lastSec = RUSH_SECS;
  const tick = () => {
    if (!t.on || over) return;
    const left = Math.max(0, end - performance.now()), s = Math.ceil(left / 1000);
    $('#tbar').style.width = (100 * Math.min(1, left / (RUSH_SECS * 1000))).toFixed(1) + '%'; $('#clock').textContent = s;
    if (s !== lastSec) { lastSec = s; if (s <= 10 && s > 0) { click(s <= 3 ? 1200 : 880, 0, 0.05, 0.06); $('#clock').classList.add('hurry'); } else $('#clock').classList.remove('hurry'); }
    if (left <= 0) return finish();
    requestAnimationFrame(tick);
  };
  async function next() {
    C = customer(served, Math.random); busy = false; paintQueue(); DBG.q = { type: 'pay', target: C.change, purse: TILL }; DBG.served = served;
    $('#stage').innerHTML = `<div class="board" id="board"></div><div class="ans"><button class="btn" id="go">Torna el canvi</button></div>`;
    W.items(C.items, {}); W.lcd('CANVI', 0);
    box = payBox($('#board'), { type: 'pay', change: true, who: C.who, items: C.items, paid: C.paid, purse: TILL, target: C.change, min: 0 },
      { sound: s => SOUND[s](), onPut: put, onMove: vals => { W.counter(vals); W.lcd('CANVI', sum(vals)); } });
    W.onPick = (kind, key) => { if (kind === 'mat' && !busy && !over) box.take(+key); };
    fitView();
    if (W.ok) await W.client(C.who, { rush: true, say: wish(C.items), paid: C.paid }); else await walk($('#board .client'), true);
    $('#go').onclick = () => { if (busy || over) return; const s = sum(box.value());
      streak = 0; combo(0); buzz(); box.shake(); W.upset();
      tip(`${s > C.change ? 'És massa' : 'En falta'}: ${C.items.length > 1 ? `${C.items.map(x => x.n.toLowerCase()).join(' i ')} costen ${C.items.map(x => eur(x.p)).join(' + ')} = ${eur(C.price)}` : `${C.item.n.toLowerCase()} costa ${eur(C.price)}`} i t'ha pagat ${eur(C.paid)}.`, 'oops'); };
  }
  async function put(vals) {
    if (busy || over || !t.on) return;
    if (sum(vals) !== C.change) return;
    busy = true; served++; streak++; takings += C.price; combo(streak); box.lock(); box.open(); kaching(); W.ring();
    const bonus = vals.length <= C.min, row = streak % 5 === 0;
    if (bonus) end += 1000;
    if (row) end += 3000;
    $('#served').textContent = `${served} client${served === 1 ? '' : 's'}`; again($('#served')).add('pop');
    $('#till').textContent = `Caixa: ${eur(takings)}`; again($('#till')).add('pop');
    tip(`${pick(['Gràcies!', 'Fins aviat!', 'Quina rapidesa!', 'Perfecte!'])} ${eur(C.change)}${bonus ? ' amb les menys peces: +1 segon!' : '.'}${row ? ` ${streak} seguits: +3 segons!` : ''}`, 'go');
    coinRain($('#board .register'), 6);
    if (W.ok) await W.served(C.items.map(x => x.e)); else await walk($('#board .client'), false);
    if (!t.on || over) return;
    next();
  }
  function finish() {
    over = true; box?.lock(); W.onPick = null;
    const r = rapidIn(prog, served); prog = r.prog; save();
    r.best ? (kaching(), chime([523, 659, 784, 1047, 1319]), FX.celebrate(16)) : chime([523, 659, 784]);
    tip(served ? `S'ha acabat l'hora punta: has atès ${served} client${served === 1 ? '' : 's'}!` : "S'ha acabat l'hora punta.", 'go');
    W.queue(0);
    panel($('#stage'), `<h2>${served} client${served === 1 ? '' : 's'}</h2>
      <p class="lead${r.best ? ' go' : ''}">${r.best ? 'Rècord nou!' : `El teu rècord: ${prog.rapid}`}</p>
      ${takings ? `<p class="lead">La caixa del dia: has venut per valor de <b>${eur(takings)}</b>.</p>` : ''}${news(r.news)}
      <button class="btn" id="rp">Una altra hora punta</button><button class="link" id="bk">Torna al mapa</button>`);
    $('#rp').onclick = () => rush(); $('#bk').onclick = () => mapa(); fitView();
  }
  next(); requestAnimationFrame(tick);
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
