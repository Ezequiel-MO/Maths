import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, POINTS, EXAM_PASS, VALID, starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf,
  BADGES, badges, levelIn, poolIn, exam, examIn, sheet, sheetIn, build, fmt } from './logic.js';
import { FROG, B, scene, chart, icon } from './art.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow } from '../../shared/shell.js';

const KEY = 'detectius-de-problemes';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
// every new screen cancels the running one through this token, and closes the chalkboard
const fresh = tokens(() => Board.close());

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');
const fanfare = () => chime([523, 659, 784, 1047, 1319]);

const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Ben resolt!', 'Quin detectiu!', 'Cas tancat!'];
const HUES = [45, 200, 140, 330, 262, 290];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };
const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// the place of a case, from the first letter of its id: the scene on top of it
const placeOf = id => ({ m: 'mercat', e: 'excursio', s: 'esports', p: 'pastisseria', c: 'cinema', g: 'misteri' })[id[0]] || 'misteri';
// a number of a case as it is written: with a comma, and with cents when the case has them
const num = (prob, v) => fmt(v, prob.dec && !Number.isInteger(v) ? 2 : 0);

const HUB = ownPage(KEY);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));

// a real keyboard: the screen on show says what its keys do
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey && Board.el?.hidden !== false) keyFn(e); });
// a tap that comes less than SETTLE after a question came up was meant for the one before
let openAt = 0;

/* ---------- the chalkboard: a place to do the sums by hand, over the page ---------- */
const Board = {
  el: null, cv: null, lines: [], cur: null,
  open(head) {
    if (!this.el) {
      this.el = document.createElement('div'); this.el.className = 'chalk'; this.el.hidden = true;
      this.el.innerHTML = `<div class="chalk-in" role="dialog" aria-modal="true" aria-label="Pissarra"><div class="chalk-bar"><span class="ref"></span><span>
        <button class="btn soft" data-b="clear">Esborra</button><button class="btn" data-b="close">Tanca</button></span></div><canvas></canvas></div>`;
      document.body.append(this.el);
      this.cv = this.el.querySelector('canvas');
      this.el.onclick = e => { const b = e.target.closest('[data-b]'); if (b) b.dataset.b === 'clear' ? (this.lines = [], this.draw()) : this.close(); else if (e.target === this.el) this.close(); };
      const at = e => { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      this.cv.onpointerdown = e => { this.cv.setPointerCapture(e.pointerId); this.cur = [at(e)]; this.lines.push(this.cur); this.draw(); };
      this.cv.onpointermove = e => { if (this.cur) { this.cur.push(at(e)); this.draw(); } };
      this.cv.onpointerup = this.cv.onpointercancel = () => { this.cur = null; };
      addEventListener('keydown', e => { if (e.key === 'Escape' && !this.el.hidden) this.close(); });
      addEventListener('resize', () => { if (!this.el.hidden) this.fit(); });
    }
    this.el.querySelector('.ref').textContent = head || '';
    this.el.hidden = false; this.fit(); this.el.querySelector('[data-b=close]').focus();
  },
  close() { if (this.el) this.el.hidden = true; },
  wipe() { this.lines = []; },
  fit() { const r = this.cv.getBoundingClientRect(), d = devicePixelRatio || 1; this.cv.width = r.width * d; this.cv.height = r.height * d; this.draw(); },
  draw() {
    const g = this.cv.getContext('2d'), d = devicePixelRatio || 1, w = this.cv.width / d, h = this.cv.height / d;
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgb(255 255 255 / 0.07)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#F3F7EF'; g.lineWidth = 4; g.lineCap = g.lineJoin = 'round';
    for (const l of this.lines) { g.beginPath(); l.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (l.length === 1) g.lineTo(l[0][0] + 0.1, l[0][1]); g.stroke(); }
  }
};

/* ---------- the map ---------- */
const RING = [45, 140, 320];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><circle r="13" fill="#F7C64E" stroke="hsl(${RING[c]} 70% 62%)" stroke-width="2.4"/><text y="5" text-anchor="middle" font-size="13" font-weight="800" fill="#6B4A10">${c + 1}</text></svg>`;
const bld = (place, cls = '') => `<svg class="bld${cls}" viewBox="-95 -200 190 205" aria-hidden="true">${B[place]()}</svg>`;
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
function mapa() {
  fresh(); show('El mapa dels casos', false, 200);
  const n = validated(prog).length, lit = i => noteOf(prog, i) >= VALID;
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi">${bld(PROJECTS[i].place)}</span>`,
    before: `<div class="town" aria-hidden="true">${PROJECTS.map((p, i) => bld(p.place, lit(i) ? ' lit' : '')).join('')}</div>
      <p class="grow">${n >= 6 ? 'Has resolt els casos dels sis llocs!' : n ? `Llocs resolts: ${n} de 6. Valida un projecte més i s'encendrà un altre lloc.` : 'Valida projectes i els llocs de la ciutat s\'encendran.'}</p>`,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="full"${OPEN || validated(prog).length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full]] });
  here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label, tools = '') {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span>${tools}</div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}

/* ---------- the case: a story, its question and the scene on top ---------- */
const LUPA = '<span class="lupa" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="13" cy="13" r="8" fill="none" stroke="#fff" stroke-width="4"/><path d="M19 19L27 27" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg></span>';
const caseHtml = (prob, place) => `<article class="case"><div class="scn">${scene(place)}</div>
  <div class="note"><p class="story" id="story"></p><div id="chart"></div><p class="qq">${LUPA}<span class="qt">${H(prob.q)}</span></p></div></article>`;
// the story: clues are buttons while they are looked for; the ones found stay marked
function paintStory(stage, prob, st, live) {
  $('#story', stage).innerHTML = prob.segs.map(s => {
    if (s.s !== undefined) return H(s.s);
    const k = s.k, cls = `tk${st?.found.has(k) ? ' ok' : st?.bad === k ? ' no' : ''}${st?.hint === k ? ' glow' : ''}`;
    return live && !st.found.has(k) ? `<button class="${cls}" data-tok="${k}">${H(prob.tok[k].t)}</button>` : `<span class="${cls}">${H(prob.tok[k].t)}</span>`;
  }).join('');
  if (!prob.chart) return;
  const sel = {};
  if (st) { st.found.forEach(k => { sel[k] = 'ok'; }); if (st.bad) sel[st.bad] = 'bad'; if (st.hint) sel[st.hint] = 'hint'; }
  $('#chart', stage).innerHTML = `<div class="chart-box"><h3>${H(prob.chart.title)}</h3>${chart(prob.chart, sel, live)}</div>`;
}

/* ---------- the five steps of a detective ---------- */
const STEPS = [['read', 'Llegir'], ['op', 'Triar'], ['est', 'Estimar'], ['calc', 'Calcular'], ['check', 'Comprovar']];
const SAY = {
  read: p => `Llegeix el cas amb calma. Toca les dades que necessites per respondre${p.chart ? ', al text o al gràfic' : ''}. Compte: n'hi ha que sobren!`,
  op: p => p.two ? 'Aquest cas té dos passos. Quin compte resol la pregunta?' : 'Quina operació resol el cas? Pensa: ajuntar, treure, repetir o repartir?',
  est: () => 'Abans de calcular, fes una estimació: arrossega la lupa fins al número que creus que sortirà, més o menys.',
  calc: p => p.calcTip || 'Ara calcula el resultat exacte. Si vols, fes el compte a la pissarra.',
  check: () => "Últim pas: comprova-ho amb l'operació inversa. Quin número surt?"
};
// The case prob played step by step on stage: read (tap the clues), choose the operation, estimate on a number line, calculate on the
// keys and check with the inverse. tip(text, cls) speaks; slip() is a mistake (the stars of the level go down); good() hears of a step
// done; win({ mine }) comes when the check is right, with the estimate of the child. Gives the hint of the step on show (it is a slip too)
function detective({ t, prob, place, stage, tip, slip, win, good }) {
  const E = prob.est, useful = Object.keys(prob.tok).filter(k => prob.tok[k].u);
  const snap = v => Math.round(Math.max(0, Math.min(E.max, Math.round(v / E.step) * E.step)) * 100) / 100;
  const st = { phase: 'read', found: new Set(), bad: null, hint: null, opWrong: new Set(), est: snap(E.max / 2), estTries: 0, estTip: false, locked: false,
    reveal: null, mine: null, buf: '', tries: 0, revealed: false, chkWrong: new Set() };
  let busy = false;
  stage.innerHTML = `<ol class="pass" id="pass" aria-label="Els cinc passos">${STEPS.map(([k, n]) => `<li>${icon(k)}<span>${n}</span></li>`).join('')}</ol>
    ${caseHtml(prob, place)}<div class="ans" id="ans"></div>`;
  const ans = $('#ans', stage);
  const paintCase = () => paintStory(stage, prob, st, st.phase === 'read' && !busy);
  const later = (ms, fn) => sleep(ms).then(() => { if (t.on) fn(); });
  function go(phase) {
    st.phase = phase; busy = false; openAt = performance.now() + SETTLE;
    const i = STEPS.findIndex(s => s[0] === phase);
    $('#pass', stage).querySelectorAll('li').forEach((li, j) => { li.className = j < i ? 'done' : j === i ? 'now' : ''; });
    // the check answers its own question: the number its inverse gives back, not the one of the case
    $('.qt', stage).textContent = phase === 'check' ? prob.check.ask : prob.q;
    paintCase(); paintAns(); tip(SAY[phase](prob));
    keyFn = phase === 'calc' ? calcKey : phase === 'est' ? estKey : null;
  }

  /* the number line of the estimate */
  const X0 = 40, X1 = 600, Y = 92, nx = v => X0 + (X1 - X0) * v / E.max;
  const label = v => fmt(v, prob.dec && !Number.isInteger(v) ? 1 : 0);
  function line() {
    const mant = E.max / 10 ** Math.floor(Math.log10(E.max) + 1e-9), every = Math.abs(mant - 2) < 1e-9 ? 5 : 4;
    let s = `<line class="track" x1="${X0}" y1="${Y}" x2="${X1}" y2="${Y}"/>`;
    for (let i = 0; i <= 20; i++) {
      const v = E.max * i / 20, x = nx(v), big = i % every === 0;
      s += `<line class="tick${big ? '' : ' minor'}" x1="${x}" y1="${Y - (big ? 14 : 8)}" x2="${x}" y2="${Y + (big ? 14 : 8)}"/>`;
      if (big) s += `<text class="lab" x="${x}" y="${Y + 42}" text-anchor="middle">${label(v)}</text>`;
    }
    if (st.reveal != null) s += `<g transform="translate(${nx(st.reveal)} 0)"><path d="M0 ${Y - 12}L-9 ${Y - 30}H9Z" fill="#2FB36B"/><rect x="-38" y="${Y - 70}" width="76" height="40" rx="12" fill="#2FB36B"/><text class="mv" y="${Y - 42}" text-anchor="middle">${label(st.reveal)}</text></g>`;
    s += `<g id="mark" transform="translate(${nx(st.est)} 0)"><circle cy="${Y}" r="16" fill="rgb(190 235 255 / 0.7)" stroke="#6E5235" stroke-width="5"/><rect x="9" y="${Y + 10}" width="8" height="24" rx="4" transform="rotate(-35 13 ${Y + 22})" fill="#6E5235"/>
      <path d="M0 ${Y - 20}L-9 ${Y - 32}H9Z" fill="#F7C64E"/><rect x="-42" y="${Y - 74}" width="84" height="42" rx="12" fill="#F7C64E"/><text class="mv" id="markv" y="${Y - 45}" text-anchor="middle">${label(st.est)}</text></g>`;
    return `<svg class="nl" id="nl" viewBox="0 0 640 150" tabindex="0" role="slider" aria-label="La teva estimació" aria-valuemin="0" aria-valuemax="${E.max}" aria-valuenow="${st.est}">${s}</svg>`;
  }
  function setEst(v) {
    st.est = snap(v);
    $('#mark', ans)?.setAttribute('transform', `translate(${nx(st.est)} 0)`);
    const tx = $('#markv', ans); if (tx) tx.textContent = label(st.est);
    const big = $('#estv', ans); if (big) big.innerHTML = `${label(st.est)} <small>${H(prob.unit)}</small>`;
    $('#nl', ans)?.setAttribute('aria-valuenow', st.est);
  }
  function wireLine() {
    const svg = $('#nl', ans); if (!svg) return;
    const at = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return (p.matrixTransform(svg.getScreenCTM().inverse()).x - X0) / (X1 - X0) * E.max; };
    let drag = false;
    svg.onpointerdown = e => { if (st.locked || busy) return; drag = true; svg.setPointerCapture(e.pointerId); setEst(at(e)); };
    svg.onpointermove = e => { if (drag) setEst(at(e)); };
    svg.onpointerup = svg.onpointercancel = () => { if (drag) { drag = false; blip(520); } };
  }
  const estKey = e => {
    if (st.locked || busy) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setEst(st.est + E.step); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setEst(st.est - E.step); }
    if (e.key === 'Enter') { e.preventDefault(); estimate(); }
  };

  /* what answers each step */
  const keys = () => `<div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
    ${prob.dec ? '<button class="key" data-d="," aria-label="Coma">,</button>' : '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>'}<button class="key" data-d="0">0</button>${prob.dec ? '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>' : ''}
    <button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div>`;
  function paintAns() {
    const P = st.phase;
    if (P === 'read') ans.innerHTML = `<p class="how">Pistes trobades: ${st.found.size} de ${useful.length}</p>
      <div class="slots">${useful.map(k => st.found.has(k) ? `<span class="slot ok">${H(prob.tok[k].t)}</span>` : '<span class="slot">?</span>').join('')}</div>`;
    else if (P === 'op') ans.innerHTML = `<div class="opts col">${prob.ops.map((o, i) => `<button class="btn soft op${st.opWrong.has(i) ? ' no' : ''}" data-o="${i}"${st.opWrong.has(i) ? ' disabled' : ''}>${H(o.label)}</button>`).join('')}</div>`;
    else if (P === 'est') {
      ans.innerHTML = `<p class="how">Estima: ${H(prob.label)}</p>${line()}
        <div class="nlt"><button class="key" data-e="-1" aria-label="Menys">−</button><span class="estv" id="estv">${label(st.est)} <small>${H(prob.unit)}</small></span><button class="key" data-e="1" aria-label="Més">+</button></div>
        ${st.estTip ? `<p class="trick">${E.label ? `Arrodoneix: ${H(E.label)}` : 'Els números ja són fàcils: fes el compte de cap, més o menys.'}</p>` : ''}
        ${st.locked ? '<button class="btn" id="cont">Continua</button>' : '<button class="btn" id="estok">Aquesta és la meva estimació</button>'}`;
      wireLine();
    } else if (P === 'calc') {
      ans.innerHTML = `<p class="how sum">${H(prob.label)} =</p><p class="display" id="disp" aria-live="polite"></p>${st.revealed ? '<button class="btn" id="cont">Continua</button>' : keys()}`;
      paintDisp();
    } else if (P === 'check') ans.innerHTML = `<p class="how sum">${H(prob.check.q)}</p><div class="opts">${prob.check.opts.map((v, i) => `<button class="btn soft${st.chkWrong.has(i) ? ' no' : ''}" data-c="${i}"${st.chkWrong.has(i) ? ' disabled' : ''}>${num(prob, v)}</button>`).join('')}</div>`;
  }
  const paintDisp = () => { const d = $('#disp', ans); if (d) d.innerHTML = `${st.buf ? H(st.buf) : '<i class="caret"></i>'} <small>${H(prob.unit)}</small>`; };

  /* step 1: the clues */
  function clue(k) {
    if (st.phase !== 'read' || busy || !t.on || st.found.has(k) || !prob.tok[k]) return;
    if (prob.tok[k].u) {
      st.found.add(k); st.bad = null; st.hint = null; blip(700 + 80 * st.found.size);
      if (useful.every(x => st.found.has(x))) { busy = true; paintCase(); paintAns(); tip('Ja tens totes les pistes!', 'go'); good?.(); later(1100, () => go('op')); }
      else { paintCase(); paintAns(); tip('Ben vist! És una pista.', 'go'); }
      spark($(`[data-tok="${k}"]`, stage) || $('.slot.ok:last-child', ans), 140);
    } else { st.bad = k; slip(); paintCase(); tip("Ui! Aquesta dada no cal per respondre la pregunta. Continua buscant.", 'oops'); }
  }
  /* step 2: the operation */
  function choose(i, b) {
    if (prob.ops[i].ok) { busy = true; b.classList.add('ok'); spark(b, 140); blip(880); good?.(); tip("Exacte! Aquesta és l'operació.", 'go'); return later(1000, () => go('est')); }
    st.opWrong.add(i); slip(); paintAns();
    tip(`Ui! ${st.opWrong.size >= 2 && prob.opHint ? prob.opHint : "Aquesta no és. Torna a llegir la pregunta: al final n'hi ha més o menys?"}`, 'oops');
  }
  /* step 3: the estimate */
  function estimate() {
    if (st.locked || busy) return;
    const v = st.est, high = v > prob.answer;
    if (Math.abs(v - prob.answer) <= E.tol) { st.mine = v; st.locked = busy = true; blip(880); good?.(); tip('Bona estimació!', 'go'); spark($('#mark', ans), 50); return later(1000, () => go('calc')); }
    st.estTries++; slip();
    const side = high ? "T'has passat: el resultat és més petit." : 'Et quedes curt: el resultat és més gran.';
    if (st.estTries >= 2) { st.mine = v; st.locked = true; st.reveal = Math.round(E.value); paintAns(); tip(`Ui! ${side} Una bona estimació era ${fmt(E.value, prob.dec && !Number.isInteger(E.value) ? 2 : 0)}. Som-hi!`, 'oops'); }
    else { st.estTip = true; paintAns(); tip(`Ui! ${side}`, 'oops'); }
  }
  /* step 4: the exact result. The right number is taken as soon as it is written, with no ✓; a wrong one waits for ✓ (12 may still become 120) */
  const typed = () => st.buf === '' || /,$/.test(st.buf) ? NaN : Number(st.buf.replace(',', '.'));
  function press(d) {
    if (st.phase !== 'calc' || busy || st.revealed) return;
    if (d === 'ok') {
      if (!st.buf) return;
      if (Math.abs(typed() - prob.answer) < 1e-9) return calcRight();
      const v = typed(); st.buf = ''; st.tries++; slip(); again($('#disp', ans)).add('shake');
      const est = fmt(E.value, prob.dec && !Number.isInteger(E.value) ? 2 : 0);
      let txt = prob.hints[String(v)] || (Math.abs(v - prob.answer) > E.tol ? `És molt lluny de la teva estimació (uns ${est}). Repassa el compte.` : 'Gairebé! És a prop, però no és exacte. Repassa el compte pas a pas.');
      if (st.tries >= 3) { st.revealed = true; st.buf = num(prob, prob.answer); txt = `El resultat era ${num(prob, prob.answer)} ${prob.unit}. Al pròxim cas sortirà!`; paintAns(); $('#disp', ans).classList.add('ok'); }
      else paintDisp();
      return tip(`Ui! ${txt}`, 'oops');
    }
    if (d === 'del') st.buf = st.buf.slice(0, -1);
    else if (d === ',') { if (!prob.dec || st.buf.includes(',')) return; st.buf = (st.buf || '0') + ','; }
    else { if (st.buf.length >= 8 || /,\d\d$/.test(st.buf)) return; st.buf = (st.buf + d).replace(/^0+(?=\d)/, ''); }
    blip(); paintDisp();
    if (d !== 'del' && d !== ',' && Math.abs(typed() - prob.answer) < 1e-9) calcRight();
  }
  function calcRight() {
    busy = true; keyFn = null; const d = $('#disp', ans); d.classList.add('ok'); spark(d, 140);
    ans.querySelectorAll('.key').forEach(b => { b.disabled = true; }); blip(880); good?.();
    tip(`${pick(HURRAY)} ${prob.label} = ${num(prob, prob.answer)}.`, 'go'); later(1100, () => go('check'));
  }
  const calcKey = e => {
    const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === ',' || e.key === '.' ? ',' : /^\d$/.test(e.key) ? e.key : null;
    if (d) { e.preventDefault(); press(d); }
  };
  /* step 5: the check with the inverse */
  function check(i, b) {
    if (prob.check.opts[i] === prob.check.ok) {
      busy = true; b.classList.add('ok'); spark(b, 140); chime([523, 659, 784]); good?.(); tip(prob.check.msg, 'go');
      $('#pass', stage).querySelectorAll('li').forEach(li => { li.className = 'done'; });
      return later(1700, () => win({ mine: st.mine }));
    }
    st.chkWrong.add(i); slip(); paintAns(); tip('Ui! Aquest no és. Fes el compte amb calma.', 'oops');
  }

  stage.onclick = e => {
    if (!t.on) return;
    const tk = e.target.closest('[data-tok]'); if (tk) return clue(tk.dataset.tok);
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    if ('o' in b.dataset) return choose(+b.dataset.o, b);
    if ('e' in b.dataset) { if (!st.locked) { setEst(st.est + +b.dataset.e * E.step); blip(); } return; }
    if (b.id === 'estok') return estimate();
    if (b.id === 'cont') return go(st.phase === 'est' ? 'calc' : 'check');
    if ('d' in b.dataset) return press(b.dataset.d);
    if ('c' in b.dataset) return check(+b.dataset.c, b);
  };
  stage.onkeydown = e => { const k = e.target.closest?.('[data-tok]'); if (k && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); clue(k.dataset.tok); } };
  go('read');

  // the hint of the step on show; empty while a right answer is being shown
  return () => {
    if (busy) return '';
    if (st.phase === 'read') { st.hint = useful.find(k => !st.found.has(k)); paintCase(); return 'Mira la dada que brilla: és una pista.'; }
    if (st.phase === 'op') return prob.opHint || "Pensa què passa a la història: s'ajunta, es treu, es repeteix o es reparteix?";
    if (st.phase === 'est') { if (st.locked) return ''; st.estTip = true; paintAns(); return E.label ? `Arrodoneix: ${E.label}` : 'Els números ja són fàcils: fes el compte de cap, més o menys.'; }
    if (st.phase === 'calc') return st.revealed ? '' : prob.two && prob.sol.length ? `Primer pas: ${prob.sol[0]}.` : `Ha de sortir a prop de ${fmt(E.value, prob.dec && !Number.isInteger(E.value) ? 2 : 0)}. Fes el compte a la pissarra.`;
    return 'La inversa de sumar és restar, i la de multiplicar és dividir. Fes el compte.';
  };
}
// what a case teaches, at its end: the steps of the solution, and the estimate next to the result
const solution = (prob, mine) => `<p class="sol">${[...prob.sol, ...(prob.solNote ? [prob.solNote] : [])].map(H).join('<br>')}<br><b>${num(prob, prob.answer)} ${H(prob.unit)}</b></p>
  ${mine != null ? `<p class="lead">La teva estimació: ${fmt(mine, prob.dec && !Number.isInteger(mine) ? 1 : 0)} · el resultat: ${num(prob, prob.answer)}</p>` : ''}`;

/* ---------- the Piscina: three cases to learn the five steps, the first thing a profile with nothing saved meets ---------- */
function piscina() {
  const t = fresh(); show('La Piscina', true, 200); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres casos');
  let k = -1;
  function next() {
    k++;
    dots.forEach((d, j) => { d.classList.toggle('cur', j === k); d.classList.toggle('ok', j < k); });
    if (k === POOL.length) return done();
    const prob = build(POOL[k].case, Math.random);
    detective({ t, prob, place: placeOf(POOL[k].case), stage, tip: say, slip: buzz,
      win: async () => { fanfare(); FX.celebrate(8); say(`${pick(HURRAY)} ${k < POOL.length - 1 ? 'Ara, un altre cas.' : ''}`, 'go'); await sleep(1400); if (t.on) next(); } });
    if (k === 0) say('Benvingut a l\'agència de detectius! Cada cas es resol en cinc passos: llegir, triar, estimar, calcular i comprovar. Comencem: toca les dades que necessites.');
    scrollTo({ top: 0, behavior: 'auto' });
  }
  async function done() {
    const r = poolIn(prog); prog = r.prog; save();
    stage.innerHTML = ''; say('L\'agència és oberta! Ara ja pots entrar al mapa dels casos.', 'go'); fanfare(); FX.celebrate(16);
    await sleep(2200); if (t.on) mapa();
  }
  next();
}

/* ---------- one level of a project: a case with its five steps ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), Lv = PROJECTS[sec].levels[idx], prob = build(Lv.case, Math.random);
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${Lv.title}</span><span class="chip" id="st"></span><span class="tools"><button class="link" id="boardb">Pissarra</button><button class="link" id="hintb">Dona'm una pista</button></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div>`;
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  Board.wipe();
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const slip = () => { slips++; stars(); buzz(); };

  // the level is handed in at once, before any wait
  async function win({ mine }) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    fanfare(); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(500); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">Cas resolt<br><small>${Lv.title}</small></p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      ${solution(prob, mine)}
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  const help = detective({ t, prob, place: PROJECTS[sec].place, stage, tip, slip, win });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  $('#boardb').onclick = () => Board.open(prob.q);
  stars();
}

/* ---------- the exam of a circle: six cases of its projects, the answer only, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]);
  const qs = exam(c, Math.random), run = [], { stage, tail, dots, say } = frame(qs.length, 'Sis preguntes', '<button class="link" id="boardb">Pissarra</button>');
  let k = -1, res = null, prob = null;
  $('#boardb').onclick = () => Board.open(prob?.q);
  const next = () => k === qs.length - 1 ? finish() : arm();
  function arm() {
    k++; Board.wipe();
    const L = qs[k], last = k === qs.length - 1;
    let done = false, buf = '';
    prob = build(L.case, Math.random);
    const end = ok => {
      if (done || !t.on) return;
      done = true; keyFn = null; stage.inert = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
      if (last) { res = examIn(prog, c, qs, run); res.first = res.good && !prog.exams[c]; prog = res.prog; save(); }
      if (ok) { say('Correcte!', 'go'); chime([523, 659, 784]); FX.celebrate(6); return sleep(1000).then(() => { if (t.on) next(); }); }
      say(`No és correcte. Era ${num(prob, prob.answer)} ${prob.unit}: ${H([...prob.sol, ...(prob.solNote ? [prob.solNote] : [])].join(' · '))}`, 'oops'); buzz(); openAt = performance.now() + SETTLE;
      tail.innerHTML = `<button class="btn" id="nx">${last ? 'Mira el resultat' : 'Segueix'}</button>`;
      $('#nx').onclick = e => { if (e.timeStamp >= openAt) next(); };
    };
    stage.inert = false; tail.innerHTML = ''; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[L.p].name}`;
    stage.innerHTML = `${caseHtml(prob, placeOf(L.case))}<div class="ans"><p class="display" id="disp" aria-live="polite"></p><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button class="key" data-d="${d}">${d}</button>`).join('')}
      ${prob.dec ? '<button class="key" data-d="," aria-label="Coma">,</button>' : '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>'}<button class="key" data-d="0">0</button>${prob.dec ? '<button class="key del" data-d="del" aria-label="Esborra">⌫</button>' : ''}
      <button class="key ok" data-d="ok" aria-label="Comprova">✓</button></div></div>`;
    paintStory(stage, prob, null, false);
    const paint = () => { $('#disp').innerHTML = `${buf ? H(buf) : '<i class="caret"></i>'} <small>${H(prob.unit)}</small>`; };
    const typed = () => buf === '' || /,$/.test(buf) ? NaN : Number(buf.replace(',', '.'));
    // the right number is taken as soon as it is written; ✓ hands in a wrong one, and that is the only try
    const press = d => {
      if (done) return;
      if (d === 'ok') { if (buf) end(Math.abs(typed() - prob.answer) < 1e-9); return; }
      if (d === 'del') buf = buf.slice(0, -1);
      else if (d === ',') { if (!prob.dec || buf.includes(',')) return; buf = (buf || '0') + ','; }
      else { if (buf.length >= 8 || /,\d\d$/.test(buf)) return; buf = (buf + d).replace(/^0+(?=\d)/, ''); }
      blip(); paint();
      if (d !== 'del' && d !== ',' && Math.abs(typed() - prob.answer) < 1e-9) { $('#disp').classList.add('ok'); end(true); }
    };
    stage.onclick = e => { const b = e.target.closest('button'); if (b && 'd' in b.dataset && e.timeStamp >= openAt) press(b.dataset.d); };
    keyFn = e => { const d = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : e.key === ',' || e.key === '.' ? ',' : /^\d$/.test(e.key) ? e.key : null; if (d) { e.preventDefault(); press(d); } };
    openAt = performance.now() + SETTLE; paint();
    say('Llegeix bé, estima i calcula. Només hi ha un intent!');
    scrollTo({ top: 0, behavior: 'auto' });
  }
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) FX.celebrate(16);
    panel(stage, `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    scrollTo({ top: 0, behavior: 'auto' });
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  }
  arm();
}

/* ---------- «Caça l'errada»: three notes of the detective's notebook; from none to two of them are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres notes');
  let k = -1, C, busy, res = null;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<article class="case"><div class="scn">${scene(C.scene.place)}</div><div class="note"><p class="story">${H(C.scene.text)}</p></div></article>
      <p class="ask claim">A la llibreta del detectiu hi diu:</p><p class="claimbox">«${H(C.says)}»</p>`;
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Fes el càlcul: la llibreta diu la veritat?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { say(said, 'oops'); buzz(); }
    await sleep(ok ? 1300 : 2800); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}»)`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Llibreta perfecta!' : 'Llibreta acabada.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra llibreta</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era. La bona és: «${C.real}»` : 'Sí, era correcta!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: «${C.real}»`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="opts col">${C.opts.map((v, i) => `<button class="btn soft" data-v="${i}">${H(v)}</button>`).join('')}</div>`;
      say('Ben vist! Ara tria la frase que diu la veritat.', 'go');
    } else if ('v' in b.dataset) { const ok = C.opts[+b.dataset.v] === C.real; answer(ok, ok ? `Arreglada: «${C.real}»` : `No era aquesta. La bona és: «${C.real}»`); }
  };
  arm();
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
