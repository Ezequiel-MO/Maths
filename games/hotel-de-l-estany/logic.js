// L'hotel de l'estany: the maths a hotel does every day. Room numbers and keys, the lift and the floors under the ground, the
// calendar of the bookings, rooms and tables for groups, tiles and towels, the plan of the garden, the restaurant, the bill and
// the numbers of the hotel. The rules and the data, with no page in it: main.js draws the cards and world.js the hotel.
//
// A level is { title, say, warm, make }: make(rnd) gives its rounds, drawn again every time it is played (chance enters only
// through rnd). A round is one guest of the hotel: { type, card, text, ans, hint, say, sp, ... }.
//   num    a number typed on the keypad, taken as soon as it is right (neg: the keypad has a minus key; unit: what follows it)
//   pick   one of opts (ans is the first; main shows them in the order of order, or shuffled)
//   tap    a thing of the card (ans is its key)
//   mark   things of the card switched on until they are exactly ans (✓ sends a set that is not)
//   lift   the lift taken to floor ans (mode 'buttons' or 'arrows'; free: a wrong floor is only told, never a slip)
//   fill   the guests of the card sat in its rooms or tables, a room at a time
//   combo  every menu of the card made, one dish of each column
//   bars   the bars of the card raised to the values they show
import { curs, POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle, whole, within, slots, at, int } from '../../shared/curs.js';

/* ---------- words ---------- */
export const GUESTS = [
  { sp: 'anec', one: "l'ànec", many: 'ànecs', fam: 'la família Ànec' },
  { sp: 'tortuga', one: 'la tortuga', many: 'tortugues', fam: 'la família Tortuga' },
  { sp: 'lludriga', one: 'la llúdriga', many: 'llúdrigues', fam: 'la família Llúdriga' },
  { sp: 'granota', one: 'la granota', many: 'granotes', fam: 'la família Granota' }
];
export const WEEK = ['dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge'];
export const DAYS5 = ['dl', 'dt', 'dc', 'dj', 'dv'];
const MONTHS = [
  { name: 'juny', de: 'de juny', len: 30 }, { name: 'juliol', de: 'de juliol', len: 31 }, { name: 'agost', de: "d'agost", len: 31 },
  { name: 'setembre', de: 'de setembre', len: 30 }, { name: 'octubre', de: "d'octubre", len: 31 }
];
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const euros = n => `${String(n).replace('.', ',')} €`;
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const who = rnd => pickOf(GUESTS, rnd);
// n and the word that goes with it: 1 planta, 2 plantes
const pl = (n, one, many) => `${n} ${n === 1 || n === -1 ? one : many}`;
const hhmm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
const span = mins => { const h = Math.floor(mins / 60), m = mins % 60; return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`; };
export const room = (f, d) => f * 100 + d;
const keyOf = (f, d) => `${f}-${d}`;
// n different things from gen, as far as gen can give them
function draw(rnd, n, gen) {
  const out = [], seen = new Set();
  for (let k = 0; out.length < n && k < 300; k++) { const x = gen(rnd), id = JSON.stringify(x); if (!seen.has(id)) { seen.add(id); out.push(x); } }
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
const Lift = (card, text, ans, hint, say, o = {}) => R('lift', card, text, { ans, hint, say, ...o });
const Fill = (card, text, hint, say, o = {}) => R('fill', card, text, { hint, say, ...o });
const Combo = (card, text, hint, say, o = {}) => R('combo', card, text, { hint, say, ...o });
const Bars = (card, text, hint, say, o = {}) => R('bars', card, text, { hint, say, ...o });
// warm: a warm-up, where the child does and looks before being asked; ask: drawn by the exams (never a warm-up)
const lv = (title, say, make, warm = false, ask = !warm) => ({ title, say, make, warm, ask });
// a level of three rounds from three makers (or one maker three times)
const three = (...fs) => rnd => (fs.length === 1 ? [fs[0], fs[0], fs[0]] : fs).map(f => f(rnd));

/* ---------- 0 · Les claus ---------- */
const rack = (o = {}) => ({ k: 'rack', floors: o.floors || 5, doors: o.doors || 8, tags: !!o.tags, lit: o.lit || [] });
const fd = rnd => [int(rnd, 1, 5), int(rnd, 1, 8)];
const keyTap = tags => rnd => {
  const [f, d] = fd(rnd), g = who(rnd);
  return Tap(rack({ tags }), tags ? `Toca la clau de la planta ${f}, porta ${d}.` : `Toca la clau ${room(f, d)}.`, keyOf(f, d),
    tags ? `Busca la fila de la planta ${f} i, en aquesta fila, la columna ${d}.` : `${room(f, d)}: la primera xifra és la planta (${f}) i les altres, la porta (${d}). Fila ${f}, columna ${d}.`,
    `És la ${room(f, d)}: planta ${f}, porta ${d}.`, { sp: g.sp, room: room(f, d) });
};
const floorOf = what => rnd => {
  const [f, d] = fd(rnd), n = room(f, d), g = who(rnd);
  return what === 'f'
    ? Num({ k: 'tag', n }, `${cap(g.fam)} té la clau ${n}. A quina planta és l'habitació?`, f, `La primera xifra de ${n} és la planta.`, `La ${n} és a la planta ${f}.`, { sp: g.sp, room: n })
    : Num({ k: 'tag', n }, `I la clau ${n}, quina porta obre?`, d, `Després de la planta (${f}) ve la porta: 0${d}.`, `La ${n} és la porta ${d} de la planta ${f}.`, { sp: g.sp, room: n });
};
const litKey = rnd => {
  const [f, d] = fd(rnd);
  return Num(rack({ lit: [keyOf(f, d)] }), 'Quin número té la clau que brilla?', room(f, d), `És a la fila de la planta ${f} i a la columna ${d}: planta ${f}, porta 0${d}.`, `La ${room(f, d)}!`, { room: room(f, d) });
};
const near = rnd => {
  const g = who(rnd), kind = at(3, rnd);
  let f = int(rnd, 1, 5), d = int(rnd, 1, 8);
  if (kind === 0) f = Math.min(f, 4); else if (kind === 1) f = Math.max(f, 2); else d = Math.min(d, 7);
  const [f2, d2] = kind === 0 ? [f + 1, d] : kind === 1 ? [f - 1, d] : [f, d + 1];
  const where = ['just a sobre', 'just a sota', 'del costat, a la dreta'][kind];
  return Num(rack({ lit: [keyOf(f, d)] }), `${cap(g.fam)} dorm a la ${room(f, d)}. Els seus cosins, a l'habitació ${where}. Quin número té?`, room(f2, d2),
    kind < 2 ? `Una planta ${kind ? 'menys' : 'més'}: la primera xifra ${kind ? 'baixa' : 'puja'} 1, i la porta és la mateixa.` : 'A la mateixa planta, una porta més.',
    `La ${room(f2, d2)}: planta ${f2}, porta ${d2}.`, { sp: g.sp, room: room(f2, d2) });
};
const higher = rnd => {
  const fs = shuffle([1, 2, 3, 4, 5], rnd).slice(0, 4), rooms = fs.map(f => room(f, int(rnd, 1, 8))), top = Math.max(...fs), low = Math.min(...fs);
  const hi = rooms[fs.indexOf(top)], lo = rooms[fs.indexOf(low)];
  return at(2, rnd)
    ? Pick({ k: 'tags', ns: rooms }, 'Quina habitació és a la planta més alta?', [String(hi), ...rooms.filter(r => r !== hi).map(String)], 'Mira només la primera xifra: és la planta.', `La ${hi}, a la planta ${top}.`)
    : Pick({ k: 'tags', ns: rooms }, 'Quina habitació és més a prop de la planta baixa?', [String(lo), ...rooms.filter(r => r !== lo).map(String)], 'La planta baixa és la 0: busca la planta més petita.', `La ${lo}, a la planta ${low}.`);
};
const same = rnd => {
  const f = int(rnd, 2, 5), d = int(rnd, 1, 4), n = room(f, d), right = room(f, d + int(rnd, 1, 4));
  const others = [room(d, f), room(f - 1, d + 1), room(f + 1 > 5 ? f - 1 : f + 1, d)].filter(x => x !== right && x !== n);
  return Pick({ k: 'tag', n }, `Quina habitació és a la mateixa planta que la ${n}?`, four(String(right), others.map(String)), `La ${n} és a la planta ${f}: busca la que comença per ${f}.`, `La ${right}, també a la planta ${f}.`);
};
const count = rnd => {
  const [floors, doors] = pickOf([[5, 8], [4, 6], [3, 7], [5, 6], [4, 8], [3, 9]], rnd);
  return Num(rack({ floors, doors }), `Aquest tauler té ${floors} plantes i ${doors} portes a cada planta. Quantes claus hi ha?`, floors * doors,
    `Hi ha ${floors} files de ${doors} claus: ${floors} × ${doors}.`, `${floors} × ${doors} = ${floors * doors} claus.`);
};
const doorSeq = rnd => {
  const kind = at(3, rnd), f = int(rnd, 2, 9);
  if (kind === 0) { const s = 2 * int(rnd, 0, 3) + 1, it = [0, 1, 2, 3].map(i => room(f, s + 2 * i)); return Num({ k: 'seq', items: [...it, null] }, "Al Gran Hotel, les portes del costat del llac són senars. Quina ve després?", room(f, s + 8), 'Les senars van de 2 en 2: 1, 3, 5, 7, 9, 11...', `${it.join(', ')}, ${room(f, s + 8)}.`); }
  if (kind === 1) { const s = 2 * int(rnd, 6, 9), it = [0, 1, 2, 3].map(i => room(f, s - 2 * i)); return Num({ k: 'seq', items: [...it, null] }, 'Al passadís de les parells, la granota grum compta cap enrere. Quina ve després?', room(f, s - 8), 'Cada porta té 2 menys que l\'anterior.', `${it.join(', ')}, ${room(f, s - 8)}.`); }
  const d = int(rnd, 1, 9), it = [1, 2, 3, 4].map(i => room(i, d));
  return Num({ k: 'seq', items: [...it, null] }, 'Aquestes habitacions són una just a sobre de l\'altra. Quina ve després?', room(5, d), 'Cada planta més amunt suma 100.', `${it.join(', ')}, ${room(5, d)}.`);
};
const big = rnd => {
  const kind = at(3, rnd), f = int(rnd, 10, 15), d = int(rnd, 10, 25);
  if (kind === 0) return Num({ k: 'note', icon: 'tower', lines: ['Gran Hotel', `planta ${f} · porta ${d}`] }, `Al Gran Hotel hi ha moltes plantes. Quin número té la porta ${d} de la planta ${f}?`, room(f, d), `Primer la planta (${f}) i després la porta (${d}).`, `La ${room(f, d)}.`);
  if (kind === 1) return Num({ k: 'tag', n: room(f, d) }, `Al Gran Hotel, a quina planta és la ${room(f, d)}?`, f, 'Les dues últimes xifres són la porta: el que queda davant és la planta.', `La ${room(f, d)} és a la planta ${f}.`);
  const d1 = int(rnd, 1, 9);
  return Num({ k: 'note', icon: 'tower', lines: ['Gran Hotel', `planta ${f} · porta ${d1}`] }, `I la porta ${d1} de la planta ${f}?`, room(f, d1), `La porta ${d1} s'escriu 0${d1}: ${f} i 0${d1}.`, `La ${room(f, d1)}.`);
};

/* ---------- 1 · L'ascensor ---------- */
const LO = -2, HI = 5;
const liftCard = (at, mode = 'show') => ({ k: 'lift', lo: LO, hi: HI, at, mode });
const fname = f => f === 0 ? 'la planta baixa (0)' : `la planta ${f}`;
const press = rnd => draw(rnd, 3, r => int(r, 1, 5)).reduce((out, to, i, all) => [...out, (() => {
  const from = i ? all[i - 1] : 0, g = who(rnd);
  return Lift(liftCard(from, 'buttons'), `Porta ${g.one} a la planta ${to}.`, to, `Prem el botó del ${to}.`, `Planta ${to}!`, { sp: g.sp, free: true });
})()], []);
const ride = (lo, hi) => rnd => {
  const g = who(rnd); let from, to;
  do { from = int(rnd, lo, hi); to = int(rnd, lo, hi); } while (from === to || Math.abs(from - to) > 4);
  const up = to > from, n = Math.abs(to - from);
  return Lift(liftCard(from, 'arrows'), `Ets a ${fname(from)}. ${up ? 'Puja' : 'Baixa'} ${n} ${n === 1 ? 'planta' : 'plantes'} amb ${g.one}.`, to,
    `Prem ${up ? '▲' : '▼'} ${n} ${n === 1 ? 'vegada' : 'vegades'} i obre les portes.`, `Hem arribat a ${fname(to)}.`, { sp: g.sp });
};
const under = [rnd => { const g = who(rnd); return Lift(liftCard(0, 'arrows'), `Ets a la planta baixa (0). Baixa 2 plantes amb ${g.one}, fins al pàrquing.`, -2, 'Sota la planta baixa hi ha la -1, i sota la -1, la -2.', 'Planta -2: el pàrquing!', { sp: g.sp }); },
  rnd => { const g = who(rnd); return Lift(liftCard(-2, 'arrows'), `${cap(g.one)} ha aparcat a la planta -2. Puja 3 plantes.`, 1, 'De la -2 puges a la -1, després a la 0 i després a la 1.', 'Planta 1!', { sp: g.sp }); },
  rnd => { const g = who(rnd); return Lift(liftCard(1, 'arrows'), `Ets a la planta 1. Baixa 2 plantes amb ${g.one}.`, -1, 'Baixes a la 0 i després a la -1.', 'Planta -1!', { sp: g.sp }); }];
const down = rnd => {
  const from = int(rnd, 1, 4), n = int(rnd, from + 1, from + 2), to = from - n;
  return Num(liftCard(from), `Ets a la planta ${from} i baixes ${n} plantes. A quina planta arribes?`, to,
    `Compta cap avall planta a planta. Sota la 0 hi ha la -1 i la -2.`, `${from} − ${n} = ${to}.`, { neg: true });
};
const between = rnd => {
  const a = int(rnd, -2, -1), b = int(rnd, 2, 5);
  return Num(liftCard(a), `Quantes plantes puja l'ascensor de la planta ${a} a la planta ${b}?`, b - a,
    `De la ${a} a la 0 ${-a === 1 ? 'hi ha 1 planta' : `hi ha ${-a} plantes`}, i de la 0 a la ${b}, ${b} més.`, `${-a} + ${b} = ${b - a} plantes.`);
};
const twice = rnd => {
  let s, u, d;
  do { s = int(rnd, -1, 3); u = int(rnd, 1, 4); d = int(rnd, 2, 6); } while (s + u > 5 || s + u - d < -2 || s + u - d === s);
  return Num(liftCard(s), `L'ascensor surt de la planta ${s}. Puja ${pl(u, 'planta', 'plantes')} i després en baixa ${d}. On és ara?`, s + u - d,
    `Primer puja: ${s} + ${u} = ${s + u}. Després baixa ${d} des de la ${s + u}.`, `${s} + ${u} − ${d} = ${s + u - d}.`, { neg: true });
};
const load = [rnd => {
  const kg = pickOf([30, 35, 40, 25], rnd), n = int(rnd, 3, 5), w = pickOf([20, 15, 10], rnd), g = pickOf(GUESTS.slice(1, 3), rnd);
  return Num({ k: 'load', max: 300, items: [{ sp: g.sp, kg }, { suit: true, kg: w, n }] }, `${cap(g.one)} pesa ${kg} kg i porta ${n} maletes de ${w} kg. Quants kg porta l'ascensor?`, kg + n * w,
    `Les maletes: ${n} × ${w} = ${n * w} kg. Suma-hi ${g.one}.`, `${kg} + ${n * w} = ${kg + n * w} kg.`, { unit: 'kg', sp: g.sp });
}, rnd => {
  const used = pickOf([110, 125, 140, 85, 160], rnd);
  return Num({ k: 'load', max: 300, used }, `L'ascensor aguanta 300 kg i ja en porta ${used}. Quants kg més hi poden pujar?`, 300 - used, `300 − ${used}.`, `300 − ${used} = ${300 - used} kg.`, { unit: 'kg' });
}, rnd => {
  const w = pickOf([25, 30, 50, 20], rnd);
  return Num({ k: 'load', max: 300, items: [{ suit: true, kg: w, n: 1 }] }, `Una maleta pesa ${w} kg. Quantes maletes soles, com a màxim, poden pujar a l'ascensor de 300 kg?`, 300 / w,
    `Quantes vegades cap ${w} a 300? ${w} × 10 = ${w * 10}...`, `300 ÷ ${w} = ${300 / w} maletes.`);
}];
const trips = rnd => {
  const per = pickOf([4, 5, 6, 8], rnd), n = per * int(rnd, 2, 4) + int(rnd, 1, per - 1), g = who(rnd), t = Math.ceil(n / per);
  return Num({ k: 'group', n, per, sp: g.sp }, `Hi ha ${n} ${g.many} per pujar i a l'ascensor n'hi caben ${per}. Quants viatges ha de fer?`, t,
    `Fes grups de ${per}. ${per * (t - 1)} pugen en ${pl(t - 1, 'viatge', 'viatges')} i ${n - per * (t - 1) === 1 ? 'en queda 1, que també ha de pujar' : `en queden ${n - per * (t - 1)}, que també han de pujar`}!`, `${t} viatges: l'últim amb ${n - per * (t - 1)}.`, { sp: g.sp });
};
const seconds = rnd => {
  const s = pickOf([3, 4, 5], rnd), a = int(rnd, -2, 0), b = int(rnd, 2, 5);
  return Num(liftCard(a), `L'ascensor tarda ${s} segons per planta. Quants segons tarda de la planta ${a} a la ${b}?`, s * (b - a),
    `Primer compta les plantes: de la ${a} a la ${b} n'hi ha ${b - a}. Després, ${b - a} × ${s}.`, `${b - a} plantes × ${s} s = ${s * (b - a)} segons.`, { unit: 's' });
};

/* ---------- 2 · Les reserves ---------- */
const month = (rnd, m = MONTHS[1]) => ({ ...m, first: at(7, rnd) });
const cal = (M, o = {}) => ({ k: 'cal', m: M.name, len: M.len, first: M.first, ...o });
const wd = (M, d) => (M.first + d - 1) % 7;
const dayTap = rnd => {
  const M = month(rnd), kind = at(3, rnd);
  if (kind === 0) { const d = int(rnd, 3, 28); return Tap(cal(M, { pick: true }), `Toca el dia ${d} de ${M.name}.`, String(d), 'Els dies van en ordre, set a cada fila.', `El ${WEEK[wd(M, d)]} ${d}.`); }
  if (kind === 1) { const w = int(rnd, 0, 6), d = ((w - M.first + 7) % 7) + 1; return Tap(cal(M, { pick: true }), `Toca el primer ${WEEK[w]} de ${M.name}.`, String(d), `Busca la columna del ${WEEK[w]} i el primer dia que hi ha.`, `El primer ${WEEK[w]} és el dia ${d}.`); }
  const d = int(rnd, 8, 26); return Tap(cal(M, { pick: true }), `Toca el ${WEEK[wd(M, d)]} ${d}.`, String(d), `El dia ${d} és a la columna del ${WEEK[wd(M, d)]}.`, `El ${WEEK[wd(M, d)]} ${d}.`);
};
const stay = rnd => { const M = month(rnd), n = int(rnd, 2, 5), a = int(rnd, 2, M.len - n - 1); return { M, a, b: a + n, n, g: who(rnd) }; };
const nightsMark = rnd => {
  const { M, a, b, n, g } = stay(rnd);
  return Mark(cal(M, { a, b, pick: true, moon: true }), `${cap(g.fam)} arriba el dia ${a} i se'n va el dia ${b}. Toca les nits que dorm a l'hotel.`,
    Array.from({ length: n }, (_, i) => String(a + i)), `Dorm a l'hotel cada dia des del ${a}. El dia ${b} ja se'n va: aquella nit no hi dorm.`,
    `${n} nits: ${Array.from({ length: n }, (_, i) => a + i).join(', ')}. El dia ${b} se'n va.`, { sp: g.sp });
};
const nights = rnd => {
  const { M, a, b, n, g } = stay(rnd);
  return Num(cal(M, { a, b }), `${cap(g.fam)} arriba el ${a} de ${M.name} i se'n va el ${b}. Quantes nits s'hi queda?`, n, `Les nits són del ${a} al ${b - 1}: el dia que se'n va no compta. ${b} − ${a}.`, `${b} − ${a} = ${n} nits.`, { sp: g.sp, unit: 'nits' });
};
const leave = rnd => {
  const { M, a, b, n, g } = stay(rnd);
  return Num(cal(M, { a }), `${cap(g.fam)} arriba el ${a} de ${M.name} i s'hi queda ${n} nits. Quin dia se'n va?`, b, `${a} + ${n}.`, `${a} + ${n} = ${b}: se'n va el dia ${b}.`, { sp: g.sp });
};
const weekday = rnd => {
  const { M, a, b, n, g } = stay(rnd), w = wd(M, b);
  return Pick(cal(M, { a }), `${cap(g.one)} arriba el ${WEEK[wd(M, a)]} ${a} i s'hi queda ${n} nits. Quin dia de la setmana se'n va?`,
    [WEEK[w], WEEK[(w + 6) % 7], WEEK[(w + 1) % 7], WEEK[(w + 2) % 7]], `Se'n va el dia ${a} + ${n} = ${b}. Busca'l al calendari.`, `Se'n va el ${WEEK[w]} ${b}.`, { sp: g.sp });
};
const crossing = rnd => {
  const i = int(rnd, 0, 3), A = MONTHS[i], B = MONTHS[i + 1], a = A.len - int(rnd, 1, 3), b = int(rnd, 1, 4), g = who(rnd), n = A.len - a + b;
  return Num({ k: 'cal2', m1: A.name, len1: A.len, a, m2: B.name, b }, `${cap(g.fam)} arriba el ${a} ${A.de} i se'n va el ${b} ${B.de}. ${cap(A.name)} té ${A.len} dies. Quantes nits s'hi queda?`, n,
    `Del ${a} al ${A.len} ${A.de} ${A.len - a === 1 ? 'hi ha 1 nit' : `hi ha ${A.len - a} nits`}, i del ${A.len} ${A.de} al ${b} ${B.de}, ${b} més.`, `${A.len - a} + ${b} = ${n} nits.`, { sp: g.sp, unit: 'nits' });
};
const readClock = rnd => {
  const h = int(rnd, 7, 11), m = pickOf([0, 15, 30, 45], rnd), sw = m ? hhmm(m / 5, (h * 5) % 60) : hhmm(12, h * 5);
  return Pick({ k: 'clock', h, m }, 'Quina hora marca el rellotge de recepció?', four(hhmm(h, m), [sw, hhmm(h + 1, m), hhmm(h, (m + 15) % 60), hhmm(h - 1, m)]),
    "L'agulla curta marca l'hora i la llarga, els minuts: a cada número hi ha 5 minuts.", `Són les ${hhmm(h, m)}.`);
};
const wait = [rnd => {
  const m = pickOf([20, 25, 35, 40, 45, 50], rnd), g = who(rnd);
  return Num({ k: 'clocks', a: [13, m], b: [14, 0], la: 'Arriba', lb: "S'obre" }, `Les habitacions s'obren a les 14:00. ${cap(g.one)} arriba a les ${hhmm(13, m)}. Quants minuts ha d'esperar?`, 60 - m,
    `De les ${hhmm(13, m)} a les 14:00 falten els minuts que li queden a l'hora: 60 − ${m}.`, `60 − ${m} = ${60 - m} minuts.`, { sp: g.sp, unit: 'min' });
}, rnd => {
  const m = pickOf([5, 15, 25, 35, 40], rnd), g = who(rnd);
  return Num({ k: 'clocks', a: [11, m], b: [12, 0], la: 'Ara', lb: 'Sortida' }, `Cal deixar l'habitació a les 12:00 i són les ${hhmm(11, m)}. Quants minuts li queden a ${g.one}?`, 60 - m,
    `Fins a les 12:00 falten 60 − ${m} minuts.`, `${60 - m} minuts per fer la maleta.`, { sp: g.sp, unit: 'min' });
}];
const longWait = rnd => {
  const ah = int(rnd, 9, 12), am = pickOf([0, 15, 30, 45], rnd), bh = 14, d = (bh * 60) - (ah * 60 + am), g = who(rnd);
  return Pick({ k: 'clocks', a: [ah, am], b: [bh, 0], la: 'Arriba', lb: "S'obre" }, `${cap(g.one)} arriba a les ${hhmm(ah, am)} i l'habitació s'obre a les 14:00. Quant ha d'esperar?`,
    four(span(d), [span(d + 60), span(Math.max(15, d - 60)), span(d + 30), span(d - 15)]), `Compta les hores senceres fins que pots i després els minuts que falten.`, `${span(d)}.`, { sp: g.sp });
};
const weeks = rnd => {
  const n = int(rnd, 2, 4);
  return at(2, rnd) ? Num({ k: 'note', icon: 'moon', lines: [`${n} setmanes`] }, `Una família es queda ${n} setmanes a l'hotel. Quantes nits són?`, 7 * n, 'Cada setmana té 7 nits.', `${n} × 7 = ${7 * n} nits.`, { unit: 'nits' })
    : Num({ k: 'note', icon: 'moon', lines: [`${7 * n} nits`] }, `Una reserva de ${7 * n} nits: quantes setmanes són?`, n, `Quantes vegades cap el 7 a ${7 * n}?`, `${7 * n} ÷ 7 = ${n} setmanes.`, { unit: 'setmanes' });
};

/* ---------- 3 · Repartir habitacions ---------- */
const group = (rnd, caps = [2, 3, 4]) => { const c = pickOf(caps, rnd), n = c * int(rnd, 2, 4) + int(rnd, 1, c - 1); return { c, n, need: Math.ceil(n / c), g: who(rnd) }; };
const fill = (table, caps) => rnd => {
  const { c, n, need, g } = group(rnd, caps), last = n - c * (need - 1);
  return Fill({ k: 'rooms', cap: c, n, rooms: need + 1, sp: g.sp, table, fill: true },
    table ? `Arriben ${n} ${g.many} a sopar. A cada taula hi caben ${c}. Toca les taules perquè s'asseguin.` : `Arriben ${n} ${g.many}. Cada habitació té ${c} llits. Toca les habitacions per donar llit a tothom.`,
    `Toca ${table ? 'una taula buida' : 'una habitació buida'}: hi entraran ${c}.`,
    `${n} ${g.many}: ${need - 1} ${table ? 'taules plenes' : 'habitacions plenes'} i ${last === 1 ? 'una amb 1' : `una amb ${last}`}. N'han calgut ${need}.`, { sp: g.sp });
};
const roomsNeed = (pic, table = false) => rnd => {
  const { c, n, need, g } = group(rnd, table ? [4, 6] : [2, 3, 4]);
  const card = pic ? { k: 'rooms', cap: c, n, rooms: need + 1, sp: g.sp, table } : { k: 'note', icon: table ? 'table' : 'bed', lines: [`${n} ${g.many}`, `${table ? 'taules' : 'habitacions'} de ${c}`] };
  return Num(card, table ? `Venen ${n} ${g.many} al restaurant i a cada taula hi caben ${c}. Quantes taules calen?` : `Arriben ${n} ${g.many} i les habitacions són de ${c} llits. Quantes habitacions calen?`, need,
    `Fes grups de ${c}: ${c * (need - 1)} en ${need - 1} ${table ? 'taules' : 'habitacions'}, i ${n - c * (need - 1) === 1 ? 'en queda 1, que també necessita' : `en queden ${n - c * (need - 1)}, que també necessiten`} ${table ? 'taula' : 'llit'}.`,
    `${need} ${table ? 'taules' : 'habitacions'}: l'última amb ${n - c * (need - 1)}.`, { sp: g.sp });
};
const empty = rnd => {
  const { c, n, need, g } = group(rnd);
  return Num({ k: 'rooms', cap: c, n, rooms: need + 1, sp: g.sp }, `${n} ${g.many} en habitacions de ${c} llits. Quants llits queden buits?`, need * c - n,
    `Calen ${need} habitacions, amb ${need * c} llits en total. Quants en sobren?`, `${need} × ${c} = ${need * c} llits, i ${need * c} − ${n} = ${need * c - n} de buits.`, { sp: g.sp });
};
const FAMILY = { 5: ['1 triple i 1 doble', '2 triples', '1 triple i 2 dobles', '3 dobles'], 6: ['2 triples', '1 triple i 2 dobles', '3 triples', '1 triple i 1 doble'],
  7: ['1 triple i 2 dobles', '2 triples', '2 triples i 1 doble', '3 dobles'], 8: ['2 triples i 1 doble', '1 triple i 2 dobles', '3 triples', '2 triples'],
  10: ['2 triples i 2 dobles', '3 triples', '3 triples i 1 doble', '1 triple i 2 dobles'] };
const family = rnd => {
  const n = pickOf([5, 6, 7, 8, 10], rnd), g = who(rnd);
  return Pick({ k: 'kinds', n, sp: g.sp }, `${cap(g.fam)} són ${n}. Hi ha habitacions dobles (2 llits) i triples (3 llits). Quines els donaries perquè no quedi cap llit buit, amb les menys habitacions possibles?`,
    FAMILY[n], 'Prova primer amb triples i mira si el que queda es pot fer amb dobles.', `${cap(FAMILY[n][0])}: ${n} llits justos.`, { sp: g.sp });
};
const capacity = rnd => {
  const fl = int(rnd, 2, 4), rooms = pickOf([6, 8, 5], rnd), beds = pickOf([2, 3], rnd);
  return Num({ k: 'note', icon: 'bed', lines: [`${fl} plantes`, `${rooms} habitacions per planta`, `${beds} llits per habitació`] }, `Quants hostes hi caben, en total, en aquestes plantes?`, fl * rooms * beds,
    `Primer, els llits d'una planta: ${rooms} × ${beds}. Després, per ${fl} plantes.`, `${rooms} × ${beds} = ${rooms * beds}, i × ${fl} = ${fl * rooms * beds} hostes.`);
};
const share = rnd => {
  const c = pickOf([2, 3, 4], rnd), each = pickOf([28, 32, 35, 24, 30], rnd), g = who(rnd);
  return Num({ k: 'note', icon: 'bill', lines: [`habitació de ${c}`, euros(c * each)] }, `Una habitació de ${c} llits costa ${c * each} € la nit. Si els ${c} hostes paguen a parts iguals, quant paga cada hoste?`, each,
    `Reparteix ${c * each} € en ${c} parts iguals: ${c * each} ÷ ${c}.`, `${c * each} ÷ ${c} = ${each} €.`, { unit: '€', sp: g.sp });
};
const floorsNeed = rnd => {
  const per = pickOf([12, 10, 8], rnd), n = per * int(rnd, 2, 4) + int(rnd, 1, per - 1), g = who(rnd), need = Math.ceil(n / per);
  return Num({ k: 'note', icon: 'tower', lines: [`${n} ${g.many}`, `${per} llits per planta`] }, `Arriben ${n} ${g.many} i a cada planta hi ha ${per} llits. Quantes plantes calen?`, need,
    `${per} per planta: ${per}, ${2 * per}, ${3 * per}... Si en sobren, cal una planta més.`, `${need} plantes: ${need - 1} de plenes i una amb ${n - per * (need - 1)}.`, { sp: g.sp });
};

/* ---------- 4 · La neteja ---------- */
const rect = (r0, c0, h, w) => { const out = []; for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) out.push(`${r}-${c}`); return out; };
const carpetTap = rnd => {
  const [h, w] = pickOf([[2, 3], [3, 4], [2, 5], [3, 3], [4, 3]], rnd);
  return Mark({ k: 'grid', rows: h, cols: w, cells: rect(1, 1, h, w), fill: true }, "Toca cada rajola de l'habitació per posar-hi moqueta.", rect(1, 1, h, w),
    'Toca les rajoles que encara són de terra.', `${h * w} rajoles: ${h} files de ${w}. ${h} × ${w} = ${h * w}.`, { count: true });
};
const area = rnd => {
  const [h, w] = pickOf([[4, 6], [5, 7], [3, 8], [6, 6], [4, 9], [5, 5]], rnd);
  return Num({ k: 'grid', rows: h, cols: w, cells: rect(1, 1, h, w) }, 'Quantes rajoles de moqueta calen per a aquesta habitació?', h * w, `Compta les rajoles d'una fila (${w}) i multiplica per les files (${h}).`, `${h} × ${w} = ${h * w} rajoles.`);
};
const edge = rnd => {
  const [h, w] = pickOf([[3, 5], [4, 6], [2, 7], [5, 5], [3, 8]], rnd);
  return Num({ k: 'grid', rows: h, cols: w, cells: rect(1, 1, h, w), edge: true, m: true }, "Al voltant de l'habitació hi va sòcol de fusta. Cada costat de rajola fa 1 metre. Quants metres de sòcol calen?", 2 * (h + w),
    `Fes la volta: ${w} + ${h} + ${w} + ${h}.`, `${w} + ${h} + ${w} + ${h} = ${2 * (h + w)} metres.`, { unit: 'm' });
};
const ell = rnd => {
  const w = int(rnd, 5, 7), h1 = int(rnd, 2, 3), h2 = int(rnd, 2, 3), w2 = int(rnd, 2, w - 2);
  const cells = [...rect(1, 1, h1, w), ...rect(h1 + 1, 1, h2, w2)];
  return Num({ k: 'grid', rows: h1 + h2, cols: w, cells }, "Aquesta habitació té forma de L. Quantes rajoles de moqueta calen?", cells.length,
    `Parteix-la en dos rectangles: ${h1} × ${w} i ${h2} × ${w2}.`, `${h1 * w} + ${h2 * w2} = ${cells.length} rajoles.`);
};
const compare = rnd => {
  const [[a, b], [c, d]] = pickOf([[[3, 6], [4, 4]], [[2, 8], [4, 4]], [[5, 3], [4, 4]], [[3, 7], [4, 5]], [[2, 6], [3, 4]]], rnd);
  const A = a * b, B = c * d, order = ['La blava', 'La groga', 'Totes dues igual'], right = A > B ? 0 : A < B ? 1 : 2;
  return Pick({ k: 'two', a: [a, b], b: [c, d] }, 'Quina habitació necessita més moqueta?', [order[right], ...order.filter((_, i) => i !== right)], 'Compta les rajoles de cada una: files × columnes.',
    `La blava en té ${a} × ${b} = ${A} i la groga ${c} × ${d} = ${B}.`, { order });
};
const towels = rnd => {
  const big = pickOf([2, 3], rnd), small = pickOf([2, 3, 4], rnd), n = int(rnd, 4, 8);
  return Num({ k: 'towels', big, small, n }, `Cada habitació necessita ${big} tovalloles grans i ${small} de petites. Quantes tovalloles calen per a ${n} habitacions?`, n * (big + small),
    `Per a una habitació: ${big} + ${small} = ${big + small}. Després, × ${n}.`, `${big + small} × ${n} = ${n * (big + small)} tovalloles.`);
};
const pillows = rnd => {
  const fl = int(rnd, 3, 5), rooms = pickOf([6, 8, 10], rnd), p = pickOf([2, 3, 4], rnd);
  return Num({ k: 'note', icon: 'pillow', lines: [`${fl} plantes`, `${rooms} habitacions per planta`, `${p} coixins per habitació`] }, 'Quants coixins hi ha a tot l\'hotel?', fl * rooms * p,
    `Primer les habitacions: ${fl} × ${rooms}. Després, els coixins.`, `${fl} × ${rooms} = ${fl * rooms} habitacions, i × ${p} = ${fl * rooms * p} coixins.`);
};
const wash = rnd => {
  const per = pickOf([6, 8, 9, 7], rnd), kg = per * int(rnd, 2, 4) + int(rnd, 1, per - 1), n = Math.ceil(kg / per);
  return Num({ k: 'note', icon: 'wash', lines: [`${kg} kg de llençols`, `${per} kg per rentada`] }, `La rentadora renta ${per} kg cada vegada. Hi ha ${kg} kg de llençols. Quantes rentades cal fer?`, n,
    `${per}, ${2 * per}, ${3 * per}... Si en sobra una mica, cal una rentada més.`, `${n} rentades: l'última amb ${kg - per * (n - 1)} kg.`);
};
const cleanTime = rnd => {
  const m = pickOf([15, 20, 30], rnd), n = pickOf([4, 6, 8], rnd);
  return Num({ k: 'note', icon: 'clock', lines: [`${m} minuts per habitació`, `${n} habitacions`] }, `Netejar una habitació costa ${m} minuts. Quants minuts calen per netejar-ne ${n}?`, m * n, `${n} × ${m}.`, `${n} × ${m} = ${m * n} minuts${m * n % 60 === 0 ? `: ${m * n / 60} ${m * n === 60 ? 'hora' : 'hores'}` : ''}.`, { unit: 'min' });
};

/* ---------- 5 · El plànol ---------- */
export const PLACES = { recepcio: 'la recepció', piscina: 'la piscina', font: 'la font', arbre: "l'arbre gran", palmera: 'la palmera', tumbona: 'la tumbona', restaurant: 'el restaurant' };
const garden = rnd => {
  const cells = shuffle(rect(1, 1, 5, 6), rnd), items = {};
  ['piscina', 'font', 'arbre', 'palmera', 'restaurant'].forEach((it, i) => { items[cells[i]] = it; });
  return items;
};
const planCard = (items, o = {}) => ({ k: 'plan', rows: 5, cols: 6, items, ...o });
const rc = key => key.split('-').map(Number);
const coord = key => { const [r, c] = rc(key); return `(${r}, ${c})`; };
const findItem = (items, it) => Object.keys(items).find(k => items[k] === it);
const cellTap = rnd => {
  const r = int(rnd, 1, 5), c = int(rnd, 1, 6);
  return Tap(planCard({}, { pick: true }), `Toca la casella (${r}, ${c}): fila ${r}, columna ${c}.`, `${r}-${c}`, 'Primer la fila (els números de l\'esquerra), després la columna (els de dalt).', `La casella (${r}, ${c}).`);
};
const whereIs = rnd => {
  const items = garden(rnd), it = pickOf(['piscina', 'font', 'arbre', 'palmera'], rnd), [r, c] = rc(findItem(items, it));
  return Pick(planCard(items), `On és ${PLACES[it]}?`, four(`(${r}, ${c})`, [`(${c}, ${r})`, `(${r === 5 ? r - 1 : r + 1}, ${c})`, `(${r}, ${c === 6 ? c - 1 : c + 1})`, `(${r === 1 ? r + 1 : r - 1}, ${c})`]),
    'Primer la fila (la de l\'esquerra) i després la columna (la de dalt).', `${cap(PLACES[it])} és a la fila ${r}, columna ${c}: (${r}, ${c}).`);
};
const place = rnd => {
  const items = garden(rnd), free = rect(1, 1, 5, 6).filter(k => !items[k]), key = pickOf(free, rnd), [r, c] = rc(key);
  return Tap(planCard(items, { pick: true, put: 'tumbona' }), `Posa una tumbona a la casella (${r}, ${c}).`, key, 'Baixa fins a la fila i després ves cap a la dreta fins a la columna.', `Tumbona a la (${r}, ${c})!`);
};
const walk = rnd => {
  const items = { '1-1': 'recepcio' }, a = int(rnd, 1, 5), b = int(rnd, 1, 4), g = who(rnd);
  return Tap(planCard(items, { pick: true, from: '1-1' }), `${cap(g.one)} surt de la recepció (1, 1). Fa ${a} ${a === 1 ? 'pas' : 'passos'} cap a la dreta i ${b} cap avall. Toca on arriba.`, `${1 + b}-${1 + a}`,
    'Cap a la dreta canvia la columna; cap avall canvia la fila.', `Arriba a la (${1 + b}, ${1 + a}).`, { sp: g.sp });
};
const route = rnd => {
  let dr, dc; do { dr = int(rnd, 1, 4); dc = int(rnd, 1, 5); } while (dr === dc);
  const r0 = int(rnd, 1, 5 - dr), c0 = int(rnd, 1, 6 - dc), g = who(rnd), items = { [`${r0}-${c0}`]: 'font', [`${r0 + dr}-${c0 + dc}`]: 'piscina' };
  return Pick(planCard(items), `Com va ${g.one} de la font a la piscina, sense anar en diagonal?`,
    [`${dr} avall i ${dc} a la dreta`, `${dc} avall i ${dr} a la dreta`, `${dr} amunt i ${dc} a la dreta`, `${dr} avall i ${dc} a l'esquerra`],
    'Compta quantes files baixa i quantes columnes avança.', `${dr} files avall i ${dc} columnes a la dreta.`, { sp: g.sp });
};
const steps = rnd => {
  let items, r1, c1, r2, c2;
  for (let k = 0; k < 50; k++) { items = garden(rnd); [r1, c1] = rc(findItem(items, 'font')); [r2, c2] = rc(findItem(items, 'piscina')); if (r1 !== r2 && c1 !== c2) break; }
  const n = Math.abs(r1 - r2) + Math.abs(c1 - c2);
  return Num(planCard(items), `Quantes caselles camina el jardiner de la font a la piscina, sense anar en diagonal?`, n,
    `Files: de la ${r1} a la ${r2}. Columnes: de la ${c1} a la ${c2}. Suma-les.`, `${Math.abs(r1 - r2)} + ${Math.abs(c1 - c2)} = ${n} caselles.`);
};
const mirror = rnd => {
  const r = int(rnd, 1, 4), c = int(rnd, 1, 3);
  return Tap({ k: 'facade', rows: 4, cols: 6, lit: [`${r}-${c}`], pick: true }, "La façana de l'hotel és simètrica, com un mirall. Toca la finestra que fa de mirall de la que brilla.", `${r}-${7 - c}`,
    `Mateixa fila (${r}). Si la groga és a ${c} ${c === 1 ? 'columna' : 'columnes'} de la vora esquerra, la del mirall és a ${c} de la vora dreta.`, `La (${r}, ${7 - c}) fa de mirall de la (${r}, ${c}).`);
};
const scale = rnd => {
  const m = pickOf([2, 5, 10], rnd), r = int(rnd, 1, 5), c1 = int(rnd, 1, 2), c2 = int(rnd, 4, 6), items = { [`${r}-${c1}`]: 'piscina', [`${r}-${c2}`]: 'font' };
  return Num(planCard(items), `Al plànol, cada casella fa ${m} metres. Quants metres hi ha de la piscina a la font?`, (c2 - c1) * m,
    `Compta les caselles que hi ha de l'una a l'altra (${c2 - c1}) i multiplica per ${m}.`, `${c2 - c1} × ${m} = ${(c2 - c1) * m} metres.`, { unit: 'm' });
};
const mirrorMark = rnd => {
  const lit = draw(rnd, 3, r => `${int(r, 1, 4)}-${int(r, 1, 3)}`), ans = lit.map(k => { const [r, c] = rc(k); return `${r}-${7 - c}`; });
  return Mark({ k: 'facade', rows: 4, cols: 6, lit, pick: true, half: true }, "Encén les finestres de la dreta perquè la façana sigui simètrica.", ans,
    'Cada finestra de l\'esquerra té la seva parella a la mateixa fila, a la mateixa distància de la vora dreta.', 'Façana simètrica!');
};

/* ---------- 6 · El restaurant ---------- */
const DISHES = [['sopa', 'amanida', 'macarrons', 'canelons'], ['peix', 'pollastre', 'truita', 'mandonguilles', 'hamburguesa'], ['flam', 'gelat', 'fruita']];
const menuCard = (a, b, c = 0) => ({ k: 'menu', cols: [DISHES[0].slice(0, a), DISHES[1].slice(0, b), ...(c ? [DISHES[2].slice(0, c)] : [])] });
const combos = rnd => {
  const [a, b] = pickOf([[2, 3], [2, 2], [3, 2]], rnd);
  return Combo(menuCard(a, b), "Fes tots els menús diferents: toca un primer i després un segon.", 'Agafa el primer plat de dalt i fes-lo amb cada segon. Després, el següent primer.', `${a} primers × ${b} segons = ${a * b} menús.`);
};
const menus = (three) => rnd => {
  const a = int(rnd, 2, 4), b = int(rnd, 2, 5), c = three ? int(rnd, 2, 3) : 0;
  return Num(menuCard(a, b, c), 'Quants menús diferents es poden fer?', a * b * (c || 1),
    three ? `Cada primer va amb cada segon (${a} × ${b}) i cada un d'aquests, amb cada postres.` : `Cada primer va amb cada segon: ${a} × ${b}.`,
    three ? `${a} × ${b} × ${c} = ${a * b * c} menús.` : `${a} × ${b} = ${a * b} menús.`);
};
const recipe = rnd => {
  const [a, b, what, unit] = pickOf([[4, 8, 'truites', 'ous'], [2, 6, 'pastissos', 'ous'], [3, 9, 'pizzes', 'tomàquets'], [5, 10, 'sopes', 'pastanagues']], rnd), k = int(rnd, 2, 4);
  return Num({ k: 'note', icon: 'recipe', lines: [`${a} ${what}`, `${b} ${unit}`] }, `Per fer ${a} ${what} calen ${b} ${unit}. Quants ${unit} calen per fer-ne ${a * k}?`, b * k,
    `${a * k} ${what} són ${k} vegades ${a}: calen ${k} vegades ${b} ${unit}.`, `${b} × ${k} = ${b * k} ${unit}.`);
};
const breakfast = [rnd => {
  const n = int(rnd, 14, 29), c = 2;
  return Num({ k: 'note', icon: 'croissant', lines: [`${n} hostes`, `${c} croissants cada un`] }, `A l'esmorzar, cada hoste menja ${c} croissants. Quants croissants calen per a ${n} hostes?`, n * c, `${n} × ${c}: el doble de ${n}.`, `${n} × ${c} = ${n * c} croissants.`);
}, rnd => {
  const per = pickOf([10, 6, 8], rnd), n = per * int(rnd, 3, 6) + int(rnd, 1, per - 1);
  return Num({ k: 'note', icon: 'croissant', lines: [`${n} croissants`, `caixes de ${per}`] }, `El forner porta els croissants en caixes de ${per}. Quantes caixes calen per tenir-ne ${n}?`, Math.ceil(n / per),
    `Amb ${Math.floor(n / per)} caixes n'hi ha ${per * Math.floor(n / per)}: no n'hi ha prou.`, `${Math.ceil(n / per)} caixes (i en sobren ${per * Math.ceil(n / per) - n}).`);
}];
const parts = rnd => {
  const [name, d] = pickOf([['La meitat', 2], ['Un terç', 3], ['Un quart', 4]], rnd), n = d * int(rnd, 4, 9), drink = pickOf(['suc de taronja', 'xocolata desfeta', 'cafè amb llet', 'llet freda'], rnd);
  return Num({ k: 'parts', n, d }, `${name} dels ${n} hostes vol ${drink}. Quants hostes són?`, n / d, `Reparteix ${n} en ${d} parts iguals.`, `${n} ÷ ${d} = ${n / d} hostes.`);
};
const bottles = [rnd => {
  const g = pickOf([12, 16, 20, 24], rnd);
  return Num({ k: 'jug', ml: 250 }, `Una ampolla d'1 litre omple 4 gots de 250 ml. Quantes ampolles calen per omplir ${g} gots?`, g / 4, 'Cada ampolla dona 4 gots.', `${g} ÷ 4 = ${g / 4} ampolles.`);
}, rnd => {
  const ml = pickOf([250, 200, 500], rnd);
  return Num({ k: 'jug', ml }, `Quants gots de ${ml} ml s'omplen amb una ampolla d'1 litre (1.000 ml)?`, 1000 / ml, `Quantes vegades cap ${ml} a 1.000?`, `1.000 ÷ ${ml} = ${1000 / ml} gots.`);
}];

/* ---------- 7 · La factura ---------- */
const line = (t, n, u, unit, show = true) => ({ t, q: `${n} ${unit} × ${euros(u)}`, tot: show ? n * u : null, val: n * u });
const bill = (lines, o = {}) => ({ k: 'bill', lines, ...o });
const total = lines => lines.reduce((s, l) => s + l.val, 0);
const readBill = rnd => {
  const n = int(rnd, 2, 5), u = pickOf([40, 45, 50, 60], rnd), e = pickOf([6, 7, 8], rnd), p = int(rnd, 2, 4), L = [line('Habitació', n, u, n === 1 ? 'nit' : 'nits'), line('Esmorzars', p, e, 'esmorzars')];
  const kind = at(3, rnd), card = bill(L, { total: total(L) });
  if (kind === 0) return Num(card, 'Quant costa cada nit?', u, `Mira la línia de l'habitació: nits × preu d'una nit.`, `Cada nit costa ${euros(u)}.`, { unit: '€' });
  if (kind === 1) return Num(card, 'Quants esmorzars hi ha a la factura?', p, 'Mira la línia dels esmorzars.', `${p} esmorzars.`);
  return Num(card, 'Quant s\'ha de pagar en total?', total(L), 'El total és a baix de tot.', `${euros(total(L))}.`, { unit: '€' });
};
const times = rnd => {
  const n = int(rnd, 2, 6), u = pickOf([35, 40, 45, 50, 55, 60, 75], rnd), L = [line('Habitació', n, u, 'nits', false)];
  return Num(bill(L, { blank: 0 }), `${n} nits a ${euros(u)} la nit. Quant fa la línia de l'habitació?`, n * u, u % 10 ? `${n} × ${u}: fes-ho per parts, ${n} × ${u - u % 10} i ${n} × ${u % 10}.` : `${n} × ${u / 10} desenes = ${n * u / 10} desenes.`, `${n} × ${u} = ${n * u} €.`, { unit: '€' });
};
const sum = rnd => {
  const L = [line('Habitació', int(rnd, 2, 4), pickOf([45, 55, 65], rnd), 'nits'), line('Esmorzars', int(rnd, 2, 6), pickOf([6, 8, 9], rnd), 'esmorzars')];
  return Num(bill(L, { total: null }), 'Quin és el total de la factura?', total(L), `Suma les dues línies: ${L[0].val} + ${L[1].val}.`, `${L[0].val} + ${L[1].val} = ${total(L)} €.`, { unit: '€' });
};
const perHead = rnd => {
  const a = int(rnd, 2, 4), d = int(rnd, 2, 4), e = pickOf([5, 6, 8], rnd);
  return Num({ k: 'bill', lines: [{ t: 'Esmorzars', q: `${a} persones × ${d} dies × ${euros(e)}`, tot: null, val: a * d * e }], blank: 0 }, `${a} persones esmorzen ${d} dies a ${euros(e)} l'esmorzar. Quant fa?`, a * d * e,
    `Primer els esmorzars: ${a} × ${d} = ${a * d}. Després, × ${e} €.`, `${a} × ${d} = ${a * d} esmorzars, i × ${e} = ${a * d * e} €.`, { unit: '€' });
};
// one bill filled in three rounds: the room, the breakfasts and the total
const wholeBill = rnd => {
  const n = int(rnd, 2, 5), u = pickOf([40, 45, 50, 60, 70], rnd), p = int(rnd, 2, 6), e = pickOf([5, 6, 8, 9], rnd), g = who(rnd);
  const A = line('Habitació', n, u, 'nits'), B = line('Esmorzars', p, e, 'esmorzars'), T = A.val + B.val;
  const card = (a, b, t) => bill([{ ...A, tot: a ? A.val : null }, { ...B, tot: b ? B.val : null }], { total: t ? T : null, blank: a ? b ? null : 1 : 0, who: g.fam });
  return [Num(card(false, false, false), `La factura de ${g.fam}: primer, quant fa l'habitació?`, A.val, `${n} × ${u}.`, `${n} × ${u} = ${A.val} €.`, { unit: '€', sp: g.sp }),
    Num(card(true, false, false), 'Ara, quant fan els esmorzars?', B.val, `${p} × ${e}.`, `${p} × ${e} = ${B.val} €.`, { unit: '€', sp: g.sp }),
    Num(card(true, true, false), 'I el total de la factura?', T, `${A.val} + ${B.val}.`, `${A.val} + ${B.val} = ${T} €.`, { unit: '€', sp: g.sp })];
};
const change = rnd => {
  const T = pickOf([135, 85, 160, 245, 72, 118, 190], rnd), P = T < 100 ? 100 : T < 200 ? 200 : 300, g = who(rnd);
  return Num(bill([{ t: 'Total', q: '', tot: T, val: T }], { paid: P }), `La factura és de ${T} € i ${g.one} paga amb ${P} €. Quant li has de tornar?`, P - T,
    `Compta des de ${T} fins a ${P}: ${T} i quant fan ${P}?`, `${P} − ${T} = ${P - T} € de canvi.`, { unit: '€', sp: g.sp });
};
const offer = rnd => {
  const [k, pay] = pickOf([[3, 2], [4, 3]], rnd), u = pickOf([40, 55, 60, 70, 80], rnd);
  return Num({ k: 'note', icon: 'tag', lines: [`Oferta ${k} × ${pay}`, `${euros(u)} la nit`] }, `Oferta: ${k} nits pel preu de ${pay}. Cada nit val ${u} €. Quant es paga per ${k} nits?`, pay * u,
    `Només es paguen ${pay} nits: ${pay} × ${u}.`, `${pay} × ${u} = ${pay * u} €: una nit regalada!`, { unit: '€' });
};
const cents = rnd => {
  const [u, one, what] = pickOf([[1.5, 'un cafè', 'cafès'], [2.5, 'un suc', 'sucs'], [0.5, 'una magdalena', 'magdalenes'], [1.5, "una ampolla d'aigua", "ampolles d'aigua"]], rnd), n = int(rnd, 2, 4), t = Math.round(u * n * 100) / 100;
  const f = x => euros(Number.isInteger(x) ? x : x.toFixed(2));
  return Pick({ k: 'note', icon: 'cup', lines: [`${what}: ${f(u)}`] }, `${cap(one)} val ${f(u)}. Quant costen ${n} ${what}?`, four(f(t), [f(t + 1), f(Math.round((Math.floor(u) * n + 0.5) * 100) / 100), f(t * 10), f(t - 0.5)]),
    `Suma ${n} vegades ${f(u)}: primer els euros sencers i després els cèntims (dues meitats fan 1 €).`, `${n} × ${f(u)} = ${f(t)}.`);
};
const wrongLine = rnd => {
  const L = [line('Habitació', int(rnd, 2, 4), pickOf([40, 45, 50], rnd), 'nits'), line('Esmorzars', int(rnd, 3, 6), pickOf([6, 7, 8], rnd), 'esmorzars'), line('Sopars', int(rnd, 2, 4), pickOf([12, 15], rnd), 'sopars')];
  const bad = at(3, rnd), shown = L.map((l, i) => i === bad ? { ...l, tot: l.val + pickOf([10, -10, 5], rnd) } : l);
  return Tap(bill(shown, { pick: true }), 'Una línia de la factura està mal calculada. Toca-la.', `L${bad}`, 'Fes cada multiplicació i mira si dona el que hi diu.', `La línia ${['de l\'habitació', 'dels esmorzars', 'dels sopars'][bad]} havia de fer ${L[bad].val} €.`);
};

/* ---------- 8 · Els números de l'hotel ---------- */
const bars = (values, o = {}) => ({ k: 'bars', labels: DAYS5, values, max: o.max || 50, step: o.step || 10, ...o });
const barTap = rnd => {
  let v; do { v = Array.from({ length: 5 }, () => 5 * int(rnd, 1, 9)); } while (new Set(v).size < 5);
  const kind = at(3, rnd), i = kind === 0 ? v.indexOf(Math.max(...v)) : kind === 1 ? v.indexOf(Math.min(...v)) : at(5, rnd);
  const text = kind === 0 ? 'Toca el dia que van venir més hostes.' : kind === 1 ? 'Toca el dia que van venir menys hostes.' : `Toca el dia que van venir ${v[i]} hostes.`;
  return Tap(bars(v, { pick: true }), text, `B${i}`, kind < 2 ? `Busca la barra ${kind ? 'més baixa' : 'més alta'}.` : `Segueix la línia del ${v[i]} fins que toqui una barra.`, `El ${WEEK[i]}: ${v[i]} hostes.`);
};
const barRead = rnd => {
  const v = Array.from({ length: 5 }, () => 5 * int(rnd, 2, 9)), i = at(5, rnd);
  return Num(bars(v), `Quants hostes van venir el ${WEEK[i]}?`, v[i], `Mira on arriba la barra del ${WEEK[i]}. Entre dues ratlles hi ha el 5 del mig.`, `El ${WEEK[i]} van venir ${v[i]} hostes.`);
};
const barDiff = rnd => {
  const v = draw(rnd, 5, r => 5 * int(r, 2, 9)); let i, j; do { i = at(5, rnd); j = at(5, rnd); } while (v[i] <= v[j]);
  return Num(bars(v), `Quants hostes més van venir el ${WEEK[i]} que el ${WEEK[j]}?`, v[i] - v[j], `Llegeix les dues barres i resta: ${WEEK[i]} menys ${WEEK[j]}.`, `${v[i]} − ${v[j]} = ${v[i] - v[j]} hostes més.`);
};
const pict = rnd => {
  const v = Array.from({ length: 5 }, () => 5 * int(rnd, 2, 9)), i = at(5, rnd);
  return Num({ k: 'pict', labels: DAYS5, values: v, per: 10 }, `Cada llit del dibuix són 10 hostes, i mig llit, 5. Quants hostes van dormir a l'hotel el ${WEEK[i]}?`, v[i],
    `Compta els llits sencers de 10 en 10 i, si n'hi ha un de mig, suma-hi 5.`, `El ${WEEK[i]}: ${v[i]} hostes.`);
};
const table = rnd => {
  const sp = shuffle(GUESTS.slice(), rnd).slice(0, 3), rows = sp.map(() => [int(rnd, 2, 9), int(rnd, 2, 9), int(rnd, 2, 9)]), i = at(3, rnd);
  return Num({ k: 'table', heads: ['dv', 'ds', 'dg'], rows: sp.map((g, j) => [cap(g.many), ...rows[j]]) }, `${sp[i].sp === 'anec' ? 'Quants' : 'Quantes'} ${sp[i].many} van venir en total, aquest cap de setmana?`,
    rows[i].reduce((s, n) => s + n, 0), `Suma els tres números de la fila «${cap(sp[i].many)}».`, `${rows[i].join(' + ')} = ${rows[i].reduce((s, n) => s + n, 0)}.`);
};
const tally = rnd => {
  const what = ['Torrades', 'Croissants', 'Fruita', 'Ous'], v = draw(rnd, 4, r => int(r, 3, 14)), top = what[v.indexOf(Math.max(...v))];
  return Pick({ k: 'tally', what, values: v }, "La cuinera ha apuntat què demanen per esmorzar. Què es demana més?", [top, ...what.filter(w => w !== top)],
    'Compta els paquets de 5 ratlles i les que queden.', `${top}: ${Math.max(...v)} vegades.`);
};
const mean = rnd => {
  const m = 5 * int(rnd, 4, 7), d = 5 * int(rnd, 1, 3), v = shuffle([m - d, m, m + d], rnd);
  return Num(bars(v, { labels: DAYS5.slice(0, 3) }), `Dilluns van venir ${v[0]} hostes, dimarts ${v[1]} i dimecres ${v[2]}. Si cada dia n'haguessin vingut els mateixos, quants serien?`, m,
    `Suma els tres dies (${v[0] + v[1] + v[2]}) i reparteix-ho en 3.`, `${v[0] + v[1] + v[2]} ÷ 3 = ${m} hostes cada dia: és la mitjana.`);
};
const makeBars = rnd => {
  const v = Array.from({ length: 4 }, () => 5 * int(rnd, 1, 9));
  return Bars({ k: 'bars', labels: DAYS5.slice(0, 4), values: v, max: 50, step: 10, set: true }, `Fes el gràfic dels hostes: ${v.map((x, i) => `${WEEK[i]} ${x}`).join(', ')}.`, 'Toca cada columna a l\'altura del seu número. Entre dues ratlles hi ha el 5.', 'Gràfic fet!');
};
const BAGS = [{ vermella: 5, blava: 1 }, { vermella: 2, blava: 6 }, { groga: 4, blava: 1 }, { verda: 3, groga: 7 }];
const NAMES = { vermella: 'vermella', blava: 'blava', groga: 'groga', verda: 'verda' };
const chance = [rnd => {
  const b = pickOf(BAGS, rnd), [x, y] = Object.keys(b), most = b[x] > b[y] ? x : y;
  return Pick({ k: 'bag', balls: b }, 'A la tómbola de l\'hotel, si treus una bola sense mirar, de quin color és més fàcil que surti?', [`${cap(NAMES[most])}`, cap(NAMES[most === x ? y : x]), 'Totes igual'],
    'El color que hi ha més vegades surt més fàcilment.', `${cap(NAMES[most])}: n'hi ha ${b[most]}.`, { order: [cap(NAMES[x]), cap(NAMES[y]), 'Totes igual'] });
}, rnd => {
  const b = pickOf(BAGS, rnd), cols = Object.keys(b), missing = Object.keys(NAMES).find(c => !cols.includes(c)), kind = at(3, rnd);
  const [q, ans] = kind === 0 ? [`treure una bola ${missing}`, 'Impossible'] : kind === 1 ? [`treure una bola ${cols[0]}`, 'Possible'] : [`treure una bola ${cols[0]} o ${cols[1]}`, 'Segur'];
  return Pick({ k: 'bag', balls: b }, `Treus una bola sense mirar. És segur, possible o impossible ${q}?`, [ans, ...['Segur', 'Possible', 'Impossible'].filter(o => o !== ans)],
    'Si no n\'hi ha cap, és impossible. Si totes ho són, és segur.', `${ans}.`, { order: ['Segur', 'Possible', 'Impossible'] });
}];

/* ---------- the projects ---------- */
const anyOf = fs => rnd => pickOf(fs, rnd)(rnd);
export const PROJECTS = [
  { name: 'Les claus', sub: 'Planta i porta: el número de cada habitació', set: 'lobby', levels: [
    lv('El tauler de claus', 'Cada clau penja a la fila de la seva planta i a la columna de la seva porta. Planta 2, porta 3: la 203.', three(keyTap(true)), true),
    lv('Busca la clau', 'Ara les claus no porten el número. La primera xifra és la planta; les altres, la porta.', three(keyTap(false))),
    lv('Quina planta?', 'El número de la clau ho diu tot: primer la planta, després la porta.', three(floorOf('f'), floorOf('d'), floorOf('f'))),
    lv('Escriu el número', 'Planta 4, porta 6 s\'escriu 406: el 0 guarda el lloc de les desenes.', three(litKey)),
    lv('A sobre i a sota', 'Una planta més amunt, el número creix 100. Una porta més enllà, creix 1.', three(near)),
    lv('Més amunt, més avall', 'Quina està més amunt? Mira la primera xifra.', three(higher, higher, same)),
    lv('Totes les claus', 'Files i columnes: el tauler és una multiplicació.', three(count)),
    lv('Senars i parells', 'Al Gran Hotel les portes segueixen sèries. Descobreix la regla!', three(doorSeq)),
    lv('El Gran Hotel', 'Un hotel de més de deu plantes: els números de les habitacions són de quatre xifres.', three(big)),
    lv('Repte de les claus', 'Una mica de tot. Endavant!', three(keyTap(false), near, big))] },
  { name: "L'ascensor", sub: 'Puja, baixa i les plantes sota terra', set: 'lift', levels: [
    lv('Prem el botó', "Toca un botó i mira l'ascensor: va a la planta que has premut.", press, true),
    lv('Puja i baixa', 'Ara amb les fletxes: cada toc, una planta. Quan hi siguis, obre les portes.', three(ride(0, 5)), true),
    lv('Sota terra', 'Sota la planta baixa (0) hi ha el pàrquing: la -1 i la -2.', rnd => under.map(f => f(rnd)), true),
    lv('On arribes?', 'Compta les plantes cap avall. Passada la 0, els números porten un menys.', three(down)),
    lv('Quantes plantes?', 'De sota terra fins a dalt: compta fins a la 0 i després fins a la planta.', three(between)),
    lv('Dos viatges', "L'ascensor puja i després baixa. On s'atura?", three(twice)),
    lv('Pes màxim', "L'ascensor aguanta 300 kg. Ni un més!", rnd => load.map(f => f(rnd))),
    lv('Quants viatges?', 'Si no hi caben tots, cal fer més viatges.', three(trips)),
    lv('Segons per planta', "Quant tarda l'ascensor? Plantes per segons.", three(seconds)),
    lv("Repte de l'ascensor", 'Una mica de tot. Endavant!', three(down, twice, trips))] },
  { name: 'Les reserves', sub: 'El calendari, les nits i les hores', set: 'lobby', levels: [
    lv('El calendari', 'Cada fila és una setmana, de dilluns a diumenge.', three(dayTap), true),
    lv('Les nits', 'Una nit a l\'hotel és cada dia que hi vas a dormir. El dia que te\'n vas no compta!', three(nightsMark), true),
    lv('Quantes nits?', 'De l\'arribada a la sortida: resta els dos dies.', three(nights)),
    lv('Quin dia se\'n va?', 'El dia d\'arribada més les nits.', three(leave)),
    lv('El dia de la setmana', 'Busca al calendari el dia que se\'n va.', three(weekday)),
    lv('Canvi de mes', 'Quan s\'acaba el mes, es continua comptant a l\'altre.', three(crossing)),
    lv('El rellotge', "L'agulla curta, les hores. La llarga, els minuts.", three(readClock)),
    lv('Quants minuts?', 'Fins a l\'hora en punt hi ha els minuts que falten per arribar a 60.', rnd => [wait[0](rnd), wait[1](rnd), wait[0](rnd)]),
    lv('Hores i minuts', 'Esperes llargues: primer les hores, després els minuts.', three(longWait)),
    lv('Repte de les reserves', 'Una mica de tot. Endavant!', three(nights, weekday, anyOf(wait)))] },
  { name: 'Repartir habitacions', sub: 'Grups, llits i el que sobra', set: 'rooms', levels: [
    lv('Omple les habitacions', 'Toca una habitació i hi entren tants hostes com llits té.', three(fill(false, [2])), true),
    lv('De 3 i de 4 llits', 'Habitacions més grans. Quantes en calen?', three(fill(false, [3, 4])), true),
    lv('Quantes habitacions?', "Si queden hostes sense llit, cal una habitació més, encara que no s'ompli.", three(roomsNeed(true))),
    lv('Llits buits', "Quants llits sobren a l'última habitació?", three(empty)),
    lv('Sense dibuix', 'Ara sense dibuix: fes els grups de cap.', three(roomsNeed(false))),
    lv('Una família gran', 'Dobles i triples, sense cap llit buit.', three(family)),
    lv('Plantes plenes', 'Llits per habitació, habitacions per planta...', three(capacity)),
    lv('Repartir el preu', 'Si paguen a parts iguals, es divideix.', three(share)),
    lv('Quantes plantes?', 'Grups grans per plantes senceres.', three(floorsNeed)),
    lv('Repte de les habitacions', 'Una mica de tot. Endavant!', three(roomsNeed(false), empty, capacity))] },
  { name: 'La neteja', sub: 'Rajoles, sòcol i tovalloles', set: 'clean', levels: [
    lv('Posa la moqueta', 'Toca cada rajola. Compta-les: files per columnes.', three(carpetTap), true),
    lv('Files per columnes', 'No cal comptar-les una a una: files × columnes.', three(area)),
    lv('El sòcol', 'El sòcol fa la volta a l\'habitació: suma els quatre costats.', three(edge)),
    lv('Moqueta i sòcol', 'Moqueta a dins (rajoles), sòcol a la vora (metres).', three(area, edge, area)),
    lv('Habitacions en L', 'Parteix l\'habitació en dos rectangles.', three(ell)),
    lv('Quina és més gran?', 'Compta les rajoles de les dues.', three(compare)),
    lv('Les tovalloles', 'Primer per a una habitació, després per a totes.', three(towels)),
    lv('Coixins de tot l\'hotel', 'Plantes, habitacions i coixins: tres números per multiplicar.', three(pillows)),
    lv('La bugaderia', 'Rentades i minuts.', three(wash, cleanTime, wash)),
    lv('Repte de la neteja', 'Una mica de tot. Endavant!', three(ell, edge, pillows))] },
  { name: 'El plànol', sub: 'Files, columnes i camins pel jardí', set: 'garden', levels: [
    lv('Toca la casella', 'Una casella es diu amb dos números: primer la fila, després la columna.', three(cellTap), true),
    lv('On és?', 'Busca la cosa al plànol i digues la seva fila i la seva columna.', three(whereIs)),
    lv('Posa-ho al plànol', 'Posa cada tumbona al seu lloc.', three(place)),
    lv('Camina pel jardí', 'Passos a la dreta i passos avall.', three(walk)),
    lv('Quin camí?', 'Quantes files i quantes columnes?', three(route)),
    lv('Quantes caselles?', 'Sense diagonals: files més columnes.', three(steps)),
    lv('La façana mirall', 'La façana és simètrica: la meitat dreta és el mirall de l\'esquerra.', three(mirror)),
    lv('Metres de veritat', 'Al plànol tot és petit: cada casella són uns quants metres.', three(scale)),
    lv('Completa la façana', 'Encén les finestres que falten perquè sigui simètrica.', three(mirrorMark), false, false),
    lv('Repte del plànol', 'Una mica de tot. Endavant!', three(whereIs, steps, mirror))] },
  { name: 'El restaurant', sub: 'Taules, menús i receptes', set: 'restaurant', levels: [
    lv('Seu a taula', 'Toca una taula i s\'hi asseuen tants hostes com cadires té.', three(fill(true, [4, 6])), true),
    lv('Quantes taules?', 'Grups per taules: si en sobren, una taula més.', three(roomsNeed(true, true))),
    lv('Fes els menús', 'Un primer i un segon: quants menús diferents hi ha?', three(combos), true),
    lv('Quants menús?', 'Cada primer amb cada segon: es multiplica.', three(menus(false))),
    lv('Amb postres', 'Tres plats: tres números per multiplicar.', three(menus(true))),
    lv('La recepta', 'Per a més plats, més ingredients, en la mateixa proporció.', three(recipe)),
    lv("L'esmorzar", 'Croissants per a tothom!', rnd => [breakfast[0](rnd), breakfast[1](rnd), breakfast[1](rnd)]),
    lv('Meitats i quarts', 'La meitat, un terç, un quart: es divideix.', three(parts)),
    lv('Gots i ampolles', 'Un litre són 1.000 mil·lilitres.', rnd => [bottles[0](rnd), bottles[1](rnd), bottles[0](rnd)]),
    lv('Repte del restaurant', 'Una mica de tot. Endavant!', three(menus(true), recipe, parts))] },
  { name: 'La factura', sub: 'Nits, esmorzars i el canvi', set: 'desk', levels: [
    lv('Llegeix la factura', 'Cada línia diu quantes coses, quant val cada una i quant fan.', three(readBill), true),
    lv('Nits per preu', 'Les nits per el preu d\'una nit.', three(times)),
    lv('Suma la factura', 'El total és la suma de totes les línies.', three(sum)),
    lv('Per persona i per dia', 'Persones × dies × preu.', three(perHead)),
    lv('La factura sencera', 'Omple la factura línia a línia.', wholeBill),
    lv('El canvi', 'Compta des del total fins al que paguen.', three(change)),
    lv('Ofertes', 'Amb l\'oferta, una nit no es paga.', three(offer)),
    lv('Els cèntims', 'Dues meitats d\'euro fan un euro.', three(cents)),
    lv('Troba l\'errada', 'Revisa cada línia abans de cobrar.', three(wrongLine)),
    lv('Repte de la factura', 'Una mica de tot. Endavant!', three(times, change, offer))] },
  { name: "Els números de l'hotel", sub: "Gràfics, taules i l'atzar", set: 'facade', levels: [
    lv('Llegeix el gràfic', 'Cada barra és un dia: com més alta, més hostes.', three(barTap), true),
    lv('Quants hostes?', 'Segueix el cim de la barra fins als números.', three(barRead)),
    lv('Quants més?', 'Llegeix dues barres i resta.', three(barDiff)),
    lv('El pictograma', 'Cada dibuix val més d\'un hoste.', three(pict)),
    lv('La taula', 'Files i columnes de números: suma una fila.', three(table)),
    lv('El més demanat', 'Les ratlles es compten de 5 en 5.', three(tally)),
    lv('La mitjana', 'Si es repartís igual cada dia, quants serien?', three(mean)),
    lv('Fes el gràfic', 'Ara el gràfic el fas tu.', three(makeBars), true),
    lv('La tómbola', 'Segur, possible o impossible?', rnd => [chance[0](rnd), chance[1](rnd), chance[1](rnd)]),
    lv("Repte de l'hotel", 'Una mica de tot. Endavant!', three(barDiff, mean, anyOf(chance)))] }
];
export const CIRCLES = [
  { name: 'La recepció', projects: [0, 1, 2] },
  { name: 'Les habitacions', projects: [3, 4, 5] },
  { name: 'El restaurant i la caixa', projects: [6, 7, 8] }
];
export const LEVELS = PROJECTS.flatMap(p => p.levels);
const cursus = curs({ PROJECTS, CIRCLES, field: 'lv', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina, at the pool of the hotel: a key, the lift and a first bill
export const POOL = [
  Tap(rack({ tags: true }), 'Toca la clau de la planta 2, porta 3.', '2-3', 'Busca la fila de la planta 2 i, en aquesta fila, la columna 3.', 'La 203: planta 2, porta 3!', { sp: 'anec', room: 203 }),
  Lift(liftCard(0, 'buttons'), 'Porta la tortuga a la planta 3.', 3, 'Prem el botó del 3.', 'Planta 3!', { sp: 'tortuga', free: true }),
  Num(bill([line('Habitació', 2, 30, 'nits', false)], { blank: 0 }), '2 nits a 30 € la nit. Quant fa?', 60, '30 + 30.', '2 × 30 = 60 €.', { unit: '€', sp: 'lludriga' })
];

// What is saved is facts only: { so, lv[90], piscina, exams[3], fulls, clients }. clients counts every guest served right in a level (it
// only grows). Marks, XP, level and badges are worked out, never stored. A complete progress inside its limits from any value at all
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const lv = slots(o.lv, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, lv, piscina: o.piscina === true || lv.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), clients: Math.max(0, whole(o.clients)) };
}
// n more guests served: a new progress
export const servedIn = (p, n) => ({ ...cursus.copy(p), clients: p.clients + Math.max(0, whole(n)) });
export const BADGES = [
  { name: 'Hotel obert', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Cent clients', what: 'Atén bé cent clients.' },
  { name: 'Deu fulls', what: "Caça bé les errades de deu fulls." },
  { name: 'Hotel de tres estrelles', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.clients >= 100, p.fulls >= 10, p.exams.every(e => e === true)];
// the stars on the sign of the hotel: one for every exam passed
export const starsOf = p => p.exams.filter(Boolean).length;

/* ---------- what a thing of a card is, said when it is touched ---------- */
export function tapSay(card, key) {
  if (card.k === 'rack') { const [f, d] = key.split('-').map(Number); return `Aquesta és la ${room(f, d)}: planta ${f}, porta ${d}.`; }
  if (card.k === 'cal') { const d = +key; return `Aquest és el ${WEEK[(card.first + d - 1) % 7]} ${d}.`; }
  if (card.k === 'plan' || card.k === 'facade') return `Aquesta és la casella ${coord(key)}.`;
  if (card.k === 'bars') { const i = +key.slice(1); return `El ${WEEK[i]} van venir ${card.values[i]} hostes.`; }
  if (card.k === 'bill') { const l = card.lines[+key.slice(1)]; return `${l.q} = ${l.val} €: aquesta línia està bé.`; }
  return '';
}

/* ---------- the exam and «Caça l'errada» ---------- */
// Six guests of the projects of circle c, at least one of each project, in a random order. Each is a round of a level that is not a
// warm-up (where nothing can go wrong), answered with the keypad, the options or a tap: { p, idx, title, round }. A circle that does not
// exist gives the first
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

// A sheet: three lines written in the book of the reception, each { kind, card, says, real, opts }: says is the line written, real the true
// one (the line is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the ones children make: the
// floor and the door swapped, the floors under the ground forgotten, the days counted instead of the nights, the guests left over with no
// room, the edge counted instead of the tiles, a product or a change gone wrong, the dishes added instead of multiplied, a bar misread
const CLAIM = {
  floor(bad, rnd) {
    const f = int(rnd, 2, 5); let d; do { d = int(rnd, 1, 8); } while (d === f || d === f - 1);
    const n = room(f, d), say = x => `L'habitació ${n} és a la planta ${x}.`;
    return { card: { k: 'tag', n }, real: say(f), says: say(bad ? d : f), opts: shuffle([f, d, f - 1].map(say), rnd) };
  },
  lift(bad, rnd) {
    const s = int(rnd, 1, 3), n = s + int(rnd, 1, 2), to = s - n, say = x => `Si ets a la planta ${s} i baixes ${n} plantes, arribes a la ${x}.`;
    return { card: liftCard(s), real: say(to), says: say(bad ? -to : to), opts: shuffle([to, -to, to + 1].map(say), rnd) };
  },
  nights(bad, rnd) {
    const M = month(rnd), a = int(rnd, 3, 20), n = int(rnd, 2, 5), say = x => `Del ${a} al ${a + n} de ${M.name} són ${x} nits.`;
    return { card: cal(M, { a, b: a + n }), real: say(n), says: say(bad ? n + 1 : n), opts: shuffle([n, n + 1, n - 1].map(say), rnd) };
  },
  rooms(bad, rnd) {
    const { c, n, need, g } = group(rnd), say = x => `Per a ${n} ${g.many} en habitacions de ${c} calen ${x} habitacions.`;
    return { card: { k: 'rooms', cap: c, n, rooms: need + 1, sp: g.sp }, real: say(need), says: say(bad ? need - 1 : need), opts: shuffle([need, need - 1, need + 1].map(say), rnd) };
  },
  carpet(bad, rnd) {
    const [h, w] = pickOf([[3, 5], [4, 6], [3, 7], [4, 5]], rnd), say = x => `Aquesta habitació necessita ${x} rajoles de moqueta.`;
    return { card: { k: 'grid', rows: h, cols: w, cells: rect(1, 1, h, w) }, real: say(h * w), says: say(bad ? 2 * (h + w) : h * w), opts: shuffle([h * w, 2 * (h + w), h + w].map(say), rnd) };
  },
  bill(bad, rnd) {
    const n = int(rnd, 3, 4), u = pickOf([45, 35, 55], rnd), say = x => `${n} nits a ${u} € fan ${x} €.`;
    return { card: bill([line('Habitació', n, u, 'nits', false)], { blank: 0 }), real: say(n * u), says: say(bad ? n * u - 10 : n * u), opts: shuffle([n * u, n * u - 10, n * u + 10].map(say), rnd) };
  },
  change(bad, rnd) {
    const T = pickOf([135, 165, 125, 145], rnd), say = x => `La factura és de ${T} € i paguen amb 200 €: el canvi és de ${x} €.`;
    return { card: bill([{ t: 'Total', q: '', tot: T, val: T }], { paid: 200 }), real: say(200 - T), says: say(bad ? 210 - T : 200 - T), opts: shuffle([200 - T, 210 - T, 190 - T].map(say), rnd) };
  },
  menus(bad, rnd) {
    const a = int(rnd, 2, 4), b = int(rnd, 3, 5), say = x => `Amb ${a} primers i ${b} segons es poden fer ${x} menús diferents.`;
    return { card: menuCard(a, b), real: say(a * b), says: say(bad ? a + b : a * b), opts: shuffle([a * b, a + b, a * b + 1].map(say), rnd) };
  },
  chart(bad, rnd) {
    const v = draw(rnd, 5, r => 5 * int(r, 2, 9)); let i, j; do { i = at(5, rnd); j = at(5, rnd); } while (v[i] <= v[j]);
    const d = v[i] - v[j], say = x => `El ${WEEK[i]} van venir ${x} hostes més que el ${WEEK[j]}.`;
    return { card: bars(v), real: say(d), says: say(bad ? d + 5 : d), opts: shuffle([d, d + 5, v[i]].map(say), rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three lines of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
