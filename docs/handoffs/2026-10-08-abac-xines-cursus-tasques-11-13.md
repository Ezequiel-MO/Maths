# Cerrar la tarea 11 del àbac xinès (barra de XP, Piscina, examen), ejecutar las tareas 12 y 13 y la revisión final de la rama

## CONTEXT

Repo `/home/olive/projects/Math`: juegos de matemáticas en catalán para un niño que juega solo (Vite multipágina, sin dependencias, comprobadores de Node en `scripts/`). Rama `abac-xines-cursus`, sale de `main` en `a86a47b`, sin push. `.claude/` y `docs/handoffs/` no están en git.

Spec `docs/superpowers/specs/2026-10-06-abac-xines-cursus-design.md`; plan `docs/superpowers/plans/2026-10-06-abac-xines-cursus.md` (13 tareas), ejecutado con subagent-driven-development.

**Hecho, revisado y cerrado (tareas 1 a 10), HEAD `54d60f3` al escribir esto:**

- Tareas 1 a 8: lógica (`logic.js`), comprobador (`check-abac.mjs` partes A a D), ábaco que se mide solo (`board.js`), tarjeta del hub. La tarjeta se vio en el navegador: «9 de 9», «4 de 9» y «0 de 9 projectes».
- Tarea 9 (`081574e`, `460134d`, `da578c9`): `games/abac-xines/hints.js`, las pistas dibujadas. Dos rondas de arreglo, revisión limpia.
- Tarea 10 (`6797acd`, `785eba7`, `0a19431`, `9f48ff1`, `e822ebe`, `54d60f3`): mapa de tres bandas y pantalla de proyecto en `main.js`; el juego antiguo de secciones y niveles ya no se usa. Tres rondas de arreglo, revisión limpia. Nuevo `scripts/flow-abac.mjs` (comportamiento en navegador).

**Verificado por el controlador sobre `54d60f3`, un script cada vez:** `npm run check` pasa («7 games checked», «abac-xines: 135 preguntes»); `flow-abac.mjs` imprime `flow-abac: ok` dos veces seguidas; `sweep-abac.mjs` da `ok` en las 14 medidas (sin scroll a 390×844, 844×390, 820×1180 y en las cinco de portátil).

**Tarea 11 a medias, sin revisar (HEAD `7184b59`):** el implementador paró en su punto de control de 60 llamadas. Confirmado: `5e45d4b` (barra de XP en la fila `.top` y un botón de examen por banda, dibujado pero **sin conectar**) y `7184b59` (Piscina: retos 3, 5 y 7; `piscina` se guarda en cierto al resolver el tercero). Según el implementador, sin repetir por el controlador: `check-abac.mjs` verde (`npm run check` entero solo antes del primer commit), `flow-abac.mjs` ok entero, barrido ok solo a 390×844, 844×390 y 820×1180, 13 mutaciones fallan como deben. Informe: `task-11-report.md`, con el diseño del examen, los pins que faltan y las mutaciones por ejecutar.

**Falta de la tarea 11 (despachar como «tarea 11b» a un implementador nuevo, con `task-11-brief.md` y `task-11-report.md`):** la pantalla de examen y su conexión, sus secciones en `flow-abac.mjs` y `sweep-abac.mjs`, pins y mutaciones, volver a medir `MIN_U` / `MAY_SCROLL`, el barrido completo de 14 medidas, `npm run check` entero, y mirar las capturas a 320×568 (la barra de XP tiene unos 100 px) y 820×1180. Dos decisiones ya tomadas para la 11b: la Piscina no tiene «← Mapa» (solo «← Tots els jocs»), y la línea «Posa el número a l'àbac.» se quita porque el plan dice «tres reptes sense text».

**No hecho:** tarea 11b, tarea 12, revisión de la 11 y la 12 juntas, tarea 13, `code-reviewer` de toda la rama. Nunca se ha ejecutado `npm run build` en esta rama.

**Registro:** `.superpowers/sdd/2026-10-06-abac-xines-cursus/progress.md` (ignorado por git). Tiene todas las decisiones («Ruling:», 20 líneas), los hallazgos menores aplazados («minor (deferred)», 14 líneas) y los riesgos que viajan a cada tarea. Léelo entero antes de despachar nada; las tareas con línea `complete` no se vuelven a despachar. En la misma carpeta: `common.md` (reglas comunes de cada implementador; su ruta de scratch apunta a la sesión anterior, cámbiala a la tuya), `task-N-brief.md`, `task-N-report.md`, `pw.mjs` (driver de navegador sin ventana) y `shots/`.

## TARGET FILES

- `games/abac-xines/main.js` (208 líneas en `54d60f3`) — `mapa()`, `projecte(i)`, disciplina de pantallas (`enter()` / `fresh()` y testigo `t.on`), dos guardas de 450 ms sobre `e.timeStamp` (`openAt` para toda la pantalla, `tryAt` para el intento). La tarea 11 le añade `piscina()`, `examen(c)` y `paintXp()`; la 12, `full()`.
- `games/abac-xines/style.css` (183) — maquetación `.head` / `.stage` / `.tail`, mapa, capas de pista.
- `games/abac-xines/hints.js` (169) — `hints(b)` → `{ strip(target), show(move, target), play(target, on), stop() }`.
- `games/abac-xines/board.js` (104) y `logic.js` (497) — no deberían cambiar hasta la tarea 13, que quita `SECTIONS` y `LEVELS` de `logic.js`.
- `scripts/check-abac.mjs` (1003) — reglas y pins de texto sobre `main.js`, `hints.js`, `board.js`. En la cadena `npm run check`.
- `scripts/flow-abac.mjs` (438) — comportamiento en navegador por secciones (`section()`, `ONLY=` filtra). Fuera de la cadena `check`.
- `scripts/sweep-abac.mjs` (339) — medidas en 14 tamaños, 308 estados cada uno. Fuera de la cadena `check`; tarda de 10 a 15 minutos entero.
- `abac-xines.html`, `README.md` — tareas 11 y 13.

## GOAL

Dejar la rama lista para que Oliver decida qué hacer con ella: tarea 11 terminada y revisada junto con la 12, tarea 13 hecha, `code-reviewer` de toda la rama pasado con sus arreglos, `npm run build` en verde, y los dos recorridos de la tarea 13 vistos en `npm run preview` (perfil nuevo: Piscina → proyecto → mapa; perfil con `{"secs":[10,10,10,10,10,10]}`: nueve proyectos con 80, círculo 0 abierto, círculos 1 y 2 pendientes de examen, tarjeta «9 de 9 projectes»). Sin push ni PR hasta que Oliver lo pida. Al acabar, la lista completa de «Ruling:» del registro va en el mensaje final.

## LOAD-BEARING DETAILS

1. **El progreso guardado no baja nunca.** Clave `abac-xines`; todo lo cargado pasa por `clean(load('abac-xines'))`; se guarda el objeto entero con `secs` tal como vino y el juego nuevo no escribe `secs`. `piscina` y los exámenes solo pasan a cierto. Por qué: hay datos en dispositivos y en la nube, y la fusión se queda con el mayor.
2. **Ninguna pregunta se registra dos veces ni cero.** `handIn` solo cuenta las 15 primeras respuestas. En `projecte`, `busy` se pone antes de `record()` y la guarda `tryAt` compara la hora del propio toque. El examen debe conservar las dos cosas y no llamar nunca a `handIn`.
3. **Las guardas de toque miden `e.timeStamp`, no el reloj.** Con el reloj, un primer manejador lento dejaba pasar el segundo toque: una ejecución con la máquina cargada contó dos intentos por un doble toque. Lo fijan un pin en `check-abac.mjs` y los casos de manejador lento de `flow-abac.mjs`.
4. **Salir a mitad no guarda nada** (proyecto, Piscina, examen, hoja) y al volver se empieza de nuevo. Cada `await` va seguido de `if (!t.on) return;`. Las secciones de `flow-abac.mjs` salen en el mismo turno que el toque y fallan con «left too late» si la máquina va lenta; las secciones nuevas deben hacer lo mismo, nunca pasar en vacío.
5. **`exam(c, rnd)` y `sheet(rnd)` lanzan sin `rnd`**: las pantallas pasan `Math.random`. `redo` de `examIn` son índices de proyecto; `redo` de `handIn` son `'ex00'`, `'ex01'`, `'ex02'`. `levelText(p)` devuelve solo el número; la pantalla escribe «Nivell».
6. **Pistas:** pasar siempre `target` a `show(move, target)` (sin él un `borrow` no tiene tarjeta); `play` cambia el ábaco con `b.set`, que no dispara `onMove`; bloquear antes de `play`; `stop()` antes de abrir un panel (`.hints` z-index 5 pinta sobre `.panel` z-index 3); en preguntas de leer, marcar la pregunta como ayudada antes de dibujar la tira.
7. **Maquetación:** `.head` / `.stage` / `.tail` son hijos directos de `#joc.lvl`; en apaisado el escenario es `position: sticky` con `max-height: calc(100dvh - 80px)` (los 80 px suponen la cabecera oculta y `.top` de una fila). `sticky` muere en silencio si `#joc`, `#app` o `html` reciben `overflow`, `contain` o `transform`. `.tail` es contenedor de tamaño y la letra de `.acts .btn` supone tres etiquetas.
8. **La altura del mapa va justa:** a 844×390 acaba a unos 20 px del borde y a 390×844 en 795 de 844. Barra de XP, botones de examen, botón de hoja e insignias obligan a volver a medir `MIN_U` / `MAY_SCROLL`. La tarea 12 admite que el mapa entero se desplace solo si no cabe.
9. **La hoja (tarea 12) muestra los tres ábacos uno detrás de otro.** Tres `.stage` directos se apilan en la misma celda en apaisado y no caben de lado (114 px por ábaco a 390×844). `bd` y `hn` son variables únicas de módulo y `fresh()` solo para esas: tres ábacos necesitan una lista, y cada host altura definida (un host que depende de su contenido hace entrar en bucle al `ResizeObserver`).
10. **Los pins de `check-abac.mjs` casan `main.js` por texto exacto** (forma de `record()`, tres llamadas a `record()`, `await sleep(...); if (!t.on) return;`, `play(pl.goal, () => t.on)`). Si una tarea cambia esas formas, el pin se actualiza para fijar la misma regla y se prueba con una mutación; no se borra.
11. **Cada defecto de una revisión se convierte en comprobación en la misma ronda**, con el valor esperado escrito a mano y `// contract:`. Los revisores han tenido que producir ellos las mutaciones cuando el implementador se cortó sin informe: pídelas siempre.
12. **Tarea 13:** el escaneo `/company|segon/i` entra después de quitar `SECTIONS` (sus textos tienen «segon(a)»); la palabra catalana «segons» también lo dispara, ni en comentarios. Antes de borrar `SECTIONS` / `LEVELS`, mirar quién más los importa: `shared/games.js` importa `logic.js`, así que una importación no apta para Node rompe el hub y `scripts/check.mjs`.

## CONSTRAINTS

- No tocar `games/cursus-de-l-estany/`, `shared/progress.js`, `shared/sync.js` ni `shared/cloud.js`.
- Fuera de alcance: equipos, arrastrar bolas, más de 5 columnas.
- Tareas 11 a 13 estrictamente en orden (todas tocan `main.js` y `style.css`). Revisión `spec-reviewer` de la 12 junto con la 11; al final `code-reviewer` de toda la rama, con las líneas «minor (deferred)» y «Ruling:» del registro.
- Cada implementador confirma solo sus archivos, por nombre; commits en catalán con el prefijo «L'àbac amb el model del cursus:».
- Ningún texto de pantalla con «company» ni «segon»; el botón es «Dona'm una pista»; `abac-xines.html` sin `data-hub`.
- Un solo script de navegador a la vez. Con tres navegadores la carga subió a 18 y aparecieron fallos falsos.
- No editar archivos servidos mientras corre un script: Vite recarga la página.
- No hacer `pkill -f` con el nombre del script en la propia línea de orden: mata la shell que lo lanza (pasó dos veces). Usar el truco del corchete: `pkill -f "node scripts/[s]weep-abac"`.

## DECISIONES QUE OLIVER PUEDE REVERTIR (tomadas en esta sesión; todas en el registro)

- La pista dibuja lo que devuelve `nextMove`: para `4+1` desde 4 y `8+2` desde 8 sale una bola y luego el cambio «5 → 1» / «10 → 1», no las tarjetas `+1 = +5 −4` y `+2 = +10 −8` de la tabla del plan.
- Un préstamo no adyacente o de bola de arriba dice la cantidad real: `−1 = −100 +99`, `−3 = −50 +47`.
- En `ex00`, las preguntas de leer muestran cifra y valor bajo cada columna, como la tabla de la spec.
- Las dos guardas de 450 ms comparan la hora del toque.
- **Sin decidir:** una pestaña antigua que guarde `{ so, secs }` sobre un guardado nuevo puede borrar `notes`, `exams` y `fulls` y subirlo a la nube. `shared/progress.js` solo fusiona cuando el documento cambió bajo la página, y está fuera de alcance. Preguntar a Oliver si se acepta.
- **Sin comprobar:** en motores que dan `event.timeStamp` en milisegundos de época (WebKit antiguo), la guarda de pantalla deja pasar todo; la de intento no se ve afectada. No se ha mirado qué versiones de Safari afecta.

## HOW TO VERIFY

- Arranque: `git status --short` (solo `.claude/` y `docs/handoffs/` si la tarea 11 no dejó nada a medias) y `npm run check` → «7 games checked», «abac-xines: 135 preguntes».
- Servidor: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5199/`; si no da 200, `npm run dev -- --port 5199 --strictPort` en segundo plano.
- Comportamiento: `PLAYWRIGHT_CORE=/home/olive/.claude/jobs/90bddb97/tmp/node_modules node scripts/flow-abac.mjs` → `flow-abac: ok`, salida 0 (un minuto en máquina tranquila).
- Medidas: `PLAYWRIGHT_CORE=… node scripts/sweep-abac.mjs` → 14 líneas `ok`, salida 0. Admite lista de tamaños (`390x844,844x390`) para tandas de menos de 10 minutos.
- Tarea 11: perfil nuevo acaba la Piscina y ve «Nivell 0,33»; 5 de 6 abre el círculo siguiente y 4 no; salir de un examen a medias no guarda nada.
- Tarea 12: una hoja perfecta suma 10 XP y enciende su insignia; la cuarta hoja con un solo proyecto validado no suma.
- Tarea 13: `npm run build` pasa; los dos recorridos del GOAL vistos en `npm run preview`. En la carga de `index.html` en desarrollo salió un 404 de un recurso sin identificar: mirarlo en la vista previa.
- Capturas con `pw.mjs` (`open(w, h, save, opts)`, `shot`) y mirarlas a las tres medidas: las comprobaciones de geometría solas han dejado pasar defectos.
