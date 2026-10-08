// Checks the hub by running it: the real hub/main.js, shared/progress.js, shared/games.js and shared/sync.js run under Node over a
// fake document, a fake localStorage, a fake clock and a fake cloud.js (scripts/fakes/hub-hooks.mjs maps it), and what the hub
// does is looked at, not how its text is written. Each block says where its values come from (// contract:); the ones ported from
// check-progress.mjs keep the provenance they had there.
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
  constructor() { Object.assign(this, { hidden: false, textContent: '', value: '', disabled: false, className: '', kids: [], attrs: new Set(), parent: null, _h: '' }); }
  get innerHTML() { return this._h; }
  set innerHTML(v) { D.writes.push(this._h = String(v)); }   // every write of html is logged: no name may ever be in one
  set outerHTML(v) { D.writes.push(String(v)); }
  insertAdjacentHTML(where, v) { D.writes.push(String(v)); }
  toggleAttribute(n, on) { on ? this.attrs.add(n) : this.attrs.delete(n); }
  hasAttribute(n) { return this.attrs.has(n); }
  setAttribute(n) { this.attrs.add(n); }
  append(...k) { for (const x of k) x.parent = this; this.kids.push(...k); }
  replaceChildren(...k) { for (const x of k) x.parent = this; this.kids = k; this._h = ''; }
  focus() { for (let e = this; e; e = e.parent) if (e.hidden || e.hasAttribute('inert')) return; D.focused = this; }   // as a browser: not into what is hidden or inert
}
function makeDoc() {
  const byId = {}, hidden = new Set(['me', 'who', 'adder', 'bad']);   // hidden in index.html
  for (const id of ['me', 'name', 'change', 'lead', 'who', 'profiles', 'open', 'adder', 'nom', 'bad']) { byId[id] = new El(); byId[id].hidden = hidden.has(id); }
  for (const [p, ks] of Object.entries({ me: ['name', 'change'], who: ['profiles', 'open', 'adder'], adder: ['nom', 'bad'] })) for (const k of ks) byId[k].parent = byId[p];   // the tree of index.html
  const list = new El(), main = new El();
  let first;   // whether cloud.js was already loaded when the hub first looked at the page
  list.hidden = true;
  return { byId, list, main, writes: [], focused: null, get paintedFirst() { return first === false; }, createElement: () => new El(), getElementById: id => { first ??= !!globalThis.__hubCloud.loaded; return byId[id]; }, querySelector: s => ({ '.games': list, main })[s] };
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
// real time (the fake clock does not move): the dynamic import of cloud.js is real work
const until = async (cond, ms = 5000) => { for (const end = performance.now() + ms; performance.now() < end && !cond();) await new Promise(r => tick(r)); return cond(); };
let loads = 0;
async function boot(c = cloud(), setup = () => {}, wait = true) {
  mem.clear(); clock.timers = []; D = makeDoc(); globalThis.document = D;
  globalThis.__hubCloud = c;
  setup();
  await import(`../hub/main.js?n=${++loads}`);
  if (!wait) return c;   // for the scenario that looks at the hub before the cloud answers
  if (!await until(() => c.loaded && (!c.enabled || cloudParts()))) { console.error('FAIL main.js never loaded cloud.js, or never mounted the account button with a config'); process.exit(1); }
  await settle();
  return c;
}
const withXavi = () => { P.add('Xavi'); };

// ---- «Qui juga?» and the first profile. contract: plan «El progrés no baixa mai», tasca 6 (empty store: «Qui juga?», no card; Xavi: seven cards, the name on top, choose given every store); Task 3 brief (focus)
{
  await boot(cloud({ enabled: false }), () => { for (const s of STORES) mem.set(s, '{"secs":[1]}'); });   // old progress of every game, no profile yet
  check(D.paintedFirst, 'cloud.js was loaded before the hub looked at the page (it is imported statically, Firebase would delay the first paint)');   // contract: Task 5 decision 1, import() after the first paint
  check(!$('who').hidden && $('me').hidden && D.list.hidden && cards() === 0, 'empty store: «Qui juga?» is not the only view, or a card is shown');
  check($('profiles').kids.length === 0 && !$('open').hidden && $('adder').hidden, 'empty store: no profiles, the Afegeix button shows and the name box is closed');
  $('open').onclick();
  check(!$('adder').hidden && $('open').hidden && D.focused === $('nom'), 'Afegeix un jugador opens the name box and puts the focus in it');   // contract: Task 3 brief; a focus that a hidden box refuses stays where it was
  $('nom').value = 'Xavi'; submit();
  check(cards() === GAMES.length && !D.list.hidden && $('who').hidden, `adding Xavi shows ${cards()} cards, want ${GAMES.length} (one per game) and no «Qui juga?»`);   // contract: tasca 6, «set targetes»
  check($('name').textContent === 'Xavi' && !$('me').hidden, 'adding Xavi shows his name at the top');
  check(STORES.every(s => mem.has('xavi:' + s) && !mem.has(s)), 'choosing Xavi did not adopt the old progress of every store (choose was given no stores, or not all of them)');   // contract: tasca 6, «choose cridat amb tots els store»
  check(D.focused === $('name'), 'after Fet the focus goes to the name');   // contract: Task 3 brief, the focus goes where it is not refused
  check($('nom').value === '', 'text typed in a box that closed waits in it for the next time');   // contract: the comment of render(), «text typed in a box that closed must not wait in it»
}
{
  await boot(cloud({ enabled: false }), () => { withXavi(); for (const s of STORES) mem.set(s, '{"secs":[1]}'); });
  profileButtons()[0].onclick();
  check(cards() === GAMES.length && STORES.every(s => mem.has('xavi:' + s) && !mem.has(s)), 'tapping a profile did not adopt the old progress of every store (choose was given no stores, or not all of them)');   // contract: tasca 6, «choose cridat amb tots els store»
}
{
  // contract: revisió de la tasca 6, I4: a device that comes back with a profile already active shows its games and holds nothing
  await boot(cloud({ enabled: false }), () => { withXavi(); P.choose('xavi'); });
  check(cards() === GAMES.length && $('name').textContent === 'Xavi' && !inert(D.list), `the first paint with a profile active shows ${cards()} cards, the name «${$('name').textContent}», and the game list ${inert(D.list) ? 'is' : 'is not'} held, want ${GAMES.length}, Xavi, not held`);
}
// ---- a refused name. contract: tasca 6, «un nom refusat deixa la casella oberta amb l'error»; «doble Fet crea un sol perfil»
{
  await boot(cloud({ enabled: false }));
  $('open').onclick(); $('nom').value = '!!!'; submit();
  check(!$('adder').hidden && !$('bad').hidden && D.list.hidden && P.active() === null && P.profiles().length === 0 && D.focused === $('nom'), 'a refused name does not leave the box open with the error and the focus in the name');
  check(!inert($('profiles')), 'a refused name held the list of profiles (render(true) outside a sync)');   // contract: fix round 1 N1, sync is the only reason to hold without a change of view; revisió de la tasca 6, M3
  $('nom').value = 'Xavi'; submit(); submit();
  check(P.profiles().length === 1 && $('who').hidden && !$('me').hidden, 'a double Fet does not make one profile');
}
// ---- the 500 ms hold on the list that is rebuilt under a finger. contract: tasca 6, «inert 500 ms»; fix round 1 N1 and C1
{
  await boot(cloud({ enabled: false }), withXavi);
  check(!inert(D.list) && !inert($('profiles')), 'the first paint holds a list');
  $('open').onclick(); $('nom').value = 'Lu';
  profileButtons()[0].onclick();
  check($('nom').value === '', 'a name box left open and a profile tapped: the text waits in the box (adding was not reset)');   // contract: render() comment; revisió de la tasca 6, M9
  check(!$('me').hidden && inert(D.list), 'going from «Qui juga?» to the games does not hold the game list');   // mutant: hold without gate
  advance(499); check(inert(D.list), 'the game list is released before 500 ms');
  advance(1); check(!inert(D.list), 'the game list is not released at 500 ms');
  $('change').onclick();
  check(inert($('profiles')) && D.focused === $('open') && !$('who').hidden, 'Canvia does not hold the list of profiles and leave the focus on Afegeix un jugador');   // contract: fix round 1 follow-up 2, focusing inside an inert list fails silently
  advance(499); check(inert($('profiles')), 'the list of profiles is released before 500 ms');
  advance(1); check(!inert($('profiles')), 'the list of profiles is not released at 500 ms');
  profileButtons()[0].onclick(); advance(200);
  $('change').onclick(); advance(300);   // the view changes in the middle of the hold of the games: nothing cancels its timer
  check(!inert(D.list), 'a repaint made the hold of the game list never end (its timer was cancelled)');   // mutant: render cancels the timer; contract: fix round 1 N1, render() never lifts or cancels a hold
}
{
  // contract: re-revisió de la tasca 6, N1; brief «un repintat entremig no l'hi treu»: Canvia and, before 500 ms, Afegeix un jugador (it is not held): the repaint lifts nothing
  await boot(cloud({ enabled: false }), withXavi);
  profileButtons()[0].onclick(); advance(500);
  $('change').onclick(); advance(200);
  $('open').onclick();
  check(inert($('profiles')), 'a repaint in the middle of the hold lifts it');   // mutants: render sets tap false and gates; the same with clearTimeout
  advance(299); check(inert($('profiles')), 'a repaint shortened the hold of the list of profiles');
  advance(1); check(!inert($('profiles')), 'a repaint made the hold of the list of profiles never end');
}
// ---- «a sync repaint inside the games view». contract: fix round 1 N1 (a sync repaint holds, and a hold is only extended); revisió de la tasca 6, I2 and I5
{
  let end;
  const c = cloud({ name: 'Ana' });
  c.syncAll = () => new Promise(ok => { end = ok; });
  await boot(c, withXavi);   // Xavi is not active; the first sync is pending
  const b0 = profileButtons()[0];
  end?.(false); await settle();
  check(profileButtons()[0] === b0 && !inert($('profiles')), 'a sync that returned false repainted the hub');   // mutant: render(true) whatever syncAll says
  $('open').onclick(); $('nom').value = 'Laia'; submit(); await settle();   // Laia is active (the games, held 500 ms), a second sync is pending
  advance(200);
  P.addProfiles([{ id: 'ana', name: 'Ana' }]); end?.(true); await settle();
  advance(499); check(inert(D.list), 'a sync repaint in the games view did not extend the hold to 500 ms after it');   // mutants: no hold on sync; a running hold is never extended
  advance(1); check(!inert(D.list), 'the hold after a sync repaint is not released 500 ms after it');
}
// ---- the hub does not wait for the cloud. contract: plan «El progrés no baixa mai», tasca 5, «la portada ja no espera el núvol»; revisió de la tasca 6, I3
{
  const c = cloud({ name: 'Ana' });
  c.session = () => new Promise(() => {});   // the cloud never answers
  await boot(c, withXavi, false);
  check(!$('who').hidden && profileButtons().length === 1 && !inert($('profiles')) && !inert(D.list), 'the hub is not painted, or a list is held, while the cloud has not answered');   // mutants: start().finally(render); the lists held until a 4 s unlock
  profileButtons()[0]?.onclick();
  check(cards() === GAMES.length && inert(D.list), 'a profile tapped before the cloud answers does not show the cards');
  advance(4000);
  check(cards() === GAMES.length && !inert(D.list) && !inert($('profiles')), 'the lists are still held 4 s after the first paint');
  await until(() => c.loaded); await settle();   // the pending import must end before another page is loaded
}
// ---- the account button. contract: tasca 6; fix round 1 C1 and I2; Task 5 decisions 3, 4 and 6
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
  check(synced(c) === 3, `a profile tapped and a profile added with a session open did not sync once each (syncAll ran ${synced(c)} times, want 3)`);   // mutant: no sync after adding
}
{
  const c = await boot(cloud(), withXavi);
  const { btn, acct } = cloudParts();
  check(btn.textContent === 'Entra amb Google' && acct.hidden && synced(c) === 0, 'with no session the button does not say «Entra amb Google», or the hub synced');
  $('open').onclick(); $('nom').value = 'Laia'; submit(); await settle();
  check(synced(c) === 0, 'a profile added with no session called syncAll');
  c.signInOk = false; btn.onclick(); await settle();
  const { err } = cloudParts();
  check(!err.hidden && err.textContent === "No s'ha pogut entrar. Torna-ho a provar.", 'a failed sign-in does not show the error text');   // mutant: the error is not shown
  c.signInOk = true; c.signIn = async () => { c.name = 'Ana'; return true; };
  btn.onclick(); check(err.hidden, 'the next attempt does not clear the error'); await settle();
  check(btn.textContent === 'Tanca la sessió' && cloudParts().acct.textContent === 'Ana' && synced(c) === 1, 'after a sign-in the label, the name or the sync is missing');
  btn.onclick(); await settle();
  check(c.calls.includes('signOut') && btn.textContent === 'Entra amb Google' && cloudParts().acct.hidden, 'signing out does not bring back the first label');
}
// ---- the button is disabled while there is work, and enabled again when it ends, also on failure; one sign-in per tap pair. contract: tasca 6; Task 5 decision 4, a double tap opens one popup
{
  let end;
  const c = cloud(), pending = () => { c.calls.push('signIn'); return new Promise((ok, no) => { end = { ok, no }; }); };
  c.signIn = pending;
  await boot(c, withXavi);
  const { btn } = cloudParts();
  btn.onclick(); btn.onclick();
  check(btn.disabled, 'the button is not disabled at once when a sign-in starts');
  check(c.calls.filter(x => x === 'signIn').length === 1, 'a double tap on the button asked for two sign-ins');   // mutant: no «if (busy) return»
  end?.ok(false); await settle();
  check(!btn.disabled && !cloudParts().err.hidden, 'the button is not enabled again when a sign-in ends');   // mutant: the busy-- of the click handler
  btn.onclick(); end?.no(new Error('x')); await settle();
  check(!btn.disabled, 'the button stays disabled after a sign-in that throws');   // mutant: the busy-- of the click handler
}
{
  let end;
  const c = cloud({ name: 'Ana' });
  c.syncAll = () => { c.calls.push('syncAll'); return new Promise((ok, no) => { end = { ok, no }; }); };
  await boot(c, withXavi);
  const { btn } = cloudParts();
  check(btn.disabled, 'the button is not disabled while the first sync runs');
  profileButtons()[0].onclick(); $('change').onclick(); $('open').onclick(); $('nom').value = 'Laia'; submit(); await settle();
  check(synced(c) === 1, 'a second syncAll started while the first was running');   // contract: Task 5 decision 6, one syncAll after another; mutant: no chain (tail)
  end?.ok(false); await settle();
  check(synced(c) === 2 && btn.disabled, 'the sync of the tapped profile did not follow the first, or the button was enabled while it ran');
  end?.ok(false); await settle();
  check(synced(c) === 3 && btn.disabled, 'the sync of the new profile did not follow, or the button was enabled while it ran');
  end?.ok(false); await settle();
  check(!btn.disabled, 'the button stays disabled after a sync');   // mutant: the busy-- of sync
  $('change').onclick(); $('open').onclick(); $('nom').value = 'Mia'; submit(); await settle();
  check(btn.disabled, 'the button is not disabled while the sync of a new profile runs');
  end?.no(new Error('x')); await settle();
  check(!btn.disabled, 'the button stays disabled after a sync that failed');   // mutant: the busy-- of sync
}
// ---- a sync that changed the device repaints, without taking the box or what is typed in it. contract: tasca 6; fix round 1 N1
{
  let end;
  const c = cloud({ name: 'Ana' });
  c.syncAll = () => new Promise(ok => { end = ok; });
  await boot(c, withXavi);
  $('open').onclick(); $('nom').value = 'Lu';
  P.addProfiles([{ id: 'laia', name: 'Laia' }]); end?.(true); await settle();
  check(profileButtons().map(b => b.textContent).join() === 'Xavi,Laia', `the profile from the cloud is not on the list: ${profileButtons().map(b => b.textContent)}`);
  check(!$('adder').hidden && $('nom').value === 'Lu', 'a sync repaint closed the name box or lost what was typed');
  check(D.focused === $('nom'), 'a sync repaint moved the focus');   // contract: Task 5 decision 6, the sync path never moves the focus
  check(inert($('profiles')) && !inert($('adder')) && !inert($('nom')), 'a sync repaint does not hold the list of profiles only');
  advance(500); check(!inert($('profiles')), 'the list of profiles is not released 500 ms after a sync repaint');
}
// ---- names are text. contract: tasca 6, «es veuen com a text»; brief rule «noms amb textContent»; revisió de la tasca 6, I1
{
  const hostile = '<img src=x onerror=1>';
  await boot(cloud({ name: '<b>Ana</b>' }), () => { P.add('Xavi'); P.addProfiles([{ id: 'mal', name: hostile }]); });
  check(profileButtons()[1].textContent === hostile, 'a profile name with < is not written as text on its button');
  check(cloudParts().acct.textContent === '<b>Ana</b>', 'an account name with < is not written as text');
  profileButtons()[1].onclick();
  check($('name').textContent === hostile, 'the active name with < is not written as text');
  check(D.writes.some(w => w.includes('class="game"')) && D.writes.every(w => !/<img|<b>Ana/.test(w)), 'a name (profile or account) reached a write of html (innerHTML, outerHTML, insertAdjacentHTML)');   // the html of the cards is the write that must be in the log
}

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log('hub: ok');
process.exit(0);   // the fake clock leaves nothing to wait for
