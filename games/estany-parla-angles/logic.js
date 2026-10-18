import { curs, whole, within, slots, at, int, shuffle, POINTS, VALID, EXAM_PASS, starsFor, exOf } from '../../shared/curs.js';
import { VOCAB, W, inGroup, numWord, an, plural, PEOPLE, FACTS, LOVES, ROLES, TOPICS, TEXTS, SENTENCES, TASKS, SLIPS } from './content.js';
// The rules and the rounds of «L'estany parla anglès», with no page in it. Every level is a round of a few questions, like the parts of
// the English test of the «avaluació de diagnòstic» of 4t: listen and choose the picture, listen and say TRUE or FALSE, listen and do,
// read a text with headings and answer, and write a word or a sentence. Chance enters only through rnd; it must keep importing from Node.

/* ---------- chance ---------- */
const pick = (r, a) => a[at(a.length, r)];
const mix = (r, a) => shuffle(a.slice(), r);
// n different things of pool, none of not
const draw = (r, pool, n, not = []) => mix(r, pool.filter(x => !not.includes(x))).slice(0, n);
// the right one and n - 1 others of pool, shuffled: { opts, ok }
function choice(r, right, pool, n = 3) {
  const opts = mix(r, [right, ...draw(r, pool, n - 1, [right])]);
  return { opts, ok: opts.indexOf(right) };
}

/* ---------- what each kind of question says to do: in English, as in the test, and in Catalan underneath ---------- */
export const SAYS = {
  listen: ['Listen and choose the right picture.', 'Escolta i tria el dibuix.'],
  read: ['Read and choose the picture.', 'Llegeix i tria el dibuix.'],
  look: ['Look and choose the word.', 'Mira el dibuix i tria la paraula.'],
  tfPic: ['Listen. Is it TRUE or FALSE?', 'Escolta. És veritat (TRUE) o mentida (FALSE)?'],
  tfHeard: ['Listen carefully. Choose TRUE or FALSE according to the listening.', "Escolta bé. La frase escrita és igual que la que sents? TRUE si és igual; FALSE si canvia alguna cosa."],
  order: ['Listen and tap the pictures in the order you hear them.', "Escolta i toca els dibuixos en l'ordre que els sents."],
  colour: ['Listen and colour.', 'Escolta i pinta: tria un color i toca la figura.'],
  radio: ['Listen carefully and mark the correct answer according to the listening. Only one option is correct.', 'Escolta bé i tria la resposta que diu la gravació. Només n’hi ha una de bona.'],
  text: ['Answer the questions according to the text. Only one option is correct.', 'Respon segons el text. Només hi ha una resposta bona.'],
  textTf: ['Choose TRUE or FALSE according to the text.', 'Tria TRUE (veritat) o FALSE (mentida) segons el text.'],
  spell: ['Listen and write the word.', 'Escolta i escriu la paraula.'],
  build: ['Put the words in order.', 'Posa les paraules en ordre.']
};
const ask = (kind, extra = {}) => ({ en: SAYS[kind][0], ca: SAYS[kind][1], ...extra });

/* ---------- words ---------- */
const COLOURS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];
const groups = (...cs) => cs.flatMap(inGroup);
// the words that can be spelt with letters: one word, no capital, not too long
const spellable = k => /^[a-z]+$/.test(W[k].word) && W[k].word.length <= 9;
const nk = n => 'n' + n;
// a number from 0 to 100 as a picture; the album knows the ones it has
const numPic = n => ({ pic: '=' + n, key: W[nk(n)] ? nk(n) : null, word: numWord(n) });
const pic = k => ({ pic: W[k].pic, key: k, word: W[k].word });

// listen to a word and choose its picture among n
function listenWord(r, k, pool, n = 3, say = null) {
  const c = choice(r, k, pool, n);
  return { k: 'pick', ...ask('listen'), say: say || W[k].word, opts: c.opts.map(pic), ok: c.ok, word: k, learn: W[k].word };
}
// read a word and choose its picture
function readWord(r, k, pool, n = 3) {
  const c = choice(r, k, pool, n);
  return { k: 'pick', ...ask('read'), show: W[k].word, opts: c.opts.map(pic), ok: c.ok, word: k, learn: W[k].word, after: W[k].word };
}
// look at a picture and choose its word
function lookWord(r, k, pool, n = 3) {
  const c = choice(r, k, pool, n);
  return { k: 'pick', ...ask('look'), big: W[k].pic, opts: c.opts.map(x => ({ t: W[x].word })), ok: c.ok, word: k, learn: W[k].word, after: W[k].word };
}
// listen to a number and choose it among three: the first ones of others are the traps (13 and 30), the rest fills up
function listenNum(r, n, others, say = null) {
  const seen = new Set([n]), opts = [n];
  for (const x of [...others, ...mix(r, Array.from({ length: 100 }, (_, i) => i + 1))]) if (opts.length < 3 && Number.isInteger(x) && x >= 1 && x <= 100 && !seen.has(x)) { seen.add(x); opts.push(x); }
  const o = mix(r, opts);
  return { k: 'pick', ...ask('listen'), say: say || numWord(n), opts: o.map(numPic), ok: o.indexOf(n), word: W[nk(n)] ? nk(n) : null, learn: `${n}: ${numWord(n)}` };
}
// the letters of a word and a few more, shuffled
function spellWord(r, word, picture, key = null, extra = 2) {
  const abc = 'abcdefghijklmnoprstuwy'.split('').filter(l => !word.includes(l));
  return { k: 'spell', ...ask('spell'), say: word, big: picture, letters: mix(r, [...word.replace(/[^a-z]/g, ''), ...draw(r, abc, extra)]), word: key, target: word, learn: word };
}
// the words of a sentence and the wrong ones mixed in
function buildSentence(r, s, nBad, task = null) {
  const words = s.w.replace(/ \.$/, '').split(' ');
  const bad = draw(r, s.bad || [], nBad).filter(b => !words.includes(b));
  return { k: 'build', ...(task ? { en: task.q, ca: task.ca } : ask('build')), say: words.join(' ') + '.', big: task ? task.pic : s.pic, words, tiles: mix(r, [...words, ...bad]),
    caLine: s.ca || null, learn: words.join(' ') + '.' };
}

/* ---------- the monster of «True or false?»: what it has, drawn by the page ---------- */
const MONSTER = { col: ['green', 'blue', 'red', 'purple', 'orange', 'pink'], eyes: [1, 2, 3, 4], legs: [2, 3, 4], arms: [2, 4] };

/* ---------- the radio: a person who talks about themself (Listening 1) ---------- */
// A person drawn with rnd: name, pronoun, a job sometimes, and for each fact the right option. nots puts «I don't like tennis.» before
// «I love playing football.»: the wrong option is heard too, as in the test
function person(r, facts, nots = false) {
  const [name, he] = pick(r, PEOPLE), grown = r() < 0.4;
  const lines = [`Hello! My name is ${name}.`];
  if (grown) lines.push(`I am ${pick(r, ROLES)}.`);
  const qs = [];
  for (const f of facts) {
    const F = FACTS[f];
    let pool = F.opts;
    if (f === 'age') pool = grown ? F.opts.filter(o => +o.pic.slice(1) >= 15) : F.opts.filter(o => +o.pic.slice(1) <= 13);
    if (f === 'age' && pool.length < 3) pool = F.opts;
    const right = pick(r, pool), others = draw(r, pool.filter(o => o !== right), 2);
    if (nots && F.not && r() < 0.6) lines.push(others[0].n);
    lines.push(right.s);
    const opts = mix(r, [right, ...others]);
    qs.push({ f, say: right.s, line: F.line, ca: F.ca, opts: opts.map(o => ({ pic: o.pic || W[o.k].pic, key: W[o.k] ? o.k : null, word: o.pic ? o.pic.slice(1) : W[o.k].word })), ok: opts.indexOf(right), word: right.k });
  }
  const [love, line] = pick(r, LOVES), wrong = draw(r, LOVES.map(l => l[0]), 2, [love]);
  lines.push(line);
  const lopts = mix(r, [love, ...wrong]);
  return { name, he, lines, qs, love: { line: `${name} loves...`, say: line, opts: lopts.map(t => ({ t })), ok: lopts.indexOf(love) } };
}
// the questions of a person: each with its own sentence to listen to (alone), or all of them after the whole recording (once)
function radioItems(P, alone) {
  return P.qs.map(q => ({ k: 'pick', ...ask('radio'), en: alone ? SAYS.listen[0] : SAYS.radio[0], ca: q.ca, say: alone ? q.say : null, show: q.line, opts: q.opts, ok: q.ok, word: q.word, learn: q.say }));
}
const loveItem = (P, alone) => ({ k: 'pick', ...ask('radio'), ca: `Què li encanta a ${P.name}? Pensa en l'última frase.`, say: alone ? P.love.say : null, show: P.love.line, opts: P.love.opts, ok: P.love.ok, learn: P.love.say });
// tap the things in the order they are heard
function orderItem(r, n, who = null) {
  const pool = ['pencil', 'book', 'ruler', 'clock', 'computer', 'chair', 'camera', 'teddy', 'apple', 'banana', 'cap', 'hat', 'scarf', 'robot', 'rocket', 'car', 'bus', 'star', 'schoolbag', 'umbrella'].filter(k => W[k]);
  const seq = draw(r, pool, n), words = ['First', 'Then', 'After that', 'Finally'];
  const name = who || pick(r, PEOPLE)[0];
  const lines = seq.map((k, i) => `${i === n - 1 ? 'Finally' : words[i]}, ${an(W[k].word)}.`);
  const opts = mix(r, seq);
  return { k: 'order', ...ask('order'), show: `${name} needs to find these things. Can you help?`, say: lines, opts: opts.map(pic), seq: seq.map(k => opts.indexOf(k)), learn: seq.map(k => W[k].word).join(', ') };
}

/* ---------- «True or false?» ---------- */
// the things that can be «a ...»: no milk, no sun
const IDENT = ['dog', 'cat', 'bird', 'horse', 'cow', 'pig', 'duck', 'frog', 'rabbit', 'lion', 'tiger', 'elephant', 'monkey', 'snake', 'bear', 'owl', 'turtle', 'penguin',
  'apple', 'banana', 'strawberry', 'carrot', 'tomato', 'sandwich', 'car', 'bus', 'train', 'plane', 'boat', 'bike', 'rocket', 'robot', 'book', 'pencil', 'ruler', 'clock', 'chair', 'computer', 'camera'];
// a picture and a sentence about it; ok whether the sentence says what the picture shows
function tfIdentity(r) {
  const pool = IDENT, k = pick(r, pool), yes = r() < 0.5, said = yes ? k : pick(r, pool.filter(x => x !== k && W[x].cat === W[k].cat));
  return { k: 'tf', ...ask('tfPic'), big: W[k].pic, say: `This is ${an(W[said].word)}.`, ok: yes, word: k, learn: `This is ${an(W[k].word)}.` };
}
function tfCount(r) {
  const k = pick(r, ['dog', 'cat', 'bird', 'apple', 'banana', 'star', 'car', 'duck', 'fish', 'egg', 'flower', 'pencil']), n = int(r, 1, 6), yes = r() < 0.5;
  const m = yes ? n : pick(r, [n - 1, n + 1, n + 2].filter(x => x >= 1 && x <= 8));
  const say = x => x === 1 ? `There is one ${W[k].word}.` : `There are ${numWord(x)} ${plural(W[k].word)}.`;
  return { k: 'tf', ...ask('tfPic'), big: W[k].pic.repeat(n), say: say(m), ok: yes, word: nk(n), learn: say(n) };
}
function tfMonster(r) {
  const M = { col: pick(r, MONSTER.col), eyes: pick(r, MONSTER.eyes), legs: pick(r, MONSTER.legs), arms: pick(r, MONSTER.arms) };
  const what = pick(r, ['col', 'eyes', 'legs', 'arms']), yes = r() < 0.5;
  const val = yes ? M[what] : pick(r, MONSTER[what].filter(v => v !== M[what]));
  const say = (w, v) => w === 'col' ? `The monster is ${v}.` : `The monster has got ${numWord(v)} ${v === 1 ? w.slice(0, -1) : w}.`;
  return { k: 'tf', ...ask('tfPic'), monster: M, say: say(what, val), ok: yes, word: what === 'col' ? M.col : null, learn: say(what, M[what]) };
}
// what is heard is always true; the sentence printed is the same, or has one word changed (the test's Listening 2)
function heardLines(r, topic, n) {
  // about half of them are the same: never all TRUE or all FALSE
  const half = Math.ceil(n / 2) - (n % 2 && r() < 0.5 ? 1 : 0), yes = mix(r, Array.from({ length: n }, (_, i) => i < half));
  return draw(r, topic.lines, n).map((l, i) => {
    const m = l.match(/\[([^\]]+)\]/), [good, ...bad] = m[1].split('|');
    const heard = l.replace(m[0], good), shown = l.replace(m[0], yes[i] ? good : pick(r, bad));
    const pos = l.slice(0, m.index).split(' ').length - 1;
    return { heard, shown, yes: yes[i], pos };
  });
}
const tfHeard = (L, num, alone) => ({ k: 'tf', ...ask('tfHeard'), show: L.shown, say: alone ? `Number ${num}. ${L.heard}` : null, ok: L.yes, hl: L.pos, learn: L.heard, num });

// the shapes to colour and the colours of the box
const SHAPES = ['star', 'heart', 'circle', 'square', 'triangle', 'moon'];
const PAINT = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown'];
function colourItem(r, n) {
  const shapes = draw(r, SHAPES, 4), cols = draw(r, PAINT, n), targets = shapes.slice(0, n), want = {};
  targets.forEach((s, i) => { want[s] = cols[i]; });
  const say = targets.map((s, i) => `Colour the ${s} ${cols[i]}`).join(' and ') + '.';
  return { k: 'colour', ...ask('colour'), say, shapes: mix(r, shapes), want, palette: mix(r, [...new Set([...cols, ...draw(r, PAINT, 6 - n, cols)])]), learn: say };
}
// where a thing is: three pictures of it in three places
const WHERE = ['on', 'under', 'next to', 'in'];
function placeItem(r) {
  const a = pick(r, ['cat', 'dog', 'teddy', 'bird', 'mouse', 'rabbit']), b = pick(r, ['box', 'chair']);
  const rels = b === 'box' ? WHERE : WHERE.filter(w => w !== 'in'), c = choice(r, pick(r, rels), rels);
  const say = rel => `The ${W[a].word} is ${rel} the ${W[b].word}.`;
  return { k: 'pick', ...ask('listen'), say: say(c.opts[c.ok]), opts: c.opts.map(rel => ({ place: { a: W[a].pic, b: W[b].pic, rel }, word: rel })), ok: c.ok, word: a, learn: say(c.opts[c.ok]) };
}

/* ---------- reading ---------- */
const textOf = (group, i) => TEXTS[group][i % TEXTS[group].length];
function orderOpts(r, T) {
  const hs = T.secs.map(s => s.h.charAt(0) + s.h.slice(1).toLowerCase()), right = hs.join(', ') + '.', seen = new Set([right]), others = [];
  for (let n = 0; n < 30 && others.length < 2; n++) { const o = mix(r, hs).join(', ') + '.'; if (!seen.has(o)) { seen.add(o); others.push(o); } }
  return choice(r, right, others, 3);
}
// the questions of a text, ready to play: pick (with words or pictures) or tf
function textItems(r, T, which = null) {
  const qs = which ? which.map(i => T.qs[i]) : T.qs;
  return qs.map(q => {
    if (q.tf) return { k: 'tf', ...ask('textTf'), show: q.tf, ok: q.a, sec: q.s, learn: q.tf };
    if (q.order) { const c = orderOpts(r, T); return { k: 'pick', ...ask('text'), show: 'In what order does the information appear in the text?', opts: c.opts.map(t => ({ t })), ok: c.ok, sec: null, learn: c.opts[c.ok] }; }
    if (q.about) { const c = choice(r, q.about[0], q.about.slice(1)); return { k: 'pick', ...ask('text'), show: 'This text is about...', opts: c.opts.map(t => ({ t })), ok: c.ok, sec: null, learn: `This text is about ${q.about[0]}.` }; }
    const c = choice(r, q.o[0], q.o.slice(1));
    return { k: 'pick', ...ask('text'), show: q.q, opts: c.opts.map(o => q.pics ? pic(o) : { t: o }), ok: c.ok, sec: q.s, word: q.pics ? q.o[0] : null, learn: q.pics ? W[q.o[0]].word : q.o[0] };
  });
}

/* ---------- the rounds of the six projects ---------- */
// R[p](idx, rnd) → { items, intro?, text? }. intro is a recording heard before the questions (lines), once says the questions have no
// sentence of their own: the whole recording is what is heard, as in the test
const BASIC = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'grey'];
const R = [
  // 0 · Hello!: colours and numbers
  (idx, r) => {
    const one = Array.from({ length: 10 }, (_, i) => i + 1), teen = Array.from({ length: 10 }, (_, i) => i + 11);
    if (idx === 0) return { items: draw(r, BASIC, 6).map(k => listenWord(r, k, BASIC)) };
    if (idx === 1) return { items: draw(r, one, 6).map(n => listenNum(r, n, one)) };
    if (idx === 2) return { items: mix(r, [...draw(r, BASIC, 3).map(k => readWord(r, k, BASIC)), ...draw(r, one, 3).map(n => readWord(r, nk(n), one.map(nk)))]) };
    if (idx === 3) return { items: draw(r, teen, 6).map(n => listenNum(r, n, [n - 10, n % 10 >= 3 ? (n % 10) * 10 : n + 1, ...teen])) };
    if (idx === 4) return { items: draw(r, [3, 4, 5, 6, 7, 8, 9], 6).map(d => { const pair = [10 + d, d * 10], n = pick(r, pair); const o = pair.find(x => x !== n); return listenNum(r, n, [o, o, d]); }) };
    if (idx === 5) {
      const ages = draw(r, [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 40], 2);
      return { items: mix(r, [...draw(r, ['red', 'blue', 'pink', 'green', 'black', 'white', 'brown'], 3).map(k => spellWord(r, k, W[k].pic, k)),
        ...ages.map(n => listenNum(r, n, [n + 1, n - 1, n > 12 && n < 20 ? (n - 10) * 10 : n + 10], `I am ${numWord(n)} years old.`)),
        (k => listenWord(r, k, BASIC, 3, `My favourite colour is ${k}.`))(pick(r, BASIC))]) };
    }
    if (idx === 6) return { items: Array.from({ length: 6 }, () => { const n = int(r, 21, 99), sw = (n % 10) * 10 + Math.floor(n / 10); return listenNum(r, n, [sw > 9 && sw !== n ? sw : n + 2, n + 10 > 99 ? n - 10 : n + 10, n - 1]); }) };
    if (idx === 7) {
      const traps = [[40, 14, 4], [30, 13, 3], [50, 15, 5], [80, 18, 8], [12, 20, 2], [60, 16, 6], [90, 19, 9]];
      return { items: mix(r, [...draw(r, traps, 4).map(([a, b, c]) => { const o = mix(r, [a, b, c]); return { k: 'pick', ...ask('look'), big: '=' + a, opts: o.map(x => ({ t: numWord(x) })), ok: o.indexOf(a), word: nk(a), learn: `${a}: ${numWord(a)}` }; }),
        ...draw(r, BASIC, 2).map(k => lookWord(r, k, BASIC))]) };
    }
    if (idx === 8) return { items: draw(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20], 5).map(n => spellWord(r, numWord(n), '=' + n, nk(n))) };
    return { items: mix(r, [...draw(r, BASIC, 2).map(k => listenWord(r, k, BASIC)), ...Array.from({ length: 2 }, () => { const n = int(r, 11, 100); return listenNum(r, n, [n === 100 ? 90 : n + 1, n > 20 ? n - 10 : n + 10, n < 20 ? (n % 10) * 10 || 50 : n - 1]); }),
      (n => spellWord(r, numWord(n), '=' + n, nk(n)))(pick(r, [3, 5, 7, 8, 9, 10, 11, 12])), (k => readWord(r, k, BASIC))(pick(r, BASIC))]) };
  },
  // 1 · My world: animals, food, clothes, hobbies, places, things
  (idx, r) => {
    const G = [['ani', 'body'], ['food'], ['clo'], ['hob'], ['pla', 'tra'], ['sch', 'rec', 'nat']];
    const all = groups('ani', 'body', 'food', 'clo', 'hob', 'pla', 'tra', 'sch', 'rec', 'nat');
    const same = k => all.filter(x => W[x].cat === W[k].cat);
    if (idx <= 5) { const pool = groups(...G[idx]); return { items: draw(r, pool, idx ? 6 : 7).map(k => listenWord(r, k, pool.filter(x => W[x].cat === W[k].cat).length >= 3 ? pool.filter(x => W[x].cat === W[k].cat) : pool)) }; }
    if (idx === 6) return { items: draw(r, all, 6).map(k => readWord(r, k, same(k), 4)) };
    if (idx === 7) return { items: draw(r, all, 6).map(k => lookWord(r, k, same(k), 3)) };
    if (idx === 8) return { items: draw(r, all.filter(k => spellable(k) && W[k].word.length <= 6), 5).map(k => spellWord(r, W[k].word, W[k].pic, k)) };
    const COUNT = ['apple', 'banana', 'strawberry', 'carrot', 'tomato', 'biscuit', 'sandwich', 'egg'], PAIRS = ['trousers', 'trainers', 'boots', 'gloves', 'socks', 'shorts', 'glasses'];
    const tpl = [
      [groups('food'), k => `I like ${COUNT.includes(k) ? plural(W[k].word) : W[k].word}.`],
      [groups('ani'), k => `I've got ${an(W[k].word)}.`],
      [groups('clo'), k => `I'm wearing ${PAIRS.includes(k) ? W[k].word : an(W[k].word)}.`],
      [groups('tra').filter(k => !['sun', 'moon', 'earth'].includes(k)), k => `I can see ${an(W[k].word)}.`]];
    return { items: Array.from({ length: 6 }, () => { const [pool, say] = pick(r, tpl), k = pick(r, pool); const it = listenWord(r, k, pool, 4, say(k)); it.learn = say(k); return it; }) };
  },
  // 2 · Ràdio Granota: somebody talks about themself, and things heard in an order
  (idx, r) => {
    const F = Object.keys(FACTS);
    if (idx <= 2) {
      const facts = idx === 0 ? draw(r, ['pet', 'colour', 'food', 'go', 'wear'], 5) : idx === 1 ? draw(r, ['age', 'live', 'pet', 'play', 'hobby'], 5) : draw(r, F, 5);
      const P = person(r, facts);
      return { intro: { who: P.name, lines: P.lines }, items: radioItems(P, true) };
    }
    if (idx <= 5) {
      const P = person(r, draw(r, F, 4), idx === 5);
      return { intro: { who: P.name, lines: P.lines }, items: [orderItem(r, idx === 3 ? 3 : 4, P.name), ...radioItems(P, true)] };
    }
    const P = person(r, draw(r, F, 5), idx >= 8);
    return { once: true, intro: { who: P.name, lines: P.lines }, items: [...radioItems(P, false), loveItem(P, false)] };
  },
  // 3 · True or false?: what is seen and what is heard, and doing what is heard
  (idx, r) => {
    if (idx === 0) return { items: Array.from({ length: 6 }, () => tfIdentity(r)) };
    if (idx === 1) return { items: Array.from({ length: 6 }, () => tfCount(r)) };
    if (idx === 2) return { items: Array.from({ length: 6 }, () => tfMonster(r)) };
    if (idx === 3) return { items: Array.from({ length: 4 }, () => colourItem(r, 1)) };
    if (idx === 4) return { items: Array.from({ length: 5 }, () => placeItem(r)) };
    if (idx === 5) return { items: mix(r, [colourItem(r, 2), colourItem(r, 2), placeItem(r), placeItem(r), placeItem(r)]) };
    const T = pick(r, TOPICS), n = idx <= 7 ? 4 : 5, L = heardLines(r, T, n);
    if (idx <= 7) return { topic: T, items: L.map((l, i) => tfHeard(l, i + 1, true)) };
    return { topic: T, once: true, intro: { who: T.name, lines: L.map((l, i) => `Number ${i + 1}. ${l.heard}`) }, items: L.map((l, i) => tfHeard(l, i + 1, false)) };
  },
  // 4 · Reading: a card, a short text, a text like the test's
  (idx, r) => {
    const T = idx <= 2 ? textOf('short', idx) : idx <= 5 ? textOf('medium', idx - 3) : textOf('long', idx - 6);
    return { text: T, items: textItems(r, T) };
  },
  // 5 · Write it!: letters, words in order, and the writing of the test
  (idx, r) => {
    const sp = groups('ani', 'food', 'clo', 'tra', 'sch', 'nat', 'pla').filter(spellable);
    const len = idx === 0 ? [3, 3] : idx === 1 ? [4, 5] : [5, 8];
    if (idx <= 2) return { items: draw(r, sp.filter(k => W[k].word.length >= len[0] && W[k].word.length <= len[1]), 5).map(k => spellWord(r, W[k].word, W[k].pic, k, idx + 1)) };
    const S = n => SENTENCES.filter(s => s.w.split(' ').length - 1 <= n);
    if (idx === 3) return { items: draw(r, S(5), 4).map(s => buildSentence(r, s, 0)) };
    if (idx === 4) return { items: draw(r, S(6), 4).map(s => buildSentence(r, s, 1)) };
    if (idx === 5) return { items: draw(r, SENTENCES.filter(s => s.w.split(' ').length - 1 >= 5), 4).map(s => buildSentence(r, s, 2)) };
    const T = pick(r, TASKS), hob = draw(r, ['reading', 'dancing', 'singing', 'swimming', 'cooking', 'skating', 'painting', 'football', 'tennis'], 2);
    const task = draw(r, T.ans, 2).map(([w, pc]) => buildSentence(r, { w, bad: T.bad }, idx >= 8 ? 2 : 1, { ...T, pic: pc }));
    const hobbies = hob.map(k => ({ ...spellWord(r, W[k].word, W[k].pic, k, 2), en: 'What about you? What are your hobbies? Write a hobby.', ca: "I tu? Escriu l'afició del dibuix." }));
    return { items: [...task, ...hobbies, buildSentence(r, pick(r, SENTENCES), 2)] };
  }
];
// the round of level idx of project p, drawn with rnd
export function round(p, idx, rnd = Math.random) { return (R[p] || R[0])(Math.min(9, Math.max(0, whole(idx))), rnd); }

// where the words of each group of the album come up first: [project, level]
export const LEARN = { col: [0, 0], num: [0, 1], ani: [1, 0], body: [1, 0], food: [1, 1], clo: [1, 2], hob: [1, 3], pla: [1, 4], tra: [1, 4], sch: [1, 5], rec: [1, 5], nat: [1, 5] };

/* ---------- the cursus: circles, projects, marks ---------- */
const lv = titles => titles.map(title => ({ title }));
export const PROJECTS = [
  { name: 'Hello!', sub: 'Colors i números', icon: '👋', levels: lv(['Colours', 'Numbers 1-10', 'Read the words', 'Numbers 11-20', 'Thirteen or thirty?', 'How old are you?', 'Big numbers', 'Choose the word', 'Spell the numbers', 'Review']) },
  { name: 'My world', sub: 'Animals, menjar, roba i més', icon: '🌍', levels: lv(['Animals', 'Food', 'Clothes', 'Hobbies', 'Places', 'Things', 'Read the words', 'Choose the word', 'Spell it', 'Sentences']) },
  { name: 'Ràdio Granota', sub: 'Escolta qui parla', icon: '📻', levels: lv(['Meet a friend', 'Hello, who are you?', 'All about me', 'Find the things', 'Listen in order', 'Careful!', 'The whole radio', 'The whole radio', 'Tricky radio', 'Tricky radio']) },
  { name: 'True or false?', sub: 'Veritat o mentida', icon: '✅', levels: lv(['This is...', 'How many?', 'The monster', 'Colour it', 'Where is it?', 'Listen and do', 'Listen carefully', 'Listen carefully', 'The whole listening', 'The whole listening']) },
  { name: 'Reading', sub: 'Llegeix i respon', icon: '📖', levels: lv([...TEXTS.short.map(t => t.title), ...TEXTS.medium.map(t => t.title), ...TEXTS.long.slice(0, 4).map(t => t.title)]) },
  { name: 'Write it!', sub: 'Lletres i frases', icon: '✏️', levels: lv(['Three letters', 'Short words', 'Long words', 'Short sentences', 'Sentences', 'Long sentences', 'Write like the test', 'Write like the test', 'Write like the test', 'Write like the test']) }
];
export const CIRCLES = [
  { name: 'Primeres paraules', projects: [0, 1] },
  { name: 'Escolta!', projects: [2, 3] },
  { name: 'Llegeix i escriu', projects: [4, 5] }
];
const count = a => a.filter(Boolean).length;
const cursus = curs({ PROJECTS, CIRCLES, field: 'stars', lists: ['words'], badges: p => badges(p), BADGES: () => BADGES, xpExtra: p => 2 * count(p.words) + 5 * p.best });
export const { circleOf, noteOf, reached, validated, xpOf, levelText, isOpen, examOpen, levelIn, poolIn, examIn, sheetIn, streakIn } = cursus;
export { POINTS, VALID, EXAM_PASS, starsFor, exOf, shuffle };
// the record of the simulacre: the best score of the 20 questions
export const mockIn = cursus.keep('best');
// the Piscina: three short rounds to learn the buttons (listen, TRUE or FALSE, read)
export const POOL = [{ title: 'Escolta i toca', p: 0, idx: 0, n: 4 }, { title: 'TRUE o FALSE', p: 3, idx: 0, n: 4 }, { title: 'Llegeix i toca', p: 1, idx: 6, n: 3 }];
export const pool = (k, rnd = Math.random) => { const P = POOL[k] || POOL[0]; return round(P.p, P.idx, rnd).items.slice(0, P.n); };

// What is saved is facts only: { so, stars[60], piscina, exams[3], fulls, ratxa, best, proves, words[...] }. words keeps a boolean per word of
// VOCAB, in its order (the album). Marks, XP, level and badges are worked out, never stored.
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const stars = slots(o.stars, PROJECTS.length * 10).map(s => within(s, 3));
  return { so: o.so !== false, stars, piscina: o.piscina === true || stars.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), ratxa: Math.max(0, whole(o.ratxa)), best: within(o.best, 20), proves: Math.max(0, whole(o.proves)),
    words: slots(o.words, VOCAB.length).map(w => w === true) };
}
// the words newly got: a new progress with them in the album, and the keys that were not there
export function wordsIn(p, keys) {
  const next = cursus.copy(p), got = [];
  for (const k of keys) { const i = VOCAB.findIndex(v => v.key === k); if (i >= 0 && !next.words[i]) { next.words[i] = true; got.push(k); } }
  return { prog: next, got, news: cursus.earned(p, next) };
}
// a simulacre done: its score kept when it is the best, and one more done
export function mockDone(p, score) {
  const r = mockIn(p, within(score, 20)), next = { ...r.prog, proves: p.proves + 1 };
  return { prog: next, best: r.best, news: cursus.earned(p, next) };
}
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: "Caça bé les errades d'un full." },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 15', what: 'Encerta 15 preguntes seguides.' },
  { name: '50 paraules', what: "Posa 50 paraules a l'àlbum." },
  { name: '100 paraules', what: "Posa 100 paraules a l'àlbum." },
  { name: 'Primer simulacre', what: 'Fes un simulacre de la prova.' },
  { name: 'Aprovat!', what: 'Treu 10 o més al simulacre.' },
  { name: 'Excel·lent!', what: 'Treu 18 o més al simulacre.' },
  { name: 'Tots els projectes', what: 'Valida els sis projectes.' },
  { name: 'English expert', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 15, count(p.words) >= 50, count(p.words) >= 100,
  p.proves >= 1, p.best >= 10, p.best >= 18, PROJECTS.every((_, i) => noteOf(p, i) >= VALID), p.exams.every(e => e === true)];

/* ---------- the exam of a circle ---------- */
// Six different levels of the projects of circle c, at least one of each project, in a random order; each { title, p, idx }
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, used = new Set();
  const take = p => {
    let idx = at(10, rnd);
    for (let n = 0; n < 10 && used.has(p * 10 + idx); n++) idx = (idx + 1) % 10;
    used.add(p * 10 + idx);
    return { ...PROJECTS[p].levels[idx], p, idx };
  };
  const list = ps.map(take);
  while (list.length < 6) list.push(take(ps[at(ps.length, rnd)]));
  return shuffle(list, rnd);
}
// one question of the level of an exam: an item of its round, with the recording or the text it needs
export function examItem(q, rnd = Math.random) {
  const Rd = round(q.p, q.idx, rnd), it = { ...Rd.items[at(Rd.items.length, rnd)] };
  if (Rd.text) it.text = Rd.text;
  if (Rd.once && Rd.intro) it.intro = Rd.intro;
  if (Rd.topic) it.topic = Rd.topic;
  return it;
}

/* ---------- the simulacre: the 20 questions of the test, as in 2025-26 ---------- */
// Listening 1 (1-6): a person talks; five questions with pictures and one with words. Listening 2 (7-10): TRUE or FALSE according to
// what is heard. Reading (11-16): six questions about a text; (17-20) TRUE or FALSE. Every recording can be heard twice.
export function mock(rnd = Math.random) {
  const P = person(rnd, draw(rnd, Object.keys(FACTS), 5), true), T = pick(rnd, TOPICS), L = heardLines(rnd, T, 4), X = pick(rnd, TEXTS.long);
  const R1 = textItems(rnd, X), mc = R1.filter(i => i.k === 'pick'), tf = R1.filter(i => i.k === 'tf');
  return [
    { title: 'LISTENING 1 (1-6)', name: `Meet ${P.name}`, en: SAYS.radio[0], intro: { who: P.name, lines: P.lines }, items: [...radioItems(P, false), loveItem(P, false)] },
    { title: 'LISTENING 2 (7-10)', name: T.name, en: SAYS.tfHeard[0], topic: T, intro: { who: T.name, lines: L.map((l, i) => `Number ${i + 7}. ${l.heard}`) }, items: L.map((l, i) => tfHeard(l, i + 7, false)) },
    { title: 'READING COMPREHENSION (11-20)', name: X.title, en: SAYS.text[0], text: X, items: [...mc.slice(0, 6), ...tf.slice(0, 4)] }
  ];
}

/* ---------- «Caça l'errada»: three sentences of the notebook; from none to two have the mistake of a beginner ---------- */
const CLAIM = {
  age: r => SLIPS.age(int(r, 8, 12)),
  adjective: r => SLIPS.adjective(pick(r, ['red', 'blue', 'green', 'black', 'white', 'brown']), pick(r, ['dog', 'cat', 'bird', 'fish', 'horse', 'rabbit'])),
  likes: r => SLIPS.likes(pick(r, ['pizza', 'cheese', 'chocolate', 'bread', 'salad', 'milk'])),
  hasGot: r => SLIPS.hasGot(pick(r, ['dog', 'cat', 'rabbit', 'bike', 'camera', 'robot'])),
  plural: r => SLIPS.plural(int(r, 2, 5), pick(r, ['bird', 'cat', 'dog', 'star', 'car', 'book'])),
  thereAre: r => SLIPS.thereAre(int(r, 2, 5), pick(r, ['apple', 'banana', 'duck', 'pencil', 'flower', 'egg'])),
  from: () => SLIPS.from(),
  playing: r => SLIPS.playing(pick(r, ['football', 'tennis', 'basketball']))
};
export const KINDS = Object.keys(CLAIM);
// Three sentences of three different kinds, each { kind, pic, ca, says, real, opts }; from 0 to 2 of them are wrong (never all three)
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => {
    const s = CLAIM[kind](rnd);
    return { kind, pic: s.pic, ca: s.ca, real: s.real, says: bads.has(i) ? s.bad : s.real, opts: mix(rnd, [s.real, s.bad, s.other]) };
  });
}
export { VOCAB, W };
