// What every game shows, written down to compare two versions of the code. Each game page opens in Chrome with a fixed save (or none),
// a seeded Math.random and a fake clock, and the HTML of each screen it reaches is written to OUT/<game>/<screen>.html: the first screen,
// a level, the map again, an exam, a sheet, the lightning round and the other buttons of the map when the game has them, and the
// sound turned off and on; under each screen, what the game has saved by then. Run it before and after a change of the screens
// and compare the two folders (diff -r): the same HTML means the children see the same games.
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
//   PLAYWRIGHT_CORE=<node_modules with playwright-core> BASE=http://localhost:5173 OUT=/some/dir node scripts/snap-games.mjs
//   CHROME   a Chrome or Chromium binary (default /usr/bin/google-chrome);  ONLY=<game id> one game
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { GAMES } from '../shared/games.js';

const BASE = process.env.BASE || 'http://localhost:5173', CHROME = process.env.CHROME || '/usr/bin/google-chrome', CORE = process.env.PLAYWRIGHT_CORE, OUT = process.env.OUT;
if (!CORE || !existsSync(CORE + '/playwright-core')) { console.error('snap-games: set PLAYWRIGHT_CORE to the node_modules folder that holds playwright-core'); process.exit(1); }
if (!OUT) { console.error('snap-games: set OUT to the folder to write the screens to'); process.exit(1); }
const { chromium } = createRequire(CORE + '/')('playwright-core');

// one save for every game: each clean() takes the fields it knows. Some of every kind of progress, so the map has open and shut circles
// the first three projects done with three stars (validated, so the sheet opens), the next three half done
const lv = Array.from({ length: 400 }, (_, i) => i < 30 ? 3 : i < 60 && i % 10 < 6 ? 1 + i % 3 : 0);
const SAVE = { so: false, piscina: true, lv, stars: lv, secs: [10, 10, 6, 0, 3, 0, 0, 0, 0, 0], notes: [100, 85, 80, 0, 90, 0, 0, 0, 0],
  exams: [true], fulls: 2, rapid: 7, ratxa: 4, mosques: 120, best: 260, probs: 3, savi: 1, equip: -1 };

// the page as text, one tag a line, so a diff shows what moved; the back button had two names (#toS and #toM), it is read as one
const html = page => page.evaluate(() => document.body.innerHTML.replace(/id="toS"/g, 'id="toM"').replace(/\?t=\d+"/g, '"').replace(/></g, '>\n<'));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let fails = 0;
for (const g of GAMES) {
  const id = g.href.replace(/\.html.*$/, '');
  if (process.env.ONLY && process.env.ONLY !== id) continue;
  for (const [tag, save] of [['nou', null], ['mig', SAVE]]) {
    const dir = `${OUT}/${id}/${tag}`; mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } }), page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-15T10:00:00Z') });
    await page.addInitScript(([store, save]) => {
      // two seeded streams: the animation frames (the sky, the sparks) draw from their own, so how many frames ran never moves the game's questions
      const gen = s => () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      let game = gen(12345), frames = gen(999), inFrame = 0;
      window.__seed = n => { game = gen(n); };
      Math.random = () => inFrame ? frames() : game();
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => raf(t => { inFrame++; try { cb(t); } finally { inFrame--; } });
      if (sessionStorage.getItem('snap')) return;   // the save is put once; what the game saves after stays
      sessionStorage.setItem('snap', '1');
      localStorage.setItem('perfils', JSON.stringify([{ id: 'xavi', name: 'Xavi' }])); localStorage.setItem('perfil', 'xavi');
      if (save) localStorage.setItem('xavi:' + store, JSON.stringify(save));
    }, [g.store || id, save]);
    const wait = ms => page.clock.runFor(ms);
    // the screen, and under it what the game has saved by then: the same save is the same progress for the child
    const saved = () => page.evaluate(k => localStorage.getItem(k), 'xavi:' + (g.store || id));
    const snap = async name => { await wait(1500); writeFileSync(`${dir}/${name}.html`, await html(page) + `\n<!-- saved: ${await saved()} -->\n`); };
    // chance starts again from the same seed right before every tap: the sky and the sparks draw from Math.random too, at their own pace
    const tap = async sel => { const e = await page.$(sel); if (!e) return false; await page.evaluate(() => window.__seed(777)); await e.click({ force: true }); return true; };
    const back = () => tap('#toM:not([hidden]), #toS:not([hidden])');
    try {
      await page.goto(`${BASE}/${id}.html`); await snap('0-inici');
      if (save) {
        if (await tap('.proj:not(.exam):not(:disabled)')) { await snap('1-nivell'); await back(); await snap('2-mapa'); }
        if (await tap('.proj.exam:not(:disabled)')) { await snap('3-examen'); await back(); }
        if (await tap('#full:not(:disabled)')) { await snap('4-full'); await back(); }
        if (await tap('#rapid')) { await snap('5-llampec'); await back(); }
        if (await tap('#free')) { await snap('6-lliure'); await back(); }
        if (await tap('#trucs')) { await snap('7-trucs'); await back(); }
        if (await tap('#so')) { await snap('8-so'); await tap('#so'); await snap('9-so'); }
      }
    } catch (e) { errors.push(String(e.message).split('\n')[0]); }
    if (errors.length) { fails++; console.error(`${id} ${tag}:`, errors.join(' | ')); }
    await ctx.close();
  }
  console.log('snap', id);
}
await browser.close();
process.exit(fails ? 1 : 0);
