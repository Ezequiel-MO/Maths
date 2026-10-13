import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POOL_SHELF, TYPES, POINTS, VALID, EXAM_PASS, thing, phrase, cap, roundOf, wish, why, from, options, trayOf, keysOf, shuffle, starsFor,
  clean, noteOf, reached, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, levelIn, exam, examIn, sheet, sheetIn } from './logic.js';

const KEY = 'robot-dels-pronoms';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls }. clean() makes a complete progress out of anything the browser holds
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

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');
// The robot says a good order aloud, where the device has a Catalan voice; where it has none it stays silent
function speak(s) {
  try {
    if (!prog.so || !('speechSynthesis' in window)) return;
    const v = speechSynthesis.getVoices().find(v => /^ca/i.test(v.lang)); if (!v) return;
    const u = new SpeechSynthesisUtterance(s); u.voice = v; u.lang = v.lang; u.rate = 0.9;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
// the list of voices comes late in some browsers: asking for it now has it ready for the first order
try { window.speechSynthesis?.getVoices(); } catch (e) {}

/* ---------- the drawings ---------- */
// the frog of the pond, with the cap of a commander
const FROG = `<svg class="frog" viewBox="-40 -58 80 80" aria-hidden="true"><ellipse cx="0" cy="16" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 12q-9-2-7-9q7 2 11 6ZM25 12q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-6" rx="25" ry="20" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-26" r="4" fill="#0F3A40"/><circle cx="13" cy="-26" r="4" fill="#0F3A40"/><circle cx="-9.500" cy="-28" r="1.4" fill="#fff"/><circle cx="14.5" cy="-28" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -5 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-22 -36q22 -22 44 0Z" fill="#1B3F52" stroke="#6FE3FF" stroke-width="2" stroke-linejoin="round"/><path d="M-26 -36h52" stroke="#F7C64E" stroke-width="4" stroke-linecap="round"/>
  <path d="M0 -50l1.800 3.600 3.900.4-2.900 2.700.8 3.900L0 -41.400l-3.600 2 .8-3.900-2.900-2.700 3.900-.4Z" fill="#F7C64E"/></svg>`;
// The robot: an aerial with a light, a visor with its eyes (round, happy or crossed), a chest with a small screen and three lights, and two arms.
// Its classes say how it is: ok after a good order, when its right arm hands the thing over, and err after one it does not understand
const ROBOT = `<svg class="bot" id="bot" viewBox="0 0 160 200" aria-hidden="true">
  <ellipse cx="80" cy="193" rx="44" ry="6" fill="rgb(0 0 0 / 0.35)"/><path class="jet" d="M64 170h32l-9 22h-14Z"/>
  <path d="M80 26V12" stroke="#9EC3C0" stroke-width="4" stroke-linecap="round"/><circle class="ant" cx="80" cy="9" r="6"/>
  <g class="arm l"><path d="M32 108Q14 114 16 136"/><circle cx="16" cy="140" r="8"/></g>
  <g class="arm r"><path d="M128 108Q146 114 144 136"/><circle cx="144" cy="140" r="8"/></g>
  <rect class="shell" x="30" y="94" width="100" height="78" rx="24"/><rect class="glass" x="44" y="106" width="72" height="38" rx="10"/><text id="scr" x="80" y="135">?</text>
  <circle class="led a" cx="58" cy="158" r="4"/><circle class="led b" cx="80" cy="158" r="4"/><circle class="led c" cx="102" cy="158" r="4"/>
  <rect class="ear" x="25" y="44" width="11" height="22" rx="4"/><rect class="ear" x="124" y="44" width="11" height="22" rx="4"/>
  <rect class="shell" x="34" y="24" width="92" height="64" rx="22"/><rect class="glass" x="44" y="34" width="72" height="36" rx="15"/>
  <g class="eyes"><circle cx="64" cy="52" r="8"/><circle cx="96" cy="52" r="8"/></g>
  <path class="eyes-ok" d="M56 56q8-11 16 0M88 56q8-11 16 0"/><path class="eyes-err" d="M58 46l12 12M70 46l-12 12M90 46l12 12M102 46l-12 12"/>
  <path class="mouth" d="M70 79h20"/></svg>`;
const bot = cls => { const b = $('#bot'); if (!b) return; b.classList.remove('ok', 'err'); void b.getBoundingClientRect(); if (cls) b.classList.add(cls); $('#scr').textContent = cls === 'ok' ? '✓' : cls === 'err' ? '✗' : '?'; };
// a thing as a card: its drawings and its name, with the article or without; off shuts a card that is a button
const card = (T, bare = false, tag = 'div', off = false) => `<${tag} class="it" data-k="${T.key}"${off ? ' disabled' : ''}><span class="pics">${`<span>${T.pic}</span>`.repeat(T.n)}</span><b>${bare ? T.word : T.text}</b></${tag}>`;
// How the pronoun of a good order is joined, drawn: «me + el → me'l», with the letter that falls falling
function derive(r) {
  const T = TYPES[r.t.type], V = cap(r.verb), fall = '<i class="fall">e</i>';
  if (r.named) return `<span style="--h:48">${V} + ${fall}m → ${V}<b>'m</b></span>`;
  return `<span style="--h:${T.hue}">«${r.t.text}» → <b>${T.art}</b> · me + ${T.suf[0] === "'" ? fall + T.art.slice(1) : T.art} → me<b>${T.suf}</b></span>`;
}
// the thing leaves its place and flies to where it goes
function fly(from, to) {
  if (RM || !from || !to) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), g = from.cloneNode(true);
  g.classList.add('ghost'); Object.assign(g.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.append(g);
  g.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(0.3)`, opacity: 0.3 }],
    { duration: 600, easing: 'cubic-bezier(0.5, -0.3, 0.6, 1)' }).onfinish = () => g.remove();
}

const HURRAY = ['Bip, bip!', 'Molt bé!', 'Perfecte!', 'Genial!', 'Ordre rebuda!'];
const HUES = [195, 48, 28, 205, 140, 262, 318];
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
// takes the one-shot classes off an element and gives its class list back, so the same animation can start again
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /robot-dels-pronoms\.html$/.test(location.pathname);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toS').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

// a real keyboard: the level on screen says what its keys do
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });
// a tap that comes less than SETTLE after a question came up was meant for the one before
const SETTLE = 450;
let openAt = 0;
// each kind of level draws its stage and gives back its hint: a function that returns what the tip says
const KIND = { sort, job };

/* ---------- the map: three bands, one button for each project and the exam of the circle at the end ---------- */
const RING = [140, 195, 262];   // the colour of each circle
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 60% 60%)" stroke-width="2.4" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c);
const noteText = i => { const n = noteOf(prog, i), d = prog.stars.slice(i * 10, i * 10 + 10).filter(Boolean).length; return n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer'; };
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
  fresh(); show('El mapa', false, 195);
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
      level(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : reached(prog, i), 9));
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

/* ---------- the Piscina: the robot wakes up and names three things to touch, the first thing a profile with nothing saved meets ---------- */
// A wrong thing only shakes. The third one saves piscina and opens the map. There is no «← Mapa» here: the map would have every
// circle shut, so the way out is the page of all games.
function piscina() {
  const t = fresh(); show('La Piscina', true, 195); $('#toS').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes'), shelf = POOL_SHELF.map(thing);
  let k = -1, busy = false;
  stage.innerHTML = `<p class="ask">Toca la cosa que diu la pantalla del robot.</p>
    <div class="scene"><div class="botbox">${ROBOT}</div><div class="desk"><p class="console" id="con"></p><div class="cards" id="cards"></div></div></div>`;
  function arm() {
    k++; busy = false; bot('');
    const T = thing(POOL[k]);
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#con').innerHTML = `<span>${T.text}</span>`; again($('#con')).add('pop');
    $('#cards').innerHTML = shelf.map(X => card(X, false, 'button')).join('');
    $('#cards').onclick = async e => {
      const b = e.target.closest('.it'); if (!b || busy || !t.on) return;
      blip();
      if (b.dataset.k !== T.key) { bot('err'); return again(b).add('shake'); }
      const last = k === POOL.length - 1;
      busy = true; bot('ok'); b.classList.add('lit'); b.style.setProperty('--h', TYPES[T.type].hue); dots[k].classList.add('ok'); spark(b, TYPES[T.type].hue);
      if (last) { prog = { ...prog, piscina: true }; save(); }
      say(last ? 'Robot a punt! Ara ja et pot donar les coses, si l\'hi demanes bé.' : `Sí! ${cap(T.text)}.`, 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(last ? 16 : 8);
      await sleep(last ? 2200 : 1300); if (!t.on) return;
      last ? mapa() : arm();
    };
  }
  say('Aquest és el robot de l\'estany, i tu ets el seu comandant. Primer cal comprovar que hi veu bé.');
  arm();
}

/* ---------- one level of a project: the frame is the same for all, the stage is of its kind ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), L = PROJECTS[sec].levels[idx];
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip"></p></div><div class="stage" id="stage"></div>`;
  // a level is marked done when it has a star
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); buzz(); };

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

  const help = KIND[L.kind]({ t, L, stage, tip, slip, win });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars();
  // on a short screen the end of the stage can be under the fold: start from the frog's tip
  if (stage.getBoundingClientRect().bottom > innerHeight) $('#coach').scrollIntoView({ block: 'start', behavior: 'auto' });
}

/* ---------- the exam of a circle: six levels of its projects, one try each, no hints, saved by the sixth ---------- */
// what the frog says instead of the tip of the level: only what there is to do
const ASK = { sort: 'Posa cada cosa al calaix del seu article.', pick: 'Tria l\'ordre ben escrita.', touch: 'Toca què donarà el robot.', build: 'Munta l\'ordre amb les peces.', type: 'Escriu l\'ordre.' };
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
      say('No és correcte.', 'oops'); buzz(); openAt = performance.now() + SETTLE;
      tail.innerHTML = `<button class="btn" id="nx">${last ? 'Mira el resultat' : 'Segueix'}</button>`;
      $('#nx').onclick = e => { if (e.timeStamp >= openAt) next(); };
    };
    // of what the level says, the exam keeps the cheers while it runs and, once missed, why it was wrong
    const tip = (txt, cls = '') => { if (cls === 'oops' ? failed : cls === 'go' && !done) say(txt.replace(/^Ui! /, ''), cls); };
    stage.inert = false; tail.innerHTML = ''; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[L.p].name}`;
    say(ASK[L.mode || L.kind]);
    KIND[L.kind]({ t: qt, L, stage, tip, slip: () => end(false), win: () => end(true) });
    scrollTo({ top: 0, behavior: 'auto' });
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
    scrollTo({ top: 0, behavior: 'auto' });
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  }
  arm();
}

/* ---------- «Caça l'errada»: three orders somebody wrote for the robot, one after the other; from none to two of them are wrong ---------- */
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the order that is right,
// with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres ordres');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    const T = thing(C.key);
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="cards">${card(T)}</div><p class="ask claim">Per demanar <b>${C.named ? phrase(T) : T.text}</b> ${C.named ? 'dient-ne el nom' : 'sense dir-ne el nom'}:</p><p class="console">«${C.says}!»</p>`;
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Mira-ho bé: el robot entendrà aquesta ordre?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); }
    else { say(said, 'oops'); buzz(); }
    await sleep(ok ? 1200 : 2600); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}!»)`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre full</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era: és «${C.real}!».` : 'Sí, era correcta!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: «${C.real}!» està ben escrita.`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="opts">${C.opts.map((v, i) => `<button class="btn soft" data-v="${i}">${v}!</button>`).join('')}</div>`;
      say('Ben vist! Ara tria l\'ordre ben escrita.', 'go');
    }
    else if ('v' in b.dataset) { const ok = C.opts[+b.dataset.v] === C.real; answer(ok, ok ? `Arreglat: «${C.real}!».` : `No era aquesta: és «${C.real}!».`); }
  };
  arm();
}

/* ---------- sort things into the drawers of their articles: the robot holds one at a time ---------- */
function sort({ t, L, stage, tip, slip, win }) {
  let k = -1, T = null, busy = false;
  stage.innerHTML = `<p class="ask" id="q"></p>
    <div class="scene"><div class="botbox">${ROBOT}</div><div class="desk"><div class="cards" id="cards"></div></div></div>
    <div class="bins" id="bins">${L.bins.map(b => `<button class="bin" data-b="${b}" style="--h:${TYPES[b].hue}"><b>${TYPES[b].art}</b><span>${TYPES[b].a}</span><span class="in"></span></button>`).join('')}</div>`;
  function arm() {
    k++; T = L.items[k]; busy = false; bot(''); openAt = performance.now() + SETTLE;
    $('#q').innerHTML = `<small>Cosa ${k + 1} de ${L.items.length}</small>A quin calaix va?`;
    $('#cards').innerHTML = card(T, L.bare); again($('#cards').firstChild).add('pop');
  }
  $('#bins').onclick = async e => {
    const b = e.target.closest('.bin'); if (!b || busy || !t.on || e.timeStamp < openAt) return;
    const Y = TYPES[T.type];
    if (b.dataset.b !== T.type) { slip(); bot('err'); again(b).add('shake'); return tip(`Ui! «${cap(T.text)}»: ${Y.what}. ${T.note || `Digues-ho amb «${Y.a}»: ${Y.a} ${T.word}.`}`, 'oops'); }
    const last = k === L.items.length - 1;
    busy = true; bot('ok'); blip(520 + k * 60); fly($('#cards').firstChild, b); $('#cards').innerHTML = '';
    b.querySelector('.in').insertAdjacentHTML('beforeend', `<i>${T.pic}</i>`); spark(b, Y.hue);
    tip(`${cap(T.text)}: ${Y.what}.`, 'go');
    await sleep(last ? 1100 : 750); if (!t.on) return;
    last ? win(`${L.items.length} coses al seu calaix<br><small>${L.bins.map(x => TYPES[x].art).join(' · ')}</small>`) : arm();
  };
  arm(); tip(L.say);
  return () => busy ? '' : `Digues «${T.word}» amb «un», «una», «uns» o «unes» davant, a veure quin hi sona bé. ${T.note}`;
}

/* ---------- give the robot its orders: choosing one, touching what one will bring, building one out of pieces or typing it ---------- */
// One round for each order of the level, or for each thing the child chooses off the shelf. A good order makes the robot hand the
// thing over to the bag, show how its pronoun is joined and say it aloud; one it does not understand is a slip, with the reason
function job({ t, L, stage, tip, slip, win }) {
  const total = L.free || L.rounds.length, shelf = (L.shelf || []).map(thing), done = [];
  let k = -1, r = null, buf = [], opts = [], tray = [], busy = false;
  stage.innerHTML = `<p class="ask" id="q"></p>
    <div class="scene"><div class="botbox">${ROBOT}</div><div class="desk"><p class="console" id="con" aria-live="polite"></p><div class="cards" id="cards"></div></div></div>
    <p class="rule" id="rule"></p>
    <div class="bag" id="bag" role="img" aria-label="El que ja t'ha donat el robot"><b>${L.make ? '🛠️' : '🎒'}</b>${'<i></i>'.repeat(total)}${L.make ? '<b>→</b><b class="made" id="made">?</b>' : ''}</div>
    <div class="ans" id="ans"></div>`;
  const con = $('#con'), ans = $('#ans'), cards = $('#cards');
  const step = () => total > 1 ? `<small>Ordre ${k + 1} de ${total}</small>` : '';
  const tail = () => L.mode === 'type' && !L.full && r.named ? ' ' + phrase(r.t) : '';
  const got = () => L.mode === 'build' ? cap(r.verb) + buf.join('') : L.full ? buf.join('') : cap(r.verb) + buf.join('') + tail();
  // the order as far as it is made, on the screen of the robot
  function paint() {
    if (L.mode === 'build') con.innerHTML = `<span>${cap(r.verb)}${buf.map(p => `<b>${p}</b>`).join('') || '<i class="gap">…</i>'}!</span>`;
    else { const s = buf.join(''); con.innerHTML = `<span>${L.full ? '' : cap(r.verb)}<b>${L.full && s ? cap(s) : s}</b><i class="caret"></i>${tail()}!</span>`; }
  }
  function arm() {
    k++; r = null; buf = []; busy = false; bot(''); $('#rule').innerHTML = '';
    if (!L.free) { r = L.rounds[k]; return ask(); }
    // the child chooses: whatever is still on the shelf
    $('#q').innerHTML = `${step()}Què vols ara? Toca una cosa.`; con.innerHTML = '<span>?</span>'; ans.innerHTML = '';
    cards.innerHTML = shelf.map(T => card(T, false, 'button', done.some(d => d.t.key === T.key))).join('');
  }
  function ask() {
    openAt = performance.now() + SETTLE;
    if (L.mode === 'touch') {
      $('#q').innerHTML = `${step()}El robot rep aquesta ordre. Què donarà?`; con.innerHTML = `<span>${r.want}!</span>`; again(con).add('pop');
      cards.innerHTML = shelf.map(T => card(T, L.bare, 'button')).join(''); ans.innerHTML = '';
      return;
    }
    $('#q').innerHTML = `${step()}«${wish(r)}»<span class="mode">${r.named ? '🗣 dient el nom' : '🔇 sense dir el nom'}${L.full ? ` · amb el verb «${r.verb}»` : ''}</span>`;
    cards.innerHTML = L.free ? shelf.map(T => card(T, false, 'button', T.key !== r.t.key)).join('') : card(r.t);
    if (L.mode === 'pick') {
      opts = shuffle(options(L, r), Math.random); con.innerHTML = '<span>?</span>';
      ans.innerHTML = `<div class="opts">${opts.map((o, i) => `<button class="btn soft" data-v="${i}">${o}!</button>`).join('')}</div>`;
    } else if (L.mode === 'build') {
      tray = trayOf(L, r);
      ans.innerHTML = `<div class="tray">${tray.map((p, i) => `<button class="pc${p[0] === ' ' ? ' noun' : ''}" data-p="${i}">${p.trim()}</button>`).join('')}</div>
        <div class="opts"><button class="btn" data-k="ok">Envia</button><button class="btn soft" data-k="del" aria-label="Esborra">⌫</button></div>`;
      paint();
    } else {
      ans.innerHTML = `<div class="keys">${keysOf(L, r).map(c => `<button class="key${c === '-' || c === "'" ? ' mark' : ''}" data-k="${c}"${c === '-' ? ' aria-label="Guionet"' : c === "'" ? ' aria-label="Apòstrof"' : ''}>${c}</button>`).join('')}
        <button class="key del" data-k="del" aria-label="Esborra">⌫</button><button class="key ok" data-k="ok" aria-label="Envia">✓</button></div>`;
      paint();
    }
  }
  const press = key => {
    if (busy || !r || L.mode === 'pick' || L.mode === 'touch') return;
    if (key === 'ok') { if (buf.length) answer(got()); return; }
    if (key === 'del') buf.pop(); else if (L.mode === 'type' && buf.length < 20) buf.push(key); else return;
    blip(); paint();
  };
  function answer(g, btn) {
    const bad = why(r, g);
    if (!bad) return deliver();
    slip(); bot('err');
    if (btn) btn.disabled = true; else { buf = []; paint(); again(con).add('shake'); }
    tip(`Ui! ${bad}`, 'oops');
  }
  // the robot understood: the thing flies to the bag, the screen shows the order and how its pronoun is joined, and the next round comes
  async function deliver() {
    const last = k === total - 1, T = TYPES[r.t.type], src = cards.querySelector(`[data-k="${r.t.key}"]`), slot = $('#bag').querySelectorAll('i')[k];
    busy = true; con.innerHTML = `<span>${r.want}!</span>`; again(con).add('pop'); $('#rule').innerHTML = derive(r); ans.innerHTML = '';
    bot('ok'); chime([659, 784, 988], 0.07); speak(r.want);
    src?.style.setProperty('--h', T.hue); src?.classList.add('lit'); fly(src, slot);
    await sleep(RM ? 0 : 600); if (!t.on) return;
    slot.textContent = r.t.pic; slot.classList.add('in'); spark(slot, T.hue); done.push(r);
    tip(`${pick(HURRAY)} ${r.named ? `Amb el nom, «${cap(r.verb)}'m».` : `«${cap(r.t.text)}» es torna «${T.art}»: ${r.want}!`} Digues-ho en veu alta!`, 'go');
    if (!last) { await sleep(1900); if (t.on) arm(); return; }
    if (L.make) {
      await sleep(900); if (!t.on) return;
      $('#made').textContent = L.make[0]; again($('#made')).add('pop'); spark($('#made'), 48); chime([523, 659, 784, 1047], 0.09);
      tip(`Missió complerta! El robot ha construït ${L.make[1]}.`, 'go');
    }
    await sleep(1800); if (!t.on) return;
    win(`${L.make ? `${L.make[0]} ` : ''}${done[0].want}!${done.length > 1 ? `<br><small>${done.slice(1).map(d => d.want + '!').join(' · ')}</small>` : ''}`);
  }
  cards.onclick = e => {
    const b = e.target.closest('button.it'); if (!b || b.disabled || busy || !t.on || e.timeStamp < openAt) return;
    if (L.free && !r) { r = roundOf(b.dataset.k, L.verb); blip(); return ask(); }
    if (L.mode !== 'touch') return;
    if (b.dataset.k === r.t.key) return deliver();
    const X = thing(b.dataset.k), T = TYPES[r.t.type];
    slip(); bot('err'); again(b).add('shake');
    tip(`Ui! «${r.want}!» porta «${T.suf}», que ve ${from(T.art)}: ${T.what}. «${cap(X.text)}»: ${TYPES[X.type].what}.`, 'oops');
  };
  ans.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || !r || !t.on || e.timeStamp < openAt) return;
    if ('v' in b.dataset) answer(opts[+b.dataset.v], b);
    else if ('p' in b.dataset) { if (buf.length < 3) { buf.push(tray[+b.dataset.p]); blip(520 + buf.length * 60); paint(); } }
    else press(b.dataset.k);
  };
  if (L.mode === 'type') keyFn = e => {
    const c = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === '’' ? "'" : e.key.length === 1 && /[a-zç'-]/i.test(e.key) ? e.key.toLowerCase() : null;
    if (c) { e.preventDefault(); press(c); }
  };
  arm(); tip(L.say);
  return () => {
    if (busy) return '';
    if (!r) return 'Toca una de les coses del prestatge: la que vulguis.';
    const T = TYPES[r.t.type], V = cap(r.verb);
    if (L.mode === 'touch') return `«${T.suf}» ve ${from(T.art)}: busca una cosa de nom ${T.what}.`;
    if (r.named) return `Quan dius el nom de la cosa, l'ordre és «${V}'m» i després el nom.`;
    return `«${cap(r.t.text)}»: ${T.what}.${r.t.note ? ' ' + r.t.note : ''} El seu pronom és «${T.art}», i darrere de «me» s'escriu «me${T.suf}».`;
  };
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
