import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, sectionMenu, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { SECTIONS, LEVELS, NOTES, WHERE, FIGS, beatsText, starsFor } from './logic.js';
import { staff, glyph } from './score.js';
import { band } from './sound.js';

const KEY = 'concert-de-l-estany';

// secs counts the levels done in each section; stars keeps the best of each level
let prog = { so: true, secs: SECTIONS.map(() => 0), stars: LEVELS.map(() => 0) };
{
  const d = load(KEY);
  if (d) prog = { so: d.so !== false,
    secs: prog.secs.map((_, i) => Math.min(10, Math.max(0, (Array.isArray(d.secs) && d.secs[i]) | 0))),
    stars: prog.stars.map((_, i) => Math.min(3, Math.max(0, (Array.isArray(d.stars) && d.stars[i]) | 0))) };
}
const save = () => store(KEY, prog);

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

// the tubes and the drum are the instruments of sound.js; the shared voice keeps the chimes, the fireworks and the clicks
const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const { pipe: blow, drum } = band(() => prog.so);
const FX = pond(tone);
const DRUM = `<svg class="drum" id="drum" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 24v22c0 6 11 10 24 10s24-4 24-10V24" fill="#C23B4E" stroke="#F7C64E" stroke-width="2.5"/><path d="M14 30l8 22M30 34l-8 18M30 34l10 20M50 30l-10 24" stroke="#F7C64E" stroke-width="2" fill="none"/><ellipse cx="32" cy="24" rx="24" ry="9" fill="#EAF8F4" stroke="#F7C64E" stroke-width="2.5"/><g class="sticks" stroke="#E8B77A" stroke-width="3.5" stroke-linecap="round"><path d="M4 4l22 17"/><path d="M60 4L38 21"/></g></svg>`;

const HURRAY = ['Bravo!', 'Molt bé!', 'Perfecte!', 'Genial!', 'Quin concert!'];
const HUES = [175, 262, 28];
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const frac = (n, d) => `<span class="fr"><b>${n}</b><i>${d}</i></span>`;
const TUBES = `<div class="tubes">${NOTES.map((n, i) => `<button class="tube" data-n="${i}" style="--h:${n.hue};--l:${n.len / 180}" aria-label="${n.name}"><span>${n.short}</span></button>`).join('')}</div>`;

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /concert-de-l-estany\.html$/.test(location.pathname);
function show(kicker, playing) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
}
$('#toS').onclick = () => seccions();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) blow(NOTES[4].freq, 0.3); };

// the number keys of a real keyboard play the tubes
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey && /^[1-8]$/.test(e.key)) keyFn(e.key - 1); });

function seccions() {
  fresh(); keyFn = null; show('Música i mates', false); FX.mood(HUES[0]);
  const stars = i => prog.stars.slice(i * 10, i * 10 + 10).reduce((x, y) => x + y, 0);
  sectionMenu($('#game'), 'Tria una secció. La música és plena de números: ho veuràs amb tubs, regles i tambors.', SECTIONS, prog.secs, level, i => stars(i) ? ` · ★ ${stars(i)}` : '');
}

/* ---------- one level: the frame is the same for all, the stage is of its kind ---------- */
function level(sec, idx) {
  const t = fresh(); keyFn = null; show(`Secció ${sec + 1} · ${SECTIONS[sec].name}`, true); FX.mood(HUES[sec]);
  const root = $('#game'), L = SECTIONS[sec].levels[idx];
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(SECTIONS[sec].levels, prog.secs[sec], idx)}
    <div class="hud"><span class="chip">${idx + 1} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <p class="status tip" id="tip"></p><div class="stage" id="stage"></div>`;
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { const e = $('#tip'); e.className = 'status tip ' + cls; e.innerHTML = txt; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); click(150, 0, 0.3, 0.12, 'triangle'); };
  const spark = (el, h = 48) => { if (el) { const p = mid(el); FX.burst(p.x, p.y, h, 14, 120); } };

  async function win(line) {
    const n = starsFor(slips), i = sec * 10 + idx, end = idx === 9, last = end && sec === SECTIONS.length - 1;
    over = true; keyFn = null; if (idx + 1 > prog.secs[sec]) prog.secs[sec] = idx + 1;
    prog.stars[i] = Math.max(prog.stars[i], n); save();
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(end ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel(stage, `<h2>${last ? 'Concert acabat!' : end ? 'Secció superada!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead">${last ? 'Ja saps llegir notes, tallar tubs amb fraccions i comptar els temps d\'un compàs.' : end ? `Has obert la secció ${sec + 2}: ${SECTIONS[sec + 1].name}.` : n === 3 ? 'Ni un sol error!' : 'Si hi tornes sense errors ni pistes, tindràs les tres estrelles.'}</p>
      <button class="btn" id="nx">${last ? 'Torna a les seccions' : end ? 'Secció següent' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => last ? seccions() : end ? level(sec + 1, 0) : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  // each kind draws its stage and gives back its hint: a function that shows the help and returns what the tip says
  const help = { play, cut, cm, beat }[L.kind]({ t, L, stage, tip, slip, spark, win });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars();
}

/* ---------- section 1: read the score and play it on the tubes ---------- */
function play({ t, L, stage, tip, slip, spark, win }) {
  const tune = L.tune;
  stage.innerHTML = `<div class="sheet">${staff(tune.map(([step, f]) => ({ step, fig: f, hue: L.help && step != null ? NOTES[step].hue : null, label: L.help > 1 && step != null ? NOTES[step].short : '' })))}</div>${TUBES}`;
  const nts = [...stage.querySelectorAll('.nt')], tubes = [...stage.querySelectorAll('.tube')];
  let k = 0, busy = false;
  // the rests pass on their own; the note to play glows
  const arm = () => {
    while (k < tune.length && tune[k][0] == null) nts[k++].classList.add('done');
    nts.forEach((e, i) => e.classList.toggle('now', i === k));
    tubes.forEach(e => e.classList.remove('hint'));
  };
  const ring = (i, dur = 0.5) => {
    blow(NOTES[i].freq, dur);
    const e = tubes[i], r = e.getBoundingClientRect(); e.classList.remove('ring', 'shake'); void e.offsetWidth; e.classList.add('ring');
    FX.ring(r.left + r.width / 2, r.top, NOTES[i].hue, 6, 44, 0.5);
  };
  async function tap(i) {
    if (busy || !t.on) return;
    const want = tune[k][0];
    ring(i);
    if (i !== want) {
      slip(); tubes[i].classList.add('shake');
      return tip(`Ui! Aquest tub és el ${NOTES[i].name}. La nota que brilla és ${WHERE[want]}: és el ${NOTES[want].name}.`, 'oops');
    }
    spark(nts[k], NOTES[i].hue); nts[k].classList.add('done'); k++; arm();
    if (k < tune.length) return;
    // the whole tune once more, each note as long as its figure says
    busy = true; tip('Ara escolta-la sencera!', 'go'); await sleep(800);
    for (let j = 0; j < tune.length; j++) {
      if (!t.on) return;
      const [step, f] = tune[j], d = FIGS[f].beats;
      nts.forEach((e, n) => { e.classList.toggle('now', n === j); e.classList.toggle('done', n > j); });
      if (step != null) ring(step, d * 0.45);
      await sleep(d * 420);
    }
    if (!t.on) return;
    nts.forEach(e => e.classList.remove('now', 'done'));
    win(`♪ ${L.title}`);
  }
  stage.querySelector('.tubes').onclick = e => { const b = e.target.closest('.tube'); if (b) tap(+b.dataset.n); };
  keyFn = tap; arm(); tip(L.say);
  return () => { if (busy) return ''; const w = tune[k][0]; tubes[w].classList.add('hint'); return `La nota que brilla és ${WHERE[w]}: és el ${NOTES[w].name}. El seu tub fa pampallugues.`; };
}

/* ---------- section 2: the Do tube cut to a fraction of its length ---------- */
// d equal pieces of the tube; the first keep of them stay and the rest are what is cut away
const segs = (d, keep = d, cls = 'off') => Array.from({ length: d }, (_, j) => `<button class="seg${j < keep ? '' : ' ' + cls}" data-j="${j}"></button>`).join('');
const target = N => `<p class="goal"><span class="dot" style="--h:${N.hue}"></span>El tub de ${N.name} fa ${frac(N.n, N.d)} del tub de Do</p>`;

function cut({ t, L, stage, tip, slip, spark, win }) {
  const N = NOTES[L.note];
  let d = 1, busy = false;
  stage.innerHTML = `<div class="row"><div class="sheet mini">${staff([{ step: L.note, fig: 'r', hue: N.hue }])}</div><button class="btn soft" id="hear">Escolta el ${N.name}</button></div>
    ${target(N)}
    <p class="cap">En quants trossos iguals parteixes el tub?</p><div class="parts">${[2, 3, 4, 5, 6].map(n => `<button class="key" data-d="${n}">${n}</button>`).join('')}</div>
    <div class="pipe" id="pipe">${segs(1)}</div><p class="cap" id="cap">Aquest és el tub de Do, sencer. Toca'l per sentir-lo.</p>`;
  const pipe = $('#pipe');
  $('#hear').onclick = () => blow(N.freq, 0.8);
  stage.querySelector('.parts').onclick = e => {
    const b = e.target.closest('.key'); if (!b || busy) return;
    d = +b.dataset.d; click(660, 0, 0.08, 0.05);
    stage.querySelectorAll('.key').forEach(k => k.classList.toggle('on', k === b));
    pipe.style.removeProperty('--h'); pipe.innerHTML = segs(d); $('#cap').textContent = `${d} trossos iguals. Toca l'últim tros que et vols quedar.`;
  };
  pipe.onclick = async e => {
    const b = e.target.closest('.seg'); if (!b || busy || !t.on) return;
    const keep = +b.dataset.j + 1;
    [...pipe.children].forEach((s, j) => s.classList.toggle('off', j >= keep));
    blow(NOTES[0].freq * d / keep, 0.7);
    if (keep === d) return tip(d === 1 ? 'Sencer, el tub fa un Do. Parteix-lo en trossos per poder-lo tallar.' : 'Si te\'l quedes tot, no l\'has tallat: continua sent un Do.');
    const said = `Te n'has quedat ${keep} de ${d} trossos: ${frac(keep, d)}.`;
    if (keep * N.d === N.n * d) {
      busy = true; pipe.style.setProperty('--h', N.hue); spark(pipe, N.hue);
      tip(`${said} Sona un ${N.name}!`, 'go'); await sleep(1300); if (!t.on) return;
      return win(`${N.name} = ${frac(N.n, N.d)} del tub de Do`);
    }
    const other = NOTES.find(x => keep * x.d === x.n * d), short = keep * N.d < N.n * d;
    slip(); tip(`${said} ${other ? `Sona un ${other.name}.` : ''} El tub ha quedat massa ${short ? 'curt: sona massa agut' : 'llarg: sona massa greu'}.`, 'oops');
  };
  tip(`Com més curt és el tub, més agut sona. Fes un ${N.name} tallant el tub de Do.`);
  return () => busy ? '' : `A ${frac(N.n, N.d)}, el número de sota diu en quants trossos iguals has de partir el tub: ${N.d}. El de dalt diu quants te'n quedes: ${N.n}.`;
}

function cm({ t, L, stage, tip, slip, spark, win }) {
  const N = NOTES[L.note], piece = L.base / N.d, want = piece * N.n;
  let busy = false;
  stage.innerHTML = `${target(N)}
    <div class="rule"><b>${L.base} cm</b></div><div class="pipe still" id="pipe">${segs(N.d, N.n, 'ghost')}</div>
    <p class="ask">El tub de Do fa ${L.base} cm. Quants centímetres fa el tub de ${N.name}?</p>
    <div class="opts">${L.opts.map(v => `<button class="btn soft" data-v="${v}">${v} cm</button>`).join('')}</div>`;
  const pipe = $('#pipe'), how = () => `Parteix ${L.base} cm en ${N.d} trossos iguals: cada tros fa ${piece} cm. ${N.n > 1 ? `Te'n quedes ${N.n}.` : 'Te\'n quedes un.'}`;
  const label = () => [...pipe.children].forEach(s => { s.textContent = piece; });
  stage.querySelector('.opts').onclick = async e => {
    const b = e.target.closest('button'); if (!b || busy || !t.on) return;
    if (+b.dataset.v !== want) { slip(); b.disabled = true; label(); return tip('Ui! ' + how(), 'oops'); }
    busy = true; label(); pipe.style.setProperty('--h', N.hue); pipe.classList.add('cutted'); blow(N.freq, 0.8); spark(pipe, N.hue);
    tip(`${L.base} : ${N.d} = ${piece}${N.n > 1 ? `, i ${piece} × ${N.n} = ${want}` : ''}. El ${N.name} fa ${want} cm!`, 'go');
    await sleep(1500); if (!t.on) return;
    win(`${frac(N.n, N.d)} de ${L.base} cm = ${want} cm`);
  };
  tip(`El dibuix mostra el tub de Do partit en ${N.d} trossos iguals. Els de color són els del ${N.name}.`);
  return () => { if (busy) return ''; label(); return how(); };
}

/* ---------- section 3: a bar of the drum with one figure missing ---------- */
function beat({ t, L, stage, tip, slip, spark, win }) {
  const figs = [...L.figs], gi = figs.indexOf(null);
  const have = figs.reduce((s, f) => s + (f ? FIGS[f].beats : 0), 0), want = L.beats - have;
  const missing = want === 0.5 ? 'hi falta mig temps' : want === 1 ? 'hi falta 1 temps' : `hi falten ${want} temps`;
  let busy = false;
  const draw = () => {
    $('#sheet').innerHTML = staff(figs.map(f => f ? { step: FIGS[f].rest ? null : 5, fig: f } : { gap: true }), { beats: L.beats, sig: true, bars: false });
    $('#strip').innerHTML = figs.map(f => f ? `<div class="blk${FIGS[f].rest ? ' rest' : ''}" style="flex:${FIGS[f].beats}"><b>${beatsText(FIGS[f].beats)}</b></div>` : `<div class="blk gap" style="flex:${want}"><b>?</b></div>`).join('');
    $('#sum').innerHTML = figs.map(f => f ? beatsText(FIGS[f].beats) : '<b>?</b>').join(' + ') + ` = ${L.beats} temps`;
  };
  stage.innerHTML = `<div class="row"><div class="sheet" id="sheet"></div>${DRUM}</div>
    <div class="bar4"><div class="strip" id="strip"></div><div class="ticks">${Array.from({ length: L.beats }, (_, i) => `<i>${i + 1}</i>`).join('')}</div></div>
    <p class="ask" id="sum"></p>
    <div class="pal">${L.pal.map(k => `<button class="figb" data-k="${k}">${glyph(k)}<b>${FIGS[k].name}</b><span>${beatsText(FIGS[k].beats)} temps</span></button>`).join('')}</div>`;
  draw();
  stage.querySelector('.pal').onclick = async e => {
    const b = e.target.closest('.figb'); if (!b || busy || !t.on) return;
    const k = b.dataset.k, F = FIGS[k];
    if (F.beats !== want) {
      slip(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      return tip(`Ui! ${F.rest ? 'El' : 'La'} ${F.name} val ${beatsText(F.beats)}. Al compàs ja hi ha ${beatsText(have)} temps: ${missing}.`, 'oops');
    }
    busy = true; figs[gi] = k; draw(); spark($('#strip').children[gi], 48);
    tip(`${figs.map(f => beatsText(FIGS[f].beats)).join(' + ')} = ${L.beats}. Compàs ple! Escolta'l.`, 'go'); await sleep(900);
    // the drum plays the bar twice: a hit for each note, nothing for a rest
    const nts = [...stage.querySelectorAll('.nt')], blks = [...$('#strip').children], dr = $('#drum');
    for (let rep = 0; rep < 2; rep++) for (let j = 0; j < figs.length; j++) {
      if (!t.on) return;
      const F2 = FIGS[figs[j]];
      nts.forEach((n, i) => n.classList.toggle('now', i === j)); blks.forEach((n, i) => n.classList.toggle('now', i === j));
      if (!F2.rest) { drum(); dr.classList.remove('hit'); void dr.offsetWidth; dr.classList.add('hit'); }
      await sleep(F2.beats * 460);
    }
    if (!t.on) return;
    nts.forEach(n => n.classList.remove('now')); blks.forEach(n => n.classList.remove('now'));
    win($('#sum').innerHTML);
  };
  tip(L.say);
  return () => busy ? '' : `Suma el que ja hi ha al compàs: ${beatsText(have)}. Fins a ${L.beats} ${missing}.`;
}

soBtn();
seccions();
