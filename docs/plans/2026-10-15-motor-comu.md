# Motor comú dels jocs de l'estany

Data: 2026-10-15. Branca: `worktree-motor-comu`.

Decisió (Oliver, 2026-10-15): es queda Vite + pàgines estàtiques + Firestore. Res de Python. Three.js o JSXGraph
s'instal·len directament quan un joc els necessiti, sense pilot. Aquesta feina fa que el motor sigui coherent i robust.

**Regla número u: el progrés dels nens no es toca.** Ni les claus de desat (`<perfil>:<joc>`, `store: 'memoria-visual'`),
ni la forma dels camps (`lv`, `stars`, `notes`, `secs`, `exams`, `piscina`, `fulls`, `rapid`, `ratxa`, `mosques`, `best`,
`equip`, `probs`, `savi`, `so`), ni `clean()` de cap joc (és qui tradueix les partides antigues), ni `shared/progress.js`,
`shared/sync.js` i `shared/cloud.js`.

## Fase 0: xarxa de seguretat

- `scripts/check-golden.mjs` i `scripts/golden.json`. Per a cada un dels 12 jocs, un corpus llavorat de partides desades:
  buides, brossa (`null`, `[]`, números, strings), formes antigues (`stars`/`secs` dels jocs vells, `coet`, `notes`) i
  partides plenes a l'atzar. Per a cada partida es desen les empremtes (hash) de `clean()` i de totes les funcions de
  progrés que el joc exporta: `xpOf`, `levelText`, `badges`, `isOpen`, `examOpen`, `noteOf`, `reached`, `validated`, i
  els `*In` que canvien el progrés (`levelIn`, `examIn`, `sheetIn`, `poolIn`, `rapidIn`, `streakIn` i els propis).
- Entra a `npm run check`, de manera que cap canvi futur pot alterar què surt d'una partida desada sense que el build caigui.
- `scripts/snap-games.mjs` (fora de `npm run check`, com `flow-abac.mjs`: necessita Chrome i playwright-core de fora).
  Obre cada joc amb una partida fixa a localStorage i `Math.random` llavorat, i desa l'HTML del mapa i de la primera pantalla
  de joc. Es fa abans i després de la fase 2 i s'han de comparar iguals.
- Prova: `npm run check` passa amb el codi d'ara.

## Fase 1: lògica de progrés comuna (`shared/curs.js`)

- Una fàbrica `curs(cfg)` que torna `VALID`, `EXAM_PASS`, `POINTS`, `starsFor`, `circleOf`, `exOf`, `noteOf`, `reached`,
  `validated`, `xpOf`, `levelText`, `isOpen`, `examOpen`, `earned`, `copy`, `levelIn`, `examIn`, `sheetIn`, `poolIn`, `keep`.
- `cfg` diu el que canvia d'un joc a l'altre: `field` (`lv` o `stars`), `extra` (els vectors que també cal copiar, com `secs`),
  `slot` (on es marca l'examen; coet-multiplicador fa servir `CIRCLES[c].x`), `isOpen` propi (salts, coet-multiplicador),
  `badges` i `BADGES` del joc.
- Cada `logic.js` re-exporta els mateixos noms, així `main.js`, el hub i els checks no noten res. `clean()` es queda on és.
- Helpers repetits (`whole`, `within`, `slots`, `shuffle`, `at`, `int`) a `shared/curs.js`.
- àbac i cursus (camp `notes`) fan servir els helpers però mantenen la seva progressió, que és diferent.
- Prova: `check-golden` igual, `npm run check` i `npm run build` verds.

## Fase 2: closca comuna de pantalla (`shared/shell.js`, `shared/mapa.js`)

- `shell.js`: el testimoni de cancel·lació (`fresh()`/`t.on`), `paintXp`, el botó del so, `HUB`, `SETTLE`, `show()`,
  `list`/`news`, `starRow`, `curtain`, `drawCombo`, `buzz`, el retorn al mapa. Els ids de la barra de dalt queden iguals a
  tots els jocs (`#toS` passa a `#toM`).
- `mapa.js`: el mapa de cercles, projectes, examen, insígnies i consell (`advice`, `examBtn`, `noteText`, `openC`), amb les
  opcions de cada joc (icona, fila d'estrelles, to de l'anell, botó de repte llampec).
- Examen, full i llampec: només el marc comú si les variants s'hi assemblen prou; la pregunta de cada joc es queda al joc.
- Prova: `snap-games` dona el mateix HTML que abans (llevat del canvi d'id), `npm run check` verd i recorregut a mà pel
  navegador de cada joc (carrega, mapa, un nivell, tornar).

## Fase 3: capa gràfica (`shared/scene.js`)

- `scene(t, el, draw)`: un bucle `requestAnimationFrame` lligat al testimoni de la pantalla (s'atura sol en sortir), amb
  `ResizeObserver` i desmuntatge. És on es penjaran Three.js o JSXGraph quan calguin.
- Helpers SVG (`svg()`, `fmt()` per a coordenades) per deixar d'escriure `toFixed` a mà.
- Passar a `scene` les animacions fetes a mà: el sòlid que gira de volta-al-mon, el flascó de partícules del laboratori i la
  recta de salts.
- Prova: el sòlid gira, el flascó es mou, la recta salta; en sortir de la pantalla no queda cap bucle viu.

## Fase 4: neteja

- Treure el codi mort (`sectionMenu`), posar al dia el README (on viu cada cosa i com s'afegeix un joc amb el motor comú).
- `@keyframes` idèntics a `base.css` només si són byte a byte iguals (no es toca cap disposició).

Cada fase és un commit. No es fa push a `main`: la branca es puja i Oliver decideix quan es fusiona.
