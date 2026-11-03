// The short pieces of «La biblioteca de l'estany»: the first circles read these. Every text is written for a child of 4t, in
// Catalan, and every question has four options with the right one first (the game shuffles them). e is a piece of the text that
// says the answer: the game finds the sentence that holds it, to light it up. c are the words that give an inference away.
// Nothing here is drawn by chance: logic.js draws from these lists.

/* ---------- the kinds of text: what «Quin text és?» asks ---------- */
export const TYPES = {
  conte: ['Un conte', '📖'], noticia: ['Una notícia', '📰'], poema: ['Un poema', '📜'], recepta: ['Una recepta', '🍳'],
  instruccions: ['Unes instruccions', '🧩'], carta: ['Una carta', '✉️'], entrevista: ['Una entrevista', '🎤'],
  descripcio: ['Una descripció', '🖼️'], cartell: ['Un cartell', '📢'], endevinalla: ['Una endevinalla', '🤔'], diari: ['Un diari personal', '📔']
};

/* ---------- a child, an age, a town, a pet: the first texts of «La lupa» are made of these ---------- */
// [name with its article, f or m]
export const KIDS = [["la Júlia", 'f'], ["en Marc", 'm'], ["l'Arnau", 'm'], ["la Paula", 'f'], ["en Pol", 'm'], ["l'Aina", 'f'], ["la Martina", 'f'], ["en Biel", 'm'],
  ["la Clàudia", 'f'], ["en Jan", 'm'], ["l'Ona", 'f'], ["en Nil", 'm'], ["la Laia", 'f'], ["en Roc", 'm'], ["la Mar", 'f'], ["en Hugo", 'm']];
export const AGES = ['set', 'vuit', 'nou', 'deu', 'onze'];
export const TOWNS = ['Olot', 'Vic', 'Reus', 'Girona', 'Lleida', 'Tortosa', 'Manresa', 'Figueres', 'Sitges', 'Puigcerdà', 'Banyoles', 'Tàrrega', 'Solsona', 'Valls'];
// [a pet, the pet]
export const PETS = [['un gos', 'el gos'], ['una gata', 'la gata'], ['un conill', 'el conill'], ["un hàmster", "l'hàmster"], ['una tortuga', 'la tortuga'], ['un periquito', 'el periquito']];
export const PETNAMES = ['Bru', 'Mixa', 'Pelut', 'Lluna', 'Floc', 'Tito', 'Coco', 'Nina', 'Rufus', 'Pipa'];
// [day, the days]
export const DAYS = [['dilluns', 'Els dilluns'], ['dimarts', 'Els dimarts'], ['dimecres', 'Els dimecres'], ['dijous', 'Els dijous'], ['divendres', 'Els divendres'], ['dissabte', 'Els dissabtes'], ['diumenge', 'Els diumenges']];
// [where, to do what]
export const PLACES = [['a la piscina', 'nedar'], ["al pati de l'escola", 'jugar a futbol'], ["a l'escola de música", 'tocar el violí'], ['a la biblioteca', 'llegir contes'],
  ['al parc', 'córrer amb el patinet'], ['a casa dels avis', 'fer pastissos'], ['al pavelló', 'jugar a bàsquet'], ["a l'hort", 'regar les tomaqueres']];
// [who goes too, f or m]
export const RELS = [['la seva germana', 'f'], ['el seu germà', 'm'], ['la seva cosina', 'f'], ['el seu cosí', 'm']];

/* ---------- La lupa: short texts that say things plainly ---------- */
export const MICRO = [
  { pic: '🐝', t: "Les abelles viuen en grups molt grans que es diuen eixams. En un eixam hi pot haver més de vint mil abelles. Només una és la reina, i és la que pon els ous. Les altres treballen sense parar: netegen, cuiden les cries i fan mel.",
    qs: [{ k: 'loc', q: "Com es diuen els grups d'abelles?", o: ['Eixams', 'Reines', 'Cries', 'Colles'], e: 'es diuen eixams' },
      { k: 'loc', q: 'Què fa la reina?', o: ['Pon els ous', 'Fa mel', 'Neteja', 'Cuida les cries'], e: 'pon els ous' },
      { k: 'loc', q: 'Quantes abelles hi pot haver en un eixam?', o: ['Més de vint mil', 'Una', 'Vint', 'Menys de mil'], e: 'vint mil' },
      { k: 'tit', q: 'Quin títol és el millor per a aquest text?', o: ['Com viuen les abelles', 'La mel és bona', 'Les vespes piquen', 'Un dia al camp'] }] },
  { pic: '🚲', t: "El dissabte, en Pau i la seva cosina Lia van anar amb bicicleta fins al pantà. Van sortir a les nou del matí i hi van arribar a les deu. Allà van esmorzar entrepans de truita. A la tornada, va començar a ploure i van arribar a casa xops.",
    qs: [{ k: 'loc', q: 'Amb qui va anar en Pau al pantà?', o: ['Amb la seva cosina Lia', 'Amb el seu pare', 'Tot sol', 'Amb la seva germana'], e: 'cosina Lia' },
      { k: 'loc', q: 'A quina hora van arribar al pantà?', o: ['A les deu', 'A les nou', 'A les dotze', 'A les onze'], e: 'hi van arribar a les deu' },
      { k: 'loc', q: 'Què van esmorzar?', o: ['Entrepans de truita', 'Entrepans de pernil', 'Galetes', 'Fruita'], e: 'entrepans de truita' },
      { k: 'inf', q: 'Per què van arribar xops a casa?', o: ['Perquè plovia', "Perquè es van banyar al pantà", 'Perquè suaven molt', "Perquè van caure a l'aigua"], e: 'començar a ploure', c: ['ploure', 'xops'] }] },
  { pic: '🦉', t: "El mussol és un ocell nocturn: dorm de dia i caça de nit. Té uns ulls molt grans que li permeten veure-hi amb poca llum. Pot girar el cap gairebé del tot, cap enrere. S'alimenta de ratolins, insectes i petits ocells.",
    qs: [{ k: 'loc', q: 'Quan caça el mussol?', o: ['De nit', 'De dia', 'Al matí', 'Al migdia'], e: 'caça de nit' },
      { k: 'loc', q: 'Per a què li serveixen els ulls tan grans?', o: ['Per veure-hi amb poca llum', 'Per girar el cap', 'Per dormir de dia', 'Per espantar els ratolins'], e: 'veure-hi amb poca llum' },
      { k: 'voc', q: 'Què vol dir que el mussol és «nocturn»?', o: ['Que fa la seva vida de nit', 'Que és molt petit', 'Que no té plomes', "Que viu a l'aigua"], e: 'ocell nocturn' }] },
  { pic: '🎂', t: "Demà és l'aniversari de l'àvia Rosa i farà setanta anys. La mare ha encarregat un pastís de xocolata a la pastisseria de la plaça. En Martí li ha fet un dibuix de tota la família. La festa serà a casa, a les sis de la tarda.",
    qs: [{ k: 'loc', q: "Quants anys farà l'àvia Rosa?", o: ['Setanta', 'Seixanta', 'Vuitanta', 'Sis'], e: 'farà setanta anys' },
      { k: 'loc', q: 'On serà la festa?', o: ['A casa', 'A la pastisseria', 'A la plaça', "A l'escola"], e: 'La festa serà a casa' },
      { k: 'loc', q: "Què ha fet en Martí per a l'àvia?", o: ['Un dibuix de la família', 'Un pastís de xocolata', 'Una carta', 'Un collaret'], e: 'un dibuix' }] },
  { pic: '🐙', t: "El pop té vuit braços plens de ventoses. Quan té por, deixa anar un núvol de tinta negra i s'escapa. També pot canviar de color per amagar-se entre les roques. És un animal molt intel·ligent: alguns pops saben obrir pots de vidre!",
    qs: [{ k: 'loc', q: 'Quants braços té el pop?', o: ['Vuit', 'Sis', 'Deu', 'Quatre'], e: 'vuit braços' },
      { k: 'loc', q: 'Què fa el pop quan té por?', o: ["Deixa anar tinta i s'escapa", 'Obre pots de vidre', 'Es queda quiet', 'Ataca amb les ventoses'], e: 'Quan té por' },
      { k: 'loc', q: 'Per què el pop canvia de color?', o: ['Per amagar-se', 'Perquè té fred', "Perquè s'enfada", 'Per menjar millor'], e: 'per amagar-se' }] },
  { pic: '📚', t: "La biblioteca del barri obre de dilluns a divendres, de quatre a vuit del vespre. Els dissabtes només obre al matí. Per endur-te llibres a casa necessites el carnet de la biblioteca, que és gratuït. Pots tenir els llibres tres setmanes.",
    qs: [{ k: 'loc', q: 'Quan obre la biblioteca els dissabtes?', o: ['Només al matí', 'De quatre a vuit', 'Tot el dia', 'No obre'], e: 'Els dissabtes' },
      { k: 'loc', q: 'Quant de temps pots tenir els llibres?', o: ['Tres setmanes', 'Quatre dies', 'Vuit dies', 'Un mes'], e: 'tres setmanes' },
      { k: 'loc', q: 'Què necessites per endur-te llibres a casa?', o: ['El carnet de la biblioteca', 'Diners', 'Una motxilla', "Un permís de l'escola"], e: 'necessites el carnet' }] },
  { pic: '🐢', t: "A la Carla li han regalat una tortuga. Li ha posat de nom Pastanaga, perquè és el que més li agrada menjar. La Pastanaga viu en un terrari al menjador. A l'hivern gairebé no menja i dorm molt.",
    qs: [{ k: 'loc', q: 'Com es diu la tortuga?', o: ['Pastanaga', 'Carla', 'Enciam', 'Terrari'], e: 'Pastanaga, perquè' },
      { k: 'loc', q: 'On viu la tortuga?', o: ['En un terrari al menjador', 'Al jardí', 'A la cuina', 'En una bassa'], e: 'terrari' },
      { k: 'loc', q: 'Per què li va posar aquest nom?', o: ['Perquè és el seu menjar preferit', 'Perquè és taronja', 'Perquè és molt lenta', 'Perquè ho va triar la tortuga'], e: 'Pastanaga, perquè' }] },
  { pic: '🌋', t: "A la Garrotxa hi ha més de quaranta volcans. Fa milers d'anys que no fan erupció i ara estan coberts de boscos. El més conegut és el Croscat, i es pot visitar caminant. Al seu costat hi ha la Fageda d'en Jordà, un bosc de faigs molt famós.",
    qs: [{ k: 'loc', q: 'Quants volcans hi ha a la Garrotxa?', o: ['Més de quaranta', 'Quatre', 'Més de quatre-cents', 'Un'], e: 'quaranta volcans' },
      { k: 'loc', q: 'Com es diu el volcà més conegut?', o: ['El Croscat', "La Fageda d'en Jordà", 'La Garrotxa', 'El Montseny'], e: 'Croscat' },
      { k: 'tit', q: 'De què parla el text?', o: ['Dels volcans de la Garrotxa', 'De com es fa una erupció', 'Dels boscos de faigs', "D'una excursió amb l'escola"] }] },
  { pic: '⚽', t: "L'equip d'en Joel ha guanyat el partit per tres gols a dos. En Joel no ha marcat cap gol, però ha fet la passada de l'últim. L'entrenadora ha dit que ha estat el millor partit de la temporada. Diumenge vinent jugaran la final.",
    qs: [{ k: 'loc', q: 'Com ha acabat el partit?', o: ['Tres a dos', 'Dos a tres', 'Dos a dos', 'Tres a zero'], e: 'tres gols a dos' },
      { k: 'loc', q: 'Quants gols ha marcat en Joel?', o: ['Cap', 'Un', 'Dos', 'Tres'], e: 'no ha marcat cap gol' },
      { k: 'loc', q: 'Quan jugaran la final?', o: ['Diumenge vinent', 'Avui', 'Dissabte', "L'any que ve"], e: 'Diumenge vinent' }] },
  { pic: '🍎', t: "Al mercat, la Núria ha comprat un quilo de pomes, mig quilo de cireres i una síndria. Ha pagat amb un bitllet de vint euros i li han tornat sis euros. Les cireres eren per fer un pastís.",
    qs: [{ k: 'loc', q: 'Què ha comprat la Núria?', o: ['Pomes, cireres i una síndria', 'Pomes, peres i un meló', 'Cireres i un pastís', 'Només pomes'], e: 'ha comprat un quilo' },
      { k: 'loc', q: 'Quants diners li han tornat?', o: ['Sis euros', 'Vint euros', 'Catorze euros', 'Un euro'], e: 'tornat sis euros' },
      { k: 'loc', q: 'Per a què eren les cireres?', o: ['Per fer un pastís', "Per menjar-les a l'escola", 'Per a la seva àvia', 'Per fer suc'], e: 'per fer un pastís' },
      { k: 'inf', q: 'Quant li ha costat la compra?', o: ['Catorze euros', 'Sis euros', 'Vint euros', 'Vint-i-sis euros'], e: 'tornat sis euros' }] },
  { pic: '🌕', t: "Aquesta nit hi ha lluna plena. En Lluc i el seu pare han pujat al terrat amb uns prismàtics. Des d'allà han vist taques fosques a la lluna: són planes enormes que es diuen mars, tot i que no tenen aigua.",
    qs: [{ k: 'loc', q: 'On han pujat en Lluc i el seu pare?', o: ['Al terrat', 'A la muntanya', 'A la lluna', 'Al campanar'], e: 'terrat' },
      { k: 'loc', q: 'Què han fet servir per mirar la lluna?', o: ['Uns prismàtics', 'Un telescopi', 'Unes ulleres', 'Una lupa'], e: 'prismàtics' },
      { k: 'voc', q: 'Al text, què són els «mars» de la lluna?', o: ['Planes enormes sense aigua', "Mars plens d'aigua", 'Muntanyes molt altes', 'Núvols foscos'], e: 'es diuen mars' }] },
  { pic: '🧦', t: "Per fer un titella de mitjó, primer agafa un mitjó vell que no facis servir. Després, enganxa-hi dos botons per fer els ulls. Amb un tros de roba vermella, fes-li la llengua. Finalment, posa-hi la mà a dins i fes-lo parlar!",
    qs: [{ k: 'loc', q: 'Què fas servir per fer els ulls?', o: ['Dos botons', 'Un mitjó', 'Roba vermella', 'Dues boles de paper'], e: 'dos botons' },
      { k: 'loc', q: 'Què és el primer que has de fer?', o: ['Agafar un mitjó vell', 'Enganxar els botons', 'Fer la llengua', 'Posar-hi la mà'], e: 'primer agafa' },
      { k: 'tip', q: 'Quin tipus de text és?', o: ['Unes instruccions', 'Un conte', 'Una notícia', 'Un poema'] }] },
  { pic: '🏔️', t: "El Pica d'Estats és la muntanya més alta de Catalunya: fa 3.143 metres. Es troba al Pirineu, a la frontera amb França. Per pujar-hi cal caminar moltes hores i portar roba d'abric, perquè a dalt fa fred fins i tot a l'estiu.",
    qs: [{ k: 'loc', q: "Quant fa d'alt el Pica d'Estats?", o: ['3.143 metres', '3.413 metres', '1.343 metres', '314 metres'], e: '3.143' },
      { k: 'loc', q: 'On es troba?', o: ['Al Pirineu', 'Al costat del mar', 'A Montserrat', 'Al Montseny'], e: 'Es troba al Pirineu' },
      { k: 'loc', q: "Per què cal portar roba d'abric?", o: ['Perquè a dalt fa fred', 'Perquè plou molt', 'Perquè és a França', 'Perquè es camina de nit'], e: 'fa fred' }] },
  { pic: '🐕', t: "Ahir, en Bruc, el gos dels veïns, es va escapar per un forat de la tanca. Tot el carrer el va buscar durant la tarda. Al final, la Marina el va trobar dormint dins la caseta del nostre jardí. Ara la tanca ja està arreglada.",
    qs: [{ k: 'loc', q: 'Com es va escapar en Bruc?', o: ['Per un forat de la tanca', 'Per la porta', 'Saltant la paret', 'Per la finestra'], e: 'forat de la tanca' },
      { k: 'loc', q: 'Qui el va trobar?', o: ['La Marina', 'Els veïns', 'En Bruc', 'Tot el carrer'], e: 'la Marina el va trobar' },
      { k: 'loc', q: 'On el van trobar?', o: ['Dins la caseta del nostre jardí', 'Al carrer', 'A casa dels veïns', 'Al parc'], e: 'dins la caseta' }] },
  { pic: '🍅', t: "Per fer pa amb tomàquet necessites pa, tomàquets madurs, oli d'oliva i sal. Primer, talla el pa a llesques i, si vols, torra-les. Després, frega-hi mig tomàquet. Al final, posa-hi un raig d'oli i una mica de sal.",
    qs: [{ k: 'loc', q: 'Quins ingredients necessites?', o: ['Pa, tomàquet, oli i sal', 'Pa, tomàquet i formatge', 'Pa, oli i sucre', 'Tomàquet, ceba i sal'], e: 'necessites pa' },
      { k: 'loc', q: 'Què fas amb el tomàquet?', o: ['El freges sobre el pa', 'El talles a llesques', 'El torres', "El poses a l'oli"], e: 'frega-hi' },
      { k: 'tip', q: 'Quin tipus de text és?', o: ['Una recepta', 'Un conte', 'Una carta', 'Una notícia'] }] },
  { pic: '🎻', t: "L'Ona toca el violoncel des que tenia sis anys. Ara en té deu i assaja cada dia mitja hora. Dimecres farà el seu primer concert al teatre del poble. Està una mica nerviosa, però també molt contenta.",
    qs: [{ k: 'loc', q: "Quants anys té ara l'Ona?", o: ['Deu', 'Sis', 'Quatre', 'Dotze'], e: 'Ara en té deu' },
      { k: 'loc', q: 'Quin instrument toca?', o: ['El violoncel', 'El violí', 'El piano', 'La guitarra'], e: 'violoncel' },
      { k: 'loc', q: 'On farà el concert?', o: ['Al teatre del poble', "A l'escola", 'A casa', "A l'església"], e: 'teatre del poble' },
      { k: 'inf', q: "Quants anys fa que l'Ona toca el violoncel?", o: ['Quatre', 'Sis', 'Deu', 'Setze'], e: 'Ara en té deu' }] },
  { pic: '🦩', t: "Els flamencs són ocells de potes llargues i coll molt prim. Són de color rosa per culpa del que mengen: unes gambetes petites que viuen a l'aigua salada. Quan dormen, sovint s'aguanten només sobre una pota.",
    qs: [{ k: 'loc', q: 'Per què els flamencs són de color rosa?', o: ['Pel que mengen', 'Perquè dormen sobre una pota', 'Perquè viuen al sol', 'Perquè neixen així'], e: 'per culpa del que mengen' },
      { k: 'loc', q: 'Com dormen sovint?', o: ['Sobre una pota', 'Estirats a terra', "Penjats d'un arbre", 'Nedant'], e: 'sobre una pota' }] },
  { pic: '🚒', t: "Els bombers de Manresa han apagat un foc en una fàbrica abandonada. L'avís va arribar a les tres de la matinada i hi van anar sis camions. No hi ha hagut ferits. Els bombers creuen que el foc va començar per una espurna d'una màquina vella.",
    qs: [{ k: 'loc', q: 'Quants camions de bombers hi van anar?', o: ['Sis', 'Tres', 'Dos', 'Deu'], e: 'sis camions' },
      { k: 'loc', q: 'Hi ha hagut ferits?', o: ['No, cap', 'Sí, tres', 'Sí, sis', 'No se sap'], e: 'No hi ha hagut ferits' },
      { k: 'tip', q: 'Quin tipus de text és?', o: ['Una notícia', 'Un conte', 'Una recepta', 'Un poema'] }] },
  { pic: '🐸', t: "Les granotes neixen d'uns ous petits que floten a l'aigua. Primer són capgrossos: tenen cua i respiren amb brànquies, com els peixos. A poc a poc els surten les potes i la cua desapareix. Llavors ja poden sortir de l'aigua i saltar.",
    qs: [{ k: 'loc', q: 'Com es diuen les granotes quan són petites?', o: ['Capgrossos', 'Peixos', 'Brànquies', 'Ous'], e: 'són capgrossos' },
      { k: 'loc', q: 'Què passa amb la cua?', o: ['Desapareix', 'Creix', 'Es torna una pota', 'Es fa més llarga'], e: 'la cua desapareix' }] },
  { pic: '🎒', t: "La sortida de colònies serà del 12 al 14 de maig, a la casa de colònies de Can Pujol. Cal portar sac de dormir, llanterna i una gorra. No es poden portar mòbils ni llaminadures. Sortirem de l'escola a les nou en punt.",
    qs: [{ k: 'inf', q: 'Quants dies duraran les colònies?', o: ['Tres dies', 'Dos dies', 'Catorze dies', 'Dotze dies'], e: 'del 12 al 14' },
      { k: 'loc', q: 'Què no es pot portar?', o: ['Mòbils i llaminadures', 'Sac de dormir', 'Una llanterna', 'Una gorra'], e: 'No es poden portar' },
      { k: 'loc', q: 'A quina hora sortiran?', o: ['A les nou', 'A les dotze', 'A les catorze', 'A les deu'], e: 'nou en punt' }] }
];

// a good title for each text of MICRO, in its order: «Quin títol li va millor?» offers it among the titles of the others
export const MICRO_TITLES = ["La vida a l'eixam", 'Excursió en bicicleta', 'Un caçador de nit', "L'aniversari de l'àvia", 'Un animal amb vuit braços', 'Horari de la biblioteca',
  'La tortuga Pastanaga', 'Els volcans de la Garrotxa', 'Un partit emocionant', 'Compres al mercat', 'Mirant la lluna', 'Un titella de mitjó', 'El sostre de Catalunya',
  'El gos que es va escapar', 'Pa amb tomàquet', 'El primer concert', 'Ocells de color rosa', 'Foc en una fàbrica', 'De capgròs a granota', 'Ens anem de colònies!'];

/* ---------- Paraules amagades ---------- */
// a word that could take the place of the marked one (*...*) in its sentence
export const SYN = [
  { s: "L'àvia viu en una casa *antiga* al costat de l'església.", o: ['vella', 'nova', 'petita', 'blava'] },
  { s: 'Després del partit, tothom estava *cansat*.', o: ['esgotat', 'content', 'enfadat', 'nerviós'] },
  { s: 'En Jan és un nen molt *alegre*: sempre riu.', o: ['content', 'trist', 'alt', 'seriós'] },
  { s: 'La platja estava *plena* de gent.', o: ['atapeïda', 'buida', 'neta', 'lluny'] },
  { s: 'El castell del conte era *enorme*.', o: ['gegant', 'diminut', 'bonic', 'fosc'] },
  { s: 'Aquest exercici és molt *fàcil*.', o: ['senzill', 'difícil', 'llarg', 'avorrit'] },
  { s: 'Cada nit, la mare ens *explica* un conte.', o: ['conta', 'escriu', 'dibuixa', 'amaga'] },
  { s: 'El nen estava *espantat* per la tempesta.', o: ['atemorit', 'tranquil', 'mullat', 'content'] },
  { s: 'Els avis tenen un jardí molt *bonic*.', o: ['preciós', 'lleig', 'petit', 'sec'] },
  { s: 'Aquell dia, en Pol estava *trist* perquè havia perdut el gos.', o: ['apenat', 'feliç', 'cansat', 'adormit'] },
  { s: 'Després de la tempesta, el riu baixava *brut*.', o: ['tèrbol', 'net', 'calent', 'buit'] },
  { s: 'La Laia va *acabar* els deures abans de sopar.', o: ['enllestir', 'començar', 'oblidar', 'perdre'] },
  { s: 'Quin *soroll* que fa aquesta màquina!', o: ['brogit', 'silenci', 'fum', 'calor'] },
  { s: 'En Biel és molt *valent*: no té por de res.', o: ['agosarat', 'poruc', 'gandul', 'alt'] },
  { s: 'La sopa era tan *calenta* que cremava.', o: ['ardent', 'freda', 'salada', 'espessa'] },
  { s: 'Vam *pujar* fins dalt del campanar.', o: ['enfilar-nos', 'baixar', 'dormir', 'cantar'] }
];
// what a word means in its sentence: the same word can mean other things in other sentences
export const DEF = [
  { s: 'En Joan es va asseure al *banc* de la plaça a llegir.', o: ['Un seient llarg per a diverses persones', 'Un lloc on es guarden diners', 'Un grup de peixos', 'Una taula de fuster'] },
  { s: 'Des de la barca vam veure un *banc* de peixos platejats.', o: ['Un grup gran de peixos que neden junts', 'Un seient', 'Un lloc on es guarden diners', 'Un vaixell'] },
  { s: 'Per canviar la roda, el pare va posar el *gat* sota el cotxe.', o: ['Una eina per aixecar el cotxe', 'Un animal', 'Un seient', 'Un llum'] },
  { s: 'El *cap* de la colla va donar les ordres.', o: ['La persona que mana', 'La part de dalt del cos', 'El final', 'Un barret'] },
  { s: 'Al *cap* del carrer hi ha una font.', o: ['Al final', 'A la persona que mana', 'A la part de dalt del cos', 'Al mig'] },
  { s: 'El *ratolí* de l\'ordinador no funciona.', o: ['L\'aparell per moure la fletxa a la pantalla', 'Un animal petit', 'Un joc', 'Un cable'] },
  { s: 'La mare va tancar la *clau* de l\'aigua.', o: ["L'aixeta que obre i tanca l'aigua", 'La peça per obrir portes', "La solució d'un problema", 'Un signe de música'] },
  { s: 'La *clau* per guanyar és entrenar cada dia.', o: ['El secret, el que és més important', 'La peça per obrir portes', 'Una aixeta', 'Un premi'] },
  { s: 'La gossa ha tingut tres *cadells*.', o: ['Fills petits', 'Joguines', 'Coixins', 'Ossos'] },
  { s: 'Per arribar a França vam passar per un *port* de muntanya.', o: ['Un pas entre muntanyes', 'El lloc on hi ha vaixells', 'Una porta', 'Un riu'] },
  { s: 'La Paula ha *perdut* el tren per un minut.', o: ["No ha arribat a temps d'agafar-lo", 'No troba el tren', 'Ha trencat el tren', 'Ha guanyat'] },
  { s: 'Aquesta *pila* de llibres caurà!', o: ["Un munt de coses una sobre l'altra", 'Una bateria', 'Una font', 'Un prestatge'] },
  { s: 'El rellotge no funciona perquè no té *pila*.', o: ['Una bateria', 'Un munt de coses', 'Una agulla', 'Una corda'] },
  { s: 'Després de la pluja, la *molla* del pa s\'havia tornat tova.', o: ['La part de dins del pa', 'La crosta', 'Una mica de farina', 'Un tros de formatge'] },
  { s: 'En Marc té *mà* per a les plantes: tot li creix.', o: ['Hi té traça', 'Té les mans grans', 'Les toca molt', 'No li agraden'] }
];
// sayings: what they mean is not what their words say
export const EXP = [
  { s: 'Quan en Pol va explicar l\'acudit, ens vam *fer un fart de riure*.', o: ['Vam riure moltíssim', 'Vam menjar molt', 'Ens vam enfadar', 'Vam plorar'] },
  { s: 'Avui *plou a bots i barrals*: no sortirem.', o: ['Plou moltíssim', 'Plou una mica', 'Cauen bótes del cel', 'Fa sol'] },
  { s: 'La mare *va de bòlit*: té moltíssima feina.', o: ['Va molt atrafegada', 'Va amb bicicleta', 'Està molt tranquil·la', 'Juga a bitlles'] },
  { s: 'En Jan *està a la lluna* i no ha sentit la pregunta.', o: ['Està distret', 'És astronauta', 'Està molt content', 'Està a dalt d\'un arbre'] },
  { s: 'Quan va veure el pastís, *se li va fer la boca aigua*.', o: ['Va tenir moltes ganes de menjar-ne', 'Va beure aigua', 'Va plorar', 'Li feia mal la boca'] },
  { s: '*Posem fil a l\'agulla*: hem d\'acabar el mural avui.', o: ['Comencem a treballar', 'Cosim la roba', 'Descansem una mica', 'Ho deixem per demà'] },
  { s: 'Quan la mestra li va preguntar, la Marta *es va quedar en blanc*.', o: ['No es recordava de res', 'Es va pintar de blanc', 'Es va adormir', 'Va respondre molt bé'] },
  { s: 'Aquest problema *és bufar i fer ampolles*.', o: ['És molt fàcil', 'És molt difícil', 'Cal bufar fort', 'Cal fer ampolles de vidre'] },
  { s: 'Després de l\'excursió, en Marc *dormia com un tronc*.', o: ['Dormia profundament', 'Dormia en un bosc', 'No podia dormir', 'Dormia dret'] },
  { s: 'Quan va saber que no hi havia pati, *va posar el crit al cel*.', o: ['Es va queixar molt fort', 'Va cridar al cel per jugar', 'Es va posar molt content', 'Va mirar els estels'] },
  { s: 'Aquesta motxilla *costa un ull de la cara*.', o: ['És molt cara', 'És molt barata', 'Fa mal als ulls', 'És molt bonica'] },
  { s: 'La Núria *té la mosca al nas*: no li diguis res ara.', o: ['Està enfadada', 'Té una mosca', 'Està malalta', 'Està contenta'] },
  { s: '*Sembla que la natura fa màgia*: de les fulles seques en surt terra nova.', o: ['Passa una cosa sorprenent, com si fos màgia', 'La natura fa trucs de màgia', 'Hi ha un mag al bosc', 'És mentida'] },
  { s: 'En sentir el soroll, a la Laia *se li va glaçar la sang*.', o: ['Es va espantar moltíssim', 'Va tenir fred', 'Es va fer mal', 'Es va alegrar'] },
  { s: 'En Pere sempre *fa el ronso* quan toca recollir l\'habitació.', o: ['Fa les coses a poc a poc i de mala gana', 'Corre molt', 'Canta una cançó', 'Ho fa molt bé'] },
  { s: 'L\'Ivet *té bona estrella*: sempre li toca el premi.', o: ['Té molta sort', 'Té una estrella a casa', 'Mira molt el cel', 'Dibuixa estrelles'] }
];

/* ---------- Primer, després: the events of a short story, in the order they happen ---------- */
// hard: the text does not tell them in that order
export const ORD = [
  { pic: '🌱', t: "En Nil va posar unes llavors de mongeta en un got amb cotó moll. Cada dia les regava una mica. Al cap d'una setmana va sortir una arrel blanca. Més endavant, van aparèixer dues fulles verdes.",
    ev: ['Posa llavors en un got amb cotó.', 'Les rega cada dia.', 'Surt una arrel blanca.', 'Apareixen dues fulles.'] },
  { pic: '🍳', t: "La Mar volia fer una truita. Primer va batre dos ous en un bol. Després va escalfar una mica d'oli a la paella. Hi va tirar els ous i, quan la truita va ser feta, la va servir en un plat.",
    ev: ['Bat els ous.', "Escalfa l'oli.", 'Tira els ous a la paella.', 'Serveix la truita.'] },
  { pic: '🦷', t: "Ahir a la nit, a en Hug li va caure una dent. La va posar sota el coixí i es va adormir. Al matí, en lloc de la dent hi havia una moneda. En Hug va córrer a ensenyar-la a la seva germana.",
    ev: ['Li cau una dent.', 'La posa sota el coixí.', 'Troba una moneda.', 'Ensenya la moneda a la germana.'] },
  { pic: '🚌', hard: true, t: "Abans d'arribar al museu, l'autobús de l'escola es va aturar per posar benzina. Havien sortit d'hora, a les vuit. Quan van entrar al museu, el guia els va ensenyar uns ossos de dinosaure. A la tornada, tothom dormia a l'autobús.",
    ev: ["Surten de l'escola a les vuit.", "L'autobús s'atura a posar benzina.", 'Veuen ossos de dinosaure.', 'Dormen a la tornada.'] },
  { pic: '🐣', t: "La gallina va pondre un ou i el va covar durant tres setmanes. Un matí, l'ou es va començar a esquerdar. Primer va sortir un bec petit i, després, tot el pollet. Al cap d'una estona, el pollet ja caminava darrere la seva mare.",
    ev: ["La gallina cova l'ou.", "L'ou s'esquerda.", 'Surt el pollet.', 'El pollet camina darrere la mare.'] },
  { pic: '🎈', hard: true, t: "En Roc va plorar quan el globus se li va escapar de les mans. Una hora abans, el seu avi l'hi havia comprat a la fira. El globus va volar per sobre les cases fins que ja no es veia. Llavors l'avi li va prometre que en compraria un altre.",
    ev: ["L'avi li compra un globus.", 'El globus se li escapa.', 'El globus vola fins que no es veu.', "L'avi li promet un altre globus."] },
  { pic: '⛄', t: "Va nevar tota la nit. Al matí, la Lia i en Pol van sortir a fer un ninot de neu. Li van posar una pastanaga per nas i una bufanda vermella. A la tarda va sortir el sol i el ninot es va començar a desfer.",
    ev: ['Neva tota la nit.', 'Fan un ninot de neu.', 'Li posen nas i bufanda.', 'El ninot es desfà.'] },
  { pic: '🍄', t: "Diumenge vam anar d'excursió al bosc. Quan vam arribar a la font, vam parar a dinar. Després de dinar, vam buscar bolets. Ja de tornada, vam veure un esquirol que saltava d'arbre en arbre.",
    ev: ['Arriben a la font.', 'Dinen.', 'Busquen bolets.', 'Veuen un esquirol.'] },
  { pic: '📦', hard: true, t: "La Clara va obrir el paquet tota emocionada. Feia una setmana que l'havia encarregat per internet. Dins hi havia el llibre que volia. Aquella mateixa nit el va començar a llegir.",
    ev: ['Encarrega un llibre per internet.', 'Obre el paquet.', 'Hi troba el llibre.', 'Comença a llegir-lo.'] },
  { pic: '🏊', hard: true, t: "Abans de banyar-se a la piscina, en Teo es va dutxar. Després es va posar el casquet i les ulleres. Va nedar quatre llargs sense parar. Quan va sortir de l'aigua, tremolava de fred.",
    ev: ['Es dutxa.', 'Es posa el casquet i les ulleres.', 'Neda quatre llargs.', 'Surt tremolant de fred.'] },
  { pic: '🍰', hard: true, t: "Mentre el pastís es coïa al forn, l'Ivet va rentar els plats. Abans, havia barrejat la farina, el sucre i els ous. Quan el pastís es va refredar, el va decorar amb maduixes. Al vespre, se'l van menjar tots junts.",
    ev: ['Barreja farina, sucre i ous.', 'Renta els plats mentre el pastís es cou.', 'Decora el pastís amb maduixes.', "Se'l mengen al vespre."] },
  { pic: '🐛', t: "Una eruga menjava fulles i més fulles. Un dia es va tancar dins d'un capoll. Hi va estar quieta moltes setmanes. Finalment, en va sortir convertida en una papallona de colors.",
    ev: ["L'eruga menja fulles.", 'Es tanca en un capoll.', 'Està quieta moltes setmanes.', 'Surt convertida en papallona.'] },
  { pic: '🎭', hard: true, t: "Els aplaudiments van omplir el teatre quan va acabar l'obra. Els nens havien assajat durant dos mesos. El dia de l'estrena, abans de sortir a l'escenari, tots estaven molt nerviosos. Al final, van saludar el públic agafats de les mans.",
    ev: ['Assagen durant dos mesos.', "Estan nerviosos abans de sortir a l'escenari.", "Acaba l'obra i el públic aplaudeix.", 'Saluden agafats de les mans.'] },
  { pic: '✉️', t: "L'Àlex va escriure una carta a la seva àvia, que viu a Mallorca. Va posar la carta dins un sobre i hi va enganxar un segell. L'endemà la va tirar a la bústia. Tres dies després, l'àvia el va trucar per donar-li les gràcies.",
    ev: ['Escriu la carta.', 'Hi enganxa un segell.', 'La tira a la bústia.', "L'àvia el truca."] },
  { pic: '🌧️', hard: true, t: "Quan va arribar a casa, la Jana estava xopa. Al matí havia sortit sense paraigua perquè feia sol. A mitja tarda, però, el cel es va tapar i va començar a ploure. Ara s'eixuga els cabells amb una tovallola.",
    ev: ['Surt sense paraigua.', 'Comença a ploure.', 'Arriba a casa xopa.', "S'eixuga els cabells."] }
];

/* ---------- Detectiu de pistes: what the text does not say, but gives away ---------- */
export const INF = [
  { pic: '🏖️', t: "En Pau es va posar crema solar i va estendre la tovallola sobre la sorra. Les onades li mullaven els peus.", q: 'On és en Pau?', o: ['A la platja', 'A la muntanya', 'A la piscina', 'A la dutxa'], c: ['crema', 'sorra', 'onades'] },
  { pic: '🎁', t: "La Laia no parava de somriure. Saltava, cantava i abraçava tothom que trobava.", q: 'Com se sent la Laia?', o: ['Contenta', 'Trista', 'Espantada', 'Cansada'], c: ['somriure', 'cantava', 'abraçava'] },
  { pic: '🍂', t: "Els arbres del parc es van quedant sense fulles, i a terra hi ha una catifa groga i marró. A la plaça ja venen castanyes torrades.", q: 'En quina època de l\'any som?', o: ['A la tardor', 'A la primavera', "A l'estiu", 'Al juliol'], c: ['fulles', 'groga', 'castanyes'] },
  { pic: '🩺', t: "La senyora Puig es va posar la bata blanca. Va escoltar el cor d'en Jan amb el fonendoscopi i li va mirar la gola. —No és res, només un refredat —va dir.", q: 'Quina feina fa la senyora Puig?', o: ['És metgessa', 'És mestra', 'És cuinera', 'És perruquera'], c: ['bata', 'fonendoscopi', 'refredat'] },
  { pic: '🌩️', t: "De sobte, el cel es va enfosquir. Es va sentir un tro molt fort i en Biel es va tapar les orelles. Va córrer a tancar les finestres.", q: 'Què està passant?', o: ['Hi ha una tempesta', 'Hi ha una festa', "S'ha fet de nit", 'Hi ha un incendi'], c: ['enfosquir', 'tro'] },
  { pic: '😢', t: "La Marta mirava per la finestra amb els ulls vermells. El seu millor amic s'havia mudat a una altra ciutat aquell matí.", q: 'Com se sent la Marta?', o: ['Trista', 'Contenta', 'Enfadada', 'Avorrida'], c: ['vermells', 'mudat'] },
  { pic: '🍕', t: "El cambrer ens va donar la carta. Vam demanar una pizza gran i aigua. Al final, el pare va demanar el compte.", q: 'On són?', o: ['En un restaurant', 'A casa', "A l'escola", 'En una botiga de roba'], c: ['cambrer', 'carta', 'compte'] },
  { pic: '🧤', t: "En Martí es va posar el gorro, els guants i la bufanda abans de sortir. Quan respirava, li sortia vapor per la boca.", q: 'Quin temps fa?', o: ['Fa fred', 'Fa calor', 'Plou', 'Fa vent'], c: ['guants', 'bufanda', 'vapor'] },
  { pic: '🌙', t: "Els fanals del carrer es van encendre. La Júlia es va posar el pijama i la mare li va llegir un conte fins que es va adormir.", q: 'Quan passa aquesta història?', o: ['A la nit', 'Al matí', 'Al migdia', "A l'hora del pati"], c: ['fanals', 'pijama', 'adormir'] },
  { pic: '🐶', t: "Quan en Lluc va arribar a casa, la cua del Tom no parava de moure's. El gos saltava i li llepava les mans.", q: 'Com està el gos?', o: ['Content de veure en Lluc', 'Enfadat', 'Adormit', 'Espantat'], c: ['cua', 'saltava', 'llepava'] },
  { pic: '🚀', t: "La comandant es va cordar el cinturó. Per la finestreta veia la Terra cada cop més petita, blava i rodona.", q: 'On és la comandant?', o: ['En una nau espacial', 'En un cotxe', 'En un tren', 'En un vaixell'], c: ['Terra', 'petita', 'rodona'] },
  { pic: '🎂', t: "Tothom va cantar i la Nina va bufar les nou espelmes d'una vegada. Després va obrir els regals.", q: 'Què celebren?', o: ["L'aniversari de la Nina", 'Nadal', 'El final del curs', 'Un casament'], c: ['cantar', 'espelmes', 'regals'] },
  { pic: '🥱', t: "En Pere va badallar per tercera vegada. Se li tancaven els ulls i el cap li queia sobre el llibre.", q: 'Com se sent en Pere?', o: ['Té son', 'Té gana', 'Està enfadat', 'Està espantat'], c: ['badallar', 'tancaven', 'queia'] },
  { pic: '🌸', t: "Al jardí, els cirerers estaven plens de flors blanques. Les orenetes tornaven a fer els nius sota la teulada.", q: "En quina època de l'any som?", o: ['A la primavera', 'A la tardor', "A l'hivern", 'Al novembre'], c: ['flors', 'orenetes'] },
  { pic: '🦴', t: "En Joan anava amb crosses i portava la cama enguixada. Els amics li van signar el guix amb retoladors de colors.", q: 'Què li ha passat a en Joan?', o: ["S'ha trencat la cama", 'Té grip', "S'ha fet un tall al dit", 'Ha guanyat una cursa'], c: ['crosses', 'enguixada', 'guix'] },
  { pic: '📚', t: "Tothom parlava fluixet. Hi havia prestatges plens de llibres, i una senyora apuntava els llibres que s'enduia cada nen.", q: 'On són?', o: ['En una biblioteca', 'En un mercat', 'En un hospital', 'En un cinema'], c: ['fluixet', 'prestatges', "s'enduia"] },
  { pic: '😠', t: "En Jordi va llançar la motxilla a terra i va tancar la porta de la seva habitació d'un cop. No volia parlar amb ningú.", q: 'Com se sent en Jordi?', o: ['Enfadat', 'Content', 'Adormit', 'Avorrit'], c: ['llançar', 'cop', 'ningú'] },
  { pic: '🎣', t: "L'avi va llançar l'ham a l'aigua i va esperar en silenci. De sobte, la canya es va doblegar.", q: 'Què fa l\'avi?', o: ['Pesca', 'Neda', 'Fa una passejada', 'Rega les plantes'], c: ["l'ham", 'canya'] },
  { pic: '🐾', t: "Al matí, a la neu del jardí hi havia unes petjades petites que anaven fins al galliner. Hi faltaven dues gallines.", q: 'Què deu haver passat durant la nit?', o: ['Un animal ha entrat al galliner', 'Les gallines han anat a passejar', 'Ha nevat a dins del galliner', 'El gos ha fet un forat al jardí'], c: ['petjades', 'galliner', 'faltaven'] },
  { pic: '🎉', t: "Al carrer hi havia gegants, capgrossos i una banda de música. Tothom ballava, i al vespre hi va haver focs artificials.", q: 'Què se celebra?', o: ['La festa major', 'Un aniversari', 'Un partit de futbol', "El primer dia d'escola"], c: ['gegants', 'capgrossos', 'focs'] }
];

/* ---------- Quin text és?: a piece of each kind ---------- */
export const TIP = [
  { type: 'conte', t: "Hi havia una vegada un llop que vivia sol al bosc. Un dia, va trobar una ovella perduda que plorava sota un roure." },
  { type: 'conte', t: "Fa molts i molts anys, en un regne molt llunyà, vivia una princesa que no sabia riure." },
  { type: 'conte', t: "La rateta que escombrava l'escaleta es va trobar un dineret. —Què me'n faré? —va pensar." },
  { type: 'noticia', t: "Girona, 3 de març. Ahir a la tarda, un incendi va cremar dues hectàrees de bosc a prop de Banyoles. Els bombers el van apagar en tres hores." },
  { type: 'noticia', t: "Un equip de científics ha descobert una nova espècie de granota al Montseny. És petita, de color verd clar i té taques negres." },
  { type: 'noticia', t: "L'escola Els Til·lers ha guanyat el concurs de reciclatge de la comarca. Els alumnes han recollit més de dues tones de paper durant el curs." },
  { type: 'poema', t: "Plou i fa sol, / les bruixes es pentinen; / plou i fa sol, / les bruixes porten dol." },
  { type: 'poema', t: "Al mig del bosc hi ha un estany, / blau com el cel de cada any, / i les granotes, cric-crac, / canten de nit dins del llac." },
  { type: 'poema', t: "Cargol treu banya, / puja a la muntanya, / cargol treu vi, / puja al molí." },
  { type: 'recepta', t: "Ingredients: 2 plàtans, 1 got de llet i 1 cullerada de mel. Talla els plàtans a trossos, posa-ho tot a la batedora i bat-ho fins que quedi ben fi." },
  { type: 'recepta', t: "Per a quatre persones: 300 grams de macarrons, 2 tomàquets i formatge ratllat. Bull els macarrons durant deu minuts i escorre'ls." },
  { type: 'instruccions', t: "Com es juga: tira el dau i avança tantes caselles com indiqui. Si caus en una escala, puja fins a dalt. Si caus en una serp, baixa fins a la cua." },
  { type: 'instruccions', t: "Abans de fer servir l'aparell, carrega la bateria durant dues hores. Després, prem el botó vermell durant tres segons per engegar-lo." },
  { type: 'carta', t: "Estimada àvia: Com estàs? Aquí a Lleida fa molt de fred. Ja tinc ganes que arribi l'estiu per anar a veure't. Moltes abraçades, la teva néta Clara." },
  { type: 'carta', t: "Benvolgut senyor alcalde: Li escric perquè al parc del meu barri no hi ha cap paperera i sempre està ple de brutícia." },
  { type: 'entrevista', t: "—Quan vas començar a jugar a bàsquet? —Als sis anys, a l'equip de l'escola. —I què és el que més t'agrada? —Les cistelles de tres punts!" },
  { type: 'entrevista', t: "PERIODISTA: Per què vas decidir ser bomber? BOMBER: Perquè m'agrada ajudar la gent. PERIODISTA: Has passat por alguna vegada?" },
  { type: 'descripcio', t: "El meu gat es diu Mixu. És gros i pelut, de color taronja amb ratlles blanques. Té els ulls verds i una cua molt llarga que mou quan està content." },
  { type: 'descripcio', t: "La meva habitació és petita però molt lluminosa. Al costat de la finestra hi ha l'escriptori, i a la paret, un prestatge ple de contes." },
  { type: 'cartell', t: "GRAN FESTA DE CARNAVAL! Dissabte 13 de febrer, a les 5 de la tarda, a la plaça Major. Concurs de disfresses i xocolatada per a tothom!" },
  { type: 'cartell', t: "S'HA PERDUT un gat negre amb un collar vermell. Respon al nom de Pirata. Si el trobeu, truqueu al 600 123 456. Gràcies!" },
  { type: 'endevinalla', t: "Soc rodona i brillant: de dia m'amago i de nit surto a passejar pel cel. Qui soc?" },
  { type: 'endevinalla', t: "Té fulls però no és un arbre, té llom però no és un animal. Què és?" },
  { type: 'diari', t: "Dimarts, 9 de febrer. Avui m'he llevat amb febre i no he anat a l'escola. M'he passat el dia al llit llegint còmics. Demà espero estar millor." }
];
