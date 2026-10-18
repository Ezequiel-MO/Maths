import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the odometer of the pond, with no page in it. The frog goes on a trip by car, and the six wheels of its
// odometer go up to 999.999: the child reads and writes big numbers, puts the point of the thousands, compares, orders, places them on
// the road, rolls the wheels and rounds. Every answer is worked out here from the numbers of its question, so a picture and its answer
// never disagree. It must keep importing from Node.

/* ---------- numbers and words ---------- */
// 4500 → «4.500», 756352 → «756.352», 999 → «999»: the point of the thousands, from 4 digits on
export const punt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const U = ['zero', 'u', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou', 'deu', 'onze', 'dotze', 'tretze', 'catorze', 'quinze', 'setze', 'disset', 'divuit', 'dinou'];
const D = ['', '', 'vint', 'trenta', 'quaranta', 'cinquanta', 'seixanta', 'setanta', 'vuitanta', 'noranta'];
// under 100; un is «un» instead of «u», before «mil» (vint-i-un mil)
function sub100(n, un) {
  if (n < 20) return n === 1 && un ? 'un' : U[n];
  const d = Math.floor(n / 10), u = n % 10, uu = u === 1 && un ? 'un' : U[u];
  return !u ? D[d] : d === 2 ? `vint-i-${uu}` : `${D[d]}-${uu}`;
}
function sub1000(n, un) {
  const c = Math.floor(n / 100), r = n % 100, cc = c === 0 ? '' : c === 1 ? 'cent' : `${U[c]}-cents`;
  return !r ? cc : (cc ? cc + ' ' : '') + sub100(r, un);
}
// a number from 0 to 999.999 in words, as a masculine noun follows it: 304020 → «tres-cents quatre mil vint»
export function lletres(n) {
  if (n === 0) return 'zero';
  const m = Math.floor(n / 1000), r = n % 1000, mm = m === 0 ? '' : m === 1 ? 'mil' : `${sub1000(m, true)} mil`;
  return [mm, r ? sub1000(r, false) : ''].filter(Boolean).join(' ');
}
// the places, from the units (0) to the hundreds of thousands (5), and their colour (the same as the rods of the abacus)
export const PLACES = ['unitats', 'desenes', 'centenes', 'unitats de miler', 'desenes de miler', 'centenes de miler'];
const ONE = ['unitat', 'desena', 'centena', 'unitat de miler', 'desena de miler', 'centena de miler'];
export const SHORT = ['U', 'D', 'C', 'UM', 'DM', 'CM'];
export const HUES = [150, 190, 258, 325, 28, 52];
export const THE = ['les unitats', 'les desenes', 'les centenes', 'les unitats de miler', 'les desenes de miler', 'les centenes de miler'];
export const dig = (n, p) => Math.floor(n / 10 ** p) % 10;
const len = n => String(n).length;
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
const cap = s => s[0].toUpperCase() + s.slice(1);
// «4 unitats de miler i 5 centenes»: the places that are not zero
const parts = n => [5, 4, 3, 2, 1, 0].filter(p => dig(n, p)).map(p => `${dig(n, p)} ${dig(n, p) === 1 ? ONE[p] : PLACES[p]}`);
export const partsText = n => n ? list(parts(n)) : 'zero';
// what to round to: «el miler», «la desena de miler», «la centena de miler»
const TO = { 3: 'al miler', 4: 'a la desena de miler', 5: 'a la centena de miler' };
const ROUND_NAME = { 3: 'miler', 4: 'desena de miler', 5: 'centena de miler' };
export const roundTo = (n, p) => Math.floor(n / 10 ** p + 0.5) * 10 ** p;
// how many wheels of the odometer change from a to b
export const changed = (a, b) => [0, 1, 2, 3, 4, 5].filter(p => dig(a, p) !== dig(b, p)).length;

// Other numbers a child takes this one for: a zero dropped or added, two digits swapped, ten times more or less, a digit gone.
// The first ones are the likeliest mistakes; all are between 1 and 999.999 and different from n
export function variants(n) {
  const s = String(n), out = [];
  const add = t => { const v = +t; if (t[0] !== '0' && v !== n && v > 0 && v < 1e6 && !out.includes(v)) out.push(v); };
  for (let i = 1; i < s.length; i++) if (s[i] === '0' && s[i - 1] !== '0') add(s.slice(0, i) + s.slice(i + 1));
  for (let i = 0; i < s.length - 1; i++) if (s[i] !== s[i + 1]) { add(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2)); break; }
  add(s + '0'); if (s.endsWith('0')) add(s.slice(0, -1));
  add(s[0] + '0' + s.slice(1));
  for (let i = s.length - 2; i >= 0; i--) if (s[i] !== s[i + 1]) { add(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2)); break; }
  for (let p = 0; p < s.length; p++) add(String(n - dig(n, p) * 10 ** p));
  add(s.slice(1)); add(String(n + 10 ** (s.length - 1)));
  return out;
}

/* ---------- the scenes: what is drawn over a question ---------- */
// odo: the dashboard of the car, its odometer at n (to: where it rolls once the answer is right; hl: a place lit by the hint; taps: its
// wheels can be touched) · cars: cars side by side, each with the km it has done · tiles: the digits of a number on tiles (gaps: the
// point can go between them; mark: one digit lit) · cmp: two numbers face to face (aw: the first one in words) · line: the road as a
// number line, from from in n steps of step (lab: which marks have their number; frog: the car on a mark; at: the car anywhere; mid: the
// half marked; only: the marks that can be touched) · cards: cards to put in order (d: a digit card) · chips: the tokens of each place
// · thing: a big picture with its number · lcd: the screen of an arcade machine · sign: a road sign · posts: the stones along the road,
// one of them a ? (null) · words: a board with a number in words
const odo = (n, o = {}) => ({ s: 'odo', n, ...o });
const tiles = (n, o = {}) => ({ s: 'tiles', d: String(n), ...o });
const line = (from, step, n, o = {}) => ({ s: 'line', from, step, n, lab: 'ends', ...o });
const thing = (e, cap, n, unit = '') => ({ s: 'thing', e, cap, n, unit });

/* ---------- the questions ---------- */
// A question: text, and how it is answered: 'num' (a number typed, with the point of the thousands: ans the number), 'pick' (one of
// opts; ans the right one; fixed keeps their order), 'tap' (a thing of the scene: ans its keys), 'order' (every card of the scene in
// order: ans the keys in that order), 'wheels' (the wheels of the odometer turned until they show ans, from start). hint is what the
// frog says when asked or after a slip, and say what it says when the answer is right.
const Q = (type, text, ans, hint, say, o = {}) => ({ type, text, ans, hint, say, ...o });
const R = (scene, q) => ({ scene, q });
const lv = (title, say, rounds) => ({ title, say, rounds });
const N = (text, n, hint, say, scene = null, unit = '') => R(scene, Q('num', text, n, hint, say, { unit }));
const Pk = (text, opts, hint, say, scene = null) => R(scene, Q('pick', text, opts[0], hint, say, { opts }));
const Tp = (text, keys, hint, say, scene) => R(scene, Q('tap', text, keys.map(String), hint, say));

// the wheels: turn them until they show n (in figures, or in words with w)
function wheels(n, w = false, start = 0) {
  return R(odo(start, { spin: true, goal: n }), Q('wheels', w ? `Gira les rodes fins que marquin «${lletres(n)}».` : `Gira les rodes fins que marquin ${punt(n)}.`, n,
    `La roda de més a la dreta són les unitats. ${punt(n)} són ${partsText(n)}: gira cada roda fins a la seva xifra.`, `${punt(n)}: ${partsText(n)}.`, { start }));
}
// where the point goes: on a gap between the tiles, or nowhere
function dot(n) {
  const k = len(n) - 3;
  return R(tiles(n, { gaps: true }), Q('tap', 'On va el punt dels milers? Toca el lloc.', [k > 0 ? 'g' + k : 'none'],
    k > 0 ? 'Compta tres xifres des de la dreta: el punt va just abans d\'aquestes tres.' : 'Compta les xifres. Amb tres xifres o menys no hi ha milers, i no hi ha punt.',
    k > 0 ? `${punt(n)}: sempre tres xifres després del punt.` : `${n} només té ${len(n)} xifr${len(n) === 1 ? 'a' : 'es'}: no porta punt.`));
}
const readHint = n => {
  if (n < 1000) return 'Llegeix les centenes, després les desenes i les unitats.';
  const m = Math.floor(n / 1000), r = n % 1000;
  return `Abans del punt hi ha ${m}: es llegeix «${lletres(m * 1000)}». ${r ? `Després del punt hi ha ${String(r).padStart(3, '0')}: «${lletres(r)}».` : 'Després del punt tot són zeros: no es diu res més.'}`;
};
// how it is read: four ways in words
function read(n, sc = null) {
  return Pk('Com es llegeix aquest número?', [lletres(n), ...variants(n).slice(0, 3).map(lletres)], readHint(n), `${punt(n)} es llegeix «${lletres(n)}».`, sc || odo(n));
}
const writeHint = n => {
  if (n < 1000) return 'Escriu les centenes, les desenes i les unitats. Si en falta alguna, hi va un 0.';
  const m = Math.floor(n / 1000), r = n % 1000;
  return `El que va abans de «mil» va abans del punt: ${m}. Després del punt sempre hi ha tres xifres: ${String(r).padStart(3, '0')}${r < 100 ? ' (amb zeros al davant)' : ''}.`;
};
// a number in words, to write in figures
const write = (n, unit = '') => N('Escriu-ho amb xifres, amb el punt dels milers.', n, writeHint(n), `«${lletres(n)}» = ${punt(n)}.`, { s: 'words', t: lletres(n), unit }, unit);
// what a digit is worth: the digit of place p is lit
function value(n, p) {
  const d = dig(n, p), qs = [p, p - 1, p + 1, p - 2, p + 2, p - 3, p + 3].filter(q => q >= 0 && q <= 5 && d * 10 ** q < 1e6).slice(0, 4);
  return Pk(`Què val el ${d} que brilla?`, qs.map(q => punt(d * 10 ** q)), `Compta les xifres que té a la dreta: cada una és un zero més darrere del ${d}.`,
    `És a ${THE[p]}: val ${punt(d * 10 ** p)}.`, tiles(n, { mark: len(n) - 1 - p }));
}
// which digit is in place p
const digitAt = (n, p) => N(`Quina xifra hi ha a ${THE[p]}?`, dig(n, p), `Compta les rodes des de la dreta: ${SHORT.slice(0, p + 1).join(', ')}.`,
  `${punt(n)}: a ${THE[p]} hi ha un ${dig(n, p)}.`, odo(n, { hl: p }));
// the tokens of each place: what number they make
function compose(ps) {
  const n = ps.reduce((s, [p, c]) => s + c * 10 ** p, 0);
  return N('Quin número fan aquestes fitxes?', n, 'Compta les fitxes de cada color i posa cada número a la seva columna. On no hi ha fitxes, hi va un 0.',
    `${list(ps.map(([p, c]) => `${c} ${c === 1 ? ONE[p] : PLACES[p]}`))}: ${punt(n)}.`, { s: 'chips', parts: ps });
}
// a number in pieces: 40.000 + 5.000 + 300 + 20 + 1
function expand(n) {
  const ts = [5, 4, 3, 2, 1, 0].filter(p => dig(n, p)).map(p => punt(dig(n, p) * 10 ** p));
  return N(`Quin número és ${ts.join(' + ')}?`, n, 'Cada tros va a la seva columna. Si a una columna no hi ha res, hi va un 0.', `${ts.join(' + ')} = ${punt(n)}.`, { s: 'chips', parts: [5, 4, 3, 2, 1, 0].filter(p => dig(n, p)).map(p => [p, dig(n, p)]) });
}
// a piece missing: 63.040 = 60.000 + ? + 40
function missing(n, p) {
  const ts = [5, 4, 3, 2, 1, 0].filter(q => dig(n, q)).map(q => q === p ? '?' : punt(dig(n, q) * 10 ** q));
  return N(`${punt(n)} = ${ts.join(' + ')}. Quant val el ?`, dig(n, p) * 10 ** p, `Busca quina xifra no hi és: la de ${THE[p]}.`, `${punt(n)} = ${ts.join(' + ').replace('?', punt(dig(n, p) * 10 ** p))}.`, tiles(n, { mark: len(n) - 1 - p }));
}
const cmpHint = (a, b) => len(a) !== len(b) ? 'Compta les xifres de cada número: el que en té més és més gran.'
  : 'Tenen les mateixes xifres. Compara d\'esquerra a dreta, fins que una xifra sigui diferent.';
const HUE_CARS = [355, 205, 48];
// which car has done more km (or fewer, with less)
function cars(ns, less = false) {
  const best = less ? Math.min(...ns) : Math.max(...ns), ks = 'abc';
  return Tp(`Quin cotxe ha fet ${less ? 'menys' : 'més'} quilòmetres? Toca'l.`, [ks[ns.indexOf(best)]], ns.length === 2 ? cmpHint(ns[0], ns[1]) : 'Compta les xifres de cada un. Si en tenen les mateixes, compara d\'esquerra a dreta.',
    `${punt(best)} km és ${less ? 'el que menys' : 'el que més'}.`, { s: 'cars', cars: ns.map((n, i) => ({ k: ks[i], n, h: HUE_CARS[i] })) });
}
// the sign between two numbers (aw: the first one in words)
function sign(a, b, aw = false) {
  const s = a > b ? '>' : a < b ? '<' : '=';
  return R({ s: 'cmp', a, b, aw }, Q('pick', `Quin signe hi va al mig?`, s, `${aw ? `Primer escriu-lo amb xifres: «${lletres(a)}» = ${punt(a)}. ` : ''}${a === b ? 'Mira-les xifra a xifra.' : cmpHint(a, b)} La boca oberta del signe mira el més gran.`,
    `${punt(a)} ${s} ${punt(b)}${s === '=' ? ': són iguals' : s === '>' ? `: ${punt(a)} és més gran` : `: ${punt(a)} és més petit`}.`, { opts: ['<', '=', '>'], fixed: true }));
}
// cards in order (desc: from the biggest); items { n, e, cap, unit }
function order(items, desc = false, text = '') {
  items = items.map((x, i) => typeof x === 'number' ? { k: String(i), n: x } : { k: String(i), ...x });
  const keys = items.slice().sort((x, y) => desc ? y.n - x.n : x.n - y.n);
  return R({ s: 'cards', items }, Q('order', text || `Toca'ls ${desc ? 'del més gran al més petit' : 'del més petit al més gran'}.`, keys.map(x => x.k),
    'Primer mira quantes xifres té cada un: els de menys xifres són els més petits. Si en tenen les mateixes, compara d\'esquerra a dreta.',
    `${keys.map(x => punt(x.n)).join(desc ? ' > ' : ' < ')}.`));
}
// the biggest number made with these digit cards: tap them from the first one
function biggest(ds) {
  const items = ds.map((d, i) => ({ k: String(i), d, n: d })), keys = items.slice().sort((x, y) => y.d - x.d), n = +keys.map(x => x.d).join('');
  return R({ s: 'cards', items, digits: true }, Q('order', 'Fes el número més gran que puguis: toca les xifres, de la primera a l\'última.', keys.map(x => x.k),
    'Al davant hi va la xifra més gran, que és la que val més. Després la següent més gran, i així fins al final.', `El més gran és ${punt(n)}.`));
}
// the smallest one, which cannot start with 0, typed
function smallest(ds) {
  const s = ds.slice().sort((a, b) => a - b), f = s.findIndex(d => d > 0), first = s.splice(f, 1)[0], n = +[first, ...s].join('');
  return N('Quin és el número més petit que pots fer amb totes aquestes xifres?', n, `Al davant hi va la xifra més petita${ds.includes(0) ? ', però no pot ser el 0: un número no comença mai per 0' : ''}. Després, les altres de petita a gran.`,
    `El més petit és ${punt(n)}.`, { s: 'cards', items: ds.map((d, i) => ({ k: String(i), d, n: d })), digits: true });
}
// the road as a number line: tap where t goes; the number the car is on; the mark next to a number
const lineHint = (from, step) => `Les marques van de ${punt(step)} en ${punt(step)}. Compta-les des de ${punt(from)}.`;
const lineTap = (from, step, n, t, lab = 'ends') => Tp(`Toca on va el ${punt(t)}.`, ['t' + (t - from) / step], lineHint(from, step), `El ${punt(t)} és aquí.`, line(from, step, n, { lab }));
const lineRead = (from, step, n, i, lab = 'ends') => N('Quin número marca el cotxe?', from + i * step, lineHint(from, step), `El cotxe és al ${punt(from + i * step)}.`, line(from, step, n, { lab, frog: i }));
const lineNear = (from, step, n, v) => Tp(`On aniria el ${punt(v)}? Toca la marca més propera.`, ['t' + Math.round((v - from) / step)], `${lineHint(from, step)} Busca entre quines dues marques cau i quina queda més a prop.`,
  `${punt(v)} és molt a prop del ${punt(from + Math.round((v - from) / step) * step)}.`, line(from, step, n, { lab: 'ends' }));
// just after and just before
const next = n => N(`Quin número va just després del ${punt(n)}?`, n + 1, 'Suma 1 a la roda de les unitats. Si passa de 9 a 0, la roda del costat avança una.', `${punt(n)} + 1 = ${punt(n + 1)}.`, odo(n, { to: n + 1, add: [0, 1] }));
const prev = n => N(`Quin número va just abans del ${punt(n)}?`, n - 1, 'Resta 1 a les unitats. Si són 0, passen a 9 i la roda del costat baixa una.', `${punt(n)} − 1 = ${punt(n - 1)}.`, odo(n, { to: n - 1, add: [0, -1] }));
// the stones along the road, one missing
function series(ns) {
  const i = ns.indexOf(null), known = ns.map((x, j) => [x, j]).filter(([x]) => x !== null), st = (known[1][0] - known[0][0]) / (known[1][1] - known[0][1]), v = known[0][0] + (i - known[0][1]) * st;
  return N('Quin número hi ha a la fita del ?', v, `De fita a fita hi ha ${st > 0 ? '' : '−'}${punt(Math.abs(st))}. ${st > 0 ? 'Suma' : 'Resta'}-ho a la fita d'abans.`,
    `${ns.map(x => x === null ? punt(v) : punt(x)).join(', ')}.`, { s: 'posts', nums: ns, step: st });
}
// the odometer rolls on k km (or back with a minus)
const placeOf = k => len(Math.abs(k)) - 1;
function plus(n, k, sc = null) {
  const back = k < 0, a = Math.abs(k), p = placeOf(a);
  return N(back ? `El comptaquilòmetres marca ${punt(n)}. Què marcava fa ${punt(a)} km?` : `El comptaquilòmetres marca ${punt(n)}. Què marcarà quan el cotxe faci ${punt(a)} km més?`, n + k,
    `${back ? 'Restar' : 'Sumar'} ${punt(a)} mou la roda de ${THE[p]}. Si ${back ? 'és 0 i ha de baixar, passa a 9 i la del costat baixa' : 'passa de 9 a 0, la del costat també avança'} una.`,
    `${punt(n)} ${back ? '−' : '+'} ${punt(a)} = ${punt(n + k)}.`, sc || odo(n, { to: n + k, add: [p, back ? -1 : 1] }), 'km');
}
// the wheel that turns when k is added (with no carry)
const wheelTap = (n, k) => Tp(`Si el cotxe fa ${punt(k)} km més, quina roda girarà? Toca-la.`, ['w' + placeOf(k)], `${punt(k)} és 1 ${ONE[placeOf(k)]}.`,
  `Gira la roda de ${THE[placeOf(k)]}: ${punt(n)} + ${punt(k)} = ${punt(n + k)}.`, odo(n, { taps: true, to: n + k }));
// how many wheels change when 1 is added
const howMany = (n, k = 1) => N(`El cotxe fa ${punt(k)} km més. Quantes rodes canvien de número?`, changed(n, n + k), 'Les rodes que passen de 9 a 0 canvien, i la del seu costat també.',
  `${punt(n)} → ${punt(n + k)}: canvien ${changed(n, n + k)} rodes.`, odo(n, { to: n + k, add: [placeOf(k), 1] }), 'rodes');
// rounding: tap the closer end, or write the round number
function roundScene(n, p) { const lo = Math.floor(n / 10 ** p) * 10 ** p; return line(lo, 10 ** p / 10, 10, { lab: 'ends', at: n, mid: true, only: [0, 10] }); }
const roundHint = p => `Mira la xifra de ${THE[p - 1]}: si és 5 o més, puja; si és menys de 5, baixa.`;
function roundTap(n, p) {
  const r = roundTo(n, p), lo = Math.floor(n / 10 ** p) * 10 ** p;
  return Tp(`A quin ${ROUND_NAME[p]} està més a prop el ${punt(n)}? Toca'l.`, [r === lo ? 't0' : 't10'], `La marca del mig és la meitat. ${roundHint(p)}`, `${punt(n)} és més a prop del ${punt(r)}.`, roundScene(n, p));
}
const roundN = (n, p, sc = null, text = '') => N(text || `Arrodoneix ${punt(n)} ${TO[p]}.`, roundTo(n, p), roundHint(p), `${punt(n)} → ${punt(roundTo(n, p))}.`, sc || roundScene(n, p));
const sense = (text, opts, hint, say, sc = null) => Pk(text, opts, hint, say, sc);

/* ---------- the projects ---------- */
export const PROJECTS = [
  { name: 'Els milers', sub: 'Fins al 9.999: el punt dels milers', ico: '🔢', levels: [
    lv('Les rodes', 'Això és el comptaquilòmetres del cotxe: diu quants quilòmetres ha fet. Cada roda és una xifra. Toca les fletxes per girar-les!', [wheels(7), wheels(35), wheels(208)]),
    lv('El punt dels milers', 'Els números de 4 xifres o més porten un punt que separa els milers. Es posa comptant tres xifres des de la dreta.', [dot(1000), dot(4500), dot(350), dot(7205)]),
    lv('Del 999 al 1.000', 'Quan la roda de les unitats passa de 9 a 0, la del costat avança. Al teclat hi ha la tecla del punt: fes-la servir!', [next(9), next(99), next(999), wheels(1000)]),
    lv('Llegeix els milers', 'Primer es llegeix el que hi ha abans del punt, i es diu «mil». Després, el que hi ha després del punt.', [read(4500), read(1200), read(7080)]),
    lv('Escriu els milers', 'El que va abans de «mil» va abans del punt. Després del punt hi ha sempre tres xifres.', [write(3200), write(1050), write(6000), write(2500)]),
    lv('Gira les rodes', 'Ara el número te\'l dic amb paraules. Gira cada roda fins a la seva xifra.', [wheels(1250), wheels(4500, true), wheels(6007, true)]),
    lv('Què val cada xifra', 'Una xifra val més com més a l\'esquerra és: el 4 de 4.528 val 4.000!', [value(4528, 3), value(4528, 1), value(3916, 2), digitAt(3916, 3)]),
    lv('Les fitxes', 'Cada fitxa d\'un color val 1, 10, 100 o 1.000. Ajunta-les i fes el número.', [compose([[3, 3], [2, 4], [0, 5]]), compose([[3, 7], [1, 2]]), expand(5362)]),
    lv('Zeros amagats', 'Compte amb els zeros! «Cinc mil vuit» porta zeros on no hi ha res: 5.008.', [write(5008), write(2030), read(6060), dot(9009)]),
    lv('Repte dels milers', 'Tot el que has après dels milers: llegir, escriure, el punt i les rodes.', [read(8040), write(9909), value(7381, 3), wheels(3075, true)])
  ] },
  { name: 'Fins a 99.999', sub: 'Les desenes de miler: cinc xifres', ico: '🚙', levels: [
    lv('Una roda més', 'Quan el comptaquilòmetres passa del 9.999, es posa en marxa una roda nova: la de les desenes de miler.', [next(9999), wheels(10000), wheels(25000)]),
    lv('Posa el punt', 'Amb cinc xifres, el punt també va a tres xifres de la dreta: 12.500.', [dot(12500), dot(45000), dot(860), dot(99999)]),
    lv('Llegeix', 'Abans del punt hi ha un número de dues xifres: «vint-i-cinc mil».', [read(25000), read(18400), read(60075)]),
    lv('Escriu', 'Recorda: després del punt, sempre tres xifres.', [write(15000), write(23400), write(70007)]),
    lv('Gira les rodes', 'Un número de cinc xifres: la roda de l\'esquerra de tot es queda a 0. Comença per on vulguis!', [wheels(24680), wheels(50505, true), wheels(31200, true)]),
    lv('Què val cada xifra', 'Les desenes de miler valen deu mil cada una.', [value(47385, 4), value(47385, 3), digitAt(58213, 4), value(47385, 2)]),
    lv('Les fitxes', 'Ara hi ha fitxes de 10.000. Compta cada color.', [compose([[4, 4], [3, 5], [2, 3], [1, 2], [0, 1]]), compose([[4, 6], [1, 3]]), missing(63040, 3)]),
    lv('Zeros amagats', '«Quaranta mil cinc-cents set»: on no hi ha res, hi va un zero.', [write(30030), write(40507), read(10010), dot(10010)]),
    lv('Fins al 99.999', 'Just després i just abans: les rodes que passen per 9 o per 0 arrosseguen les del costat.', [next(19999), prev(50000), next(99998), prev(10000)]),
    lv('Repte de les cinc rodes', 'Tot barrejat, fins al 99.999.', [read(72318), write(56090), value(90909, 4), wheels(84000, true)])
  ] },
  { name: 'Fins a 999.999', sub: 'Les centenes de miler: les sis rodes', ico: '🏎️', levels: [
    lv('Les sis rodes', 'Ara es mouen les sis rodes! La de l\'esquerra de tot són les centenes de miler.', [next(99999), wheels(100000), wheels(250000)]),
    lv('Posa el punt', 'Sis xifres: tres abans del punt i tres després.', [dot(756352), dot(100000), dot(405060), dot(4050)]),
    lv('Llegeix', 'Abans del punt hi pot haver un número de tres xifres: «tres-cents vuitanta-quatre mil».', [read(384400, thing('🌕', 'De la Terra a la Lluna', 384400, 'km')), read(120500), read(706030)]),
    lv('Escriu', 'El que va abans de «mil», abans del punt. Tres xifres després.', [write(100000), write(250000), write(304020)]),
    lv('Gira les rodes', 'Sis rodes. Escolta bé el número!', [wheels(384400, true), wheels(507090, true), wheels(999999)]),
    lv('Què val cada xifra', 'La xifra de l\'esquerra de tot val centenars de milers.', [value(756352, 5), value(756352, 4), value(756352, 3), digitAt(482917, 5)]),
    lv('Les fitxes', 'Ja hi ha fitxes de 100.000. Les columnes buides porten un 0.', [compose([[5, 4], [4, 3], [2, 2]]), compose([[5, 2], [3, 5], [0, 8]]), expand(645209)]),
    lv('Descompon', 'Un número gran és una suma de trossos: cada xifra amb els seus zeros.', [missing(645209, 3), missing(830450, 4), missing(907060, 1)]),
    lv('Zeros amagats', 'Els números amb molts zeros són els més traïdors.', [write(500005), write(90900), write(900090), read(101010)]),
    lv('Repte de les sis rodes', 'Ja ho saps tot de les sis rodes!', [read(999999), write(640308), value(318402, 5), dot(318402), wheels(205750, true)])
  ] },
  { name: 'Qui ha fet més km?', sub: 'Comparar números grans', ico: '🏁', levels: [
    lv('Més xifres, més gran', 'Per comparar, primer compta les xifres: el número que en té més és el més gran.', [cars([9800, 12000]), cars([45000, 8999]), cars([120000, 99999])]),
    lv('Les mateixes xifres', 'Si tenen les mateixes xifres, compara d\'esquerra a dreta: guanya el que té la primera xifra més gran.', [cars([45300, 54300]), cars([7200, 6900]), cars([310000, 290000])]),
    lv('La primera és igual', 'Si la primera xifra és igual, mira la segona. I si també, la tercera...', [cars([72450, 72540]), cars([4080, 4800]), cars([518000, 581000])]),
    lv('Els signes', 'El signe > vol dir «més gran que», i < vol dir «més petit que». La boca oberta mira el més gran!', [sign(3500, 3050), sign(12000, 21000), sign(80000, 80000)]),
    lv('Més signes', 'Compta les xifres i compara d\'esquerra a dreta.', [sign(405000, 450000), sign(99999, 100000), sign(66600, 66060)]),
    lv('El que menys', 'Ara busca el que ha fet menys quilòmetres.', [cars([5600, 5060], true), cars([230000, 203000], true), cars([88888, 100000], true)]),
    lv('Xifres i lletres', 'Un número en lletres: primer escriu-lo al cap amb xifres, i després compara.', [sign(40050, 40050, true), sign(200000, 199999, true), sign(9900, 9090, true)]),
    lv('Tres cotxes', 'Tres cotxes a la cursa. Quin ha fet més quilòmetres?', [cars([34500, 43500, 35400]), cars([120000, 102000, 112000]), cars([9990, 10900, 9099])]),
    lv('Trampes', 'Compte: un 9 al davant no sempre guanya!', [sign(9999, 10001), sign(100000, 99999), cars([7999, 70000]), sign(65000, 6500)]),
    lv('Repte de la cursa', 'Compara-ho tot!', [cars([250500, 205500, 250050]), sign(707070, 770070), cars([99000, 100100], true), sign(123456, 123465)])
  ] },
  { name: 'Ordena', sub: 'Del més petit al més gran, i al revés', ico: '📶', levels: [
    lv('Tres números', 'Busca primer el més petit, després el del mig, i al final el més gran.', [order([3200, 2300, 3020]), order([5400, 4500, 5040])]),
    lv('Del més gran al més petit', 'Ara al revés: primer el més gran.', [order([12500, 21500, 15200], true), order([80000, 8000, 800], true)]),
    lv('Quatre números', 'Primer, els que tenen menys xifres.', [order([45000, 9999, 100000, 54000]), order([60600, 6600, 66000, 60060])]),
    lv('Ciutats', 'Quanta gent viu a cada ciutat? Són xifres aproximades.', [order([{ n: 140000, e: '🏰', cap: 'Lleida' }, { n: 105000, e: '🌉', cap: 'Girona' }, { n: 80000, e: '⛰️', cap: 'Manresa' }, { n: 37000, e: '🌋', cap: 'Olot' }].map(x => ({ ...x, unit: 'habitants' })), true, 'Toca les ciutats, de la que té més habitants a la que en té menys.')]),
    lv('Animals pesants', 'Quant pesa cada animal? Són pesos aproximats.', [order([{ n: 6000, e: '🐘', cap: 'Elefant' }, { n: 150000, e: '🐋', cap: 'Balena blava' }, { n: 1200, e: '🦒', cap: 'Girafa' }, { n: 2300, e: '🦏', cap: 'Rinoceront' }].map(x => ({ ...x, unit: 'kg' })), false, 'Toca els animals, del que pesa menys al que pesa més.')]),
    lv('El més gran', 'Per fer el número més gran, al davant hi va la xifra més gran.', [biggest([3, 7, 0, 5]), biggest([2, 9, 4, 1, 6])]),
    lv('Sis xifres', 'Sis xifres: el número més gran possible!', [biggest([5, 0, 8, 3, 1, 9]), biggest([4, 6, 2, 7, 0, 1])]),
    lv('El més petit', 'Per fer el més petit, al davant la més petita... però mai un 0!', [smallest([4, 1, 7, 3]), smallest([5, 0, 8, 2]), smallest([6, 0, 3, 9, 1])]),
    lv('Cinc números', 'Cinc números que s\'assemblen molt. Mira-te\'ls bé!', [order([250000, 205000, 520000, 52000, 250500]), order([99999, 100000, 90000, 109000, 99000], true)]),
    lv('Repte d\'ordenar', 'Ordena-ho tot!', [order([700007, 70007, 707000, 77000]), biggest([8, 0, 2, 6, 5, 3]), smallest([7, 0, 0, 4, 2])])
  ] },
  { name: 'La carretera', sub: 'Els números a la recta', ico: '🛣️', levels: [
    lv('De mil en mil', 'La carretera és una recta de números. Cada marca són 1.000 km més.', [lineTap(0, 1000, 10, 7000), lineTap(0, 1000, 10, 3000), lineRead(0, 1000, 10, 6)]),
    lv('De deu mil en deu mil', 'Ara cada marca són 10.000 km.', [lineTap(0, 10000, 10, 40000), lineRead(0, 10000, 10, 8), lineRead(0, 10000, 10, 3)]),
    lv('Un tros de carretera', 'La carretera no sempre comença al 0. Mira on comença!', [lineTap(30000, 1000, 10, 36000), lineRead(30000, 1000, 10, 4), lineRead(120000, 1000, 10, 7)]),
    lv('Just abans i just després', 'El número de just després és 1 més. El de just abans, 1 menys.', [next(39999), prev(100000), next(209999), prev(70000)]),
    lv('Salts grans', 'Marques de 50.000 en 50.000 i de 100.000 en 100.000.', [lineTap(0, 50000, 10, 350000), lineRead(0, 100000, 9, 4), lineTap(0, 100000, 9, 600000)]),
    lv('La marca més propera', 'Un número que cau entre dues marques: quina és la més propera?', [lineNear(40000, 1000, 10, 45300), lineNear(30000, 1000, 10, 37800), lineNear(200000, 10000, 10, 264000)]),
    lv('Les fites de mil', 'A la vora de la carretera hi ha fites amb els quilòmetres. Quina falta?', [series([47000, 48000, null, 50000]), series([9000, 10000, 11000, null]), series([98000, 99000, null, 101000])]),
    lv('Fites grans', 'Fites de 10.000 en 10.000 i de 100.000 en 100.000.', [series([270000, 280000, null, 300000]), series([90000, 100000, null, 120000]), series([300000, 400000, null, 600000])]),
    lv('Enrere', 'Ara tornem cap enrere: els números baixen.', [series([105000, 104000, null, 102000]), series([50000, 40000, null, 20000]), series([1000, null, 800, 700])]),
    lv('Repte de la carretera', 'Tota la carretera!', [lineTap(500000, 10000, 10, 570000), lineNear(0, 100000, 9, 680000), series([199000, 200000, null, 202000]), prev(500000)])
  ] },
  { name: 'Les rodes giren', sub: 'Sumar 1, 10, 100, 1.000...', ico: '⚙️', levels: [
    lv('Un quilòmetre més', 'Cada quilòmetre, la roda de les unitats avança una. Quan passa de 9 a 0, arrossega la del costat.', [plus(4999, 1), plus(9999, 1), plus(12399, 1)]),
    lv('Deu més', 'Sumar 10 mou la roda de les desenes.', [plus(3495, 10), plus(9995, 10), plus(23490, 10)]),
    lv('Cent més', 'Sumar 100 mou la roda de les centenes.', [plus(4950, 100), plus(12345, 100), plus(99900, 100)]),
    lv('Mil més', 'Sumar 1.000 mou la roda de les unitats de miler. Les altres, quietes!', [plus(45300, 1000), plus(9500, 1000), plus(199000, 1000)]),
    lv('Quina roda gira?', 'Sense fer el compte: quina roda es mou?', [wheelTap(45300, 1000), wheelTap(23456, 10), wheelTap(120000, 100000), wheelTap(305020, 100)]),
    lv('Deu mil i cent mil', 'Sumar 10.000 o 100.000 mou les rodes de l\'esquerra.', [plus(35000, 10000), plus(95000, 10000), plus(250000, 100000)]),
    lv('Cap enrere', 'Què marcava abans? Ara les rodes giren al revés.', [plus(10000, -1), plus(100000, -1), plus(50200, -1000)]),
    lv('Quantes rodes canvien?', 'Quan una roda passa de 9 a 0, la del costat també es mou.', [howMany(9999), howMany(45999), howMany(199999), howMany(12345)]),
    lv('Cascades', 'Molts nous seguits: les rodes giren en cascada!', [plus(109990, 10), plus(99999, 1), plus(899999, 1), plus(300000, -10)]),
    lv('Repte de les rodes', 'Totes les rodes!', [plus(599999, 1), wheelTap(707070, 10000), howMany(99999), plus(240000, -1000)])
  ] },
  { name: 'Arrodonir', sub: 'Números rodons, com als cartells', ico: '🎯', levels: [
    lv('Més a prop de...', 'El cotxe és entre dues marques. A quina està més a prop?', [roundTap(4300, 3), roundTap(4800, 3), roundTap(7600, 3)]),
    lv('Al miler', 'Arrodonir al miler és buscar el miler més proper. Mira la xifra de les centenes.', [roundN(7800, 3), roundN(3200, 3), roundN(9100, 3)]),
    lv('Just a la meitat', 'Si és just a la meitat, arrodonim cap amunt.', [roundN(6500, 3), roundTap(8500, 3), roundN(2500, 3)]),
    lv('Cinc xifres', 'Amb cinc xifres també: mira les centenes.', [roundN(45620, 3), roundN(23400, 3), roundN(70499, 3)]),
    lv('A la desena de miler', 'Ara busca la desena de miler més propera: mira la xifra dels milers.', [roundN(43000, 4), roundN(68500, 4), roundN(15000, 4)]),
    lv('A la centena de miler', 'La centena de miler més propera: mira la xifra de les desenes de miler.', [roundN(352000, 5), roundN(129000, 5), roundN(650000, 5)]),
    lv('Números de veritat', 'Els números grans de veritat sovint es diuen arrodonits.', [
      roundN(384400, 5, thing('🌕', 'De la Terra a la Lluna', 384400, 'km'), 'La Lluna és a 384.400 km. Arrodoneix-ho a la centena de miler.'),
      roundN(40075, 3, thing('🌍', 'La volta a la Terra', 40075, 'km'), 'La volta a la Terra fa 40.075 km. Arrodoneix-ho al miler.'),
      roundN(100800, 4, thing('❤️', 'Batecs del cor en un dia', 100800), 'El cor batega unes 100.800 vegades al dia. Arrodoneix-ho a la desena de miler.')]),
    lv('Tres maneres', 'El mateix número, arrodonit de tres maneres.', [roundN(386400, 3), roundN(386400, 4), roundN(386400, 5)]),
    lv('Trampes', 'Quan arrodonir fa girar moltes rodes!', [roundN(99600, 3), roundN(9500, 3), roundN(195000, 4)]),
    lv('Repte d\'arrodonir', 'Arrodoneix-ho tot!', [roundTap(56700, 3), roundN(234567, 3), roundN(234567, 4), roundN(234567, 5)])
  ] },
  { name: 'El viatge', sub: 'Números grans de veritat', ico: '🗺️', levels: [
    lv('Quin té sentit?', 'Els números grans serveixen per coses grans. Quin número és el que té sentit?', [
      sense('Quants habitants pot tenir un poble petit?', ['800', '80.000', '800.000'], 'Un poble petit té poca gent: a la plaça s\'hi coneixen tots.', 'Un poble petit pot tenir uns 800 habitants.'),
      sense('Quants quilòmetres pot fer un cotxe en tota la seva vida?', ['200.000', '200', '2.000'], 'Un cotxe pot anar molts anys a la feina, d\'excursió i de vacances.', 'Un cotxe pot fer 200.000 km o més!'),
      sense('Quants alumnes té una escola?', ['400', '40.000', '400.000'], 'Pensa en la teva escola: quantes classes hi ha, i quants nens a cada classe?', 'Una escola pot tenir uns 400 alumnes.')]),
    lv('La Lluna', 'De la Terra a la Lluna hi ha 384.400 km. Un cotxe hi trigaria mesos!', [read(384400, thing('🌕', 'De la Terra a la Lluna', 384400, 'km')), digitAt(384400, 5), value(384400, 4)]),
    lv('Píxels', 'Una pantalla de 320 × 240 té 76.800 píxels. La Game Boy en tenia 23.040.', [read(76800, thing('📺', 'Píxels d\'una pantalla de 320 × 240', 76800)), sign(76800, 23040), write(23040)]),
    lv('Preus', 'Un cotxe o un pis costen molts euros.', [write(18500, '€'), read(245000, thing('🏠', 'El preu d\'un pis', 245000, '€')), order([{ n: 18500, e: '🚗', cap: 'Cotxe', unit: '€' }, { n: 245000, e: '🏠', cap: 'Pis', unit: '€' }, { n: 950, e: '🚲', cap: 'Bicicleta', unit: '€' }, { n: 24000, e: '🛥️', cap: 'Barca', unit: '€' }], true, 'Toca\'ls del més car al més barat.')]),
    lv('La balena blava', 'La balena blava és l\'animal més gran que ha existit mai: pot pesar uns 150.000 kg.', [read(150000, thing('🐋', 'La balena blava', 150000, 'kg')), sign(150000, 6000), value(150000, 5)]),
    lv('La recreativa', 'A la màquina recreativa els punts pugen de pressa!', [N('Tens 99.990 punts i n\'agafes 10 més. Quants punts tens ara?', 100000, 'Sumar 10 mou la roda de les desenes. Si passa de 9 a 0, la del costat també avança.', '99.990 + 10 = 100.000. Cent mil punts!', { s: 'lcd', t: 'PUNTS', n: 99990, to: 100000 }, 'punts'), read(120500, { s: 'lcd', t: 'RÈCORD', n: 120500 }), sign(98700, 120500)]),
    lv('Visualitzacions', 'El vídeo de la granota triomfa a internet!', [read(254300, thing('📹', 'Visualitzacions del vídeo', 254300)), roundN(254300, 4, thing('📹', 'Visualitzacions del vídeo', 254300), 'Arrodoneix 254.300 a la desena de miler.'), next(199999)]),
    lv('El cor', 'El cor batega unes 100.800 vegades al dia, sense parar mai!', [read(100800, thing('❤️', 'Batecs del cor en un dia', 100800)), sign(100800, 99999), write(201600)]),
    lv('Cap a Lleida', 'La granota surt de viatge amb el cotxe. Mira el cartell!', [
      N('Quants quilòmetres falten per arribar a Lleida?', 150, 'Mira el número que hi ha al costat de Lleida, al cartell.', 'Falten 150 km.', { s: 'sign', rows: [['Lleida', 150], ['Tarragona', 98], ['Girona', 104]] }, 'km'),
      plus(128750, 1000), roundN(149700, 3, thing('🚗', 'Els quilòmetres d\'un cotxe vell', 149700, 'km'), 'Un cotxe vell ha fet 149.700 km. Arrodoneix-ho al miler.')]),
    lv('Gran repte del viatge', 'L\'últim repte del viatge!', [read(406090), sign(406090, 460090), plus(399999, 1), roundN(406090, 4)])
  ] }
];
export const CIRCLES = [
  { name: 'Llegir i escriure', projects: [0, 1, 2] },
  { name: 'Comparar i ordenar', projects: [3, 4, 5] },
  { name: 'El cotxe roda', projects: [6, 7, 8] }
];
export const LEVELS = PROJECTS.flatMap(p => p.levels);
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: the odometer to read, the point to put and the car that has done more
export const POOL = [read(4500), dot(756352), cars([9800, 12000])];

// What is saved is facts only: { so, stars[90], piscina, exams[3], fulls }. Marks, XP, level, km and badges are worked out, never stored.
// a complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true), fulls: Math.max(0, whole(o.fulls)) };
}
// the km the car of the trip has done: 1.250 for every star (at most 337.500)
export const kmOf = p => 1250 * p.stars.reduce((s, n) => s + n, 0);
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: '100.000 km', what: 'Fes que el cotxe arribi als 100.000 km (cada estrella en són 1.250).' },
  { name: 'Deu fulls', what: "Caça bé les errades de deu fulls." },
  { name: 'Gran viatger', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), kmOf(p) >= 100000, p.fulls >= 10, p.exams.every(e => e === true)];

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

// A sheet: three sentences written on the notebook of the trip, each { kind, scene, says, real, opts }: says is the sentence written,
// real the true one (the sentence is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the
// ones made with big numbers: a zero forgotten or the point in the wrong place, the number with a bigger first digit taken for the
// bigger one, the wheels next to a 9 forgotten, rounding always down, the value of a digit counted from the wrong side
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const CLAIM = {
  write(bad, rnd) {
    const n = pickOf([40507, 304020, 5008, 70030, 600090, 20406, 9050, 108006], rnd), s = String(n), z = s.indexOf('0', 1);
    const dropped = punt(+(s.slice(0, z) + s.slice(z + 1))), early = s.slice(0, 3) + '.' + s.slice(3);
    const say = x => `«${cap(lletres(n))}» s'escriu ${x}.`, wrong = [dropped, early !== punt(n) ? early : s];
    return { scene: { s: 'words', t: lletres(n) }, real: say(punt(n)), says: say(bad ? wrong[at(2, rnd)] : punt(n)), opts: shuffle([punt(n), ...wrong].map(say), rnd) };
  },
  compare(bad, rnd) {
    const [a, b] = pickOf([[9800, 12000], [85000, 120000], [7999, 10500], [95000, 105000], [9990, 10009]], rnd);
    const real = `${punt(b)} és més gran que ${punt(a)}.`, wrong = [`${punt(a)} és més gran que ${punt(b)}.`, `${punt(a)} i ${punt(b)} són iguals.`];
    return { scene: { s: 'cars', cars: [{ k: 'a', n: a, h: 355 }, { k: 'b', n: b, h: 205 }] }, real, says: bad ? wrong[0] : real, opts: shuffle([real, ...wrong], rnd) };
  },
  carry(bad, rnd) {
    const n = pickOf([39999, 109999, 19999, 249999, 7999, 59999, 199999], rnd), k = String(n).match(/9+$/)[0].length;
    const say = x => `${punt(n)} + 1 = ${punt(x)}.`, wrong = [n + 1 - 10 ** k, n + 10];
    return { scene: odo(n), real: say(n + 1), says: say(bad ? wrong[0] : n + 1), opts: shuffle([n + 1, ...wrong].map(say), rnd) };
  },
  round(bad, rnd) {
    const [n, p] = pickOf([[47600, 3], [128700, 3], [9500, 3], [63800, 3], [36000, 4], [258000, 4], [671000, 5]], rnd), r = roundTo(n, p), down = Math.floor(n / 10 ** p) * 10 ** p;
    const say = x => `${punt(n)} arrodonit ${TO[p]} és ${punt(x)}.`, wrong = [down, r + 10 ** p];
    return { scene: roundScene(n, p), real: say(r), says: say(bad ? wrong[0] : r), opts: shuffle([r, ...wrong].map(say), rnd) };
  },
  value(bad, rnd) {
    const [n, p] = pickOf([[472318, 4], [56093, 3], [380412, 5], [9725, 2], [64180, 4], [215960, 3]], rnd), d = dig(n, p), v = d * 10 ** p;
    const say = x => `A ${punt(n)}, el ${d} val ${punt(x)}.`, wrong = [d * 10 ** (p - 1), p < 5 ? d * 10 ** (p + 1) : d];
    return { scene: tiles(n, { mark: len(n) - 1 - p }), real: say(v), says: say(bad ? wrong[0] : v), opts: shuffle([v, ...wrong].map(say), rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
