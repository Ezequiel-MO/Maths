import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { levelRow, wireLevels, panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { FILES, fr, dark, delta, white, VALUE, parse, reach, judge, all, mate, mates, gains, kingOf, attackerOf, inCheck, checks, route, done, goals, wantOf, starsFor,
  PROJECTS, CIRCLES, POOL, POINTS, VALID, EXAM_PASS, RAPID, wantQ, rightQ, clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf,
  BADGES, badges, levelIn, poolIn, streakIn, rapidIn, exam, examIn, sprint, sheet, sheetIn } from './logic.js';

const KEY = 'escacs-de-l-estany';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = OBERT;

// Facts only: { so, lv, piscina, exams, fulls, rapid, ratxa }. clean() makes a complete progress out of anything the browser holds
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

const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);
const buzz = () => tone(150, 0, 0.45, 0.16, 'triangle');
// right answers in a row at the first try, and the longest run since the page opened
let streak = 0, top = 0;
// the notes climb with the run
const ding = () => { const f = 660 * 2 ** (Math.min(streak, 12) / 12); tone(f, 0, 0.14, 0.08); tone(f * 4 / 3, 0.09, 0.18, 0.07); };

/* ---------- figures ---------- */
// The six pieces, each drawn in a box of 100: its body in pieces of class body, its details in class dt. The colour comes from the stylesheet
const D = (d, c = 'body') => `<path class="${c}" d="${d}"/>`, O = (x, y, r, c = 'body') => `<circle class="${c}" cx="${x}" cy="${y}" r="${r}"/>`;
const FOOT = D('M24 91 Q24 80 35 80 H65 Q76 80 76 91Z');
const SHAPE = {
  P: D('M38 81 C43 68 46 60 46 52 H54 C54 60 57 68 62 81Z') + D('M37 46 H63 Q66 49.500 63 53 H37 Q34 49.500 37 46Z') + O(50, 33, 13.5) + FOOT,
  R: D('M36 42 H64 L67 81 H33Z') + D('M29 18 H40 V26 H45 V18 H55 V26 H60 V18 H71 V38 Q71 43 66 43 H34 Q29 43 29 38Z') + FOOT,
  B: D('M41 58 H59 C59 68 62 74 66 81 H34 C38 74 41 68 41 58Z') + D('M50 17 C64 30 66 43 58 53 H42 C34 43 36 30 50 17Z') + D('M53 27 L46 39', 'dt') + D('M36 52 H64 Q67 55.500 64 59 H36 Q33 55.500 36 52Z') + O(50, 13, 5) + FOOT,
  N: D('M33 81 C33 64 42 56 46 46 C40 50 33 54 27 51 C21 48 22 41 27 36 L41 23 L39 10 L50 19 C67 22 75 42 69 81Z') + O(43, 32, 3, 'dt') + D('M57 27 C64 38 66 52 63 68', 'dt') + FOOT,
  Q: D('M23 37 L33 59 L37 29 L44 57 L50 25 L56 57 L63 29 L67 59 L77 37 L68 81 H32Z') + [[23, 33], [37, 25], [50, 21], [63, 25], [77, 33]].map(([x, y]) => O(x, y, 5)).join('') + D('M33 71 H67', 'dt') + FOOT,
  K: D('M50 41 C44 30 27 32 27 47 C27 59 36 65 36 81 H64 C64 65 73 59 73 47 C73 32 56 30 50 41Z') + D('M46 7 H54 V14 H61 V22 H54 V33 H46 V22 H39 V14 H46Z') + D('M36 71 H64', 'dt') + FOOT
};
const fx1 = n => +n.toFixed(1);
const STAR = `<path d="M${Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, R = i % 2 ? 14 : 32; return `${fx1(50 + R * Math.cos(a))} ${fx1(50 + R * Math.sin(a))}`; }).join('L')}Z"/>`;
const ROCK = '<path d="M17 70 C9 50 24 26 48 24 C73 22 90 44 83 66 C79 82 28 86 17 70Z"/><path class="sh" d="M30 46 C36 36 48 32 58 34"/>';
// a piece on its own, to sit in a line of text or on a button
const ico = p => `<svg class="ico" viewBox="0 0 100 100" aria-hidden="true"><g class="pc ${white(p) ? 'w' : 'b'}">${SHAPE[p.toUpperCase()]}</g></svg>`;
const XY = s => { const [f, r] = fr(s); return [f * 100, (7 - r) * 100]; };
const tr = s => { const [x, y] = XY(s); return `transform:translate(${x}px,${y}px)`; };
const pcHtml = (s, p) => `<g class="pc ${white(p) ? 'w' : 'b'}" data-s="${s}" data-p="${p}" style="${tr(s)}"><g class="pi">${SHAPE[p.toUpperCase()]}</g></g>`;
const thingsHtml = pos => pos.rocks.map(s => `<g class="rock" style="${tr(s)}">${ROCK}</g>`).join('') + pos.stars.map(s => `<g class="star" data-s="${s}" style="${tr(s)}"><g>${STAR}</g></g>`).join('');
const markHtml = (cls, list) => list.map(s => { const [x, y] = XY(s); return cls.startsWith('dot') ? `<circle class="m ${cls}" cx="${x + 50}" cy="${y + 50}" r="17"/>` : `<rect class="m ${cls}" x="${x + 4}" y="${y + 4}" width="92" height="92" rx="12"/>`; }).join('');
// The board as a drawing: a1 at the bottom left, the letters under it and the numbers on its left. blind leaves those out, plain paints every
// square the same; sel and ask are squares to ring
function svgOf(pos, o = {}) {
  let sqs = '';
  for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) { const n = FILES[f] + (r + 1); sqs += `<rect class="s ${o.plain ? 'p' : dark(n) ? 'd' : 'l'}" data-s="${n}" x="${f * 100}" y="${(7 - r) * 100}" width="100" height="100"/>`; }
  const labs = o.blind ? '' : [...FILES].map((ch, f) => `<text class="lab" data-l="${ch}" x="${f * 100 + 50}" y="850">${ch}</text>`).join('') + Array.from({ length: 8 }, (_, r) => `<text class="lab" data-l="${r + 1}" x="-32" y="${(7 - r) * 100 + 64}">${r + 1}</text>`).join('');
  return `<svg class="bd" viewBox="-62 -10 874 ${o.blind ? 824 : 884}" role="img" aria-label="El tauler d'escacs"><defs><clipPath id="bdc"><rect width="800" height="800" rx="16"/></clipPath></defs>
    <rect class="frame" x="-10" y="-10" width="820" height="820" rx="24"/><g clip-path="url(#bdc)">${sqs}<g class="hi"></g></g><g class="mk">${markHtml('sel', o.sel || [])}${markHtml('ask', o.ask || [])}</g><g class="th">${thingsHtml(pos)}</g><g class="pcs">${Object.keys(pos.at).map(s => pcHtml(s, pos.at[s])).join('')}</g>${labs}</svg>`;
}
// A board that lives in host: draw(pos, o) makes it, set(pos) puts the pieces back, go(from, to, pos) slides one, mark and clear ring squares,
// preview shows what is typed (a letter lights its column, a letter and a number their square), point gives the middle of a square on the screen
function tauler(host) {
  let svg;
  const g = c => svg.querySelector('.' + c);
  return {
    draw(pos, o) { host.innerHTML = svgOf(pos, o); svg = host.firstElementChild; },
    set(pos) { g('th').innerHTML = thingsHtml(pos); g('pcs').innerHTML = Object.keys(pos.at).map(s => pcHtml(s, pos.at[s])).join(''); },
    async go(from, to, pos) {
      const e = svg.querySelector(`.pc[data-s="${from}"]`), x = svg.querySelector(`.pc[data-s="${to}"]`), st = svg.querySelector(`.star[data-s="${to}"]`);
      tone(330, 0, 0.12, 0.06, 'triangle');
      // on top of the others, and then on its way: a node put back in the page only moves smoothly after it has been laid out once
      g('pcs').append(e); void e.getBoundingClientRect(); e.dataset.s = to; e.style.cssText = tr(to);
      await sleep(RM ? 0 : 380);
      for (const gone of [x, st]) if (gone) { gone.removeAttribute('data-s'); gone.classList.add('gone'); setTimeout(() => gone.remove(), 450); }
      if (pos.at[to] !== e.dataset.p) { e.dataset.p = pos.at[to]; e.firstElementChild.innerHTML = SHAPE[pos.at[to].toUpperCase()]; e.classList.add('crown'); }
      await sleep(RM ? 0 : 120);
    },
    mark(cls, list) { g('mk').insertAdjacentHTML('beforeend', markHtml(cls, list)); },
    clear(cls) { svg.querySelectorAll('.m.' + cls).forEach(e => e.remove()); },
    preview(part) {
      const f = FILES.indexOf(part[0] || '?'), r = part[1] ? +part[1] - 1 : -1;
      g('hi').innerHTML = (f < 0 ? '' : `<rect class="col" x="${f * 100}" y="0" width="100" height="800"/>`) + (r < 0 ? '' : `<rect class="row" x="0" y="${(7 - r) * 100}" width="800" height="100"/><rect class="cell" x="${f * 100 + 3}" y="${(7 - r) * 100 + 3}" width="94" height="94" rx="12"/>`);
      svg.querySelectorAll('.lab').forEach(e => e.classList.toggle('on', e.dataset.l === part[0] || e.dataset.l === part[1]));
    },
    point(s) { return mid(svg.querySelector(`.s[data-s="${s}"]`)); }
  };
}

/* ---------- words ---------- */
// one row of letters, one of numbers: a square is typed as a letter and then a number, and the keys of what cannot come next are dimmed
const KEYS = `<div class="keys" data-next="l">${[...FILES].map(k => `<button class="key l" data-k="${k}">${k}</button>`).join('')}${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `<button class="key n" data-k="${k}">${k}</button>`).join('')}
  <button class="key del" data-k="del" aria-label="Esborra">⌫</button><button class="key ok" data-k="ok" aria-label="Comprova">✓</button></div>`;
// what is typed so far after one more key: letters and numbers take turns, up to len characters
const typed = (buf, key, len) => key === 'del' ? buf.slice(0, -1) : buf.length < len && (buf.length % 2 === 0) === key >= 'a' ? buf + key : buf;
const box = s => `<output class="in">${(s + '··').slice(0, 2)}</output>`;
const BRAVO = ['Molt bé!', 'Perfecte!', 'Genial!', 'Així es fa!', 'Bona jugada!'];
const HURRAY = ['Nivell superat!', 'Molt bé!', 'Perfecte!', 'Genial!', 'Quina jugada!'];
const NAME = { K: 'el rei', Q: 'la dama', R: 'la torre', B: "l'alfil", N: 'el cavall', P: 'el peó' };
const ONE = { K: 'un rei', Q: 'una dama', R: 'una torre', B: 'un alfil', N: 'un cavall', P: 'un peó' };
const BLACK = { K: 'el rei negre', Q: 'la dama negra', R: 'la torre negra', B: "l'alfil negre", N: 'el cavall negre', P: 'el peó negre' };
const name = p => NAME[p.toUpperCase()], black = p => BLACK[p.toUpperCase()];
// the rule of each piece, said with the two numbers of a move: how much the letter changes and how much the number does
const RULE = {
  R: 'Torre: en línia recta. O canvia la lletra o canvia el número, mai tots dos.',
  B: "Alfil: en diagonal. La lletra i el número canvien el mateix nombre de passos.",
  Q: "Dama: com la torre (només canvia un dels dos) o com l'alfil (canvien igual).",
  K: 'Rei: un sol pas. La lletra i el número canvien 1 com a màxim.',
  N: "Cavall: salt en L. Un dels dos canvia 2 i l'altre canvia 1.",
  P: 'Peó: la mateixa lletra i el número +1 (des de la fila 2, també +2). Per capturar: la lletra canvia 1 i el número +1.'
};
const NOT = { R: 'La torre només en pot canviar un dels dos.', B: "A l'alfil li han de canviar igual.", Q: 'Per a la dama ha de ser una recta (un dels dos no canvia) o una diagonal (canvien igual).',
  K: 'El rei només fa un pas: 1 com a màxim.', N: 'El cavall vol un 2 i un 1.' };
const KIND = { sq: 'El nom de la casella', reach: 'On pot anar?', go: 'Recull les estrelles', take: 'Captura-les totes', best: 'La millor captura', check: 'Escac!', mate: 'Mat en una' };
// one sky colour per project, and the colour of each circle
const HUES = [165, 205, 318, 28, 262, 190, 48, 350, 285], RING = [165, 318, 262, 48];
const cap = s => s[0].toUpperCase() + s.slice(1);
const sg = n => n > 0 ? '+' + n : n < 0 ? '−' + -n : '0';
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const pts = n => count(n, 'punt', 'punts');
const walk = (df, dr) => [df && `${count(Math.abs(df), 'columna', 'columnes')} cap a ${df > 0 ? 'la dreta' : "l'esquerra"}`, dr && `${count(Math.abs(dr), 'fila', 'files')} ${dr > 0 ? 'amunt' : 'avall'}`].filter(Boolean).join(' i ');
const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
// why a move cannot be played, from what judge() found
function why(pos, j, f, s) {
  const t = pos.at[f].toUpperCase(), [a, b] = delta(f, s).map(Math.abs), ch = `De ${f} a ${s} la lletra canvia ${a} i el número ${b}. `;
  switch (j.code) {
    case 'same': return `${cap(NAME[t])} ja és a ${s}!`;
    case 'rock': return 'En aquesta casella hi ha una pedra.';
    case 'own': return 'En aquesta casella ja hi ha una peça teva.';
    case 'shape': return ch + NOT[t];
    case 'block': return `${cap(!pos.at[j.at] ? 'la pedra' : white(pos.at[j.at]) ? 'la teva peça' : black(pos.at[j.at]))} de ${j.at} tapa el camí, i ${NAME[t]} no salta.`;
    case 'pblock': return 'El peó té el pas tapat: només avança si la casella del davant és buida.';
    case 'pdiag': return 'El peó només va en diagonal quan hi ha una peça negra per capturar.';
    case 'pshape': return ch + 'El peó vol la mateixa lletra i el número +1.';
    case 'check': return t === 'K' ? `A ${s} el rei quedaria atacat per ${black(pos.at[j.by])} de ${j.by}.` : `Així el teu rei quedaria atacat per ${black(pos.at[j.by])} de ${j.by}.`;
    default: return `Compte! ${cap(black(pos.at[j.by]))} de ${j.by} ataca ${s} i et capturaria ${NAME[t]}.`;
  }
}
// after a new question comes up, touches are ignored for this long: a second tap on the button that was there must not answer it
const SETTLE = 450;

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /escacs-de-l-estany\.html$/.test(location.pathname);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toS').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

// The keys on the screen and a real keyboard both end up here. Enter on a button that is not a key of the pad is left alone:
// it presses that button, as Space does.
let keyFn = null;
addEventListener('keydown', e => {
  if (!keyFn || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter' && e.target.closest?.('button:not([data-k]), a')) return;
  const ch = e.key.toLowerCase(), k = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^[a-h1-8]$/.test(ch) ? ch : null;
  if (k) { e.preventDefault(); keyFn(k); }
});
function drawCombo() {
  const e = $('#cb'); if (!e) return;
  e.hidden = streak < 3; e.textContent = `Ratxa ×${streak}`;
  if (streak >= 3) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
}
const shake = e => { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); };
// which keys can come next: 'l' a letter, 'n' a number, 'x' none (the square is whole)
const nextKey = (buf, len) => { const k = $('.keys'); if (k) k.dataset.next = buf.length >= len ? 'x' : buf.length % 2 ? 'n' : 'l'; };
// the end of a level or of a board comes up over its two halves
function curtain(html) {
  panel($('#split'), html);
  $('#split .panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
}
// the longest run goes in with whatever is being handed in: gives back the badges it earns
function run() { const r = streakIn(prog, top); prog = r.prog; return r.news; }
// a crowned queen crosses the whole screen from the bottom, leaving sparks behind
function launch() {
  if (RM) return;
  const e = document.createElement('div'); e.className = 'launch'; e.innerHTML = ico('Q'); document.body.append(e);
  [0, 0.1, 0.2, 0.3, 0.4].forEach((d, i) => tone(196 * 2 ** (i / 4), d, 0.5, 0.05, 'triangle'));
  const t0 = performance.now(), iv = setInterval(() => {
    const r = e.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.bottom - 14, 48, 7, 80, 320);
    if (performance.now() - t0 > 1500) { clearInterval(iv); e.remove(); }
  }, 50);
}
const laneHtml = hue => `<div class="lane" id="lane" style="--p:0;--ph:${hue}" aria-hidden="true"><i class="fuel"></i><span class="rk">${ico('P')}</span><span class="goal">${ico('Q')}</span></div>`;

/* ---------- the map: a band for each circle, a piece for each project and the exam of the circle at the end ---------- */
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${RING[c]} 60% 60%)" stroke-width="2.400" opacity="${3 - i <= c ? 1 : 0.25}"/>`).join('')}<circle r="2" fill="hsl(${RING[c]} 80% 70%)"/></svg>`;
const ICON = [`<svg class="ico" viewBox="0 0 100 100" aria-hidden="true"><g class="star">${STAR}</g></svg>`, ...['R', 'B', 'Q', 'K', 'N', 'P', 'r', 'k'].map(ico)];
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
  fresh(); show('El mapa', false, 205);
  const band = c => `<section class="ring${openC(c) ? '' : ' shut'}" style="--rh:${RING[c]}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}" style="--h:${HUES[i]}"${openC(c) ? '' : ' disabled'}><i class="orb" aria-hidden="true">${ICON[i]}</i><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span>
        <span class="pp" aria-hidden="true">${starsOf(i).map(s => `<i class="s${s}"></i>`).join('')}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice(), any = OPEN || validated(prog).length > 0;
  $('#game').innerHTML = `<div class="map">${tip ? `<p class="next">${tip}</p>` : ''}${CIRCLES.map((_, c) => band(c)).join('')}
    <div class="extra"><button class="btn soft" id="rapid">⚡ Repte llampec${prog.rapid ? ` · rècord ${prog.rapid}` : ''}</button>
      <button class="btn soft" id="full"${any ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>🔍 Caça l'errada</button>
      <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div></div>`;
  $('#game').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level that still has something to win, as far as the project is open
      const i = +b.dataset.p, k = starsOf(i).findIndex(n => n < 3);
      mission(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : reached(prog, i), 9));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
    else if (e.target.closest('#rapid')) llampec();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

/* ---------- one level: a board and what to do on it, always by typing squares ---------- */
function mission(sec, idx) {
  const c = circleOf(sec), P = PROJECTS[sec], L = P.levels[idx], t = fresh(); show(`Cercle ${c} · ${P.name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), total = goals(L), start = parse(L.pos || ''), sqs = L.t === 'sq';
  // with more than one white piece, the square the move starts from is typed too
  const two = !sqs && Object.values(start.at).filter(white).length > 1, len = two ? 4 : 2;
  let pos = start, used = 0, k = 0, slips = 0, help = 0, buf = '', busy = false;
  const found = [];
  root.innerHTML = `${levelRow(P.levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${KIND[L.t]}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    ${laneHtml(HUES[sec])}<p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <div class="split" id="split"><div class="field" id="field"></div><div class="desk">
      <div class="calc" id="calc"${sqs ? ' hidden' : ''}><p class="rule" id="rule"></p><p class="row"><span>Lletra</span><b id="cf"></b><i id="df"></i></p><p class="row"><span>Número</span><b id="cn"></b><i id="dn"></i></p></div>
      <p class="ask" id="ask"></p>${KEYS}</div><span class="combo" id="cb" hidden></span></div>`;
  const B = tauler($('#field')), lane = $('#lane');
  // a level is marked done when it has a star
  root.querySelectorAll('.levels button').forEach((e, i) => e.classList.toggle('done', prog.lv[sec * 10 + i] > 0));
  wireLevels(root, i => mission(sec, i));
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const mine = () => Object.keys(pos.at).filter(s => white(pos.at[s]));
  // where the move starts and what is typed of where it ends
  const src = () => sqs ? (L.asks[k][0] === 'step' ? L.asks[k][1] : '') : two ? (buf.length >= 2 ? buf.slice(0, 2) : '') : mine()[0];
  const dst = () => two ? buf.slice(2) : buf;
  const burst = (s, h = 48) => { const p = B.point(s); FX.burst(p.x, p.y, h, 22, 170); FX.ring(p.x, p.y, h, 8, p.w * 0.9); };

  // what is typed so far, shown on the board, in the box and in the counter of the two changes
  function paint() {
    const f = src(), d = dst();
    B.preview(two && buf.length < 2 ? buf : d); nextKey(buf, len);
    if (!sqs) { B.clear('sel'); if (f) B.mark('sel', [f]); }
    $('#ask').innerHTML = sqs ? `Casella ${box(buf)}` : two ? `${box(buf.slice(0, 2))} → ${box(d)}` : `${ico(pos.at[f])}<span>${f}</span> → ${box(d)}`;
    if (sqs) return;
    $('#rule').textContent = f ? RULE[pos.at[f]] : "Escriu primer la casella d'on surt la peça.";
    $('#cf').textContent = `${f ? f[0] : '?'} → ${d[0] || '?'}`; $('#df').textContent = f && d[0] ? sg(delta(f, d[0] + '1')[0]) : '';
    $('#cn').textContent = `${f ? f[1] : '?'} → ${d[1] || '?'}`; $('#dn').textContent = f && d[1] ? sg(d[1] - f[1]) : '';
  }
  function task() {
    if (sqs) {
      const a = L.asks[k], w = wantOf(a);
      return a[0] === 'cross' ? `Encén la casella on es creuen la columna ${w[0]} i la fila ${w[1]}.` : a[0] === 'star' ? "Quina casella té l'estrella?"
        : a[0] === 'blind' ? "Sense lletres ni números: quina casella té l'estrella?" : `Surt de ${a[1]} i fes ${walk(a[2], a[3])}. On arribes?`;
    }
    const left = L.max - used, mv = `Et ${left === 1 ? 'queda 1 moviment' : `queden ${left} moviments`}.`, n = L.n - found.length;
    switch (L.t) {
      case 'reach': return found.length ? (n === 1 ? 'En falta una.' : `En falten ${n}.`) : L.all ? `Escriu totes les caselles on pot anar ${name(pos.at[mine()[0]])}. ${L.n === 1 ? "Només n'hi ha una" : `N'hi ha ${L.n}`}.` : `Escriu ${L.n} caselles on pot anar ${name(pos.at[mine()[0]])}.`;
      case 'go': return `Recull ${pos.stars.length === 1 ? "l'estrella" : 'totes les estrelles'}. ${mv}`;
      case 'take': return `Captura ${Object.values(pos.at).filter(p => !white(p)).length === 1 ? 'la peça negra' : 'totes les peces negres'}. ${mv}`;
      case 'best': return 'Pots capturar més d\'una peça. Quina captura et fa guanyar més punts?';
      case 'check': return 'Fes escac al rei negre sense perdre la peça.';
      default: return 'Escac i mat en una sola jugada!';
    }
  }
  // gets the next thing to type ready; said is what to say before it when something just went well
  function arm(said) {
    buf = ''; help = 0;
    if (sqs) {
      const a = L.asks[k], w = wantOf(a);
      pos = { at: {}, rocks: [], stars: a[0] === 'star' || a[0] === 'blind' ? [w] : [] };
      B.draw(pos, { blind: a[0] === 'blind', sel: a[0] === 'step' ? [a[1]] : [] });
    } else B.clear('dot');
    paint(); tip((said ? said + ' ' : k === 0 && used === 0 && L.tip ? L.tip + ' ' : '') + task(), said ? 'go' : '');
    // on a phone the board can be off screen: bring the tip and the board back
    if ($('#tip').getBoundingClientRect().top < 0) $('#tip').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  const step = () => { lane.style.setProperty('--p', k / total); };
  const good = () => { streak = help ? 0 : streak + 1; top = Math.max(top, streak); ding(); drawCombo(); };
  // a wrong answer: what went wrong is said, and the square typed flashes on the board
  function wrong(msg, at) {
    slips++; help++; streak = 0; drawCombo(); stars(); buzz(); tip('Ui! ' + msg, 'oops'); buf = ''; paint(); shake($('#ask'));
    if (at) { B.mark('bad', [at]); setTimeout(() => { if (t.on) B.clear('bad'); }, 900); }
  }

  function answerSq(s) {
    const a = L.asks[k], w = wantOf(a);
    if (s !== w) return wrong(help ? (a[0] === 'step' ? `Has arribat a ${s}. Compta a poc a poc: primer les lletres des de la ${a[1][0]}, després els números des ${a[1][1] === '1' ? "de l'1" : 'del ' + a[1][1]}.` : `Has escrit ${s}. La lletra és la de sota de la columna; el número, el del costat de la fila.`)
      : s[0] === w[0] ? `La columna ${s[0]} és bona, però la fila no.` : s[1] === w[1] ? `La fila ${s[1]} és bona, però la columna no.` : 'Ni la columna ni la fila. Torna-ho a mirar a poc a poc.', s);
    busy = true; good(); B.preview(''); B.mark('ok', [w]); burst(w, 150); k++; step();
    tip(a[0] === 'step' ? `${a[1]} → ${w}: lletra ${sg(a[2])}, número ${sg(a[3])}. ${pick(BRAVO)}` : `${w}: columna ${w[0]}, fila ${w[1]}. ${pick(BRAVO)}`, 'go');
    setTimeout(() => { if (!t.on) return; if (k === total) return win(); busy = false; arm(); }, 1100);
  }
  function answerReach(f, s) {
    if (found.includes(s)) { tip("Aquesta ja la tens. Busca'n una altra!", 'oops'); buf = ''; paint(); return; }
    const j = judge(pos, f, s);
    if (!j.ok) return wrong(why(pos, j, f, s), s);
    const [df, dr] = delta(f, s);
    found.push(s); good(); B.mark('ok', [s]); burst(s, 150); k++; step();
    if (k === total) { busy = true; tip(`${f} → ${s}: lletra ${sg(df)}, número ${sg(dr)}. Les tens totes!`, 'go'); return win(); }
    arm(`${f} → ${s}: lletra ${sg(df)}, número ${sg(dr)}.`);
  }
  // a move of a 'go' or 'take' level: it is played, and if the level can no longer be finished in the moves left it starts again
  async function play(f, s, j) {
    busy = true; pos = j.pos; used++; await B.go(f, s, pos); if (!t.on) return;
    const got = L.t === 'go' ? j.star : !!j.took;
    if (j.star || j.took) { burst(s); chime([784, 1047]); }
    if (got) { k++; step(); }
    if (done(L, pos)) { good(); tip(`Fet en ${count(used, 'moviment', 'moviments')}! ${pick(HURRAY)}`, 'go'); return win(); }
    if (!route(L, pos, L.max - used)) {
      slips++; streak = 0; drawCombo(); stars(); buzz();
      tip(used >= L.max ? `T'has quedat sense moviments: en tenies ${L.max}. Tornem a començar!` : 'La jugada es pot fer, però amb els moviments que queden ja no hi arribes. Tornem a començar!', 'oops');
      await sleep(2600); if (!t.on) return;
      pos = start; used = 0; k = 0; step(); B.set(pos); busy = false; return arm();
    }
    good(); busy = false; arm(got ? pick(BRAVO) : 'Ben mogut.');
  }
  async function playBest(f, s, j) {
    const g = gains(pos), m = g.find(x => x.from === f && x.to === s);
    if (!m) return wrong('Aquesta jugada no captura cap peça. Busca una captura!', s);
    if (m.gain < g[0].gain) return wrong(m.lost ? `Guanyes ${pts(m.won)}, però ${black(pos.at[m.by])} de ${m.by} et captura ${name(pos.at[f])}: ${m.won} − ${m.lost} = ${sg(m.gain)}. N'hi ha una de millor.` : `Guanyes ${pts(m.won)}, però hi ha una captura que en dona més.`, s);
    busy = true; good(); pos = j.pos; await B.go(f, s, pos); if (!t.on) return; burst(s);
    tip(m.lost ? `${m.won} − ${m.lost} = ${pts(m.gain)} de guany: la millor captura!` : `${pts(m.won)} sense perdre res: la millor captura!`, 'go'); k = 1; step(); win();
  }
  async function playCheck(f, s, j) {
    if (!inCheck(j.pos, false)) return wrong(`Des de ${s}, ${name(pos.at[f])} no ataca el rei negre.`, s);
    const by = attackerOf(j.pos, s, false);
    if (by) return wrong(`És escac, però ${black(pos.at[by])} de ${by} et capturaria ${name(pos.at[f])}.`, s);
    busy = true; good(); pos = j.pos; await B.go(f, s, pos); if (!t.on) return; B.mark('risk', [kingOf(pos, false)]); burst(kingOf(pos, false), 350);
    tip(`Escac! Des de ${s}, ${name(pos.at[s])} ataca el rei.`, 'go'); k = 1; step(); win();
  }
  // a try at mate is played on the board: if it is not mate, the squares the king can run to light up and the move is taken back
  async function playMate(f, s, j) {
    const was = pos, kq = kingOf(pos, false);
    busy = true; buf = ''; paint(); await B.go(f, s, j.pos); if (!t.on) return;
    if (mate(j.pos, false)) { good(); pos = j.pos; B.mark('risk', [kq]); burst(kq, 350); tip('Escac i mat! El rei està atacat i no té cap casella on anar.', 'go'); k = 1; step(); return win(); }
    const out = all(j.pos, false), flee = out.filter(m => m[0] === kq).map(m => m[1]);
    B.mark('risk', flee);
    wrong(!inCheck(j.pos, false) ? 'Això no és escac: el rei negre no queda atacat.' : flee.length ? `És escac, però no és mat: el rei pot fugir a ${list(flee)}.`
      : out.some(m => m[1] === s) ? 'És escac, però les negres et poden capturar la peça.' : "És escac, però les negres poden tapar-lo amb una peça.");
    await sleep(2600); if (!t.on) return;
    B.set(was); B.clear('risk'); busy = false; paint();
  }
  function answer() {
    const f = src(), s = dst();
    if (sqs) return answerSq(s);
    if (L.t === 'reach') return answerReach(f, s);
    const j = judge(pos, f, s, L.safe);
    if (!j.ok) return wrong(why(pos, j, f, s), s);
    ({ go: play, take: play, best: playBest, check: playCheck, mate: playMate })[L.t](f, s, j);
  }

  // A hint is a slip. The first says the rule, the second shows something on the board, the third gives half of the square: never the whole move
  function hint() {
    if (busy || !keyFn) return;
    slips++; help++; streak = 0; drawCombo(); stars();
    const deep = help > 1, last = help > 2;
    if (sqs) {
      const a = L.asks[k], w = wantOf(a);
      if (deep) { B.preview(w[0]); return tip('La columna bona és la que brilla. Ara troba la fila.'); }
      return tip(a[0] === 'step' ? 'Fes-ho en dos trossos: primer compta les lletres (a, b, c...), després els números.' : a[0] === 'blind' ? "Compta les columnes des de l'esquerra (a, b, c...) i les files des de baix (1, 2, 3...)."
        : 'La lletra és la de sota de la columna; el número, el del costat de la fila.');
    }
    const lit = f => { B.clear('dot'); B.mark('dot', reach(pos, f).filter(s => judge(pos, f, s, L.safe).ok && !found.includes(s))); };
    if (L.t === 'reach') {
      const f = mine()[0];
      if (!deep) return tip(RULE[pos.at[f]]);
      lit(f); setTimeout(() => { if (t.on) B.clear('dot'); }, 2200);
      return tip("Mira-les bé, que s'apaguen de seguida!");
    }
    if (L.t === 'best') {
      const g = gains(pos), kept = g.filter(m => m.lost).map(m => m.to);
      if (last) return tip(`La millor captura guanya ${pts(g[0].gain)}.`);
      if (!deep) return tip('Peó 1 · cavall 3 · alfil 3 · torre 5 · dama 9. Quines peces negres pots capturar?');
      B.mark('risk', kept);
      return tip(kept.length ? 'Les peces de la casella vermella estan protegides: si les captures, et capturen la teva.' : 'Cap peça negra està protegida: tria la que val més.');
    }
    if (L.t === 'mate') {
      const kq = kingOf(pos, false), flee = all(pos, false).filter(m => m[0] === kq).map(m => m[1]), m = mates(pos)[0];
      if (last) return tip(`La peça que fa mat és ${name(pos.at[m[0]])} de ${m[0]}.`);
      if (!deep) return tip('Busca un escac. Després mira si el rei negre té cap casella lliure al costat.');
      B.clear('risk'); B.mark('risk', flee);
      return tip(flee.length ? 'Ara el rei negre podria anar a les caselles vermelles. El teu escac les ha de vigilar totes.' : "El rei negre ja no es pot moure: només li falta l'escac!");
    }
    // the first move of the shortest way from here
    const m = L.t === 'check' ? checks(pos)[0] : route(L, pos, L.max - used)[0];
    if (last) return tip(`La jugada bona ${two ? `la fa la peça de ${m[0]} i ` : ''}acaba a la columna ${m[1][0]}.`);
    if (!deep) return tip(L.t === 'check' ? 'Escac és atacar el rei negre. Des de quina casella el veuria la teva peça?' : RULE[pos.at[m[0]]]);
    lit(m[0]);
    tip(`Brillen les caselles on pot anar ${name(pos.at[m[0]])} de ${m[0]}. ${L.t === 'check' ? 'Des de quina ataca el rei?' : L.t === 'take' ? 'Quina captura et deixa ben posat per a la següent?' : "Quina t'acosta a una estrella?"}`);
  }

  // the level is handed in with its last answer: its stars go to the mark of the project, and the mark to the XP once the project is validated
  async function win() {
    const got = run(), r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    keyFn = null; prog = r.prog; save(); r.news = [...got, ...r.news];
    lane.classList.add('won'); chime([523, 659, 784, 1047, 1319]); launch(); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(1500); if (!t.on) return;
    curtain(`<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="won" role="img" aria-label="${n} de 3 estrelles">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}" style="--i:${i}">★</i>`).join('')}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    $('#nx').onclick = () => end ? mapa() : mission(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => mission(sec, idx);
  }

  keyFn = key => {
    if (busy) return;
    if (key === 'ok') {
      if (buf.length === len) return answer();
      return tip(buf.length % 2 ? 'Falta el número de la fila.' : two && buf.length === 2 ? 'Ara escriu la casella on va la peça.' : 'Escriu una casella: primer la lletra, després el número.');
    }
    const next = typed(buf, key, len);
    if (next === buf) { if (key !== 'del') shake(root.querySelector('.keys')); return; }
    buf = next; tone(key === 'del' ? 392 : key >= 'a' ? 587 : 698, 0, 0.08, 0.05);
    if (two && buf.length === 2 && !(pos.at[buf] && white(pos.at[buf]))) { tip(`A ${buf} no hi ha cap peça teva. Escriu primer la casella d'on surt.`, 'oops'); buf = ''; shake($('#ask')); }
    paint();
  };
  root.querySelector('.keys').onclick = e => { const b = e.target.closest('button'); if (b && keyFn) keyFn(b.dataset.k); };
  $('#hintb').onclick = hint;
  if (!sqs) B.draw(pos);
  stars(); drawCombo(); arm();
}

/* ---------- the board of quick questions, one at a time. The Piscina, an exam and a lightning round all play on it ---------- */
function tipQ(q) {
  switch (q.kind) {
    case 'name': return "Quina casella té l'estrella?";
    case 'step': return `Surt de ${q.from} i fes ${walk(...q.d)}. On arribes?`;
    case 'hit': return `${cap(NAME[q.t])} només pot capturar una de les tres peces negres. A quina casella?`;
    case 'mate': return `Escac i mat en una jugada amb ${name(parse(q.pos).at[q.from])} de ${q.from}. A quina casella va?`;
    case 'count': return `El tauler és buit. Quantes caselles pot triar ${NAME[q.t]} des de ${q.s}?`;
    case 'tone': return "S'han esborrat els colors del tauler! La casella marcada és clara o fosca?";
    default: return 'Suma els punts de totes aquestes peces.';
  }
}
// what to work out, without the answer
function hintQ(q) {
  switch (q.kind) {
    case 'name': return 'La lletra és la de sota de la columna; el número, el del costat de la fila.';
    case 'step': return 'Fes-ho en dos trossos: primer compta les lletres, després els números.';
    case 'hit': return RULE[q.t];
    case 'mate': return 'Busca l\'escac que no deixa cap casella lliure al rei.';
    case 'count': return RULE[q.t] + ' Compta-les direcció per direcció.';
    case 'tone': return 'Truc: suma la lletra (a = 1, b = 2...) i el número. Si surt parell, la casella és fosca.';
    default: return 'Peó 1 · cavall 3 · alfil 3 · torre 5 · dama 9.';
  }
}
// the whole answer
function explainQ(q) {
  const w = wantQ(q);
  switch (q.kind) {
    case 'name': return `Era ${w}: columna ${w[0]}, fila ${w[1]}.`;
    case 'step': return `De ${q.from}, lletra ${sg(q.d[0])} i número ${sg(q.d[1])}: ${w}.`;
    case 'hit': return `Només pot capturar a ${w}.`;
    case 'mate': return `El mat era a ${w}.`;
    case 'count': return `En pot triar ${w}.`;
    case 'tone': { const [f, r] = fr(q.s); return `${q.s}: ${f + 1} + ${r + 1} = ${f + r + 2}, que és ${(f + r) % 2 ? 'senar' : 'parell'}. És ${w}.`; }
    default: return `${q.ps.map(p => VALUE[p]).join(' + ')} = ${w}.`;
  }
}
// o is { t, qs, how, hue, secs, chip(st), onLast(st), onEnd(st) }. how 'pool' lets the child try again, with what went wrong said;
// 'exam' and 'rapid' give one try. st is { slips, hits, marks, missed }: marks is 'ok' or 'bad' per question. onLast is called the moment
// the last question is decided, so what was won is saved before any wait; onEnd when the board is over (with secs, when the time is).
function board(o) {
  const { t, qs, how } = o, once = how === 'exam' || how === 'rapid', host = $('#board'), st = { slips: 0, hits: 0, marks: [], missed: [] };
  let k = 0, q, help = 0, busy = false, over = false, openAt = 0, buf = '', lab = false;
  host.innerHTML = `${o.secs ? '<div class="fuse" role="img" aria-label="El temps que queda"><i id="fuse"></i></div>' : laneHtml(o.hue)}
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <div class="split" id="split"><div class="field" id="field"></div><div class="desk"><p class="ask" id="ask"></p><div id="ctl"></div></div><span class="combo" id="cb" hidden></span></div>`;
  const field = $('#field'), ctl = $('#ctl'), B = tauler(field);
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };

  // the figure of the question; lab shows the answer on it
  function drawField() {
    if (q.kind === 'val') { field.innerHTML = `<div class="lot">${q.ps.map(p => `<span>${ico(p)}<b>${lab ? VALUE[p] : '?'}</b></span>`).join('')}</div>`; return; }
    const pos = q.kind === 'name' ? { at: {}, rocks: [], stars: [q.want] } : parse(q.kind === 'count' ? q.t + q.s : q.pos || '');
    B.draw(pos, { plain: q.kind === 'tone' && !lab, sel: q.kind === 'step' || q.kind === 'mate' ? [q.from] : q.kind === 'tone' ? [q.s] : [] });
    if (lab && q.kind === 'count') B.mark('dot', reach(pos, q.s));
    else if (lab && !q.opts) B.mark('ok', [wantQ(q)]);
    else if (!q.opts) B.preview(buf);
  }
  function drawAsk() {
    const b = box(lab ? wantQ(q) : buf), e = $('#ask');
    e.classList.toggle('long', !!q.opts);
    e.innerHTML = q.kind === 'count' ? `Quantes caselles pot triar ${NAME[q.t]}?` : q.kind === 'tone' ? `De quin color és ${q.s}?` : q.kind === 'val' ? 'Quants punts valen?'
      : q.kind === 'hit' ? `${ico(q.t)} captura a ${b}` : q.kind === 'mate' ? `${ico(parse(q.pos).at[q.from])}<span>${q.from}</span> → ${b}` : `Casella ${b}`;
  }
  function drawCtl() {
    ctl.innerHTML = q.opts ? `<div class="choices" style="--c:${q.opts.length}">${q.opts.map(v => `<button class="key" data-pick="${v}">${cap(v)}</button>`).join('')}</div>` : KEYS;
    nextKey(buf, 2);
  }
  // gets the next question ready
  function arm() {
    q = qs[k]; buf = ''; help = 0; busy = false; lab = false; openAt = k && how !== 'rapid' ? performance.now() + SETTLE : 0;
    $('#lane')?.style.setProperty('--p', k / qs.length);
    drawField(); drawAsk(); drawCtl(); tip(how === 'rapid' ? '' : tipQ(q)); o.chip?.(st);
    if ($('#tip').getBoundingClientRect().top < 0) $('#tip').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  // the answer is shown on the figure and in the box
  function reveal() { lab = true; drawField(); drawAsk(); }

  async function submit(ans) {
    if (busy || over || !t.on || performance.now() < openAt) return;
    const ok = rightQ(q, ans), last = k === qs.length - 1;
    if (!ok && !once) {   // try again, with what went wrong said
      buzz(); shake($('#ask')); st.slips++; help++; streak = 0; drawCombo(); o.chip?.(st);
      tip('Ui! ' + (help > 1 ? explainQ(q) : hintQ(q)), 'oops'); buf = ''; if (!q.opts) { B.preview(''); nextKey(buf, 2); } drawAsk();
      return;
    }
    busy = true; st.marks[k] = ok ? 'ok' : 'bad';
    if (ok) { st.hits++; streak = help ? 0 : streak + 1; top = Math.max(top, streak); } else { st.missed.push(q); streak = 0; }
    if (last) o.onLast?.(st);
    drawCombo(); o.chip?.(st); reveal(); $('#lane')?.style.setProperty('--p', (k + 1) / qs.length);
    if (!ok) {   // one try only: show the right answer, and in an exam wait for the child to go on
      buzz(); shake($('#ask')); tip('No. ' + explainQ(q), 'oops');
      if (how === 'rapid') { await sleep(1600); if (t.on && !over) next(); return; }
      ctl.innerHTML = '<button class="btn" id="go">Segueix</button>'; $('#go').focus({ preventScroll: true });
      return;
    }
    ding(); if (how !== 'rapid') tip(streak && streak % 5 === 0 ? `${streak} seguides! ${pick(BRAVO)}` : pick(BRAVO), 'go');
    { const p = mid($('#ask')); FX.burst(p.x, p.y, 48, 18 + 3 * Math.min(streak, 8), 170); if (streak && streak % 5 === 0) FX.celebrate(3); }
    await sleep(how === 'rapid' ? 350 : 1100); if (t.on && !over) next();
  }
  async function next() {
    k++;
    if (k < qs.length) return arm();
    // the panel comes up where the last button was: wait until a second tap on that button has passed
    over = true; keyFn = null; ctl.innerHTML = ''; await sleep(SETTLE); if (t.on) o.onEnd(st);
  }

  keyFn = key => {
    if (over) return;
    if (busy) { if (key === 'ok') $('#go')?.click(); return; }
    if (q.opts) return;
    if (key === 'ok') { if (buf.length === 2) submit(buf); return; }
    const was = buf; buf = typed(buf, key, 2);
    if (buf === was) return;
    tone(key === 'del' ? 392 : key >= 'a' ? 587 : 698, 0, 0.08, 0.05);
    B.preview(buf); nextKey(buf, 2); drawAsk();
    // in a lightning round a whole square is handed in without ✓
    if (how === 'rapid' && buf.length === 2) submit(buf);
  };
  ctl.onclick = e => {
    if (e.target.closest('#go')) return next();
    if (busy || over) return;
    const key = e.target.closest('[data-k]'), opt = e.target.closest('[data-pick]');
    if (key) keyFn(key.dataset.k); else if (opt) submit(opt.dataset.pick);
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

/* ---------- the Piscina: three first questions, the first thing a profile with nothing saved meets ---------- */
// The third one saves piscina and opens the map. There is no «← Mapa» here: the map would have every circle shut, so the way
// out is the page of all games.
function piscina() {
  const t = fresh(); show('La Piscina', true, 205); $('#toS').hidden = true; $('#toG').hidden = !HUB;
  let got = [];
  $('#game').innerHTML = '<div class="hud mid"><span class="chip">Tres reptes per entrar al tauler</span></div><div id="board"></div>';
  board({ t, qs: POOL, how: 'pool', hue: 205,
    onLast: () => { const r = poolIn(prog); prog = r.prog; got = r.news; save(); },
    onEnd: () => {
      chime([523, 659, 784, 1047, 1319]); launch(); FX.celebrate(16);
      curtain(`<h2>Piscina acabada!</h2><p class="lead go">+50 XP · ja ets dins del cursus d'escacs</p>${news(got)}
        <p class="lead">Al mapa hi ha quatre cercles. Valida els projectes d'un cercle i supera'n l'examen per obrir el següent. Aquí les peces només es mouen escrivint la casella!</p><button class="btn" id="nx">Obre el mapa</button>`);
      $('#nx').onclick = () => mapa();
    } });
}

/* ---------- the exam of a circle: six new questions of its projects, one try each, no hints, saved by the sixth ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]);
  const qs = exam(c, Math.random);
  let r;
  $('#game').innerHTML = '<div class="hud"><span class="chip">Sis preguntes · un sol intent</span><span class="chip" id="st"></span></div><div id="board"></div>';
  board({ t, qs, how: 'exam', hue: RING[c], chip: st => { $('#st').textContent = `${st.hits} de ${qs.length}`; },
    onLast: st => { const got = run(), first = !prog.exams[c]; r = examIn(prog, c, qs, qs.map((_, i) => st.marks[i] === 'ok')); r.news = [...got, ...r.news]; r.first = r.good && first; prog = r.prog; save(); },
    onEnd: () => {
      r.good ? (chime([523, 659, 784, 1047, 1319]), launch(), FX.celebrate(16)) : tone(196, 0, 0.5, 0.12, 'triangle');
      curtain(`<h2>${r.good ? 'Examen superat!' : 'Encara no!'}</h2><p class="score">${r.score} de ${qs.length}</p>
        <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
        ${r.first ? `<p class="lead go">${c < CIRCLES.length - 1 ? `S'ha obert el cercle ${c + 1}: ${CIRCLES[c + 1].name}.` : "Has acabat el cursus d'escacs!"}</p>` : ''}
        ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
        <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
      $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
    } });
}

/* ---------- the lightning round: as many squares named as fit in a minute, one try each; only the record is kept ---------- */
function llampec() {
  const t = fresh(); show('Repte llampec', true, 48);
  $('#game').innerHTML = `<div class="intro"><h2>⚡ Repte llampec</h2><p class="lead">${RAPID} segons per posar nom a tantes caselles com puguis, un sol intent per a cada una. Escriu la lletra i el número i ja està: no cal prémer ✓.</p>
    ${prog.rapid ? `<p class="lead sun">El teu rècord: ${prog.rapid}</p>` : ''}<button class="btn" id="go">Comença!</button></div>`;
  $('#go').focus({ preventScroll: true });
  $('#go').onclick = () => {
    if (!t.on) return;
    $('#game').innerHTML = '<div class="hud"><span class="chip">Repte llampec</span><span class="chip" id="st"></span></div><div id="board"></div>';
    board({ t, qs: sprint(Math.random), how: 'rapid', secs: RAPID, chip: st => { $('#st').textContent = `${st.hits} ${st.hits === 1 ? 'encert' : 'encerts'}`; },
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
// What each kind of claim draws, what it says, how one of its values is written and what was true
const CLAIMS = {
  move: C => ({ pic: svgOf(parse(C.t + C.from), { ask: [C.says] }), txt: `${cap(NAME[C.t])} de ${C.from} pot anar a <b>${C.says}</b>`, val: v => v, truth: `${NAME[C.t]} de ${C.from} pot anar a ${C.real}` }),
  tone: C => ({ pic: '', txt: `La casella ${C.s} és <b>${C.says}</b>`, val: cap, truth: `${C.s} és ${C.real}` }),
  val: C => ({ pic: `<div class="lot">${C.ps.map(p => `<span>${ico(p)}</span>`).join('')}</div>`, txt: `${cap(list(C.ps.map(p => ONE[p])))} valen <b>${C.says}</b> punts`, val: v => `${v} punts`, truth: `${C.ps.map(p => VALUE[p]).join(' + ')} = ${C.real}` }),
  count: C => ({ pic: svgOf(parse(C.t + C.s)), txt: `Des de ${C.s}, amb el tauler buit, ${NAME[C.t]} pot triar entre <b>${C.says}</b> caselles`, val: v => v, truth: `des de ${C.s} ${NAME[C.t]} en pot triar ${C.real}` }),
  dist: C => ({ pic: '', txt: `Per anar de ${C.a} a ${C.b}, el rei necessita <b>${C.says}</b> passos`, val: v => `${v} passos`, truth: `de ${C.a} a ${C.b} el rei necessita ${C.real} passos, el més gran dels dos canvis (${C.x} i ${C.y})` })
};
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the value that makes it true,
// with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), marks = [];
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="Tres fulls">${'<i></i>'.repeat(cs.length)}</span></div>
    <div class="coach" id="coach"><span class="pilot">${ico('N')}</span><p class="status tip" id="tip" role="status" aria-live="polite"></p></div>
    <div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const stage = $('#stage'), tail = $('#tail'), dots = [...$('#dots').children];
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').textContent = txt; const c = $('#coach'); c.className = 'coach'; void c.offsetWidth; c.className = 'coach ' + cls; };
  let k = -1, C, D, busy, openAt = 0, res = null;
  function arm() {
    k++; C = cs[k]; D = CLAIMS[C.kind](C); busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<div class="paper">${D.pic}<p class="claim">${D.txt}</p></div>`;
    tail.innerHTML = '<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>';
    say('Mira-ho bé: és veritat, el que diu el full?');
  }
  async function answer(ok, txt) {
    const last = k === cs.length - 1;
    busy = true; marks[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, marks); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(txt, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { say(txt, 'oops'); buzz(); }
    await sleep(ok ? 1200 : 2600); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`el ${i + 1} (${CLAIMS[c.kind](c).truth})`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? chime([523, 659, 784, 1047, 1319]) : tone(196, 0, 0.5, 0.12, 'triangle');
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
    else if ('v' in b.dataset) { const ok = b.dataset.v === C.real; answer(ok, ok ? `Arreglat: ${D.truth}.` : `No era aquest: ${D.truth}.`); }
  };
  arm();
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
