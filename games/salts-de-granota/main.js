import { $, RM, sleep, mid } from '../../shared/util.js';
import { voice, pentatonic } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { load, save as store } from '../../shared/progress.js';
import { pick, bar, cub, num, make, sums, PROJECTS, PLAN, CIRCLES, NEG, VALID, EXAM_PASS, RAPID, pool, clean, noteOf, reached, validated, levelText, isOpen, examOpen,
  circleOf, BADGES, badges, levelIn, poolIn, streakIn, rapidIn, fliesIn, exam, examIn, sprint, sheet, sheetIn } from './logic.js';

const KEY = 'salts-de-granota';
// ?obert at the end of the address opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = new URLSearchParams(location.search).has('obert');
const root = $('#joc');

// Facts only: { so, lv, piscina, exams, fulls, rapid, ratxa, mosques }. clean() makes a complete progress out of anything the browser
// holds, the save from before the cursus too
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, fill] = box.children;
  n.textContent = `Nivell ${lv}`; fill.setAttribute('aria-label', `${pct} % del nivell`); fill.firstChild.style.width = pct + '%';
}

// every screen change cancels running animations and the keypad through this token
let tok = { on: true }, keyFn = null;
function fresh() { tok.on = false; tok = { on: true }; keyFn = null; return tok; }

const { tone, chime } = voice(() => prog.so);
// the longer the streak, the higher the note
const noteAt = pentatonic(392);
const FX = pond(tone);
const buzz = () => tone(150, 0, 0.45, 0.16, 'triangle');
const fanfare = () => chime([523, 659, 784, 1047, 1319]);
// right answers in a row at the first try, and the longest run since the page opened
let streak = 0, top = 0;

/* ---------- figures ---------- */
// the frog sits with its feet at 0,0; its eyelids blink
const FROG = `<g class="frog-art"><ellipse cx="-22" cy="-7" rx="13" ry="8" fill="#3C9A50" stroke="#1F6030" stroke-width="2"/><ellipse cx="22" cy="-7" rx="13" ry="8" fill="#3C9A50" stroke="#1F6030" stroke-width="2"/>
  <ellipse cx="0" cy="-19" rx="23" ry="18" fill="#58C46C" stroke="#1F6030" stroke-width="2"/><ellipse cx="0" cy="-12" rx="14" ry="9.500" fill="#D5F8C4"/>
  <circle cx="-11" cy="-36" r="9" fill="#58C46C" stroke="#1F6030" stroke-width="2"/><circle cx="11" cy="-36" r="9" fill="#58C46C" stroke="#1F6030" stroke-width="2"/>
  <circle cx="-11" cy="-37" r="6" fill="#fff"/><circle cx="11" cy="-37" r="6" fill="#fff"/><circle cx="-10" cy="-37" r="3.200" fill="#06220D"/><circle cx="12" cy="-37" r="3.200" fill="#06220D"/>
  <circle cx="-9" cy="-38.300" r="1.100" fill="#fff"/><circle cx="13" cy="-38.300" r="1.100" fill="#fff"/>
  <g class="lid" fill="#58C46C"><circle cx="-11" cy="-37" r="6.600"/><circle cx="11" cy="-37" r="6.600"/></g>
  <ellipse cx="-17" cy="-24" rx="4" ry="2.500" fill="#FF8FD0" opacity="0.75"/><ellipse cx="17" cy="-24" rx="4" ry="2.500" fill="#FF8FD0" opacity="0.75"/>
  <path d="M-9 -24 Q0 -16 9 -24" fill="none" stroke="#1F6030" stroke-width="2.400" stroke-linecap="round"/>
  <ellipse cx="-10" cy="-3" rx="6" ry="3.500" fill="#3C9A50" stroke="#1F6030" stroke-width="1.600"/><ellipse cx="10" cy="-3" rx="6" ry="3.500" fill="#3C9A50" stroke="#1F6030" stroke-width="1.600"/></g>`;
const frog = (cls = '') => `<svg class="frog-s ${cls}" viewBox="-38 -50 76 58" aria-hidden="true">${FROG}</svg>`;
// a lily pad seen from the side of the pond, with its notch, and the flower that opens on it
const PAD = 'M0 0L27 -3A28 11 0 1 0 27 3Z';
const FLOWER = `<g class="fl">${[0, 72, 144, 216, 288].map(r => `<ellipse cy="-6" rx="3.800" ry="6.200" transform="rotate(${r})"/>`).join('')}<circle r="3.600"/></g>`;
const pad = (cls = '') => `<svg class="pad ${cls}" viewBox="-30 -24 60 38" aria-hidden="true"><path class="lp" d="${PAD}"/><g transform="translate(-4 -8)">${FLOWER}</g></svg>`;
// the lily pad of a project on the map, seen from above
const ORB = `<svg class="pad orb" viewBox="-26 -26 52 52" aria-hidden="true"><path class="lp" d="M0 0L23 -7A24 24 0 1 0 23 7Z"/><path class="vein" d="M0 0L-22 -8M0 0L-22 8M0 0L-8 -22M0 0L-8 22"/><g transform="translate(-3 0) scale(1.5)">${FLOWER}</g></svg>`;
const FLY = `<svg class="fly" viewBox="-12 -10 24 20" aria-hidden="true"><ellipse cx="-4" cy="-4" rx="6" ry="3.500" fill="#CFF6FF" opacity="0.8" transform="rotate(-25 -4 -4)"/><ellipse cx="4" cy="-4" rx="6" ry="3.500" fill="#CFF6FF" opacity="0.8" transform="rotate(25 4 -4)"/><ellipse cy="2" rx="5.500" ry="4.200" fill="#F7C64E"/><circle cx="5" cy="1" r="2.600" fill="#2A1C00"/></svg>`;
const STAR = '<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -10.500L3.100 -3.600 10.500 -2.800 5 2.300 6.500 9.700 0 6 -6.500 9.700 -5 2.300 -10.500 -2.800 -3.100 -3.600Z"/></svg>';

/* ---------- pictures: ten lily pads for the friends of 10, bars and cubes for the tens, two rows for the doubles, a number line for the rest ----------
   Each picture has n moves. jump(i, mask) plays move i; with mask, the move that ends on the result shows "?" in its place,
   and reveal() writes the result there. A hint plays one more move each time it is asked. */
const Viz = (host, p) => ({ frame: frameViz, blocks: blockViz, twin: twinViz, line: lineViz })[p.viz](host, p);
// adding fills the empty pads with new flowers; taking away starts with ten flowers and some leave
function frameViz(host, p) {
  const keep = p.sub ? p.ans : p.a, first = i => p.sub || i < keep ? 'on' : '';
  host.innerHTML = `<div class="frame" role="img" aria-label="Deu nenúfars, ${p.sub ? 10 : keep} amb flor">${Array.from({ length: 10 }, (_, i) => `<span class="${first(i)}"></span>`).join('')}</div>`;
  const pads = [...host.querySelectorAll('span')];
  return {
    n: 1,
    async jump() { for (let i = keep; i < 10; i++) { pads[i].className = p.sub ? 'gone' : 'new'; tone(noteAt(i), 0, 0.12, 0.05); await sleep(RM ? 0 : 240); } },
    // counts the flowers that make the result: the new ones when adding, the ones left when taking away
    reveal() { pads.forEach((e, i) => { const k = p.sub ? (i < keep ? i + 1 : 0) : i - keep + 1; if (k > 0) e.innerHTML = `<b>${k}</b>`; }); },
    reset() { pads.forEach((e, i) => { e.className = first(i); e.replaceChildren(); }); }
  };
}
// tens as bars, units as cubes: ten loose cubes turn into a new bar, or a bar breaks into ten cubes to take some away
function blockViz(host, p) {
  const u = p.a % 10, t = (p.a - u) / 10;
  host.innerHTML = `<div class="blocks"><div class="col"><span class="h">Desenes</span><div class="bars"></div></div><div class="col"><span class="h">Unitats</span><div class="cubes"></div></div></div><p class="split"></p>`;
  const bars = $('.bars', host), cubes = $('.cubes', host), sp = $('.split', host);
  const add = (to, cls) => { const e = document.createElement('i'); e.className = cls; to.appendChild(e); return e; };
  // the line under the blocks once the last move is done: what is on the table, then the result or "?"
  const what = p.sub ? `${bar(t - 1)} i ${cub(10 - p.b)}` : bar(t + 1);
  let end = false;
  const total = mask => { end = true; sp.innerHTML = `<b>${what}</b> = ${mask ? '<b class="q">?</b>' : p.ans}`; };
  function reset() {
    bars.replaceChildren(); cubes.replaceChildren(); cubes.className = 'cubes'; end = false;
    for (let i = 0; i < t; i++) add(bars, 'bar');
    for (let i = 0; i < u; i++) add(cubes, 'cube');
    sp.innerHTML = `${bar(t)} i ${cub(u)}`;
  }
  async function take(i, mask) {
    if (i === 0) {
      bars.lastChild.classList.add('new'); await sleep(RM ? 0 : 600);
      bars.lastChild.remove(); tone(330, 0, 0.2, 0.08);
      for (let k = 0; k < 10; k++) add(cubes, 'cube new');
      sp.innerHTML = `${bar(t - 1)} i <b>10 cubets</b>`;
      return;
    }
    for (let k = 0; k < p.b; k++) { cubes.lastChild.remove(); tone(noteAt(9 - k), 0, 0.12, 0.05); await sleep(RM ? 0 : 200); }
    total(mask);
  }
  async function jump(i, mask) {
    if (p.sub) return take(i, mask);
    if (i === 0) {
      for (let k = 0; k < p.b; k++) { add(cubes, 'cube new'); tone(noteAt(u + k), 0, 0.12, 0.05); await sleep(RM ? 0 : 200); }
      sp.innerHTML = `${bar(t)} i <b>${u} + ${p.b} = 10 cubets</b>`;
      return;
    }
    cubes.classList.add('full'); await sleep(RM ? 0 : 600);
    const r0 = cubes.getBoundingClientRect();
    cubes.replaceChildren(); cubes.className = 'cubes';
    const nb = add(bars, 'bar new'), r1 = nb.getBoundingClientRect();
    if (!RM && nb.animate) await nb.animate([{ transform: `translate(${r0.left - r1.left}px, ${r0.top - r1.top}px)` }, { transform: 'none' }], { duration: 700, easing: 'ease-in-out' }).finished;
    tone(523, 0, 0.25, 0.08);
    total(mask);
  }
  reset();
  return { n: 2, jump, reset, reveal() { if (end) total(false); } };
}
// a double is two equal rows of flowers; a near double has one flower more in the second row
function twinViz(host, p) {
  const a = p.a, twin = p.b === a, row = n => `<div class="trow">${Array.from({ length: n }, (_, i) => `<i${i >= a ? ' class="extra"' : ''}></i>`).join('')}</div>`;
  host.innerHTML = `<div class="twin" style="--n:${p.b}" role="img" aria-label="Dues files: ${a} i ${p.b} flors">${row(a)}${row(p.b)}</div><p class="split"></p>`;
  const rows = [...host.querySelectorAll('.trow')], sp = $('.split', host);
  let end = false;
  const total = mask => { end = true; sp.innerHTML = `${twin ? `<b>${a} + ${a}</b>` : `<b>${2 * a} + 1</b>`} = ${mask ? '<b class="q">?</b>' : p.ans}`; };
  function reset() { host.querySelectorAll('.trow i').forEach(e => e.classList.remove('on')); end = false; sp.innerHTML = `${a} i ${p.b}`; }
  async function jump(i, mask) {
    if (i === 0) {
      // the two rows light up in pairs
      for (let k = 0; k < a; k++) { rows.forEach(r => r.children[k].classList.add('on')); tone(noteAt(k), 0, 0.12, 0.05); await sleep(RM ? 0 : 150); }
      if (twin) total(mask); else sp.innerHTML = `<b>${a} + ${a} = ${2 * a}</b> i 1 més`;
      return;
    }
    rows[1].lastChild.classList.add('on'); tone(noteAt(a + 2), 0, 0.2, 0.07);
    total(mask);
  }
  reset();
  return { n: twin ? 1 : 2, jump, reset, reveal() { if (end) total(false); } };
}
// The frog on the number line: a strip of water with a lily pad wherever it lands. Below zero the water is deeper.
// When the answer is the hops added up (p.gap), a line under the picture adds them.
function lineViz(host, p) {
  // a narrow screen gets a shorter line with less room at the ends, so the numbers stay readable
  const tight = host.clientWidth < 560, VW = tight ? 640 : 1000;
  const pts = [p.from ?? p.a, ...p.jumps.map(j => j.to)], min = Math.min(...pts), max = Math.max(...pts), m = Math.max(tight ? 1 : 2, Math.round((max - min) * 0.05));
  const lo = min - m, hi = max + m, wide = hi - lo;
  // a long line has a tick every 5 or every 10, and fewer numbers under it
  const every = wide <= 46 ? 1 : wide <= 120 ? 5 : 10, named = wide <= 24 ? 5 : wide <= (tight ? 70 : 120) ? 10 : 20;
  const X = n => 50 + (n - lo) / wide * (VW - 100), Y = 150, low = lo < 0, NS = 'http://www.w3.org/2000/svg';
  let s = `<svg class="nl" viewBox="0 0 ${VW} ${low ? 236 : 212}" role="img" aria-label="Recta numèrica: ${num(lo)} a ${num(hi)}">
    <rect class="water" x="8" y="${Y - 9}" width="${VW - 16}" height="30" rx="15"/>`;
  if (low) s += `<rect class="deep" x="8" y="${Y - 9}" width="${X(0) - 8}" height="30" rx="15"/><text class="zl" x="${(8 + X(0)) / 2}" y="228">sota zero</text><line class="zero" x1="${X(0)}" x2="${X(0)}" y1="${Y - 22}" y2="${Y + 30}"/>`;
  for (let n = Math.ceil(lo / every) * every; n <= hi; n += every) {
    s += `<line class="tick${n % 10 ? '' : ' ten'}" x1="${X(n)}" x2="${X(n)}" y1="${Y + 1}" y2="${Y + (n % 10 ? 13 : 19)}"/>`;
    if (n % named === 0) s += `<text class="tl" data-n="${n}" x="${X(n)}" y="${Y + 52}">${num(n)}</text>`;
  }
  host.innerHTML = s + `<g class="dyn"></g><g class="frog">${FROG}</g></svg>${p.gap ? '<p class="split"></p>' : ''}`;
  const dyn = $('.dyn', host), jumper = $('.frog', host), sp = $('.split', host), SC = tight ? 1.25 : 1.1;
  const mk = (tag, at, txt) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; dyn.appendChild(e); return e; };
  const sit = (x, y, sq = 0) => jumper.setAttribute('transform', `translate(${x} ${y - 4}) scale(${SC * (1 - 0.1 * sq)} ${SC * (1 + 0.18 * sq)})`);
  // hid writes the result where "?" is; pads remembers the number under each pad, to clear the ones that would be written over
  let hid = null, pads = [];
  function land(n, mask) {
    const x = X(n);
    host.querySelectorAll('.tl').forEach(t => { if (Math.abs(+t.getAttribute("x") - x) < 66) t.setAttribute('visibility', 'hidden'); });
    pads = pads.filter(q => Math.abs(q.x - x) >= 60 || (q.lab.remove(), false));
    mk('path', { class: 'lp', d: PAD, transform: `translate(${x} ${Y})` });
    const lab = mk('text', { class: mask ? 'pl q' : 'pl', x, y: Y + 54 }, mask ? '?' : num(n));
    pads.push({ x, lab });
    if (mask) hid = () => { lab.textContent = num(n); lab.setAttribute('class', 'pl'); };
  }
  const added = mask => { sp.innerHTML = `<b>${p.jumps.map(j => j.lab.slice(1)).join(' + ')}</b> = ${mask ? '<b class="q">?</b>' : p.ans}`; };
  function reveal() { if (hid) { hid(); hid = null; } }
  function reset() {
    dyn.replaceChildren(); host.querySelectorAll('.tl').forEach(t => t.removeAttribute('visibility')); hid = null; pads = [];
    if (sp) sp.innerHTML = '&nbsp;';
    land(pts[0]); sit(X(pts[0]), Y);
  }
  async function jump(i, mask) {
    const x1 = X(pts[i]), x2 = X(pts[i + 1]), dx = Math.abs(x2 - x1), h = Math.min(100, 36 + dx * 0.15), mx = (x1 + x2) / 2, back = x2 < x1 ? ' back' : '', end = i === p.jumps.length - 1;
    const arc = mk('path', { class: 'arc' + back, d: `M${x1} ${Y - 10} Q${mx} ${Y - 10 - 2 * h} ${x2} ${Y - 10}`, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 });
    const dur = RM ? 0 : Math.min(950, 380 + dx);
    const t0 = performance.now();
    tone(back ? 330 : 440, 0, 0.14, 0.06);
    await new Promise(done => {
      (function frame(now) {
        const t = dur ? Math.min(1, (now - t0) / dur) : 1, q = 1 - t;
        arc.setAttribute('stroke-dashoffset', q);
        sit(q * q * x1 + 2 * q * t * mx + t * t * x2, Y - 4 * h * q * t, Math.sin(Math.PI * t));
        t < 1 ? requestAnimationFrame(frame) : done();
      })(t0);
    });
    // a single hop that is the whole answer keeps its size secret
    const secret = mask && p.gap && p.jumps.length === 1, lab = mk('text', { class: 'jl' + back + (secret ? ' q' : ''), x: mx, y: Y - 10 - h - 12 }, secret ? '?' : p.jumps[i].lab);
    land(pts[i + 1], mask && !p.gap && pts[i + 1] === p.ans);
    if (p.gap && end) { added(mask); if (mask) hid = () => { lab.textContent = p.jumps[i].lab; lab.setAttribute('class', 'jl' + back); added(false); }; }
    // the frog lands on the pad with a splash
    if (jumper.isConnected) { const c = mid(jumper), hue = back ? 45 : 190; FX.ring(c.x, c.bottom, hue, 4, c.w * 1.1); FX.burst(c.x, c.bottom, hue, 12, 110); tone(back ? 494 : 659, 0, 0.2, 0.07); }
  }
  reset();
  return { n: p.jumps.length, jump, reset, reveal };
}

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
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
const flies = n => n === 1 ? '1 mosca' : `${n} mosques`;
const hits = n => n === 1 ? '1 encert' : `${n} encerts`;

/* ---------- the page around every screen ---------- */
// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /salts-de-granota\.html$/.test(location.pathname);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('in', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
  root.onclick = null; FX.mood(hue);
}
$('#toS').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };
// the longest run goes in with whatever is being handed in: gives back the badges it earns
function run() { const r = streakIn(prog, top); prog = r.prog; return r.news; }
function drawCombo() {
  const e = $('#cb'); if (!e) return;
  e.hidden = streak < 3; e.textContent = `Ratxa ×${streak}`;
  if (streak >= 3) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
}
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
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c);
const starsOf = i => prog.lv.slice(i * 10, i * 10 + 10);
const noteText = i => { const n = noteOf(prog, i), d = starsOf(i).filter(Boolean).length; return n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer'; };
const examBtn = c => `<button class="proj exam${prog.exams[c] ? ' ok' : ''}" data-x="${c}" aria-label="Examen del cercle ${c}"${openX(c) ? '' : ' disabled'}><b>Examen</b><span class="mk">${prog.exams[c] ? 'Superat ✓' : openX(c) ? 'Sis operacions' : openC(c) ? 'Valida els projectes' : 'Tancat'}</span></button>`;
// one line that says what to do now: the first project of an open circle that is not validated, or its exam; nothing when all is done
function advice() {
  for (let c = 0; c < CIRCLES.length; c++) {
    if (!isOpen(prog, c)) continue;
    const i = CIRCLES[c].projects.find(i => noteOf(prog, i) < VALID);
    if (i !== undefined) return `Ara toca: ${PROJECTS[i].name}`;
    if (!prog.exams[c]) return `Ara toca: l'examen del cercle ${c}`;
  }
  return '';
}
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  fresh(); show('Càlcul mental · el mapa', false, 165);
  const band = c => `<section class="ring${openC(c) ? '' : ' shut'}" style="--rh:${HUE[c]}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}" style="--h:${HUE[c]}"${openC(c) ? '' : ' disabled'}>${ORB}<b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span>
        <span class="pp" aria-hidden="true">${starsOf(i).map(s => `<i class="s${s}"></i>`).join('')}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice(), any = OPEN || prog.lv.some(Boolean);
  root.innerHTML = `<div class="map">${tip ? `<p class="next">${tip}</p>` : ''}
    <p class="stats"><span>${FLY}<b>${prog.mosques}</b> ${prog.mosques === 1 ? 'mosca' : 'mosques'}</span><span>🔥 Ratxa més llarga: <b>${prog.ratxa}</b></span></p>
    ${CIRCLES.map((_, c) => band(c)).join('')}
    <div class="extra"><button class="btn soft" id="rapid">⚡ Repte llampec${prog.rapid ? ` · rècord ${prog.rapid}` : ''}</button>
      <button class="btn soft" id="full"${any ? '' : ' disabled title="Fes un nivell per obrir-lo"'}>🔍 Caça l'errada</button>
      <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div></div>`;
  root.onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level that still has something to win, as far as the project is open
      const i = +b.dataset.p, k = starsOf(i).findIndex(n => n < 3);
      tone(523, 0, 0.2); nivell(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : reached(prog, i), 9));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
    else if (e.target.closest('#rapid')) llampec();
  };
  ($(`[data-p="${here}"]:not(:disabled)`, root) || $('button:not(:disabled)', root))?.focus({ preventScroll: true }); here = -1;
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
    // shown counts the moves of the picture already played; clean stays true while no hint and no miss
    let v = null, shown = 0, clean = true, miss = 0, busy = false, done = false;
    o.chip?.(p.re ? 'Repàs' : o.secs ? hits(st.hits) : `Operació ${st.res.length + 1} de ${n}`, st);
    stage.innerHTML = `${EQ}<div id="viz"${o.pic ? '' : ' hidden'}></div>${o.pic ? `<p class="hint">${p.hint}</p>` : ''}<p id="msg" role="status"></p>${keysHtml(o.neg)}
      ${o.hints ? '<div class="row"><button class="btn soft" id="hintb">Pista</button></div>' : ''}`;
    const hb = $('#hintb'), msg = $('#msg');
    const say = (txt, cls) => { msg.textContent = txt; msg.className = cls || ''; };
    if (o.pic) {
      v = Viz($('#viz'), p);
      // an answer typed while the first leap is being drawn is checked when it lands
      if (p.pre) { busy = true; shown = 1; v.jump(0).then(() => { if (alive()) { busy = false; kp.auto(); } }); }
    }
    // a hint is a picture, never words: the frog makes its next move, and the place where the result goes shows "?".
    // Asked again once every move is on screen, the picture gives the result away.
    if (hb) hb.onclick = async () => {
      if (busy || done) return;
      busy = true; clean = false; hb.classList.remove('glow'); say(''); hb.blur();
      if (!v) { $('#viz').hidden = false; v = Viz($('#viz'), p); }
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
  show(`Cercle ${c} · ${S.name}`, true, HUE[c]); here = i;
  root.innerHTML = `${HUD(`Nivell ${idx + 1} · ${L.kind}`)}<nav class="levels" aria-label="Nivells"></nav><div class="play" id="play"></div>`;
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
      if (await demo(p, Viz($('#viz'), p), $('#cap'), { get on() { return me.on && t.on; } })) $('#big').textContent = p.eq;
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
  const t = fresh(); show('La Piscina', true, 190); $('#toS').hidden = true; $('#toG').hidden = !HUB;
  root.innerHTML = `${HUD("Tres salts per entrar a l'estany")}<div class="play" id="play"></div>`;
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
  const t = fresh(), qs = exam(c); show(`Examen del cercle ${c}`, true, HUE[c]);
  root.innerHTML = `${HUD('Sis operacions · un sol intent')}<div class="play" id="play"></div>`;
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
  const t = fresh(); show('Repte llampec', true, 48);
  root.innerHTML = `<div class="play intro"><h2>⚡ Repte llampec</h2><p class="lead">${RAPID} segons d'operacions amb els trucs que ja coneixes, un sol intent per a cada una. Escriu el resultat i ja està: no cal prémer ✓. Quantes n'encertaràs?</p>
    ${prog.rapid ? `<p class="lead sun">El teu rècord: ${prog.rapid}</p>` : ''}<div class="row"><button class="btn" id="go">Comença!</button></div></div>`;
  $('#go').focus({ preventScroll: true });
  $('#go').onclick = () => {
    if (!t.on) return;
    root.innerHTML = `${HUD('Repte llampec', false)}<div class="play" id="play"></div>`;
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
const SETTLE = 450;
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(prog, OPEN), marks = [];
  root.innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="Tres operacions">${'<i></i>'.repeat(cs.length)}</span></div>
    <div class="play"><div class="coach" id="coach">${frog('pilot')}<p class="tipb" id="tip" role="status" aria-live="polite"></p></div><div class="sheetbox" id="stage"></div><div class="tail" id="tail"></div></div>`;
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
