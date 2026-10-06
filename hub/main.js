import { GAMES } from '../shared/games.js';
import { profiles, active, add, choose, load } from '../shared/progress.js';

const $ = id => document.getElementById(id);
const list = document.querySelector('.games');
// adopting old progress needs every store once; two games of one page share theirs
const stores = [...new Set(GAMES.map(g => g.store))];
// view state that render() must not lose when it is called again: the name box open or not, and its error
let adding = false, bad = false;

// one card per game, with what this player has won in it when there is something saved
function cards() {
  list.innerHTML = GAMES.map(g => `<li><a class="game" href="${g.href}">
  ${g.icon}
  <span class="txt"><span class="tag">${g.tag}</span><b>${g.title}</b><span class="what">${g.what}</span><span class="rec">${g.record(load(g.store) || {}, g.total)}</span></span></a></li>`).join('');
}

// paints whichever view the device is in, from profiles() and active(); safe to call at any time
function render() {
  const me = active();
  $('me').hidden = $('lead').hidden = list.hidden = !me;
  $('who').hidden = !!me;
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
    b.onclick = () => { choose(p.id, stores); adding = bad = false; render(); };
    li.append(b);
    return li;
  }));
  $('open').hidden = adding;
  $('adder').hidden = !adding;
  $('bad').hidden = !bad;
}

$('change').onclick = () => { choose(null); adding = bad = false; render(); };
$('open').onclick = () => { adding = true; bad = false; render(); $('nom').focus(); };
$('adder').onsubmit = e => {
  e.preventDefault();
  if (active()) return;   // a double tap on Fet: the first already came in, the second must not complain
  const id = add($('nom').value);
  if (id) choose(id, stores);
  // a name that was refused, or a profile that could not be made active, leaves the box open with the error
  bad = !active();
  adding = bad;
  if (!bad) $('nom').value = '';
  render();
  if (bad) $('nom').focus();
};

render();
