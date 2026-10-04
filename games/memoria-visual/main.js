import { $, RM, sleep, rand, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, sectionMenu, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { GRIDS, LIVES, makeSeq, begin, step, hueOf, noteOf, SECTIONS, LEVELS, DX, DY, readMap, trace } from './logic.js';

const KEY = 'memoria-visual';
const board = $('#board'), stage = $('#stage'), statusEl = $('#status'), dotsEl = $('#dots');

// secs counts the levels done in each section of the rocket game
let prog = { best: 0, so: true, secs: SECTIONS.map(() => 0) };
{
  const d = load(KEY);
  // an older save counted 20 levels in a row: each section whose old levels were all done opens complete
  if (d) prog = { best: Math.max(0, d.best | 0), so: d.so !== false, secs: Array.isArray(d.secs) && d.secs.length === SECTIONS.length
    ? d.secs.map(n => Math.min(10, Math.max(0, n | 0))) : [2, 4, 9, 18, 20].map(c => (d.coet | 0) >= c ? 10 : 0) };
}
const save = () => store(KEY, prog);

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
  FX.burst(p.x, p.y, h, quiet ? 6 : 20, p.w * (quiet ? 1.2 : 2.4)); if (!quiet) { FX.ring(p.x, p.y, h, p.w * 0.45, p.w * 1.25); tone(noteOf(r, c, N)); }
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
function show(game, kicker) {
  $('#mem').hidden = game === 'coet'; $('#coet').hidden = game !== 'coet'; $('#app').classList.toggle('wide', game === 'coet');
  $('#toG').hidden = game !== 'menu' || !HUB; $('#toM').hidden = game === 'menu'; $('#kick').textContent = kicker;
  if (game !== 'coet') { $('#coet').replaceChildren(); replace = null; }
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
    <button class="game" id="g2"><b>El coet</b><span>Escriu les ordres perquè el coet reculli totes les estrelles. Aprendràs a programar!</span><span class="rec">${prog.secs.reduce((a, b) => a + b, 0)} de ${LEVELS.length} nivells superats</span></button>`);
  $('#g1').onclick = play; $('#g2').onclick = seccions;
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
const OPS = { f: ['↑', 'Endavant'], L: ['↶', "Gira a l'esquerra"], R: ['↷', 'Gira a la dreta'], 1: ['F1', 'Crida F1'], 2: ['F2', 'Crida F2'] };
const CNAME = { b: 'blau', g: 'verd', p: 'rosa' };
const ROCKET = `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="flame" d="M25 48 Q32 68 39 48Z" fill="#F7C64E"/><path d="M22 38 L11 52 L24 47Z M42 38 L53 52 L40 47Z" fill="#FF6B9A"/><path d="M32 3 C45 14 46 34 42 48 H22 C18 34 19 14 32 3Z" fill="#EAF8F4" stroke="#0A2A3A" stroke-width="2"/><circle cx="32" cy="24" r="6.5" fill="#6FE3FF" stroke="#0A2A3A" stroke-width="2"/></svg>`;
const STEP = 430, HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Bon programa!', 'Enlairament perfecte!'];
// set while the rocket game is up: puts the rocket back on its tile after a resize
let replace = null;
addEventListener('resize', () => replace && replace());

function seccions() {
  fresh(); pickFn = null; show('coet', 'Joc 2 · Programació'); mood(0); back = menu; $('#toM').textContent = '← Jocs';
  sectionMenu($('#coet'), 'Tria una secció. A cada una el coet aprèn un truc nou.', SECTIONS, prog.secs, coet);
}

function coet(sec, idx) {
  const t = fresh(); pickFn = null; show('coet', `Secció ${sec + 1} · ${SECTIONS[sec].name}`); mood(sec % 4); back = seccions; $('#toM').textContent = '← Seccions';
  const root = $('#coet'), lv = LEVELS[sec * 10 + idx], g = readMap(lv.map), size = Math.max(g.w, g.h), ox = Math.floor((size - g.w) / 2);
  const code = lv.slots.map(k => Array(k).fill(null));
  // the reference route, tile by tile, with the stars picked up by then: a hint lights up what comes next
  const route = [{ x: lv.start[0], y: lv.start[1], got: 0 }];
  for (const st of trace(lv, lv.ref).steps) if (!st.skip && lv.ref[st.f][st.i].op === 'f') route.push({ x: st.x, y: st.y, got: route[route.length - 1].got + (st.star ? 1 : 0) });
  let sel = [0, 0], brush = '', job = null, ang = 0, at = [0, 0], got = 0, geo = { x: 0, y: 0, pitch: 0 };
  // hint state: how many were asked, the slot being pointed at, the order given away after asking three times at the same spot
  let asks = 0, slow = false, mark = null, reveal = null, stuck = ['', 0];
  root.innerHTML = `<div class="hud"><span class="chip">Nivell ${idx + 1} · ${lv.name}</span><span class="chip" id="cstars"></span></div>
    ${levelRow(SECTIONS[sec].levels, prog.secs[sec], idx)}
    <p class="status tip" id="ctip" role="status" aria-live="polite"></p>
    <div class="split"><div class="stage" id="cstage"><div class="board" id="cboard" style="--n:${size};--gh:${g.h}"></div></div>
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
      if (idx + 1 > prog.secs[sec]) { prog.secs[sec] = idx + 1; save(); }
      const end = idx === 9, last = end && sec === SECTIONS.length - 1;
      chime([523, 659, 784, 1047, 1319]); FX.celebrate(end ? 16 : 8);
      await sleep(900); if (!alive()) return;
      panel($('#cstage'), `<h2>${last ? 'Ets programador de coets!' : end ? 'Secció superada!' : pick(HURRAY)}</h2>
        <p class="lead">${last ? 'Has fet servir funcions, colors i recursivitat, com els programadors de veritat.' : end ? `Has obert la secció ${sec + 2}: ${SECTIONS[sec + 1].name}.` : `Nivell ${idx + 1} superat amb ${code.flat().filter(Boolean).length} ordres.`}</p>
        <button class="btn" id="nx">${last ? 'Torna a les seccions' : end ? 'Secció següent' : 'Nivell següent'}</button>`);
      $('#nx').onclick = () => last ? seccions() : end ? coet(sec + 1, 0) : coet(sec, idx + 1);
      return;
    }
    if (r.end === 'fall') sink(); else tone(150, 0, 0.45, 0.16, 'triangle');
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
  tip(lv.tip); setup(); drawCode();
}

soBtn();
// the page of all games links straight to the rocket game
location.hash === '#coet' ? seccions() : menu();
