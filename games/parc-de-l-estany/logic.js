// El parc de l'estany: the maths of a theme park, the ones the hotel does not do. The tickets and the visitors (big numbers, rounding),
// the height you need for a ride (cm, m, km), the colours of the merry-go-round (patterns and series), the turns of the big wheel (quarter
// turns, degrees, angles), the hills of the roller coaster (a line graph in metres), the snack bar (fractions), the square of shapes
// (solids, nets and the views of a pile of cubes), the queues (tallies, two-way tables, a line graph) and the tombola (chance).
// The rules and the data, with no page in it: main.js draws the cards and world.js the park.
//
// A level is { title, say, warm, ask, make }: make(rnd) gives its rounds, drawn again every time it is played (chance enters only through
// rnd). A round is one visitor of the park: { type, card, text, ans, hint, say, sp, ... }.
//   num    a number typed on the keypad, taken as soon as it is right (unit: what follows it)
//   pick   one of opts (ans is the first; main shows them in the order of order, or shuffled)
//   tap    a thing of the card (ans is its key)
//   mark   things of the card switched on until they are exactly ans; with need, any need of them (✓ sends a set that is not)
//   packs  a number of tickets made with boxes of 1.000, packs of 100, strips of 10 and loose tickets (+ and −), taken when it is ans
//   turn   the big wheel turned with ↻ and ↺ (step eighths a touch) and stopped: by 'bottom', ans is the cabin that must be at the bottom;
//          by 'turned', the eighths turned (+ clockwise); free: a wrong stop is only told, never a slip
//   paint  a colour of pal put on each empty horse (ans the colours, each one checked as it is put) or on every sector of a roulette
//          (goal, checked by meets() with ✓)
//   track  the pillars of the roller coaster raised to the heights of ans
//   draw   n balls drawn from the bag, one at a time: a thing to do and look at, it can not go wrong
import { curs, POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle, whole, within, slots, at, int } from '../../shared/curs.js';

/* ---------- words ---------- */
// the children of the park, for the heights and the rides; the article goes with the name
export const KIDS = [
  { sp: 'nena', name: 'la Laia' }, { sp: 'nen', name: 'en Pau' }, { sp: 'nena', name: "l'Ona" }, { sp: 'nen', name: 'en Marc' },
  { sp: 'nena', name: 'la Jana' }, { sp: 'nen', name: "l'Arnau" }, { sp: 'nena', name: 'la Martina' }, { sp: 'nen', name: 'en Biel' }
];
// the kinds of visitor world.js knows how to dress
export const VISITORS = ['nen', 'nena', 'pare', 'mare', 'avia'];
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const short = K => K.name.replace(/^(la |en |l')/, '');
const of = K => K.name.startsWith('en ') ? `d'${K.name}` : `de ${K.name}`;
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const kid = rnd => pickOf(KIDS, rnd);
// 12408 → «12.408»
export const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// «el 4», «l'1»
const el = n => n === 1 || n === 11 ? `l'${n}` : `el ${n}`;
const listOf = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const key = x => JSON.stringify(x);
// a fraction written one number over the other
export const fr = (a, b) => `<span class="fr"><b>${a}</b><b>${b}</b></span>`;

// the numbers in words, up to 999.999: «dotze mil quatre-cents vuit»
const U = ['zero', 'un', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou', 'deu', 'onze', 'dotze', 'tretze', 'catorze', 'quinze', 'setze', 'disset', 'divuit', 'dinou'];
const TENS = ['', '', 'vint', 'trenta', 'quaranta', 'cinquanta', 'seixanta', 'setanta', 'vuitanta', 'noranta'];
const w99 = n => { if (n < 20) return U[n]; const t = Math.floor(n / 10), u = n % 10; return u ? TENS[t] + (t === 2 ? '-i-' : '-') + U[u] : TENS[t]; };
const w999 = n => { const c = Math.floor(n / 100), r = n % 100, h = c === 0 ? '' : c === 1 ? 'cent' : U[c] + '-cents'; return [h, r ? w99(r) : ''].filter(Boolean).join(' ') || 'zero'; };
export function words(n) {
  if (n < 1000) return w999(n);
  const k = Math.floor(n / 1000), r = n % 1000;
  return [(k === 1 ? '' : w999(k) + ' ') + 'mil', r ? w999(r) : ''].filter(Boolean).join(' ');
}
// n different things from gen, as far as gen can give them
function draw(rnd, n, gen) {
  const out = [], seen = new Set();
  for (let k = 0; out.length < n && k < 300; k++) { const x = gen(rnd), id = key(x); if (!seen.has(id)) { seen.add(id); out.push(x); } }
  while (out.length < n) out.push(gen(rnd));
  return out;
}
// four different options: the right one first, then the others that are not it
function four(right, others) {
  const out = [right];
  for (const o of others) if (out.length < 4 && !out.includes(o)) out.push(o);
  return out;
}

/* ---------- the rounds ---------- */
const R = (type, card, text, o) => ({ type, card, text, ...o });
const Num = (card, text, ans, hint, say, o = {}) => R('num', card, text, { ans, hint, say, ...o });
const Pick = (card, text, opts, hint, say, o = {}) => R('pick', card, text, { ans: opts[0], opts, hint, say, ...o });
const Tap = (card, text, ans, hint, say, o = {}) => R('tap', card, text, { ans, hint, say, ...o });
const Mark = (card, text, ans, hint, say, o = {}) => R('mark', card, text, { ans, hint, say, ...o });
const Packs = (card, text, ans, hint, say, o = {}) => R('packs', card, text, { ans, hint, say, ...o });
const Turn = (card, text, ans, hint, say, o = {}) => R('turn', card, text, { ans, hint, say, by: 'bottom', step: 1, ...o });
const Paint = (card, text, ans, hint, say, o = {}) => R('paint', card, text, { ans, hint, say, ...o });
const Track = (card, text, ans, hint, say, o = {}) => R('track', card, text, { ans, hint, say, ...o });
const Draw = (card, text, n, say, o = {}) => R('draw', card, text, { n, hint: '', say, ...o });
// warm: a warm-up, where the child does and looks before being asked; ask: drawn by the exams (never a warm-up)
const lv = (title, say, make, warm = false, ask = !warm) => ({ title, say, make, warm, ask });
// a level of three rounds from three makers (or one maker three times)
const three = (...fs) => rnd => (fs.length === 1 ? [fs[0], fs[0], fs[0]] : fs).map(f => f(rnd));
const anyOf = fs => rnd => pickOf(fs, rnd)(rnd);

/* ---------- 0 · La taquilla ---------- */
// the tickets come in boxes of 1.000, packs of 100, strips of 10 and loose
const PACK_NAMES = [['caixa de 1.000', 'caixes de 1.000'], ['paquet de 100', 'paquets de 100'], ['tira de 10', 'tires de 10'], ['entrada solta', 'entrades soltes']];
const valueOf = v => v[0] * 1000 + v[1] * 100 + v[2] * 10 + v[3];
const packWords = v => listOf(v.flatMap((n, i) => n ? [`${n} ${PACK_NAMES[i][n === 1 ? 0 : 1]}`] : []));
const milers = k => k === 1 ? 'mil' : `${words(k)} mil`;
const packBuild = rnd => {
  const v = [int(rnd, 1, 3), int(rnd, 0, 5), int(rnd, 0, 5), int(rnd, 1, 7)], n = valueOf(v);
  return Packs({ k: 'packs', v: [0, 0, 0, 0], goal: n }, `Prepara ${fmt(n)} entrades amb caixes de 1.000, paquets de 100, tires de 10 i entrades soltes.`, n,
    `La primera xifra de ${fmt(n)} diu quantes caixes de 1.000; la segona, quants paquets de 100; després van les tires i les soltes.`, `${fmt(n)} entrades: ${packWords(v)}.`, { sp: 'mare' });
};
const packCount = rnd => {
  const v = [int(rnd, 1, 4), int(rnd, 0, 6), int(rnd, 0, 6), int(rnd, 0, 9)];
  if (!v.includes(0) && at(2, rnd)) v[1 + at(3, rnd)] = 0;
  const n = valueOf(v);
  return Num({ k: 'packs', v }, 'Quantes entrades hi ha a la taquilla?', n, `Hi ha ${packWords(v)}.${v.includes(0) ? ' On no hi ha res, hi va un 0.' : ''}`, `${fmt(n)} entrades.`);
};
// a number of len figures with a 0 inside it: 3.045, 12.408
const zeroIn = (rnd, len) => { const d = Array.from({ length: len }, () => int(rnd, 1, 9)); d[1 + at(len - 1, rnd)] = 0; return +d.join(''); };
// numbers that look like n: two figures side by side swapped, or 10, 100 or 1.000 more
function lookalikes(n) {
  const s = String(n), out = [];
  for (let i = 0; i < s.length - 1; i++) { const t = s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); if (t[0] !== '0' && t !== s) out.push(+t); }
  return [...out, n + 10, n + 100, n + 1000];
}
const readNum = rnd => {
  const n = zeroIn(rnd, int(rnd, 4, 5)), k = Math.floor(n / 1000);
  if (at(2, rnd)) return Pick({ k: 'counter', n }, 'Com es llegeix el número del comptador de visitants?', four(words(n), shuffle(lookalikes(n), rnd).map(words)),
    'Abans del punt hi ha els milers: llegeix-los i digues «mil». Després llegeix la resta.', `${fmt(n)}: ${words(n)}.`);
  return Num({ k: 'note', icon: 'ticket', lines: [`${cap(words(n))} visitants`] }, 'Al cartell de la taquilla hi diu quants visitants hi ha avui. Escriu-ho amb xifres.', n,
    `Primer els milers (${milers(k)}) i després la resta. Si una posició queda buida, hi va un 0.`, `${cap(words(n))}: ${fmt(n)}.`);
};
const PLACE = ['les unitats', 'les desenes', 'les centenes', 'les unitats de miler', 'les desenes de miler'];
const digitValue = rnd => {
  const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd).slice(0, 5), n = +ds.join(''), i = at(5, rnd), k = 4 - i, d = ds[i], v = d * 10 ** k;
  return Num({ k: 'counter', n, hl: i }, `Quant val ${el(d)} del comptador?`, v, `${cap(el(d))} és a ${PLACE[k]}: val ${d} × ${fmt(10 ** k)}.`, `${cap(el(d))} val ${fmt(v)}.`);
};
const PLACE_OF = { 10: 1, 100: 2, 1000: 3 };
const plusStep = rnd => {
  const s = pickOf([10, 100, 1000], rnd), up = at(3, rnd) > 0;
  let n = int(rnd, 12, 88) * 1000 + int(rnd, 0, 999);
  // half the time the figure that changes is a 9 that goes up (or a 0 that goes down), so the one beside it changes too
  const carry = at(2, rnd) > 0;
  if (carry) { const dg = Math.floor(n / s) % 10; n += ((up ? 9 : 0) - dg) * s; }
  const m = up ? n + s : n - s;
  return Num({ k: 'counter', n }, up ? `El comptador marca ${fmt(n)}. Entren ${fmt(s)} visitants més. Què marcarà?` : `Al parc hi ha ${fmt(n)} visitants i se'n van ${fmt(s)}. Quants en queden?`, m,
    `Només canvien ${PLACE[PLACE_OF[s]]}: n'hi ha una ${up ? 'més' : 'menys'}.${carry ? up ? ' Si és un 9, passa a 0 i la xifra de l\'esquerra puja una.' : ' Si és un 0, passa a 9 i la xifra de l\'esquerra baixa una.' : ''}`,
    `${fmt(n)} ${up ? '+' : '−'} ${fmt(s)} = ${fmt(m)}.`);
};
const FOUR_DAYS = ['dijous', 'divendres', 'dissabte', 'diumenge'];
const busiest = rnd => {
  const th = int(rnd, 11, 39), ns = draw(rnd, 4, r => th * 1000 + int(r, 1, 9) * 100 + int(r, 0, 99));
  // two of them with the same hundreds, so the tens decide
  ns[1] = Math.floor(ns[0] / 100) * 100 + (ns[1] % 100 === ns[0] % 100 ? (ns[0] % 100 + 37) % 100 : ns[1] % 100);
  const most = at(2, rnd) > 0, v = most ? Math.max(...ns) : Math.min(...ns), i = ns.indexOf(v);
  return Pick({ k: 'days', days: FOUR_DAYS, ns }, most ? 'Quin dia van venir més visitants?' : 'Quin dia van venir menys visitants?', [cap(FOUR_DAYS[i]), ...FOUR_DAYS.filter((_, j) => j !== i).map(cap)],
    'Tots tenen els mateixos milers: compara les centenes i, si són iguals, les desenes.', `El ${FOUR_DAYS[i]}: ${fmt(v)} visitants.`, { order: FOUR_DAYS.map(cap) });
};
// the number between two thousands (s = 1000) or two hundreds (s = 100), never right in the middle
const roundTo = s => rnd => {
  const lo = s === 1000 ? int(rnd, 11, 48) * 1000 : int(rnd, 11, 48) * 1000 + int(rnd, 0, 8) * 100;
  let r = int(rnd, 1, s - 1); if (Math.abs(r - s / 2) < s / 20) r = s / 2 + (at(2, rnd) ? 1 : -1) * s / 5;
  const n = lo + r, hi = lo + s, near = r < s / 2 ? lo : hi;
  return Pick({ k: 'line', a: lo, b: hi, n }, `Avui han vingut ${fmt(n)} visitants. Són uns ${fmt(lo)} o uns ${fmt(hi)}?`, [`Uns ${fmt(near)}`, `Uns ${fmt(near === lo ? hi : lo)}`],
    `Mira la recta: el punt del mig és ${fmt(lo + s / 2)}. ${fmt(n)} és abans o després?`, `Uns ${fmt(near)}: ${fmt(n)} hi és més a prop.`, { order: [`Uns ${fmt(lo)}`, `Uns ${fmt(hi)}`] });
};
const twoDays = rnd => {
  const a = int(rnd, 21, 49) * 100 + int(rnd, 0, 99); let b = int(rnd, 21, 49) * 100 + int(rnd, 0, 99); if (b === a) b += 137;
  if (at(2, rnd)) return Num({ k: 'days', days: ['dissabte', 'diumenge'], ns: [a, b] }, 'Quants visitants van venir entre el dissabte i el diumenge?', a + b,
    `Suma ${fmt(a)} + ${fmt(b)}: unitats, desenes, centenes i milers, amb el que te'n portes.`, `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`);
  const [x, y] = a > b ? [a, b] : [b, a];
  return Num({ k: 'days', days: ['dissabte', 'diumenge'], ns: [y, x] }, 'Quants visitants més van venir el diumenge que el dissabte?', x - y,
    `Resta ${fmt(x)} − ${fmt(y)}, o compta des de ${fmt(y)} fins a ${fmt(x)}.`, `${fmt(x)} − ${fmt(y)} = ${fmt(x - y)}.`);
};

/* ---------- 1 · L'alçada mínima ---------- */
const kidRuler = (K, h, o = {}) => ({ k: 'ruler', h, sp: K.sp, who: short(K), ...o });
const headTap = rnd => {
  const K = kid(rnd), h = 10 * int(rnd, 10, 15);
  return Tap(kidRuler(K, h, { tap: true }), `Toca el número on arriba el cap ${of(K)}.`, String(h), 'Segueix la ratlla del cap fins al regle.', `${cap(K.name)} fa ${h} cm.`, { sp: K.sp, kid: { sp: K.sp, h } });
};
const readH = rnd => {
  const K = kid(rnd), h = 5 * int(rnd, 21, 31);
  return Num(kidRuler(K, h), `Quants centímetres fa ${K.name}?`, h, 'Les ratlles llargues van de 10 en 10, i la curta del mig és el 5.', `${cap(K.name)} fa ${h} cm.`, { unit: 'cm', sp: K.sp, kid: { sp: K.sp, h } });
};
const canRide = rnd => {
  const min = pickOf([110, 120, 130], rnd), ks = shuffle(KIDS.slice(), rnd).slice(0, 5), hs = ks.map(() => min + 5 * (int(rnd, 0, 8) - 4));
  const j = at(5, rnd); hs[j] = min;
  if (hs.every(h => h >= min)) hs[(j + 1) % 5] = min - 10;
  const row = ks.map((K, i) => ({ who: short(K), sp: K.sp, h: hs[i] })), ok = row.flatMap((x, i) => x.h >= min ? ['K' + i] : []);
  return Mark({ k: 'kids', row, min, tap: true }, `A la muntanya russa cal fer ${min} cm o més. Marca qui hi pot pujar.`, ok,
    'Hi pot pujar qui arriba a la ratlla vermella o la passa. Qui la toca just, també!', `Hi poden pujar: ${listOf(ok.map(k => row[+k.slice(1)].who))}.`);
};
const gap = more => rnd => {
  const K = kid(rnd), min = pickOf([110, 120, 130, 140], rnd), d = int(rnd, 2, 14), h = more ? min + d : min - d;
  return Num(kidRuler(K, h, { min }), `${cap(K.name)} fa ${h} cm. A la muntanya russa cal fer ${min} cm. Quants centímetres ${more ? 'li sobren' : 'li falten'}?`, d,
    more ? `Resta: ${h} − ${min}.` : `Compta des de ${h} fins a ${min}.`, more ? `${h} − ${min} = ${d} cm: hi pot pujar!` : `${h} + ${d} = ${min}: li falten ${d} cm.`,
    { unit: 'cm', sp: K.sp, kid: { sp: K.sp, h } });
};
const tape = cm => ({ k: 'tape', cm });
const toCm = rnd => {
  const kind = at(3, rnd);
  if (kind === 0) { const c = pickOf([5, 8, 15, 25, 32, 40, 47, 60, 75], rnd); return Num(tape(100 + c), `1 m i ${c} cm: quants centímetres són?`, 100 + c, `1 m són 100 cm, i ${c} cm més.`, `100 + ${c} = ${100 + c} cm.`, { unit: 'cm' }); }
  if (kind === 1) { const c = int(rnd, 2, 9) * 10 + int(rnd, 1, 9), t = 100 + c; return Num(tape(t), `${t} cm són 1 m i quants centímetres?`, c, 'Els primers 100 cm fan 1 m. Quants en queden?', `${t} cm = 1 m i ${c} cm.`, { unit: 'cm' }); }
  const [txt, v] = pickOf([['2 m', 200], ['mig metre', 50], ['1 m i mig', 150], ['un quart de metre', 25]], rnd);
  return Num(tape(v), `Quants centímetres són ${txt}?`, v, '1 m són 100 cm; mig metre, la meitat; un quart, la meitat de la meitat.', `${cap(txt)} = ${v} cm.`, { unit: 'cm' });
};
const SIGNS = [[1, 20], [1, 10], [1, 30], [1, 5], [0, 90], [1, 25], [1, 40], [1, 15]];
const sign = rnd => {
  const [m, c] = pickOf(SIGNS, rnd), cm = 100 * m + c, cc = String(c).padStart(2, '0'), txt = `${m},${cc} m`;
  if (at(2, rnd)) {
    const wrong = m === 0 ? [9, 900, 190] : c % 10 === 0 ? [10 * m + c / 10, 100 * m + c / 10, 1000 * m + c] : [100 * m + c * 10 < 200 ? 100 * m + c * 10 : 10 * m + c, 10 * m + c, 1000 * m + c];
    return Pick({ k: 'sign', txt }, `Al cartell de l'atracció hi diu: «Alçada mínima ${txt}». Quants centímetres són?`, four(`${cm} cm`, wrong.map(w => `${fmt(w)} cm`)),
      `Abans de la coma hi ha els metres (${m} m = ${100 * m} cm). Després de la coma, els centímetres.`, `${txt} = ${cm} cm.`);
  }
  const third = c % 10 === 0 ? `${m},0${c / 10} m` : c < 10 ? `${m},${c}0 m` : `${m},${cc[1]}${cc[0]} m`;
  return Pick({ k: 'sign', txt: `${cm} cm` }, `L'atracció demana fer ${cm} cm. Què ha de dir el cartell, en metres?`, four(txt, [`${cm} m`, `${Math.floor(cm / 10)},${cm % 10} m`, third]),
    'Els primers 100 cm són 1 m (abans de la coma). Els centímetres que queden van després de la coma, amb dues xifres.', `${cm} cm = ${txt}.`);
};
const mcm = h => `${Math.floor(h / 100)} m i ${h % 100} cm`;
const taller = rnd => {
  const [A, B] = shuffle(KIDS.slice(), rnd), a = int(rnd, 106, 148); let b = a + (at(2, rnd) ? 1 : -1) * int(rnd, 2, 12); if (b < 101) b = a + 7;
  const hi = a > b ? A : B, card = { k: 'note', icon: 'ruler', lines: [`${cap(short(A))}: ${mcm(a)}`, `${cap(short(B))}: ${b} cm`] };
  if (at(2, rnd)) return Pick(card, `${cap(A.name)} fa ${mcm(a)} i ${B.name} fa ${b} cm. Qui és més alt dels dos?`, [short(hi), short(hi === A ? B : A)],
    `Passa ${mcm(a)} a centímetres: 1 m són 100 cm.`, `${cap(short(hi))}: ${Math.max(a, b)} cm, i l'altre ${Math.min(a, b)} cm.`, { order: [short(A), short(B)] });
  return Num(card, `${cap(A.name)} fa ${mcm(a)} i ${B.name} fa ${b} cm. Quants centímetres de diferència hi ha?`, Math.abs(a - b),
    `${mcm(a)} són ${a} cm. Ara resta.`, `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)} cm.`, { unit: 'cm' });
};
const km = rnd => {
  const kind = at(3, rnd);
  if (kind === 0) { const m = 50 * int(rnd, 9, 19); return Num({ k: 'note', icon: 'coaster', lines: [`La via: ${fmt(m)} m`] }, `La via de la muntanya russa fa ${fmt(m)} m. Quants metres li falten per fer 1 km?`, 1000 - m, `1 km són 1.000 m. Compta des de ${fmt(m)} fins a 1.000.`, `${fmt(m)} + ${1000 - m} = 1.000 m = 1 km.`, { unit: 'm' }); }
  if (kind === 1) { const k = int(rnd, 1, 4), r = pickOf([50, 120, 300, 450, 600, 75, 900], rnd); return Num({ k: 'note', icon: 'walk', lines: [`${k} km i ${r} m`] }, `De l'aparcament fins a l'entrada del parc hi ha ${k} km i ${r} m. Quants metres són?`, k * 1000 + r, `Cada km són 1.000 m: ${k} km són ${fmt(k * 1000)} m. I ${r} m més.`, `${fmt(k * 1000)} + ${r} = ${fmt(k * 1000 + r)} m.`, { unit: 'm' }); }
  const n = 2 * int(rnd, 1, 5);
  return Num({ k: 'note', icon: 'coaster', lines: [`${n} voltes de 500 m`] }, `El tren de la muntanya russa fa ${n} voltes de 500 m. Quants quilòmetres fa?`, n / 2, 'Dues voltes de 500 m fan 1.000 m, que és 1 km.', `${n} × 500 = ${fmt(n * 500)} m = ${n / 2} km.`, { unit: 'km' });
};
const SIZES = [['la sínia', 30, 'm'], ['una cabina de la sínia', 2, 'm'], ['un nen de 4t', 135, 'cm'], ['una entrada del parc', 10, 'cm'], ['el camí de casa fins al parc', 12, 'km'],
  ['una formiga de la cua', 5, 'mm'], ['la cua de la muntanya russa', 40, 'm'], ['un cavall dels cavallets', 150, 'cm'], ['un caramel', 2, 'cm']];
const UNITS = ['mm', 'cm', 'm', 'km'];
const units = rnd => {
  const [what, n, u] = pickOf(SIZES, rnd);
  return Pick({ k: 'note', icon: 'ruler', lines: [cap(what)] }, `Quant pot mesurar ${what}?`, [`${n} ${u}`, ...UNITS.filter(x => x !== u).map(x => `${n} ${x}`)],
    'Pensa en coses que coneixes: un pam fa uns 20 cm, una porta uns 2 m, i 1 km és una bona passejada.', `${cap(what)} pot mesurar uns ${n} ${u}.`, { order: UNITS.map(x => `${n} ${x}`) });
};

/* ---------- 2 · Els cavallets ---------- */
export const COLORS = { vermell: '#E5484D', blau: '#3D7BE0', groc: '#F5C33B', verd: '#38A169', lila: '#9B6ADB', taronja: '#F28C28' };
export const BALLS = { vermella: '#E5484D', blava: '#3D7BE0', groga: '#F5C33B', verda: '#38A169' };
// a coloured dot before the name of a colour, in an option
export const dot = c => `<i class="dot" style="--c:${COLORS[c] || BALLS[c] || '#999'}"></i>`;
const colorOpt = c => `${dot(c)}${cap(c)}`;
const SHAPES = ['AB', 'ABC', 'AAB', 'ABB', 'AABB', 'ABAC'];
// the piece that repeats: a shape of letters, each letter a colour
const unitOf = (rnd, shapes = SHAPES) => {
  const s = pickOf(shapes, rnd), cs = shuffle(Object.keys(COLORS), rnd), m = {};
  let j = 0; for (const ch of s) if (!(ch in m)) m[ch] = cs[j++];
  return [...s].map(ch => m[ch]);
};
const rep = (u, n) => Array.from({ length: n }, (_, i) => u[i % u.length]);
// the colours of the paint pots: those of the piece and extra more
const palOf = (u, rnd, extra = 0) => shuffle([...new Set(u), ...shuffle(Object.keys(COLORS).filter(c => !u.includes(c)), rnd).slice(0, extra)], rnd);
const copyRow = rnd => {
  const u = unitOf(rnd, ['AB', 'ABC', 'AAB']), model = rep(u, 8);
  return Paint({ k: 'horses', model, row: model.map(() => null) }, 'Pinta els cavalls de baix iguals que els de dalt: tria un color i toca un cavall.', model,
    'Mira el cavall que té just a sobre.', 'Iguals! Els cavallets ja tenen colors.', { pal: palOf(u, rnd, 1) });
};
const goOn = rnd => {
  const u = unitOf(rnd), n = Math.max(8, u.length * 3), full = rep(u, n), shown = u.length * 2;
  return Paint({ k: 'horses', row: full.map((c, i) => i < shown ? c : null) }, 'Continua el patró dels cavallets: pinta els que falten.', full,
    `El tros que es repeteix és: ${u.join(', ')}.`, 'Patró acabat!', { pal: palOf(u, rnd, 1) });
};
const nextOne = rnd => {
  const u = unitOf(rnd), n = u.length * 2 + int(rnd, 1, u.length), full = rep(u, n + 1), ans = full[n], pal = palOf(u, rnd, 1);
  return Pick({ k: 'horses', row: [...full.slice(0, n), '?'] }, 'De quin color ha de ser el cavall que falta?', [colorOpt(ans), ...pal.filter(c => c !== ans).map(colorOpt)],
    `Busca el tros que es repeteix (${u.join(', ')}) i continua.`, `${cap(ans)}!`, { order: pal.map(colorOpt) });
};
const unitLen = rnd => {
  const u = unitOf(rnd), full = rep(u, u.length * 3);
  return Num({ k: 'horses', row: full }, 'Quants cavalls té el tros que es repeteix?', u.length, 'Busca on el patró torna a començar igual.', `${u.length}: ${u.join(', ')}, i torna a començar.`);
};
const nth = rnd => {
  const u = unitOf(rnd, ['AB', 'ABC', 'AAB', 'ABB']), L = u.length, N = int(rnd, 3 * L + 1, 30), ans = u[(N - 1) % L], pal = palOf(u, rnd, 1);
  return Pick({ k: 'horses', row: rep(u, 2 * L), nums: true }, `De quin color serà el cavall número ${N}?`, [colorOpt(ans), ...pal.filter(c => c !== ans).map(colorOpt)],
    `El tros té ${L} cavalls: el ${L}, el ${2 * L}, el ${3 * L}... són de color ${u[L - 1]}. Compta de ${L} en ${L} fins a prop del ${N}.`, `${cap(el(N))} és ${ans}.`, { order: pal.map(colorOpt) });
};
const series = (steps, mid) => rnd => {
  const s = pickOf(steps, rnd), a = s > 0 ? int(rnd, 1, 40) : int(rnd, -s * 6, -s * 6 + 40), items = Array.from({ length: 6 }, (_, i) => a + i * s), g = mid ? int(rnd, 1, 5) : 5;
  return Num({ k: 'poles', items: items.map((x, i) => i === g ? null : x) }, mid ? 'Quin número falta?' : 'Quin número porta el cavall següent?', items[g],
    "Mira quant canvia d'un cavall al següent.", `Va ${s > 0 ? 'de' : 'enrere, de'} ${Math.abs(s)} en ${Math.abs(s)}: ${items.join(', ')}.`);
};
const RULES = [['Suma 2', x => x + 2], ['Suma 3', x => x + 3], ['Suma 4', x => x + 4], ['Suma 6', x => x + 6], ['Resta 3', x => x - 3], ['Resta 4', x => x - 4], ['Multiplica per 2', x => x * 2]];
const rule = rnd => {
  const [name, f] = pickOf(RULES, rnd), a = name.startsWith('Resta') ? int(rnd, 30, 50) : name.startsWith('Multiplica') ? int(rnd, 1, 5) : int(rnd, 1, 20), items = [a];
  for (let i = 0; i < 4; i++) items.push(f(items[i]));
  return Pick({ k: 'poles', items }, 'Quina és la regla de la sèrie?', four(name, shuffle(RULES.map(x => x[0]).filter(x => x !== name), rnd)),
    "Mira com passes d'un número al següent, i comprova-ho amb tots.", `${name}: ${items.join(', ')}.`);
};
// figures of lamps that grow: a centre with arms (2, 3 or 4) one lamp longer each time, or two rows
const grow = rnd => {
  const kind = pickOf([2, 3, 4, 'rows'], rnd), f = k => kind === 'rows' ? 2 * k : 1 + kind * (k - 1), ask = int(rnd, 4, 6);
  return Num({ k: 'grow', kind, n: 3 }, `Cada figura de llums té més bombetes que l'anterior. Quantes en tindrà la figura ${ask}?`, f(ask),
    `Compta quantes bombetes s'afegeixen d'una figura a la següent: ${f(1)}, ${f(2)}, ${f(3)}...`, `${Array.from({ length: ask }, (_, i) => f(i + 1)).join(', ')}: la figura ${ask} en té ${f(ask)}.`);
};

/* ---------- 3 · La sínia ---------- */
// Eight cabins, numbered the other way from the clock, so that turning like the clock (↻) brings 2, 3, 4... down to the platform. A place
// of the wheel is an eighth from the bottom (0) going like the clock: 2 is the left, 4 the top, 6 the right. With the wheel turned r eighths
// like the clock, cabin c is at place r − (c − 1), and the cabin at the bottom is r + 1
export const CABINS = 8;
const POS = ['a baix', null, "a l'esquerra", null, 'a dalt', null, 'a la dreta', null];
const TURNS = { 2: 'un quart de volta', 4: 'mitja volta', 6: 'tres quarts de volta', 8: 'una volta sencera' };
const CW = 'en el sentit de les agulles del rellotge', CCW = 'en sentit contrari a les agulles del rellotge';
const mod8 = x => ((x % 8) + 8) % 8;
export const bottomOf = r => mod8(r) + 1;
const wheel = (r, o = {}) => ({ k: 'wheel', r, ...o });
const bring = rnd => {
  const c = int(rnd, 2, 8), K = kid(rnd);
  return Turn(wheel(0), `Porta la cabina ${c} a baix, perquè hi pugi ${K.name}.`, c, 'Toca les fletxes i mira quina cabina arriba a baix de tot.', `Cabina ${c}! ${cap(K.name)} hi puja.`, { free: true, sp: K.sp });
};
const quarter = rnd => {
  const k = pickOf([2, 4, 6], rnd);
  return Turn(wheel(0, { quarters: true }), `Fes ${TURNS[k]} ${CW} (↻).`, k, `Cada toc és un quart de volta: la cabina passa d'una ratlla de punts a la següent.`, `Això és ${TURNS[k]}!`, { by: 'turned', step: 2, free: true });
};
const PLACES4 = ['A dalt', 'A baix', "A l'esquerra", 'A la dreta'];
const where = rnd => {
  const c = int(rnd, 1, 8), p0 = 2 * at(4, rnd), k = pickOf([2, 4, 6], rnd), cw = at(2, rnd) > 0, p1 = mod8(p0 + (cw ? k : -k)), ans = cap(POS[p1]);
  return Pick(wheel(mod8(p0 + c - 1), { lit: c, arrow: cw ? 'cw' : 'ccw' }), `La cabina ${c} és ${POS[p0]}. Si la sínia fa ${TURNS[k]} ${cw ? CW : CCW}, on quedarà la cabina ${c}?`,
    [ans, ...PLACES4.filter(o => o !== ans)], `Fes caminar la cabina amb el dit, ${cw ? 'com les agulles del rellotge' : 'al revés de les agulles del rellotge'}: cada quart de volta la porta al costat següent.`, `${ans}!`, { order: PLACES4 });
};
const nextDown = rnd => {
  const c = int(rnd, 1, 8), k = pickOf([2, 4, 6], rnd), cw = at(2, rnd) > 0, ans = bottomOf(c - 1 + (cw ? k : -k));
  return Num(wheel(c - 1, { arrow: cw ? 'cw' : 'ccw' }), `Ara és a baix la cabina ${c}. Si la sínia fa ${TURNS[k]} ${cw ? CW : CCW}, quina cabina quedarà a baix?`, ans,
    'Cada quart de volta passen dues cabines per baix. Mira cap a on van els números.', `La cabina ${ans}.`);
};
const TURN_OPTS = [2, 4, 6, 8].map(k => cap(TURNS[k]));
const degrees = rnd => {
  const k = pickOf([2, 4, 6, 8], rnd);
  if (at(2, rnd)) return Num(wheel(0, { arrow: 'cw', sweep: k }), `Quants graus gira la sínia si fa ${TURNS[k]}?`, 45 * k, 'Una volta sencera són 360°. Un quart de volta, 90°: un angle recte.', `${cap(TURNS[k])} = ${45 * k}°.`, { unit: '°' });
  return Pick(wheel(0, { arrow: 'cw' }), `La sínia ha girat ${45 * k}°. Quina part de volta ha fet?`, [cap(TURNS[k]), ...TURN_OPTS.filter(o => o !== cap(TURNS[k]))],
    'Un quart de volta són 90°, mitja volta 180° i la volta sencera 360°.', `${45 * k}° = ${TURNS[k]}.`, { order: TURN_OPTS });
};
const ANGLES = [30, 45, 60, 90, 90, 120, 135, 150];
const KINDS3 = ['Agut', 'Recte', 'Obtús'];
const angleKind = d => d === 90 ? 'Recte' : d < 90 ? 'Agut' : 'Obtús';
const angleType = rnd => {
  const d = pickOf(ANGLES, rnd), A = angleKind(d);
  return Pick({ k: 'angle', deg: d, rot: 15 * int(rnd, 0, 5) }, 'Entre els dos radis vermells de la sínia hi ha un angle. De quina mena és?', [A, ...KINDS3.filter(x => x !== A)],
    "Un angle recte és com la cantonada d'un full. Si és més tancat, és agut; si és més obert, és obtús.", `És ${A.toLowerCase()}: fa ${d}°.`, { order: KINDS3 });
};
const spokes = rnd => {
  const a = int(rnd, 1, 8), k = int(rnd, 1, 4), b = mod8(a - 1 + k) + 1;
  return Num(wheel(0, { pair: [a, b] }), `Quants graus hi ha entre el radi de la cabina ${a} i el de la cabina ${b}?`, 45 * k,
    "Entre dues cabines del costat hi ha 45°, la meitat d'un angle recte. Compta els espais que hi ha entre les dues.", `${k} × 45° = ${45 * k}°.`, { unit: '°' });
};
const turnBack = rnd => {
  const k = pickOf([2, 4, 6], rnd), cw = at(3, rnd) === 0;
  return Turn(wheel(int(rnd, 0, 7), { quarters: true }), `Fes ${TURNS[k]} ${cw ? CW : CCW}.`, cw ? k : -k,
    `Ara cada toc mou una sola cabina: un quart de volta són 2 tocs. Gira amb ${cw ? '↻' : '↺'}.`, `Perfecte: ${TURNS[k]} ${cw ? '↻' : '↺'}.`, { by: 'turned' });
};
const spin = rnd => {
  const T = pickOf([4, 8, 12, 16, 20], rnd), k = pickOf([2, 4, 6, 16], rnd), ans = T * k / 8, what = k === 16 ? 'dues voltes senceres' : TURNS[k];
  return Num(wheel(0, { arrow: 'cw' }), `La sínia fa una volta sencera en ${T} minuts. Quants minuts tarda a fer ${what}?`, ans,
    k === 16 ? `Dues voltes duren el doble: ${T} + ${T}.` : `Reparteix els ${T} minuts en 4 quarts: cada quart de volta dura ${T / 4} minuts.`, `${cap(what)}: ${ans} minuts.`, { unit: 'min' });
};

/* ---------- 4 · La muntanya russa ---------- */
export const POSTS = 'ABCDEFG';
const prof = (ys, o = {}) => ({ k: 'profile', ys, max: 40, ...o });
// The heights of a track, in metres, every 5: it leaves the station at 5 m, climbs the first hill (30 to 40 m) and then goes up and down.
// Its highest and its lowest points are one each; flat lets two posts side by side be as high
function track(rnd, n = 7, flat = false) {
  for (let t = 0; t < 200; t++) {
    const ys = [5, 5 * int(rnd, 6, 8)];
    for (let k = 0; ys.length < n && k < 100; k++) { const y = 5 * int(rnd, 0, 8); if (y !== ys[ys.length - 1] || flat && at(4, rnd) === 0) ys.push(y); }
    const hi = Math.max(...ys), lo = Math.min(...ys);
    if (ys.length === n && ys.filter(y => y === hi).length === 1 && ys.filter(y => y === lo).length === 1) return ys;
  }
  return [5, 40, 15, 30, 0, 20, 10].slice(0, n);
}
const P = i => POSTS[i];
const downs = ys => ys.flatMap((y, i) => i < ys.length - 1 && ys[i + 1] < y ? [i] : []);
const highTap = rnd => {
  const ys = track(rnd), hi = at(2, rnd) > 0, v = hi ? Math.max(...ys) : Math.min(...ys), i = ys.indexOf(v);
  return Tap(prof(ys, { pick: true }), `Toca el punt més ${hi ? 'alt' : 'baix'} de la muntanya russa.`, 'P' + i, `Busca el punt que queda més ${hi ? 'amunt' : 'avall'} de tots.`, `El punt ${P(i)}: ${v} m.`);
};
const heightAt = rnd => {
  const ys = track(rnd), i = int(rnd, 1, 6);
  return Num(prof(ys, { hl: [i] }), `A quina alçada és el punt ${P(i)}?`, ys[i], "Segueix la ratlla del punt fins als números de l'esquerra. Entre dos números hi ha el 5 del mig.", `El punt ${P(i)} és a ${ys[i]} m.`, { unit: 'm' });
};
const UPS = ['Puja', 'Baixa', 'Va pla'];
const upDown = rnd => {
  const ys = track(rnd, 7, true), flats = ys.flatMap((y, i) => i < 6 && ys[i + 1] === y ? [i] : []), i = flats.length && at(3, rnd) === 0 ? pickOf(flats, rnd) : int(rnd, 0, 5);
  const d = ys[i + 1] - ys[i], ans = d > 0 ? 'Puja' : d < 0 ? 'Baixa' : 'Va pla';
  return Pick(prof(ys, { hl: [i, i + 1] }), `Del punt ${P(i)} al punt ${P(i + 1)}, el tren puja, baixa o va pla?`, [ans, ...UPS.filter(x => x !== ans)],
    'Mira si el segon punt és més amunt, més avall o igual.', `${ans}: de ${ys[i]} m a ${ys[i + 1]} m.`, { order: UPS });
};
const drop = rnd => {
  const ys = track(rnd), i = pickOf(downs(ys), rnd);
  return Num(prof(ys, { hl: [i, i + 1] }), `Quants metres baixa el tren del punt ${P(i)} al punt ${P(i + 1)}?`, ys[i] - ys[i + 1],
    `Llegeix les dues alçades i resta: ${P(i)} menys ${P(i + 1)}.`, `${ys[i]} − ${ys[i + 1]} = ${ys[i] - ys[i + 1]} m.`, { unit: 'm' });
};
const build = rnd => {
  let ys = [];
  for (let t = 0; t < 50 && new Set(ys).size < 4; t++) ys = [int(rnd, 1, 2), int(rnd, 5, 8), int(rnd, 1, 6), int(rnd, 3, 8), int(rnd, 1, 4)].map(x => 5 * x);
  return Track(prof(ys.map(() => 0), { set: true }), `Construeix la via: posa cada pilar a la seva alçada. ${ys.map((y, i) => `${P(i)}: ${y} m`).join(', ')}.`, ys,
    "Toca cada columna a l'altura del seu número. Entre dues ratlles hi ha 5 m.", 'Via construïda! El tren ja hi pot passar.');
};
const climb = rnd => {
  let ys = track(rnd);
  for (let t = 0; t < 50 && ys.filter((y, i) => i && y > ys[i - 1]).length < 2; t++) ys = track(rnd);
  const ups = ys.flatMap((y, i) => i && y > ys[i - 1] ? [y - ys[i - 1]] : []), t = ups.reduce((s, x) => s + x, 0);
  return Num(prof(ys), `Quants metres puja el tren en total, del punt A al punt ${P(ys.length - 1)}?`, t, 'Suma només els trossos que pugen. Els que baixen no compten.', `${ups.join(' + ')} = ${t} m de pujada.`, { unit: 'm' });
};
const range = rnd => {
  const ys = track(rnd), hi = Math.max(...ys), lo = Math.min(...ys);
  return Num(prof(ys), 'Quants metres hi ha del punt més alt de la via al més baix?', hi - lo, 'Busca el punt més alt i el més baix, i resta les seves alçades.', `${hi} − ${lo} = ${hi - lo} m.`, { unit: 'm' });
};
const train = rnd => {
  const kind = at(3, rnd);
  if (kind === 0) { const w = int(rnd, 3, 6), r = int(rnd, 2, 3), s = int(rnd, 2, 4); return Num({ k: 'train', w, r, s }, `El tren té ${w} vagons. Cada vagó té ${r} files de ${s} seients. Quantes persones hi caben?`, w * r * s, `Primer un vagó: ${r} × ${s}. Després, tots els vagons.`, `${r} × ${s} = ${r * s} per vagó, i × ${w} = ${w * r * s}.`); }
  if (kind === 1) {
    const c = pickOf([16, 18, 20, 24, 28, 32], rnd), n = int(rnd, 3, 9);
    return Num({ k: 'note', icon: 'coaster', lines: [`${c} persones per viatge`, `${n} viatges`] }, `Al tren hi caben ${c} persones. Avui ha fet ${n} viatges ple. Quantes persones hi han pujat?`, c * n,
      c % 10 ? `${n} × ${c}: fes-ho per parts, ${n} × ${c - c % 10} i ${n} × ${c % 10}.` : `${n} × ${c / 10} desenes.`, `${n} × ${c} = ${c * n} persones.`);
  }
  const c = pickOf([12, 16, 20, 24], rnd), n = int(rnd, 3, 6);
  return Num({ k: 'note', icon: 'queue', lines: [`${c * n} persones a la cua`, `${c} per viatge`] }, `A la cua hi ha ${c * n} persones i al tren n'hi caben ${c}. Quants viatges calen?`, n,
    `Quantes vegades cap ${c} a ${c * n}? Prova ${c} × 3, ${c} × 4...`, `${c * n} ÷ ${c} = ${n} viatges.`);
};
export const COASTERS = ['La Serp', 'El Llamp'];
const bigDrop = ys => Math.max(...ys.slice(1).map((y, i) => ys[i] - y));
const versus = rnd => {
  let a, b, hi;
  for (let t = 0; t < 100; t++) { a = track(rnd, 6); b = track(rnd, 6); hi = at(2, rnd) > 0; if (hi ? Math.max(...a) !== Math.max(...b) : bigDrop(a) !== bigDrop(b)) break; }
  const A = hi ? Math.max(...a) : bigDrop(a), B = hi ? Math.max(...b) : bigDrop(b), w = A > B ? 0 : 1;
  return Pick({ k: 'profiles', a, b, names: COASTERS }, hi ? 'Quina muntanya russa arriba més amunt?' : "Quina muntanya russa té la baixada més gran d'un punt al següent?", [COASTERS[w], COASTERS[1 - w]],
    hi ? 'Busca el punt més alt de cada una i compara.' : 'Busca la baixada més llarga de cada una i resta les alçades.', `${COASTERS[w]}: ${Math.max(A, B)} m, i l'altra ${Math.min(A, B)} m.`, { order: COASTERS });
};

/* ---------- 5 · El berenar ---------- */
const ORD = { 2: ['mig', 'mitjos'], 3: ['terç', 'terços'], 4: ['quart', 'quarts'], 5: ['cinquè', 'cinquens'], 6: ['sisè', 'sisens'], 8: ['vuitè', 'vuitens'], 10: ['desè', 'desens'], 12: ['dotzè', 'dotzens'] };
// «tres vuitens»; and «la meitat», «un terç»... for one part
export const frw = (a, b) => `${a === 1 ? 'un' : words(a)} ${ORD[b][a === 1 ? 0 : 1]}`;
const partName = b => b === 2 ? 'la meitat' : frw(1, b);
const FOODS = [{ k: 'pizza', name: 'la pizza', of: 'de la pizza', top: 'pernil' }, { k: 'coca', name: 'la coca', of: 'de la coca', top: 'xocolata' }, { k: 'pastis', name: 'el pastís', of: 'del pastís', top: 'maduixes' }];
const food = (f, n, on = [], o = {}) => ({ k: 'food', food: f.k, n, on, ...o });
const eat = rnd => {
  const f = pickOf(FOODS, rnd), n = pickOf([4, 6, 8], rnd), k = int(rnd, 1, n - 1);
  return Mark(food(f, n, [], { tap: true }), `Menja't ${k} ${k === 1 ? 'tros' : 'trossos'} ${f.of}, que en té ${n}. Toca'ls.`, [], `Toca ${k} trossos, els que vulguis.`, `Te n'has menjat ${fr(k, n)}: ${frw(k, n)}.`, { need: k });
};
const whichFr = rnd => {
  const f = pickOf(FOODS, rnd), n = pickOf([3, 4, 5, 6, 8], rnd), k = int(rnd, 1, n - 1), on = shuffle([...Array(n).keys()], rnd).slice(0, k).sort((a, b) => a - b);
  return Pick(food(f, n, on), `Quina part ${f.of} té ${f.top} (els trossos pintats)?`, four(fr(k, n), [fr(n - k, n), fr(k, n - k), fr(n, k), fr(k + 1, n)]),
    'Compta els trossos pintats (el número de dalt) i tots els trossos (el de baix).', `${fr(k, n)}: ${frw(k, n)}.`);
};
const part = rnd => {
  const [n, b] = pickOf([[8, 2], [8, 4], [6, 2], [6, 3], [12, 3], [12, 4], [10, 5], [10, 2], [12, 6]], rnd), f = pickOf(FOODS, rnd);
  return Num(food(f, n), `${cap(f.name)} té ${n} trossos. Quants trossos són ${partName(b)} (${fr(1, b)})?`, n / b, `${fr(1, b)} vol dir repartir-ho en ${b} parts iguals: ${n} ÷ ${b}.`, `${cap(partName(b))} de ${n} són ${n / b} trossos.`);
};
const paintFr = rnd => {
  const [a, b, m] = pickOf([[1, 2, 2], [3, 4, 1], [3, 4, 2], [2, 3, 2], [1, 3, 2], [2, 5, 2], [5, 6, 1], [3, 8, 1], [1, 4, 2]], rnd), n = b * m, k = a * m, f = pickOf(FOODS, rnd);
  return Mark(food(f, n, [], { tap: true }), `Pinta ${fr(a, b)} ${f.of}.`, [], m > 1 ? `${cap(f.name)} té ${n} trossos: fes ${b} parts iguals de ${m} trossos i pinta'n ${a}.` : `${fr(a, b)}: ${a} trossos de ${b}.`,
    m > 1 ? `${fr(k, n)} és el mateix que ${fr(a, b)}.` : `${fr(a, b)} pintat!`, { need: k });
};
const ITEMS = [['globus', 'vermells'], ['gelats', 'de maduixa'], ['caramels', 'de llimona'], ['tiquets', 'premiats']];
const groupFr = rnd => {
  const b = pickOf([2, 3, 4, 5], rnd), m = int(rnd, 2, 6), n = b * m, [it, adj] = pickOf(ITEMS, rnd);
  return Num({ k: 'group', n, rows: b, item: it }, `${cap(partName(b))} dels ${n} ${it} són ${adj}. Quants ${it} ${adj} hi ha?`, m, `Fes ${b} grups iguals amb els ${n} ${it}: un grup és ${fr(1, b)}. ${n} ÷ ${b}.`, `${n} ÷ ${b} = ${m}.`);
};
const manyFr = rnd => {
  const [a, b] = pickOf([[3, 4], [2, 3], [2, 5], [3, 5], [5, 6], [3, 8], [3, 4]], rnd), m = int(rnd, 2, Math.max(2, Math.floor(24 / b))), n = b * m, [it, adj] = pickOf(ITEMS, rnd);
  return Num({ k: 'group', n, rows: b, item: it }, `${fr(a, b)} dels ${n} ${it} són ${adj}. Quants n'hi ha?`, a * m,
    `Primer ${fr(1, b)}: ${n} ÷ ${b} = ${m}. Després, ${a} vegades: ${a} × ${m}.`, `${fr(1, b)} són ${m}, i ${fr(a, b)} són ${a * m}.`);
};
const compareFr = rnd => {
  const kind = at(3, rnd); let A, B;
  if (kind === 0) { const n = pickOf([5, 6, 8], rnd), a = int(rnd, 1, n - 1); let b = int(rnd, 1, n - 2); if (b >= a) b++; A = [a, n]; B = [b, n]; }
  else if (kind === 1) { const xs = shuffle([2, 3, 4, 5, 6, 8], rnd); A = [1, xs[0]]; B = [1, xs[1]]; }
  else [A, B] = shuffle(pickOf([[[1, 2], [2, 4]], [[1, 2], [4, 8]], [[2, 4], [4, 8]], [[1, 3], [2, 6]], [[3, 4], [6, 8]]], rnd).slice(), rnd);
  const va = A[0] / A[1], vb = B[0] / B[1], O = [fr(...A), fr(...B), 'Són iguals'], ans = va === vb ? O[2] : va > vb ? O[0] : O[1];
  return Pick({ k: 'two', food: pickOf(FOODS, rnd).k, A: { n: A[1], on: A[0] }, B: { n: B[1], on: B[0] } }, `Quina part és més gran: ${fr(...A)} o ${fr(...B)}?`, [ans, ...O.filter(o => o !== ans)],
    kind === 1 ? 'Com més parts es fan, més petit és cada tros.' : 'Mira els dibuixos: quina part pintada ocupa més?', ans === O[2] ? `Són iguals: ${fr(...A)} = ${fr(...B)}.` : `${ans} és més gran.`, { order: O });
};
const equal = rnd => {
  const [a, b, n] = pickOf([[1, 2, 4], [1, 2, 8], [1, 2, 6], [1, 4, 8], [3, 4, 8], [1, 3, 6], [2, 3, 6], [1, 2, 10]], rnd), k = a * n / b;
  return Num({ k: 'two', food: 'pizza', A: { n: b, on: a }, B: { n, on: 0 } }, `${a === 1 && b === 2 ? 'Mitja pizza' : `${cap(frw(a, b))} de pizza`} (${fr(a, b)}) és igual que quants ${ORD[n][1]}?`, k,
    `La segona pizza té ${n} trossos. Quants en caldria pintar perquè fos tan gran com la part de la primera?`, `${fr(a, b)} = ${fr(k, n)}.`);
};
const HOUR_PARTS = [['mitja hora', 1, 2, 30], ["un quart d'hora", 1, 4, 15], ["tres quarts d'hora", 3, 4, 45], ["un terç d'hora", 1, 3, 20], ["dos terços d'hora", 2, 3, 40]];
const hourFr = rnd => {
  const [t, a, b, m] = pickOf(HOUR_PARTS, rnd);
  return Num({ k: 'clockq', a, b }, `La cua de la sínia dura ${t} (${fr(a, b)} d'hora). Quants minuts són?`, m, `Una hora són 60 minuts. ${fr(1, b)} d'hora és 60 ÷ ${b}${a > 1 ? `, i ${fr(a, b)}, ${a} vegades` : ''}.`, `${cap(t)} = ${m} minuts.`, { unit: 'min' });
};

/* ---------- 6 · Formes i vistes ---------- */
export const SOLIDS = {
  cub: { name: 'el cub', f: 6, e: 12, v: 8 }, prisma: { name: 'el prisma', f: 6, e: 12, v: 8 }, piramide: { name: 'la piràmide', f: 5, e: 8, v: 5 },
  triangular: { name: 'el prisma triangular', f: 5, e: 9, v: 6 }, cilindre: { name: 'el cilindre', roll: true }, con: { name: 'el con', roll: true }, esfera: { name: "l'esfera", roll: true }
};
const solidName = s => cap(SOLIDS[s].name.replace(/^(el |la |l')/, ''));
const HINT_SOLID = { cub: 'El cub és com un dau: totes les cares són quadrats iguals.', prisma: 'El prisma és com una capsa de sabates.', piramide: 'La piràmide té una base i acaba en punta.',
  triangular: 'El prisma triangular té un triangle a cada punta.', cilindre: 'El cilindre és com una llauna.', con: 'El con és com un cucurutxo de gelat.', esfera: "L'esfera és com una pilota." };
const tapSolid = rnd => {
  const list = shuffle(Object.keys(SOLIDS), rnd).slice(0, 5), s = pickOf(list, rnd);
  return Tap({ k: 'solids', list, tap: true }, `Toca ${SOLIDS[s].name}.`, s, HINT_SOLID[s], `Això és ${SOLIDS[s].name}!`, { solid: s });
};
const rolls = rnd => {
  const list = shuffle(Object.keys(SOLIDS), rnd).slice(0, 5), ans = list.filter(s => SOLIDS[s].roll);
  return Mark({ k: 'solids', list, tap: true }, 'Marca totes les formes que poden rodolar.', ans, 'Les que tenen una part corba, rodona, poden rodolar.', `Rodolen: ${listOf(ans.map(s => SOLIDS[s].name))}.`);
};
const POLY = ['cub', 'prisma', 'piramide', 'triangular'];
const HINT_F = { cub: 'Davant, darrere, dalt, baix i els dos costats.', prisma: 'Com una capsa: davant, darrere, dalt, baix i els dos costats.', piramide: 'La base de baix i els triangles dels costats.', triangular: 'Els dos triangles de les puntes i els rectangles dels costats.' };
const faces = rnd => { const s = pickOf(POLY, rnd), S = SOLIDS[s]; return Num({ k: 'solid', s }, `Quantes cares té ${S.name}?`, S.f, HINT_F[s], `${cap(S.name)} té ${S.f} cares.`, { solid: s }); };
const ev = rnd => {
  const s = pickOf(POLY, rnd), S = SOLIDS[s], v = at(2, rnd) > 0;
  return Num({ k: 'solid', s, show: v ? 'v' : 'e' }, v ? `Quants vèrtexs té ${S.name}? Els vèrtexs són les punxes.` : `Quantes arestes té ${S.name}? Les arestes són les ratlles on es toquen dues cares.`, v ? S.v : S.e,
    v ? 'Compta les punxes de baix i les de dalt.' : 'Compta les arestes de baix, les de dalt i les dels costats. Les amagades (de punts) també compten!', `${cap(S.name)} té ${v ? `${S.v} vèrtexs` : `${S.e} arestes`}.`, { solid: s });
};
const DESC = { cub: 'Té 6 cares i totes són quadrats iguals.', prisma: 'Té 6 cares rectangulars, com una capsa.', piramide: 'Té una base quadrada i 4 cares de triangle que acaben en punta.',
  triangular: 'Té 2 cares de triangle i 3 de rectangle.', cilindre: 'Té 2 cares rodones i una superfície corba.', con: 'Té una cara rodona i acaba en punta.', esfera: 'És tota corba i no té cap cara plana.' };
const guess = rnd => {
  const s = pickOf(Object.keys(SOLIDS), rnd);
  return Pick({ k: 'note', icon: 'shape', lines: [DESC[s]] }, 'Quina forma és?', four(solidName(s), shuffle(Object.keys(SOLIDS).filter(x => x !== s), rnd).map(solidName)), 'Imagina cada forma i compta les seves cares.', `${solidName(s)}.`, { solid: s });
};
const NETS = ['cub', 'piramide', 'triangular', 'cilindre', 'con'];
const net = rnd => {
  const s = pickOf(NETS, rnd);
  return Pick({ k: 'net', s }, 'Si retalles i plegues aquest desenvolupament, quina forma surt?', four(solidName(s), shuffle(Object.keys(SOLIDS).filter(x => x !== s), rnd).map(solidName)),
    'Mira quantes cares té el dibuix i de quina forma són.', `${solidName(s)}!`, { solid: s });
};
// A pile of cubes on a floor of 3 × 3: h[d][x], d the row from the back (0) to the front (2) and x the column from the left. A tower is never
// taller than the one behind it, so the drawing shows them all; every tower stands on the floor
export function pile(rnd, lo = 5, hi = 12) {
  for (let t = 0; t < 300; t++) {
    const h = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let x = 0; x < 3; x++) { let top = int(rnd, 0, 3); for (let d = 0; d < 3; d++) { h[d][x] = top; top = Math.min(top, int(rnd, 0, 3)); } }
    const n = h.flat().reduce((s, v) => s + v, 0);
    if (n >= lo && n <= hi && h.flat().some(v => v === 0) && h[2].some(v => v > 0)) return h;
  }
  return [[2, 1, 0], [1, 1, 0], [1, 0, 0]];
}
export const topOf = h => h.map(r => r.map(v => v > 0 ? 1 : 0));
export const frontOf = h => [0, 1, 2].map(x => Math.max(h[0][x], h[1][x], h[2][x]));
const countCubes = rnd => {
  const h = pile(rnd, 5, 12), n = h.flat().reduce((s, v) => s + v, 0);
  return Num({ k: 'stack', h }, 'Quants cubs hi ha a la pila? Cada torre arriba fins a terra.', n, 'Compta torre per torre: quants cubs té cadascuna?', `${h.flat().filter(Boolean).join(' + ')} = ${n} cubs.`, { stack: h });
};
const viewRound = kind => rnd => {
  let h = pile(rnd, 5, 11);
  for (let t = 0; t < 300; t++) {
    const T = topOf(h), F = frontOf(h);
    if (kind === 'top' ? key(T) !== key(T.map(r => r.slice().reverse())) && key(T) !== key(T.slice().reverse()) : F[0] !== F[2]) break;
    h = pile(rnd, 5, 11);
  }
  const T = topOf(h), F = frontOf(h), right = kind === 'top' ? { v: 'top', g: T } : { v: 'front', g: F };
  const others = kind === 'top'
    ? [{ v: 'top', g: T.map(r => r.slice().reverse()), what: "Aquesta té la dreta i l'esquerra canviades." }, { v: 'top', g: T.slice().reverse(), what: 'Aquesta té el davant i el darrere canviats.' }, { v: 'front', g: F, what: 'Aquesta és la vista de davant.' }]
    : [{ v: 'front', g: F.slice().reverse(), what: "Aquesta té la dreta i l'esquerra canviades." }, { v: 'top', g: T, what: 'Aquesta és la vista des de dalt.' }, { v: 'front', g: F.map((x, i) => i === 1 ? (x === 3 ? 2 : x + 1) : x), what: 'Aquí una torre té una altra alçada.' }];
  const id = o => key([o.v, o.g]), seen = new Set([id(right)]), opts = [right];
  for (const o of others) if (opts.length < 3 && !seen.has(id(o))) { seen.add(id(o)); opts.push(o); }
  shuffle(opts, rnd);
  return Tap({ k: 'views', h, opts }, kind === 'top' ? 'Un dron fa una foto de la pila des de dalt. Quina foto fa? Toca-la.' : 'Si mires la pila de davant, què veus? Toca el dibuix.', 'V' + opts.indexOf(right),
    kind === 'top' ? 'Des de dalt només es veuen els sostres de les torres: on hi ha cubs i on no n\'hi ha.' : 'De davant, cada columna es veu tan alta com la seva torre més alta.',
    kind === 'top' ? 'Aquesta és la foto del dron!' : 'Aquesta és la vista de davant!', { stack: h, view: kind });
};

/* ---------- 7 · Les cues ---------- */
export const RIDES = [{ name: 'Sínia', at: 'a la sínia' }, { name: 'Muntanya russa', at: 'a la muntanya russa' }, { name: 'Cavallets', at: 'als cavallets' }, { name: 'Tómbola', at: 'a la tómbola' }];
export const DAYS2 = ['Dissabte', 'Diumenge'];
export const HOURS = ['11 h', '12 h', '13 h', '14 h', '15 h', '16 h', '17 h'];
const isKid = s => s === 'nen' || s === 'nena';
const markKids = rnd => {
  let q = [];
  for (let t = 0; t < 100; t++) { q = Array.from({ length: 10 }, () => pickOf(VISITORS, rnd)); const n = q.filter(isKid).length; if (n >= 3 && n <= 6) break; }
  const ans = q.flatMap((s, i) => isKid(s) ? ['Q' + i] : []);
  return Mark({ k: 'queue', q, tap: true }, 'Marca tots els nens i les nenes de la cua.', ans, 'Els nens i les nenes són els més petits de la cua.', `N'hi ha ${ans.length}.`);
};
const tallyRead = rnd => {
  const rs = shuffle(RIDES.slice(), rnd).slice(0, 3), v = draw(rnd, 3, r => int(r, 6, 23)), i = at(3, rnd);
  return Num({ k: 'tally', what: rs.map(r => r.name), values: v }, `Quantes persones han anat ${rs[i].at}?`, v[i],
    'Cada paquet de 5 ratlles (quatre i una que les travessa) val 5. Compta de 5 en 5 i suma les que queden.', `${rs[i].name}: ${v[i]} persones.`);
};
const table2 = rnd => { const rs = shuffle(RIDES.slice(), rnd).slice(0, 3); return { rs, cells: rs.map(() => [int(rnd, 12, 48), int(rnd, 12, 48)]) }; };
const tcard = (T, o = {}) => ({ k: 'table2', rows: T.rs.map(r => r.name), cols: DAYS2, cells: T.cells, ...o });
const day = j => DAYS2[j].toLowerCase();
const cell = rnd => {
  const T = table2(rnd), i = at(3, rnd), j = at(2, rnd);
  return Num(tcard(T), `Quantes persones van anar ${T.rs[i].at} el ${day(j)}?`, T.cells[i][j], `Busca la fila «${T.rs[i].name}» i la columna «${DAYS2[j]}»: el número és on es creuen.`, `${T.cells[i][j]} persones.`);
};
const sums = rnd => {
  const T = table2(rnd);
  if (at(2, rnd)) { const i = at(3, rnd), s = T.cells[i][0] + T.cells[i][1]; return Num(tcard(T), `Quantes persones van anar ${T.rs[i].at} entre els dos dies?`, s, `Suma els dos números de la fila «${T.rs[i].name}».`, `${T.cells[i][0]} + ${T.cells[i][1]} = ${s}.`); }
  const j = at(2, rnd), s = T.cells.reduce((a, r) => a + r[j], 0);
  return Num(tcard(T), `Quantes persones van anar a les tres atraccions de la taula el ${day(j)}?`, s, `Suma els tres números de la columna «${DAYS2[j]}».`, `${T.cells.map(r => r[j]).join(' + ')} = ${s}.`);
};
const mode = rnd => {
  const v = draw(rnd, 4, r => int(r, 4, 16)), most = at(3, rnd) > 0, x = most ? Math.max(...v) : Math.min(...v), i = v.indexOf(x), names = RIDES.map(r => r.name);
  return Pick({ k: 'tally', what: names, values: v }, `A la sortida, el parc pregunta: «Quina atracció t'ha agradat més?». Quina va triar ${most ? 'més' : 'menys'} gent?`, [names[i], ...names.filter((_, j) => j !== i)],
    'Compta les ratlles de cada una, de 5 en 5.', `${names[i]}: ${x} vots.`, { order: names });
};
// the minutes of queue of the roller coaster at each hour: every 5, with one highest and one lowest
function waits(rnd) {
  let m = [];
  for (let t = 0; t < 200; t++) { m = HOURS.map(() => 5 * int(rnd, 1, 12)); const hi = Math.max(...m), lo = Math.min(...m); if (new Set(m).size >= 5 && m.filter(x => x === hi).length === 1 && m.filter(x => x === lo).length === 1) return m; }
  return [10, 25, 40, 55, 35, 20, 5];
}
const at_ = i => `a les ${HOURS[i]}`;
const waitRead = rnd => {
  const m = waits(rnd), i = at(7, rnd);
  return Num({ k: 'waits', m, hl: [i] }, `Quants minuts de cua hi havia a la muntanya russa ${at_(i)}?`, m[i], "Segueix el punt d'aquella hora fins als números de l'esquerra. Les ratlles van de 10 en 10, i al mig hi ha el 5.", `${cap(at_(i))}: ${m[i]} minuts.`, { unit: 'min' });
};
const waitTap = rnd => {
  const m = waits(rnd), most = at(2, rnd) > 0, x = most ? Math.max(...m) : Math.min(...m), i = m.indexOf(x);
  return Tap({ k: 'waits', m, pick: true }, most ? "Toca l'hora que hi havia més cua." : "Toca l'hora que hi havia menys cua: la millor per anar-hi!", 'H' + i, `Busca el punt més ${most ? 'amunt' : 'avall'}.`, `${cap(at_(i))}: ${x} minuts.`);
};
const missing = rnd => {
  const T = table2(rnd), i = at(3, rnd), j = at(2, rnd), tot = T.cells.map(r => r[0] + r[1]);
  return Num(tcard(T, { cols: [...DAYS2, 'Total'], cells: T.cells.map((r, a) => [...r.map((x, b) => a === i && b === j ? null : x), tot[a]]) }),
    `A la taula hi falta un número. Quantes persones van anar ${T.rs[i].at} el ${day(j)}?`, T.cells[i][j], `El total de la fila és ${tot[i]}. Treu-hi l'altre dia: ${tot[i]} − ${T.cells[i][1 - j]}.`, `${tot[i]} − ${T.cells[i][1 - j]} = ${T.cells[i][j]}.`);
};
const waitDiff = rnd => {
  const m = waits(rnd); let i = 0, j = 1;
  for (let t = 0; t < 100; t++) { i = at(7, rnd); j = at(7, rnd); if (m[i] > m[j]) break; }
  if (m[i] <= m[j]) [i, j] = [m.indexOf(Math.max(...m)), m.indexOf(Math.min(...m))];
  return Num({ k: 'waits', m, hl: [i, j] }, `Quants minuts més de cua hi havia ${at_(i)} que ${at_(j)}?`, m[i] - m[j], 'Llegeix els dos punts i resta.', `${m[i]} − ${m[j]} = ${m[i] - m[j]} minuts més.`, { unit: 'min' });
};

/* ---------- 8 · La tómbola ---------- */
const urn = balls => ({ k: 'urn', balls });
const draws = rnd => {
  const b = pickOf([{ vermella: 6, blava: 2 }, { groga: 1, verda: 5 }, { blava: 5, groga: 2 }, { vermella: 2, verda: 6 }], rnd);
  return Draw({ k: 'urn', balls: b, drawn: [] }, 'Treu 8 boles sense mirar. Cada bola que treus es torna a posar a la bossa.', 8, 'Normalment surt més el color que hi ha més vegades a la bossa.');
};
const O3 = ['Segur', 'Possible', 'Impossible'];
const BAGS = [{ vermella: 5, blava: 1 }, { vermella: 2, blava: 6 }, { groga: 4, blava: 1 }, { verda: 3, groga: 7 }, { vermella: 4 }, { blava: 3, verda: 3 }];
const sure = rnd => {
  const b = pickOf(BAGS, rnd), cols = Object.keys(b), none = Object.keys(BALLS).find(c => !cols.includes(c)), kind = at(3, rnd);
  const [q, ans] = kind === 0 ? [`treure una bola ${none}`, 'Impossible'] : kind === 1 ? [`treure una bola ${cols[0]}`, cols.length > 1 ? 'Possible' : 'Segur'] : [`treure una bola ${cols.join(' o ')}`, 'Segur'];
  return Pick(urn(b), `Treus una bola sense mirar. És segur, possible o impossible ${q}?`, [ans, ...O3.filter(o => o !== ans)],
    "Si no n'hi ha cap, és impossible. Si totes ho són, és segur. Si només ho són algunes, és possible.", `${ans}.`, { order: O3 });
};
const likely = rnd => {
  const b = pickOf([{ vermella: 5, blava: 2 }, { groga: 3, verda: 6 }, { blava: 4, vermella: 4 }, { vermella: 2, blava: 3, groga: 6 }, { verda: 5, groga: 1, blava: 2 }, { groga: 2, verda: 2 }], rnd);
  const cols = Object.keys(b), top = Math.max(...cols.map(c => b[c])), tops = cols.filter(c => b[c] === top), ans = tops.length > 1 ? 'Igual de fàcil' : colorOpt(tops[0]);
  const O = [...cols.map(colorOpt), ...(cols.length === 2 ? ['Igual de fàcil'] : [])];
  return Pick(urn(b), 'Treus una bola sense mirar. De quin color és més fàcil que surti?', [ans, ...O.filter(o => o !== ans)], 'El color que hi ha més vegades surt més fàcilment.',
    tops.length > 1 ? `Igual de fàcil: n'hi ha ${top} de cada.` : `${cap(tops[0])}: n'hi ha ${top}.`, { order: O });
};
// the sectors of a roulette from how many of each colour, mixed
const spread = (counts, rnd) => shuffle(Object.entries(counts).flatMap(([c, n]) => Array(n).fill(c)), rnd);
const ruleta = sectors => ({ k: 'roulette', sectors });
const spinPick = rnd => {
  const counts = pickOf([{ vermell: 5, blau: 3 }, { groc: 2, verd: 6 }, { vermell: 3, blau: 3, groc: 2 }, { blau: 4, verd: 2, vermell: 2 }, { groc: 4, vermell: 4 }, { verd: 1, blau: 7 }], rnd);
  const cols = Object.keys(counts), top = Math.max(...Object.values(counts)), tops = cols.filter(c => counts[c] === top);
  if (tops.length === 1 && at(3, rnd) > 0) return Pick(ruleta(spread(counts, rnd)), "Fas girar la ruleta. On és més fàcil que s'aturi la fletxa?", [colorOpt(tops[0]), ...cols.filter(c => c !== tops[0]).map(colorOpt)],
    'El color que té més trossos surt més fàcilment.', `${cap(tops[0])}: té ${top} trossos de ${spread(counts, rnd).length}.`, { order: cols.map(colorOpt) });
  const [x, y] = cols, same = counts[x] === counts[y];
  return Pick(ruleta(spread(counts, rnd)), `És igual de fàcil que la fletxa s'aturi al ${x} que al ${y}?`, [same ? 'Sí' : 'No', same ? 'No' : 'Sí'], `Compta els trossos ${x}s i els ${y}s.`,
    same ? `Sí: ${counts[x]} trossos de cada.` : `No: ${counts[x]} contra ${counts[y]}.`, { order: ['Sí', 'No'] });
};
const howMany = rnd => {
  const kind = at(3, rnd);
  if (kind === 0) { const t = pickOf([6, 8, 10], rnd), r = int(rnd, 1, t - 1); return Num(urn({ vermella: r, blava: t - r }), `A la bossa hi ha ${t} boles: ${r} de ${r === 1 ? 'vermella' : 'vermelles'} i les altres, blaves. Quantes boles blaves hi ha?`, t - r, `${t} − ${r}.`, `${t - r} de ${t}: ${t - r > r ? 'és més fàcil treure blava' : t - r < r ? 'és més fàcil treure vermella' : 'és igual de fàcil'}.`); }
  if (kind === 1) { const r = int(rnd, 3, 6), bl = int(rnd, 1, r - 1); return Num(urn({ vermella: r, blava: bl }), `A la bossa hi ha ${r} boles vermelles i ${bl} de ${bl === 1 ? 'blava' : 'blaves'}. Quantes blaves hi has d'afegir perquè sigui igual de fàcil treure vermella que blava?`, r - bl, "Hi ha d'haver tantes blaves com vermelles.", `${bl} + ${r - bl} = ${r}: tantes com vermelles.`); }
  const g = int(rnd, 2, 5), bl = int(rnd, 2, 5);
  return Num(urn({ verda: g, blava: bl }), 'Quantes boles verdes has de treure de la bossa perquè sigui impossible que en surti una de verda?', g, "Impossible vol dir que no n'hi queda cap.", `Totes ${g}: si no en queda cap, és impossible.`);
};
const GOALS = [
  { goal: { sure: 'blau' }, pal: ['blau', 'vermell'], text: 'Pinta tota la ruleta perquè sigui segur que surti blau.', hint: 'Segur vol dir que surt sempre: tots els trossos han de ser blaus.' },
  { goal: { never: 'vermell' }, pal: ['vermell', 'groc', 'verd'], text: 'Pinta tota la ruleta perquè sigui impossible que surti vermell.', hint: 'Impossible vol dir que no hi ha cap tros vermell.' },
  { goal: { more: 'groc', than: 'verd' }, pal: ['groc', 'verd'], text: 'Pinta tota la ruleta perquè sigui més fàcil que surti groc que verd.', hint: "Hi ha d'haver més trossos grocs que verds." },
  { goal: { same: ['vermell', 'blau'] }, pal: ['vermell', 'blau'], text: 'Pinta tota la ruleta perquè sigui igual de fàcil que surti vermell que blau.', hint: "Hi ha d'haver tants trossos vermells com blaus." }
];
const paintWheel = rnd => {
  const n = pickOf([4, 6, 8], rnd), G = pickOf(GOALS, rnd);
  return Paint({ k: 'roulette', sectors: Array(n).fill(null), paint: true }, G.text, null, G.hint, 'Ruleta a punt!', { goal: G.goal, pal: G.pal });
};
// whether the sectors s of a roulette, all painted, do what goal asks
export function meets(goal, s) {
  if (!goal || !Array.isArray(s) || !s.length || s.some(x => !x)) return false;
  const n = c => s.filter(x => x === c).length;
  if (goal.sure) return n(goal.sure) === s.length;
  if (goal.never) return n(goal.never) === 0;
  if (goal.more) return n(goal.more) > n(goal.than);
  if (goal.same) return n(goal.same[0]) === n(goal.same[1]) && n(goal.same[0]) + n(goal.same[1]) === s.length;
  return false;
}
const DICE = [['un 6', 'un número parell', 1, 3], ['un 1', 'un 5', 1, 1], ['un número més gran que 4', 'un número més petit que 4', 2, 3], ['un número senar', 'un número parell', 3, 3],
  ['un 3', 'un número més gran que 3', 1, 3], ['un 7', 'un 2', 0, 1], ['un número més petit que 7', 'un 6', 6, 1]];
const dice = rnd => {
  const [a, b, x, y] = pickOf(DICE, rnd), [A, B, X, Y] = at(2, rnd) ? [a, b, x, y] : [b, a, y, x], O = [cap(A), cap(B), 'Igual de fàcil'], ans = X > Y ? O[0] : X < Y ? O[1] : O[2];
  return Pick({ k: 'dice' }, `Llences un dau. Què és més fàcil: treure ${A} o treure ${B}?`, [ans, ...O.filter(o => o !== ans)], 'Compta, per a cada cosa, quantes cares del dau ho compleixen.',
    `${ans}: ${X} ${X === 1 ? 'cara' : 'cares'} contra ${Y}.`, { order: O });
};
const fair = rnd => {
  const counts = pickOf([{ vermell: 4, blau: 4 }, { vermell: 3, blau: 5 }, { vermell: 3, blau: 3, groc: 2 }, { vermell: 2, blau: 4, verd: 2 }, { vermell: 5, blau: 3 }, { vermell: 2, blau: 2, groc: 2, verd: 2 }], rnd), same = counts.vermell === counts.blau;
  return Pick(ruleta(spread(counts, rnd)), "Si la fletxa s'atura al vermell, la tómbola regala un ós; si s'atura al blau, una pilota. És igual de fàcil guanyar l'ós que la pilota?", [same ? 'Sí' : 'No', same ? 'No' : 'Sí'],
    'Compta els trossos vermells i els blaus.', same ? `Sí: ${counts.vermell} trossos de cada.` : `No: ${counts.vermell} vermells i ${counts.blau} blaus.`, { order: ['Sí', 'No'] });
};
const PAIRS = [[{ vermella: 3, blava: 1 }, { vermella: 3, blava: 6 }], [{ vermella: 1, blava: 4 }, { vermella: 4, blava: 1 }], [{ vermella: 2, blava: 2 }, { vermella: 4, blava: 4 }],
  [{ vermella: 5 }, { vermella: 5, blava: 1 }], [{ vermella: 2, blava: 3 }, { vermella: 4, blava: 3 }], [{ vermella: 1, blava: 1 }, { vermella: 3, blava: 3 }]];
const tot = b => Object.values(b).reduce((s, n) => s + n, 0);
const bags = rnd => {
  const [p, q] = shuffle(pickOf(PAIRS, rnd).slice(), rnd), fa = (p.vermella || 0) / tot(p), fb = (q.vermella || 0) / tot(q), O = ['La bossa A', 'La bossa B', 'Igual de fàcil'], ans = fa === fb ? O[2] : fa > fb ? O[0] : O[1];
  const say = b => `${b.vermella || 0} vermelles de ${tot(b)}`;
  return Pick({ k: 'urns', A: p, B: q }, "Vols una bola vermella. De quina bossa és més fàcil treure'n una sense mirar?", [ans, ...O.filter(o => o !== ans)],
    'No miris només quantes vermelles hi ha: mira també quantes n\'hi ha d\'altres colors.', ans === O[2] ? `Igual de fàcil: a totes dues, la meitat són vermelles.` : `${ans}: ${say(ans === O[0] ? p : q)}, i a l'altra ${say(ans === O[0] ? q : p)}.`, { order: O });
};

/* ---------- the projects ---------- */
export const PROJECTS = [
  { name: 'La taquilla', sub: 'Entrades i visitants: els números grans', set: 'gate', levels: [
    lv("Paquets d'entrades", 'Una caixa té 1.000 entrades; un paquet, 100; una tira, 10. Fes les entrades amb els botons + i −.', three(packBuild), true),
    lv('Quantes entrades?', 'Compta les caixes, els paquets, les tires i les soltes.', three(packCount)),
    lv('El comptador', 'El punt separa els milers: 12.408 es llegeix «dotze mil quatre-cents vuit».', three(readNum)),
    lv('Què val cada xifra?', "Una xifra val més com més a l'esquerra és.", three(digitValue)),
    lv('Deu, cent, mil més', 'Si entren 100 visitants, canvien les centenes.', three(plusStep)),
    lv('Quin dia més?', 'Per comparar, mira primer els milers i després les centenes.', three(busiest)),
    lv('Arrodoneix als milers', 'Uns 12.000 o uns 13.000? Mira a quin és més a prop.', three(roundTo(1000))),
    lv('Arrodoneix a les centenes', 'Ara a prop de quina centena: uns 12.400 o uns 12.500?', three(roundTo(100))),
    lv('Dissabte i diumenge', 'Suma i resta els visitants dels dos dies.', three(twoDays)),
    lv('Repte de la taquilla', 'Una mica de tot. Endavant!', three(digitValue, plusStep, roundTo(1000)))] },
  { name: "L'alçada mínima", sub: 'Centímetres, metres i quilòmetres', set: 'height', levels: [
    lv('El mesurador', 'Cada atracció té un mesurador. Mira on arriba el cap i toca aquell número.', three(headTap), true),
    lv('Quant fa?', 'Les ratlles llargues van de 10 en 10.', three(readH)),
    lv('Pot pujar?', 'Cal arribar a la ratlla vermella o passar-la.', three(canRide), false, false),
    lv('Quant li falta?', "Compta des de l'alçada fins a la ratlla.", rnd => [gap(false)(rnd), gap(false)(rnd), gap(true)(rnd)]),
    lv('Un metre són 100 cm', '1 m i 25 cm són 100 + 25 = 125 cm.', three(toCm)),
    lv('Els cartells', 'Als cartells hi diu «1,20 m»: 1 metre i 20 centímetres.', three(sign)),
    lv('Qui és més alt?', 'Per comparar, posa-ho tot en centímetres.', three(taller)),
    lv('Metres i quilòmetres', '1 km són 1.000 m.', three(km)),
    lv('Quant pot mesurar?', 'Mil·límetres, centímetres, metres o quilòmetres? Pensa en coses que coneixes.', three(units)),
    lv("Repte de l'alçada", 'Una mica de tot. Endavant!', rnd => [gap(false)(rnd), toCm(rnd), units(rnd)])] },
  { name: 'Els cavallets', sub: 'Patrons de colors i sèries de números', set: 'carousel', levels: [
    lv('Copia els colors', 'Tria un color i toca un cavall per pintar-lo.', three(copyRow), true),
    lv('Continua el patró', 'Un patró és un tros que es repeteix sempre igual.', three(goOn), true),
    lv('Quin ve ara?', 'Troba el tros que es repeteix i continua.', three(nextOne)),
    lv('El tros que es repeteix', 'Quants cavalls té el tros que torna a començar?', three(unitLen)),
    lv('El cavall número 20', 'No cal dibuixar-los tots: compta de tros en tros.', three(nth)),
    lv('Els números dels cavalls', 'Cada cavall porta un número. Quant en suma cada vegada?', three(series([2, 3, 4, 5, 10], false))),
    lv('Endavant i enrere', 'Ara hi ha sèries que baixen, i el forat pot ser al mig.', three(series([-2, -3, -5, -10, 6, 7, 9, 11], true))),
    lv('La regla', 'Quina regla fa la sèrie? Comprova-la amb tots els números.', three(rule)),
    lv('Llums que creixen', "Cada figura té més bombetes. Descobreix quantes se n'afegeixen.", three(grow)),
    lv('Repte dels cavallets', 'Una mica de tot. Endavant!', three(nextOne, nth, rule))] },
  { name: 'La sínia', sub: 'Quarts de volta, graus i angles', set: 'wheel', levels: [
    lv('Fes girar la sínia', 'Amb ↻ gira com les agulles del rellotge; amb ↺, al revés.', three(bring), true),
    lv('Quarts de volta', 'Una volta sencera té quatre quarts.', three(quarter), true),
    lv('On és la cabina?', "Un quart de volta porta la cabina d'un costat al següent.", three(where)),
    lv('Quina cabina baixa?', 'Les cabines van numerades: mira quina arriba a baix.', three(nextDown)),
    lv('Els graus', 'Una volta sencera són 360°; un quart, 90°.', three(degrees)),
    lv('Rectes, aguts i obtusos', "L'angle recte és com la cantonada d'un full.", three(angleType)),
    lv('Els angles dels radis', "De cabina a cabina hi ha 45°: la meitat d'un angle recte.", three(spokes)),
    lv("Cap a l'altre costat", 'Ara cada toc mou una sola cabina.', three(turnBack), false, false),
    lv('Voltes i minuts', 'Si una volta dura 8 minuts, mitja volta dura la meitat.', three(spin)),
    lv('Repte de la sínia', 'Una mica de tot. Endavant!', three(where, nextDown, degrees))] },
  { name: 'La muntanya russa', sub: 'Pujades, baixades i el tren', set: 'coaster', levels: [
    lv('El dibuix de la via', 'Cada punt és un pilar de la via: com més amunt, més alt.', three(highTap), true),
    lv('Quina alçada?', "Els números de l'esquerra són els metres.", three(heightAt)),
    lv('Puja o baixa?', 'Mira si el punt següent és més amunt o més avall.', three(upDown)),
    lv('La gran baixada', 'Per saber quant baixa, resta les dues alçades.', three(drop)),
    lv('Construeix la via', 'Ara la via la fas tu.', three(build), true),
    lv('Quant puja en total?', 'Suma només els trossos que pugen.', three(climb)),
    lv('Del més alt al més baix', 'Busca el punt més alt i el més baix de tota la via.', three(range)),
    lv('El tren', 'Vagons, files i seients: multiplica.', three(train)),
    lv('Quina és més emocionant?', 'Compara dues muntanyes russes.', three(versus)),
    lv('Repte de la muntanya russa', 'Una mica de tot. Endavant!', three(heightAt, drop, climb))] },
  { name: 'El berenar', sub: 'Pizzes, coques i fraccions', set: 'food', levels: [
    lv('Tasta la pizza', 'Toca els trossos que et menges.', three(eat), true),
    lv('Quina fracció?', 'A baix, tots els trossos; a dalt, els que compten.', three(whichFr)),
    lv('La meitat, un terç, un quart', 'Un quart vol dir repartir-ho en 4 parts iguals.', three(part)),
    lv('Pinta la fracció', 'El número de baix diu en quantes parts es reparteix; el de dalt, quantes en pintes.', three(paintFr), false, false),
    lv("Una part d'un grup", 'Un quart de 20 globus: reparteix-los en 4 grups iguals.', three(groupFr)),
    lv('Tres quarts', 'Primer un quart, i després tres vegades.', three(manyFr)),
    lv('Quina és més gran?', 'Mira els trossos: com més parts, més petits.', three(compareFr)),
    lv('Fraccions iguals', 'Mitja pizza és el mateix que 4 trossos de 8.', three(equal)),
    lv("Quarts d'hora", 'Una hora són 60 minuts: la meitat, 30.', three(hourFr)),
    lv('Repte del berenar', 'Una mica de tot. Endavant!', three(groupFr, manyFr, compareFr))] },
  { name: 'Formes i vistes', sub: 'Cubs, piràmides, cilindres i la foto del dron', set: 'shapes', levels: [
    lv('La plaça de les formes', 'Cada edifici de la plaça té una forma. Toca la que et diguin.', three(tapSolid), true),
    lv('Rodola o no?', 'Les formes amb una part corba poden rodolar.', three(rolls), false, false),
    lv('Les cares', 'Les cares són les parts planes de la forma.', three(faces)),
    lv('Vèrtexs i arestes', 'Les arestes són les ratlles; els vèrtexs, les punxes.', three(ev)),
    lv('Endevina la forma', 'Llegeix la pista i pensa quina forma és.', three(guess)),
    lv('El desenvolupament', 'Un desenvolupament és la forma desplegada, com una capsa desmuntada.', three(net)),
    lv('Quants cubs?', 'Cada torre arriba fins a terra: compta també els cubs de sota.', three(countCubes)),
    lv('La foto del dron', 'Des de dalt, només es veu on hi ha torres.', three(viewRound('top'))),
    lv('Vista de davant', 'De davant, cada columna es veu tan alta com la seva torre més alta.', three(viewRound('front'))),
    lv('Repte de les formes', 'Una mica de tot. Endavant!', three(faces, guess, countCubes))] },
  { name: 'Les cues', sub: 'Recomptes, taules i el gràfic de la cua', set: 'queue', levels: [
    lv('Mira la cua', 'Toca les persones que et diguin.', three(markKids), true),
    lv('El recompte', 'Les ratlles es fan de 5 en 5: quatre i una que les travessa.', three(tallyRead)),
    lv('La taula de doble entrada', 'Cada número és on es creuen una fila i una columna.', three(cell)),
    lv('Sumes de la taula', 'Suma una fila o una columna.', three(sums)),
    lv('La preferida', 'La que té més vots és la preferida.', three(mode)),
    lv('El gràfic de la cua', 'Cada punt diu quants minuts de cua hi havia a aquella hora.', three(waitRead)),
    lv('Quan hi ha menys cua?', "El punt més avall és l'hora amb menys cua.", three(waitTap)),
    lv('El número que falta', 'Si saps el total, treu-hi el que ja tens.', three(missing)),
    lv('Quants minuts més?', 'Llegeix dos punts del gràfic i resta.', three(waitDiff)),
    lv('Repte de les cues', 'Una mica de tot. Endavant!', three(cell, missing, waitRead))] },
  { name: 'La tómbola', sub: 'Segur, possible o impossible', set: 'tombola', levels: [
    lv('Treu boles', 'Treu boles sense mirar i fixa-t\'hi: quines surten més?', rnd => [draws(rnd), draws(rnd)], true),
    lv('Segur, possible o impossible', "Si no n'hi ha cap, és impossible.", three(sure)),
    lv('Quin color és més fàcil?', 'El color que hi ha més vegades surt més fàcilment.', three(likely)),
    lv('La ruleta', "Com més trossos d'un color, més fàcil que surti.", three(spinPick)),
    lv('Canvia la bossa', 'Posa o treu boles i canvia el que és fàcil.', three(howMany)),
    lv('Pinta la ruleta', 'Ara la ruleta la pintes tu.', three(paintWheel), false, false),
    lv('El dau', "Un dau té 6 cares, de l'1 al 6.", three(dice)),
    lv('És just?', "Igual de fàcil vol dir tants trossos d'un color com de l'altre.", three(fair)),
    lv('Quina bossa?', 'No miris només quantes vermelles hi ha: mira també les altres.', three(bags)),
    lv('Repte de la tómbola', 'Una mica de tot. Endavant!', three(sure, likely, bags))] }
];
export const CIRCLES = [
  { name: "L'entrada", projects: [0, 1, 2] },
  { name: 'Les grans atraccions', projects: [3, 4, 5] },
  { name: 'La plaça i la fira', projects: [6, 7, 8] }
];
export const LEVELS = PROJECTS.flatMap(p => p.levels);
const cursus = curs({ PROJECTS, CIRCLES, field: 'lv', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina, at the gate of the park before it opens: the tickets, the measure of a girl and the big wheel. Each round says where it is
export const POOL = [
  Num({ k: 'packs', v: [0, 2, 3, 4] }, 'A la taquilla hi ha 2 paquets de 100 entrades, 3 tires de 10 i 4 entrades soltes. Quantes entrades hi ha?', 234,
    'Els paquets són les centenes, les tires les desenes i les soltes les unitats.', '234 entrades!', { set: 'gate', sp: 'mare' }),
  Tap({ k: 'ruler', h: 130, sp: 'nena', who: 'Laia', tap: true }, 'Toca el número on arriba el cap de la Laia.', '130', 'Segueix la ratlla del cap fins al regle.', 'La Laia fa 130 cm: pot pujar a la muntanya russa!',
    { set: 'height', sp: 'nena', kid: { sp: 'nena', h: 130 } }),
  Turn({ k: 'wheel', r: 0 }, 'Porta la cabina 3 a baix, perquè hi pugi en Pau.', 3, 'Toca ↻ fins que la cabina 3 arribi a baix de tot.', 'Cabina 3! En Pau puja a la sínia.', { set: 'wheel', free: true, sp: 'nen' })
];

// What is saved is facts only: { so, lv[90], piscina, exams[3], fulls, visitants }. visitants counts every visitor helped right in a level (it
// only grows). Marks, XP, level and badges are worked out, never stored. A complete progress inside its limits from any value at all
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const lv = slots(o.lv, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, lv, piscina: o.piscina === true || lv.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), visitants: Math.max(0, whole(o.visitants)) };
}
// n more visitors helped: a new progress
export const servedIn = (p, n) => ({ ...cursus.copy(p), visitants: p.visitants + Math.max(0, whole(n)) });
export const BADGES = [
  { name: 'Parc obert', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Cent visitants', what: 'Ajuda bé cent visitants.' },
  { name: 'Deu fulls', what: 'Caça bé les errades de deu fulls.' },
  { name: 'Parc de tres estrelles', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.visitants >= 100, p.fulls >= 10, p.exams.every(e => e === true)];
// the stars over the gate of the park: one for every exam passed
export const starsOf = p => p.exams.filter(Boolean).length;

/* ---------- what a thing of a card is, said when it is touched ---------- */
export function tapSay(card, k) {
  if (card.k === 'ruler') return `Això és ${k} cm.`;
  if (card.k === 'profile') { const i = +k.slice(1); return `El punt ${POSTS[i]} és a ${card.ys[i]} m.`; }
  if (card.k === 'solids') return SOLIDS[k] ? `Això és ${SOLIDS[k].name}.` : '';
  if (card.k === 'views') return card.opts[+k.slice(1)]?.what || '';
  if (card.k === 'waits') { const i = +k.slice(1); return `A les ${HOURS[i]} hi havia ${card.m[i]} minuts de cua.`; }
  return '';
}

/* ---------- the exam and «Caça l'errada» ---------- */
// Six visitors of the projects of circle c, at least one of each project, in a random order. Each is a round of a level that is not a
// warm-up, answered with the keypad, the options or a tap: { p, idx, title, round }. A circle that does not exist gives the first
const ASK = ['num', 'pick', 'tap'];
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const one = p => {
    const ok = PROJECTS[p].levels.flatMap((L, i) => L.ask ? [i] : []);
    let j = at(ok.length, rnd);
    for (let n = 0; n < ok.length && used.has(p * 10 + ok[j]); n++) j = (j + 1) % ok.length;
    used.add(p * 10 + ok[j]);
    const L = PROJECTS[p].levels[ok[j]], rounds = L.make(rnd).filter(r => ASK.includes(r.type));
    return { p, idx: ok[j], title: L.title, round: rounds[at(rounds.length, rnd)] };
  };
  const out = ps.map(one);
  while (out.length < 6) out.push(one(ps[at(ps.length, rnd)]));
  return shuffle(out, rnd);
}

// A sheet: three lines written on the board of the park, each { kind, card, says, real, opts }: says is the line written, real the true one
// (the line is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the ones children make: a figure
// read one place off, the centimetres of 1 m forgotten, the piece of a pattern counted wrong, a turn the other way, a half turn of 90°, the
// two heights added instead of subtracted, the fraction of a group divided by the wrong number, the vertices counted for the faces, the
// other day of a table read, and a colour that is not in the bag called possible
const CLAIM = {
  value(bad, rnd) {
    const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd).slice(0, 5), n = +ds.join(''), i = int(rnd, 1, 3), d = ds[i], v = d * 10 ** (4 - i), say = x => `${cap(el(d))} de ${fmt(n)} val ${fmt(x)}.`;
    return { card: { k: 'counter', n, hl: i }, real: say(v), says: say(bad ? v / 10 : v), opts: shuffle([v, v / 10, v * 10].map(say), rnd) };
  },
  cm(bad, rnd) {
    const c = int(rnd, 1, 9), say = x => `1 m i ${c} cm són ${x} cm.`;
    return { card: tape(100 + c), real: say(100 + c), says: say(bad ? 10 + c : 100 + c), opts: shuffle([100 + c, 10 + c, 100 + 10 * c].map(say), rnd) };
  },
  pattern(bad, rnd) {
    const u = unitOf(rnd, ['AB', 'ABC']), L = u.length, N = int(rnd, 7, 14), real = u[(N - 1) % L], other = u.find(c => c !== real), third = Object.keys(COLORS).find(c => !u.includes(c));
    const say = c => `Si el patró continua, el cavall número ${N} serà ${c}.`;
    return { card: { k: 'horses', row: rep(u, 2 * L), nums: true }, real: say(real), says: say(bad ? other : real), opts: shuffle([real, other, third].map(say), rnd) };
  },
  turn(bad, rnd) {
    const k = pickOf([2, 4, 6], rnd), p1 = mod8(k), wrong = k === 4 ? 2 : mod8(-k), third = [2, 4, 6].find(p => p !== p1 && p !== wrong), say = p => `Si la cabina 1 és a baix i la sínia fa ${TURNS[k]} ${CW}, la cabina 1 queda ${POS[p]}.`;
    return { card: wheel(0, { lit: 1, arrow: 'cw' }), real: say(p1), says: say(bad ? wrong : p1), opts: shuffle([p1, wrong, third].map(say), rnd) };
  },
  degrees(bad, rnd) {
    const k = pickOf([2, 4, 6, 8], rnd), w = [45 * k, k === 2 ? 45 : 45 * k / 2, 45 * k + 90], say = d => `${cap(TURNS[k])} són ${d}°.`;
    return { card: wheel(0, { arrow: 'cw', sweep: k }), real: say(w[0]), says: say(bad ? w[1] : w[0]), opts: shuffle(w.map(say), rnd) };
  },
  drop(bad, rnd) {
    let ys = track(rnd), ds = downs(ys).filter(i => ys[i + 1] > 0);
    for (let t = 0; t < 50 && !ds.length; t++) { ys = track(rnd); ds = downs(ys).filter(i => ys[i + 1] > 0); }
    if (!ds.length) { ys = [5, 40, 15, 30, 10, 20, 0]; ds = [1]; }
    const i = pickOf(ds, rnd), d = ys[i] - ys[i + 1], s = ys[i] + ys[i + 1], say = x => `Del punt ${POSTS[i]} al punt ${POSTS[i + 1]}, el tren baixa ${x} m.`;
    return { card: prof(ys, { hl: [i, i + 1] }), real: say(d), says: say(bad ? s : d), opts: shuffle([d, s, ys[i]].map(say), rnd) };
  },
  fraction(bad, rnd) {
    const b = pickOf([3, 4, 5], rnd), m = pickOf([2, 3, 4, 5, 6].filter(x => x !== b), rnd), n = b * m, say = x => `${fr(1, b)} de ${n} globus són ${x} globus.`;
    return { card: { k: 'group', n, rows: b, item: 'globus' }, real: say(m), says: say(bad ? b : m), opts: shuffle([m, b, n - m].map(say), rnd) };
  },
  faces(bad, rnd) {
    const s = pickOf(POLY, rnd), S = SOLIDS[s], w = [S.f, S.v !== S.f ? S.v : S.f - 1, S.e], say = x => `${cap(S.name)} té ${x} cares.`;
    return { card: { k: 'solid', s }, real: say(w[0]), says: say(bad ? w[1] : w[0]), opts: shuffle(w.map(say), rnd) };
  },
  table(bad, rnd) {
    let T = table2(rnd), i = at(3, rnd), j = at(2, rnd);
    for (let t = 0; t < 50 && new Set([T.cells[i][j], T.cells[i][1 - j], T.cells[(i + 1) % 3][j]]).size < 3; t++) T = table2(rnd);
    const x = T.cells[i][j], y = T.cells[i][1 - j], z = T.cells[(i + 1) % 3][j], say = v => `El ${day(j)} van anar ${v} persones ${T.rs[i].at}.`;
    return { card: tcard(T), real: say(x), says: say(bad ? y : x), opts: shuffle([x, y, z].map(say), rnd) };
  },
  chance(bad, rnd) {
    const b = pickOf(BAGS.filter(x => Object.keys(x).length === 2), rnd), none = Object.keys(BALLS).find(c => !(c in b)), say = w => `És ${w} treure una bola ${none} d'aquesta bossa.`;
    return { card: urn(b), real: say('impossible'), says: say(bad ? 'possible' : 'impossible'), opts: shuffle(['impossible', 'possible', 'segur'].map(say), rnd) };
  }
};
export const CLAIMS = Object.keys(CLAIM);
// Three lines of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(CLAIMS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
