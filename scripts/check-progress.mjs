// Checks the cloud copy of the progress: the pure rules (the id of a profile, who wins when a document exists on the
// device and in the cloud) and the store of profiles and sync marks in shared/progress.js, run over a fake localStorage.
// Run: node scripts/check-progress.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { slug, settle, merge, same } from '../shared/sync.js';

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
  ['abcdefghijkl', 'abcdefghijkl'], [' abcdefghijkl ', 'abcdefghijkl'],   // the limit counts the trimmed name
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
  [{ at: 7, base: 5, pending: true }, { at: 6 }, 'merge'],   // contract: plan «El progrés no baixa mai», tasca 3: pending and the cloud moved is a merge, whatever the clocks say
  [{ at: 7, base: 5, pending: true }, { at: 9 }, 'merge'],   // contract: plan «El progrés no baixa mai», tasca 3
  [{ at: 7, base: 5, pending: true }, { at: 7 }, 'merge'],   // contract: plan «El progrés no baixa mai», tasca 3 (a tie used to go to the cloud)
  [{ at: 0, base: null, pending: true }, { at: 1 }, 'merge'],   // contract: plan «El progrés no baixa mai», tasca 3 (migrated document)
  [{ at: 3, base: 5, pending: true }, { at: 5 }, 'push'],   // pending and the cloud equals base: sent whatever the clocks say
  [{ at: 9, base: 9, pending: false }, { at: 5 }, 'pull'],   // not pending and the cloud differs from base
  [{ at: 9, base: 5, pending: false }, { at: 5 }, 'none'],   // not pending and the cloud equals base
];
for (const [local, remote, want] of SETTLES) {
  const got = settle(local, remote);
  check(got === want, `settle(${JSON.stringify(local)}, ${JSON.stringify(remote)}) is ${got}, want ${want}`);
}

// merge: [a, b, aNewer, expected]. Every row is contract: plan «El progrés no baixa mai», tasca 1.
const MERGES = [
  [{ secs: [3, 0] }, { secs: [1, 5] }, true, { secs: [3, 5] }],
  [{ secs: [1, 2] }, { secs: [0, 0, 7] }, true, { secs: [1, 2, 7] }],
  [{ so: false, best: 4 }, { so: true, best: 9 }, true, { so: false, best: 9 }],
  [{ so: false, best: 4 }, { so: true, best: 9 }, false, { so: true, best: 9 }],
  [{ best: 4 }, { so: false, best: 1 }, true, { so: false, best: 4 }],
  [{ piscina: false, equip: -1, exams: [true, false, false], notes: [80, 0], fulls: 3 }, { piscina: true, equip: 1, exams: [false, true, false], notes: [40, 100], fulls: 5 }, true,
    { piscina: true, equip: 1, exams: [true, true, false], notes: [80, 100], fulls: 5 }],
  [{ equip: 0 }, { equip: 2 }, true, { equip: 2 }],
  [{ best: 2, coet: 9 }, { best: 5, secs: [10, 0, 0, 0, 0] }, false, { best: 5, coet: 9, secs: [10, 0, 0, 0, 0] }],
  [{ secs: 'x' }, { secs: [1] }, true, { secs: 'x' }],
  [{ secs: 'x' }, { secs: [1] }, false, { secs: [1] }],
  [null, { secs: [1] }, true, { secs: [1] }],
  [{ secs: [1] }, null, false, { secs: [1] }],
  [[1, 5], [3, 2], true, [3, 5]],
  [{ n: 1 }, { n: 1, constructor: 5 }, true, { n: 1, constructor: 5 }],   // contract: revisió de les tasques 1 i 2, a key that Object.prototype has, on one side only
  [{ n: 1, toString: 'a' }, { n: 2 }, false, { n: 2, toString: 'a' }],   // contract: revisió de les tasques 1 i 2, same on the other side
];
for (const [a, b, aNewer, want] of MERGES) {
  const label = `merge(${JSON.stringify(a)}, ${JSON.stringify(b)}, ${aNewer})`;
  const a0 = JSON.stringify(a), b0 = JSON.stringify(b);
  const got = merge(a, b, aNewer);
  check(same(got, want), `${label} is ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  check(JSON.stringify(a) === a0 && JSON.stringify(b) === b0, `${label} changed an argument`);
  const back = merge(b, a, !aNewer);
  check(same(back, got), `merge swapped for ${label} is ${JSON.stringify(back)}, want ${JSON.stringify(got)}`);
}

// same: [a, b, expected]. Every row is contract: plan «El progrés no baixa mai», tasca 1.
const SAMES = [
  [{ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }, true], [[], [], true], [null, null, true],
  [[1, 2], [2, 1], false], [{ a: 1 }, { a: 2 }, false], [{ a: 1 }, { a: 1, b: 0 }, false],
  [null, {}, false], [[], {}, false], [0, false, false],
];
for (const [a, b, want] of SAMES) check(same(a, b) === want, `same(${JSON.stringify(a)}, ${JSON.stringify(b)}) is ${same(a, b)}, want ${want}`);

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
  const real = Date.now;
  Date.now = () => 1000;   // two saves in one millisecond
  try {
    start('Xavi');
    P.save('joc', { n: 1 });
    const e1 = entry('joc');
    check(e1 && e1.pending === true && e1.at > 0 && e1.data.n === 1 && e1.base === null, 'marks: after save pending, at > 0, base null');   // contract: save marks pending
    P.save('joc', { n: 2 });
    const e2 = entry('joc');
    check(e1 && e2 && e2.at === e1.at + 1, 'marks: two saves in the same millisecond give at + 1');   // contract: at = max(now, previous at + 1), strictly increasing
  } finally { Date.now = real; }
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
  P.pulled('xavi', 'a', {}, 50); P.pulled('xavi', 'b', {}, 60);
  check(P.rebase('u1') === true, 'rebase u1 the first time is true');   // contract: new account value
  check(isMark(markOf('xavi:a'), 50, null, true) && isMark(markOf('xavi:b'), 60, null, true), 'rebase u1: marks are { at, base null, pending } with their own at');   // contract: base null, pending true, at kept
  P.pushed('xavi', 'a', 50); P.pushed('xavi', 'b', 60);
  check(P.rebase('u1') === false, 'rebase u1 the second time is false');   // contract: same account
  check(isMark(markOf('xavi:a'), 50, 50, false) && isMark(markOf('xavi:b'), 60, 60, false), 'rebase u1 again: nothing touched');   // contract: same account changes nothing
  check(P.rebase('u2') === true, 'rebase u2 is true');   // contract: another account
  check(isMark(markOf('xavi:a'), 50, null, true) && isMark(markOf('xavi:b'), 60, null, true), 'rebase u2: marks are exactly { 50 | 60, null, pending }');   // contract: all marks reset, same at
  check(P.entries().length === 2, 'rebase u2: both entries still there');   // contract: the documents stay
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

// ---- fix round 1 ----
// a store over `mem` that refuses writes (throws) when refuse(key) is true
const refusing = refuse => ({ getItem: good.getItem, removeItem: good.removeItem, setItem: (k, v) => { if (refuse(k)) throw new Error('refused ' + k); good.setItem(k, v); } });

section('save: the mark write fails', () => {   // review I1
  start('Xavi');
  P.save('joc', { n: 1 }); P.pushed('xavi', 'joc', entry('joc').at);
  globalThis.localStorage = refusing(k => k === 'sync');
  P.save('joc', { n: 2 });
  const e = entry('joc');
  check(!(P.load('joc').n === 2 && e && e.pending === false), 'mark write fails: never a changed document marked as synced');   // contract: fix round 1 I1
});

section('choose(null) and unknown id', () => {   // review I3
  start('Xavi'); P.save('joc', { n: 1 });
  P.choose(null);
  check(P.active() === null && P.load('joc') === null && !mem.has('perfil'), 'choose(null): no active profile, load null, no perfil key');   // contract: null clears the active profile
  P.choose('xavi'); P.choose('ningu');
  check(P.active() === null && !mem.has('perfil'), 'choose(unknown id) acts like choose(null)');   // contract: decision 2 of the task 2 brief
});

section('unreadable document and circular data', () => {   // review I4
  start('Xavi');
  mem.set('xavi:joc', '{');
  check(P.load('joc') === null, 'unreadable document: load is null');   // contract: reads never throw
  mem.delete('xavi:joc');
  const c = {}; c.me = c;
  P.save('joc', c);
  check(!mem.has('xavi:joc'), 'circular data: save stores no document');   // contract: nothing throws, nothing written
});

section('writes that do not stick', () => {   // review I5
  globalThis.localStorage = { getItem: good.getItem, removeItem: good.removeItem, setItem: () => {} };   // silently drops
  check(P.add('Xavi') === '', 'silent no-op setItem: add gives empty');   // contract: add gives '' when the write did not stick
  mem.clear(); globalThis.localStorage = good;
  start('Xavi');
  globalThis.localStorage = refusing(k => k === 'xavi:joc');
  P.save('joc', { n: 1 });
  check(!mem.has('xavi:joc') && P.load('joc') === null && P.entries().length === 0, 'refused document: absent, load null, entries []');   // contract: nothing written, nothing listed
  mem.clear(); globalThis.localStorage = good;
  mem.set('salts', '{"a":1}'); P.add('Xavi');
  globalThis.localStorage = refusing(k => k === 'xavi:salts');
  P.choose('xavi', ['salts']);
  check(mem.get('salts') === '{"a":1}', 'refused adoption copy: the old key stays');   // contract: the old progress is not lost
});

section('half-failed adoption', () => {   // review M1
  mem.set('joc', '{"n":1}'); P.add('Xavi');
  globalThis.localStorage = refusing(k => k === 'sync');
  P.choose('xavi', ['joc']);
  globalThis.localStorage = good;
  P.choose('xavi', ['joc']);
  check(isMark(markOf('xavi:joc'), 0, null, true) && !mem.has('joc') && P.load('joc').n === 1, 'second choose leaves the adopted document with its { 0, null, pending } mark');   // contract: adoption mark, old key deleted
});

section('rebase when the marks cannot be written', () => {   // review M2
  start('Xavi'); P.save('joc', { n: 1 });
  globalThis.localStorage = refusing(k => k === 'sync');
  check(P.rebase('u2') === false && mem.get('compte') !== 'u2', 'sync refused: rebase is false and compte is not changed');   // contract: only a stuck marks write counts
});

section('pulled with a bad at', () => {   // review M3
  start('Xavi');
  P.pulled('xavi', 'joc', { n: 1 }, undefined); P.pulled('xavi', 'joc', { n: 1 }, '50');
  check(P.load('joc') === null, 'pulled with undefined or text at writes nothing');   // contract: at must be a finite number
});

section('profiles(): bad ids', () => {   // review M4
  mem.set('perfils', JSON.stringify([{ id: '', name: 'A' }, { id: 'a:b', name: 'B' }, { id: 'x', name: 'first' }, { id: 'x', name: 'second' }, { id: 'ok', name: 'Ok' }]));
  const l = P.profiles();
  check(l.length === 2 && l[0].id === 'x' && l[0].name === 'first' && l[1].id === 'ok', 'profiles drops empty and ":" ids and keeps the first duplicate');   // contract: fix round 1 M4
  mem.clear();
  check(P.addProfiles([{ id: 'a:b', name: 'X' }, { id: '', name: 'Y' }]) === false && P.profiles().length === 0, 'addProfiles refuses ":" and empty ids');   // contract: nothing added
});

section('add trims the name', () => {   // review M6
  check(P.add(' Laia ') === 'laia' && P.profiles()[0].name === 'Laia', 'add stores the trimmed name');   // contract: name is trimmed
});

section('sync that is an array', () => {   // review M7
  start('Xavi');
  mem.set('sync', '[]');
  check(P.entries().length === 0, 'sync []: entries is []');   // contract: not an object gives no marks
  P.save('joc', { n: 1 });
  check(P.entries().length === 1, 'sync []: a following save yields one entry');   // contract: marks work again
});

section('save: the document write fails', () => {   // review N1
  start('Xavi');
  P.pulled('xavi', 'joc', { n: 5 }, 100);
  globalThis.localStorage = refusing(k => k === 'xavi:joc');
  P.save('joc', { n: 6 });
  check(isMark(markOf('xavi:joc'), 100, 100, false), 'document refused: the previous mark is put back');   // contract: fix round 2 N1
  check(settle(entry('joc'), { at: 200 }) === 'pull', 'document refused: a newer cloud still wins (pull)');   // contract: a stale document must not be pushed over newer cloud progress
  check(P.load('joc') && P.load('joc').n === 5, 'document refused: the old document stays');   // contract: nothing was written
  mem.clear(); globalThis.localStorage = good;
  start('Xavi');
  globalThis.localStorage = refusing(k => k === 'xavi:joc');
  P.save('joc', { n: 1 });
  check(markOf('xavi:joc') === undefined, 'document refused on a first save: no mark is left');   // contract: no previous mark, so none remains
});

// ---- «El progrés no baixa mai», task 2: save that does not trample, merged, account ----
// A page remembers the at of the mark it saw in its last load() or put in its last save(); a save over a document whose mark
// has another at (pulled, merged or saved by another page underneath) is merged with it instead of overwriting.
section('save: a page with old data merges what changed under it', () => {   // contract: task 2 brief, «Pàgina amb dades velles»
  start('Xavi');
  P.save('joc', { secs: [1, 0] }); P.load('joc');
  P.pulled('xavi', 'joc', { secs: [3, 0] }, 50);
  P.save('joc', { secs: [1, 1] });
  const e = entry('joc');
  check(e && same(e.data, { secs: [3, 1] }) && e.pending === true, `old page: the document is ${JSON.stringify(e && e.data)} pending ${e && e.pending}, want { secs: [3, 1] } pending`);
  check(e && e.base === 50, `old page: the mark keeps base 50 (got ${e && e.base})`);   // contract: save keeps the base of the previous mark, merge or not
});

section('save: a page that merged keeps merging until it loads again', () => {   // contract: spec, Esmena 2026-10-06, «Què es perd a canvi»; ruling 4 del controlador
  // contract: revisió de les tasques 1 i 2, the clock is fixed so the merged save lands on the at the page remembers (same millisecond) every run
  const real = Date.now;
  Date.now = () => 1000;
  try {
  start('Xavi');
  P.save('joc', { secs: [1, 0] }); P.load('joc');
  P.pulled('xavi', 'joc', { secs: [3, 0] }, 50);
  P.save('joc', { secs: [1, 1] });
  P.save('joc', { secs: [1, 2] });
  let e = entry('joc');   // read with entries(): a load() would update what save remembers
  check(e && same(e.data, { secs: [3, 2] }) && e.pending === true, `merged page, next save: the document is ${JSON.stringify(e && e.data)} pending ${e && e.pending}, want { secs: [3, 2] } pending`);
  P.save('joc', { secs: [0, 0] });
  e = entry('joc');
  check(e && same(e.data, { secs: [3, 2] }), `merged page, a reset: the document is ${JSON.stringify(e && e.data)}, want { secs: [3, 2] } (a reset does not lower a page that already merged)`);
  P.load('joc');
  P.save('joc', { secs: [0, 0] });
  e = entry('joc');
  check(e && same(e.data, { secs: [0, 0] }), `after a new load, a reset: the document is ${JSON.stringify(e && e.data)}, want { secs: [0, 0] }`);
  } finally { Date.now = real; }
});

section('save: nothing changed underneath writes as it comes', () => {   // contract: task 2 brief, «Sense canvi per sota»
  start('Xavi');
  P.load('joc');
  P.save('joc', { secs: [5] });
  P.save('joc', { secs: [0] });
  check(same(P.load('joc'), { secs: [0] }), `no change underneath: the document is ${JSON.stringify(P.load('joc'))}, want { secs: [0] }`);
});

section('save: a page that never loaded merges over a document with a mark', () => {   // contract: decision of this task: remembered at is null when the page saw nothing, so any mark counts as changed
  start('Xavi');
  P.pulled('xavi', 'joc', { secs: [3] }, 50);
  P.save('joc', { secs: [1, 1] });
  check(same(P.load('joc'), { secs: [3, 1] }), `never loaded: the document is ${JSON.stringify(P.load('joc'))}, want { secs: [3, 1] }`);
});

section('save: the sound is the page\'s choice', () => {   // contract: task 2 brief, «El so»
  start('Xavi');
  P.load('joc');
  P.pulled('xavi', 'joc', { so: true, secs: [3] }, 50);
  P.save('joc', { so: false, secs: [1] });
  check(same(P.load('joc'), { so: false, secs: [3] }), `sound: the document is ${JSON.stringify(P.load('joc'))}, want { so: false, secs: [3] }`);
});

section('save: a document with no mark is not merged', () => {   // contract: task 2 rule «Si no hi ha document desat, o l'at és el recordat, s'escriu data tal com ve»
  start('Xavi');
  mem.set('xavi:joc', '{"secs":[9]}');
  P.load('joc');
  P.save('joc', { secs: [1] });
  check(same(P.load('joc'), { secs: [1] }), `no mark: the document is ${JSON.stringify(P.load('joc'))}, want { secs: [1] }`);
});

section('merged', () => {   // contract: task 2 brief, «merged»
  const real = Date.now;
  Date.now = () => 100;
  try {
    start('Xavi');
    P.save('joc', { n: 1 }); P.load('joc');
    const seen = entry('joc').at;
    check(P.merged('xavi', 'joc', { n: 9 }, seen, 200) === true, 'merged with the mark\'s at is true');
    check(same(entry('joc').data, { n: 9 }), `merged: the document is ${JSON.stringify(entry('joc').data)}, want { n: 9 }`);   // read with entries(): a load() here would update what save remembers
    check(isMark(markOf('xavi:joc'), 201, 200, true), `merged: the mark is ${JSON.stringify(markOf('xavi:joc'))}, want { at: max(100, seen + 1, 201), base: 200, pending }`);
    P.save('joc', { n: 1 });
    check(same(entry('joc').data, { n: 9 }), `after merged the page's own save merges: ${JSON.stringify(entry('joc').data)}, want { n: 9 }`);   // contract: merged does not touch what save remembers
    const before = JSON.stringify(markOf('xavi:joc')), doc = mem.get('xavi:joc'), at = markOf('xavi:joc').at;
    check(P.merged('xavi', 'joc', { n: 5 }, 7, 300) === false && JSON.stringify(markOf('xavi:joc')) === before && mem.get('xavi:joc') === doc, 'merged with an old at is false and changes nothing');
    check(P.merged('xavi', 'nou', { n: 5 }, 0, 300) === false && !mem.has('xavi:nou') && markOf('xavi:nou') === undefined, 'merged with no mark is false and writes nothing');   // contract: only a document with a mark whose at is seenAt
    globalThis.localStorage = refusing(k => k === 'xavi:joc');
    check(P.merged('xavi', 'joc', { n: 5 }, at, 400) === false && JSON.stringify(markOf('xavi:joc')) === before && mem.get('xavi:joc') === doc, 'merged with the document refused is false and puts the previous mark back');
  } finally { Date.now = real; }
});

section('merged: the at is the largest of now, seenAt + 1 and cloudAt + 1', () => {   // contract: revisió de les tasques 1 i 2; plan: at = max(Date.now(), seenAt + 1, cloudAt + 1)
  const real = Date.now;
  try {
    start('Xavi');
    Date.now = () => 1000;
    P.pulled('xavi', 'joc', { n: 1 }, 100);
    check(P.merged('xavi', 'joc', { n: 9 }, 100, 200) === true && isMark(markOf('xavi:joc'), 1000, 200, true), `merged, now the largest: the mark is ${JSON.stringify(markOf('xavi:joc'))}, want { at: 1000, base: 200, pending }`);
    Date.now = () => 100;
    P.pulled('xavi', 'joc', { n: 1 }, 500);
    check(P.merged('xavi', 'joc', { n: 9 }, 500, 200) === true && isMark(markOf('xavi:joc'), 501, 200, true), `merged, seenAt + 1 the largest: the mark is ${JSON.stringify(markOf('xavi:joc'))}, want { at: 501, base: 200, pending }`);
  } finally { Date.now = real; }
});

section('merged: at and cloudAt must be numbers', () => {   // contract: revisió de les tasques 1 i 2; plan: a mark without a numeric at hides the document from entries()
  start('Xavi');
  P.pulled('xavi', 'joc', { n: 1 }, 100);
  const before = JSON.stringify(markOf('xavi:joc')), doc = mem.get('xavi:joc');
  for (const [seenAt, cloudAt] of [[100, 'x'], [100, null], [100, NaN], [100, undefined], ['100', 200], [null, 200], [NaN, 200]]) {
    check(P.merged('xavi', 'joc', { n: 9 }, seenAt, cloudAt) === false && JSON.stringify(markOf('xavi:joc')) === before && mem.get('xavi:joc') === doc, `merged(…, ${String(seenAt)}, ${String(cloudAt)}) is not false or changed the store`);
  }
});

section('save: keys that exist on Object.prototype do not stop the merge', () => {   // contract: revisió de les tasques 1 i 2; plan: merge does not throw, so save still merges
  start('Xavi');
  P.load('joc');
  P.pulled('xavi', 'joc', JSON.parse('{"secs":[9],"constructor":1}'), 50);
  P.save('joc', { secs: [1] });
  const e = entry('joc');
  check(e && Array.isArray(e.data.secs) && e.data.secs[0] === 9, `prototype key: the document is ${JSON.stringify(e && e.data)}, want secs [9] merged in`);
});

section('merged and pulled leave what save remembers', () => {   // contract: common.md detail 6
  start('Xavi');
  P.save('joc', { secs: [1] }); P.load('joc');
  const seen = entry('joc').at;
  P.merged('xavi', 'joc', { secs: [4] }, seen, 10);
  P.pulled('xavi', 'joc', { secs: [6] }, 20);
  P.save('joc', { secs: [2] });
  check(same(P.load('joc'), { secs: [6] }), `merged then pulled: the next save gives ${JSON.stringify(P.load('joc'))}, want { secs: [6] }`);
});

section('account', () => {   // contract: task 2 brief, «account»
  start('Xavi');
  check(P.account() === null, 'account without compte is null');
  P.rebase('u1');
  check(P.account() === 'u1', 'account after rebase u1 is u1');
});

// ---- the hub, read as text (no browser here): the door back to «Qui juga?», its texts, names as text, the size of the controls, the tap guard
{
  const root = new URL('../', import.meta.url);
  const src = f => readFileSync(new URL(f, root), 'utf8');
  const bare = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');   // comments out
  const html = src('index.html'), main = bare(src('hub/main.js')), css = bare(src('hub/style.css')), prog = bare(src('shared/progress.js'));
  const hub = f => /<html\b[^>]*\sdata-hub(\s|=|>)/.test(f);
  check(hub(html), 'index.html: <html> has no data-hub, so the hub would send itself back to itself forever on a fresh device');   // contract: Task 3 rule, progress.js redirects any page without data-hub when no profile is active
  const pages = readdirSync(root).filter(f => f.endsWith('.html') && f !== 'index.html');
  check(pages.length >= 6 && pages.every(f => !hub(src(f))), `a game page has data-hub and would never go back to the hub: ${pages.filter(f => hub(src(f)))}`);   // contract: the six game pages (plus the one of the coet) must redirect
  check(/typeof window !== 'undefined' && !active\(\) && !document\.documentElement\.hasAttribute\('data-hub'\)\) location\.replace\('index\.html'\)/.test(prog), 'progress.js: the redirect to index.html is missing or lost one of its three conditions (browser only, no active profile, no data-hub)');   // contract: Task 3 rule; Node must import the file, so window comes first
  for (const t of ['Qui juga?', 'Afegeix un jugador', 'Fet', 'Canvia', "Aquest nom no val. Prova'n un altre."]) check(html.includes(`>${t}<`), `index.html: the text «${t}» is missing`);   // contract: Task 3 brief, the five screen texts
  check(html.includes('maxlength="12"'), 'index.html: the name box has no maxlength="12"');   // contract: slug() accepts at most 12 characters
  check(!/segon|company/i.test(html), 'index.html: a text speaks of a second player or companions');   // contract: owner decision 2026-10-05, the child plays alone
  const cards = /function cards\(\) \{([\s\S]*?)\n\}/.exec(main)?.[1] || '';
  check(cards.includes('innerHTML'), 'main.js: cards() was not found or does not paint with innerHTML');   // contract: the card html stays as it was
  check(main.split('innerHTML').length === 2, `main.js: ${main.split('innerHTML').length - 1} uses of innerHTML, only cards() may have one`);   // contract: brief rule, a profile name never goes through innerHTML
  check([...cards.matchAll(/\$\{([^}]*)\}/g)].every(m => !/name|profile|active|stores/i.test(m[1])), 'main.js: the template of cards() interpolates a profile or its name');   // contract: names can come from the cloud
  check(/b\.textContent = p\.name/.test(main) && /\$\('name'\)\.textContent = /.test(main), 'main.js: a profile name is not written with textContent (button or active name)');   // contract: brief rule, textContent only
  const minHeight = sel => Math.max(0, ...[...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(m => m[1].split(',').map(x => x.trim()).includes(sel)).map(m => +(/min-height:\s*(\d+)px/.exec(m[2])?.[1] || 0)));
  for (const sel of ['.me .btn', '.who .btn', '.adder input']) check(minHeight(sel) >= 44, `style.css: ${sel} has min-height ${minHeight(sel)}px, under 44`);   // contract: Task 3 brief, no control under 44 px
  // the guards (fix round 1): a list takes no input while any reason holds it; hold() only extends, render() never lifts one
  const body = (re) => re.exec(main)?.[1] || '';
  const fnBody = name => body(new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n\\}`));
  const render = fnBody('render'), hold = fnBody('hold'), start = fnBody('start');
  check(/games: \{ el: list \}/.test(main) && /who: \{ el: \$\('profiles'\) \}/.test(main), 'main.js: the gates are not the game list and the list of profiles (the name box and Fet must stay usable)');   // contract: fix round 1 N1, a sync repaint must not interrupt typing
  check(/g\.el\.toggleAttribute\('inert', !!g\.tap\)/.test(main) && !/\.inert\s*=/.test(main) && !/classList\.(add|remove)\('wait'\)/.test(main), 'main.js: a gate is not applied as the inert attribute (toggleAttribute) from its reasons, or the property is set');   // contract: fix round 1 C1, one mechanism (inert) for every guard, keyboard included
  check(/if \(g\.tap && end <= g\.end\) return;/.test(hold) && /setTimeout\(\(\) => \{ g\.tap = false; gate\(g\); \}, ms\)/.test(hold), 'main.js: hold() shortens a running hold or does not release it with a 500 ms timer');   // contract: fix round 1 N1, a guard that is running is only extended
  check(render.length > 200 && !/clearTimeout|\.inert\b|\.tap\b|\.cloud\b/.test(render), 'main.js: render() was not found or cancels, lifts or sets a guard itself (only hold() may)');   // contract: fix round 1 N1, the unconditional clear in render() let a sync repaint end the double-tap window
  check(/let seen = null;/.test(main) && main.split(/\bseen = /).length === 3 && render.includes("seen = me ? 'games' : 'who';"), "main.js: seen is not null before the first paint, or is not set from the view painted (me ? 'games' : 'who') only");   // contract: fix round 1 N1, the first paint arms no 500 ms guard; the reviewer's mutant seen = 'who' always
  check(render.indexOf("const changed = !!me && seen === 'who', back") >= 0 && render.indexOf("const changed") < render.indexOf('seen = me'), 'main.js: «changed» (who to games) is not taken from seen before seen is updated');   // contract: fix round 1 N1
  check(render.includes('if (changed || sync) hold(gates.games, 500);') && render.includes('if (sync || back) hold(gates.who, 500);') && render.includes("back = !me && seen === 'games'") && /function render\(sync\)/.test(main), 'main.js: a change of view or a sync repaint does not hold the rebuilt game list (500 ms), or a sync repaint or the way back to «Qui juga?» does not hold the list of profiles');   // contract: fix round 1 N1 and m8, both lists
  check(/\$\('change'\)\.onclick = [^\n]*\$\('open'\)\.focus\(/.test(main) && !/\$\('change'\)\.onclick = [^\n]*querySelector/.test(main), "main.js: after Canvia the focus does not go to «Afegeix un jugador» (outside the inert list)");   // contract: fix round 1 follow-up 2, focusing inside an inert list fails silently
  const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => [m[1].split(',').map(x => x.trim()), m[2]]);
  check(['.games[inert]', '.profiles[inert]'].every(sel => rules.some(([sels, d]) => sels.includes(sel) && /pointer-events:\s*none/.test(d))), 'style.css: a gated list has no [inert] pointer-events fallback for old browsers');   // contract: fix round 1 follow-up 1, inert is ignored before Chrome 102 / Safari 15.5
  check(/render\(true\)/.test(main) && main.split('render(true)').length === 2, 'main.js: only the repaint after a sync may call render(true)');   // contract: fix round 1 N1, sync is the only reason to hold without a change of view
  check(start.indexOf('!c.enabled') >= 0 && start.indexOf('!c.enabled') < start.indexOf('mount()'), 'main.js: start() does not test enabled before mounting the button');   // contract: fix round 1 C1 and I2, with enabled false no button (the lock and the always-unlock parts went with the cloud wait, plan «El progrés no baixa mai», tasca 5)
  check(!/\b(lock|unlock)\(|\b4000\b|\.cloud\b/.test(main.replace(/'cloud'/g, '')), 'main.js: the cloud wait is still there (lock, unlock, the 4 s cap or the cloud reason of a gate)');   // contract: plan «El progrés no baixa mai», tasca 5, «fora lock, unlock, el límit de 4 s i el motiu cloud»
  check(/if \(who !== null\) await sync\(\);/.test(start), 'main.js: start() does not sync after the first paint when a session is open');   // contract: Task 5 brief, session then syncAll
  check(/\$\('adder'\)\.onsubmit = e => \{([\s\S]*?)\n\};/.exec(main)?.[1].includes('if (id && who !== null) sync();'), 'main.js: the submit handler does not call sync() after a profile is added with a session open');   // contract: Task 5 brief, after adding a profile with a session open syncAll too (I2)
  check(!/insertAdjacentHTML|outerHTML|document\.write|\.srcdoc/.test(main), 'main.js: html is inserted by a route other than the one innerHTML of cards()');   // contract: brief rule, a name is text only, whatever the route
  // the account button (Task 5): present only with a Firebase config, loaded after the first paint, texts and sizes fixed
  check(!/^\s*import\b[^;]*cloud\.js/m.test(main) && !/^\s*export\b[^;]*from\s*['"][^'"]*cloud\.js/m.test(main), 'main.js: cloud.js is imported statically, Firebase would delay the hub');   // contract: Task 5 decision 1, import() after the first paint
  check(/import\(\s*['"]\.\.\/shared\/cloud\.js['"]\s*\)/.test(main), 'main.js: cloud.js is not loaded with import()');   // contract: Task 5 decision 1
  check(!html.includes('Desa el progrés al núvol') && !html.includes('Tanca la sessió'), 'index.html: the account button is in the page, it must not exist without a config');   // contract: Task 5 decision 2 and plan rule «Si enabled és false, el botó no existeix a la pàgina»
  for (const t of ['Desa el progrés al núvol', 'Tanca la sessió', "No s'ha pogut entrar. Torna-ho a provar."]) check(main.includes(`'${t}'`) || main.includes(`"${t}"`), `main.js: the text «${t}» is missing`);   // contract: Task 5 decision 3, the three screen texts
  check(/\bacct\.textContent = /.test(main), 'main.js: the account name is not written with textContent');   // contract: Task 5 decision 3, textContent only
  check(minHeight('.cloud .btn') >= 44, `style.css: .cloud .btn has min-height ${minHeight('.cloud .btn')}px, under 44`);   // contract: Task 5 decision 7, the account button is at least 44 px
  check(/btn\.onclick = async \(\) => \{\s*if \(busy\) return;\s*busy\+\+;[^;]*;\s*paint\(\);/.test(main) && /btn\.disabled = busy > 0/.test(main), 'main.js: the account button is not disabled synchronously at the start of its click handler');   // contract: Task 5 decision 4, a double tap opens one popup
  check(/\.then\(changed => \{ if \(changed\) render\(true\); \}/.test(main) && !/\.focus\(/.test(/function sync\(\) \{([\s\S]*?)\n\}/.exec(main)?.[1] || '.focus('), 'main.js: sync() does not repaint only when syncAll returned true, or it moves the focus');   // contract: Task 5 decision 6
}

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log('progress rules and store: ok');
