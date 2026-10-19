# Auditoría: las matemáticas escondidas en la vida cotidiana

Fecha: 2026-10-19. Para quién: el hijo, 9 años, 4º de primaria en Cataluña, que juega solo y hará la AD4P en abril de 2027
(ver `docs/proves-diagnostiques/informe-4t-primaria.md`).

Pregunta: ¿qué ideas que conecten el currículum catalán de matemáticas con la vida diaria se pueden **añadir a los juegos que
ya existen** (mejor que crear juegos nuevos) para que el niño vea que las matemáticas están en todas partes?

Cómo se hizo: se leyó el `logic.js` de los 20 juegos y los mensajes de commit. Además se leyeron directamente el anexo de
Matemàtiques del Decret 175/2022, las «20 propostes d'educació matemàtica en família» del CREAMAT y kumon.es/matematicas.
De Innovamat solo hubo resúmenes de búsqueda (su blog no cargaba).

## Resumen

- Mucha vida real en: **mercat, detectius, nenúfars, volta al món y fira**.
- Tres carencias de fondo:
  1. **No hay tiempo ni calendario.** Ningún juego trabaja la lectura de la hora, las duraciones ni contar días. Es un
     contenido exacto de 3r-4t y entra en el bloque de medida de la AD4P. Comprobado con grep: «rellotge» solo sale como
     fracción (mitja hora = 30 min), como ángulo de las agujas y en los casos de cine de detectius.
  2. **La vida real llega tarde.** En comptaquilòmetres los datos reales están en el último proyecto («El viatge»). En
     nenúfars, «Al món real» es el círculo 5.
  3. **Siete juegos son pura abstracción:** àbac, coet-multiplicador, coet-programador, salts de granota, escacs, rutina y
     repeteix els llums. El cursus de l'estany usa cuentos de ranas, que tampoco son vida real.

## Estado de las ideas (para ir decidiendo)

| # | Idea | Juego | Valor | Estado |
|---|------|-------|-------|--------|
| 1 | Horario y calendario | detectius | alto | decidida (2026-10-19): proyecto nuevo con reloj de agujas; falta implementarla |
| 2 | Cocina y nevera en lugar de química difícil | laboratori | alto | decidida (2026-10-19): la cocina primero y la química al final, 8 proyectos en 3 círculos. C0 «La cuina»: «La nevera» (nuevo: briks, botellas, kg/g, l/ml) y «La recepta» (recetas reales, para 4 → para 6 o 2). C1: «El tant per cent» y «Dissolucions» (zumos y bebidas en lugar de oro y bronce). C2 «La química»: elements, molècules, reaccions y el gran experiment. Las estrellas guardadas viajan con su proyecto al reordenar. Falta implementarla |
| 3 | Divisiones donde importa qué hacer con el resto | cursus de l'estany | alto | decidida (2026-10-19): en «El racó de pensar», añadir 5-6 situaciones reales (autobús de excursión, hueveras, cromos, mesas de cumpleaños, ascensor, pizzas) junto a las de ranas, con las mismas 4 preguntas sobre el resto; los ejercicios de los proyectos no cambian. Falta implementarla |
| 4 | El niño recoge sus propios datos | observatori | alto | aplazada (2026-10-19): el Observatori se queda como está por ahora |
| 5 | El tiquet con una errada | mercat | medio-alto | decidida (2026-10-19): «L'error del tiquet», la estimación y el 3×2 ya existían. Se añaden tiquets con las líneas bien y el total mal (cazarlo estimando) y un tipo «tiquet» en «Caça l'errada», cambiando niveles existentes, sin proyecto nuevo. Falta implementarla |
| 6 | Contexto para negativos y complementos | salts de granota | medio-alto | decidida (2026-10-19): solo una frase real en la explicación del principio (el ejemplo resuelto) de los proyectos de Sota zero (termómetro, ascensor, aparcamiento) y de Amics del 10 / del 100 (el cambio de un billete); los problemas siguen siendo números solos. Falta implementarla |
| 7 | Panot de Barcelona y cuadrícula del Eixample | taller de píxels / volta al món | medio | pendiente |
| 8 | Datos reales desde los primeros proyectos | comptaquilòmetres | medio | pendiente |
| 9 | Tarjeta «Busca-ho a casa» al validar un proyecto | todos los cursus | alto en relación con su coste | pendiente |

## 1. Cómo están hoy los juegos

| Vida real | Juegos |
|---|---|
| **Mucha** | detectius (mercado, excursión, cine, pastelería), mercat (euros, cambio, kilos, hucha), nenúfars (pizzas, recetas, descuentos), volta al món (piscina olímpica, escala Barcelona-París), fira (menús, helados, candados) |
| **Media** | concert (canciones), observatori (sobre todo fútbol y One Piece, poco de su día a día), comptaquilòmetres (datos reales solo en el último proyecto), taller de píxels (pantallas y consolas) |
| **Ninguna** | àbac, coet-multiplicador, coet-programador, salts de granota, escacs, rutina, repeteix els llums, cursus de l'estany (cuentos de ranas) |
| No son de mates | robot dels pronoms (catalán), l'estany parla anglès (inglés) |

**Cobertura de los bloques de la AD4P** (20 ítems de matemáticas: 5 números, 4 medida, 4 espacio, 2 álgebra, 5 estadística):

- **Números:** sobrado (àbac, coet-multiplicador, comptaquilòmetres, cursus, salts, rutina, nenúfars, mercat, detectius).
- **Espacio:** bien cubierto (volta al món, taller de píxels, escacs, repeteix els llums, coet-programador).
- **Álgebra:** coet-programador, concert (proporciones) y taller de píxels (patrones).
- **Estadística:** fira (probabilidad) y observatori (gráficos). El niño **solo lee** datos, nunca los recoge.
- **Medida:** el bloque más flojo. Hay euros (mercat), kg/g (mercat, detectius), km (comptaquilòmetres) y cm (concert).
  **No hay hora, duraciones ni calendario**, y casi no hay l/ml.
- **Socioafectivo:** nada específico; solo el marco común (la rana guía, las pistas, las insignias).

**Contenidos que van más allá de 3r-4t** según el anexo del Decret 175/2022:

- porcentajes (laboratori, nenúfars, observatori, taller de píxels);
- números negativos («Sota zero» en salts de granota);
- multiplicar 3 cifras × 3 cifras (coet-multiplicador);
- los 28 elementos químicos y las fórmulas del laboratori.

No se propone quitarlos, pero no ayudan a preparar la prueba.

## 2. Ideas para añadir a juegos existentes (de más a menos valor)

### 1. ⭐ Detectius: un proyecto nuevo, «L'horari i el calendari»

- **Situaciones:**
  - «El bus surt a les 17:50 i triga 35 min. A quina hora arriba?»
  - «Quants dies falten per Sant Jordi?»
  - «D'aquí a 2 setmanes i 3 dies» (la AD4P de 2025 tenía una pregunta así).
  - Un horario de Rodalies dibujado por nosotros, sin capturas reales.
- **Por qué:** tapa la carencia más grande. Además, detectius es el juego más parecido a la prueba.
- **Cuánto cuesta:**
  - un caso nuevo es una plantilla `T.x1 = r => {...}` de unas 8 líneas, más una entrada en `TITLE`;
  - el proyecto necesita una letra nueva para su lugar, con su escena en `art.js` (`placeOf` en `main.js` elige la escena
    por la primera letra del id del caso).
- **Otros temas que también faltan en detectius:** la temperatura, las marcas deportivas, las recetas con proporciones, los
  mapas con distancias y el reciclaje.

### 2. ⭐ Laboratori: cambiar la química difícil por la cocina y la nevera

- **Qué quitar:** los 28 elementos y fórmulas como CH₄ o la glucosa, que van mucho más allá de 4º.
- **Qué poner:**
  - equivalencias de medida: «Quantes ampolles de 250 ml omplen el brik d'1 l?», ordenar productos por cantidad
    (1 kg = 1000 g, 1 l = 1000 ml);
  - en «Dissolucions», un zumo concentrado que se mezcla 1:4;
  - en «La recepta», una receta para 4 personas que hay que hacer para 6 o para 2. La AD4P de 2026 tenía una pregunta de
    proporción: «1 kg omple 2 testos i 1 jardinera; quants per a 6 i 3?».
- **Por qué:** refuerza el bloque de medida justo donde los niños más se equivocan, que son las equivalencias.
- **Cuánto cuesta:** cambiar el contenido de niveles que ya existen, con el ayudante `st()` y niveles `ask(...)`. El número
  de proyectos no cambia.

### 3. ⭐ Cursus de l'estany (dividir): situaciones donde importa qué hacer con el resto

- **Situaciones:**
  - «213 alumnes, 50 per autobús»: hacen falta 5 autobuses, no 4,26;
  - huevos en docenas, cromos en sobres, pizzas, billetes.
- **Cuánto cuesta:** la lista `GROUPED` de `raco.js` tiene 5 situaciones `{set, art, things, boxes, full, one, ask}`. Cada
  una nueva son unas 3 líneas.
- **Extra:** hoy las historias solo salen en «El racó de pensar», que es opcional y da puntos aparte. Los ejercicios son
  números solos (`[84,4,[80,4]]`). Estaría bien que salieran también allí, pero eso obliga a tocar `scripts/check-cursus.mjs`,
  que tiene fijas las 120 preguntas.

### 4. ⭐ Observatori: que el niño recoja sus propios datos

- **Cómo:**
  - un nivel con una tarjeta, por ejemplo «Compta les sabates que hi ha a casa, apunta-ho i fes-ne el gràfic»;
  - el niño escribe sus números y el juego dibuja el gráfico;
  - es para él solo, aunque pueda ayudarle un adulto.
- **Datos de su día a día para añadir:**
  - el tiempo de esta semana en Barcelona, en pictograma, sin temperaturas bajo cero;
  - la basura de casa en una semana;
  - el tiempo de pantalla;
  - la paga a lo largo de los meses;
  - un diagrama de Gantt del horario de la mañana.
- **Por qué:** el currículum lo pide así. El criterio 6.1 habla de «reconèixer i utilitzar les matemàtiques presents en la
  vida quotidiana usant els processos de la investigació: inferir, mesurar, comunicar, classificar, predir». Ahora mismo el
  juego solo pide leer gráficos.
- **Cuánto cuesta:** `SETS`, `VENNS`, `GANTTS` y `STATS` son tablas de datos, así que los conjuntos de datos nuevos salen
  baratos. Los datos que escribe el niño no hace falta guardarlos.
- Ya existe un nivel con un eje que no empieza en cero (gráficos que engañan). Se puede ampliar con titulares que no
  cuadran con los datos (CREAMAT n.º 9 y 12).

### 5. Mercat: el tiquet con una errada

- **Cómo:** un tiquet del súper con una línea mal multiplicada o un total que no cuadra. El niño toca la línea mala. Es una
  versión cotidiana de «Caça l'errada» (CREAMAT n.º 7 y 11).
- **Otras ideas cercanas:**
  - estimar el total de un carro con un deslizador, y el juego dice «t'has passat 3 €» (como Estimation 180);
  - ofertas 3×2 frente a «la segona a meitat de preu», siempre con números enteros.
- **Ojo:** mercat ya tiene «El tiquet», «Calcula a ull», «Ofertes i paquets» y «La guardiola». Lo haría cambiando niveles u
  hojas de errores, sin proyecto nuevo.

### 6. Salts de granota: contexto para los negativos y los complementos

- En «Sota zero» (círculo 5): el termómetro, el ascensor y el aparcamiento subterráneo.
- En «Els amics del 10» y del 100: el cambio de un billete de 10 € o de 100 €.
- **Cuánto cuesta:** los 23 proyectos generan sus problemas solos, así que basta con añadir una frase de contexto. Hoy el
  juego no tiene ninguna situación de la vida real (grep sin resultados para temperatura, ascensor o diners).

### 7. Taller de píxels / volta al món: el panot de Barcelona y el Eixample

- En «Mosaics» o «Miralls»: completar un trozo de panot eligiendo qué movimiento hace falta (trasladar, girar o reflejar).
- En «El mapa» o «A escala»: itinerarios por la cuadrícula del Eixample, con calles paralelas y perpendiculares, y el
  perímetro de una manzana.
- **Por qué:** es simetría del entorno; el currículum pide «traslacions, girs i simetries en elements de l'entorn» y la AD4P
  de 2026 tenía una pregunta de simetría. Además le da un toque catalán.
- Es idea propia: no se encontró una fuente didáctica que relacione el panot con los mosaicos geométricos.

### 8. Comptaquilòmetres: datos reales desde los primeros proyectos

- `thing(emoji, caption, n, unit)` y `order([{n,e,cap,unit}])` aceptan cualquier dato en una línea.
- **Qué añadir:** habitantes de pueblos y ciudades de Cataluña, aforos de estadios, precios y más carteles de carretera.
  Comprobar las cifras antes de ponerlas.
- El nivel «Quin té sentit?» (`sense()`, órdenes de magnitud) también sirve para estimar.

### 9. La tarjeta «Busca-ho a casa» al validar un proyecto

- **Cómo:** una frase opcional, por ejemplo «Mira el tiquet del súper de casa: quin és el producte més car?», «Busca un
  rellotge de busques i digues quina hora marca», «Quantes rajoles té el passadís?».
- **Cuánto cuesta:** no guarda nada; es texto en cada proyecto.
- **Por qué:** es lo que más directamente sirve al objetivo de que vea las matemáticas en todas partes.

## 3. Descartadas

- **Fibonacci en piñas y girasoles:** es de ESO y no sale en la AD4P; el «¡ahá!» no compensa.
- **Sumar las cifras de las matrículas:** es un calentamiento, no enseña nada nuevo.
- **Disfrazar coet-multiplicador de «precio × cantidad»:** solo cambia el texto, no el aprendizaje.
- **Escacs como plano de una ciudad:** obliga a hacer una escena nueva y las coordenadas ya están bien trabajadas.
- **Fotografía matemática (solo poner etiquetas):** se queda en truco si después no hay que medir o contar.
- **Castells (cuántos hay en cada piso):** mucho sabor catalán y poca decisión matemática. En reserva.
- **Rutina y àbac:** no tocarlos. Están pensados para mecanizar, y meterles historias los alargaría.
- **El tema común de la AD4P:** no diseñar solo para el reciclaje. El tema de 2027 aún no se conoce.

## 4. Experiencia de juego: qué copiar de Kumon e Innovamat

- **Kumon** (verificado en kumon.es/matematicas): pasos pequeños, dominar cada habilidad antes de avanzar, empezar por el
  nivel real y no por la edad, hojas diarias y aprendizaje autónomo. Ya está en el repo: proyectos que se validan con 80,
  la Piscina y la rutina con repaso espaciado. No hay que añadir nada.
- **El primer nivel con vida real debe ser una victoria segura** (un tiquet de dos líneas), y no un problema de varios
  pasos. Hoy los niveles de porcentajes del laboratori tienen de 3 a 5 pasos.
- **Pistas por escalones que no regalen la respuesta.** Es el consejo de «evita los espóilers» de Innovamat (solo visto en
  resúmenes de búsqueda).
- **MMACA** (museo de matemáticas de Cataluña, en Cornellà): como salida en familia, no como parte del juego.
  https://mmaca.cat/

## 5. Al implementar cualquiera de estas ideas

- Los proyectos nuevos van **al final** de `PROJECTS`, aunque pertenezcan a un círculo que ya existe. Las estrellas se
  guardan por posición: si se inserta un proyecto en medio, las estrellas guardadas se mueven a otros niveles.
- Cada proyecto tiene **exactamente 10 niveles**. `exOf` los reparte 3/3/4, la nota es de 10 × 10 y los exámenes sacan
  sus preguntas de esos 10 niveles.
- **Mejor no crear círculos nuevos.** Un círculo nuevo añade un examen, y las insignias de «todos los exámenes»
  (`exams.every`) se volverían a bloquear a quien ya las tenía.
- Hay que **subir el `total`** en `shared/games.js` (`check.mjs` lo compara con `PROJECTS.length`) y ejecutar
  `node scripts/check-golden.mjs --write` una vez. Antes, comprobar en el diff que `clean`, `badges` y `noteOf` no cambian.
- El **cursus de l'estany** y el **àbac** no tienen 10 niveles por proyecto: tienen 3 ejercicios × 5 preguntas, y
  `scripts/check-cursus.mjs` tiene fijas las 120 preguntas del cursus.
- **Mapas con un número fijo de paradas:** comptaquilòmetres (`tripMap`, 9 puntos) y fira (`fairMap`, 9). Un proyecto
  nuevo obliga a tocar el dibujo.
- Los **textos nuevos** van con los ayudantes de gramática de cada juego (mercat `de()`, observatori `fill()`/`ca()`),
  para que los artículos y las elisiones salgan bien.
- El **azar** solo puede venir de `rnd`, y `logic.js` no puede usar nada del navegador.
- Un **número correcto** cuenta al momento, sin pulsar ✓.

## Fuentes

- Decret 175/2022, anexo 2 de Matemàtiques:
  https://www.sindicat.net/wp-content/uploads/2023/05/decret175_annex_2_Matematiques.pdf
  - Criterios 5.2 y 6.1: conexiones con la vida cotidiana.
  - Saberes de 3r-4t:
    - euros y céntimos en ingresos, gastos y ahorro;
    - km/m/cm/mm, kg/g y l/ml «en problemes de la vida quotidiana»;
    - la hora con minutos, en reloj analógico y digital;
    - itinerarios en planos;
    - pictogramas, barras y moda;
    - comparar intuitivamente la probabilidad de dos sucesos;
    - números hasta 9.999 y fracciones con denominador hasta 10.
- CREAMAT/XTEC, «20 propostes d'educació matemàtica en família»:
  https://serveiseducatius.xtec.cat/cesire/wp-content/uploads/usu2650/2023/03/matematiques_en_familia_activitats.pdf
- Kumon: https://www.kumon.es/matematicas
- Estimation 180: https://www.estimation180.com/
- MMACA: https://mmaca.cat/
- Fibonacci (descartada): https://fractalfoundation.org/resources/fractivities/Fibonacci-Sequence-and-Spirals/
- Concurso de fotografía matemática (XTEC):
  https://agora.xtec.cat/ceiptorresjonama/wp-content/uploads/usu279/2020/06/Matemàtiques.-Setmana-9.pdf

**No verificado:**

- El cuaderno oficial de matemáticas de la AD4P no se pudo abrir; lo que se dice de la prueba sale de
  `docs/proves-diagnostiques/`.
- De Innovamat, NRICH, Bedtime Math y Youcubed solo se vieron resúmenes de búsqueda.
- Las ideas del panot, los castells y la fotografía matemática son propias, sin fuente didáctica.
