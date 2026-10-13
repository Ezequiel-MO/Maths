import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, LEVELS, readMap, routeOf, piecesOf, diagnose, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, RAPID,
  starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, BADGES, badges, levelIn, poolIn, streakIn, rapidIn,
  exam, examIn, sprint, sheet, sheetIn, wantQ, slotOf, turned } from './logic.js';

// the save keeps the id of the page this game used to share with the game of lights: the progress made there is this one
const KEY = 'memoria-visual';

// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try it out; without it a
// circle opens with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = OBERT;

// Facts only: { best, so, lv, piscina, exams, fulls, rapid, ratxa }. clean() makes a complete progress out of anything the browser
// holds, the save from before the cursus too (the levels done in five sections)
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}

// every new game or screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /coet-programador\.html$/.test(location.pathname);
// home is the map or the Piscina, where the way back is the page of all games; wide is for a screen that is being played: more room, and no big title
function show(kicker, wide = false, home = false) {
  $('#app').classList.toggle('wide', wide);
  $('#toG').hidden = !home || !HUB; $('#toM').hidden = home; $('#kick').textContent = kicker;
  $('#coet').onclick = null; replace = null; keyFn = null;
}
let back = () => mapa();
$('#toM').onclick = () => back();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

/* ---------- the rocket follows the functions the child writes ---------- */
const OPS = { f: ['↑', 'Endavant'], L: ['↶', "Gira a l'esquerra"], R: ['↷', 'Gira a la dreta'], 1: ['F1', 'Crida F1'], 2: ['F2', 'Crida F2'], 3: ['F3', 'Crida F3'] };
const CNAME = { b: 'blau', g: 'verd', p: 'rosa' };
const ROCKET = `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="flame" d="M25 48 Q32 68 39 48Z" fill="#F7C64E"/><path d="M22 38 L11 52 L24 47Z M42 38 L53 52 L40 47Z" fill="#FF6B9A"/><path d="M32 3 C45 14 46 34 42 48 H22 C18 34 19 14 32 3Z" fill="#EAF8F4" stroke="#0A2A3A" stroke-width="2"/><circle cx="32" cy="24" r="6.5" fill="#6FE3FF" stroke="#0A2A3A" stroke-width="2"/></svg>`;
const STEP = 430, HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Bon programa!', 'Enlairament perfecte!'];
// puts the rocket back on its tile after a resize
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

// the game opens on the Piscina until it is done, and on the map ever after
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
  fresh(); show('El coet · El mapa', false, true); FX.mood(205);
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
  const t = fresh(); show(`Cercle ${circleOf(sec)} · ${PROJECTS[sec].name}`, true); FX.mood(HUES[sec]); back = mapa; $('#toM').textContent = '← Mapa'; here = sec;
  const root = $('#coet'), lv = LEVELS[sec * 10 + idx], g = readMap(lv.map), size = Math.max(g.w, g.h), ox = Math.floor((size - g.w) / 2);
  const code = lv.slots.map(k => Array(k).fill(null));
  // the reference route, tile by tile: a hint lights up what comes next
  const route = routeOf(lv), total = lv.slots.reduce((s, n) => s + n, 0);
  // the same route cut into the pieces each function flies: a hint paints them on the board
  const pieces = piecesOf(lv);
  let sel = [0, 0], brush = '', job = null, ang = 0, at = [0, 0], got = 0, geo = { x: 0, y: 0, pitch: 0 };
  // set while the board shows the program part of the way through (after a flight that failed, a hint or a walk step by step):
  // dg is the diagnosis of the program as it is written and k how many of its steps are done. Any change to the program clears it
  let dbg = null;
  // hint state: how many were asked, the slot being pointed at, the order given away, the fault the last hint was about with how
  // many times it was asked, and whether an order was given away already
  let asks = 0, slow = false, mark = null, reveal = null, rung = ['', 0], gave = false;
  // launches that did not get every star, plus hints asked: they set what the level is worth
  let slips = 0;
  const worth = () => { $('#cpts').textContent = `${POINTS[starsFor(slips)]} punts`; };
  root.innerHTML = `<div class="hud"><span class="chip">Nivell ${idx + 1} · ${lv.name}</span><span class="chip sun" id="cpts"></span><span class="chip" id="cstars"></span></div>
    ${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <p class="status tip" id="ctip" role="status" aria-live="polite"></p>
    <div class="split" id="split"><div class="stage" id="cstage"><div class="board" id="cboard" style="--n:${size};--gh:${g.h}"></div></div>
    <div class="prog" id="prog"><div id="fns"></div>
      <div class="stepper"><button id="sb" aria-label="Un pas enrere">◀</button><span id="sn"></span><button id="sf" aria-label="Un pas endavant">▶</button></div>
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
    geo = { x: c.offsetLeft - x * pitch, y: c.offsetTop - y * pitch, pitch, cs: pitch - gap };
  }
  const still = fn => { rk().style.transition = 'none'; fn(); void rk().offsetWidth; rk().style.transition = ''; };
  const count = k => { got = k; $('#cstars').textContent = `★ ${k} de ${g.stars.size}`; };
  // the board as the level starts: every star back, no hint lights, the rocket on its first tile
  function setup() {
    cb.innerHTML = [...g.cells].map(([k, c]) => { const [x, y] = k.split(',').map(Number); return `<div class="cell c${c}${g.stars.has(k) ? ' star' : ''}" data-k="${k}" style="grid-column:${x + ox + 1};grid-row:${y + 1}"></div>`; }).join('') + `<div class="rocket">${ROCKET}</div>`;
    measure(); ang = lv.start[2] * 90; still(() => put(lv.start[0], lv.start[1])); count(0); $('#stk').textContent = '';
  }
  replace = () => { const plan = cb.querySelector('.plan'); measure(); still(() => put(at[0], at[1])); if (plan) paint(); };
  function drawCode() {
    $('#fns').innerHTML = code.map((fn, f) => `<div class="fn"><span class="fname">F${f + 1}</span><div class="slots">${fn.map((s, i) =>
      `<button class="slot${s ? ' full' : ''}${s && s.c ? ' c' + s.c : ''}${sel[0] === f && sel[1] === i ? ' sel' : ''}${mark && mark.f === f && mark.i === i ? ' ' + mark.kind : ''}" data-f="${f}" data-i="${i}" aria-label="F${f + 1}, casella ${i + 1}: ${s ? OPS[s.op][1] + (s.c ? ', només al ' + CNAME[s.c] : '') : 'buida'}">${s ? OPS[s.op][0] : ''}</button>`).join('')}</div></div>`).join('');
    root.querySelectorAll('.cmd').forEach(b => { b.className = 'cmd' + (brush && b.dataset.op !== 'x' ? ' c' + brush : '') + (reveal && reveal.op === b.dataset.op ? ' glow' : ''); });
    root.querySelectorAll('.brush button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.c === brush); b.classList.toggle('glow', !!reveal && (reveal.c || '') === b.dataset.c); });
  }
  // the stepper under the program: which step the board shows
  function bar() {
    const k = dbg ? dbg.k : 0, n = dbg ? dbg.dg.steps.length : 1;
    $('#sn').textContent = k ? `Pas ${k}${dbg.dg.end === 'fuel' ? '' : ' de ' + n}` : 'Pas a pas';
    $('#sb').disabled = !k; $('#sf').disabled = k >= n;
  }
  function stop() { if (job) job.on = false; job = null; dbg = null; runb.textContent = '▶ Engega'; setup(); drawCode(); bar(); }
  const launch = () => { const me = job = { on: true }; runb.textContent = '■ Atura'; return me; };
  function sink() {
    const p = mid(rk()); FX.burst(p.x, p.y, 200, 24, 150); FX.ring(p.x, p.y, 200, 6, p.w);
    put(at[0], at[1], ' scale(0.1)'); rk().style.opacity = 0; tone(150, 0, 0.45, 0.16, 'triangle');
  }

  const stackOf = st => 'Funcions en marxa: ' + st.stack.slice(0, 9).map(f => `<b>F${f + 1}</b>`).join('▸') + (st.stack.length > 9 ? '…' : '');
  // plays the steps of a trace on the board; false if the run was stopped on the way
  async function fly(steps, me, pace) {
    let k = 0;
    for (const st of steps) {
      const el = root.querySelector(`.slot[data-f="${st.f}"][data-i="${st.i}"]`), op = code[st.f][st.i].op;
      el.classList.add(st.skip ? 'skip' : 'run');
      if (!st.skip) {
        $('#stk').innerHTML = stackOf(st);
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

  /* ----- debugging: what the program did, said in words ----- */
  const tileName = (x, y) => CNAME[g.cells.get(x + ',' + y)];
  const where = st => `F${st.f + 1}, casella ${st.i + 1}`;
  // the board as the program leaves it after k of its steps, with no flight
  function pose(dg, k) {
    setup();
    let n = 0, [x, y, d] = lv.start;
    dg.steps.slice(0, k).forEach(st => {
      if (st.star) { cb.querySelector(`[data-k="${st.star}"]`).classList.remove('star'); n++; }
      if (g.cells.has(st.x + ',' + st.y)) [x, y, d] = [st.x, st.y, st.d];
    });
    count(n); ang = d * 90; still(() => put(x, y));
    if (k) $('#stk').innerHTML = stackOf(dg.steps[k - 1]);
  }
  // lights run along the tiles of the route after its place j: as far as the next star, or all of them
  function lights(j, all) {
    let next = route.slice(j + 1);
    if (!all) { const star = next.findIndex(c => c.got > route[j].got); next = next.slice(0, star < 0 ? next.length : star + 1).slice(0, 8); }
    next.forEach((c, n) => { const e = cb.querySelector(`[data-k="${c.x},${c.y}"]`); e.classList.add('trail'); e.style.setProperty('--d', n * 220); });
  }
  // The route painted on the board, piece by piece: a ribbon over the tiles a function flies, in the colour of that function and
  // with its name, and a ring on the tile where it turns. The pieces come one after the other, so the ones that repeat can be seen
  function paint() {
    cb.querySelectorAll('.trail').forEach(e => e.classList.remove('trail')); cb.querySelector('.plan')?.remove();
    const u = geo.cs, ctr = ([x, y]) => [geo.x + x * geo.pitch + u / 2, geo.y + y * geo.pitch + u / 2], named = {};
    // The names go on top of every ribbon, and only the first two pieces of a function carry one: a staircase has too many.
    // A level with F1 alone needs none
    const gap = Math.min(0.35, 3 / pieces.length), names = [];
    const name = (p, n, x, y) => { if (code.length > 1 && (named[p.f] = (named[p.f] || 0) + 1) < 3) names.push(`<text class="f${p.f}" style="--t:${(n * gap).toFixed(2)}s" x="${x}" y="${y}">F${p.f + 1}</text>`); };
    // a piece that only turns has its name on the rim of its ring, on the side away from the tiles before and after
    const rim = (n, [x, y]) => {
      const a = pieces[n - 1]?.pts.at(-2), b = pieces[n + 1]?.pts[1], [cx, cy] = ctr([x, y]);
      const dx = Math.sign((a ? x - a[0] : 0) + (b ? x - b[0] : 0)), dy = Math.sign((a ? y - a[1] : 0) + (b ? y - b[1] : 0)) || (dx ? 0 : -1), k = u * 0.37 / Math.hypot(dx, dy);
      return [cx + dx * k, cy + dy * k];
    };
    cb.insertAdjacentHTML('beforeend', `<svg class="plan" style="--u:${u}px" aria-hidden="true">${pieces.map((p, n) => {
      const pts = p.pts.map(ctr), m = pts.length - 1;
      let out = [...new Set(p.turns.map(String))].map(k => { const [x, y] = ctr(k.split(',').map(Number)); return `<circle cx="${x}" cy="${y}" r="${u * 0.37}"/>`; }).join('');
      if (!m) name(p, n, ...rim(n, p.pts[0]));
      else {
        // both ends are cut short, so two pieces in a row do not touch and the star of the last tile stays in sight
        const cut = (a, b, k) => [a[0] + Math.sign(b[0] - a[0]) * u * k, a[1] + Math.sign(b[1] - a[1]) * u * k];
        const line = [cut(pts[0], pts[1], 0.34), ...pts.slice(1, -1), cut(pts[m], pts[m - 1], 0.4)], [ex, ey] = line[m];
        const i = Math.floor(m / 2), a = pts[i], b = pts[Math.min(m, i + 1)], t = m / 2 - i;
        out = `<polyline pathLength="1" points="${line.map(q => q.join(',')).join(' ')}"/>
          <path d="M-0.17,-0.17 L0.12,0 L-0.17,0.17Z" transform="translate(${ex} ${ey}) rotate(${Math.atan2(pts[m][1] - pts[m - 1][1], pts[m][0] - pts[m - 1][0]) * 180 / Math.PI}) scale(${u})"/>`
          + out;
        name(p, n, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
      }
      return `<g class="f${p.f}" style="--t:${(n * gap).toFixed(2)}s">${out}</g>`;
    }).join('')}${names.join('')}</svg>`);
  }
  // one step of the program in words: which order it was and what the rocket did with it
  function tell(dg, k) {
    const st = dg.steps[k - 1], s = code[st.f][st.i], p = dg.steps[k - 2], [x, y] = p ? [p.x, p.y] : lv.start;
    const head = `${where(st)}, «${OPS[s.op][0]}»${s.c ? ' només al ' + CNAME[s.c] : ''}: `;
    if (st.skip) return head + `el coet és al ${tileName(x, y)} i aquesta ordre se salta.`;
    if (s.op === 'f') return head + (g.cells.has(st.x + ',' + st.y) ? `el coet avança una casella${st.star ? ' i agafa una estrella' : ''}.` : 'davant del coet no hi ha camí. Xof!');
    if (st.turn) return head + `el coet gira cap a la seva ${st.turn < 0 ? 'esquerra' : 'dreta'} i ara mira ${DIR[st.d]}.`;
    return head + (+s.op - 1 === st.f ? `F${s.op} torna a començar.` : `ara es fan les ordres de F${s.op}.`)
      + (code[st.f].slice(st.i + 1).some(Boolean) ? ' Les ordres que té al darrere queden guardades per a després.' : '');
  }
  // one step on or back through the program as it is written; the first step of a walk reads the program. It costs nothing
  function walk(by) {
    const dg = dbg ? dbg.dg : diagnose(lv, code), k = (dbg ? dbg.k : 0) + by;
    if (!dg.steps.length) return tip('Posa alguna ordre a F1 i després mira-la pas a pas.', 'oops');
    if (k < 0 || k > dg.steps.length) return;
    const st = dg.steps[k - 1], last = k === dg.steps.length;
    if (by < 0) pose(dg, k);
    else {
      if (!dbg) pose(dg, 0);
      cb.querySelectorAll('.trail').forEach(e => e.classList.remove('trail')); cb.querySelector('.plan')?.remove();
      const s = code[st.f][st.i];
      if (st.skip) tone(392, 0, 0.08, 0.04);
      else if (st.turn) { ang += 90 * st.turn; put(at[0], at[1]); tone(440, 0, 0.1, 0.05); }
      else if (s.op !== 'f') tone(660, 0, 0.12, 0.06);
      else if (g.cells.has(st.x + ',' + st.y)) { put(st.x, st.y); tone(330, 0, 0.12, 0.06); }
      else sink();
      if (st.star) { cb.querySelector(`[data-k="${st.star}"]`).classList.remove('star'); count(got + 1); tone(1047, 0, 0.3, 0.1); }
      $('#stk').innerHTML = stackOf(st);
    }
    dbg = { dg, k }; mark = st ? { f: st.f, i: st.i, kind: st.skip ? 'skip' : 'run' } : null; reveal = null;
    drawCode(); bar();
    if (!k) return tip(lv.tip);
    const off = k - 1 === dg.k && (dg.kind === 'off' || dg.kind === 'fall'), won = last && dg.end === 'win';
    tip(tell(dg, k) + (off && dg.kind === 'off' ? ' Aquí el coet surt del camí.' : '')
      + (won ? ' Totes les estrelles! Aquest programa funciona: prem Engega.' : last && dg.end === 'end' ? " I aquí s'acaben les ordres." : last && dg.end === 'fuel' ? " I així sense parar: el programa no s'acaba mai." : ''),
      off ? 'oops' : won ? 'go' : '');
  }
  // what went wrong, as it was seen on the board
  function what(dg) {
    const left = g.stars.size - route[dg.j].got;
    switch (dg.kind) {
      case 'fall': return `Xof! El coet mirava ${DIR[dg.d]} i ha fet «↑» (${where(dg.steps[dg.k])}): davant no hi havia camí.`;
      case 'off': return `Aquí el coet surt del camí: mirava ${DIR[dg.d]} i ha fet «↑» (${where(dg.steps[dg.k])}), però les estrelles són cap a un altre costat.`;
      case 'end': return `S'han acabat les ordres i el coet s'ha quedat aquí, mirant ${DIR[dg.d]}. ${left === 1 ? 'Encara queda 1 estrella' : `Encara queden ${left} estrelles`}.`;
      default: return "El programa no s'acaba mai i el coet ja no avança pel camí: s'ha quedat sense combustible.";
    }
  }
  // why it went wrong: what the rocket needed at that tile and what the program gave it
  function why(dg) {
    const empty = code.flat().filter(s => !s).length;
    if (dg.kind === 'end') return empty ? `${empty === 1 ? 'Encara tens 1 casella buida' : `Encara tens ${empty} caselles buides`}. Mira cap on mira el coet i segueix el camí de llums: quina ordre ve ara?`
      : /[123]/.test(lv.cmds) ? 'Totes les caselles són plenes i encara falta camí: no pots escriure cada pas. Busca el tros del camí que es repeteix, escriu-lo un sol cop i fes que torni a començar.'
      : 'Totes les caselles són plenes i encara falta camí: hi ha alguna ordre que sobra. Ves enrere amb ◀ i busca una ordre que no ajudi el coet a seguir el camí.';
    if (dg.kind === 'fuel') return 'Mira amb ▶ el tros que es repeteix, ordre per ordre: cap de les seves ordres fa avançar el coet pel camí. Hi falta un «↑», o bé el «↑» només es fa en un color on el coet no és.';
    const rel = (dg.want - dg.d + 4) % 4, col = tileName(dg.x, dg.y);
    if (!dg.turns.length) {
      const sk = dg.skipped.map(k => dg.steps[k]).find(st => 'LR'.includes(code[st.f][st.i].op));
      if (sk) return `El programa té un gir (${where(sk)}), però s'ha saltat: és només per al ${CNAME[code[sk.f][sk.i].c]} i aquí el coet és al ${col}. De quin color és la casella on cal girar?`;
      return rel === 2 ? "Les estrelles són darrere del coet, i el coet no sap anar enrere. Abans d'aquest «↑» cal fer mitja volta: dos girs seguits."
        : `Aquí el camí gira cap a ${rel === 1 ? 'la dreta' : "l'esquerra"} del coet, i el coet ha avançat sense girar. Abans d'aquest «↑» hi falta un gir, o bé hi ha un «↑» de més.`;
    }
    if (dg.d0 === dg.want) return `Aquí el camí segueix recte, ${DIR[dg.want]}, però el coet ha girat i ha quedat mirant ${DIR[dg.d]}. En aquesta casella${lv.conds ? `, que és de color ${col},` : ''} el gir sobra.`;
    return `El coet ha girat, però ha quedat mirant ${DIR[dg.d]} i el camí va ${DIR[dg.want]}. `
      + (dg.turns.length === 1 && rel === 2 ? "El gir és cap a l'altre costat: posa't al lloc del coet i mira cap on mira ell." : 'Compta els girs que fa el coet en aquesta casella.');
  }
  // The board at the fault of a program that does not win: the rocket where it went wrong, the way on in lights and the order to
  // look at marked (the last turn before an advance that leaves the route, or that advance). tgt marks another slot instead
  function fault(dg, txt, tgt) {
    const bad = dg.kind === 'fall' || dg.kind === 'off', st = bad ? dg.steps[dg.turns.length ? dg.turns[dg.turns.length - 1] : dg.k] : null;
    dbg = { dg, k: dg.k }; pose(dg, dg.k); lights(dg.j);
    mark = tgt ? { f: tgt[0], i: tgt[1], kind: code[tgt[0]][tgt[1]] ? 'think' : 'next' } : st ? { f: st.f, i: st.i, kind: 'think' } : null;
    if (mark) sel = [mark.f, mark.i];
    drawCode(); bar(); tip(txt, 'oops'); look();
  }

  async function go() {
    const dg = diagnose(lv, code);
    if (!dg.steps.length) return tip('Posa alguna ordre a F1 i torna a prémer Engega.', 'oops');
    mark = reveal = dbg = null; setup(); drawCode(); bar(); root.querySelector('.slot.sel')?.classList.remove('sel');
    const me = launch(), alive = () => me.on && t.on;
    tip(lv.tip); look(); tone(523, 0, 0.15);
    // after asking for a hint the rocket flies slower, so each order can be followed; a program that never stops is cut short
    if (!await fly(dg.end === 'fuel' ? dg.steps.slice(0, 40) : dg.steps, me, slow ? 700 : STEP)) return;
    if (dg.end === 'win') {
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
    if (dg.end === 'fall') sink(); else buzz();
    await sleep(900); if (!alive()) return;
    // the flight is not wiped: the rocket goes back to where it went wrong, to be looked at
    job = null; runb.textContent = '▶ Engega';
    fault(dg, what(dg) + ' Mira-ho ordre per ordre amb ◀ i ▶, o prem Pista.');
  }

  // A hint goes up one rung each time it is asked about the same fault. With nothing written it is about reading the level: be the
  // rocket along the painted route, count the orders against the slots, then what the level is about. With a program that does not
  // win it is about the fault: the flight replayed slowly up to it and why it happens there, then what the level is about, with the
  // route painted in its pieces. A program that only ran out of orders, in a level where the route does not fit order by order, has
  // no fault to explain: it goes straight to the pieces. The last rung gives away one order: the first slot that differs from the
  // reference program
  async function coach() {
    slow = true;
    const dg = diagnose(lv, code);
    if (dg.kind === 'win') return tip('Aquest programa ja funciona! Prem Engega i mira com vola.', 'go');
    slips++; streak = 0; worth();
    const none = !dg.steps.length, bad = dg.kind === 'fall' || dg.kind === 'off', key = none ? 'none' : [dg.kind, dg.j, bad ? where(dg.steps[dg.k]) : ''].join();
    rung = [key, rung[0] === key ? rung[1] + 1 : 1];
    const n = rung[1], give = n >= (gave ? 2 : none ? 4 : 3), seen = !!dbg;
    let tgt = [0, 0];
    lv.ref.some((fn, f) => fn.some((b, i) => { const a = code[f][i]; return (!a || a.op !== b.op || (a.c || null) !== b.c) && (tgt = [f, i]); }));
    const given = () => { gave = true; reveal = lv.ref[tgt[0]][tgt[1]]; return "Una manera de fer-ho: l'ordre que brilla a baix és la que va a la casella marcada."; };
    mark = reveal = null; root.querySelector('.slot.sel')?.classList.remove('sel');
    const calls = /[123]/.test(lv.cmds), moves = route.length - 1, need = moves + route.turns;
    const see = `Mira el camí pintat${code.length > 1 ? ': cada tros és feina de la funció que hi diu' : calls ? ': cada tros és una volta sencera de F1' : ''}.${route.turns ? ' A les rotllanes toca girar.' : ''} `;
    if (none) {
      dbg = null; setup(); paint();
      const txt = give ? given()
        : n === 1 ? (calls ? see + lv.hints[0] : "Abans d'escriure res, fes de coet: segueix el camí pintat amb el dit, des del coet fins a l'última estrella, i digues cada pas en veu alta: «endavant», «gira»…" + (route.turns ? ' A les rotllanes toca girar.' : ''))
        : n === 2 ? `Escrit pas per pas, el camí demana ${need} ordres: ${moves} «↑»${route.turns ? ` i ${route.turns === 1 ? '1 gir' : route.turns + ' girs'}` : ''}. Tens ${total} caselles. `
          + (need > total ? 'No hi caben! Busca el tros del camí que es repeteix. ' : calls ? '' : 'Hi caben: escriu-les en el mateix ordre que les has dit. ') + (calls ? '' : lv.hints[0])
        : lv.hints[lv.hints.length - 1] + ' Si encara no ho veus, torna a prémer Pista i et diré la primera ordre.';
      if (give) { mark = { f: tgt[0], i: tgt[1], kind: 'next' }; sel = tgt; }
      drawCode(); bar(); look(); return tip(txt);
    }
    // the program was changed since the board last showed its fault: fly it again, slowly, as far as the fault
    if (!seen) {
      const steps = dg.steps.slice(0, Math.min(40, bad ? dg.k + 1 : dg.steps.length)), me = launch();
      dbg = null; setup(); drawCode(); bar(); tip('Mirem què fa el teu programa…'); look();
      if (!await fly(steps, me, 700)) return;
      if (dg.kind === 'fall' && steps.length > dg.k) { sink(); await sleep(900); if (!me.on || !t.on) return; }
      job = null; runb.textContent = '▶ Engega';
    }
    if (give) { const txt = given(); return fault(dg, txt, tgt); }
    const tight = dg.kind === 'end' && calls && need > total;
    if (n === 1 && !tight) return fault(dg, (seen ? '' : what(dg) + ' ') + why(dg));
    fault(dg, (n === 1 ? `Pas per pas calen ${need} ordres i només tens ${total} caselles: no hi caben. ` : '') + see + lv.hints[asks++ % lv.hints.length] + ' Si encara no surt, torna a prémer Pista.');
    paint();
  }

  $('#prog').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b === runb) return job ? stop() : go();
    if (job) return;
    if (b.id === 'hintb') return coach();
    if (b.id === 'sb' || b.id === 'sf') return walk(b.id === 'sf' ? 1 : -1);
    if (b.classList.contains('slot')) sel = [+b.dataset.f, +b.dataset.i];
    else if ('c' in b.dataset) brush = b.dataset.c;
    else if (b.dataset.op === 'x') code[sel[0]][sel[1]] = null;
    else if (b.dataset.op) {
      code[sel[0]][sel[1]] = { op: b.dataset.op, c: brush || null }; brush = ''; tone(784, 0, 0.08, 0.05);
      if (sel[1] + 1 < code[sel[0]].length) sel = [sel[0], sel[1] + 1];
    }
    // an empty program starts the level again: the rocket back on its first tile, every star back and the tip of the level
    else if (b.id === 'clr') { code.forEach(fn => fn.fill(null)); sel = [0, 0]; setup(); tip(lv.tip); }
    // any other change to the program clears the hint marks and ends a walk step by step; the board and its lights stay until the next flight
    if (!('c' in b.dataset)) mark = reveal = null;
    if (b.dataset.op || b.id === 'clr') dbg = null;
    drawCode(); bar();
  };
  tip(lv.tip); setup(); drawCode(); bar(); worth();
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
// a screen that is not a level: the way back is the map
function scene(kicker, hue, home = false) { const t = fresh(); show(kicker, true, home); FX.mood(hue); back = mapa; $('#toM').textContent = '← Mapa'; return t; }

/* ---------- the Piscina: three first questions, the first thing a profile with nothing saved meets ---------- */
// The third one saves piscina and opens the map. The way back is the page of all games: the map would have every circle shut.
function piscina() {
  const t = scene('El coet · La Piscina', 205, true);
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
entra();
