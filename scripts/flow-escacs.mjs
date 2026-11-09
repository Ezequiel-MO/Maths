// Browser check of what Els escacs de l'estany does with the progress of a child (rule number one of docs/plans/2026-11-09-escacs-3d.md):
// the game may change how it looks, never what it reads from a save nor what it writes into one.
//   - The map, from five saves (empty, half done, finished, odd and with piscina false but stars): the mark of every project, the exams,
//     the record of the lightning round and the XP level must be what logic.js gives in Node, and opening the map writes nothing.
//   - Then it plays: a level of squares with no mistake, a «Recull les estrelles» with one mistake, a mate in one, the Piscina, an exam, a
//     lightning round and a sheet. It reads what is on screen from window.__escacs (the level or the question, the position, the step) and
//     works the answer out in Node with logic.js. After each, the saved document must be exactly what the functions of logic.js give for
//     those right and wrong answers (levelIn, poolIn, examIn, rapidIn, sheetIn and streakIn, in the order main.js calls them).
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
// Run (the dev server must be up: `npx vite --port 5232`; do not edit files while it runs, Vite reloads the page. When the network of the
// machine changes, a container starting, Vite's live reload reloads the page too: a server with `server: { hmr: false }` avoids it):
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
// slow: the page draws one frame a second, as a tired tablet might (what decides the game must go on with the clock); still: the
// browser asks for reduced motion
async function open(save, first = '.map', w = 390, h = 844, q = '', slow = false, still = false) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: still ? 'reduce' : 'no-preference' }), page = await ctx.newPage();
  opened.push(ctx);
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|favicon|firestore|firebase/i.test(m.text())) pageErrors.push('console: ' + m.text()); });
  await page.addInitScript(slow => {
    const now = performance.now.bind(performance), st = window.setTimeout.bind(window);
    window.__skew = 0; performance.now = () => now() + window.__skew;
    window.setTimeout = (f, d, ...a) => st(f, d >= 400 ? d / 10 : d, ...a);
    if (slow) { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => st(() => raf(f), 1000); }
  }, slow);
  // When the machine's network changes (a container starting), Chrome drops what it was loading, even from localhost: the page is loaded
  // again, up to three times. Only that is tried again; any other error stops the section
  for (let n = 1; ; n++) {
    try {
      await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
      await page.evaluate(async ([key, save]) => { const P = await import('/shared/progress.js'); const a = P.add('Prova'); P.choose(a?.id ?? a); P.load(key); if (save) P.save(key, save); }, [KEY, save]);
      await page.goto(BASE + '/escacs-de-l-estany.html' + q, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(first, { timeout: 30000 });
      return page;
    } catch (e) {
      if (n >= 3 || !/ERR_NETWORK_CHANGED|Failed to fetch dynamically imported module|net::ERR_|page.goto: Timeout/.test(e.message + pageErrors.join())) throw e;
      console.log(`  (the network changed while loading: ${e.message.split("\n")[0]}; again, ${n + 1} of 3)`);
      pageErrors = pageErrors.filter(m => !/ERR_NETWORK_CHANGED|Failed to fetch|net::ERR_/.test(m));
    }
  }
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

/* ---------- the garden: a statue lit for each project validated, a star of the knight lit for each exam passed ---------- */
if (!NOGL) await section('jardí: estàtues i estrelles', async () => {
  for (const [name, save, q] of [['mig', MID, ''], ['acabada', SAVES.acabada, ''], ['estranya', SAVES.estranya, ''], ['mig amb ?obert', MID, '?obert']]) {
    const page = await open(save, '.map', 390, 844, q), p = clean(save);
    await wait(page, () => document.querySelector('#world').dataset.estatues !== undefined);
    const got = await page.evaluate(() => ({ ...document.querySelector('#world').dataset }));
    same(`${name}: statues lit`, +got.estatues, q ? PROJECTS.length : L.validated(p).length);
    same(`${name}: stars lit`, +got.estrelles, p.exams.filter(Boolean).length);
    // a project under the finger lights its statue and the camera goes to its group; leaving the list gives the garden back
    await page.hover('.proj[data-p="5"]');
    await wait(page, () => window.__terrassa.view === 'c2' && window.__terrassa._.D.view === 'c2');
    await page.mouse.move(5, 5);
    await wait(page, () => window.__terrassa.view === 'map' && window.__terrassa._.D.view === 'map');
    await page.context().close();
  }
});

/* ---------- the board of the terrace: the same calls as the board of the page ---------- */
// what the terrace says it shows (#world dataset.pos): the pieces by square as logic.js keys a position, then the stars and the pebbles
const keyOf = pos => Object.keys(pos.at).sort().map(s => s + pos.at[s]).join() + '|' + [...pos.stars].sort().join() + '|' + [...pos.rocks].sort().join();
const shown = page => page.evaluate(() => document.querySelector('#world').dataset.pos);
if (!NOGL) await section('tauler 3D: el contracte', async () => {
  for (const [w, h] of [[390, 844], [1280, 800], [820, 1180]]) {
    const page = await open(MID, '.map', w, h);
    await tap(page, '.proj[data-p="1"]');
    await wait(page, () => window.__escacs.what === 'nivell' && window.__escacs.ready);
    // the camera has arrived over the board
    await page.evaluate(() => window.__terrassa.go('board'));
    // every square, and the letters and numbers of the frame, in the part of the screen the panel leaves free
    const fit = await page.evaluate(() => {
      const D = window.__terrassa._.D, at = (x, z) => D.onScreen(D.target.clone().set(x, 0.06, z)), out = [];
      for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) out.push(at(i - 4, j - 4));
      for (let i = 0; i < 8; i++) out.push(at(i - 3.5, 4.43), at(-4.43, i - 3.5));
      const sheet = document.querySelector('#sheet').getBoundingClientRect(), top = document.querySelector('.top').getBoundingClientRect().bottom;
      const right = sheet.left > innerWidth / 2 ? sheet.left : innerWidth, bottom = sheet.left > innerWidth / 2 ? innerHeight : sheet.top;
      return { out: out.filter(p => p.x < 0 || p.x > right || p.y < top || p.y > bottom).length, n: out.length, right, bottom, top };
    });
    same(`${w}×${h}: corners of squares and signs of the frame out of the free part`, fit.out, 0);
    const pts = await page.evaluate(() => { const B = window.__terrassa.tauler(); return [B.point('a1'), B.point('h8')]; });
    check(pts[0].x < pts[1].x && pts[0].y > pts[1].y, `${w}×${h}: a1 is at the bottom left of h8 (${JSON.stringify(pts)})`);
    if (w !== 390) { await page.context().close(); continue; }
    // the lights of what is typed
    for (const part of ['c', 'c4', '']) same(`preview('${part}') lights`, await page.evaluate(p => { window.__terrassa.tauler().preview(p); return document.querySelector('#world').dataset.llum; }, part), part);
    // every level: draw puts on the terrace exactly the pieces, the stars and the pebbles of parse(L.pos)
    const all = PROJECTS.flatMap((P, i) => P.levels.map((Lv, k) => [`${i}.${k}`, parse(Lv.pos || '')]));
    const got = await page.evaluate(all => { const B = window.__terrassa.tauler(); return all.map(([n, pos]) => { B.draw(pos, {}); return document.querySelector('#world').dataset.pos; }); }, all);
    all.forEach(([n, pos], i) => same(`level ${n} on the terrace`, got[i], keyOf(pos)));
    // two test games played with go(): captures that fall in the water, a pawn crowned, stars collected; each ends where move() says
    for (const [p, i] of [[6, 9], [5, 7]]) {
      const Lv = PROJECTS[p].levels[i];
      let pos = parse(Lv.pos);
      await page.evaluate(pos => window.__terrassa.tauler().draw(pos, {}), pos);
      for (const [a, b] of route(Lv, pos, Lv.max)) {
        pos = judge(pos, a, b, Lv.safe).pos;
        await page.evaluate(([a, b, pos]) => window.__terrassa.tauler().go(a, b, pos), [a, b, pos]);
        same(`level ${p}.${i}: after ${a}-${b}`, await shown(page), keyOf(pos));
      }
      await wait(page, () => document.querySelector('#world').dataset.ocupat === '0');
      same(`level ${p}.${i}: pieces on the terrace at the end`, await page.evaluate(() => window.__terrassa._.pieces()), Object.keys(pos.at).length);
    }
    // a page left open goes on drawing: closed before the next one, which builds its terrace on the same processor
    await page.context().close();
  }
});

/* ---------- the levels ---------- */
await section('nivell de caselles sense errades', async () => {
  const page = await open(MID);
  await tap(page, '.proj[data-p="0"]');
  // with the terrace the board is on it, and the board of the page is hidden; without WebGL the board of the page is played
  await wait(page, () => window.__escacs.what === 'nivell');
  same('the board of the page on screen', await page.evaluate(() => { const e = document.querySelector('#field svg.bd'); return !!e && e.getBoundingClientRect().height > 200; }), NOGL);
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

// A «Recull les estrelles» that runs out of moves starts again: on the terrace too the pieces go back to where they were. The rook of
// b2 goes to a2 (a move it can make), and from there one move cannot collect b6 and f6
const RESTART = { ...MID, lv: MID.lv.map((s, k) => k >= 10 && k < 13 ? 3 : s) };
await section('recull les estrelles sense moviments', async () => {
  const page = await open(RESTART);
  await tap(page, '.proj[data-p="1"]');
  await wait(page, () => window.__escacs.what === 'nivell' && window.__escacs.ready);
  const Lv = PROJECTS[1].levels[3], st = await page.evaluate(() => ({ idx: window.__escacs.idx, pas: window.__escacs.pas }));
  same('the level that opens', st.idx, 3);
  await page.keyboard.type('a2'); await page.keyboard.press('Enter');
  await wait(page, pas => window.__escacs.slips === 1 && window.__escacs.pas > pas && window.__escacs.ready, st.pas);
  if (!NOGL) { await wait(page, () => document.querySelector('#world').dataset.ocupat === '0'); same('the terrace after starting again', await shown(page), keyOf(parse(Lv.pos))); }
  const done = await level(page, 1, 3);
  same('answers after starting again', done.length, 2);
  await after(page, 'the save after starting again', RESTART, levelIn(streakIn(clean(RESTART), 2).prog, 1, 3, 1).prog);
});

// The level that validates a project: the camera goes back to the garden and its statue lights up
const VALIDATE = { ...MID, lv: MID.lv.map((s, k) => k >= 10 && k < 17 ? 3 : s) };
await section('nivell que valida un projecte', async () => {
  const page = await open(VALIDATE);
  await tap(page, '.proj[data-p="1"]');
  const done = await level(page, 1, 7), want = levelIn(streakIn(clean(VALIDATE), topOf(done)).prog, 1, 7, 0);
  check(want.valid && !L.validated(clean(VALIDATE)).includes(1), 'the level validates the rook');
  await after(page, 'the save after validating a project', VALIDATE, want.prog);
  if (!NOGL) {
    await wait(page, n => document.querySelector('#world').dataset.estatues === String(n) && window.__terrassa.view === 'c0', L.validated(want.prog).length);
  }
});

// With reduced motion nothing moves (the firefly, the frog, the garden opening, the king falling are instant), and the game is the same
await section('moviment reduït', async () => {
  let page = await open(null, '#ask', 390, 844, '', false, true);
  check(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'the page asks for reduced motion');
  const done = await quick(page);
  same('questions of the Piscina, with reduced motion', done.length, 3);
  await after(page, 'the save after the Piscina, with reduced motion', null, poolIn(clean(null)).prog);
  if (!NOGL) same('where the frog is after the steps, with reduced motion', await page.evaluate(() => document.querySelector('#world').dataset.granota), wantQ(done[2].q));
  await page.context().close();
  page = await open(MATE, '.map', 390, 844, '', false, true);
  await tap(page, '.proj[data-p="8"]');
  await level(page, 8, 3);
  await after(page, 'the save after a mate, with reduced motion', MATE, levelIn(streakIn(clean(MATE), 1).prog, 8, 3, 0).prog);
});

/* ---------- the boards of quick questions ---------- */
await section('partida buida: la Piscina', async () => {
  const page = await open(null, '#ask');
  same('the first screen of an empty save', await page.evaluate(() => document.querySelector('#kick').textContent), 'La Piscina');
  check(!(await page.$('.map')), 'an empty save shows no map');
  // the garden is shut until the Piscina is done
  if (!NOGL) same('the garden during the Piscina', await page.evaluate(() => document.querySelector('#world').dataset.jardi), 'tancat');
  const done = await quick(page, { wrong: k => k === 1 });
  same('questions of the Piscina', done.length, 3);
  // the third is «Surt de b2 i fes…»: the frog has made the steps to the answer
  if (!NOGL) same('where the frog is after the steps', await page.evaluate(() => document.querySelector('#world').dataset.granota), wantQ(done[2].q));
  await after(page, 'the save after the Piscina', null, poolIn(clean(null)).prog);
  // saved, the garden opens: its statues come up and its lanterns light
  if (!NOGL) await wait(page, () => document.querySelector('#world').dataset.jardi === 'obert' && window.__terrassa.view === 'map');
  await tap(page, '#nx'); await page.waitForSelector('.map');
});

await section('examen', async () => {
  const page = await open(MID);
  await tap(page, '.proj.exam[data-x="1"]');
  if (!NOGL) {
    // the owl watches from its branch, in the part of the screen the panel leaves free and under the bar at the top
    await wait(page, () => window.__escacs.what === 'pregunta'); await page.evaluate(() => window.__terrassa.go('exam'));
    const o = await page.evaluate(() => ({ p: window.__terrassa._.owl(), top: document.querySelector('.top').getBoundingClientRect().bottom, bottom: document.querySelector('#sheet').getBoundingClientRect().top }));
    check(o.p.x > 0 && o.p.x < 390 && o.p.y > o.top && o.p.y < o.bottom, `the owl on screen: ${JSON.stringify(o)}`);
  }
  const done = await quick(page, { wrong: k => k === 2 });
  same('questions of an exam', done.length, 6);
  same('sideways scroll on a phone, in an exam', await sideways(page), 0);
  const r = examIn(streakIn(clean(MID), topOf(done)).prog, 1, done.map(d => d.q), done.map(d => !d.wrong));
  check(r.good, 'five of six with the circle validated passes the exam');
  await after(page, 'the save after the exam', MID, r.prog);
  // passed for the first time: a star more of the knight in the sky
  if (!NOGL) await wait(page, n => document.querySelector('#world').dataset.estrelles === String(n), r.prog.exams.filter(Boolean).length);
});

// The lightning round, at sixty frames a second and at one: the minute ends with the clock of the page, and the chess clock of the
// terrace drops its flag
for (const slow of NOGL ? [false] : [false, true]) await section(`repte llampec${slow ? ' a 1 fps' : ''}`, async () => {
  const page = await open(MID, '.map', 390, 844, '', slow);
  if (slow) check(await page.evaluate(() => new Promise(r => { let n = 0; const t0 = Date.now(); (function f() { n++; if (Date.now() - t0 < 2500) requestAnimationFrame(f); else r(n); })(); })) <= 4, 'one frame a second');
  await tap(page, '#rapid');
  await page.waitForSelector('#go'); await tap(page, '#go');
  const done = await quick(page, { wrong: k => k === 4, stop: k => k === 7 });
  // the minute is over
  await page.evaluate(() => { window.__skew += 61000; });
  await page.waitForSelector('#bk', { timeout: 30000 });
  const hits = done.filter(d => !d.wrong).length;
  same('right answers of the round', hits, 6);
  await after(page, 'the save after the lightning round', MID, rapidIn(streakIn(clean(MID), topOf(done)).prog, hits).prog);
  if (!NOGL) same('the chess clock at the end', await page.evaluate(() => document.querySelector('#world').dataset.rellotge), 'temps');
});

await section("caça l'errada", async () => {
  const page = await open(MID);
  await tap(page, '#full');
  if (!NOGL) await wait(page, () => window.__terrassa.view === 'lectern');
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
