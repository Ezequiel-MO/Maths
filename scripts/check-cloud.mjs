// Checks shared/cloud.js, the save hook in shared/progress.js and firestore.rules. The real cloud.js, progress.js and sync.js run
// under Node against a fake localStorage and in-memory fakes of the three Firebase packages (scripts/fakes, mapped by a resolve
// hook), so no Firebase package is loaded and no Google service is called.
// Run: node scripts/check-cloud.mjs
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const wait = ms => new Promise(r => setTimeout(r, ms));
const J = JSON.stringify;

// ---- static: rules, imports, the save hook. contract: task 4 brief, plan «El progrés al núvol» (rules: spec, section Regles)
const spec = read('docs/superpowers/specs/2026-10-05-progres-al-nuvol-design.md');
const block = (spec.match(/Regles[^\n]*\n\n```\n([\s\S]*?)\n```/) || [])[1];
check(!!block && block.includes('rules_version'), 'the spec has a rules block');
check(read('firestore.rules').trimEnd() === (block || '?').trimEnd(), 'firestore.rules is the rules block of the spec, letter for letter');   // contract: task 4 brief, «lletra per lletra»
const cloudSrc = read('shared/cloud.js'), progSrc = read('shared/progress.js');
check(!/^\s*import[^(]*?from\s*['"]firebase/m.test(cloudSrc) && !/^\s*import\s*['"]firebase/m.test(cloudSrc), 'cloud.js has no static import of a firebase package');   // contract: decision 2, Firebase only through import()
const specifiers = [...cloudSrc.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1]).sort();
check(J(specifiers) === J(['firebase/app', 'firebase/auth', 'firebase/firestore/lite']), `cloud.js imports only the three allowed packages, with import(): ${J(specifiers)}`);   // contract: task 4 brief, «Només s'importa de firebase/app, firebase/auth i firebase/firestore/lite»
const saveBody = (progSrc.match(/export function save\([\s\S]*?\n}\n/) || [''])[0];
const iStuck = saveBody.indexOf('if (set(key, s))'), iGuard = saveBody.indexOf("typeof window !== 'undefined'"), iImport = saveBody.indexOf("import('./cloud.js')");
check(iStuck > 0 && iGuard > iStuck && iImport > iGuard, 'save imports cloud.js only behind typeof window, after the document write stuck');   // contract: decision 1
check(!/^\s*import[^(]*from\s*['"]\.\/cloud\.js/m.test(progSrc), 'progress.js has no static import of cloud.js');   // contract: plan rule 6, progress.js importable under Node

// ---- the fakes
register('./fakes/hooks.mjs', import.meta.url);
const mem = () => { const m = new Map(); return { m, getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); } }; };
const A = mem(), B = mem();
const on = d => { globalThis.localStorage = d; };
on(A);
let t = 1000; Date.now = () => t;   // every save gets the at we say
const P = await import('../shared/progress.js');
const fakesLoaded = () => (globalThis.__fakeLoaded || []).slice();

// ---- 0. under Node (no window) a save never imports cloud.js. contract: plan rule 6
P.add('Xavi'); P.choose('xavi', []); P.save('g', { n: 1 });
await wait(30);
check(fakesLoaded().length === 0, `a save under Node loads no cloud code (loaded: ${J(fakesLoaded())})`);

// ---- 10. null config. contract: task 4 brief, «Amb configuració null»
const N = await import('../shared/cloud.js?null');
check(N.enabled === false, 'null config: enabled is false');
check(await N.session() === null, 'null config: session() is null');
check(await N.signIn() === false, 'null config: signIn() is false');
check(await N.syncAll() === false, 'null config: syncAll() is false');
let thrown = null; try { await N.push('xavi', 'g'); await N.signOut(); } catch (e) { thrown = e; }
check(thrown === null, 'null config: push and signOut resolve');
check(fakesLoaded().length === 0, `null config: no Firebase module and no config fake was requested (loaded: ${J(fakesLoaded())})`);

const cloud = await import('../shared/cloud.js');
const auth = (await import('./fakes/fake-auth.mjs')).state;
const { C } = await import('./fakes/fake-fs.mjs');
check(cloud.enabled === true, 'with a config: enabled is true');   // contract: task 4 brief, «enabled: si hi ha configuració»

const U = uid => ({ uid, displayName: 'Oli', email: uid + '@x' });
const reset = uid => { A.m.clear(); B.m.clear(); C.docs.clear(); C.log.length = 0; C.hook = null; auth.currentUser = uid ? U(uid) : null; auth.next = null; t = 1000; on(A); };
const mark = (d, key) => { try { return JSON.parse(d.m.get('sync'))[key]; } catch (e) { return undefined; } };
const synced = (m, at) => !!m && m.at === at && m.base === at && m.pending === false;
const pend = (m, at, base) => !!m && m.at === at && m.base === base && m.pending === true;
const cd = p => C.docs.get('users/U1/' + p);
const game = (prof, g) => cd(`profiles/${prof}/games/${g}`);
const sets = () => C.log.filter(x => x.startsWith('set'));
const play = (d, prof, g, data) => { on(d); P.choose(prof, []); P.save(g, data); };
const section = async (name, fn) => { try { await fn(); } catch (e) { check(false, `${name} threw ${e && e.stack}`); } finally { C.hook = null; on(A); } };

// the real signed-out state: nothing happens, nothing is called
await section('signed out', async () => {
  reset(null);
  P.add('Xavi'); P.choose('xavi', []); P.save('g', { n: 1 });
  check(await cloud.session() === null, 'signed out: session() is null');
  check(await cloud.syncAll() === false && C.log.length === 0, 'signed out: syncAll is false and calls nothing');   // contract: decision 4, «syncAll() con sessió»
  check(await cloud.push('xavi', 'g') === undefined && C.log.length === 0, 'signed out: push resolves and calls nothing');   // contract: decision 5
  auth.next = null;
  check(await cloud.signIn() === false, 'a closed popup: signIn() is false');   // contract: decision 6
});

// ---- 11. one popup, one run
await section('overlap', async () => {
  reset(null);
  auth.next = U('U1'); auth.popups = 0;
  const s1 = cloud.signIn(), s2 = cloud.signIn();
  check(s1 === s2, 'two signIn calls share one promise');   // contract: decision 6
  check(await s1 === true && auth.popups === 1, `two signIn calls open one popup (${auth.popups})`);
  const sess = await cloud.session();
  check(sess && sess.uid === 'U1' && sess.name === 'Oli', `session has uid and display name: ${J(sess)}`);   // contract: decision 3
  auth.currentUser = { uid: 'U1', displayName: '', email: 'a@b' };
  check((await cloud.session()).name === 'a@b', 'the name falls back to the email');   // contract: decision 3
  auth.currentUser = U('U1');
  P.add('Xavi'); P.choose('xavi', []); P.save('g', { n: 1 });
  const a = cloud.syncAll(), b = cloud.syncAll();
  check(a === b, 'a second syncAll while one runs returns the same promise');   // contract: decision 4
  await a;
  check(C.log.filter(x => x === 'list users/U1/profiles').length === 1, 'overlapping syncAll calls make one run');
  check(await cloud.syncAll() !== undefined && C.log.filter(x => x === 'list users/U1/profiles').length === 2, 'the next syncAll after it ended runs again');
});

// ---- 1. first sign-in on a device with progress, empty cloud
await section('first sign-in', async () => {
  reset(null);
  P.add('Xavi'); A.setItem('abac-xines', J({ so: true, secs: [3, 0] })); P.choose('xavi', ['abac-xines']);   // a migrated document, at 0
  t = 2000; P.save('coet', { best: 4 });
  auth.next = U('U1'); await cloud.signIn();
  const r = await cloud.syncAll();
  check(r === false, 'first sign-in, empty cloud: nothing came down, syncAll is false');   // contract: decision 4, «Returns true if addProfiles added any or anything was pulled»
  check(J(cd('profiles/xavi')) === J({ name: 'Xavi' }), `the profile document goes up: ${J(cd('profiles/xavi'))}`);   // contract: task 4 brief, camins
  check(J(game('xavi', 'coet')) === J({ data: { best: 4 }, at: 2000 }), `a played game goes up: ${J(game('xavi', 'coet'))}`);
  check(J(game('xavi', 'abac-xines')) === J({ data: { so: true, secs: [3, 0] }, at: 0 }), `the migrated at-0 document goes up: ${J(game('xavi', 'abac-xines'))}`);   // contract: spec, «Un document que ve de la migració té at 0»
  check(synced(mark(A, 'xavi:coet'), 2000) && synced(mark(A, 'xavi:abac-xines'), 0), `marks are synced at the sent at: ${A.m.get('sync')}`);   // contract: spec, push then pushed(profile, game, at)
  check(A.m.get('compte') === 'U1', 'compte holds the account');   // contract: decision 4, rebase(uid)
});

// ---- 2. second, empty device, same account (continues from the cloud of the section above)
await section('second device', async () => {
  const keep = new Map(C.docs); reset('U1'); for (const [k, v] of keep) C.docs.set(k, v);
  on(B);
  const r = await cloud.syncAll();
  check(r === true, 'empty device: profiles and documents come down, syncAll is true');   // contract: decision 4
  check(J(P.profiles()) === J([{ id: 'xavi', name: 'Xavi' }]), `the profile is added: ${J(P.profiles())}`);
  check(B.getItem('xavi:coet') === J({ best: 4 }) && synced(mark(B, 'xavi:coet'), 2000), 'a document is pulled, in sync');
  check(B.getItem('xavi:abac-xines') === J({ so: true, secs: [3, 0] }) && synced(mark(B, 'xavi:abac-xines'), 0), 'the at-0 document is pulled, in sync');
  C.log.length = 0;
  check(await cloud.syncAll() === false && sets().length === 0, `a second run writes nothing and is false (${J(C.log)})`);   // contract: spec table, «Sense pendent / Igual que base: Res»
});

// ---- 3. two devices
await section('two devices', async () => {
  const both = async () => { reset('U1'); t = 1000; on(A); P.add('Xavi'); P.choose('xavi', []); P.save('coet', { best: 1 }); await cloud.syncAll(); on(B); await cloud.syncAll(); };
  await both();
  t = 2000; play(A, 'xavi', 'coet', { best: 10 }); t = 3000; play(B, 'xavi', 'coet', { best: 7 });
  on(A); await cloud.syncAll(); on(B); await cloud.syncAll(); on(A); await cloud.syncAll();
  check(A.getItem('xavi:coet') === J({ best: 7 }) && B.getItem('xavi:coet') === J({ best: 7 }) && J(game('xavi', 'coet')) === J({ data: { best: 7 }, at: 3000 }), `the larger at (B, 3000) ends on both and in the cloud: ${A.getItem('xavi:coet')} ${B.getItem('xavi:coet')} ${J(game('xavi', 'coet'))}`);   // contract: spec, «Guanya l'at més gran»
  await both();
  t = 5000; play(A, 'xavi', 'coet', { best: 20 }); t = 4000; play(B, 'xavi', 'coet', { best: 15 });
  on(B); await cloud.syncAll(); on(A); await cloud.syncAll(); on(B); await cloud.syncAll();
  check(A.getItem('xavi:coet') === J({ best: 20 }) && B.getItem('xavi:coet') === J({ best: 20 }) && game('xavi', 'coet').at === 5000, 'the larger at wins when it syncs second');
  await both();
  t = 6000; play(A, 'xavi', 'coet', { best: 30 }); play(B, 'xavi', 'coet', { best: 31 });   // the same at on both
  on(A); await cloud.syncAll(); on(B); await cloud.syncAll();
  check(B.getItem('xavi:coet') === J({ best: 30 }) && game('xavi', 'coet').data.best === 30, 'a tie pulls the cloud copy');   // contract: spec, «si empaten, el núvol»
});

// ---- 4. migrated at 0 against a cloud document
await section('migrated at 0', async () => {
  reset('U1');
  C.docs.set('users/U1/profiles/xavi', { name: 'Xavi' }); C.docs.set('users/U1/profiles/xavi/games/abac-xines', { data: { secs: [9] }, at: 5 });
  P.add('Xavi'); A.setItem('abac-xines', J({ secs: [3] })); P.choose('xavi', ['abac-xines']); A.setItem('compte', 'U1');
  const r = await cloud.syncAll();
  check(r === true && A.getItem('xavi:abac-xines') === J({ secs: [9] }) && synced(mark(A, 'xavi:abac-xines'), 5), `at 0 against a cloud document: the cloud's is pulled (${A.getItem('xavi:abac-xines')})`);   // contract: spec, «guanya el núvol»
});

// ---- 5. a save during the downloads
await section('save during sync', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); t = 1000; P.save('coet', { best: 1 }); await cloud.syncAll();
  C.docs.set('users/U1/profiles/xavi/games/coet', { data: { best: 50 }, at: 5 });   // another device wrote, older than the save to come
  C.hook = (op, path) => { if (op === 'list' && path.endsWith('/games')) { t = 2000; P.save('coet', { best: 99 }); } };
  await cloud.syncAll(); C.hook = null;
  check(A.getItem('xavi:coet') === J({ best: 99 }), `a save landing during the downloads is not overwritten by a stale pull (${A.getItem('xavi:coet')})`);   // contract: decision 4, race rule
  check(J(game('xavi', 'coet')) === J({ data: { best: 99 }, at: 2000 }) && synced(mark(A, 'xavi:coet'), 2000), 'and it is the one sent');
  // another document saved again while an earlier one is being sent
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); t = 1000; P.save('a', { n: 1 }); P.save('b', { n: 1 });
  C.hook = (op, path) => { if (op === 'set' && path.endsWith('/games/a')) { t = 3000; P.save('b', { n: 2 }); C.hook = null; } };
  await cloud.syncAll(); await cloud.syncAll();
  check(A.getItem('xavi:b') === J({ n: 2 }) && J(game('xavi', 'b').data) === J({ n: 2 }) && mark(A, 'xavi:b').pending === false, `a save during a send ends in the cloud, not stale (${J(game('xavi', 'b'))})`);   // contract: spec, «pushed ... només si no s'ha desat de nou»
});

// ---- 6. failures
await section('failures', async () => {
  reset('U1'); P.add('Xavi'); P.add('Laia'); t = 1000; P.choose('xavi', []); P.save('a', { n: 1 }); P.save('b', { n: 1 }); P.choose('laia', []); P.save('a', { n: 5 });
  C.hook = (op, path) => { if (op === 'set' && path === 'users/U1/profiles/xavi/games/a') throw new Error('net'); };
  let r; try { r = await cloud.syncAll(); } catch (e) { r = 'rejected'; }
  check(r === false, `one write failing: syncAll resolves false (${r})`);   // contract: decision 6
  check(pend(mark(A, 'xavi:a'), 1000, null) && !game('xavi', 'a'), 'the failed document stays pending and is not in the cloud');
  check(synced(mark(A, 'xavi:b'), 1000) && synced(mark(A, 'laia:a'), 1000) && !!game('xavi', 'b') && !!game('laia', 'a'), 'the other documents go on and sync');
  C.hook = () => { throw new Error('offline'); };
  let r2, p2; try { r2 = await cloud.syncAll(); p2 = await cloud.push('xavi', 'a'); } catch (e) { r2 = 'rejected'; }
  check(r2 === false && p2 === undefined, `fully offline: syncAll is false and push resolves (${r2}, ${p2})`);   // contract: decision 6
  // m3: a failed profile-document write skips nothing else
  reset('U1'); P.add('Xavi'); P.add('Laia'); t = 1000; P.choose('xavi', []); P.save('a', { n: 1 }); P.choose('laia', []); P.save('a', { n: 2 });
  C.hook = (op, path) => { if (op === 'set' && path === 'users/U1/profiles/xavi') throw new Error('net'); };
  await cloud.syncAll();
  check(!!cd('profiles/laia') && !!game('laia', 'a') && synced(mark(A, 'laia:a'), 1000), 'a refused profile document does not stop the other profile from syncing');   // contract: fix round 1, m3
  check(!!game('xavi', 'a'), 'nor the games of the profile whose document was refused');
});

// ---- 7. another account on the same device
await section('other account', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); t = 5000; P.save('a', { n: 1 }); await cloud.syncAll();
  check(synced(mark(A, 'xavi:a'), 5000), 'synced as U1');
  await cloud.signOut();
  check(await cloud.session() === null && await cloud.syncAll() === false && A.getItem('compte') === 'U1', 'signed out: no session, no sync, compte kept');
  C.docs.set('users/U2/profiles/xavi', { name: 'Xavi' }); C.docs.set('users/U2/profiles/xavi/games/a', { data: { n: 77 }, at: 100 }); C.docs.set('users/U2/profiles/nil', { name: 'Nil' });   // older than the device's save
  auth.next = U('U2'); await cloud.signIn();
  const r = await cloud.syncAll();
  check(A.getItem('compte') === 'U2', 'compte is the new account');   // contract: spec amendment «Canvi de compte»
  check(A.getItem('xavi:a') === J({ n: 1 }) && J(C.docs.get('users/U2/profiles/xavi/games/a')) === J({ data: { n: 1 }, at: 5000 }), `the marks of U1 are void: the device's newer save goes up to U2, not the other way (${A.getItem('xavi:a')})`);   // contract: spec amendment: all documents pending without a base
  check(r === true && P.profiles().some(p => p.id === 'nil'), 'the profile U2 has is added');
});

// ---- 8. odd cloud data
await section('odd cloud data', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []);
  C.docs.set('users/U1/profiles/mal', { name: 'Laia' }); C.docs.set('users/U1/profiles/evil', { name: '<b>x' }); C.docs.set('users/U1/profiles/n', { name: 5 });
  C.docs.set('users/U1/profiles/pau', { name: ' Pau  ' });
  C.docs.set('users/U1/profiles/pau/games/a', { data: { n: 1 } }); C.docs.set('users/U1/profiles/pau/games/b', { data: { n: 1 }, at: '7' });
  C.docs.set('users/U1/profiles/pau/games/c', { at: 7 }); C.docs.set('users/U1/profiles/pau/games/d', { data: { n: 4 }, at: 7 });
  await cloud.syncAll();
  check(J(P.profiles().map(p => p.id)) === J(['xavi', 'pau']), `a profile whose name does not slug to its id, or is not text, is ignored (${J(P.profiles())})`);   // contract: decision 4
  check(J(P.profiles().find(p => p.id === 'pau')) === J({ id: 'pau', name: 'Pau' }), 'a cloud name is taken trimmed');   // contract: fix round 1, m4
  check(!P.entries().some(e => e.profile === 'pau' && 'abc'.includes(e.game)), 'a game with a missing or string at, or no data, is not pulled');
  check(P.entries().some(e => e.profile === 'pau' && e.game === 'd' && e.at === 7), 'a good game of the same profile is');
  P.choose('pau', []); t = 9000; P.save('a', { n: 2 }); P.save('b', { n: 2 }); P.save('c', { n: 2 });
  C.log.length = 0; await cloud.syncAll(); await cloud.syncAll();
  check(!sets().some(s => /pau\/games\/[abc]$/.test(s)) && J(game('pau', 'a')) === J({ data: { n: 1 } }) && J(game('pau', 'b')) === J({ data: { n: 1 }, at: '7' }) && J(game('pau', 'c')) === J({ at: 7 }), `such a cloud document is not overwritten (${J(sets())})`);   // contract: decision 4, «skip that pair entirely»
  check(['evil', 'n', 'mal'].every(id => cd('profiles/' + id)) && J(cd('profiles/evil')) === J({ name: '<b>x' }), 'and the ignored profile documents are left alone');
});

// ---- 9. pushed gets the at that was sent, not the clock
await section('pushed at', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); A.setItem('compte', 'U1'); t = 1000; P.save('a', { n: 1 }); P.save('b', { n: 1 });
  t = 9999999;
  await cloud.push('xavi', 'a');
  check(synced(mark(A, 'xavi:a'), 1000), `push: pushed gets the sent at, not the clock (${J(mark(A, 'xavi:a'))})`);   // contract: decision 5
  await cloud.syncAll();
  check(synced(mark(A, 'xavi:b'), 1000), `syncAll: pushed gets the sent at, not the clock (${J(mark(A, 'xavi:b'))})`);   // contract: decision 4
});

// ---- the save hook in a browser: a save is sent without anyone calling push
await section('save hook', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []);
  globalThis.window = {}; globalThis.document = { documentElement: { hasAttribute: () => true } };
  try {
    t = 1000; P.save('g', { n: 1 }); await wait(60);
    check(J(game('xavi', 'g')) === J({ data: { n: 1 }, at: 1000 }) && synced(mark(A, 'xavi:g'), 1000), `a save in a browser reaches the cloud (${J(game('xavi', 'g'))})`);   // contract: decision 1
  } finally { delete globalThis.window; delete globalThis.document; }
});

// ---- m1: two sends of one document cannot land out of order
await section('out of order', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); A.setItem('compte', 'U1');
  const held = []; C.hook = (op, path, v) => (op === 'set' && v.data && v.data.n === 1 ? new Promise(r => held.push(r)) : null);
  t = 5000; P.save('g', { n: 1 }); const p1 = cloud.push('xavi', 'g'); await wait(20);
  t = 6000; P.save('g', { n: 2 }); const p2 = cloud.push('xavi', 'g'); await wait(20);
  held.forEach(r => r()); await Promise.race([Promise.all([p1, p2]), wait(500)]); C.hook = null;
  check(J(game('xavi', 'g')) === J({ data: { n: 2 }, at: 6000 }), `the slow first send does not land over the second (${J(game('xavi', 'g'))})`);   // contract: fix round 1, m1
  check(synced(mark(A, 'xavi:g'), 6000), 'the mark says synced at the newer at, and the cloud agrees');
  check(await cloud.syncAll() === false && A.getItem('xavi:g') === J({ n: 2 }), 'the next syncAll pulls nothing');
});

// ---- m2: push rebases
await section('push rebase', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); t = 5000; P.save('g', { n: 1 });
  A.setItem('compte', 'OTHER'); A.setItem('sync', J({ 'xavi:g': { at: 5000, base: 5, pending: true } }));
  await cloud.push('xavi', 'g');
  check(A.getItem('compte') === 'U1' && synced(mark(A, 'xavi:g'), 5000), `push under a new account resets the marks first (${A.getItem('compte')}, ${J(mark(A, 'xavi:g'))})`);   // contract: fix round 1, m2
});

console.log(fails ? `${fails} FAILED` : 'cloud rules and save hook: ok');
process.exit(fails ? 1 : 0);
