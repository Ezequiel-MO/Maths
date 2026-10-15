// The rules and the data of the lights of the pond, with no page in it. A square board of tiles that light up; every level shows
// something on it and the child answers by touching tiles. The levels train the memory of what is seen and where it is (visual and
// spatial memory), keeping it for a while (retention), and turning it in the head (mirrors, turns and paths). Laid out as the cursus
// of 42 Barcelona, like the other games of the pond. It must keep importing from Node.
import { pentatonic } from '../../shared/audio.js';

/* ---------- the board ---------- */
// colour and pitch follow the position: green and low at the bottom left, pink and high at the top right
export const hueOf = (r, c, n) => Math.round(140 + (n - 1 - r + c) / (2 * (n - 1)) * 200);
const scale = pentatonic(261.63);
export const pitchOf = (r, c, n) => scale(n - 1 - r + c);
export const rc = (i, n) => ({ r: Math.floor(i / n), c: i % n });
export const at0 = (r, c, n) => r * n + c;

// Chance enters only through rnd (a function like Math.random). A whole number below n, clamped
const at = (n, rnd) => Math.min(n - 1, Math.max(0, Math.floor(rnd() * n) || 0));
export function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// k different tiles out of the list (all of the board when there is none), in the order they were drawn
export function draw(n, k, rnd, from = null) {
  const pool = from ? from.slice() : Array.from({ length: n * n }, (_, i) => i), out = [];
  while (out.length < k && pool.length) out.push(pool.splice(at(pool.length, rnd), 1)[0]);
  return out;
}
// where tile i is after a mirror over the middle of the board: 'v' swaps left and right, 'h' top and bottom
export const mirror = (i, n, axis) => { const { r, c } = rc(i, n); return axis === 'h' ? at0(n - 1 - r, c, n) : at0(r, n - 1 - c, n); };
// where tile i is after the board turns by deg (90 is a quarter turn to the right, -90 to the left, 180 half a turn)
export function turn(i, n, deg) {
  const { r, c } = rc(i, n), d = ((deg % 360) + 360) % 360;
  return d === 90 ? at0(c, n - 1 - r, n) : d === 180 ? at0(n - 1 - r, n - 1 - c, n) : d === 270 ? at0(n - 1 - c, r, n) : i;
}
// the four steps of a path, as an arrow and a change of row and column
export const STEPS = { u: ['↑', -1, 0], d: ['↓', 1, 0], l: ['←', 0, -1], r: ['→', 0, 1] };
const BACK = { u: 'd', d: 'u', l: 'r', r: 'l' };
// the things hidden under the tiles of «L'amagatall»
export const HIDE = ['🐸', '🐟', '🦆', '🐌', '🦋', '🐞', '🌸', '⭐', '🍄'];
export const HIDE_NAME = { '🐸': 'la granota', '🐟': 'el peix', '🦆': "l'ànec", '🐌': 'el cargol', '🦋': 'la papallona', '🐞': 'la marieta', '🌸': 'la flor', '⭐': "l'estrella", '🍄': 'el bolet' };

/* ---------- the rounds: what a level shows, and what the child must touch after it ---------- */
// Every round has n (the board), want (the tiles to touch) and ordered (whether they go in that order); the rest is what the
// page needs to show it. A level is a kind and its settings; round(L, rnd) draws one round of it.
const ROUND = {
  // a series of lights, one after the other; back asks for it from the last to the first
  seq: (L, rnd) => { const seq = draw(L.n, L.len, rnd); return { seq, want: L.back ? seq.slice().reverse() : seq, ordered: true }; },
  // a photo: some tiles light at once, for a moment; touch them all in any order
  set: (L, rnd) => { const cells = draw(L.n, L.k, rnd); return { cells, want: cells, ordered: false }; },
  // a photo, a blink, and the photo again with one change: a light more (add), a light less (gone), or one that moved (move)
  change(L, rnd) {
    const mode = L.ch === 'mix' ? ['add', 'gone', 'move'][at(3, rnd)] : L.ch, a = draw(L.n, L.k, rnd);
    const free = Array.from({ length: L.n * L.n }, (_, i) => i).filter(i => !a.includes(i)), x = free[at(free.length, rnd)];
    if (mode === 'add') return { mode, a, b: [...a, x], want: [x], ordered: true };
    const j = at(a.length, rnd), b = a.filter((_, i) => i !== j);
    if (mode === 'gone') return { mode, a, b, want: [a[j]], ordered: true };
    return { mode, a, b: [...b, x], want: [x], ordered: true };
  },
  // things hidden under some tiles; then, one by one, where was each? one asks for a single one of them
  where(L, rnd) {
    const cells = draw(L.n, L.k, rnd), things = draw(1, L.k, rnd, HIDE), ask = shuffle(cells.map((_, i) => i), rnd).slice(0, L.one ? 1 : L.k);
    return { cells, things, ask, want: ask.map(i => cells[i]), ordered: true };
  },
  // lights on one half of the board; touch where they are in the mirror. keep leaves them lit while the child answers
  mirror(L, rnd) {
    const axis = L.axis === 'mix' ? (at(2, rnd) ? 'h' : 'v') : L.axis || 'v', h = L.n / 2;
    const half = Array.from({ length: L.n * L.n }, (_, i) => i).filter(i => { const { r, c } = rc(i, L.n); return axis === 'h' ? r < h : c < h; });
    const cells = draw(L.n, L.k, rnd, half);
    return { axis, cells, want: cells.map(i => mirror(i, L.n, axis)), ordered: false };
  },
  // lights on the board, then the board turns; touch where they are now. The tiles turn with the board, so the tiles to touch
  // are the same ones: on the screen they are somewhere else
  turn(L, rnd) {
    const deg = L.deg === 'mix' ? [90, -90, 180][at(3, rnd)] : L.deg, cells = draw(L.n, L.k, rnd);
    return { deg, cells, want: cells, ordered: false };
  },
  // a start and some arrows: where does the frog end up? Never out of the board, and never straight back where it came from
  walk(L, rnd) {
    const n = L.n, start = at(n * n, rnd), path = [];
    let { r, c } = rc(start, n);
    for (let s = 0; s < L.steps; s++) {
      const ok = Object.keys(STEPS).filter(d => { const [, dr, dc] = STEPS[d]; return r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n && d !== BACK[path[path.length - 1]]; });
      const d = ok[at(ok.length, rnd)]; path.push(d); r += STEPS[d][1]; c += STEPS[d][2];
    }
    return { start, path, want: [at0(r, c, n)], ordered: true };
  }
};
export const KINDS = Object.keys(ROUND);
export const round = (L, rnd) => ({ n: L.n, ...ROUND[L.kind](L, rnd) });

/* ---------- the levels ---------- */
// The settings of a level: n (the board is n × n), rounds (how many to do, three by default), plain (every tile the same colour),
// wait (seconds of dark between seeing and answering, to keep it in the head) and say (what the frog says when the level starts).
// seq: len, back, on (ms each light is on). set: k, ms (how long the photo stays). change: k, ch, ms. where: k, one, ms.
// mirror: k, axis, keep, ms. turn: k, deg, see ('lit': the lights turn with the board, 'dark': the board turns dark, 'cover': it
// turns covered). walk: steps, hide (the arrows go before answering), lose (the frog leaves the start before the arrows come)
const lv = (kind, title, n, o, say) => ({ kind, title, n, rounds: 3, ...o, say });
const seq = (title, n, len, o, say) => lv('seq', title, n, { len, ...o }, say);
const set = (title, n, k, ms, o, say) => lv('set', title, n, { k, ms, ...o }, say);
const change = (title, n, k, ch, o, say) => lv('change', title, n, { k, ch, ms: 1800, ...o }, say);
const where = (title, n, k, o, say) => lv('where', title, n, { k, ms: 1400 + 600 * k, ...o }, say);
const mir = (title, n, k, axis, keep, o, say) => lv('mirror', title, n, { k, axis, keep, ms: 1500 + 400 * k, ...o }, say);
const trn = (title, n, k, deg, see, o, say) => lv('turn', title, n, { k, deg, see, ms: 1600 + 300 * k, ...o }, say);
const walk = (title, n, steps, o, say) => lv('walk', title, n, { steps, ...o }, say);

export const SECTIONS = [
  { name: 'La sèrie', sub: 'Mira quins llums s\'encenen i toca\'ls en el mateix ordre.', levels: [
    seq('Dos llums', 3, 2, {}, 'Mira bé quins llums s\'encenen. Després toca\'ls en el mateix ordre.'),
    seq('Tres llums', 3, 3, {}, 'Tres llums. Truc: digues el camí en veu baixa mentre el mires: «dalt, mig, baix».'),
    seq('Quatre llums', 3, 4, {}, 'Quatre llums! Cada llum té la seva nota: escolta la música de la sèrie.'),
    seq('Tauler més gran', 4, 3, {}, 'El tauler té més quadres, però la sèrie torna a ser curta.'),
    seq('Quatre al gran', 4, 4, {}, 'Mira la forma que fa el camí: una ela, una ziga-zaga, una línia…'),
    seq('Cinc llums', 4, 5, {}, 'Cinc llums. Pensa-hi com dos trossos: els tres primers i els dos últims.'),
    seq('Més de pressa', 3, 5, { on: 360 }, 'Ara els llums van més de pressa. Concentra\'t des del primer.'),
    seq('Sis llums', 4, 6, {}, 'Sis llums. Si cal, tanca els ulls un moment i torna a veure el camí al cap.'),
    seq('Cinc per cinc', 5, 5, {}, 'Un tauler de cinc per cinc. Els quadres són més petits: mira on cau cada llum.'),
    seq('El gran camí', 5, 6, {}, 'L\'últim: sis llums en un tauler gran. Endavant!')
  ] },
  { name: 'La foto', sub: 'Uns quants llums s\'encenen alhora: fes-ne una foto amb els ulls.', levels: [
    set('Dos alhora', 3, 2, 1500, {}, 'Ara s\'encenen tots alhora, només un moment. Toca\'ls tots, en l\'ordre que vulguis.'),
    set('Tres alhora', 3, 3, 1500, {}, 'Mira la forma que fan junts: una línia, un triangle, una ela…'),
    set('Quatre alhora', 3, 4, 1500, {}, 'Quatre! Fixa\'t també en els quadres que queden apagats.'),
    set('Tres al gran', 4, 3, 1300, {}, 'Tauler més gran. Mira a quina fila i a quina columna és cada llum.'),
    set('Quatre al gran', 4, 4, 1300, {}, 'Agrupa\'ls: quins són a dalt? quins són a baix?'),
    set('Cinc al gran', 4, 5, 1600, {}, 'Cinc llums. Busca una forma coneguda: una lletra, una escala, una casa…'),
    set('Foto ràpida', 4, 4, 800, {}, 'Una foto molt ràpida! Mira el tauler sencer, no un sol quadre.'),
    set('Cinc per cinc', 5, 5, 1600, {}, 'Tauler de cinc per cinc: busca les formes que fan els llums.'),
    set('Sis alhora', 5, 6, 1800, {}, 'Sis llums alhora. Primer la forma de tot, després els detalls.'),
    set('La foto gran', 5, 7, 2000, {}, 'L\'última foto: set llums. Respira i mira-la sencera.')
  ] },
  { name: 'Què ha canviat?', sub: 'Una foto, un parpelleig i… alguna cosa ha canviat. Troba-la!', levels: [
    change('Un llum més', 3, 2, 'add', {}, 'Mira la foto. Parpellejarà i tornarà amb un llum de més: toca\'l.'),
    change('Un altre de més', 3, 3, 'add', {}, 'Ara hi ha tres llums a la foto. Quin és el nou?'),
    change('Un llum menys', 3, 3, 'gone', {}, 'Ara se n\'apaga un. Toca el quadre on hi havia el llum que falta.'),
    change('Més al gran', 4, 4, 'add', {}, 'Tauler més gran. Mira bé on és cada llum abans del parpelleig.'),
    change('Menys al gran', 4, 4, 'gone', {}, 'Un llum desapareix. On era?'),
    change('Un llum que es mou', 4, 4, 'move', {}, 'Ara un llum se\'n va a un altre quadre. Toca on és ara.'),
    change('Qualsevol canvi', 4, 5, 'mix', {}, 'Pot ser un llum de més, un de menys o un que s\'ha mogut. Llegeix què et demano!'),
    change('Cinc per cinc', 5, 5, 'mix', {}, 'Tauler de cinc per cinc i qualsevol canvi.'),
    change('Sis llums', 5, 6, 'mix', { ms: 2200 }, 'Sis llums a la foto. Mira-la per zones: a dalt, al mig, a baix.'),
    change('Ull d\'àliga', 5, 7, 'mix', { ms: 2000 }, 'L\'últim: set llums i un canvi. Ull d\'àliga!')
  ] },
  { name: 'L\'amagatall', sub: 'Uns animalons s\'amaguen sota els quadres. On era cadascun?', levels: [
    where('Dos amagats', 3, 2, { one: true }, 'Mira on és cada animaló. Quan s\'amaguin, et preguntaré per un d\'ells.'),
    where('Tres amagats', 3, 3, { one: true }, 'Tres animalons. Digues-ho en veu baixa: «la granota a dalt, el peix al mig…».'),
    where('Tots tres', 3, 3, {}, 'Ara et preguntaré per tots tres, un darrere l\'altre.'),
    where('Al tauler gran', 4, 3, {}, 'Tauler més gran, i tots tres per trobar.'),
    where('Quatre amagats', 4, 4, { one: true }, 'Quatre animalons, i et preguntaré per un. No saps per quin!'),
    where('Tots quatre', 4, 4, {}, 'Tots quatre, un darrere l\'altre. Inventa\'t una història: «l\'ànec visita la flor…».'),
    where('Cinc amagats', 4, 5, {}, 'Cinc animalons. Mira primer els dels racons.'),
    where('Cinc per cinc', 5, 5, {}, 'Tauler de cinc per cinc. On s\'ha amagat cadascun?'),
    where('Sis amagats', 5, 6, { rounds: 2 }, 'Sis animalons! Agrupa\'ls per files.'),
    where('L\'espera', 5, 5, { rounds: 2, wait: 3 }, 'L\'últim: s\'amagaran i hauràs d\'esperar una mica abans que et pregunti.')
  ] },
  { name: 'Al revés', sub: 'Mira la sèrie i toca-la del final al principi.', levels: [
    seq('Dos al revés', 3, 2, { back: true }, 'Ara al revés: comença per l\'últim llum que s\'ha encès i acaba pel primer.'),
    seq('Tres al revés', 3, 3, { back: true }, 'Tres llums al revés. Pensa el camí i després desfés-lo.'),
    seq('Tauler gran', 4, 3, { back: true }, 'Tauler més gran. L\'últim llum és el primer que toques.'),
    seq('Quatre al revés', 3, 4, { back: true }, 'Quatre llums al revés. Imagina que rebobines una pel·lícula.'),
    seq('Quatre al gran', 4, 4, { back: true }, 'Quatre llums al tauler gran, del final al principi.'),
    seq('Més de pressa', 4, 4, { back: true, on: 380 }, 'Més de pressa! Recorda la forma del camí i fes-la a l\'inrevés.'),
    seq('Cinc al revés', 4, 5, { back: true }, 'Cinc llums al revés. Ho fas molt bé!'),
    seq('Cinc per cinc', 5, 4, { back: true }, 'Tauler de cinc per cinc, quatre llums al revés.'),
    seq('Cinc al gran', 5, 5, { back: true }, 'Cinc llums al revés en un tauler gran.'),
    seq('Rebobina', 5, 5, { back: true, on: 380, rounds: 2 }, 'L\'últim: cinc llums ràpids, al revés.')
  ] },
  { name: 'El mirall', sub: 'L\'estany fa de mirall: toca on es veuen els llums a l\'altre costat.', levels: [
    mir('Un llum al mirall', 4, 1, 'v', true, {}, 'La ratlla del mig és un mirall. Toca on es veu el llum a l\'altre costat: a la mateixa fila i a la mateixa distància de la ratlla.'),
    mir('Dos llums', 4, 2, 'v', true, {}, 'Dos llums. El que és enganxat a la ratlla es veu enganxat a la ratlla.'),
    mir('Tres llums', 4, 3, 'v', true, {}, 'Tres llums. El que és més lluny de la ratlla es veu més lluny.'),
    mir('Sense mirar', 4, 2, 'v', false, {}, 'Ara els llums s\'apaguen abans que toquis. Recorda\'ls i fes-ne el mirall.'),
    mir('Tres sense mirar', 4, 3, 'v', false, {}, 'Tres llums que s\'apaguen. Fila per fila!'),
    mir('L\'estany', 4, 2, 'h', true, {}, 'Ara la ratlla és horitzontal, com l\'aigua de l\'estany: el que és a dalt es veu a baix.'),
    mir('L\'estany a les fosques', 4, 3, 'h', false, {}, 'Tres llums que s\'apaguen, i el mirall de l\'aigua.'),
    mir('Sis per sis', 6, 3, 'v', true, {}, 'Un tauler de sis per sis. Compta a quina distància de la ratlla és cada llum.'),
    mir('Quatre a les fosques', 6, 4, 'v', false, { rounds: 2 }, 'Quatre llums que s\'apaguen al tauler gran.'),
    mir('Els dos miralls', 6, 4, 'mix', false, { rounds: 2 }, 'L\'últim: mira bé on és la ratlla, de dalt a baix o d\'esquerra a dreta.')
  ] },
  { name: 'El gir', sub: 'El tauler gira: on són ara els llums?', levels: [
    trn('Mitja volta', 3, 1, 180, 'lit', {}, 'Mira el llum. El tauler farà mitja volta: toca on és el llum ara.'),
    trn('Dos llums', 3, 2, 180, 'lit', {}, 'Dos llums, mitja volta. El que era a dalt queda a baix.'),
    trn('Un quart de volta', 3, 2, 90, 'lit', {}, 'Ara només un quart de volta cap a la dreta. Segueix els llums amb els ulls.'),
    trn('A les fosques', 3, 2, -90, 'dark', {}, 'Ara els llums s\'apaguen abans de girar. Segueix el tauler amb els ulls: un quart de volta a l\'esquerra.'),
    trn('Mitja volta fosca', 4, 2, 180, 'dark', {}, 'Tauler més gran, mitja volta a les fosques.'),
    trn('Tres llums', 4, 3, 90, 'dark', {}, 'Tres llums, un quart de volta a la dreta.'),
    trn('Cap a l\'esquerra', 4, 3, -90, 'dark', {}, 'Tres llums, un quart de volta a l\'esquerra.'),
    trn('Tapat', 3, 2, 90, 'cover', { plain: true }, 'Ara el tauler gira tapat! Només veuràs la fletxa. Imagina el gir al cap.'),
    trn('Tapat i gran', 4, 2, 180, 'cover', { plain: true }, 'Tapat i mitja volta. El que era a la dreta queda a l\'esquerra, i el de dalt, a baix.'),
    trn('El gran gir', 4, 3, 'mix', 'cover', { plain: true, rounds: 2 }, 'L\'últim: llegeix la fletxa i fes el gir al cap.')
  ] },
  { name: 'On arribes?', sub: 'La granota salta seguint les fletxes. On arriba?', levels: [
    walk('Dos salts', 3, 2, {}, 'La granota és al seu quadre. Segueix les fletxes amb el dit, sense tocar, i toca on arriba.'),
    walk('Tres salts', 3, 3, {}, 'Tres fletxes. Salta amb els ulls, quadre per quadre.'),
    walk('Tauler gran', 4, 3, {}, 'Tauler més gran, tres salts.'),
    walk('Quatre salts', 4, 4, {}, 'Quatre salts. Una fletxa, un quadre.'),
    walk('Fletxes que marxen', 4, 3, { hide: true }, 'Ara les fletxes marxen abans que toquis. Salta amb el cap mentre surten.'),
    walk('Quatre que marxen', 4, 4, { hide: true }, 'Quatre fletxes que marxen. Ves saltant al cap a cada fletxa.'),
    walk('Cinc per cinc', 5, 4, { hide: true }, 'Tauler de cinc per cinc.'),
    walk('Cinc salts', 5, 5, { hide: true }, 'Cinc salts que marxen. Endavant!'),
    walk('La granota s\'amaga', 5, 4, { hide: true, lose: true }, 'Ara la granota s\'amaga abans de saltar. Recorda d\'on surt!'),
    walk('El gran salt', 5, 6, { hide: true, lose: true, rounds: 2 }, 'L\'últim: sis salts, i la granota amagada.')
  ] },
  { name: 'Espera i recorda', sub: 'Guarda-ho al cap una estona abans de respondre.', levels: [
    set('Foto i espera', 3, 3, 1500, { wait: 2 }, 'Mira la foto i guarda-la: hauràs d\'esperar una mica abans de tocar. Repeteix-la al cap mentre esperes.'),
    seq('Sèrie i espera', 3, 3, { wait: 2 }, 'Una sèrie, i a esperar. Repeteix-la al cap mentre esperes.'),
    set('Més espera', 4, 4, 1400, { wait: 3 }, 'Quatre llums i tres segons d\'espera.'),
    seq('Quatre i espera', 4, 4, { wait: 3 }, 'Quatre llums en sèrie i tres segons d\'espera. Digues el camí en veu baixa.'),
    where('Amagats i espera', 4, 3, { wait: 3 }, 'Tres animalons. S\'amagaran i hauràs d\'esperar.'),
    set('Cinc i espera', 4, 5, 1700, { wait: 4 }, 'Cinc llums i quatre segons. Busca una forma que es pugui recordar.'),
    seq('Cinc en sèrie', 4, 5, { wait: 4 }, 'Cinc llums en sèrie i quatre segons d\'espera.'),
    mir('Mirall i espera', 4, 3, 'v', false, { wait: 3 }, 'El mirall, però esperant una mica abans de tocar.'),
    set('Foto gran', 5, 5, 1800, { wait: 5 }, 'Tauler gran i cinc segons d\'espera.'),
    seq('La gran espera', 5, 5, { wait: 5, rounds: 2 }, 'L\'últim: cinc llums i cinc segons. Tu pots!')
  ] },
  { name: 'La gran nit', sub: 'Tot barrejat i taulers grans: la prova dels campions.', levels: [
    seq('Sèrie de sis', 5, 6, {}, 'La gran nit! Primer, una sèrie de sis llums.'),
    set('Foto de set', 5, 7, 2000, {}, 'Una foto de set llums.'),
    change('Ull d\'àliga', 5, 6, 'mix', { ms: 2000 }, 'Què ha canviat? Pot ser qualsevol cosa.'),
    where('Sis amagats', 5, 6, { rounds: 2 }, 'Sis animalons amagats.'),
    seq('Al revés', 5, 5, { back: true }, 'Cinc llums al revés.'),
    mir('L\'estany gran', 6, 4, 'h', false, { rounds: 2 }, 'El mirall de l\'aigua, al tauler de sis per sis.'),
    trn('Gir tapat', 4, 3, -90, 'cover', { plain: true }, 'Un quart de volta a l\'esquerra, tapat.'),
    walk('Sis salts', 5, 6, { hide: true, lose: true }, 'Sis salts amb la granota amagada.'),
    set('Sis per sis', 6, 7, 2200, { rounds: 2 }, 'Tauler de sis per sis: set llums alhora.'),
    seq('La sèrie dels campions', 6, 7, { rounds: 2 }, 'L\'última de totes: set llums al tauler més gran. Campió!')
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);
// what the frog says while the child answers, by kind; a mirror and a level backwards say more
export function asks(L, R) {
  if (L.kind === 'seq') return L.back ? 'Ara tu! Del final al principi.' : 'Ara tu! En el mateix ordre.';
  if (L.kind === 'set') return 'Ara tu! Toca tots els que s\'han encès.';
  if (L.kind === 'change') return R.mode === 'add' ? 'Hi ha un llum nou. Toca\'l!' : R.mode === 'gone' ? 'Se n\'ha apagat un. On era?' : 'Un llum s\'ha mogut. On és ara?';
  if (L.kind === 'where') return `On era ${HIDE_NAME[R.things[R.ask[0]]]}?`;
  if (L.kind === 'mirror') return R.axis === 'h' ? 'Ara tu! Toca el mirall de l\'aigua, a l\'altra banda de la ratlla.' : 'Ara tu! Toca el mirall, a l\'altra banda de la ratlla.';
  if (L.kind === 'turn') return 'Ara tu! On són ara els llums?';
  return 'On arriba la granota?';
}
// the way the board turns, said and drawn
export const TURN = { 90: ['↻', 'un quart de volta a la dreta'], '-90': ['↺', 'un quart de volta a l\'esquerra'], 180: ['⟳', 'mitja volta'] };

/* ---------- stars ---------- */
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the other games: a Piscina to get in, a map of four circles, a mark for each project,
// an exam for each circle, XP and badges. A project is one of the sections above, with its ten levels
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Ulls oberts', projects: [0, 1] },
  { name: 'La memòria de l\'espai', projects: [2, 3, 4] },
  { name: 'Miralls, girs i salts', projects: [5, 6, 7] },
  { name: 'Memòria de campió', projects: [8, 9] }
];
export const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
// the Piscina: one light, two in a row and a photo of two, on the smallest board
export const POOL = [{ kind: 'seq', n: 3, len: 1 }, { kind: 'seq', n: 3, len: 2 }, { kind: 'set', n: 3, k: 2, ms: 1600 }];
// the ten levels of a project are three exercises: ex00 (three levels), ex01 (three) and ex02 (four)
export const exOf = idx => idx < 3 ? 0 : idx < 6 ? 1 : 2;
// What a level gives to the mark of its project, by its stars: 10 with no slip, 8 with one or two, 5 with more. Ten levels make 100,
// and a project is validated with 80
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;

// What is saved is facts only: { so, stars[100], piscina, exams[4], fulls, best }. best is the record of the free game, the game this
// one was before its cursus. Marks, XP, level and badges are worked out, never stored.
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// a complete progress inside its limits from any value at all; a new object. Whoever had a record of the free game had already played:
// the Piscina is done for them
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, LEVELS.length).map(s => within(s, 3)), best = Math.max(0, whole(o.best));
  return { so: o.so !== false, stars, piscina: o.piscina === true || best > 0 || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), best };
}
const copy = p => ({ ...p, stars: p.stars.slice(), exams: p.exams.slice() });
// the functions below take a progress that is already clean
export const noteOf = (p, i) => p.stars.slice(i * 10, i * 10 + 10).reduce((s, n) => s + POINTS[n], 0);
// how many levels of a project are done from the first on: the one after them is the next to open
export const reached = (p, i) => { const k = p.stars.slice(i * 10, i * 10 + 10).findIndex(n => n === 0); return k < 0 ? 10 : k; };
const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 1550 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 10,33
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina and the others with the exam before them
export const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: 'Caça bé les errades d\'un full.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: 'Caça bé les errades de deu fulls.' },
  { name: 'Partida llarga', what: 'Fes 500 punts a la partida lliure.' },
  { name: 'Mestre dels llums', what: 'Supera els quatre exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, p.best >= 500, p.exams.every(e => e === true)];
const earned = (p, next) => { const had = badges(p), now = badges(next); return BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name); };

// A level done, with its slips (a hint is a slip too). Returns { prog, n, note, gain, valid, exam, news }: prog is a NEW progress
// that keeps the best stars of the level; n the stars of this time; note the mark of the project after it; gain the XP it adds;
// valid whether the project is validated by this very level, and exam whether that opens the exam of its circle; news the badges it earns
export function levelIn(p, i, idx, slips) {
  const n = starsFor(slips), k = i * 10 + idx, next = copy(p), c = circleOf(i);
  next.stars[k] = Math.max(next.stars[k], n);
  return { prog: next, n, note: noteOf(next, i), gain: xpOf(next) - xpOf(p), valid: noteOf(p, i) < VALID && noteOf(next, i) >= VALID,
    exam: !examOpen(p, c) && examOpen(next, c), news: earned(p, next) };
}
// A free game ended with score points: a NEW progress with the record, and the badges that earns
export function freeIn(p, score) {
  const next = copy(p); next.best = Math.max(p.best, Math.max(0, whole(score)));
  return { prog: next, record: next.best > p.best, news: earned(p, next) };
}

/* ---------- the exam and «Caça l'errada» ---------- */
// Six different levels of the projects of circle c, at least one of each project, in a random order; each is a copy of the level with
// one round only, and p, its project, and idx added. A circle that does not exist gives the first
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const pickOne = p => {
    let idx = at(10, rnd);
    for (let n = 0; n < 10 && used.has(p * 10 + idx); n++) idx = (idx + 1) % 10;
    used.add(p * 10 + idx);
    return { ...PROJECTS[p].levels[idx], rounds: 1, p, idx };
  };
  const list = ps.map(pickOne);
  while (list.length < 6) list.push(pickOne(ps[at(ps.length, rnd)]));
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

// The three copies a sheet can show, each { kind, n, a, b, real, ... }: a is the picture, real what its copy should be, and b the copy the
// sheet shows (it is wrong when it is not real). The mistakes are the ones a child makes: a light out of place in a photo copied from
// memory, a mirror that only copies (it does not flip), and a turn made the wrong way round
const same = (x, y) => x.length === y.length && x.every(i => y.includes(i));
// one light of the copy moved to a free tile next to it (or anywhere, on a crowded board)
function nudge(cells, n, rnd) {
  const j = at(cells.length, rnd), { r, c } = rc(cells[j], n);
  const near = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dr, dc]) => [r + dr, c + dc]).filter(([y, x]) => y >= 0 && y < n && x >= 0 && x < n).map(([y, x]) => at0(y, x, n)).filter(i => !cells.includes(i));
  const free = near.length ? near : Array.from({ length: n * n }, (_, i) => i).filter(i => !cells.includes(i));
  return cells.map((x, i) => i === j ? free[at(free.length, rnd)] : x);
}
const CLAIM = {
  foto(bad, rnd) {
    const n = 4, a = draw(n, 4 + at(2, rnd), rnd), real = a;
    return { n, a, real, b: bad ? nudge(real, n, rnd) : real };
  },
  mirall(bad, rnd) {
    const n = 4, axis = at(2, rnd) ? 'h' : 'v', R = ROUND.mirror({ n, k: 3, axis }, rnd), real = R.want;
    // the wrong copy: the lights only slide to the other half, unflipped, or one of them lands out of place
    const slid = R.cells.map(i => { const { r, c } = rc(i, n); return axis === 'h' ? at0(r + n / 2, c, n) : at0(r, c + n / 2, n); });
    return { n, axis, a: R.cells, real, b: !bad ? real : same(slid, real) || at(2, rnd) ? nudge(real, n, rnd) : slid };
  },
  gir(bad, rnd) {
    const n = 3, deg = [90, -90, 180][at(3, rnd)], a = draw(n, 3, rnd), real = a.map(i => turn(i, n, deg));
    // the wrong copy: turned the other way, or one light out of place
    const other = a.map(i => turn(i, n, deg === 180 ? 90 : -deg));
    return { n, deg, a, real, b: !bad ? real : same(other, real) || at(2, rnd) ? nudge(real, n, rnd) : other };
  }
};
export const CLAIMS = Object.keys(CLAIM);
// Three copies of the three kinds, in any order; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(CLAIMS.slice(), rnd).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
// whether a copy is wrong, and the tiles of the copy that are wrong: lit where they should not be, or dark where a light should be
export const wrong = C => !same(C.b, C.real);
export const misses = C => [...C.b.filter(i => !C.real.includes(i)), ...C.real.filter(i => !C.b.includes(i))];
// The hand-in of a finished sheet: run has one boolean per copy. Returns { prog, good, gain, missed, news }: prog is a NEW progress
// with fulls + 1 only when all three are right; gain the XP that adds (0 once the cap of 3 per validated project is reached)
export function sheetIn(p, run) {
  const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3, next = copy(p);
  if (good) next.fulls = p.fulls + 1;
  return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: earned(p, next) };
}

/* ---------- the free game: the game of before, endless, with lives and a record ---------- */
export const GRIDS = [3, 4, 5, 6], MINLEN = 2, MAXLEN = 5, LIVES = 3;
// a sequence never lights the same tile twice
export const makeSeq = (cells, len, rnd = Math.random) => draw(1, len, rnd, Array.from({ length: cells }, (_, i) => i));
export const begin = () => ({ lvl: 0, len: MINLEN, lives: LIVES, score: 0, up: false, won: false, over: false });
// one round played: a miss costs a life and keeps the length; a hit grows the series, and after MAXLEN the grid gets finer
export function step(s, ok) {
  if (!ok) { const lives = s.lives - 1; return { ...s, lives, up: false, over: lives <= 0 }; }
  const score = s.score + s.len * (s.lvl + 1) * 10;
  if (s.len < MAXLEN) return { ...s, score, len: s.len + 1, up: false };
  if (s.lvl === GRIDS.length - 1) return { ...s, score, up: false, won: true, over: true };
  return { ...s, score, lvl: s.lvl + 1, len: MINLEN, up: true };
}
