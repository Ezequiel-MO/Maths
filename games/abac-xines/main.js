import { $, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, sectionMenu, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { rodVal, valueOf, tidy, write, plan, nextMove, SECTIONS, LEVELS } from './logic.js';
import { board, HUES, COL } from './board.js';
import { hints } from './hints.js';

const KEY = 'abac-xines';

// secs counts the levels done in each section
let prog = { so: true, secs: SECTIONS.map(() => 0) };
{
  const d = load(KEY);
  if (d) prog = { so: d.so !== false, secs: SECTIONS.map((_, i) => Math.min(10, Math.max(0, (Array.isArray(d.secs) ? d.secs[i] : 0) | 0))) };
}
const save = () => store(KEY, prog);

// every new screen cancels what the last one left running through this token, and lets go of the abacus it had
let tok = { on: true }, bd = null;
function fresh() { tok.on = false; tok = { on: true }; bd?.stop(); bd = null; return tok; }

// each bead clicks with a note of its own (board.js plays it through this tone)
const { tone, chime } = voice(() => prog.so, false);
const FX = pond(tone);
// the sky takes the colour of the section
const mood = sec => FX.mood([165, 205, 262, 318, 28, 120][sec] ?? 165);

/* ---------- screens ---------- */
// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /abac-xines\.html$/.test(location.pathname);
function show(level, kicker) {
  $('#app').classList.toggle('wide', level); $('#joc').classList.toggle('lvl', level);
  $('#toG').hidden = level || !HUB; $('#toM').hidden = !level; $('#kick').textContent = kicker;
}
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };
$('#toM').onclick = () => seccions();

function seccions() {
  fresh(); show(false, 'Tria una secció'); mood(0);
  const root = $('#joc'); root.onclick = null;
  sectionMenu(root, "Mou les boles de l'àbac per fer operacions, com es fa a la Xina des de fa segles. A cada secció aprendràs un truc nou.", SECTIONS, prog.secs, nivell);
}

/* ---------- one level: an operation and the abacus to solve it on ---------- */
const SIGN = { '+': '+', '-': '−', x: '×', ':': ':' };
const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Ben calculat!', 'Així es fa!'];
// what to say when a hint is one of the tricks rather than a plain move; d is the digit being added or taken
const WHY = {
  more: d => `Per sumar-ne ${d} aquí no hi ha prou boles de baix. Un truc: ${d} és 5 menys ${5 - d}. Treu-ne ${5 - d} de baix i després baixa la bola de dalt.`,
  less: d => `Per treure'n ${d} aquí no hi ha prou boles de baix. Un truc: ${d} és 5 menys ${5 - d}. Posa'n ${5 - d} de baix i després puja la bola de dalt.`,
  five: () => "Cinc boles de baix valen el mateix que una de dalt. Fes el canvi: baixa'n cinc i posa'n una de dalt.",
  ten: () => "Una columna plena val 10. Fes el canvi: buida-la i puja una bola de baix a la columna de l'esquerra.",
  carry: d => `Aquí no hi caben ${d} més. Un truc: ${d} és 10 menys ${10 - d}. Treu-ne ${10 - d} d'aquesta columna i després puja una bola de baix a la columna de l'esquerra.`,
  borrow: () => "A la dreta no n'hi ha prou per treure. Demana una bola a aquesta columna: val 10 de les de la seva dreta."
};

function nivell(sec, idx) {
  const t = fresh(); show(true, `Secció ${sec + 1} · ${SECTIONS[sec].name}`); mood(sec);
  const root = $('#joc'), lv = LEVELS[sec * 10 + idx], reading = lv.read != null;
  const pl = reading ? { start: lv.read, stages: [lv.read], goal: lv.read } : plan(lv.q);
  const n = Math.max(3, String(Math.max(pl.start, ...pl.stages)).length);
  const op = !reading && /\D/.test(lv.q);
  const ask = reading ? "Quin nombre marca l'àbac?" : op ? lv.q.replace(/\D/g, o => ` ${SIGN[o]} `) + ' = ' : `Escriu el <b>${lv.q}</b>`;
  // stage is how many of the values on the way have been reached. Hint state: how many were asked, the abacus as it stood
  // at the last one (asking again without moving gives the bead away), and what is glowing.
  let rods = write(pl.start, n), stage = 0, asks = 0, seen = '', mark = null, done = false, digits = !!lv.show;
  // three blocks: what is above the abacus, the stage (the box the board measures) and what is under it. The stylesheet puts them in one
  // column, or the head and the tail on the left and the stage on the right (a screen on its side)
  root.innerHTML = `<div class="head"><div class="hud"><span class="chip">Nivell ${idx + 1} · ${lv.name}</span></div>
    ${levelRow(SECTIONS[sec].levels, prog.secs[sec], idx)}
    <p class="status tip" id="tip" role="status" aria-live="polite"></p>
    <p class="task" id="task"></p></div>
    <div class="stage" id="stage"></div>
    <div class="tail">${reading ? `<div class="opts" id="opts">${lv.opts.map(v => `<button class="btn soft" data-v="${v}">${v}</button>`).join('')}<button class="btn soft" id="hintb">Dona'm una pista</button></div>`
      : `<div class="acts"><button class="btn" id="chk">Comprova</button><button class="btn soft" id="rst">Reinicia</button><button class="btn soft" id="hintb">Dona'm una pista</button></div>`}</div>`;
  // the abacus measures the box of the stage by itself (board.js); its state is the rods above
  bd = board($('#stage'), { n, feet: digits ? 'full' : 'letter', tone });
  const hn = hints(bd), ab = bd.el, beads = [...ab.querySelectorAll('.bead')], cols = [...ab.querySelectorAll('.rod')];
  wireLevels(root, i => nivell(sec, i));
  const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };
  const target = () => pl.stages[Math.min(stage, pl.stages.length - 1)];
  // the bead a move asks to touch: the far end of the group that has to travel
  const beadOf = m => { const cur = rods[m.p][m.deck], j = m.to > cur ? m.to - 1 : m.to; return bd.bead(m.p, m.deck, j); };

  function draw() {
    bd.set(rods); bd.lock(reading || done); bd.feet(digits ? 'full' : 'letter');
    for (const b of beads) b.classList.remove('next');
    cols.forEach(c => c.classList.toggle('glow', !!mark && mark.p === +c.dataset.p));
    if (mark && mark.m) { const b = beadOf(mark.m), up = (mark.m.deck === 'lo') === (mark.m.to > rods[mark.m.p][mark.m.deck]); b.classList.add('next'); b.dataset.a = up ? '▲' : '▼'; }
    $('#task').innerHTML = ask + (op ? `<b>${done ? pl.goal : '?'}</b>` : '');
  }

  function oops(txt) {
    ab.classList.remove('shake'); void ab.offsetWidth; ab.classList.add('shake'); tone(150, 0, 0.45, 0.16, 'triangle');
    tip(txt, 'oops');
  }
  async function win() {
    done = true; mark = null; hn.stop(); draw();
    if (idx + 1 > prog.secs[sec]) { prog.secs[sec] = idx + 1; save(); }
    const end = idx === 9, last = end && sec === SECTIONS.length - 1, lit = beads.filter(b => b.classList.contains('on'));
    tip(reading ? `Sí! L'àbac marca ${pl.goal}.` : `Correcte! L'àbac marca ${pl.goal}.`, 'go');
    lit.forEach((b, i) => { const p = mid(b), h = b.dataset.deck === 'hi' ? 44 : HUES[b.dataset.p]; b.style.setProperty('--d', i * 70); b.classList.add('wave'); FX.burst(p.x, p.y, h, 12, p.w * 2); });
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(end ? 16 : 8);
    await sleep(1100); if (!t.on) return;
    panel($('#stage'), `<h2>${last ? "Ets un mestre de l'àbac!" : end ? 'Secció superada!' : pick(HURRAY)}</h2>
      <p class="lead">${last ? 'Has sumat, restat, multiplicat i dividit movent boles, com els calculistes de fa mil anys.' : end ? `Has obert la secció ${sec + 2}: ${SECTIONS[sec + 1].name}.` : `Nivell ${idx + 1} superat.`}</p>
      <button class="btn" id="nx">${last ? 'Torna a les seccions' : end ? 'Secció següent' : 'Nivell següent'}</button>`);
    $('#nx').onclick = () => last ? seccions() : end ? nivell(sec + 1, 0) : nivell(sec, idx + 1);
  }
  function check() {
    const v = valueOf(rods);
    if (v === pl.goal && tidy(rods)) return win();
    if (v !== pl.goal) return oops(`Ara l'àbac marca ${v}, i encara no és el resultat. Si no saps com seguir, prem Pista.`);
    // the right number with a column left overfull: point at it
    const p = rods.findIndex(r => r.lo === 5);
    mark = { p }; draw();
    oops("El nombre és correcte, però l'àbac està desendreçat. " + (rods[p].hi ? "Una columna plena es canvia per una bola de baix de la columna de l'esquerra." : 'Cinc boles de baix es canvien per una de dalt.'));
  }
  // The first hint lights the column to work on and says what to think about. Asked again with the abacus untouched,
  // the bead to touch turns gold and the move is spelled out.
  function coach() {
    if (done) return;
    const hint = lv.hints[asks++ % lv.hints.length];
    if (reading) {
      // reading has no move to give away: the second hint writes what each column is worth under it
      if (asks > 1) { digits = true; mark = null; draw(); hn.strip(); return tip('Sota cada columna hi ha el que val. Ajunta les xifres d\'esquerra a dreta. ' + hint); }
      mark = { p: n - 1 - cols.findIndex(c => rodVal(rods[+c.dataset.p])) }; draw(); hn.strip();
      return tip('Comença per la columna que brilla. ' + hint);
    }
    const m = nextMove(rods, target());
    if (!m) return tip("L'àbac ja marca el resultat. Prem Comprova!", 'go');
    const now = JSON.stringify(rods), again = now === seen, k = Math.abs(m.to - rods[m.p][m.deck]);
    seen = now; mark = { p: m.p, m: again ? m : null }; draw(); hn.show(m, target());
    if (!again) return tip("Fixa't en la columna que brilla. " + (WHY[m.why] ? WHY[m.why](m.d) : hint));
    const up = (m.deck === 'lo') === (m.to > rods[m.p][m.deck]);
    tip(`${up ? 'Puja' : 'Baixa'} ${k} ${k > 1 ? 'boles' : 'bola'} ${m.deck === 'hi' ? 'de dalt' : 'de baix'} a la columna ${COL[m.p]}: toca la bola daurada.`);
  }

  bd.onMove((r, m) => {
    rods = r; mark = null; hn.stop();
    const k = pl.stages.lastIndexOf(valueOf(rods)); if (k >= stage) stage = k + 1;
    draw();
    if (rods[m.p][m.deck] > m.was) { const c = mid(m.bead); FX.burst(c.x, c.y, m.deck === 'hi' ? 44 : HUES[m.p], 7, c.w * 1.3); }
  });
  // a level of reading does not let the beads move (the board is locked): say why when one is touched
  ab.addEventListener('click', e => { if (reading && !done && e.target.closest('.bead')) tip("En aquest nivell les boles no es mouen. Llegeix el nombre i tria'l a sota."); });
  root.onclick = e => {
    const b = e.target.closest('button'); if (!b || done) return;
    if (b.id === 'chk') check();
    else if (b.id === 'hintb') coach();
    else if (b.id === 'rst') { rods = write(pl.start, n); stage = 0; mark = null; hn.stop(); draw(); tip(lv.tip); tone(330, 0, 0.12, 0.06); }
    else if ('v' in b.dataset) {
      if (+b.dataset.v === pl.goal) return win();
      b.disabled = true; oops('No és aquest. Compta només les boles que toquen la barra. Si no saps com seguir, prem Pista.');
    }
  };
  tip(lv.tip); draw();
}

soBtn();
seccions();
