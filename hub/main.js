import { GAMES } from '../shared/games.js';
import { profiles, active, add, choose, load } from '../shared/progress.js';

const $ = id => document.getElementById(id);
const list = document.querySelector('.games');
// adopting old progress needs every store once; two games of one page share theirs
const stores = [...new Set(GAMES.map(g => g.store))];
// view state that render() must not lose when it is called again: the name box open or not, and its error
let adding = false, bad = false;
// the view painted last ('who', 'games', or null before the first paint)
let seen = null;
// Each list a tap could hit is gated: it takes no input (inert stops the keyboard as well as the finger) while any reason holds it.
// Reasons: tap, 500 ms after its buttons were rebuilt where a finger may still be; cloud, the first sync of the page has not answered.
// «Qui juga?» gates only its list of profiles, so the name box and Fet stay usable
const gates = { games: { el: list }, who: { el: $('profiles') } };
const gate = g => { g.el.inert = !!(g.tap || g.cloud); };
// a running tap hold is never cancelled or shortened, only extended
function hold(g, ms) {
  const end = Date.now() + ms;
  if (g.tap && end <= g.end) return;
  g.tap = true; g.end = end; clearTimeout(g.timer);
  g.timer = setTimeout(() => { g.tap = false; gate(g); }, ms);
  gate(g);
}

// one card per game, with what this player has won in it when there is something saved
function cards() {
  list.innerHTML = GAMES.map(g => `<li><a class="game" href="${g.href}">
  ${g.icon}
  <span class="txt"><span class="tag">${g.tag}</span><b>${g.title}</b><span class="what">${g.what}</span><span class="rec">${g.record(load(g.store) || {}, g.total)}</span></span></a></li>`).join('');
}

// paints whichever view the device is in, from profiles() and active(); safe to call at any time. sync is true for a repaint
// that follows a sync: what it rebuilds may be under a finger, so it is held like a change of view
function render(sync) {
  const me = active();
  const changed = !!me && seen === 'who', back = !me && seen === 'games';
  if (!adding) $('nom').value = '';   // text typed in a box that closed must not wait in it for the next time
  $('me').hidden = $('lead').hidden = list.hidden = !me;
  $('who').hidden = !!me;
  // a double tap on Fet or on a profile would land on the card that is then under the finger, and a sync that adds profiles moves
  // the buttons: both hold the rebuilt list. The first paint (seen is null) holds nothing, and no render ever lifts a hold
  seen = me ? 'games' : 'who';
  if (me) {
    // names are text, never html: they can come from the cloud
    $('name').textContent = (profiles().find(p => p.id === me) || {}).name || '';
    cards();
    if (changed || sync) hold(gates.games, 500);
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
  if (sync || back) hold(gates.who, 500);   // back: Canvia was tapped, a second tap must not land on a profile
  $('open').hidden = adding;
  $('adder').hidden = !adding;
  $('bad').hidden = !bad;
}

$('change').onclick = () => { choose(null); adding = bad = false; render(); $('open').focus({ preventScroll: true }); };   // not a profile button: the list is inert for a moment and a focus there would fail
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
  if (id && who !== null) sync();   // a profile added with a session open goes up at once
};

// The adult's account. cloud.js is loaded after the first paint (never statically: Firebase must not delay the hub) and its
// button exists only when there is a Firebase config. who is the account name, or null with no session
let cloud = null, who = null, busy = 0, tail = Promise.resolve();
let btn, acct, err;

// the button is disabled while anything is in flight; its label follows the session
function paint() {
  btn.disabled = busy > 0;
  btn.textContent = who === null ? 'Desa el progrés al núvol' : 'Tanca la sessió';
  acct.textContent = who || '';   // an account name can be anything: text only
  acct.hidden = !who;
}

async function refresh() { const s = await cloud.session(); who = s ? s.name : null; }

// one syncAll after another (a second call during a run would be given the run that is already going); the hub is repainted
// only when the device changed, and the sync path never moves the focus
function sync() {
  busy++; paint();
  return tail = tail.then(() => cloud.syncAll()).then(changed => { if (changed) render(true); }, () => {}).finally(() => { busy--; paint(); });
}

function mount() {
  const foot = document.createElement('div');
  btn = document.createElement('button'); acct = document.createElement('span'); err = document.createElement('p');
  foot.className = 'cloud'; btn.className = 'btn'; btn.type = 'button'; acct.className = 'acct';
  err.className = 'bad'; err.setAttribute('role', 'alert'); err.hidden = true;
  err.textContent = "No s'ha pogut entrar. Torna-ho a provar.";
  btn.onclick = async () => {
    if (busy) return;
    busy++; err.hidden = true; paint();   // disabled before the first await: a double tap opens one popup
    try {
      if (who === null) {
        const ok = await cloud.signIn();
        if (ok) await refresh();
        if (ok && who !== null) await sync(); else err.hidden = false;
      } else {
        await cloud.signOut();   // nothing on the device is erased
        await refresh();
      }
    } catch (e) {}
    busy--; paint();
  };
  foot.append(btn, acct, err);
  document.querySelector('main').append(foot);
}

// A device that is online but stale must not save over newer cloud progress: until the page has heard from the cloud the cards
// take no input. Capped at 4 s, and no wait at all offline. With no config nothing in here ever runs
let cap = 0;
function lock() {
  if (navigator.onLine === false) return;
  gates.games.cloud = true; gate(gates.games);
  cap = setTimeout(unlock, 4000);
}
function unlock() { if (!gates.games.cloud) return; clearTimeout(cap); gates.games.cloud = false; gate(gates.games); }

async function start() {
  try {
    const c = await import('../shared/cloud.js');
    if (!c.enabled) return;
    cloud = c;
    lock();
    await refresh();   // the button waits for the answer, so it never shows the wrong label
    mount(); paint();
    if (who !== null) await sync();
  } catch (e) {} finally { unlock(); }   // the cards wait until the first session() or the first syncAll() has answered
}

render();
start();
