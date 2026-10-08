# Ejecutar el plan «El progrés no baixa mai»: juntar la copia del dispositivo y la de la nube campo por campo, y dejar el código de la nube listo para encenderlo (tareas 1 a 6)

## CONTEXT

Repo `/home/olive/projects/Math` (remoto `Ezequiel-MO/Maths`): juegos de matemáticas en catalán para dos niños (Xavi y Laia), páginas HTML sin framework, Vite multipágina, publicado en GitHub Pages desde `main` (`.github/workflows/pages.yml` corre `npm run build` = `npm run check && vite build`).

Hecho, verificado y publicado (PR #14, `main` en `18b672e`, despliegue de Pages correcto el 2026-10-06):

- Perfiles por niño: la portada pregunta «Qui juga?»; `shared/progress.js` guarda bajo `<perfil>:<joc>` con una marca por documento (`at`, `base`, `pending`).
- Todo el código de la nube existe y está **apagado**: `shared/firebase-config.js` exporta `null`, no se carga ningún paquete de Firebase y no hay botón de cuenta. El proyecto de Firebase **no existe todavía**.
- Dos comprobadores nuevos en `npm run check`: `scripts/check-progress.mjs` y `scripts/check-cloud.mjs` (este corre el `cloud.js` real contra un Firebase falso, vía un gancho de resolución en `scripts/fakes/hooks.mjs`).

Hecho en la rama `progres-mai-baixa` (1 commit sobre `main`, `ef8690f`, **sin publicar**), aprobado por Oliver el 2026-10-06:

- El plan `docs/superpowers/plans/2026-10-06-progres-mai-baixa.md`: seis tareas con firmas, tablas de valores esperados y la comprobación de cada una.
- La enmienda «Esmena (2026-10-06)» en la especificación: cambia «gana el guardado más reciente» por «el progreso nunca baja».

Nada de código de este plan está escrito. Las tablas de valores del plan son sin verificar hasta que el comprobador las ejecute.

Por qué existe este plan: la revisión de toda la rama anterior reprodujo una pérdida de progreso con las dos tabletas conectadas. A y B sincronizadas en el nivel 10; B llega al 30 y lo envía; A, atrasada, abre el juego directamente, toca el botón de sonido y envía el nivel 10 con fecha más nueva; B lo descarga. El nivel 30 desaparece de todas partes.

Decisiones de Oliver ya tomadas, no se reabren:

- «El progreso nunca baja» (fusión campo por campo), con sus costes aceptados: el reinicio de Salts de Granota puede volver si otra tableta también jugó sin sincronizar; `fulls` del cursus se queda el mayor, no la suma; una forma antigua de guardado (`coet`, `stars`) que se junta antes de que el juego la haya reescrito pierde lo antiguo.
- Los tres puntos previos a encender la nube se hacen en este plan (tareas 4, 5 y 6).
- Aceptado tal cual: entrar con otra cuenta de Google copia el progreso del dispositivo a esa cuenta; donde el navegador niega `localStorage` el sitio no se puede usar.

Sin seguimiento en el árbol de trabajo: `.claude/` y `docs/handoffs/`. No son de este trabajo; no se añaden a ningún commit.

## TARGET FILES

- `docs/superpowers/plans/2026-10-06-progres-mai-baixa.md` — el plan; se ejecuta tal cual, tarea por tarea. Sus encabezados son «### Tasca N», no «Task N».
- `docs/superpowers/specs/2026-10-05-progres-al-nuvol-design.md` — la especificación; el bloque «Esmena (2026-10-06)» manda sobre el resto del documento.
- `docs/superpowers/plans/2026-10-05-progres-al-nuvol.md` — el plan anterior; sus «Regles per a totes les tasques» siguen valiendo, y su tarea 6 (el proyecto real) queda para después de este plan.
- `shared/sync.js` — 22 líneas: `slug(name)` y `settle(local, remote)`, puras.
- `shared/progress.js` — 138 líneas: `profiles`, `active`, `add`, `addProfiles`, `choose`, `load`, `save`, `entries`, `pulled`, `pushed`, `rebase`; al final, la redirección a la portada y el «dueño» de una página de juego (`owner`, `stale()`, `pageshow`).
- `shared/cloud.js` — 117 líneas: `enabled`, `session`, `signIn`, `signOut`, `push`, `syncAll`; una sola cadena de envíos (`chain`) y una sola ejecución de `syncAll` (`running`).
- `hub/main.js` — 156 líneas: `render(sync)`, las dos listas con puerta (`gates`, `gate`, `hold`), la espera de la nube (`lock`, `unlock`, tope de 4 s) y el botón de la cuenta.
- `hub/style.css` — incluye `.games[inert], .profiles[inert] { pointer-events: none; }`.
- `scripts/check-progress.mjs` — 349 líneas: tablas de `slug` y `settle` (14 filas), las secciones de `progress.js`, y al final (hacia la línea 294) las aserciones estáticas sobre el texto de la portada.
- `scripts/check-cloud.mjs` — 335 líneas: escenarios de `cloud.js` contra los falsos, y la sección «a stale game page».
- `scripts/fakes/` — `hooks.mjs`, `fake-app.mjs`, `fake-auth.mjs`, `fake-fs.mjs`, `fake-config.mjs`, `fake-null-config.mjs`.
- `package.json` — `check` encadena cinco scripts de Node.
- Por crear: `scripts/check-hub.mjs` (tarea 6).

## GOAL

Ejecutar las tareas 1 a 6 del plan en la rama `progres-mai-baixa`, cada una con su commit y su comprobación observada, de modo que ningún camino (sincronizar desde la portada, enviar desde un juego, guardar desde una página de juego con datos viejos) pueda hacer bajar el progreso de un niño en el dispositivo ni en la nube; que un dispositivo que nunca ha tenido sesión no cargue Firebase; que una petición colgada no bloquee la sincronización; y que la portada se compruebe ejecutando su código. Al terminar la 6 y la revisión de toda la rama, parar y preguntar a Oliver si se fusiona; después viene la tarea del proyecto real de Firebase, que necesita que él lo cree.

## LOAD-BEARING DETAILS

1. **El sitio ya está publicado y en uso.** Cada commit deja `npm run check` y `npm run build` verdes con `shared/firebase-config.js` en `null`. Por eso el cambio de `settle` va en la tarea 3 junto con `cloud.js`, en un solo commit: uno sin el otro deja el comprobador en rojo.
2. **`load(id)` y `save(id, data)` conservan la firma y siguen síncronos; los seis juegos (`games/*`) y `shared/games.js` no se tocan.** Los juegos llaman a `load` al cargar el módulo.
3. **`so` es la única excepción de `merge`:** se queda el de la copia más nueva. Si se trata como los demás booleanos («cierto si lo es alguno»), silenciar una tableta no dura. `equip` sigue la regla de los números a propósito: un equipo elegido nunca vuelve a `-1`.
4. **Un dispositivo sin cambios por enviar sigue haciendo `'pull'` del documento de la nube tal cual, sin fusionar.** Es lo que permite que «Esborra el progrés» de Salts de Granota llegue a las otras tabletas. No convertir esa fila en `'merge'`.
5. **`save` solo fusiona si el documento guardado cambió por debajo de la página** (el `at` de su marca no es el que la página vio en su último `load` o puso en su último `save`). Si fusionara siempre, el reinicio de Salts no funcionaría ni en local; si no fusionara nunca, la página de juego con datos viejos volvería a bajar el documento justo después de que `push` lo hubiera juntado.
6. **`merged` y `pulled` no tocan lo que `save` recuerda.** Así el siguiente `save` de la página detecta el cambio y fusiona.
7. **`merged(profile, game, data, seenAt, cloudAt)` solo escribe si la marca aún tiene `at === seenAt`**, y pone `at = max(Date.now(), seenAt + 1, cloudAt + 1)`, `base: cloudAt`, `pending: true`. El `at` por encima del de la nube es lo que hace que los demás dispositivos vean un documento nuevo y lo descarguen.
8. **En `progress.js` la marca se escribe antes que el documento, y se devuelve a su valor anterior si el documento no se pudo escribir.** Ya es así en `save` y en la adopción; `merged` hace lo mismo. Dos rondas de revisión encontraron pérdidas por el orden contrario.
9. **En `syncAll`, entre la instantánea de `entries()` y las llamadas a `pulled`/`merged` no hay ningún `await`.** Ninguna de las dos tiene otra defensa contra un `save` que llegue en medio que su guarda de `at`.
10. **`pushed(perfil, joc, at)` recibe exactamente el `at` que se envió, y todos los envíos pasan por la cadena única**, que relee la entrada cuando le toca. Sin la cadena, dos envíos del mismo documento podían llegar desordenados.
11. **Las comprobaciones existentes de `check-progress.mjs` no cambian de valor esperado en la tarea 2.** Si una falla, la tarea se detiene y lo dice; no se adapta la comprobación. Solo cambian las cuatro filas de `settle` (tarea 3) y los escenarios de `check-cloud.mjs` que decían «gana el más nuevo».
12. **En `hub/main.js` se quita solo la espera de la nube** (`lock`, `unlock`, el tope de 4 s, el motivo `cloud`). La regla de los 500 ms se queda: cambio de «Qui juga?» a los juegos, repintado por sincronización y «Canvia», con el atributo `inert` (no la propiedad) y un `hold` que un `render` posterior nunca cancela.
13. **`compte` no se borra al cerrar sesión.** `rebase` lo necesita para detectar un cambio de cuenta; y es la señal de «este dispositivo ha tenido sesión» que decide si se carga Firebase.
14. **Una página de juego recuerda el perfil con el que se cargó** (`owner` en `progress.js`): un `save` bajo otro perfil activo no escribe nada y vuelve a la portada. Es el arreglo que desbloqueó la fusión anterior; no romperlo al tocar `save`.
15. **Los nombres de perfil y de cuenta llegan a la página solo con `textContent`; textos de pantalla en catalán; ningún texto nuevo en este plan.**
16. **Claves de `localStorage` permitidas:** `perfils`, `perfil`, `<perfil>:<joc>`, `sync`, `compte`. Ninguna otra.

## CONSTRAINTS

- Solo los archivos que cada tarea lista. Nada de refactorizar `shared/`, los juegos ni los otros comprobadores. `hub/main.js` no se cambia para hacerlo comprobable, salvo un cambio mínimo y justificado en el informe.
- El plan da reglas y valores esperados, no código. No añadir exportaciones que el plan no nombre (nuevas: `merge`, `same`, `merged`, `account`).
- Sin dependencias nuevas. En la tarea 6, si el `document` falso pasa de unas 150 líneas, la tarea se detiene y se pregunta a Oliver si prefiere una biblioteca.
- Ejecución con subagentes: `implementer` por tarea, sin `model` en la llamada, como máximo 4 a la vez. `spec-reviewer` por riesgo: tarea 2 (con la 1), tarea 3, tareas 4 y 5 juntas, tarea 6. `code-reviewer` de toda la rama al final. Cada defecto que encuentre un revisor se convierte en una comprobación en la misma ronda.
- Las tareas comparten `shared/sync.js`, `shared/progress.js`, `shared/cloud.js` y los comprobadores: van en orden, sin paralelizar.
- Cada comprobación nueva lleva `// contract:` con su procedencia y se ve fallar antes del cambio (o mata un mutante, si es solo comprobador).
- Cada commit nombra sus archivos uno a uno; mensaje en catalán, «El progrés no baixa mai: què», con la línea `Co-Authored-By` de la sesión.
- No crear el proyecto de Firebase, no poner ninguna configuración real, no hacer `git push` ni abrir PR sin que Oliver lo pida.
- Una tarea que pase de unas 60 llamadas de herramienta se detiene en su siguiente punto de control y lo dice.
- El script `task-brief` de la skill subagent-driven-development busca «Task N» y no encuentra «Tasca N»: extraer cada brief a mano (las reglas comunes del plan más la sección de la tarea).
- Los implementadores no tienen navegador y la herramienta de Chrome se colgó varias veces en la sesión anterior. Los revisores sí pudieron usar Chrome sin interfaz sobre una copia del árbol (`git archive`), con su propio puerto y caché, nunca sobre `node_modules/.vite` del repositorio.

## HOW TO VERIFY

- **Tarea 1:** `node scripts/check-progress.mjs` contiene las trece filas de `merge` (más la no mutación y la simetría de cada fila) y los valores de `same`; fallaron antes de escribir el código. `npm run check` sin ningún `FAIL`.
- **Tarea 2:** las secciones nuevas (página con datos viejos, guardado sin cambio por debajo, el sonido, `merged` con `at` bueno, viejo y con el almacén que rechaza, `save` después de `merged`, `account`) fallaron antes y pasan; ninguna comprobación anterior cambió de valor esperado.
- **Tarea 3:** en `node scripts/check-cloud.mjs`, los ocho escenarios del plan, empezando por el de la revisión: tras el `push` de A con el sonido cambiado, la nube queda en `{ so: false, secs: [30] }`, y un guardado posterior de A con `secs: [11]` deja `secs: [30]` en A y en la nube. `npm run build` pasa y ningún `dist/*.html` enlaza ni precarga un trozo con el texto `firestore`.
- **Tarea 4:** con un falso que no responde y el reloj sustituido, `syncAll` termina y devuelve `false`, una segunda llamada empieza una ejecución nueva, y un `setDoc` colgado no detiene el envío siguiente.
- **Tarea 5:** con configuración y sin `compte`, `session()`, `push` y `syncAll` no piden ningún módulo de Firebase falso; `signIn()` sí. En una construcción con configuración de prueba hecha en una copia fuera del repositorio, la portada sin `compte` no pide ningún trozo de Firebase.
- **Tarea 6:** `node scripts/check-hub.mjs` pasa contra el código y falla con cada mutante de la lista del plan; tres ediciones que no cambian el comportamiento (renombrar un parámetro de `gate`, poner 500 en una constante, comillas dobles en `gates`) no hacen fallar nada.
- **Al cerrar:** `git log --oneline main..progres-mai-baixa` muestra el commit del plan y al menos uno por tarea; `git status --short` solo muestra `.claude/` y `docs/handoffs/`; `shared/firebase-config.js` sigue exportando `null`; `git diff --stat main..HEAD -- games shared/games.js` está vacío.
- El informe final dice, por tarea, qué se ejecutó y qué se vio, y lista las decisiones que se tomaron donde el plan callaba. Queda declarado como no verificado todo lo que necesita un proyecto real de Firebase.
