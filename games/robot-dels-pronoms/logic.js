import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the robot of the weak pronouns, with no page in it. The robot only understands orders that are well
// written: «Dona'm la pilota!» when the thing is named, and «Dona-me-la!», «Dona-me'l!», «Dona-me-les!», «Dona-me'ls!» when a pronoun
// stands for it. Seven sections of ten levels: sorting things by their article, orders that name the thing, the two feminine
// pronouns, the two masculine ones, all four, other verbs, and missions. It must keep importing from Node.

/* ---------- the four kinds of noun, each with its article, its pronoun after «me» and its colour ---------- */
export const TYPES = {
  m1: { art: 'el', a: 'un', suf: "'l", hue: 195, what: 'masculí singular' },
  f1: { art: 'la', a: 'una', suf: '-la', hue: 28, what: 'femení singular' },
  m2: { art: 'els', a: 'uns', suf: "'ls", hue: 262, what: 'masculí plural' },
  f2: { art: 'les', a: 'unes', suf: '-les', hue: 140, what: 'femení plural' }
};
export const ALL = Object.keys(TYPES);

/* ---------- the things ---------- */
// singular, plural, gender, drawing, and a note for the nouns that trick. A noun with no singular is one thing with a plural name
const NOUNS = {
  pilota: ['pilota', 'pilotes', 'f', '⚽'], poma: ['poma', 'pomes', 'f', '🍎'], guitarra: ['guitarra', 'guitarres', 'f', '🎸'],
  galeta: ['galeta', 'galetes', 'f', '🍪'], corona: ['corona', 'corones', 'f', '👑'], motxilla: ['motxilla', 'motxilles', 'f', '🎒'],
  pizza: ['pizza', 'pizzes', 'f', '🍕'], llanterna: ['llanterna', 'llanternes', 'f', '🔦'], bombeta: ['bombeta', 'bombetes', 'f', '💡'],
  maduixa: ['maduixa', 'maduixes', 'f', '🍓'], campana: ['campana', 'campanes', 'f', '🔔'], carta: ['carta', 'cartes', 'f', '✉️'],
  sabata: ['sabata', 'sabates', 'f', '👟'], pila: ['pila', 'piles', 'f', '🔋'], bicicleta: ['bicicleta', 'bicicletes', 'f', '🚲'],
  lupa: ['lupa', 'lupes', 'f', '🔍'], xocolata: ['xocolata', 'xocolates', 'f', '🍫'], llet: ['llet', 'llets', 'f', '🥛'],
  aigua: ['aigua', 'aigües', 'f', '💧', 'Prova amb «una»: una aigua. És femení.'],
  flor: ['flor', 'flors', 'f', '🌸', '«Flor» no acaba en a, però és femení: una flor.'],
  clau: ['clau', 'claus', 'f', '🔑', 'La clau d\'obrir portes és femení: una clau.'],
  estrella: ['estrella', 'estrelles', 'f', '⭐', 'Davant de vocal l\'article és «l\'». Prova amb «una»: una estrella.'],
  orella: ['orella', 'orelles', 'f', '👂', 'Davant de vocal l\'article és «l\'». Prova amb «una»: una orella.'],
  llibre: ['llibre', 'llibres', 'm', '📕'], llapis: ['llapis', 'llapis', 'm', '✏️'], globus: ['globus', 'globus', 'm', '🎈'],
  barret: ['barret', 'barrets', 'm', '🎩'], rellotge: ['rellotge', 'rellotges', 'm', '⏰'], martell: ['martell', 'martells', 'm', '🔨'],
  platan: ['plàtan', 'plàtans', 'm', '🍌'], formatge: ['formatge', 'formatges', 'm', '🧀'], pastis: ['pastís', 'pastissos', 'm', '🍰'],
  cotxe: ['cotxe', 'cotxes', 'm', '🚗'], coet: ['coet', 'coets', 'm', '🚀'], tambor: ['tambor', 'tambors', 'm', '🥁'],
  gelat: ['gelat', 'gelats', 'm', '🍦'], telefon: ['telèfon', 'telèfons', 'm', '📱'], dau: ['dau', 'daus', 'm', '🎲'],
  caramel: ['caramel', 'caramels', 'm', '🍬'], cargol: ['cargol', 'cargols', 'm', '🔩'], mitjo: ['mitjó', 'mitjons', 'm', '🧦'],
  guant: ['guant', 'guants', 'm', '🧤'], pa: ['pa', 'pans', 'm', '🥖'], suc: ['suc', 'sucs', 'm', '🧃'],
  paraigua: ['paraigua', 'paraigües', 'm', '☂️', '«Paraigua» acaba en a, però és masculí: un paraigua.'],
  mapa: ['mapa', 'mapes', 'm', '🗺️', '«Mapa» acaba en a, però és masculí: un mapa.'],
  ou: ['ou', 'ous', 'm', '🥚', 'Davant de vocal l\'article és «l\'». Prova amb «un»: un ou.'],
  anell: ['anell', 'anells', 'm', '💍', 'Davant de vocal l\'article és «l\'». Prova amb «un»: un anell.'],
  arbre: ['arbre', 'arbres', 'm', '🌳', 'Davant de vocal l\'article és «l\'». Prova amb «un»: un arbre.'],
  engranatge: ['engranatge', 'engranatges', 'm', '⚙️'],
  tisores: [null, 'tisores', 'f', '✂️', 'És una sola eina, però el nom és plural: unes tisores.'],
  ulleres: [null, 'ulleres', 'f', '👓', 'És una sola cosa, però el nom és plural: unes ulleres.'],
  pantalons: [null, 'pantalons', 'm', '👖', 'És una sola peça, però el nom és plural: uns pantalons.']
};
// the ones asked for with no article when they are named: «Dona'm aigua!»
const MASS = new Set(['aigua', 'llet', 'pa', 'suc', 'xocolata']);
// why some of them are wanted
const WISH = { aigua: 'Tinc set!', suc: 'Tinc set!', llet: 'Tinc set!', pa: 'Tinc gana!', pizza: 'Tinc gana!', paraigua: 'Plou!', llanterna: 'És fosc!', guant: 'Fa fred!', ulleres: 'No hi veig bé!', pila: 'El robot s\'apaga!' };
const vowel = s => /^h?[aeiouàèéíòóú]/i.test(s);
export const cap = s => s[0].toUpperCase() + s.slice(1);

// A thing out of its key: the noun, with a «+» at the end for the plural. type is one of TYPES; text the noun with its article;
// n how many drawings show it (three for a plural, one for a thing with a plural name)
export function thing(key) {
  const many = key.endsWith('+'), id = many ? key.slice(0, -1) : key, [one, plural, g, pic, note = ''] = NOUNS[id];
  const type = g + (many ? 2 : 1), word = many ? plural : one, T = TYPES[type];
  return { key, id, type, word, pic, note, n: many && one ? 3 : 1, a: T.a, text: !many && vowel(word) ? `l'${word}` : `${T.art} ${word}` };
}
// how a thing is said when the order names it
export const phrase = t => MASS.has(t.id) && t.type[1] === '1' ? t.word : t.text;

/* ---------- the orders ---------- */
export const order = (verb, type) => `${cap(verb)}-me${TYPES[type].suf}`;
export const naming = (verb, t) => `${cap(verb)}'m ${phrase(t)}`;
// the ways a child writes each one wrong
const BAD = { m1: ['-me-el', "'m-el"], f1: ["-me'la", "'m-la"], m2: ['-me-els', "'m-els"], f2: ["-me'les", "'m-les"] };
const misnamed = (verb, t) => [`${cap(verb)}-me ${phrase(t)}`, `${cap(verb)} em ${phrase(t)}`];
// One order to give: the thing t, the verb, whether the order names the thing, and want, the order well written (with no «!»)
export function roundOf(key, verb = 'dona', named = false) {
  const t = thing(key);
  return { t, verb, named, want: named ? naming(verb, t) : order(verb, t.type) };
}
// what the commander wants, said aloud: «Plou! Vull el paraigua!»
export const wish = r => `${WISH[r.t.id] ? WISH[r.t.id] + ' ' : ''}Vull ${r.named ? phrase(r.t) : r.t.text}!`;
// two orders are the same whatever their capitals, the shape of the apostrophe and the «!» at the end
export const norm = s => String(s).trim().toLowerCase().replace(/[’`´]/g, "'").replace(/[!.\s]+$/, '').replace(/\s+/g, ' ');
// Why got is not the order of round r, said to a child; '' when it is. An order of another kind of noun says whose it is;
// one that is badly joined says how its pronoun is joined
export function why(r, got) {
  const g = norm(got), V = cap(r.verb), T = TYPES[r.t.type];
  if (g === norm(r.want)) return '';
  const other = ALL.find(k => g === norm(order(r.verb, k)));
  if (r.named) return other ? `Aquí has de dir el nom de la cosa: «${V}'m» i després el nom.` : `Davant del nom s'escriu «${V}'m»: «em» s'enganxa al verb, la e cau i hi queda l'apòstrof.`;
  if (other) return `«${order(r.verb, other)}!» és per a «${TYPES[other].art}», ${TYPES[other].what}. «${cap(r.t.text)}»: ${T.what}.${r.t.note ? ' ' + r.t.note : ''}`;
  if (g.startsWith(norm(V) + "'m")) return `«${V}'m» va davant del nom de la cosa. Sense dir el nom, s'escriu «${V}-me» i el pronom.`;
  return r.t.type[0] === 'm' ? '«Me» i «el» s\'enganxen sense guionet: la e d\'«el» cau i hi queda un apòstrof. S\'escriu me\'l i me\'ls.' : '«La» i «les» van darrere de «me» amb un guionet, i no cau cap lletra. S\'escriu me-la i me-les.';
}
// «d'» in front of the articles that start with a vowel
export const from = art => art[0] === 'e' ? `d'«${art}»` : `de «${art}»`;
const flip = type => type[0] + (type[1] === '1' ? 2 : 1);
// the orders to choose from in a level of mode 'pick', the good one first: the page shuffles them
export function options(L, r) {
  if (L.mix) return [r.want, r.named ? order(r.verb, r.t.type) : naming(r.verb, r.t), misnamed(r.verb, r.t)[0], order(r.verb, flip(r.t.type))];
  if (r.named) return [r.want, ...misnamed(r.verb, r.t)];
  if (L.spell) return [r.want, ...BAD[r.t.type].map(s => cap(r.verb) + s)];
  return [r.want, ...(L.types || ALL).filter(k => k !== r.t.type).map(k => order(r.verb, k))];
}
// the pieces to build an order with in a level of mode 'build': they go after the verb, in the order they are touched
export function trayOf(L, r) {
  const noun = L.noun || r.named ? [' ' + phrase(r.t)] : [];
  return [...(L.tray || ["-me", "'m", '-la', "'l", '-les', "'ls"]), ...noun];
}
// the keys to write an order with in a level of mode 'type': the letters of the pronouns, and those of the verb when it is typed too
export function keysOf(L, r) {
  const letters = L.full ? [...new Set([...r.verb, ...'mels'])].sort((a, b) => a.localeCompare(b, 'ca')) : [...'mel', 'a', 's'];
  return [...letters, '-', "'"];
}

/* ---------- the levels ---------- */
// sort things into the drawers of their articles; bare shows the noun with no article
const sort = (title, items, bins, bare, say) => ({ kind: 'sort', title, items: items.map(thing), bins, bare, say });
// Orders to give, one for each round. A round is written «verb:key», the verb «dona» when there is none, with «=» in front when
// the order names the thing. mode says how the order is given: 'pick' one of several, 'touch' what an order written on the screen
// will bring, 'build' it out of pieces or 'type' it. In o: types (the kinds of noun the choices of 'pick' come from), spell (the
// choices are ways of writing one order), mix (they name the thing or not), shelf (the things of 'touch' and of free), bare,
// tray and noun (the pieces of 'build'), full (the verb is typed too), free (how many things the child chooses off the shelf),
// verb (the verb of the free ones) and make ([drawing, name] of what the robot builds at the end)
const TITLE = { pick: 'Tria l\'ordre', touch: 'Què donarà?', build: 'Munta l\'ordre', type: 'Escriu l\'ordre' };
function job(mode, rounds, o, say) {
  const rs = rounds.map(s => { const [, eq, verb, key] = /^(=?)(?:([a-zç]+):)?(.+)$/.exec(s); return roundOf(key, verb, !!eq); });
  return { kind: 'job', mode, title: o.make ? `Construeix ${o.make[1]}` : o.free ? 'Tria tu' : TITLE[mode], rounds: rs, ...o, say };
}
const FEM = { types: ['f1', 'f2'] }, MASC = { types: ['m1', 'm2'] };
const NAMES = { tray: ["'m", '-me', ' em'] }, FTRAY = { tray: ['-me', "'m", '-la', '-les'] }, MTRAY = { tray: ['-me', "'m", "'l", "'ls", '-el', '-els'] };

export const SECTIONS = [
  { name: 'El magatzem', sub: 'Endreça cada cosa al calaix del seu article: el, la, els o les.', levels: [
    sort('El i la', ['llibre', 'pilota', 'martell', 'poma'], ['m1', 'f1'], false, 'El robot només troba les coses si són al seu calaix. Mira l\'article de cada cosa i toca el calaix que li toca.'),
    sort('Els i les', ['llibre+', 'poma+', 'guant+', 'galeta+'], ['m2', 'f2'], false, 'Ara n\'hi ha moltes de cada: «els» per als noms masculins i «les» per als femenins.'),
    sort('Quatre calaixos', ['cotxe', 'carta+', 'guitarra', 'dau+', 'sabata+'], ALL, false, 'Quatre calaixos! L\'article ho diu tot: el, la, els o les.'),
    sort('Sense article', ['barret', 'corona', 'rellotge', 'galeta'], ['m1', 'f1'], true, 'Ara el nom ve sense article. Prova de dir «un» o «una» davant: un barret, una corona.'),
    sort('Un o molts', ['caramel+', 'pizza', 'mitjo+', 'bombeta+', 'tambor'], ALL, true, 'Mira el dibuix: n\'hi ha un o n\'hi ha molts? I després: «un» o «una»?'),
    sort('Noms que enganyen', ['paraigua', 'flor', 'mapa', 'clau'], ['m1', 'f1'], true, 'Compte! No tots els noms que acaben en a són femenins. Prova amb «un» o «una».'),
    sort('Amb apòstrof', ['estrella', 'ou', 'orella', 'arbre', 'anell'], ['m1', 'f1'], false, 'Davant de vocal, «el» i «la» es fan «l\'», i l\'article ja no diu si és masculí o femení. Prova amb «un» o «una».'),
    sort('Una sola cosa', ['tisores+', 'pantalons+', 'ulleres+', 'martell', 'llanterna'], ALL, true, 'Unes tisores són una sola eina, però el nom és plural. Digues-ho en veu alta: «les tisores».'),
    sort('Barreja', ['platan+', 'clau+', 'gelat', 'flor+', 'mapa', 'maduixa'], ALL, true, 'De tot una mica. Pensa primer si és un o molts, i després si és masculí o femení.'),
    sort('El gran inventari', ['paraigua+', 'ulleres+', 'ou', 'estrella+', 'pantalons+', 'clau', 'cargol+', 'motxilla'], ALL, true, 'L\'inventari sencer del magatzem: vuit coses, i algunes enganyen.')
  ] },
  { name: 'Dona\'m!', sub: 'Demana una cosa dient-ne el nom: «Dona\'m…».', levels: [
    job('pick', ['=aigua'], {}, 'El robot només entén les ordres ben escrites. Si dius el nom de la cosa, l\'ordre comença per «Dona\'m».'),
    job('pick', ['=pilota'], {}, '«Dona» i «em» s\'enganxen: la e cau i al seu lloc hi queda un apòstrof.'),
    job('pick', ['=pa', '=llanterna'], {}, 'Dues ordres seguides. Busca la que porta l\'apòstrof al lloc de la e.'),
    job('build', ['=poma'], NAMES, 'Ara la muntes tu. Toca la peça que va darrere de «Dona» i després el nom.'),
    job('build', ['=llet', '=llibre'], NAMES, 'Primer el pronom enganxat al verb, i després el nom de la cosa.'),
    job('build', ['=tisores+', '=suc'], NAMES, 'Tant és si la cosa és masculina o femenina: quan dius el nom, sempre és «Dona\'m».'),
    job('type', ['=aigua'], {}, 'Ara l\'escrius tu. L\'apòstrof té la seva tecla.'),
    job('type', ['=galeta+', '=paraigua'], {}, 'Només cal escriure el tros que falta entre «Dona» i el nom.'),
    job('pick', ['=xocolata', '=guant+', '=ou'], {}, 'Tres ordres seguides, sense cap error?'),
    job('type', ['=pizza', '=llapis+', '=estrella'], {}, 'L\'última: tres ordres escrites per tu.')
  ] },
  { name: 'La i les', sub: 'Sense dir el nom: «Dona-me-la!» i «Dona-me-les!».', levels: [
    job('pick', ['pilota'], FEM, 'Si no dius el nom, el canvies per un pronom. «La pilota» es torna «la»: Dona-me-la! Fixa\'t en els guionets.'),
    job('pick', ['poma+'], FEM, '«Les pomes» es torna «les». Quina ordre li toca?'),
    job('pick', ['guitarra', 'galeta+'], FEM, 'Una cosa: «la». Moltes: «les».'),
    job('touch', ['carta+', 'corona'], { shelf: ['corona', 'carta+'] }, 'Ara al revés: llegeix l\'ordre i toca què donarà el robot.'),
    job('pick', ['llanterna'], { spell: true }, 'Compte amb com s\'escriu: amb «la» i «les» hi van dos guionets i cap apòstrof.'),
    job('pick', ['sabata+', 'pizza'], { spell: true }, 'Només una està ben escrita. Mira bé els guionets.'),
    job('build', ['bombeta', 'maduixa+'], FTRAY, 'Munta l\'ordre amb les peces: primer «-me» i després el pronom.'),
    job('build', ['tisores+', 'flor'], FTRAY, 'Unes tisores són una sola eina, però es diu «les tisores».'),
    job('type', ['motxilla', 'pila+'], {}, 'Ara l\'escrius tu. El guionet té la seva tecla.'),
    job('type', ['clau', 'ulleres+', 'estrella'], {}, 'Tres ordres escrites. Compte amb «l\'estrella»: una estrella.')
  ] },
  { name: 'El i els', sub: 'Sense dir el nom: «Dona-me\'l!» i «Dona-me\'ls!».', levels: [
    job('pick', ['llibre'], MASC, '«El llibre» es torna «el». Però «me» i «el» s\'enganxen: la e d\'«el» cau i hi queda un apòstrof. Dona-me\'l!'),
    job('pick', ['llapis+'], MASC, '«Els llapis» es torna «els», i també perd la e: me\'ls.'),
    job('pick', ['martell', 'globus+'], MASC, 'Una cosa: «\'l». Moltes: «\'ls».'),
    job('touch', ['dau+', 'rellotge'], { shelf: ['rellotge', 'dau+'] }, 'Al revés: llegeix l\'ordre i toca què donarà el robot.'),
    job('pick', ['cotxe'], { spell: true }, 'Compte amb com s\'escriu: un guionet davant de «me» i un apòstrof on ha caigut la e.'),
    job('pick', ['caramel+', 'formatge'], { spell: true }, 'Només una està ben escrita. On és l\'apòstrof?'),
    job('build', ['barret', 'mitjo+'], MTRAY, 'Munta l\'ordre. Hi ha peces que enganyen: «el» sencer no hi cap!'),
    job('build', ['pantalons+', 'paraigua'], MTRAY, 'Uns pantalons són una sola peça, però es diu «els pantalons». I «paraigua» és masculí!'),
    job('type', ['gelat', 'guant+'], {}, 'Ara l\'escrius tu, amb el guionet i l\'apòstrof.'),
    job('type', ['mapa', 'cargol+', 'ou'], {}, 'Tres ordres escrites. «Mapa» acaba en a, però és masculí.')
  ] },
  { name: 'Les quatre ordres', sub: 'Dona-me\'l, dona-me-la, dona-me\'ls i dona-me-les, totes barrejades.', levels: [
    job('pick', ['pilota', 'llibre'], {}, 'Ara surten totes quatre. Mira l\'article de la cosa: el, la, els o les.'),
    job('pick', ['poma+', 'llapis+'], {}, '«Els» i «les»: quin porta apòstrof i quin porta guionet?'),
    job('touch', ['llapis+', 'pilota', 'tisores+'], { shelf: ['pilota', 'llapis+', 'tisores+', 'llibre'] }, 'Llegeix l\'ordre i toca què donarà el robot.'),
    job('touch', ['carta+', 'martell', 'guant+'], { shelf: ['martell', 'carta+', 'corona', 'guant+'], bare: true }, 'Ara les coses no porten article: l\'has de pensar tu.'),
    job('pick', ['telefon', 'campana+', 'dau+'], { spell: true }, 'Tres ordres, i de cada una només n\'hi ha una de ben escrita.'),
    job('build', ['coet', 'bicicleta', 'platan+'], {}, 'Totes les peces a la safata. Pensa primer quin article té la cosa.'),
    job('build', ['flor+', 'mapa', 'ulleres+'], {}, 'Tres que enganyen una mica. Prova amb «un» o «una».'),
    job('type', ['tambor', 'galeta+'], {}, 'Ara escrites: amb «el» i «els», apòstrof; amb «la» i «les», guionet.'),
    job('type', ['paraigua', 'clau+', 'pantalons+'], {}, 'Tres ordres escrites, amb noms que enganyen.'),
    job('type', ['estrella', 'ou+', 'tisores+', 'anell'], {}, 'Quatre ordres escrites. Si surten totes a la primera, ja ets comandant de debò!')
  ] },
  { name: 'Altres ordres', sub: 'Porta, passa, compra, deixa… amb nom o sense.', levels: [
    job('pick', ['porta:motxilla', 'passa:llapis+'], {}, 'El truc serveix amb molts verbs: Porta-me-la! Passa-me\'ls!'),
    job('pick', ['compra:gelat', 'deixa:tisores+'], {}, 'Canvia el verb, però els pronoms s\'enganxen igual.'),
    job('touch', ['llança:pilota', 'ensenya:mapa', 'torna:carta+'], { shelf: ['pilota', 'mapa', 'carta+', 'guant+'] }, 'Llegeix l\'ordre i toca la cosa que el robot mourà.'),
    job('pick', ['=compra:pa', 'compra:pa'], { mix: true }, 'Mira el senyal: 🗣 vol dir que dius el nom de la cosa, i 🔇 que no el dius.'),
    job('build', ['=passa:llanterna', 'passa:llanterna'], { noun: true }, 'La mateixa cosa de dues maneres: amb el nom i sense.'),
    job('build', ['=deixa:llibre+', 'busca:ulleres+', 'guarda:caramel+'], { noun: true }, 'Mira bé el senyal de cada ordre abans de muntar-la.'),
    job('type', ['porta:corona', 'envia:carta+'], {}, 'Escriu el tros que falta darrere del verb.'),
    job('type', ['=torna:rellotge', 'torna:rellotge', 'compra:maduixa+'], {}, 'Amb el nom: «\'m». Sense el nom: «-me» i el pronom.'),
    job('type', ['passa:martell'], { full: true }, 'Ara escrius tota l\'ordre, amb el verb i tot.'),
    job('type', ['llança:globus', 'ensenya:estrella+', 'acosta:paraigua+'], { full: true }, 'Tres ordres senceres, de la primera lletra a l\'última.')
  ] },
  { name: 'La gran missió', sub: 'Tria tu què demanes i programa el robot perquè construeixi invents.', levels: [
    job('build', [], { free: 3, shelf: ['pilota', 'llibre+', 'guitarra+', 'barret'] }, 'Ara manes tu! Toca la cosa que vulguis i munta\'n l\'ordre. Fes-ho amb tres coses.'),
    job('type', [], { free: 3, shelf: ['rellotge', 'galeta+', 'campana', 'dau+'] }, 'Tria tres coses, en l\'ordre que vulguis, i escriu l\'ordre de cada una.'),
    job('build', ['pa', 'formatge', 'ou+'], { make: ['🥪', 'un entrepà'] }, 'Un programa és una llista d\'ordres. Dona-les totes bé i el robot farà un entrepà.'),
    job('type', ['cargol+', 'pila+', 'bombeta'], { make: ['🤖', 'un robot petit'] }, 'El robot vol un germà petit! Li calen els cargols, les piles i la bombeta.'),
    job('type', ['ou+', 'llet', 'maduixa+', 'xocolata'], { make: ['🎂', 'un pastís'] }, 'Quatre ordres per fer un pastís. La llet: una sola cosa, femenina.'),
    job('type', [], { free: 3, verb: 'porta', shelf: ['paraigua', 'tisores+', 'clau+', 'mapa'] }, 'Ara amb «Porta». Tria tres coses: totes enganyen una mica!'),
    job('type', ['porta:engranatge+', 'passa:pila+', 'busca:cargol+', 'ensenya:mapa'], { full: true, make: ['🚀', 'un coet'] }, 'Un coet! Escriu cada ordre sencera, amb el seu verb.'),
    job('build', ['=compra:globus+', 'porta:globus+', 'passa:guitarra', '=porta:pastis'], { noun: true, make: ['🎉', 'una festa'] }, 'Per fer una festa: algunes ordres diuen el nom i d\'altres no. Mira el senyal.'),
    job('type', [], { free: 4, verb: 'passa', full: true, shelf: ['corona', 'anell', 'estrella+', 'pantalons+'] }, 'Tria-les totes quatre i escriu cada ordre sencera amb «Passa».'),
    job('type', ['porta:corona', 'llança:estrella+', 'deixa:anell', 'torna:ulleres+', 'guarda:pantalons+'], { full: true, make: ['🏆', 'la copa dels pronoms febles'] }, 'L\'última missió: cinc ordres senceres, cinc verbs. Endavant, comandant!')
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- stars ---------- */

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the laboratory and the concert: a Piscina to get in, a map of three circles, a mark
// for each project, an exam for each circle, XP and badges. A project is one of the sections above, with its ten levels
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'El robot es desperta', projects: [0, 1] },
  { name: 'Les quatre ordres', projects: [2, 3, 4] },
  { name: 'Comandant de robots', projects: [5, 6] }
];
// the progress of the cursus, the same in every game (shared/curs.js): the stars of each level are kept in stars
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, xpOf, levelText, isOpen, examOpen, levelIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: the things the screen of the robot names, and the shelf they are on
export const POOL = ['pilota', 'llapis+', 'tisores+'];
export const POOL_SHELF = ['llibre', 'pilota', 'llapis+', 'tisores+'];

// What is saved is facts only: { so, stars[70], piscina, exams[3], fulls }. Marks, XP, level and badges are worked out, never stored.
// a complete progress inside its limits from any value at all; a new object
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true), fulls: Math.max(0, whole(o.fulls)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: 'Troba bé les errades d\'un full.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: 'Corregeix bé deu fulls d\'errades.' },
  { name: 'Mestre dels pronoms febles', what: 'Supera els tres exàmens.' }
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

// The three things a sheet can say, each { kind, key, named, says, real, opts }: says is the order written on the sheet, real the
// good one (the sheet is wrong when they differ) and opts the three orders to choose from when fixing it. The mistakes are the ones
// a child makes: the pronoun of another kind of noun, a pronoun badly joined, and «em» badly joined in front of a noun
const GIVEN = ['pilota', 'llibre', 'poma+', 'llapis+', 'tisores+', 'martell', 'galeta+', 'guant+', 'flor', 'paraigua', 'corona', 'dau+', 'clau+', 'mapa'];
const NAMED = ['aigua', 'pa', 'llet', 'pilota', 'llibre+', 'tisores+', 'paraigua', 'galeta+'];
const VERBS = ['dona', 'porta', 'passa', 'compra', 'deixa'];
const claim = (key, named, real, wrong, bad, rnd) => ({ key, named, real, says: bad ? wrong[0] : real, opts: shuffle([real, wrong[0], wrong[1]], rnd) });
const CLAIM = {
  form(bad, rnd) {
    const t = thing(GIVEN[at(GIVEN.length, rnd)]), verb = VERBS[at(VERBS.length, rnd)];
    return claim(t.key, false, order(verb, t.type), shuffle(ALL.filter(k => k !== t.type).map(k => order(verb, k)), rnd), bad, rnd);
  },
  spell(bad, rnd) {
    const t = thing(GIVEN[at(GIVEN.length, rnd)]), verb = VERBS[at(VERBS.length, rnd)];
    return claim(t.key, false, order(verb, t.type), shuffle(BAD[t.type].map(s => cap(verb) + s), rnd), bad, rnd);
  },
  named(bad, rnd) {
    const t = thing(NAMED[at(NAMED.length, rnd)]), verb = VERBS[at(VERBS.length, rnd)];
    return claim(t.key, true, naming(verb, t), shuffle(misnamed(verb, t), rnd), bad, rnd);
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
