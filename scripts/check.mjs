// The home page says how much there is to win in each game, and each game's own data decides it. This runs before every
// build and stops it when a total in shared/games.js has drifted from the data, or a card points at a page that is not there.
import { existsSync } from 'node:fs';
import { GAMES } from '../shared/games.js';
import { SECTIONS as TRICKS, PLAN } from '../games/salts-de-granota/logic.js';
import { LEVELS as ROCKET } from '../games/memoria-visual/logic.js';
import { LEVELS as ABACUS } from '../games/abac-xines/logic.js';
import { LEVELS as TIMES } from '../games/coet-multiplicador/logic.js';

const TOTALS = { 'salts-de-granota': TRICKS.length * PLAN.length, coet: ROCKET.length, 'abac-xines': ABACUS.length, 'coet-multiplicador': TIMES.length };
const bad = [];
for (const g of GAMES) {
  const page = g.href.split('#')[0];
  if (!existsSync(new URL('../' + page, import.meta.url))) bad.push(`${g.id}: there is no ${page}`);
  if (g.total !== TOTALS[g.id]) bad.push(`${g.id}: total is ${g.total} in shared/games.js, and the game's data says ${TOTALS[g.id]}`);
}
for (const id in TOTALS) if (!GAMES.some(g => g.id === id)) bad.push(`${id}: not in shared/games.js`);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log(`${GAMES.length} games checked`);
