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
check(/^export default\b/m.test(read('shared/firebase-config.js')), 'shared/firebase-config.js has a default export (null, or the config object)');   // contract: decision 7; the checker never reads its value
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
check(fakesLoaded().length === 0, `null config: no Firebase module was requested (loaded: ${J(fakesLoaded())})`);

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
const play = (d, prof, g, data) => { on(d); P.choose(prof, []); P.load(g); P.save(g, data); };   // a game page loads its document before it saves; one module here stands for every page, so load() sets what save remembers
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
  check(A.getItem('xavi:coet') === J({ best: 10 }) && B.getItem('xavi:coet') === J({ best: 10 }) && J(game('xavi', 'coet')) === J({ data: { best: 10 }, at: 2000 }), `the larger value ends on both and in the cloud, the newer save does not win: ${A.getItem('xavi:coet')} ${B.getItem('xavi:coet')} ${J(game('xavi', 'coet'))}`);   // contract: plan «El progrés no baixa mai», tasca 3, «ajunta camp per camp» (was: «Guanya l'at més gran»); B's merge equals the cloud, so B pulls and nothing is sent
  await both();
  t = 5000; play(A, 'xavi', 'coet', { best: 20 }); t = 4000; play(B, 'xavi', 'coet', { best: 15 });
  on(B); await cloud.syncAll(); on(A); await cloud.syncAll(); on(B); await cloud.syncAll();
  check(A.getItem('xavi:coet') === J({ best: 20 }) && B.getItem('xavi:coet') === J({ best: 20 }) && game('xavi', 'coet').at === 5001, `the larger value wins when it syncs second, and the merged document gets a new at (${A.getItem('xavi:coet')} ${B.getItem('xavi:coet')} ${J(game('xavi', 'coet'))})`);   // contract: plan «El progrés no baixa mai», tasca 3; merged() puts at = max(now, seenAt + 1, cloudAt + 1) = 5001
  await both();
  t = 6000; play(A, 'xavi', 'coet', { best: 30 }); play(B, 'xavi', 'coet', { best: 31 });   // the same at on both
  on(A); await cloud.syncAll(); on(B); await cloud.syncAll(); on(A); await cloud.syncAll();
  check(A.getItem('xavi:coet') === J({ best: 31 }) && B.getItem('xavi:coet') === J({ best: 31 }) && J(game('xavi', 'coet')) === J({ data: { best: 31 }, at: 6001 }), `a tie joins: the larger value on both and in the cloud (${A.getItem('xavi:coet')} ${B.getItem('xavi:coet')} ${J(game('xavi', 'coet'))})`);   // contract: plan «El progrés no baixa mai», tasca 3, settle tie row is a merge (was: «si empaten, el núvol»)
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
  check(J(game('xavi', 'coet')) === J({ data: { best: 99 }, at: 2001 }) && synced(mark(A, 'xavi:coet'), 2001), `and it is the one sent, with the at the merge gave it (${J(game('xavi', 'coet'))})`);   // contract: plan «El progrés no baixa mai», tasca 3: the cloud (at 5) moved from base, so the pending save is merged, and merged() puts at = max(2000, 2000 + 1, 5 + 1)
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
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); t = 5000; P.save('a', { n: 1, m: 9 }); await cloud.syncAll();
  check(synced(mark(A, 'xavi:a'), 5000), 'synced as U1');
  await cloud.signOut();
  check(await cloud.session() === null && await cloud.syncAll() === false && A.getItem('compte') === 'U1', 'signed out: no session, no sync, compte kept');
  C.docs.set('users/U2/profiles/xavi', { name: 'Xavi' }); C.docs.set('users/U2/profiles/xavi/games/a', { data: { n: 77 }, at: 100 }); C.docs.set('users/U2/profiles/nil', { name: 'Nil' });   // older than the device's save
  auth.next = U('U2'); await cloud.signIn();
  const r = await cloud.syncAll();
  check(A.getItem('compte') === 'U2', 'compte is the new account');   // contract: spec amendment «Canvi de compte»
  check(A.getItem('xavi:a') === J({ n: 77, m: 9 }) && J(C.docs.get('users/U2/profiles/xavi/games/a')) === J({ data: { n: 77, m: 9 }, at: 5001 }) && synced(mark(A, 'xavi:a'), 5001), `the marks of U1 are void: the device's {n:1, m:9} and U2's {n:77} are joined and the join goes up with a new at, so U2 does not lose m (${A.getItem('xavi:a')} ${J(C.docs.get('users/U2/profiles/xavi/games/a'))})`);   // contract: spec amendment: all documents pending without a base; plan «El progrés no baixa mai», tasca 3: a pending document and a different cloud one are merged (was: the newer at went up); revisió de la tasca 3, Important 2: with the marks of U1 left as synced, the device would take {n:77} and lose m
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

// ---- a document that is not pending and that the cloud lacks is still sent: settle says 'push' for device present, cloud absent
await section('synced locally, absent in the cloud', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); A.setItem('compte', 'U1');
  A.setItem('xavi:g', J({ n: 1 })); A.setItem('sync', J({ 'xavi:g': { at: 5, base: 5, pending: false } }));
  await cloud.syncAll();
  check(J(game('xavi', 'g')) === J({ data: { n: 1 }, at: 5 }), `a document with no pending flag goes up when the cloud has none (${J(game('xavi', 'g'))})`);   // contract: spec table, «N'hi ha / No n'hi ha: S'envia» whatever pending says
  check(synced(mark(A, 'xavi:g'), 5), 'and its mark stays synced at the sent at');
});

// ---- a send queued under one account does not run under another
await section('account changes while queued', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); A.setItem('compte', 'U1'); t = 1000; P.save('a', { n: 1 }); P.save('b', { n: 1 });
  let release; C.hook = (op, path) => (op === 'set' && path.endsWith('/games/a') ? new Promise(r => { release = r; }) : null);
  const p1 = cloud.push('xavi', 'a'); await wait(20);
  const p2 = cloud.push('xavi', 'b'); await wait(20);   // queued behind the held write
  auth.currentUser = U('U2');
  release(); await Promise.race([Promise.all([p1, p2]), wait(500)]); C.hook = null;
  check(!game('xavi', 'b') && !C.docs.has('users/U2/profiles/xavi/games/b'), 'a send queued under U1 writes nothing once the session is U2');   // contract: fix round 1, send checks the account when its turn comes
  check(pend(mark(A, 'xavi:b'), 1000, null), `and its mark stays pending (${J(mark(A, 'xavi:b'))})`);
});

// ---- «El progrés no baixa mai», tasca 3: the device and the cloud join field by field. Every value below is contract: plan «El progrés no baixa mai», tasca 3, «Comprovació»
// A game page is a fresh progress.js instance that load()s at the start: what save() remembers is per instance, so two pages
// (A's and B's) do not share it as the one module behind play() does. A save() without load() on a page is never made here.
let inst = 0;
const fresh = () => import('../shared/progress.js?inst' + (++inst));
const atm = (d, k) => { const m = mark(d, k); return m && m.at; };
const noMark = (d, k) => mark(d, k) === undefined;
// A and B synced on data at 1000, each with a page that loaded it
const twin = async data => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); t = 1000; P.save('g', data); await cloud.syncAll();
  on(B); await cloud.syncAll(); P.choose('xavi', []);
  on(A); const pa = await fresh(); pa.load('g');
  on(B); const pb = await fresh(); pb.load('g');
  return { pa, pb };
};
await section('join: the case of the review, and the old page that keeps playing', async () => {
  const { pa, pb } = await twin({ so: true, secs: [10] });
  check(synced(mark(A, 'xavi:g'), 1000) && synced(mark(B, 'xavi:g'), 1000), 'setup: both devices synced at 1000');
  t = 2000; on(B); pb.save('g', { so: true, secs: [30] }); await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g')) === J({ data: { so: true, secs: [30] }, at: 2000 }), `B's progress is in the cloud (${J(game('xavi', 'g'))})`);
  // A's page loaded the document at 1000 and never saw B's: it saves the sound switch with the old time
  t = 3000; on(A); pa.save('g', { so: false, secs: [10] });
  const saved = atm(A, 'xavi:g');
  await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g')) === J({ data: { so: false, secs: [30] }, at: 3001 }), `the cloud keeps B's time and A's sound (${J(game('xavi', 'g'))})`);
  check(A.getItem('xavi:g') === J({ so: false, secs: [30] }) && synced(mark(A, 'xavi:g'), 3001), `and so does A's document (${A.getItem('xavi:g')} ${J(mark(A, 'xavi:g'))})`);
  check(atm(A, 'xavi:g') !== saved, 'the document of A changed, so its at changed');   // contract: revisió de les tasques 1 i 2, Minor 4
  on(B); const bAt = atm(B, 'xavi:g'); await cloud.syncAll();
  check(B.getItem('xavi:g') === J({ so: false, secs: [30] }) && synced(mark(B, 'xavi:g'), 3001) && atm(B, 'xavi:g') !== bAt, `after B's syncAll B has secs [30] and the sound off (${B.getItem('xavi:g')})`);
  // A's page still believes it is at 11: it must not lower the document nor the cloud
  t = 4000; on(A); pa.save('g', { so: false, secs: [11] });
  const second = atm(A, 'xavi:g');
  await cloud.push('xavi', 'g');
  check(A.getItem('xavi:g') === J({ so: false, secs: [30] }) && J(game('xavi', 'g').data) === J({ so: false, secs: [30] }), `the old page saves secs [11]: the document and the cloud stay at [30] (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);
  t = 5000; pa.save('g', { so: false, secs: [12] }); await cloud.push('xavi', 'g');   // ruling 4: a page that merged keeps merging until it load()s again
  check(A.getItem('xavi:g') === J({ so: false, secs: [30] }) && J(game('xavi', 'g').data) === J({ so: false, secs: [30] }), `and secs [12]: still [30] (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);
  check(atm(A, 'xavi:g') !== second && synced(mark(A, 'xavi:g'), atm(A, 'xavi:g')), 'the mark of A moves on with every send and ends synced');
});

await section('join: two devices without network', async () => {
  const { pa, pb } = await twin({ secs: [0, 0] });
  t = 2000; on(A); pa.save('g', { secs: [5, 0] }); t = 3000; on(B); pb.save('g', { secs: [0, 7] });
  check(pend(mark(A, 'xavi:g'), 2000, 1000) && pend(mark(B, 'xavi:g'), 3000, 1000), 'setup: both pending over the same base');
  on(A); check(await cloud.syncAll() === false, 'A only sent: syncAll is false');
  on(B); check(await cloud.syncAll() === true, 'B joined the cloud copy and its document changed: syncAll is true');   // contract: revisió de la tasca 3, Minor 4 (the hub repaints on this value)
  check(B.getItem('xavi:g') === J({ secs: [5, 7] }) && synced(mark(B, 'xavi:g'), 3001), `B joins and sends: [5, 7] (${B.getItem('xavi:g')} ${J(mark(B, 'xavi:g'))})`);
  on(A); const before = atm(A, 'xavi:g'); await cloud.syncAll();
  check(A.getItem('xavi:g') === J({ secs: [5, 7] }) && B.getItem('xavi:g') === J({ secs: [5, 7] }) && J(game('xavi', 'g')) === J({ data: { secs: [5, 7] }, at: 3001 }), `both and the cloud have [5, 7] (${A.getItem('xavi:g')} ${B.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);
  check(atm(A, 'xavi:g') !== before, 'the pull changed the document of A and its at');   // contract: revisió de les tasques 1 i 2, Minor 4
});

await section('join: the sound follows the newer copy, whichever side runs the join', async () => {
  // push of the device that is older: the cloud copy is newer, so its sound stays
  let { pa, pb } = await twin({ so: true, secs: [1] });
  t = 2000; on(A); pa.save('g', { so: false, secs: [1] }); t = 3000; on(B); pb.save('g', { so: true, secs: [5] }); await cloud.push('xavi', 'g');
  on(A); await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g').data) === J({ so: true, secs: [5] }) && A.getItem('xavi:g') === J({ so: true, secs: [5] }), `push, device older: the sound of the cloud copy stays (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);
  // push of the device that is newer: its sound wins
  ({ pa, pb } = await twin({ so: true, secs: [1] }));
  t = 2000; on(B); pb.save('g', { so: true, secs: [5] }); await cloud.push('xavi', 'g'); t = 3000; on(A); pa.save('g', { so: false, secs: [1] }); await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g').data) === J({ so: false, secs: [5] }), `push, device newer: its sound wins (${J(game('xavi', 'g'))})`);
  // syncAll, device older and newer
  ({ pa, pb } = await twin({ so: true, secs: [1] }));
  t = 2000; on(A); pa.save('g', { so: false, secs: [1] }); t = 3000; on(B); pb.save('g', { so: true, secs: [5] }); await cloud.push('xavi', 'g');
  on(A); await cloud.syncAll();
  check(A.getItem('xavi:g') === J({ so: true, secs: [5] }) && J(game('xavi', 'g').data) === J({ so: true, secs: [5] }), `syncAll, device older: the sound of the cloud copy stays (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);
  ({ pa, pb } = await twin({ so: true, secs: [1] }));
  t = 2000; on(B); pb.save('g', { so: true, secs: [5] }); await cloud.push('xavi', 'g'); t = 3000; on(A); pa.save('g', { so: false, secs: [1] });
  await cloud.syncAll();
  check(A.getItem('xavi:g') === J({ so: false, secs: [5] }) && J(game('xavi', 'g').data) === J({ so: false, secs: [5] }), `syncAll, device newer: its sound wins (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);
});

await section('join: the save that lands during the read of a send', async () => {
  const { pa, pb } = await twin({ so: true, secs: [10] });
  t = 2000; on(B); pb.save('g', { so: true, secs: [30] }); await cloud.push('xavi', 'g');
  t = 3000; on(A); pa.save('g', { so: false, secs: [10] });
  let done = false;
  C.hook = op => { if (op === 'get' && !done) { done = true; t = 4000; pa.save('g', { so: false, secs: [11] }); } };   // the same old page saves again while the first send reads the cloud
  C.log.length = 0; await cloud.push('xavi', 'g'); C.hook = null;
  check(sets().length === 0 && J(game('xavi', 'g')) === J({ data: { so: true, secs: [30] }, at: 2000 }), `the first send does not write: its entry was saved again meanwhile (${J(C.log)} ${J(game('xavi', 'g'))})`);   // contract: revisió de la tasca 3, Important 1
  await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g').data) === J({ so: false, secs: [30] }) && A.getItem('xavi:g') === J({ so: false, secs: [30] }), `the push of the second save leaves the cloud and A at [30] (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);   // contract: revisió de la tasca 3, Important 1
});

await section('join: a forced send reads the cloud too', async () => {
  const { pa } = await twin({ so: true, secs: [10] });
  t = 3000; on(A); pa.save('g', { so: false, secs: [10] });   // pending over base 1000
  // syncAll lists the cloud still at base ('push'); before the forced send reads it, another device writes [30]
  C.hook = op => { if (op === 'get') { C.docs.set('users/U1/profiles/xavi/games/g', { data: { so: true, secs: [30] }, at: 2000 }); C.hook = null; } };
  await cloud.syncAll();
  check(J(game('xavi', 'g')) === J({ data: { so: false, secs: [30] }, at: 3001 }) && A.getItem('xavi:g') === J({ so: false, secs: [30] }), `a forced send does not step on what landed after the listing (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);   // contract: revisió de la tasca 3, Important 3
});

await section('join: a tie of at, and a cloud at that is not a number', async () => {
  const setup = (data, at) => {
    reset('U1'); C.docs.set('users/U1/profiles/xavi', { name: 'Xavi' }); C.docs.set('users/U1/profiles/xavi/games/g', { data: { so: true, secs: [2] }, at });
    P.add('Xavi'); P.choose('xavi', []); A.setItem('compte', 'U1'); A.setItem('xavi:g', J(data)); A.setItem('sync', J({ 'xavi:g': { at: 6000, base: 1000, pending: true } }));
  };
  // the same at on both: the cloud copy is the newer one for the sound (a tie goes to the cloud)
  setup({ so: false, secs: [1] }, 6000); await cloud.syncAll();
  check(A.getItem('xavi:g') === J({ so: true, secs: [2] }) && J(game('xavi', 'g').data) === J({ so: true, secs: [2] }), `syncAll, equal at: the sound of the cloud copy (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);   // contract: revisió de la tasca 3, Minor 6; sync.js: aNewer is local.at > remote.at
  setup({ so: false, secs: [1] }, 6000); await cloud.push('xavi', 'g');
  check(A.getItem('xavi:g') === J({ so: true, secs: [2] }) && J(game('xavi', 'g').data) === J({ so: true, secs: [2] }), `push, equal at: the sound of the cloud copy (${A.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);   // contract: revisió de la tasca 3, Minor 6
  // a cloud document whose at is not a number is written over as before, not merged
  setup({ so: false, secs: [1] }, '7'); await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g')) === J({ data: { so: false, secs: [1] }, at: 6000 }), `push over a cloud document with a text at writes the entry as before (${J(game('xavi', 'g'))})`);   // contract: revisió de la tasca 3, Minor 7; plan, tasca 3: «el seu at no és un nombre finit → escriu com ara»
});

await section('join: a migrated document, in either order', async () => {
  for (const [dev, cl] of [[[10, 10, 4], [1, 0, 0]], [[1, 0, 0], [10, 10, 4]]]) {
    reset('U1');
    C.docs.set('users/U1/profiles/xavi', { name: 'Xavi' }); C.docs.set('users/U1/profiles/xavi/games/abac-xines', { data: { secs: cl }, at: 5 });
    P.add('Xavi'); A.setItem('abac-xines', J({ secs: dev })); P.choose('xavi', ['abac-xines']); A.setItem('compte', 'U1');
    check(pend(mark(A, 'xavi:abac-xines'), 0, null), 'setup: the migrated document is pending at 0');
    await cloud.syncAll();
    check(A.getItem('xavi:abac-xines') === J({ secs: [10, 10, 4] }) && J(game('xavi', 'abac-xines').data) === J({ secs: [10, 10, 4] }), `device ${J(dev)} and cloud ${J(cl)}: [10, 10, 4] in both places (${A.getItem('xavi:abac-xines')} ${J(game('xavi', 'abac-xines'))})`);
    check(atm(A, 'xavi:abac-xines') !== 0 && mark(A, 'xavi:abac-xines').pending === false, `and the mark moved off at 0 and is synced (${J(mark(A, 'xavi:abac-xines'))})`);   // contract: revisió de les tasques 1 i 2, Minor 4
  }
});

await section('join: the reset of Salts de Granota', async () => {
  const { pa } = await twin({ secs: [10, 3] });
  t = 2000; on(A); pa.save('g', { secs: [0, 0] }); await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g')) === J({ data: { secs: [0, 0] }, at: 2000 }), `the reset of A reaches the cloud (${J(game('xavi', 'g'))})`);
  on(B); await cloud.syncAll();
  check(B.getItem('xavi:g') === J({ secs: [0, 0] }) && synced(mark(B, 'xavi:g'), 2000), `B has nothing pending and takes the zeros (${B.getItem('xavi:g')})`);
});
await section('join: the reset while the other plays', async () => {
  const { pa, pb } = await twin({ secs: [10, 3] });
  t = 2000; on(B); pb.save('g', { secs: [10, 4] });   // B plays and does not send
  t = 3000; on(A); pa.save('g', { secs: [0, 0] }); await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g').data) === J({ secs: [0, 0] }), 'setup: the zeros are in the cloud');
  on(B); const before = atm(B, 'xavi:g'); await cloud.syncAll();
  check(B.getItem('xavi:g') === J({ secs: [10, 4] }) && J(game('xavi', 'g').data) === J({ secs: [10, 4] }), `B keeps [10, 4] and so does the cloud, what the spec accepts (${B.getItem('xavi:g')} ${J(game('xavi', 'g'))})`);
  check(atm(B, 'xavi:g') !== before, 'the merge changed the at of B');   // contract: revisió de les tasques 1 i 2, Minor 4
});

await section('join: the read fails', async () => {
  reset('U1'); P.add('Xavi'); P.choose('xavi', []); t = 1000; P.save('g', { secs: [1] }); await cloud.syncAll();
  t = 2000; P.save('g', { secs: [2] });
  C.hook = op => { if (op === 'get') throw new Error('net'); };
  C.log.length = 0; await cloud.push('xavi', 'g');
  check(sets().length === 0 && pend(mark(A, 'xavi:g'), 2000, 1000) && J(game('xavi', 'g')) === J({ data: { secs: [1] }, at: 1000 }), `push: nothing is written and the mark stays pending (${J(C.log)} ${J(mark(A, 'xavi:g'))})`);
  C.log.length = 0; await cloud.syncAll();
  check(sets().length === 0 && pend(mark(A, 'xavi:g'), 2000, 1000), `syncAll: the forced send writes nothing either (${J(C.log)} ${J(mark(A, 'xavi:g'))})`);
  C.hook = null; await cloud.push('xavi', 'g');
  check(J(game('xavi', 'g')) === J({ data: { secs: [2] }, at: 2000 }) && synced(mark(A, 'xavi:g'), 2000), 'and once the read works the document goes up');
});

await section('join: joining changes nothing', async () => {
  // syncAll: the join equals the cloud copy, so it is pulled and nothing is written to the cloud
  reset('U1');
  C.docs.set('users/U1/profiles/xavi', { name: 'Xavi' }); C.docs.set('users/U1/profiles/xavi/games/abac-xines', { data: { secs: [9, 9] }, at: 5 });
  P.add('Xavi'); A.setItem('abac-xines', J({ secs: [3, 0] })); P.choose('xavi', ['abac-xines']); A.setItem('compte', 'U1');
  C.log.length = 0; await cloud.syncAll();
  check(sets().length === 0 && J(mark(A, 'xavi:abac-xines')) === J({ at: 5, base: 5, pending: false }) && A.getItem('xavi:abac-xines') === J({ secs: [9, 9] }), `syncAll: no write to the cloud and the mark is {5, 5, false} (${J(C.log)} ${J(mark(A, 'xavi:abac-xines'))})`);
  // a tie with a different document: the document changes, so its at must change too (it is not pulled at the same at)
  reset('U1');
  C.docs.set('users/U1/profiles/xavi', { name: 'Xavi' }); C.docs.set('users/U1/profiles/xavi/games/g', { data: { secs: [2] }, at: 6000 });
  P.add('Xavi'); P.choose('xavi', []); A.setItem('compte', 'U1'); A.setItem('xavi:g', J({ secs: [1] })); A.setItem('sync', J({ 'xavi:g': { at: 6000, base: 1000, pending: true } }));
  await cloud.syncAll();
  check(A.getItem('xavi:g') === J({ secs: [2] }) && atm(A, 'xavi:g') !== 6000 && J(game('xavi', 'g').data) === J({ secs: [2] }), `a tie whose join equals the cloud: the document changed and so did its at (${A.getItem('xavi:g')} ${J(mark(A, 'xavi:g'))})`);   // contract: revisió de les tasques 1 i 2, Minor 4
});

// ---- a game page that outlives a change of player. contract: final review, Blocker 1
// a fresh progress.js instance is loaded as a browser page (hub or not) with fake window, document and location
let pages = 0;
const page = async hub => {
  const seen = { replaced: [], listeners: [] };
  globalThis.window = { addEventListener: (n, f) => seen.listeners.push([n, f]) };
  globalThis.document = { documentElement: { hasAttribute: a => hub && a === 'data-hub' } };
  globalThis.location = { replace: u => seen.replaced.push(u) };
  try { seen.P = await import('../shared/progress.js?page' + (++pages)); } finally { delete globalThis.window; delete globalThis.document; }   // location stays: save() redirects through it
  seen.show = persisted => seen.listeners.filter(l => l[0] === 'pageshow').forEach(l => l[1]({ persisted }));
  return seen;
};
const browser = async fn => {   // the instance saves with a window present, as in a browser
  globalThis.window = {}; globalThis.document = { documentElement: { hasAttribute: () => false } };
  try { await fn(); } finally { delete globalThis.window; delete globalThis.document; }
};
await section('a stale game page', async () => {
  try {
  reset('U1'); P.add('Xavi'); P.add('Laia'); P.choose('xavi', []); A.setItem('compte', 'U1');
  const pg = await page(false);
  check(pg.replaced.length === 0, 'a game page with an active profile does not redirect when it loads');
  // (1) the player is switched underneath: another profile, whose document must stay as it is
  A.setItem('perfil', 'laia'); A.setItem('laia:joc', J({ n: 1 })); A.setItem('sync', J({ 'laia:joc': { at: 7, base: 7, pending: false } }));
  const syncBefore = A.m.get('sync'); C.log.length = 0;
  await browser(async () => { pg.P.save('joc', { n: 99 }); await wait(40); });
  check(A.getItem('laia:joc') === J({ n: 1 }), `a stale page does not overwrite the new player's document (${A.getItem('laia:joc')})`);
  check(A.getItem('xavi:joc') === null && A.m.get('sync') === syncBefore, 'nor writes the old player\'s document, nor touches a mark');
  check(sets().length === 0, 'nor sends anything to the cloud');
  check(J(pg.replaced) === J(['index.html']), `it sends the page to the hub (${J(pg.replaced)})`);
  // (2) nobody active
  pg.replaced.length = 0; A.m.delete('perfil'); await browser(async () => { pg.P.save('joc', { n: 98 }); await wait(40); });
  check(A.getItem('laia:joc') === J({ n: 1 }) && A.getItem('xavi:joc') === null && A.m.get('sync') === syncBefore && J(pg.replaced) === J(['index.html']), 'with nobody active a stale page writes nothing and goes to the hub');
  // (3) pageshow from the back/forward cache
  pg.replaced.length = 0; A.setItem('perfil', 'xavi'); pg.show(true);
  check(pg.replaced.length === 0, 'a restored page whose player is still active stays');
  A.setItem('perfil', 'laia'); pg.show(false);
  check(pg.replaced.length === 0, 'a pageshow that is not a restore does nothing');
  pg.show(true);
  check(J(pg.replaced) === J(['index.html']), 'a restored page whose player changed goes to the hub');
  // the same page, same player: still saves and sends
  A.setItem('perfil', 'xavi'); t = 5000; C.log.length = 0;
  await browser(async () => { pg.P.save('joc', { n: 5 }); await wait(60); });
  check(A.getItem('xavi:joc') === J({ n: 5 }) && J(game('xavi', 'joc')) === J({ data: { n: 5 }, at: 5000 }), 'a page whose player is still active saves and sends as ever');
  // (4) the hub follows active()
  const hub = await page(true);
  hub.P.choose('laia', []);
  check(J(hub.P.load('joc')) === J({ n: 1 }) && hub.listeners.length === 0 && hub.replaced.length === 0, 'the hub page loads under the profile just chosen, with no redirect and no pageshow listener');
  hub.P.choose('xavi', []);
  check(J(hub.P.load('joc')) === J({ n: 5 }), 'and follows the next choose');
  } finally { delete globalThis.location; }
});

console.log(fails ? `${fails} FAILED` : 'cloud rules and save hook: ok');
process.exit(fails ? 1 : 0);
