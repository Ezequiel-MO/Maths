// The frame every game page shares: the bar on top (← Tots els jocs, ← Mapa, the level, the sound), the token that stops the screen
// on show when another one comes up, and the small pieces of text and markup the games repeat. Each main.js keeps its progress
// (let prog) and hands these what they need.
import { $, RM } from './util.js';
import { panel } from './sections.js';

// after a screen comes up, taps on what advances are ignored for this long: a second tap must not press what is under the first
export const SETTLE = 450;
// the link to the page of all games only exists where the page is served under its own file name, next to the others
export const ownPage = id => location.pathname.endsWith(id + '.html');

// Every new screen cancels the running one: fresh() turns the old token off (its timers, loops and awaits check t.on and stop) and
// gives a new one. stop runs too, for what a game must undo itself (a key handler, an observer).
export function tokens(stop) {
  let t = { on: true };
  return () => { t.on = false; t = { on: true }; if (stop) stop(); return t; };
}

// The bar at the top of every screen: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
export function xpBar(lv) {
  const box = $('#xp'), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}

// The sound button: prog() is the progress (its so is the choice), save() keeps it, ping() is heard when the sound comes back.
// Gives the function that writes the button
export function soundButton(prog, save, ping) {
  const paint = () => { $('#so').textContent = `So: ${prog().so ? 'sí' : 'no'}`; };
  $('#so').onclick = () => { prog().so = !prog().so; save(); paint(); if (prog().so) ping(); };
  return paint;
}

// 'a, b i c'
export const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
// the badges a hand-in earns, as a line of the panel
export const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
export const starRow = n => '★'.repeat(n) + '☆'.repeat(3 - n);
// the end of a level or of a board comes up over its two halves
export function curtain(html) {
  panel($('#split'), html);
  $('#split .panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
}
// the run of right answers in a row, shown from 3 on, with a pop each time it grows
export function combo(streak) {
  const e = $('#cb'); if (!e) return;
  e.hidden = streak < 3; e.textContent = `Ratxa ×${streak}`;
  if (streak >= 3) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
}
