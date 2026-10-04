// Checks the rules of Nenúfars a trossos before every build: every lesson question, 200 generated tests per section,
// the cuts of the figures and what the game says. Run: node scripts/check-nenufars.mjs
import { SECTIONS, want, right, gen, PASS, starsFor, testStars, cuts, snips, tipFor, explain } from '../games/nenufars-a-trossos/logic.js';

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const g = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const int = x => Number.isInteger(x);
const smooth = n => { for (const p of [2, 3, 5]) while (n % p === 0) n /= p; return n === 1; };   // reachable with the cut buttons
const room = { pad: 12, bar: 20, set: 12 };

// one question: inside the limits, and want() agrees with a calculation made here
function valid(q, where, modes) {
  const tag = `${where} ${JSON.stringify(q)}`, w = want(q);
  check(modes.includes(q.mode), `${tag}: mode not taught in this section`);
  check(right(q, w), `${tag}: right() rejects want()`);
  const proper = (n, d, min = 1) => int(n) && int(d) && d >= 2 && n >= min && n <= d;
  switch (q.mode) {
    case 'equal': check(['pad', 'bar'].includes(q.shape) && q.d >= 2 && q.d <= 8 && [0, 1, 2].includes(q.at), `${tag}: limits`);
      check(w === q.at && !right(q, (q.at + 1) % 3), `${tag}: answer`); break;
    case 'paint': check(proper(q.n, q.d) && q.d <= 12 && q.shape in room, `${tag}: limits`);
      check(w === q.n && !right(q, q.n - 1) && !right(q, q.n + 1), `${tag}: answer`); break;
    case 'name': check(proper(q.n, q.d) && q.d <= room[q.shape], `${tag}: limits`);
      check(w[0] === q.n && w[1] === q.d && (q.n === q.d || !right(q, [q.d, q.n])) && !right(q, [q.n * 2, q.d * 2]), `${tag}: answer`); break;
    case 'line': check(proper(q.n, q.d, q.ask === 'put' ? 0 : 1) && q.d <= 12 && ['put', 'read'].includes(q.ask), `${tag}: limits`);
      check(q.ask === 'put' ? w === q.n && !right(q, q.n + 1) : w[0] === q.n && w[1] === q.d, `${tag}: answer`); break;
    case 'cmp': { check(proper(q.a, q.b) && proper(q.c, q.d), `${tag}: limits`);
      check(q.hide || (q.b <= 24 && q.d <= 24), `${tag}: cannot be drawn`);
      const x = q.a / q.b, y = q.c / q.d, s = Math.abs(x - y) < 1e-12 ? '=' : x < y ? '<' : '>';
      check(w === s && ['<', '=', '>'].filter(z => right(q, z)).length === 1, `${tag}: answer`); break; }
    case 'same': { check(proper(q.a, q.b) && proper(q.c, q.d), `${tag}: limits`);
      check(q.hide || (q.b <= 24 && q.d <= 24), `${tag}: cannot be drawn`);
      check(w === (Math.abs(q.a / q.b - q.c / q.d) < 1e-12) && right(q, String(w)) && !right(q, String(!w)), `${tag}: answer`); break; }
    case 'cut': check(proper(q.n, q.d) && ['pad', 'bar'].includes(q.shape) && q.k >= 2 && smooth(q.k) && q.d * q.k <= room[q.shape], `${tag}: limits`);
      check(w === q.n * q.k && Math.abs(w / (q.d * q.k) - q.n / q.d) < 1e-12 && !right(q, q.n), `${tag}: answer`); break;
    case 'fill': check(proper(q.n, q.d) && proper(q.N, q.D) && ['N', 'D'].includes(q.miss) && q.d !== q.D, `${tag}: limits`);
      check(q.n * q.D === q.N * q.d && (q.D % q.d === 0 || q.d % q.D === 0), `${tag}: not equivalent by one whole factor`);
      check(q.hide || (q.d <= 24 && q.D <= 24), `${tag}: cannot be drawn`);
      check(w === (q.miss === 'N' ? q.N : q.D) && !right(q, w + 1), `${tag}: answer`); break;
    case 'join': { const k = g(q.n, q.d);
      check(proper(q.n, q.d) && k > 1 && smooth(k) && ['pad', 'bar'].includes(q.shape), `${tag}: limits`);
      check(q.hide || q.d <= room[q.shape], `${tag}: cannot be drawn`);
      check(g(w[0], w[1]) === 1 && w[0] * q.d === w[1] * q.n, `${tag}: not the lowest terms`);
      check(!right(q, [q.n, q.d]), `${tag}: accepts a fraction that is not simplified`); break; }
    default: check(false, `${tag}: unknown mode`);
  }
}

check(SECTIONS.length === 8, 'eight sections');
SECTIONS.forEach((S, s) => {
  check(S.levels.length === 9, `section ${s + 1}: nine lessons`);
  S.levels.forEach((L, l) => {
    check(L.qs.length === 5 && L.qs.every(Boolean), `section ${s + 1} lesson ${l + 1}: five questions`);
    L.qs.filter(Boolean).forEach(q => valid(q, `s${s + 1} l${l + 1}`, S.modes));
  });
  S.modes.forEach(m => check(S.levels.some(L => L.qs.some(q => q && q.mode === m)), `section ${s + 1}: no lesson teaches ${m}`));
  // a seeded generator, so a failure can be reproduced
  let seed = 1000 + s;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < 200; i++) {
    const T = gen(s, rnd);
    check(T.length === 6, `section ${s + 1}: a test has six questions`);
    check(new Set(T.map(q => JSON.stringify({ ...q, at: 0 }))).size === 6, `section ${s + 1} test ${i}: repeated question`);
    T.forEach(q => { valid(q, `s${s + 1} test ${i}`, S.modes); if (s >= 5) check(q.hide === true, `section ${s + 1} test ${i}: figure not hidden`); });
  }
});
// what the game says about a question never has a hole in it, and the first hint never points away from the answer
function spoken(q, where) {
  const w = want(q), wrongs = [undefined, Array.isArray(w) ? [w[1], w[0]] : 0, Array.isArray(w) ? [q.n, q.d] : 1];
  for (const deep of [false, true]) for (const ans of wrongs) for (const txt of [tipFor(q), explain(q, deep, ans)])
    check(typeof txt === 'string' && txt.length > 10 && !/undefined|NaN|null|\[object/.test(txt), `${where} ${JSON.stringify(q)}: says "${txt}"`);
  // the full explanation ends by stating the answer
  if (q.mode === 'cmp') check(explain(q, true).endsWith(`${q.a}/${q.b} ${w} ${q.c}/${q.d}.`), `${where} ${JSON.stringify(q)}: cmp explanation does not state the answer`);
  if (q.mode === 'same') check(/no valen el mateix/.test(explain(q, true)) === !w, `${where} ${JSON.stringify(q)}: same explanation contradicts the answer`);
  if (q.mode === 'same') check(!/multiplicant|dividint/.test(explain(q, false)), `${where}: the first hint of same must hold for pairs with no whole factor between them`);
  if (q.mode === 'cmp' && (q.a === q.b || q.c === q.d)) check(/sencer/.test(explain(q, true)), `${where} ${JSON.stringify(q)}: a whole is explained as a whole`);
  if (q.mode === 'cut') { check(snips(q.k).reduce((x, y) => x * y, 1) === q.k, `${where}: cut in ${q.k} cannot be made with the scissors`);
    check(snips(q.k).length === 1 ? explain(q, false).includes(`en ${q.k},`) : /talls seguits/.test(explain(q, false)), `${where} ${JSON.stringify(q)}: the hint names a cut with no button`); }
  if (q.mode === 'equal') check(explain(q, true).includes(['primera', 'segona', 'tercera'][q.at]), `${where}: the answer of equal is not told`);
  if (q.shape === 'set') check(!/trossos|pintat/.test(explain(q, false) + explain(q, true, q.mode === 'paint' ? 0 : undefined)), `${where} ${JSON.stringify(q)}: fireflies are not parts`);
}
SECTIONS.forEach((S, s) => { S.levels.forEach((L, l) => L.qs.forEach(q => spoken(q, `s${s + 1} l${l + 1}`)));
  let seed = 77 + s; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < 200; i++) gen(s, rnd).forEach(q => spoken(q, `s${s + 1} test`)); });
// the cuts drawn over a figure of D parts that had `was` parts before: the cuts that stay are exactly the grid of D, wherever it came from
for (let D = 1; D <= 24; D++) for (let was = 1; was <= 24; was++) {
  const stay = cuts(D, was).filter(c => c[1] !== 'gone').map(c => Math.round(c[0] * D * 1e6) / 1e6);
  check(D === 1 ? stay.length === 0 : stay.length === D && stay.every((x, i) => x === i), `cuts(${D}, ${was}) does not draw ${D} parts`);
  const fits = Math.max(D, was) % Math.min(D, was) === 0;
  check(cuts(D, was).some(c => c[1]) === (fits && D !== was), `cuts(${D}, ${was}): animation`);
}
check(PASS === 5, 'pass mark');
check([0, 1, 2, 3, 9].map(starsFor).join() === '3,2,2,1,1', 'stars of a lesson');
check([4, 5, 6].map(testStars).join() === '0,2,3', 'stars of a test');

if (fails) { console.error(`${fails} failures`); process.exit(1); }
console.log(`nenufars-a-trossos: ${SECTIONS.reduce((n, S) => n + S.levels.reduce((m, L) => m + L.qs.length, 0), 0)} lesson questions, ${8 * 200} tests`);
