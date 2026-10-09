const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[rnd(0, arr.length - 1)];
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
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
// a number as it is written on screen: the ones below zero with a true minus sign
export const num = n => n < 0 ? `−${-n}` : `${n}`;
const sgn = n => n < 0 ? `−${-n}` : `+${n}`;
// the frog's way from a to a + d: when zero is in between it stops there first
function hop(a, d) {
  const to = a + d;
  return a * to < 0 ? [{ to: 0, lab: sgn(-a) }, { to, lab: sgn(to) }] : [{ to, lab: sgn(d) }];
}
// what the frog says after the first caption of a sum with a negative in it: one line per hop
const hopCaps = (a, d) => a * (a + d) < 0
  ? [`${a < 0 ? `De ${num(a)}` : cap(del(a))} fins al 0 n'hi ha ${Math.abs(a)}.`, `${cap(queden(Math.abs(a + d)))} per ${d < 0 ? 'baixar' : 'pujar'}: ${num(a + d)}.`]
  : [`Un salt de ${Math.abs(d)} ${d < 0 ? 'enrere' : 'endavant'}: ${num(a + d)}.`];

// The tricks, by number: 1 to 5 the first tricks for adding, 7 to 11 the same for taking away, 12 to 19 the tricks for bigger numbers
// and 20 to 24 the ones that go below zero. Each gives what make() needs of one problem:
//   ans the answer; lhs and rhs what is written before and after the answer box; jumps the frog's hops on the number line;
//   caps the trick told, one caption before the first move and one per move after it; hint one line for the levels with a picture;
//   viz the picture ('line' when it is not said); pre: the first hop is already drawn when the picture comes on screen;
//   from: where the frog starts when it is not a; gap: the answer is the hops added up, not the place the frog ends on;
//   traps: the wrong answers a child is likely to give, for «Caça l'errada».
const near = b => { const R = b >= 90 ? 100 : Math.ceil(b / 10) * 10; return [R, R - b]; };
const RULES = {
  1(a) {
    const f = 10 - a;
    return { ans: f, viz: 'frame', lhs: `${a} +`, rhs: '= 10', hint: `Quin és l'amic del 10 ${del(a)}?`,
      caps: [`Tens ${a} ${a === 1 ? 'nenúfar' : 'nenúfars'} amb flor.`, `${falten(f)} per omplir els 10.`, `${a} i ${f} són amics del 10.`] };
  },
  2(a, b) {
    const u = a % 10, t = (a - u) / 10;
    return { ans: a + b, viz: 'blocks', pre: true, hint: '10 cubets fan una barra nova',
      caps: [`${a} són ${bar(t)} de deu i ${cub(u)}.`, `${b === 1 ? 'Arriba' : 'Arriben'} ${cub(b)} més: ara n'hi ha 10 de solts.`, `10 cubets fan una barra nova. ${cap(bar(t + 1))} són ${a + b}.`] };
  },
  3(a) {
    return { ans: a + 10, jumps: [{ to: a + 10, lab: '+10' }], hint: 'Només canvia la desena', traps: [a + 1, a + 11],
      caps: [`Sumar 10 és un salt gran.`, `La desena puja 1 i les unitats queden igual: ${a + 10}.`] };
  },
  4(a, b) {
    const k = 10 - b, far = a + 10, ans = a + b;
    return { ans, pre: true, jumps: [{ to: far, lab: '+10' }, { to: ans, lab: `−${k}` }], hint: `Suma 10 i torna enrere ${k}`, traps: [far + k, far],
      caps: [`${cap(el(b))} és gairebé 10.`, `Primer suma 10: arribes ${al(far)}.`, `Te n'has passat ${k}. Torna enrere ${k}: ${ans}.`] };
  },
  5(a, b) {
    const T = Math.ceil(a / 10) * 10, c = T - a, r = b - c, ans = a + b;
    return { ans, pre: true, jumps: [{ to: T, lab: `+${c}` }, { to: ans, lab: `+${r}` }], hint: `Primer fins ${al(T)}, després el que queda ${del(b)}`, traps: [ans - 10, ans + 1],
      caps: [`Primer salta fins a la desena.`, `${cap(del(a))} fins ${al(T)} ${falten(c).toLowerCase()}.`, `${cap(el(b))} és ${c} i ${r}. Ja n'has fet ${c}, ${queden(r)}: ${ans}.`] };
  },
  7(a, b) {
    const ans = a - b;
    return { ans, sub: true, viz: 'frame', hint: `Si del 10 en treus ${b}, quants en queden?`,
      caps: [`Tens 10 nenúfars amb flor.`, b === 1 ? `Se'n va 1 flor.` : `Se'n van ${b} flors.`, `${cap(queden(ans))}. ${b} i ${ans} són amics del 10.`] };
  },
  8(a, b) {
    const t = a / 10, ans = a - b;
    return { ans, sub: true, viz: 'blocks', pre: true, hint: `Trenca una barra i treu-ne ${b}`, traps: [ans + 10, a - 10 + b],
      caps: [`${a} són ${bar(t)} de deu, sense cap cubet solt.`, `Trenca una barra: ara tens 10 cubets solts.`, `Treu-ne ${b}: ${queden(10 - b)}. ${cap(bar(t - 1))} i ${cub(10 - b)} són ${ans}.`] };
  },
  9(a) {
    return { ans: a - 10, sub: true, jumps: [{ to: a - 10, lab: '−10' }], hint: 'Només canvia la desena', traps: [a - 1, a - 11],
      caps: [`Restar 10 és un salt gran enrere.`, `La desena baixa 1 i les unitats queden igual: ${a - 10}.`] };
  },
  10(a, b) {
    const k = 10 - b, far = a - 10, ans = a - b;
    return { ans, sub: true, pre: true, jumps: [{ to: far, lab: '−10' }, { to: ans, lab: `+${k}` }], hint: `Resta 10 i torna endavant ${k}`, traps: [far - k, far],
      caps: [`${cap(el(b))} és gairebé 10.`, `Primer resta 10: arribes ${al(far)}.`, `N'has tret ${k} de més. Torna endavant ${k}: ${ans}.`] };
  },
  11(a, b) {
    const u = a % 10, T = a - u, r = b - u, ans = a - b;
    return { ans, sub: true, pre: true, jumps: [{ to: T, lab: `−${u}` }, { to: ans, lab: `−${r}` }], hint: `Primer fins ${al(T)}, després el que queda ${del(b)}`, traps: [ans + 10, T - 10 + r],
      caps: [`Primer salta enrere fins a la desena.`, `${cap(del(a))} fins ${al(T)} n'hi ha ${u}.`, `${cap(el(b))} és ${u} i ${r}. Ja n'has tret ${u}, ${queden(r)}: ${ans}.`] };
  },
  // doubles and near doubles: b is a or a + 1
  12(a, b) {
    const ans = a + b, twin = a === b;
    return { ans, viz: 'twin', hint: twin ? `El doble ${del(a)}` : `El doble ${del(a)} i 1 més`, traps: [ans + 1, ans - 1],
      caps: twin ? [`${a} + ${a} és un doble: dues files iguals.`, `Dues vegades ${a} fan ${ans}.`]
        : [`${a} + ${b} és gairebé un doble.`, `El doble ${del(a)}: ${a} + ${a} = ${2 * a}.`, `I 1 més: ${ans}.`] };
  },
  // the friend of 100
  13(a) {
    const u = a % 10, T = u ? a - u + 10 : a, c = T - a, r = 100 - T, ans = 100 - a, base = { ans, gap: true, lhs: `${a} +`, rhs: '= 100', traps: [ans + 10, ans - 10] };
    if (!c || !r) return { ...base, jumps: [{ to: 100, lab: `+${ans}` }], hint: c ? 'Fins a la desena' : 'Compta les desenes que falten',
      caps: c ? [`${cap(el(a))} ja és a prop del 100.`, `${falten(ans)} per arribar-hi.`] : [`${a} són ${a / 10} ${a === 10 ? 'desena' : 'desenes'}.`, `Per fer-ne 10 en ${10 - a / 10 === 1 ? 'falta 1' : `falten ${10 - a / 10}`}: ${ans}.`] };
    return { ...base, pre: true, jumps: [{ to: T, lab: `+${c}` }, { to: 100, lab: `+${r}` }], hint: 'Primer fins a la desena, després fins al 100',
      caps: [`Busca l'amic del 100 ${del(a)}.`, `Primer fins a la desena: ${falten(c).toLowerCase()} per arribar ${al(T)}.`, `${cap(del(T))} fins al 100 en falten ${r}. ${c} i ${r} fan ${ans}.`] };
  },
  // adding in pieces: the tens first, then the units
  14(a, b) {
    const ub = b % 10, tb = b - ub, ans = a + b;
    return { ans, pre: true, jumps: [{ to: a + tb, lab: `+${tb}` }, { to: ans, lab: `+${ub}` }], hint: `Primer les desenes ${del(b)}, després les unitats`, traps: [ans - 10, ans + 10],
      caps: [`Trenca ${el(b)} en ${tb} i ${ub}.`, `Primer les desenes: ${a} + ${tb} = ${a + tb}.`, `Després les unitats: ${a + tb} + ${ub} = ${ans}.`] };
  },
  15(a, b) {
    const ub = b % 10, tb = b - ub, ans = a - b;
    // the classic slip: the smaller digit taken from the bigger one whichever number it is in
    return { ans, sub: true, pre: true, jumps: [{ to: a - tb, lab: `−${tb}` }, { to: ans, lab: `−${ub}` }], hint: `Primer les desenes ${del(b)}, després les unitats`,
      traps: [Math.floor(a / 10) * 10 - tb + Math.abs(a % 10 - ub), ans + 10],
      caps: [`Trenca ${el(b)} en ${tb} i ${ub}.`, `Primer les desenes: ${a} − ${tb} = ${a - tb}.`, `Després les unitats: ${a - tb} − ${ub} = ${ans}.`] };
  },
  // 19, 29, 99: a round number and a small step back
  16(a, b) {
    const [R, k] = near(b), far = a + R, ans = a + b;
    return { ans, pre: true, jumps: [{ to: far, lab: `+${R}` }, { to: ans, lab: `−${k}` }], hint: `Suma ${R} i torna enrere ${k}`, traps: [far + k, far],
      caps: [`${cap(el(b))} és gairebé ${R}.`, `Primer suma ${R}: arribes ${al(far)}.`, `Te n'has passat ${k}. Torna enrere ${k}: ${ans}.`] };
  },
  17(a, b) {
    const [R, k] = near(b), far = a - R, ans = a - b;
    return { ans, sub: true, pre: true, jumps: [{ to: far, lab: `−${R}` }, { to: ans, lab: `+${k}` }], hint: `Resta ${R} i torna endavant ${k}`, traps: [far - k, far],
      caps: [`${cap(el(b))} és gairebé ${R}.`, `Primer resta ${R}: arribes ${al(far)}.`, `N'has tret ${k} de més. Torna endavant ${k}: ${ans}.`] };
  },
  // making one number round with a piece of the other
  18(a, b) {
    const c = 10 - a % 10, T = a + c, r = b - c, ans = a + b;
    return { ans, pre: true, jumps: [{ to: T, lab: `+${c}` }, { to: ans, lab: `+${r}` }], hint: `Fes rodó ${el(a)}: passa-li ${c} ${del(b)}`, traps: [ans - 10, T + b],
      caps: [`${cap(al(a))} li ${c === 1 ? 'falta 1' : `falten ${c}`} per ser ${T}.`, `Passa ${c} ${del(b)} ${al(a)}: ara és ${T}.`, `${cap(del(b))} ${queden(r)}. ${T} + ${r} = ${ans}.`] };
  },
  // two numbers that are close: the difference is the way from one to the other
  19(a, b) {
    const T = Math.ceil(b / 10) * 10, c = T - b, r = a - T, ans = a - b;
    return { ans, sub: true, gap: true, from: b, pre: true, jumps: [{ to: T, lab: `+${c}` }, { to: a, lab: `+${r}` }], hint: `Compta ${del(b)} fins ${al(a)}`, traps: [ans + 10, ans + 1],
      caps: [`${cap(el(a))} i ${el(b)} són a prop: compta de l'un a l'altre.`, `${cap(del(b))} fins ${al(T)}: ${c}.`, `${cap(del(T))} fins ${al(a)}: ${r}. ${c} + ${r} = ${ans}.`] };
  },
  // a − b with b the bigger one: through zero and on below it
  20(a, b) {
    const ans = a - b;
    return { ans, sub: true, pre: true, jumps: hop(a, -b), hint: `Primer fins al 0, després el que queda ${del(b)}`, traps: [-ans, a + b],
      caps: [`${cap(el(b))} és més gran que ${el(a)}: passaràs per sota del zero.`, `${cap(del(a))} fins al 0 n'hi ha ${a}.`, `${cap(del(b))} ${queden(b - a)} per baixar: ${num(ans)}.`] };
  },
  // a is below zero and b takes it above
  21(a, b) {
    const ans = a + b;
    return { ans, pre: true, jumps: hop(a, b), hint: `Primer fins al 0, després el que queda ${del(b)}`, traps: [-ans, b - a],
      caps: [`Comences a ${num(a)}, sota zero, i puges ${b}.`, `De ${num(a)} fins al 0 n'hi ha ${-a}.`, `${cap(del(b))} ${queden(ans)} per pujar: ${ans}.`] };
  },
  // a is below zero and stays there: d is how far it goes, down (below zero itself) or up
  22(a, d) {
    const ans = a + d, A = -a, D = Math.abs(d), down = d < 0;
    return { ans, sub: down, lhs: `${num(a)} ${down ? '−' : '+'} ${D} =`, jumps: hop(a, d), hint: down ? "Suma'ls i posa-hi el menys" : "Resta'ls i posa-hi el menys", traps: [-ans, a - d, d - a],
      caps: down ? [`Ja ets sota zero, a ${num(a)}, i baixes ${D} més.`, `Baixar t'allunya del 0: ${A} + ${D} = ${A + D}, amb el menys: ${num(ans)}.`]
        : [`Ets a ${num(a)} i puges ${D}, però no arribes al 0.`, `Et quedes sota zero: ${A} − ${D} = ${A - D}, amb el menys: ${num(ans)}.`] };
  },
  // adding a negative is taking away
  23(a, b) {
    const ans = a - b, j = hop(a, -b);
    return { ans, pre: j.length > 1, lhs: `${num(a)} + (−${b}) =`, jumps: j, hint: `Sumar un negatiu és restar: ${num(a)} − ${b}`, traps: [a + b, -ans, b - a],
      caps: [`Més i menys seguits fan menys: ${num(a)} + (−${b}) és ${num(a)} − ${b}.`, ...hopCaps(a, -b)] };
  },
  // taking away a negative is adding
  24(a, b) {
    const ans = a + b, j = hop(a, b);
    return { ans, sub: true, pre: j.length > 1, lhs: `${num(a)} − (−${b}) =`, jumps: j, hint: `Restar un negatiu és sumar: ${num(a)} + ${b}`, traps: [a - b, -ans, b - a],
      caps: [`Dos menys seguits fan un més: ${num(a)} − (−${b}) és ${num(a)} + ${b}.`, ...hopCaps(a, b)] };
  }
};
// One problem of a trick, complete: key tells it from the others of its level and eq is the whole operation with its answer
export function make(type, a, b) {
  const r = RULES[type](a, b), p = { type, a, b, jumps: [], rhs: '', viz: 'line', lhs: `${num(a)} ${r.sub ? '−' : '+'} ${b} =`, ...r };
  p.key = `${type}:${a}:${b}`; p.eq = `${p.lhs} ${num(p.ans)}${p.rhs && ' ' + p.rhs}`;
  return p;
}

// One project per trick, in the order of the cursus. type is the trick's number in RULES, sub the line under its name on the map,
// tip what the frog says before showing it, and demo the operations it shows in the first level.
export const PROJECTS = [
  { type: 1, name: 'Amics del 10', sub: 'Dos números que junts fan 10', tip: 'Cada número té un amic: junts fan 10.', demo: [[7], [6]] },
  { type: 7, name: 'Treure del 10', sub: "Del 10 en treus un amic i queda l'altre", tip: "Si del 10 en treus un amic, queda l'altre.", demo: [[10, 3], [10, 6]] },
  { type: 12, name: 'Dobles i gairebé dobles', sub: '6 + 6, i 6 + 7 que és 1 més', tip: 'Un doble són dues files iguals. Un gairebé doble és un doble i 1 més.', demo: [[6, 6], [7, 8]] },
  { type: 2, name: 'Arribar a la desena', sub: 'Deu cubets fan una barra', tip: 'Deu cubets fan una barra: una desena més.', demo: [[32, 8], [46, 4]] },
  { type: 8, name: 'Trencar una desena', sub: 'Una barra es trenca en 10 cubets', tip: 'Trenca una barra en 10 cubets i treu els que calgui.', demo: [[40, 6], [70, 3]] },
  { type: 3, name: 'Sumar 10', sub: 'Un salt gran endavant', tip: 'Quan sumes 10, només canvia la desena.', demo: [[17, 10], [43, 10]] },
  { type: 9, name: 'Restar 10', sub: 'Un salt gran enrere', tip: 'Quan restes 10, només canvia la desena.', demo: [[47, 10], [83, 10]] },
  { type: 4, name: 'Sumar 9 i 8', sub: 'Suma 10 i torna enrere', tip: 'Suma 10 i torna enrere 1 (o 2).', demo: [[17, 9], [35, 8]] },
  { type: 10, name: 'Restar 9 i 8', sub: 'Resta 10 i torna endavant', tip: 'Resta 10 i torna endavant 1 (o 2).', demo: [[35, 9], [52, 8]] },
  { type: 5, name: 'Passar la desena sumant', sub: 'Fins a la desena i el que queda', tip: 'Primer salta fins a la desena, després el que queda.', demo: [[27, 6], [48, 5]] },
  { type: 11, name: 'Passar la desena restant', sub: 'Enrere fins a la desena i el que queda', tip: 'Primer salta enrere fins a la desena, després el que queda.', demo: [[33, 6], [52, 5]] },
  { type: 13, name: 'Amics del 100', sub: 'Dos números que junts fan 100', tip: 'Primer salta fins a la desena, després fins al 100.', demo: [[70], [37]] },
  { type: 14, name: 'Sumar a trossos', sub: 'Primer les desenes, després les unitats', tip: 'Trenca el segon número: suma primer les desenes i després les unitats.', demo: [[34, 25], [47, 36]] },
  { type: 15, name: 'Restar a trossos', sub: 'Primer les desenes, després les unitats', tip: 'Trenca el segon número: resta primer les desenes i després les unitats.', demo: [[68, 25], [52, 38]] },
  { type: 16, name: 'Sumar 19, 29 i 99', sub: 'Suma el número rodó i torna enrere', tip: 'Suma el número rodó que hi ha al costat i torna enrere 1 (o 2).', demo: [[34, 19], [45, 99]] },
  { type: 17, name: 'Restar 19, 29 i 99', sub: 'Resta el número rodó i torna endavant', tip: 'Resta el número rodó que hi ha al costat i torna endavant 1 (o 2).', demo: [[53, 19], [146, 99]] },
  { type: 18, name: 'Fer números rodons', sub: '48 + 27 és el mateix que 50 + 25', tip: "Fes rodó un número amb un tros de l'altre: la suma és la mateixa i és més fàcil.", demo: [[48, 27], [39, 25]] },
  { type: 19, name: 'Restar comptant endavant', sub: 'Quan els dos números són a prop', tip: "Si dos números són a prop, restar és comptar de l'un a l'altre.", demo: [[52, 48], [73, 67]] },
  { type: 20, name: 'Passar pel zero', sub: '3 − 7: fins al 0 i més avall', tip: 'Baixa fins al 0 i continua per sota: els números de sota zero porten un menys al davant.', demo: [[3, 7], [5, 9]] },
  { type: 21, name: 'Sortir de sota zero', sub: '−4 + 9: fins al 0 i més amunt', tip: 'Des de sota zero, puja fins al 0 i continua amb el que queda.', demo: [[-4, 9], [-6, 8]] },
  { type: 22, name: 'Sempre sota zero', sub: '−3 − 5 i −8 + 3', tip: "Sota zero, baixar t'allunya del 0 i pujar t'hi acosta. El resultat porta el menys.", demo: [[-3, -5], [-8, 3]] },
  { type: 23, name: 'Sumar un negatiu', sub: '6 + (−4) és 6 − 4', tip: 'Sumar un número negatiu és el mateix que restar.', demo: [[6, 4], [3, 7]] },
  { type: 24, name: 'Restar un negatiu', sub: '6 − (−4) és 6 + 4', tip: 'Restar un número negatiu és el mateix que sumar: dos menys seguits fan un més.', demo: [[6, 4], [-3, 8]] }
];
// The ten levels of every project: n operations; pic keeps the picture on screen; tier is how big the numbers get;
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
// the numbers next to a round one that are added and taken away
const ROUND = [[19], [19, 29, 39], [19, 29, 49, 99, 98, 18, 28]];
// a number of two digits with its tens from t0 to t1 and its units from u0 to u1
const two = (t0, t1, u0 = 1, u1 = 9) => 10 * rnd(t0, t1) + rnd(u0, u1);
const GEN = {
  12(tier) { const a = tier < 2 ? rnd(2 + tier, 9) : rnd(6, 15); return make(12, a, a + (tier === 1 ? 1 : tier === 2 ? rnd(0, 1) : 0)); },
  13(tier) { return make(13, tier === 0 ? 10 * rnd(1, 9) : tier === 1 ? 10 * rnd(1, 8) + 5 : two(1, 8)); },
  // without carrying in the first two tiers
  14(tier) {
    if (tier === 2) return make(14, two(1, 5), two(1, 3));
    const u = rnd(1, 7);
    return make(14, 10 * rnd(1, 3 + tier) + u, 10 * rnd(1, 2 + tier) + rnd(1, 9 - u));
  },
  15(tier) {
    const b = two(1, 2 + tier), u = tier === 2 ? rnd(0, 9) : rnd(b % 10, 9);
    return make(15, b - b % 10 + 10 * rnd(1, 3 + tier) + (tier === 2 ? 10 : 0) + u, b);
  },
  16(tier) { return make(16, two(1, 3 + 2 * tier), pick(ROUND[tier])); },
  17(tier) { const b = pick(ROUND[tier]), R = near(b)[0]; return make(17, R + two(1, 3 + tier, 0, 9), b); },
  18(tier) { return make(18, 10 * rnd(1, 4 + tier) + rnd(9 - tier, 9), rnd(11 + tier, 25 + 6 * tier)); },
  19(tier) { const T = 10 * rnd(2, 5 + 2 * tier); return make(19, T + rnd(1 + tier, [3, 5, 12][tier]), T - rnd(1, 2 + tier + (tier > 0))); },
  20(tier) { const a = [rnd(1, 5), rnd(2, 9), rnd(5, 20)][tier]; return make(20, a, a + rnd(1, [5, 9, 15][tier])); },
  21(tier) { const a = [rnd(1, 5), rnd(2, 9), rnd(5, 20)][tier]; return make(21, -a, a + rnd(1, [5, 9, 15][tier])); },
  // the first tier only goes down; after it, half of them come up without reaching zero
  22(tier) {
    const a = [rnd(1, 5), rnd(2, 9), rnd(5, 20)][tier];
    return tier && a > 1 && rnd(0, 1) ? make(22, -a, rnd(1, a - 1)) : make(22, -a, -rnd(1, [5, 9, 12][tier]));
  },
  // above zero all the way, then through zero, then from below zero too
  23(tier) {
    if (tier === 0) { const a = rnd(3, 12); return make(23, a, rnd(1, a - 1)); }
    if (tier === 2 && rnd(0, 1)) return make(23, -rnd(1, 10), rnd(1, 9));
    const a = rnd(1, 9); return make(23, a, a + rnd(1, 8));
  },
  24(tier) {
    if (tier === 0) return make(24, rnd(1, 9), rnd(1, 9));
    const a = rnd(1, 4 + 4 * tier), b = rnd(1, 15);
    return a === b ? make(24, -a, b + 1) : make(24, -a, b);
  }
};
function gen(type, tier) {
  if (GEN[type]) return GEN[type](tier);
  if (type === 1) return make(1, pick(FRIENDS[tier]));
  if (type === 7) return make(7, 10, pick(FRIENDS[tier]));
  const t = rnd(...(type > 6 ? DOWN : TENS)[tier]), nine = tier < 2 ? 9 : pick([9, 9, 8]);
  if (type === 2) { const u = rnd(1, 9); return make(2, 10 * t + u, 10 - u); }
  if (type === 3) return make(3, 10 * t + rnd(1, 9), 10);
  if (type === 4) return make(4, 10 * t + rnd(1, 9), nine);
  if (type === 5) { const u = rnd(4, 9); return make(5, 10 * t + u, rnd(Math.max(2, 11 - u), 7)); }
  if (type === 8) return make(8, 10 * t, rnd(1, 9));
  if (type === 9) return make(9, 10 * t + rnd(1, 9), 10);
  if (type === 10) return make(10, 10 * t + rnd(0, 7), nine);
  const u = rnd(1, 6);
  return make(11, 10 * t + u, rnd(Math.max(2, u + 1), 7));
}
// n different problems, each of the trick types() gives at that moment
function draw(n, tier, type) {
  const out = [], seen = new Set();
  for (let tries = 0; out.length < n; tries++) {
    const p = gen(type(out.length), tier);
    if (seen.has(p.key) && tries < 200) continue;
    seen.add(p.key); out.push(p);
  }
  return out;
}
// the tricks a mixed level of project i brings back: the four projects before it
const older = i => PROJECTS.slice(Math.max(0, i - 4), i).map(s => s.type);
// the operations of one level, none repeated; in a mixed level every other one uses an older trick
export function sums(i, idx) {
  const L = PLAN[idx], pool = older(i);
  return draw(L.n, L.tier, k => L.mix && pool.length && k % 2 ? pick(pool) : PROJECTS[i].type);
}

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the other games of the pond: a Piscina to get in, a map of six circles,
// a mark for each project, an exam for each circle, XP and badges.
export const CIRCLES = [
  { name: 'Els amics del 10', projects: [0, 1, 2] },
  { name: 'Desenes senceres', projects: [3, 4, 5, 6] },
  { name: 'Salts amb truc', projects: [7, 8, 9, 10] },
  { name: 'Números grans', projects: [11, 12, 13] },
  { name: 'Trucs de mag', projects: [14, 15, 16, 17] },
  { name: 'Sota zero', projects: [18, 19, 20, 21, 22] }
];
export const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
// the circle whose answers can be below zero: its keypad has a key for the minus sign
export const NEG = 5;
// the three operations of the Piscina, the first challenges
export const pool = () => [make(1, 6), make(7, 10, 3), make(12, 4, 4)];
// slips are the operations of a level answered after a miss or with a hint
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
// What a level gives to the mark of its project, by its stars: 10 with no slip, 8 with one or two, 5 with more. Ten levels make 100,
// and a project is validated with 80
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;
// the seconds of a lightning round
export const RAPID = 60;

// What is saved is facts only: { so, lv[230], piscina, exams[6], fulls, rapid, ratxa, mosques }. lv is the best stars of each level,
// rapid the most right answers in a lightning round, ratxa the longest run of right answers and mosques the flies caught (one per
// operation answered at the first try). Marks, XP, level and badges are worked out, never stored.
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// Before the cursus the game had ten sections of ten levels and kept how many levels of each were done in `secs`, with no stars:
// each section is now the project at this place, and a level done then is worth two stars, so a finished section is a validated project
const OLD = [0, 3, 5, 7, 9, 1, 4, 6, 8, 10], KEPT = 2;
// A complete progress inside its limits from any value at all; a new object. It only ever raises: whoever played before the cursus
// keeps those levels and has the Piscina done. A save older still kept 0 to 3 stars for each of twelve worlds (worlds 6 and 12 were
// the mixes): a world with a star is a finished section
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {}, lv = slots(o.lv, PROJECTS.length * 10).map(s => within(s, 3));
  const secs = Array.isArray(o.secs) ? slots(o.secs, 10).map(n => within(n, 10)) : slots(o.stars, 12).filter((_, i) => i % 6 < 5).map(n => whole(n) > 0 ? 10 : 0);
  OLD.forEach((p, s) => { for (let i = 0; i < secs[s]; i++) lv[p * 10 + i] = Math.max(lv[p * 10 + i], KEPT); });
  return { so: o.so !== false, lv, piscina: o.piscina === true || lv.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), rapid: Math.max(0, whole(o.rapid)), ratxa: Math.max(0, whole(o.ratxa)), mosques: Math.max(0, whole(o.mosques)) };
}
const copy = p => ({ ...p, lv: p.lv.slice(), exams: p.exams.slice() });
// the functions below take a progress that is already clean
export const noteOf = (p, i) => p.lv.slice(i * 10, i * 10 + 10).reduce((s, n) => s + POINTS[n], 0);
// how many levels of a project are done from the first on: the one after them is the next to open
export const reached = (p, i) => { const k = p.lv.slice(i * 10, i * 10 + 10).findIndex(n => n === 0); return k < 0 ? 10 : k; };
export const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
// the projects with at least one level done
export const begun = p => PROJECTS.flatMap((_, i) => p.lv[i * 10] > 0 ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// Circle 0 opens with the Piscina and the others with the exam before them. A circle with a level done is open too: before the
// cursus the sums and the subtractions were two separate paths, and nobody is shut out of where they already were
export const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length
  && (isOpen(p, c - 1) && p.exams[c - 1] === true || CIRCLES[c].projects.some(i => p.lv[i * 10] > 0));
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer salt', what: 'Valida un projecte.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 15', what: 'Encerta 15 operacions seguides a la primera.' },
  { name: 'Caçamosques', what: 'Caça 100 mosques.' },
  { name: 'Cinc-centes mosques', what: 'Caça 500 mosques.' },
  { name: 'El 10 dominat', what: 'Valida els tres projectes del cercle 0.' },
  { name: 'Sota l\'aigua', what: 'Valida un projecte de sota zero.' },
  { name: 'Ull de falcó', what: "Troba bé les errades d'un full." },
  { name: 'Deu fulls', what: "Corregeix bé deu fulls d'errades." },
  { name: 'Llampec', what: 'Encerta 20 operacions en un repte llampec.' },
  { name: 'Cursus complet', what: 'Supera els sis exàmens.' }
];
export const badges = p => [p.piscina === true, validated(p).length > 0, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 15,
  p.mosques >= 100, p.mosques >= 500, CIRCLES[0].projects.every(i => noteOf(p, i) >= VALID), CIRCLES[NEG].projects.some(i => noteOf(p, i) >= VALID),
  p.fulls >= 1, p.fulls >= 10, p.rapid >= 20, p.exams.every(e => e === true)];
const earned = (p, next) => { const had = badges(p), now = badges(next); return BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name); };

// A level done, with its slips. Returns { prog, n, note, gain, valid, exam, news }: prog is a NEW progress that keeps the best stars
// of the level; n the stars of this time; note the mark of the project after it; gain the XP it adds; valid whether the project is
// validated by this very level, and exam whether that opens the exam of its circle; news the badges it earns
export function levelIn(p, i, idx, slips) {
  const n = starsFor(slips), k = i * 10 + idx, next = copy(p), c = circleOf(i);
  next.lv[k] = Math.max(next.lv[k], n);
  return { prog: next, n, note: noteOf(next, i), gain: xpOf(next) - xpOf(p), valid: noteOf(p, i) < VALID && noteOf(next, i) >= VALID,
    exam: !examOpen(p, c) && examOpen(next, c), news: earned(p, next) };
}
// the Piscina done. Returns { prog, news }
export function poolIn(p) { const next = { ...copy(p), piscina: true }; return { prog: next, news: earned(p, next) }; }
// a run of n right answers in a row, and the right answers of a lightning round: each keeps the best. Returns { prog, best, news }
const keep = field => (p, n) => { const next = copy(p), best = whole(n) > p[field]; if (best) next[field] = whole(n); return { prog: next, best, news: earned(p, next) }; };
export const streakIn = keep('ratxa');
export const rapidIn = keep('rapid');
// n flies more. Returns { prog, news }
export function fliesIn(p, n) { const next = copy(p); next.mosques += Math.max(0, whole(n)); return { prog: next, news: earned(p, next) }; }

/* ---------- the exam, the lightning round and «Caça l'errada» ---------- */
// Six different operations of the projects of circle c, new every time, at least one of each project, in a random order;
// each has proj, its project
export function exam(c) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, from = shuffle([...ps, ...Array.from({ length: 6 - ps.length }, () => pick(ps))]);
  return draw(6, 2, k => PROJECTS[from[k]].type).map((q, k) => ({ ...q, proj: from[k] }));
}
// The hand-in of a finished exam: qs its six operations and run one boolean per operation. Returns { prog, good, score, gain, redo, news }:
// prog is a NEW progress with exams[c] set when the exam passes (EXAM_PASS of 6, the exam open), never taken back; redo the projects of the ones missed
export function examIn(p, c, qs, run) {
  const score = run.filter(r => r === true).length, good = run.length === 6 && score >= EXAM_PASS && examOpen(p, c), next = copy(p);
  if (good) next.exams[c] = true;
  return { prog: next, good, score, gain: xpOf(next) - xpOf(p), news: earned(p, next),
    redo: [...new Set(qs.flatMap((q, i) => run[i] !== true ? [q.proj] : []))].sort((a, b) => a - b) };
}
// The n operations of a lightning round: the tricks of circle 0 and of every project begun, without the ones below zero (their answer
// needs one key more); never the same twice in a row
export function sprint(p, n = 80) {
  const types = [...new Set([...CIRCLES[0].projects, ...begun(p).filter(i => circleOf(i) !== NEG)])].map(i => PROJECTS[i].type), out = [];
  while (out.length < n) { const q = gen(pick(types), rnd(0, 1)); if (out[out.length - 1]?.key !== q.key) out.push(q); }
  return out;
}
// A sheet: three operations of three different projects, each written with an answer; from 0 to 2 of the answers are wrong (never all
// three), in any place. Each is { q, says, real, opts }: says is the answer on the sheet, real the true one, opts the three to choose
// from when fixing it. The wrong ones are the slips that teach: the step back taken forwards, the ten forgotten, the minus sign lost.
// all: draw from every project, not only from the ones begun
export function sheet(p, all) {
  const known = all ? PROJECTS.map((_, i) => i) : begun(p), from = shuffle(known.length >= 3 ? known.slice() : [0, 1, 2]).slice(0, 3);
  const bads = new Set(shuffle([0, 1, 2]).slice(0, pick([0, 1, 1, 2, 2])));
  return from.map((i, k) => {
    const q = gen(PROJECTS[i].type, 1), low = circleOf(i) === NEG;
    const wrong = [...new Set([...(q.traps || []), q.ans + 1, q.ans - 1, q.ans + 10, q.ans - 10])].filter(v => v !== q.ans && (low || v >= 0)).slice(0, 2);
    return { q, proj: i, says: bads.has(k) ? pick(wrong) : q.ans, real: q.ans, opts: [q.ans, ...wrong].sort((x, y) => x - y) };
  });
}
// The hand-in of a finished sheet: run has one boolean per operation. Returns { prog, good, gain, missed, news }: prog is a NEW progress
// with fulls + 1 only when all three are right; gain the XP that adds (0 once the cap of 3 per validated project is reached)
export function sheetIn(p, run) {
  const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3, next = copy(p);
  if (good) next.fulls = p.fulls + 1;
  return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: earned(p, next) };
}
