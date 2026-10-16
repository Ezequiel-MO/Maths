import { curs, whole, within, slots, at, int, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the cases of the detectives of problems, with no page in it. Every level is a case like the ones of the «proves de
// competències» of 4t: a short story with some numbers, a question, and the five steps of a detective: read and find the clues (the data
// that answer the question; some numbers are there on purpose and are not needed), choose the operation, estimate, calculate, and check
// with the inverse operation. The numbers of a case are drawn with rnd when it is played, so a case is never the same twice; every answer
// is worked out here from those numbers. It must keep importing from Node.

/* ---------- chance and numbers ---------- */
const pick = (r, a) => a[at(a.length, r)];
const mix = (r, a) => shuffle(a.slice(), r);
const r6 = x => Math.round(x * 1e6) / 1e6;
// 12500 → «12.500», 2,5 with dec 2 → «2,50»; a comma for decimals
export function fmt(v, dec) {
  const neg = v < 0; v = Math.abs(v);
  let [i, d] = (dec ? v.toFixed(dec) : String(r6(v))).split('.');
  if (i.length >= 5) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '−' : '') + i + (d ? ',' + d : '');
}
// what a typed answer is worth: «3,5» or «3.5» → 3.5; NaN when it is not a number
export function parseNum(s) {
  const t = String(s).trim();
  return /^\d+([.,]\d+)?$/.test(t) ? Number(t.replace(',', '.')) : NaN;
}

/* ---------- operations as small trees ---------- */
// a leaf is { n } (keep: not rounded when estimating; dec: shown with cents); an operation is { o, a, b }
const L = (n, o) => ({ n, ...o });
const lf = x => typeof x === 'number' ? L(x) : x;
const E = (o, a, b) => ({ o, a: lf(a), b: lf(b) });
const leaf = e => e.n !== undefined;
export function ev(e) {
  if (leaf(e)) return e.n;
  const a = ev(e.a), b = ev(e.b);
  return r6(e.o === '+' ? a + b : e.o === '−' ? a - b : e.o === '×' ? a * b : a / b);
}
const PREC = { '+': 1, '−': 1, '×': 2, '÷': 2 };
// «345 − 128 + 50», «20 − (4 × 3)», «(32 + 34) ÷ 6»
export function lbl(e) {
  if (leaf(e)) return fmt(e.n, e.dec);
  const left = !leaf(e.a) && PREC[e.a.o] !== PREC[e.o] ? `(${lbl(e.a)})` : lbl(e.a);
  return `${left} ${e.o} ${leaf(e.b) ? lbl(e.b) : `(${lbl(e.b)})`}`;
}
// a − b with the bigger first, for wrong choices that must not go below zero
const sub = (a, b) => ev(lf(a)) >= ev(lf(b)) ? E('−', a, b) : E('−', b, a);
// the rounding of an estimate: tens up to 999, hundreds up to 9.999; a division takes a dividend the divisor fits into
const roundLeaf = n => !Number.isInteger(n) ? Math.round(n) : n < 10 ? n : n < 1000 ? Math.round(n / 10) * 10 : n < 10000 ? Math.round(n / 100) * 100 : Math.round(n / 1000) * 1000;
function roundExpr(e) {
  if (leaf(e)) return e.keep ? e : L(roundLeaf(e.n));
  const a = roundExpr(e.a), b = roundExpr(e.b);
  if (e.o === '÷' && leaf(b) && b.n > 0) return E('÷', L(Math.max(1, Math.round(ev(a) / b.n)) * b.n), b);
  return E(e.o, a, b);
}
// the steps of an operation, from the inside out: «6 × 2 = 12», «50 − 12 = 38»
function steps(e, out = []) {
  if (leaf(e)) return out;
  steps(e.a, out); steps(e.b, out);
  out.push({ a: ev(e.a), o: e.o, b: ev(e.b), v: ev(e), dec: e.a.dec || e.b.dec });
  return out;
}
function niceUp(x) {
  const p = 10 ** Math.floor(Math.log10(x));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= x - 1e-9) return m * p;
  return 10 * p;
}
function niceStep(x, least) {
  const p = 10 ** Math.floor(Math.log10(x));
  for (const m of [1, 2, 5, 10]) if (m * p >= x) return Math.max(m * p, least);
  return Math.max(10 * p, least);
}

/* ---------- the people of the stories ---------- */
const NAMES = [['Laia', 'f'], ['Pau', 'm'], ['Marc', 'm'], ['Júlia', 'f'], ['Nil', 'm'], ['Aina', 'f'], ['Hugo', 'm'], ['Lucía', 'f'],
  ['Martí', 'm'], ['Ona', 'f'], ['Leo', 'm'], ['Carla', 'f'], ['Biel', 'm'], ['Noa', 'f']];
// «la Laia», «en Pau», «l'Aina»; Ca starts a sentence
function person(r) {
  const [n, g] = pick(r, NAMES), art = /^[AEIOUÀÈÉÍÒÓÚH]/.test(n) ? 'l’' : g === 'f' ? 'la ' : 'en ';
  return { ca: art + n, Ca: art[0].toUpperCase() + art.slice(1) + n };
}
const pad = m => String(m).padStart(2, '0');

/* ---------- the sports of the charts ---------- */
const SPORTS = [['Futbol', 11, '#3DB874', 'foot'], ['Bàsquet', 5, '#FF7A2F', 'basket'], ['Natació', 0, '#36A9E1', 'swim'], ['Handbol', 7, '#E8476A', 'hand'], ['Patinatge', 0, '#8E6CDB', 'skate']];
function bars(r) {
  const used = new Set();
  return SPORTS.map(([label, team, color, icon], i) => { let v; do { v = int(r, 12, 64); } while (used.has(v)); used.add(v); return { k: 'b' + i, label, v, color, icon, team }; });
}
const barTok = (items, useful) => Object.fromEntries(items.map(it => [it.k, { t: `${it.label}: ${it.v}`, u: useful.includes(it.k) ? 1 : 0, chart: 1 }]));
const BARS_TITLE = 'Alumnes apuntats a cada esport';
function twoBars(r, items) { const [x, y] = mix(r, items); return x.v > y.v ? [x, y] : [y, x]; }

/* ---------- the cases ---------- */
// T[id](r) → { text with {clues}, tok: { clue: { t, u } }, q, unit, exprs (the first is the right one), and maybe answer, dec, hints,
// check, sol, opHint, calcTip, chart }. u marks a clue that is needed; the others are there on purpose
const T = {
  // ===== the market: adding and taking away =====
  m1: r => {
    const a = int(r, 150, 480), h = pick(r, [8, 9]); let b; do { b = int(r, 120, 399); } while (b === a);
    return { text: 'Al matí, la fruiteria del mercat va vendre {a} de fruita i a la tarda en va vendre {b}. La fruiteria obre a les {h} del matí.',
      tok: { a: { t: a + ' kg', u: 1 }, b: { t: b + ' kg', u: 1 }, h: { t: String(h) } },
      q: 'Quants quilos de fruita va vendre en tot el dia?', unit: 'kg', exprs: [E('+', a, b), sub(a, b), E('×', a, b), E('+', a, h)] };
  },
  m2: r => {
    const p = person(r), c = pick(r, [100, 200, 500]), a = c === 100 ? int(r, 35, 94) : c === 200 ? int(r, 105, 189) : int(r, 215, 480), d = int(r, 30, 90) * 10;
    return { text: `${p.Ca} compra un patinet que costa {a} i paga amb un bitllet de {c}. El farà servir per anar a l’escola, que és a {d} de casa seva.`,
      tok: { a: { t: a + ' €', u: 1 }, c: { t: c + ' €', u: 1 }, d: { t: d + ' metres' } },
      q: 'Quants diners li han de tornar?', unit: '€', exprs: [E('−', c, a), E('+', c, a), sub(d, a), sub(c, d)] };
  },
  m3: r => {
    const p = person(r), a = int(r, 220, 520), b = a - int(r, 40, 180), pr = pick(r, [2, 3]);
    return { text: `${p.Ca} té una parada al mercat. Dissabte va vendre {a} de taronges i diumenge, {b}. Cada quilo costa {p}.`,
      tok: { a: { t: a + ' kg', u: 1 }, b: { t: b + ' kg', u: 1 }, p: { t: pr + ' €' } },
      q: 'Quants quilos més va vendre dissabte que diumenge?', unit: 'kg', exprs: [E('−', a, b), E('+', a, b), E('×', a, pr), E('−', a, pr)] };
  },
  m4: r => {
    const p = person(r), a = int(r, 180, 450), b = int(r, 60, a - 40), g = pick(r, [6, 18, 21]);
    return { text: `${p.Ca} es vol comprar una bicicleta que costa {a}. Ja ha estalviat {b}. La bicicleta té {g} marxes.`,
      tok: { a: { t: a + ' €', u: 1 }, b: { t: b + ' €', u: 1 }, g: { t: String(g) } },
      q: 'Quants diners li falten per poder-la comprar?', unit: '€', exprs: [E('−', a, b), E('+', a, b), E('−', a, g), sub(b, g)] };
  },
  m5: r => {
    const p = person(r), cents = [0.25, 0.5, 0.75, 0.2, 0.4, 0.6, 0.8], a = r6(int(r, 2, 6) + pick(r, cents)), n = int(r, 3, 6);
    let b; do { b = r6(int(r, 1, 5) + pick(r, cents)); } while (b === a);
    const A = L(a, { dec: 2 }), B = L(b, { dec: 2 });
    return { dec: 2, text: `${p.Ca} compra un meló per {a} i unes cireres per {b}. La venedora li regala {n} llimones.`,
      tok: { a: { t: fmt(a, 2) + ' €', u: 1 }, b: { t: fmt(b, 2) + ' €', u: 1 }, n: { t: String(n) } },
      q: 'Quant paga en total?', unit: '€', exprs: [E('+', A, B), a >= b ? E('−', A, B) : E('−', B, A), E('+', E('+', A, B), n), E('×', A, n)],
      opHint: 'Pagar les dues coses és ajuntar els dos preus.' };
  },
  // ===== the school trip: multiplying and sharing out =====
  e1: r => {
    const n = int(r, 3, 8), k = int(r, 24, 48), h = pick(r, [2, 3, 4]);
    return { text: 'Per anar a la granja escola, l’escola lloga {n}. A cada autobús hi viatgen {k}. El viatge dura {h}.',
      tok: { n: { t: n + ' autobusos', u: 1 }, k: { t: k + ' alumnes', u: 1 }, h: { t: h + ' hores' } },
      q: 'Quants alumnes van d’excursió?', unit: 'alumnes', exprs: [E('×', n, k), E('+', n, k), E('−', k, n), E('×', E('×', n, k), h)],
      opHint: 'Hi ha diversos autobusos amb el mateix nombre d’alumnes: és una suma que es repeteix.' };
  },
  e2: r => {
    const g = int(r, 3, 8), q = int(r, 6, 14), t = g * q, d = pick(r, [45, 60, 90]);
    return { text: 'A la granja, els {t} es reparteixen en {g} iguals per fer els tallers. Cada taller dura {d}.',
      tok: { t: { t: t + ' alumnes', u: 1 }, g: { t: g + ' grups', u: 1 }, d: { t: d + ' minuts' } },
      q: 'Quants alumnes hi ha a cada grup?', unit: 'alumnes', exprs: [E('÷', t, g), E('×', t, g), E('−', t, g), E('÷', t, d)],
      opHint: 'Repartir en parts iguals és dividir.' };
  },
  e3: r => {
    const k = pick(r, [40, 45, 50, 55]), q = int(r, 2, 5), rr = int(r, 3, k - 5), t = k * q + rr, pr = int(r, 4, 9);
    return { answer: q + 1, text: 'A l’excursió hi van {t}, comptant alumnes i mestres. A cada autobús hi caben {k}. L’entrada al parc costa {p} per persona.',
      tok: { t: { t: t + ' persones', u: 1 }, k: { t: k + ' persones', u: 1 }, p: { t: pr + ' €' } },
      q: 'Quants autobusos necessiten com a mínim perquè hi vagin tots?', unit: 'autobusos',
      exprs: [E('÷', t, k), E('×', t, k), E('−', t, k), E('×', t, pr)],
      calcTip: 'Divideix… i pensa què passa amb les persones que sobren.',
      hints: { [q]: `Amb ${q} autobusos hi caben ${q * k} persones… i ${rr} es quedarien a terra! En cal un més.` },
      check: { q: `${q + 1} × ${k} = ?`, opts: [(q + 1) * k, q * k, (q + 1) * k + 10], ok: (q + 1) * k, msg: `${(q + 1) * k} places ≥ ${t} persones: hi caben tots!` },
      sol: `${t} ÷ ${k} = ${q} i en sobren ${rr}. Aquestes ${rr} persones també necessiten autobús: ${q} + 1 = ${q + 1}.` };
  },
  e4: r => {
    const pr = int(r, 3, 9), n = int(r, 40, 58), s = int(r, 8, 20);
    return { text: 'L’entrada al museu costa {p} per alumne. Hi van les dues classes de 4t, en total {n}. El museu té {s}.',
      tok: { p: { t: pr + ' €', u: 1 }, n: { t: n + ' alumnes', u: 1 }, s: { t: s + ' sales' } },
      q: 'Quant paguen en total per les entrades?', unit: '€', exprs: [E('×', n, pr), E('+', n, pr), E('−', n, pr), E('×', s, pr)],
      opHint: 'Cada alumne paga el mateix: és una suma que es repeteix moltes vegades.' };
  },
  e5: r => {
    const k = int(r, 4, 9), q = int(r, 6, 15), rr = int(r, 2, k - 1), t = k * q + rr, c = int(r, 10, 14);
    return { answer: q, text: 'La mestra té {t} per premiar l’excursió. Vol donar {k} a cada alumne. A la classe hi ha {c} taules.',
      tok: { t: { t: t + ' adhesius', u: 1 }, k: { t: k + ' adhesius', u: 1 }, c: { t: String(c) } },
      q: 'A quants alumnes pot donar adhesius?', unit: 'alumnes', exprs: [E('÷', t, k), E('×', t, k), E('−', t, k), E('+', t, c)],
      calcTip: 'Divideix… n’hi ha prou, amb els que sobren, per a un alumne més?',
      hints: { [q + 1]: `No n’hi ha prou! Per a ${q + 1} alumnes en caldrien ${(q + 1) * k} i només n’hi ha ${t}.` },
      check: { q: `${q} × ${k} = ?`, opts: [q * k, (q + 1) * k, q * k - 10], ok: q * k, msg: `${q * k} ≤ ${t}: n’hi ha per a ${q} alumnes i en sobren ${rr}.` },
      sol: `${t} ÷ ${k} = ${q} i en sobren ${rr}. Amb ${rr} adhesius no n’hi ha prou per a un altre alumne.` };
  },
  // ===== the sports centre: charts and data =====
  s1: r => {
    const items = bars(r), [X, Y] = twoBars(r, items), Z = items.find(i => i !== X && i !== Y), d = pick(r, [5, 6]);
    return { text: 'Al poliesportiu han comptat quants alumnes s’han apuntat a cada esport. El poliesportiu obre {d} dies a la setmana.',
      tok: { d: { t: String(d) }, ...barTok(items, [X.k, Y.k]) }, chart: { type: 'bars', title: BARS_TITLE, items },
      q: `Quants alumnes més hi ha a ${X.label.toLowerCase()} que a ${Y.label.toLowerCase()}?`, unit: 'alumnes',
      exprs: [E('−', X.v, Y.v), E('+', X.v, Y.v), sub(X.v, Z.v), E('−', X.v, d)] };
  },
  s2: r => {
    const items = bars(r), [X, Y] = twoBars(r, items), Z = items.find(i => i !== X && i !== Y), m = pick(r, [45, 60]);
    return { text: 'El gràfic mostra els alumnes apuntats a cada esport. Cada entrenament dura {m}.',
      tok: { m: { t: m + ' minuts' }, ...barTok(items, [X.k, Y.k]) }, chart: { type: 'bars', title: BARS_TITLE, items },
      q: `Quants alumnes hi ha en total entre ${X.label.toLowerCase()} i ${Y.label.toLowerCase()}?`, unit: 'alumnes',
      exprs: [E('+', X.v, Y.v), E('−', X.v, Y.v), E('+', X.v, Z.v), E('+', E('+', X.v, Y.v), Z.v)] };
  },
  s3: r => {
    const per = pick(r, [2, 5, 10]), d = int(r, 3, 4), used = new Set();
    const rows = ['4t A', '4t B', '4t C', '4t D'].map((label, i) => { let c; do { c = int(r, per === 2 ? 3 : 2, 8); } while (used.has(c)); used.add(c); return { k: 'r' + i, label, count: c }; });
    const X = pick(r, rows), O = rows.find(x => x !== X);
    const tok = { d: { t: d + ' dies' }, key: { t: 'Cada medalla = ' + per, u: 1, chart: 1 } };
    for (const row of rows) tok[row.k] = { t: row.label, u: row === X ? 1 : 0, chart: 1 };
    return { text: 'A l’olimpíada de l’escola, cada classe ha guanyat medalles. Mira el pictograma. L’olimpíada va durar {d}.',
      tok, chart: { type: 'picto', title: 'Medalles de cada classe', per, keyK: 'key', rows },
      q: `Quantes medalles va guanyar la classe de ${X.label}?`, unit: 'medalles',
      exprs: [E('×', X.count, per), E('+', X.count, per), E('×', O.count, per), E('×', X.count, d)],
      opHint: `Cada dibuix val ${per}. Si hi ha diversos dibuixos, es repeteix ${per} diverses vegades.` };
  },
  s4: r => {
    const items = bars(r), X = pick(r, items.filter(i => i.team)), m = pick(r, [40, 50, 60]);
    X.v = X.team * int(r, 2, X.team === 11 ? 5 : 8);
    for (const i of items) if (i !== X) while (items.some(o => o !== i && o.v === i.v)) i.v = int(r, 12, 64);
    return { text: `Mira quants alumnes s’han apuntat a cada esport. A ${X.label.toLowerCase()} volen formar equips de {k}, sense que en sobri cap. Cada partit dura {m}.`,
      tok: { k: { t: X.team + ' jugadors', u: 1 }, m: { t: m + ' minuts' }, ...barTok(items, [X.k]) }, chart: { type: 'bars', title: BARS_TITLE, items },
      q: `Quants equips de ${X.label.toLowerCase()} poden formar?`, unit: 'equips',
      exprs: [E('÷', X.v, X.team), E('×', X.v, X.team), E('−', X.v, X.team), E('÷', X.v, m)],
      opHint: 'Fer equips iguals és repartir: dividir.' };
  },
  // ===== the bakery: measures and parts =====
  p1: r => {
    const p = person(r), g = int(r, 3, 17) * 50, e = int(r, 2, 5), K = () => L(1000, { keep: 1 });
    return { text: `Per fer un pastís, ${p.ca} necessita {g} de farina i {e}. Al rebost té un paquet de {kg} de farina.`,
      tok: { g: { t: g + ' g', u: 1 }, e: { t: e + ' ous' }, kg: { t: '1 kg', u: 1 } },
      q: 'Quants grams de farina li quedaran al paquet?', unit: 'g', exprs: [E('−', K(), g), E('−', g, L(1, { keep: 1 })), E('+', K(), g), E('−', K(), e)],
      opHint: 'Recorda: 1 kg són 1000 g. Quan fas servir farina, al paquet en queda menys.' };
  },
  p2: r => {
    const i = int(r, 0, 2), d = [2, 3, 4][i], n = d * int(r, 8, 22), pc = pick(r, [1, 2]), f = ['la meitat', 'la tercera part', 'la quarta part'][i];
    return { text: 'Aquest matí, la pastisseria ha fet {n}. Abans del migdia n’ha venut {f}. Cada magdalena costa {pc}.',
      tok: { n: { t: n + ' magdalenes', u: 1 }, f: { t: f, u: 1 }, pc: { t: pc + ' €' } },
      q: 'Quantes magdalenes ha venut?', unit: 'magdalenes', exprs: [E('÷', n, L(d, { keep: 1 })), E('×', n, d), E('−', n, d), E('+', n, d)],
      opHint: `Per saber ${f} cal repartir entre ${d}.` };
  },
  p3: r => {
    const p = person(r), lt = pick(r, [1, 2, 3]), ml = pick(r, [250, 200, 500]), w = int(r, 4, 9) * 100, LL = () => L(lt * 1000, { keep: 1 });
    return { text: `${p.Ca} prepara suc per berenar. La gerra té {L} de suc i cada got és de {ml}. La gerra buida pesa {w}.`,
      tok: { L: { t: lt + (lt === 1 ? ' litre' : ' litres'), u: 1 }, ml: { t: ml + ' mL', u: 1 }, w: { t: w + ' g' } },
      q: 'Quants gots pot omplir?', unit: 'gots', exprs: [E('÷', LL(), ml), E('×', lt, ml), E('−', LL(), ml), E('÷', L(lt, { keep: 1 }), ml)],
      opHint: 'Passa els litres a mil·lilitres (1 L = 1000 mL) i reparteix-los en gots.' };
  },
  p4: r => {
    const p = person(r), g = pick(r, [125, 150, 175, 200, 225, 250, 300, 350, 450]), n = int(r, 3, 8), c = int(r, 12, 30);
    return { text: `Cada capsa de galetes pesa {g}. ${p.Ca} porta {n} a la festa de la classe. A cada capsa hi ha {c} galetes.`,
      tok: { g: { t: g + ' g', u: 1 }, n: { t: n + ' capses', u: 1 }, c: { t: String(c) } },
      q: 'Quants grams pesen totes les capses juntes?', unit: 'g', exprs: [E('×', g, n), E('+', g, n), E('×', c, n), E('−', g, n)] };
  },
  // ===== the cinema: time and rows =====
  c1: r => {
    const f = int(r, 8, 15), s = int(r, 12, 24), d = int(r, 85, 130), sn = int(r, 2, 7);
    return { text: 'La sala {sn} del cinema té {f} i a cada fila hi ha {s}. La pel·lícula d’avui dura {d}.',
      tok: { sn: { t: String(sn) }, f: { t: f + ' files', u: 1 }, s: { t: s + ' butaques', u: 1 }, d: { t: d + ' minuts' } },
      q: 'Quantes butaques hi ha a la sala?', unit: 'butaques', exprs: [E('×', f, s), E('+', f, s), sub(s, f), E('×', s, sn)],
      opHint: 'Totes les files tenen les mateixes butaques: és una suma repetida.' };
  },
  c2: r => {
    const t = int(r, 180, 320), v = int(r, 90, t - 25), pr = pick(r, [6, 7, 8]);
    return { text: 'A la sala gran hi caben {t}. Per a la sessió d’aquesta tarda ja s’han venut {v}. Cada entrada costa {p}.',
      tok: { t: { t: t + ' persones', u: 1 }, v: { t: v + ' entrades', u: 1 }, p: { t: pr + ' €' } },
      q: 'Quantes butaques queden lliures?', unit: 'butaques', exprs: [E('−', t, v), E('+', t, v), E('×', v, pr), E('−', t, pr)] };
  },
  c3: r => {
    const m = int(r, 5, 55), k = int(r, 12, 40), S = () => L(60, { keep: 1 });
    return { text: 'La pel·lícula de dibuixos dura {h} i {m}. A la cua de la taquilla hi ha {k}.',
      tok: { h: { t: '1 hora', u: 1 }, m: { t: m + ' minuts', u: 1 }, k: { t: k + ' persones' } },
      q: 'Quants minuts dura la pel·lícula en total?', unit: 'min', exprs: [E('+', S(), m), E('+', L(1, { keep: 1 }), m), E('+', L(100, { keep: 1 }), m), E('−', S(), m)],
      opHint: 'Recorda: 1 hora són 60 minuts.' };
  },
  c4: r => {
    const p = person(r), n = int(r, 3, 6), m = pick(r, [20, 22, 24, 25, 30, 35, 40, 45]), tt = int(r, 2, 5);
    return { text: `El cap de setmana, ${p.ca} mira {n} de la seva sèrie preferida. Cada capítol dura {m}. La sèrie té {t}.`,
      tok: { n: { t: n + ' capítols', u: 1 }, m: { t: m + ' minuts', u: 1 }, t: { t: tt + ' temporades' } },
      q: 'Quants minuts passa mirant la sèrie?', unit: 'min', exprs: [E('×', n, m), E('+', n, m), E('−', m, n), E('×', tt, m)] };
  },
  c5: r => {
    const p = person(r), a = int(r, 30, 55), b = int(r, 5, a - 8), pr = int(r, 3, 6);
    return { text: `La sessió comença a les {a}. ${p.Ca} arriba al cinema a les {b}. Les crispetes costen {p}.`,
      tok: { a: { t: '18:' + pad(a), u: 1 }, b: { t: '18:' + pad(b), u: 1 }, p: { t: pr + ' €' } },
      q: 'Quants minuts abans de la pel·lícula arriba al cinema?', unit: 'min', exprs: [E('−', a, b), E('+', a, b), E('−', a, pr), sub(b, pr)],
      opHint: 'Les dues hores són de les 18 h: fixa’t només en els minuts i busca la diferència.' };
  },
  // ===== the big case: two steps =====
  g1: r => {
    const a = int(r, 300, 900), b = int(r, 40, 150), c = int(r, 20, 120), s = int(r, 8, 30);
    return { text: 'La biblioteca de l’escola tenia {a}. Aquest mes s’han deixat en préstec {b} i n’han arribat {c} de nous. La biblioteca té {s}.',
      tok: { a: { t: a + ' llibres', u: 1 }, b: { t: b + ' llibres', u: 1 }, c: { t: String(c), u: 1 }, s: { t: s + ' prestatgeries' } },
      q: 'Quants llibres hi ha ara a la biblioteca?', unit: 'llibres',
      exprs: [E('+', E('−', a, b), c), E('+', E('+', a, b), c), E('−', E('−', a, b), c), E('−', E('+', a, b), c)],
      opHint: 'Els prestats surten de la biblioteca (es resten) i els nous hi entren (se sumen).' };
  },
  g2: r => {
    const p = person(r), n = int(r, 2, 6), pr = int(r, 2, 5), c = n * pr < 18 ? pick(r, [20, 50]) : 50, h = pick(r, [48, 80, 100]);
    return { text: `${p.Ca} compra {n} per a l’escola. Cada llibreta costa {p} i té {h} fulls. Paga amb un bitllet de {c}.`,
      tok: { n: { t: n + ' llibretes', u: 1 }, p: { t: pr + ' €', u: 1 }, h: { t: String(h) }, c: { t: c + ' €', u: 1 } },
      q: 'Quants diners li tornen?', unit: '€',
      exprs: [E('−', c, E('×', n, pr)), E('×', E('−', c, n), pr), E('×', n, pr), E('−', E('−', c, n), pr)],
      opHint: 'Primer calcula quant costen totes les llibretes; després, el que sobra del bitllet.' };
  },
  g3: r => {
    const g = int(r, 4, 9), k = int(r, 12, 25), m = int(r, 5, 15), h = pick(r, [10, 11]);
    return { text: 'Al festival de primavera hi participen {g} de {k} cadascun. A més, hi ha {m} que els acompanyen. El festival comença a les {h}.',
      tok: { g: { t: g + ' grups', u: 1 }, k: { t: k + ' nens', u: 1 }, m: { t: m + ' monitors', u: 1 }, h: { t: String(h) } },
      q: 'Quantes persones hi ha en total al festival?', unit: 'persones',
      exprs: [E('+', E('×', g, k), m), E('×', g, k), E('+', E('+', g, k), m), E('×', g, E('+', k, m))],
      opHint: 'Primer compta els nens de tots els grups; després, suma-hi els monitors.' };
  },
  g4: r => {
    const p = person(r), q = int(r, 4, 12), n = int(r, 3, 6), tot = q * n;
    let a = int(r, Math.ceil(tot * 0.3), Math.floor(tot * 0.7)); if (2 * a === tot) a += 1;
    const b = tot - a, km = int(r, 2, 9);
    return { text: `${p.Ca} té {a} i el seu germà té {b}. Ajunten els diners i compren {n} iguals per al teatre, sense que els en sobri gens. El teatre és a {km} de casa.`,
      tok: { a: { t: a + ' €', u: 1 }, b: { t: b + ' €', u: 1 }, n: { t: n + ' entrades', u: 1 }, km: { t: km + ' km' } },
      q: 'Quant costa cada entrada?', unit: '€',
      exprs: [E('÷', E('+', a, b), n), E('×', E('+', a, b), n), E('+', E('+', a, b), n), E('÷', sub(a, b), n)],
      opHint: 'Primer ajunta els diners dels dos; després, reparteix-los entre les entrades.' };
  },
  g5: r => {
    const p = person(r), rr = int(r, 3, 6), s = int(r, 4, 8), e = int(r, 2, s - 1), pr = int(r, 6, 15);
    return { text: `Una capsa de bombons té {r} de {s} bombons. ${p.Ca} i la seva família se’n mengen {e}. La capsa va costar {p}.`,
      tok: { r: { t: rr + ' files', u: 1 }, s: { t: String(s), u: 1 }, e: { t: String(e), u: 1 }, p: { t: pr + ' €' } },
      q: 'Quants bombons queden a la capsa?', unit: 'bombons',
      exprs: [E('−', E('×', rr, s), e), E('×', rr, s), E('−', E('+', rr, s), e), E('×', rr, E('−', s, e))],
      opHint: 'Primer compta tots els bombons de la capsa (files × bombons per fila); després, treu-ne els que es mengen.' };
  }
};
export const CASES = Object.keys(T);

/* ---------- a case ready to play ---------- */
// the words around the clues: [{ s: 'text' }, { k: 'clue' }, ...]
function parseText(text, tok) {
  const segs = [], re = /\{(\w+)\}/g; let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) segs.push({ s: text.slice(last, m.index) });
    if (!tok[m[1]]) throw new Error('pista sense definir: ' + m[1]);
    segs.push({ k: m[1] }); last = re.lastIndex;
  }
  if (last < text.length) segs.push({ s: text.slice(last) });
  return segs;
}
// the check of the last step: the inverse operation must give back the number it started from
function makeCheck(right, answer, dec) {
  const A = ev(right.a), B = ev(right.b), o = right.o, inv = { '−': '+', '+': '−', '×': '÷', '÷': '×' }[o];
  const other = { '+': answer + B, '−': Math.abs(answer - B), '×': answer * B, '÷': answer / B }[o];
  const opts = [A];
  for (const c of [other, ...(dec ? [A + 1, A - 1, A + 0.5] : [A + 10, A - 10, A + 1, A - 1, A + 100])]) {
    const v = r6(c);
    if (opts.length < 3 && v > 0 && !opts.some(x => Math.abs(x - v) < 1e-9) && (dec || Number.isInteger(v))) opts.push(v);
  }
  const msg = leaf(right.a) ? `Surt ${fmt(A, dec)}, que és una dada del cas! El teu resultat encaixa.` : `Surt ${fmt(A, dec)}, el resultat del primer pas (${lbl(right.a)})! El teu resultat encaixa.`;
  return { q: `${fmt(answer, dec)} ${inv} ${fmt(B, dec)} = ?`, opts, ok: A, msg };
}
// The case id with its numbers drawn by rnd: the story (segs and tok), the question, the operations to choose from (shuffled, one right),
// the answer, the estimate (its rounded operation, the number line to put it on and how far from the answer it may be), the check of
// the last step and the solution
export function build(id, rnd = Math.random) {
  const raw = (T[id] || T.m1)(rnd), dec = raw.dec || 0, right = raw.exprs[0];
  const answer = raw.answer !== undefined ? raw.answer : ev(right);
  const seen = new Set(), ops = [];
  raw.exprs.forEach((e, i) => {
    const label = lbl(e);
    if (seen.has(label) || (i > 0 && Math.abs(ev(e) - ev(right)) < 1e-9)) return;
    seen.add(label); ops.push({ label, ok: i === 0 });
  });
  const rounded = roundExpr(right);
  let est = ev(rounded); if (raw.answer !== undefined) est = Math.round(est);
  const max = niceUp(Math.max(answer, est, 1) * 1.6), step = niceStep(max / 40, dec ? 0.5 : 1);
  const check = raw.check || makeCheck(right, answer, dec);
  const two = !leaf(right.a) || !leaf(right.b);
  return { id, dec, two, segs: parseText(raw.text, raw.tok), tok: raw.tok, q: raw.q, unit: raw.unit, chart: raw.chart || null,
    ops: mix(rnd, ops), label: lbl(right), answer,
    est: { value: est, label: lbl(rounded) === lbl(right) ? null : `${lbl(rounded)} ≈ ${fmt(est, dec && !Number.isInteger(est) ? 2 : 0)}`, max, step,
      tol: Math.max(answer * 0.2, Math.abs(answer - est) * 1.25, step) },
    check: { ...check, opts: mix(rnd, check.opts) }, hints: raw.hints || {}, opHint: raw.opHint || null, calcTip: raw.calcTip || null,
    sol: raw.answer !== undefined ? [] : steps(right).map(s => `${fmt(s.a, s.dec)} ${s.o} ${fmt(s.b, s.dec)} = ${fmt(s.v, dec && !Number.isInteger(s.v) ? 2 : 0)}`),
    solNote: raw.sol || null };
}

/* ---------- the cursus: circles, projects, marks ---------- */
const TITLE = { m1: 'La fruita del dia', m2: 'El canvi del patinet', m3: 'Dissabte i diumenge', m4: 'Estalviar per a la bici', m5: 'Cèntims al mercat',
  e1: 'Autobusos plens', e2: 'Grups iguals', e3: 'Quants autobusos?', e4: 'Entrades al museu', e5: 'Adhesius per a tothom',
  s1: 'Qui en té més?', s2: 'Tots junts', s3: 'El pictograma', s4: 'Fem equips',
  p1: 'La farina que queda', p2: 'Una part de les magdalenes', p3: 'Gots de suc', p4: 'Capses de galetes',
  c1: 'Files i butaques', c2: 'Butaques lliures', c3: 'Hores i minuts', c4: 'La sèrie', c5: 'Arribar abans',
  g1: 'La biblioteca', g2: 'Llibretes i canvi', g3: 'El festival', g4: 'Entrades del teatre', g5: 'La capsa de bombons' };
// ten levels per project: the cases of its place, one after another and again
const ten = ids => Array.from({ length: 10 }, (_, i) => ({ title: TITLE[ids[i % ids.length]], case: ids[i % ids.length] }));
export const PROJECTS = [
  { name: 'El mercat', sub: 'Sumar i restar', place: 'mercat', levels: ten(['m1', 'm2', 'm3', 'm4', 'm5']) },
  { name: 'L’excursió', sub: 'Multiplicar i repartir', place: 'excursio', levels: ten(['e1', 'e2', 'e4', 'e3', 'e5']) },
  { name: 'El poliesportiu', sub: 'Gràfics i dades', place: 'esports', levels: ten(['s1', 's2', 's3', 's4']) },
  { name: 'La pastisseria', sub: 'Mesures i parts', place: 'pastisseria', levels: ten(['p1', 'p2', 'p4', 'p3']) },
  { name: 'El cinema', sub: 'Temps i files', place: 'cinema', levels: ten(['c1', 'c2', 'c3', 'c4', 'c5']) },
  { name: 'El gran cas', sub: 'Problemes de dos passos', place: 'misteri', levels: ten(['g1', 'g2', 'g3', 'g4', 'g5']) }
];
export const CIRCLES = [
  { name: 'Llegir i triar', projects: [0, 1] },
  { name: 'Dades i mesures', projects: [2, 3] },
  { name: 'Detectiu expert', projects: [4, 5] }
];
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: three cases to learn the five steps
export const POOL = [{ title: 'El primer cas', case: 'm4' }, { title: 'El segon cas', case: 'e1' }, { title: 'El tercer cas', case: 's2' }];

// What is saved is facts only: { so, stars[60], piscina, exams[3], fulls }. Marks, XP, level and badges are worked out, never stored.
// a complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, PROJECTS.length * 10).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true), fulls: Math.max(0, whole(o.fulls)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: "Caça bé les errades de deu fulls." },
  { name: 'Tots els llocs', what: 'Valida els sis projectes.' },
  { name: 'Gran detectiu', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10,
  PROJECTS.every((_, i) => noteOf(p, i) >= VALID), p.exams.every(e => e === true)];

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

// A sheet: three notes in the detective's notebook, each { kind, scene, says, real, opts }: scene the case they are about ({ place, text }),
// says the note written, real the true one (the note is wrong when they differ) and opts the three to choose from when fixing it. The
// mistakes are the ones of a hurried detective: the wrong operation, the leftover of a division forgotten, a kilogram taken as 1 or a
// hour as 100 minutes, and a sum that an estimate would have caught
const CLAIM = {
  operacio(bad, rnd) {
    const k = at(3, rnd);
    if (k === 0) {
      const a = int(rnd, 40, 95), b = int(rnd, 12, a - 10), say = (o, v) => `Li’n queden ${a} ${o} ${b} = ${v} cromos.`;
      return { scene: { place: 'mercat', text: `Un col·leccionista tenia ${a} cromos i n’ha regalat ${b}.` }, real: say('−', a - b), says: bad ? say('+', a + b) : say('−', a - b), opts: mix(rnd, [say('−', a - b), say('+', a + b), say('×', a * b)]) };
    }
    if (k === 1) {
      const n = int(rnd, 3, 7), m = int(rnd, 20, 35), say = (o, v) => `Hi van ${n} ${o} ${m} = ${v} alumnes.`;
      return { scene: { place: 'excursio', text: `L’escola lloga ${n} autobusos i a cada un hi viatgen ${m} alumnes.` }, real: say('×', n * m), says: bad ? say('+', n + m) : say('×', n * m), opts: mix(rnd, [say('×', n * m), say('+', n + m), say('−', m - n)]) };
    }
    const g = int(rnd, 3, 6), q = int(rnd, 5, 12), t = g * q, say = (o, v) => `A cada grup hi ha ${t} ${o} ${g} = ${v} alumnes.`;
    return { scene: { place: 'excursio', text: `Els ${t} alumnes es reparteixen en ${g} grups iguals.` }, real: say('÷', q), says: bad ? say('−', t - g) : say('÷', q), opts: mix(rnd, [say('÷', q), say('−', t - g), say('×', t * g)]) };
  },
  residu(bad, rnd) {
    const k = pick(rnd, [40, 45, 50]), q = int(rnd, 2, 5), r = int(rnd, 3, k - 5), t = k * q + r, say = n => `Calen ${n} autobusos com a mínim.`;
    return { scene: { place: 'excursio', text: `A l’excursió hi van ${t} persones i a cada autobús hi caben ${k}.` }, real: say(q + 1), says: say(bad ? q : q + 1), opts: mix(rnd, [q + 1, q, q + 2].map(say)) };
  },
  mesura(bad, rnd) {
    let g; do { g = int(rnd, 3, 17) * 50; } while (g === 500 || g === 550);
    const say = n => `Al paquet en queden ${n} g.`, w = [g, 1000 - g + 100];
    return { scene: { place: 'pastisseria', text: `Un paquet d’1 kg de farina. Per fer un pastís en gastes ${g} g.` }, real: say(1000 - g), says: say(bad ? w[1] : 1000 - g), opts: mix(rnd, [1000 - g, ...w].map(say)) };
  },
  temps(bad, rnd) {
    const m = int(rnd, 5, 55), say = n => `La pel·lícula dura ${n} minuts.`;
    return { scene: { place: 'cinema', text: `Una pel·lícula dura 1 hora i ${m} minuts.` }, real: say(60 + m), says: say(bad ? 100 + m : 60 + m), opts: mix(rnd, [60 + m, 100 + m, 1 + m].map(say)) };
  },
  estima(bad, rnd) {
    const a = int(rnd, 210, 590), b = int(rnd, 210, 390), s = a + b, say = n => `${a} + ${b} = ${n}.`;
    return { scene: { place: 'misteri', text: `Una suma de la llibreta. Estima-la abans de fer el compte: ${Math.round(a / 100) * 100} + ${Math.round(b / 100) * 100} = ${Math.round(a / 100) * 100 + Math.round(b / 100) * 100}, més o menys.` },
      real: say(s), says: say(bad ? s + 200 : s), opts: mix(rnd, [s, s + 200, s - 100].map(say)) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three notes of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
