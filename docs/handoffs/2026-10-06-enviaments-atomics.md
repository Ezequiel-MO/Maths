# Cerrar la última vía por la que el progreso puede bajar: que cada envío a la nube lea y escriba en una transacción de Firestore, antes de encender la nube

## CONTEXT

Repo `/home/olive/projects/Math` (remoto `Ezequiel-MO/Maths`): juegos de matemáticas en catalán para dos niños (Xavi y Laia), páginas HTML sin framework, Vite multipágina, publicado en GitHub Pages desde `main` (`.github/workflows/pages.yml` corre `npm run build` = `npm run check && vite build`).

Hecho, verificado y publicado (PR #15, `main` en `eff4eef`, despliegue de Pages correcto el 2026-10-06):

- «El progreso nunca baja»: `merge` (en `shared/sync.js`) junta la copia del dispositivo y la de la nube campo por campo. Se aplica en `syncAll`, en cada envío (que lee la nube antes de escribir) y en `save` cuando el documento cambió por debajo de la página.
- Firebase solo se carga donde ha habido sesión (`compte`); cada lectura y escritura de Firestore tiene un límite de 15 s; la portada ya no espera a la nube.
- `scripts/check-hub.mjs` ejecuta el `hub/main.js` real sobre un documento falso. `npm run check` encadena seis comprobadores, todos verdes.
- La nube sigue **apagada**: `shared/firebase-config.js` exporta `null`, y el proyecto de Firebase **no existe todavía**. Nada de la lógica de nube se ha ejecutado nunca contra un Firebase real ni empaquetada: con `null` el bundler deja `cloud.js` en funciones vacías, y los comprobadores corren el código fuente bajo Node contra fakes.

Lo que queda abierto, y es el trabajo de esta sesión (decisión de Oliver del 2026-10-06: cerrarlo, con una transacción, en un plan corto aparte): en `send` de `shared/cloud.js`, el `getDoc` y el `setDoc` no son atómicos. La revisión de la rama lo reprodujo con dos instancias de `cloud.js`, una por tableta:

- A y B sincronizadas en `{so:true, secs:[10]}`@1000. B llega a `[30]` y guarda (`at` 2000). A, atrasada, toca el sonido (`at` 3000). El envío de A lee la nube aún en 1000, y el envío entero de B aterriza antes de la escritura de A. La nube queda `{so:false, secs:[10]}`@3000; B, sin pendientes, hace `pull` y pierde el 30. Final: A, B y la nube en `[10]`, para siempre.
- Variante transitiva: A sincronizada en `{n:8}`@3000; una escritura caducada suya `{n:5}`@2000 aterriza tarde; una tercera tableta baja el 5, juega a 6 y envía con `at` 4000; A hace `pull` y queda en 6.

No hay plan ni código escritos para esto. Las sondas de la revisión estaban en `/tmp` y ya no existen; las secuencias de arriba bastan para rehacerlas.

Sin seguimiento en el árbol de trabajo: `.claude/` y `docs/handoffs/`. No se añaden a ningún commit. `.superpowers/sdd/2026-10-06-progres-mai-baixa/` (ignorado por git) guarda el libro de decisiones (`progress.md`) y los informes por tarea del plan anterior; se puede consultar y borrar al acabar.

## TARGET FILES

- `shared/cloud.js` — 156 líneas. `send(uid, profile, game, force)` (hacia la línea 73) es la cadena única de envíos: `getDoc`, fusión con `merge`/`merged`, `setDoc`, `pushed`. `within(p)` (línea 16) es el límite de 15 000 ms. `boot()` es el único sitio que importa los tres paquetes de Firebase.
- `shared/progress.js` — 182 líneas. `merged(profile, game, data, seenAt, cloudAt)`, `pushed(profile, game, at)` (con la rama que anota lo enviado como `base`, solo hacia arriba), `pulled`, `entries`, `rebase`, `account`, y la memoria por página de `save`.
- `shared/sync.js` — 64 líneas. `settle` (da `'merge'` también cuando la nube tiene un `at` por debajo de `base`), `merge`, `same`.
- `scripts/check-cloud.mjs` — 677 líneas. Escenarios del `cloud.js` real contra fakes; simula dos tabletas (A, B) con una sola instancia de `progress.js` y de `cloud.js`. Las secciones del límite de tiempo van al final y corren dos veces (fake a 1 ms y a 12 ms).
- `scripts/fakes/fake-fs.mjs` — 26 líneas. Firestore falso: `getDocs`, `getDoc`, `setDoc`, con `C.hook(op, path, data)`, `C.log` y `C.delay`. No tiene `runTransaction`.
- `scripts/check-progress.mjs` — 500 líneas. Tablas de `settle`, `merge`, `same` y las secciones de `progress.js`.
- `firestore.rules` — tiene que ser, letra por letra, el bloque de reglas de la spec (lo comprueba `check-cloud.mjs`).
- `docs/superpowers/specs/2026-10-05-progres-al-nuvol-design.md` — la spec; el bloque «Esmena (2026-10-06)» manda, e incluye la línea «Afegit en executar el pla».
- `docs/superpowers/plans/2026-10-05-progres-al-nuvol.md` — su «Tasca 6: el projecte real (cal l'Oliver)» (línea 224) es lo que viene después de este trabajo.

## GOAL

En una rama nueva desde `main` (`eff4eef`), escribir un plan corto y ejecutarlo: que `send` lea el documento de la nube y lo escriba dentro de una transacción (`runTransaction` de `firebase/firestore/lite`, que el paquete instalado exporta), de modo que una escritura de otra tableta entre la lectura y la escritura haga reintentar el envío con la copia nueva en vez de pisarla, y que una escritura caducada que llega tarde ya no pueda aterrizar sobre un documento que cambió. Las dos secuencias de CONTEXT quedan como escenarios de `check-cloud.mjs` que fallan antes y pasan después. Al terminar y pasar la revisión, parar y preguntar a Oliver si se fusiona. Después viene el proyecto real de Firebase, que necesita que él lo cree.

## LOAD-BEARING DETAILS

1. **El sitio está publicado y en uso.** Cada commit deja `npm run check` y `npm run build` verdes con `shared/firebase-config.js` en `null`.
2. **La función de una transacción puede ejecutarse varias veces.** `merged()` es un efecto local dentro de ella: escribe en `localStorage` aunque la transacción falle o se repita. Hoy eso es inocuo (deja el documento fusionado, pendiente, con `base` = el `at` leído), pero cada reintento tiene que releer la entrada (`find()`) y volver a decidir; no reutilizar la `e` de un intento anterior.
3. **`pushed(perfil, joc, at)` solo se llama cuando la transacción se confirmó, con exactamente el `at` escrito**, y nunca desde una respuesta que llegó después del límite de 15 s.
4. **El límite de 15 s envuelve la transacción entera** y pasado el límite la cadena sigue con el siguiente envío. Una confirmación tardía no hace nada en el dispositivo.
5. **Todos los envíos pasan por la cadena única (`chain`)**, forzados o no, y cada uno lee la nube antes de escribir. Un envío nunca escribe un `at` igual o por debajo del que acaba de leer (la condición `!same(m, e.data) || e.at <= r.at` pasa por `merged`).
6. **Si la lectura falla, no se escribe nada y el documento queda pendiente.** Si `merged` devuelve false (se guardó de nuevo mientras tanto), tampoco se escribe.
7. **La regla de `settle` «nube por debajo de `base` → `'merge'`» se queda** aunque la transacción cierre la escritura tardía: es la segunda red, y la tabla `SETTLES` de `check-progress.mjs` la fija.
8. **Un dispositivo sin cambios por enviar sigue haciendo `'pull'` tal cual** cuando la nube va por delante. Es lo que hace llegar «Esborra el progrés» de Salts de Granota a las otras tabletas.
9. **Entre la instantánea de `entries()` y `pulled`/`merged` en `syncAll` no hay ningún `await`.**
10. **Sin `compte` no se carga ningún paquete de Firebase** (`session()`, `push`, `syncAll`); `signIn()` sí, y llama a `rebase(uid)`. Firebase solo con `import()` de `firebase/app`, `firebase/auth` y `firebase/firestore/lite` (lo comprueba `check-cloud.mjs` leyendo los especificadores).
11. **`load(id)` y `save(id, data)` conservan la firma y son síncronos; `games/*` y `shared/games.js` no se tocan.**
12. **Los escenarios existentes de `check-cloud.mjs` usan `C.hook` con `'get'` y `'set'` y leen `C.log`.** El `runTransaction` falso debe registrar y enganchar esas mismas operaciones, para que esos escenarios sigan probando lo mismo. Ningún valor esperado existente cambia; si uno falla, la tarea se detiene y lo dice.
13. **El fake debe modelar el conflicto de verdad:** si el documento cambió entre el `get` y la confirmación, la función se vuelve a ejecutar (el real reintenta hasta 5 veces y luego rechaza). Un fake que nunca entra en conflicto dejaría pasar una implementación sin transacción.
14. **`firestore.rules` sigue igual que el bloque de la spec.** Una transacción solo necesita la lectura y la escritura que el dueño ya tiene sobre `users/{uid}/**`.
15. **Claves de `localStorage`:** `perfils`, `perfil`, `<perfil>:<joc>`, `sync`, `compte`. Ninguna otra. Ninguna exportación nueva.

## CONSTRAINTS

- Previsiblemente solo `shared/cloud.js`, `scripts/check-cloud.mjs` y `scripts/fakes/fake-fs.mjs`. `shared/progress.js` y `shared/sync.js` no deberían cambiar; si el diseño lo pide, se justifica en el plan.
- El plan da reglas, firmas, valores esperados y la comprobación de cada tarea; no pre-escribe el código. Va a `docs/superpowers/plans/`.
- Sin dependencias nuevas, sin refactorizar `shared/`, los juegos ni los otros comprobadores. `hub/*` no se toca.
- Ejecución con subagentes: `implementer` por tarea, sin `model` en la llamada; `spec-reviewer` (es persistencia); `code-reviewer` de la rama al final. Cada defecto que encuentre un revisor se convierte en una comprobación en la misma ronda.
- Cada comprobación nueva lleva `// contract:` con su procedencia y se ve fallar antes del cambio (o mata un mutante, si es solo comprobador).
- Cada commit nombra sus archivos uno a uno; mensaje en catalán; última línea `Co-Authored-By` de la sesión.
- No crear el proyecto de Firebase, no poner ninguna configuración real, no hacer `git push` ni abrir PR sin que Oliver lo pida.
- Los implementadores no tienen navegador. Los revisores pueden usar `/usr/bin/google-chrome` sin interfaz sobre una copia (`git archive`) en un directorio nuevo, con su propio puerto y caché, nunca sobre `node_modules/.vite` del repo.
- Textos de pantalla en catalán y ninguno nuevo; nombres con `textContent`.

## HOW TO VERIFY

- `node scripts/check-cloud.mjs` contiene las dos secuencias de CONTEXT como secciones nuevas (la escritura de B lanzada dentro del hook de A; la escritura caducada que llega tarde con una tercera tableta). Fallaron antes del cambio y después dan `[30]` (y `{n:8}`) en las tabletas y en la nube.
- Mutantes que deben dar FAIL: `send` con `getDoc` + `setDoc` sueltos, sin transacción; `pushed` llamado aunque la transacción rechace; una función de transacción que reutiliza la entrada del primer intento.
- Los mutantes del límite de tiempo siguen muriendo (sin límite en la escritura de `send`; la respuesta tardía que llama a `pushed`).
- `node scripts/check-cloud.mjs` 20 veces seguidas y 20 con carga de CPU (16 `yes > /dev/null`, que luego se matan; `pgrep -x yes` da 0): todas verdes. Este comprobador ya fue intermitente una vez.
- `npm run check` entero y `npm run build` verdes; ningún `dist/*.html` enlaza ni precarga un trozo con `firestore`.
- `git diff --stat main..HEAD -- games shared/games.js hub` vacío; `shared/firebase-config.js` sigue exportando `null`; `git status --short` solo muestra `.claude/` y `docs/handoffs/`.
- Queda declarado como no verificado todo lo que necesita un proyecto real: que `runTransaction` de `firestore/lite` se comporte como el fake (conflicto, reintentos, y qué pasa con una confirmación que llega tras el límite).

## DESPUÉS: el proyecto real de Firebase (necesita a Oliver)

«Tasca 6» del plan `2026-10-05-progres-al-nuvol.md`. A su lista de comprobaciones hay que añadir, de la revisión de la rama anterior (riesgos sin confirmar):

- El primer toque en «Desa el progrés al núvol» en un dispositivo sin `compte` puede acabar en ventana emergente bloqueada (Safari, iOS, móviles): Firebase se carga después del toque. Probarlo en la tableta real con el almacenamiento limpio.
- La restricción de la clave por dominio probablemente tiene que incluir el `authDomain` (`<proyecto>.firebaseapp.com`), además de GitHub Pages y `localhost`.
- Las dos tabletas del caso de la revisión: jugar en una, abrir el juego en la otra directamente, tocar el sonido, y ver que el nivel no baja en ninguna.
- La restauración de la sesión y la carga de los paquetes no tienen límite de 15 s: probar con la red atascada que el botón de la cuenta no se queda desactivado.
- `pushed` no comprueba la cuenta: con dos pestañas y cambio de cuenta a la vez, un envío en vuelo puede dejar una marca como sincronizada bajo la cuenta nueva.
