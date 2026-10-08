import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, sectionMenu, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { SECTIONS, ELEMENTS, GROUPS, MOLS, INKS, POINTS, el, byZ, placeOf, shells, neutronsOf, the, de, formula, blend, pctHow, starsFor, clean, xpOf, rankOf, starsOf, doneOf, levelIn } from './logic.js';

const KEY = 'laboratori-de-l-estany';
// for now every section and every level is open, to try the game out
const OPEN = true;

// Facts only: { so, stars }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen: the rank, the XP, and how far the next rank is
function paintXp() {
  const box = $('#xp'), xp = xpOf(prog), r = rankOf(xp), pct = Math.round((xp - r.from) / (r.to - r.from) * 100);
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `${r.name} · ${xp} XP`; bar.setAttribute('aria-label', `${pct} % del rang`); bar.firstChild.style.width = pct + '%';
}

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const plop = n => click(900 - 30 * n, 0, 0.12, 0.09);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');

/* ---------- the drawings ---------- */
// the frog of the pond, with goggles, a white coat and a flask that bubbles
const FROG = `<svg class="frog" viewBox="-40 -54 88 76" aria-hidden="true"><ellipse cx="0" cy="16" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 12q-9-2-7-9q7 2 11 6ZM25 12q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-6" rx="25" ry="20" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <path d="M-21 6q-1-9 8-13l13 10 13-10q9 4 8 13q-21 10-42 0Z" fill="#F3FBF8"/><path d="M0 3v9" stroke="#9EC3C0" stroke-width="1.5"/><circle cx="4" cy="6" r="1.2" fill="#9EC3C0"/>
  <path d="M-24 -27h48" stroke="#0F3A40" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="-12" cy="-27" r="10" fill="#DDF6FF" stroke="#F7C64E" stroke-width="3"/><circle cx="12" cy="-27" r="10" fill="#DDF6FF" stroke="#F7C64E" stroke-width="3"/>
  <circle cx="-11" cy="-26" r="4" fill="#0F3A40"/><circle cx="13" cy="-26" r="4" fill="#0F3A40"/><circle cx="-9.500" cy="-28" r="1.4" fill="#fff"/><circle cx="14.5" cy="-28" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -5 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <g class="vial"><path d="M30 -30v9l-9 17q-1 4 3 4h20q4 0 3-4l-9-17v-9Z" fill="rgb(220 246 255 / 0.25)" stroke="#EAF8F4" stroke-width="2" stroke-linejoin="round"/><path d="M25 -12l-3.500 7q-1 3 2 3h21q3 0 2-3l-3.500-7Z" fill="#7CF5B0"/><path d="M27 -30h14" stroke="#EAF8F4" stroke-width="2.5" stroke-linecap="round"/>
    <circle class="bub b1" cx="31" cy="-34" r="2.2" fill="#7CF5B0"/><circle class="bub b2" cx="37" cy="-36" r="1.6" fill="#7CF5B0"/><circle cx="24" cy="-4" r="4.5" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/></g></svg>`;
const DROP = '<svg class="drop" viewBox="0 0 20 26" aria-hidden="true"><path d="M10 1C10 1 2 11 2 17a8 8 0 0 0 16 0C18 11 10 1 10 1Z"/><path class="hl" d="M6.500 17a3.500 3.500 0 0 0 3 3.500"/></svg>';
// how each atom is drawn as a ball: its colour and its radius
const BALL = { H: ['#F3FBF8', 9], C: ['#8A98A3', 13], O: ['#FF5A4E', 13], N: ['#5B8CFF', 13], Cl: ['#58D668', 14], Na: ['#B79CFF', 14] };
const ball = s => `<span class="ball" style="--c:${BALL[s][0]};--r:${BALL[s][1]}">${s}</span>`;
// a molecule as joined balls; sc is how many pixels a unit of its drawing takes
function molSvg(id, sc = 1.3) {
  const M = MOLS[id], P = M.at.map(([s, x, y]) => ({ s, x, y, c: BALL[s][0], r: BALL[s][1] }));
  const x0 = Math.min(...P.map(p => p.x - p.r)) - 2, x1 = Math.max(...P.map(p => p.x + p.r)) + 2, y0 = Math.min(...P.map(p => p.y - p.r)) - 2, y1 = Math.max(...P.map(p => p.y + p.r)) + 2;
  return `<svg class="mol" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" width="${Math.round((x1 - x0) * sc)}" height="${Math.round((y1 - y0) * sc)}" aria-hidden="true">
    ${M.bonds.map(([a, b]) => `<path d="M${P[a].x} ${P[a].y}L${P[b].x} ${P[b].y}" stroke="#9EC3C0" stroke-width="5" stroke-linecap="round"/>`).join('')}
    ${P.map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.c}" stroke="rgb(0 0 0 / 0.35)"/><circle cx="${p.x - p.r * 0.35}" cy="${p.y - p.r * 0.35}" r="${p.r * 0.3}" fill="#fff" opacity="0.55"/><text x="${p.x}" y="${p.y + 3.2}">${p.s}</text>`).join('')}</svg>`;
}
const mols = (id, n, sc) => molSvg(id, sc).repeat(n);
// one square of the table
const tile = (e, big = false) => { const [r, c] = placeOf(e); return `<${big ? 'div' : 'button'} class="el${big ? ' big' : ''}" data-s="${e.sym}" style="--h:${GROUPS[e.group][1]}${big ? '' : `;grid-area:${r > 4 ? r + 1 : r}/${c}`}"${big ? '' : ` aria-label="${e.name}, número ${e.z}"`}><i>${e.z}</i><b>${e.sym}</b>${big ? '' : `<span>${e.name}</span>`}</${big ? 'div' : 'button'}>`; };
const TABLE = `<div class="ptable" id="ptable">${ELEMENTS.map(e => tile(e)).join('')}<p class="famous">Metalls famosos</p></div>`;
// a cylinder of size ml with a mark every step and v ml of liquid
function cylHtml(size, step, v) {
  const n = size / step, every = step * Math.ceil(n / 10);
  return `<div class="cyl" id="cyl"><div class="liq" id="liq" style="height:${v / size * 100}%"></div>
    ${Array.from({ length: n }, (_, i) => { const m = (i + 1) * step; return `<i class="${m % every && m !== size ? '' : 'big'}" style="bottom:${m / size * 100}%">${m % every && m !== size ? '' : `<b>${m}</b>`}</i>`; }).join('')}</div>`;
}
// the drops of a recipe, a group for each ink: «1 gota blava per cada 2 grogues»
const dropsOf = (k, n) => `<span class="dg" style="--h:${INKS[k].hue}">${DROP.repeat(n)}</span>`;
const inkText = (k, n, word = true) => `${n} ${word ? (n > 1 ? 'gotes ' : 'gota ') : ''}${n > 1 ? INKS[k].many : INKS[k].one}`;
const recipe = parts => `<div class="recipe"><div class="rdrops">${parts.map(([k, n]) => dropsOf(k, n)).join('<b>per cada</b>')}</div><p>${inkText(...parts[0])} per cada ${inkText(...parts[1], false)}</p></div>`;
// a reaction as drawn molecules: as many of each as the recipe takes
const term = ([id, n]) => `<span class="term"><span class="tm">${mols(id, n, 0.85)}</span><b>${n > 1 ? n + ' ' : ''}${formula(id)}</b></span>`;
const eqHtml = (left, right) => `<div class="eq" role="img" aria-label="La recepta de la reacció">${left.map(term).join('<b class="op">+</b>')}<b class="op arrow">→</b>${right.map(term).join('<b class="op">+</b>')}</div>`;

const HURRAY = ['Eureka!', 'Molt bé!', 'Perfecte!', 'Genial!', 'Quin experiment!'];
const HUES = [205, 140, 28, 175, 262, 350, 318];
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const cap = s => s[0].toUpperCase() + s.slice(1);
const cops = k => `${k} ${k > 1 ? 'cops' : 'cop'}`;
// takes the one-shot classes off an element and gives its class list back, so the same animation can start again
const again = e => { e.classList.remove('shake', 'pop', 'ok'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };
const stepper = (k, label, v, lock = false) => `<div class="stepper" data-k="${k}"><span class="lbl">${label}</span>${lock ? '<span class="fix">fix</span>' : '<button class="key" data-d="-1" aria-label="Menys">−</button>'}<b class="val">${v}</b>${lock ? '' : '<button class="key" data-d="1" aria-label="Més">+</button>'}</div>`;

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /laboratori-de-l-estany\.html$/.test(location.pathname);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toS').onclick = () => seccions();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

// a real keyboard: the level on screen says what its keys do
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });
// a tap that comes less than SETTLE after a question came up was meant for the one before
const SETTLE = 450;
let openAt = 0;
// each kind of level draws its stage and gives back its hint: a function that shows the help and returns what the tip says
const KIND = { find, atom, mol, mix, dose, react, ask };

/* ---------- the menu: the shelf of potions over the sections ---------- */
// a flask for each section, as full as the stars won in it
const shelf = () => `<div class="shelf" role="img" aria-label="El prestatge de pocions">${SECTIONS.map((_, i) => { const s = starsOf(prog, i);
  return `<span class="sf${s === 30 ? ' full' : ''}" style="--h:${HUES[i]}"><svg viewBox="0 0 40 46"><defs><clipPath id="sf${i}"><path d="M15 3h10v13a14 14 0 1 1-10 0Z"/></clipPath></defs>
    <rect clip-path="url(#sf${i})" x="0" y="${44 - s / 30 * 27}" width="40" height="46" fill="hsl(${HUES[i]} 90% 60%)"/><path d="M15 3h10v13a14 14 0 1 1-10 0Z" fill="rgb(220 246 255 / 0.08)" stroke="#EAF8F4" stroke-width="2"/><path d="M12 3h16" stroke="#EAF8F4" stroke-width="2.5" stroke-linecap="round"/></svg><b>★ ${s}</b></span>`; }).join('')}</div>`;
function seccions() {
  fresh(); show('El laboratori', false, 165);
  $('#game').innerHTML = `${shelf()}<div class="menu" id="menu"></div>`;
  const done = SECTIONS.map((_, i) => doneOf(prog, i));
  sectionMenu($('#menu'), 'Tria un experiment. Cada estrella que guanyes omple una mica la seva poció.', SECTIONS, done, (s, i) => level(s, Math.max(0, prog.stars.slice(s * 10, s * 10 + 10).findIndex(n => n < 3))), () => '', OPEN);
}

/* ---------- one level: the frame is the same for all, the stage is of its kind ---------- */
function level(sec, idx) {
  const t = fresh(); show(`Experiment ${sec + 1} · ${SECTIONS[sec].name}`, true, HUES[sec]);
  const root = $('#game'), L = SECTIONS[sec].levels[idx];
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(SECTIONS[sec].levels, 10, idx)}
    <div class="hud"><span class="chip">${idx + 1} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip"></p></div><div class="stage" id="stage"></div>`;
  // a level is marked done when it has a star, whatever the order they were played in
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); buzz(); };

  // the level is handed in at once, before any wait
  async function win(line) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.rank ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel(stage, `<h2>${end ? 'Experiment acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      ${r.rank ? `<p class="lead go">Rang nou: ${r.rank}!</p>` : ''}
      <p class="lead">${r.gain ? `+${r.gain} XP` : 'Ja tenies aquests punts.'}${n === 3 ? '' : ` · Sense errors ni pistes en dona ${POINTS[3]}.`}</p>
      <button class="btn" id="nx">${end ? 'Torna als experiments' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? seccions() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  const help = KIND[L.kind]({ t, L, stage, tip, slip, win });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars();
  // on a short screen the end of the stage can be under the fold: start from the frog's tip
  if (stage.getBoundingClientRect().bottom > innerHeight) $('#coach').scrollIntoView({ block: 'start', behavior: 'auto' });
}

/* ---------- find an element on the table: touching a square only says who it is, the button under it answers ---------- */
function find({ t, L, stage, tip, slip, win }) {
  const E = el(L.sym);
  let sel = null, busy = false;
  stage.innerHTML = `<p class="ask">${L.ask}</p><div class="info" id="info"><p class="cap">Toca una casella per saber qui és.</p></div>${TABLE}<button class="btn" id="ok" disabled>És aquest!</button>`;
  const tiles = [...stage.querySelectorAll('.ptable .el')];
  $('#ptable').onclick = e => {
    const b = e.target.closest('.el'); if (!b || busy) return;
    sel = el(b.dataset.s); blip(440 + sel.z * 8);
    tiles.forEach(x => x.classList.toggle('sel', x === b)); $('#ok').disabled = false;
    // the atom of the square touched, turning: its protons and neutrons in the middle and its electrons on their shells
    const nn = neutronsOf(sel.z), few = v => v === 1;
    $('#info').innerHTML = `${atomSvg(sel.z, nn)}<p><b>${sel.sym} · ${cap(sel.name)}</b> · ${GROUPS[sel.group][0]}
      <span class="parts3"><span><i class="pt p"></i>${sel.z} ${few(sel.z) ? 'protó' : 'protons'}</span><span><i class="pt n"></i>${nn} ${few(nn) ? 'neutró' : 'neutrons'}</span><span><i class="pt e"></i>${sel.z} ${few(sel.z) ? 'electró' : 'electrons'}</span></span><br><span>${sel.fact}</span></p>`;
  };
  $('#ok').onclick = async () => {
    if (!sel || busy || !t.on) return;
    const b = tiles.find(x => x.dataset.s === sel.sym);
    if (sel !== E) { slip(); again(b).add('shake'); return tip(`Ui! Aquest és ${the(sel.name)}, el número ${sel.z}. No és el que busques.`, 'oops'); }
    busy = true; b.classList.add('won'); spark(b, GROUPS[E.group][1]);
    tip(`Sí! ${cap(the(E.name))}, el número ${E.z}. ${E.fact}`, 'go');
    await sleep(1700); if (!t.on) return;
    win(`${E.sym} · ${E.name}<br><small>${E.z} ${E.z > 1 ? 'protons' : 'protó'}</small>`);
  };
  tip(L.say);
  return () => { if (busy) return ''; tiles.filter(x => placeOf(el(x.dataset.s))[0] === placeOf(E)[0]).forEach(x => x.classList.add('hint')); return `És en una de les caselles que fan pampallugues, i el seu número és el ${E.z}.`; };
}

/* ---------- build an atom: protons decide the element, neutrons add to its mass ---------- */
// protons and neutrons in a spiral at the middle, and the electrons on their shells, turning
function atomSvg(p, n) {
  const R = [42, 60, 78, 96, 114, 132], mix = [];
  for (let i = 0, a = 0, b = 0; i < p + n; i++) mix.push(a < p && (b >= n || a * (n || 1) <= b * p) ? (a++, 'p') : (b++, 'n'));
  // a big nucleus is drawn with smaller particles, so it always fits inside the first shell
  const sh = shells(p), V = (R[sh.length - 1] || 30) + 10, d = Math.min(4.6, 31 / Math.sqrt(p + n || 1));
  // the turning is SVG's own, round the middle of the drawing whatever its size
  const turn = i => RM ? '' : `<animateTransform attributeName="transform" type="rotate" from="${i % 2 ? 360 : 0}" to="${i % 2 ? 0 : 360}" dur="${[5, 9, 14, 20, 27, 35][i]}s" repeatCount="indefinite"/>`;
  return `<svg class="atomv" viewBox="${-V} ${-V} ${2 * V} ${2 * V}" aria-hidden="true">
    ${sh.map((m, i) => `<circle class="orbit" r="${R[i]}"/><g>${turn(i)}${Array.from({ length: m }, (_, k) => { const a = k / m * 2 * Math.PI; return `<circle class="e" cx="${(R[i] * Math.cos(a)).toFixed(1)}" cy="${(R[i] * Math.sin(a)).toFixed(1)}" r="${m > 18 ? 3.6 : 4.5}"/>`; }).join('')}</g>`).join('')}
    <circle class="glow" r="${10 + d * Math.sqrt(p + n)}"/>
    ${mix.map((k, i) => { const r = d * Math.sqrt(i + 0.2), a = i * 2.39996; return `<circle class="nu ${k}" cx="${(r * Math.cos(a)).toFixed(1)}" cy="${(r * Math.sin(a)).toFixed(1)}" r="${(d * 0.96).toFixed(2)}"/>`; }).join('')}</svg>`;
}
function atom({ t, L, stage, tip, slip, win }) {
  const E = el(L.sym), mass = L.n != null;
  let p = 1, n = 0, busy = false;
  stage.innerHTML = `<p class="goal two">Fes un àtom ${de(E.name)}${mass ? ` de massa <b class="sun">${E.z + L.n}</b>` : ''}</p>
    <div class="row"><div id="av"></div><div class="who" id="who"></div></div>
    <div class="steppers">${stepper('p', '<i class="pt p"></i>Protons', p)}${mass ? stepper('n', '<i class="pt n"></i>Neutrons', n) : ''}</div>
    <button class="btn" id="ok">Comprova</button>
    <button class="link" id="tb" aria-expanded="false">Mira la taula</button>
    <div class="ref" id="ref" hidden><p class="cap" id="refc">Toca una casella per saber qui és.</p>${TABLE}</div>`;
  // the table to look things up in, under the atom: touching a square only says who it is
  $('#tb').onclick = () => { const r = $('#ref'); r.hidden = !r.hidden; $('#tb').textContent = r.hidden ? 'Mira la taula' : 'Amaga la taula'; $('#tb').setAttribute('aria-expanded', !r.hidden); if (!r.hidden) r.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); };
  $('#ptable').onclick = e => {
    const b = e.target.closest('.el'); if (!b) return;
    const X = el(b.dataset.s); blip(440 + X.z * 8);
    stage.querySelectorAll('.ptable .el').forEach(x => x.classList.toggle('sel', x === b));
    $('#refc').innerHTML = `<b>${X.sym} · ${cap(X.name)}</b> és el número ${X.z}: té ${X.z} ${X.z > 1 ? 'protons' : 'protó'}.`;
  };
  const draw = () => {
    const X = byZ(p);
    $('#av').innerHTML = atomSvg(p, mass ? n : 0);
    $('#who').innerHTML = `${X ? tile(X, true) : '<div class="el big none"><b>?</b></div>'}<p><b>${X ? cap(X.name) : 'Cap àtom'}</b><br>${p} ${p === 1 ? 'protó' : 'protons'} · ${p} ${p === 1 ? 'electró' : 'electrons'}${mass ? `<br>massa ${p} + ${n} = <b>${p + n}</b>` : ''}</p>`;
    stage.querySelector('[data-k="p"] .val').textContent = p; if (mass) stage.querySelector('[data-k="n"] .val').textContent = n;
  };
  stage.querySelector('.steppers').onclick = e => {
    const b = e.target.closest('.key'); if (!b || busy) return;
    const d = +b.dataset.d, k = b.closest('.stepper').dataset.k;
    if (k === 'p') p = Math.min(20, Math.max(0, p + d)); else n = Math.min(20, Math.max(0, n + d));
    blip(k === 'p' ? 520 + p * 20 : 330 + n * 14); draw();
  };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    if (p !== E.z) { slip(); again($('#who')).add('shake'); return tip(p ? `Ui! Amb ${p} ${p === 1 ? 'protó' : 'protons'} has fet ${the(byZ(p).name)}. Prem «Mira la taula» i busca ${the(E.name)}: quin número té?` : 'Ui! Sense protons no hi ha àtom.', 'oops'); }
    if (mass && n !== L.n) { slip(); again($('#who')).add('shake'); return tip(`Ui! És ${the(E.name)}, però ${p} + ${n} fa massa ${p + n}, i ha de ser ${E.z + L.n}.`, 'oops'); }
    busy = true; spark($('#av'), GROUPS[E.group][1]); $('#av').firstChild.classList.add('won');
    tip(`Un àtom ${de(E.name)}! ${E.fact}`, 'go');
    await sleep(1700); if (!t.on) return;
    win(mass ? `${E.sym}: ${E.z} protons + ${L.n} neutrons<br><small>massa ${E.z + L.n}</small>` : `${E.sym}: ${E.z} protons<br><small>i ${E.z} electrons que hi donen voltes</small>`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : mass ? `${cap(the(E.name))} és el número ${E.z}: té ${E.z} protons. Fins a ${E.z + L.n} en falten ${L.n}: aquests són els neutrons.` : `${cap(the(E.name))} és el número ${E.z} de la taula: li calen ${E.z} protons.`;
}

/* ---------- join atoms into molecules, as the formula says ---------- */
function mol({ t, L, stage, tip, slip, win }) {
  const M = MOLS[L.id], pot = [], MAX = 16;
  const say = f => list(f.map(([s, n]) => `${n} ${de(el(s).name)}`));
  const need = M.f.map(([s, n]) => [s, n * L.count]);
  let busy = false;
  stage.innerHTML = `<p class="goal"><b class="fml">${formula(L.id)}</b><span>${M.name}</span>${L.count > 1 ? `<b class="times">× ${L.count}</b>` : ''}</p>
    <div class="pot" id="pot"></div><p class="cap" id="cnt"></p>
    <div class="tray">${L.tray.map(s => `<button class="atomb" data-s="${s}" aria-label="Afegeix un àtom ${de(el(s).name)}">${ball(s)}<b>+ ${el(s).name}</b></button>`).join('')}</div>
    <div class="opts"><button class="btn" id="ok">Comprova</button><button class="btn soft" id="clr">Buida</button></div>`;
  const count = s => pot.filter(x => x === s).length;
  const draw = () => {
    $('#pot').innerHTML = pot.map((s, i) => `<button class="pb" data-i="${i}" aria-label="Treu aquest àtom">${ball(s)}</button>`).join('') || '<p class="cap">Toca els àtoms de sota per posar-los al matràs.</p>';
    $('#cnt').innerHTML = pot.length ? `Hi ha ${say(L.tray.map(s => [s, count(s)]).filter(x => x[1]))}. Toca un àtom del matràs per treure'l.` : '&nbsp;';
  };
  stage.querySelector('.tray').onclick = e => {
    const b = e.target.closest('.atomb'); if (!b || busy) return;
    if (pot.length >= MAX) return tip('El matràs és ple! Treu-ne algun.', 'oops');
    pot.push(b.dataset.s); plop(pot.length); draw();
  };
  $('#pot').onclick = e => { const b = e.target.closest('.pb'); if (b && !busy) { pot.splice(+b.dataset.i, 1); blip(330); draw(); } };
  $('#clr').onclick = () => { if (!busy) { pot.length = 0; blip(330); draw(); } };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    if (pot.length !== need.reduce((s, x) => s + x[1], 0) || need.some(([s, n]) => count(s) !== n)) {
      slip(); again($('#pot')).add('shake');
      return tip(`Ui! ${L.count > 1 ? `Cada molècula vol ${say(M.f)}, i n'has de fer ${L.count}.` : `La fórmula demana ${say(M.f)}.`} Compta què hi ha al matràs.`, 'oops');
    }
    busy = true; $('#pot').innerHTML = mols(L.id, L.count, 1.7); $('#pot').classList.add('made'); $('#cnt').innerHTML = '&nbsp;'; spark($('#pot'), 175);
    tip(`${L.count > 1 ? `${L.count} molècules` : 'Una molècula'} ${de(M.name)}! Els àtoms s'han agafat.`, 'go');
    await sleep(1700); if (!t.on) return;
    win(`${L.count > 1 ? L.count + ' ' : ''}${formula(L.id)} · ${M.name}<br><small>${say(need)}</small>`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : `A la fórmula, el número petit va amb la lletra del seu davant: cada molècula té ${say(M.f)}.${L.count > 1 ? ` Per fer-ne ${L.count}, multiplica per ${L.count}: ${say(need)}.` : ''}`;
}

/* ---------- a potion of drops in a proportion ---------- */
const ERL = 'M82 8h36v62l62 124q8 24-18 26H38q-26-2-18-26l62-124Z';
function mix({ t, L, stage, tip, slip, win }) {
  const inks = L.parts.map(p => p[0]), MAX = 16, g = L.given, counts = inks.map((_, i) => g && g[0] === i ? g[1] : 0);
  const k = L.want[0] / L.parts[0][1], sum = L.parts.reduce((s, p) => s + p[1], 0);
  let busy = false;
  stage.innerHTML = `${recipe(L.parts)}
    <p class="ask">${g ? `Al matràs ja hi ha <b>${inkText(inks[g[0]], g[1])}</b>. Acaba la poció.` : `Fes-ne <b>${L.total} gotes</b> en total.`}</p>
    <div class="row"><div class="flaskw" id="fw"><svg class="erl" id="erl" viewBox="0 0 200 230" aria-hidden="true"><defs><clipPath id="erlc"><path d="${ERL}"/></clipPath></defs>
        <g clip-path="url(#erlc)"><rect id="liq" width="200" height="230"/>${[60, 85, 110, 135, 100].map((x, i) => `<circle class="fz f${i}" cx="${x}" cy="214" r="${4 + i % 3}"/>`).join('')}</g>
        <path class="glass" d="${ERL}"/><path class="rim" d="M72 8h56"/><path class="shine" d="M62 150l-22 46"/></svg></div>
      <div class="side"><span class="sw" id="sw" style="--h:${blend(inks, L.want)}"></span><small>Així ha de quedar</small><b class="tot" id="tot"></b></div></div>
    <div class="inks">${inks.map((c, i) => `<div class="ink" style="--h:${INKS[c].hue}"><button class="dropb" data-i="${i}" data-d="1"${g && g[0] === i ? ' disabled' : ''} aria-label="Afegeix una gota ${INKS[c].one}">${DROP}<b>+1 ${INKS[c].one}</b></button>
      <span class="n"><b id="n${i}">0</b>${g && g[0] === i ? '<small>fix</small>' : `<button class="key sm" data-i="${i}" data-d="-1" aria-label="Treu una gota ${INKS[c].one}">−</button>`}</span></div>`).join('')}</div>
    <button class="btn" id="ok">Comprova</button>`;
  const draw = () => {
    const tot = counts.reduce((a, b) => a + b, 0), h = blend(inks, counts);
    $('#liq').style.transform = `translateY(${tot ? 214 - tot / MAX * 150 : 232}px)`; if (h != null) $('#erl').style.setProperty('--h', h);
    counts.forEach((n, i) => { $('#n' + i).textContent = n; }); $('#tot').textContent = `${tot} ${tot === 1 ? 'gota' : 'gotes'}`;
  };
  stage.querySelector('.inks').onclick = e => {
    const b = e.target.closest('[data-d]'); if (!b || busy || b.disabled) return;
    const i = +b.dataset.i, d = +b.dataset.d, tot = counts.reduce((a, c) => a + c, 0);
    if (d > 0 && tot >= MAX) return tip('El matràs és ple! Treu-ne alguna gota.', 'oops');
    if (d < 0 && !counts[i]) return;
    counts[i] += d; plop(tot);
    if (d > 0 && !RM) { const f = document.createElement('i'); f.className = 'fall'; f.style.setProperty('--h', INKS[inks[i]].hue); f.onanimationend = () => f.remove(); $('#fw').append(f); }
    draw();
  };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    const tot = counts.reduce((a, b) => a + b, 0);
    if (counts.some((n, i) => n !== L.want[i])) {
      slip(); again($('#fw')).add('shake');
      if (!g && tot !== L.total) return tip(`Ui! Hi ha ${tot} ${tot === 1 ? 'gota' : 'gotes'}, i n'han de ser ${L.total}.`, 'oops');
      const i = counts.findIndex((n, j) => n !== L.want[j]);
      return tip(`Ui! Hi ha ${list(inks.map((c, j) => inkText(c, counts[j], false)))}. ${counts[i] > L.want[i] ? 'Hi sobren' : 'Hi falten'} ${INKS[inks[i]].many}: la recepta vol ${inkText(...L.parts[0], false)} per cada ${inkText(...L.parts[1], false)}.`, 'oops');
    }
    busy = true; $('#erl').classList.add('fizz'); spark($('#fw'), blend(inks, counts)); chime([659, 784, 988], 0.1);
    tip(`${L.name} feta! La recepta ha entrat ${cops(k)}: ${L.parts.map(([c, n]) => `${k} × ${n} = ${n * k} ${INKS[c].many}`).join(', i ')}.`, 'go');
    await sleep(2200); if (!t.on) return;
    win(`${inks.map((c, i) => inkText(c, L.want[i], false)).join(' + ')}<br><small>${L.name}</small>`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : g ? `${cap(inkText(inks[g[0]], g[1]))} són ${cops(k)} la recepta: ${k} × ${L.parts[g[0]][1]} = ${g[1]}. Fes també ${cops(k)} les altres.`
    : `Un cop de recepta són ${L.parts.map(p => p[1]).join(' + ')} = ${sum} gotes. En ${L.total} hi cap ${cops(k)}: multiplica cada color per ${k}.`;
}

/* ---------- fill to a percentage: a cylinder to fill, or salt into a beaker by the spoon ---------- */
const NUDGE = { 50: 'El 50 % és la meitat.', 25: 'El 25 % és una quarta part.', 75: 'El 75 % són tres quartes parts.', 10: 'El 10 % és una desena part.', 5: 'El 5 % és la meitat del 10 %.', 20: 'El 20 % és el doble del 10 %.' };
function dose({ t, L, stage, tip, slip, win }) {
  const cyl = L.skin === 'cyl', unit = cyl ? 'ml' : 'g', max = cyl ? L.size : L.step * 10;
  let v = 0, busy = false;
  stage.innerHTML = cyl ? `<p class="ask">Omple el <b>${L.pct} %</b> de la proveta de ${L.size} ml.</p>
      <div class="row doser">${cylHtml(L.size, L.step, 0)}<div class="side"><b class="read" id="read"></b><div class="pm"><button class="key" data-d="1" aria-label="Més">+</button><button class="key" data-d="-1" aria-label="Menys">−</button></div><small>o toca la proveta</small></div></div>
      <button class="btn" id="ok">Comprova</button>`
    : `<p class="ask">Fes <b>${L.size} g</b> d'aigua salada al <b>${L.pct} %</b>. Quanta sal hi va?</p>
      <div class="row doser"><div class="beaker" id="cyl"><span class="tag">${L.size} g</span><div class="water"></div><div class="salt" id="salt"></div></div>
        <div class="side"><b class="read" id="read"></b><div class="pm"><button class="btn soft" data-d="1">+ 1 cullerada<br><small>${L.step} g de sal</small></button><button class="key" data-d="-1" aria-label="Treu una cullerada">−</button></div></div></div>
      <button class="btn" id="ok">Comprova</button>`;
  const draw = () => {
    $('#read').innerHTML = cyl ? `${v} ml` : `Sal: ${v} g`;
    if (cyl) $('#liq').style.height = v / L.size * 100 + '%'; else $('#salt').innerHTML = '<i></i>'.repeat(v / L.step * 6);
  };
  const set = x => { if (busy) return; const was = v; v = Math.min(max, Math.max(0, x)); if (v !== was) plop(v / L.step); draw(); };
  stage.querySelector('.pm').onclick = e => { const b = e.target.closest('[data-d]'); if (b) set(v + b.dataset.d * L.step); };
  if (cyl) $('#cyl').onclick = e => { const r = $('#cyl').getBoundingClientRect(); set(Math.round((r.bottom - e.clientY) / r.height * L.size / L.step) * L.step); };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    if (v !== L.want) { slip(); again($('#cyl')).add('shake'); return tip(`Ui! ${v} ${unit} és massa${v < L.want ? ' poc' : ''}. ${NUDGE[L.pct]}`, 'oops'); }
    busy = true; $('#cyl').classList.add('won'); spark($('#cyl'), 175);
    tip(`Just! ${pctHow(L.pct, L.size, unit)}`, 'go');
    await sleep(1900); if (!t.on) return;
    win(`${L.pct} % de ${L.size} ${unit} = ${L.want} ${unit}${cyl ? '' : '<br><small>de sal</small>'}`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : pctHow(L.pct, L.size, unit);
}

/* ---------- a reaction: as many of each molecule as the recipe says, for the ones already there ---------- */
function react({ t, L, stage, tip, slip, win }) {
  const all = [...L.left, ...L.right], nl = L.left.length, gi = L.given[0], counts = all.map((_, i) => i === gi ? L.given[1] : 0), MAX = 12;
  let busy = false;
  const card = ([id], i) => `<div class="sp${i >= nl ? ' out' : ''}" data-i="${i}"><b class="spn">${formula(id)} <small>${MOLS[id].name}</small></b><div class="box" id="bx${i}"></div>${stepper(i, '', counts[i], i === gi)}</div>`;
  stage.innerHTML = `${eqHtml(L.left, L.right)}
    <p class="ask">Hi ha <b>${counts[gi]} ${formula(all[gi][0])}</b>. Quantes en calen de les altres, i quantes en surten?</p>
    <div class="lab"><div class="grp">${L.left.map((s, i) => card(s, i)).join('')}</div><b class="op arrow">→</b><div class="grp">${L.right.map((s, i) => card(s, nl + i)).join('')}</div></div>
    <button class="btn" id="ok">Reacciona!</button>`;
  const cards = [...stage.querySelectorAll('.sp')];
  const draw = i => { $('#bx' + i).innerHTML = mols(all[i][0], counts[i], 0.7); cards[i].querySelector('.val').textContent = counts[i]; };
  stage.querySelector('.lab').onclick = e => {
    const b = e.target.closest('.key'); if (!b || busy) return;
    const i = +b.closest('.stepper').dataset.k;
    counts[i] = Math.min(MAX, Math.max(0, counts[i] + +b.dataset.d)); blip(440 + counts[i] * 25); draw(i);
  };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    const wrong = counts.flatMap((n, i) => n !== L.want[i] ? [i] : []);
    if (wrong.length) {
      slip(); wrong.forEach(i => again(cards[i]).add('shake'));
      return tip(`Ui! No surten els comptes amb ${list(wrong.map(i => formula(all[i][0])))}. Hi ha ${counts[gi]} ${formula(all[gi][0])} i la recepta en vol ${all[gi][1]}: quants cops es fa?`, 'oops');
    }
    busy = true; chime([392, 523, 659, 784], 0.07);
    cards.slice(0, nl).forEach(c => { c.classList.add('gone'); spark(c, 28); });
    await sleep(700); if (!t.on) return;
    cards.slice(nl).forEach(c => { c.classList.add('born'); spark(c, 175); });
    tip(`Reacció feta! La recepta s'ha fet ${cops(L.k)}: tots els números multiplicats per ${L.k}.`, 'go');
    await sleep(1900); if (!t.on) return;
    const side = (a, o) => a.map(([id], i) => `${counts[o + i]} ${formula(id)}`).join(' + ');
    win(`${side(L.left, 0)} → ${side(L.right, nl)}`);
  };
  all.forEach((_, i) => draw(i)); tip(L.say);
  return () => busy ? '' : `Hi ha ${counts[gi]} ${formula(all[gi][0])} i la recepta en vol ${all[gi][1]}: es fa ${cops(L.k)}. Multiplica per ${L.k} tots els números de la recepta.`;
}

/* ---------- questions over a drawing: one, or several that lean on each other ---------- */
// what each kind of drawing shows
const PIC = {
  // a strip split in its parts, each as wide as its percentage; a part with no number shows «?»
  bar: P => { const known = P.parts.reduce((s, p) => s + (p[1] || 0), 0), free = P.parts.filter(p => p[1] == null).length;
    return `<div class="comp">${P.total ? `<div class="rule"><b>${P.total}</b></div>` : ''}<div class="cbar">${P.parts.map(([, pct, h]) => `<div class="cp" style="flex:${pct ?? (100 - known) / free};--h:${h}"><b>${pct == null ? '?' : pct + ' %'}</b></div>`).join('')}</div>
      <p class="legend">${P.parts.map(([n, , h]) => `<span style="--h:${h}"><i></i>${n}</span>`).join('')}</p></div>`; },
  grid: P => `<div class="grid100" role="img" aria-label="Cent quadrets">${Array.from({ length: 100 }, (_, i) => `<i${i < P.n ? ' class="on"' : ''}></i>`).join('')}</div>`,
  cyl: P => `<div class="row doser still">${cylHtml(P.size, P.step, P.v)}</div>`,
  mols: P => P.list.map(([id, n]) => `<div class="mbox"><div class="mrow">${mols(id, n, n > 3 ? 1.25 : 2.2)}</div><p class="cap"><b class="fml">${formula(id)}</b> · ${MOLS[id].name}</p></div>`).join(''),
  text: P => `<div class="mbox"><b class="fml huge">${P.html}</b><p class="cap">${P.cap}</p></div>`,
  eq: P => eqHtml(P.left, P.right),
  drops: P => recipe(P.parts),
  parts: P => `<div class="comp"><div class="blocks">${P.parts.map(([n, k, h]) => `<span class="bg" style="--h:${h}">${'<i></i>'.repeat(k)}<b>${k} ${k > 1 ? 'parts' : 'part'} ${de(n)}</b></span>`).join('')}</div></div>`
};
const KEYS = `<div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k => `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
function ask({ t, L, stage, tip, slip, win }) {
  const notes = [];
  let k = -1, S, buf = '', busy = false;
  stage.innerHTML = `${PIC[L.pic.t](L.pic)}<ol class="notes" id="notes"></ol><p class="ask" id="q"></p><div class="ans" id="ans"></div>`;
  const val = v => `${v}${S.unit ? ' ' + S.unit : ''}`;
  const type = () => { $('#num').textContent = buf || '?'; };
  function arm() {
    k++; S = L.steps[k]; buf = ''; busy = false; openAt = performance.now() + SETTLE;
    $('#q').innerHTML = `${L.steps.length > 1 ? `<small>Pas ${k + 1} de ${L.steps.length}</small>` : ''}${S.q}`;
    $('#ans').innerHTML = S.opts ? `<div class="opts">${S.opts.map(v => `<button class="btn soft" data-v="${v}">${val(v)}</button>`).join('')}</div>`
      : `<div class="disp"><b id="num">?</b>${S.unit ? `<span>${S.unit}</span>` : ''}</div>${KEYS}`;
  }
  async function answer(v, btn) {
    if (busy || !t.on) return;
    if (v !== S.want) { slip(); if (btn) btn.disabled = true; else { buf = ''; type(); again($('.disp')).add('shake'); } return tip(`Ui! ${val(v)} no és. ${S.how}`, 'oops'); }
    busy = true; notes.push(S.done); $('#notes').innerHTML = notes.map(n => `<li>${n}</li>`).join(''); spark($('#notes').lastChild, 48);
    const last = k === L.steps.length - 1;
    tip(`${last ? 'Correcte!' : 'Molt bé!'} ${S.done}.`, 'go');
    if (!last) { chime([659, 784], 0.1); await sleep(900); if (t.on) arm(); return; }
    $('#ans').innerHTML = ''; $('#q').innerHTML = '';
    await sleep(1500); if (!t.on) return;
    win(`${S.done}${notes.length > 1 ? `<br><small>${notes.slice(0, -1).join('<br>')}</small>` : ''}`);
  }
  const press = key => {
    if (busy || S.opts) return;
    if (key === 'del') buf = buf.slice(0, -1); else if (key === 'ok') { if (buf) answer(+buf); return; } else if (buf.length < 4) buf = buf === '0' ? key : buf + key;
    blip(); type();
  };
  $('#ans').onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || e.timeStamp < openAt) return;
    if ('v' in b.dataset) answer(+b.dataset.v, b); else press(b.dataset.k);
  };
  keyFn = e => { const key = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null; if (key) { e.preventDefault(); press(key); } };
  arm(); tip(L.say);
  return () => busy ? '' : S.how;
}

soBtn(); paintXp(); seccions();
