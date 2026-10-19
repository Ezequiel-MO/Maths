// La rutina de l'estany: five minutes a day of the times tables, spaced out. Each fact (7 × 4) is one «capseta»: the product on top
// and the two numbers that make it below, so 7 × 4, 4 × 7, 28 : 7 and 28 : 4 are the same fact. A fact answered right comes back
// later and later (1, 2, 4, 7, 14, 30, 60 days); a miss brings it back today. After the tables, three «trucs»: a new fact made out
// of one already known (16 × 4 = 64, so 17 × 4 = 64 + 4). No page in here, so the checks can run it under Node.

// the facts are kept by position in the save: this list only ever grows at the end, never reorders
const RANK = { 2: 0, 5: 1, 3: 2, 4: 3, 9: 4, 6: 5, 8: 6, 7: 7 };   // the order the tables come in: the easy ones first
export const FACTS = Object.freeze([2, 3, 4, 5, 6, 7, 8, 9].flatMap(a => [2, 3, 4, 5, 6, 7, 8, 9].filter(b => b >= a).map(b => [a, b]))
  .sort((f, g) => Math.max(RANK[f[0]], RANK[f[1]]) - Math.max(RANK[g[0]], RANK[g[1]]) || Math.min(RANK[f[0]], RANK[f[1]]) - Math.min(RANK[g[0]], RANK[g[1]])));
// days to wait after 0, 1, 2… right answers in a row
export const GAPS = [0, 1, 2, 4, 7, 14, 30, 60];
export const TABLES = 12;   // facts of the tables in one routine, at most
export const NEW = 8;       // of them, facts never seen
export const LEAST = 6;     // a routine has at least this many: when few are due, the ones due soonest come early
export const TRUCS = 3;
export const SABUDA = 4;    // right answers in a row that make a fact «sabuda»

const N = FACTS.length;
const nat = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const row = v => Array.from({ length: N }, (_, i) => nat(Array.isArray(v) ? v[i] : 0));

// The save, from anything. Every field is a number that only grows (or a list of them), as the cloud merge wants:
// encerts and errades count the answers of each fact, marca is encerts at its last miss (so encerts − marca is the run of right
// answers since), vist the day it was last asked. dies is how many days the routine was done, ultim the last of them, trucs
// how many trucs came out right.
export function clean(raw) {
  const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const p = { encerts: row(s.encerts), errades: row(s.errades), marca: row(s.marca), vist: row(s.vist),
    dies: nat(s.dies), ultim: nat(s.ultim), trucs: nat(s.trucs), so: s.so !== false };
  p.marca = p.marca.map((m, i) => Math.min(m, p.encerts[i]));
  return p;
}

// today as a whole number of days, by the date on the device's own calendar
export const dayOf = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);

export const seen = (p, i) => p.encerts[i] + p.errades[i] > 0;
export const runOf = (p, i) => p.encerts[i] - p.marca[i];
export const dueDay = (p, i) => p.vist[i] + GAPS[Math.min(runOf(p, i), GAPS.length - 1)];
// 0 never seen, 1 learning it, 2 nearly, 3 sabuda: the colour of its square on the grid
export const stage = (p, i) => !seen(p, i) ? 0 : runOf(p, i) >= SABUDA ? 3 : runOf(p, i) >= 2 ? 2 : 1;
export const known = p => FACTS.filter((_, i) => stage(p, i) === 3).length;
export const doneToday = (p, today) => p.ultim >= today;
// the fact of a cell of the grid (a row, b column), in either order
export const factAt = (a, b) => FACTS.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));

export function shuffle(a, rnd = Math.random) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// the facts of today's routine: the ones due, the longest overdue first, then new ones in the order of the tables; when that is
// fewer than LEAST, the ones due soonest. more (once the routine is done) is a free round of the ones least known.
export function plan(p, today, rnd = Math.random, more = false) {
  const all = FACTS.map((_, i) => i), byDue = (i, j) => dueDay(p, i) - dueDay(p, j) || runOf(p, i) - runOf(p, j) || i - j;
  let list;
  if (more) list = all.filter(i => seen(p, i)).sort((i, j) => runOf(p, i) - runOf(p, j) || byDue(i, j)).slice(0, LEAST);
  else {
    const due = all.filter(i => seen(p, i) && dueDay(p, i) <= today).sort(byDue).slice(0, TABLES);
    const fresh = all.filter(i => !seen(p, i)).slice(0, Math.min(NEW, TABLES - due.length));
    list = [...due, ...fresh];
  }
  if (list.length < LEAST) list = list.concat(all.filter(i => seen(p, i) && !list.includes(i)).sort(byDue).slice(0, LEAST - list.length));
  if (list.length < LEAST) list = list.concat(all.filter(i => !list.includes(i)).slice(0, LEAST - list.length));
  return shuffle(list, rnd);
}

// One question of a fact: the capseta with one number missing. A fact being learnt is asked as a product; a known one as any of
// its four operations, or as the capseta alone. hole is where the missing number goes: 'top' (the product), 'l' or 'r'.
export function ask(p, i, rnd = Math.random) {
  const [a, b] = FACTS[i], [x, y] = rnd() < 0.5 ? [a, b] : [b, a], prod = a * b;
  const kind = runOf(p, i) < 1 ? 'mul' : ['mul', 'mul', 'div', 'caixa'][Math.floor(rnd() * 4)];
  if (kind === 'mul') return { i, kind, x, y, prod, hole: 'top', text: `${x} × ${y}`, ans: prod };
  if (kind === 'div') return { i, kind, x, y, prod, hole: 'r', text: `${prod} : ${x}`, ans: y };
  const hole = ['top', 'l', 'r'][Math.floor(rnd() * 3)];
  return { i, kind, x, y, prod, hole, text: '', ans: hole === 'top' ? prod : hole === 'l' ? x : y };
}
// the four operations of a capseta, as the line shown once it is answered
export const family = ({ x, y, prod }) => x === y ? [`${x} × ${x} = ${prod}`, `${prod} : ${x} = ${x}`] : [`${x} × ${y} = ${prod}`, `${y} × ${x} = ${prod}`, `${prod} : ${x} = ${y}`, `${prod} : ${y} = ${x}`];

// What one answer does to the save. A new fact right at once was known already, so it starts two days on; a miss starts it again.
export function answer(p, i, ok, today) {
  if (ok) p.encerts[i] += seen(p, i) ? 1 : 2;
  else { p.errades[i] += 1; p.marca[i] = p.encerts[i]; }
  p.vist[i] = Math.max(p.vist[i], today);
  return p;
}
// the routine of today is done: one more day, once a day
export function finish(p, today) {
  if (p.ultim < today) { p.dies += 1; p.ultim = today; }
  return p;
}

/* ---------- the trucs: a new fact out of a known one ---------- */
const KINDS = {
  // one group more: 6 × 4 = 24, so 7 × 4 = 24 + 4
  mes: (a, b) => ({ known: `${a} × ${b} = ${a * b}`, text: `${a + 1} × ${b}`, ans: (a + 1) * b, tip: `Un grup de ${b} més: ${a * b} + ${b} = ${(a + 1) * b}` }),
  // one group less: 6 × 4 = 24, so 5 × 4 = 24 − 4
  menys: (a, b) => ({ known: `${a} × ${b} = ${a * b}`, text: `${a - 1} × ${b}`, ans: (a - 1) * b, tip: `Un grup de ${b} menys: ${a * b} − ${b} = ${(a - 1) * b}` }),
  // twice the groups: 4 × 6 = 24, so 8 × 6 = 24 + 24
  doble: (a, b) => ({ known: `${a} × ${b} = ${a * b}`, text: `${2 * a} × ${b}`, ans: 2 * a * b, tip: `El doble de grups, el doble de resultat: ${a * b} + ${a * b} = ${2 * a * b}` }),
  // ten times: 3 × 4 = 12, so 3 × 40 = 120
  deu: (a, b) => ({ known: `${a} × ${b} = ${a * b}`, text: `${a} × ${b * 10}`, ans: a * b * 10, tip: `${b * 10} són 10 vegades ${b}, així que el resultat és 10 vegades ${a * b}: ${a * b * 10}` }),
  // past the tables: 16 × 4 = 64, so 17 × 4 = 64 + 4
  gran: (a, b) => ({ known: `${a} × ${b} = ${a * b}`, text: `${a + 1} × ${b}`, ans: (a + 1) * b, tip: `Un grup de ${b} més: ${a * b} + ${b} = ${(a + 1) * b}` }),
  // ten times as many to share: 28 : 4 = 7, so 280 : 4 = 70
  reparteix: (a, b) => ({ known: `${a * b} : ${a} = ${b}`, text: `${a * b * 10} : ${a}`, ans: b * 10, tip: `Hi ha 10 vegades més per repartir, així que cadascú en té 10 vegades més: ${b * 10}` })
};
export const TRUC_KINDS = Object.keys(KINDS);

// today's three trucs, each of another kind, built on facts already known (or on the tables of 2 and 5 while few are)
export function trucs(p, rnd = Math.random) {
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  let base = FACTS.filter((_, i) => runOf(p, i) >= 2);
  if (base.length < 3) base = FACTS.filter(([a, b]) => a === 2 || a === 5 || b === 2 || b === 5);
  return shuffle(TRUC_KINDS, rnd).slice(0, TRUCS).map(kind => {
    let [a, b] = base[Math.floor(rnd() * base.length)];
    if (rnd() < 0.5) [a, b] = [b, a];
    if (kind === 'gran') { a = int(11, 19); b = int(2, 5); }
    if (kind === 'menys' && a < 3) [a, b] = [b, a];
    if (kind === 'doble' && a > 5) [a, b] = [b, a];
    return { kind, ...KINDS[kind](a, b) };
  });
}
