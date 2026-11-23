import { curs, whole, within, slots, at, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
import { ETAPES, ACCIONS, VOLCANS, OCELLS, BARREJA, FAIG, DIC, FONTS, BUSCA, TEXTOS } from './contingut.js';
// The rules and the rounds of «La brúixola de l'estany», with no page in it. The game teaches the six stages of a school project
// (contingut.js), where the class is at any moment, how to take part in the group and how to pull the information a project needs
// out of a text. A round is a list of items, each of one kind:
//   mira    watch the six stages light up along the compass, in order
//   ordre   put the six stages in order (cards: the stages, shuffled)
//   etapa   a moment of the class (text): tap its stage on the compass (ok: the stage)
//   pick    one right answer among opts (ok: its index); pre is the moment it is about, ctx a text it is about, per why it is right
//   frase   a text (ctx) and the project's question: tap the sentence that answers it (ok: its index; kw: words to look for)
//   multi   tap the n right ones among opts (oks: their indexes), with a text behind when there is one
// Chance enters only through rnd; it must keep importing from Node. Right answers come first in the content and are shuffled here.
export { ETAPES, TEXTOS };

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
  return { k: 'pick', q: after ? `Acabem l'etapa «${ETAPES[e].nom}». Quina etapa ve després?` : `Som a «${ETAPES[e].nom}». Quina etapa ve just abans?`, ...choice(r, o), e: ok,
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

/* ---------- the projects and their rounds ---------- */
const lv = titles => titles.map(title => ({ title }));
export const PROJECTS = [
  { name: 'El camí', sub: 'Les sis etapes, en ordre', icon: '🧭', levels: lv(['Mira el camí', 'Ordena-les', 'Ordena i segueix', 'Què ve després?', 'Què hi fem?', 'Fem i seguim', 'El camí sencer', 'De tot una mica', 'De tot una mica', 'La prova del camí']) },
  { name: 'Les paraules', sub: 'Cada etapa té les seves', icon: '💬', levels: lv(['Què passa a classe', 'Què passa a classe', 'Què passa a classe', 'Què es diu', 'Què es diu', 'Què es diu i què es fa', 'Paraules i fets', 'Paraules i fets', 'Paraules i fets', 'Tot barrejat']) },
  { name: 'Els volcans', sub: "El diari d'un projecte", icon: '🌋', levels: lv(['On som?', 'On som?', 'On som?', 'On som i què faig', 'On som i què faig', 'On som i què faig', 'El diari sencer', 'El diari sencer', 'El diari sencer', 'La prova dels volcans']) },
  { name: 'Els ocells', sub: 'Un altre diari', icon: '🐦', levels: lv(['On som?', 'On som?', 'On som?', 'On som i què faig', 'On som i què faig', 'On som i què faig', 'El diari sencer', 'El diari sencer', 'El diari sencer', 'La prova dels ocells']) },
  { name: 'Tota la classe', sub: 'Projectes de tota mena', icon: '🏫', levels: lv(['On som?', 'On som?', 'On som?', 'On som i què faig', 'On som i què faig', 'On som i què faig', 'Tot barrejat', 'Tot barrejat', 'Tot barrejat', 'La prova de la classe']) },
  { name: 'Què faig?', sub: 'Moments del grup', icon: '🙋', levels: lv(['Tres moments', 'Tres moments', 'Tres moments', 'Quatre moments', 'Quatre moments', 'Quatre moments', 'I en quina etapa?', 'I en quina etapa?', 'I en quina etapa?', 'La prova del grup']) },
  { name: 'Com ho dic?', sub: 'Les paraules exactes', icon: '🗣️', levels: lv(['Tres frases', 'Tres frases', 'Tres frases', 'Quatre frases', 'Quatre frases', 'Quatre frases', 'I en quina etapa?', 'I en quina etapa?', 'I en quina etapa?', 'La prova de les frases']) },
  { name: 'La frase que ho diu', sub: 'Busca-ho al text', icon: '🔍', levels: lv(['Un text, tres preguntes', 'Un text, tres preguntes', 'Un text, tres preguntes', 'Un text, quatre preguntes', 'Un text, quatre preguntes', 'Un text, quatre preguntes', 'Dos textos', 'Dos textos', 'Dos textos', 'La prova de la lupa']) },
  { name: 'La fitxa', sub: 'Paraules clau i notes', icon: '📝', levels: lv(['Les paraules clau', 'Les paraules clau', 'Les paraules clau', 'Paraules i fitxes', 'Paraules i fitxes', 'Paraules i fitxes', 'Dos textos', 'Dos textos', 'Dos textos', 'La prova de la fitxa']) },
  { name: 'Què ens falta?', sub: 'On ho busco i què queda', icon: '🧩', levels: lv(['On ho busco?', 'On ho busco?', 'On ho busco?', 'Què respon el text?', 'Què respon el text?', 'Què respon el text?', 'Tot plegat', 'Tot plegat', 'Tot plegat', 'La prova de la recerca']) }
];
export const CIRCLES = [
  { name: 'Les sis etapes', projects: [0, 1] },
  { name: 'On som?', projects: [2, 3, 4] },
  { name: 'Dic la meva', projects: [5, 6] },
  { name: 'Treu la informació', projects: [7, 8, 9] }
];

const R = [];
// the path: watch it, order it, what comes next, what is done where
R[0] = (idx, r) => {
  const nexts = n => draw(r, PAIRS, n).map(p => seguent(r, p)), fems = n => draw(r, ALL, n).map(e => queFem(r, e));
  switch (idx) {
    case 0: return [mira(), ordre(r)];
    case 1: return [ordre(r), ...nexts(2)];
    case 2: return [ordre(r), ...nexts(3)];
    case 3: return nexts(4);
    case 4: return fems(4);
    case 5: return [...fems(3), ...nexts(2)];
    case 6: return [ordre(r), ...fems(3)];
    case 7: return mix(r, [...nexts(2), ...fems(2), ...draw(r, ACCIONS, 1).map(accio)]);
    case 8: return mix(r, [...nexts(2), ...fems(2), ...draw(r, ACCIONS, 1).map(accio)]);
    default: return [ordre(r), ...mix(r, [...nexts(2), ...fems(2)])];
  }
};
// the words of each stage: what happens, what is said, what the child says
R[1] = (idx, r) => {
  if (idx < 3) return draw(r, ACCIONS, 4).map(accio);
  if (idx < 5) return draw(r, SENYALS, 4).map(senyal);
  if (idx === 5) return mix(r, [...draw(r, SENYALS, 3).map(senyal), ...draw(r, ACCIONS, 1).map(accio)]);
  return mix(r, [...draw(r, ACCIONS, 2).map(accio), ...draw(r, SENYALS, 1).map(senyal), ...draw(r, FRASES, 2).map(dita)]);
};
// a diary: where the class is each day, and from level 3 on what to do that day
const diari = (D, idx, r) => {
  if (idx < 3) return draw(r, D.dies, 4).map(d => scene(d, D));
  return draw(r, D.dies, 3).flatMap(d => [scene(d, D), ara(r, d)]);
};
R[2] = (idx, r) => diari(VOLCANS, idx, r);
R[3] = (idx, r) => diari(OCELLS, idx, r);
R[4] = (idx, r) => {
  if (idx < 3) return draw(r, BARREJA, 5).map(mixScene);
  if (idx < 6) return draw(r, BARREJA, 3).flatMap(d => [mixScene(d), ara(r, d)]);
  const ds = draw(r, BARREJA, 4);
  return [...ds.slice(0, 3).flatMap(d => [mixScene(d), ara(r, d)]), mixScene(ds[3])];
};
// moments of the group: what to do, what to say; from level 6 on, the stage they happen in too
const moments = (M, dic, idx, r) => {
  if (idx < 3) return draw(r, M, 3).map(m => moment(r, m, dic));
  if (idx < 6) return draw(r, M, 4).map(m => moment(r, m, dic));
  const ms = draw(r, M, 4);
  return [...ms.map(m => moment(r, m, dic)), quan(ms[at(4, r)])];
};
R[5] = (idx, r) => moments(FAIG, false, idx, r);
R[6] = (idx, r) => moments(DIC, true, idx, r);
// the texts
const two = r => draw(r, TEXTOS, 2);
R[7] = (idx, r) => {
  const [T, T2] = two(r);
  if (idx < 3) return draw(r, T.qs, 3).map(q => frase(T, q));
  if (idx < 6) return draw(r, T.qs, 4).map(q => frase(T, q));
  return [...draw(r, T.qs, 3).map(q => frase(T, q)), ...draw(r, T2.qs, 3).map(q => frase(T2, q))];
};
R[8] = (idx, r) => {
  const [T, T2] = two(r), qs = mix(r, T.qs);
  if (idx < 3) return qs.slice(0, 3).map(q => claus(r, T, q));
  if (idx < 6) return [claus(r, T, qs[0]), nota(r, T, qs[1]), claus(r, T, qs[2]), nota(r, T, qs[3])];
  const q2 = draw(r, T2.qs, 2);
  return [claus(r, T, qs[0]), nota(r, T, qs[1]), claus(r, T, qs[2]), claus(r, T2, q2[0]), nota(r, T2, q2[1])];
};
R[9] = (idx, r) => {
  const [T, T2] = two(r);
  if (idx < 3) return draw(r, BUSCA, 4).map(b => font(r, b));
  if (idx < 6) return [respon(r, T), falta(r, T), respon(r, T2), falta(r, T2)];
  return [...draw(r, BUSCA, 2).map(b => font(r, b)), respon(r, T), falta(r, T), falta(r, T2)];
};
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

// What is saved is facts only: { so, lv[100], piscina, exams[4], fulls, ratxa } and meu, the child's real class project as text (see
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
  { name: 'Tots els projectes', what: 'Valida els deu projectes.' },
  { name: "Brúixola d'or", what: 'Supera els quatre exàmens.' }
];
export const badges = p => [p.piscina === true, CIRCLES[0].projects.every(i => noteOf(p, i) >= VALID), p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 12,
  meuOf(p).nom !== '', p.exams[1] === true, p.exams[2] === true, p.exams[3] === true, PROJECTS.every((_, i) => noteOf(p, i) >= VALID), p.exams.every(e => e === true)];

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
    default: return mix(r, [...draw(r, BUSCA, 2).map(b => font(r, b)), respon(r, T), falta(r, T)]);
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
