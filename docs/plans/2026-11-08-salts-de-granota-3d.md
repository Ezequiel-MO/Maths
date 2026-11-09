# Salts de Granota a l'altura de l'hotel

Data: 2026-11-08. Branca proposada: `salts-3d` (des de `main`). Referència: `games/hotel-de-l-estany/`.

## Per què aquest joc

Tots els jocs, menys l'hotel, comparteixen la mateixa plantilla: el cel fosc amb cuques de llum, un mapa que és una llista
de botons i, a cada nivell, una targeta al mig. L'hotel és un món 3D que ocupa tota la pantalla, amb un client per pregunta,
una càmera que vola al lloc de cada projecte i un hotel que s'encén a mesura que es validen projectes.

Salts de Granota és el que més hi guanya:

- **És el que més poc es juga amb les mans.** Dels 23 projectes, 22 es responen escrivint un número al teclat. Només la recta
  numèrica deixa fer els salts arrossegant la granota.
- **És el contingut més de base.** El càlcul mental és a sota de tots els altres jocs, i «números» són 5 de les 20 preguntes
  de mates de la prova de 4t.
- **El 3D hi ensenya, no només hi decora.** El truc *són* els salts: primer fins a la desena, després el que queda. Una
  granota que salta de nenúfar en nenúfar per una recta dins l'estany és el truc fet visible. Sota zero és sota l'aigua.
- **La metàfora ja hi és.** La granota, els nenúfars, les mosques (`mosques` ja es desa) i la insígnia «Sota l'aigua». La
  mosca de cada operació fa el paper del client de l'hotel.
- **Les dades ja estan separades del dibuix.** `make()` torna `jumps: [{ to, lab }]`, `caps` i `viz`. El món 3D només ha de
  saber llegir-ho.

En contra: és el joc més gran (23 projectes) i té partides antigues (`secs`, `stars[12]`). No fa por perquè `clean()` no es
toca (vegeu la regla número u).

Els següents, per ordre, quan aquest estigui fet: **els escacs** (un tauler 3D darrere de `tauler()`, que ja és un
adaptador), **el coet programador** (el mapa de rajoles ja és dades), **el comptaquilòmetres** (un viatge per carretera),
**la fira de l'atzar** (daus, ruletes i bosses que es llancen de debò) i **la volta al món** (un globus amb monuments). No
ho valen tant: el concert i l'àbac (ja són els més manipulatius i tenen comprovacions que en fixen el codi), la rutina (és
un hàbit de cinc minuts), repeteix els llums i l'observatori (el 3D no hi afegeix aprenentatge).

## Regla número u: el progrés d'en Xavi i la Laia

- `games/salts-de-granota/logic.js` no canvia ni un byte. Per tant `scripts/golden.json` tampoc: `npm run check` ha de passar
  sense `--write`. Prova: `git diff main -- games/salts-de-granota/logic.js scripts/golden.json` buit.
- La clau de desat continua sent `salts-de-granota` i es desa el `prog` sencer amb `store(KEY, prog)`, com ara.
- El progrés només canvia amb les funcions de `logic.js`, als mateixos llocs i amb els mateixos arguments d'ara:
  `levelIn(prog, i, idx, L.n - fast)` en acabar un nivell, `poolIn` a la Piscina, `examIn(prog, c, qs, st.res)` a l'examen,
  `rapidIn(prog, st.hits)` al repte llampec, `sheetIn(prog, marks)` a «Caça l'errada», i `fliesIn` + `streakIn` (`bank`) en
  cada lliurament.
- Primer es desa i després s'anima. Cap animació del món va abans del `save()`: si es tanca la pestanya enmig, el nivell ja hi
  és.
- Cap camp nou al desat. El que mostra el món (nenúfars florits, estrelles, mosques) surt de `validated(prog)`, `prog.exams`
  i `prog.mosques`.
- No es toquen `shared/progress.js`, `shared/sync.js`, `shared/cloud.js`, `shared/curs.js`, `shared/mapa.js` ni
  `shared/games.js` (la targeta de la portada continua dient el mateix).
- Comprovació al navegador, `scripts/flow-salts.mjs` (fora de `npm run check`, com `flow-abac.mjs`; tasca 0):
  - Fa servir cinc partides: buida, antiga amb `secs[10]`, antiga amb `stars[12]`, a mig fer i acabada.
  - Per a cada una, el mapa ha de mostrar la mateixa nota de cada projecte, les mateixes mosques, la mateixa ratxa i el
    mateix rècord que dona `logic.js` executat a Node.
  - Després juga un nivell sense errades i un amb una errada, la Piscina, un examen, un repte llampec i un full. Respon
    llegint l'operació de la pantalla.
  - Després de cada partida, el document desat ha de ser exactament el que donen les funcions de `logic.js` per a aquells
    encerts i errades.
  - Es passa a `main` abans de començar (així es comprova la prova mateixa) i al final de cada tasca.

## Què ha de tenir (el llistó de l'hotel, traduït a l'estany)

- **Un món que ocupa la pantalla.** Un diorama de l'estany que sura al capvespre, sobre un bloc de terra. El costat dret és
  tallat i hi veus l'aigua per dins: el lloc de sota zero. Hi ha nenúfars, joncs, un embarcador, cuques de llum i una lluna.
  El panell va a la dreta en pantalla ampla i a sota en vertical, com a l'hotel (`W.layout('right' | 'bottom')`).
- **El mapa és l'estany.** Hi ha 23 nenúfars en sis grups, un per cercle, al voltant de l'aigua.
  - Un projecte validat fa obrir la flor del seu nenúfar, amb un fanalet.
  - Cada examen superat encén una estrella d'una constel·lació en forma de granota (sis estrelles, com les tres de l'hotel).
  - Passar el dit per un projecte de la llista il·lumina el seu nenúfar (`W.highlight`).
  - La càmera vola al grup del cercle (`W.go`).
- **Un convidat per pregunta.** Arriba una mosca i volteja per sobre de l'aigua.
  - Si la resposta és bona a la primera, la granota fa els salts del truc fins al nenúfar del resultat i la caça amb la
    llengua. El comptador de mosques puja.
  - Si és dolenta, la granota fa «plof» a l'aigua i torna a pujar, i la pista diu com trobar-ho, mai la resposta.
- **La recta numèrica és dins l'aigua.** És un camí de nenúfars amb números: el de sortida, les desenes i el d'arribada,
  com la recta buida de l'escola. Els nenúfars petits de les unitats només hi són quan el tram és curt.
  - Cada salt fa un arc amb la seva etiqueta (+10, −1) i esquitxa en caure.
  - Sota zero, la recta baixa pel costat tallat: la superfície és el 0 i la granota s'hi capbussa amb bombolles.
- **Fer els salts amb les mans.** Als nivells «Amb dibuix», el nen pot tocar el nenúfar on ha de saltar la granota. És el
  que ara fa arrossegant, amb les mateixes regles: un salt bo és feina seva, un salt dolent és una errada.
- **Els altres dibuixos en 3D.**
  - Deu nenúfars amb flor per als amics del 10. A «Treure del 10», les flors que se'n van ho fan volant.
  - Barres i cubets de fusta sobre una bassa, que s'enganxen en una barra o se'n desfan.
  - Dues files per als dobles.
- **«De cap» és de cap.** Als nivells sense dibuix no apareix cap recta: només la granota i la mosca. Quan la resposta és bona,
  la granota fa un salt gran i la caça.
- **Cada mode, al seu lloc de l'estany.**
  - La Piscina: tres primers salts a l'embarcador, i l'estany «s'obre».
  - L'examen: un bernat pescaire mira des d'una roca, i en superar-lo s'encén una estrella.
  - El repte llampec: el sol es pon mentre dura el minut i hi ha un eixam de mosques.
  - «Caça l'errada»: una pissarra a l'embarcador.
- **Sensació de joc.** Un clic a cada tecla, un raucar quan encerta, el «plof», la llengua i les bombolles. Una ratxa que
  puja de to amb el combo, la càmera que tremola i un salt gran cada cinc seguides. Esquitxos i confeti en acabar el nivell.
  En validar un projecte, la càmera torna a l'estany i la flor s'obre davant seu, com la part de l'hotel que s'encén.
- **Tauleta i accessibilitat.**
  - Fluïdesa: `bake()` del que és estàtic i un dibuix només quan alguna cosa es mou, amb el límit de densitat de píxels de
    l'hotel.
  - Moviment reduït: es respecta `RM`.
  - Sense WebGL es juga igual, amb els dibuixos 2D d'ara.

## Arquitectura

- **Contracte del dibuix.** `play()` i `demo()` ja parlen amb el dibuix per `{ n, jump(i, last), reveal(), reset(), hand?(api) }`.
  El 3D compleix el mateix contracte. Si hi ha WebGL, el dibuix és el 3D; si no, el 2D d'ara. `play()` no sap quin és.
- **Fitxers.**
  - `shared/diorama.js` (nou): el que l'hotel té de genèric, **copiat** de `world.js`: el renderer, el cel i els llums del
    capvespre, `bake`, `canvasTex`, `glow`, `label`, el bucle amb `tween`, el vol de la càmera i els quadres quiets, el
    confeti, `layout`, i el `none()` que fa les mateixes crides sense fer res. L'hotel no es toca ara: se li passarà quan
    s'hagi provat a la tauleta. És la base dels jocs següents.
  - `games/salts-de-granota/world.js` (nou): l'estany, la granota, els nenúfars, les mosques, el bernat, la constel·lació i
    els dibuixos 3D (recta, deu nenúfars, blocs, dobles).
  - `games/salts-de-granota/viz.js` (nou): `frameViz`, `blockViz`, `twinViz` i `lineViz` **traslladats** de `main.js` tal
    com són. És el camí sense WebGL.
  - `games/salts-de-granota/main.js`: pantalles noves amb el marc de l'hotel. Les crides a `logic.js` no canvien (vegeu la
    regla número u).
  - `games/salts-de-granota/style.css`: es reescriu amb la maqueta de l'hotel (panell de vidre, `.view`, `body.playing`).
    Es queden les lletres i el verd de l'estany.
  - `salts-de-granota.html`: `<canvas id="world">` en lloc de `#sky` i `#fx`. Es queden `#toG`, `#toM`, `#xp`, `#so`,
    `#kick` i `#joc`, sense `data-hub`.
  - `scripts/flow-salts.mjs` (nou): la comprovació de la regla número u.

## Tasques

Cada tasca deixa el joc jugable i acaba amb un commit. Comprovació de cada una: `npm run check` en verd, `flow-salts` en
verd i una captura per mirar-la.

0. **Xarxa.**
   - Branca `salts-3d` des de `main`.
   - Escriure `scripts/flow-salts.mjs` i passar-lo al joc d'ara: ha de donar verd abans de tocar res.
   - Traslladar els dibuixos 2D a `viz.js`, sense canviar-los. Les captures han de sortir iguals que abans.
1. **El diorama i el mapa.**
   - `shared/diorama.js` i l'estany estàtic, amb la granota que respira i parpelleja.
   - La maqueta panell més món, i el mapa amb els nenúfars florits i les estrelles segons el progrés.
   - Comprova: amb la partida a mig fer, el nombre de flors obertes és igual a `validated(prog).length` i les estrelles a
     `prog.exams`. Amb `?obert` floreixen totes. A la consola no hi ha errors.
2. **La recta en 3D (18 projectes).**
   - Salts amb arc i etiqueta, `pre`, `reveal` i `reset`.
   - `hand` amb un toc al nenúfar.
   - Sota zero pel costat tallat.
   - Comprova: el truc del projecte 7 (Sumar 9 i 8) i el del 18 (Passar pel zero) cauen als números de `p.jumps`. Un toc a
     un nenúfar equivocat compta com una errada, com ara.
3. **Els altres dibuixos en 3D (projectes 0 a 4).**
   - Deu nenúfars, blocs i dobles, amb el mateix contracte.
   - Comprova: els trucs de cada un fan els passos que diuen els seus `caps`.
4. **El nivell.**
   - La mosca de cada operació, la caça, el «plof», el combo i el final de nivell.
   - En validar un projecte, la càmera torna a l'estany i la flor s'obre.
   - «De cap» sense recta.
   - Comprova: `flow-salts` amb un nivell sense errades i un amb una errada.
5. **Els modes.**
   - La Piscina, l'examen amb el bernat, el repte llampec al capvespre i «Caça l'errada» a la pissarra.
   - Comprova: `flow-salts` amb cada mode, i la partida buida comença per la Piscina.
6. **Sensació de joc, so, fluïdesa i camí sense WebGL.**
   - Comprova: amb Chrome sense WebGL es juga un nivell sencer amb els dibuixos 2D. Amb pantalla de mòbil (390 px), el
     panell va a sota i no hi ha desplaçament horitzontal. A la consola no hi ha errors.
7. **Tancar.**
   - `git diff main -- games/salts-de-granota/logic.js scripts/golden.json` buit, `npm run build` en verd i captures del
     mapa i d'un nivell.
   - PR en esborrany. Es fusiona quan ho diguis.

## Fora d'aquest pla

- **La idea 6 de l'auditoria** (una frase real a Sota zero: termòmetre, ascensor, aparcament). Viu als textos de
  `logic.js`, i tocar-la canvia `golden.json`. Si la vols, va a part.
- **Moure l'hotel a `shared/diorama.js`.** Es fa quan l'hotel s'hagi provat a la tauleta.
- **Canviar els projectes, l'ordre o els nivells.** Mouria les estrelles desades.

## Pendent de provar a mà

El so i la fluïdesa a la tauleta d'en Xavi: el navegador sense pantalla no té GPU ni so.
