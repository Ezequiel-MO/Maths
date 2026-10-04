# El coet multiplicador — disseny

## Objectiu

Un joc nou per aprendre a multiplicar un número de 3 xifres per un de 2 xifres amb l'algoritme en columna de l'escola, entenent d'on surt cada fila. Mateix aspecte que el coet: estany de nit, seccions de 10 nivells, pistes, progrés desat.

Supòsits: el nen ja sap les taules; juga amb tauleta o mòbil; no hi ha teclat físic (però si n'hi ha, funciona).

## La idea visual

Cada multiplicació és un rectangle (un camp d'estrelles) trossejat per xifres: 234 × 56 són sis trossos (200, 30, 4 d'amplada; 6 i 50 d'alçada). La franja de les unitats i la de les desenes tenen un color cadascuna, i les files de l'operació en columna porten el mateix color: cada fila de l'algoritme és una franja del rectangle. El resultat de cada pas vola des d'on s'ha calculat fins a la casella on s'escriu; la xifra que es porta vola a dalt.

A dalt hi ha la pista d'enlairament: cada pas resolt carrega combustible i acosta el coet al planeta.

## Maneres de treballar una operació

| Mode | Què escriu el nen | Què es veu |
|---|---|---|
| `zeros` | El producte sense zeros, i després amb zeros | Una graella de peces que valen 10, 100 o 1000 |
| `pieces` | El producte de cada tros, i després la suma en columna xifra a xifra | El rectangle; cada tros resolt vola a la suma |
| `guided` | Cada producte petit sencer (6 × 4 + 2 = 26); el joc escriu el 6 i s'emporta el 2 | El rectangle il·lumina el tros que toca, i la columna |
| `free` | Només la xifra que s'escriu a cada casella, de dreta a esquerra | Només la columna; les que es porten s'apunten soles |

El zero de la segona fila és sempre un pas que escriu el nen, amb l'explicació de per què hi és.

## Seccions (10 nivells cadascuna, operacions fixes)

1. **Zeros màgics** — `zeros`: de 3 × 20 a 70 × 800.
2. **Trossejar** — `pieces`: 2 i 3 xifres × 1 xifra.
3. **En columna** — 3 xifres × 1: sis nivells `guided`, quatre `free`.
4. **Dues files** — 2 × 2 xifres: quatre `pieces`, quatre `guided`, dos `free`.
5. **3 × 2 amb ajuda** — `guided`.
6. **Missió final** — `free`.

Una secció s'obre quan s'acaba l'anterior; dins d'una secció els nivells s'obren per ordre.

## Errors, pistes i estrelles

- Resposta equivocada: la casella tremola i el missatge diu què cal calcular; a la segona, el càlcul sencer.
- El botó Pista fa el mateix sense haver de fallar.
- Estrelles del nivell: 3 sense errors ni pistes, 2 amb un o dos, 1 amb més. Es desa la millor.

## Fitxers

- `src/coet-multiplicador.html`: el joc. La lògica (nivells, trossos, llista de passos, estrelles) va entre `LOGIC-START` i `LOGIC-END`, sense tocar el DOM.
- `src/index.html`: targeta nova i comptador «N de 60 nivells».
- Progrés a `localStorage`, clau `coet-multiplicador`: `{ so, secs, stars }`.

## Comprovació

- Lògica: per a cada un dels 60 nivells, seguir la llista de passos ha de reconstruir les files i el total exactes de `a × b`.
- Pantalla: jugar un nivell de cada mode en un navegador, en amplada de mòbil i d'escriptori.
