// Checks the hub by running it: the real hub/main.js, shared/progress.js, shared/games.js and shared/sync.js run under Node over a
// fake document, a fake localStorage, a fake clock and a fake cloud.js (scripts/fakes/hub-hooks.mjs maps it), and what the hub
// does is looked at, not how its text is written. Every check below is contract: plan «El progrés no baixa mai», tasca 6.
// Run: node scripts/check-hub.mjs
import { register } from 'node:module';

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };

// ---- the fake clock: setTimeout never waits, advance(ms) runs what is due
const tick = setImmediate;
const clock = { now: 1000, timers: [], seq: 0 };
Date.now = () => clock.now;
globalThis.setTimeout = (fn, ms) => { const id = ++clock.seq; clock.timers.push({ id, at: clock.now + ms, fn }); return id; };
globalThis.clearTimeout = id => { clock.timers = clock.timers.filter(t => t.id !== id); };
function advance(ms) {
  const to = clock.now + ms;
  for (let t; (t = clock.timers.filter(x => x.at <= to).sort((a, b) => a.at - b.at || a.id - b.id)[0]);) { clock.timers = clock.timers.filter(x => x !== t); clock.now = t.at; t.fn(); }
  clock.now = to;
}

// ---- the fake document: the elements of index.html, as far as hub/main.js touches them (attributes, text, children, focus)
let D;
class El {
  constructor() { Object.assign(this, { hidden: false, textContent: '', innerHTML: '', value: '', disabled: false, className: '', kids: [], attrs: new Set() }); }
  toggleAttribute(n, on) { on ? this.attrs.add(n) : this.attrs.delete(n); }
  hasAttribute(n) { return this.attrs.has(n); }
  setAttribute(n) { this.attrs.add(n); }
  append(...k) { this.kids.push(...k); }
  replaceChildren(...k) { this.kids = k; this.innerHTML = ''; }
  focus() { D.focused = this; }
}
function makeDoc() {
  const byId = {}, hidden = new Set(['me', 'who', 'adder', 'bad']);   // hidden in index.html
  for (const id of ['me', 'name', 'change', 'lead', 'who', 'profiles', 'open', 'adder', 'nom', 'bad']) { byId[id] = new El(); byId[id].hidden = hidden.has(id); }
  const list = new El(), main = new El();
  let first;   // whether cloud.js was already loaded when the hub first looked at the page
  list.hidden = true;
  return { byId, list, main, focused: null, get paintedFirst() { return first === false; }, createElement: () => new El(), getElementById: id => { first ??= !!globalThis.__hubCloud.loaded; return byId[id]; }, querySelector: s => ({ '.games': list, main })[s] };
}
const $ = id => D.byId[id];
const submit = () => $('adder').onsubmit({ preventDefault() {} });
const profileButtons = () => $('profiles').kids.map(li => li.kids[0]);
const cards = () => (D.list.innerHTML.match(/<li>/g) || []).length;
const cloudParts = () => { const f = D.main.kids.find(k => k.className === 'cloud'); return f ? { btn: f.kids[0], acct: f.kids[1], err: f.kids[2] } : null; };
const inert = el => el.hasAttribute('inert');

// ---- the fake cloud: what each answer is is set by the scenario
const cloud = o => {
  const c = { enabled: true, name: null, calls: [], signInOk: true, ...o };
  c.session = async () => (c.name === null ? null : { name: c.name });
  c.signIn = async () => { c.calls.push('signIn'); return c.signInOk; };
  c.signOut = async () => { c.calls.push('signOut'); c.name = null; };
  c.syncAll = async () => { c.calls.push('syncAll'); return false; };
  return c;
};
const synced = c => c.calls.filter(x => x === 'syncAll').length;

// ---- load the real hub: a clean store, a clean page, the fake cloud; `setup` puts things in the store before the hub paints
const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => { mem.delete(k); } };
register('./fakes/hub-hooks.mjs', import.meta.url);
const P = await import('../shared/progress.js');
const { GAMES } = await import('../shared/games.js');
const STORES = [...new Set(GAMES.map(g => g.store))];
const settle = async () => { for (let i = 0; i < 12; i++) await new Promise(r => tick(r)); };
let loads = 0;
async function boot(c = cloud(), setup = () => {}) {
  mem.clear(); clock.timers = []; D = makeDoc(); globalThis.document = D;
  globalThis.__hubCloud = c;
  setup();
  await import(`../hub/main.js?n=${++loads}`);
  // the dynamic import of cloud.js is real work: wait (in real time, the fake clock does not move) for the button, or for the fake to be loaded
  for (const end = performance.now() + 10000; performance.now() < end && !(c.loaded && (!c.enabled || cloudParts()));) await new Promise(r => tick(r));
  await settle();
  return c;
}
const withXavi = () => { P.add('Xavi'); };

// ---- «Qui juga?» and the first profile
{
  await boot(cloud({ enabled: false }), () => { for (const s of STORES) mem.set(s, '{"secs":[1]}'); });   // old progress of every game, no profile yet
  check(D.paintedFirst, 'cloud.js was loaded before the hub looked at the page (it is imported statically, Firebase would delay the first paint)');
  check(!$('who').hidden && $('me').hidden && D.list.hidden && cards() === 0, 'empty store: «Qui juga?» is not the only view, or a card is shown');
  check($('profiles').kids.length === 0 && !$('open').hidden && $('adder').hidden, 'empty store: no profiles, the Afegeix button shows and the name box is closed');
  $('open').onclick();
  check(!$('adder').hidden && $('open').hidden && D.focused === $('nom'), 'Afegeix un jugador opens the name box and puts the focus in it');
  $('nom').value = 'Xavi'; submit();
  check(cards() === 7 && !D.list.hidden && $('who').hidden, `adding Xavi shows ${cards()} cards, want 7 (one per game) and no «Qui juga?»`);
  check($('name').textContent === 'Xavi' && !$('me').hidden, 'adding Xavi shows his name at the top');
  check(STORES.every(s => mem.has('xavi:' + s) && !mem.has(s)), 'choosing Xavi did not adopt the old progress of every store (choose was given no stores, or not all of them)');   // mutant: choose without stores
  check(D.focused === $('name'), 'after Fet the focus goes to the name');
}
{
  await boot(cloud({ enabled: false }), () => { withXavi(); for (const s of STORES) mem.set(s, '{"secs":[1]}'); });
  profileButtons()[0].onclick();
  check(cards() === 7 && STORES.every(s => mem.has('xavi:' + s) && !mem.has(s)), 'tapping a profile did not adopt the old progress of every store (choose was given no stores, or not all of them)');
}
// ---- a refused name, a double Fet
{
  await boot(cloud({ enabled: false }));
  $('open').onclick(); $('nom').value = '!!!'; submit();
  check(!$('adder').hidden && !$('bad').hidden && D.list.hidden && P.active() === null && P.profiles().length === 0 && D.focused === $('nom'), 'a refused name does not leave the box open with the error and the focus in the name');
  $('nom').value = 'Xavi'; submit(); submit();
  check(P.profiles().length === 1 && $('who').hidden && !$('me').hidden, 'a double Fet does not make one profile');
}
// ---- the 500 ms hold on the list that is rebuilt under a finger
{
  await boot(cloud({ enabled: false }), withXavi);
  check(!inert(D.list) && !inert($('profiles')), 'the first paint holds a list');
  profileButtons()[0].onclick();
  check(!$('me').hidden && inert(D.list), 'going from «Qui juga?» to the games does not hold the game list');   // mutant: hold without gate
  advance(499); check(inert(D.list), 'the game list is released before 500 ms');
  advance(1); check(!inert(D.list), 'the game list is not released at 500 ms');
  $('change').onclick();
  check(inert($('profiles')) && D.focused === $('open') && !$('who').hidden, 'Canvia does not hold the list of profiles and leave the focus on Afegeix un jugador');
  advance(499); check(inert($('profiles')), 'the list of profiles is released before 500 ms');
  advance(1); check(!inert($('profiles')), 'the list of profiles is not released at 500 ms');
  profileButtons()[0].onclick(); advance(200);
  $('open').onclick();   // a plain repaint in the middle of the hold (no sync)
  check(inert(D.list), 'a repaint in the middle of the hold lifts it');   // mutant: render cancels the timer
  advance(299); check(inert(D.list), 'a repaint shortened the hold');
  advance(1); check(!inert(D.list), 'a repaint made the hold never end (its timer was cancelled)');
}
// ---- the account button
{
  const c = await boot(cloud({ enabled: false }), withXavi);
  check(cloudParts() === null && c.calls.length === 0, 'with no Firebase config there is a button for the account');   // mutant: no test of enabled
}
{
  const c = await boot(cloud({ name: 'Ana' }), withXavi);
  const { btn, acct } = cloudParts();
  check(btn.textContent === 'Tanca la sessió' && acct.textContent === 'Ana' && !acct.hidden && !btn.disabled, 'with a session the button does not say «Tanca la sessió» with the name of the account');
  check(synced(c) === 1, `with a session syncAll ran ${synced(c)} times at start, want 1`);   // mutant: no sync at start
  profileButtons()[0].onclick(); $('change').onclick(); $('open').onclick(); $('nom').value = 'Laia'; submit(); await settle();
  check(synced(c) === 2, `a profile added with a session open did not sync (syncAll ran ${synced(c)} times, want 2)`);   // mutant: no sync after adding
}
{
  const c = await boot(cloud(), withXavi);
  const { btn, acct } = cloudParts();
  check(btn.textContent === 'Desa el progrés al núvol' && acct.hidden && synced(c) === 0, 'with no session the button does not say «Desa el progrés al núvol», or the hub synced');
  $('open').onclick(); $('nom').value = 'Laia'; submit(); await settle();
  check(synced(c) === 0, 'a profile added with no session called syncAll');
  c.signInOk = false; btn.onclick(); await settle();
  const { err } = cloudParts();
  check(!err.hidden && err.textContent === "No s'ha pogut entrar. Torna-ho a provar.", 'a failed sign-in does not show the error text');   // mutant: the error is not shown
  c.signInOk = true; c.signIn = async () => { c.name = 'Ana'; return true; };
  btn.onclick(); check(err.hidden, 'the next attempt does not clear the error'); await settle();
  check(btn.textContent === 'Tanca la sessió' && cloudParts().acct.textContent === 'Ana' && synced(c) === 1, 'after a sign-in the label, the name or the sync is missing');
  btn.onclick(); await settle();
  check(c.calls.includes('signOut') && btn.textContent === 'Desa el progrés al núvol' && cloudParts().acct.hidden, 'signing out does not bring back the first label');
}
// ---- the button is disabled while there is work, and enabled again when it ends, also on failure
{
  let end;
  const c = cloud(), pending = () => new Promise((ok, no) => { end = { ok, no }; });
  c.signIn = pending;
  await boot(c, withXavi);
  const { btn } = cloudParts();
  btn.onclick();
  check(btn.disabled, 'the button is not disabled at once when a sign-in starts');
  end?.ok(false); await settle();
  check(!btn.disabled && !cloudParts().err.hidden, 'the button is not enabled again when a sign-in ends');   // mutant: the busy-- of the click handler
  btn.onclick(); end?.no(new Error('x')); await settle();
  check(!btn.disabled, 'the button stays disabled after a sign-in that throws');   // mutant: the busy-- of the click handler
}
{
  let end;
  const c = cloud({ name: 'Ana' });
  c.syncAll = () => new Promise((ok, no) => { end = { ok, no }; });
  await boot(c, withXavi);
  const { btn } = cloudParts();
  check(btn.disabled, 'the button is not disabled while the first sync runs');
  end?.ok(false); await settle();
  check(!btn.disabled, 'the button stays disabled after a sync');   // mutant: the busy-- of sync
  profileButtons()[0].onclick(); $('change').onclick(); $('open').onclick(); $('nom').value = 'Laia'; submit(); await settle();
  check(btn.disabled, 'the button is not disabled while the sync of a new profile runs');
  end?.no(new Error('x')); await settle();
  check(!btn.disabled, 'the button stays disabled after a sync that failed');   // mutant: the busy-- of sync
}
// ---- a sync that changed the device repaints, without taking the box or what is typed in it
{
  let end;
  const c = cloud({ name: 'Ana' });
  c.syncAll = () => new Promise(ok => { end = ok; });
  await boot(c, withXavi);
  $('open').onclick(); $('nom').value = 'Lu';
  P.addProfiles([{ id: 'laia', name: 'Laia' }]); end?.(true); await settle();
  check(profileButtons().map(b => b.textContent).join() === 'Xavi,Laia', `the profile from the cloud is not on the list: ${profileButtons().map(b => b.textContent)}`);
  check(!$('adder').hidden && $('nom').value === 'Lu', 'a sync repaint closed the name box or lost what was typed');
  check(D.focused === $('nom'), 'a sync repaint moved the focus');
  check(inert($('profiles')) && !inert($('adder')) && !inert($('nom')), 'a sync repaint does not hold the list of profiles only');
  advance(500); check(!inert($('profiles')), 'the list of profiles is not released 500 ms after a sync repaint');
}
// ---- names are text
{
  const hostile = '<img src=x onerror=1>';
  await boot(cloud({ name: '<b>Ana</b>' }), () => { P.add('Xavi'); P.addProfiles([{ id: 'mal', name: hostile }]); });
  check(profileButtons()[1].textContent === hostile && profileButtons()[1].innerHTML === '', 'a profile name with < is not written as text on its button');
  check(cloudParts().acct.textContent === '<b>Ana</b>' && cloudParts().acct.innerHTML === '', 'an account name with < is not written as text');
  profileButtons()[1].onclick();
  check($('name').textContent === hostile && $('name').innerHTML === '' && !D.list.innerHTML.includes('<img'), 'the active name with < is not written as text, or reaches the cards');
}

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log('hub: ok');
process.exit(0);   // the fake clock leaves nothing to wait for
