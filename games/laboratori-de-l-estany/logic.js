import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the laboratory, with no page in it. Eight sections of ten levels: the kitchen first (litres and grams in
// the fridge, and real recipes for more or fewer people), then filling a cylinder to a percentage and juices and salt water, and the
// chemistry at the end: finding elements on the table and building atoms, joining atoms into molecules, reactions, and experiments
// that chain a percentage, a sum and a proportion. It must keep importing from Node.

/* ---------- the elements ---------- */
// the families, each with its colour on the table
export const GROUPS = { nm: ['no-metall', 140], gn: ['gas noble', 285], al: ['metall alcalí', 350], at: ['metall alcalinoterri', 28], sm: ['semimetall', 175], me: ['metall', 205], ha: ['halogen', 62] };
// number of protons, symbol, name, family, and something a child knows it from. The first twenty in the order of the table,
// and eight famous metals from further on
export const ELEMENTS = [
  [1, 'H', 'hidrogen', 'nm', "L'element més lleuger, i el que més abunda a l'univers."], [2, 'He', 'heli', 'gn', 'El gas que fa volar els globus.'],
  [3, 'Li', 'liti', 'al', 'És a les bateries dels mòbils.'], [4, 'Be', 'beril·li', 'at', 'Un metall lleuger i molt dur.'],
  [5, 'B', 'bor', 'sm', 'Fa més resistent el vidre de laboratori.'], [6, 'C', 'carboni', 'nm', 'És al carbó, als diamants i a tots els éssers vius.'],
  [7, 'N', 'nitrogen', 'nm', "Gairebé quatre cinquenes parts de l'aire."], [8, 'O', 'oxigen', 'nm', 'El gas que respirem per viure.'],
  [9, 'F', 'fluor', 'ha', "N'hi ha a la pasta de dents."], [10, 'Ne', 'neó', 'gn', 'Fa brillar els rètols lluminosos.'],
  [11, 'Na', 'sodi', 'al', 'És a la sal de cuina.'], [12, 'Mg', 'magnesi', 'at', 'Crema amb una llum blanca molt forta.'],
  [13, 'Al', 'alumini', 'me', 'El metall de les llaunes de refresc.'], [14, 'Si', 'silici', 'sm', 'És a la sorra i als xips dels ordinadors.'],
  [15, 'P', 'fòsfor', 'nm', 'Ajuda a encendre els llumins.'], [16, 'S', 'sofre', 'nm', 'Un sòlid groc que surt dels volcans.'],
  [17, 'Cl', 'clor', 'ha', "Neteja l'aigua de les piscines."], [18, 'Ar', 'argó', 'gn', 'El gas de dins de moltes bombetes.'],
  [19, 'K', 'potassi', 'al', "N'hi ha molt als plàtans."], [20, 'Ca', 'calci', 'at', 'Fa forts els ossos i les dents.'],
  [26, 'Fe', 'ferro', 'me', 'El metall dels claus i dels imants.'], [29, 'Cu', 'coure', 'me', 'El metall vermellós dels fils elèctrics.'],
  [30, 'Zn', 'zinc', 'me', 'Protegeix el ferro del rovell.'], [47, 'Ag', 'plata', 'me', 'Un metall brillant de joies i coberts.'],
  [50, 'Sn', 'estany', 'me', "Sí: l'estany també és un metall!"], [79, 'Au', 'or', 'me', 'El metall groc de les joies, que no es rovella mai.'],
  [80, 'Hg', 'mercuri', 'me', "L'únic metall que és líquid."], [82, 'Pb', 'plom', 'me', 'Un metall tou i molt pesant.']
].map(([z, sym, name, group, fact]) => ({ z, sym, name, group, fact }));
export const el = sym => ELEMENTS.find(e => e.sym === sym);
export const byZ = z => ELEMENTS.find(e => e.z === z);
// where each one sits: eight columns, as the short table; the famous metals are a row of their own (row 5)
export const placeOf = e => e.z > 20 ? [5, ELEMENTS.indexOf(e) - 19] : e.z === 1 ? [1, 1] : e.z === 2 ? [1, 8] : [Math.floor((e.z - 3) / 8) + 2, (e.z - 3) % 8 + 1];
// the electrons of each shell of an atom with z protons: filled in order up to calcium, and written out for the famous metals
const HEAVY = { 26: [2, 8, 14, 2], 29: [2, 8, 18, 1], 30: [2, 8, 18, 2], 47: [2, 8, 18, 18, 1], 50: [2, 8, 18, 18, 4], 79: [2, 8, 18, 32, 18, 1], 80: [2, 8, 18, 32, 18, 2], 82: [2, 8, 18, 32, 18, 4] };
export const shells = z => HEAVY[z] || [2, 8, 8, 2].map((cap, i) => Math.max(0, Math.min(cap, z - [0, 2, 10, 18][i]))).filter(Boolean);
// the neutrons of the most common atom of each element
const NEUTRONS = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 8, 9: 10, 10: 10, 11: 12, 12: 12, 13: 14, 14: 14, 15: 16, 16: 16, 17: 18, 18: 22, 19: 20, 20: 20, 26: 30, 29: 34, 30: 35, 47: 60, 50: 70, 79: 118, 80: 122, 82: 126 };
export const neutronsOf = z => NEUTRONS[z];
const vowel = s => /^[aeiouhàèéíòóú]/i.test(s);
export const the = n => vowel(n) ? `l'${n}` : n === 'plata' ? 'la plata' : `el ${n}`;
export const de = n => vowel(n) ? `d'${n}` : `de ${n}`;

/* ---------- the molecules ---------- */
// f is the formula, in the order it is written; at where each atom is drawn (symbol, x, y) and bonds which ones are joined
export const MOLS = {
  C: { name: 'carboni', f: [['C', 1]], at: [['C', 0, 0]], bonds: [] },
  Na: { name: 'sodi', f: [['Na', 1]], at: [['Na', 0, 0]], bonds: [] },
  H2: { name: 'hidrogen', f: [['H', 2]], at: [['H', -8, 0], ['H', 8, 0]], bonds: [[0, 1]] },
  O2: { name: 'oxigen', f: [['O', 2]], at: [['O', -10, 0], ['O', 10, 0]], bonds: [[0, 1]] },
  N2: { name: 'nitrogen', f: [['N', 2]], at: [['N', -10, 0], ['N', 10, 0]], bonds: [[0, 1]] },
  Cl2: { name: 'clor', f: [['Cl', 2]], at: [['Cl', -11, 0], ['Cl', 11, 0]], bonds: [[0, 1]] },
  H2O: { name: 'aigua', f: [['H', 2], ['O', 1]], at: [['H', -16, 9], ['O', 0, -3], ['H', 16, 9]], bonds: [[0, 1], [1, 2]] },
  CO2: { name: 'diòxid de carboni', f: [['C', 1], ['O', 2]], at: [['O', -22, 0], ['C', 0, 0], ['O', 22, 0]], bonds: [[0, 1], [1, 2]] },
  CH4: { name: 'metà', f: [['C', 1], ['H', 4]], at: [['C', 0, 0], ['H', -15, -13], ['H', 15, -13], ['H', -15, 13], ['H', 15, 13]], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] },
  NH3: { name: 'amoníac', f: [['N', 1], ['H', 3]], at: [['N', 0, -5], ['H', -18, 8], ['H', 0, 15], ['H', 18, 8]], bonds: [[0, 1], [0, 2], [0, 3]] },
  NaCl: { name: 'sal', f: [['Na', 1], ['Cl', 1]], at: [['Na', -11, 0], ['Cl', 11, 0]], bonds: [[0, 1]] },
  H2O2: { name: 'aigua oxigenada', f: [['H', 2], ['O', 2]], at: [['H', -26, 9], ['O', -10, -2], ['O', 10, -2], ['H', 26, 9]], bonds: [[0, 1], [1, 2], [2, 3]] }
};
// what each one is at room temperature: a gas, unless it is said here
const STATE = { H2O: 'liquid', H2O2: 'liquid', NaCl: 'solid', C: 'solid', Na: 'solid' };
export const stateOf = id => STATE[id] || 'gas';
export const formula = id => MOLS[id].f.map(([s, n]) => s + (n > 1 ? `<sub>${n}</sub>` : '')).join('');
export const atomsOf = id => MOLS[id].f.reduce((s, [, n]) => s + n, 0);

/* ---------- the drops ---------- */
// the words go with «gota»: una gota blava, dues de blaves
export const INKS = { blau: { one: 'blava', many: 'blaves', hue: 215 }, groc: { one: 'groga', many: 'grogues', hue: 50 }, vermell: { one: 'vermella', many: 'vermelles', hue: 0 } };
// The colour of a mix, as a hue: the middle of its hues on the colour wheel, each weighing its drops. Blue and yellow give green,
// and more yellow a lighter green: the eye sees the proportion. null with no drops
export function blend(inks, counts) {
  let x = 0, y = 0;
  inks.forEach((k, i) => { const a = INKS[k].hue * Math.PI / 180; x += counts[i] * Math.cos(a); y += counts[i] * Math.sin(a); });
  return counts.some(n => n > 0) ? (Math.round(Math.atan2(y, x) * 180 / Math.PI) + 360) % 360 : null;
}

/* ---------- how a percentage is worked out, said in words ---------- */
// «El 25 % és una quarta part: 80 : 4 = 20.» total is a number and unit what it counts
export function pctHow(pct, total, unit) {
  const u = v => `${v} ${unit}`, t = total / 10;
  if (pct === 50) return `El 50 % és la meitat: ${total} : 2 = ${u(total / 2)}.`;
  if (pct === 25) return `El 25 % és una quarta part: ${total} : 4 = ${u(total / 4)}.`;
  if (pct === 75) return `El 75 % són tres quartes parts: ${total} : 4 = ${total / 4}, i ${total / 4} × 3 = ${u(total * 3 / 4)}.`;
  if (pct === 10) return `El 10 % és una desena part: ${total} : 10 = ${u(t)}.`;
  if (pct === 5) return `El 10 % és ${total} : 10 = ${t}. El 5 % n'és la meitat: ${u(t / 2)}.`;
  return `El 10 % és ${total} : 10 = ${t}. El ${pct} % és ${pct / 10} cops això: ${t} × ${pct / 10} = ${u(total * pct / 100)}.`;
}

/* ---------- the levels ---------- */
const cap = s => s[0].toUpperCase() + s.slice(1);
// find an element on the table; ask says which one, in words, and never needs the table to be learnt by heart
const find = (sym, ask, say) => ({ kind: 'find', title: 'Troba l\'element', sym, ask, say });
// build an atom: its protons and, when n is given, the neutrons that make its mass
const atom = (sym, n, say) => ({ kind: 'atom', title: `Àtom ${de(el(sym).name)}`, sym, n, say });
// build count molecules out of the atoms of the tray
const mol = (id, count, tray, say) => ({ kind: 'mol', title: count > 1 ? `${count} × ${MOLS[id].name}` : cap(MOLS[id].name), id, count, tray, say });
// A potion of drops in a proportion. parts is [ink, parts] for each ink; either given [i, n] fixes the drops of one ink,
// or total fixes how many there are in all. want is the drops of each ink
function mix(name, parts, { given, total }, say) {
  const sum = parts.reduce((s, [, n]) => s + n, 0), k = given ? given[1] / parts[given[0]][1] : total / sum;
  return { kind: 'mix', title: name, name, parts, given: given || null, total: total || null, want: parts.map(([, n]) => n * k), say };
}
// fill to a percentage: skin 'cyl' is a cylinder of size ml filled in steps, 'salt' a beaker of size g of salt water with a spoon of step g
const dose = (skin, size, step, pct, say) => ({ kind: 'dose', title: skin === 'cyl' ? `El ${pct} % de ${size} ml` : `Aigua salada al ${pct} %`, skin, size, step, pct, want: size * pct / 100, say });
// A reaction: left and right are [molecule, how many the recipe takes]; given [i, n] fixes one of them, counted along left and then right.
// want is how many of each there must be
function react(left, right, given, say) {
  const all = [...left, ...right], k = given[1] / all[given[0]][1];
  return { kind: 'react', title: `${left.map(([id]) => formula(id)).join(' + ')} →`, left, right, given, k, want: all.map(([, n]) => n * k), say };
}
// One or more questions over a drawing. A step is { q, want, opts, unit, done, how }: with opts the answer is one of them,
// without it is typed on the keys; done is the line the notebook keeps and how the hint
const ask = (title, pic, steps, say = '') => ({ kind: 'ask', title, pic, steps, say });
const st = (q, want, opts, unit, done, how) => ({ q, want, opts, unit, done, how });

const WATER = [['H2', 2], ['O2', 1]], AMMO = [['N2', 1], ['H2', 3]];
const COCOA = { t: 'bar', total: '250 ml', parts: [['cacau', 10, 25], ['llet', 90, 215]] };
// a card of things with how much of each: what there is in the fridge, or what a recipe needs
const card = (title, items) => ({ t: 'card', title, items });
const AIR = hide => ({ t: 'bar', parts: [['nitrogen', 78, 215], ['oxigen', 21, 0], ['altres gasos', hide ? null : 1, 285]] });

// the seven sections as the game had them first; SECTIONS below is the order of the cursus now
const FIRST = [
  { name: 'Els elements', sub: 'Troba cada element a la taula i construeix àtoms.', levels: [
    find('O', "Troba l'<b>oxigen</b>. El seu símbol és <b>O</b>.", 'Tot el que toques està fet d\'elements. Toca una casella per saber qui és, i quan el tinguis prem «És aquest!».'),
    find('C', 'Troba el <b>carboni</b>. El seu símbol és <b>C</b>.', 'Cada element té un símbol d\'una o dues lletres. Pots tocar totes les caselles que vulguis: mirar no costa res.'),
    find('He', 'Troba l\'element <b>número 2</b>.', 'El número de cada casella diu quants protons té el seu àtom. Els elements van ordenats per aquest número.'),
    atom('He', null, 'Un àtom té protons al mig i electrons que hi donen voltes. Posa-hi 2 protons i tindràs heli.'),
    atom('C', null, 'Quants protons té decideix quin element és. Si no recordes el número del carboni, prem «Mira la taula».'),
    find('Na', 'Troba el <b>sodi</b>: és a la sal de cuina.', 'Compte, que el símbol del sodi no comença per S! Toca caselles i llegeix què diuen.'),
    find('Mg', 'Troba l\'element que té <b>el doble de protons</b> que el carboni.', 'El carboni és el número 6. Quin número busques?'),
    atom('Li', 4, 'Al mig de l\'àtom també hi ha neutrons. La massa és protons + neutrons. Fes un liti de massa 7.'),
    find('Cu', 'Troba el metall que té <b>3 protons més</b> que el ferro.', 'El ferro és a la fila dels metalls famosos. Mira quin número té i suma.'),
    atom('O', 8, 'L\'oxigen que respires té massa 16. Quants neutrons li calen?')
  ] },
  { name: 'Molècules', sub: 'Ajunta àtoms seguint la fórmula.', levels: [
    mol('H2', 1, ['H', 'O'], 'Els àtoms s\'ajunten i fan molècules. La fórmula H₂ vol dir 2 àtoms d\'hidrogen junts.'),
    mol('H2O', 1, ['H', 'O'], 'L\'aigua és H₂O. El 2 petit és de l\'hidrogen; l\'oxigen no porta número, i vol dir que n\'hi ha 1.'),
    mol('CO2', 1, ['C', 'O', 'H'], 'El gas que treus quan respires. De quin àtom n\'hi ha 2?'),
    ask('Compta els àtoms', { t: 'mols', list: [['CH4', 1]] }, [st('Quants àtoms té en total una molècula de metà?', 5, [4, 5, 6], '', '1 de carboni + 4 d\'hidrogen = 5 àtoms', 'Compta les boles del dibuix: 1 de carboni i 4 d\'hidrogen.')], 'El metà és el gas de la cuina. La seva fórmula és CH₄.'),
    mol('NH3', 1, ['N', 'H', 'O'], 'L\'amoníac és NH₃: un nitrogen amb els seus hidrògens.'),
    mol('H2O', 2, ['H', 'O'], 'Ara dues molècules d\'aigua! Cada una vol 2 d\'hidrogen i 1 d\'oxigen.'),
    ask('Tres molècules', { t: 'mols', list: [['CO2', 3]] }, [st('En 3 molècules de CO₂, quants àtoms d\'oxigen hi ha?', 6, [3, 5, 6, 9], '', '3 × 2 = 6 àtoms d\'oxigen', 'Cada molècula té 2 àtoms d\'oxigen, i n\'hi ha 3.')], 'Les boles vermelles són l\'oxigen.'),
    mol('CH4', 2, ['C', 'H', 'O'], 'Dues molècules de metà. Pensa primer quants àtoms et calen de cada.'),
    ask('La glucosa', { t: 'text', html: 'C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>', cap: 'glucosa, el sucre de la fruita' }, [st('Quants àtoms té en total una molècula de glucosa?', 24, [12, 18, 24, 30], '', '6 + 12 + 6 = 24 àtoms', 'Suma els tres números petits: 6 de carboni, 12 d\'hidrogen i 6 d\'oxigen.')], 'Una molècula ben grossa. Els números petits diuen quants àtoms hi ha de cada.'),
    ask('Cinc d\'aigua', { t: 'mols', list: [['H2O', 5]] }, [
      st('En 5 molècules d\'aigua, quants àtoms hi ha en total?', 15, [10, 15, 20], '', '5 × 3 = 15 àtoms', 'Cada molècula d\'aigua té 3 àtoms.'),
      st('I quants d\'aquests àtoms són d\'hidrogen?', 10, [5, 10, 15], '', '5 × 2 = 10 d\'hidrogen: 2 de cada 3', 'A cada molècula, 2 dels 3 àtoms són d\'hidrogen.')], 'A l\'aigua sempre hi ha la mateixa proporció: 2 d\'hidrogen per cada 1 d\'oxigen.')
  ] },
  // real recipes: for more people the recipe is made more times, for fewer it is shared out; 4 → 6 goes through 2 (the half)
  { name: 'La recepta', sub: 'Receptes de veritat: per a més persones o per a menys.', levels: [
    ask('Crepes per a 4', card('Crepes per a 2 persones', [['🥚', '1 ou'], ['🥛', '100 ml de llet'], ['🌾', '50 g de farina']]), [
      st('Avui en feu per a 4 persones: el doble. Quants ous calen?', 2, [1, 2, 3], '', '1 × 2 = 2 ous', 'Per a 4 persones és el doble que per a 2.'),
      st('I quants ml de llet?', 200, [150, 200, 300], 'ml', '100 × 2 = 200 ml de llet', 'El doble de 100 ml.'),
      st('I quants grams de farina?', 100, null, 'g', '50 × 2 = 100 g de farina', 'El doble de 50 g.')], 'Una recepta diu quant cal de cada cosa per a unes quantes persones. Si en sou més, es multiplica tot.'),
    ask('Macarrons per a 2', card('Macarrons per a 4 persones', [['🍝', '400 g de macarrons'], ['🍅', '200 g de tomàquet'], ['🧀', '4 cullerades de formatge']]), [
      st('Avui només sou 2: la meitat. Quants grams de macarrons?', 200, [100, 200, 300], 'g', '400 : 2 = 200 g de macarrons', 'Per a la meitat de persones, la meitat de cada cosa.'),
      st('I quants grams de tomàquet?', 100, null, 'g', '200 : 2 = 100 g de tomàquet', 'La meitat de 200 g.'),
      st('I quantes cullerades de formatge?', 2, [1, 2, 4], '', '4 : 2 = 2 cullerades', 'La meitat de 4.')], 'Per a menys persones es divideix: per a 2 és la meitat que per a 4.'),
    ask('Batut per a 6', card('Batut de plàtan per a 2 persones', [['🍌', '2 plàtans'], ['🥛', '300 ml de llet'], ['🍯', '2 cullerades de mel']]), [
      st('Per a 6 persones, quantes vegades cal fer la recepta?', 3, [2, 3, 4], '', '6 : 2 = 3 vegades', '6 persones són 3 grups de 2.'),
      st('Quants plàtans calen?', 6, [4, 6, 8], '', '2 × 3 = 6 plàtans', 'La recepta 3 vegades: 3 cops 2 plàtans.'),
      st('I quants ml de llet?', 900, null, 'ml', '300 × 3 = 900 ml de llet', '3 cops 300 ml.')], 'De 2 a 6 persones: la recepta es fa 3 vegades.'),
    ask('El suc concentrat', { t: 'parts', parts: [['suc concentrat', 1, 30], ['aigua', 4, 215]] }, [
      st('Amb 100 ml de suc concentrat, quants ml d\'aigua hi poses?', 400, null, 'ml', '100 × 4 = 400 ml d\'aigua', 'Per cada part de suc, 4 parts d\'aigua: 4 cops 100 ml.'),
      st('Quants ml de beguda surten en total?', 500, [400, 500, 104], 'ml', '100 + 400 = 500 ml', 'Ajunta el suc i l\'aigua.')], 'L\'ampolla de suc concentrat diu: «1 part de suc per cada 4 parts d\'aigua».'),
    ask('Truita per a 6', card('Truita de patates per a 4 persones', [['🥚', '6 ous'], ['🥔', '600 g de patates'], ['🫒', '4 cullerades d\'oli']]), [
      st('Primer, per a 2 persones: la meitat. Quants ous?', 3, [2, 3, 4], '', '6 : 2 = 3 ous per a 2', 'La meitat de 6.'),
      st('I per a 6 persones, que són 4 + 2?', 9, [8, 9, 12], '', '6 + 3 = 9 ous per a 6', 'Suma els de 4 persones i els de 2.'),
      st('Quants grams de patates per a 6 persones?', 900, null, 'g', '600 + 300 = 900 g de patates', '600 g per a 4 i la meitat, 300 g, per a 2. Suma-ho.')], 'De 4 a 6 persones: fes la recepta per a 2 (la meitat) i suma-la a la de 4.'),
    ask('Limonada per a la festa', card('Limonada per a 4 gots', [['🍋', '3 llimones'], ['🍬', '60 g de sucre'], ['💧', '800 ml d\'aigua']]), [
      st('Per a la festa en vols 12 gots. Quantes vegades has de fer la recepta?', 3, [3, 8, 12], '', '12 : 4 = 3 vegades', 'Quantes vegades hi cap 4 en 12?'),
      st('Quantes llimones calen?', 9, null, '', '3 × 3 = 9 llimones', '3 vegades 3 llimones.'),
      st('I quants ml d\'aigua?', 2400, null, 'ml', '800 × 3 = 2400 ml d\'aigua', '3 vegades 800 ml: 800 + 800 + 800.')], 'Aquesta limonada surt per a 4 gots.'),
    ask('El pastís de iogurt', card('Pastís de iogurt (es mesura amb el got del iogurt)', [['🥛', '1 iogurt'], ['🌾', '3 gots de farina'], ['🍬', '2 gots de sucre'], ['🫒', '1 got d\'oli'], ['🥚', '3 ous']]), [
      st('En vols fer 2 pastissos. Quants gots de farina?', 6, [5, 6, 9], '', '3 × 2 = 6 gots de farina', 'El doble de 3.'),
      st('I quants ous?', 6, null, '', '3 × 2 = 6 ous', 'El doble de 3.'),
      st('Entre farina, sucre i oli, quants gots fan els 2 pastissos?', 12, null, '', '(3 + 2 + 1) × 2 = 12 gots', 'Un pastís en vol 3 + 2 + 1 = 6 gots. I dos pastissos?')], 'El pastís de iogurt es mesura amb el got buit del iogurt.'),
    ask('Cacau per a tothom', card('Llet amb cacau per a 1 tassa', [['🥛', '200 ml de llet'], ['🍫', '2 cullerades de cacau']]), [
      st('Per a 5 tasses, quants ml de llet calen?', 1000, null, 'ml', '200 × 5 = 1000 ml de llet', '5 vegades 200 ml.'),
      st('Quants litres de llet són?', 1, [1, 10, 100], 'l', '1000 ml = 1 l', 'Un litre té 1000 ml.'),
      st('I quantes cullerades de cacau?', 10, null, '', '2 × 5 = 10 cullerades', '5 vegades 2 cullerades.')], 'Berenar per a tota la família.'),
    ask('Pizza per a 6', card('Massa de pizza per a 4 persones', [['🌾', '400 g de farina'], ['💧', '250 ml d\'aigua'], ['🧂', '8 g de sal']]), [
      st('Per a 2 persones, la meitat: quants grams de farina?', 200, [100, 200, 300], 'g', '400 : 2 = 200 g per a 2', 'La meitat de 400.'),
      st('I per a 6 persones, que són 4 + 2?', 600, null, 'g', '400 + 200 = 600 g de farina', 'Suma la farina de 4 persones i la de 2.'),
      st('Quants ml d\'aigua per a 6 persones?', 375, null, 'ml', '250 + 125 = 375 ml d\'aigua', 'Per a 4, 250 ml. Per a 2, la meitat: 125 ml. Suma-ho.')], 'De 4 a 6 persones, una altra vegada: per a 2 i per a 4, i ho sumes.'),
    ask('El gran sopar', card('Amanida per a 4 persones', [['🥬', '1 enciam'], ['🍅', '4 tomàquets'], ['🥕', '2 pastanagues'], ['🧀', '100 g de formatge']]), [
      st('Sou 8 a sopar. Quants tomàquets calen?', 8, null, '', '4 × 2 = 8 tomàquets', '8 persones són el doble de 4.'),
      st('I quants grams de formatge?', 200, null, 'g', '100 × 2 = 200 g de formatge', 'El doble de 100 g.'),
      st('Un altre dia sou 6. Quantes pastanagues calen?', 3, [2, 3, 4], '', '2 + 1 = 3 pastanagues', 'Per a 4, 2 pastanagues. Per a 2, la meitat: 1. Suma-ho.')], 'L\'última recepta: multiplica, divideix i suma.')
  ] },
  { name: 'El tant per cent', sub: 'Omple provetes: la meitat, una quarta part, una desena part.', levels: [
    dose('cyl', 100, 10, 50, '«Per cent» vol dir «de cada 100». Aquesta proveta fa 100 ml: el 50 % són 50 ml, la meitat.'),
    dose('cyl', 100, 5, 25, 'El 25 % és una quarta part: la meitat de la meitat.'),
    ask('Quadrets plens', { t: 'grid', n: 30 }, [st('Quin tant per cent dels quadrets és ple?', 30, [3, 30, 70], '%', '30 de cada 100 = 30 %', 'Hi ha 100 quadrets. Compta les files plenes: cada una en té 10.')], 'Aquí hi ha 100 quadrets justos.'),
    dose('cyl', 200, 20, 50, 'Ara la proveta fa 200 ml. El 50 % continua sent la meitat.'),
    dose('cyl', 80, 10, 25, 'Una quarta part de 80. Fes la meitat, i una altra vegada la meitat.'),
    ask('El 10 %', { t: 'cyl', size: 50, step: 5, v: 50 }, [st('El 10 % de 50 ml, quants ml són?', 5, [5, 10, 40], 'ml', '50 : 10 = 5 ml', 'El 10 % és una desena part: parteix 50 en 10 trossos iguals.')], 'El 10 % és molt fàcil: és dividir per 10.'),
    dose('cyl', 40, 5, 75, 'El 75 % són tres quartes parts. Troba primer una quarta part.'),
    ask('Quant n\'hi ha?', { t: 'cyl', size: 200, step: 50, v: 50 }, [st('La proveta fa 200 ml i n\'hi ha 50. Quin tant per cent és ple?', 25, [25, 50, 75], '%', '50 és una quarta part de 200: el 25 %', '200 : 4 = 50. Quina part de la proveta és plena?')], 'Ara al revés: mira el líquid i digues el tant per cent.'),
    dose('cyl', 300, 20, 20, 'Troba primer el 10 %, que és dividir per 10. El 20 % és el doble.'),
    ask('L\'aire', AIR(true), [st('Quin tant per cent de l\'aire queda per als altres gasos?', 1, [1, 9, 11], '%', '78 + 21 = 99, i fins a 100 en falta 1', 'Tot plegat ha de sumar 100. Suma 78 i 21, i mira quant hi falta.')], 'L\'aire que respires és un 78 % nitrogen i un 21 % oxigen.')
  ] },
  { name: 'Sucs i barreges', sub: 'Aigua salada, sucs i cacau: quant n\'hi ha de cada cosa?', levels: [
    dose('salt', 100, 5, 10, 'La sal es desfà dins l\'aigua: això és una dissolució. Aigua salada al 10 %: de cada 100 g, 10 són sal.'),
    dose('salt', 200, 5, 10, 'Ara en fas 200 g. El 10 % és una desena part.'),
    ask('Suc de taronja', { t: 'bar', total: '200 ml', parts: [['taronja', 75, 30], ['aigua', 25, 215]] }, [st('En un got de 200 ml, quants ml són de taronja?', 150, [50, 150, 175], 'ml', '200 : 4 = 50, i 50 × 3 = 150 ml de taronja', pctHow(75, 200, 'ml'))], 'Al brik diu: «75 % de taronja». La resta és aigua.'),
    dose('salt', 300, 5, 5, 'El 5 % és la meitat del 10 %. Troba primer el 10 % de 300.'),
    ask('Llet amb cacau', COCOA, [st('Una tassa de 250 ml té un 10 % de cacau. Quants ml són de cacau?', 25, [10, 25, 50], 'ml', '250 : 10 = 25 ml de cacau', pctHow(10, 250, 'ml'))], 'Llet amb cacau: un 10 % és cacau i la resta, llet.'),
    ask('Llet amb cacau', COCOA, [st('La tassa fa 250 ml i 25 són de cacau. Quants ml són de llet?', 225, [150, 225, 240], 'ml', '250 − 25 = 225 ml de llet', 'Tot el que no és cacau és llet: treu 25 de 250.')], 'La mateixa tassa. Ara toca la llet.'),
    dose('salt', 150, 10, 20, 'Aigua ben salada: al 20 %. Troba el 10 % de 150 i fes-ne el doble.'),
    ask('La limonada', { t: 'bar', parts: [['aigua', 72, 215], ['suc de llimona', 20, 55], ['sucre', null, 320]] }, [st('Quin tant per cent és de sucre?', 8, [2, 8, 28], '%', '72 + 20 = 92, i fins a 100 en falten 8', 'Suma 72 i 20, i mira quant falta per arribar a 100.')], 'Aquesta limonada és un 72 % aigua i un 20 % suc de llimona. La resta és sucre.'),
    ask('Aigua al cos', { t: 'bar', total: '30 kg', parts: [['aigua', 60, 215], ['la resta', 40, 28]] }, [
      st('Un nen pesa 30 kg. Primer: quant és el 10 % de 30 kg?', 3, [3, 6, 10], 'kg', '10 % de 30 kg = 3 kg', 'El 10 % és dividir per 10.'),
      st('I el 60 %, que és 6 cops més?', 18, [12, 18, 20], 'kg', '3 × 6 = 18 kg d\'aigua', 'Multiplica per 6 el que val el 10 %.')], 'El cos és un 60 % aigua. Fes-ho en dos passos.'),
    ask('El refresc', { t: 'cyl', size: 200, step: 50, v: 200 }, [
      st('Primer: quant és l\'1 % de 200 ml?', 2, [2, 3, 20], 'ml', '200 : 100 = 2 ml', 'L\'1 % és dividir per 100.'),
      st('El refresc té un 3 % de suc de llimona. Quants ml són?', 6, [5, 6, 60], 'ml', '2 × 3 = 6 ml', 'El 3 % és 3 cops l\'1 %.')], 'Un got de 200 ml de refresc de llimona. Al pot diu: «3 % de suc». Només una mica és suc de veritat!')
  ] },
  { name: 'Reaccions', sub: 'Els àtoms canvien de parella, sempre en la mateixa proporció.', levels: [
    react([['C', 1], ['O2', 1]], [['CO2', 1]], [0, 3], 'En una reacció les molècules es desfan i els àtoms en fan de noves. La recepta diu quantes en calen de cada.'),
    react(WATER, [['H2O', 2]], [1, 1], 'Així es fa l\'aigua: per cada molècula d\'oxigen, 2 d\'hidrogen, i en surten 2 d\'aigua.'),
    react(WATER, [['H2O', 2]], [1, 2], 'Ara hi ha 2 d\'oxigen: la recepta es fa 2 cops.'),
    react(WATER, [['H2O', 2]], [0, 6], 'Ara saps l\'hidrogen: n\'hi ha 6, i la recepta en vol 2 cada cop.'),
    ask('Res no es perd', { t: 'eq', left: WATER, right: [['H2O', 2]] }, [st('A l\'esquerra hi ha 4 àtoms d\'hidrogen. Quants n\'hi ha a la dreta?', 4, [2, 4, 6], '', 'Cap àtom es perd: 4 abans i 4 després', 'Compta les boles blanques de la dreta: 2 a cada molècula d\'aigua.')], 'En una reacció els àtoms no desapareixen ni se\'n fan de nous: només canvien de lloc.'),
    react(AMMO, [['NH3', 2]], [0, 2], 'Així es fa l\'amoníac: 1 de nitrogen, 3 d\'hidrogen, i en surten 2.'),
    react([['CH4', 1], ['O2', 2]], [['CO2', 1], ['H2O', 2]], [0, 2], 'El metà crema a la cuina: gasta oxigen i fa dos gasos alhora.'),
    react([['Na', 2], ['Cl2', 1]], [['NaCl', 2]], [0, 6], 'D\'un metall i un gas verd en surt la sal de cuina! Hi ha 6 de sodi: quants cops es fa la recepta?'),
    react(AMMO, [['NH3', 2]], [1, 9], 'L\'amoníac una altra vegada, però ara saps l\'hidrogen: 9.'),
    ask('L\'escuma', { t: 'eq', left: [['H2O2', 2]], right: [['H2O', 2], ['O2', 1]] }, [
      st('Tens 10 molècules d\'aigua oxigenada. Quantes d\'aigua en surten?', 10, [5, 10, 20], '', '10 d\'aigua oxigenada fan 10 d\'aigua', 'De cada 2 en surten 2: les mateixes.'),
      st('I quantes molècules d\'oxigen?', 5, [5, 10, 20], '', 'i 5 d\'oxigen: la meitat', 'De cada 2 en surt només 1: la meitat.'),
      st('Quantes molècules hi ha al final, en total?', 15, [10, 15, 20], '', '10 + 5 = 15 molècules', 'Suma les d\'aigua i les d\'oxigen.')], 'L\'aigua oxigenada es desfà en aigua i oxigen: per això fa bombolles.')
  ] },
  { name: 'El gran experiment', sub: 'Percentatges, sumes i proporcions, tot alhora.', levels: [
    ask('Poció de móra', { t: 'bar', total: '50 ml', parts: [['aigua', 40, 215], ['suc de móra', 60, 300]] }, [
      st('En fas 50 ml. Quants ml d\'aigua hi poses?', 20, null, 'ml', '40 % de 50 ml = 20 ml d\'aigua', pctHow(40, 50, 'ml')),
      st('La resta és suc de móra. Quants ml?', 30, null, 'ml', '50 − 20 = 30 ml de suc', 'Tot el que no és aigua és suc: 50 − 20.')], 'La poció és un 40 % aigua. Aquí la resposta s\'escriu amb les tecles.'),
    ask('La trompeta', { t: 'parts', parts: [['coure', 2, 25], ['zinc', 1, 200]] }, [
      st('Una trompeta pesa 900 g. Quants grams pesa cada part?', 300, null, 'g', '2 + 1 = 3 parts, i 900 : 3 = 300 g', 'Hi ha 2 + 1 = 3 parts iguals. Reparteix 900 entre 3.'),
      st('Quants grams de coure té la trompeta?', 600, null, 'g', '300 × 2 = 600 g de coure', 'El coure són 2 parts de 300 g.')], 'El llautó es fa amb 2 parts de coure i 1 part de zinc.'),
    ask('La corona', { t: 'bar', total: '400 g', parts: [['or', 75, 48], ['coure', null, 25], ['plata', null, 200]] }, [
      st('La corona pesa 400 g. Quants grams d\'or té?', 300, null, 'g', '75 % de 400 g = 300 g d\'or', pctHow(75, 400, 'g')),
      st('La resta és coure i plata. Quants grams fan entre tots dos?', 100, null, 'g', '400 − 300 = 100 g', 'Treu l\'or del pes de la corona.'),
      st('Hi ha el mateix de coure que de plata. Quants grams de coure?', 50, null, 'g', '100 : 2 = 50 g de coure', 'Reparteix els 100 g en dues parts iguals.')], 'Una corona d\'or de joieria: un 75 % és or.'),
    ask('El globus gegant', AIR(false), [
      st('El globus té 200 litres d\'aire. Quants litres són l\'1 %?', 2, null, 'litres', '200 : 100 = 2 litres', 'L\'1 % és dividir per 100.'),
      st('Quants litres d\'oxigen hi ha, si és el 21 %?', 42, null, 'litres', '21 × 2 = 42 litres d\'oxigen', 'El 21 % és 21 cops l\'1 %.'),
      st('I de nitrogen, que és el 78 %?', 156, null, 'litres', '78 × 2 = 156 litres de nitrogen', 'El 78 % és 78 cops l\'1 %: el doble de 78.')], 'L\'aire és un 78 % nitrogen, un 21 % oxigen i un 1 % altres gasos.'),
    ask('Poció que bull', { t: 'drops', parts: [['blau', 1], ['groc', 3]] }, [
      st('Vols 20 gotes en total. Quantes de blaves?', 5, null, '', '1 + 3 = 4, i 20 : 4 = 5 de blaves', 'Un cop de recepta són 1 + 3 = 4 gotes. Quants cops hi cap en 20?'),
      st('I quantes de grogues?', 15, null, '', '5 × 3 = 15 de grogues', 'Per cada blava, 3 de grogues.'),
      st('Mentre bull se n\'evapora el 20 %. Quantes gotes se\'n van?', 4, null, '', '20 % de 20 = 4 gotes', pctHow(20, 20, 'gotes')),
      st('Quantes gotes queden?', 16, null, '', '20 − 4 = 16 gotes', 'Treu de les 20 les que s\'han evaporat.')], 'La recepta: 1 gota blava per cada 3 de grogues.'),
    ask('Metà a dojo', { t: 'mols', list: [['CH4', 1]] }, [
      st('Tens 10 molècules de metà. Quants àtoms hi ha en total?', 50, null, '', '10 × 5 = 50 àtoms', 'Cada molècula té 5 àtoms.'),
      st('Quants d\'aquests àtoms són d\'hidrogen?', 40, null, '', '10 × 4 = 40 d\'hidrogen', 'Cada molècula té 4 àtoms d\'hidrogen.'),
      st('Quin tant per cent dels àtoms són d\'hidrogen?', 80, null, '%', '40 de 50 és com 80 de 100: el 80 %', '40 de cada 50. I de cada 100, que és el doble?')], 'Una molècula de metà: 1 de carboni i 4 d\'hidrogen.'),
    ask('Aigua de mar', { t: 'bar', total: '250 g', parts: [['sal', 20, 48], ['aigua', 80, 215]] }, [
      st('Tens 250 g d\'aigua salada al 20 %. Quants grams de sal hi ha?', 50, null, 'g', '20 % de 250 g = 50 g de sal', pctHow(20, 250, 'g')),
      st('I quants grams d\'aigua?', 200, null, 'g', '250 − 50 = 200 g d\'aigua', 'Tot el que no és sal és aigua.'),
      st('Per cada gram de sal, quants grams d\'aigua hi ha?', 4, null, 'g', '200 : 50 = 4 g d\'aigua per cada gram de sal', 'Quants cops hi caben 50 en 200?')], 'Aigua molt salada, feta al laboratori.'),
    ask('Oxigen de sobres', { t: 'eq', left: WATER, right: [['H2O', 2]] }, [
      st('Tens 20 molècules d\'hidrogen i 20 d\'oxigen. Quantes d\'oxigen calen per gastar tot l\'hidrogen?', 10, null, '', '20 d\'hidrogen volen 10 d\'oxigen', 'Per cada 2 d\'hidrogen cal 1 d\'oxigen: la meitat.'),
      st('Quantes molècules d\'oxigen sobren?', 10, null, '', '20 − 10 = 10 que sobren', 'En tenies 20 i n\'has gastat 10.'),
      st('Quin tant per cent de l\'oxigen ha sobrat?', 50, null, '%', '10 de 20 és la meitat: el 50 %', '10 de 20 és la meitat. Quin tant per cent és la meitat?')], 'La recepta de l\'aigua: 2 d\'hidrogen per cada 1 d\'oxigen.'),
    ask('Tres estàtues', { t: 'bar', total: '80 kg', parts: [['coure', 90, 25], ['estany', 10, 200]] }, [
      st('Una estàtua de bronze pesa 80 kg. Quants quilos d\'estany té?', 8, null, 'kg', '10 % de 80 kg = 8 kg d\'estany', pctHow(10, 80, 'kg')),
      st('I quants quilos de coure?', 72, null, 'kg', '80 − 8 = 72 kg de coure', 'Tot el que no és estany és coure.'),
      st('Per fer 3 estàtues iguals, quants quilos d\'estany calen?', 24, null, 'kg', '8 × 3 = 24 kg d\'estany', 'Cada estàtua en vol 8 kg.')], 'Aquest bronze és un 90 % coure i un 10 % estany.'),
    ask('La gran poció', { t: 'parts', parts: [['blau', 3, 215], ['groc', 2, 50]] }, [
      st('En vols 50 ml. Quants ml fa cada part?', 10, null, 'ml', '3 + 2 = 5 parts, i 50 : 5 = 10 ml', 'Hi ha 3 + 2 = 5 parts iguals. Reparteix 50 entre 5.'),
      st('Quants ml de blau?', 30, null, 'ml', '10 × 3 = 30 ml de blau', 'El blau són 3 parts de 10 ml.'),
      st('Quants ml de groc?', 20, null, 'ml', '10 × 2 = 20 ml de groc', 'El groc són 2 parts de 10 ml.'),
      st('Hi afegeixes purpurina: un 10 % del que ja tens. Quants ml?', 5, null, 'ml', '10 % de 50 ml = 5 ml de purpurina', pctHow(10, 50, 'ml')),
      st('Quants ml fa ara la poció?', 55, null, 'ml', '50 + 5 = 55 ml', 'Suma la purpurina als 50 ml.')], 'L\'última poció: 3 parts de blau per cada 2 de groc.')
  ] }
];
// the fridge: litres and millilitres, kilos and grams, with things from home
const FRIDGE = { name: 'La nevera', sub: 'Litres i mil·lilitres, quilos i grams: el que hi ha a la nevera.', levels: [
  ask('El brik de llet', card('A la nevera', [['🥛', 'Llet: 1 l']]), [st('Quants mil·lilitres té 1 litre?', 1000, [10, 100, 1000], 'ml', '1 l = 1000 ml', 'Mil·lilitre vol dir «la mil·lèsima part d\'un litre»: un litre en té mil.')], 'A la nevera hi ha un brik de llet d\'1 litre. Els líquids es mesuren en litres (l) i mil·lilitres (ml).'),
  ask('Gots de llet', { t: 'cyl', size: 1000, step: 250, v: 1000 }, [st('Cada got és de 250 ml. Quants gots omples amb 1 litre?', 4, [2, 4, 10], 'gots', '1000 : 250 = 4 gots', '250 + 250 = 500, que és mig litre. Quants 250 fan 1000?')], 'Aquesta gerra té 1 litre de llet: 1000 ml.'),
  ask('Mig litre', card('A la nevera', [['🧃', 'Suc de taronja: mig litre'], ['💧', 'Aigua: 1 litre i mig']]), [
    st('Quants ml té el suc de mig litre?', 500, [50, 500, 5000], 'ml', 'Mig litre = 1000 : 2 = 500 ml', 'La meitat de 1000 ml.'),
    st('I l\'ampolla d\'aigua d\'1 litre i mig?', 1500, null, 'ml', '1000 + 500 = 1500 ml', '1 litre són 1000 ml, i mig litre, 500 ml. Suma-ho.')], 'Mig litre és la meitat d\'un litre.'),
  ask('El formatge', card('A la nevera', [['🧀', 'Formatge: 250 g'], ['🧈', 'Mantega: 250 g']]), [
    st('Quants grams té 1 quilo?', 1000, [10, 100, 1000], 'g', '1 kg = 1000 g', 'Quilo vol dir mil: un quilo són mil grams.'),
    st('Quants trossos de formatge de 250 g fan 1 kg?', 4, [2, 4, 10], '', '1000 : 250 = 4 trossos', 'Quants 250 g fan 1000 g?')], 'Les coses que pesen es mesuren en quilos (kg) i grams (g).'),
  ask('Quant més pesa?', card('A la nevera', [['🍗', 'Pollastre: 1 kg'], ['🥓', 'Pernil: 750 g']]), [st('Quants grams més pesa el pollastre que el pernil?', 250, [25, 250, 749], 'g', '1000 − 750 = 250 g més', 'Passa el quilo a grams, 1000 g, i després resta 750.')], 'Per comparar-los, tots dos han d\'estar en grams.'),
  ask('La fruita', card('Al calaix de la fruita', [['🍎', 'Pomes: 2 kg'], ['🍌', 'Plàtans: 500 g'], ['🍇', 'Raïm: 750 g']]), [
    st('Quants grams pesen les pomes?', 2000, [20, 200, 2000], 'g', '2 kg = 2000 g', 'Cada quilo són 1000 g.'),
    st('Quants grams de fruita hi ha en total?', 3250, null, 'g', '2000 + 500 + 750 = 3250 g', 'Suma els grams de les tres fruites.')], 'Primer passa-ho tot a grams.'),
  ask('Ampolletes', card('A la nevera', [['🥤', 'Ampolla gran: 2 l'], ['🧃', 'Ampolleta: 200 ml']]), [st('Quantes ampolletes de 200 ml omplen l\'ampolla de 2 l?', 10, [4, 10, 100], '', '2 l = 2000 ml, i 2000 : 200 = 10', '2 litres són 2000 ml. Quantes vegades hi cap 200?')], 'Una ampolla gran i unes ampolletes per anar d\'excursió.'),
  ask('Iogurts', card('A la nevera', [['🥄', 'Paquet de 4 iogurts de 125 g']]), [
    st('Quants grams fa el paquet sencer?', 500, null, 'g', '125 × 4 = 500 g', '125 + 125 = 250, i dues vegades 250.'),
    st('Quants paquets fan 1 kg?', 2, [2, 4, 8], '', '1000 : 500 = 2 paquets', '1 kg són 1000 g. Quantes vegades hi cap 500?')], 'Cada iogurt pesa 125 g.'),
  ask('Què queda?', { t: 'cyl', size: 1000, step: 250, v: 750 }, [
    st('La gerra feia 1 l i n\'has begut un got de 250 ml. Quants ml queden?', 750, [250, 750, 900], 'ml', '1000 − 250 = 750 ml', '1 l són 1000 ml. Treu-ne el got.'),
    st('En beus un altre got. Quants ml queden ara?', 500, null, 'ml', '750 − 250 = 500 ml: mig litre', 'Treu un altre got de 250 ml.')], 'A la gerra hi havia 1 litre de suc.'),
  ask('Repte de la nevera', card('Al rebost', [['📦', 'Una caixa de 6 briks de llet d\'1 l']]), [
    st('Quants litres de llet hi ha a la caixa?', 6, null, 'l', '6 × 1 = 6 l', 'Cada brik té 1 litre.'),
    st('Quants ml són?', 6000, null, 'ml', '6 l = 6000 ml', 'Cada litre són 1000 ml.'),
    st('A casa en gasteu 750 ml cada dia. Quants ml en gasteu en 2 dies?', 1500, null, 'ml', '750 × 2 = 1500 ml', 'El doble de 750.'),
    st('Quants ml queden a la caixa després de 2 dies?', 4500, null, 'ml', '6000 − 1500 = 4500 ml', 'Treu el que heu gastat de 6000 ml.')], 'L\'últim repte de la nevera: litres, mil·lilitres i dies.')
] };
// The order of the cursus: the kitchen first, then the percentages and the mixes, and the chemistry at the end.
// OLD[i] is the place now of the section that was the i-th at first: a save from then keeps its stars in the same section
export const OLD = [4, 5, 1, 2, 3, 6, 7];
export const SECTIONS = [FRIDGE, FIRST[2], FIRST[3], FIRST[4], FIRST[0], FIRST[1], FIRST[5], FIRST[6]];
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- stars ---------- */

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the concert, the abacus and the division game: a Piscina to get in, a map of three
// circles, a mark for each project, an exam for each circle, XP and badges. A project is one of the sections above, with its ten levels
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'La cuina', projects: [0, 1] },
  { name: 'Mescles i percentatges', projects: [2, 3] },
  { name: 'La química', projects: [4, 5, 6, 7] }
];
// The progress of the cursus, the same in every game (shared/curs.js). The stars of each level, in the order of now, are kept in lv;
// the exam of circle c is kept at EXAM + c, after the three exams of the first order. A circle is open too when some level of it has
// stars, or when an exam of the first order had opened its sections (the first exam opened the percentages, the second the
// reactions). Only atoms and molecules, open to everyone at first, wait now at the end for whoever had not played them
export const EXAM = 3;
const played = (p, c) => CIRCLES[c].projects.some(i => p.lv.slice(i * 10, i * 10 + 10).some(n => n > 0)) || (c > 0 && p.exams[c - 1] === true);
const cursus = curs({ PROJECTS, CIRCLES, field: 'lv', lists: ['stars'], slot: c => EXAM + c, alsoOpen: played, badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, xpOf, levelText, isOpen, examOpen, levelIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf };
// the three elements of the Piscina, the first challenges: hydrogen, oxygen and carbon
export const POOL = ['H', 'O', 'C'];

// What is saved is facts only: { so, lv[80], stars[70], piscina, exams[6], fulls }. lv holds the stars of each level in the order of
// now. stars and exams[0..2] are what the first order kept: they are never written again, only read, so a cloud copy from before
// (merged position by position) can never mix the two orders. Marks, XP, level and badges are worked out, never stored.
// A complete progress inside its limits from any value at all; a new object. It only ever raises: the stars of the first order go
// to their section in the new one, the exam of the percentages to its circle, and the two exams of chemistry, both passed, to the
// circle of chemistry. The kitchen is new: its exam is to be done
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, FIRST.length * 10).map(s => within(s, 3)), lv = slots(o.lv, LEVELS.length).map(s => within(s, 3));
  OLD.forEach((p, i) => { for (let k = 0; k < 10; k++) lv[p * 10 + k] = Math.max(lv[p * 10 + k], stars[i * 10 + k]); });
  const exams = slots(o.exams, EXAM + CIRCLES.length).map(e => e === true);
  exams[EXAM + 1] ||= exams[1];
  exams[EXAM + 2] ||= exams[0] && exams[2];
  return { so: o.so !== false, lv, stars, piscina: o.piscina === true || lv.some(s => s > 0), exams, fulls: Math.max(0, whole(o.fulls)) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: 'Troba bé les errades d\'un full.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: 'Corregeix bé deu fulls d\'errades.' },
  { name: 'Cursus complet', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.fulls >= 10, CIRCLES.every((_, c) => p.exams[EXAM + c] === true)];

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

// The four things a sheet can say, each { kind, says, real, opts, ... }: says is the value written on the sheet, real the true one
// (the claim is wrong when they differ) and opts the values to choose from when fixing it. The mistakes are the ones that teach:
// a mass that forgets the neutrons, atoms counted in one molecule when there are several, a percentage taken for the rest,
// and a recipe that adds what it should multiply.
const three = a => [...new Set(a.filter(v => v > 0))].slice(0, 3).sort((x, y) => x - y);
const CLAIM = {
  // the mass of an atom: protons plus neutrons; the wrong one only counts the protons, or one neutron too many
  mass(bad, rnd) {
    const z = 3 + at(8, rnd), n = z + at(2, rnd), real = z + n, says = bad ? [z, real + 1][at(2, rnd)] : real;
    return { z, n, says, real, opts: three([says, real, real + 1, real - 1, z]) };
  },
  // the atoms of some molecules of one kind; the wrong one counts a single molecule, or forgets one atom of each
  atoms(bad, rnd) {
    const [id, each] = [['H2O', 3], ['CO2', 3], ['CH4', 5], ['NH3', 4]][at(4, rnd)], k = 2 + at(3, rnd), real = each * k, says = bad ? [each, real - k][at(2, rnd)] : real;
    return { id, k, says, real, opts: three([says, real, real - k, each, real + k]) };
  },
  // a percentage of a cylinder; the wrong one is what is left over, or the number of the percentage itself
  pct(bad, rnd) {
    const [pct, size] = [[25, 80], [25, 200], [10, 50], [10, 300], [75, 40], [20, 150], [20, 50], [75, 200]][at(8, rnd)], real = size * pct / 100;
    const wrong = [size - real, pct][at(2, rnd)], says = !bad ? real : wrong !== real ? wrong : real * 2;
    return { pct, size, says, real, opts: three([says, real, size - real, pct, real * 2]) };
  },
  // a recipe made more times; the wrong one adds the difference instead of multiplying
  ratio(bad, rnd) {
    const [a, b] = [[1, 2], [1, 3], [2, 3], [3, 2], [2, 5]][at(5, rnd)], k = 2 + at(3, rnd), have = a * k, real = b * k, add = have + b - a, says = bad ? (add !== real && add > 0 ? add : real + 1) : real;
    return { a, b, have, says, real, opts: three([says, real, real + 1, have, real - 1]) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
