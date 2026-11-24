// Everything «La brúixola de l'estany» says, with no page and no chance in it: the six stages of a school project, the cards that
// belong to each one, the diaries of made-up class projects, the moments of group work where a child has to do or say something,
// and the short texts the project's questions are answered from. Right answers come FIRST in every options list; logic.js shuffles.
// The stages follow what Catalan primary schools do (tema → què sabem i què volem saber → pla → recerca → producte → presentació →
// què hem après); the names can be changed here if the school says them another way.

/* ---------- the six stages ---------- */
export const ETAPES = [
  { id: 'inici', nom: 'Punt de partida', curt: 'Comencem', icona: '❓', hue: 45,
    que: 'Triem el tema, diem què en sabem i escrivim què volem saber.',
    preguntes: ['Quin és el tema?', 'Què en sabem?', 'Què volem saber?'],
    fem: ['Escoltem el tema o la pregunta que ens proposen.', 'Diem tot el que ja sabem i ho apuntem.', 'Escrivim les preguntes que volem respondre.'],
    jo: ['Dir una cosa que ja sé del tema', 'Escriure una pregunta a la llista del grup', 'Apuntar a la llibreta el tema i les preguntes'],
    frases: ['Jo sé que…', "M'agradaria saber…", 'Una pregunta que tinc és…', 'Això em recorda…'],
    senyals: ['Què sabem?', 'Què volem saber?', 'El tema', "Pluja d'idees", 'La pregunta inicial'] },
  { id: 'pla', nom: 'Planificació', curt: 'Fem el pla', icona: '📋', hue: 200,
    que: 'Decidim què farem, com ho farem, qui fa cada cosa i quan.',
    preguntes: ['Què farem?', 'Com ho farem?', 'Qui fa què?'],
    fem: ['Decidim quin producte farem: un mural, una maqueta, una presentació…', 'Repartim les feines entre tots.', 'Mirem quants dies tenim i què farem cada dia.'],
    jo: ['Triar una feina i dir-la en veu alta', 'Apuntar quina és la meva feina', 'Preguntar què ha de fer cadascú si no ho tinc clar'],
    frases: ['Jo puc fer…', 'Qui fa què?', 'Quants dies tenim?', "Jo m'encarrego de…"],
    senyals: ['Repartir les feines', 'Qui fa què', 'El calendari', 'Quin producte farem', 'El pla'] },
  { id: 'recerca', nom: 'Recerca', curt: 'Busquem', icona: '🔍', hue: 280,
    que: 'Busquem informació, la llegim i apuntem només el que ens serveix.',
    preguntes: ['On ho busco?', 'Què diu el text?', 'Què apunto?'],
    fem: ['Busquem en llibres, a internet o preguntant a algú que en sap.', 'Llegim i mirem si respon les nostres preguntes.', 'Apuntem les dades importants amb poques paraules.'],
    jo: ["Agafar la pregunta que m'ha tocat i buscar-la", 'Llegir un text i subratllar on hi ha la resposta', 'Apuntar la resposta amb les meves paraules', 'Dir al grup què he trobat'],
    frases: ['He trobat que…', 'Aquí diu que…', 'On ho puc buscar?', 'Això respon la pregunta de…'],
    senyals: ['Buscar informació', 'Prendre notes', 'Llegir i subratllar', 'Les fonts', 'Les paraules clau'] },
  { id: 'elaboracio', nom: 'Elaboració', curt: 'Ho fem', icona: '🛠️', hue: 20,
    que: 'Ordenem el que hem trobat i fem el producte: el mural, la maqueta, la presentació…',
    preguntes: ['Com ho ordenem?', 'Què hi posem?', 'Com queda més clar?'],
    fem: ['Ajuntem la informació de tots i la posem en ordre.', 'Fem el producte: escrivim, dibuixem, retallem, enganxem, construïm.', 'Repassem que no hi falti res important.'],
    jo: ['Passar les meves notes a net', 'Fer la meva part del mural o de la maqueta', 'Mirar si la meva part lliga amb la dels altres'],
    frases: ['Jo poso la meva part aquí.', 'Això podria anar al costat de…', 'Falta posar…', 'Com ho fem perquè quedi clar?'],
    senyals: ['El mural', 'La maqueta', 'Retallar i enganxar', 'Passar a net', 'El producte final'] },
  { id: 'comunicacio', nom: 'Comunicació', curt: 'Ho expliquem', icona: '📣', hue: 340,
    que: 'Expliquem als altres què hem fet i què hem descobert.',
    preguntes: ['Què explico?', 'En quin ordre?', 'Com ho dic clar?'],
    fem: ['Preparem què dirà cadascú.', 'Assagem la presentació.', 'Expliquem el projecte a la classe o a les famílies i responem preguntes.'],
    jo: ['Triar les tres idees que explicaré', 'Assajar la meva part en veu alta', 'Mirar el públic i parlar a poc a poc'],
    frases: ['Jo us explicaré…', 'Hem descobert que…', 'I ara, el següent us explicarà…', 'Teniu alguna pregunta?'],
    senyals: ['La presentació', 'Assajar', 'Explicar-ho a la classe', 'Parlar clar', 'El públic'] },
  { id: 'avaluacio', nom: 'Avaluació', curt: 'Mirem enrere', icona: '✅', hue: 150,
    que: 'Pensem què hem après, com hem treballat i què faríem millor.',
    preguntes: ['Què he après?', 'Com he treballat?', 'Què milloraria?'],
    fem: ['Diem què hem après que no sabíem.', 'Pensem com ha anat el treball en grup.', 'Apuntem què faríem diferent la pròxima vegada.'],
    jo: ['Dir una cosa nova que he après', "Dir una cosa que m'ha costat", 'Dir una cosa que faré millor al pròxim projecte'],
    frases: ['He après que…', "El que m'ha costat més és…", 'La pròxima vegada…', "M'ha agradat…"],
    senyals: ['Què hem après?', 'Què milloraríem?', 'Autoavaluació', 'Com ha anat', 'La rúbrica'] }
];

/* ---------- things a class does, each in its stage: [stage, what happens] ---------- */
export const ACCIONS = [
  [0, 'Escrivim a la pissarra tot el que ja sabem dels volcans.'],
  [0, 'La mestra ens pregunta: «Què us agradaria descobrir dels ocells?»'],
  [0, 'Fem una llista de preguntes que volem respondre.'],
  [0, 'Diem si el tema ens recorda alguna cosa que hem vist.'],
  [1, 'Repartim les feines: un busca fotos, un altre escriu el text.'],
  [1, 'Decidim que farem una maqueta i no un mural.'],
  [1, 'Mirem el calendari: tenim tres setmanes.'],
  [1, 'Apuntem què farà cadascú cada dia.'],
  [2, "Llegim un llibre d'animals i apuntem les dades importants."],
  [2, 'Busquem a internet quant mesura un volcà.'],
  [2, "Preguntem a l'hortolà de l'escola quan es planten les faves."],
  [2, 'Subratllem la frase del text que respon la nostra pregunta.'],
  [3, 'Enganxem els textos i els dibuixos al mural.'],
  [3, 'Construïm el volcà amb cartró i paper de diari.'],
  [3, 'Passem a net les notes i les posem en ordre.'],
  [3, 'Preparem les diapositives de la presentació.'],
  [4, 'Expliquem el mural a la classe.'],
  [4, 'Assagem què dirà cadascú.'],
  [4, 'Les famílies vénen a veure la nostra maqueta i responem preguntes.'],
  [4, 'Gravem un vídeo explicant què hem descobert.'],
  [5, 'Diem què hem après que no sabíem.'],
  [5, 'Pensem què faríem millor la pròxima vegada.'],
  [5, 'Omplim la fitxa de com hem treballat en grup.'],
  [5, 'Mirem si hem respost totes les preguntes del principi.']
];

/* ---------- the diaries of two class projects: each day a stage, and what the child can do that day (right answer first) ---------- */
export const VOLCANS = { nom: 'Els volcans', icona: '🌋', dies: [
  { e: 0, t: 'Avui la mestra ha portat una pedra negra i foradada. Ens ha preguntat: «Què sabeu dels volcans?» Hem dit coses i les ha apuntat a la pissarra.',
    ara: ['Dir una cosa que sé: «Jo sé que els volcans treuen lava.»', 'Començar a construir el volcà amb cartró.', 'Esperar callat fins que acabi la classe.'] },
  { e: 0, t: 'Hem fet una llista de preguntes: per què surt la lava? Hi ha volcans a Catalunya? Quin és el més gran del món?',
    ara: ['Afegir una pregunta meva a la llista.', 'Explicar el mural a la classe.', 'Mirar què fan els altres grups.'] },
  { e: 1, t: "Hem decidit fer una maqueta d'un volcà que faci erupció. Cal repartir: qui fa la base, qui busca com es fa la lava, qui escriu el cartell.",
    ara: ["Triar una feina i dir-la: «Jo m'encarrego del cartell.»", 'Dir què he après del projecte.', "Deixar que els altres s'ho reparteixin tot."] },
  { e: 2, t: "M'ha tocat descobrir si hi ha volcans a Catalunya. Tinc un llibre de geografia i una tauleta.",
    ara: ['Buscar «volcans Catalunya» i apuntar el que trobi: la Garrotxa.', 'Pintar la maqueta de color marró.', "Esperar que algú m'ho digui."] },
  { e: 3, t: 'Ja tenim tota la informació. Avui fem la maqueta amb cartró, paper de diari i pintura.',
    ara: ['Fer la meva part: la base de cartró.', 'Fer una llista de què volem saber.', 'Posar-me a jugar amb la pintura.'] },
  { e: 4, t: 'Demà presentem la maqueta a la classe de 3r. Cadascú explica una part.',
    ara: ['Assajar la meva part en veu alta a casa.', 'Buscar més informació a internet.', 'Dir que no vull parlar.'] },
  { e: 5, t: "El projecte s'ha acabat. La mestra ens demana què hem après i què canviaríem.",
    ara: ['Dir una cosa que he après: «No sabia que a la Garrotxa hi ha 40 volcans.»', 'Repartir les feines del projecte.', 'Dir que tot ha anat bé i ja està.'] }
] };
export const OCELLS = { nom: 'Els ocells del pati', icona: '🐦', dies: [
  { e: 0, t: "Al pati hem vist un niu a l'arbre gran. La mestra ha preguntat: «Què sabem dels ocells que viuen a prop de l'escola?»",
    ara: ['Dir el que sé: «Jo he vist pardals i coloms al pati.»', 'Fer el mural dels ocells.', 'Quedar-me callat perquè no ho sé tot.'] },
  { e: 0, t: 'Volem saber tres coses: quins ocells viuen al pati, què mengen i on fan el niu.',
    ara: ['Apuntar les tres preguntes a la llibreta.', 'Explicar-ho a les famílies.', 'Mirar per la finestra a veure si passa un ocell.'] },
  { e: 1, t: 'Farem una guia dels ocells del pati. Hem de decidir qui observa, qui dibuixa i qui escriu les fitxes.',
    ara: ['Dir quina feina vull: «Jo puc dibuixar els ocells.»', 'Dir què he après del projecte.', 'Esperar que em donin una feina.'] },
  { e: 2, t: "Avui observem el pati amb binocles i apuntem quins ocells veiem. Després mirem a la guia d'ocells com es diuen.",
    ara: ['Apuntar cada ocell que veig i buscar-lo a la guia.', 'Repartir les feines del grup.', 'Jugar a pilota mentre els altres observen.'] },
  { e: 2, t: "He trobat un text sobre la merla. N'he de treure què menja i on fa el niu.",
    ara: ['Llegir el text i subratllar les frases que ho diuen.', 'Decidir el títol de la presentació.', 'Copiar tot el text sencer.'] },
  { e: 3, t: 'Cada fitxa de la guia porta un dibuix, el nom i tres dades. Avui les passem a net.',
    ara: ['Passar a net la fitxa de la merla amb les meves notes.', 'Fer una llista de què volem saber.', 'Esperar que algú ho faci per mi.'] },
  { e: 4, t: 'Presentem la guia als nens i nenes de 1r. Cadascú ensenya una fitxa.',
    ara: ['Preparar les tres idees de la meva fitxa i assajar.', 'Buscar més ocells a la guia.', 'Amagar-me al final de la fila.'] },
  { e: 5, t: 'Al final, la mestra pregunta: què ens ha costat més? Què farem millor?',
    ara: ["Dir el que m'ha costat: «Observar sense fer soroll.»", 'Dibuixar un altre ocell.', "Dir que no m'ha costat res."] }
] };
// moments of other projects, mixed: the compass of the whole class
export const BARREJA = [
  { tema: 'Els residus', icona: '♻️', e: 0, t: 'Hem trobat moltes deixalles al pati. La mestra pregunta: «Què sabem de les escombraries? On van?»',
    ara: ['Dir el que sé: «Les del contenidor groc són plàstics.»', 'Fer el cartell del reciclatge.', "Dir que això no m'interessa."] },
  { tema: 'Els residus', icona: '♻️', e: 1, t: "Farem un compostador per a l'hort. Cal decidir qui porta les fulles, qui construeix la caixa i qui fa el cartell.",
    ara: ['Dir quina feina faig: «Jo puc fer el cartell.»', 'Dir què he après del compost.', "Esperar que m'ho diguin."] },
  { tema: 'Els residus', icona: '♻️', e: 2, t: "He de saber què es pot tirar al compost i què no. Tinc un fullet de l'ajuntament.",
    ara: ['Llegir el fullet i apuntar les dues llistes: sí i no.', 'Pintar la caixa del compostador.', 'Guardar el fullet a la motxilla.'] },
  { tema: 'Els residus', icona: '♻️', e: 5, t: 'Al final del projecte mirem el compostador: funciona! La mestra pregunta què hem après.',
    ara: ['Dir una cosa nova: «Les restes de fruita es converteixen en terra.»', 'Repartir les feines.', 'Dir que ja ho sabia tot.'] },
  { tema: "L'espai", icona: '🚀', e: 0, t: "Hem vist un vídeo d'un coet. Volem saber com viuen els astronautes.",
    ara: ["Escriure una pregunta: «Què mengen a l'espai?»", 'Construir el coet de cartró.', 'Esperar que els altres facin les preguntes.'] },
  { tema: "L'espai", icona: '🚀', e: 2, t: "M'ha tocat buscar quants planetes hi ha i com es diuen.",
    ara: ["Buscar-ho al llibre de l'espai i apuntar els noms.", 'Assajar la presentació.', 'Dir que ja ho buscaré un altre dia.'] },
  { tema: "L'espai", icona: '🚀', e: 3, t: "Ja sabem molt de l'espai. Avui fem un mural amb els planetes de paper de colors.",
    ara: ["Retallar i enganxar els planetes que m'han tocat.", 'Fer la llista de què volem saber.', 'Mirar com ho fan els altres sense fer res.'] },
  { tema: "L'espai", icona: '🚀', e: 4, t: "Avui expliquem el mural de l'espai a les famílies.",
    ara: ['Explicar la meva part mirant el públic.', 'Buscar més informació sobre Mart.', "Dir que ho expliqui un altre."] },
  { tema: 'Els romans', icona: '🏛️', e: 0, t: 'Comencem un projecte sobre els romans. La mestra pregunta: «Què en sabem?»',
    ara: ['Dir el que sé: «Feien aqüeductes.»', 'Fer la maqueta del Colosseu.', 'Quedar-me callat.'] },
  { tema: 'Els romans', icona: '🏛️', e: 1, t: 'Farem un museu romà a la classe. Hem de decidir quines coses hi haurà i qui fa cada peça.',
    ara: ['Proposar: «Jo puc fer una moneda romana.»', 'Explicar el museu a la classe.', 'Deixar que ho decideixin els altres.'] },
  { tema: 'Els romans', icona: '🏛️', e: 3, t: 'Cadascú fa la seva peça del museu amb fang i cartró.',
    ara: ['Fer la meva moneda amb el fang.', 'Buscar què menjaven els romans.', 'Fer una pilota amb el fang.'] },
  { tema: 'Els romans', icona: '🏛️', e: 4, t: 'Les altres classes vénen a visitar el museu. Som els guies.',
    ara: ['Explicar la meva peça a cada grup que passa.', 'Fer més peces per al museu.', 'Amagar-me darrere la taula.'] },
  { tema: "L'hort", icona: '🥬', e: 1, t: "Plantarem faves i enciams a l'hort. Decidim qui rega, qui planta i qui apunta com creixen.",
    ara: ['Triar una feina: «Jo rego els dilluns.»', "Dir què hem après de l'hort.", "Esperar que m'ho diguin."] },
  { tema: "L'hort", icona: '🥬', e: 2, t: "Vull saber cada quants dies s'ha de regar l'enciam. L'hortolà ve avui.",
    ara: ["Preguntar-li: «Cada quants dies es rega l'enciam?»", "Pintar el cartell de l'hort.", 'No preguntar res perquè em fa vergonya.'] },
  { tema: "L'hort", icona: '🥬', e: 5, t: 'Hem collit els enciams. Pensem què ha anat bé i què no.',
    ara: ['Dir què milloraria: «Regar menys, que hem fet bassals.»', 'Plantar més enciams.', 'Dir que tot ha anat perfecte.'] }
];

/* ---------- moments of group work: what to do (FAIG) and what to say (DIC); right answer first, per says why ---------- */
export const FAIG = [
  { e: 0, s: 'El grup fa la llista de què sabem dels volcans. Tu saps una cosa però no has dit res.',
    o: ['Dic el que sé en veu alta.', 'Em quedo callat: ja ho diran els altres.', 'Dic que els volcans són avorrits.'], per: 'Tot el que saps serveix. Si no ho dius, el grup no ho té.' },
  { e: 1, s: "Reparteixen les feines i ningú no t'ha dit què fas.",
    o: ['Dic: «Jo puc buscar les fotos.»', 'Espero que algú em doni una feina.', 'Agafo la feina que ja fa un altre.'], per: 'Si tries tu la feina, segur que en tens una.' },
  { e: 2, s: 'No entens què ha dit la mestra que heu de buscar.',
    o: ['Aixeco la mà i pregunto: «Ho pots repetir?»', "Faig com si ho hagués entès.", 'Busco qualsevol cosa.'], per: 'Preguntar és la manera més ràpida de saber què toca.' },
  { e: 2, s: 'Has trobat una dada molt bona al llibre.',
    o: ["La dic al grup i l'apunto.", 'Me la guardo per a mi.', 'Tanco el llibre i ja està.'], per: "Una dada que no s'explica no arriba al mural." },
  { e: 3, s: "Al mural hi ha una part buida i ningú no se n'ocupa.",
    o: ['Dic: «Jo puc omplir aquesta part amb un dibuix.»', 'No dic res: no és la meva part.', 'Hi faig un gargot.'], per: 'Veure què falta i oferir-se és participar.' },
  { e: 1, s: 'Dos del grup volen fer el mateix dibuix i discuteixen.',
    o: ["Proposo: «Un fa el dibuix i l'altre el cartell, i després canvieu.»", 'Em poso a cridar més que ells.', 'Marxo a un altre lloc.'], per: 'Una proposta justa acaba la discussió.' },
  { e: 4, s: 'Et toca explicar la teva part davant la classe i et fa vergonya.',
    o: ['Porto una fitxa amb tres idees i la miro si em perdo.', 'Dic que no vull sortir.', 'Parlo molt ràpid per acabar aviat.'], per: 'Amb la fitxa a la mà no et quedes en blanc.' },
  { e: 3, s: "El grup decideix una cosa que no t'agrada per al mural.",
    o: ['Dic: «Jo ho faria així, què us sembla?»', 'Em quedo callat i enfadat.', 'Dic que està malament i prou.'], per: 'Dir la teva idea amb una pregunta deixa que el grup la pensi.' },
  { e: 0, s: "La mestra pregunta què voleu saber i no se t'acut res.",
    o: ['Penso «què em fa curiositat?» i dic una pregunta petita.', 'Dic que no vull saber res.', "Copio la pregunta d'un altre."], per: 'Una pregunta petita també val: «Quant pesa?», «On viu?».' },
  { e: 2, s: 'Has acabat la teva part de la recerca abans que els altres.',
    o: ['Pregunto: «Necessiteu ajuda amb alguna cosa?»', 'Em poso a jugar.', 'Dic als altres que són lents.'], per: 'Qui acaba abans pot ajudar el grup.' },
  { e: 5, s: 'La mestra demana què ha anat malament al grup.',
    o: ['Dic una cosa de veritat: «Hem perdut temps discutint.»', 'Dic que tot ha anat bé.', 'Dic que la culpa és dels altres.'], per: 'Dir el que ha fallat ajuda a fer-ho millor la pròxima vegada.' },
  { e: 1, s: 'No saps quants dies teniu per acabar el projecte.',
    o: ['Pregunto: «Quin dia ho hem de tenir acabat?»', "Ja m'ho diran.", 'Em poso a fer-ho tot el primer dia.'], per: 'Saber la data ajuda a repartir el temps.' }
];
export const DIC = [
  { e: 0, s: 'Vols dir una cosa que saps del tema.',
    o: ['«Jo sé que les abelles fan mel.»', '«Les abelles… no sé.»', '«Això ja ho sap tothom.»'], per: 'Comença amb «Jo sé que…» i digues la dada.' },
  { e: 1, s: 'Vols triar la feina de buscar fotos.',
    o: ["«Jo m'encarrego de buscar les fotos.»", '«Jo no vull escriure.»', '«Feu-ho vosaltres.»'], per: 'Digues la feina que faràs, no la que no vols.' },
  { e: 2, s: "No entens una paraula del text: «erupció».",
    o: ['«Què vol dir erupció?»', '«Aquest text és massa difícil.»', 'No dir res i saltar-me la paraula.'], per: 'Pregunta per la paraula exacta: així et la poden explicar.' },
  { e: 2, s: 'Vols dir al grup el que has trobat.',
    o: ['«He trobat que la merla menja cucs i fruita.»', '«He trobat una cosa.»', '«Mireu-ho vosaltres al llibre.»'], per: 'Digues la dada completa: què i qui.' },
  { e: 3, s: 'Tens una idea per al mural.',
    o: ['«Tinc una idea: podríem posar el volcà al mig, ben gran.»', '«El vostre mural és lleig.»', '«Jo ho faria diferent.»'], per: 'Una idea es diu amb «podríem…» i explicant com.' },
  { e: 3, s: "No estàs d'acord amb algú del grup.",
    o: ['«Jo ho veig diferent. I si ho provem així?»', '«Això està malament.»', '«Fes el que vulguis.»'], per: 'Digues què faries tu en lloc de dir només que no.' },
  { e: 4, s: 'Comences la teva part de la presentació.',
    o: ['«Jo us explicaré què mengen els ocells del pati.»', '«Ehh… bé… els ocells…»', '«Això no ho vaig fer jo.»'], per: 'Comença dient de què parlaràs: el públic ja sap què escoltar.' },
  { e: 4, s: 'Acabes la teva part i li toca a un altre.',
    o: ['«I ara, el següent us explicarà on fan el niu.»', 'Callar i seure.', '«Ja està, he acabat.»'], per: 'Passar la paraula fa que la presentació no es trenqui.' },
  { e: 5, s: 'Et pregunten què has après.',
    o: ['«He après que a la Garrotxa hi ha volcans.»', '«Res, ja ho sabia tot.»', '«No ho sé.»'], per: 'Tria una dada concreta que abans no sabies.' },
  { e: 1, s: 'No saps què has de fer avui.',
    o: ['«Què toca fer avui? Quina és la meva part?»', 'Mirar per la finestra.', '«Jo no tinc res a fer.»'], per: 'Pregunta pel pla: sempre hi ha una part per a tu.' },
  { e: 2, s: 'Vols demanar ajuda per buscar una dada.',
    o: ['«No trobo quant pesa la balena. Em pots ajudar?»', '«Això no es troba.»', 'Deixar la pregunta sense resposta.'], per: 'Digues què busques i demana ajuda: dues coses en una frase.' },
  { e: 5, s: 'Vols dir una cosa que milloraries.',
    o: ['«La pròxima vegada repartiria les feines el primer dia.»', '«Tot ha estat culpa del grup.»', '«Jo no canviaria res.»'], per: '«La pròxima vegada…» mira endavant, no busca culpables.' }
];

/* ---------- where to look for each thing (the right place first) ---------- */
export const FONTS = ['Un llibre d\'animals', 'El diccionari', 'Un mapa de Catalunya', 'El calendari de la classe', "Una guia d'ocells", "Un llibre d'història", 'Un vídeo que ensenya com es fa',
  'Preguntar-ho a la mestra', "Preguntar-ho a l'hortolà", "Un llibre de l'espai"];
export const BUSCA = [
  { q: 'Quant pesa una balena blava?', ok: "Un llibre d'animals" },
  { q: 'Què vol dir la paraula «erupció»?', ok: 'El diccionari' },
  { q: 'On és la Garrotxa?', ok: 'Un mapa de Catalunya' },
  { q: 'Quin dia és la presentació del projecte?', ok: 'El calendari de la classe' },
  { q: "Cada quants dies s'ha de regar l'enciam?", ok: "Preguntar-ho a l'hortolà" },
  { q: 'Com es diu aquest ocell petit i marró del pati?', ok: "Una guia d'ocells" },
  { q: 'Quan van arribar els romans a Tarragona?', ok: "Un llibre d'història" },
  { q: 'Com es fa un volcà de cartró que faci erupció?', ok: 'Un vídeo que ensenya com es fa' },
  { q: 'Quants planetes hi ha?', ok: "Un llibre de l'espai" },
  { q: 'Quin grup farà la presentació primer?', ok: 'Preguntar-ho a la mestra' }
];

/* ---------- short texts, and what a project would ask them: s is the sentence that answers, kw the words of the note card,
   nota [a good note, a wrong one]; dis are words of the text that are NOT the key ones ---------- */
export const TEXTOS = [
  { id: 'merla', titol: 'La merla', icona: '🐦', hue: 40,
    sents: ['La merla és un ocell negre amb el bec taronja.', 'Viu als parcs i als jardins de les ciutats.', 'Menja cucs, insectes i fruita.', 'Fa el niu als arbustos, amb branquetes i fang.', 'La femella pon de tres a cinc ous de color blau clar.'],
    dis: ['ocell', 'ciutats', 'jardins', 'femella', 'negre', 'parcs'],
    qs: [
      { q: 'Què menja la merla?', s: 2, kw: ['cucs', 'insectes', 'fruita'], nota: ['Menja cucs, insectes i fruita.', 'Menja llavors i pa.'] },
      { q: 'On fa el niu?', s: 3, kw: ['niu', 'arbustos', 'fang'], nota: ['Niu als arbustos, amb branquetes i fang.', 'Fa el niu a dalt dels arbres més alts.'] },
      { q: 'Quants ous pon?', s: 4, kw: ['ous', 'tres a cinc', 'blau clar'], nota: ['Pon de 3 a 5 ous blaus.', 'Pon un sol ou blanc.'] },
      { q: 'De quin color té el bec?', s: 0, kw: ['bec', 'taronja'], nota: ['Bec taronja.', 'Bec groc.'] }
    ] },
  { id: 'garrotxa', titol: 'Els volcans de la Garrotxa', icona: '🌋', hue: 15,
    sents: ['A la Garrotxa hi ha més de quaranta volcans.', 'Són volcans adormits: fa més de deu mil anys que no treuen lava.', 'El més conegut és el de Santa Margarida, que té una ermita a dins del cràter.', 'El Croscat és el volcà més jove de la península.', 'Es poden visitar a peu, per camins senyalitzats.'],
    dis: ['conegut', 'camins', 'península', 'visitar', 'a peu', 'més'],
    qs: [
      { q: 'Quants volcans hi ha a la Garrotxa?', s: 0, kw: ['Garrotxa', 'quaranta', 'volcans'], nota: ['A la Garrotxa: més de 40 volcans.', 'A la Garrotxa hi ha quatre volcans.'] },
      { q: 'Què té el volcà de Santa Margarida a dins del cràter?', s: 2, kw: ['Santa Margarida', 'ermita', 'cràter'], nota: ['Santa Margarida té una ermita dins del cràter.', 'Santa Margarida té un llac dins del cràter.'] },
      { q: 'Quin és el volcà més jove?', s: 3, kw: ['Croscat', 'més jove'], nota: ['El Croscat és el més jove.', 'El més jove és el de Santa Margarida.'] },
      { q: 'Fa quant de temps que no treuen lava?', s: 1, kw: ['adormits', 'deu mil anys', 'lava'], nota: ['Fa més de 10.000 anys que no treuen lava.', 'Treuen lava cada any.'] }
    ] },
  { id: 'compost', titol: 'El compost', icona: '🪱', hue: 95,
    sents: ['El compost és una terra fosca que es fa amb restes de plantes.', 'Al compostador hi podem tirar pells de fruita, fulles seques i restes de verdura.', 'No hi podem tirar plàstic, vidre ni carn.', 'Els cucs i els bacteris es mengen les restes i les converteixen en terra.', "Al cap de sis mesos, el compost serveix per adobar l'hort."],
    dis: ['fosca', 'plantes', 'compostador', 'restes', 'serveix', 'terra'],
    qs: [
      { q: 'Què es pot tirar al compostador?', s: 1, kw: ['pells de fruita', 'fulles seques', 'verdura'], nota: ['Sí: pells de fruita, fulles seques i verdura.', 'Sí: plàstic i vidre.'] },
      { q: "Què no s'hi pot tirar?", s: 2, kw: ['plàstic', 'vidre', 'carn'], nota: ['No: plàstic, vidre ni carn.', 'No: fulles seques.'] },
      { q: 'Qui converteix les restes en terra?', s: 3, kw: ['cucs', 'bacteris'], nota: ['Els cucs i els bacteris fan la terra.', 'Les gallines fan la terra.'] },
      { q: 'Quant tarda el compost a estar a punt?', s: 4, kw: ['sis mesos', 'adobar', 'hort'], nota: ["En 6 mesos està a punt per a l'hort.", 'Està a punt en una setmana.'] }
    ] },
  { id: 'lluna', titol: 'La Lluna', icona: '🌙', hue: 230,
    sents: ["La Lluna és l'únic satèl·lit natural de la Terra.", 'Fa una volta a la Terra cada vint-i-vuit dies, més o menys.', 'No té llum pròpia: brilla perquè reflecteix la llum del Sol.', "A la Lluna no hi ha aire ni aigua líquida.", "L'any 1969 dos astronautes hi van caminar per primera vegada."],
    dis: ['únic', 'natural', 'Terra', 'més o menys', 'pròpia', 'primera vegada'],
    qs: [
      { q: 'Per què brilla la Lluna?', s: 2, kw: ['brilla', 'reflecteix', 'Sol'], nota: ['Brilla perquè reflecteix la llum del Sol.', 'Brilla perquè crema com el Sol.'] },
      { q: 'Quant tarda a fer una volta a la Terra?', s: 1, kw: ['volta', 'vint-i-vuit dies'], nota: ['Una volta a la Terra cada 28 dies.', 'Una volta a la Terra cada any.'] },
      { q: 'Quan hi van caminar per primera vegada?', s: 4, kw: ['1969', 'astronautes', 'caminar'], nota: ['El 1969 hi van caminar dos astronautes.', 'Encara no hi ha anat ningú.'] },
      { q: 'Què no hi ha a la Lluna?', s: 3, kw: ['aire', 'aigua líquida'], nota: ['No hi ha aire ni aigua líquida.', 'No hi ha pedres.'] }
    ] },
  { id: 'tarraco', titol: 'Els romans a Tarragona', icona: '🏛️', hue: 0,
    sents: ['Fa dos mil anys, Tarragona es deia Tàrraco i era una ciutat romana molt important.', 'Els romans hi van construir un amfiteatre a la vora del mar per fer-hi espectacles.', 'També hi van fer un circ, on corrien les curses de carros.', "L'aigua arribava a la ciutat per un aqüeducte que encara es pot veure: el Pont del Diable.", "Avui moltes d'aquestes restes es poden visitar."],
    dis: ['important', 'construir', 'també', 'encara', 'restes', 'visitar'],
    qs: [
      { q: 'Com es deia Tarragona fa dos mil anys?', s: 0, kw: ['Tàrraco', 'ciutat romana', 'dos mil anys'], nota: ['Fa 2.000 anys es deia Tàrraco.', 'Es deia Barcino.'] },
      { q: "Per a què servia l'amfiteatre?", s: 1, kw: ['amfiteatre', 'espectacles', 'mar'], nota: ["L'amfiteatre, a la vora del mar, era per a espectacles.", "L'amfiteatre servia per guardar aigua."] },
      { q: 'Què es feia al circ?', s: 2, kw: ['circ', 'curses', 'carros'], nota: ['Al circ hi corrien curses de carros.', 'Al circ hi havia lleons.'] },
      { q: "Com arribava l'aigua a la ciutat?", s: 3, kw: ['aigua', 'aqüeducte', 'Pont del Diable'], nota: ["L'aigua arribava per un aqüeducte, el Pont del Diable.", "L'aigua arribava amb carros."] }
    ] },
  { id: 'granota', titol: 'La granota verda', icona: '🐸', hue: 130,
    sents: ["La granota verda viu als estanys i a les basses d'aigua dolça.", 'De petita és un capgròs: respira amb brànquies i no té potes.', 'Quan creix li surten les potes i respira amb pulmons i per la pell.', "S'alimenta d'insectes, que caça amb la llengua enganxosa.", "A l'hivern s'amaga al fang i gairebé no es mou."],
    dis: ['verda', 'petita', 'creix', 'pell', 'gairebé', 'surten'],
    qs: [
      { q: 'Com respira el capgròs?', s: 1, kw: ['capgròs', 'brànquies'], nota: ['El capgròs respira amb brànquies.', 'El capgròs respira amb pulmons.'] },
      { q: 'Què menja la granota?', s: 3, kw: ['insectes', 'llengua', 'enganxosa'], nota: ['Menja insectes, caçats amb la llengua.', 'Menja algues i herba.'] },
      { q: "Què fa a l'hivern?", s: 4, kw: ['hivern', 'fang', 'no es mou'], nota: ["A l'hivern s'amaga al fang.", "A l'hivern se'n va a un país càlid."] },
      { q: 'On viu la granota verda?', s: 0, kw: ['estanys', 'basses', 'aigua dolça'], nota: ["Viu a estanys i basses d'aigua dolça.", 'Viu al mar.'] }
    ] },
  { id: 'abelles', titol: 'Les abelles', icona: '🐝', hue: 50,
    sents: ['Les abelles viuen en grups molt grans que es diuen eixams.', "A cada rusc hi ha una sola reina, que és l'única que pon ous.", 'Les obreres surten a buscar nèctar a les flors i amb el nèctar fan la mel.', 'Quan una abella troba moltes flors, ho explica a les altres ballant.', 'Són molt importants perquè, en volar de flor en flor, ajuden les plantes a fer fruits.'],
    dis: ['grans', 'rusc', 'surten', 'altres', 'importants', 'volar'],
    qs: [
      { q: "Com es diuen els grups d'abelles?", s: 0, kw: ['grups', 'eixams'], nota: ["Els grups d'abelles són eixams.", "Els grups d'abelles són ramats."] },
      { q: 'Qui pon els ous al rusc?', s: 1, kw: ['reina', 'pon', 'ous'], nota: ['Només la reina pon ous.', 'Totes les abelles ponen ous.'] },
      { q: 'Amb què fan la mel?', s: 2, kw: ['obreres', 'nèctar', 'mel'], nota: ['Les obreres fan la mel amb el nèctar de les flors.', 'Fan la mel amb aigua i sucre.'] },
      { q: 'Com expliquen on hi ha flors?', s: 3, kw: ['troba flors', 'explica', 'ballant'], nota: ['Expliquen on hi ha flors ballant.', 'Expliquen on hi ha flors fent soroll.'] }
    ] },
  { id: 'enciam', titol: "L'enciam de l'hort", icona: '🥬', hue: 110,
    sents: ["L'enciam és una planta que es menja crua, a l'amanida.", 'Es planta a la tardor o a la primavera, en terra solta i amb adob.', 'Necessita aigua sovint, però sense fer bassals.', 'Al cap de dos mesos ja es pot collir.', "Els cargols se'l mengen de nit, per això cal protegir-lo."],
    dis: ['planta', 'crua', 'amanida', 'solta', 'necessita', 'per això'],
    qs: [
      { q: "Quan es planta l'enciam?", s: 1, kw: ['tardor', 'primavera', 'adob'], nota: ['Es planta a la tardor o a la primavera.', "Es planta a l'estiu."] },
      { q: 'Quan es pot collir?', s: 3, kw: ['collir', 'dos mesos'], nota: ['Es cull al cap de 2 mesos.', 'Es cull al cap de 2 dies.'] },
      { q: "Qui se'l menja de nit?", s: 4, kw: ['cargols', 'nit', 'protegir'], nota: ["Els cargols se'l mengen de nit.", "Els ocells se'l mengen de dia."] },
      { q: "Com s'ha de regar?", s: 2, kw: ['aigua', 'sovint', 'bassals'], nota: ['Regar sovint, sense fer bassals.', 'Regar un cop al mes.'] }
    ] }
];

/* ---------- what the frog says at the start of each project's levels ---------- */
export const PRIMER = [
  'Un projecte és un camí amb sis etapes. Mira-les bé: sempre van en aquest ordre.',
  'Cada etapa té les seves paraules. Quan les sentis a classe, ja sabràs on sou.',
  'Llegeix què passa avui a classe i toca a la brúixola en quina etapa som.',
  'Un altre projecte, les mateixes sis etapes. On som avui?',
  'Projectes de tota mena: busca les pistes de cada etapa.',
  'Participar és fer o dir una cosa. Tria què faries tu.',
  'Les paraules exactes importen. Tria què diries tu.',
  'La pregunta del projecte diu què busques. Troba la frase del text que ho respon.',
  'Una bona fitxa té poques paraules i la dada exacta.',
  "Abans de buscar, pensa: on ho trobaré? I després: què ens falta encara?",
  "Ara ho fas tot tu: un projecte sencer, de la primera pregunta fins a mirar enrere.",
  "Els projectes de debò es compliquen. Quan passi un imprevist, pensa a quina etapa has de tornar."
];
