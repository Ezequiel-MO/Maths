import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the market of the pond, with no page in it. The frog has a stall: the child pays with coins and notes,
// gives the change, adds up the receipt, weighs on the scales, multiplies and shares out, guesses totals by rounding and saves in a
// piggy bank. Money is kept in cents and weight in grams, whole numbers always, and every answer is worked out here from the numbers
// of its question, so a picture and its answer never disagree. It must keep importing from Node.

/* ---------- money, weight and words ---------- */
// 345 → «3,45 €»; 300 → «3 €»
export const eur = c => { const e = Math.floor(c / 100), r = c % 100; return `${e}${r ? ',' + String(r).padStart(2, '0') : ''} €`; };
// a coin or a note in a sum: 2 €, 50 c
export const short = v => v >= 100 ? eur(v) : `${v} c`;
export const thousands = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// 1500 → «1.500 g», 2000 → «2 kg»
export const gr = g => g >= 1000 && g % 1000 === 0 ? `${g / 1000} kg` : `${thousands(g)} g`;
export const isBill = v => v >= 500;
// what a coin or a note is worth, in words: «20 cèntims», «1 euro», «5 euros»
export const valName = v => v >= 100 ? `${v / 100} euro${v > 100 ? 's' : ''}` : `${v} cèntim${v > 1 ? 's' : ''}`;
// «la moneda de 20 cèntims», «la moneda d'1 euro», «el bitllet de 10 euros»
export const coinName = v => `${isBill(v) ? 'el bitllet' : 'la moneda'} ${/^1 /.test(valName(v)) ? "d'" : 'de '}${valName(v)}`;
const sum = a => a.reduce((s, x) => s + x, 0);
// «de» before an amount: «d'1,45 €», «d'11 €», «de 2 €»
export const de = s => /^1{1,2}(?![\d])/.test(s) ? `d'${s}` : `de ${s}`;
export const COINS = [1, 2, 5, 10, 20, 50, 100, 200];
export const BILLS = [500, 1000, 2000, 5000];
export const MONEY = [...COINS, ...BILLS];
export const WEIGHTS = [1000, 500, 200, 100, 50];
// the fewest coins and notes that make c, out of the values in den (any number of each). The euro is a system where taking the biggest
// value that fits is always the best
export function fewest(c, den = MONEY) {
  const out = [], vs = den.slice().sort((a, b) => b - a);
  for (const v of vs) while (c >= v) { out.push(v); c -= v; }
  return c ? null : out;
}
// whether c can be made out of a purse with a limited number of each value ([[value, how many], ...])
export function reachable(c, purse) {
  let can = new Set([0]);
  for (const [v, n] of purse) for (let k = 0; k < (Number.isFinite(n) ? n : Math.ceil(c / v)); k++) can = new Set([...can, ...[...can].map(x => x + v).filter(x => x <= c)]);
  return can.has(c);
}

/* ---------- the things of the market ---------- */
// e the picture, n the name on a tag, the the name in a sentence
const thing = (e, n, the) => ({ e, n, the });
export const F = {
  poma: thing('🍎', 'Poma', 'una poma'), pera: thing('🍐', 'Pera', 'una pera'), platan: thing('🍌', 'Plàtan', 'un plàtan'), taronja: thing('🍊', 'Taronja', 'una taronja'),
  sindria: thing('🍉', 'Síndria', 'una síndria'), maduixes: thing('🍓', 'Maduixes', 'una safata de maduixes'), raim: thing('🍇', 'Raïm', 'un raïm'),
  pinya: thing('🍍', 'Pinya', 'una pinya'), cireres: thing('🍒', 'Cireres', 'les cireres'), llimona: thing('🍋', 'Llimona', 'una llimona'), presseg: thing('🍑', 'Préssec', 'un préssec'),
  pa: thing('🥖', 'Pa', 'una barra de pa'), croissant: thing('🥐', 'Croissant', 'un croissant'), llet: thing('🥛', 'Llet', 'un cartró de llet'),
  formatge: thing('🧀', 'Formatge', 'un tros de formatge'), ous: thing('🥚', 'Ous', 'els ous'), pastanaga: thing('🥕', 'Pastanagues', 'les pastanagues'),
  tomaquet: thing('🍅', 'Tomàquets', 'els tomàquets'), patates: thing('🥔', 'Patates', 'les patates'), cromos: thing('🃏', 'Cromos', 'un sobre de cromos'),
  pilota: thing('⚽', 'Pilota', 'una pilota'), samarreta: thing('👕', 'Samarreta', 'una samarreta'), gelat: thing('🍦', 'Gelat', 'un gelat'),
  galetes: thing('🍪', 'Galetes', 'un paquet de galetes'), xocolata: thing('🍫', 'Xocolata', 'una rajola de xocolata'), suc: thing('🧃', 'Suc', 'un suc'),
  llibre: thing('📘', 'Llibre', 'un llibre'), patins: thing('🛼', 'Patins', 'uns patins'), joc: thing('🎮', 'Joc', 'un videojoc'), caramel: thing('🍬', 'Caramel', 'un caramel'),
  iogurt: thing('🥣', 'Iogurt', 'un iogurt'), pernil: thing('🥓', 'Pernil', 'el pernil'), bici: thing('🚲', 'Bicicleta', 'una bicicleta'), llibreta: thing('📒', 'Llibreta', 'una llibreta'),
  pastis: thing('🎂', 'Pastís', 'un pastís'), peix: thing('🐟', 'Peix', 'el peix'), mobil: thing('📱', 'Mòbil', 'un mòbil'),
  got: thing('🥤', 'Llimonada', 'un got de llimonada'), mel: thing('🍯', 'Mel', 'un pot de mel'), gel: thing('🧊', 'Gel', 'una bossa de gel'),
  entrada: thing('🎟️', 'Cinema', "una entrada de cinema"), bus: thing('🚌', 'Autobús', "el bitllet de l'autobús")
};
// the thing does it, or they do: «una pilota costa», «uns patins costen»
const pl = k => /^(uns|unes|les|els) /.test(F[k].the);
const verb = (k, one, many) => pl(k) ? many : one;
// what is sold by the kilo or in offers, with its article in the plural
const KG = { poma: 'les pomes', taronja: 'les taronges', platan: 'els plàtans', cireres: 'les cireres', formatge: 'el formatge', maduixes: 'les maduixes', pernil: 'el pernil',
  patates: 'les patates', tomaquet: 'els tomàquets', iogurt: 'els iogurts', suc: 'els sucs', gelat: 'els gelats' };
// the people who come to the stall when the child is the shopkeeper: the face of the page without WebGL, the name in a sentence and the
// kind of person the market in 3D draws (the guests of the hotel: walkers, cyclists, tourists and grannies)
const WHO = [['🧑', "L'excursionista", 'excursionista'], ['👩', 'La ciclista', 'ciclista'], ['🧔', 'El turista', 'turista'], ['👵', "L'àvia", 'avi'],
  ['👧', 'La noia de la motxilla', 'excursionista'], ['👨', 'El ciclista', 'ciclista'], ['👩‍🦰', 'La senyora del barret', 'turista']];
// an item with its price (p, in cents) and what the price is for (u: «el kg», «cada un»...)
const it = (k, p, u = '') => ({ ...F[k], p, u });
const cap = s => s[0].toUpperCase() + s.slice(1);

/* ---------- the scenes: what is drawn over a question ---------- */
// coins: coins and notes on the counter (big: a single one, large) · stall: the stall with its things and price tags · receipt: a
// receipt (lines [{ e, n, q, p, sub }], total, paid) · purses: two purses, A and B · offers: two offers, A and B · dial: the scales of
// the stall with a needle · crate: a crate of fruit in rows and columns · piggy: the piggy bank of the frog · trade: the board of the
// barter of long ago (rules [[thing, how many, thing], ...]: one of the first is worth so many of the second) · ledger: the book of the
// bank or the accounts of the lemonade (rows [{ t, e, v }], v in cents, + what comes in and − what goes out; start, title, end the name
// of the last line, hide: the last amount is a «?», run: the balance after every row)
const coins = (cs, o = {}) => ({ s: 'coins', coins: cs, ...o });
const trade = (rules, o = {}) => ({ s: 'trade', rules, ...o });
const ledger = (rows, o = {}) => ({ s: 'ledger', rows: rows.map(([t, e, v]) => ({ t, e, v })), ...o });
const stall = (items, o = {}) => ({ s: 'stall', items, ...o });
const line = (k, p, q = 1, o = {}) => ({ e: F[k].e, n: F[k].n, p, q, ...o });
const receipt = (lines, o = {}) => ({ s: 'receipt', lines, ...o });

/* ---------- the questions ---------- */
// A question: text, and how it is answered: 'num' (a whole number typed, unit after it), 'eur' (an amount of money typed with a comma,
// ans in cents), 'pick' (one of opts; ans the right one), 'tap' (a thing of the scene: ans its keys), 'order' (every thing of the scene
// in order: ans the keys in that order), 'pay' (coins and notes put on the counter: target in cents, purse [[value, how many]], min the
// fewest coins that make it when the fewest are asked for, change when the child gives the change), 'weigh' (weights on the scales:
// target in grams). hint is what the frog says when asked, and say what it says when the answer is right.
const Q = (type, text, ans, hint, say, o = {}) => ({ type, text, ans, hint, say, ...o });
const R = (scene, q) => ({ scene, q });
const lv = (title, say, rounds) => ({ title, say, rounds });
const N = (text, n, hint, say, scene = null, unit = '') => R(scene, Q('num', text, n, hint, say, { unit }));
const E = (text, c, hint, say, scene = null) => R(scene, Q('eur', text, c, hint, say));
const Pk = (text, opts, hint, say, scene = null) => R(scene, Q('pick', text, opts[0], hint, say, { opts }));
const Tp = (text, keys, hint, say, scene) => R(scene, Q('tap', text, keys.map(String), hint, say));
// cents or euros: an amount under 1 € is asked in cents, as a whole number
// {?} is «Quants cèntims» or «Quants diners», with a small q inside a sentence
const ask = (text, w) => text.replace('{?}', (m, at) => /^$|[.?!]$/.test(text.slice(0, at).trimEnd()) ? `Quants ${w}` : `quants ${w}`);
const money = (text, c, hint, say, scene) => c < 100 ? N(ask(text, 'cèntims'), c, hint, say, scene, 'cèntims') : E(ask(text, 'diners'), c, hint, say, scene);

/* ---------- coins and notes ---------- */
const DIST = { 1: [2, 10], 2: [20, 1], 5: [50, 2], 10: [1, 100], 20: [2, 200], 50: [5, 500], 100: [10, 200], 200: [20, 100], 500: [50, 1000], 1000: [100, 500], 2000: [200, 5000], 5000: [500, 2000] };
// what this coin is worth: the same digits as cents or euros, and the value next to it
function value(v) {
  const [a, b] = DIST[v], other = x => x >= 100 ? `${x / 100} euro${x > 100 ? 's' : ''}` : `${x} cèntim${x > 1 ? 's' : ''}`;
  const twin = v >= 100 ? `${v / 100} cèntim${v > 100 ? 's' : ''}` : `${v} euro${v > 1 ? 's' : ''}`;
  return Pk(`Quant val ${isBill(v) ? 'aquest bitllet' : 'aquesta moneda'}?`, [valName(v), twin, other(b === v ? a : b)].filter((x, i, l) => l.indexOf(x) === i),
    isBill(v) ? 'Els bitllets sempre són d\'euros: mira el número gran.' : 'Mira el número i la paraula de sota: «cent» vol dir cèntims, i «euro», euros.',
    `${cap(coinName(v))} val ${valName(v)}.`, coins([v], { big: true }));
}
const tapMost = cs => { const m = Math.max(...cs); return Tp('Toca el que val més.', [cs.indexOf(m)], 'Les monedes de cèntims valen menys que les d\'euro, i els bitllets valen més que totes les monedes.', `${cap(coinName(m))}: ${valName(m)}.`, coins(cs)); };
// how much money there is on the counter
const count = cs => { const t = sum(cs);
  return money('{?} hi ha al taulell?', t, 'Comença pel que val més i ves sumant: primer els bitllets, després les monedes grans.', `${cs.map(short).join(' + ')} = ${t < 100 ? t + ' cèntims' : eur(t)}.`, coins(cs)); };
const toCents = c => N(`Quants cèntims són ${eur(c)}?`, c, `Cada euro són 100 cèntims.${c % 100 ? ` ${eur(c - c % 100)} són ${c - c % 100} cèntims, i encara n'hi ha ${c % 100} més.` : ''}`, `${eur(c)} = ${c} cèntims.`, coins(fewest(c, COINS)), 'cèntims');
const toEur = c => E(`Escriu ${c} cèntims en euros.`, c, 'Cada 100 cèntims fan 1 euro. Els euros van abans de la coma i els cèntims, després.', `${c} cèntims = ${eur(c)}.`);
// put them all in order, from the one worth most
const order = cs => R(coins(cs), Q('order', `Toca-${cs.some(isBill) ? 'ho tot, del que val més al que' : 'les totes, de la que val més a la que'} val menys.`,
  cs.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map(x => String(x[1])), 'Busca primer el que val més. Els bitllets valen més que les monedes, i un euro més que qualsevol moneda de cèntims.',
  `Ordenats: ${cs.slice().sort((a, b) => b - a).map(short).join(' › ')}.`));
// which of three ways of coins makes c: the first is right, the other two must not be
const ways = (c, sets) => { const lab = s => s.map(short).join(' + ');
  return Pk(`Quina d'aquestes maneres fa ${eur(c)}?`, sets.map(lab), 'Suma les monedes de cada manera, de la més gran a la més petita.', `${lab(sets[0])} = ${eur(c)}.`, coins(fewest(c, COINS)), { check: sets.map(sum) }); };
// two purses: which has more, and by how much
function purses(a, b) {
  const A = sum(a), B = sum(b), big = A > B ? 'a' : 'b', d = Math.abs(A - B), sc = { s: 'purses', a, b };
  return [Tp('Quin moneder té més diners?', [big], 'Compta els diners de cada moneder i compara.', `El ${big.toUpperCase()}: ${eur(Math.max(A, B))}, i l'altre ${eur(Math.min(A, B))}.`, sc),
    money(`{?} més té el moneder ${big.toUpperCase()}?`, d, 'Resta: el moneder gran menys el petit.', `${eur(Math.max(A, B))} − ${eur(Math.min(A, B))} = ${d < 100 ? d + ' cèntims' : eur(d)}.`, sc)];
}

/* ---------- paying and the change ---------- */
const PC = [50, 20, 10, 5, 2, 1].map(v => [v, Infinity]);
const PE = [200, 100, 50, 20, 10, 5].map(v => [v, Infinity]);
const PB = [2000, 1000, 500, 200, 100, 50, 20, 10, 5].map(v => [v, Infinity]);
const PURSES = { PC, PE, PB };
// pay c with the purse: items are what is bought (their tags go over the counter); min asks for the fewest coins and notes
// o.text and o.hint say it in other words; o.bank: the money goes into the account of the bank, not over the counter of the stall
function pay(c, purse, o = {}) {
  const den = purse.filter(([, n]) => n > 0).map(([v]) => v), best = fewest(c, den), items = o.items || [];
  const text = o.text || (items.length ? `Paga ${items.map(x => x.the).join(' i ')}${o.min ? ', amb les menys monedes possibles' : ''}.` : `Paga ${eur(c)}${o.min ? ' amb les menys monedes possibles' : ''}.`);
  const hint = o.hint ? o.hint : o.min ? `Comença pel bitllet o la moneda més gran que no passi de ${eur(c)}, i continua amb el que falta.${best ? ` Es pot fer amb ${best.length}.` : ''}`
    : purse.some(([, n]) => Number.isFinite(n)) ? 'Només pots fer servir el que hi ha al moneder. Prova primer amb les monedes grans i mira què et falta.'
      : items.length > 1 ? `Primer suma els preus: ${items.map(x => eur(x.p)).join(' + ')} = ${eur(c)}. Després paga.` : `Posa primer les monedes grans, i quan t'hi acostis, les petites. Has d'arribar a ${eur(c)}.`;
  return R(null, Q('pay', text, c, hint, `${items.length > 1 ? `${items.map(x => eur(x.p)).join(' + ')} = ${eur(c)}. ` : ''}${(best || []).map(short).join(' + ')} = ${eur(c)}.`,
    { purse, target: c, min: o.min && best ? best.length : 0, items, ...(o.bank ? { bank: true } : {}) }));
}
// n things k at each cents each, as one line to pay: «4 llimones», 0,80 €
const bunch = (k, n, each, name) => ({ ...F[k], n: name, the: name, p: n * each, u: `${n} × ${eur(each)}` });
const item = (k, p, u) => it(k, p, u);
// the limited purse: { value: how many }
const lim = (c, m, o = {}) => pay(c, Object.entries(m).map(([v, n]) => [+v, n]).sort((a, b) => b[0] - a[0]), o);
// the next whole euro after p, the first step of counting up
const up = p => Math.ceil(p / 100) * 100;
const countUp = (p, paid) => up(p) === p || up(p) >= paid ? `Resta: ${eur(paid)} − ${eur(p)}.` : `Compta endavant: de ${eur(p)} a ${eur(up(p))} hi ha ${short(up(p) - p)}, i de ${eur(up(p))} a ${eur(paid)}, ${short(paid - up(p))}. Suma-ho.`;
// the change of p paid with paid: typed, or given with the coins of the till (tokens) by the child, the shopkeeper. o.the: what is
// bought in other words («2 gots de llimonada»), with the till only
function change(p, paid, k, o = {}) {
  const T = o.the ? { ...F[k], the: o.the } : F[k], [e, who, kind] = WHO[o.w || 0], c = paid - p;
  if (!o.till) return money(`${cap(T.the)} ${verb(k, 'costa', 'costen')} ${eur(p)}. Pagues amb ${isBill(paid) ? 'un bitllet de ' : ''}${valName(paid)}. {?} et tornen?`, c, countUp(p, paid),
    `${eur(paid)} − ${eur(p)} = ${c < 100 ? c + ' cèntims' : eur(c)}.`, stall([it(k, p)]));
  const best = fewest(c, o.till.map(([v]) => v));
  return R(null, Q('pay', `${who} compra ${T.the} ${de(eur(p))} i et paga amb ${isBill(paid) ? 'un bitllet de ' : ''}${valName(paid)}. Torna-li el canvi${o.min ? ' amb les menys monedes possibles' : ''}.`, c,
    countUp(p, paid) + (o.min && best ? ` Es pot tornar amb ${best.length} peces.` : ''), `${eur(paid)} − ${eur(p)} = ${eur(c)}: ${(best || []).map(short).join(' + ')}.`,
    { purse: o.till, target: c, min: o.min && best ? best.length : 0, change: true, who: [e, who, kind], items: [{ ...it(k, p), the: T.the }], paid }));
}
// a receipt and the change of what it says, paid with paid
function change2(lines, paid) {
  const t = sum(lines.map(l => l.p * l.q)), c = paid - t;
  return money(`Pagues amb ${isBill(paid) ? 'un bitllet de ' : ''}${valName(paid)}. {?} et tornen?`, c, `Primer suma el tiquet. Després, ${eur(paid)} menys el total.`,
    `El total és ${eur(t)}, i ${eur(paid)} − ${eur(t)} = ${c < 100 ? c + ' cèntims' : eur(c)}.`, receipt(lines, { paid }));
}
// what it cost, from what was paid and the change
const cost = (paid, back, k) => E(`Has comprat ${F[k].the}, has pagat amb ${eur(paid)} i t'han tornat ${eur(back)}. Quant costava?`, paid - back,
  `El preu més el canvi fan el que has pagat. Resta: ${eur(paid)} − ${eur(back)}.`, `${eur(paid)} − ${eur(back)} = ${eur(paid - back)}.`, stall([it(k, paid - back)], { hide: true }));
// the smallest note that pays p
const bill = (p, k) => { const b = BILLS.find(v => v >= p), opts = [b, ...BILLS.filter(v => v !== b)].slice(0, 3).map(v => `${v / 100} €`);
  return Pk(`${cap(F[k].the)} ${verb(k, 'costa', 'costen')} ${eur(p)}. Quin és el bitllet més petit amb què ${verb(k, 'el', 'els')} pots pagar?`, opts, `Busca el bitllet més petit que valgui més de ${eur(p)}.`,
    `${b / 100} € és el bitllet més petit que hi arriba.`, stall([it(k, p)])); };

/* ---------- the receipt ---------- */
// the lines of a receipt: [thing, price, how many]
const L = (k, p, q = 1) => line(k, p, q);
const total = lines => sum(lines.map(l => l.p * l.q));
const sumSay = lines => `${lines.map(l => l.q > 1 ? `${l.q} × ${eur(l.p)}` : eur(l.p)).join(' + ')} = ${eur(total(lines))}.`;
function rec(lines, hint) {
  const nines = lines.filter(l => l.p % 100 >= 95);
  return E(lines.length > 3 ? 'Quant costa tota la compra?' : 'Quant costa tot?', total(lines),
    hint || (nines.length ? `Truc: ${nines.map(l => `${eur(l.p)} és ${eur(up(l.p))} menys ${up(l.p) - l.p} c`).join('; ')}. Suma els euros rodons i després treu els cèntims.`
      : lines.some(l => l.q > 1) ? 'Primer multiplica les línies que tenen «×», i després suma-ho tot.' : 'Suma els euros amb els euros i els cèntims amb els cèntims. Si els cèntims passen de 100, fan un euro més.'),
    sumSay(lines), receipt(lines));
}
// the receipt with a price rubbed out, and the total
const miss = (lines, i) => E(`El total és ${eur(total(lines))}, però s'ha esborrat un preu: el de la línia ${i + 1}. Quin és?`, lines[i].p,
  `Suma els preus que veus i resta-ho del total.`, `${eur(total(lines))} − ${eur(total(lines) - lines[i].p)} = ${eur(lines[i].p)}.`,
  receipt(lines.map((l, j) => j === i ? { ...l, gone: true } : l), { total: total(lines) }));
// one line of the receipt has a wrong subtotal (bad: [line, the wrong subtotal]): tap it
const wrongLine = (lines, [i, bad]) => Tp("Quina línia del tiquet està malament? Toca-la.", [i], 'Comprova cada línia: el nombre de coses per el preu de cada una.',
  `La línia ${i + 1}: ${lines[i].q} × ${eur(lines[i].p)} = ${eur(lines[i].q * lines[i].p)}, no ${eur(bad)}.`,
  receipt(lines.map((l, j) => ({ ...l, sub: j === i ? bad : l.q * l.p })), { subs: true, tap: true }));

/* ---------- weight ---------- */
const dial = (g, k, max = 2000) => N(`Quants grams marca la balança?`, g,
  `Mira on s'atura l'agulla. Cada ratlla petita són 100 g, i els números grans van de ${max > 2000 ? 1000 : 500} en ${max > 2000 ? 1000 : 500}.`, `L'agulla marca ${gr(g)}.`, { s: 'dial', g, max, e: F[k].e }, 'g');
const weigh = (g, k) => R(null, Q('weigh', `${cap(F[k].the)} ${verb(k, 'pesa', 'pesen')} ${gr(g)}. Posa peses a l'altre plat fins que la balança quedi recta.`, g,
  `Comença per la pesa més gran que no passi de ${gr(g)}, i ves afegint fins a arribar-hi.`, `${fewest(g, WEIGHTS).map(gr).join(' + ')} = ${gr(g)}. Equilibrada!`, { target: g, weights: WEIGHTS, e: F[k].e }));
// the price of g grams when the kilo costs perKg
function kilo(g, perKg, k) {
  const c = perKg * g / 1000, T = F[k];
  const how = g % 1000 === 0 ? `${g / 1000} kg són ${g / 1000} vegades el preu d'un quilo: ${g / 1000} × ${eur(perKg)}.` : g === 500 ? `Mig quilo és la meitat: ${eur(perKg)} : 2.`
    : g === 250 ? `Un quart de quilo és la quarta part: ${eur(perKg)} : 4.` : `1 kg són 1.000 g. Mira quina part de 1.000 són ${thousands(g)} g.`;
  return E(`${cap(KG[k])} ${/^(les|els) /.test(KG[k]) ? 'són' : 'és'} a ${eur(perKg)} el quilo. Quant costen ${gr(g)}?`, c, how, `${gr(g)} → ${eur(c)}.`, stall([it(k, perKg, 'el kg')]));
}
// how many kilos the money buys
const kgs = (money, perKg, k) => N(`Tens ${eur(money)}, i ${KG[k]} costen ${eur(perKg)} el quilo. Quants quilos en pots comprar?`, money / perKg,
  `Mira quantes vegades cap ${eur(perKg)} dins de ${eur(money)}.`, `${eur(money)} : ${eur(perKg)} = ${money / perKg} kg.`, stall([it(k, perKg, 'el kg')]), 'kg');
// the price of g grams when 100 g cost per100
const per100 = (g, per100, k) => E(`${F[k].n}: ${eur(per100)} cada 100 g. Quant costen ${gr(g)}?`, per100 * g / 100, `${gr(g)} són ${g / 100} vegades 100 g.`,
  `${g / 100} × ${eur(per100)} = ${eur(per100 * g / 100)}.`, stall([it(k, per100, 'cada 100 g')]));

/* ---------- multiplying ---------- */
const times = (n, p, k, what) => E(`${what || `${cap(F[k].the)} costa ${eur(p)}`}. Quant ${n === 1 ? 'costa' : 'costen'} ${n}?`, n * p,
  p % 100 >= 95 ? `${eur(p)} és ${eur(up(p))} menys ${up(p) - p} c. Fes ${n} × ${eur(up(p))} i treu ${n} vegades ${up(p) - p} c.`
    : n === 4 || n === 8 ? `Fes el doble${n === 8 ? ' del doble del doble' : ' del doble'}: ${eur(p)} → ${eur(2 * p)} → ${eur(4 * p)}${n === 8 ? ` → ${eur(8 * p)}` : ''}.`
      : n % 10 === 0 ? `Multiplicar per ${n} fa el preu ${n} vegades més gran: els cèntims passen a ser ${n === 10 ? 'desenes de cèntims' : 'euros'}.`
        : `Fes ${n} vegades ${eur(p)}: primer els euros, després els cèntims.`,
  `${n} × ${eur(p)} = ${eur(n * p)}.`, stall([it(k, p, 'cada un')]));
const crate = (rows, cols, k) => ({ s: 'crate', rows, cols, e: F[k].e });
// 3×2: of every 3 the child takes, 2 are paid
const deal = (n, p, k) => E(`${cap(KG[k])}, a ${eur(p)} cada un, amb l'oferta 3×2. Quant pagues per ${n}?`, (n / 3) * 2 * p,
  `De cada 3, en pagues 2. ${n} són ${n / 3} grups de 3: en pagues ${(n / 3) * 2}.`, `En pagues ${(n / 3) * 2}: ${(n / 3) * 2} × ${eur(p)} = ${eur((n / 3) * 2 * p)}.`,
  stall([it(k, p, '3×2')], { deal: true }));

/* ---------- estimating ---------- */
const euros = c => Math.round(c / 100);
const near = c => { const r = euros(c), other = c / 100 < r ? r - 1 : r + 1;
  return Pk(`A quin euro sencer s'acosta més ${eur(c)}?`, [`${r} €`, `${other} €`, `${r * 10} €`], `Mira els cèntims: si són 50 o més, cap amunt; si són menys de 50, cap avall.`,
    `${eur(c)} és gairebé ${r} €.`); };
function est(lines) {
  const r = sum(lines.map(l => euros(l.p) * l.q)), t = total(lines);
  return Pk('Més o menys, quant costa tot?', [`Uns ${r} €`, `Uns ${r > 4 ? r - 3 : r + 6} €`, `Uns ${r + 3} €`], 'Arrodoneix cada preu a l\'euro més proper i suma els números rodons.',
    `${lines.map(l => euros(l.p)).join(' + ')} = ${r}. El total exacte és ${eur(t)}${t === r * 100 ? ': exactament el mateix!' : ": s'hi acosta molt!"}`, receipt(lines, { total: -1 }));
}
const enough = (have, lines) => { const t = total(lines), ok = t <= have;
  return Pk(`Tens ${eur(have)}. En tens prou per pagar-ho tot?`, ok ? ['Sí, en tinc prou', 'No, no en tinc prou'] : ['No, no en tinc prou', 'Sí, en tinc prou'],
    'Arrodoneix cada preu i suma. Si el resultat queda molt a prop dels diners que tens, calcula-ho exacte.',
    `El total és ${eur(t)}: ${ok ? `${eur(have - t)} menys del que tens` : `${eur(t - have)} més del que tens`}.`, receipt(lines, { total: -1 })); };
const nearTen = (e, k) => { const r = Math.round(e / 10) * 10, other = e % 10 >= 5 ? r - 10 : r + 10;
  return Pk(`${cap(F[k].the)} ${verb(k, 'costa', 'costen')} ${e} €. Arrodonit a la desena, quant és?`, [`${r} €`, `${other} €`, `${Math.round(e / 100) * 100 || 100} €`].filter((x, i, a) => a.indexOf(x) === i),
    `Mira les unitats: ${e % 10}. Si són 5 o més, cap amunt; si són menys de 5, cap avall.`, `${e} € és prop de ${r} €.`, stall([it(k, e * 100)])); };
const many = (have, p, k) => { const r = Math.round(have / (Math.round(p / 50) * 50));
  return Pk(`Tens ${eur(have)} i ${F[k].the} ${verb(k, 'costa', 'costen')} ${eur(p)}. Més o menys, quants en pots comprar?`, [`Uns ${r}`, `Uns ${r * 10}`, `Uns ${Math.max(2, Math.round(r / 2))}`],
    `${eur(p)} és gairebé ${eur(Math.round(p / 50) * 50)}. Quantes vegades cap dins de ${eur(have)}?`, `${eur(have)} : ${eur(Math.round(p / 50) * 50)} = ${r}, més o menys.`, stall([it(k, p)])); };
const ascending = items => R(stall(items), Q('order', 'Toca-ho tot, del més barat al més car.', items.map((x, i) => [x.p, i]).sort((a, b) => a[0] - b[0]).map(x => String(x[1])),
  'Mira les etiquetes: primer el preu més petit. Compara primer els euros i després els cèntims.', `Ordenats: ${items.slice().sort((a, b) => a.p - b.p).map(x => eur(x.p)).join(' › ')}.`));

/* ---------- dividing and the offers ---------- */
const unit = (n, p, k) => E(`Un paquet de ${n} ${F[k].n.toLowerCase()}${n > 1 && !/s$/.test(F[k].n) ? 's' : ''} costa ${eur(p)}. Quant costa cada un?`, p / n,
  `Reparteix ${eur(p)} en ${n} parts iguals: ${eur(p)} : ${n}. Pensa-ho en cèntims: ${p} : ${n}.`, `${eur(p)} : ${n} = ${eur(p / n)}.`, stall([it(k, p, `paquet de ${n}`)]));
const howMany = (have, p, k) => N(`Tens ${eur(have)} i ${F[k].the} ${verb(k, 'costa', 'costen')} ${eur(p)}. Quants en pots comprar?`, Math.floor(have / p),
  `Quantes vegades cap ${eur(p)} dins de ${eur(have)}? Ves sumant ${eur(p)} fins que no n'hi càpiga cap més.`,
  have % p ? `${Math.floor(have / p)} × ${eur(p)} = ${eur(Math.floor(have / p) * p)}. Un més ja serien ${eur((Math.floor(have / p) + 1) * p)}.` : `${eur(have)} : ${eur(p)} = ${have / p}.`, stall([it(k, p)]));
const left = (have, p, k) => { const n = Math.floor(have / p), r = have - n * p;
  return [howMany(have, p, k), money(`I {?} et sobren?`, r, `${n} × ${eur(p)} = ${eur(n * p)}. Resta-ho de ${eur(have)}.`, `${eur(have)} − ${eur(n * p)} = ${r < 100 ? r + ' cèntims' : eur(r)}.`, stall([it(k, p)]))]; };
// two offers: the one where each costs less
function offer(a, b, k) {
  const ua = a.p / a.n, ub = b.p / b.n, best = ua < ub ? 'a' : 'b', each = (o, u) => `${o.n === 1 ? eur(o.p) : `${eur(o.p)} : ${o.n} = ${eur(u)}`}`;
  return Tp('Quina oferta surt més a compte? Toca-la.', [best], `Calcula quant costa cada un a les dues ofertes. A: ${a.n === 1 ? 'ja és un sol' : `${eur(a.p)} : ${a.n}`}. B: ${b.n === 1 ? 'ja és un sol' : `${eur(b.p)} : ${b.n}`}.`,
    `A: ${each(a, ua)} cada un. B: ${each(b, ub)} cada un. Guanya la ${best.toUpperCase()}.`, { s: 'offers', a: { ...a, e: F[k].e }, b: { ...b, e: F[k].e } });
}
const second = (p, k) => E(`${cap(F[k].the)} costa ${eur(p)}, i ${/^una /.test(F[k].the) ? 'la segona' : 'el segon'} és a meitat de preu. Quant pagues per 2?`, p + p / 2, `El primer, ${eur(p)}. El segon, la meitat: ${eur(p)} : 2. Suma'ls.`,
  `${eur(p)} + ${eur(p / 2)} = ${eur(p + p / 2)}.`, stall([it(k, p, '2a a ½')], { deal: true }));
const halfP = (p, k) => E(`Rebaixes: tot a meitat de preu! ${cap(F[k].the)} ${verb(k, 'costava', 'costaven')} ${eur(p)}. Quant ${verb(k, 'costa', 'costen')} ara?`, p / 2, `La meitat és dividir entre 2: ${eur(p)} : 2.`,
  `${eur(p)} : 2 = ${eur(p / 2)}.`, stall([it(k, p, '−50 %')], { deal: true }));

/* ---------- the piggy bank ---------- */
const piggy = (per, o = {}) => ({ s: 'piggy', per, ...o });
const saving = (per, w) => E(`La granota posa ${eur(per)} a la guardiola cada setmana. Quant hi tindrà al cap de ${w} setmanes?`, per * w, `${w} setmanes són ${w} vegades ${eur(per)}.`,
  `${w} × ${eur(per)} = ${eur(per * w)}.`, piggy(per, { weeks: w }));
// how many weeks to buy k, which costs p, saving per each week and having have already
function weeks(p, per, k, have = 0) {
  const need = p - have, w = Math.ceil(need / per);
  return N(`La granota vol ${F[k].the} ${de(eur(p))}.${have ? ` Ja té ${eur(have)} a la guardiola.` : ''} Si hi posa ${eur(per)} cada setmana, quantes setmanes ha d'estalviar?`, w,
    `${have ? `Primer: quant li falta? ${eur(p)} − ${eur(have)} = ${eur(need)}. ` : ''}Després, quantes vegades cap ${eur(per)} dins de ${eur(need)}?${need % per ? ' Si no surt just, cal una setmana més!' : ''}`,
    need % per ? `En ${w - 1} setmanes en tindria ${eur((w - 1) * per + have)}: no n'hi ha prou. En ${w}, ${eur(w * per + have)}. Són ${w} setmanes.` : `${eur(need)} : ${eur(per)} = ${w} setmanes.`,
    piggy(per, { goal: it(k, p), have }), 'setmanes');
}

/* ---------- how money works: the barter of long ago, the lemonade, the bank ---------- */
// Before money, things were swapped. At the pond a loaf is worth 3 apples, a cheese 2 loaves (6 apples) and a fish 4 apples: what each
// is worth, counted in apples
const WORTH = { poma: 1, pa: 3, formatge: 6, peix: 4 };
const PA = ['pa', 3, 'poma'], FORMATGE = ['formatge', 2, 'pa'], PEIX = ['peix', 4, 'poma'];
// The scales of barter: what is on the left (keys of things) against the pieces the child puts on the right (apples, loaves) until both
// are worth the same. It is a question of weighing, with the value in apples for the weight; min asks for the fewest pieces
function swap(left, pieces, rules, text, hint, say, o = {}) {
  const target = sum(left.map(k => WORTH[k])), vals = pieces.map(k => WORTH[k]), best = fewest(target, vals);
  return R(null, Q('weigh', text, target, hint, say, { target, weights: vals, e: left.map(k => F[k].e).join(''),
    barter: { left: left.map(k => F[k].e), pieces: pieces.map(k => ({ v: WORTH[k], e: F[k].e, n: F[k].n.toLowerCase() })), rules }, min: o.min && best ? best.length : 0 }));
}
// the three jobs of money, to tell apart
const JOBS = ['Per canviar', 'Per posar preu', 'Per guardar'];
const job = (text, j) => Pk(`${text} Per a què serveixen aquí els diners?`, [JOBS[j], ...JOBS.filter((_, i) => i !== j)],
  'Canviar: pagar o cobrar alguna cosa. Posar preu: saber què val més. Guardar: estalviar per a més endavant.',
  ['Per canviar: tothom accepta els diners a canvi de les coses.', 'Per posar preu: amb els preus es pot comparar què val més.', 'Per guardar: els diners no es fan malbé i es poden estalviar.'][j]);
// the bank of the pond gives 1 € a year for every 10 € kept in it
const interest = c => c / 10;
// a line of the book of the bank or of the accounts
const BOOK = 'LLIBRETA DEL BANC', SHOP = 'COMPTES DE LA LLIMONADA';
const lemons = (n, each = 20) => bunch('llimona', n, each, `${n} llimones`);

/* ---------- the projects ---------- */
export const SECTIONS = [
  { name: 'Euros i cèntims', sub: 'Quant val cada moneda i cada bitllet, i com es compten.', levels: [
    lv('Les monedes petites', 'Les monedes petites són de cèntims. Mira el número i la paraula que hi ha escrits.', [value(5), value(20), value(50), value(2)]),
    lv('Euros i bitllets', "Les monedes grans són d'1 i de 2 euros. Els bitllets valen més: 5, 10, 20, 50 euros...", [value(100), value(200), value(1000), tapMost([50, 200, 20, 100])]),
    lv('Compta les monedes', 'Per comptar diners, comença per la moneda que val més i ves sumant.', [count([20, 20, 10, 5]), count([50, 20, 10, 10, 2]), count([50, 50, 20, 5, 1])]),
    lv('100 cèntims fan 1 euro', 'Un euro són 100 cèntims. 2 euros són 200 cèntims, i 2,50 € són 250 cèntims.', [toCents(100), toCents(250), toEur(175), toEur(320)]),
    lv('Monedes i bitllets', 'Ara hi ha bitllets i monedes barrejats. Primer, els bitllets!', [count([500, 200, 100, 50]), count([1000, 500, 200, 20]), count([2000, 1000, 50, 50, 10])]),
    lv('De més a menys', 'Ordena els diners: primer el que val més.', [order([20, 200, 5, 50, 100]), order([1000, 10, 500, 2, 2000])]),
    (S => lv('Llegeix els preus', "Cada fruita té el seu preu escrit a l'etiqueta.", [
      Tp('Quina és la fruita més cara? Toca-la.', [1], 'Mira les etiquetes i busca el preu més gran.', 'La pera: 0,65 €.', S),
      Tp('I la més barata?', [2], 'Ara busca el preu més petit.', 'El plàtan: 0,30 €.', S),
      N('Quants cèntims costa la taronja?', 45, '0,45 € vol dir 0 euros i 45 cèntims.', '0,45 € = 45 cèntims.', S, 'cèntims')]))(stall([it('poma', 40), it('pera', 65), it('platan', 30), it('taronja', 45)])),
    lv('Maneres de fer un euro', 'Hi ha moltes maneres de fer la mateixa quantitat amb monedes diferents.', [
      ways(100, [[50, 20, 20, 10], [50, 20, 20, 5], [50, 50, 20]]), ways(200, [[100, 50, 50], [100, 50, 20, 20], [50, 50, 50, 20]]), ways(150, [[50, 50, 20, 20, 10], [100, 20, 20], [50, 50, 50, 5]])]),
    lv('Quin moneder?', 'Dos moneders. Compta cada un i compara.', [...purses([200, 50, 20], [100, 100, 50, 10]), ...purses([500, 100, 5], [200, 200, 200, 20])]),
    lv('Repte del caixer', 'Tot el que has après: comptar, passar de cèntims a euros i fer quantitats.', [count([2000, 500, 200, 50, 20, 5]), toEur(345), ways(500, [[200, 200, 100], [200, 100, 100, 50], [200, 200, 50, 20, 20]])])
  ] },
  { name: 'Paga just', sub: 'Tria les monedes i els bitllets per pagar el preu exacte.', levels: [
    lv('Paga amb cèntims', 'Toca les monedes del moneder per posar-les al taulell. Si te n\'equivoques, toca-la al taulell i tornarà al moneder.', [pay(30, PC, { items: [item('platan', 30)] }), pay(45, PC, { items: [item('taronja', 45)] }), pay(80, PC, { items: [item('gelat', 80)] })]),
    lv('Paga amb euros', "Ara també tens monedes d'1 i de 2 euros.", [pay(120, PE, { items: [item('pa', 120)] }), pay(155, PE, { items: [item('croissant', 155)] }), pay(205, PE, { items: [item('raim', 205)] })]),
    lv('Paga a la parada', "Cada cosa té el seu preu. Paga'l just!", [pay(340, PE, { items: [item('sindria', 340)] }), pay(250, PE, { items: [item('maduixes', 250)] }), pay(185, PE, { items: [item('pinya', 185)] })]),
    lv('Amb bitllets', 'Per als preus grans, fes servir bitllets.', [pay(750, PB, { items: [item('samarreta', 750)] }), pay(1230, PB, { items: [item('llibre', 1230)] }), pay(2580, PB, { items: [item('patins', 2580)] })]),
    lv('Només el que tens', 'Ara el moneder té poques monedes. Pensa bé quines fas servir!', [lim(135, { 100: 1, 20: 3, 10: 2, 5: 1 }, { items: [item('suc', 135)] }), lim(85, { 50: 1, 20: 1, 10: 3, 5: 1, 2: 2 }, { items: [item('caramel', 85)] }), lim(470, { 200: 1, 100: 2, 50: 1, 20: 1, 10: 2 }, { items: [item('galetes', 470)] })]),
    lv('Sense la moneda bona', "Falta la moneda que voldries. Cal fer-ho d'una altra manera!", [lim(150, { 100: 1, 20: 3, 10: 2 }, { items: [item('xocolata', 150)] }), lim(90, { 20: 4, 5: 2 }, { items: [item('iogurt', 90)] }), lim(1000, { 500: 1, 200: 2, 50: 2 }, { items: [item('joc', 1000)] })]),
    lv('Les menys monedes', 'Paga amb tan poques monedes com puguis. Comença per la més gran que hi càpiga.', [pay(40, PE, { min: true, items: [item('poma', 40)] }), pay(80, PE, { min: true, items: [item('gelat', 80)] }), pay(175, PE, { min: true, items: [item('llet', 175)] })]),
    lv('Les menys peces', 'Bitllets i monedes: com menys peces, millor.', [pay(390, PB, { min: true, items: [item('formatge', 390)] }), pay(685, PB, { min: true, items: [item('pastis', 685)] }), pay(1860, PB, { min: true, items: [item('pilota', 1860)] })]),
    lv('Dues coses', 'Compres dues coses: primer suma els preus, i després paga.', [pay(215, PE, { items: [item('pa', 120), item('llet', 95)] }), pay(230, PE, { items: [item('cromos', 80), item('gelat', 150)] }), pay(495, PB, { items: [item('formatge', 375), item('pa', 120)] })]),
    lv('Repte de la caixa', 'Tot alhora: sumar, pagar just i amb les menys peces.', [pay(1575, PB, { min: true, items: [item('llibre', 1250), item('cromos', 325)] }), pay(2745, PB, { min: true, items: [item('joc', 2745)] }), lim(620, { 200: 2, 100: 1, 50: 3, 20: 2 }, { items: [item('peix', 620)] })])
  ] },
  { name: 'El canvi', sub: 'Torna el canvi comptant endavant, com a les botigues.', levels: [
    lv("El canvi d'un euro", 'Si pagues amb 1 euro i costa menys, et tornen la diferència. Compta des del preu fins a 100.', [change(65, 100, 'pera'), change(40, 100, 'poma'), change(85, 100, 'gelat')]),
    lv('Ets el botiguer', 'Ara la parada és teva! Torna el canvi amb les monedes de la caixa.', [change(70, 100, 'taronja', { till: PE, w: 0 }), change(145, 200, 'croissant', { till: PE, w: 1 }), change(280, 500, 'maduixes', { till: PE, w: 2 })]),
    lv('Canvi de bitllets', 'Ara et paguen amb bitllets. Compta endavant fins al bitllet.', [change(360, 500, 'formatge', { till: PB, w: 3 }), change(625, 1000, 'galetes', { till: PB, w: 4 }), change(1350, 2000, 'llibre', { till: PB, w: 5 })]),
    lv('Calcula el canvi', 'Sense monedes: calcula el canvi de cap.', [change(735, 1000, 'pastis'), change(1280, 2000, 'llibre'), change(2345, 5000, 'patins')]),
    lv('Canvi amb poques peces', 'Torna el canvi amb les menys monedes possibles.', [change(130, 200, 'llet', { till: PE, min: true, w: 6 }), change(415, 500, 'pinya', { till: PB, min: true, w: 0 }), change(840, 1000, 'peix', { till: PB, min: true, w: 1 })]),
    lv('El tiquet i el canvi', 'Primer suma el tiquet, i després calcula el canvi.', [change2([L('pa', 120), L('formatge', 340)], 500), change2([L('raim', 180), L('maduixes', 250), L('llet', 95)], 1000), change2([L('cromos', 80, 3), L('gelat', 150)], 1000)]),
    lv('Amb quin bitllet?', "Paga amb el bitllet més petit que n'hi hagi prou.", [bill(780, 'samarreta'), bill(1420, 'llibre'), bill(395, 'formatge')]),
    lv('Canvi gran', 'Quan el canvi és gran, també es torna amb bitllets.', [change(1760, 5000, 'joc', { till: PB, min: true, w: 2 }), change(2530, 5000, 'patins', { till: PB, min: true, w: 3 }), change(820, 2000, 'pastis', { till: PB, min: true, w: 4 })]),
    lv('Quant costava?', "Al revés: saps el que has pagat i el canvi. Quant costava?", [cost(2000, 630, 'samarreta'), cost(1000, 155, 'galetes'), cost(500, 85, 'suc')]),
    lv('Repte del botiguer', 'El botiguer més ràpid de l\'estany: canvi, tiquets i preus amagats.', [change(1875, 5000, 'pilota', { till: PB, min: true, w: 5 }), change2([L('peix', 645), L('patates', 120, 2), L('llimona', 35, 3)], 2000), cost(5000, 1265, 'bici')])
  ] },
  { name: 'El tiquet', sub: "Suma la compra com la caixa: euros, cèntims i me'n porto una.", levels: [
    lv('Preus rodons', 'El tiquet diu què has comprat. Suma els preus per saber el total.', [rec([L('sindria', 300), L('maduixes', 250)]), rec([L('pa', 150), L('formatge', 450)]), rec([L('pilota', 1200), L('cromos', 350)])]),
    lv('Euros i cèntims', 'Suma els euros amb els euros i els cèntims amb els cèntims.', [rec([L('pa', 120), L('taronja', 45)]), rec([L('raim', 235), L('llet', 140)]), rec([L('formatge', 310), L('galetes', 425)])]),
    lv("Me'n porto una", 'Si els cèntims passen de 100, fan un euro més.', [rec([L('gelat', 80), L('suc', 75)]), rec([L('pinya', 165), L('maduixes', 248)]), rec([L('xocolata', 290), L('formatge', 365)])]),
    lv('Tres coses', 'Tres preus: suma els dos primers i després el tercer.', [rec([L('pa', 120), L('llet', 95), L('raim', 180)]), rec([L('maduixes', 250), L('suc', 135), L('poma', 60)]), rec([L('sindria', 340), L('formatge', 215), L('galetes', 175)])]),
    lv('El truc del 99', 'Un preu com 1,99 € és gairebé 2 €. Suma 2 € i després treu el cèntim.', [rec([L('xocolata', 199), L('galetes', 299)]), rec([L('llibreta', 499), L('cromos', 350)]), rec([L('joc', 995), L('samarreta', 295)])]),
    lv('Quantitats', "Al tiquet, «2 ×» vol dir que n'has comprat dos.", [rec([L('croissant', 125, 2), L('gelat', 80)]), rec([L('poma', 40, 3), L('llet', 95, 2)]), rec([L('suc', 110, 4), L('maduixes', 250)])]),
    lv('Falta un preu', "Saps el total, però s'ha esborrat un preu. Quin és?", [miss([L('pa', 120), L('llet', 95), L('raim', 230)], 2), miss([L('formatge', 375), L('poma', 60), L('suc', 135)], 0), miss([L('pilota', 1250), L('cromos', 80, 2), L('gelat', 150)], 2)]),
    lv("L'error del tiquet", "La caixa s'ha equivocat en una línia. Troba-la!", [wrongLine([L('croissant', 125, 2), L('poma', 40, 3), L('gelat', 80)], [1, 150]), wrongLine([L('suc', 110, 4), L('pa', 120), L('llimona', 35, 2)], [0, 400]), wrongLine([L('iogurt', 45, 6), L('llet', 95, 2), L('cromos', 80, 5)], [2, 450])]),
    lv('Quatre coses', 'Una compra més gran. Suma amb calma, línia a línia.', [rec([L('pa', 120), L('llet', 95), L('maduixes', 250), L('raim', 180)]), rec([L('croissant', 85, 2), L('formatge', 340), L('poma', 30, 3), L('xocolata', 199)]), rec([L('llibre', 1250), L('cromos', 325), L('llibreta', 480), L('suc', 95)])]),
    lv('El gran tiquet', "El tiquet més llarg de l'estany!", [rec([L('pa', 150, 2), L('taronja', 85, 3), L('formatge', 420), L('xocolata', 199), L('poma', 60, 2)]), miss([L('peix', 780), L('patates', 120, 2), L('tomaquet', 245), L('llet', 95)], 2), wrongLine([L('ous', 30, 12), L('pa', 150, 2), L('llet', 95, 3)], [0, 300])])
  ] },
  { name: 'Quilos i grams', sub: 'Balances, quilos, mig quilo i preus per quilo.', levels: [
    lv('Llegeix la balança', "La balança de la parada té una agulla. Mira on s'atura i llegeix els grams.", [dial(300, 'cireres'), dial(700, 'maduixes'), dial(1200, 'patates')]),
    lv('1 kg = 1.000 g', 'Un quilo són 1.000 grams. Mig quilo, 500 g. Un quart de quilo, 250 g.', [
      N('Quants grams fa mig quilo?', 500, 'Un quilo són 1.000 g. La meitat de 1.000?', 'Mig quilo = 500 g.', null, 'g'),
      N('Quants grams fa un quart de quilo?', 250, 'Un quart és la meitat de la meitat: 1.000 → 500 → ?', 'Un quart de quilo = 250 g.', null, 'g'),
      N('Quants grams són 2 kg i mig?', 2500, '2 kg són 2.000 g. I mig quilo, 500 g més.', '2.000 + 500 = 2.500 g.', null, 'g'),
      N('Quants grams són 3 kg?', 3000, 'Cada quilo són 1.000 g.', '3 × 1.000 = 3.000 g.', null, 'g')]),
    lv('Equilibra la balança', "Posa peses a l'altre plat fins que la balança quedi recta.", [weigh(700, 'cireres'), weigh(300, 'maduixes'), weigh(850, 'raim')]),
    lv("Més d'un quilo", 'Ara pesa més d\'un quilo. Fes servir la pesa d\'1 kg!', [weigh(1250, 'pinya'), weigh(1750, 'patates'), weigh(2400, 'sindria')]),
    lv('Preu per quilo', 'Si 1 kg costa 2 €, 3 kg costen 3 vegades 2 €.', [kilo(3000, 200, 'poma'), kilo(2000, 150, 'taronja'), kilo(3000, 240, 'platan')]),
    lv('Mig quilo i un quart', 'Mig quilo costa la meitat del preu del quilo. Un quart de quilo, la quarta part.', [kilo(500, 800, 'cireres'), kilo(250, 1600, 'formatge'), kilo(500, 500, 'maduixes'), kilo(250, 1200, 'pernil')]),
    lv('Quants quilos?', "Divideix els diners entre el preu d'un quilo.", [kgs(1000, 200, 'patates'), kgs(900, 300, 'poma'), kgs(1200, 150, 'taronja')]),
    lv('De 100 en 100 grams', 'A la xarcuteria, els preus són per cada 100 grams.', [per100(300, 250, 'pernil'), per100(500, 180, 'formatge'),
      E('200 g de formatge costen 3 €. Quant costa 1 kg?', 1500, '1 kg són 1.000 g: 5 vegades 200 g.', '5 × 3 € = 15 €.', stall([it('formatge', 300, '200 g')]))]),
    lv('La bossa de la compra', 'Suma el pes de tot el que portes a la bossa.', [
      N('A la bossa hi ha 1 kg de pomes, 500 g de cireres i 250 g de formatge. Quants grams pesa tot?', 1750, 'Passa-ho tot a grams: 1 kg són 1.000 g.', '1.000 + 500 + 250 = 1.750 g.', stall([it('poma', 1000, '1 kg'), it('cireres', 500, '500 g'), it('formatge', 250, '250 g')], { weights: true }), 'g'),
      N('I si hi poses 2 kg de patates, 750 g de tomàquets i 500 g de pastanagues?', 3250, '2 kg són 2.000 g. Suma-ho tot en grams.', '2.000 + 750 + 500 = 3.250 g.', stall([it('patates', 2000, '2 kg'), it('tomaquet', 750, '750 g'), it('pastanaga', 500, '500 g')], { weights: true }), 'g'),
      N('La bossa aguanta 5 kg. Ja hi ha 3.250 g. Quants grams més hi caben?', 1750, '5 kg són 5.000 g. Resta.', '5.000 − 3.250 = 1.750 g.', null, 'g')]),
    lv('Repte de la balança', 'Balances, grams i preus: tot junt.', [weigh(1950, 'pastis'), kilo(750, 1200, 'cireres'), dial(1600, 'pinya'), kgs(1500, 250, 'patates')])
  ] },
  { name: 'Multiplica la compra', sub: 'Paquets, dotzenes i caixes: multiplica preus i quantitats.', levels: [
    lv('Unes quantes iguals', "Si en compres unes quantes d'iguals, multiplica el preu de cada una per les que en compres.", [times(4, 100, 'croissant'), times(3, 50, 'poma'), times(5, 20, 'caramel')]),
    lv('Sobres de cromos', 'Els sobres de cromos de futbol! Multiplica.', [times(5, 80, 'cromos'), times(6, 45, 'iogurt'), times(3, 125, 'suc')]),
    lv('La dotzena', 'Una dotzena són 12. Mitja dotzena, 6.', [
      N('Quants ous hi ha en 3 dotzenes?', 36, 'Cada dotzena són 12 ous: 3 × 12.', '3 × 12 = 36 ous.', crate(3, 12, 'ous'), 'ous'),
      N('I en mitja dotzena?', 6, 'La meitat de 12.', 'Mitja dotzena = 6.', crate(1, 6, 'ous'), 'ous'),
      E('Un ou costa 0,25 €. Quant costa una dotzena?', 300, '12 × 25 cèntims. Pensa: 4 ous són 1 €.', '12 × 0,25 € = 3 €.', crate(2, 6, 'ous'))]),
    lv('Doble i meitat', 'Per multiplicar per 4, fes el doble del doble: 2,50 € → 5 € → 10 €.', [times(4, 250, 'maduixes'), times(8, 125, 'suc'), times(4, 75, 'gelat')]),
    lv('Per 10 i per 100', 'Multiplicar per 10 fa el preu 10 vegades més gran: 0,35 € × 10 = 3,50 €.', [times(10, 35, 'llimona'), times(10, 120, 'pa'), times(100, 5, 'caramel')]),
    lv('El truc del preu rodó', '0,95 € és 1 € menys 5 cèntims. 6 × 0,95 € = 6 € menys 30 cèntims.', [times(6, 95, 'llet'), times(3, 199, 'xocolata'), times(4, 295, 'galetes')]),
    (C => lv('Caixes de fruita', 'Les fruites van en files i columnes. Multiplica les files per les columnes!', [
      N('Quantes pomes hi ha a la caixa?', 24, 'Compta les files i les columnes, i multiplica-les.', '4 files × 6 columnes = 24 pomes.', C, 'pomes'),
      E('Cada poma costa 0,30 €. Quant costa tota la caixa?', 720, '24 × 0,30 €. Pensa: 10 pomes són 3 €.', '24 × 0,30 € = 7,20 €.', C),
      N('I en aquesta caixa de llimones?', 21, 'Files per columnes.', '3 × 7 = 21 llimones.', crate(3, 7, 'llimona'), 'llimones')]))(crate(4, 6, 'poma')),
    lv('Dues compres', 'Calcula cada línia i després suma.', [rec([L('poma', 120, 3), L('pa', 90, 2)]), rec([L('llimona', 35, 4), L('maduixes', 150, 2)]), rec([L('cromos', 80, 5), L('iogurt', 45, 3)])]),
    lv('Ofertes 3×2', "«3×2» vol dir que te n'emportes 3 i només en pagues 2.", [deal(3, 50, 'iogurt'), deal(6, 50, 'iogurt'), deal(9, 120, 'suc')]),
    lv('Repte multiplicador', 'Multiplica, suma i aprofita les ofertes.', [times(12, 85, 'croissant', 'Un croissant costa 0,85 €'), rec([L('maduixes', 250, 3), L('llet', 95, 4)]), deal(6, 135, 'gelat')])
  ] },
  { name: 'Calcula a ull', sub: "Arrodoneix i estima: n'hi ha prou? Més o menys, quant?", levels: [
    lv("L'euro més proper", "Un preu com 2,90 € és gairebé 3 €. Arrodonir és buscar l'euro sencer més proper.", [near(290), near(415), near(749), near(610)]),
    lv('Més o menys, quant?', 'Arrodoneix cada preu i suma els números rodons.', [est([L('xocolata', 195), L('formatge', 310), L('llet', 98)]), est([L('galetes', 490), L('pa', 205), L('suc', 299)]), est([L('llibre', 1190), L('samarreta', 810), L('cromos', 395)])]),
    lv("N'hi ha prou?", 'No cal calcular-ho exacte: arrodoneix i mira si passa dels diners que tens.', [enough(1000, [L('formatge', 390), L('galetes', 295), L('maduixes', 280)]), enough(500, [L('xocolata', 199), L('raim', 210), L('pinya', 150)]), enough(2000, [L('llibre', 990), L('cromos', 480), L('llibreta', 395)])]),
    lv('Just a la ratlla', "Ara els totals s'acosten molt als diners que tens. Compte!", [enough(1000, [L('galetes', 495), L('xocolata', 299), L('suc', 210)]), enough(1500, [L('formatge', 690), L('raim', 399), L('maduixes', 405)]), enough(800, [L('pa', 205), L('pinya', 315), L('llet', 290)])]),
    lv('La desena més propera', 'Per arrodonir a la desena, mira les unitats: 5 o més, cap amunt; menys de 5, cap avall.', [nearTen(47, 'patins'), nearTen(152, 'bici'), nearTen(385, 'mobil')]),
    lv('Estima i calcula', 'Primer, una estimació ràpida. Després, el càlcul exacte. S\'assemblen?', [est([L('pa', 195), L('formatge', 405)]), rec([L('pa', 195), L('formatge', 405)]), est([L('raim', 290), L('llet', 110), L('cromos', 395)]), rec([L('raim', 290), L('llet', 110), L('cromos', 395)])]),
    lv('Quants en pots comprar?', 'Arrodoneix el preu per saber-ho més o menys.', [many(500, 48, 'poma'), many(1000, 198, 'suc'), many(2000, 249, 'xocolata')]),
    lv('Ordena els preus', 'Toca els productes del més barat al més car.', [ascending([it('pera', 65), it('sindria', 340), it('poma', 40), it('maduixes', 250)]), ascending([it('llibre', 1250), it('cromos', 80), it('samarreta', 1199), it('gelat', 150), it('joc', 2745)])]),
    lv('La resposta impossible', 'Sense fer tot el càlcul: quina resposta no pot ser de cap manera?', [
      Pk("Compres 3 llibretes a 1,95 € cada una. Quina d'aquestes respostes és impossible?", ['58,50 €', '5,85 €', 'Una mica menys de 6 €'], 'Cada llibreta costa menys de 2 €. Tres costen menys de 6 €.', '3 llibretes de menys de 2 € no poden costar 58 €! Costen 5,85 €.', stall([it('llibreta', 195)])),
      Pk('Compres pa (1,20 €) i llet (0,95 €) i pagues amb 5 €. Quin canvi és impossible?', ['5,85 €', '2,85 €', 'Gairebé 3 €'], 'Pots rebre més canvi que el que has pagat?', 'El canvi mai pot ser més que el que has pagat. És 2,85 €.', receipt([L('pa', 120), L('llet', 95)])),
      Pk('Mig quilo de cireres a 8 € el kg. Quin preu és impossible?', ['16 €', '4 €', 'La meitat de 8 €'], 'Mig quilo ha de costar menys que un quilo sencer.', 'Mig quilo no pot costar el doble que un quilo! Costa 4 €.', stall([it('cireres', 800, 'el kg')]))]),
    lv("Repte d'estimació", 'Arrodonir, estimar i decidir: com un mercader savi.', [enough(2000, [L('peix', 785), L('formatge', 610), L('maduixes', 520)]), est([L('pastis', 1290), L('suc', 210), L('galetes', 395)]), many(1000, 95, 'iogurt'), near(1050)])
  ] },
  { name: 'Ofertes i paquets', sub: 'Divideix per saber quant val cada un, quants en pots comprar i quina oferta guanya.', levels: [
    lv('Quant val cada un?', "Si un paquet de 4 costa 2 €, cada un costa 2 € dividit entre 4.", [unit(4, 200, 'iogurt'), unit(5, 400, 'croissant'), unit(10, 350, 'caramel')]),
    lv('Quants en pots comprar?', 'Mira quantes vegades cap el preu dins dels diners que tens.', [howMany(600, 150, 'croissant'), howMany(1000, 200, 'suc'), howMany(500, 50, 'poma')]),
    lv('I quant et sobra?', 'Si no surt just, compra els que pots i mira què et sobra.', [...left(1000, 300, 'formatge'), ...left(500, 120, 'pa')]),
    lv('Bosses iguals', 'Repartir en bosses o caixes iguals és dividir.', [
      N('Vols posar 24 pomes en bosses de 6. Quantes bosses necessites?', 4, 'Quantes vegades cap 6 dins de 24?', '24 : 6 = 4 bosses.', crate(4, 6, 'poma'), 'bosses'),
      N('Tens 30 ous i caixes de 12. Quantes caixes queden plenes?', 2, 'Quantes vegades cap 12 dins de 30?', '2 caixes de 12 són 24 ous.', crate(3, 10, 'ous'), 'caixes'),
      N('I quants ous queden fora de les caixes?', 6, 'Ja n\'has posat 24. Quants en falten de 30?', '30 − 24 = 6 ous.', crate(3, 10, 'ous'), 'ous')]),
    lv('Quina surt més a compte?', 'Calcula quant costa cada un a les dues ofertes.', [offer({ n: 4, p: 300 }, { n: 1, p: 80 }, 'iogurt'), offer({ n: 6, p: 420 }, { n: 2, p: 130 }, 'suc'), offer({ n: 3, p: 240 }, { n: 5, p: 450 }, 'croissant')]),
    lv('El segon, a meitat de preu', 'Compres dues coses iguals: la primera val el preu sencer i la segona, la meitat.', [second(400, 'pilota'), second(250, 'maduixes'), second(1200, 'samarreta')]),
    lv('Rebaixes!', 'A meitat de preu vol dir dividir el preu entre 2.', [halfP(1800, 'patins'), halfP(700, 'llibre'), halfP(1250, 'joc')]),
    lv('Quina oferta tries?', '3×2 o meitat de preu? Calcula les dues!', [
      Pk('Vols 3 sucs d\'1 €. Oferta A: 3×2. Oferta B: tot a meitat de preu. Quina és millor?', ['La B', 'La A', 'Costen igual'], 'A: pagues 2 sucs. B: cada suc costa 0,50 €.', 'A: 2 €. B: 3 × 0,50 € = 1,50 €. Guanya la B.', stall([it('suc', 100)])),
      Pk('Vols 6 gelats de 2 €. Oferta A: el segon a meitat de preu. Oferta B: 3×2. Quina és millor?', ['La B', 'La A', 'Costen igual'], 'A: cada parella costa 2 € + 1 €. B: de cada 3, en pagues 2.', 'A: 3 parelles × 3 € = 9 €. B: en pagues 4, 8 €. Guanya la B.', stall([it('gelat', 200)])),
      Pk('Vols 2 samarretes de 10 €. Oferta A: la segona a meitat de preu. Oferta B: 3×2. Quina és millor?', ['La A', 'La B', 'Costen igual'], 'Amb el 3×2, cal comprar-ne 3 per tenir-ne una de regal.', 'A: 10 € + 5 € = 15 €. B: amb dues no hi ha regal, 20 €. Guanya la A.', stall([it('samarreta', 1000)]))]),
    lv('Repartir el pes', 'Per dividir quilos en parts iguals, passa-ho primer a grams.', [
      N('Tens 3 kg de pomes per posar en 4 bosses iguals. Quants grams hi van a cada bossa?', 750, '3 kg són 3.000 g. Divideix entre 4.', '3.000 : 4 = 750 g.', stall([it('poma', 3000, '3 kg')], { weights: true }), 'g'),
      N('2 kg de cireres en 5 bosses iguals. Quants grams a cada una?', 400, '2 kg són 2.000 g. 2.000 : 5.', '2.000 : 5 = 400 g.', stall([it('cireres', 2000, '2 kg')], { weights: true }), 'g'),
      N('Un formatge d\'1 kg i mig es talla en 6 trossos iguals. Quants grams fa cada tros?', 250, '1 kg i mig són 1.500 g. 1.500 : 6.', '1.500 : 6 = 250 g.', stall([it('formatge', 1500, '1,5 kg')], { weights: true }), 'g')]),
    lv('Repte de les ofertes', 'Divideix, compara i tria com un mercader savi.', [unit(6, 450, 'iogurt'), offer({ n: 8, p: 600 }, { n: 3, p: 240 }, 'galetes'), ...left(2000, 350, 'cromos')])
  ] },
  { name: 'La guardiola', sub: 'Estalvia, planifica i resol problemes de diversos passos.', levels: [
    lv('Cada setmana', 'La granota posa la mateixa quantitat a la guardiola cada setmana.', [saving(200, 6), saving(150, 4), saving(250, 8)]),
    lv('Quantes setmanes?', 'Divideix el preu entre el que estalvies cada setmana.', [weeks(1500, 300, 'pilota'), weeks(2000, 250, 'joc'), weeks(1200, 200, 'llibre')]),
    lv('Si no surt just', 'Si una setmana encara no hi arribes, cal esperar-ne una altra!', [weeks(1700, 300, 'samarreta'), weeks(2500, 400, 'patins'), weeks(1000, 300, 'pastis')]),
    lv('Ja en tinc una part', 'Primer mira quant et falta, i després divideix.', [weeks(2000, 200, 'joc', 800), weeks(3500, 500, 'patins', 1500), weeks(1800, 250, 'pilota', 300)]),
    lv('Un mes i un any', 'Un mes té unes 4 setmanes, i un any, 52.', [
      E('Si estalvies 5 € cada setmana, quant tindràs al cap de 4 setmanes?', 2000, '4 × 5 €.', '4 × 5 € = 20 €.', piggy(500, { weeks: 4 })),
      E('I en 52 setmanes, un any sencer?', 26000, '52 × 5 €. Pensa: 50 × 5 i 2 × 5.', '52 × 5 € = 260 €.', piggy(500)),
      E('Si estalvies 2,50 € cada setmana, quant tindràs en un any?', 13000, '52 × 2,50 €. És la meitat que amb 5 € cada setmana.', '52 × 2,50 € = 130 €.', piggy(250))]),
    (T => lv('El pícnic', 'Tens 15 € per al pícnic. Compra i calcula.', [rec(T.lines), E('Quant et sobra dels 15 €?', 500, 'Resta el total del tiquet de 15 €.', '15 € − 10 € = 5 €.', receipt(T.lines)),
      N("Amb el que et sobra, quants gelats d'1,50 € pots comprar?", 3, 'Quantes vegades cap 1,50 € dins de 5 €?', '3 × 1,50 € = 4,50 €. Per a un quart gelat caldrien 6 €.', stall([it('gelat', 150)]), 'gelats')]))({ lines: [L('pa', 120, 2), L('formatge', 375), L('tomaquet', 45, 3), L('maduixes', 250)] }),
    lv('Dues preguntes', 'Un problema, dues preguntes. La segona necessita la primera!', [
      E('Compres 3 sobres de cromos a 0,90 € cada un. Quant pagues?', 270, '3 × 0,90 €.', '3 × 0,90 € = 2,70 €.', stall([it('cromos', 90)])),
      E('Pagues amb 5 €. Quant et tornen?', 230, '5 € − 2,70 €.', '5 € − 2,70 € = 2,30 €.', stall([it('cromos', 90)])),
      E('Compres 2 kg de taronges a 1,80 € el kg. Quant pagues?', 360, '2 × 1,80 €.', '2 × 1,80 € = 3,60 €.', stall([it('taronja', 180, 'el kg')])),
      E('Pagues amb un bitllet de 10 €. Quant et tornen?', 640, '10 € − 3,60 €.', '10 € − 3,60 € = 6,40 €.', stall([it('taronja', 180, 'el kg')]))]),
    lv("Tria l'operació", 'Abans de calcular, pensa: sumar, restar, multiplicar o dividir?', [
      Pk("Tens 12 € i compres 4 llibretes iguals amb tots els diners. Com saps el preu d'una?", ['12 : 4', '12 × 4', '12 − 4'], 'Repartir els diners en parts iguals és dividir.', '12 : 4 = 3 € cada llibreta.'),
      Pk('Compres 5 sobres de cromos a 0,80 €. Com saps quant pagues?', ['5 × 0,80', '5 + 0,80', '5 : 0,80'], 'Moltes vegades el mateix preu és multiplicar.', '5 × 0,80 € = 4 €.'),
      Pk("Tenies 20 € i t'has gastat 7,50 €. Com saps quant et queda?", ['20 − 7,50', '20 + 7,50', '20 : 7,50'], 'Gastar és treure: és restar.', '20 € − 7,50 € = 12,50 €.'),
      Pk('Compres pa a 1,20 € i llet a 0,95 €. Com saps el total?', ['1,20 + 0,95', '1,20 × 0,95', '1,20 − 0,95'], 'Ajuntar dos preus és sumar.', '1,20 € + 0,95 € = 2,15 €.')]),
    lv('Tres passos', 'Problemes llargs: fes-los pas a pas.', [
      E('Compres 2 kg de pomes a 1,50 € el kg i una síndria de 3,40 €. Pagues amb 10 €. Quant et tornen?', 360, 'Pas 1: les pomes, 2 × 1,50 €. Pas 2: suma-hi la síndria. Pas 3: resta-ho de 10 €.', '3 € + 3,40 € = 6,40 €, i 10 € − 6,40 € = 3,60 €.', stall([it('poma', 150, 'el kg'), it('sindria', 340)])),
      N('Tens 20 €. Compres una samarreta de 12 € i, amb el que et sobra, sobres de cromos de 2 €. Quants sobres?', 4, 'Pas 1: quant et sobra? Pas 2: quantes vegades cap 2 € dins del que sobra?', '20 − 12 = 8 €, i 8 : 2 = 4 sobres.', stall([it('samarreta', 1200), it('cromos', 200)]), 'sobres'),
      E('Un paquet de 6 sucs costa 4,20 €. En compres 2 paquets i un suc solt de 0,90 €. Quant pagues?', 930, 'Pas 1: 2 paquets, 2 × 4,20 €. Pas 2: suma-hi el suc solt.', '8,40 € + 0,90 € = 9,30 €.', stall([it('suc', 420, 'paquet de 6'), it('suc', 90, 'solt')]))]),
    lv('El gran mercat', "L'últim repte del mercat: de tot una mica!", [pay(1385, PB, { min: true, items: [item('peix', 785), item('formatge', 600)] }), change(3260, 5000, 'patins', { till: PB, min: true, w: 6 }), weigh(1350, 'pastis'), weeks(4500, 500, 'bici', 1000)])
  ] },
  { name: 'Abans dels diners', sub: 'El bescanvi, i per què es van inventar els diners: per canviar, per posar preu i per guardar.', levels: [
    lv('La balança dels canvis', "Fa molt de temps no hi havia diners: la gent canviava unes coses per unes altres. Un pa valia el mateix que 3 pomes.", [
      swap(['pa'], ['poma'], [PA], "Posa pomes a l'altre plat fins que valguin el mateix que el pa.", 'Mira el tauler dels canvis: un pa val 3 pomes.', '1 pa = 3 pomes. Equilibrada!'),
      swap(['pa', 'pa'], ['poma'], [PA], 'I ara, per dos pans, quantes pomes cal posar?', 'Cada pa val 3 pomes: 3 i 3 més.', '2 pans = 3 + 3 = 6 pomes.'),
      swap(['peix'], ['poma'], [PEIX], 'El pescador porta un peix. Equilibra la balança amb pomes.', 'Mira el tauler: un peix val 4 pomes.', '1 peix = 4 pomes.')]),
    lv('Pans i pomes', 'Ara també pots posar pans al plat: un pa fa el mateix pes que 3 pomes.', [
      swap(['formatge'], ['pa', 'poma'], [FORMATGE, PA], 'El formatge val 2 pans. Equilibra-ho amb pans, amb pomes o amb tots dos.', 'Un formatge són 2 pans, i cada pa, 3 pomes.', '1 formatge = 2 pans = 6 pomes.'),
      swap(['formatge'], ['pa', 'poma'], [FORMATGE, PA], 'Torna-ho a fer, però amb les menys peces possibles.', 'Les peces grosses són els pans: comença per aquí.', '2 pans: només 2 peces!', { min: true }),
      swap(['peix', 'pa'], ['pa', 'poma'], [PEIX, PA], 'Un peix i un pa. Equilibra-ho amb les menys peces possibles.', "Passa-ho a pomes: 4 + 3 = 7. Quants pans hi caben, i quantes pomes falten?", '7 pomes: 2 pans i 1 poma, 3 peces.', { min: true })]),
    lv('Quantes pomes val?', 'Amb el tauler dels canvis es pot calcular sense balança.', [
      N('Quantes pomes valen 4 pans?', 12, 'Cada pa són 3 pomes: 4 vegades 3.', '4 × 3 = 12 pomes.', trade([PA]), 'pomes'),
      N('Quantes pomes val un formatge?', 6, 'Primer, quants pans val el formatge? Després, passa els pans a pomes.', '2 pans × 3 = 6 pomes.', trade([FORMATGE, PA]), 'pomes'),
      N('Tens 15 pomes. Quants pans te\'n donen?', 5, 'Quantes vegades cap 3 dins de 15?', '15 : 3 = 5 pans.', trade([PA]), 'pans'),
      N('Tens 2 formatges. Quants peixos te\'n donen?', 3, 'Passa-ho tot a pomes: un formatge són 6 pomes. Després, quants peixos de 4 pomes hi caben?', '2 × 6 = 12 pomes, i 12 : 4 = 3 peixos.', trade([FORMATGE, PA, PEIX]), 'peixos')]),
    lv('Quan el canvi no funciona', 'El bescanvi té un problema: cal trobar algú que tingui el que vols i que vulgui el que tens.', [
      Pk('El conill té pastanagues i vol un peix. Però el pescador no vol pastanagues: vol pa. Què pot fer el conill?', ['Canviar les pastanagues per pa, i després el pa pel peix', 'Donar-li les pastanagues igualment', 'Res: no hi ha cap manera'],
        'Busca algú que vulgui pastanagues i que tingui el que vol el pescador.', 'Dos canvis: pastanagues → pa → peix. Quina feinada!'),
      Pk('I si tothom del mercat accepta monedes, què fa el conill?', ['Ven les pastanagues i, amb les monedes, compra el peix', 'Canvia les monedes per pastanagues', 'Es guarda les pastanagues per sempre'],
        'Les monedes les vol tothom.', 'Vendre i comprar: les monedes serveixen per canviar qualsevol cosa.'),
      Pk('Per què és més fàcil pagar amb diners que fer bescanvi?', ['Perquè tothom els accepta a canvi de qualsevol cosa', 'Perquè els diners pesen més', 'Perquè amb diners no cal comptar'],
        'Pensa en el conill i el pescador.', 'Tothom accepta els diners: aquesta és la primera feina dels diners, servir per canviar.')]),
    (S => lv('Els preus mesuren', 'Si una poma costa 0,50 €, totes les coses es poden mesurar amb euros.', [
      E('Una poma costa 0,50 €, i un pa val 3 pomes. Quant costa el pa?', 150, '3 vegades 0,50 €.', '3 × 0,50 € = 1,50 €.', S),
      E('Un formatge val 6 pomes. Quant costa?', 300, '6 × 0,50 €. Pensa: 2 pomes fan 1 €.', '6 × 0,50 € = 3 €.', S),
      E('Un peix val 4 pomes. Quant costa?', 200, '4 × 0,50 €.', '4 × 0,50 € = 2 €.', S),
      Pk('Amb els preus en euros, què és més fàcil?', ['Saber de cop què val més', 'Comprar sense pagar', 'Que les pomes no es facin malbé'], 'Compara: 1,50 €, 3 € i 2 €.',
        'Amb euros, tot es mesura amb la mateixa regla: la segona feina dels diners és posar preu a les coses.', S)]))(stall([it('poma', 50)])),
    lv('Del preu al canvi', 'Al revés: amb els preus, es pot saber quantes coses en val una altra.', [
      N('El pa costa 1,20 € i una poma, 0,40 €. Quantes pomes val un pa?', 3, 'Quantes vegades cap 0,40 € dins d\'1,20 €? Pensa-ho en cèntims: 120 : 40.', '120 : 40 = 3 pomes.', stall([it('pa', 120), it('poma', 40)]), 'pomes'),
      N('Un formatge costa 4,50 € i un pa, 1,50 €. Quants pans val el formatge?', 3, 'Ves sumant 1,50 €: 1,50 · 3 · 4,50.', '3 × 1,50 € = 4,50 €: 3 pans.', stall([it('formatge', 450), it('pa', 150)]), 'pans'),
      N('Un peix costa 6 € i una llimona, 0,50 €. Quantes llimones val el peix?', 12, 'Cada euro són 2 llimones de 0,50 €.', '6 × 2 = 12 llimones.', stall([it('peix', 600), it('llimona', 50)]), 'llimones'),
      Pk('El pa costa 1,50 € i la llet, 1 €. Què val més: 2 pans o 3 llets?', ['Valen igual', '2 pans', '3 llets'], 'Calcula tots dos: 2 × 1,50 € i 3 × 1 €.', '2 × 1,50 € = 3 € i 3 × 1 € = 3 €: valen igual!', stall([it('pa', 150), it('llet', 100)]))]),
    lv('Monedes i bitllets', 'Els bitllets i les monedes també es canvien entre ells: un bitllet de 10 € són cinc monedes de 2 €.', [
      N('Quantes monedes de 2 € fan un bitllet de 10 €?', 5, '10 : 2.', '5 × 2 € = 10 €.', coins([1000, 200]), 'monedes'),
      N('Quantes monedes de 50 cèntims fan 5 €?', 10, 'Cada euro són 2 monedes de 50 cèntims.', '5 × 2 = 10 monedes.', coins([500, 50]), 'monedes'),
      N('Quants bitllets de 5 € fan 50 €?', 10, '50 : 5.', '10 × 5 € = 50 €.', coins([5000, 500]), 'bitllets'),
      N('Quantes monedes de 20 cèntims fan 2 €?', 10, 'Un euro són 5 monedes de 20 cèntims.', '2 × 5 = 10 monedes.', coins([200, 20]), 'monedes')]),
    lv("Guardar per a l'hivern", 'Les pomes es fan malbé. Els diners, no.', [
      N('Al setembre, la granota té 20 pomes. Cada setmana se n\'espatllen 3. Quantes en queden de bones al cap de 4 setmanes?', 8, 'En 4 setmanes se n\'espatllen 4 × 3.', '20 − 12 = 8 pomes.', crate(4, 5, 'poma'), 'pomes'),
      E('I si al setembre ven les 20 pomes a 0,50 € cada una, quants diners té?', 1000, '20 × 0,50 €.', '20 × 0,50 € = 10 €.', stall([it('poma', 50)])),
      Pk('Guarda els 10 € a la guardiola. Quants diners hi ha al cap de 4 setmanes?', ['10 €, els mateixos', '4 €', '8 €'], 'Les monedes no es fan malbé.', 'Els mateixos 10 €: les monedes no s\'espatllen.'),
      Pk('Per guardar fins a l\'estiu, què és millor?', ['Diners a la guardiola', 'Pomes al rebost', 'Gelats al sol'], 'Què no es fa malbé?', 'Els diners es poden guardar: aquesta és la tercera feina dels diners.')]),
    lv('Les tres feines dels diners', 'Canviar, posar preu i guardar: els diners serveixen per a tres coses.', [
      job('La granota paga el pa amb una moneda de 2 €.', 0),
      job("L'etiqueta diu que la pera costa 0,60 € i la poma 0,40 €: així se sap que la pera val més.", 1),
      job('Cada setmana poses 1 € a la guardiola per comprar-te uns patins a l\'estiu.', 2),
      job('El conill ven pastanagues i amb els diners compra un peix.', 0)]),
    lv('Repte del bescanvi', 'Bescanvis, preus i monedes: tot junt.', [
      swap(['formatge', 'peix'], ['pa', 'poma'], [FORMATGE, PA, PEIX], 'Un formatge i un peix. Equilibra-ho amb les menys peces possibles.', 'Passa-ho a pomes: 6 + 4 = 10. Quants pans de 3 hi caben?', '10 pomes: 3 pans i 1 poma, 4 peces.', { min: true }),
      N('Tens 3 peixos. Quants pans te\'n donen?', 4, 'Passa-ho a pomes: 3 peixos són 12 pomes. Quants pans de 3 pomes?', '3 × 4 = 12 pomes, i 12 : 3 = 4 pans.', trade([PEIX, PA]), 'pans'),
      E('Una poma costa 0,40 €. Quant costen 3 peixos de 4 pomes cada un?', 480, '3 peixos són 12 pomes: 12 × 0,40 €.', '12 × 0,40 € = 4,80 €.', trade([PEIX])),
      N('Quantes monedes de 50 cèntims fan un bitllet de 20 €?', 40, 'Cada euro són 2 monedes de 50 cèntims.', '20 × 2 = 40 monedes.', coins([2000, 50]), 'monedes')])
  ] },
  { name: 'La llimonada de la granota', sub: 'Compra, fes llimonada i ven-la: despeses, ingressos i guany.', levels: [
    lv('Compra els ingredients', 'La granota obre una parada de llimonada! Primer cal comprar el que fa falta.', [
      pay(80, PC, { items: [lemons(4)], text: 'Calen 4 llimones de 0,20 € cada una. Paga-les.', hint: '4 vegades 0,20 €: 0,20 · 0,40 · 0,60 · 0,80.' }),
      pay(250, PE, { items: [item('mel', 250)] }),
      pay(330, PE, { items: [lemons(4), item('mel', 250)] })]),
    lv('Ven llimonada', 'Ara la granota ven gots de llimonada a 0,50 €. Tu tornes el canvi!', [
      change(50, 100, 'got', { till: PE, w: 0 }), change(100, 200, 'got', { till: PE, w: 3, the: '2 gots de llimonada' }), change(150, 500, 'got', { till: PB, w: 1, the: '3 gots de llimonada' })]),
    (S => lv('Els ingressos', 'Els diners que cobres quan vens es diuen ingressos.', [
      E('Has venut 12 gots a 0,50 €. Quant has cobrat?', 600, '12 × 0,50 €. Pensa: 2 gots fan 1 €.', '12 × 0,50 € = 6 €.', S),
      E('Diumenge en vens 15 a 0,60 €. Quant cobres?', 900, '15 × 0,60 €: 10 gots fan 6 €, i 5 gots, 3 €.', '15 × 0,60 € = 9 €.', stall([it('got', 60, 'cada got')])),
      N('Un dia has cobrat 7 € venent gots a 0,50 €. Quants gots has venut?', 14, 'Cada euro són 2 gots.', '7 € : 0,50 € = 14 gots.', S, 'gots')]))(stall([it('got', 50, 'cada got')])),
    lv('Les despeses', 'Els diners que gastes per fer la llimonada es diuen despeses.', [
      E('Una llimona costa 0,20 €. Quant costen 10 llimones?', 200, '10 × 0,20 €.', '10 × 0,20 € = 2 €.', stall([it('llimona', 20, 'cada una')])),
      E('Quant has gastat en total?', 600, 'Suma les tres despeses.', '2 € + 2,50 € + 1,50 € = 6 €.', ledger([['10 llimones', '🍋', -200], ['Mel', '🍯', -250], ['Gel', '🧊', -150]], { title: SHOP, end: 'Despeses', hide: true })),
      E('La setmana següent compres 15 llimones, la mel de 2,50 € i el gel d\'1,50 €. Quant gastes?', 700, 'Primer les llimones: 15 × 0,20 €. Després, suma-hi la mel i el gel.', '3 € + 2,50 € + 1,50 € = 7 €.', stall([it('llimona', 20, 'cada una'), it('mel', 250), it('gel', 150)]))]),
    lv('El guany', 'El guany és el que et queda de veritat: els ingressos menys les despeses.', [
      E('Has cobrat 9 € i has gastat 6 €. Quant has guanyat?', 300, 'Ingressos menys despeses: 9 € − 6 €.', '9 € − 6 € = 3 €.', ledger([['Vendes', '🥤', 900], ['Ingredients', '🍋', -600]], { title: SHOP, end: 'Guany', hide: true })),
      E('Has venut 20 gots a 0,50 € i has gastat 6 €. Quant has guanyat?', 400, 'Primer, els ingressos: 20 × 0,50 €. Després, resta les despeses.', '10 € − 6 € = 4 €.', stall([it('got', 50, 'cada got')])),
      E('Has venut 16 gots a 0,75 € i els ingredients han costat 7,50 €. Quin és el guany?', 450, '16 × 0,75 €: 4 gots fan 3 €. Després, resta 7,50 €.', '12 € − 7,50 € = 4,50 €.', stall([it('got', 75, 'cada got')]))]),
    lv('Recuperar el que has gastat', 'Abans de guanyar, cal vendre prou per recuperar el que has gastat.', [
      N('Has gastat 6 € i cada got es ven a 0,50 €. Quants gots has de vendre per recuperar els 6 €?', 12, 'Cada euro són 2 gots.', '12 × 0,50 € = 6 €.', stall([it('got', 50, 'cada got')]), 'gots'),
      N('I quants gots per guanyar, a més a més, 2 €?', 16, 'Ara necessites 6 € + 2 € = 8 €.', '16 × 0,50 € = 8 €: 6 € per recuperar i 2 € de guany.', stall([it('got', 50, 'cada got')]), 'gots'),
      N('Si gastes 4,50 € i vens cada got a 0,75 €, quants gots has de vendre per recuperar-ho?', 6, 'Ves sumant 0,75 €: 0,75 · 1,50 · 2,25 · 3...', '6 × 0,75 € = 4,50 €.', stall([it('got', 75, 'cada got')]), 'gots')]),
    lv('Quant costa fer un got?', 'Si saps quant costa fer cada got, saps quant guanyes amb cada un.', [
      money('Amb 3 € d\'ingredients en surten 10 gots. {?} costa fer cada got?', 30, '3 € : 10. Pensa-ho en cèntims: 300 : 10.', '300 : 10 = 30 cèntims.'),
      money('El vens a 0,50 €. {?} guanyes amb cada got?', 20, 'El preu de venda menys el que costa fer-lo: 50 − 30.', '50 − 30 = 20 cèntims per got.', stall([it('got', 50, 'cada got')])),
      E('I si en vens 10, quant guanyes?', 200, '10 × 20 cèntims.', '10 × 0,20 € = 2 €. És el mateix que 5 € − 3 €!', stall([it('got', 50, 'cada got')]))]),
    lv('Pujar o baixar el preu', 'Més car no sempre vol dir cobrar més: si és car, en vens menys.', [
      Pk('A 0,50 € el got, en vens 20. A 1 €, només en vens 8. Amb quin preu cobres més?', ['A 0,50 €: 10 €', 'A 1 €: 8 €', 'Cobres igual'], 'Calcula tots dos: 20 × 0,50 € i 8 × 1 €.', '20 × 0,50 € = 10 € i 8 × 1 € = 8 €.'),
      E('Els ingredients costen 4 €. Quant guanyes si en vens 20 a 0,50 €?', 600, 'Ingressos: 10 €. Menys les despeses.', '10 € − 4 € = 6 €.'),
      E('I si en vens 8 a 1 €?', 400, 'Ingressos: 8 €. Menys les despeses.', '8 € − 4 € = 4 €.'),
      Pk('Quin preu et fa guanyar més?', ['0,50 €', '1 €', 'Tots dos igual'], 'Compara els dos guanys.', 'A 0,50 € guanyes 6 € i a 1 €, 4 €. Guanya el preu barat!')]),
    lv('Guanys i pèrdues', 'Si cobres menys del que has gastat, no guanyes: perds.', [
      Pk("Un dia de pluja has gastat 5 € i només has cobrat 3,50 €. Has guanyat o has perdut?", ['He perdut', 'He guanyat', 'Ni una cosa ni l\'altra'], 'Has cobrat més o menys del que has gastat?', '3,50 € és menys que 5 €: has perdut.', ledger([['Vendes', '🥤', 350], ['Ingredients', '🍋', -500]], { title: SHOP })),
      E('Quant has perdut?', 150, '5 € − 3,50 €.', '5 € − 3,50 € = 1,50 €.', ledger([['Vendes', '🥤', 350], ['Ingredients', '🍋', -500]], { title: SHOP })),
      Pk('Un altre dia gastes 5 € i cobres 5 €. Què passa?', ["Ni guanyes ni perds", 'Guanyes 5 €', 'Perds 5 €'], 'Ingressos menys despeses: 5 € − 5 €.', '5 € − 5 € = 0: has recuperat el que has gastat, i prou.'),
      E('Dilluns guanyes 3 €, dimarts perds 1,50 € i dimecres guanyes 4 €. Quant has guanyat en total?', 550, 'Suma els guanys i resta la pèrdua: 3 € + 4 € − 1,50 €.', '3 € + 4 € − 1,50 € = 5,50 €.', ledger([['Dilluns', '☀️', 300], ['Dimarts', '🌧️', -150], ['Dimecres', '☀️', 400]], { title: SHOP, end: 'Guany', hide: true }))]),
    lv('Repte del negoci', 'Despeses, ingressos i guany: el negoci sencer.', [
      E('Compres 12 llimones a 0,25 € i una bossa de gel de 2 €. Quant gastes?', 500, '12 × 0,25 €: 4 llimones fan 1 €. Després, suma-hi el gel.', '3 € + 2 € = 5 €.', stall([it('llimona', 25, 'cada una'), it('gel', 200)])),
      N('Vens cada got a 0,50 €. Quants n\'has de vendre per recuperar els 5 €?', 10, 'Cada euro són 2 gots.', '10 × 0,50 € = 5 €.', stall([it('got', 50, 'cada got')]), 'gots'),
      E('Si en vens 18, quant guanyes?', 400, 'Ingressos: 18 × 0,50 €. Menys els 5 € de despeses.', '9 € − 5 € = 4 €.', stall([it('got', 50, 'cada got')])),
      change(150, 500, 'got', { till: PB, min: true, w: 2, the: '3 gots de llimonada' })])
  ] },
  { name: "El banc de l'estany", sub: "Ingressar, treure, el saldo, l'interès, els préstecs i la targeta.", levels: [
    lv('Ingressa al banc', 'Al banc es guarden els diners en un compte. Posar-n\'hi es diu ingressar.', [
      pay(750, PB, { bank: true, text: 'Ingressa 7,50 € al teu compte del banc.' }),
      pay(1200, PB, { bank: true, min: true, text: 'Ingressa 12 € amb les menys peces possibles.' }),
      pay(2560, PB, { bank: true, text: 'Ingressa 25,60 € al compte.' })]),
    lv('El saldo', 'El saldo és quants diners tens al compte. Ingressar el fa pujar; treure\'n, baixar.', [
      E("Tenies 20 € al compte i n'hi ingresses 5. Quin és el saldo ara?", 2500, 'Ingressar és sumar: 20 € + 5 €.', '20 € + 5 € = 25 €.', ledger([['Ingrés', '💶', 500]], { title: BOOK, start: 2000, end: 'Saldo', hide: true })),
      E('Ara en treus 8 € al caixer. Quin és el saldo?', 1700, 'Treure és restar: 25 € − 8 €.', '25 € − 8 € = 17 €.', ledger([['Ingrés', '💶', 500], ['Caixer', '🏧', -800]], { title: BOOK, start: 2000, end: 'Saldo', hide: true })),
      E('Hi ingresses la paga de 10 € i pagues 3,50 € de cromos. Quin és el saldo?', 2350, 'Comença pels 17 €: suma la paga i resta els cromos.', '17 € + 10 € − 3,50 € = 23,50 €.', ledger([['Paga', '💶', 1000], ['Cromos', '🃏', -350]], { title: BOOK, start: 1700, end: 'Saldo', hide: true }))]),
    (B => lv('La llibreta del banc', 'La llibreta diu tot el que ha entrat (+) i sortit (−) del compte.', [
      E('Quin és el saldo final?', 2410, 'Ves línia a línia: suma el que entra i resta el que surt.', '15 € + 10 € − 4,50 € + 6 € − 2,40 € = 24,10 €.', B(true)),
      Tp('Després de quina línia hi havia més diners al compte? Toca-la.', [2], 'Calcula el saldo després de cada línia: 25 €, ...', 'Després del regal: 15 + 10 − 4,50 + 6 = 26,50 €.', B(false)),
      E('Quant hi has ingressat en total?', 1600, 'Suma només les línies amb +.', '10 € + 6 € = 16 €.', B(false)),
      E('I quant n\'has tret?', 690, 'Suma només les línies amb −.', '4,50 € + 2,40 € = 6,90 €.', B(false))]))(end => ledger([['Paga', '💶', 1000], ['Cinema', '🎟️', -450], ["Regal de l'àvia", '🎁', 600], ['Gelats', '🍦', -240]], { title: BOOK, start: 1500, ...(end ? { end: 'Saldo', hide: true } : {}) })),
    lv('La paga', 'Cada setmana tens una paga. Si no te la gastes tota, estalvies.', [
      E('Cada setmana tens 3 € de paga i en gastes 1,80 €. Quants diners estalvies cada setmana?', 120, 'Paga menys el que gastes: 3 € − 1,80 €.', '3 € − 1,80 € = 1,20 €.', piggy(120)),
      E('Quant estalvies en 5 setmanes?', 600, '5 × 1,20 €.', '5 × 1,20 € = 6 €.', piggy(120, { weeks: 5 })),
      N('Vols uns patins de 30 €. Quantes setmanes has d\'estalviar 1,20 € cada setmana?', 25, '5 setmanes són 6 €. Quantes vegades 6 € fan 30 €?', '5 setmanes són 6 €, i 30 € són 5 vegades 6 €: 25 setmanes.', piggy(120, { goal: it('patins', 3000) }), 'setmanes'),
      N('I si no gastes res de la paga, quantes setmanes et calen?', 10, '30 € : 3 €.', '30 € : 3 € = 10 setmanes. Gastar menys fa arribar abans!', piggy(300, { goal: it('patins', 3000) }), 'setmanes')]),
    lv('Necessitat o caprici?', 'Amb un pressupost, primer el que necessites, i després, si en sobra, els capricis.', [
      E('Tens 10 € per a l\'excursió i l\'autobús en costa 6. Quant et queda per a capricis?', 400, '10 € − 6 €.', '10 € − 6 € = 4 €.', stall([it('bus', 600)])),
      Pk('Amb els 4 € que et queden, què pots comprar?', ['Un gelat d\'1,50 € i cromos de 2 €', 'Un llibre de 5 €', 'Dos gelats i els cromos'], 'Suma cada opció i mira que no passi de 4 €.', '1,50 € + 2 € = 3,50 €: hi cap, i encara sobren 0,50 €.', stall([it('gelat', 150), it('cromos', 200), it('llibre', 500)])),
      Pk('Quina d\'aquestes coses és una necessitat?', ["El bitllet de l'autobús de l'excursió", 'Un sobre de cromos', 'Un gelat de xocolata'], 'Sense quina cosa no pots anar d\'excursió?', 'Sense autobús no hi vas: primer, el que cal.'),
      Pk('Tens 15 € per a la setmana i cada dia d\'escola gastes 2 € en l\'esmorzar. Pots comprar un joc de 6 €?', ['No: els esmorzars fan 10 € i en queden 5', 'Sí, i encara en sobren', 'Sí, just'],
        'Primer, els esmorzars: 5 dies × 2 €.', '5 × 2 € = 10 €, i 15 € − 10 € = 5 €: el joc de 6 € no hi cap.')]),
    lv("L'interès: el banc et paga", "Si deixes els diners al banc tot un any, el banc te'n dona una mica més: és l'interès. Al banc de l'estany, 1 € per cada 10 €.", [
      E('Tens 30 € al banc tot un any. Quant et dona el banc?', interest(3000), 'Quantes vegades hi ha 10 € dins de 30 €? Tants euros et dona.', '30 € són 3 vegades 10 €: 3 €.'),
      E('Quants diners tindràs, doncs, al cap de l\'any?', 3300, 'Els 30 € més l\'interès.', '30 € + 3 € = 33 €.'),
      E('I si hi tens 80 €, quant et dona?', interest(8000), 'Quantes vegades hi ha 10 € dins de 80 €?', '80 € són 8 vegades 10 €: 8 €.'),
      E('I amb 45 €? Per 5 €, el banc et dona la meitat d\'1 €.', interest(4500), '40 € donen 4 €. I 5 € és la meitat de 10 €: 0,50 €.', '4 € + 0,50 € = 4,50 €.')]),
    lv('Any rere any', "Al segon any, l'interès és més gran: també es compten els diners que el banc t'ha donat.", [
      E('Tens 100 € al banc. Al cap d\'un any, quant interès et donen?', interest(10000), '100 € són 10 vegades 10 €.', '1 € per cada 10 €: 10 €.'),
      E('Ara en tens 110. Quant interès et donen el segon any?', interest(11000), '110 € són 11 vegades 10 €.', '110 € són 11 vegades 10 €: 11 €.'),
      E('Quants diners tens al cap dels dos anys?', 12100, '110 € + 11 €.', '110 € + 11 € = 121 €.'),
      Pk("Per què el segon any et donen més interès que el primer?", ["Perquè ja tens més diners al compte: l'interès també en dona", "Perquè el banc s'equivoca", 'Perquè al segon any tot és més car'], 'Quants diners hi havia al compte cada any?', 'El primer any 100 €; el segon, 110 €. Com més n\'hi ha, més interès.')]),
    lv('El préstec', 'Si et falten diners, el banc te\'n pot deixar: és un préstec. Però s\'han de tornar, i una mica més.', [
      E("Demanes 20 € al banc i n'has de tornar 22. Quant t'ha costat el préstec?", 200, 'El que tornes menys el que t\'han deixat.', '22 € − 20 € = 2 €.'),
      E('Els 22 € els tornes en 4 mesos, a parts iguals. Quant tornes cada mes?', 550, '22 € : 4. Pensa: 20 € : 4 = 5 €, i 2 € : 4 = 0,50 €.', '22 € : 4 = 5,50 €.'),
      Pk('Vols uns patins de 40 €. Què surt més barat?', ['Estalviar fins a tenir-los', 'Demanar un préstec de 40 € i tornar-ne 44', 'Costen igual'], 'Quant pagues al final, en cada cas?', 'Estalviant pagues 40 €; amb el préstec, 44 €.', stall([it('patins', 4000)])),
      E('Demanes 50 € i el banc et cobra 1 € per cada 10 €. Quant has de tornar?', 5500, '50 € són 5 vegades 10 €: et cobra 5 €.', '50 € + 5 € = 55 €.')]),
    lv('Pagar amb targeta', 'La targeta paga amb els diners del teu compte: no són diners que surten del no-res!', [
      E('Tens 25 € al compte i pagues 8,40 € amb la targeta. Quant et queda al compte?', 1660, '25 € − 8,40 €.', '25 € − 8,40 € = 16,60 €.', ledger([['Targeta: llibre', '📘', -840]], { title: BOOK, start: 2500, end: 'Saldo', hide: true })),
      Pk('Ara vols pagar uns patins de 30 € amb la targeta. Pots?', ['No: al compte només hi ha 16,60 €', 'Sí: la targeta sempre paga', 'Sí, si la passes dues vegades'], 'D\'on surten els diners de la targeta?', 'La targeta només pot gastar el que hi ha al compte.', stall([it('patins', 3000)])),
      E('Quant et falta per poder-los comprar?', 1340, '30 € − 16,60 €.', '30 € − 16,60 € = 13,40 €.', stall([it('patins', 3000)])),
      N('Si cada setmana hi ingresses 5 €, quantes setmanes et calen per tenir-ho?', 3, 'En 2 setmanes, 10 €: no n\'hi ha prou.', 'En 2 setmanes, 10 € (no hi arribes); en 3, 15 €: 3 setmanes.', piggy(500, { goal: it('patins', 3000), have: 1660 }), 'setmanes')]),
    lv('Repte del banc', 'Ingressos, saldo, interès i préstecs: com un banquer de l\'estany.', [
      pay(1850, PB, { bank: true, min: true, text: 'Ingressa 18,50 € al compte amb les menys peces possibles.' }),
      E('Pagues un llibre de 6,75 € amb la targeta i després t\'ingressen la paga de 12 €. Quin és el saldo?', 2375, 'Comença per 18,50 €: resta el llibre i suma la paga.', '18,50 € − 6,75 € + 12 € = 23,75 €.', ledger([['Targeta: llibre', '📘', -675], ['Paga', '💶', 1200]], { title: BOOK, start: 1850, end: 'Saldo', hide: true })),
      E('Deixes 60 € al banc tot un any. Quant tindràs?', 6600, 'El banc et dona 1 € per cada 10 €: 6 €.', '60 € + 6 € = 66 €.'),
      E('Demanes un préstec de 30 € i en tornes 33 en 3 mesos iguals. Quant tornes cada mes?', 1100, '33 € : 3.', '33 € : 3 = 11 €.')])
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- checking ---------- */
// what a typed amount of money is worth in cents: «3,45» → 345, «3,5» → 350, «3» → 300; NaN when it is not a number
export function centsOf(buf) {
  if (!/^\d*(,\d{0,2})?$/.test(buf) || buf === '' || buf === ',') return NaN;
  const [e, c = ''] = buf.split(',');
  return (+e || 0) * 100 + +(c + '00').slice(0, 2);
}
// a counter of coins or weights (a list of values) against a question of paying or weighing: 'ok', 'over' (more than the target),
// 'more' (the target with more pieces than the fewest, when the fewest are asked for) or 'short'
export function verdict(q, put) {
  const t = sum(put);
  return t > q.target ? 'over' : t < q.target ? 'short' : q.min && put.length > q.min ? 'more' : 'ok';
}

/* ---------- the cursus: circles, projects, marks ---------- */
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Monedes i bitllets', projects: [0, 1, 2] },
  { name: 'La compra', projects: [3, 4, 5] },
  { name: 'El mercader savi', projects: [6, 7, 8] },
  { name: 'Com funcionen els diners', projects: [9, 10, 11] }
];
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, examIn, sheetIn, rapidIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: a coin to read, a price to pay and a stall to read
export const POOL = [value(50), pay(70, PC, { items: [item('poma', 70)] }),
  Tp('Quina és la cosa més cara de la parada? Toca-la.', [2], 'Mira les etiquetes i busca el preu més gran.', 'La síndria: 3,40 €.', stall([it('pera', 65), it('pa', 120), it('sindria', 340), it('llet', 95)]))];

// What is saved is facts only: { so, stars[120], piscina, exams[4], fulls, rapid }. A save of before the fourth circle had stars[90] and exams[3]: the places it lacks are 0 and false (rapid: the best rush hour, in customers served). Marks, XP, level and badges are worked out, never stored.
// a complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true), fulls: Math.max(0, whole(o.fulls)), rapid: Math.max(0, whole(o.rapid)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: "Caça bé les errades de deu fulls." },
  { name: 'Mercader savi', what: 'Supera els tres primers exàmens.' },
  { name: 'Hora punta', what: 'Atén 10 clients en una hora punta.' },
  { name: "Banquer de l'estany", what: "Supera l'examen del cercle 3." },
  { name: 'Hora punta de rècord', what: 'Atén 20 clients en una hora punta.' }
];
// «Mercader savi» is the three exams it always was; the exam of circle 3 has a badge of its own
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, p.exams.slice(0, 3).every(e => e === true), p.rapid >= 10,
  p.exams[3] === true, p.rapid >= 20];

/* ---------- the rush hour: customers in a queue, the change against the clock ---------- */
// The k-th customer of a rush: somebody buys a thing and pays with a note; the child gives the change with the till. The first ones
// pay a price of whole tens of cents with 1 € or 2 €; then notes of 5, 10 and 20 €, and prices of any 5 cents. From the eighth on,
// half of them buy two things: the two prices are added first. items the things bought, price what they cost together
export const RUSH_SECS = 90;
export function customer(k, rnd) {
  const paid = k < 3 ? pickOf([100, 200], rnd) : k < 7 ? pickOf([200, 500], rnd) : pickOf([500, 1000, 2000], rnd);
  const step = k < 5 ? 10 : 5, p = paid - step * (1 + at(Math.min(paid, k < 7 ? 500 : 2000) / step - 2, rnd));
  const [e, who, kind] = WHO[at(WHO.length, rnd)], [key, key2] = shuffle(FOOD.concat(['cromos', 'gelat', 'poma', 'pera']), rnd);
  const two = k >= 7 && p >= 4 * step && rnd() < 0.5, first = two ? step * (1 + at(p / step - 2, rnd)) : p;
  const items = two ? [it(key, first), it(key2, p - first)] : [it(key, p)];
  return { who: [e, who, kind], item: items[0], items, price: p, paid, change: paid - p, min: fewest(paid - p, PB.map(([v]) => v)).length };
}
export const TILL = PB;

/* ---------- the exam and «Caça l'errada» ---------- */
// Chance enters only through rnd (a function like Math.random).
// Six different levels of the projects of circle c, at least one of each project, in a random order; each is a copy of the level
// with p, its project, and idx added. A circle that does not exist gives the first
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const draw = p => {
    let idx = at(10, rnd);
    for (let n = 0; n < 10 && used.has(p * 10 + idx); n++) idx = (idx + 1) % 10;
    used.add(p * 10 + idx);
    return { ...PROJECTS[p].levels[idx], p, idx };
  };
  const list = ps.map(draw);
  while (list.length < 6) list.push(draw(ps[at(ps.length, rnd)]));
  return shuffle(list, rnd);
}

// A sheet: three sentences somebody wrote at the stall, each { kind, scene, says, real, opts }: says is the sentence written, real the
// true one (the sentence is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the ones made
// with money: the euro carried from the cents forgotten, the change counted badly, the cents of a product multiplied wrong, the half kilo
// taken for a kilo
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const FOOD = ['pa', 'llet', 'formatge', 'maduixes', 'raim', 'pinya', 'galetes', 'xocolata', 'suc', 'croissant'];
const KILO = ['cireres', 'poma', 'taronja', 'patates', 'tomaquet', 'platan'];
const CLAIM = {
  sum(bad, rnd) {
    const [a, b] = shuffle(FOOD.slice(), rnd), pa = 100 * at(4, rnd) + 5 * (10 + at(9, rnd)), pb = 100 * at(3, rnd) + 5 * (10 + at(9, rnd)), t = pa + pb;
    const say = x => `${F[a].n} i ${F[b].n.toLowerCase()} costen ${eur(x)} en total.`, wrong = [t - 100, t + 10];
    return { scene: receipt([L(a, pa), L(b, pb)], { total: -1 }), real: say(t), says: say(bad ? wrong[0] : t), opts: shuffle([t, ...wrong].map(say), rnd) };
  },
  change(bad, rnd) {
    const k = pickOf(FOOD, rnd), paid = pickOf([500, 1000, 2000], rnd), p = paid - 100 * (1 + at(paid / 100 - 2, rnd)) - 5 * (1 + at(19, rnd)), c = paid - p;
    const say = x => `Si pagues ${F[k].the} amb ${eur(paid)}, et tornen ${eur(x)}.`, wrong = [c + 100, c - 10 > 0 ? c - 10 : c + 20];
    return { scene: stall([it(k, p)]), real: say(c), says: say(bad ? wrong[0] : c), opts: shuffle([c, ...wrong].map(say), rnd) };
  },
  times(bad, rnd) {
    const k = pickOf(FOOD, rnd), n = 2 + at(4, rnd), p = 100 * at(3, rnd) + 5 * (5 + at(14, rnd)), t = n * p;
    // the mistake: the euros and the cents multiplied apart, and the cents kept as they come out (3 × 1,45 € = 3,135 → 3,35 €)
    const apart = n * Math.floor(p / 100) * 100 + (n * (p % 100)) % 100;
    const say = x => `${n} × ${eur(p)} = ${eur(x)}.`, wrong = [apart !== t ? apart : t + 50, t - 5 * n];
    return { scene: stall([it(k, p, 'cada un')]), real: say(t), says: say(bad ? wrong[0] : t), opts: shuffle([t, ...wrong].map(say), rnd) };
  },
  kilo(bad, rnd) {
    const k = pickOf(KILO, rnd), per = 100 * (2 + at(7, rnd)), g = pickOf([500, 250], rnd), t = per * g / 1000;
    const say = x => `${gr(g)} de ${KG[k].replace(/^(les|els|el|la) /, '')} a ${eur(per)} el kg costen ${eur(x)}.`, wrong = [per, g === 500 ? per / 4 : per / 2];
    return { scene: stall([it(k, per, 'el kg')]), real: say(t), says: say(bad ? wrong[0] : t), opts: shuffle([t, ...wrong].map(say), rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}

// The claims of circle 3, the mistakes made with how money works: the costs forgotten in the profit, a withdrawal added to the balance,
// the interest of 1 € in 10 € taken as 1 € in 100 €, and a barter added instead of multiplied. A sheet with them, once circle 3 is open
// (sheetWide), has one of these and two of the others
const CLAIM3 = {
  profit(bad, rnd) {
    const n = 10 + at(11, rnd), each = pickOf([50, 50, 60, 75, 100], rnd), inc = n * each, cost = 100 * (1 + at(Math.max(1, Math.floor(inc / 100) - 2), rnd)), t = inc - cost;
    const say = x => `Si vens ${n} gots a ${eur(each)} i has gastat ${eur(cost)}, guanyes ${eur(x)}.`, wrong = [inc, t + 100];
    return { scene: ledger([['Vendes', '🥤', inc], ['Ingredients', '🍋', -cost]], { title: SHOP }), real: say(t), says: say(bad ? wrong[0] : t), opts: shuffle([t, ...wrong].map(say), rnd) };
  },
  balance(bad, rnd) {
    const start = 100 * (10 + at(21, rnd)), a = 100 * (2 + at(9, rnd)), b = 50 * (3 + at(12, rnd)), t = start + a - b;
    const say = x => `Tenies ${eur(start)} al compte, n'hi has ingressat ${eur(a)} i n'has tret ${eur(b)}: ara hi tens ${eur(x)}.`, wrong = [start + a + b, t - 100];
    return { scene: ledger([['Ingrés', '💶', a], ['Caixer', '🏧', -b]], { title: BOOK, start }), real: say(t), says: say(bad ? wrong[0] : t), opts: shuffle([t, ...wrong].map(say), rnd) };
  },
  interest(bad, rnd) {
    const c = 1000 * (2 + at(9, rnd)), t = interest(c);
    const say = x => `Amb ${eur(c)} al banc tot un any, el banc de l'estany et dona ${eur(x)} d'interès.`, wrong = [c / 100, t * 10];
    return { scene: null, real: say(t), says: say(bad ? wrong[0] : t), opts: shuffle([t, ...wrong].map(say), rnd) };
  },
  barter(bad, rnd) {
    const k = 2 + at(4, rnd), n = 2 + at(5, rnd), t = n * k;
    const say = x => `Si un pa val ${k} pomes, ${n} pans valen ${x} pomes.`, wrong = [n + k, t - k];
    return { scene: trade([['pa', k, 'poma']]), real: say(t), says: say(bad ? wrong[0] : t), opts: shuffle([t, ...wrong].map(say), rnd) };
  }
};
const KINDS3 = Object.keys(CLAIM3);
// A sheet once circle 3 is open: three claims of three different kinds, one of them of circle 3; from 0 to 2 wrong
export function sheetWide(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  const kinds = shuffle([[CLAIM3, pickOf(KINDS3, rnd)], ...shuffle(KINDS.slice(), rnd).slice(0, 2).map(k => [CLAIM, k])], rnd);
  return kinds.map(([C, kind], i) => ({ kind, ...C[kind](bads.has(i), rnd) }));
}
