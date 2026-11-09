// Browser check of what Salts de Granota does with the progress of a child (rule number one of docs/plans/2026-11-08-salts-de-granota-3d.md):
// the game may change how it looks, never what it reads from a save nor what it writes into one.
//   - The map, from five saves (empty, old with secs[10], old with stars[12], half done and finished): the mark of every project, the flies,
//     the longest run and the record must be what logic.js gives in Node, and opening the map writes nothing.
//   - Then it plays: the Piscina (the empty save), a level with no mistake, a level with one mistake, an exam, a lightning round and a sheet,
//     answering what it reads on the screen. After each, the saved document must be exactly what the functions of logic.js give for those
//     right and wrong answers (levelIn, poolIn, examIn, rapidIn, sheetIn, fliesIn and streakIn, in the order main.js calls them).
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
// Run (the dev server must be up: `npx vite --port 5231`; do not edit files while it runs, Vite reloads the page):
//   PLAYWRIGHT_CORE=/home/olive/projects/AIlearn/node_modules BASE=http://localhost:5231 node scripts/flow-salts.mjs
//   CHROME   a Chrome or Chromium binary (default /usr/bin/google-chrome)
//   NOGL=1   Chrome without WebGL: the game must be played the same with the pictures of the page
//   ONLY=text   only the sections whose name has that text
// One seam, put in the page before it loads and not in the game: a timer of 400 ms or more runs ten times faster (the pauses of the game),
// and performance.now() is moved forward by window.__skew (the minute of the lightning round ends when the script says).
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5231', CHROME = process.env.CHROME || '/usr/bin/google-chrome', CORE = process.env.PLAYWRIGHT_CORE;
if (!CORE || !existsSync(CORE + '/playwright-core')) { console.error('flow-salts: set PLAYWRIGHT_CORE to the node_modules folder that holds playwright-core (it is not a dependency of the project)'); process.exit(1); }
if (!existsSync(CHROME)) { console.error(`flow-salts: no browser at ${CHROME}; set CHROME to a Chrome or Chromium binary`); process.exit(1); }
const { chromium } = createRequire(CORE + '/')('playwright-core');
const L = await import('../games/salts-de-granota/logic.js');
const { clean, noteOf, VALID, PROJECTS, CIRCLES, levelIn, poolIn, fliesIn, streakIn, rapidIn, examIn, sheetIn } = L;
const KEY = 'salts-de-granota';

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const same = (what, got, want) => check(JSON.stringify(got) === JSON.stringify(want), `${what}:\n  got      ${JSON.stringify(got)}\n  expected ${JSON.stringify(want)}`);

/* ---------- the five saves ---------- */
const lvOf = f => Array.from({ length: PROJECTS.length * 10 }, (_, k) => f(Math.floor(k / 10), k % 10));
// circle 0 validated with its exam still to pass; project 3 with four levels at three stars (it opens at level 5, «De cap»), project 5 begun
// with one star, project 18 (below zero) with four levels at three stars
const MID = { so: false, piscina: true, lv: lvOf((i, k) => i <= 2 ? 3 : (i === 3 || i === 18) && k < 4 ? 3 : i === 5 && k < 4 ? 1 : 0),
  exams: [false, false, false, false, false, false], fulls: 1, rapid: 3, ratxa: 9, mosques: 140 };
const SAVES = {
  buida: null,
  secs: { so: false, secs: [10, 10, 4, 0, 0, 0, 0, 0, 0, 0], mosques: 37, ratxa: 6 },
  stars: { so: false, stars: [3, 2, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0], rapid: 9 },
  mig: MID,
  acabada: { so: false, piscina: true, lv: lvOf(() => 3), exams: [true, true, true, true, true, true], fulls: 12, rapid: 25, ratxa: 30, mosques: 600 }
};

/* ---------- the browser ---------- */
const GL = process.env.NOGL ? ['--disable-3d-apis', '--disable-webgl'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: GL });
let opened = [], pageErrors = [], ran = 0;
async function section(name, fn) {
  if (process.env.ONLY && !name.includes(process.env.ONLY)) return;
  ran++; const t0 = Date.now();
  try { await fn(); } catch (e) { check(false, `${name}: stopped on ${String(e.message).split('\n')[0]}`); }
  await new Promise(r => setTimeout(r, 300));
  check(pageErrors.length === 0, `${name}: page error: ${pageErrors[0]}`);
  pageErrors = [];
  await Promise.all(opened.map(c => c.close().catch(() => {}))); opened = [];
  console.log(`  ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
// a page of the game with this save under a new player; first is what must be on screen before going on
async function open(save, first = '.map', w = 390, h = 844) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true }), page = await ctx.newPage();
  opened.push(ctx);
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|favicon|firestore|firebase/i.test(m.text())) pageErrors.push('console: ' + m.text()); });
  await page.addInitScript(() => {
    const now = performance.now.bind(performance), st = window.setTimeout.bind(window);
    window.__skew = 0; performance.now = () => now() + window.__skew;
    window.setTimeout = (f, d, ...a) => st(f, d >= 400 ? d / 10 : d, ...a);
  });
  await page.goto(BASE + '/index.html');
  await page.evaluate(async ([key, save]) => { const P = await import('/shared/progress.js'); const a = P.add('Prova'); P.choose(a?.id ?? a); P.load(key); if (save) P.save(key, save); }, [KEY, save]);
  await page.goto(BASE + '/salts-de-granota.html');
  await page.waitForSelector(first, { timeout: 30000 });
  return page;
}
const stored = page => page.evaluate(async key => { const P = await import('/shared/progress.js'); return P.load(key); }, KEY);
const tap = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); if (!e) throw new Error('no ' + sel); e.click(); }, sel);
const wait = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 30000, polling: 50 });

/* ---------- answering what is on the screen ---------- */
// the result of the operation on screen: «32 + 8 =», «7 +» with «= 10», «6 + (−4) =», «−3 − 5 =»
const ev = s => Function(`return (${s.replace(/−/g, '-').replace(/=/g, ' ')})`)();
function solve(lhs, rhs) {
  if (!rhs.trim()) return ev(lhs);
  const m = lhs.replace(/−/g, '-').trim().match(/^(.*?)\s*([+-])$/), A = ev(m[1]), T = ev(rhs);
  return m[2] === '+' ? T - A : A - T;
}
const typed = v => v < 0 ? '-' + -v : String(v);
// Plays the operations of a board until its end. wrong(k) says which of them is answered badly first (k counts the operations as they come,
// the ones brought back at the end too); stop(k) ends the loop before operation k without answering it (the lightning round).
// Gives what was answered: one { lhs, rhs, ans, wrong } per operation
async function board(page, { wrong = () => false, stop = () => false, once = false, secs = false } = {}) {
  const done = [];
  for (let k = 0; ; k++) {
    const what = await wait(page, () => {
      const a = document.querySelector('#ans');
      if (a && !a.__seen && a.className !== 'good' && !a.classList.contains('told')) return 'q';
      return document.querySelector('#nx, #bk') ? 'end' : false;
    });
    if (await what.jsonValue() === 'end') return done;
    if (stop(k)) return done;
    const q = await page.evaluate(() => { const a = document.querySelector('#ans'); a.__seen = true; return { lhs: document.querySelector('#lhs').textContent, rhs: document.querySelector('#rhs').textContent, neg: !!document.querySelector('.keys.neg') }; });
    const ans = solve(q.lhs, q.rhs), bad = wrong(k);
    done.push({ ...q, ans, wrong: bad });
    if (bad) {
      const w = ans - 1;
      await page.keyboard.type(typed(w));
      // a wrong number is taken by itself when it has as many digits as the right one; below zero, or shorter, it waits for ✓
      if (q.neg || String(Math.abs(w)).length < String(Math.abs(ans)).length) await page.keyboard.press('Enter');
      if (once && !secs) { await wait(page, () => document.querySelector('#go')); await tap(page, '#go'); continue; }
      if (secs) continue;
      await wait(page, () => document.querySelector('#ans')?.textContent === '');
    }
    await page.keyboard.type(typed(ans));
  }
}
// what main.js hands in at the end of a board: the flies of the answers at the first try and the longest run, in this order
const bank = (p, flies, top) => streakIn(fliesIn(p, flies).prog, top).prog;
// the longest run of answers at the first try in a board, the ones brought back at the end not counted
function topOf(done) { let run = 0, top = 0; for (const d of done.filter(d => !d.re)) { run = d.wrong ? 0 : run + 1; top = Math.max(top, run); } return top; }

/* ---------- the map ---------- */
for (const [name, save] of Object.entries(SAVES)) {
  if (!save) continue;
  await section(`mapa: partida ${name}`, async () => {
    const page = await open(save), p = clean(save);
    const seen = await page.evaluate(() => ({
      marks: [...document.querySelectorAll('.proj[data-p]')].map(b => [+b.dataset.p, b.querySelector('.mk').textContent]),
      stats: document.querySelector('.stats')?.textContent || '', rapid: document.querySelector('#rapid')?.textContent || ''
    }));
    same(`${name}: projects on the map`, seen.marks.map(m => m[0]).sort((a, b) => a - b), PROJECTS.map((_, i) => i));
    for (const [i, mk] of seen.marks) {
      const n = noteOf(p, i), d = p.lv.slice(i * 10, i * 10 + 10).filter(Boolean).length;
      // contract: shared/mapa.js noteText, with the note of logic.js
      same(`${name}: project ${i} says`, mk, n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer');
    }
    same(`${name}: flies on the map`, +(seen.stats.match(/(\d+)\s*mosques?/) || [])[1], p.mosques);
    same(`${name}: longest run on the map`, +(seen.stats.match(/Ratxa més llarga:\s*(\d+)/) || [])[1], p.ratxa);
    same(`${name}: record on the map`, p.rapid ? +(seen.rapid.match(/rècord (\d+)/) || [])[1] : /rècord/.test(seen.rapid), p.rapid || false);
    // opening the map writes nothing
    same(`${name}: the save after the map`, await stored(page), save);
  });
}

/* ---------- the boards ---------- */
await section('partida buida: la Piscina', async () => {
  const page = await open(null, '#ans');
  same('the first screen of an empty save', await page.evaluate(() => document.querySelector('#kick').textContent), 'La Piscina');
  check(!(await page.$('.map')), 'an empty save shows no map');
  const done = await board(page);
  same('operations of the Piscina', done.length, 3);
  const want = bank(poolIn(clean(null)).prog, 3, 3);
  same('the save after the Piscina', await stored(page), want);
  await tap(page, '#nx'); await page.waitForSelector('.map');
});

await section('nivell sense errades', async () => {
  const page = await open(MID);
  await tap(page, '.proj[data-p="3"]');
  await page.waitForSelector('#ans');
  same('the level that opens', await page.evaluate(() => +document.querySelector('.levels [aria-current]').dataset.n), 4);
  const done = await board(page);
  same('operations', done.length, 5);
  same('the save after a level with no mistake', await stored(page), bank(levelIn(clean(MID), 3, 4, 0).prog, 5, 5));
});

await section('nivell amb una errada', async () => {
  const page = await open(MID);
  await tap(page, '.proj[data-p="18"]');
  await page.waitForSelector('#ans');
  same('the level that opens', await page.evaluate(() => +document.querySelector('.levels [aria-current]').dataset.n), 4);
  const done = await board(page, { wrong: k => k === 1 });
  // the one answered after a mistake comes back once at the end, and is not counted
  same('operations (the one missed comes back)', done.length, 6);
  done[5].re = true;
  same('it is the same one', [done[5].lhs, done[5].ans], [done[1].lhs, done[1].ans]);
  same('the save after a level with one mistake', await stored(page), bank(levelIn(clean(MID), 18, 4, 1).prog, 4, topOf(done)));
});

await section('examen', async () => {
  const page = await open(MID);
  await tap(page, '.proj.exam[data-x="0"]');
  await page.waitForSelector('#ans');
  const done = await board(page, { wrong: k => k === 2, once: true });
  same('operations of an exam', done.length, 6);
  const res = done.map(d => !d.wrong), r = examIn(clean(MID), 0, [], res);
  check(r.good, 'five of six with the circle validated passes the exam');
  same('the save after the exam', await stored(page), bank(r.prog, 5, topOf(done)));
});

await section('repte llampec', async () => {
  const page = await open(MID);
  await tap(page, '#rapid');
  await page.waitForSelector('#go'); await tap(page, '#go');
  await page.waitForSelector('#ans');
  const done = await board(page, { wrong: k => k === 4, once: true, secs: true, stop: k => k === 7 });
  // the minute is over
  await page.evaluate(() => { window.__skew += 61000; });
  await page.waitForSelector('#bk', { timeout: 30000 });
  const hits = done.filter(d => !d.wrong).length;
  same('right answers of the round', hits, 6);
  same('the save after the lightning round', await stored(page), bank(rapidIn(clean(MID), hits).prog, hits, topOf(done)));
});

await section("caça l'errada", async () => {
  const page = await open(MID);
  await tap(page, '#full');
  const marks = [];
  for (let k = 0; k < 3; k++) {
    await wait(page, () => { const c = document.querySelector('.claim'); return c && !c.__seen && document.querySelector('#yes'); });
    // the claim: the operation with the answer of the sheet in bold; is it true, and which option makes it true
    const c = await page.evaluate(() => {
      const e = document.querySelector('.claim'), b = e.querySelector('b'); e.__seen = true;
      let before = '', after = '', at = false;
      for (const n of e.childNodes) { if (n === b) at = true; else if (at) after += n.textContent; else before += n.textContent; }
      return { before, says: b.textContent, after };
    });
    const holds = v => { const [l, r] = (c.before + v + c.after).split('='); return ev(l) === ev(r); };
    await page.waitForTimeout(500);   // a tap right after the claim comes up is ignored (SETTLE)
    if (holds(c.says)) { await tap(page, '#yes'); marks.push(true); continue; }
    await tap(page, '#no');
    await wait(page, () => document.querySelector('[data-v]'));
    await page.waitForTimeout(500);
    const opts = await page.evaluate(() => [...document.querySelectorAll('[data-v]')].map(b => b.textContent));
    const good = opts.find(holds);
    check(good !== undefined, `one of the options makes «${c.before}…${c.after}» true`);
    await page.evaluate(t => [...document.querySelectorAll('[data-v]')].find(b => b.textContent === t).click(), good);
    marks.push(true);
  }
  await page.waitForSelector('#bk', { timeout: 30000 });
  same('the save after a sheet', await stored(page), sheetIn(clean(MID), marks).prog);
});

await browser.close();
if (process.env.ONLY && !ran) { console.error(`flow-salts: no section matches ONLY=${process.env.ONLY}`); process.exit(1); }
console.log(fails ? `flow-salts: ${fails} FAIL` : `flow-salts: ${ran} sections OK${process.env.NOGL ? ' (without WebGL)' : ''}`);
process.exit(fails ? 1 : 0);
