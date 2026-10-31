// The guitar of the concert: its neck drawn in SVG, and the four kinds of level played on it (logic.js keeps their data). The neck lies as
// in a tab: the 1st string, the thinnest, on top and the 6th, the thickest, at the bottom, with the head on the left, so the frets come
// closer and closer to the right as on a real guitar. Every note keeps the colour of its tube, in every octave; a sharp is dark, with the
// colours of the two notes it lives between.
import { $, sleep } from '../../shared/util.js';
import { list } from '../../shared/shell.js';
import { PCS, noteAt, pcOf, isSharp, hz, huesOf, placesOf, drill } from './logic.js';

const SP = 44, TOP = 14, NUT = 92, RIGHT = 26;   // the gap between strings, the top margin and the nut
// the length of the board: shorter on a phone held upright, so the neck is drawn bigger and its strings are easier to press. A neck of
// twelve frets keeps its length and scrolls sideways instead (.gneck.long)
const boardLength = F => F <= 7 && matchMedia('(max-width: 560px)').matches ? 340 : 520;
const BOT = TOP + SP * 6, H = BOT + 34, ALLS = [1, 2, 3, 4, 5, 6];
const rowY = s => TOP + SP / 2 + (s - 1) * SP;
const GAUGE = { 1: 1.4, 2: 1.9, 3: 2.4, 4: 3, 5: 3.6, 6: 4.3 };
// the three thick strings are wound with bronze wire, the three thin ones are plain
const INK = s => s >= 4 ? '#D8B57C' : '#E6ECEF';
const CORDA = { 1: 'la primera corda', 2: 'la segona corda', 3: 'la tercera corda', 4: 'la quarta corda', 5: 'la cinquena corda', 6: 'la sisena corda' };
const cap = s => s[0].toUpperCase() + s.slice(1);
const nameAt = (s, f) => PCS[pcOf(noteAt(s, f))];
export const placeText = (s, f) => f === 0 ? `${CORDA[s]} a l'aire` : `el trast ${f} de ${CORDA[s]}`;
const aPlace = (s, f) => f === 0 ? `a ${CORDA[s]} a l'aire` : `al trast ${f} de ${CORDA[s]}`;
const al = g => g === 1 || g === 11 ? `a l'${g}` : `al ${g}`;
// how much of the string vibrates when it is pressed at a fret: the part from the finger to the bridge
const FR = { 0: 'Vibra tota la corda.', 5: 'Vibren 3/4 de la corda.', 7: 'Vibren uns 2/3 de la corda.', 12: 'Vibra la meitat de la corda.' };
const again = e => { e.classList.remove('shake', 'ok'); void e.getBoundingClientRect(); return e.classList; };

// A fret n is where the string keeps 2^(-n/12) of its length: the 12th is at the middle. The board goes a little past the last fret
function geom(F, BW) {
  const pos = n => 1 - 2 ** (-n / 12), S = BW / pos(F + 0.55), x = n => NUT + S * pos(n);
  // a finger presses just behind its fret; an open string is played on the head
  return { x, cx: f => f === 0 ? NUT - 26 : x(f) - (x(f) - x(f - 1)) * 0.42, W: NUT + BW + RIGHT, end: NUT + BW };
}
const fill = pc => { const [a, b] = huesOf(pc); return { a, b: b ?? a }; };
// a note on the neck: in colour with its name, or white (plain)
function dot(pc, label, plain) {
  const { a, b } = fill(pc);
  if (plain) return `<circle r="15" fill="#EAF8F4" stroke="#9EC3C0" stroke-width="2"/><text y="4.5">${label}</text>`;
  if (isSharp(pc)) return `<circle r="15" fill="#1E2438"/><path d="M0 -15A15 15 0 0 0 0 15" fill="none" stroke="hsl(${a} 85% 62%)" stroke-width="4"/><path d="M0 -15A15 15 0 0 1 0 15" fill="none" stroke="hsl(${b} 85% 62%)" stroke-width="4"/><text y="4.5" class="lt">${label}</text>`;
  return `<circle r="15" fill="hsl(${a} 85% 62%)" stroke="hsl(${a} 80% 30%)" stroke-width="2"/><text y="4.5">${label}</text>`;
}

// The neck in host, with frets 0 to F. Only the strings strs up to fret upto can be played; the rest is dimmed. names writes the note of
// each string, open, on the head. Returns what a level does with it: put and drop marks, sound a place, and onTap
function board(host, { frets: F, strs = ALLS, upto = F, names = true }, { pluck, FX }) {
  const BW = boardLength(F), G = geom(F, BW), on = (s, f) => strs.includes(s) && f <= upto;
  const cell = (s, f) => f === 0 ? [NUT - 50, NUT] : [G.x(f - 1), G.x(f)];
  const frets = Array.from({ length: F }, (_, i) => i + 1);
  const grain = Array.from({ length: 7 }, (_, i) => { const y = TOP + 18 + i * 37; return `<path d="M${NUT} ${y}Q${NUT + BW / 2} ${y + (i % 2 ? 9 : -7)} ${G.end} ${y + 3}" stroke="#000" stroke-opacity="0.16" stroke-width="2" fill="none"/>`; }).join('');
  const inlay = f => { const cx = (G.x(f - 1) + G.x(f)) / 2; return f === 12 ? `<circle cx="${cx}" cy="${TOP + SP * 2}" r="6"/><circle cx="${cx}" cy="${TOP + SP * 4}" r="6"/>` : `<circle cx="${cx}" cy="${TOP + SP * 3}" r="6.5"/>`; };
  const svg = `<svg viewBox="0 0 ${G.W} ${H}" role="img" aria-label="El mànec de la guitarra, amb ${F} trastos">
    <defs><linearGradient id="g-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4E2E19"/><stop offset="0.55" stop-color="#3A2113"/><stop offset="1" stop-color="#29160B"/></linearGradient>
      <linearGradient id="g-fret" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7D8992"/><stop offset="0.5" stop-color="#F4F8FA"/><stop offset="1" stop-color="#7D8992"/></linearGradient></defs>
    <rect x="2" y="${TOP - 8}" width="${NUT + 4}" height="${BOT - TOP + 16}" rx="20" fill="#6B4424"/><rect x="2" y="${TOP - 8}" width="${NUT + 4}" height="${BOT - TOP + 16}" rx="20" fill="none" stroke="#2B170C" stroke-width="2"/>
    <rect x="${NUT}" y="${TOP}" width="${BW}" height="${BOT - TOP}" fill="url(#g-wood)"/>${grain}
    <path d="M${NUT} ${TOP}H${G.end}M${NUT} ${BOT}H${G.end}" stroke="#E9D9B8" stroke-width="2.5"/>
    <g fill="#EFE6D6" opacity="0.85">${frets.filter(f => [3, 5, 7, 9, 12].includes(f)).map(inlay).join('')}</g>
    ${frets.map(f => `<rect x="${G.x(f) - 2.2}" y="${TOP - 1}" width="4.4" height="${BOT - TOP + 2}" rx="1.5" fill="url(#g-fret)"/>`).join('')}
    <rect x="${NUT - 5}" y="${TOP - 3}" width="9" height="${BOT - TOP + 6}" rx="2" fill="#EDE3C8" stroke="#B9AA86"/>
    ${ALLS.map(s => `<path d="M6 ${rowY(s) + 2}H${G.W}" stroke="#000" stroke-opacity="0.35" stroke-width="${GAUGE[s]}"/><path d="M6 ${rowY(s)}H${G.W}" stroke="${INK(s)}" stroke-width="${GAUGE[s]}"/>${s >= 4 ? `<path d="M6 ${rowY(s)}H${G.W}" stroke="#7A5A2E" stroke-width="${GAUGE[s]}" stroke-dasharray="1.2 1.8" opacity="0.7"/>` : ''}`).join('')}
    ${names ? ALLS.map(s => { const { a } = fill(pcOf(noteAt(s, 0))); return `<g transform="translate(20 ${rowY(s)})"><rect x="-17" y="-11" width="34" height="22" rx="11" fill="hsl(${a} 85% 62%)" stroke="hsl(${a} 80% 30%)" stroke-width="1.5"/><text y="4">${nameAt(s, 0)}</text></g>`; }).join('') : ''}
    ${ALLS.map(s => `<text class="num" x="${G.W - 11}" y="${rowY(s) - 6}">${s}</text>`).join('')}
    <g fill="#04131C" opacity="0.6">${ALLS.flatMap(s => [0, ...frets].filter(f => !on(s, f)).map(f => { const [a, b] = cell(s, f); return `<rect x="${a}" y="${rowY(s) - SP / 2}" width="${b - a}" height="${SP}"/>`; })).join('')}</g>
    ${frets.map(f => `<text class="fn${[3, 5, 7, 9, 12].includes(f) ? ' mk' : ''}" x="${(G.x(f - 1) + G.x(f)) / 2}" y="${BOT + 24}">${f}</text>`).join('')}
    <g class="gbuzz"></g><g class="gdots"></g>
    <g>${ALLS.flatMap(s => [0, ...frets].filter(f => on(s, f)).map(f => { const [a, b] = cell(s, f); return `<rect class="gcell" data-s="${s}" data-f="${f}" x="${a}" y="${rowY(s) - SP / 2}" width="${b - a}" height="${SP}"/>`; })).join('')}</g></svg>`;
  host.insertAdjacentHTML('beforeend', `<div class="gneck${F > 7 ? ' long' : ''}">${svg}</div>`);
  const wrap = host.lastElementChild, el = wrap.firstElementChild, dots = $('.gdots', el), buzzes = $('.gbuzz', el), marks = new Map();
  // the mark of a kind at a place: 'note' (its name), 'plain' (its name in white), 'ghost' (another place of the same note), 'bad' (a wrong one),
  // 'ask' (a note to name), 'next' (where to press), 'hint' and 'map' (the chart of every note, under all the rest). A place holds one mark
  // of each kind; cls adds a class to it
  function put(s, f, kind = 'note', cls = '') {
    const key = `${kind}@${s}:${f}`, pc = pcOf(noteAt(s, f));
    marks.get(key)?.remove();
    const body = kind === 'ask' ? '<circle r="15" fill="#fff"/><text y="5" class="q">?</text>'
      : kind === 'next' ? '<circle r="15" fill="rgb(255 255 255 / 0.14)" stroke="#fff" stroke-width="2.5" stroke-dasharray="5 4"/>'
      : kind === 'hint' ? '<circle r="19" fill="none" stroke="#F7C64E" stroke-width="3.5"/>'
      : dot(pc, PCS[pc], kind === 'plain');
    const under = kind === 'map';
    dots.insertAdjacentHTML(under ? 'afterbegin' : 'beforeend', `<g transform="translate(${G.cx(f)} ${rowY(s)})"><g class="gdot ${kind}${cls ? ' ' + cls : ''}">${body}</g></g>`);
    const m = under ? dots.firstElementChild : dots.lastElementChild; marks.set(key, m);
    // a neck that scrolls sideways brings into view the place to press or to name
    if ((kind === 'next' || kind === 'hint' || kind === 'ask') && wrap.scrollWidth > wrap.clientWidth) {
      const r = m.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      if (r.left < w.left + 24 || r.right > w.right - 24) wrap.scrollBy({ left: r.left + r.width / 2 - (w.left + w.width / 2), behavior: 'smooth' });
    }
    return m.firstElementChild;
  }
  const drop = kind => { for (const [k, m] of marks) if (!kind || k.startsWith(kind + '@')) { m.remove(); marks.delete(k); } };
  const unput = (s, f, kind) => { const key = `${kind}@${s}:${f}`; marks.get(key)?.remove(); marks.delete(key); };
  // the map of the notes: every note of the strings and frets that can be played, written on the neck as a chart. It stays when a level
  // clears its marks for the next question; a place that already has its note on the map keeps it
  const map = faint => { for (const s of strs) for (let f = 0; f <= upto; f++) if (!marks.has(`map@${s}:${f}`)) put(s, f, 'map', faint ? 'faint' : ''); };
  // a note that shows for a moment where it was played, unless a mark of its own is already there
  function flash(s, f, kind = 'note') {
    if (marks.has(`note@${s}:${f}`)) return;
    const key = `${kind}@${s}:${f}`, e = put(s, f, kind), m = marks.get(key);
    setTimeout(() => { if (marks.get(key) === m) { m.remove(); marks.delete(key); } }, 750);
    return e;
  }
  // where a place is on the screen, for the rings and sparks
  function point(s, f) {
    const m = el.getScreenCTM(); if (!m) return null;
    const p = el.createSVGPoint(); p.x = G.cx(f); p.y = rowY(s);
    return p.matrixTransform(m);
  }
  // a place played: the note sounds, the string shakes from the finger to the bridge, and a ring of its colour goes out. at plays it later
  function sound(s, f, at = 0) {
    const m = noteAt(s, f), h = fill(pcOf(m)).a;
    pluck(hz(m), 1.6, 0.42, at);
    const go = () => {
      if (!el.isConnected) return;
      buzzes.querySelector(`[data-s="${s}"]`)?.remove();
      const x0 = f === 0 ? NUT : G.x(f), x1 = G.W;
      buzzes.insertAdjacentHTML('beforeend', `<ellipse data-s="${s}" class="gvib" cx="${(x0 + x1) / 2}" cy="${rowY(s)}" rx="${(x1 - x0) / 2}" ry="${3 + GAUGE[s]}" fill="none" stroke="${INK(s)}" stroke-width="${GAUGE[s] * 0.8}"/>`);
      const v = buzzes.lastElementChild; setTimeout(() => v.remove(), 1300);
      const p = point(s, f); if (p) FX.ring(p.x, p.y, h, 6, 40, 0.5);
    };
    at > 0.01 ? setTimeout(go, at * 1000) : go();
  }
  const onTap = fn => { el.onclick = e => { const c = e.target.closest('.gcell'); if (c) fn(+c.dataset.s, +c.dataset.f); }; };
  const clear = () => { for (const [k, m] of marks) if (!k.startsWith('map@')) { m.remove(); marks.delete(k); } };
  return { wrap, put, unput, drop, map, flash, sound, onTap, clear };
}

// the keyboard of colours: the seven notes in a row, and, with sharps, each sharp over the gap between the two notes it lives between.
// Mi and Fa, and Si and Do, have no gap: there is no sharp between them
const NAT = [0, 2, 4, 5, 7, 9, 11];
function keyboard(sharps) {
  const col = pc => isSharp(pc) ? 2 * NAT.indexOf(pc - 1) + 2 : 2 * NAT.indexOf(pc) + 1;
  const all = sharps ? [...NAT, 1, 3, 6, 8, 10] : NAT;
  return `<div class="gkeys${sharps ? ' sh' : ''}">${all.map(pc => { const { a, b } = fill(pc); return `<button class="gkey${isSharp(pc) ? ' blk' : ''}" data-pc="${pc}" style="grid-column:${col(pc)} / span 2;--a:${a};--b:${b}">${PCS[pc]}</button>`; }).join('')}</div>`;
}
// the name of a note in colour, as a word of the frog's goal
const pill = pc => { const { a, b } = fill(pc); return `<span class="gn${isSharp(pc) ? ' sh' : ''}" style="--a:${a};--b:${b}">${PCS[pc]}</span>`; };

// how to find the name of a place. Without the sharps: the notes of that string from the open one; with them, fret by fret from the
// open string, or down from the 12th fret, where the open note comes back an octave higher
function clue(s, f, sharps) {
  if (f === 0) return `És ${CORDA[s]} a l'aire. De baix a dalt, les cordes són Mi, La, Re, Sol, Si i Mi.`;
  if (!sharps) {
    const chain = Array.from({ length: f + 1 }, (_, g) => g).filter(g => !isSharp(pcOf(noteAt(s, g))));
    return `A ${CORDA[s]}: ${list(chain.map(g => `${nameAt(s, g)} ${g ? `al trast ${g}` : "a l'aire"}`))}.`;
  }
  if (f <= 6) return `A ${CORDA[s]}, trast a trast: ${list(Array.from({ length: f + 1 }, (_, g) => `${nameAt(s, g)} ${g ? al(g) : "a l'aire"}`))}.`;
  return `Al trast 12 torna a sonar el ${nameAt(s, 0)}, com ${CORDA[s]} a l'aire. Baixant: ${list(Array.from({ length: 13 - f }, (_, j) => 12 - j).map(g => `${nameAt(s, g)} ${al(g)}`))}.`;
}

// The kinds, made with what they need of the page: pluck sounds a string and FX draws the rings
export function guitar(deps) {
  const neck = (host, o) => board(host, o, deps);

  /* walk: press the places one after the other; each one sounds and shows its note. A tap somewhere else only sounds */
  function walk({ t, L, stage, tip, spark, win }) {
    stage.innerHTML = '<p class="goal" id="goal"></p>';
    const B = neck(stage, { frets: L.frets, strs: L.strs, names: L.names !== false }), heard = [];
    if (L.map) B.map(L.map === 'faint');
    if (L.bar) stage.insertAdjacentHTML('beforeend', '<div class="glen" aria-hidden="true"><i id="glen"></i></div><p class="cap" id="gfr">Mira quin tros de corda vibra.</p>');
    let k = 0, busy = false;
    const next = () => {
      B.drop('next'); B.put(...L.path[k], 'next');
      $('#goal').innerHTML = `Toca el cercle que fa pampallugues <span class="cap">· ${k + 1} de ${L.path.length}</span>`;
    };
    B.onTap(async (s, f) => {
      if (busy || !t.on) return;
      B.sound(s, f);
      const [ws, wf] = L.path[k], m = noteAt(s, f), name = nameAt(s, f);
      if (s !== ws || f !== wf) { B.flash(s, f); return tip(`Aquí hi ha el ${name}. Ara toca el cercle que fa pampallugues.`); }
      const same = heard.at(-1) === m ? ' Sona igual que l\'anterior!' : heard.includes(m - 12) ? ` El mateix ${name} d'abans, una octava més agut!` : '';
      heard.push(m); spark(B.put(s, f, 'note'), fill(pcOf(m)).a);
      if (L.bar) { const e = $('#glen'); e.style.width = `${2 ** (-f / 12) * 100}%`; e.style.setProperty('--h', fill(pcOf(m)).a); $('#gfr').textContent = FR[f] || 'Vibra un tros més curt de la corda.'; }
      tip(`${cap(placeText(s, f))}: ${name}.${same}`);
      if (++k < L.path.length) return next();
      busy = true; B.drop('next'); $('#goal').textContent = 'Fet!';
      await sleep(1100); if (!t.on) return;
      tip(L.done, 'go');
      await sleep(1400); if (!t.on) return;
      win(L.path.map(p => nameAt(...p)).join(' · '));
    });
    next(); tip(L.say);
    return () => '';
  }

  /* fret: a note's name, to find on the strings. Once found, its other places show too; with all, every place has to be found */
  function fret({ t, L, stage, tip, slip, spark, win }) {
    const seq = drill(L.set, L.n, Math.random);
    stage.innerHTML = '<p class="goal" id="goal"></p>';
    const B = neck(stage, { frets: L.frets, strs: L.strs, upto: L.upto, names: L.names !== false });
    if (L.map) B.map(L.map === 'faint');
    stage.insertAdjacentHTML('beforeend', '<p class="cap" id="cnt"></p>');
    let k = 0, busy = false, found = new Set(), all = [];
    const count = () => { $('#cnt').textContent = `Nota ${k + 1} de ${seq.length}${L.all ? ` · en falten ${all.length - found.size}` : ''}`; };
    function ask() {
      busy = false; found = new Set(); all = placesOf(seq[k], L.strs, L.upto); B.clear();
      $('#goal').innerHTML = `${L.all ? 'Troba tots els' : 'Toca el'} ${pill(seq[k])}`; count();
    }
    B.onTap(async (s, f) => {
      if (busy || !t.on) return;
      B.sound(s, f);
      const pc = pcOf(noteAt(s, f)), w = seq[k], N = PCS[w];
      if (pc !== w) { slip(); B.flash(s, f, 'bad'); const p = all.find(([a, b]) => !found.has(a + ':' + b)); return tip(`Ui! Aquí hi ha el ${PCS[pc]}. El ${N} és ${aPlace(...p)}.`, 'oops'); }
      if (L.all) {
        if (found.has(s + ':' + f)) return;
        found.add(s + ':' + f); spark(B.put(s, f, 'note'), fill(w).a); count();
        if (found.size < all.length) return tip(`Sí! Aquí hi ha un ${N}. En falten ${all.length - found.size}.`, 'go');
      } else spark(B.put(s, f, 'note'), fill(w).a);
      busy = true;
      const others = L.all ? [] : all.filter(([a, b]) => a !== s || b !== f);
      others.forEach(p => B.put(...p, 'ghost'));
      tip(L.all ? `Tots ${all.length}! El ${N} viu a ${all.length} llocs fins al trast ${L.upto}.` : `Sí! És el ${N}.${others.length ? ` També és ${list(others.map(p => aPlace(...p)))}: mira'l.` : ''}`, 'go');
      await sleep(L.all || others.length ? 2200 : 1000); if (!t.on) return;
      if (++k < seq.length) return ask();
      win(`${seq.length} notes trobades al mànec`);
    });
    ask(); tip(L.say);
    return () => { if (busy) return ''; const p = all.find(([a, b]) => !found.has(a + ':' + b)); B.put(...p, 'hint'); return `El ${PCS[seq[k]]} és ${aPlace(...p)}. El seu lloc fa pampallugues.`; };
  }

  /* which: a place lights up and sounds; its name is chosen on the keyboard of colours */
  function which({ t, L, stage, tip, slip, spark, win }) {
    const seq = drill(L.from.map((_, i) => i), L.n, Math.random);
    stage.innerHTML = '<p class="goal">Quina nota és? <span class="cap" id="cnt"></span></p>';
    const B = neck(stage, { frets: L.frets, strs: L.strs, names: L.names !== false });
    stage.insertAdjacentHTML('beforeend', `${keyboard(L.sharps)}<button class="link" id="hear">Torna-la a sentir</button>`);
    const pad = stage.querySelector('.gkeys');
    let k = 0, busy = false;
    const cur = () => L.from[seq[k]];
    function ask() {
      busy = false; B.clear(); pad.querySelectorAll('.gkey').forEach(e => e.classList.remove('hint', 'ok', 'shake'));
      // on a map, the note asked is the one missing from it: its neighbours say what it is
      if (L.map) { B.map(L.map === 'faint'); B.unput(...cur(), 'map'); }
      B.put(...cur(), 'ask'); B.sound(...cur()); $('#cnt').textContent = `· ${k + 1} de ${seq.length}`;
    }
    B.onTap((s, f) => { const [a, b] = cur(); if (!busy && t.on && s === a && f === b) B.sound(s, f); });
    $('#hear').onclick = () => { if (t.on) B.sound(...cur()); };
    pad.onclick = async e => {
      const b = e.target.closest('.gkey'); if (!b || busy || !t.on) return;
      const pc = +b.dataset.pc, [s, f] = cur(), m = noteAt(s, f), w = pcOf(m);
      deps.pluck(hz(m - w + pc), 1, 0.36);
      if (pc !== w) { slip(); again(b).add('shake'); return tip(`Ui! Aquest és el ${PCS[pc]}. ${clue(s, f, L.sharps)}`, 'oops'); }
      busy = true; b.classList.add('ok'); B.drop('ask'); spark(B.put(s, f, 'note'), fill(w).a);
      tip(`Sí! ${cap(placeText(s, f))} és un ${PCS[w]}.`, 'go');
      await sleep(1200); if (!t.on) return;
      if (++k < seq.length) return ask();
      win(`${seq.length} notes llegides al mànec`);
    };
    ask(); tip(L.say);
    return () => { if (busy) return ''; const [s, f] = cur(); pad.querySelector(`[data-pc="${pcOf(noteAt(s, f))}"]`).classList.add('hint'); return `${clue(s, f, L.sharps)} La seva tecla fa pampallugues.`; };
  }

  /* riff: a tune on the strings, note after note. Any place that sounds the very note is good, in any string of the tune */
  function riff({ t, L, stage, tip, slip, spark, win, exam }) {
    const tune = L.tune;
    stage.innerHTML = `<div class="gtune${L.help ? '' : ' plain'}" id="gtune">${tune.map(([s, f], i) => `${L.cuts.includes(i) ? '<i class="gcut"></i>' : ''}${pill(pcOf(noteAt(s, f)))}`).join('')}</div>`;
    const B = neck(stage, { frets: L.frets, strs: L.strs, upto: L.frets });
    if (L.map) B.map(L.map === 'faint');
    if (!exam) stage.insertAdjacentHTML('beforeend', '<button class="link" id="hear">Escolta la cançó</button>');
    const notes = [...stage.querySelectorAll('#gtune .gn')];
    let k = 0, busy = false, playing = false;
    const mark = () => {
      notes.forEach((e, i) => { e.classList.toggle('cur', i === k); e.classList.toggle('done', i < k); });
      B.drop('next'); if (L.help === 2 && k < tune.length) B.put(...tune[k], 'next');
    };
    B.onTap(async (s, f) => {
      if (busy || playing || !t.on) return;
      B.sound(s, f);
      const m = noteAt(s, f), w = noteAt(...tune[k]);
      if (m !== w) {
        slip(); B.flash(s, f, 'bad'); again(notes[k]).add('shake');
        return tip(pcOf(m) === pcOf(w) ? `Ui! És un ${PCS[pcOf(m)]}, però massa ${m < w ? 'greu' : 'agut'}. Busca'l en una altra corda.` : `Ui! Aquí hi ha el ${PCS[pcOf(m)]}, i ara toca el ${PCS[pcOf(w)]}.`, 'oops');
      }
      B.drop('hint'); B.flash(s, f, L.help ? 'note' : 'plain');
      if (++k < tune.length) return mark();
      busy = true; mark(); spark($('#gtune'), 30); tip('Cançó tocada de cap a peus!', 'go');
      await sleep(900); if (!t.on) return;
      win(`${L.title}<br><small>${tune.length} notes</small>`);
    });
    // the whole tune, at an even pace, the notes lighting up one after the other; nothing can be played meanwhile
    if (!exam) $('#hear').onclick = async () => {
      if (playing || busy || !t.on) return;
      playing = true; $('#hear').disabled = true; B.drop('next');
      for (let i = 0; i < tune.length; i++) {
        if (!t.on) return;
        B.sound(...tune[i]); B.flash(...tune[i], L.help ? 'note' : 'plain');
        notes.forEach((e, j) => e.classList.toggle('cur', j === i));
        await sleep(i < tune.length - 1 ? 430 : 900);
      }
      if (!t.on) return;
      playing = false; $('#hear').disabled = false; mark();
    };
    mark(); tip(L.say);
    return () => { if (busy || playing) return ''; B.put(...tune[k], 'hint'); return `El ${nameAt(...tune[k])} és ${aPlace(...tune[k])}. El seu lloc fa pampallugues.`; };
  }

  /* ladder: the keys of the keyboard of colours one after the other, while a staircase grows over it, each step as high as the half
     steps it climbs. A tap on another key only sounds. At the end the steps between two pure notes side by side (Mi-Fa, Si-Do) light up */
  function ladder({ t, L, stage, tip, spark, win }) {
    const steps = L.steps, nameOf = u => u === 12 ? 'Do agut' : PCS[u % 12];
    stage.innerHTML = `<p class="goal" id="goal"></p>
      <div class="gstairs" aria-hidden="true">${steps.map(u => { const { a, b } = fill(u % 12); return `<span class="gstep${isSharp(u % 12) ? ' sh' : ''}" style="--u:${u};--a:${a};--b:${b}">${PCS[u % 12]}</span>`; }).join('')}</div>
      ${keyboard(L.sharps)}`;
    const cols = [...stage.querySelectorAll('.gstep')], pad = stage.querySelector('.gkeys');
    let k = 0, busy = false;
    const next = () => {
      pad.querySelectorAll('.gkey').forEach(e => e.classList.toggle('hint', +e.dataset.pc === steps[k] % 12));
      cols.forEach((c, i) => c.classList.toggle('next', i === k));
      $('#goal').innerHTML = `Toca la tecla que fa pampallugues <span class="cap">· ${k + 1} de ${steps.length}</span>`;
    };
    pad.onclick = async e => {
      const b = e.target.closest('.gkey'); if (!b || busy || !t.on) return;
      const pc = +b.dataset.pc, u = steps[k];
      if (pc !== u % 12) { deps.pluck(hz(60 + pc), 1, 0.36); return tip(`Aquesta tecla és el ${PCS[pc]}. Ara toca la que fa pampallugues.`); }
      deps.pluck(hz(60 + u), 1.2, 0.4);
      cols[k].classList.add('on'); cols[k].classList.remove('next'); spark(cols[k], fill(u % 12).a);
      const small = k > 0 && u - steps[k - 1] === 1 && !isSharp(u % 12) && !isSharp(steps[k - 1] % 12);
      tip(k === 0 ? `${nameOf(u)}: el primer graó.` : small ? `${nameOf(u)}: un graó petit! Entre el ${PCS[steps[k - 1] % 12]} i el ${PCS[u % 12]} no hi ha cap sostingut.` : `${nameOf(u)}.`);
      if (++k < steps.length) return next();
      busy = true; next(); $('#goal').textContent = 'Fet!';
      cols.forEach((c, i) => c.classList.toggle('half', i > 0 && steps[i] - steps[i - 1] === 1 && !isSharp(steps[i] % 12) && !isSharp(steps[i - 1] % 12)));
      await sleep(900); if (!t.on) return;
      tip(L.done, 'go');
      // the whole staircase once more, up, a note to each step
      steps.forEach((u, i) => deps.pluck(hz(60 + u), 0.5, 0.32, i * 0.28));
      await sleep(steps.length * 280 + 1200); if (!t.on) return;
      win(steps.map(u => PCS[u % 12]).join(' · '));
    };
    next(); tip(L.say);
    return () => '';
  }

  return { walk, fret, which, riff, ladder };
}
