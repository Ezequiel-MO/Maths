// Checks the questions of l'àbac before every build: the 9 projects of 3 exercises of 5, the three circles, the pool of the Piscina and the rule of each project
// (worked out again here with arithmetic of its own: plan only tells what the abacus is asked to show, never what the answer is).
// Run: node scripts/check-abac.mjs [path of a logic module to check instead of games/abac-xines/logic.js] [path of a board.js to check instead of games/abac-xines/board.js]   (the paths are for trying the checker itself)
// One function per part, each reporting alone: a part whose data is missing says so and the next one still runs. Later tasks add the next parts above the footer.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { inspect, isDeepStrictEqual } from 'node:util';

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
function walk(m, p) {
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
    // contract: spec «El recorregut» table, column «Cercle», the words after the number
    check(Array.isArray(CIRCLES) && isDeepStrictEqual(CIRCLES.map(c => c.name), ['Llegir i escriure', 'Sumar i restar', 'Multiplicar i repartir']), `A: the names of the circles are ${show(Array.isArray(CIRCLES) ? CIRCLES.map(c => c.name) : CIRCLES)}, not the ones of the spec table`);
  }
  if (POOL !== undefined) check(Array.isArray(POOL) && POOL.join() === '3,5,7' && POOL.every(x => typeof x === 'string'), `A: the pool of the Piscina is ['3', '5', '7'], not ${JSON.stringify(POOL)}`);   // contract: spec «La Piscina»
  if (PROJECTS === undefined) return;
  check(Array.isArray(PROJECTS) && PROJECTS.length === 9, 'A: nine projects');   // contract: spec «El mapa»
  if (!Array.isArray(PROJECTS)) return;
  const circleOf = [0, 0, 1, 1, 1, 1, 2, 2, 2];   // contract: spec «El mapa» table
  // contract: spec «El recorregut» table, columns «Projecte» and «Què es descobreix», copied letter by letter (the minus is the sign U+2212)
  const NAMES_SUBS = [
    ['Les boles', "Una columna: de l'1 al 9, amb la bola de dalt"], ['Les columnes', 'Desenes i centenes; llegir i escriure fins a 999'],
    ['Sumes', 'Sumar sense cap canvi'], ['El canvi de 5', 'Sumar passant pel 5: +4 = +5 −1'], ["Me'n porto una", 'Sumar passant pel 10: +8 = +10 −2'],
    ['Restes', "Restar, i demanar prestat a l'esquerra"], ['Multiplica', 'Multiplicar com a sumes repetides'], ['Reparteix', 'Dividir com a restes repetides'],
    ['Barreja', 'Operacions encadenades']
  ];
  NAMES_SUBS.forEach(([n, sub], p) => check(PROJECTS[p] && PROJECTS[p].name === n && PROJECTS[p].sub === sub, `A: project ${p} reads ${show(PROJECTS[p] && [PROJECTS[p].name, PROJECTS[p].sub])}, the spec table says ${show([n, sub])}`));
  // contract: spec «Com es comprova» (les 60 d'avui) and the old LEVELS: the option lists of the three questions to read that exist today are kept as they are
  const TODAY_OPTS = { 8: [3, 8, 4, 9], 74: [47, 24, 74, 79], 692: [642, 296, 962, 692] };
  const allReads = PROJECTS.flatMap(P => P && Array.isArray(P.ex) ? P.ex.flat().filter(Q => Q && Q.read !== undefined) : []);
  Object.entries(TODAY_OPTS).forEach(([r, opts]) => { const Q = allReads.find(x => x.read === +r); check(Q && isDeepStrictEqual(Q.opts, opts), `A: read ${r} has the options ${show(Q && Q.opts)}, today it has ${show(opts)}`); });
  // contract: plan Task 1 (fix round 1): the right option must not sit in one place; over the 11 reads it takes all four places, none of them more than 4 times
  const places = [0, 1, 2, 3].map(i => allReads.filter(Q => Array.isArray(Q.opts) && Q.opts[i] === Q.read).length);
  check(allReads.length === 11 && places.every(n => n >= 1 && n <= 4), `A: the right option of the ${allReads.length} reads sits in place 0, 1, 2, 3 ${places.join(', ')} times; every place at least once and at most 4`);
  PROJECTS.forEach((P, p) => {
    const name = `${p} ${P && P.name}`;
    if (!P) { check(false, `A: project ${p} is missing`); return; }
    check(typeof P.name === 'string' && P.name.length > 2, `A: project ${p} has a name`);
    check(typeof P.sub === 'string' && P.sub.length > 10, `A: ${name} has a subtitle`);
    check(P.circle === circleOf[p] && (!CIRCLES || (CIRCLES[P.circle] && CIRCLES[P.circle].projects.includes(p))), `A: ${name}: circle ${P.circle} is not the one of the table`);
    check(Array.isArray(P.ex) && P.ex.length === 3 && P.ex.every(E => Array.isArray(E) && E.length === 5), `A: ${name}: three exercises of five questions`);   // contract: spec «Un projecte»
    if (!Array.isArray(P.ex)) return;
    const seen = new Set(), reads = [];
    let ex00borrow = 0;
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
      const w = walk(m, pl);
      check(typeof w === 'number', `A: ${tag}: ${w}`);
      const t = parse(Q.q);
      if (p === 5 && t && e === 0 && borrows(...t.nums)) ex00borrow++;
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

// ---- B. the progress: what is stored, the mark, XP, badges and which circles are open
// A random generator of its own, so that a run is the same every time
function seeded(a) {
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const show = v => inspect(v, { depth: 4, breakLength: Infinity }).slice(0, 300);
const num = x => typeof x === 'number' && Number.isFinite(x);
const clampTo = (x, hi) => Math.min(hi, Math.max(0, x));
// where a stored number x may come out of clean: never under its floor, never over itself, always inside 0..hi; what is not a number comes out 0
const rangeOf = (x, hi) => num(x) ? [clampTo(Math.floor(x), hi), clampTo(x, hi)] : [0, 0];
const itemOf = (a, i) => Array.isArray(a) ? a[i] : undefined;
const objOf = d => d && typeof d === 'object' && !Array.isArray(d) ? d : {};
// a progress built by hand, with the fields of the new shape; o changes some of them
const base = o => ({ so: true, secs: [0, 0, 0, 0, 0, 0], piscina: false, notes: Array(9).fill(0), exams: [false, false, false], fulls: 0, ...o });
// the 15 results of a project: right at the first try, except at the places in miss (a wrong answer, two, or the hint, in turn)
const run15 = (miss = []) => Array.from({ length: 15 }, (_, k) => miss.includes(k) ? [{ tries: 1, helped: false }, { tries: 0, helped: true }, { tries: 2, helped: true }][k % 3] : { tries: 0, helped: false });
// the shape clean promises, or what is wrong with it
function shapeOf(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return 'not an object';
  if (Object.keys(p).sort().join() !== 'exams,fulls,notes,piscina,secs,so') return `keys are ${Object.keys(p).sort().join()}`;
  const ints = (a, n, hi) => Array.isArray(a) && a.length === n && a.every(x => int(x) && x >= 0 && x <= hi && !Object.is(x, -0));
  if (typeof p.so !== 'boolean' || typeof p.piscina !== 'boolean') return 'so and piscina are booleans';
  if (!ints(p.secs, 6, 10)) return 'secs: six whole numbers from 0 to 10';
  if (!ints(p.notes, 9, 100)) return 'notes: nine whole numbers from 0 to 100';
  if (!Array.isArray(p.exams) || p.exams.length !== 3 || !p.exams.every(e => typeof e === 'boolean')) return 'exams: three booleans';
  if (!int(p.fulls) || p.fulls < 0 || Object.is(p.fulls, -0)) return 'fulls: a whole number of 0 or more';
  return '';
}
// runs test on every input; test says what is wrong or returns ''. One failure per property, naming the first three inputs that break it
function property(name, inputs, test) {
  const bad = [];
  for (const x of inputs) {
    const shown = show(x); let why;
    try { why = test(x); } catch (e) { why = `throws ${e.message}`; }
    if (why) bad.push(`${why}, for ${shown}`);
  }
  check(!bad.length, `B: ${name}: ${bad.length} of ${inputs.length} fail: ${bad.slice(0, 3).join(' | ')}`);
}
const same = (name, got, want) => check(isDeepStrictEqual(got, want), `B: ${name}: got ${show(got)}, expected ${show(want)}`);
// a part of B that stops on an error says so and the next one still runs
const section = (name, fn) => { try { fn(); } catch (e) { check(false, `B: ${name} stopped on ${e.message}`); } };

// a hundred and fifty progresses of the right shape and as many damaged ones (wrong types, numbers out of range, lists too long or short, lists inside lists), and some that are not an object at all
function randoms(rnd, count) {
  const r = n => Math.floor(rnd() * (n + 1)), pick = a => a[r(a.length - 1)];
  const JUNK = [null, undefined, 'x', '7', '', true, false, [], {}, [3], { a: 1 }, NaN, Infinity, -Infinity, -1, -0.5, 0.5, 4.7, 99.9, 250, 1e9, -1e9, 10.5];
  const item = hi => { const k = r(9); return k < 2 ? hi : k < 6 ? r(hi) : k < 8 ? pick(JUNK) : r(3 * hi) - hi; };
  const list = (n, gen) => { const k = r(9); if (k === 0) return pick(JUNK); return Array.from({ length: k < 6 ? n : k < 8 ? r(n) : n + 1 + r(4) }, gen); };
  const well = () => ({ so: rnd() < 0.8, secs: Array.from({ length: 6 }, () => rnd() < 0.35 ? 10 : r(9)), piscina: rnd() < 0.5, notes: Array.from({ length: 9 }, () => rnd() < 0.4 ? 0 : r(100)), exams: Array.from({ length: 3 }, () => rnd() < 0.3), fulls: r(40) });
  const wild = () => {
    const o = {}, has = () => rnd() < 0.85;
    if (has()) o.so = pick([true, false, ...JUNK]);
    if (has()) o.secs = list(6, () => item(10));
    if (has()) o.piscina = pick([true, false, false, ...JUNK]);
    if (has()) o.notes = list(9, () => item(100));
    if (has()) o.exams = list(3, () => pick([true, false, false, 1, 'true', null, true]));
    if (has()) o.fulls = item(30);
    if (rnd() < 0.2) o.equip = r(2);
    return o;
  };
  return Array.from({ length: count }, (_, k) => k % 12 === 11 ? pick([null, undefined, 5, 'x', [], [1, 2], true, 'null']) : k % 2 ? wild() : well());
}

function partB(m) {
  const names = ['VALID', 'EXAM_PASS', 'OLD', 'mark', 'clean', 'firstTry', 'handIn', 'xpOf', 'levelText', 'BADGES', 'badges', 'isOpen', 'examOpen'];
  const missing = names.filter(n => m[n] === undefined);
  if (missing.length) { check(false, `B: logic.js does not export ${missing.join(', ')}`); return; }
  const { clean, handIn } = m;
  const cl = d => clean(structuredClone(d));

  section('the constants', () => {
    check(m.VALID === 80, `B: VALID is ${m.VALID}, not 80`);   // contract: spec «Un projecte» (la nota), amb 80 el projecte queda validat
    check(m.EXAM_PASS === 5, `B: EXAM_PASS is ${m.EXAM_PASS}, not 5`);   // contract: spec «L'examen», se supera amb 5 de 6
    same('OLD, the section of the old game of each project', m.OLD, [0, 0, 1, 1, 2, 3, 4, 5, 5]);   // contract: spec «El que es desa», seccions per projecte
  });

  section('the mark', () => {
    // contract: spec «Un projecte» (la nota): round(100 x encerts / 15), worked out by hand for each number of firsts
    const marks = [[0, 0], [1, 7], [5, 33], [8, 53], [9, 60], [10, 67], [11, 73], [12, 80], [13, 87], [14, 93], [15, 100]];
    marks.forEach(([n, want]) => check(m.mark(n) === want, `B: mark(${n}) is ${m.mark(n)}, expected ${want}`));
  });

  section('firstTry', () => {
    // contract: spec «Un projecte» (la nota): compta si s'encerta al primer «Comprova» i sense pista
    check(m.firstTry({ tries: 0, helped: false }) === true, 'B: firstTry({ tries: 0, helped: false }) is not true');
    [{ tries: 1, helped: false }, { tries: 2, helped: false }, { tries: 0, helped: true }, { tries: 3, helped: true }, {}, null, undefined].forEach(r =>
      check(!m.firstTry(r), `B: firstTry(${show(r)}) is true`));
  });

  section('clean of the usual', () => {
    // contract: spec «El que es desa»: the new shape { so, secs[6], piscina, notes[9], exams[3], fulls }
    same('clean({})', cl({}), { so: true, secs: [0, 0, 0, 0, 0, 0], piscina: false, notes: [0, 0, 0, 0, 0, 0, 0, 0, 0], exams: [false, false, false], fulls: 0 });
    // contract: spec «El que es desa», the translation: 10 levels of a section give 80 to its projects, any level done gives the Piscina
    const old = cl({ secs: [10, 10, 4, 0, 0, 0] });
    same('clean({ secs: [10,10,4,0,0,0] }).notes', old.notes, [80, 80, 80, 80, 0, 0, 0, 0, 0]);
    check(old.piscina === true, 'B: clean({ secs: [10,10,4,0,0,0] }) does not open the Piscina');
    same('clean({ secs: [10,10,4,0,0,0] }).secs, which is kept as it came', old.secs, [10, 10, 4, 0, 0, 0]);   // contract: spec «El que es desa», secs es conserva tal com és
    const part = cl({ secs: [3, 0, 0, 0, 0, 0] });
    check(part.piscina === true, 'B: clean({ secs: [3,0,0,0,0,0] }) does not open the Piscina');   // contract: spec «El que es desa», piscina si secs té algun nivell fet
    same('clean({ secs: [3,0,0,0,0,0] }).notes, no section of 10 levels so no mark', part.notes, [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const kept = cl({ secs: [10, 0, 0, 0, 0, 0], notes: [95] });
    check(kept.notes[0] === 95 && kept.notes[1] === 80, `B: clean({ secs: [10,0,0,0,0,0], notes: [95] }).notes starts ${show(kept.notes.slice(0, 2))}, expected [95, 80]`);   // contract: spec «El que es desa», notes[i] és el màxim entre la nota desada i 80
    same('clean({ secs: [10,0,0,0,0,0], notes: [60] }).notes[0], the 80 of the old game beats a lower mark', cl({ secs: [10, 0, 0, 0, 0, 0], notes: [60] }).notes[0], 80);   // contract: the same
    // each old section on its own gives its projects, by the table [0, 0, 1, 1, 2, 3, 4, 5, 5]
    [[0, [0, 1]], [1, [2, 3]], [2, [4]], [3, [5]], [4, [6]], [5, [7, 8]]].forEach(([s, ps]) => {   // contract: spec «El que es desa», seccions per projecte
      const secs = [0, 0, 0, 0, 0, 0]; secs[s] = 10;
      const want = Array(9).fill(0); ps.forEach(i => { want[i] = 80; });
      same(`clean({ secs: ${show(secs)} }).notes`, cl({ secs }).notes, want);
    });
    same('clean with 9 levels in every section, no section is done', cl({ secs: [9, 9, 9, 9, 9, 9] }).notes, Array(9).fill(0));   // contract: spec «El que es desa», 10 nivells fets
    check(cl({ secs: [0, 0, 0, 0, 0, 1] }).piscina === true, 'B: clean({ secs: [0,0,0,0,0,1] }) does not open the Piscina, any level counts');   // contract: spec «El que es desa»
    same('clean({ so: false }).so', cl({ so: false }).so, false);   // contract: spec «Decisions», so és l'única preferència
    same('clean({ so: true }).so', cl({ so: true }).so, true);
    same('clean({ so: null }).so, a damaged preference is the default', cl({ so: null }).so, true);   // contract: review 3+4 (M3), so is on unless stored false
    same("clean({ so: 'x' }).so, a damaged preference is the default", cl({ so: 'x' }).so, true);   // contract: review 3+4 (M3)
    // a stored progress of the new shape comes out as it is
    const store = base({ so: false, secs: [10, 2, 0, 0, 0, 0], piscina: true, notes: [100, 80, 55, 0, 0, 0, 0, 0, 9], exams: [true, false, false], fulls: 12 });
    same('clean of a progress that is already clean, and still carrying the old secs', cl(store).notes, [100, 80, 55, 0, 0, 0, 0, 0, 9]);   // contract: spec «El que es desa», només puja valors
    same('clean of that progress, fulls and exams', [cl(store).fulls, cl(store).exams, cl(store).piscina, cl(store).so, cl(store).secs], [12, [true, false, false], true, false, [10, 2, 0, 0, 0, 0]]);
  });

  section('clean of damaged data', () => {
    // contract: spec «El que es desa»: clean makes a valid progress from any JSON
    [null, undefined, [], 'x', 5, true, [1, 2, 3]].forEach(d => { const bad = shapeOf(cl(d)); check(!bad, `B: clean(${show(d)}) is not a valid progress: ${bad}`); });
    const wild = { notes: 'a', secs: ['x', 99, -3], piscina: 'sí', exams: [1], fulls: -2 };
    const w = cl(wild);
    check(!shapeOf(w), `B: clean(${show(wild)}) is not a valid progress: ${shapeOf(w)}`);
    same('clean of the damaged progress, exams (1 is not true)', w.exams, [false, false, false]);   // contract: the plan, Task 3: exams only true when it was true
    check(w.fulls === 0, `B: clean of the damaged progress: fulls is ${show(w.fulls)}, expected 0`);   // contract: the same
    same('clean of the damaged progress, secs (a word is 0, 99 is 10, -3 is 0)', w.secs, [0, 10, 0, 0, 0, 0]);   // contract: ruling of the controller, clean clamps each secs to a whole number from 0 to 10
    const big = cl({ notes: [250, -5, 100, 101, 99, 1000, 0, 50, 3, 7, 8, 9] });
    check(big.notes[0] === 100 && big.notes[1] === 0 && big.notes[2] === 100 && big.notes[3] === 100 && big.notes[4] === 99, `B: clean of notes [250,-5,100,101,99,...] starts ${show(big.notes.slice(0, 5))}, expected [100, 0, 100, 100, 99]`);   // contract: the plan, Task 3: a note of 250 comes out 100
    check(big.notes.length === 9 && big.notes[8] === 3, `B: clean of a list of 12 notes has ${big.notes.length} places and ends in ${big.notes[8]}, expected 9 and 3`);   // contract: the plan, Task 3: 12 places come out 9
    check(cl({ exams: [true, true, true, true, true] }).exams.length === 3, 'B: clean of five exams does not keep three');   // contract: spec «El que es desa», exams[3]
    check(cl({ secs: [1, 2, 3, 4, 5, 6, 7, 8] }).secs.length === 6, 'B: clean of eight secs does not keep six');   // contract: spec «El que es desa», secs[6]
    check(cl({ secs: [10, 10, 10, 10, 10, 10] }).secs.every(x => x === 10), 'B: clean lowered a full secs');   // contract: spec «El que es desa», secs es conserva
  });

  section('clean and what it shares', () => {
    // contract: the plan, Task 3: clean returns a new object that shares no list with its input
    const d = { secs: [1, 2, 3, 4, 5, 6], notes: [1, 2, 3, 4, 5, 6, 7, 8, 9], exams: [true, false, true], fulls: 4, piscina: true, so: true };
    const copy = structuredClone(d), c = clean(d);
    check(c !== d, 'B: clean returns its own input');
    ['secs', 'notes', 'exams'].forEach(k => {
      check(c[k] !== d[k], `B: clean shares the list ${k} with its input`);
      c[k][0] = k === 'exams' ? !c[k][0] : 99;
    });
    same('the input of clean after its output was changed', d, copy);
    const one = clean({}), two = clean({});
    one.notes[0] = 50; one.secs[0] = 5; one.exams[0] = true;
    same('clean({}) after the output of an earlier call was changed (a list shared between calls)', clean({}), { so: true, secs: [0, 0, 0, 0, 0, 0], piscina: false, notes: Array(9).fill(0), exams: [false, false, false], fulls: 0 });
    check(two.notes !== one.notes && two.secs !== one.secs && two.exams !== one.exams, 'B: two calls of clean({}) share a list');
    const frozen = Object.freeze({ secs: Object.freeze([10, 0, 0, 0, 0, 0]), notes: Object.freeze([60]), exams: Object.freeze([true]), fulls: 1 });
    check(!shapeOf(clean(frozen)), 'B: clean of a frozen input fails');
  });

  section('clean never lowers', () => {
    // contract: spec «El que es desa» and README: numbers only grow, booleans only turn true; the cloud keeps the larger number, so a value that clean lowered would be lost or come back
    const inputs = randoms(seeded(20261006), 300);
    property('clean gives a valid progress', inputs, d => shapeOf(cl(d)));
    property('clean of a clean progress is the same progress (idempotent)', inputs, d => { const a = cl(d); return isDeepStrictEqual(clean(structuredClone(a)), a) ? '' : `clean(clean(d)) is ${show(clean(structuredClone(a)))}, clean(d) is ${show(a)}`; });
    property('clean leaves its input as it was', inputs, d => { const before = structuredClone(d); clean(d); return isDeepStrictEqual(d, before) ? '' : 'the input changed'; });
    property('clean shares no list with its input', inputs, d => {
      const o = objOf(d), c = clean(d);
      return ['secs', 'notes', 'exams'].filter(k => Array.isArray(o[k]) && c[k] === o[k]).map(k => `${k} is the list of the input`).join();
    });
    // the secs that clean must give, worked out from the input with the checker's own clamp (never from the output under check)
    const secsOf = o => Array.from({ length: 6 }, (_, i) => rangeOf(itemOf(o.secs, i), 10)[0]);
    const T = i => [0, 0, 1, 1, 2, 3, 4, 5, 5][i];   // the table of the spec, written again here so that a wrong OLD cannot hide a wrong clean
    property('secs: whole, from 0 to 10, never raised, a valid stored one identical', inputs, d => {
      const o = objOf(d), c = cl(d);
      for (let i = 0; i < 6; i++) {
        const x = itemOf(o.secs, i), [lo, hi] = rangeOf(x, 10);
        if (c.secs[i] < lo || c.secs[i] > hi) return `secs[${i}] is ${c.secs[i]} for the stored ${show(x)}, expected ${lo} to ${hi}`;
        if ((!num(x) || int(x)) && c.secs[i] !== lo) return `secs[${i}] is ${c.secs[i]} for the stored ${show(x)}, expected ${lo}`;
      }
      return '';
    });
    property('notes: never lower than stored, 80 where the old section is done, never over 100', inputs, d => {
      const o = objOf(d), c = cl(d), sx = secsOf(o);
      for (let i = 0; i < 9; i++) {
        const x = itemOf(o.notes, i), [lo, hi] = rangeOf(x, 100), t = sx[T(i)] === 10 ? 80 : 0;
        if (c.notes[i] < Math.max(lo, t) || c.notes[i] > Math.max(hi, t)) return `notes[${i}] is ${c.notes[i]} for the stored ${show(x)} and secs ${show(sx)}, expected ${Math.max(lo, t)} to ${Math.max(hi, t)}`;
        if ((!num(x) || int(x)) && c.notes[i] !== Math.max(lo, t)) return `notes[${i}] is ${c.notes[i]} for the stored ${show(x)} and secs ${show(sx)}, expected ${Math.max(lo, t)}`;
      }
      return '';
    });
    property('fulls: never lower than stored, never negative', inputs, d => {
      const x = objOf(d).fulls, [lo, hi] = rangeOf(x, Infinity), c = cl(d);
      if (c.fulls < lo || c.fulls > hi) return `fulls is ${c.fulls} for the stored ${show(x)}, expected ${lo} to ${hi}`;
      return (!num(x) || int(x)) && c.fulls !== lo ? `fulls is ${c.fulls} for the stored ${show(x)}, expected ${lo}` : '';
    });
    property('piscina: true when stored true or when a section has a level done, and only then', inputs, d => {
      const c = cl(d), want = objOf(d).piscina === true || secsOf(objOf(d)).some(s => s > 0);
      return c.piscina === want ? '' : `piscina is ${c.piscina}, expected ${want}`;
    });
    property('exams: true exactly where stored true', inputs, d => {
      const c = cl(d), want = [0, 1, 2].map(i => itemOf(objOf(d).exams, i) === true);
      return isDeepStrictEqual(c.exams, want) ? '' : `exams is ${show(c.exams)}, expected ${show(want)}`;
    });
    property('so: kept when stored as a boolean', inputs, d => {
      const x = objOf(d).so, c = cl(d);
      return x === false ? (c.so === false ? '' : 'so was turned on') : x === true || x === undefined ? (c.so === true ? '' : 'so was turned off') : '';
    });
    // the cloud merge: when a device holds more than another, what clean makes of it holds more too
    const wells = inputs.filter((_, k) => k % 2 === 0 && k % 12 !== 11);
    const rnd = seeded(7), r = n => Math.floor(rnd() * (n + 1));
    const pairs = wells.map(p => {
      const q = structuredClone(p);
      q.secs = q.secs.map(s => rnd() < 0.3 ? Math.min(10, s + r(5)) : s);
      q.notes = q.notes.map(s => rnd() < 0.3 ? Math.min(100, s + r(30)) : s);
      q.exams = q.exams.map(e => e || rnd() < 0.3);
      q.piscina = q.piscina || rnd() < 0.3; q.fulls += r(5);
      return { p, q };
    });
    property('clean(more) holds at least what clean(less) holds, field by field', pairs, ({ p, q }) => {
      const a = cl(p), b = cl(q);
      for (const k of ['secs', 'notes']) for (let i = 0; i < a[k].length; i++) if (b[k][i] < a[k][i]) return `${k}[${i}] fell from ${a[k][i]} to ${b[k][i]}`;
      if (b.fulls < a.fulls) return `fulls fell from ${a.fulls} to ${b.fulls}`;
      if (a.piscina && !b.piscina) return 'piscina fell';
      return a.exams.some((e, i) => e && !b.exams[i]) ? 'an exam fell' : '';
    });
  });

  section('handIn', () => {
    // contract: spec «Un projecte» (la nota) and «XP»: the mark is round(100 x firsts / 15), the best one is kept, a project from 80 up is validated and gives its mark in XP
    const snap = x => JSON.stringify(x);
    const fresh = base({ piscina: true });
    const all = handIn(fresh, 0, run15());
    check(all.n === 100 && all.best === 0 && all.prog.notes[0] === 100, `B: handIn with 15 at the first try: n ${all.n}, best ${all.best}, notes[0] ${all.prog.notes[0]}, expected 100, 0, 100`);
    check(all.gain === 100, `B: handIn with 15 at the first try: gain ${all.gain}, expected 100`);   // contract: spec «XP»: the mark of a validated project
    same('handIn with 15 at the first try: redo', all.redo, []);
    same('handIn with 15 at the first try: news (the 100 is a badge, the Piscina was done before)', all.news, [m.BADGES[2].name]);   // contract: spec «XP, nivell i insígnies», un projecte amb 100
    same('handIn with 15 at the first try: the other notes', all.prog.notes.slice(1), Array(8).fill(0));
    const ok12 = handIn(fresh, 1, run15([2, 7, 13]));
    check(ok12.n === 80 && ok12.prog.notes[1] === 80 && ok12.gain === 80, `B: handIn with 12 at the first try: n ${ok12.n}, notes[1] ${ok12.prog.notes[1]}, gain ${ok12.gain}, expected 80, 80, 80`);   // contract: spec «Un projecte», amb 80 el projecte queda validat
    same('handIn with 12 (one hinted): redo, the exercises with a miss', ok12.redo, ['ex00', 'ex01', 'ex02']);   // contract: the Cursus, redo names 'ex00', 'ex01', 'ex02'
    same('handIn with 12: news', ok12.news, []);
    const low = handIn(fresh, 2, run15([5, 6, 7, 8]));
    check(low.n === 73 && low.best === 0 && low.prog.notes[2] === 73 && low.gain === 0, `B: handIn with 11 at the first try: n ${low.n}, best ${low.best}, notes[2] ${low.prog.notes[2]}, gain ${low.gain}, expected 73, 0, 73, 0`);   // contract: spec «Un projecte», 73 does not validate and gives no XP
    same('handIn with 11, misses only in the second exercise: redo', low.redo, ['ex01']);
    const edges = handIn(fresh, 8, run15([0, 14]));
    check(edges.n === 87 && edges.prog.notes[8] === 87, `B: handIn with 13 (misses in the first and the third exercise), project 8: n ${edges.n}, notes[8] ${edges.prog.notes[8]}, expected 87, 87`);   // contract: spec «Un projecte», round(100 x 13 / 15)
    same('handIn with misses in the first and the third exercise: redo', edges.redo, ['ex00', 'ex02']);
    // a mark can never pass 100, whatever the length of the run
    [16, 20].forEach(len => {
      const long = handIn(fresh, 4, Array.from({ length: len }, () => ({ tries: 0, helped: false })));
      check(long.n === 100 && long.prog.notes[4] === 100 && long.gain === 100, `B: handIn with ${len} results at the first try: n ${long.n}, notes[4] ${long.prog.notes[4]}, gain ${long.gain}, expected 100, 100, 100`);   // contract: review 3+4 (I1), spec «Un projecte», the mark is round(100 x encerts / 15), 100 at most
    });
    // a short run: the exercises with no result are to be redone
    const firsts = n => Array.from({ length: n }, () => ({ tries: 0, helped: false }));
    same('handIn with 5 results, redo', handIn(fresh, 0, firsts(5)).redo, ['ex01', 'ex02']);   // contract: review 3+4 (M1), an exercise with a question not done is one to redo
    same('handIn with 10 results, redo', handIn(fresh, 0, firsts(10)).redo, ['ex02']);   // contract: review 3+4 (M1)
    const none = handIn(fresh, 0, []);
    same('handIn with an empty run, redo', none.redo, ['ex00', 'ex01', 'ex02']);   // contract: review 3+4 (M1)
    check(none.n === 0 && none.prog.notes[0] === 0 && none.gain === 0, `B: handIn with an empty run: n ${none.n}, notes[0] ${none.prog.notes[0]}, gain ${none.gain}, expected 0, 0, 0`);   // contract: review 3+4 (M1), mark(0) is 0
    // a lower or equal mark changes nothing
    const full = base({ piscina: true, notes: [100, 0, 0, 0, 0, 0, 0, 0, 0] });
    const lower = handIn(full, 0, run15([5, 6, 7, 8]));
    check(lower.n === 73 && lower.best === 100 && lower.gain === 0, `B: handIn with 11 over a stored 100: n ${lower.n}, best ${lower.best}, gain ${lower.gain}, expected 73, 100, 0`);   // contract: spec «Un projecte», refer un projecte no baixa la nota
    same('handIn with 11 over a stored 100: the progress', lower.prog, full);
    const equal = handIn(base({ notes: [80, 0, 0, 0, 0, 0, 0, 0, 0] }), 0, run15([3, 4, 5]));
    check(equal.gain === 0 && equal.prog.notes[0] === 80, `B: handIn with 12 over a stored 80: gain ${equal.gain}, notes[0] ${equal.prog.notes[0]}, expected 0, 80`);
    // a better mark gives only the difference
    const better = handIn(base({ notes: [80, 0, 0, 0, 0, 0, 0, 0, 0] }), 0, run15());
    check(better.gain === 20 && better.best === 80 && better.prog.notes[0] === 100, `B: handIn with 15 over a stored 80: gain ${better.gain}, best ${better.best}, notes[0] ${better.prog.notes[0]}, expected 20, 80, 100`);   // contract: spec «XP», en millorar, només la diferència
    const climb = handIn(base({ notes: [73, 0, 0, 0, 0, 0, 0, 0, 0] }), 0, run15([3, 4, 5]));
    check(climb.gain === 80 && climb.prog.notes[0] === 80, `B: handIn with 12 over a stored 73: gain ${climb.gain}, notes[0] ${climb.prog.notes[0]}, expected 80, 80`);   // contract: spec «XP», on validating the whole mark counts
    // validating raises the number of sheets that count: 5 fulls, 1 project, 3 count
    const sheets = handIn(base({ fulls: 5 }), 0, run15([3, 4, 5]));
    check(sheets.gain === 110, `B: handIn with 12 with 5 fulls: gain ${sheets.gain}, expected 110 (80 + 3 fulls of 10)`);   // contract: spec «XP», 10 per full up to 3 per validated project
    // a badge is news once
    const had = handIn(base({ piscina: true, notes: [0, 0, 0, 100, 0, 0, 0, 0, 0] }), 0, run15());
    same('handIn with 15 when a 100 was already stored: news', had.news, []);
    // p is not touched, nothing is shared, the rest of the progress is carried over
    const p = base({ so: false, secs: [10, 10, 4, 0, 0, 0], piscina: true, notes: [80, 50, 0, 0, 0, 0, 0, 0, 0], exams: [true, false, false], fulls: 3 });
    const before = snap(p), out = handIn(p, 1, run15([4]));
    check(snap(p) === before, `B: handIn changed its progress: ${snap(p)}`);
    check(out.prog !== p && out.prog.notes !== p.notes && out.prog.exams !== p.exams && out.prog.secs !== p.secs, 'B: handIn returns a progress that shares an object or a list with the one it was given');
    out.prog.notes[0] = 1; out.prog.exams[1] = true; out.prog.secs[0] = 0;
    check(snap(p) === before, 'B: a change in the progress that handIn returns changed the one it was given');
    const o2 = handIn(p, 1, run15([4]));
    same('handIn carries the rest of the progress over', [o2.prog.so, o2.prog.secs, o2.prog.piscina, o2.prog.exams, o2.prog.fulls, o2.prog.notes], [false, [10, 10, 4, 0, 0, 0], true, [true, false, false], 3, [80, 93, 0, 0, 0, 0, 0, 0, 0]]);
    const runs = [run15(), run15([1]), run15([0, 1, 2, 3]), run15([5, 6, 7, 8, 9, 10, 11, 12, 13, 14])];
    runs.forEach(rn => { const o = handIn(p, 3, rn); check(isDeepStrictEqual(Object.keys(o).sort(), ['best', 'gain', 'n', 'news', 'prog', 'redo']), `B: handIn returns the keys ${Object.keys(o).sort()}, expected best, gain, n, news, prog, redo`); });
  });

  section('xpOf and levelText', () => {
    // contract: spec «XP, nivell i insígnies»: 50 the Piscina, the mark of each validated project, 50 per exam, 10 per full up to 3 per validated project; the maximum is 50 + 900 + 150 + 270 = 1370
    const p = base({ piscina: true, notes: [80, 100, 0, 0, 0, 0, 0, 0, 0], exams: [true, false, false], fulls: 7 });
    check(m.xpOf(p) === 340, `B: xpOf is ${m.xpOf(p)}, expected 340 (50 + 180 + 50 + 60)`);   // contract: the plan, Task 3
    const xps = [
      ['nothing', base({}), 0], ['the Piscina', base({ piscina: true }), 50],
      ['a mark of 79', base({ notes: [79, 0, 0, 0, 0, 0, 0, 0, 0] }), 0], ['a mark of 80', base({ notes: [80, 0, 0, 0, 0, 0, 0, 0, 0] }), 80],
      ['a mark of 100', base({ notes: [0, 0, 0, 0, 0, 0, 0, 0, 100] }), 100], ['two exams', base({ exams: [true, true, false] }), 100],
      ['3 fulls and none validated, which do not count', base({ fulls: 3 }), 0], ['5 fulls and one validated, 3 count', base({ notes: [80, 0, 0, 0, 0, 0, 0, 0, 0], fulls: 5 }), 110],
      ['9 fulls and one validated, 3 count', base({ notes: [0, 0, 0, 0, 0, 0, 0, 0, 90], fulls: 9 }), 120], ['2 fulls and one validated', base({ notes: [0, 0, 0, 85, 0, 0, 0, 0, 0], fulls: 2 }), 105],
      ['7 fulls and 2 validated, 6 count', base({ notes: [80, 80, 0, 0, 0, 0, 0, 0, 0], fulls: 7 }), 220],
      ['the best of everything and a thousand fulls', base({ piscina: true, notes: Array(9).fill(100), exams: [true, true, true], fulls: 1000 }), 1370],
      ['every project at 80 and 27 fulls', base({ notes: Array(9).fill(80), fulls: 27 }), 990]
    ];
    xps.forEach(([what, q, want]) => check(m.xpOf(q) === want, `B: xpOf of ${what} is ${m.xpOf(q)}, expected ${want}`));
    const lv = m.levelText(p);
    check(typeof lv === 'string' && lv.includes('2,27'), `B: levelText of 340 XP is ${show(lv)}, expected a text with 2,27`);   // contract: spec «XP», nivell = XP / 150: 340 / 150 = 2,27
    const l0 = m.levelText(base({})), l9 = m.levelText(base({ piscina: true, notes: Array(9).fill(100), exams: [true, true, true], fulls: 99 }));
    check(typeof l0 === 'string' && l0.includes('0,00'), `B: levelText of no XP is ${show(l0)}, expected a text with 0,00`);   // contract: spec «XP», de 0,00 a 9,13
    check(typeof l9 === 'string' && l9.includes('9,13'), `B: levelText of 1370 XP is ${show(l9)}, expected a text with 9,13`);   // contract: spec «XP», 1370 / 150 = 9,13
  });

  section('badges', () => {
    // contract: spec «XP, nivell i insígnies»: the five, in this order: the Piscina, a perfect sheet, a project with 100, ten perfect sheets, the three exams
    check(Array.isArray(m.BADGES) && m.BADGES.length === 5 && m.BADGES.every(b => b && typeof b.name === 'string' && b.name && typeof b.what === 'string' && b.what) && new Set(m.BADGES.map(b => b.name)).size === 5, `B: BADGES is not five badges with a name and a text: ${show(m.BADGES)}`);
    const o = [false, false, false, false, false], at = i => o.map((_, j) => j === i);
    const n9 = (i, v) => { const a = Array(9).fill(0); a[i] = v; return a; };
    const cases = [
      ['nothing', base({}), o],
      ['the Piscina', base({ piscina: true }), at(0)],
      ['1 full', base({ fulls: 1 }), at(1)], ['0 fulls', base({ fulls: 0, piscina: true }), at(0)],
      ['9 fulls, not yet ten', base({ fulls: 9 }), at(1)], ['10 fulls', base({ fulls: 10 }), [false, true, false, true, false]],
      ['a 100 in the first project', base({ notes: n9(0, 100) }), at(2)], ['a 100 in the last project', base({ notes: n9(8, 100) }), at(2)],
      ['a 99', base({ notes: n9(4, 99) }), o], ['an 80', base({ notes: n9(4, 80) }), o],
      ['two exams', base({ exams: [true, true, false] }), o], ['the first and the last exam', base({ exams: [true, false, true] }), o],
      ['three exams', base({ exams: [true, true, true] }), at(4)],
      ['everything', base({ piscina: true, fulls: 10, notes: Array(9).fill(100), exams: [true, true, true] }), [true, true, true, true, true]]
    ];
    cases.forEach(([what, p, want]) => same(`badges of ${what}`, m.badges(p), want));
  });

  section('isOpen and examOpen', () => {
    // contract: spec «El mapa»: circle 0 opens with the Piscina; the exam of a circle opens the next one; a circle is open only if the one before it is
    const bools = [false, true], combos = bools.flatMap(a => bools.flatMap(b => bools.map(c => [a, b, c])));
    const cases = bools.flatMap(piscina => combos.map(exams => base({ piscina, exams })));
    property('isOpen(p, 0) is piscina', cases, p => m.isOpen(p, 0) === p.piscina ? '' : `it is ${m.isOpen(p, 0)}`);
    property('isOpen(p, 1) asks the circle 0 open and the first exam', cases, p => { const w = p.piscina && p.exams[0]; return m.isOpen(p, 1) === w ? '' : `it is ${m.isOpen(p, 1)}, expected ${w}`; });
    property('isOpen(p, 2) asks the circle 1 open and the second exam', cases, p => { const w = p.piscina && p.exams[0] && p.exams[1]; return m.isOpen(p, 2) === w ? '' : `it is ${m.isOpen(p, 2)}, expected ${w}`; });   // contract: spec «El mapa», un cercle només és obert si l'anterior també ho és
    check(m.isOpen(base({ piscina: true, exams: [false, true, false] }), 2) === false, 'B: isOpen(2) with exams [false, true, false] is not false');   // contract: the plan, Task 3
    check(m.isOpen(base({ piscina: false, exams: [true, true, true] }), 1) === false, 'B: isOpen(1) without the Piscina is not false');   // contract: spec «El mapa»
    // a circle that does not exist is shut and asking is no error
    const done = base({ piscina: true, notes: Array(9).fill(100), exams: [true, true, true] });
    [[3, 'isOpen'], [-1, 'isOpen'], [3, 'examOpen'], [-1, 'examOpen']].forEach(([c, fn]) => {
      let got; try { got = m[fn](done, c); } catch (e) { got = `throws ${e.message}`; }
      check(got === false, `B: ${fn}(everything passed, ${c}) is ${show(got)}, expected false`);   // contract: review 3+4 (M2), spec «El mapa»: three circles, 0 to 2
    });
    // contract: spec «El mapa»: the exam of a circle opens when the circle is open and all its projects have 80 or more; circles 0-1, 2-5, 6-8
    const CIR = [[0, 1], [2, 3, 4, 5], [6, 7, 8]], exCases = [];
    for (const p of cases) for (let c = 0; c < 3; c++) for (const short of [-1, ...CIR[c]]) {
      const notes = Array(9).fill(0); CIR[c].forEach(i => { notes[i] = i === short ? 79 : 80; });
      exCases.push({ ...p, notes, c, short });
    }
    property('examOpen(p, c): the circle open and every project of it from 80', exCases, p => {
      const open = [p.piscina, p.piscina && p.exams[0], p.piscina && p.exams[0] && p.exams[1]][p.c], want = open && p.short === -1, got = m.examOpen(p, p.c);
      return got === want ? '' : `examOpen(p, ${p.c}) is ${got}, expected ${want}`;
    });
    const other = base({ piscina: true, notes: [80, 79, 100, 100, 100, 100, 100, 100, 100] });
    check(m.examOpen(other, 0) === false, 'B: examOpen(0) with a 79 in project 1 is not false (the other circles hold 100)');
    check(m.examOpen(base({ piscina: true, notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] }), 0) === true, 'B: examOpen(0) with 80 and 80 is not true (the other circles hold 0)');
  });
}

// ---- C. the exam and the sheet of «Caça l'errada»
const CIRCLE_PROJECTS = [[0, 1], [2, 3, 4, 5], [6, 7, 8]];   // contract: spec «El mapa» table, written again here so that a wrong CIRCLES cannot hide a wrong exam
const KINDS = ['veïna', 'dalt', 'girat'];                    // contract: spec «Caça l'errada», els tres errors que es generen
const sectionC = (name, fn) => { try { fn(); } catch (e) { check(false, `C: ${name} stopped on ${e.message}`); } };
const propertyC = (name, inputs, test) => {
  const bad = [];
  for (const x of inputs) {
    const shown = show(x); let why;
    try { why = test(x); } catch (e) { why = `throws ${e.message}`; }
    if (why) bad.push(`${why}, for ${shown}`);
  }
  check(!bad.length, `C: ${name}: ${bad.length} of ${inputs.length} fail: ${bad.slice(0, 3).join(' | ')}`);
};
// what an abacus shows, read column by column (the units first): each lower bead is worth 1, the upper bead 5
const readRods = rods => rods.reduce((a, r, p) => a + (r.lo + 5 * r.hi) * 10 ** p, 0);
// three columns, each { lo, hi } with 0 to 4 lower beads up and the upper bead down or not: the checker's own idea of a tidy board
const rodsShape = rods => !Array.isArray(rods) || rods.length !== 3 ? 'not three columns'
  : rods.some(r => !r || typeof r !== 'object' || Object.keys(r).sort().join() !== 'hi,lo') ? 'a column is not { lo, hi }'
  : rods.some(r => !int(r.lo) || r.lo < 0 || r.lo > 4 || (r.hi !== 0 && r.hi !== 1)) ? 'a board that is not tidy (lo from 0 to 4, hi 0 or 1)' : '';
// the decks ('lo', 'hi') of the beads that, moved from a column to the one beside it, make the board show says (and tidy); none when no single bead does
function fixDecks(rods, says) {
  const out = [];
  for (let p = 0; p < 3; p++) for (const deck of ['lo', 'hi']) for (const q of [p - 1, p + 1]) {
    if (q < 0 || q > 2 || rods[p][deck] < 1) continue;
    const to = rods.map(r => ({ ...r })); to[p][deck]--; to[q][deck]++;
    if (to[q].lo <= 4 && to[q].hi <= 1 && readRods(to) === says) out.push(deck);
  }
  return out;
}
// does swapping two different digits of the number the board shows give says (no zero made on the left)?
function twoDigitsSwapped(v, says) {
  const s = String(v);
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
    if (s[i] === s[j]) continue;
    const a = [...s]; [a[i], a[j]] = [a[j], a[i]];
    if (a.join('') === String(says)) return true;
  }
  return false;
}
// what is wrong with one board of a sheet, or ''
function boardProblem(b) {
  if (!b || typeof b !== 'object') return 'a board is not an object';
  const shape = rodsShape(b.rods);
  if (shape) return shape;
  if (!int(b.says) || b.says < 10 || b.says > 999) return `says is ${show(b.says)}, not a whole number from 10 to 999`;   // contract: plan Task 5, says entre 10 i 999
  if (b.bad !== null && !KINDS.includes(b.bad)) return `bad is ${show(b.bad)}, not null, 'veïna', 'dalt' or 'girat'`;
  const v = readRods(b.rods);
  if (b.bad === null) return v === b.says ? '' : `a good board shows ${v}, not ${b.says}`;   // contract: spec «Caça l'errada», un àbac bo marca el número
  if (v === b.says) return `a ${b.bad} board shows what says says (${v})`;
  if (b.bad === 'veïna') return fixDecks(b.rods, b.says).length ? '' : `a veïna board from which no single bead moved to the column beside it shows ${b.says} (it shows ${v})`;   // contract: spec «Caça l'errada», una bola en una columna veïna
  if (b.bad === 'dalt') return [0, 1, 2].some(p => b.rods[p].hi === 1 && v - b.says === 4 * 10 ** p) ? '' : `a dalt board must show 4 x 10^p more than says in a column with the upper bead down: it shows ${v}, says ${b.says}`;   // contract: spec «Caça l'errada», la bola de dalt comptada com a 1 (5 - 1 = 4 de la columna)
  return twoDigitsSwapped(v, b.says) ? '' : `a girat board does not show says with two different digits swapped: it shows ${v}, says ${b.says}`;   // contract: spec «Caça l'errada», dues xifres girades (47 per 74)
}

function partC(m) {
  const names = ['exam', 'examIn', 'sheet', 'sheetIn', 'PROJECTS', 'BADGES'];
  const missing = names.filter(n => m[n] === undefined);
  if (missing.length) { check(false, `C: logic.js does not export ${missing.join(', ')}`); return; }
  const { PROJECTS, BADGES } = m;
  const snap = x => JSON.stringify(x);
  const sameC = (name, got, want) => check(isDeepStrictEqual(got, want), `C: ${name}: got ${show(got)}, expected ${show(want)}`);
  const fixedBefore = snap(PROJECTS);
  // a progress where circle c is open and so is its exam: the Piscina, the exams before it, and 80 in each project of the circle
  const examBase = (c, o) => {
    const notes = Array(9).fill(0); CIRCLE_PROJECTS[c].forEach(i => { notes[i] = 80; });
    return base({ piscina: true, notes, exams: [0, 1, 2].map(j => j < c), ...o });
  };
  // the same list sorted and without repeats, or what is wrong with it
  const asSet = a => Array.isArray(a) && a.every(int) && new Set(a).size === a.length ? [...a].sort((x, y) => x - y) : null;
  const sharing = (p, out) => out.prog === p || ['secs', 'notes', 'exams'].some(k => out.prog[k] === p[k]);

  sectionC('the exam', () => {
    // contract: spec «L'examen» and «Com es comprova»: six questions from the projects of the circle, at least one of each project, all solvable, 200 exams per circle
    for (let c = 0; c < 3; c++) {
      const rnd = seeded(20261100 + c), exams = Array.from({ length: 200 }, () => m.exam(c, rnd));
      propertyC(`exam(${c}): six different questions, all fixed ones of a project of the circle, one at least of each project`, exams, qs => {
        if (!Array.isArray(qs) || qs.length !== 6) return `${Array.isArray(qs) ? qs.length : 'not a list'} questions, expected 6`;   // contract: spec «L'examen», sis operacions
        const keys = new Set(), seen = new Set();
        for (const q of qs) {
          if (!q || typeof q !== 'object' || !int(q.p)) return `a question without p (${show(q)})`;
          if (!CIRCLE_PROJECTS[c].includes(q.p)) return `a question of project ${q.p}, which is not in circle ${c}`;
          const { p, ...rest } = q, P = PROJECTS[p];
          if (!P || !Array.isArray(P.ex) || !P.ex.flat().some(f => isDeepStrictEqual(f, rest))) return `a question that is not one of the 15 of project ${p}: ${show(rest)}`;   // contract: plan Task 5, totes de les 15 fixes d'algun projecte del cercle
          if (rest.q !== undefined) { const v = evaluate(rest.q); if (v.problems.length) return `${rest.q}: ${v.problems.join()}`; }
          keys.add(key(rest)); seen.add(p);
        }
        if (keys.size !== 6) return `${keys.size} different questions, expected 6`;
        const lack = CIRCLE_PROJECTS[c].filter(p => !seen.has(p));
        return lack.length ? `no question of project ${lack.join()}` : '';   // contract: spec «L'examen», almenys una de cada projecte
      });
      const kinds = new Set(exams.map(snap)).size;
      check(kinds > 20, `C: 200 exams of circle ${c} are only ${kinds} different ones`);
      // contract: plan Task 5 (fix round 1): the exams must not lean; in 200 of them every fixed question of the circle comes out, and every project of the circle opens one (place 0)
      const drawn = new Set(exams.flatMap(qs => qs.map(q => `${q.p} ${key(q)}`)));
      const never = CIRCLE_PROJECTS[c].flatMap(p => PROJECTS[p].ex.flat().map(Q => `${p} ${key(Q)}`)).filter(k => !drawn.has(k));
      check(!never.length, `C: in 200 exams of circle ${c}, ${never.length} fixed questions never come out, such as ${never.slice(0, 3).join(' | ')}`);
      const opens = CIRCLE_PROJECTS[c].filter(p => !exams.some(qs => qs[0].p === p));
      check(!opens.length, `C: in 200 exams of circle ${c}, no exam opens with a question of project ${opens.join()}`);
      sameC(`exam(${c}) with the same random generator twice`, m.exam(c, seeded(5)), m.exam(c, seeded(5)));   // contract: spec «Fitxers», l'atzar entra per rnd
    }
    check(snap(PROJECTS) === fixedBefore, 'C: exam changed PROJECTS (it must copy a question before adding p)');
  });

  sectionC('examIn', () => {
    // contract: spec «L'examen» and «XP»: 5 of 6 pass it, 50 XP once, a passed exam is never lost, a closed circle passes nothing; redo names the projects of the missed questions
    const runs = Array.from({ length: 64 }, (_, k) => Array.from({ length: 6 }, (_, i) => !!(k >> i & 1)));
    const cases = [];
    for (let c = 0; c < 3; c++) { const qs = m.exam(c, seeded(300 + c)); runs.forEach(run => cases.push({ c, qs, run })); }
    propertyC('examIn on the 64 runs of six, in each circle, with its exam open', cases, ({ c, qs, run }) => {
      const p = examBase(c), before = snap(p), out = m.examIn(p, c, qs, run);
      const score = run.filter(Boolean).length, good = score >= 5;   // contract: spec «L'examen», se supera amb 5 de 6
      if (snap(p) !== before) return 'examIn changed its progress';
      if (!out || snap(Object.keys(out).sort()) !== snap(['gain', 'good', 'news', 'prog', 'redo', 'score'])) return `the keys are ${out && Object.keys(out).sort()}, expected gain, good, news, prog, redo, score`;
      if (out.score !== score) return `score is ${out.score}, expected ${score}`;
      if (out.good !== good) return `good is ${out.good}, expected ${good}`;
      if (out.gain !== (good ? 50 : 0)) return `gain is ${out.gain}, expected ${good ? 50 : 0}`;   // contract: spec «XP», examen 50, un cop
      const want = { ...p, exams: p.exams.map((e, j) => j === c ? good : e) };
      if (snap(out.prog) !== snap(want)) return `prog is ${snap(out.prog)}, expected ${snap(want)}`;
      const redo = asSet(out.redo), missed = [...new Set(qs.filter((_, i) => !run[i]).map(q => q.p))].sort((a, b) => a - b);
      if (!redo || snap(redo) !== snap(missed)) return `redo is ${show(out.redo)}, expected the projects ${show(missed)} once each`;
      // contract: spec «XP, nivell i insígnies»: the badge of the three exams is news when this one is the third
      const news = good && c === 2 ? [BADGES[4].name] : [];
      return snap(out.news) === snap(news) ? '' : `news is ${show(out.news)}, expected ${show(news)}`;
    });
    // hand written: the second circle with 4 of 6 changes nothing; 5 of 6 and 6 of 6 give 50
    const qs1 = m.exam(1, seeded(11)), p1 = examBase(1);
    const four = m.examIn(p1, 1, qs1, [true, false, true, true, false, true]);
    check(four.good === false && four.score === 4 && four.gain === 0 && snap(four.prog) === snap(p1), `C: examIn with 4 of 6: good ${four.good}, score ${four.score}, gain ${four.gain}, prog ${snap(four.prog)}; expected false, 4, 0 and the same progress`);   // contract: plan Task 5, amb 4 no canvia res
    const five = m.examIn(p1, 1, qs1, [true, true, true, false, true, true]);
    check(five.good === true && five.score === 5 && five.gain === 50 && five.prog.exams.join() === 'true,true,false', `C: examIn with 5 of 6: good ${five.good}, score ${five.score}, gain ${five.gain}, exams ${five.prog.exams}; expected true, 5, 50 and true,true,false`);   // contract: plan Task 5, amb 5 o 6 encerts posa exams[c] a cert i dona 50 XP
    const six = m.examIn(p1, 1, qs1, Array(6).fill(true));
    check(six.score === 6 && six.gain === 50 && six.good === true && six.prog.exams[1] === true, `C: examIn with 6 of 6: score ${six.score}, gain ${six.gain}, exams ${six.prog.exams}; expected 6, 50 and exams[1] true`);
    // the third exam completes the three: news carries the badge, once
    const third = m.examIn(examBase(2), 2, m.exam(2, seeded(12)), Array(6).fill(true));
    sameC('examIn that passes the third exam: news', third.news, [BADGES[4].name]);   // contract: spec «XP, nivell i insígnies», els tres exàmens
    // a passed exam is not lost and gives nothing a second time, whatever the new run
    for (let c = 0; c < 3; c++) {
      const had = examBase(c, { exams: [0, 1, 2].map(j => j <= c) }), qs = m.exam(c, seeded(20 + c));
      [Array(6).fill(false), [false, false, false, false, true, true], Array(6).fill(true)].forEach(run => {
        const out = m.examIn(had, c, qs, run);
        check(out.prog.exams[c] === true && snap(out.prog) === snap(had) && out.gain === 0 && snap(out.news) === '[]', `C: examIn of the exam ${c} that was passed, with ${run.filter(Boolean).length} right: exams ${out.prog.exams}, gain ${out.gain}, news ${snap(out.news)}; expected it still passed, gain 0, no news and the same progress`);   // contract: spec «L'examen», un examen superat no es perd mai
      });
    }
    // a closed circle passes nothing, even with all the marks at 80
    [[0, examBase(0, { piscina: false })], [1, examBase(1, { exams: [false, false, false] })], [2, examBase(2, { exams: [true, false, false] })]].forEach(([c, closed]) => {
      const out = m.examIn(closed, c, m.exam(c, seeded(30 + c)), Array(6).fill(true));
      check(out.good === false && out.gain === 0 && out.prog.exams[c] === false && snap(out.prog) === snap(closed), `C: examIn with circle ${c} closed and 6 of 6: good ${out.good}, gain ${out.gain}, exams ${out.prog.exams}; expected false, 0 and exams[${c}] false`);   // contract: plan Task 5, amb el cercle tancat no es dona per superat
    });
    // contract: spec «El mapa» (l'examen s'obre quan tots els projectes del cercle tenen 80 o més) and the Cursus: with the circle open but one project at 79, six right pass nothing
    for (let c = 0; c < 3; c++) for (const short of CIRCLE_PROJECTS[c]) {
      const notes = examBase(c).notes.map((n, i) => i === short ? 79 : n), open = examBase(c, { notes });
      const out = m.examIn(open, c, m.exam(c, seeded(50 + c)), Array(6).fill(true));
      check(out.good === false && out.gain === 0 && out.prog.exams[c] === false && snap(out.prog) === snap(open), `C: examIn of circle ${c}, open, with project ${short} at 79 and 6 of 6: good ${out.good}, gain ${out.gain}, exams ${out.prog.exams}; expected false, 0 and the progress as it was`);
    }
    // nothing is shared with the progress that was given
    const p = examBase(0, { secs: [10, 3, 0, 0, 0, 0], fulls: 2, so: false }), before = snap(p), q0 = m.exam(0, seeded(40));
    const out = m.examIn(p, 0, q0, Array(6).fill(true));
    check(!sharing(p, out), 'C: examIn returns a progress that shares an object or a list with the one it was given');
    out.prog.notes[0] = 1; out.prog.exams[1] = true; out.prog.secs[0] = 0;
    check(snap(p) === before, 'C: a change in the progress that examIn returns changed the one it was given');
    sameC('examIn carries the rest of the progress over', (({ so, secs, piscina, notes, fulls }) => ({ so, secs, piscina, notes, fulls }))(m.examIn(p, 0, q0, Array(6).fill(true)).prog), { so: false, secs: [10, 3, 0, 0, 0, 0], piscina: true, notes: p.notes, fulls: 2 });
  });

  sectionC('the sheet', () => {
    // contract: spec «Caça l'errada» and «Com es comprova»: three boards, from 0 to 2 bad, each bad one of the three kinds, a good one shows its number and a bad one does not
    const rnd = seeded(20261200), sheets = Array.from({ length: 200 }, () => m.sheet(rnd));
    propertyC('sheet: three tidy boards of three columns, from 0 to 2 bad, each one reads as its kind says', sheets, s => {
      if (!Array.isArray(s) || s.length !== 3) return `${Array.isArray(s) ? s.length : 'not a list'} boards, expected 3`;   // contract: spec «Caça l'errada», tres àbacs
      for (const [i, b] of s.entries()) { const why = boardProblem(b); if (why) return `board ${i}: ${why}`; }
      const bads = s.filter(b => b.bad !== null).length;
      if (new Set(s.map(b => b.says)).size !== 3) return `the numbers ${s.map(b => b.says)} are not three different ones`;   // contract: plan Task 5 (fix round 1), els tres números són diferents
      if (bads > 2) return `${bads} bad boards, expected 0 to 2`;   // contract: spec «Caça l'errada», de cap a dos estan malament
      const objs = new Set(s.flatMap(b => [b.rods, ...b.rods]));
      return objs.size === 12 ? '' : 'two boards share a list or a column';
    });
    const kinds = new Set(sheets.flatMap(s => s.map(b => b.bad)).filter(Boolean));
    check(KINDS.every(k => kinds.has(k)), `C: in 200 sheets the kinds that come out are ${show([...kinds])}, expected veïna, dalt and girat`);   // contract: plan Task 5, en 200 fulls surten els tres tipus
    const counts = [0, 1, 2].map(n => sheets.filter(s => s.filter(b => b.bad !== null).length === n).length);
    check(counts.every(x => x > 0), `C: in 200 sheets, the number with 0, 1 and 2 bad boards is ${counts.join(', ')}; none may be 0`);   // contract: plan Task 5, fulls amb 0, 1 i 2 dolents
    // contract: plan Task 5 (fix round 1): floors over the 200 seeded sheets, well under what a fair generator gives (about 80 boards per kind, 40/80/80 sheets by bad count,
    // 80 bad boards per place, 300 boards of each size of says), so that a generator that leans or drops cases is seen
    const boards = sheets.flat(), bad = boards.filter(b => b.bad !== null);
    KINDS.forEach(k => check(bad.filter(b => b.bad === k).length >= 30, `C: in 200 sheets only ${bad.filter(b => b.bad === k).length} boards are ${k}, at least 30 expected`));
    counts.forEach((n, i) => check(n >= 15, `C: in 200 sheets only ${n} have ${i} bad boards, at least 15 expected`));
    [0, 1, 2].forEach(i => { const n = sheets.filter(s => s[i].bad !== null).length; check(n >= 30, `C: in 200 sheets the board in place ${i} is bad only ${n} times, at least 30 expected`); });
    const small = boards.filter(b => b.says < 100).length;
    check(small >= 100 && boards.length - small >= 100, `C: in 200 sheets ${small} boards say less than 100 and ${boards.length - small} say 100 or more, at least 100 of each expected`);
    const veinas = bad.filter(b => b.bad === 'veïna');
    const gaps = new Set(veinas.map(b => readRods(b.rods) - b.says)), uppers = veinas.filter(b => fixDecks(b.rods, b.says).includes('hi')).length;
    check(gaps.size >= 3, `C: the veïna boards of 200 sheets differ from says in only ${gaps.size} ways (${show([...gaps])}), at least 3 expected`);
    check(uppers >= 1, 'C: no veïna board of 200 sheets is fixed by moving an upper bead');
    // a random generator that never varies, or sits on its edges, still gives a good sheet with three different numbers
    [() => 0, () => 0.5, () => 0.999999].forEach((r, i) => {
      const s = m.sheet(r), why = Array.isArray(s) && s.length === 3 ? s.map((b, j) => boardProblem(b) && `board ${j}: ${boardProblem(b)}`).find(Boolean) || (new Set(s.map(b => b.says)).size === 3 ? '' : `the numbers ${s.map(b => b.says)} are not three different ones`) : 'not three boards';
      check(!why, `C: sheet with a random generator that always gives ${[0, 0.5, 0.999999][i]}: ${why}`);
    });
    const different = new Set(sheets.map(snap)).size;
    check(different > 100, `C: 200 sheets are only ${different} different ones`);
    sameC('sheet with the same random generator twice', m.sheet(seeded(5)), m.sheet(seeded(5)));   // contract: spec «Fitxers», l'atzar entra per rnd
  });

  sectionC('sheetIn', () => {
    // contract: spec «Caça l'errada» and «XP»: a sheet with the three right adds 1 to fulls; 10 XP each up to 3 sheets per validated project (from 80), then 0
    const notesOf = k => Array.from({ length: 9 }, (_, i) => i < k ? 80 + i : 79);   // k projects validated; the others at 79, which is not
    const hand = [[0, 0, 0], [1, 0, 10], [1, 2, 10], [1, 3, 0], [1, 5, 0], [2, 5, 10], [2, 6, 0], [9, 26, 10], [9, 27, 0]];   // contract: spec «XP», [validated projects, fulls before, XP of this sheet]
    hand.forEach(([k, fulls, gain]) => {
      const p = base({ notes: notesOf(k), fulls }), out = m.sheetIn(p, [true, true, true]);
      check(out.gain === gain && out.prog.fulls === fulls + 1 && out.good === true, `C: sheetIn with 3 right, ${k} projects validated and ${fulls} fulls: gain ${out.gain}, fulls ${out.prog.fulls}, good ${out.good}; expected ${gain}, ${fulls + 1}, true`);
    });
    const sweep = [];
    for (let k = 0; k <= 9; k++) for (let fulls = 0; fulls <= 30; fulls++) sweep.push({ k, fulls });
    propertyC('sheetIn with three right, for 0 to 9 validated projects and 0 to 30 fulls', sweep, ({ k, fulls }) => {
      const p = base({ so: false, piscina: true, notes: notesOf(k), exams: [true, false, true], fulls }), before = snap(p), out = m.sheetIn(p, [true, true, true]);
      if (snap(p) !== before) return 'sheetIn changed its progress';
      if (!out || snap(Object.keys(out).sort()) !== snap(['gain', 'good', 'missed', 'news', 'prog'])) return `the keys are ${out && Object.keys(out).sort()}, expected gain, good, missed, news, prog`;
      const gain = fulls < 3 * k ? 10 : 0;   // contract: spec «XP», fins a 3 fulls per projecte validat
      if (out.good !== true || out.gain !== gain) return `good ${out.good}, gain ${out.gain}, expected true and ${gain}`;
      if (snap(out.prog) !== snap({ ...p, fulls: fulls + 1 })) return `prog is ${snap(out.prog)}, expected only fulls to grow to ${fulls + 1}`;
      if (snap(out.missed) !== '[]') return `missed is ${show(out.missed)}, expected []`;
      const news = [fulls === 0 ? BADGES[1].name : null, fulls === 9 ? BADGES[3].name : null].filter(Boolean);   // contract: spec «XP, nivell i insígnies», un full perfecte i deu fulls perfectes
      return snap(out.news) === snap(news) ? '' : `news is ${show(out.news)}, expected ${show(news)}`;
    });
    // anything else adds nothing, and missed says which boards were not right
    const wrong = [[false, true, true], [true, false, true], [true, true, false], [false, false, true], [false, true, false], [true, false, false], [false, false, false]];
    wrong.forEach(run => {
      const p = base({ notes: notesOf(3), fulls: 4 }), out = m.sheetIn(p, run), want = run.flatMap((r, i) => r ? [] : [i]);
      check(out.good === false && out.gain === 0 && snap(out.prog) === snap(p) && snap(out.missed) === snap(want) && snap(out.news) === '[]', `C: sheetIn with ${snap(run)}: good ${out.good}, gain ${out.gain}, fulls ${out.prog.fulls}, missed ${snap(out.missed)}, news ${snap(out.news)}; expected false, 0, 4, ${snap(want)} and no news`);   // contract: plan Task 5, amb qualsevol altra cosa no suma i missed diu quins
    });
    [[true, true, 1], [true, true, 'true'], [true, true, null], [true, true], []].forEach(run => {
      const p = base({ notes: notesOf(3), fulls: 4 }), out = m.sheetIn(p, run);
      check(out.good === false && out.gain === 0 && out.prog.fulls === 4, `C: sheetIn with ${snap(run)}, which is not three booleans all true: good ${out.good}, gain ${out.gain}, fulls ${out.prog.fulls}; expected false, 0, 4`);   // contract: plan Task 5, amb qualsevol altra cosa no suma
    });
    // nothing is shared with the progress that was given
    const p = base({ so: false, secs: [10, 3, 0, 0, 0, 0], piscina: true, notes: notesOf(2), exams: [true, false, false], fulls: 1 }), before = snap(p);
    const out = m.sheetIn(p, [true, true, true]);
    check(!sharing(p, out), 'C: sheetIn returns a progress that shares an object or a list with the one it was given');
    out.prog.notes[0] = 1; out.prog.exams[1] = true; out.prog.secs[0] = 0;
    check(snap(p) === before, 'C: a change in the progress that sheetIn returns changed the one it was given');
  });
}

// ---- D. the card of the home page, and the unit of --u in board.js
// what the home page asks of the card: record(load('abac-xines') || {}, total), once per visit. The save is read here by hand, never through clean.
const sectionD = (name, fn) => { try { fn(); } catch (e) { check(false, `D: ${name} stopped on ${e.message}`); } };
function partD() {
  sectionD('the card', () => {
    const card = hub && hub.GAMES.find(g => g.id === 'abac-xines');
    if (!card) { check(false, "D: there is no card 'abac-xines' in shared/games.js (or the file cannot be loaded)"); return; }
    check(card.total === 9, `D: the card total is ${card.total}, expected 9`);   // contract: spec «Fitxers», shared/games.js: total 9
    for (const word of ['sumar', 'restar', 'multiplicar', 'repartir']) check(String(card.what).includes(word), `D: the text of the card (${card.what}) does not say «${word}»`);   // contract: spec «Fitxers», el text diu també «repartir»
    check(!/company|segon/i.test(card.what + ' ' + card.title), 'D: the text of the card talks about a companion or a second player');   // contract: spec «Global Constraints», el nen juga sol
    const same = (saved, want) => {
      let got; try { got = card.record(saved, 9); } catch (e) { got = `throws ${e.message}`; }
      check(got === want, `D: record(${show(saved)}, 9) is ${show(got)}, expected ${show(want)}`);
    };
    same({}, '0 de 9 projectes');                                                               // contract: plan Task 7, valors esperats
    same({ secs: [10, 10, 4, 0, 0, 0] }, '4 de 9 projectes');                                   // contract: plan Task 7, i spec «El que es desa» (seccions 0 i 1 donen els projectes 0 a 3)
    same({ secs: [10, 10, 10, 10, 10, 10] }, '9 de 9 projectes');                               // contract: spec «El que es desa», seccions per projecte [0,0,1,1,2,3,4,5,5]: sis seccions fetes les validen tots
    same({ secs: [9, 9, 9, 9, 9, 9] }, '0 de 9 projectes');                                     // contract: spec «El que es desa», amb 9 nivells la secció no està feta
    same({ notes: [100, 80, 79, 0, 0, 0, 0, 0, 0] }, '2 de 9 projectes');                       // contract: spec «Un projecte», amb 80 o més el projecte queda validat
    same({ notes: [100, 80, 79, 0, 0, 0, 0, 0, 0], secs: [10, 0, 0, 0, 0, 0] }, '2 de 9 projectes');   // contract: spec «El que es desa», la secció 0 dona 80 als projectes 0 i 1 i no baixa el 100
    same({ notes: [0, 0, 0, 0, 0, 0, 0, 0, 80, 100, 100] }, '1 de 9 projectes');                // contract: spec «El que es desa», només hi ha nou projectes
    // garbage: text back and no throw (one card that throws breaks the whole home page)
    for (const saved of [{ notes: 'a' }, null, undefined, 'a', 7, [], [1, 2], { secs: 'a' }, { secs: [NaN, null, {}, 'x', -4, 99] }, { notes: [NaN, null, {}, 'x', -4, 1e9] }, { notes: { 0: 100 } }]) {
      let got; try { got = card.record(saved, 9); } catch (e) { got = `throws ${e.message}`; }
      check(typeof got === 'string' && !got.startsWith('throws'), `D: record(${show(saved)}, 9) is ${show(got)}, expected a text and no throw`);   // contract: spec «Riscos» 2, record no pot petar
    }
  });
  sectionD('--u in board.js', () => {
    if (boardText === null) { check(false, `D: board.js cannot be read: ${boardError}`); return; }
    const calls = uCalls(boardText);
    check(calls.length > 0, "D: board.js never sets --u (no setProperty('--u', …))");
    for (const arg of calls) {
      const px = /px['"`]\)*\s*$/.test(arg);
      const restores = /^[A-Za-z_$][\w$]*$/.test(arg) && new RegExp(`\\b${arg.replace(/\$/g, '\\$')}\\s*=\\s*[\\w.$]*getPropertyValue\\(\\s*['"]--u['"]\\s*\\)`).test(boardText);
      check(px || restores, `D: board.js sets --u to ${arg}, which does not end in px (a bare number makes every calc() with var(--u) invalid and the board collapses)`);   // contract: defect found in the browser, 2026-10-06: --u was set without its unit
    }
  });
}
// the second argument of every setProperty('--u', …) in a text, as written, however the call is split over lines: read up to the closing parenthesis of the call
function uCalls(text) {
  const out = [], head = /setProperty\(\s*(['"`])--u\1\s*,/g;
  for (let m; (m = head.exec(text));) {
    let depth = 0, q = '', i = head.lastIndex;
    const from = i;
    for (; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
      if (c === "'" || c === '"' || c === '`') q = c;
      else if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') { if (!depth) break; depth--; }
    }
    out.push(text.slice(from, i).trim());
  }
  return out;
}

// ---- the logic under check
const target = process.argv[2] ? pathToFileURL(resolve(process.argv[2])) : new URL('../games/abac-xines/logic.js', import.meta.url);
let mod = null;
try { mod = await import(target); } catch (e) { check(false, `the logic cannot be loaded: ${e.message}`); }
if (mod) for (const part of [partA, partB, partC]) {
  try { part(mod); } catch (e) { check(false, `${part.name} stopped on ${e.message}`); }
}
// part D does not need the logic under check: the card is the real one, and board.js is read as text (argv[3] names another file, to try the pin itself)
let hub = null, boardText = null, boardError = '';
try { hub = await import('../shared/games.js'); } catch (e) { check(false, `D: shared/games.js cannot be loaded: ${e.message}`); }
try { boardText = readFileSync(process.argv[3] ? resolve(process.argv[3]) : new URL('../games/abac-xines/board.js', import.meta.url), 'utf8'); } catch (e) { boardError = e.message; }
try { partD(); } catch (e) { check(false, `partD stopped on ${e.message}`); }

// ---- footer
if (fails) { console.error(`${fails} failures`); process.exit(1); }
console.log(`abac-xines: ${counted} preguntes`);
