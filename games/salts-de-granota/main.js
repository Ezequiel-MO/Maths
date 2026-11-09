import { $, RM, sleep, mid, OBERT } from '../../shared/util.js';
import { voice, pentatonic } from '../../shared/audio.js';
import { load, save as store } from '../../shared/progress.js';
import { pick, num, make, sums, PROJECTS, PLAN, CIRCLES, NEG, VALID, EXAM_PASS, RAPID, pool, clean, noteOf, reached, validated, levelText, isOpen, examOpen,
  circleOf, BADGES, badges, levelIn, poolIn, streakIn, rapidIn, fliesIn, exam, examIn, sprint, sheet, sheetIn } from './logic.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, xpBar, soundButton, list, news, combo, tokens } from '../../shared/shell.js';
import { FROG, Viz, hear } from './viz.js';
import { pond } from './world.js';

const KEY = 'salts-de-granota';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = OBERT;
const root = $('#joc');

// Facts only: { so, lv, piscina, exams, fulls, rapid, ratxa, mosques }. clean() makes a complete progress out of anything the browser
// holds, the save from before the cursus too
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
const paintXp = () => xpBar(levelText(prog));

// every screen change cancels running animations and the keypad through this token
let keyFn = null;
const fresh = tokens(() => { keyFn = null; });

const { tone, chime } = voice(() => prog.so);
// the longer the streak, the higher the note
const noteAt = pentatonic(392);
// the pond in 3D behind the panel; without WebGL its calls do nothing and the pictures of the tricks are drawn in the panel
const W = pond($('#world'));
document.body.classList.toggle('nogl', !W.ok);
// for the checks in the browser (scripts/flow-salts.mjs): the pond, to ask it where things are
window.__estany = W;
// the sparks of the page are the pond's now: confetti over the place on show (nothing without WebGL)
const FX = { ring() {}, burst() {}, celebrate: n => W.celebrate(n >= 16 ? 3 : n >= 8 ? 2 : 1) };
// the pond as the progress has it: a flower open for each project validated, a star for each exam passed
const pondState = () => W.state({ piscina: prog.piscina || OPEN, valid: OPEN ? PROJECTS.map((_, i) => i) : validated(prog), stars: prog.exams.filter(Boolean).length });
hear({ tone, noteAt, FX }); W.hear({ tone, noteAt });
// the picture of a trick: on the pond when it can draw it there, in the panel otherwise (viz.js)
const Pic = (host, p) => W.draws(p.viz) ? W.viz(host, p) : Viz(host, p);
const buzz = () => tone(150, 0, 0.45, 0.16, 'triangle');
const fanfare = () => chime([523, 659, 784, 1047, 1319]);
// right answers in a row at the first try, and the longest run since the page opened
let streak = 0, top = 0;

/* ---------- figures ---------- */
const frog = (cls = '') => `<svg class="frog-s ${cls}" viewBox="-38 -50 76 58" aria-hidden="true">${FROG}</svg>`;
// a lily pad seen from the side of the pond, with its notch, and the flower that opens on it
const PAD = 'M0 0L27 -3A28 11 0 1 0 27 3Z';
const FLOWER = `<g class="fl">${[0, 72, 144, 216, 288].map(r => `<ellipse cy="-6" rx="3.800" ry="6.200" transform="rotate(${r})"/>`).join('')}<circle r="3.600"/></g>`;
const pad = (cls = '') => `<svg class="pad ${cls}" viewBox="-30 -24 60 38" aria-hidden="true"><path class="lp" d="${PAD}"/><g transform="translate(-4 -8)">${FLOWER}</g></svg>`;
// the lily pad of a project on the map, seen from above
const ORB = `<svg class="pad orb" viewBox="-26 -26 52 52" aria-hidden="true"><path class="lp" d="M0 0L23 -7A24 24 0 1 0 23 7Z"/><path class="vein" d="M0 0L-22 -8M0 0L-22 8M0 0L-8 -22M0 0L-8 22"/><g transform="translate(-3 0) scale(1.5)">${FLOWER}</g></svg>`;
const FLY = `<svg class="fly" viewBox="-12 -10 24 20" aria-hidden="true"><ellipse cx="-4" cy="-4" rx="6" ry="3.500" fill="#CFF6FF" opacity="0.8" transform="rotate(-25 -4 -4)"/><ellipse cx="4" cy="-4" rx="6" ry="3.500" fill="#CFF6FF" opacity="0.8" transform="rotate(25 4 -4)"/><ellipse cy="2" rx="5.500" ry="4.200" fill="#F7C64E"/><circle cx="5" cy="1" r="2.600" fill="#2A1C00"/></svg>`;
const STAR = '<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -10.500L3.100 -3.600 10.500 -2.800 5 2.300 6.500 9.700 0 6 -6.500 9.700 -5 2.300 -10.500 -2.800 -3.100 -3.600Z"/></svg>';


// narrate a trick: one caption per move, then any closing caption
async function demo(p, v, capEl, t) {
  const say = async (txt, ms) => { capEl.textContent = txt; await sleep(ms); return t.on; };
  v.reset();
  if (!await say(p.caps[0], 1900)) return false;
  for (let i = 0; i < v.n; i++) {
    capEl.textContent = p.caps[i + 1];
    await sleep(800); if (!t.on) return false;
    await v.jump(i); if (!t.on) return false;
    await sleep(1500); if (!t.on) return false;
  }
  for (let i = v.n + 1; i < p.caps.length; i++) if (!await say(p.caps[i], 1700)) return false;
  return true;
}

/* ---------- words ---------- */
const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Així es fa!', 'Quin salt!', 'Nyam!'], HURRAY = ['Molt bé!', 'Quin salt!', 'Genial!', 'Nivell superat!'];
// one hue per circle: the sky of its levels and the border of its band on the map
const HUE = [165, 190, 48, 262, 318, 215];
const flies = n => n === 1 ? '1 mosca' : `${n} mosques`;
const hits = n => n === 1 ? '1 encert' : `${n} encerts`;

/* ---------- the page around every screen ---------- */
// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = ownPage('salts-de-granota');
const WIDE = matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');
// the pond is framed in the part of the screen the panel leaves free: on the left of it when the screen is wide, above it otherwise
function frame3d() {
  if (WIDE.matches) W.layout('right', $('#app').getBoundingClientRect().width + 24);
  else { const v = $('.view'); W.layout('bottom', v ? Math.max(0.3, 1 - v.getBoundingClientRect().bottom / innerHeight) : 0.55); }
}
WIDE.addEventListener?.('change', () => frame3d());
// a screen: the room the pond is seen through (h tall on a narrow screen) and the panel under it
function panel3d(h, html) { root.innerHTML = `<div class="view" style="height:${h}" aria-hidden="true"></div><div class="sheet" id="sheet">${html}</div>`; frame3d(); }
function show(kicker, playing) {
  document.body.classList.toggle('playing', playing); $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  root.onclick = null; W.highlight(null); W.clear();
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));
// the longest run goes in with whatever is being handed in: gives back the badges it earns
function run() { const r = streakIn(prog, top); prog = r.prog; return r.news; }
const drawCombo = () => combo(streak);
// a big frog leaps across the whole screen
function leap() {
  if (RM) return;
  const e = document.createElement('div'); e.className = 'leap'; e.innerHTML = `<span>${frog()}</span>`; document.body.append(e);
  [0, 0.12, 0.24].forEach((d, i) => tone(330 * 2 ** (i / 3), d, 0.3, 0.07));
  setTimeout(() => e.remove(), 1500);
}
// a fly leaves the answer and ends in the frog's mouth
function catchFly(from) {
  const eater = $('.hopper'); if (RM || !eater || !from.animate) return;
  const a = mid(from), b = mid(eater), e = document.createElement('i'); e.className = 'bug'; e.innerHTML = FLY; document.body.append(e);
  e.animate([{ transform: `translate(${a.x}px, ${a.y}px) scale(1.5)` }, { transform: `translate(${(a.x + b.x) / 2 + 50}px, ${Math.min(a.y, b.y) - 40}px) scale(1.3)`, offset: 0.55 },
    { transform: `translate(${b.x}px, ${b.y}px) scale(0.3)` }], { duration: 700, easing: 'ease-in' }).finished.then(() => {
    e.remove(); eater.classList.remove('gulp'); void eater.offsetWidth; eater.classList.add('gulp'); tone(880, 0, 0.08, 0.05);
  });
}

/* ---------- the map: a band for each circle, a lily pad for each project and the exam of the circle at the end ---------- */
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${HUE[c]} 60% 60%)" stroke-width="2.400" opacity="${3 - i <= c ? 1 : 0.25}"/>`).join('')}<circle r="2" fill="hsl(${HUE[c]} 80% 70%)"/></svg>`;
// the map of the cursus (shared/mapa.js): what it says of each project and exam, and the next thing to do. A circle opens by itself as
// soon as one of its levels is done, so the next thing to do may come after a shut circle
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, what: 'Sis operacions', skipShut: true });
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  fresh(); show('Càlcul mental · el mapa', false);
  pondState(); W.go('map');
  panel3d('42vh', '');
  const sheet = $('#sheet');
  M.screen({ root: sheet, here, rings, ringAttr: c => ` style="--rh:${HUE[c]}"`, projAttr: (i, c) => ` style="--h:${HUE[c]}"`, icon: () => ORB, pp: true,
    top: `\n    <p class="stats"><span>${FLY}<b>${prog.mosques}</b> ${prog.mosques === 1 ? 'mosca' : 'mosques'}</span><span>🔥 Ratxa més llarga: <b>${prog.ratxa}</b></span></p>\n    `,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="rapid">⚡ Repte llampec${prog.rapid ? ` · rècord ${prog.rapid}` : ''}</button>
      <button class="btn soft" id="full"${OPEN || prog.lv.some(Boolean) ? '' : ' disabled title="Fes un nivell per obrir-lo"'}>🔍 Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => { tone(523, 0, 0.2); nivell(i, M.nextLevel(i)); }, exam: examen, on: [['#full:not(:disabled)', full], ['#rapid', llampec]] });
  // a project under the finger, or with the focus, lights its lily pad on the pond
  const lit = e => { const b = e.target.closest?.('.proj[data-p]'); W.highlight(b ? +b.dataset.p : null); };
  sheet.onpointerover = lit; sheet.onfocusin = lit; sheet.onpointerleave = () => W.highlight(null);
  here = -1;
}

/* ---------- the board: operations one after another, each with its box for the answer and the keys that fill it ---------- */
// A real keyboard works too. Enter on a button that is not a key of the pad is left alone: it presses that button, as Space does.
const EQ = `<p class="big" id="big"><span id="lhs"></span><output id="ans" aria-label="La teva resposta"></output><span id="rhs"></span></p>`;
const key = k => `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : k === 'sign' ? ' aria-label="Posa o treu el menys"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k === 'sign' ? '+/−' : k}</button>`;
// below zero the pad has one key more, for the minus sign
const keysHtml = neg => `<div class="keys${neg ? ' neg' : ''}">${(neg ? [1, 2, 3, 4, 5, 'sign', 'del', 6, 7, 8, 9, 0, 'ok'] : [1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok']).map(key).join('')}</div>`;
addEventListener('keydown', e => {
  if (!keyFn || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter' && e.target.closest?.('button:not([data-k]), a')) return;
  const k = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === '-' ? 'sign' : /^\d$/.test(e.key) ? e.key : null;
  if (k) { e.preventDefault(); keyFn(k); }
});
function keypad(p, submit, neg) {
  const out = $('#ans'); let v = '', minus = false;
  $('#lhs').textContent = p.lhs; $('#rhs').textContent = p.rhs;
  const val = () => (minus ? -1 : 1) * +v;
  // no need to press the tick: the answer is checked as soon as it is right, or has as many digits as the right one. Below zero a
  // wrong one waits for the tick, because the minus sign may still be coming
  const auto = () => { if (keyFn && v && (val() === p.ans || !neg && v.length >= String(p.ans).length)) submit(val()); };
  keyFn = k => {
    if (k === 'ok') { if (v) submit(val()); return; }
    if (k === 'sign') { if (!neg) return; minus = !minus; }
    else v = k === 'del' ? v.slice(0, -1) : (v + k).slice(0, 3);
    if (k === 'del' && !v) minus = false;
    out.className = ''; out.textContent = (minus ? '−' : '') + v;
    tone(k === 'del' ? 392 : 784, 0, 0.08, 0.05);
    if (k !== 'del') auto();
  };
  $('.keys').onclick = e => { const b = e.target.closest('button'); if (b && keyFn) keyFn(b.dataset.k); };
  return {
    auto,
    wrong() { v = ''; minus = false; out.textContent = ''; out.className = ''; void out.offsetWidth; out.className = 'shake'; buzz(); },
    // one try only: the right answer takes the place of the wrong one
    show() { keyFn = null; out.textContent = num(p.ans); out.className = ''; void out.offsetWidth; out.className = 'shake told'; buzz(); },
    right(k = 0) { keyFn = null; out.className = 'good'; const c = mid(out); FX.burst(c.x, c.y, 140, 16 + 4 * Math.min(k, 6), 160 + 20 * Math.min(k, 6)); FX.ring(c.x, c.y, 140, c.w * 0.4, c.w * 1.2); chime([noteAt(k), noteAt(k + 2)]); }
  };
}

// Plays the operations qs inside host and calls o.onEnd(st) after the last one. st is { res, hits, flies, missed }: res has one
// boolean per operation, true when it was answered at the first try with no hint. What o says:
//   pic    the picture of the trick stays on screen          hints  there is a «Pista» button: the frog makes its next move
//   redo   one answered with a hint or after a miss comes back once at the end
//   once   one try for each: a miss shows the answer and goes on (an exam, a lightning round)
//   secs   it ends when the time is up instead of after the last one
//   neg    the pad has the minus key                          chip(txt, st)  called with what to write in the counter
// The frog hops along a row of lily pads, one per operation: a flower opens on the ones answered at the first try, and each of
// those is a fly caught.
function play(o) {
  const { t, host, qs } = o, n = qs.length, st = { res: [], hits: 0, flies: 0, missed: [] };
  let i = 0, cur = { on: true }, over = false;
  host.innerHTML = `${o.secs ? '<div class="fuse" role="img" aria-label="El temps que queda"><i id="fuse"></i></div>'
    : `<div class="lane" style="--n:${n + 1};--k:0" role="img" aria-label="Un nenúfar per a cada operació">${pad().repeat(n + 1)}<span class="hopper">${frog()}</span></div>`}
    <div class="stage" id="stage"></div><span class="combo" id="cb" hidden></span>`;
  const stage = $('#stage'), lane = $('.lane', host);
  // the frog hops to the pad of the operation just answered
  function step(ok) {
    if (!lane) return;
    const k = st.res.length, h = lane.lastChild;
    lane.style.setProperty('--k', k); lane.children[k].classList.add(ok ? 'ok' : 'slow');
    h.classList.remove('hop'); void h.offsetWidth; h.classList.add('hop');
  }
  function finish() { over = true; keyFn = null; o.onEnd(st); }

  function ask() {
    cur.on = false; cur = { on: true };
    if (i >= qs.length) return finish();
    const me = cur, alive = () => me.on && t.on && !over, p = qs[i];
    if (!o.pic) W.clear();
    // shown counts the moves of the picture already played; clean stays true while no hint and no miss
    let v = null, shown = 0, clean = true, miss = 0, busy = false, done = false;
    o.chip?.(p.re ? 'Repàs' : o.secs ? hits(st.hits) : `Operació ${st.res.length + 1} de ${n}`, st);
    stage.innerHTML = `${EQ}<div id="viz"${o.pic ? '' : ' hidden'}></div>${o.pic ? `<p class="hint">${p.hint}</p>` : ''}<p id="msg" role="status"></p>${keysHtml(o.neg)}
      ${o.hints ? '<div class="row"><button class="btn soft" id="hintb">Pista</button></div>' : ''}`;
    const hb = $('#hintb'), msg = $('#msg');
    const say = (txt, cls) => { msg.textContent = txt; msg.className = cls || ''; };
    // On a number line the child can make the hops herself, dragging the frog. A hop she lands right is her own work, not a hint;
    // one that lands anywhere else is a slip, as a wrong answer is (or she could find the result by trying every place)
    const hand = () => v.hand?.({ can: () => alive() && !busy && !done, next: () => shown, hold: on => { busy = on; },
      hopped: () => { shown++; if (alive()) kp.auto(); },
      missed: () => { if (!alive()) return; clean = false; streak = 0; drawCombo(); say('Aquest salt no arriba on toca. Torna-ho a provar.', 'bad'); if (++miss >= 2) hb?.classList.add('glow'); } });
    if (o.pic) {
      v = Pic($('#viz'), p); hand();
      // an answer typed while the first leap is being drawn is checked when it lands
      if (p.pre) { busy = true; shown = 1; v.jump(0).then(() => { if (alive()) { busy = false; kp.auto(); } }); }
    }
    // a hint is a picture, never words: the frog makes its next move, and the place where the result goes shows "?".
    // Asked again once every move is on screen, the picture gives the result away.
    if (hb) hb.onclick = async () => {
      if (busy || done) return;
      busy = true; clean = false; hb.classList.remove('glow'); say(''); hb.blur();
      if (!v) { $('#viz').hidden = false; v = Pic($('#viz'), p); hand(); }
      if (shown < v.n) { await v.jump(shown, shown === v.n - 1); shown++; }
      else v.reveal();
      if (alive()) { busy = false; kp.auto(); }
    };
    const kp = keypad(p, async val => {
      if (busy || done) return;
      const ok = val === p.ans;
      if (!ok && !o.once) {
        clean = false; streak = 0; drawCombo(); kp.wrong(); say('Encara no. Torna-ho a provar.', 'bad');
        // two misses in a row: the hint button lights up
        if (++miss >= 2) hb?.classList.add('glow');
        return;
      }
      done = true; hb?.classList.remove('glow');
      if (!ok) {
        st.res.push(false); st.missed.push(p); streak = 0; drawCombo(); step(false); kp.show(); say(`Era ${num(p.ans)}.`, 'bad');
        if (o.secs) { await sleep(1100); if (alive()) { i++; ask(); } return; }
        $('.keys', stage).outerHTML = '<button class="btn" id="go">Segueix</button>';
        $('#go').onclick = () => { if (alive()) { i++; ask(); } }; $('#go').focus({ preventScroll: true });
        return;
      }
      st.hits++;
      if (!p.re) {
        st.res.push(clean); step(clean);
        if (clean) { st.flies++; streak++; top = Math.max(top, streak); catchFly($('#ans')); } else { streak = 0; if (o.redo) qs.push({ ...p, re: true }); }
        drawCombo();
      }
      kp.right(clean ? streak : 0); say(clean && streak >= 3 && streak % 5 === 0 ? `${streak} seguides!` : pick(BRAVO), 'good');
      if (clean && streak && streak % 5 === 0) FX.celebrate(3);
      o.chip?.(o.secs ? hits(st.hits) : null, st);
      // with the picture on screen, the frog finishes the trick before the next operation
      if (v) {
        for (; shown < v.n; shown++) { await v.jump(shown); if (!alive()) return; }
        v.reveal(); await sleep(1200);
      } else await sleep(o.secs ? 300 : 700);
      if (!alive()) return;
      i++; ask();
    }, o.neg);
  }
  // the fuse of a lightning round: when it burns out the board is over, whatever was going on
  if (o.secs) {
    const t0 = performance.now(), iv = setInterval(() => {
      const left = o.secs - (performance.now() - t0) / 1000;
      if (!t.on || over) return clearInterval(iv);
      $('#fuse').style.width = Math.max(0, left / o.secs * 100) + '%';
      if (left <= 0) { clearInterval(iv); finish(); }
    }, 100);
  }
  drawCombo(); ask();
}
// the counter chip and the flies caught, the two things a board writes outside its card
const chip = (txt, st) => { if (txt) $('#cnt').textContent = txt; const f = $('#fl b'); if (f) f.textContent = st.flies; };
const HUD = (left, fly = true) => `<div class="hud"><span class="chip">${left}</span><span class="chip" id="cnt"></span>${fly ? `<span class="chip flies" id="fl" aria-label="Mosques caçades">${FLY}<b>0</b></span>` : ''}</div>`;
// whatever a board has won goes in with the hand-in: the flies and the longest run. Gives back the badges they earn
function bank(st) { const f = fliesIn(prog, st.flies); prog = f.prog; return [...f.news, ...run()]; }

/* ---------- a level: the frog shows the trick in the first one, then the operations ---------- */
// One answered with a hint or after a miss comes back once at the end, and the level is done when every one has been answered:
// nothing is timed and nothing can be lost. The stars count the ones answered at the first try.
function nivell(i, idx) {
  const t = fresh(), S = PROJECTS[i], L = PLAN[idx], c = circleOf(i);
  let cur = { on: true };
  show(`Cercle ${c} · ${S.name}`, true); here = i;
  W.go('c' + c);
  panel3d('30vh', `${HUD(`Nivell ${idx + 1} · ${L.kind}`)}<nav class="levels" aria-label="Nivells"></nav><div class="play" id="play"></div>`);
  const card = $('#play'), nav = $('.levels', root);
  function levels() {
    const open = OPEN ? 9 : reached(prog, i);
    nav.innerHTML = PLAN.map((_, k) => `<button data-n="${k}" class="s${prog.lv[i * 10 + k]}"${k === idx ? ' aria-current="true"' : ''}${k > open ? ' disabled title="Supera el nivell anterior"' : ''}>${k + 1}</button>`).join('');
    // the row scrolls sideways on a phone: keep this level in the middle
    const a = nav.getBoundingClientRect(), b = nav.querySelector('[aria-current]').getBoundingClientRect(); nav.scrollLeft += b.left - a.left - (a.width - b.width) / 2;
  }
  nav.onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) nivell(i, +b.dataset.n); };
  levels();

  // the first level of a project opens with the frog showing the trick
  function intro() {
    let n = 0;
    $('#cnt').textContent = 'La granota ho ensenya';
    card.innerHTML = `<div class="coach">${frog('pilot')}<p class="tipb">${S.tip}</p></div><p class="big" id="big"></p><div id="viz"></div><p class="cap" id="cap" aria-live="polite"></p>
      <div class="row"><button class="btn soft" id="again">Torna-ho a veure</button><button class="btn soft" id="other">Un altre exemple</button><button class="btn" id="go">Ara jo!</button></div>`;
    async function tell() {
      cur.on = false; cur = { on: true }; const me = cur, p = make(S.type, ...S.demo[n]);
      $('#big').innerHTML = `${p.lhs} <b class="q">?</b> ${p.rhs}`;
      if (await demo(p, Pic($('#viz'), p), $('#cap'), { get on() { return me.on && t.on; } })) $('#big').textContent = p.eq;
    }
    $('#again').onclick = tell;
    $('#other').onclick = () => { n = (n + 1) % S.demo.length; tell(); };
    $('#go').onclick = start;
    tell();
  }
  function start() {
    cur.on = false;
    play({ t, host: card, qs: sums(i, idx), pic: L.pic, hints: true, redo: true, neg: c === NEG, chip, onEnd: win });
  }
  function win(st) {
    const fast = st.res.filter(Boolean).length, r = levelIn(prog, i, idx, L.n - fast), end = idx === 9;
    prog = r.prog; const got = [...r.news, ...bank(st)]; save();
    levels(); $('#cnt').textContent = `${fast} de ${L.n} a la primera`;
    fanfare(); FX.celebrate(r.valid || end ? 16 : 8); if (r.n === 3 || r.valid) leap();
    card.innerHTML = `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="won" role="img" aria-label="${r.n} de 3 estrelles">${[1, 2, 3].map(k => `<i class="${k <= r.n ? 'on' : ''}" style="--i:${k}">${STAR}</i>`).join('')}</p>
      <p class="cap">${fast} de ${L.n} a la primera${st.flies ? ` · ${flies(st.flies)} més` : ''}${r.n < 3 ? '. Amb totes a la primera, tres estrelles!' : ''}</p>
      <p class="mark"><span>Nota del projecte</span><span class="nbar" role="img" aria-label="${r.note} de 100, es valida amb ${VALID}"><i style="width:${r.note}%"></i></span><b>${r.note}</b></p>
      ${r.gain ? `<p class="lead go">+${r.gain} XP</p>` : ''}${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}!</p>` : ''}${news(got)}
      <div class="row"><button class="btn soft" id="again">Torna-hi</button><button class="btn" id="nx">${r.exam ? "A l'examen!" : end ? 'Torna al mapa' : 'Nivell següent'}</button></div>`;
    $('#again').onclick = () => nivell(i, idx);
    $('#nx').onclick = () => r.exam ? examen(c) : end ? mapa() : nivell(i, idx + 1);
    $('#nx').focus({ preventScroll: true });
  }
  L.demo ? intro() : start();
}

/* ---------- the Piscina: three first operations with their picture, the first thing a profile with nothing saved meets ---------- */
// The third one saves piscina and opens the map. There is no «← Mapa» here: the map would have every circle shut, so the way
// out is the page of all games.
function piscina() {
  const t = fresh(); show('La Piscina', true); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  W.go('jetty');
  panel3d('30vh', `${HUD("Tres salts per entrar a l'estany")}<div class="play" id="play"></div>`);
  play({ t, host: $('#play'), qs: pool(), pic: true, hints: true, chip, onEnd: st => {
    const r = poolIn(prog); prog = r.prog; const got = [...r.news, ...bank(st)]; save();
    fanfare(); leap(); FX.celebrate(16);
    $('#play').innerHTML = `<h2>Piscina acabada!</h2><p class="lead go">+50 XP · ja ets dins del cursus de càlcul mental</p>${news(got)}
      <p class="lead">Al mapa hi ha sis cercles de nenúfars. Cada nenúfar és un truc per calcular de cap: valida els d'un cercle i supera'n l'examen per obrir el següent.</p>
      <div class="row"><button class="btn" id="nx">Obre el mapa</button></div>`;
    $('#nx').onclick = () => mapa(); $('#nx').focus({ preventScroll: true });
  } });
}

/* ---------- the exam of a circle: six new operations of its projects, one try each, no hints, saved after the sixth ---------- */
function examen(c) {
  const t = fresh(), qs = exam(c); show(`Examen del cercle ${c}`, true);
  W.go('rock');
  panel3d('30vh', `${HUD('Sis operacions · un sol intent')}<div class="play" id="play"></div>`);
  play({ t, host: $('#play'), qs, once: true, neg: c === NEG, chip, onEnd: st => {
    const first = !prog.exams[c], r = examIn(prog, c, qs, st.res); prog = r.prog; const got = [...r.news, ...bank(st)]; save();
    r.good ? (fanfare(), leap(), FX.celebrate(16)) : tone(196, 0, 0.5, 0.12, 'triangle');
    $('#cnt').textContent = `${r.score} de 6`;
    $('#play').innerHTML = `<h2>${r.good ? 'Examen superat!' : 'Encara no!'}</h2><p class="score">${r.score} de 6</p>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de 6.`}</p>
      ${r.good && first ? `<p class="lead go">${c < CIRCLES.length - 1 ? `S'ha obert el cercle ${c + 1}: ${CIRCLES[c + 1].name}.` : 'Has acabat el cursus de càlcul mental!'}</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(got)}
      <div class="row"><button class="btn soft" id="rp">Un altre examen</button><button class="btn" id="bk">Torna al mapa</button></div>`;
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c); $('#bk').focus({ preventScroll: true });
  } });
}

/* ---------- the lightning round: as many operations as fit in a minute, one try each; only the record is kept ---------- */
function llampec() {
  const t = fresh(); show('Repte llampec', true);
  W.go('home');
  panel3d('30vh', `<div class="play intro"><h2>⚡ Repte llampec</h2><p class="lead">${RAPID} segons d'operacions amb els trucs que ja coneixes, un sol intent per a cada una. Escriu el resultat i ja està: no cal prémer ✓. Quantes n'encertaràs?</p>
    ${prog.rapid ? `<p class="lead sun">El teu rècord: ${prog.rapid}</p>` : ''}<div class="row"><button class="btn" id="go">Comença!</button></div></div>`);
  $('#go').focus({ preventScroll: true });
  $('#go').onclick = () => {
    if (!t.on) return;
    panel3d('30vh', `${HUD('Repte llampec', false)}<div class="play" id="play"></div>`);
    play({ t, host: $('#play'), qs: sprint(prog), once: true, secs: RAPID, chip, onEnd: st => {
      const r = rapidIn(prog, st.hits); prog = r.prog; const got = [...r.news, ...bank(st)]; save();
      fanfare(); if (r.best) { FX.celebrate(16); leap(); }
      $('#play').innerHTML = `<h2>Temps!</h2><p class="score">${hits(st.hits)}</p><p class="lead${r.best ? ' go' : ''}">${r.best ? 'Rècord nou!' : `El teu rècord: ${prog.rapid}`}</p>${news(got)}
        <div class="row"><button class="btn soft" id="bk">Torna al mapa</button><button class="btn" id="rp">Torna-hi</button></div>`;
      $('#bk').onclick = () => mapa(); $('#rp').onclick = () => llampec(); $('#rp').focus({ preventScroll: true });
    } });
  };
}

/* ---------- «Caça l'errada»: three operations a sheet has answered, one after the other; from none to two of them are wrong ---------- */
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the answer that
// makes it true, with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = fresh(); show("Caça l'errada", true);
  W.go('jetty');
  const cs = sheet(prog, OPEN), marks = [];
  panel3d('30vh', `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="Tres operacions">${'<i></i>'.repeat(cs.length)}</span></div>
    <div class="play"><div class="coach" id="coach">${frog('pilot')}<p class="tipb" id="tip" role="status" aria-live="polite"></p></div><div class="sheetbox" id="stage"></div><div class="tail" id="tail"></div></div>`);
  const stage = $('#stage'), tail = $('#tail'), dots = [...$('#dots').children];
  const say = (txt, cls = '') => { $('#tip').textContent = txt; const c = $('#coach'); c.className = 'coach'; void c.offsetWidth; c.className = 'coach ' + cls; };
  let k = -1, C, busy, openAt = 0, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="paper"><p class="claim">${C.q.lhs} <b>${num(C.says)}</b> ${C.q.rhs}</p></div>`;
    tail.innerHTML = '<div class="row"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>';
    say('Mira-ho bé: és veritat, el que diu el full?');
  }
  async function answer(ok, txt) {
    const last = k === cs.length - 1;
    busy = true; marks[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, marks); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(txt, 'go'); chime([523, 659, 784]); FX.celebrate(4); } else { say(txt, 'oops'); buzz(); }
    await sleep(ok ? 1200 : 2600); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.filter(c => c.says !== c.real).map(c => c.q.eq);
    tail.innerHTML = '';
    r.good ? (fanfare(), leap()) : tone(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
    stage.innerHTML = `<p class="score">${cs.length - r.missed.length} de ${cs.length}</p>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar els tres.'}</p>
      <p class="lead">${bad.length ? `${bad.length > 1 ? 'Tenien' : 'Tenia'} una errada: ${list(bad)}.` : 'Tots tres eren correctes.'}</p>${news(r.news)}
      <div class="row"><button class="btn soft" id="rp">Un altre full</button><button class="btn" id="bk">Torna al mapa</button></div>`;
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full(); $('#bk').focus({ preventScroll: true });
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era: ${C.q.eq}.` : 'Sí, era correcte!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: ${C.q.eq}.`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="row">${C.opts.map(v => `<button class="btn soft" data-v="${v}">${num(v)}</button>`).join('')}</div>`;
      say('Ben vist! Ara tria el resultat bo.', 'go');
    }
    else if ('v' in b.dataset) { const ok = +b.dataset.v === C.real; answer(ok, ok ? `Arreglat: ${C.q.eq}.` : `No era aquest: ${C.q.eq}.`); }
  };
  arm();
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
