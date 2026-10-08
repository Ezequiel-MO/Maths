# Ejecutar el plan «El progrés al núvol»: perfiles por niño y copia del progreso en Firestore, tareas 1 a 5 (la 6 espera al proyecto de Firebase)

## CONTEXT

Repo `/home/olive/projects/Math`: una colección de juegos de matemáticas en catalán para dos niños (Xavi y Laia), páginas HTML sin framework, Vite multipágina, publicado en GitHub Pages desde `main` (`.github/workflows/pages.yml`).

Hecho y confirmado en la rama `progres-al-nuvol` (2 commits sobre `9e7bd5f`):

- **Especificación aprobada por Oliver:** `docs/superpowers/specs/2026-10-05-progres-al-nuvol-design.md` (commit `9bc27a2`, enmienda en `631d942`).
- **Plan aprobado por Oliver:** `docs/superpowers/plans/2026-10-05-progres-al-nuvol.md` (commit `631d942`). Seis tareas, con firmas, valores esperados y la comprobación de cada una.

No hay nada de código escrito. Ninguna expresión del plan se ha ejecutado: las marcadas «per verificar» (la expresión de `slug`, las reglas de Firestore) son sin verificar.

Decisiones ya tomadas, no se reabren: Firebase (Firestore + Auth con Google, cuenta del adulto), no Supabase ni Neon; el dispositivo manda (`localStorage` es lo que leen los juegos); `firebase/firestore/lite` con cola propia; el identificador del perfil sale del nombre; conflicto real → gana el guardado más reciente.

Estado de las ramas:

- `main` tiene 3 commits que `progres-al-nuvol` no tiene (PR #12 y #13). El único archivo distinto es `games/nenufars-a-trossos/main.js`, que este plan no toca. Antes de empezar: `git rebase main` (la rama no está publicada en `origin`).
- Sin seguimiento en el árbol de trabajo: `.claude/` y `docs/handoffs/`. No son de este trabajo; no se añaden a ningún commit de tarea.

El proyecto de Firebase **no existe todavía**. Lo crea Oliver; hasta entonces la tarea 6 está bloqueada.

## TARGET FILES

- `docs/superpowers/plans/2026-10-05-progres-al-nuvol.md` — el plan; se ejecuta tal cual, tarea por tarea.
- `docs/superpowers/specs/2026-10-05-progres-al-nuvol-design.md` — la especificación; el bloque «Esmena» de arriba corrige cuatro puntos del resto del documento.
- `shared/progress.js` — 7 líneas: `load(id)` y `save(id, data)` sobre `localStorage`, con la clave igual al id del juego. Es la única puerta al progreso.
- `hub/main.js` — 7 líneas: pinta una tarjeta por juego con `g.record(load(g.store) || {}, g.total)`.
- `index.html` — la portada: un `<header>` y `<ul class="games">`.
- `hub/style.css` — 31 líneas, el estilo de la portada.
- `shared/games.js` — la lista `GAMES`; cada entrada tiene `store` (dos juegos comparten `memoria-visual`). Solo se lee.
- `scripts/check-nenufars.mjs` — 97 líneas; el modelo de estilo para el comprobador nuevo.
- `package.json` — `check` encadena tres scripts de Node; `build` es `npm run check && vite build`. Sin dependencias de ejecución.
- Por crear: `shared/sync.js`, `shared/cloud.js`, `shared/firebase-config.js`, `firestore.rules`, `scripts/check-progress.mjs`.

## GOAL

Ejecutar las tareas 1 a 5 del plan en la rama `progres-al-nuvol`, cada una con su commit y su comprobación observada, de modo que la portada pregunte «Qui juga?», cada perfil tenga su progreso en los seis juegos, y todo el código de la nube exista pero quede inerte mientras `shared/firebase-config.js` exporte `null`. Al terminar la 5, parar y pedir a Oliver el proyecto de Firebase para la tarea 6; no fusionar ni publicar antes de la revisión de toda la rama.

## LOAD-BEARING DETAILS

1. **`load(id)` y `save(id, data)` conservan la firma y siguen síncronos.** Los seis juegos los llaman al cargar el módulo (p. ej. `games/cursus-de-l-estany/main.js:13`); si pasan a ser asíncronos, todos los juegos arrancan sin progreso.
2. **Los seis juegos (`games/*`) y `shared/games.js` no se tocan.** Es la premisa del diseño: todo queda detrás de `progress.js`.
3. **`shared/progress.js` debe poder importarse bajo Node con un `localStorage` falso.** Todo lo del navegador (`location`, `document`, `import('./cloud.js')`) va detrás de `typeof window !== 'undefined'`; si no, `npm run check` rompe y con él `npm run build` y el despliegue.
4. **Ningún acceso a `localStorage` lanza hacia fuera.** Hoy `load` y `save` ya tragan el error; en modo privado o con el almacén lleno la portada tiene que seguir abriéndose.
5. **`save` pone `at = Math.max(Date.now(), at anterior + 1)`.** `pushed(perfil, juego, at)` solo limpia el pendiente si la marca conserva ese `at`; sin el crecimiento estricto, un guardado hecho durante un envío se da por enviado y se pierde.
6. **Progreso antiguo: lo adopta el primer perfil que queda activo, con marca `{ at: 0, base: null, pending: true }`, sin pisar un documento que el perfil ya tenga, y la clave antigua se borra siempre.** El `at` 0 es lo que hace que la nube gane sobre datos sin fecha.
7. **`settle`: en el empate gana la nube (`'pull'`), y con dispositivo presente y nube ausente siempre `'push'`.** La tabla completa de 11 filas está en la tarea 1 del plan.
8. **Los nombres de perfil se pintan con `textContent`.** Pueden venir de Firestore; dentro de un `innerHTML` serían una inyección.
9. **Firebase solo se carga con `import()`** y solo de `firebase/app`, `firebase/auth` y `firebase/firestore/lite`. La especificación exige que no retrase ningún juego; la tarea 4 lo comprueba en `dist/assets`.
10. **Con `firebase-config.js` en `null`, `cloud.js` no inicializa nada y el botón de cuenta no existe en la página.** Es lo que permite acabar las tareas 1 a 5 sin el proyecto.
11. **`rebase(uid)`:** si la sesión es de otra cuenta que la anterior, todas las marcas vuelven a `base: null, pending: true`. Sin esto, un dispositivo que cambia de cuenta trata como ya enviados documentos que la cuenta nueva no tiene.
12. **Textos de pantalla en catalán y sin hablar de un segundo jugador dentro de un juego** (decisión de Oliver del 2026-10-05, vale para todo el repo). «Qui juga?» y «Afegeix un jugador» están aprobados.
13. **La rama no se puede publicar entre la tarea 2 y la 3:** sin «Qui juga?» no hay perfil activo y `save` no guarda nada.

## CONSTRAINTS

- Solo los archivos que cada tarea lista. Nada de refactorizar `shared/`, los juegos ni los otros comprobadores.
- El plan da reglas y valores esperados, no código; el código lo escribe quien ejecuta. No añadir funciones, claves de `localStorage` ni textos que el plan no nombre (claves permitidas: `perfils`, `perfil`, `<perfil>:<joc>`, `sync`, `compte`).
- Fuera de alcance: borrar o renombrar perfiles, fusionar progreso campo a campo, limitar quién puede crear cuenta, una cuenta por niño.
- Ejecución con subagentes: `implementer` por tarea, sin `model` en la llamada, como máximo 4 a la vez. `spec-reviewer` por riesgo: tarea 2 (con la 1), tarea 3, y tareas 4 y 5 juntas. `code-reviewer` de toda la rama al final. Cada defecto que encuentre un revisor se convierte en una comprobación en `scripts/check-progress.mjs` en la misma ronda.
- Las tareas comparten `shared/progress.js`, `hub/main.js` e `index.html`: van en orden, sin paralelizar.
- Cada commit nombra sus archivos uno a uno; mensaje en catalán, «El progrés al núvol: què», con la línea `Co-Authored-By` de la sesión.
- No crear el proyecto de Firebase, no hacer `git push` ni abrir PR sin que Oliver lo pida.
- Una tarea que pase de unas 60 llamadas de herramienta se detiene en su siguiente punto de control y lo dice.

## HOW TO VERIFY

- **Tareas 1 y 2:** `npm run check` termina sin ningún `FAIL`. `scripts/check-progress.mjs` contiene las dos tablas de la tarea 1 y las doce comprobaciones de la tarea 2, y cada una falló antes de escribir el código.
- **Tarea 3:** con `npm run dev`, a 360×640 y a 1280×800, las comprobaciones del plan, observadas una a una: almacén vacío → «Qui juga?» sin tarjetas; añadir «Xavi» y ver su récord tras jugar; «Laia» empieza sin récords y «Xavi» recupera el suyo; un nombre con `<` se ve como texto; doble toque en «Fet» crea un solo perfil; abrir `cursus-de-l-estany.html` sin perfil vuelve a la portada; con `abac-xines` = `{"secs":[2,0,0,0,0,0]}` antiguo, la tarjeta dice «2 de 60 nivells» tras añadir «Xavi».
- **Tarea 4:** `npm run build` pasa; en `dist/assets` el texto `firestore` no aparece en el archivo de entrada de ningún juego ni de la portada; con la configuración en `null`, guardar un nivel no deja errores en la consola ni peticiones a Google.
- **Tarea 5:** sin configuración no hay botón; con un `cloud.js` de prueba (sin commit, restaurado después) que simula sesión y un perfil descargado, el perfil aparece en «Qui juga?» sin recargar y su nombre se ve como texto.
- **Al cerrar:** `git log --oneline main..progres-al-nuvol` muestra la especificación, el plan y un commit por tarea; `git status --short` solo muestra `.claude/` y `docs/handoffs/`.
- El informe final dice, por tarea, qué se ejecutó y qué se vio. La tarea 6 (contra el proyecto real) queda declarada como pendiente y sin verificar.
