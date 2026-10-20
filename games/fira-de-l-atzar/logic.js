import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the fair of chance, with no page in it. The frog keeps a stall at the fair of the pond: dice, bags of balls,
// spinners and coins. The child names what can happen (sure, possible, impossible), compares chances, throws and counts, finds every way
// to dress the frog or fill a cone, and at the end weighs the games of the fair: is it fair? Every answer is worked out here from the data
// of its question, so a picture and its answer never disagree; only the experiments answer from what the child's own throws gave.
// It must keep importing from Node.

/* ---------- words ---------- */
export const punt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
// the colours of the balls and of the spinners: the colour as a noun (el vermell), a ball (una bola vermella), balls (boles vermelles)
export const COLORS = {
  r: { m: 'vermell', mp: 'vermells', f: 'vermella', fp: 'vermelles', hex: '#FF6B5E' },
  b: { m: 'blau', mp: 'blaus', f: 'blava', fp: 'blaves', hex: '#4DA3FF' },
  g: { m: 'verd', mp: 'verds', f: 'verda', fp: 'verdes', hex: '#5BD68A' },
  y: { m: 'groc', mp: 'grocs', f: 'groga', fp: 'grogues', hex: '#F7C64E' },
  p: { m: 'lila', mp: 'liles', f: 'lila', fp: 'liles', hex: '#B79CFF' }
};
const balls = (n, c) => `${n} ${n === 1 ? `bola ${COLORS[c].f}` : `boles ${COLORS[c].fp}`}`;
const sum = o => Object.values(o).reduce((s, n) => s + n, 0);

/* ---------- the things of chance ---------- */
// dev: a coin, a die (faces: what each face says), a bag (balls: how many of each colour; hidden: the balls are not seen), a spinner (secs:
// the colour of each equal piece), two dice (dice2: the sum is what counts). hist: what came out before, in a row under it. tap: its
// outcomes can be touched
export const coin = (o = {}) => ({ s: 'dev', d: 'coin', ...o });
export const die = (faces = [1, 2, 3, 4, 5, 6], o = {}) => ({ s: 'dev', d: 'die', faces, ...o });
export const bag = (b, o = {}) => ({ s: 'dev', d: 'bag', balls: b, ...o });
export const spin = (secs, o = {}) => ({ s: 'dev', d: 'spin', secs, ...o });
export const dice2 = (o = {}) => ({ s: 'dev', d: 'dice2', ...o });
// What a thing can give, each with how many of its equal ways give it: [{ k, n }], in a fixed order
export function outcomes(dev) {
  const count = a => { const m = new Map(); for (const x of a) m.set(String(x), (m.get(String(x)) || 0) + 1); return [...m].map(([k, n]) => ({ k, n })); };
  if (dev.d === 'coin') return [{ k: 'cara', n: 1 }, { k: 'creu', n: 1 }];
  if (dev.d === 'die') return count(dev.faces.slice().sort((a, b) => a - b));
  if (dev.d === 'bag') return Object.keys(COLORS).filter(c => dev.balls[c] > 0).map(c => ({ k: c, n: dev.balls[c] }));
  if (dev.d === 'spin') return Object.keys(COLORS).filter(c => dev.secs.includes(c)).map(c => ({ k: c, n: dev.secs.filter(x => x === c).length }));
  return Array.from({ length: 11 }, (_, i) => ({ k: String(i + 2), n: 6 - Math.abs(i - 5) }));
}
export const ways = dev => outcomes(dev).reduce((s, o) => s + o.n, 0);
// the name of an outcome: «cara», «el 6», «el vermell»
export const nameOf = (dev, k) => dev.d === 'coin' ? k : COLORS[k] ? `el ${COLORS[k].m}` : `el ${k}`;
// one throw, from rnd: the key of what came out
export function throwOf(dev, rnd = Math.random) {
  const os = outcomes(dev); let r = at(ways(dev), rnd);
  for (const o of os) { if (r < o.n) return o.k; r -= o.n; }
  return os[os.length - 1].k;
}

/* ---------- the questions ---------- */
// A question: text, and how it is answered: 'num' (a number typed), 'pick' (one of opts; fixed keeps their order), 'tap' (a thing of the
// scene: ans its keys), 'order' (every card in order: ans the keys in that order), 'exp' (the child throws until need, then answers ask:
// 'most' taps what came out most, 'count' types how many times target came out, 'pick' one of opts as usual), 'build' (the child fills
// a bag or paints a spinner until ok(counts) holds; many answers are good), 'all' (every combination found, one by one; ans how many
// there are). hint is what the frog says when asked or after a slip, and say what it says when the answer is right.
const Q = (type, text, ans, hint, say, o = {}) => ({ type, text, ans, hint, say, ...o });
const R = (scene, q) => ({ scene, q });
const lv = (title, say, rounds) => ({ title, say, rounds });
const N = (text, n, hint, say, scene = null, unit = '') => R(scene, Q('num', text, n, hint, say, { unit }));
const Pk = (text, opts, hint, say, scene = null, fixed = false) => R(scene, Q('pick', text, opts[0], hint, say, { opts, fixed }));
const Tp = (text, keys, hint, say, scene) => R(scene, Q('tap', text, keys.map(String), hint, say));
const tapOf = sc => ({ ...sc, tap: true });

/* sure, possible, impossible */
const SPI = ['Segur', 'Possible', 'Impossible'];
const spiHint = 'Si passa sempre, és segur. Si no pot passar mai, és impossible. Si pot passar o no, és possible.';
const spiQ = (text, ans, say, scene, hint = spiHint) => R(scene, Q('pick', text, ans, hint, say, { opts: SPI, fixed: true }));
const spiOf = (n, t) => n === t ? 'Segur' : n ? 'Possible' : 'Impossible';
// a ball of colour c from the bag
function bagIs(b, c) {
  const n = b[c] || 0, t = sum(b), ans = spiOf(n, t);
  return spiQ(`Treus una bola sense mirar. Que sigui ${COLORS[c].f} és...`, ans,
    ans === 'Segur' ? `Totes són ${COLORS[c].fp}: segur que en surt una.` : ans === 'Impossible' ? `No hi ha cap bola ${COLORS[c].f}: és impossible.` : `Hi ha ${balls(n, c)} de ${t} boles: pot sortir o no. És possible.`,
    bag(b), `Mira quines boles hi ha. ${spiHint}`);
}
// a throw of a die that does what says: ok tells the faces that do it
function dieIs(what, ok, faces = [1, 2, 3, 4, 5, 6]) {
  const good = faces.filter(ok), ans = spiOf(good.length, faces.length);
  return spiQ(`Tires el dau. ${what} és...`, ans,
    ans === 'Segur' ? 'Totes les cares ho fan: és segur.' : ans === 'Impossible' ? 'Cap cara del dau ho fa: és impossible.' : `Ho fan ${good.length === 1 ? 'una cara' : `${good.length} cares`} de ${faces.length}: és possible.`,
    die(faces), `Mira les cares del dau una per una. ${spiHint}`);
}
function spinIs(secs, c) {
  const n = secs.filter(x => x === c).length, ans = spiOf(n, secs.length);
  return spiQ(`Fas girar la ruleta. Que surti ${COLORS[c].m} és...`, ans,
    ans === 'Segur' ? `Tota la ruleta és de color ${COLORS[c].m}: és segur.` : ans === 'Impossible' ? `No hi ha cap tros ${COLORS[c].m}: és impossible.` : `Hi ha ${n === 1 ? `1 tros ${COLORS[c].m}` : `${n} trossos ${COLORS[c].mp}`} de ${secs.length}: és possible.`,
    spin(secs), `Mira els colors de la ruleta. ${spiHint}`);
}
const coinIs = (what, ans, say) => spiQ(`Tires una moneda. ${what} és...`, ans, say, coin());
// something of every day, on a card
const ev = (text, ans, e, say) => spiQ('Això és...', ans, say, { s: 'event', e, cap: text });

/* more or less likely */
const MLI = ['Més probable', 'Menys probable', 'Igual de probable'];
// the colour (or face) most likely, or least with less: tap it on the thing
function most(dev, less = false) {
  const os = outcomes(dev), best = (less ? Math.min : Math.max)(...os.map(o => o.n)), keys = os.filter(o => o.n === best).map(o => o.k), t = ways(dev);
  const what = dev.d === 'bag' ? 'boles' : 'trossos';
  return Tp(`Quin color és ${less ? 'el menys' : 'el més'} probable? Toca'l.`, keys, `Compta les ${what} de cada color: ${less ? 'el que en té menys' : 'el que en té més'} és ${less ? 'el menys' : 'el més'} probable.`,
    `${os.map(o => `${o.n} ${COLORS[o.k].m}`).join(', ')}: ${nameOf(dev, keys[0])} ${less ? 'surt menys' : 'surt més'} (${best} de ${t}).`, tapOf(dev));
}
// a against b: more, less or just as likely
function cmp2(dev, a, b) {
  const os = Object.fromEntries(outcomes(dev).map(o => [o.k, o.n])), na = os[a] || 0, nb = os[b] || 0;
  const ans = na > nb ? MLI[0] : na < nb ? MLI[1] : MLI[2], thing = dev.d === 'bag' ? x => `treure una bola ${COLORS[x].f}` : x => `que surti ${COLORS[x].m}`;
  return R(dev, Q('pick', `${thing(a)[0].toUpperCase() + thing(a).slice(1)} és ... que ${thing(b)}.`, ans, 'Compta quantes n\'hi ha de cada color. Més quantitat, més probable.',
    `${na} contra ${nb}: és ${ans.toLowerCase()}.`, { opts: MLI, fixed: true }));
}
// which of the bags (or spinners) gives colour c most easily: the part of the whole, not how many
function whichOf(devs, c, text) {
  const part = d => { const o = outcomes(d).find(x => x.k === c); return (o ? o.n : 0) / ways(d); };
  const ks = 'abc', best = Math.max(...devs.map(part)), keys = devs.flatMap((d, i) => part(d) === best ? [ks[i]] : []);
  const tell = d => { const o = outcomes(d).find(x => x.k === c); return `${o ? o.n : 0} de ${ways(d)}`; };
  return Tp(text, keys, `No miris només quantes n'hi ha: mira quina part del total són. A cada ${devs[0].d === 'bag' ? 'bossa' : 'ruleta'}, quantes de quantes?`,
    `${devs.map((d, i) => `${ks[i].toUpperCase()}: ${tell(d)}`).join(' · ')}. Guanya la ${ks[devs.indexOf(devs.find(d => part(d) === best))].toUpperCase()}.`,
    { s: 'many', devs: devs.map((d, i) => ({ ...d, k: ks[i] })), c, tap: true });
}
const whichBag = (bs, c) => whichOf(bs.map(b => bag(b)), c, `De quina bossa és més fàcil treure una bola ${COLORS[c].f}? Toca-la.`);
const whichSpin = (ss, c, text) => whichOf(ss.map(s => spin(s)), c, text || `Amb quina ruleta és més fàcil que surti ${COLORS[c].m}? Toca-la.`);
// the probability line: from impossible to sure, the middle is half
export const METER = ['Impossible', 'Poc probable', 'La meitat', 'Molt probable', 'Segur'];
function meterOf(n, t) { const f = n / t; return f === 0 ? 0 : f === 1 ? 4 : f === 0.5 ? 2 : f < 0.5 ? 1 : 3; }
function meter(dev, k, text) {
  const o = outcomes(dev).find(x => x.k === k), n = o ? o.n : 0, t = ways(dev), m = meterOf(n, t);
  return Tp(text, ['m' + m], `${n} de ${t}. Si és 0, impossible; si és tot, segur; just la meitat, al mig; menys de la meitat, a l'esquerra; més, a la dreta.`,
    `${n} de ${t}: ${METER[m].toLowerCase()}.`, { s: 'meter', dev, tap: true });
}
// cards of things that may happen, from the least likely to the most: items { e, cap, n, t } (n of t)
function orderLikely(items, text = 'Toca\'ls del menys probable al més probable.') {
  const its = items.map((x, i) => ({ k: String(i), ...x })), keys = its.slice().sort((a, b) => a.n / a.t - b.n / b.t);
  return R({ s: 'cards', items: its }, Q('order', text, keys.map(x => x.k), 'Pensa per a cada una quantes maneres de passar té, de totes les que hi ha.',
    keys.map(x => `${x.cap} (${x.n} de ${x.t})`).join(' < ') + '.'));
}

/* experiments: the child throws */
const EXP_SAY = 'Ho has comprovat tu mateix!';
// steps: the buttons (throw 1, 10, 100...); need: throws before the question
function exp(dev, text, need, steps, ask, o = {}) {
  const hint = { most: 'Mira quina barra és la més alta.', count: `Llegeix el número de sobre la barra ${o.target ? `de ${nameOf(dev, o.target)}` : ''}.`, pick: o.hint || 'Mira les barres i pensa-hi.' }[ask];
  return R({ s: 'exp', dev }, Q('exp', text, ask === 'pick' ? o.opts[0] : null, hint, o.say || EXP_SAY, { need, steps, ask, ...o, hint }));
}
const LLN = ['Més o menys la meitat', 'Gairebé totes', 'Gairebé cap'];

/* fill the bag, paint the spinner: ok says if what the child made is good; there is more than one good one */
const build = (look, colors, text, ok, hint, say, o = {}) => R({ s: 'build', look, colors, n: o.n || 8, max: o.max || 12 }, Q('build', text, null, hint, say, { ok }));

/* every combination: the child makes them one by one */
// slots: [{ name, items }], items { k, e (an emoji), c (a colour), t (its name) }. same: every slot takes from the items of the first one;
// distinct: no item twice; unordered: the same items in another order are the same combination
export function comboKey(sel, o = {}) { return (o.unordered ? sel.slice().sort() : sel).join('+'); }
export function combos(slots, o = {}) {
  const pools = o.same ? slots.map(() => slots[0].items) : slots.map(s => s.items);
  let all = [[]];
  for (const pool of pools) all = all.flatMap(a => pool.map(it => [...a, it.k]));
  if (o.distinct) all = all.filter(a => new Set(a).size === a.length);
  return [...new Set(all.map(a => comboKey(a, o)))];
}
/* the tree to count with: under the things of a question of how many, the child makes it grow one node at a time */
// t: { slots: [{ name, items }], distinct, unordered, miss }: a level per slot, and with miss ({ name, e }) one more level, the group the
// question asks for, as big as the child tries (n). distinct: no item twice on a branch; unordered: the levels have the same items and a
// branch only goes on to the ones after the last (from it, if they may repeat), so each combination comes once: 3 + 2 + 1.
// The items a node grows into (path: the keys from the root), leaving out the ones that can reach no tip
export function branches(t, path, n = 0) {
  const d = path.length, L = t.slots.length + (t.miss ? 1 : 0);
  if (d >= L) return [];
  const pool = d < t.slots.length ? t.slots[d].items : Array.from({ length: n }, (_, i) => ({ k: `m${i}`, e: t.miss.e, t: `${i + 1}` }));
  const last = t.unordered && d ? pool.findIndex(x => x.k === path[d - 1]) : -1;
  return pool.filter((x, i) => !(t.distinct && path.includes(x.k)) && !(t.unordered && (t.distinct ? i <= last : i < last)))
    .filter(x => d + 1 === L || branches(t, [...path, x.k], n).length > 0);
}
// the tips of the whole tree: how many ways it counts
export const tips = (t, n = 0, path = []) => path.length === t.slots.length + (t.miss ? 1 : 0) ? 1 : branches(t, path, n).reduce((s, x) => s + tips(t, n, [...path, x.k]), 0);
function allQ(text, look, sl, o, hint, say) {
  const n = combos(sl, o).length;
  return R({ s: 'combo', look, slots: sl, same: !!o.same, distinct: !!o.distinct, unordered: !!o.unordered }, Q('all', text, n, hint, say(n), o));
}
// the things to combine
const SHIRTS = ['r', 'b', 'g', 'y'].map(c => ({ k: c, c, e: '👕', t: `samarreta ${COLORS[c].f}` }));
const HATS = [{ k: 'h', e: '🎩', t: 'barret de copa' }, { k: 'k', e: '🧢', t: 'gorra' }, { k: 'p', e: '👒', t: 'pamela' }, { k: 'c', e: '👑', t: 'corona' }];
const SHOES = [{ k: 's', e: '👟', t: 'bambes' }, { k: 'o', e: '🥾', t: 'botes' }];
const FIRST = [{ k: 'a', e: '🥗', t: 'amanida' }, { k: 'm', e: '🍝', t: 'macarrons' }, { k: 's', e: '🍲', t: 'sopa' }];
const SECOND = [{ k: 'f', e: '🐟', t: 'peix' }, { k: 'p', e: '🍗', t: 'pollastre' }, { k: 't', e: '🍳', t: 'truita' }];
const DESSERT = [{ k: 'f', e: '🍮', t: 'flam' }, { k: 'p', e: '🍎', t: 'poma' }];
const FLAVOURS = [{ k: 'm', e: '🍓', c: 'r', t: 'maduixa' }, { k: 'x', e: '🍫', c: 'b', t: 'xocolata' }, { k: 'l', e: '🍋', c: 'y', t: 'llimona' }, { k: 'v', e: '🥥', c: 'p', t: 'coco' }];
const FROGS = ['r', 'b', 'g', 'y', 'p'].map(c => ({ k: c, c, e: '🐸', t: `la granota ${COLORS[c].f}` }));
const DIGITS = [1, 2, 3, 4].map(d => ({ k: String(d), e: String(d), t: String(d) }));
const STRIPES = ['r', 'b', 'y', 'g'].map(c => ({ k: c, c, t: COLORS[c].m }));
const BREAD = [{ k: 'b', e: '🥖', t: 'barra' }, { k: 'c', e: '🥐', t: 'croissant' }, { k: 'm', e: '🍞', t: 'pa de motlle' }];
const FILLINGS = [{ k: 'p', e: '🧀', t: 'formatge' }, { k: 'j', e: '🥓', t: 'bacó' }, { k: 't', e: '🍅', t: 'tomàquet' }, { k: 'o', e: '🥚', t: 'ou' }];
const SAUCES = [{ k: 'a', e: '🧄', t: 'allioli' }, { k: 'x', e: '🌶️', t: 'salsa picant' }];
const sl = (name, items) => ({ name, items });
const dress = (s, h, sh = 0) => [sl('Samarreta', SHIRTS.slice(0, s)), sl('Barret', HATS.slice(0, h)), ...(sh ? [sl('Sabates', SHOES.slice(0, sh))] : [])];
const sayAll = what => n => `Totes ${n}! ${what}`;
// groups of things to count the combinations of: { s: 'outfit', groups: [{ name, items }], tree }. With tree (see branches) the child can
// grow the tree to count them on the screen; its levels are the groups, unless it brings its own slots
const outfit = (groups, tree) => ({ s: 'outfit', groups, ...(tree ? { tree: { slots: groups, ...tree } } : {}) });
const mulHint = 'Per a cada una del primer grup, hi ha totes les del segon: és una multiplicació.';
function countMul(text, groups, unit = '') {
  const n = groups.reduce((p, g) => p * g.items.length, 1);
  return N(text, n, mulHint, `${groups.map(g => g.items.length).join(' × ')} = ${n}.`, outfit(groups, {}), unit);
}
// two of the same things, as a cone (an order, may repeat) or a cup (no order, different): the tree of its two balls
const scoops = (fl, cup = false, rep = false) => outfit([{ name: 'Gustos', items: fl }], cup ? { slots: [sl('Una bola', fl), sl('L\'altra', fl)], distinct: true, unordered: true } : { slots: [sl('A baix', fl), sl('A dalt', fl)], distinct: !rep });
// n frogs that take places in order (a podium, a row, a captain): one place after another, never the same frog twice
const lineUp = (n, places, o = {}) => outfit([{ name: 'Granotes', items: FROGS.slice(0, n) }], { slots: places.map(p => sl(p, FROGS.slice(0, n))), distinct: true, ...o });
// a tree: the first things, and from each, all the second ones
const tree = (a, b) => ({ s: 'tree', a, b });
// a table of two entries: rows and columns, and in each cell what they make (cell); hl the cells the hint lights
const table = (rows, cols, cells, hl = [], o = {}) => ({ s: 'table', rows, cols, cells, hl, ...o });
// frogs in a ring that greet each other: n frogs, the lines of the hint
const crowd = n => ({ s: 'crowd', n });

/* two dice */
const D6 = [1, 2, 3, 4, 5, 6];
const sumsWith = ok => D6.flatMap(a => D6.flatMap(b => ok(a + b, a, b) ? [`${a}-${b}`] : []));
const dice2Table = (hl = []) => table(D6.map(String), D6.map(String), D6.map(a => D6.map(b => String(a + b))), hl, { corner: '+', dice: true });
const waysOf = s => sumsWith(x => x === s).length;
function sumWays(s) {
  const n = waysOf(s);
  return N(`De quantes maneres pot sortir suma ${s}?`, n, `Busca a la taula les caselles on hi ha un ${s} i compta-les.`, `${n === 1 ? 'Una sola casella' : `${n} caselles`} sumen ${s}.`, dice2Table(sumsWith(x => x === s)));
}

/* fractions of luck: «3 de 8», 3/8 */
function fracOf(dev, k, slash = false) {
  const o = outcomes(dev).find(x => x.k === k), n = o ? o.n : 0, t = ways(dev), f = (a, b) => slash ? `${a}/${b}` : `${a} de ${b}`;
  const opts = [f(n, t), f(t - n, t), f(n, t - n), f(t, n)].filter((x, i, a) => a.indexOf(x) === i && !x.includes('/0') && !x.endsWith(' de 0')).slice(0, 3);
  const what = dev.d === 'bag' ? `treure una bola ${COLORS[k].f}` : dev.d === 'spin' ? `que surti ${COLORS[k].m}` : `treure ${nameOf(dev, k)}`;
  return Pk(`Quina és la probabilitat de ${what}?`, opts, `A dalt, les maneres que van bé; a baix, totes les maneres. ${dev.d === 'bag' ? 'Compta les boles' : dev.d === 'spin' ? 'Compta els trossos' : 'Compta les cares'}.`,
    `${n} de ${t}${slash ? `, que s'escriu ${n}/${t}` : ''}.`, dev);
}
// a die event as a fraction: faces that do it, over 6
function dieFrac(what, ok) {
  const n = D6.filter(ok).length;
  return Pk(`Quina és la probabilitat de ${what}?`, [`${n}/6`, `${6 - n}/6`, `${n}/${6 - n || 1}`].filter((x, i, a) => a.indexOf(x) === i), 'Compta les cares que van bé. A baix hi va el 6: totes les cares.',
    `${D6.filter(ok).join(', ')}: ${n} de 6 cares, ${n}/6.`, die());
}

/* fair games: the frog against the child */
const JUST = ['Sí, és just', 'No, no és just'];
const fair = (text, yes, why, scene) => R(scene, Q('pick', text, yes ? JUST[0] : JUST[1], 'Un joc és just si tots dos teniu les mateixes maneres de guanyar.', why, { opts: JUST, fixed: true }));

/* ---------- the projects ---------- */
export const PROJECTS = [
  { name: 'Segur o impossible', sub: 'Les paraules de l\'atzar', ico: '🎲', levels: [
    lv('Les tres paraules', 'Si una cosa passa sempre, és segura. Si no pot passar mai, és impossible. I si pot passar o no, és possible.', [
      ev('Demà al matí sortirà el sol.', 'Segur', '🌅', 'Cada dia surt el sol, encara que estigui ennuvolat: és segur.'),
      ev('Tirant un dau normal, sortirà un 9.', 'Impossible', '🎲', 'Un dau normal va de l\'1 al 6: un 9 és impossible.'),
      ev('Plourà algun dia d\'aquest mes.', 'Possible', '🌧️', 'Pot ploure o no: és possible.')]),
    lv('La bossa de boles', 'Treus una bola sense mirar. Mira bé quines boles hi ha a la bossa!', [bagIs({ r: 4 }, 'r'), bagIs({ r: 2, b: 2 }, 'b'), bagIs({ b: 3 }, 'r')]),
    lv('El dau', 'Un dau té sis cares, de l\'1 al 6.', [dieIs('Treure un 4', x => x === 4), dieIs('Treure un número més petit que 7', x => x < 7), dieIs('Treure un 0', x => x === 0)]),
    lv('La moneda', 'Una moneda té dues cares: cara i creu.', [coinIs('Que surti cara', 'Possible', 'Pot sortir cara o creu: és possible.'), coinIs('Que surti cara o creu', 'Segur', 'Sempre surt una de les dues: és segur.'),
      coinIs('Que surtin cara i creu alhora', 'Impossible', 'La moneda cau d\'un costat: no poden sortir totes dues alhora.')]),
    lv('La ruleta', 'La ruleta gira i s\'atura en un color. Tots els trossos són iguals.', [spinIs(['r', 'r', 'b', 'b'], 'r'), spinIs(['y', 'y', 'y', 'y'], 'y'), spinIs(['y', 'y', 'y', 'y'], 'b')]),
    lv('Bosses traïdores', 'Compte: que una cosa sigui difícil no vol dir que sigui impossible!', [bagIs({ r: 1, b: 9 }, 'r'), bagIs({ g: 6 }, 'g'), bagIs({ y: 5, b: 5 }, 'r')]),
    lv('Un dau especial', 'Aquest dau és especial: mira quins números té a les cares.', [dieIs('Treure un número parell', x => x % 2 === 0, [2, 2, 4, 4, 6, 6]), dieIs('Treure un 3', x => x === 3, [2, 2, 4, 4, 6, 6]), dieIs('Treure un 4', x => x === 4, [2, 2, 4, 4, 6, 6])]),
    lv('Cada dia', 'L\'atzar també és a la vida de cada dia.', [
      ev('L\'any que ve tindràs un any més.', 'Segur', '🎂', 'Cada any fem un any més: és segur.'),
      ev('Una setmana tindrà 8 dies.', 'Impossible', '📅', 'Les setmanes sempre tenen 7 dies.'),
      ev('Tirant dues monedes, sortiran dues cares.', 'Possible', '🪙', 'Pot passar, però també poden sortir altres coses: és possible.'),
      ev('Després d\'un dilluns vindrà un dimarts.', 'Segur', '🗓️', 'Sempre: és segur.')]),
    lv('Fes la bossa', 'Ara la bossa la fas tu! Toca + i − per posar i treure boles. Hi ha més d\'una manera bona.', [
      build('bag', ['r', 'b'], 'Omple la bossa perquè treure una bola vermella sigui segur.', k => k.r > 0 && k.b === 0, 'Perquè sigui segur, totes les boles han de ser vermelles.', 'Totes vermelles: segur!'),
      build('bag', ['r', 'b'], 'Ara fes que puguin sortir vermelles i blaves.', k => k.r > 0 && k.b > 0, 'Perquè siguin possibles, n\'hi ha d\'haver almenys una de cada.', 'Hi ha de tots dos colors: tots dos són possibles.'),
      build('bag', ['r', 'b'], 'I ara, que treure vermella sigui impossible.', k => k.r === 0 && k.b > 0, 'Treu totes les vermelles i deixa-hi alguna blava.', 'Sense vermelles: impossible!')]),
    lv('Repte de les paraules', 'Segur, possible o impossible: tot barrejat!', [bagIs({ r: 3, b: 1 }, 'b'), dieIs('Treure un 7', x => x === 7), spinIs(['r', 'b', 'g', 'y'], 'g'),
      ev('Si llences una pedra a l\'estany, s\'enfonsarà.', 'Segur', '🪨', 'Les pedres no suren: segur que s\'enfonsa.')])
  ] },
  { name: 'Més o menys probable', sub: 'Comparar possibilitats', ico: '⚖️', levels: [
    lv('Més boles, més fàcil', 'Com més boles d\'un color, més fàcil és treure\'n una.', [most(bag({ r: 5, b: 1 })), most(bag({ b: 2, y: 6 })), most(bag({ g: 1, r: 2, y: 7 }))]),
    lv('El menys probable', 'Ara busca el color més difícil de treure.', [most(bag({ r: 6, b: 2 }), true), most(bag({ y: 3, g: 8, b: 4 }), true), most(bag({ r: 4, b: 4, p: 1 }), true)]),
    lv('Més, menys o igual', 'Compara dos colors. Si n\'hi ha els mateixos, és igual de probable.', [cmp2(bag({ r: 3, b: 3 }), 'r', 'b'), cmp2(bag({ r: 2, b: 6 }), 'r', 'b'), cmp2(bag({ y: 5, g: 1 }), 'y', 'g')]),
    lv('Ruletes', 'A la ruleta, com més trossos d\'un color, més probable.', [most(spin(['r', 'r', 'r', 'b'])), most(spin(['b', 'y', 'y', 'b', 'b', 'g'])), cmp2(spin(['r', 'b', 'r', 'b']), 'r', 'b')]),
    lv('El probabilitòmetre', 'Aquesta línia va d\'impossible a segur. Al mig hi ha la meitat. Toca on va cada cosa.', [
      meter(bag({ r: 4 }), 'r', 'Treure una bola vermella. On va?'), meter(coin(), 'cara', 'Que surti cara. On va?'),
      meter(bag({ b: 4 }), 'r', 'Treure una bola vermella. On va?'), meter(bag({ r: 1, b: 9 }), 'r', 'Treure una bola vermella. On va?')]),
    lv('Més probabilitòmetre', 'Menys de la meitat, a l\'esquerra del mig. Més de la meitat, a la dreta.', [
      meter(bag({ r: 9, b: 1 }), 'r', 'Treure una bola vermella. On va?'), meter(die(), '6', 'Treure un 6. On va?'), meter(spin(['g', 'g', 'b', 'b']), 'g', 'Que surti verd. On va?')]),
    lv('Quina bossa?', 'Dues bosses. De quina és més fàcil treure una bola vermella?', [whichBag([{ r: 3, b: 1 }, { r: 1, b: 3 }], 'r'), whichBag([{ r: 2, b: 2 }, { r: 4 }], 'r'), whichBag([{ r: 1, b: 5 }, { r: 3, b: 3 }], 'r')]),
    lv('Compte amb el total!', 'Més boles vermelles no vol dir més fàcil! Mira quina part del total són.', [whichBag([{ r: 3, b: 1 }, { r: 5, b: 15 }], 'r'), whichBag([{ r: 2 }, { r: 6, b: 6 }], 'r'), whichBag([{ r: 1, b: 1 }, { r: 4, b: 12 }], 'r')]),
    lv('Ordena', 'Del que costa més que passi al que passa segur.', [
      orderLikely([{ e: '🎲', cap: 'Treure un 6', n: 1, t: 6 }, { e: '🪙', cap: 'Treure cara', n: 1, t: 2 }, { e: '🌅', cap: 'Que surti el sol', n: 1, t: 1 }, { e: '7️⃣', cap: 'Treure un 7 amb un dau', n: 0, t: 6 }]),
      orderLikely([{ e: '👜', cap: '3 vermelles de 4', n: 3, t: 4 }, { e: '👜', cap: '1 vermella de 4', n: 1, t: 4 }, { e: '👜', cap: '2 vermelles de 4', n: 2, t: 4 }])]),
    lv('Repte de comparar', 'Tot el que has après per comparar.', [most(bag({ p: 2, g: 5, r: 3 })), whichBag([{ r: 2, b: 8 }, { r: 2, b: 2 }], 'r'), meter(spin(['y', 'y', 'y', 'b']), 'y', 'Que surti groc. On va?'), cmp2(bag({ b: 4, g: 4 }), 'g', 'b')])
  ] },
  { name: 'Experiments', sub: 'Prediu, tira i compta', ico: '🧪', levels: [
    lv('Tira la moneda', 'Ara tires tu! Toca els botons per tirar i mira les barres.', [
      exp(coin(), 'Tira la moneda almenys 10 vegades.', 10, [1, 10], 'count', { target: 'cara', text2: 'Quantes cares han sortit?' }),
      exp(coin(), 'Tira-la fins a 20 vegades o més.', 20, [1, 10], 'count', { target: 'creu', text2: 'Quantes creus han sortit en total?' })]),
    lv('El dau', 'Tira el dau i compta què surt.', [
      exp(die(), 'Tira el dau almenys 30 vegades.', 30, [1, 10], 'most', { text2: 'Quin número ha sortit més vegades? Toca la seva barra.' }),
      exp(die(), 'Tira\'l unes quantes vegades més, fins a 40.', 40, [1, 10], 'count', { target: '6', text2: 'Quantes vegades ha sortit el 6?' })]),
    lv('Prediu primer', 'Un bon científic primer prediu i després ho comprova.', [
      most(bag({ r: 6, b: 2 })),
      exp(bag({ r: 6, b: 2 }), 'Ara comprova-ho: treu boles (i torna-les a la bossa) almenys 40 vegades.', 40, [1, 10], 'most', { text2: 'Quin color ha sortit més? Toca la seva barra.' })]),
    lv('La ruleta desigual', 'Aquesta ruleta té més vermell que blau.', [
      most(spin(['r', 'r', 'r', 'b'])),
      exp(spin(['r', 'r', 'r', 'b']), 'Fes-la girar almenys 40 vegades.', 40, [1, 10], 'count', { target: 'r', text2: 'Quantes vegades ha sortit el vermell?' }),
      Pk('Per què surt més el vermell?', ['Perquè ocupa més tros de la ruleta', 'Perquè ha tingut sort', 'Perquè el vermell és més ràpid'], 'Mira la ruleta: quin color ocupa més?', 'El vermell ocupa 3 de 4 trossos: per això surt més.', spin(['r', 'r', 'r', 'b']))]),
    lv('Moltes tirades', 'Amb poques tirades passa de tot. Amb moltes, l\'atzar s\'endreça!', [
      exp(coin(), 'Tira la moneda 10 vegades.', 10, [1, 10], 'count', { target: 'cara', text2: 'Quantes cares han sortit?' }),
      exp(coin(), 'Ara tira-la moltes vegades: fins a 1.000!', 1000, [10, 100], 'pick', { text2: 'Amb tantes tirades, les cares són...', opts: LLN, hint: 'Compara les dues barres: són gaire diferents?', say: 'Amb moltes tirades, cara i creu surten més o menys la meitat de les vegades cada una.' })]),
    lv('La moneda no té memòria', 'La moneda no recorda què ha sortit abans!', [
      Pk('Ha sortit cara 5 vegades seguides. Què és més probable ara?', ['Cara i creu, igual', 'Creu, perquè ja li toca', 'Cara, perquè surt molt'], 'La moneda no sap què ha sortit abans. Cada tirada comença de nou.', 'Cada tirada és nova: cara i creu continuen sent igual de probables.', coin({ hist: ['cara', 'cara', 'cara', 'cara', 'cara'] })),
      Pk('En 12 tirades no ha sortit cap 6. Ara el 6 és més fàcil?', ['No: continua sent 1 de 6', 'Sí, perquè ja li toca', 'No, ja no sortirà mai'], 'El dau no recorda res. Cada tirada, el 6 és una cara de sis.', 'El dau no té memòria: el 6 continua sent 1 de 6.', die([1, 2, 3, 4, 5, 6], { hist: ['3', '1', '5', '2', '2', '4', '1', '5', '3', '3', '4', '2'] })),
      exp(coin(), 'Tira la moneda almenys 20 vegades i mira què passa després de dues cares seguides.', 20, [1, 10], 'pick', { text2: 'Després d\'unes quantes cares, la moneda...', opts: ['Pot tornar a fer cara', 'Sempre fa creu', 'Sempre torna a fer cara'], hint: 'Mira les últimes tirades, a sota de la moneda.', say: 'Pot sortir cara o creu: la moneda no porta el compte.' })]),
    lv('La bossa misteriosa', 'No veus què hi ha a la bossa! Treu boles (i torna-les) i endevina-ho.', [
      exp(bag({ r: 8, b: 2 }, { hidden: true }), 'Treu boles almenys 50 vegades.', 50, [1, 10], 'pick', { text2: 'Què creus que hi ha a la bossa?', opts: ['Moltes més vermelles que blaves', 'Les mateixes vermelles que blaves', 'Moltes més blaves que vermelles'], hint: 'El color que surt molt més, segurament hi és molt més.', say: 'Hi havia 8 vermelles i 2 blaves!' }),
      exp(bag({ y: 3, g: 3 }, { hidden: true }), 'Una altra bossa misteriosa. Treu-ne almenys 50.', 50, [1, 10], 'pick', { text2: 'Què creus que hi ha?', opts: ['Més o menys les mateixes grogues que verdes', 'Moltes més grogues', 'Moltes més verdes'], hint: 'Si les dues barres s\'assemblen, segurament n\'hi ha les mateixes.', say: 'Hi havia 3 grogues i 3 verdes!' })]),
    lv('Quantes en surten?', 'Prediu quantes vegades sortirà, més o menys.', [
      Pk('Si tires una moneda 100 vegades, quantes cares sortiran, més o menys?', ['Unes 50', 'Unes 10', 'Unes 100'], 'La cara és la meitat de les possibilitats.', 'La meitat de 100: unes 50 (potser 47, potser 53...).', coin()),
      Pk('Si tires un dau 60 vegades, quants 6 sortiran, més o menys?', ['Uns 10', 'Uns 30', 'Uns 60'], 'El 6 és una cara de sis: una de cada sis tirades.', '60 entre 6: uns 10.', die()),
      Pk('Si fas girar aquesta ruleta 40 vegades, quants vermells sortiran, més o menys?', ['Uns 10', 'Uns 20', 'Uns 40'], 'El vermell és 1 tros de 4.', '40 entre 4: uns 10.', spin(['r', 'b', 'b', 'b']))]),
    lv('El dau trucat', 'Aquest dau té dos 6 i cap 5. És trucat!', [
      Tp('Quin número és el més probable? Toca\'l.', ['6'], 'Mira les cares: n\'hi ha algun que surti dues vegades?', 'El 6 és a dues cares: 2 de 6.', tapOf(die([1, 2, 3, 4, 6, 6]))),
      exp(die([1, 2, 3, 4, 6, 6]), 'Tira el dau trucat almenys 60 vegades.', 60, [1, 10], 'most', { text2: 'Quin número ha sortit més? Toca la seva barra.' }),
      exp(die([1, 2, 3, 4, 6, 6]), 'Continua fins a 100.', 100, [10], 'count', { target: '5', text2: 'Quantes vegades ha sortit el 5?' })]),
    lv('Repte dels experiments', 'Prediu, tira i pensa!', [
      Pk('Si tires un dau 30 vegades, quants 1 sortiran, més o menys?', ['Uns 5', 'Uns 15', 'Uns 30'], 'L\'1 és una cara de sis.', '30 entre 6: uns 5.', die()),
      exp(spin(['g', 'g', 'y', 'b']), 'Fes girar la ruleta almenys 40 vegades.', 40, [1, 10], 'most', { text2: 'Quin color ha sortit més? Toca la seva barra.' }),
      Pk('Ha sortit groc 4 vegades seguides. Què passarà ara?', ['Pot sortir qualsevol color', 'Segur que surt groc', 'Ja no pot sortir groc'], 'La ruleta no té memòria.', 'Cada gir és nou: pot sortir qualsevol color.', spin(['g', 'g', 'y', 'b'], { hist: ['groc', 'groc', 'groc', 'groc'] }))])
  ] },
  { name: 'Vesteix la granota', sub: 'Totes les combinacions', ico: '👕', levels: [
    lv('Dues i dues', 'Tria una samarreta i un barret i desa la combinació. Troba-les totes! Quan creguis que ja les tens, toca «Ja estan totes!».', [
      allQ('Troba totes les maneres de vestir la granota.', 'frog', dress(2, 2), {}, 'Fes-ho per ordre: primer, la samarreta vermella amb cada barret; després, la blava amb cada barret.', sayAll('2 samarretes amb 2 barrets cada una.'))]),
    lv('Tres samarretes', 'Ara hi ha tres samarretes. Vés per ordre i no te\'n deixaràs cap!', [
      allQ('Troba totes les maneres de vestir la granota.', 'frog', dress(3, 2), {}, 'Per a cada samarreta, prova tots els barrets abans de passar a la següent.', sayAll('3 samarretes, i cada una amb 2 barrets.'))]),
    lv('Quantes n\'hi ha?', 'Ja no cal fer-les totes: es poden comptar!', [
      countMul('Quantes maneres hi ha de vestir la granota?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 3) }, { name: 'Barrets', items: HATS.slice(0, 2) }]),
      countMul('I ara, quantes?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 2) }, { name: 'Barrets', items: HATS.slice(0, 3) }]),
      countMul('I amb quatre samarretes?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 4) }, { name: 'Barrets', items: HATS.slice(0, 2) }])]),
    lv('L\'arbre', 'Un arbre ensenya totes les combinacions: de cada samarreta surt una branca per a cada barret.', [
      N('Quantes branques hi ha al final de l\'arbre?', 6, 'Compta les puntes de les branques de la dreta. O multiplica: samarretes × barrets.', '3 × 2 = 6 combinacions.', tree(SHIRTS.slice(0, 3), HATS.slice(0, 2))),
      N('I en aquest arbre?', 6, 'De cada samarreta surten 3 branques.', '2 × 3 = 6.', tree(SHIRTS.slice(0, 2), HATS.slice(0, 3))),
      Pk('Quina operació dona totes les combinacions?', ['3 × 2', '3 + 2', '3 − 2'], 'Per a cada samarreta hi ha 2 barrets: 2, i 2, i 2...', '3 vegades 2: 3 × 2 = 6.', tree(SHIRTS.slice(0, 3), HATS.slice(0, 2)))]),
    lv('Tres per tres', 'Tres samarretes i tres barrets. Ordre, ordre!', [
      allQ('Troba totes les maneres de vestir la granota.', 'frog', dress(3, 3), {}, 'Comença per la vermella amb els 3 barrets. Després la blava amb els 3. Després la verda.', sayAll('3 × 3 = 9.'))]),
    lv('Multiplica', 'Samarretes per barrets: multiplica i ho tens!', [
      countMul('Quantes maneres hi ha?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 4) }, { name: 'Barrets', items: HATS.slice(0, 3) }]),
      countMul('I ara?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 4) }, { name: 'Barrets', items: HATS.slice(0, 4) }]),
      countMul('I ara?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 2) }, { name: 'Barrets', items: HATS.slice(0, 4) }])]),
    lv('També sabates', 'Ara la granota també tria sabates. Cada combinació té tres coses!', [
      allQ('Troba totes les maneres de vestir-la.', 'frog', dress(2, 2, 2), {}, 'Fixa la samarreta i el barret, i prova les dues sabates. Després canvia el barret...', sayAll('2 × 2 × 2 = 8.')),
      countMul('I amb 3 samarretes, 2 barrets i 2 sabates?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 3) }, { name: 'Barrets', items: HATS.slice(0, 2) }, { name: 'Sabates', items: SHOES }])]),
    lv('Què falta?', 'Ara saps quantes combinacions hi ha. Quantes coses hi havia?', [
      N('Hi ha 12 maneres de vestir la granota i té 4 samarretes. Quants barrets té?', 3, '4 × ? = 12.', '4 × 3 = 12: té 3 barrets.', outfit([{ name: 'Samarretes', items: SHIRTS }], { miss: { name: 'Barrets', e: '🎩' } })),
      N('Hi ha 10 maneres i té 2 barrets. Quantes samarretes té?', 5, '? × 2 = 10.', '5 × 2 = 10: té 5 samarretes.', outfit([{ name: 'Barrets', items: HATS.slice(0, 2) }], { miss: { name: 'Samarretes', e: '👕' } })),
      N('Hi ha 6 maneres i té 3 samarretes. Quants barrets té?', 2, '3 × ? = 6.', '3 × 2 = 6.', outfit([{ name: 'Samarretes', items: SHIRTS.slice(0, 3) }], { miss: { name: 'Barrets', e: '🎩' } }))]),
    lv('La taula', 'Una taula de doble entrada també ho ensenya tot: cada casella és una combinació.', [
      N('Quantes caselles té la taula?', 12, 'Files per columnes.', '3 files × 4 columnes = 12 combinacions.', table(SHIRTS.slice(0, 3).map(x => x.e), HATS.map(x => x.e), SHIRTS.slice(0, 3).map(() => HATS.map(h => h.e)), [], { rowc: SHIRTS.slice(0, 3).map(x => x.c) })),
      N('En quantes caselles hi ha la samarreta vermella?', 4, 'Mira la fila de la samarreta vermella.', 'Una fila sencera: 4, una per barret.', table(SHIRTS.slice(0, 3).map(x => x.e), HATS.map(x => x.e), SHIRTS.slice(0, 3).map(() => HATS.map(h => h.e)), ['0-0', '0-1', '0-2', '0-3'], { rowc: SHIRTS.slice(0, 3).map(x => x.c) })),
      N('En quantes hi ha la corona?', 3, 'Mira la columna de la corona.', 'Una columna sencera: 3, una per samarreta.', table(SHIRTS.slice(0, 3).map(x => x.e), HATS.map(x => x.e), SHIRTS.slice(0, 3).map(() => HATS.map(h => h.e)), ['0-3', '1-3', '2-3'], { rowc: SHIRTS.slice(0, 3).map(x => x.c) }))]),
    lv('Repte de vestir', 'Tot el que saps de combinar!', [
      countMul('Quantes maneres hi ha?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 3) }, { name: 'Barrets', items: HATS }]),
      N('Hi ha 8 maneres i té 2 samarretes i 2 barrets. Quantes sabates té?', 2, '2 × 2 × ? = 8.', '2 × 2 × 2 = 8.', outfit([{ name: 'Samarretes', items: SHIRTS.slice(0, 2) }, { name: 'Barrets', items: HATS.slice(0, 2) }], { miss: { name: 'Sabates', e: '👟' } })),
      allQ('Troba-les totes!', 'frog', dress(4, 2), {}, 'Una samarreta rere l\'altra, cada una amb els 2 barrets.', sayAll('4 × 2 = 8.'))])
  ] },
  { name: 'Gelats i menús', sub: 'Importa l\'ordre?', ico: '🍦', levels: [
    lv('El menú', 'Al restaurant de la fira tries un primer i un segon.', [
      allQ('Troba tots els menús possibles.', 'menu', [sl('Primer', FIRST.slice(0, 2)), sl('Segon', SECOND.slice(0, 2))], {}, 'Cada primer amb cada segon.', sayAll('2 primers × 2 segons.'))]),
    lv('Amb postres', 'Ara també hi ha postres. Tres coses a cada menú!', [
      allQ('Troba tots els menús.', 'menu', [sl('Primer', FIRST.slice(0, 2)), sl('Segon', SECOND.slice(0, 2)), sl('Postres', DESSERT)], {}, 'Fixa el primer i el segon, i prova les dues postres.', sayAll('2 × 2 × 2 = 8.'))]),
    lv('Compta menús', 'Multiplica: primers × segons × postres.', [
      countMul('Quants menús diferents hi ha?', [{ name: 'Primers', items: FIRST }, { name: 'Segons', items: SECOND.slice(0, 2) }, { name: 'Postres', items: DESSERT }], 'menús'),
      countMul('I ara?', [{ name: 'Primers', items: FIRST }, { name: 'Segons', items: SECOND }, { name: 'Postres', items: DESSERT }], 'menús'),
      countMul('I ara?', [{ name: 'Primers', items: FIRST.slice(0, 2) }, { name: 'Segons', items: SECOND }], 'menús')]),
    lv('La tarrina', 'Una tarrina amb dues boles de gust diferent. A la tarrina, l\'ordre no importa: maduixa i xocolata és el mateix que xocolata i maduixa.', [
      allQ('Troba totes les tarrines de dos gustos diferents.', 'cup', [sl('Una bola', FLAVOURS.slice(0, 3)), sl('L\'altra', FLAVOURS.slice(0, 3))], { same: true, distinct: true, unordered: true }, 'Maduixa amb cadascun dels altres; després, la xocolata amb els que queden...', sayAll('Si no importa l\'ordre, n\'hi ha menys.')),
      allQ('I amb quatre gustos?', 'cup', [sl('Una bola', FLAVOURS), sl('L\'altra', FLAVOURS)], { same: true, distinct: true, unordered: true }, 'Maduixa amb els altres 3; xocolata amb els 2 que no han sortit; llimona amb el coco.', sayAll('3 + 2 + 1 = 6.'))]),
    lv('El cucurutxo', 'Al cucurutxo una bola va a baix i l\'altra a dalt: aquí l\'ordre sí que importa!', [
      allQ('Troba tots els cucurutxos de dos gustos diferents.', 'cone', [sl('A baix', FLAVOURS.slice(0, 3)), sl('A dalt', FLAVOURS.slice(0, 3))], { same: true, distinct: true }, 'Per a cada gust de baix, hi ha els altres dos a dalt.', sayAll('3 × 2 = 6: el doble que les tarrines.')),
      Pk('Per què hi ha més cucurutxos que tarrines?', ['Al cucurutxo importa quin va a dalt', 'Perquè el cucurutxo és més gran', 'No n\'hi ha més'], 'Maduixa a baix i xocolata a dalt... és el mateix cucurutxo que al revés?', 'Al cucurutxo, maduixa-xocolata i xocolata-maduixa són diferents. A la tarrina, no.')]),
    lv('Es poden repetir', 'I si les dues boles poden ser del mateix gust?', [
      allQ('Troba tots els cucurutxos de dues boles, encara que es repeteixin.', 'cone', [sl('A baix', FLAVOURS.slice(0, 3)), sl('A dalt', FLAVOURS.slice(0, 3))], { same: true }, 'Ara també val maduixa-maduixa!', sayAll('3 × 3 = 9.')),
      N('I amb 4 gustos, quants cucurutxos hi ha si es poden repetir?', 16, 'A baix, 4 gustos. A dalt, també 4.', '4 × 4 = 16.', outfit([{ name: 'A baix', items: FLAVOURS }, { name: 'A dalt', items: FLAVOURS }], {}))]),
    lv('Tarrina o cucurutxo', 'Pensa: importa l\'ordre? Es poden repetir?', [
      N('Quants cucurutxos de 2 gustos diferents es poden fer amb 4 gustos?', 12, 'A baix 4 gustos; a dalt, els 3 que queden.', '4 × 3 = 12.', scoops(FLAVOURS)),
      N('I quantes tarrines de 2 gustos diferents, amb 4 gustos?', 6, 'Són la meitat dels cucurutxos: cada parella surt dues vegades al cucurutxo.', '12 cucurutxos entre 2 = 6 tarrines.', scoops(FLAVOURS, true)),
      Pk('Quins són iguals?', ['Tarrina de maduixa i xocolata, i tarrina de xocolata i maduixa', 'Cucurutxo de maduixa a baix, i de xocolata a baix', 'Cap'], 'A la tarrina no hi ha ni dalt ni baix.', 'A la tarrina l\'ordre no importa: són la mateixa.')]),
    lv('Entrepans', 'A la parada d\'entrepans tries el pa i el farcit.', [
      N('Hi ha 2 pans i 4 farcits. Quants entrepans diferents?', 8, mulHint, '2 × 4 = 8.', outfit([{ name: 'Pans', items: BREAD.slice(0, 2) }, { name: 'Farcits', items: FILLINGS }], {}), 'entrepans'),
      N('Si hi ha 15 entrepans i 3 pans, quants farcits hi ha?', 5, '3 × ? = 15.', '3 × 5 = 15.', outfit([{ name: 'Pans', items: BREAD }], { miss: { name: 'Farcits', e: '🧀' } })),
      N('Hi ha 3 pans, 3 farcits i 2 salses. Quants entrepans?', 18, 'Pans × farcits × salses.', '3 × 3 × 2 = 18.', outfit([{ name: 'Pans', items: BREAD }, { name: 'Farcits', items: FILLINGS.slice(0, 3) }, { name: 'Salses', items: SAUCES }], {}), 'entrepans')]),
    lv('El menú del dia', 'Endevina què falta!', [
      N('Hi ha 18 menús, 3 primers i 3 segons. Quantes postres hi ha?', 2, '3 × 3 × ? = 18.', '3 × 3 = 9, i 9 × 2 = 18.', outfit([{ name: 'Primers', items: FIRST }, { name: 'Segons', items: SECOND }], { miss: { name: 'Postres', e: '🍮' } })),
      N('Hi ha 12 menús, 2 primers i 2 postres. Quants segons hi ha?', 3, '2 × ? × 2 = 12.', '2 × 3 × 2 = 12.', outfit([{ name: 'Primers', items: FIRST.slice(0, 2) }, { name: 'Postres', items: DESSERT }], { miss: { name: 'Segons', e: '🍗' } }))]),
    lv('Repte de la gelateria', 'Pensa bé: importa l\'ordre?', [
      N('Quants cucurutxos de 2 boles es poden fer amb 3 gustos, si es poden repetir?', 9, 'A baix 3, a dalt 3.', '3 × 3 = 9.', scoops(FLAVOURS.slice(0, 3), false, true)),
      N('Quantes tarrines de 2 gustos diferents amb 3 gustos?', 3, 'Maduixa-xocolata, maduixa-llimona...', 'Són 3.', scoops(FLAVOURS.slice(0, 3), true)),
      countMul('Quants menús?', [{ name: 'Primers', items: FIRST }, { name: 'Segons', items: SECOND }, { name: 'Postres', items: DESSERT }], 'menús')])
  ] },
  { name: 'Ordres i podis', sub: 'Podis, banderes, cadenats i salutacions', ico: '🏆', levels: [
    lv('El podi', 'Tres granotes fan una cursa. De quantes maneres poden quedar al podi? Tria qui queda primera, segona i tercera.', [
      allQ('Troba tots els podis possibles.', 'podium', [sl('1a', FROGS.slice(0, 3)), sl('2a', FROGS.slice(0, 3)), sl('3a', FROGS.slice(0, 3))], { same: true, distinct: true }, 'Si guanya la vermella, les altres dues poden quedar de 2 maneres. I si guanya la blava?', sayAll('3 × 2 × 1 = 6.'))]),
    lv('Banderes', 'Pinta una bandera de tres franges, cada franja d\'un color diferent.', [
      allQ('Troba totes les banderes amb vermell, blau i groc.', 'flag', [sl('Dalt', STRIPES.slice(0, 3)), sl('Mig', STRIPES.slice(0, 3)), sl('Baix', STRIPES.slice(0, 3))], { same: true, distinct: true }, 'Per a cada color de dalt, els altres dos poden anar de 2 maneres.', sayAll('3 × 2 × 1 = 6.'))]),
    lv('Quatre a la cursa', 'Ara corren quatre granotes, però el podi només té tres llocs.', [
      N('Quantes granotes poden quedar primeres?', 4, 'Qualsevol de les que corren.', 'Qualsevol de les 4.', lineUp(4, ['1a', '2a', '3a'])),
      N('Si ja saps qui és primera, quantes poden quedar segones?', 3, 'La primera ja no pot ser segona.', 'Les 3 que queden.', lineUp(4, ['1a', '2a', '3a'])),
      N('Quants podis diferents hi ha amb 4 granotes?', 24, '4 per a la primera, 3 per a la segona, 2 per a la tercera.', '4 × 3 × 2 = 24.', lineUp(4, ['1a', '2a', '3a']), 'podis')]),
    lv('El cadenat', 'Un cadenat amb dues rodes. Cada roda va de l\'1 al 3, i els números es poden repetir.', [
      allQ('Troba tots els codis possibles.', 'lock', [sl('Roda 1', DIGITS.slice(0, 3)), sl('Roda 2', DIGITS.slice(0, 3))], { same: true }, 'Comença per 11, 12, 13... i després el 2 a la primera roda.', sayAll('3 × 3 = 9.')),
      N('I amb tres rodes de l\'1 al 2?', 8, '2 × 2 × 2.', '2 × 2 × 2 = 8.', outfit([{ name: 'Cada roda', items: DIGITS.slice(0, 2) }], { slots: ['Roda 1', 'Roda 2', 'Roda 3'].map(r => sl(r, DIGITS.slice(0, 2))) }), 'codis')]),
    lv('Codis secrets', 'Els codis poden ser molts!', [
      N('Un cadenat de 2 rodes, cada una del 0 al 9. Quants codis hi ha?', 100, '10 × 10. També: del 00 al 99.', '10 × 10 = 100.', null, 'codis'),
      N('Un cadenat de 3 rodes de l\'1 al 3. Quants codis?', 27, '3 × 3 × 3.', '3 × 3 × 3 = 27.', null, 'codis'),
      Pk('Quin cadenat és més segur?', ['3 rodes del 0 al 9', '2 rodes del 0 al 9', '3 rodes de l\'1 al 3'], 'Com més codis possibles, més difícil d\'endevinar.', '10 × 10 × 10 = 1.000 codis: el més segur.')]),
    lv('Salutacions', 'Quatre granotes se saluden: cada una dona la mà a cada una de les altres, una sola vegada.', [
      allQ('Troba totes les salutacions.', 'pair', [sl('Una', FROGS.slice(0, 4)), sl('L\'altra', FROGS.slice(0, 4))], { same: true, distinct: true, unordered: true }, 'La vermella saluda les altres 3. La blava, les 2 que no l\'han saludat...', sayAll('3 + 2 + 1 = 6.'))]),
    lv('Comptar salutacions', 'Cada ratlla és una salutació.', [
      N('3 granotes se saluden totes. Quantes salutacions?', 3, 'Dibuixa les ratlles: cada granota amb cada una de les altres.', '3 salutacions.', crowd(3)),
      N('I 5 granotes?', 10, 'La primera saluda 4, la segona 3 més...', '4 + 3 + 2 + 1 = 10.', crowd(5)),
      N('I 6 granotes?', 15, '5 + 4 + 3 + 2 + 1.', '5 + 4 + 3 + 2 + 1 = 15.', crowd(6))]),
    lv('La foto', 'Les granotes es posen en fila per fer-se una foto.', [
      N('De quantes maneres es poden posar 3 granotes en fila?', 6, 'Com al podi: 3 per al primer lloc, 2 per al segon, 1 per al tercer.', '3 × 2 × 1 = 6.', lineUp(3, ['1r', '2n', '3r']), 'maneres'),
      N('I 4 granotes?', 24, '4 × 3 × 2 × 1.', '4 × 3 × 2 × 1 = 24.', lineUp(4, ['1r', '2n', '3r', '4t']), 'maneres')]),
    lv('Capità o parella', 'Importa l\'ordre? Capità i sotscapità no és el mateix que una parella!', [
      N('De 5 granotes, triem capità i sotscapità. De quantes maneres?', 20, '5 per a capità, i les 4 que queden per a sotscapità.', '5 × 4 = 20.', lineUp(5, ['Capità', 'Sotscapità']), 'maneres'),
      N('De 5 granotes, triem una parella per ballar. De quantes maneres?', 10, 'A la parella no hi ha primera ni segona: la meitat de 20.', '20 entre 2 = 10 parelles.', lineUp(5, ['Una', 'L\'altra'], { unordered: true }), 'parelles'),
      Pk('Per què hi ha més maneres de triar capità i sotscapità?', ['Perquè importa qui és el capità', 'Perquè són més granotes', 'No n\'hi ha més'], 'Ana capità i Biel sotscapità... és el mateix que al revés?', 'Amb capità i sotscapità, l\'ordre importa: cada parella compta dues vegades.')]),
    lv('Repte dels ordres', 'Podis, codis i salutacions!', [
      N('Quants podis hi ha amb 5 granotes?', 60, '5 × 4 × 3.', '5 × 4 × 3 = 60.', null, 'podis'),
      N('4 granotes se saluden totes. Quantes salutacions?', 6, '3 + 2 + 1.', '3 + 2 + 1 = 6.', crowd(4)),
      allQ('Troba totes les banderes de 2 franges, de colors diferents, amb 4 colors.', 'flag', [sl('Dalt', STRIPES), sl('Baix', STRIPES)], { same: true, distinct: true }, 'Per a cada color de dalt, 3 de baix.', sayAll('4 × 3 = 12.'))])
  ] },
  { name: 'Dos daus', sub: 'Per què surt tant el 7?', ico: '🎲', levels: [
    lv('Totes les parelles', 'Amb dos daus, cada casella de la taula és una manera de tirar. A dins hi ha la suma.', [
      N('Quantes caselles té la taula?', 36, '6 files per 6 columnes.', '6 × 6 = 36 maneres de tirar dos daus.', dice2Table()),
      sumWays(12), sumWays(7)]),
    lv('Les sumes', 'Busca la suma a la taula i compta quantes vegades hi és.', [sumWays(2), sumWays(6), sumWays(10)]),
    lv('La suma més probable', 'La suma que té més caselles és la que surt més.', [
      R(dice2Table(sumsWith(x => x === 7)), Q('pick', 'Quina suma és la més probable?', '7', 'Busca la suma que surt més vegades a la taula.', 'El 7 té 6 caselles: és la que surt més.', { opts: ['7', '2', '12', '10'] })),
      R(dice2Table(), Q('pick', 'Què és més probable, suma 6 o suma 11?', 'Suma 6', 'Compta les caselles de cada suma.', 'Suma 6: 5 caselles. Suma 11: només 2.', { opts: ['Suma 6', 'Suma 11', 'Igual'], fixed: true })),
      R(dice2Table(), Q('pick', 'I suma 4 o suma 10?', 'Igual', 'Compta les caselles de cada suma.', 'Totes dues tenen 3 caselles: igual de probables.', { opts: ['Suma 4', 'Suma 10', 'Igual'], fixed: true }))]),
    lv('L\'experiment dels dos daus', 'Tira els dos daus moltes vegades i mira quina suma guanya.', [
      exp(dice2(), 'Tira els dos daus almenys 100 vegades.', 100, [1, 10], 'most', { text2: 'Quina suma ha sortit més? Toca la seva barra.' }),
      exp(dice2(), 'Ara tira-hi moltes vegades: fins a 1.000!', 1000, [100], 'pick', { text2: 'Quines sumes surten menys?', opts: ['El 2 i el 12', 'El 7 i el 8', 'Totes igual'], hint: 'Mira les barres dels extrems.', say: 'El 2 i el 12 només tenen una manera cada un: surten molt poc.' })]),
    lv('Segur o impossible', 'Amb dos daus, la suma va del 2 al 12.', [
      spiQ('Tires dos daus. Que la suma sigui 1 és...', 'Impossible', 'La suma més petita és 1 + 1 = 2.', dice2Table()),
      spiQ('Que la suma sigui més gran que 1 és...', 'Segur', 'Sempre és 2 o més.', dice2Table()),
      spiQ('Que la suma sigui 8 és...', 'Possible', 'Hi ha caselles amb un 8: és possible.', dice2Table(sumsWith(x => x === 8))),
      spiQ('Que la suma sigui 13 és...', 'Impossible', 'La més gran és 6 + 6 = 12.', dice2Table())]),
    lv('Dobles', 'Un doble és quan els dos daus fan el mateix: 1 i 1, 2 i 2...', [
      N('De quantes maneres es pot treure un doble?', 6, 'Mira la diagonal de la taula.', 'Hi ha 6 dobles, a la diagonal.', dice2Table(D6.map(a => `${a}-${a}`))),
      R(dice2Table(), Q('pick', 'Treure un doble és ... que treure suma 7.', 'Igual de probable', 'Compta les caselles de cada cosa.', 'Dobles: 6 caselles. Suma 7: 6 caselles. Igual!', { opts: MLI, fixed: true }))]),
    lv('Ordena les sumes', 'De la suma que menys surt a la que més.', [
      orderLikely([{ e: '🎲', cap: 'Suma 2', n: 1, t: 36 }, { e: '🎲', cap: 'Suma 7', n: 6, t: 36 }, { e: '🎲', cap: 'Suma 5', n: 4, t: 36 }, { e: '🎲', cap: 'Suma 11', n: 2, t: 36 }]),
      orderLikely([{ e: '🎲', cap: 'Suma 12', n: 1, t: 36 }, { e: '🎲', cap: 'Suma 8', n: 5, t: 36 }, { e: '🎲', cap: 'Suma 4', n: 3, t: 36 }])]),
    lv('Parell o senar', 'Una suma parella: 2, 4, 6... Una suma senar: 3, 5, 7...', [
      N('Quantes caselles tenen una suma parella?', 18, 'Les sumes parelles fan un dibuix d\'escacs a la taula.', '18 de 36: la meitat.', dice2Table(sumsWith(x => x % 2 === 0))),
      N('I quantes una suma senar?', 18, 'Les que queden.', '36 − 18 = 18.', dice2Table(sumsWith(x => x % 2 === 1))),
      R(dice2Table(), Q('pick', 'Treure suma parella és ... que treure suma senar.', 'Igual de probable', '18 i 18.', '18 contra 18: igual de probable.', { opts: MLI, fixed: true }))]),
    lv('Més o menys que 7', 'Mira la taula: a una banda del 7, i a l\'altra.', [
      N('Quantes caselles sumen més de 7?', 15, 'Compta les sumes 8, 9, 10, 11 i 12.', '5 + 4 + 3 + 2 + 1 = 15.', dice2Table(sumsWith(x => x > 7))),
      N('I quantes sumen menys de 7?', 15, 'Compta les sumes 2, 3, 4, 5 i 6.', '1 + 2 + 3 + 4 + 5 = 15.', dice2Table(sumsWith(x => x < 7))),
      N('I quantes sumen just 7?', 6, 'La diagonal del 7.', '15 + 15 + 6 = 36. Totes!', dice2Table(sumsWith(x => x === 7)))]),
    lv('Repte dels dos daus', 'Ja ets un expert dels dos daus!', [sumWays(9), sumWays(3),
      R(dice2Table(), Q('pick', 'Quina suma és la menys probable?', '12', 'La suma que té menys caselles.', 'El 12 només surt amb 6 + 6.', { opts: ['12', '7', '8', '5'] })),
      spiQ('Que la suma sigui 12 és...', 'Possible', 'Pot sortir 6 i 6.', dice2Table(['6-6']))])
  ] },
  { name: 'Fraccions de sort', sub: '3 de 8, és a dir 3/8', ico: '🥧', levels: [
    lv('Quantes de quantes', 'La probabilitat es diu així: les maneres que van bé, de totes les maneres.', [fracOf(bag({ r: 3, b: 5 }), 'r'), fracOf(bag({ y: 1, g: 3 }), 'y'), fracOf(bag({ r: 2, b: 2, g: 2 }), 'g')]),
    lv('Amb la ratlla', '3 de 8 també s\'escriu com una fracció: 3/8.', [fracOf(bag({ r: 3, b: 5 }), 'r', true), fracOf(bag({ b: 4, y: 1 }), 'b', true), fracOf(bag({ g: 5, r: 5 }), 'g', true)]),
    lv('Ruletes', 'A la ruleta: els trossos d\'un color, de tots els trossos.', [fracOf(spin(['r', 'b', 'b', 'b']), 'r', true), fracOf(spin(['b', 'y', 'b', 'g', 'b', 'y', 'g', 'y']), 'b', true), fracOf(spin(['g', 'g', 'y', 'y']), 'g', true)]),
    lv('El dau', 'Un dau té 6 cares: a baix sempre hi va el 6.', [dieFrac('treure un 6', x => x === 6), dieFrac('treure un número parell', x => x % 2 === 0), dieFrac('treure més de 4', x => x > 4)]),
    lv('Fes la bossa', 'Fes una bossa amb aquesta probabilitat. Hi ha moltes maneres bones!', [
      build('bag', ['r', 'b'], 'Fes que la probabilitat de treure vermella sigui 1 de 4.', k => k.r > 0 && 4 * k.r === k.r + k.b, 'Per cada vermella, posa-hi 3 blaves: 1 de cada 4.', 'De cada 4 boles, 1 és vermella!'),
      build('bag', ['r', 'b'], 'Ara fes que sigui la meitat: 1/2.', k => k.r > 0 && k.r === k.b, 'La meitat vermelles i la meitat blaves.', 'Les mateixes vermelles que blaves: la meitat!'),
      build('bag', ['r', 'b'], 'I ara 3/4.', k => k.r > 0 && 4 * k.r === 3 * (k.r + k.b), 'Per cada 3 vermelles, 1 blava.', '3 de cada 4 vermelles!')]),
    lv('Pinta la ruleta', 'Toca els trossos per canviar-los de color.', [
      build('spin', ['r', 'b', 'y'], 'Pinta la ruleta perquè la probabilitat de vermell sigui 3/8.', k => k.r === 3, 'Tres trossos vermells, de 8.', '3 trossos de 8: 3/8.', { n: 8 }),
      build('spin', ['r', 'b', 'y'], 'Ara fes que el blau sigui la meitat.', k => k.b === 4, 'La meitat de 8 trossos són 4.', '4 de 8: la meitat!', { n: 8 }),
      build('spin', ['r', 'b', 'y'], 'I que el groc sigui 1/4.', k => k.y === 2, 'Un quart de 8 són 2.', '2 de 8 = 1/4.', { n: 8 })]),
    lv('Quina és més gran?', 'Per comparar, mira quina part del total és.', [
      whichBag([{ r: 1, b: 1 }, { r: 1, b: 3 }], 'r'), whichSpin([['r', 'b', 'b', 'b'], ['r', 'r', 'r', 'b']], 'r'), whichBag([{ r: 3, b: 5 }, { r: 1, b: 1 }], 'r')]),
    lv('La meitat', 'Si és la meitat, va al mig del probabilitòmetre.', [
      meter(bag({ r: 3, b: 3 }), 'r', 'Treure vermella. On va?'), meter(spin(['g', 'y', 'y', 'y']), 'g', 'Que surti verd. On va?'), meter(die(), '6', 'Treure un 6. On va?')]),
    lv('De la fracció a la bossa', 'Si saps la fracció i quantes boles hi ha, quantes són vermelles?', [
      N('La probabilitat de treure vermella és 2/5, i hi ha 5 boles. Quantes són vermelles?', 2, 'El número de dalt diu quantes van bé.', '2 de 5 boles.', null, 'boles'),
      N('La probabilitat és 1/4, i hi ha 8 boles. Quantes són vermelles?', 2, '1 de cada 4: 8 boles són dos grups de 4.', '2 de 8 = 1/4.', null, 'boles'),
      N('La probabilitat és 1/2, i hi ha 10 boles. Quantes són vermelles?', 5, 'La meitat de 10.', '5 de 10 = 1/2.', null, 'boles')]),
    lv('Repte de les fraccions', 'Fraccions de sort!', [fracOf(bag({ p: 2, y: 3 }), 'p', true), dieFrac('treure un 1 o un 2', x => x <= 2),
      build('bag', ['r', 'b'], 'Fes que treure blava sigui 2/3.', k => k.b > 0 && 3 * k.b === 2 * (k.r + k.b), 'Per cada 2 blaves, 1 vermella.', 'De cada 3, 2 blaves!')])
  ] },
  { name: 'Jocs justos', sub: 'Qui té avantatge?', ico: '🤝', levels: [
    lv('És just?', 'Un joc és just si tots dos teniu les mateixes maneres de guanyar.', [
      fair('Tires una moneda: amb cara guanyes tu, amb creu guanya la granota. És just?', true, '1 manera cada un: és just.', coin()),
      fair('Tires un dau: amb 1, 2 o 3 guanyes tu; amb 4, 5 o 6, la granota. És just?', true, '3 cares cada un: és just.', die()),
      fair('Tires un dau: amb 1 o 2 guanyes tu; amb 3, 4, 5 o 6, la granota. És just?', false, 'Tu tens 2 cares i la granota 4: no és just.', die())]),
    lv('Ruletes justes', 'Amb vermell guanyes tu, i amb blau la granota.', [
      fair('És justa aquesta ruleta?', true, '2 trossos vermells i 2 de blaus: és justa.', spin(['r', 'b', 'r', 'b'])),
      fair('I aquesta?', false, '3 vermells i 1 blau: tu tens avantatge.', spin(['r', 'r', 'r', 'b'])),
      fair('I aquesta? Amb verd no guanya ningú i es torna a girar.', true, '1 vermell i 1 blau: és justa (el verd no compta).', spin(['r', 'b', 'g', 'g']))]),
    lv('Tria ruleta', 'Si vols guanyar, tria bé!', [
      whichSpin([['r', 'b', 'b', 'b'], ['r', 'r', 'b', 'b'], ['r', 'r', 'r', 'b']], 'r', 'Guanyes amb vermell. Quina ruleta tries? Toca-la.'),
      whichBag([{ r: 2, b: 6 }, { r: 4, b: 4 }], 'r'), whichSpin([['r', 'b', 'y'], ['r', 'r', 'b', 'b', 'y', 'y', 'y', 'y']], 'r', 'Guanyes amb vermell. Quina ruleta tries? Toca-la.')]),
    lv('Jocs de dos daus', 'Recorda la taula dels dos daus: 36 caselles.', [
      fair('Amb suma 7 guanyes tu; amb qualsevol altra, la granota. És just?', false, 'Tu tens 6 caselles i la granota 30.', dice2Table(sumsWith(x => x === 7))),
      fair('Amb suma parella guanyes tu; amb senar, la granota. És just?', true, '18 i 18: és just.', dice2Table(sumsWith(x => x % 2 === 0))),
      fair('Amb més de 7 guanyes tu; amb menys de 7, la granota; amb 7, es torna a tirar. És just?', true, '15 i 15: és just.', dice2Table(sumsWith(x => x > 7)))]),
    lv('Fes-la justa', 'Ara fes tu el joc just. Vermell, la granota; blau, tu.', [
      build('spin', ['r', 'b'], 'Pinta la ruleta perquè el joc sigui just.', k => k.r > 0 && k.r === k.b, 'Els mateixos trossos vermells que blaus.', '4 i 4: just!', { n: 8 }),
      build('bag', ['r', 'b'], 'Omple la bossa perquè el joc sigui just.', k => k.r > 0 && k.r === k.b, 'Les mateixes boles vermelles que blaves.', 'Les mateixes de cada: just!')]),
    lv('Una mica d\'avantatge', 'La granota vol avantatge, però que tu també puguis guanyar.', [
      build('bag', ['r', 'b'], 'Fes una bossa on la granota (vermell) tingui més probabilitat, però tu (blau) també puguis guanyar.', k => k.r > k.b && k.b > 0, 'Més vermelles que blaves, però almenys una blava.', 'La granota té avantatge, però tu pots guanyar.'),
      build('spin', ['r', 'b'], 'I ara una ruleta on tu tinguis avantatge.', k => k.b > k.r, 'Més trossos blaus que vermells.', 'Avantatge per a tu!', { n: 8 })]),
    lv('Caça la trampa', 'La granota és una mica trampossa. Mira bé el dau!', [
      R(die([1, 2, 4, 4, 6, 6]), Q('pick', 'Amb 1, 2 o 3 guanyes tu; amb 4, 5 o 6, la granota. Mira bé el dau. És just?', JUST[1], 'Compta quantes cares van bé per a cada un.', 'Tu només tens 2 cares (1 i 2) i la granota 4: és trampa!', { opts: JUST, fixed: true })),
      R(bag({ r: 5, b: 3 }), Q('pick', 'La granota diu: «Amb vermella guanyo jo, amb blava tu. És just perquè hi ha dos colors.» Té raó?', 'No: hi ha més vermelles', 'No compta quants colors hi ha, sinó quantes boles de cada.', '5 vermelles i 3 blaves: no és just.', { opts: ['No: hi ha més vermelles', 'Sí: hi ha dos colors', 'Sí: és atzar'], fixed: true }))]),
    lv('Dues monedes', 'Tires dues monedes: si surten iguals, guanyes tu; si surten diferents, la granota.', [
      N('Quantes maneres hi ha de tirar dues monedes?', 4, 'Cara-cara, cara-creu...', 'CC, CX, XC i XX: 4.', table(['cara', 'creu'], ['cara', 'creu'], [['iguals', 'diferents'], ['diferents', 'iguals']], [], { corner: '🪙' })),
      N('En quantes surten iguals?', 2, 'Mira la taula.', 'Cara-cara i creu-creu.', table(['cara', 'creu'], ['cara', 'creu'], [['iguals', 'diferents'], ['diferents', 'iguals']], ['0-0', '1-1'], { corner: '🪙' })),
      fair('Aleshores, és just?', true, '2 maneres cada un: és just.', table(['cara', 'creu'], ['cara', 'creu'], [['iguals', 'diferents'], ['diferents', 'iguals']], [], { corner: '🪙' }))]),
    lv('Comptar per saber', 'Per saber si un joc és just, compta les maneres de guanyar de cada un.', [
      N('Tires un dau. Tu guanyes amb un número parell. Quantes cares tens?', 3, '2, 4 i 6.', '3 cares de 6.', die()),
      N('Amb dos daus, guanyes si la suma és 6 o 8. Quantes caselles tens?', 10, 'Suma 6 i suma 8.', '5 + 5 = 10 caselles de 36.', dice2Table(sumsWith(x => x === 6 || x === 8))),
      fair('La granota guanya amb suma 7. Tu amb suma 6 o 8. És just?', false, 'Tu tens 10 caselles i la granota 6: tu tens avantatge!', dice2Table(sumsWith(x => x === 6 || x === 8 || x === 7)))]),
    lv('Repte de la fira', 'L\'últim repte de la fira!', [
      fair('Ruleta de 4: 1 vermell (tu), 3 blaus (la granota). És just?', false, '1 contra 3: no és just.', spin(['r', 'b', 'b', 'b'])),
      build('spin', ['r', 'b', 'y'], 'Pinta una ruleta justa per a tres jugadors: vermell, blau i groc.', k => k.r > 0 && k.r === k.b && k.b === k.y, 'Els tres colors amb els mateixos trossos.', '2, 2 i 2: just per a tots tres!', { n: 6 }),
      fair('Amb dos daus: tu guanyes amb dobles, la granota amb suma 7. És just?', true, '6 caselles cada un: és just!', dice2Table(sumsWith((x, a, b) => a === b || x === 7)))])
  ] }
];
export const CIRCLES = [
  { name: 'Què pot passar?', projects: [0, 1, 2] },
  { name: 'Totes les maneres', projects: [3, 4, 5] },
  { name: 'La gran fira', projects: [6, 7, 8] }
];
export const LEVELS = PROJECTS.flatMap(p => p.levels);
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: a bag to name, a spinner to compare and the first outfits to count
export const POOL = [bagIs({ r: 2, b: 2 }, 'r'), most(spin(['y', 'y', 'y', 'b'])), countMul('Quantes maneres hi ha de vestir la granota?', [{ name: 'Samarretes', items: SHIRTS.slice(0, 2) }, { name: 'Barrets', items: HATS.slice(0, 2) }])];

// What is saved is facts only: { so, stars[90], piscina, exams[3], fulls, tirades }. tirades counts every throw of the experiments (it only
// grows). Marks, XP, level and badges are worked out, never stored. A complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), tirades: Math.max(0, whole(o.tirades)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Mil tirades', what: 'Tira 1.000 vegades als experiments.' },
  { name: 'Deu fulls', what: "Caça bé les errades de deu fulls." },
  { name: 'Mestre de la fira', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.tirades >= 1000, p.fulls >= 10, p.exams.every(e => e === true)];

/* ---------- the exam and «Caça l'errada» ---------- */
// Six different levels of the projects of circle c, at least one of each project, in a random order; each is a copy of the level with p,
// its project, and idx added. A circle that does not exist gives the first
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const draw = p => {
    let idx = at(10, rnd);
    for (let n = 0; n < 10 && used.has(p * 10 + idx); n++) idx = (idx + 1) % 10;
    used.add(p * 10 + idx);
    return { ...PROJECTS[p].levels[idx], p, idx };
  };
  const out = ps.map(draw);
  while (out.length < 6) out.push(draw(ps[at(ps.length, rnd)]));
  return shuffle(out, rnd);
}

// A sheet: three sentences written on the notebook of the fair, each { kind, scene, says, real, opts }: says is the sentence written, real
// the true one (the sentence is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the ones children
// make with chance: the coin that «owes» a tails, the 6 that is «harder», more balls taken for more likely, adding the things to combine
// instead of multiplying them, every greeting counted twice, the 12 as likely as the 7, a little chance taken for none
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const CLAIM = {
  memory(bad, rnd) {
    const n = pickOf([3, 4, 5, 6], rnd), side = pickOf(['cara', 'creu'], rnd), other = side === 'cara' ? 'creu' : 'cara';
    const real = `Després de ${n} ${side}s seguides, ${side} i ${other} continuen igual de probables.`;
    const wrong = [`Després de ${n} ${side}s seguides, ara és més probable ${other}.`, `Després de ${n} ${side}s seguides, ara és més probable ${side}.`];
    return { scene: coin({ hist: Array(n).fill(side) }), real, says: bad ? wrong[0] : real, opts: shuffle([real, ...wrong], rnd) };
  },
  six(bad, rnd) {
    const k = pickOf([1, 6], rnd), o = pickOf([3, 4], rnd);
    const real = `Amb un dau, treure un ${k} és igual de probable que treure un ${o}.`, wrong = [`Amb un dau, treure un ${k} és més difícil que treure un ${o}.`, `Amb un dau, treure un ${k} és impossible.`];
    return { scene: die(), real, says: bad ? wrong[0] : real, opts: shuffle([real, ...wrong], rnd) };
  },
  total(bad, rnd) {
    const [a, b] = pickOf([[{ r: 3, b: 1 }, { r: 5, b: 15 }], [{ r: 2, b: 2 }, { r: 4, b: 12 }], [{ r: 2 }, { r: 6, b: 6 }]], rnd);
    const real = 'És més fàcil treure vermella de la bossa A.', wrong = ['És més fàcil treure vermella de la bossa B, perquè en té més.', 'És igual de fàcil de totes dues bosses.'];
    return { scene: { s: 'many', devs: [bag(a, { k: 'a' }), bag(b, { k: 'b' })], c: 'r' }, real, says: bad ? wrong[0] : real, opts: shuffle([real, ...wrong], rnd) };
  },
  mult(bad, rnd) {
    const [s, h] = pickOf([[3, 4], [2, 3], [4, 2], [3, 3], [2, 4]], rnd);
    const say = n => `Amb ${s} samarretes i ${h} barrets, hi ha ${n} maneres de vestir la granota.`;
    return { scene: outfit([{ name: 'Samarretes', items: SHIRTS.slice(0, s) }, { name: 'Barrets', items: HATS.slice(0, h) }], {}), real: say(s * h), says: say(bad ? s + h : s * h), opts: shuffle([s * h, s + h, s * h + 1].map(say), rnd) };
  },
  greet(bad, rnd) {
    const n = pickOf([3, 4, 5], rnd), g = n * (n - 1) / 2, say = x => `Si ${n} granotes se saluden totes amb totes, hi ha ${x} salutacions.`;
    return { scene: crowd(n), real: say(g), says: say(bad ? n * (n - 1) : g), opts: shuffle([g, n * (n - 1), n * n].map(say), rnd) };
  },
  seven(bad, rnd) {
    const k = pickOf([2, 12], rnd);
    const real = `Amb dos daus, la suma 7 surt més que la suma ${k}.`, wrong = [`Amb dos daus, la suma ${k} surt tant com la suma 7.`, `Amb dos daus, la suma ${k} surt més que la suma 7.`];
    return { scene: dice2Table(), real, says: bad ? wrong[0] : real, opts: shuffle([real, ...wrong], rnd) };
  },
  rare(bad, rnd) {
    const b = pickOf([{ r: 1, b: 9 }, { r: 1, b: 7 }, { r: 1, b: 11 }], rnd), t = sum(b);
    const real = `Treure la bola vermella és possible, però poc probable (1 de ${t}).`, wrong = ['Treure la bola vermella és impossible.', 'Treure la bola vermella és segur.'];
    return { scene: bag(b), real, says: bad ? wrong[0] : real, opts: shuffle([real, ...wrong], rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
