import { GAMES } from '../shared/games.js';
import { profiles, active, add, choose, load } from '../shared/progress.js';

const $ = id => document.getElementById(id);
const list = document.querySelector('.games');
// adopting old progress needs every store once; two games of one page share theirs
const stores = [...new Set(GAMES.map(g => g.store))];
// view state that render() must not lose when it is called again: the name box open or not, and its error
let adding = false, bad = false;
// the view painted last ('who', 'games', or null before the first paint) and the timer of the tap guard
let seen = null, timer = 0;

// one card per game, with what this player has won in it when there is something saved
function cards() {
  list.innerHTML = GAMES.map(g => `<li><a class="game" href="${g.href}">
  ${g.icon}
  <span class="txt"><span class="tag">${g.tag}</span><b>${g.title}</b><span class="what">${g.what}</span><span class="rec">${g.record(load(g.store) || {}, g.total)}</span></span></a></li>`).join('');
}

// paints whichever view the device is in, from profiles() and active(); safe to call at any time
function render() {
  const me = active();
  if (!adding) $('nom').value = '';   // text typed in a box that closed must not wait in it for the next time
  $('me').hidden = $('lead').hidden = list.hidden = !me;
  $('who').hidden = !!me;
  // the games list takes no taps for a moment after «Qui juga?» gives way to it: a double tap on Fet or on a profile
  // would otherwise land on the card that is then under the finger. Only that change arms it, not a repaint
  clearTimeout(timer);
  if (me && seen === 'who') { list.classList.add('wait'); timer = setTimeout(() => list.classList.remove('wait'), 500); }
  else list.classList.remove('wait');
  seen = me ? 'games' : 'who';
  if (me) {
    // names are text, never html: they can come from the cloud
    $('name').textContent = (profiles().find(p => p.id === me) || {}).name || '';
    cards();
    return;
  }
  list.replaceChildren();
  $('profiles').replaceChildren(...profiles().map(p => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.className = 'btn soft'; b.textContent = p.name;
    b.onclick = () => { choose(p.id, stores); adding = bad = false; render(); if (active()) $('name').focus({ preventScroll: true }); };
    li.append(b);
    return li;
  }));
  $('open').hidden = adding;
  $('adder').hidden = !adding;
  $('bad').hidden = !bad;
}

$('change').onclick = () => { choose(null); adding = bad = false; render(); ($('profiles').querySelector('button') || $('open')).focus({ preventScroll: true }); };
$('open').onclick = () => { adding = true; bad = false; render(); $('nom').focus(); };
$('adder').onsubmit = e => {
  e.preventDefault();
  if (active()) return;   // a double tap on Fet: the first already came in, the second must not complain
  const id = add($('nom').value);
  if (id) choose(id, stores);
  // a name that was refused, or a profile that could not be made active, leaves the box open with the error
  bad = !active();
  adding = bad;
  render();
  // focus goes to the name (it takes no tap, unlike a card or Canvia) or back to the box that still needs fixing
  if (bad) $('nom').focus(); else $('name').focus({ preventScroll: true });
};

render();
