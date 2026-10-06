// The only door to what a player has saved, kept per child. The device has a list of profiles (perfils) and one active
// profile (perfil); each game keeps one JSON document under `<profile>:<game>`, and games call load(id) / save(id, data)
// as ever, blind to the profile. Next to each document sits a sync mark { at, base, pending } (all in the one key `sync`)
// that says whether the cloud copy is behind: at is when it was last written here, base the cloud's at when last synced.
// The device is always what the games read; the cloud copy is fed from the marks. `compte` holds the uid of the account
// those marks belong to. Nothing in here throws: a store that fails reads as empty and writes nothing.
import { slug, merge } from './sync.js';

// localStorage access that never throws; a missing or failing store reads as null and a write that did not stick is false
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); return get(k) === v; } catch (e) { return false; } };
const del = k => { try { localStorage.removeItem(k); } catch (e) {} };
const json = k => { try { return JSON.parse(get(k)); } catch (e) { return null; } };
const text = s => typeof s === 'string';
const doc = (profile, game) => profile + ':' + game;   // a profile id is [a-z0-9-], so the first ':' splits a key

// every mark by document key; a sync that is not an object is as good as none
const marks = () => { const m = json('sync'); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; };
const setMark = (key, mark) => { const m = marks(); m[key] = mark; return set('sync', JSON.stringify(m)); };
const number = n => (typeof n === 'number' && isFinite(n));

// the profiles on this device, only the well-formed ones
export function profiles() {
  const l = json('perfils');
  // an id that is empty or has a ':' would break the key; of a duplicated id the first stays
  return Array.isArray(l) ? l.filter(p => p && text(p.id) && text(p.name) && p.id && !p.id.includes(':')).map(p => ({ id: p.id, name: p.name })).filter((p, i, a) => a.findIndex(q => q.id === p.id) === i) : [];
}
// the active profile id, or null when there is none or it is not on the list
export function active() { const p = get('perfil'); return profiles().some(x => x.id === p) ? p : null; }
// adds a profile and gives its id; '' when the name is not worth keeping, the id is taken, or the write did not stick
export function add(name) {
  const id = slug(name);
  const l = profiles();
  if (!id || l.some(p => p.id === id)) return '';
  return set('perfils', JSON.stringify(l.concat({ id, name: name.trim() }))) ? id : '';
}
// adds the profiles (from the cloud) that are missing; true when it added any
export function addProfiles(list) {
  if (!Array.isArray(list)) return false;
  const l = profiles();
  let added = false;
  for (const p of list) {
    if (!p || !text(p.id) || !text(p.name) || !p.id || p.id.includes(':') || l.some(x => x.id === p.id)) continue;
    l.push({ id: p.id, name: p.name }); added = true;
  }
  return added && set('perfils', JSON.stringify(l));
}
// makes a profile active (null, or an id that is not on the list, clears it). The profile that ends up active takes over
// the old un-prefixed documents of `stores`: copied when it has none of its own, deleted either way
export function choose(id, stores = []) {
  if (!text(id) || !profiles().some(p => p.id === id)) { del('perfil'); return; }
  set('perfil', id);
  if (active() !== id) return;
  for (const s of stores) {
    const old = get(s);
    if (old === null) continue;
    const key = doc(id, s);
    // mark first: a copy without its mark would be invisible to the cloud; keep the old key if either write failed
    if (get(key) === null && !(setMark(key, { at: 0, base: null, pending: true }) && set(key, old))) continue;
    del(s);
  }
}

// What this page knows of each document: the at of its mark as of its last load() or its last own save() (null: no mark).
// Page state, never in localStorage; save() compares it with the mark now to tell that the document changed under the page.
const seen = new Map();
const atOf = key => { const m = marks()[key]; return m && number(m.at) ? m.at : null; };
// what was saved under id for the active profile, or null when there is nothing, no profile, or it cannot be read
export function load(id) {
  const p = active();
  if (!p) return null;
  const key = doc(p, id);
  seen.set(key, atOf(key));
  try { return JSON.parse(get(key)); } catch (e) { return null; }
}
// saves a document for the active profile and marks it pending. at grows on every save even within one millisecond,
// so pushed() can tell that a document was saved again while an earlier send was in flight. If the stored document changed
// under this page (its mark's at is not the one the page saw or set), what is written is the merge of the page's data with
// it, so a page with old data cannot lower progress; with no stored document, or none changed, data is written as it comes
export function save(id, data) {
  // a game page belongs to the child who was active when it loaded; if another child (or nobody) is active now, this page is
  // stale (a tab, or a restored page) and must not write its data under the new child
  if (stale()) { location.replace('index.html'); return; }
  const p = active();
  if (!p) return;
  let s;
  try { s = JSON.stringify(data); } catch (e) { return; }
  const key = doc(p, id), prev = marks()[key], old = get(key);
  const mine = seen.has(key) ? seen.get(key) : null;
  if (old !== null && atOf(key) !== mine) {
    try { s = JSON.stringify(merge(data, JSON.parse(old), true)); } catch (e) {}   // an unreadable stored document: data as it comes
  }
  const at = Math.max(Date.now(), prev && number(prev.at) ? prev.at + 1 : 0);
  // mark first: a changed document over a mark that says synced would never be sent
  if (!setMark(key, { at, base: prev && number(prev.base) ? prev.base : null, pending: true })) return;
  if (set(key, s)) {
    seen.set(key, at);
    // the document stuck: send it without waiting; the cloud code is only loaded in a browser, never under Node
    if (typeof window !== 'undefined') import('./cloud.js').then(m => m.push(p, id)).catch(() => {});
    return;
  }
  // the old document stays, so its old mark must too: pending over it could push a stale copy over newer cloud progress.
  // If this restore fails as well, the state is the pending mark over the old document
  const m = marks();
  if (prev === undefined) delete m[key]; else m[key] = prev;
  set('sync', JSON.stringify(m));
}

// every document that has a mark and can be read
export function entries() {
  const out = [];
  const m = marks();
  for (const key of Object.keys(m)) {
    const v = m[key], i = key.indexOf(':');
    if (!v || !number(v.at) || i < 1) continue;
    const raw = get(key);
    if (raw === null) continue;
    let data;
    try { data = JSON.parse(raw); } catch (e) { continue; }
    out.push({ profile: key.slice(0, i), game: key.slice(i + 1), data, at: v.at, base: number(v.base) ? v.base : null, pending: v.pending === true });
  }
  return out;
}
// writes a document taken from the cloud, in sync with it
export function pulled(profile, game, data, at) {
  if (!number(at)) return;   // a mark without a numeric at would hide the document from entries() for good
  let s;
  try { s = JSON.stringify(data); } catch (e) { return; }
  const key = doc(profile, game);
  if (set(key, s)) setMark(key, { at, base: at, pending: false });
}
// writes the document merged from the device and the cloud copy, only if the mark still has the at the caller saw (nothing was
// saved meanwhile). The mark goes first and is put back if the document did not stick. It leaves what save() remembers, so the
// page's next save merges with this document too. Gives whether it wrote
export function merged(profile, game, data, seenAt, cloudAt) {
  if (!number(seenAt) || !number(cloudAt)) return false;
  const key = doc(profile, game), prev = marks()[key];
  if (!prev || prev.at !== seenAt) return false;
  let s;
  try { s = JSON.stringify(data); } catch (e) { return false; }
  if (!setMark(key, { at: Math.max(Date.now(), seenAt + 1, cloudAt + 1), base: cloudAt, pending: true })) return false;
  if (set(key, s)) return true;
  const m = marks();
  m[key] = prev;
  set('sync', JSON.stringify(m));
  return false;
}
// the cloud took the document as of `at`; only clears pending if it has not been saved again since
export function pushed(profile, game, at) {
  const key = doc(profile, game), v = marks()[key];
  if (v && v.at === at) setMark(key, { at, base: at, pending: false });
}
// the uid of the account the marks belong to, or null when none has signed in here
export function account() { return get('compte'); }
// a different account on this device: nothing is known to be in its cloud, so every document is pending without a base
export function rebase(uid) {
  if (!text(uid) || !uid || get('compte') === uid) return false;
  const m = marks();
  for (const key of Object.keys(m)) if (m[key] && typeof m[key] === 'object') m[key] = { at: m[key].at, base: null, pending: true };
  if (!set('sync', JSON.stringify(m))) return false;   // the uid is only kept once the marks carry no base of the other account
  return set('compte', uid);
}

// A game page (no data-hub) remembers the profile active when it loaded, to tell later that it has gone stale. The hub itself
// has no owner: there load and save follow active().
let owner = null;
const stale = () => owner !== null && active() !== owner;
if (typeof window !== 'undefined' && !document.documentElement.hasAttribute('data-hub')) {
  owner = active();
  // a page restored from the back/forward cache keeps its state, so the player may have changed meanwhile
  if (owner !== null) window.addEventListener('pageshow', e => { if (e.persisted && stale()) location.replace('index.html'); });
}
// a game page opened with no active profile has nowhere to save: back to the hub, which has data-hub and asks who plays
if (typeof window !== 'undefined' && !active() && !document.documentElement.hasAttribute('data-hub')) location.replace('index.html');
