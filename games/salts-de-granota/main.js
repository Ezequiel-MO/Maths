import { $, RM, sleep, mid } from '../../shared/util.js';
import { voice, pentatonic } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { load, save as store } from '../../shared/progress.js';
import { make, round, starsFor, pick, cap, bar, cub, WORLDS, NOUN } from './logic.js';

const KEY = 'salts-de-granota';
const app = $('#app');

let prog = { stars: WORLDS.map(() => 0), so: true };
{
  const d = load(KEY);
  // a save from before the subtractions only has the six worlds of sums: the new ones start without stars
  if (d && Array.isArray(d.stars)) prog = { stars: prog.stars.map((_, i) => Math.min(3, Math.max(0, d.stars[i] | 0))), so: d.so !== false };
}
const save = () => store(KEY, prog);
// each world opens with a star in the one before; the subtractions open with a star in the friends of 10
const open = w => w === 1 || prog.stars[w === 7 ? 0 : w - 2] > 0;

// every screen change cancels running animations, timers and the keypad through this token
let tok = { on: true }, timer = 0, keyFn = null;
function fresh() { tok.on = false; tok = { on: true }; clearTimeout(timer); keyFn = null; return tok; }

const { tone, chime } = voice(() => prog.so);
// the longer the streak, the higher the note
const noteOf = pentatonic(392);
const FX = pond(tone);

const starsHTML = n => `<span class="stars" role="img" aria-label="${n} de 3 estrelles"><i>${'★'.repeat(n)}</i>${'★'.repeat(3 - n)}</span>`;
const FROG = `<ellipse class="fb" cx="0" cy="-18" rx="21" ry="16"/><circle class="fe" cx="-10" cy="-33" r="8"/><circle class="fe" cx="10" cy="-33" r="8"/><circle class="fp" cx="-10" cy="-33" r="3.2"/><circle class="fp" cx="10" cy="-33" r="3.2"/><path class="fm" d="M-8 -14 Q0 -8 8 -14"/>`;

/* ---------- pictures: ten lily pads for the friends of 10, bars and cubes for the tens, a number line for the rest ---------- */
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
    async jump() { for (let i = keep; i < 10; i++) { pads[i].className = p.sub ? 'gone' : 'new'; tone(noteOf(i), 0, 0.12, 0.05); await sleep(RM ? 0 : 240); } },
    reset() { pads.forEach((e, i) => { e.className = first(i); }); }
  };
}
// tens as bars, units as cubes: ten loose cubes turn into a new bar, or a bar breaks into ten cubes to take some away
function blockViz(host, p) {
  const u = p.a % 10, t = (p.a - u) / 10;
  host.innerHTML = `<div class="blocks"><div class="col"><span class="h">Desenes</span><div class="bars"></div></div><div class="col"><span class="h">Unitats</span><div class="cubes"></div></div></div><p class="split"></p>`;
  const bars = $('.bars', host), cubes = $('.cubes', host), sp = $('.split', host);
  const add = (to, cls) => { const e = document.createElement('i'); e.className = cls; to.appendChild(e); return e; };
  function reset() {
    bars.replaceChildren(); cubes.replaceChildren(); cubes.className = 'cubes';
    for (let i = 0; i < t; i++) add(bars, 'bar');
    for (let i = 0; i < u; i++) add(cubes, 'cube');
    sp.innerHTML = `${bar(t)} i ${cub(u)}`;
  }
  async function take(i) {
    if (i === 0) {
      bars.lastChild.classList.add('new'); await sleep(RM ? 0 : 600);
      bars.lastChild.remove(); tone(330, 0, 0.2, 0.08);
      for (let k = 0; k < 10; k++) add(cubes, 'cube new');
      sp.innerHTML = `${bar(t - 1)} i <b>10 cubets</b>`;
      return;
    }
    for (let k = 0; k < p.b; k++) { cubes.lastChild.remove(); tone(noteOf(9 - k), 0, 0.12, 0.05); await sleep(RM ? 0 : 200); }
    sp.innerHTML = `<b>${bar(t - 1)} i ${cub(10 - p.b)}</b> = ${p.ans}`;
  }
  async function jump(i) {
    if (p.sub) return take(i);
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
    sp.innerHTML = `<b>${bar(t + 1)}</b> = ${p.ans}`;
  }
  reset();
  return { jump, reset };
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
  function pad(n) {
    const t = host.querySelector(`.tl[data-n="${n}"]`); if (t) t.setAttribute('visibility', 'hidden');
    mk('ellipse', { class: 'lp', cx: X(n), cy: Y, rx: 25, ry: 9 });
    mk('text', { class: 'pl', x: X(n), y: Y + 50 }, n);
  }
  function reset() {
    dyn.replaceChildren(); host.querySelectorAll('.tl').forEach(t => t.removeAttribute('visibility'));
    pad(p.a); sit(X(p.a), Y);
  }
  async function jump(i) {
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
    pad(pts[i + 1]);
    // the frog lands on the pad with a splash
    if (frog.isConnected) { const c = mid(frog), hue = back ? 45 : 190; FX.ring(c.x, c.bottom, hue, 4, c.w * 1.1); FX.burst(c.x, c.bottom, hue, 12, 110); tone(back ? 494 : 659, 0, 0.2, 0.07); }
  }
  reset();
  return { jump, reset };
}

// narrate a trick: one caption per jump, then any closing caption
async function demo(p, v, capEl, t) {
  const say = async (txt, ms) => { capEl.textContent = txt; await sleep(ms); return t.on; };
  v.reset();
  if (!await say(p.caps[0], 1700)) return false;
  const n = p.nj || Math.max(1, p.jumps.length);
  for (let i = 0; i < n; i++) {
    capEl.textContent = p.caps[i + 1];
    await sleep(700); if (!t.on) return false;
    await v.jump(i); if (!t.on) return false;
    await sleep(1300); if (!t.on) return false;
  }
  for (let i = n + 1; i < p.caps.length; i++) if (!await say(p.caps[i], 1500)) return false;
  return true;
}

/* ---------- screens ---------- */
function soBtn() {
  const b = $('#so'); b.textContent = `So: ${prog.so ? 'sí' : 'no'}`;
  b.onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };
}
const PTS = [[90, 350], [240, 140], [410, 330], [560, 120], [690, 330], [775, 120]];
// which trail the map shows: 0 the sums, 1 the subtractions
let op = 0;
function home() {
  fresh(); FX.mood(op ? 318 : 165);
  const base = op * 6, sum = k => prog.stars.slice(k * 6, k * 6 + 6).reduce((a, b) => a + b, 0);
  const todo = PTS.findIndex((_, i) => open(base + i + 1) && !prog.stars[base + i]), here = todo >= 0 ? todo : open(base + 1) ? 5 : -1;
  const way = `M${PTS[0].join(' ')}` + PTS.slice(1).map(([x, y], i) => { const [x0, y0] = PTS[i], m = (x0 + x) / 2; return `C${m} ${y0} ${m} ${y} ${x} ${y}`; }).join('');
  app.innerHTML = `
    <div class="top"><a class="link" href="index.html">← Tots els jocs</a><button class="link" id="so"></button></div>
    <header><p class="kicker">Càlcul mental</p><h1>Salts de Granota</h1></header>
    <nav class="ops" aria-label="Sumes o restes">${['＋ Sumes', '− Restes'].map((s, k) => `<button data-o="${k}" aria-pressed="${k === op}">${s}<span>★ ${sum(k)}/18</span></button>`).join('')}</nav>
    <p class="lead">${!op ? 'Segueix el camí de nenúfars: a cada un, la granota t\'ensenya un truc per sumar de cap.' : open(7) ? 'Els mateixos trucs, saltant enrere: ara la granota t\'ensenya a restar de cap.' : 'Guanya una estrella a «Amics del 10» i s\'obrirà el camí de les restes.'}</p>
    <div class="trail"><svg viewBox="0 0 860 480" aria-hidden="true"><path class="way" d="${way}"/></svg>
    <ol>${PTS.map(([x, y], i) => { const n = base + i + 1, w = WORLDS[n - 1]; return `<li style="--x:${x};--y:${y}"><button class="world" data-w="${n}" ${open(n) ? '' : `disabled title="Guanya una estrella ${n === 7 ? 'a Amics del 10' : 'al món anterior'}"`}>
      ${i === here ? `<svg class="here" viewBox="-30 -46 60 50" aria-hidden="true">${FROG}</svg>` : ''}<span class="lily">${i + 1}</span><span class="tag"><b>${w.name}</b><span class="ex">${open(n) ? w.ex : 'Tancat'}</span>${starsHTML(prog.stars[n - 1])}</span>
    </button></li>`; }).join('')}</ol></div>
    <footer class="foot"><span>${sum(0) + sum(1)} de 36 estrelles</span><button class="link" id="wipe">Esborra el progrés</button></footer>`;
  soBtn();
  app.querySelectorAll('.ops button').forEach(b => b.onclick = () => { op = +b.dataset.o; tone(op ? 494 : 659, 0, 0.15, 0.08); home(); });
  app.querySelectorAll('.world').forEach(b => b.onclick = () => { tone(523, 0, 0.2); mira(+b.dataset.w); });
  $('#wipe').onclick = e => {
    if (e.target.dataset.sure) { prog.stars.fill(0); save(); home(); }
    else { e.target.dataset.sure = 1; e.target.textContent = 'Segur? Torna a tocar per esborrar-ho tot'; }
  };
}

function head(w, step) {
  op = +(w > 6); FX.mood(op ? 318 : 165);
  return `<div class="top"><button class="link" id="back">← Mapa</button><button class="link" id="so"></button></div>
    <header class="whead"><p class="kicker">${op ? 'Restes' : 'Sumes'} · món ${w - op * 6}</p><h2>${WORLDS[w - 1].name}</h2></header>
    <nav class="tabs" aria-label="Passos">${['Mira', 'Prova', 'Repte'].map((s, i) => `<button data-s="${i + 1}"${i + 1 === step ? ' aria-current="step"' : ''}>${s}</button>`).join('')}</nav>`;
}
function wire(w) {
  soBtn(); $('#back').onclick = home;
  app.querySelectorAll('.tabs button').forEach(b => b.onclick = () => [mira, prova, repte][b.dataset.s - 1](w));
}

// the sum with a box for the answer, and the keys that fill it. A real keyboard works too.
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
  keyFn = k => {
    if (k === 'ok') { if (v) submit(+v); return; }
    out.className = ''; v = k === 'del' ? v.slice(0, -1) : (v + k).slice(0, 3); out.textContent = v;
    tone(k === 'del' ? 392 : 784, 0, 0.08, 0.05);
  };
  $('.keys').onclick = e => { const b = e.target.closest('button'); if (b && keyFn) keyFn(b.dataset.k); };
  return {
    wrong() { v = ''; out.textContent = ''; out.className = ''; void out.offsetWidth; out.className = 'shake'; tone(150, 0, 0.45, 0.16, 'triangle'); },
    right(k = 0) { keyFn = null; out.className = 'good'; const c = mid(out); FX.burst(c.x, c.y, 140, 16 + 4 * Math.min(k, 6), 160 + 20 * Math.min(k, 6)); FX.ring(c.x, c.y, 140, c.w * 0.4, c.w * 1.2); chime([noteOf(k), noteOf(k + 2)]); }
  };
}
const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Així es fa!', 'Quin salt!'];
function say(txt, cls) { const m = $('#msg'); if (m) { m.textContent = txt; m.className = cls || ''; } }

function mira(w) {
  const t = fresh(), W = WORLDS[w - 1];
  if (!W.demo) {
    app.innerHTML = head(w, 1) + `<section class="play"><p class="cap">${w === 6 ? 'Ja saps tots els trucs. Ara toca triar el bo per a cada suma.' : 'Ara tot barrejat: sumes i restes. Mira bé el signe abans de saltar!'}</p>
      <ul class="tricks">${WORLDS.slice(w - 5, w - 1).map(x => `<li><b>${x.ex}</b>${x.tip}</li>`).join('')}</ul>
      <div class="row"><button class="btn" id="go">Ara jo!</button></div></section>`;
    wire(w); $('#go').onclick = () => prova(w); $('#go').focus({ preventScroll: true });
    return;
  }
  let n = 0;
  app.innerHTML = head(w, 1) + `<section class="play"><p class="hint">${W.tip}</p><p class="big" id="big"></p><div id="viz"></div><p class="cap" id="cap" aria-live="polite"></p>
    <div class="row"><button class="btn soft" id="again">Torna-ho a veure</button><button class="btn soft" id="other">Un altre exemple</button><button class="btn" id="go">Ara jo!</button></div></section>`;
  wire(w);
  let cur = { on: true };
  async function play() {
    cur.on = false; cur = { on: true }; const mine = cur, p = make(w, ...W.demo[n]);
    $('#big').innerHTML = `${p.lhs} <b class="q">?</b> ${p.rhs}`;
    const done = await demo(p, Viz($('#viz'), p), $('#cap'), { get on() { return mine.on && t.on; } });
    if (done) $('#big').textContent = p.eq;
  }
  $('#again').onclick = play;
  $('#other').onclick = () => { n = (n + 1) % W.demo.length; play(); };
  $('#go').onclick = () => prova(w);
  play();
}

function prova(w) {
  const t = fresh(), list = round(w, 5);
  let i = 0;
  (function show() {
    if (i >= list.length) {
      keyFn = null;
      app.innerHTML = head(w, 2) + `<section class="play"><p class="big">Ja ho tens!</p><p class="cap">Ara sense dibuix i ben de pressa.</p>
        <div class="row"><button class="btn soft" id="more">Vull practicar més</button><button class="btn" id="go">Al repte!</button></div></section>`;
      wire(w); $('#more').onclick = () => prova(w); $('#go').onclick = () => repte(w); $('#go').focus({ preventScroll: true });
      chime([523, 659, 784]);
      return;
    }
    const p = list[i]; let miss = 0, busy = false;
    app.innerHTML = head(w, 2) + `<section class="play"><p class="count">${cap(NOUN(w)[0])} ${i + 1} de ${list.length}</p>
      ${EQ}<div id="viz"></div><p class="hint">${p.hint}</p>${KEYS}</section>`;
    wire(w);
    const v = Viz($('#viz'), p);
    if (p.pre) { busy = true; v.jump(0).then(() => { busy = false; }); }
    const kp = keypad(p, async val => {
      if (busy) return;
      if (val !== p.ans) {
        miss++; kp.wrong();
        say(miss >= 2 ? `La resposta és ${p.ans}. Escriu-la per continuar.` : 'Encara no. Torna-ho a provar.', 'bad');
        return;
      }
      busy = true; kp.right(); say(pick(BRAVO), 'good');
      await v.jump(p.pre ? 1 : 0); if (!t.on) return;
      $('#big').textContent = p.eq;
      $('.keys').outerHTML = `<div class="row"><button class="btn" id="next">Següent</button></div>`;
      $('#next').onclick = () => { i++; show(); }; $('#next').focus({ preventScroll: true });
    });
  })();
}

function repte(w) {
  const t = fresh(), q = round(w, 10), res = [], T = WORLDS[w - 1].secs * 1000, N = NOUN(w)[1];
  let i = 0, streak = 0;
  (function show() {
    clearTimeout(timer);
    if (i >= q.length) return fi();
    const p = q[i]; let first = true, hinted = false, done = false, hint = { on: true };
    app.innerHTML = head(w, 3) + `<section class="play">
      <div class="hud"><span class="dots" role="img" aria-label="${res.length} de 10 ${N} fetes">${Array.from({ length: 10 }, (_, k) => `<i class="${k < res.length ? (res[k] ? 'ok' : 'slow') : k === res.length && !p.re ? 'now' : ''}"></i>`).join('')}</span>
        <span class="chip">${p.re ? 'Repàs' : 'Ratxa: ' + streak}</span></div>
      <div class="timer"><i id="bar"></i></div>
      ${EQ}<p class="cap" id="cap" aria-live="polite" hidden></p><div id="viz" hidden></div>${KEYS}</section>`;
    wire(w);
    const bar = $('#bar');
    void bar.offsetWidth; bar.style.transition = `transform ${T}ms linear`; bar.style.transform = 'scaleX(0)';
    function showTrick() {
      if (hinted) return; hinted = true;
      $('#viz').hidden = false; $('#cap').hidden = false;
      demo(p, Viz($('#viz'), p), $('#cap'), { get on() { return hint.on && t.on; } });
    }
    timer = setTimeout(() => { if (!done && t.on) { say('Cap pressa. Mira el truc i escriu la resposta.'); showTrick(); } }, T);
    const kp = keypad(p, val => {
      if (done) return;
      if (val !== p.ans) { first = false; kp.wrong(); say('Encara no. Mira el truc i torna-ho a provar.', 'bad'); showTrick(); return; }
      done = true; clearTimeout(timer); bar.style.transition = 'none';
      const clean = first && !hinted;
      if (!p.re) { res.push(clean); streak = clean ? streak + 1 : 0; if (!clean) q.push({ ...p, re: true }); }
      kp.right(clean ? streak : 0); say(clean && streak >= 3 ? `${streak} seguides!` : pick(BRAVO), 'good');
      timer = setTimeout(() => { hint.on = false; if (t.on) { i++; show(); } }, hinted ? 1300 : 700);
    });
  })();
  function fi() {
    const fast = res.filter(Boolean).length, st = starsFor(fast);
    keyFn = null;
    if (st > prog.stars[w - 1]) { prog.stars[w - 1] = st; save(); }
    app.innerHTML = head(w, 3) + `<section class="play result">${starsHTML(st)}
      <p class="big">${fast} de 10</p>
      <p class="cap">${st ? `${N} fetes de pressa i sense pista.` : 'Encara no hi ha estrella. Torna a mirar el truc i prova-ho un altre cop.'}</p>
      <p class="count">5 ${N}: 1 estrella · 7 ${N}: 2 estrelles · 9 ${N}: 3 estrelles</p>
      <div class="row"><button class="btn soft" id="again">Torna-hi</button>${st && w < 12 ? `<button class="btn" id="next">${w === 6 ? 'A les restes!' : 'Món següent'}</button>` : '<button class="btn" id="map">Torna al mapa</button>'}</div></section>`;
    wire(w);
    if (st) { chime([523, 659, 784, 1047, 1319].slice(0, st + 2)); FX.celebrate(st * 5); }
    $('#again').onclick = () => repte(w);
    if ($('#next')) { $('#next').onclick = () => mira(w + 1); $('#next').focus({ preventScroll: true }); }
    if ($('#map')) { $('#map').onclick = home; $('#map').focus({ preventScroll: true }); }
  }
}

home();
