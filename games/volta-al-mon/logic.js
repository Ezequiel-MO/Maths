// The rules and the data of the trip round the world, with no page in it. Ten projects of ten levels about geometry: the shapes of
// flags, polygons on a board of pegs, perimeter, area, mirrors, angles, maps, scale, solids and buildings of cubes. The five circles
// are the five continents of the Olympic rings. It must keep importing from Node.

/* ---------- polygons on the board of pegs ---------- */
export const PEGS = 5;
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const on = (p, q, r) => cross(p, q, r) === 0 && Math.min(p[0], q[0]) <= r[0] && r[0] <= Math.max(p[0], q[0]) && Math.min(p[1], q[1]) <= r[1] && r[1] <= Math.max(p[1], q[1]);
// two segments that cross or touch
function hits(a, b, c, d) {
  const s = Math.sign;
  return (s(cross(a, b, c)) !== s(cross(a, b, d)) && s(cross(c, d, a)) !== s(cross(c, d, b))) || on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b);
}
// What a closed path of pegs [x, y] is: null when it is no polygon (fewer than three corners, or sides that cross), or
// { n, area, right, par, eq, iso, tilted, name }: its corners (the pegs in the middle of a side do not count), its area in squares,
// how many right angles, how many pairs of parallel sides (of a four-sided one), whether all sides are equal, whether it is a
// triangle with two equal sides, whether no side is flat or upright, and the name of the shape
export function poly(pts) {
  const P = pts.filter((p, i) => cross(pts[(i - 1 + pts.length) % pts.length], p, pts[(i + 1) % pts.length]) !== 0), n = P.length;
  if (n < 3 || new Set(P.map(String)).size < n) return null;
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if ((i || j !== n - 1) && hits(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return null;
  const e = P.map((p, i) => [P[(i + 1) % n][0] - p[0], P[(i + 1) % n][1] - p[1]]), len = e.map(v => v[0] ** 2 + v[1] ** 2);
  const area = Math.abs(P.reduce((s, p, i) => s + p[0] * P[(i + 1) % n][1] - p[1] * P[(i + 1) % n][0], 0)) / 2;
  const right = e.filter((v, i) => { const u = e[(i + n - 1) % n]; return u[0] * v[0] + u[1] * v[1] === 0; }).length;
  const par = n === 4 ? [0, 1].filter(i => e[i][0] * e[i + 2][1] - e[i][1] * e[i + 2][0] === 0).length : 0, eq = len.every(l => l === len[0]);
  const name = n === 3 ? 'tri' : n === 4 ? (right === 4 ? (eq ? 'sq' : 'rect') : par === 2 ? (eq ? 'rhombus' : 'par') : par === 1 ? 'trap' : 'quad') : n === 5 ? 'pent' : n === 6 ? 'hex' : 'poly';
  return { n, area, right, par, eq, iso: n === 3 && new Set(len).size < 3, tilted: e.every(v => v[0] !== 0 && v[1] !== 0), name };
}
export const NAMES = { tri: 'un triangle', sq: 'un quadrat', rect: 'un rectangle', rhombus: 'un rombe', par: 'un paral·lelogram', trap: 'un trapezi', quad: 'un quadrilàter', pent: 'un pentàgon', hex: 'un hexàgon', poly: 'un polígon' };
const num = v => String(v).replace('.', ',');
// '' when the polygon P is what the level wants, or what is wrong with it, in words
export function geoOk(W, P) {
  if (!P) return 'Això no és cap polígon: calen 3 vèrtexs o més, i els costats no es poden creuar.';
  if (W.n && P.n !== W.n) return `Té ${P.n} costats, i n'ha de tenir ${W.n}.`;
  if (W.name && !W.name.includes(P.name)) return `Això és ${NAMES[P.name]}, i ha de ser ${NAMES[W.name[0]]}.`;
  if (W.right && P.right < W.right) return 'Li falta un angle recte: un cantó com el d\'un full de paper.';
  if (W.noright && P.right) return 'Ara no hi pot haver cap angle recte.';
  if (W.iso && !P.iso) return 'Ha de tenir dos costats igual de llargs.';
  if (W.tilted && !P.tilted) return 'Encara té algun costat pla o dret. Tots quatre han d\'anar de biaix.';
  if (W.area && P.area !== W.area) return `La teva figura fa ${num(P.area)} quadrets d'àrea, i n'ha de fer ${W.area}.`;
  return '';
}

/* ---------- figures painted on a grid of squares ---------- */
// cells are numbered along the rows: y * w + x. What the painted ones make: { area, perim, conn, rect, sq }
export function figure(cells, w) {
  const S = new Set(cells), xs = cells.map(c => c % w), ys = cells.map(c => Math.floor(c / w));
  let perim = 0;
  for (const c of cells) perim += 4 - [c % w > 0 && S.has(c - 1), c % w < w - 1 && S.has(c + 1), S.has(c - w), S.has(c + w)].filter(Boolean).length;
  const seen = new Set(cells.slice(0, 1)), todo = cells.slice(0, 1);
  while (todo.length) { const c = todo.pop(); for (const d of [c % w > 0 ? c - 1 : -1, c % w < w - 1 ? c + 1 : -1, c - w, c + w]) if (S.has(d) && !seen.has(d)) { seen.add(d); todo.push(d); } }
  const bw = Math.max(...xs) - Math.min(...xs) + 1, bh = Math.max(...ys) - Math.min(...ys) + 1, rect = bw * bh === S.size;
  return { area: S.size, perim, conn: seen.size === S.size, rect, sq: rect && bw === bh };
}
// the cells of a figure seen in a mirror down the middle of the grid ('v'), across it ('h'), or both ('vh': the three other quarters)
export function mirror(cells, w, h, axis) {
  const v = c => Math.floor(c / w) * w + w - 1 - c % w, u = c => (h - 1 - Math.floor(c / w)) * w + c % w;
  return [...new Set(axis === 'v' ? cells.map(v) : axis === 'h' ? cells.map(u) : cells.flatMap(c => [v(c), u(c), u(v(c))]))].sort((a, b) => a - b);
}
// a figure as the places of its squares from its own top left corner, k times as big: where it sits on the grid does not matter
export function shapeOf(cells, w, k = 1) {
  const x0 = Math.min(...cells.map(c => c % w)), y0 = Math.min(...cells.map(c => Math.floor(c / w))), out = [];
  for (const c of cells) for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) out.push(`${(c % w - x0) * k + i},${(Math.floor(c / w) - y0) * k + j}`);
  return out.sort().join(' ');
}
// '' when the painted cells are what the level wants, or what is wrong with them
export function paintOk(L, cells) {
  const W = L.want;
  if (!cells.length) return 'Encara no has pintat cap quadret.';
  if (W.mirror) {
    const T = new Set(mirror(L.given, L.w, L.h, W.mirror)), extra = cells.filter(c => !T.has(c)).length, miss = [...T].filter(c => !cells.includes(c)).length;
    return extra ? `Hi ha ${extra === 1 ? 'un quadret que no és' : `${extra} quadrets que no són`} al lloc del reflex. Cada quadret ha de quedar tan lluny del mirall com el seu bessó.` : miss ? `Encara ${miss === 1 ? 'falta un quadret' : `falten ${miss} quadrets`} al reflex.` : '';
  }
  const F = figure(cells, L.w);
  if (W.scale) return shapeOf(cells, L.w) === shapeOf(L.given, L.w, W.scale) ? '' : `Encara no és la mateixa figura ${W.scale} cops més gran. Cada quadret del model es torna un quadrat de ${W.scale} × ${W.scale}: en total n'han de sortir ${L.given.length * W.scale ** 2}, i n'has pintat ${F.area}.`;
  if (!F.conn) return 'La figura ha de ser d\'una sola peça: els quadrets s\'han de tocar pels costats.';
  if (W.sq && !F.sq) return 'Ha de ser un quadrat: tan alt com ample, i sense forats.';
  if (W.rect && !F.rect) return 'Ha de ser un rectangle, sense forats ni sortints.';
  if (W.area && F.area !== W.area) return `Has pintat ${F.area} quadrets, i l'àrea ha de ser ${W.area}.`;
  if (W.perim && F.perim !== W.perim) return `El perímetre de la teva figura és ${F.perim}, i ha de ser ${W.perim}. Ressegueix la vora i compta els costats de fora.`;
  return '';
}

/* ---------- the map: columns with a letter, rows with a number that grows upwards ---------- */
export const COLS = 'ABCDEFGH';
export const xy = c => [COLS.indexOf(c[0]), +c.slice(1) - 1];
export const cellAt = (x, y) => COLS[x] + (y + 1);
// north, east, south and west in the order of a turn to the right: where each one goes and how it is said
export const TURN = 'NESO';
export const DIRS = { N: [0, 1, 'nord', 'al nord'], E: [1, 0, 'est', "a l'est"], S: [0, -1, 'sud', 'al sud'], O: [-1, 0, 'oest', "a l'oest"] };
// where a walk of legs [direction, squares] ends
export function route(start, legs) { let [x, y] = xy(start); for (const [d, n] of legs) { x += DIRS[d][0] * n; y += DIRS[d][1] * n; } return cellAt(x, y); }
const inMap = (M, x, y) => x >= 0 && y >= 0 && x < M.w && y < M.h && !(M.water || []).includes(cellAt(x, y));
export const free = (M, c) => inMap(M, ...xy(c));
// the steps of the shortest way round the water; -1 when there is none
export function shortest(M, start, goal) {
  const dist = { [start]: 0 }, todo = [start];
  while (todo.length) {
    const c = todo.shift(), [x, y] = xy(c);
    if (c === goal) return dist[c];
    for (const d of TURN) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1], k = cellAt(nx, ny); if (inMap(M, nx, ny) && !(k in dist)) { dist[k] = dist[c] + 1; todo.push(k); } }
  }
  return -1;
}

/* ---------- solids ---------- */
const ringOf = (n, r, y, off, sx) => Array.from({ length: n }, (_, i) => { const a = off + i * 2 * Math.PI / n; return [r * Math.cos(a) * sx, y, r * Math.sin(a)]; });
// a prism and a pyramid over a regular base of n sides, round the middle of the space: V its corners and F its faces, each a loop of corners
const prism = (n, h, r, off = 0, sx = 1) => ({ V: [...ringOf(n, r, h / 2, off, sx), ...ringOf(n, r, -h / 2, off, sx)],
  F: [Array.from({ length: n }, (_, i) => i), Array.from({ length: n }, (_, i) => n + i), ...Array.from({ length: n }, (_, i) => [i, (i + 1) % n, n + (i + 1) % n, n + i])] });
const pyramid = (n, h, r, off = 0) => ({ V: [[0, h * 0.6, 0], ...ringOf(n, r, -h * 0.4, off, 1)],
  F: [Array.from({ length: n }, (_, i) => i + 1), ...Array.from({ length: n }, (_, i) => [0, 1 + i, 1 + (i + 1) % n])] });
// name is how it is called, of how «of a ...» is said, like what a child knows it from; round ones have no faces to count
export const SOLIDS = {
  cub: { name: 'cub', of: "d'un cub", like: 'un dau', hue: 195, ...prism(4, 2, Math.SQRT2, Math.PI / 4) },
  capsa: { name: 'prisma rectangular', of: "d'un prisma rectangular", like: 'una capsa de sabates', hue: 28, ...prism(4, 1.5, Math.SQRT2, Math.PI / 4, 1.5) },
  prisma3: { name: 'prisma triangular', of: "d'un prisma triangular", like: 'una tenda de campanya', hue: 140, ...prism(3, 2.4, 1.3, Math.PI / 6) },
  prisma6: { name: 'prisma hexagonal', of: "d'un prisma hexagonal", like: 'un llapis sense punta', hue: 48, ...prism(6, 2.2, 1.25) },
  piramide: { name: 'piràmide', of: "d'una piràmide de base quadrada", like: "les piràmides d'Egipte", hue: 40, ...pyramid(4, 2.3, 1.7, Math.PI / 4) },
  tetra: { name: 'tetraedre', of: "d'un tetraedre", like: 'una piràmide de base triangular', hue: 318, ...pyramid(3, 2.3, 1.6, Math.PI / 6) },
  cilindre: { name: 'cilindre', of: "d'un cilindre", like: 'una llauna de refresc', hue: 350, round: true, ...prism(28, 2.4, 1.1) },
  con: { name: 'con', of: "d'un con", like: 'un cucurutxo de gelat', hue: 262, round: true, ...pyramid(28, 2.6, 1.25) },
  esfera: { name: 'esfera', of: "d'una esfera", like: 'una pilota', hue: 20, round: true, ball: true, V: [], F: [] }
};
// the faces (f), corners (v) and edges (e) of a solid, counted on its own mesh
export function count(id) {
  const S = SOLIDS[id], edges = new Set(S.F.flatMap(f => f.map((a, i) => { const b = f[(i + 1) % f.length]; return a < b ? `${a}-${b}` : `${b}-${a}`; })));
  return { f: S.F.length, v: S.V.length, e: edges.size };
}

/* ---------- buildings of cubes ---------- */
// h[y][x] is how many cubes are piled on the square of row y (0 is the back) and column x. Seen from the front the columns go
// left to right as x; seen from the right side, as the rows from the front one to the back
export function views(h) {
  return { front: h[0].map((_, x) => Math.max(...h.map(r => r[x]))), side: h.map((_, i) => Math.max(...h[h.length - 1 - i])), count: h.flat().reduce((s, n) => s + n, 0) };
}
const trim = a => { let i = 0, j = a.length; while (i < j && !a[i]) i++; while (j > i && !a[j - 1]) j--; return a.slice(i, j); };
// the building without the empty rows and columns round it
function core(h) {
  const ys = h.map(r => r.some(Boolean)), xs = h[0].map((_, x) => h.some(r => r[x]));
  return h.slice(ys.indexOf(true), ys.lastIndexOf(true) + 1).map(r => r.slice(xs.indexOf(true), xs.lastIndexOf(true) + 1));
}
// '' when the building is what the level wants: the same as a model (h), a number of cubes (count), a view from the front or
// from the side, or a box of three sizes in any position (box)
export function buildOk(W, h) {
  const v = views(h);
  if (!v.count) return 'Encara no hi ha cap cub.';
  if (W.h && String(core(h).map(r => r.join(''))) !== String(W.h.map(r => r.join('')))) return 'Encara no és igual que el model. Compta quants cubs té cada torre, i en quin ordre van.';
  if (W.count && v.count !== W.count) return `Hi ha ${v.count} ${v.count === 1 ? 'cub' : 'cubs'}, i n'hi ha d'haver ${W.count}.`;
  if (W.front && String(trim(v.front)) !== String(W.front)) return 'La vista de davant no surt igual. Mira quina alçada ha de tenir cada columna, d\'esquerra a dreta.';
  if (W.side && String(trim(v.side)) !== String(W.side)) return 'La vista del costat no surt igual. Mira-la des de la fletxa «costat».';
  if (W.box) {
    const a = core(h), z = a[0][0];
    if (!a.every(r => r.every(n => n === z))) return 'Un prisma no té graons ni forats: totes les torres han de ser igual d\'altes.';
    if (String([a[0].length, a.length, z].sort()) !== String(W.box.slice().sort())) return `El teu prisma fa ${a[0].length} × ${a.length} × ${z}, i ha de fer ${W.box.join(' × ')}.`;
  }
  return '';
}
// Six squares that could fold into a cube, each [x, y]. A cube is rolled over them from the first: they fold into one when every
// square gets a different face
export const NETS = {
  creu: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]], te: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3]],
  escala: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], zeta: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
  fila: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]], bloc: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  pe: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]], banc: [[0, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]]
};
export function foldsToCube(cells) {
  // the faces of the cube as [bottom, top, north, south, east, west], and what they become when it rolls one square
  const ROLL = [[1, 0, ([b, t, n, s, e, w]) => [e, w, n, s, t, b]], [-1, 0, ([b, t, n, s, e, w]) => [w, e, n, s, b, t]], [0, -1, ([b, t, n, s, e, w]) => [n, s, t, b, e, w]], [0, 1, ([b, t, n, s, e, w]) => [s, n, b, t, e, w]]];
  const at = new Map([[String(cells[0]), [0, 1, 2, 3, 4, 5]]]), todo = [cells[0]];
  while (todo.length) {
    const [x, y] = todo.pop();
    for (const [dx, dy, roll] of ROLL) { const k = String([x + dx, y + dy]); if (!at.has(k) && cells.some(c => String(c) === k)) { at.set(k, roll(at.get(String([x, y])))); todo.push([x + dx, y + dy]); } }
  }
  return cells.length === 6 && at.size === 6 && new Set([...at.values()].map(f => f[0])).size === 6;
}

/* ---------- the levels ---------- */
// One or more questions over a drawing. A step is { q, want, opts, unit, done, how, as }: with opts the answer is one of them, without
// it is typed on the keys; done is the line the notebook keeps and how the hint. as says the options are drawings ('shape', 'solid', 'net', 'view')
const ask = (title, pic, steps, say = '') => ({ kind: 'ask', title, pic, steps, say });
const st = (q, want, opts, unit, done, how, as = '') => ({ q, want, opts, unit, done, how, as });
// make a polygon on the pegs; sol is one that is right
const geo = (title, q, want, sol, say, how) => ({ kind: 'geo', title, ask: q, want, sol, say, how });
// Paint squares. rows draws the grid: '#' a square that is already there (the model), 'o' one of a right answer, '.' an empty one
function paint(title, q, rows, want, say, how) {
  const w = rows[0].length, of = ch => rows.flatMap((r, y) => [...r].flatMap((c, x) => c === ch ? [y * w + x] : []));
  return { kind: 'paint', title, ask: q, w, h: rows.length, given: of('#'), sol: of('o'), want, say, how };
}
// open an angle of want degrees, in steps of 15; show says whether the degrees are written while it moves
const turn = (title, q, want, show, say, how) => ({ kind: 'turn', title, ask: q, want, show, say, how });
// touch a square of the map; with legs the square is where a walk from start ends
const spot = (title, M, q, want, say, how, start = null) => ({ kind: 'spot', title, M, ask: q, want, start, say, how });
const legsText = legs => legs.map(([d, n]) => `<b>${n} ${n > 1 ? 'caselles' : 'casella'} ${DIRS[d][3]}</b>`).join(', ').replace(/, ([^,]*)$/, ' i $1');
const walkTo = (title, M, start, legs, say, how) => spot(title, M, `Surts de <b>${start}</b> i fas ${legsText(legs)}. On arribes?`, route(start, legs), say, how, start);
// Walk the frog to the flag in as many steps as the shortest way takes, plus extra. rel: the keys are «forward» and the two turns, and dir where it looks
function walk(title, M, start, goal, say, { rel = false, dir = 'N', extra = 0 } = {}) {
  return { kind: 'walk', title, M, start, goal, rel, dir, steps: shortest(M, start, goal) + extra, say };
}
// pile cubes on a floor of n by n; model is a building drawn next to it and pics the views to copy
const build = (title, q, n, want, sol, say, how, model = null) => ({ kind: 'build', title, ask: q, n, want, sol, say, how, model });

const JUNGLE = { w: 6, h: 5, things: { B4: ['🦜', 'el lloro'], D2: ['🌴', 'la palmera'], E5: ['⛰️', 'la muntanya'], F1: ['💎', 'el tresor'] } };
const PLAIN = { w: 6, h: 5, things: {} };
const RIVER = { w: 6, h: 5, things: {}, water: ['C1', 'C2'] };
const DELTA = { w: 6, h: 5, things: {}, water: ['C1', 'C2', 'C3', 'E5', 'E4'] };
const PODIUM = [[2, 3, 1]], C = count;

export const SECTIONS = [
  { name: 'Banderes del món', ico: '🚩', sub: 'Les formes que s\'amaguen a les banderes del món.', levels: [
    ask('La bandera olímpica', { t: 'flag', id: 'oli' }, [
      st('Quantes anelles hi ha a la bandera olímpica?', 5, [4, 5, 6], '', '5 anelles: una per cada continent', 'Compta-les: tres a dalt i dues a baix.'),
      st('Quina forma té cada anella?', 'cercle', ['quadrat', 'cercle', 'triangle'], '', 'Cada anella és un cercle', 'És la forma rodona: no té cap costat ni cap punta.')], 'Benvingut a Europa, on van néixer els Jocs Olímpics! Les cinc anelles són els cinc continents, agafats de la mà.'),
    ask('Txèquia', { t: 'flag', id: 'cz' }, [st('Quina forma té la part blava?', 'triangle', ['triangle', 'rectangle', 'cercle'], '', 'La part blava és un triangle: 3 costats i 3 vèrtexs', 'Compta els costats de la part blava.')], 'La bandera de Txèquia. Les banderes són plenes de formes!'),
    ask('França', { t: 'flag', id: 'fr' }, [st('Quants rectangles iguals té la bandera de França?', 3, [2, 3, 4], '', '3 rectangles iguals, un de cada color', 'Compta les franges: blava, blanca i vermella.')], 'Un rectangle té 4 costats i 4 angles rectes, com un full de paper.'),
    ask('Sis costats', { t: 'text', html: '6', cap: '«hexa» vol dir sis' }, [st('Quina d\'aquestes formes és un <b>hexàgon</b>?', 'hex', ['pent', 'hex', 'oct'], '', "L'hexàgon té 6 costats", 'Compta els costats de cada forma: en busques 6.', 'shape')], 'Els polígons es diuen segons quants costats tenen. Les abelles fan cel·les de sis costats.'),
    ask('Suïssa', { t: 'flag', id: 'ch' }, [st('Quina forma té tota la bandera de Suïssa?', 'quadrat', ['rectangle', 'quadrat', 'rombe'], '', 'És un quadrat: 4 costats iguals i 4 angles rectes', 'Mira si és més llarga que alta, o si fa el mateix de cada costat.')], 'Gairebé totes les banderes del món són rectangles. La de Suïssa és especial.'),
    ask('El Brasil', { t: 'flag', id: 'br' }, [st('La forma groga té 4 costats iguals, i està posada de punta. Com es diu?', 'rombe', ['rombe', 'rectangle', 'trapezi'], '', 'La forma groga és un rombe: 4 costats iguals', 'No és un rectangle: els seus angles no són rectes.')], 'La bandera del Brasil: una forma groga amb un cercle blau a dins.'),
    ask('Jamaica', { t: 'flag', id: 'jm' }, [st('Quants triangles hi ha a la bandera de Jamaica?', 4, [2, 4, 6], '', '4 triangles: 2 de verds i 2 de negres', 'Compta els verds i després els negres.')], 'Dues ratlles creuades, una aspa, parteixen la bandera de Jamaica.'),
    ask('Kuwait', { t: 'flag', id: 'kw' }, [st('La part negra té 4 costats, i només 2 són paral·lels. Com es diu?', 'trapezi', ['trapezi', 'triangle', 'rectangle'], '', 'La part negra és un trapezi: 2 costats paral·lels', 'Té 4 costats, així que no és un triangle. I no té 4 angles rectes.')], 'Dos costats són paral·lels quan no es trobarien mai, com els rails del tren.'),
    ask('El Nepal', { t: 'flag', id: 'np' }, [st('Quants costats té la vora de la bandera del Nepal?', 5, [3, 4, 5, 6], '', 'La vora té 5 costats: és un pentàgon amb una osca', 'Ressegueix la vora amb el dit i compta cada tros recte.')], "La bandera del Nepal és l'única del món que no és un rectangle ni un quadrat."),
    ask('Trinitat i Tobago', { t: 'flag', id: 'tt' }, [st('La franja negra té els costats paral·lels de dos en dos, i cap angle recte. Com es diu?', 'paral·lelogram', ['rectangle', 'paral·lelogram', 'trapezi'], '', 'La franja negra és un paral·lelogram', 'Un rectangle té angles rectes, i un trapezi només té 2 costats paral·lels.')], 'L\'última bandera del projecte ve d\'una illa del Carib!')
  ] },
  { name: 'El geoplà', ico: '📌', sub: 'Estira la goma entre els claus i fes polígons.', levels: [
    geo('Un triangle', 'Fes un <b>triangle</b>.', { n: 3 }, [[0, 0], [2, 0], [0, 2]], 'Això és un geoplà: una fusta amb claus. Toca claus per passar-hi la goma, i torna a tocar el primer per tancar la figura.', 'Toca 3 claus que no estiguin en línia, i després torna a tocar el primer.'),
    geo('Un quadrat', 'Fes un <b>quadrat</b>.', { name: ['sq'] }, [[0, 0], [2, 0], [2, 2], [0, 2]], 'Un quadrat té 4 costats iguals i 4 angles rectes.', 'Tots 4 costats han de passar pel mateix nombre de claus.'),
    geo('Un rectangle', 'Fes un <b>rectangle</b> que no sigui quadrat.', { name: ['rect'] }, [[0, 0], [3, 0], [3, 1], [0, 1]], 'Un rectangle té 4 angles rectes. Aquest el vull més llarg que alt.', 'Fes-lo de 3 espais de llarg i 1 d\'alt, per exemple.'),
    geo('Angle recte', 'Fes un triangle amb <b>un angle recte</b>.', { n: 3, right: 1 }, [[0, 0], [2, 0], [0, 2]], 'Un angle recte és el cantó d\'un full de paper. El triangle que en té un es diu triangle rectangle.', 'Fes un costat pla i un de dret que surtin del mateix clau.'),
    geo('Cinc costats', 'Fes un <b>pentàgon</b>: 5 costats.', { n: 5 }, [[0, 0], [2, 0], [3, 1], [2, 2], [0, 2]], '«Penta» vol dir cinc. No cal que els costats siguin iguals!', 'Toca 5 claus fent la volta, sense que 3 de seguits quedin en línia.'),
    geo('Sis costats', 'Fes un <b>hexàgon</b>: 6 costats.', { n: 6 }, [[1, 0], [2, 0], [3, 1], [2, 2], [1, 2], [0, 1]], 'I «hexa» vol dir sis. Compte que la goma no es creui.', 'Fes la volta com si dibuixessis una pilota aixafada: 6 claus.'),
    geo('Dos costats iguals', 'Fes un triangle amb <b>dos costats iguals</b> i sense cap angle recte.', { n: 3, iso: true, noright: true }, [[0, 2], [2, 2], [1, 0]], 'El triangle amb dos costats iguals es diu isòsceles: sembla una teulada.', 'Fes una base plana de 2 espais i posa la punta just al mig, 2 claus més amunt.'),
    geo('Un trapezi', 'Fes un <b>trapezi</b>: només 2 costats paral·lels.', { name: ['trap'] }, [[1, 0], [2, 0], [3, 2], [0, 2]], 'Un trapezi és com un triangle amb la punta tallada.', 'Fes un costat pla curt a dalt i un de pla més llarg a baix.'),
    geo('De biaix', 'Fes un <b>paral·lelogram</b> sense cap angle recte.', { name: ['par', 'rhombus'] }, [[1, 0], [3, 0], [2, 2], [0, 2]], 'Un paral·lelogram és un rectangle que s\'ha inclinat: els costats continuen paral·lels de dos en dos.', 'Fes un costat pla a dalt i un d\'igual a baix, però corregut un clau cap al costat.'),
    geo('El quadrat girat', 'Fes un <b>quadrat</b> que no tingui cap costat pla.', { name: ['sq'], tilted: true }, [[1, 0], [2, 1], [1, 2], [0, 1]], 'El repte del geoplà: un quadrat girat també és un quadrat!', 'Posa\'l de punta, com un estel: un clau a dalt, un a la dreta, un a baix i un a l\'esquerra.')
  ] },
  { name: 'El perímetre', ico: '🏃', sub: 'La volta sencera a una figura, com la pista de l\'estadi.', levels: [
    ask('Una volta a la pista', { t: 'rect', a: 5, b: 3, grid: true }, [st('La granota fa una volta sencera per la vora. Quants passos fa?', 16, [8, 15, 16], 'passos', '5 + 3 + 5 + 3 = 16 passos de perímetre', 'Suma els quatre costats: 5 + 3 + 5 + 3.')], 'Benvingut a l\'Àfrica! El perímetre és el que fa la vora d\'una figura: la volta sencera.'),
    ask('El camp quadrat', { t: 'rect', a: 6, b: 6, u: 'm' }, [st('Un camp quadrat fa 6 m de costat. Quant fa el perímetre?', 24, [12, 24, 36], 'm', '4 × 6 = 24 m de perímetre', 'Un quadrat té 4 costats iguals: 6 + 6 + 6 + 6.')], 'En un quadrat tots quatre costats fan el mateix.'),
    paint('La tanca', 'Pinta un <b>rectangle</b> de <b>perímetre 10</b>.', ['......', '.ooo..', '.ooo..', '......', '......'], { rect: true, perim: 10 }, 'Toca els quadrets per pintar-los. La vora de la figura és la tanca.', 'La meitat de 10 és 5: busca un llarg i un alt que sumin 5, com 3 i 2.'),
    ask('La figura en L', { t: 'cells', rows: ['#..', '#..', '###'] }, [st('Quin perímetre té aquesta figura?', 12, [10, 12, 14], '', 'El perímetre és 12: el mateix que un quadrat de 3 × 3!', 'Ves resseguint la vora i compta cada costat de quadret.')], 'El perímetre no és només cosa de rectangles.'),
    paint('El quadrat', 'Pinta un <b>quadrat</b> de <b>perímetre 12</b>.', ['......', '.ooo..', '.ooo..', '.ooo..', '......'], { sq: true, perim: 12 }, 'Quatre costats iguals han de sumar 12.', '12 : 4 = 3. Cada costat fa 3 quadrets.'),
    ask('La vela', { t: 'tri', sides: ['4 m', '3 m', '5 m'] }, [st('Quin perímetre té la vela?', 12, null, 'm', '3 + 4 + 5 = 12 m', 'Suma els tres costats.')], 'La vela d\'un veler olímpic és un triangle. Ara la resposta s\'escriu amb les tecles.'),
    ask('L\'hexàgon', { t: 'shape', id: 'hex', lab: '5 m' }, [st('Tots 6 costats fan 5 m. Quin perímetre té?', 30, null, 'm', '6 × 5 = 30 m', 'Són 6 costats iguals de 5 m.')], 'Una plaça amb forma d\'hexàgon regular: tots els costats iguals.'),
    paint('Sis quadrets', 'Pinta una figura d\'<b>àrea 6</b> i <b>perímetre 10</b>.', ['.......', '..ooo..', '..ooo..', '.......'], { area: 6, perim: 10 }, 'L\'àrea és quants quadrets pintes; el perímetre, la tanca que els envolta.', 'Ben arrambats gasten poca tanca: prova un rectangle de 3 × 2.'),
    paint('Més tanca', 'Ara <b>àrea 6</b>, però <b>perímetre 14</b>.', ['.......', 'oooooo.', '.......', '.......'], { area: 6, perim: 14 }, 'Els mateixos 6 quadrets, i molta més tanca! La mateixa àrea pot tenir perímetres diferents.', 'Posa els 6 quadrets en fila, o fent una L llarga.'),
    ask('El costat amagat', { t: 'rect', a: 6, b: 4, u: 'm', lb: '?' }, [
      st('El perímetre d\'aquest rectangle és 20 m. Quant fan junts un costat llarg i un de curt?', 10, null, 'm', 'Mig perímetre: 20 : 2 = 10 m', 'Un llarg i un curt són la meitat de la volta.'),
      st('El costat llarg fa 6 m. Quant fa el curt?', 4, null, 'm', '10 − 6 = 4 m', 'El llarg i el curt sumen 10.')], 'Ara al revés: saps la volta sencera i falta un costat.')
  ] },
  { name: 'L\'àrea', ico: '🏊', sub: 'Quants quadrets hi caben a dins: rajoles, mosaics i piscines.', levels: [
    ask('Rajoles', { t: 'rect', a: 4, b: 3, grid: true }, [st('Quants quadrets té aquest rectangle?', 12, [7, 12, 14], 'quadrets', '3 files de 4: 3 × 4 = 12 quadrets', 'Hi ha 3 files, i a cada fila 4 quadrets.')], 'L\'àrea és el que ocupa una figura per dins. Es mesura en quadrets.'),
    paint('Set quadrets', 'Pinta una figura d\'<b>àrea 7</b>, d\'una sola peça.', ['......', '.oooo.', '.ooo..', '......', '......'], { area: 7 }, 'La forma la tries tu: només compta quants quadrets pintes.', 'Pinta 7 quadrets que es toquin pels costats.'),
    ask('El pati', { t: 'rect', a: 6, b: 4, u: 'm' }, [st('El pati fa 6 m de llarg i 4 m d\'ample. Quina àrea té?', 24, [10, 20, 24], 'm²', '6 × 4 = 24 m²', 'Imagina\'t 4 files de 6 quadrets d\'1 metre.')], 'En un rectangle no cal comptar els quadrets un per un: llarg per ample. Un quadret d\'1 m de costat és 1 m², un metre quadrat.'),
    paint('Dotze rajoles', 'Pinta un <b>rectangle</b> d\'<b>àrea 12</b>.', ['......', '.oooo.', '.oooo.', '.oooo.', '......'], { rect: true, area: 12 }, 'N\'hi ha més d\'un que val!', 'Busca dos números que multiplicats facin 12: 4 × 3, o 6 × 2.'),
    ask('La sala en L', { t: 'cells', rows: ['###..', '###..', '#####', '#####'] }, [st('Quina àrea té aquesta sala?', 16, null, 'quadrets', '6 + 10 = 16 quadrets', 'Parteix-la en dos rectangles: el de dalt fa 3 × 2 i el de baix 5 × 2.')], 'Una figura estranya es pot partir en rectangles.'),
    geo('Mig quadrat', 'Fes un <b>triangle</b> d\'<b>àrea 2</b>.', { n: 3, area: 2 }, [[0, 0], [2, 0], [0, 2]], 'Al geoplà, cada quadret entre 4 claus fa 1 d\'àrea. Un triangle pot ser la meitat d\'un quadrat!', 'Un quadrat de 2 × 2 fa 4 d\'àrea. Fes-ne la meitat: un triangle rectangle amb dos costats de 2 espais.'),
    ask('La meitat', { t: 'rect', a: 6, b: 4, grid: true, diag: true }, [st('El rectangle sencer fa 24 quadrets. Quina àrea té el triangle pintat?', 12, [8, 12, 18], 'quadrets', '24 : 2 = 12 quadrets', 'La ratlla parteix el rectangle en dues meitats iguals.')], 'Un triangle rectangle és mig rectangle.'),
    paint('Vuit i dotze', 'Pinta una figura d\'<b>àrea 8</b> i <b>perímetre 12</b>.', ['.......', '.oooo..', '.oooo..', '.......', '.......'], { area: 8, perim: 12 }, 'Àrea i perímetre alhora: quadrets de dins i tanca de fora.', 'Prova un rectangle de 4 × 2.'),
    ask('La piscina olímpica', { t: 'rect', a: 50, b: 25, u: 'm' }, [
      st('La piscina fa 50 m de llarg i 25 m d\'ample. Primer: quant fa 50 × 20?', 1000, null, '', '50 × 20 = 1000', '5 × 2 = 10, i dos zeros.'),
      st('I 50 × 5 fa 250. Quina àrea té la piscina?', 1250, null, 'm²', '1000 + 250 = 1250 m²', 'Suma els dos trossos: 1000 + 250.')], 'Una piscina olímpica fa 50 m per 25 m. Multiplica a trossos.'),
    ask('El mosaic', { t: 'rect', a: 6, b: 5, grid: true }, [
      st('Un terra de 6 per 5 rajoles. Quantes rajoles hi van?', 30, null, 'rajoles', '6 × 5 = 30 rajoles', 'Llarg per ample.'),
      st('Les rajoles van en capses de 10. Quantes capses calen?', 3, null, 'capses', '30 : 10 = 3 capses', 'Quants cops hi cap 10 en 30?')], 'Al Marroc fan mosaics preciosos de rajoles petites.')
  ] },
  { name: 'Miralls', ico: '🦋', sub: 'La simetria: una meitat és el reflex de l\'altra.', levels: [
    paint('Mitja papallona', 'Pinta l\'altra meitat: el <b>reflex</b> al mirall.', ['........', '..##oo..', '.###ooo.', '..##oo..', '...#o...', '........'], { mirror: 'v' }, 'Benvingut a l\'Àsia! La ratlla groga és un mirall. Una figura és simètrica quan una meitat és el reflex de l\'altra.', 'Cada quadret té un bessó a l\'altra banda, igual de lluny del mirall. Comença pels que el toquen.'),
    paint('El drac', 'Pinta el <b>reflex</b> a l\'altra banda del mirall.', ['#......o', '##....oo', '.###ooo.', '..##oo..', '.#.#o.o.', '........'], { mirror: 'v' }, 'El que és lluny del mirall, lluny queda a l\'altra banda.', 'Fes-ho fila per fila: compta quants quadrets hi ha fins al mirall.'),
    ask('Plega-la', { t: 'text', html: '↔', cap: 'plegada per la meitat, de costat a costat' }, [st('Quina d\'aquestes banderes té la meitat esquerra igual que la dreta, com en un mirall?', 'jp', ['fr', 'jp', 'cz'], '', 'La del Japó: el cercle és al mig', 'Imagina que plegues cada bandera per la meitat. Els colors han de coincidir.', 'flag')], 'El Japó, el país de l\'origami: plegar paper és fer simetries.'),
    paint('El llac', 'Pinta el <b>reflex</b> de la muntanya a l\'aigua.', ['..#...', '.###..', '####.#', 'oooo.o', '.ooo..', '..o...'], { mirror: 'h' }, 'Ara el mirall està ajagut: és l\'aigua d\'un llac. El reflex surt cap per avall.', 'El que toca l\'aigua, toca l\'aigua a l\'altra banda. La punta queda a baix de tot.'),
    ask('El quadrat', { t: 'shape', id: 'sq' }, [st('Per quantes ratlles pots plegar un quadrat perquè les dues meitats coincideixin?', 4, [2, 4, 8], '', 'Un quadrat té 4 eixos de simetria', 'N\'hi ha un de dret, un d\'ajagut, i dos de cantó a cantó.')], 'La ratlla del mirall es diu eix de simetria. Una figura en pot tenir més d\'un.'),
    paint('Lluny del mirall', 'Pinta el <b>reflex</b>.', ['#......o', '#.#..o.o', '###..ooo', '..#..o..', '.##..oo.', '........'], { mirror: 'v' }, 'Ara la figura no toca el mirall: el reflex tampoc.', 'Compta: si un quadret és a 2 del mirall, el seu bessó també és a 2.'),
    ask('El triangle', { t: 'shape', id: 'tri' }, [st('Aquest triangle té els 3 costats iguals. Quants eixos de simetria té?', 3, [1, 2, 3], '', 'El triangle equilàter té 3 eixos de simetria', 'De cada punta en surt un, cap al mig del costat de davant.')], 'Un triangle amb tots tres costats iguals es diu equilàter.'),
    paint('El mosaic', 'Acaba el mosaic: ha de ser simètric pels <b>dos miralls</b>.', ['#.#o.o', '.##oo.', '###ooo', 'oooooo', '.oooo.', 'o.oo.o'], { mirror: 'vh' }, 'Dos miralls alhora! Així es fan les rajoles dels palaus: se\'n dibuixa un quart i la resta són reflexos.', 'Fes primer el reflex cap a la dreta. Després, el reflex de tota la part de dalt cap avall.'),
    ask('El rectangle', { t: 'rect', a: 6, b: 3 }, [st('Quants eixos de simetria té un rectangle que no és quadrat?', 2, [2, 4], '', 'Un rectangle té 2 eixos: el dret i l\'ajagut', 'Prova de plegar un full de cantó a cantó: les meitats no coincideixen!')], 'Compte amb les diagonals: plegar de cantó a cantó no sempre va bé.'),
    paint('El gran mosaic', 'Acaba el mosaic amb els <b>dos miralls</b>.', ['..#..o..', '.##..oo.', '###..ooo', '...#o...', '...oo...', 'ooo..ooo', '.oo..oo.', '..o..o..'], { mirror: 'vh' }, 'L\'últim mosaic, i el més gran.', 'Un quart ja hi és. Fes-ne el reflex a la dreta, i després tot plegat cap avall.')
  ] },
  { name: 'Angles', ico: '🤸', sub: 'Girs i voltes: obre el ventall i fes de gimnasta.', levels: [
    turn('L\'angle recte', 'Obre el ventall fins a <b>90°</b>.', 90, true, 'Un angle és el que s\'obren dues ratlles que surten del mateix punt. Es mesura en graus. Arrossega la vareta o fes servir les fletxes.', 'Puja la vareta fins que quedi ben dreta: 90°.'),
    ask('Més tancat', { t: 'angle', deg: 40 }, [st('Aquest angle és més tancat que un angle recte. Com es diu?', 'agut', ['agut', 'recte', 'obtús'], '', 'Un angle de menys de 90° és agut', 'Agut vol dir punxegut: és el més tancat.')], 'Un angle de 90° és un angle recte: el cantó d\'un full.'),
    ask('Més obert', { t: 'angle', deg: 125 }, [st('Aquest angle és més obert que un angle recte. Com es diu?', 'obtús', ['agut', 'recte', 'obtús'], '', 'Un angle de més de 90° és obtús', 'No és punxegut (agut) ni és el cantó d\'un full (recte).')], 'Hi ha angles tancats, rectes i oberts.'),
    turn('Mitja volta', 'La gimnasta fa <b>mitja volta</b>: obre l\'angle fins a <b>180°</b>.', 180, true, 'Mitja volta són dos angles rectes: 90 + 90.', 'Segueix girant fins que la vareta quedi plana, mirant a l\'altra banda.'),
    turn('Sense números', 'Fes un <b>angle recte</b>. Ara no hi ha números!', 90, false, 'Fes-ho a ull: recorda el cantó d\'un full.', 'Un angle recte fa una L: una ratlla plana i una de ben dreta.'),
    ask('Un quart de volta', { t: 'spin', frac: 0.25 }, [st('Una volta sencera són 360°. Quants graus és un quart de volta?', 90, [45, 90, 180], '°', '360 : 4 = 90°: un angle recte', 'Parteix 360 en 4 trossos iguals. O fes la meitat de 180.')], 'Una volta sencera, com la d\'una patinadora, són 360°.'),
    turn('La meitat', 'Fes la <b>meitat d\'un angle recte</b>.', 45, false, 'La meitat de 90° són 45°. Com un tall de pizza de vuit.', 'Deixa la vareta just a mig camí entre plana i dreta.'),
    ask('El rellotge', { t: 'clock', h: 3 }, [
      st('A les 3 en punt, quants graus fan les dues agulles?', 90, [30, 90, 180], '°', 'A les 3, un angle recte: 90°', 'Una agulla mira amunt i l\'altra a la dreta: fan una L.'),
      st('I a les 6 en punt?', 180, [90, 180, 360], '°', 'A les 6, mitja volta: 180°', 'Una mira amunt i l\'altra avall: fan una ratlla recta.')], 'Les agulles del rellotge fan angles tot el dia.'),
    ask('El tercer angle', { t: 'tri', ang: ['90°', '60°', '?'] }, [st('Els tres angles d\'un triangle sempre sumen 180°. Quant fa el que falta?', 30, null, '°', '180 − 90 − 60 = 30°', 'Suma 90 i 60, i mira quant falta fins a 180.')], 'Un secret dels triangles: els seus tres angles sumen sempre 180°, mitja volta.'),
    ask('El salt', { t: 'spin', frac: 1 }, [
      st('Una surfista de neu fa un «720». Quantes voltes senceres són?', 2, [2, 3, 7], 'voltes', '720 : 360 = 2 voltes', 'Una volta són 360°. I 360 + 360?'),
      st('I un salt de 3 voltes, quants graus són?', 1080, null, '°', '3 × 360 = 1080°', 'Suma 360 tres cops: 720 i 360 més.')], 'Als Jocs d\'hivern, els salts tenen nom de graus.')
  ] },
  { name: 'El mapa', ico: '🧭', sub: 'Coordenades, nord i sud, i girs a dreta i esquerra.', levels: [
    spot('La casella', PLAIN, 'Toca la casella <b>C2</b>.', 'C2', 'Benvingut a Amèrica! Per trobar un lloc al mapa calen una lletra i un número: la lletra diu la columna i el número, la fila.', 'Busca la lletra C a baix, i puja fins a la fila 2.'),
    ask('El lloro', { t: 'map', M: JUNGLE }, [st('A quina casella és el lloro?', 'B4', ['B4', 'D2', 'D4'], '', 'El lloro és a B4: columna B, fila 4', 'Baixa des del lloro fins a la lletra, i mira a l\'esquerra quin número té la fila.')], 'Un mapa de la selva de l\'Amazones.'),
    walk('Cap a la bandera', PLAIN, 'A1', 'D3', 'Porta la granota fins a la bandera. El nord és amunt, el sud avall, l\'est a la dreta i l\'oest a l\'esquerra.'),
    walkTo('Segueix el camí', PLAIN, 'A1', [['E', 3], ['N', 2]], 'Ara camina amb el cap: segueix les ordres i toca on arribaries.', 'L\'est és a la dreta: de la A a la D. El nord és amunt: de la fila 1 a la 3.'),
    walk('El riu', RIVER, 'A1', 'E1', 'Compte amb el riu: per l\'aigua no s\'hi pot passar. Busca el camí més curt.'),
    walkTo('Cap al sud', PLAIN, 'E5', [['S', 2], ['O', 3]], 'El sud és avall, i l\'oest a l\'esquerra.', 'De la fila 5 baixa a la 3. De la E, tres lletres enrere.'),
    walk('Gira i avança', PLAIN, 'A1', 'C4', 'Ara la granota només sap avançar i girar. Gira-la cap on vols anar, i després avança.', { rel: true }),
    ask('La brúixola', { t: 'compass' }, [
      st('La granota mira al <b>nord</b> i fa un quart de volta cap a la dreta. Cap on mira ara?', 'est', ['est', 'sud', 'oest'], '', 'Del nord, un quart de volta a la dreta: l\'est', 'Girar a la dreta és girar com les agulles del rellotge.'),
      st('I si ara fa mitja volta?', 'oest', ['nord', 'sud', 'oest'], '', 'Mitja volta des de l\'est: l\'oest', 'Mitja volta et deixa mirant just al revés.')], 'La brúixola assenyala sempre el nord.'),
    walk('El delta', DELTA, 'A1', 'F5', 'Dos braços de riu! Gira i avança fins a la bandera, sense malgastar passos.', { rel: true, dir: 'E' }),
    walkTo('El tresor', JUNGLE, 'B2', [['N', 2], ['E', 3], ['S', 1]], 'L\'últim mapa: tres ordres seguides.', 'Fes-ho a trossos: de B2 puja a B4, després ves fins a E4, i baixa una casella.')
  ] },
  { name: 'A escala', ico: '🗺️', sub: 'Més gran i més petit, però amb la mateixa forma.', levels: [
    ask('El doble de llarga', { t: 'rect', a: 6, b: 3, la: '?', lb: '3 m' }, [st('Aquesta bandera és el doble de llarga que d\'alta. Si fa 3 m d\'alt, quant fa de llarg?', 6, [5, 6, 9], 'm', 'El doble de 3 m: 6 m', 'El doble és dos cops: 3 + 3.')], 'Una proporció diu com és una mida comparada amb una altra.'),
    paint('El doble de gran', 'Pinta la mateixa figura, però amb <b>cada costat el doble de llarg</b>.', ['##......', '........', '..oooo..', '..oooo..', '........', '........'], { scale: 2 }, 'La figura blava és el model. Fer-la a escala 2 vol dir que tot es fa el doble: el llarg i també l\'alt.', 'El model fa 2 de llarg i 1 d\'alt. El doble: 4 de llarg i 2 d\'alt.'),
    ask('Quatre cops', { t: 'cells', rows: ['##......', '........', '..####..', '..####..'] }, [
      st('La figura petita té 2 quadrets. Quants en té la gran?', 8, [4, 6, 8], 'quadrets', 'La gran té 8 quadrets', 'Compta\'ls: 2 files de 4.'),
      st('Els costats s\'han fet el doble. Quants cops més gran és l\'àrea?', 4, [2, 4, 8], 'cops', 'Costats × 2, àrea × 4', 'Quants cops hi cap el 2 dins del 8?')], 'Sorpresa: amb els costats el doble de llargs, l\'àrea no es fa el doble.'),
    paint('La L gegant', 'Pinta la L amb <b>cada costat el doble de llarg</b>.', ['#.......', '##......', '...oo...', '...oo...', '...oooo.', '...oooo.'], { scale: 2 }, 'Cada quadret del model es torna un quadrat de 2 × 2.', 'El model té 3 quadrets: la teva en tindrà 12. El pal de la L farà 2 d\'ample i 4 d\'alt.'),
    ask('3 per cada 2', { t: 'rect', a: 6, b: 4, la: '30 cm', lb: '?' }, [st('Moltes banderes fan 3 de llarg per cada 2 d\'alt. Si en fa 30 cm de llarg, quant fa d\'alt?', 20, [15, 20, 45], 'cm', '30 és 10 cops 3, i 10 × 2 = 20 cm', '30 són 10 cops 3. Fes també 10 cops el 2.')], 'La proporció 3 per cada 2 és la de la majoria de banderes del món.'),
    ask('El mapa', { t: 'text', html: '1 cm → 100 km', cap: "l'escala del mapa" }, [st('Al mapa, de Barcelona a París hi ha uns 8 cm. Quants quilòmetres són de debò?', 800, [80, 108, 800], 'km', '8 × 100 = 800 km', 'Cada centímetre del mapa són 100 km de debò.')], 'Un mapa és el món fet petit, sempre amb la mateixa escala.'),
    paint('Tres cops', 'Pinta la figura amb <b>cada costat 3 cops més llarg</b>.', ['##......', '........', '.oooooo.', '.oooooo.', '.oooooo.', '........'], { scale: 3 }, 'Ara l\'escala és 3: tot es fa 3 cops més llarg i 3 cops més alt.', 'El model fa 2 × 1. Tres cops més gran: 6 × 3.'),
    ask('La maqueta', { t: 'text', html: '1 cm → 10 m', cap: "l'escala de la maqueta" }, [st('La torre Eiffel fa 330 m d\'alt. Quants centímetres fa a la maqueta?', 33, null, 'cm', '330 : 10 = 33 cm', 'Cada 10 metres de debò són 1 cm a la maqueta: divideix per 10.')], 'Una maqueta és com un mapa, però de tres dimensions.'),
    ask('Colòmbia', { t: 'flag', id: 'co' }, [
      st('La franja groga és la meitat de la bandera. Si la bandera fa 40 cm d\'alt, quant fa la groga?', 20, null, 'cm', 'La meitat de 40: 20 cm de groc', 'La meitat de 40.'),
      st('La blava i la vermella es reparteixen la resta a parts iguals. Quant fa la blava?', 10, null, 'cm', '20 : 2 = 10 cm de blau', 'En queden 20 cm per a dues franges iguals.')], 'A la bandera de Colòmbia les franges no són iguals: van 2, 1 i 1.'),
    ask('Tailàndia', { t: 'flag', id: 'th' }, [
      st('La franja blava és el doble d\'alta que cada una de les altres 4. Si les vermelles i blanques compten 1 part, quantes parts són en total?', 6, null, 'parts', '1 + 1 + 2 + 1 + 1 = 6 parts', 'La blava compta 2 parts i les altres quatre, 1 cada una.'),
      st('La bandera fa 60 cm d\'alt. Quant fa cada part?', 10, null, 'cm', '60 : 6 = 10 cm cada part', 'Reparteix 60 entre 6 parts.'),
      st('I la franja blava?', 20, null, 'cm', '2 parts: 20 cm de blau', 'La blava són 2 parts de 10 cm.')], 'La bandera de Tailàndia, on s\'acaba el viatge per les proporcions.')
  ] },
  { name: 'Cossos', ico: '🧊', sub: 'Cares, arestes i vèrtexs: fes-los girar amb el dit.', levels: [
    ask('El cub', { t: 'solid', id: 'cub' }, [st('Quantes cares té un cub?', C('cub').f, [4, 6, 8], '', 'Un cub té 6 cares, totes quadrades', 'Pensa en un dau: quants números té?')], 'Benvingut a Oceania! Aquí tot té tres dimensions. Arrossega el cos per fer-lo girar.'),
    ask('Rodar', { t: 'text', html: '?', cap: 'toca el cos que busques' }, [st('Quin d\'aquests cossos pot rodar cap a tots els costats?', 'esfera', ['cub', 'esfera', 'piramide'], '', "L'esfera roda cap on vulgui: no té cap cara plana", 'Quin no té cap cara plana ni cap punta?', 'solid')], 'Hi ha cossos de cares planes i cossos rodons.'),
    ask('La piràmide', { t: 'solid', id: 'piramide' }, [st('Quants vèrtexs (puntes) té aquesta piràmide?', C('piramide').v, [4, 5, 8], '', '5 vèrtexs: 4 a baix i 1 a dalt', 'Fes-la girar: compta les 4 puntes de la base i la de dalt.')], 'Les piràmides d\'Egipte tenen la base quadrada.'),
    ask('Les arestes', { t: 'solid', id: 'cub' }, [st('Una aresta és la ratlla on es troben dues cares. Quantes arestes té un cub?', C('cub').e, [8, 10, 12], '', '12 arestes: 4 a dalt, 4 a baix i 4 de dretes', 'Compta les 4 de dalt, les 4 de baix i les 4 que les uneixen.')], 'Cares, vèrtexs i arestes: les tres coses que es compten en un cos.'),
    ask('La tenda', { t: 'solid', id: 'prisma3' }, [st('Quantes cares té aquest prisma triangular?', C('prisma3').f, [3, 5, 6], '', '5 cares: 2 triangles i 3 rectangles', 'Fes-lo girar: 2 triangles a les puntes i 3 rectangles al voltant.')], 'Un prisma té dues bases iguals, una a cada punta. Aquest sembla una tenda de campanya.'),
    ask('La llauna', { t: 'solid', id: 'cilindre' }, [st('Com es diu aquest cos, que té la forma d\'una llauna?', 'cilindre', ['con', 'cilindre', 'esfera'], '', 'És un cilindre: dos cercles i una cara corbada', 'El con acaba en punta, i l\'esfera és una pilota.')], 'Un cos rodó, però amb dues cares planes.'),
    ask('Cara a cara', { t: 'solid', id: 'piramide' }, [
      st('Quina forma tenen les cares dels costats de la piràmide?', 'triangle', ['triangle', 'quadrat', 'rectangle'], '', 'Les cares dels costats són triangles', 'Totes acaben en punta, a dalt.'),
      st('I la base?', 'quadrat', ['triangle', 'quadrat', 'cercle'], '', 'I la base és un quadrat', 'Gira-la i mira-la per sota.')], 'Les cares d\'un cos són figures planes.'),
    ask('El llapis', { t: 'solid', id: 'prisma6' }, [
      st('Quants vèrtexs té aquest prisma hexagonal?', C('prisma6').v, null, '', '6 a dalt i 6 a baix: 12 vèrtexs', 'Cada hexàgon té 6 puntes, i n\'hi ha dos.'),
      st('I quantes arestes?', C('prisma6').e, null, '', '6 + 6 + 6 = 18 arestes', '6 a dalt, 6 a baix i 6 de dretes.')], 'Un llapis sense punta és un prisma hexagonal. Ara s\'escriu amb les tecles.'),
    ask('El tetraedre', { t: 'solid', id: 'tetra' }, [
      st('Quantes cares té un tetraedre?', C('tetra').f, null, '', '4 cares, totes triangles', 'Compta la base i les 3 dels costats.'),
      st('Quants vèrtexs?', C('tetra').v, null, '', '4 vèrtexs', '3 a la base i 1 a dalt.'),
      st('I quantes arestes?', C('tetra').e, null, '', '6 arestes', '3 a la base i 3 que pugen.')], 'El tetraedre és la piràmide més petita que hi ha: tot són triangles.'),
    ask('El número màgic', { t: 'solid', id: 'cub' }, [
      st('Un cub té 6 cares, 8 vèrtexs i 12 arestes. Quant fa cares + vèrtexs − arestes?', 2, null, '', 'Cub: 6 + 8 − 12 = 2', '6 + 8 = 14. I ara treu-ne 12.'),
      st('La piràmide té 5 cares, 5 vèrtexs i 8 arestes. Quant fa ara?', 2, null, '', 'Piràmide: 5 + 5 − 8 = 2. Sempre 2!', '5 + 5 = 10. I ara treu-ne 8.')], 'Un secret que va trobar un matemàtic que es deia Euler fa gairebé 300 anys.')
  ] },
  { name: 'Policubs', ico: '🏆', sub: 'Construeix amb cubs: el podi, les vistes i el volum.', levels: [
    ask('El podi', { t: 'cubes', h: PODIUM }, [st('Quants cubs calen per fer aquest podi?', 6, [5, 6, 7], 'cubs', '2 + 3 + 1 = 6 cubs', 'Compta cada torre: la de plata, la d\'or i la de bronze.')], 'El podi dels Jocs: l\'or al mig i més amunt, la plata a un costat i el bronze a l\'altre.'),
    build('Fes el podi', 'Construeix el <b>podi</b> del model.', 3, { h: PODIUM }, [[0, 0, 0], [2, 3, 1], [0, 0, 0]], 'Toca una casella del terra per apilar-hi un cub. Si et passes, segueix tocant i torna a zero.', 'Tres torres en fila: de 2, de 3 i d\'1 cub.', PODIUM),
    ask('El cub amagat', { t: 'cubes', h: [[2, 2], [2, 1]] }, [st('Quants cubs hi ha? Compte, que n\'hi ha que no es veuen!', 7, [6, 7, 8], 'cubs', '2 + 2 + 2 + 1 = 7 cubs', 'Hi ha 4 torres: tres de 2 cubs i una d\'1.')], 'Els cubs de sota i de darrere també hi són, encara que no es vegin.'),
    ask('De cara', { t: 'cubes', h: PODIUM }, [st('Si mires el podi de cara, des de la fletxa «davant», què veus?', '231', ['132', '231', '321'], '', 'De cara es veuen torres de 2, 3 i 1', 'D\'esquerra a dreta: primer la torre de 2, després la de 3 i al final la d\'1.', 'view')], 'Una vista és el que es veu mirant de cara, sense fondària: només quadrats.'),
    build('Les dues vistes', 'Fes una construcció que tingui aquestes <b>dues vistes</b>.', 3, { front: [1, 3, 2], side: [1, 3] }, [[1, 3, 2], [1, 0, 0], [0, 0, 0]], 'Com una arquitecta: de davant s\'han de veure torres d\'1, 3 i 2; i de costat, d\'1 i 3.', 'Fes al fons una fila amb torres d\'1, 3 i 2. Després posa 1 sol cub al davant de tot.'),
    ask('El volum', { t: 'cubes', h: [[2, 2, 2], [2, 2, 2]] }, [st('El volum és quants cubs hi caben. Quin volum té aquesta capsa?', 12, null, 'cubs', '3 × 2 × 2 = 12 cubs', 'A cada pis n\'hi ha 3 × 2 = 6, i hi ha 2 pisos.')], 'El perímetre es mesura en ratlles, l\'àrea en quadrets i el volum en cubs.'),
    build('El prisma', 'Construeix un prisma de <b>3 × 2 × 2</b> cubs.', 3, { box: [3, 2, 2] }, [[2, 2, 2], [2, 2, 2], [0, 0, 0]], 'Tres de llarg, dos d\'ample i dos d\'alt.', 'Fes un rectangle de 3 × 2 caselles, i posa 2 cubs a cada una.'),
    ask('Desplegat', { t: 'text', html: '6', cap: 'un cub té 6 cares' }, [st('Quin d\'aquests retallables es pot plegar i fer un cub?', 'creu', ['fila', 'creu', 'bloc'], '', 'La creu es plega i fa un cub', 'Un cub necessita 4 cares que facin la volta, una tapa i un fons.', 'net')], 'Un cub de cartró, obert i aplanat, és un desplegament: sis quadrats enganxats.'),
    ask('Un de difícil', { t: 'text', html: '6', cap: 'plega\'ls amb el cap' }, [st('I d\'aquests, quin es plega i fa un cub?', 'escala', ['pe', 'escala', 'banc'], '', "L'escala es plega i fa un cub", 'Un té 4 quadrats fent un bloc, que no es pot plegar. Un altre té les dues tapes al mateix costat.', 'net')], 'Hi ha 11 desplegaments diferents del cub. No tots són una creu!'),
    ask('La gran capsa', { t: 'cubes', h: [[2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2]] }, [
      st('Quants cubs hi ha al pis de baix?', 12, null, 'cubs', 'Un pis: 4 × 3 = 12 cubs', 'El pis fa 4 de llarg i 3 d\'ample.'),
      st('I en total, amb els dos pisos?', 24, null, 'cubs', '12 × 2 = 24 cubs', 'Dos pisos de 12.'),
      st('Quants cubs calen per fer un cub gran de 3 × 3 × 3?', 27, null, 'cubs', '3 × 3 × 3 = 27 cubs', 'Cada pis en té 3 × 3 = 9, i hi ha 3 pisos.')], 'L\'última parada de la volta al món: llarg per ample per alt.')
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- medals ---------- */
// 3 is gold (no slip), 2 silver (one or two) and 1 bronze
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
export const MEDALS = ['', 'bronze', 'plata', 'or'];

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the other games: a Piscina to get in, a map of five circles (the five rings, a
// continent each), a mark for each project, an exam for each circle, XP and badges. A project is one of the sections above
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Europa', what: 'Formes planes', projects: [0, 1] },
  { name: 'Àfrica', what: 'Mesurar', projects: [2, 3] },
  { name: 'Àsia', what: 'Miralls i girs', projects: [4, 5] },
  { name: 'Amèrica', what: 'Orientar-se', projects: [6, 7] },
  { name: 'Oceania', what: 'Tres dimensions', projects: [8, 9] }
];
export const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
// the three challenges of the Piscina: a shape to touch among three
export const POOL = [
  { q: 'Toca el <b>triangle</b>: la forma de 3 costats.', opts: ['sq', 'tri', 'circ'], want: 'tri', as: 'shape', fact: 'Un triangle té 3 costats i 3 vèrtexs.' },
  { q: 'Toca la forma que <b>no té cap costat</b>.', opts: ['circ', 'pent', 'rect'], want: 'circ', as: 'shape', fact: 'El cercle no té cap costat ni cap vèrtex.' },
  { q: 'Toca el <b>cub</b>: el cos amb 6 cares quadrades.', opts: ['piramide', 'cilindre', 'cub'], want: 'cub', as: 'solid', fact: 'Un cub és com un dau.' }
];
// the ten levels of a project are three exercises: ex00 (three levels), ex01 (three) and ex02 (four)
export const exOf = idx => idx < 3 ? 0 : idx < 6 ? 1 : 2;
// What a level gives to the mark of its project, by its medal: 10 for gold, 8 for silver, 5 for bronze. Ten levels make 100,
// and a project is validated with 80
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;

// What is saved is facts only: { so, stars[100], piscina, exams[5], fulls, rapid }. stars is the best medal of each level and rapid
// the most right answers in a lightning round. Marks, XP, level, medals and badges are worked out, never stored.
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// A complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  return { so: o.so !== false, stars: slots(o.stars, LEVELS.length).map(s => within(s, 3)), piscina: o.piscina === true, exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), rapid: Math.max(0, whole(o.rapid)) };
}
const copy = p => ({ ...p, stars: p.stars.slice(), exams: p.exams.slice() });
// the functions below take a progress that is already clean
export const noteOf = (p, i) => p.stars.slice(i * 10, i * 10 + 10).reduce((s, n) => s + POINTS[n], 0);
// how many levels of a project are done from the first on: the one after them is the next to open
export const reached = (p, i) => { const k = p.stars.slice(i * 10, i * 10 + 10).findIndex(n => n === 0); return k < 0 ? 10 : k; };
export const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
// how many gold, silver and bronze medals there are
export const medals = p => [3, 2, 1].map(m => p.stars.filter(s => s === m).length);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 1600 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 10,67
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina and the others with the exam before them
export const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
export const RAPID = 60, RAPID_BADGE = 12;
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer segell', what: 'Valida un projecte.' },
  { name: 'Deu ors', what: 'Guanya 10 medalles d\'or.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ull de falcó', what: 'Troba bé les errades d\'un full.' },
  { name: 'Llampec', what: `Encerta ${RAPID_BADGE} preguntes en un repte llampec.` },
  { name: 'Tres anelles', what: 'Supera tres exàmens.' },
  { name: 'Passaport ple', what: 'Valida els deu projectes.' },
  { name: 'Cinquanta ors', what: 'Guanya 50 medalles d\'or.' },
  { name: 'La volta al món', what: 'Supera els cinc exàmens.' }
];
export const badges = p => [p.piscina === true, validated(p).length > 0, medals(p)[0] >= 10, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 1, p.rapid >= RAPID_BADGE,
  p.exams.filter(Boolean).length >= 3, validated(p).length === PROJECTS.length, medals(p)[0] >= 50, p.exams.every(e => e === true)];
const earned = (p, next) => { const had = badges(p), now = badges(next); return BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name); };

// The Piscina done. Returns { prog, news }
export function poolIn(p) { const next = { ...copy(p), piscina: true }; return { prog: next, news: earned(p, next) }; }
// A level done, with its slips (a hint is a slip too). Returns { prog, n, note, gain, valid, exam, news }: prog is a NEW progress
// that keeps the best medal of the level; n the medal of this time; note the mark of the project after it; gain the XP it adds;
// valid whether the project is validated by this very level, and exam whether that opens the exam of its circle; news the badges it earns
export function levelIn(p, i, idx, slips) {
  const n = starsFor(slips), k = i * 10 + idx, next = copy(p), c = circleOf(i);
  next.stars[k] = Math.max(next.stars[k], n);
  return { prog: next, n, note: noteOf(next, i), gain: xpOf(next) - xpOf(p), valid: noteOf(p, i) < VALID && noteOf(next, i) >= VALID,
    exam: !examOpen(p, c) && examOpen(next, c), news: earned(p, next) };
}
// the right answers of a lightning round: the best is kept. Returns { prog, best, news }
export function rapidIn(p, n) { const next = copy(p), best = whole(n) > p.rapid; if (best) next.rapid = whole(n); return { prog: next, best, news: earned(p, next) }; }

/* ---------- the exam, «Caça l'errada» and the lightning round ---------- */
// Chance enters only through rnd (a function like Math.random). A whole number below n, clamped
const at = (n, rnd) => Math.min(n - 1, Math.max(0, Math.floor(rnd() * n) || 0));
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
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
// The hand-in of a finished exam: qs its six questions and run one boolean per question. Returns { prog, good, score, gain, redo, news }:
// prog is a NEW progress with exams[c] set when the exam passes (EXAM_PASS of 6, the exam open), never taken back; redo the projects of the questions missed
export function examIn(p, c, qs, run) {
  const score = run.filter(r => r === true).length, good = run.length === 6 && score >= EXAM_PASS && examOpen(p, c), next = copy(p);
  if (good) next.exams[c] = true;
  return { prog: next, good, score, gain: xpOf(next) - xpOf(p), news: earned(p, next),
    redo: [...new Set(qs.flatMap((q, i) => run[i] !== true && Number.isInteger(q?.p) ? [q.p] : []))].sort((a, b) => a - b) };
}

// The five things a sheet can say, each { kind, says, real, opts, ... }: says is the value written on the sheet, real the true one
// (the claim is wrong when they differ) and opts the values to choose from when fixing it. The mistakes are the ones that teach:
// a perimeter that is the area or only half the way round, an area that is the perimeter, the corners of a solid taken for its
// faces, a triangle whose angles add up to a whole turn, and an area that only doubles when the sides do.
const three = a => [...new Set(a.filter(v => v > 0))].slice(0, 3).sort((x, y) => x - y);
const FACETS = { f: 'cares', v: 'vèrtexs', e: 'arestes' };
const CLAIM = {
  perim(bad, rnd) {
    const a = 4 + at(5, rnd), b = 2 + at(3, rnd), real = 2 * (a + b), wrong = [a * b, a + b][at(2, rnd)], says = !bad ? real : wrong !== real ? wrong : a + b;
    return { a, b, says, real, opts: three([says, real, a + b, a * b, real + 2]) };
  },
  area(bad, rnd) {
    const a = 4 + at(5, rnd), b = 2 + at(3, rnd), real = a * b, wrong = [2 * (a + b), a + b][at(2, rnd)], says = !bad ? real : wrong !== real ? wrong : a + b;
    return { a, b, says, real, opts: three([says, real, 2 * (a + b), a + b, real + a]) };
  },
  solid(bad, rnd) {
    const id = ['cub', 'piramide', 'prisma3', 'prisma6'][at(4, rnd)], what = 'fve'[at(3, rnd)], n = count(id), real = n[what], others = [...'fve'].map(k => n[k]).filter(v => v !== real);
    const says = bad ? others[at(others.length, rnd)] : real;
    return { id, what, says, real, opts: three([says, real, ...others, real + 2]) };
  },
  tri(bad, rnd) {
    const a = [90, 60, 70, 50, 80][at(5, rnd)], b = [30, 40, 20, 45, 60][at(5, rnd)], real = 180 - a - b, says = bad ? [360 - a - b, real + 10][at(2, rnd)] : real;
    return { a, b, says, real, opts: three([says, real, real + 10, 360 - a - b, real - 10]) };
  },
  scale(bad, rnd) {
    const a = 2 + at(3, rnd), b = 1 + at(2, rnd), k = 2 + at(2, rnd), area = a * b, real = area * k * k, says = bad ? area * k : real;
    return { a, b, k, area, says, real, opts: three([says, real, area * k, area * k * 2, real + area]) };
  }
};
export const KINDS = Object.keys(CLAIM);
export const facet = k => FACETS[k];
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
// The hand-in of a finished sheet: run has one boolean per claim. Returns { prog, good, gain, missed, news }: prog is a NEW progress
// with fulls + 1 only when all three are right; gain the XP that adds (0 once the cap of 3 per validated project is reached)
export function sheetIn(p, run) {
  const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3, next = copy(p);
  if (good) next.fulls = p.fulls + 1;
  return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: earned(p, next) };
}

// One question of the lightning round: { q, want, opts }, three numbers to choose from
const POLYS = [['un triangle', 3], ['un quadrat', 4], ['un pentàgon', 5], ['un hexàgon', 6], ['un octàgon', 8]];
const TURNS = [['Un angle recte', 90], ['Mitja volta', 180], ['Una volta sencera', 360], ['Un quart de volta', 90], ['Tres quarts de volta', 270]];
export function quick(rnd) {
  const k = at(6, rnd), a = 3 + at(6, rnd), b = 2 + at(4, rnd);
  let q, want, alt;
  if (k === 0) { const [n, s] = POLYS[at(POLYS.length, rnd)]; q = `Costats d'${n}`; want = s; alt = [s + 1, s - 1, s + 2]; }
  else if (k === 1) { q = `Perímetre d'un rectangle de ${a} × ${b}`; want = 2 * (a + b); alt = [a * b, a + b, want + 2]; }
  else if (k === 2) { q = `Àrea d'un rectangle de ${a} × ${b}`; want = a * b; alt = [2 * (a + b), a + b, want + a]; }
  else if (k === 3) { const id = ['cub', 'piramide', 'prisma3'][at(3, rnd)], what = 'fve'[at(3, rnd)], n = count(id); q = `${FACETS[what][0].toUpperCase() + FACETS[what].slice(1)} ${SOLIDS[id].of}`; want = n[what]; alt = [n.f, n.v, n.e, want + 1, want + 2]; }
  else if (k === 4) { const [n, d] = TURNS[at(TURNS.length, rnd)]; q = `${n}: quants graus?`; want = d; alt = shuffle([45, 90, 180, 270, 360], rnd); }
  else { const x = [90, 60, 70, 50][at(4, rnd)], y = [30, 40, 20, 60][at(4, rnd)]; q = `Un triangle té angles de ${x}° i ${y}°. I el tercer?`; want = 180 - x - y; alt = [want + 10, want - 10, 360 - x - y]; }
  return { q, want, opts: three([want, ...alt.filter(v => v !== want)]) };
}
