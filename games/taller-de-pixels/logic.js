import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the pixel workshop of the pond, with no page in it. The frog draws sprites like the ones of the old video
// games, pixel by pixel: it finds them by their coordinates, counts them with multiplications, works out the fraction of each colour,
// completes them in a mirror, repeats them in mosaics and buys the ironing beads to make them. Every answer is worked out here from
// the grids, so a drawing and its answer never disagree. It must keep importing from Node.

/* ---------- the colours: a letter of a grid each ('.' is an empty pixel) ---------- */
const col = (hex, one, many) => ({ hex, one, many });
export const COLORS = {
  r: col('#E8443A', 'vermell', 'vermells'), w: col('#F4F1E8', 'blanc', 'blancs'), k: col('#1B1B24', 'negre', 'negres'),
  y: col('#F7C64E', 'groc', 'grocs'), o: col('#F28C28', 'taronja', 'taronja'), m: col('#8A5A2B', 'marró', 'marrons'),
  g: col('#3DBE5A', 'verd', 'verds'), b: col('#3C7DF0', 'blau', 'blaus'), c: col('#6FE3FF', 'blau cel', 'blau cel'),
  p: col('#FF8FD0', 'rosa', 'rosa'), l: col('#9B6BFF', 'lila', 'lila'), n: col('#9AA5AE', 'gris', 'grisos')
};
export const one = ch => ch === '.' ? 'buit' : COLORS[ch].one;
const many = ch => COLORS[ch].many;
export const cap = s => s[0].toUpperCase() + s.slice(1);

/* ---------- grids: a list of rows from the top, one letter per pixel ---------- */
// A pixel's address is (f, c), as in a matrix: f the row, from 1 at the top, and then c the column, from 1 at the left
export const W = g => g[0].length, H = g => g.length;
export const cellAt = (g, f, c) => g[f - 1]?.[c - 1];
export const count = (g, ch) => g.join('').split(ch).length - 1;
export const painted = g => g.join('').replace(/\./g, '').length;
export const colorsOf = g => [...new Set(g.join('').replace(/\./g, ''))];
export const blank = (w, h) => Array.from({ length: h }, () => '.'.repeat(w));
export const flip = r => [...r].reverse().join('');
export const symV = g => g.every(r => r === flip(r));
export const symH = g => g.every((r, i) => r === g[H(g) - 1 - i]);
// g with the pixel (f, c) set to ch
export const put = (g, f, c, ch) => g.map((r, i) => i === f - 1 ? r.slice(0, c - 1) + ch + r.slice(c) : r);
// a w × h grid with the pixels of dots ([f, c, ch]) painted
export const dots = (w, h, list) => list.reduce((g, [f, c, ch]) => put(g, f, c, ch), blank(w, h));
// sprite s inside a w × h grid, its top left pixel at (f0, c0)
export const place = (s, w, h, f0, c0) => blank(w, h).map((r, i) => {
  const k = i - (f0 - 1);
  return k < 0 || k >= H(s) ? r : r.slice(0, c0 - 1) + s[k] + r.slice(c0 - 1 + W(s));
});
// two grids of the same size laid one over the other: the pixels of b go over those of a
export const over = (a, b) => a.map((r, i) => [...r].map((c, j) => b[i][j] === '.' ? c : b[i][j]).join(''));
// a full rectangle of w × h of colour ch, and the same with a hole in it
export const box = (w, h, ch = 'b') => Array.from({ length: h }, () => ch.repeat(w));
// the frame of a w × h: only the pixels of its edge
export const frameOf = (w, h, ch) => Array.from({ length: h }, (_, i) => i === 0 || i === h - 1 ? ch.repeat(w) : ch + '.'.repeat(w - 2) + ch);
// tile t repeated nx times to the right and ny times down
export const tile = (t, nx, ny) => Array.from({ length: H(t) * ny }, (_, i) => t[i % H(t)].repeat(nx));
// every pixel made k × k
export const scale = (g, k) => g.flatMap(r => Array(k).fill([...r].map(c => c.repeat(k)).join('')));
// the left half (v), the top half (h) or the top left quarter (vh) of g, the rest empty
export const half = (g, ax) => g.map((r, i) => ax.includes('h') && i >= Math.ceil(H(g) / 2) ? '.'.repeat(W(g)) : ax.includes('v') ? r.slice(0, Math.ceil(W(g) / 2)).padEnd(W(g), '.') : r);
// w × h pixels with the colours of list ([ch, n], the rest of the last one) scattered in an order that is always the same
export function scatter(w, h, list, seed = 7) {
  let a = seed >>> 0;
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const cells = shuffle(list.flatMap(([ch, n]) => Array(n).fill(ch)), rnd);
  return Array.from({ length: h }, (_, i) => cells.slice(i * w, i * w + w).join(''));
}
// the painted pixels as one full rectangle ({ w, h }), or null when they are not one
export function rectOf(g) {
  let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
  g.forEach((r, i) => [...r].forEach((c, j) => { if (c !== '.') { x0 = Math.min(x0, j); x1 = Math.max(x1, j); y0 = Math.min(y0, i); y1 = Math.max(y1, i); } }));
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  return painted(g) === w * h ? { w, h } : null;
}

/* ---------- fractions ---------- */
export const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
export const simp = (n, d) => { const k = gcd(n, d) || 1; return [n / k, d / k]; };
// a fraction as it is written on paper, one number over the other
export const F = (n, d) => `<span class="fr"><i>${n}</i><i>${d}</i></span>`;
export const pt = (f, c) => `(${f}, ${c})`;

/* ---------- the sprites ---------- */
const S = (name, the, g) => ({ name, the, g });
export const SPRITES = {
  bolet: S('Bolet', 'el bolet', ['..rrrr..', '.rwrrwr.', 'rwwrrwwr', 'rrrrrrrr', '.wwwwww.', '.wkwwkw.', '.wwwwww.']),
  cor: S('Cor', 'el cor', ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...']),
  moneda: S('Moneda', 'la moneda', ['.yyyy.', 'yyooyy', 'yyooyy', 'yyooyy', 'yyooyy', '.yyyy.']),
  estrella: S('Estrella', "l'estrella", ['...y...', '...y...', 'yyyyyyy', '.ykyky.', '..yyy..', '.yy.yy.', 'yy...yy']),
  granota: S('Granota', 'la granota', ['.ww..ww.', '.wk..kw.', 'gggggggg', 'gggggggg', 'ggppppgg', 'gggggggg', '.gg..gg.']),
  fantasma: S('Fantasma', 'el fantasma', ['..lll..', '.lllll.', 'lwwlwwl', 'lkwlkwl', 'lllllll', 'lllllll', 'l.l.l.l']),
  invasor: S('Invasor', "l'invasor", ['..g.....g..', '...g...g...', '..ggggggg..', '.gg.ggg.gg.', 'ggggggggggg', 'g.ggggggg.g', 'g.g.....g.g', '...gg.gg...']),
  poma: S('Poma', 'la poma', ['...m...', '..gm...', '.rrrrr.', 'rrrrrrr', 'rrrrrrr', 'rrrrrrr', '.rr.rr.']),
  creeper: S('Creeper', 'el creeper', ['gggggggg', 'gggggggg', 'gkkggkkg', 'gkkggkkg', 'gggkkggg', 'ggkkkkgg', 'ggkkkkgg', 'ggkggkgg']),
  joia: S('Joia', 'la joia', ['..cc..', '.cbbc.', 'cbwbbc', 'cbwbbc', '.cbbc.', '..cc..']),
  rosassa: S('Rosassa', 'la rosassa', ['r..bb..r', '.r.bb.r.', '..yyyy..', 'bbywwybb', 'bbywwybb', '..yyyy..', '.r.bb.r.', 'r..bb..r']),
  corPetit: S('Cor petit', 'el cor petit', ['.r.r.', 'rrrrr', '.rrr.', '..r..']),
  espasa: S('Espasa', "l'espasa", ['..n..', '..n..', '..n..', '..n..', '.yyy.', '..m..', '..m..'])
};
const G = id => SPRITES[id].g;

/* ---------- the pictures and the questions ---------- */
// A picture: { g, axes (the numbers of the columns and rows), lines (false: only the marks on the edge), axis ('v', 'h', 'vh': the
// lines of the mirror), tiles ([w, h]: thick lines between the tiles) }
export const pic = (g, o = {}) => ({ g, ...o });
// A question: text, and how it is answered: type 'num' (a number typed: ans), 'frac' (a fraction typed: ans [n, d]; simple: only the
// simplest one is taken), 'pick' (one of opts; ans the right one) or 'tap' (a pixel of the picture: ans the keys 'x,y' that are right).
// hint is what the frog says when asked, and say what it says when the answer is right. A pixel is the key 'f,c'
const Q = (type, text, ans, hint, say, o = {}) => ({ type, text, ans, hint, say, ...o });
const keysOf = (g, ch) => g.flatMap((r, i) => [...r].flatMap((c, j) => c === ch ? [`${i + 1},${j + 1}`] : []));
const WAY = 'Primer la fila, després la columna: baixa fins a la fila i després ves cap a la dreta fins a la columna.';
export const q = {
  calc: (text, ans, hint, say) => Q('num', text, ans, hint, say),
  pick: (text, opts, hint, say) => Q('pick', text, opts[0], hint, say, { opts }),
  tap: (text, keys, hint, say) => Q('tap', text, keys, hint, say),
  fr: (text, ans, hint, say, simple = false) => Q('frac', text, ans, hint, say, { simple }),
  // the pixel (f, c), on a picture with its numbers
  tapAt: (f, c) => Q('tap', `Toca el píxel ${pt(f, c)}.`, [`${f},${c}`], `${WAY} Fila ${f}, columna ${c}.`, `Aquest és el ${pt(f, c)}: fila ${f}, columna ${c}.`),
  // the address of the only pixel of colour ch; the wrong ones are the numbers turned round and a step off
  whereIs: (g, ch) => {
    const [f, c] = keysOf(g, ch)[0].split(',').map(Number), opts = [pt(f, c)];
    for (const [a, b] of [[c, f], [f + 1, c], [f, c + 1], [f, c - 1]]) if (opts.length < 3 && a >= 1 && b >= 1 && !opts.includes(pt(a, b))) opts.push(pt(a, b));
    return Q('pick', `Quina és l'adreça del píxel ${one(ch)}?`, opts[0], 'Ves des del píxel cap als números de l\'esquerra: és la fila, i va primer. Després puja fins als números de dalt: és la columna.', `El píxel ${one(ch)} és a la fila ${f} i a la columna ${c}: ${pt(f, c)}.`, { opts });
  },
  // the colour of the pixel (f, c); one of the wrong ones is the colour of (c, f), the numbers turned round
  colorAt: (g, f, c) => {
    const k = cellAt(g, f, c), opts = [one(k), ...new Set([cellAt(g, c, f), ...colorsOf(g), '.'].filter(d => d && d !== k).map(one))].slice(0, 3);
    return Q('pick', `De quin color és el píxel ${pt(f, c)}?`, opts[0], `${WAY} Fila ${f}, columna ${c}.`, `El ${pt(f, c)} és ${one(k)}.`, { opts });
  },
  // how many pixels of colour ch, in the whole picture or in the row f
  count: (g, ch, the) => Q('num', `Quants píxels ${many(ch)} té ${the}?`, count(g, ch), 'Compta fila per fila, de dalt a baix, i suma.',
    `${g.map(r => count([r], ch)).filter(Boolean).join(' + ')} = ${count(g, ch)}.`),
  rowCount: (g, ch, f) => Q('num', `Quants píxels ${many(ch)} hi ha a la fila ${f}?`, count([g[f - 1]], ch), `Baixa fins a la fila ${f}, i compta només aquella fila.`, `A la fila ${f} n'hi ha ${count([g[f - 1]], ch)}.`),
  // a move from (f, c): df rows down (up when it is less than 0) and dc columns to the right (left)
  move: (f, c, df, dc) => Q('tap', `Ets al ${pt(f, c)}. Ves ${Math.abs(df)} ${df < 0 ? 'amunt' : 'avall'} i ${Math.abs(dc)} ${dc < 0 ? "cap a l'esquerra" : 'cap a la dreta'}. On arribes? Toca'l.`,
    [`${f + df},${c + dc}`], `La fila fa ${f} ${df < 0 ? '−' : '+'} ${Math.abs(df)} i la columna, ${c} ${dc < 0 ? '−' : '+'} ${Math.abs(dc)}.`, `Arribes al ${pt(f + df, c + dc)}.`),
  // the pixels of a full rectangle of w × h
  area: (w, h, text = 'Quants píxels té el rectangle?') => Q('num', text, w * h, `Una fila té ${w} píxels, i hi ha ${h} files: ${h} × ${w}.`, `${h} × ${w} = ${w * h} píxels.`),
  // the fraction of the whole grid that has colour ch
  frac: (g, ch, simple = false) => {
    const k = count(g, ch), N = W(g) * H(g), [n, d] = simp(k, N);
    return Q('frac', `Quina fracció del quadre és de color ${one(ch)}?${simple ? ' Simplifica-la tant com puguis.' : ''}`, [n, d],
      simple ? `Són ${k} de ${N}: ${F(k, N)}. Divideix el de dalt i el de baix pel mateix número, fins que no puguis més.` : `A dalt, els píxels ${many(ch)}. A baix, tots els píxels del quadre: ${W(g)} × ${H(g)}.`,
      `${k} de ${N}: ${F(k, N)}${n !== k ? ` = ${F(n, d)}` : ''}.`, { simple });
  },
  // is it the same at both sides of the mirror
  sym: (g, yes, why) => Q('pick', 'És simètric? Mira les dues bandes de la línia groga.', yes ? 'Sí' : 'No', 'Mira cada píxel i el seu bessó a l\'altra banda del mirall: han de ser del mateix color.', why, { opts: ['Sí', 'No'] }),
  // the pixel that breaks the symmetry, and its twin: either is right
  odd: (g, f, c) => Q('tap', 'Hi ha un píxel que trenca la simetria. Toca\'l!', [`${f},${c}`, `${f},${W(g) + 1 - c}`], 'Compara la banda esquerra amb la dreta, fila per fila.', 'Aquí! Al mirall no hi ha el mateix color.')
};
const MIRRORS = ['Només el vertical', "Només l'horitzontal", 'Tots dos', 'Cap'];
const mirrors = (k, why) => q.pick('Quins miralls el deixen igual? La línia vertical, l\'horitzontal, totes dues o cap?', [MIRRORS[k], ...MIRRORS.filter((_, j) => j !== k)], 'Prova un mirall i després l\'altre: les dues bandes han de ser iguals.', why);

/* ---------- the rules of a drawing to make ---------- */
// A rule is [kind, ...]; each says whether a grid keeps it, what it says and, when it is broken, what is wrong
export const RULES = {
  count: (g, ch, n) => count(g, ch) === n,
  frac: (g, ch, n, d) => count(g, ch) * d === W(g) * H(g) * n,
  total: (g, n) => painted(g) === n,
  full: g => painted(g) === W(g) * H(g),
  sym: (g, ax) => (!ax.includes('v') || symV(g)) && (!ax.includes('h') || symH(g)),
  rect: (g, w, h, area) => { const r = rectOf(g); return !!r && (!w || r.w === w) && (!h || r.h === h) && (!area || r.w * r.h === area); },
  tiled: (g, tw, th) => g.every((r, i) => [...r].every((c, j) => c === g[i % th][j % tw])),
  colors: (g, k) => colorsOf(g).length >= k
};
const sw = ch => `<b class="sw" style="--c:${COLORS[ch].hex}"></b>`;
export function ruleText([kind, a, b, c]) {
  if (kind === 'count') return `${sw(a)} ${b} píxels ${many(a)}`;
  if (kind === 'frac') return `${sw(a)} ${F(b, c)} del quadre, de color ${one(a)}`;
  if (kind === 'total') return `${a} píxels pintats en total`;
  if (kind === 'full') return 'Tot el quadre pintat, sense cap forat';
  if (kind === 'sym') return a === 'v' ? 'Simètric: igual a les dues bandes de la línia groga' : 'Simètric respecte de les dues línies grogues';
  if (kind === 'rect') return `Un rectangle ple${a ? ` de ${a} columnes` : ''}${b ? `${a ? ' i' : ' de'} ${b} files` : ''}${c ? `${a || b ? ' i' : ' de'} ${c} píxels` : ''}`;
  if (kind === 'tiled') return `Una rajola de ${a} × ${b} que es repeteix per tot el quadre`;
  return `Com a mínim ${a} colors diferents`;
}
export function ruleWhy([kind, a, b, c], g) {
  if (kind === 'count') return `Ara n'hi ha ${count(g, a)} de color ${one(a)}.`;
  if (kind === 'frac') return `Ara n'hi ha ${count(g, a)} de color ${one(a)}. Quants són ${F(b, c)} de ${W(g) * H(g)}?`;
  if (kind === 'total') return `Ara n'hi ha ${painted(g)} de pintats.`;
  if (kind === 'full') return `Encara hi ha ${W(g) * H(g) - painted(g)} píxels buits.`;
  if (kind === 'sym') return 'Mira cada píxel i el seu bessó a l\'altra banda del mirall.';
  if (kind === 'rect') { const r = rectOf(g); return r ? `Ara és de ${r.w} × ${r.h} = ${r.w * r.h}.` : 'Els píxels pintats no fan un rectangle ple.'; }
  if (kind === 'tiled') return 'Mira la rajola de dalt a l\'esquerra i repeteix-la igual.';
  return `Ara n'hi ha ${colorsOf(g).length}.`;
}
// the rules a grid breaks, by their place in the list
export const brokenRules = (L, g) => L.rules.flatMap((r, k) => RULES[r[0]](g, ...r.slice(1)) ? [] : [k]);
// the pixels of a copy that are not the ones of the goal, as keys 'f,c'
export const wrongCells = (L, g) => L.goal.flatMap((r, i) => [...r].flatMap((c, j) => g[i][j] === c ? [] : [`${i + 1},${j + 1}`]));

// The steps of a drawing by coordinates: a line for each colour with its pixels (coords), or a line for each piece of a row of one
// colour, from the top (runs): «de (5, 2) a (5, 6)»
export function stepsOf(g, how) {
  if (how === 'coords') return colorsOf(g).map(ch => ({ ch, text: keysOf(g, ch).map(k => pt(...k.split(','))).join(' ') }));
  const out = [];
  g.forEach((r, i) => { const f = i + 1; for (let j = 0; j < r.length;) { let e = j; while (e + 1 < r.length && r[e + 1] === r[j]) e++;
    if (r[j] !== '.') out.push({ ch: r[j], text: j === e ? pt(f, j + 1) : `de ${pt(f, j + 1)} a ${pt(f, e + 1)}` }); j = e + 1; } });
  return out;
}

/* ---------- the levels ---------- */
// kind 'read': rounds of { pic, q }, a question about a picture (the same picture stays on screen while the next round has it too).
// kind 'paint': the child paints a w × h grid with the colours of colors. given: the pixels that come painted and cannot change. Either
// goal, the drawing it must be (then steps, the coordinates to follow, or model, the picture to copy) or rules, what it must keep
const read = (title, say, rounds) => ({ kind: 'read', title, say, rounds: rounds.map(([p, qq]) => ({ pic: p, q: qq })) });
const paint = (title, say, o) => { const g = o.goal || o.given || blank(o.w, o.h);
  return { kind: 'paint', title, say, w: W(g), h: H(g), given: o.given || blank(W(g), H(g)), ...o, ...(o.how ? { steps: stepsOf(o.goal, o.how) } : {}) }; };
const same = (p, ...qs) => qs.map(qq => [p, qq]);
const ax = (g, o) => pic(g, { axes: true, ...o });

const B = G('bolet'), C = G('cor'), MO = G('moneda'), GR = G('granota'), FA = G('fantasma'), IN = G('invasor');
const ODD_B = put(B, 3, 7, 'r'), ODD_G = put(GR, 5, 2, 'p'), ODD_I = put(IN, 4, 9, '.');
const QUART = ['bbbb', 'bbbb', 'bbyy', 'bbyy'], FRANCE = box(2, 4, 'b').map((r, i) => r + 'ww' + 'rr'), SENYERA = Array.from({ length: 9 }, (_, i) => (i % 2 ? 'r' : 'y').repeat(6));
const MIX = scatter(6, 4, [['r', 8], ['b', 6], ['y', 10]], 3);
const BRICK = ['ooom', 'omoo'];

export const SECTIONS = [
  { name: 'Coordenades', sub: 'Cada píxel té la seva adreça: (fila, columna).', levels: [
    read('Fila i columna', 'Cada píxel té una adreça de dos números, com a les matrius: (fila, columna). Primer baixa fins a la fila, i després ves cap a la dreta fins a la columna.',
      same(ax(blank(6, 5)), q.tapAt(3, 2), q.tapAt(1, 5), q.tapAt(5, 4))),
    read("Quina és l'adreça?", 'Ara el píxel ja és pintat: tu dius on és. El número de la fila sempre va primer.',
      same(ax(dots(6, 5, [[4, 2, 'r'], [2, 5, 'b'], [3, 6, 'y']])), q.whereIs(dots(6, 5, [[4, 2, 'r']]), 'r'), q.whereIs(dots(6, 5, [[2, 5, 'b']]), 'b'), q.whereIs(dots(6, 5, [[3, 6, 'y']]), 'y'))),
    read("Compte amb l'ordre!", '(2, 5) i (5, 2) tenen els mateixos números, però no són el mateix píxel!',
      same(ax(dots(6, 6, [[2, 5, 'r'], [5, 2, 'b'], [3, 3, 'y']])), q.tapAt(2, 5), q.tapAt(5, 2), q.colorAt(dots(6, 6, [[2, 5, 'r'], [5, 2, 'b'], [3, 3, 'y']]), 5, 2))),
    paint('Pinta per coordenades', "Pinta de vermell cada píxel de la llista. Quan acabis, sortirà un dibuix!", { goal: place(G('corPetit'), 7, 6, 2, 2), how: 'coords', colors: ['r'], axes: true }),
    paint('Una espasa', 'Ara amb tres colors. Tria el color i pinta els píxels de cada línia.', { goal: place(G('espasa'), 7, 8, 2, 2), how: 'coords', colors: ['n', 'y', 'm'], axes: true }),
    read('Llegir un sprite', 'El bolet té números a les vores. Fes-los servir per trobar cada píxel.',
      same(ax(B), q.colorAt(B, 6, 3), q.rowCount(B, 'w', 5), q.tap("Toca un ull del bolet.", keysOf(B, 'k'), 'Els ulls són els dos píxels negres.', `Els ulls són al ${pt(6, 3)} i al ${pt(6, 6)}.`))),
    paint('Fila a fila', 'Quan molts píxels seguits són del mateix color, la llista diu «de … a …». Pinta tota la tira!', { goal: MO, how: 'runs', colors: ['y', 'o'], axes: true }),
    read('Moviments', 'Moure\'s és sumar o restar: avall i a la dreta, sumes; amunt i a l\'esquerra, restes.',
      [[ax(dots(8, 6, [[5, 2, 'g']])), q.move(5, 2, -2, 3)], [ax(dots(8, 6, [[2, 5, 'g']])), q.move(2, 5, 3, 2)], [ax(dots(8, 6, [[1, 7, 'g']])), q.move(1, 7, 4, -5)]]),
    paint('Mou el dibuix', 'Copia el cor 6 columnes més a la dreta: el píxel (f, c) va a parar a (f, c + 6). La fila no canvia!',
      { given: place(G('corPetit'), 12, 6, 2, 1), goal: over(place(G('corPetit'), 12, 6, 2, 1), place(G('corPetit'), 12, 6, 2, 7)), colors: ['r'], axes: true }),
    paint('El fantasma', "L'últim: un fantasma de tres colors. Ves fila per fila.", { goal: FA, how: 'runs', colors: ['l', 'w', 'k'], axes: true })
  ] },
  { name: 'Àrea', sub: 'Files per columnes: comptar píxels multiplicant.', levels: [
    read('Files per columnes', 'Per saber quants píxels té un rectangle no cal comptar-los un a un: multiplica les files per les columnes.',
      [[pic(box(4, 3)), q.area(4, 3)], [pic(box(5, 2, 'g')), q.area(5, 2)], [pic(box(6, 3, 'r')), q.area(6, 3)]]),
    read('Sense quadrícula', "Ara no es veuen tots els píxels: només les marques de les vores. Compta un costat, l'altre, i multiplica.",
      [[pic(box(7, 4, 'o'), { lines: false }), q.area(7, 4)], [pic(box(6, 6, 'l'), { lines: false }), q.area(6, 6)], [pic(box(8, 5, 'b'), { lines: false }), q.area(8, 5)]]),
    paint('Fes un rectangle', "Pinta un rectangle ple de 3 columnes d'ample i 4 files d'alt.", { w: 8, h: 6, rules: [['rect', 3, 4]], colors: ['b'] }),
    paint('Un rectangle de 12', 'Pinta un rectangle ple de 12 píxels. Hi ha moltes maneres de fer-lo!', { w: 8, h: 6, rules: [['rect', 0, 0, 12]], colors: ['g'], done: '1 × 12, 2 × 6, 3 × 4, 4 × 3, 6 × 2... tots fan 12!' }),
    read('El costat que falta', 'Si saps quants píxels té un rectangle i quantes columnes, les files surten dividint.',
      [[pic(box(6, 1, 'y')), q.calc('Un rectangle de 24 píxels té 6 columnes, com aquesta fila. Quantes files té?', 4, 'Quantes vegades 6 fan 24? 6 × ? = 24.', '6 × 4 = 24: té 4 files.')],
        [pic(box(5, 1, 'r')), q.calc('Un rectangle de 35 píxels té 5 columnes. Quantes files té?', 7, '5 × ? = 35.', '5 × 7 = 35: 7 files.')],
        [pic(box(8, 1, 'b')), q.calc('Un rectangle de 48 píxels té 8 columnes. Quantes files té?', 6, '8 × ? = 48.', '8 × 6 = 48: 6 files.')]]),
    read('Formes en L', 'Una forma que no és un rectangle es pot tallar en rectangles. Calcula cada tros i suma.',
      [[pic(['bb....', 'bb....', 'bb....', 'bbbbbb', 'bbbbbb']), q.calc('Quants píxels té la L?', 18, 'Talla-la: a dalt, un rectangle de 2 × 3; a baix, un de 6 × 2.', '6 + 12 = 18.')],
        [pic(['ggggggg', 'ggggggg', '..ggg..', '..ggg..']), q.calc('Quants píxels té la T?', 20, 'A dalt, 7 × 2. A baix, 3 × 2.', '14 + 6 = 20.')],
        [pic(['..rr..', '..rr..', 'rrrrrr', 'rrrrrr', '..rr..', '..rr..']), q.calc('Quants píxels té la creu?', 20, 'La barra del mig fa 6 × 2. Dalt i baix queden dos trossos de 2 × 2.', '12 + 4 + 4 = 20.')]]),
    read('Sprites grans', 'Els sprites dels videojocs antics feien 8 × 8 o 16 × 16 píxels.',
      same(pic(G('creeper')), q.calc('El creeper fa 8 × 8. Quants píxels té?', 64, '8 files de 8 píxels.', '8 × 8 = 64.'),
        q.calc('I un sprite de 16 × 16, quants píxels té?', 256, '16 × 16 = 16 × 10 + 16 × 6.', '160 + 96 = 256.'),
        q.calc('Quantes vegades més píxels té el de 16 × 16 que el de 8 × 8?', 4, 'Divideix 256 entre 64. O pensa: el doble d\'ample i el doble d\'alt.', '256 : 64 = 4. El doble d\'ample i el doble d\'alt fa 4 vegades més!'))),
    read('Rectangles amb forat', 'Un rectangle amb un forat: calcula el rectangle sencer i treu-hi el forat.',
      [[pic(['oooooo', 'oooooo', 'oo..oo', 'oo..oo', 'oooooo']), q.calc('Quants píxels taronja hi ha?', 26, 'El rectangle sencer fa 6 × 5. El forat, 2 × 2.', '30 − 4 = 26.')],
        [pic(['gggggggg', 'g....ggg', 'g....ggg', 'gggggggg', 'gggggggg', 'gggggggg']), q.calc('Quants píxels verds hi ha?', 40, 'Sencer: 8 × 6. El forat: 4 × 2.', '48 − 8 = 40.')]]),
    paint('Endevina les columnes', 'Un rectangle ple de 3 files i 18 píxels. Quantes columnes ha de tenir?', { w: 8, h: 6, rules: [['rect', 0, 3, 18]], colors: ['r'], done: '3 × 6 = 18: sis columnes!' }),
    read('La pantalla', 'La granota surt en una pantalla petita de 10 × 8 píxels.',
      same(pic(place(GR, 10, 8, 2, 2)), q.calc('Quants píxels té la pantalla?', 80, '10 columnes i 8 files.', '10 × 8 = 80.'),
        q.calc('La granota té 44 píxels pintats. Quants en queden de buits?', 36, 'Tots els de la pantalla menys els pintats.', '80 − 44 = 36.'),
        q.calc('Una pantalla més gran fa 20 × 16 píxels. Quants píxels té?', 320, '20 × 16 = 20 × 10 + 20 × 6.', '200 + 120 = 320.')))
  ] },
  { name: 'Fraccions de colors', sub: 'Quina part del dibuix és de cada color.', levels: [
    read('Meitats i quarts', 'Una fracció diu quina part del quadre és d\'un color: a dalt, els píxels del color; a baix, tots els píxels. Escriu el de dalt, prem /, i el de baix.',
      [[pic(['rrbb', 'rrbb']), q.frac(['rrbb', 'rrbb'], 'r')], [pic(QUART), q.frac(QUART, 'y')], [pic(QUART), q.frac(QUART, 'b')]]),
    read('La trampa', 'Compte! A baix hi van TOTS els píxels, no només els de l\'altre color.',
      [[pic(['gggg', 'wwww', 'wwww', 'wwww']), q.pick('Quina fracció del quadre és verda?', [F(1, 4), F(1, 3), F(4, 1)], 'A baix hi van tots els píxels: els verds i els blancs.', '4 de 16 és 1/4. Comparar 4 verds amb 12 blancs (4/12 = 1/3) no és la part del quadre!')],
        [pic(scatter(6, 2, [['r', 4], ['w', 8]], 5)), q.pick('Quina fracció del quadre és vermella?', [F(1, 3), F(1, 2), F(4, 8)], 'Hi ha 4 vermells i 12 píxels en total.', '4 de 12 = 1/3.')],
        [pic(scatter(4, 2, [['b', 2], ['y', 6]], 9)), q.frac(scatter(4, 2, [['b', 2], ['y', 6]], 9), 'b')]]),
    read('De la fracció als píxels', 'Ara al revés: saps la fracció, i calcules quants píxels són.',
      [[pic(blank(4, 4)), q.calc(`${F(3, 4)} d'aquest quadre és blau. Quants píxels blaus hi ha?`, 12, '16 píxels en 4 parts iguals: cada quart són 4. Tres quarts: 3 × 4.', '16 : 4 = 4, i 3 × 4 = 12.')],
        [pic(blank(6, 3)), q.calc(`${F(2, 3)} d'aquest quadre és verd. Quants píxels verds hi ha?`, 12, '18 píxels en 3 parts: cada terç són 6.', '18 : 3 = 6, i 2 × 6 = 12.')],
        [pic(blank(8, 3)), q.calc(`${F(5, 8)} d'aquest quadre és vermell. Quants píxels vermells hi ha?`, 15, '24 píxels en 8 parts: cada vuitè són 3.', '24 : 8 = 3, i 5 × 3 = 15.')]]),
    paint('Pinta tres quarts', 'Pinta de vermell tres quarts del quadre. On, tu tries!', { w: 4, h: 4, rules: [['frac', 'r', 3, 4]], colors: ['r'] }),
    paint('Tres colors', 'Pinta la meitat de blau, un quart de groc i un quart de vermell.', { w: 4, h: 4, rules: [['frac', 'b', 1, 2], ['frac', 'y', 1, 4], ['frac', 'r', 1, 4]], colors: ['b', 'y', 'r'] }),
    read('Banderes', 'Les banderes són mosaics de colors. Quina part és de cada color?',
      [[pic(FRANCE), q.frac(FRANCE, 'b')], [pic(SENYERA), q.fr('Quina fracció de la senyera és vermella?', [4, 9], 'Hi ha 9 franges, i 4 són vermelles. Cada franja té els mateixos píxels.', '4 franges de 9: 4/9.')],
        [pic(SENYERA), q.calc('Quants píxels grocs té la senyera?', 30, '5 franges grogues de 6 píxels.', '5 × 6 = 30.')]]),
    read('Simplifica', 'Una fracció es pot fer més petita dividint el de dalt i el de baix pel mateix número: 6/24 = 1/4.',
      [[pic(scatter(6, 4, [['r', 6], ['w', 18]], 11)), q.frac(scatter(6, 4, [['r', 6], ['w', 18]], 11), 'r', true)],
        [pic(scatter(6, 4, [['b', 8], ['w', 16]], 12)), q.frac(scatter(6, 4, [['b', 8], ['w', 16]], 12), 'b', true)],
        [pic(scatter(4, 4, [['g', 12], ['w', 4]], 13)), q.frac(scatter(4, 4, [['g', 12], ['w', 4]], 13), 'g', true)]]),
    paint('Terços i sisens', 'Un terç de verd, la meitat de blanc i un sisè de vermell. Calcula quants píxels són abans de pintar!', { w: 6, h: 4, rules: [['frac', 'g', 1, 3], ['frac', 'w', 1, 2], ['frac', 'r', 1, 6]], colors: ['g', 'w', 'r'] }),
    read('Pintats i buits', 'Un sprite té píxels pintats i píxels buits. Tots són part del quadre.',
      same(pic(MO), q.fr('Quina fracció del quadre està pintada?', [8, 9], 'Compta els pintats (dalt) i tots els del quadre, 6 × 6 (baix).', '32 de 36 = 8/9.'),
        q.fr('I quina fracció està buida?', [1, 9], 'Els buits són els quatre racons.', '4 de 36 = 1/9.'),
        q.fr('Quina fracció dels píxels pintats és taronja?', [1, 4], 'Ara a baix hi van només els pintats: 32.', '8 de 32 = 1/4.'))),
    read('Qui en té més?', 'Tres colors en un mosaic. Quin ocupa més part?',
      same(pic(MIX), q.tap('Quin color ocupa més part del quadre? Toca un píxel d\'aquest color.', keysOf(MIX, 'y'), 'Compta els píxels de cada color.', 'El groc: 10 de 24.'),
        q.frac(MIX, 'y'), q.pick('Què és més gran?', [`${F(1, 3)} (el vermell)`, `${F(1, 4)} (el blau)`, 'Són iguals'], 'Compta els vermells i els blaus.', 'Un terç són 8 píxels i un quart, 6. Com més parts, més petites!')))
  ] },
  { name: 'Simetria', sub: 'Miralls: el que hi ha a una banda, a l\'altra.', levels: [
    read('Mirall o no?', 'Un dibuix és simètric si la línia groga és com un mirall: a cada banda hi ha el mateix.',
      [[pic(C, { axis: 'v' }), q.sym(C, true, 'Sí: les dues bandes del cor són iguals.')], [pic(FA, { axis: 'v' }), q.sym(FA, false, 'No: els ulls miren cap a l\'esquerra, i a l\'altra banda no és igual.')],
        [pic(IN, { axis: 'v' }), q.sym(IN, true, "Sí: l'invasor és igual a les dues bandes.")]]),
    read("L'intrús", 'Algú ha canviat un píxel i el dibuix ja no és simètric. Troba\'l!',
      [[pic(ODD_B, { axis: 'v' }), q.odd(ODD_B, 3, 7)], [pic(ODD_G, { axis: 'v' }), q.odd(ODD_G, 5, 2)], [pic(ODD_I, { axis: 'v' }), q.odd(ODD_I, 4, 9)]]),
    paint('Completa el bolet', "Tens la meitat esquerra. Pinta la dreta com si fos un mirall: el que és a prop de la línia, a prop; el que és lluny, lluny.", { given: half(B, 'v'), goal: B, colors: ['r', 'w', 'k'], axis: 'v' }),
    paint('Completa la granota', 'La meitat de la granota. Completa-la!', { given: half(GR, 'v'), goal: GR, colors: ['g', 'w', 'k', 'p'], axis: 'v' }),
    read('Comptar amb el mirall', 'Amb un mirall, cada píxel té un bessó a l\'altra banda.',
      [[pic(half(B, 'v'), { axis: 'v' }), q.calc('Aquesta meitat té 22 píxels pintats. Quants en tindrà el bolet sencer?', 44, 'L\'altra meitat és igual.', '22 × 2 = 44.')],
        [ax(dots(8, 5, [[4, 2, 'r']]), { axis: 'v' }), q.pick('El píxel vermell (4, 2) es reflecteix al mirall. On va a parar?', [pt(4, 7), pt(4, 6), pt(5, 2)], 'Compta quantes columnes hi ha del píxel al mirall, i compta les mateixes a l\'altra banda. La fila no canvia.', 'Al (4, 7): és a 3 columnes del mirall, com el (4, 2).')],
        [ax(dots(8, 5, [[2, 3, 'b']]), { axis: 'v' }), q.tap('Toca on va a parar el reflex del píxel blau (2, 3).', ['2,6'], 'El (2, 3) és a 2 columnes del mirall.', 'Al (2, 6).')]]),
    paint('Mirall de través', 'Ara el mirall està ajagut: la meitat de baix és la de dalt al revés.', { given: half(G('joia'), 'h'), goal: G('joia'), colors: ['c', 'b', 'w'], axis: 'h' }),
    paint('Dos miralls', 'Dos miralls! Tens un quart de la rosassa: completa els altres tres quarts.', { given: half(G('rosassa'), 'vh'), goal: G('rosassa'), colors: ['r', 'b', 'y', 'w'], axis: 'vh' }),
    read('Quins miralls?', 'Un dibuix pot tenir un mirall, dos, o cap.',
      [[pic(C, { axis: 'vh' }), mirrors(0, 'Només el vertical: el cor no és igual de cap per avall.')], [pic(G('joia'), { axis: 'vh' }), mirrors(1, "Només l'horitzontal: el blanc és a l'esquerra.")],
        [pic(FA, { axis: 'vh' }), mirrors(3, 'Cap: els ulls i les potes trenquen els dos miralls.')]]),
    read('Reflexos amb números', 'Un quadre de 10 columnes amb el mirall al mig. Fixa\'t: un píxel i el seu bessó sempre sumen 11!',
      [[ax(dots(10, 4, [[4, 3, 'r']]), { axis: 'v' }), q.calc('El píxel (4, 3) es reflecteix. A quina columna va a parar?', 8, 'Les dues columnes sumen 11: 3 + ? = 11.', '3 + 8 = 11: a la columna 8.')],
        [ax(dots(10, 4, [[2, 1, 'b']]), { axis: 'v' }), q.calc('I el (2, 1)?', 10, '1 + ? = 11.', 'A la columna 10, la de l\'altra punta.')],
        [ax(dots(10, 4, [[1, 5, 'g']]), { axis: 'v' }), q.calc('I el (1, 5)?', 6, '5 + ? = 11.', 'A la 6: just a l\'altra banda del mirall.')]]),
    paint('Inventa un sprite simètric', 'Inventa un dibuix simètric de 10 píxels en total: 4 grocs i els altres del color que vulguis.', { w: 6, h: 5, rules: [['sym', 'v'], ['total', 10], ['count', 'y', 4]], colors: ['y', 'r', 'b', 'g'], axis: 'v' })
  ] },
  { name: 'Mosaics', sub: 'Rajoles i sèries que es repeteixen.', levels: [
    read('Sèries', 'Una sèrie repeteix sempre el mateix tros. Aquí: vermell, blau, blau.',
      same(pic(['rbbrbbrbbrbb']), q.pick('Si la sèrie continua, de quin color és el píxel 13?', ['vermell', 'blau'], 'Després de cada blau, blau ve un vermell.', 'El 13 torna a començar el tros: vermell.'),
        q.calc('Quants blaus hi ha en aquests 12 píxels?', 8, 'Cada tros de 3 té 2 blaus, i hi ha 4 trossos.', '4 × 2 = 8.'),
        q.calc('I si la sèrie fos de 30 píxels, quants vermells hi hauria?', 10, 'Cada tros de 3 té un vermell. Quants trossos fan 30?', '30 : 3 = 10.'))),
    read('El píxel 20', 'Per saber un píxel llunyà no cal dibuixar-los tots: compta quantes voltes senceres fa la sèrie.',
      same(pic(['rygrygryg']), q.pick('De quin color és el píxel 20?', ['groc', 'vermell', 'verd'], 'Cada 3 píxels torna a començar. 18 = 3 × 6: el 18 acaba una volta. Després, el 19 i el 20.', 'El 19 és vermell i el 20, groc.'),
        q.pick('I el píxel 30?', ['verd', 'vermell', 'groc'], '30 = 3 × 10: el 30 acaba una volta.', 'El 30 tanca una volta: verd.'),
        q.calc('Quants verds hi ha en els primers 30 píxels?', 10, 'Un verd a cada volta de 3.', '30 : 3 = 10.'))),
    paint('Continua la sèrie', 'Les dues columnes de l\'esquerra són la rajola. Repeteix-la fins al final!', { given: place(['ry', 'yr'], 8, 2, 1, 1), goal: tile(['ry', 'yr'], 4, 1), colors: ['r', 'y'] }),
    read('Rajoles', 'Un mosaic de rajoles iguals: compta una rajola i multiplica.',
      same(pic(tile(['bw', 'wb'], 4, 3), { tiles: [2, 2] }), q.calc('Quantes rajoles de 2 × 2 hi ha?', 12, '4 rajoles a cada fila, i 3 files de rajoles.', '4 × 3 = 12.'),
        q.calc('Quants píxels blaus hi ha en total?', 24, 'Cada rajola té 2 blaus.', '12 × 2 = 24.'), q.frac(tile(['bw', 'wb'], 4, 3), 'b'))),
    paint('Enrajola', 'La rajola de dalt a l\'esquerra es repeteix cap a la dreta i cap avall. Acaba el terra!', { given: place(['gyg', 'yby'], 6, 4, 1, 1), goal: tile(['gyg', 'yby'], 2, 2), colors: ['g', 'y', 'b'], tiles: [3, 2] }),
    read('El mur de maons', 'Un mur fet amb una rajola de 4 × 2 que es repeteix.',
      same(pic(tile(BRICK, 3, 3), { tiles: [4, 2] }), q.calc('Quants píxels taronja té una rajola?', 6, 'Una rajola fa 4 × 2 = 8 píxels, i 2 són marrons.', '8 − 2 = 6.'),
        q.calc('Quantes rajoles té el mur?', 9, '3 a cada fila, i 3 files.', '3 × 3 = 9.'), q.calc('Quants píxels taronja té tot el mur?', 54, '9 rajoles, i 6 taronja a cada una.', '9 × 6 = 54.'))),
    read('El marc', 'Un marc només té els píxels de la vora. Compte amb els racons: no els comptis dues vegades!',
      [[pic(frameOf(6, 6, 'm')), q.calc('Quants píxels té el marc?', 20, 'Dalt 6 i baix 6. Als costats en queden 4 i 4.', '6 + 6 + 4 + 4 = 20.')],
        [pic(frameOf(8, 5, 'n')), q.calc('I aquest?', 22, 'Dalt 8 i baix 8. Als costats en queden 3 i 3.', '8 + 8 + 3 + 3 = 22.')],
        [pic(frameOf(10, 10, 'y'), { lines: false }), q.calc('Un marc de 10 × 10. Quants píxels té?', 36, 'Dalt 10, baix 10, i als costats 8 i 8.', '10 + 10 + 8 + 8 = 36.')]]),
    paint('Acaba el terra', 'La primera fila de rajoles ja és feta. Acaba el terra igual.', { given: tile(['rb', 'bw'], 3, 3).map((r, i) => i < 2 ? r : '......'), goal: tile(['rb', 'bw'], 3, 3), colors: ['r', 'b', 'w'], tiles: [2, 2] }),
    read('Terres gegants', 'Amb la multiplicació, pots calcular terres enormes sense dibuixar-los.',
      same(pic(tile(['yb', 'by'], 3, 2), { tiles: [2, 2] }), q.calc('Cada rajola té 2 píxels grocs. Un terra de 10 × 10 rajoles, quants grocs té?', 200, '10 × 10 = 100 rajoles, i 2 grocs a cada una.', '100 × 2 = 200.'),
        q.calc('Cada rajola fa 2 × 2 píxels. Quants píxels té el terra de 10 × 10 rajoles?', 400, '100 rajoles de 4 píxels.', '100 × 4 = 400.'),
        q.calc('I quants grocs tindria un terra de 20 × 10 rajoles?', 400, '20 × 10 = 200 rajoles.', '200 × 2 = 400.'))),
    paint('Inventa una rajola', 'Inventa una rajola de 2 × 2 i repeteix-la per tot el quadre. Fes servir dos colors o més.', { w: 6, h: 4, rules: [['tiled', 2, 2], ['full'], ['colors', 2]], colors: ['r', 'y', 'b', 'g', 'w'], tiles: [2, 2] })
  ] },
  { name: 'La botiga de boletes', sub: 'Quantes boletes de cada color calen per fer un sprite.', levels: [
    read('Comptar boletes', 'Les boletes de planxar són píxels de veritat: cada píxel del dibuix és una boleta.',
      same(pic(B), q.count(B, 'r', 'el bolet'), q.count(B, 'w', 'el bolet'), q.calc('Quantes boletes calen en total per fer el bolet?', 44, 'Suma les vermelles, les blanques i les negres.', '20 + 22 + 2 = 44.'))),
    read('Molts cors', 'Per fer molts dibuixos iguals, multiplica.',
      same(pic(C), q.count(C, 'r', 'el cor'), q.calc('I per fer 3 cors?', 81, '27 × 3: fes 20 × 3 i 7 × 3.', '60 + 21 = 81.'),
        q.calc('Si tens 100 boletes vermelles, quantes et sobren després de fer els 3 cors?', 19, '100 − 81.', '100 − 81 = 19.'))),
    read('Bosses de 10', 'A la botiga, les boletes es venen en bosses de 10.',
      same(pic(MO), q.count(MO, 'y', 'la moneda'), q.calc('Quantes bosses de 10 boletes grogues has de comprar per fer la moneda?', 3, 'Amb 2 bosses en tens 20: no n\'hi ha prou per a 24.', '2 bosses fan 20 i en calen 4 més: 3 bosses!'),
        q.calc('Quantes boletes grogues et sobraran?', 6, '3 bosses són 30 boletes.', '30 − 24 = 6.'))),
    read('El doble de gran', 'Si cada píxel es fa de 2 × 2 boletes, el dibuix és el doble d\'ample i el doble d\'alt.',
      [[pic(scale(C, 2)), q.calc('El cor té 27 píxels. Si cada píxel es fa de 2 × 2 boletes, quantes boletes calen?', 108, 'Cada píxel ara són 4 boletes: 27 × 4.', '27 × 4 = 108.')],
        [pic(C), q.calc('I si cada píxel es fa de 3 × 3 boletes?', 243, 'Cada píxel són 9 boletes: 27 × 9.', '27 × 9 = 243.')]]),
    read('Fracció de boletes', 'Quina part de les boletes és de cada color? Compta-les totes: els buits no són boletes!',
      same(pic(GR), q.fr('Quina fracció de les boletes de la granota són verdes?', [8, 11], 'Compta les verdes (dalt) i totes les boletes, 44 (baix).', '32 de 44 = 8/11.'),
        q.fr('I quina fracció són roses?', [1, 11], 'Les roses són la boca.', '4 de 44 = 1/11.'), q.count(GR, 'w', 'la granota'))),
    paint('Copia el bolet', 'Copia el bolet del model, píxel a píxel.', { goal: B, model: pic(B), colors: ['r', 'w', 'k'] }),
    read('Invasors', 'Una bossa gran de 100 boletes verdes. Quants invasors en surten?',
      same(pic(IN), q.count(IN, 'g', "l'invasor"), q.calc('Amb 100 boletes verdes, quants invasors sencers pots fer?', 2, '46 + 46 = 92. N\'hi ha per a un altre?', '2 invasors fan 92 boletes. Per a un tercer, en caldrien 138.'),
        q.calc('Quantes boletes et sobren?', 8, '100 − 92.', '100 − 92 = 8.'))),
    paint('Un encàrrec', 'Un dibuix simètric amb 15 boletes vermelles i 5 de blanques.', { w: 7, h: 6, rules: [['count', 'r', 15], ['count', 'w', 5], ['total', 20], ['sym', 'v']], colors: ['r', 'w'], axis: 'v' }),
    read('La llista de la compra', 'Per fer dos dibuixos, suma les boletes de cada un.',
      [[pic(GR), q.calc('La granota té 6 boletes blanques i el bolet, 22. Quantes blanques calen per fer tots dos?', 28, '6 + 22.', '6 + 22 = 28.')],
        [pic(G('poma')), q.calc('El cor té 27 boletes vermelles. Compta les de la poma i digues quantes calen per fer tots dos.', 57, 'La poma en té 30: compta fila per fila.', '27 + 30 = 57.')],
        [pic(G('estrella')), q.calc("L'estrella té 23 boletes grogues i la moneda, 24. Quantes grogues per fer-ne dues de cada?", 94, '(23 + 24) × 2.', '47 × 2 = 94.')]]),
    paint("Copia l'invasor", "L'últim: copia l'invasor del model.", { goal: IN, model: pic(IN), colors: ['g'] })
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- the cursus: circles, projects, marks ---------- */
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Primers píxels', projects: [0, 1] },
  { name: 'Colors i miralls', projects: [2, 3] },
  { name: 'Mosaics i botiga', projects: [4, 5] }
];
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, xpOf, levelText, isOpen, examOpen, levelIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: a pixel to find, a rectangle to count and a half
export const POOL = [
  { pic: ax(blank(5, 4)), q: q.tapAt(3, 2) },
  { pic: pic(box(3, 2, 'g')), q: q.area(3, 2, 'Quants píxels té aquest rectangle?') },
  { pic: pic(['rrbb']), q: q.pick('Quina part del quadre és vermella?', ['La meitat', 'Un quart', 'Tot'], 'Hi ha 4 píxels: quants són vermells?', '2 de 4: la meitat!') }
];

// What is saved is facts only: { so, stars[60], piscina, exams[3], fulls }. Marks, XP, level and badges are worked out, never stored.
// a complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true), fulls: Math.max(0, whole(o.fulls)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: "Caça bé les errades de deu fulls." },
  { name: 'Mestre del píxel', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, p.exams.every(e => e === true)];

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

// A sheet: three sentences somebody wrote about a drawing, each { kind, pic, says, real, opts }: says is the sentence written, real the
// true one (the sentence is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the ones a
// child makes: a pixel counted twice or missed, the numbers of an address turned round, the sides of a rectangle added instead of
// multiplied, and a colour compared with the other colour instead of with the whole
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const SHEET = ['bolet', 'cor', 'moneda', 'estrella', 'granota', 'fantasma', 'poma', 'creeper'];
const CLAIM = {
  count(bad, rnd) {
    const s = SPRITES[pickOf(SHEET, rnd)], ch = pickOf(colorsOf(s.g), rnd), n = count(s.g, ch);
    const wrong = shuffle([n + 1, n - 1, n + 2, n - 2].filter(x => x > 0), rnd);
    const say = x => `${cap(s.the)} té ${x} píxels ${many(ch)}.`;
    return { pic: pic(s.g), real: say(n), says: say(bad ? wrong[0] : n), opts: shuffle([n, wrong[0], wrong[1]].map(say), rnd) };
  },
  coord(bad, rnd) {
    for (let k = 0; ; k++) {
      const s = SPRITES[pickOf(SHEET, rnd)], g = s.g, f = 1 + at(H(g), rnd), cc = 1 + at(W(g), rnd), c = cellAt(g, f, cc), d = cellAt(g, cc, f);
      if (k < 200 && (c === '.' || f === cc || !d || d === c)) continue;
      const third = [...colorsOf(g), '.', ...Object.keys(COLORS)].find(e => e !== c && e !== d), say = e => `El píxel ${pt(f, cc)} és ${one(e)}.`;
      return { pic: ax(g), real: say(c), says: say(bad ? d : c), opts: shuffle([c, d, third].map(say), rnd) };
    }
  },
  area(bad, rnd) {
    const w = 3 + at(6, rnd), h = 2 + at(5, rnd), say = x => `El rectangle té ${x} píxels.`;
    const vals = [...new Set([w * h, w + h, w * (h - 1), w * h + w])];
    return { pic: pic(box(w, h, pickOf(['b', 'r', 'g', 'o', 'l'], rnd)), { lines: false }), real: say(w * h), says: say(bad ? vals[1] : w * h), opts: shuffle(vals.slice(0, 3).map(say), rnd) };
  },
  frac(bad, rnd) {
    const [w, h, n, d] = pickOf([[4, 4, 1, 4], [6, 4, 1, 3], [6, 4, 1, 6], [6, 4, 1, 4], [6, 4, 3, 8], [6, 2, 1, 3], [4, 3, 1, 4]], rnd), N = w * h, k = N * n / d;
    const [a, b] = shuffle(['r', 'b', 'y', 'g', 'l'], rnd), g = scatter(w, h, [[a, k], [b, N - k]], 1 + at(1000, rnd));
    const say = ([x, z]) => `${F(x, z)} del quadre és de color ${one(a)}.`, right = simp(k, N), pp = simp(k, N - k), other = simp(N - k, N);
    return { pic: pic(g), real: say(right), says: say(bad ? pp : right), opts: shuffle([right, pp, other].map(say), rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
