import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, NOTES, WHERE, FIGS, INTERVALS, POINTS, VALID, EXAM_PASS, beatsText, temps, starsFor, ratio, clean, noteOf, levelText, isOpen, examOpen,
  circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn } from './logic.js';
import { staff, glyph } from './score.js';
import { band } from './sound.js';

const KEY = 'concert-de-l-estany';
// ?obert at the end of the address opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = new URLSearchParams(location.search).has('obert');

// Facts only: { so, secs, stars, piscina, exams, fulls }. clean() makes a complete progress out of anything the browser holds, the save
// from before the cursus too: its stars already are the marks of its projects.
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

// the tubes and the drum are the instruments of sound.js; the shared voice keeps the chimes, the fireworks and the clicks
const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const { pipe: blow, drum } = band(() => prog.so);
const FX = pond(tone);

/* ---------- the drawings ---------- */
const DRUM = `<svg class="drum" viewBox="0 0 96 86" aria-hidden="true"><ellipse cx="48" cy="80" rx="34" ry="5" fill="rgb(0 0 0 / 0.35)"/>
  <path d="M10 34v28c0 9 17 15 38 15s38-6 38-15V34" fill="#C23B4E"/><path d="M10 34v28c0 9 17 15 38 15V46Z" fill="#9E2B40"/>
  <path d="M10 40c0 9 17 15 38 15s38-6 38-15M10 58c0 9 17 15 38 15s38-6 38-15" fill="none" stroke="#F7C64E" stroke-width="3.5"/>
  <path d="M18 49l12 22M42 53l-12 18M42 53l14 19M68 51l-12 21M68 51l12 15" stroke="#FFE7A6" stroke-width="1.8" fill="none"/>
  <ellipse class="skin" cx="48" cy="34" rx="38" ry="14" fill="#F3FBF8" stroke="#F7C64E" stroke-width="3.5"/><ellipse cx="42" cy="31" rx="20" ry="6" fill="#fff" opacity="0.7"/>
  <g class="sticks" stroke-linecap="round"><path d="M6 4l32 24" stroke="#E8B77A" stroke-width="4.5"/><circle cx="39" cy="29" r="4" fill="#F4D6A8"/><path d="M90 4L58 28" stroke="#E8B77A" stroke-width="4.5"/><circle cx="57" cy="29" r="4" fill="#F4D6A8"/></g></svg>`;
// the frog that conducts: it says the tips, hops when something goes well and shakes when not
const FROG = `<svg class="frog" viewBox="-40 -52 80 74" aria-hidden="true"><ellipse cx="0" cy="16" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 12q-9-2-7-9q7 2 11 6ZM25 12q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-6" rx="25" ry="20" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <ellipse cx="0" cy="1" rx="15" ry="11" fill="#BFF0B4" opacity="0.75"/>
  <circle cx="-12" cy="-26" r="9.5" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-26" r="9.5" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="-11" cy="-25" r="4" fill="#0F3A40"/><circle cx="13" cy="-25" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-27" r="1.4" fill="#fff"/><circle cx="14.5" cy="-27" r="1.4" fill="#fff"/>
  <path d="M-10 -9Q0 -1 10 -9" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-9 7l9 6 9-6-9-4Z" fill="#FF6B9A"/><circle cy="8" r="2.6" fill="#C23B4E"/>
  <g class="baton"><path d="M22 -2L37 -30" stroke="#F3FBF8" stroke-width="2.6" stroke-linecap="round"/><circle cx="22" cy="-2" r="4.5" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/><circle cx="37" cy="-30" r="2.6" fill="#F7C64E"/></g></svg>`;
const SCISSORS = `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6.5" cy="5.5" r="3"/><circle cx="17.5" cy="5.5" r="3"/><path d="M8.3 8L16 21M15.7 8L8 21"/></g></svg>`;
const WAVE = '<svg class="wave" id="wave" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path/></svg>';
const TUBES = `<div class="tubes">${NOTES.map((n, i) => `<button class="tube" data-n="${i}" style="--h:${n.hue};--l:${n.len / 180}" aria-label="${n.name}"><span>${n.short}</span></button>`).join('')}</div>`;

const HURRAY = ['Bravo!', 'Molt bé!', 'Perfecte!', 'Genial!', 'Quin concert!'];
const HUES = [175, 262, 28, 205, 318, 48, 140];
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const frac = (n, d) => `<span class="fr"><b>${n}</b><i>${d}</i></span>`;
// takes the one-shot classes off an element and gives its class list back, so the same animation can start again
const again = e => { e.classList.remove('ring', 'shake', 'hit', 'on', 'ok'); void e.getBoundingClientRect(); return e.classList; };

const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
// The vibrations of some notes over the same stretch of time, a row of dots each: the rows start together at the line on the left
// and are together again at the line on the right. Few dots between the lines is what the ear hears as round
function pulses(steps) {
  const r = ratio(steps);
  return `<div class="pulses">${steps.map((s, i) => `<div class="prow${r[i] > 12 ? ' many' : ''}" style="--h:${NOTES[s].hue}"><b>${NOTES[s].short}</b><span class="track">${Array.from({ length: r[i] }, (_, k) => `<i style="left:${k / r[i] * 100}%"></i>`).join('')}</span><b>${r[i]}</b></div>`).join('')}</div>`;
}
// the wave of a note, drawn on the strip of the stage: a tube half as long makes waves twice as tight
function wave(ratio, hue) {
  const e = $('#wave'); if (!e) return;
  let d = 'M0 20'; for (let x = 2; x <= 300; x += 2) d += `L${x} ${(20 - 14 * Math.sin(x / 300 * ratio * 3 * 2 * Math.PI)).toFixed(1)}`;
  e.firstChild.setAttribute('d', d); e.style.setProperty('--h', hue); again(e).add('on');
}
const sing = (freq, dur, hue) => { blow(freq, dur); wave(freq / NOTES[0].freq, hue); };
// keeps the note being played in the middle of a score too long for its sheet
function seek(sheet, el) {
  if (!el || sheet.scrollWidth <= sheet.clientWidth) return;
  const a = sheet.getBoundingClientRect(), b = el.getBoundingClientRect();
  sheet.scrollTo({ left: sheet.scrollLeft + b.left - a.left - (a.width - b.width) / 2, behavior: RM ? 'auto' : 'smooth' });
}

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /concert-de-l-estany\.html$/.test(location.pathname);
// inner screens show ← Mapa instead of ← Tots els jocs; the sky takes the colour of the circle or of the project
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toM').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) blow(NOTES[4].freq, 0.3); };

// a real keyboard: the level on screen says what its keys do
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) keyFn(e); });
// a tap that comes less than SETTLE after a screen or a question came up was meant for what was there before: the buttons that answer ignore it
const SETTLE = 450;
let openAt = 0;
const spark = (el, h = 48) => { if (el) { const p = mid(el); FX.burst(p.x, p.y, h, 14, 120); } };
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
// each kind of level draws its stage and gives back its hint: a function that shows the help and returns what the tip says
const KIND = { play, cut, cm, beat, step, fit, drum: tapping, chord, pair };

/* ---------- the map: three bands, one button for each project and the exam of the circle at the end ---------- */
const RING = [140, 195, 262];   // the colour of each circle
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 60% 60%)" stroke-width="2.4" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c);
const noteText = i => { const n = noteOf(prog, i); return n >= VALID ? `Nota ${n} · validat ✓` : prog.secs[i] ? `Nota ${n} · ${prog.secs[i]} de 10 nivells` : 'Per fer'; };
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
  fresh(); show('El mapa', false, 165);
  const band = c => `<section class="ring r${c}${openC(c) ? '' : ' shut'}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}"${openC(c) ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice();
  $('#game').innerHTML = `<div class="map">${tip ? `<p class="next">${tip}</p>` : ''}${CIRCLES.map((_, c) => band(c)).join('')}
    <div class="extra"><button class="btn soft" id="full"${OPEN || PROJECTS.some((_, i) => noteOf(prog, i) >= VALID) ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div></div>`;
  $('#game').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level that still has something to win, as far as the project is open
      const i = +b.dataset.p, k = prog.stars.slice(i * 10, i * 10 + 10).findIndex(n => n < 3);
      level(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : prog.secs[i], 9));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the Piscina: three notes to find on the tubes, the first thing a profile with nothing saved meets ---------- */
// Each note comes with its name and the colour of its tube; a wrong tube only sounds. The third one saves piscina and opens the map.
// There is no «← Mapa» here: the map would have every circle shut, so the way out is the page of all games.
function piscina() {
  const t = fresh(); show('La Piscina', true, 165); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  let k = -1, busy = false;
  function arm() {
    k++; busy = false;
    const N = NOTES[POOL[k]];
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="sheet mini">${staff([{ step: POOL[k], fig: 'r', hue: N.hue, label: N.short }], { bars: false })}</div>${WAVE}${TUBES}`;
    const { tubes, ring } = tubesOf(stage);
    const tap = async i => {
      if (busy || !t.on) return;
      ring(i);
      if (i !== POOL[k]) return tubes[i].classList.add('shake');
      const last = k === POOL.length - 1;
      busy = true; dots[k].classList.add('ok'); spark(tubes[i], N.hue);
      if (last) { prog = { ...prog, piscina: true }; save(); }
      say(`Sí! És el ${N.name}.`, 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(last ? 16 : 8);
      await sleep(1100); if (!t.on) return;
      last ? mapa() : arm();
    };
    stage.querySelector('.tubes').onclick = e => { const b = e.target.closest('.tube'); if (b) tap(+b.dataset.n); };
    keyFn = e => { if (/^[1-8]$/.test(e.key)) tap(e.key - 1); };
    say('Toca el tub d\'aquesta nota.');
  }
  arm();
}

/* ---------- one level of a project: the frame is the same for all, the stage is of its kind ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), L = PROJECTS[sec].levels[idx];
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, prog.secs[sec], idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip"></p></div><div class="stage" id="stage"></div>`;
  if (OPEN) root.querySelectorAll('.levels button').forEach(b => { b.disabled = false; b.removeAttribute('title'); });
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); click(150, 0, 0.3, 0.12, 'triangle'); };

  // the level is handed in at once, before any wait: its stars go to the mark of the project, and the mark to the XP once the project is validated
  async function win(line) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  const help = KIND[L.kind]({ t, L, stage, tip, slip, spark, win });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars();
  // on a short screen the end of the stage can be under the fold, and a child does not know there is more: start from the frog's tip
  if (stage.getBoundingClientRect().bottom > innerHeight) $('#coach').scrollIntoView({ block: 'start', behavior: 'auto' });
}

/* ---------- the exam of a circle: six levels of its projects, one try each, no hints, saved by the sixth ---------- */
// what the frog says instead of the tip of the level: only what there is to do
const ASK = { play: 'Toca la partitura amb els tubs.', cut: 'Talla el tub de Do perquè soni la nota.', cm: 'Tria quants centímetres fa el tub.', beat: 'Tria la figura que falta al compàs.',
  step: 'Toca el tub on arriba el salt.', fit: 'Tria quantes n\'hi caben.', drum: 'Prem «1 · Escolta» i després «2 · Ara jo!».', chord: 'Tria els tubs de l\'acord.', pair: 'Escolta els dos grups i tria\'n un.' };
// Each question is a level played as ever, but its first slip ends it as missed and there is no hint button: the level gets a token of its own
// that goes off with the answer, so nothing of it moves afterwards. Nothing is saved before the sixth answer, which is handed in at once (examIn).
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]);
  const qs = exam(c, Math.random), run = [], { stage, tail, dots, say } = frame(qs.length, 'Sis preguntes');
  let k = -1, res = null;
  const next = () => k === qs.length - 1 ? finish() : arm();
  function arm() {
    k++;
    const L = qs[k], last = k === qs.length - 1, qt = { get on() { return t.on && !done; } };
    let done = false, failed = false;
    const end = ok => {
      if (done || !t.on) return;
      done = true; failed = !ok; keyFn = null; stage.inert = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
      if (last) { res = examIn(prog, c, qs, run); res.first = res.good && !prog.exams[c]; prog = res.prog; save(); }
      if (ok) { say('Correcte!', 'go'); chime([523, 659, 784]); FX.celebrate(6); return sleep(1000).then(() => { if (t.on) next(); }); }
      say('No és correcte.', 'oops'); click(150, 0, 0.3, 0.12, 'triangle'); openAt = performance.now() + SETTLE;
      tail.innerHTML = `<button class="btn" id="nx">${last ? 'Mira el resultat' : 'Segueix'}</button>`;
      $('#nx').onclick = e => { if (e.timeStamp >= openAt) next(); };
    };
    // of what the level says, the exam keeps the cheers while it runs and, once missed, why it was wrong
    const tip = (txt, cls = '') => { if (cls === 'oops' ? failed : cls === 'go' && !done) say(txt.replace(/^Ui! /, ''), cls); };
    stage.inert = false; tail.innerHTML = ''; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[L.p].name}`;
    say(ASK[L.kind]);
    KIND[L.kind]({ t: qt, L, stage, tip, slip: () => end(false), spark, win: () => end(true) });
    if (stage.getBoundingClientRect().bottom > innerHeight) $('#coach').scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  // the end: how many were right, whether the exam is passed and what that gives and opens, and what to go over
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    panel(stage, `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? 'Molt bé! Però l\'examen només compta amb tots els projectes del cercle validats.' : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  }
  arm();
}

/* ---------- «Caça l'errada»: three things a sheet says, one after the other; from none to two of them are wrong ---------- */
// What each kind of claim draws, what it says, how one of its values is written and what was true
const CLAIMS = {
  bar: C => ({ pic: `<div class="sheet low">${staff(C.figs.map(f => ({ step: FIGS[f].rest ? null : 5, fig: f })), { bars: false })}</div>`,
    txt: `Aquest compàs suma <b>${temps(C.says)} temps</b>.`, val: v => `${temps(v)} temps`, truth: `suma ${temps(C.real)} temps` }),
  tube: C => { const N = NOTES[C.note]; return { pic: `${target(N)}<div class="rule"><b>${C.base} cm</b></div><div class="pipe still" style="--h:${N.hue}">${segs(N.d, N.n, 'ghost')}</div>`,
    txt: `Si el tub de Do fa ${C.base} cm, el de ${N.name} fa <b>${C.says} cm</b>.`, val: v => `${v} cm`, truth: `fa ${C.real} cm` }; },
  step: C => { const A = NOTES[C.from], B = NOTES[C.to]; return { pic: `<div class="sheet mini">${staff([{ step: C.from, fig: 'b', hue: A.hue, label: A.short }, { step: C.to, fig: 'b', hue: B.hue, label: B.short }], { bars: false })}</div>`,
    txt: `Del ${A.name} al ${B.name} hi ha una <b>${INTERVALS[C.says]}</b>.`, val: v => INTERVALS[v], truth: `hi ha una ${INTERVALS[C.real]}` }; },
  fit: C => { const B = FIGS[C.big], S = FIGS[C.small]; return { pic: `<div class="row"><div class="figcard">${glyph(C.big)}<b>1 ${B.name}</b></div><div class="figcard">${glyph(C.small)}<b>${S.pl}</b></div></div>`,
    txt: `En una ${B.name} hi caben <b>${C.says} ${S.pl}</b>.`, val: v => String(v), truth: `hi caben ${C.real} ${S.pl}` }; }
};
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the value that makes it true,
// with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres fulls');
  let k = -1, C, D, busy, res = null;
  function arm() {
    k++; C = cs[k]; D = CLAIMS[C.kind](C); busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `${D.pic}<p class="ask claim">${D.txt}</p>`;
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Mira-ho bé: és veritat?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); }
    else { say(said, 'oops'); click(150, 0, 0.3, 0.12, 'triangle'); }
    await sleep(ok ? 1200 : 2600); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`el ${i + 1} (${CLAIMS[c.kind](c).truth})`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
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
    else if ('v' in b.dataset) { const ok = +b.dataset.v === C.real; answer(ok, ok ? `Arreglat: ${D.truth}.` : `No era aquest: ${D.truth}.`); }
  };
  arm();
}

// the tubes of a stage: ring(i) sounds one and makes it glow
function tubesOf(stage) {
  const tubes = [...stage.querySelectorAll('.tube')];
  const ring = (i, dur = 0.5) => {
    sing(NOTES[i].freq, dur, NOTES[i].hue);
    const e = tubes[i], r = e.getBoundingClientRect(); again(e).add('ring');
    FX.ring(r.left + r.width / 2, r.top, NOTES[i].hue, 6, 44, 0.5);
  };
  return { tubes, ring };
}

/* ---------- read the score and play it on the tubes ---------- */
function play({ t, L, stage, tip, slip, spark, win }) {
  const tune = L.tune;
  stage.innerHTML = `<div class="sheet" id="sheet">${staff(tune.map(([step, f]) => ({ step, fig: f, hue: L.help && step != null ? NOTES[step].hue : null, label: L.help > 1 && step != null ? NOTES[step].short : '' })))}</div>${WAVE}${TUBES}`;
  const nts = [...stage.querySelectorAll('.nt')], { tubes, ring } = tubesOf(stage), sheet = $('#sheet');
  let k = 0, busy = false;
  // the rests pass on their own; the note to play glows
  const arm = () => {
    while (k < tune.length && tune[k][0] == null) nts[k++].classList.add('done');
    nts.forEach((e, i) => e.classList.toggle('now', i === k));
    tubes.forEach(e => e.classList.remove('hint')); seek(sheet, nts[k]);
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
      nts.forEach((e, n) => { e.classList.toggle('now', n === j); e.classList.toggle('done', n > j); }); seek(sheet, nts[j]);
      if (step != null) ring(step, d * 0.45);
      await sleep(d * 420);
    }
    if (!t.on) return;
    nts.forEach(e => e.classList.remove('now', 'done'));
    win(`♪ ${L.title}`);
  }
  stage.querySelector('.tubes').onclick = e => { const b = e.target.closest('.tube'); if (b) tap(+b.dataset.n); };
  keyFn = e => { if (/^[1-8]$/.test(e.key)) tap(e.key - 1); };
  arm(); tip(L.say);
  return () => { if (busy) return ''; const w = tune[k][0]; tubes[w].classList.add('hint'); return `La nota que brilla és ${WHERE[w]}: és el ${NOTES[w].name}. El seu tub fa pampallugues.`; };
}

/* ---------- from one note to another: the interval counts both ends ---------- */
function step({ t, L, stage, tip, slip, spark, win }) {
  const from = L.from, to = from + L.jump, n = Math.abs(L.jump) + 1, dir = Math.sign(L.jump), name = INTERVALS[n], A = NOTES[from], B = NOTES[to];
  const chain = Array.from({ length: n }, (_, i) => from + dir * i);
  const sheetOf = done => staff([{ step: from, fig: 'b', hue: A.hue, label: A.short }, done ? { step: to, fig: 'b', hue: B.hue, label: B.short } : { gap: true }], { bars: false });
  stage.innerHTML = `<div class="row"><div class="sheet mini" id="sheet">${sheetOf(false)}</div><p class="goal two">Una <b class="sun">${name}</b> ${dir > 0 ? 'amunt' : 'avall'}<br>des del ${A.name}</p></div>${WAVE}${TUBES}`;
  const { tubes, ring } = tubesOf(stage);
  let busy = false;
  // the tubes of the interval show their number in the count
  const count = () => chain.forEach((s, i) => { tubes[s].dataset.c = i + 1; });
  const how = () => `Compta començant pel ${A.name}: ${chain.map((s, i) => `${NOTES[s].name} ${i + 1}`).join(', ')}.`;
  tubes[from].dataset.c = 1;
  async function tap(i) {
    if (busy || !t.on) return;
    ring(i);
    if (i !== to) { slip(); tubes[i].classList.add('shake'); count(); return tip('Ui! ' + how(), 'oops'); }
    busy = true; count(); $('#sheet').innerHTML = sheetOf(true); spark(tubes[to], B.hue);
    // the numbers under the interval: how many times each note vibrates while the other does. Small numbers meet often
    const lo = Math.min(from, to), hi = Math.max(from, to), [q, p] = ratio([lo, hi]), round = q <= 6;
    $('#wave').outerHTML = pulses([lo, hi]);
    tip(`Del ${A.name} al ${B.name} hi ha una ${name}! Mentre el ${NOTES[lo].name} vibra ${q} ${q > 1 ? 'cops' : 'cop'}, el ${NOTES[hi].name} en vibra ${p}. ${round ? 'Números petits: les ones es troben sovint i sonen bé juntes.' : 'Números grans: les ones gairebé no es troben, i juntes sonen tibants.'}`, 'go');
    // one after the other, and then both at once
    await sleep(1000); if (!t.on) return; ring(from, 0.5); await sleep(520); if (!t.on) return; ring(to, 0.5);
    await sleep(700); if (!t.on) return; ring(from, 1.4); ring(to, 1.4); await sleep(3200); if (!t.on) return;
    win(`${A.name} → ${B.name}: una ${name}<br><small>${p} vibracions per cada ${q}</small>`);
  }
  stage.querySelector('.tubes').onclick = e => { const b = e.target.closest('.tube'); if (b) tap(+b.dataset.n); };
  keyFn = e => { if (/^[1-8]$/.test(e.key)) tap(e.key - 1); };
  tip(L.say);
  return () => { if (busy) return ''; count(); return how(); };
}

/* ---------- chords: notes at once, and the numbers that say why they sound well ---------- */
// build the chord on the tubes: tap its notes, and they sound together when the last one is in
function chord({ t, L, stage, tip, slip, spark, win }) {
  const want = L.notes, names = s => list(s.map(i => NOTES[i].name));
  stage.innerHTML = `<div class="row"><div class="sheet mini" id="sheet">${staff([{ gap: true }], { bars: false })}</div><p class="goal two">Acord de <b class="sun">${L.name}</b><br>${want.length} notes alhora</p></div>
    <div class="pz" id="pz"><p class="cap">Tria ${want.length} tubs. Quan els tinguis, sonaran junts.</p></div>${TUBES}`;
  const { tubes, ring } = tubesOf(stage), sel = new Set();
  let busy = false;
  async function tap(i) {
    if (busy || !t.on) return;
    sel.has(i) ? sel.delete(i) : sel.add(i); tubes[i].classList.toggle('sel', sel.has(i)); tubes[i].classList.remove('hint'); ring(i);
    if (sel.size < want.length) return;
    busy = true;
    const got = [...sel].sort((a, b) => a - b), r = ratio(got), said = `${names(got)} vibren ${list(r)} cops en el mateix temps.`;
    await sleep(500); if (!t.on) return;
    got.forEach(s => ring(s, 1.4)); $('#pz').innerHTML = pulses(got);
    if (got.join() === want.join()) {
      $('#sheet').innerHTML = staff([{ steps: want, fig: 'r' }], { bars: false }); spark($('#pz'), 48);
      tip(`${said} ${Math.max(...r) <= 8 ? 'Números petits: les ones es troben sovint i sona rodó!' : 'Sona bé, però els números són més grans que 4, 5 i 6: per això és més fosc i trist. És un acord menor.'}`, 'go');
      await sleep(3200); if (!t.on) return;
      return win(`${got.map(s => NOTES[s].short).join(' · ')}<br><small>${r.join(' : ')}</small>`);
    }
    slip(); tip(`${said} ${got.some((x, j) => got[j + 1] === x + 1) ? 'Hi ha notes de costat: fan números més grans, les ones es troben poc i xoquen.' : `No és l'acord de ${L.name}.`} Comença pel ${NOTES[want[0]].name} i tria una nota sí, una no.`, 'oops');
    await sleep(2200); if (!t.on) return;
    sel.clear(); tubes.forEach(e => e.classList.remove('sel')); busy = false;
  }
  stage.querySelector('.tubes').onclick = e => { const b = e.target.closest('.tube'); if (b) tap(+b.dataset.n); };
  keyFn = e => { if (/^[1-8]$/.test(e.key)) tap(e.key - 1); };
  tip(L.say);
  return () => { if (busy) return ''; want.forEach(s => tubes[s].classList.add('hint')); return `Les notes de l'acord són ${names(want)}: els seus tubs fan pampallugues.`; };
}

// two groups of notes: listen to both, look at their numbers and choose
function pair({ t, L, stage, tip, slip, spark, win }) {
  let busy = false;
  stage.innerHTML = `<p class="ask">${L.q}</p><div class="cards">${L.sets.map((s, k) => `<div class="card" data-k="${k}"><b class="names">${s.map(i => NOTES[i].short).join(' · ')}</b>${pulses(s)}
    <div class="opts"><button class="btn soft" data-do="hear" data-k="${k}">Escolta</button><button class="btn" data-do="pick" data-k="${k}">Aquest!</button></div></div>`).join('')}</div>`;
  const cards = [...stage.querySelectorAll('.card')];
  const sound = k => { L.sets[k].forEach(i => sing(NOTES[i].freq, 1.3, NOTES[i].hue)); again(cards[k]).add('ring'); };
  stage.querySelector('.cards').onclick = async e => {
    const b = e.target.closest('button'); if (!b || busy || !t.on) return;
    const k = +b.dataset.k; sound(k);
    if (b.dataset.do === 'hear') return;
    if (k !== L.good) { slip(); cards[k].classList.add('shake'); return tip('Ui! ' + L.why, 'oops'); }
    busy = true; cards[k].classList.add('won'); spark(cards[k], 48); tip(L.why, 'go');
    await sleep(3200); if (!t.on) return;
    win(`${L.sets[k].map(i => NOTES[i].short).join(' · ')}<br><small>${ratio(L.sets[k]).join(' : ')}</small>`);
  };
  tip(L.say);
  return () => busy ? '' : 'Cada punt és una vibració, i les ratlles grogues són on totes les notes es troben. Compta els punts: com menys n\'hi ha, més sovint es troben i més rodó sona.';
}

/* ---------- the Do tube cut to a fraction of its length ---------- */
const segs = (d, keep = d, cls = 'off') => Array.from({ length: d }, (_, j) => `<span class="seg${j < keep ? '' : ' ' + cls}"></span>`).join('');
const target = N => `<p class="goal"><span class="dot" style="--h:${N.hue}"></span>El tub de ${N.name} fa ${frac(N.n, N.d)} del tub de Do</p>`;

function cut({ t, L, stage, tip, slip, spark, win }) {
  const N = NOTES[L.note];
  let d = 1, keep = 1, busy = false;
  stage.innerHTML = `<div class="row"><div class="sheet mini">${staff([{ step: L.note, fig: 'r', hue: N.hue, label: N.short }])}</div><button class="btn soft" id="hear">Escolta el ${N.name}</button></div>
    ${target(N)}${WAVE}
    <p class="cap"><b>1.</b> En quants trossos iguals parteixes el tub?</p><div class="parts">${[2, 3, 4, 5, 6].map(n => `<button class="key" data-d="${n}">${n}</button>`).join('')}</div>
    <p class="cap"><b>2.</b> Toca unes tisores per tallar el tub per allà.</p>
    <div class="cutter"><div class="cuts" id="cuts"></div><div class="pipe" id="pipe">${segs(1)}</div></div>
    <p class="cap" id="left">Aquest és el tub de Do, sencer. Toca'l per sentir-lo.</p>`;
  const pipe = $('#pipe'), cuts = $('#cuts');
  const sound = () => sing(NOTES[0].freq * d / keep, 0.7, pipe.style.getPropertyValue('--h') || 0);
  $('#hear').onclick = () => sing(N.freq, 0.8, N.hue);
  pipe.onclick = () => { if (!busy) sound(); };
  stage.querySelector('.parts').onclick = e => {
    const b = e.target.closest('.key'); if (!b || busy) return;
    d = keep = +b.dataset.d; click(660, 0, 0.08, 0.05);
    stage.querySelectorAll('.key').forEach(k => k.classList.toggle('on', k === b));
    pipe.style.removeProperty('--h'); pipe.innerHTML = segs(d);
    // a pair of scissors over every joint: the cut goes there, and what is left of it stays
    cuts.innerHTML = Array.from({ length: d - 1 }, (_, j) => `<button class="snip" data-k="${j + 1}" style="left:${(j + 1) / d * 100}%" aria-label="Talla i queda't ${j + 1} de ${d} trossos">${SCISSORS}</button>`).join('');
    $('#left').innerHTML = `${d} trossos iguals. On tallis, <b>es queda la part de l'esquerra</b> i la de la dreta cau.`;
  };
  cuts.onclick = async e => {
    const b = e.target.closest('.snip'); if (!b || busy || !t.on) return;
    keep = +b.dataset.k;
    [...pipe.children].forEach((s, j) => { s.classList.toggle('off', j >= keep); s.textContent = j < keep ? j + 1 : ''; });
    [...cuts.children].forEach(c => c.classList.toggle('used', c === b));
    click(1200, 0, 0.05, 0.08); sound();
    const said = `Et quedes ${keep} de ${d} trossos: ${frac(keep, d)}.`;
    $('#left').innerHTML = said;
    if (keep * N.d === N.n * d) {
      busy = true; pipe.style.setProperty('--h', N.hue); spark(pipe, N.hue); cuts.innerHTML = '';
      tip(`${said} Sona un ${N.name}!`, 'go'); await sleep(1300); if (!t.on) return;
      return win(`${N.name} = ${frac(N.n, N.d)} del tub de Do`);
    }
    const other = NOTES.find(x => keep * x.d === x.n * d), short = keep * N.d < N.n * d;
    slip(); tip(`${said} ${other ? `Sona un ${other.name}.` : ''} El tub ha quedat massa ${short ? 'curt: sona massa agut' : 'llarg: sona massa greu'}.`, 'oops');
  };
  tip(`Com més curt és el tub, més agut sona, i més juntes són les ones. Fes un ${N.name} tallant el tub de Do.`);
  return () => busy ? '' : `A ${frac(N.n, N.d)}, el número de sota diu en quants trossos iguals has de partir el tub: ${N.d}. El de dalt diu quants te'n quedes: ${N.n}. Talla amb les tisores que hi ha just després del tros ${N.n}.`;
}

function cm({ t, L, stage, tip, slip, spark, win }) {
  const N = NOTES[L.note], piece = L.base / N.d, want = piece * N.n;
  let busy = false;
  stage.innerHTML = `${target(N)}${WAVE}
    <div class="rule"><b>${L.base} cm</b></div><div class="pipe still" id="pipe">${segs(N.d, N.n, 'ghost')}</div>
    <p class="ask">El tub de Do fa ${L.base} cm. Quants centímetres fa el tub de ${N.name}?</p>
    <div class="opts">${L.opts.map(v => `<button class="btn soft" data-v="${v}">${v} cm</button>`).join('')}</div>`;
  const pipe = $('#pipe'), how = () => `Parteix ${L.base} cm en ${N.d} trossos iguals: cada tros fa ${piece} cm. ${N.n > 1 ? `Te'n quedes ${N.n}.` : 'Te\'n quedes un.'}`;
  const label = () => [...pipe.children].forEach(s => { s.textContent = piece; });
  stage.querySelector('.opts').onclick = async e => {
    const b = e.target.closest('button'); if (!b || busy || !t.on) return;
    if (+b.dataset.v !== want) { slip(); b.disabled = true; label(); return tip('Ui! ' + how(), 'oops'); }
    busy = true; label(); pipe.style.setProperty('--h', N.hue); pipe.classList.add('cutted'); sing(N.freq, 0.8, N.hue); spark(pipe, N.hue);
    tip(`${L.base} : ${N.d} = ${piece}${N.n > 1 ? `, i ${piece} × ${N.n} = ${want}` : ''}. El ${N.name} fa ${want} cm!`, 'go');
    await sleep(1500); if (!t.on) return;
    win(`${frac(N.n, N.d)} de ${L.base} cm = ${want} cm`);
  };
  tip(`El dibuix mostra el tub de Do partit en ${N.d} trossos iguals. Els de color són els del ${N.name}.`);
  return () => { if (busy) return ''; label(); return how(); };
}

/* ---------- the bar of the drum ---------- */
const block = f => `<div class="blk${FIGS[f].rest ? ' rest' : ''}" style="flex:${FIGS[f].beats}"><b>${beatsText(FIGS[f].beats)}</b></div>`;
const ticks = n => `<div class="ticks">${Array.from({ length: n }, (_, i) => `<i>${i + 1}</i>`).join('')}</div>`;
const thump = pad => { drum(); again(pad).add('hit'); };

// one figure is missing: which one fills the bar
function beat({ t, L, stage, tip, slip, spark, win }) {
  const figs = [...L.figs], gi = figs.indexOf(null);
  const have = figs.reduce((s, f) => s + (f ? FIGS[f].beats : 0), 0), want = L.beats - have;
  const missing = want === 0.5 ? 'hi falta mig temps' : want === 1 ? 'hi falta 1 temps' : `hi falten ${want} temps`;
  let busy = false;
  const draw = () => {
    $('#sheet').innerHTML = staff(figs.map(f => f ? { step: FIGS[f].rest ? null : 5, fig: f } : { gap: true }), { beats: L.beats, sig: true, bars: false });
    $('#strip').innerHTML = figs.map(f => f ? block(f) : `<div class="blk gap" style="flex:${want}"><b>?</b></div>`).join('');
    $('#sum').innerHTML = figs.map(f => f ? beatsText(FIGS[f].beats) : '<b>?</b>').join(' + ') + ` = ${L.beats} temps`;
  };
  stage.innerHTML = `<div class="row"><div class="sheet" id="sheet"></div><div class="pad" id="pad">${DRUM}</div></div>
    <div class="bar4"><div class="strip" id="strip"></div>${ticks(L.beats)}</div>
    <p class="ask" id="sum"></p>
    <div class="pal">${L.pal.map(k => `<button class="figb" data-k="${k}">${glyph(k)}<b>${FIGS[k].name}</b><span>${beatsText(FIGS[k].beats)} temps</span></button>`).join('')}</div>`;
  draw();
  stage.querySelector('.pal').onclick = async e => {
    const b = e.target.closest('.figb'); if (!b || busy || !t.on) return;
    const k = b.dataset.k, F = FIGS[k];
    if (F.beats !== want) {
      slip(); again(b).add('shake');
      return tip(`Ui! ${F.rest ? 'El' : 'La'} ${F.name} val ${beatsText(F.beats)}. Al compàs ja hi ha ${beatsText(have)} temps: ${missing}.`, 'oops');
    }
    busy = true; figs[gi] = k; draw(); spark($('#strip').children[gi], 48);
    tip(`${figs.map(f => beatsText(FIGS[f].beats)).join(' + ')} = ${L.beats}. Compàs ple! Escolta'l.`, 'go'); await sleep(900);
    // the drum plays the bar twice: a hit for each note, nothing for a rest
    const nts = [...stage.querySelectorAll('.nt')], blks = [...$('#strip').children];
    for (let rep = 0; rep < 2; rep++) for (let j = 0; j < figs.length; j++) {
      if (!t.on) return;
      nts.forEach((n, i) => n.classList.toggle('now', i === j)); blks.forEach((n, i) => n.classList.toggle('now', i === j));
      if (!FIGS[figs[j]].rest) thump($('#pad'));
      await sleep(FIGS[figs[j]].beats * 460);
    }
    if (!t.on) return;
    nts.forEach(n => n.classList.remove('now')); blks.forEach(n => n.classList.remove('now'));
    win($('#sum').innerHTML);
  };
  tip(L.say);
  return () => busy ? '' : `Suma el que ja hi ha al compàs: ${beatsText(have)}. Fins a ${L.beats} ${missing}.`;
}

// how many of the short figure fit in the long one
function fit({ t, L, stage, tip, slip, spark, win }) {
  const B = FIGS[L.big], S = FIGS[L.small], want = B.beats / S.beats, temps = v => v === 0.5 ? 'mig temps' : `${v} temps`;
  let busy = false;
  stage.innerHTML = `<div class="row"><div class="figcard">${glyph(L.big)}<b>1 ${B.name}</b></div><b class="eq">=</b><div class="figcard"><b class="qm" id="qm">?</b>${glyph(L.small)}<b>${S.pl}</b></div><div class="pad" id="pad">${DRUM}</div></div>
    <div class="bar4"><div class="strip"><div class="blk" id="bigb" style="flex:1"><b>${beatsText(B.beats)}</b></div></div>
      <div class="strip low" id="small"><div class="blk" style="flex:0 0 calc(${100 / want}% - 2px)"><b>${beatsText(S.beats)}</b></div><div class="blk gap" style="flex:1"><b>?</b></div></div></div>
    <p class="ask">Quantes ${S.pl} caben en una ${B.name}?</p>
    <div class="opts">${[2, 3, 4, 8].map(v => `<button class="btn soft" data-v="${v}">${v}</button>`).join('')}</div>`;
  const how = () => `Una ${B.name} val ${temps(B.beats)} i una ${S.name}, ${temps(S.beats)}. Mira la barra: quantes peces petites omplen la gran?`;
  stage.querySelector('.opts').onclick = async e => {
    const b = e.target.closest('button'); if (!b || busy || !t.on) return;
    if (+b.dataset.v !== want) { slip(); b.disabled = true; return tip('Ui! ' + how(), 'oops'); }
    busy = true; $('#qm').textContent = want; $('#small').innerHTML = block(L.small).repeat(want); spark($('#small'), 48);
    tip(`${Array(want).fill(beatsText(S.beats)).join(' + ')} = ${beatsText(B.beats)}. Escolta-ho!`, 'go'); await sleep(900); if (!t.on) return;
    // the long one first, then the short ones that fill the same time
    const blks = [...$('#small').children], pad = $('#pad'), big = $('#bigb');
    big.classList.add('now'); thump(pad); await sleep(B.beats * 460); big.classList.remove('now');
    for (let j = 0; j < want; j++) { if (!t.on) return; blks.forEach((n, i) => n.classList.toggle('now', i === j)); thump(pad); await sleep(S.beats * 460); }
    if (!t.on) return;
    blks.forEach(n => n.classList.remove('now'));
    win(`1 ${B.name} = ${want} ${S.pl}`);
  };
  tip(`Les dues barres duren el mateix. La de dalt és una ${B.name}; a la de sota hi van ${S.pl}.`);
  return () => busy ? '' : how();
}

// tap the bar on the drum, in time: twice round, a tap for each note and none in the rests
function tapping({ t, L, stage, tip, slip, spark, win }) {
  const REPS = 2, ms = L.ms, barMs = L.beats * ms;
  let at = 0;
  const marks = L.figs.map(f => { const m = { at, rest: !!FIGS[f].rest }; at += FIGS[f].beats; return m; });
  const notes = marks.filter(m => !m.rest), hits = notes.map(m => m.at), gaps = hits.map((h, i) => (hits[i + 1] ?? hits[0] + L.beats) - h);
  // how far from a note a tap still counts: generous, but never as far as the next note
  const tol = Math.min(0.34, 0.45 * Math.min(...gaps)) * ms;
  const onsets = Array.from({ length: REPS }, (_, r) => hits.map(h => r * barMs + h * ms)).flat();
  // top to bottom, all on one screen: the bar, the two steps (or the count while it runs) and the drum to tap
  stage.innerHTML = `<div class="sheet low" id="sheet">${staff(L.figs.map(f => ({ step: FIGS[f].rest ? null : 5, fig: f })), { beats: L.beats, sig: true, bars: false })}</div>
    <div class="bar4"><div class="strip taps" id="strip">${L.figs.map(f => `<div class="blk${FIGS[f].rest ? ' rest' : ''}" style="flex:${FIGS[f].beats}"><b>${beatsText(FIGS[f].beats)}</b><small>${FIGS[f].rest ? 'silenci' : 'pica'}</small></div>`).join('')}<i class="head" id="head" hidden></i></div>${ticks(L.beats)}</div>
    <div class="slot"><div class="opts" id="ctl"><button class="btn" id="listen">1 · Escolta</button><button class="btn soft" id="mine">2 · Ara jo!</button></div><b class="countin" id="count" hidden></b></div>
    <button class="pad big" id="pad" aria-label="Pica el tambor">${DRUM}</button>`;
  const nts = [...stage.querySelectorAll('.nt')], blks = [...stage.querySelectorAll('.blk')], pad = $('#pad'), head = $('#head'), count = $('#count');
  let run = null;
  const lit = j => { nts.forEach((n, i) => n.classList.toggle('now', i === j)); blks.forEach((n, i) => n.classList.toggle('now', i === j)); };

  async function go(mine) {
    if (run || !t.on) return;
    const start = performance.now() + barMs, r = run = { mine, start, got: new Set(), extra: 0 };
    $('#ctl').hidden = true; count.hidden = false; count.textContent = 'Prepara\'t…'; blks.forEach(b => b.classList.remove('ok'));
    // a bar of clicks to get the pulse, then the bar itself, twice
    for (let i = 0; i < L.beats; i++) setTimeout(() => { if (t.on && run === r) { count.textContent = i + 1; again(count).add('on'); click(i ? 880 : 1320, 0, 0.06, 0.1); } }, i * ms);
    for (let i = 0; i < L.beats * REPS; i++) setTimeout(() => { if (t.on && run === r) click(i % L.beats ? 660 : 990, 0, 0.04, 0.035); }, barMs + i * ms);
    if (!mine) onsets.forEach(o => setTimeout(() => { if (t.on && run === r) thump(pad); }, barMs + o));
    await sleep(barMs); if (!t.on) return;
    count.textContent = mine ? 'Pica ara!' : 'Escolta…'; head.hidden = false;
    await new Promise(res => {
      const f = () => {
        if (!t.on) return res();
        const p = (performance.now() - start) / barMs, pos = (p % 1) * L.beats;
        head.style.left = (p % 1) * 100 + '%'; lit(marks.findLastIndex(m => m.at <= pos));
        p < REPS ? setTimeout(f, 16) : res();
      };
      f();
    });
    await sleep(tol + 60); if (!t.on) return;
    head.hidden = true; lit(-1); count.hidden = true; $('#ctl').hidden = false; run = null;
    // once heard, the step to take is the second one
    $('#listen').className = 'btn soft'; $('#mine').className = 'btn';
    if (!mine) return tip(`Ara tu! Prem «2 · Ara jo!». Sonaran ${L.beats} clics per agafar el ritme; després pica el tambor cada cop que la ratlla blanca entra en un bloc groc.`);
    const missed = onsets.length - r.got.size, slack = onsets.length >= 8 ? 1 : 0;
    if (missed + r.extra <= slack) return win(`${L.figs.map(f => beatsText(FIGS[f].beats)).join(' + ')} = ${L.beats} temps`);
    slip(); tip(`Gairebé! ${missed ? `T'han faltat ${missed} ${missed > 1 ? 'cops' : 'cop'}. ` : ''}${r.extra ? `N'has picat ${r.extra} de més o fora de temps${marks.some(m => m.rest) ? ': al silenci no es pica' : ''}. ` : ''}Escolta'l i torna-hi.`, 'oops');
  }
  function tap() {
    if (!t.on) return;
    thump(pad);
    const r = run; if (!r || !r.mine) return;
    const now = performance.now() - r.start; if (now < -tol) return;
    // the nearest note not yet tapped, if the tap is close enough to it
    let best = -1; onsets.forEach((o, i) => { if (!r.got.has(i) && Math.abs(o - now) <= tol && (best < 0 || Math.abs(o - now) < Math.abs(onsets[best] - now))) best = i; });
    if (best < 0) { r.extra++; again(pad).add('shake'); return; }
    const blk = blks[marks.indexOf(notes[best % notes.length])];
    r.got.add(best); again(blk).add('ok'); spark(blk, 130);
  }
  pad.onpointerdown = e => { e.preventDefault(); tap(); };
  keyFn = e => { if (e.key === ' ') { e.preventDefault(); tap(); } };
  $('#listen').onclick = () => go(false); $('#mine').onclick = () => go(true);
  tip(`${L.say} Primer prem «1 · Escolta».`);
  return () => run ? '' : `A cada volta piques ${hits.length} ${hits.length > 1 ? 'cops' : 'cop'}: un a cada nota, just quan la ratlla blanca hi entra.${marks.some(m => m.rest) ? ' Als trossos ratllats, que són silencis, no es pica.' : ''}`;
}

soBtn(); paintXp();
prog.piscina ? mapa() : piscina();
