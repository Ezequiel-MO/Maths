// The rules and the data of the concert, with no page in it. Six sections of ten levels: reading a score and playing it on tubes,
// cutting the Do tube to a fraction of its length, filling a bar of the drum, counting intervals, the figures that fit in one another
// (and tapping a bar in time), and whole songs.

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
const taps = (beats, figs, ms, say) => ({ kind: 'drum', title: 'Al tambor', beats, figs: figs.split(' '), ms, say });

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
    taps(4, 'n n n n', 700, 'Quatre negres: un cop a cada temps. Escolta primer i després pica tu.'),
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
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
