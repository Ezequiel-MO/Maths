# L'àbac xinès amb el model del cursus — disseny

## Objectiu

L'àbac xinès deixa de ser 6 seccions de 10 nivells en ordre i passa a funcionar com el Cursus de l'estany, que segueix la manera d'ensenyar de 42 Barcelona: una Piscina d'entrada, un mapa de cercles amb projectes que el nen tria, tres exercicis per projecte amb nota, un examen per cercle sense ajuda, XP amb nivell decimal i insígnies.

A més, les pistes passen de ser text a ser dibuix sobre el mateix àbac. Han d'ensenyar tres coses que avui costen: les columnes (una bola val 1, 10 o 100 segons on és), els canvis (5 boles de baix per la de dalt; 10 per una bola de l'esquerra) i els trucs de sumar i restar (+4 = +5 −1, +8 = +10 −2, demanar prestat).

Supòsits: el nen té 9 anys, juga sol amb tauleta o mòbil, els textos són en català i el joc conserva l'aspecte d'estany de nit. Cap text de pantalla parla de companyes ni d'un segon jugador.

Fora d'aquest canvi: equips (al Cursus només canvien el color, i aquí els colors ja diuen la columna), arrossegar boles (es continua tocant), un motor comú amb el Cursus (el Cursus no es toca), més de 5 columnes, Forat Negre i punts d'avaluació.

## Decisions de l'Oliver (2026-10-06)

- Model complet del Cursus, no una part.
- Les pistes han d'anar a columnes, canvis i trucs. El valor de cada bola no és el problema.
- El progrés desat es tradueix: una secció completada dona els seus projectes per validats amb 80. Els exàmens s'han de passar. Una secció a mitges no tradueix res.
- Sense equips.

## El recorregut

**La Piscina.** Tres reptes sense text: posar 3, 5 i 7 a l'àbac. Surt el número gran i l'àbac; quan l'àbac el marca, el repte s'acaba sol. En acabar s'obre el mapa.

**El mapa.** Tres cercles, pintats com al Cursus (bandes apilades, DOM). Tots els projectes d'un cercle obert estan oberts alhora. L'examen d'un cercle s'obre quan tots els seus projectes tenen 80 o més, i superar-lo obre el cercle següent. Un cercle només és obert si l'anterior també ho és.

| Cercle | Projecte | Què es descobreix | Secció d'avui |
|---|---|---|---|
| 0 · Llegir i escriure | Les boles | Una columna: de l'1 al 9, amb la bola de dalt | 1 |
| 0 · Llegir i escriure | Les columnes | Desenes i centenes; llegir i escriure fins a 999 | 1 |
| 1 · Sumar i restar | Sumes | Sumar sense cap canvi | 2 |
| 1 · Sumar i restar | El canvi de 5 | Sumar passant pel 5: +4 = +5 −1 | 2 |
| 1 · Sumar i restar | Me'n porto una | Sumar passant pel 10: +8 = +10 −2 | 3 |
| 1 · Sumar i restar | Restes | Restar, i demanar prestat a l'esquerra | 4 |
| 2 · Multiplicar i repartir | Multiplica | Multiplicar com a sumes repetides | 5 |
| 2 · Multiplicar i repartir | Reparteix | Dividir com a restes repetides | 6 |
| 2 · Multiplicar i repartir | Barreja | Operacions encadenades | 6 |

Són 9 projectes de 15 preguntes: 135 preguntes fixes. Les 60 d'avui es reparteixen entre els projectes i se n'escriuen unes 75 de noves amb el mateix format (`q: '25+17-8'`, o `read` amb `opts`). La dificultat creix de `ex00` a `ex02`.

## Un projecte

Tres exercicis de cinc preguntes. Es diferencien per l'ajuda que hi ha a la vista sense demanar-la:

| Exercici | A la vista |
|---|---|
| `ex00` | Sota cada columna, la xifra i el que val (`4` i `40`) |
| `ex01` | Sota cada columna, només la lletra (U, D, C) |
| `ex02` | Res, fins que es demana la pista |

Una pregunta es resol com avui: es mouen les boles i es prem «Comprova». És bona quan l'àbac marca el resultat i està endreçat (cap columna amb les 5 boles de baix pujades). Les preguntes de llegir tenen quatre opcions.

**La nota.** Una pregunta compta si s'encerta al primer «Comprova» (o a la primera opció) i sense pista. La nota és `round(100 × encerts / 15)`. Amb 80 el projecte queda validat. Es guarda la millor nota; refer un projecte no la baixa mai.

**Fallar.** No treu res. Al primer error es veu què marca l'àbac i què hauria de marcar (la tira de valors, més avall). Al segon, l'àbac es resol sol pas a pas i després es passa a la pregunta següent.

## Les pistes

El botó es diu «Dona'm una pista». Només n'hi ha als projectes. Demanar-la fa que la pregunta no compti per a la nota, i res més.

Tot es dibuixa sobre l'àbac, amb `pointer-events: none`, i es pot tocar igual mentre es veu. Què surt ho decideix l'entrenador que ja existeix (`nextMove`), segons el motiu del moviment següent:

| Motiu (`why`) | Què es veu |
|---|---|
| sempre | **Tira de valors.** Cada bola encesa porta el seu valor (1, 10, 100; la de dalt 5, 50, 500) i sota l'àbac hi ha la suma amb el color de cada columna: `300 + 40 + 7 = 347` |
| `add`, `take` | **Bola fantasma.** Una còpia translúcida de la bola fa el moviment en bucle, verda si es posa i vermella si es treu |
| `five` | **Canvi de 5.** Les 5 boles de baix s'ajunten i volen cap a la de dalt; etiqueta `5 → 1` |
| `ten` | **Canvi de 10.** La columna plena es plega i una bola salta a la columna de l'esquerra; etiqueta `10 → 1` |
| `more`, `less` | **Targeta de truc** `+4 = +5 −1` (o `−4 = −5 +1`), i dues fantasmes a la mateixa columna: la de dalt verda, la de baix vermella |
| `carry` | **Targeta de truc** `+8 = +10 −2`, amb una fantasma verda a la columna de l'esquerra i una de vermella a la pròpia |
| `borrow` | **Targeta de truc** `−8 = −10 +2`, amb la fantasma vermella a l'esquerra i la verda a la pròpia |

A les preguntes de llegir, la pista és la tira de valors.

Amb moviment reduït (`prefers-reduced-motion`) no hi ha bucles: es veuen les fletxes i les etiquetes fixes.

## L'examen

Un per cercle. Sis operacions a l'atzar tretes dels projectes del cercle, almenys una de cada projecte. Sense xifres sota les columnes, sense pista, un sol «Comprova» per pregunta. Se supera amb 5 de 6. Un examen superat no es perd mai. En acabar, el tauler diu quins projectes convé repassar.

## Caça l'errada

Voluntari, des del mapa. Tres àbacs ja posats, cadascun amb un número al costat («Aquest àbac marca 47»). De cap a dos estan malament. El nen diu de cada un «És correcte» o «No és correcte», i si no ho és, arregla l'àbac perquè marqui el número. Un full amb els tres bé suma 1 a `fulls`.

Els àbacs del full estan sempre endreçats. Els errors que es generen són els que ensenyen: una bola en una columna veïna, la bola de dalt comptada com a 1, o dues xifres girades (47 per 74).

## XP, nivell i insígnies

| Fet | XP |
|---|---|
| Piscina | 50 |
| Projecte | La nota (de 80 a 100); en millorar, només la diferència |
| Examen | 50, un cop |
| Full de Caça l'errada | 10, fins a 3 fulls per projecte validat |

Màxim: 50 + 900 + 150 + 270 = 1.370 XP. Nivell = XP / 150 amb dos decimals, de 0,00 a 9,13. La barra és sempre visible.

Cinc insígnies, amb les mateixes condicions que al Cursus: acabar la Piscina, un full perfecte, un projecte amb 100, deu fulls perfectes, els tres exàmens.

## El que es desa

Clau `abac-xines`, la mateixa. Forma nova: `{ so, secs[6], piscina, notes[9], exams[3], fulls }`. Només fets; XP, nivell i insígnies es calculen.

`secs` és la dada antiga. Es conserva tal com és i el joc nou no l'escriu mai. Una funció `clean(d)` fa un progrés vàlid de qualsevol JSON i hi aplica la traducció:

- `notes[i]` és el màxim entre la nota desada i 80 si la secció antiga del projecte `i` té 10 nivells fets. Seccions per projecte: `[0, 0, 1, 1, 2, 3, 4, 5, 5]`.
- `piscina` és cert si ja ho era o si `secs` té algun nivell fet.
- `exams` no es tradueix.

La traducció només puja valors, de manera que la fusió amb el núvol (el número més gran guanya) no la pot desfer, i un dispositiu antic que encara desi `secs` no fa baixar res.

## Fitxers

| Fitxer | Canvi |
|---|---|
| `games/abac-xines/logic.js` | `PROJECTS`, `CIRCLES`, `clean`, nota, `handIn`, `exam`, `examIn`, `sheet`, `sheetIn`, XP, insígnies. Conserva `plan`, `nextMove`, `tap`, `tidy`, `valueOf`. Ha de continuar important-se des de Node: res de `document` ni de `shared/util.js`; l'atzar entra per un paràmetre `rnd` |
| `games/abac-xines/hints.js` (nou) | Les pistes: rep l'element de l'àbac, les columnes i un moviment, i dibuixa. Té `show`, `strip` i `stop` |
| `games/abac-xines/main.js` | Pantalles: Piscina, mapa, projecte, examen, full. Amb la disciplina del Cursus (`enter()`, `fresh()`, guarda de doble toc) |
| `games/abac-xines/style.css` | Mapa, barra d'XP, capes de pista. L'àbac es mesura per no fer scroll, com el `fitter` del Cursus |
| `abac-xines.html` | Barra d'XP i «← Mapa». Sense `data-hub` |
| `games/abac-xines/board.js` (nou) | L'àbac que es toca: pintar, tocar, mesurar-se. Surt de `main.js` perquè cinc pantalles en pinten, i el full tres alhora |
| `shared/games.js` | Targeta: `total: 9`, «N de 9 projectes», i el text diu també «repartir». El recompte passa el desat per `clean`, perquè un perfil que encara no ha obert el joc nou només té `secs` |
| `scripts/check-abac.mjs` (nou) | Vegeu a sota |
| `scripts/check.mjs`, `package.json` | El total de l'àbac surt de `PROJECTS.length`; `check-abac.mjs` entra a la cadena `check` |

`shared/sections.js` deixa d'usar-se a l'àbac, tret de `panel()`.

## Com es comprova

`scripts/check-abac.mjs` s'escriu abans que la lògica i no fa servir les funcions que comprova per saber el resultat esperat.

- Les 135 preguntes: el resultat de cada una, calculat a part, és el `goal` de `plan`; hi cap en 5 columnes; seguint `nextMove` des de l'inici s'arriba a un àbac endreçat amb el resultat en un nombre finit de passos; les de llegir tenen quatre opcions diferents amb la bona a dins.
- Cada projecte té 3 exercicis de 5, i cada cercle els projectes de la taula.
- 200 exàmens per cercle: sis preguntes, totes del cercle, almenys una per projecte, totes resolubles.
- 200 fulls: tres àbacs, de 0 a 2 de dolents, cada dolent d'un dels tres tipus d'error; un de bo marca el número i un de dolent no.
- Nota, `handIn`, `examIn`, `sheetIn`, XP (màxim 1.370) i insígnies, amb valors esperats escrits a mà.
- `clean`: de `{}`, de brossa i de cada forma antiga (`{secs:[10,10,4,0,0,0]}` dona `notes` `[80,80,80,80,0,0,0,0,0]` i `piscina` cert); mai baixa un valor; `secs` surt igual que ha entrat.
- La targeta: `record({})` i `record` amb brossa tornen text.
- Cap text de `logic.js`, `main.js`, `board.js` ni `hints.js` conté «company» ni «segon».

Les pistes i el mapa es comproven al navegador, en mòbil vertical, mòbil apaïsat i tauleta: l'àbac no fa scroll, cada motiu de la taula dibuixa el que diu, i amb moviment reduït no hi ha bucles.

## Riscos

Els que va trobar la lectura dels dos jocs, i què se'n fa.

1. **Forma del progrés i dades al núvol.** Es porta: `secs` es conserva, `clean` tradueix i només puja (secció «El que es desa»).
2. **Llistes fetes a mà** (`shared/games.js`, `scripts/check.mjs`, cadena `check` de `package.json`, `record` que no pot petar). Es porta: tots tres a la taula de fitxers i al comprovador.
3. **`logic.js` s'ha d'importar des de Node.** Es porta (taula de fitxers).
4. **`shared/sections.js` fixa 10 nivells per secció.** Es porta: l'àbac el deixa, tret de `panel()`.
5. **Mides de l'àbac molt ajustades** (`--u` amb 330px, 500px i 150px fixos; regla apaïsada sobre els fills directes de `#joc.lvl`; estats de `.bead` que ja fan servir `::after`). Es porta: l'àbac passa a mesurar-se, les pistes van en una capa pròpia i no en pseudoelements de les boles, i es comprova en tres mides.
6. **Textos que suposen un segon jugador.** Es porta (comprovador).
7. **Dades de mostra de l'àbac a `check-cloud.mjs` i `check-progress.mjs`.** Es descarta: són dades de prova, no importen el joc, i la forma antiga continua sent vàlida.
8. **El bucle de preguntes del Cursus no es pot copiar** (allà es tecleja una resposta; aquí es posa l'àbac). Es porta: es copia el patró, no el codi; «a la primera» vol dir un sol «Comprova».
9. **Els handoffs del Cursus són antics.** Es descarta per a aquest canvi: la referència és el codi de `main`.
10. **Identificadors de la pàgina** (`#joc`, «← Seccions», l'expressió `HUB`, la veu senzilla). Es porta: HTML, CSS i `main.js` canvien junts, i `HUB` continua apuntant a `abac-xines.html`.
11. **Arbres de treball antics de l'àbac** (`.claude/worktrees/abac-xines`, `abac-una-bola-de-dalt`). Es descarta: ja són a `main`; no es toquen.
