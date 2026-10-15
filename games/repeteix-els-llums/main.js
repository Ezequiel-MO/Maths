import { $, RM, sleep, rand, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, HIDE_NAME, STEPS, TURN, hueOf, pitchOf, rc, round, asks, starsFor, clean, noteOf, reached,
  levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, freeIn, exam, examIn, sheet, sheetIn, wrong, misses, GRIDS, LIVES, makeSeq, begin, step } from './logic.js';

const KEY = 'repeteix-els-llums';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls, best }. clean() makes a complete progress out of anything the browser holds. The game used to
// share its page and its save with the programming rocket, under 'memoria-visual': the record made there still counts, and that save is only ever read here
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.trunc(x)) : 0;
const mine = load(KEY), old = load('memoria-visual');
let prog = clean(mine);
if (!mine) prog = clean({ best: whole(old?.best), so: old?.so });
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}
// the record of before goes into the new save at once, so the page of all games shows it
if (!mine && prog.best) save();

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; pickFn = hintFn = null; return tok; }

// each tile has its own note
const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const buzz = () => click(150, 0, 0.45, 0.16, 'triangle');

// the frog of the pond, who says what to do
const FROG = `<svg class="frog" viewBox="-40 -50 80 72" aria-hidden="true"><ellipse cx="0" cy="16" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 12q-9-2-7-9q7 2 11 6ZM25 12q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-6" rx="25" ry="20" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-26" r="4" fill="#0F3A40"/><circle cx="13" cy="-26" r="4" fill="#0F3A40"/><circle cx="-9.500" cy="-28" r="1.4" fill="#fff"/><circle cx="14.5" cy="-28" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -5 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/></svg>`;

const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quina memòria!', 'Així es fa!'];
const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quina memòria!', 'Ulls de mussol!'];
const HUES = [165, 205, 30, 140, 262, 195, 318, 100, 48, 280];
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
// takes the one-shot classes off an element and gives its class list back, so the same animation can start again
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /repeteix-els-llums\.html$/.test(location.pathname);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; FX.mood(hue);
}
$('#toS').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

/* ---------- the board: n × n tiles in a frame that can turn, with a lid that covers it while it turns ---------- */
const BOARD = '<div class="bwrap" id="bwrap"><div class="board" id="board"></div><div class="lid" id="lid" hidden></div></div>';
const TAIL = '<div class="tail"><div class="arrows" id="arrows" aria-live="polite"></div><div class="dots" id="dots" aria-hidden="true"></div><p class="rn" id="rn"></p><p class="wait" id="wait"></p><div class="opts" id="btns"></div></div>';
let N = 3, flat = false, tiles = [], bd = null;
const ON = 520, GAP = 190;
const hueAt = i => { const { r, c } = rc(i, N); return flat ? 195 : hueOf(r, c, N); };
// draws the tiles of an n × n board; plain gives all of them the same colour, so the colour does not say where a tile was
async function build(n, t, plain = false) {
  bd = $('#board'); N = n; flat = plain; bd.style.setProperty('--n', n);
  const m = (n - 1) / 2;
  bd.innerHTML = Array.from({ length: n * n }, (_, i) => {
    const { r, c } = rc(i, n);
    return `<button class="tile enter" data-i="${i}" tabindex="-1" aria-label="Fila ${r + 1}, columna ${c + 1}" style="--h:${hueAt(i)};--d:${Math.round(Math.hypot(r - m, c - m) * 70)}"></button>`;
  }).join('');
  tiles = [...bd.children];
  bd.onclick = e => { const b = e.target.closest('.tile'); if (b && pickFn) pickFn(+b.dataset.i); };
  await sleep(RM ? 0 : 650);
  if (t.on) tiles.forEach(e => e.classList.remove('enter'));
}
function centre(i) { const r = tiles[i].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }
const note = (i, at = 0, dur = 0.34, vol = 0.15) => { const { r, c } = rc(i, N); tone(pitchOf(r, c, N), at, dur, vol); };
// light one tile for ms: glow, sparks, a ring and its note
function flash(i, ms = ON, quiet = false) {
  const e = tiles[i], h = hueAt(i), p = centre(i);
  e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
  FX.burst(p.x, p.y, h, quiet ? 6 : 20, p.w * (quiet ? 1.2 : 2.4)); if (!quiet) { FX.ring(p.x, p.y, h, p.w * 0.45, p.w * 1.25); note(i); }
  return sleep(ms).then(() => { if (tiles[i] === e) e.classList.remove('on'); });
}
// several tiles lit at once, with their notes together
function light(cells, cls = 'on') {
  cells.forEach((i, j) => { tiles[i].classList.add(cls); note(i, j * 0.03, 0.5, 0.07); const p = centre(i); FX.burst(p.x, p.y, hueAt(i), 8, p.w * 1.4); });
}
const pic = (i, s, cls = '') => { tiles[i].innerHTML = `<span class="pic${cls}">${s}</span>`; };
// the board as it is before a round: dark, unturned, uncovered, with no mirror line and nothing on it
function reset() {
  tiles.forEach(e => { e.classList.remove('on', 'src', 'got', 'bad', 'hint'); e.textContent = ''; });
  $('#bwrap').classList.remove('axis-v', 'axis-h', 'rest'); $('#lid').hidden = true;
  bd.classList.add('still'); bd.style.transform = ''; void bd.offsetWidth; bd.classList.remove('still');
  $('#arrows').innerHTML = ''; $('#wait').textContent = '';
}
function live(on) { bd.classList.toggle('live', on); tiles.forEach(e => e.tabIndex = on ? 0 : -1); }
function wave() {
  tiles.forEach((e, i) => { const { r, c } = rc(i, N); e.style.setProperty('--d', (r + c) * 55); e.classList.add('wave'); });
  const these = tiles;
  setTimeout(() => these.forEach(e => e.classList.remove('wave')), 700 + N * 110);
}
// the board turns by deg, in a second, with the tiles on it
async function spin(deg, t) {
  bd.style.transform = `rotate(${deg}deg)`; tone(330, 0, 0.9, 0.05, 'triangle');
  await sleep(RM ? 500 : 1250);
  return t.on;
}

/* ---------- what each kind of level shows before the child answers ---------- */
// what the frog says while it is shown
const LOOK = {
  seq: L => L.back ? 'Mira bé… i després, al revés.' : 'Mira bé…',
  set: () => 'Mira la foto…',
  change: () => 'Mira la foto… Després parpellejarà.',
  where: () => 'Mira on s\'amaga cada animaló…',
  mirror: (L, R) => R.axis === 'h' ? 'Mira els llums. La ratlla és l\'aigua de l\'estany.' : 'Mira els llums. La ratlla del mig és un mirall.',
  turn: (L, R) => `Mira els llums. El tauler farà ${TURN[R.deg][1]} ${TURN[R.deg][0]}`,
  walk: L => L.lose ? 'Mira d\'on surt la granota: s\'amagarà!' : 'Mira d\'on surt la granota i segueix les fletxes…'
};
const SHOW = {
  async seq(R, L, t) {
    for (const i of R.seq) { await flash(i, L.on || ON); if (!t.on) return; await sleep(L.on ? GAP * 0.7 : GAP); if (!t.on) return; }
  },
  async set(R, L, t) { light(R.cells); await sleep(L.ms); if (t.on) reset(); },
  async change(R, L, t) {
    light(R.a); await sleep(L.ms); if (!t.on) return;
    reset(); await sleep(RM ? 500 : 650); if (!t.on) return;
    light(R.b);
  },
  async where(R, L, t) {
    R.cells.forEach((i, j) => { pic(i, R.things[j]); note(i, j * 0.12, 0.3, 0.08); });
    await sleep(L.ms); if (!t.on) return;
    // they hide one after the other
    for (const i of R.cells) { pic(i, R.things[R.cells.indexOf(i)], ' hide'); }
    await sleep(RM ? 0 : 420); if (t.on) R.cells.forEach(i => { tiles[i].textContent = ''; });
  },
  async mirror(R, L, t) {
    $('#bwrap').classList.add(R.axis === 'h' ? 'axis-h' : 'axis-v');
    light(R.cells, 'src');
    if (L.keep) return;
    await sleep(L.ms); if (t.on) R.cells.forEach(i => tiles[i].classList.remove('src'));
  },
  async turn(R, L, t) {
    light(R.cells); await sleep(L.ms); if (!t.on) return;
    if (L.see !== 'lit') { R.cells.forEach(i => tiles[i].classList.remove('on')); await sleep(400); if (!t.on) return; }
    if (L.see === 'cover') { const lid = $('#lid'); lid.innerHTML = `<b>${TURN[R.deg][0]}</b><span>${TURN[R.deg][1]}</span>`; lid.hidden = false; again(lid).add('pop'); await sleep(900); if (!t.on) return; }
    if (!await spin(R.deg, t)) return;
    if (L.see === 'cover') { await sleep(500); if (!t.on) return; $('#lid').hidden = true; }
    if (L.see === 'lit') { await sleep(500); if (t.on) R.cells.forEach(i => tiles[i].classList.remove('on')); }
  },
  async walk(R, L, t) {
    pic(R.start, '🐸', ' frog'); note(R.start);
    await sleep(1300); if (!t.on) return;
    if (L.lose) { tiles[R.start].textContent = ''; await sleep(400); if (!t.on) return; }
    const strip = $('#arrows');
    for (const [k, d] of R.path.entries()) {
      strip.insertAdjacentHTML('beforeend', `<i>${STEPS[d][0]}</i>`); tone(523 + k * 70, 0, 0.18, 0.08);
      await sleep(L.hide ? 850 : 650); if (!t.on) return;
    }
    if (L.hide) { await sleep(500); if (t.on) strip.innerHTML = ''; }
  }
};
// what the frog says after a wrong tile; the good ones blink after it
function oops(L, R, k) {
  if (L.kind === 'seq') return L.back ? 'Ui! Aquest no. Recorda: del final al principi. El bo fa pampallugues.' : 'Ui! Aquest no. El bo fa pampallugues.';
  if (L.kind === 'set') return 'Ui! Aquest no s\'havia encès. Els que falten fan pampallugues.';
  if (L.kind === 'change') return 'Ui! No era aquest. El canvi fa pampallugues.';
  if (L.kind === 'where') return `Ui! Allà no hi havia ${HIDE_NAME[R.things[R.ask[k]]]}. Era on fa pampallugues.`;
  if (L.kind === 'mirror') return 'Ui! Aquest no és al mirall. Compta quants quadres hi ha fins a la ratlla.';
  if (L.kind === 'turn') return 'Ui! Aquí no hi ha cap llum. Els bons fan pampallugues.';
  return 'Ui! La granota no arriba aquí. Arriba on fa pampallugues.';
}

/* ---------- answering: touching tiles ---------- */
let pickFn = null, hintFn = null;
// Resolves { ok: true } once every tile of want is touched (in its order when the round is ordered), { ok: false, got, want, k } at the first
// wrong one (want: the tiles that were good there), or { hint: true } when the hint button is pressed. good(i, k) is told of every good tile
function listen(R, good) {
  return new Promise(res => {
    let k = 0;
    const left = new Set(R.want), dots = [...$('#dots').children];
    const done = v => { pickFn = hintFn = null; res(v); };
    hintFn = () => done({ hint: true });
    pickFn = i => {
      if (!R.ordered && tiles[i].classList.contains('got')) return;
      if (R.ordered ? i !== R.want[k] : !left.has(i)) return done({ ok: false, got: i, want: R.ordered ? [R.want[k]] : [...left], k });
      left.delete(i);
      if (R.ordered) flash(i, 260); else { tiles[i].classList.add('got'); note(i); const p = centre(i); FX.burst(p.x, p.y, hueAt(i), 14, p.w * 2); }
      dots[k]?.classList.add('ok'); k++; good?.(i, k);
      if (k === R.want.length) done({ ok: true });
    };
  });
}

// Plays the rounds of level L on the board on screen, each a new draw. Every wrong tile and every hint is a slip, and the round is shown
// again from the start. In an exam the first wrong tile ends the level: it gives false. It gives true when every round is done
async function play(L, { t, tip, slip = () => {}, exam: strict = false }) {
  const rounds = L.rounds || 1;
  for (let r = 0; r < rounds; r++) {
    const R = round(L, Math.random);
    $('#rn').textContent = rounds > 1 ? `Ronda ${r + 1} de ${rounds}` : '';
    let first = r === 0;
    for (;;) {
      reset(); $('#dots').innerHTML = '<i></i>'.repeat(R.want.length);
      // the first time the level says what it is about; after that, only what to look at
      if (!first) tip(LOOK[L.kind](L, R));
      first = false;
      await sleep(700); if (!t.on) return false;
      await SHOW[L.kind](R, L, t); if (!t.on) return false;
      if (L.wait) {
        $('#bwrap').classList.add('rest');
        for (let s = L.wait; s > 0; s--) { $('#wait').textContent = `Guarda-ho al cap… ${s}`; click(392, 0, 0.1, 0.04); await sleep(1000); if (!t.on) return false; }
        $('#wait').textContent = ''; $('#bwrap').classList.remove('rest');
      }
      tip(asks(L, R)); live(true);
      let k = 0;
      const res = await listen(R, (i, n) => {
        k = n;
        if (L.kind !== 'where') return;
        pic(i, R.things[R.ask[n - 1]]);
        if (n < R.want.length) tip(`I ${HIDE_NAME[R.things[R.ask[n]]]}?`, 'go');
      });
      live(false); if (!t.on) return false;
      if (res.ok) break;
      slip();
      if (res.hint) { tip('Mira-ho una altra vegada.'); continue; }
      const bad = tiles[res.got];
      bad.classList.add('bad'); again($('#bwrap')).add('shake'); buzz();
      tip(oops(L, R, k), 'oops');
      await sleep(450); if (!t.on) return false;
      bad.classList.remove('bad'); res.want.forEach(i => tiles[i].classList.add('hint'));
      await sleep(strict ? 1300 : 1800); if (!t.on) return false;
      if (strict) return false;
      res.want.forEach(i => tiles[i].classList.remove('hint'));
    }
    await sleep(300); if (!t.on) return false;
    wave();
    if (r < rounds - 1) { tip(pick(BRAVO), 'go'); chime([659, 784, 1047]); await sleep(1300); if (!t.on) return false; }
  }
  return true;
}
// waits for the «Som-hi!» button: the child starts when ready to look
function ready(t, label = 'Som-hi!') {
  const box = $('#btns');
  box.innerHTML = `<button class="btn" id="go">${label}</button>`; $('#go').focus({ preventScroll: true });
  return new Promise(res => { $('#go').onclick = () => { box.innerHTML = ''; res(t.on); }; });
}

/* ---------- the map: four bands, one button for each project and the exam of the circle at the end ---------- */
const RING = [165, 30, 195, 48];   // the colour of each circle
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 10, 6, 2].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 70% 62%)" stroke-width="2.2" opacity="${3 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c);
const noteText = i => { const n = noteOf(prog, i), d = prog.stars.slice(i * 10, i * 10 + 10).filter(Boolean).length; return n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer'; };
const examBtn = c => `<button class="proj exam${prog.exams[c] ? ' ok' : ''}" data-x="${c}" aria-label="Examen del cercle ${c}"${openX(c) ? '' : ' disabled'}><b>Examen</b><span class="mk">${prog.exams[c] ? 'Superat ✓' : openX(c) ? 'Sis preguntes' : openC(c) ? 'Valida els projectes' : 'Tancat'}</span></button>`;
// one line that says what to do now: the first project of an open circle that is not validated, or its exam; nothing when all is done
function advice() {
  for (let c = 0; c < CIRCLES.length && isOpen(prog, c); c++) {
    const i = CIRCLES[c].projects.find(i => noteOf(prog, i) < VALID);
    if (i !== undefined) return `Ara toca: ${PROJECTS[i].name}`;
    if (!prog.exams[c]) return `Ara toca: l'examen del cercle ${c}`;
  }
  return '';
}
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  fresh(); show('El mapa', false, 205);
  const band = c => `<section class="ring r${c}${openC(c) ? '' : ' shut'}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}"${openC(c) ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice();
  $('#game').innerHTML = `<div class="map">${tip ? `<p class="next">${tip}</p>` : ''}${CIRCLES.map((_, c) => band(c)).join('')}
    <div class="extra"><button class="btn soft" id="full"${OPEN || PROJECTS.some((_, i) => noteOf(prog, i) >= VALID) ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      <button class="btn soft" id="free">Partida lliure${prog.best ? ` · rècord ${prog.best}` : ''}</button>
      <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div></div>`;
  $('#game').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level that still has something to win, as far as the project is open
      const i = +b.dataset.p, k = prog.stars.slice(i * 10, i * 10 + 10).findIndex(n => n < 3);
      level(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : reached(prog, i), 9));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
    else if (e.target.closest('#free')) lliure();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label, stage = BOARD) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="steps" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage">${stage}</div>${TAIL}`;
  return { stage: $('#stage'), dots: [...$('#steps').children], say: coachSay };
}
function coachSay(txt, cls = '') { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; }

/* ---------- the Piscina: one light, two in a row and a photo, the first thing a profile with nothing saved meets ---------- */
// A mistake costs nothing: the step is shown again. The third one saves piscina and opens the map. There is no «← Mapa» here: the map
// would have every circle shut, so the way out is the page of all games.
async function piscina() {
  const t = fresh(); show('La Piscina', true, 165); $('#toS').hidden = true; $('#toG').hidden = !HUB;
  const { dots, say } = frame(POOL.length, 'Tres reptes');
  const SAY = ['Benvingut a l\'estany dels llums! Per entrar-hi, tres reptes. El primer: un llum s\'encendrà. Toca\'l!',
    'Ara dos llums, un darrere l\'altre. Toca\'ls en el mateix ordre.', 'L\'últim: dos llums s\'encenen alhora. Toca\'ls tots dos.'];
  await build(3, t); if (!t.on) return;
  for (let k = 0; k < POOL.length; k++) {
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    say(SAY[k]);
    if (!await ready(t)) return;
    if (!await play(POOL[k], { t, tip: say })) return;
    dots[k].classList.add('ok');
  }
  prog = { ...prog, piscina: true }; save();
  say('Piscina superada! Ja pots entrar a l\'estany dels llums.', 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(16);
  await sleep(2400); if (t.on) mapa();
}

/* ---------- one level of a project ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), L = PROJECTS[sec].levels[idx];
  let slips = 0;
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage">${BOARD}</div>${TAIL}`;
  // a level is marked done when it has a star
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); };
  // a hint shows the round again, and costs as much as a mistake
  $('#hintb').onclick = () => hintFn?.();

  // the level is handed in at once, before any wait: its stars go to the mark of the project, and the mark to the XP once the project is validated
  async function win() {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    prog = r.prog; save();
    coachSay(pick(HURRAY), 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel($('#stage'), `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    $('#stage .panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  stars(); coachSay(L.say);
  (async () => {
    await build(L.n, t, L.plain); if (!t.on) return;
    if (!await ready(t)) return;
    if (await play(L, { t, tip: coachSay, slip }) && t.on) win();
  })();
}

/* ---------- the exam of a circle: six levels of its projects, one round each, no hints, saved by the sixth ---------- */
// The first wrong tile ends a question as missed. Nothing is saved before the sixth answer, which is handed in at once (examIn).
async function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]);
  const qs = exam(c, Math.random), run = [], { dots, say } = frame(qs.length, 'Sis preguntes');
  for (let k = 0; k < qs.length; k++) {
    const L = qs[k];
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[L.p].name}`;
    await build(L.n, t, L.plain); if (!t.on) return;
    say(`${L.title}. ${PROJECTS[L.p].sub}`);
    if (!await ready(t)) return;
    const ok = await play(L, { t, tip: say, exam: true }); if (!t.on) return;
    run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (k === qs.length - 1) break;
    if (ok) { say('Correcte!', 'go'); chime([523, 659, 784]); FX.celebrate(6); await sleep(1000); if (!t.on) return; }
    else { say('No és correcte.', 'oops'); if (!await ready(t, 'Segueix')) return; }
  }
  const r = examIn(prog, c, qs, run), first = r.good && !prog.exams[c];
  prog = r.prog; save();
  $('#qn').hidden = true; $('#btns').innerHTML = '';
  r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
  if (r.good) FX.celebrate(16);
  say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
  panel($('#stage'), `<h2>${r.score} de ${qs.length}</h2>
    <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? 'Molt bé! Però l\'examen només compta amb tots els projectes del cercle validats.' : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
    ${first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
    ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
    <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
  scrollTo({ top: 0, behavior: 'auto' });
  $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
}

/* ---------- «Caça l'errada»: three copies made by the lights of the pond; from none to two of them are wrong ---------- */
// A photo copied from memory, a mirror and a turn, each next to its picture. «És correcte» of a wrong one, or «No és correcte» of a right one,
// is a miss; «No és correcte» of a wrong one asks to touch where the mistake is. The third is handed in at once (sheetIn); leaving earlier keeps nothing.
const CAP = { foto: ['La foto', 'La còpia, de memòria'], mirall: ['Els llums', 'El mirall'], gir: ['Els llums', ''] };
const mini = (C, cells, id) => `<div class="mini${C.axis ? ' axis-' + C.axis : ''}" id="${id}" style="--n:${C.n}">${Array.from({ length: C.n * C.n }, (_, i) => {
  const { r, c } = rc(i, C.n); return `<button class="mt${cells.includes(i) ? ' on' : ''}" data-i="${i}" tabindex="-1" aria-label="Fila ${r + 1}, columna ${c + 1}" style="--h:${hueOf(r, c, C.n)}"></button>`;
}).join('')}</div>`;
async function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, dots, say } = frame(cs.length, 'Tres còpies', '');
  const btns = $('#btns');
  for (let k = 0; k < cs.length; k++) {
    const C = cs[k], cap = CAP[C.kind], bad = wrong(C);
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    const turned = C.kind === 'gir' && TURN[C.deg][1], right = turned ? `Després ${turned.startsWith('un') ? "d'" : 'de '}${turned} ${TURN[C.deg][0]}` : cap[1];
    stage.innerHTML = `<div class="pair"><figure><figcaption>${cap[0]}</figcaption>${mini(C, C.a, 'ma')}</figure><figure><figcaption>${right}</figcaption>${mini(C, C.kind === 'foto' ? [] : C.b, 'mb')}</figure></div>`;
    if (C.kind === 'foto') {
      say('Mira bé la foto. Després s\'apagarà i en sortirà la còpia.');
      await sleep(2600); if (!t.on) return;
      $('#ma').querySelectorAll('.on').forEach(e => e.classList.remove('on')); $('#ma').classList.add('off');
      $('#mb').querySelectorAll('.mt').forEach(e => e.classList.toggle('on', C.b.includes(+e.dataset.i)));
      tone(523, 0, 0.2, 0.08);
    }
    say(C.kind === 'foto' ? 'La còpia és igual que la foto?' : C.kind === 'mirall' ? 'Aquest mirall està ben fet?' : 'Els llums han quedat ben girats?');
    btns.innerHTML = '<button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button>';
    let ok = await new Promise(res => {
      $('#yes').onclick = () => res(!bad);
      $('#no').onclick = () => {
        if (!bad) return res(false);
        btns.innerHTML = ''; say('Ben vist! Ara toca on és l\'errada, a la còpia de la dreta.', 'go');
        const mb = $('#mb'); mb.classList.add('live');
        mb.onclick = e => { const b = e.target.closest('.mt'); if (b) { mb.classList.remove('live'); mb.onclick = null; res(misses(C).includes(+b.dataset.i)); } };
      };
    });
    if (!t.on) return;
    btns.innerHTML = ''; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    // the copy as it should be: the lights that do not belong in red, the ones it lacks blinking
    $('#mb').querySelectorAll('.mt').forEach(e => { const i = +e.dataset.i; e.classList.toggle('bad', C.b.includes(i) && !C.real.includes(i)); e.classList.toggle('hint', C.real.includes(i) && !C.b.includes(i)); });
    if (C.kind === 'foto') $('#ma').querySelectorAll('.mt').forEach(e => e.classList.toggle('on', C.a.includes(+e.dataset.i)));
    if (ok) { say(bad ? 'Molt bé! L\'has caçada.' : 'Sí, estava ben feta!', 'go'); chime([523, 659, 784]); FX.celebrate(6); }
    else { say(bad ? 'Tenia una errada: mira què hi sobra (en vermell) i què hi falta (fa pampallugues).' : 'Sí que estava ben feta! Mira-la bé.', 'oops'); buzz(); }
    if (!await ready(t, k === cs.length - 1 ? 'Mira el resultat' : 'Segueix')) return;
  }
  const r = sheetIn(prog, run);
  prog = r.prog; save();
  stage.innerHTML = '';
  r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
  say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
  panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
    <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>${news(r.news)}
    <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre full</button>`);
  $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
}

/* ---------- the free game: the game of before, endless, with three lives and a record ---------- */
async function lliure() {
  const t = fresh(); show('Partida lliure', true, 165);
  let s = begin();
  $('#game').innerHTML = `<div class="hud"><span class="chip" id="lvl"></span><span class="lives" id="lives" role="img"></span><span class="chip" id="pts"></span></div>
    <p class="status big" id="status" role="status" aria-live="polite"></p><div class="stage" id="stage">${BOARD}</div>${TAIL}`;
  const statusEl = $('#status');
  const say = (txt, cls) => { statusEl.className = 'status big' + (cls ? ' ' + cls : ''); statusEl.textContent = txt; again(statusEl).add('pop'); };
  const hud = () => {
    $('#lvl').textContent = `Nivell ${s.lvl + 1} · ${GRIDS[s.lvl]}×${GRIDS[s.lvl]}`; $('#pts').textContent = `${s.score} punts`;
    const l = $('#lives'); l.setAttribute('aria-label', `Vides: ${s.lives} de ${LIVES}`);
    l.innerHTML = Array.from({ length: LIVES }, (_, i) => `<i${i < s.lives ? '' : ' class="gone"'}></i>`).join('');
  };
  hud(); FX.mood(165); tone(523, 0, 0.2);
  await build(GRIDS[0], t); if (!t.on) return;
  say('Mira quins llums s\'encenen i toca\'ls en el mateix ordre.');
  if (!await ready(t)) return;
  while (t.on) {
    const q = makeSeq(N * N, s.len), R = { want: q, ordered: true };
    reset(); $('#dots').innerHTML = '<i></i>'.repeat(s.len);
    live(false); say('Mira bé…');
    await sleep(900); if (!t.on) return;
    for (const i of q) { await flash(i); if (!t.on) return; await sleep(GAP); if (!t.on) return; }
    say('Ara tu!', 'go'); live(true);
    const r = await listen(R); if (!t.on) return;
    live(false);
    s = step(s, r.ok); hud();
    if (!r.ok) {
      const bad = tiles[r.got], good = tiles[r.want[0]];
      bad.classList.add('bad'); again($('#bwrap')).add('shake'); buzz();
      say('Ui! Aquest no. Era el que fa pampallugues.', 'oops');
      await sleep(450); if (!t.on) return;
      bad.classList.remove('bad'); good.classList.add('hint');
      await sleep(1700); if (!t.on) return;
      good.classList.remove('hint');
      if (s.over) return lliureEnd(s, t);
      continue;
    }
    await sleep(320); if (!t.on) return;
    wave();
    if (s.won) { say('Increïble!', 'go'); chime([523, 659, 784, 1047, 1319, 1568]); await sleep(1100); if (!t.on) return; return lliureEnd(s, t); }
    if (!s.up) { say(pick(BRAVO), 'go'); chime([659, 784, 1047]); await sleep(1100); continue; }
    // five lights done: same board, smaller tiles
    say('Nivell superat!', 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(); FX.mood([165, 205, 262, 318][s.lvl]);
    await sleep(1500); if (!t.on) return;
    const n = GRIDS[s.lvl];
    $('#stage').insertAdjacentHTML('beforeend', `<div class="banner"><b>Nivell ${s.lvl + 1}</b><span>${n} × ${n} · quadres més petits!</span></div>`);
    const ban = $('#stage').lastElementChild; setTimeout(() => ban.remove(), 1950);
    const c = mid($('#stage')); FX.ring(c.x, c.y, hueOf(0, n - 1, n), 30, c.w * 0.75, 1);
    await build(n, t); if (!t.on) return;
    await sleep(900);
  }
}
function lliureEnd(s, t) {
  const r = freeIn(prog, s.score);
  prog = r.prog; save(); $('#dots').innerHTML = ''; $('#status').textContent = '';
  if (s.won || r.record) FX.celebrate(s.won ? 16 : 7);
  panel($('#stage'), `<h2>${s.won ? 'Ho has aconseguit!' : 'S\'han acabat les vides'}</h2>
    <p class="lead">${s.won ? 'Has encès tots els llums de l\'estany, fins i tot els més petits.' : `Has arribat al nivell ${s.lvl + 1} (${GRIDS[s.lvl]}×${GRIDS[s.lvl]}), a les sèries de ${s.len} llums.`}</p>
    <p class="score">${s.score} punts</p><p class="rec">${r.record ? 'Nou rècord!' : `Rècord: ${prog.best} punts`}</p>${news(r.news)}
    <button class="btn" id="go">Torna-hi</button><button class="link" id="bk">Torna al mapa</button>`);
  $('#go').onclick = lliure; $('#bk').onclick = () => mapa();
  // while the panel is up, lights twinkle quietly behind it
  (async () => { while (t.on) { await sleep(rand(350, 800)); if (t.on && tiles.length) flash(Math.floor(Math.random() * tiles.length), 420, true); } })();
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
