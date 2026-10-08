// The rules and the data of the concert, with no page in it. Nine projects of ten levels: reading a score and playing it on tubes,
// cutting the Do tube to a fraction of its length, filling a bar of the drum, counting intervals, the figures that fit in one another
// (and tapping a bar in time), whole songs, chords, more scores in colour, and the place of each note on the staff. They are laid out as the cursus of 42 Barcelona, like the abacus and the
// division game: a Piscina to get in, a map of three circles, a mark for each project, an exam for each circle, XP and badges
// (the second half of this file). It must keep importing from Node: nothing of the page, and chance comes in through rnd.

// The scale of Do in just intonation. A tube that is n/d as long as the Do tube sounds d/n times as high:
// len is that length when Do measures 180, the smallest whole numbers that fit them all
const DO = 264;
export const NOTES = [['Do', 1, 1, 0], ['Re', 8, 9, 28], ['Mi', 4, 5, 50], ['Fa', 3, 4, 130], ['Sol', 2, 3, 175], ['La', 3, 5, 215], ['Si', 8, 15, 270], ['Do agut', 1, 2, 325]]
  .map(([name, n, d, hue], i) => ({ name, short: i === 7 ? 'Do↑' : name, n, d, hue, len: 180 * n / d, freq: DO * d / n }));
// where each note sits on the staff, lines and spaces counted from below
export const WHERE = ['sota el pentagrama, amb una ratlleta per a ella sola', 'just sota la primera ratlla', 'a la primera ratlla', 'al primer espai',
  'a la segona ratlla', 'al segon espai', 'a la tercera ratlla', 'al tercer espai'];

// the figures and how many beats each one lasts; the ones that start with s are rests
export const FIGS = {
  r: { name: 'rodona', pl: 'rodones', beats: 4 }, b: { name: 'blanca', pl: 'blanques', beats: 2 }, n: { name: 'negra', pl: 'negres', beats: 1 }, c: { name: 'corxera', pl: 'corxeres', beats: 0.5 },
  sb: { name: 'silenci de blanca', beats: 2, rest: true }, sn: { name: 'silenci de negra', beats: 1, rest: true }, sc: { name: 'silenci de corxera', beats: 0.5, rest: true }
};
export const beatsText = v => v === 0.5 ? '½' : String(v);
// an interval is named after how many notes it holds, both ends counted: Do to Mi is a third
export const INTERVALS = { 2: 'segona', 3: 'tercera', 4: 'quarta', 5: 'quinta', 6: 'sexta', 7: 'sèptima', 8: 'octava' };
const cap = s => s[0].toUpperCase() + s.slice(1);
// How many times each of these notes vibrates in the same stretch of time, in the smallest whole numbers: Do, Mi and Sol give 4, 5 and 6.
// The smaller the numbers, the sooner the waves fall together again, and that is why some notes sound well together
const gcd = (a, b) => b ? gcd(b, a % b) : a, lcm = (a, b) => a / gcd(a, b) * b;
export function ratio(steps) {
  const m = steps.map(s => NOTES[s].n).reduce(lcm), v = steps.map(s => NOTES[s].d * m / NOTES[s].n), g = v.reduce(gcd);
  return v.map(x => x / g);
}

// '0n 2b sn': the step of the scale and the figure, or a rest on its own; a '|' between bars is only there for whoever reads the data
const tune = s => s.split(' ').filter(x => x !== '|').map(x => FIGS[x] ? [null, x] : [+x[0], x.slice(1)]);
// help 2 writes the name under each note and paints it like its tube, 1 only paints it, 0 leaves the notes white
const play = (title, notes, help, say) => ({ kind: 'play', title, tune: tune(notes), help, say });
const cut = note => ({ kind: 'cut', title: `Fes un ${NOTES[note].name}`, note });
const cm = (note, base, opts) => ({ kind: 'cm', title: `${NOTES[note].name} en cm`, note, base, opts });
// '?' is the figure to find; pal is what the player can choose from
const beat = (beats, figs, pal, say) => ({ kind: 'beat', title: `Compàs de ${beats}`, beats, figs: figs.split(' ').map(x => x === '?' ? null : x), pal: pal.split(' '), say });

// from is the note to start on and jump how many steps of the scale to go, up or down
const step = (from, jump, say = '') => ({ kind: 'step', title: `${cap(INTERVALS[Math.abs(jump) + 1])} ${jump > 0 ? 'amunt' : 'avall'}`, from, jump, say });
const fit = (big, small) => ({ kind: 'fit', title: `1 ${FIGS[big].name} = ?`, big, small });
// a bar to tap on the drum; ms is how long a beat lasts
const taps = (beats, figs, ms, say) => ({ kind: 'drum', title: 'Tambor', beats, figs: figs.split(' '), ms, say });

// notes are the tubes of the chord, lowest first
const chord = (name, notes, say) => ({ kind: 'chord', title: `Acord de ${name}`, name, notes, say });
// two groups of notes to listen to and compare; good is the one to choose and why says what the numbers show
const pair = (sets, good, why, say, q = 'Quin grup sona més rodó?') => ({ kind: 'pair', title: 'Compara', sets, good, why, say, q });
// n notes out of set, one at a time and in an order of chance (drill, below): spot shows each one white on the staff, to find its tube;
// place says its name, to put it on the staff
const spot = (title, set, n, say) => ({ kind: 'spot', title, set, n, say });
const place = (title, set, n, say) => ({ kind: 'place', title, set, n, say });
const ALL = [0, 1, 2, 3, 4, 5, 6, 7];

export const SECTIONS = [
  { name: 'Llegeix i toca', sub: 'Llegeix la partitura i toca-la amb els tubs.', levels: [
    play('Tres graons', '0n 1n 2b', 2, 'Toca els tubs en l\'ordre de la partitura. Com més amunt és la nota, més agut sona.'),
    play('Amunt', '0n 1n 2n sn 2n 3n 4n sn', 2, 'El signe que sembla un llamp és un silenci: allà no es toca. El tub més llarg fa el so més greu.'),
    play('Avall', '4n 3n 2n 1n 0b sb', 2, 'Ara la melodia baixa: cada nota és un graó més avall, i el seu tub, una mica més llarg.'),
    play('Frère Jacques', '0n 1n 2n 0n 0n 1n 2n 0n', 1, 'Aquesta cançó la coneixes! Ja no hi ha noms, però cada nota té el color del seu tub.'),
    play('Frère Jacques, segona part', '2n 3n 4b 2n 3n 4b', 1, 'La nota buida és una blanca: dura 2 temps, el doble que una negra.'),
    play('Brilla, brilla, estrelleta', '0n 0n 4n 4n 5n 5n 4b', 1, 'Compte amb el salt de Do a Sol: quatre graons de cop!'),
    play('L\'estrelleta baixa', '3n 3n 2n 2n 1n 1n 0b', 1, 'La línia que talla el pentagrama separa els compassos: a cada compàs hi caben 4 temps.'),
    play('Oda a l\'alegria', '2n 2n 3n 4n 4n 3n 2n 1n', 0, 'Ara les notes són blanques i negres, sense colors. Mira a quina ratlla o a quin espai són.'),
    play('Oda a l\'alegria, el final', '0n 0n 1n 2n 1b 0b', 0, 'Les ratlles es compten des de baix: Mi a la primera, Sol a la segona, Si a la tercera.'),
    play('L\'escala sencera', '0n 1n 2n 3n 4n 5n 6n 7n', 0, 'Vuit notes, de Do a Do agut. L\'últim tub fa just la meitat que el primer!')
  ] },
  { name: 'Talla el tub', sub: 'Un tub més curt sona més agut. Quant l\'has de tallar?', levels: [
    cut(7), cut(4), cut(3), cm(7, 24, [8, 12, 6]), cm(4, 30, [10, 20, 15]),
    cut(2), cut(5), cm(3, 40, [10, 30, 20]), cm(2, 50, [40, 10, 45]), cm(5, 45, [9, 30, 27])
  ] },
  { name: 'La bateria', sub: 'Omple el compàs amb cops i silencis.', levels: [
    beat(4, 'n n n ?', 'n b r', 'El compàs de 4 vol 4 temps justos. Una negra val 1 temps. Quina figura hi falta?'),
    beat(4, 'b ?', 'n b r', 'Una blanca val 2 temps: com dues negres.'),
    beat(4, 'n ? n', 'n b r', 'La figura que falta pot ser al mig. Mira quin forat queda a la barra.'),
    beat(4, 'b sn ?', 'n b sn sb', 'El silenci de negra també val 1 temps: és 1 temps sense cop.'),
    beat(4, 'sn n ?', 'n b sb c', 'Pots acabar el compàs amb un cop llarg o amb un silenci llarg: tots dos valen igual.'),
    beat(4, 'c c n ?', 'c n b r', 'La corxera val mig temps: dues corxeres fan 1 temps.'),
    beat(4, 'n c ? b', 'c n b sc', 'Ara falta un tros ben petit. Quant val?'),
    beat(3, 'n ?', 'c n b r', 'Compte: aquest compàs és de 3! Només hi caben 3 temps.'),
    beat(3, 'c c sn ?', 'c n b sn', 'Compàs de 3 amb corxeres i un silenci. Suma a poc a poc.'),
    beat(4, 'c sc n c ? n', 'c n b sc', 'L\'últim! Mig i mig fan 1. Quant falta fins a 4?')
  ] },
  { name: 'Graons i salts', sub: 'De nota a nota: segones, terceres, quintes i octaves.', levels: [
    step(0, 1, 'Una segona és la nota del costat. Es compten les dues: la de sortida és l\'1.'),
    step(0, 2, 'Una tercera té 3 notes: la de sortida, una al mig i la d\'arribada.'),
    step(2, 2, 'La tercera pot començar a qualsevol nota. Compta 3 notes des del Mi.'),
    step(0, 4, 'La quinta té 5 notes. És el salt de «Brilla, brilla, estrelleta».'),
    step(0, 3, 'La quarta té 4 notes. Compta-les amb els tubs.'),
    step(4, -2, 'Ara cap avall: compta 3 notes baixant des del Sol.'),
    step(4, -4, 'Una quinta avall des del Sol. On arribes?'),
    step(0, 7, 'L\'octava té 8 notes: arribes a una nota que es diu igual!'),
    step(4, 3, 'Una quarta amunt des del Sol. Compta fins a 4.'),
    step(7, -5, 'L\'última: una sexta avall des del Do agut. Són 6 notes.')
  ] },
  { name: 'El doble i la meitat', sub: 'Quantes negres caben en una rodona? Compta-ho i pica-ho al tambor.', levels: [
    fit('r', 'b'), fit('b', 'n'),
    taps(4, 'n n n n', 700, 'Aquí toques tu el tambor! Quatre negres: un cop a cada temps.'),
    fit('n', 'c'),
    taps(4, 'n n b', 700, 'La blanca dura 2 temps: un sol cop i esperes.'),
    fit('r', 'n'),
    taps(4, 'n sn n sn', 700, 'Al silenci no es pica: mans enlaire!'),
    fit('b', 'c'),
    taps(4, 'c c n c c n', 800, 'Dues corxeres van el doble de ràpid que una negra: ti-ti, ta.'),
    taps(4, 'n c c sn n', 800, 'De tot una mica: ta, ti-ti, silenci, ta.')
  ] },
  { name: 'El gran concert', sub: 'Cançons que coneixes, senceres.', levels: [
    play('Hot Cross Buns', '2n 1n 0b | 2n 1n 0b | 0c 0c 0c 0c 1c 1c 1c 1c | 2n 1n 0b', 1, 'Tres notes i prou: Mi, Re, Do. Les corxeres van el doble de ràpid.'),
    play('A la clara lluna', '0n 0n 0n 1n | 2b 1b | 0n 2n 1n 1n | 0r', 1, 'Una cançó francesa de fa molts anys. Acaba amb una rodona: 4 temps!'),
    play('Mary tenia un xai', '2n 1n 0n 1n | 2n 2n 2b | 1n 1n 1b | 2n 4n 4b | 2n 1n 0n 1n | 2n 2n 2n 2n | 1n 1n 2n 1n | 0r', 1, 'La partitura és llarga: va passant sola mentre toques.'),
    play('Frère Jacques amb corxeres', '0n 1n 2n 0n | 0n 1n 2n 0n | 2n 3n 4b | 2n 3n 4b | 4c 5c 4c 3c 2n 0n | 4c 5c 4c 3c 2n 0n', 1, 'Ara amb el tros de les campanes: quatre corxeres seguides.'),
    play('Brilla, brilla, estrelleta', '0n 0n 4n 4n | 5n 5n 4b | 3n 3n 2n 2n | 1n 1n 0b | 4n 4n 3n 3n | 2n 2n 1b | 4n 4n 3n 3n | 2n 2n 1b | 0n 0n 4n 4n | 5n 5n 4b | 3n 3n 2n 2n | 1n 1n 0b', 1, 'Sencera! Fixa\'t que el final és igual que el principi.'),
    play('El pont de Londres', '4n 5n 4n 3n | 2n 3n 4b | 1n 2n 3b | 2n 3n 4b | 4n 5n 4n 3n | 2n 3n 4b | 1b 4b | 2n 0b sn', 1, 'Comença al Sol i es mou per graons, gairebé sense salts.'),
    play('When the Saints', 'sn 0n 2n 3n | 4r | sn 0n 2n 3n | 4r | sn 0n 2n 3n | 4b 2b | 0b 2b | 1r', 0, 'Sense colors! Cada frase comença amb un silenci: respira i entra.'),
    play('Oda a l\'alegria', '2n 2n 3n 4n | 4n 3n 2n 1n | 0n 0n 1n 2n | 2b 1b | 2n 2n 3n 4n | 4n 3n 2n 1n | 0n 0n 1n 2n | 1b 0b', 0, 'La melodia de Beethoven, sencera. Va gairebé sempre per graons.'),
    play('Jingle Bells', '2n 2n 2b | 2n 2n 2b | 2n 4n 0n 1n | 2r | 3n 3n 3n 3n | 3n 2n 2n 2c 2c | 2n 1n 1n 2n | 1b 4b', 0, 'Molts Mi seguits: mira bé quants n\'hi ha a cada compàs.'),
    play('Can-can', '0b 1c 3c 2c 1c | 4n 4n 4c 5c 2c 3c | 1n 1n 1c 3c 2c 1c | 0c 7c 6c 5c 4c 3c 2c 1c | 0r', 0, 'El gran final! L\'últim compàs baixa tota l\'escala amb vuit corxeres.')
  ] },
  { name: 'Acords', sub: 'Tres notes alhora: per què unes sonen bé i unes altres xoquen?', levels: [
    chord('Do', [0, 2, 4], 'Un acord són 3 notes que sonen alhora. La recepta: una nota sí, una no. Comença pel Do.'),
    pair([[0, 2, 4], [0, 1, 2]], 0, 'Do, Mi i Sol vibren 4, 5 i 6 cops; Do, Re i Mi, 8, 9 i 10. Amb números petits les ones es troben més sovint, i l\'orella ho sent rodó.', 'Escolta els dos grups i mira els punts: cada punt és una vibració.'),
    chord('Fa', [3, 5, 7], 'La mateixa recepta, començant pel Fa: una nota sí, una no.'),
    pair([[3, 4, 5], [3, 5, 7]], 1, 'Fa, La i Do agut fan 4, 5 i 6: el mateix dibuix que Do, Mi i Sol! Fa, Sol i La fan 8, 9 i 10, i xoquen.', 'Quin dels dos té els números més petits?'),
    chord('Mi', [2, 4, 6], 'Ara des del Mi. Aquest acord sona diferent: escolta\'l bé.'),
    pair([[2, 4, 6], [2, 3, 4]], 0, 'Mi, Sol i Si fan 10, 12 i 15; Mi, Fa i Sol, 15, 16 i 18. Les notes de costat sempre donen números grans, i xoquen.', 'Tres notes de costat o una sí i una no?'),
    pair([[0, 5, 6], [0, 4, 7]], 1, 'Do, Sol i Do agut fan 2, 3 i 4: els números més petits de tots. Les ones es troben a cada moment!', 'Un dels dos grups té una quinta i una octava.'),
    chord('Do gran', [0, 2, 4, 7], 'Quatre notes: l\'acord de Do i, a dalt de tot, el Do agut.'),
    pair([[0, 3, 5], [0, 3, 6]], 0, 'Do, Fa i La fan 3, 4 i 5. Canviant només el La pel Si surten 24, 32 i 45: un sol tub ho espatlla tot.', 'Els dos grups només canvien en una nota.'),
    pair([[2, 4, 6], [0, 2, 4]], 1, 'Tots dos sonen bé. El de 4, 5 i 6 és un acord major, alegre; el de 10, 12 i 15 és menor, més fosc i trist.', 'Els dos són acords de debò. Escolta\'n el caràcter.', 'Quin acord sona més alegre?')
  ] },
  // These two came after the others and stay at the end, whatever circle they are in: a save keeps its stars by the place of the project
  { name: 'Més notes de colors', sub: 'Més partitures amb les notes pintades com els tubs.', levels: [
    play('Do, Re, Mi', '0n 1n 2n 1n | 0n 2n 0b', 1, 'Cada nota té el color del seu tub. Mira el color, mira on és la nota i toca.'),
    play('Mi, Fa, Sol', '2n 3n 4n 3n | 2n 4n 2b', 1, 'Tres notes més amunt: Mi, Fa i Sol. Com més amunt és la nota, més curt és el tub.'),
    play('Puja i baixa', '0n 1n 2n 3n | 4n 3n 2n 1n | 0r', 1, 'Cinc notes amunt i cinc avall, graó a graó. Acaba amb una rodona.'),
    play('Salts de colors', '0n 2n 4n 2n | 0n 4n 0b', 1, 'Ara amb salts: de Do a Mi, de Mi a Sol. Fixa\'t que totes tres notes tenen una ratlla.'),
    play('A dalt de tot', '4n 5n 6n 7n | 7n 6n 5n 4n', 1, 'Les quatre notes de dalt: Sol, La, Si i Do agut. El Si i el Do agut tenen el pal cap avall.'),
    play('Hänschen klein', '4n 2n 2b | 3n 1n 1b | 0n 1n 2n 3n | 4n 4n 4b', 1, 'Una cançó alemanya que canten els nens petits. Comença baixant de Sol a Mi.'),
    play('Oda a l\'alegria', '2n 2n 3n 4n | 4n 3n 2n 1n | 0n 0n 1n 2n | 2b 1b', 1, 'La melodia de Beethoven, ara amb colors. Va gairebé sempre per graons.'),
    play('When the Saints', 'sn 0n 2n 3n | 4r | sn 0n 2n 3n | 4r', 1, 'Cada frase comença amb un silenci i acaba amb un Sol ben llarg.'),
    play('Jingle Bells', '2n 2n 2b | 2n 2n 2b | 2n 4n 0n 1n | 2r', 1, 'Molts Mi seguits, tots del mateix color. Compta\'ls bé!'),
    play('Amunt i avall', '0n 1n 2n 3n | 4n 5n 6n 7n | 7n 6n 5n 4n | 3n 2n 1n 0n', 1, 'Tota l\'escala, de Do a Do agut i tornar. Tots els colors, un darrere l\'altre.')
  ] },
  { name: 'Cada nota al seu lloc', sub: 'Ratlles i espais: on viu cada nota del pentagrama?', levels: [
    spot('Ratlles', [2, 4, 6], 6, 'Mi, Sol i Si viuen a les ratlles: la ratlla els passa pel mig. Mi a la primera, Sol a la segona, Si a la tercera. Toca el tub de cada nota.'),
    spot('Espais', [3, 5, 7], 6, 'Fa, La i Do agut viuen als espais, entre dues ratlles: Fa al primer, La al segon, Do agut al tercer.'),
    spot('A baix de tot', [0, 1, 2], 6, 'El Do té una ratlleta per a ell sol. El Re penja just sota la primera ratlla. I el Mi ja és a la primera ratlla.'),
    place('Posa a les ratlles', [2, 4, 6], 4, 'Ara al revés: jo dic la nota i tu la poses. Toca el pentagrama on va i prem «Aquí!». Aquestes tres van a les ratlles.'),
    place('Posa als espais', [3, 5, 7], 4, 'Aquestes tres van als espais: Fa al primer, La al segon, Do agut al tercer.'),
    spot('De Do a Sol', [0, 1, 2, 3, 4], 8, 'Pujant per l\'escala, les notes van fent ratlla, espai, ratlla, espai.'),
    place('Posa de Do a Sol', [0, 1, 2, 3, 4], 5, 'Les cinc primeres notes, cadascuna al seu lloc. El Do, a la seva ratlleta de sota.'),
    spot('Totes vuit', ALL, 10, 'Totes les notes, barrejades. No comptis des de baix: mira la ratlla o l\'espai i ja ho saps!'),
    place('Posa-les totes', ALL, 6, 'Qualsevol de les vuit notes. Pensa primer: va a una ratlla o a un espai?'),
    spot('A tota velocitat', ALL, 14, 'L\'últim! Catorze notes seguides. Al final veuràs quants segons has trigat: pots tornar-hi per anar més de pressa.')
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;

/* ---------- the cursus: circles, projects, marks ---------- */
// a project is one of the sections above, with its ten levels; the circles keep them in the order they were written in
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Notes i tubs', projects: [0, 7, 8, 1] },
  { name: 'Ritme i salts', projects: [2, 3, 4] },
  { name: 'El gran concert', projects: [5, 6] }
];
export const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
// the three notes of the Piscina, the first challenges: Do, Mi and Sol
export const POOL = [0, 2, 4];
// the ten levels of a project are three exercises: ex00 (three levels), ex01 (three) and ex02 (four)
export const exOf = idx => idx < 3 ? 0 : idx < 6 ? 1 : 2;
// What a level gives to the mark of its project, by its stars: 10 with no slip, 8 with one or two, 5 with more. Ten levels make 100,
// and a project is validated with 80: every level done with two stars, or eight of them with three
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;

// What is saved is facts only: { so, secs[9], stars[90], piscina, exams[3], fulls }. secs and stars are the ones the game always kept
// (levels done in each project, best stars of each level), so a save from before the cursus is already a progress: its marks come out
// of its stars. Marks, XP, level and badges are worked out, never stored, so they cannot drift apart.
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// A complete progress inside its limits from any value at all; a new object, sharing no list with d. It only ever raises:
// whoever played before the cursus has the Piscina done
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const secs = slots(o.secs, PROJECTS.length).map(s => within(s, 10)), stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, secs, stars, piscina: o.piscina === true || secs.some(s => s > 0) || stars.some(s => s > 0),
    exams: slots(o.exams, CIRCLES.length).map(e => e === true), fulls: Math.max(0, whole(o.fulls)) };
}
const copy = p => ({ ...p, secs: p.secs.slice(), stars: p.stars.slice(), exams: p.exams.slice() });
// the functions below take a progress that is already clean
export const noteOf = (p, i) => p.stars.slice(i * 10, i * 10 + 10).reduce((s, n) => s + POINTS[n], 0);
const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 1370 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 9,13
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina and the others with the exam before them, and only when the circle before is open too
export const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: 'Troba bé les errades d\'un full.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: 'Corregeix bé deu fulls d\'errades.' },
  { name: 'Cursus complet', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, p.exams.every(e => e === true)];
const earned = (p, next) => { const had = badges(p), now = badges(next); return BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name); };

// A level done, with its slips (a hint is a slip too). Returns { prog, n, note, gain, valid, exam, news }: prog is a NEW progress
// (p is never touched) that keeps the best stars of the level; n the stars of this time; note the mark of the project after it;
// gain the XP it adds; valid whether the project is validated by this very level, and exam whether that opens the exam of its circle;
// news the names of the badges it earns.
export function levelIn(p, i, idx, slips) {
  const n = starsFor(slips), k = i * 10 + idx, next = copy(p), c = circleOf(i);
  next.stars[k] = Math.max(next.stars[k], n); next.secs[i] = Math.max(next.secs[i], idx + 1);
  return { prog: next, n, note: noteOf(next, i), gain: xpOf(next) - xpOf(p), valid: noteOf(p, i) < VALID && noteOf(next, i) >= VALID,
    exam: !examOpen(p, c) && examOpen(next, c), news: earned(p, next) };
}

/* ---------- the exam and «Caça l'errada» ---------- */
// Chance enters only through rnd (a function like Math.random). A whole number below n; clamped, so a rnd that returns 1 (or nonsense) still lands inside.
const at = (n, rnd) => Math.min(n - 1, Math.max(0, Math.floor(rnd() * n) || 0));
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// The n notes of a drill: the set over and over, shuffled each time, so every note comes up and none comes twice in a row
export function drill(set, n, rnd) {
  const out = [];
  while (out.length < n) {
    const bag = shuffle(set.slice(), rnd);
    if (bag.length > 1 && bag[0] === out.at(-1)) bag.push(bag.shift());
    out.push(...bag);
  }
  return out.slice(0, n);
}
// Six different levels of the projects of circle c, at least one of each project, in a random order. Each is a copy of the level with p,
// its project, and idx added. A score to play is cut to its first six signs and loses its colours and names, and a drill of notes
// is cut to four: in an exam there is one try and no help. A circle that does not exist gives the first.
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const draw = p => {
    let idx = at(10, rnd);
    for (let n = 0; n < 10 && used.has(p * 10 + idx); n++) idx = (idx + 1) % 10;   // walk on from a random place, so it ends even if rnd never varies
    used.add(p * 10 + idx);
    const L = PROJECTS[p].levels[idx];
    return { ...L, ...(L.kind === 'play' && { tune: L.tune.slice(0, 6), help: 0 }), ...((L.kind === 'spot' || L.kind === 'place') && { n: Math.min(L.n, 4) }), p, idx };
  };
  const list = ps.map(draw);
  while (list.length < 6) list.push(draw(ps[at(ps.length, rnd)]));
  return shuffle(list, rnd);
}
// The hand-in of a finished exam. qs are its six questions and run one boolean per question (true: right at the one try).
// Returns { prog, good, score, gain, redo, news }: prog is a NEW progress with exams[c] set when the exam passes (EXAM_PASS of 6,
// six answers, the exam open) and left alone otherwise, so a pass is never taken back; gain the XP that adds (50 once);
// redo the projects (indexes, each once, in order) of the questions missed; news the names of the badges it earns.
export function examIn(p, c, qs, run) {
  const score = run.filter(r => r === true).length, good = run.length === 6 && score >= EXAM_PASS && examOpen(p, c), next = copy(p);
  if (good) next.exams[c] = true;
  return { prog: next, good, score, gain: xpOf(next) - xpOf(p), news: earned(p, next),
    redo: [...new Set(qs.flatMap((q, i) => run[i] !== true && Number.isInteger(q?.p) ? [q.p] : []))].sort((a, b) => a - b) };
}

// beats as words: 4, ½, 3 i ½
export const temps = v => Number.isInteger(v) ? String(v) : v < 1 ? '½' : `${Math.floor(v)} i ½`;
// The four things a sheet can say, each { kind, says, real, opts, ... }: says is the value written on the sheet, real the true one
// (the claim is wrong when they differ) and opts the values to choose from when fixing it. The mistakes are the ones that teach:
// a bar with a beat too many or too few, a tube with the top number of its fraction forgotten, an interval counted without
// the note it starts on, and a figure that fits another number of times.
const three = a => [...new Set(a)].slice(0, 3).sort((x, y) => x - y);
const CLAIM = {
  // a bar said to hold 3 or 4 beats: figures drawn until they add up to what it really holds
  bar(bad, rnd) {
    const says = [4, 4, 3][at(3, rnd)], real = bad ? says + [-1, -0.5, 0.5, 1][at(4, rnd)] : says, figs = [];
    for (let sum = 0; sum < real;) { const f = ['b', 'n', 'n', 'c', 'c', 'sn'][at(6, rnd)]; if (sum + FIGS[f].beats <= real) { figs.push(f); sum += FIGS[f].beats; } }
    return { figs, says, real, opts: three([says, real, ...shuffle([says - 1, says + 1, says - 0.5, says + 0.5], rnd)]) };
  },
  // the length of a tube when Do measures base: the wrong one is a single piece (40 : 4 = 10) for a tube that keeps several (3 of them, 30)
  tube(bad, rnd) {
    const note = (bad ? [2, 3, 4, 5] : [2, 3, 4, 5, 7])[at(bad ? 4 : 5, rnd)], N = NOTES[note], piece = [4, 5, 6, 10][at(4, rnd)], base = piece * N.d, real = piece * N.n;
    return { note, base, says: bad ? piece : real, real, opts: three([real, piece, base - real, real + piece, base, base + piece]) };
  },
  // the name of the interval between two notes, as how many notes it holds; the wrong one leaves out the note it starts on
  step(bad, rnd) {
    const from = at(8, rnd); let to = at(7, rnd); if (to >= from) to++;
    const real = Math.abs(to - from) + 1, says = bad ? (real > 2 ? real - 1 : real + 1) : real, lo = Math.min(6, Math.max(2, real - 1));
    return { from, to, says, real, opts: [lo, lo + 1, lo + 2] };
  },
  // how many of the short figure fit in the long one
  fit(bad, rnd) {
    const [big, small, real] = [['r', 'b', 2], ['b', 'n', 2], ['n', 'c', 2], ['r', 'n', 4], ['b', 'c', 4], ['r', 'c', 8]][at(6, rnd)];
    return { big, small, real, says: bad ? [2, 3, 4, 8].filter(v => v !== real)[at(3, rnd)] : real, opts: [2, 3, 4, 8] };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
// The hand-in of a finished sheet. run has one boolean per claim (true: judged right, with the fix chosen when it was wrong).
// Returns { prog, good, gain, missed, news }: prog is a NEW progress with fulls + 1 only when all three are right; gain the XP that
// adds (0 once the cap of 3 per validated project is reached); missed the places judged wrong; news the names of the badges it earns.
export function sheetIn(p, run) {
  const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3, next = copy(p);
  if (good) next.fulls = p.fulls + 1;
  return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: earned(p, next) };
}
