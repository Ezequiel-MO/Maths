// Browser check of what Els escacs de l'estany does with the progress of a child (rule number one of docs/plans/2026-11-09-escacs-3d.md):
// the game may change how it looks, never what it reads from a save nor what it writes into one.
//   - The map, from five saves (empty, half done, finished, odd and with piscina false but stars): the mark of every project, the exams,
//     the record of the lightning round and the XP level must be what logic.js gives in Node, and opening the map writes nothing.
//   - Then it plays: a level of squares with no mistake, a «Recull les estrelles» with one mistake, a mate in one, the Piscina, an exam, a
//     lightning round and a sheet. It reads what is on screen from window.__escacs (the level or the question, the position, the step) and
//     works the answer out in Node with logic.js. After each, the saved document must be exactly what the functions of logic.js give for
//     those right and wrong answers (levelIn, poolIn, examIn, rapidIn, sheetIn and streakIn, in the order main.js calls them).
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
// Run (the dev server must be up: `npx vite --port 5232`; do not edit files while it runs, Vite reloads the page):
//   PLAYWRIGHT_CORE=/home/olive/projects/AIlearn/node_modules BASE=http://localhost:5232 node scripts/flow-escacs.mjs
//   CHROME   a Chrome or Chromium binary (default /usr/bin/google-chrome)
//   NOGL=1   Chrome without WebGL: the game must be played the same with the board of the page
//   ONLY=text   only the sections whose name has that text
// One seam, put in the page before it loads and not in the game: a timer of 400 ms or more runs ten times faster (the pauses of the game),
// and performance.now() is moved forward by window.__skew (the minute of the lightning round ends when the script says).
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5232', CHROME = process.env.CHROME || '/usr/bin/google-chrome', CORE = process.env.PLAYWRIGHT_CORE;
if (!CORE || !existsSync(CORE + '/playwright-core')) { console.error('flow-escacs: set PLAYWRIGHT_CORE to the node_modules folder that holds playwright-core (it is not a dependency of the project)'); process.exit(1); }
if (!existsSync(CHROME)) { console.error(`flow-escacs: no browser at ${CHROME}; set CHROME to a Chrome or Chromium binary`); process.exit(1); }
const { chromium } = createRequire(CORE + '/')('playwright-core');
const L = await import('../games/escacs-de-l-estany/logic.js');
const { clean, noteOf, VALID, PROJECTS, CIRCLES, levelText, parse, wantOf, wantQ, rightQ, route, mates, gains, checks, reach, judge, white, delta, dark, countOn,
  VALUE, TONES, FILES, levelIn, poolIn, streakIn, rapidIn, examIn, sheetIn } = L;
const KEY = 'escacs-de-l-estany';
const NOGL = !!process.env.NOGL;

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const same = (what, got, want) => check(JSON.stringify(got) === JSON.stringify(want), `${what}:\n  got      ${JSON.stringify(got)}\n  expected ${JSON.stringify(want)}`);

/* ---------- the five saves ---------- */
const lvOf = f => Array.from({ length: PROJECTS.length * 10 }, (_, k) => f(Math.floor(k / 10), k % 10));
// The map of the board validated but its first level at one star (it opens there), the bishop with three stars and the queen with a few
// levels less, so circle 1 waits for its exam; the rook with two levels done (it opens at level 3, a «Recull les estrelles»), the king half
// done, «Escac i mat» with three levels done. Every board the script plays changes it: the stars, the exam, the record, the run, the sheets
const MID = { so: false, piscina: true, lv: lvOf((i, k) => i === 0 ? (k ? 3 : 1) : i === 2 ? 3 : i === 3 ? [3, 3, 2, 2, 3, 3, 1, 3, 3, 3][k] : i === 1 && k < 2 ? 3 : i === 4 && k < 5 ? 2 : i === 8 && k < 3 ? 3 : 0),
  exams: [true, false, false, false], fulls: 2, rapid: 3, ratxa: 2 };
// the same with the last circle open: «Escac i mat» opens at level 4, its first mate in one
const MATE = { ...MID, exams: [true, true, true, false] };
const SAVES = {
  buida: null,
  mig: MID,
  acabada: { so: false, piscina: true, lv: lvOf(() => 3), exams: [true, true, true, true], fulls: 12, rapid: 25, ratxa: 30 },
  // what an old or broken browser could hold: lv too short and with junk, an exam null, a record that is not a number
  estranya: { so: false, lv: [3, 1, 2, 'x', -4, 9], exams: [true, null], rapid: NaN, ratxa: '7', fulls: 'molts' },
  // piscina false, but levels with stars: the Piscina counts as done
  'sense piscina': { so: false, piscina: false, lv: lvOf((i, k) => i === 1 && k < 3 ? 2 : 0), exams: [false, false, false, false], fulls: 0, rapid: 3, ratxa: 2 }
};

/* ---------- the browser ---------- */
const GL = NOGL ? ['--disable-3d-apis', '--disable-webgl'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: GL });
let opened = [], pageErrors = [], ran = 0;
async function section(name, fn) {
  if (process.env.ONLY && !name.includes(process.env.ONLY)) return;
  ran++; const t0 = Date.now();
  try { await fn(); } catch (e) {
    check(false, `${name}: stopped on ${String(e.message).split('\n')[0]}`);
    // what was on screen when it stopped
    for (const c of opened) for (const pg of c.pages()) console.error('  on screen:', await pg.evaluate(() => { const e = window.__escacs || {}; return { kick: document.querySelector('#kick')?.textContent, what: e.what, pas: e.pas, k: e.k, ready: e.ready, pos: e.pos, q: e.q, tip: document.querySelector('#tip')?.textContent, ask: document.querySelector('#ask')?.textContent, world: { ...document.querySelector('#world')?.dataset } }; }).catch(e => e.message));
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
  await page.addInitScript(() => {
    const now = performance.now.bind(performance), st = window.setTimeout.bind(window);
    window.__skew = 0; performance.now = () => now() + window.__skew;
    window.setTimeout = (f, d, ...a) => st(f, d >= 400 ? d / 10 : d, ...a);
  });
  await page.goto(BASE + '/index.html');
  await page.evaluate(async ([key, save]) => { const P = await import('/shared/progress.js'); const a = P.add('Prova'); P.choose(a?.id ?? a); P.load(key); if (save) P.save(key, save); }, [KEY, save]);
  await page.goto(BASE + '/escacs-de-l-estany.html' + q);
  await page.waitForSelector(first, { timeout: 30000 });
  return page;
}
const stored = page => page.evaluate(async key => { const P = await import('/shared/progress.js'); return P.load(key); }, KEY);
const tap = (page, sel) => page.evaluate(sel => { const e = document.querySelector(sel); if (!e) throw new Error('no ' + sel); e.click(); }, sel);
const wait = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 30000, polling: 50 });
const sideways = page => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const SQUARES = [...FILES].flatMap(f => [1, 2, 3, 4, 5, 6, 7, 8].map(r => f + r));
// the save after a board: what logic.js gives, and never the save before (a board that changes nothing would check nothing)
async function after(page, what, before, want) { const got = await stored(page); same(what, got, want); check(JSON.stringify(got) !== JSON.stringify(before), `${what}: the board changed the save`); }
// the longest run of answers right at the first try
function topOf(done) { let run = 0, top = 0; for (const d of done) { run = d.wrong ? 0 : run + 1; top = Math.max(top, run); } return top; }

/* ---------- answering what is on the screen ---------- */
// The move a level asks for now, worked out in Node from the level and the position on screen: [from, to]
function moveOf(Lv, pos, st, found) {
  if (Lv.t === 'sq') return [null, wantOf(Lv.asks[st.k])];
  const from = Object.keys(pos.at).find(s => white(pos.at[s]));
  if (Lv.t === 'reach') return [from, reach(pos, from).find(s => judge(pos, from, s).ok && !found.includes(s))];
  if (Lv.t === 'go' || Lv.t === 'take') return route(Lv, pos, Lv.max - st.used)[0];
  if (Lv.t === 'best') { const g = gains(pos)[0]; return [g.from, g.to]; }
  return (Lv.t === 'check' ? checks(pos) : mates(pos))[0];
}
// a move the piece cannot make: the first square it cannot go to
function badOf(Lv, pos, from, good) {
  if (Lv.t === 'sq') return SQUARES.find(s => s !== good);
  return SQUARES.find(s => s !== from && !judge(pos, from, s).ok);
}
// Plays the level that is open until its end. wrong(n) says which answer is given badly first (n counts the answers). Gives one { wrong }
// per answer
async function level(page, sec, idx, { wrong = () => false } = {}) {
  const Lv = PROJECTS[sec].levels[idx], two = Lv.t !== 'sq' && Object.values(parse(Lv.pos).at).filter(white).length > 1;
  const done = [], found = [];
  let seen = 0;
  for (let n = 0; ; n++) {
    const what = await wait(page, seen => { if (document.querySelector('#nx')) return 'end'; const e = window.__escacs; return e.what === 'nivell' && e.pas > seen && e.ready ? 'q' : false; }, seen);
    if (await what.jsonValue() === 'end') return done;
    const st = await page.evaluate(() => { const e = window.__escacs; return { sec: e.sec, idx: e.idx, pas: e.pas, k: e.k, pos: e.pos, used: e.used, slips: e.slips }; });
    if (!n) same('the level on screen', [st.sec, st.idx], [sec, idx]);
    seen = st.pas;
    const pos = parse(st.pos), [from, to] = moveOf(Lv, pos, st, found), text = s => (two ? from : '') + s, bad = wrong(n);
    check(to, `level ${sec}.${idx}: a move to play from ${st.pos}`);
    if (bad) {
      await page.keyboard.type(text(badOf(Lv, pos, from, to))); await page.keyboard.press('Enter');
      await wait(page, s => window.__escacs.slips > s && window.__escacs.ready, st.slips);
    }
    if (Lv.t === 'reach') found.push(to);
    done.push({ wrong: bad });
    await page.keyboard.type(text(to)); await page.keyboard.press('Enter');
  }
}
// what a sheet says, worked out in Node: whether value v makes the claim true
function holds(C, v) {
  switch (C.kind) {
    case 'move': return reach({ at: { [C.from]: C.t }, stars: [], rocks: [] }, C.from).includes(v);
    case 'tone': return v === TONES[+dark(C.s)];
    case 'val': return v === String(C.ps.reduce((s, p) => s + VALUE[p], 0));
    case 'count': return v === String(countOn(C.t, C.s));
    default: return v === String(Math.max(...delta(C.a, C.b).map(Math.abs)));
  }
}
// an answer to a quick question: typed (with ✓, but in the lightning round) or chosen among its buttons
async function give(page, q, ans, how) {
  if (q.opts) return page.evaluate(v => { const b = document.querySelector(`[data-pick="${v}"]`); if (!b) throw new Error('no choice ' + v); b.click(); }, ans);
  await page.keyboard.type(ans);
  if (how !== 'rapid') await page.keyboard.press('Enter');
}
// Plays the quick questions of a board (the Piscina, an exam, a lightning round) until its end. wrong(k) says which is answered badly first;
// stop(k) ends before question k without answering it. Gives one { q, ans, wrong } per question
async function quick(page, { wrong = () => false, stop = () => false } = {}) {
  const done = [];
  let seen = 0;
  for (let k = 0; ; k++) {
    const what = await wait(page, seen => { const e = window.__escacs; if (e.what === 'pregunta' && e.pas > seen && e.ready) return 'q'; return document.querySelector('#nx, #bk') ? 'end' : false; }, seen);
    if (await what.jsonValue() === 'end') return done;
    const st = await page.evaluate(() => { const e = window.__escacs; return { pas: e.pas, q: e.q, how: e.how, slips: e.slips }; });
    seen = st.pas;
    if (stop(k)) return done;
    const q = st.q, ans = wantQ(q), bad = wrong(k);
    check(rightQ(q, ans), `the answer worked out for ${JSON.stringify(q)} is right`);
    done.push({ q, ans, wrong: bad });
    if (bad) {
      await give(page, q, q.opts ? q.opts.find(v => !rightQ(q, v)) : SQUARES.find(s => !rightQ(q, s)), st.how);
      if (st.how === 'exam') { await wait(page, () => document.querySelector('#go')); await tap(page, '#go'); continue; }
      if (st.how === 'rapid') continue;
      await wait(page, s => window.__escacs.slips > s && window.__escacs.ready, st.slips);
    }
    await give(page, q, ans, st.how);
  }
}

/* ---------- the map ---------- */
for (const [name, save] of Object.entries(SAVES)) {
  if (!save) continue;
  await section(`mapa: partida ${name}`, async () => {
    const page = await open(save), p = clean(save);
    const seen = await page.evaluate(() => ({
      marks: [...document.querySelectorAll('.proj[data-p]')].map(b => [+b.dataset.p, b.querySelector('.mk').textContent]),
      exams: [...document.querySelectorAll('.proj.exam[data-x]')].map(b => [+b.dataset.x, b.querySelector('.mk').textContent === 'Superat ✓']),
      rapid: document.querySelector('#rapid')?.textContent || '', xp: document.querySelector('#xp .xp-n')?.textContent || ''
    }));
    same(`${name}: projects on the map`, seen.marks.map(m => m[0]).sort((a, b) => a - b), PROJECTS.map((_, i) => i));
    for (const [i, mk] of seen.marks) {
      const n = noteOf(p, i), d = p.lv.slice(i * 10, i * 10 + 10).filter(Boolean).length;
      // contract: shared/mapa.js noteText, with the note of logic.js
      same(`${name}: project ${i} says`, mk, n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer');
    }
    same(`${name}: exams passed on the map`, seen.exams, CIRCLES.map((_, c) => [c, p.exams[c]]));
    same(`${name}: record on the map`, p.rapid ? +(seen.rapid.match(/rècord (\d+)/) || [])[1] : /rècord/.test(seen.rapid), p.rapid || false);
    same(`${name}: XP level`, seen.xp, `Nivell ${levelText(p)}`);
    // opening the map writes nothing
    same(`${name}: the save after the map`, await stored(page), save);
    same(`${name}: sideways scroll on a phone`, await sideways(page), 0);
  });
}

/* ---------- the levels ---------- */
await section('nivell de caselles sense errades', async () => {
  const page = await open(MID);
  await tap(page, '.proj[data-p="0"]');
  const done = await level(page, 0, 0);
  same('answers', done.length, 3);
  same('sideways scroll on a phone, in a level', await sideways(page), 0);
  await after(page, 'the save after a level with no mistake', MID, levelIn(streakIn(clean(MID), 3).prog, 0, 0, 0).prog);
});

await section('recull les estrelles amb una errada', async () => {
  const page = await open(MID);
  await tap(page, '.proj[data-p="1"]');
  const done = await level(page, 1, 2, { wrong: n => n === 0 });
  same('answers', done.length, 1);
  await after(page, 'the save after a level with one mistake', MID, levelIn(streakIn(clean(MID), topOf(done)).prog, 1, 2, 1).prog);
});

await section('mat en una', async () => {
  const page = await open(MATE);
  await tap(page, '.proj[data-p="8"]');
  const done = await level(page, 8, 3);
  same('answers', done.length, 1);
  await after(page, 'the save after a mate', MATE, levelIn(streakIn(clean(MATE), 1).prog, 8, 3, 0).prog);
});

/* ---------- the boards of quick questions ---------- */
await section('partida buida: la Piscina', async () => {
  const page = await open(null, '#ask');
  same('the first screen of an empty save', await page.evaluate(() => document.querySelector('#kick').textContent), 'La Piscina');
  check(!(await page.$('.map')), 'an empty save shows no map');
  const done = await quick(page, { wrong: k => k === 1 });
  same('questions of the Piscina', done.length, 3);
  await after(page, 'the save after the Piscina', null, poolIn(clean(null)).prog);
  await tap(page, '#nx'); await page.waitForSelector('.map');
});

await section('examen', async () => {
  const page = await open(MID);
  await tap(page, '.proj.exam[data-x="1"]');
  const done = await quick(page, { wrong: k => k === 2 });
  same('questions of an exam', done.length, 6);
  const r = examIn(streakIn(clean(MID), topOf(done)).prog, 1, done.map(d => d.q), done.map(d => !d.wrong));
  check(r.good, 'five of six with the circle validated passes the exam');
  await after(page, 'the save after the exam', MID, r.prog);
});

await section('repte llampec', async () => {
  const page = await open(MID);
  await tap(page, '#rapid');
  await page.waitForSelector('#go'); await tap(page, '#go');
  const done = await quick(page, { wrong: k => k === 4, stop: k => k === 7 });
  // the minute is over
  await page.evaluate(() => { window.__skew += 61000; });
  await page.waitForSelector('#bk', { timeout: 30000 });
  const hits = done.filter(d => !d.wrong).length;
  same('right answers of the round', hits, 6);
  await after(page, 'the save after the lightning round', MID, rapidIn(streakIn(clean(MID), topOf(done)).prog, hits).prog);
});

await section("caça l'errada", async () => {
  const page = await open(MID);
  await tap(page, '#full');
  const marks = [];
  for (let k = 0; k < 3; k++) {
    await wait(page, k => { const e = window.__escacs; return e.what === 'full' && e.k === k && e.ready && document.querySelector('#yes'); }, k);
    const C = await page.evaluate(() => window.__escacs.claim);
    await page.waitForTimeout(500);   // a tap right after the claim comes up is ignored (SETTLE)
    if (holds(C, C.says)) { await tap(page, '#yes'); marks.push(true); continue; }
    await tap(page, '#no');
    await wait(page, () => document.querySelector('[data-v]'));
    await page.waitForTimeout(500);
    const good = C.opts.find(v => holds(C, v));
    check(good !== undefined, `one of the options makes the claim ${JSON.stringify(C)} true`);
    await tap(page, `[data-v="${good}"]`);
    marks.push(true);
  }
  await page.waitForSelector('#bk', { timeout: 30000 });
  await after(page, 'the save after a sheet', MID, sheetIn(clean(MID), marks).prog);
});

await browser.close();
if (process.env.ONLY && !ran) { console.error(`flow-escacs: no section matches ONLY=${process.env.ONLY}`); process.exit(1); }
console.log(fails ? `flow-escacs: ${fails} FAIL` : `flow-escacs: ${ran} sections OK${NOGL ? ' (without WebGL)' : ''}`);
process.exit(fails ? 1 : 0);
