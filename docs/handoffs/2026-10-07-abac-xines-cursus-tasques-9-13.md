# Ejecutar las tareas 9 a 13 del plan del àbac xinès (pistas dibujadas, mapa, proyecto, examen, hoja y limpieza), con la revisión pendiente de la tarea 7 y la revisión final de la rama

## CONTEXT

Repo `/home/olive/projects/Math`: juegos de matemáticas en catalán para un niño que juega solo (Vite multipágina, sin dependencias, comprobadores de Node en `scripts/`). Rama `abac-xines-cursus`, sale de `main` en `a86a47b`, 17 commits, sin push. Árbol limpio (`.claude/` y `docs/handoffs/` no están en git).

Spec `docs/superpowers/specs/2026-10-06-abac-xines-cursus-design.md`; plan `docs/superpowers/plans/2026-10-06-abac-xines-cursus.md` (13 tareas). La sesión del 2026-10-06/07 ejecutó las tareas 1 a 8 con subagent-driven-development.

**Hecho, revisado y cerrado (tareas 1 a 6 y 8):**

- `scripts/check-abac.mjs` — partes A (preguntas), B (progreso), C (examen y hoja), D (tarjeta del hub) y pins de texto de maquetación. Está en la cadena `npm run check`.
- `games/abac-xines/logic.js` — `PROJECTS` (9 × 3 × 5 = 135 preguntas), `CIRCLES`, `POOL`, `clean`, `mark`, `handIn`, `xpOf`, `levelText`, `BADGES`, `badges`, `isOpen`, `examOpen`, `exam`, `examIn`, `sheet`, `sheetIn`. `SECTIONS` y `LEVELS` siguen exportados.
- `games/abac-xines/board.js` — el ábaco como pieza que se mide sola. El juego de hoy (secciones y niveles) corre encima, con la pantalla de nivel partida en `.head` / `.stage` / `.tail` dentro de `#joc.lvl`.
- `scripts/sweep-abac.mjs` — barrido de navegador (14 medidas × 60 niveles × 3 estados). Fuera de la cadena `check`, sin dependencia en `package.json`. No estaba en el plan: es una decisión de la sesión anterior.

**Hecho, sin revisar:** tarea 7 (`d8cc63e`: tarjeta del hub «N de 9 projectes» pasando por `clean`, cadena `check`). El plan la revisa junto con la tarea 10. La tarjeta no se ha visto en el navegador.

**Verificado por la sesión anterior, con sus propios ojos:** `npm run check` pasa entero («7 games checked», «abac-xines: 135 preguntes»); `sweep-abac.mjs` sale con 0 en las 14 medidas (sin scroll a 390×844, 844×390, 820×1180 y en portátil; `--u` 31,25–44 / 25 / 44); capturas del nivel a 375×667, 820×1180 y 1024×600.

**No hecho:** tareas 9 a 13. No existe `games/abac-xines/hints.js`. `main.js` sigue siendo el juego antiguo. Nunca se ha ejecutado `npm run build` en esta rama.

**Registro de la ejecución:** `.superpowers/sdd/2026-10-06-abac-xines-cursus/progress.md` (ignorado por git). Tiene el escaneo previo, todas las decisiones («Ruling:»), los hallazgos menores aplazados y los riesgos que viajan a cada tarea. Léelo entero antes de despachar nada: las tareas con línea `complete` no se vuelven a despachar. En la misma carpeta: `common.md` (reglas comunes para cada implementador), `task-N-brief.md` de las 13 tareas, `task-N-report.md` de las hechas, y `pw.mjs` (driver de navegador sin ventana).

## TARGET FILES

- `docs/superpowers/plans/2026-10-06-abac-xines-cursus.md` — tareas 9 a 13: reglas, valores esperados y la prueba de navegador de cada una.
- `.superpowers/sdd/2026-10-06-abac-xines-cursus/progress.md` — el registro; se sigue escribiendo en él.
- `games/abac-xines/board.js` (104 líneas) — `board(host, { n, feet, tone })` → `el, rods, set, lock, feet, onMove, fit, bead, rod, stop`. Pone `--u` en el propio ábaco y `--board-min` / `--board-max` en el host. `onMove` pasa un segundo argumento `{ p, deck, j, was, bead }`. No tiene aviso de «he terminado de medir».
- `games/abac-xines/main.js` (163) — el juego antiguo sobre `board`; `seccions()`, `nivel`, botón «Pista». Las tareas 9 a 12 lo sustituyen por partes; la 13 quita lo muerto.
- `games/abac-xines/style.css` (124) — maquetación `.head` / `.stage` / `.tail`; en apaisado, rejilla de dos columnas con el escenario `position: sticky` y `max-height: calc(100dvh - 80px)`.
- `games/abac-xines/logic.js` (497) — toda la lógica; las pantallas solo la consumen.
- `scripts/check-abac.mjs` (912) — cada defecto que encuentre una revisión se fija aquí.
- `scripts/sweep-abac.mjs` (131) — `STATES` solo cubre la pantalla de nivel; cada pantalla nueva se añade, y `MAY_SCROLL` / `MIN_U` se vuelven a medir.
- `abac-xines.html`, `shared/games.js`, `README.md` — tareas 10, 11 y 13.
- Nuevo, aún no existe: `games/abac-xines/hints.js` (tarea 9).

## GOAL

Ejecutar las tareas 9, 10, 11, 12 y 13 en orden, con `implementer` por tarea y `spec-reviewer` según la tabla «Revisions» del plan (9 propia; 10 con la 7; 12 con la 11), y al final `code-reviewer` de toda la rama. Al acabar: `npm run build` pasa, el recorrido de un perfil nuevo y el de un perfil con `{"secs":[10,10,10,10,10,10]}` se han visto funcionar en el navegador, y los cinco puntos de «Review Focus» del plan tienen su prueba. No hacer push ni PR sin que Oliver lo pida.

## LOAD-BEARING DETAILS

1. **El progreso guardado no baja nunca.** Clave `abac-xines`; `secs` se conserva y el juego nuevo no lo escribe. Todo lo que se carga pasa por `clean`. Lo fija la parte B. Por qué: hay datos en dispositivos y en la nube y la fusión se queda con el número mayor.
2. **`handIn` solo cuenta las 15 primeras respuestas** y descarta el resto en silencio. La pantalla de proyecto no debe enviar nunca más de 15 (un doble toque que registre una pregunta dos veces daba 107). Es la razón de la guarda de 450 ms de la tarea 10.
3. **`exam(c, rnd)` y `sheet(rnd)` no tienen `rnd` por defecto** y lanzan sin él: las pantallas pasan `Math.random`. `examIn` se fía de que las preguntas son del círculo `c`. `levelText(p)` devuelve solo el número («2,27»); la pantalla pone la palabra «Nivell».
4. **`redo` de `handIn` son nombres `'ex00'`, `'ex01'`, `'ex02'`; `redo` de `examIn` son índices de proyecto.**
5. **La capa de pistas es hija del escenario o del ábaco.** En apaisado el escenario es `position: sticky`; coordenadas fijas o de documento se desplazan hasta 42 px al hacer scroll. Sin pseudoelementos de `.bead` y con `pointer-events: none`.
6. **`position: sticky` muere en silencio** si `#joc`, `#app` o `html` reciben `overflow`, `contain` o `transform`.
7. **Las pantallas nuevas mantienen `.head` / `.stage` / `.tail` como hijos directos de `#joc.lvl`.** Un hijo fuera de esos tres cae en una fila que el escenario no abarca. Más líneas en `.head` o `.tail` no deben agrandar el ábaco.
8. **La hoja (tarea 12) muestra los tres ábacos uno detrás de otro, no a la vez.** Tres no caben de lado (114 px por ábaco a 390×844) y tres `.stage` directos se apilan en la misma celda en apaisado. Un host cuya altura dependa de su contenido hace que el `ResizeObserver` entre en bucle: cada host necesita altura definida.
9. **Contrato de medida del ábaco (8 reglas, en el registro).** Resumen: el ábaco nunca tapa un control; si cabe al mínimo de 18 px no hay scroll, y si no cabe la página hace scroll; en apaisado su tamaño sale de la altura visible. Lo comprueba `sweep-abac.mjs`.
10. **El comprobador se escribe antes y calcula el resultado por su cuenta**, con `// contract:`. Cada defecto de una revisión se convierte en comprobación en la misma ronda.
11. **Textos de `SECTIONS` con «segon(a)»** en `logic.js` (hacia las líneas 96, 233, 236, 253). El escaneo `/company|segon/i` de la tarea 13 debe entrar después de quitar `SECTIONS`; la palabra catalana «segons» también lo dispara, así que no usarla en comentarios.
12. **Riesgo sin verificar, para la tarea 10 y la revisión final:** una pestaña antigua o una compilación en caché que cargue un guardado nuevo y guarde `{ so, secs }` puede borrar `notes`, `exams` y `fulls` y subirlo a la nube. `shared/progress.js:93-94` solo fusiona cuando el documento cambió bajo la página, y ese archivo está fuera de alcance. Decidir con Oliver si se acepta.
13. **Decisiones ya tomadas que Oliver puede revertir** (todas en el registro): `142+36` y `253+324` van al proyecto 3; la tarjeta muestra «0 de 9 projectes» sin nada hecho; los subtítulos son literalmente los de la spec; `'dalt'` en la hoja lee `says + 4·10^p`; los pies `'full'` muestran cifra y valor sin letra; la maquetación de dos columnas vale para toda pantalla apaisada; `sweep-abac.mjs` vive en el repo.

## CONSTRAINTS

- No tocar `games/cursus-de-l-estany/`, `shared/progress.js`, `shared/sync.js` ni `shared/cloud.js`.
- Fuera de alcance: equipos, arrastrar bolas, más de 5 columnas.
- Tareas 9 a 13 estrictamente en orden: todas tocan `main.js` y `style.css`. Como mucho 4 subagentes a la vez.
- Cada implementador confirma solo sus archivos, por nombre; commits en catalán con el prefijo «L'àbac amb el model del cursus:».
- `logic.js` sigue importable desde Node; `SECTIONS` y `LEVELS` exportados hasta la tarea 13; `abac-xines.html` sin `data-hub`; `HUB` apunta a `abac-xines.html`.
- Ningún texto de pantalla con «company» ni «segon»; el botón es «Dona'm una pista».
- Tres rondas de arreglo seguidas en Sonnet sobre la maquetación de la tarea 8 arreglaron lo señalado y dejaron entrar algo nuevo cada vez; la cuarta, en Opus con el contrato escrito, cerró. Para las tareas de pantalla, dar al implementador el driver de navegador desde el primer despacho.
- Hallazgos menores aplazados (líneas `minor (deferred)` del registro): pasarlos al `code-reviewer` final para que decida cuáles bloquean.

## HOW TO VERIFY

- Estado de partida: `npm run check` pasa con «7 games checked» y «abac-xines: 135 preguntes».
- Navegador: `npm run dev -- --port 5199 --strictPort`, y después `PLAYWRIGHT_CORE=/home/olive/.claude/jobs/90bddb97/tmp/node_modules node scripts/sweep-abac.mjs` → 14 líneas `ok`, salida 0. Para pruebas sueltas, `pw.mjs` del registro (`open(w, h, save)` crea el perfil y el guardado; `shot` hace capturas). La extensión de Chrome no sirvió: la ventana no se redimensiona y las capturas agotan el tiempo.
- Tarea 9: los siete casos de la tabla de pistas a 390×844 y 844×390; tocar una bola borra la pista; con movimiento reducido no hay bucles.
- Tarea 10: `{"secs":[10,10,4,0,0,0]}` muestra los proyectos 0 a 3 con 80 y los círculos 1 y 2 cerrados; 14 a la primera y una con pista dan 93; doble toque en «Comprova» cuenta un intento; salir en la pregunta 7 no guarda nada.
- Tarea 11: un perfil nuevo acaba la Piscina y ve «Nivell 0,33»; 5 de 6 abre el círculo siguiente y 4 no.
- Tarea 12: una hoja perfecta suma 10 XP; la cuarta con un solo proyecto validado no suma.
- Tarea 13: `npm run build` pasa; en `npm run preview`, perfil nuevo Piscina → proyecto → mapa, y `{"secs":[10,10,10,10,10,10]}` ve nueve proyectos con 80, círculo 0 abierto, círculos 1 y 2 pendientes de examen, y la tarjeta del hub dice «9 de 9 projectes».
- Sin scroll a 390×844, 844×390 y 820×1180 en cada pantalla nueva, añadida a `sweep-abac.mjs`.
