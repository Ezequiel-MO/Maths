// Browser check of what El castell dels números does with the progress of a child (rule number one of docs/plans/2026-11-10-castell-3d.md):
// the game may change how it looks, never what it reads from a save nor what it writes into one.
//   - The map, from five saves (empty, half done, finished, odd and with piscina false but stars): the projects validated, the exams passed
//     and the XP level must be what logic.js gives in Node, and opening the map writes nothing. With WebGL the castle says the same
//     (#world.dataset: parts built, banners raised).
//   - Then it plays: a level of each kind of scene (a tower, balances with a mistake, weights and pins, padlocks, a machine and a series, a
//     path and riddles, a magic square, a wheel and a table), the Piscina, an exam and a sheet. It reads what is on screen from
//     window.__castell (the round, its scene, the hole typed in) and works the answer out in Node. After each, the saved document must be
//     exactly what the functions of logic.js give for those right and wrong answers (bricksIn, levelIn, examIn, sheetIn, in the order
//     main.js calls them).
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
// Run (the dev server must be up: `npx vite --port 5233`; do not edit files while it runs, Vite reloads the page. When the network of the
// machine changes, Vite's live reload reloads the page too: a server with `server: { hmr: false }` avoids it):
//   PLAYWRIGHT_CORE=/home/olive/projects/AIlearn/node_modules BASE=http://localhost:5233 node scripts/flow-castell.mjs
//   CHROME   a Chrome or Chromium binary (default /usr/bin/google-chrome)
//   NOGL=1   Chrome without WebGL: the game must be played the same with the drawings of the page
//   ONLY=text   only the sections whose name has that text
//   SHOTS=dir   screenshots of the map and of every level played, into dir
// One seam, put in the page before it loads and not in the game: a timer of 400 ms or more runs ten times faster (the pauses of the game).
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5233', CHROME = process.env.CHROME || '/usr/bin/google-chrome', CORE = process.env.PLAYWRIGHT_CORE;
if (!CORE || !existsSync(CORE + '/playwright-core')) { console.error('flow-castell: set PLAYWRIGHT_CORE to the node_modules folder that holds playwright-core (it is not a dependency of the project)'); process.exit(1); }
if (!existsSync(CHROME)) { console.error(`flow-castell: no browser at ${CHROME}; set CHROME to a Chrome or Chromium binary`); process.exit(1); }
const { chromium } = createRequire(CORE + '/')('playwright-core');
const L = await import('../games/castell-dels-numeros/logic.js');
const { clean, PROJECTS, validated, levelText, levelIn, bricksIn, examIn, sheetIn, stone } = L;
const KEY = 'castell-dels-numeros';
const NOGL = !!process.env.NOGL, SHOTS = process.env.SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const same = (what, got, want) => check(JSON.stringify(got) === JSON.stringify(want), `${what}:\n  got      ${JSON.stringify(got)}\n  expected ${JSON.stringify(want)}`);

/* ---------- the five saves ---------- */
const starsOf = f => Array.from({ length: PROJECTS.length * 10 }, (_, k) => f(Math.floor(k / 10), k % 10));
// The foundations validated (so the exam of circle 0 is open and not passed), the magic squares with two levels, the machines half done
const MID = { so: false, stars: starsOf((i, k) => i < 3 ? 3 : i === 3 && k < 2 ? 2 : i === 4 && k < 5 ? [3, 1, 2, 3, 2][k] : 0), piscina: true, exams: [false, false, false], fulls: 1, maons: 40 };
const SAVES = {
  buida: null,
  mig: MID,
  acabada: { so: false, stars: starsOf(() => 3), piscina: true, exams: [true, true, true], fulls: 9, maons: 900 },
  // what an old or broken browser could hold: stars too short and with junk, an exam null, numbers that are not numbers
  estranya: { so: false, stars: [3, 1, 'x', -2, 9], exams: [true, null], fulls: 'molts', maons: NaN },
  // piscina false, but levels with stars: the Piscina counts as done
  'sense piscina': { so: false, piscina: false, stars: starsOf((i, k) => i === 1 && k < 3 ? 2 : 0), exams: [false, false, false], fulls: 0, maons: 3 }
};

/* ---------- the browser ---------- */
const GL = NOGL ? ['--disable-3d-apis', '--disable-webgl'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: GL });
let opened = [], pageErrors = [];
async function section(name, fn) {
  if (process.env.ONLY && !name.includes(process.env.ONLY)) return;
  const t0 = Date.now();
  try { await fn(); } catch (e) {
    check(false, `${name}: stopped on ${String(e.message).split('\n')[0]}`);
    for (const c of opened) for (const pg of c.pages()) console.error('  on screen:', await pg.evaluate(() => { const e = window.__castell || {}, p = e.play || {}; return { kick: document.querySelector('#kick')?.textContent, what: e.what, k: p.k, tick: p.tick, ready: p.ready, cur: p.cur, type: p.round?.q?.type, s: p.round?.scene?.s, tip: document.querySelector('#tip')?.textContent, q: document.querySelector('#q')?.textContent, world: { ...document.querySelector('#world')?.dataset } }; }).catch(e => e.message));
  }
  await new Promise(r => setTimeout(r, 300));
  check(pageErrors.length === 0, `${name}: page error: ${pageErrors[0]}`);
  pageErrors = [];
  await Promise.all(opened.map(c => c.close().catch(() => {}))); opened = [];
  console.log(`  ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
// a page of the game with this save under a new player; first is what must be on screen before going on
async function open(save, first = '.map', w = 390, h = 844, q = '') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true }), page = await ctx.newPage();
  opened.push(ctx);
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|favicon|firestore|firebase/i.test(m.text())) pageErrors.push('console: ' + m.text()); });
  await page.addInitScript(() => { const st = window.setTimeout.bind(window); window.setTimeout = (f, d, ...a) => st(f, d >= 400 ? d / 10 : d, ...a); });
  for (let n = 1; ; n++) {
    try {
      await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
      await page.evaluate(async ([key, save]) => { const P = await import('/shared/progress.js'); const a = P.add('Prova'); P.choose(a?.id ?? a); P.load(key); if (save) P.save(key, save); }, [KEY, save]);
      await page.goto(BASE + '/castell-dels-numeros.html' + q, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(first, { timeout: 30000 });
      return page;
    } catch (e) {
      if (n >= 3 || !/ERR_NETWORK_CHANGED|Failed to fetch dynamically imported module|net::ERR_|page.goto: Timeout/.test(e.message + pageErrors.join())) throw e;
      console.log(`  (the network changed while loading: ${e.message.split('\n')[0]}; again, ${n + 1} of 3)`);
      pageErrors = pageErrors.filter(m => !/ERR_NETWORK_CHANGED|Failed to fetch|net::ERR_/.test(m));
    }
  }
}
const stored = page => page.evaluate(async key => { const P = await import('/shared/progress.js'); return P.load(key); }, KEY);
// a click on what the page has: buttons, and the shapes of a drawing (an SVG element has no click())
const tap = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); if (!e) throw new Error('no ' + sel); e.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, sel);
const wait = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 60000, polling: 50 });
const sideways = page => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const shot = (page, name) => SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png` }) : null;
// the save after a game: what logic.js gives, and never the save before (a game that changes nothing would check nothing)
async function after(page, what, before, want) { const got = await stored(page); same(what, got, want); check(JSON.stringify(got) !== JSON.stringify(before), `${what}: the game changed the save`); }
// A thing of a scene touched: in the drawing of the page when it is there, otherwise in the castle, on the point of the screen where the
// world says it is (window.__terra.where(kind, key))
async function touch(page, sel, kind, key) {
  if (await page.$(sel)) return tap(page, sel);
  // where it is, once the camera has stopped: two readings a moment apart that agree
  let p = null;
  for (let n = 0; n < 60; n++) {
    const q = await page.evaluate(([kind, key]) => window.__terra?.where?.(kind, key), [kind, key]);
    if (q && p && Math.abs(q.x - p.x) < 1 && Math.abs(q.y - p.y) < 1) break;
    p = q; await page.waitForTimeout(300);
  }
  if (!p) throw new Error(`nowhere to touch ${kind} ${key}`);
  await page.mouse.click(p.x, p.y);
}

/* ---------- answering what is on the screen ---------- */
// the bricks a round lays when it is solved: one per hole
const laidOf = R => R.q.type === 'holes' ? R.scene.holes.length : 0;
const lay = (p, rounds) => rounds.reduce((q, R) => laidOf(R) ? bricksIn(q, laidOf(R)) : q, p);
// the stones of a path, in Node: from the top left to the bottom right, one next to another, never twice, ending with the number of the door
function route(sc) {
  const { grid, R, C, start, target } = sc, seen = new Set();
  const go = (r, c, x, trail) => {
    const y = stone(x, grid[r][c]); if (Number.isNaN(y)) return null;
    const t = [...trail, [r, c]];
    if (r === R - 1 && c === C - 1) return y === target ? t : null;
    seen.add(r + '-' + c);
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const a = r + dr, b = c + dc;
      if (a < 0 || b < 0 || a >= R || b >= C || seen.has(a + '-' + b)) continue;
      const w = go(a, b, y, t); if (w) { seen.delete(r + '-' + c); return w; }
    }
    seen.delete(r + '-' + c); return null;
  };
  return go(0, 0, start, []);
}
// the weights that make a balance level, the big ones first
function weightsOf(sc) {
  const [Lp, Rp] = sc.pans[0], sum = a => a.reduce((t, x) => t + x, 0);
  let need = sum(Lp) - sum(Rp); const out = [];
  for (const w of [10, 5, 2, 1]) while (need >= w) { out.push(w); need -= w; }
  return out;
}
// One action on the round on show: st is what window.__castell.play says. bad: answer it wrong first (holes, choices and taps only).
// Gives whether it was a mistake
async function act(page, st, bad) {
  const R = st.round, q = R.q, sc = R.scene;
  if (q.type === 'holes') {
    const want = String(sc.cells[st.cur]);
    if (bad) { await page.keyboard.type(want === '9' ? '8' : '9'); await page.keyboard.press('Enter'); return true; }
    await page.keyboard.type(want); return false;
  }
  if (q.type === 'pick') {
    const i = await page.evaluate(([ans, bad]) => [...document.querySelectorAll('#ans .opts button')].findIndex(b => !b.disabled && (b.textContent === ans) !== bad), [q.ans, bad]);
    if (i < 0) throw new Error('no choice to pick');
    await tap(page, `#ans .opts button:nth-child(${i + 1})`); return bad;
  }
  if (q.type === 'tap') {
    const k = bad ? sc.items.map(it => it.k).find(k => !q.ans.includes(k)) : q.ans[0];
    await touch(page, `.hit[data-k="${k}"]`, 'bal3', k); return bad;
  }
  if (q.type === 'level') { for (const w of weightsOf(sc)) await tap(page, `.wbtn[data-w="${w}"]`); return false; }
  if (q.type === 'explore') { for (let i = 0; i < sc.lines.length; i++) await tap(page, `.lsum.hit[data-l="${i}"]`); return false; }
  if (q.type === 'path') {
    const way = route(sc); if (!way) throw new Error('no way through the path');
    for (const [r, c] of way) { await touch(page, `.stone[data-c="${r}-${c}"]`, 'stone', `${r}-${c}`); await page.waitForTimeout(60); }
    return false;
  }
  throw new Error('a round this check cannot play: ' + q.type);
}
// Plays the rounds on screen until end() says so. wrong(n) says whether the n-th action is answered wrong first. Gives the mistakes
async function rounds(page, end, wrong = () => false) {
  let seen = 0, slips = 0;
  for (let n = 0; ; n++) {
    const h = await wait(page, ([seen, end]) => { if (new Function('return ' + end)()) return 'end'; const p = window.__castell.play; return p && p.ready && p.tick > seen ? 'go' : false; }, [seen, end]);
    if (await h.jsonValue() === 'end') return slips;
    const st = await page.evaluate(() => { const p = window.__castell.play; return { k: p.k, tick: p.tick, round: p.round, cur: p.cur }; });
    seen = st.tick;
    if (await act(page, st, wrong(n))) slips++;
  }
}
// a level from the map: its project, then its button in the row of levels
async function level(page, sec, idx, wrong) {
  await tap(page, `.proj[data-p="${sec}"]`);
  await wait(page, () => window.__castell.what === 'nivell');
  await tap(page, `.levels button[data-n="${idx}"]`);
  await wait(page, ([sec, idx]) => window.__castell.what === 'nivell' && window.__castell.sec === sec && window.__castell.idx === idx, [sec, idx]);
  const slips = await rounds(page, "!!document.querySelector('#nx')", wrong);
  await shot(page, `nivell-${sec}-${idx}`);
  return slips;
}

/* ---------- the map ---------- */
for (const [name, save] of Object.entries(SAVES)) {
  await section(`mapa: ${name}`, async () => {
    const P = clean(save), page = await open(save, save ? '.map' : '#stage');
    if (!save) { same('an empty save starts with the Piscina', await page.evaluate(() => window.__castell.what), 'piscina'); same('nothing is saved before the Piscina', await stored(page), null); return; }
    const seen = await page.evaluate(() => ({ valid: document.querySelectorAll('.proj:not(.exam).ok').length, exams: document.querySelectorAll('.proj.exam.ok').length, xp: document.querySelector('.xp-n')?.textContent,
      world: { ...document.querySelector('#world')?.dataset } }));
    same(`${name}: projects validated`, seen.valid, validated(P).length);
    same(`${name}: exams passed`, seen.exams, P.exams.filter(Boolean).length);
    same(`${name}: XP`, seen.xp, `Nivell ${levelText(P)}`);
    if (!NOGL && seen.world.parts !== undefined) {
      same(`${name}: parts of the castle built`, +seen.world.parts, validated(P).length);
      same(`${name}: banners raised`, +seen.world.estendards, P.exams.filter(Boolean).length);
    }
    same(`${name}: opening the map writes nothing`, await stored(page), save);
    check(await sideways(page) <= 0, `${name}: the map scrolls sideways`);
    await shot(page, `mapa-${name}`);
  });
}

/* ---------- the levels ---------- */
// [name, project, level, which actions go wrong first]
const LEVELS = [
  ['la torre', 0, 0, () => false],
  ['balances amb una errada', 1, 2, n => n === 0],
  ['peses i agulles', 1, 1, n => n === 2],
  ['els cadenats', 2, 9, n => n === 2],
  ['la màquina i la sèrie', 4, 9, () => false],
  ['el camí i les endevinalles', 8, 9, n => n === 1],
  ['el quadrat màgic', 3, 0, () => false],
  ['la roda, la torre i la taula', 5, 9, n => n === 1]
];
// the half done save with the level to play still without stars, so that playing it always changes the save
const fresh = (sec, idx) => ({ ...MID, stars: MID.stars.map((s, k) => k === sec * 10 + idx ? 0 : s) });
for (const [name, sec, idx, wrong] of LEVELS) {
  await section(`nivell: ${name}`, async () => {
    const SAVE = fresh(sec, idx), page = await open(SAVE, '.map', 390, 844, '?obert');
    const slips = await level(page, sec, idx, wrong);
    check(![0, 1, 2, 3, 4, 5].some(wrong) || slips > 0, `${name}: the mistake was given`);
    await after(page, name, SAVE, levelIn(lay(clean(SAVE), PROJECTS[sec].levels[idx].rounds), sec, idx, slips).prog);
    check(await sideways(page) <= 0, `${name}: the level scrolls sideways`);
  });
}
// a wide screen: the panel on the right
await section('nivell: pantalla ampla', async () => {
  const page = await open(MID, '.map', 1280, 800, '?obert');
  const slips = await level(page, 1, 3);
  await after(page, 'pantalla ampla', MID, levelIn(lay(clean(MID), PROJECTS[1].levels[3].rounds), 1, 3, slips).prog);
});

/* ---------- the Piscina, an exam and a sheet ---------- */
await section('la Piscina', async () => {
  const page = await open(null, '#stage');
  await rounds(page, "window.__castell.what === 'mapa'");
  await after(page, 'la Piscina', null, { ...lay(clean(null), L.POOL), piscina: true });
});
await section("l'examen", async () => {
  const page = await open(MID);
  await tap(page, '.proj.exam[data-x="0"]');
  await wait(page, () => window.__castell.what === 'examen');
  const qs = await page.evaluate(() => window.__castell.qs);
  await rounds(page, "!!document.querySelector('#bk')");
  await shot(page, 'examen');
  const P = lay(clean(MID), qs.flatMap(q => q.rounds));
  await after(page, "l'examen", MID, examIn(P, 0, qs, qs.map(() => true)).prog);
});
await section("Caça l'errada", async () => {
  const page = await open(MID);
  await tap(page, '#full');
  await wait(page, () => window.__castell.what === 'full');
  const cs = await page.evaluate(() => window.__castell.cs);
  for (let i = 0; i < cs.length; i++) {
    await wait(page, i => window.__castell.k === i && window.__castell.ready, i);
    if (cs[i].says === cs[i].real) { await tap(page, '#yes'); continue; }
    await tap(page, '#no');
    await wait(page, () => !!document.querySelector('.opts.col button[data-v]') && window.__castell.ready);
    const v = cs[i].opts.indexOf(cs[i].real);
    await tap(page, `.opts.col button[data-v="${v}"]`);
  }
  await wait(page, () => !!document.querySelector('#bk'));
  await shot(page, 'full');
  await after(page, "Caça l'errada", MID, sheetIn(clean(MID), cs.map(() => true)).prog);
});

await browser.close();
console.log(fails ? `flow-castell: ${fails} failed` : 'flow-castell: ok');
process.exit(fails ? 1 : 0);
