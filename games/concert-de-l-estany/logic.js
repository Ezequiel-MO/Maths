import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the concert, with no page in it. Fourteen projects of ten levels: reading a score and playing it on tubes,
// cutting the Do tube to a fraction of its length, filling a bar of the drum, counting intervals, the figures that fit in one another
// (and tapping a bar in time), whole songs, chords, more scores in colour, the place of each note on the staff, and scores that lose
// their colours little by little (three times: easy tunes by steps, Star Wars, and tunes played over while they fade), the drum kit, and the
// proportions of the notes of a chord. They are laid out as the cursus of 42 Barcelona, like the abacus and the
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
// a score in colour where dark of the notes, drawn by chance each time it is played (darks, below), are left without their colour
const fade = (title, notes, dark, say) => ({ ...play(title, notes, 1, say), dark });
// the same, but a note only loses its colour next to a note in colour that is the same one or one step away
const near = (title, notes, dark, say) => ({ ...fade(title, notes, dark, say), near: true });
// a score in colour played once for each of rounds, and before each round the share rounds[r] of its notes has gone dark: more and more
const fades = (title, notes, rounds, say) => ({ ...play(title, notes, 1, say), rounds });
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

// The drum kit: a bar cut into 4 beats or into 8 boxes (two to a beat), a row for each drum. A row is [drum, pattern, how], 'x' a hit:
// how is 'given' (drawn already), 'say' (to fill from the words over the grid) or 'ear' (to fill by listening). With live the whole bar
// is drawn and the player plays it on the pads, in time; goal puts words of its own over the grid instead of the ones made from the rows
export const KIT = { bombo: { name: 'Bombo', el: 'el bombo' }, caixa: { name: 'Caixa', el: 'la caixa' }, charles: { name: 'Charles', el: 'el charles' },
  tom1: { name: 'Timbal agut', el: 'el timbal agut' }, tom2: { name: 'Timbal greu', el: 'el timbal greu' } };
const kit = (title, rows, say, more = {}) => ({ kind: 'kit', title, steps: rows[0][1].length, rows: rows.map(([drum, pat, how = 'say']) => ({ drum, hits: [...pat].map(c => c === 'x'), how })), say, ...more });

// Proportions between notes that sound together. A question is one of three: x, the notes of steps vibrating k times their smallest
// numbers (ratio), with the one at ask to find; len, the length of the tube of step when the Do tube measures cm; name, the interval of two notes
const x = (steps, k, ask) => ({ t: 'x', steps, k, ask });
const len = (step, cm) => ({ t: 'len', step, cm });
const nm = (lo, hi) => ({ t: 'name', steps: [lo, hi] });
const prop = (title, qs, say) => ({ kind: 'prop', title, qs, say });
// The answer of a question and the values to choose from, smallest first. The wrong ones are the mistakes that teach: adding what
// the other note gained instead of multiplying, and, for a tube, the fraction turned over (the tube of a higher note is shorter)
export function propQ(q) {
  if (q.t === 'name') return { want: q.steps[1] - q.steps[0] + 1, opts: [8, 5, 4, 3] };
  let want, wrong;
  if (q.t === 'len') {
    const N = NOTES[q.step]; want = q.cm * N.n / N.d;
    wrong = [q.cm * N.d / N.n, q.cm / N.d, want + q.cm / N.d];
  } else {
    const r = ratio(q.steps), v = r.map(n => n * q.k), ref = q.ask === 0 ? 1 : 0;
    want = v[q.ask];
    wrong = [v[ref] + r[q.ask] - r[ref], want + r[q.ask], want * 2, want + Math.abs(r[q.ask] - r[ref])];
  }
  const opts = [want, ...new Set(wrong.filter(w => Number.isInteger(w) && w > 0 && w !== want))].slice(0, 3);
  return { want, opts: opts.sort((a, b) => a - b) };
}

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
  // These came after the others and stay at the end, whatever circle they are in: a save keeps its stars by the place of the project
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
  ] },
  // From nearly all the notes in colour to none: the bridge between the scores in colour and the ones without. The tunes of Star Wars are
  // set on the eight tubes: the Imperial March on La, its second phrase an octave lower, and the first note of the Force theme an octave higher
  { name: 'Cada cop menys colors', sub: 'Les notes van perdent el color a poc a poc. Amb músiques de Star Wars!', levels: [
    fade('Tres notes amigues', '0n 2n 4n 2n | 0n 4n 2b', 1, 'Totes les notes tenen color menys una. Per saber quina és, mira a quina ratlla o a quin espai és.'),
    fade('La marxa imperial', '5n 5n 5n 3c 7c | 5n 3c 7c 5b', 2, 'La música d\'en Darth Vader! Dues notes han perdut el color. Si una nota sense color és al mateix lloc que una de color, és la mateixa nota.'),
    fade('Star Wars', '0b 4b | 3c 2c 1c 7b 4c', 2, 'Així comença Star Wars: un salt de Do a Sol, tres notes que baixen de pressa i el Do agut ben llarg.'),
    fade('Brilla, brilla, estrelleta', '0n 0n 4n 4n | 5n 5n 4b | 3n 3n 2n 2n | 1n 1n 0b', 4, 'Aquesta ja la saps. Quatre notes sense color: fixa\'t si la ratlla els passa pel mig o si són en un espai.'),
    fade('La marxa imperial, segona part', '2n 2n 2n 3c 7c | 5n 3c 7c 5b', 4, 'Ara comença al Mi, a la primera ratlla. Gairebé la meitat de les notes ja no tenen color.'),
    fade('El tema de la Força', 'sb sn 5n | 1b 2n 3c 4c | 3b 5b', 4, 'La música dels Jedi. Entra després dels silencis. Ara hi ha més notes sense color que amb color!'),
    fade('Oda a l\'alegria', '2n 2n 3n 4n | 4n 3n 2n 1n | 0n 0n 1n 2n | 2b 1b', 9, 'Va per graons: si una nota és just un lloc més amunt que la d\'abans, és el tub del costat.'),
    fade('Star Wars, sencera', '0b 4b | 3c 2c 1c 7b 4c | 3c 2c 1c 7b 4c | 3c 2c 3c 1b sc', 12, 'La melodia sencera. Només queden quatre notes de color: fes-les servir per no perdre\'t.'),
    fade('La marxa imperial, sencera', '5n 5n 5n 3c 7c | 5n 3c 7c 5b | 2n 2n 2n 3c 7c | 5n 3c 7c 5b', 15, 'Les dues parts seguides. Recorda: La al segon espai, Fa al primer espai, Do agut al tercer espai.'),
    fade('Star Wars, el gran final', '0b 4b | 3c 2c 1c 7b 4c | 3c 2c 1c 7b 4c | 3c 2c 3c 1b sc', 16, 'Ni un sol color! Ja llegeixes les notes pel lloc on són, com els músics de debò. Que la Força t\'acompanyi!')
  ] },
  // The step before the project above, and easier: tunes that go by steps, where a note without colour always has a note in colour beside it
  // that is the same one or the next one up or down, so it can be read from its neighbour. The colours go from nearly all to about a third
  { name: 'El color del costat', sub: 'Cançons fàcils. La nota sense color sempre té una veïna de color al graó del costat.', levels: [
    near('Do i Re, veïns', '0n 1n 0n 1n | 0n 1n 0b', 1, 'Una nota ha perdut el color. Mira la nota de color del costat: és la mateixa, o la del graó de sobre o de sota?'),
    near('Tres graons', '0n 1n 2n 1n | 0n 1n 2b', 1, 'Do, Re i Mi. La nota sense color és com a molt un graó lluny de la veïna de color: un tub més enllà, o el mateix.'),
    near('Mi, Fa, Sol', '2n 3n 4n 3n | 2n 3n 4b', 2, 'Ara són dues sense color. Si és una mica més amunt que la veïna, és el tub següent, més curt. Si és més avall, el d\'abans.'),
    near('Puja i baixa', '0n 1n 2n 3n | 4n 3n 2n 1n | 0r', 3, 'Cinc notes amunt i cinc avall, graó a graó. Tres no tenen color: de ratlla a espai, i d\'espai a ratlla.'),
    near('Frère Jacques', '0n 1n 2n 0n | 0n 1n 2n 0n | 2n 3n 4b | 2n 3n 4b', 4, 'Aquesta la coneixes! Cada tros es repeteix: el que has llegit una vegada et serveix per a la segona.'),
    near('La Maria tenia un xai', '2n 1n 0n 1n | 2n 2n 2b | 1n 1n 1b | 2n 4n 4b', 5, 'Molts Mi i molts Re seguits. Si la nota sense color és a la mateixa altura que la de color, és la mateixa nota.'),
    near('A dalt de tot', '4n 5n 6n 7n | 7n 6n 5n 4n', 4, 'Les quatre notes de dalt: Sol, La, Si i Do agut. La meitat ja no tenen color.'),
    near('A la llum de la lluna', '0n 0n 0n 1n | 2b 1b | 0n 2n 1n 1n | 0r', 6, 'Una cançó francesa molt tranquil·la. Ara, de cada dues notes, una no té color.'),
    near('Jingle Bells', '2n 2n 2b | 2n 2n 2b | 2n 4n 0n 1n | 2r', 6, 'Gairebé tot són Mi. Les poques notes de color et diuen on ets: compta els graons des d\'allà.'),
    near('Tota l\'escala', '0n 1n 2n 3n | 4n 5n 6n 7n | 7n 6n 5n 4n | 3n 2n 1n 0n', 10, 'L\'última! Tota l\'escala amunt i avall, amb menys colors que mai. Ja saps llegir una nota mirant la del costat.')
  ] },
  // Each tune three times, and before each time more of its notes go dark: the colours of the first round help to read the last one.
  // The tunes are set on the eight tubes: Tetris on Re, Bella ciao on Mi, Old MacDonald and La cucaracha on Do
  { name: 'Els colors s\'apaguen', sub: 'Toca cada cançó tres cops. A cada volta, més notes es tornen negres.', levels: [
    fades('Sol, Mi i La', '4n 4n 2n 5n | 4n 2n 4b', [0, 0.34, 0.67], 'Toca-la tres cops. Abans de cada volta, algunes notes perdran el color: recorda on eren!'),
    fades('Super Mario', '2c 2c sc 2c sc 0c 2n | 4b sb', [0, 0.5, 0.84], 'La música d\'en Mario! Mi, Mi, Mi, Do, Mi, Sol. A la tercera volta gairebé no quedaran colors.'),
    fades('Per molts anys', '0c 0c 1n 0n 3n | 2b 0c 0c 1n | 0n 4n 3b', [0, 0.5, 1], 'La cançó dels aniversaris. A l\'última volta totes les notes seran negres: fixa\'t bé a la primera!'),
    fades('La cucaracha', 'sc 0c 0c 0c 3n 5n | sc 0c 0c 0c 3n 5n | 3c 3c 2c 2c 1c 1c 0n', [0, 0.5, 1], 'Tres Do ràpids i un salt amunt, dues vegades. Després baixa de dos en dos fins al Do.'),
    fades('Old MacDonald', '3n 3n 3n 0n | 1n 1n 0b | 5n 5n 4n 4n | 3r', [0.25, 0.6, 1], 'La cançó de la granja. Ara ja comença amb algunes notes negres.'),
    fades('Rema, rema', '0n 0n 0c 1c 2n | 2n 1c 2c 3n 4n | 7c 7c 4c 4c 2c 2c 0c 0c | 4c 3c 2c 1c 0b', [0.25, 0.6, 1], 'Puja a poc a poc, fa un salt fins al Do agut i baixa de pressa. Les ratlles i els espais et diuen on ets.'),
    fades('Bella ciao', '2c 5c 6c 7c 5b | 2c 5c 6c 7c 5b', [0.3, 0.7, 1], 'Dues vegades el mateix tros: Mi, La, Si, Do agut i La. El que llegeixes al primer et serveix per al segon.'),
    fades('Tetris', '5n 2c 3c 4n 3c 2c | 1n 1c 3c 5n 4c 3c | 2n 2c 3c 4n 5n | 3n 1n 1b', [0.3, 0.7, 1], 'La música del Tetris! Va per graons, amunt i avall, i acaba amb dos Re.'),
    fades('Jingle Bells, sencera', '2n 2n 2b | 2n 2n 2b | 2n 4n 0n 1n | 2r | 3n 3n 3n 3n | 3n 2n 2n 2c 2c | 2n 1n 1n 2n | 1b 4b', [0.5, 0.8, 1], 'La meitat de les notes ja comencen negres. Molts Mi i molts Fa seguits: compta\'ls bé.'),
    fades('Oda a l\'alegria, sencera', '2n 2n 3n 4n | 4n 3n 2n 1n | 0n 0n 1n 2n | 2b 1b | 2n 2n 3n 4n | 4n 3n 2n 1n | 0n 0n 1n 2n | 1b 0b', [0.6, 0.9, 1], 'L\'última! Comença amb pocs colors i acaba sense cap. Llegeix-la com els músics de debò.')
  ] },
  // The drum kit: the bar on a grid, filled from words, by ear or with fractions, and at the end played on the pads
  { name: 'Bombo i caixa', sub: 'Fes ritmes de bateria amb el bombo, la caixa, el charles i els timbals.', levels: [
    kit('El bombo', [['bombo', 'xxxx']], 'El bombo és el tambor gros que es toca amb el peu. Posa un cop de bombo a cada temps del compàs.'),
    kit('Bombo i caixa', [['bombo', 'x.x.'], ['caixa', '.x.x']], 'La caixa és el tambor petit que fa «pam!». El bombo als temps 1 i 3, la caixa als temps 2 i 4: és el ritme del rock!'),
    kit('We will rock you', [['bombo', 'xx..xx..'], ['caixa', '..x...x.']], 'Ara cada temps es parteix en dues caselles: 4 temps fan 8 caselles. Bum, bum, PAM! Bum, bum, PAM!'),
    kit('El charles', [['charles', 'xxxxxxxx'], ['bombo', 'x...x...', 'given'], ['caixa', '..x...x.', 'given']], 'El charles són dos platets que es toquen amb el pal. Aquí toca a totes les caselles: dos cops a cada temps, ti-ti, ti-ti.'),
    kit('Escolta la caixa', [['bombo', 'x.x.', 'given'], ['caixa', '.x.x', 'ear']], 'Ara no et dic on va la caixa. Prem «Escolta el ritme» i posa-la on la sentis.'),
    kit('Els timbals', [['tom1', 'xxxx....'], ['tom2', '....xxxx']], 'Un redoble! El timbal greu és més gran i sona més baix. Quatre cops al timbal agut i, després, quatre al greu.'),
    kit('La meitat i el quart', [['charles', 'x.x.x.x.'], ['bombo', 'x...x...'], ['caixa', '..x...x.', 'given']], 'Amb fraccions: quantes caselles són la meitat de 8? I un quart de 8?',
      { goal: 'El <b>charles</b> toca a <b>1/2</b> de les caselles: una sí i una no, començant per la 1.<br>El <b>bombo</b> toca a <b>1/4</b> de les caselles: la 1 i la del mig del compàs.' }),
    kit('Escolta el bombo', [['charles', 'x.x.x.x.', 'given'], ['caixa', '..x...x.', 'given'], ['bombo', 'x....x..', 'ear']], 'El bombo s\'ha amagat. Escolta el ritme i troba a quines caselles toca: una no és on t\'esperes!'),
    kit('Toca el rock', [['bombo', 'x.x.'], ['caixa', '.x.x']], 'Ara toques tu! Bombo als temps 1 i 3, caixa als temps 2 i 4.', { live: true, ms: 650 }),
    kit('We will rock you, en directe', [['bombo', 'xx..xx..'], ['caixa', '..x...x.']], 'L\'últim! Bum, bum, PAM! amb els teus dits. Picar a temps és el que fa un bon bateria.', { live: true, ms: 340 })
  ] },
  // Why some notes sound well together, in numbers: while Do vibrates 2 times Sol vibrates 3, and if Do vibrates more Sol keeps the proportion
  { name: 'Proporcions dels acords', sub: 'Les notes que sonen bé juntes vibren en proporcions de números petits.', levels: [
    prop('L\'octava, el doble', [x([0, 7], 2, 1), x([0, 7], 3, 1), x([0, 7], 5, 1)], 'Mentre el Do vibra 1 cop, el Do agut en vibra 2: sempre el doble. Si el Do vibra més cops, el Do agut també.'),
    prop('La quinta, 2 i 3', [x([0, 4], 2, 1), x([0, 4], 3, 1), x([0, 4], 5, 1)], 'Per cada 2 vibracions del Do, el Sol en fa 3. Si el Do en fa el doble, el Sol també en fa el doble.'),
    prop('La quarta, 3 i 4', [x([0, 3], 2, 1), x([0, 3], 3, 1), x([0, 3], 4, 1)], 'Per cada 3 vibracions del Do, el Fa en fa 4. Mira per quant s\'ha multiplicat el Do.'),
    prop('La tercera, 4 i 5', [x([0, 2], 2, 1), x([0, 2], 3, 1), x([0, 2], 5, 1)], 'Per cada 4 vibracions del Do, el Mi en fa 5. Els números són més grans, però el truc és el mateix.'),
    prop('Al revés', [x([0, 4], 3, 0), x([0, 7], 7, 0), x([0, 2], 3, 0), x([0, 3], 5, 0)], 'Ara saps la nota de dalt i busques el Do. Per quant s\'ha multiplicat la nota que saps?'),
    prop('L\'acord de Do, 4 : 5 : 6', [x([0, 2, 4], 2, 2), x([0, 2, 4], 3, 1), x([0, 2, 4], 5, 0)], 'Do, Mi i Sol vibren 4, 5 i 6 cops alhora. Si els multipliques tots pel mateix número, l\'acord continua sonant igual de bé.'),
    prop('L\'escala del 24', [x([0, 4], 12, 1), x([0, 3], 8, 1), x([0, 5], 8, 1), x([0, 1], 3, 1)], 'Si el Do vibra 24 cops, totes les notes de l\'escala fan números sencers. Busca per quant s\'ha multiplicat el Do.'),
    prop('Tubs i vibracions', [len(4, 60), len(7, 60), len(3, 60), len(2, 60)], 'Al revés que les vibracions: el Sol vibra 3/2 del Do, però el seu tub fa 2/3 del de Do. Com més curt és el tub, més vibra.'),
    prop('Quin interval és?', [nm(0, 4), nm(0, 7), nm(0, 3), nm(3, 7), nm(0, 2)], 'Mira els números de les vibracions: 1 i 2 és l\'octava, 2 i 3 la quinta, 3 i 4 la quarta, 4 i 5 la tercera.'),
    prop('L\'acord de Fa', [x([3, 5, 7], 8, 1), x([0, 2, 4], 6, 2), x([3, 5, 7], 8, 2), nm(4, 7), len(5, 60)], 'L\'últim! L\'acord de Fa també fa 4 : 5 : 6, com el de Do. Barreja de tot el que has après.')
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- the cursus: circles, projects, marks ---------- */
// a project is one of the sections above, with its ten levels; the circles keep them in the order they were written in
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Notes i tubs', projects: [0, 7, 8, 10, 9, 11, 1] },
  { name: 'Ritme i salts', projects: [2, 12, 3, 4] },
  { name: 'El gran concert', projects: [5, 6, 13] }
];
// the progress of the cursus, the same in every game (shared/curs.js): the stars of each level are kept in stars
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', lists: ['secs'], onLevel: (next, i, idx) => { next.secs[i] = Math.max(next.secs[i], idx + 1); }, badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, xpOf, levelText, isOpen, examOpen, levelIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf };
// the three notes of the Piscina, the first challenges: Do, Mi and Sol
export const POOL = [0, 2, 4];

// What is saved is facts only: { so, secs[14], stars[140], piscina, exams[3], fulls }. secs and stars are the ones the game always kept
// (levels done in each project, best stars of each level), so a save from before the cursus is already a progress: its marks come out
// of its stars. Marks, XP, level and badges are worked out, never stored, so they cannot drift apart.
// A complete progress inside its limits from any value at all; a new object, sharing no list with d. It only ever raises:
// whoever played before the cursus has the Piscina done
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const secs = slots(o.secs, PROJECTS.length).map(s => within(s, 10)), stars = slots(o.stars, LEVELS.length).map(s => within(s, 3));
  return { so: o.so !== false, secs, stars, piscina: o.piscina === true || secs.some(s => s > 0) || stars.some(s => s > 0),
    exams: slots(o.exams, CIRCLES.length).map(e => e === true), fulls: Math.max(0, whole(o.fulls)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: 'Troba bé les errades d\'un full.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: 'Corregeix bé deu fulls d\'errades.' },
  { name: 'Cursus complet', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, p.exams.every(e => e === true)];

/* ---------- the exam and «Caça l'errada» ---------- */
// Chance enters only through rnd (a function like Math.random).
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
// The notes of a score that lose their colour: up to n places of tune that hold a note (never a rest), by chance. With near, a note only
// loses it while every note without colour keeps, just before or just after it, a note in colour at most one step away: there may be fewer than n
export function darks(tune, n, rnd, near) {
  const notes = tune.flatMap(([step], i) => step == null ? [] : [i]), out = new Set();
  const lit = () => notes.every((i, k) => !out.has(i) || [notes[k - 1], notes[k + 1]].some(j => j != null && !out.has(j) && Math.abs(tune[j][0] - tune[i][0]) <= 1));
  for (const i of shuffle(notes.slice(), rnd)) {
    if (out.size >= n) break;
    out.add(i);
    if (near && !lit()) out.delete(i);
  }
  return out;
}
// Six different levels of the projects of circle c, at least one of each project, in a random order. Each is a copy of the level with p,
// its project, and idx added. A score to play is cut to its first six signs and loses its colours and names, and a drill of notes
// is cut to four and a level of proportions to two questions: in an exam there is one try and no help. A circle that does not exist gives the first.
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const draw = p => {
    let idx = at(10, rnd);
    for (let n = 0; n < 10 && used.has(p * 10 + idx); n++) idx = (idx + 1) % 10;   // walk on from a random place, so it ends even if rnd never varies
    used.add(p * 10 + idx);
    const L = PROJECTS[p].levels[idx];
    return { ...L, ...(L.kind === 'play' && { tune: L.tune.slice(0, 6), help: 0, rounds: null }), ...((L.kind === 'spot' || L.kind === 'place') && { n: Math.min(L.n, 4) }),
      ...(L.kind === 'prop' && { qs: L.qs.slice(0, 2) }), p, idx };
  };
  const list = ps.map(draw);
  while (list.length < 6) list.push(draw(ps[at(ps.length, rnd)]));
  return shuffle(list, rnd);
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
