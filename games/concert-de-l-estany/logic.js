// The rules and the data of the concert, with no page in it. Three sections of ten levels: reading a score and playing it
// on tubes, cutting the Do tube to a fraction of its length, and filling a bar of the drum with figures and rests.

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
  r: { name: 'rodona', beats: 4 }, b: { name: 'blanca', beats: 2 }, n: { name: 'negra', beats: 1 }, c: { name: 'corxera', beats: 0.5 },
  sb: { name: 'silenci de blanca', beats: 2, rest: true }, sn: { name: 'silenci de negra', beats: 1, rest: true }, sc: { name: 'silenci de corxera', beats: 0.5, rest: true }
};
export const beatsText = v => v === 0.5 ? '½' : String(v);

// '0n 2b sn': the step of the scale and the figure, or a rest on its own
const tune = s => s.split(' ').map(x => FIGS[x] ? [null, x] : [+x[0], x.slice(1)]);
// help 2 writes the name under each note and paints it like its tube, 1 only paints it, 0 leaves the notes white
const play = (title, notes, help, say) => ({ kind: 'play', title, tune: tune(notes), help, say });
const cut = note => ({ kind: 'cut', title: `Fes un ${NOTES[note].name}`, note });
const cm = (note, base, opts) => ({ kind: 'cm', title: `${NOTES[note].name} en cm`, note, base, opts });
// '?' is the figure to find; pal is what the player can choose from
const beat = (beats, figs, pal, say) => ({ kind: 'beat', title: `Compàs de ${beats}`, beats, figs: figs.split(' ').map(x => x === '?' ? null : x), pal: pal.split(' '), say });

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
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
