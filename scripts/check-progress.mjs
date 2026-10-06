// Checks the cloud copy of the progress: the pure rules (the id of a profile, who wins when a document exists on the
// device and in the cloud) and the store of profiles and sync marks in shared/progress.js, run over a fake localStorage.
// Run: node scripts/check-progress.mjs
import { slug, settle } from '../shared/sync.js';

// the fake goes on globalThis before progress.js is evaluated; sections clear it and put the good store back
const mem = new Map();
const good = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => { mem.delete(k); } };
globalThis.localStorage = good;
const P = await import('../shared/progress.js');

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };

// slug: [input, expected]
const SLUGS = [
  ['Xavi', 'xavi'], [' Laia ', 'laia'],
  ['Júlia', 'julia'], ['Àlex B', 'alex-b'], ['Xavi!', 'xavi'],
  ['', ''], ['   ', ''], ['!!!', ''], ['abcdefghijklm', ''], [null, ''], [7, ''],
  ['abcdefghijkl', 'abcdefghijkl'],
];
for (const [name, want] of SLUGS) check(slug(name) === want, `slug(${JSON.stringify(name)}) is ${JSON.stringify(slug(name))}, want ${JSON.stringify(want)}`);

// settle: [local, remote, expected]
const SETTLES = [
  [null, null, 'none'],
  [{ at: 5, base: null, pending: true }, null, 'push'],
  [{ at: 5, base: 5, pending: false }, null, 'push'],
  [null, { at: 9 }, 'pull'],
  [{ at: 5, base: 5, pending: false }, { at: 5 }, 'none'],
  [{ at: 5, base: 5, pending: false }, { at: 9 }, 'pull'],
  [{ at: 7, base: 5, pending: true }, { at: 5 }, 'push'],
  [{ at: 7, base: 5, pending: true }, { at: 6 }, 'push'],
  [{ at: 7, base: 5, pending: true }, { at: 9 }, 'pull'],
  [{ at: 7, base: 5, pending: true }, { at: 7 }, 'pull'],   // a tie goes to the cloud
  [{ at: 0, base: null, pending: true }, { at: 1 }, 'pull'],   // migrated document
  [{ at: 3, base: 5, pending: true }, { at: 5 }, 'push'],   // pending and the cloud equals base: sent whatever the clocks say
  [{ at: 9, base: 9, pending: false }, { at: 5 }, 'pull'],   // not pending and the cloud differs from base
  [{ at: 9, base: 5, pending: false }, { at: 5 }, 'none'],   // not pending and the cloud equals base
];
for (const [local, remote, want] of SETTLES) {
  const got = settle(local, remote);
  check(got === want, `settle(${JSON.stringify(local)}, ${JSON.stringify(remote)}) is ${got}, want ${want}`);
}

// progress.js sections. Every expected value is contract: plan task 2 (task-2-brief.md), unless a comment says otherwise.
const section = (name, fn) => {
  mem.clear(); globalThis.localStorage = good;
  try { fn(); } catch (e) { check(false, `${name} threw ${e && e.message}`); }
  finally { globalThis.localStorage = good; }
};
const markOf = key => { try { return JSON.parse(mem.get('sync'))[key]; } catch (e) { return undefined; } };
const isMark = (m, at, base, pending) => !!m && m.at === at && m.base === base && m.pending === pending;
const entry = (game, profile = 'xavi') => P.entries().find(e => e.profile === profile && e.game === game);
const start = (...names) => { for (const n of names) P.add(n); P.choose(slug(names[0])); };   // first name becomes active

section('no profile', () => {
  check(P.load('x') === null, 'no profile: load is null');   // contract: no active profile, load gives null
  P.save('x', { a: 1 });
  check(mem.size === 0, 'no profile: save leaves the store empty');   // contract: no active profile, save does nothing
});

section('add', () => {
  check(P.add('Xavi') === 'xavi', 'add Xavi gives xavi');   // contract: add returns the slug
  check(P.add('xavi') === '', 'add xavi again gives empty');   // contract: id already there
  check(P.add('!!!') === '', 'add !!! gives empty');   // contract: empty slug
  const l = P.profiles();
  check(l.length === 1 && l[0].id === 'xavi' && l[0].name === 'Xavi', 'profiles has { xavi, Xavi }');   // contract: one entry
});

section('two profiles do not trample', () => {
  P.add('Xavi'); P.add('Laia');
  P.choose('xavi'); P.save('joc', { n: 1 });
  P.choose('laia');
  check(P.load('joc') === null, 'laia starts without xavi\'s document');   // contract: documents are per profile
  P.save('joc', { n: 2 });
  P.choose('xavi');
  check(P.load('joc') && P.load('joc').n === 1, 'back on xavi, n is 1');   // contract: xavi keeps n 1
  P.choose('laia');
  check(P.load('joc') && P.load('joc').n === 2, 'laia keeps n 2');   // contract: laia keeps n 2 (same rule as xavi)
});

section('adoption', () => {
  const stores = ['salts-de-granota', 'abac-xines'];
  mem.set('salts-de-granota', '{"secs":[3]}');
  P.add('Xavi'); P.choose('xavi', stores);
  const d = P.load('salts-de-granota');
  check(d && d.secs && d.secs[0] === 3, 'adoption: xavi has the old document');   // contract: secs[0] is 3
  check(!mem.has('salts-de-granota'), 'adoption: the old key is gone');   // contract: old key deleted
  check(isMark(markOf('xavi:salts-de-granota'), 0, null, true), 'adoption: mark is { at 0, base null, pending }');   // contract: adoption mark
  check(!mem.has('xavi:abac-xines') && markOf('xavi:abac-xines') === undefined, 'adoption: a store with no old key makes nothing');   // contract: only stores with an old key
  P.add('Laia'); P.choose('laia', stores);
  check(P.load('salts-de-granota') === null, 'adoption: the second profile gets nothing');   // contract: laia gets null
});

section('adoption does not trample', () => {
  P.add('Xavi');
  mem.set('xavi:abac-xines', '{"keep":1}'); mem.set('abac-xines', '{"old":1}');
  P.choose('xavi', ['abac-xines']);
  const d = P.load('abac-xines');
  check(d && d.keep === 1 && d.old === undefined, 'no trample: xavi\'s document stays as it was');   // contract: existing document stays
  check(!mem.has('abac-xines'), 'no trample: the old key is deleted anyway');   // contract: old key deleted in both cases
  check(markOf('xavi:abac-xines') === undefined, 'no trample: no mark made for the kept document');   // contract: only a copy gets the adoption mark
});

section('marks', () => {
  start('Xavi');
  P.save('joc', { n: 1 });
  const e1 = entry('joc');
  check(e1 && e1.pending === true && e1.at > 0 && e1.data.n === 1 && e1.base === null, 'marks: after save pending, at > 0, base null');   // contract: save marks pending
  P.save('joc', { n: 2 });
  const e2 = entry('joc');
  check(e1 && e2 && e2.at > e1.at, 'marks: two saves in a row give a growing at');   // contract: strictly increasing at
});

section('pushed', () => {
  start('Xavi');
  P.save('joc', { n: 1 });
  const a = entry('joc').at;
  P.pushed('xavi', 'joc', a);
  check(isMark(markOf('xavi:joc'), a, a, false), 'pushed: with the entry\'s at, not pending and base is at');   // contract: pushed clears pending, base = at
  P.save('joc', { n: 2 });
  const old = entry('joc').at;
  P.save('joc', { n: 3 });
  const now = entry('joc').at;
  P.pushed('xavi', 'joc', old);
  check(isMark(markOf('xavi:joc'), now, a, true), 'pushed: with a stale at, the mark stays pending');   // contract: stale pushed leaves it pending (base stays the earlier push)
});

section('pulled', () => {
  start('Xavi');
  P.pulled('xavi', 'joc', { n: 9 }, 50);
  check(P.load('joc') && P.load('joc').n === 9, 'pulled: load gives n 9');   // contract: n is 9
  check(isMark(markOf('xavi:joc'), 50, 50, false), 'pulled: mark is { 50, 50, not pending }');   // contract: pulled mark
});

section('rebase', () => {
  start('Xavi');
  P.save('a', { n: 1 }); P.save('b', { n: 2 });
  check(P.rebase('u1') === true, 'rebase u1 the first time is true');   // contract: new account value
  check(P.rebase('u1') === false, 'rebase u1 the second time is false');   // contract: same account
  P.pushed('xavi', 'a', entry('a').at); P.pushed('xavi', 'b', entry('b').at);
  const before = P.entries().map(e => e.game + e.at).sort().join();
  check(P.entries().every(e => !e.pending && e.base === e.at), 'rebase: set-up has everything synced');   // contract: pushed leaves { at, base at, not pending }
  check(P.rebase('u2') === true, 'rebase u2 is true');   // contract: another account
  const es = P.entries();
  check(es.length === 2 && es.every(e => e.base === null && e.pending === true), 'rebase u2: all base null and pending');   // contract: all marks reset
  check(es.map(e => e.game + e.at).sort().join() === before, 'rebase u2: at is unchanged');   // contract: same at
  check(mem.get('compte') === 'u2', 'rebase: compte holds the uid');   // contract: compte is the uid as a plain string
});

section('addProfiles', () => {
  P.add('Xavi');
  const list = [{ id: 'laia', name: 'Laia' }, { id: 'xavi', name: 'Altre' }, { id: 7 }];
  check(P.addProfiles(list) === true, 'addProfiles adds and says so');   // contract: true when one was added
  const l = P.profiles();
  check(l.length === 2 && l.some(p => p.id === 'laia' && p.name === 'Laia') && l.find(p => p.id === 'xavi').name === 'Xavi', 'addProfiles adds only laia');   // contract: xavi stays, junk dropped
  check(P.addProfiles(list) === false, 'addProfiles again is false');   // contract: nothing new
});

section('corrupt store', () => {
  mem.set('perfils', '{'); mem.set('sync', '"x"'); mem.set('perfil', 'ningu');
  check(P.profiles().length === 0, 'corrupt: profiles is []');   // contract: not a list gives []
  check(P.active() === null, 'corrupt: active is null');   // contract: perfil not in the list gives null
  check(P.entries().length === 0, 'corrupt: entries is []');   // contract: corrupt sync gives []
  P.save('joc', { n: 1 }); check(P.load('joc') === null, 'corrupt: save and load do nothing');   // contract: no active profile
  mem.clear();
  mem.set('perfils', JSON.stringify([{ id: 'a' }, { id: 'b', name: 'B' }, null, 7, { id: 3, name: 'C' }]));
  check(P.profiles().length === 1 && P.profiles()[0].id === 'b', 'corrupt: profiles drops entries without text id and name');   // contract: plan task 2 rule on profiles()
  mem.set('perfil', 'b'); mem.set('b:joc', '{"n":1}'); mem.set('b:rota', '{');
  mem.set('sync', JSON.stringify({ 'b:joc': { at: 4, base: null, pending: true }, 'b:rota': { at: 5, base: null, pending: true }, 'b:cap': { at: 6, base: null, pending: true }, 'b:mala': { at: 'x' }, mal: { at: 1 } }));
  const es = P.entries();
  check(es.length === 1 && es[0].game === 'joc' && es[0].at === 4, 'corrupt: entries keeps only well-formed ones');   // contract: numeric at and a parseable document
});

section('throwing store', () => {
  const boom = () => { throw new Error('boom'); };
  globalThis.localStorage = { getItem: boom, setItem: boom, removeItem: boom };
  check(P.profiles().length === 0, 'throwing: profiles is []');   // contract: reads give the empty value
  check(P.add('Xavi') === '', 'throwing: add gives empty');   // contract: the write did not stick
  P.save('joc', { n: 1 }); check(P.load('joc') === null, 'throwing: save and load do not throw');   // contract: nothing throws
  P.choose('xavi', ['joc']); check(P.entries().length === 0 && P.active() === null, 'throwing: choose and entries do not throw');   // contract: nothing throws
  check(P.rebase('u1') === false, 'throwing: rebase says false');   // contract: compte could not be written, so no claim of change
  delete globalThis.localStorage;
  check(P.profiles().length === 0 && P.add('Xavi') === '' && P.load('joc') === null, 'no localStorage at all: nothing throws');   // contract: decision 7, also when localStorage is undefined
});

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log('progress rules and store: ok');
