// Checks the rules of El cursus de l'estany before every build: the 120 fixed questions of the three circles, the limits of every project
// (worked out again here, never asked of inLimits) and what the game says. Run: node scripts/check-cursus.mjs
// Sections below each end before the footer; a later task appends its own section above it.
import { PROJECTS, CIRCLES, want, right, tipFor, explain, said, inLimits, exam, sheet, judge, EXAM_PASS,
  VALID, mark, clean, validated, xpOf, levelText, isOpen, examOpen, BADGES, badges, TEAMS } from '../games/cursus-de-l-estany/logic.js';

let fails = 0, counted = 0, exams = 0, fulls = 0;
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
      if (!q.bare) bad(Array.isArray(parts) && parts.length === 2 && parts.every(x => int(x) && x > 0) && sum(parts) === D
        && parts.every(x => x % d === 0) && parts[0] % (10 * d) === 0, 'a trossos: parts'); break;
    case 7: bad(D >= 100 && D <= 999 && d >= 2 && d <= 9, 'tres xifres: numbers');
      if (!q.bare) bad(Array.isArray(parts) && (parts.length === 2 || parts.length === 3) && parts.every(x => int(x) && x > 0) && sum(parts) === D
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
  if (p === 7) [1, 2].forEach(e => check((P.ex[e] ?? []).filter(q => q.D % q.d).length >= 2, `Tres xifres ex0${e}: at least two of five have a remainder`));   // contract: plan «Límits per projecte»
  // the divisors vary inside an exercise, and no question comes twice in a project
  P.ex.forEach((E, e) => check(new Set(E.map(q => q.d)).size >= 3, `${P.name} ex0${e}: at least three different divisors`));
  check(new Set(P.ex.flat().map(q => q.D + '/' + q.d)).size === P.ex.flat().length, `${P.name}: a question is repeated`);
});

// ---- 2b. circle 2: the parts of every split and long question, and what a changed part does
const C2 = PROJECTS.flatMap((P, p) => P.circle === 2 ? P.ex.flatMap((E, e) => E.map(q => ({ q, p, where: `${P.name} ex0${e}` }))) : []);
check(C2.length === 45, `circle 2 has ${C2.length} questions, not 45`);   // contract: plan, 3 projectes × 3 exercicis × 5 preguntes
const chunk = (q, p) => new RegExp(`(?<!\\d)${p} ÷ ${q.d}(?!\\d)`);   // "37 ÷ 4" as a whole, never inside "137 ÷ 4"
C2.filter(({ q }) => q.mode !== 'tens').forEach(({ q, where }) => {
  const tag = `${where} ${JSON.stringify(q)}`, t = q.parts, n = t.length, isLong = q.mode === 'long', w = want(q), Q = Math.floor(q.D / q.d);
  check(sum(t) === q.D, `${tag}: the parts do not add up to D`);   // contract: plan, trossos que sumen D
  check(t.slice(0, isLong ? -1 : n).every(x => x % q.d === 0), `${tag}: a part that should divide exactly does not`);   // contract: plan, tots divisibles llevat de l'últim a long
  check(t[0] % (10 * q.d) === 0, `${tag}: the first part is not a multiple of 10 × d`);   // contract: plan, el primer múltiple de 10 × d
  check(isLong ? n === 2 || n === 3 : n === 2, `${tag}: ${n} parts`);   // contract: plan, split 2 trossos; long 2 o 3
  check(Array.isArray(w) && w.length === n + (isLong ? 2 : 1), `${tag}: want() has no value for each part, the total${isLong ? ' and the remainder' : ''}`);
  check(String(w.slice(0, n)) === String(t.map(x => Math.floor(x / q.d))), `${tag}: the partials are not the quotient of each part`);
  check(w[n] === sum(w.slice(0, n)) && w[n] === Q, `${tag}: the total is not the sum of the partials`);
  if (isLong) check(w[n + 1] === t[n - 1] % q.d && w[n + 1] === q.D % q.d, `${tag}: the remainder does not come from the last part alone`);
  // a bare question carries no parts: split wants q, long wants [q, r], with or without parts at hand
  for (const b of [{ ...q, bare: true }, { ...q, bare: true, parts: undefined }]) check(String(want(b)) === String(isLong ? [Q, q.D % q.d] : Q), `${tag}: bare want() is ${want(b)}`);   // contract: plan, bare
  // one part changed, the total kept: refused, and the hint names that part and no other
  const x = expected(q);
  // with the material hidden or in view (not ex00), every chunk divides as a table fact times 1, 10 or 100: k × 10^n with k from 1 to 10
  if (!q.hands) t.forEach((x, i) => { const v = isLong && i === n - 1 ? Math.floor(x / q.d) : x / q.d;
    check(/^[1-9]0*$/.test(String(v)), `${tag}: the chunk ${x} ÷ ${q.d} = ${v} is not a table fact times 1, 10 or 100`); });   // contract: review fix round 1, ex01 and ex02
  // the tip lists the parts with "i" before the last
  check(tipFor(q).includes(`${t.slice(0, -1).join(', ')} i ${t[n - 1]}`), `${tag}: the tip does not list the parts with "i" before the last: "${tipFor(q)}"`);   // contract: review fix round 1
  // a part whose value comes twice is named by its place
  t.forEach((p, i) => {
    if (t.filter(o => o === p).length < 2) return;
    const ord = ['primer', 'segon', 'tercer'][i], ans = x.map((v, k) => k === i ? v + 1 : v), txt = explain(q, false, ans);
    check(txt.includes(`${ord} tros`), `${tag}: the part ${p} comes twice, and the hint for ${ans} does not say the ${ord}: "${txt}"`);   // contract: review fix round 1, [90, 90, 9]
  });
  t.forEach((p, i) => {
    for (const dx of [1, -1]) {
      const ans = x.map((v, k) => k === i ? v + dx : v), txt = explain(q, false, ans);
      check(!right(q, ans), `${tag}: accepts a part changed by ${dx}`);
      check(chunk(q, p).test(txt), `${tag}: hint for ${ans} does not name the part ${p}: "${txt}"`);
      check(t.every((o, j) => j === i || o === p || !chunk(q, o).test(txt)), `${tag}: hint for ${ans} names a part that is right: "${txt}"`);
    }
  });
  check(!/Torna a mirar/.test(explain(q, false, x.map((v, k) => k === n ? v + 1 : v))), `${tag}: a wrong total with right parts points at a part`);
});
// the two kinds of split of the spec: tens and units (84 = 80 + 4) and a first part that is not all the tens (72 = 40 + 32)
const splits = PROJECTS[6].ex.flat();
check(splits.some(q => q.parts[0] === Math.floor(q.D / 10) * 10), 'A trossos: no tens-and-units split');   // contract: spec «El mapa», 84 = 80 + 4
check(splits.some(q => q.parts[0] < Math.floor(q.D / 10) * 10), 'A trossos: no split with a first part short of all the tens');   // contract: spec «El mapa», 72 = 40 + 32
// Tres xifres mixes two and three parts, in each exercise
PROJECTS[7].ex.forEach((E, e) => [2, 3].forEach(k => check(E.some(q => q.parts.length === k), `Tres xifres ex0${e}: no question with ${k} parts`)));   // contract: plan, 2 o 3 trossos
// bare changes nothing for the modes that have no parts
PROJECTS.forEach(P => P.ex.flat().filter(q => q.mode !== 'split' && q.mode !== 'long').forEach(q => check(String(want({ ...q, bare: true })) === String(want(q)), `${JSON.stringify(q)}: bare changes want()`)));

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
edge(6, { mode: 'split', D: 72, d: 4, bare: true }, true, 'A trossos bare without parts');   // contract: plan, bare no porta parts
edge(6, { mode: 'split', D: 72, d: 4, bare: true, parts: [1, 71] }, true, 'A trossos bare: parts are not checked');   // contract: plan, les regles de parts valen només si no hi ha bare
edge(6, { mode: 'split', D: 73, d: 4, bare: true }, false, 'A trossos bare is exact');   // contract: plan, A trossos exacta
edge(7, { mode: 'long', D: 157, d: 4, bare: true }, true, 'Tres xifres bare without parts');   // contract: plan, bare no porta parts
edge(7, { mode: 'long', D: 99, d: 4, bare: true }, false, 'Tres xifres bare D = 99');   // contract: plan, Tres xifres D de 100 a 999

// questions made by hand: the examples of the spec, and the bare ones, which the exams and sheets will make
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
// patterns no text may show: a division printed twice, N = N, a plural after the number 1 (or a singular after any other), a one-item list of
// pieces, a chunk smaller than d written as "÷ d = 0". Each reports only its first three hits, so one bug does not flood the screen.
const ODD = [[/(\d+) ÷ (\d+) = \1 ÷ \2/, 'a division written twice'], [/= (\d+) = \1(?!\d)/, 'N = N'],
  [/(?<!\d)1 (grups|cuques|nenúfars|desenes|trossos|cercles)/, 'plural after 1'], [/(?<!\d)1 grup són/, '"1 grup són"'],
  [/(?<!\d)(?!1\b)\d+ (grup|nenúfar|desena|cercle|tros)(?![a-zéí])/, 'singular after a number above 1'],
  [/sobren [\d −=]*(?<!\d)1(?!\d)/, '"sobren" with 1'], [/en toquen 1(?!\d)/, '"en toquen 1"'], [/sobr[ae]n? 0(?!\d)/, 'en sobra 0'],
  [/trossos[^:]*: \d+\./, 'a list of one piece'], [/÷ \d+ = 0(?!\d)/, '÷ d = 0']];
const oddHits = {};
function odd(txt, tag) {
  for (const [re, why] of ODD) if (re.test(txt)) { oddHits[why] = (oddHits[why] || 0) + 1; if (oddHits[why] <= 3) check(false, `${tag}: ${why} in "${txt}"`); else fails++; }
}
function spoken(q, where, extra = []) {
  const tag = `${where} ${JSON.stringify(q)}`;
  for (const deep of [false, true]) for (const ans of [...wrongs(q), ...extra]) for (const txt of [tipFor(q), explain(q, deep, ans)]) {
    check(typeof txt === 'string' && txt.length > 10 && !BAD.test(txt), `${tag}: says "${txt}"`);
    odd(String(txt), tag);
  }
  const s = said(q);
  check(typeof s === 'string' && s.length > 10 && !BAD.test(s), `${tag}: said "${s}"`);
  odd(String(s), tag);
  const sd = String(s);
  check(sd.includes(`${q.D}`) && sd.includes(`${q.d}`), `${tag}: said does not tell the whole division ("${sd}")`);
  // a long division with no remainder never says that something is left over from the last chunk (the question itself may ask for the remainder)
  if (q.mode === 'long' && q.D % q.d === 0) for (const txt of [explain(q, false), explain(q, true), said(q)])
    check(!/sobr|llevat|d.ell|residu/.test(String(txt).replace(/no en sobra cap|sense residu/g, '')), `${tag}: exact division, but "${txt}" talks of what is left`);   // contract: 126 ÷ 2 has nothing left over
  // the full explanation ends up telling the answer
  const w = want(q), deepTxt = String(explain(q, true));
  if (q.mode !== 'proof') check(deepTxt.includes(String(Array.isArray(w) ? w[0] : w)) || deepTxt.includes(String(Math.floor(q.D / q.d))), `${tag}: the full explanation does not tell the answer ("${deepTxt}")`);
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
// a wrong partial points at its part: 84 ÷ 4 written as 20, 2 and 22 has the part 4 wrong, though the total is the sum of what was written
const s84 = { mode: 'split', D: 84, d: 4, parts: [80, 4] }, l157 = { mode: 'long', D: 157, d: 4, parts: [120, 37] };
check(chunk(s84, 4).test(explain(s84, false, [20, 2, 22])) && !chunk(s84, 80).test(explain(s84, false, [20, 2, 22])), `84 ÷ 4 = [20, 2, 22] must point at the part 4 only: "${explain(s84, false, [20, 2, 22])}"`);   // contract: 4 ÷ 4 = 1, not 2
check(chunk(s84, 80).test(explain(s84, false, [21, 1, 22])) && !chunk(s84, 4).test(explain(s84, false, [21, 1, 22])), `84 ÷ 4 = [21, 1, 22] must point at the part 80 only: "${explain(s84, false, [21, 1, 22])}"`);   // contract: 80 ÷ 4 = 20, not 21
check(chunk(l157, 37).test(explain(l157, false, [30, 8, 39, 1])) && !chunk(l157, 120).test(explain(l157, false, [30, 8, 39, 1])), `157 ÷ 4 = [30, 8, 39, 1] must point at the part 37 only: "${explain(l157, false, [30, 8, 39, 1])}"`);   // contract: 37 ÷ 4 = 9, not 8
check(/suma/.test(explain(s84, false, [20, 1, 22])) && !/Torna a mirar/.test(explain(s84, false, [20, 1, 22])), '84 ÷ 4 = [20, 1, 22]: the parts are right, so the hint is about the sum');   // contract: 20 + 1 = 21, not 22
for (const [q, bits] of [[s84, ['84 = 80 + 4', '80 ÷ 4 = 20', '4 ÷ 4 = 1', '20 + 1 = 21']], [l157, ['157 = 120 + 37', '120 ÷ 4 = 30', '37 ÷ 4 = 9', '30 + 9 = 39']]])   // contract: spec «El mapa» and plan, 84 = 80 + 4; 80 ÷ 4 = 20 i 4 ÷ 4 = 1; 20 + 1 = 21 (157 worked the same way)
  for (const b of bits) check(explain(q, true).includes(b), `${q.mode} ${q.D} ÷ ${q.d}: the full explanation lacks "${b}": "${explain(q, true)}"`);
// the full explanation ends up telling the answer
PROJECTS.forEach(P => P.ex.flat().forEach(q => {
  const w = want(q), deep = explain(q, true), last = Array.isArray(w) ? w[0] : w;
  check(q.mode === 'proof' || deep.includes(String(last)) || deep.includes(String(Math.floor(q.D / q.d))), `${JSON.stringify(q)}: the full explanation does not tell the answer`);
}));

// ---- 4. exams and sheets, made with a seeded LCG so that a failure can be replayed (seed 1000 + circle for exams, 2000 + valid.length for sheets)
const lcg = seed => { let x = seed >>> 0; return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296; };   // always below 1
const key = q => `${q.mode}/${q.D}/${q.d}`;
// a generated question: bare, no parts, no material flags, from project p, inside the limits of that project (worked out above, then inLimits must agree)
function lookQ(q, ps, tag) {
  const t = `${tag} ${JSON.stringify(q)}`;
  check(q.bare === true && !('parts' in q) && !q.hands && !q.hide, `${t}: not bare, or carries parts / material flags`);   // contract: plan, bare: sense material ni parcials
  check(int(q.p) && ps.includes(q.p), `${t}: p is not a project of the set (${ps})`);   // contract: plan, cada pregunta porta p
  if (!int(q.p) || !PROJECTS[q.p]) return;
  const bad = problems(q, q.p, -1);
  check(bad.length === 0, `${t}: out of the limits of project ${q.p} (${bad.join()})`);   // contract: plan, límits per projecte
  check(inLimits(q, q.p) === (bad.length === 0), `${t}: inLimits disagrees`);
}
const noRepeats = (list, tag) => check(new Set(list.map(key)).size === list.length, `${tag}: a question is repeated ${JSON.stringify(list)}`);   // contract: plan, sense repetides
function lookExam(ex, c, tag) {
  const ps = CIRCLES[c].projects;
  check(Array.isArray(ex) && ex.length === 6, `${tag}: ${ex.length} questions, not 6`);   // contract: spec «Exàmens», 6 preguntes
  noRepeats(ex, tag);
  ex.forEach(q => lookQ(q, ps, tag));
  ps.forEach(p => check(ex.some(q => q.p === p), `${tag}: no question of project ${p} ${JSON.stringify(ex)}`));   // contract: plan, almenys una de cada projecte del cercle
}
// the shape of what the frog wrote: as want(q), whole numbers, never negative, a quotient of at least 1
function lookShown(q, s, tag) {
  const w = want(q), t = `${tag} ${JSON.stringify(q)} shown ${JSON.stringify(s)}`;
  check(Array.isArray(s) === Array.isArray(w) && (!Array.isArray(w) || s.length === w.length), `${t}: not the shape of want() ${JSON.stringify(w)}`);   // contract: plan, shown té la forma de want(q)
  const a = Array.isArray(s) ? s : [s];
  check(a.every(x => int(x) && x >= 0) && a[0] >= 1, `${t}: a negative, a fraction or a quotient of 0`);
}
function lookSheet(sh, valid, tag) {
  check(Array.isArray(sh) && sh.length === 3, `${tag}: ${sh.length} items, not 3`);   // contract: spec «Corregir una companya», 3 divisions
  noRepeats(sh.map(i => i.q), tag);
  sh.forEach(it => {
    const t = `${tag} ${JSON.stringify(it)}`;
    check(Object.keys(it).sort().join() === 'ok,q,shown' && typeof it.ok === 'boolean', `${t}: not { q, shown, ok }`);
    lookQ(it.q, valid, tag);
    lookShown(it.q, it.shown, tag);
    // the label must not lie: ok says whether the written answer is right, by right() and by nothing else
    check(it.ok === right(it.q, it.shown), `${t}: ok is ${it.ok} but right() says ${right(it.q, it.shown)}`);   // contract: spec «Corregir una companya», l'etiqueta no pot mentir
  });
  check(sh.filter(i => !i.ok).length <= 2, `${tag}: all three are wrong`);   // contract: plan, 0, 1 o 2 equivocades
}
// what kind of mistake a wrong answer is, worked out here from D and d (never from the generator)
function kind(q, s) {
  const Q = Math.floor(q.D / q.d), R = q.D % q.d, two = Array.isArray(s), [a, b] = two ? s : [s];
  if (q.mode === 'proof') return q.r > 0 && s === q.D - q.r ? 'forgot remainder' : s === q.D + q.d ? 'added d' : 'other';
  if (two && b === 0 && a === Q && R > 0) return 'forgot remainder';
  if (two && a === Q - 1 && b === R + q.d) return 'unreduced';
  if (two && b !== R) return 'other';
  const dq = Math.abs(a - Q);
  return dq === 1 ? 'quotient 1' : dq === 10 && Q > 10 && (q.mode === 'split' || q.mode === 'long') ? 'chunk 10' : 'other';
}
const KINDS = { share: ['quotient 1'], group: ['quotient 1'], fact: ['quotient 1'], tens: ['quotient 1'], proof: ['forgot remainder', 'added d'],
  rem: ['quotient 1', 'unreduced', 'forgot remainder'], split: ['quotient 1', 'chunk 10'], long: ['quotient 1', 'unreduced', 'forgot remainder', 'chunk 10'] };   // contract: plan, errors de les granotes
// judge: right with the right decision, wrong with the other three (a wrong item: says-wrong with the right fix, a wrong fix, says-ok)
function lookJudge(it, tag) {
  const t = `${tag} ${JSON.stringify(it)}`, w = want(it.q), off = Array.isArray(w) ? w.map(v => v + 1) : w + 1;
  if (it.ok) {
    check(judge(it, true, undefined) === true && judge(it, true, off) === true, `${t}: says right about a right item, judged false`);
    check(judge(it, false, w) === false && judge(it, false, off) === false && judge(it, false, undefined) === false, `${t}: says wrong about a right item, judged true`);
  } else {
    check(judge(it, false, w) === true && judge(it, false, String(w)) === true, `${t}: says wrong with the right fix, judged false`);
    check(judge(it, false, off) === false && judge(it, false, it.shown) === false && judge(it, false, undefined) === false && judge(it, false, '') === false, `${t}: says wrong with a wrong fix, judged true`);
    check(judge(it, true, w) === false && judge(it, true, undefined) === false, `${t}: says ok about a wrong item, judged true`);
  }
}
check(EXAM_PASS === 5, `EXAM_PASS is ${EXAM_PASS}`);   // contract: spec «Exàmens», 5 de 6
const SETS = [0, 1, 2, 3, 4, 5, 6, 7].map(n => [...Array(n + 1).keys()]);   // [0], [0, 1], ... [0..7]
const seen = new Set(), GEN = new Map();   // GEN: every generated question, with the answers shown for it
const note = (q, shown) => { const g = GEN.get(JSON.stringify(q)) || { q, shown: [] }; if (shown !== undefined) g.shown.push(shown); GEN.set(JSON.stringify(q), g); };
// exams: 200 per circle, seed 1000 + circle
CIRCLES.forEach((C, c) => {
  const rnd = lcg(1000 + c);
  for (let i = 0; i < 200; i++) { exams++; const ex = exam(c, rnd); lookExam(ex, c, `circle ${c} exam #${i} (seed ${1000 + c})`); ex.forEach(q => note(q)); }
});
// sheets: 200 per set, seed 2000 + valid.length; 0, 1 and 2 wrong all turn up, in every position, and every kind of mistake turns up
SETS.forEach(valid => {
  const rnd = lcg(2000 + valid.length), by = [0, 0, 0, 0], where = [0, 0, 0];
  for (let i = 0; i < 200; i++) {
    fulls++;
    const tag = `valid [${valid}] sheet #${i} (seed ${2000 + valid.length})`, sh = sheet(valid, rnd);
    lookSheet(sh, valid, tag);
    sh.forEach(it => note(it.q, it.shown));
    by[sh.filter(x => !x.ok).length]++;
    sh.forEach((it, k) => {
      lookJudge(it, tag);
      if (it.ok) return;
      where[k]++;
      const kd = kind(it.q, it.shown);
      check((KINDS[it.q.mode] || []).includes(kd), `${tag} ${JSON.stringify(it)}: mistake "${kd}" is not one of ${it.q.mode}'s`);
      seen.add(`${it.q.mode}: ${kd}`);
      if (it.q.mode === 'proof') seen.add(`proof r${it.q.r ? '>0' : '=0'}: ${kd}`);
      if (Array.isArray(it.shown) && it.q.mode === 'rem' && it.q.D % it.q.d === 0) seen.add('rem exact: wrong');
    });
  }
  check(by[0] > 0 && by[1] > 0 && by[2] > 0 && by[3] === 0, `valid [${valid}]: sheets with 0, 1, 2, 3 wrong are ${by}`);   // contract: plan, fulls de les tres menes, mai 3
  check(where.every(n => n > 0), `valid [${valid}]: the wrong item is never at some position (${where})`);
});
for (const [mode, kinds] of Object.entries(KINDS)) kinds.forEach(k => {
  // the project of that mode is in the sets from index p up, so the mistake must have been seen at least once in 1600 sheets
  if (!(mode === 'proof' && k === 'forgot remainder')) check(seen.has(`${mode}: ${k}`), `no sheet ever shows ${mode} wrong by "${k}"`);
});
check(seen.has('proof r>0: forgot remainder') && seen.has('proof r=0: added d') && seen.has('proof r>0: added d'), 'proof: forgot-the-remainder (r > 0) and added-d (r = 0 and r > 0) all seen');   // contract: plan, errors de les granotes
check(!seen.has('proof r=0: forgot remainder'), 'proof with r = 0 cannot be wrong by forgetting the remainder');
// an empty (or nonsense) list of validated projects is [0]
{
  const rnd = lcg(2000);
  for (let i = 0; i < 200; i++) for (const v of [[], undefined, [9, -1, 'a', 2.5]]) lookSheet(sheet(v, rnd), [0], `sheet(${JSON.stringify(v)}) #${i} (seed 2000)`);   // contract: plan, si és buida, [0]
}
// every text, over every question the generators made, with the answers the frogs showed; then over every bare question inside the limits
GEN.forEach(({ q, shown }) => spoken(q, 'generated', shown));
let every = 0;
PROJECTS.forEach((P, p) => { for (let d = 2; d <= 10; d++) for (let D = d + 1; D <= 999; D++) {
  const q = { mode: P.mode, D, d, ...(p === 4 && { q: Math.floor(D / d), r: D % d }), bare: true, p };
  if (problems(q, p, -1).length === 0) { every++; spoken(q, 'bare question'); }
} });
check(every > 5000 && GEN.size > 500, `texts checked on ${every} bare questions and ${GEN.size} generated ones`);
// the same seed makes the same exam and the same sheet, and a random source that never changes cannot make anything repeat or hang
check(JSON.stringify(exam(1, lcg(7))) === JSON.stringify(exam(1, lcg(7))) && JSON.stringify(sheet([0, 1, 2], lcg(7))) === JSON.stringify(sheet([0, 1, 2], lcg(7))), 'the same seed does not make the same exam and sheet');
for (const [name, fixed] of [['0', () => 0], ['0.5', () => 0.5], ['0.9999999999', () => 0.9999999999]]) {
  CIRCLES.forEach((C, c) => lookExam(exam(c, fixed), c, `exam with rnd always ${name}`));
  SETS.forEach(valid => lookSheet(sheet(valid, fixed), valid, `sheet [${valid}] with rnd always ${name}`));
}
// exams and sheets still work with no rnd given
CIRCLES.forEach((C, c) => lookExam(exam(c), c, 'exam with Math.random'));
lookSheet(sheet([0, 1, 2]), [0, 1, 2], 'sheet with Math.random');
// the judge, by hand: 17 ÷ 5, the frog wrote 2 and 7
const f17 = { q: { mode: 'rem', D: 17, d: 5, bare: true }, shown: [2, 7], ok: false };
check(judge(f17, false, [3, 2]) === true && judge(f17, false, [2, 7]) === false && judge(f17, true, [3, 2]) === false, 'judge on 17 ÷ 5 written 2 and 7');   // contract: spec «El mapa», 17 ÷ 5 = 3 i en sobren 2

// ---- 5. progress: marks, clean, XP, level, the map, the badges and the teams
check(VALID === 80, `VALID is ${VALID}`);   // contract: spec «Projecte validat», de 80 a 100
check([0, 11, 12, 15].map(mark).join() === '0,73,80,100', `mark of 0, 11, 12, 15 firsts is ${[0, 11, 12, 15].map(mark)}`);   // contract: plan, tasca 4; 11 / 15 = 73,3 %
check(mark(14) === 93 && mark(1) === 7, `mark(14) is ${mark(14)}, mark(1) is ${mark(1)}`);   // contract: 14 / 15 = 93,3 %, 1 / 15 = 6,7 %
// the shape clean must always return, whatever it is given
const wellFormed = p => p && typeof p === 'object' && Object.keys(p).sort().join() === 'equip,exams,fulls,notes,piscina,so'
  && typeof p.so === 'boolean' && typeof p.piscina === 'boolean' && int(p.equip) && p.equip >= -1 && p.equip <= 2
  && Array.isArray(p.notes) && p.notes.length === 8 && p.notes.every(n => int(n) && n >= 0 && n <= 100 && !Object.is(n, -0))
  && Array.isArray(p.exams) && p.exams.length === 3 && p.exams.every(e => typeof e === 'boolean')
  && int(p.fulls) && p.fulls >= 0 && !Object.is(p.fulls, -0);   // contract: plan, forma { so, piscina, equip, notes, exams, fulls }
const JUNK = [null, undefined, 'x', '', 0, 7, NaN, Infinity, true, false, [], [1, 2, 3], {}, () => 1,
  { notes: 'a' }, { notes: [500, -3, 79.6] }, { fulls: -2, equip: 9 }, { fulls: 3.7 }, { fulls: Infinity }, { fulls: NaN }, { fulls: '5' }, { fulls: -0.5 },
  { equip: '1' }, { equip: 1.5 }, { equip: -2 }, { equip: -0 }, { equip: null }, { exams: 'yes' }, { exams: 1 }, { exams: [true] }, { exams: { 0: true, length: 3 } },
  { notes: [1, 2, 3] }, { notes: Array(20).fill(90) }, { notes: [NaN, Infinity, -Infinity, '90', null, undefined, {}, [100]] }, { notes: { 0: 100, length: 8 } },
  { notes: [-0.5, 0.5, 99.99, 100.5, 1e300, -1e300, 80, 79] }, { so: 0, piscina: 1 }, { so: null, piscina: 'true' }, { piscina: [] }, { piscina: {} },
  { notes: [100, 100, 100, 100, 100, 100, 100, 100], exams: [true, true, true], fulls: 24, piscina: true, equip: 2, so: false, xp: 5000, insignies: [1] }];
JUNK.forEach(j => {
  let c;
  try { c = clean(j); } catch (e) { check(false, `clean(${String(j)}) throws ${e}`); return; }
  check(wellFormed(c), `clean(${JSON.stringify(j)}) is ${JSON.stringify(c)}`);
  check(JSON.stringify(clean(c)) === JSON.stringify(c), `clean(${JSON.stringify(j)}) is not stable when cleaned again`);   // contract: plan, forma completa dins de límits
  try { const xp = xpOf(c), sh = badges(c); check(int(xp) && xp >= 0 && xp <= 1240 && /^\d,\d\d$/.test(levelText(xp)) && sh.length === 5 && validated(c).every(i => c.notes[i] >= 80),
      `the rules give nonsense on clean(${JSON.stringify(j)})`); } catch (e) { check(false, `the rules throw on clean(${JSON.stringify(j)}): ${e}`); }
});
// what clean decides, field by field
const same = (a, b, msg) => check(JSON.stringify(a) === JSON.stringify(b), `${msg}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`);
same(clean({}), { so: true, piscina: false, equip: -1, notes: [0, 0, 0, 0, 0, 0, 0, 0], exams: [false, false, false], fulls: 0 }, 'clean({})');   // contract: plan, progrés buit
same(clean({ notes: [500, -3, 79.6] }).notes, [100, 0, 79, 0, 0, 0, 0, 0], 'notes [500, -3, 79.6]');   // contract: plan, 500 → 100, −3 → 0, 79,6 → 79 (truncated, never rounded up to 80)
same(clean({ notes: [79.99, 80.4] }).notes.slice(0, 2), [79, 80], 'notes 79.99 and 80.4');   // contract: 79,99 truncated is 79, so it does not validate
same(clean({ notes: [NaN, Infinity, '90', null, {}, [100]] }).notes.slice(0, 6), [0, 0, 0, 0, 0, 0], 'notes that are not finite numbers');   // contract: plan, no-números → 0
check(clean({ notes: Array(20).fill(90) }).notes.length === 8 && clean({ notes: [1, 2, 3] }).notes.length === 8, 'notes are always 8');   // contract: plan, 8 enters
same(clean({ fulls: -2, equip: 9 }), { ...clean({}), fulls: 0, equip: -1 }, '{ fulls: -2, equip: 9 }');   // contract: plan, equip fora de −1..2 → −1; fulls negatiu → 0
check(clean({ fulls: 3.7 }).fulls === 3 && clean({ fulls: Infinity }).fulls === 0 && clean({ fulls: NaN }).fulls === 0 && clean({ fulls: '5' }).fulls === 0 && clean({ fulls: 24 }).fulls === 24, 'fulls: truncated, never Infinity');   // contract: plan, fulls enter ≥ 0
check([-1, 0, 1, 2].every(e => clean({ equip: e }).equip === e) && [3, 9, -2, 1.5, '1', null, NaN].every(e => clean({ equip: e }).equip === -1) && Object.is(clean({ equip: -0 }).equip, 0), 'equip: -1 to 2 as it is, the rest is -1');   // contract: plan, equip −1 a 2
check(clean({ so: false }).so === false && [true, 0, null, 'false', undefined].every(v => clean({ so: v }).so === true), 'so is true unless exactly false');   // contract: plan, so cert llevat que sigui false
check(clean({ piscina: true }).piscina === true && [1, 'true', [], {}, null].every(v => clean({ piscina: v }).piscina === false), 'piscina is true only if exactly true');   // contract: plan, piscina booleà
same(clean({ exams: [true, 1, 'true', true, true] }).exams, [true, false, false], 'exams: true only if exactly true, three of them');   // contract: plan, exams 3 booleans
same(clean({ exams: 'yes' }).exams, [false, false, false], 'exams: a text');
// xp and level are never kept, whatever the saved data says
check(!('xp' in clean({ xp: 99 })) && !('insignies' in clean({ insignies: [1] })), 'clean does not keep xp or insignies');   // contract: plan, XP i insígnies no es desen
// no reference into the input, and a second clean is a new object
{
  const src = { notes: [90, 80, 70, 60, 50, 40, 30, 20], exams: [true, false, true] }, c = clean(src);
  c.notes[0] = 0; c.exams[0] = false;
  check(src.notes[0] === 90 && src.exams[0] === true && c.notes !== src.notes && c.exams !== src.exams, 'clean returns a reference into its input');   // contract: plan, mai una referència a l'entrada
  const c2 = clean(c); c2.notes[1] = 1;
  check(c.notes[1] === 80, 'clean(c) shares notes with c');
}
// the rules on the empty progress: nothing, and no throw
{
  const e = clean({});
  check(xpOf(e) === 0 && levelText(xpOf(e)) === '0,00', `empty progress: ${xpOf(e)} XP, level ${levelText(xpOf(e))}`);   // contract: spec «XP, nivell», de 0,00
  check([0, 1, 2].every(c => !isOpen(e, c) && !examOpen(e, c)), 'empty progress: a circle is open');   // contract: plan, progrés buit: cap cercle obert
  check(badges(e).length === 5 && badges(e).every(b => b === false), `empty progress: badges ${badges(e)}`);   // contract: plan, cap insígnia
  check(validated(e).length === 0, 'empty progress: a project is validated');
}
// the full progress: the maximum
{
  const f = clean({ piscina: true, notes: Array(8).fill(100), exams: [true, true, true], fulls: 24 });
  check(xpOf(f) === 1240 && levelText(xpOf(f)) === '8,27', `full progress: ${xpOf(f)} XP, level ${levelText(xpOf(f))}`);   // contract: spec «XP, nivell», 50 + 800 + 150 + 240 = 1.240, 1.240 ÷ 150 = 8,27
  check([0, 1, 2].every(c => isOpen(f, c) && examOpen(f, c)), 'full progress: a circle is shut');   // contract: plan, progrés ple: tot obert
  check(badges(f).length === 5 && badges(f).every(b => b === true), `full progress: badges ${badges(f)}`);   // contract: plan, 5 insígnies
  check(validated(f).join() === '0,1,2,3,4,5,6,7', 'full progress: all eight validated');
  check(xpOf({ ...f, fulls: 500 }) === 1240 && xpOf({ ...f, fulls: 24 }) === 1240, 'more fulls than the cap give more XP');   // contract: spec «XP, nivell», fins a 3 fulls per projecte validat
}
// the levels
check(levelText(0) === '0,00' && levelText(150) === '1,00' && levelText(75) === '0,50' && levelText(1) === '0,01' && levelText(1240) === '8,27' && levelText(100) === '0,67', 'levelText');   // contract: XP ÷ 150, dos decimals, coma; 1 ÷ 150 = 0,0067 → 0,01; 100 ÷ 150 = 0,667 → 0,67
// validation: 80 is the line; a 79 gives nothing
check(validated(clean({ notes: [80, 79, 100, 0, 79, 99, 50, 80] })).join() === '0,2,5,7', 'validated: 80 and up');   // contract: spec «Projecte validat», de 80 a 100
check(xpOf(clean({ notes: Array(8).fill(79), fulls: 100, piscina: false })) === 0, 'notes of 79 give XP');   // contract: plan, notes de 79 no validen ni donen XP
check(validated(clean({ notes: Array(8).fill(79) })).length === 0 && validated(clean({ notes: [79.6] })).length === 0, 'a 79 validates');
check(xpOf(clean({ fulls: 100 })) === 0, '100 fulls with no project validated give XP');   // contract: plan, 100 fulls sense cap projecte validat donen 0 XP
check(xpOf(clean({ fulls: 100, piscina: true })) === 50, 'fulls give XP with no project validated');   // contract: 50 de la Piscina, els fulls cap
check(xpOf(clean({ notes: [80], fulls: 50 })) === 110, 'one project validated caps fulls at 3');   // contract: 80 + 10 × min(50, 3) = 110
check(xpOf(clean({ notes: [80, 95], fulls: 4 })) === 215, 'two projects, four fulls');   // contract: 80 + 95 + 10 × min(4, 6) = 215
check(xpOf(clean({ notes: [0, 0, 100], fulls: 1 })) === 110, 'the project index does not matter');   // contract: 100 + 10 × min(1, 3) = 110
check(xpOf(clean({ exams: [true, false, true] })) === 100, 'an exam is worth 50');   // contract: spec «XP, nivell», examen superat 50
check(xpOf(clean({ piscina: true })) === 50, 'the Piscina is worth 50');   // contract: spec «XP, nivell», acabar la Piscina 50
// badges, one at a time, in the order of the spec
const B = p => badges(clean(p)).map(Number).join('');
check(BADGES.length === 5 && BADGES.every(b => typeof b.name === 'string' && b.name.length > 3 && typeof b.what === 'string' && b.what.length > 10 && !BAD.test(b.name + b.what)), 'BADGES: five with a name and what');   // contract: plan, 5 { name, what }
check(new Set(BADGES.map(b => b.name)).size === 5, 'BADGES: names repeat');
check(B({}) === '00000' && B({ piscina: true }) === '10000', 'badge 1: the Piscina');   // contract: spec «Assoliments», 1r acabar la Piscina
check(B({ fulls: 1 }) === '01000' && B({ fulls: 0 }) === '00000', 'badge 2: the first sheet');   // contract: spec «Assoliments», 2n primer full ben corregit
check(B({ notes: [100] }) === '00100' && B({ notes: [99, 80, 0, 0, 0, 0, 0, 0] }) === '00000' && B({ notes: [0, 0, 0, 0, 0, 0, 0, 100] }) === '00100', 'badge 3: a project with 100');   // contract: spec «Assoliments», 3r un projecte amb nota 100
check(B({ fulls: 10 }) === '01010' && B({ fulls: 9 }) === '01000', 'badge 4: ten sheets, counted raw');   // contract: spec «Assoliments», 4t deu fulls; el compte brut, sense el límit de XP
check(B({ exams: [true, true, true] }) === '00001' && B({ exams: [true, true, false] }) === '00000' && B({ exams: [false, true, true] }) === '00000', 'badge 5: the three exams');   // contract: spec «Assoliments», 5è cursus complet
check(xpOf(clean({ fulls: 10 })) === 0 && badges(clean({ fulls: 10 }))[3] === true, 'ten sheets with no project: badge yes, XP no');   // contract: el comptador dels fulls no té límit; el XP sí
// the teams
check(TEAMS.map(t => t.name).join('|') === 'Libèl·lules|Tritons|Cuques', `team names: ${TEAMS.map(t => t.name)}`);   // contract: plan, tasca 4, TEAMS
check(TEAMS.every(t => Number.isFinite(t.hue) && t.hue >= 0 && t.hue < 360), 'team hues are degrees');
{
  const gap = (a, b) => { const x = Math.abs(a - b) % 360; return Math.min(x, 360 - x); };
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) check(gap(TEAMS[i].hue, TEAMS[j].hue) >= 60, `teams ${i} and ${j} are too close in colour`);   // contract: plan, tres colors clarament diferents
}
// the journey: empty, the Piscina, each project of a circle one by one, its exam, and on; isOpen, examOpen, XP and badges at every step
{
  const E = [false, false, false], F = [false, false, false];
  let p = clean({}), xp = 0, n = 0;
  const at = (label, open, ex, bd) => {
    const t = `journey, ${label}`;
    check([0, 1, 2].map(c => isOpen(p, c)).join() === open.join(), `${t}: isOpen is ${[0, 1, 2].map(c => isOpen(p, c))}, expected ${open}`);
    check([0, 1, 2].map(c => examOpen(p, c)).join() === ex.join(), `${t}: examOpen is ${[0, 1, 2].map(c => examOpen(p, c))}, expected ${ex}`);
    check(xpOf(p) === xp, `${t}: XP is ${xpOf(p)}, expected ${xp}`);
    check(badges(p).map(Number).join('') === bd, `${t}: badges ${badges(p).map(Number).join('')}, expected ${bd}`);
    n++;
  };
  at('empty', E, F, '00000');
  // validated notes with no Piscina: the circle is shut, so is its exam
  p = clean({ notes: [100, 100] }); xp = 200;
  at('notes of circle 0, no Piscina', E, F, '00100'); xp = 0;
  p = clean({}); p.piscina = true; xp = 50;
  at('Piscina', [true, false, false], F, '10000');
  p.notes[0] = 79;
  at('project 0 at 79 does not count', [true, false, false], F, '10000');
  p.notes[0] = 100; xp += 100;
  at('project 0 validated', [true, false, false], F, '10100');
  p.notes[1] = 80; xp += 80;
  at('project 1 validated: exam 0 opens', [true, false, false], [true, false, false], '10100');
  p.exams[0] = true; xp += 50;
  at('exam 0 passed: circle 1 opens', [true, true, false], [true, false, false], '10100');
  [2, 3].forEach(i => { p.notes[i] = 80; xp += 80; at(`project ${i} validated`, [true, true, false], [true, false, false], '10100'); });
  p.notes[4] = 80; xp += 80;
  at('project 4 validated: exam 1 opens', [true, true, false], [true, true, false], '10100');
  p.exams[1] = true; xp += 50;
  at('exam 1 passed: circle 2 opens', [true, true, true], [true, true, false], '10100');
  [5, 6].forEach(i => { p.notes[i] = 80; xp += 80; at(`project ${i} validated`, [true, true, true], [true, true, false], '10100'); });
  p.notes[7] = 80; xp += 80;
  at('project 7 validated: exam 2 opens', [true, true, true], [true, true, true], '10100');
  p.exams[2] = true; xp += 50;
  at('exam 2 passed: cursus complete', [true, true, true], [true, true, true], '10101');
  p.fulls = 1; xp += 10;
  at('first sheet', [true, true, true], [true, true, true], '11101');
  p.fulls = 24; xp += 230;
  at('24 sheets', [true, true, true], [true, true, true], '11111');
  check(xp === 1100, `the journey ends on ${xp} XP`);   // contract: spec «XP, nivell»; 50 + (100 + 7 × 80) + 150 + 240 = 1.100, one note of 100 and seven of 80
  check(n === 17, `the journey has ${n} steps`);   // contract: the steps written above, counted by hand
  // a circle that does not exist is shut, and nothing throws
  const full = clean({ piscina: true, notes: Array(8).fill(100), exams: [true, true, true] });
  check([3, -1, 0.5, NaN, undefined, null, 'x', '0', 'length', [0], {}].every(c => isOpen(full, c) === false && examOpen(full, c) === false), 'a circle that does not exist is open');   // contract: plan, tres cercles, 0 a 2
}

// ---- footer
if (fails) { console.error(`${fails} failures`); process.exit(1); }
console.log(`cursus-de-l-estany: ${counted} preguntes, ${exams} exàmens, ${fulls} fulls`);
