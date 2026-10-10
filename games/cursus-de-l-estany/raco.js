// «El racó de pensar»: three activities next to the projects, none of them a list of bare divisions.
//   problems()    stories to solve, where what is asked decides what to do with the remainder (the groups that are full, the ones needed, what is left, what is missing)
//   statements()  sentences about dividing to judge as «Sempre», «De vegades» or «Mai», each with its reason
//   fact()        one fact of a table asked from one of its three sides (D ÷ d = ?, ? × d = D, D ÷ ? = q), with four choices: the lightning round
// Pure, like logic.js: no document here. A story is a question of mode 'story' that the question loop of main.js asks like any other;
// it carries its own texts (text, hint, why, fb) and its answer (w), and logic.js reads them (want, explain, said).
import { at, shuffle } from './logic.js';

const int = (a, b, rnd) => a + at(b - a + 1, rnd);
export const ROUND = 4;        // questions in a round of stories or of sentences
export const ROUND_PASS = 3;   // right at the first answer for the round to count

/* ---------- stories ---------- */
// Groups of d with some left over. art and things name what is grouped («Les 3 granotes»), boxes what holds a group, full a group that is whole, one «one more of them».
// Each kind a story can ask has its question: full (the whole groups: q), need (the groups for all of them: q + 1), left (what is over: r), short (what is missing for one more group: d − r).
const GROUPED = [
  { set: (D, d) => `${D} granotes volen travessar l'estany. A cada barca n'hi caben ${d}.`, art: 'Les', things: 'granotes', boxes: 'barques', full: 'barques plenes', one: 'una barca',
    ask: { full: 'Quantes barques surten plenes?', need: 'Quantes barques calen perquè hi passin totes?', left: 'Quantes granotes van a la barca que no s\'omple?' } },
  { set: (D, d) => `Hi ha ${D} cuques de llum. A cada fanal n'hi van ${d}.`, art: 'Les', things: 'cuques', boxes: 'fanals', full: 'fanals plens', one: 'un fanal',
    ask: { full: 'Quants fanals queden plens?', need: 'Quants fanals calen per guardar-les totes?', left: 'Quantes cuques hi ha al fanal que no queda ple?' } },
  { set: (D, d) => `La granota ha collit ${D} móres. A cada cistell n'hi caben ${d}.`, art: 'Les', things: 'móres', boxes: 'cistells', full: 'cistells plens', one: 'un cistell',
    ask: { full: 'Quants cistells queden plens?', need: 'Quants cistells calen per endur-se-les totes?', left: 'Quantes móres hi ha al cistell que no queda ple?' } },
  { set: (D, d) => `Amb ${D} petxines es fan collarets de ${d} petxines cada un.`, art: 'Les', things: 'petxines', boxes: 'collarets', full: 'collarets sencers', one: 'un collaret',
    ask: { full: 'Quants collarets sencers surten?', left: 'Quantes petxines sobren?', short: 'Quantes petxines falten per fer un collaret més?' } },
  { set: (D, d) => `${D} capgrossos neden en files de ${d}.`, art: 'Els', things: 'capgrossos', boxes: 'files', full: 'files senceres', one: 'una fila',
    ask: { full: 'Quantes files senceres fan?', left: 'Quants capgrossos queden fora de les files?', short: 'Quants capgrossos falten per fer una fila més?' } }
];
const cap = s => s[0].toUpperCase() + s.slice(1);
// a story with a remainder: Q and R are at least 2 (no singulars to write), and so is what is missing in a 'short' one
function grouped(T, kind, rnd) {
  const d = int(kind === 'short' ? 4 : 3, 8, rnd), Q = int(2, 6, rnd), R = int(2, d - (kind === 'short' ? 2 : 1), rnd), D = d * Q + R;
  const els = T.art.toLowerCase(), base = `${D} ÷ ${d} = ${Q} i en sobren ${R}.`;
  const w = { full: Q, need: Q + 1, left: R, short: d - R }[kind], units = kind === 'left' || kind === 'short' ? T.things : T.boxes;
  const why = {
    full: `${base} Surten ${Q} ${T.full}: amb ${els} ${R} ${T.things} que sobren no n'hi ha prou per a cap més.`,
    need: `${base} ${T.art} ${R} ${T.things} que sobren també necessiten ${T.one}: en calen ${Q} + 1 = ${Q + 1}.`,
    left: `${base} ${T.art} ${R} que sobren són la resposta: no arriben per fer un grup de ${d}.`,
    short: `${base} Per fer un grup més de ${d} en falten ${d} − ${R} = ${d - R}.`
  }[kind];
  // what a wrong answer that is another number of the same division means
  const fb = {};
  const say = (a, t) => { if (a !== w && !(a in fb)) fb[a] = t; };
  if (kind === 'need') say(Q, `Amb ${Q} ${T.boxes} només n'hi caben ${d} × ${Q} = ${d * Q}: en queden ${R} fora.`);
  if (kind === 'full') say(Q + 1, `Per tenir ${Q + 1} ${T.full} caldrien ${d} × ${Q + 1} = ${d * (Q + 1)} ${T.things}, i només n'hi ha ${D}.`);
  if (kind === 'left' || kind === 'short') { say(Q, `${Q} és el nombre de ${T.boxes}. Et demanen ${T.things}.`); if (kind === 'short') say(R, `${R} són ${els} que sobren. Et demanen què falta per arribar a ${d}.`); }
  else say(R, `${R} són ${els} ${T.things} que sobren. Et demanen ${T.boxes}.`);
  return { mode: 'story', fig: 'rem', kind, D, d, w, lab: cap(units), text: `${T.set(D, d)} ${T.ask[kind]}`, why, fb,
    hint: `Fes grups de ${d} amb el material. Després torna a llegir la pregunta: et demana els grups sencers, tots els que calen, o el que sobra?` };
}
// a story that divides exactly: a sharing (the material is the lily pads) or a grouping (the rings)
const EXACT = [
  { fig: 'share', lab: 'Mosques', text: (D, d) => `${D} mosques es reparteixen entre ${d} granotes, a parts iguals. Quantes mosques toquen a cada granota?`,
    why: (D, d, Q) => `${D} ÷ ${d} = ${Q}: a cada granota li toquen ${Q} mosques, perquè ${d} × ${Q} = ${D}.`, hint: () => 'Fes servir el material: cada nenúfar fa de granota. Reparteix-les d\'una en una.' },
  { fig: 'share', lab: 'Pedretes', text: (D, d) => `El tritó té ${D} pedretes i en fa ${d} munts iguals. Quantes pedretes té cada munt?`,
    why: (D, d, Q) => `${D} ÷ ${d} = ${Q}: cada munt té ${Q} pedretes, perquè ${d} × ${Q} = ${D}.`, hint: () => 'Fes servir el material: cada nenúfar fa de munt. Reparteix-les d\'una en una.' },
  { fig: 'group', lab: 'Files', text: (D, d) => `${D} capgrossos neden en files de ${d}. Quantes files fan?`,
    why: (D, d, Q) => `${D} ÷ ${d} = ${Q}: fan ${Q} files, perquè ${Q} × ${d} = ${D}.`, hint: (d) => `Fes grups de ${d} amb el material: cada grup és una fila.` },
  { fig: 'group', lab: 'Fanals', text: (D, d) => `Hi ha ${D} cuques de llum i a cada fanal n'hi van ${d}. Quants fanals s'omplen?`,
    why: (D, d, Q) => `${D} ÷ ${d} = ${Q}: s'omplen ${Q} fanals, perquè ${Q} × ${d} = ${D}.`, hint: (d) => `Fes grups de ${d} amb el material: cada grup és un fanal.` }
];
function exact(T, rnd) {
  const d = int(2, T.fig === 'share' ? 5 : 8, rnd), Q = int(2, 6, rnd), D = d * Q;
  return { mode: 'story', fig: T.fig, kind: 'exact', D, d, w: Q, lab: T.lab, text: T.text(D, d), why: T.why(D, d, Q), hint: T.hint(d), fb: {} };
}
// A round of ROUND stories. Before the remainder is known (rem false) they all divide exactly; with it, one exact story and three with a remainder,
// each of another kind and another setting, so the same division has to be read in three ways.
export function problems(rem, rnd = Math.random) {
  const ex = shuffle(EXACT.slice(), rnd);
  if (!rem) return ex.slice(0, ROUND).map(T => exact(T, rnd));
  // the kinds that only some settings can ask go first, so a setting that can is still free for them
  const kinds = shuffle(['full', 'need', 'left', 'short'], rnd).slice(0, ROUND - 1).sort((a, b) => /full|left/.test(a) - /full|left/.test(b)), free = shuffle(GROUPED.slice(), rnd), out = [exact(ex[0], rnd)];
  for (const k of kinds) { const i = free.findIndex(T => T.ask[k]); out.push(grouped(free.splice(i, 1)[0], k, rnd)); }
  return shuffle(out, rnd);
}

/* ---------- sentences: always, sometimes or never ---------- */
export const SVM = ['Sempre', 'De vegades', 'Mai'];
// a: the place in SVM of what is true; c: the circle whose words the sentence needs (0: sharing and groups, 1: quotient and remainder)
const SAYS = [
  { c: 0, a: 0, s: 'Si reparteixes un nombre parell entre 2, no en sobra cap.', why: 'Un nombre parell es pot posar tot en parelles: 8 ÷ 2 = 4, 14 ÷ 2 = 7. Mai no en queda cap de sol.' },
  { c: 0, a: 0, s: 'Si reparteixes un nombre senar entre 2, en sobra 1.', why: 'Un nombre senar és un de parell i un més: 9 són 4 parelles i 1 de sol, 15 són 7 parelles i 1 de sol.' },
  { c: 0, a: 0, s: 'Dividir entre 4 és el mateix que fer la meitat de la meitat.', why: '20 ÷ 4 = 5; la meitat de 20 és 10, i la meitat de 10 és 5. Passa amb qualsevol nombre, perquè 4 = 2 × 2.' },
  { c: 0, a: 1, s: 'Un nombre de la taula del 3 també és de la taula del 6.', why: '12 és de totes dues (3 × 4 i 6 × 2), però 9 és de la taula del 3 i no de la del 6.' },
  { c: 0, a: 0, s: 'Un nombre de la taula del 6 també és de la taula del 3.', why: 'Cada 6 són dos grups de 3: 6 × 4 = 24, i 24 = 3 × 8. Sempre es pot fer.' },
  { c: 0, a: 2, s: 'Un nombre acabat en 5 es pot repartir entre 2 sense que en sobri cap.', why: 'Un nombre acabat en 5 és senar: 15, 25, 35... En repartir-lo entre 2 sempre en sobra 1.' },
  { c: 0, a: 0, s: 'Un nombre acabat en 0 es pot repartir entre 5 sense que en sobri cap.', why: 'Un nombre acabat en 0 està fet de desenes, i cada desena són dos grups de 5: 30 ÷ 5 = 6, 70 ÷ 5 = 14.' },
  { c: 0, a: 1, s: 'Si canvies de lloc els dos números d\'una divisió, el resultat és el mateix.', why: '12 ÷ 3 = 4, però 3 ÷ 12 no fa 4. Només passa quan els dos números són iguals: 5 ÷ 5 = 1.' },
  { c: 1, a: 0, s: 'El residu és més petit que el divisor.', why: 'Si en sobressin tantes com el divisor, encara es podria fer un grup més. A 17 ÷ 5 en sobren 2, mai 5 o més.' },
  { c: 1, a: 2, s: 'En dividir entre 5, el residu és 5.', why: 'Amb 5 que sobren es fa un grup més de 5. El residu de dividir entre 5 només pot ser 0, 1, 2, 3 o 4.' },
  { c: 1, a: 1, s: 'El quocient és més petit que el dividend.', why: '12 ÷ 3 = 4, i 4 és més petit que 12. Però 7 ÷ 1 = 7: en dividir entre 1 surt el mateix nombre.' },
  { c: 1, a: 0, s: 'Divisor per quocient, més el residu, torna a fer el dividend.', why: 'És la prova de la divisió: 17 ÷ 5 = 3 i en sobren 2, i 5 × 3 + 2 = 17. Els grups i el que sobra són totes les que hi havia.' },
  { c: 1, a: 1, s: 'Una divisió té residu.', why: '17 ÷ 5 en té (en sobren 2), però 15 ÷ 5 no: el residu és 0 quan el dividend és de la taula del divisor.' },
  { c: 1, a: 2, s: 'Si en una divisió en sobren, el dividend és de la taula del divisor.', why: 'Els nombres de la taula del divisor es reparteixen justos, sense residu: 20 ÷ 5 = 4. Si en sobren, no és de la taula.' },
  { c: 1, a: 0, s: 'En una divisió exacta, si fas el dividend el doble, el quocient també surt el doble.', why: '12 ÷ 3 = 4 i 24 ÷ 3 = 8. Si hi ha el doble de cuques per als mateixos nenúfars, a cada un n\'hi toca el doble.' }
];
// ROUND different sentences from the circles the child has opened (rem: the words of circle 1 too)
export const statements = (rem, rnd = Math.random) => shuffle(SAYS.filter(x => rem || x.c === 0), rnd).slice(0, ROUND).map(x => ({ ...x }));

/* ---------- the lightning round ---------- */
// One fact d × q = D asked from one of its three sides, with four different choices in a random order, the right one among them.
// wide: every table up to 10; else the tables of the first circle (2 to 5, up to 30).
export function fact(wide, rnd = Math.random) {
  const d = int(2, wide ? 10 : 5, rnd), q = int(wide ? 2 : 1, wide ? 10 : 6, rnd), D = d * q, side = at(3, rnd);
  const w = side === 2 ? d : q, text = [`${D} ÷ ${d} = ?`, `? × ${d} = ${D}`, `${D} ÷ ? = ${q}`][side];
  const opts = [w];
  for (const x of shuffle([w + 1, w - 1, w + 2, w - 2, side === 2 ? q : d, w + 3], rnd)) if (opts.length < 4 && x > 0 && !opts.includes(x)) opts.push(x);
  return { text, w, opts: shuffle(opts, rnd), told: `${D} ÷ ${d} = ${q}, perquè ${q} × ${d} = ${D}` };
}
