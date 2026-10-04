# Nenúfars a trossos — disseny

## Objectiu

Un joc nou per aprendre què és una fracció, les fraccions equivalents, simplificar i comparar. Mateix aspecte que els altres jocs: estany de nit, seccions de 10 pantalles, pistes, estrelles, progrés desat.

Supòsits: el nen ja sap les taules; juga amb tauleta o mòbil; els textos són en català.

Fora d'aquest joc: fraccions més grans que 1, números mixtos, sumes i restes de fraccions.

## La idea visual

Un nenúfar és rodó i es talla en porcions. Cada fracció es pot veure de quatre maneres, i la mateixa fracció surt amb figures diferents perquè no quedi lligada a una sola:

| Figura | Què és |
|---|---|
| Nenúfar | Un cercle tallat en porcions |
| Passarel·la | Una barra de taulons |
| Recta | La granota salta entre 0 i 1 |
| Cuques de llum | Un grup, una part enceses |

La part pintada té sempre el mateix color a totes les figures. Quan es talla o s'ajunta, les línies de tall apareixen o desapareixen animades i la part pintada no es mou: es veu que la quantitat és la mateixa.

A dalt, una granota travessa l'estany: cada pregunta encertada és un salt cap a l'altra riba.

## Maneres de preguntar

| Mode | Què fa el nen | Resposta |
|---|---|---|
| `equal` | Tria, entre tres figures, la que està tallada en parts iguals | Tocar una figura |
| `paint` | Toca porcions fins a pintar la fracció que es demana | Tocar porcions i ✓ |
| `name` | Veu una figura pintada i escriu la fracció | Numerador i denominador amb el teclat |
| `line` | Posa la granota al punt de la recta que es demana, o escriu on és | Tocar una marca, o teclat |
| `cmp` | Tria <, = o > entre dues fraccions | Tres botons |
| `cut` | Talla cada porció en 2, 3 o 4 fins a tenir el denominador demanat, i escriu el numerador nou | Botons de tall i teclat |
| `fill` | Troba el número que falta: 2/3 = ?/12 | Teclat |
| `join` | Ajunta porcions de 2 en 2, de 3 en 3… i escriu la fracció simplificada | Botons d'ajuntar i teclat |
| `same` | Decideix si dues fraccions són equivalents | Sí / No |

A `cmp`, `fill` i `same` les figures es veuen a les primeres pantalles de la secció i s'amaguen a les últimes; la pista les torna a ensenyar.

## Seccions

Vuit seccions de 10 pantalles: 80 pantalles. Les pantalles 1 a 9 són lliçons de 5 preguntes fixes, de fàcil a difícil. La pantalla 10 és la prova de la secció.

1. **Parts iguals** — `equal`, `paint`: meitats, terços, quarts; fraccions d'un sol tros (1/2, 1/3, 1/4, 1/6, 1/8).
2. **Dalt i baix** — `paint`, `name`: numerador i denominador fins a dotzens, amb nenúfar, passarel·la i cuques.
3. **La recta** — `line`: fraccions entre 0 i 1; n/n és 1; 0/n és 0.
4. **Qui és més gran?** — `cmp`: mateix denominador; mateix numerador; més o menys que 1/2.
5. **Tallar més fi** — `cut`: 1/2 = 2/4 = 3/6 = 4/8; després terços, quarts i cinquens.
6. **La regla** — `fill`, `cut`: multiplicar dalt i baix pel mateix número; el número que falta, a dalt o a baix.
7. **Simplificar** — `join`, `fill`: dividir dalt i baix; arribar a la fracció que ja no es pot simplificar més.
8. **Missió final** — `same`, `cmp`: són equivalents?; comparar fraccions de denominador diferent buscant-ne d'equivalents.

Una secció s'obre quan es passa la prova de l'anterior; dins d'una secció les pantalles s'obren per ordre.

## Proves

- La pantalla 10 de cada secció: 6 preguntes dels modes de la secció, generades a l'atzar dins dels mateixos límits que les lliçons, sense figures d'ajuda a les seccions 6 a 8.
- No hi ha botó de pista ni segona oportunitat: cada pregunta es respon una vegada i es diu si era correcta, amb la resposta bona.
- Amb 5 encerts o més la prova està superada i s'obre la secció següent. Amb menys, el panell final diu quins modes han fallat i quines pantalles repassar, i la prova es pot repetir (amb preguntes noves).
- Estrelles de la prova: 3 amb 6 encerts, 2 amb 5.

## Errors, pistes i estrelles (lliçons)

- Resposta equivocada: la figura o la casella tremola i el missatge diu què cal mirar; a la segona, el raonament sencer, dibuixat sobre la figura.
- El botó Pista fa el mateix sense haver de fallar.
- Estrelles de la pantalla: 3 sense errors ni pistes, 2 amb un o dos, 1 amb més. Es desa la millor.

## Fitxers

- `src/nenufars-a-trossos.html`: el joc. La lògica (pantalles, generador de proves, correcció de respostes, estrelles) va entre `LOGIC-START` i `LOGIC-END`, sense tocar el DOM.
- `src/index.html`: targeta nova i comptador «N de 80 pantalles».
- `build.sh` genera els fitxers de l'arrel.
- Progrés a `localStorage`, clau `nenufars-a-trossos`: `{ so, secs, stars }`.

## Comprovació

- Lògica: per a cada pregunta de les 72 lliçons, i per a 200 proves generades per secció, la resposta esperada ha de ser matemàticament correcta (fraccions comparades amb producte en creu), les fraccions han de ser entre 0 i 1, i les de `join` han de quedar irreductibles.
- Pantalla: jugar una pregunta de cada mode i una prova sencera (una superada i una no) en un navegador, en amplada de mòbil i d'escriptori.
