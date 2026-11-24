import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
import { ETAPES, ACCIONS, VOLCANS, OCELLS, BARREJA, FAIG, DIC, FONTS, BUSCA, TEXTOS } from './contingut.js';
import { TIRES, FEINES, DIES, CREW, PUZZLES, CONVERSES, NODIU, IMPREVISTOS, MALES } from './reptes.js';
// The rules and the rounds of «La brúixola de l'estany», with no page in it. The game teaches the six stages of a school project
// (contingut.js), where the class is at any moment, how to take part in the group and how to pull the information a project needs
// out of a text. A round is a list of items, each of one kind:
//   mira    watch the six stages light up along the compass, in order
//   ordre   put the six stages in order (cards: the stages, shuffled)
//   etapa   a moment of the class (text): tap its stage on the compass (ok: the stage)
//   pick    one right answer among opts (ok: its index); pre is the moment it is about, ctx a text it is about, per why it is right
//   frase   a text (ctx) and the project's question: tap the sentence that answers it (ok: its index; kw: words to look for)
//   multi   tap the n right ones among opts (oks: their indexes), with a text behind when there is one
//   riu     bottles come down the river one by one: tap the stage of each before it goes past (cards: { t, e }, secs for each)
//   intrus  three of the four cards are of one stage: tap the odd one (ok: its index, e: the stage of the others)
//   caixes  put each card in the box of its stage (boxes: stages; cards: { t, e })
//   diari   the steps of one project, shuffled: put them in order (cards: { t, e })
//   pla     a puzzle: read the clues and put each job with its person or on its day (slots, cards: { t, pic, to }, clues)
//   conversa three turns of talk with one of the crew (who, torns: [{ diu, o: [{ t, re }], ok }])
//   subratlla tap the key words in the sentence itself (ctx, s, chunks: [{ t, key, tail }], n)
//   fitxa   fill the gaps of a note with words of the text (ctx, s, parts: [{ t } or { b }], opts)
//   vfn     true, false or «the text does not say» for each claim (ctx, claims: [{ t, a, per }])
//   casa    each sentence goes to the question it answers, or to the bin (qs, cards: { t, to }; to -1 is the bin)
//   mural   build the poster: title, drawing and three facts, leaving out what does not belong (tema, cards: { t, zone, no })
//   discurs say the presentation in order: opening, facts, closing, in front of the audience (cards: { t, role })
// st, when an item has it, is the stage whose place in the 3D island it is played at.
// Chance enters only through rnd; it must keep importing from Node. Right answers come first in the content and are shuffled here.
export { ETAPES, TEXTOS, DIES };

/* ---------- chance ---------- */
const pick = (r, a) => a[at(a.length, r)];
const mix = (r, a) => shuffle(a.slice(), r);
const draw = (r, pool, n) => mix(r, pool).slice(0, n);
const ALL = [0, 1, 2, 3, 4, 5];
// the options of a question, shuffled: o has the right one first, as a string or as { t, ... }
function choice(r, o, n = 4) {
  const os = o.map(x => (typeof x === 'string' ? { t: x } : x)), keep = mix(r, [os[0], ...mix(r, os.slice(1)).slice(0, n - 1)]);
  return { opts: keep, ok: keep.indexOf(os[0]) };
}

/* ---------- the items ---------- */
const mira = () => ({ k: 'mira', q: 'Mira el camí del projecte' });
const ordre = r => ({ k: 'ordre', q: 'Posa les sis etapes en ordre', inst: 'Toca-les en ordre: primer la que va primer.', cards: mix(r, ALL) });
const etapa = (text, e, extra = {}) => ({ k: 'etapa', q: 'Quina etapa és?', inst: "Toca l'etapa a la brúixola.", text, ok: e, ...extra });
// the stage after (or before) one: (e, after) pairs that have an answer
const PAIRS = [[0, true], [1, true], [2, true], [3, true], [4, true], [1, false], [2, false], [3, false], [4, false], [5, false]];
function seguent(r, [e, after]) {
  const ok = after ? e + 1 : e - 1, o = [ok, ...draw(r, ALL.filter(x => x !== ok && x !== e), 3)].map(i => ({ t: ETAPES[i].nom, pic: ETAPES[i].icona }));
  return { k: 'pick', q: after ? `Acabem l'etapa «${ETAPES[e].nom}». Quina etapa ve després?` : `Som a «${ETAPES[e].nom}». Quina etapa ve just abans?`, ...choice(r, o), e: ok, st: e,
    per: `${ETAPES[ok].nom}: ${ETAPES[ok].que}`, hint: 'Pensa en el camí de la brúixola: va en el sentit de les agulles del rellotge.' };
}
// what is done in a stage, among things done in other stages
function queFem(r, e) {
  const o = [pick(r, ETAPES[e].fem), ...draw(r, ALL.filter(x => x !== e), 3).map(x => pick(r, ETAPES[x].fem))];
  return { k: 'pick', q: `A l'etapa «${ETAPES[e].nom}», què fem?`, ...choice(r, o), e, per: ETAPES[e].que, hint: `Pregunta't: ${ETAPES[e].preguntes.join(' ')}` };
}
const SENYALS = ETAPES.flatMap((E, e) => E.senyals.map(s => [e, s]));
const FRASES = ETAPES.flatMap((E, e) => E.frases.map(f => [e, f]));
const accio = c => etapa(c[1], c[0], { q: 'A classe passa això. Quina etapa és?' });
const senyal = ([e, s]) => etapa(`«${s}»`, e, { q: 'Això es diu a classe. En quina etapa?' });
const dita = ([e, f]) => etapa(`«${f}»`, e, { q: 'Tu dius això. En quina etapa ets?' });
// a day of a diary: where the class is, and what the child can do that day
const scene = (d, D) => etapa(d.t, d.e, { q: `${D.icona} ${D.nom} · Avui a classe…`, tema: D.nom });
const ara = (r, d) => ({ k: 'pick', q: 'Què pots fer tu ara?', pre: d.t, ...choice(r, d.ara, 3), e: d.e, per: `És el que toca a «${ETAPES[d.e].nom}»: ${ETAPES[d.e].que}` });
const mixScene = d => scene(d, { icona: d.icona, nom: d.tema });
// a moment of group work: what to do (FAIG) or what to say (DIC)
const moment = (r, m, dic) => ({ k: 'pick', q: m.s, inst: dic ? 'Què dius?' : 'Què fas?', ...choice(r, m.o, 3), e: m.e, per: m.per });
const quan = m => etapa(m.s, m.e, { q: 'En quina etapa del projecte passa això?' });
// the texts: the sentence that answers, the key words of the note, the good note, where to look, what is answered and what is left
const frase = (T, q) => ({ k: 'frase', q: `El projecte vol saber: ${q.q}`, inst: '🔍 Toca la frase del text que ho respon.', ctx: T, ok: q.s, kw: q.kw });
function claus(r, T, q) {
  const n = q.kw.length, words = mix(r, [...q.kw, ...draw(r, T.dis.filter(d => !q.kw.includes(d)), 7 - n)]);
  return { k: 'multi', q: `La fitxa: ${q.q}`, inst: `Tria les ${n === 2 ? 'dues' : 'tres'} paraules clau de la frase que brilla.`, ctx: T, s: q.s, opts: words.map(t => ({ t })),
    oks: words.map((w, i) => (q.kw.includes(w) ? i : -1)).filter(i => i >= 0), n };
}
function nota(r, T, q) {
  const o = [{ t: q.nota[0] }, { t: T.sents.slice(0, 3).join(' '), no: 'Copiar tot el text no és una fitxa. Tria només la dada.' }, { t: q.nota[1], no: 'Això no ho diu el text. Torna a llegir la frase que brilla.' }];
  return { k: 'pick', q: `Quina fitxa és la bona per a: ${q.q}`, inst: 'Una fitxa bona diu la dada exacta amb poques paraules.', ctx: T, s: q.s, ...choice(r, o, 3), e: 2, per: 'Poques paraules i la dada exacta: així es fa una fitxa.' };
}
const font = (r, b) => ({ k: 'pick', q: b.q, inst: 'On ho busques?', ...choice(r, [b.ok, ...draw(r, FONTS.filter(f => f !== b.ok), 3)]), e: 2, per: 'Cada pregunta té el seu lloc on buscar-la.' });
const others = T => TEXTOS.filter(x => x !== T);
function respon(r, T) {
  const mine = draw(r, T.qs, 2), theirs = draw(r, pick(r, others(T)).qs, 2), all = mix(r, [...mine, ...theirs]);
  return { k: 'multi', q: 'El grup vol saber aquestes quatre coses. Quines respon aquest text?', inst: "N'hi ha dues. Toca-les.", ctx: T, opts: all.map(q => ({ t: q.q })),
    oks: all.map((q, i) => (mine.includes(q) ? i : -1)).filter(i => i >= 0), n: 2, marks: mine.map(q => q.s) };
}
function falta(r, T) {
  const mine = draw(r, T.qs, 2), miss = pick(r, pick(r, others(T)).qs);
  return { k: 'pick', q: 'Volem saber tres coses. El text en respon dues. Quina ens falta buscar encara?', ctx: T, ...choice(r, [miss.q, ...mine.map(q => q.q)], 3), e: 2,
    per: 'El text no en parla: aquesta cal buscar-la en un altre lloc.', marks: mine.map(q => q.s) };
}

/* ---------- the new trials ---------- */
const CARDS = { acc: ACCIONS.map(([e, t]) => ({ e, t })), sen: SENYALS.map(([e, s]) => ({ e, t: '«' + s + '»' })), dit: FRASES.map(([e, f]) => ({ e, t: '«' + f + '»' })) };
CARDS.mix = [...CARDS.acc, ...CARDS.sen];
// n cards with the stages as even as they can be
function spread(r, pool, n, stages = ALL) {
  const by = stages.map(e => mix(r, pool.filter(c => c.e === e))), out = [];
  for (let k = 0; out.length < n && k < n * 8; k++) { const b = by[k % by.length]; if (b.length) out.push(b.pop()); }
  return mix(r, out);
}
const riu = (r, n, secs, pool = CARDS.mix) => ({ k: 'riu', q: 'Ampolles pel riu!', inst: "Cada ampolla porta un missatge. Toca la seva etapa abans que passi de llarg.", cards: spread(r, pool, n), secs });
function intrus(r, pool = CARDS.acc) {
  const e = pick(r, ALL), same = draw(r, pool.filter(c => c.e === e), 3), odd = pick(r, pool.filter(c => c.e !== e)), opts = mix(r, [...same, odd]);
  return { k: 'intrus', q: 'Quina és la intrusa?', inst: 'Tres són de la mateixa etapa. Toca la que no hi va.', opts, ok: opts.indexOf(odd), e, per: 'Les altres tres són de «' + ETAPES[e].nom + '». Aquesta és de «' + ETAPES[odd.e].nom + '».' };
}
// the stages that are easiest to mix up, side by side
const NEAR = [[2, 3], [3, 4], [0, 1], [4, 5], [1, 2], [0, 5]];
function caixes(r, nb, n, pool = CARDS.acc) {
  const first = pick(r, NEAR), boxes = nb === 2 ? first : mix(r, [...first, pick(r, ALL.filter(e => !first.includes(e)))]);
  return { k: 'caixes', q: 'Cada cosa a la seva caixa', inst: 'Toca una targeta i després la seva caixa, o arrossega-la.', boxes, cards: spread(r, pool, n, boxes) };
}
// the steps of one story, a run of n of the six, shuffled
function diari(r, n, id) {
  const T = id ? TIRES.find(x => x.id === id) : pick(r, TIRES), from = at(6 - n + 1, r);
  const cards = T.passos.map((t, e) => ({ t, e })).slice(from, from + n);
  return { k: 'diari', q: T.pic + ' ' + T.tema + ': què va primer?', inst: 'Toca els passos en ordre, del primer a l\'últim.', cards: mix(r, cards), tema: T.tema };
}
// who does what: a puzzle of PUZZLES (size 3 or 4 people)
function plaQui(r, size) {
  const P = pick(r, PUZZLES.filter(x => x.crew.length === size)), sol = solve(P);
  const cards = mix(r, P.feines.map(([t, pic], j) => ({ t, pic, to: P.crew.indexOf(sol[j]) })));
  return { k: 'pla', st: 1, q: P.titol + ': qui fa què?', inst: 'Llegeix les pistes. Toca una feina i després qui la fa.', clues: P.pistes.map(c => c.t), slots: P.crew.map(c => ({ t: CREW[c].nom, pic: CREW[c].pic })), cards };
}
// the only way of sharing the jobs that fits the clues: for each job, the person
export function solve(P) {
  const ok = (c, j) => P.pistes.every(x => !(x.no || []).some(([a, b]) => a === c && b === j) && !(x.si && ((x.si[0] === c) !== (x.si[1] === j))));
  const found = [], go = (j, used, got) => { if (j === P.feines.length) { found.push(got); return; } for (const c of P.crew) if (!used.includes(c) && ok(c, j)) go(j + 1, [...used, c], [...got, c]); };
  go(0, [], []);
  return found.length === 1 ? found[0] : null;
}
export const solutions = P => { const ok = (c, j) => P.pistes.every(x => !(x.no || []).some(([a, b]) => a === c && b === j) && !(x.si && ((x.si[0] === c) !== (x.si[1] === j)))); let n = 0; const go = (j, used) => { if (j === P.feines.length) { n++; return; } for (const c of P.crew) if (!used.includes(c) && ok(c, j)) go(j + 1, [...used, c]); }; go(0, []); return n; };
// the week of a project: some days are holidays and the jobs go in the order of the stages on the days left
function plaDies(r, festes) {
  const shut = draw(r, [0, 1, 2, 3, 4], festes), open = [0, 1, 2, 3, 4].filter(d => !shut.includes(d)), n = open.length, from = at(6 - n + 1, r);
  const cards = mix(r, Array.from({ length: n }, (_, i) => ({ t: pick(r, FEINES[from + i]), pic: ETAPES[from + i].icona, to: open[i] })));
  const names = shut.slice().sort((a, b) => a - b).map(d => DIES[d].toLowerCase());
  return { k: 'pla', st: 1, days: true, q: 'El calendari de la setmana', inst: 'Toca una feina i després el seu dia.', clues: [(names.length > 1 ? names.join(' i ') + ' són festa.' : names[0] + ' és festa.').replace(/^./, c => c.toUpperCase()), "Les feines van en l'ordre de les etapes, una per dia."],
    slots: DIES.map((t, d) => ({ t, shut: shut.includes(d) })), cards };
}
function conversa(r, e) {
  const C = pick(r, e === undefined ? CONVERSES : CONVERSES.filter(x => x.e === e));
  return { k: 'conversa', st: C.e, q: C.titol, who: C.who, torns: C.torns.map(T => { const os = T.o.map(([t, re]) => ({ t, re })), o = mix(r, os); return { diu: T.diu, o, ok: o.indexOf(os[0]) }; }) };
}
// a sentence in pieces, with the key words (whole phrases) as pieces of their own
export function chunks(sent, kw) {
  const low = sent.toLowerCase(), marks = [], isL = c => !!c && /\p{L}/u.test(c);
  for (const w of kw) { const x = w.toLowerCase(), i = low.indexOf(x); if (i >= 0 && !isL(low[i - 1]) && !isL(low[i + x.length]) && !marks.some(([a, b]) => i < b && i + x.length > a)) marks.push([i, i + x.length]); }
  marks.sort((a, b) => a[0] - b[0]);
  const out = [], plain = s => { for (const t of s.split(/\s+/).filter(Boolean)) { if (/^\p{P}+$/u.test(t) && out.length) out[out.length - 1].tail += t; else out.push({ t, key: false, tail: '' }); } };
  let k = 0;
  for (const [a, b] of marks) { plain(sent.slice(k, a)); out.push({ t: sent.slice(a, b), key: true, tail: '' }); k = b; }
  const rest = sent.slice(k), m = rest.match(/^\p{P}+/u); if (m && out.length) { out[out.length - 1].tail += m[0]; plain(rest.slice(m[0].length)); } else plain(rest);
  return out;
}
function subratlla(r, T, q0) {
  const q = q0 || pick(r, T.qs.filter(x => chunks(T.sents[x.s], x.kw).filter(c => c.key).length >= 2)), cs = chunks(T.sents[q.s], q.kw), n = cs.filter(c => c.key).length;
  return { k: 'subratlla', st: 2, q: 'El projecte vol saber: ' + q.q, inst: 'Subratlla les ' + (n === 2 ? 'dues' : 'tres') + ' paraules clau de la frase.', ctx: T, s: q.s, chunks: cs, n };
}
// a note with holes where its key words go
function fitxa(r, T, q0) {
  const good = T.qs.filter(x => chunks(x.nota[0], x.kw).filter(c => c.key).length >= 2), q = q0 && good.includes(q0) ? q0 : pick(r, good);
  const cs = chunks(q.nota[0], q.kw), blanks = cs.filter(c => c.key).map(c => c.t), bare = blanks.map(b => b.toLowerCase());
  const opts = mix(r, [...blanks, ...draw(r, T.dis.filter(d => !bare.includes(d.toLowerCase())), 3)]);
  return { k: 'fitxa', st: 2, q: 'Completa la fitxa: ' + q.q, inst: 'Toca les paraules que falten. Són al text.', ctx: T, s: q.s, parts: cs.map(c => (c.key ? { b: c.t, tail: c.tail } : { t: c.t + c.tail })), opts, n: blanks.length };
}
function vfn(r, T, n = 3) {
  const qs = mix(r, T.qs), no = draw(r, NODIU[T.id], 2), base = [{ t: qs[0].nota[0], a: 'v', per: 'Ho diu el text.', s: qs[0].s }, { t: qs[1].nota[1], a: 'f', per: 'El text diu: ' + qs[1].nota[0], s: qs[1].s }, { t: no[0], a: 'n', per: "El text no en parla. Potser és veritat, però aquí no ho diu." }];
  const more = [{ t: qs[2].nota[0], a: 'v', per: 'Ho diu el text.', s: qs[2].s }, { t: no[1], a: 'n', per: "El text no en parla. Potser és veritat, però aquí no ho diu." }];
  return { k: 'vfn', st: 2, q: 'Veritat, fals o no ho diu?', inst: 'Compte: «no ho diu» vol dir que al text no hi surt.', ctx: T, claims: mix(r, [...base, ...more.slice(0, Math.max(0, n - 3))]) };
}
function casa(r, T) {
  const qs = draw(r, T.qs, 3), used = qs.map(q => q.s), cards = T.sents.map((t, i) => ({ t, to: used.indexOf(i) }));
  return { k: 'casa', st: 2, q: T.icona + ' ' + T.titol + ': cada frase a la seva pregunta', inst: 'Toca una frase i després la pregunta que respon. Les que no en responen cap, a la paperera.', qs: qs.map(q => q.q), cards: mix(r, cards) };
}
function mural(r, T) {
  const O = pick(r, others(T)), qs = draw(r, T.qs, 3), fake = pick(r, T.qs.filter(q => !qs.includes(q)).concat(qs)).nota[1], stray = pick(r, O.qs).nota[0];
  const cards = [{ t: T.titol, zone: 'titol' }, { t: O.titol, zone: 'titol', no: "Aquest títol és d'un altre projecte." }, { t: T.icona, zone: 'dibuix', pic: true }, { t: O.icona, zone: 'dibuix', pic: true, no: 'Aquest dibuix no té res a veure amb el tema.' },
    ...qs.map(q => ({ t: q.nota[0], zone: 'dada' })), { t: fake, zone: 'dada', no: 'Aquesta dada no és el que diu el text.' }, { t: stray, zone: 'dada', no: "Aquesta dada és d'un altre tema." }];
  return { k: 'mural', st: 3, q: 'Fes el mural: ' + T.titol, inst: 'Posa el títol, el dibuix i tres dades. Compte: algunes targetes no hi van!', tema: { titol: T.titol, icona: T.icona, hue: T.hue }, cards: mix(r, cards) };
}
function discurs(r, T) {
  const facts = draw(r, T.qs, 3).map(q => ({ t: q.nota[0], role: 'dada' }));
  const cards = [{ t: 'Hola! Jo us explicaré ' + T.titol.replace(/^(El |La |Els |Les |L')/, m => m.toLowerCase()) + '.', role: 'obre' }, ...facts, { t: 'Això és el que hem descobert. Teniu alguna pregunta?', role: 'tanca' }, { t: 'Ehh… bé… no sé…', role: 'no' }];
  return { k: 'discurs', st: 4, q: 'La presentació: ' + T.titol, inst: 'Toca les frases en el bon ordre: primer saludes, després les dades i al final tanques.', cards: mix(r, cards) };
}
function imprevist(r, I) {
  return { k: 'pick', st: I.e, q: '⚡ Imprevist!', pre: I.t, inst: 'Què feu?', ...choice(r, I.o, 3), e: I.e, per: I.per };
}
function bona(r, T) {
  return { k: 'pick', st: 0, q: T.icona + ' Comença l\'expedició: ' + T.titol, inst: 'Quina és una bona pregunta per investigar?', ...choice(r, [pick(r, T.qs).q, ...draw(r, MALES, 3)]), e: 0, per: 'Una bona pregunta es pot respondre buscant informació.' };
}
const stay = (it, st) => ({ ...it, st });
// one whole project, from the first question to looking back
function expedicio(r, T, hard, idx) {
  const out = [bona(r, T), idx < 3 ? plaDies(r, 2) : plaQui(r, idx < 6 ? 3 : 4), idx % 2 ? casa(r, T) : subratlla(r, T), mural(r, T), discurs(r, T), stay(falta(r, T), 5)];
  if (hard) { const is = draw(r, IMPREVISTOS, idx < 6 ? 1 : 2); out.splice(3, 0, vfn(r, T, idx < 5 ? 3 : 4), imprevist(r, is[0])); if (is[1]) out.splice(6, 0, imprevist(r, is[1])); }
  return out;
}

/* ---------- the projects and their rounds ---------- */
const lv = titles => titles.map(title => ({ title }));
// New projects and circles only ever go at the end: the place of a project in this list is where its stars are saved
export const PROJECTS = [
  { name: 'El camí', sub: 'Les sis etapes, en ordre', icon: '🧭', levels: lv(['Mira el camí', 'Ordena-les', 'La tira del projecte', 'La intrusa', 'Dues caixes', 'Una tira més llarga', 'Les ampolles', 'Tres caixes', 'El riu ràpid', 'La prova del camí']) },
  { name: 'Les paraules', sub: 'Cada etapa té les seves', icon: '💬', levels: lv(['Què passa a classe', 'Dues caixes', 'Primeres ampolles', 'Què es diu', 'Tres caixes', 'Ampolles de paraules', 'Què dius tu', 'Caixes barrejades', 'El riu ràpid', 'Tot barrejat']) },
  { name: 'Els volcans', sub: "El diari d'un projecte", icon: '🌋', levels: lv(['On som?', 'On som i què faig', 'La tira del volcà', 'Un dia de classe', 'Parla amb l\'equip', 'El volcà sencer', 'Tres dies seguits', 'Una conversa més', 'Qui fa què?', 'La prova dels volcans']) },
  { name: 'Els ocells', sub: 'Un altre diari', icon: '🐦', levels: lv(['On som?', 'On som i què faig', 'La tira dels ocells', 'Un dia de classe', 'Parla amb l\'equip', 'La guia sencera', 'Tres dies seguits', 'Una conversa més', 'Qui fa què?', 'La prova dels ocells']) },
  { name: 'Tota la classe', sub: 'Projectes de tota mena', icon: '🏫', levels: lv(['On som?', 'On som i què faig', 'La intrusa', 'Ampolles de projectes', 'Tires desordenades', 'Caixes de projectes', 'Imprevistos', 'La setmana', 'El riu ràpid', 'La prova de la classe']) },
  { name: 'Què faig?', sub: 'Moments del grup', icon: '🙋', levels: lv(['Tres moments', 'Parla amb l\'equip', 'Qui fa què?', 'Quatre moments', 'Una altra conversa', 'El calendari', 'I en quina etapa?', 'Dues converses', 'El gran repartiment', 'La prova del grup']) },
  { name: 'Com ho dic?', sub: 'Les paraules exactes', icon: '🗣️', levels: lv(['Tres frases', 'Parla amb l\'equip', 'La primera presentació', 'Quatre frases', 'El públic pregunta', 'Una altra presentació', 'I en quina etapa?', 'Dues converses', 'Davant de tothom', 'La prova de les frases']) },
  { name: 'La frase que ho diu', sub: 'Busca-ho al text', icon: '🔍', levels: lv(['Un text, tres preguntes', 'Subratlla', 'Lupa i subratllador', 'Veritat o fals?', 'Busca i decideix', 'Subratlla i decideix', 'Dos textos', 'Quatre afirmacions', 'Dos textos a fons', 'La prova de la lupa']) },
  { name: 'La fitxa', sub: 'Paraules clau i notes', icon: '📝', levels: lv(['Les paraules clau', 'Subratlla i tria', 'Omple la fitxa', 'La fitxa bona', 'Fitxes i paraules', 'El primer mural', 'Dos textos', 'Mural i fitxa', 'Fitxes a fons', 'La prova de la fitxa']) },
  { name: 'Què ens falta?', sub: 'On ho busco i què queda', icon: '🧩', levels: lv(['On ho busco?', 'Cada frase al seu lloc', 'La pissarra', 'Què respon el text?', 'Què no diu?', 'Pissarra i preguntes', 'Busca i classifica', 'Detectiu de dades', 'Dos textos', 'La prova de la recerca']) },
  { name: "L'expedició", sub: 'Un projecte sencer', icon: '🗺️', levels: lv(['La merla', 'Els volcans', 'El compost', 'La Lluna', 'Tàrraco', 'La granota', 'Les abelles', "L'enciam", 'Tria el camí', 'La gran expedició']) },
  { name: 'Imprevistos', sub: 'Quan tot es complica', icon: '⚡', levels: lv(['La merla', 'Els volcans', 'El compost', 'La Lluna', 'Tàrraco', 'La granota', 'Les abelles', "L'enciam", 'Tria el camí', 'La tempesta final']) }
];
export const CIRCLES = [
  { name: 'Les sis etapes', projects: [0, 1] },
  { name: 'On som?', projects: [2, 3, 4] },
  { name: 'Dic la meva', projects: [5, 6] },
  { name: 'Treu la informació', projects: [7, 8, 9] },
  { name: "L'expedició", projects: [10, 11] }
];

const R = [];
// the path: watch it, order it, then the strips, the odd one out, the boxes and the river
R[0] = (idx, r) => {
  const nexts = n => draw(r, PAIRS, n).map(p => seguent(r, p)), fems = n => draw(r, ALL, n).map(e => queFem(r, e));
  switch (idx) {
    case 0: return [mira(), ordre(r)];
    case 1: return [ordre(r), ...nexts(2)];
    case 2: return [diari(r, 4), ...nexts(1)];
    case 3: return [intrus(r), ...fems(2), intrus(r)];
    case 4: return [caixes(r, 2, 4), ...fems(1)];
    case 5: return [diari(r, 5), intrus(r)];
    case 6: return [riu(r, 5, 16, CARDS.acc), ...nexts(1)];
    case 7: return [caixes(r, 3, 6), diari(r, 6)];
    case 8: return [riu(r, 7, 13), intrus(r)];
    default: return [ordre(r), diari(r, 6), riu(r, 8, 12)];
  }
};
// the words of each stage
R[1] = (idx, r) => {
  const acc = n => draw(r, ACCIONS, n).map(accio), sen = n => draw(r, SENYALS, n).map(senyal), dit = n => draw(r, FRASES, n).map(dita);
  switch (idx) {
    case 0: return [...acc(2), intrus(r)];
    case 1: return [caixes(r, 2, 4), ...acc(1)];
    case 2: return [riu(r, 4, 18, CARDS.acc), ...acc(1)];
    case 3: return [...sen(2), intrus(r, CARDS.sen)];
    case 4: return [caixes(r, 3, 6, CARDS.sen)];
    case 5: return [riu(r, 5, 15, CARDS.sen), ...dit(1)];
    case 6: return [intrus(r, CARDS.mix), ...dit(2), ...sen(1)];
    case 7: return [caixes(r, 3, 7, CARDS.mix), ...dit(1)];
    case 8: return [riu(r, 7, 13), intrus(r, CARDS.dit)];
    default: return [riu(r, 8, 12), caixes(r, 3, 6, CARDS.mix), ...dit(1)];
  }
};
// a diary: where the class is, what to do, its whole strip, and talking with the crew
const diariDe = (D, id, idx, r) => {
  const sc = n => draw(r, D.dies, n).map(d => scene(d, D)), both = n => draw(r, D.dies, n).flatMap(d => [scene(d, D), ara(r, d)]);
  switch (idx) {
    case 0: return sc(3);
    case 1: return both(2);
    case 2: return [diari(r, 4, id), ...sc(2)];
    case 3: return both(2);
    case 4: return [conversa(r), ...sc(1)];
    case 5: return [diari(r, 6, id), ...both(1)];
    case 6: return both(3);
    case 7: return [conversa(r), ...both(1)];
    case 8: return [plaQui(r, 3), ...both(1)];
    default: return [diari(r, 6, id), ...both(1), conversa(r)];
  }
};
R[2] = (idx, r) => diariDe(VOLCANS, 'volcans', idx, r);
R[3] = (idx, r) => diariDe(OCELLS, 'ocells', idx, r);
R[4] = (idx, r) => {
  const sc = n => draw(r, BARREJA, n).map(mixScene), both = n => draw(r, BARREJA, n).flatMap(d => [mixScene(d), ara(r, d)]);
  switch (idx) {
    case 0: return sc(4);
    case 1: return both(2);
    case 2: return [intrus(r), ...sc(2), intrus(r, CARDS.mix)];
    case 3: return [riu(r, 5, 15), ...both(1)];
    case 4: return [diari(r, 5), diari(r, 5)];
    case 5: return [caixes(r, 3, 6, CARDS.mix), ...both(1)];
    case 6: return draw(r, IMPREVISTOS, 3).map(I => imprevist(r, I));
    case 7: return [plaDies(r, 1), ...both(1)];
    case 8: return [riu(r, 8, 12), ...draw(r, IMPREVISTOS, 1).map(I => imprevist(r, I))];
    default: return [diari(r, 6), ...both(1), riu(r, 8, 11), ...draw(r, IMPREVISTOS, 1).map(I => imprevist(r, I))];
  }
};
// what to do in the group
R[5] = (idx, r) => {
  const ms = n => draw(r, FAIG, n).map(m => moment(r, m, false));
  switch (idx) {
    case 0: return ms(3);
    case 1: return [conversa(r, 1), ...ms(1)];
    case 2: return [plaQui(r, 3)];
    case 3: return ms(4);
    case 4: return [conversa(r, 3), ...ms(1)];
    case 5: return [plaDies(r, 2), ...ms(1)];
    case 6: { const m = draw(r, FAIG, 3); return [...m.map(x => moment(r, x, false)), quan(m[at(3, r)])]; }
    case 7: { const [a, b] = draw(r, CONVERSES, 2); return [a, b].map(C => conversa(r, C.e)); }
    case 8: return [plaQui(r, 4), ...ms(1)];
    default: return [...ms(2), conversa(r), plaQui(r, 4)];
  }
};
// what to say, and saying it in front of an audience
R[6] = (idx, r) => {
  const ds = n => draw(r, DIC, n).map(m => moment(r, m, true)), T = pick(r, TEXTOS);
  switch (idx) {
    case 0: return ds(3);
    case 1: return [conversa(r, 2), ...ds(1)];
    case 2: return [discurs(r, T)];
    case 3: return ds(4);
    case 4: return [conversa(r, 4), ...ds(1)];
    case 5: return [discurs(r, T), ...ds(1)];
    case 6: { const m = draw(r, DIC, 3); return [...m.map(x => moment(r, x, true)), quan(m[at(3, r)])]; }
    case 7: return [conversa(r, 5), conversa(r, 0)];
    case 8: return [discurs(r, T), conversa(r, 4)];
    default: return [...ds(2), discurs(r, T), conversa(r)];
  }
};
// the texts
const two = r => draw(r, TEXTOS, 2);
R[7] = (idx, r) => {
  const [T, T2] = two(r), fr = (X, n) => draw(r, X.qs, n).map(q => frase(X, q));
  switch (idx) {
    case 0: return fr(T, 3);
    case 1: return [subratlla(r, T), subratlla(r, T), ...fr(T, 1)];
    case 2: return [...fr(T, 2), subratlla(r, T)];
    case 3: return [vfn(r, T, 3)];
    case 4: return [...fr(T, 2), vfn(r, T, 3)];
    case 5: return [subratlla(r, T), vfn(r, T, 4)];
    case 6: return [...fr(T, 2), subratlla(r, T2), ...fr(T2, 1)];
    case 7: return [vfn(r, T, 4), vfn(r, T2, 4)];
    case 8: return [...fr(T, 2), subratlla(r, T), vfn(r, T2, 4)];
    default: return [...fr(T, 2), subratlla(r, T2), vfn(r, T2, 4)];
  }
};
R[8] = (idx, r) => {
  const [T, T2] = two(r), qs = mix(r, T.qs), q2 = draw(r, T2.qs, 2);
  switch (idx) {
    case 0: return qs.slice(0, 3).map(q => claus(r, T, q));
    case 1: return [subratlla(r, T), claus(r, T, qs[1])];
    case 2: return [fitxa(r, T), fitxa(r, T)];
    case 3: return [nota(r, T, qs[0]), fitxa(r, T), nota(r, T, qs[1])];
    case 4: return [fitxa(r, T), subratlla(r, T), claus(r, T, qs[2])];
    case 5: return [mural(r, T)];
    case 6: return [claus(r, T, qs[0]), nota(r, T, qs[1]), fitxa(r, T2), nota(r, T2, q2[1])];
    case 7: return [fitxa(r, T), mural(r, T)];
    case 8: return [fitxa(r, T), nota(r, T, qs[1]), fitxa(r, T2), subratlla(r, T2)];
    default: return [subratlla(r, T), fitxa(r, T), mural(r, T2)];
  }
};
R[9] = (idx, r) => {
  const [T, T2] = two(r), fo = n => draw(r, BUSCA, n).map(b => font(r, b));
  switch (idx) {
    case 0: return fo(4);
    case 1: return [...fo(1), casa(r, T)];
    case 2: return [casa(r, T), ...fo(1)];
    case 3: return [respon(r, T), falta(r, T), respon(r, T2)];
    case 4: return [vfn(r, T, 3), falta(r, T)];
    case 5: return [casa(r, T), respon(r, T2)];
    case 6: return [...fo(2), casa(r, T)];
    case 7: return [vfn(r, T, 4), falta(r, T), falta(r, T2)];
    case 8: return [casa(r, T), respon(r, T2), vfn(r, T2, 4)];
    default: return [...fo(1), casa(r, T), vfn(r, T2, 4), falta(r, T2)];
  }
};
// the expeditions: one text a level, the last two on a text drawn at random
const trip = hard => (idx, r) => expedicio(r, idx < 8 ? TEXTOS[idx] : pick(r, TEXTOS), hard, idx);
R[10] = trip(false);
R[11] = trip(true);
export function round(p, idx, rnd = Math.random) { return { items: (R[p] || R[0])(Math.min(9, Math.max(0, whole(idx))), rnd) }; }

/* ---------- the progress ---------- */
const cursus = curs({ PROJECTS, CIRCLES, field: 'lv', badges: p => badges(p), BADGES: () => BADGES });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn, streakIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };

// the Piscina: three short rounds to learn the buttons
export const POOL = [{ title: 'El camí' }, { title: 'Quina etapa és?' }, { title: 'La frase que ho diu' }];
export function pool(k, rnd = Math.random) {
  if (k === 1) return draw(rnd, ACCIONS, 3).map(accio);
  if (k === 2) { const T = pick(rnd, TEXTOS); return draw(rnd, T.qs, 2).map(q => frase(T, q)); }
  return [mira(), ordre(rnd)];
}

// What is saved is facts only: { so, lv[120], piscina, exams[5], fulls, ratxa } and meu, the child's real class project as text (see
// meuOf). Marks, XP, level and badges are worked out, never stored.
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const lvs = slots(o.lv, PROJECTS.length * 10).map(s => within(s, 3));
  return { so: o.so !== false, lv: lvs, piscina: o.piscina === true || lvs.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), ratxa: Math.max(0, whole(o.ratxa)), meu: typeof o.meu === 'string' ? o.meu.slice(0, 800) : '' };
}

/* ---------- the child's own project: the compass of the real class ---------- */
// { nom: the project's name, etapa: the stage the class is at, fets: for each stage what the child has done of ETAPES[e].jo, n: how many
// projects have been started }. It goes back and forth (a stage is left, a project ends), so it is kept as one text: of two copies
// the newer wins (shared/sync.js), which is what a marker of «where we are» needs. The rest of the progress only grows.
export const meuOf = p => {
  let o = null;
  try { o = JSON.parse(p?.meu || ''); } catch (e) { o = null; }
  o = o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  return { nom: typeof o.nom === 'string' ? o.nom.slice(0, 40) : '', etapa: within(o.etapa, ETAPES.length - 1), n: Math.max(0, whole(o.n)),
    fets: ETAPES.map((E, e) => E.jo.map((_, j) => Array.isArray(o.fets) && Array.isArray(o.fets[e]) && o.fets[e][j] === true)) };
};
// a change of the real project: a new progress with it. Returns { prog, news }
export function meuIn(p, m) {
  const next = cursus.copy(p); next.meu = JSON.stringify(meuOf({ meu: JSON.stringify(m) }));
  return { prog: next, news: cursus.earned(p, next) };
}
// a project of the class begins: its name, the first stage, nothing done yet
export const meuNou = (p, nom) => meuIn(p, { ...meuOf(p), nom: String(nom || '').trim().slice(0, 40), etapa: 0, n: meuOf(p).n + 1, fets: ETAPES.map(E => E.jo.map(() => false)) });

export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Les sis etapes', what: 'Valida els dos projectes del cercle 0.' },
  { name: 'Primer full', what: "Caça bé les errades d'una fitxa." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 12', what: 'Encerta 12 preguntes seguides.' },
  { name: 'El meu projecte', what: 'Posa el nom del projecte de la teva classe a la brúixola.' },
  { name: 'Em situo', what: "Supera l'examen del cercle 1." },
  { name: 'Dic la meva', what: "Supera l'examen del cercle 2." },
  { name: "Caçador d'informació", what: "Supera l'examen del cercle 3." },
  { name: 'Tots els projectes', what: 'Valida els deu primers projectes.' },
  { name: "Brúixola d'or", what: 'Supera els quatre primers exàmens.' },
  { name: 'Expedicionari', what: "Valida L'expedició." },
  { name: 'Res no ens atura', what: 'Valida Imprevistos.' },
  { name: 'Explorador de projectes', what: "Supera l'examen de L'expedició." }
];
export const badges = p => [p.piscina === true, CIRCLES[0].projects.every(i => noteOf(p, i) >= VALID), p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 12,
  meuOf(p).nom !== '', p.exams[1] === true, p.exams[2] === true, p.exams[3] === true, PROJECTS.slice(0, 10).every((_, i) => noteOf(p, i) >= VALID), p.exams.slice(0, 4).every(e => e === true),
  noteOf(p, 10) >= VALID, noteOf(p, 11) >= VALID, p.exams[4] === true];

/* ---------- the exam of a circle: six quick questions of its projects, no two alike ---------- */
// what a project can ask in an exam: a shuffled list to take from
function examPool(p, r) {
  const T = pick(r, TEXTOS), qs = mix(r, T.qs);
  switch (p) {
    case 0: return mix(r, [...draw(r, PAIRS, 2).map(x => seguent(r, x)), ...draw(r, ALL, 2).map(e => queFem(r, e))]);
    case 1: return mix(r, [...draw(r, ACCIONS, 2).map(accio), ...draw(r, SENYALS, 2).map(senyal)]);
    case 2: return draw(r, VOLCANS.dies, 3).map(d => (r() < 0.5 ? scene(d, VOLCANS) : ara(r, d)));
    case 3: return draw(r, OCELLS.dies, 3).map(d => (r() < 0.5 ? scene(d, OCELLS) : ara(r, d)));
    case 4: return draw(r, BARREJA, 3).map(d => (r() < 0.5 ? mixScene(d) : ara(r, d)));
    case 5: return draw(r, FAIG, 3).map(m => moment(r, m, false));
    case 6: return draw(r, DIC, 3).map(m => moment(r, m, true));
    case 7: return qs.slice(0, 3).map(q => frase(T, q));
    case 8: return [claus(r, T, qs[0]), nota(r, T, qs[1]), claus(r, T, qs[2])];
    case 9: return mix(r, [...draw(r, BUSCA, 2).map(b => font(r, b)), respon(r, T), falta(r, T)]);
    case 10: return mix(r, [frase(T, qs[0]), bona(r, T), stay(falta(r, T), 5)]);
    default: return draw(r, IMPREVISTOS, 3).map(I => imprevist(r, I));
  }
}
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, pools = ps.map(p => examPool(p, rnd)), out = [];
  for (let k = 0; out.length < 6; k++) { const j = k % ps.length; const it = pools[j].shift(); if (it) out.push({ ...it, p: ps[j] }); else pools[j] = examPool(ps[j], rnd); }
  return shuffle(out, rnd);
}

/* ---------- «Caça l'errada»: three notes about a text on the card; from none to two are wrong ---------- */
export function sheet(rnd) {
  const T = pick(rnd, TEXTOS), qs = draw(rnd, T.qs, 3), bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return { text: T, claims: qs.map((q, i) => {
    const other = pick(rnd, T.qs.filter(x => x !== q)).nota[0];
    return { q: q.q, real: q.nota[0], says: bads.has(i) ? q.nota[1] : q.nota[0], opts: mix(rnd, [q.nota[0], q.nota[1], other]), s: q.s };
  }) };
}
