import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
// The rules and the data of the observatory of the pond, with no page in it. The frog is a detective of data: it reads tables, bars,
// pies, lines, Venn diagrams and Gantt charts about the continents, the Olympic Games, football and One Piece, builds them with a
// finger, and works out means, medians and modes. Every answer is worked out here from the data, so a chart and its answer never
// disagree. The real data is rounded and says its year; the plans, the surveys and the games of the frog are the game's own.
// It must keep importing from Node.

/* ---------- numbers ---------- */
// a number as a child reads it: a point between thousands (4.800) and a comma before the decimals (2,5)
export const num = n => {
  const [i, d] = String(Math.round(n * 10) / 10).split('.');
  return (i.length > 4 || +i >= 1000 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : i) + (d ? ',' + d : '');
};
export const cap = s => s[0].toUpperCase() + s.slice(1);
// {x} is the thing with its article; {té}, {fa}, {és} and {ha} agree with it (els EUA tenen, la Xina té); {v} is the value
// the article that meets «a» or «de» joins it (al, dels), and «de» before a vowel loses its e (d'Alabasta)
export const ca = s => s.replace(/(^|[\s(«])(a|A|de|De) (els?) /g, (m, p, w, a) => p + w[0] + (w.length > 1 ? 'el' : 'l') + (a === 'els' ? 's' : '') + ' ')
  .replace(/(^|[\s(«])([Dd])e (?=[AEIOUÀÈÉÍÒÓÚaeiouàèéíòóú])/g, "$1$2'");
const fill = (tpl, r, v) => ca(tpl.replace(/\{X\}/g, cap(r.the)).replace(/\{x\}/g, r.the).replace(/\{v\}/g, num(v))
  .replace(/\{té\}/g, r.pl ? 'tenen' : 'té').replace(/\{fa\}/g, r.pl ? 'fan' : 'fa').replace(/\{és\}/g, r.pl ? 'són' : 'és').replace(/\{ha\}/g, r.pl ? 'han' : 'ha')).replace(/(^|\s)1 (Mundial|Cop|medall|partit|gol|punt|any|cistell)(?:e?s)\b/g, (m, p, w) => `${p}1 ${w === 'Cop' ? 'Copa' : w === 'medall' ? 'medalla' : w === 'cistell' ? 'cistella' : w}`).replace(/(^|\s)1 països/g, '$11 país');

/* ---------- the data: tables of rows (a name, an icon, a value for each column) ---------- */
// n is the short name on a chart, the the name in a sentence, pl a plural name (els EUA)
const row = (n, i, v, the = n, pl = false) => ({ n, i, v, the, pl });
// of: what the column counts, after «més» (més medalles d'or); ask: the question of one value; tell: the sentence of one value;
// count: a number of things (a difference of them makes sense in a sentence); most/least: what to say instead of «més …»/«menys …»
const col = (name, of, hue, o = {}) => ({ name, of, hue, ...o });
export const SETS = {
  paris: { title: 'Medalles als Jocs Olímpics de París 2024', who: 'país', whoPl: 'països', sumQ: 'Quantes medalles {té} {x} en total, sumant-les totes?', sumOf: 'medalles',
    cols: [col('Or', "medalles d'or", 45, { ask: "Quantes medalles d'or {té} {x}?", tell: "{X} {té} {v} medalles d'or.", count: true }),
      col('Plata', 'medalles de plata', 200, { ask: 'Quantes medalles de plata {té} {x}?', tell: '{X} {té} {v} medalles de plata.', count: true }),
      col('Bronze', 'medalles de bronze', 22, { ask: 'Quantes medalles de bronze {té} {x}?', tell: '{X} {té} {v} medalles de bronze.', count: true })],
    rows: [row('EUA', '🇺🇸', [40, 44, 42], 'els EUA', true), row('Xina', '🇨🇳', [40, 27, 24], 'la Xina'), row('Japó', '🇯🇵', [20, 12, 13], 'el Japó'),
      row('Austràlia', '🇦🇺', [18, 19, 16]), row('França', '🇫🇷', [16, 26, 22]), row('Països Baixos', '🇳🇱', [15, 7, 12], 'els Països Baixos', true),
      row('Regne Unit', '🇬🇧', [14, 22, 29], 'el Regne Unit'), row('Corea del Sud', '🇰🇷', [13, 9, 10]), row('Itàlia', '🇮🇹', [12, 13, 15]),
      row('Alemanya', '🇩🇪', [12, 13, 8]), row('Espanya', '🇪🇸', [5, 4, 9])] },
  lliga: { title: 'La Lliga 2023-24 (els sis primers)', who: 'equip', whoPl: 'equips',
    cols: [col('Guanyats', 'partits guanyats', 140, { ask: 'Quants partits {ha} guanyat {x}?', tell: '{X} {ha} guanyat {v} partits.', count: true }),
      col('Empatats', 'partits empatats', 48, { ask: 'Quants partits {ha} empatat {x}?', tell: '{X} {ha} empatat {v} partits.', count: true }),
      col('Perduts', 'partits perduts', 5, { ask: 'Quants partits {ha} perdut {x}?', tell: '{X} {ha} perdut {v} partits.', count: true }),
      col('Gols a favor', 'gols a favor', 195, { ask: 'Quants gols {ha} marcat {x}?', tell: '{X} {ha} marcat {v} gols.', count: true }),
      col('Gols en contra', 'gols en contra', 330, { ask: 'Quants gols li han marcat a {x}?', tell: 'A {x} li han marcat {v} gols.', count: true }),
      col('Punts', 'punts', 262, { ask: 'Quants punts {té} {x}?', tell: '{X} {té} {v} punts.', count: true })],
    rows: [row('R. Madrid', '⚪', [29, 8, 1, 87, 26, 95], 'el Reial Madrid'), row('Barça', '🔵', [26, 7, 5, 79, 44, 85], 'el Barça'),
      row('Girona', '🔴', [25, 6, 7, 85, 46, 81], 'el Girona'), row('Atlètic', '🟥', [24, 4, 10, 70, 43, 76], "l'Atlètic de Madrid"),
      row('Athletic', '🦁', [19, 11, 8, 61, 37, 68], "l'Athletic de Bilbao"), row('R. Sociedad', '🟦', [16, 12, 10, 51, 39, 60], 'la Reial Societat')] },
  cont: { title: 'Els continents (xifres arrodonides)', who: 'continent', whoPl: 'continents',
    cols: [col('Superfície', 'superfície', 140, { unit: 'milions de km²', ask: 'Quants milions de km² {fa} {x}?', tell: '{X} {fa} {v} milions de km².' }),
      col('Població', 'població', 28, { unit: 'milions de persones', ask: 'Quants milions de persones viuen a {x}?', tell: 'A {x} hi viuen {v} milions de persones.' }),
      col('Països', 'països', 262, { ask: 'Quants països hi ha a {x}?', tell: 'A {x} hi ha {v} països.', count: true })],
    rows: [row('Àsia', '🐼', [44, 4800, 48], "l'Àsia"), row('Àfrica', '🦁', [30, 1500, 54], "l'Àfrica"), row('Amèrica del Nord', '🦅', [25, 600, 23], "l'Amèrica del Nord"),
      row('Amèrica del Sud', '🦜', [18, 440, 12], "l'Amèrica del Sud"), row('Antàrtida', '🐧', [14, 0, 0], "l'Antàrtida"), row('Europa', '🏰', [10, 740, 44]),
      row('Oceania', '🦘', [9, 45, 14])] },
  mundials: { title: 'Mundials de futbol guanyats (fins al 2026)', who: 'selecció', whoPl: 'seleccions', fem: true,
    cols: [col('Mundials', 'Mundials', 45, { ask: 'Quants Mundials {ha} guanyat {x}?', tell: '{X} {ha} guanyat {v} Mundials.', count: true })],
    rows: [row('Brasil', '🇧🇷', [5], 'el Brasil'), row('Alemanya', '🇩🇪', [4]), row('Itàlia', '🇮🇹', [4]), row('Argentina', '🇦🇷', [3], "l'Argentina"),
      row('França', '🇫🇷', [2]), row('Uruguai', '🇺🇾', [2], "l'Uruguai"), row('Espanya', '🇪🇸', [2]), row('Anglaterra', '⚽', [1])] },
  champions: { title: "Copes d'Europa guanyades (fins al 2024)", who: 'equip', whoPl: 'equips',
    cols: [col('Copes', "Copes d'Europa", 200, { ask: "Quantes Copes d'Europa {ha} guanyat {x}?", tell: "{X} {ha} guanyat {v} Copes d'Europa.", count: true })],
    rows: [row('R. Madrid', '⚪', [15], 'el Reial Madrid'), row('Milan', '🔴', [7], 'el Milan'), row('Bayern', '🍺', [6], 'el Bayern'),
      row('Liverpool', '🐦', [6], 'el Liverpool'), row('Barça', '🔵', [5], 'el Barça'), row('Ajax', '⚔️', [4], "l'Ajax")] },
  recomp: { title: 'Recompenses del Barret de Palla (milions de berries)', who: 'pirata', whoPl: 'pirates',
    cols: [col('Recompensa', 'recompensa', 45, { unit: 'milions de berries', most: 'la recompensa més alta', least: 'la recompensa més baixa',
      ask: 'De quants milions de berries és la recompensa de {x}?', tell: 'La recompensa de {x} és de {v} milions de berries.' })],
    rows: [row('Luffy', '👒', [3000]), row('Zoro', '⚔️', [1111]), row('Jinbe', '🐟', [1100]), row('Sanji', '🍳', [1032]), row('Robin', '🌸', [930]),
      row('Usopp', '🎯', [500]), row('Franky', '🔧', [394]), row('Brook', '🎻', [383]), row('Nami', '🍊', [366])] },
  palla: { title: 'Els Barret de Palla', who: 'pirata', whoPl: 'pirates',
    cols: [col('Alçada', 'alçada', 195, { unit: 'cm', most: 'més alçada', ask: 'Quants centímetres fa {x}?', tell: '{X} fa {v} cm.' }),
      col('Edat', 'anys', 140, { unit: 'anys', ask: 'Quants anys {té} {x}?', tell: '{X} {té} {v} anys.', count: true })],
    rows: [row('Luffy', '👒', [174, 19]), row('Zoro', '⚔️', [181, 21]), row('Nami', '🍊', [170, 20]), row('Usopp', '🎯', [174, 19]), row('Sanji', '🍳', [180, 21]),
      row('Chopper', '🦌', [90, 17]), row('Robin', '🌸', [188, 30]), row('Franky', '🔧', [240, 36]), row('Brook', '🎻', [277, 90]), row('Jinbe', '🐟', [301, 46])] },
  // the lines: one row per moment, in order
  luffy: { title: 'La recompensa de Luffy (milions de berries)', who: 'moment', whoPl: 'moments', line: true,
    cols: [col('Recompensa', 'recompensa', 45, { unit: 'milions de berries', most: 'la recompensa més alta', mostQ: 'En quin moment té Luffy la recompensa més alta?',
      ask: 'De quants milions és la recompensa de Luffy després de {x}?',
      timesQ: 'Quantes vegades més gran és la recompensa després de {a} que després de {b}?' })],
    rows: [row('Arlong Park', '🦈', [30]), row('Alabasta', '🏜️', [100]), row('Enies Lobby', '⚖️', [300]), row('Marineford', '⚓', [400]), row('Dressrosa', '🌹', [500]),
      row('Whole Cake', '🎂', [1500]), row('Wano', '🗾', [3000])] },
  temps: { title: 'Temperatura màxima a Barcelona, mes a mes (°C, aproximada)', who: 'mes', whoPl: 'mesos', line: true,
    cols: [col('Temperatura', 'graus', 5, { unit: '°C', mostQ: 'Quin mes fa més calor?', leastQ: 'Quin mes fa més fred?', ask: 'Quants graus fa al {x}?' })],
    rows: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre']
      .map((m, k) => row(cap(m.slice(0, 3)), '', [[14, 15, 17, 19, 22, 26, 28, 29, 26, 22, 17, 15][k]], m)) },
  mon: { title: 'Persones al món (milions)', who: 'any', whoPl: 'anys', line: true,
    cols: [col('Persones', 'milions de persones', 195, { unit: 'milions', ask: "Quants milions de persones hi havia al món l'any {x}?" })],
    rows: [row('1950', '', [2500]), row('1975', '', [4100]), row('2000', '', [6100]), row('2025', '', [8200])] },
  // the pies: what a whole is made of
  terra: { title: 'On és la terra ferma del planeta? (%)', who: 'continent', whoPl: 'continents', pct: true,
    cols: [col('%', 'terra', 140, { ask: 'Quin percentatge de la terra ferma és a {x}?' })],
    rows: [row('Àsia', '🐼', [30], "l'Àsia"), row('Àfrica', '🦁', [20], "l'Àfrica"), row('Amèrica del Nord', '🦅', [16], "l'Amèrica del Nord"),
      row('Amèrica del Sud', '🦜', [12], "l'Amèrica del Sud"), row('Antàrtida', '🐧', [9], "l'Antàrtida"), row('Europa', '🏰', [7]), row('Oceania', '🦘', [6])] },
  planeta: { title: 'La superfície de la Terra (%)', who: 'part', whoPl: 'parts', fem: true, pct: true,
    cols: [col('%', 'superfície', 195, { ask: 'Quin percentatge de la Terra és {x}?' })],
    rows: [row('Aigua', '🌊', [71], 'aigua'), row('Terra', '⛰️', [29], 'terra')] },
  enquesta: { title: "L'esport preferit de 20 granotes de l'estany", who: 'esport', whoPl: 'esports', pctQ: 'Quin percentatge de les granotes prefereix {x}?', fracQ: 'Quina part de les granotes prefereix {x}?',
    cols: [col('Granotes', 'granotes', 140, { ask: 'Quantes granotes prefereixen {x}?' })],
    rows: [row('Futbol', '⚽', [10], 'el futbol'), row('Natació', '🏊', [5], 'la natació'), row('Bàsquet', '🏀', [3], 'el bàsquet'), row('Atletisme', '🏃', [2], "l'atletisme")] },
  mar: { title: 'On va néixer cada Barret de Palla (10 pirates)', who: 'mar', whoPl: 'mars', pctQ: 'Quin percentatge dels pirates va néixer a {x}?',
    cols: [col('Pirates', 'pirates', 195, { ask: 'Quants Barret de Palla van néixer a {x}?' })],
    rows: [row('East Blue', '🌊', [4], "l'East Blue"), row('North Blue', '❄️', [1], 'el North Blue'), row('West Blue', '🌅', [2], 'el West Blue'),
      row('South Blue', '☀️', [1], 'el South Blue'), row('Grand Line', '🌀', [2], 'la Grand Line')] },
  espanya: { title: "Les medalles d'Espanya a París 2024", who: 'medalla', whoPl: 'medalles', fem: true,
    pctQ: "Quin percentatge de les medalles d'Espanya són {x}?", fracQ: "Quina part de les medalles d'Espanya són {x}?",
    cols: [col('Medalles', 'medalles', 45, { ask: 'Quantes medalles {x} va guanyar Espanya?', mostQ: 'De quin color va guanyar més medalles Espanya?' })],
    rows: [row('Or', '🥇', [5], "d'or"), row('Plata', '🥈', [4], 'de plata'), row('Bronze', '🥉', [9], 'de bronze')] },
  partit: { title: "La pilota en un partit de l'estany (%)", who: 'equip', whoPl: 'equips', pct: true,
    cols: [col('%', 'pilota', 140, { ask: 'Quin percentatge del temps té la pilota {x}?' })],
    rows: [row('Granotes', '🐸', [60], 'les Granotes', true), row('Gripaus', '🦎', [40], 'els Gripaus', true)] },
  gols20: { title: "Els gols de la granota en 20 partits", who: 'resultat', whoPl: 'resultats',
    cols: [col('Partits', 'partits', 262, { ask: 'En quants partits ha fet {x}?' })],
    rows: [row('Cap gol', '0️⃣', [2], 'cap gol'), row('1 gol', '1️⃣', [5], '1 gol'), row('2 gols', '2️⃣', [8], '2 gols'), row('3 o més', '🔥', [5], '3 gols o més')] },
  // a pie that is wrong: its slices make more than the whole (the detective has to see it)
  enquestaMal: { title: "L'esport preferit de 20 granotes (%)", who: 'esport', whoPl: 'esports', pct: true,
    cols: [col('%', 'granotes', 140)], rows: [row('Futbol', '⚽', [50]), row('Natació', '🏊', [30]), row('Bàsquet', '🏀', [25]), row('Atletisme', '🏃', [15])] }
};
// the same survey, in percentages: the good pie next to the wrong one
SETS.enquestaPct = { ...SETS.enquesta, title: "L'esport preferit de 20 granotes (%)", pct: true, cols: [col('%', 'granotes', 140)], rows: SETS.enquesta.rows.map(r => ({ ...r, v: [r.v[0] * 5] })) };

/* ---------- the Venn diagrams: things and the groups they are in ---------- */
// a group: its name on the diagram, and what the things in it do (yes) and the ones out of it do not (no), in the plural and for one (1)
const group = (name, yes, no, yes1, no1) => ({ name, yes, no, yes1, no1 });
const thing = (n, i, m) => ({ n, i, m });
export const VENNS = {
  op: { title: 'La tripulació del Barret de Palla', who: 'pirata', whoPl: 'pirates',
    groups: [group('Fruita del diable', 'mengen una fruita del diable', 'no mengen cap fruita del diable', 'menja una fruita del diable', 'no menja cap fruita del diable'),
      group('Espases', 'lluiten amb espases', 'no lluiten amb espases', 'lluita amb espases', 'no lluita amb espases'),
      group('East Blue', "van néixer a l'East Blue", "no van néixer a l'East Blue", "va néixer a l'East Blue", "no va néixer a l'East Blue")],
    items: [thing('Luffy', '👒', [1, 0, 1]), thing('Zoro', '⚔️', [0, 1, 1]), thing('Nami', '🍊', [0, 0, 1]), thing('Usopp', '🎯', [0, 0, 1]), thing('Sanji', '🍳', [0, 0, 0]),
      thing('Chopper', '🦌', [1, 0, 0]), thing('Robin', '🌸', [1, 0, 0]), thing('Franky', '🔧', [0, 0, 0]), thing('Brook', '🎻', [1, 1, 0]), thing('Jinbe', '🐟', [0, 0, 0])] },
  paisos: { title: 'Països i continents', who: 'país', whoPl: 'països',
    groups: [group('Europa', 'tenen terres a Europa', 'no tenen terres a Europa', 'té terres a Europa', 'no té terres a Europa'),
      group('Àsia', "tenen terres a l'Àsia", "no tenen terres a l'Àsia", "té terres a l'Àsia", "no té terres a l'Àsia"),
      group('Mediterrani', 'toquen el mar Mediterrani', 'no toquen el Mediterrani', 'toca el mar Mediterrani', 'no toca el Mediterrani')],
    items: [thing('Itàlia', '🇮🇹', [1, 0, 1]), thing('Turquia', '🇹🇷', [1, 1, 1]), thing('Rússia', '🇷🇺', [1, 1, 0]), thing('Alemanya', '🇩🇪', [1, 0, 0]), thing('Portugal', '🇵🇹', [1, 0, 0]),
      thing('Japó', '🇯🇵', [0, 1, 0]), thing('Xina', '🇨🇳', [0, 1, 0]), thing('Marroc', '🇲🇦', [0, 0, 1]), thing('Grècia', '🇬🇷', [1, 0, 1]), thing('Brasil', '🇧🇷', [0, 0, 0])] },
  copes: { title: 'Futbol i Jocs Olímpics', who: 'país', whoPl: 'països',
    groups: [group('Mundial (fins al 2026)', 'han guanyat un Mundial de futbol', 'no han guanyat cap Mundial', 'ha guanyat un Mundial de futbol', 'no ha guanyat cap Mundial'),
      group("Jocs d'estiu (fins al 2024)", "han organitzat uns Jocs Olímpics d'estiu", "no n'han organitzat mai", "ha organitzat uns Jocs Olímpics d'estiu", "no n'ha organitzat mai")],
    items: [thing('Brasil', '🇧🇷', [1, 1]), thing('Espanya', '🇪🇸', [1, 1]), thing('França', '🇫🇷', [1, 1]), thing('Alemanya', '🇩🇪', [1, 1]), thing('Itàlia', '🇮🇹', [1, 1]),
      thing('Argentina', '🇦🇷', [1, 0]), thing('Uruguai', '🇺🇾', [1, 0]), thing('Japó', '🇯🇵', [0, 1]), thing('Xina', '🇨🇳', [0, 1]), thing('EUA', '🇺🇸', [0, 1]),
      thing('Austràlia', '🇦🇺', [0, 1]), thing('Portugal', '🇵🇹', [0, 0]), thing('Marroc', '🇲🇦', [0, 0])] }
};
// a Venn diagram made out of the medal table: each country goes where its numbers say
const P = SETS.paris, total = r => r.v.reduce((s, x) => s + x, 0);
VENNS.medals = { title: 'París 2024: ors i medalles', who: 'país', whoPl: 'països',
  groups: [group("Més de 15 ors", "tenen més de 15 medalles d'or", "no en tenen més de 15, d'or", "té més de 15 medalles d'or", "no en té més de 15, d'or"),
    group('Més de 50 medalles', 'tenen més de 50 medalles en total', 'no arriben a 50 medalles', 'té més de 50 medalles en total', 'no arriba a 50 medalles')],
  items: P.rows.map(r => thing(r.n, r.i, [r.v[0] > 15 ? 1 : 0, total(r) > 50 ? 1 : 0])) };
// the region of a thing, as the groups it is in: '101' is in the first and the third. Only the groups shown count
export const regionOf = (m, k) => m.slice(0, k).join('');

/* ---------- the Gantt charts: tasks from a day to a day ---------- */
const task = (n, i, a, b) => ({ n, i, a, b });
export const GANTTS = {
  jocs: { title: "El calendari dels Jocs de l'estany", days: 10, who: 'prova', whoPl: 'proves', fem: true,
    tasks: [task('Futbol', '⚽', 1, 9), task('Natació', '🏊', 1, 4), task('Gimnàstica', '🤸', 2, 5), task('Bàsquet', '🏀', 3, 10), task('Atletisme', '🏃', 4, 10), task('Ciclisme', '🚴', 6, 7)] },
  sunny: { title: 'Preparar el Thousand Sunny per salpar', days: 8, who: 'feina', whoPl: 'feines', fem: true,
    tasks: [task('Franky repara el casc', '🔧', 1, 4), task('Nami dibuixa la ruta', '🗺️', 2, 3), task('Sanji compra menjar', '🛒', 3, 5),
      task('Usopp prepara els canons', '🎯', 5, 6), task('Sanji cuina', '🍳', 6, 7), task('Zoro entrena', '🏋️', 1, 8)] }
};
export const lenOf = T => T.b - T.a + 1;

/* ---------- the small lists of numbers of the statistics ---------- */
export const STATS = {
  gols: { title: 'Gols de la granota en 7 partits', unit: 'gols', vals: [2, 0, 3, 1, 2, 4, 2], lo: 0, hi: 5 },
  cistelles: { title: 'Cistelles de la granota en 5 partits de bàsquet', unit: 'cistelles', vals: [6, 8, 4, 8, 9], lo: 3, hi: 10 },
  calor: { title: "Temperatura màxima a Barcelona una setmana d'agost (°C)", unit: '°C', vals: [28, 29, 30, 29, 28, 29, 30], lo: 26, hi: 32 },
  edats: { title: 'Les edats dels cinc primers Barret de Palla', unit: 'anys', vals: [19, 21, 20, 19, 21], lo: 16, hi: 23 },
  salts: { title: 'Metres que salta la granota en 6 salts', unit: 'metres', vals: [3, 5, 4, 7, 2, 3], lo: 1, hi: 8 }
};
export const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
export function median(a) { const s = a.slice().sort((x, y) => x - y), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; }
// the value that comes most times; null when two or more come the most times
export function mode(a) {
  const n = new Map(); for (const x of a) n.set(x, (n.get(x) || 0) + 1);
  const top = Math.max(...n.values()), m = [...n].filter(([, k]) => k === top);
  return m.length === 1 ? m[0][0] : null;
}
export const range = a => Math.max(...a) - Math.min(...a);

/* ---------- the questions ---------- */
// A question of a chart: text, and how it is answered: type 'tap' (an element of the chart: ans the keys that are right), 'num'
// (a number typed: ans), 'pick' (one of opts; ans the right one) or 'order' (every element in order: ans the keys in that order).
// hint is what the frog says when asked, and say what it says when the answer is right.
// The questions of a chart are made from its context: { S the data, rows the rows on show, c the column, chart its kind }
const LOOK = { table: 'la taula', bars: 'el gràfic de barres', hbars: 'el gràfic de barres', pie: 'el pastís', line: 'la línia', venn: 'el diagrama', gantt: 'el diagrama de Gantt', dots: 'el gràfic de punts' };
const BIG = { table: 'el número més gran', bars: 'la barra més alta', hbars: 'la barra més llarga', pie: 'la llesca més gran', line: 'el punt més alt' };
const SMALL = { table: 'el número més petit', bars: 'la barra més baixa', hbars: 'la barra més curta', pie: 'la llesca més petita', line: 'el punt més baix' };
const READ = {
  table: (r, C) => `Busca la fila de ${r.the} i segueix-la fins a la columna «${C.name}».`,
  bars: r => `Mira on acaba la barra de ${r.the} i segueix la ratlla cap a l'esquerra, fins als números.`,
  hbars: r => `Mira on acaba la barra de ${r.the} i baixa fins als números de sota.`,
  pie: r => `Busca la llesca de ${r.the}: el número hi és escrit.`,
  line: r => `Puja des de «${r.n}» fins al punt de la línia, i mira a quina alçada és.`
};
// the unit after a number in what the frog says: °C, %, or nothing (the question already says it)
const unitOf = (S, C) => S.pct ? ' %' : C.unit === '°C' ? ' °C' : C.unit === 'milions de berries' ? ' milions' : '';
const Q = (type, text, ans, hint, say, o = {}) => ({ type, text: ca(text), ans, hint: ca(hint), say: ca(say), ...o, ...(o.opts ? { opts: o.opts.map(ca) } : {}) });
const quin = S => S.fem ? 'Quina' : 'Quin', quants = S => S.fem ? 'Quantes' : 'Quants';
const argBy = (x, rows, better) => { const best = rows.reduce((b, i) => better(x(i), x(b)) ? i : b, rows[0]); return rows.filter(i => x(i) === x(best)); };
// the value of row i in column c
const V = (S, i, c) => S.rows[i].v[c];

export const q = {
  // the row with the most (or the least) of column c
  most: (c = 0) => ({ S, rows, chart }) => {
    const C = S.cols[c], best = argBy(i => V(S, i, c), rows, (a, b) => a > b), r = S.rows[best[0]];
    return Q('tap', C.mostQ || `${quin(S)} ${S.who} té ${C.most || 'més ' + C.of}?`, best.map(String), `Busca ${BIG[chart] || 'el número més gran'}.`,
      `${cap(r.the)}${best.length > 1 ? ' (empatat)' : ''}: ${num(V(S, best[0], c))}${unitOf(S, C)}.`);
  },
  least: (c = 0) => ({ S, rows, chart }) => {
    const C = S.cols[c], best = argBy(i => V(S, i, c), rows, (a, b) => a < b), r = S.rows[best[0]];
    return Q('tap', C.leastQ || `${quin(S)} ${S.who} té ${C.least || 'menys ' + C.of}?`, best.map(String), `Busca ${SMALL[chart] || 'el número més petit'}.`,
      `${cap(r.the)}: ${num(V(S, best[0], c))}${unitOf(S, C)}.`);
  },
  // the value of row i in column c
  val: (i, c = 0) => ({ S, chart }) => {
    const C = S.cols[c], r = S.rows[i];
    return Q('num', fill(C.ask, r), V(S, i, c), (READ[chart] || READ.table)(r, C), C.tell ? fill(C.tell, r, V(S, i, c)) : `${cap(r.the)}: ${num(V(S, i, c))}${unitOf(S, C)}.`);
  },
  // the difference between rows a and b in column c
  diff: (a, b, c = 0) => ({ S, chart }) => {
    const C = S.cols[c], A = S.rows[a], B = S.rows[b], x = V(S, a, c), y = V(S, b, c);
    return Q('num', `Quina diferència hi ha entre ${A.the} i ${B.the}, en ${C.of}?`, Math.abs(x - y), `Primer llegeix els dos números a ${LOOK[chart] || 'la taula'}, i després resta el petit del gran.`,
      `${num(Math.max(x, y))} − ${num(Math.min(x, y))} = ${num(Math.abs(x - y))}.`);
  },
  // how many times the value of a is that of b
  times: (a, b, c = 0) => ({ S }) => {
    const C = S.cols[c], A = S.rows[a], B = S.rows[b], x = V(S, a, c), y = V(S, b, c);
    return Q('num', C.timesQ ? C.timesQ.replace('{a}', A.the).replace('{b}', B.the) : `Quantes vegades més ${C.of} ${A.pl ? 'tenen' : 'té'} ${A.the} que ${B.the}?`, x / y,
      `Pensa quantes vegades cap ${num(y)} dins de ${num(x)}: divideix ${num(x)} entre ${num(y)}.`, `${num(x)} : ${num(y)} = ${num(x / y)}. ${num(x / y)} vegades més.`);
  },
  // the total of a row, all the columns summed
  sum: i => ({ S }) => {
    const r = S.rows[i], t = total(r);
    return Q('num', fill(S.sumQ, r), t, `Suma tots els números de la fila de ${r.the}.`, `${r.v.map(num).join(' + ')} = ${num(t)}.`);
  },
  // the total of a column, over the rows on show
  all: (c = 0, text) => ({ S, rows }) => {
    const t = rows.reduce((s, i) => s + V(S, i, c), 0);
    return Q('num', text, t, `Suma els números de tots: ${rows.map(i => num(V(S, i, c))).join(', ')}.`, `${rows.map(i => num(V(S, i, c))).join(' + ')} = ${num(t)}.`);
  },
  // the part of the whole of a column that row i is, in percent
  pct: (i, c = 0) => ({ S, rows }) => {
    const t = rows.reduce((s, k) => s + V(S, k, c), 0), x = V(S, i, c), r = S.rows[i];
    return Q('num', fill(S.pctQ || 'Quin percentatge representa {x}?', r) + ' (de cada 100, quants)', x * 100 / t,
      `${cap(r.the)}: ${num(x)} de ${num(t)}. ${100 % t ? `Pensa quina part de ${num(t)} és ${num(x)}, i fes el mateix amb 100.` : `Si ${num(t)} fossin 100, cada un valdria ${100 / t}: multiplica ${num(x)} per ${100 / t}.`}`,
      `${num(x)} de ${num(t)} és el mateix que ${num(x * 100 / t)} de 100: el ${num(x * 100 / t)} %.`);
  },
  // the part of the whole, as a fraction in words
  frac: (i, c = 0) => ({ S, rows }) => {
    const t = rows.reduce((s, k) => s + V(S, k, c), 0), f = V(S, i, c) / t, r = S.rows[i];
    const W = [[1 / 2, 'la meitat'], [1 / 4, 'un quart'], [3 / 4, 'tres quarts'], [1 / 10, 'una desena part'], [1 / 5, 'una cinquena part']];
    const right = W.reduce((b, w) => Math.abs(w[0] - f) < Math.abs(b[0] - f) ? w : b)[1];
    return Q('pick', fill(S.fracQ || 'Quina part del total és {x}?', r), right, `Mira quina part del pastís ocupa la llesca de ${r.the}. Mitja volta és la meitat; un quart de volta, un quart.`,
      `${num(V(S, i, c))} de ${num(t)}: ${right}.`, { opts: [right, ...W.map(w => w[1]).filter(w => w !== right).slice(0, 2)] });
  },
  // every row on show, from the most to the least
  order: (c = 0) => ({ S, rows, chart }) => {
    const ans = rows.slice().sort((a, b) => V(S, b, c) - V(S, a, c)).map(String);
    return Q('order', `Toca'ls tots, de ${S.cols[c].most ? 'la recompensa més alta a la més baixa' : 'més a menys ' + S.cols[c].of}.`, ans,
      `Comença per ${BIG[chart] || 'el número més gran'}, i després el que ve darrere.`, `Ordenats! ${ans.map(i => S.rows[i].n).join(' › ')}.`);
  },
  // the points of a team in the league: 3 for each match won and 1 for each one drawn
  points: i => ({ S }) => {
    const [g, e] = S.rows[i].v, r = S.rows[i];
    return Q('num', `Quants punts té ${r.the}?`, 3 * g + e, `Cada partit guanyat dona 3 punts i cada empat, 1. ${cap(r.the)}: ${g} guanyats i ${e} empatats.`,
      `${g} × 3 + ${e} = ${3 * g + e} punts.`);
  },
  // the goals scored less the goals let in
  gd: i => ({ S }) => {
    const r = S.rows[i], [, , , f, a] = r.v;
    return Q('num', `Quina és la diferència de gols de ${r.the}? (gols a favor menys gols en contra)`, f - a, `${cap(r.the)}: ${f} gols a favor i ${a} en contra. Resta'ls.`, `${f} − ${a} = ${f - a}.`);
  },
  // a question written for one chart: a number, a tap or a choice
  calc: (text, ans, hint, say) => () => Q('num', text, ans, hint, say),
  tap: (text, keys, hint, say) => () => Q('tap', text, keys.map(String), hint, say),
  pick: (text, opts, hint, say) => () => Q('pick', text, opts[0], hint, say, { opts })
};

// the questions of a Venn diagram: { G the diagram, k how many groups are shown }
const wantText = (G, want, one) => want.map((w, j) => w === null ? null : G.groups[j][(w ? 'yes' : 'no') + (one ? '1' : '')]).filter(Boolean).join(' i ');
const inside = (m, want) => want.every((w, j) => w === null || m[j] === w);
export const vq = {
  // how many things are where want says (1 in the group, 0 out of it, null either)
  count: want => ({ G, items }) => {
    const n = items.filter(x => inside(x.m, want)).length;
    return Q('num', `${quants(G)} ${G.whoPl} ${wantText(G, want)}?`, n, `Busca la zona del diagrama que és ${want.map((w, j) => w === null ? '' : (w ? 'dins de «' : 'fora de «') + G.groups[j].name + '»').filter(Boolean).join(' i ')}, i compta.`,
      `N'hi ha ${n}: ${items.filter(x => inside(x.m, want)).map(x => x.n).join(', ') || 'cap'}.`);
  },
  // the things that are where want says: any of them is right
  who: want => ({ G, items }) => {
    const ks = items.flatMap((x, j) => inside(x.m, want) ? [String(j)] : []);
    return Q('tap', `Qui ${wantText(G, want, true)}? Toca'l.`, ks, `Busca la zona que és ${want.map((w, j) => w === null ? '' : (w ? 'dins de «' : 'fora de «') + G.groups[j].name + '»').filter(Boolean).join(' i ')}.`,
      `Sí: ${items.filter(x => inside(x.m, want)).map(x => x.n).join(', ')}.`);
  }
};

// the questions of a Gantt chart: { G the chart }
const ofDay = (G, d) => G.tasks.filter(T => T.a <= d && d <= T.b);
export const gq = {
  longest: () => ({ G }) => { const best = argBy(i => lenOf(G.tasks[i]), G.tasks.map((_, i) => i), (a, b) => a > b), T = G.tasks[best[0]];
    return Q('tap', `${quin(G)} ${G.who} dura més dies?`, best.map(String), 'Busca la barra més llarga.', `${T.n}: del dia ${T.a} al ${T.b}, ${lenOf(T)} dies.`); },
  shortest: () => ({ G }) => { const best = argBy(i => lenOf(G.tasks[i]), G.tasks.map((_, i) => i), (a, b) => a < b), T = G.tasks[best[0]];
    return Q('tap', `${quin(G)} ${G.who} dura menys dies?`, best.map(String), 'Busca la barra més curta.', `${T.n}: només ${lenOf(T)} dies.`); },
  len: i => ({ G }) => { const T = G.tasks[i];
    return Q('num', `Quants dies dura «${T.n}»?`, lenOf(T), `Compta les caselles de la barra de «${T.n}». Comença el dia ${T.a} i també compta l'últim.`, `Del dia ${T.a} al ${T.b}: ${lenOf(T)} dies.`); },
  end: i => ({ G }) => { const T = G.tasks[i];
    return Q('num', `Quin dia acaba «${T.n}»?`, T.b, `Mira on acaba la barra de «${T.n}» i baixa fins als dies.`, `S'acaba el dia ${T.b}.`); },
  start: i => ({ G }) => { const T = G.tasks[i];
    return Q('num', `Quin dia comença «${T.n}»?`, T.a, `Mira on comença la barra de «${T.n}» i baixa fins als dies.`, `Comença el dia ${T.a}.`); },
  day: d => ({ G }) => { const n = ofDay(G, d);
    return Q('num', `${quantes(G)} ${G.whoPl} es fan el dia ${d}?`, n.length, `Posa el dit a la columna del dia ${d} i compta les barres que la travessen.`, `El dia ${d}: ${n.map(T => T.n).join(', ')}.`); },
  starts: d => ({ G }) => { const ks = G.tasks.flatMap((T, i) => T.a === d ? [String(i)] : []);
    return Q('tap', `${quin(G)} ${G.who} comença el dia ${d}?`, ks, `Busca la barra que comença just a la columna del dia ${d}.`, `${G.tasks[+ks[0]].n}: comença el dia ${d}.`); },
  done: () => ({ G }) => { const d = Math.max(...G.tasks.map(T => T.b)) + 1;
    return Q('num', 'El vaixell salpa l\'endemà que s\'acabi l\'última feina. Quin dia salpa?', d, "Busca la barra que acaba més tard, i suma-hi un dia.", `L'última feina acaba el dia ${d - 1}: salpen el dia ${d}.`); }
};
const quantes = G => G.fem ? 'Quantes' : 'Quants';

// the questions of a list of numbers: { D the list }
export const sq = {
  mean: () => ({ D }) => { const s = D.vals.reduce((a, b) => a + b, 0), m = mean(D.vals);
    return Q('num', `Quina és la mitjana? (si tots fossin iguals, quant valdria cada un)`, m, `Suma'ls tots i divideix entre ${D.vals.length}, que són els que hi ha.`, `${D.vals.join(' + ')} = ${s}, i ${s} : ${D.vals.length} = ${num(m)}.`); },
  median: () => ({ D }) => { const s = D.vals.slice().sort((a, b) => a - b), m = median(D.vals);
    return Q('num', 'Quina és la mediana? (el del mig, quan són ordenats)', m, `Ordena'ls de petit a gran: ${s.join(', ')}. El del mig és la mediana.`, `${s.join(', ')}: el del mig és ${num(m)}.`); },
  mode: () => ({ D }) => { const m = mode(D.vals);
    return Q('num', 'Quina és la moda? (el número que surt més vegades)', m, 'Busca la columna de punts més alta.', `El ${m} surt ${D.vals.filter(x => x === m).length} vegades: és la moda.`); },
  range: () => ({ D }) => { const hi = Math.max(...D.vals), lo = Math.min(...D.vals);
    return Q('num', 'Quin és el rang? (el més gran menys el més petit)', hi - lo, `El més gran és ${hi} i el més petit, ${lo}. Resta'ls.`, `${hi} − ${lo} = ${hi - lo}.`); }
};

/* ---------- the levels ---------- */
// A level is { kind, title, say, ... }. kind 'read': rounds, each { chart, q }, a question about a chart (the same chart stays on the
// screen while the next round has it too). kind 'build': the child makes a chart with a finger (what: bars, pie, line, venn, gantt or
// balance) and it is checked whole.
// A chart: { type, set (or venn, gantt, stats), rows (the rows shown), c (the column), from (where its axis starts), ... }
const ALL = n => Array.from({ length: n }, (_, i) => i);
const ctxOf = ch => {
  if (ch.type === 'venn') { const G = VENNS[ch.venn]; return { G, items: (ch.items || ALL(G.items.length)).map(i => G.items[i]), k: ch.k || G.groups.length, chart: 'venn' }; }
  if (ch.type === 'gantt') return { G: GANTTS[ch.gantt], chart: 'gantt' };
  if (ch.type === 'dots') return { D: STATS[ch.stats], chart: 'dots' };
  if (ch.type === 'pair') return ctxOf(ch.a);
  const S = SETS[ch.set];
  return { S, rows: ch.rows || ALL(S.rows.length), c: ch.c || 0, chart: ch.type };
};
// one chart and the questions about it
function read(chart, qs, title, say) {
  const ctx = chart ? ctxOf(chart) : {};
  return { kind: 'read', title, say, rounds: qs.map(f => ({ chart, q: f(ctx) })) };
}
// several charts, one question each
function mix(rounds, title, say) {
  return { kind: 'read', title, say, rounds: rounds.map(([chart, f]) => ({ chart, q: f(chart ? ctxOf(chart) : {}) })) };
}
const build = (what, o, title, say) => ({ kind: 'build', what, title, say, ...o });
const T = (set, o = {}) => ({ type: 'table', set, ...o });
const B = (set, o = {}) => ({ type: 'bars', set, ...o });
const H = (set, o = {}) => ({ type: 'hbars', set, ...o });
const Pie = (set, o = {}) => ({ type: 'pie', set, ...o });
const Ln = (set, o = {}) => ({ type: 'line', set, ...o });
const Vn = (venn, o = {}) => ({ type: 'venn', venn, ...o });
const Gt = gantt => ({ type: 'gantt', gantt });
const Dt = stats => ({ type: 'dots', stats });
// two charts of the same data, side by side: the detective compares them
const Pair = (a, b) => ({ type: 'pair', a, b });
const CHARTS = ['📊 Barres', '🥧 Pastís', '📈 Línia', '⭕ Venn', '🗓️ Gantt', '🔢 Taula'];
// a question with no chart: which chart answers it best
const which = (text, right, others, why) => q.pick(text, [right, ...others], why, `Sí! ${why}`);

const TOP5 = [0, 1, 2, 3, 4], MID = [2, 3, 4, 5, 6];
export const SECTIONS = [
  { name: 'Taules', sub: 'Files, columnes i caselles: medalles, lligues i continents.', levels: [
    read(T('paris', { rows: TOP5 }), [q.val(2, 1), q.val(4, 2)], 'Llegir una casella', "Una taula té files i columnes. Cada fila és un país i cada columna, un color de medalla. On es creuen, hi ha el número."),
    read(T('paris', { rows: MID }), [q.most(0), q.most(2), q.least(1)], 'El més gran', 'Per trobar qui en té més, mira una sola columna de dalt a baix i busca el número més gran.'),
    read(T('paris', { rows: [0, 1, 2] }), [q.most(0), q.pick('Els EUA i la Xina tenen 40 ors cadascun. Per què els EUA van primers a la classificació?', ['Perquè tenen més medalles de plata', 'Perquè tenen més medalles de bronze', 'Per ordre alfabètic'], "Quan dos països empaten a ors, la classificació mira les medalles de plata.", 'Quan empaten a ors, mana la plata: els EUA en tenen 44, i la Xina 27.'), q.val(1, 1)], 'Empat!', "Compte: a vegades dues caselles tenen el mateix número."),
    read(T('paris', { rows: [2, 3, 10] }), [q.sum(10), q.sum(2), q.sum(3)], 'Sumar una fila', 'Per saber el total de medalles d\'un país, suma la seva fila sencera: or, plata i bronze.'),
    read(T('lliga', { cols: [0, 1, 2, 5] }), [q.val(2, 5), q.most(1), q.least(2)], 'La lliga', 'Una taula de lliga: partits guanyats, empatats, perduts i els punts de cada equip.'),
    read(T('lliga', { cols: [0, 1, 2] }), [q.points(1), q.points(2), q.points(4)], 'Calcula els punts', 'Aquesta taula no diu els punts: els calcules tu. Guanyar dona 3 punts, empatar 1 i perdre, 0.'),
    read(T('cont'), [q.most(2), q.val(5, 1), q.least(0)], 'Els continents', 'Ara, els set continents: quant fan, quanta gent hi viu i quants països hi ha.'),
    read(T('cont'), [q.diff(1, 0, 2), q.diff(0, 5, 0), q.diff(0, 1, 1)], 'Diferències', 'Una diferència és una resta: el número gran menys el petit.'),
    read(T('lliga', { cols: [3, 4] }), [q.gd(2), q.gd(0), q.tap('Quin equip té la millor diferència de gols?', [0], 'Calcula la diferència de cada equip: gols a favor menys gols en contra.', 'El Reial Madrid: 87 − 26 = 61.')], 'Diferència de gols', 'Gols a favor: els que marca l\'equip. Gols en contra: els que li marquen.'),
    read(T('paris'), [q.calc("Quants països tenen més de 15 medalles d'or?", 5, "Baixa per la columna «Or» i compta els números més grans que 15. El 15 no compta!", 'Cinc: els EUA, la Xina, el Japó, Austràlia i França.'), q.sum(6), q.most(2)], 'Detectiu de taules', 'La taula sencera, amb onze països. Llegeix-la amb calma.')
  ] },
  { name: 'Barres', sub: 'Llegeix l\'escala, compara i construeix gràfics de barres.', levels: [
    read(B('mundials'), [q.most(), q.val(3), q.val(6)], 'La barra més alta', 'Cada barra és una selecció. Com més alta, més Mundials ha guanyat.'),
    read(B('champions'), [q.val(0), q.val(5), q.diff(0, 1)], "Llegir l'escala", "Els números de l'esquerra són l'escala. Si la barra acaba entre dues ratlles, compta les caselles."),
    read(B('recomp'), [q.most(), q.val(5), q.val(0)], 'Recompenses', 'Les recompenses dels Barret de Palla, en milions de berries. Fixa\'t que l\'escala va de 500 en 500.'),
    read(H('cont'), [q.most(), q.val(1), q.least()], 'Barres ajagudes', 'Les barres també poden anar de costat. Ara, els números són a sota.'),
    read(B('recomp', { rows: [0, 4, 5, 8], labels: true }), [q.times(0, 5), q.diff(0, 5), q.diff(4, 8)], 'Quantes vegades?', '«Quantes vegades més» és una divisió. «Quant més» és una resta.'),
    read(H('cont'), [q.order()], 'Ordena', 'Toca els continents per ordre, del més gran al més petit.'),
    build('bars', { set: 'mundials', rows: [0, 3, 4, 6], hi: 6, step: 1 }, 'Construeix: Mundials', 'Ara el gràfic el fas tu! Arrossega cada barra amunt o avall fins al seu número de la taula.'),
    build('bars', { set: 'champions', rows: [0, 1, 2, 4], hi: 16, step: 1 }, "Construeix: Copes d'Europa", "Arrossega cada barra fins al número de Copes d'Europa de la taula."),
    build('bars', { set: 'cont', c: 2, rows: [1, 0, 5, 3], hi: 60, step: 2 }, 'Construeix: països', 'Ara l\'escala va de 2 en 2. Arrossega cada barra fins als països del seu continent.'),
    build('bars', { set: 'paris', rows: [1, 2, 3, 10], hi: 45, step: 1 }, 'Construeix: ors de París', "L'últim: les medalles d'or de quatre països. Molt de compte amb l'escala!")
  ] },
  { name: 'Diagrames de Venn', sub: 'Cercles que agrupen: dins, fora i les dues coses alhora.', levels: [
    build('venn', { venn: 'op', k: 1, items: [0, 1, 5, 2, 6] }, 'Dins o fora', 'Dins del cercle hi van els pirates que mengen una fruita del diable. Fora, els que no. Arrossega cada pirata al seu lloc.'),
    build('venn', { venn: 'op', k: 2, items: [0, 1, 8, 2, 5, 4] }, 'Dos cercles', 'Dos cercles que es toquen. Al mig, on se sobreposen, hi va qui és dels dos grups alhora.'),
    read(Vn('op', { k: 2 }), [vq.count([1, 1]), vq.who([1, 0]), vq.count([0, 0])], 'Llegir el Venn', 'Ara el diagrama ja és fet. Llegeix-lo: cada zona diu una cosa diferent.'),
    build('venn', { venn: 'paisos', k: 2, items: [0, 2, 5, 1, 6, 9] }, 'Països', 'Hi ha països que tenen terres a dos continents alhora. On van?'),
    build('venn', { venn: 'copes', items: [0, 5, 7, 1, 6, 9, 11] }, 'Mundials i Jocs', 'Qui ha guanyat un Mundial? Qui ha organitzat uns Jocs Olímpics? I qui ha fet les dues coses?'),
    read(Vn('copes'), [vq.count([1, 1]), vq.count([1, 0]), vq.who([0, 1])], 'Llegir: Mundials i Jocs', 'Tots els països al seu lloc. Llegeix bé cada zona.'),
    build('venn', { venn: 'op', items: [0, 1, 2, 8, 6, 4, 3] }, 'Tres cercles', 'Tres cercles! Fruita, espases i East Blue. Hi ha set zones: pensa bé on va cada pirata.'),
    read(Vn('op'), [vq.who([1, 0, 1]), vq.who([0, 1, 1]), vq.count([0, 0, 0])], 'Llegir tres cercles', 'Tota la tripulació al diagrama. Busca la zona que demana cada pregunta.'),
    build('venn', { venn: 'medals', items: [0, 2, 6, 10, 4, 8], table: T('paris', { rows: [0, 2, 6, 10, 4, 8] }) }, 'Venn amb dades', 'Ara no ho saps de memòria: ho diu la taula. Suma les medalles de cada país i decideix on va.'),
    build('venn', { venn: 'paisos', items: [1, 0, 2, 5, 7, 3, 9] }, 'Tres cercles: països', 'Europa, Àsia i el mar Mediterrani. Un país és als tres cercles alhora!')
  ] },
  { name: 'Pastissos i percentatges', sub: 'Parts d\'un tot: meitats, quarts i percentatges.', levels: [
    read(Pie('terra'), [q.most(), q.least(), q.val(1)], 'La llesca més gran', 'Un pastís és un tot repartit en llesques. Aquest és tota la terra ferma del planeta: 100 %.'),
    read(Pie('enquesta'), [q.frac(0), q.frac(1), q.val(2)], 'Meitats i quarts', 'Vint granotes diuen el seu esport preferit. Cada llesca és un esport.'),
    read(Pie('planeta'), [q.most(), q.val(1), q.pick("Quina part de la Terra és aigua, més o menys?", ['Gairebé tres quarts', 'La meitat', 'Un quart'], 'La llesca de l\'aigua és molt més gran que mig pastís.', '71 % és gairebé 75 %: tres quarts del planeta són aigua!')], 'Aigua i terra', 'Tota la superfície de la Terra, en un pastís.'),
    read(Pie('enquesta'), [q.pct(0), q.pct(2), q.pct(3)], 'Del total al percentatge', 'Un percentatge diu quants de cada 100. Aquí són 20 granotes: cada granota és un 5 %.'),
    read(Pie('mar'), [q.pct(0), q.pct(2), q.most()], 'Deu pirates', 'Deu pirates: cada pirata és un 10 % de la tripulació.'),
    read(Pie('espanya'), [q.most(), q.frac(2), q.all(0, "Quantes medalles va guanyar Espanya en total?")], "Medalles d'Espanya", "Les medalles d'Espanya a París 2024, en un pastís."),
    build('pie', { set: 'partit', step: 10 }, 'Fes el pastís: la pilota', 'Ara el pastís el fas tu. Arrossega el sol de la vora fins que cada llesca tingui el seu percentatge.'),
    build('pie', { set: 'enquesta', step: 5, counts: true }, 'Fes el pastís: esports', 'La taula diu granotes, no percentatges. Cada granota és un 5 %: calcula i arrossega.'),
    build('pie', { set: 'mar', step: 10, counts: true }, 'Fes el pastís: els mars', 'Deu pirates, i cada un és un 10 %. Fes una llesca per a cada mar.'),
    build('pie', { set: 'gols20', step: 5, counts: true }, 'Fes el pastís: 20 partits', "L'últim: vint partits de la granota. Cada partit és un 5 %.")
  ] },
  { name: 'Línies', sub: 'Com canvien les coses: pujades, baixades i tendències.', levels: [
    read(Ln('temps'), [q.most(), q.least(), q.val(5)], 'Puja i baixa', 'Una línia uneix punts per ordre: aquí, la temperatura de cada mes a Barcelona.'),
    read(Ln('luffy'), [q.val(1), q.val(4), q.most()], 'Llegir un punt', 'La recompensa de Luffy després de cada aventura. Cada punt és un moment.'),
    read(Ln('temps'), [q.tap('Després de l\'estiu, quin mes torna a fer la mateixa calor que al juny?', [8], 'Al juny fa 26 °C. Busca un altre punt a la mateixa alçada.', 'Al setembre: 26 °C, com al juny.'), q.tap('Quin és el primer mes en què la línia baixa?', [8], 'Segueix la línia d\'esquerra a dreta. On deixa de pujar?', "Al setembre: d'agost a setembre baixa de 29 a 26 °C."), q.diff(7, 0)], 'Pujades i baixades', 'Si la línia puja, fa més calor que el mes d\'abans. Si baixa, fa més fred.'),
    read(Ln('luffy'), [q.tap('Entre quins dos moments puja més la recompensa? Toca el punt d\'arribada.', [6], 'Busca el tros de línia més dret, el que puja més de cop.', 'De Whole Cake a Wano: de 1.500 a 3.000, puja 1.500!'), q.diff(6, 5)], 'On puja més?', 'Com més dreta és la línia, més de pressa puja.'),
    read(Ln('luffy'), [q.times(2, 1), q.times(6, 5), q.times(5, 4)], 'Quantes vegades?', 'Luffy cada cop és més famós. Quantes vegades més?'),
    read(Ln('mon'), [q.val(2), q.diff(3, 0), q.tap('En quins 25 anys va créixer més la gent del món? Toca el punt d\'arribada.', [3], 'Calcula quant puja cada tros: resta cada punt del següent.', 'Del 2000 al 2025: 2.100 milions més.')], 'Persones al món', 'Quanta gent hi ha hagut al món, cada 25 anys.'),
    build('line', { set: 'luffy', rows: [1, 2, 3, 4], hi: 600, step: 100 }, 'Dibuixa: Luffy', 'Ara la línia la fas tu. Arrossega cada punt fins a la seva recompensa.'),
    build('line', { set: 'temps', rows: [0, 1, 2, 3, 4, 5], lo: 10, hi: 30, step: 1 }, 'Dibuixa: de gener a juny', 'Arrossega cada punt fins a la temperatura del seu mes.'),
    build('line', { set: 'mon', hi: 9000, step: 100 }, 'Dibuixa: persones al món', "Els números són grans: l'escala va de 1.000 en 1.000, i cada pas petit és 100."),
    build('line', { set: 'temps', rows: [6, 7, 8, 9, 10, 11], lo: 10, hi: 30, step: 1 }, 'Dibuixa: de juliol a desembre', 'La segona meitat de l\'any. Fixa\'t com baixa!')
  ] },
  { name: 'Diagrames de Gantt', sub: 'Què es fa cada dia: calendaris i plans.', levels: [
    read(Gt('jocs'), [gq.end(1), gq.start(4), gq.len(5)], 'Llegir un Gantt', 'Un diagrama de Gantt és un calendari: cada barra és una prova, i va del dia que comença al dia que acaba.'),
    read(Gt('jocs'), [gq.longest(), gq.shortest(), gq.len(0)], 'La més llarga', 'Com més llarga és la barra, més dies dura.'),
    read(Gt('jocs'), [gq.day(4), gq.day(10), gq.starts(6)], 'Un dia concret', 'Per saber què passa un dia, mira la seva columna de dalt a baix.'),
    read(Gt('sunny'), [gq.end(0), gq.starts(6), gq.len(2)], 'El Thousand Sunny', 'Els Barret de Palla preparen el vaixell. Cada barra és una feina.'),
    read(Gt('sunny'), [gq.day(3), gq.day(6), gq.longest()], 'Alhora', 'Moltes feines es fan alhora. Quantes n\'hi ha cada dia?'),
    read(Gt('sunny'), [gq.done(), gq.start(4), gq.end(3)], 'Quin dia salpen?', 'El vaixell no pot marxar fins que tot està llest.'),
    build('gantt', { days: 6, tasks: [['Comprar', '🛒', 2], ['Cuinar', '🍳', 2], ['Sopar', '🍖', 1]], rules: [['after', 1, 0], ['after', 2, 1]] }, 'Planifica: el sopar', 'Ara planifiques tu! Arrossega cada barra al seu lloc perquè es compleixin totes les normes.'),
    build('gantt', { days: 8, tasks: [['Franky repara', '🔧', 3], ['Usopp canons', '🎯', 2], ['Nami ruta', '🗺️', 2], ['Salpar', '⛵', 1]], rules: [['on', 2, 1], ['after', 1, 0], ['after', 3, 1], ['after', 3, 2]] }, 'Planifica: el Sunny', 'Quatre feines i quatre normes. Llegeix-les bé abans de moure res.'),
    build('gantt', { days: 8, tasks: [['Natació', '🏊', 3], ['Atletisme', '🏃', 3], ['Entrega de medalles', '🏅', 1]], rules: [['apart', 0, 1], ['after', 2, 0], ['after', 2, 1], ['on', 2, 8]] }, 'Planifica: els Jocs', 'La granota fa natació i atletisme, i no pot ser a dos llocs alhora!'),
    build('gantt', { days: 10, tasks: [['Mapa', '🗺️', 2], ['Provisions', '🛒', 3], ['Reparar', '🔧', 4], ['Entrenar', '🏋️', 5], ['Salpar', '⛵', 1]], rules: [['after', 1, 0], ['apart', 1, 2], ['after', 4, 1], ['after', 4, 2], ['after', 4, 3]] }, 'Planifica: el gran viatge', "L'últim pla: cinc feines. Sanji fa les provisions i ajuda a reparar, així que aquestes dues no poden coincidir.")
  ] },
  { name: 'Mitjana, mediana i moda', sub: 'Un sol número que explica molts números.', levels: [
    read(Dt('gols'), [sq.mode(), sq.range(), sq.median()], 'La moda', 'Cada punt és un partit, damunt dels gols que va fer la granota. La moda és el número que surt més vegades.'),
    read(Dt('cistelles'), [sq.median(), sq.mode(), sq.range()], 'La mediana', 'La mediana és el número del mig quan els ordenes de petit a gran.'),
    read(Dt('edats'), [sq.mean(), sq.median(), sq.range()], 'La mitjana', 'La mitjana és el que tindria cadascú si ho repartíssim tot a parts iguals.'),
    build('balance', { stats: 'gols' }, 'La balança: gols', 'Cada punt pesa igual. Arrossega el triangle fins que la barra quedi plana: aquell punt és la mitjana!'),
    build('balance', { stats: 'cistelles' }, 'La balança: cistelles', 'Busca el punt d\'equilibri. Si la barra cau cap a un costat, mou el triangle cap allà.'),
    build('balance', { stats: 'calor' }, 'La balança: calor', 'Set dies d\'agost a Barcelona. On s\'equilibren?'),
    read(B('palla', { rows: [0, 1, 2, 3, 4, 6, 7, 8, 9] }), [q.calc('Quina és la mediana de les alçades? (ordena-les i busca la del mig)', 181, 'Ordena-les: 170, 174, 174, 180, 181, 188, 240, 277, 301. Són 9: la del mig és la cinquena.', 'La del mig és 181 cm: la de Zoro.'), q.calc('I la moda? (l\'alçada que surt més vegades)', 174, 'Hi ha dos pirates que fan el mateix.', 'Luffy i Usopp fan 174 cm.'), q.pick('La mitjana de les alçades és 209 cm. Per què és més gran que la mediana?', ['Franky, Brook i Jinbe són gegants i l\'estiren amunt', 'Perquè Nami és la més baixa', 'La mitjana sempre és més gran'], 'La mitjana suma tothom: tres pirates molt alts pesen molt.', 'Els tres gegants estiren la mitjana amunt. La mediana no s\'hi deixa enganyar!')], 'Gegants!', 'Les alçades de nou Barret de Palla. Alguns són gegants...'),
    read(Ln('temps'), [q.calc('Quin és el rang de les temperatures? (la més alta menys la més baixa)', 15, 'La més alta és 29 °C i la més baixa, 14 °C.', '29 − 14 = 15 graus.'), q.calc('Quants mesos passen de 20 °C?', 6, 'Mira quants punts són per sobre de la ratlla del 20.', 'Sis: de maig a octubre.')], 'El rang', 'El rang diu quant canvien les coses: del més petit al més gran.'),
    build('balance', { stats: 'salts' }, 'La balança: salts', 'Sis salts de la granota. On s\'equilibra la barra?'),
    read(H('recomp'), [q.tap('Ordenades, quina és la recompensa del mig, la mediana? Toca el pirata.', [4], 'Són nou pirates. Ordena les barres i busca la cinquena.', 'Robin: 930 milions. Hi ha quatre recompenses més altes i quatre de més baixes.'), q.calc('Quin és el rang de les recompenses, en milions?', 2634, 'La més alta és la de Luffy, 3.000, i la més baixa la de Nami, 366.', '3.000 − 366 = 2.634.')], 'Detectiu estadístic', 'Les recompenses dels nou pirates. La mediana i el rang també es poden llegir en barres.')
  ] },
  { name: 'El gran detectiu', sub: 'Tria el gràfic bo, caça els que enganyen i creua dades.', levels: [
    read(null, [which('Vull veure com ha anat creixent la recompensa de Luffy, aventura rere aventura.', CHARTS[2], [CHARTS[1], CHARTS[3]], 'Per veure com canvia una cosa amb el temps, una línia.'),
      which('Vull saber quina part de la Terra és aigua.', CHARTS[1], [CHARTS[4], CHARTS[2]], 'Per veure les parts d\'un tot, un pastís.'),
      which('Vull comparar quants Mundials té cada selecció.', CHARTS[0], [CHARTS[4], CHARTS[3]], 'Per comparar quantitats, unes barres.')], 'Quin gràfic?', 'Cada gràfic serveix per a una cosa. Tria el millor per a cada pregunta.'),
    read(null, [which('Vull saber quins pirates mengen fruita i també lluiten amb espases.', CHARTS[3], [CHARTS[0], CHARTS[2]], 'Per veure qui és de dos grups alhora, un Venn.'),
      which('Vull saber quin dia comença i quin dia acaba cada prova dels Jocs.', CHARTS[4], [CHARTS[1], CHARTS[3]], 'Per veure quan es fa cada cosa, un Gantt.'),
      which('Vull saber el número exacte de gols en contra del Girona.', CHARTS[5], [CHARTS[1], CHARTS[2]], 'Per trobar un número exacte, una taula.')], 'Quin gràfic? (2)', 'Ara, Venn, Gantt i taules.'),
    read(null, [which("Vull veure si fa més calor a l'estiu que a l'hivern, mes a mes.", CHARTS[2], [CHARTS[3], CHARTS[1]], 'Mes a mes és com canvia amb el temps: una línia.'),
      which('Vull saber quin percentatge de granotes prefereix el futbol.', CHARTS[1], [CHARTS[4], CHARTS[2]], 'Un percentatge és una part del tot: un pastís.'),
      which('Vull saber quins països tenen terres a Europa i a l\'Àsia alhora.', CHARTS[3], [CHARTS[2], CHARTS[4]], 'Dos grups alhora: un Venn.')], 'Quin gràfic? (3)', 'Les últimes. Pensa què vol saber cada pregunta.'),
    read(Pair(B('lliga', { rows: [1, 2, 3], c: 5 }), B('lliga', { rows: [1, 2, 3], c: 5, from: 74 })),
      [q.tap("A quin gràfic sembla que el Barça té moltíssims més punts que l'Atlètic?", ['b'], "Compara la barra del Barça i la de l'Atlètic als dos gràfics.", "Al B! Però mira l'escala: comença al 74, no al 0."),
        q.calc("De debò, quants punts més té el Barça que l'Atlètic?", 9, 'Llegeix els dos números i resta\'ls.', '85 − 76 = 9. No és tanta diferència!'),
        q.tap('Quin gràfic diu la veritat amb la mida de les barres?', ['a'], 'Mira on comença l\'escala de cada gràfic.', "L'A, que comença al 0.")], 'Gràfics que enganyen', 'Dos gràfics amb els mateixos números. Però un enganya! Mira bé les escales.'),
    read(Pair(Pie('enquestaPct'), Pie('enquestaMal')),
      [q.tap('Un dels dos pastissos està mal fet. Quin?', ['b'], 'Suma els percentatges de cada pastís.', 'El B: les llesques sumen més de 100 %.'),
        q.calc('Quant sumen les llesques del pastís B?', 120, 'Suma els quatre percentatges del B.', '50 + 30 + 25 + 15 = 120 %. Un tot sempre és el 100 %!'),
        q.pick('Per què no pot ser?', ['Un pastís sencer sempre és el 100 %', 'Té massa colors', 'El futbol hauria de ser més petit'], 'Totes les llesques juntes fan el pastís sencer.', 'Exacte: totes les llesques juntes han de fer el 100 %.')], 'El pastís impossible', 'Dos pastissos de la mateixa enquesta. Un té trampa.'),
    read(Pair(B('mundials', { rows: [0, 4, 7] }), B('mundials', { rows: [0, 4, 7], from: 1 })),
      [q.tap('A quin gràfic sembla que Anglaterra no ha guanyat cap Mundial?', ['b'], 'Busca la barra d\'Anglaterra als dos gràfics.', 'Al B, la barra d\'Anglaterra no es veu: l\'escala comença a l\'1!'),
        q.calc('Quants Mundials té Anglaterra de veritat?', 1, "Mira el gràfic A, o fixa't on comença l'escala del B.", 'En té 1: el del 1966.'),
        q.times(0, 7)], 'La barra invisible', 'Si l\'escala no comença al zero, una barra pot desaparèixer!'),
    read(T('paris', { rows: [0, 2, 3, 6] }), [q.pick("Quin país té més medalles en total, el Japó o Austràlia?", ['Austràlia', 'El Japó', 'Tenen les mateixes'], 'Suma la fila de cada un: or + plata + bronze.', "Austràlia: 53. El Japó: 45. El Japó té més ors, però Austràlia té més medalles!"),
      q.tap('Quin país té més medalles en total, sumant-les totes?', [0], 'Suma la fila de cada país.', 'Els EUA: 126 medalles.'), q.sum(6)], 'Depèn de què miris', 'Qui va millor, qui té més ors o qui té més medalles? Depèn de la pregunta!'),
    read(T('cont', { cols: [0, 1] }), [q.calc("Quantes persones hi ha per cada km² a l'Àfrica? (divideix la gent entre la superfície)", 50, "A l'Àfrica: 1.500 milions de persones en 30 milions de km². 1.500 : 30.", '1.500 : 30 = 50 persones per km².'),
      q.tap('Quin continent té més persones per km²?', [0], 'Divideix la població entre la superfície de cada continent.', "L'Àsia: 4.800 : 44 és gairebé 110 persones per km²."),
      q.calc('I a Oceania? (persones per km²)', 5, 'Oceania: 45 milions de persones en 9 milions de km².', '45 : 9 = 5. Hi ha molt d\'espai!')], 'Gent per km²', 'Creuar dues columnes dona una dada nova: quanta gent viu a cada tros de terra.'),
    read(T('lliga', { cols: [3, 4, 5] }), [q.gd(1), q.tap('Quin equip té més gols en contra que el Barça?', [2], 'Mira la columna «Gols en contra». Al Barça li n\'han marcat 44.', 'Al Girona li n\'han marcat 46.'), q.pick('El Girona va marcar més gols que el Barça. Per què va quedar per sota?', ['Va fer menys punts', 'Va marcar menys gols', 'Va jugar menys partits'], 'La classificació va per punts, no per gols.', 'Mana la columna dels punts: 81 contra 85.')], 'Gols i punts', 'Més gols no sempre vol dir anar primer.'),
    mix([[Pie('espanya'), q.pct(2)], [Vn('copes'), vq.count([1, 1])], [Ln('luffy'), q.times(6, 2)], [Gt('jocs'), gq.day(7)], [Dt('salts'), sq.mean()]], 'El gran informe', 'L\'informe final: cinc gràfics diferents, una pregunta de cada. Ets un detectiu de dades!')
  ] }
];
export const LEVELS = SECTIONS.flatMap(s => s.levels);

/* ---------- checking what a child builds ---------- */
// the bars or the points of a line: one value per row; gives the rows that are wrong
export function wrongValues(L, vals) {
  const S = SETS[L.set], rows = L.rows || ALL(S.rows.length);
  return rows.flatMap((i, k) => vals[k] === S.rows[i].v[L.c || 0] ? [] : [k]);
}
// the pie: the percentage of each slice; the slices that are wrong
export function pieWant(L) {
  const S = SETS[L.set], t = S.rows.reduce((s, r) => s + r.v[0], 0);
  return S.rows.map(r => r.v[0] * 100 / t);
}
export const wrongSlices = (L, pcts) => pieWant(L).flatMap((w, k) => pcts[k] === w ? [] : [k]);
// the Venn diagram: where each thing was put ('10', '01', '' for outside every circle, null for not put); the ones that are wrong
export function wrongPlaces(L, places) {
  const G = VENNS[L.venn], k = L.k || G.groups.length;
  return L.items.flatMap((i, j) => places[j] === regionOf(G.items[i].m, k) ? [] : [j]);
}
// the Gantt chart: the first day of each task; the rules that are broken
export const RULES = {
  after: (s, len, a, b) => s[a] > s[b] + len[b] - 1,
  on: (s, len, a, d) => s[a] === d,
  apart: (s, len, a, b) => s[a] + len[a] - 1 < s[b] || s[b] + len[b] - 1 < s[a]
};
export const ruleText = (L, [kind, a, b]) => {
  const n = k => `«${L.tasks[k][0]}»`;
  return kind === 'after' ? `${n(a)} comença quan ${n(b)} ja ha acabat.` : kind === 'on' ? `${n(a)} comença el dia ${b}.` : `${n(a)} i ${n(b)} no poden coincidir cap dia.`;
};
export function brokenRules(L, starts) {
  const len = L.tasks.map(t => t[2]);
  return L.rules.flatMap((r, k) => RULES[r[0]](starts, len, r[1], r[2]) ? [] : [k]);
}
// the seesaw: it is level when the pivot is at the mean
export const balanced = (L, x) => x === mean(STATS[L.stats].vals);

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona: a Piscina to get in, a map of three circles, a mark for each project, an exam for each
// circle, XP and badges. A project is one of the sections above, with its ten levels
export const PROJECTS = SECTIONS;
export const CIRCLES = [
  { name: 'Primeres dades', projects: [0, 1] },
  { name: 'Comparar i agrupar', projects: [2, 3, 4] },
  { name: 'Detectiu de dades', projects: [5, 6, 7] }
];
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, xpOf, levelText, isOpen, examOpen, levelIn, examIn, sheetIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the Piscina: three taps on three charts
export const POOL = [
  { chart: B('mundials'), q: q.most()(ctxOf(B('mundials'))) },
  { chart: T('paris', { rows: [2, 3, 4] }), q: q.most(0)(ctxOf(T('paris', { rows: [2, 3, 4] }))) },
  { chart: Vn('op', { k: 1, items: [0, 1, 2] }), q: vq.who([1])(ctxOf(Vn('op', { k: 1, items: [0, 1, 2] }))) }
];

// What is saved is facts only: { so, stars[80], piscina, exams[3], fulls }. Marks, XP, level and badges are worked out, never stored.
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
  { name: 'Detectiu de dades', what: 'Supera els tres exàmens.' }
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

// A sheet: three sentences somebody wrote about a chart, each { kind, chart, says, real, opts }: says is the sentence written, real the
// true one (the sentence is wrong when they differ) and opts the three to choose from when fixing it. The mistakes are the ones a
// reader makes: a number read from the wrong row or column, the second biggest taken for the biggest, a difference badly worked out
const SOURCES = [['paris', [0, 2, 3, 4, 6, 10], [0, 1, 2]], ['lliga', [0, 1, 2, 3, 4, 5], [0, 1, 2, 5]], ['cont', [0, 1, 2, 3, 5, 6], [0, 2]],
  ['mundials', [0, 3, 4, 6], [0]], ['champions', [0, 1, 2, 4, 5], [0]], ['recomp', [0, 1, 5, 4, 8], [0]], ['palla', [0, 1, 2, 5, 7, 9], [0, 1]]];
const pickOf = (a, rnd) => a[at(a.length, rnd)];
const art = S => /^[aeiouàèéíòóú]/i.test(S.who) ? "L'" : S.fem ? 'La ' : 'El ';
const sayMost = (S, C, r) => `${art(S)}${S.who} amb ${C.most || 'més ' + C.of} ${r.pl ? 'són' : 'és'} ${r.the}.`;
// a chart of one column with its rows: a table or bars
const sourceChart = (id, rows, c, rnd) => rnd() < 0.5 ? T(id, { rows, c, cols: SETS[id].cols.length > 1 ? [c] : undefined }) : B(id, { rows, c, labels: true });
const CLAIM = {
  val(bad, rnd) {
    const [id, rows, cs] = pickOf(SOURCES, rnd), S = SETS[id], c = pickOf(cs, rnd), i = pickOf(rows, rnd), r = S.rows[i], v = r.v[c];
    const others = shuffle([...new Set(rows.map(k => S.rows[k].v[c]).filter(x => x !== v))], rnd);
    const wrong = others.length >= 2 ? others.slice(0, 2) : [v + 1, v + 2];
    return { chart: sourceChart(id, rows, c, rnd), real: fill(S.cols[c].tell, r, v), says: bad ? fill(S.cols[c].tell, r, wrong[0]) : fill(S.cols[c].tell, r, v),
      opts: shuffle([v, ...wrong].map(x => fill(S.cols[c].tell, r, x)), rnd) };
  },
  most(bad, rnd) {
    for (let n = 0; ; n++) {
      const [id, rows, cs] = pickOf(SOURCES, rnd), S = SETS[id], c = pickOf(cs, rnd), C = S.cols[c];
      const sorted = rows.slice().sort((a, b) => S.rows[b].v[c] - S.rows[a].v[c]);
      // only a column whose biggest is alone, and a second one that is not tied with the third
      if (n < 40 && (S.rows[sorted[0]].v[c] === S.rows[sorted[1]].v[c] || S.rows[sorted[1]].v[c] === S.rows[sorted[2]].v[c])) continue;
      const [top, second, third] = sorted.map(k => S.rows[k]);
      return { chart: sourceChart(id, rows, c, rnd), real: sayMost(S, C, top), says: sayMost(S, C, bad ? second : top), opts: shuffle([top, second, third].map(r => sayMost(S, C, r)), rnd) };
    }
  },
  diff(bad, rnd) {
    for (let n = 0; ; n++) {
      const [id, rows, cs] = pickOf(SOURCES.filter(s => SETS[s[0]].cols[s[2][0]].count), rnd), S = SETS[id], c = pickOf(cs.filter(k => S.cols[k].count), rnd);
      const [a, b] = shuffle(rows.slice(), rnd), A = S.rows[a], Bq = S.rows[b], d = A.v[c] - Bq.v[c];
      if (d <= 0 && n < 40) continue;
      const say = x => ca(`${cap(A.the)} ${A.pl ? 'tenen' : 'té'} ${num(x)} ${S.cols[c].of} més que ${Bq.the}.`);
      const wrong = [d + 1 + at(3, rnd), Math.max(1, d - 1 - at(2, rnd))].filter(x => x !== d);
      return { chart: sourceChart(id, rows, c, rnd), real: say(d), says: bad ? say(wrong[0]) : say(d), opts: shuffle([d, wrong[0], wrong[1] ?? d + 5].map(say), rnd) };
    }
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
