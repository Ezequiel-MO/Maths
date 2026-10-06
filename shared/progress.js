// The only door to what a player has saved, kept per child. The device has a list of profiles (perfils) and one active
// profile (perfil); each game keeps one JSON document under `<profile>:<game>`, and games call load(id) / save(id, data)
// as ever, blind to the profile. Next to each document sits a sync mark { at, base, pending } (all in the one key `sync`)
// that says whether the cloud copy is behind: at is when it was last written here, base the cloud's at when last synced.
// The device is always what the games read; the cloud copy is fed from the marks. `compte` holds the uid of the account
// those marks belong to. Nothing in here throws: a store that fails reads as empty and writes nothing.
import { slug } from './sync.js';

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
  return Array.isArray(l) ? l.filter(p => p && text(p.id) && text(p.name)).map(p => ({ id: p.id, name: p.name })) : [];
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
    if (get(key) === null && !(set(key, old) && setMark(key, { at: 0, base: null, pending: true }))) continue;   // keep the old one if the copy failed
    del(s);
  }
}

// what was saved under id for the active profile, or null when there is nothing, no profile, or it cannot be read
export function load(id) { const p = active(); if (!p) return null; try { return JSON.parse(get(doc(p, id))); } catch (e) { return null; } }
// saves a document for the active profile and marks it pending. at grows on every save even within one millisecond,
// so pushed() can tell that a document was saved again while an earlier send was in flight
export function save(id, data) {
  const p = active();
  if (!p) return;
  let s;
  try { s = JSON.stringify(data); } catch (e) { return; }
  const key = doc(p, id);
  if (!set(key, s)) return;
  const prev = marks()[key];
  setMark(key, { at: Math.max(Date.now(), prev && number(prev.at) ? prev.at + 1 : 0), base: prev && number(prev.base) ? prev.base : null, pending: true });
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
  let s;
  try { s = JSON.stringify(data); } catch (e) { return; }
  const key = doc(profile, game);
  if (set(key, s)) setMark(key, { at, base: at, pending: false });
}
// the cloud took the document as of `at`; only clears pending if it has not been saved again since
export function pushed(profile, game, at) {
  const key = doc(profile, game), v = marks()[key];
  if (v && v.at === at) setMark(key, { at, base: at, pending: false });
}
// a different account on this device: nothing is known to be in its cloud, so every document is pending without a base
export function rebase(uid) {
  if (!text(uid) || !uid || get('compte') === uid) return false;
  const m = marks();
  for (const key of Object.keys(m)) if (m[key] && typeof m[key] === 'object') m[key] = { at: m[key].at, base: null, pending: true };
  set('sync', JSON.stringify(m));
  return set('compte', uid);
}
