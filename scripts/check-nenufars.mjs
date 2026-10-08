// Checks the rules of Nenúfars a trossos before every build: every question of every level, 300 generated exams per circle,
// lightning rounds, sheets, the cuts of the figures, the cursus and what the game says. Run: node scripts/check-nenufars.mjs
import { PROJECTS, CIRCLES, POOL, ROOM, KINDS, want, right, kindOf, sumOf, decOpts, deci, cuts, snips, tipFor, explain, clean, noteOf, xpOf, levelText, isOpen, examOpen,
  badges, BADGES, levelIn, streakIn, rapidIn, exam, examIn, sprint, sheet, sheetIn } from '../games/nenufars-a-trossos/logic.js';

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const g = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const int = x => Number.isInteger(x);
const smooth = n => { for (const p of [2, 3, 5]) while (n % p === 0) n /= p; return n === 1; };   // reachable with the cut buttons
const proper = (n, d, min = 1) => int(n) && int(d) && d >= 2 && n >= min && n <= d;
const same = (a, b) => Math.abs(a - b) < 1e-9;
const ROUND = ['pad', 'pizza'], LONG = ['bar', 'choc'], CLOCK = [2, 3, 4, 6, 12];

// one question: inside the limits of what can be drawn, and want() agrees with a calculation made here
function valid(q, where, modes) {
  const tag = `${where} ${JSON.stringify(q)}`, w = want(q);
  check(modes.includes(q.mode), `${tag}: mode not taught in this project`);
  check(right(q, w), `${tag}: right() rejects want()`);
  switch (q.mode) {
    case 'equal': check([...ROUND, ...LONG].includes(q.shape) && q.d >= 2 && q.d <= 8 && [0, 1, 2].includes(q.at), `${tag}: limits`);
      check(w === q.at && !right(q, (q.at + 1) % 3), `${tag}: answer`); break;
    case 'paint': case 'name': check(proper(q.n, q.d) && q.d <= 12 && (q.shape !== 'jug' || q.d <= 10) && (q.shape !== 'clock' || CLOCK.includes(q.d))
        && [...ROUND, ...LONG, 'clock', 'jug', 'eggs', 'bugs'].includes(q.shape), `${tag}: limits`);
      if (q.mode === 'paint') check(w === q.n && !right(q, q.n - 1) && !right(q, q.n + 1), `${tag}: answer`);
      else check(w[0] === q.n && w[1] === q.d && (q.n === q.d || !right(q, [q.d, q.n])) && !right(q, [q.n * 2, q.d * 2]), `${tag}: answer`);
      break;
    case 'line': check(['put', 'read'].includes(q.ask) && [1, 2, 3].includes(q.max) && int(q.n) && q.d >= 2 && q.n >= (q.ask === 'put' ? 0 : 1) && q.n <= q.d * q.max && q.d * q.max <= 12, `${tag}: limits`);
      check(q.ask === 'put' ? w === q.n && !right(q, q.n + 1) : w[0] === q.n && w[1] === q.d, `${tag}: answer`); break;
    case 'cmp': case 'same': { check(proper(q.a, q.b) && proper(q.c, q.d), `${tag}: limits`);
      check(q.hide || (q.b <= 24 && q.d <= 24), `${tag}: cannot be drawn`);
      const x = q.a / q.b, y = q.c / q.d, s = same(x, y) ? '=' : x < y ? '<' : '>';
      if (q.mode === 'cmp') check(w === s && ['<', '=', '>'].filter(z => right(q, z)).length === 1, `${tag}: answer`);
      else check(w === same(x, y) && right(q, String(w)) && !right(q, String(!w)), `${tag}: answer`);
      break; }
    case 'cut': check(proper(q.n, q.d) && q.shape in ROOM && q.shape !== 'clock' && q.k >= 2 && smooth(q.k) && q.d * q.k <= ROOM[q.shape] && (q.shape !== 'choc' || (q.d <= 6 && q.k <= 6)), `${tag}: limits`);
      check(w === q.n * q.k && same(w / (q.d * q.k), q.n / q.d) && !right(q, q.n), `${tag}: answer`); break;
    case 'fill': check(proper(q.n, q.d) && proper(q.N, q.D) && ['N', 'D'].includes(q.miss) && q.d !== q.D, `${tag}: limits`);
      check(q.n * q.D === q.N * q.d && (q.D % q.d === 0 || q.d % q.D === 0), `${tag}: not equivalent by one whole factor`);
      check(q.hide || (q.d <= 24 && q.D <= 24), `${tag}: cannot be drawn`);
      check(w === (q.miss === 'N' ? q.N : q.D) && !right(q, w + 1), `${tag}: answer`); break;
    case 'join': { const k = g(q.n, q.d);
      check(proper(q.n, q.d) && k > 1 && smooth(k) && [...ROUND, 'bar'].includes(q.shape), `${tag}: limits`);
      check(q.hide || q.d <= ROOM[q.shape], `${tag}: cannot be drawn`);
      check(g(w[0], w[1]) === 1 && w[0] * q.d === w[1] * q.n && !right(q, [q.n, q.d]), `${tag}: not the lowest terms`); break; }
    case 'imp': check([...ROUND, ...LONG].includes(q.shape) && int(q.w) && q.w >= 1 && q.w <= 4 && int(q.n) && q.n >= 0 && q.n < q.d && q.d >= 2 && q.d <= 8, `${tag}: limits`);
      check(same(w / q.d, q.w + q.n / q.d) && !right(q, w + 1), `${tag}: answer`); break;
    case 'mix': check([...ROUND, ...LONG].includes(q.shape) && int(q.a) && q.d >= 2 && q.d <= 10 && q.a > q.d && q.a % q.d && q.a / q.d < 5, `${tag}: limits`);
      check(w[0] >= 1 && w[1] >= 1 && w[1] < q.d && w[0] * q.d + w[1] === q.a, `${tag}: answer`); break;
    case 'add': { const [s, L] = sumOf(q), v = q.op === '+' ? q.a / q.b + q.c / q.d : q.a / q.b - q.c / q.d;
      check(proper(q.a, q.b) && proper(q.c, q.d) && ['+', '−'].includes(q.op) && s >= 1 && (!q.D || q.D % L === 0), `${tag}: limits`);
      check(q.hide || L <= 24, `${tag}: cannot be drawn`);
      if (q.D) check(int(w) && same(w / q.D, v) && !right(q, w + 1), `${tag}: answer`);
      else check(same(w[0] / w[1], v) && g(w[0], w[1]) === 1 && right(q, [w[0] * 2, w[1] * 2]) && !right(q, [w[0] + 1, w[1]]) && (q.op !== '+' || !right(q, [q.a + q.c, q.b + q.d])), `${tag}: answer`);
      break; }
    case 'times': check(proper(q.n, q.d) && q.d <= 12 && int(q.k) && q.k >= 2 && q.k <= 6, `${tag}: limits`);
      check(same(w / q.d, q.k * q.n / q.d) && !right(q, q.n), `${tag}: answer`); break;
    case 'of': check(proper(q.n, q.d) && q.d <= 12 && int(q.T) && q.T % q.d === 0 && q.T <= 1000 && typeof q.unit === 'string' && q.unit && q.unit !== 'undefined', `${tag}: limits`);
      check(int(w) && same(w, q.T * q.n / q.d) && String(w).length <= 4, `${tag}: answer`); break;
    case 'pct': check(proper(q.n, q.d) && 100 % q.d === 0, `${tag}: limits`);
      check(int(w) && same(w / 100, q.n / q.d), `${tag}: answer`); break;
    case 'dec': { const o = decOpts(q), val = s => +s.replace(',', '.');
      check(proper(q.n, q.d) && 100 % q.d === 0, `${tag}: limits`);
      check(o.length === 3 && new Set(o.map(val)).size === 3 && o.filter(x => right(q, x)).length === 1 && same(val(w), q.n / q.d) && w === deci(q.n, q.d), `${tag}: answer ${o}`); break; }
    default: check(false, `${tag}: unknown mode`);
  }
  // a typed answer fits in its box, and the game has something to say at every step
  if (kindOf(q) === 'frac' || kindOf(q) === 'num') check([w].flat().every(x => String(x).length <= 4), `${tag}: answer too long to type`);
  for (const txt of [tipFor(q), explain(q, false), explain(q, true)]) check(typeof txt === 'string' && txt.length > 8 && !/undefined|NaN|null/.test(txt), `${tag}: says «${txt}»`);
}

check(PROJECTS.length === 14, 'fourteen projects');
check(CIRCLES.flatMap(c => c.projects).join() === PROJECTS.map((_, i) => i).join(), 'every project in one circle, in order');
PROJECTS.forEach((P, p) => {
  check(P.levels.length === 10, `project ${p}: ten levels`);
  P.levels.forEach((L, l) => {
    check(L.qs.length === 5 && L.qs.every(q => q && q.mode), `project ${p} level ${l + 1}: five questions`);
    L.qs.filter(q => q && q.mode).forEach(q => valid(q, `p${p} l${l + 1}`, P.modes));
  });
  if (p < 13) P.modes.forEach(m => check(P.levels.some(L => L.qs.some(q => q && q.mode === m)), `project ${p}: no level teaches ${m}`));
});
POOL.forEach(q => valid(q, 'piscina', ['equal', 'paint', 'name']));

// a seeded generator, so a failure can be reproduced
let seed = 1000;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const ALL = PROJECTS[13].modes.concat('cut', 'imp');
CIRCLES.forEach((C, c) => {
  for (let i = 0; i < 300; i++) {
    const qs = exam(c, rnd);
    check(qs.length === 6 && C.projects.every(p => qs.some(q => q.p === p)) && qs.every(q => C.projects.includes(q.p)), `exam of circle ${c}: six questions, one of each project`);
    check(new Set(qs.map(q => JSON.stringify(q))).size === 6, `exam of circle ${c}: a question twice`);
    qs.forEach(q => valid(q, `exam c${c}`, q.p === 13 ? ALL : PROJECTS[q.p].modes));
  }
});
const done = clean({ lv: Array(140).fill(3), piscina: true });
for (const p of [clean(null), clean({ lv: Array(30).fill(3) }), done]) {
  const qs = sprint(p, rnd);
  check(qs.length === 40 && qs.every(q => kindOf(q) !== 'check'), 'lightning round: forty questions, none built on the figure');
  qs.forEach(q => valid(q, 'sprint', ALL));
}
const seen = new Set();
for (let i = 0; i < 2000; i++) {
  const cs = sheet(rnd), bad = cs.filter(c => c.says !== c.real).length;
  check(cs.length === 3 && new Set(cs.map(c => c.kind)).size === 3 && bad <= 2, 'sheet: three claims of three kinds, at most two wrong');
  cs.forEach(c => { seen.add(c.kind + (c.says !== c.real));
    check(c.opts.length === 3 && new Set(c.opts).size === 3 && c.opts.includes(c.real) && c.opts.includes(c.says) && c.opts.every(v => typeof v === 'string'), `sheet ${JSON.stringify(c)}: choices`); });
}
check(seen.size === KINDS.length * 2, 'sheet: every kind comes out right and wrong');

// the cuts of the figures
check(cuts(4).length === 4 && cuts(6, 3).filter(c => c[1] === 'new').length === 3 && cuts(2, 6).filter(c => c[1] === 'gone').length === 4 && cuts(1).length === 0 && cuts(6, 4).every(c => !c[1]), 'cuts');
check(snips(6).join() === '2,3' && snips(4).join() === '2,2' && snips(10).join() === '2,5', 'snips');

// the cursus: a new player, a save from before it, and one with everything done
const zero = clean(null), old = clean({ so: false, secs: [10, 10, 3], stars: [...Array(20).fill(3), 2, 2, 1] });
check(!zero.piscina && zero.lv.length === 140 && zero.exams.length === 5 && xpOf(zero) === 0 && levelText(zero) === '0,00' && !isOpen(zero, 0) && zero.so, 'a new progress');
check(old.piscina && !old.so && noteOf(old, 0) === 100 && noteOf(old, 1) === 100 && noteOf(old, 2) === 21 && isOpen(old, 0) && !examOpen(old, 0) && !isOpen(old, 1), 'a save from before the cursus keeps its stars');
check(clean({ stars: Array(80).fill(3) }).lv.filter(Boolean).length === 80 && noteOf(clean({ stars: Array(80).fill(3) }), 4) === 0 && noteOf(clean({ stars: Array(80).fill(3) }), 8) === 100, 'the eight old sections land on their projects');
check(JSON.stringify(clean(clean(old))) === JSON.stringify(old) && clean({ lv: 'x', exams: [1, true], fulls: -3, rapid: 2.7, ratxa: NaN }).exams.join() === 'false,true,false,false,false', 'clean is stable and takes anything');
{ const a = levelIn(zero, 0, 0, 0), b = levelIn(a.prog, 0, 0, 5);
  check(a.n === 3 && a.note === 10 && a.gain === 0 && !a.valid && b.n === 1 && b.note === 10 && zero.lv[0] === 0, 'a level keeps its best stars'); }
{ let p = clean({ piscina: true }), r;
  for (let i = 0; i < 8; i++) r = levelIn(p, 0, i, 0), p = r.prog;
  check(r.valid && r.gain === 80 && r.news.includes('Primer projecte') && !r.exam && xpOf(p) === 130, 'eight levels with three stars validate a project');
  const opened = [], got = [];
  for (const i of [1, 2]) for (let k = 0; k < 10; k++) { r = levelIn(p, i, k, 0); p = r.prog; got.push(...r.news); if (r.exam) opened.push(`${i}.${k}`); }
  check(opened.join() === '2.7' && examOpen(p, 0) && got.join() === 'Nota 100', 'the exam opens when the last project is validated');
  const qs = exam(0, rnd), miss = examIn(p, 0, qs, [true, true, true, true, false, false]), pass = examIn(p, 0, qs, [true, true, true, true, true, false]);
  check(!miss.good && miss.score === 4 && miss.redo.length >= 1 && !miss.prog.exams[0] && pass.good && pass.gain === 50 && isOpen(pass.prog, 1) && !p.exams[0], 'the exam is passed with five of six');
  check(!examIn(zero, 0, qs, Array(6).fill(true)).good, 'an exam that is not open does not count');
  const s = sheetIn(p, [true, true, true]), t = sheetIn(p, [true, false, true]);
  check(s.good && s.gain === 10 && s.prog.fulls === 1 && s.news.includes('Ull de falcó') && !t.good && t.missed.join() === '1' && t.prog.fulls === 0, 'a sheet counts with its three claims right');
  const k = streakIn(p, 10), k2 = streakIn(k.prog, 4), l = rapidIn(p, 12);
  check(k.best && k.prog.ratxa === 10 && k.news.join() === 'Ratxa de 10' && !k2.best && k2.prog.ratxa === 10 && l.best && l.news.join() === 'Llampec' && p.rapid === 0, 'the best run and the best lightning round are kept'); }
check(xpOf(done) === 50 + 1400 && xpOf({ ...done, exams: Array(5).fill(true), fulls: 99 }) === 2120 && levelText({ ...done, exams: Array(5).fill(true), fulls: 99 }) === '14,13', 'XP at most');
check(badges({ ...done, exams: Array(5).fill(true), fulls: 10, rapid: 12, ratxa: 10 }).every(Boolean) && badges(zero).every(b => !b) && badges(zero).length === BADGES.length, 'badges');

if (fails) { console.error(`${fails} checks failed`); process.exit(1); }
console.log(`nenufars-a-trossos: ${PROJECTS.reduce((n, P) => n + P.levels.reduce((m, L) => m + L.qs.length, 0), 0)} level questions, ${CIRCLES.length * 300} exams, 2000 sheets`);
