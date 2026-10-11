// Chess, moved by its coordinates: the child plays white and every move is typed as the name of a square, never dragged.
// A square is its letter and its number ('e4'); inside, [file, rank] from 0. A position is { at, stars, rocks }: at holds the
// pieces by square (capitals are white, K Q R B N P), stars the squares to collect and rocks the squares nothing can cross.
export const FILES = 'abcdefgh';
export const sq = (f, r) => FILES[f] + (r + 1);
export const fr = s => [FILES.indexOf(s[0]), +s[1] - 1];
export const isSq = s => /^[a-h][1-8]$/.test(s);
// a1 is dark: a square is dark when its letter (a = 1) plus its number is even
export const dark = s => { const [f, r] = fr(s); return (f + r) % 2 === 0; };
// how many letters and how many numbers a move changes
export const delta = (a, b) => { const [f, r] = fr(a), [g, s] = fr(b); return [g - f, s - r]; };
export const white = p => p === p.toUpperCase();
export const VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
// 'Rb2 pf6 *b6 #c3': a white rook, a black pawn, a star and a rock
export function parse(text) {
  const at = {}, stars = [], rocks = [];
  for (const w of text.split(' ').filter(Boolean)) { const s = w.slice(1); if (w[0] === '*') stars.push(s); else if (w[0] === '#') rocks.push(s); else at[s] = w[0]; }
  return { at, stars, rocks };
}
const lone = (t, s) => ({ at: { [s]: t }, stars: [], rocks: [] });

/* ---------- the rules ---------- */
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]], BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]], ALL = [...ROOK, ...BISHOP];
const JUMPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const on = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
// Where the piece on `from` can go, its own king's safety aside. hits gives the squares it attacks instead: a pawn's two
// diagonals, and for the others the squares of their own pieces too (those are defended)
export function reach(pos, from, hits = false) {
  const p = pos.at[from], t = p.toUpperCase(), w = white(p), [f, r] = fr(from), out = [];
  const free = s => !pos.at[s] && !pos.rocks.includes(s), foe = s => !!pos.at[s] && white(pos.at[s]) !== w;
  if (t === 'P') {
    const d = w ? 1 : -1;
    for (const k of [-1, 1]) if (on(f + k, r + d)) { const s = sq(f + k, r + d); if (hits || foe(s)) out.push(s); }
    if (!hits && on(f, r + d) && free(sq(f, r + d))) { out.push(sq(f, r + d)); if (r === (w ? 1 : 6) && free(sq(f, r + 2 * d))) out.push(sq(f, r + 2 * d)); }
    return out;
  }
  const far = 'RBQ'.includes(t);
  for (const [df, dr] of t === 'N' ? JUMPS : t === 'R' ? ROOK : t === 'B' ? BISHOP : ALL) for (let g = f + df, s = r + dr; on(g, s); g += df, s += dr) {
    const x = sq(g, s);
    if (pos.rocks.includes(x)) break;
    if (free(x) || foe(x) || hits) out.push(x);
    if (!free(x) || !far) break;
  }
  return out;
}
// whether a piece that is not a pawn moves like that on an empty board
export function fits(t, df, dr) {
  const a = Math.abs(df), b = Math.abs(dr);
  return t === 'R' ? (a === 0) !== (b === 0) : t === 'B' ? a === b && a > 0 : t === 'Q' ? a + b > 0 && (a === b || a === 0 || b === 0) : t === 'K' ? Math.max(a, b) === 1 : t === 'N' && a * b === 2;
}
// the position after a move; a pawn that gets to the last row is a queen
export function move(pos, from, to) {
  const at = { ...pos.at }, p = at[from];
  delete at[from]; at[to] = p === 'P' && to[1] === '8' ? 'Q' : p === 'p' && to[1] === '1' ? 'q' : p;
  return { at, rocks: pos.rocks, stars: pos.stars.filter(s => s !== to) };
}
const side = (pos, w) => Object.keys(pos.at).filter(s => white(pos.at[s]) === w);
export const kingOf = (pos, w) => Object.keys(pos.at).find(s => pos.at[s] === (w ? 'K' : 'k'));
// the square of a piece of that colour that attacks s, if there is one
export const attackerOf = (pos, s, byWhite) => side(pos, byWhite).find(x => reach(pos, x, true).includes(s));
export const inCheck = (pos, w) => { const k = kingOf(pos, w); return !!k && !!attackerOf(pos, k, !w); };
// A move tried. { ok, pos, took, star } when it can be played: the position after it, the piece it captures and whether it lands on a star.
// Otherwise { code } says why not: 'same', 'rock', 'own', 'shape' (the piece does not move like that), 'block' (something at `at` is in the way),
// 'pblock' 'pdiag' 'pshape' for a pawn, 'check' (its own king would be attacked by the piece at `by`) and, with safe, 'guard' (the piece
// would be captured there by the one at `by`)
export function judge(pos, from, to, safe = false) {
  const p = pos.at[from], t = p.toUpperCase(), w = white(p), [df, dr] = delta(from, to), x = pos.at[to];
  if (from === to) return { code: 'same' };
  if (pos.rocks.includes(to)) return { code: 'rock' };
  if (x && white(x) === w) return { code: 'own' };
  if (!reach(pos, from).includes(to)) {
    const d = w ? 1 : -1;
    if (t === 'P') return { code: df === 0 && (dr === d || (dr === 2 * d && fr(from)[1] === (w ? 1 : 6))) ? 'pblock' : Math.abs(df) === 1 && dr === d ? 'pdiag' : 'pshape' };
    if (!fits(t, df, dr)) return { code: 'shape' };
    for (let [f, r] = fr(from); ;) { f += Math.sign(df); r += Math.sign(dr); const s = sq(f, r); if (s === to || !on(f, r)) return { code: 'shape' }; if (pos.at[s] || pos.rocks.includes(s)) return { code: 'block', at: s }; }
  }
  const next = move(pos, from, to);
  if (inCheck(next, w)) return { code: 'check', by: attackerOf(next, kingOf(next, w), !w) };
  if (safe && t !== 'K') { const by = attackerOf(next, to, !w); if (by) return { code: 'guard', by }; }
  return { ok: true, pos: next, took: x || null, star: pos.stars.includes(to) };
}
// every move a side can play, as [from, to]
export const all = (pos, w) => side(pos, w).flatMap(from => reach(pos, from).filter(to => judge(pos, from, to).ok).map(to => [from, to]));
export const mate = (pos, w) => inCheck(pos, w) && !all(pos, w).length;
// the white moves that mate at once
export const mates = pos => all(pos, true).filter(([a, b]) => mate(move(pos, a, b), false));
// Every capture white has and what it is worth: won is the value of the piece taken, lost that of the piece that takes it when it can be
// taken back, gain the difference. The best one first
export function gains(pos) {
  return all(pos, true).filter(([, to]) => pos.at[to]).map(([from, to]) => {
    const by = attackerOf(move(pos, from, to), to, false), won = VALUE[pos.at[to].toUpperCase()], lost = by ? VALUE[pos.at[from]] : 0;
    return { from, to, by, won, lost, gain: won - lost };
  }).sort((a, b) => b.gain - a.gain);
}

/* ---------- levels ---------- */
// Nine projects of ten levels. t says what a level asks:
//   'sq'     asks, one square each: ['cross', s] the square named, ['star', s] the square of the star, ['blind', s] the same with no letters
//            or numbers round the board, ['step', s, df, dr] the square that many letters and numbers away from s
//   'reach'  n different squares the piece can go to (all of them when n is left out)
//   'go'     collect every star in max moves at most; 'take' capture every black piece in max moves. Black never moves. safe: the piece
//            must not land where a black piece would capture it
//   'best'   the capture that wins most points
//   'check'  a check that does not lose the piece; 'mate' mate in one
// tip is what the level teaches, said before its first question
const S = (tip, ...asks) => ({ t: 'sq', asks, tip });
const W = (pos, n, tip) => ({ t: 'reach', pos, n, tip });
const G = (pos, max, tip, safe = false) => ({ t: 'go', pos, max, tip, safe });
const T = (pos, max, tip, safe = false) => ({ t: 'take', pos, max, tip, safe });
const M = (t, pos, tip) => ({ t, pos, tip });
export const PROJECTS = [
  { name: 'El mapa del tauler', sub: 'Cada casella té nom: lletra i número', levels: [
    S('Cada casella té nom i cognom: la lletra de la seva columna i el número de la seva fila.', ['cross', 'a1'], ['cross', 'c2'], ['cross', 'e4']),
    S('Primer la lletra, després el número. Mira com s\'encenen la columna i la fila mentre escrius.', ['cross', 'h8'], ['cross', 'b7'], ['cross', 'g3'], ['cross', 'd5']),
    S('Ara al revés: tu poses el nom.', ['star', 'b3'], ['star', 'f2'], ['star', 'd6']),
    S('Baixa amb el dit fins a la lletra i ves cap a l\'esquerra fins al número.', ['star', 'h1'], ['star', 'a8'], ['star', 'e5'], ['star', 'c7']),
    S('Les lletres també es compten: a, b, c... Un pas a la dreta és una lletra més; un pas amunt, un número més.', ['step', 'b2', 3, 0], ['step', 'd1', 0, 4], ['step', 'a1', 2, 2]),
    S('I cap enrere es resta: a l\'esquerra, lletres menys; avall, números menys.', ['step', 'f6', -2, 0], ['step', 'e7', 0, -3], ['step', 'g5', -3, -2], ['step', 'h8', -7, -7]),
    S('S\'han esborrat les lletres i els números! Compta les columnes (a, b, c...) i les files (1, 2, 3...).', ['blind', 'c3'], ['blind', 'f2'], ['blind', 'e6']),
    S('Tot barrejat: suma cap a la dreta i amunt, resta cap a l\'esquerra i avall.', ['step', 'c4', 4, -2], ['step', 'b7', 1, -5], ['step', 'h3', -6, 4], ['star', 'g7']),
    S('Sense lletres ni números, i amb passos llargs.', ['blind', 'g7'], ['blind', 'b5'], ['step', 'd4', -3, 3], ['step', 'e1', 3, 6]),
    S('L\'última prova del mapa: de tot una mica.', ['star', 'c6'], ['blind', 'a4'], ['step', 'a8', 5, -5], ['step', 'f2', -4, 5], ['blind', 'e8'])
  ] },
  { name: 'La torre', sub: 'En línia recta: o la lletra o el número', levels: [
    W('Rd4', 4, 'La torre va en línia recta: amunt, avall o de costat, tan lluny com vulgui.'),
    W('Ra1', 6, 'Fixa\'t en el comptador: quan la torre es mou, o canvia la lletra o canvia el número. Mai tots dos.'),
    G('Rb2 *b6', 1, 'Ara mou-la tu: escriu la casella on ha d\'anar i prem ✓.'),
    G('Rb2 *b6 *f6', 2),
    G('Ra1 *h8', 2, 'D\'un sol cop no hi arriba: la lletra i el número canvien tots dos. Fes-ho en dos moviments.'),
    G('Rc3 *c7 *g7 *g2', 3),
    G('Ra1 #a4 *a8', 3, 'La torre no salta: la pedra li tapa el camí. Busca la volta.'),
    T('Rd4 pd7 ph7', 2, 'Per capturar una peça negra, la torre va a la seva casella.'),
    G('Re1 be5 *e8', 2, 'L\'alfil negre tapa el camí... però les peces negres es poden capturar.'),
    G('Ra1 nf2 bd7 *h4', 3, 'Compte! No deixis la torre en una casella que ataqui una peça negra.', true)
  ] },
  { name: "L'alfil", sub: 'En diagonal: lletra i número canvien igual', levels: [
    W('Bd4', 4, "L'alfil va en diagonal, tan lluny com vulgui."),
    W('Bc1', 5, "Mira el comptador: en una diagonal, la lletra i el número canvien sempre el mateix nombre de passos."),
    G('Bc1 *g5', 1),
    G('Bc1 *a3 *f8', 2),
    G('Bf1 *a6 *c8', 2),
    G('Bd4 *a7 *g7', 3, "Un alfil no canvia mai de color: si surt d'una casella fosca, sempre trepitja fosques."),
    G('Bc1 #e3 *g5', 3, "L'alfil tampoc salta. Hi ha un altre camí en diagonal?"),
    T('Bf1 pb5 pe8', 2),
    G('Bc1 ne2 *h6 *a3', 3, 'Vigila on et quedes: el cavall negre ataca fent el salt en L.', true),
    G('Bc1 *e3 *b6 *f8 *h6', 5, 'Totes les estrelles són en caselles fosques, com la teva. Troba l\'ordre bo.')
  ] },
  { name: 'La dama', sub: "Com la torre i com l'alfil alhora", levels: [
    W('Qd4', 6, "La dama es mou com la torre i com l'alfil: és la peça més poderosa."),
    W('Qa1', 8, 'Rectes i diagonals. Troba\'n de totes dues menes!'),
    G('Qd1 *d8 *h4', 2),
    G('Qa1 *h8 *h1 *a8', 3),
    G('Qd4 *a7 *g7 *g1', 3),
    G('Qd1 #d4 #f3 #b3 *d8', 3, 'Ni la dama pot saltar per sobre de les pedres.'),
    T('Qe4 pb7 ph7 pe8', 4),
    G('Qa1 re5 pf6 *h8', 2, 'La torre negra tapa la diagonal, i el peó la protegeix: capturar-la sortiria molt car.', true),
    T('Qd1 pd7 pa4 pg4', 3),
    G('Qd1 nd5 pc6 *a4 *h5', 3, 'El cavall negre està protegit pel peó, i el peó tapa una diagonal. Busca un camí segur.', true)
  ] },
  { name: 'El rei', sub: 'Un sol pas, cap a qualsevol costat', levels: [
    W('Ke4', 0, 'El rei fa un sol pas, cap a qualsevol costat: la lletra i el número canvien 1 com a màxim.'),
    W('Ka1', 0, 'A la cantonada el rei té menys lloc. Quantes caselles li queden?'),
    G('Ke1 *e4', 3),
    G('Kb2 *e5', 3, 'En diagonal el rei avança una lletra i un número de cop.'),
    G('Kb2 *f4', 4, 'Quants passos li calen? Mira quin dels dos canvis és més gran: la lletra en canvia 4 i el número 2.'),
    G('Kd4 *d6 *f6 *f4', 6),
    T('Kd3 pd5 pf4', 4, 'El rei no pot trepitjar mai una casella atacada. Els peons negres ataquen en diagonal cap avall.'),
    G('Kb1 rd8 #d2 *f1', 4, 'La torre negra vigila tota la columna d... fins a la pedra.'),
    G('Ka1 bc4 *e1', 4, "L'alfil negre vigila les seves diagonals: el rei no hi pot posar el peu."),
    T('Ke1 ne3 pc3', 4, 'El rei també captura, si la peça no està protegida.')
  ] },
  { name: 'El cavall', sub: 'El salt en L: un 2 i un 1', levels: [
    W('Nd4', 4, 'El cavall salta en L: dues caselles rectes i una de costat. Al comptador sempre hi surt un 2 i un 1.'),
    W('Na1', 0, 'A la cantonada, el cavall quasi no té salts. Troba\'ls tots!'),
    W('Ne5', 0, 'Des del mig del tauler en té vuit. Troba\'ls tots!'),
    G('Nb1 *c3', 1),
    G('Nb1 *d2 *f3', 2),
    G('Ng1 #f1 #f2 #g2 #h2 #h1 *e5', 2, 'El cavall és l\'única peça que salta per sobre de tot.'),
    G('Na1 *c1 *e2', 3, 'Cada salt canvia el color de la casella: de fosca a clara, de clara a fosca.'),
    T('Ne4 pf6 pd5 pb4', 3),
    G('Nd4 *d5', 3, 'Tan a prop i tan lluny! Per anar a la casella del costat, el cavall necessita tres salts.'),
    G('Nb1 rd5 *f4 *h3', 4, 'No aterris a la fila ni a la columna de la torre negra... si no és per capturar-la.', true)
  ] },
  { name: 'El peó', sub: 'Sempre endavant; captura en diagonal', levels: [
    W('Pe2', 0, 'El peó camina recte i mai recula. Des de la fila 2 pot fer un pas o dos.'),
    W('Pc4', 0, 'Fora de la fila 2, el peó només fa un pas: la mateixa lletra i el número +1.'),
    G('Pd2 *d5', 2),
    T('Pe4 pd5', 1, 'El peó captura diferent de com camina: en diagonal, una casella endavant.'),
    G('Pe4 pe5 pf5 *f6', 2, 'Amb una peça al davant, el peó està bloquejat. Però potser pot capturar...'),
    G('Pb6 *b8', 2, 'Quan un peó arriba a la fila 8, es corona: es converteix en dama!'),
    G('Pa7 nb8 *h2', 2),
    G('Pc2 Pf2 *c4 *f3', 2, 'Ara tens dos peons: escriu primer la casella d\'on surt la peça i després on va.'),
    T('Pd4 pe5 pf6 pg7', 3, 'Una escala de captures. Quina fila toca cada vegada?'),
    G('Pg6 nf7 rh7 *e8', 3, 'Corona el peó i fes servir la dama nova.')
  ] },
  { name: 'Caçadors', sub: 'Quants punts val cada peça', levels: [
    M('best', 'Rd4 pd7 nh4', 'Cada peça val uns punts: peó 1, cavall 3, alfil 3, torre 5 i dama 9.'),
    M('best', 'Qd1 rd8 ba4 ph5'),
    M('best', 'Bc1 pa3 ng5 rd2'),
    M('best', 'Qd1 rd6 pe7 nh5', 'Compte: si la peça negra està protegida, et capturaran la teva. Resta el que perds del que guanyes!'),
    M('best', 'Ra1 qa8 kb8 ph1', 'De vegades val la pena perdre una peça: fes la resta.'),
    M('best', 'Nf3 re5 pd6 bh4 pd4'),
    M('best', 'Rd1 Bg2 rd5 pe6', 'Si la peça està protegida, mira amb quina de les teves surts guanyant més.'),
    T('Qd1 pd5 nf6', 4, 'El cavall protegeix el peó. A qui has de capturar primer per no perdre la dama?', true),
    M('best', 'Qe2 Nc3 qa6 pb7 rd5 pc6 be6 pf7'),
    T('Re1 Ng5 be8 pd7 pf7', 4, 'Dos caçadors: tria bé qui captura què, sense perdre cap peça.', true)
  ] },
  { name: 'Escac i mat', sub: 'El rei no té on fugir', levels: [
    M('check', 'Ra1 Kc1 kh8', 'Escac vol dir atacar el rei. Fes escac amb la torre!'),
    M('check', 'Bf1 Kg1 ke8'),
    M('check', 'Ng4 Kg1 kg8'),
    M('mate', 'Ra1 Kg1 kg8 pf7 pg7 ph7', 'Escac i mat: el rei està atacat i no té cap casella on fugir. Els seus propis peons el tanquen!'),
    M('mate', 'Ra7 Rb1 Kc1 kh8', 'Una torre li tanca la fila 7. I l\'altra?'),
    M('mate', 'Kf6 Qa1 kf8', 'El teu rei també ajuda: li tapa les caselles del davant.'),
    M('mate', 'Qh5 Bd3 Kg1 kg8 pf7 pg7 rf8', 'La dama pot acostar-se al rei si una altra peça la protegeix.'),
    M('mate', 'Ne5 Kg1 kh8 rg8 pg7 ph7', 'El rei està ofegat entre les seves peces. Quina peça salta?'),
    M('mate', 'Rd1 Bf6 Kg1 kg8 pf7 ph7'),
    M('mate', 'Kg6 Pa7 kg8', 'Un peó que corona també pot fer mat!')
  ] }
];
for (const P of PROJECTS) for (const L of P.levels) if (L.t === 'reach' && !L.n) { const pos = parse(L.pos); L.n = reach(pos, Object.keys(pos.at)[0]).length; L.all = true; }
export const wantOf = a => a[0] === 'step' ? sq(fr(a[1])[0] + a[2], fr(a[1])[1] + a[3]) : a[1];
// how many things a level asks for: the lane fills by them
export const goals = L => L.t === 'sq' ? L.asks.length : L.t === 'reach' ? L.n : L.t === 'go' ? parse(L.pos).stars.length : L.t === 'take' ? side(parse(L.pos), false).length : 1;
export const done = (L, pos) => L.t === 'take' ? !side(pos, false).length : !pos.stars.length;
const key = pos => Object.keys(pos.at).sort().map(s => s + pos.at[s]).join() + '|' + pos.stars.join();
// the shortest way to finish a 'go' or 'take' level from pos in `left` moves at most, as a list of [from, to]; null when there is none
export function route(L, pos, left) {
  let layer = [{ pos, path: [] }];
  const seen = new Set([key(pos)]);
  for (let d = 0; d <= left && layer.length; d++) {
    const next = [];
    for (const n of layer) {
      if (done(L, n.pos)) return n.path;
      if (d < left) for (const from of side(n.pos, true)) for (const to of reach(n.pos, from)) {
        const j = judge(n.pos, from, to, L.safe);
        if (j.ok && !seen.has(key(j.pos))) { seen.add(key(j.pos)); next.push({ pos: j.pos, path: [...n.path, [from, to]] }); }
      }
    }
    layer = next;
  }
  return null;
}
// white's checks that do not lose the piece
export const checks = pos => all(pos, true).filter(([a, b]) => { const n = move(pos, a, b); return inCheck(n, false) && !attackerOf(n, b, false); });
// slips are wrong answers plus hints asked
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;

/* ---------- quick questions: the Piscina, the exams and the lightning round ---------- */
// Each is answered in one go. kind says what is asked:
//   'name'   the square of the star, typed            'step'   the square d letters and numbers away from `from`, typed
//   'hit'    the only black piece the white one can capture: its square, typed
//   'mate'   the square where the piece on `from` mates, typed
//   'count'  how many squares the piece t can go to from s on an empty board, chosen among opts
//   'tone'   whether s is light or dark, chosen        'val'    what the pieces ps are worth together, chosen
// Chance enters only through rnd (a function like Math.random)
const int = (rnd, lo, hi) => lo + Math.min(hi - lo, Math.floor(rnd() * (hi - lo + 1)));
const at = (n, rnd) => int(rnd, 0, n - 1);
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const rsq = rnd => sq(at(8, rnd), at(8, rnd));
const texts = a => [...new Set(a)].sort((x, y) => x - y).map(String);
export const countOn = (t, s) => reach(lone(t, s), s).length;
export const TONES = ['clara', 'fosca'];
// the mates in one of the exam: the position and the square of the piece that mates
export const MATES = [['Ra1 Kg1 kg8 pf7 pg7 ph7', 'a1'], ['Ra7 Rb1 Kc1 kh8', 'b1'], ['Kf6 Qa1 kf8', 'a1'], ['Qh5 Bd3 Kg1 kg8 pf7 pg7 rf8', 'h5'], ['Ne5 Kg1 kh8 rg8 pg7 ph7', 'e5'],
  ['Rd1 Bf6 Kg1 kg8 pf7 ph7', 'd1'], ['Kg6 Pa7 kg8', 'a7'], ['Kg6 Ra1 kg8', 'a1'], ['Kb6 Qg2 kb8', 'g2'], ['Rh1 Rg7 Kc1 ka8', 'h1'], ['Kc6 Rh1 kc8', 'h1'], ['Qb5 Rb1 Kg1 ka8 pa7', 'b5']];
export const wantQ = q => q.kind === 'step' ? wantOf(['step', q.from, ...q.d]) : q.kind === 'count' ? String(countOn(q.t, q.s)) : q.kind === 'tone' ? TONES[+dark(q.s)]
  : q.kind === 'val' ? String(q.ps.reduce((s, p) => s + VALUE[p], 0)) : q.kind === 'mate' ? mates(parse(q.pos)).find(m => m[0] === q.from)[1] : q.want;
export const rightQ = (q, ans) => q.kind === 'mate' ? mates(parse(q.pos)).some(m => m[0] === q.from && m[1] === ans) : ans === wantQ(q);
function step(rnd) { for (;;) { const from = rsq(rnd), d = delta(from, rsq(rnd)); if (d[0] || d[1]) return { kind: 'step', from, d }; } }
// one black piece the white one can capture and two it cannot; a pawn has one right in front, which it cannot take
function hit(rnd, t) {
  for (;;) {
    const s = t === 'P' ? sq(at(8, rnd), int(rnd, 1, 5)) : rsq(rnd), [f, r] = fr(s);
    const good = t === 'P' ? [f - 1, f + 1].filter(g => g >= 0 && g < 8).map(g => sq(g, r + 1)) : reach(lone(t, s), s);
    const want = good[at(good.length, rnd)], no = new Set([s, ...good]), foes = [want];
    if (t === 'P') foes.push(sq(f, r + 1));
    while (foes.length < 3) { const d = rsq(rnd); if (!no.has(d) && !foes.includes(d)) foes.push(d); }
    return { kind: 'hit', t, pos: [t + s, ...shuffle(foes, rnd).map(d => 'p' + d)].join(' '), want };
  }
}
function count(rnd, t) { const s = rsq(rnd), n = countOn(t, s); return { kind: 'count', t, s, opts: texts(n > 2 ? [n - 2, n, n + 2] : [n, n + 1, n + 2]) }; }
function val(rnd) { const ps = Array.from({ length: int(rnd, 2, 3) }, () => 'PNBRQ'[at(5, rnd)]), w = ps.reduce((s, p) => s + VALUE[p], 0); return { kind: 'val', ps, opts: texts([w - 1, w, w + 2]) }; }
const piece = t => (rnd, i) => i % 2 ? count(rnd, t) : hit(rnd, t);
// one question of each project
const GEN = [
  (rnd, i) => i % 2 ? step(rnd) : { kind: 'name', want: rsq(rnd) },
  piece('R'),
  (rnd, i) => i % 3 === 2 ? { kind: 'tone', s: rsq(rnd), opts: TONES } : piece('B')(rnd, i),
  piece('Q'), piece('K'), piece('N'),
  rnd => hit(rnd, 'P'),
  val,
  rnd => { const [pos, from] = MATES[at(MATES.length, rnd)]; return { kind: 'mate', pos, from }; }
];
// a question of project p that has not come up yet
function draw(p, rnd, i, seen) {
  for (let n = 0; ; n++) { const q = GEN[p](rnd, i), k = JSON.stringify(q); if (n > 200 || !seen.has(k)) { seen.add(k); return { ...q, p }; } }
}

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the other games of the pond: a Piscina to get in, a map of four circles,
// a mark for each project, an exam for each circle, XP and badges.
export const CIRCLES = [
  { name: 'El tauler', projects: [0, 1] },
  { name: 'Les diagonals', projects: [2, 3] },
  { name: 'Passos i salts', projects: [4, 5, 6] },
  { name: 'La partida', projects: [7, 8] }
];
export const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
// the three questions of the Piscina, the first challenges
export const POOL = [{ kind: 'name', want: 'c2' }, { kind: 'name', want: 'f5' }, { kind: 'step', from: 'b2', d: [2, 1] }];
// the ten levels of a project are three exercises: ex00 (three levels), ex01 (three) and ex02 (four)
export const exOf = idx => idx < 3 ? 0 : idx < 6 ? 1 : 2;
// What a level gives to the mark of its project, by its stars: 10 with no slip, 8 with one or two, 5 with more. Ten levels make 100,
// and a project is validated with 80
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;
// the seconds of a lightning round
export const RAPID = 60;

// What is saved is facts only: { so, lv[90], piscina, exams[4], fulls, rapid, ratxa }. lv is the best stars of each level, rapid the
// most right answers in a lightning round and ratxa the longest run of right answers. Marks, XP, level and badges are worked out, never stored.
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// A complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {}, lv = slots(o.lv, PROJECTS.length * 10).map(s => within(s, 3));
  return { so: o.so !== false, lv, piscina: o.piscina === true || lv.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), rapid: Math.max(0, whole(o.rapid)), ratxa: Math.max(0, whole(o.ratxa)) };
}
const copy = p => ({ ...p, lv: p.lv.slice(), exams: p.exams.slice() });
// the functions below take a progress that is already clean
export const noteOf = (p, i) => p.lv.slice(i * 10, i * 10 + 10).reduce((s, n) => s + POINTS[n], 0);
// how many levels of a project are done from the first on: the one after them is the next to open
export const reached = (p, i) => { const k = p.lv.slice(i * 10, i * 10 + 10).findIndex(n => n === 0); return k < 0 ? 10 : k; };
export const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 1420 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 9,47
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina and the others with the exam before them
export const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primera jugada', what: 'Valida un projecte.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 20', what: 'Encerta 20 caselles seguides a la primera.' },
  { name: 'Totes les peces', what: 'Valida els projectes de les sis peces.' },
  { name: 'Ull de falcó', what: "Troba bé les errades d'un full." },
  { name: 'Deu fulls', what: "Corregeix bé deu fulls d'errades." },
  { name: 'Llampec', what: 'Encerta 15 caselles en un repte llampec.' },
  { name: "Gran mestre de l'estany", what: 'Supera els quatre exàmens.' }
];
export const badges = p => [p.piscina === true, validated(p).length > 0, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 20,
  [1, 2, 3, 4, 5, 6].every(i => noteOf(p, i) >= VALID), p.fulls >= 1, p.fulls >= 10, p.rapid >= 15, p.exams.every(e => e === true)];
const earned = (p, next) => { const had = badges(p), now = badges(next); return BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name); };

// A level done, with its slips (a hint is a slip too). Returns { prog, n, note, gain, valid, exam, news }: prog is a NEW progress
// that keeps the best stars of the level; n the stars of this time; note the mark of the project after it; gain the XP it adds;
// valid whether the project is validated by this very level, and exam whether that opens the exam of its circle; news the badges it earns
export function levelIn(p, i, idx, slips) {
  const n = starsFor(slips), k = i * 10 + idx, next = copy(p), c = circleOf(i);
  next.lv[k] = Math.max(next.lv[k], n);
  return { prog: next, n, note: noteOf(next, i), gain: xpOf(next) - xpOf(p), valid: noteOf(p, i) < VALID && noteOf(next, i) >= VALID,
    exam: !examOpen(p, c) && examOpen(next, c), news: earned(p, next) };
}
// the Piscina done. Returns { prog, news }
export function poolIn(p) { const next = { ...copy(p), piscina: true }; return { prog: next, news: earned(p, next) }; }
// a run of n right answers in a row, and the right answers of a lightning round: each keeps the best. Returns { prog, best, news }
const keep = field => (p, n) => { const next = copy(p), best = whole(n) > p[field]; if (best) next[field] = whole(n); return { prog: next, best, news: earned(p, next) }; };
export const streakIn = keep('ratxa');
export const rapidIn = keep('rapid');

/* ---------- the exam, the lightning round and «Caça l'errada» ---------- */
// Six different questions of the projects of circle c, new every time, at least one of each project, in a random order; each has p,
// its project. A circle that does not exist gives the first
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, seen = new Set(), list = [];
  while (list.length < 6) list.push(draw(list.length < ps.length ? ps[list.length] : ps[at(ps.length, rnd)], rnd, list.length, seen));
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
// The n questions of a lightning round: the square of a star to name; never the same twice in a row
export function sprint(rnd, n = 80) {
  const out = [];
  while (out.length < n) { const want = rsq(rnd); if (out[out.length - 1]?.want !== want) out.push({ kind: 'name', want }); }
  return out;
}

// The five things a sheet can say, each { kind, says, real, opts, ... }: says is the value written on the sheet, real the true one
// (the claim is wrong when they differ) and opts the values to choose from when fixing it, all as text. The mistakes are the ones that teach:
// a piece that moves as it cannot, a square of the wrong colour, values badly added, squares badly counted, and the steps of a king
// taken for the sum of the two changes instead of the larger one.
const CLAIM = {
  move(bad, rnd) {
    for (;;) {
      const t = 'RBQKN'[at(5, rnd)], from = rsq(rnd), ok = reach(lone(t, from), from), real = ok[at(ok.length, rnd)], [f, r] = fr(real);
      const near = ALL.filter(([a, b]) => on(f + a, r + b)).map(([a, b]) => sq(f + a, r + b)).filter(x => x !== from && !ok.includes(x));
      if (near.length < 2) continue;
      const w = shuffle(near, rnd).slice(0, 2);
      return { t, from, says: bad ? w[0] : real, real, opts: shuffle([real, ...w], rnd) };
    }
  },
  tone(bad, rnd) { const s = rsq(rnd), real = TONES[+dark(s)]; return { s, says: bad ? TONES[+!dark(s)] : real, real, opts: TONES }; },
  val(bad, rnd) {
    const ps = Array.from({ length: int(rnd, 2, 3) }, () => 'PNBRQ'[at(5, rnd)]), real = ps.reduce((s, p) => s + VALUE[p], 0);
    return { ps, says: String(bad ? real + [-1, 1][at(2, rnd)] : real), real: String(real), opts: texts([real - 1, real, real + 1]) };
  },
  count(bad, rnd) {
    const t = 'RBKN'[at(4, rnd)], s = rsq(rnd), real = countOn(t, s), w = shuffle([real - 2, real - 1, real + 1, real + 2].filter(n => n > 0), rnd).slice(0, 2);
    return { t, s, says: String(bad ? w[0] : real), real: String(real), opts: texts([real, ...w]) };
  },
  dist(bad, rnd) {
    for (;;) {
      const a = rsq(rnd), b = rsq(rnd), [x, y] = delta(a, b).map(Math.abs);
      if (!x || !y || x === y) continue;
      const real = Math.max(x, y), w = [x + y, Math.min(x, y)];
      return { a, b, x, y, says: String(bad ? w[at(2, rnd)] : real), real: String(real), opts: texts([real, ...w]) };
    }
  }
};
export const KINDS = Object.keys(CLAIM);
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
