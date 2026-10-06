// Checks the pure rules behind the cloud copy of the progress: the id of a profile and who wins when a document exists
// on the device and in the cloud. Run: node scripts/check-progress.mjs
import { slug, settle } from '../shared/sync.js';

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
];
for (const [local, remote, want] of SETTLES) {
  const got = settle(local, remote);
  check(got === want, `settle(${JSON.stringify(local)}, ${JSON.stringify(remote)}) is ${got}, want ${want}`);
}

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log('progress rules: ok');
