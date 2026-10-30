import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the castle of numbers, with no page in it. The frog is building a castle on the pond, and every number that
// fills a hole is a brick of it: towers where each brick is the sum of the two under it, balances, padlocks with a hole in their sum,
// magic squares, machines, wheels, secret symbols, tiles to place and paths to walk. It is the first algebra: a number is hidden, and the
// child finds it from what is around it. Every value is worked out here from the data of its puzzle (the bottom of a tower, the full
// square, what goes into a machine), so a picture and its answer never disagree, and so is every hint: it comes from a relation of the
// puzzle whose other numbers the child already has. It must keep importing from Node.

/* ---------- numbers ---------- */
export const punt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const sum = a => a.reduce((s, n) => s + n, 0);
export const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => b && a % b === 0 ? a / b : NaN };
export const INV = { '+': '−', '−': '+', '×': '÷', '÷': '×' };
export const SIGNS = ['+', '−', '×', '÷'];
// a step of a machine or a stone of a path: '×3' does × 3 to what comes in; undo gives the step that takes it back
const stepOf = s => ({ op: s[0], n: +s.slice(1) });
export const apply = (x, s) => { const { op, n } = stepOf(s); return OPS[op](x, n); };
export const undo = s => { const { op, n } = stepOf(s); return INV[op] + n; };
// numbers and signs in a row, worked out with × and ÷ first
export function evalT(ts) {
  const a = [ts[0]], ops = [];
  for (let i = 1; i < ts.length; i += 2) {
    const op = ts[i], n = ts[i + 1];
    if (op === '×' || op === '÷') a[a.length - 1] = OPS[op](a[a.length - 1], n); else { ops.push(op); a.push(n); }
  }
  return ops.reduce((s, op, i) => OPS[op](s, a[i + 1]), a[0]);
}
const isSym = t => typeof t === 'string' && !OPS[t] && t !== '=';
const toks = e => e.split(' ').map(t => /^\d+$/.test(t) ? +t : t);
const valOf = (ts, v) => evalT(ts.map(t => isSym(t) ? v[t] : t));
const key = (r, i) => `${r}-${i}`;

/* ---------- the puzzles with holes ---------- */
// Every puzzle with holes is a scene { s, cells, holes, ... }: cells has the value of every cell (the shown ones and the hidden ones),
// holes the keys the child fills, in the order they are best done. hint, when given, is what the frog says of a hole no relation gives.

// A tower of bricks: base is its bottom row, from left to right; each brick above is op (+ or ×) of the two under it. mask is a string
// per row from the top down: ? is a hole, . a brick shown. Key r-i: floor r from the bottom, brick i from the left
export function pyr(base, ...mask) {
  const o = typeof mask[mask.length - 1] === 'object' ? mask.pop() : {}, op = o.op || '+', n = base.length, cells = {}, holes = [];
  base.forEach((v, i) => { cells[key(0, i)] = v; });
  for (let r = 1; r < n; r++) for (let i = 0; i < n - r; i++) cells[key(r, i)] = OPS[op](cells[key(r - 1, i)], cells[key(r - 1, i + 1)]);
  for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) if (mask[n - 1 - r]?.[i] === '?') holes.push(key(r, i));
  return { s: 'pyr', n, op, cells, holes, ...o };
}
// The middle brick at the bottom of a tower of three counts twice: a + x + x + b is the top
const twice = (a, x, b) => pyr([a, x, b], '.', '??', '.?.', { hint: `El maó del mig de baix és a sota dels dos del mig: compta dues vegades! ${a} + ? + ? + ${b} = ${a + 2 * x + b}, així que ? + ? = ${2 * x}.` });

// The lines of a square of n: its rows, its columns and its two diagonals
export const linesOf = n => [...Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => key(r, c))),
  ...Array.from({ length: n }, (_, c) => Array.from({ length: n }, (_, r) => key(r, c))),
  Array.from({ length: n }, (_, i) => key(i, i)), Array.from({ length: n }, (_, i) => key(i, n - 1 - i))];
// A magic square: grid its rows; mask a string per row (? a hole, . shown, _ an empty cell that is not asked). With gem the sum of its lines
// (the cell S) is hidden too and found first; with explore the child taps every line to see what it adds up to. look: turtle, durer, gaudi
export function magic(grid, mask, o = {}) {
  const n = grid.length, cells = {}, holes = [], blank = [];
  grid.forEach((row, r) => row.forEach((v, c) => {
    cells[key(r, c)] = v;
    if (mask?.[r][c] === '?') holes.push(key(r, c)); else if (mask?.[r][c] === '_') blank.push(key(r, c));
  }));
  cells.S = sum(grid[0]);
  return { s: 'magic', n, cells, holes: o.gem ? ['S', ...holes] : holes, blank, lines: linesOf(n), ...o };
}
// The square of the turtle of the Lo Shu, and what can be done to it
const LS = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const map = (g, f) => g.map(r => r.map(f));
const turn = g => g[0].map((_, c) => g.map(r => r[c]).reverse());
const DURER = [[16, 3, 2, 13], [5, 10, 11, 8], [9, 6, 7, 12], [4, 15, 14, 1]];
const GAUDI = [[1, 14, 14, 4], [11, 7, 6, 9], [8, 10, 10, 5], [13, 2, 3, 15]];

// A padlock: a sum written with its hole in brackets, '[36] + 27 = 63' or '12 [÷] 3 = 4'. A sign in the hole is chosen, not typed
export function lock(str, o = {}) {
  const raw = str.split(' '), hole = raw.findIndex(t => t[0] === '[');
  const ts = raw.map(t => t.replace(/[[\]]/g, '')).map(t => /^\d+$/.test(t) ? +t : t), sign = typeof ts[hole] !== 'number';
  return { s: 'lock', toks: ts, hole, sign, cells: { x: ts[hole] }, holes: sign ? [] : ['x'], ...o };
}
// a simple padlock (a op b = c, or c = a op b) as [a, op, b, c] with the place of its hole in that order; null when it is not simple
function simple(sc) {
  let t = sc.toks, h = sc.hole;
  if (t.length === 5 && t[1] === '=') { t = [t[2], t[3], t[4], '=', t[0]]; h = { 0: 4, 2: 0, 3: 1, 4: 2 }[h]; }
  return t.length === 5 && t[3] === '=' ? { a: t[0], op: t[1], b: t[2], c: t[4], h } : null;
}
// the bar of a sum or a take-away with a hole: the whole and its two parts, one of them (or the whole) the hole. For the hint
export function barOf(sc) {
  const m = simple(sc); if (!m || sc.sign || (m.op !== '+' && m.op !== '−')) return null;
  const at = { 0: 'a', 2: 'b', 4: 'c' }[m.h];
  return m.op === '+' ? { whole: m.c, parts: [m.a, m.b], hole: { c: 'whole', a: 0, b: 1 }[at] } : { whole: m.a, parts: [m.b, m.c], hole: { a: 'whole', b: 0, c: 1 }[at] };
}
function lockSay(sc) {
  if (sc.hint) return sc.hint;
  const m = simple(sc);
  if (!m) return 'Prova un número al forat i fes les operacions: les dues bandes del = han de donar el mateix.';
  const { a, op, b, c, h } = m;
  if (h === 4) return `Fes l'operació: ${a} ${op} ${b}.`;
  if (h === 0) return { '+': `Quin número sumat a ${b} fa ${c}? Fes-ho al revés: ${c} − ${b}.`, '−': `Si en treus ${b} i en queden ${c}, abans n'hi havia ${c} + ${b}.`,
    '×': `Quin número per ${b} fa ${c}? Fes-ho al revés: ${c} ÷ ${b}.`, '÷': `Si ho reparteixes en ${b} i en toca ${c} a cada part, n'hi havia ${c} × ${b}.` }[op];
  return { '+': `${a} més quant fa ${c}? Fes-ho al revés: ${c} − ${a}.`, '−': `${a} menys quant dona ${c}? Fes ${a} − ${c}.`,
    '×': `${a} per quant fa ${c}? Fes-ho al revés: ${c} ÷ ${a}.`, '÷': `${a} entre quant dona ${c}? Fes ${a} ÷ ${c}.` }[op];
}

// A machine: the steps it does one after another (['×2', '+3']) and what goes in. mode 'out': the child finds what comes out of every
// step; 'in': what comes out is shown, and the child runs the machine backwards. Key m0 is what goes in, mN what comes out
export function mach(steps, x, mode, o = {}) {
  const vals = [x]; for (const s of steps) vals.push(apply(vals[vals.length - 1], s));
  const N = steps.length, cells = Object.fromEntries(vals.map((v, i) => [`m${i}`, v]));
  const holes = mode === 'out' ? steps.map((_, i) => `m${i + 1}`) : steps.map((_, i) => `m${N - 1 - i}`);
  return { s: 'mach', steps, mode, cells, holes, ...o };
}
// a rule written for the buttons: '×2 i +3'
const ruleText = steps => steps.join(' i ');
const stepsOf = text => text.split(' i ');

// A series: its numbers and a mask (? a hole). The jumps between them say how it goes on: ×2 when every number doubles the one before
export function ser(vals, mask, o = {}) {
  const cells = Object.fromEntries(vals.map((v, i) => [`t${i}`, v])), holes = [...mask].flatMap((c, i) => c === '?' ? [`t${i}`] : []);
  const ratio = vals[1] / vals[0], times = Number.isInteger(ratio) && ratio > 1 && vals.every((v, i) => !i || v === vals[i - 1] * ratio);
  const jumps = vals.slice(1).map((v, i) => times ? `×${ratio}` : v >= vals[i] ? `+${v - vals[i]}` : `−${vals[i] - v}`);
  return { s: 'ser', vals, cells, holes, jumps, ...o };
}

// A wheel: the number of its centre does op (× or ÷) to every number of the ring, and gives the one outside it. Keys c, s0.., o0..
export function wheel(op, c, ring, holes, o = {}) {
  const cells = { c };
  ring.forEach((s, i) => { cells[`s${i}`] = s; cells[`o${i}`] = OPS[op](s, c); });
  return { s: 'wheel', op, n: ring.length, cells, holes, ...o };
}
// A table of multiplying with holes: the numbers of its rows and of its columns, and each cell their product. Keys r0.., c0.., p0-0..
export function mgrid(rows, cols, holes, o = {}) {
  const cells = {};
  rows.forEach((r, i) => { cells[`r${i}`] = r; cols.forEach((c, j) => { cells[`p${i}-${j}`] = r * c; }); });
  cols.forEach((c, j) => { cells[`c${j}`] = c; });
  return { s: 'mgrid', R: rows.length, C: cols.length, cells, holes, ...o };
}

// Secret symbols: what each drawing is worth (vals) and the lines written with them ('🐸 + 🐸'); the total of every line is worked out.
// With ask, one more line whose total is the last hole (T). The holes are the drawings, in the order they first come
const symsOf = lines => [...new Set(lines.flatMap(l => [...l.lhs, ...l.rhs].filter(isSym)))];
export function sym(vals, exprs, o = {}) {
  const lines = exprs.map((e, i) => { const lhs = toks(e); return { id: `l${i}`, lhs, rhs: [valOf(lhs, vals)] }; });
  const holes = symsOf(lines), cells = { ...vals };
  if (o.ask) { const lhs = toks(o.ask); cells.T = valOf(lhs, vals); lines.push({ id: 'ask', lhs, rhs: ['T'], ask: true }); holes.push('T'); }
  return { s: 'sym', vals, lines, cells, holes, ...o };
}
// A grid of drawings: the sum of each row (on the right) and of each column (under it)
export function fgrid(vals, grid, o = {}) {
  const line = (id, a) => { const lhs = a.flatMap((x, i) => i ? ['+', x] : [x]); return { id, lhs, rhs: [valOf(lhs, vals)] }; };
  const lines = [...grid.map((r, i) => line(`r${i}`, r)), ...grid[0].map((_, j) => line(`c${j}`, grid.map(r => r[j])))];
  return { s: 'fgrid', vals, grid, lines, cells: { ...vals }, holes: symsOf(lines), ...o };
}
// A balance, level: what is on each pan (numbers are weights, a drawing is a thing whose weight is hidden; x is a box). pans: [[L, R], ...]
// one balance or more; vals the weights of the drawings. Their lines say both pans weigh the same
export function bals(pans, vals, o = {}) {
  const side = a => a.flatMap((x, i) => i ? ['+', x] : [x]);
  const lines = pans.map(([L, R], i) => ({ id: `b${i}`, lhs: side(L), rhs: side(R) }));
  return { s: 'bal', pans, vals, lines, cells: { ...vals }, holes: symsOf(lines), ...o };
}
const bal = (L, R, x, o) => bals([[L, R]], { x }, o);

// A sum or a take-away in columns with some digits hidden: masks has a string per row (? a hidden digit), right-aligned. Key a0 is the
// units of the top number, b1 the tens of the one under it, c the result
export const PLACE = ['unitats', 'desenes', 'centenes', 'unitats de miler'];
export function crypt(a, b, op, masks) {
  const nums = [a, b, OPS[op](a, b)], cells = {}, holes = [];
  nums.forEach((n, j) => { const d = String(n), m = masks[j]; [...d].reverse().forEach((x, i) => { const k = 'abc'[j] + i; cells[k] = +x; if (m[m.length - 1 - i] === '?') holes.push(k); }); });
  return { s: 'crypt', op, nums, len: Math.max(...nums.map(n => String(n).length)), cells, holes: holes.sort((x, y) => x[1] - y[1] || 'abc'.indexOf(x[0]) - 'abc'.indexOf(y[0])) };
}

// A riddle of «penso un número»: the steps done to it, written out, and what it gave. A story: its text, its answer, the bars of its hint
const DO = { '+': n => `li sumo ${n}`, '−': n => `li resto ${n}`, '×': n => `el multiplico per ${n}`, '÷': n => `el divideixo entre ${n}` };
export function riddle(steps, x) {
  const out = steps.reduce(apply, x), said = steps.map(s => { const { op, n } = stepOf(s); return DO[op](n); });
  return { s: 'riddle', steps, out, text: `Penso un número, ${said.join(', ')} i em dona ${out}.`, cells: { x }, holes: ['x'] };
}
const story = (text, x, bars, hint) => ({ s: 'riddle', text, bars, hint, cells: { x }, holes: ['x'] });

/* ---------- what a hole is worked out from ---------- */
// The relations of a puzzle: each { out, ins, say, lit }: out can be worked out from ins, say(cells) tells how, lit what to light
const RELS = new WeakMap();
function rels(sc) {
  if (RELS.has(sc)) return RELS.get(sc);
  const out = [], v = sc.cells;
  const add = (o, ins, say, lit = ins) => out.push({ out: o, ins, say, lit });
  if (sc.s === 'pyr') {
    const op = sc.op, inv = INV[op];
    for (let r = 1; r < sc.n; r++) for (let i = 0; i < sc.n - r; i++) {
      const t = key(r, i), a = key(r - 1, i), b = key(r - 1, i + 1);
      add(t, [a, b], () => `Mira els dos maons de sota: ${v[a]} ${op} ${v[b]}.`);
      add(a, [t, b], () => `A sobre hi ha ${v[t]} i al costat ${v[b]}: ${op === '+' ? `${v[b]} més quant fa ${v[t]}?` : `${v[b]} per quant fa ${v[t]}?`} ${v[t]} ${inv} ${v[b]}.`);
      add(b, [t, a], () => `A sobre hi ha ${v[t]} i al costat ${v[a]}: ${op === '+' ? `${v[a]} més quant fa ${v[t]}?` : `${v[a]} per quant fa ${v[t]}?`} ${v[t]} ${inv} ${v[a]}.`);
    }
  } else if (sc.s === 'magic') {
    for (const L of sc.lines) {
      add('S', L, () => `Suma una línia sencera: ${L.map(k => v[k]).join(' + ')}.`);
      for (const k of L) { const o = L.filter(x => x !== k); add(k, [...o, 'S'], () => `Aquesta línia ha de sumar ${v.S}: ${v.S} − ${o.map(x => v[x]).join(' − ')}.`, o); }
    }
    if (sc.n === 3) add(key(1, 1), ['S'], () => `El centre d'un quadrat màgic de 3 × 3 és la tercera part de la suma: ${v.S} ÷ 3.`);
  } else if (sc.s === 'lock' || sc.s === 'riddle') {
    add('x', [], () => sc.s === 'lock' ? lockSay(sc) : sc.hint || `Comença pel final, pel ${sc.out}, i desfés el que s'ha fet: ${sc.steps.slice().reverse().map(undo).join(' i després ')}.`);
  } else if (sc.s === 'mach') {
    sc.steps.forEach((s, i) => {
      const a = `m${i}`, b = `m${i + 1}`;
      add(b, [a], () => `Entra el ${v[a]} i la màquina fa ${s}: ${v[a]} ${s[0]} ${s.slice(1)}.`);
      add(a, [b], () => `Al revés! La màquina ${s} es desfà amb ${undo(s)}: ${v[b]} ${undo(s)[0]} ${s.slice(1)}.`);
    });
  } else if (sc.s === 'ser') {
    sc.jumps.forEach((j, i) => {
      const a = `t${i}`, b = `t${i + 1}`;
      add(b, [a], () => `Mira els salts de la sèrie. Del ${v[a]} es fa ${j}.`);
      add(a, [b], () => `Ves enrere des del ${v[b]}: s'hi arriba fent ${j}, i es desfà amb ${undo(j)}.`);
    });
  } else if (sc.s === 'wheel') {
    const op = sc.op;
    for (let i = 0; i < sc.n; i++) {
      const s = `s${i}`, o = `o${i}`;
      add(o, ['c', s], () => `${v[s]} ${op} ${v.c}.`);
      add(s, ['c', o], () => op === '×' ? `Quin número per ${v.c} fa ${v[o]}? ${v[o]} ÷ ${v.c}.` : `Quin número entre ${v.c} fa ${v[o]}? ${v[o]} × ${v.c}.`);
      add('c', [s, o], () => op === '×' ? `${v[s]} per quant fa ${v[o]}? ${v[o]} ÷ ${v[s]}.` : `${v[s]} entre quant fa ${v[o]}? ${v[s]} ÷ ${v[o]}.`);
    }
  } else if (sc.s === 'mgrid') {
    for (let i = 0; i < sc.R; i++) for (let j = 0; j < sc.C; j++) {
      const r = `r${i}`, c = `c${j}`, p = `p${i}-${j}`;
      add(p, [r, c], () => `La fila per la columna: ${v[r]} × ${v[c]}.`);
      add(r, [p, c], () => `Quin número per ${v[c]} fa ${v[p]}? ${v[p]} ÷ ${v[c]}.`);
      add(c, [p, r], () => `${v[r]} per quant fa ${v[p]}? ${v[p]} ÷ ${v[r]}.`);
    }
  } else if (sc.s === 'sym' || sc.s === 'fgrid' || sc.s === 'bal') {
    for (const L of sc.lines) {
      const ss = [...new Set([...L.lhs, ...L.rhs].filter(isSym))];
      const what = sc.s === 'bal' ? (sc.lines.length > 1 ? `A la balança ${+L.id.slice(1) + 1}` : 'A la balança') : sc.s === 'fgrid' ? `A la ${L.id[0] === 'r' ? 'fila' : 'columna'} que suma ${L.rhs[0]}` : `A la línia ${+L.id.slice(1) + 1}`;
      for (const s of ss) {
        const others = ss.filter(x => x !== s && x !== 'T');
        if (s === 'T') add('T', others, () => `Ara que saps què val cada dibuix, posa'ls a l'última línia: ${L.lhs.map(t => isSym(t) ? v[t] : t).join(' ')}.`, [L.id]);
        else if (!L.ask) add(s, others, () => sc.s === 'bal' && sc.pans.length === 1 && s === 'x' ? balSay(sc)
          : others.length ? `${what} ja saps quant val ${others.join(' i ')}. Posa-hi el seu número: quant ha de valer ${s}?` : `${what} només hi ha ${s}. Quin número fa que sigui veritat?`, [L.id]);
      }
    }
  } else if (sc.s === 'crypt') {
    const [x, y, z] = sc.op === '+' ? 'abc' : 'cba', len = sc.len, d = k => v[k] ?? 0, has = k => k in v;
    for (let i = 0; i < len; i++) {
      const col = [x + i, y + i, z + i].filter(has), right = [];
      for (let j = 0; j < i; j++) right.push(...[x + j, y + j, z + j].filter(has));
      const carry = () => { let c = 0; for (let j = 0; j < i; j++) c = (d(x + j) + d(y + j) + c) >= 10 ? 1 : 0; return c; };
      for (const k of col) {
        const o = col.filter(q => q !== k);
        add(k, [...o, ...right], () => {
          const c = carry(), more = c ? ' + 1 que portes' : '', where = `A la columna de les ${PLACE[i]}`;
          const test = sc.op === '−' ? 'Fes la prova amb una suma: el resultat més el número de sota ha de donar el de dalt. ' : '';
          return k[0] === z ? `${test}${where}: ${d(x + i)} + ${d(y + i)}${more}.` : `${test}${where}: ${d(k[0] === x ? y + i : x + i)} + ?${more} ha d'acabar en ${d(z + i)}.`;
        }, [...o]);
      }
    }
  }
  RELS.set(sc, out);
  return out;
}
function balSay(sc) {
  if (sc.hint) return sc.hint;
  const [L, R] = sc.pans[0], n = a => a.filter(t => t === 'x').length, w = a => sum(a.filter(t => t !== 'x'));
  const xs = n(L) - n(R), rest = xs > 0 ? w(R) - w(L) : w(L) - w(R);
  if (n(L) && n(R)) return 'Hi ha caixes als dos plats. Treu una caixa de cada plat (toca-la): la balança continua recta.';
  if (Math.abs(xs) > 1) return `Les ${Math.abs(xs)} caixes pesen igual${w(xs > 0 ? L : R) ? `. Primer, sense les peses del seu plat, pesen ${rest}` : ` i entre totes pesen ${rest}`}. Reparteix: ${rest} ÷ ${Math.abs(xs)}.`;
  const full = xs > 0 ? R : L;
  return `Quant pesa el plat que no té caixa? ${full.join(' + ')}. La caixa i el que l'acompanya han de pesar igual.`;
}
// the relation that works out hole k from what is known (a Set of keys), or null
export function relOf(sc, k, known) { return rels(sc).find(r => r.out === k && r.ins.every(i => known.has(i))) || null; }
// what the frog says of hole k: { text, lit }
export function hintOf(sc, k, known) {
  const r = relOf(sc, k, known);
  return r ? { text: r.say(), lit: r.lit } : { text: sc.hint || HINT[sc.s] || 'Mira què saps al voltant del forat.', lit: [] };
}
const HINT = { pyr: 'Comença per un maó que tingui els dos de sota, o el de sobre i el del costat.', magic: 'Busca una línia on només hi falti un número.',
  ser: 'Busca dos números seguits que coneguis: quin salt hi ha entre ells?', sym: 'Busca una línia on només hi hagi un dibuix que no saps.', fgrid: 'Busca una fila o una columna on només hi hagi un dibuix que no saps.',
  bal: 'Mira la balança on només hi ha una fruita que no saps.', crypt: 'Comença per la columna de la dreta, la de les unitats, i recorda el que portes.' };

/* ---------- the other puzzles ---------- */
// Tiles to place: shape (the places and the lines through them), the numbers of the tiles and what every line must add up to. fixed:
// { place: number } tiles already in their place; start: every place filled at first (two tiles swapped: the child swaps them back)
export const SHAPES = {
  cross5: [[0, 1, 2], [3, 1, 4]],
  tri6: [[0, 3, 1], [1, 4, 2], [2, 5, 0]],
  tri9: [[0, 3, 4, 1], [1, 5, 6, 2], [2, 7, 8, 0]],
  wheel7: [[1, 0, 4], [2, 0, 5], [3, 0, 6]],
  sq9: linesOf(3).map(L => L.map(k => 3 * +k[0] + +k[2])),
  pent10: [0, 1, 2, 3, 4].map(i => [i, 5 + i, (i + 1) % 5])
};
export const placesOf = shape => Math.max(...SHAPES[shape].flat()) + 1;
export const tiles = (shape, nums, target, o = {}) => ({ s: 'tiles', shape, nums, target, fixed: o.fixed || {}, start: o.start || null });
// what each line adds up to with the tiles placed (a list, one number or null per place): null for a line not full yet
export const lineSums = (shape, placed) => SHAPES[shape].map(L => L.every(i => placed[i] != null) ? sum(L.map(i => placed[i])) : null);
export const tilesDone = (sc, placed) => placed.length >= placesOf(sc.shape) && lineSums(sc.shape, placed).every(s => s === sc.target);

// A path of stones: rows of stones (a number adds itself; '+3', '×2', '−4', '÷2' do that), the number the frog starts with and the one
// the door at the end opens with. The frog goes in at the top left and out at the bottom right, one stone next to another, never twice
export const path = (rows, start, target) => { const grid = rows.map(r => r.split(' ')); return { s: 'path', grid, R: grid.length, C: grid[0].length, start, target }; };
// what a stone does to the number: NaN when it cannot (a division that is not exact, a take-away below zero)
export function stone(x, cell) { const y = /^\d+$/.test(cell) ? x + +cell : apply(x, cell); return Number.isInteger(y) && y >= 0 ? y : NaN; }

/* ---------- the rounds and the levels ---------- */
// A round: a scene and a question. type 'holes' (the holes of the scene, typed), 'pick' (one of opts; signs: the four signs), 'tap'
// (a thing of the scene: ans its keys), 'level' (weights put on a pan until it is level), 'tiles', 'path', 'explore' (every line of a
// magic square touched). text is the question, hint what the frog says after a slip, say what it says when it is done
const R = (scene, q) => ({ scene, q });
const lv = (title, say, rounds) => ({ title, say, rounds });
const one = sc => sc.holes.length === 1;
function askOf(sc) {
  switch (sc.s) {
    case 'pyr': return one(sc) ? 'Quin número va al maó buit?' : 'Omple els maons buits.';
    case 'magic': return sc.blank.length ? `Aquest quadrat màgic suma ${sc.cells.S}. Quin número va al centre?` : sc.gem ? 'Quant suma cada línia? Troba-ho i omple els forats.' : `Totes les línies sumen ${sc.cells.S}. Omple els forats.`;
    case 'lock': return 'Quin número obre el cadenat?';
    case 'mach': return sc.mode === 'in' ? 'Quin número ha entrat a la màquina?' : sc.steps.length > 1 ? 'Quins números surten?' : 'Quin número surt?';
    case 'ser': return one(sc) ? 'Quin número falta a la sèrie?' : 'Quins números falten a la sèrie?';
    case 'wheel': return 'Omple els forats de la roda.';
    case 'mgrid': return 'Omple els forats de la taula de multiplicar.';
    case 'sym': return sc.ask ? 'Quant val cada dibuix? I l\'última línia?' : 'Quant val cada dibuix?';
    case 'fgrid': return 'Quant val cada dibuix? Les sumes són a la dreta i a sota.';
    case 'bal': return sc.pans.length > 1 ? 'Les balances estan rectes. Quant pesa cada fruita?' : 'La balança està recta. Quant pesa la caixa?';
    case 'crypt': return one(sc) ? 'Quina xifra falta?' : 'Quines xifres falten?';
    default: return 'Quin número és?';
  }
}
function sayOf(sc) {
  const v = sc.cells;
  switch (sc.s) {
    case 'pyr': return `La torre s'aguanta: cada maó és ${sc.op === '+' ? 'la suma' : 'el producte'} dels dos de sota.`;
    case 'magic': return `Quadrat màgic: totes les línies sumen ${v.S}.`;
    case 'lock': return `${sc.toks.join(' ')}. El cadenat s'obre!`;
    case 'mach': return sc.steps.reduce((s, st, i) => `${s} → ${st} → ${v[`m${i + 1}`]}`, `${v.m0}`) + '.';
    case 'ser': return `${sc.vals.join(', ')}: ${new Set(sc.jumps).size === 1 ? `sempre ${sc.jumps[0]}` : `salts de ${sc.jumps.join(', ')}`}.`;
    case 'wheel': return `Cada número de la roda ${sc.op === '×' ? 'per' : 'entre'} ${v.c} dona el de fora.`;
    case 'mgrid': return 'Cada casella és la seva fila per la seva columna.';
    case 'crypt': return `${sc.nums[0]} ${sc.op} ${sc.nums[1]} = ${sc.nums[2]}.`;
    case 'riddle': return sc.steps ? `Era el ${v.x}! Comprova-ho: ${sc.steps.reduce((s, st) => ({ x: apply(s.x, st), t: `${s.t} → ${st} → ${apply(s.x, st)}` }), { x: v.x, t: `${v.x}` }).t}.` : `Era ${v.x}!`;
    case 'bal': if (sc.pans.length === 1 && 'x' in v) return `La caixa pesa ${v.x}.`;
    // falls through
    default: return sc.holes.map(k => `${k === 'T' ? 'L\'última línia' : k} = ${v[k]}`).join(' · ') + '.';
  }
}
// a round of holes, with the question and the line of the end its scene gives unless they are said
const H = (sc, text, say) => R(sc, { type: 'holes', text: text || askOf(sc), say: say || sayOf(sc) });
const Pk = (text, opts, hint, say, scene = null, o = {}) => R(scene, { type: 'pick', text, ans: opts[0], opts, hint, say, ...o });
// the sign of a padlock
const SignQ = str => { const sc = lock(str); return Pk('Quin signe obre el cadenat?', [sc.cells.x, ...SIGNS.filter(s => s !== sc.cells.x)], 'Prova cada signe: +, −, × i ÷. Quin fa que les dues bandes del = donin el mateix?', `${sc.toks.join(' ')}. El cadenat s'obre!`, sc, { signs: true, fixed: false }); };
// the rule of a machine from a table of what goes in and what comes out; opts[0] is the right one
function Rule(steps, xs, opts) {
  const table = xs.map(x => [x, steps.reduce(apply, x)]);
  return Pk('Quina regla fa aquesta màquina?', opts, 'Prova cada regla amb tots els números de la taula: ha de funcionar amb tots, no només amb un.',
    `${ruleText(steps)}: ${table.map(([a, b]) => `${a} → ${b}`).join(', ')}.`, { s: 'mach', steps, mode: 'rule', table, cells: {}, holes: [] }, { fixed: false });
}
// make the balance level: the left pan holds L, the right R0 at first; the child puts weights of the tray on the right
const Level = (L, R0 = []) => R({ s: 'bal', mode: 'level', pans: [[L, R0]], tray: [1, 2, 5, 10], vals: {}, lines: [], cells: {}, holes: [] },
  { type: 'level', text: R0.length ? 'Posa peses al plat de la dreta fins que la balança quedi recta.' : 'Posa peses al plat buit fins que la balança quedi recta.', hint: 'Si el plat de la dreta puja, li falta pes. Si baixa, li sobra: toca una pesa del plat per treure-la.', say: `Recta! Els dos plats pesen ${sum(L)}.` });
// three balances held level with a pin: which one stays level (or which one cheats) when the pin is taken out
function Three(items, cheat) {
  const its = items.map(([L, R], i) => ({ k: 'abc'[i], L, R })), ok = it => sum(it.L) === sum(it.R), ans = its.filter(it => cheat ? !ok(it) : ok(it)).map(it => it.k);
  return R({ s: 'bal3', items: its }, { type: 'tap', text: cheat ? 'Una de les balances fa trampa: la seva agulla l\'aguanta recta, però els plats no pesen igual. Quina és? Toca-la.' : 'Les agulles aguanten les balances rectes. Quina quedarà recta quan les traguem? Toca-la.',
    ans, hint: 'Suma les peses de cada plat. Una balança queda recta quan els dos plats sumen el mateix.', say: its.map(it => `${it.L.join(' + ')} ${ok(it) ? '=' : '≠'} ${it.R.join(' + ')}`).join(' · ') });
}
const Tl = (shape, nums, target, text, say, o = {}) => R(tiles(shape, nums, target, o), { type: 'tiles', text, say, hint: o.hint || 'Prova i canvia: una fitxa es pot moure tantes vegades com calgui. Mira la suma de cada línia.' });
const Pa = (rows, start, target, text, say) => R(path(rows, start, target), { type: 'path', text, say, hint: `Mira el número de la granota a cada pas. Abans de saltar, pensa què farà la pedra. Pots tornar enrere.` });
const Ex = (grid, o, say) => R(magic(grid, null, { explore: true, ...o }), { type: 'explore', text: 'Toca les fletxes: quant suma cada línia?', say });

const CROSS = 'Posa les fitxes perquè la fila i la columna sumin igual. La del mig és de totes dues!';
const TRI = n => `Posa les fitxes perquè cada costat del triangle sumi ${n}.`;
const SWAP = 'Dues fitxes estan canviades de lloc. Toca\'n una i després l\'altra per intercanviar-les.';

/* ---------- the projects ---------- */
export const PROJECTS = [
  { name: 'Torres de maons', sub: 'Cada maó, la suma dels dos de sota', ico: '🧱', levels: [
    lv('Construeix la torre', 'Cada maó és la suma dels dos que té a sota. Omple els maons buits, de baix a dalt!', [
      H(pyr([2, 3, 4], '?', '??', '...')), H(pyr([5, 1, 6], '?', '??', '...')), H(pyr([4, 4, 2], '?', '??', '...'))]),
    lv('Quatre pisos', 'Una torre més alta. Cada maó continua sent la suma dels dos de sota.', [
      H(pyr([3, 1, 4, 2], '?', '??', '???', '....')), H(pyr([2, 5, 3, 6], '?', '??', '???', '....'))]),
    lv('Torres de desenes', 'Números més grans, la mateixa regla.', [
      H(pyr([12, 25, 18], '?', '??', '...')), H(pyr([30, 15, 40, 25], '?', '??', '???', '....'))]),
    lv('El maó de baix', 'Ara falta un maó de baix! Si a sobre hi ha 9 i al costat 4, pensa: 4 més quant fa 9? Es fa al revés: 9 − 4.', [
      H(pyr([4, 5, 3], '.', '..', '.?.')), H(pyr([6, 2, 7], '.', '..', '?..')), H(pyr([3, 8, 4], '.', '.?', '..?'))]),
    lv('Amunt i avall', 'Uns maons es troben sumant, i d\'altres restant. Comença pels que puguis!', [
      H(pyr([5, 2, 6, 3], '.', '?.', '.?.', '?..?')), H(pyr([4, 7, 1, 5], '?', '.?', '?..', '.?..'))]),
    lv('La resta amaga', 'Gairebé tots els forats són a baix. Restant, els trobaràs.', [
      H(pyr([6, 3, 8, 2], '.', '..', '...', '?.?.')), H(pyr([7, 5, 9, 4], '.', '..', '...', '?..?')), H(pyr([2, 6, 5, 3], '.', '.?', '?.?', '.?..'))]),
    lv('Torres de centenars', 'Centenars! Suma i resta amb calma.', [
      H(pyr([125, 250, 75], '?', '.?', '?..')), H(pyr([150, 200, 350], '.', '?.', '.?.'))]),
    lv('Pocs maons', 'Només hi ha uns quants maons. Amb ells, els trobaràs tots!', [
      H(pyr([3, 4, 2, 5], '.', '.?', '.??', '.???')), H(pyr([6, 1, 3, 2], '.', '?.', '??.', '???.'))]),
    lv('El maó que compta dues vegades', 'Una torre amb truc: el maó del mig de baix va als dos maons del mig. Compta dues vegades!', [
      H(twice(5, 4, 7), null, 'Has descobert un truc d\'àlgebra: el maó del mig compta dues vegades!'), H(twice(3, 6, 9), null, '3 + 6 + 6 + 9 = 24. El del mig compta dues vegades!'),
      H(twice(10, 15, 10), null, '10 + 15 + 15 + 10 = 50. Ja domines el truc!')]),
    lv('Repte de la torre', 'Una torre de cinc pisos. Tu pots!', [
      H(pyr([2, 3, 1, 4, 2], '?', '..', '?.?', '.?.?', '.?..?')), H(pyr([10, 5, 20, 15, 5], '.', '?.', '.??', '?..?', '.?.?.'))])
  ] },
  { name: 'La balança', sub: 'El signe = vol dir que pesen igual', ico: '⚖️', levels: [
    lv('Equilibra-la', 'Quan els dos plats pesen el mateix, la balança queda recta. Toca les peses de sota per posar-les al plat!', [Level([7]), Level([5, 4]), Level([10, 3])]),
    lv('Recta o torta?', 'Ara un plat ja té alguna pesa. Quant hi falta?', [Level([8, 4], [5]), Level([6, 6], [10]),
      Three([[[6, 4], [7, 2]], [[5, 5], [8, 2]], [[9, 1], [3, 6]]])]),
    lv('La caixa misteriosa', 'La balança està recta: la caixa i les peses del seu plat pesen igual que l\'altre plat.', [
      H(bal(['x', 3], [10], 7)), H(bal(['x', 6], [15], 9)), H(bal([4, 'x'], [12], 8))]),
    lv('El signe =', 'El signe = vol dir que les dues bandes valen igual, com una balança recta. Primer suma el plat que està complet!', [
      H(bal([8, 4], ['x', 5], 7)), H(bal([6, 7], [10, 'x'], 3)), H(bal([9, 6], ['x', 7], 8))]),
    lv('Treu el mateix de tots dos plats', 'Si treus el mateix pes dels dos plats, la balança continua recta. Toca una pesa que també sigui a l\'altre plat!', [
      H(bal(['x', 5, 2], [5, 9], 7)), H(bal(['x', 10, 1], [10, 6], 5)), H(bal([3, 'x', 3], [3, 3, 8], 8))]),
    lv('Dues caixes iguals', 'Les caixes són iguals: pesen el mateix. Reparteix el pes entre totes!', [
      H(bal(['x', 'x'], [14], 7)), H(bal(['x', 'x', 4], [16], 6)), H(bal(['x', 'x', 'x'], [10, 5], 5))]),
    lv('Caixes als dos plats', 'Ara hi ha caixes als dos plats. Treu-ne una de cada plat!', [
      H(bal(['x', 'x', 'x'], ['x', 10], 5)), H(bal(['x', 'x', 'x', 'x'], ['x', 'x', 12], 6)), H(bal(['x', 'x', 5], ['x', 13], 8))]),
    lv('Fruites que pesen', 'Dues balances. Primer, la que té una sola fruita que no saps!', [
      H(bals([[['🍎'], [3, 3]], [['🍎', '🍐'], [10]]], { '🍎': 6, '🍐': 4 })),
      H(bals([[['🍐', '🍐'], ['🍎']], [['🍎', '🍐'], [12]]], { '🍐': 4, '🍎': 8 }, { hint: 'A la primera balança, un 🍎 pesa com dues 🍐. A la segona, canvia el 🍎 per dues 🍐: tres 🍐 pesen 12.' }))]),
    lv('La balança tramposa', 'Les agulles aguanten les balances rectes, però una fa trampa.', [
      Three([[[6, 7], [10, 3]], [[4, 9], [8, 6]], [[12], [5, 5, 2]]], true), Three([[[15, 5], [10, 10]], [[7, 7], [9, 5]], [[20], [8, 8, 3]]], true)]),
    lv('Repte de la balança', 'Tot el que saps de les balances!', [
      H(bal(['x', 'x', 6], ['x', 15], 9)), H(bal([15, 9], ['x', 12], 12)), H(bals([[['🍌', '🍌'], [10]], [['🍌', '🍒'], [9]]], { '🍌': 5, '🍒': 4 }))])
  ] },
  { name: 'Els cadenats', sub: 'El número que obre el cadenat', ico: '🔒', levels: [
    lv('Sumes amb forat', 'Cada cadenat s\'obre amb un número: el que fa que l\'operació sigui veritat.', [H(lock('[6] + 4 = 10')), H(lock('7 + [5] = 12')), H(lock('[9] + 8 = 17'))]),
    lv('Restes amb forat', 'Ara són restes. Pensa què treus i què et queda.', [H(lock('15 − [6] = 9')), H(lock('[20] − 7 = 13')), H(lock('30 − [12] = 18'))]),
    lv('Fes la prova', 'Números més grans. Quan el tinguis, fes la prova: l\'operació al revés.', [H(lock('[36] + 27 = 63')), H(lock('85 − [38] = 47')), H(lock('[54] − 26 = 28'))]),
    lv('Multiplicacions amb forat', 'Quina taula és? Busca el número que hi falta.', [H(lock('6 × [7] = 42')), H(lock('[8] × 5 = 40')), H(lock('9 × [6] = 54'))]),
    lv('Divisions amb forat', 'Una divisió amb forat es resol amb una multiplicació.', [H(lock('56 ÷ [7] = 8')), H(lock('[27] ÷ 3 = 9')), H(lock('48 ÷ [6] = 8'))]),
    lv('Quin signe falta?', 'Ara el forat és un signe: +, −, × o ÷.', [SignQ('12 [÷] 3 = 4'), SignQ('7 [×] 8 = 56'), SignQ('25 [−] 9 = 16'), SignQ('14 [+] 9 = 23')]),
    lv('El forat a l\'altra banda', 'El = no vol dir «dona»: vol dir que les dues bandes valen igual. Pot anar a qualsevol lloc!', [
      H(lock('40 = [25] + 15')), H(lock('63 = 7 × [9]')), H(lock('50 − 20 = [6] × 5', { hint: 'Primer, quant val la banda sense forat? 50 − 20. L\'altra banda ha de valer igual: quin número per 5?' }))]),
    lv('Dues operacions', 'Dues operacions seguides. Desfés-les des del final!', [
      H(lock('[5] × 4 + 3 = 23', { hint: 'Desfés el + 3: 23 − 3 = 20. Després, quin número per 4 fa 20?' })),
      H(lock('6 × [3] + 10 = 28', { hint: 'Desfés el + 10: 28 − 10 = 18. Després, 6 per quant fa 18?' })),
      H(lock('[10] ÷ 2 + 7 = 12', { hint: 'Desfés el + 7: 12 − 7 = 5. Després, quin número entre 2 fa 5?' }))]),
    lv('Números grans', 'Centenars! La mateixa idea, amb números grans.', [H(lock('[245] + 380 = 625')), H(lock('900 − [356] = 544')), H(lock('[125] × 4 = 500'))]),
    lv('Repte dels cadenats', 'Tots els cadenats barrejats!', [H(lock('8 × [7] = 56')), H(lock('100 − [37] = 63')), SignQ('13 [×] 3 = 39'), H(lock('45 = [9] × 5'))])
  ] },
  { name: 'Quadrats màgics', sub: 'Files, columnes i diagonals sumen igual', ico: '✨', levels: [
    lv('La tortuga de la Xina', 'Fa molts anys, a la Xina, una tortuga va sortir del riu amb aquest quadrat a la closca. Mira què té de màgic!', [
      Ex(LS, { look: 'turtle' }, 'Totes les línies sumen 15: les files, les columnes i les dues diagonals!'), H(magic(LS, ['.?.', '...', '.?.'], { look: 'turtle' }))]),
    lv('Un forat per línia', 'Cada línia suma igual. Si en una línia només falta un número, ja el tens!', [
      H(magic(turn(LS), ['?..', '..?', '.?.'])), H(magic(turn(turn(LS)), ['.?.', '?..', '..?'])), H(magic(map(LS, x => x + 5), ['..?', '.?.', '?..']))]),
    lv('Quant sumen?', 'Ara no saps quant sumen les línies! Busca primer una línia sencera, sense forats.', [
      H(magic(map(LS, x => x * 2), ['...', '?.?', '.?.'], { gem: true })), H(magic(map(LS, x => x + 10), ['?..', '...', '..?'], { gem: true }))]),
    lv('Més forats', 'Més forats. Comença per una línia on només en falti un, i després continua.', [
      H(magic([...LS].reverse(), ['?.?', '.?.', '?..'])), H(magic(map(LS, x => x * 3), ['.?.', '?..', '.?.']))]),
    lv('El centre màgic', 'Un secret: en un quadrat màgic de 3 × 3, el número del centre és la tercera part de la suma.', [
      H(magic(map(LS, x => x + 3), ['___', '_?_', '___'])), H(magic(map(LS, x => x * 2), ['___', '_?_', '___'])), H(magic(map(LS, x => x + 10), ['___', '_?_', '___']))]),
    lv('Màgia que es transforma', 'Si sumes el mateix a tots els números d\'un quadrat màgic, continua sent màgic!', [
      H(magic(map(LS, x => x + 2), ['...', '...', '...'], { gem: true }), 'S\'ha sumat 2 a tots els números de la tortuga. Quant suma ara cada línia?', 'Abans sumava 15. Ara cada línia té 3 números amb 2 més: 15 + 6 = 21.'),
      H(magic(map(LS, x => x * 10), ['.?.', '...', '?..'])),
      Pk('Si multipliques per 2 tots els números d\'un quadrat que suma 15, quant suma el nou quadrat?', ['30', '17', '15'], 'Cada número es fa el doble. La suma de la línia també!', 'El doble de 15: 30.', magic(LS, null, { look: 'turtle' }))]),
    lv('Quadrats de 4', 'El pintor Albert Dürer va fer aquest quadrat de 4 × 4 l\'any 1514. Mira la fila de baix: hi ha amagat l\'any!', [
      Ex(DURER, { look: 'durer' }, 'Totes sumen 34! I a la fila de baix, al mig: 15 i 14, l\'any 1514.'), H(magic(DURER, ['.?..', '..?.', '?...', '...?'], { look: 'durer' }))]),
    lv('Números grans', 'Quadrats màgics de números grans. La mateixa màgia!', [
      H(magic(map(LS, x => x * 10 + 100), ['?.?', '.?.', '?..'])), H(magic(map(LS, x => x * 5), ['...', '?.?', '.?.'], { gem: true }))]),
    lv('La Sagrada Família', 'A la façana de la Passió de la Sagrada Família, a Barcelona, l\'escultor Subirachs hi va posar un quadrat màgic. Quant suma?', [
      Ex(GAUDI, { look: 'gaudi' }, 'Totes les línies sumen 33. I fixa\'t: té dos 14 i dos 10, i no hi ha ni el 12 ni el 16!'), H(magic(GAUDI, ['.?..', '..?.', '?...', '...?'], { look: 'gaudi' }))]),
    lv('Repte màgic', 'El repte final dels quadrats. Busca bé la línia que t\'ho diu tot!', [
      H(magic(DURER, ['?...', '.?..', '..?.', '...?'], { gem: true, look: 'durer' })), H(magic(map(LS, x => x * 7), ['?..', '...', '..?'], { gem: true }))])
  ] },
  { name: 'Les màquines', sub: 'Entra un número i en surt un altre', ico: '⚙️', levels: [
    lv('La màquina', 'Entra un número per l\'esquerra, la màquina li fa una operació i en surt un altre per la dreta.', [H(mach(['+5'], 3, 'out')), H(mach(['×2'], 6, 'out')), H(mach(['−4'], 10, 'out'))]),
    lv('Dues màquines seguides', 'El que surt de la primera màquina entra a la segona.', [H(mach(['×2', '+3'], 4, 'out')), H(mach(['+6', '×2'], 1, 'out')), H(mach(['−5', '×3'], 9, 'out'))]),
    lv('La màquina al revés', 'Ara saps què surt, però no què ha entrat! Fes anar la màquina al revés: el que sumava, ara resta.', [H(mach(['+5'], 7, 'in')), H(mach(['×3'], 6, 'in')), H(mach(['−4'], 13, 'in'))]),
    lv('Al revés amb dues', 'Dues màquines al revés: comença per l\'última!', [H(mach(['×2', '+3'], 6, 'in')), H(mach(['+4', '×5'], 4, 'in')), H(mach(['−3', '÷2'], 15, 'in'))]),
    lv('Quina és la regla?', 'La taula diu què ha entrat i què ha sortit. Quina operació fa la màquina?', [
      Rule(['×3'], [2, 5, 7], ['×3', '+4', '×2']), Rule(['+6'], [1, 4, 10], ['+6', '×2', '×7']), Rule(['−3'], [5, 9, 12], ['−3', '÷3', '−2'])]),
    lv('La màquina que es repeteix', 'Si el número que surt torna a entrar a la màquina, i torna a entrar... surt una sèrie!', [
      H(ser([3, 7, 11, 15, 19, 23], '...?.?')), H(ser([50, 45, 40, 35, 30, 25], '..?.?.')), H(ser([1, 2, 4, 8, 16, 32], '...?.?'))]),
    lv('Sèries amb forats', 'Els forats poden ser al principi, al mig o al final.', [
      H(ser([6, 12, 18, 24, 30, 36], '?...?.')), H(ser([100, 90, 80, 70, 60, 50], '.?..?.')),
      Pk('Quina és la regla d\'aquesta sèrie?', ['+5', '+4', '×2'], 'Resta dos números seguits: quant s\'hi afegeix cada vegada?', 'De 5 en 5: 4, 9, 14, 19, 24.', ser([4, 9, 14, 19, 24], '.....'), { fixed: false })]),
    lv('Sèries que salten', 'Aquestes sèries no salten sempre igual. Mira bé els salts!', [
      H(ser([2, 5, 6, 9, 10, 13], '...?.?'), null, 'Salts de +3 i +1, l\'un darrere l\'altre!'), H(ser([1, 2, 4, 7, 11, 16], '...?.?'), null, 'Els salts creixen: +1, +2, +3, +4, +5!'), H(ser([1, 3, 9, 27, 81], '..?.?'))]),
    lv('La regla de dues passes', 'Ara la màquina fa dues operacions. Prova cada regla amb tots els números!', [
      Rule(['×2', '+3'], [1, 2, 3], ['×2 i +3', '+4', '×3 i +2']), Rule(['×10', '−1'], [1, 2, 5], ['×10 i −1', '+8', '×9']), Rule(['+1', '×2'], [1, 3, 4], ['+1 i ×2', '×2 i +1', '+3'])]),
    lv('Repte de les màquines', 'Màquines endavant, al revés i sèries!', [H(mach(['×4', '−6'], 5, 'in')), H(mach(['÷2', '+9'], 16, 'out')), H(ser([5, 10, 20, 40, 80], '..?.?'))])
  ] },
  { name: 'Multiplica i divideix', sub: 'Torres de multiplicar i la roda', ico: '🎡', levels: [
    lv('Torres de multiplicar', 'En aquestes torres, cada maó és el producte dels dos de sota: es multiplica!', [
      H(pyr([2, 3, 1], '?', '??', '...', { op: '×' })), H(pyr([3, 2, 2], '?', '??', '...', { op: '×' })), H(pyr([1, 4, 2], '?', '??', '...', { op: '×' }))]),
    lv('Quatre pisos de multiplicar', 'Més alta! Amb uns i dosos, els números creixen de pressa.', [H(pyr([1, 2, 1, 3], '?', '??', '???', '....', { op: '×' })), H(pyr([2, 1, 2, 1], '?', '??', '???', '....', { op: '×' }))]),
    lv('El maó de baix es divideix', 'Si a sobre hi ha 12 i al costat 3, quin número per 3 fa 12? Es fa al revés: 12 ÷ 3.', [
      H(pyr([3, 4, 2], '.', '..', '.?.', { op: '×' })), H(pyr([5, 2, 3], '?', '..', '?..', { op: '×' })), H(pyr([2, 5, 4], '.', '.?', '..?', { op: '×' }))]),
    lv('La roda de multiplicar', 'El número del centre multiplica cada número de la roda, i el resultat va a fora.', [H(wheel('×', 6, [2, 5, 3, 7, 4, 9], ['o0', 'o1', 'o2', 'o3', 'o4', 'o5'])), H(wheel('×', 8, [3, 6, 2, 9, 5, 7], ['o0', 'o2', 'o3', 'o5']))]),
    lv('La roda al revés', 'Ara falten números de dins de la roda. Quin número per 7 fa 21?', [H(wheel('×', 7, [3, 8, 4, 6, 9, 5], ['s0', 's2', 's4', 'o1'])), H(wheel('×', 9, [4, 7, 2, 8, 6, 3], ['s1', 's3', 's5', 'o0']))]),
    lv('Quin és el centre?', 'El centre de la roda és un forat. Busca un número de dins amb el seu de fora!', [H(wheel('×', 8, [4, 6, 3, 7, 9, 2], ['c', 's2', 'o4'])), H(wheel('×', 6, [5, 9, 4, 8, 3, 7], ['c', 'o1', 's3']))]),
    lv('La roda de dividir', 'Aquesta roda divideix: cada número de dins, entre el del centre, dona el de fora.', [H(wheel('÷', 4, [20, 36, 12, 28, 8, 40], ['o0', 'o1', 'o2', 'o3', 'o4', 'o5'])), H(wheel('÷', 5, [15, 40, 25, 45, 10, 35], ['s0', 's2', 's4', 'o1']))]),
    lv('La taula amagada', 'Una taula de multiplicar amb forats. Fins i tot falten números de les vores!', [H(mgrid([3, 4, 6], [2, 5, 7], ['r0', 'c1', 'p2-2', 'p1-0'])), H(mgrid([7, 8, 9], [3, 6, 4], ['r1', 'r2', 'c0', 'c2', 'p0-1']))]),
    lv('Grans multiplicacions', 'Una torre de quatre pisos i una taula amb moltes vores amagades.', [
      H(pyr([2, 1, 3, 1], '.', '?.', '.?.', '?..?', { op: '×' })), H(mgrid([5, 3], [4, 8, 6], ['r1', 'c0', 'c2', 'p0-1', 'p1-1']))]),
    lv('Repte de multiplicar', 'Torres, rodes i taules!', [H(wheel('×', 9, [6, 3, 8, 5, 7, 4], ['c', 's1', 'o3', 's5'])), H(pyr([2, 3, 2], '?', '?.', '.?.', { op: '×' })), H(mgrid([4, 9], [6, 7], ['r0', 'c1', 'p1-0']))])
  ] },
  { name: 'Símbols secrets', sub: 'Cada dibuix amaga un número', ico: '🐸', levels: [
    lv('Granotes iguals', 'Cada dibuix amaga un número. El mateix dibuix, el mateix número!', [H(sym({ '🐸': 5 }, ['🐸 + 🐸 + 🐸'])), H(sym({ '🦆': 6 }, ['🦆 + 🦆'])), H(sym({ '🐟': 7 }, ['🐟 + 🐟 + 🐟 + 🐟']))]),
    lv('Dos dibuixos', 'Primer la línia que només té un dibuix. Després, ja el saps per a la següent!', [
      H(sym({ '🐸': 4, '🦆': 9 }, ['🐸 + 🐸', '🐸 + 🦆'])), H(sym({ '🍎': 6, '🍐': 3 }, ['🍎 + 🍎 + 🍎', '🍎 + 🍐 + 🍐'])), H(sym({ '⭐': 8, '🌙': 2 }, ['⭐ + ⭐', '⭐ − 🌙']))]),
    lv('Tres dibuixos', 'Tres dibuixos secrets. Un rere l\'altre!', [H(sym({ '🐸': 3, '🦆': 7, '🐢': 5 }, ['🐸 + 🐸 + 🐸', '🐸 + 🦆', '🦆 + 🐢 + 🐸'])), H(sym({ '🍎': 10, '🍌': 4, '🍒': 2 }, ['🍎 + 🍎', '🍎 − 🍌', '🍌 + 🍒 + 🍒']))]),
    lv('Amb multiplicacions', 'Ara també es multiplica. I al final, una línia que has de calcular tu!', [
      H(sym({ '🍎': 6, '🍌': 4 }, ['🍎 × 3', '🍎 + 🍌'], { ask: '🍌 × 🍎' })), H(sym({ '🚀': 9, '🌍': 3 }, ['🚀 + 🚀 + 🚀', '🚀 ÷ 🌍'], { ask: '🚀 × 🌍' })), H(sym({ '🎈': 7, '🎁': 5 }, ['🎈 × 2', '🎈 + 🎁'], { ask: '🎁 × 🎁 − 🎈' }))]),
    lv('La graella de dibuixos', 'Cada fila suma el número de la dreta, i cada columna el de sota. Busca una fila amb un sol dibuix!', [
      H(fgrid({ '🍎': 4, '🍌': 3 }, [['🍎', '🍎', '🍎'], ['🍎', '🍌', '🍌'], ['🍌', '🍌', '🍎']])), H(fgrid({ '🍓': 5, '🍋': 2, '🍇': 6 }, [['🍓', '🍓', '🍓'], ['🍓', '🍋', '🍋'], ['🍇', '🍋', '🍓']]))]),
    lv('Graelles de tres dibuixos', 'Tres dibuixos a la graella. Quan en saps un, la resta ve sola.', [
      H(fgrid({ '🌙': 4, '🌟': 6, '☀️': 9 }, [['🌙', '🌙', '🌙'], ['🌙', '🌟', '🌟'], ['☀️', '🌟', '🌙']])), H(fgrid({ '🐸': 7, '🐟': 3, '🦆': 5 }, [['🐟', '🐸', '🐟'], ['🐸', '🐸', '🐸'], ['🦆', '🐟', '🐸']]))]),
    lv('Les xifres amagades', 'Una suma en columna amb xifres amagades. Comença per les unitats, i no t\'oblidis del que portes!', [H(crypt(437, 266, '+', ['4?7', '26?', '703'])), H(crypt(258, 374, '+', ['25?', '?74', '6?2']))]),
    lv('Restes trencades', 'Ara és una resta. Truc: el resultat més el número de sota dona el de dalt!', [H(crypt(725, 348, '−', ['7?5', '34?', '377'])), H(crypt(600, 254, '−', ['600', '2?4', '34?']))]),
    lv('Suma i diferència', 'Aquí cap línia té un sol dibuix. Prova números que facin veritat les dues línies alhora!', [
      H(sym({ '🐸': 8, '🦆': 4 }, ['🐸 + 🦆', '🐸 − 🦆'], { hint: 'Busca dos números que sumin 12 i que, restats, donin 4. Prova: 7 i 5? 8 i 4?' })),
      H(sym({ '🍎': 9, '🍐': 6 }, ['🍎 + 🍐', '🍎 − 🍐'], { hint: 'Dos números que sumin 15 i que es portin 3. Prova parelles: 8 i 7, 9 i 6...' })),
      H(sym({ '⭐': 5, '🌙': 3 }, ['⭐ × 🌙', '⭐ + 🌙'], { hint: 'Quins dos números multiplicats fan 15? I d\'aquests, quins sumen 8?' }))]),
    lv('Repte secret', 'Tot el que saps dels símbols secrets!', [
      H(sym({ '🐢': 6, '🐸': 8, '🦆': 3 }, ['🐢 + 🐢', '🐢 + 🐸', '🐸 − 🦆 − 🦆'], { ask: '🐢 × 🦆 + 🐸' })), H(fgrid({ '🍒': 3, '🍉': 8, '🍍': 5 }, [['🍒', '🍉', '🍒'], ['🍍', '🍍', '🍍'], ['🍉', '🍒', '🍍']])),
      H(crypt(386, 457, '+', ['3?6', '45?', '843']))])
  ] },
  { name: 'Triangles màgics', sub: 'Fitxes que sumen igual a cada costat', ico: '🔺', levels: [
    lv('La creu', 'Toca una fitxa i després un cercle per posar-la. Pots moure-les tantes vegades com vulguis!', [
      Tl('cross5', [1, 2, 3, 4, 5], 9, `${CROSS} Cada línia ha de sumar 9.`, '4 + 3 + 2 = 9 i 5 + 3 + 1 = 9. El 3 del mig compta a totes dues!', { fixed: { 1: 3 } }),
      Tl('cross5', [1, 2, 3, 4, 5], 10, `${CROSS} Cada línia ha de sumar 10.`, 'Amb el 5 al mig: 1 + 5 + 4 i 2 + 5 + 3.', { hint: 'La fitxa del mig compta dues vegades. Quina hi has de posar perquè les dues línies arribin a 10?' }),
      Tl('cross5', [1, 2, 3, 4, 5], 8, `${CROSS} Cada línia ha de sumar 8.`, 'Amb l\'1 al mig: 2 + 1 + 5 i 3 + 1 + 4.', { hint: 'Per sumar poc, al mig hi va una fitxa petita.' })]),
    lv('El triangle de sis', 'Sis fitxes, tres costats. Cada costat té tres cercles: dues puntes i el del mig.', [
      Tl('tri6', [1, 2, 3, 4, 5, 6], 9, TRI(9), 'Les puntes 1, 2 i 3, i al mig 6, 4 i 5. Tots els costats, 9!', { fixed: { 0: 1, 1: 2, 2: 3 } }),
      Tl('tri6', [1, 2, 3, 4, 5, 6], 9, TRI(9), 'Ho tens! Les fitxes petites, a les puntes, perquè compten a dos costats.', { hint: 'Les fitxes de les puntes són de dos costats. Per sumar només 9, posa-hi les més petites.' })]),
    lv('Altres sumes', 'Amb les mateixes fitxes es poden fer costats de 10, d\'11 i de 12!', [
      Tl('tri6', [1, 2, 3, 4, 5, 6], 10, TRI(10), 'A les puntes, 1, 3 i 5.', { hint: 'Prova a les puntes l\'1, el 3 i el 5.' }),
      Tl('tri6', [1, 2, 3, 4, 5, 6], 11, TRI(11), 'A les puntes, 2, 4 i 6.', { hint: 'Prova a les puntes el 2, el 4 i el 6.' }),
      Tl('tri6', [1, 2, 3, 4, 5, 6], 12, TRI(12), 'A les puntes, les grans: 4, 5 i 6.', { hint: 'Per sumar molt, a les puntes hi van les fitxes grans.' })]),
    lv('El triangle gran', 'Nou fitxes: cada costat té quatre cercles!', [
      Tl('tri9', [1, 2, 3, 4, 5, 6, 7, 8, 9], 17, TRI(17), 'Nou fitxes al seu lloc. Quin triangle!', { fixed: { 0: 1, 1: 2, 2: 3 } }),
      Tl('tri9', [1, 2, 3, 4, 5, 6, 7, 8, 9], 20, TRI(20), 'Costats de 20. Molt ben pensat!', { fixed: { 0: 4, 1: 5, 2: 6 } })]),
    lv('La roda de set', 'Set fitxes: una al centre i sis al voltant. Cada línia passa pel centre!', [
      Tl('wheel7', [1, 2, 3, 4, 5, 6, 7], 12, 'Cada línia de tres, passant pel centre, ha de sumar 12.', 'El 4 al centre, i a cada costat dues que sumen 8: 1 i 7, 2 i 6, 3 i 5.', { hint: 'La fitxa del centre és a totes les línies. Prova-hi la del mig de totes, el 4.' }),
      Tl('wheel7', [1, 2, 3, 4, 5, 6, 7], 10, 'Ara cada línia ha de sumar 10.', 'L\'1 al centre, i les parelles que sumen 9.', { hint: 'Per sumar poc, al centre hi va una fitxa petita.' }),
      Tl('wheel7', [1, 2, 3, 4, 5, 6, 7], 14, 'I ara cada línia ha de sumar 14.', 'El 7 al centre, i les parelles que sumen 7.', { hint: 'Per sumar molt, al centre hi va la fitxa més gran.' })]),
    lv('Fes el quadrat màgic', 'Ara el quadrat màgic el fas tu! Les nou fitxes, de l\'1 al 9.', [
      Tl('sq9', [1, 2, 3, 4, 5, 6, 7, 8, 9], 15, 'Totes les files, columnes i diagonals han de sumar 15.', 'Has fet el quadrat de la tortuga!', { fixed: { 4: 5 }, hint: 'Les fitxes parells van a les cantonades, i les senars al mig dels costats.' }),
      Tl('sq9', [1, 2, 3, 4, 5, 6, 7, 8, 9], 15, 'Un altre cop, però ara el 2 és a la cantonada.', 'Quadrat màgic fet per tu!', { fixed: { 0: 2 }, hint: 'Al centre hi va el 5. A la cantonada de davant del 2, el que suma 10 amb el 5 i el 2: el 8.' })]),
    lv('Fitxes grosses', 'Les mateixes formes, amb fitxes més grans.', [
      Tl('tri6', [2, 4, 6, 8, 10, 12], 20, TRI(20), 'Són les de 1 a 6, però el doble!', { hint: 'Les fitxes són el doble de les d\'1 a 6. A les puntes, 2, 6 i 10.' }),
      Tl('cross5', [10, 20, 30, 40, 50], 90, `${CROSS} Cada línia ha de sumar 90.`, 'El 30 al mig, com el 3 de la primera creu.', { hint: 'És com la creu d\'1 a 5 de suma 9, però per 10.' })]),
    lv('El pentàgon', 'Un pentàgon: cinc costats de tres cercles. Deu fitxes, de l\'1 al 10!', [
      Tl('pent10', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 14, 'Cada costat del pentàgon ha de sumar 14.', 'Un pentàgon màgic!', { fixed: { 0: 1, 1: 3, 2: 5, 3: 2, 4: 4 } }),
      Tl('pent10', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 17, 'Ara cada costat ha de sumar 17.', 'Pentàgon de 17!', { fixed: { 0: 6, 1: 2 } })]),
    lv('Arregla-ho', 'La granota ho ha fet gairebé bé, però s\'ha equivocat amb dues fitxes.', [
      Tl('tri6', [1, 2, 3, 4, 5, 6], 9, `${SWAP} Cada costat ha de sumar 9.`, 'Arreglat!', { start: [1, 2, 3, 4, 6, 5] }),
      Tl('wheel7', [1, 2, 3, 4, 5, 6, 7], 12, `${SWAP} Cada línia ha de sumar 12.`, 'El 4 al centre!', { start: [7, 1, 2, 3, 4, 6, 5] }),
      Tl('sq9', [1, 2, 3, 4, 5, 6, 7, 8, 9], 15, `${SWAP} Tot ha de sumar 15.`, 'Quadrat arreglat!', { start: [4, 9, 2, 3, 5, 7, 1, 8, 6] })]),
    lv('Repte de les fitxes', 'Tres formes, sense ajudes!', [
      Tl('cross5', [3, 6, 9, 12, 15], 27, `${CROSS} Cada línia ha de sumar 27.`, 'El 9 al mig!'),
      Tl('tri9', [1, 2, 3, 4, 5, 6, 7, 8, 9], 19, TRI(19), 'Costats de 19!', { fixed: { 0: 1 } }),
      Tl('pent10', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 14, 'Cada costat del pentàgon ha de sumar 14.', 'Pentàgon màgic, sense ajudes!', { fixed: { 0: 1, 1: 3 } })])
  ] },
  { name: 'Camins i endevinalles', sub: 'Laberints i números pensats', ico: '🌀', levels: [
    lv('El camí de sumes', 'La granota vol arribar a la porta. Cada pedra suma el seu número, i la porta només s\'obre si hi arribes amb el número que hi diu!', [
      Pa(['3 5 2', '4 1 6', '2 7 3'], 0, 17, 'Toca les pedres per saltar d\'una a l\'altra. Arriba a la porta amb el número que diu.', 'La porta s\'obre!'),
      Pa(['2 6 1', '5 3 4', '1 8 2'], 0, 25, 'Un altre camí. Quines pedres has de trepitjar?', 'Camí trobat!')]),
    lv('Camins més llargs', 'Laberints més amples. Pots tornar enrere sempre que vulguis!', [
      Pa(['4 2 7 1', '3 9 5 6', '8 1 2 4'], 0, 38, 'Arriba a la porta amb el número que diu.', 'Ho has trobat!'),
      Pa(['5 3 6 2', '1 7 4 8', '6 2 9 3'], 0, 40, 'Arriba a la porta amb el número que diu.', 'La porta s\'obre!')]),
    lv('Pedres que multipliquen', 'Ara cada pedra fa una operació al número de la granota!', [
      Pa(['+3 ×2 −1', '×3 +4 ×2', '−2 +5 +1'], 2, 28, 'La granota surt amb un 2. Cada pedra li fa la seva operació.', 'Quin camí!'),
      Pa(['×2 +5 −4', '+1 ×3 +2', '−3 ×2 +6'], 3, 30, 'La granota surt amb un 3.', 'La porta s\'obre!')]),
    lv('Laberints d\'operacions', 'Laberints de 4 × 4. Pensa abans de saltar!', [
      Pa(['+3 ×2 −4 +6', '×3 −2 +5 ×2', '+7 −6 ×3 −1', '−5 +4 +2 +8'], 5, 100, 'La granota surt amb un 5.', 'Laberint resolt!')]),
    lv('Penso un número', 'La granota pensa un número i hi fa una operació. Endevina quin ha pensat: desfés el que ha fet!', [H(riddle(['+7'], 8)), H(riddle(['×4'], 9)), H(riddle(['−12'], 42))]),
    lv('Penso un número i faig dues coses', 'Dues operacions: desfés-les des de l\'última!', [H(riddle(['×3', '+4'], 5)), H(riddle(['+6', '×2'], 4)), H(riddle(['−5', '×10'], 12))]),
    lv('Les edats', 'Endevinalles d\'edats i de repartir. Les barres t\'ajuden a pensar!', [
      H(story('La granota té 8 anys més que el capgròs. Entre tots dos tenen 20 anys. Quants anys té el capgròs?', 6, { rows: [['Capgròs', ['?']], ['Granota', ['?', 8]]], total: 20 }, 'Si treus els 8 anys de més, queden dues barres iguals: 20 − 8 = 12. Ara reparteix 12 entre 2.'), null, 'El capgròs té 6 anys, i la granota 14: 6 + 14 = 20.'),
      H(story('L\'àvia granota té el triple d\'anys que la granota. Entre totes dues en tenen 48. Quants anys té la granota?', 12, { rows: [['Granota', ['?']], ['Àvia', ['?', '?', '?']]], total: 48 }, 'Són quatre barres iguals que fan 48. Reparteix: 48 ÷ 4.'), null, 'La granota té 12 anys, i l\'àvia 36: 12 + 36 = 48.'),
      H(story('Dues granotes es reparteixen 30 mosques. Una en té 6 més que l\'altra. Quantes en té la que en té menys?', 12, { rows: [['Una', ['?']], ['L\'altra', ['?', 6]]], total: 30 }, 'Treu les 6 de més: 30 − 6 = 24. Queden dues barres iguals: 24 ÷ 2.'), null, '12 i 18: 12 + 18 = 30, i 18 − 12 = 6.')]),
    lv('Laberint de divisions', 'Ara hi ha pedres que divideixen. Compte: si la divisió no és exacta, la pedra no et deixa passar!', [
      Pa(['÷2 +4 ÷3', '−5 ÷3 +10', '×2 +6 ÷4'], 40, 9, 'La granota surt amb un 40.', 'Divisions dominades!'),
      Pa(['÷3 +5 ÷5', '×2 −10 +4', '÷4 +8 ÷2'], 60, 6, 'La granota surt amb un 60.', 'La porta s\'obre!')]),
    lv('El gran laberint', 'El laberint més gran. Totes les operacions!', [
      Pa(['×2 +7 ÷3 +9', '−4 ×3 +6 ÷2', '+10 ÷2 −3 ×2', '×4 −8 +5 −6'], 6, 96, 'La granota surt amb un 6.', 'Ets un mestre dels laberints!')]),
    lv('Repte final', 'Un camí, un número pensat i una endevinalla. L\'última pedra del castell!', [
      Pa(['6 3 8 2', '1 9 4 7', '5 2 6 3', '8 4 1 9'], 0, 60, 'Arriba a la porta amb el número que diu.', 'Camí trobat!'),
      H(riddle(['×5', '−8'], 7)),
      H(story('Tres granotes tenen 36 mosques. La segona en té el doble que la primera, i la tercera, el triple que la primera. Quantes en té la primera?', 6, { rows: [['Primera', ['?']], ['Segona', ['?', '?']], ['Tercera', ['?', '?', '?']]], total: 36 }, 'Compta les barres iguals: 1 + 2 + 3 = 6 barres que fan 36. Reparteix: 36 ÷ 6.'), null, 'La primera en té 6, la segona 12 i la tercera 18: 6 + 12 + 18 = 36.')])
  ] }
];
export const CIRCLES = [
  { name: 'Els fonaments', projects: [0, 1, 2] },
  { name: 'Les muralles', projects: [3, 4, 5] },
  { name: 'Les torres', projects: [6, 7, 8] }
];
export const LEVELS = PROJECTS.flatMap(p => p.levels);
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: a tower, a balance and a frog worth a number
export const POOL = [H(pyr([3, 4, 2], '?', '??', '...')), H(bal(['x', 4], [9], 5)), H(sym({ '🐸': 6 }, ['🐸 + 🐸']))];

// What is saved is facts only: { so, stars[90], piscina, exams[3], fulls, maons }. maons counts every number put right in a hole (it
// only grows). Marks, XP, level and badges are worked out, never stored. A complete progress inside its limits from any value at all
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), maons: Math.max(0, whole(o.maons)) };
}
// n more bricks laid: a new progress
export const bricksIn = (p, n) => ({ ...cursus.copy(p), maons: p.maons + Math.max(0, whole(n)) });
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Cinc-cents maons', what: 'Omple 500 forats amb el número bo.' },
  { name: 'Deu fulls', what: "Caça bé les errades de deu fulls." },
  { name: 'Mestre del castell', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.maons >= 500, p.fulls >= 10, p.exams.every(e => e === true)];

/* ---------- the exam and «Caça l'errada» ---------- */
// Six different levels of the projects of circle c, at least one of each project, in a random order; each is a copy of the level with p,
// its project, and idx added. A level where nothing can go wrong (make a balance level, touch the lines of a square) is never drawn.
// A circle that does not exist gives the first
const askable = L => L.rounds.every(r => r.q.type !== 'level' && r.q.type !== 'explore');
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const draw = p => {
    const ok = PROJECTS[p].levels.flatMap((L, i) => askable(L) ? [i] : []);
    let j = at(ok.length, rnd);
    for (let n = 0; n < ok.length && used.has(p * 10 + ok[j]); n++) j = (j + 1) % ok.length;
    used.add(p * 10 + ok[j]);
    return { ...PROJECTS[p].levels[ok[j]], p, idx: ok[j] };
  };
  const out = ps.map(draw);
  while (out.length < 6) out.push(draw(ps[at(ps.length, rnd)]));
  return shuffle(out, rnd);
}

// A sheet: three sentences written in the notebook of the castle, each { kind, scene, says, real, opts }: says is the sentence written,
// real the true one (the sentence is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the ones
// children make with a hidden number: the three bricks of the bottom added once, a hole found by adding when it is taken away, the 12
// of «8 + 4 = ? + 5», a square that looks magic, the machine run forwards when it goes backwards, two boxes not shared out, the frogs
// taken away instead of shared, a product taken away, a series that loses its step
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const CLAIM = {
  tower(bad, rnd) {
    const [a, b, c] = pickOf([[2, 5, 3], [4, 1, 6], [3, 3, 2], [5, 2, 4]], rnd), top = a + 2 * b + c, wrong = a + b + c;
    const say = n => `El maó de dalt d'aquesta torre és el ${n}.`;
    return { scene: pyr([a, b, c], '?', '??', '...'), real: say(top), says: say(bad ? wrong : top), opts: shuffle([top, wrong, top + 1].map(say), rnd) };
  },
  minus(bad, rnd) {
    const b = pickOf([17, 24, 36, 18], rnd), x = pickOf([25, 19, 33, 46], rnd), c = x + b;
    const say = n => `El cadenat «? + ${b} = ${c}» s'obre amb el ${n}.`;
    return { scene: lock(`[${x}] + ${b} = ${c}`), real: say(x), says: say(bad ? c + b : x), opts: shuffle([x, c + b, x + 10].map(say), rnd) };
  },
  equal(bad, rnd) {
    const [a, b, d] = pickOf([[8, 4, 5], [9, 6, 7], [7, 7, 10], [12, 5, 9]], rnd), x = a + b - d;
    const say = n => `A «${a} + ${b} = ? + ${d}», el forat és el ${n}.`;
    return { scene: lock(`${a} + ${b} = [${x}] + ${d}`), real: say(x), says: say(bad ? a + b : x), opts: shuffle([x, a + b, a + b + d].map(say), rnd) };
  },
  magic(bad, rnd) {
    const g = pickOf([LS, turn(LS), turn(turn(LS))], rnd), r = at(3, rnd), c = at(3, rnd), off = map(g, x => x).map((row, i) => row.map((x, j) => i === r && j === c ? x + 1 : x));
    const yes = 'Aquest quadrat és màgic: totes les línies sumen 15.', no = 'Aquest quadrat no és màgic: hi ha línies que no sumen 15.';
    return { scene: magic(bad ? off : g, null), real: bad ? no : yes, says: yes, opts: shuffle([no, yes, 'Aquest quadrat és màgic: totes les línies sumen 16.'], rnd) };
  },
  machine(bad, rnd) {
    const x = pickOf([4, 5, 6, 7], rnd), out = 3 * x + 2, say = n => `La màquina fa ×3 i després +2. Si en surt ${out}, hi havia entrat el ${n}.`;
    return { scene: mach(['×3', '+2'], x, 'in'), real: say(x), says: say(bad ? out * 3 + 2 : x), opts: shuffle([x, out * 3 + 2, out - 2].map(say), rnd) };
  },
  boxes(bad, rnd) {
    const [x, w] = pickOf([[5, 4], [6, 3], [7, 2], [4, 6]], rnd), tot = 2 * x + w, say = n => `Si dues caixes iguals i un ${w} pesen ${tot}, cada caixa pesa ${n}.`;
    return { scene: bal(['x', 'x', w], [tot], x), real: say(x), says: say(bad ? tot - w : x), opts: shuffle([x, tot - w, tot - x].map(say), rnd) };
  },
  frogs(bad, rnd) {
    const v = pickOf([6, 7, 8, 9], rnd), say = n => `Si 🐸 + 🐸 + 🐸 = ${3 * v}, llavors 🐸 = ${n}.`;
    return { scene: sym({ '🐸': v }, ['🐸 + 🐸 + 🐸']), real: say(v), says: say(bad ? 3 * v - 3 : v), opts: shuffle([v, 3 * v - 3, v + 3].map(say), rnd) };
  },
  times(bad, rnd) {
    const a = pickOf([6, 7, 8], rnd), x = pickOf([6, 7, 9], rnd), c = a * x, say = n => `El cadenat «${a} × ? = ${c}» s'obre amb el ${n}.`;
    return { scene: lock(`${a} × [${x}] = ${c}`), real: say(x), says: say(bad ? c - a : x), opts: shuffle([x, c - a, x + 1].map(say), rnd) };
  },
  series(bad, rnd) {
    const s = pickOf([3, 5, 2, 10], rnd), d = pickOf([4, 6, 7, 9], rnd), seq = [0, 1, 2, 3].map(i => s + i * d), next = s + 4 * d;
    const say = n => `A la sèrie ${seq.join(', ')}..., el número següent és el ${n}.`;
    return { scene: ser([...seq, next], '....?'), real: say(next), says: say(bad ? next - 1 : next), opts: shuffle([next, next - 1, next + d].map(say), rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
