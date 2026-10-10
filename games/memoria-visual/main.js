import { $, RM, sleep, rand, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { GRIDS, LIVES, makeSeq, begin, step, hueOf, pitchOf, PROJECTS, LEVELS, DX, DY, readMap, trace, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, RAPID,
  starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, BADGES, badges, levelIn, poolIn, streakIn, rapidIn,
  exam, examIn, sprint, sheet, sheetIn, wantQ, slotOf, turned } from './logic.js';

const KEY = 'memoria-visual';
const board = $('#board'), stage = $('#stage'), statusEl = $('#status'), dotsEl = $('#dots');

// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level of the rocket game, to try it out; without it a
// circle opens with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = OBERT;

// Facts only: { best, so, lv, piscina, exams, fulls, rapid, ratxa }. clean() makes a complete progress out of anything the browser
// holds, the save from before the cursus too (the levels done in five sections)
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of the rocket game: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}

// every new game or screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

// each tile has its own note
const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);
// the sky takes the colour of the level, or of the section
const mood = lvl => FX.mood([165, 205, 262, 318][lvl] ?? 165);

/* ---------- board ---------- */
let N = 3, tiles = [];
const tileAt = i => ({ r: Math.floor(i / N), c: i % N });
async function build(n, t) {
  if (tiles.length && !RM) { board.classList.add('out'); await sleep(520); if (!t.on) return; }
  N = n; board.classList.remove('out'); board.style.setProperty('--n', n);
  const mid = (n - 1) / 2;
  board.innerHTML = Array.from({ length: n * n }, (_, i) => {
    const r = Math.floor(i / n), c = i % n;
    return `<button class="tile enter" data-i="${i}" tabindex="-1" aria-label="Fila ${r + 1}, columna ${c + 1}" style="--h:${hueOf(r, c, n)};--d:${Math.round(Math.hypot(r - mid, c - mid) * 70)}"></button>`;
  }).join('');
  tiles = [...board.children];
  await sleep(RM ? 0 : 650);
  tiles.forEach(e => e.classList.remove('enter'));
}
function centre(i) { const r = tiles[i].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }
// light one tile: glow, sparks, a ring and its note
function flash(i, ms, quiet) {
  const e = tiles[i], { r, c } = tileAt(i), h = hueOf(r, c, N), p = centre(i);
  e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
  FX.burst(p.x, p.y, h, quiet ? 6 : 20, p.w * (quiet ? 1.2 : 2.4)); if (!quiet) { FX.ring(p.x, p.y, h, p.w * 0.45, p.w * 1.25); tone(pitchOf(r, c, N)); }
  return sleep(ms).then(() => { if (tiles[i] === e) e.classList.remove('on'); });
}
function wave() {
  tiles.forEach((e, i) => { const { r, c } = tileAt(i); e.style.setProperty('--d', (r + c) * 55); e.classList.add('wave'); });
  const mine = tiles;
  setTimeout(() => mine.forEach(e => e.classList.remove('wave')), 700 + N * 110);
}

/* ---------- screens ---------- */
function say(txt, cls) {
  statusEl.className = 'status' + (cls ? ' ' + cls : ''); statusEl.textContent = txt;
  void statusEl.offsetWidth; statusEl.classList.add('pop');
}
function hud(s) {
  $('#lvl').textContent = `Nivell ${s.lvl + 1} · ${GRIDS[s.lvl]}×${GRIDS[s.lvl]}`;
  $('#pts').textContent = `${s.score} punts`;
  const l = $('#lives'); l.setAttribute('aria-label', `Vides: ${s.lives} de ${LIVES}`);
  l.innerHTML = Array.from({ length: LIVES }, (_, i) => `<i${i < s.lives ? '' : ' class="gone"'}></i>`).join('');
}
// one game on screen at a time; the home menu sits over the memory board. The link to the page of all games
// only exists where this page is served under its own file name, next to the others.
const HUB = /memoria-visual\.html$/.test(location.pathname);
// wide is for a screen of the rocket game that is being played: more room, and no big title
function show(game, kicker, wide = false) {
  const coet = game === 'coet';
  $('#mem').hidden = coet; $('#coet').hidden = !coet; $('#xp').hidden = !coet; $('#app').classList.toggle('wide', wide);
  $('#toG').hidden = game !== 'menu' || !HUB; $('#toM').hidden = game === 'menu'; $('#kick').textContent = kicker;
  $('#coet').onclick = null; replace = null; keyFn = null;
  if (!coet) $('#coet').replaceChildren();
}
let back = () => menu();
$('#toM').onclick = () => back();
// while a panel is up, lights twinkle quietly behind it
async function twinkle(t) {
  while (t.on) { await sleep(rand(350, 800)); if (t.on && tiles.length) flash(Math.floor(Math.random() * tiles.length), 420, true); }
}
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

let pickFn = null;
board.onclick = e => { const b = e.target.closest('.tile'); if (b && pickFn) pickFn(+b.dataset.i); };
// resolves once the series is repeated in full, or at the first wrong tile
function listen(seq) {
  return new Promise(res => {
    let k = 0;
    pickFn = i => {
      if (i !== seq[k]) { pickFn = null; return res({ ok: false, got: i, want: seq[k] }); }
      flash(i, 260); dotsEl.children[k].classList.add('ok');
      if (++k === seq.length) { pickFn = null; res({ ok: true }); }
    };
  });
}
function live(on) { board.classList.toggle('live', on); tiles.forEach(e => e.tabIndex = on ? 0 : -1); }

const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quina memòria!', 'Així es fa!'];
const ON = 520, GAP = 190;

async function menu() {
  const t = fresh(); pickFn = null; show('menu', 'Tria un joc'); back = menu; $('#toM').textContent = '← Jocs';
  stage.querySelector('.panel')?.remove(); live(false);
  $('#hud').hidden = true; dotsEl.replaceChildren(); statusEl.textContent = ''; mood(0);
  await build(3, t); if (!t.on) return;
  panel(stage, `<button class="game" id="g1"><b>Repeteix els llums</b><span>Mira quins llums s'encenen i toca'ls en el mateix ordre. Quan arribis a 5, els quadres es fan més petits!</span>${prog.best ? `<span class="rec">Rècord: ${prog.best} punts</span>` : ''}</button>
    <button class="game" id="g2"><b>El coet</b><span>Escriu les ordres perquè el coet reculli totes les estrelles. Aprendràs a programar!</span><span class="rec">${validated(prog).length} de ${PROJECTS.length} projectes validats</span></button>`);
  $('#g1').onclick = play; $('#g2').onclick = entra;
  twinkle(t);
}

function end(s) {
  const t = fresh(); pickFn = null; live(false);
  const record = s.score > prog.best;
  if (record) { prog.best = s.score; save(); }
  dotsEl.replaceChildren(); statusEl.textContent = '';
  if (s.won || record) FX.celebrate(s.won ? 16 : 7);
  panel(stage, `<h2>${s.won ? 'Ho has aconseguit!' : 'S\'han acabat les vides'}</h2>
    <p class="lead">${s.won ? 'Has encès tots els llums de l\'estany, fins i tot els més petits.' : `Has arribat al nivell ${s.lvl + 1} (${GRIDS[s.lvl]}×${GRIDS[s.lvl]}), a les sèries de ${s.len} llums.`}</p>
    <p class="score">${s.score} punts</p><p class="rec">${record ? 'Nou rècord!' : `Rècord: ${prog.best} punts`}</p>
    <button class="btn" id="go">Torna-hi</button>`);
  $('#go').onclick = play;
  twinkle(t);
}

async function play() {
  const t = fresh(); let s = begin(); pickFn = null; show('mem', 'Joc 1 · Memòria visual');
  stage.querySelector('.panel')?.remove(); $('#hud').hidden = false; hud(s); mood(0);
  tone(523, 0, 0.2);
  if (N !== GRIDS[0] || !tiles.length) { await build(GRIDS[0], t); if (!t.on) return; }
  while (t.on) {
    const q = makeSeq(N * N, s.len);
    dotsEl.innerHTML = '<i></i>'.repeat(s.len);
    live(false); say('Mira bé…');
    await sleep(900); if (!t.on) return;
    for (const i of q) { await flash(i, ON); if (!t.on) return; await sleep(GAP); if (!t.on) return; }
    say('Ara tu!', 'go'); live(true);
    const r = await listen(q); if (!t.on) return;
    live(false);
    s = step(s, r.ok); hud(s);
    if (!r.ok) {
      const bad = tiles[r.got], good = tiles[r.want];
      bad.classList.add('bad'); board.classList.add('shake'); tone(150, 0, 0.45, 0.16, 'triangle');
      say('Ui! Aquest no. Era el que fa pampallugues.', 'oops');
      await sleep(450); if (!t.on) return;
      bad.classList.remove('bad'); board.classList.remove('shake'); good.classList.add('hint');
      await sleep(1700); if (!t.on) return;
      good.classList.remove('hint');
      if (s.over) return end(s);
      continue;
    }
    await sleep(320); if (!t.on) return;
    wave();
    if (s.won) { say('Increïble!', 'go'); chime([523, 659, 784, 1047, 1319, 1568]); await sleep(1100); if (!t.on) return; return end(s); }
    if (!s.up) { say(pick(BRAVO), 'go'); chime([659, 784, 1047]); await sleep(1100); if (!t.on) return; continue; }
    // five lights done: same board, smaller tiles
    say('Nivell superat!', 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(); mood(s.lvl);
    await sleep(1500); if (!t.on) return;
    dotsEl.replaceChildren();
    const n = GRIDS[s.lvl];
    stage.insertAdjacentHTML('beforeend', `<div class="banner"><b>Nivell ${s.lvl + 1}</b><span>${n} × ${n} · quadres més petits!</span></div>`);
    const ban = stage.lastElementChild; setTimeout(() => ban.remove(), 1950);
    const c = stage.getBoundingClientRect(); FX.ring(c.left + c.width / 2, c.top + c.height / 2, hueOf(0, n - 1, n), 30, c.width * 0.75, 1);
    await build(n, t); if (!t.on) return;
    await sleep(900); if (!t.on) return;
  }
}

/* ---------- game 2: the rocket follows the functions the child writes ---------- */
const OPS = { f: ['↑', 'Endavant'], L: ['↶', "Gira a l'esquerra"], R: ['↷', 'Gira a la dreta'], 1: ['F1', 'Crida F1'], 2: ['F2', 'Crida F2'], 3: ['F3', 'Crida F3'] };
const CNAME = { b: 'blau', g: 'verd', p: 'rosa' };
const ROCKET = `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="flame" d="M25 48 Q32 68 39 48Z" fill="#F7C64E"/><path d="M22 38 L11 52 L24 47Z M42 38 L53 52 L40 47Z" fill="#FF6B9A"/><path d="M32 3 C45 14 46 34 42 48 H22 C18 34 19 14 32 3Z" fill="#EAF8F4" stroke="#0A2A3A" stroke-width="2"/><circle cx="32" cy="24" r="6.5" fill="#6FE3FF" stroke="#0A2A3A" stroke-width="2"/></svg>`;
const STEP = 430, HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Bon programa!', 'Enlairament perfecte!'];
// set while the rocket game is up: puts the rocket back on its tile after a resize
let replace = null;
addEventListener('resize', () => replace && replace());

// one sky colour and one planet per project, and the colour of each circle
const HUES = [165, 205, 318, 28, 262, 190, 48, 350, 285], RING = [165, 318, 262, 48];
const BRAVOQ = ['Molt bé!', 'Perfecte!', 'Genial!', 'Així es fa!', 'Bon pilot!'];
const DIR = ['amunt', 'a la dreta', 'avall', "a l'esquerra"];
const FATE = { win: 'Agafa totes les estrelles', fall: "Cau a l'aigua", stuck: 'Ni cau ni les agafa totes' };
const FATES = { win: 'agafa totes les estrelles', fall: "cau a l'aigua", stuck: 'ni cau ni agafa totes les estrelles' };
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
const buzz = () => tone(150, 0, 0.45, 0.16, 'triangle');
// after a new question comes up, touches are ignored for this long: a second tap on the button that was there must not answer it
const SETTLE = 450;
// right answers in a row at the first try (a level at its first launch, a question at its first touch), and the longest run since the page opened
let streak = 0, top = 0;
const ding = () => { const f = 660 * 2 ** (Math.min(streak, 12) / 12); tone(f, 0, 0.14, 0.08); tone(f * 4 / 3, 0.09, 0.18, 0.07); };
function drawCombo() {
  const e = $('#cb'); if (!e) return;
  e.hidden = streak < 3; e.textContent = `Ratxa ×${streak}`;
  if (streak >= 3) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
}
// the end of a level or of a board comes up over its two halves
function curtain(html) {
  panel($('#split'), html);
  $('#split .panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
}
// the longest run goes in with whatever is being handed in: gives back the badges it earns
function run() { const r = streakIn(prog, top); prog = r.prog; return r.news; }
// the rocket crosses the whole screen from the bottom, leaving sparks behind
function liftoff() {
  if (RM) return;
  const e = document.createElement('div'); e.className = 'launch'; e.innerHTML = ROCKET; document.body.append(e);
  [0, 0.1, 0.2, 0.3, 0.4].forEach((d, i) => tone(98 * 2 ** (i / 2), d, 0.5, 0.06, 'sawtooth'));
  const t0 = performance.now(), iv = setInterval(() => {
    const r = e.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.bottom - 14, 32, 7, 80, 320);
    if (performance.now() - t0 > 1500) { clearInterval(iv); e.remove(); }
  }, 50);
}
// an order as it is written in a program, a whole program (hole is the [function, place] shown as «?», lit the one to light up) and
// the map of a level with the rocket on its first tile: what the quick questions and the sheets show
const ordName = t => { const s = slotOf(t); return `«${OPS[s.op][0]}» (${OPS[s.op][1].toLowerCase()}${s.c ? ', només al ' + CNAME[s.c] : ''})`; };
const ordHtml = (t, cls = '') => { const s = slotOf(t); return `<span class="slot full${s.c ? ' c' + s.c : ''}${cls}" role="img" aria-label="${OPS[s.op][1]}${s.c ? ', només al ' + CNAME[s.c] : ''}">${OPS[s.op][0]}</span>`; };
const listing = (code, hole, lit) => `<div class="listing">${code.map((fn, f) => `<div class="fn"><span class="fname">F${f + 1}</span><div class="slots">${fn.map((t, i) =>
  hole && hole[0] === f && hole[1] === i ? '<span class="slot next" role="img" aria-label="Casella que falta">?</span>' : ordHtml(t, lit && lit[0] === f && lit[1] === i ? ' run' : '')).join('')}</div></div>`).join('')}</div>`;
const refOf = lv => lv.ref.map(fn => fn.map(s => (s.c || '') + s.op));
function miniMap(lv) {
  const g = readMap(lv.map);
  return `<div class="mini" style="--w:${g.w};--n:${Math.max(g.w, g.h)}" role="img" aria-label="El mapa, amb el coet mirant ${DIR[lv.start[2]]}">${[...g.cells].map(([k, c]) => { const [x, y] = k.split(',').map(Number);
    return `<div class="cell c${c}${g.stars.has(k) ? ' star' : ''}" style="grid-column:${x + 1};grid-row:${y + 1}"></div>`; }).join('')}<div class="rocket" style="grid-column:${lv.start[0] + 1};grid-row:${lv.start[1] + 1};transform:rotate(${lv.start[2] * 90}deg)">${ROCKET}</div></div>`;
}
const pilot = d => `<span class="pilot" style="transform:rotate(${d * 90}deg)">${ROCKET}</span>`;
const turnsHtml = seq => `<div class="slots">${seq.map(o => ordHtml(o)).join('')}</div>`;

// the rocket game opens on the Piscina until it is done, and on the map ever after
function entra() { prog.piscina || OPEN ? mapa() : piscina(); }

/* ---------- the map: a band for each circle, a planet for each project and the exam of the circle at the end ---------- */
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 60% 60%)" stroke-width="2.4" opacity="${3 - i <= c ? 1 : 0.25}"/>`).join('')}<circle r="2" fill="hsl(${RING[c]} 80% 70%)"/></svg>`;
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c);
const starsOf = i => prog.lv.slice(i * 10, i * 10 + 10);
const noteText = i => { const n = noteOf(prog, i), d = starsOf(i).filter(Boolean).length; return n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer'; };
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
  fresh(); pickFn = null; show('coet', 'El coet · El mapa'); FX.mood(205); back = menu; $('#toM').textContent = '← Jocs';
  const band = c => `<section class="ring${openC(c) ? '' : ' shut'}" style="--rh:${RING[c]}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}" style="--h:${HUES[i]}"${openC(c) ? '' : ' disabled'}><i class="orb" aria-hidden="true"></i><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span>
        <span class="pp" aria-hidden="true">${starsOf(i).map(s => `<i class="s${s}"></i>`).join('')}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice(), any = OPEN || validated(prog).length > 0;
  $('#coet').innerHTML = `<div class="map">${tip ? `<p class="next">${tip}</p>` : ''}${CIRCLES.map((_, c) => band(c)).join('')}
    <div class="extra"><button class="btn soft" id="rapid">⚡ Repte llampec${prog.rapid ? ` · rècord ${prog.rapid}` : ''}</button>
      <button class="btn soft" id="full"${any ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>🔍 Caça l'errada</button>
      <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div></div>`;
  $('#coet').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level still to do; in a project with every level done, the first that still has something to win
      const i = +b.dataset.p, r = reached(prog, i), k = starsOf(i).findIndex(n => n < 3);
      coet(i, r < 10 ? r : Math.max(k, 0));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
    else if (e.target.closest('#rapid')) llampec();
  };
  ($(`#coet [data-p="${here}"]:not(:disabled)`) || $('#coet button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

/* ---------- one level: the child writes the functions and the rocket follows them ---------- */
function coet(sec, idx) {
  const t = fresh(); pickFn = null; show('coet', `Cercle ${circleOf(sec)} · ${PROJECTS[sec].name}`, true); FX.mood(HUES[sec]); back = mapa; $('#toM').textContent = '← Mapa'; here = sec;
  const root = $('#coet'), lv = LEVELS[sec * 10 + idx], g = readMap(lv.map), size = Math.max(g.w, g.h), ox = Math.floor((size - g.w) / 2);
  const code = lv.slots.map(k => Array(k).fill(null));
  // the reference route, tile by tile, with the stars picked up by then: a hint lights up what comes next
  const route = [{ x: lv.start[0], y: lv.start[1], got: 0 }];
  for (const st of trace(lv, lv.ref).steps) if (!st.skip && lv.ref[st.f][st.i].op === 'f') route.push({ x: st.x, y: st.y, got: route[route.length - 1].got + (st.star ? 1 : 0) });
  let sel = [0, 0], brush = '', job = null, ang = 0, at = [0, 0], got = 0, geo = { x: 0, y: 0, pitch: 0 };
  // hint state: how many were asked, the slot being pointed at, the order given away after asking three times at the same spot
  let asks = 0, slow = false, mark = null, reveal = null, stuck = ['', 0];
  // launches that did not get every star, plus hints asked: they set what the level is worth
  let slips = 0;
  const worth = () => { $('#cpts').textContent = `${POINTS[starsFor(slips)]} punts`; };
  root.innerHTML = `<div class="hud"><span class="chip">Nivell ${idx + 1} · ${lv.name}</span><span class="chip sun" id="cpts"></span><span class="chip" id="cstars"></span></div>
    ${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <p class="status tip" id="ctip" role="status" aria-live="polite"></p>
    <div class="split" id="split"><div class="stage" id="cstage"><div class="board" id="cboard" style="--n:${size};--gh:${g.h}"></div></div>
    <div class="prog" id="prog"><div id="fns"></div>
      <div><p class="label">Ordres</p><div class="pal" id="pal">${[...lv.cmds].map(op => `<button class="cmd" data-op="${op}" aria-label="${OPS[op][1]}">${OPS[op][0]}</button>`).join('')}<button class="cmd" data-op="x" aria-label="Buida la casella">✕</button></div></div>
      ${lv.conds ? `<div><p class="label">Fes-la només si el coet és damunt de…</p><div class="brush">${['', ...lv.conds].map(c => `<button data-c="${c}" class="${c ? 'c' + c : ''}"><i></i>${c ? CNAME[c] : 'sempre'}</button>`).join('')}</div></div>` : ''}
      <div class="row"><button class="btn" id="runb">▶ Engega</button><button class="btn soft" id="clr">Esborra</button><button class="btn soft" id="hintb">Pista</button></div>
      <p class="stackline" id="stk"></p></div></div>`;
  const cb = $('#cboard'), runb = $('#runb');
  wireLevels(root, i => coet(sec, i));
  const tip = (txt, cls) => { const e = $('#ctip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  // on a phone the program can push the tip and the board off screen: bring them back when something is about to happen there
  function look() {
    const a = $('#ctip').getBoundingClientRect(), b = cb.getBoundingClientRect(), bar = runb.parentElement, under = getComputedStyle(bar).position === 'sticky' ? bar.offsetHeight : 0;
    if (a.top < 0 || b.bottom > innerHeight - under) $('#ctip').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  const rk = () => cb.querySelector('.rocket');
  function put(x, y, extra = '') { at = [x, y]; rk().style.transform = `translate(${geo.x + x * geo.pitch}px, ${geo.y + y * geo.pitch}px) rotate(${ang}deg)${extra}`; }
  function measure() {
    const cs = getComputedStyle(cb), pad = parseFloat(cs.paddingLeft), gap = parseFloat(cs.columnGap), pitch = (cb.clientWidth - 2 * pad + gap) / size;
    cb.style.setProperty('--cs', pitch - gap + 'px');
    // the stylesheet centres the rows: read where the map landed from one of its tiles
    const c = cb.querySelector('.cell'), [x, y] = c.dataset.k.split(',').map(Number);
    geo = { x: c.offsetLeft - x * pitch, y: c.offsetTop - y * pitch, pitch };
  }
  const still = fn => { rk().style.transition = 'none'; fn(); void rk().offsetWidth; rk().style.transition = ''; };
  const count = k => { got = k; $('#cstars').textContent = `★ ${k} de ${g.stars.size}`; };
  // the board as the level starts: every star back, no hint lights, the rocket on its first tile
  function setup() {
    cb.innerHTML = [...g.cells].map(([k, c]) => { const [x, y] = k.split(',').map(Number); return `<div class="cell c${c}${g.stars.has(k) ? ' star' : ''}" data-k="${k}" style="grid-column:${x + ox + 1};grid-row:${y + 1}"></div>`; }).join('') + `<div class="rocket">${ROCKET}</div>`;
    measure(); ang = lv.start[2] * 90; still(() => put(lv.start[0], lv.start[1])); count(0); $('#stk').textContent = '';
  }
  replace = () => { measure(); still(() => put(at[0], at[1])); };
  function drawCode() {
    $('#fns').innerHTML = code.map((fn, f) => `<div class="fn"><span class="fname">F${f + 1}</span><div class="slots">${fn.map((s, i) =>
      `<button class="slot${s ? ' full' : ''}${s && s.c ? ' c' + s.c : ''}${sel[0] === f && sel[1] === i ? ' sel' : ''}${mark && mark.f === f && mark.i === i ? ' ' + mark.kind : ''}" data-f="${f}" data-i="${i}" aria-label="F${f + 1}, casella ${i + 1}: ${s ? OPS[s.op][1] + (s.c ? ', només al ' + CNAME[s.c] : '') : 'buida'}">${s ? OPS[s.op][0] : ''}</button>`).join('')}</div></div>`).join('');
    root.querySelectorAll('.cmd').forEach(b => { b.className = 'cmd' + (brush && b.dataset.op !== 'x' ? ' c' + brush : '') + (reveal && reveal.op === b.dataset.op ? ' glow' : ''); });
    root.querySelectorAll('.brush button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.c === brush); b.classList.toggle('glow', !!reveal && (reveal.c || '') === b.dataset.c); });
  }
  function stop() { if (job) job.on = false; job = null; runb.textContent = '▶ Engega'; setup(); drawCode(); }
  const launch = () => { const me = job = { on: true }; runb.textContent = '■ Atura'; return me; };
  function sink() {
    const p = mid(rk()); FX.burst(p.x, p.y, 200, 24, 150); FX.ring(p.x, p.y, 200, 6, p.w);
    put(at[0], at[1], ' scale(0.1)'); rk().style.opacity = 0; tone(150, 0, 0.45, 0.16, 'triangle');
  }

  // plays the steps of a trace on the board; false if the run was stopped on the way
  async function fly(steps, me, pace) {
    let k = 0;
    for (const st of steps) {
      const el = root.querySelector(`.slot[data-f="${st.f}"][data-i="${st.i}"]`), op = code[st.f][st.i].op;
      el.classList.add(st.skip ? 'skip' : 'run');
      if (!st.skip) {
        $('#stk').innerHTML = 'Funcions en marxa: ' + st.stack.slice(0, 9).map(f => `<b>F${f + 1}</b>`).join('▸') + (st.stack.length > 9 ? '…' : '');
        if (op === 'f') { const p = mid(rk()); FX.burst(p.x, p.y, 38, 8, 70, 0); put(st.x, st.y); tone(330, 0, 0.12, 0.06); }
        else if (st.turn) { ang += 90 * st.turn; put(st.x, st.y); tone(440, 0, 0.1, 0.05); }
        else tone(660, 0, 0.12, 0.06);
      }
      // a program that is still going after 60 steps is probably looping: hurry it along
      await sleep(++k > 60 ? 150 : st.skip ? Math.min(240, pace) : pace); if (!me.on || !t.on) return false;
      if (st.star) {
        const c = cb.querySelector(`[data-k="${st.star}"]`), p = mid(c);
        c.classList.remove('star'); count(got + 1); FX.burst(p.x, p.y, 48, 26, 190); FX.ring(p.x, p.y, 48, 8, p.w * 1.2); tone(1047, 0, 0.3, 0.1);
      }
      el.classList.remove('run', 'skip');
    }
    return true;
  }

  async function go() {
    const r = trace(lv, code, 150);
    if (!r.steps.length) return tip('Posa alguna ordre a F1 i torna a prémer Engega.', 'oops');
    mark = reveal = null; setup(); drawCode(); root.querySelector('.slot.sel')?.classList.remove('sel');
    const me = launch(), alive = () => me.on && t.on;
    tip(lv.tip); look(); tone(523, 0, 0.15);
    // after asking for a hint the rocket flies slower, so each order can be followed
    if (!await fly(r.steps, me, slow ? 700 : STEP)) return;
    if (r.end === 'win') {
      runb.disabled = true; ang += 360; put(at[0], at[1]);
      // the level is handed in as the last star is picked up: its stars go to the mark of the project, and the mark to the XP once the project is validated
      streak = slips ? 0 : streak + 1; top = Math.max(top, streak);
      const got = run(), w = levelIn(prog, sec, idx, slips), n = w.n, end = idx === 9;
      prog = w.prog; save(); w.news = [...got, ...w.news];
      chime([523, 659, 784, 1047, 1319]); liftoff(); FX.celebrate(end || w.valid ? 16 : 8);
      await sleep(1100); if (!alive()) return;
      curtain(`<h2>${w.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
        <p class="won" role="img" aria-label="${n} de 3 estrelles">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}" style="--i:${i}">★</i>`).join('')}</p>
        <p class="lead${w.valid ? ' go' : ''}">Nota del projecte: ${w.note} de 100${w.valid ? ' · validat ✓' : ''}${w.gain ? ` · +${w.gain} XP` : ''}</p>
        ${w.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${circleOf(sec)}.</p>` : ''}${news(w.news)}
        ${w.exam || w.news.length ? '' : `<p class="lead">${n === 3 ? 'A la primera i sense pistes: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. A la primera i sense pistes en dona 10.`}</p>`}
        <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
      $('#nx').onclick = () => end ? mapa() : coet(sec, idx + 1);
      if (n < 3) $('#ag').onclick = () => coet(sec, idx);
      return;
    }
    slips++; streak = 0; worth();
    if (r.end === 'fall') sink(); else buzz();
    tip({ fall: "Xof! El coet ha caigut a l'aigua. Canvia les ordres i torna-hi.", end: "S'han acabat les ordres i encara queden estrelles.", fuel: "El coet s'ha quedat sense combustible: fa voltes sense arribar enlloc." }[r.end] + ' Si no saps com seguir, prem Pista.', 'oops');
    await sleep(1500); if (!alive()) return;
    stop();
  }

  // shortest way over the tiles from the rocket to a star still on the board, for a rocket that left the reference route
  function wayToStar() {
    const seen = new Map([[at.join(','), null]]), queue = [at.join(',')];
    while (queue.length) {
      const k = queue.shift(), [x, y] = k.split(',').map(Number);
      if (k !== at.join(',') && cb.querySelector(`[data-k="${k}"]`).classList.contains('star')) { const out = []; for (let c = k; seen.get(c) !== null; c = seen.get(c)) out.unshift(c); return out; }
      for (let d = 0; d < 4; d++) { const n = (x + DX[d]) + ',' + (y + DY[d]); if (g.cells.has(n) && !seen.has(n)) { seen.set(n, k); queue.push(n); } }
    }
    return [];
  }
  // A hint replays, slowly, what is written so far and leaves the rocket where the program leaves it. Then lights run along
  // the tiles to visit next, and the first slot that is empty or differs from the reference program is marked.
  async function coach() {
    slow = true;
    const hint = lv.hints[asks++ % lv.hints.length], r = trace(lv, code, 150);
    if (r.end === 'win') return tip('Aquest programa ja funciona! Prem Engega i mira com vola.', 'go');
    slips++; streak = 0; worth();
    let tgt = [0, 0];
    lv.ref.some((fn, f) => fn.some((b, i) => { const a = code[f][i]; return (!a || a.op !== b.op || (a.c || null) !== b.c) && (tgt = [f, i]); }));
    const filled = !!code[tgt[0]][tgt[1]], key = tgt + '|' + filled, steps = r.steps.slice(0, 40), fell = r.end === 'fall';
    stuck = [key, stuck[0] === key ? stuck[1] + 1 : 1];
    mark = reveal = null; setup(); drawCode(); root.querySelector('.slot.sel')?.classList.remove('sel');
    if (steps.length) {
      const me = launch(); tip('Mirem què fa el teu programa…'); look();
      if (!await fly(steps, me, 700)) return;
      if (fell) {
        // show the splash, then put the rocket back on the last tile it stood on
        const prev = steps[steps.length - 2];
        sink(); await sleep(900); if (!me.on || !t.on) return;
        rk().style.opacity = ''; put(prev ? prev.x : lv.start[0], prev ? prev.y : lv.start[1]);
      }
      job = null; runb.textContent = '▶ Engega';
    }
    const j = route.findIndex(c => c.x === at[0] && c.y === at[1] && c.got === got);
    let next = j < 0 ? wayToStar() : route.slice(j + 1).map(c => c.x + ',' + c.y);
    if (j >= 0) { const star = route.slice(j + 1).findIndex(c => c.got > got); next = next.slice(0, star < 0 ? next.length : star + 1); }
    next.slice(0, 8).forEach((k, n) => { const c = cb.querySelector(`[data-k="${k}"]`); c.classList.add('trail'); c.style.setProperty('--d', n * 220); });
    mark = { f: tgt[0], i: tgt[1], kind: filled ? 'think' : 'next' }; sel = tgt;
    if (stuck[1] >= 3) reveal = lv.ref[tgt[0]][tgt[1]];
    drawCode(); look();
    tip((fell ? 'Xof! Aquí el coet cau. ' : r.end === 'fuel' ? 'El coet fa voltes sense arribar enlloc. ' : steps.length ? 'Fins aquí arriba el teu programa. ' : '')
      + (reveal ? "L'ordre que brilla a baix és la que va a la casella marcada. " : filled ? 'Repassa la casella marcada amb «?» i segueix el camí de llums. ' : 'Segueix el camí de llums i continua a la casella que brilla. ') + hint);
  }

  $('#prog').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b === runb) return job ? stop() : go();
    if (job) return;
    if (b.id === 'hintb') return coach();
    if (b.classList.contains('slot')) sel = [+b.dataset.f, +b.dataset.i];
    else if ('c' in b.dataset) brush = b.dataset.c;
    else if (b.dataset.op === 'x') code[sel[0]][sel[1]] = null;
    else if (b.dataset.op) {
      code[sel[0]][sel[1]] = { op: b.dataset.op, c: brush || null }; brush = ''; tone(784, 0, 0.08, 0.05);
      if (sel[1] + 1 < code[sel[0]].length) sel = [sel[0], sel[1] + 1];
    }
    else if (b.id === 'clr') { code.forEach(fn => fn.fill(null)); sel = [0, 0]; }
    // any change to the program clears the hint marks; the lights on the board stay until the next flight
    if (!('c' in b.dataset)) mark = reveal = null;
    drawCode();
  };
  tip(lv.tip); setup(); drawCode(); worth();
}

/* ---------- the board: a run of quick questions, one at a time. The Piscina, an exam and a lightning round all play on it ---------- */
const askQ = q => q.kind === 'turn' ? 'Cap on mirarà el coet?' : q.kind === 'hole' ? 'Quina ordre hi falta?' : 'Què farà el coet?';
const tipQ = q => q.kind === 'turn' ? "El coet fa els girs sense moure's de casella: ↶ és la seva esquerra i ↷ la seva dreta."
  : q.kind === 'hole' ? "El coet fa les ordres d'una en una, i ↑ vol dir endavant. Quina ordre va a la casella «?» perquè agafi totes les estrelles?"
  : 'Fes de coet: segueix el programa ordre per ordre, amb el dit damunt del mapa.';
// what to look at, without the answer
const hintQ = q => q.kind === 'turn' ? "Posa't al lloc del coet, mirant cap on mira ell, i fes els girs d'un en un."
  : q.kind === 'hole' ? LEVELS[q.lv].hints[0] : "Segueix cada ordre amb el dit. Una ordre de color només es fa quan el coet és damunt d'aquell color.";
// the whole answer
const explainQ = q => { const w = wantQ(q); return q.kind === 'turn' ? `Acaba mirant ${DIR[w]}.` : q.kind === 'hole' ? `Hi anava ${ordName(w)}.`
  : `El coet ${FATES[w]}.${q.f === undefined ? '' : ` Mira l'ordre que brilla: n'hi hauria d'anar una altra.`}`; };
// the arrows of a real keyboard answer a question about turns
let keyFn = null;
addEventListener('keydown', e => { const d = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(e.key); if (keyFn && d >= 0 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); keyFn(String(d)); } });
// o is { t, qs, how, secs, chip(st), onLast(st), onEnd(st) }. how 'pool' lets the child try again, with what went wrong said;
// 'exam' and 'rapid' give one try. st is { slips, hits, marks, missed }: marks is 'ok' or 'bad' per question. onLast is called the moment
// the last question is decided, so what was won is saved before any wait; onEnd when the board is over (with secs, when the time is).
function quiz(o) {
  const { t, qs, how } = o, once = how !== 'pool', st = { slips: 0, hits: 0, marks: [], missed: [] };
  let k = 0, q, help = 0, busy = false, over = false, openAt = 0, lab = false;
  $("#qboard").innerHTML = `${o.secs ? '<div class="fuse" role="img" aria-label="El temps que queda"><i id="fuse"></i></div>' : ''}
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <div class="qz" id="split"><div class="field" id="field"></div><p class="ask" id="ask"></p><div class="ctl" id="ctl"></div><span class="combo" id="cb" hidden></span></div>`;
  const ctl = $('#ctl');
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };
  // the figure of the question; lab shows the answer on it
  function drawField() {
    const lv = LEVELS[q.lv], at = [q.f, q.i];
    $('#field').innerHTML = q.kind === 'turn' ? `<div class="turnq">${pilot(lab ? +wantQ(q) : q.d)}${turnsHtml(q.seq)}</div>`
      : miniMap(lv) + (q.kind === 'hole' ? listing(refOf(lv), lab ? null : at, lab ? at : null) : listing(q.code, null, lab && q.f !== undefined ? at : null));
  }
  function drawCtl() {
    ctl.innerHTML = q.kind === 'turn' ? `<div class="choices dirs">${[0, 3, 1, 2].map(d => `<button class="key" data-pick="${d}">${pilot(d)}<span>${DIR[d]}</span></button>`).join('')}</div>`
      : q.kind === 'hole' ? `<div class="choices">${q.opts.map(v => { const s = slotOf(v); return `<button class="cmd${s.c ? ' c' + s.c : ''}" data-pick="${v}" aria-label="${OPS[s.op][1]}${s.c ? ', només al ' + CNAME[s.c] : ''}">${OPS[s.op][0]}</button>`; }).join('')}</div>`
      : `<div class="choices col">${Object.keys(FATE).map(v => `<button class="btn soft" data-pick="${v}">${FATE[v]}</button>`).join('')}</div>`;
  }
  // gets the next question ready
  function arm() {
    q = qs[k]; help = 0; busy = false; lab = false; openAt = k && how !== 'rapid' ? performance.now() + SETTLE : 0;
    drawField(); $('#ask').textContent = askQ(q); drawCtl(); tip(how === 'rapid' ? '' : tipQ(q)); o.chip?.(st);
    if ($('#tip').getBoundingClientRect().top < 0) $('#tip').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  async function submit(ans) {
    if (busy || over || !t.on || performance.now() < openAt) return;
    const ok = ans === wantQ(q), last = k === qs.length - 1;
    if (!ok && !once) {   // try again, with what went wrong said
      buzz(); shake($('#ask')); st.slips++; help++; streak = 0; drawCombo(); o.chip?.(st);
      tip('Ui! ' + (help > 1 ? explainQ(q) : hintQ(q)), 'oops');
      return;
    }
    busy = true; st.marks[k] = ok ? 'ok' : 'bad';
    if (ok) { st.hits++; streak = help ? 0 : streak + 1; top = Math.max(top, streak); } else { st.missed.push(q); streak = 0; }
    if (last) o.onLast?.(st);
    drawCombo(); o.chip?.(st); lab = true; drawField();
    if (!ok) {   // one try only: show the right answer, and in an exam wait for the child to go on
      buzz(); shake($('#ask')); tip('No. ' + explainQ(q), 'oops');
      if (how === 'rapid') { await sleep(1400); if (t.on && !over) next(); return; }
      ctl.innerHTML = '<button class="btn" id="go">Segueix</button>'; $('#go').focus({ preventScroll: true });
      return;
    }
    ding(); if (how !== 'rapid') tip(streak && streak % 5 === 0 ? `${streak} seguides! ${pick(BRAVOQ)}` : pick(BRAVOQ), 'go');
    { const p = mid($('#ask')); FX.burst(p.x, p.y, 48, 18 + 3 * Math.min(streak, 8), 170); if (streak && streak % 5 === 0) FX.celebrate(3); }
    await sleep(how === 'rapid' ? 350 : 1100); if (t.on && !over) next();
  }
  async function next() {
    k++;
    if (k < qs.length) return arm();
    // the panel comes up where the last button was: wait until a second tap on that button has passed
    over = true; keyFn = null; ctl.innerHTML = ''; await sleep(SETTLE); if (t.on) o.onEnd(st);
  }
  keyFn = d => { if (t.on && !over && !busy && q.kind === 'turn') submit(d); };
  ctl.onclick = e => {
    if (e.target.closest('#go')) return next();
    const b = e.target.closest('[data-pick]'); if (b) submit(b.dataset.pick);
  };
  // the fuse of a lightning round: when it burns out the board is over, whatever was going on
  if (o.secs) {
    const t0 = performance.now(), iv = setInterval(() => {
      const left = o.secs - (performance.now() - t0) / 1000;
      if (!t.on || over) return clearInterval(iv);
      $('#fuse').style.width = Math.max(0, left / o.secs * 100) + '%';
      if (left <= 0) { clearInterval(iv); over = true; keyFn = null; ctl.innerHTML = ''; o.onEnd(st); }
    }, 100);
  }
  drawCombo(); arm();
}
// a screen of the rocket game that is not a level: the way back is the map
function scene(kicker, hue) { const t = fresh(); pickFn = null; show('coet', kicker, true); FX.mood(hue); back = mapa; $('#toM').textContent = '← Mapa'; return t; }

/* ---------- the Piscina: three first questions, the first thing a profile with nothing saved meets ---------- */
// The third one saves piscina and opens the map. The way back is the menu of the two games: the map would have every circle shut.
function piscina() {
  const t = scene('El coet · La Piscina', 205); back = menu; $('#toM').textContent = '← Jocs';
  let got = [];
  $('#coet').innerHTML = '<div class="hud mid"><span class="chip">Tres reptes per fer-te pilot</span></div><div id="qboard"></div>';
  quiz({ t, qs: POOL, how: 'pool',
    onLast: () => { const r = poolIn(prog); prog = r.prog; got = r.news; save(); },
    onEnd: () => {
      chime([523, 659, 784, 1047, 1319]); liftoff(); FX.celebrate(16);
      curtain(`<h2>Piscina acabada!</h2><p class="lead go">+50 XP · ja ets dins del cursus de programar</p>${news(got)}
        <p class="lead">Al mapa hi ha quatre cercles de planetes. Valida els projectes d'un cercle i supera'n l'examen per obrir el següent.</p><button class="btn" id="nx">Obre el mapa</button>`);
      $('#nx').onclick = () => mapa();
    } });
}

/* ---------- the exam of a circle: six new questions about its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = scene(`Examen del cercle ${c}`, RING[c]), qs = exam(c, Math.random);
  let r;
  $('#coet').innerHTML = '<div class="hud"><span class="chip">Sis preguntes · un sol intent</span><span class="chip sun" id="st"></span></div><div id="qboard"></div>';
  quiz({ t, qs, how: 'exam', chip: st => { $('#st').textContent = `${st.hits} de ${qs.length}`; },
    onLast: st => { const got = run(), first = !prog.exams[c]; r = examIn(prog, c, qs, qs.map((_, i) => st.marks[i] === 'ok')); r.news = [...got, ...r.news]; r.first = r.good && first; prog = r.prog; save(); },
    onEnd: () => {
      r.good ? (chime([523, 659, 784, 1047, 1319]), liftoff(), FX.celebrate(16)) : tone(196, 0, 0.5, 0.12, 'triangle');
      curtain(`<h2>${r.good ? 'Examen superat!' : 'Encara no!'}</h2><p class="score">${r.score} de ${qs.length}</p>
        <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
        ${r.first ? `<p class="lead go">${c < CIRCLES.length - 1 ? `S'ha obert el cercle ${c + 1}: ${CIRCLES[c + 1].name}.` : 'Has acabat el cursus de programar!'}</p>` : ''}
        ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
        <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
      $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
    } });
}

/* ---------- the lightning round: as many turns as fit in a minute, one try each; only the record is kept ---------- */
function llampec() {
  const t = scene('Repte llampec', 48);
  $('#coet').innerHTML = `<div class="intro"><h2>⚡ Repte llampec</h2><p class="lead">${RAPID} segons de girs, un sol intent per a cada un. Mira cap on mira el coet, fes els girs de cap i toca cap on acabarà mirant. Quants n'encertaràs?</p>
    ${prog.rapid ? `<p class="lead sun">El teu rècord: ${prog.rapid}</p>` : ''}<button class="btn" id="go">Comença!</button></div>`;
  $('#go').focus({ preventScroll: true });
  $('#go').onclick = () => {
    if (!t.on) return;
    $('#coet').innerHTML = '<div class="hud"><span class="chip">Repte llampec</span><span class="chip sun" id="st"></span></div><div id="qboard"></div>';
    quiz({ t, qs: sprint(Math.random), how: 'rapid', secs: RAPID, chip: st => { $('#st').textContent = `${st.hits} ${st.hits === 1 ? 'encert' : 'encerts'}`; },
      onEnd: st => {
        const got = run(), r = rapidIn(prog, st.hits); prog = r.prog; save();
        chime([523, 659, 784, 1047, 1319]); if (r.best) FX.celebrate(16);
        curtain(`<h2>Temps!</h2><p class="score">${st.hits} ${st.hits === 1 ? 'encert' : 'encerts'}</p><p class="lead${r.best ? ' go' : ''}">${r.best ? 'Rècord nou!' : `El teu rècord: ${prog.rapid}`}</p>${news([...got, ...r.news])}
          <button class="btn" id="rp">Torna-hi</button><button class="link" id="bk">Torna al mapa</button>`);
        $('#bk').onclick = () => mapa(); $('#rp').onclick = () => llampec();
      } });
  };
}

/* ---------- «Caça l'errada»: three things a sheet says, one after the other; from none to two of them are wrong ---------- */
const starsText = v => v === '0' ? 'cap estrella' : v === '1' ? '1 estrella' : `${v} estrelles`;
// What each kind of claim draws, what it says, how one of its values is written and what was true
const CLAIMS = {
  face: C => ({ pic: `<div class="turnq">${pilot(C.d)}${turnsHtml(C.seq)}</div>`, txt: `El coet fa aquests girs i acaba <b>mirant ${DIR[C.says]}</b>`, val: v => `Mirant ${DIR[v]}`, truth: `acaba mirant ${DIR[C.real]}` }),
  slot: C => ({ pic: miniMap(LEVELS[C.lv]) + listing(refOf(LEVELS[C.lv]), [C.f, C.i]), txt: `Perquè agafi totes les estrelles, a la casella «?» hi va <b>${ordHtml(C.says)}</b>`, val: v => ordHtml(v), truth: `hi va ${ordName(C.real)}` }),
  fate: C => ({ pic: miniMap(LEVELS[C.lv]) + listing(C.code), txt: `Amb aquest programa, el coet <b>${FATES[C.says]}</b>`, val: v => FATE[v], truth: `el coet ${FATES[C.real]}` }),
  stars: C => ({ pic: miniMap(LEVELS[C.lv]) + listing(C.code), txt: `Amb aquest programa, el coet agafa <b>${starsText(C.says)}</b>`, val: v => starsText(v), truth: `n'agafa ${C.real === '0' ? 'cap' : C.real}` })
};
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the value that makes it true,
// with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = scene("Caça l'errada", 40);
  const cs = sheet(Math.random, OPEN ? PROJECTS.map((_, i) => i) : validated(prog)), marks = [];
  $('#coet').innerHTML = `<div class="hud mid"><span class="steps" id="fdots" role="img" aria-label="Tres fulls">${'<i></i>'.repeat(cs.length)}</span></div>
    <div class="coach" id="coach">${pilot(0.2)}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div>
    <div class="desk" id="desk"></div><div class="tail" id="tail"></div>`;
  const desk = $('#desk'), tail = $('#tail'), dots = [...$("#fdots").children];
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').textContent = txt; const c = $('#coach'); c.className = 'coach'; void c.offsetWidth; c.className = 'coach ' + cls; };
  let k = -1, C, D, busy, openAt = 0, res = null;
  function arm() {
    k++; C = cs[k]; D = CLAIMS[C.kind](C); busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    desk.innerHTML = `<div class="paper">${D.pic}<p class="claim">${D.txt}</p></div>`;
    tail.innerHTML = '<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>';
    say('Mira-ho bé: és veritat, el que diu el full?');
  }
  async function answer(ok, txt) {
    const last = k === cs.length - 1;
    busy = true; marks[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, marks); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(txt, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { say(txt, 'oops'); buzz(); }
    await sleep(ok ? 1200 : 2800); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`el ${i + 1} (${CLAIMS[c.kind](c).truth})`] : []);
    desk.innerHTML = tail.innerHTML = '';
    r.good ? chime([523, 659, 784, 1047, 1319]) : tone(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
    panel(desk, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar els tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Tots tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre full</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era: ${D.truth}.` : 'Sí, era correcte!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: ${D.truth}.`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="opts">${C.opts.map(v => `<button class="btn soft" data-v="${v}">${D.val(v)}</button>`).join('')}</div>`;
      say('Ben vist! Ara tria el valor bo.', 'go');
    }
    else if ('v' in b.dataset) { const ok = b.dataset.v === C.real; answer(ok, ok ? `Arreglat: ${D.truth}.` : `No era aquest: ${D.truth}.`); }
  };
  arm();
}

soBtn(); paintXp();
// the page of all games links straight to the rocket game
location.hash === '#coet' ? entra() : menu();
