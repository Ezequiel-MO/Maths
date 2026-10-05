# El cursus de l'estany — pla d'implementació

> **Per a qui l'executi:** cal la sub-skill superpowers:subagent-driven-development (recomanada) o superpowers:executing-plans. Les tasques es fan per ordre; cada pas té una casella (`- [ ]`).

**Objectiu:** un joc nou per aprendre a dividir, de repartir objectes fins a tres xifres entre una, amb l'estructura de 42: Piscina, mapa de projectes, exercicis sense lliçó, correcció de companyes, exàmens, XP i nivell.

**Arquitectura:** com `nenufars-a-trossos`. `logic.js` sense DOM té les dades, els generadors i les regles de progrés, i un comprovador de Node el verifica abans de cada construcció. `main.js` pinta les pantalles amb el codi de `shared/`. El progrés desat només guarda fets (notes, exàmens, fulls); el XP, el nivell i les insígnies es calculen.

**Tecnologia:** JavaScript sense framework, Vite multipàgina, scripts de Node per comprovar. Cap dependència nova.

**Spec:** `docs/superpowers/specs/2026-10-04-cursus-de-l-estany-design.md`. Qui executa llegeix les dues coses.

## Regles per a totes les tasques

- **Esmena (2026-10-05, decisió de l'Oliver):** el nen juga sol. Cap text de pantalla parla de companyes ni de granotes que ajuden o que es corregeixen. El botó de pista es diu «Dona'm una pista». L'activitat de la tasca 9 es diu «Caça l'errada» (al mapa i a la pantalla); les regles, el XP i les insígnies no canvien.
- Textos de pantalla en català. Comentaris i identificadors del codi en anglès, amb el mateix estil dens que `games/nenufars-a-trossos/` (punt i coma, cometes simples, comentaris curts que diuen el perquè). Els noms de dades que la spec dona en català es queden en català (`notes`, `exams`, `fulls`, `equip`, `piscina`).
- `logic.js` no toca `document`, `window` ni `localStorage`, i no importa res de `shared/util.js` (trenca sota Node). L'atzar entra per un paràmetre `rnd = Math.random`.
- No es fan servir `sectionMenu`, `levelRow` ni `wireLevels` de `shared/sections.js`: suposen seccions de 10 nivells. Sí `panel()`, que necessita un `<button>` dins de l'html i un amfitrió amb `position: relative`.
- Cada pantalla asíncrona agafa un testimoni amb `fresh()` i comprova `t.on` després de cada `await sleep`. En sortir d'una pantalla, `keyFn = null`.
- Límits dels números: cercles 0 i 1, dividend fins a 100 i divisor de 2 a 10; cercle 2, dividend fins a 999 i divisor de 2 a 9.
- Clau de progrés `cursus-de-l-estany`, forma `{ so, piscina, equip, notes, exams, fulls }`. La spec hi posava també `xp` i `insignies`; es calculen i no es desen, perquè no es puguin desquadrar.
- Nota per validar: 80. Examen superat: 5 de 6. Nivell: XP ÷ 150 amb dos decimals i coma. XP màxim: 1.240.
- Branca `cursus-de-l-estany`. Cada tasca acaba amb un commit dels seus fitxers, anomenats un per un. Missatge en català, «El cursus de l'estany: què», amb la línia `Co-Authored-By` de la sessió.
- Una tasca que passi d'unes 60 crides d'eina s'atura al proper punt de control i ho diu.

## Què pot fallar i ningú no demana (i on es comprova)

1. **Progrés desat malmès o d'una altra forma** (un text on hi ha d'haver una llista, notes de 500, `null`): el joc i la portada s'obren igualment, amb els valors dins de límits. → `clean()` al comprovador (tasca 4) i prova al navegador (tasca 5).
2. **Residu no reduït**: a 17 ÷ 5 el nen escriu 2 i en sobren 7. És equivocat, i el missatge diu que amb 7 encara es pot fer un grup més. → comprovador (tasques 1 i 3).
3. **Prémer ✓ amb la casella buida**: no compta com a resposta ni com a error. → navegador (tasca 6).
4. **Doble toc** a ✓ o a «Segueix»: no respon la pregunta següent. → guarda de 450 ms, navegador (tasques 6 i 10).
5. **Sortir a mitja animació** (tornar al mapa mentre una cuca vola o un panell espera): no s'obre cap pantalla vella ni es desa res a deshora. → navegador (tasques 5 i 6).
6. **Mòbil estret amb molt material**: 40 cuques o un dividend de tres xifres en tres trossos, amb el teclat enganxat a baix, es veuen sencers a 360 px. → navegador (tasques 6 i 8).

## Fitxers

| Fitxer | Què fa |
|---|---|
| `games/cursus-de-l-estany/logic.js` | Projectes i preguntes, resposta correcta, missatges, generadors d'examen i de fulls, regles de progrés |
| `games/cursus-de-l-estany/main.js` | Progrés, Piscina, mapa, projecte, corregir, examen |
| `games/cursus-de-l-estany/material.js` | El material que es mou: cuques i nenúfars, graella, barres, trossos. Una funció per figura, que rep un element i una pregunta |
| `games/cursus-de-l-estany/style.css` | Comença amb els `@import` de `shared/base.css` i `shared/sections.css` |
| `cursus-de-l-estany.html` | La pàgina, calcada de `nenufars-a-trossos.html` |
| `scripts/check-cursus.mjs` | Comprovador de la lògica |
| `shared/games.js`, `scripts/check.mjs`, `package.json` | Targeta, total i cadena de `check` |

`material.js` és a part perquè `main.js` no passi de les 350 línies que té el dels nenúfars.

## Dades (les fan servir totes les tasques)

Una pregunta és un objecte `{ mode, D, d, ... }`. `D` és el dividend i `d` el divisor.

| Mode | Projecte | Camps de més | El nen escriu | `want(q)` |
|---|---|---|---|---|
| `share` | Repartir | | quantes a cada grup | `D / d` |
| `group` | Fer grups | | quants grups | `D / d` |
| `fact` | La taula al revés | | el quocient | `D / d` |
| `rem` | En sobra | | quocient i residu | `[q, r]` |
| `proof` | Comprova | `q`, `r` (i `D` és la resposta) | el dividend | `D` |
| `tens` | Desenes senceres | | el quocient | `D / d` |
| `split` | A trossos | `parts` (2 trossos) | el quocient de cada tros i el total | `[...parcials, q]` |
| `long` | Tres xifres | `parts` (2 o 3 trossos) | els parcials, el total i el residu | `[...parcials, q, r]` |

Camps comuns: `hands: true` (cal moure el material abans d'escriure), `hide: true` (material amagat fins a la pista), `bare: true` (examen i fulls: sense material ni parcials; `split` vol `q` i `long` vol `[q, r]`).

Límits per projecte, que el comprovador exigeix:

| Projecte | Límits |
|---|---|
| Repartir | `D` ≤ 30 (≤ 12 a `ex00`), `d` 2–5, exacta |
| Fer grups | `D` ≤ 40, `d` 2–10, exacta |
| La taula al revés | `D` ≤ 100, `d` 2–10, quocient 1–10, exacta |
| En sobra | `D` ≤ 50 (≤ 100 a `ex02`), `d` 2–10, quocient ≤ 10; a cada exercici, almenys 4 de 5 amb residu |
| Comprova | `d` 2–10, `q` 1–10, `r` de 0 a `d − 1`, `D` ≤ 100 |
| Desenes senceres | `D` múltiple de 10 fins a 990, `d` 2–9, `D / 10` divisible per `d` |
| A trossos | `D` de 20 a 99, `d` 2–9, exacta; 2 trossos que sumen `D`, tots dos divisibles per `d`, el primer múltiple de `10 × d` |
| Tres xifres | `D` de 100 a 999, `d` 2–9; 2 o 3 trossos que sumen `D`; tots divisibles per `d` llevat de l'últim; el primer múltiple de `10 × d`; almenys 2 de 5 amb residu a `ex01` i `ex02` |

A cada projecte: `ex00` té `hands`, `ex01` té el material a la vista, `ex02` té `hide`.

---

### Tasca 1 — Lògica dels cercles 0 i 1, i comprovador

**Fitxers:** crea `games/cursus-de-l-estany/logic.js`, `scripts/check-cursus.mjs`; modifica `package.json` (afegeix `&& node scripts/check-cursus.mjs` a `check`).

**Produeix:**
- `PROJECTS`: llista de 8 `{ name, sub, circle, mode, ex }`, amb `ex` de 3 exercicis de 5 preguntes. En aquesta tasca, els 5 projectes dels cercles 0 i 1 amb les preguntes; els 3 del cercle 2 amb `ex: []`.
- `CIRCLES`: 3 `{ name, projects }` amb els índexs dels projectes (0–1, 2–4, 5–7).
- `want(q)`, `right(q, ans)` (compara com a text, com als nenúfars).
- `tipFor(q)`: l'enunciat. `explain(q, deep, ans)`: què mirar, o el raonament sencer amb `deep`. `said(q)`: la frase després d'encertar, que diu la divisió sencera.
- `inLimits(q, p)`: si la pregunta compleix els límits del projecte `p`. La fan servir els generadors de la tasca 3 i el comprovador.

**Regles:** a `rem`, `explain` amb un residu `ans[1] >= d` diu que encara es pot fer un grup més; amb `ans[0] * d + ans[1] !== D` diu que es comprovi multiplicant.

- [ ] Escriu el comprovador primer, amb l'ajudant `check(ok, msg)` que compta errors i no s'atura, i acaba amb `process.exit(1)` si n'hi ha. Comprova: 8 projectes i 3 cercles; a cada projecte amb preguntes, 3 exercicis de 5; cada pregunta amb el mode del projecte, dins de límits (recalculats al comprovador, sense fer servir `inLimits`) i amb `D === d × q + r`, `0 ≤ r < d`; `hands`, vista i `hide` a `ex00`, `ex01`, `ex02`; `right(q, want(q))`; es rebutgen el quocient ± 1 i, a `rem`, `[q − 1, r + d]`; `tipFor`, `explain` (els dos nivells, amb i sense `ans`) i `said` són textos de més de 10 caràcters sense `undefined|NaN|null|[object`.
- [ ] Executa `node scripts/check-cursus.mjs`: ha de fallar perquè `logic.js` no existeix.
- [ ] Escriu `logic.js`.
- [ ] `node scripts/check-cursus.mjs` acaba amb `cursus-de-l-estany: 75 preguntes` i codi 0.
- [ ] Commit.

### Tasca 2 — Lògica del cercle 2

**Fitxers:** modifica `games/cursus-de-l-estany/logic.js`, `scripts/check-cursus.mjs`.

**Consumeix:** `PROJECTS`, `want`, `right`, `tipFor`, `explain`, `said`, `inLimits` de la tasca 1.

**Produeix:** les 45 preguntes de `tens`, `split` i `long`; `want`, els missatges i `inLimits` per a aquests modes; `want` amb `bare`.

**Regles:** a `split` i `long`, `explain` amb `deep` escriu la suma dels trossos i el quocient de cada un («84 = 80 + 4; 80 ÷ 4 = 20 i 4 ÷ 4 = 1; 20 + 1 = 21»). Si un parcial de `ans` és equivocat, el missatge sense `deep` diu quin tros cal repassar.

- [ ] Afegeix al comprovador: els trossos sumen `D`; tots divisibles per `d` llevat de l'últim a `long`; el primer és múltiple de `10 × d`; `want(q)` té un valor per tros, més el total, més el residu a `long`; amb `bare`, `want` és `q` o `[q, r]`; es rebutja una resposta amb un parcial canviat encara que el total sigui bo. Treu la condició «projecte amb preguntes».
- [ ] Executa'l: falla pels tres projectes buits.
- [ ] Escriu les preguntes i el codi.
- [ ] `node scripts/check-cursus.mjs` acaba amb `120 preguntes` i codi 0.
- [ ] Commit.

### Tasca 3 — Generadors d'examen i de fulls

**Fitxers:** modifica `games/cursus-de-l-estany/logic.js`, `scripts/check-cursus.mjs`.

**Consumeix:** `PROJECTS`, `CIRCLES`, `want`, `right`, `inLimits`.

**Produeix:**
- `exam(circle, rnd)`: 6 preguntes diferents, `bare`, almenys una de cada projecte del cercle, cada una dins dels límits del seu projecte. Cada pregunta porta `p`, l'índex del projecte.
- `EXAM_PASS = 5`.
- `sheet(valid, rnd)`: `valid` és la llista d'índexs de projectes validats (si és buida, `[0]`). Torna 3 `{ q, shown, ok }`: `q` és `bare`, `shown` és la resposta que ha escrit la granota i `ok` si és bona. A cada full, 0, 1 o 2 equivocades.
- `judge(item, saysOk, fix)`: cert si `item.ok && saysOk`, o si `!item.ok && !saysOk && right(item.q, fix)`.

**Errors de les granotes:** quocient d'una unitat de més o de menys (tots els modes; a `proof`, on la resposta és el dividend, la granota s'oblida de sumar el residu o suma `d` de més); residu no reduït `[q − 1, r + d]` (`rem`, `long`); residu oblidat `[q, 0]` quan `r > 0` (`rem`, `long`); un tros mal dividit, que canvia el quocient en 10 (`split`, `long`).

- [ ] Afegeix al comprovador, amb un generador d'atzar amb llavor (LCG, llavor `1000 + cercle`), 200 exàmens per cercle i 200 fulls per cada conjunt `valid` que sigui un prefix de `[0..7]`: longituds 6 i 3; sense repetides; `bare`; cada pregunta dins dels límits del projecte `p`; `item.ok === right(item.q, item.shown)`; entre 0 i 2 equivocades per full i, en el conjunt de 200, fulls de les tres menes; `shown` té la mateixa forma que `want(q)`; `judge` torna cert amb la decisió bona i fals amb les altres tres combinacions.
- [ ] Executa'l: falla perquè `exam` no existeix.
- [ ] Escriu els generadors.
- [ ] `node scripts/check-cursus.mjs` acaba amb `120 preguntes, 600 exàmens, 1600 fulls` i codi 0.
- [ ] Commit.

### Tasca 4 — Regles de progrés

**Fitxers:** modifica `games/cursus-de-l-estany/logic.js`, `scripts/check-cursus.mjs`.

**Produeix:**
- `VALID = 80`; `mark(firsts)`: `Math.round(100 × firsts / 15)`.
- `clean(d)`: torna sempre un progrés ben format a partir de qualsevol JSON: `so` (cert llevat que sigui `false`), `piscina` (booleà), `equip` (−1 a 2), `notes` (8 enters de 0 a 100), `exams` (3 booleans), `fulls` (enter ≥ 0).
- `validated(p)`: índexs amb nota ≥ 80.
- `xpOf(p)`: 50 si `piscina`; més la nota de cada projecte validat; més 50 per examen superat; més 10 × el mínim entre `fulls` i 3 × projectes validats.
- `levelText(xp)`: `(xp / 150).toFixed(2)` amb coma.
- `isOpen(p, circle)`: el cercle 0 amb la Piscina feta; els altres amb l'examen anterior superat. `examOpen(p, circle)`: cercle obert i tots els seus projectes validats.
- `BADGES`: 5 `{ name, what }`. `badges(p)`: 5 booleans, en l'ordre de la spec.
- `TEAMS`: 3 `{ name, hue }`: Libèl·lules, Tritons, Cuques.

- [ ] Afegeix al comprovador: `[0, 11, 12, 15].map(mark)` és `0,73,80,100`; `clean` amb `null`, `'x'`, `[]`, `{ notes: 'a' }`, `{ notes: [500, -3, 79.6] }`, `{ fulls: -2, equip: 9 }` torna la forma sencera dins de límits; progrés buit: XP 0, «0,00», cap cercle obert, cap insígnia; progrés ple (notes 100, 3 exàmens, 24 fulls): XP 1.240, «8,27», tot obert, 5 insígnies; 100 fulls sense cap projecte validat donen 0 XP; notes de 79 no validen ni donen XP; `isOpen` i `examOpen` a cada pas d'un recorregut sencer.
- [ ] Executa'l: falla.
- [ ] Escriu les regles.
- [ ] `node scripts/check-cursus.mjs` passa.
- [ ] Commit.

### Tasca 5 — Pàgina, Piscina, mapa i targeta

**Fitxers:** crea `cursus-de-l-estany.html`, `games/cursus-de-l-estany/main.js`, `material.js`, `style.css`; modifica `shared/games.js`, `scripts/check.mjs`.

**Consumeix:** tota la tasca 4, `PROJECTS`, `CIRCLES`.

**Produeix:**
- La pàgina, amb `#sky`, `#fx`, `#toG`, `#so`, `#kick`, `#game`; el botó de tornar es diu `#toM` («← Mapa»). L'expressió que amaga «Tots els jocs» mira `cursus-de-l-estany\.html$`.
- `main.js`: `prog` carregat amb `clean(load(KEY))`; `fresh()`, `keyFn`, `show(kicker, playing)`, botó de so; `piscina()`, `equip()`, `mapa()`, i `projecte(i)`, `corregir()`, `examen(c)` que de moment tornen al mapa.
- La barra de XP a dalt de totes les pantalles: «Nivell 2,37», barra amb la part decimal, i l'emblema de l'equip.
- `material.js`: `fireflies(host, q, { onDone })`, cuques que es reparteixen entre nenúfars tocant un nenúfar; quan no en queden, crida `onDone`. Si queden desiguals, tornen i es torna a provar.
- Piscina: tres reptes amb `fireflies` (6 entre 2, 12 entre 3, 15 entre 5), sense números; després el panell per triar equip.
- Mapa: tres cercles concèntrics amb els projectes com a botons (nom, nota si n'hi ha, validat o no), l'examen de cada cercle, el botó «Corregir» i les 5 insígnies. Un cercle tancat diu què falta. Amb teclat, els botons es recorren amb el tabulador.
- Targeta a `shared/games.js`: `id` i `store` `cursus-de-l-estany`, etiqueta «Dividir», `total: 8`, `record` que compta notes ≥ 80 i torna «N de 8 projectes» o buit, sense fallar amb `{}` ni amb `notes` que no sigui una llista. Icona SVG en línia. `scripts/check.mjs`: `'cursus-de-l-estany': PROJECTS.length`.

- [ ] Escriu la pàgina, l'estil i el codi.
- [ ] `npm run check` passa (7 jocs).
- [ ] Al navegador (`npm run dev`), a 390 px i a 1280 px, sense errors a la consola: Piscina sencera; un repartiment desigual torna enrere; tria d'equip; mapa amb el cercle 0 obert i els altres tancats; recarregar conserva Piscina i equip; tornar al mapa a mig vol d'una cuca no obre res després.
- [ ] Amb `localStorage['cursus-de-l-estany']` posat a `"x"`, a `{"notes":"a"}` i a `{"notes":[500]}`, el joc i la portada s'obren.
- [ ] Commit.

### Tasca 6 — Pantalla de projecte amb cuques (Repartir, Fer grups, En sobra)

**Fitxers:** modifica `games/cursus-de-l-estany/main.js`, `material.js`, `style.css`.

**Consumeix:** `PROJECTS`, `want`, `right`, `tipFor`, `explain`, `said`, `mark`, `VALID`; `fireflies`, `panel`, `voice`, `pond`.

**Produeix:**
- `projecte(i)`: tres exercicis seguits amb la fila `ex00 · ex01 · ex02`, 5 preguntes cada un. Teclat numèric com el dels nenúfars (12 tecles, teclat físic amb `keyFn`), amb una casella per número que demana `want(q)`; tocar una casella la tria.
- Amb `hands`, el teclat s'obre quan el material està fet. Amb `hide`, el material no es veu fins a la pista.
- Error: tremola, «Ui!» i `explain`; al segon, `explain` amb `deep` i el material resolt. La pregunta es repeteix. Encert: `said(q)`, espurnes i següent.
- «Pregunta a una companya»: una granota diu `explain`, i compta com a pista.
- Una pregunta compta per a la nota si s'encerta a la primera i sense pista.
- Panell d'entrega: la nota, «Validat» amb el XP guanyat (o la diferència si millora) o, amb menys de 80, quins exercicis repassar; insígnies noves. Desa la millor nota abans de la pausa.
- `material.js`: `fireflies` amb el mode de fer grups (un botó «Fes un grup de d») i amb les que sobren a part.

- [ ] Escriu el codi.
- [ ] `npm run check` passa.
- [ ] Al navegador, a 360, 390 i 1280 px, sense errors a la consola: Repartir sencer amb nota 100; Fer grups fallant a posta fins a menys de 80; En sobra amb 17 ÷ 5 responent 2 i 7 (missatge del grup de més); ✓ amb la casella buida no fa res; doble toc a ✓ no respon la següent; tornar al mapa a mig exercici no desa nota; 40 cuques i el teclat es veuen sencers a 360 px.
- [ ] Commit.

### Tasca 7 — Graella (La taula al revés, Comprova)

**Fitxers:** modifica `games/cursus-de-l-estany/material.js`, `main.js`, `style.css`.

**Consumeix:** `projecte(i)` de la tasca 6 i la manera com hi demana el material.

**Produeix:** `grid(host, q, { onDone })`: una graella de `d` columnes. A `fact`, amb `hands`, el botó «Afegeix una fila» fins a tenir `D` caselles; les files són el quocient. A `proof`, `q` files de `d` i `r` caselles a part. Resolta, escriu `d × q` al costat.

- [ ] Escriu el codi.
- [ ] Al navegador, a 390 i 1280 px: La taula al revés i Comprova sencers; la pista ensenya la graella a `ex02`; 10 × 10 es veu sencera a 360 px. En validar el tercer projecte del cercle 1, l'examen del cercle s'il·lumina al mapa.
- [ ] Commit.

### Tasca 8 — Barres i trossos (cercle 2)

**Fitxers:** modifica `games/cursus-de-l-estany/material.js`, `main.js`, `style.css`.

**Consumeix:** `projecte(i)`, `fireflies`.

**Produeix:**
- `bars(host, q, { onDone })`: barres de deu i plaques de cent que es reparteixen entre `d` nenúfars tocant-los, com les cuques.
- `chunks(host, q)`: el dividend en 2 o 3 caixes amb el signe + entremig, i sota de cada una la casella del seu parcial; després la del total i, a `long`, la del residu. Les caselles són les del teclat de la tasca 6.

- [ ] Escriu el codi.
- [ ] Al navegador, a 360, 390 i 1280 px: els tres projectes sencers; a 84 ÷ 4, escriure 20, 2, 22 marca el tros equivocat; un dividend de tres trossos amb residu i el teclat es veuen sencers a 360 px.
- [ ] Commit.

### Tasca 9 — Corregir una companya

**Fitxers:** modifica `games/cursus-de-l-estany/main.js`, `style.css`.

**Consumeix:** `sheet`, `judge`, `validated`, `xpOf`, `badges`, `want`, `said`.

**Produeix:** `corregir()`: el full d'una granota amb nom, tres divisions resoltes d'una en una. Dos botons, «És correcta» i «No és correcta»; amb el segon s'obre el teclat per escriure el resultat bo. Després de cada una es diu si la decisió era bona, amb `said(q)`. Al final, panell: «Full ben corregit» amb el XP (10, o 0 amb l'avís que cal validar més projectes per guanyar-ne), o quines s'han escapat. Desa `fulls + 1` només si el full queda ben corregit. Sense pista.

- [ ] Escriu el codi.
- [ ] Al navegador, a 390 i 1280 px: un full ben corregit suma 10 XP i dona la insígnia del primer full; un de mal corregit no suma; amb 3 fulls i un sol projecte validat, el quart dona 0 XP i ho diu; doble toc a un botó no decideix la següent.
- [ ] Commit.

### Tasca 10 — Exàmens

**Fitxers:** modifica `games/cursus-de-l-estany/main.js`, `style.css`.

**Consumeix:** `exam`, `EXAM_PASS`, `examOpen`, `want`, `right`, `said`, `PROJECTS`.

**Produeix:** `examen(c)`: 6 preguntes sense material ni pista, una resposta per pregunta; després de cada una, si era correcta i la resposta bona, i «Segueix». Panell final: superat (50 XP la primera vegada, s'obre el cercle següent; al tercer, la insígnia del cursus complet i una celebració) o no superat, amb els noms dels projectes de les preguntes fallades. Es pot repetir amb preguntes noves.

- [ ] Escriu el codi.
- [ ] Al navegador, a 390 i 1280 px: un examen superat obre el cercle 1; un de no superat diu què repassar i no obre res; repetir-lo superat no torna a donar XP; doble toc a «Segueix» no respon la següent; amb els tres superats, 5 insígnies possibles i la portada diu «8 de 8 projectes».
- [ ] Commit.

### Tasca 11 — Construcció, revisió i arranjaments

**Fitxers:** els que digui la revisió.

- [ ] `npm run build` passa.
- [ ] Revisió de tota la branca contra la spec (`code-reviewer`).
- [ ] Cada defecte trobat es converteix en una comprovació de `scripts/check-cursus.mjs` quan és de lògica, i s'arregla. Dos arranjaments seguits que trenquin una altra cosa: s'atura i es busca la causa.
- [ ] Recorregut sencer al navegador, de la Piscina al tercer examen, a 390 px.
- [ ] Commit.

## Revisions

Revisió pròpia (`spec-reviewer`) per a les tasques 3 (generadors: una granota que s'equivoca malament ensenya malament), 5 (progrés desat i maquetació) i 6 (maquetació i nota). Les tasques 1, 2 i 4 es revisen juntes amb la 3 i la 5; la 7 i la 8 amb la 9; la 10 amb la revisió final.

Les tasques 1 a 4 toquen els mateixos dos fitxers i van per ordre. La 5 pot començar mentre es revisa la 4. De la 6 a la 10 toquen `main.js` i van per ordre.
