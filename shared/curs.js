// The cursus every game of the pond is laid out as, like the cursus of 42 Barcelona: a Piscina to get in, circles of projects of
// ten levels, a mark for each project, an exam for each circle, sheets of «Caça l'errada», XP, a level and badges. The rules of
// the progress live here once; each logic.js gives curs() what is its own (its projects, circles and badges, the field its stars
// are kept in) and exports what it gets back under the same names as ever. clean() stays in each game: it is the door of what a
// child has saved, and it knows the shapes of that game's old saves. Nothing here touches the page.

/* ---------- numbers and chance ---------- */
// a whole number from anything: a number that is not finite, or anything else, is 0
export const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
export const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
// n places from a list that may not be one
export const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// Chance enters only through rnd (a function like Math.random). A whole number below n, and one from lo to hi; clamped, so a rnd
// that returns 1 or NaN never gives a number out of range
export const at = (n, rnd) => Math.min(n - 1, Math.max(0, Math.floor(rnd() * n) || 0));
export const int = (rnd, lo, hi) => lo + Math.min(hi - lo, Math.max(0, Math.floor(rnd() * (hi - lo + 1)) || 0));
// shuffles a in place and gives it back
export function shuffle(a, rnd = Math.random) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- the numbers of the cursus ---------- */
// What a level gives to the mark of its project, by its stars: 10 with no slip, 8 with one or two, 5 with more. Ten levels make 100,
// and a project is validated with 80. An exam passes with 5 of its 6 questions.
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
// the ten levels of a project are three exercises: ex00 (three levels), ex01 (three) and ex02 (four)
export const exOf = idx => idx < 3 ? 0 : idx < 6 ? 1 : 2;

/* ---------- the progress ---------- */
// cfg, what a game has of its own:
//   PROJECTS, CIRCLES   its projects and its circles ({ projects: [indices], ... })
//   field               where the stars of each level are kept: 'lv' or 'stars', ten places per project
//   marks               true when field keeps the mark of each project instead ('notes', one place per project)
//   xpExtra             p => the XP a game adds of its own (the corner of thinking of the cursus)
//   lists               the other lists a new progress must not share with the old one ('exams' always is one)
//   badges, BADGES      functions that give the game's badges (p => [booleans]) and their list; called late, so they may be defined after
//   slot                the place in exams of the exam of circle c (default c)
//   alsoOpen            (p, c) => true opens circle c even with the exam before it not passed
//   onLevel             (next, i, idx) changes a new progress more when a level is done
//   redoOf              q => the projects to redo when the exam question q is missed (default its p, when it has one)
// Every function takes a progress that is already clean, and never changes it: a change gives a NEW progress.
export function curs(cfg) {
  const { PROJECTS, CIRCLES, field = 'lv', marks = false, lists = [], slot = c => c, alsoOpen = null, onLevel = null, xpExtra = null } = cfg;
  const redoOf = cfg.redoOf || (q => Number.isInteger(q?.p) ? [q.p] : []);
  const copy = p => { const next = { ...p }; for (const k of [field, ...lists, 'exams']) next[k] = p[k].slice(); return next; };
  const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
  const tens = (p, i) => p[field].slice(i * 10, i * 10 + 10);
  const noteOf = marks ? (p, i) => p[field][i] : (p, i) => tens(p, i).reduce((s, n) => s + POINTS[n], 0);
  // how many levels of a project are done from the first on: the one after them is the next to open
  const reached = (p, i) => { const k = tens(p, i).findIndex(n => n === 0); return k < 0 ? 10 : k; };
  const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
  // 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project
  function xpOf(p) {
    const v = validated(p);
    return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length)
      + (xpExtra ? xpExtra(p) : 0);
  }
  // the level is the XP over 150, with two decimals and a comma
  const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
  // circle 0 opens with the Piscina and the others with the exam before them
  const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length
    && (isOpen(p, c - 1) && p.exams[slot(c - 1)] === true || !!alsoOpen && alsoOpen(p, c));
  // the exam of a circle opens when the circle is open and all its projects are validated
  const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
  // the names of the badges next has and p had not
  const earned = (p, next) => { const had = cfg.badges(p), now = cfg.badges(next); return cfg.BADGES().filter((_, j) => now[j] && !had[j]).map(b => b.name); };

  // A level done, with its slips (a hint is a slip too). Returns { prog, n, note, gain, valid, exam, news }: prog keeps the best stars
  // of the level; n the stars of this time; note the mark of the project after it; gain the XP it adds; valid whether this very level
  // validates the project, and exam whether that opens the exam of its circle; news the badges it earns
  function levelIn(p, i, idx, slips) {
    const n = starsFor(slips), k = i * 10 + idx, next = copy(p), c = circleOf(i);
    next[field][k] = Math.max(next[field][k], n);
    if (onLevel) onLevel(next, i, idx);
    return { prog: next, n, note: noteOf(next, i), gain: xpOf(next) - xpOf(p), valid: noteOf(p, i) < VALID && noteOf(next, i) >= VALID,
      exam: !examOpen(p, c) && examOpen(next, c), news: earned(p, next) };
  }
  // the Piscina done. Returns { prog, news }
  function poolIn(p) { const next = { ...copy(p), piscina: true }; return { prog: next, news: earned(p, next) }; }
  // a record that only grows (a run of right answers, a lightning round): the best is kept. Returns { prog, best, news }
  const keep = name => (p, n) => { const next = copy(p), best = whole(n) > p[name]; if (best) next[name] = whole(n); return { prog: next, best, news: earned(p, next) }; };
  // The hand-in of a finished exam: qs its six questions and run one boolean per question. Returns { prog, good, score, gain, redo, news }:
  // the exam is marked passed when it passes (EXAM_PASS of 6, the exam open), never taken back; redo the projects of the questions missed
  function examIn(p, c, qs, run) {
    const score = run.filter(r => r === true).length, good = run.length === 6 && score >= EXAM_PASS && examOpen(p, c), next = copy(p);
    if (good) next.exams[slot(c)] = true;
    return { prog: next, good, score, gain: xpOf(next) - xpOf(p), news: earned(p, next),
      redo: [...new Set(qs.flatMap((q, i) => run[i] !== true ? redoOf(q) : []))].sort((a, b) => a - b) };
  }
  // The hand-in of a finished sheet: run has one boolean per claim. Returns { prog, good, gain, missed, news }: fulls + 1 only when all
  // three are right; gain the XP that adds (0 once the cap of 3 per validated project is reached)
  function sheetIn(p, run) {
    const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3, next = copy(p);
    if (good) next.fulls = p.fulls + 1;
    return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: earned(p, next) };
  }
  return { copy, circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, earned, levelIn, poolIn, keep,
    streakIn: keep('ratxa'), rapidIn: keep('rapid'), examIn, sheetIn };
}
