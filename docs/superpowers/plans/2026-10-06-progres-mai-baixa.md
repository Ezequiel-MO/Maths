# El progrés no baixa mai — pla d'implementació

> **Per a qui l'executi:** cal la sub-skill superpowers:subagent-driven-development (recomanada) o superpowers:executing-plans. Les tasques es fan per ordre; cada pas té una casella (`- [ ]`).

**Objectiu:** que ajuntar la còpia del dispositiu i la del núvol no faci baixar mai el progrés d'un nen, i deixar el codi del núvol a punt per encendre'l (la tasca 6 del pla anterior).

**Arquitectura:** una regla pura nova a `shared/sync.js`, `merge`, ajunta dos documents camp per camp. S'aplica en tres llocs: a `syncAll` quan tots dos costats han canviat, a `push` (que ara llegeix el núvol abans d'escriure) i a `save` quan el document del dispositiu ha canviat per sota de la pàgina. Amb això l'espera de la portada sobra i es treu. A part: Firebase només es carrega on hi ha hagut sessió, les peticions tenen límit de temps, i la portada es comprova executant-ne el codi.

**Tecnologia:** la mateixa (JavaScript sense framework, Vite, scripts de Node). Cap dependència nova.

**Spec:** `docs/superpowers/specs/2026-10-05-progres-al-nuvol-design.md`, amb l'esmena del 2026-10-06 de dalt, que mana sobre la resta del document. Qui executa llegeix les dues coses.

**Punt de partida:** `main` a `18b672e` (PR #14 fusionada i publicada amb la configuració nul·la). Branca `progres-mai-baixa`.

## Regles per a totes les tasques

- Valen totes les regles del pla anterior (`docs/superpowers/plans/2026-10-05-progres-al-nuvol.md`, «Regles per a totes les tasques»): els sis jocs i `shared/games.js` no es toquen; `load(id)` i `save(id, data)` conserven la signatura i són síncrons; `shared/sync.js` no toca res del navegador ni Firebase; `shared/progress.js` s'importa sota Node; cap accés a `localStorage` llança; noms amb `textContent`; textos en català; claus de `localStorage` només `perfils`, `perfil`, `<perfil>:<joc>`, `sync`, `compte`; Firebase només amb `import()` dels tres paquets.
- El pla dona regles, signatures i valors esperats; el codi l'escriu qui executa. El que és **per verificar** no és bo fins que el comprovador ho diu.
- Cap text de pantalla nou en tot el pla.
- Cada comprovació nova porta `// contract:` amb d'on surt (aquest pla, l'esmena de la spec, o la revisió), i s'ha de veure fallar abans del canvi (o matar un mutant, si només és comprovador).
- El lloc ja és publicat: cada commit ha de deixar `npm run check` i `npm run build` verds amb `shared/firebase-config.js` en `null`. No es fa `git push` ni PR sense que l'Oliver ho demani.
- Cada tasca acaba amb un commit dels seus fitxers, anomenats un per un. Missatge en català, «El progrés no baixa mai: què», amb la línia `Co-Authored-By` de la sessió.
- Una tasca que passi d'unes 60 crides d'eina s'atura al proper punt de control i ho diu.
- Revisions (`spec-reviewer`) per risc: tasca 2 (persistència, amb la 1), tasca 3 (persistència), tasques 4 i 5 juntes, tasca 6 (comprovador). `code-reviewer` de tota la branca al final. Cada defecte trobat es converteix en una comprovació a la mateixa ronda.

## Què pot fallar i ningú no demana (i on es comprova)

1. **Una pàgina de joc oberta amb dades velles desa després que la sincronització hagi ajuntat:** el desat no pot fer baixar el document del dispositiu. → `save` (tasca 2) i l'escenari sencer (tasca 3).
2. **Còpies amb formes que no casen** (una llista més curta, un camp que en una és text i a l'altra nombre, un document `null`, la forma antiga amb `coet` o `stars`): `merge` no llança, no inventa valors i conserva les claus de totes dues. → taula de `merge` (tasca 1).
3. **«Esborra el progrés» de Salts de Granota:** si només s'ha jugat en aquell dispositiu, l'esborrat arriba al núvol i als altres. → escenari (tasca 3).
4. **El so:** apagar-lo en una tauleta no el torna a encendre en ajuntar (`so` no és un «cert si ho és algun»). → taula de `merge` (tasca 1).
5. **Una petició que no respon mai:** la portada torna a poder sincronitzar i el botó del compte no es queda desactivat. → tasca 4.
6. **Un dispositiu que no ha tingut mai sessió** (el cas de qualsevol visitant): cap paquet de Firebase, ni a la portada ni en desar. → tasca 5.

## Fitxers

| Fitxer | Què canvia |
|---|---|
| `shared/sync.js` | `merge` i `same` nous (tasca 1); `settle` torna també `'merge'` (tasca 3) |
| `shared/progress.js` | `save` ajunta si el document ha canviat per sota de la pàgina; `merged` i `account` nous |
| `shared/cloud.js` | `push` llegeix abans d'escriure; `syncAll` aplica `'merge'`; límit de temps; no arrenca Firebase sense `compte` |
| `hub/main.js`, `hub/style.css` | fora l'espera del núvol (`lock`, `unlock`, el límit de 4 s) |
| `scripts/check-progress.mjs`, `scripts/check-cloud.mjs`, `scripts/fakes/*` | les comprovacions de cada tasca |
| `scripts/check-hub.mjs` (nou) | la portada executada sobre un document fals; `package.json` l'afegeix a `check` |
| `README.md` | una línia a «afegir un joc»: què pot desar un joc |

---

### Tasca 1: `merge` i `same`

**Fitxers:** modifica `shared/sync.js` i `scripts/check-progress.mjs`.

**Produeix** (exportat de `shared/sync.js`, pur):
- `merge(a, b, aNewer) → document`: ajunta dues còpies; `aNewer` diu si `a` és la més nova. No modifica `a` ni `b`.
- `same(a, b) → boolean`: igualtat de valors JSON, sense dependre de l'ordre de les claus.

**Regles de `merge`** (per valor, recursives):
- Si un dels dos és `null` o `undefined`, l'altre.
- Dos nombres: el més gran. Dos booleans: cert si ho és algun.
- Dues llistes: posició per posició amb aquestes mateixes regles, amb la llargada de la més llarga.
- Dos objectes (no llistes): la unió de les claus, cada una amb aquestes regles; la clau `so` és l'excepció: el valor de la còpia més nova si el té, i si no el de l'altra.
- Tipus diferents (o dos textos): el de la còpia més nova.

**Valors esperats de `merge(a, b, aNewer)`:**

| `a` | `b` | `aNewer` | dona |
|---|---|---|---|
| `{ secs: [3, 0] }` | `{ secs: [1, 5] }` | cert | `{ secs: [3, 5] }` |
| `{ secs: [1, 2] }` | `{ secs: [0, 0, 7] }` | cert | `{ secs: [1, 2, 7] }` |
| `{ so: false, best: 4 }` | `{ so: true, best: 9 }` | cert | `{ so: false, best: 9 }` |
| `{ so: false, best: 4 }` | `{ so: true, best: 9 }` | fals | `{ so: true, best: 9 }` |
| `{ best: 4 }` | `{ so: false, best: 1 }` | cert | `{ so: false, best: 4 }` |
| `{ piscina: false, equip: -1, exams: [true, false, false], notes: [80, 0], fulls: 3 }` | `{ piscina: true, equip: 1, exams: [false, true, false], notes: [40, 100], fulls: 5 }` | cert | `{ piscina: true, equip: 1, exams: [true, true, false], notes: [80, 100], fulls: 5 }` |
| `{ equip: 0 }` | `{ equip: 2 }` | cert | `{ equip: 2 }` |
| `{ best: 2, coet: 9 }` | `{ best: 5, secs: [10, 0, 0, 0, 0] }` | fals | `{ best: 5, coet: 9, secs: [10, 0, 0, 0, 0] }` |
| `{ secs: 'x' }` | `{ secs: [1] }` | cert | `{ secs: 'x' }` |
| `{ secs: 'x' }` | `{ secs: [1] }` | fals | `{ secs: [1] }` |
| `null` | `{ secs: [1] }` | cert | `{ secs: [1] }` |
| `{ secs: [1] }` | `null` | fals | `{ secs: [1] }` |
| `[1, 5]` | `[3, 2]` | cert | `[3, 5]` |

A més, per a cada fila: després de la crida `a` i `b` són iguals que abans, i `merge(b, a, !aNewer)` dona el mateix resultat (`same`).

**Valors esperats de `same`:** cert per a `({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 })`, `([], [])` i `(null, null)`; fals per a `([1, 2], [2, 1])`, `({ a: 1 }, { a: 2 })`, `({ a: 1 }, { a: 1, b: 0 })`, `(null, {})`, `([], {})` i `(0, false)`.

- [ ] Afegeix les taules de `merge` i `same` al comprovador. Executa'l: fallen.
- [ ] Escriu `merge` i `same` a `shared/sync.js` (`settle` no es toca en aquesta tasca). `npm run check` passa sencer.
- [ ] Commit de `shared/sync.js` i `scripts/check-progress.mjs`.

### Tasca 2: `save` que no trepitja, `merged` i `account`

**Fitxers:** modifica `shared/progress.js` i `scripts/check-progress.mjs`.

**Consumeix:** `merge` de `shared/sync.js`.

**Produeix** (exportat de `shared/progress.js`, síncron):
- `save(id, data)`: com ara, i a més: si el document desat ha canviat des que aquesta pàgina el va llegir o desar per última vegada, el que s'escriu és `merge(data, desat, true)`.
- `merged(profile, game, data, seenAt, cloudAt) → boolean`: escriu el document ajuntat d'aquell perfil amb la marca `{ at: max(Date.now(), seenAt + 1, cloudAt + 1), base: cloudAt, pending: true }`, només si la marca encara té `at === seenAt`; torna si ha escrit.
- `account() → string | null`: el valor de `compte`.

**Regles:**
- «Ha canviat»: el mòdul recorda, per clau, l'`at` de la marca que va veure en l'últim `load` o que va posar en l'últim `save` propi. A `save`, si hi ha un document desat i l'`at` de la seva marca no és el recordat, s'ajunta. Si no hi ha document desat, o l'`at` és el recordat, s'escriu `data` tal com ve (així «Esborra el progrés» funciona).
- `merged` escriu la marca abans que el document i la torna enrere si el document no s'ha pogut escriure, com `save`. No toca el que `save` recorda: el proper `save` de la pàgina s'ajuntarà.
- `pulled` tampoc no toca el que `save` recorda.
- Les comprovacions existents de `check-progress.mjs` han de continuar passant sense canviar-ne cap valor esperat; si una falla, s'atura i es diu (no s'adapta la comprovació).

**Comprovació**, a `scripts/check-progress.mjs`:
- Pàgina amb dades velles: `xavi` actiu, `save('joc', { secs: [1, 0] })`, `load('joc')`; llavors `pulled('xavi', 'joc', { secs: [3, 0] }, 50)`; `save('joc', { secs: [1, 1] })` → el document és `{ secs: [3, 1] }`, pendent.
- Sense canvi per sota: `load`, `save({ secs: [5] })`, `save({ secs: [0] })` → `{ secs: [0] }` (l'esborrat local funciona).
- El so: després d'un `pulled` amb `{ so: true, secs: [3] }`, `save('joc', { so: false, secs: [1] })` → `{ so: false, secs: [3] }`.
- `merged('xavi', 'joc', { n: 9 }, at, 200)` amb l'`at` de la marca → cert, document `{ n: 9 }`, marca `{ at > 200, base: 200, pending: true }`; amb un `at` vell → fals i res no canvia; amb el document refusat pel magatzem → fals i la marca d'abans.
- Després de `merged`, un `save({ n: 1 })` de la pàgina dona `{ n: 9 }`.
- `account()` és `null` sense `compte` i `'u1'` després de `rebase('u1')`.

- [ ] Afegeix les seccions i executa: fallen.
- [ ] Escriu el canvi. `node scripts/check-progress.mjs` passa sencer.
- [ ] Commit de `shared/progress.js` i `scripts/check-progress.mjs`.

### Tasca 3: `cloud.js` ajunta

**Fitxers:** modifica `shared/sync.js` (`settle`), `shared/cloud.js`, `scripts/check-progress.mjs` (la taula de `settle`), `scripts/check-cloud.mjs` i `scripts/fakes/*` (el Firestore fals necessita `getDoc`).

**Produeix:** `settle(local, remote) → 'push' | 'pull' | 'merge' | 'none'`.

**Consumeix:** `merge`, `same` de `shared/sync.js`; `merged`, `pulled`, `pushed`, `entries` de `shared/progress.js`.

**Regla de `settle`:** igual que ara, tret d'una fila: pendent i el núvol diferent de `base` → `'merge'` (abans: l'`at` més gran, empat al núvol). Qui crida `merge` passa `aNewer = local.at > remote.at`.

**Files de `settle` que canvien** (les altres deu es queden):

| `local` | `remote` | abans | ara |
|---|---|---|---|
| `{ at: 7, base: 5, pending: true }` | `{ at: 6 }` | `'push'` | `'merge'` |
| `{ at: 7, base: 5, pending: true }` | `{ at: 9 }` | `'pull'` | `'merge'` |
| `{ at: 7, base: 5, pending: true }` | `{ at: 7 }` | `'pull'` | `'merge'` |
| `{ at: 0, base: null, pending: true }` | `{ at: 1 }` | `'pull'` | `'merge'` |

**Regles de `cloud.js`:**
- `syncAll`, quan `settle` diu `'merge'`: `m = merge(local.data, remote.data, local.at > remote.at)`. Si `same(m, remote.data)` → `pulled(perfil, joc, remote.data, remote.at)`. Si no → `merged(perfil, joc, m, local.at, remote.at)` i, si ha escrit, s'envia per la cadena d'enviaments (que rellegeix l'entrada). Tot això sense cap `await` entre la instantània d'`entries()` i `pulled`/`merged`, com ara.
- `push(perfil, joc)`, dins la cadena: llegeix el document del núvol. Si no n'hi ha, o el seu `at` no és un nombre finit, o `at === base` de l'entrada → escriu com ara. Si el núvol ha canviat: `m = merge(entrada.data, remote.data, entrada.at > remote.at)`; si `same(m, entrada.data)` → escriu l'entrada; si no → `merged(perfil, joc, m, entrada.at, remote.at)`, rellegeix l'entrada i escriu-la. `pushed` rep sempre l'`at` que s'ha enviat.
- Si la lectura falla, no s'escriu res i el document es queda pendent.
- Res més no canvia: l'ordre de `syncAll`, `rebase`, el filtre dels perfils, la cadena, que res no llança.

**Comprovació**, a `scripts/check-cloud.mjs` (els escenaris que deien «guanya el més nou» es reescriuen amb aquests valors; cap altre no canvia de valor esperat):
- **El cas de la revisió:** A i B sincronitzats a `{ so: true, secs: [10] }`. B arriba a `{ so: true, secs: [30] }` i envia. A, endarrerit, desa `{ so: false, secs: [10] }` (el so) i fa `push` → el núvol queda `{ so: false, secs: [30] }`, el document d'A també, i després del `syncAll` de B, B té `secs: [30]`.
- **La pàgina vella que continua jugant:** després d'això, A desa `{ so: false, secs: [11] }` (la pàgina encara creu que és a l'11) → el document d'A i el del núvol es queden amb `secs: [30]`.
- **Dos dispositius sense xarxa:** A `{ secs: [5, 0] }`, B `{ secs: [0, 7] }`, tots dos pendents sobre la mateixa base → després de sincronitzar tots dos (A, B, A), tots dos i el núvol tenen `{ secs: [5, 7] }`.
- **Document migrat** (`at` 0) `{ secs: [10, 10, 4] }` contra un del núvol `{ secs: [1, 0, 0] }`: queda `{ secs: [10, 10, 4] }` als dos llocs, en qualsevol ordre d'entrada.
- **L'esborrat de Salts:** A i B sincronitzats a `{ secs: [10, 3] }`; A desa `{ secs: [0, 0] }` i envia → el núvol queda a zeros; B, sense pendents, baixa els zeros.
- **L'esborrat amb l'altre també jugant:** igual, però B ha desat `{ secs: [10, 4] }` sense enviar → B queda amb `{ secs: [10, 4] }` i el núvol també (és el que la spec accepta).
- **La lectura falla** (el fals la refusa): `push` no escriu res i la marca continua pendent.
- **Ajuntar no canvia res:** si `m` és igual al del núvol, no hi ha cap escriptura al núvol i la marca queda `{ at: remote.at, base: remote.at, pending: false }`.

- [ ] Canvia les quatre files de la taula de `settle`, reescriu i afegeix els escenaris; executa: fallen.
- [ ] Escriu el canvi a `settle` i a `cloud.js`, en un sol commit (un sense l'altre deixa `npm run check` vermell). `npm run check` passa sencer i `npm run build` passa; cap `dist/*.html` enllaça ni precarrega un tros amb `firestore`.
- [ ] Commit de `shared/sync.js`, `shared/cloud.js`, `scripts/check-progress.mjs`, `scripts/check-cloud.mjs` i els fitxers de `scripts/fakes/` tocats.

### Tasca 4: límit de temps a les peticions

**Fitxers:** modifica `shared/cloud.js`, `scripts/check-cloud.mjs` i `scripts/fakes/*`.

**Regles:**
- Cada lectura i escriptura de Firestore de `cloud.js` (`getDocs`, `getDoc`, `setDoc`) té un límit de 15 000 ms. Passat el límit es tracta com un error de xarxa: el document es queda pendent, la cadena d'enviaments continua amb el següent, `syncAll` acaba (i `running` es buida).
- L'entrada amb finestra emergent no té límit (l'adult pot trigar).
- Una resposta que arriba després del límit no fa res: ni `pushed` ni `pulled`.

**Comprovació**, a `scripts/check-cloud.mjs`, amb un fals que no respon mai i el rellotge substituït dins la secció (no s'esperen 15 s de veritat):
- `syncAll` amb `getDocs` penjat acaba i torna `false`; una segona crida després comença una execució nova.
- Un `setDoc` penjat no atura l'enviament següent de la cadena; el document penjat continua pendent.
- Una resposta tardana a un `setDoc` que ja ha passat el límit no neteja el pendent.

- [ ] Afegeix els escenaris; executa: fallen (o es pengen: posa un límit al propi comprovador perquè falli i no es quedi esperant).
- [ ] Escriu el canvi. `npm run check` passa.
- [ ] Commit de `shared/cloud.js`, `scripts/check-cloud.mjs` i els fitxers de `scripts/fakes/` tocats.

### Tasca 5: Firebase només on hi ha hagut sessió, i fora l'espera de la portada

**Fitxers:** modifica `shared/cloud.js`, `hub/main.js`, `hub/style.css`, `scripts/check-cloud.mjs`, `scripts/check-progress.mjs`.

**Consumeix:** `account` de `shared/progress.js`.

**Regles:**
- `cloud.js`: si `account()` és `null`, `session()` resol `null` i `push` i `syncAll` no fan res, **sense carregar cap paquet de Firebase**. `signIn()` sí que els carrega (és quan l'adult toca el botó). `compte` l'escriu `rebase` com ara; tancar la sessió no l'esborra.
- `hub/main.js`: fora `lock`, `unlock`, el límit de 4 s i el motiu `cloud` de les llistes. Es queda la regla dels 500 ms (canvi de vista, repintat per sincronització, «Canvia») tal com és, amb l'atribut `inert` i el recurs en CSS.
- A `scripts/check-progress.mjs`, les assercions estàtiques que parlaven de l'espera del núvol es treuen en aquesta tasca; les altres no es toquen (les substitueix la tasca 6).

**Comprovació:**
- `scripts/check-cloud.mjs`: amb configuració i sense `compte`, `session()`, `push` i `syncAll` no demanen cap mòdul de Firebase fals; `signIn()` sí; després d'un `syncAll` amb sessió, `account()` és l'`uid` i un `push` ja envia.
- Construcció amb una configuració de prova (en una còpia fora del repositori): la portada, sense `compte`, no demana cap tros de Firebase; l'informe diu què s'ha vist.
- `npm run check` i `npm run build` passen.

- [ ] Afegeix les comprovacions; executa: fallen.
- [ ] Escriu el canvi.
- [ ] Commit dels cinc fitxers.

### Tasca 6: la portada es comprova executant-la

**Fitxers:** crea `scripts/check-hub.mjs` (i els fitxers de `scripts/fakes/` que li calguin); modifica `scripts/check-progress.mjs` (hi treu les assercions sobre el text de `hub/main.js`), `package.json` (`check` acaba amb `&& node scripts/check-hub.mjs`) i `README.md`.

**Regles:**
- `scripts/check-hub.mjs` carrega el `hub/main.js` real sota Node amb un `document` fals, un `localStorage` fals i un `cloud.js` fals (pel mateix ganxo de resolució de `scripts/fakes/hooks.mjs`), i en mira el comportament, no el text. Cap dependència nova. Si el `document` fals passa d'unes 150 línies, la tasca s'atura i ho diu (llavors l'Oliver tria si s'hi posa una biblioteca).
- `hub/main.js` no es canvia per fer-lo comprovable, tret d'un canvi mínim i justificat a l'informe.
- A `scripts/check-progress.mjs` es queden només les assercions que no depenen de com està escrit `hub/main.js`: `data-hub` a `index.html` i a cap altra pàgina, els cinc textos i `maxlength="12"` a `index.html`, la redirecció de `progress.js`, i els mínims de 44 px i la regla `[inert]` de `hub/style.css`.
- `README.md`: on explica com s'afegeix un joc, una línia: el que desa un joc ha de ser nombres que només creixen, booleans que només passen a cert i llistes d'aquests, sense llistes dins de llistes; `so` és l'única preferència.

**Comprovació** (cada una mata el mutant que s'indica; la llista de mutants va a l'informe):
- Magatzem buit → «Qui juga?» visible, cap targeta. Afegir «Xavi» → set targetes, el nom a dalt, `choose` cridat amb tots els `store` (mutant: `choose` sense `stores`).
- Un nom refusat deixa la casella oberta amb l'error; doble «Fet» crea un sol perfil.
- En passar de «Qui juga?» als jocs la llista de jocs té `inert` i el perd als 500 ms (rellotge fals); un repintat entremig no l'hi treu (mutants: `hold` sense `gate`; el temporitzador cancel·lat per `render`).
- «Canvia» → la llista de perfils té `inert` 500 ms i el focus és a «Afegeix un jugador».
- Sense configuració (`enabled` fals) no hi ha botó del compte (mutant: sense la prova d'`enabled`).
- Amb sessió: el botó diu «Tanca la sessió», el nom del compte hi és com a text; `syncAll` es crida en arrencar (mutant: sense), i després d'afegir un perfil (mutant: sense).
- Entrada fallida → el text d'error; el següent intent l'esborra (mutant: l'error no es mostra).
- El botó es desactiva mentre hi ha feina i es torna a activar en acabar, també si falla (mutants: els dos `busy--`).
- Un `syncAll` que torna cert amb la casella oberta i text escrit: el perfil nou surt a la llista, la casella i el text hi continuen.
- Un nom de perfil i un nom de compte amb `<` es veuen com a text.
- Tres canvis que no canvien el comportament no fan fallar res: reanomenar un paràmetre de `gate`, posar 500 en una constant, cometes dobles a `gates` (es proven en una còpia i es diuen a l'informe).

- [ ] Escriu `scripts/check-hub.mjs` i executa'l contra el codi d'ara: passa. Prova cada mutant: falla.
- [ ] Treu de `check-progress.mjs` les assercions de text, afegeix `check-hub.mjs` a `check`, escriu la línia del `README.md`. `npm run check` i `npm run build` passen.
- [ ] Commit de `scripts/check-hub.mjs`, els fitxers de `scripts/fakes/` nous, `scripts/check-progress.mjs`, `package.json` i `README.md`.
- [ ] Revisió de tota la branca (`code-reviewer`).

---

## Després d'aquest pla

La tasca 6 del pla anterior (el projecte real): l'Oliver crea el projecte de Firebase, restringeix la clau per domini (GitHub Pages i `localhost`) i passa la configuració web. La llista de comprovacions contra el projecte real és la d'aquella tasca, més: les dues tauletes del cas de la revisió (jugar a una, obrir el joc a l'altra directament, tocar el so, i veure que el nivell no baixa enlloc).
