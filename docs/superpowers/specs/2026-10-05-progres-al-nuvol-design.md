# El progrés al núvol — disseny

## Objectiu

Que el progrés d'en Xavi i el de la Laia quedin desats en un compte: cadascú té el seu, no es perd en esborrar el navegador i es troba igual en qualsevol dispositiu de casa.

Decidit per l'Oliver: Firebase (Firestore i Auth); el lloc continua sent pàgines HTML amb Vite, publicades a GitHub Pages; a casa de vegades comparteixen dispositiu i de vegades no.

Supòsits: el progrés és per nen i per als sis jocs; els jocs funcionen sense xarxa; els nens no escriuen cap contrasenya; els textos de pantalla són en català i no parlen d'un segon jugador dins d'un joc.

Fora d'aquest canvi: esborrar o canviar el nom d'un perfil, fusionar el progrés camp a camp, limitar qui pot crear un compte, un compte per nen.

> **Esmena (2026-10-05, en escriure el pla):** el progrés antic se'l queda el primer perfil que queda actiu al dispositiu (no el primer que s'hi crea: amb núvol, un perfil pot arribar baixat). Els `-` del principi i del final de l'identificador es treuen. Si al dispositiu s'obre sessió amb un altre compte, tots els documents tornen a quedar pendents i sense `base`. Sense configuració de Firebase, el botó del compte no es mostra.

> **Esmena (2026-10-06, decidida per l'Oliver després de la revisió de tota la branca): el progrés no baixa mai.** Substitueix «guanya l'`at` més gran; si empaten, el núvol» i la frase «Es queda el desat més recent», i treu «fusionar el progrés camp a camp» de la llista de fora d'abast.
>
> - **Per què:** amb «guanya el desat més recent», una tauleta amb xarxa però endarrerida trepitjava el progrés nou: en Xavi arriba al nivell 30 en una, obre el joc a l'altra (que encara és al 10), toca el botó del so, i el nivell 30 desapareix de totes dues.
> - **La regla d'ajuntar dues còpies d'un document** (pura, a `shared/sync.js`, sense taula per joc): els nombres es queden el més gran; els booleans, cert si ho és algun; les llistes s'ajunten posició per posició, amb la llargada de la més llarga; els objectes, clau per clau; el que només té una còpia es conserva. L'única excepció és `so` (el so, una preferència): es queda el de la còpia més nova. `equip` (cursus) és un nombre i segueix la regla dels nombres: un equip triat no torna mai a «cap».
> - **Quan s'ajunta:** quan el dispositiu té canvis per enviar i el núvol ha canviat des de l'últim cop que es va veure (inclòs el document migrat, `at` 0); abans d'enviar un document des d'una pàgina de joc, que ara llegeix primer el del núvol; i en desar des d'una pàgina de joc quan el document del dispositiu ha canviat per sota d'ella (una sincronització o una altra pestanya). Un dispositiu sense canvis per enviar continua baixant el document del núvol tal com és.
> - **Afegit en executar el pla (2026-10-06, acceptat per l'Oliver):** si el núvol té un `at` per sota del que el dispositiu ja havia vist (`base`), el núvol ha anat enrere (una escriptura caducada que arriba tard) i el document s'ajunta en lloc de baixar-se, també sense canvis per enviar. Per això un enviament no escriu mai un `at` igual o per sota del que acaba de llegir al núvol. I quan un document es torna a desar mentre l'enviament anterior és en camí, el que s'ha enviat queda com a `base` (mai una `base` més baixa que la que hi havia), perquè «Esborra el progrés» fet en aquell moment no es desfaci.
> - **Què es perd a canvi:** «Esborra el progrés» de Salts de Granota arriba als altres dispositius si només s'ha jugat en aquell; si un altre dispositiu també ha jugat sense sincronitzar, o la pàgina del joc ja ha rebut una còpia ajuntada, el que s'havia esborrat torna. `fulls` (cursus) es queda el més gran dels dos comptadors, no la suma. Un document amb la forma antiga d'un joc (`coet` a Memòria visual, `stars` a Salts de Granota) que s'ajunta amb un de nou abans que el joc l'hagi desat de nou perd el que deia la forma antiga, com ja passava.
> - **El que això permet treure:** l'espera de la portada abans de deixar entrar a un joc (fins a 4 s).
> - **També, abans d'encendre el núvol:** un dispositiu que no ha tingut mai sessió no carrega Firebase (ni a la portada, fins que l'adult toca el botó, ni en desar des d'un joc); cada petició al núvol té un límit de 15 s, i passat el límit el document es queda pendent; la portada té una comprovació que n'executa el codi.
> - **Acceptat per l'Oliver:** entrar amb un altre compte de Google en un dispositiu copia el progrés del dispositiu al compte nou; i on el navegador nega `localStorage` el lloc no es pot fer servir.

## Perfils

- La portada pregunta «Qui juga?» i mostra els perfils del dispositiu i «Afegeix un jugador». Un perfil és un nom d'1 a 12 caràcters.
- L'identificador del perfil surt del nom: minúscules, sense accents, i tot el que no és lletra o xifra passa a ser `-`. «Xavi» és `xavi` a tot arreu, i dos dispositius que creen el mateix nom parlen del mateix perfil. Un nom que dona un identificador buit o ja existent no s'accepta.
- El perfil actiu es recorda al dispositiu. La portada el mostra, amb un botó «Canvia».
- Sense perfil actiu la portada no mostra els jocs, i una pàgina de joc oberta directament torna a la portada.
- Els perfils funcionen sense compte.

## El que hi ha desat avui

Avui cada joc desa un document sota el seu identificador, sense perfil. Quan es crea el primer perfil d'un dispositiu, aquests documents passen a ser seus i les claus antigues s'esborren. Si el que hi ha en una tauleta és d'en Xavi, cal crear-hi primer en Xavi. El progrés barrejat de dos nens no es pot separar.

## El compte

- A la portada, un botó discret: «Desa el progrés al núvol». L'adult hi entra amb Google, en una finestra emergent, un cop per dispositiu. Amb la sessió oberta el botó diu «Tanca la sessió».
- Sense sessió tot funciona igual, només al dispositiu. Tancar la sessió no esborra res del dispositiu.

## Dades

Al dispositiu (`localStorage`):

| Clau | Què hi ha |
|---|---|
| `perfils` | La llista de perfils: identificador i nom |
| `perfil` | L'identificador del perfil actiu |
| `<perfil>:<joc>` | El document del joc, tal com el desa avui |
| `sync` | Per cada `<perfil>:<joc>`: `at` (quan es va desar, en ms), `base` (l'`at` del núvol vist l'últim cop) i `pending` (si falta enviar-lo) |

A Firestore:

| Document | Què hi ha |
|---|---|
| `users/{uid}/profiles/{perfil}` | `name` |
| `users/{uid}/profiles/{perfil}/games/{joc}` | `data` (el document del joc) i `at` |

Regles (expressió per verificar contra el projecte real):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Sincronització

El dispositiu mana: els jocs llegeixen sempre de `localStorage`, i `load(id)` i `save(id, data)` no canvien de signatura.

- `save` escriu el document, hi posa `at` i `pending`, i l'envia sense esperar resposta. Si no hi ha sessió o falla, es queda pendent.
- La portada es pinta de seguida amb el que hi ha al dispositiu. Si hi ha sessió, després baixa els perfils i els documents del núvol, resol cada document amb la regla de sota, envia els pendents i es torna a pintar.
- Els perfils del núvol que el dispositiu no té s'hi afegeixen; els del dispositiu que el núvol no té s'hi envien.

La regla, per a un document, entre el del dispositiu i el del núvol:

| Dispositiu | Núvol | Què es fa |
|---|---|---|
| N'hi ha | No n'hi ha | S'envia |
| No n'hi ha | N'hi ha | Es baixa |
| Sense pendent | Igual que `base` | Res |
| Sense pendent | Diferent de `base` | Es baixa |
| Pendent | Igual que `base` | S'envia |
| Pendent | Diferent de `base` | Guanya l'`at` més gran; si empaten, el núvol |

Un document que ve de la migració té `at` 0: si el núvol ja en té un per a aquell perfil i joc, guanya el núvol. Per això convé obrir la primera sessió al dispositiu que té el progrés que es vol conservar.

Es pot perdre progrés en un sol cas: el mateix nen juga al mateix joc en dos dispositius sense xarxa. Es queda el desat més recent.

## Fitxers

- `shared/progress.js`: el perfil actiu, el prefix de les claus, la marca de pendent, la migració, i la tornada a la portada quan no hi ha perfil.
- `shared/sync.js` (nou): les regles pures — l'identificador a partir del nom i què es fa amb un document.
- `shared/cloud.js` (nou): Firebase, la sessió, baixar i enviar. Fa servir `firebase/firestore/lite` i es carrega amb `import()` perquè no endarrereixi cap joc.
- `shared/firebase-config.js` (nou): la configuració web del projecte, que és pública.
- `hub/main.js`, `index.html` i l'estil de la portada: «Qui juga?», el perfil actiu i el botó del compte.
- `firestore.rules` (nou).
- `scripts/check-progress.mjs` (nou), afegit a `npm run check`.
- `package.json`: `firebase`, la primera dependència d'execució.
- Els sis jocs no canvien.

## El que fa l'Oliver a la consola de Firebase

Crear el projecte, activar Firestore i l'accés amb Google, afegir el domini de GitHub Pages als dominis autoritzats, publicar les regles i passar la configuració web.

## Comprovació

Automàtica, a `npm run check`:

- l'identificador que surt de cada nom, i els noms que no s'accepten;
- les sis files de la regla, l'empat i el document migrat;
- la migració: les claus antigues passen al primer perfil, s'esborren, i un segon perfil comença buit;
- dos perfils no es trepitgen el mateix joc.

A mà, contra el projecte real:

- entrar, jugar en un navegador i trobar el progrés en un altre amb el mateix perfil;
- jugar sense xarxa, tornar a tenir-ne i veure que el document s'envia;
- un altre compte de Google no pot llegir ni escriure aquestes dades;
- a 360×640, la portada amb «Qui juga?» i amb el perfil actiu.

## Riscos

- La finestra emergent de Google pot quedar bloquejada en algun navegador de tauleta; l'alternativa per redirecció no funciona bé fora del domini de Firebase.
- L'`at` és el rellotge del dispositiu: un rellotge mal posat pot fer guanyar el document equivocat en un conflicte.
- Qualsevol compte de Google pot entrar i escriure sota el seu propi `uid`; no pot tocar les dades d'un altre.
- `firebase` s'afegeix a cada pàgina de joc; ha d'anar en un tros a part que es carrega després del joc.
