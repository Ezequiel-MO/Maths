import { $, RM, sleep, mid } from '../../shared/util.js';
import { voice, pentatonic } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { load as read, save as store } from '../../shared/progress.js';
import { pick, bar, cub, make, sums, load, opens, SECTIONS, PATH, PLAN } from './logic.js';

const KEY = 'salts-de-granota';
const root = $('#joc');

let prog = load(read(KEY));
const save = () => store(KEY, prog);

// every screen change cancels running animations and the keypad through this token
let tok = { on: true }, keyFn = null;
function fresh() { tok.on = false; tok = { on: true }; keyFn = null; return tok; }

const { tone, chime } = voice(() => prog.so);
// the longer the streak, the higher the note
const noteOf = pentatonic(392);
const FX = pond(tone);

const FROG = `<ellipse class="fb" cx="0" cy="-18" rx="21" ry="16"/><circle class="fe" cx="-10" cy="-33" r="8"/><circle class="fe" cx="10" cy="-33" r="8"/><circle class="fp" cx="-10" cy="-33" r="3.2"/><circle class="fp" cx="10" cy="-33" r="3.2"/><path class="fm" d="M-8 -14 Q0 -8 8 -14"/>`;

/* ---------- pictures: ten lily pads for the friends of 10, bars and cubes for the tens, a number line for the rest ----------
   Each picture has n moves. jump(i, mask) plays move i; with mask, the move that ends on the result shows "?" in its place,
   and reveal() writes the result there. A hint plays one more move each time it is asked. */
function Viz(host, p) {
  if (p.type === 1 || p.type === 7) return frameViz(host, p);
  return p.type === 2 || p.type === 8 ? blockViz(host, p) : lineViz(host, p);
}
// adding fills the empty pads with new flowers; taking away starts with ten flowers and some leave
function frameViz(host, p) {
  const keep = p.sub ? p.ans : p.a, first = i => p.sub || i < keep ? 'on' : '';
  host.innerHTML = `<div class="frame" role="img" aria-label="Deu nenúfars, ${p.sub ? 10 : keep} amb flor">${Array.from({ length: 10 }, (_, i) => `<span class="${first(i)}"></span>`).join('')}</div>`;
  const pads = [...host.querySelectorAll('span')];
  return {
    n: 1,
    async jump() { for (let i = keep; i < 10; i++) { pads[i].className = p.sub ? 'gone' : 'new'; tone(noteOf(i), 0, 0.12, 0.05); await sleep(RM ? 0 : 240); } },
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
    for (let k = 0; k < p.b; k++) { cubes.lastChild.remove(); tone(noteOf(9 - k), 0, 0.12, 0.05); await sleep(RM ? 0 : 200); }
    total(mask);
  }
  async function jump(i, mask) {
    if (p.sub) return take(i, mask);
    if (i === 0) {
      for (let k = 0; k < p.b; k++) { add(cubes, 'cube new'); tone(noteOf(u + k), 0, 0.12, 0.05); await sleep(RM ? 0 : 200); }
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
function lineViz(host, p) {
  // a narrow screen gets a shorter line with less room at the ends, so the numbers stay readable
  const tight = host.clientWidth < 560, VW = tight ? 640 : 1000, m = tight ? 1 : 2;
  const pts = [p.a, ...p.jumps.map(j => j.to)], lo = Math.min(...pts) - m, hi = Math.max(...pts) + m;
  const X = n => 50 + (n - lo) / (hi - lo) * (VW - 100), Y = 170, NS = 'http://www.w3.org/2000/svg';
  let s = `<svg class="nl" viewBox="0 0 ${VW} 232" role="img" aria-label="Recta numèrica: ${lo} a ${hi}"><line class="axis" x1="16" y1="${Y}" x2="${VW - 16}" y2="${Y}"/>`;
  for (let n = lo; n <= hi; n++) {
    s += `<line class="tick${n % 10 ? '' : ' ten'}" x1="${X(n)}" x2="${X(n)}" y1="${Y - 8}" y2="${Y + 8}"/>`;
    if (n % 10 === 0) s += `<text class="tl" data-n="${n}" x="${X(n)}" y="${Y + 48}">${n}</text>`;
  }
  host.innerHTML = s + `<g class="dyn"></g><g class="frog">${FROG}</g></svg>`;
  const dyn = $('.dyn', host), frog = $('.frog', host);
  const mk = (tag, at, txt) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; dyn.appendChild(e); return e; };
  const sit = (x, y) => frog.setAttribute('transform', `translate(${x} ${y})`);
  let hid = null;
  function pad(n, mask) {
    const t = host.querySelector(`.tl[data-n="${n}"]`); if (t) t.setAttribute('visibility', 'hidden');
    mk('ellipse', { class: 'lp', cx: X(n), cy: Y, rx: 25, ry: 9 });
    const lab = mk('text', { class: mask ? 'pl q' : 'pl', x: X(n), y: Y + 50 }, mask ? '?' : n);
    if (mask) hid = lab;
  }
  function reveal() { if (hid) { hid.textContent = p.ans; hid = null; } }
  function reset() {
    dyn.replaceChildren(); host.querySelectorAll('.tl').forEach(t => t.removeAttribute('visibility')); hid = null;
    pad(p.a); sit(X(p.a), Y);
  }
  async function jump(i, mask) {
    const x1 = X(pts[i]), x2 = X(pts[i + 1]), dx = Math.abs(x2 - x1), h = Math.min(108, 36 + dx * 0.15), mx = (x1 + x2) / 2, back = x2 < x1 ? ' back' : '';
    const arc = mk('path', { class: 'arc' + back, d: `M${x1} ${Y - 10} Q${mx} ${Y - 10 - 2 * h} ${x2} ${Y - 10}`, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 });
    const dur = RM ? 0 : Math.min(950, 380 + dx);
    const t0 = performance.now();
    tone(back ? 330 : 440, 0, 0.14, 0.06);
    await new Promise(done => {
      (function frame(now) {
        const t = dur ? Math.min(1, (now - t0) / dur) : 1, q = 1 - t;
        arc.setAttribute('stroke-dashoffset', q);
        sit(q * q * x1 + 2 * q * t * mx + t * t * x2, Y - 4 * h * q * t);
        t < 1 ? requestAnimationFrame(frame) : done();
      })(t0);
    });
    mk('text', { class: 'jl' + back, x: mx, y: Y - 10 - h - 12 }, p.jumps[i].lab);
    pad(pts[i + 1], mask && pts[i + 1] === p.ans);
    // the frog lands on the pad with a splash
    if (frog.isConnected) { const c = mid(frog), hue = back ? 45 : 190; FX.ring(c.x, c.bottom, hue, 4, c.w * 1.1); FX.burst(c.x, c.bottom, hue, 12, 110); tone(back ? 494 : 659, 0, 0.2, 0.07); }
  }
  reset();
  return { n: p.jumps.length, jump, reset, reveal };
}

// narrate a trick: one caption per move, then any closing caption
async function demo(p, v, capEl, t) {
  const say = async (txt, ms) => { capEl.textContent = txt; await sleep(ms); return t.on; };
  v.reset();
  if (!await say(p.caps[0], 1700)) return false;
  for (let i = 0; i < v.n; i++) {
    capEl.textContent = p.caps[i + 1];
    await sleep(700); if (!t.on) return false;
    await v.jump(i); if (!t.on) return false;
    await sleep(1300); if (!t.on) return false;
  }
  for (let i = v.n + 1; i < p.caps.length; i++) if (!await say(p.caps[i], 1500)) return false;
  return true;
}

/* ---------- screens ---------- */
// the link to the page of all games shows on the menu of sections, the way back to that menu inside a level
function show(kicker, inLevel) {
  $('#toG').hidden = inLevel; $('#toM').hidden = !inLevel; $('#kick').textContent = kicker; $('#app').classList.toggle('in', inLevel);
}
$('#toM').onclick = () => seccions();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

// which path the menu shows: 0 the sums, 1 the subtractions
let op = 0;
const secOpen = s => opens(prog.secs, s);
const HUE = [165, 318];
function seccions() {
  fresh(); show('Càlcul mental', false); FX.mood(HUE[op]);
  const base = op * PATH, done = k => prog.secs.slice(k * PATH, k * PATH + PATH).reduce((a, b) => a + b, 0);
  root.innerHTML = `<nav class="ops" aria-label="Sumes o restes">${['＋ Sumes', '− Restes'].map((s, k) => `<button data-o="${k}" aria-pressed="${k === op}">${s}<span>${done(k)}/${PATH * 10}</span></button>`).join('')}</nav>
    <p class="lead">${!op ? 'Tria una secció. A cada una, la granota t\'ensenya un truc per sumar de cap.' : 'Els mateixos trucs, saltant enrere: aquí la granota t\'ensenya a restar de cap.'}</p>
    <nav class="secs" aria-label="Seccions">${SECTIONS.slice(base, base + PATH).map((s, i) => { const n = prog.secs[base + i], on = secOpen(base + i); return `<button class="sec${n >= 10 ? ' all' : ''}" data-s="${base + i}"${on ? '' : ' disabled'}>
      <span class="sec-n">${i + 1}</span><span class="sec-t"><b>${s.name}</b><span>${on ? s.tip : 'Acaba la secció anterior per obrir-la'}</span></span>
      <span class="sec-p"><span class="pips">${Array.from({ length: 10 }, (_, k) => `<i${k < n ? ' class="ok"' : ''}></i>`).join('')}</span>${n} de 10</span></button>`; }).join('')}</nav>
    <p class="foot"><span>${done(0) + done(1)} de ${SECTIONS.length * 10} nivells</span><button class="link" id="wipe">Esborra el progrés</button></p>`;
  root.querySelectorAll('.ops button').forEach(b => b.onclick = () => { op = +b.dataset.o; tone(op ? 494 : 659, 0, 0.15, 0.08); seccions(); });
  $('.secs', root).onclick = e => { const b = e.target.closest('.sec'); if (b && !b.disabled) { tone(523, 0, 0.2); nivell(+b.dataset.s, Math.min(prog.secs[+b.dataset.s], 9)); } };
  $('#wipe').onclick = e => {
    if (e.target.dataset.sure) { prog.secs.fill(0); save(); seccions(); }
    else { e.target.dataset.sure = 1; e.target.textContent = 'Segur? Torna a tocar per esborrar-ho tot'; }
  };
}

// the operation with a box for the answer, and the keys that fill it. A real keyboard works too.
const EQ = `<p class="big" id="big"><span id="lhs"></span><output id="ans" aria-label="La teva resposta"></output><span id="rhs"></span></p>`;
const KEYS = `<p id="msg" role="status"></p><div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k =>
  `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
addEventListener('keydown', e => {
  if (!keyFn || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null;
  if (k) { e.preventDefault(); keyFn(k); }
});
function keypad(p, submit) {
  const out = $('#ans'); let v = '';
  $('#lhs').textContent = p.lhs; $('#rhs').textContent = p.rhs;
  // no need to press the tick: the answer is checked as soon as it is right, or has as many digits as the right one
  const auto = () => { if (keyFn && v && (+v === p.ans || v.length >= String(p.ans).length)) submit(+v); };
  keyFn = k => {
    if (k === 'ok') { if (v) submit(+v); return; }
    out.className = ''; v = k === 'del' ? v.slice(0, -1) : (v + k).slice(0, 3); out.textContent = v;
    tone(k === 'del' ? 392 : 784, 0, 0.08, 0.05);
    if (k !== 'del') auto();
  };
  $('.keys').onclick = e => { const b = e.target.closest('button'); if (b && keyFn) keyFn(b.dataset.k); };
  return {
    auto,
    wrong() { v = ''; out.textContent = ''; out.className = ''; void out.offsetWidth; out.className = 'shake'; tone(150, 0, 0.45, 0.16, 'triangle'); },
    right(k = 0) { keyFn = null; out.className = 'good'; const c = mid(out); FX.burst(c.x, c.y, 140, 16 + 4 * Math.min(k, 6), 160 + 20 * Math.min(k, 6)); FX.ring(c.x, c.y, 140, c.w * 0.4, c.w * 1.2); chime([noteOf(k), noteOf(k + 2)]); }
  };
}
const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Així es fa!', 'Quin salt!'], HURRAY = ['Molt bé!', 'Quin salt!', 'Genial!', 'Nivell superat!'];

// A level: its operations one after another. One answered with a hint or after a miss comes back once at the end,
// and the level is done when every one has been answered: nothing is timed and nothing can be lost.
function nivell(sec, idx) {
  const t = fresh(), S = SECTIONS[sec], L = PLAN[idx], q = sums(sec, idx), res = [];
  // what the operations of this level are called: the mixed levels of the subtractions have both signs
  const N = sec < PATH ? ['Suma', 'sumes'] : L.mix ? ['Operació', 'operacions'] : ['Resta', 'restes'];
  let i = 0, streak = 0, cur = { on: true };
  op = +(sec >= PATH); show(`${op ? 'Restes' : 'Sumes'} · ${S.name}`, true); FX.mood(HUE[op]);
  root.innerHTML = `<div class="hud"><span class="chip">Nivell ${idx + 1} · ${L.kind}</span><span class="chip" id="cnt"></span></div>
    <nav class="levels" aria-label="Nivells"></nav><div class="play" id="play"></div>`;
  const play = $('#play'), nav = $('.levels', root);
  function levels() {
    nav.innerHTML = PLAN.map((_, k) => `<button data-n="${k}" class="${k < prog.secs[sec] ? 'done' : ''}"${k === idx ? ' aria-current="true"' : ''}${k > prog.secs[sec] ? ' disabled title="Supera el nivell anterior"' : ''}>${k + 1}</button>`).join('');
    // the row scrolls sideways on a phone: keep this level in the middle
    const a = nav.getBoundingClientRect(), c = nav.querySelector('[aria-current]').getBoundingClientRect(); nav.scrollLeft += c.left - a.left - (a.width - c.width) / 2;
  }
  nav.onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) nivell(sec, +b.dataset.n); };
  levels();

  // the first level of a section opens with the frog showing the trick
  function intro() {
    let n = 0;
    $('#cnt').textContent = 'La granota ho ensenya';
    play.innerHTML = `<p class="hint">${S.tip}</p><p class="big" id="big"></p><div id="viz"></div><p class="cap" id="cap" aria-live="polite"></p>
      <div class="row"><button class="btn soft" id="again">Torna-ho a veure</button><button class="btn soft" id="other">Un altre exemple</button><button class="btn" id="go">Ara jo!</button></div>`;
    async function run() {
      cur.on = false; cur = { on: true }; const me = cur, p = make(S.type, ...S.demo[n]);
      $('#big').innerHTML = `${p.lhs} <b class="q">?</b> ${p.rhs}`;
      if (await demo(p, Viz($('#viz'), p), $('#cap'), { get on() { return me.on && t.on; } })) $('#big').textContent = p.eq;
    }
    $('#again').onclick = run;
    $('#other').onclick = () => { n = (n + 1) % S.demo.length; run(); };
    $('#go').onclick = ask;
    run();
  }

  function ask() {
    cur.on = false; cur = { on: true };
    if (i >= q.length) return win();
    const me = cur, alive = () => me.on && t.on, p = q[i];
    // shown counts the moves of the picture already played; clean stays true while no hint and no miss
    let v = null, shown = 0, clean = true, miss = 0, busy = false, done = false;
    $('#cnt').textContent = p.re ? 'Repàs' : `${N[0]} ${res.length + 1} de ${L.n}`;
    play.innerHTML = `<div class="dots" role="img" aria-label="${res.length} de ${L.n} ${N[1]} fetes">${Array.from({ length: L.n }, (_, k) => `<i class="${k < res.length ? (res[k] ? 'ok' : 'slow') : k === res.length && !p.re ? 'now' : ''}"></i>`).join('')}</div>
      ${EQ}<div id="viz"${L.pic ? '' : ' hidden'}></div>${L.pic ? `<p class="hint">${p.hint}</p>` : ''}${KEYS}
      <div class="row"><button class="btn soft" id="hintb">Pista</button></div>`;
    const hb = $('#hintb'), msg = $('#msg');
    const say = (txt, cls) => { msg.textContent = txt; msg.className = cls || ''; };
    if (L.pic) {
      v = Viz($('#viz'), p);
      // an answer typed while the first leap is being drawn is checked when it lands
      if (p.pre) { busy = true; shown = 1; v.jump(0).then(() => { if (alive()) { busy = false; kp.auto(); } }); }
    }
    // a hint is a picture, never words: the frog makes its next move, and the place where the result goes shows "?".
    // Asked again once every move is on screen, the picture gives the result away.
    hb.onclick = async () => {
      if (busy || done) return;
      busy = true; clean = false; hb.classList.remove('glow'); say(''); hb.blur();
      if (!v) { $('#viz').hidden = false; v = Viz($('#viz'), p); }
      if (shown < v.n) { await v.jump(shown, shown === v.n - 1); shown++; }
      else v.reveal();
      if (alive()) { busy = false; kp.auto(); }
    };
    const kp = keypad(p, async val => {
      if (busy || done) return;
      if (val !== p.ans) {
        clean = false; kp.wrong(); say('Encara no. Torna-ho a provar.', 'bad');
        // two misses in a row: the hint button lights up
        if (++miss >= 2) hb.classList.add('glow');
        return;
      }
      done = true; hb.classList.remove('glow');
      if (!p.re) { res.push(clean); streak = clean ? streak + 1 : 0; if (!clean) q.push({ ...p, re: true }); }
      kp.right(clean ? streak : 0); say(clean && streak >= 3 ? `${streak} seguides!` : pick(BRAVO), 'good');
      // with the picture on screen, the frog finishes the trick before the next operation
      if (v) {
        for (; shown < v.n; shown++) { await v.jump(shown); if (!alive()) return; }
        v.reveal(); await sleep(1200);
      } else await sleep(700);
      if (!alive()) return;
      i++; ask();
    });
  }

  function win() {
    const fast = res.filter(Boolean).length, end = idx === 9, toSubs = end && sec === PATH - 1, all = end && sec === SECTIONS.length - 1;
    if (idx + 1 > prog.secs[sec]) { prog.secs[sec] = idx + 1; save(); }
    levels(); $('#cnt').textContent = `${fast} de ${L.n} sense pista`;
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(end ? 16 : 8);
    play.innerHTML = `<h2>${all ? 'Ja saps tots els trucs!' : end ? 'Secció superada!' : pick(HURRAY)}</h2>
      <div class="dots" role="img" aria-label="${fast} de ${L.n} ${N[1]} sense pista">${res.map(ok => `<i class="${ok ? 'ok' : 'slow'}"></i>`).join('')}</div>
      <p class="cap">${all ? 'Has après tots els trucs de la granota per sumar i restar de cap.' : `Nivell ${idx + 1} superat: ${fast} de ${L.n} ${N[1]} sense pista ni errors.`}</p>
      <div class="row"><button class="btn soft" id="again">Torna-hi</button><button class="btn" id="nx">${all ? 'Torna a les seccions' : toSubs ? 'A les restes!' : end ? 'Secció següent' : 'Nivell següent'}</button></div>`;
    $('#again').onclick = () => nivell(sec, idx);
    $('#nx').onclick = () => all ? seccions() : end ? nivell(sec + 1, 0) : nivell(sec, idx + 1);
    $('#nx').focus({ preventScroll: true });
  }

  L.demo ? intro() : ask();
}

soBtn();
seccions();
