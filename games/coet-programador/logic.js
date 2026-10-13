// Nine projects of ten levels. Map letters are tile colours (b blue, g green, p pink), a capital carries a star, a dot is water.
// start is [x, y, direction] with 0 up, 1 right, 2 down, 3 left. sol is a reference program, F1|F2, each order optionally
// prefixed by its colour: it sizes the functions and feeds the hints.
export const PROJECTS = [
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
      tip: "Aquesta és F2, una ajudant. Quan F1 la crida, F2 fa les seves ordres. Quan F2 acaba, el coet torna a F1 i segueix per l'ordre següent.",
      hints: ["Aquí F1 només pot cridar F2. Què li has d'ensenyar a fer, a F2?", "Si F2 avança dues caselles, quantes vegades cal cridar-la?"] },
    { name: "L'ajudant", map: ["...B", "...b", "...b", "bbbB"], start: [0, 3, 1], cmds: 'fLR2', sol: '2 L 2|f f f',
      tip: "Quan F2 acaba, el coet torna a F1 i fa l'ordre que ve després de la crida. Aquí, entre dos trossos iguals, cal girar.",
      hints: ["El camí té dos trossos iguals. Quin és el tros que es repeteix? Aquesta és la feina de F2.", "Cridar F2 no és marxar de F1: quan F2 fa la seva última ordre, el coet torna a F1, a la casella de després de la crida. Per això F1 pot dir «fes el tros», després girar, i tornar a dir «fes el tros»."] },
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
  { name: "Fins que canviï", sub: "F2 avança fins que el color canvia", levels: [
    { name: "Fins al rosa", map: ["bbbbp", "....b", "....B"], start: [0, 0, 1], cmds: 'fLR2', conds: 'b', sol: '2 R f f|f b2',
      tip: "Truc nou! Si F2 acaba cridant-se a si mateixa només al blau, el coet avança fins que el color canvia, sigui lluny o a prop.",
      hints: ["F2 només necessita dues ordres: avançar i, si encara és al blau, tornar a començar.", "Quan F2 s'atura, el coet és al rosa. La resta del camí la fa F1: un gir i dos passos."] },
    { name: "Fins al verd", map: ["Bbg", "..b", "..b", "..b"], start: [2, 3, 0], cmds: 'fLR2', conds: 'b', sol: '2 L f f|f b2',
      tip: "El mateix truc, cap amunt: F2 avança mentre el coet trepitja blau, i s'atura sola quan arriba al verd.",
      hints: ["F2 és la mateixa d'abans: avança i, al blau, torna a començar.", "Quan el coet arriba al verd, cap on ha de girar per anar a l'estrella?"] },
    { name: "Dos trams", map: ["bbbp", "...b", "...b", "...G"], start: [0, 0, 1], cmds: 'fLR2', conds: 'b', sol: '2 R 2|f b2',
      tip: "F2 serveix per a qualsevol tram blau. Aquí n'hi ha dos, amb un gir al mig.",
      hints: ["F1 pot cridar F2 dues vegades: una per a cada tram.", "Entre un tram i l'altre el coet ha de girar. Cap a quin costat?"] },
    { name: "Tres trams", map: ["....gbbP", "....b...", "bbBbp..."], start: [0, 2, 1], cmds: 'fLR2', conds: 'b', sol: '2 L 2 R 2|f b2',
      tip: "Tres trams de mides diferents. F2 no compta caselles: avança fins que el color canvia.",
      hints: ["F1 és una llista: tram, gir, tram, gir, tram.", "El primer gir és cap a l'esquerra del coet i el segon cap a la dreta."] },
    { name: "Seguint el verd", map: ["bgGggb", "g....g", "g....g", "g....B"], start: [0, 3, 0], cmds: 'fLR2', conds: 'bg', sol: '2 R 2 R 2|f g2',
      tip: "Ara el camí és verd i les cantonades són blaves. Quin color ha de triar F2 per continuar?",
      hints: ["F2 ha de tornar a començar mentre el coet sigui damunt del color del camí.", "Tria el verd abans de posar F2 dins de F2. Els dos girs de F1 són cap al mateix costat."] },
    { name: "D'una punta a l'altra", map: ["B......", "gbbbbbP"], start: [2, 1, 1], cmds: 'fLR2', conds: 'b', sol: '2 R R 2 R f|f b2',
      tip: "Primer fins a l'estrella rosa, després mitja volta i fins a l'altra punta. F2 fa tots dos viatges.",
      hints: ["Després del primer viatge cal fer mitja volta: dos girs seguits.", "A la casella verda, el coet mira cap a l'esquerra. Cap on ha de girar per pujar a l'estrella?"] },
    { name: "La branca", map: ["...G...", "...b...", "...b...", "bbbpbbP"], start: [0, 3, 1], cmds: 'fLR2', conds: 'b', sol: '2 L 2 L L 2 L 2|f b2',
      tip: "Hi ha una estrella al capdamunt de la branca. Puja-hi, torna a baixar i segueix el camí.",
      hints: ["F2 fa quatre viatges: fins a la cruïlla, branca amunt, branca avall i fins al final.", "A dalt de la branca cal fer mitja volta. Quan torna a la cruïlla, el coet mira avall: cap on ha de girar per seguir cap a la dreta?"] },
    { name: "Esglaons desiguals", map: [".....PbP", ".....b..", "...Pbp..", "bbbp...."], start: [0, 3, 1], cmds: 'fLR12', conds: 'b', sol: '2 L 2 R 1|f b2',
      tip: "Una escala amb esglaons de mides diferents. F2 fa cada tram i F1 es repeteix.",
      hints: ["Un esglaó sencer és: tram, gir, tram, gir. Després, F1 torna a començar.", "Totes les cantonades són roses, però no totes giren cap al mateix costat: per això els girs han d'anar a F1, en ordre."] },
    { name: "Estrelles a les parades", map: ["..B...B.B", "bbpbbbpbp"], start: [0, 1, 1], cmds: 'fLR12', conds: 'b', sol: '2 L f R R f L 1|f b2',
      tip: "A cada parada rosa hi ha una estrella a dalt. F2 porta el coet fins a la parada següent.",
      hints: ["Després de cada tram: puja a buscar l'estrella, torna a baixar i queda mirant endavant.", "Pujar i baixar és: gir, pas, mitja volta, pas, gir. Després, F1 torna a començar."] },
    { name: "La serp que puja", map: ["...Bbp", ".pbBbp", ".pBbp.", "bbBbp."], start: [0, 3, 1], cmds: 'fLR12', conds: 'b', sol: '2 L f L 2 R f R 1|f b2',
      tip: "El camí fa esses i puja pis a pis. A cada punta rosa cal pujar un pis i girar cua.",
      hints: ["A la punta de la dreta: gira, puja un pas i torna a girar cap al mateix costat. A la punta de l'esquerra, el mateix amb l'altre gir.", "F1 és: tram, pujar per la dreta, tram, pujar per l'esquerra, i tornar a començar."] }
  ] },
  { name: "Tres funcions", sub: "Ajudants que tenen ajudants: F3", levels: [
    { name: "La tercera", map: ["..bbB", "bbB.."], start: [0, 1, 1], cmds: 'fLR23', sol: '2 3 2|f f|L f R',
      tip: "Ara tens dues ajudants, F2 i F3. Cada una pot aprendre una feina diferent.",
      hints: ["Al camí hi ha dues feines: avançar dues caselles i pujar un graó. Una per a cada ajudant.", "F1 només diu l'ordre de les feines: avançar, pujar, avançar."] },
    { name: "Ajudants d'ajudants", map: ["bbbbBbbbB"], start: [0, 0, 1], cmds: 'f23', sol: '2 2|3 3|f f',
      tip: "Vuit passos i molt poques caselles! Una ajudant també pot cridar una altra ajudant.",
      hints: ["Si F3 fa dos passos i F2 crida F3 dues vegades, quants passos fa F2?", "F1 crida F2 dues vegades: dos cops quatre passos."] },
    { name: "La volta sense repetir", map: ["BbB", "B.b", "bbB"], start: [0, 2, 1], cmds: 'fLR23', sol: '2 2|3 3|f f L',
      tip: "Una volta sencera sense fer servir F1 dins de F1. Pensa en un costat, en mitja volta i en la volta sencera.",
      hints: ["F3 pot fer un costat: dos passos i un gir.", "F2 fa dos costats, i F1 fa dues vegades dos costats."] },
    { name: "L'escala de dos en dos", map: ["....B", "...Bb", "..Bb.", ".Bb..", "bb..."], start: [0, 4, 1], cmds: 'fLR23', sol: '2 2|3 3|f L f R',
      tip: "Quatre esglaons. F3 en puja un, F2 en puja dos…",
      hints: ["Un esglaó és: pas, gir, pas, gir. Això és F3.", "F2 crida F3 dues vegades, i F1 crida F2 dues vegades."] },
    { name: "La muntanya", map: ["..Bb.", ".Bbbb", "bb..B"], start: [0, 2, 1], cmds: 'fLR23', sol: '2 2 3 3|f L f R|f R f L',
      tip: "Dos esglaons amunt i dos avall. Pujar i baixar són feines diferents: una per a cada ajudant.",
      hints: ["F2 puja un esglaó i F3 en baixa un. S'assemblen molt: només canvien els girs.", "F1 diu: puja, puja, baixa, baixa."] },
    { name: "El gran quadrat", map: ["BbbbB", "b...b", "B...b", "b...b", "bbbbB"], start: [0, 4, 1], cmds: 'fLR23', sol: '2 2 2 2|3 3 L|f f',
      tip: "Cada costat fa quatre passos. F3 pot fer mig costat.",
      hints: ["F2 és un costat sencer amb el gir del final: dues vegades F3 i un gir.", "F1 crida F2 quatre vegades, una per costat."] },
    { name: "Les torres", map: [".bB.bB.bB", ".bb.bb.bb", "bbbbbbbbb"], start: [0, 2, 1], cmds: 'fLR123', sol: 'f 2 f 1|L 3 R f R 3 L|f f',
      tip: "Tres torres iguals. F2 pot pujar una torre, passar per dalt i baixar; F3 l'ajuda amb els trossos de dos passos.",
      hints: ["Una torre és: gir, dos passos amunt, gir, un pas, gir, dos passos avall i gir. Els «dos passos» són F3.", "Entre torre i torre, F1 avança, i després torna a començar."] },
    { name: "El rasclet", map: ["B.B.B.B", "b.b.b.b", "bbbbbbb"], start: [0, 2, 1], cmds: 'fLR123', sol: '2 3 1|L 3 R R 3 L|f f',
      tip: "A dalt de cada pua hi ha una estrella. F3 fa dos passos, i serveix tant per pujar com per anar a la pua següent.",
      hints: ["F2 puja una pua i torna: gir, dos passos, mitja volta, dos passos i gir.", "F1 és molt curta: una pua, dos passos endavant i tornar a començar."] },
    { name: "L'escala d'escales", map: [".....bB", "....bB.", "..bBb..", ".bB....", "bb....."], start: [0, 4, 1], cmds: 'fLR123', sol: '2 1|3 3 f|f L f R',
      tip: "Dos esglaons i un replà, i tornem-hi. F3 puja un esglaó; F2 fa el tros sencer que es repeteix.",
      hints: ["El tros que es repeteix és: esglaó, esglaó i un pas de replà.", "F1 només ha de cridar F2 i tornar a començar."] },
    { name: "Les antenes", map: [".B..B.B", ".b..b.b", "bpbbpbp"], start: [0, 2, 1], cmds: 'fLR123', conds: 'p', sol: 'f p2 1|L 3 R R 3 L|f f',
      tip: "Damunt de cada casella rosa hi ha una antena amb una estrella. Crida F2 només al rosa.",
      hints: ["F2 puja l'antena i torna a baixar, com al rasclet. F3 fa els dos passos.", "F1 avança sempre, crida F2 només al rosa i torna a començar."] }
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
  ] },
  { name: "Comptar sense números", sub: "Ordres guardades per doblar, partir i tornar", levels: [
    { name: "Cap a l'altra banda", map: ["Bb...", ".b...", ".b...", ".pbbb"], start: [4, 3, 3], cmds: 'fLR12', conds: 'bp', sol: '2 L f|f b2 pR f',
      tip: "El truc de les ordres guardades, ara cap a l'esquerra: el coet ha de pujar tantes caselles com n'ha avançat.",
      hints: ["F2: avança; al blau, torna a començar; al rosa, gira. L'última casella és l'ordre que queda guardada.", "Aquí el gir del rosa és cap a la dreta del coet. F1 fa el final: un gir i un pas."] },
    { name: "El triple", map: ["..bB", "..b.", "..b.", "..b.", "..b.", "..b.", "bbp."], start: [0, 6, 1], cmds: 'fLR12', conds: 'bp', sol: '2 R f|f b2 pL f f f',
      tip: "Ara cal pujar el triple de caselles de les que has avançat.",
      hints: ["Cada crida de F2 pot deixar guardada més d'una ordre.", "Si cada crida guarda tres passos, dues crides en guarden sis."] },
    { name: "La meitat", map: [".....Bb", "......b", "......b", "bbbbbbp"], start: [0, 3, 1], cmds: 'fLR12', conds: 'bp', sol: '2 L f|f f b2 pL f',
      tip: "Ara al revés: cal pujar la meitat de caselles de les que has avançat.",
      hints: ["Si cada crida avança dues caselles i en guarda només una…", "F2: dos passos; al blau, torna a començar; al rosa, gira; i un pas guardat."] },
    { name: "El doble de tornada", map: ["..B....", "bbbbbbP"], start: [4, 1, 1], cmds: 'fLR12', conds: 'bp', sol: '2 R f|f b2 pL pL f f',
      tip: "Ves fins a l'estrella rosa i torna enrere el doble de caselles. Allà, a dalt, hi ha l'altra estrella.",
      hints: ["Al rosa cal fer mitja volta: dos girs que només es fan al rosa.", "Cada crida guarda dos passos de tornada. Després F1 gira i puja."] },
    { name: "El tobogan recursiu", map: ["bbpb..", "...bb.", "....bB"], start: [0, 0, 1], cmds: 'fLR12', conds: 'bp', sol: '2 f|f b2 f R f L',
      tip: "Avança fins al rosa i després baixa tants esglaons com caselles has avançat.",
      hints: ["El que queda guardat a cada crida és un esglaó sencer cap avall: pas, gir, pas, gir.", "F2: avança; al blau, torna a començar; i després l'esglaó. F1 fa l'últim pas."] },
    { name: "La vall", map: ["b.B", "b.b", "b.b", "ppp"], start: [0, 0, 2], cmds: 'fLR12', conds: 'bp', sol: '2|f b2 pL pf pf pL f',
      tip: "Baixa fins al fons, travessa la vall i puja per l'altra banda tantes caselles com n'has baixat.",
      hints: ["Les ordres de color rosa només es fan al fons: girar, travessar i tornar a girar.", "F2: avança; al blau, torna a començar; quatre ordres roses (gir, pas, pas, gir); i un pas guardat per pujar."] },
    { name: "La muntanya recursiva", map: ["...Pb..", "..bbbb.", ".bb..bb", "bb....B"], start: [0, 3, 1], cmds: 'fLR123', conds: 'bp', sol: '3|f L f R|2 b3 f R f L',
      tip: "Puja fins al cim rosa i baixa tants esglaons com n'has pujat. F2 pot ser «puja un esglaó».",
      hints: ["F3: puja un esglaó amb F2; si encara ets al blau, torna a començar; i després baixa un esglaó.", "L'esglaó de baixada queda guardat a cada crida: pas, gir a la dreta, pas, gir a l'esquerra."] },
    { name: "Dues muntanyes", map: [".....Pb.", ".Pb.bbbb", "bbbbb..B"], start: [0, 2, 1], cmds: 'fLR123', conds: 'bp', sol: '3 f 3|f L f R|2 b3 f R f L',
      tip: "Una muntanya petita i una de gran. El mateix programa serveix per a totes dues: no cal saber-ne l'alçada!",
      hints: ["F2 i F3 són les de la muntanya recursiva.", "F1: una muntanya, un pas i una altra muntanya."] },
    { name: "Tantes com passes", map: ["...BBB.", "bbbgbbb"], start: [0, 1, 1], cmds: 'fLR23', conds: 'bg', sol: '3|L f R R f L f|f b3 2',
      tip: "Avança fins al verd. Després cal agafar tantes estrelles com caselles has avançat.",
      hints: ["F2 agafa una estrella: puja, torna a baixar i fa un pas endavant.", "F3: avança; al blau, torna a començar; i una crida a F2 que queda guardada."] },
    { name: "Compta els verds", map: [".....b.", ".....bB", ".....b.", "bgbgbp."], start: [0, 3, 1], cmds: 'fLR123', conds: 'bgp', sol: '2 R f|f pL b2 g3|2 f',
      tip: "El més difícil! Al rosa cal girar i pujar tantes caselles com caselles verdes has trepitjat.",
      hints: ["Al blau, F2 només torna a començar. Al verd, crida F3, que torna a cridar F2 i deixa un pas guardat.", "F2: avança; al rosa, gira; al blau, F2; al verd, F3. F3: F2 i un pas. F1 fa el final."] }
  ] },
  { name: "Missió final", sub: "Tot el que saps, en deu viatges", levels: [
    { name: "El cargol gran", map: ["pbBbbp", "b....b", "b..B.B", "pbbp.b", ".....b", "bbBbbp"], start: [0, 5, 1], cmds: 'fLR1', conds: 'p', sol: 'f pL 1',
      tip: "Per escalfar motors: un cargol ben llarg. Recordes com es feia l'espiral?",
      hints: ["Totes les cantonades són roses i totes giren cap al mateix costat.", "Avançar sempre, girar només al rosa i tornar a començar."] },
    { name: "El gran laberint", map: ["......B", "......b", "...b..b", "..bpbBg", "...b..b", ".b.B...", "bbbgbb."], start: [0, 6, 1], cmds: 'fLR1', conds: 'gp', sol: 'f gL pR 1',
      tip: "Un laberint amb carrerons que no porten enlloc. Els colors diuen on cal girar.",
      hints: ["El coet passa de llarg dels carrerons: només gira on hi ha color.", "Ves a una casella verda i a la rosa: cap on ha de girar el coet en cada una?"] },
    { name: "El diamant", map: [".bBb.", "bb.bb", "B...B", "bb.bb", ".Bbb."], start: [2, 4, 1], cmds: 'fLR12', sol: '2 2 L 1|f L f R',
      tip: "Un diamant fet d'esglaons. Cada costat té dos esglaons.",
      hints: ["F2 puja un esglaó: pas, gir, pas, gir.", "F1 fa un costat (dos esglaons), gira i torna a començar."] },
    { name: "A banda i banda", map: [".B...B..", "bgbpbgbp", "...B...B"], start: [0, 1, 1], cmds: 'fLR123', conds: 'gp', sol: 'f g2 p3 1|L f R R f L|R f L L f R',
      tip: "Al verd l'estrella és a dalt, i al rosa és a baix. Una ajudant per a cada costat.",
      hints: ["F2 va a buscar una estrella a l'esquerra del coet i torna; F3 fa el mateix per la dreta.", "F1: avança, F2 al verd, F3 al rosa i torna a començar."] },
    { name: "La plaça", map: ["gbpbg", "b.B.b", "pB.Bp", "b.B.b", "bbpbg"], start: [0, 4, 1], cmds: 'fLR12', conds: 'gp', sol: 'f p2 gL 1|L f R R f L',
      tip: "Fes la volta a la plaça. A les cantonades verdes cal girar, i al rosa hi ha una estrella a dins.",
      hints: ["F2 entra a buscar l'estrella i torna a sortir, mirant igual que abans.", "F1: avança, F2 al rosa, gir al verd i torna a començar."] },
    { name: "L'estrella", map: ["..B..", "..b..", "BbbbB", "..b..", "..B.."], start: [2, 2, 0], cmds: 'fLR123', sol: '2 R 1|3 L L 3|f f',
      tip: "Quatre puntes amb una estrella a cadascuna. Ves a una punta, torna al mig i gira cap a la següent.",
      hints: ["F3 fa dos passos. F2 va fins a la punta i torna: F3, mitja volta, F3.", "Quan torna al mig, el coet mira cap enrere. F1 el fa girar i torna a començar."] },
    { name: "El camp d'estrelles", map: ["BbbBb", "bbBbp", "gBbbb", "bbBbp"], start: [0, 3, 1], cmds: 'fLR123', conds: 'gp', sol: 'f p2 g3 1|L f L|R f R',
      tip: "Passa per tot el camp, fila a fila. Al rosa cal pujar una fila girant per l'esquerra, i al verd, per la dreta.",
      hints: ["F2 canvia de fila per l'esquerra: gir, pas, gir. F3 fa el mateix per la dreta.", "F1: avança, F2 al rosa, F3 al verd i torna a començar."] },
    { name: "Les antenes desiguals", map: ["...G...", ".G.b..G", ".b.b..b", "bpbpbbp"], start: [0, 3, 1], cmds: 'fLR123', conds: 'bp', sol: 'f p3 1|f b2|L 2 L L 2 L',
      tip: "Les antenes tenen alçades diferents. F2 pot pujar «fins que el color canviï», i baixar igual.",
      hints: ["F2: avança i, al blau, torna a començar. S'atura sola a dalt (verd) i a baix (rosa).", "F3 és el viatge sencer: gir, F2, mitja volta, F2 i gir. F1 la crida només al rosa."] },
    { name: "Esglaons a mida", map: ["......B", "......b", "......b", "...Bbbp", "..Bp...", "..b....", "bbp...."], start: [0, 6, 1], cmds: 'fLR12', conds: 'bp', sol: '2 R 1|f b2 pL f',
      tip: "Cada esglaó puja tant com avança, i cada un és d'una mida diferent. Les ordres guardades ho compten per tu.",
      hints: ["F2 és la de les ordres guardades: avança; al blau, torna a començar; al rosa, gira; i un pas guardat.", "Després de cada esglaó, F1 gira el coet cap a la dreta i torna a començar."] },
    { name: "Torres a mida", map: ["...pP..", "pP.bb..", "bb.bb..", "bbbbbbB"], start: [0, 3, 1], cmds: 'fLR12', conds: 'bp', sol: 'L 2 L f f 1|f b2 pR pf pR f',
      tip: "L'últim viatge! Dues torres d'alçades diferents: cal baixar tant com s'ha pujat.",
      hints: ["F2 és com la vall, però cap amunt: puja; al blau, torna a començar; a dalt, tres ordres roses (gir, pas, gir); i un pas guardat per baixar.", "F1: gira cap amunt, F2, gira, dos passos fins a la torre següent i torna a començar."] }
  ] }
];
const parseSol = sol => sol.split('|').map(fn => fn.split(' ').map(t => ({ op: t.slice(-1), c: t.length > 1 ? t[0] : null })));
export const LEVELS = PROJECTS.flatMap((s, sec) => s.levels.map((l, idx) => { const ref = parseSol(l.sol); return { ...l, sec, idx, ref, slots: ref.map(fn => fn.length) }; }));
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
// the reference flight, tile by tile, with the stars picked up by then; turns is how many turns it takes
export function routeOf(lv) {
  const route = [{ x: lv.start[0], y: lv.start[1], got: 0 }];
  let turns = 0;
  for (const st of trace(lv, lv.ref).steps) {
    if (st.turn) turns++;
    else if (!st.skip && lv.ref[st.f][st.i].op === 'f') route.push({ x: st.x, y: st.y, got: route[route.length - 1].got + (st.star ? 1 : 0) });
  }
  return Object.assign(route, { turns });
}
// the reference flight cut into pieces, one for each stretch a function is at work: the tiles it flies over and where it turns
export function piecesOf(lv) {
  const out = [];
  let [x, y] = lv.start, cur = null;
  for (const st of trace(lv, lv.ref).steps) {
    if (st.skip) continue;
    // a call hands the work over: whoever goes on after it starts a new piece
    if ('123'.includes(lv.ref[st.f][st.i].op)) { cur = null; continue; }
    if (!cur || cur.f !== st.f) out.push(cur = { f: st.f, pts: [[x, y]], turns: [] });
    if (st.turn) cur.turns.push([x, y]);
    else { [x, y] = [st.x, st.y]; cur.pts.push([x, y]); }
  }
  return out;
}
// Where a program goes wrong, read against the reference route. Returns the trace plus:
//   kind   'win'; 'fall' or 'off' (an advance that leaves the route, into the water or onto another tile); 'end' (out of orders
//          while still on the route) or 'fuel' (never stops, and no longer advances)
//   k      the step at fault for 'fall' and 'off'; for 'fuel' the steps up to its last advance; else the number of steps
//   j      how far along the route the rocket got; x, y, d its place and direction there (before the step at fault)
//   want   the direction of the next tile of the route, d0 the direction it had on arriving at this tile
//   turns, skipped   the steps since it arrived at this tile that turned it, and the ones skipped for their colour
export function diagnose(lv, code, max = 150) {
  const r = trace(lv, code, max), route = routeOf(lv);
  let [x, y, d] = lv.start, j = 0, d0 = d, turns = [], skipped = [], last = 0;
  const out = (kind, k) => { const n = route[j + 1], want = n ? DX.findIndex((dx, q) => x + dx === n.x && y + DY[q] === n.y) : -1; return { ...r, kind, k, j, x, y, d, d0, want, turns, skipped, route }; };
  if (r.end === 'win') return out('win', r.steps.length);
  for (let k = 0; k < r.steps.length; k++) {
    const st = r.steps[k];
    if (st.skip) { skipped.push(k); continue; }
    if (code[st.f][st.i].op === 'f') {
      const n = route[j + 1];
      if (!n || n.x !== st.x || n.y !== st.y) return out(k === r.steps.length - 1 && r.end === 'fall' ? 'fall' : 'off', k);
      j++; x = st.x; y = st.y; d0 = d; turns = []; skipped = []; last = k + 1;
    } else if (st.turn) { d = st.d; turns.push(k); }
  }
  return out(r.end, r.end === 'fuel' ? last : r.steps.length);
}

/* ---------- the rocket game as a cursus: circles, projects, marks ---------- */
// Laid out as the cursus of 42 Barcelona, like the other games of the pond: a Piscina to get in, a map of four circles,
// a mark for each project, an exam for each circle, XP and badges.
export const CIRCLES = [
  { name: 'Enlairament', projects: [0, 1, 2] },
  { name: 'Les ajudants', projects: [3, 4] },
  { name: 'Funcions de funcions', projects: [5, 6] },
  { name: 'Espai profund', projects: [7, 8] }
];
export const circleOf = i => CIRCLES.findIndex(c => c.projects.includes(i));
// slips are launches that did not get every star, plus hints asked
export const starsFor = slips => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
// What a level gives to the mark of its project, by its stars: 10 at the first launch, 8 with one or two slips, 5 with more.
// Ten levels make 100, and a project is validated with 80
export const POINTS = [0, 5, 8, 10];
export const VALID = 80;
export const EXAM_PASS = 5;
// the seconds of a lightning round
export const RAPID = 60;

// What is saved is facts only: { best, so, lv[90], piscina, exams[4], fulls, rapid, ratxa }. best is the record the game of lights
// made while it shared this save (it keeps its own now, and reads this one); lv is the best stars of each level, rapid the most right answers in a lightning round and ratxa the longest
// run of right answers. Marks, XP, level and badges are worked out, never stored.
const whole = x => typeof x === 'number' && Number.isFinite(x) ? Math.trunc(x) || 0 : 0;
const within = (x, hi) => Math.min(hi, Math.max(0, whole(x)));
const slots = (a, n) => Array.from({ length: n }, (_, i) => Array.isArray(a) ? a[i] : undefined);
// Before the cursus the game had five sections of ten levels, with the levels done of each in `secs` (and, before that, twenty
// levels in a row counted in `coet`): each section is now the project at this place
const OLD = [0, 1, 2, 3, 6];
// A complete progress inside its limits from any value at all; a new object. It only ever raises: whoever played before the cursus
// keeps every level done, with two stars (a whole section is a validated project), has the Piscina done, and finds open every
// circle that holds a section that was open
export function clean(d) {
  const o = d && typeof d === 'object' && !Array.isArray(d) ? d : {}, lv = slots(o.lv, PROJECTS.length * 10).map(s => within(s, 3));
  const secs = slots(o.secs, OLD.length).map((n, s) => Math.max(within(n, 10), whole(o.coet) >= [2, 4, 9, 18, 20][s] ? 10 : 0));
  OLD.forEach((p, s) => { for (let i = 0; i < secs[s]; i++) lv[p * 10 + i] = Math.max(lv[p * 10 + i], 2); });
  const far = Math.max(0, ...OLD.map((p, s) => s > 0 && secs[s - 1] >= 10 ? circleOf(p) : 0));
  return { best: Math.max(0, whole(o.best)), so: o.so !== false, lv, piscina: o.piscina === true || lv.some(s => s > 0),
    exams: slots(o.exams, CIRCLES.length).map((e, c) => e === true || c < far),
    fulls: Math.max(0, whole(o.fulls)), rapid: Math.max(0, whole(o.rapid)), ratxa: Math.max(0, whole(o.ratxa)) };
}
const copy = p => ({ ...p, lv: p.lv.slice(), exams: p.exams.slice() });
// the functions below take a progress that is already clean
export const noteOf = (p, i) => p.lv.slice(i * 10, i * 10 + 10).reduce((s, n) => s + POINTS[n], 0);
// how many levels of a project are done from the first on: the one after them is the next to open
export const reached = (p, i) => { const k = p.lv.slice(i * 10, i * 10 + 10).findIndex(n => n === 0); return k < 0 ? 10 : k; };
export const validated = p => PROJECTS.flatMap((_, i) => noteOf(p, i) >= VALID ? [i] : []);
// 50 for the Piscina, the mark of each validated project, 50 per exam passed, 10 per sheet up to 3 for each validated project: 1420 at most
export function xpOf(p) {
  const v = validated(p);
  return (p.piscina ? 50 : 0) + v.reduce((s, i) => s + noteOf(p, i), 0) + 50 * p.exams.filter(Boolean).length + 10 * Math.min(p.fulls, 3 * v.length);
}
// the level is the XP over 150, with two decimals and a comma: from 0,00 to 9,47
export const levelText = p => (xpOf(p) / 150).toFixed(2).replace('.', ',');
// circle 0 opens with the Piscina and the others with the exam before them
export const isOpen = (p, c) => c === 0 ? p.piscina === true : c > 0 && c < CIRCLES.length && isOpen(p, c - 1) && p.exams[c - 1] === true;
// the exam of a circle opens when the circle is open and all its projects are validated
export const examOpen = (p, c) => isOpen(p, c) && CIRCLES[c].projects.every(i => noteOf(p, i) >= VALID);
export const BADGES = [
  { name: 'Piscina acabada', what: 'Acaba la Piscina.' },
  { name: 'Primer programa', what: 'Valida un projecte.' },
  { name: 'Nota 100', what: 'Treu un 100 en un projecte.' },
  { name: 'Ratxa de 10', what: 'Encerta 10 vegades seguides a la primera, entre nivells i preguntes.' },
  { name: 'Cap de colla', what: 'Valida els dos projectes de les ajudants.' },
  { name: 'Recursiu', what: 'Valida el projecte «Recursivitat».' },
  { name: 'Ull de falcó', what: "Troba bé les errades d'un full." },
  { name: 'Deu fulls', what: "Corregeix bé deu fulls d'errades." },
  { name: 'Llampec', what: 'Encerta 15 girs en un repte llampec.' },
  { name: 'Cursus complet', what: 'Supera els quatre exàmens.' }
];
export const badges = p => [p.piscina === true, validated(p).length > 0, PROJECTS.some((_, i) => noteOf(p, i) === 100), p.ratxa >= 10,
  CIRCLES[1].projects.every(i => noteOf(p, i) >= VALID), noteOf(p, 6) >= VALID, p.fulls >= 1, p.fulls >= 10, p.rapid >= 15, p.exams.every(e => e === true)];
const earned = (p, next) => { const had = badges(p), now = badges(next); return BADGES.filter((_, j) => now[j] && !had[j]).map(b => b.name); };

// A level done, with its slips. Returns { prog, n, note, gain, valid, exam, news }: prog is a NEW progress that keeps the best
// stars of the level; n the stars of this time; note the mark of the project after it; gain the XP it adds; valid whether the
// project is validated by this very level, and exam whether that opens the exam of its circle; news the badges it earns
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

/* ---------- quick questions: the Piscina, the exams and the lightning round ---------- */
// Each is answered with one touch. kind says what is asked:
//   'turn'  the rocket looks towards d and makes the turns of seq: where it looks in the end (0 up, 1 right, 2 down, 3 left)
//   'hole'  the reference program of level lv with the order at function f, place i missing: the order, chosen among opts
//   'fate'  level lv with the program code: what happens, 'win', 'fall' or 'stuck' (out of orders, or round and round)
// An order is written as in sol: its letter, with the letter of its colour before it. Chance enters only through rnd
const int = (rnd, lo, hi) => lo + Math.min(hi - lo, Math.floor(rnd() * (hi - lo + 1)));
const at = (n, rnd) => int(rnd, 0, n - 1);
function shuffle(a, rnd) {
  for (let i = a.length - 1; i > 0; i--) { const j = at(i + 1, rnd); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const turned = (d, seq) => seq.reduce((x, o) => (x + (o === 'L' ? 3 : 1)) % 4, d);
const tok = s => (s.c || '') + s.op;
export const slotOf = t => ({ op: t.slice(-1), c: t.length > 1 ? t[0] : null });
export const codeOf = q => q.code.map(fn => fn.map(slotOf));
export const fateOf = (lv, code) => { const e = trace(lv, code, 150).end; return e === 'win' || e === 'fall' ? e : 'stuck'; };
// every order a question about a level can offer: its own, the three first ones, and each in each of its colours
const offers = lv => [...new Set(lv.cmds + 'fLR')].flatMap(op => ['', ...(lv.conds || '')].map(c => c + op));
const swapped = (lv, f, i, t) => lv.ref.map((fn, a) => fn.map((s, b) => a === f && b === i ? slotOf(t) : s));
// a place of the reference program of level n and the orders that, put there, do not get every star
function spot(n, rnd) {
  const lv = LEVELS[n], f = at(lv.ref.length, rnd), i = at(lv.ref[f].length, rnd), right = tok(lv.ref[f][i]);
  return { f, i, right, wrong: shuffle(offers(lv).filter(t => t !== right && fateOf(lv, swapped(lv, f, i, t)) !== 'win'), rnd) };
}
const turnQ = (rnd, len) => ({ kind: 'turn', d: at(4, rnd), seq: Array.from({ length: len }, () => rnd() < 0.5 ? 'L' : 'R') });
function holeQ(n, rnd) {
  for (let k = 0; k < 40; k++) { const s = spot(n, rnd); if (s.wrong.length > 1) return { kind: 'hole', lv: n, f: s.f, i: s.i, opts: shuffle([s.right, ...s.wrong.slice(0, 2)], rnd) }; }
  return turnQ(rnd, 3);
}
// the reference program, three times in five with one order changed for one that spoils it
function fateQ(n, rnd) {
  const lv = LEVELS[n], s = spot(n, rnd), bad = rnd() < 0.6 && s.wrong.length > 0;
  return { kind: 'fate', lv: n, code: (bad ? swapped(lv, s.f, s.i, s.wrong[0]) : lv.ref).map(fn => fn.map(tok)), ...(bad ? { f: s.f, i: s.i } : {}) };
}
export const wantQ = q => q.kind === 'turn' ? String(turned(q.d, q.seq)) : q.kind === 'hole' ? tok(LEVELS[q.lv].ref[q.f][q.i]) : fateOf(LEVELS[q.lv], codeOf(q));
// the three questions of the Piscina, the first challenges: a turn, a missing order and a short program to follow
export const POOL = [{ kind: 'turn', d: 0, seq: ['R'] }, { kind: 'hole', lv: 0, f: 0, i: 2, opts: ['L', 'f', 'R'] }, { kind: 'fate', lv: 3, code: [['f', 'L', 'f']] }];

/* ---------- the exam, the lightning round and «Caça l'errada» ---------- */
// Six different questions about levels of the projects of circle c, new every time, at least one of each project, in a random order:
// four missing orders and two programs to follow; each has p, its project. A circle that does not exist gives the first
export function exam(c, rnd) {
  const ps = (CIRCLES[c] || CIRCLES[0]).projects, seen = new Set(), list = [];
  while (list.length < 6) {
    const p = list.length < ps.length ? ps[list.length] : ps[at(ps.length, rnd)];
    for (let n = 0; ; n++) {
      const q = (list.length % 3 === 2 ? fateQ : holeQ)(p * 10 + at(10, rnd), rnd), key = JSON.stringify(q);
      if (n > 200 || !seen.has(key)) { seen.add(key); list.push({ ...q, p }); break; }
    }
  }
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
// The n questions of a lightning round: turns, one or two at first and up to four later; never the same twice in a row
export function sprint(rnd, n = 60) {
  const out = [];
  while (out.length < n) {
    const k = out.length, q = turnQ(rnd, k < 4 ? int(rnd, 1, 2) : k < 10 ? int(rnd, 2, 3) : int(rnd, 2, 4)), was = out[k - 1];
    if (!was || JSON.stringify(was) !== JSON.stringify(q)) out.push(q);
  }
  return out;
}

// The four things a sheet can say, each { kind, says, real, opts, ... }: says is the value written on the sheet, real the true one
// (the claim is wrong when they differ) and opts the values to choose from when fixing it, all as text. ps is the projects whose
// levels the sheet may show.
const CLAIM = {
  // where the rocket looks after some turns
  face(bad, rnd) {
    const q = turnQ(rnd, int(rnd, 2, 3)), real = turned(q.d, q.seq), others = [(real + 1) % 4, (real + 3) % 4];
    return { d: q.d, seq: q.seq, says: String(bad ? others[at(2, rnd)] : real), real: String(real), opts: [real, ...others].sort().map(String) };
  },
  // the order that goes in a place of a program
  slot(bad, rnd, ps) {
    for (;;) {
      const q = holeQ(ps[at(ps.length, rnd)] * 10 + at(10, rnd), rnd); if (q.kind !== 'hole') continue;
      const real = wantQ(q); return { lv: q.lv, f: q.f, i: q.i, says: bad ? q.opts.filter(t => t !== real)[at(2, rnd)] : real, real, opts: q.opts };
    }
  },
  // what happens to the rocket with a program
  fate(bad, rnd, ps) {
    const q = fateQ(ps[at(ps.length, rnd)] * 10 + at(10, rnd), rnd), real = wantQ(q), opts = ['win', 'fall', 'stuck'];
    return { lv: q.lv, code: q.code, says: bad ? opts.filter(t => t !== real)[at(2, rnd)] : real, real, opts };
  },
  // how many stars a program of the first project picks up, right or with one order changed
  stars(bad, rnd) {
    const n = at(10, rnd), lv = LEVELS[n], s = spot(n, rnd), code = rnd() < 0.5 && s.wrong.length ? swapped(lv, s.f, s.i, s.wrong[0]) : lv.ref;
    const all = readMap(lv.map).stars.size, real = trace(lv, code, 150).steps.filter(st => st.star).length;
    return { lv: n, code: code.map(fn => fn.map(tok)), says: String(bad ? (real < all ? real + 1 : real - 1) : real), real: String(real),
      opts: [real - 1, real, real + 1].filter(v => v >= 0 && v <= all).map(String) };
  }
};
export const KINDS = Object.keys(CLAIM);
// Three claims of three different kinds; from 0 to 2 of them are wrong (never all three), in any place
export function sheet(rnd, ps = [0]) {
  const bads = new Set(shuffle([0, 1, 2], rnd).slice(0, [0, 1, 1, 2, 2][at(5, rnd)]));
  return shuffle(KINDS.slice(), rnd).slice(0, 3).map((kind, i) => ({ kind, ...CLAIM[kind](bads.has(i), rnd, ps.length ? ps : [0]) }));
}
// The hand-in of a finished sheet: run has one boolean per claim. Returns { prog, good, gain, missed, news }: prog is a NEW progress
// with fulls + 1 only when all three are right; gain the XP that adds (0 once the cap of 3 per validated project is reached)
export function sheetIn(p, run) {
  const missed = [0, 1, 2].filter(i => run[i] !== true), good = !missed.length && run.length === 3, next = copy(p);
  if (good) next.fulls = p.fulls + 1;
  return { prog: next, good, gain: xpOf(next) - xpOf(p), missed, news: earned(p, next) };
}
