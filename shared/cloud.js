// The cloud copy of the progress, and the only file that knows Firebase. Paths: users/{uid}/profiles/{profile} holds { name },
// users/{uid}/profiles/{profile}/games/{game} holds { data, at }. With no config (firebase-config.js is null) everything is
// inert and no Firebase package is even loaded. Nothing in here throws or rejects: a network error leaves the document pending.
import config from './firebase-config.js';
import { slug, settle, merge, same } from './sync.js';
import { profiles, addProfiles, entries, pulled, merged, pushed, rebase } from './progress.js';

export const enabled = !!config;
const number = n => (typeof n === 'number' && isFinite(n));

// Every Firestore read and write waits at most LIMIT ms: past it the request counts as a network error (it rejects), so a request
// that never answers cannot hold a run or the chain of sends. The continuation of a request that timed out never runs, so a late
// answer does nothing. The popup sign-in has no limit (the adult may take long).
const LIMIT = 15000;
const within = p => new Promise((res, rej) => {
  const id = setTimeout(() => rej(new Error('timeout')), LIMIT);
  Promise.resolve(p).then(v => { clearTimeout(id); res(v); }, e => { clearTimeout(id); rej(e); });
});

// the Firebase packages are imported only here, once, and only with a config; a failed load is retried on the next call
let fb = null;
const boot = () => fb || (fb = (async () => {
  const [app, A, F] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite')]);
  const a = app.initializeApp(config);
  return { A, F, auth: A.getAuth(a), db: F.getFirestore(a) };
})().catch(e => { fb = null; throw e; }));

// resolves on the first auth emission, which is when Firebase has restored the session (if any)
let ready = null;
const restored = () => ready || (ready = boot().then(f => new Promise(res => {
  const off = f.A.onAuthStateChanged(f.auth, () => { off(); res(f); }, () => res(f));
})).catch(e => { ready = null; throw e; }));

// { uid, name } of the signed-in account, or null (also with no config or when Firebase fails)
export async function session() {
  if (!enabled) return null;
  try {
    const u = (await restored()).auth.currentUser;
    return u ? { uid: u.uid, name: String(u.displayName || u.email || '') } : null;
  } catch (e) { return null; }
}

// Google sign-in in a popup; false when it is closed, blocked or fails. A second call meanwhile shares the one popup
let popup = null;
export function signIn() {
  if (!enabled) return Promise.resolve(false);
  return popup || (popup = (async () => {
    try {
      const f = await restored();
      await f.A.signInWithPopup(f.auth, new f.A.GoogleAuthProvider());
      return !!f.auth.currentUser;
    } catch (e) { return false; }
  })().finally(() => { popup = null; }));
}

export async function signOut() {
  if (!enabled) return;
  try { const f = await restored(); await f.A.signOut(f.auth); } catch (e) {}
}

// Every document send goes through this one chain, and each send reads the entry when its turn comes, so two sends of one
// document cannot land out of order and the cloud ends with the latest save. force: send even when not pending (syncAll decided).
// Before it writes, a send reads the cloud copy: if that moved since the device last synced (its at is not base), the device
// copy is first merged with it, so a device that is behind never lowers what another one sent. A failed read writes nothing.
let chain = Promise.resolve();
const send = (uid, profile, game, force) => chain = chain.then(async () => {
  try {
    const s = await session();
    if (!s || s.uid !== uid) return;
    const f = await boot();
    if (!force) rebase(uid);   // a push may come before any syncAll: marks of another account must not say synced
    const find = () => entries().find(x => x.profile === profile && x.game === game);
    let e = find();
    if (!e || (!force && !e.pending)) return;
    const ref = f.F.doc(f.db, 'users', uid, 'profiles', profile, 'games', game);
    const snap = await within(f.F.getDoc(ref));
    const r = snap.exists() ? snap.data() : null;
    if (r && number(r.at) && r.at !== e.base) {
      const m = merge(e.data, r.data, e.at > r.at);
      if (!same(m, e.data)) {
        if (!merged(profile, game, m, e.at, r.at)) return;   // saved again meanwhile, or not stored: it stays pending
        e = find();   // no await since merged(): this is the merged document
        if (!e) return;
      }
    }
    await within(f.F.setDoc(ref, { data: e.data, at: e.at }));
    pushed(profile, game, e.at);   // the at that was sent
  } catch (e) {}
});

// sends one pending document
export async function push(profile, game) {
  try {
    const s = await session();
    if (s) await send(s.uid, profile, game, false);
  } catch (e) {}
}

// Settles every profile and game between the device and the cloud. True when the device changed (a profile added, a document
// pulled or a document merged), false when nothing did, and false when it failed before anything changed. Overlapping calls share one run
let running = null;
export function syncAll() {
  if (!enabled) return Promise.resolve(false);
  return running || (running = run().finally(() => { running = null; }));
}
async function run() {
  let changed = false;
  try {
    const s = await session();
    if (!s) return false;
    const { F, db } = await boot();
    rebase(s.uid);   // before any entries(): after a different account the marks must already be reset
    const base = ['users', s.uid, 'profiles'];
    const snap = await within(F.getDocs(F.collection(db, ...base)));
    // a cloud profile counts only when its id is the slug of its name, so a name is never shown under a foreign id
    const cloud = [];
    snap.forEach(d => { const n = d.data().name; if (typeof n === 'string' && slug(n) === d.id) cloud.push({ id: d.id, name: n.trim() }); });
    changed = addProfiles(cloud);
    for (const p of profiles()) if (!cloud.some(c => c.id === p.id)) { try { await within(F.setDoc(F.doc(db, ...base, p.id), { name: p.name })); } catch (e) {} }   // a refused one skips nothing else
    for (const { id } of profiles()) {
      try {
        const snapG = await within(F.getDocs(F.collection(db, ...base, id, 'games')));
        const remote = new Map(), odd = new Set();
        snapG.forEach(d => { const v = d.data(); if (v && number(v.at) && v.data !== undefined) remote.set(d.id, v); else odd.add(d.id); });
        // from here to the last pulled() there is no await: a save() landing during the downloads is seen in this snapshot,
        // and none can land between settle and pulled
        const local = new Map(entries().filter(e => e.profile === id).map(e => [e.game, e]));
        const sends = [];
        for (const game of new Set([...local.keys(), ...remote.keys()])) {
          const l = local.get(game), r = remote.get(game);
          const todo = settle(l ? { at: l.at, base: l.base, pending: l.pending } : null, r ? { at: r.at } : null);
          if (todo === 'pull') { pulled(id, game, r.data, r.at); changed = true; }
          else if (todo === 'merge') {
            const m = merge(l.data, r.data, l.at > r.at);
            // equal to the cloud copy: take it (no write up). A tie in at with another document is not pulled: the document
            // would change under the same at, and a game page that loaded it would not notice
            if (same(m, r.data) && (l.at !== r.at || same(l.data, r.data))) { pulled(id, game, r.data, r.at); changed = true; }
            else if (merged(id, game, m, l.at, r.at)) { sends.push(l); changed = true; }
          }
          else if (todo === 'push') sends.push(l);
        }
        for (const l of sends) if (!odd.has(l.game)) await send(s.uid, id, l.game, true);   // a cloud copy we cannot read is not overwritten blindly
      } catch (e) {}   // one profile failing leaves its documents pending and the others go on
    }
  } catch (e) {}
  return changed;
}
