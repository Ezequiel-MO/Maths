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
  p: col('#FF8FD0', 'rosa', 'rosa'), l: col('#9B6BFF', 'lila', 'lila'), n: col('#9AA5AE', 'gris', 'grisos'),
  // the crab, the greys of a black and white photo and the four greens of an old portable console
  t: col('#D97757', 'terracota', 'terracota'), q: col('#D0D5DA', 'gris clar', 'gris clar'), x: col('#555D66', 'gris fosc', 'gris fosc'),
  D: col('#0F380F', 'verd molt fosc', 'verd molt fosc'), E: col('#306230', 'verd fosc', 'verd fosc'), H: col('#8BAC0F', 'verd clar', 'verd clar'),
  I: col('#C6E07A', 'verd pàl·lid', 'verd pàl·lid')
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
// sprite s over g with its top left pixel at (f0, c0): what falls out of g is cut, and the empty pixels of s let g show
export const stamp = (g, s, f0, c0) => g.map((r, i) => { const k = i - (f0 - 1);
  return k < 0 || k >= H(s) ? r : [...r].map((c, j) => { const ch = s[k][j - (c0 - 1)]; return ch && ch !== '.' ? ch : c; }).join(''); });
// the pixels of a that are not in b: what is left to paint over what comes painted
export const minus = (a, b) => a.map((r, i) => [...r].map((c, j) => b[i][j] === '.' ? c : '.').join(''));
// two drawings side by side, with two empty columns between them
export function duo(a, b) {
  const h = Math.max(H(a), H(b)), row = (g, i) => g[i] || '.'.repeat(W(g));
  return Array.from({ length: h }, (_, i) => row(a, i) + '..' + row(b, i));
}

/* ---------- moving a drawing: turns, mirrors, sizes ---------- */
// A quarter turn goes as the hands of a clock: the pixel (f, c) of a grid of h rows goes to (c, h + 1 − f)
export const rot90 = g => Array.from({ length: W(g) }, (_, i) => Array.from({ length: H(g) }, (_, j) => g[H(g) - 1 - j][i]).join(''));
export const rot180 = g => g.slice().reverse().map(flip);
export const flipV = g => g.map(flip);
export const flipH = g => g.slice().reverse();
export const turn = (g, k) => k % 4 === 0 ? g.slice() : turn(rot90(g), k - 1);
// Where each pixel of the new drawing comes from: from.x(...)(f, c) is the pixel of the old one that went to (f, c). The board uses it
// to make every pixel fly from its old place to the new one
export const from = {
  rot90: g => (f, c) => [H(g) + 1 - c, f],
  rot180: g => (f, c) => [H(g) + 1 - f, W(g) + 1 - c],
  rot270: g => (f, c) => [c, W(g) + 1 - f],
  flipV: g => (f, c) => [f, W(g) + 1 - c],
  flipH: g => (f, c) => [H(g) + 1 - f, c],
  turn: (g, k) => [(f, c) => [f, c], from.rot90(g), from.rot180(g), from.rot270(g)][k % 4],
  scale: k => (f, c) => [Math.ceil(f / k), Math.ceil(c / k)],
  shift: (df, dc) => (f, c) => [f - df, c - dc],
  // a pixel made of k × k: each new pixel comes from the middle of its block
  merge: k => (f, c) => [k * f - (k >> 1), k * c - (k >> 1)]
};
// every block of k × k made one pixel, of the colour that is most in it (an empty pixel counts as a colour)
export function pixelate(g, k) {
  return Array.from({ length: Math.ceil(H(g) / k) }, (_, I) => Array.from({ length: Math.ceil(W(g) / k) }, (_, J) => {
    const n = {}; let best = null;
    for (let i = I * k; i < Math.min(H(g), I * k + k); i++) for (let j = J * k; j < Math.min(W(g), J * k + k); j++) {
      const ch = g[i][j]; n[ch] = (n[ch] || 0) + 1; if (!best || n[ch] > n[best]) best = ch; }
    return best;
  }).join(''));
}

/* ---------- filters: they change the colours, never how many pixels there are ---------- */
export const recolor = (g, map) => g.map(r => [...r].map(c => map[c] ?? c).join(''));
// the negative: every colour to its opposite
export const NEG = { w: 'k', k: 'w', r: 'c', c: 'r', y: 'b', b: 'y', g: 'p', p: 'g', o: 'l', l: 'o' };
// black and white: the light colours to light grey, the dark ones to dark grey
export const GRAY = { w: 'w', y: 'q', c: 'q', p: 'q', o: 'n', g: 'n', r: 'n', l: 'n', t: 'n', b: 'x', m: 'x', k: 'k' };
// the four greens of an old portable console
export const GB = { w: 'I', y: 'I', c: 'H', p: 'H', o: 'H', l: 'H', q: 'H', g: 'E', r: 'E', b: 'E', n: 'E', t: 'E', x: 'E', m: 'D', k: 'D' };
// the edge: the painted pixels that touch an empty one or the side of the grid
export const outline = g => g.map((r, i) => [...r].map((c, j) => c !== '.' && [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]
  .some(([a, b]) => (g[a]?.[b] ?? '.') === '.') ? c : '.').join(''));
// a row kept in pieces: [[colour, how many], ...]
export const rle = r => [...r].reduce((out, c) => { const last = out[out.length - 1]; if (last && last[0] === c) last[1]++; else out.push([c, 1]); return out; }, []);
// what a screen is made of: every pixel, three lights (red, green, blue) side by side, three rows tall
export const LIGHTS = { w: 'rgb', y: 'rg', c: 'gb', p: 'rb', r: 'r', g: 'g', b: 'b' };
export const subpix = g => g.flatMap(r => { const row = [...r].map(c => ['r', 'g', 'b'].map(l => (LIGHTS[c] || '').includes(l) ? l : 'k').join('')).join(''); return [row, row, row]; });
export const lit = g => (painted(g) - count(g, 'k')) / 3;

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
  espasa: S('Espasa', "l'espasa", ['..n..', '..n..', '..n..', '..n..', '.yyy.', '..m..', '..m..']),
  // the crab of the workshop: two pictures of it, with the legs open and closed, make it walk
  cranc: S('Cranc', 'el cranc', ['.tttttt.', '.tkttkt.', 'tttttttt', '.tttttt.', '.t.tt.t.']),
  crancB: S('Cranc', 'el cranc', ['.tttttt.', '.tkttkt.', 'tttttttt', '.tttttt.', 't.t..t.t']),
  boletPetit: S('Bolet petit', 'el bolet petit', ['.rr.', 'rrrr', '.ww.'])
};
const G = id => SPRITES[id].g;
// a coin that turns: from the front, from the side and edge on
const COIN = [G('moneda'), ['..yy..', '.yooy.', '.yooy.', '.yooy.', '.yooy.', '..yy..'], ['..oo..', '..oo..', '..oo..', '..oo..', '..oo..', '..oo..']];

/* ---------- letters and numbers made of pixels ---------- */
const FONT = { H: ['k.k', 'k.k', 'kkk', 'k.k', 'k.k'], O: ['kkk', 'k.k', 'k.k', 'k.k', 'kkk'], L: ['k..', 'k..', 'k..', 'k..', 'kkk'], A: ['kkk', 'k.k', 'kkk', 'k.k', 'k.k'] };
// a word in letters of 3 × 5, one empty column between them, of colour ch
export const word = (s, ch) => Array.from({ length: 5 }, (_, i) => [...s].map(l => FONT[l][i]).join('.').replaceAll('k', ch));
// The numbers of a digital clock: seven bars (a on top, b and c on the right, d at the bottom, e and f on the left, g in the middle), two
// pixels each, in a box of 4 × 7
export const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const SEG_AT = { a: [[0, 1], [0, 2]], b: [[1, 3], [2, 3]], c: [[4, 3], [5, 3]], d: [[6, 1], [6, 2]], e: [[4, 0], [5, 0]], f: [[1, 0], [2, 0]], g: [[3, 1], [3, 2]] };
const digit = (n, ch) => [...SEGS[n]].flatMap(s => SEG_AT[s]).reduce((g, [i, j]) => put(g, i + 1, j + 1, ch), blank(4, 7));
// a time as «20:26»: the numbers one empty column apart, and the two dots
export const clock = (s, ch) => { const parts = [...s].map(d => d === ':' ? ['.', '.', ch, '.', ch, '.', '.'] : digit(d, ch));
  return Array.from({ length: 7 }, (_, i) => parts.map(p => p[i]).join('.')); };
// how many bars a time lights up
export const bars = s => [...s].reduce((n, d) => n + (SEGS[d]?.length || 0), 0);

/* ---------- moving pictures ---------- */
// An animated picture shows its frames one after the other, fps of them a second, over and over
export const anim = (frames, o = {}) => ({ g: frames[0], frames, fps: 4, ...o });
// the frames of sprites (taken in turn) walking step columns to the right at each frame, from (f0, c0), in a w × h screen
export const walk = (sprites, w, h, f0, c0, step, n) => Array.from({ length: n }, (_, k) => stamp(blank(w, h), sprites[k % sprites.length], f0, c0 + k * step));
// the column of a ball that goes from column 1 to column w and back, one column a frame, after k frames
export const bounce = (w, k) => { const m = k % (2 * (w - 1)); return m < w ? 1 + m : 2 * w - 1 - m; };

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
  // a drawing kept in pieces, as a picture is saved: a line for each row, with its pieces from the left
  if (how === 'rle') return g.map((r, i) => ({ ch: null, text: `Fila ${i + 1}: ${rle(r).map(([c, n]) => c === '.' ? `${n} ${n === 1 ? 'buit' : 'buits'}` : `${sw(c)}${n} ${n === 1 ? one(c) : many(c)}`).join(', ')}` }));
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
  const given = o.given || blank(W(g), H(g));
  return { kind: 'paint', title, say, w: W(g), h: H(g), given, ...o, ...(o.how ? { steps: stepsOf(o.how === 'rle' ? o.goal : minus(o.goal, given), o.how) } : {}) }; };
// After a right answer the picture can change before the eyes: show = { pic, src } makes every pixel fly from the pixel src(f, c) of the
// old picture to its place in the new one; show = { pic, filter: true } turns every pixel over to its new colour, column by column
const morph = (qq, pic, src) => ({ ...qq, show: src ? { pic, src } : { pic, filter: true } });
const same = (p, ...qs) => qs.map(qq => [p, qq]);
const ax = (g, o) => pic(g, { axes: true, ...o });

const B = G('bolet'), C = G('cor'), MO = G('moneda'), GR = G('granota'), FA = G('fantasma'), IN = G('invasor');
const ODD_B = put(B, 3, 7, 'r'), ODD_G = put(GR, 5, 2, 'p'), ODD_I = put(IN, 4, 9, '.');
const QUART = ['bbbb', 'bbbb', 'bbyy', 'bbyy'], FRANCE = box(2, 4, 'b').map((r, i) => r + 'ww' + 'rr'), SENYERA = Array.from({ length: 9 }, (_, i) => (i % 2 ? 'r' : 'y').repeat(6));
const MIX = scatter(6, 4, [['r', 8], ['b', 6], ['y', 10]], 3);
const BRICK = ['ooom', 'omoo'];

// the pictures of the circles of screens, of moving pictures and of filters
const CR = G('cranc'), CRB = G('crancB'), BP = G('boletPetit');
const crabAt = (w, h, f0, c0) => stamp(blank(w, h), CR, f0, c0);
// the crab moved df rows and dc columns: its left eye, the pixel (2, 3) of the sprite, says where; then the whole crab flies there
function eyeMove(w, h, f0, c0, df, dc) {
  const f = f0 + 1, c = c0 + 2, up = df < 0, left = dc < 0;
  return [ax(crabAt(w, h, f0, c0)), morph(Q('tap', `L'ull esquerre del cranc és al ${pt(f, c)}. Mou el cranc ${Math.abs(df)} ${up ? 'amunt' : 'avall'} i ${Math.abs(dc)} ${left ? "cap a l'esquerra" : 'cap a la dreta'}. On va a parar l'ull? Toca'l.`,
    [`${f + df},${c + dc}`], `La fila fa ${f} ${up ? '−' : '+'} ${Math.abs(df)} i la columna, ${c} ${left ? '−' : '+'} ${Math.abs(dc)}.`, `L'ull va a parar al ${pt(f + df, c + dc)}. Tot el cranc es mou igual!`),
    ax(crabAt(w, h, f0 + df, c0 + dc)), from.shift(df, dc))];
}
// a red pixel at (f, c) of a w × h grid, and the grid turned k quarters: where does it go?
function turnDot(w, h, f, c, k) {
  const g = dots(w, h, [[f, c, 'r']]), to = turn(g, k), [nf, nc] = keysOf(to, 'r')[0].split(',').map(Number), half = k === 2;
  const text = half ? `Fem mitja volta al quadre, com si el posessis cap per avall. On va a parar el píxel vermell ${pt(f, c)}? Toca'l.` : `Fem un quart de volta al quadre, com les agulles del rellotge. On va a parar el píxel vermell ${pt(f, c)}? Toca'l.`;
  const hint = half ? `Compta des de l'altra punta: el ${pt(f, c)} és a la fila ${f} comptant des de dalt, i anirà a la fila ${f} comptant des de baix. Amb la columna, igual: la ${c} des de l'esquerra anirà a la ${c} des de la dreta.`
    : `En un quart de volta, la columna es torna la fila: el ${pt(f, c)} anirà a la fila ${c}. I la fila 1, la de dalt, es torna la columna de la dreta.`;
  const say = half ? `Al ${pt(nf, nc)}: fila ${h} + 1 − ${f} = ${nf}, i columna ${w} + 1 − ${c} = ${nc}.` : `Al ${pt(nf, nc)}: la columna ${c} es torna la fila ${nf}, i la fila ${f} es torna la columna ${nc}.`;
  return [ax(g), morph(Q('tap', text, [`${nf},${nc}`], hint, say), ax(to), from.turn(g, k))];
}
// a shape that is the same neither in a mirror nor turned: what was done to it?
const FP = ['.gg', 'gg.', '.g.'], WHAT = ['Un mirall', 'Mitja volta', 'Un quart de volta'];
const which = (g2, k, why) => [pic(duo(FP, g2)), q.pick("La forma de l'esquerra s'ha convertit en la de la dreta. Què li han fet?", [WHAT[k], ...WHAT.filter((_, j) => j !== k)],
  'Gira-la amb el cap: un quart de volta la deixa ajaguda, mitja volta la posa cap per avall i un mirall canvia l\'esquerra per la dreta.', why)];
// Tetris: the piece falls on top, and the hole in the floor is the piece turned k quarters. Once answered, the piece turns and falls in
const TURNS = ['Cap gir', 'Un quart de volta', 'Mitja volta', 'Tres quarts de volta'];
function fit(piece, k) {
  const R = turn(piece, k), w = 6, h = 7, f0 = h + 1 - H(R);
  const floor = blank(w, h).map((r, i) => i + 1 < f0 ? r : [...r].map((_, j) => (R[i + 1 - f0][j - 1] ?? '.') !== '.' ? '.' : 'n').join(''));
  const src = (f, c) => { const a = f - f0 + 1, b = c - 1, ch = R[a - 1]?.[b - 1];
    if (!ch || ch === '.') return [f, c]; const [pf, pc] = from.turn(piece, k)(a, b); return [pf, pc + 2]; };
  return [pic(stamp(floor, piece, 1, 3)), morph(q.pick('Com has de girar la peça perquè encaixi al forat? Els girs van com les agulles del rellotge.', [TURNS[k], ...TURNS.filter((_, j) => j !== k)],
    'Mira la forma del forat de baix i gira la peça amb el cap, un quart de volta cada vegada.', `${TURNS[k]}, i cau just al forat!`), pic(stamp(floor, R, f0, 2)), src)];
}
// four pixels to look at with a magnifying glass, and two by two pixels of colour ch seen as their lights
const LENS = ['wy', 'rc'];
const mix = (ch, opts, why) => [pic(subpix(box(2, 2, ch))), morph(q.pick('Si mires aquestes llums de lluny, de quin color es veuen?', opts, 'Mira quines llums estan enceses: la vermella, la verda o la blava.', why), pic(box(2, 2, ch)), from.merge(3))];
// the screen of an old portable console, a tile in each square: the sky, the ground, a cloud and the crab in four greens
const POCKET = [[box(20, 3, 'H'), 16, 1], [box(20, 1, 'E'), 16, 1], [recolor(CR, GB), 11, 6], [['.HH.', 'HHHH'], 3, 14]].reduce((g, [s, f, c]) => stamp(g, s, f, c), box(20, 18, 'I'));
// photos to make smaller: a drawing of 4 × 4 made twice as big, with one pixel of each block of 2 × 2 changed, so a colour always wins
const noisy = (base, list) => list.reduce((g, [f, c, ch]) => put(g, f, c, ch), scale(base, 2));
const NOISY = noisy(['bbyy', 'brry', 'grrw', 'ggww'], [[1, 2, 'y'], [3, 3, 'b'], [4, 6, 'g'], [6, 1, 'r'], [7, 8, 'r'], [5, 5, 'w'], [2, 7, 'r'], [8, 4, 'g']]);
const NOISY2 = noisy(['.rr.', 'rwwr', 'rrrr', '.mm.'], [[1, 1, 'r'], [2, 4, 'w'], [3, 6, 'r'], [4, 8, 'r'], [6, 2, 'w'], [5, 5, 'w'], [7, 1, 'm'], [8, 6, '.'], [7, 4, 'r']]);
// a bar of n pixels with k full
const bar = (n, k) => ['g'.repeat(k) + 'x'.repeat(n - k)];
// a sign of lights w columns wide with text going through it from the right
const scroll = (text, w) => Array.from({ length: W(text) + w }, (_, k) => stamp(blank(w, H(text)), text, 1, w + 1 - k));
// a world of 40 columns, hills and sky, for the screen to run over
const HILL = [1, 1, 2, 3, 3, 2, 1, 1, 2, 2];
const WORLD = Array.from({ length: 6 }, (_, i) => Array.from({ length: 40 }, (_, j) => i === 5 ? 'm' : 5 - i <= HILL[j % 10] ? 'g' : 'c').join(''));
// the ball of frame k: one row down and two columns right at each frame
const ballAt = k => stamp(blank(8, 6), box(2, 2, 'r'), k, 2 * k - 1);
// a hundred pixels, 25 of them blue
const HUNDRED = Array.from({ length: 10 }, (_, i) => i < 2 ? 'b'.repeat(10) : i === 2 ? 'bbbbb.....' : '.'.repeat(10));

export const SECTIONS = [
  { name: 'Coordenades', sub: 'Cada píxel té la seva adreça: (fila, columna).', screen: 'gameboy', levels: [
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
      { given: place(G('corPetit'), 12, 6, 2, 1), goal: over(place(G('corPetit'), 12, 6, 2, 1), place(G('corPetit'), 12, 6, 2, 7)), colors: ['r'], axes: true, fly: from.shift(0, 6) }),
    paint('El fantasma', "L'últim: un fantasma de tres colors. Ves fila per fila.", { goal: FA, how: 'runs', colors: ['l', 'w', 'k'], axes: true })
  ] },
  { name: 'Àrea', sub: 'Files per columnes: comptar píxels multiplicant.', screen: 'monitor', levels: [
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
  { name: 'Fraccions de colors', sub: 'Quina part del dibuix és de cada color.', screen: 'mobil', levels: [
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
  { name: 'Simetria', sub: 'Miralls: el que hi ha a una banda, a l\'altra.', screen: 'arcade', levels: [
    read('Mirall o no?', 'Un dibuix és simètric si la línia groga és com un mirall: a cada banda hi ha el mateix.',
      [[pic(C, { axis: 'v' }), q.sym(C, true, 'Sí: les dues bandes del cor són iguals.')], [pic(FA, { axis: 'v' }), q.sym(FA, false, 'No: els ulls miren cap a l\'esquerra, i a l\'altra banda no és igual.')],
        [pic(IN, { axis: 'v' }), q.sym(IN, true, "Sí: l'invasor és igual a les dues bandes.")]]),
    read("L'intrús", 'Algú ha canviat un píxel i el dibuix ja no és simètric. Troba\'l!',
      [[pic(ODD_B, { axis: 'v' }), q.odd(ODD_B, 3, 7)], [pic(ODD_G, { axis: 'v' }), q.odd(ODD_G, 5, 2)], [pic(ODD_I, { axis: 'v' }), q.odd(ODD_I, 4, 9)]]),
    paint('Completa el bolet', "Tens la meitat esquerra. Pinta la dreta com si fos un mirall: el que és a prop de la línia, a prop; el que és lluny, lluny.", { given: half(B, 'v'), goal: B, colors: ['r', 'w', 'k'], axis: 'v', fly: from.flipV(B) }),
    paint('Completa la granota', 'La meitat de la granota. Completa-la!', { given: half(GR, 'v'), goal: GR, colors: ['g', 'w', 'k', 'p'], axis: 'v', fly: from.flipV(GR) }),
    read('Comptar amb el mirall', 'Amb un mirall, cada píxel té un bessó a l\'altra banda.',
      [[pic(half(B, 'v'), { axis: 'v' }), q.calc('Aquesta meitat té 22 píxels pintats. Quants en tindrà el bolet sencer?', 44, 'L\'altra meitat és igual.', '22 × 2 = 44.')],
        [ax(dots(8, 5, [[4, 2, 'r']]), { axis: 'v' }), q.pick('El píxel vermell (4, 2) es reflecteix al mirall. On va a parar?', [pt(4, 7), pt(4, 6), pt(5, 2)], 'Compta quantes columnes hi ha del píxel al mirall, i compta les mateixes a l\'altra banda. La fila no canvia.', 'Al (4, 7): és a 3 columnes del mirall, com el (4, 2).')],
        [ax(dots(8, 5, [[2, 3, 'b']]), { axis: 'v' }), q.tap('Toca on va a parar el reflex del píxel blau (2, 3).', ['2,6'], 'El (2, 3) és a 2 columnes del mirall.', 'Al (2, 6).')]]),
    paint('Mirall de través', 'Ara el mirall està ajagut: la meitat de baix és la de dalt al revés.', { given: half(G('joia'), 'h'), goal: G('joia'), colors: ['c', 'b', 'w'], axis: 'h', fly: from.flipH(G('joia')) }),
    paint('Dos miralls', 'Dos miralls! Tens un quart de la rosassa: completa els altres tres quarts.', { given: half(G('rosassa'), 'vh'), goal: G('rosassa'), colors: ['r', 'b', 'y', 'w'], axis: 'vh', fly: (f, c) => [f > 4 ? 9 - f : f, c > 4 ? 9 - c : c] }),
    read('Quins miralls?', 'Un dibuix pot tenir un mirall, dos, o cap.',
      [[pic(C, { axis: 'vh' }), mirrors(0, 'Només el vertical: el cor no és igual de cap per avall.')], [pic(G('joia'), { axis: 'vh' }), mirrors(1, "Només l'horitzontal: el blanc és a l'esquerra.")],
        [pic(FA, { axis: 'vh' }), mirrors(3, 'Cap: els ulls i les potes trenquen els dos miralls.')]]),
    read('Reflexos amb números', 'Un quadre de 10 columnes amb el mirall al mig. Fixa\'t: un píxel i el seu bessó sempre sumen 11!',
      [[ax(dots(10, 4, [[4, 3, 'r']]), { axis: 'v' }), q.calc('El píxel (4, 3) es reflecteix. A quina columna va a parar?', 8, 'Les dues columnes sumen 11: 3 + ? = 11.', '3 + 8 = 11: a la columna 8.')],
        [ax(dots(10, 4, [[2, 1, 'b']]), { axis: 'v' }), q.calc('I el (2, 1)?', 10, '1 + ? = 11.', 'A la columna 10, la de l\'altra punta.')],
        [ax(dots(10, 4, [[1, 5, 'g']]), { axis: 'v' }), q.calc('I el (1, 5)?', 6, '5 + ? = 11.', 'A la 6: just a l\'altra banda del mirall.')]]),
    paint('Inventa un sprite simètric', 'Inventa un dibuix simètric de 10 píxels en total: 4 grocs i els altres del color que vulguis.', { w: 6, h: 5, rules: [['sym', 'v'], ['total', 10], ['count', 'y', 4]], colors: ['y', 'r', 'b', 'g'], axis: 'v' })
  ] },
  { name: 'Mosaics', sub: 'Rajoles i sèries que es repeteixen.', screen: 'tele', levels: [
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
  { name: 'La botiga de boletes', sub: 'Quantes boletes de cada color calen per fer un sprite.', screen: 'boletes', levels: [
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
  ] },
  { name: 'Girs i moviments', sub: 'Moure, girar i fer gran un sprite.', screen: 'arcade', levels: [
    read('El cranc camina', 'Els sprites dels videojocs caminen fotograma a fotograma: a cada fotograma, el cranc avança 2 columnes.',
      same(anim(walk([CR, CRB], 20, 6, 2, 1, 2, 7), { fps: 3 }),
        q.calc('A cada fotograma el cranc avança 2 columnes. Quantes columnes avança en 4 fotogrames?', 8, '2 columnes, 4 vegades: 4 × 2.', '4 × 2 = 8 columnes.'),
        q.calc('Comença amb la pinça a la columna 1. A quina columna és la pinça després de 6 fotogrames?', 13, 'En 6 fotogrames avança 6 × 2 = 12 columnes. Suma-les a la columna 1.', '1 + 12 = 13.'),
        q.calc('Una pantalla fa 30 columnes. Quants fotogrames calen per avançar 30 columnes?', 15, 'Quantes vegades 2 fan 30? 30 : 2.', '30 : 2 = 15 fotogrames.'))),
    read('Mou el cranc', 'Moure un sprite és sumar o restar a les files i a les columnes. Tots els píxels es mouen igual!',
      [eyeMove(14, 10, 1, 1, 4, 5), eyeMove(14, 10, 5, 6, -3, 1), eyeMove(14, 10, 2, 7, 3, -6)]),
    paint('Copia el cranc més avall', 'Copia el cranc 5 files més avall: el píxel (f, c) va a parar a (f + 5, c). La columna no canvia!',
      { given: crabAt(8, 10, 1, 1), goal: over(crabAt(8, 10, 1, 1), crabAt(8, 10, 6, 1)), colors: ['t', 'k'], axes: true, fly: from.shift(5, 0) }),
    read('Mitja volta', 'Fer mitja volta és posar el dibuix de cap per avall: el de dalt va a baix, i el de l\'esquerra, a la dreta.',
      [turnDot(5, 4, 1, 2, 2), turnDot(5, 4, 2, 5, 2), turnDot(5, 4, 3, 3, 2)]),
    read('Quart de volta', 'Un quart de volta és girar com les agulles del rellotge: la fila de dalt es torna la columna de la dreta.',
      [turnDot(5, 5, 1, 2, 1), turnDot(5, 5, 4, 1, 1), turnDot(5, 5, 5, 3, 1)]),
    read('Gir o mirall?', 'Un mirall canvia l\'esquerra per la dreta. Un gir fa voltar tot el dibuix.',
      [which(flipV(FP), 0, "Un mirall: l'esquerra i la dreta s'han canviat, però el de dalt continua a dalt."), which(rot180(FP), 1, "Mitja volta: el de dalt ha anat a baix i el de l'esquerra, a la dreta."),
        which(rot90(FP), 2, 'Un quart de volta, com les agulles del rellotge: ara la forma està ajaguda.')]),
    read('Tetris', 'Al Tetris, les peces cauen i les has de girar perquè encaixin al forat.',
      [fit(['b.', 'b.', 'bb'], 1), fit(['lll', '.l.'], 2),
        [pic(['....bb....', 'nnn.nnnn..']), q.calc('Una fila plena desapareix. Quants píxels falten per omplir la fila de baix?', 3, 'La fila té 10 píxels. Compta els grisos i resta.', '10 − 7 = 3. Amb 3 més, la fila desapareix!')]]),
    paint("Gira l'espasa", "Gira l'espasa un quart de volta, com les agulles del rellotge. La punta, que mirava amunt, mirarà a la dreta.",
      { goal: rot90(G('espasa')), model: pic(G('espasa')), colors: ['n', 'y', 'm'], after: () => ({ from: pic(G('espasa')), pic: pic(rot90(G('espasa'))), src: from.rot90(G('espasa')) }) }),
    read('El doble de gran', 'Per fer un sprite el doble de gran, cada píxel es torna un quadrat de 2 × 2.',
      [[pic(G('corPetit')), q.count(G('corPetit'), 'r', 'el cor petit')],
        [pic(G('corPetit')), morph(q.calc('Si el fem el doble d\'ample i el doble d\'alt, quants píxels tindrà?', 44, 'Cada píxel es torna 2 × 2 = 4 píxels: 11 × 4.', '11 × 4 = 44. No és el doble: és 4 vegades més!'), pic(scale(G('corPetit'), 2)), from.scale(2))],
        [pic(G('corPetit')), morph(q.calc('I si el cor petit el fem el triple d\'ample i el triple d\'alt?', 99, 'Cada píxel es torna 3 × 3 = 9 píxels: 11 × 9.', '11 × 9 = 99.'), pic(scale(G('corPetit'), 3)), from.scale(3))]]),
    paint('Fes-lo el doble', 'Fes el bolet petit el doble de gran: cada píxel del model es torna un quadrat de 2 × 2.',
      { goal: scale(BP, 2), model: pic(BP), colors: ['r', 'w'], done: '11 píxels × 4 = 44 píxels!', after: () => ({ from: pic(BP), pic: pic(scale(BP, 2)), src: from.scale(2) }) })
  ] },
  { name: 'La pantalla per dins', sub: 'Com funcionen les pantalles de veritat.', screen: 'monitor', levels: [
    read('La lupa', 'Si mires una pantalla amb una lupa, veuràs que cada píxel són 3 llums petites: una vermella, una verda i una blava.',
      [[pic(LENS), morph(q.calc('Cada píxel són 3 llums. Quantes llums hi ha en aquests 4 píxels?', 12, '4 píxels, 3 llums a cada un: 4 × 3.', '4 × 3 = 12 llums. Mira-les!'), pic(subpix(LENS)), from.scale(3))],
        [pic(subpix(LENS)), q.calc('Quantes llums estan enceses? Una llum és una tira de color de dalt a baix.', lit(subpix(LENS)), 'Compta les tires de color: el blanc les té totes tres enceses.', `El blanc 3, el groc 2, el vermell 1 i el blau cel 2: ${lit(subpix(LENS))}.`)],
        [pic(subpix(LENS)), q.calc('Una pantalla petita fa 10 × 8 píxels. Quantes llums té?', 240, '10 × 8 = 80 píxels, i cada un té 3 llums.', '80 × 3 = 240 llums.')]]),
    read('Barreja de llum', 'Amb llum, els colors es barregen diferent que amb pintura: vermell i verd fan groc!',
      [mix('y', ['groc', 'blanc', 'verd'], 'Vermell i verd encesos fan groc.'), mix('c', ['blau cel', 'blau', 'verd'], 'Verd i blau encesos fan blau cel.'),
        mix('w', ['blanc', 'groc', 'gris'], 'Totes tres enceses fan blanc!')]),
    read('La consola de butxaca', 'Les consoles antigues de butxaca tenien una pantalla de 160 × 144 píxels, feta de rajoles de 8 × 8. Aquí cada quadret és una rajola.',
      same(pic(POCKET, { screen: 'gameboy' }),
        q.calc('La pantalla fa 160 píxels d\'ample. Quantes rajoles de 8 píxels hi caben en una fila?', 20, 'Quantes vegades 8 fan 160? Pensa: 8 × 2 = 16, i 16 × 10 = 160.', '160 : 8 = 20 rajoles.'),
        q.calc('I d\'alt fa 144 píxels. Quantes files de rajoles hi ha?', 18, '8 × 18 = ? Prova: 8 × 10 = 80 i 8 × 8 = 64.', '144 : 8 = 18 files.'),
        q.calc('Quantes rajoles té tota la pantalla?', 360, '20 rajoles a cada fila, i 18 files: 20 × 18 = 20 × 10 + 20 × 8.', '200 + 160 = 360 rajoles.'))),
    read('Pixela', 'Per fer una foto més petita, cada bloc de 2 × 2 píxels es torna un sol píxel, del color que hi ha més.',
      same(pic(NOISY, { tiles: [2, 2] }),
        q.pick('De quin color serà el bloc de dalt a l\'esquerra?', ['blau', 'groc', 'vermell'], 'Mira el bloc de 2 × 2 de dalt a l\'esquerra: quin color hi ha més?', 'Hi ha 3 blaus i 1 groc: guanya el blau.'),
        q.calc('El dibuix fa 8 × 8. Si cada bloc de 2 × 2 es torna un píxel, quants píxels tindrà el dibuix nou?', 16, 'Quants blocs hi ha a cada fila? 8 : 2. I quantes files de blocs?', '4 × 4 = 16 píxels.'),
        morph(q.calc('De 64 píxels a 16. Quantes vegades menys píxels té?', 4, '64 : 16.', '64 : 16 = 4. Mira com queda!'), pic(scale(pixelate(NOISY, 2), 2), { tiles: [2, 2] })))),
    paint('Pixela tu', 'Cada bloc de 2 × 2 del model es torna un sol píxel, del color que hi ha més. Si hi ha més buits, el píxel queda buit!',
      { goal: pixelate(NOISY2, 2), model: pic(NOISY2, { tiles: [2, 2] }), colors: ['r', 'w', 'm'] }),
    read('La barra de càrrega', 'Quan un joc carrega, una barra es va omplint. Quina part està plena?',
      [[pic(bar(20, 15)), q.fr('Quina fracció de la barra està plena?', [15, 20], 'A dalt, els píxels verds. A baix, tots els de la barra: 20.', '15 de 20 = 3/4.')],
        [pic(bar(20, 15)), q.calc('Quants píxels falten perquè s\'acabi de carregar?', 5, 'Tots els de la barra menys els verds.', '20 − 15 = 5.')],
        [pic(bar(12, 0)), morph(q.calc(`Aquesta barra fa 12 píxels. Quants n'hauries de pintar per omplir-ne ${F(2, 3)}?`, 8, '12 en 3 parts iguals: cada terç són 4. Dos terços: 2 × 4.', '12 : 3 = 4, i 2 × 4 = 8.'), pic(bar(12, 8)))]]),
    paint('La barra de vida', 'La barra de vida d\'un videojoc: pinta 3/4 de verd (la vida que et queda) i la resta de vermell.',
      { w: 8, h: 2, rules: [['frac', 'g', 3, 4], ['frac', 'r', 1, 4], ['full']], colors: ['g', 'r'] }),
    read('El rètol de llums', 'Els rètols de les botigues i de les estacions són pantalles de llums rodones. Les lletres fan 3 × 5 llums.',
      [[pic(word('HOLA', 'r'), { screen: 'led' }), q.calc('Cada lletra fa 3 columnes, i entre lletra i lletra hi ha 1 columna buida. Quantes columnes ocupa «HOLA»?', 15, '4 lletres de 3 columnes, i 3 forats entre elles.', '4 × 3 + 3 = 15 columnes.')],
        [pic(word('HOLA', 'r'), { screen: 'led' }), q.calc('Quantes llums s\'encenen per escriure «HOLA»?', count(word('HOLA', 'r'), 'r'), 'Compta lletra per lletra: la H en té 11.', `11 + 12 + 7 + 12 = ${count(word('HOLA', 'r'), 'r')} llums.`)],
        [anim(scroll(word('HOLA', 'r'), 15), { fps: 5, screen: 'led' }), q.calc('El text avança 1 columna a cada fotograma, i el rètol en fa 5 per segon. Quants segons triga a avançar les 15 columnes de «HOLA»?', 3, '15 columnes, 5 a cada segon: 15 : 5.', '15 : 5 = 3 segons.')]]),
    read('El rellotge digital', 'Els números d\'un rellotge digital es fan amb 7 barretes. El 8 les encén totes.',
      [[pic(clock('20:26', 'c'), { screen: 'rellotge', lines: false }), q.calc('Quantes barretes s\'encenen per escriure 20:26?', bars('2026'), 'Compta les de cada número: el 2 en té 5, el 0 en té 6...', `5 + 6 + 5 + 6 = ${bars('2026')}.`)],
        [pic(clock('11:11', 'c'), { screen: 'rellotge', lines: false }), q.calc('I per escriure 11:11?', bars('1111'), 'Cada 1 té 2 barretes.', `4 × 2 = ${bars('1111')}.`)],
        [pic(clock('08:08', 'c'), { screen: 'rellotge', lines: false }), q.pick('Quina hora encén més barretes?', ['08:08', '10:10', '11:11'], 'El 8 en té 7, el 0 en té 6 i l\'1 en té 2.', `08:08 en fa ${bars('0808')}: 6 + 7 + 6 + 7.`)]]),
    read('Mides i percentatges', 'Ara, coses de pantalles de veritat: fer icones més grans, el % de les bateries i la forma de les teles.',
      [[pic(G('creeper')), morph(q.calc('Una icona de 8 × 8 la fem de 16 × 16. Quantes vegades més píxels té?', 4, '8 × 8 = 64 i 16 × 16 = 256. O pensa: el doble d\'ample i el doble d\'alt.', '256 : 64 = 4 vegades.'), pic(scale(G('creeper'), 2)), from.scale(2))],
        [pic(bar(10, 7)), q.calc('Aquesta barra té 10 píxels, i cada píxel és el 10 %. Quin percentatge està ple? (Escriu només el número.)', 70, 'Compta els verds: cada un val 10.', '7 × 10 = 70 %. El 100 % és la barra sencera.')],
        [pic(blank(16, 9)), q.calc('Les teles són 16:9: per cada 16 columnes, 9 files, com aquesta. Si una pantalla fa 32 columnes, quantes files té?', 18, '32 són 2 vegades 16. Les files també es fan el doble.', '9 × 2 = 18 files. Una tele de veritat fa 1920 × 1080!')]])
  ] },
  { name: 'Fotogrames', sub: 'Dibuixos que es mouen, fotograma a fotograma.', screen: 'tele', levels: [
    read('El llibre animat', 'Una animació són dibuixos que es mostren molt de pressa, un darrere l\'altre. Aquest cranc en té 2: el 1 amb les potes juntes i el 2 amb les potes obertes.',
      same(anim([stamp(blank(10, 7), CR, 2, 2), stamp(blank(10, 7), CRB, 2, 2)]),
        q.calc('L\'animació en mostra 4 cada segon. Quants fotogrames es mostren en 5 segons?', 20, '4 a cada segon, durant 5 segons: 5 × 4.', '5 × 4 = 20 fotogrames.'),
        q.calc('Els fotogrames van 1, 2, 1, 2... Dels 20, quants són el fotograma 1, el de les potes juntes?', 10, 'Cada dos fotogrames, un és el 1: 20 : 2.', '20 : 2 = 10.'),
        q.calc('Quants segons calen per mostrar 60 fotogrames?', 15, '4 cada segon: quantes vegades 4 fan 60?', '60 : 4 = 15 segons.'))),
    read('Cine i videojocs', 'El cine mostra 24 fotogrames cada segon. Un videojoc, 60. Com més fotogrames, més suau es veu el moviment!',
      same(anim(walk([CR, CRB], 20, 6, 2, 1, 2, 7), { fps: 6 }),
        q.calc('El cine fa 24 fotogrames per segon. Quants en fa en 3 segons?', 72, '24 × 3 = 20 × 3 + 4 × 3.', '60 + 12 = 72.'),
        q.calc('Un videojoc fa 60 fotogrames per segon. Quants en fa en 2 segons?', 120, '60 × 2.', '60 × 2 = 120.'),
        q.calc('En un segon, quants fotogrames més fa el videojoc que el cine?', 36, '60 − 24.', '60 − 24 = 36.'))),
    read('El bucle', 'Aquesta moneda gira amb 3 fotogrames que es repeteixen: 1 de cara, 2 de costat, 3 de cantell, i torna a començar.',
      same(anim(COIN, { fps: 3 }),
        q.pick('Quin fotograma es veu el número 10?', ['El 1', 'El 2', 'El 3'], 'Cada 3 fotogrames torna a començar. 9 = 3 × 3: el 9 acaba una volta.', 'El 9 és un 3, i el 10 torna a ser el 1.'),
        q.pick('I el número 20?', ['El 2', 'El 1', 'El 3'], '18 = 3 × 6: el 18 acaba una volta. Després, el 19 i el 20.', 'El 19 és el 1 i el 20, el 2.'),
        q.calc('En els primers 30 fotogrames, quantes vegades surt el 3?', 10, 'Un 3 a cada volta de 3 fotogrames.', '30 : 3 = 10.'))),
    paint('El segon fotograma', 'El cranc del model té les potes juntes: és el fotograma 1. Pinta les potes obertes del fotograma 2, a les caselles de la llista, i el veuràs caminar!',
      { given: CRB.map((r, i) => i === 4 ? '........' : r), goal: CRB, how: 'coords', model: pic(CR), colors: ['t'], axes: true,
        after: () => ({ pic: anim(walk([CR, CRB], 20, 6, 2, 1, 2, 7), { fps: 4 }) }) }),
    read('Quant es mou?', 'Ara el cranc avança 3 columnes a cada fotograma.',
      same(anim(walk([CR, CRB], 20, 6, 2, 1, 3, 5), { fps: 3 }),
        q.calc('Quantes columnes avança en 4 fotogrames?', 12, '4 × 3.', '4 × 3 = 12.'),
        q.calc('L\'animació va a 6 fotogrames per segon. Quantes columnes avança en un segon?', 18, '6 fotogrames de 3 columnes: 6 × 3.', '6 × 3 = 18 columnes.'),
        q.calc('Quants segons triga a avançar 54 columnes?', 3, '18 columnes a cada segon: quantes vegades 18 fan 54?', '18 × 3 = 54: 3 segons.'))),
    read('El rebot', 'La pilota va de la columna 1 a la 8 i torna, 1 columna a cada fotograma, com al Pong.',
      same(anim(Array.from({ length: 14 }, (_, k) => dots(8, 3, [[2, bounce(8, k), 'y']])), { fps: 5, axes: true }),
        q.calc('Quants fotogrames triga a anar de la columna 1 a la 8 i tornar a la 1?', 14, 'Per anar de l\'1 al 8 fa 7 passos. I per tornar, 7 més.', '7 + 7 = 14.'),
        q.calc('Comença a la columna 1. A quina columna és després de 10 fotogrames?', bounce(8, 10), 'Després de 7 fotogrames és a la 8, i llavors torna enrere.', `Després de 7 és a la 8; 3 més enrere: 8 − 3 = ${bounce(8, 10)}.`),
        q.calc('I després de 28 fotogrames?', 1, 'Cada 14 fotogrames torna a la columna 1. 28 = 14 × 2.', '28 són 2 voltes senceres: torna a l\'1.'))),
    read('El fons que corre', 'Als videojocs de plataformes, el fons corre cap a l\'esquerra i sembla que el personatge camina. La pantalla en mostra un tros de 8 columnes.',
      same(anim(Array.from({ length: 17 }, (_, k) => WORLD.map(r => r.slice(2 * k, 2 * k + 8))), { fps: 4 }),
        q.calc('El món fa 40 columnes i la pantalla en mostra 8. Quantes pantalles seguides fa el món?', 5, 'Quantes vegades 8 fan 40?', '40 : 8 = 5 pantalles.'),
        q.calc('El fons corre 2 columnes a cada fotograma. Quants fotogrames calen per passar una pantalla de 8 columnes?', 4, '8 : 2.', '8 : 2 = 4 fotogrames.'),
        q.calc('I per passar tot el món de 40 columnes?', 20, '40 : 2. O bé: 5 pantalles de 4 fotogrames.', '40 : 2 = 20 fotogrames.'))),
    paint('El fotograma següent', 'Al model, la pilota baixa 1 fila i va 2 columnes a la dreta a cada fotograma. Pinta-la on serà al fotograma 3!',
      { goal: ballAt(3), model: anim([ballAt(1), ballAt(2)], { fps: 2, axes: true }), colors: ['r'], axes: true,
        after: () => ({ pic: anim([ballAt(1), ballAt(2), ballAt(3), ballAt(4)], { fps: 3, axes: true }) }) }),
    read('La cursa', 'Dos quadrats fan una cursa: el vermell avança 2 columnes a cada fotograma i el blau, 3. El camí fa 24 columnes.',
      same(anim(Array.from({ length: 8 }, (_, k) => stamp(stamp(blank(24, 6), box(2, 2, 'r'), 1, 1 + 2 * k), box(2, 2, 'b'), 4, 1 + 3 * k)), { fps: 3 }),
        q.calc('Després de 6 fotogrames, quantes columnes més ha fet el blau que el vermell?', 6, 'El vermell, 6 × 2. El blau, 6 × 3.', '18 − 12 = 6 columnes.'),
        q.fr('Quina fracció del camí de 24 columnes ha fet el vermell després de 6 fotogrames?', [12, 24], 'Ha fet 6 × 2 = 12 columnes, de 24.', '12 de 24 = 1/2: la meitat!'),
        q.fr('I el blau?', [18, 24], 'Ha fet 6 × 3 = 18 columnes, de 24.', '18 de 24 = 3/4.'))),
    paint('Anima el teu sprite', 'Inventa un sprite de 10 píxels exactes, amb 2 colors o més. Quan el comprovis, el veuràs saltar per la pantalla!',
      { w: 6, h: 5, rules: [['total', 10], ['colors', 2]], colors: ['t', 'r', 'y', 'g', 'b', 'w', 'k'],
        after: g => ({ pic: anim(Array.from({ length: 8 }, (_, k) => stamp(blank(20, 7), g, 1 + (k % 2 ? 0 : 2), 1 + 2 * k)), { fps: 4 }) }) })
  ] },
  { name: 'Filtres', sub: 'Canviar els colors sense canviar els píxels.', screen: 'mobil', levels: [
    read('El negatiu', 'El filtre negatiu canvia cada color pel seu contrari: el blanc es torna negre, i el vermell, blau cel.',
      [[pic(B), q.pick('I el negre, de quin color es tornarà?', ['blanc', 'negre', 'gris'], 'El negre és el contrari del blanc.', 'Blanc: el negre i el blanc es canvien.')],
        [pic(B), morph(q.calc('El bolet té 22 píxels blancs. Després del filtre, quants de negres tindrà?', 22, 'Cada blanc es torna negre.', '22 blancs → 22 negres. Mira!'), pic(recolor(B, NEG)))],
        [pic(recolor(B, NEG)), q.calc('Quants píxels pintats té el bolet ara? Abans en tenia 44.', 44, 'El filtre canvia els colors, no els píxels.', '44, els mateixos: el filtre no n\'afegeix ni en treu cap.')]]),
    read('Blanc i negre', 'El filtre de blanc i negre torna grisos tots els colors: els clars, gris clar; els foscos, gris fosc.',
      [[pic(MO), morph(q.frac(MO, 'o'), pic(recolor(MO, GRAY)))],
        [pic(recolor(MO, GRAY)), q.fr('Ara, quina fracció del quadre és gris (la part que abans era taronja)?', [2, 9], 'Els píxels són els mateixos: abans eren taronja i ara són grisos.', '8 de 36 = 2/9, igual que abans!')],
        [pic(recolor(MO, GRAY)), q.pick('Quants píxels pintats té ara la moneda?', ['Els mateixos', 'Més', 'Menys'], 'Un filtre canvia els colors...', 'Els mateixos: 32. Només han canviat els colors.')]]),
    read('Quatre verds', 'Les consoles de butxaca antigues només tenien 4 colors, tots verds. El filtre torna cada color un d\'aquests 4 verds.',
      [[pic(FA, { screen: 'gameboy' }), morph(q.calc('El fantasma té 3 colors: lila, blanc i negre. Cada color es torna un verd diferent. Quants verds tindrà?', 3, 'Un verd per a cada color.', '3 colors → 3 verds. Mira\'l!'), pic(recolor(FA, GB), { screen: 'gameboy' }))],
        [pic(recolor(FA, GB), { screen: 'gameboy' }), q.calc('Per guardar un dels 4 verds, cada píxel feia servir 2 interruptors. Quants interruptors calen per a un sprite de 8 × 8?', 128, '8 × 8 = 64 píxels, 2 interruptors a cada un.', '64 × 2 = 128 interruptors.')],
        [pic(recolor(FA, GB), { screen: 'gameboy' }), q.calc('I per a un sprite de 16 × 16?', 512, '16 × 16 = 256 píxels. I 2 interruptors a cada un.', '256 × 2 = 512.')]]),
    read('Canvi de paleta', 'Als videojocs, el mateix sprite surt amb colors diferents canviant la paleta: un color per un altre.',
      [[pic(C), q.count(C, 'r', 'el cor')],
        [pic(C), morph(q.calc('Canviem el vermell per verd. Quants píxels verds tindrà el cor?', 27, 'Cada vermell es torna verd.', '27 vermells → 27 verds.'), pic(recolor(C, { r: 'g' })))],
        [pic(recolor(C, { r: 'g' })), q.fr('El quadre fa 7 × 6 = 42 píxels. Quina fracció del quadre és verda?', [27, 42], 'A dalt els verds, 27. A baix, tots els del quadre.', '27 de 42 = 9/14: la mateixa que tenia el vermell!')]]),
    paint('Fes el canvi de paleta', 'Copia el bolet, però amb el vermell canviat per blau. Els blancs i els negres no canvien.',
      { goal: recolor(B, { r: 'b' }), model: pic(B), colors: ['b', 'w', 'k'] }),
    read('El perímetre', 'El contorn d\'una forma es mesura en costats de píxel: camina per la vora i compta els costats.',
      [[pic(box(4, 3)), q.calc('Quant fa el contorn d\'aquest rectangle de 4 × 3?', 14, 'Dalt 4 i baix 4. Als costats, 3 i 3.', '4 + 4 + 3 + 3 = 14 costats.')],
        [pic(box(6, 2, 'g')), q.calc('I el d\'aquest de 6 × 2?', 16, 'Dalt 6 i baix 6. Als costats, 2 i 2.', '6 + 6 + 2 + 2 = 16.')],
        [pic(box(5, 5, 'r')), q.calc('I el d\'un quadrat de 5 × 5?', 20, 'Té 4 costats iguals de 5.', '4 × 5 = 20.')]]),
    read('El filtre contorn', 'El filtre contorn esborra els píxels de dins i deixa només els de la vora.',
      [[pic(box(6, 4, 'b')), morph(q.calc('Quants píxels quedaran després del filtre?', 16, 'Dalt 6 i baix 6. Als costats en queden 2 i 2: no comptis els racons dues vegades!', '6 + 6 + 2 + 2 = 16.'), pic(outline(box(6, 4, 'b'))))],
        [pic(outline(box(6, 4, 'b'))), q.calc('Quants píxels ha esborrat el filtre?', 8, 'Abans n\'hi havia 6 × 4 = 24.', '24 − 16 = 8. Els del mig: 4 × 2!')],
        [pic(outline(box(6, 4, 'b'))), q.fr('Quina fracció del quadre queda pintada?', [16, 24], '16 pintats de 24.', '16 de 24 = 2/3.')]]),
    read('Comprimir', 'Les fotos es guarden per trossos: en lloc de dir el color de cada píxel, es diu «2 buits, 4 vermells, 2 buits».',
      same(ax(B), q.calc('La fila 1 del bolet es guarda així: «2 buits, 4 vermells, 2 buits». Quants píxels té la fila?', 8, 'Suma els trossos.', '2 + 4 + 2 = 8.'),
        q.calc('La fila 4 és tota vermella. Quants trossos té?', rle(B[3]).length, 'Si tots els píxels són iguals, n\'hi ha prou amb dir-ho un cop: «8 vermells».', 'Un sol tros: «8 vermells».'),
        q.calc('Quants trossos té la fila 2?', rle(B[1]).length, 'Cada vegada que canvia el color, comença un tros nou.', `${rle(B[1]).map(([c, n]) => `${n} ${c === '.' ? (n === 1 ? 'buit' : 'buits') : n === 1 ? one(c) : many(c)}`).join(', ')}: ${rle(B[1]).length} trossos.`))),
    paint('Descomprimeix', 'La poma està guardada per trossos. Pinta fila a fila, d\'esquerra a dreta, i sortirà!',
      { goal: G('poma'), how: 'rle', colors: ['m', 'g', 'r'], axes: true }),
    read('Filtres i percentatges', 'Aquest quadre té 10 × 10 = 100 píxels: cada píxel és l\'1 %. El 100 % és el quadre sencer.',
      [[pic(HUNDRED), q.calc('Quin percentatge del quadre és blau? (Escriu només el número.)', 25, 'Compta els blaus: 2 files de 10 i 5 més.', '25 de 100 = 25 %.')],
        [pic(HUNDRED), q.pick('El 25 % és la mateixa part que...', [F(1, 4), F(1, 2), F(1, 25)], '25 de 100: quantes vegades 25 fan 100?', '25 de 100 = 1/4. El 50 % és la meitat i el 25 %, un quart.')],
        [pic(box(10, 10, 'y')), morph(q.calc('Un filtre torna gris el 50 % dels píxels del quadre. Quants píxels són?', 50, 'El 50 % és la meitat.', '100 : 2 = 50 píxels. Mira!'), pic(box(10, 10, 'y').map((r, i) => i < 5 ? r : 'n'.repeat(10))))]])
  ] }
];
// every level shows on the screen of its project, unless it says another
for (const s of SECTIONS) if (s.screen) s.levels.forEach(l => { l.screen ??= s.screen; });
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- the cursus: circles, projects, marks ---------- */
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Primers píxels', projects: [0, 1] },
  { name: 'Colors i miralls', projects: [2, 3] },
  { name: 'Mosaics i botiga', projects: [4, 5] },
  { name: 'Pantalles i moviments', projects: [6, 7] },
  { name: 'Animació i filtres', projects: [8, 9] }
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

// What is saved is facts only: { so, stars[100], piscina, exams[5], fulls }. A save from before the circles of screens had 60 stars and
// 3 exams: the places of the new projects and exams start empty. Marks, XP, level and badges are worked out, never stored.
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
  { name: 'Mestre del píxel', what: 'Supera els exàmens dels tres primers cercles.' },
  { name: 'Píxels en moviment', what: "Supera l'examen del cercle 3." },
  { name: 'Mestre de les pantalles', what: "Supera l'examen del cercle 4." }
];
// «Mestre del píxel» was the badge of the three first exams, and stays so when more circles come
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, p.exams.slice(0, 3).every(e => e === true),
  p.exams[3] === true, p.exams[4] === true];

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
// multiplied, a colour compared with the other colour instead of with the whole, a drawing made twice as big taken for twice as many
// pixels (it has four times as many) and the corners of a frame counted twice
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
  },
  scale(bad, rnd) {
    const s = SPRITES[pickOf(['cor', 'moneda', 'poma', 'estrella', 'corPetit', 'espasa'], rnd)], n = painted(s.g);
    const say = x => `Si fem ${s.the} el doble de gran (cada píxel, 2 × 2), tindrà ${x} píxels pintats.`;
    return { pic: pic(s.g), real: say(4 * n), says: say(bad ? 2 * n : 4 * n), opts: shuffle([4 * n, 2 * n, n + 4].map(say), rnd) };
  },
  frame(bad, rnd) {
    const w = 4 + at(6, rnd), h = 3 + at(5, rnd), real = 2 * w + 2 * h - 4, say = x => `El marc té ${x} píxels.`;
    return { pic: pic(frameOf(w, h, pickOf(['m', 'n', 'y', 'b'], rnd))), real: say(real), says: say(bad ? real + 4 : real), opts: shuffle([...new Set([real, real + 4, w * h, real + 2])].slice(0, 3).map(say), rnd) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
