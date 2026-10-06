# L'àbac xinès amb el model del cursus — pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'àbac xinès passa de 6 seccions de 10 nivells al model del Cursus de l'estany (Piscina, mapa de cercles, projectes amb nota, examen, Caça l'errada, XP, insígnies), amb pistes dibuixades sobre l'àbac.

**Architecture:** L'àbac té la seva pròpia còpia del model, seguint els patrons de `games/cursus-de-l-estany/`; el Cursus no es toca. La lògica pura queda a `logic.js` (importable des de Node) i la comprova `scripts/check-abac.mjs`, escrit abans que la lògica. La pantalla es parteix en tres: `board.js` (l'àbac que es toca), `hints.js` (la capa de pistes) i `main.js` (les pantalles).

**Tech Stack:** JavaScript de mòdul sense dependències, DOM i CSS, Vite multipàgina, comprovadors de Node (`npm run check`).

**Spec:** `docs/superpowers/specs/2026-10-06-abac-xines-cursus-design.md`. Qui executa una tasca llegeix la spec i la seva tasca.

**Com s'executa:** en una sessió nova, a la branca `abac-xines-cursus`. `implementer` per a cada tasca, `spec-reviewer` segons el risc (vegeu «Revisions»), `code-reviewer` de tota la branca al final. El pla diu regles, fitxers, valors esperats i la prova de cada tasca; no porta el codi escrit.

## Global Constraints

- El nen juga sol: cap text de pantalla conté «company» ni «segon». Textos en català.
- La clau de desat és `abac-xines`. `secs` es conserva i el joc nou no l'escriu mai. Cap valor desat baixa.
- Regles de desat del README: números que només creixen, booleans que només passen a cert, llistes d'aquests, cap llista dins d'una llista; `so` és l'única preferència.
- `games/abac-xines/logic.js` s'importa des de Node: res de `document`, `window`, `localStorage` ni `shared/util.js`. L'atzar entra per un paràmetre `rnd` (una funció com `Math.random`).
- Com a molt 5 columnes: cap valor d'una pregunta (inici, passos, resultat) passa de 99.999.
- El botó de pista es diu «Dona'm una pista».
- `abac-xines.html` no porta `data-hub`.
- `games/cursus-de-l-estany/`, `shared/progress.js`, `shared/sync.js` i `shared/cloud.js` no es toquen.
- Les capes de pista porten `pointer-events: none` i no fan servir pseudoelements de `.bead`.
- Amb `prefers-reduced-motion` no hi ha cap animació en bucle.
- Cada tasca confirma només els seus fitxers, pel nom. Missatge de commit en català, amb el prefix «L'àbac amb el model del cursus:».
- Fins a la tasca 13, `SECTIONS` i `LEVELS` continuen exportats: `scripts/check.mjs` els importa fins a la tasca 7.

## Review Focus

Condicions que la spec implica i que cap prova de regles cobreix soles. Cada una té la seva prova a la tasca que s'indica.

1. **Doble toc a «Comprova», o tocar boles mentre l'àbac es resol sol.** S'espera un sol intent comptat i un àbac coherent. Tasca 10.
2. **Sortir d'un projecte o d'un examen a mitges amb «← Mapa».** S'espera que no es desi res i que en tornar es comenci de nou. Tasques 10 i 11.
3. **Moure una bola mentre es veu una pista.** S'espera que la pista s'esborri i que la següent es calculi amb l'àbac d'ara. Tasca 9.
4. **Dades desades estranyes** (`notes` de 12 llocs, `secs` amb text, `piscina: "sí"`, una nota de 250). S'espera un progrés vàlid dins dels límits. Tasca 3.
5. **Girar la tauleta o canviar la mida a mitja pregunta.** S'espera que l'àbac es torni a mesurar sense scroll i que la pista segueixi sobre les boles. Tasques 8 i 9.

## Revisions

| Després de | Revisió | Per què |
|---|---|---|
| Tasca 4 | `spec-reviewer` propi | Persistència: traducció del progrés |
| Tasca 6 | `spec-reviewer`, amb les tasques 1, 2 i 5 | Generadors; les dades i els comprovadors són mecànics |
| Tasca 8 | `spec-reviewer` propi | Maquetació: l'àbac es mesura |
| Tasca 9 | `spec-reviewer` propi | Maquetació: capes sobre l'àbac |
| Tasca 10 | `spec-reviewer`, amb la tasca 7 | Nota i pantalla de projecte; la targeta és mecànica |
| Tasca 12 | `spec-reviewer`, amb la tasca 11 | Pantalles d'examen i de full |
| Tasca 13 | `code-reviewer` de tota la branca | Defectes entre tasques |

Cada defecte que trobi una revisió es converteix en una comprovació de `check-abac.mjs` a la mateixa ronda d'esmenes.

Les tasques 1, 3 i 5 (comprovadors) poden anar en paral·lel amb la tasca anterior de lògica si no comparteixen fitxers; les de pantalla (8 a 13) van en ordre, perquè totes toquen `main.js` i `style.css`.

## Fitxers

| Fitxer | Responsabilitat |
|---|---|
| `scripts/check-abac.mjs` (nou) | Les regles de l'àbac, en tres parts: A preguntes, B progrés, C examen i full |
| `games/abac-xines/logic.js` | Model de l'àbac (ja hi és), dades dels projectes, progrés, nota, XP, generadors |
| `games/abac-xines/board.js` (nou) | Un àbac a la pantalla: pintar, tocar, mesurar-se |
| `games/abac-xines/hints.js` (nou) | La capa de pistes i la resolució pas a pas |
| `games/abac-xines/main.js` | Les pantalles i el desat |
| `games/abac-xines/style.css` | Tot l'aspecte del joc |
| `abac-xines.html` | L'esquelet de la pàgina |
| `shared/games.js`, `scripts/check.mjs`, `package.json` | La targeta del hub i la cadena de comprovació |

`board.js` no era a la spec: surt de `main.js` perquè cinc pantalles pinten àbacs i el full en pinta tres alhora.

---

### Task 1: Comprovador A — les preguntes (vermell)

**Files:**
- Create: `scripts/check-abac.mjs`

**Interfaces:**
- Consumes de `games/abac-xines/logic.js` (encara no hi són): `PROJECTS`, `CIRCLES`, `POOL`. Ja hi són: `plan(q)` → `{start, stages, goal}`, `nextMove(rods, target)` → moviment o `null`, `write(v, n)`, `valueOf(rods)`, `tidy(rods)`.
- Produces: el fitxer amb una funció per part (`partA`), un comptador d'errors i sortida `process.exit(1)` si n'hi ha, amb el mateix estil que `scripts/check-cursus.mjs`.

Formes que comprova:
- `PROJECTS`: 9 objectes `{ name, sub, circle, ex }`; `ex` és una llista de 3 exercicis de 5 preguntes.
- Pregunta d'operar: `{ q: '25+17-8' }`. Pregunta de llegir: `{ read: 74, opts: [47, 24, 74, 79] }`.
- `CIRCLES`: `[{ name, projects: [0, 1] }, { name, projects: [2, 3, 4, 5] }, { name, projects: [6, 7, 8] }]`.
- `POOL`: `['3', '5', '7']`.

Regles, calculades al comprovador amb aritmètica pròpia (un avaluador petit d'esquerra a dreta, amb `x` i `:` abans que `+` i `-`), sense fer servir `plan` per saber el resultat:
- El resultat propi és igual a `plan(q).goal`. Cap valor intermedi és negatiu, cap divisió té residu, cap valor passa de 99.999.
- Seguint `nextMove` des de `write(start, n)` cap a cada pas i cap al resultat, s'arriba a un àbac endreçat amb el resultat en menys de 200 moviments.
- Cap pregunta repetida dins d'un projecte.
- Per projecte:

| Projecte | Regla |
|---|---|
| 0 Les boles | Números de l'1 al 9. Almenys 3 preguntes de llegir |
| 1 Les columnes | Números del 10 al 999. Almenys 3 preguntes de llegir |
| 2 Sumes | `a+b`. A cada columna la suma es fa sense truc: si la xifra de `b` és menor que 5, `a%5 + b ≤ 4`; si és 5 o més, la d'`a` és menor que 5 i `a%5 + (b−5) ≤ 4` |
| 3 El canvi de 5 | `a+b`. Cap columna suma 10 o més, i almenys una no compleix la regla del projecte 2 |
| 4 Me'n porto una | `a+b`. Almenys una columna suma 10 o més (comptant el que es porta) |
| 5 Restes | `a-b` amb resultat de 0 o més. A `ex00` cap columna demana prestat; a `ex02` almenys 3 preguntes en demanen |
| 6 Multiplica | `axb`, resultat fins a 999 |
| 7 Reparteix | `a:b` exacta, `b` del 2 al 9 |
| 8 Barreja | Dos operadors o més, o algun número de quatre xifres |

- Només els projectes 0 i 1 tenen preguntes de llegir. Una de llegir té 4 opcions diferents i la bona hi és.
- Les 60 preguntes d'avui hi són totes, al projecte que els toca:

| Projecte | Preguntes d'avui |
|---|---|
| 0 | `3`, `5`, `7`, llegir 8 |
| 1 | `20`, `36`, llegir 74, `58`, `407`, llegir 692 |
| 2 | `2+2`, `2+6`, `21+7`, `32+15`, `142+36`, `253+324` |
| 3 | `4+1`, `3+4`, `13+4`, `24+31` |
| 4 | `5+5`, `8+2`, `7+8`, `9+9`, `28+14`, `36+47`, `65+38`, `157+68`, `486+237`, `999+1` |
| 5 | `4-2`, `9-5`, `48-16`, `7-4`, `56-23`, `10-3`, `32-5`, `54-28`, `100-1`, `423-167` |
| 6 | `2x3`, `3x4`, `4x5`, `6x2`, `3x7`, `5x8`, `12x3`, `23x4`, `45x6`, `124x3` |
| 7 | `12:3`, `35:5`, `48:6`, `84:4` |
| 8 | `25+17-8`, `60-25+9`, `1250+375`, `2000-750`, `7x8-6`, `125x4+500` |

Si alguna pregunta d'avui no compleix la regla del seu projecte en executar la tasca 2, es canvia de projecte la pregunta i s'anota al commit; la regla no es toca.

- [ ] **Step 1:** Escriure `scripts/check-abac.mjs` amb la part A.
- [ ] **Step 2:** Executar `node scripts/check-abac.mjs`. Esperat: falla perquè `PROJECTS` no s'exporta.
- [ ] **Step 3:** Provar el comprovador amb un `PROJECTS` de mentida dins d'un fitxer del scratchpad (9 projectes vàlids, i després un amb `7+8` al projecte 2): el primer passa, el segon falla dient el projecte i la pregunta.
- [ ] **Step 4:** Commit de `scripts/check-abac.mjs`.

### Task 2: Les dades dels projectes (verd A)

**Files:**
- Modify: `games/abac-xines/logic.js` (afegir després de `LEVELS`)

**Interfaces:**
- Produces: `export const PROJECTS`, `export const CIRCLES`, `export const POOL`, amb les formes de la tasca 1. Noms i subtítols de la taula «El recorregut» de la spec.

Regles:
- 135 preguntes. Les 60 d'avui van on diu la taula de la tasca 1; la resta es escriuen noves amb la regla de cada projecte.
- La dificultat creix de `ex00` a `ex02`: números més grans o més columnes amb truc.
- Les preguntes no porten text (`tip`, `hints`, `name` i `show` d'avui no es copien).
- `SECTIONS` i `LEVELS` no es toquen.

- [ ] **Step 1:** Escriure les dades.
- [ ] **Step 2:** Executar `node scripts/check-abac.mjs`. Esperat: la part A passa sencera.
- [ ] **Step 3:** Executar `npm run check`. Esperat: passa igual que abans (el comprovador nou encara no és a la cadena).
- [ ] **Step 4:** Commit de `games/abac-xines/logic.js`.

### Task 3: Comprovador B — el progrés (vermell)

**Files:**
- Modify: `scripts/check-abac.mjs` (afegir `partB`)

**Interfaces:**
- Consumes de `logic.js` (encara no hi són): `VALID`, `EXAM_PASS`, `OLD`, `mark(firsts)`, `clean(d)`, `firstTry(r)`, `handIn(p, i, run)`, `xpOf(p)`, `levelText(p)`, `BADGES`, `badges(p)`, `isOpen(p, c)`, `examOpen(p, c)`.

Valors esperats, escrits a mà al comprovador (`// contract:` amb la secció de la spec):
- `VALID === 80`, `EXAM_PASS === 5`, `OLD` és `[0, 0, 1, 1, 2, 3, 4, 5, 5]`.
- `mark(15) === 100`, `mark(12) === 80`, `mark(11) === 73`, `mark(0) === 0`.
- `clean({})` és `{ so: true, secs: [0,0,0,0,0,0], piscina: false, notes: [0 × 9], exams: [false × 3], fulls: 0 }`.
- `clean({ secs: [10,10,4,0,0,0] })` té `notes` `[80,80,80,80,0,0,0,0,0]`, `piscina` cert i `secs` `[10,10,4,0,0,0]`.
- `clean({ secs: [3,0,0,0,0,0] })` té `piscina` cert i totes les notes a 0.
- `clean({ secs: [10,0,0,0,0,0], notes: [95] })` té `notes[0] === 95` i `notes[1] === 80`.
- Dades estranyes: `clean(null)`, `clean([])`, `clean('x')`, `clean({ notes: 'a', secs: ['x', 99, -3], piscina: 'sí', exams: [1], fulls: -2 })` donen un progrés vàlid: `secs` entre 0 i 10, notes entre 0 i 100, `piscina` i `exams` només certs si eren `true`, `fulls` 0 o més. Una nota de 250 queda a 100; `notes` de 12 llocs queda en 9.
- `clean` no baixa mai res: per a 300 progressos a l'atzar, cada camp de `clean(clean(p))` és igual que el de `clean(p)`, i cada nota i cada `secs` són iguals o més grans que els d'entrada dins dels límits.
- `clean` torna un objecte nou que no comparteix cap llista amb l'entrada.
- `firstTry`: cert només per a `{ tries: 0, helped: false }`.
- `handIn(p, i, run)` amb 15 respostes a la primera posa `notes[i]` a 100; amb 11, no valida (73) i `redo` diu els exercicis amb fallades; una nota més baixa que la desada no canvia res i `gain` és 0; `p` no es toca.
- `xpOf` de `{ piscina: true, notes: [80,100,0,0,0,0,0,0,0], exams: [true,false,false], fulls: 7 }` és 340 (50 + 180 + 50 + 60: els fulls compten fins a 3 per projecte validat). El màxim és 1.370.
- `levelText` d'aquest progrés conté `2,27`.
- `badges`: les cinc condicions de la spec, cada una encesa i apagada.
- `isOpen(p, 0)` és `p.piscina`; `isOpen(p, 1)` demana cercle 0 obert i `exams[0]`; `isOpen(p, 2)` demana el cercle 1 obert i `exams[1]` (amb `exams: [false, true, false]` el cercle 2 és tancat).
- `examOpen(p, c)`: cercle obert i tots els seus projectes amb 80 o més.

- [ ] **Step 1:** Escriure `partB`.
- [ ] **Step 2:** Executar `node scripts/check-abac.mjs`. Esperat: la part A passa i la B falla per exportacions que falten.
- [ ] **Step 3:** Commit de `scripts/check-abac.mjs`.

### Task 4: El progrés (verd B)

**Files:**
- Modify: `games/abac-xines/logic.js`

**Interfaces:**
- Produces: totes les exportacions de la tasca 3. `handIn` torna `{ prog, n, best, gain, redo, news }` com al Cursus (`games/cursus-de-l-estany/logic.js:289-301` és l'exemple a seguir, no a importar).

Regles: les de la secció «El que es desa» i «XP, nivell i insígnies» de la spec. `clean` conserva `secs` retallat entre 0 i 10 i mai l'augmenta.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** Executar `node scripts/check-abac.mjs`. Esperat: A i B passen.
- [ ] **Step 3:** Commit de `games/abac-xines/logic.js`.

### Task 5: Comprovador C — examen i full (vermell)

**Files:**
- Modify: `scripts/check-abac.mjs` (afegir `partC`)

**Interfaces:**
- Consumes de `logic.js` (encara no hi són): `exam(c, rnd)` → 6 preguntes, cada una amb `p` (el seu projecte); `examIn(p, c, qs, run)` → `{ prog, good, score, gain, redo, news }`; `sheet(rnd)` → 3 objectes `{ rods, says, bad }` amb `bad` `null`, `'veïna'`, `'dalt'` o `'girat'`; `sheetIn(p, run)` → `{ prog, good, gain, missed, news }`.

Regles:
- 200 exàmens per cercle amb un `rnd` de llavor: 6 preguntes diferents, totes de les 15 fixes d'algun projecte del cercle, almenys una de cada projecte.
- `examIn` amb 5 o 6 encerts posa `exams[c]` a cert i dona 50 XP un sol cop; amb 4 no canvia res; un examen superat no es perd; amb el cercle tancat no es dona per superat; `redo` diu els projectes de les preguntes fallades.
- 200 fulls: 3 àbacs de 3 columnes, tots endreçats, `says` entre 10 i 999; de 0 a 2 amb `bad`. En 200 fulls surten els tres tipus i també fulls amb 0, 1 i 2 dolents.
- Un àbac bo marca `says`. Un de dolent no el marca, i a més:
  - `'veïna'`: movent una sola bola a una columna del costat s'obté `says`.
  - `'dalt'`: la diferència amb `says` és 4 × 10^p en una columna amb la bola de dalt baixada.
  - `'girat'`: l'àbac marca `says` amb dues xifres intercanviades, i les dues xifres són diferents.
- `sheetIn` amb `[true, true, true]` suma 1 a `fulls`; amb qualsevol altra cosa no suma i `missed` diu quins; `gain` és 10 fins al límit de 3 fulls per projecte validat i 0 després.

- [ ] **Step 1:** Escriure `partC`.
- [ ] **Step 2:** Executar `node scripts/check-abac.mjs`. Esperat: A i B passen, C falla per exportacions que falten.
- [ ] **Step 3:** Commit de `scripts/check-abac.mjs`.

### Task 6: Examen i full (verd C)

**Files:**
- Modify: `games/abac-xines/logic.js`

**Interfaces:**
- Produces: `exam`, `examIn`, `sheet`, `sheetIn` amb les formes de la tasca 5.

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** Executar `node scripts/check-abac.mjs`. Esperat: A, B i C passen.
- [ ] **Step 3:** Commit de `games/abac-xines/logic.js`.

### Task 7: La targeta del hub i la cadena de comprovació

**Files:**
- Modify: `shared/games.js:24-26`
- Modify: `scripts/check.mjs:7,12`
- Modify: `package.json` (script `check`)
- Modify: `scripts/check-abac.mjs` (afegir la comprovació de la targeta)

Regles:
- La targeta: `total: 9`; el text de `what` diu sumar, restar, multiplicar i repartir; `record` compta els projectes validats **després de passar el desat per `clean`**, perquè un perfil que encara no ha obert el joc nou només té `secs`.
- `scripts/check.mjs` treu el total de l'àbac de `PROJECTS.length`.
- `check-abac.mjs` entra a la cadena `check` de `package.json`, després de `check-cursus.mjs`.

Valors esperats, afegits a `check-abac.mjs`:
- `record({}, 9)` és `0 de 9 projectes`.
- `record({ secs: [10,10,4,0,0,0] }, 9)` és `4 de 9 projectes`.
- `record({ notes: 'a' }, 9)` i `record(null, 9)` tornen text sense petar.

- [ ] **Step 1:** Afegir les comprovacions de la targeta i veure-les fallar.
- [ ] **Step 2:** Canviar els tres fitxers.
- [ ] **Step 3:** Executar `npm run check`. Esperat: tota la cadena passa, amb «7 games checked».
- [ ] **Step 4:** Commit dels quatre fitxers.

### Task 8: `board.js` — l'àbac com a peça

**Files:**
- Create: `games/abac-xines/board.js`
- Modify: `games/abac-xines/main.js` (la pantalla de nivell d'avui passa a fer servir `board`)
- Modify: `games/abac-xines/style.css`

**Interfaces:**
- Produces: `board(host, { n, feet, tone })` → `{ el, rods(), set(rods), lock(on), feet(mode), onMove(fn), fit(), bead(p, deck, j), rod(p), stop() }`.
  - `feet`: `'full'` (xifra i valor sota cada columna), `'letter'` (U, D, C), `'none'`.
  - `onMove(fn)`: `fn(rods)` després de cada toc.
  - `bead` i `rod` tornen els elements, perquè `hints.js` hi posi les capes a sobre.
  - `fit()` mesura la capsa i ajusta `--u`; es crida sola amb un `ResizeObserver`. `stop()` el desconnecta.

Regles:
- El comportament de tocar és el d'avui: `tap` de `logic.js`, la nota pentatònica, les boles enceses.
- La mida deixa de sortir de les fórmules amb 330px, 500px i 150px fixos: surt de mesurar l'espai lliure del contenidor, com `fitter` a `games/cursus-de-l-estany/material.js:17-33`.
- Diversos àbacs poden viure alhora a la mateixa pantalla (el full en té tres).
- El joc d'avui (seccions i nivells) continua funcionant igual sobre `board`.

Prova al navegador (la fa la sessió pare amb `npm run dev`), a 390×844, 844×390 i 820×1180:
- [ ] Un nivell de 3 columnes i un de 5: l'àbac es veu sencer, sense scroll vertical ni horitzontal.
- [ ] Review Focus 5: canviar la mida de la finestra a mitja pregunta torna a ajustar l'àbac i les boles conserven la posició.
- [ ] `npm run check` passa.
- [ ] Commit dels tres fitxers.

### Task 9: `hints.js` — les pistes sobre l'àbac

**Files:**
- Create: `games/abac-xines/hints.js`
- Modify: `games/abac-xines/style.css`
- Modify: `games/abac-xines/main.js` (el botó de pista d'avui crida `hints`)

**Interfaces:**
- Consumes: `board` de la tasca 8; `nextMove(rods, target)` → `{ p, deck, to, why }` amb `why` de `add`, `take`, `five`, `ten`, `borrow`, `more`, `less`, `carry`.
- Produces: `hints(b)` → `{ strip(target), show(move), play(target, on), stop() }`.
  - `strip(target)`: la tira de valors del que marca l'àbac; si es dona `target`, a sota la del que ha de marcar.
  - `show(move)`: el dibuix del motiu, segons la taula «Les pistes» de la spec.
  - `play(target, on)`: resol l'àbac pas a pas amb `nextMove`; `on()` torna fals per aturar-ho; torna una promesa.
  - `stop()`: esborra totes les capes i atura els bucles.

Regles:
- Les capes van en un element propi sobre l'àbac, amb `pointer-events: none`. No es fa servir cap pseudoelement de `.bead`.
- Verd el que es posa, vermell el que es treu; la tira fa servir el color de cada columna (`HUES` d'avui).
- Les targetes de truc diuen l'operació amb xifres (`+4 = +5 −1`), sense frase.
- Review Focus 3: `board.onMove` crida `stop()`; la pista següent es calcula amb l'àbac d'aquell moment.
- Amb moviment reduït: fletxes i etiquetes fixes, cap bucle; `play` posa cada pas sense transició.
- Cap text amb «company» ni «segon».

Prova al navegador (sessió pare), amb aquests casos, cada un demanant la pista:

| Pregunta | Estat de l'àbac | S'ha de veure |
|---|---|---|
| `2+2` | 2 | Tira `2`, fantasma verda a les unitats |
| `4+1` | 4 | Targeta `+1 = +5 −4`, fantasma verda a dalt i vermella a baix |
| `8+2` | 8 | Targeta `+2 = +10 −8`, fantasma verda a les desenes |
| `7+8` | 7 | Targeta `+8 = +10 −2` |
| `10-3` | 10 | Targeta `−3 = −10 +7` |
| `36+47` | columna amb 5 boles de baix | Canvi de 5, etiqueta `5 → 1` |
| `36+47` | columna amb 10 | Canvi de 10, etiqueta `10 → 1` |

- [ ] Els set casos es veuen com diu la taula, a 390×844 i a 844×390.
- [ ] Tocar una bola amb la pista a la vista l'esborra.
- [ ] Review Focus 5: canviar la mida amb la pista a la vista la deixa sobre les mateixes boles, o l'esborra; mai desplaçada.
- [ ] Amb moviment reduït activat al navegador no hi ha cap bucle.
- [ ] `npm run check` passa. Commit dels tres fitxers.

### Task 10: El mapa i la pantalla de projecte

**Files:**
- Modify: `games/abac-xines/main.js`
- Modify: `games/abac-xines/style.css`
- Modify: `abac-xines.html`

**Interfaces:**
- Consumes: `PROJECTS`, `CIRCLES`, `clean`, `handIn`, `firstTry`, `isOpen`, `plan`, `nextMove`, `valueOf`, `tidy`; `board`; `hints`; `load` i `save` de `shared/progress.js`; `panel` de `shared/sections.js`.
- Produces: a `main.js`, `mapa()` i `projecte(i)`, i la disciplina de pantalles del Cursus (`enter()` torna un testimoni, `fresh()` cancel·la la pantalla anterior, cada espera comprova el testimoni, guarda de 450 ms contra el doble toc). `games/cursus-de-l-estany/main.js` és l'exemple.

Regles:
- El progrés es llegeix amb `clean(load('abac-xines'))` i es desa sencer, amb `secs` tal com ha vingut.
- **Mapa:** tres bandes, una per cercle, amb un botó per projecte que mostra el nom, el subtítol i la nota. Un cercle tancat té els botons desactivats. En aquesta tasca encara no hi ha barra d'XP, botó d'examen, Piscina ni full: un progrés sense Piscina veu el cercle 0 tancat (es prova amb un desat fet a mà).
- **Projecte:** 15 preguntes seguides, amb el rètol `ex00`, `ex01` o `ex02` i els peus `'full'`, `'letter'` o `'none'`.
- «Comprova»: bona si l'àbac marca el resultat i està endreçat. Un àbac amb el valor bo però desendreçat és un intent fallat.
- Primer error: `hints.strip(goal)`. Segon error: `hints.play(goal)` i, en acabar, pregunta següent.
- «Dona'm una pista»: marca la pregunta com a ajudada, i crida `hints.strip()` i `hints.show(nextMove(...))`. A `ex02` també posa els peus `'letter'`.
- Preguntes de llegir: àbac bloquejat, quatre opcions; una opció dolenta es desactiva i compta com a intent; la pista és `hints.strip()`.
- En acabar: `handIn`, desar, i tauler amb la nota, l'XP guanyat, els exercicis per repassar i les insígnies noves.
- La pàgina: `#joc` es conserva; «← Seccions» passa a «← Mapa»; l'expressió `HUB` continua apuntant a `abac-xines.html`.
- `sectionMenu`, `levelRow` i `wireLevels` deixen d'usar-se; `panel` es conserva.

Prova al navegador (sessió pare):
- [ ] Amb un desat `{"secs":[10,10,4,0,0,0]}` fet a mà: el mapa mostra els cercles 0 obert, els projectes 0 a 3 amb 80, i els cercles 1 i 2 tancats (falta l'examen).
- [ ] Un projecte fet sencer a la primera dona 100 i es desa; refer-lo fallant no baixa la nota.
- [ ] Una pregunta amb pista no compta: 14 a la primera i una amb pista donen 93.
- [ ] Review Focus 1: doble toc ràpid a «Comprova» amb l'àbac malament compta un sol intent; tocar boles durant `play` no deixa l'àbac en un valor que no sigui el resultat.
- [ ] Review Focus 2: sortir amb «← Mapa» a la pregunta 7 no desa res; tornar-hi comença per la pregunta 1.
- [ ] Sense scroll a 390×844, 844×390 i 820×1180, al mapa i al projecte.
- [ ] `npm run check` passa. Commit dels tres fitxers.

### Task 11: Barra d'XP, Piscina i examen

**Files:**
- Modify: `games/abac-xines/main.js`
- Modify: `games/abac-xines/style.css`
- Modify: `abac-xines.html` (element `#xp`)

**Interfaces:**
- Consumes: `POOL`, `xpOf`, `levelText`, `examOpen`, `exam`, `examIn`, `EXAM_PASS`.
- Produces: `piscina()`, `examen(c)`, `paintXp()`.

Regles:
- **Barra d'XP** sempre visible: text del nivell i barra plena segons la part decimal.
- **Piscina:** si `piscina` és fals, el joc hi entra directament. Tres reptes sense text: el número gran i l'àbac amb peus `'none'`; quan l'àbac marca el número i està endreçat, el repte s'acaba sol. En acabar, `piscina` passa a cert, es desa i s'obre el mapa.
- **Examen:** botó a cada banda del mapa, actiu quan `examOpen`. Sis preguntes, peus `'none'`, sense botó de pista, un sol «Comprova» (o una sola opció) per pregunta i després «Segueix». En acabar, `examIn`, desar, i tauler amb el resultat i els projectes per repassar.

Prova al navegador (sessió pare):
- [ ] Un perfil nou entra a la Piscina, la passa i veu el mapa amb «Nivell 0,33».
- [ ] Amb els dos projectes del cercle 0 validats, l'examen s'obre; amb 5 de 6 s'obre el cercle 1; amb 4 no, i es pot repetir.
- [ ] Review Focus 2: sortir d'un examen a mitges no desa res.
- [ ] Sense scroll a les tres mides.
- [ ] `npm run check` passa. Commit dels tres fitxers.

### Task 12: Caça l'errada, insígnies i el consell del mapa

**Files:**
- Modify: `games/abac-xines/main.js`
- Modify: `games/abac-xines/style.css`

**Interfaces:**
- Consumes: `sheet`, `sheetIn`, `BADGES`, `badges`.
- Produces: `full()`.

Regles:
- **Full:** botó «Caça l'errada» sota el mapa, actiu amb algun projecte validat. Tres àbacs, un darrere l'altre, cada un amb «Aquest àbac marca N», bloquejat, i dos botons: «És correcte» i «No és correcte». Si el nen diu que no ho és, l'àbac es desbloqueja i ha de marcar N; «Comprova», un sol intent. Dir «És correcte» d'un de dolent, o «No és correcte» d'un de bo, és un error. En acabar, `sheetIn`, desar, i tauler que diu quins eren dolents.
- **Insígnies:** la llista sota el mapa, enceses les guanyades.
- **Consell del mapa:** una línia que diu què toca ara (la Piscina, un projecte sense validar, l'examen obert, o res si tot és fet).

Prova al navegador (sessió pare):
- [ ] Un full amb els tres ben jutjats suma 10 XP i encén la insígnia del full perfecte.
- [ ] El quart full amb un sol projecte validat no suma XP.
- [ ] Sense scroll a les tres mides, amb el mapa sencer (tres bandes, botó de full, insígnies) desplaçable només si no hi cap.
- [ ] `npm run check` passa. Commit dels dos fitxers.

### Task 13: Neteja i comprovació de textos

**Files:**
- Modify: `games/abac-xines/logic.js` (treure `SECTIONS` i `LEVELS`)
- Modify: `games/abac-xines/main.js`, `games/abac-xines/style.css` (treure el que ja no es fa servir)
- Modify: `scripts/check-abac.mjs`
- Modify: `README.md` (la línia que descriu l'àbac, si parla de nivells o seccions)

Regles:
- `check-abac.mjs` llegeix `logic.js`, `main.js`, `hints.js` i `board.js` com a text i falla si hi troba `/company|segon/i`, el text «Pista» sol en un botó (ha de ser «Dona'm una pista»), o una importació de `sectionMenu`, `levelRow` o `wireLevels`.
- `check-abac.mjs` falla si `abac-xines.html` conté `data-hub`.
- No queda cap referència a `SECTIONS` ni `LEVELS` al repositori fora de `.claude/` i `docs/`.

- [ ] **Step 1:** Afegir les comprovacions de text i veure quines fallen.
- [ ] **Step 2:** Treure el codi mort.
- [ ] **Step 3:** `npm run build`. Esperat: tota la cadena passa i Vite construeix les pàgines.
- [ ] **Step 4:** Sessió pare, a `npm run preview`: recorregut sencer d'un perfil nou (Piscina, un projecte, mapa) i d'un perfil amb `{"secs":[10,10,10,10,10,10]}` (nou projectes amb 80, cercle 0 obert, cercles 1 i 2 pendents d'examen), i la targeta del hub diu «9 de 9 projectes».
- [ ] **Step 5:** Commit. Després, `code-reviewer` de tota la branca.

---

## Riscos

Els de la spec (secció «Riscos»), amb la tasca que els porta.

| Risc | On es porta |
|---|---|
| 1 Forma del progrés i dades al núvol | Tasques 3 i 4; la targeta, tasca 7 |
| 2 Llistes fetes a mà | Tasca 7 |
| 3 `logic.js` importable des de Node | Global Constraints; el comprovador l'importa a cada tasca |
| 4 `shared/sections.js` fixa 10 nivells | Tasques 10 i 13 |
| 5 Mides de l'àbac | Tasques 8 i 9, i la prova de mides de cada tasca de pantalla |
| 6 Textos amb un segon jugador | Tasca 13 |
| 7 Dades de mostra als altres comprovadors | Descartat: no importen el joc |
| 8 El bucle del Cursus no es pot copiar | Tasca 10 |
| 9 Handoffs antics del Cursus | Descartat: la referència és el codi |
| 10 Identificadors de la pàgina | Tasca 10 |
| 11 Arbres de treball antics | Descartat: no es toquen |

Risc nou, trobat en fer el pla: la targeta del hub llegeix el desat sense passar pel joc, i un perfil que no ha obert el joc nou només té `secs`. Es porta a la tasca 7 (`record` passa per `clean`).
