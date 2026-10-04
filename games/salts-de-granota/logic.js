const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[rnd(0, arr.length - 1)];
// Catalan articles elide before 1 (u) and 11 (onze)
const vow = n => n === 1 || n === 11;
const el = n => vow(n) ? `l'${n}` : `el ${n}`;
const del = n => vow(n) ? `de l'${n}` : `del ${n}`;
const al = n => vow(n) ? `a l'${n}` : `al ${n}`;
const cap = s => s[0].toUpperCase() + s.slice(1);
export const bar = n => n === 1 ? '1 barra' : `${n} barres`;
export const cub = n => n === 1 ? '1 cubet' : `${n} cubets`;
const falten = n => n === 1 ? 'En falta 1' : `En falten ${n}`;
const queden = n => n === 1 ? 'en queda 1' : `en queden ${n}`;

// One problem of a trick. Types 1 to 5 are the tricks for adding and 7 to 11 the same tricks for taking away.
// lhs and rhs are what is written before and after the answer box; jumps are the frog's hops on the number line;
// caps narrate the trick, one caption per hop after the first; pre means the first hop is already drawn when the picture is on screen.
export function make(type, a, b) {
  if (type === 1) {
    const f = 10 - a;
    return { type, a, b: f, ans: f, key: '1:' + a, lhs: `${a} +`, rhs: '= 10', eq: `${a} + ${f} = 10`, jumps: [],
      hint: `Quin és l'amic del 10 ${del(a)}?`,
      caps: [`Tens ${a} ${a === 1 ? 'nenúfar' : 'nenúfars'} amb flor.`, `${falten(f)} per omplir els 10.`, `${a} i ${f} són amics del 10.`] };
  }
  const sub = type > 6, sg = sub ? '−' : '+', ans = sub ? a - b : a + b, u = a % 10, t = (a - u) / 10;
  const p = { type, a, b, ans, sub, key: a + sg + b, lhs: `${a} ${sg} ${b} =`, rhs: '', eq: `${a} ${sg} ${b} = ${ans}`, jumps: [] };
  if (type === 2) return { ...p, nj: 2, pre: true, hint: '10 cubets fan una barra nova',
    caps: [`${a} són ${bar(t)} de deu i ${cub(u)}.`, `${b === 1 ? 'Arriba' : 'Arriben'} ${cub(b)} més: ara n'hi ha 10 de solts.`, `10 cubets fan una barra nova. ${cap(bar(t + 1))} són ${ans}.`] };
  if (type === 3) return { ...p, jumps: [{ to: ans, lab: '+10' }], hint: 'Només canvia la desena',
    caps: [`Sumar 10 és un salt gran.`, `La desena puja 1 i les unitats queden igual: ${ans}.`] };
  if (type === 4) {
    const k = 10 - b, far = a + 10;
    return { ...p, pre: true, jumps: [{ to: far, lab: '+10' }, { to: ans, lab: `−${k}` }], hint: `Suma 10 i torna enrere ${k}`,
      caps: [`${cap(el(b))} és gairebé 10.`, `Primer suma 10: arribes ${al(far)}.`, `Te n'has passat ${k}. Torna enrere ${k}: ${ans}.`] };
  }
  if (type === 5) {
    const T = Math.ceil(a / 10) * 10, c = T - a, r = b - c;
    return { ...p, pre: true, jumps: [{ to: T, lab: `+${c}` }, { to: ans, lab: `+${r}` }], hint: `Primer fins ${al(T)}, després el que queda ${del(b)}`,
      caps: [`Primer salta fins a la desena.`, `${cap(del(a))} fins ${al(T)} ${falten(c).toLowerCase()}.`, `${cap(el(b))} és ${c} i ${r}. Ja n'has fet ${c}, ${queden(r)}: ${ans}.`] };
  }
  if (type === 7) return { ...p, hint: `Si del 10 en treus ${b}, quants en queden?`,
    caps: [`Tens 10 nenúfars amb flor.`, b === 1 ? `Se'n va 1 flor.` : `Se'n van ${b} flors.`, `${cap(queden(ans))}. ${b} i ${ans} són amics del 10.`] };
  if (type === 8) return { ...p, nj: 2, pre: true, hint: `Trenca una barra i treu-ne ${b}`,
    caps: [`${a} són ${bar(t)} de deu, sense cap cubet solt.`, `Trenca una barra: ara tens 10 cubets solts.`, `Treu-ne ${b}: ${queden(10 - b)}. ${cap(bar(t - 1))} i ${cub(10 - b)} són ${ans}.`] };
  if (type === 9) return { ...p, jumps: [{ to: ans, lab: '−10' }], hint: 'Només canvia la desena',
    caps: [`Restar 10 és un salt gran enrere.`, `La desena baixa 1 i les unitats queden igual: ${ans}.`] };
  if (type === 10) {
    const k = 10 - b, far = a - 10;
    return { ...p, pre: true, jumps: [{ to: far, lab: '−10' }, { to: ans, lab: `+${k}` }], hint: `Resta 10 i torna endavant ${k}`,
      caps: [`${cap(el(b))} és gairebé 10.`, `Primer resta 10: arribes ${al(far)}.`, `N'has tret ${k} de més. Torna endavant ${k}: ${ans}.`] };
  }
  const T = a - u, r = b - u;
  return { ...p, pre: true, jumps: [{ to: T, lab: `−${u}` }, { to: ans, lab: `−${r}` }], hint: `Primer fins ${al(T)}, després el que queda ${del(b)}`,
    caps: [`Primer salta enrere fins a la desena.`, `${cap(del(a))} fins ${al(T)} n'hi ha ${u}.`, `${cap(el(b))} és ${u} i ${r}. Ja n'has tret ${u}, ${queden(r)}: ${ans}.`] };
}

// One section per trick: five for adding, then the five that mirror them for taking away. type is the trick's number in make,
// demo holds the operations the frog shows in the first level.
export const SECTIONS = [
  { type: 1, name: 'Amics del 10', tip: 'Cada número té un amic: junts fan 10.', demo: [[7], [6]] },
  { type: 2, name: 'Arribar a la desena', tip: 'Deu cubets fan una barra: una desena més.', demo: [[32, 8], [46, 4]] },
  { type: 3, name: 'Sumar 10', tip: 'Quan sumes 10, només canvia la desena.', demo: [[17, 10], [43, 10]] },
  { type: 4, name: 'Sumar 9 i 8', tip: 'Suma 10 i torna enrere 1 (o 2).', demo: [[17, 9], [35, 8]] },
  { type: 5, name: 'Passar per la desena', tip: 'Primer salta fins a la desena, després el que queda.', demo: [[27, 6], [48, 5]] },
  { type: 7, name: 'Treure del 10', tip: 'Si del 10 en treus un amic, queda l\'altre.', demo: [[10, 3], [10, 6]] },
  { type: 8, name: 'Trencar una desena', tip: 'Trenca una barra en 10 cubets i treu els que calgui.', demo: [[40, 6], [70, 3]] },
  { type: 9, name: 'Restar 10', tip: 'Quan restes 10, només canvia la desena.', demo: [[47, 10], [83, 10]] },
  { type: 10, name: 'Restar 9 i 8', tip: 'Resta 10 i torna endavant 1 (o 2).', demo: [[35, 9], [52, 8]] },
  { type: 11, name: 'Passar per la desena', tip: 'Primer salta enrere fins a la desena, després el que queda.', demo: [[33, 6], [52, 5]] }
];
export const PATH = 5;
// The ten levels of every section: n operations; pic keeps the picture on screen; tier is how big the numbers get;
// demo starts with the frog showing the trick; mix brings back tricks learnt before.
export const PLAN = [
  { kind: 'Mira el truc', n: 3, pic: true, tier: 0, demo: true },
  { kind: 'Amb dibuix', n: 4, pic: true, tier: 0 },
  { kind: 'Amb dibuix', n: 4, pic: true, tier: 1 },
  { kind: 'Amb dibuix', n: 5, pic: true, tier: 2 },
  { kind: 'De cap', n: 5, tier: 0 },
  { kind: 'De cap', n: 5, tier: 1 },
  { kind: 'De cap', n: 5, tier: 2 },
  { kind: 'De cap', n: 6, tier: 2 },
  { kind: 'Barreja', n: 6, tier: 2, mix: true },
  { kind: 'Repte final', n: 8, tier: 2, mix: true }
];
// per tier: the tens a sum or a subtraction may start in, and the numbers whose friend of 10 is asked
const TENS = [[1, 2], [1, 5], [1, 8]], DOWN = [[2, 3], [2, 5], [2, 9]];
const FRIENDS = [[9, 8, 5, 1, 2], [3, 4, 6, 7, 5, 8], [1, 2, 3, 4, 5, 6, 7, 8, 9]];
function gen(type, tier) {
  if (type === 1) return make(1, pick(FRIENDS[tier]));
  if (type === 7) return make(7, 10, pick(FRIENDS[tier]));
  const t = rnd(...(type > 6 ? DOWN : TENS)[tier]), near = tier < 2 ? 9 : pick([9, 9, 8]);
  if (type === 2) { const u = rnd(1, 9); return make(2, 10 * t + u, 10 - u); }
  if (type === 3) return make(3, 10 * t + rnd(1, 9), 10);
  if (type === 4) return make(4, 10 * t + rnd(1, 9), near);
  if (type === 5) { const u = rnd(4, 9); return make(5, 10 * t + u, rnd(Math.max(2, 11 - u), 7)); }
  if (type === 8) return make(8, 10 * t, rnd(1, 9));
  if (type === 9) return make(9, 10 * t + rnd(1, 9), 10);
  if (type === 10) return make(10, 10 * t + rnd(0, 7), near);
  const u = rnd(1, 6);
  return make(11, 10 * t + u, rnd(Math.max(2, u + 1), 7));
}
// The tricks a mixed level of this section brings back. A section of sums: the sums before it. A section of subtractions:
// the subtractions before it and the sums they mirror, so the sign has to be read; the first one only has the friends of 10.
function older(sec) {
  if (sec < PATH) return SECTIONS.slice(0, sec).map(s => s.type);
  const k = sec - PATH;
  return [...SECTIONS.slice(PATH, sec), ...SECTIONS.slice(0, Math.max(1, k))].map(s => s.type);
}
// the operations of one level, none repeated; in a mixed level every other one uses an older trick
export function sums(sec, idx) {
  const L = PLAN[idx], pool = older(sec), out = [], seen = new Set();
  for (let tries = 0; out.length < L.n; tries++) {
    const p = gen(L.mix && pool.length && out.length % 2 ? pick(pool) : SECTIONS[sec].type, L.tier);
    if (seen.has(p.key) && tries < 200) continue;
    seen.add(p.key); out.push(p);
  }
  return out;
}
// Progress read from storage: secs counts the levels done in each section. An older save kept 0 to 3 stars for each of twelve
// worlds (or six, before the subtractions); worlds 6 and 12 were the mixes, which are now the last levels of every section.
// A world with a star opened the next one, so it becomes a finished section.
export function load(d) {
  const p = { secs: SECTIONS.map(() => 0), so: true };
  if (!d || typeof d !== 'object') return p;
  if (Array.isArray(d.secs)) p.secs = p.secs.map((_, i) => Math.min(10, Math.max(0, d.secs[i] | 0)));
  else if (Array.isArray(d.stars)) p.secs = p.secs.map((_, i) => d.stars[i < PATH ? i : i + 1] > 0 ? 10 : 0);
  p.so = d.so !== false;
  return p;
}
// the first section of each path is always open; the others open when the one before them is done
export const opens = (secs, s) => s % PATH === 0 || secs[s - 1] >= 10;
