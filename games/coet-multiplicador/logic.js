// Six sections of ten levels. A level is one multiplication, a × b, and the way it is worked:
//   'zeros'   one piece: the product without its zeros, then with them
//   'pieces'  the rectangle cut by digits: one product per piece, then the pieces added in a column
//   'guided'  the school algorithm, typing each small product whole; the game writes its last digit and carries the rest
//   'free'    the school algorithm, one written digit at a time
const lv = (mode, list) => list.map(([a, b]) => ({ a, b, mode }));
export const SECTIONS = [
  { name: 'Zeros màgics', sub: 'Multiplicar per desenes i centenes',
    levels: lv('zeros', [[3, 20], [4, 30], [6, 40], [7, 200], [5, 300], [20, 30], [40, 60], [30, 200], [50, 400], [70, 800]]) },
  { name: 'Trossejar', sub: 'Un número gran, tros a tros',
    levels: lv('pieces', [[23, 3], [42, 4], [56, 7], [123, 3], [214, 6], [342, 5], [406, 7], [538, 6], [764, 8], [987, 9]]) },
  { name: 'En columna', sub: "Escric una xifra i me'n porto una altra",
    levels: [...lv('guided', [[32, 3], [27, 3], [48, 6], [123, 3], [236, 4], [458, 7]]), ...lv('free', [[324, 6], [507, 8], [689, 7], [978, 9]])] },
  { name: 'Dues files', sub: "Per què hi ha dues files i d'on surt el zero",
    levels: [...lv('pieces', [[12, 13], [23, 14], [34, 25], [46, 37]]), ...lv('guided', [[21, 32], [34, 56], [47, 63], [78, 45]]), ...lv('free', [[56, 34], [89, 76]])] },
  { name: '3 × 2 amb ajuda', sub: 'Tres xifres per dues, pas a pas',
    levels: lv('guided', [[123, 12], [213, 24], [324, 35], [245, 46], [406, 53], [538, 27], [672, 48], [759, 64], [806, 79], [947, 86]]) },
  { name: 'Missió final', sub: 'Tres xifres per dues, sense ajuda',
    levels: lv('free', [[132, 23], [254, 36], [318, 47], [467, 52], [583, 64], [609, 78], [745, 39], [826, 95], [968, 87], [999, 99]]) }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);
export const digitsOf = n => [...String(n)].reverse().map(Number);   // units first
export const zerosOf = n => String(n).length - String(n).replace(/0+$/, '').length;
// one piece per pair of digits that are not zero, in the order they are asked: the strip of the units first, each strip from the left
export function pieces(a, b) {
  const out = [];
  digitsOf(b).forEach((d, bi) => digitsOf(a).forEach((x, ai) => { if (x && d) out.push({ ai, bi, x, d, av: x * 10 ** ai, bv: d * 10 ** bi, val: x * d * 10 ** (ai + bi) }); }));
  return out.sort((p, q) => p.bi - q.bi || q.ai - p.ai);
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
  B.forEach((d, bi) => {
    let carry = 0;
    for (let col = 0; col < bi; col++) steps.push({ kind: 'digit', part: 'zero', row: 'r' + bi, col, want: 0, d, bi });
    A.forEach((x, ai) => {
      const v = x * d + carry, last = ai === A.length - 1, base = { row: 'r' + bi, col: ai + bi, x, d, ai, bi, carry, v, last, out: last ? 0 : Math.floor(v / 10) };
      if (mode === 'guided') steps.push({ kind: 'val', part: 'prod', want: v, ...base });
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
// slips are wrong answers plus hints asked
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
