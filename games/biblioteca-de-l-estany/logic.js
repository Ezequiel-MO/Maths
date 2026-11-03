import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
import { TYPES, KIDS, AGES, TOWNS, PETS, PETNAMES, DAYS, PLACES, RELS, MICRO, MICRO_TITLES, SYN, DEF, EXP, ORD, INF, TIP } from './content.js';
import { MED, MSG, DLG } from './textos.js';
import { TALES } from './contes.js';
import { INFOS } from './informatius.js';
import { IVS } from './entrevistes.js';
// The rules and the rounds of «La biblioteca de l'estany», with no page in it. It trains the Catalan of the «avaluació de diagnòstic»
// of 4t: only understanding, never writing. Every question is about a text (or a recording) and has one right answer among four,
// like the test: find where the text says it, guess what it does not say, the meaning of a word there, the order of the events,
// what kind of text it is and what its parts are for. Each question knows the sentences that answer it (ev), so the page can light
// them up. Chance enters only through rnd; it must keep importing from Node.

/* ---------- chance ---------- */
const pick = (r, a) => a[at(a.length, r)];
const mix = (r, a) => shuffle(a.slice(), r);
const draw = (r, pool, n, not = []) => mix(r, pool.filter(x => !not.includes(x))).slice(0, n);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- the texts, cut into sentences ---------- */
// a sentence ends at . ! ? … » followed by a capital (or a dash and a capital: «—Què et passa? —li va preguntar» stays one)
const SPLIT = /(?<=[.!?…»])\s+(?=[«¡¿"(A-ZÀÁÈÉÍÏÒÓÚÜÇ0-9]|—[A-ZÀÁÈÉÍÏÒÓÚÜÇ¡¿«])/u;
// sents: every sentence { p: its paragraph, t: its words, who: who says it }; paras: the sentences of each paragraph. A poem is cut
// into its lines, a recording into what each one says
function prep(T) {
  if (T.sents) return T;
  const sents = [], paras = [];
  if (T.kind === 'oral') T.lines.forEach(([who, t], i) => { sents.push({ p: i, t, who }); paras.push([i]); });
  else T.body.forEach((par, p) => {
    const parts = T.kind === 'poema' ? par.split(' / ') : par.split(SPLIT);
    paras.push(parts.map(t => { sents.push({ p, t }); return sents.length - 1; }));
  });
  T.sents = sents; T.paras = paras;
  return T;
}
const norm = s => String(s).replace(/\*/g, '').toLowerCase();
// the sentences that say e: a piece of the text, or several; '#table' is the table
export function evOf(T, e) {
  if (!e) return [];
  if (e === '#table') return ['table'];
  return [...new Set([].concat(e).flatMap(x => { const i = T.sents.findIndex(s => norm(s.t).includes(norm(x))); return i >= 0 ? [i] : []; }))];
}
// a word as the clues of an inference are compared: small letters, no marks, no article stuck to its front (l', d', s'...)
export const wordKey = w => String(w).toLowerCase().replace(/[’]/g, "'").replace(/[^\p{L}'·-]/gu, '').replace(/^(l|d|s|m|t|n)'/, '').replace(/^-+|-+$/g, '');

// the short texts as texts: micro ones have no title
const micro = (o, extra = {}) => prep({ kind: o.type === 'poema' ? 'poema' : 'micro', pic: o.pic || null, body: [o.t], ...extra });
const MT = MICRO.map((m, i) => micro(m, { qs: m.qs, tit: MICRO_TITLES[i] }));
const IT = INF.map(m => micro(m, { inf: m }));
const OT = ORD.map(m => micro(m, { ev: m.ev, hard: !!m.hard }));
const TT = TIP.map(m => micro(m, { type: m.type }));
for (const T of [...MED, ...MSG, ...DLG, ...TALES, ...INFOS, ...IVS]) prep(T);

/* ---------- the books of the library ---------- */
// Every text with a title goes on the shelves once it is read. This order is the order they are saved in: a text is never taken
// out or moved, a new one goes at the end
export const SHELVES = [['Contes i rondalles', TALES], ['Textos que expliquen', INFOS], ['Cartes, notícies i més', MED], ['Ràdio Estany', [...IVS, ...MSG, ...DLG]]];
export const BOOKS = [...MED, ...MSG, ...DLG, ...TALES, ...INFOS, ...IVS];
export const bookIndex = id => BOOKS.findIndex(b => b.id === id);
export const bookOf = id => BOOKS.find(b => b.id === id) || null;
// where each book is read first: [project, level]
export function whereOf(id) {
  const T = bookOf(id); if (!T) return [0, 0];
  for (const [list, p] of [[TALES, 6], [INFOS, 7], [IVS, 8]]) { const i = list.indexOf(T); if (i >= 0) return [p, i]; }
  if (MSG.includes(T)) return [5, 3];
  if (DLG.includes(T)) return [5, 6];
  return [0, 6];
}

/* ---------- the kinds of question ---------- */
// what each kind of question measures, as the test calls it: localitzar, inferir, interpretar, reflexionar
export const PROC = { loc: 'L', inf: 'I', voc: 'I', int: 'N', ord: 'N', tit: 'N', tip: 'R', fin: 'R', mor: 'R', val: 'R' };
export const PROCS = { L: 'Busca el que diu', I: 'Endevina el que no diu', N: 'Lliga les idees', R: 'Pensa sobre el text' };
export { TYPES };
// n options of o (the right one first), shuffled: { opts, ok }
function choice(r, o, n = 4) {
  const keep = mix(r, [o[0], ...mix(r, o.slice(1)).slice(0, n - 1)]);
  return { opts: keep.map(t => ({ t })), ok: keep.indexOf(o[0]) };
}
// a question of a text, ready to play: four options, the sentences that answer it
export function ask(r, T, q, n = 4) {
  if (q.k === 'ord') return orderAD(r, T, q);
  return { k: 'pick', q: q.q, ...choice(r, q.o, n), ev: evOf(T, q.e), ctx: T, proc: PROC[q.k] || 'L', kind: q.k };
}
// the order of four events as the test asks it: four sentences A to D, and four orders of their letters to choose from
function orderAD(r, T, q) {
  const L = ['A', 'B', 'C', 'D'], idx = mix(r, [0, 1, 2, 3]), letters = idx.map((e, j) => [L[j], q.ev[e]]);
  const right = [0, 1, 2, 3].map(e => L[idx.indexOf(e)]), str = a => a.join(', ');
  const swap = (a, i, j) => { const b = a.slice(); [b[i], b[j]] = [b[j], b[i]]; return b; };
  const cands = mix(r, [swap(right, 0, 1), swap(right, 1, 2), swap(right, 2, 3), swap(right, 0, 3), right.slice().reverse(), [right[1], right[2], right[3], right[0]]]);
  const seen = new Set([str(right)]), wrong = [];
  for (const c of cands) if (wrong.length < 3 && !seen.has(str(c))) { seen.add(str(c)); wrong.push(str(c)); }
  const opts = mix(r, [str(right), ...wrong]);
  return { k: 'pick', q: q.q, letters, opts: opts.map(t => ({ t })), ok: opts.indexOf(str(right)), ev: evOf(T, q.e), ctx: T, proc: 'N', kind: 'ord' };
}
// tap the sentence of the text that says it
const find = (T, q) => ({ k: 'find', q: q.q, ev: evOf(T, q.e), ctx: T, proc: 'L', kind: 'loc' });
// tap the words that give the answer away
function clues(r, T) {
  const I = T.inf;
  return { k: 'clues', q: I.q, a: I.o[0], clues: [...new Set(I.c.map(wordKey))], ctx: T, proc: 'I', kind: 'inf' };
}
// an inference with four options; the clues light up as a hint
function infer(r, T, n = 4) {
  const I = T.inf;
  return { k: 'pick', q: I.q, ...choice(r, I.o, n), ev: [], clues: [...new Set(I.c.map(wordKey))], ctx: T, proc: 'I', kind: 'inf' };
}
// the word marked with * in a sentence: put another in its place (swap), or say what it means there (pick)
const marked = s => (s.match(/\*([^*]+)\*/) || [, ''])[1];
function swapIt(r, V, n = 4) { return { k: 'swap', q: `Quina paraula podria anar en lloc de «${marked(V.s)}»?`, s: V.s, ...choice(r, V.o, n), ctx: null, proc: 'I', kind: 'voc' }; }
function meanIt(r, V, n = 4, saying = false) {
  return { k: 'pick', q: saying ? `Què vol dir «${marked(V.s)}»?` : `Què vol dir «${marked(V.s)}» en aquesta frase?`, mark: V.s, ...choice(r, V.o, n), ctx: null, proc: 'I', kind: 'voc' };
}
// tap the events in the order they happen; n of the four, in their order
function order(r, T, n = 4) {
  const keep = n >= 4 ? [0, 1, 2, 3] : mix(r, [0, 1, 2, 3]).slice(0, n).sort((a, b) => a - b), events = keep.map(i => T.ev[i]);
  const opts = mix(r, events.map((_, i) => i));
  return { k: 'order', q: 'Toca els fets en l\'ordre que passen.', events: opts.map(i => events[i]), seq: events.map((_, i) => opts.indexOf(i)), ctx: T, proc: 'N', kind: 'ord' };
}
const orderTest = (r, T) => orderAD(r, T, { q: 'Quin és l\'ordre en què passen els fets?', ev: T.ev });
// what kind of text a piece is: the right kind and n - 1 others, each with its picture
function typeOf(r, T, n = 4) {
  const others = draw(r, Object.keys(TYPES), n - 1, [T.type]), keys = mix(r, [T.type, ...others]);
  return { k: 'pick', q: 'Quin tipus de text és?', opts: keys.map(k => ({ t: TYPES[k][0], pic: TYPES[k][1] })), ok: keys.indexOf(T.type), ev: [], ctx: T, proc: 'R', kind: 'tip' };
}
// the best title of a short text, among the titles of others
function titleOf(r, T, n = 4) {
  const others = draw(r, MT.filter(x => x !== T).map(x => x.tit), n - 1), o = [T.tit, ...others];
  return { k: 'pick', q: 'Quin títol li va millor?', ...choice(r, o, n), ev: [], ctx: T, proc: 'N', kind: 'tit' };
}

/* ---------- La lupa: a child of a town, with a pet ---------- */
const bare = n => n.replace(/^(en |la |l')/, '');
const de = n => n.startsWith('en ') ? `d'${n}` : `de ${n}`;
// A text of three (or five) sentences about a child, and five questions with the sentence that answers each. The traps are in the
// text too: the name of the cousin when the pet is asked, «amb els seus pares» when it is who goes with them
function kid(r, long = false) {
  const [name] = pick(r, KIDS), age = pick(r, AGES), town = pick(r, TOWNS), [aPet, thePet] = pick(r, PETS), pet = pick(r, PETNAMES);
  const [day, days] = pick(r, DAYS), [place, act] = pick(r, PLACES), [rel, g] = pick(r, RELS), [relName] = pick(r, KIDS.filter(k => k[1] === g && k[0] !== name));
  const N = cap(name);
  const t = long ? `${N} té ${age} anys. Viu a ${town} amb els seus pares. Té ${aPet} que es diu ${pet}. Cada ${day} va a ${act} ${place}. Hi va amb ${rel}, ${relName}.`
    : `${N} té ${age} anys i viu a ${town}. Té ${aPet} que es diu ${pet}. Cada ${day} va a ${act} ${place} amb ${rel}, ${relName}.`;
  const T = prep({ kind: 'micro', pic: '🧒', body: [t] }), s = long ? [0, 1, 2, 3, 4] : [0, 0, 1, 2, 2];
  const relsOther = RELS.filter(x => x[0] !== rel).map(x => `Amb ${x[0]}`);
  const qs = [
    { q: `Quants anys té ${name}?`, o: [`${cap(age)} anys`, ...draw(r, AGES, 3, [age]).map(a => `${cap(a)} anys`)], s: s[0] },
    { q: `On viu ${name}?`, o: [`A ${town}`, ...draw(r, TOWNS, 3, [town]).map(x => `A ${x}`)], s: s[1] },
    { q: `Com es diu ${thePet} ${de(name)}?`, o: [pet, cap(bare(relName)), ...draw(r, PETNAMES, 2, [pet])], s: s[2] },
    { q: `Quin dia va a ${act}?`, o: [days, ...draw(r, DAYS.filter(d => d[0] !== day), 3).map(d => d[1])], s: s[3] },
    { q: `Amb qui va a ${act}?`, o: [`Amb ${rel}`, ...(long ? ['Amb els seus pares'] : []), ...relsOther].slice(0, 4), s: s[4] }];
  return { T, qs: qs.map(q => ({ ...q, k: 'loc', ev: [q.s] })) };
}
const kidAsk = (r, K, q, n) => ({ k: 'pick', q: q.q, ...choice(r, q.o, n), ev: q.ev, ctx: K.T, proc: 'L', kind: 'loc' });
const kidFind = (K, q) => ({ k: 'find', q: q.q, ev: q.ev, ctx: K.T, proc: 'L', kind: 'loc' });

/* ---------- the rounds of the nine projects ---------- */
// R[p](idx, rnd) → { items }. Every item carries its context (ctx: the text it is about, or null); the ones in a row with the same
// ctx share it on the screen. oral says how a recording is heard: step (each question plays its own piece), once (the whole of it,
// then the questions) or first (the questions are read before, as in the test); limit is how many times it can be heard
const locs = T => T.qs.filter(q => q.k === 'loc' && q.e && q.e !== '#table');
const withOral = (items, oral) => items.map(it => ({ ...it, oral }));
// the piece of a recording each question plays, in step: from the line after the one before to its own (null: none of its own)
function parts(T, qs) {
  let cut = -1;
  return qs.map(q => { const e = evOf(T, q.e).filter(Number.isInteger); if (!e.length) return null; const end = Math.max(...e); if (end <= cut) return [end]; const p = []; for (let i = cut + 1; i <= end; i++) p.push(i); cut = end; return p; });
}
// a recording heard sentence by sentence: each question with the line that answers it
const oneLiner = (r, T, q) => ({ ...ask(r, T, q), say: evOf(T, q.e).filter(Number.isInteger), oral: { mode: 'step', limit: Infinity } });
const listen = (r, T, mode, limit) => {
  const P = parts(T, T.qs);
  return T.qs.map((q, i) => ({ ...ask(r, T, q), say: mode === 'step' ? P[i] : null, oral: { mode, limit } }));
};

const MEDLOC = MED.filter(T => locs(T).length >= 2);
const MEDFIN = MED.filter(T => T.qs.some(q => q.k === 'fin'));
const R = [
  // 0 · La lupa: where the text says it
  (idx, r) => {
    if (idx <= 2) return { items: Array.from({ length: 5 }, () => { const K = kid(r, idx === 2); return kidFind(K, pick(r, K.qs)); }) };
    if (idx <= 5) return { items: draw(r, MT, 3).flatMap(T => draw(r, T.qs.filter(q => q.k === 'loc'), 2).map(q => ask(r, T, q, idx === 3 ? 3 : 4))) };
    if (idx <= 8) {
      const T = MEDLOC[(idx - 6 + at(MEDLOC.length, r)) % MEDLOC.length];
      return { items: T.qs.filter(q => q.k === 'loc' || q.k === 'inf').map((q, i) => i % 2 && q.e && q.e !== '#table' && q.k === 'loc' ? find(T, q) : ask(r, T, q)) };
    }
    const K = kid(r, true), T = pick(r, MT);
    return { items: [...draw(r, K.qs, 2).map((q, i) => i ? kidAsk(r, K, q, 4) : kidFind(K, q)), ...draw(r, T.qs.filter(q => q.k === 'loc'), 2).map((q, i) => i ? find(T, q) : ask(r, T, q))] };
  },
  // 1 · Paraules amagades: a word in its sentence
  (idx, r) => {
    if (idx <= 2) return { items: draw(r, SYN, 5).map(V => swapIt(r, V, idx === 0 ? 3 : 4)) };
    if (idx <= 5) return { items: draw(r, DEF, 5).map(V => meanIt(r, V)) };
    if (idx <= 8) return { items: draw(r, EXP, 5).map(V => meanIt(r, V, 4, true)) };
    return { items: mix(r, [...draw(r, SYN, 2).map(V => swapIt(r, V)), ...draw(r, DEF, 2).map(V => meanIt(r, V)), ...draw(r, EXP, 2).map(V => meanIt(r, V, 4, true))]) };
  },
  // 2 · Primer, després: the order of the events
  (idx, r) => {
    const easy = OT.filter(T => !T.hard), hard = OT.filter(T => T.hard);
    if (idx <= 2) return { items: draw(r, easy, 4).map(T => order(r, T, 3)) };
    if (idx <= 5) return { items: (idx === 3 ? draw(r, easy, 4) : idx === 4 ? [...draw(r, easy, 2), ...draw(r, hard, 2)] : draw(r, hard, 4)).map(T => order(r, T, 4)) };
    if (idx <= 8) return { items: draw(r, idx === 6 ? easy : OT, 4).map(T => orderTest(r, T)) };
    return { items: [...draw(r, hard, 2).map(T => order(r, T, 4)), ...draw(r, OT, 2).map(T => orderTest(r, T))] };
  },
  // 3 · Detectiu de pistes: what the text gives away
  (idx, r) => {
    if (idx <= 2) return { items: draw(r, IT, 4).map(T => clues(r, T)) };
    if (idx <= 5) return { items: draw(r, IT, 5).map(T => infer(r, T, idx === 3 ? 3 : 4)) };
    if (idx <= 8) { const T = MED[(idx - 6 + 3 * at(4, r)) % MED.length]; return { items: [...T.qs.filter(q => !['tip', 'fin', 'tit'].includes(q.k)).map(q => ask(r, T, q)), clues(r, pick(r, IT))] }; }
    return { items: [...draw(r, IT, 2).map(T => clues(r, T)), ...draw(r, IT, 2).map(T => infer(r, T)), (T => ask(r, T, T.qs.find(q => q.k === 'inf')))(pick(r, MT.filter(T => T.qs.some(q => q.k === 'inf'))))] };
  },
  // 4 · Quin text és?: the kind, the title and what each part is for
  (idx, r) => {
    const basic = TT.filter(T => ['conte', 'noticia', 'poema', 'recepta', 'carta'].includes(T.type));
    if (idx <= 2) return { items: draw(r, idx === 0 ? basic : TT, 6).map(T => typeOf(r, T, idx === 0 ? 3 : 4)) };
    if (idx <= 4) return { items: draw(r, MT, 5).map(T => titleOf(r, T, idx === 3 ? 3 : 4)) };
    if (idx === 5) { const tips = MED.filter(T => T.qs.some(q => q.k === 'tip')); return { items: [...draw(r, MT, 2).map(T => titleOf(r, T)), ...draw(r, tips, 3).map(T => ask(r, T, T.qs.find(q => q.k === 'tip')))] }; }
    if (idx <= 8) {
      const ts = idx === 7 ? MEDFIN.filter(T => T.table || T.photo || T.heads) : MEDFIN, two = draw(r, ts, 2);
      return { items: two.flatMap(T => T.qs.filter(q => ['fin', 'tip', 'tit'].includes(q.k) || (idx === 7 && q.e === '#table')).map(q => ask(r, T, q))) };
    }
    return { items: [...draw(r, TT, 2).map(T => typeOf(r, T)), ...draw(r, MT, 2).map(T => titleOf(r, T)), (T => ask(r, T, T.qs.find(q => q.k === 'fin')))(pick(r, MEDFIN))] };
  },
  // 5 · Ràdio Estany: listen and answer
  (idx, r) => {
    if (idx <= 2) return { items: draw(r, MSG, 5).map(T => oneLiner(r, T, pick(r, T.qs))) };
    if (idx <= 5) return { items: draw(r, MSG, 2).flatMap(T => listen(r, T, 'once', Infinity)) };
    if (idx <= 8) return { items: listen(r, pick(r, DLG), idx === 6 ? 'once' : 'first', idx === 6 ? Infinity : 2) };
    return { items: [...listen(r, pick(r, MSG), 'once', 2), ...listen(r, pick(r, DLG), 'first', 2)] };
  },
  // 6 · Contes i rondalles: a tale a level, the last seven like the test
  (idx, r) => { const T = TALES[idx % TALES.length]; return { items: T.qs.map(q => ask(r, T, q)) }; },
  // 7 · Textos que expliquen
  (idx, r) => { const T = INFOS[idx % INFOS.length]; return { items: T.qs.map(q => ask(r, T, q)) }; },
  // 8 · Entrevistes a la ràdio: the first three heard as many times as wanted; then the questions read first, and at the end twice
  (idx, r) => { const T = IVS[idx % IVS.length]; return { items: listen(r, T, idx <= 2 ? 'once' : 'first', idx <= 6 ? Infinity : 2) }; }
];
// the round of level idx of project p, drawn with rnd
export function round(p, idx, rnd = Math.random) { return (R[p] || R[0])(Math.min(9, Math.max(0, whole(idx))), rnd); }

/* ---------- the cursus: circles, projects, marks ---------- */
const lv = titles => titles.map(title => ({ title }));
export const PROJECTS = [
  { name: 'La lupa', sub: 'Busca on ho diu el text', icon: '🔍', levels: lv(['La frase que ho diu', 'Busca la frase', 'Una frase entre cinc', 'Llegeix i tria', 'Compte amb les trampes', 'Textos curts', 'Un text més llarg', 'Un text més llarg', 'Un text més llarg', 'Repàs']) },
  { name: 'Paraules amagades', sub: 'Què vol dir aquí?', icon: '🗝️', levels: lv(['Una paraula com aquesta', 'Paraules germanes', 'Canvia la paraula', 'Què vol dir?', 'La mateixa paraula, un altre sentit', 'Paraules amb truc', 'Frases fetes', 'Més frases fetes', 'Frases fetes difícils', 'Repàs']) },
  { name: 'Primer, després', sub: 'Ordena els fets', icon: '🧵', levels: lv(['Tres fets', 'Tres fets', 'Tres fets', 'Quatre fets', 'Abans i després', "Compte amb l'ordre!", 'Com a la prova', 'Com a la prova', 'Com a la prova', 'Repàs']) },
  { name: 'Detectiu de pistes', sub: 'El que el text no diu', icon: '🕵️', levels: lv(['Les pistes', 'Més pistes', 'Pistes amagades', 'Què passa?', 'Què passa?', 'Què passa?', 'Un text sencer', 'Un text sencer', 'Un text sencer', 'Repàs']) },
  { name: 'Quin text és?', sub: 'El tipus, el títol, les parts', icon: '🧩', levels: lv(['Contes, poemes i cartes', 'Tots els tipus', 'Tots els tipus', 'El títol', 'El millor títol', 'Títols i tipus', 'Per a què serveix?', 'Fotos i taules', 'Per a què serveix?', 'Repàs']) },
  { name: 'Ràdio Estany', sub: 'Escolta i respon', icon: '📻', levels: lv(['Una frase', 'Una frase', 'Una frase', 'Un missatge', 'Un missatge', 'Un missatge', 'Dues veus', 'Dues veus, dues vegades', 'Dues veus, dues vegades', 'Repàs']) },
  { name: 'Contes i rondalles', sub: 'El text narratiu', icon: '📖', levels: lv(TALES.map(t => t.title)) },
  { name: 'Textos que expliquen', sub: 'El text informatiu', icon: '🔬', levels: lv(INFOS.map(t => t.title)) },
  { name: 'Entrevistes a la ràdio', sub: 'La comprensió oral', icon: '🎙️', levels: lv(IVS.map(t => t.title)) }
];
export const CIRCLES = [
  { name: 'Primeres pistes', projects: [0, 1, 2] },
  { name: 'Llegeix entre línies', projects: [3, 4, 5] },
  { name: "Com a l'abril", projects: [6, 7, 8] }
];
const count = a => a.filter(Boolean).length;
const cursus = curs({ PROJECTS, CIRCLES, field: 'lv', lists: ['llibres'], badges: p => badges(p), BADGES: () => BADGES, xpExtra: p => 3 * count(p.llibres) + 5 * p.best });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn, streakIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };

// the Piscina: three short rounds to learn the buttons: read and choose, tap the sentence, listen and choose
export const POOL = [{ title: 'Llegeix i tria' }, { title: 'La lupa' }, { title: 'Escolta i tria' }];
export function pool(k, rnd = Math.random) {
  if (k === 1) { const K = kid(rnd); return draw(rnd, K.qs, 3).map(q => kidFind(K, q)); }
  if (k === 2) return draw(rnd, MSG, 2).map(T => oneLiner(rnd, T, pick(rnd, T.qs)));
  const K = kid(rnd); return draw(rnd, K.qs, 3).map(q => kidAsk(rnd, K, q, 3));
}

// What is saved is facts only: { so, lv[90], piscina, exams[3], fulls, ratxa, best, proves, llibres[...] }. llibres keeps a boolean per
// text of BOOKS, in its order. Marks, XP, level and badges are worked out, never stored.
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const lvs = slots(o.lv, PROJECTS.length * 10).map(s => within(s, 3));
  return { so: o.so !== false, lv: lvs, piscina: o.piscina === true || lvs.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), ratxa: Math.max(0, whole(o.ratxa)), best: within(o.best, 23), proves: Math.max(0, whole(o.proves)),
    llibres: slots(o.llibres, BOOKS.length).map(b => b === true) };
}
// the texts read: a new progress with them on the shelves, and the ids that were not there
export function booksIn(p, ids) {
  const next = cursus.copy(p), got = [];
  for (const id of ids) { const i = bookIndex(id); if (i >= 0 && !next.llibres[i]) { next.llibres[i] = true; got.push(id); } }
  return { prog: next, got, news: cursus.earned(p, next) };
}
// the simulacre: 23 questions; the mark over 10 and its level, as the report of the test gives them
export const MOCK_N = 23;
export const markOf = score => Math.round(100 * within(score, MOCK_N) / MOCK_N) / 10;
export const LEVELS = [[8.95, 'Excel·lent'], [6.95, 'Notable'], [4.95, 'Satisfactori'], [0, 'Encara no assolit']];
export const levelOf = mark => LEVELS.find(([lo]) => mark >= lo)[1];
const mockIn = cursus.keep('best');
// a simulacre done: its score kept when it is the best, and one more done
export function mockDone(p, score) {
  const r = mockIn(p, within(score, MOCK_N)), next = { ...r.prog, proves: p.proves + 1 };
  return { prog: next, best: r.best, news: cursus.earned(p, next) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 15', what: 'Encerta 15 preguntes seguides.' },
  { name: '10 llibres', what: 'Posa 10 llibres a la biblioteca.' },
  { name: '30 llibres', what: 'Posa 30 llibres a la biblioteca.' },
  { name: 'Primer simulacre', what: 'Fes un simulacre de la prova.' },
  { name: 'Satisfactori', what: 'Treu 12 o més al simulacre.' },
  { name: 'Notable', what: 'Treu 16 o més al simulacre.' },
  { name: 'Excel·lent', what: 'Treu 21 o més al simulacre.' },
  { name: 'Tots els projectes', what: 'Valida els nou projectes.' },
  { name: 'Gran lector', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 15, count(p.llibres) >= 10, count(p.llibres) >= 30,
  p.proves >= 1, p.best >= 12, p.best >= 16, p.best >= 21, PROJECTS.every((_, i) => noteOf(p, i) >= VALID), p.exams.every(e => e === true)];

/* ---------- the exam of a circle ---------- */
// Six questions: for each project of the circle a level drawn at random, and two questions of it on the same text. Each { title, p, idx }
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects;
  return shuffle(ps.map(p => ({ p, idx: at(10, rnd) })), rnd).flatMap(({ p, idx }) => [0, 1].map(() => ({ ...PROJECTS[p].levels[idx], p, idx })));
}
// the two questions of a level of the exam: two of its round, the second on the text of the first when there is one more on it
export function examPair(p, idx, rnd = Math.random) {
  const items = round(p, idx, rnd).items, a = at(items.length, rnd), first = items[a];
  const same = items.filter((it, i) => i !== a && it.ctx && it.ctx === first.ctx), other = items.filter((_, i) => i !== a);
  const second = same.length ? same[at(same.length, rnd)] : other.length ? other[at(other.length, rnd)] : first;
  return [first, second].map(it => it.oral ? { ...it, oral: { ...it.oral, limit: 2 } } : it);
}

/* ---------- the simulacre: the 23 questions of the Catalan test, as in 2025-26 ---------- */
// The oral text (1-9): an interview of the radio, its questions read before and heard twice. The narrative text (10-15) and the
// informative one (16-23). In step («pas a pas»), each question of the interview plays its own piece of it
export function mock(rnd = Math.random, step = false) {
  const O = pick(rnd, IVS.slice(3)), N = pick(rnd, TALES.slice(3)), I = pick(rnd, INFOS.slice(3));
  return [
    { title: 'Comprensió oral', range: '1-9', name: O.title, ctx: O, items: listen(rnd, O, step ? 'step' : 'first', step ? Infinity : 2) },
    { title: 'Text narratiu', range: '10-15', name: N.title, ctx: N, items: N.qs.map(q => ask(rnd, N, q)) },
    { title: 'Text informatiu', range: '16-23', name: I.title, ctx: I, items: I.qs.map(q => ask(rnd, I, q)) }
  ];
}

/* ---------- «Caça l'errada»: three answers about a text in the notebook; from none to two are wrong ---------- */
// The wrong ones are the slips of a reader: an option that is in the text but answers something else, a word read too fast.
// Returns { text, claims: [{ q, says, real, opts, ev }] }
export function sheet(rnd) {
  const ok = q => !['fin', 'tip', 'tit'].includes(q.k);
  const T = pick(rnd, MED.filter(t => t.qs.filter(ok).length >= 3)), qs = draw(rnd, T.qs.filter(ok), 3);
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return { text: T, claims: qs.map((q, i) => {
    const wrong = pick(rnd, q.o.slice(1));
    return { q: q.q, real: q.o[0], says: bads.has(i) ? wrong : q.o[0], opts: mix(rnd, [q.o[0], ...draw(rnd, q.o.slice(1), 2)]), ev: evOf(T, q.e) };
  }) };
}
