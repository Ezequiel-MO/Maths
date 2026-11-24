// What the new trials of «La brúixola de l'estany» are made of, with no page and no chance in it: short stories of a whole project (one
// step per stage), logic puzzles to share out the jobs, conversations with the crew of the expedition, what a text does NOT say, and the
// mishaps of a project. Right answers come FIRST in every options list; logic.js shuffles. The crew are animals of the game.

/* ---------- a whole project in six short steps, one per stage, to put in order ---------- */
export const TIRES = [
  { id: 'volcans', tema: 'El volcà', pic: '🌋', passos: ['Ens preguntem: per què surt lava dels volcans?', 'Decidim fer una maqueta i triem qui fa cada part.', 'Busquem en un llibre com és un volcà per dins.', 'Construïm el volcà amb cartró i paper de diari.', 'Fem esclatar la maqueta davant la classe i ho expliquem.', 'Pensem què hem après i què faríem millor.'] },
  { id: 'ocells', tema: 'Els ocells', pic: '🐦', passos: ['Veiem un niu i ens preguntem qui hi viu.', 'Decidim fer una guia i triem qui dibuixa.', 'Observem el pati amb binocles i apuntem què veiem.', 'Dibuixem i escrivim les fitxes de la guia.', 'Ensenyem la guia als nens i nenes de 1r.', 'Mirem què ens ha costat més i què hem descobert.'] },
  { id: 'pont', tema: 'El pont de cartró', pic: '🌉', passos: ['Ens preguntem: com aguanta un pont tan llarg?', 'Fem un dibuix del pla i mirem quant cartró cal.', 'Mirem fotos de ponts de veritat i apuntem les formes.', 'Tallem, pleguem i enganxem el nostre pont.', 'Posem-hi pes davant de tothom i expliquem per què aguanta.', 'Parlem de què canviaríem perquè aguantés més.'] },
  { id: 'hort', tema: "L'hort", pic: '🥕', passos: ['Ens preguntem què podem plantar a la tardor.', 'Fem el calendari de qui rega cada dia.', "Preguntem a l'hortolà quanta aigua necessiten.", 'Plantem les faves i posem els cartells.', 'Convidem les famílies a veure com ha crescut.', 'Mirem què ha anat bé i què plantaríem diferent.'] },
  { id: 'planetes', tema: 'Els planetes', pic: '🪐', passos: ['Ens preguntem si podríem viure a Mart.', 'Decidim fer un mòbil de planetes i ens repartim els vuit.', "Busquem a la biblioteca la mida de cada planeta.", 'Pintem les boles i les pengem en ordre.', 'Expliquem el sistema solar a la classe de 3r.', 'Comentem què ens ha sorprès més de tot.'] },
  { id: 'romans', tema: 'El museu romà', pic: '🏛️', passos: ['Ens preguntem com vivien els nens romans.', 'Triem quines peces tindrà el museu i qui en fa cada una.', "Llegim un llibre d'història i apuntem com eren.", 'Fem monedes de fang i un mosaic de paper.', 'Fem de guies quan les altres classes visiten el museu.', 'Pensem quina peça ha agradat més i per què.'] },
  { id: 'robot', tema: 'El robot de capses', pic: '🤖', passos: ['Ens preguntem: què podria fer un robot a la classe?', 'Dibuixem el robot i decidim qui porta cada capsa.', 'Mirem un vídeo de com es mou un braç articulat.', 'Muntem el robot amb capses, cordill i encaixos.', 'Fem una demostració i responem les preguntes.', 'Apuntem què no ha funcionat i com ho arreglaríem.'] },
  { id: 'pa', tema: 'El pa de casa', pic: '🥖', passos: ['Ens preguntem per què el pa s\'infla.', 'Fem la llista dels ingredients i qui porta què.', "Preguntem al forner què fa el llevat.", 'Pastem, deixem reposar i coem el pa.', 'Expliquem la recepta a les famílies i el tastem.', 'Parlem de com ens ha quedat i què canviaríem.'] }
];

/* ---------- what each stage's job is called on a calendar ---------- */
export const FEINES = [
  ['Escriure les preguntes', 'Dir què sabem'],
  ['Repartir les feines', 'Fer el pla'],
  ['Buscar la informació', 'Llegir i apuntar'],
  ['Fer el mural', 'Construir la maqueta'],
  ['Assajar', 'Presentar a la classe'],
  ['Dir què hem après', 'Pensar què milloraríem']
];
export const DIES = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];

/* ---------- who does what: every clue is true and only one way of sharing the jobs fits them all (scripts check it) ---------- */
export const CREW = [{ nom: 'la Tortuga', pic: '🐢' }, { nom: "l'Esquirol", pic: '🐿️' }, { nom: 'el Conill', pic: '🐰' }, { nom: 'la Guineu', pic: '🦊' }];
// crew: indexes of CREW; feines: [text, pic]; pistes: [the clue, si: [crew, job] it must be, no: [[crew, job], ...] it cannot be]
export const PUZZLES = [
  { titol: 'El mural dels volcans', crew: [0, 1, 2], feines: [['Buscar les fotos', '📷'], ['Escriure el text', '✏️'], ['Fer la maqueta', '🏗️']], pistes: [
    { t: 'La Tortuga no fa la maqueta.', no: [[0, 2]] }, { t: "L'Esquirol no escriu ni busca fotos.", no: [[1, 1], [1, 0]] }, { t: 'El Conill no escriu.', no: [[2, 1]] }] },
  { titol: 'La caseta dels ocells', crew: [2, 3, 1], feines: [['Portar el cartró', '📦'], ['Pintar', '🎨'], ['Fer el cartell', '🪧']], pistes: [
    { t: 'El Conill ha dit: «Jo pinto!»', si: [2, 1] }, { t: 'La Guineu té el braç enguixat i no pot portar res.', no: [[3, 0]] }] },
  { titol: "L'enquesta de l'hort", crew: [0, 1, 3], feines: [['Buscar al llibre', '📚'], ["Preguntar a l'hortolà", '🧑‍🌾'], ['Apuntar les dades', '📝']], pistes: [
    { t: 'La Tortuga parla molt baixet: no farà la pregunta.', no: [[0, 1]] }, { t: "L'Esquirol no sap on és el llibre.", no: [[1, 0]] }, { t: 'La Guineu i la Tortuga no tenen llapis.', no: [[3, 2], [0, 2]] }] },
  { titol: 'El mapa de la Garrotxa', crew: [1, 2, 3], feines: [['Fer el títol', '🔤'], ['Dibuixar el mapa', '🗺️'], ['Retallar les fotos', '✂️']], pistes: [
    { t: "A l'Esquirol li fan por les tisores.", no: [[1, 2]] }, { t: 'El Conill no dibuixa mai mapes.', no: [[2, 1]] }, { t: 'La Guineu fa el títol.', si: [3, 0] }] },
  { titol: 'La presentació de la Lluna', crew: [0, 1, 2, 3], feines: [['Buscar les fotos', '📷'], ['Escriure el guió', '✏️'], ['Dibuixar la Lluna', '🌙'], ['Presentar', '🎤']], pistes: [
    { t: 'La Tortuga té vergonya: no presenta.', no: [[0, 3]] }, { t: "L'Esquirol només vol dibuixar o escriure.", no: [[1, 0], [1, 3]] }, { t: 'La Guineu ja ha agafat els llapis: dibuixa ella.', si: [3, 2] }, { t: 'El Conill no sap buscar fotos.', no: [[2, 0]] }] },
  { titol: 'El mural del compost', crew: [0, 1, 2, 3], feines: [['Portar les caixes', '📦'], ['Pintar el fons', '🎨'], ['Fer les lletres', '🔠'], ['Enganxar les fotos', '🖼️']], pistes: [
    { t: 'El Conill és el més fort: porta les caixes.', si: [2, 0] }, { t: 'La Tortuga no pinta ni enganxa.', no: [[0, 1], [0, 3]] }, { t: "L'Esquirol no pinta.", no: [[1, 1]] }] },
  { titol: 'La recerca de les abelles', crew: [0, 1, 2, 3], feines: [['Llegir el llibre', '📖'], ['Mirar el vídeo', '🎬'], ['Preguntar a la mestra', '🙋'], ['Apuntar-ho tot', '📝']], pistes: [
    { t: 'La Guineu no mira el vídeo.', no: [[3, 1]] }, { t: "L'Esquirol no llegeix ni pregunta.", no: [[1, 0], [1, 2]] }, { t: 'La Tortuga té la llibreta: ho apunta tot.', si: [0, 3] }, { t: 'El Conill no llegeix.', no: [[2, 0]] }] },
  { titol: 'La festa de final de projecte', crew: [0, 1, 2, 3], feines: [["Muntar l'escenari", '🎭'], ['Fer els cartells', '🪧'], ['Assajar el text', '🗣️'], ['Preparar les preguntes', '❓']], pistes: [
    { t: 'La Tortuga va a poc a poc: no munta res.', no: [[0, 0]] }, { t: "L'Esquirol vol assajar.", si: [1, 2] }, { t: 'El Conill no fa cartells ni preguntes.', no: [[2, 1], [2, 3]] }, { t: 'La Guineu no fa cartells.', no: [[3, 1]] }] }
];

/* ---------- conversations with the crew: three turns, what they say and what you could answer, each with how they take it ---------- */
export const CONVERSES = [
  { titol: 'Repartim les feines', who: { nom: 'La Tortuga', pic: '🐢' }, e: 1, torns: [
    { diu: 'Hem de repartir les feines del mural. Tu què vols fer?', o: [['Jo puc buscar les fotos.', 'Perfecte! Ja sabem qui busca les fotos.'], ["El que vulgueu, m'és igual.", 'Així no sé què et toca. Digues una feina!'], ['Jo no faig res, que estic cansat.', 'Si no fas res, el mural queda a mitges.']] },
    { diu: 'Ai, jo també volia buscar les fotos! Què fem?', o: [['Si vols, tu les busques i jo escric el text.', 'Gràcies! Així tots dos estem contents.'], ["Les busco jo, que ho he dit primer.", "Ara m'he enfadat una mica…"], ['Doncs ja no hi jugo.', 'Això no arregla res.']] },
    { diu: "I quin dia ho hem de tenir acabat?", o: [["No ho sé. Ho pregunto a la mestra i t'ho dic.", 'Molt bé: preguntar ho resol.'], ['Ja ho farem quan puguem.', "Sense data, ens quedarà tot per a l'últim dia!"], ['Això no és cosa meva.', 'El projecte és de tots.']] }
  ] },
  { titol: 'No hi estic d\'acord', who: { nom: 'La Guineu', pic: '🦊' }, e: 3, torns: [
    { diu: 'Posarem el títol petit, a baix de tot del mural.', o: [['Jo el posaria gran i a dalt. Què et sembla?', 'Hum, té sentit. Es veuria de lluny.'], ['Això és una idea dolenta.', 'Doncs digues-ne una de millor!'], ['Bé, fes el que vulguis.', "Però tu què en penses? No ho has dit."]] },
    { diu: "Però a dalt no hi cap: hi ha el dibuix del volcà!", o: [['I si baixem el dibuix una mica i el títol va a sobre?', 'Això sí que pot funcionar!'], ['Doncs trec el teu dibuix.', 'Ei! Que m\'ha costat molt de fer!'], ['Doncs deixem-ho tot així.', 'Llavors el títol no es veurà.']] },
    { diu: "D'acord. Ho provem i mirem com queda?", o: [['Sí! I si no ens agrada, ho tornem a canviar.', 'Som-hi! Així es treballa bé.'], ['Ja et dic jo que quedarà bé.', "Millor mirar-ho abans de dir-ho."], ['Fes-ho tu, que jo ja he dit prou.', 'Però és feina de tots dos…']] }
  ] },
  { titol: 'No ho he entès', who: { nom: "L'Esquirol", pic: '🐿️' }, e: 2, torns: [
    { diu: 'La mestra ha dit que busquem els «afluents» del Ter. Som-hi!', o: [['Espera: què vol dir «afluents»?', 'Bona pregunta! Jo tampoc no ho sabia del cert.'], ['Sí, sí, ja ho sé.', 'Segur? I què buscaràs, doncs?'], ['Això és massa difícil.', 'Primer mirem què vol dir.']] },
    { diu: 'On podem mirar què vol dir aquesta paraula?', o: [['Al diccionari!', 'Exacte. Mira: rius petits que van a parar a un de gran.'], ['Al calendari de la classe.', 'Allà només hi ha els dies!'], ['Enlloc, ens ho inventem.', 'Si ens ho inventem, el mural dirà mentides.']] },
    { diu: 'Ja ho tenim! I ara què apuntem a la fitxa?', o: [['Només els noms dels afluents, amb poques paraules.', 'Això! Una fitxa curta i clara.'], ['Copiem tota la pàgina del llibre.', "Copiar-ho tot no és entendre-ho."], ['No cal apuntar res, ja ens en recordarem.', 'Demà ja no ens en recordarem!']] }
  ] },
  { titol: 'La dada que no quadra', who: { nom: 'El Conill', pic: '🐰' }, e: 2, torns: [
    { diu: 'He escrit a la fitxa que la Lluna té llum pròpia!', o: [['Al text diu que reflecteix la llum del Sol. Ho mirem?', 'Ah! Tens raó, ho havia llegit malament.'], ['Això és mentida!', 'Ui, no cal que ho diguis així…'], ['Molt bé, ja ho deixem així.', 'Però llavors el mural tindrà una errada.']] },
    { diu: 'I ara com ho arreglo?', o: [['Ratlla la frase i escriu la dada bona.', 'Fet! Ara ja està bé.'], ['Arrenca la fitxa i llença-la.', 'Però les altres dades eren bones!'], ['No ho arreglis, ningú no ho veurà.', 'I si algú ho pregunta a la presentació?']] },
    { diu: "Com sabem que les altres dades també estan bé?", o: [['Les repassem una per una amb el text al davant.', 'Bona idea. Així no se n\'escapa cap.'], ['Ens les creiem i ja està.', 'Però aquesta ja ens ha fallat!'], ['Les canviem totes per si de cas.', 'Llavors les bones es perdrien.']] }
  ] },
  { titol: 'Em quedo en blanc', who: { nom: 'La Tortuga', pic: '🐢' }, e: 4, torns: [
    { diu: "Demà presentem i tinc molta por d'oblidar-me de tot!", o: [["Fem una fitxa amb tres idees, per mirar-la si cal.", 'Tres idees! Això sí que ho puc fer.'], ['Doncs no vinguis demà.', "Però llavors falta la meva part!"], ['Aprèn-t\'ho tot de memòria.', 'Tot? Encara em fa més por!']] },
    { diu: 'I si parlo massa de pressa?', o: [["Assagem-ho en veu alta, a poc a poc.", 'A la segona vegada ja em surt millor!'], ['Així acabes abans.', 'Però llavors no m\'entendrà ningú.'], ['Parla molt fluix i no es notarà.', 'Si parlo fluix, no em sentiran.']] },
    { diu: 'I on miro mentre parlo?', o: [['Mira el públic, i de tant en tant la fitxa.', 'Ho provaré: públic, fitxa, públic.'], ['Mira a terra tota l\'estona.', 'Llavors semblarà que no en sé res.'], ['Tanca els ulls.', 'Doncs ensopegaré!']] }
  ] },
  { titol: 'Una pregunta del públic', who: { nom: 'La Guineu', pic: '🦊' }, e: 4, torns: [
    { diu: 'Molt bona presentació! Una pregunta: quants volcans hi ha a la Garrotxa?', o: [['Més de quaranta, ho vam trobar al llibre.', 'Caram, quants! Gràcies.'], ['No ho sé, pregunta-ho a un altre.', 'Ah… pensava que ho havíeu buscat.'], ['Molts, moltíssims, un milió.', 'Un milió? Segur?']] },
    { diu: 'I per què ja no treuen lava?', o: [['Perquè estan adormits: fa més de deu mil anys que no en treuen.', 'Ara ho entenc!'], ['Perquè se\'ls ha acabat la pila.', 'Ha, ha! No crec, eh?'], ['Perquè no.', 'Això no és una resposta.']] },
    { diu: 'I quin és el volcà on neix el vent més fort del món?', o: [['Això no ho sabem. Ho podem buscar i us ho diem.', 'Quina bona resposta! Dir «no ho sé» també val.'], ['El Croscat, segur.', 'Segur? Ho has trobat enlloc?'], ['Aquesta pregunta és una ximpleria.', 'Ui, m\'has fet sentir malament.']] }
  ] },
  { titol: 'Què ha anat malament?', who: { nom: 'El Conill', pic: '🐰' }, e: 5, torns: [
    { diu: "Ja hem acabat! Què ens ha anat pitjor d'aquest projecte?", o: [['Vam perdre molt de temps discutint el títol.', 'És veritat. Ho apuntem.'], ['Tot ha sortit perfecte.', 'De debò? I el dia que no trobàvem la cola?'], ['La culpa és de la Guineu.', 'Això no ajuda a fer-ho millor.']] },
    { diu: 'I què faries diferent la pròxima vegada?', o: [['Decidiria el títol el primer dia.', 'Molt bona idea per al pròxim projecte!'], ['No faria cap més projecte.', 'Però si n\'has après un munt!'], ['Res, ja està bé.', 'Sempre es pot fer alguna cosa millor.']] },
    { diu: 'I què és el que més has après?', o: [['Que a la Garrotxa hi ha més de quaranta volcans.', 'Jo tampoc no ho sabia abans!'], ['Res, ja ho sabia tot.', 'Segur que alguna cosa nova hi ha.'], ['No me\'n recordo.', 'Mira la fitxa: t\'ajudarà.']] }
  ] },
  { titol: 'Tinc una idea!', who: { nom: "L'Esquirol", pic: '🐿️' }, e: 0, torns: [
    { diu: 'El tema és l\'aigua. Què en sabem?', o: [['Jo sé que la pluja omple els embassaments.', 'Bona! L\'apunto a la pissarra.'], ['Jo no en sé res.', 'Segur que alguna cosa saps: on la fas servir?'], ['L\'aigua és avorrida.', 'Però sense aigua no viuríem!']] },
    { diu: 'I què t\'agradaria descobrir?', o: [["Com arriba l'aigua fins a l'aixeta de casa?", 'Uau, aquesta pregunta és molt bona!'], ['Quan acabem el projecte?', 'Això no és sobre el tema.'], ['Res, no vull saber res.', 'Pensa: què et fa curiositat?']] },
    { diu: 'Com ho podríem esbrinar?', o: [["Podríem preguntar a algú de l'ajuntament.", 'Sí! Algú que en sap molt.'], ['Ens ho inventem.', 'Així no descobrim res de debò.'], ['Esperem que ens ho expliquin.', 'Millor anar-ho a buscar nosaltres!']] }
  ] }
];

/* ---------- what each text does not say: it may be true, but it is not written there ---------- */
export const NODIU = {
  merla: ['La merla canta sobretot al matí.', 'La merla viu uns deu anys.', 'El mascle és més gros que la femella.'],
  garrotxa: ['A la Garrotxa neva cada hivern.', 'El Croscat fa més de mil metres.', 'Els volcans es van formar en un sol dia.'],
  compost: ['El compost fa bona olor.', 'Un compostador costa vint euros.', 'Els cucs del compost són de color vermell.'],
  lluna: ['A la Lluna hi fa molt de fred.', 'Els astronautes hi van anar tres dies.', 'La Lluna és més petita que Mart.'],
  tarraco: ["A l'amfiteatre hi cabien deu mil persones.", 'Els carros els tiraven quatre cavalls.', 'Els romans menjaven amb les mans.'],
  granota: ['La granota pot saltar un metre.', 'Una granota pon mil ous.', 'Les granotes canten a la nit.'],
  abelles: ['Una abella viu unes sis setmanes.', 'La mel és bona per a la tos.', 'Les abelles no veuen el color vermell.'],
  enciam: ["L'enciam té molta vitamina.", 'Hi ha enciams de color vermell.', "L'enciam va néixer a Egipte."]
};

/* ---------- things that go wrong in a project: what to do, and the stage you go back to ---------- */
export const IMPREVISTOS = [
  { t: 'Ha plogut i s\'ha mullat el mural. Falten dos dies per presentar!', e: 3, o: ['Tornem a fer les parts mullades amb les notes que tenim.', 'Presentem el mural mullat i ja està.', 'Deixem el projecte.'], per: "Les notes són a la llibreta: només cal tornar a Elaboració." },
  { t: 'Ja fem el mural i veiem que ens falta una dada important.', e: 2, o: ['Tornem un moment a Recerca a buscar-la.', "Ens l'inventem perquè quedi bé.", 'Fem veure que no ens en hem adonat.'], per: 'Els projectes no sempre van en línia recta: es pot tornar enrere.' },
  { t: "El dia de la presentació, un de l'equip no ha vingut.", e: 4, o: ['Ens repartim la seva part amb les seves notes.', 'No presentem res.', 'Ens saltem la seva part sense dir res.'], per: 'Si tothom sap el pla, algú pot cobrir aquella part.' },
  { t: "Hem repartit les feines, però dues persones fan el mateix i una altra no fa res.", e: 1, o: ['Tornem a mirar el pla i ho arreglem.', 'Que continuïn així.', 'Que ho faci tot qui té més ganes.'], per: 'Quan el pla falla, es torna al pla.' },
  { t: 'Hem llegit molt, però ja no recordem quina era la nostra pregunta.', e: 0, o: ['Tornem a mirar la llista de preguntes del principi.', 'Apuntem tot el que trobem.', 'En triem una de nova a l\'atzar.'], per: 'Les preguntes del principi són la brúixola de tota la recerca.' },
  { t: "Assagem i la presentació dura el doble del que tenim.", e: 4, o: ['Triem les idees més importants i traiem la resta.', 'Parlem el doble de ràpid.', 'Que ho expliqui tot una sola persona.'], per: 'Explicar bé és triar què és important.' },
  { t: 'La tauleta no té internet i havíem de buscar una dada.', e: 2, o: ['La busquem en un llibre de la biblioteca.', 'Ens quedem sense fer res.', 'Escrivim el que ens sembli.'], per: 'Sempre hi ha més d\'un lloc on buscar.' },
  { t: 'En acabar, la mestra pregunta què faríem diferent i ningú no diu res.', e: 5, o: ['Dic una cosa concreta que milloraria.', 'Espero que parli un altre.', 'Dic que tot ha estat perfecte.'], per: 'Mirar enrere amb sinceritat fa millor el pròxim projecte.' }
];

/* ---------- what a first question should not be, at the start of an expedition ---------- */
export const MALES = ["T'agrada aquest tema?", 'Quina és la teva pel·lícula preferida?', 'Quants anys té la mestra?', 'Quan és l\'hora del pati?', 'Això surt a l\'examen?'];
