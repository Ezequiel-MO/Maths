# El progrés al núvol — pla d'implementació

> **Per a qui l'executi:** cal la sub-skill superpowers:subagent-driven-development (recomanada) o superpowers:executing-plans. Les tasques es fan per ordre; cada pas té una casella (`- [ ]`).

**Objectiu:** que cada nen tingui el seu progrés als sis jocs, desat al dispositiu i, amb la sessió de l'adult oberta, també a Firestore.

**Arquitectura:** el dispositiu mana. Els jocs continuen cridant `load(id)` i `save(id, data)` de `shared/progress.js`, que ara desa sota `<perfil>:<joc>` i porta, per cada document, quan es va desar i si falta enviar-lo. `shared/sync.js` té les dues regles pures (l'identificador d'un nom i què es fa amb un document). `shared/cloud.js` és l'únic fitxer que coneix Firebase i es carrega amb `import()`.

**Tecnologia:** JavaScript sense framework, Vite multipàgina, scripts de Node per comprovar. Una dependència nova: `firebase` (només `firebase/app`, `firebase/auth` i `firebase/firestore/lite`).

**Spec:** `docs/superpowers/specs/2026-10-05-progres-al-nuvol-design.md`. Qui executa llegeix les dues coses.

## Regles per a totes les tasques

- El pla dona regles, signatures, valors esperats i la comprovació de cada tasca; el codi l'escriu qui executa. Les expressions literals del pla estan marcades **per verificar**: no són bones fins que el comprovador o el projecte real ho diuen.
- Textos de pantalla en català, i cap no parla d'un segon jugador dins d'un joc. Comentaris i identificadors en anglès, amb l'estil dens de `shared/` (punt i coma, cometes simples, comentaris curts que diuen el perquè). Les claus de dades que la spec dona en català es queden en català (`perfils`, `perfil`).
- Els sis jocs (`games/*`) i `shared/games.js` no es toquen. `load(id)` i `save(id, data)` conserven la signatura i continuen sent síncrons.
- `shared/sync.js` no toca `document`, `window`, `localStorage` ni Firebase. `shared/progress.js` s'ha de poder importar sota Node amb un `localStorage` fals: tot el que és del navegador (`location`, `document`, `import('./cloud.js')`) va darrere de `typeof window !== 'undefined'`.
- Cap accés a `localStorage` pot llançar una excepció cap enfora: si falla, la lectura torna el valor buit i l'escriptura no fa res, com avui.
- Un nom de perfil s'escriu a la pàgina amb `textContent`, mai dins d'un `innerHTML`.
- Claus de `localStorage`: `perfils`, `perfil`, `<perfil>:<joc>`, `sync`, `compte`. Cap altra.
- Branca `progres-al-nuvol`. Cada tasca acaba amb un commit dels seus fitxers, anomenats un per un. Missatge en català, «El progrés al núvol: què», amb la línia `Co-Authored-By` de la sessió.
- La branca no es pot publicar entre la tasca 2 i la 3: sense «Qui juga?» no hi ha perfil actiu i no es desa res.
- Una tasca que passi d'unes 60 crides d'eina s'atura al proper punt de control i ho diu.
- Revisions (`spec-reviewer`) per risc: tasca 2 (persistència, amb la 1), tasca 3 (disposició), tasques 4 i 5 juntes (persistència i qui veu què). Cada defecte trobat es converteix en una comprovació a `scripts/check-progress.mjs` a la mateixa ronda.

## Esmenes a la spec que aquest pla concreta

- **Qui es queda el progrés antic:** el primer perfil que queda actiu al dispositiu, no el primer que s'hi crea. Sense núvol és el mateix; amb núvol, els perfils poden arribar baixats i no creats.
- **L'identificador:** els `-` del principi i del final es treuen («Xavi!» és `xavi`).
- **Canvi de compte:** si al dispositiu s'obre sessió amb un compte diferent de l'anterior, tots els documents tornen a quedar pendents i sense `base`, perquè no s'hi barregin marques de l'altre compte.
- **Sense configuració de Firebase** (`firebase-config.js` exporta `null`), el botó del compte no es mostra i res no intenta parlar amb el núvol. Així tot es pot acabar abans que existeixi el projecte.

## Què pot fallar i ningú no demana (i on es comprova)

1. **`localStorage` malmès** (`perfils` que no és una llista, `sync` que és un text, `perfil` que no és a la llista): la portada s'obre amb «Qui juga?» i res no llança. → comprovador (tasca 2).
2. **Desar mentre un enviament és a mig fer:** el document desat de nou continua pendent quan arriba la resposta de l'anterior. → comprovador, `pushed` amb un `at` vell (tasca 2).
3. **`localStorage` que llança** (mode privat, ple): cap excepció; `add` torna `''` i la portada continua mostrant «Qui juga?». → comprovador amb un magatzem que llança (tasca 2).
4. **Un nom amb HTML** (`<b>Xavi`), local o baixat del núvol: es veu com a text. → navegador (tasques 3 i 5), i `profiles()` descarta les entrades sense `id` i `name` de text (tasca 2).
5. **Doble toc** a «Fet» o al botó del compte: un sol perfil, una sola finestra emergent. → navegador (tasques 3 i 5).
6. **Un altre compte de Google al mateix dispositiu:** les dades del dispositiu no hereten les marques del compte anterior. → comprovador, `rebase` (tasca 2), i a mà (tasca 6).

## Fitxers

| Fitxer | Què fa |
|---|---|
| `shared/sync.js` (nou) | `slug(name)` i `settle(local, remote)`, sense res del navegador |
| `shared/progress.js` | Perfils, perfil actiu, prefix de les claus, marques de cada document, adopció del progrés antic |
| `shared/cloud.js` (nou) | Firebase: sessió, enviar un document, sincronitzar-ho tot |
| `shared/firebase-config.js` (nou) | La configuració web, o `null` |
| `hub/main.js`, `hub/style.css`, `index.html` | «Qui juga?», el perfil actiu, el botó del compte |
| `firestore.rules` (nou) | Les regles, per enganxar a la consola |
| `scripts/check-progress.mjs` (nou) | El comprovador; `package.json` l'afegeix a `check` |
| `README.md` | El paràgraf de `progress.js` i els passos de la consola |

---

### Tasca 1: les dues regles pures

**Fitxers:** crea `shared/sync.js` i `scripts/check-progress.mjs`; modifica `package.json` (`check` acaba amb `&& node scripts/check-progress.mjs`).

**Produeix:**
- `slug(name) → string`: l'identificador, o `''` si el nom no val.
- `settle(local, remote) → 'push' | 'pull' | 'none'`, amb `local` = `null` o `{ at, base, pending }` i `remote` = `null` o `{ at }`.

**Regles:**
- `slug`: el que no és text torna `''`. El nom es retalla; si llavors fa menys d'1 o més de 12 caràcters, `''`. Expressió (**per verificar**): `s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')`.
- `settle`: la taula de la spec, fila per fila. Els dos `null` → `'none'`.

**Valors esperats:**

| `slug` de | dona |
|---|---|
| `'Xavi'`, `' Laia '` | `'xavi'`, `'laia'` |
| `'Júlia'`, `'Àlex B'`, `'Xavi!'` | `'julia'`, `'alex-b'`, `'xavi'` |
| `''`, `'   '`, `'!!!'`, `'abcdefghijklm'` (13), `null`, `7` | `''` |
| `'abcdefghijkl'` (12) | `'abcdefghijkl'` |

| `local` | `remote` | `settle` |
|---|---|---|
| `null` | `null` | `'none'` |
| `{ at: 5, base: null, pending: true }` | `null` | `'push'` |
| `{ at: 5, base: 5, pending: false }` | `null` | `'push'` |
| `null` | `{ at: 9 }` | `'pull'` |
| `{ at: 5, base: 5, pending: false }` | `{ at: 5 }` | `'none'` |
| `{ at: 5, base: 5, pending: false }` | `{ at: 9 }` | `'pull'` |
| `{ at: 7, base: 5, pending: true }` | `{ at: 5 }` | `'push'` |
| `{ at: 7, base: 5, pending: true }` | `{ at: 6 }` | `'push'` |
| `{ at: 7, base: 5, pending: true }` | `{ at: 9 }` | `'pull'` |
| `{ at: 7, base: 5, pending: true }` | `{ at: 7 }` (empat) | `'pull'` |
| `{ at: 0, base: null, pending: true }` (migrat) | `{ at: 1 }` | `'pull'` |

- [ ] Escriu `scripts/check-progress.mjs` amb l'estil de `scripts/check-nenufars.mjs` (`check(ok, msg)`, compta errors, surt amb codi 1 si n'hi ha) i les dues taules. Executa'l: ha de fallar perquè `shared/sync.js` no existeix.
- [ ] Escriu `shared/sync.js`. `node scripts/check-progress.mjs` passa.
- [ ] Afegeix-lo a `check` i executa `npm run check`: passa sencer.
- [ ] Commit de `shared/sync.js`, `scripts/check-progress.mjs` i `package.json`.

### Tasca 2: perfils i marques a `progress.js`

**Fitxers:** modifica `shared/progress.js` i `scripts/check-progress.mjs`.

**Consumeix:** `slug` de `shared/sync.js`.

**Produeix** (tot síncron, tot exportat de `shared/progress.js`):
- `load(id)`, `save(id, data)`: com avui, sota `<perfil actiu>:<id>`. Sense perfil actiu, `load` torna `null` i `save` no fa res.
- `profiles() → [{ id, name }]`: la llista neta (només entrades amb `id` i `name` de text; qualsevol altra cosa, fora; si `perfils` no és una llista, `[]`).
- `active() → id | null`: `null` si `perfil` no és a la llista.
- `add(name) → id | ''`: afegeix el perfil; `''` si `slug(name)` és buit, si l'identificador ja hi és o si no s'ha pogut escriure.
- `choose(id, stores = [])`: fa actiu el perfil (`null` el treu). Si en queda un d'actiu, adopta el progrés antic de `stores`.
- `addProfiles(list) → boolean`: afegeix els perfils (del núvol) que falten; diu si n'ha afegit cap.
- `entries() → [{ profile, game, data, at, base, pending }]`: tots els documents amb marca.
- `pulled(profile, game, data, at)`: escriu el document baixat, amb `{ at, base: at, pending: false }`.
- `pushed(profile, game, at)`: només si la marca encara té aquest `at`, la deixa en `{ at, base: at, pending: false }`.
- `rebase(uid) → boolean`: si `compte` és un altre valor, posa totes les marques a `base: null, pending: true`, desa `uid` a `compte` i torna `true`; si és el mateix, no toca res i torna `false`.

**Regles:**
- `save` posa a la marca `at = Math.max(Date.now(), at anterior + 1)`, `pending: true`, i conserva `base`.
- Adopció: per cada `store` amb una clau antiga (el `store` sol, sense `:`): si el perfil no té `<perfil>:<store>`, s'hi copia amb la marca `{ at: 0, base: null, pending: true }`; la clau antiga s'esborra en tots dos casos.
- Al navegador, després de desar, `save` fa `import('./cloud.js').then(m => m.push(perfil, id))` i n'ignora qualsevol error. Sota Node no importa res. (El fitxer `cloud.js` arriba a la tasca 4; fins llavors l'`import` falla i s'ignora.)
- El comentari de capçalera del fitxer es reescriu perquè digui el que el fitxer fa ara.

**Comprovació**, a `scripts/check-progress.mjs`, amb un `localStorage` fals posat a `globalThis` abans d'importar (un `Map` amb `getItem`, `setItem`, `removeItem`), buidat entre seccions:
- Sense perfil: `load('x') === null`, i després de `save('x', { a: 1 })` el magatzem continua buit.
- `add('Xavi') === 'xavi'`; `add('xavi') === ''`; `add('!!!') === ''`; `profiles()` té una entrada `{ id: 'xavi', name: 'Xavi' }`.
- Dos perfils no es trepitgen: amb `xavi` actiu `save('joc', { n: 1 })`; amb `laia` actiu `load('joc') === null` i `save('joc', { n: 2 })`; de tornada a `xavi`, `load('joc').n === 1`.
- Adopció: amb `salts-de-granota` = `{"secs":[3]}` al magatzem i cap perfil, `add('Xavi')` i `choose('xavi', ['salts-de-granota', 'abac-xines'])`: `load('salts-de-granota').secs[0] === 3`, la clau antiga ja no hi és, la marca és `{ at: 0, base: null, pending: true }`, i `add('Laia')` + `choose('laia', …)` dona `load('salts-de-granota') === null`.
- Adopció que no trepitja: si `xavi:abac-xines` ja existeix, es queda com era i la clau antiga `abac-xines` s'esborra.
- Marques: després de `save`, l'entrada té `pending === true` i `at > 0`; dos `save` seguits donen `at` estrictament creixent.
- `pushed` amb l'`at` de l'entrada la deixa sense pendent i amb `base === at`; `pushed` amb un `at` vell (desar, guardar `at`, tornar a desar, `pushed` amb el primer) la deixa pendent.
- `pulled('xavi', 'joc', { n: 9 }, 50)`: `load('joc').n === 9` i la marca és `{ at: 50, base: 50, pending: false }`.
- `rebase('u1')` torna `true` el primer cop i `false` el segon; `rebase('u2')` torna `true` i totes les entrades queden amb `base === null` i `pending === true`, amb el mateix `at`.
- `addProfiles([{ id: 'laia', name: 'Laia' }, { id: 'xavi', name: 'Altre' }, { id: 7 }])` afegeix només `laia` si `xavi` ja hi era, i torna `true`; repetit, torna `false`.
- Magatzem malmès: amb `perfils` = `'{'`, `sync` = `'"x"'` i `perfil` = `'ningu'`: `profiles()` és `[]`, `active() === null`, `entries()` és `[]`, i res no llança.
- Magatzem que llança (`getItem` i `setItem` llancen): `profiles()` és `[]`, `add('Xavi') === ''`, `save` i `load` no llancen.

- [ ] Afegeix les seccions al comprovador i executa'l: fallen.
- [ ] Escriu `shared/progress.js`. `npm run check` passa sencer.
- [ ] Commit de `shared/progress.js` i `scripts/check-progress.mjs`.

### Tasca 3: «Qui juga?» a la portada

**Fitxers:** modifica `index.html`, `hub/main.js`, `hub/style.css` i `shared/progress.js` (la tornada a la portada).

**Consumeix:** `profiles`, `active`, `add`, `choose` de `shared/progress.js`; `GAMES` de `shared/games.js` (els `store` per a l'adopció).

**Regles:**
- `index.html` porta `data-hub` a `<html>`. A `progress.js`, al navegador, si en carregar-se no hi ha perfil actiu i `<html>` no té `data-hub`: `location.replace('index.html')`.
- Sense perfil actiu: la portada mostra «Qui juga?», un botó per perfil amb el seu nom, i «Afegeix un jugador», que obre una casella (màxim 12 caràcters) amb «Fet». La llista de jocs i la frase «Tria un joc…» no es veuen.
- Un nom que no val o que ja existeix deixa la casella oberta amb «Aquest nom no val. Prova'n un altre.»
- Triar o afegir un perfil el fa actiu (amb `choose(id, stores)`, on `stores` són els `store` de `GAMES` sense repetir) i mostra els jocs amb els seus rècords.
- Amb perfil actiu: a dalt, el nom del perfil i un botó «Canvia», que torna a «Qui juga?» (`choose(null)`).
- La funció que pinta les targetes es crida cada cop que canvia el perfil; el seu html no canvia.
- Els botons segueixen l'estil dels de `hub/style.css` i `shared/base.css` (mateixes fonts, colors i radis); cap control fa menys de 44 px d'alt.

**Comprovació**, al navegador amb `npm run dev`, a 360×640 i a 1280×800:
- Amb `localStorage` buit: es veu «Qui juga?» i cap targeta; sense desplaçament horitzontal.
- Afegir «Xavi»: surten les sis targetes i el nom «Xavi» a dalt. Jugar un nivell de qualsevol joc, tornar: la targeta en diu el rècord.
- «Canvia», afegir «Laia»: les targetes surten sense rècords. «Canvia», «Xavi»: el rècord hi torna a ser.
- Afegir `<b>Xavi` (o un altre nom amb `<`): el nom es veu amb els signes, sense negreta.
- Doble toc ràpid a «Fet»: un sol perfil nou.
- Amb `localStorage` buit, obrir `cursus-de-l-estany.html` directament: es torna a la portada.
- Amb progrés antic (posa a mà `abac-xines` = `{"secs":[2,0,0,0,0,0]}` i cap perfil): després d'afegir «Xavi», la targeta de l'àbac diu «2 de 60 nivells».
- `npm run build` passa.

- [ ] Escriu el canvi i fes totes les comprovacions; l'informe diu què s'ha vist a cada una.
- [ ] Commit de `index.html`, `hub/main.js`, `hub/style.css` i `shared/progress.js`.

### Tasca 4: `cloud.js`, sense projecte encara

**Fitxers:** crea `shared/cloud.js`, `shared/firebase-config.js` i `firestore.rules`; modifica `package.json` i `package-lock.json` (`npm install firebase`).

**Consumeix:** `settle` de `shared/sync.js`; `profiles`, `addProfiles`, `entries`, `pulled`, `pushed`, `rebase` de `shared/progress.js`.

**Produeix** (exportat de `shared/cloud.js`):
- `enabled → boolean`: si hi ha configuració.
- `session() → Promise<{ uid, name } | null>`: la sessió, un cop Firebase l'ha recuperada.
- `signIn() → Promise<boolean>`: entra amb Google en finestra emergent; `false` si es tanca o falla.
- `signOut() → Promise<void>`.
- `push(profile, game) → Promise<void>`: envia aquell document si hi ha sessió i està pendent.
- `syncAll() → Promise<boolean>`: sincronitza-ho tot; diu si ha canviat res al dispositiu.

**Regles:**
- `shared/firebase-config.js` exporta per defecte `null`, amb un comentari que diu què hi va (l'objecte de configuració web de la consola) i que és públic.
- Amb configuració `null`: `enabled` és `false`, `session()` resol `null`, `signIn()` resol `false`, `push` i `syncAll` resolen sense fer res (`syncAll` → `false`). No s'inicialitza Firebase.
- Només s'importa de `firebase/app`, `firebase/auth` i `firebase/firestore/lite`.
- Camins: `users/{uid}/profiles/{perfil}` amb `{ name }`; `users/{uid}/profiles/{perfil}/games/{joc}` amb `{ data, at }`.
- `syncAll`, amb sessió: `rebase(uid)`; baixa els perfils i `addProfiles`; envia el document de cada perfil del dispositiu que el núvol no té; per cada perfil baixa els seus `games`; per cada parell perfil i joc que és al dispositiu o al núvol, `settle` i: `'pull'` → `pulled(…)`, `'push'` → escriu `{ data, at }` i després `pushed(perfil, joc, at)`.
- `push`: escriu `{ data, at }` de l'entrada pendent i després `pushed(perfil, joc, at)` amb l'`at` que s'ha enviat.
- Cap funció llança cap enfora: un error de xarxa deixa el document pendent.
- `firestore.rules`: el bloc de la spec, lletra per lletra (**per verificar** a la tasca 6).

**Comprovació:**
- `npm run check` passa (el comprovador no importa `cloud.js`).
- `npm run build` passa, i a `dist/assets` el text `firestore` només surt en fitxers que no són el d'entrada de cap joc ni el de la portada: Firebase va en trossos a part.
- Al navegador, amb la configuració `null`: jugar i desar un nivell no deixa cap error a la consola ni cap petició a Google a la pestanya de xarxa.

- [ ] `npm install firebase`; escriu els tres fitxers.
- [ ] Fes les tres comprovacions; l'informe diu la mida dels trossos de Firebase que ha donat la construcció.
- [ ] Commit de `shared/cloud.js`, `shared/firebase-config.js`, `firestore.rules`, `package.json` i `package-lock.json`.

### Tasca 5: el botó del compte i la sincronització a la portada

**Fitxers:** modifica `index.html`, `hub/main.js` i `hub/style.css`.

**Consumeix:** `enabled`, `session`, `signIn`, `signOut`, `syncAll` de `shared/cloud.js`, carregat amb `import()` després de pintar la portada.

**Regles:**
- La portada es pinta primer amb el que hi ha al dispositiu. Després, si `enabled`, es mostra el botó del compte al peu, i si hi ha sessió es crida `syncAll()`; si torna `true`, es torna a pintar (la llista de perfils o les targetes, segons què es veu).
- Sense sessió el botó diu «Desa el progrés al núvol»; amb sessió, «Tanca la sessió», i al costat el nom del compte amb `textContent`.
- Entrar: `signIn()`; si torna `true`, `syncAll()` i es torna a pintar; si torna `false`, sota el botó: «No s'ha pogut entrar. Torna-ho a provar.»
- Mentre `signIn()` o `syncAll()` són a mig fer, el botó està desactivat.
- Després d'afegir un perfil amb sessió oberta també es crida `syncAll()`.
- Si `enabled` és `false`, el botó no existeix a la pàgina.

**Comprovació**, al navegador:
- Amb la configuració `null`: no hi ha botó, i la portada es comporta com a la tasca 3.
- Amb un `shared/cloud.js` de prova (sense commit) que simula sessió i un `syncAll` que crida `addProfiles([{ id: 'laia', name: '<i>Laia' }])` i torna `true`: a «Qui juga?» surt el perfil nou sense recarregar, amb el nom com a text. Es restaura el fitxer després.
- A 360×640 el botó i el missatge d'error caben sense desplaçament horitzontal.
- `npm run build` passa.

- [ ] Escriu el canvi i fes les comprovacions.
- [ ] Commit de `index.html`, `hub/main.js` i `hub/style.css`.

### Tasca 6: el projecte real (cal l'Oliver)

**Fitxers:** modifica `shared/firebase-config.js` i `README.md`.

**Abans:** l'Oliver crea el projecte a la consola de Firebase, activa Firestore i l'accés amb Google, afegeix el domini de GitHub Pages (i `localhost`) als dominis autoritzats, enganxa `firestore.rules` a les regles i passa la configuració web.

**Regles:**
- `shared/firebase-config.js` exporta l'objecte de configuració tal com el dona la consola.
- `README.md`: el punt de `progress.js` diu que el progrés és per perfil i que es copia a Firestore amb sessió oberta, i una secció curta amb els passos de la consola.

**Comprovació**, a mà, contra el projecte real (l'informe diu què s'ha vist a cada pas):
- Entrar amb Google des de `npm run dev`; a la consola de Firestore surt `users/{uid}/profiles/xavi`.
- Jugar un nivell: surt `…/profiles/xavi/games/<joc>` amb `data` i `at`.
- En un altre navegador (o perfil de navegador) buit: entrar, i a «Qui juga?» surt «Xavi» amb el seu rècord.
- Sense xarxa (DevTools, «Offline»): jugar un nivell; amb xarxa de nou i tornant a la portada, el document del núvol té l'`at` nou.
- Regles: a la consola, al simulador de regles, un `get` de `users/{uid}/profiles/xavi` autenticat amb un altre `uid` és denegat, i sense autenticar també.
- Un segon compte de Google al mateix navegador: no veu els perfils del primer al núvol, i els documents del dispositiu s'envien sota el seu `uid`.
- Després de publicar: entrar des de la pàgina de GitHub Pages en una tauleta (la finestra emergent s'obre i es tanca).

- [ ] Posa la configuració, actualitza el `README.md`, fes les comprovacions.
- [ ] Commit de `shared/firebase-config.js` i `README.md`.
- [ ] Revisió de tota la branca (`code-reviewer`) abans de fusionar.
