// Checks the questions of l'àbac before every build: the 9 projects of 3 exercises of 5, the three circles, the pool of the Piscina and the rule of each project
// (worked out again here with arithmetic of its own: plan only tells what the abacus is asked to show, never what the answer is).
// Run: node scripts/check-abac.mjs [path of a logic module to check instead of games/abac-xines/logic.js]   (the path is for trying the checker itself)
// One function per part, each reporting alone: a part whose data is missing says so and the next one still runs. A later task adds partB, partC above the footer.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

let fails = 0, counted = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const int = x => Number.isInteger(x);
const MAX = 99999;   // contract: spec «Global Constraints», five columns at most
const COLS = 5;      // contract: the same

// ---- the arithmetic of the checker
// a question 'a+b-c' as numbers and operators; null when it is not one
const parse = q => {
  if (typeof q !== 'string' || !/^\d+([+\-x:]\d+)*$/.test(q)) return null;
  return { nums: q.split(/[+\-x:]/).map(Number), ops: q.match(/[+\-x:]/g) || [] };
};
// left to right, with 'x' and ':' before '+' and '-'. vals holds every number met on the way; problems says what is wrong with the way
function evaluate(q) {
  const t = parse(q), vals = [], problems = [];
  if (!t) return { vals, problems: ['not a question'], res: NaN };
  const nums = [...t.nums], ops = [...t.ops];
  vals.push(...nums);
  const apply = (a, o, b) => {
    if (o === '+') return a + b;
    if (o === '-') return a - b;
    if (o === 'x') return a * b;
    if (b === 0 || a % b) { problems.push(`${a}:${b} is not exact`); return NaN; }
    return a / b;
  };
  // pass 1: x and :
  for (let i = 0; i < ops.length;) {
    if ('x:'.includes(ops[i])) { const v = apply(nums[i], ops[i], nums[i + 1]); nums.splice(i, 2, v); ops.splice(i, 1); vals.push(v); } else i++;
  }
  // pass 2: + and -
  while (ops.length) { const v = apply(nums[0], ops[0], nums[1]); nums.splice(0, 2, v); ops.shift(); vals.push(v); }
  if (vals.some(v => v < 0)) problems.push('a negative value on the way');
  if (vals.some(v => v > MAX)) problems.push(`a value over ${MAX}`);
  return { vals, problems, res: nums[0] };
}
// the digit of n at column p (0 is the units)
const dig = (n, p) => Math.floor(n / 10 ** p) % 10;
const width = (...n) => Math.max(...n.map(x => String(x).length));
// the sum of a+b without a trick: the rule of project 2, in each column
const plain = (a, b) => {
  for (let p = 0; p < width(a, b); p++) {
    const da = dig(a, p), db = dig(b, p);
    if (db < 5 ? da % 5 + db > 4 : !(da < 5 && da % 5 + (db - 5) <= 4)) return false;
  }
  return true;
};
// the sum of each column of a+b, counting what is carried from the right
const colSums = (a, b) => {
  const out = []; let c = 0;
  for (let p = 0; p < width(a, b); p++) { const s = dig(a, p) + dig(b, p) + c; out.push(s); c = s >= 10 ? 1 : 0; }
  return out;
};
// does a-b take one from a column on the left, in some column?
const borrows = (a, b) => {
  let bor = 0, any = false;
  for (let p = 0; p < width(a, b); p++) { if (dig(a, p) - bor < dig(b, p)) { bor = 1; any = true; } else bor = 0; }
  return any;
};

// ---- what the data says it holds
const key = q => q.read !== undefined ? `llegir ${q.read}` : q.q;
// contract: spec «Com es comprova» and plan, Task 1: the 60 questions of today, in the project each one fits. 142+36 and 253+324 are not in project 2 (the tens 4+3
// do not fit without a trick, and no column sums 10): they go in project 3, whose rule they meet.
const TODAY = [
  ['3', '5', '7', 'llegir 8'],
  ['20', '36', 'llegir 74', '58', '407', 'llegir 692'],
  ['2+2', '2+6', '21+7', '32+15'],
  ['4+1', '3+4', '13+4', '24+31', '142+36', '253+324'],
  ['5+5', '8+2', '7+8', '9+9', '28+14', '36+47', '65+38', '157+68', '486+237', '999+1'],
  ['4-2', '9-5', '48-16', '7-4', '56-23', '10-3', '32-5', '54-28', '100-1', '423-167'],
  ['2x3', '3x4', '4x5', '6x2', '3x7', '5x8', '12x3', '23x4', '45x6', '124x3'],
  ['12:3', '35:5', '48:6', '84:4'],
  ['25+17-8', '60-25+9', '1250+375', '2000-750', '7x8-6', '125x4+500']
];

// the rule of each project for a question q written as text (reads have none besides their range), where e is the exercise of the question
// each returns the problems it finds
const RULES = [
  // 0 Les boles
  q => { const t = parse(q); return t && !t.ops.length && t.nums[0] >= 1 && t.nums[0] <= 9 ? [] : ['a number from 1 to 9']; },   // contract: plan Task 1, project 0
  // 1 Les columnes
  q => { const t = parse(q); return t && !t.ops.length && t.nums[0] >= 10 && t.nums[0] <= 999 ? [] : ['a number from 10 to 999']; },   // contract: plan Task 1, project 1
  // 2 Sumes
  q => { const t = parse(q); return t && t.ops.join('') === '+' && plain(...t.nums) ? [] : ['a+b where every column adds without a trick']; },   // contract: spec «El mapa» Sumes: sumar sense cap canvi
  // 3 El canvi de 5
  q => {
    const t = parse(q); if (!t || t.ops.join('') !== '+') return ['a+b'];
    const out = [];
    if (colSums(...t.nums).some(s => s >= 10)) out.push('a column adds 10 or more');
    if (plain(...t.nums)) out.push('no column needs the trick of 5');
    return out;
  },   // contract: spec «El mapa» El canvi de 5: passar pel 5, cap canvi de deu
  // 4 Me'n porto una
  q => { const t = parse(q); return t && t.ops.join('') === '+' && colSums(...t.nums).some(s => s >= 10) ? [] : ['a+b with a column that adds 10 or more']; },   // contract: spec «El mapa» Me'n porto una
  // 5 Restes
  q => { const t = parse(q); return t && t.ops.join('') === '-' && t.nums[0] - t.nums[1] >= 0 ? [] : ['a-b with a result of 0 or more']; },   // contract: spec «El mapa» Restes
  // 6 Multiplica
  q => { const t = parse(q); return t && t.ops.join('') === 'x' && t.nums[0] * t.nums[1] <= 999 ? [] : ['axb with a result up to 999']; },   // contract: plan Task 1, project 6
  // 7 Reparteix
  q => { const t = parse(q); return t && t.ops.join('') === ':' && t.nums[1] >= 2 && t.nums[1] <= 9 && t.nums[0] % t.nums[1] === 0 ? [] : ['a:b exact, with b from 2 to 9']; },   // contract: plan Task 1, project 7
  // 8 Barreja
  q => { const t = parse(q); return t && (t.ops.length >= 2 || t.nums.some(n => n >= 1000)) ? [] : ['two operators or more, or a number of four digits']; }   // contract: plan Task 1, project 8
];

// Follows nextMove from the number written, to each stage and to the goal. Returns the number of touches, or a text with what went wrong.
function walk(m, q, p) {
  let rods = m.write(p.start, COLS), moves = 0;
  for (const target of [...p.stages, p.goal]) {
    for (;;) {
      if (m.valueOf(rods) === target && m.tidy(rods) && !m.nextMove(rods, target)) break;
      const mv = m.nextMove(rods, target);
      if (!mv) return `nextMove stops on ${m.valueOf(rods)} on the way to ${target}`;
      if (!rods[mv.p] || (mv.deck !== 'lo' && mv.deck !== 'hi') || !int(mv.to) || mv.to < 0) return `a move that is not a move: ${JSON.stringify(mv)}`;
      rods = rods.map((r, i) => i === mv.p ? { ...r, [mv.deck]: mv.to } : r);
      if (++moves >= 200) return `200 touches and the abacus does not show ${target}`;   // contract: plan Task 1, fewer than 200 touches
    }
  }
  return m.valueOf(rods) === p.goal && m.tidy(rods) ? moves : `ends on ${m.valueOf(rods)}, not tidy or not ${p.goal}`;
}

// ---- A. the questions
function partA(m) {
  const { PROJECTS, CIRCLES, POOL } = m;
  const missing = ['PROJECTS', 'CIRCLES', 'POOL'].filter(n => m[n] === undefined);
  if (missing.length) { check(false, `A: logic.js does not export ${missing.join(', ')}`); }
  // the shape of the data
  if (CIRCLES !== undefined) {
    check(Array.isArray(CIRCLES) && CIRCLES.length === 3, 'A: three circles');   // contract: spec «El mapa»
    check(Array.isArray(CIRCLES) && CIRCLES.map(c => (c.projects || []).join()).join('|') === '0,1|2,3,4,5|6,7,8', 'A: circles hold projects 0-1, 2-5, 6-8');   // contract: spec «El mapa» table
    check(Array.isArray(CIRCLES) && CIRCLES.every(c => typeof c.name === 'string' && c.name.length > 3), 'A: every circle has a name');
  }
  if (POOL !== undefined) check(Array.isArray(POOL) && POOL.join() === '3,5,7' && POOL.every(x => typeof x === 'string'), `A: the pool of the Piscina is ['3', '5', '7'], not ${JSON.stringify(POOL)}`);   // contract: spec «La Piscina»
  if (PROJECTS === undefined) return;
  check(Array.isArray(PROJECTS) && PROJECTS.length === 9, 'A: nine projects');   // contract: spec «El mapa»
  if (!Array.isArray(PROJECTS)) return;
  const circleOf = [0, 0, 1, 1, 1, 1, 2, 2, 2];   // contract: spec «El mapa» table
  PROJECTS.forEach((P, p) => {
    const name = `${p} ${P && P.name}`;
    if (!P) { check(false, `A: project ${p} is missing`); return; }
    check(typeof P.name === 'string' && P.name.length > 2, `A: project ${p} has a name`);
    check(typeof P.sub === 'string' && P.sub.length > 10, `A: ${name} has a subtitle`);
    check(P.circle === circleOf[p] && (!CIRCLES || (CIRCLES[P.circle] && CIRCLES[P.circle].projects.includes(p))), `A: ${name}: circle ${P.circle} is not the one of the table`);
    check(Array.isArray(P.ex) && P.ex.length === 3 && P.ex.every(E => Array.isArray(E) && E.length === 5), `A: ${name}: three exercises of five questions`);   // contract: spec «Un projecte»
    if (!Array.isArray(P.ex)) return;
    const seen = new Set(), reads = [];
    let borrowing = 0, ex00borrow = 0, ex00 = 0;
    P.ex.forEach((E, e) => (E || []).forEach(Q => {
      counted++;
      const tag = `${name} ex0${e} ${JSON.stringify(Q)}`;
      const isRead = Q && Q.read !== undefined;
      check(Q && (isRead ? Q.q === undefined : typeof Q.q === 'string'), `A: ${tag}: a question has q or read`);
      if (!Q || (!isRead && typeof Q.q !== 'string')) return;
      check(!seen.has(key(Q)), `A: ${name}: ${key(Q)} is twice in the project`);
      seen.add(key(Q));
      if (isRead) {
        reads.push(Q);
        check(p <= 1, `A: ${tag}: only projects 0 and 1 read`);   // contract: plan Task 1
        check(int(Q.read), `A: ${tag}: read is a whole number`);
        check(Array.isArray(Q.opts) && Q.opts.length === 4 && new Set(Q.opts).size === 4 && Q.opts.includes(Q.read) && Q.opts.every(int), `A: ${tag}: four different options with the right one in`);   // contract: spec «Un projecte»
        const bad = RULES[p] ? RULES[p](String(Q.read)) : [];
        check(!bad.length, `A: ${tag}: ${bad.join()}`);
        return;
      }
      const v = evaluate(Q.q), pl = m.plan(Q.q), bad = RULES[p] ? RULES[p](Q.q) : [];
      check(!bad.length, `A: ${tag}: ${bad.join()}`);
      check(!v.problems.length, `A: ${tag}: ${v.problems.join()}`);
      check(v.res === pl.goal, `A: ${tag}: the result is ${v.res}, plan says ${pl.goal}`);
      check([pl.start, ...pl.stages, pl.goal].every(x => int(x) && x >= 0 && x <= MAX), `A: ${tag}: plan has a value out of 0..${MAX}`);
      const w = walk(m, Q.q, pl);
      check(typeof w === 'number', `A: ${tag}: ${w}`);
      const t = parse(Q.q);
      if (p === 5 && t) {
        const b = borrows(...t.nums);
        if (b) borrowing++;
        if (e === 0) { ex00++; if (b) ex00borrow++; }
      }
    }));
    if (p <= 1) check(reads.length >= 3, `A: ${name}: at least 3 questions to read, there are ${reads.length}`);   // contract: plan Task 1
    if (p === 5) {
      check(ex00borrow === 0, `A: ${name}: no question of ex00 may ask to borrow, ${ex00borrow} do`);   // contract: plan Task 1, project 5
      const ex02 = (P.ex[2] || []).map(Q => parse(Q && Q.q)).filter(Boolean).filter(t => borrows(...t.nums)).length;
      check(ex02 >= 3, `A: ${name}: at least 3 questions of ex02 borrow, ${ex02} do`);   // contract: plan Task 1, project 5
    }
    // the questions of today are all in the project that fits them
    TODAY[p].forEach(k => check(seen.has(k), `A: ${name}: the question of today ${k} is missing`));
  });
  // every question of today is in one project only
  const all = PROJECTS.flatMap(P => P && Array.isArray(P.ex) ? P.ex.flat().filter(Boolean).map(key) : []);
  check(TODAY.flat().length === 60 && new Set(TODAY.flat()).size === 60, 'A: the table of today holds 60 different questions');   // contract: spec «El recorregut», les 60 d'avui
  TODAY.flat().forEach(k => check(all.filter(x => x === k).length <= 1, `A: ${k} is in more than one project`));
}

// ---- the logic under check
const target = process.argv[2] ? pathToFileURL(resolve(process.argv[2])) : new URL('../games/abac-xines/logic.js', import.meta.url);
let mod = null;
try { mod = await import(target); } catch (e) { check(false, `the logic cannot be loaded: ${e.message}`); }
if (mod) for (const part of [partA]) {
  try { part(mod); } catch (e) { check(false, `${part.name} stopped on ${e.message}`); }
}

// ---- footer
if (fails) { console.error(`${fails} failures`); process.exit(1); }
console.log(`abac-xines: ${counted} preguntes`);
