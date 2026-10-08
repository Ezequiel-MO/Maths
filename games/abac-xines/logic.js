// A Chinese abacus. Each rod has five earth beads under the beam, worth 1 each, and one heaven bead over it, worth 5.
// A bead only counts while it touches the beam. A rod is { lo, hi }: how many earth beads are up and whether the heaven bead is down (1 or 0).
// rods[0] is the units. A rod can hold up to 10: a full rod is exchanged for one earth bead on its left.
export const rodVal = r => r.lo + 5 * r.hi;
export const valueOf = rods => rods.reduce((a, r, p) => a + rodVal(r) * 10 ** p, 0);
// the tidy way to show a number: no rod with five earth beads up
export const tidy = rods => rods.every(r => r.lo < 5);
export const write = (v, n) => Array.from({ length: n }, (_, p) => { const d = Math.floor(v / 10 ** p) % 10; return { lo: d % 5, hi: d >= 5 ? 1 : 0 }; });
// touching a bead moves it together with the ones between it and the beam; j counts the beads of a deck from the beam
export function tap(rods, p, deck, j) { const out = rods.map(r => ({ ...r })); out[p][deck] = j < out[p][deck] ? j : j + 1; return out; }

// q is a number to write or an operation read from left to right ('x' times, ':' divided by; these two only come first).
// The abacus starts on the first number when beads are added to it or taken from it, and empty otherwise.
// stages are the values to pass through on the way to the result: they keep the hints on the method instead of on the answer.
export function plan(q) {
  const t = String(q).split(/([+\-x:])/), a = +t[0], stages = [];
  if (t.length === 1) return { start: 0, stages: [a], goal: a };
  // the digits of v times k, from the highest place down, as running totals
  const parts = (v, k) => [...String(v)].map((d, i, all) => d * 10 ** (all.length - 1 - i) * k).filter(Boolean).map((s => x => s += x)(0));
  let acc = a;
  for (let i = 1; i < t.length; i += 2) {
    const op = t[i], b = +t[i + 1];
    if (op === '+') stages.push(acc += b);
    else if (op === '-') stages.push(acc -= b);
    else if (op === ':') stages.push(...parts(acc /= b, 1));
    else {
      // two digits of the tables, on their own: add the bigger one as many times as the smaller says. Otherwise, one product per digit.
      const big = Math.max(acc, b), small = Math.min(acc, b);
      stages.push(...(big < 10 && t.length === 3 ? Array.from({ length: small }, (_, k) => big * (k + 1)) : parts(big, small)));
      acc *= b;
    }
  }
  return { start: '+-'.includes(t[1]) ? a : 0, stages, goal: acc };
}

// One touch towards target, the way the abacus is worked: from the highest column down, adding or taking what is missing.
// Returns { p, deck, to, why } (set rods[p][deck] to `to`), or null when the abacus shows target in its tidy form. why is
// 'add' or 'take' for a plain move, 'five' and 'ten' for the two exchanges, 'borrow' for taking one from a higher column,
// 'more' or 'less' for the trick with the heaven bead: adding d as 5 - (5 - d), or taking it the same way, and 'carry' for
// adding d where it does not fit, as 10 - (10 - d). The tricks start with the earth beads, so the column never goes past
// what it needs and the next hint finds the 5 or the 10 still to be moved.
export function nextMove(rods, target) {
  const diff = target - valueOf(rods), n = rods.length;
  if (!diff) {
    const p = rods.findIndex(r => r.lo === 5);
    if (p < 0) return null;
    // a full column becomes one earth bead on the left: the heaven bead goes first, and the five earth beads follow below
    return rods[p].hi ? { p, deck: 'hi', to: 0, why: 'ten' } : { p, deck: 'lo', to: 0, why: 'five' };
  }
  const abs = Math.abs(diff), p = Math.min(String(abs).length - 1, n - 1), d = Math.min(10, Math.floor(abs / 10 ** p)), r = rods[p];
  if (diff > 0) {
    const v = rodVal(r), k = 10 - d;
    if (v + d < 10 || (v + d === 10 && r.lo < 5)) {
      if (d >= 5 && !r.hi) return { p, deck: 'hi', to: 1, why: 'add' };
      // the fifth earth bead only goes up to complete a five or to fill the column
      if (r.lo + d <= 5) return { p, deck: 'lo', to: r.lo + d, why: 'add' };
      return { p, deck: 'lo', to: r.lo + d - 5, why: 'more', d };
    }
    // it does not fit: take 10 - d from this column, and the next move puts one bead on the left
    if (!r.hi) return { p, deck: 'lo', to: r.lo - k, why: k === 5 ? 'ten' : 'carry', d };
    // not enough earth beads to take: add the ones over five first, and then the five is the one that does not fit
    if (k < 5 && r.lo < k) return { p, deck: 'lo', to: r.lo + d - 5, why: 'add' };
    return k % 5 ? { p, deck: 'lo', to: r.lo - k % 5, why: 'carry', d } : { p, deck: 'hi', to: 0, why: 'carry', d };
  }
  const take = (p, d, why) => {
    const r = rods[p];
    if (d >= 5 && r.hi) return { p, deck: 'hi', to: r.hi - 1, why };
    if (d <= r.lo) return { p, deck: 'lo', to: r.lo - d, why };
    if (d < 5 && r.hi) return why === 'take' ? { p, deck: 'lo', to: r.lo + 5 - d, why: 'less', d } : { p, deck: 'hi', to: r.hi - 1, why };
  };
  let m = take(p, d, 'take');
  // not enough on this column: one from the nearest column on the left that has something
  for (let q = p + 1; !m && q < n; q++) m = take(q, 1, 'borrow');
  // nothing on the left either, so a column on the right is overfull: empty that one
  for (let q = p - 1; !m && q >= 0; q--) if (rodVal(rods[q])) m = take(q, Math.min(9, rodVal(rods[q])), 'take');
  return m;
}
// The course: 9 projects of 3 exercises of 5 questions, in three circles. A question is { q: '25+17-8' } to work out on the abacus, or
// { read: 74, opts: [47, 24, 74, 79] } to read it (only the first two projects). Difficulty grows from ex00 to ex02. The questions carry no text.
const ask = (...a) => a.map(q => ({ q }));
const rd = (read, ...opts) => ({ read, opts });
export const PROJECTS = [
  { name: "Les boles", sub: "Una columna: de l'1 al 9, amb la bola de dalt", circle: 0, ex: [
    [...ask('3', '1', '4', '2'), rd(5, 5, 3, 2, 7)],
    [...ask('5', '6', '7'), rd(8, 3, 8, 4, 9), rd(3, 3, 8, 2, 5)],
    [...ask('9', '8'), rd(6, 6, 9, 1, 7), rd(9, 6, 9, 4, 5), rd(7, 2, 9, 5, 7)]
  ] },
  { name: "Les columnes", sub: "Desenes i centenes; llegir i escriure fins a 999", circle: 0, ex: [
    [...ask('20', '36'), rd(74, 47, 24, 74, 79), ...ask('12'), rd(45, 54, 45, 15, 46)],
    [...ask('58', '81'), rd(136, 163, 316, 136, 138), ...ask('250', '104')],
    [...ask('407', '615', '908'), rd(692, 642, 296, 962, 692), rd(380, 308, 830, 381, 380)]
  ] },
  { name: "Sumes", sub: "Sumar sense cap canvi", circle: 1, ex: [
    ask('2+2', '1+3', '2+6', '3+5', '1+7'),
    ask('21+7', '32+15', '12+25', '41+8', '20+17'),
    ask('211+36', '312+125', '121+206', '1201+3105', '1123+3111')
  ] },
  { name: "El canvi de 5", sub: "Sumar passant pel 5: +4 = +5 −1", circle: 1, ex: [
    ask('4+1', '3+4', '2+3', '1+4', '3+3'),
    ask('13+4', '24+31', '32+23', '41+34', '33+24'),
    ask('142+36', '253+324', '234+251', '3214+4321', '4132+3243')
  ] },
  { name: "Me'n porto una", sub: "Sumar passant pel 10: +8 = +10 −2", circle: 1, ex: [
    ask('5+5', '8+2', '7+8', '9+9', '6+7'),
    ask('28+14', '36+47', '65+38', '19+25', '57+16'),
    ask('157+68', '486+237', '999+1', '3768+2475', '4856+5379')
  ] },
  { name: "Restes", sub: "Restar, i demanar prestat a l'esquerra", circle: 1, ex: [
    ask('4-2', '9-5', '7-4', '48-16', '56-23'),
    ask('10-3', '15-8', '32-5', '54-28', '81-46'),
    ask('100-1', '423-167', '305-48', '6034-2578', '9875-4321')
  ] },
  { name: "Multiplica", sub: "Multiplicar com a sumes repetides", circle: 2, ex: [
    ask('2x3', '3x4', '4x5', '6x2', '2x5'),
    ask('3x7', '5x8', '6x9', '12x3', '23x4'),
    ask('45x6', '124x3', '86x7', '231x4', '99x9')
  ] },
  { name: "Reparteix", sub: "Dividir com a restes repetides", circle: 2, ex: [
    ask('6:2', '12:3', '10:5', '8:2', '20:4'),
    ask('35:5', '48:6', '27:3', '63:7', '56:8'),
    ask('84:4', '96:8', '144:6', '432:9', '810:9')
  ] },
  { name: "Barreja", sub: "Operacions encadenades", circle: 2, ex: [
    ask('12+9-5', '25+17-8', '60-25+9', '3x4+8', '20-6+9'),
    ask('1250+375', '2000-750', '7x8-6', '1500+480', '3000-1250'),
    ask('125x4+500', '5200-1875', '9x7+38-15', '2500+3750-4000', '36:4+1250')
  ] }
];
export const CIRCLES = [
  { name: "Llegir i escriure", projects: [0, 1] },
  { name: "Sumar i restar", projects: [2, 3, 4, 5] },
  { name: "Multiplicar i repartir", projects: [6, 7, 8] }
];
// the three numbers of the Piscina, the first challenges
export const POOL = ['3', '5', '7'];

/* ---------- progress ---------- */
// What is saved is facts only: { so, secs[6], piscina, notes[9], exams[3], fulls }. XP, level and badges are worked out from it, never stored, so they cannot drift apart.
// secs is the progress of the old game (levels done in each of its six sections): kept, never written by the new game, and read once to give the projects their marks.
export const VALID = 80;
export const EXAM_PASS = 5;
// the old section of each project: ten levels done in it give the project a validated 80
export const OLD = [0, 0, 1, 1, 2, 3, 4, 5, 5];
// a mark out of 100 from the questions right at the first try, of the 15 of a project
export const mark = firsts => Math.round(100 * firsts / 15);
// a whole number from any JSON value: truncated (never rounded up, so damaged data cannot climb), 0 when it is not a finite number
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
// n items of a saved list, a missing or wrong list giving undefined items
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// A complete progress inside its limits from any value at all; a new object, sharing no list with d. It only ever raises: a number is cut into its limits and
// never lowered otherwise, a boolean only turns true. The cloud keeps the larger number, so a value lowered here would be lost or come back from another device.
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const secs = slots(o.secs, 6).map(s => within(s, 10));
  return {
    so: o.so !== false,
    secs,
    piscina: o.piscina === true || secs.some(s => s > 0),
    // the translation of the old game: a section of ten levels done gives its projects 80, unless they already hold more
    notes: slots(o.notes, 9).map((n, i) => Math.max(within(n, 100), secs[OLD[i]] === 10 ? VALID : 0)),
    exams: slots(o.exams, 3).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls))
  };
}
// the projects with a mark of at least VALID; the functions below take a progress that is already clean
const validated = p => p.notes.flatMap((n, i) => n >= VALID ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 1370 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + p.notes[i], 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 9,13
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina, circles 1 and 2 with the exam before them, and only when the circle before is open too (a damaged save cannot skip one); a circle that does not exist is shut
export const isOpen = (p, c) => c === 0 ? p.piscina === true : (c === 1 || c === 2) && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => p.notes[i] >= VALID);
// in the order of the spec; fulls here is the raw count, not the one that XP caps
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: 'Troba bé les errades d\'un full.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: 'Corregeix bé deu fulls d\'errades.' },
  { name: 'Cursus complet', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, p.notes.some(n => n === 100), p.fulls >= 10, p.exams.every(e => e === true)];
// The hand-in of a finished project, the only place where a mark is worked out. run has one { tries, helped } per question (15 of them, five to an exercise):
// the wrong answers before the right one, and whether the hint was asked. A question counts when it was right at the first try without the hint.
// Returns { prog, n, best, gain, redo, news }: prog is a NEW progress (p is never touched) holding the mark if it beats the stored one; n is the mark of
// this run; best the stored mark before it; gain the XP the run adds (the difference of xpOf, so 0 for a lower replay and the whole mark on validating);
// redo the exercises with a question that did not count ('ex00' ...); news the names of the badges this run earns.
export const firstTry = r => !!r && r.tries === 0 && !r.helped;
export function handIn(p, i, run) {
  run = run.slice(0, 15);   // only the 15 questions of a project count, so a result recorded twice can never push a mark over 100
  const n = mark(run.filter(firstTry).length), best = p.notes[i], next = { ...p, secs: p.secs.slice(), notes: p.notes.slice(), exams: p.exams.slice() };
  if (n > best) next.notes[i] = n;
  const had = badges(p), now = badges(next);
  return { prog: next, n, best, gain: xpOf(next) - xpOf(p), redo: [0, 1, 2].filter(e => run.slice(e * 5, e * 5 + 5).some(r => !firstTry(r)) || run.length < e * 5 + 5).map(e => 'ex0' + e),
    news: BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name) };
}

/* ---------- the exam and «Caça l'errada» ---------- */
// Chance enters only through rnd (a function like Math.random). A whole number below n; clamped, so a rnd that returns 1 (or nonsense) still lands inside.
const at = (n, rnd) => Math.min(n - 1, Math.max(0, Math.floor(rnd() * n) || 0));
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// the same question asked twice would be a waste of an exam: one key per question
const askedKey = q => q.read !== undefined ? 'llegir ' + q.read : q.q;
// Six different questions of the 15 fixed ones of the projects of circle c, at least one of each project, in a random order. Each is a copy of the fixed question with p,
// its project, added: PROJECTS is never touched. A circle that does not exist gives the first.
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const draw = p => {
    const pool = PROJECTS[p].ex.flat();
    let i = at(pool.length, rnd);
    for (let n = 0; n < pool.length && used.has(askedKey(pool[i])); n++) i = (i + 1) % pool.length;   // walk on from a random place, so it ends even if rnd never varies
    used.add(askedKey(pool[i]));
    return { ...pool[i], ...(pool[i].opts && { opts: pool[i].opts.slice() }), p };
  };
  const list = ps.map(draw);
  while (list.length < 6) list.push(draw(ps[at(ps.length, rnd)]));
  return shuffle(list, rnd);
}
// The hand-in of a finished exam. qs are its six questions (each carries p, its project) and run one boolean per question (true: right at the one try).
// Returns { prog, good, score, gain, redo, news }: prog is a NEW progress (p is never touched, and nothing is shared with it) with exams[c] set when the exam passes
// (EXAM_PASS of 6, six answers, the exam open) and left alone otherwise, so a pass is never taken back; gain the XP that adds (the difference of xpOf: 50 once, 0 for a
// pass of an exam already passed); redo the projects (indexes, each once, in order) of the questions missed, whether it passed or not; news the names of the badges it earns.
export function examIn(p, c, qs, run) {
  const score = run.filter(r => r === true).length, good = run.length === 6 && score >= EXAM_PASS && examOpen(p, c);
  const next = { ...p, secs: p.secs.slice(), notes: p.notes.slice(), exams: p.exams.slice() };
  if (good) next.exams[c] = true;
  const had = badges(p), now = badges(next);
  return { prog: next, good, score, gain: xpOf(next) - xpOf(p), news: BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name),
    redo: [...new Set(qs.flatMap((q, i) => run[i] !== true && Number.isInteger(q?.p) ? [q.p] : []))].sort((a, b) => a - b) };
}

// The three mistakes of a sheet, the ones that teach. Each one builds, from the number the board is supposed to show (says), a tidy board of three columns that
// shows something else, or null when says has no such mistake (the sheet then draws another number).
export const KINDS = ['veïna', 'dalt', 'girat'];
const MISTAKE = {
  // a bead one column to the side: the board of says with one bead moved to the column beside it, where it still fits
  veïna(says, rnd) {
    const rods = write(says, 3), moves = [];
    for (let p = 0; p < 3; p++) for (const deck of ['lo', 'hi']) for (const q of [p - 1, p + 1])
      if (q >= 0 && q < 3 && rods[p][deck] > 0 && rods[q][deck] < (deck === 'lo' ? 4 : 1)) moves.push([p, deck, q]);
    if (!moves.length) return null;
    const [p, deck, q] = moves[at(moves.length, rnd)];
    rods[p][deck]--; rods[q][deck]++;
    return rods;
  },
  // the heaven bead counted as 1 instead of 5: the board shows 4 x 10^p more than says, with the heaven bead down in column p (the digit of says there, from 1 to 5, becomes 5 to 9)
  dalt(says, rnd) {
    const cols = [0, 1, 2].filter(p => { const d = Math.floor(says / 10 ** p) % 10; return d >= 1 && d <= 5; });
    return cols.length ? write(says + 4 * 10 ** cols[at(cols.length, rnd)], 3) : null;
  },
  // two digits swapped (47 for 74), never a zero ending up on the left
  girat(says, rnd) {
    const s = String(says), swaps = [];
    for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
      const a = [...s]; [a[i], a[j]] = [a[j], a[i]];
      if (s[i] !== s[j] && a[0] !== '0') swaps.push(+a.join(''));
    }
    return swaps.length ? write(swaps[at(swaps.length, rnd)], 3) : null;
  }
};
// Three boards, each { rods, says, bad }: rods are three columns (the units first), says the number the board is said to show, bad null for a board that shows it or the
// kind of its mistake. From 0 to 2 are bad (never all three), in any place, and the three numbers differ.
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)])), used = new Set();
  return [0, 1, 2].map(i => {
    const kind = bads.has(i) ? KINDS[at(3, rnd)] : null;
    // numbers of two or of three digits; a number already used, or with no mistake of this kind, is dropped and another one drawn
    const make = says => { const rods = kind ? MISTAKE[kind](says, rnd) : write(says, 3); return rods && { rods, says, bad: kind }; };
    for (let n = 0; n < 60; n++) {
      const lo = [10, 100][at(2, rnd)], says = lo + at(lo === 10 ? 90 : 900, rnd);
      const board = !used.has(says) && make(says);
      if (board) { used.add(says); return board; }
    }
    // the last resort, for a rnd that never varies: 47 (which has all three mistakes) and then the numbers upwards, the first one not used that has the mistake
    for (const says of [47, ...Array.from({ length: 990 }, (_, i) => 10 + i)]) {
      const board = !used.has(says) && make(says);
      if (board) { used.add(says); return board; }
    }
  });
}
// The hand-in of a finished sheet. run has one boolean per board (true: judged right, with the fix made when it was wrong). Returns { prog, good, gain, missed, news }:
// prog is a NEW progress (p is never touched, nothing shared with it) with fulls + 1 only when all three are right; gain the XP that adds (the difference of xpOf, so 0 once
// the cap of 3 per validated project is reached, or with none validated); missed the places (0, 1, 2) judged wrong or not done; news the names of the badges it earns.
export function sheetIn(p, run) {
  const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3;
  const next = { ...p, secs: p.secs.slice(), notes: p.notes.slice(), exams: p.exams.slice() };
  if (good) next.fulls = p.fulls + 1;
  const had = badges(p), now = badges(next);
  return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name) };
}
