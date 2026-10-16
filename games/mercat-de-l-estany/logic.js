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
  pastis: thing('🎂', 'Pastís', 'un pastís'), peix: thing('🐟', 'Peix', 'el peix'), mobil: thing('📱', 'Mòbil', 'un mòbil')
};
// the thing does it, or they do: «una pilota costa», «uns patins costen»
const pl = k => /^(uns|unes|les|els) /.test(F[k].the);
const verb = (k, one, many) => pl(k) ? many : one;
// what is sold by the kilo or in offers, with its article in the plural
const KG = { poma: 'les pomes', taronja: 'les taronges', platan: 'els plàtans', cireres: 'les cireres', formatge: 'el formatge', maduixes: 'les maduixes', pernil: 'el pernil',
  patates: 'les patates', tomaquet: 'els tomàquets', iogurt: 'els iogurts', suc: 'els sucs', gelat: 'els gelats' };
// the animals of the pond that come to the stall when the child is the shopkeeper
const WHO = [['🐢', 'La tortuga'], ['🦆', "L'ànec"], ['🐌', 'El cargol'], ['🦔', "L'eriçó"], ['🐿️', "L'esquirol"], ['🦉', "L'òliba"], ['🐇', 'El conill']];
// an item with its price (p, in cents) and what the price is for (u: «el kg», «cada un»...)
const it = (k, p, u = '') => ({ ...F[k], p, u });
const cap = s => s[0].toUpperCase() + s.slice(1);

/* ---------- the scenes: what is drawn over a question ---------- */
// coins: coins and notes on the counter (big: a single one, large) · stall: the stall with its things and price tags · receipt: a
// receipt (lines [{ e, n, q, p, sub }], total, paid) · purses: two purses, A and B · offers: two offers, A and B · dial: the scales of
// the stall with a needle · crate: a crate of fruit in rows and columns · piggy: the piggy bank of the frog
const coins = (cs, o = {}) => ({ s: 'coins', coins: cs, ...o });
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
function pay(c, purse, o = {}) {
  const den = purse.filter(([, n]) => n > 0).map(([v]) => v), best = fewest(c, den), items = o.items || [];
  const text = o.text || (items.length ? `Paga ${items.map(x => x.the).join(' i ')}${o.min ? ', amb les menys monedes possibles' : ''}.` : `Paga ${eur(c)}${o.min ? ' amb les menys monedes possibles' : ''}.`);
  const hint = o.min ? `Comença pel bitllet o la moneda més gran que no passi de ${eur(c)}, i continua amb el que falta.${best ? ` Es pot fer amb ${best.length}.` : ''}`
    : purse.some(([, n]) => Number.isFinite(n)) ? 'Només pots fer servir el que hi ha al moneder. Prova primer amb les monedes grans i mira què et falta.'
      : items.length > 1 ? `Primer suma els preus: ${items.map(x => eur(x.p)).join(' + ')} = ${eur(c)}. Després paga.` : `Posa primer les monedes grans, i quan t'hi acostis, les petites. Has d'arribar a ${eur(c)}.`;
  return R(null, Q('pay', text, c, hint, `${items.length > 1 ? `${items.map(x => eur(x.p)).join(' + ')} = ${eur(c)}. ` : ''}${(best || []).map(short).join(' + ')} = ${eur(c)}.`,
    { purse, target: c, min: o.min && best ? best.length : 0, items }));
}
const item = (k, p, u) => it(k, p, u);
// the limited purse: { value: how many }
const lim = (c, m, o = {}) => pay(c, Object.entries(m).map(([v, n]) => [+v, n]).sort((a, b) => b[0] - a[0]), o);
// the next whole euro after p, the first step of counting up
const up = p => Math.ceil(p / 100) * 100;
const countUp = (p, paid) => up(p) === p || up(p) >= paid ? `Resta: ${eur(paid)} − ${eur(p)}.` : `Compta endavant: de ${eur(p)} a ${eur(up(p))} hi ha ${short(up(p) - p)}, i de ${eur(up(p))} a ${eur(paid)}, ${short(paid - up(p))}. Suma-ho.`;
// the change of p paid with paid: typed, or given with the coins of the till (tokens) by the child, the shopkeeper
function change(p, paid, k, o = {}) {
  const T = F[k], [e, who] = WHO[o.w || 0], c = paid - p;
  if (!o.till) return money(`${cap(T.the)} ${verb(k, 'costa', 'costen')} ${eur(p)}. Pagues amb ${isBill(paid) ? 'un bitllet de ' : ''}${valName(paid)}. {?} et tornen?`, c, countUp(p, paid),
    `${eur(paid)} − ${eur(p)} = ${c < 100 ? c + ' cèntims' : eur(c)}.`, stall([it(k, p)]));
  const best = fewest(c, o.till.map(([v]) => v));
  return R(null, Q('pay', `${who} compra ${T.the} ${de(eur(p))} i et paga amb ${isBill(paid) ? 'un bitllet de ' : ''}${valName(paid)}. Torna-li el canvi${o.min ? ' amb les menys monedes possibles' : ''}.`, c,
    countUp(p, paid) + (o.min && best ? ` Es pot tornar amb ${best.length} peces.` : ''), `${eur(paid)} − ${eur(p)} = ${eur(c)}: ${(best || []).map(short).join(' + ')}.`,
    { purse: o.till, target: c, min: o.min && best ? best.length : 0, change: true, who: [e, who], items: [it(k, p)], paid }));
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
  { name: 'El mercader savi', projects: [6, 7, 8] }
];
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, examIn, sheetIn, rapidIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: a coin to read, a price to pay and a stall to read
export const POOL = [value(50), pay(70, PC, { items: [item('poma', 70)] }),
  Tp('Quina és la cosa més cara de la parada? Toca-la.', [2], 'Mira les etiquetes i busca el preu més gran.', 'La síndria: 3,40 €.', stall([it('pera', 65), it('pa', 120), it('sindria', 340), it('llet', 95)]))];

// What is saved is facts only: { so, stars[90], piscina, exams[3], fulls, rapid } (rapid: the best rush hour, in customers served). Marks, XP, level and badges are worked out, never stored.
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
  { name: 'Mercader savi', what: 'Supera els tres exàmens.' },
  { name: 'Hora punta', what: 'Atén 10 clients en una hora punta.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, p.exams.every(e => e === true), p.rapid >= 10];

/* ---------- the rush hour: customers in a queue, the change against the clock ---------- */
// The k-th customer of a rush: an animal of the pond buys a thing and pays with a note; the child gives the change with the till.
// The first ones pay a price of whole tens of cents with 1 € or 2 €; then notes of 5, 10 and 20 €, and prices of any 5 cents
export const RUSH_SECS = 90;
export function customer(k, rnd) {
  const paid = k < 3 ? pickOf([100, 200], rnd) : k < 7 ? pickOf([200, 500], rnd) : pickOf([500, 1000, 2000], rnd);
  const step = k < 5 ? 10 : 5, p = paid - step * (1 + at(Math.min(paid, k < 7 ? 500 : 2000) / step - 2, rnd));
  const [e, who] = WHO[at(WHO.length, rnd)], key = pickOf(FOOD.concat(['cromos', 'gelat', 'poma', 'pera']), rnd);
  return { who: [e, who], item: it(key, p), paid, change: paid - p, min: fewest(paid - p, PB.map(([v]) => v)).length };
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
