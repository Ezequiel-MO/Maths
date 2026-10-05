import { $, sleep, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, clean, xpOf, levelText, isOpen, examOpen, BADGES, badges, TEAMS, VALID } from './logic.js';
import { fireflies } from './material.js';

const KEY = 'cursus-de-l-estany';

// Facts only: { so, piscina, equip, notes, exams, fulls }. clean() makes a complete progress inside its limits out of anything the browser
// holds (not JSON, a string, notes that are not a list ...). XP, level and badges are worked out when painted, never kept.
let prog = clean(load(KEY));
function save() { const { so, piscina, equip, notes, exams, fulls } = prog; store(KEY, { so, piscina, equip, notes, exams, fulls }); paintXp(); }

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

const { tone, chime } = voice(() => prog.so);
const FX = pond(tone);

const SETTLE = 450;   // after a screen comes up, touches on what advances are ignored for this long: a second tap must not press what is under the first
let openAt = 0, keyFn = null;
const ready = () => performance.now() >= openAt;
const hsl = (h, l = 62) => `hsl(${h} 75% ${l}%)`;

/* ---------- the shell: every screen starts with enter() and gets its token back ---------- */
// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /cursus-de-l-estany\.html$/.test(location.pathname);
// inner screens show ← Mapa instead of ← Tots els jocs; the pond drifts to the colour of the team once there is one
function enter(kicker, inner) {
  const t = fresh(); keyFn = null; openAt = performance.now() + SETTLE;
  $('#app').classList.toggle('wide', inner); $('#toG').hidden = inner || !HUB; $('#toM').hidden = !inner; $('#kick').textContent = kicker;
  $('#game').onclick = null; FX.mood(TEAMS[prog.equip]?.hue ?? 165); paintXp();
  return t;
}
$('#toM').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };
// The keys on the screen and a real keyboard both end up in keyFn (set by a screen that types: Task 6). Enter on a button that is not a key is left alone.
addEventListener('keydown', e => {
  if (!keyFn || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter' && e.target.closest?.('button:not([data-k]), a')) return;
  const k = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null;
  if (k) { e.preventDefault(); keyFn(k); }
});

// one emblem per team, drawn in the colour of the team (currentColor)
const EMBLEM = [
  '<ellipse cx="-9" cy="-6" rx="9" ry="4" transform="rotate(-20 -9 -6)" opacity=".7"/><ellipse cx="9" cy="-6" rx="9" ry="4" transform="rotate(20 9 -6)" opacity=".7"/><ellipse cx="-8" cy="3" rx="8" ry="3.5" transform="rotate(15 -8 3)" opacity=".7"/><ellipse cx="8" cy="3" rx="8" ry="3.5" transform="rotate(-15 8 3)" opacity=".7"/><rect x="-2" y="-12" width="4" height="30" rx="2"/><circle cy="-13" r="4"/>',
  '<path d="M-1 -12C8 -12 8 -2 2 2C-4 6 -2 12 6 17" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M-3 -4L-13 -8M5 -4L14 -8M-2 6L-11 10M3 6L12 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="-1" cy="-13" r="6"/><circle cx="-4" cy="-15" r="1.4" fill="#04131C"/><circle cx="2" cy="-15" r="1.4" fill="#04131C"/>',
  '<ellipse cx="-7" cy="-5" rx="8" ry="3.5" transform="rotate(-30 -7 -5)" opacity=".6"/><ellipse cx="7" cy="-5" rx="8" ry="3.5" transform="rotate(30 7 -5)" opacity=".6"/><ellipse cy="-2" rx="5" ry="8"/><circle cy="-11" r="3.6"/><circle cy="10" r="6" fill="#FFF3C4"/>'
];
const emblem = i => `<svg viewBox="-20 -20 40 40" aria-hidden="true">${EMBLEM[i]}</svg>`;

// The bar at the top of every screen, built once and then updated (so the fill slides): "Nivell 2,37", the fill is the decimals, the team's emblem.
function paintXp() {
  const box = $('#xp'), lv = levelText(xpOf(prog)), pct = +lv.split(',')[1], team = TEAMS[prog.equip];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span><span class="xp-team" role="img" hidden></span>';
  const [n, bar, em] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
  em.hidden = !team; if (team) { em.innerHTML = emblem(prog.equip); em.setAttribute('aria-label', `Equip ${team.name}`); }
  box.style.setProperty('--tc', team ? hsl(team.hue) : 'var(--sun)');
}
const tip = (txt, cls) => { const e = $('#tip'); e.className = 'status tip' + (cls ? ' ' + cls : ''); e.textContent = txt; };

/* ---------- the Piscina: three sharings with no numbers, then the team ---------- */
const POOL = [{ D: 6, d: 2 }, { D: 12, d: 3 }, { D: 15, d: 5 }];
function piscina() {
  const t = enter('La Piscina', true);
  $('#game').innerHTML = `<div class="hud"><span class="steps" role="img" aria-label="Tres reptes">${POOL.map(() => '<i></i>').join('')}</span></div>
    <p class="status tip" id="tip" role="status" aria-live="polite"></p><div class="stage pool" id="stage"></div>`;
  const stage = $('#stage'), dots = [...document.querySelectorAll('.steps i')];
  function step(k) {
    tip('Toca un nenúfar: hi vola una cuca. Que a tots els nenúfars els en toquin les mateixes.');
    fireflies(stage, POOL[k], { t,
      onMiss: () => { tone(150, 0, 0.45, 0.16, 'triangle'); tip('Oh! No tots en tenen les mateixes. Les cuques tornen: prova-ho una altra vegada.', 'oops'); },
      onDone: async () => {
        dots[k].classList.add('ok'); tip('Sí! Tots els nenúfars en tenen les mateixes.', 'go'); tone(784, 0, 0.14, 0.08); tone(1047, 0.1, 0.2, 0.08);
        const p = mid(stage); FX.burst(p.x, p.y, 48, 30, 190); FX.ring(p.x, p.y, 48, 10, 90);
        await sleep(1100); if (!t.on) return;
        k < POOL.length - 1 ? step(k + 1) : team(t, stage);
      } });
  }
  step(0);
}
// The panel is built once the last tap has long passed, so a second tap on the last pad cannot choose a team. Choosing ends the Piscina: it is saved
// there and then, and only the walk to the map waits.
async function team(t, stage) {
  stage.innerHTML = ''; tip('Quin equip vols ser?'); await sleep(SETTLE); if (!t.on) return;
  chime([523, 659, 784]);
  panel(stage, `<h2>Tria el teu equip</h2><p class="lead">Aniràs amb ells durant tot el cursus.</p><div class="teams">${TEAMS.map((m, i) =>
    `<button class="team" data-t="${i}" style="--tc:${hsl(m.hue)}"><span>${emblem(i)}</span><b>${m.name}</b></button>`).join('')}</div>`);
  let chosen = false;
  stage.onclick = async e => {
    const b = e.target.closest('.team'); if (!b || chosen) return;
    chosen = true; prog.piscina = true; prog.equip = +b.dataset.t; save(); FX.mood(TEAMS[prog.equip].hue);
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(8); tip(`Ja ets de l'equip dels ${TEAMS[prog.equip].name}!`, 'go');
    await sleep(1400); if (t.on) mapa();
  };
}

/* ---------- the map ---------- */
// three circles of concentric rings, drawn with the rings up to this one filled
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true">${[14, 9, 4].map((r, i) => `<circle r="${r}" fill="none" stroke="hsl(${[140, 195, 262][c]} 60% 60%)" stroke-width="2.4" opacity="${2 - i <= c ? 1 : 0.25}"/>`).join('')}</svg>`;
const mark = n => n >= VALID ? `Nota ${n} · validat ✓` : n ? `Nota ${n} · no validat` : 'Per fer';
function mapa() {
  enter('El mapa', false); const got = badges(prog);
  const ring = (c) => {
    const open = isOpen(prog, c), exam = examOpen(prog, c), todo = CIRCLES[c].projects.filter(i => prog.notes[i] < VALID).map(i => PROJECTS[i].name);
    return `<section class="ring r${c}${open ? '' : ' shut'}" aria-labelledby="rh${c}"><h2 id="rh${c}">${rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span></h2>
      ${open ? '' : `<p class="why">${c === 0 ? 'Acaba la Piscina per obrir aquest cercle.' : `Supera l'examen del cercle ${c - 1} per obrir aquest cercle.`}</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${prog.notes[i] >= VALID ? ' ok' : ''}" data-p="${i}"${open ? '' : ' disabled'}><b>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${mark(prog.notes[i])}</span></button>`).join('')}</div>
      <button class="exam${prog.exams[c] ? ' pass' : ''}" data-x="${c}"${exam ? '' : ' disabled'}><b>Examen del cercle ${c}</b><span>${prog.exams[c] ? 'Superat ✓ · el pots repetir' : exam ? 'Obert: fes-lo quan vulguis' : open ? `Falta validar: ${todo.join(', ')}` : 'Primer cal obrir el cercle'}</span></button></section>`;
  };
  $('#game').innerHTML = `<p class="status tip" id="tip">${prog.piscina ? 'Valida tots els projectes d\'un cercle (nota de 80 o més) per obrir-ne l\'examen.' : 'Abans de res, cal fer la Piscina.'}</p>
    <div class="map">${prog.piscina ? '' : '<button class="btn" id="pool">Fes la Piscina</button>'}${CIRCLES.map((_, c) => ring(c)).join('')}
      <button class="btn soft" id="cor"${prog.piscina ? '' : ' disabled'}>Corregir el full d'una companya</button></div>
    <h2 class="bh">Insígnies</h2><ul class="badges" aria-label="Insígnies">${BADGES.map((b, i) => `<li class="bd${got[i] ? ' got' : ''}"><b>${b.name}</b><span>${b.what}</span><span class="st">${got[i] ? 'Aconseguida ✓' : 'Encara no'}</span></li>`).join('')}</ul>`;
  $('#game').onclick = e => {
    const b = e.target.closest('button');
    if (!b || b.disabled || !ready()) return;
    if (b.dataset.p) projecte(+b.dataset.p); else if (b.dataset.x) examen(+b.dataset.x); else if (b.id === 'cor') corregir(); else if (b.id === 'pool') piscina();
  };
  $('#game button:not(:disabled)')?.focus({ preventScroll: true });
}

// Screens still to come; each one starts with `const t = enter(kicker, true)` and ends in mapa(). For now they take the child straight back.
function projecte(i) { mapa(); }
function corregir() { mapa(); }
function examen(c) { mapa(); }

soBtn();
prog.piscina ? mapa() : piscina();
