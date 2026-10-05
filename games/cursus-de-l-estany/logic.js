// Eight projects in three circles. Each project has three exercises of five fixed questions: ex00 is solved with the hands (hands),
// ex01 has the material in view, ex02 hides it until a hint (hide). Circle 2 is filled by a later task; its projects exist with ex: [].
// A question is { mode, D, d, ... }: D is the dividend, d the divisor. The modes, and what the child writes (want):
//   'share'  how many in each group      'group'  how many groups     'fact'  the quotient, from a table  'tens'  the quotient of whole tens
//   'rem'    quotient and remainder [q, r]    'proof'  the dividend D, from d, q and r (D = d × q + r)
//   'split'  parts: [p1, p2]; the quotient of each part, then the total [a, b, q]
//   'long'   parts: [p1, p2(, p3)]; each part but the last divides exactly; [...partials, q, r]
// bare (exam and sheets): no material and no partials; split wants q, long wants [q, r], and parts may be missing.
const FIT = { hands: true };
const mk = (mode, flags, list) => list.map(([D, d]) => ({ mode, D, d, ...flags }));
// proof is written as [d, q, r]
const pf = (flags, list) => list.map(([d, q, r]) => ({ mode: 'proof', D: d * q + r, d, q, r, ...flags }));
const trio = (mode, a, b, c) => [mk(mode, FIT, a), mk(mode, {}, b), mk(mode, { hide: true }, c)];
export const PROJECTS = [
  { name: 'Repartir', sub: 'Quantes en toquen a cada grup', circle: 0, mode: 'share', ex: trio('share',
    [[6, 2], [9, 3], [8, 2], [12, 3], [12, 4]], [[10, 2], [15, 3], [16, 4], [20, 5], [18, 3]], [[18, 2], [21, 3], [24, 4], [25, 5], [30, 5]]) },
  { name: 'Fer grups', sub: 'De quant en quant, quants grups surten', circle: 0, mode: 'group', ex: trio('group',
    [[6, 3], [8, 4], [12, 3], [10, 5], [12, 6]], [[20, 4], [18, 3], [21, 7], [24, 8], [30, 10]], [[32, 8], [27, 9], [35, 5], [36, 6], [40, 10]]) },
  { name: 'La taula al revés', sub: 'Quin número per la taula fa el dividend', circle: 1, mode: 'fact', ex: trio('fact',
    [[6, 2], [12, 3], [15, 5], [24, 4], [18, 6]], [[24, 6], [35, 7], [40, 8], [27, 9], [30, 10]], [[42, 6], [56, 8], [63, 9], [72, 8], [100, 10]]) },
  { name: 'En sobra', sub: 'El residu és més petit que el divisor', circle: 1, mode: 'rem', ex: trio('rem',
    [[7, 2], [11, 3], [14, 4], [10, 5], [17, 5]], [[19, 4], [23, 5], [29, 6], [38, 7], [40, 8]], [[47, 6], [59, 7], [64, 9], [72, 8], [95, 10]]) },
  { name: 'Comprova', sub: 'Divisor per quocient, més el residu', circle: 1, mode: 'proof', ex: [
    pf(FIT, [[2, 3, 1], [3, 4, 0], [4, 3, 2], [5, 2, 3], [3, 5, 2]]),
    pf({}, [[6, 4, 5], [7, 5, 0], [4, 6, 3], [8, 5, 7], [9, 4, 2]]),
    pf({ hide: true }, [[6, 8, 5], [7, 9, 3], [9, 7, 8], [8, 10, 7], [10, 9, 9]])] },
  { name: 'Desenes senceres', sub: 'Dividir 80, 120 o 600 de desena en desena', circle: 2, mode: 'tens', ex: [] },
  { name: 'A trossos', sub: 'Partir el dividend en dos trossos', circle: 2, mode: 'split', ex: [] },
  { name: 'Tres xifres', sub: 'Tres xifres entre una xifra, amb residu', circle: 2, mode: 'long', ex: [] }
];
export const CIRCLES = [
  { name: 'Repartir i agrupar', projects: [0, 1] },
  { name: 'Residu i comprovació', projects: [2, 3, 4] },
  { name: 'Números grans', projects: [5, 6, 7] }
];

// the quotient and the remainder, worked out from D and d
const qr = q => [Math.floor(q.D / q.d), q.D % q.d];
// the pieces of a split or long question; a bare one has none, so one is made: the biggest multiple of 10 × d below D, then the rest
function piecesOf(q) {
  if (q.parts) return q.parts;
  const big = Math.floor((q.D - 1) / (10 * q.d)) * 10 * q.d;
  return big ? [big, q.D - big] : [q.D];
}
// the right answer: a number, or a list of numbers
export function want(q) {
  const [Q, R] = qr(q);
  switch (q.mode) {
    case 'share': case 'group': case 'fact': case 'tens': return Q;
    case 'proof': return q.D;
    case 'rem': return [Q, R];
    case 'split': return q.bare ? Q : [...q.parts.map(p => p / q.d), Q];
    case 'long': return q.bare ? [Q, R] : [...q.parts.slice(0, -1).map(p => p / q.d), Math.floor(q.parts[q.parts.length - 1] / q.d), Q, R];
  }
}
export const right = (q, ans) => String(want(q)) === String(ans);

// does the question keep to the limits of project p? The limits that belong to one exercise (D ≤ 12 at ex00 of Repartir, D ≤ 50 before
// ex02 of En sobra) are the business of the fixed questions, so the loosest of each project is the one here.
export function inLimits(q, p) {
  const P = PROJECTS[p], { D, d } = q;
  if (!P || q.mode !== P.mode || !Number.isInteger(D) || !Number.isInteger(d) || D < 1) return false;
  const [Q, R] = qr(q), whole = x => Number.isInteger(x) && x > 0, add = a => a.reduce((x, y) => x + y, 0);
  // the parts of a split or long question; a bare question may do without
  const cut = (n, last) => {
    if (q.bare && !q.parts) return true;
    const t = q.parts;
    return Array.isArray(t) && n.includes(t.length) && t.every(whole) && add(t) === D && t[0] % (10 * d) === 0 && t.slice(0, last ? -1 : t.length).every(x => x % d === 0);
  };
  switch (p) {
    case 0: return D <= 30 && d >= 2 && d <= 5 && R === 0;
    case 1: return D <= 40 && d >= 2 && d <= 10 && R === 0;
    case 2: return D <= 100 && d >= 2 && d <= 10 && R === 0 && Q >= 1 && Q <= 10;
    case 3: return D <= 100 && d >= 2 && d <= 10 && Q >= 1 && Q <= 10;
    case 4: return Number.isInteger(q.q) && Number.isInteger(q.r) && d >= 2 && d <= 10 && q.q >= 1 && q.q <= 10 && q.r >= 0 && q.r < d && D === d * q.q + q.r && D <= 100;
    case 5: return D % 10 === 0 && D >= 10 && D <= 990 && d >= 2 && d <= 9 && (D / 10) % d === 0;
    case 6: return D >= 20 && D <= 99 && d >= 2 && d <= 9 && R === 0 && cut([2], false);
    case 7: return D >= 100 && D <= 999 && d >= 2 && d <= 9 && cut([2, 3], true);
  }
  return false;
}

/* ---------- what the game says ---------- */
const sobra = r => r === 0 ? 'no en sobra cap' : r === 1 ? 'en sobra 1' : `en sobren ${r}`;
// a typed answer that is a real number (an empty box is not one)
const fin = x => x != null && String(x).trim() !== '' && Number.isFinite(+x);
const piecesTxt = (q, sep) => piecesOf(q).map(p => `${p} ÷ ${q.d}`).join(sep);
const total = q => piecesOf(q).map(p => Math.floor(p / q.d)).join(' + ');
export function tipFor(q) {
  const { D, d } = q;
  switch (q.mode) {
    case 'share': return `Reparteix les ${D} cuques entre ${d} nenúfars. Quantes en toquen a cada nenúfar?`;
    case 'group': return `Fes grups de ${d} amb les ${D} cuques. Quants grups surten?`;
    case 'fact': return `Quant és ${D} ÷ ${d}? Escriu el quocient.`;
    case 'rem': return `Fes grups de ${d} amb les ${D} cuques. Escriu quants grups surten i quantes en sobren.`;
    case 'proof': return `S'han fet grups de ${d}: han sortit ${q.q} grups i ${sobra(q.r)}. Quantes cuques hi havia?`;
    case 'tens': return `Quant és ${D} ÷ ${d}? Escriu el quocient.`;
    case 'split': return q.bare ? `Quant és ${D} ÷ ${d}? Escriu el quocient.` : `Parteix ${D} en ${q.parts.join(' i ')}. Divideix cada tros entre ${d} i escriu el total.`;
    case 'long': return q.bare ? `Quant és ${D} ÷ ${d}? Escriu el quocient i el residu.` : `Parteix ${D} en ${q.parts.join(', ')}. Divideix cada tros entre ${d} i escriu el total i el residu.`;
  }
}
// a remainder as big as the divisor can still make a group; a quotient and remainder that do not add back up to D are a slip of the multiplication
function lead(q, a) {
  if (!Array.isArray(a) || a.length < 2 || !a.every(fin)) return '';
  const [x, y] = a.slice(-2).map(Number);
  if (y >= q.d) return `Amb ${y} encara es pot fer un grup més de ${q.d}: el residu ha de ser més petit que ${q.d}. `;
  if (x * q.d + y !== q.D) return `Comprova multiplicant: ${q.d} × ${x} + ${y} fa ${q.d * x + y}, no ${q.D}. `;
  return '';
}
// a wrong single number: what it would need to be worth when multiplied back
const back = (q, a) => fin(a) && +a * q.d !== q.D ? `${q.d} × ${+a} fa ${q.d * +a}, no ${q.D}. ` : '';
// What to say after a wrong answer or a hint: first what to look at, then the whole reasoning. ans is the wrong answer, when there is one.
export function explain(q, deep, ans) {
  const { D, d } = q, [Q, R] = qr(q);
  switch (q.mode) {
    case 'share': return back(q, ans) + (deep ? `${D} ÷ ${d} = ${Q}: ${d} nenúfars amb ${Q} cuques cada un fan ${d} × ${Q} = ${D}.` : `Reparteix-les d'una en una entre els ${d} nenúfars, fins que no en quedi cap. Tots n'han de tenir les mateixes.`);
    case 'group': return back(q, ans) + (deep ? `${D} ÷ ${d} = ${Q}: ${Q} grups de ${d} fan ${Q} × ${d} = ${D}.` : `Encercla ${d} cuques i torna-ho a fer, fins que no en quedi cap. Quants cercles has fet?`);
    case 'fact': return back(q, ans) + (deep ? `${d} × ${Q} = ${D}, per tant ${D} ÷ ${d} = ${Q}.` : `Pensa en la taula del ${d}: quin número multiplicat per ${d} fa ${D}?`);
    case 'tens': return back(q, ans) + (deep ? `${D} són ${D / 10} desenes. ${D / 10} ÷ ${d} = ${D / 10 / d}: cada grup té ${D / 10 / d} desenes, que són ${Q}.` : `Pensa en desenes: ${D} són ${D / 10} desenes. Reparteix les desenes entre ${d}.`);
    case 'rem': return lead(q, ans) + (deep
      ? (R ? `Amb ${D} cuques fas ${Q} grups de ${d}: ${d} × ${Q} = ${d * Q}. En sobren ${D} − ${d * Q} = ${R}, que és més petit que ${d}: no en pots fer cap grup més.`
        : `${d} × ${Q} = ${D}: amb ${D} cuques fas ${Q} grups de ${d} i no en sobra cap.`)
      : `Fes tants grups de ${d} com puguis. Les que no arriben per fer un altre grup són les que sobren.`);
    case 'proof': return (fin(ans) ? `Has escrit ${+ans}. ` : '') + (deep ? `${d} × ${q.q} = ${d * q.q}, i ${d * q.q} + ${q.r} = ${D}.` : `Cada grup té ${d} cuques: ${q.q} grups són ${d} × ${q.q}. Després suma les que sobren.`);
    case 'split': {
      const a = Array.isArray(ans) && ans.length === 3 && ans.every(fin) ? ans.map(Number) : null,
        sum = a && a[0] + a[1] !== a[2] ? 'El total és la suma dels dos resultats. ' : '';
      return (q.bare ? back(q, ans) : sum) + (deep ? `${piecesTxt(q, ' i ')}: ${total(q)} = ${Q}.` : q.bare
        ? `Parteix ${D} en trossos que es dividiran bé: ${piecesOf(q).join(' i ')}. Divideix cada tros per separat i suma.`
        : `Divideix cada tros per separat: ${piecesTxt(q, ' i ')}. Després suma els dos resultats.`); }
    default: {   // long
      const pieces = piecesOf(q);
      return lead(q, ans) + (deep
        ? `${pieces.map(p => `${p} ÷ ${d} = ${Math.floor(p / d)}${p % d ? ` i ${sobra(p % d)}` : ''}`).join('; ')}. ${total(q)} = ${Q}${R ? `; el residu és ${R}` : ', sense residu'}.`
        : `${q.bare ? `Parteix ${D} en trossos que es dividiran bé: ${pieces.join(', ')}. ` : ''}Divideix cada tros entre ${d}. Tots es divideixen bé llevat de l'últim: el que sobra d'ell és el residu.`); }
  }
}
// what the game says after a right answer: the whole division
export function said(q) {
  const { D, d } = q, [Q, R] = qr(q);
  switch (q.mode) {
    case 'share': return `${D} ÷ ${d} = ${Q}: a cada nenúfar en toquen ${Q}.`;
    case 'group': return `${D} ÷ ${d} = ${Q}: surten ${Q} grups de ${d}.`;
    case 'fact': case 'tens': return `${D} ÷ ${d} = ${Q}, perquè ${d} × ${Q} = ${D}.`;
    case 'rem': return `${D} ÷ ${d} = ${Q} i ${sobra(R)}.`;
    case 'proof': return `${d} × ${q.q} + ${q.r} = ${D}, i per això ${D} ÷ ${d} = ${q.q} i ${sobra(q.r)}.`;
    case 'split': return `${D} ÷ ${d} = ${piecesTxt(q, ' + ')} = ${total(q)} = ${Q}.`;
    default: return `${D} ÷ ${d} = ${piecesTxt(q, ' + ')} = ${total(q)} = ${Q} i ${sobra(R)}.`;
  }
}
