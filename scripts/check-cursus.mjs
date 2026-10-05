// Checks the rules of El cursus de l'estany before every build: the 75 fixed questions of circles 0 and 1, the limits of every project
// (worked out again here, never asked of inLimits) and what the game says. Run: node scripts/check-cursus.mjs
// Sections below each end before the footer; a later task appends its own section above it.
import { PROJECTS, CIRCLES, want, right, tipFor, explain, said, inLimits } from '../games/cursus-de-l-estany/logic.js';

let fails = 0, counted = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const int = x => Number.isInteger(x);
const BAD = /undefined|NaN|null|\[object/;
const MODES = ['share', 'group', 'fact', 'rem', 'proof', 'tens', 'split', 'long'];
const sum = a => a.reduce((x, y) => x + y, 0);

// the limits table, recomputed: the problems of question q in project p (e is the exercise, or -1 when the exercise is not known)
function problems(q, p, e) {
  const out = [], bad = (cond, why) => { if (!cond) out.push(why); };
  const { D, d } = q;
  bad(q.mode === MODES[p], 'mode');
  bad(int(D) && int(d) && D >= 1, 'whole numbers');
  if (out.length) return out;
  const Q = Math.floor(D / d), R = D % d, parts = q.parts;
  switch (p) {
    case 0: bad(D <= (e === 0 ? 12 : 30) && d >= 2 && d <= 5 && R === 0, 'repartir'); break;
    case 1: bad(D <= 40 && d >= 2 && d <= 10 && R === 0, 'fer grups'); break;
    case 2: bad(D <= 100 && d >= 2 && d <= 10 && R === 0 && Q >= 1 && Q <= 10, 'la taula al revés'); break;
    case 3: bad(D <= (e === 2 || e === -1 ? 100 : 50) && d >= 2 && d <= 10 && Q >= 1 && Q <= 10, 'en sobra'); break;
    case 4: bad(int(q.q) && int(q.r) && d >= 2 && d <= 10 && q.q >= 1 && q.q <= 10 && q.r >= 0 && q.r < d && D === d * q.q + q.r && D <= 100, 'comprova'); break;
    case 5: bad(D % 10 === 0 && D >= 10 && D <= 990 && d >= 2 && d <= 9 && (D / 10) % d === 0, 'desenes senceres'); break;
    case 6: bad(D >= 20 && D <= 99 && d >= 2 && d <= 9 && R === 0, 'a trossos: numbers');
      if (!q.bare || parts) bad(Array.isArray(parts) && parts.length === 2 && parts.every(x => int(x) && x > 0) && sum(parts) === D
        && parts.every(x => x % d === 0) && parts[0] % (10 * d) === 0, 'a trossos: parts'); break;
    case 7: bad(D >= 100 && D <= 999 && d >= 2 && d <= 9, 'tres xifres: numbers');
      if (!q.bare || parts) bad(Array.isArray(parts) && (parts.length === 2 || parts.length === 3) && parts.every(x => int(x) && x > 0) && sum(parts) === D
        && parts.slice(0, -1).every(x => x % d === 0) && parts[0] % (10 * d) === 0, 'tres xifres: parts'); break;
  }
  return out;
}
// what the child has to write, worked out here from D and d alone
function expected(q) {
  const Q = Math.floor(q.D / q.d), R = q.D % q.d;
  switch (q.mode) {
    case 'share': case 'group': case 'fact': case 'tens': return Q;
    case 'proof': return q.D;
    case 'rem': return [Q, R];
    case 'split': return q.bare ? Q : [...q.parts.map(x => x / q.d), Q];
    case 'long': return q.bare ? [Q, R] : [...q.parts.slice(0, -1).map(x => x / q.d), Math.floor(q.parts[q.parts.length - 1] / q.d), Q, R];
  }
}

// ---- 1. the shape of the data
check(PROJECTS.length === 8, 'eight projects');
check(CIRCLES.length === 3, 'three circles');
check(CIRCLES.map(c => c.projects.join()).join('|') === '0,1|2,3,4|5,6,7', 'circles hold projects 0-1, 2-4, 5-7');   // contract: spec «El mapa», plan
check(PROJECTS.map(p => p.circle).join('') === '00111222', 'circle of each project');   // contract: spec «El mapa»
check(PROJECTS.map(p => p.mode).join() === MODES.join(), 'one mode per project, in the order of the data table');   // contract: plan «Dades»
check(PROJECTS.map(p => p.name).join('|') === 'Repartir|Fer grups|La taula al revés|En sobra|Comprova|Desenes senceres|A trossos|Tres xifres', 'project names');   // contract: spec «El mapa»
check(PROJECTS.every(p => typeof p.sub === 'string' && p.sub.length > 10 && !BAD.test(p.sub)), 'every project has a subtitle');
check(CIRCLES.every(c => typeof c.name === 'string' && c.name.length > 3), 'every circle has a name');

// ---- 2. the questions
PROJECTS.forEach((P, p) => {
  if (P.circle === 2) { check(P.ex.length === 0, `${P.name}: circle 2 is filled by a later task`); return; }
  check(P.ex.length === 3, `${P.name}: three exercises`);
  P.ex.forEach((E, e) => {
    const where = `${P.name} ex0${e}`;
    check(E.length === 5, `${where}: five questions`);
    E.forEach(q => {
      counted++;
      const tag = `${where} ${JSON.stringify(q)}`, w = want(q), x = expected(q);
      // mode, limits, and D = d × q + r with 0 ≤ r < d
      check(q.mode === P.mode, `${tag}: mode of the project`);
      const bad = problems(q, p, e);
      check(bad.length === 0, `${tag}: out of limits (${bad.join()})`);
      const Q = q.mode === 'proof' ? q.q : Math.floor(q.D / q.d), R = q.mode === 'proof' ? q.r : q.D % q.d;
      check(q.D === q.d * Q + R && R >= 0 && R < q.d, `${tag}: D = d × q + r`);
      check(inLimits(q, p) === (problems(q, p, -1).length === 0) && inLimits(q, p) === true, `${tag}: inLimits disagrees`);
      // hands at ex00, material in view at ex01, hidden at ex02
      check(!q.bare, `${tag}: fixed questions carry material`);
      check(e === 0 ? q.hands === true && !q.hide : e === 1 ? !q.hands && !q.hide : q.hide === true && !q.hands, `${tag}: hands / view / hide`);
      // the answer, and the neighbours that must be refused
      check(String(w) === String(x), `${tag}: want() is ${w}, worked out here ${x}`);
      check(right(q, w) && right(q, String(w)), `${tag}: right() rejects want()`);
      if (Array.isArray(x)) {
        const at = q.mode === 'split' ? x.length - 1 : q.mode === 'long' ? x.length - 2 : 0;   // index of the quotient
        for (const dx of [1, -1]) check(!right(q, x.map((v, i) => i === at ? v + dx : v)), `${tag}: accepts the quotient ${dx > 0 ? '+' : '-'} 1`);
        if (q.mode !== 'split') check(!right(q, x.map((v, i) => i === at ? v - 1 : i === at + 1 ? v + q.d : v)), `${tag}: accepts [q - 1, r + d]`);
      } else for (const dx of [1, -1]) check(!right(q, x + dx), `${tag}: accepts ${x + dx}`);
      check(q.mode !== 'proof' || (q.q === Q && q.r === R), `${tag}: proof keeps q and r`);
    });
  });
  // limits that belong to the exercise as a whole
  if (p === 3) P.ex.forEach((E, e) => check(E.filter(q => q.D % q.d).length >= 4, `En sobra ex0${e}: at least four of five have a remainder`));   // contract: plan «Límits per projecte»
  if (p === 7) [1, 2].forEach(e => check(P.ex[e].filter(q => q.D % q.d).length >= 2, `Tres xifres ex0${e}: at least two of five have a remainder`));   // contract: plan «Límits per projecte»
  // the divisors vary inside an exercise, and no question comes twice in a project
  P.ex.forEach((E, e) => check(new Set(E.map(q => q.d)).size >= 3, `${P.name} ex0${e}: at least three different divisors`));
  check(new Set(P.ex.flat().map(q => q.D + '/' + q.d)).size === P.ex.flat().length, `${P.name}: a question is repeated`);
});

// the limits themselves: inLimits and the table here agree on questions that sit just outside them
PROJECTS.forEach((P, p) => P.ex.flat().forEach(q => {
  const near = [{ ...q, D: q.D + 1 }, { ...q, D: q.D * 5 }, { ...q, d: q.d + 1 }, { ...q, d: 1 }, { ...q, d: 11 }, { ...q, mode: MODES[(p + 1) % 8] },
    ...(q.mode === 'proof' ? [{ ...q, r: q.r + q.d }, { ...q, q: 11 }, { ...q, q: 0, D: q.r }] : [])];
  near.forEach(m => check(inLimits(m, p) === (problems(m, p, -1).length === 0), `inLimits disagrees on ${JSON.stringify(m)} in ${P.name}`));
}));
// the exact edges of the table, one by one
const edge = (p, q, ok, why) => { check(inLimits(q, p) === ok, `inLimits(${why})`); check((problems(q, p, -1).length === 0) === ok, `limits table here (${why})`); };
edge(0, { mode: 'share', D: 30, d: 5 }, true, 'Repartir 30 ÷ 5');   // contract: plan, Repartir D ≤ 30, d 2–5
edge(0, { mode: 'share', D: 31, d: 1 }, false, 'Repartir d = 1');   // contract: plan, Repartir d 2–5
edge(0, { mode: 'share', D: 36, d: 6 }, false, 'Repartir d = 6');   // contract: plan, Repartir d 2–5
edge(0, { mode: 'share', D: 7, d: 2 }, false, 'Repartir is exact');   // contract: plan, Repartir exacta
edge(1, { mode: 'group', D: 40, d: 10 }, true, 'Fer grups 40 ÷ 10');   // contract: plan, Fer grups D ≤ 40, d 2–10
edge(1, { mode: 'group', D: 44, d: 11 }, false, 'Fer grups d = 11');   // contract: plan, Fer grups d 2–10
edge(2, { mode: 'fact', D: 100, d: 10 }, true, 'La taula 100 ÷ 10');   // contract: plan, La taula al revés D ≤ 100, quocient 1–10
edge(2, { mode: 'fact', D: 99, d: 3 }, false, 'La taula quotient 33');   // contract: plan, quocient 1–10
edge(3, { mode: 'rem', D: 100, d: 10 }, true, 'En sobra 100 ÷ 10');   // contract: plan, En sobra D ≤ 100 a ex02, quocient ≤ 10
edge(3, { mode: 'rem', D: 100, d: 9 }, false, 'En sobra quotient 11');   // contract: plan, En sobra quocient ≤ 10
edge(4, { mode: 'proof', D: 17, d: 5, q: 3, r: 2 }, true, 'Comprova 5 × 3 + 2');   // contract: spec «El mapa», 17 ÷ 5 = 3 i en sobren 2
edge(4, { mode: 'proof', D: 20, d: 5, q: 3, r: 5 }, false, 'Comprova r = d');   // contract: plan, Comprova r de 0 a d − 1
edge(5, { mode: 'tens', D: 990, d: 9 }, true, 'Desenes 990 ÷ 9');   // contract: plan, Desenes senceres D fins a 990, D / 10 divisible per d
edge(5, { mode: 'tens', D: 80, d: 3 }, false, 'Desenes 8 desenes ÷ 3');   // contract: plan, D / 10 divisible per d
edge(5, { mode: 'tens', D: 85, d: 5 }, false, 'Desenes D not a multiple of 10');   // contract: plan, D múltiple de 10
edge(6, { mode: 'split', D: 84, d: 4, parts: [80, 4] }, true, 'A trossos 84 ÷ 4');   // contract: spec «El mapa», 84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4
edge(6, { mode: 'split', D: 72, d: 4, parts: [40, 32] }, true, 'A trossos 72 ÷ 4');   // contract: spec «El mapa», 72 ÷ 4 = 40 ÷ 4 + 32 ÷ 4
edge(6, { mode: 'split', D: 72, d: 4, parts: [32, 40] }, false, 'A trossos first not a multiple of 10 × d');   // contract: plan, el primer múltiple de 10 × d
edge(6, { mode: 'split', D: 84, d: 4, parts: [80, 3] }, false, 'A trossos parts do not add up');   // contract: plan, trossos que sumen D
edge(6, { mode: 'split', D: 100, d: 4, parts: [80, 20] }, false, 'A trossos D = 100');   // contract: plan, A trossos D de 20 a 99
edge(7, { mode: 'long', D: 157, d: 4, parts: [120, 37] }, true, 'Tres xifres two parts, remainder');   // contract: plan, tots divisibles llevat de l'últim
edge(7, { mode: 'long', D: 157, d: 4, parts: [80, 40, 37] }, true, 'Tres xifres three parts');   // contract: plan, 2 o 3 trossos
edge(7, { mode: 'long', D: 157, d: 4, parts: [80, 37, 40] }, false, 'Tres xifres only the last may not divide');   // contract: plan, tots divisibles llevat de l'últim
edge(7, { mode: 'long', D: 1000, d: 4, parts: [1000] }, false, 'Tres xifres D = 1000');   // contract: plan, Tres xifres D de 100 a 999
edge(7, { mode: 'long', D: 157, d: 10, parts: [100, 57] }, false, 'Tres xifres d = 10');   // contract: plan, cercle 2 divisor de 2 a 9

// the circle 2 modes have no fixed questions yet, so they are tried here on questions made by hand
const hand = [
  { q: { mode: 'tens', D: 120, d: 3 }, w: 40 },   // contract: spec «El mapa», 120 ÷ 3
  { q: { mode: 'tens', D: 600, d: 2 }, w: 300 },   // contract: spec «El mapa», 600 ÷ 2
  { q: { mode: 'split', D: 84, d: 4, parts: [80, 4] }, w: [20, 1, 21] },   // contract: spec «El mapa», 84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4
  { q: { mode: 'split', D: 72, d: 4, parts: [40, 32] }, w: [10, 8, 18] },   // contract: spec «El mapa», 72 ÷ 4 = 40 ÷ 4 + 32 ÷ 4
  { q: { mode: 'split', D: 72, d: 4, bare: true }, w: 18 },   // contract: plan, bare split vol q
  { q: { mode: 'long', D: 157, d: 4, parts: [120, 37] }, w: [30, 9, 39, 1] },   // contract: 157 = 4 × 39 + 1; 120 ÷ 4 = 30, 37 ÷ 4 = 9 r 1
  { q: { mode: 'long', D: 157, d: 4, parts: [80, 40, 37] }, w: [20, 10, 9, 39, 1] },   // contract: 157 = 4 × 39 + 1
  { q: { mode: 'long', D: 157, d: 4, bare: true }, w: [39, 1] }   // contract: plan, bare long vol [q, r]
];
hand.forEach(({ q, w }) => {
  const tag = JSON.stringify(q);
  check(String(want(q)) === String(w), `${tag}: want() is ${want(q)}, expected ${w}`);
  check(right(q, w), `${tag}: right() rejects the answer`);
  check(!right(q, Array.isArray(w) ? w.map((v, i) => i === w.length - 1 ? v + 1 : v) : w + 1), `${tag}: accepts a wrong answer`);
});

// ---- 3. what the game says
const wrongs = q => {
  const w = want(q);
  if (!Array.isArray(w)) return [undefined, w + 1, w - 1, 0, '', 'abc'];
  return [undefined, w.map(v => v + 1), w.map(() => 0), [], ['', 'x'], w.map((v, i) => i === w.length - 2 ? v - 1 : i === w.length - 1 ? v + q.d : v)];
};
function spoken(q, where) {
  const tag = `${where} ${JSON.stringify(q)}`;
  for (const deep of [false, true]) for (const ans of wrongs(q)) for (const txt of [tipFor(q), explain(q, deep, ans)])
    check(typeof txt === 'string' && txt.length > 10 && !BAD.test(txt), `${tag}: says "${txt}"`);
  const s = said(q);
  check(typeof s === 'string' && s.length > 10 && !BAD.test(s), `${tag}: said "${s}"`);
  const sd = String(s);
  check(sd.includes(`${q.D}`) && sd.includes(`${q.d}`), `${tag}: said does not tell the whole division ("${sd}")`);
}
PROJECTS.forEach((P, p) => P.ex.forEach((E, e) => E.forEach(q => spoken(q, `${P.name} ex0${e}`))));
hand.forEach(({ q }) => { spoken(q, 'by hand'); spoken({ ...q, hide: true, hands: true }, 'by hand, hidden'); });
// the mistake that matters: 17 ÷ 5 written as 2 and 7 satisfies D = d × q + r and is still wrong, because with 7 one more group can be made
const r17 = { mode: 'rem', D: 17, d: 5 };
check(!right(r17, [2, 7]) && right(r17, [3, 2]), '17 ÷ 5 is 3 and 2');   // contract: spec «El mapa», 17 ÷ 5 = 3 i en sobren 2
check(2 * 5 + 7 === 17, '[2, 7] does satisfy D = d × q + r');   // contract: 5 × 2 + 7 = 17
for (const deep of [false, true]) {
  check(/un grup més/.test(explain(r17, deep, [2, 7])), `17 ÷ 5 = [2, 7] (deep ${deep}) must say one more group can be made: "${explain(r17, deep, [2, 7])}"`);
  check(!/multiplicant/.test(explain(r17, deep, [2, 7])), '[2, 7] is not a multiplication slip');
  check(/multiplicant/.test(explain(r17, deep, [3, 3])), `17 ÷ 5 = [3, 3] (deep ${deep}) must say to check by multiplying: "${explain(r17, deep, [3, 3])}"`);   // contract: 5 × 3 + 3 = 18, not 17
  check(/multiplicant/.test(explain(r17, deep, [4, 1])), `17 ÷ 5 = [4, 1] (deep ${deep}) must say to check by multiplying`);   // contract: 5 × 4 + 1 = 21, not 17
}
// the first hint on a long division written as a remainder too large says the same
check(/un grup més/.test(explain({ mode: 'long', D: 157, d: 4, parts: [120, 37] }, false, [30, 9, 38, 5])), 'long: a remainder of 5 with d = 4 can make another group');   // contract: 5 ≥ 4
// the full explanation ends up telling the answer
PROJECTS.forEach(P => P.ex.flat().forEach(q => {
  const w = want(q), deep = explain(q, true), last = Array.isArray(w) ? w[0] : w;
  check(q.mode === 'proof' || deep.includes(String(last)) || deep.includes(String(Math.floor(q.D / q.d))), `${JSON.stringify(q)}: the full explanation does not tell the answer`);
}));

// ---- footer
if (fails) { console.error(`${fails} failures`); process.exit(1); }
console.log(`cursus-de-l-estany: ${counted} preguntes`);
