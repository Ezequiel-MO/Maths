// The rules and the data of the fractions game, with no page in it. Fourteen projects of ten levels, each level five fixed questions.
// It must keep importing from Node. A question is { mode, ... }; n over d is the fraction it is about:
//   'equal'  three figures cut in d parts; the one in equal parts is at position `at`
//   'paint'  choose n of the d parts of a figure           'name'  write the fraction a figure shows
//   'line'   ask 'put': move the frog to n/d on the line;  ask 'read': write where the frog is. max is where the line ends (1, 2 or 3)
//   'cmp'    choose <, = or > between a/b and c/d          'same'  are a/b and c/d equivalent?
//   'cut'    n/d with every part cut in k: write the new numerator
//   'fill'   n/d = N/D with N or D missing (`miss`)        'join'  write n/d in lowest terms
//   'imp'    w wholes and n/d: write how many parts of 1/d  'mix'   a/d above 1: write its wholes and the parts left over
//   'add'    a/b op c/d; with D only the numerator over D is asked, without it the whole fraction (any equivalent one is right)
//   'times'  k times n/d: write the numerator              'of'    n/d of T things: write how many
//   'pct'    n/d as a percentage                           'dec'   choose the decimal that n/d is
// shape is the figure: round ('pad' a lily pad, 'pizza', 'clock'), long ('bar' a walkway of planks, 'choc' a chocolate tablet),
// 'jug' (filled from the bottom) or a group ('eggs' in a carton, 'bugs' fireflies). hide: no figure until a hint. story: what the frog says instead of the usual line.
export const gcd = (a, b) => b ? gcd(b, a % b) : a;
export const lcm = (a, b) => a * b / gcd(a, b);
export const sign = (a, b, c, d) => a * d < c * b ? '<' : a * d > c * b ? '>' : '=';
const fmt = (x, p = 2) => String(+x.toFixed(p)).replace('.', ',');
export const deci = (n, d) => fmt(n / d);
// the most parts each figure can show
export const ROOM = { pad: 12, pizza: 12, clock: 12, bar: 20, choc: 40 };
// a question written as text: the mode, then its numbers, then 'h' when the figures are hidden, then « : » and its story
function parse(txt) {
  const cut = txt.indexOf(' : '), t = (cut < 0 ? txt : txt.slice(0, cut)).trim().split(/\s+/), mode = t[0], hide = t[t.length - 1] === 'h';
  const v = (hide ? t.slice(1, -1) : t.slice(1)).map(x => /^\d+$/.test(x) ? +x : x), story = cut < 0 ? {} : { story: txt.slice(cut + 3).trim() };
  const q = () => {
    switch (mode) {
      case 'equal': return { mode, shape: v[0], d: v[1], at: v[2] };
      case 'paint': case 'name': return { mode, shape: v[0], n: v[1], d: v[2] };
      case 'put': case 'read': return { mode: 'line', ask: mode, n: v[0], d: v[1], max: v[2] || 1 };
      case 'cmp': case 'same': return { mode, a: v[0], b: v[1], c: v[2], d: v[3], hide };
      case 'cut': return { mode, shape: v[0], n: v[1], d: v[2], k: v[3] };
      case 'fill': return { mode, n: v[0], d: v[1], N: v[2], D: v[3], miss: v[4], hide };
      case 'join': return { mode, shape: v[0], n: v[1], d: v[2], hide };
      case 'imp': return { mode, shape: v[0], w: v[1], n: v[2], d: v[3], hide };
      case 'mix': return { mode, shape: v[0], a: v[1], d: v[2], hide };
      case 'add': case 'sub': return { mode: 'add', op: mode === 'add' ? '+' : '−', a: v[0], b: v[1], c: v[2], d: v[3], D: v[4] || 0, hide };
      case 'times': return { mode, k: v[0], n: v[1], d: v[2], hide };
      case 'of': return { mode, n: v[0], d: v[1], T: v[2], unit: String(v[3]), hide };
      case 'pct': case 'dec': return { mode, n: v[0], d: v[1], hide };
    }
  };
  return { ...q(), ...story };
}
const proj = (name, sub, modes, ...levels) => ({ name, sub, modes, levels: levels.map(([n, qs]) => ({ name: n, qs: qs.split('|').map(parse) })) });
export const PROJECTS = [
  proj('Parts iguals', 'Una fracció són parts igual de grans', ['equal', 'paint'],
    ['Meitats', 'equal pizza 2 0 | equal choc 2 2 | paint pizza 1 2 | paint choc 1 2 | equal pad 2 1'],
    ['Terços', 'equal pizza 3 1 | equal bar 3 0 | paint pad 1 3 | paint choc 1 3 | equal choc 3 2'],
    ['Quarts', 'equal pizza 4 2 | paint pizza 1 4 | equal bar 4 1 | paint choc 1 4 | paint eggs 1 4'],
    ['Una part de moltes', 'paint pizza 1 6 | paint choc 1 5 | paint pad 1 8 | paint bar 1 10 | paint eggs 1 6'],
    ['Iguals o no?', 'equal pad 6 0 | equal choc 5 2 | equal pizza 8 1 | equal bar 6 0 | equal pizza 5 2'],
    ["Més d'una part", 'paint pizza 2 3 | paint choc 2 4 | paint pad 3 4 | paint bar 2 5 | paint pizza 3 6'],
    ['La gerra de suc', 'paint jug 1 2 | paint jug 1 4 | paint jug 3 4 | paint jug 2 5 | paint jug 3 10'],
    ['Ous i cuques de llum', 'paint eggs 1 2 | paint bugs 1 3 | paint eggs 2 6 | paint bugs 3 5 | paint eggs 5 12'],
    ['Barreja', 'equal pizza 4 0 | paint choc 3 5 | equal bar 8 1 | paint pad 5 8 | paint eggs 3 4'],
    ['Gairebé tot', 'paint pizza 4 4 | paint choc 5 6 | paint jug 5 6 | paint bar 7 8 | paint eggs 10 12']),
  proj('Dalt i baix', 'El numerador i el denominador', ['paint', 'name'],
    ['El de baix', 'name pizza 1 2 | name pizza 1 4 | name choc 1 3 | name bar 1 5 | name pad 1 6'],
    ['El de dalt', 'name pizza 2 3 | name pad 3 4 | name choc 2 5 | name bar 3 5 | name pizza 5 6'],
    ['Vuitens i desens', 'name choc 3 8 | name pizza 5 8 | name bar 7 10 | name pizza 7 8 | name choc 4 6'],
    ['Ous i cuques de llum', 'name eggs 1 4 | name bugs 3 5 | name eggs 2 6 | name bugs 5 8 | name eggs 7 12'],
    ['La gerra de suc', 'name jug 1 2 | name jug 3 4 | name jug 2 5 | name jug 7 10 | name jug 5 8'],
    ['El rellotge', 'name clock 1 2 | name clock 1 4 | name clock 3 4 | name clock 1 3 | name clock 5 12'],
    ['Prepara-la', 'paint pizza 3 8 | paint choc 4 10 | paint pad 5 6 | paint bar 7 9 | paint eggs 4 9'],
    ['Fins a dotzens', 'name pizza 5 12 | name choc 7 12 | paint pad 7 12 | paint choc 11 12 | name clock 11 12'],
    ['Tot sencer', 'name pizza 4 4 | name choc 6 6 | paint pad 3 3 | name eggs 6 6 | paint jug 8 8'],
    ['Ull viu', 'name pad 7 9 | paint pizza 9 10 | name bar 5 11 | paint bugs 8 12 | name choc 9 12']),
  proj('La recta', 'Les fraccions viuen entre el 0 i el 1', ['line'],
    ['Primers salts', 'put 1 2 | put 1 4 | put 3 4 | put 2 4 | put 1 3'],
    ['Més salts', 'put 2 3 | put 2 5 | put 4 5 | put 3 6 | put 5 6'],
    ['On és la granota?', 'read 1 2 | read 1 4 | read 3 4 | read 2 3 | read 3 5'],
    ['Salts petits', 'read 2 6 | read 5 8 | read 3 8 | read 7 10 | read 4 5'],
    ["El zero i l'u", 'put 0 4 | put 4 4 | put 3 3 | put 0 5 | put 6 6'],
    ['Anar i mirar', 'read 5 5 | put 7 8 | read 1 8 | put 3 10 | read 9 10'],
    ['Vuitens i desens', 'put 5 8 | put 9 10 | put 1 10 | put 3 8 | put 7 10'],
    ['Dotzens', 'put 5 12 | read 7 12 | put 11 12 | read 1 12 | put 6 12'],
    ['Barreja', 'read 4 6 | put 2 7 | read 8 9 | put 5 9 | read 11 12'],
    ['Ull viu', 'put 7 9 | read 3 7 | put 10 11 | read 5 12 | put 9 12']),
  proj('Qui és més gran?', 'Comparar fraccions', ['cmp'],
    ['El mateix a baix', 'cmp 1 4 3 4 | cmp 2 3 1 3 | cmp 3 5 4 5 | cmp 5 6 2 6 | cmp 3 8 5 8'],
    ['Més parts iguals', 'cmp 7 10 3 10 | cmp 2 5 2 5 | cmp 5 8 7 8 | cmp 4 9 2 9 | cmp 11 12 7 12'],
    ['Una sola part', 'cmp 1 2 1 3 | cmp 1 4 1 2 | cmp 1 5 1 3 | cmp 1 8 1 6 | cmp 1 10 1 4'],
    ['El mateix a dalt', 'cmp 2 3 2 5 | cmp 3 8 3 4 | cmp 2 6 2 4 | cmp 3 5 3 10 | cmp 5 6 5 8'],
    ['Més o menys que la meitat', 'cmp 1 4 1 2 | cmp 3 4 1 2 | cmp 2 6 1 2 | cmp 5 8 1 2 | cmp 3 6 1 2'],
    ['La meitat, altre cop', 'cmp 2 5 1 2 | cmp 4 6 1 2 | cmp 4 8 1 2 | cmp 7 10 1 2 | cmp 5 12 1 2'],
    ['Sense dibuix', 'cmp 3 7 5 7 h | cmp 1 6 1 9 h | cmp 8 9 4 9 h | cmp 2 7 2 3 h | cmp 6 11 6 11 h'],
    ['Barreja', 'cmp 5 6 1 2 h | cmp 3 10 1 2 h | cmp 4 5 4 7 h | cmp 7 12 11 12 h | cmp 6 12 1 2 h'],
    ['Repte', 'cmp 4 4 3 4 | cmp 2 2 5 5 h | cmp 9 10 1 2 h | cmp 3 4 3 5 h | cmp 5 12 7 12 h'],
    ['El rei de les parts', 'cmp 1 12 1 10 h | cmp 7 8 7 9 h | cmp 5 9 4 9 h | cmp 6 12 1 2 h | cmp 3 3 9 10 h']),
  proj("Més d'un sencer", 'Quan hi ha més d\'una pizza', ['imp', 'mix', 'line'],
    ['Pizzes senceres', 'imp pizza 1 0 2 | imp pizza 1 0 4 | imp pizza 2 0 2 | imp pizza 2 0 4 | imp pizza 3 0 3'],
    ['Una i una mica més', 'imp pizza 1 1 2 | imp pizza 1 1 4 | imp pizza 1 3 4 | imp pizza 1 2 3 | imp pizza 2 1 2'],
    ['Compta les parts', 'imp pizza 2 1 4 | imp choc 1 2 5 | imp pizza 2 2 3 | imp choc 2 3 4 | imp pizza 3 1 2'],
    ['Del revés', 'mix pizza 3 2 | mix pizza 5 4 | mix pizza 7 4 | mix pizza 5 3 | mix pizza 5 2'],
    ['Sencers i parts', 'mix choc 7 5 | mix pizza 9 4 | mix pizza 8 3 | mix choc 11 6 | mix pizza 7 2'],
    ["La recta s'allarga", 'put 5 4 2 | put 3 2 2 | put 7 4 2 | put 4 3 2 | put 8 4 2'],
    ['On és la granota?', 'read 3 2 2 | read 5 4 2 | read 5 3 2 | read 7 4 2 | read 9 4 3'],
    ['Sense dibuix', 'imp pizza 1 1 3 h | imp pizza 2 1 4 h | imp pizza 1 4 5 h | imp pizza 3 1 2 h | imp pizza 2 2 5 h'],
    ['Sense dibuix, del revés', 'mix pizza 7 3 h | mix pizza 9 2 h | mix pizza 11 4 h | mix pizza 13 5 h | mix pizza 17 6 h'],
    ['Repte', 'imp pizza 3 3 4 h | mix pizza 19 4 h | read 11 4 3 | mix pizza 23 10 h | imp pizza 4 5 6 h']),
  proj('Tallar més fi', 'La mateixa part amb parts més petites', ['cut'],
    ['La meitat', 'cut pizza 1 2 2 | cut choc 1 2 2 | cut pizza 1 2 3 | cut bar 1 2 4 | cut choc 1 2 5'],
    ['Terços', 'cut pizza 1 3 2 | cut choc 1 3 3 | cut bar 2 3 2 | cut pizza 2 3 2 | cut choc 2 3 4'],
    ['Quarts', 'cut pizza 1 4 2 | cut bar 3 4 2 | cut pizza 3 4 3 | cut choc 1 4 3 | cut choc 3 4 4'],
    ['Cinquens', 'cut bar 1 5 2 | cut choc 2 5 2 | cut bar 3 5 2 | cut choc 4 5 3 | cut bar 2 5 4'],
    ['Nenúfars', 'cut pad 1 2 6 | cut pad 1 3 4 | cut pad 2 3 4 | cut pad 1 6 2 | cut pad 5 6 2'],
    ['Passarel·les', 'cut bar 3 8 2 | cut bar 5 6 3 | cut bar 2 3 5 | cut bar 3 4 5 | cut bar 1 2 10'],
    ['Dos talls seguits', 'cut pizza 1 2 4 | cut choc 1 3 6 | cut bar 3 4 4 | cut choc 2 5 4 | cut bar 2 3 6'],
    ['Barreja', 'cut pizza 3 4 2 | cut choc 4 5 2 | cut pad 1 4 3 | cut bar 5 6 2 | cut bar 3 10 2'],
    ['Repte', 'cut bar 7 10 2 | cut pizza 1 3 3 | cut choc 3 5 4 | cut bar 5 8 2 | cut choc 4 5 4'],
    ['Xocolata a quadrets', 'cut choc 1 2 3 | cut choc 2 3 4 | cut choc 3 4 5 | cut choc 2 5 6 | cut choc 5 6 4']),
  proj('La regla', 'Multiplica dalt i baix pel mateix número', ['fill', 'cut'],
    ['Falta el de dalt', 'fill 1 2 2 4 N | fill 1 3 2 6 N | fill 2 3 4 6 N | fill 1 4 3 12 N | fill 3 4 6 8 N'],
    ['Per 2, per 3, per 4', 'fill 2 5 4 10 N | fill 1 2 5 10 N | fill 3 5 9 15 N | fill 2 3 8 12 N | fill 5 6 10 12 N'],
    ['Falta el de baix', 'fill 1 2 3 6 D | fill 1 3 3 9 D | fill 3 4 9 12 D | fill 2 5 6 15 D | fill 1 4 2 8 D'],
    ['Talla i comprova', 'cut choc 3 5 3 | cut bar 5 6 2 | cut pizza 3 4 3 | cut bar 3 8 2 | cut choc 4 5 4'],
    ['Sense dibuix', 'fill 1 2 4 8 N h | fill 2 3 6 9 N h | fill 3 4 15 20 N h | fill 1 5 2 10 D h | fill 2 7 4 14 D h'],
    ['Més ràpid', 'fill 3 5 12 20 N h | fill 5 6 15 18 D h | fill 4 9 8 18 N h | fill 7 10 21 30 D h | fill 1 6 5 30 N h'],
    ['Fins a 100', 'fill 1 2 50 100 N h | fill 3 4 75 100 N h | fill 1 4 25 100 N h | fill 2 5 40 100 N h | fill 7 10 70 100 N h'],
    ['Taules grans', 'fill 5 8 20 32 D h | fill 3 7 9 21 N h | fill 2 9 6 27 D h | fill 5 12 10 24 N h | fill 4 5 28 35 N h'],
    ['Repte', 'fill 6 7 36 42 D h | fill 3 8 27 72 N h | fill 7 9 49 63 D h | fill 5 6 40 48 N h | fill 9 10 81 90 D h'],
    ['A la vida real', `fill 1 2 2 4 N h : La recepta vol 1/2 litre de llet i la gerra marca quarts de litre. Quants quarts calen?
      | fill 3 4 6 8 N h : Una pizza es talla en 8 parts. Quantes parts fan 3/4 de la pizza?
      | fill 1 4 15 60 N h : Una hora té 60 minuts. Un quart d'hora, quants minuts són?
      | fill 3 10 30 100 N h : Un euro són 100 cèntims. 3/10 d'euro, quants cèntims són?
      | fill 2 5 4 10 N h : Una cursa fa 10 quilòmetres. 2/5 de la cursa, quants quilòmetres són?`]),
  proj('Simplificar', 'La mateixa part amb menys parts', ['join', 'fill'],
    ['De 2 en 2', 'join pizza 2 4 | join bar 2 6 | join pizza 4 6 | join bar 6 8 | join bar 4 10'],
    ['De 3 en 3', 'join pizza 3 6 | join bar 3 9 | join pad 6 9 | join bar 9 12 | join bar 6 15'],
    ['Tria com ajuntar', 'join bar 5 10 | join pizza 2 8 | join bar 10 15 | join pad 3 12 | join bar 4 14'],
    ['Fins que no es pugui més', 'join pizza 4 8 | join bar 4 12 | join pizza 8 12 | join bar 12 16 | join bar 6 12'],
    ['Dividir dalt i baix', 'fill 4 8 1 2 N | fill 6 9 2 3 N | fill 8 12 2 3 D | fill 10 15 2 3 N | fill 6 8 3 4 D'],
    ['Passarel·les llargues', 'join bar 12 18 | join bar 8 20 | join pizza 9 12 | join bar 15 20 | join bar 16 20'],
    ['Sense dibuix', 'fill 10 20 1 2 N h | fill 9 12 3 4 N h | fill 15 25 3 5 D h | fill 14 21 2 3 N h | fill 20 30 2 3 D h'],
    ['De cap', 'join bar 6 10 h | join bar 12 20 h | join bar 9 15 h | join bar 8 12 h | join bar 14 16 h'],
    ['Repte', 'join bar 16 24 h | join bar 20 25 h | join bar 18 27 h | join bar 24 36 h | join bar 30 40 h'],
    ['A la vida real', `join bar 30 60 h : Han passat 30 minuts dels 60 d'una hora: 30/60. Quina fracció de l'hora és, simplificada?
      | join bar 15 60 h : I 15 minuts de 60? Simplifica 15/60.
      | join bar 50 100 h : 50 cèntims són 50/100 d'un euro. Simplifica-ho.
      | join bar 25 100 h : I 25 cèntims, 25/100 d'un euro?
      | join bar 45 60 h : 45 minuts de 60: quina fracció de l'hora és, simplificada?`]),
  proj('Detectius', 'Equivalents o no? I qui és més gran?', ['same', 'cmp'],
    ['Valen el mateix?', 'same 1 2 2 4 | same 1 3 2 5 | same 2 3 4 6 | same 3 4 5 8 | same 1 4 2 8'],
    ['Mira-ho bé', 'same 2 5 4 10 | same 3 5 5 10 | same 2 6 1 3 | same 3 4 9 12 | same 4 6 3 4'],
    ['Sense dibuix', 'same 1 2 5 10 h | same 2 3 6 9 h | same 3 5 6 15 h | same 3 4 12 16 h | same 2 7 4 21 h'],
    ['Parts diferents', 'cmp 1 2 3 8 | cmp 2 3 5 6 | cmp 3 4 5 8 | cmp 1 3 2 6 | cmp 3 5 7 10'],
    ['Detectiu', 'same 4 6 6 9 h | same 6 8 9 12 h | same 2 6 3 8 h | same 10 15 4 6 h | same 3 9 4 10 h'],
    ['El mateix a baix', 'cmp 1 2 5 12 h | cmp 3 4 7 8 h | cmp 2 3 7 12 h | cmp 4 5 7 10 h | cmp 5 6 10 12 h'],
    ['Gairebé iguals', 'cmp 1 2 2 3 | cmp 2 3 3 4 | cmp 3 4 4 5 | cmp 2 5 1 3 | cmp 3 5 2 3'],
    ['De cap', 'cmp 2 3 3 5 h | cmp 3 4 5 6 h | cmp 1 4 2 5 h | cmp 5 8 2 3 h | cmp 4 6 6 9 h'],
    ['Repte', 'same 12 18 10 15 h | cmp 5 6 7 9 h | same 15 20 9 12 h | cmp 7 10 2 3 h | cmp 9 12 6 8 h'],
    ['A taula', `cmp 3 4 5 8 : Dues pizzes iguals: de l'una en queden 3/4 i de l'altra, 5/8. De quina en queda més?
      | cmp 1 2 2 3 : Dues gerres iguals: l'una plena fins a 1/2 i l'altra fins a 2/3. Quina té més suc?
      | cmp 2 6 1 3 : Dues rajoles iguals de xocolata: 2/6 de l'una o 1/3 de l'altra. On n'hi ha més?
      | cmp 7 10 3 5 : Un camí fet fins als 7/10 i un altre fins als 3/5. Quin va més avançat?
      | cmp 5 12 1 2 : El rellotge marca que han passat 5/12 de l'hora. Ja ha passat mitja hora?`]),
  proj('Sumar i restar', 'Ajuntar i treure parts', ['add'],
    ['Sumar parts iguals', 'add 1 4 1 4 4 | add 1 3 1 3 3 | add 2 5 1 5 5 | add 3 8 2 8 8 | add 1 6 4 6 6'],
    ['Restar parts iguals', 'sub 3 4 1 4 4 | sub 2 3 1 3 3 | sub 4 5 2 5 5 | sub 7 8 4 8 8 | sub 5 6 4 6 6'],
    ['Tota la fracció', 'add 1 5 2 5 | add 3 8 4 8 | sub 5 6 4 6 | add 2 7 3 7 | sub 9 10 6 10'],
    ['Quant falta per a 1?', `sub 4 4 1 4 4 : Una pizza sencera són 4/4. Si se'n menja 1/4, quants quarts en queden?
      | sub 3 3 2 3 3 | sub 8 8 3 8 8 | sub 5 5 2 5 5 | sub 10 10 7 10 10`],
    ['A la cuina', `add 1 4 2 4 4 : A la massa hi van 1/4 de litre de llet i 2/4 de litre d'aigua. Quants quarts de litre de líquid hi ha?
      | sub 7 8 3 8 8 : Quedaven 7/8 de pizza i se n'han menjat 3/8. Quants vuitens en queden?
      | add 2 6 3 6 6 : Al matí s'han pintat 2/6 de la tanca i a la tarda, 3/6. Quants sisens estan pintats?
      | sub 9 10 4 10 10 : La bateria estava a 9/10 i un joc n'ha gastat 4/10. Quants desens li queden?
      | add 3 12 5 12 12 : D'una ouera de 12 ous, 3/12 van al pastís i 5/12 a la truita. Quants dotzens s'han fet servir?`],
    ['Parts diferents', 'add 1 2 1 4 4 | add 1 3 1 6 6 | add 1 2 3 8 8 | sub 3 4 1 2 4 | sub 5 6 1 3 6'],
    ['Sense ajuda', 'add 1 2 1 6 | add 1 4 3 8 | sub 1 2 1 4 | add 2 3 1 6 | sub 7 8 1 4'],
    ['El mateix a baix', 'add 1 2 1 3 6 | add 1 3 1 4 12 | sub 1 2 1 3 6 | add 1 2 1 5 10 | sub 3 4 2 3 12'],
    ["Passar de l'1", 'add 3 4 3 4 | add 2 3 2 3 | add 5 8 7 8 | add 1 2 3 4 | add 5 6 2 3'],
    ['Repte', 'add 2 3 1 4 | sub 5 6 1 4 | add 3 5 1 2 | sub 7 10 1 4 | add 3 4 5 6']),
  proj("La part d'una quantitat", 'Fraccions de coses que es compten', ['of'],
    ['La meitat', 'of 1 2 8 ous | of 1 2 12 € | of 1 2 20 cromos | of 1 2 60 min | of 1 2 100 g'],
    ['Terços i quarts', 'of 1 3 12 ous | of 1 4 12 galetes | of 1 4 20 € | of 1 3 30 cromos | of 1 4 60 min'],
    ['Una part', 'of 1 5 20 € | of 1 6 18 ous | of 1 10 50 cromos | of 1 8 24 galetes | of 1 5 100 g'],
    ["Més d'una part", 'of 2 3 12 ous | of 3 4 20 € | of 2 5 10 km | of 3 4 12 galetes | of 5 6 18 ous'],
    ['El rellotge', `of 1 2 60 min : Mitja hora, quants minuts són?
      | of 1 4 60 min : I un quart d'hora?
      | of 3 4 60 min : Tres quarts d'hora, quants minuts són?
      | of 1 3 60 min : El partit dura 1/3 d'hora. Quants minuts són?
      | of 5 6 60 min : La pel·lícula ja ha fet 5/6 de la primera hora. Quants minuts han passat?`],
    ['Diners', `of 1 2 30 € : Un joc val 30 € i avui està a meitat de preu. Quants euros val avui?
      | of 1 4 40 € : La granota té 40 € estalviats i en gasta 1/4 en un llibre. Quants euros val el llibre?
      | of 3 4 20 € : D'una paga de 20 €, 3/4 van a la guardiola. Quants euros hi van?
      | of 2 5 50 € : Unes vambes de 50 € tenen 2/5 de descompte. Quants euros es descompten?
      | of 3 10 100 cèntims : 3/10 d'un euro, quants cèntims són?`],
    ['A la cuina', `of 3 4 200 g : La recepta vol 3/4 d'un paquet de 200 g de farina. Quants grams són?
      | of 2 5 500 ml : Un got s'omple amb 2/5 d'una ampolla de 500 ml. Quants mil·lilitres hi caben?
      | of 1 4 1000 g : Un quart de quilo de maduixes, quants grams són?
      | of 3 10 200 g : El pastís porta 3/10 d'una rajola de 200 g de xocolata. Quants grams?
      | of 3 8 400 ml : Cal posar-hi 3/8 d'un bric de 400 ml de nata. Quants mil·lilitres?`],
    ['Sense dibuix', 'of 2 3 24 ous h | of 3 5 30 € h | of 3 4 36 cromos h | of 5 8 40 km h | of 2 7 21 galetes h'],
    ['Números grans', 'of 5 8 64 km h | of 7 10 90 € h | of 4 9 45 cromos h | of 5 12 60 min h | of 3 7 35 galetes h'],
    ['Repte', `of 2 3 60 min : Els deures duren 2/3 d'hora. Quants minuts són?
      | of 3 4 80 km : El viatge fa 80 km i ja se n'han fet 3/4. Quants quilòmetres s'han fet?
      | of 4 5 30 cromos : L'àlbum té 30 cromos i ja n'hi ha 4/5 d'enganxats. Quants cromos hi ha?
      | of 5 6 120 pàgines : Un llibre de 120 pàgines: se n'han llegit 5/6. Quantes pàgines són?
      | of 7 10 1000 g : D'un quilo de fruita, 7/10 són taronges. Quants grams de taronges hi ha?`]),
  proj('Vegades', 'Multiplicar una fracció per un número', ['times', 'mix', 'of'],
    ['Vegades una part', 'times 2 1 3 | times 3 1 4 | times 2 1 5 | times 3 1 8 | times 5 1 6'],
    ['Vegades unes quantes', 'times 2 2 5 | times 3 2 7 | times 2 3 8 | times 4 2 9 | times 3 3 10'],
    ["Arribar a l'1", 'times 2 1 2 | times 4 1 4 | times 3 1 3 | times 5 1 5 | times 2 3 6'],
    ["Passar de l'1", 'times 3 1 2 | times 5 1 4 | times 3 2 3 | times 2 3 4 | times 4 2 5'],
    ['I en sencers?', 'mix pizza 3 2 | mix pizza 5 4 | mix pizza 8 5 | mix pizza 7 3 | mix pizza 9 4'],
    ['A la cuina', `times 3 1 4 : Cada got fa 1/4 de litre. Quants quarts de litre són 3 gots?
      | times 2 3 8 : Cada dia es mengen 3/8 d'una pizza. Quants vuitens són en 2 dies?
      | times 4 1 2 : Cada pastís porta 1/2 rajola de xocolata. Quantes meitats calen per a 4 pastissos?
      | times 5 2 3 : Cada volta al llac fa 2/3 de quilòmetre. Quants terços de quilòmetre són 5 voltes?
      | times 6 1 4 : Un quart d'hora de lectura cada dia. Quants quarts d'hora són en 6 dies?`],
    ['Sense dibuix', 'times 3 2 5 h | times 4 3 7 h | times 2 5 9 h | times 5 3 4 h | times 6 2 3 h'],
    ['Vegades i parts', 'of 1 2 16 ous h | times 4 3 4 h | of 2 3 15 € h | times 3 5 6 h | of 3 5 25 cromos h'],
    ['Sencers, altre cop', 'mix pizza 11 4 h | mix pizza 9 2 h | mix pizza 13 3 h | mix pizza 17 5 h | mix pizza 15 4 h'],
    ['Repte', 'times 6 5 8 h | mix pizza 25 6 h | times 4 7 10 h | of 5 6 48 km h | mix pizza 14 5 h']),
  proj('Decimals i percentatges', 'La mateixa part escrita de tres maneres', ['dec', 'pct', 'of'],
    ['Desens', 'dec 1 10 | dec 3 10 | dec 7 10 | dec 5 10 | dec 9 10'],
    ['Meitats i quarts', 'dec 1 2 | dec 1 4 | dec 3 4 | dec 1 5 | dec 2 5'],
    ['Centèsims', 'dec 25 100 | dec 7 100 | dec 50 100 | dec 99 100 | dec 5 100'],
    ['Tant per cent', 'pct 1 2 | pct 1 4 | pct 3 4 | pct 1 10 | pct 1 5'],
    ['Més tants per cent', 'pct 3 10 | pct 2 5 | pct 7 10 | pct 4 5 | pct 9 10'],
    ['Vintens i cinquantens', 'pct 1 20 | pct 3 20 | pct 1 25 | pct 7 50 | pct 11 20'],
    ['La bateria', `pct 1 2 : La bateria de la tauleta està a la meitat. Quin tant per cent marca?
      | pct 1 4 : Només queda 1/4 de bateria. Quin tant per cent és?
      | pct 3 4 : S'ha carregat fins a 3/4. Quin tant per cent marca?
      | pct 1 10 : Queda 1/10 de bateria: cal endollar-la! Quin tant per cent és?
      | pct 4 5 : La descàrrega del joc va per 4/5. Quin tant per cent porta?`],
    ['Rebaixes', `of 1 2 30 € : Rebaixes del 50 %: la meitat de preu. Quants euros es descompten d'un joc de 30 €?
      | of 1 4 20 € : Un 25 % de descompte és 1/4 del preu. Quants euros són d'una samarreta de 20 €?
      | of 1 10 50 € : Un 10 % és 1/10. Quants euros es descompten d'uns patins de 50 €?
      | of 1 5 40 € : Un 20 % és 1/5. Quants euros es descompten d'una motxilla de 40 €?
      | of 3 4 80 € : Un 75 % és 3/4. Quants euros es descompten d'una bici de 80 €?`],
    ['Sense dibuix', 'dec 3 5 h | pct 3 5 h | dec 4 5 h | pct 9 20 h | dec 75 100 h'],
    ['Repte', 'pct 3 25 h | dec 1 20 h | pct 49 50 h | dec 3 20 h | pct 17 20 h']),
  proj("La festa de l'estany", 'Fraccions de veritat: menjar, diners i rellotges', ['equal', 'paint', 'name', 'line', 'cmp', 'same', 'fill', 'join', 'mix', 'add', 'times', 'of', 'pct', 'dec'],
    ['Les pizzes', `name pizza 3 8 : A la festa hi ha una pizza tallada en 8. Quina fracció té pepperoni?
      | paint pizza 3 4 : La granota vol 3/4 de la pizza amb pepperoni. Prepara-la i prem Comprova.
      | cmp 1 2 3 8 : Mitja pizza o 3/8 de pizza: on n'hi ha més?
      | add 3 8 2 8 8 : Se n'han menjat 3/8 al migdia i 2/8 al vespre. Quants vuitens en total?
      | sub 8 8 5 8 8 : La pizza sencera són 8/8 i se n'han menjat 5/8. Quants vuitens en queden?`],
    ['El suc', `paint jug 3 4 : Omple la gerra de suc de taronja fins a 3/4 i prem Comprova.
      | name jug 2 5 : Fins a quina fracció està plena la gerra de llimonada?
      | of 1 4 1000 ml : La gerra fa 1000 ml. Quants mil·lilitres hi ha si està plena fins a 1/4?
      | times 4 1 4 : Cada got fa 1/4 de litre. Quants quarts de litre són 4 gots?
      | cmp 2 3 3 4 : Una gerra plena fins a 2/3 i una altra fins a 3/4. Quina té més suc?`],
    ['El pastís', `equal choc 6 1 : Cal partir la rajola de xocolata en 6 parts iguals. Quina està ben partida?
      | of 3 4 200 g : El pastís porta 3/4 d'un paquet de 200 g de sucre. Quants grams són?
      | add 1 4 1 2 4 : Hi van 1/4 de litre de llet i 1/2 litre de nata. Quants quarts de litre de líquid són?
      | name choc 5 12 : La rajola té 12 preses i n'hi ha de xocolata blanca. Quina fracció és blanca?
      | join bar 6 12 h : S'han fet servir 6 dels 12 ous de l'ouera: 6/12. Simplifica-ho.`],
    ['Els diners', `of 1 2 50 € : Per comprar el regal es paga la meitat de 50 €. Quants euros són?
      | dec 1 2 : Mig euro, com s'escriu amb decimals?
      | dec 1 4 : I un quart d'euro?
      | of 3 4 40 € : De 40 € estalviats, 3/4 van al regal. Quants euros són?
      | pct 1 5 : La botiga descompta 1/5 del preu. Quin tant per cent és?`],
    ['El rellotge', `name clock 1 4 : La festa ha començat fa una estona. Quina fracció de l'hora ha passat?
      | of 3 4 60 min : Falten tres quarts d'hora per al pastís. Quants minuts són?
      | join bar 20 60 h : Han passat 20 minuts de 60: 20/60. Quina fracció de l'hora és, simplificada?
      | add 1 4 2 4 4 : Un quart d'hora de jocs i dos quarts de ball. Quants quarts d'hora en total?
      | mix pizza 5 4 h : La festa dura 5/4 d'hora. Quantes hores senceres són, i quants quarts més?`],
    ['La cursa', `put 3 4 : La cursa de granotes va del 0 a l'1. Porta la granota fins als 3/4 del camí i prem Comprova.
      | read 2 5 : On s'ha aturat la granota? Escriu la fracció del camí.
      | of 2 5 10 km : El camí fa 10 km. Quants quilòmetres són 2/5 del camí?
      | cmp 7 10 3 4 h : Una granota ha fet 7/10 del camí i una altra, 3/4. Quina fracció és més gran?
      | put 5 4 2 : La cursa llarga passa de l'1! Porta la granota fins a 5/4 i prem Comprova.`],
    ['La cuina', `fill 1 2 2 4 N : La recepta vol 1/2 got de sucre, i només hi ha la mesura d'1/4. Quants quarts calen?
      | times 3 2 3 : Per fer 3 coques calen 2/3 de got de farina per a cada una. Quants terços de got són?
      | mix pizza 7 3 h : 7/3 de got de farina: quants gots sencers són, i quants terços més?
      | of 2 3 300 g : Cal 2/3 d'un paquet de 300 g de mantega. Quants grams són?
      | sub 3 4 1 4 4 : Hi havia 3/4 de litre de llet i la recepta en gasta 1/4. Quants quarts en queden?`],
    ['Les rebaixes', `pct 1 2 : Tot a meitat de preu! Quin tant per cent de descompte és?
      | of 1 4 60 € : Un 25 % de descompte és 1/4. Quants euros es descompten de 60 €?
      | dec 3 4 : Un xiclet val 3/4 d'euro. Com s'escriu amb decimals?
      | pct 3 10 : El descompte és de 3/10 del preu. Quin tant per cent és?
      | of 9 10 20 € : Amb un 10 % de descompte es paga 9/10 del preu. Quants euros es paguen per un joc de 20 €?`],
    ['El berenar', `of 1 3 12 galetes : Hi ha 12 galetes i la granota se'n queda 1/3. Quantes galetes són?
      | of 3 4 24 globus : Dels 24 globus, 3/4 són grocs. Quants globus grocs hi ha?
      | same 2 4 3 6 : Mig pastís: és el mateix 2/4 que 3/6?
      | paint eggs 4 6 : Per a la truita calen 4/6 de l'ouera. Posa-hi els ous i prem Comprova.
      | sub 12 12 7 12 12 : La coca sencera són 12/12 i se n'han menjat 7/12. Quants dotzens en queden?`],
    ['La gran final', `add 1 2 1 4 : Mitja pizza i un quart de pizza més. Quina fracció de pizza és?
      | join pizza 6 8 : Queden 6/8 de pizza. Simplifica-ho: ajunta parts i escriu la fracció.
      | of 2 3 90 min : La festa dura 2/3 de 90 minuts. Quants minuts dura?
      | cmp 3 5 5 8 h : 3/5 de got de suc o 5/8 de got: quina fracció és més gran?
      | pct 9 10 : La festa ha estat un èxit: 9/10 dels jocs acabats. Quin tant per cent és?`])
];

/* ---------- answers ---------- */
// the answer is typed as a fraction, typed as one number, built on the figure and checked, or picked with one touch
export const kindOf = q => ({ name: 'frac', join: 'frac', mix: 'frac', cut: 'num', fill: 'num', imp: 'num', times: 'num', of: 'num', pct: 'num', paint: 'check', equal: 'pick', cmp: 'pick', same: 'pick', dec: 'pick' })[q.mode]
  || (q.mode === 'line' ? (q.ask === 'read' ? 'frac' : 'check') : q.D ? 'num' : 'frac');
// a sum or a difference over the lowest denominator both fractions can have: [what comes out, that denominator, a over it, c over it]
export function sumOf(q) { const L = lcm(q.b, q.d), A = q.a * L / q.b, C = q.c * L / q.d; return [q.op === '+' ? A + C : A - C, L, A, C]; }
// the three decimals to choose from: the right one and two that are tempting, the right one never in the same place
export function decOpts(q) {
  const { n, d } = q, ok = deci(n, d), val = s => +s.replace(',', '.'), wrong = [];
  for (const c of [`0,${n}`, `${n},${d}`, fmt(n / d / 10, 3), `0,${d}`, fmt(n / d * 10)]) if (wrong.length < 2 && val(c) !== val(ok) && !wrong.includes(c)) wrong.push(c);
  wrong.splice((n + d) % 3, 0, ok);
  return wrong;
}
// the right answer: a number, a sign, true or false, a decimal as text, or [numerator, denominator] ([wholes, numerator] for 'mix')
export function want(q) {
  switch (q.mode) {
    case 'equal': return q.at;
    case 'paint': return q.n;
    case 'name': return [q.n, q.d];
    case 'line': return q.ask === 'put' ? q.n : [q.n, q.d];
    case 'cmp': return sign(q.a, q.b, q.c, q.d);
    case 'same': return q.a * q.d === q.c * q.b;
    case 'cut': return q.n * q.k;
    case 'fill': return q[q.miss];
    case 'join': { const g = gcd(q.n, q.d); return [q.n / g, q.d / g]; }
    case 'imp': return q.w * q.d + q.n;
    case 'mix': return [Math.floor(q.a / q.d), q.a % q.d];
    case 'add': { const [s, L] = sumOf(q), g = gcd(s, L); return q.D ? s * q.D / L : [s / g, L / g]; }
    case 'times': return q.k * q.n;
    case 'of': return q.T / q.d * q.n;
    case 'pct': return q.n * 100 / q.d;
    case 'dec': return deci(q.n, q.d);
  }
}
// a sum written whole is right as any fraction that is worth the same
export function right(q, ans) {
  if (q.mode === 'add' && !q.D) { const [n, d] = want(q); return Array.isArray(ans) && ans[1] > 0 && ans[0] * d === ans[1] * n; }
  return String(want(q)) === String(ans);
}

/* ---------- questions made at random: the exams and the lightning round ---------- */
const int = (rnd, lo, hi) => lo + Math.min(hi - lo, Math.max(0, Math.floor(rnd() * (hi - lo + 1)) || 0));
const one = (rnd, list) => list[int(rnd, 0, list.length - 1)];
// a fraction below 1 in lowest terms, its denominator between lo and hi
function low(rnd, lo, hi) { for (;;) { const d = int(rnd, lo, hi), n = int(rnd, 1, d - 1); if (gcd(n, d) === 1) return [n, d]; } }
// one generator for each project, inside the limits of its levels; i is the place of the question, which decides its kind
const GEN = [
  (r, i) => { if (i % 2) { const d = int(r, 2, 8); return { mode: 'paint', shape: one(r, ['pizza', 'choc', 'pad', 'eggs', 'jug']), n: int(r, 1, d), d }; }
    return { mode: 'equal', shape: one(r, ['pizza', 'choc', 'pad', 'bar']), d: one(r, [2, 3, 4, 5, 6, 8]), at: int(r, 0, 2) }; },
  (r, i) => { const d = int(r, 2, 12); return { mode: i % 2 ? 'name' : 'paint', shape: one(r, ['pizza', 'choc', 'pad', 'bar', 'eggs', 'bugs']), n: int(r, 1, d), d }; },
  (r, i) => { const d = int(r, 2, 12); return i % 2 ? { mode: 'line', ask: 'read', n: int(r, 1, d), d, max: 1 } : { mode: 'line', ask: 'put', n: int(r, 0, d), d, max: 1 }; },
  (r, i) => { const hide = i >= 3, d = int(r, 3, 12);
    if (i % 3 === 0) return { mode: 'cmp', a: int(r, 1, d), b: d, c: int(r, 1, d), d, hide };
    if (i % 3 === 1) { const n = int(r, 1, 5); return { mode: 'cmp', a: n, b: int(r, n + 1, 12), c: n, d: int(r, n + 1, 12), hide }; }
    return { mode: 'cmp', a: int(r, 1, d - 1), b: d, c: 1, d: 2, hide }; },
  (r, i) => { const d = int(r, 2, 5), w = int(r, 1, 3), n = int(r, 1, d - 1), hide = i >= 3;
    if (i % 3 === 0) return { mode: 'imp', shape: 'pizza', w, n, d, hide };
    if (i % 3 === 1) return { mode: 'mix', shape: 'pizza', a: w * d + n, d, hide };
    const e = int(r, 2, 4); return { mode: 'line', ask: 'read', n: int(r, e + 1, 2 * e - 1), d: e, max: 2 }; },
  r => { const shape = one(r, ['pizza', 'bar', 'choc']), [n, d] = low(r, 2, shape === 'pizza' ? 6 : 5);
    return { mode: 'cut', shape, n, d, k: one(r, [2, 3, 4, 5, 6, 8, 9, 10].filter(k => d * k <= ROOM[shape] && (shape !== 'choc' || k <= 6))) }; },
  r => { const [n, d] = low(r, 2, 10), k = int(r, 2, 9); return { mode: 'fill', n, d, N: n * k, D: d * k, miss: one(r, ['N', 'D']), hide: true }; },
  (r, i) => { const [n, d] = low(r, 2, 8), k = int(r, 2, 5);
    return i % 2 ? { mode: 'fill', n: n * k, d: d * k, N: n, D: d, miss: one(r, ['N', 'D']), hide: true } : { mode: 'join', shape: 'bar', n: n * k, d: d * k, hide: true }; },
  (r, i) => { const [a, b] = low(r, 2, 8);
    if (i % 2) { const k = int(r, 2, 3); if (r() < 0.25) return { mode: 'cmp', a, b, c: a * k, d: b * k, hide: true };
      for (;;) { const [c, d] = low(r, 2, 8); if (d !== b) return { mode: 'cmp', a, b, c, d, hide: true }; } }
    const k1 = int(r, 1, 3), k2 = k1 + int(r, 1, 2), off = r() < 0.5 ? 0 : 1;
    return { mode: 'same', a: a * k1, b: b * k1, c: a * k2 + off, d: b * k2, hide: true }; },
  (r, i) => { const b = int(r, 2, 6), d = i % 3 === 1 ? b * int(r, 2, 3) : b, a = int(r, 1, b - 1), c = int(r, 1, d - 1), L = lcm(b, d);
    return { mode: 'add', op: a * d > c * b && r() < 0.5 ? '−' : '+', a, b, c, d, D: i % 3 === 2 ? 0 : L, hide: i >= 3 }; },
  (r, i) => { const d = int(r, 2, 10); return { mode: 'of', n: i % 2 ? 1 : int(r, 1, d - 1), d, T: d * int(r, 2, 10), unit: one(r, ['€', 'ous', 'cromos', 'g', 'km', 'galetes']), hide: i >= 3 }; },
  (r, i) => { const [n, d] = low(r, 2, 9); return { mode: 'times', k: int(r, 2, 5), n, d, hide: i >= 3 }; },
  (r, i) => { const d = one(r, i % 2 ? [2, 4, 5, 10, 20, 25, 50] : [2, 4, 5, 10]); return { mode: i % 2 ? 'pct' : 'dec', n: int(r, 1, d - 1), d, hide: i >= 3 }; },
  (r, i) => GEN[int(r, 3, 12)](r, i)
];
// one question of project p that has not come out yet (seen is a Set of the ones that have) and that passes ok, a test; it carries p
function draw(p, rnd, i, seen, ok = () => true) {
  for (let n = 0; ; n++) { const q = GEN[p](rnd, i + n), key = JSON.stringify({ ...q, at: 0 }); if (ok(q) && (n > 200 || !seen.has(key))) { seen.add(key); return { ...q, p }; } }
}

/* ---------- the cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the laboratory, the concert and the abacus: a Piscina to get in, a map of five
// circles, a mark for each project, an exam for each circle, XP and badges.
export const CIRCLES = [
  { name: 'Què és una fracció', projects: [0, 1, 2] },
  { name: "Comparar i passar de l'1", projects: [3, 4] },
  { name: 'Fraccions que valen el mateix', projects: [5, 6, 7, 8] },
  { name: 'Operacions', projects: [9, 10, 11] },
  { name: 'Al món real', projects: [12, 13] }
];
export const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
// the three questions of the Piscina, the first challenges
export const POOL = ['equal pizza 4 1', 'paint choc 1 2', 'name pizza 3 4'].map(parse);
// the ten levels of a project are three exercises: ex00 (three levels), ex01 (three) and ex02 (four)
export const exOf = idx => idx < 3 ? 0 : idx < 6 ? 1 : 2;
// slips are wrong answers plus hints asked
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
// What a level gives to the mark of its project, by its stars: 10 with no slip, 8 with one or two, 5 with more. Ten levels make 100,
// and a project is validated with 80
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;
// the seconds of a lightning round
export const RAPID = 60;

// What is saved is facts only: { so, lv[140], piscina, exams[5], fulls, rapid, ratxa }. lv is the best stars of each level, rapid the
// most right answers in a lightning round and ratxa the longest run of right answers. Marks, XP, level and badges are worked out, never stored.
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// Before the cursus the game had eight sections of ten screens and kept their stars in `stars`: each is now the project at this place
const OLD = [0, 1, 2, 3, 5, 6, 7, 8];
// A complete progress inside its limits from any value at all; a new object. It only ever raises: whoever played before the cursus
// keeps the stars of those screens and has the Piscina done
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {}, lv = slots(o.lv, PROJECTS.length * 10).map(s => within(s, 3));
  if (Array.isArray(o.stars)) OLD.forEach((p, s) => { for (let i = 0; i < 10; i++) lv[p * 10 + i] = Math.max(lv[p * 10 + i], within(o.stars[s * 10 + i], 3)); });
  return { so: o.so !== false, lv, piscina: o.piscina === true || lv.some(s => s > 0), exams: slots(o.exams, CIRCLES.length).map(e => e === true),
    fulls: Math.max(0, whole(o.fulls)), rapid: Math.max(0, whole(o.rapid)), ratxa: Math.max(0, whole(o.ratxa)) };
}
const copy = p => ({ ...p, lv: p.lv.slice(), exams: p.exams.slice() });
// the functions below take a progress that is already clean
export const noteOf = (p, i) => p.lv.slice(i * 10, i * 10 + 10).reduce((s, n) => s + POINTS[n], 0);
// how many levels of a project are done from the first on: the one after them is the next to open
export const reached = (p, i) => { const k = p.lv.slice(i * 10, i * 10 + 10).findIndex(n => n === 0); return k < 0 ? 10 : k; };
export const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 2120 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 14,13
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina and the others with the exam before them
export const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer projecte', what: 'Valida un projecte.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 10', what: 'Encerta 10 preguntes seguides a la primera.' },
  { name: 'Ull de falcó', what: "Troba bé les errades d'un full." },
  { name: 'Deu fulls', what: "Corregeix bé deu fulls d'errades." },
  { name: 'Llampec', what: 'Encerta 12 preguntes en un repte llampec.' },
  { name: 'Cursus complet', what: 'Supera els cinc exàmens.' }
];
export const badges = p => [p.piscina === true, validated(p).length > 0, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 10, p.fulls >= 1, p.fulls >= 10, p.rapid >= 12, p.exams.every(e => e === true)];
const earned = (p, next) => { const had = badges(p), now = badges(next); return BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name); };

// A level done, with its slips (a hint is a slip too). Returns { prog, n, note, gain, valid, exam, news }: prog is a NEW progress
// that keeps the best stars of the level; n the stars of this time; note the mark of the project after it; gain the XP it adds;
// valid whether the project is validated by this very level, and exam whether that opens the exam of its circle; news the badges it earns
export function levelIn(p, i, idx, slips) {
  const n = starsFor(slips), k = i * 10 + idx, next = copy(p), c = circleOf(i);
  next.lv[k] = Math.max(next.lv[k], n);
  return { prog: next, n, note: noteOf(next, i), gain: xpOf(next) - xpOf(p), valid: noteOf(p, i) < VALID && noteOf(next, i) >= VALID,
    exam: !examOpen(p, c) && examOpen(next, c), news: earned(p, next) };
}
// a run of n right answers in a row, and the right answers of a lightning round: each keeps the best. Returns { prog, best, news }
const keep = field => (p, n) => { const next = copy(p), best = whole(n) > p[field]; if (best) next[field] = whole(n); return { prog: next, best, news: earned(p, next) }; };
export const streakIn = keep('ratxa');
export const rapidIn = keep('rapid');

/* ---------- the exam, the lightning round and «Caça l'errada» ---------- */
// Chance enters only through rnd (a function like Math.random). A whole number below n, clamped
const at = (n, rnd) => int(rnd, 0, n - 1);
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Six different questions of the projects of circle c, new every time, at least one of each project, in a random order; each has p,
// its project. A circle that does not exist gives the first
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, seen = new Set(), list = [];
  while (list.length < 6) list.push(draw(list.length < ps.length ? ps[list.length] : ps[at(ps.length, rnd)], rnd, list.length, seen));
  return shuffle(list, rnd);
}
// The hand-in of a finished exam: qs its six questions and run one boolean per question. Returns { prog, good, score, gain, redo, news }:
// prog is a NEW progress with exams[c] set when the exam passes (EXAM_PASS of 6, the exam open), never taken back; redo the projects of the questions missed
export function examIn(p, c, qs, run) {
  const score = run.filter(r => r === true).length, good = run.length === 6 && score >= EXAM_PASS && examOpen(p, c), next = copy(p);
  if (good) next.exams[c] = true;
  return { prog: next, good, score, gain: xpOf(next) - xpOf(p), news: earned(p, next),
    redo: [...new Set(qs.flatMap((q, i) => run[i] !== true && Number.isInteger(q?.p) ? [q.p] : []))].sort((a, b) => a - b) };
}
// The n questions of a lightning round: of the validated projects (of the first circle while there is none), none of them built on the figure
export function sprint(p, rnd, n = 40) {
  const v = validated(p), ps = v.length ? v : CIRCLES[0].projects, seen = new Set();
  return Array.from({ length: n }, (_, i) => draw(ps[at(ps.length, rnd)], rnd, i, seen, q => kindOf(q) !== 'check'));
}

// The five things a sheet can say, each { kind, says, real, opts, ... }: says is the value written on the sheet, real the true one
// (the claim is wrong when they differ) and opts the values to choose from when fixing it, all as text. The mistakes are the ones that teach:
// the parts chosen over the ones left, a number added dalt i baix instead of multiplied, the bigger denominator taken for the bigger
// fraction, denominators added in a sum, and one part taken for several.
const three = (a, rnd) => shuffle([...new Set(a)].slice(0, 3), rnd);
const CLAIM = {
  name(bad, rnd) {
    const d = 4 + at(5, rnd), n = 1 + at(d - 2, rnd), real = `${n}/${d}`, rest = `${n}/${d - n}`, says = bad ? [rest, `${d}/${n}`][at(2, rnd)] : real;
    return { n, d, shape: ['pizza', 'choc'][at(2, rnd)], says, real, opts: three([says, real, rest, `${d}/${n}`], rnd) };
  },
  equiv(bad, rnd) {
    const [a, b] = low(rnd, 2, 6), k = 2 + at(3, rnd), real = `${a * k}/${b * k}`, plus = `${a + k}/${b + k}`, says = bad ? plus : real;
    return { a, b, k, says, real, opts: three([says, real, plus, `${a * k}/${b}`], rnd) };
  },
  cmp(bad, rnd) {
    const a = 1 + at(3, rnd), x = a + 1 + at(4, rnd), y = x + 1 + at(4, rnd), flip = at(2, rnd) === 1, real = flip ? '<' : '>', says = bad ? (flip ? '>' : '<') : real;
    return { a, b: flip ? y : x, c: a, d: flip ? x : y, says, real, opts: ['<', '=', '>'] };
  },
  add(bad, rnd) {
    const d = 5 + at(6, rnd), a = 1 + at(2, rnd), c = 1 + at(2, rnd), real = `${a + c}/${d}`, both = `${a + c}/${2 * d}`, says = bad ? both : real;
    return { a, c, d, says, real, opts: three([says, real, both, `${a + c + 1}/${d}`], rnd) };
  },
  of(bad, rnd) {
    const d = 3 + at(4, rnd), n = 2 + at(d - 2, rnd), each = 2 + at(5, rnd), T = d * each, real = String(each * n), part = String(each), rest = String(T - each * n);
    const says = bad ? (rest !== real && at(2, rnd) ? rest : part) : real;
    return { n, d, T, says, real, opts: three([says, real, part, rest, String(each * n + each)], rnd).sort((x, y) => x - y) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd) }));
}
// The hand-in of a finished sheet: run has one boolean per claim. Returns { prog, good, gain, missed, news }: prog is a NEW progress
// with fulls + 1 only when all three are right; gain the XP that adds (0 once the cap of 3 per validated project is reached)
export function sheetIn(p, run) {
  const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3, next = copy(p);
  if (good) next.fulls = p.fulls + 1;
  return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: earned(p, next) };
}

// Where the cuts of a figure of D equal parts fall, as shares of the whole, each with its class. was is the number of parts before
// the last cut or join: a cut that was not there is 'new', one just joined away is 'gone'. When neither grid fits inside the other
// (the child cut past the goal and the answer is being shown) there is nothing to animate: only the cuts of D.
export function cuts(D, was = D) {
  const M = Math.max(D, was), m = Math.min(D, was), out = [];
  if (M % m) return cuts(D);
  if (M > 1) for (let j = 0; j < M; j++) out.push([j / M, m > 1 && (j * m) % M === 0 ? '' : D > m ? 'new' : 'gone']);
  return out;
}
// the cuts, in order, that leave every part cut in k with the scissors there are: in 2, in 3 and in 5
export function snips(k) { const out = []; for (const p of [2, 3, 5]) while (k % p === 0) { out.push(p); k /= p; } return out; }

/* ---------- what the game says ---------- */
// how each figure asks to choose some of its parts, and to name the ones chosen
export const SKIN = {
  pad: [f => `Il·lumina ${f} del nenúfar`, 'Quina fracció del nenúfar està il·luminada?'],
  pizza: [f => `Posa pepperoni a ${f} de la pizza`, 'Quina fracció de la pizza té pepperoni?'],
  clock: [f => `Pinta ${f} de l'hora`, "Quina fracció de l'hora ha passat?"],
  bar: [f => `Pinta ${f} de la passarel·la`, 'Quina fracció de la passarel·la està pintada?'],
  choc: [f => `Fes de xocolata blanca ${f} de la rajola`, 'Quina fracció de la rajola és de xocolata blanca?'],
  jug: [f => `Omple la gerra de suc fins a ${f}`, 'Fins a quina fracció està plena la gerra?'],
  eggs: [f => `Omple ${f} de l'ouera`, "Quina fracció de l'ouera té ous?"],
  bugs: [f => `Encén ${f} de les cuques de llum`, 'Quina fracció de les cuques està encesa?']
};
const half = b => b % 2 ? `${(b - 1) / 2} i mig` : `${b / 2}`;
const parts = n => n === 1 ? '1 part és' : `${n} parts són`;
const whole1 = w => w === 1 ? '1 sencer' : `${w} sencers`;
export function tipFor(q) {
  if (q.story) return q.story + (q.mode === 'cmp' ? ' Tria <, = o >.' : q.mode === 'same' ? ' Tria Sí o No.' : '');
  switch (q.mode) {
    case 'equal': return `Toca la figura que està partida en ${q.d} parts iguals.`;
    case 'paint': return `${SKIN[q.shape][0](`${q.n}/${q.d}`)}: toca les parts i després prem Comprova.`;
    case 'name': return `${SKIN[q.shape][1]} A dalt, les parts triades; a baix, totes les parts.`;
    case 'line': return q.ask === 'put' ? `Porta la granota fins a ${q.n}/${q.d}: toca un nenúfar i després prem Comprova.` : `On és la granota? Escriu la fracció.${q.max > 1 ? " Compte, que ha passat de l'1!" : ''}`;
    case 'cmp': return 'Quina és més gran? Tria <, = o >.';
    case 'same': return 'Valen el mateix? Tria Sí o No.';
    case 'cut': return `Talla les parts fins a tenir-ne ${q.d * q.k} i escriu quantes n'hi ha de triades.`;
    case 'fill': return 'Troba el número que falta perquè totes dues valguin el mateix.';
    case 'join': return q.hide ? 'Simplifica la fracció tant com puguis.' : 'Simplifica: ajunta parts fins que no es pugui més i escriu la fracció.';
    case 'imp': return q.n ? `Hi ha ${whole1(q.w)} i ${q.n}/${q.d} més. Quantes parts d'1/${q.d} són, totes juntes?` : `Hi ha ${whole1(q.w)}. Quantes parts d'1/${q.d} són?`;
    case 'mix': return `${q.a}/${q.d} és més d'un sencer. Escriu quants sencers fa i quantes parts sobren.`;
    case 'add': return q.op === '+' ? (q.D ? 'Suma les dues fraccions: quantes parts són, juntes?' : 'Suma les dues fraccions i escriu la que surt.') : (q.D ? 'Resta: quantes parts queden?' : 'Resta i escriu la fracció que queda.');
    case 'times': return `${q.k} vegades ${q.n}/${q.d}: quantes parts d'1/${q.d} són?`;
    case 'of': return `Quant és ${q.n}/${q.d} de ${q.T} ${q.unit}?`;
    case 'pct': return `Quin tant per cent és ${q.n}/${q.d}? De cada 100, quants?`;
    default: return `Quin decimal val el mateix que ${q.n}/${q.d}?`;
  }
}
// What to say after a wrong answer or a hint: first what to look at, then the whole reasoning. ans is the wrong answer, when there is one.
export function explain(q, deep, ans) {
  const { n, d } = q;
  switch (q.mode) {
    case 'equal': return deep ? `És la ${['primera', 'segona', 'tercera'][q.at]} figura: només allà les ${d} parts són igual de grans.` : 'Mira-ho bé: totes les parts han de ser igual de grans.';
    case 'paint': return (ans != null ? `N'has triat ${ans}. ` : '') + (deep ? `Cal triar ${n} de les ${d} parts.` : `El número de baix diu quantes parts hi ha: ${d}. El de dalt, quantes n'has de triar.`);
    case 'name': if (ans && ans[0] === d && ans[1] === n && n !== d) return `Al revés! A dalt van les parts triades (${n}) i a baix, totes (${d}).`;
      return deep ? `Hi ha ${d} parts en total, que van a baix, i ${n === 1 ? "n'hi ha 1 de triada, que va" : `n'hi ha ${n} de triades, que van`} a dalt: ${n}/${d}.` : 'Compta totes les parts: aquest número va a baix. Compta les triades: aquest va a dalt.';
    case 'line': if (q.ask === 'put') return deep ? `Compta ${n} ${n === 1 ? 'salt' : 'salts'} des del 0 i arribaràs a ${n}/${d}.` : `Del 0 a l'1 hi ha ${d} salts iguals. Quants n'ha de fer la granota?`;
      if (ans && ans[1] && ans[0] * d === ans[1] * n && !right(q, ans)) return `${ans[0]}/${ans[1]} val el mateix, però aquest camí està tallat en ${d} salts per cada sencer.`;
      return deep ? `Del 0 a l'1 hi ha ${d} salts i la granota n'ha fet ${n}: ${n}/${d}.` : "A baix, quants salts hi ha del 0 a l'1. A dalt, quants n'ha fet la granota.";
    case 'cmp': { const { a, b, c } = q, s = sign(a, b, c, d), L = lcm(b, d), end = `${a}/${b} ${s} ${c}/${d}.`;
      if (a === b || c === d) return deep ? `${a === b ? `${a}/${b} és tot sencer` : `${a}/${b} no arriba a tot sencer`}, i ${c === d ? `${c}/${d} ${a === b ? 'també' : 'és tot sencer'}` : `${c}/${d} no hi arriba`}: ${end}` : 'Quan el de dalt i el de baix són iguals, hi ha totes les parts: és 1 sencer.';
      if (b === d) return deep ? `Les parts són igual de grans, i ${parts(a)} ${s === '=' ? 'les mateixes que' : s === '<' ? 'menys que' : 'més que'} ${c}: ${end}` : 'Tenen el mateix número a baix: les parts són igual de grans. Qui en té més?';
      if (a === c) return deep ? `Partit en ${Math.min(b, d)} surten parts més grans que partit en ${Math.max(b, d)}: ${end}` : 'Tenen el mateix número a dalt. Com més gran és el de baix, més petites són les parts!';
      if (c === 1 && d === 2) return deep ? `La meitat de ${b} és ${half(b)}, i ${a} ${s === '=' ? 'és just això' : s === '<' ? 'és menys' : 'és més'}: ${end}` : `Quantes parts són la meitat de ${b}? En té més o menys, aquesta fracció?`;
      return deep ? `${[[a, b], [c, d]].filter(f => f[1] !== L).map(([x, y]) => `${x}/${y} = ${x * L / y}/${L}`).join(' i ')}. Per tant, ${end}` : `Busca fraccions equivalents amb el mateix número a baix: totes dues poden tenir ${L}.`; }
    case 'same': { const { a, b, c } = q, g = gcd(a, b), h = gcd(c, d), u = `${a / g}/${b / g}`, v = `${c / h}/${d / h}`;
      if (!deep) return 'Simplifica totes dues tant com puguis. Arribes a la mateixa fracció?';
      return u === v ? `Totes dues valen ${u}: són equivalents.` : g === 1 && h === 1 ? `${u} i ${v} ja no es poden simplificar i són diferents: no valen el mateix.` : `Simplificades queden ${u} i ${v}: no valen el mateix.`; }
    case 'cut': { const s = snips(q.k);
      return deep ? `Cada part s'ha tallat en ${q.k}: ${n} × ${q.k} = ${n * q.k} de triades, de ${d} × ${q.k} = ${d * q.k}.`
        : `${s.length > 1 ? `Fes ${s.length} talls seguits: en ${s.join(' i després en ')}` : `Talla cada part en ${q.k}`}, i en tindràs ${d * q.k}. Després compta les triades.`; }
    case 'fill': { const up = q.D > d, k = up ? q.D / d : d / q.D, op = up ? '×' : '÷', verb = up ? 'multiplicat' : 'dividit';
      if (deep) return `${n} ${op} ${k} = ${q.N} i ${d} ${op} ${k} = ${q.D}: ${n}/${d} = ${q.N}/${q.D}.`;
      return q.miss === 'N' ? `A baix, el ${d} s'ha ${verb} per ${k}. Fes el mateix a dalt.` : `A dalt, el ${n} s'ha ${verb} per ${k}. Fes el mateix a baix.`; }
    case 'join': { const g = gcd(n, d);
      if (ans && ans[1] && ans[0] * d === ans[1] * n && !right(q, ans)) return `${ans[0]}/${ans[1]} val el mateix, però encara es pot simplificar més.`;
      return deep ? `${n} ÷ ${g} = ${n / g} i ${d} ÷ ${g} = ${d / g}: ${n}/${d} = ${n / g}/${d / g}.` : `Busca un número que divideixi el ${n} i el ${d} alhora.`; }
    case 'imp': return deep ? `${q.w} × ${d} = ${q.w * d}${n ? `, i ${n} més fan ${q.w * d + n}` : ''}: són ${q.w * d + n}/${d}.` : `Cada sencer són ${d}/${d}: ${d} parts. Quantes parts fan ${whole1(q.w)}?${n ? ` Després suma-hi les ${n} que hi ha a part.` : ''}`;
    case 'mix': { const [w, r] = want(q);
      return deep ? `${q.a} ÷ ${d} = ${w} i en sobren ${r}: ${q.a}/${d} = ${w} i ${r}/${d}.` : `Cada ${d} parts fan un sencer. Quants sencers surten de ${q.a} parts? I quantes en sobren?`; }
    case 'add': { const { a, b, c } = q, [s, L, A, C] = sumOf(q), plus = q.op === '+', verb = plus ? 'sumar' : 'restar';
      if (ans && ans[1] === b + d && b === d) return `No ${plus ? 'sumis' : 'restis'} els de baix! Les parts continuen sent igual de grans: el de baix es queda en ${b}.`;
      if (b === d) return deep ? `${a} ${q.op} ${c} = ${s}, i el de baix no canvia: ${s}/${b}.` : `Les parts són igual de grans: només cal ${verb} els de dalt. El de baix no canvia!`;
      return deep ? `${[[a, b, A], [c, d, C]].filter(f => f[1] !== L).map(([x, y, z]) => `${x}/${y} = ${z}/${L}`).join(' i ')}. Ara sí: ${A} ${q.op} ${C} = ${s}, sobre ${L}.`
        : `Les parts no són igual de grans: primer cal el mateix número a baix. Totes dues poden tenir ${L}.`; }
    case 'times': return deep ? `${q.k} × ${n} = ${q.k * n}, i el de baix no canvia: ${q.k * n}/${d}.` : `${q.k} vegades ${n}/${d} és sumar ${n}/${d} ${q.k} cops. Les parts continuen sent de la mateixa mida.`;
    case 'of': { const each = q.T / d;
      return deep ? `${q.T} ÷ ${d} = ${each}${n > 1 ? `, i ${n} parts són ${n} × ${each} = ${each * n}` : ''}: ${each * n} ${q.unit}.` : `Primer reparteix ${q.T} en ${d} parts iguals: quant val una part?${n > 1 ? ` Després agafa'n ${n}.` : ''}`; }
    case 'pct': { const k = 100 / d;
      return deep ? (d === 100 ? `${n}/100 ja és de cada 100: ${n} %.` : `${d} × ${k} = 100 i ${n} × ${k} = ${n * k}: ${n}/${d} = ${n * k}/100 = ${n * k} %.`) : 'Tant per cent vol dir «de cada 100». Busca la fracció equivalent amb 100 a baix.'; }
    default: { const t = 10 % d ? 100 : 10, k = t / d;
      return deep ? `${d === t ? '' : `${n}/${d} = ${n * k}/${t}, i `}${n * k} ${t === 10 ? (n * k === 1 ? 'desè' : 'desens') : (n * k === 1 ? 'centèsim' : 'centèsims')} s'escriu ${deci(n, d)}.`
        : `Després de la coma van els desens i els centèsims. Busca la fracció equivalent amb ${t} a baix.`; }
  }
}
