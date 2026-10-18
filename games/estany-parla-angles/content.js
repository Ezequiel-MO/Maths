// What the pond says in English: the words of the album, the people of the radio, the facts of «True or false?», the texts to read
// and the sentences to build. Shaped after the English tests of the «avaluació de diagnòstic» of 4t (2023-24 «Dreaming of space»,
// 2024-25 «I love birds», 2025-26 «The blue, green and yellow bins»): a person who talks about themself, sentences that are true or
// false according to what is heard, and a text with headings to read. Nothing here knows the page or the progress.

/* ---------- the words of the album ---------- */
// key|picture|word|group. A picture is an emoji, «~#hex» a colour and «=n» a number. The album keeps one boolean per word in this
// order, so a word is only ever added at the end of the list, never moved or taken out.
const RAW = `
red|~#E8443A|red|col
blue|~#3B7BE8|blue|col
green|~#3DB874|green|col
yellow|~#F7D24E|yellow|col
orange|~#FF8C2F|orange|col
purple|~#8E5CD9|purple|col
pink|~#FF8FC8|pink|col
brown|~#8A5A2B|brown|col
black|~#1A1A1A|black|col
white|~#FFFFFF|white|col
grey|~#9AA3A8|grey|col
n1|=1|one|num
n2|=2|two|num
n3|=3|three|num
n4|=4|four|num
n5|=5|five|num
n6|=6|six|num
n7|=7|seven|num
n8|=8|eight|num
n9|=9|nine|num
n10|=10|ten|num
n11|=11|eleven|num
n12|=12|twelve|num
n13|=13|thirteen|num
n14|=14|fourteen|num
n15|=15|fifteen|num
n16|=16|sixteen|num
n17|=17|seventeen|num
n18|=18|eighteen|num
n19|=19|nineteen|num
n20|=20|twenty|num
n30|=30|thirty|num
n40|=40|forty|num
n50|=50|fifty|num
n60|=60|sixty|num
n70|=70|seventy|num
n80|=80|eighty|num
n90|=90|ninety|num
n100|=100|a hundred|num
dog|🐶|dog|ani
cat|🐱|cat|ani
bird|🐦|bird|ani
fish|🐟|fish|ani
horse|🐴|horse|ani
cow|🐮|cow|ani
pig|🐷|pig|ani
sheep|🐑|sheep|ani
duck|🦆|duck|ani
frog|🐸|frog|ani
rabbit|🐰|rabbit|ani
mouse|🐭|mouse|ani
lion|🦁|lion|ani
tiger|🐯|tiger|ani
elephant|🐘|elephant|ani
monkey|🐵|monkey|ani
snake|🐍|snake|ani
bear|🐻|bear|ani
owl|🦉|owl|ani
butterfly|🦋|butterfly|ani
spider|🕷️|spider|ani
turtle|🐢|turtle|ani
dolphin|🐬|dolphin|ani
penguin|🐧|penguin|ani
bee|🐝|bee|ani
hen|🐔|hen|ani
eyes|👀|eyes|body
ear|👂|ear|body
nose|👃|nose|body
mouth|👄|mouth|body
hand|✋|hand|body
leg|🦵|leg|body
foot|🦶|foot|body
teeth|🦷|teeth|body
feather|🪶|feather|body
apple|🍎|apple|food
banana|🍌|banana|food
orangef|🍊|orange|food
strawberry|🍓|strawberry|food
grapes|🍇|grapes|food
bread|🍞|bread|food
cheese|🧀|cheese|food
milk|🥛|milk|food
egg|🥚|egg|food
pizza|🍕|pizza|food
cake|🍰|cake|food
chocolate|🍫|chocolate|food
icecream|🍦|ice cream|food
water|💧|water|food
juice|🧃|juice|food
carrot|🥕|carrot|food
tomato|🍅|tomato|food
sandwich|🥪|sandwich|food
biscuit|🍪|biscuit|food
salad|🥗|salad|food
chips|🍟|chips|food
tshirt|👕|T-shirt|clo
trousers|👖|trousers|clo
dress|👗|dress|clo
trainers|👟|trainers|clo
boots|👢|boots|clo
hat|👒|hat|clo
cap|🧢|cap|clo
scarf|🧣|scarf|clo
gloves|🧤|gloves|clo
socks|🧦|socks|clo
jacket|🧥|jacket|clo
shorts|🩳|shorts|clo
glasses|👓|glasses|clo
football|⚽|football|hob
basketball|🏀|basketball|hob
tennis|🎾|tennis|hob
swimming|🏊|swimming|hob
cycling|🚴|riding a bike|hob
skating|⛸️|skating|hob
reading|📚|reading|hob
painting|🎨|painting|hob
dancing|💃|dancing|hob
singing|🎤|singing|hob
guitar|🎸|playing the guitar|hob
games|🎮|video games|hob
cooking|🍳|cooking|hob
tv|📺|watching TV|hob
running|🏃|running|hob
city|🏙️|city|pla
village|🏘️|village|pla
farm|🚜|farm|pla
mountains|⛰️|mountains|pla
beach|🏖️|beach|pla
sea|🌊|sea|pla
forest|🌲|forest|pla
river|🏞️|river|pla
school|🏫|school|pla
park|🌳|park|pla
museum|🏛️|museum|pla
house|🏠|house|pla
shop|🏪|shop|pla
island|🏝️|island|pla
hospital|🏥|hospital|pla
book|📖|book|sch
pencil|✏️|pencil|sch
pen|🖊️|pen|sch
ruler|📏|ruler|sch
scissors|✂️|scissors|sch
schoolbag|🎒|schoolbag|sch
computer|💻|computer|sch
clock|⏰|clock|sch
chair|🪑|chair|sch
crayons|🖍️|crayons|sch
camera|📷|camera|sch
teddy|🧸|teddy bear|sch
car|🚗|car|tra
bus|🚌|bus|tra
train|🚆|train|tra
plane|✈️|plane|tra
boat|⛵|boat|tra
bike|🚲|bike|tra
motorbike|🏍️|motorbike|tra
rocket|🚀|rocket|tra
robot|🤖|robot|tra
star|⭐|star|tra
moon|🌙|moon|tra
sun|☀️|sun|tra
planet|🪐|planet|tra
telescope|🔭|telescope|tra
earth|🌍|Earth|tra
paper|📄|paper|rec
box|📦|box|rec
glassb|🍾|glass bottle|rec
plastic|🧴|plastic bottle|rec
can|🥫|can|rec
bin|🗑️|bin|rec
newspaper|📰|newspaper|rec
bulb|💡|light bulb|rec
battery|🔋|battery|rec
jar|🫙|jar|rec
tree|🌳|tree|nat
flower|🌸|flower|nat
leaf|🍃|leaf|nat
rain|🌧️|rain|nat
snow|❄️|snow|nat
cloud|☁️|cloud|nat
rainbow|🌈|rainbow|nat
wind|🌬️|wind|nat`;
export const VOCAB = RAW.trim().split('\n').map(l => { const [key, pic, word, cat] = l.split('|'); return { key, pic, word, cat }; });
export const W = Object.fromEntries(VOCAB.map(v => [v.key, v]));
// the groups of the album, in its order, with their name in Catalan
export const GROUPS = [['col', 'Colors'], ['num', 'Números'], ['ani', 'Animals'], ['body', 'El cos'], ['food', 'Menjar'], ['clo', 'Roba'],
  ['hob', 'Aficions'], ['pla', 'Llocs'], ['sch', "Coses de l'escola"], ['tra', 'Vehicles i espai'], ['rec', 'Reciclar'], ['nat', 'Natura']];
export const inGroup = cat => VOCAB.filter(v => v.cat === cat).map(v => v.key);

/* ---------- numbers in words ---------- */
const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
// 7 → «seven», 45 → «forty-five», 100 → «a hundred»
export function numWord(n) {
  if (n === 100) return 'a hundred';
  if (n < 20) return UNITS[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + UNITS[n % 10] : '');
}
// a word with its article: «an apple», «a pencil»
export const an = w => (/^[aeiou]/i.test(w) && !/^u[^n]/i.test(w) ? 'an ' : 'a ') + w;

/* ---------- plurals ---------- */
const PLURAL = { sheep: 'sheep', fish: 'fish', mouse: 'mice', butterfly: 'butterflies', strawberry: 'strawberries', tomato: 'tomatoes',
  bus: 'buses', box: 'boxes', glasses: 'glasses', scissors: 'scissors', teeth: 'teeth', foot: 'feet', leaf: 'leaves', sandwich: 'sandwiches', 'teddy bear': 'teddy bears' };
export const plural = w => PLURAL[w] || w + 's';

/* ---------- the people of the radio (Listening 1) ---------- */
export const PEOPLE = [['Ben', 'he'], ['Emma', 'she'], ['Carolina', 'she'], ['Tom', 'he'], ['Lucy', 'she'], ['Sam', 'he'], ['Mia', 'she'], ['Jack', 'he'],
  ['Olivia', 'she'], ['Leo', 'he'], ['Ruby', 'she'], ['Harry', 'he']];
// What a person can say about themself. Each fact has its options (the right one and the wrong ones come from them): k the album word
// shown, s what is said, and the line of the question (the start of the sentence, as in the test: «I live...»).
export const FACTS = {
  age: { line: 'I am ___ years old.', ca: 'Quants anys té?', opts: [8, 9, 10, 11, 12, 13, 15, 20, 30].map(n => ({ k: 'n' + n, pic: '=' + n, s: `I am ${numWord(n)} years old.` })) },
  live: { line: 'I live...', ca: 'On viu?', opts: [
    { k: 'city', s: 'I live in a big city.' }, { k: 'village', s: 'I live in a small village.' }, { k: 'farm', s: 'I live on a farm.' },
    { k: 'mountains', s: 'I live in the mountains.' }, { k: 'sea', s: 'I live near the sea.' }, { k: 'island', s: 'I live on an island.' }] },
  pet: { line: "I've got a...", ca: 'Quina mascota té?', opts: ['dog', 'cat', 'rabbit', 'fish', 'bird', 'horse', 'turtle', 'mouse'].map(k => ({ k, s: `I've got ${an(k)}.` })) },
  play: { line: 'I love playing...', ca: 'A què li encanta jugar?', not: true, opts: ['football', 'basketball', 'tennis', 'games'].map(k => ({ k, s: `I love playing ${k === 'games' ? 'video games' : k}.`, n: `I don't like ${k === 'games' ? 'video games' : k}.` })) },
  hobby: { line: 'I like...', ca: "Què li agrada fer?", not: true, opts: [['reading', 'reading'], ['painting', 'painting'], ['dancing', 'dancing'], ['singing', 'singing'], ['cooking', 'cooking'],
    ['skating', 'skating'], ['swimming', 'swimming'], ['cycling', 'riding my bike']].map(([k, w]) => ({ k, s: `I like ${w}.`, n: `I don't like ${w}.` })) },
  wear: { line: 'I always wear...', ca: 'Què porta sempre?', opts: [['cap', 'a cap'], ['hat', 'a hat'], ['scarf', 'a scarf'], ['glasses', 'glasses'], ['trainers', 'trainers'], ['jacket', 'a jacket']]
    .map(([k, w]) => ({ k, s: `I always wear ${w}.` })) },
  food: { line: 'My favourite food is...', ca: 'Quin és el seu menjar preferit?', not: true, opts: [['pizza', 'pizza'], ['chips', 'chips'], ['salad', 'salad'], ['sandwich', 'sandwiches'],
    ['icecream', 'ice cream'], ['cake', 'chocolate cake'], ['strawberry', 'strawberries']].map(([k, w]) => ({ k, s: `My favourite food is ${w}.`, n: `I don't like ${w}.` })) },
  colour: { line: 'My favourite colour is...', ca: 'Quin és el seu color preferit?', opts: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black'].map(k => ({ k, s: `My favourite colour is ${k}.` })) },
  can: { line: 'I can...', ca: 'Què sap fer?', not: true, opts: [['swimming', 'swim'], ['guitar', 'play the guitar'], ['skating', 'skate'], ['cooking', 'cook'], ['dancing', 'dance'], ['singing', 'sing'], ['cycling', 'ride a bike']]
    .map(([k, w]) => ({ k, s: `I can ${w}.`, n: `I can't ${w}.` })) },
  go: { line: 'I go to school by...', ca: "Com va a l'escola?", opts: ['bus', 'bike', 'car', 'train'].map(k => ({ k, s: `I go to school by ${k}.` })) }
};
// the last question of a Listening 1, with words as options: what makes them happy says what they love
export const LOVES = [['animals', 'Animals make me happy!'], ['nature', 'Nature makes me happy!'], ['music', 'Music makes me happy!'], ['books', 'Books make me happy!'],
  ['sport', 'Sport makes me happy!'], ['computers', 'Computers make me happy!'], ['cars', 'Cars make me happy!'], ['puzzles', 'Puzzles make me happy!']];
// the jobs of the grown-ups who come to talk, for the first line
export const ROLES = ['an English assistant at our school', 'a birdwatcher', 'a scientist at the museum', 'a farmer', 'a swimming teacher', 'an astronaut'];

/* ---------- the topics of «True or false?» (Listening 2) ---------- */
// [the true word | the wrong ones]: what is heard is always true; the sentence printed is the same, or has one of the wrong words
export const TOPICS = [
  { name: 'Recycling', en: 'Ben explains why recycling is important.', ca: 'En Ben explica per què és important reciclar.', pic: '♻️', lines: [
    'Recycling is [good|bad] for the Earth.', 'Recycling makes [less|more] trash.', 'We [separate|mix] things to recycle.', 'Paper goes in the [blue|green] bin.',
    'We can make new [bottles|apples] with old glass.', 'Recycling [saves|wastes] water.'] },
  { name: 'Birds', en: 'Emma, a birdwatcher, talks about birds.', ca: "L'Emma, que observa ocells, parla dels ocells.", pic: '🐦', lines: [
    'Birds have got [two|four] legs.', 'Birds have got [feathers|hair].', 'Some birds can [swim|read].', 'Birds make nests with [branches|stones].',
    'Some birds eat [insects|chocolate].', 'Birds can live [near the sea|on the Moon].', 'I use [binoculars|a microscope] to watch birds.'] },
  { name: 'Space', en: 'Carolina is dreaming of space.', ca: "La Carolina somia amb l'espai.", pic: '🚀', lines: [
    'Stars are like big [balls|boxes] in the sky.', 'We need [telescopes|glasses] to see distant stars.', 'The Sun is very [hot|cold].',
    'There are [eight|three] planets around the Sun.', 'Astronauts travel in [rockets|buses].', 'At night we can see the [Moon|Sun].'] },
  { name: 'The sea', en: 'Lucy is on a boat. She talks about the sea.', ca: 'La Lucy és en una barca i parla del mar.', pic: '🐬', lines: [
    'Dolphins are very [clever|slow] animals.', 'Sea water is [salty|sweet].', 'Fish live [under the water|on the beach].', 'Turtles can live for [a hundred|two] years.',
    'Sharks have got a lot of [teeth|legs].', 'An octopus has got [eight|ten] arms.'] },
  { name: 'Healthy food', en: 'Mr Brown, the teacher, talks about food.', ca: 'El senyor Brown, el mestre, parla del menjar.', pic: '🍎', lines: [
    'Fruit is [good|bad] for you.', 'Drink [water|cola] every day.', 'Carrots are [orange|blue].', 'Milk comes from [cows|hens].',
    'Eggs come from [hens|cows].', "Don't eat [sweets|vegetables] every day."] },
  { name: 'The weather', en: 'Tom talks about the weather.', ca: 'En Tom parla del temps.', pic: '🌦️', lines: [
    'In winter it is [cold|hot].', 'In summer we go to the [beach|snow].', 'When it rains we use [an umbrella|a ball].', 'Snow is [white|green].',
    'There is a rainbow after the [rain|night].', 'In autumn the leaves [fall|sing].'] },
  { name: 'Plants', en: 'Olivia has got a garden. She talks about plants.', ca: "L'Olivia té un jardí i parla de les plantes.", pic: '🌻', lines: [
    'Plants need [water|chocolate] and sun.', 'Trees have got [leaves|feathers].', 'Bees love [flowers|stones].', 'Flowers grow in [spring|winter].',
    'Apples grow on [trees|the sea].', 'Some plants are very [tall|loud].'] }
];

/* ---------- the texts to read ---------- */
// Each text: title, intro, sections (h the heading, pic, body), vocabulary with its meaning (the words with * in the test), and its
// questions. A question is { q, o: [right, wrong, wrong], s (the section that answers it, -1 the intro) }, or { tf, a, s }, or
// { order: true } (the order of the sections) or { about: [right, wrong, wrong] }. o may be album keys with pics: true.
export const TEXTS = {
  short: [
    { title: "Hello, I'm Emma!", pic: '👧', intro: '', vocab: [], secs: [{ h: 'ABOUT ME', pic: '👧',
      body: "Hello! My name is Emma. I am nine years old. I live in a small village near the mountains. I've got a dog. His name is Max. My favourite colour is purple. I love painting and dancing." }],
      qs: [{ q: 'How old is Emma?', o: ['nine', 'eight', 'ten'], s: 0 }, { q: 'Emma lives in a...', o: ['village', 'city', 'farm'], pics: true, s: 0 },
        { q: 'Emma has got a...', o: ['dog', 'cat', 'rabbit'], pics: true, s: 0 }, { tf: "Emma's favourite colour is green.", a: false, s: 0 }, { tf: 'Emma loves painting.', a: true, s: 0 }] },
    { title: 'My pet Bubbles', pic: '🐟', intro: '', vocab: [['bowl', 'peixera']], secs: [{ h: 'MY PET', pic: '🐟',
      body: "This is my fish. Its name is Bubbles. Bubbles is orange and white. It lives in a big glass bowl* in my bedroom. Bubbles eats fish food every morning. It can swim very fast, but it can't walk!" }],
      qs: [{ q: 'What is Bubbles?', o: ['fish', 'cat', 'bird'], pics: true, s: 0 }, { q: 'Bubbles is...', o: ['orange and white', 'black', 'blue and green'], s: 0 },
        { q: 'Where does Bubbles live?', o: ['In a glass bowl.', 'In the garden.', 'In the sea.'], s: 0 }, { tf: 'Bubbles eats fish food every morning.', a: true, s: 0 }, { tf: 'Bubbles can walk.', a: false, s: 0 }] },
    { title: "Sam's school bag", pic: '🎒', intro: '', vocab: [['pencil case', 'estoig'], ['rubber', 'goma']], secs: [{ h: 'MY BAG', pic: '🎒',
      body: "Hi! I'm Sam. Look at my school bag! It is blue and red. In my bag, I've got two books, a pencil case* and a ruler. In my pencil case, there are three pencils and a rubber*. I haven't got scissors. I've got a sandwich and an apple for lunch." }],
      qs: [{ q: "Sam's bag is...", o: ['blue and red', 'green', 'yellow and black'], s: 0 }, { q: 'How many books has Sam got?', o: ['two', 'three', 'four'], s: 0 },
        { q: 'For lunch, Sam has got...', o: ['a sandwich and an apple', 'pizza', 'chocolate cake'], s: 0 }, { tf: 'There are three pencils in the pencil case.', a: true, s: 0 }, { tf: 'Sam has got scissors.', a: false, s: 0 }] }
  ],
  medium: [
    { title: 'Penguins', pic: '🐧', intro: "Penguins are amazing birds. Let's learn about them!", vocab: [['swimmers', 'nedadors']], secs: [
      { h: 'DESCRIPTION', pic: '🐧', body: "Penguins are black and white. They have got two wings, but they can't fly. They are very good swimmers*." },
      { h: 'HABITAT', pic: '❄️', body: 'Many penguins live in very cold places, near the sea. Some penguins live in hot places too!' },
      { h: 'FOOD', pic: '🐟', body: 'Penguins eat fish. They catch the fish in the sea.' }],
      qs: [{ q: 'Penguins are...', o: ['black and white', 'brown', 'yellow and red'], s: 0 }, { q: 'Penguins can...', o: ['swim', 'fly', 'sing'], s: 0 },
        { q: 'Penguins eat...', o: ['fish', 'apple', 'bread'], pics: true, s: 2 }, { order: true }, { tf: 'Penguins can fly.', a: false, s: 0 }, { about: ['birds', 'fish', 'snakes'] }] },
    { title: 'Sunday at the park', pic: '🌳', intro: 'Leo and his family go to the park on Sundays.', vocab: [['swings', 'gronxadors'], ['slide', 'tobogan'], ['lake', 'llac']], secs: [
      { h: 'GAMES', pic: '⚽', body: 'In the park, there are swings* and a big slide*. Leo loves playing football with his sister.' },
      { h: 'ANIMALS', pic: '🦆', body: 'There is a lake* with ducks. Leo gives the ducks bread.' },
      { h: 'LUNCH', pic: '🧺', body: 'At one o’clock, the family has a picnic. They eat sandwiches, fruit and cheese.' }],
      qs: [{ q: 'When does Leo go to the park?', o: ['On Sundays.', 'On Mondays.', 'Every day.'], s: -1 }, { q: 'Leo loves playing...', o: ['football', 'tennis', 'basketball'], pics: true, s: 0 },
        { q: 'In the lake there are...', o: ['duck', 'fish', 'frog'], pics: true, s: 1 }, { q: 'The family has a picnic at...', o: ['one o’clock', 'five o’clock', 'ten o’clock'], s: 2 },
        { tf: 'Leo plays football with his brother.', a: false, s: 0 }, { tf: 'They eat sandwiches.', a: true, s: 2 }] },
    { title: "Mia's week", pic: '📅', intro: "Hi! I'm Mia. I'm very busy!", vocab: [['lessons', 'classes'], ['busy', 'enfeinada']], secs: [
      { h: 'MONDAY AND WEDNESDAY', pic: '🏊', body: 'On Mondays and Wednesdays I go swimming after school.' },
      { h: 'TUESDAY AND THURSDAY', pic: '🎸', body: 'On Tuesdays and Thursdays I have guitar lessons*. I can play three songs!' },
      { h: 'FRIDAY', pic: '🍕', body: 'On Fridays we eat pizza at home and we watch a film.' },
      { h: 'THE WEEKEND', pic: '🚲', body: 'At the weekend I ride my bike with my dad.' }],
      qs: [{ q: 'On Mondays, Mia goes...', o: ['swimming', 'skating', 'dancing'], pics: true, s: 0 }, { q: 'Mia can play ___ songs on the guitar.', o: ['three', 'two', 'four'], s: 1 },
        { q: 'On Fridays they eat...', o: ['pizza', 'fish', 'salad'], pics: true, s: 2 }, { q: 'Mia rides her bike with her...', o: ['dad', 'mum', 'grandma'], s: 3 },
        { tf: 'Mia has guitar lessons on Tuesdays.', a: true, s: 1 }, { order: true }] }
  ],
  long: [
    { title: 'Amazing dolphins', pic: '🐬', intro: 'Lucy is on holiday near the sea. She goes on a boat trip to watch dolphins. She wants to learn everything about them!',
      vocab: [['mammals', 'mamífers'], ['squid', 'calamars'], ['whistles', 'xiulets']], secs: [
      { h: 'DESCRIPTION', pic: '🐬', body: 'Dolphins are grey. They have got a long nose, two fins and a tail. Dolphins are not fish: they are mammals*.' },
      { h: 'HABITAT', pic: '🌊', body: 'Dolphins live in the sea and in some big rivers. They live in groups called pods.' },
      { h: 'FOOD', pic: '🐟', body: 'Dolphins eat fish and squid*. They catch their food with their teeth.' },
      { h: 'COMMUNICATION', pic: '🎵', body: 'Dolphins talk to each other with clicks and whistles*. They can also jump very high!' }],
      qs: [{ q: 'Lucy is on holiday near the...', o: ['sea', 'mountains', 'river'], pics: true, s: -1 }, { q: 'Dolphins are...', o: ['grey', 'green', 'yellow'], s: 0 },
        { q: 'Dolphins live in groups called...', o: ['pods', 'nests', 'bins'], s: 1 }, { q: 'Dolphins eat...', o: ['fish and squid', 'fruit and vegetables', 'bread and cheese'], s: 2 },
        { order: true }, { about: ['dolphins', 'boats', 'holidays'] },
        { tf: 'Dolphins are fish.', a: false, s: 0 }, { tf: 'Dolphins have got a tail.', a: true, s: 0 }, { tf: 'Dolphins talk with clicks and whistles.', a: true, s: 3 }, { tf: "Dolphins can't jump.", a: false, s: 3 }] },
    { title: 'Looking at the Moon', pic: '🌙', intro: 'Tom loves looking at the sky at night. He has got a telescope in his bedroom. Tonight he is looking at the Moon.',
      vocab: [['rock', 'roca'], ['craters', 'cràters'], ['air', 'aire']], secs: [
      { h: 'DESCRIPTION', pic: '🌙', body: 'The Moon is a big ball of rock*. It is grey and it has got a lot of holes called craters*.' },
      { h: 'LIGHT', pic: '☀️', body: "The Moon doesn't make light. The light of the Moon comes from the Sun." },
      { h: 'ASTRONAUTS', pic: '🚀', body: 'In 1969, astronauts walked on the Moon for the first time. They travelled in a rocket.' },
      { h: 'NO AIR', pic: '🧑‍🚀', body: "There is no air* and no water on the Moon. People can't live there." }],
      qs: [{ q: 'Tom has got a ___ in his bedroom.', o: ['telescope', 'computer', 'rocket'], pics: true, s: -1 }, { q: 'The Moon is a big ball of...', o: ['rock', 'ice', 'cheese'], s: 0 },
        { q: 'The light of the Moon comes from the...', o: ['Sun', 'stars', 'Earth'], s: 1 }, { q: 'Astronauts walked on the Moon for the first time in...', o: ['1969', '1996', '2024'], s: 2 },
        { order: true }, { about: ['the Moon', 'the Sun', "Tom's bedroom"] },
        { tf: 'The Moon is grey.', a: true, s: 0 }, { tf: 'The Moon makes its own light.', a: false, s: 1 }, { tf: 'The astronauts travelled in a rocket.', a: true, s: 2 }, { tf: 'There is water on the Moon.', a: false, s: 3 }] },
    { title: 'Healthy food', pic: '🍎', intro: 'Today, the children of 4th grade are learning about food. Their teacher, Mr Brown, explains how to eat well.',
      vocab: [['especially', 'sobretot'], ['sweets', 'llaminadures']], secs: [
      { h: 'FRUIT AND VEGETABLES', pic: '🍎', body: 'Eat fruit and vegetables every day. Apples, oranges, carrots and tomatoes are very good for you.' },
      { h: 'WATER', pic: '💧', body: 'Drink a lot of water, especially* when it is hot or when you do sport.' },
      { h: 'BREAKFAST', pic: '🥛', body: 'Breakfast is very important. Milk, bread and fruit are a good breakfast.' },
      { h: 'SWEETS', pic: '🍫', body: "Chocolate, cakes and sweets* are nice, but don't eat them every day!" }],
      qs: [{ q: "The teacher's name is...", o: ['Mr Brown', 'Mr Green', 'Mrs White'], s: -1 }, { q: 'Eat fruit and vegetables...', o: ['every day', 'never', 'on Sundays'], s: 0 },
        { q: 'Drink a lot of water when...', o: ['it is hot', 'it is cold', 'you sleep'], s: 1 }, { q: 'A good breakfast is...', o: ['milk, bread and fruit', 'chocolate and cake', 'chips and pizza'], s: 2 },
        { order: true }, { about: ['healthy food', 'sports', 'the school'] },
        { tf: 'Carrots are good for you.', a: true, s: 0 }, { tf: "Breakfast isn't important.", a: false, s: 2 }, { tf: 'You can eat cakes every day.', a: false, s: 3 }, { tf: 'Drink water when you do sport.', a: true, s: 1 }] },
    { title: 'A day at the farm', pic: '🚜', intro: 'Carla and her class visit a farm. The farmer, Mrs Hill, shows them the animals.',
      vocab: [['collects', 'recull'], ['field', 'camp'], ['potatoes', 'patates']], secs: [
      { h: 'COWS', pic: '🐮', body: 'There are twelve cows on the farm. They are black and white. Cows give us milk.' },
      { h: 'HENS', pic: '🐔', body: 'The hens live in a small house. Every morning, Mrs Hill collects* the eggs.' },
      { h: 'HORSES', pic: '🐴', body: 'There are two brown horses. Children can ride them in the field*.' },
      { h: 'VEGETABLES', pic: '🥕', body: 'The farm has got a big garden with carrots, potatoes* and tomatoes.' }],
      qs: [{ q: "The farmer's name is...", o: ['Mrs Hill', 'Mrs Brown', 'Carla'], s: -1 }, { q: 'How many cows are there?', o: ['twelve', 'two', 'twenty'], s: 0 },
        { q: 'Cows give us...', o: ['milk', 'egg', 'cheese'], pics: true, s: 0 }, { q: 'The horses are...', o: ['brown', 'white', 'black'], s: 2 },
        { order: true }, { about: ['a farm', 'a zoo', 'a school'] },
        { tf: 'The cows are black and white.', a: true, s: 0 }, { tf: 'Mrs Hill collects the eggs every night.', a: false, s: 1 }, { tf: 'Children can ride the horses.', a: true, s: 2 }, { tf: 'There are bananas in the garden.', a: false, s: 3 }] },
    { title: 'Recycling at school', pic: '♻️', intro: "At Pau's school, everybody recycles. There are four bins in the playground.",
      vocab: [['playground', 'pati'], ['pots', 'pots'], ['skins', 'pells']], secs: [
      { h: 'BLUE BIN', pic: '📄', body: 'The blue bin is for paper and cardboard. We put old notebooks and boxes in it.' },
      { h: 'YELLOW BIN', pic: '🧴', body: 'The yellow bin is for plastic and cans. Yoghurt pots* and plastic bottles go here.' },
      { h: 'GREEN BIN', pic: '🍾', body: 'The green bin is for glass. We put glass bottles and jars in it.' },
      { h: 'BROWN BIN', pic: '🍌', body: 'The brown bin is for food: banana skins*, apples and old bread.' }],
      qs: [{ q: 'Where are the bins?', o: ['In the playground.', 'In the classroom.', 'In the kitchen.'], s: -1 }, { q: 'The blue bin is for...', o: ['paper and cardboard', 'glass', 'food'], s: 0 },
        { q: 'Plastic bottles go in the...', o: ['yellow bin', 'green bin', 'brown bin'], s: 1 }, { q: 'We put jars in the...', o: ['green bin', 'blue bin', 'yellow bin'], s: 2 },
        { order: true }, { about: ['recycling at school', 'the playground', 'food'] },
        { tf: 'The brown bin is for food.', a: true, s: 3 }, { tf: 'Glass bottles go in the blue bin.', a: false, s: 2 }, { tf: 'There are four bins.', a: true, s: -1 }, { tf: 'Old bread goes in the yellow bin.', a: false, s: 3 }] },
    { title: 'The science museum', pic: '🏛️', intro: 'Today Jack visits the Science Museum with his grandad. It is a great place to learn about science and technology.',
      vocab: [['grandad', 'avi'], ['tall', 'alt'], ['million', 'milions']], secs: [
      { h: 'THE ROBOT', pic: '🤖', body: 'The museum has got a robot called Max. You can play games with him and learn new words.' },
      { h: 'THE PLANE', pic: '✈️', body: 'There is a very old plane from 1950. It is green and white.' },
      { h: 'THE ROCKET', pic: '🚀', body: 'There is a real rocket. It is ten metres tall*!' },
      { h: 'THE DINOSAUR', pic: '🦖', body: 'In the last room, there is a big dinosaur. It is very old: 70 million* years old!' }],
      qs: [{ q: 'Jack visits the museum with his...', o: ['grandad', 'mum', 'teacher'], s: -1 }, { q: 'The robot is called...', o: ['Max', 'Jack', 'Rex'], s: 0 },
        { q: 'The plane is from...', o: ['1950', '1915', '2015'], s: 1 }, { q: 'How tall is the rocket?', o: ['ten metres', 'two metres', 'a hundred metres'], s: 2 },
        { order: true }, { about: ['a museum', 'a zoo', 'a robot'] },
        { tf: 'You can play games with the robot.', a: true, s: 0 }, { tf: 'The plane is red.', a: false, s: 1 }, { tf: 'The rocket is real.', a: true, s: 2 }, { tf: 'The dinosaur is in the first room.', a: false, s: 3 }] }
  ]
};

/* ---------- the sentences to build (Write it!) ---------- */
// words in order; pic what it is about; ca what it means; bad the wrong words that can be mixed in (the mistakes of a beginner)
export const SENTENCES = [
  { w: 'I can see a rocket .', pic: '🚀', ca: 'Veig un coet.', bad: ['an', 'sees'] },
  { w: 'Birds have got two wings .', pic: '🐦', ca: 'Els ocells tenen dues ales.', bad: ['has', 'wing'] },
  { w: 'Birds can fly .', pic: '🐦', ca: 'Els ocells poden volar.', bad: ['flies', 'cans'] },
  { w: 'My favourite colour is blue .', pic: '~#3B7BE8', ca: 'El meu color preferit és el blau.', bad: ['are', 'me'] },
  { w: 'I am nine years old .', pic: '=9', ca: 'Tinc nou anys.', bad: ['have', 'year'] },
  { w: 'I like playing football .', pic: '⚽', ca: "M'agrada jugar a futbol.", bad: ['likes', 'play'] },
  { w: 'She has got a cat .', pic: '🐱', ca: 'Ella té un gat.', bad: ['have', 'an'] },
  { w: 'I have got a red car .', pic: '🚗', ca: 'Tinc un cotxe vermell.', bad: ['has', 'reds'] },
  { w: 'There are three apples .', pic: '🍎🍎🍎', ca: 'Hi ha tres pomes.', bad: ['is', 'apple'] },
  { w: 'Fish can swim .', pic: '🐟', ca: 'Els peixos poden nedar.', bad: ['swims', 'cans'] },
  { w: 'I live near the sea .', pic: '🌊', ca: 'Visc a prop del mar.', bad: ['lives', 'in'] },
  { w: 'My hobbies are reading and dancing .', pic: '📚💃', ca: 'Les meves aficions són llegir i ballar.', bad: ['is', 'hobby'] },
  { w: 'The robot can sing songs .', pic: '🤖', ca: 'El robot sap cantar cançons.', bad: ['sings', 'song'] },
  { w: "I don't like cheese .", pic: '🧀', ca: "No m'agrada el formatge.", bad: ['doesn\'t', 'likes'] },
  { w: 'The dog is brown .', pic: '🐶', ca: 'El gos és marró.', bad: ['are', 'browns'] },
  { w: "Penguins can't fly .", pic: '🐧', ca: 'Els pingüins no poden volar.', bad: ['flies', 'is'] },
  { w: 'Dolphins live in the sea .', pic: '🐬', ca: 'Els dofins viuen al mar.', bad: ['lives', 'on'] },
  { w: 'Paper goes in the blue bin .', pic: '📄', ca: 'El paper va al contenidor blau.', bad: ['go', 'green'] },
  { w: 'I go to school by bus .', pic: '🚌', ca: "Vaig a l'escola amb autobús.", bad: ['goes', 'in'] },
  { w: 'The Moon is grey .', pic: '🌙', ca: 'La Lluna és grisa.', bad: ['are', 'gray'] },
  { w: 'Cows give us milk .', pic: '🐮', ca: 'Les vaques ens donen llet.', bad: ['gives', 'we'] },
  { w: 'I can see a robot in the museum .', pic: '🤖', ca: 'Veig un robot al museu.', bad: ['on', 'an'] }
];
// the writing tasks of the tests: a question in English and the sentences that answer it, each with its picture
export const TASKS = [
  { q: 'Explain two characteristics of birds.', ca: 'Explica dues característiques dels ocells.', ans: [['Birds have got feathers .', '🐦'], ['Birds can fly .', '🐦'], ['Birds have got two legs .', '🐦'], ['Birds make nests .', '🐦']], bad: ['has', 'flies', 'leg'] },
  { q: 'What can you see in the Science Museum?', ca: 'Què pots veure al museu de la ciència?', ans: [['I can see a robot .', '🤖'], ['I can see a rocket .', '🚀'], ['I can see a car .', '🚗'], ['I can see a plane .', '✈️']], bad: ['sees', 'an', 'cans'] },
  { q: 'What about you? What are your hobbies?', ca: 'I tu? Quines són les teves aficions?', ans: [['I like painting .', '🎨'], ['I like swimming .', '🏊'], ['I like reading .', '📚'], ['I like dancing .', '💃']], bad: ['likes', 'me', 'am'] },
  { q: 'Describe your pet.', ca: 'Descriu la teva mascota.', ans: [['My dog is brown .', '🐶'], ['My frog is green .', '🐸'], ['My pig is pink .', '🐷'], ['My rabbit is white .', '🐰']], bad: ['are', 'me', 'has'] },
  { q: 'How do we help the planet?', ca: 'Com ajudem el planeta?', ans: [['We recycle paper .', '📄'], ['We recycle glass .', '🍾'], ['We recycle plastic .', '🧴'], ['We recycle cans .', '🥫']], bad: ['recycles', 'us'] }
];

/* ---------- «Caça l'errada»: the mistakes of a Catalan speaker in English ---------- */
// each makes { pic, ca, real, bad, other }: what is meant in Catalan, the right sentence, the one with the mistake and another wrong one
export const SLIPS = {
  age: n => ({ pic: '=' + n, ca: `Tinc ${n} anys.`, real: `I am ${numWord(n)} years old.`, bad: `I have ${numWord(n)} years.`, other: `I is ${numWord(n)} years old.` }),
  adjective: (c, k) => ({ pic: W[k].pic, ca: 'Un animal de color ' + ({ red: 'vermell', blue: 'blau', green: 'verd', black: 'negre', white: 'blanc', brown: 'marró' })[c] + '.', real: `I've got a ${c} ${W[k].word}.`, bad: `I've got a ${W[k].word} ${c}.`, other: `I've got ${c} a ${W[k].word}.` }),
  likes: k => ({ pic: W[k].pic, ca: `A ella li agrada ${({ pizza: 'la pizza', cheese: 'el formatge', chocolate: 'la xocolata', bread: 'el pa', salad: "l'amanida", milk: 'la llet' })[k]}.`, real: `She likes ${W[k].word}.`, bad: `She like ${W[k].word}.`, other: `She liking ${W[k].word}.` }),
  hasGot: k => ({ pic: W[k].pic, ca: `Ell té ${({ dog: 'un gos', cat: 'un gat', rabbit: 'un conill', bike: 'una bicicleta', camera: 'una càmera', robot: 'un robot' })[k]}.`, real: `He has got ${an(W[k].word)}.`, bad: `He have got ${an(W[k].word)}.`, other: `He is got ${an(W[k].word)}.` }),
  plural: (n, k) => ({ pic: W[k].pic.repeat(n), ca: `Veig ${n} ${({ bird: 'ocells', cat: 'gats', dog: 'gossos', star: 'estrelles', car: 'cotxes', book: 'llibres' })[k]}.`, real: `I can see ${numWord(n)} ${plural(W[k].word)}.`, bad: `I can see ${numWord(n)} ${W[k].word}.`, other: `I can see ${numWord(n)} ${plural(W[k].word)}s.` }),
  thereAre: (n, k) => ({ pic: W[k].pic.repeat(n), ca: `Hi ha ${n} ${({ apple: 'pomes', banana: 'plàtans', duck: 'ànecs', pencil: 'llapis', flower: 'flors', egg: 'ous' })[k]}.`, real: `There are ${numWord(n)} ${plural(W[k].word)}.`, bad: `There is ${numWord(n)} ${plural(W[k].word)}.`, other: `There are ${numWord(n)} ${W[k].word}.` }),
  from: () => ({ pic: '🗺️', ca: 'Sóc de Catalunya.', real: 'I am from Catalonia.', bad: 'I am of Catalonia.', other: 'I from Catalonia.' }),
  playing: k => ({ pic: W[k].pic, ca: `M'agrada jugar a ${({ football: 'futbol', tennis: 'tennis', basketball: 'bàsquet' })[k]}.`, real: `I like playing ${k}.`, bad: `I like play ${k}.`, other: `I like playing the ${k}s.` })
};
