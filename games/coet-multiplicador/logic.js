import { curs, whole, within, slots, at, int, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// Nine projects of ten levels. A level is one multiplication, a × b, and the way it is worked:
//   'zeros'   one piece: the product without its zeros, then with them
//   'pieces'  the rectangle cut by digits: one product per piece, then the pieces added in a column
//   'lines'   the Japanese way: a group of lines per digit, the points of each band counted, and each band gives a digit of the result
//   'guided'  the school algorithm, typing the last digit of each small product; the game carries the rest, and the last product of a row is typed whole
//   'free'    the school algorithm, one written digit at a time
const lv = (mode, list) => list.map(([a, b]) => ({ a, b, mode }));
export const PROJECTS = [
  { name: 'Zeros màgics', sub: 'Multiplicar per desenes i centenes',
    levels: lv('zeros', [[3, 20], [4, 30], [6, 40], [7, 200], [5, 300], [20, 30], [40, 60], [30, 200], [50, 400], [70, 800]]) },
  { name: 'Trossejar', sub: 'Un número gran, tros a tros',
    levels: lv('pieces', [[23, 3], [42, 4], [56, 7], [123, 3], [214, 6], [342, 5], [406, 7], [538, 6], [764, 8], [987, 9]]) },
  { name: 'Ratlles japoneses', sub: 'Una altra manera: ratlles, punts i xifres',
    levels: lv('lines', [[12, 3], [23, 2], [31, 3], [12, 13], [21, 14], [31, 12], [23, 13], [22, 14], [24, 13], [14, 23]]) },
  { name: 'Ratlles i portades', sub: "Franges de més de 9 punts: escric i me'n porto",
    levels: lv('lines', [[23, 24], [32, 23], [34, 22], [20, 13], [213, 3], [103, 12], [123, 12], [213, 21], [132, 23], [234, 32]]) },
  { name: 'En columna', sub: "Escric una xifra i me'n porto una altra",
    levels: [...lv('guided', [[32, 3], [27, 3], [48, 6], [123, 3], [236, 4], [458, 7]]), ...lv('free', [[324, 6], [507, 8], [689, 7], [978, 9]])] },
  { name: 'Dues files', sub: "Per què hi ha dues files i d'on surt el zero",
    levels: [...lv('pieces', [[12, 13], [23, 14], [34, 25], [46, 37]]), ...lv('guided', [[21, 32], [34, 56], [47, 63], [78, 45]]), ...lv('free', [[56, 34], [89, 76]])] },
  { name: '3 × 2 amb ajuda', sub: 'Tres xifres per dues, pas a pas',
    levels: lv('guided', [[123, 12], [213, 24], [324, 35], [245, 46], [406, 53], [538, 27], [672, 48], [759, 64], [806, 79], [947, 86]]) },
  { name: 'Missió final', sub: 'Tres xifres per dues, sense ajuda',
    levels: lv('free', [[132, 23], [254, 36], [318, 47], [467, 52], [583, 64], [609, 78], [745, 39], [826, 95], [968, 87], [999, 99]]) },
  { name: 'Tres files', sub: 'Tres xifres per tres xifres: la galàxia llunyana',
    levels: [...lv('guided', [[121, 113], [213, 124], [324, 235], [406, 352]]), ...lv('free', [[132, 213], [254, 326], [467, 538], [609, 745], [826, 917], [999, 999]])] }
];
export const PLACES = ['unitats', 'desenes', 'centenes', 'milers', 'desenes de miler'];
export const digitsOf = n => [...String(n)].reverse().map(Number);   // units first
export const zerosOf = n => String(n).length - String(n).replace(/0+$/, '').length;
// one piece per pair of digits that are not zero, in the order they are asked: the strip of the units first, each strip from the left
export function pieces(a, b) {
  const out = [];
  digitsOf(b).forEach((d, bi) => digitsOf(a).forEach((x, ai) => { if (x && d) out.push({ ai, bi, x, d, av: x * 10 ** ai, bv: d * 10 ** bi, val: x * d * 10 ** (ai + bi) }); }));
  return out.sort((p, q) => p.bi - q.bi || q.ai - p.ai);
}
// the Japanese way: the crossings of every digit of a with every digit of b fall in bands, one per place. The points of each band, units first
export function bands(a, b) {
  const A = digitsOf(a), B = digitsOf(b), T = Array(A.length + B.length - 1).fill(0);
  A.forEach((x, ai) => B.forEach((d, bi) => { T[ai + bi] += x * d; }));
  return T;
}
// adding numbers in a column: one step per digit of the total, from the right
function sumSteps(vals) {
  const total = vals.reduce((s, v) => s + v, 0), out = [];
  let carry = 0;
  for (let col = 0; col < String(total).length; col++) {
    const adds = vals.filter(v => v >= 10 ** col).map(v => Math.floor(v / 10 ** col) % 10), v = adds.reduce((s, n) => s + n, 0) + carry;
    out.push({ kind: 'digit', part: 'sum', row: 'sum', col, want: v % 10, adds, carry, v, out: Math.floor(v / 10) });
    carry = Math.floor(v / 10);
  }
  return out;
}
// The steps of a level, in order. kind 'val' wants a whole number typed and confirmed, kind 'digit' wants one key.
// row and col say where the result is written (col 0 is the units); out is what is carried to the next column.
export function plan({ a, b, mode }) {
  const A = digitsOf(a), B = digitsOf(b), steps = [];
  if (mode === 'zeros') {
    const z = zerosOf(a) + zerosOf(b), core = a * b / 10 ** z;
    return [{ kind: 'val', part: 'core', want: core, z }, { kind: 'val', part: 'full', want: a * b, z, core }];
  }
  if (mode === 'pieces') {
    const ps = pieces(a, b);
    ps.forEach((p, i) => steps.push({ kind: 'val', part: 'piece', row: 'p' + i, want: p.val, ...p }));
    return steps.concat(sumSteps(ps.map(p => p.val)));
  }
  if (mode === 'lines') {
    // band by band from the units: its points are counted (cross are its crossings, tot its points), and what the band before
    // carried is added (part 'plus'). A band holds one digit, put: the rest, out, is carried to the next, and the last band is written whole
    const ps = pieces(a, b), T = bands(a, b);
    let carry = 0;
    T.forEach((tot, p) => {
      const v = tot + carry, last = p === T.length - 1, base = { p, tot, carry, v, last, put: last ? v : v % 10, out: last ? 0 : Math.floor(v / 10) };
      steps.push({ kind: 'val', part: 'band', want: tot, cross: ps.filter(c => c.ai + c.bi === p), ...base });
      if (carry) steps.push({ kind: 'val', part: 'plus', want: v, ...base });
      carry = base.out;
    });
    return steps;
  }
  B.forEach((d, bi) => {
    let carry = 0;
    for (let col = 0; col < bi; col++) steps.push({ kind: 'digit', part: 'zero', row: 'r' + bi, col, want: 0, d, bi });
    A.forEach((x, ai) => {
      const v = x * d + carry, last = ai === A.length - 1, base = { row: 'r' + bi, col: ai + bi, x, d, ai, bi, carry, v, last, out: last ? 0 : Math.floor(v / 10) };
      if (mode === 'guided') steps.push({ kind: 'val', part: 'prod', want: last ? v : v % 10, ...base });
      else {
        steps.push({ kind: 'digit', part: 'mul', want: v % 10, ...base });
        if (last && v > 9) steps.push({ kind: 'digit', part: 'top', want: Math.floor(v / 10), ...base, col: ai + bi + 1 });
      }
      carry = Math.floor(v / 10);
    });
  });
  if (B.length > 1) steps.push(...sumSteps(B.map((d, bi) => a * d * 10 ** bi)));
  return steps;
}

/* ---------- quick questions: the Piscina, the exams and the lightning round ---------- */
// Each is answered in one go. kind says what is asked:
//   'calc'   a × b, typed
//   'miss'   a × b cut in its two pieces with one of them missing (tens says which), typed
//   'lines'  the drawing of a × b in lines with its numbers: the product, typed
//   'which'  the drawing alone: the multiplication it shows, chosen among opts
//   'hole'   a × b done in column with one digit missing (hole is its step of the free plan), typed
// Chance enters only through rnd (a function like Math.random).
const times = (a, b) => `${a} × ${b}`;
export const wantQ = q => q.kind === 'which' ? times(q.a, q.b) : q.kind === 'miss' ? (q.tens ? q.a - q.a % 10 : q.a % 10) * q.b
  : q.kind === 'hole' ? plan({ a: q.a, b: q.b, mode: 'free' })[q.hole].want : q.a * q.b;
const hole = (rnd, a, b) => ({ kind: 'hole', a, b, hole: at(plan({ a, b, mode: 'free' }).length, rnd) });
// a number of n digits, none of them zero, each from lo to hi
const num = (rnd, n, lo, hi) => Array.from({ length: n }, () => int(rnd, lo, hi)).reduce((s, d) => s * 10 + d, 0);
function which(rnd, a, b) {
  const rev = +[...String(a)].reverse().join(''), other = rev === a ? a + 10 : rev;
  return { kind: 'which', a, b, opts: shuffle([times(a, b), times(other, b), times(a, b + 1)], rnd) };
}
// one question of each project
const GEN = [
  rnd => { const z = int(rnd, 1, 3), za = int(rnd, 0, z); return { kind: 'calc', a: int(rnd, 2, 9) * 10 ** za, b: int(rnd, 2, 9) * 10 ** (z - za) }; },
  rnd => ({ kind: 'miss', a: num(rnd, 2, 2, 9), b: int(rnd, 2, 9), tens: rnd() < 0.5 }),
  (rnd, i) => { for (;;) { const a = num(rnd, 2, 1, 3), b = [2, 3, 11, 12, 13, 21][at(6, rnd)]; if (bands(a, b).every(t => t < 10)) return i % 2 ? which(rnd, a, b) : { kind: 'lines', a, b }; } },
  (rnd, i) => { if (i % 2) return which(rnd, num(rnd, 3, 1, 3), num(rnd, 2, 1, 3)); for (;;) { const a = num(rnd, 2, 1, 4), b = num(rnd, 2, 1, 4); if (bands(a, b).some(t => t > 9)) return { kind: 'lines', a, b }; } },
  rnd => hole(rnd, int(rnd, 23, 989), int(rnd, 2, 9)),
  rnd => hole(rnd, int(rnd, 12, 98), num(rnd, 2, 2, 9)),
  rnd => hole(rnd, int(rnd, 102, 987), num(rnd, 2, 2, 9)),
  rnd => hole(rnd, int(rnd, 102, 987), num(rnd, 2, 2, 9)),
  rnd => hole(rnd, int(rnd, 102, 987), num(rnd, 3, 1, 9))
];
// a question of project p that has not come up yet
function draw(p, rnd, i, seen) {
  for (let n = 0; ; n++) { const q = GEN[p](rnd, i), key = JSON.stringify(q); if (n > 200 || !seen.has(key)) { seen.add(key); return { ...q, p }; } }
}

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the other games of the pond: a Piscina to get in, a map of four circles,
// a mark for each project, an exam for each circle, XP and badges. The lines come last, as an extra for whoever already masters
// the school algorithm. They used to be the second circle: x is the place of the exam of each circle in what is saved, which keeps that order
export const CIRCLES = [
  { name: 'Rampa de llançament', projects: [0, 1], x: 0 },
  { name: 'En òrbita', projects: [4, 5], x: 2 },
  { name: 'Espai profund', projects: [6, 7, 8], x: 3 },
  { name: "Extra: l'art de les ratlles", projects: [2, 3], x: 1, sub: 'Una altra manera de multiplicar, per a qui ja domina la columna.' }
];
export const LINES = [2, 3];   // the projects in lines
export const passed = (p, c) => p.exams[CIRCLES[c].x] === true;
// the progress of the cursus, the same in every game (shared/curs.js): the stars of each level are kept in lv
const cursus = curs({ PROJECTS, CIRCLES, field: 'lv', slot: c => CIRCLES[c].x, badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, streakIn, rapidIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf };
// the three questions of the Piscina, the first challenges
export const POOL = [{ kind: 'calc', a: 6, b: 7 }, { kind: 'calc', a: 4, b: 20 }, { kind: 'miss', a: 13, b: 3, tens: false }];
// the seconds of a lightning round
export const RAPID = 60;

// What is saved is facts only: { so, lv[90], piscina, exams[4], fulls, rapid, ratxa }. lv is the best stars of each level (by project), exams the
// exam of each circle at its place x, rapid the
// most right answers in a lightning round and ratxa the longest run of right answers. Marks, XP, level and badges are worked out, never stored.
// Before the cursus the game had six sections of ten levels, with their stars in `stars` and the levels done of each in `secs`:
// each section is now the project at this place
const OLD = [0, 1, 4, 5, 6, 7];
// A complete progress inside its limits from any value at all; a new object. It only ever raises: whoever played before the cursus
// keeps the stars of those levels and has the Piscina done
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {}, lv = slots(o.lv, PROJECTS.length * 10).map(s => within(s, 3));
  const stars = slots(o.stars, 60), secs = slots(o.secs, 6);
  OLD.forEach((p, s) => { for (let i = 0; i < 10; i++) lv[p * 10 + i] = Math.max(lv[p * 10 + i], within(stars[s * 10 + i], 3), i < within(secs[s], 10) ? 1 : 0); });
  return { so: o.so !== false, lv, piscina: o.piscina === true || lv.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), rapid: Math.max(0, whole(o.rapid)), ratxa: Math.max(0, whole(o.ratxa)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer enlairament', what: 'Valida un projecte.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 20', what: 'Encerta 20 passos seguits a la primera.' },
  { name: 'Mestre de les ratlles', what: 'Valida els dos projectes de ratlles japoneses.' },
  { name: 'Ull de falcó', what: "Troba bé les errades d'un full." },
  { name: 'Deu fulls', what: "Corregeix bé deu fulls d'errades." },
  { name: 'Llampec', what: 'Encerta 15 multiplicacions en un repte llampec.' },
  { name: 'Cursus complet', what: 'Supera els quatre exàmens.' }
];
export const badges = p => [p.piscina === true, validated(p).length > 0, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 20,
  LINES.every(i => noteOf(p, i) >= VALID), p.fulls >= 1, p.fulls >= 10, p.rapid >= 15, p.exams.every(e => e === true)];

/* ---------- the exam, the lightning round and «Caça l'errada» ---------- */
// Six different questions of the projects of circle c, new every time, at least one of each project, in a random order; each has p,
// its project. A circle that does not exist gives the first
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, seen = new Set(), list = [];
  while (list.length < 6) list.push(draw(list.length < ps.length ? ps[list.length] : ps[at(ps.length, rnd)], rnd, list.length, seen));
  return shuffle(list, rnd);
}
// The n questions of a lightning round: the tables from 2 to 9, and one in three with zeros once «Zeros màgics» is validated; never the same twice in a row
export function sprint(p, rnd, n = 60) {
  const zeros = noteOf(p, 0) >= VALID, out = [];
  while (out.length < n) {
    const q = zeros && rnd() < 0.34 ? GEN[0](rnd) : { kind: 'calc', a: int(rnd, 2, 9), b: int(rnd, 2, 9) }, was = out[out.length - 1];
    if (!was || was.a !== q.a || was.b !== q.b) out.push(q);
  }
  return out;
}

// The five things a sheet can say, each { kind, says, real, opts, ... }: says is the value written on the sheet, real the true one
// (the claim is wrong when they differ) and opts the values to choose from when fixing it, all as text. The mistakes are the ones that teach:
// a zero lost or one too many, the two pieces written side by side instead of added, the digit written taken for the digit carried,
// the row of the tens without its zero, and the lines of a number read backwards.
const texts = a => [...new Set(a)].sort((x, y) => x - y).map(String);
const CLAIM = {
  zeros(bad, rnd) {
    const a = int(rnd, 2, 9) * 10 ** int(rnd, 1, 2), b = int(rnd, 2, 9) * 10 ** int(rnd, 0, 2), real = a * b;
    return { a, b, says: String(bad ? [real / 10, real * 10][at(2, rnd)] : real), real: String(real), opts: texts([real / 10, real, real * 10]) };
  },
  glue(bad, rnd) {
    let t, u, b;
    do { t = int(rnd, 2, 9); u = int(rnd, 2, 9); b = int(rnd, 2, 9); } while (u * b < 10);
    const a = t * 10 + u, real = a * b, glued = +`${t * b}${u * b}`, lost = t * b * 10 + u * b % 10;
    return { a, b, says: String(bad ? [glued, lost][at(2, rnd)] : real), real: String(real), opts: texts([real, glued, lost]) };
  },
  carry(bad, rnd) {
    let x, d, v;
    do { x = int(rnd, 3, 9); d = int(rnd, 3, 9); v = x * d; } while (v < 10 || v % 10 === Math.floor(v / 10));
    const real = Math.floor(v / 10);
    return { x, d, v, says: String(bad ? v % 10 : real), real: String(real), opts: texts([real, v % 10, v]) };
  },
  row(bad, rnd) {
    const a = int(rnd, 12, 49), t = int(rnd, 2, 9), b = t * 10 + int(rnd, 2, 9), real = a * t * 10;
    return { a, b, t, says: String(bad ? a * t : real), real: String(real), opts: texts([a * t, real, real * 10]) };
  },
  lines(bad, rnd) {
    let a;
    do a = num(rnd, 2, 1, 3); while (a % 11 === 0);
    const b = int(rnd, 2, 3), rev = a % 10 * 10 + Math.floor(a / 10), real = times(a, b), wrong = [times(rev, b), times(a, b + 1)];
    return { a, b, says: bad ? wrong[at(2, rnd)] : real, real, opts: shuffle([real, ...wrong], rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place. lines false leaves the lines out
export function sheet(rnd, lines = true) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.filter(k => lines || k !== 'lines'), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
