# Terminar «El cursus de l'estany»: arreglo de la tarea 6, tareas 8 a 11 y revisión final, con subagentes, en la rama `cursus-de-l-estany`

## CONTEXT

Repo `/home/olive/projects/Math`: sitio Vite multipágina de juegos de matemáticas para un niño de 9 años que juega solo. JavaScript sin framework, textos en catalán, sin test runner (las comprobaciones son scripts de Node en `npm run check`). Se despliega a GitHub Pages desde `main`.

El plan tiene 11 tareas. La sesión anterior lo ejecutó con `superpowers:subagent-driven-development` hasta la tarea 7 y paró por el guardián de contexto. Cabeza de la rama: `d119643` (12 commits sobre `ae5df4c`, sin push).

Hecho y revisado (revisión `spec-reviewer` limpia tras rondas de arreglo):
- Tareas 1–4: `logic.js` entero (8 proyectos, 120 preguntas, textos, generadores de examen y de hojas, reglas de progreso) y `scripts/check-cursus.mjs`. Última línea del comprobador: `cursus-de-l-estany: 120 preguntes, 600 exàmens, 1600 fulls`, código 0.
- Tarea 5: página, Piscina, mapa, barra de XP, tarjeta de la portada. `npm run check` dice `7 games checked`.

Hecho pero con trabajo pendiente:
- Tarea 6 (pantalla de proyecto, teclado, cuques), commit `97efd6f`: revisada, **pide cambios**. La ronda de arreglo 1 no se ha lanzado. Hallazgos, comprobaciones de navegador pendientes y RISKS en `.superpowers/sdd/2026-10-04-cursus-de-l-estany/task-6-review.md`.
- Tarea 7 (cuadrícula), commit `d119643`: implementada, **sin revisar** (se revisa junto con la 8 y la 9). El implementador la jugó en Chrome sin cabeza a 360/390/1280 px; yo no la he visto.

Sin empezar: tareas 8 (barras y trozos), 9 («Caça l'errada»), 10 (exámenes), 11 (build, revisión de toda la rama, recorrido completo).

Decisión de Oliver a mitad de sesión (2026-10-05), ya escrita en la spec y en el plan (`aa55f25`): el niño juega solo, así que ningún texto de pantalla habla de compañeras ni de ranas que ayudan. La pista es «Dona'm una pista». Corregir una hoja se queda como actividad, con el nombre «Caça l'errada». Reglas, XP e insignias no cambian. Quedan tres textos confirmados por cambiar (ver detalle 3).

Verificado por mí en navegador: mapa a 390 y 1280 px, Piscina a 390 px, primera pregunta de Repartir a 360 px y de En sobra a 1280 px. Sin desbordes; el único error de consola es el `favicon.ico` 404 de todo el sitio. Todo lo demás de navegador lo informaron los implementadores, no lo vi yo.

`.claude/` y `docs/handoffs/` aparecen sin seguimiento en `git status`; no son parte del trabajo, no los añadas.

## TARGET FILES

Leer primero:
- `.superpowers/sdd/2026-10-04-cursus-de-l-estany/progress.md` — el libro de progreso: tabla previa, 12 «Ruling», menores aplazados por tarea, RISKS, y al final la lista «NEXT STEPS». Es el mapa de recuperación; su primera línea nombra el plan.
- `.superpowers/sdd/2026-10-04-cursus-de-l-estany/task-6-review.md` — lo que hay que arreglar en la tarea 6 y los RISKS que viajan a las tareas 8–10.
- `docs/superpowers/plans/2026-10-04-cursus-de-l-estany.md` y `docs/superpowers/specs/2026-10-04-cursus-de-l-estany-design.md` — con la enmienda del 2026-10-05.

En el mismo directorio `.superpowers/sdd/…/`: `task-N-brief.md` (1–11; reglas comunes del plan más la tarea), `task-N-report.md` (1–7; la interfaz que dejó cada implementador).

Código (cabeza `d119643`):
- `games/cursus-de-l-estany/logic.js` (287 líneas) — datos, textos, generadores, progreso. Sin DOM.
- `games/cursus-de-l-estany/main.js` (250) — `enter()`, Piscina, equipo, mapa, `projecte(i)` con `quiz`; `corregir()` y `examen(c)` son esbozos que vuelven al mapa.
- `games/cursus-de-l-estany/material.js` (188) — tabla `FIGURES` modo → figura, `fireflies`, `grid`, cajas de respuesta y teclado.
- `games/cursus-de-l-estany/style.css` (160), `cursus-de-l-estany.html`.
- `scripts/check-cursus.mjs`, `scripts/check.mjs` (tabla `TOTALS` y bucle que llama a `record` de cada tarjeta), `shared/games.js` (la tarjeta).

## GOAL

Dejar el juego jugable entero, de la Piscina al tercer examen, con `npm run build` en verde y la revisión de toda la rama (`code-reviewer`) resuelta. En orden: ronda de arreglo 1 de la tarea 6 y su re-revisión; tarea 8; tarea 9; una revisión `spec-reviewer` para 7+8+9; tarea 10; tarea 11. No fusionar ni hacer push sin que Oliver lo pida. Al terminar, el mensaje final lleva todas las líneas `Ruling` del libro y los puntos marcados «SURFACE TO OLIVER».

## LOAD-BEARING DETAILS

1. **El libro de progreso manda sobre la memoria.** Las tareas con línea `Task N: complete` (1–5) no se relanzan. La 6 está a mitad de bucle (ronda 1 de 5 sin lanzar); la 7 está implementada y sin revisar.
2. **Ronda de arreglo 1 de la tarea 6**, con un `implementer` nuevo (el anterior no se puede reanudar): Enter no envía la respuesta si el foco quedó en un nenúfar o en el botón de pista; la regla de la nota pasa a una función pura en `logic.js` que `check-cursus.mjs` comprueba (Ruling 12: cuenta solo acierto a la primera y sin pista; repetir con menos nota conserva la mejor y gana 0; 80 → 93 gana 13; 73 → 80 gana 80; devuelve un progreso nuevo, no muta); menores 1, 3, 4, 5 y 9 de `task-6-review.md`. El teclado pegado abajo tapa la caja de respuesta en pantallas cortas (360×640; con la cuadrícula 10×10 también a 360×780): hay que resolverlo en esta ronda.
3. **Cambio de nombres pendiente, en la misma ronda:** botón del mapa «Corregir el full d'una companya» → «Caça l'errada» (`main.js`); insignias «Primer full» y «Deu fulls» sin compañeras (`logic.js`, `BADGES`); descripción de la tarjeta «…corregeix els fulls de les companyes» (`shared/games.js`); «Hi aniràs durant tot el cursus.» → «Serà el teu equip durant tot el cursus.». Con una comprobación nueva: ningún texto de pantalla de `logic.js` contiene «company».
4. **Nombres reales de la interfaz, distintos de los del plan:** las pantallas empiezan con `const t = enter(kicker, inner)` (no `show`); `fireflies(host, q, { t, onDone, onMiss })` exige `t` y devuelve `{ counts(), stop() }`; hay una figura viva por anfitrión y una segunda sobre el mismo anfitrión para la primera.
5. **`right()` compara como texto y `want()` cambia de forma** (escalar o lista; con `bare`, `split` es `q` y `long` es `[q, r]`). El número de cajas sale de `want(q)`, nunca del modo. Lo escrito se normaliza antes de `right` o `judge`.
6. **Guardar antes de cualquier pausa y no tocar `prog` de forma provisional:** «← Mapa» siempre está disponible y el botón de sonido llama a `save()` con todo el `prog` en memoria.
7. **Tarea 8 (`chunks`):** `quiz` crea hoy las cajas en `.bxs` antes de la figura; `chunks` necesita que la figura dé los anfitriones, y en las preguntas `hide` la figura no existe hasta la pista, así que las cajas necesitan un sitio de reserva. `.bxs` no hace salto de línea: 4–5 cajas (`long`) se salen a 360 px y `body { overflow-x: hidden }` las corta en vez de dar scroll.
8. **Tareas 9 y 10 reutilizan `quiz`, que hoy solo sabe reintentar:** le falta la rama de un solo intento con «Segueix». Las preguntas de examen vienen barajadas y llevan `p`; hay que agrupar por `q.p` para decir qué proyectos repasar. `judge` ignora `fix` cuando `item.ok`.
9. **Una hoja con la etiqueta falsa enseña mal:** `item.ok === right(item.q, item.shown)` se comprueba en 1.600 hojas; no debilitar esa comprobación ni los patrones de texto (`+ 0`, `a ÷ b` con a < b, singular/plural tras 1).
10. **Números fijos:** nota para validar 80; `mark(firsts) = round(100 × firsts / 15)`; examen aprobado con 5 de 6; XP máximo 1.240; nivel = XP ÷ 150 con coma («8,27»). `isOpen` es acumulativo (Ruling 9).
11. **`main.js` debe quedar en unas 350 líneas** tras tres pantallas más; está en 250 y con líneas muy largas. Las figuras van en `material.js`.
12. **Navegador:** los implementadores ejecutan ellos mismos las listas con `playwright-core` de `/home/olive/projects/node_modules` (`createRequire('/home/olive/projects/')`, `chromium.launch({ channel: 'chrome', headless: true })`) contra `npm run dev` en el puerto 5173, que hay que arrancar (lo paré al cerrar). Guiones en un directorio temporal, nunca en el repo. La extensión de Chrome en Windows dio tiempo agotado; no usarla.
13. **Para Oliver al final (no decidido por él):** el mapa son tres bandas apiladas, no anillos concéntricos (Ruling 11); el examen del círculo 2 puede sacar 760 ÷ 4 o 980 ÷ 7 sin material (Ruling 8); la Piscina muestra una línea de instrucción; los círculos se numeran 0–2 en pantalla; «+110 XP» al validar con hojas ya hechas.

## CONSTRAINTS

- Archivos permitidos: `games/cursus-de-l-estany/*`, `cursus-de-l-estany.html`, `scripts/check-cursus.mjs`, `scripts/check.mjs`, la entrada del juego en `shared/games.js`, `package.json` (ya hecho). Nada más: ni otros juegos, ni el resto de `shared/`, `hub/`, `index.html`, `vite.config.js`, README o el workflow.
- Roles con nombre y sin `model`: `implementer`, `spec-reviewer`, `code-reviewer`. Como mucho 4 subagentes a la vez. Las tareas 8–10 comparten `main.js` y van en orden; una revisión de solo lectura puede correr mientras se construye la siguiente, y su ronda de arreglo espera a que esa termine.
- Cada implementador confirma solo sus archivos, nombrados uno a uno; pasa de unas 60 llamadas de herramienta y se detiene en su siguiente punto de control. No lanza subagentes.
- Cada defecto de lógica que encuentre un revisor se convierte en una comprobación de `scripts/check-cursus.mjs` en la misma ronda. Dos rondas seguidas que rompan otra cosa: parar y buscar la causa.
- Textos de pantalla en catalán, con concordancia de género y número; comentarios e identificadores en inglés. Commits en catalán, «El cursus de l'estany: qué», con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No crear otro libro de progreso: seguir escribiendo en el que hay.

## HOW TO VERIFY

- Estado de partida: `git log --oneline -1` muestra `d119643`; `npm run check` termina con código 0, `7 games checked` y la línea `cursus-de-l-estany: 120 preguntes, 600 exàmens, 1600 fulls`.
- Ronda de la tarea 6: la comprobación nueva de la nota falla antes del arreglo y pasa después; en Chrome sin cabeza a 1280 px, en Repartir `ex00`, tocar los nenúfares con el ratón, escribir la respuesta y pulsar Enter la envía (lo mismo tras la pista); a 360×640 la caja de respuesta se ve mientras se escribe; `git grep -i company -- games/cursus-de-l-estany shared/games.js` no da textos de pantalla.
- Tareas 8–10: la lista de navegador de cada una en el plan, a 360/390 y 1280 px, sin errores de consola salvo el favicon. El controlador mira al menos una captura por pantalla nueva.
- Final: `npm run build` pasa; recorrido completo de la Piscina al tercer examen a 390 px; la portada muestra «8 de 8 projectes»; el juego y la portada abren con `localStorage['cursus-de-l-estany']` puesto a `"x"`, `{"notes":"a"}` y `{"notes":[500]}`.
- Al informar a Oliver: qué se ejecutó y qué se vio. Lo que no se haya probado en navegador se declara como no verificado.
