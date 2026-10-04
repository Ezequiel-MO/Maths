import { pentatonic } from '../../shared/audio.js';

export const GRIDS = [3, 4, 5, 6], MINLEN = 2, MAXLEN = 5, LIVES = 3;
// a sequence never lights the same tile twice
export function makeSeq(cells, len, rand = Math.random) {
  const pool = Array.from({ length: cells }, (_, i) => i), out = [];
  while (out.length < len) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}
export const begin = () => ({ lvl: 0, len: MINLEN, lives: LIVES, score: 0, up: false, won: false, over: false });
// one round played: a miss costs a life and keeps the length; a hit grows the series, and after MAXLEN the grid gets finer
export function step(s, ok) {
  if (!ok) { const lives = s.lives - 1; return { ...s, lives, up: false, over: lives <= 0 }; }
  const score = s.score + s.len * (s.lvl + 1) * 10;
  if (s.len < MAXLEN) return { ...s, score, len: s.len + 1, up: false };
  if (s.lvl === GRIDS.length - 1) return { ...s, score, up: false, won: true, over: true };
  return { ...s, score, lvl: s.lvl + 1, len: MINLEN, up: true };
}
// colour and pitch follow the position: green and low at the bottom left, pink and high at the top right
export const hueOf = (r, c, n) => Math.round(140 + (n - 1 - r + c) / (2 * (n - 1)) * 200);
const scale = pentatonic(261.63);
export const noteOf = (r, c, n) => scale(n - 1 - r + c);

// game 2: five sections of ten levels. Map letters are tile colours (b blue, g green, p pink), a capital carries a star, a dot is water.
// start is [x, y, direction] with 0 up, 1 right, 2 down, 3 left. sol is a reference program, F1|F2, each order optionally
// prefixed by its colour: it sizes the functions and feeds the hints.
export const SECTIONS = [
  { name: "Primers passos", sub: "Ordres en fila i girs", levels: [
    { name: "Endavant", map: ["bBBB"], start: [0, 0, 1], cmds: 'f', sol: 'f f f',
      tip: "El coet fa les ordres de F1, d'una en una. ↑ vol dir endavant, cap on mira el coet.",
      hints: ["Compta les caselles que hi ha entre el coet i l'última estrella. Cada ↑ el fa avançar una casella.", "Segueix el camí amb el dit i digues cada pas en veu alta. Cada pas és una ordre."] },
    { name: "Cap amunt", map: ["B", "b", "B", "b", "b"], start: [0, 4, 0], cmds: 'f', sol: 'f f f f',
      tip: "Ara el coet mira cap amunt. ↑ sempre vol dir «endavant»: cap on mira el coet.",
      hints: ["Compta les caselles fins a l'última estrella.", "Encara que el coet miri cap a un altre costat, l'ordre és la mateixa d'abans."] },
    { name: "Cap a l'esquerra", map: ["BbbBb"], start: [4, 0, 3], cmds: 'f', sol: 'f f f f',
      tip: "El coet mira cap a l'esquerra. Quina ordre el fa avançar?",
      hints: ["El coet no sap on és l'esquerra de la pantalla: només sap anar endavant.", "Compta les caselles i posa una ordre per a cada una."] },
    { name: "Primer gir", map: [".B", "bb"], start: [0, 1, 1], cmds: 'fLR', sol: 'f L f',
      tip: "El camí gira! ↶ fa girar el coet cap a la seva esquerra, sense moure'l de casella.",
      hints: ["Segueix el camí amb el dit: primer avança, després gira, després torna a avançar.", "Girar no fa avançar. Després de girar encara cal una ordre per moure's."] },
    { name: "A la dreta", map: ["bb", ".b", ".B"], start: [0, 0, 1], cmds: 'fLR', sol: 'f R f f',
      tip: "Ara cal girar cap a l'altre costat: ↷ gira a la dreta del coet.",
      hints: ["Posa't al lloc del coet, mirant cap on mira ell. Cap a quina mà queda el camí?", "Després del gir, compta quantes caselles falten fins a l'estrella."] },
    { name: "Girs", map: ["..B", "..b", "bbB"], start: [0, 2, 1], cmds: 'fLR', sol: 'f f L f f',
      tip: "Ara cal girar. ↶ gira a l'esquerra i ↷ gira a la dreta, sense avançar.",
      hints: ["Fes de coet: segueix el camí amb el dit. A cada casella pregunta't: aquí avanço o giro?", "Girar no fa avançar. Posa't al lloc del coet: l'esquerra i la dreta són les seves, no les teves."] },
    { name: "Ziga-zaga", map: [".bB", "bb."], start: [0, 1, 1], cmds: 'fLR', sol: 'f L f R f',
      tip: "Un gir cap a cada costat. Pensa-ho pas a pas.",
      hints: ["Segueix el camí amb el dit i digues en veu alta: endavant, gira, endavant…", "Després del primer gir el coet mira cap amunt. Cap on ha de girar per tornar a mirar a la dreta?"] },
    { name: "La U", map: ["bB", "bB"], start: [0, 1, 0], cmds: 'fLR', sol: 'f R f R f',
      tip: "El coet ha de fer mitja volta passant per dalt.",
      hints: ["Cada cop que el camí canvia de direcció cal un gir. Quants canvis de direcció hi ha?", "Els dos girs són cap al mateix costat."] },
    { name: "Darrere teu!", map: ["Bbb"], start: [2, 0, 1], cmds: 'fLR', sol: 'L L f f',
      tip: "L'estrella és darrere del coet, i el coet no sap anar enrere!",
      hints: ["Com pots fer que el coet miri cap a l'altre costat fent servir només girs?", "Un gir és un quart de volta. Quants en calen per fer-ne mitja?"] },
    { name: "El caragol", map: [".Bb", "..b", "bbB"], start: [0, 2, 1], cmds: 'fLR', sol: 'f f L f f L f',
      tip: "Un camí llarg que es cargola. Ves a poc a poc: una ordre per a cada pas.",
      hints: ["Divideix el camí en trossos rectes. Entre tros i tros hi ha un gir.", "Si el coet cau, mira quina ordre estava fent: en falta una o en sobra una abans del gir?"] }
  ] },
  { name: "Repeticions", sub: "F1 torna a començar", levels: [
    { name: "Torna a començar", map: ["bbBbbBbB"], start: [0, 0, 1], cmds: 'f1', sol: 'f 1',
      tip: "El camí és llarg i només tens 2 caselles! Si poses F1 dins de F1, la funció torna a començar.",
      hints: ["Totes les caselles del camí demanen el mateix. Quina és l'ordre que es repeteix tota l'estona?", "No cal escriure la mateixa ordre moltes vegades. Escriu-la un cop i, al final, digues a F1 que torni a començar."] },
    { name: "Amunt sense parar", map: ["B", "b", "b", "B", "b", "b", "b"], start: [0, 6, 0], cmds: 'f1', sol: 'f 1',
      tip: "El mateix truc, cap amunt: una ordre i F1 torna a començar.",
      hints: ["Quina ordre es repeteix a totes les caselles?", "L'última casella de F1 pot dir «torna a començar»."] },
    { name: "La roda", map: ["BB", "bb"], start: [0, 1, 1], cmds: 'fLR1', sol: 'f L 1',
      tip: "També es pot repetir un gir. Què fa el coet a cada cantonada?",
      hints: ["Mira un sol tros: avançar una casella i girar. Després tot torna a ser igual.", "Escriu el que passa en una cantonada i fes que F1 torni a començar."] },
    { name: "El quadrat petit", map: ["BbB", "b.b", "bbB"], start: [0, 2, 1], cmds: 'fLR1', sol: 'f f L 1',
      tip: "Un quadrat! Cada costat fa dues caselles.",
      hints: ["Què fa el coet en un costat sencer, fins que queda a punt per al següent?", "Un costat és avançar i girar al final. Després, tornar a començar."] },
    { name: "L'escala", map: ["....B", "...Bb", "..Bb.", ".Bb..", "bb..."], start: [0, 4, 1], cmds: 'fLR1', sol: 'f L f R 1',
      tip: "Una escala! Escriu un sol esglaó i fes que es repeteixi.",
      hints: ["Mira només el primer esglaó. Quins passos fa el coet per pujar-lo i quedar mirant com al principi?", "Tots els esglaons són iguals. Si en saps pujar un, guarda l'última casella per tornar a començar."] },
    { name: "Escala avall", map: ["bb...", ".Bb..", "..Bb.", "...Bb", "....B"], start: [0, 0, 1], cmds: 'fLR1', sol: 'f R f L 1',
      tip: "Aquesta escala baixa. Fixa't bé cap on gira el coet a cada esglaó.",
      hints: ["Mira només el primer esglaó: quins passos fa el coet fins a quedar mirant com al principi?", "Els girs van al revés que a l'escala que puja."] },
    { name: "Esglaons amples", map: ["......B", "....Bbb", "..Bbb..", "bbb...."], start: [0, 3, 1], cmds: 'fLR1', sol: 'f f L f R 1',
      tip: "Els esglaons són més llargs: dues caselles planes i una cap amunt.",
      hints: ["Un esglaó sencer: quantes caselles endavant abans de girar?", "Quan acabis un esglaó, el coet ha de mirar com al principi. Llavors, F1."] },
    { name: "Esglaons alts", map: ["..B", "..b", ".Bb", ".b.", "bb."], start: [0, 4, 1], cmds: 'fLR1', sol: 'f L f f R 1',
      tip: "Ara els esglaons són alts: una casella plana i dues cap amunt.",
      hints: ["Segueix un esglaó amb el dit i compta: quantes caselles puja?", "El tros que canvia respecte a l'altra escala és el de pujar."] },
    { name: "Ziga-zaga gran", map: ["....B", "....b", "..Bbb", "..b..", "bbb.."], start: [0, 4, 1], cmds: 'fLR1', sol: 'f f L f f R 1',
      tip: "Trossos de dues caselles, ara cap a la dreta, ara cap amunt.",
      hints: ["Busca el tros que es repeteix: comença quan el coet mira a la dreta i acaba quan hi torna a mirar.", "Cada tros recte fa dues caselles. Entre tros i tros, un gir."] },
    { name: "El castell", map: [".bB.bB.", "bbbbbbB"], start: [0, 1, 1], cmds: 'fLR1', sol: 'f L f R f R f L f 1',
      tip: "Els merlets d'un castell: pujar, passar per dalt, baixar i seguir. És llarg, però es repeteix!",
      hints: ["Segueix un sol merlet amb el dit, fins que el coet torna a ser a baix mirant a la dreta.", "Per pujar gires cap a un costat i per baixar cap a l'altre. Compta bé els girs: n'hi ha quatre a cada merlet."] }
  ] },
  { name: "Colors", sub: "Ordres que només es fan en un color", levels: [
    { name: "Colors", map: ["....B", "....b", "....b", "bbBbp"], start: [0, 3, 1], cmds: 'fLR1', conds: 'p', sol: 'f pL 1',
      tip: "Tria un color abans de posar una ordre: només es farà quan el coet sigui damunt d'aquell color.",
      hints: ["Gairebé sempre el coet només ha d'avançar. A quina casella ha de fer una cosa diferent? De quin color és?", "Una ordre amb color se salta a totes les altres caselles. Així pots posar un gir que només passi a la cantonada."] },
    { name: "Al rosa, a la dreta", map: ["bbBbp", "....b", "....b", "....B"], start: [0, 0, 1], cmds: 'fLR1', conds: 'p', sol: 'f pR 1',
      tip: "La casella rosa marca la cantonada. Aquesta vegada el camí gira cap a l'altre costat.",
      hints: ["Gairebé sempre el coet només avança. Què ha de fer diferent al rosa?", "Tria el color rosa abans de posar el gir."] },
    { name: "La volta", map: ["pbBp", "b..B", "B..b", "bbBp"], start: [0, 3, 1], cmds: 'fLR1', conds: 'p', sol: 'f pL 1',
      tip: "Fes tota la volta. Les cantonades són roses: què ha de fer el coet quan hi arriba?",
      hints: ["On passa alguna cosa especial en aquest camí? Mira de quin color són les cantonades.", "Això ja ho has fet abans: avançar sempre i girar només en un color. El programa pot ser molt curt encara que el camí sigui llarg."] },
    { name: "L'espiral", map: ["pbBbp", "b...b", "pbB.B", "....b", "bbbbp"], start: [0, 4, 1], cmds: 'fLR1', conds: 'p', sol: 'f pL 1',
      tip: "Una espiral! Sembla difícil, però mira de quin color són totes les cantonades.",
      hints: ["Totes les cantonades demanen el mateix gir?", "El programa pot ser molt curt: avançar sempre, girar només en un color, i tornar a començar."] },
    { name: "La serp", map: ["....B", "....b", "..pBg", "..b..", "bbg.."], start: [0, 4, 1], cmds: 'fLR1', conds: 'gp', sol: 'f gL pR 1',
      tip: "Dos colors, dues ordres: al verd gira cap a un costat i al rosa cap a l'altre.",
      hints: ["Ves a cada casella de color i pregunta't: aquí, cap on ha de girar el coet? Cada color té la seva resposta.", "Les ordres de color no es molesten entre elles: al verd només es fa la verda i al rosa només la rosa."] },
    { name: "El tobogan", map: ["bbg..", "..b..", "..pBg", "....b", "....B"], start: [0, 0, 1], cmds: 'fLR1', conds: 'gp', sol: 'f gR pL 1',
      tip: "Ara el camí baixa. Fixa't bé cap a quin costat ha de girar el coet a cada color.",
      hints: ["No copiïs el nivell de la serp: aquí els girs van al revés. Posa't al lloc del coet a la casella verda: cap on vol anar?", "Gira el cap per mirar igual que el coet. La seva dreta canvia segons cap on mira."] },
    { name: "El camí verd", map: ["..bgG", "..g..", "ggp.."], start: [0, 2, 1], cmds: 'fLR1', conds: 'bp', sol: 'f pL bR 1',
      tip: "Ara el camí és verd, i les cantonades són rosa i blau. El blau també és un color que pots triar.",
      hints: ["Ves a cada cantonada i pregunta't cap on ha de girar el coet. Quin color té cada una?", "Cal una ordre per a cada color de cantonada."] },
    { name: "Mitja volta", map: ["BbbbBbp"], start: [2, 0, 1], cmds: 'fLR1', conds: 'p', sol: 'f pR pR 1',
      tip: "Hi ha una estrella darrere del coet! Al final del passadís cal fer mitja volta: dos girs seguits.",
      hints: ["El coet no sap anar enrere. Com pots fer que miri cap a l'altre costat fent servir només girs?", "Un gir és un quart de volta. Quants en calen per fer mitja volta? Fes-los només a la casella on s'acaba el camí."] },
    { name: "Les golfes", map: [".P.P.", "bgbgB"], start: [0, 1, 1], cmds: 'fLR1', conds: 'gp', sol: 'f gL pR pR 1',
      tip: "Les estrelles són a dalt, en unes golfes sense sortida. El verd marca on cal pujar.",
      hints: ["Què ha de fer el coet al verd? I què ha de fer al rosa, on s'acaba el camí?", "Quan el coet torna a baixar, torna a trepitjar el verd. Mira cap on mira llavors: el mateix gir li va bé!"] },
    { name: "El laberint", map: ["...B.b", "...pbg", ".....b", "bbpbBg", "..b...", "bbgbb."], start: [0, 5, 1], cmds: 'fLR1', conds: 'gp', sol: 'f gL pR 1',
      tip: "Un laberint amb camins que no porten enlloc. Els colors et diuen on girar.",
      hints: ["No et deixis enganyar pels camins sense sortida: el coet només gira on hi ha color.", "Ves a una casella verda i a una de rosa. Cap on ha de girar el coet en cada una?"] }
  ] },
  { name: "L'ajudant", sub: "Una segona funció, F2", levels: [
    { name: "Dues vegades", map: ["bbBbB"], start: [0, 0, 1], cmds: 'f2', sol: '2 2|f f',
      tip: "Aquesta és F2, una ajudant. Quan F1 la crida, F2 fa les seves ordres.",
      hints: ["Aquí F1 només pot cridar F2. Què li has d'ensenyar a fer, a F2?", "Si F2 avança dues caselles, quantes vegades cal cridar-la?"] },
    { name: "L'ajudant", map: ["...B", "...b", "...b", "bbbB"], start: [0, 3, 1], cmds: 'fLR2', sol: '2 L 2|f f f',
      tip: "F1 pot fer coses entre crida i crida. Aquí, entre dos trossos iguals, cal girar.",
      hints: ["El camí té dos trossos iguals. Quin és el tros que es repeteix? Aquesta és la feina de F2.", "F1 és qui mana: diu «fes el tros», després fa el que cal entre tros i tros, i torna a dir «fes el tros»."] },
    { name: "El pont", map: ["BbB", "b.b", "b.B"], start: [0, 2, 0], cmds: 'fLR2', sol: '2 R 2 R 2|f f',
      tip: "Pots cridar F2 tantes vegades com vulguis. Aquí cal fer tres trossos iguals.",
      hints: ["Busca el tros que es repeteix: quantes caselles fa cada costat del pont?", "F2 fa un costat. F1 només ha de dir quan toca fer un costat i quan toca girar."] },
    { name: "Dos graons", map: ["..bB", ".Bb.", "bb.."], start: [0, 2, 1], cmds: 'fLR2', sol: 'f 2 f 2 f|L f R',
      tip: "F2 pot fer una feina petita que es repeteix: pujar un graó.",
      hints: ["Quina part del camí surt dues vegades igual?", "Quan F2 acabi, el coet ha de quedar mirant a la dreta, a punt per avançar."] },
    { name: "Tres esglaons", map: ["...B", "..Bb", ".Bb.", "bb.."], start: [0, 3, 1], cmds: 'fLR2', sol: '2 2 2|f L f R',
      tip: "F2 també pot girar. Ensenya-li a pujar un esglaó i crida-la tres vegades.",
      hints: ["Com al nivell de l'escala, pensa en un sol esglaó. Ara aquest esglaó pot viure dins de F2.", "Quan F2 acaba, el coet ha de quedar mirant igual que al començament. Així F2 es pot tornar a cridar i fa el mateix."] },
    { name: "L'escala llarga", map: [".....B", "....Bb", "...Bb.", "..Bb..", ".Bb...", "bb...."], start: [0, 5, 1], cmds: 'fLR12', sol: '2 1|f L f R',
      tip: "Massa esglaons per cridar F2 un per un! Fes que F1 cridi F2 i després torni a començar.",
      hints: ["F2 ja sap pujar un esglaó. Quantes vegades caldria cridar-la? Massa! Recorda com es repetia una ordre a la secció de repeticions.", "F1 pot ser molt curta: fes un esglaó i torna a començar."] },
    { name: "Esglaons grans", map: ["......B", "......b", "....Bbb", "....b..", "..Bbb..", "..b....", "bbb...."], start: [0, 6, 1], cmds: 'fLR12', sol: '2 L 2 R 1|f f',
      tip: "Aquests esglaons fan dues caselles. F2 pot ser «avança dues caselles».",
      hints: ["Cada esglaó té un tros pla i un tros que puja, i tots dos són igual de llargs. Quin tros pot fer F2?", "F1 descriu un esglaó sencer fent servir F2 i els girs. Després torna a començar."] },
    { name: "El quadrat", map: ["BbbB", "b..b", "b..b", "bBbB"], start: [0, 3, 0], cmds: 'fLR12', sol: '2 R 1|f f f',
      tip: "Un quadrat sense colors! Ensenya a F2 a fer un costat i fes que F1 el repeteixi girant.",
      hints: ["Un quadrat té quatre costats iguals. Què es repeteix? Fer un costat i girar.", "F2 fa el costat. F1 no ha de comptar els costats: en fa un, gira i torna a començar."] },
    { name: "Les arrels", map: ["bbbb", "BBBB"], start: [0, 0, 1], cmds: 'fLR12', sol: '2 f 1|R f L L f R',
      tip: "Sota de cada casella hi ha una estrella. Fes que F2 baixi a buscar-la, torni a pujar i quedi mirant endavant.",
      hints: ["Pensa en una sola casella: baixar, agafar l'estrella i tornar a pujar. Recorda com es fa una mitja volta.", "Quan F2 acabi, el coet ha de ser a dalt i mirant endavant, com abans de començar. Llavors F1 només ha d'avançar i repetir."] },
    { name: "Les branques", map: ["BBBBB", "bbbbb"], start: [0, 1, 1], cmds: 'fLR12', sol: 'L 2 L f 1|f R R f',
      tip: "Com les arrels, però ara F2 només té 4 caselles: els girs que no hi caben han d'anar a F1.",
      hints: ["És el mateix viatge que a les arrels, però cap amunt i amb una F2 més petita. Quina part del viatge és «anar i tornar» i quina és «preparar-se»?", "F2 pot fer només l'anar i tornar. Els girs d'abans i de després els pot fer F1."] }
  ] },
  { name: "Recursivitat", sub: "Crides de color i ordres guardades", levels: [
    { name: "Només quan toca", map: ["....bB", "..Bbp.", "bbp..."], start: [0, 2, 1], cmds: 'fLR12', conds: 'p', sol: 'f p2 1|L f R',
      tip: "A les caselles roses hi ha un graó. Pots cridar F2 només quan el coet sigui al rosa.",
      hints: ["Primer pensa què fa el coet per pujar un graó i quedar mirant endavant. Això és F2.", "Després pensa quan cal fer-ho: tria el color abans de posar F2 a F1."] },
    { name: "Canvi de carril", map: ["bbp....", "..b....", "..Bbp..", "....b..", "....BbB"], start: [0, 0, 1], cmds: 'fLR12', conds: 'p', sol: 'p2 f 1|R f f L',
      tip: "A les caselles roses cal baixar al carril de sota. Crida F2 només quan el coet sigui al rosa.",
      hints: ["Primer pensa què ha de fer el coet per baixar de carril i quedar mirant endavant. Això és la feina de F2.", "Després pensa quan cal baixar: només en un color. La resta del temps, el coet simplement avança."] },
    { name: "Només al rosa", map: [".B.BB..", "bpbppbB"], start: [0, 1, 1], cmds: 'fLR12', conds: 'p', sol: 'p2 f 1|L f R R f L',
      tip: "Només hi ha estrelles damunt de les caselles roses. Crida F2 només quan el coet sigui al rosa.",
      hints: ["Fes-te dues preguntes: què cal fer per agafar una estrella de dalt i tornar? I a quines caselles cal fer-ho?", "La primera resposta és F2. La segona és un color: F1 crida F2 només allà, i a totes les caselles avança."] },
    { name: "Amunt i avall", map: ["...B", "...b", ".BBp", "bpbg"], start: [0, 3, 1], cmds: 'fLR12', conds: 'gp', sol: 'p2 gL f 1|L f R R f L',
      tip: "Al rosa hi ha una estrella al costat, i al verd el camí gira. Dues ordres de color a F1!",
      hints: ["F2 és anar a buscar l'estrella del costat i tornar. Quan acabi, el coet ha de mirar com abans.", "F1 fa tres coses: cridar F2 al rosa, girar al verd, i avançar sempre."] },
    { name: "Ordres guardades", map: ["..b.", "..bB", "..b.", "bbp."], start: [0, 3, 1], cmds: 'fLR12', conds: 'bp', sol: '2 R f|f b2 pL f',
      tip: "Nou truc! Si F2 es crida a si mateixa abans d'acabar, l'ordre del darrere queda guardada per a després. Així el coet compta sense saber comptar.",
      hints: ["El coet ha de pujar tantes caselles com n'ha avançat. Cada crida de F2 avança una casella i guarda una ordre per a després.", "Pensa F2 així: avança; si encara ets al blau, torna a començar; al rosa, gira. L'última casella és l'ordre que queda guardada. F1 crida F2 i acaba el camí."] },
    { name: "Una mica més lluny", map: ["...b..", "...bbB", "...b..", "...b..", "bbbp.."], start: [0, 4, 1], cmds: 'fLR12', conds: 'bp', sol: '2 R f f|f b2 pL f',
      tip: "El mateix truc amb un camí més llarg. Cal pujar tantes caselles com n'has avançat, i després anar fins a l'estrella.",
      hints: ["El coet ha de pujar tantes caselles com n'ha avançat, però no sap comptar. El truc: cada vegada que F2 es crida a si mateixa abans d'acabar, li queda una ordre guardada per a després.", "Pensa F2 així: avança; si encara ets al blau, torna a començar; quan arribis al rosa, gira. L'última casella de F2 és l'ordre que queda guardada a cada crida: quina ha de ser? F1 fa la resta del camí."] },
    { name: "Compta amunt", map: ["...B..", "pbbbbb", "b.....", "b.....", "b....."], start: [0, 4, 0], cmds: 'fLR12', conds: 'bp', sol: '2 L f|f b2 pR f',
      tip: "El mateix truc, començant cap amunt. El coet ha d'anar a la dreta tantes caselles com n'ha pujat.",
      hints: ["Cada crida de F2 ha de deixar una ordre guardada. Quina?", "Mira on és l'estrella: després de F2, què li queda per fer a F1?"] },
    { name: "El doble", map: ["..b.", "..bB", "..b.", "..b.", "..b.", "bbp."], start: [0, 5, 1], cmds: 'fLR12', conds: 'bp', sol: '2 R f|f b2 pL f f',
      tip: "Ara cal pujar el doble de caselles de les que has avançat.",
      hints: ["Si cada crida guarda una ordre, el coet puja el mateix. Què ha de guardar per pujar el doble?", "Després de la crida a F2 poden quedar dues ordres guardades en lloc d'una."] },
    { name: "Anar i tornar", map: [".B...", "bbbbP"], start: [1, 1, 1], cmds: 'fLR12', conds: 'bp', sol: '2 R f|f b2 pL pL f',
      tip: "Ves fins a l'estrella del fons, torna exactament fins on has començat i puja. El coet no sap on ha començat, però les ordres guardades sí!",
      hints: ["Per tornar el mateix nombre de caselles, cada crida ha de guardar un pas. Però abans cal fer mitja volta: on?", "La mitja volta només es fa al rosa. Quan F2 acabi del tot, el coet serà on ha començat: llavors F1 el fa pujar."] },
    { name: "L'escala recursiva", map: ["....Bb", "....bb", "...bb.", "bbpb.."], start: [0, 3, 1], cmds: 'fLR12', conds: 'bp', sol: '2 L f|f b2 f L f R',
      tip: "Avança fins al rosa i després puja tants esglaons com caselles has avançat.",
      hints: ["Què queda guardat a cada crida? Aquesta vegada no és una sola ordre: és un esglaó sencer.", "Un esglaó és avançar, girar, avançar i girar. Posa'l després de la crida de F2. F1 només ha de fer l'últim pas fins a l'estrella."] }
  ] }
];
const parseSol = sol => sol.split('|').map(fn => fn.split(' ').map(t => ({ op: t.slice(-1), c: t.length > 1 ? t[0] : null })));
export const LEVELS = SECTIONS.flatMap((s, sec) => s.levels.map((l, idx) => { const ref = parseSol(l.sol); return { ...l, sec, idx, ref, slots: ref.map(fn => fn.length) }; }));
export const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
export function readMap(map) {
  const cells = new Map(), stars = new Set();
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    cells.set(x + ',' + y, ch.toLowerCase()); if (ch !== ch.toLowerCase()) stars.add(x + ',' + y);
  }));
  return { cells, stars, w: map[0].length, h: map.length };
}
// Runs a program (one array of slots per function; a slot is null or { op: 'f' | 'L' | 'R' | '1' | '2', c: colour or null })
// and returns every step taken plus how it ended: 'win', 'fall' (off the tiles), 'end' (out of orders) or 'fuel' (never stops).
export function trace(lv, code, max = 300) {
  const { cells, stars } = readMap(lv.map), steps = [], stack = [{ f: 0, i: 0 }];
  let [x, y, d] = lv.start;
  const left = fr => code[fr.f].slice(fr.i).some(Boolean);
  while (steps.length < max) {
    while (stack.length && !left(stack[stack.length - 1])) stack.pop();
    if (!stack.length) return { steps, end: 'end' };
    const fr = stack[stack.length - 1], s = code[fr.f][fr.i], st = { f: fr.f, i: fr.i };
    fr.i++;
    if (!s) continue;
    steps.push(st);
    let end;
    if (s.c && cells.get(x + ',' + y) !== s.c) st.skip = true;
    else if (s.op === 'f') {
      x += DX[d]; y += DY[d];
      const k = x + ',' + y;
      if (!cells.has(k)) end = 'fall'; else if (stars.delete(k)) { st.star = k; if (!stars.size) end = 'win'; }
    }
    else if (s.op === 'L') { d = (d + 3) % 4; st.turn = -1; }
    else if (s.op === 'R') { d = (d + 1) % 4; st.turn = 1; }
    else {
      // a call from the last order of a function leaves nothing pending, so that frame is dropped
      if (!left(fr)) stack.pop();
      stack.push({ f: +s.op - 1, i: 0 });
      if (stack.length > 60) end = 'fuel';
    }
    Object.assign(st, { x, y, d, stack: stack.map(q => q.f) });
    if (end) return { steps, end };
  }
  return { steps, end: 'fuel' };
}
