import { $, RM, sleep, rand, pick } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { GRIDS, LIVES, makeSeq, begin, step, hueOf, pitchOf } from './logic.js';

const KEY = 'repeteix-els-llums';
const board = $('#board'), stage = $('#stage'), statusEl = $('#status'), dotsEl = $('#dots');

// Facts only: { best, so }. The game used to share its page and its save with the programming rocket, under 'memoria-visual':
// the record made there still counts, and that save is only ever read here
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.trunc(x)) : 0;
const mine = load(KEY), old = load('memoria-visual');
const prog = { best: Math.max(whole(mine?.best), whole(old?.best)), so: (mine ?? old)?.so !== false };
const save = () => store(KEY, prog);
// the record of before goes into the new save at once, so the page of all games shows it
if (!mine && prog.best) save();

// every new game or screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

// each tile has its own note
const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);
// the sky takes the colour of the level
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
const kicker = txt => { $('#kick').textContent = txt; };
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
  const t = fresh(); pickFn = null; kicker('Memòria visual');
  stage.querySelector('.panel')?.remove(); live(false);
  $('#hud').hidden = true; dotsEl.replaceChildren(); statusEl.textContent = ''; mood(0);
  await build(3, t); if (!t.on) return;
  panel(stage, `<button class="game" id="g1"><b>Repeteix els llums</b><span>Mira quins llums s'encenen i toca'ls en el mateix ordre. Quan arribis a 5, els quadres es fan més petits!</span>${prog.best ? `<span class="rec">Rècord: ${prog.best} punts</span>` : ''}</button>`);
  $('#g1').onclick = play;
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
  const t = fresh(); let s = begin(); pickFn = null; kicker('Memòria visual');
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

soBtn();
menu();
