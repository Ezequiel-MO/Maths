# Ejecutar el plan de 13 tareas que lleva el àbac xinès al modelo 42 del Cursus de l'estany, con pistas dibujadas sobre el ábaco

## CONTEXT

Repo `/home/olive/projects/Math`: juegos de matemáticas en catalán para un niño que juega solo (Vite multipágina, sin dependencias, comprobadores de Node en `scripts/`).

Hecho y aprobado por Oliver el 2026-10-06, en la rama `abac-xines-cursus` (sale de `main` en `a86a47b`, sin push):

- `ca21fcb` — la spec: `docs/superpowers/specs/2026-10-06-abac-xines-cursus-design.md`.
- `cdb6e78` — el plan: `docs/superpowers/plans/2026-10-06-abac-xines-cursus.md`, y cuatro correcciones de la spec que salieron al hacerlo.

**No hay nada de código todavía.** Ninguna tarea del plan está empezada. Nada se ha ejecutado ni verificado más allá de leer el código actual.

Lo que la sesión anterior sabe del código solo por el informe de un subagente Explore (no lo abrió ella misma, salvo la lista de preguntas de `logic.js`): la forma exacta de lo que devuelve `nextMove` (`{p, deck, to, why}`), la maquetación de `style.css` y el bucle de `main.js`. El implementador de cada tarea debe leer el archivo antes de fiarse.

Los dos handoffs `docs/handoffs/2026-10-05-cursus-de-l-estany*.md` están anticuados: el Cursus está completo en `main`. La referencia es su código, no esos documentos.

## TARGET FILES

- `docs/superpowers/plans/2026-10-06-abac-xines-cursus.md` — el plan: 13 tareas con archivos, interfaces, valores esperados y prueba de cada una. Es el brief de cada implementador.
- `docs/superpowers/specs/2026-10-06-abac-xines-cursus-design.md` — la spec, en catalán. Cada implementador lee la spec y su tarea.
- `games/abac-xines/logic.js` (275 líneas) — modelo del ábaco (`rodVal`, `valueOf`, `tidy`, `write`, `tap`, `plan`, `nextMove`) y `SECTIONS` / `LEVELS`: 6 secciones de 10 niveles.
- `games/abac-xines/main.js` (172) — menú de secciones con `shared/sections.js`, pantalla de nivel, botón «Pista» (`coach`), desado `{ so, secs[6] }` con la clave `abac-xines`.
- `games/abac-xines/style.css` (105) — el ábaco se dimensiona con `--u` y desplazamientos fijos (330px, 500px, 150px).
- `abac-xines.html` (20) — sección `#joc`, enlace «← Seccions».
- `games/cursus-de-l-estany/{logic.js,main.js,material.js,style.css}` — el modelo a imitar. Solo lectura.
- `shared/games.js:24-26`, `scripts/check.mjs:7,12`, `package.json` (script `check`) — tarjeta del hub y cadena de comprobación.
- Nuevos, aún no existen: `scripts/check-abac.mjs`, `games/abac-xines/board.js`, `games/abac-xines/hints.js`.

## GOAL

Ejecutar las 13 tareas del plan, en orden, en la rama `abac-xines-cursus`, con subagent-driven-development: un `implementer` por tarea, `spec-reviewer` según la tabla «Revisions» del plan, y `code-reviewer` de toda la rama al final. Al acabar, el àbac xinès tiene Piscina, mapa de 3 círculos con 9 proyectos de 15 preguntas, nota por proyecto, examen por círculo, Caça l'errada, XP con nivel decimal, insignias, y pistas dibujadas sobre el ábaco; `npm run build` pasa y el recorrido se ha visto funcionar en el navegador. No hacer push ni PR sin que Oliver lo pida.

## LOAD-BEARING DETAILS

1. **El progreso guardado no baja nunca.** La clave sigue siendo `abac-xines`. `secs` se conserva y el juego nuevo no lo escribe. `clean(d)` traduce: sección antigua con 10 niveles → sus proyectos con nota 80; algún nivel hecho → Piscina hecha; los exámenes no se traducen. Secciones por proyecto: `[0, 0, 1, 1, 2, 3, 4, 5, 5]`. Por qué: ya hay datos en dispositivos y en la nube, y `shared/sync.js` fusiona con el número mayor; un valor que bajara se perdería o reaparecería. Lo fija la parte B de `check-abac.mjs` (tareas 3 y 4).
2. **La tarjeta del hub pasa el desado por `clean`.** El hub lee el dato sin abrir el juego; un perfil que solo tiene `secs` vería «0 de 9 projectes». Valor esperado: `{secs:[10,10,4,0,0,0]}` → «4 de 9 projectes». Tarea 7.
3. **El comprobador se escribe antes que la lógica y calcula el resultado por su cuenta.** Tareas 1, 3 y 5 son solo comprobador (rojo); 2, 4 y 6 lo ponen verde. No usar `plan` ni `clean` para saber el valor esperado.
4. **`games/abac-xines/logic.js` debe importarse desde Node.** Nada de `document`, `window`, `localStorage` ni `shared/util.js` (lee `matchMedia` al cargar). El azar entra por un parámetro `rnd`. `scripts/check.mjs` lo importa; si se rompe, cae `npm run build`.
5. **`SECTIONS` y `LEVELS` siguen exportados hasta la tarea 13.** `scripts/check.mjs` los importa hasta la tarea 7 y el juego actual los usa hasta la 10.
6. **`check-abac.mjs` no entra en la cadena `check` de `package.json` hasta la tarea 7.** Antes está en rojo a propósito y rompería el build.
7. **Si una pregunta actual no cumple la regla de su proyecto, se mueve la pregunta, no la regla.** Las reglas de dificultad por proyecto (tabla de la tarea 1) son la decisión; el reparto de las 60 preguntas es una estimación hecha sobre la lista, sin ejecutar nada.
8. **El niño juega solo.** Ningún texto de pantalla con «company» ni «segon». El botón es «Dona'm una pista». Lo fija la tarea 13 y ya lo fijan `check-cursus.mjs:745` y `check-progress.mjs:488` para otros archivos.
9. **Pedir pista hace que la pregunta no cuente para la nota, y nada más.** Un ábaco con el valor correcto pero desordenado es un intento fallado. Segundo fallo: el ábaco se resuelve solo y se pasa a la pregunta siguiente.
10. **Las capas de pista no bloquean el toque ni usan pseudoelementos de `.bead`.** `.bead` ya usa `::after` y cuatro estados de animación; las pistas van en una capa propia con `pointer-events: none`.
11. **El ábaco se mide, no se calcula con píxeles fijos.** `board.js` ajusta `--u` midiendo el espacio, como `fitter` en `games/cursus-de-l-estany/material.js:17-33`. Sin esto, la barra de XP y las pistas provocan scroll.
12. **Máximo 5 columnas.** `HUES`, `PLACE` y `COL` tienen 5 posiciones; ningún valor de una pregunta pasa de 99.999.
13. **`shared/sections.js` fija 10 niveles por sección.** Del ábaco solo sobrevive `panel()`; `sectionMenu`, `levelRow` y `wireLevels` se dejan de usar en la tarea 10.
14. **La expresión `HUB` de `main.js` sigue apuntando a `abac-xines.html`**, y `abac-xines.html` no lleva `data-hub` (`check-progress.mjs:485-486`).

## CONSTRAINTS

- No tocar `games/cursus-de-l-estany/`, `shared/progress.js`, `shared/sync.js` ni `shared/cloud.js`. El Cursus se copia como patrón, no se importa ni se extrae a un motor común.
- Fuera de alcance, decidido por Oliver: equipos, arrastrar bolas, más de 5 columnas.
- El plan dice reglas y valores esperados; no trae el código escrito. No reescribir el plan con código.
- Cada implementador confirma solo sus archivos, por nombre. Mensajes de commit en catalán con el prefijo «L'àbac amb el model del cursus:».
- Como mucho 4 subagentes a la vez. Las tareas 8 a 13 van en orden: todas tocan `main.js` y `style.css`. Las de comprobador (1, 3, 5) pueden solaparse con la de lógica anterior si no comparten archivo.
- Cada defecto que encuentre una revisión se convierte en una comprobación de `check-abac.mjs` en la misma ronda de arreglos.
- Un implementador que pase de unas 60 llamadas a herramientas informa en su siguiente punto de control para partir lo que quede.
- `.claude/` y `docs/handoffs/` no están en git; no añadirlos.

## HOW TO VERIFY

- Tras las tareas 2, 4 y 6: `node scripts/check-abac.mjs` pasa las partes A, B y C respectivamente.
- Desde la tarea 7: `npm run check` pasa entero, con «7 games checked».
- Tareas 8 a 12: la sesión padre abre `npm run dev` en el navegador y comprueba la lista de cada tarea en 390×844, 844×390 y 820×1180: sin scroll, y los casos concretos (la tabla de siete pistas de la tarea 9; 14 a la primera y una con pista dan 93; un perfil nuevo acaba la Piscina con «Nivell 0,33»).
- Final (tarea 13): `npm run build` pasa; en `npm run preview`, un perfil nuevo recorre Piscina → proyecto → mapa, y un perfil con `{"secs":[10,10,10,10,10,10]}` ve nueve proyectos con 80, el círculo 0 abierto, los círculos 1 y 2 pendientes de examen, y la tarjeta del hub dice «9 de 9 projectes».
- Los cinco puntos de «Review Focus» del plan (doble toque en «Comprova», salir a medias, mover una bola con la pista a la vista, datos guardados extraños, girar la tableta) tienen su prueba en la tarea indicada; no dar la rama por buena sin haberlos visto.
