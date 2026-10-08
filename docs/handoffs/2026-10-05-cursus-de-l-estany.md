# Ejecutar el plan de «El cursus de l'estany» (11 tareas) con subagentes, en la rama `cursus-de-l-estany`

## CONTEXT

Repo `/home/olive/projects/Math`: sitio Vite multipágina de juegos de matemáticas para un niño de 9 años. JavaScript sin framework, textos en catalán, sin test runner (las comprobaciones son scripts de Node que corren en `npm run check`, antes de cada build). Se despliega a GitHub Pages desde `main`.

Hecho y verificado en la sesión anterior:
- Diseño aprobado por Oliver: un juego nuevo para aprender a dividir con la estructura de 42 Barcelona (Piscina, mapa de proyectos, ejercicios sin lección, corrección de compañeras, exámenes, XP y nivel).
- Spec y plan escritos, aprobados y confirmados en la rama `cursus-de-l-estany` (commit `56cc65b`). La rama sale de `main` en `ae5df4c`.
- Oliver eligió ejecución por subagentes.

No hay nada de código del juego todavía: ni `games/cursus-de-l-estany/`, ni la página, ni el comprobador. `.claude/` aparece sin seguimiento en `git status`; no es parte de este trabajo, no lo añadas.

Decisiones de Oliver que no están en discusión:
- No hay puntos de evaluación: entregar un proyecto no cuesta nada.
- Corregir la hoja de otra rana se queda, como actividad voluntaria que da XP. Esto fue interpretación mía de «el punto de evaluación lo puedes ignorar»; Oliver aprobó la spec con ello escrito.
- Fuera: Agujero Negro, competición entre equipos, dividir entre dos cifras, decimales.

## TARGET FILES

Leer primero, enteros:
- `docs/superpowers/plans/2026-10-04-cursus-de-l-estany.md` — el plan: reglas comunes, forma de los datos, límites por proyecto y 11 tareas con su comprobación.
- `docs/superpowers/specs/2026-10-04-cursus-de-l-estany-design.md` — la spec.

El modelo a imitar (no modificar):
- `games/nenufars-a-trossos/logic.js` (218 líneas), `main.js` (328), `style.css` (120), `nenufars-a-trossos.html` (20) y `scripts/check-nenufars.mjs` (97).

A crear: `games/cursus-de-l-estany/{logic.js, main.js, material.js, style.css}`, `cursus-de-l-estany.html`, `scripts/check-cursus.mjs`.

A modificar: `shared/games.js` (tarjeta), `scripts/check.mjs` (tabla `TOTALS`), `package.json` (cadena de `check`).

## GOAL

Ejecutar las 11 tareas del plan en orden con `superpowers:subagent-driven-development`, usando los roles con nombre `implementer` y `spec-reviewer`, hasta que el juego se pueda jugar entero, de la Piscina al tercer examen, `npm run build` pase y la revisión de toda la rama (`code-reviewer`) esté resuelta. No fusionar ni hacer push sin que Oliver lo pida.

## LOAD-BEARING DETAILS

1. **El plan no trae el código escrito, a propósito.** Da reglas, límites y la comprobación de cada tarea. Las 120 preguntas concretas las escribe el implementador y el comprobador las valida. No pidas a un subagente que «pegue» código del plan.
2. **El comprobador se escribe antes que la lógica** (tareas 1 a 4) y recalcula los límites por su cuenta, sin usar `inLimits` de `logic.js`. Si usa la función que comprueba, no comprueba nada.
3. **`logic.js` debe poder importarse en Node.** No toca `document`, `window` ni `localStorage`, y no importa `shared/util.js` (lee `matchMedia` al cargarse y rompe). El azar entra por un parámetro `rnd`; los generadores se prueban con un LCG con semilla para que un fallo se reproduzca.
4. **No usar `sectionMenu`, `levelRow` ni `wireLevels`** de `shared/sections.js`: tienen escrito «10 niveles por sección» y lanzan error sin un botón habilitado o sin `[aria-current]`. Solo sirve `panel()`, que necesita un `<button>` en su html y un anfitrión con `position: relative`.
5. **El progreso guarda hechos, no derivados:** `{ so, piscina, equip, notes, exams, fulls }` bajo la clave `cursus-de-l-estany`. XP, nivel y logros se calculan. `clean()` debe devolver un progreso válido con cualquier JSON, y `record` de la tarjeta no puede fallar con `{}`: la portada llama a `load(store) || {}`.
6. **`scripts/check.mjs` rompe el build** si una tarjeta tiene `total` y el juego no está en `TOTALS`. Tarjeta con `total: 8` y `'cursus-de-l-estany': PROJECTS.length` van en la misma tarea (la 5).
7. **Números fijos:** nota para validar 80; `mark(firsts) = round(100 × firsts / 15)`; examen aprobado con 5 de 6; XP = 50 (Piscina) + nota de cada proyecto validado + 50 por examen + 10 × min(`fulls`, 3 × proyectos validados); máximo 1.240; nivel = XP ÷ 150 con dos decimales y coma («8,27»).
8. **Una hoja a corregir enseña mal si su etiqueta miente.** El comprobador exige `item.ok === right(item.q, item.shown)` en 1.600 hojas. El resto no reducido (17 ÷ 5 = 2 y sobran 7) cumple dividendo = divisor × cociente + resto y aun así es incorrecto.
9. **Disciplina de pantallas, copiada de los nenúfars:** testigo `fresh()` y comprobar `t.on` tras cada `await sleep`; `keyFn = null` al salir; guarda de 450 ms contra el doble toque. El regex que oculta «Tots els jocs» debe mirar `cursus-de-l-estany\.html$`, no el del juego copiado.
10. **El CSS del teclado numérico no está en `shared/`**: vive en el `style.css` de los nenúfars y hay que reescribirlo en el del juego nuevo. `pond()` necesita los canvas `#sky` y `#fx` en la página.
11. **Estilo:** textos de pantalla en catalán; comentarios e identificadores en inglés, densos, como los otros juegos. Commits en catalán, «El cursus de l'estany: qué», con la línea `Co-Authored-By` de la sesión.

## CONSTRAINTS

- Nada fuera de los archivos listados. Los otros juegos, `shared/` (salvo la entrada nueva en `games.js`), `hub/`, `index.html`, `vite.config.js`, README y el workflow no se tocan.
- Como mucho 4 subagentes a la vez. Las tareas 1 a 4 comparten dos archivos y van en orden; la 5 puede empezar mientras se revisa la 4; de la 6 a la 10 comparten `main.js` y van en orden.
- Cada implementador confirma solo sus archivos, nombrados uno a uno. Una tarea que pase de unas 60 llamadas de herramienta se detiene en su siguiente punto de control y lo dice.
- Revisión propia (`spec-reviewer`) para las tareas 3, 5 y 6; las demás se agrupan como dice la sección «Revisions» del plan. La revisión de toda la rama al final no se salta.
- Cada defecto de lógica que encuentre un revisor se convierte en una comprobación de `scripts/check-cursus.mjs` en la misma ronda de arreglo. Dos rondas seguidas que rompan otra cosa: parar y buscar la causa.
- Una ambigüedad pequeña que queda en el plan: en las hojas, el error de la rana en el modo `proof` con resto 0 no puede ser «olvidar el resto» (daría la respuesta buena); debe ser sumar `d` de más. La comprobación del punto 8 lo caza.

## HOW TO VERIFY

- Tareas 1 a 4: `node scripts/check-cursus.mjs` termina con código 0 y la línea que el plan indica para cada tarea (`75 preguntes`, luego `120 preguntes`, luego `120 preguntes, 600 exàmens, 1600 fulls`).
- Tarea 5 en adelante: `npm run check` (debe decir `7 games checked`) y, con `npm run dev`, cada lista de comprobación de navegador del plan, a 360/390 px y 1280 px, sin errores en consola. Incluye abrir el juego y la portada con `localStorage['cursus-de-l-estany']` puesto a `"x"`, `{"notes":"a"}` y `{"notes":[500]}`.
- Final: `npm run build` pasa; recorrido completo de la Piscina al tercer examen a 390 px; la portada muestra «8 de 8 projectes».
- Al informar a Oliver: decir qué se ejecutó y qué se vio. Lo que no se haya probado en navegador se declara como no verificado.
