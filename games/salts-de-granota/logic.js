export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[rnd(0, arr.length - 1)];
// Catalan articles elide before 1 (u) and 11 (onze)
const vow = n => n === 1 || n === 11;
const el = n => vow(n) ? `l'${n}` : `el ${n}`;
const del = n => vow(n) ? `de l'${n}` : `del ${n}`;
const al = n => vow(n) ? `a l'${n}` : `al ${n}`;
export const cap = s => s[0].toUpperCase() + s.slice(1);
export const bar = n => n === 1 ? '1 barra' : `${n} barres`;
export const cub = n => n === 1 ? '1 cubet' : `${n} cubets`;
const falten = n => n === 1 ? 'En falta 1' : `En falten ${n}`;
const queden = n => n === 1 ? 'en queda 1' : `en queden ${n}`;

// One problem of a trick. Types 1 to 5 are the tricks for adding (worlds 1 to 5) and 7 to 11 the same tricks for taking away
// (worlds 7 to 11). lhs and rhs are what is written before and after the answer box; jumps are the frog's hops on the number line;
// caps narrate the trick, one caption per hop after the first; pre means the first hop is already drawn when the child answers.
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

// worlds 6 and 12 mix the tricks: 6 the ones for adding, 12 all of them
function gen(w) {
  if (w === 1) return make(1, rnd(1, 9));
  if (w === 2) { const u = rnd(1, 9); return make(2, 10 * rnd(1, 8) + u, 10 - u); }
  if (w === 3) return make(3, rnd(11, 89), 10);
  if (w === 4) return make(4, 10 * rnd(1, 8) + rnd(1, 9), pick([9, 9, 8]));
  if (w === 5) { const u = rnd(4, 9); return make(5, 10 * rnd(1, 8) + u, rnd(Math.max(2, 11 - u), 7)); }
  if (w === 6) return gen(rnd(2, 5));
  if (w === 7) return make(7, 10, rnd(1, 9));
  if (w === 8) return make(8, 10 * rnd(2, 9), rnd(1, 9));
  if (w === 9) return make(9, rnd(21, 99), 10);
  if (w === 10) return make(10, 10 * rnd(2, 9) + rnd(0, 7), pick([9, 9, 8]));
  if (w === 11) { const u = rnd(1, 6); return make(11, 10 * rnd(2, 9) + u, rnd(Math.max(2, u + 1), 7)); }
  return gen(pick([2, 3, 4, 5, 8, 9, 10, 11]));
}

export function round(w, n) {
  const out = [], seen = new Set();
  for (let tries = 0; out.length < n; tries++) {
    const p = gen(w);
    if (seen.has(p.key) && tries < 200) continue;
    seen.add(p.key); out.push(p);
  }
  return out;
}

export const starsFor = fast => fast >= 9 ? 3 : fast >= 7 ? 2 : fast >= 5 ? 1 : 0;

// six worlds of sums, then six of subtractions that mirror them
export const WORLDS = [
  { name: 'Amics del 10', ex: '7 + ? = 10', tip: 'Cada número té un amic: junts fan 10.', secs: 6, demo: [[7], [6]] },
  { name: 'Arribar a la desena', ex: '32 + 8', tip: 'Deu cubets fan una barra: una desena més.', secs: 8, demo: [[32, 8], [46, 4]] },
  { name: 'Sumar 10', ex: '17 + 10', tip: 'Quan sumes 10, només canvia la desena.', secs: 8, demo: [[17, 10], [43, 10]] },
  { name: 'Sumar 9 i 8', ex: '17 + 9', tip: 'Suma 10 i torna enrere 1 (o 2).', secs: 12, demo: [[17, 9], [35, 8]] },
  { name: 'Passar per la desena', ex: '27 + 6', tip: 'Primer salta fins a la desena, després el que queda.', secs: 12, demo: [[27, 6], [48, 5]] },
  { name: 'Barreja', ex: 'totes les sumes', tip: 'Tria el truc que millor et vagi.', secs: 12 },
  { name: 'Treure del 10', ex: '10 − 3', tip: 'Si del 10 en treus un amic, queda l\'altre.', secs: 6, demo: [[10, 3], [10, 6]] },
  { name: 'Trencar una desena', ex: '40 − 6', tip: 'Trenca una barra en 10 cubets i treu els que calgui.', secs: 8, demo: [[40, 6], [70, 3]] },
  { name: 'Restar 10', ex: '47 − 10', tip: 'Quan restes 10, només canvia la desena.', secs: 8, demo: [[47, 10], [83, 10]] },
  { name: 'Restar 9 i 8', ex: '35 − 9', tip: 'Resta 10 i torna endavant 1 (o 2).', secs: 12, demo: [[35, 9], [52, 8]] },
  { name: 'Passar per la desena', ex: '33 − 6', tip: 'Primer salta enrere fins a la desena, després el que queda.', secs: 12, demo: [[33, 6], [52, 5]] },
  { name: 'Gran barreja', ex: 'sumes i restes', tip: 'Mira bé el signe i tria el truc.', secs: 12 }
];
export const NOUN = w => w < 7 ? ['suma', 'sumes'] : w < 12 ? ['resta', 'restes'] : ['operació', 'operacions'];
