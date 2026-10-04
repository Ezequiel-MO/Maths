// Eight sections. Each has nine lessons of five fixed questions and, as its tenth screen, a test of six questions made by gen().
// A question is { mode, ... }; n over d is always the fraction it is about:
//   'equal'  three figures cut in d parts; the one in equal parts is at position `at`
//   'paint'  light n of the d parts of a figure            'name'  write the fraction a figure shows
//   'line'   ask 'put': move the frog to n/d on the line;  ask 'read': write where the frog is
//   'cmp'    choose <, = or > between a/b and c/d          'same'  are a/b and c/d equivalent?
//   'cut'    n/d with every part cut in k: write the new numerator
//   'fill'   n/d = N/D with N or D missing (`miss`)        'join'  write n/d in lowest terms
// shape is the figure: 'pad' (a round lily pad), 'bar' (a walkway of planks) or 'set' (a group of fireflies). hide: no figure until a hint.
export const gcd = (a, b) => b ? gcd(b, a % b) : a;
export const sign = (a, b, c, d) => a * d < c * b ? '<' : a * d > c * b ? '>' : '=';
// a question written as text: the mode, then its numbers, then 'h' when the figures are hidden
function parse(txt) {
  const t = txt.trim().split(/\s+/), mode = t[0], hide = t[t.length - 1] === 'h', v = t.slice(1).map(x => /^\d+$/.test(x) ? +x : x);
  switch (mode) {
    case 'equal': return { mode, shape: v[0], d: v[1], at: v[2] };
    case 'paint': case 'name': return { mode, shape: v[0], n: v[1], d: v[2] };
    case 'put': case 'read': return { mode: 'line', ask: mode, n: v[0], d: v[1] };
    case 'cmp': case 'same': return { mode, a: v[0], b: v[1], c: v[2], d: v[3], hide };
    case 'cut': return { mode, shape: v[0], n: v[1], d: v[2], k: v[3] };
    case 'fill': return { mode, n: v[0], d: v[1], N: v[2], D: v[3], miss: v[4], hide };
    case 'join': return { mode, shape: v[0], n: v[1], d: v[2], hide };
  }
}
const sec = (name, sub, modes, ...levels) => ({ name, sub, modes, levels: levels.map(([n, qs]) => ({ name: n, qs: qs.split('|').map(parse) })) });
export const SECTIONS = [
  sec('Parts iguals', 'Una fracció són trossos igual de grans', ['equal', 'paint'],
    ['Meitats', 'equal pad 2 0 | equal bar 2 2 | paint pad 1 2 | paint bar 1 2 | equal pad 2 1'],
    ['Terços', 'equal pad 3 1 | equal bar 3 0 | paint pad 1 3 | paint bar 1 3 | equal bar 3 2'],
    ['Quarts', 'equal pad 4 2 | paint pad 1 4 | equal bar 4 1 | paint bar 1 4 | paint set 1 4'],
    ['Un tros de molts', 'paint pad 1 6 | paint bar 1 5 | paint pad 1 8 | paint bar 1 10 | paint set 1 6'],
    ['Iguals o no?', 'equal pad 6 0 | equal bar 5 2 | equal pad 8 1 | equal bar 6 0 | equal pad 5 2'],
    ["Més d'un tros", 'paint pad 2 3 | paint bar 2 4 | paint pad 3 4 | paint bar 2 5 | paint pad 3 6'],
    ['Cuques de llum', 'paint set 1 2 | paint set 1 3 | paint set 2 4 | paint set 3 5 | paint set 2 6'],
    ['Barreja', 'equal pad 4 0 | paint bar 3 5 | equal bar 8 1 | paint pad 5 8 | paint set 3 4'],
    ['Gairebé tot', 'paint pad 4 4 | paint bar 5 6 | paint pad 5 6 | paint bar 7 8 | paint set 5 8']),
  sec('Dalt i baix', 'El numerador i el denominador', ['paint', 'name'],
    ['El de baix', 'name pad 1 2 | name pad 1 4 | name bar 1 3 | name bar 1 5 | name pad 1 6'],
    ['El de dalt', 'name pad 2 3 | name pad 3 4 | name bar 2 5 | name bar 3 5 | name pad 5 6'],
    ['Vuitens i desens', 'name bar 3 8 | name pad 5 8 | name bar 7 10 | name pad 7 8 | name bar 4 6'],
    ['Cuques enceses', 'name set 1 4 | name set 3 5 | name set 2 6 | name set 5 8 | name set 7 10'],
    ['Pinta-la', 'paint pad 3 8 | paint bar 4 10 | paint pad 5 6 | paint bar 7 9 | paint set 4 9'],
    ['Fins a dotzens', 'name pad 5 12 | name bar 7 12 | paint pad 7 12 | paint bar 11 12 | name pad 11 12'],
    ['Tot sencer', 'name pad 4 4 | name bar 6 6 | paint pad 3 3 | name set 5 5 | paint bar 8 8'],
    ['Barreja', 'name bar 2 7 | paint set 5 7 | name pad 4 9 | paint bar 6 11 | name set 3 12'],
    ['Ull viu', 'name pad 7 9 | paint pad 9 10 | name bar 5 11 | paint set 8 12 | name bar 9 12']),
  sec('La recta', 'Les fraccions viuen entre el 0 i el 1', ['line'],
    ['Primers salts', 'put 1 2 | put 1 4 | put 3 4 | put 2 4 | put 1 3'],
    ['Més salts', 'put 2 3 | put 2 5 | put 4 5 | put 3 6 | put 5 6'],
    ['On és la granota?', 'read 1 2 | read 1 4 | read 3 4 | read 2 3 | read 3 5'],
    ['Salts petits', 'read 2 6 | read 5 8 | read 3 8 | read 7 10 | read 4 5'],
    ["El zero i l'u", 'put 0 4 | put 4 4 | put 3 3 | put 0 5 | put 6 6'],
    ['Anar i mirar', 'read 5 5 | put 7 8 | read 1 8 | put 3 10 | read 9 10'],
    ['Vuitens i desens', 'put 5 8 | put 9 10 | put 1 10 | put 3 8 | put 7 10'],
    ['Dotzens', 'put 5 12 | read 7 12 | put 11 12 | read 1 12 | put 6 12'],
    ['Barreja', 'read 4 6 | put 2 7 | read 8 9 | put 5 9 | read 11 12']),
  sec('Qui és més gran?', 'Comparar fraccions', ['cmp'],
    ['El mateix a baix', 'cmp 1 4 3 4 | cmp 2 3 1 3 | cmp 3 5 4 5 | cmp 5 6 2 6 | cmp 3 8 5 8'],
    ['Més trossos iguals', 'cmp 7 10 3 10 | cmp 2 5 2 5 | cmp 5 8 7 8 | cmp 4 9 2 9 | cmp 11 12 7 12'],
    ['Un sol tros', 'cmp 1 2 1 3 | cmp 1 4 1 2 | cmp 1 5 1 3 | cmp 1 8 1 6 | cmp 1 10 1 4'],
    ['El mateix a dalt', 'cmp 2 3 2 5 | cmp 3 8 3 4 | cmp 2 6 2 4 | cmp 3 5 3 10 | cmp 5 6 5 8'],
    ['Més o menys que la meitat', 'cmp 1 4 1 2 | cmp 3 4 1 2 | cmp 2 6 1 2 | cmp 5 8 1 2 | cmp 3 6 1 2'],
    ['La meitat, altre cop', 'cmp 2 5 1 2 | cmp 4 6 1 2 | cmp 4 8 1 2 | cmp 7 10 1 2 | cmp 5 12 1 2'],
    ['Sense dibuix', 'cmp 3 7 5 7 h | cmp 1 6 1 9 h | cmp 8 9 4 9 h | cmp 2 7 2 3 h | cmp 6 11 6 11 h'],
    ['Barreja', 'cmp 5 6 1 2 h | cmp 3 10 1 2 h | cmp 4 5 4 7 h | cmp 7 12 11 12 h | cmp 6 12 1 2 h'],
    ['Repte', 'cmp 4 4 3 4 | cmp 2 2 5 5 h | cmp 9 10 1 2 h | cmp 3 4 3 5 h | cmp 5 12 7 12 h']),
  sec('Tallar més fi', 'La mateixa part amb trossos més petits', ['cut'],
    ['La meitat', 'cut pad 1 2 2 | cut bar 1 2 2 | cut pad 1 2 3 | cut bar 1 2 4 | cut bar 1 2 5'],
    ['Terços', 'cut pad 1 3 2 | cut bar 1 3 3 | cut bar 2 3 2 | cut pad 2 3 2 | cut bar 2 3 4'],
    ['Quarts', 'cut pad 1 4 2 | cut bar 3 4 2 | cut pad 3 4 3 | cut bar 1 4 3 | cut bar 3 4 4'],
    ['Cinquens', 'cut bar 1 5 2 | cut bar 2 5 2 | cut bar 3 5 2 | cut bar 4 5 3 | cut bar 2 5 4'],
    ['Nenúfars', 'cut pad 1 2 6 | cut pad 1 3 4 | cut pad 2 3 4 | cut pad 1 6 2 | cut pad 5 6 2'],
    ['Passarel·les', 'cut bar 3 8 2 | cut bar 5 6 3 | cut bar 2 3 5 | cut bar 3 4 5 | cut bar 1 2 10'],
    ['Dos talls seguits', 'cut pad 1 2 4 | cut bar 1 3 6 | cut bar 3 4 4 | cut bar 2 5 4 | cut bar 2 3 6'],
    ['Barreja', 'cut pad 3 4 2 | cut bar 4 5 2 | cut pad 1 4 3 | cut bar 5 6 2 | cut bar 3 10 2'],
    ['Repte', 'cut bar 7 10 2 | cut pad 1 3 3 | cut bar 3 5 4 | cut bar 5 8 2 | cut bar 4 5 4']),
  sec('La regla', 'Multiplica dalt i baix pel mateix número', ['fill', 'cut'],
    ['Falta el de dalt', 'fill 1 2 2 4 N | fill 1 3 2 6 N | fill 2 3 4 6 N | fill 1 4 3 12 N | fill 3 4 6 8 N'],
    ['Per 2, per 3, per 4', 'fill 2 5 4 10 N | fill 1 2 5 10 N | fill 3 5 9 15 N | fill 2 3 8 12 N | fill 5 6 10 12 N'],
    ['Falta el de baix', 'fill 1 2 3 6 D | fill 1 3 3 9 D | fill 3 4 9 12 D | fill 2 5 6 15 D | fill 1 4 2 8 D'],
    ['Talla i comprova', 'cut bar 3 5 3 | cut bar 5 6 2 | cut pad 3 4 3 | cut bar 3 8 2 | cut bar 4 5 4'],
    ['Sense dibuix', 'fill 1 2 4 8 N h | fill 2 3 6 9 N h | fill 3 4 15 20 N h | fill 1 5 2 10 D h | fill 2 7 4 14 D h'],
    ['Més ràpid', 'fill 3 5 12 20 N h | fill 5 6 15 18 D h | fill 4 9 8 18 N h | fill 7 10 21 30 D h | fill 1 6 5 30 N h'],
    ['Fins a 100', 'fill 1 2 50 100 N h | fill 3 4 75 100 N h | fill 1 4 25 100 N h | fill 2 5 40 100 N h | fill 7 10 70 100 N h'],
    ['Taules grans', 'fill 5 8 20 32 D h | fill 3 7 9 21 N h | fill 2 9 6 27 D h | fill 5 12 10 24 N h | fill 4 5 28 35 N h'],
    ['Repte', 'fill 6 7 36 42 D h | fill 3 8 27 72 N h | fill 7 9 49 63 D h | fill 5 6 40 48 N h | fill 9 10 81 90 D h']),
  sec('Simplificar', 'La mateixa part amb menys trossos', ['join', 'fill'],
    ['De 2 en 2', 'join pad 2 4 | join bar 2 6 | join pad 4 6 | join bar 6 8 | join bar 4 10'],
    ['De 3 en 3', 'join pad 3 6 | join bar 3 9 | join pad 6 9 | join bar 9 12 | join bar 6 15'],
    ['Tria com ajuntar', 'join bar 5 10 | join pad 2 8 | join bar 10 15 | join pad 3 12 | join bar 4 14'],
    ['Fins que no es pugui més', 'join pad 4 8 | join bar 4 12 | join pad 8 12 | join bar 12 16 | join bar 6 12'],
    ['Dividir dalt i baix', 'fill 4 8 1 2 N | fill 6 9 2 3 N | fill 8 12 2 3 D | fill 10 15 2 3 N | fill 6 8 3 4 D'],
    ['Passarel·les llargues', 'join bar 12 18 | join bar 8 20 | join pad 9 12 | join bar 15 20 | join bar 16 20'],
    ['Sense dibuix', 'fill 10 20 1 2 N h | fill 9 12 3 4 N h | fill 15 25 3 5 D h | fill 14 21 2 3 N h | fill 20 30 2 3 D h'],
    ['De cap', 'join bar 6 10 h | join bar 12 20 h | join bar 9 15 h | join bar 8 12 h | join bar 14 16 h'],
    ['Repte', 'join bar 16 24 h | join bar 20 25 h | join bar 18 27 h | join bar 24 36 h | join bar 30 40 h']),
  sec('Missió final', 'Equivalents o no? I qui és més gran?', ['same', 'cmp'],
    ['Valen el mateix?', 'same 1 2 2 4 | same 1 3 2 5 | same 2 3 4 6 | same 3 4 5 8 | same 1 4 2 8'],
    ['Mira-ho bé', 'same 2 5 4 10 | same 3 5 5 10 | same 2 6 1 3 | same 3 4 9 12 | same 4 6 3 4'],
    ['Sense dibuix', 'same 1 2 5 10 h | same 2 3 6 9 h | same 3 5 6 15 h | same 3 4 12 16 h | same 2 7 4 21 h'],
    ['Trossos diferents', 'cmp 1 2 3 8 | cmp 2 3 5 6 | cmp 3 4 5 8 | cmp 1 3 2 6 | cmp 3 5 7 10'],
    ['Detectiu', 'same 4 6 6 9 h | same 6 8 9 12 h | same 2 6 3 8 h | same 10 15 4 6 h | same 3 9 4 10 h'],
    ['El mateix a baix', 'cmp 1 2 5 12 h | cmp 3 4 7 8 h | cmp 2 3 7 12 h | cmp 4 5 7 10 h | cmp 5 6 10 12 h'],
    ['Gairebé iguals', 'cmp 1 2 2 3 | cmp 2 3 3 4 | cmp 3 4 4 5 | cmp 2 5 1 3 | cmp 3 5 2 3'],
    ['De cap', 'cmp 2 3 3 5 h | cmp 3 4 5 6 h | cmp 1 4 2 5 h | cmp 5 8 2 3 h | cmp 4 6 6 9 h'],
    ['Repte final', 'same 12 18 10 15 h | cmp 5 6 7 9 h | same 15 20 9 12 h | cmp 7 10 2 3 h | cmp 9 12 6 8 h'])
];
// the right answer: a number, a sign, true or false, or [numerator, denominator]
export function want(q) {
  switch (q.mode) {
    case 'equal': return q.at;
    case 'paint': return q.n;
    case 'name': return [q.n, q.d];
    case 'line': return q.ask === 'put' ? q.n : [q.n, q.d];
    case 'cmp': return sign(q.a, q.b, q.c, q.d);
    case 'same': return q.a * q.d === q.c * q.b;
    case 'cut': return q.n * q.k;
    case 'fill': return q[q.miss];
    case 'join': { const g = gcd(q.n, q.d); return [q.n / g, q.d / g]; }
  }
}
export const right = (q, ans) => String(want(q)) === String(ans);

// the test of a section: six questions of its own modes, drawn at random inside the limits of its lessons
const int = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const one = (rnd, list) => list[Math.floor(rnd() * list.length)];
// a fraction below 1 in lowest terms, its denominator between lo and hi
function low(rnd, lo, hi) { for (;;) { const d = int(rnd, lo, hi), n = int(rnd, 1, d - 1); if (gcd(n, d) === 1) return [n, d]; } }
const MAKE = [
  (r, i) => { if (i % 2) { const d = int(r, 2, 8); return { mode: 'paint', shape: one(r, ['pad', 'bar', 'set']), n: int(r, 1, d), d }; }
    return { mode: 'equal', shape: one(r, ['pad', 'bar']), d: one(r, [2, 3, 4, 5, 6, 8]), at: int(r, 0, 2) }; },
  (r, i) => { const d = int(r, 2, 12); return { mode: i % 2 ? 'name' : 'paint', shape: one(r, ['pad', 'bar', 'set']), n: int(r, 1, d), d }; },
  (r, i) => { const d = int(r, 2, 12); return i % 2 ? { mode: 'line', ask: 'read', n: int(r, 1, d), d } : { mode: 'line', ask: 'put', n: int(r, 0, d), d }; },
  (r, i) => { const hide = i >= 3, d = int(r, 3, 12);
    if (i % 3 === 0) return { mode: 'cmp', a: int(r, 1, d), b: d, c: int(r, 1, d), d, hide };
    if (i % 3 === 1) { const n = int(r, 1, 5); return { mode: 'cmp', a: n, b: int(r, n + 1, 12), c: n, d: int(r, n + 1, 12), hide }; }
    return { mode: 'cmp', a: int(r, 1, d - 1), b: d, c: 1, d: 2, hide }; },
  r => { const shape = one(r, ['pad', 'bar']), [n, d] = low(r, 2, shape === 'pad' ? 6 : 5);
    return { mode: 'cut', shape, n, d, k: one(r, [2, 3, 4, 5, 6, 8, 9, 10].filter(k => d * k <= (shape === 'pad' ? 12 : 20))) }; },
  r => { const [n, d] = low(r, 2, 10), k = int(r, 2, 9); return { mode: 'fill', n, d, N: n * k, D: d * k, miss: one(r, ['N', 'D']), hide: true }; },
  (r, i) => { const [n, d] = low(r, 2, 8), k = int(r, 2, 5);
    return i % 2 ? { mode: 'fill', n: n * k, d: d * k, N: n, D: d, miss: one(r, ['N', 'D']), hide: true } : { mode: 'join', shape: 'bar', n: n * k, d: d * k, hide: true }; },
  (r, i) => { const [a, b] = low(r, 2, 8);
    if (i % 2) { const k = int(r, 2, 3); if (r() < 0.25) return { mode: 'cmp', a, b, c: a * k, d: b * k, hide: true };
      for (;;) { const [c, d] = low(r, 2, 8); if (d !== b) return { mode: 'cmp', a, b, c, d, hide: true }; } }
    const k1 = int(r, 1, 3), k2 = k1 + int(r, 1, 2), off = r() < 0.5 ? 0 : 1;
    return { mode: 'same', a: a * k1, b: b * k1, c: a * k2 + off, d: b * k2, hide: true }; }
];
export function gen(s, rnd = Math.random) {
  const out = [], seen = new Set();
  while (out.length < 6) { const q = MAKE[s](rnd, out.length), key = JSON.stringify({ ...q, at: 0 }); if (!seen.has(key)) { seen.add(key); out.push(q); } }
  return out;
}
export const PASS = 5;
// slips are wrong answers plus hints asked
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
export const testStars = hits => hits >= 6 ? 3 : hits >= PASS ? 2 : 0;

// Where the cuts of a figure of D equal parts fall, as shares of the whole, each with its class. was is the number of parts before
// the last cut or join: a cut that was not there is 'new', one just joined away is 'gone'. When neither grid fits inside the other
// (the child cut past the goal and the answer is being shown) there is nothing to animate: only the cuts of D.
export function cuts(D, was = D) {
  const M = Math.max(D, was), m = Math.min(D, was), out = [];
  if (M % m) return cuts(D);
  if (M > 1) for (let j = 0; j < M; j++) out.push([j / M, m > 1 && (j * m) % M === 0 ? '' : D > m ? 'new' : 'gone']);
  return out;
}
// the cuts, in order, that leave every part cut in k with the scissors there are: in 2, in 3 and in 5
export function snips(k) { const out = []; for (const p of [2, 3, 5]) while (k % p === 0) { out.push(p); k /= p; } return out; }

/* ---------- what the game says ---------- */
const half = b => b % 2 ? `${(b - 1) / 2} i mig` : `${b / 2}`;
const parts = n => n === 1 ? '1 tros és' : `${n} trossos són`;
export function tipFor(q) {
  switch (q.mode) {
    case 'equal': return `Toca la figura que està tallada en ${q.d} parts iguals.`;
    case 'paint': return q.shape === 'set' ? `Hi ha ${q.d} cuques. Encén-ne ${q.n}/${q.d}: toca-les i després prem Comprova.` : `Pinta ${q.n}/${q.d}: toca els trossos i després prem Comprova.`;
    case 'name': return q.shape === 'set' ? 'Quina fracció de les cuques està encesa?' : 'Quina fracció està pintada? A dalt, els trossos pintats; a baix, tots els trossos.';
    case 'line': return q.ask === 'put' ? `Porta la granota fins a ${q.n}/${q.d}: toca una marca i després prem Comprova.` : 'On és la granota? Escriu la fracció.';
    case 'cmp': return 'Quina és més gran? Tria <, = o >.';
    case 'same': return 'Valen el mateix? Tria Sí o No.';
    case 'cut': return `Talla els trossos fins a tenir-ne ${q.d * q.k} i escriu quants n'hi ha de pintats.`;
    case 'fill': return 'Troba el número que falta perquè totes dues valguin el mateix.';
    default: return q.hide ? 'Simplifica la fracció tant com puguis.' : 'Simplifica: ajunta trossos fins que no es pugui més i escriu la fracció.';
  }
}
// What to say after a wrong answer or a hint: first what to look at, then the whole reasoning. ans is the wrong answer, when there is one.
export function explain(q, deep, ans) {
  const { n, d } = q, bugs = q.shape === 'set';
  switch (q.mode) {
    case 'equal': return deep ? `És la ${['primera', 'segona', 'tercera'][q.at]} figura: només allà els ${d} trossos són igual de grans.` : 'Mira-ho bé: tots els trossos han de ser igual de grans.';
    case 'paint': return (ans != null ? `N'has ${bugs ? 'encès' : 'pintat'} ${ans}. ` : '')
      + (deep ? (bugs ? `Has d'encendre ${n} de les ${d} cuques.` : `Has de pintar ${n} dels ${d} trossos.`) : `El número de baix diu quant${bugs ? 'es cuques' : 's trossos'} hi ha: ${d}. El de dalt, quant${bugs ? 'es' : 's'} n'has ${bugs ? "d'encendre" : 'de pintar'}.`);
    case 'name': if (ans && ans[0] === d && ans[1] === n && n !== d) return `Al revés! A dalt van ${bugs ? 'les enceses' : 'els pintats'} (${n}) i a baix, ${bugs ? 'totes' : 'tots'} (${d}).`;
      if (bugs) return deep ? `Hi ha ${d} cuques i ${n === 1 ? 'una' : n} ${n === 1 ? "d'encesa" : "d'enceses"}: ${n}/${d}.` : 'Compta totes les cuques: aquest número va a baix. Compta les enceses: aquest va a dalt.';
      return deep ? `Hi ha ${d} trossos i ${n === 1 ? 'un de pintat' : `${n} de pintats`}: ${n}/${d}.` : 'Compta tots els trossos: aquest número va a baix. Compta els pintats: aquest va a dalt.';
    case 'line': if (q.ask === 'put') return deep ? `Mira les marques: compta ${n} ${n === 1 ? 'salt' : 'salts'} des del 0 i arribaràs a ${n}/${d}.` : `El camí del 0 a l'1 està tallat en ${d} salts iguals. Quants n'ha de fer la granota?`;
      return deep ? `El camí té ${d} salts i la granota n'ha fet ${n}: ${n}/${d}.` : 'A baix, en quants salts està tallat el camí. A dalt, quants n\'ha fet la granota.';
    case 'cmp': { const { a, b, c } = q, s = sign(a, b, c, d), L = b * d / gcd(b, d), end = `${a}/${b} ${s} ${c}/${d}.`;
      if (a === b || c === d) return deep ? `${a === b ? `${a}/${b} és tot sencer` : `${a}/${b} no arriba a tot sencer`}, i ${c === d ? `${c}/${d} ${a === b ? 'també' : 'és tot sencer'}` : `${c}/${d} no hi arriba`}: ${end}` : 'Quan el de dalt i el de baix són iguals, hi ha tots els trossos: és 1 sencer.';
      if (b === d) return deep ? `Els trossos són igual de grans, i ${parts(a)} ${s === '=' ? 'els mateixos que' : s === '<' ? 'menys que' : 'més que'} ${c}: ${end}` : 'Tenen el mateix número a baix: els trossos són igual de grans. Qui en té més?';
      if (a === c) return deep ? `Tallat en ${Math.min(b, d)} surten trossos més grans que tallat en ${Math.max(b, d)}: ${end}` : 'Tenen el mateix número a dalt. Com més gran és el de baix, més petits són els trossos!';
      if (c === 1 && d === 2) return deep ? `La meitat de ${b} és ${half(b)}, i ${a} ${s === '=' ? 'és just això' : s === '<' ? 'és menys' : 'és més'}: ${end}` : `Quants trossos són la meitat de ${b}? En té més o menys, aquesta fracció?`;
      return deep ? `${[[a, b], [c, d]].filter(f => f[1] !== L).map(([x, y]) => `${x}/${y} = ${x * L / y}/${L}`).join(' i ')}. Per tant, ${end}` : `Busca fraccions equivalents amb el mateix número a baix: totes dues poden tenir ${L}.`; }
    case 'same': { const { a, b, c } = q, g = gcd(a, b), h = gcd(c, d), u = `${a / g}/${b / g}`, v = `${c / h}/${d / h}`;
      if (!deep) return 'Simplifica totes dues tant com puguis. Arribes a la mateixa fracció?';
      return u === v ? `Totes dues valen ${u}: són equivalents.` : g === 1 && h === 1 ? `${u} i ${v} ja no es poden simplificar i són diferents: no valen el mateix.` : `Simplificades queden ${u} i ${v}: no valen el mateix.`; }
    case 'cut': { const s = snips(q.k);
      return deep ? `Cada tros s'ha tallat en ${q.k}: ${n} × ${q.k} = ${n * q.k} pintats, de ${d} × ${q.k} = ${d * q.k}.`
        : `${s.length > 1 ? `Fes ${s.length} talls seguits: en ${s.join(' i després en ')}` : `Talla cada tros en ${q.k}`}, i en tindràs ${d * q.k}. Després compta els pintats.`; }
    case 'fill': { const up = q.D > d, k = up ? q.D / d : d / q.D, op = up ? '×' : '÷', verb = up ? 'multiplicat' : 'dividit';
      if (deep) return `${n} ${op} ${k} = ${q.N} i ${d} ${op} ${k} = ${q.D}: ${n}/${d} = ${q.N}/${q.D}.`;
      return q.miss === 'N' ? `A baix, el ${d} s'ha ${verb} per ${k}. Fes el mateix a dalt.` : `A dalt, el ${n} s'ha ${verb} per ${k}. Fes el mateix a baix.`; }
    default: { const g = gcd(n, d);
      if (ans && ans[1] && ans[0] * d === ans[1] * n && !right(q, ans)) return `${ans[0]}/${ans[1]} val el mateix, però encara es pot simplificar més.`;
      return deep ? `${n} ÷ ${g} = ${n / g} i ${d} ÷ ${g} = ${d / g}: ${n}/${d} = ${n / g}/${d / g}.` : `Busca un número que divideixi el ${n} i el ${d} alhora.`; }
  }
}
