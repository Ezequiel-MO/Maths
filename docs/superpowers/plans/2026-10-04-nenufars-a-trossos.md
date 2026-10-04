# Nenúfars a trossos — pla d'implementació

**Objectiu:** un joc nou de fraccions (què són, equivalents, simplificar, comparar) amb 8 seccions de 9 lliçons i una prova.

**Arquitectura:** una carpeta `games/nenufars-a-trossos/` com els altres jocs: `logic.js` (pantalles, generador de proves, resposta correcta, estrelles, talls de les figures i textos, sense DOM), `main.js` (figures en SVG i pantalles, amb `shared/`) i `style.css`; la pàgina `nenufars-a-trossos.html` a l'arrel.

**Tecnologia:** mòduls ES, Vite per construir. Node per als comprovadors, que corren amb `npm run check`.

**Spec:** `docs/superpowers/specs/2026-10-04-nenufars-a-trossos-design.md`

## Regles per a totes les tasques

- Textos en català; comentaris del codi en anglès, com als altres jocs.
- Mateix aspecte que `games/coet-multiplicador`: `shared/base.css`, `shared/sections.*`, `shared/fx.js`, `shared/audio.js`, `shared/progress.js`.
- Totes les fraccions entre 0 i 1. Nenúfar: fins a 12 trossos. Passarel·la: fins a 20 (12 si s'ha de tocar). Cuques: fins a 12.
- Progrés a `localStorage`, clau `nenufars-a-trossos`: `{ so, secs, stars }`; `secs[i]` va de 0 a 10 i 10 vol dir prova superada.
- Prova: 6 preguntes, cal encertar-ne 5, sense pista ni segona oportunitat.

## Què pot fallar i ningú no demana (i on es comprova)

1. Una lliçó amb una resposta esperada equivocada o una fracció fora de límits → comprovador (tasca 1).
2. El generador de proves treu preguntes repetides, impossibles o d'un mode que la secció no ensenya → comprovador, 200 proves per secció (tasca 1).
3. A simplificar, el nen escriu una fracció equivalent però no irreductible → no és correcta, i el missatge ho diu (tasca 1 i 2).
4. Tallar massa fi o ajuntar per un número que no divideix → la figura no canvia i el missatge ho explica, sense comptar error (tasca 2).
5. Progrés desat malmès o d'una versió antiga → es retalla als límits, com al coet (tasca 2).

## Tasca 1 — Lògica i comprovador

**Fitxers:** `games/nenufars-a-trossos/logic.js` i `scripts/check-nenufars.mjs`.

**Produeix:**
- `SECTIONS[8]`: `{ name, sub, modes, levels[9] }`; cada lliçó `{ name, qs[5] }`.
- Pregunta: `{ mode, ... }` amb `mode` un de `equal paint name line cmp cut fill join same`. Camps: `shape` (`pad`, `bar`, `set`), `n`, `d`; `equal` té `at`; `line` té `ask` (`put`, `read`); `cmp` i `same` tenen `a b c d`; `cut` té `k`; `fill` té `N D miss`; `hide` amaga les figures.
- `want(q)`: la resposta correcta (número, signe, booleà o `[n, d]`). `right(q, ans)`: booleà.
- `gen(sec, rnd)`: 6 preguntes de prova. `starsFor(slips)`, `testStars(hits)`, `PASS = 5`.

**Comprovació:** `node scripts/check-nenufars.mjs` recorre les 360 preguntes de lliçó i 200 proves per secció i comprova límits, modes permesos, que `want` coincideix amb un càlcul independent, que `right` rebutja respostes properes i que `join` demana la irreductible. Ha d'acabar amb `ok`.

## Tasca 2 — Figures i lliçons

**Fitxers:** `games/nenufars-a-trossos/main.js`, `style.css`, `nenufars-a-trossos.html`.

- Figures SVG: nenúfar, passarel·la, cuques, recta. Les línies de tall noves apareixen animades i les ajuntades s'esvaeixen; la part pintada no es mou.
- Menú de seccions i pantalla de lliçó: carril de la granota (un nenúfar per pregunta), consell, figura, pregunta amb notació de fracció, i controls segons el mode (teclat, ✓, `< = >`, Sí/No, tisores, ajuntar).
- Errors i pistes en dos graus; la segona pista ensenya les figures amagades i les marques de la recta. Estrelles i panell final.

**Comprovació:** al navegador, una pregunta de cada mode, en amplada de mòbil (390) i d'escriptori; sense errors a la consola.

## Tasca 3 — Proves

**Fitxers:** `games/nenufars-a-trossos/main.js`.

- La pantalla 10: preguntes de `gen`, sense botó de pista, una sola resposta per pregunta; si falla es veu la resposta bona i un botó per seguir. El carril marca encerts i errors.
- Panell final: superada (obre la secció següent) o no (diu què repassar i a quina pantalla, i deixa repetir).

**Comprovació:** al navegador, una prova superada i una de no superada; la secció següent s'obre només amb la primera.

## Tasca 4 — Portada i construcció

**Fitxers:** `shared/games.js`, `scripts/check.mjs`, `package.json`.

- Targeta nova amb icona i comptador «N de 80 pantalles».

**Comprovació:** `npm run build`; la portada mostra la targeta i el comptador després de jugar.

## Tasca 5 — Revisió i arranjaments

La revisió de tota la branca va trobar defectes que ara tenen comprovació a `scripts/check-nenufars.mjs` (talls d'una figura tallada de més, primera pista d'equivalents, explicacions de comparar amb 1 i amb 1/2, pistes que anomenaven un tall sense botó, cuques anomenades trossos) i d'altres que es comproven jugant al navegador: un doble toc a «Segueix» no respon la pregunta següent, el progrés es desa amb l'última resposta, «Segueix» no queda sota el panell final, ↺ torna el consell, i Enter sobre un botó el prem.
