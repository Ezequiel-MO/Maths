// A Chinese abacus. Each rod has five earth beads under the beam, worth 1 each, and one heaven bead over it, worth 5.
// A bead only counts while it touches the beam. A rod is { lo, hi }: how many earth beads are up and whether the heaven bead is down (1 or 0).
// rods[0] is the units. A rod can hold up to 10: a full rod is exchanged for one earth bead on its left.
export const rodVal = r => r.lo + 5 * r.hi;
export const valueOf = rods => rods.reduce((a, r, p) => a + rodVal(r) * 10 ** p, 0);
// the tidy way to show a number: no rod with five earth beads up
export const tidy = rods => rods.every(r => r.lo < 5);
export const write = (v, n) => Array.from({ length: n }, (_, p) => { const d = Math.floor(v / 10 ** p) % 10; return { lo: d % 5, hi: d >= 5 ? 1 : 0 }; });
// touching a bead moves it together with the ones between it and the beam; j counts the beads of a deck from the beam
export function tap(rods, p, deck, j) { const out = rods.map(r => ({ ...r })); out[p][deck] = j < out[p][deck] ? j : j + 1; return out; }

// q is a number to write or an operation read from left to right ('x' times, ':' divided by; these two only come first).
// The abacus starts on the first number when beads are added to it or taken from it, and empty otherwise.
// stages are the values to pass through on the way to the result: they keep the hints on the method instead of on the answer.
export function plan(q) {
  const t = String(q).split(/([+\-x:])/), a = +t[0], stages = [];
  if (t.length === 1) return { start: 0, stages: [a], goal: a };
  // the digits of v times k, from the highest place down, as running totals
  const parts = (v, k) => [...String(v)].map((d, i, all) => d * 10 ** (all.length - 1 - i) * k).filter(Boolean).map((s => x => s += x)(0));
  let acc = a;
  for (let i = 1; i < t.length; i += 2) {
    const op = t[i], b = +t[i + 1];
    if (op === '+') stages.push(acc += b);
    else if (op === '-') stages.push(acc -= b);
    else if (op === ':') stages.push(...parts(acc /= b, 1));
    else {
      // two digits of the tables, on their own: add the bigger one as many times as the smaller says. Otherwise, one product per digit.
      const big = Math.max(acc, b), small = Math.min(acc, b);
      stages.push(...(big < 10 && t.length === 3 ? Array.from({ length: small }, (_, k) => big * (k + 1)) : parts(big, small)));
      acc *= b;
    }
  }
  return { start: '+-'.includes(t[1]) ? a : 0, stages, goal: acc };
}

// One touch towards target, the way the abacus is worked: from the highest column down, adding or taking what is missing.
// Returns { p, deck, to, why } (set rods[p][deck] to `to`), or null when the abacus shows target in its tidy form. why is
// 'add' or 'take' for a plain move, 'five' and 'ten' for the two exchanges, 'borrow' for taking one from a higher column,
// 'more' or 'less' for the trick with the heaven bead: adding d as 5 - (5 - d), or taking it the same way, and 'carry' for
// adding d where it does not fit, as 10 - (10 - d). The tricks start with the earth beads, so the column never goes past
// what it needs and the next hint finds the 5 or the 10 still to be moved.
export function nextMove(rods, target) {
  const diff = target - valueOf(rods), n = rods.length;
  if (!diff) {
    const p = rods.findIndex(r => r.lo === 5);
    if (p < 0) return null;
    // a full column becomes one earth bead on the left: the heaven bead goes first, and the five earth beads follow below
    return rods[p].hi ? { p, deck: 'hi', to: 0, why: 'ten' } : { p, deck: 'lo', to: 0, why: 'five' };
  }
  const abs = Math.abs(diff), p = Math.min(String(abs).length - 1, n - 1), d = Math.min(10, Math.floor(abs / 10 ** p)), r = rods[p];
  if (diff > 0) {
    const v = rodVal(r), k = 10 - d;
    if (v + d < 10 || (v + d === 10 && r.lo < 5)) {
      if (d >= 5 && !r.hi) return { p, deck: 'hi', to: 1, why: 'add' };
      // the fifth earth bead only goes up to complete a five or to fill the column
      if (r.lo + d <= 5) return { p, deck: 'lo', to: r.lo + d, why: 'add' };
      return { p, deck: 'lo', to: r.lo + d - 5, why: 'more', d };
    }
    // it does not fit: take 10 - d from this column, and the next move puts one bead on the left
    if (!r.hi) return { p, deck: 'lo', to: r.lo - k, why: k === 5 ? 'ten' : 'carry', d };
    // not enough earth beads to take: add the ones over five first, and then the five is the one that does not fit
    if (k < 5 && r.lo < k) return { p, deck: 'lo', to: r.lo + d - 5, why: 'add' };
    return k % 5 ? { p, deck: 'lo', to: r.lo - k % 5, why: 'carry', d } : { p, deck: 'hi', to: 0, why: 'carry', d };
  }
  const take = (p, d, why) => {
    const r = rods[p];
    if (d >= 5 && r.hi) return { p, deck: 'hi', to: r.hi - 1, why };
    if (d <= r.lo) return { p, deck: 'lo', to: r.lo - d, why };
    if (d < 5 && r.hi) return why === 'take' ? { p, deck: 'lo', to: r.lo + 5 - d, why: 'less', d } : { p, deck: 'hi', to: r.hi - 1, why };
  };
  let m = take(p, d, 'take');
  // not enough on this column: one from the nearest column on the left that has something
  for (let q = p + 1; !m && q < n; q++) m = take(q, 1, 'borrow');
  // nothing on the left either, so a column on the right is overfull: empty that one
  for (let q = p - 1; !m && q >= 0; q--) if (rodVal(rods[q])) m = take(q, Math.min(9, rodVal(rods[q])), 'take');
  return m;
}

// Six sections of ten levels. A level asks for q (see plan) or, with read, shows a number to be picked among opts.
// show keeps the value of each column written under it.
export const SECTIONS = [
  { name: "Coneix l'àbac", sub: "Llegeix i escriu nombres", levels: [
    { name: "Les boles de baix", q: '3', show: 1,
      tip: "Cada bola de baix val 1, però només compta quan toca la barra del mig. Toca una bola per pujar-la. Quan l'àbac marqui 3, prem Comprova.",
      hints: ["Fes servir la columna de la dreta: és la de les unitats.", "Si toques la tercera bola, pugen totes tres alhora."] },
    { name: "La bola de dalt", q: '5', show: 1,
      tip: "Les boles de dalt valen 5 cadascuna. Compten quan les baixes fins a la barra. Escriu el 5 amb una sola bola.",
      hints: ["Per escriure 5 n'hi ha prou amb una bola de dalt.", "Cinc boles de baix també fan 5, però l'àbac queda desendreçat: sempre es canvien per una de dalt."] },
    { name: "Cinc i dos", q: '7', show: 1,
      tip: "Els nombres del 6 al 9 es fan amb la bola de dalt i unes quantes de baix: 7 és 5 i 2.",
      hints: ["Comença per la bola que val 5.", "Quant falta de 5 fins a 7? Aquestes són les boles de baix."] },
    { name: "Quin nombre és?", read: 8, opts: [3, 8, 4, 9],
      tip: "Ara et toca llegir. Quin nombre marca l'àbac? Només compten les boles que toquen la barra.",
      hints: ["Una bola de dalt a la barra val 5. Suma-hi les de baix que toquen la barra.", "Compta: 5 i quantes més?"] },
    { name: "Les desenes", q: '20', show: 1,
      tip: "Cada columna val deu vegades més que la de la seva dreta. La segona columna és la de les desenes: allà, una bola de baix val 10.",
      hints: ["Per escriure 20 calen 2 desenes i cap unitat.", "Les lletres de sota t'ho recorden: U vol dir unitats i D, desenes."] },
    { name: "Dues columnes", q: '36', show: 1,
      tip: "Un nombre de dues xifres s'escriu xifra a xifra: 3 a les desenes i 6 a les unitats.",
      hints: ["Comença per les desenes: 3 boles de baix.", "El 6 de les unitats és 5 i 1."] },
    { name: "Llegeix-lo", read: 74, opts: [47, 24, 74, 79],
      tip: "Llegeix l'àbac d'esquerra a dreta, com un nombre escrit.",
      hints: ["Primer la columna de les desenes: quant val?", "Després la de les unitats. Ajunta les dues xifres."] },
    { name: "Sense xivato", q: '58',
      tip: "Els números de sota s'han amagat! Escriu el 58 i prem Comprova quan el tinguis.",
      hints: ["El 5 de les desenes es fa amb una sola bola.", "El 8 de les unitats és 5 i 3."] },
    { name: "Un zero al mig", q: '407',
      tip: "Una columna sense cap bola a la barra és un zero. La tercera columna és la de les centenes.",
      hints: ["407 són 4 centenes, 0 desenes i 7 unitats.", "La columna del mig s'ha de quedar buida."] },
    { name: "Tres xifres", read: 692, opts: [642, 296, 962, 692],
      tip: "Últim repte de la secció: llegeix un nombre de tres xifres.",
      hints: ["Ves columna per columna, començant per les centenes.", "A la columna del mig hi ha una bola de dalt i quatre de baix: 5 i 4."] }
  ] },
  { name: "Sumes", sub: "Afegeix boles, columna a columna", levels: [
    { name: "Dos i dos", q: '2+2', show: 1,
      tip: "L'àbac ja marca el primer nombre. Per sumar-n'hi 2, puja 2 boles més.",
      hints: ["No cal començar de zero: el 2 ja hi és.", "Puja dues boles de baix més i mira quantes en toquen la barra."] },
    { name: "Passa de cinc", q: '2+6', show: 1,
      tip: "Sumar 6 és sumar 5 i 1: una bola de dalt i una de baix.",
      hints: ["Baixa la bola de dalt: ja n'has sumat 5.", "Encara en falta 1 per arribar a 6."] },
    { name: "Només les unitats", q: '21+7', show: 1,
      tip: "Suma el 7 a la columna de les unitats. Les desenes no es toquen.",
      hints: ["7 és 5 i 2.", "A les unitats hi ha 1 bola. Amb 7 més n'hi haurà 8."] },
    { name: "Columna a columna", q: '32+15', show: 1,
      tip: "Suma el 15 per parts: 1 a les desenes i 5 a les unitats.",
      hints: ["Comença per les desenes: només cal una bola més.", "El 5 de les unitats és la bola de dalt."] },
    { name: "El canvi de cinc", q: '4+1', show: 1,
      tip: "Puja la cinquena bola de baix. Ara n'hi ha 5, i cinc boles de baix es canvien per una de dalt: baixa-les totes i posa la de dalt.",
      hints: ["Cinc boles de baix i una de dalt valen el mateix: 5.", "Després del canvi, a la barra només hi ha d'haver la bola de dalt."] },
    { name: "Treu-ne 1 i suma'n 5", q: '3+4', show: 1,
      tip: "Per sumar 4 no hi ha prou boles de baix. Un truc: 4 és 5 menys 1. Treu una bola de baix i baixa la de dalt.",
      hints: ["Treure'n 1 i sumar-ne 5 és el mateix que sumar-ne 4.", "Al final, a la barra hi ha d'haver la bola de dalt i dues de baix."] },
    { name: "Un altre cop", q: '13+4',
      tip: "El mateix truc d'abans, ara sense els números de sota.",
      hints: ["A les unitats només queden dues boles de baix, i en calen 4.", "Sumar 4 és treure'n 1 i sumar-ne 5."] },
    { name: "Dos canvis", q: '24+31',
      tip: "Suma 3 a les desenes i 1 a les unitats. Si en una columna queden cinc boles de baix a la barra, fes el canvi.",
      hints: ["A les desenes, 2 i 3 fan 5: cinc de baix es canvien per una de dalt.", "A les unitats passa el mateix amb 4 i 1."] },
    { name: "Tres xifres", q: '142+36',
      tip: "36 no té centenes: suma 3 a les desenes i 6 a les unitats.",
      hints: ["A les desenes n'hi ha 4 i en vols sumar 3: treu-ne 2 i suma'n 5.", "A les unitats, 6 és 5 i 1."] },
    { name: "Suma gran", q: '253+324',
      tip: "Tres columnes, tres sumes petites: 2 i 3, 5 i 2, 3 i 4.",
      hints: ["Ves columna per columna, de l'esquerra cap a la dreta.", "Recorda els dos trucs: el canvi de cinc, i sumar 4 traient-ne 1 i sumant-ne 5."] }
  ] },
  { name: "Me'n porto una", sub: "Quan una columna s'omple, es fa un canvi", levels: [
    { name: "El canvi de deu", q: '5+5', show: 1,
      tip: "Puja les cinc boles de baix: amb la de dalt fan 10, i la columna queda plena. I 10 és una bola de baix de la columna de les desenes. Fes el canvi!",
      hints: ["Buida la columna de les unitats i, a canvi, puja una bola de baix a les desenes.", "10 s'escriu amb un 1 a les desenes i un 0 a les unitats."] },
    { name: "La columna plena", q: '8+2', show: 1,
      tip: "Puja 2 boles de baix. Ara la columna és plena: fes el canvi de deu.",
      hints: ["Una columna plena val 10: es canvia per una bola de baix de la columna de l'esquerra.", "Quan el número de sota surt vermell, la columna demana un canvi."] },
    { name: "Set i vuit", q: '7+8', show: 1,
      tip: "A les unitats no hi caben 8 més. Un truc: 8 és 10 menys 2. Treu 2 boles de baix i puja una bola a les desenes.",
      hints: ["Treure'n 2 i sumar-ne 10 és el mateix que sumar-ne 8.", "Al final hi ha d'haver una desena i la bola de dalt de les unitats: 15."] },
    { name: "Nou i nou", q: '9+9', show: 1,
      tip: "El mateix truc: 9 és 10 menys 1. Treu una bola de les unitats i puja'n una a les desenes.",
      hints: ["A les unitats no hi caben 9 més.", "Treure'n 1 i sumar-ne 10 és el mateix que sumar-ne 9."] },
    { name: "Me'n porto una", q: '28+14',
      tip: "Suma les desenes i després les unitats. Si les unitats passen de 9, canvia'n 10 per una desena: això és «portar-ne una».",
      hints: ["Primer 1 a les desenes. Després 4 a les unitats.", "8 i 4 fan 12: 10 se'n van a les desenes i 2 es queden."] },
    { name: "Sumes de dues xifres", q: '36+47',
      tip: "Columna a columna, i un canvi quan calgui.",
      hints: ["A les desenes, 3 i 4 fan 7.", "A les unitats, 6 i 7 fan 13: me'n porto una."] },
    { name: "Passem de cent", q: '65+38',
      tip: "Les desenes també es poden omplir: 10 desenes es canvien per 1 centena.",
      hints: ["6 i 3 desenes en fan 9. Però n'arribarà una més de les unitats…", "5 i 8 fan 13 unitats: una desena més, i ja en són 10."] },
    { name: "Tres xifres", q: '157+68',
      tip: "68 no té centenes. Suma 6 a les desenes i 8 a les unitats, amb els canvis que calguin.",
      hints: ["5 i 6 desenes en fan 11: una centena més.", "7 i 8 unitats en fan 15: una desena més."] },
    { name: "Suma gran", q: '486+237',
      tip: "Tres columnes i més d'un canvi. Amb calma!",
      hints: ["Ves d'esquerra a dreta: centenes, desenes, unitats.", "Cada vegada que una columna passa de 9, canvia'n 10 per una bola de l'esquerra."] },
    { name: "L'efecte dòmino", q: '999+1',
      tip: "Una sola unitat més i… cada canvi en provoca un altre!",
      hints: ["Suma 1 a les unitats i fes els canvis d'un en un.", "Quan acabis, quedarà una sola bola a tot l'àbac."] }
  ] },
  { name: "Restes", sub: "Treu boles, i demana'n quan no n'hi ha prou", levels: [
    { name: "Treu-ne dues", q: '4-2', show: 1,
      tip: "Restar és treure boles de la barra. Baixa 2 boles de baix.",
      hints: ["Toca la bola que vols treure: les de sota baixen amb ella.", "De 4 boles, n'han de quedar 2 a la barra."] },
    { name: "Treu-ne cinc", q: '9-5', show: 1,
      tip: "Per treure'n 5 n'hi ha prou amb pujar la bola de dalt.",
      hints: ["La bola de dalt val 5.", "Les boles de baix no es toquen."] },
    { name: "Columna a columna", q: '48-16', show: 1,
      tip: "Resta el 16 per parts: 1 desena i 6 unitats.",
      hints: ["Treu una bola de baix de les desenes.", "Treure 6 és treure 5 i 1."] },
    { name: "Posa'n 1 i treu-ne 5", q: '7-4', show: 1,
      tip: "No hi ha 4 boles de baix per treure. Un truc: 4 és 5 menys 1. Posa una bola de baix més i puja la de dalt.",
      hints: ["Posar-ne 1 i treure'n 5 és el mateix que treure'n 4.", "Al final han de quedar 3 boles de baix a la barra."] },
    { name: "El truc, dues vegades", q: '56-23',
      tip: "A cada columna cal el truc de la bola de dalt: posar-ne unes quantes de baix i treure'n 5.",
      hints: ["A les desenes: posa'n 3 i treu-ne 5, perquè 2 és 5 menys 3.", "A les unitats: posa'n 2 i treu-ne 5, perquè 3 és 5 menys 2."] },
    { name: "Demana'n una", q: '10-3', show: 1,
      tip: "A les unitats no hi ha res per treure. Demana una desena: val 10 unitats. Si de 10 en treus 3, en queden 7 a les unitats.",
      hints: ["Treu la bola de les desenes.", "A canvi, posa a les unitats el que queda de 10 quan en treus 3."] },
    { name: "Demana i resta", q: '32-5',
      tip: "A les unitats n'hi ha 2 i en vols treure 5. Demana una desena.",
      hints: ["Una desena menys: de 3 en queden 2.", "10 menys 5 fan 5: suma'ls a les 2 unitats que ja hi havia."] },
    { name: "Restes de dues xifres", q: '54-28',
      tip: "Primer les desenes, després les unitats. Si no n'hi ha prou, demana'n a l'esquerra.",
      hints: ["5 desenes menys 2 en fan 3.", "Per treure 8 de 4 unitats cal demanar una desena: 14 menys 8 fan 6."] },
    { name: "El dòmino al revés", q: '100-1',
      tip: "No hi ha unitats ni desenes: cal demanar a les centenes. Una centena són 9 desenes i 10 unitats.",
      hints: ["Treu la bola de les centenes.", "A canvi, posa 9 a les desenes i 9 a les unitats."] },
    { name: "Resta gran", q: '423-167',
      tip: "Tres columnes i més d'un préstec. Amb calma!",
      hints: ["Ves d'esquerra a dreta: centenes, desenes, unitats.", "Quan en una columna no n'hi ha prou, treu una bola de la columna de l'esquerra: en val 10."] }
  ] },
  { name: "Multiplica", sub: "Sumar el mateix nombre moltes vegades", levels: [
    { name: "Dues vegades tres", q: '2x3', show: 1,
      tip: "2 × 3 vol dir «2 vegades 3». Escriu un 3 i suma-n'hi 3 més.",
      hints: ["Primer puja 3 boles de baix.", "Per sumar-n'hi 3 més: treu-ne 2 i suma'n 5."] },
    { name: "Tres vegades quatre", q: '3x4', show: 1,
      tip: "4 i 4 i 4. Suma de quatre en quatre, tres vegades.",
      hints: ["4, 8… i quin ve després?", "Quan passis de 9, fes el canvi de deu."] },
    { name: "De cinc en cinc", q: '4x5', show: 1,
      tip: "Sumar 5 és fàcil a l'àbac: la bola de dalt. I si ja és a la barra, puja les cinc de baix i fes el canvi de deu.",
      hints: ["Una columna plena val 10: canvia-la per una desena.", "5, 10, 15 i 20."] },
    { name: "El camí curt", q: '6x2',
      tip: "6 × 2 fa el mateix que 2 × 6. Tria el camí curt: 6 i 6.",
      hints: ["Escriu un 6: la bola de dalt i una de baix.", "Suma-n'hi 6 més i fes els canvis."] },
    { name: "Tres vegades set", q: '3x7',
      tip: "7 i 7 i 7. O, si ja saps la taula del 7, escriu el resultat directament.",
      hints: ["7 i 7 fan 14.", "14 i 7 fan 21."] },
    { name: "Si saps la taula…", q: '5x8',
      tip: "Si saps la taula del 5, pots escriure el resultat de cop. L'àbac no s'enfada!",
      hints: ["8, 16, 24, 32…", "El resultat acaba en zero."] },
    { name: "Trenca el nombre", q: '12x3',
      tip: "Trenca el 12 en 10 i 2. Primer 10 × 3, a les desenes. Després suma-hi 2 × 3, a les unitats.",
      hints: ["10 × 3 són 3 desenes.", "2 × 3 són 6 unitats."] },
    { name: "Per parts", q: '23x4',
      tip: "20 × 4 i 3 × 4. Escriu el primer resultat i suma-hi el segon.",
      hints: ["20 × 4 fan 80: 8 a les desenes.", "3 × 4 fan 12: suma 1 desena i 2 unitats."] },
    { name: "Més gran", q: '45x6',
      tip: "40 × 6 i 5 × 6. Escriu el primer resultat i suma-hi el segon.",
      hints: ["4 × 6 fan 24, i per tant 40 × 6 fan 240.", "5 × 6 fan 30: suma 3 desenes."] },
    { name: "Tres parts", q: '124x3',
      tip: "Trenca el 124 en 100, 20 i 4, i multiplica cada part per 3.",
      hints: ["100 × 3 fan 300 i 20 × 3 fan 60.", "4 × 3 fan 12: suma 1 desena i 2 unitats."] }
  ] },
  { name: "Reparteix i barreja", sub: "Divisions i operacions encadenades", levels: [
    { name: "Reparteix", q: '12:3', show: 1,
      tip: "12 : 3 vol dir repartir 12 en 3 parts iguals. Quin nombre, multiplicat per 3, fa 12? Escriu-lo a l'àbac.",
      hints: ["Repassa la taula del 3: 3, 6, 9, 12.", "Quantes vegades has sumat 3 per arribar a 12?"] },
    { name: "La taula del cinc", q: '35:5',
      tip: "Quantes vegades hi cap el 5 dins del 35?",
      hints: ["Compta de cinc en cinc fins a 35.", "5, 10, 15, 20, 25, 30, 35: quants nombres has dit?"] },
    { name: "La taula del sis", q: '48:6',
      tip: "Busca a la taula del 6 quin nombre fa 48.",
      hints: ["6 × 5 fan 30. Encara en falten.", "6 × 8 fan…"] },
    { name: "Dues operacions", q: '25+17-8',
      tip: "Fes les operacions d'una en una, d'esquerra a dreta. El resultat de la primera ja queda a l'àbac per a la segona.",
      hints: ["Primer suma 17: 1 desena i 7 unitats.", "Després resta 8 del que ha quedat."] },
    { name: "Resta i suma", q: '60-25+9',
      tip: "Primer la resta, després la suma. No esborris l'àbac entremig!",
      hints: ["Per restar 25: treu 2 desenes i demana'n una altra per a les unitats.", "Després suma 9 a les unitats."] },
    { name: "Reparteix per parts", q: '84:4',
      tip: "Reparteix primer les desenes, 80 : 4, i després les unitats, 4 : 4.",
      hints: ["8 desenes entre 4 fan 2 desenes.", "4 unitats entre 4 fan 1 unitat."] },
    { name: "Arriben els milers", q: '1250+375',
      tip: "La quarta columna és la dels milers. Tot funciona igual: columna a columna, i canvis quan cal.",
      hints: ["Suma 3 a les centenes, 7 a les desenes i 5 a les unitats.", "5 i 7 desenes en fan 12: una centena més."] },
    { name: "Resta amb milers", q: '2000-750',
      tip: "Per treure 750 cal demanar un miler: val 10 centenes.",
      hints: ["Treu una bola dels milers: a canvi tens 10 centenes.", "De 10 centenes en treus 7 i en queden 3. Després demana'n una altra per treure les 5 desenes."] },
    { name: "Multiplica i resta", q: '7x8-6',
      tip: "Primer la multiplicació. Escriu-ne el resultat i després resta 6.",
      hints: ["7 × 8 fan 56.", "Per treure 6 de les unitats: treu 5 i 1."] },
    { name: "El gran repte", q: '125x4+500',
      tip: "L'últim nivell! Multiplica per parts, 100, 20 i 5, i després suma 500.",
      hints: ["100 × 4 fan 400, 20 × 4 fan 80 i 5 × 4 fan 20.", "Quan acabis, quedarà una sola bola a tot l'àbac."] }
  ] }
];
export const LEVELS = SECTIONS.flatMap((s, sec) => s.levels.map((l, idx) => ({ ...l, sec, idx })));

// The course: 9 projects of 3 exercises of 5 questions, in three circles. A question is { q: '25+17-8' } to work out on the abacus, or
// { read: 74, opts: [47, 24, 74, 79] } to read it (only the first two projects). Difficulty grows from ex00 to ex02. The questions carry no text.
const ask = (...a) => a.map(q => ({ q }));
const rd = (read, ...opts) => ({ read, opts });
export const PROJECTS = [
  { name: "Les boles", sub: "Una columna: de l'1 al 9, amb la bola de dalt", circle: 0, ex: [
    [...ask('3', '1', '4', '2'), rd(5, 3, 5, 2, 7)],
    [...ask('5', '6', '7'), rd(8, 3, 8, 6, 9), rd(3, 3, 8, 2, 5)],
    [...ask('9', '8'), rd(6, 6, 9, 1, 7), rd(9, 6, 9, 4, 5), rd(7, 2, 7, 9, 5)]
  ] },
  { name: "Les columnes", sub: "Desenes i centenes: llegir i escriure fins a 999", circle: 0, ex: [
    [...ask('20', '36'), rd(74, 47, 24, 74, 79), ...ask('12'), rd(45, 54, 45, 15, 46)],
    [...ask('58', '81'), rd(136, 163, 136, 316, 138), ...ask('250', '104')],
    [...ask('407', '615', '908'), rd(692, 629, 692, 962, 296), rd(380, 308, 380, 830, 381)]
  ] },
  { name: "Sumes", sub: "Sumar sense cap canvi: cada columna té lloc per a les boles", circle: 1, ex: [
    ask('2+2', '1+3', '2+6', '3+5', '1+7'),
    ask('21+7', '32+15', '12+25', '41+8', '20+17'),
    ask('211+36', '312+125', '121+206', '1201+3105', '1123+3111')
  ] },
  { name: "El canvi de 5", sub: "Sumar passant pel 5: +4 = +5 −1", circle: 1, ex: [
    ask('4+1', '3+4', '2+3', '1+4', '3+3'),
    ask('13+4', '24+31', '32+23', '41+34', '33+24'),
    ask('142+36', '253+324', '234+251', '3214+4321', '4132+3243')
  ] },
  { name: "Me'n porto una", sub: "Sumar passant pel 10: +8 = +10 −2", circle: 1, ex: [
    ask('5+5', '8+2', '7+8', '9+9', '6+7'),
    ask('28+14', '36+47', '65+38', '19+25', '57+16'),
    ask('157+68', '486+237', '999+1', '3768+2475', '4856+5379')
  ] },
  { name: "Restes", sub: "Restar, i demanar prestat a la columna de l'esquerra", circle: 1, ex: [
    ask('4-2', '9-5', '7-4', '48-16', '56-23'),
    ask('10-3', '15-8', '32-5', '54-28', '81-46'),
    ask('100-1', '423-167', '305-48', '6034-2578', '9875-4321')
  ] },
  { name: "Multiplica", sub: "Multiplicar és sumar el mateix nombre moltes vegades", circle: 2, ex: [
    ask('2x3', '3x4', '4x5', '6x2', '2x5'),
    ask('3x7', '5x8', '6x9', '12x3', '23x4'),
    ask('45x6', '124x3', '86x7', '231x4', '99x9')
  ] },
  { name: "Reparteix", sub: "Dividir és restar el mateix nombre moltes vegades", circle: 2, ex: [
    ask('6:2', '12:3', '10:5', '8:2', '20:4'),
    ask('35:5', '48:6', '27:3', '63:7', '56:8'),
    ask('84:4', '96:8', '144:6', '432:9', '810:9')
  ] },
  { name: "Barreja", sub: "Operacions encadenades i números fins als milers", circle: 2, ex: [
    ask('12+9-5', '25+17-8', '60-25+9', '3x4+8', '20-6+9'),
    ask('1250+375', '2000-750', '7x8-6', '1500+480', '3000-1250'),
    ask('125x4+500', '5200-1875', '9x7+38-15', '2500+3750-4000', '36:4+1250')
  ] }
];
export const CIRCLES = [
  { name: "Llegir i escriure", projects: [0, 1] },
  { name: "Sumar i restar", projects: [2, 3, 4, 5] },
  { name: "Multiplicar i repartir", projects: [6, 7, 8] }
];
// the three numbers of the Piscina, the first challenges
export const POOL = ['3', '5', '7'];

/* ---------- progress ---------- */
// What is saved is facts only: { so, secs[6], piscina, notes[9], exams[3], fulls }. XP, level and badges are worked out from it, never stored, so they cannot drift apart.
// secs is the progress of the old game (levels done in each of its six sections): kept, never written by the new game, and read once to give the projects their marks.
export const VALID = 80;
export const EXAM_PASS = 5;
// the old section of each project: ten levels done in it give the project a validated 80
export const OLD = [0, 0, 1, 1, 2, 3, 4, 5, 5];
// a mark out of 100 from the questions right at the first try, of the 15 of a project
export const mark = firsts => Math.round(100 * firsts / 15);
// a whole number from any JSON value: truncated (never rounded up, so damaged data cannot climb), 0 when it is not a finite number
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
// n items of a saved list, a missing or wrong list giving undefined items
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// A complete progress inside its limits from any value at all; a new object, sharing no list with d. It only ever raises: a number is cut into its limits and
// never lowered otherwise, a boolean only turns true. The cloud keeps the larger number, so a value lowered here would be lost or come back from another device.
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  const secs = slots(o.secs, 6).map(s => within(s, 10));
  return {
    so: o.so !== false,
    secs,
    piscina: o.piscina === true || secs.some(s => s > 0),
    // the translation of the old game: a section of ten levels done gives its projects 80, unless they already hold more
    notes: slots(o.notes, 9).map((n, i) => Math.max(within(n, 100), secs[OLD[i]] === 10 ? VALID : 0)),
    exams: slots(o.exams, 3).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls))
  };
}
// the projects with a mark of at least VALID; the functions below take a progress that is already clean
const validated = p => p.notes.flatMap((n, i) => n >= VALID ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 1370 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + p.notes[i], 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 9,13
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina, circles 1 and 2 with the exam before them, and only when the circle before is open too (a damaged save cannot skip one); a circle that does not exist is shut
export const isOpen = (p, c) => c === 0 ? p.piscina === true : (c === 1 || c === 2) && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => p.notes[i] >= VALID);
// in the order of the spec; fulls here is the raw count, not the one that XP caps
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer full', what: 'Troba bé les errades d\'un full.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Deu fulls', what: 'Corregeix bé deu fulls d\'errades.' },
  { name: 'Cursus complet', what: 'Supera els tres exàmens.' }
];
export const badges = p => [p.piscina === true, p.fulls >= 1, p.notes.some(n => n === 100), p.fulls >= 10, p.exams.every(e => e === true)];
// The hand-in of a finished project, the only place where a mark is worked out. run has one { tries, helped } per question (15 of them, five to an exercise):
// the wrong answers before the right one, and whether the hint was asked. A question counts when it was right at the first try without the hint.
// Returns { prog, n, best, gain, redo, news }: prog is a NEW progress (p is never touched) holding the mark if it beats the stored one; n is the mark of
// this run; best the stored mark before it; gain the XP the run adds (the difference of xpOf, so 0 for a lower replay and the whole mark on validating);
// redo the exercises with a question that did not count ('ex00' ...); news the names of the badges this run earns.
export const firstTry = r => !!r && r.tries === 0 && !r.helped;
export function handIn(p, i, run) {
  const n = mark(run.filter(firstTry).length), best = p.notes[i], next = { ...p, secs: p.secs.slice(), notes: p.notes.slice(), exams: p.exams.slice() };
  if (n > best) next.notes[i] = n;
  const had = badges(p), now = badges(next);
  return { prog: next, n, best, gain: xpOf(next) - xpOf(p), redo: [0, 1, 2].filter(e => run.slice(e * 5, e * 5 + 5).some(r => !firstTry(r)) || run.length < e * 5 + 5).map(e => 'ex0' + e),
    news: BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name) };
}
