// Browser check of what the map and a project of l'àbac do with the progress (task 10): the map from a hand-made save, a whole project at the first try,
// a project redone badly, 14 at the first try and one with the hint, the double tap on «Comprova» and on the options, the taps on the beads while the abacus solves itself and in the pause after,
// leaving at question 7, in the middle of the solve, in a pause and after question 15, the sound button in the middle, the guard of 450 ms, the feet of the questions of reading
// and the right number on an untidy abacus. A section that stops (a wait that times out) is one FAIL line and the next ones run. Expected values are written here from the spec («Un projecte», «El que es desa»), not asked of the code under test.
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
// Run (the dev server must be up: `npm run dev`; on this machine it is on port 5199):
//   PLAYWRIGHT_CORE=/home/olive/.claude/jobs/90bddb97/tmp/node_modules BASE=http://localhost:5199 node scripts/flow-abac.mjs
//   PLAYWRIGHT_CORE, CHROME, BASE   as in scripts/sweep-abac.mjs
// Two seams, both put in the page before it loads and neither in the game: performance.now() is moved forward by window.__skew (a tap made right after a question comes up would be
// ignored for 450 ms, so the script moves the clock past that before each tap, except where it is testing that very guard), and a timer of 400 ms or more runs ten times faster (the
// pauses of the game, the steps of the abacus that solves itself).
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5199', CHROME = process.env.CHROME || '/usr/bin/google-chrome', CORE = process.env.PLAYWRIGHT_CORE;
if (!CORE || !existsSync(CORE + '/playwright-core')) { console.error('flow-abac: set PLAYWRIGHT_CORE to the node_modules folder that holds playwright-core (it is not a dependency of the project)'); process.exit(1); }
if (!existsSync(CHROME)) { console.error(`flow-abac: no browser at ${CHROME}; set CHROME to a Chrome or Chromium binary`); process.exit(1); }
const { chromium } = createRequire(CORE + '/')('playwright-core');
const { PROJECTS } = await import('../games/abac-xines/logic.js');   // the questions only: they are what the script has to answer

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL', msg); } };
const same = (what, got, want) => check(JSON.stringify(got) === JSON.stringify(want), `${what}: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);

// the result of a question, worked out here: × and : first, then + and −, from left to right
function result(q) {
  const t = q.match(/\d+|[+\-x:]/g).map(x => /\d/.test(x) ? +x : x);
  for (const ops of [['x', ':'], ['+', '-']]) for (let i = 1; i < t.length;) {
    if (ops.includes(t[i])) { const a = t[i - 1], b = t[i + 1]; t.splice(i - 1, 3, t[i] === 'x' ? a * b : t[i] === ':' ? a / b : t[i] === '+' ? a + b : a - b); } else i += 2;
  }
  return t[0];
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
// a section that throws (a wait that times out, a selector that is not there) is a FAIL line and the next sections still run
let opened = [];
async function section(name, fn) {
  try { await fn(); } catch (e) { check(false, `${name}: stopped on ${String(e.message).split('\n')[0]}`); }
  await Promise.all(opened.map(c => c.close().catch(() => {}))); opened = [];
}
async function open(save, w = 390, h = 844) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true }), page = await ctx.newPage(), errors = [];
  opened.push(ctx); page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    const now = performance.now.bind(performance), st = window.setTimeout.bind(window);
    window.__skew = 0; performance.now = () => now() + window.__skew;
    window.setTimeout = (f, d, ...a) => st(f, d >= 400 ? d / 10 : d, ...a);
  });
  await page.goto(BASE + '/index.html');
  await page.evaluate(async save => { const P = await import('/shared/progress.js'); const a = P.add('Prova'); P.choose(a?.id ?? a); P.load('abac-xines'); P.save('abac-xines', save); }, save);
  await page.goto(BASE + '/abac-xines.html');
  await page.waitForSelector('.map');
  return { ctx, page, errors };
}
const stored = page => page.evaluate(async () => { const P = await import('/shared/progress.js'); return P.load('abac-xines'); });
const skew = page => page.evaluate(() => { window.__skew += 1000; });
const dots = page => page.evaluate(() => ({ cur: [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')), ok: document.querySelectorAll('#dots i.ok').length, late: document.querySelectorAll('#dots i.late').length }));
async function openProject(page, i) {
  await skew(page);
  await page.evaluate(i => document.querySelector(`.proj[data-p="${i}"]`).click(), i);
  await page.waitForSelector('#dots');
}
// put the beads of the abacus on a number: for each column the heaven bead and the earth beads that count, tapping the one that makes it so
const setTo = (page, goal) => page.evaluate(goal => {
  for (const rod of document.querySelectorAll('.abacus .rod')) {
    const p = +rod.dataset.p, d = Math.floor(goal / 10 ** p) % 10, wantHi = d >= 5 ? 1 : 0, wantLo = d % 5, bead = (deck, j) => rod.querySelector(`.bead[data-deck="${deck}"][data-j="${j}"]`);
    const hi = rod.querySelectorAll('.bead.on[data-deck="hi"]').length, lo = rod.querySelectorAll('.bead.on[data-deck="lo"]').length;
    if (hi !== wantHi) bead('hi', 0).click();
    if (wantLo > lo) bead('lo', wantLo - 1).click(); else if (wantLo < lo) bead('lo', wantLo).click();
  }
}, goal);
// the question on screen answered at the first try (right = true) or badly: an abacus left as it is, twice (the second mistake solves it), or a wrong option and then the right one
async function answer(page, q, right) {
  await skew(page);
  if (q.read !== undefined) {
    if (!right) { const wrong = q.opts.find(v => v !== q.read); await page.evaluate(v => document.querySelector(`.opts [data-v="${v}"]`).click(), wrong); await skew(page); }
    await page.evaluate(v => document.querySelector(`.opts [data-v="${v}"]`).click(), q.read);
  } else if (right) { await setTo(page, result(q.q)); await page.evaluate(() => document.querySelector('#chk').click()); }
  else { await page.evaluate(() => document.querySelector('#chk').click()); await skew(page); await page.evaluate(() => document.querySelector('#chk').click()); }
}
// a whole project, from question `from` up to (not including) `stopAt`; bad(k) says which questions are answered badly and hinted(k) which ask for the hint first. Ends on the panel, or on question stopAt
async function play(page, i, { bad = () => false, hinted = () => false, from = 0, stopAt = Infinity } = {}) {
  const qs = PROJECTS[i].ex.flat();
  for (let k = from; k < Math.min(qs.length, stopAt); k++) {
    await page.waitForFunction(k => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) === k, k, { timeout: 15000 });
    if (hinted(k)) { await skew(page); await page.evaluate(() => document.querySelector('#hintb').click()); }
    await answer(page, qs[k], !bad(k));
    if (k < qs.length - 1) await page.waitForFunction(k => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) === k + 1, k, { timeout: 15000 });
  }
  if (stopAt >= qs.length) await page.waitForSelector('.panel', { timeout: 15000 });
}
const panelText = page => page.evaluate(() => document.querySelector('.panel')?.innerText ?? '');

// ---- the map from a hand-made save (the old shape): circle 0 open, projects 0 to 3 at 80, circles 1 and 2 shut, as the spec «El que es desa» says for { secs: [10, 10, 4, 0, 0, 0] }
await section('the map from a hand-made save (the old shape)', async () => {
  const { ctx, page, errors } = await open({ secs: [10, 10, 4, 0, 0, 0] });
  const map = await page.evaluate(() => [...document.querySelectorAll('.ring')].map(r => ({ shut: r.classList.contains('shut'), btns: [...r.querySelectorAll('.proj')].map(b => ({ off: b.disabled, mk: b.querySelector('.mk').textContent })) })));
  same('map from { secs: [10,10,4,0,0,0] }: which circles are shut', map.map(r => r.shut), [false, true, true]);   // contract: spec «El mapa», un cercle només és obert si l'anterior també ho és; l'examen del cercle 0 no s'ha passat
  same('map from { secs: [10,10,4,0,0,0] }: the marks', map.flatMap(r => r.btns.map(b => b.mk)), ['Nota 80 · validat ✓', 'Nota 80 · validat ✓', 'Nota 80 · validat ✓', 'Nota 80 · validat ✓', 'Per fer', 'Per fer', 'Per fer', 'Per fer', 'Per fer']);   // contract: spec «El que es desa», { secs: [10,10,4,0,0,0] } dona notes [80,80,80,80,0,0,0,0,0]
  same('map from { secs: [10,10,4,0,0,0] }: which buttons are off', map.flatMap(r => r.btns.map(b => b.off)), [false, false, true, true, true, true, true, true, true]);   // contract: plan Task 10, un cercle tancat té els botons desactivats
  const mapBefore = JSON.stringify(await stored(page));
  await page.evaluate(() => document.querySelector('#so').click()); await page.evaluate(() => document.querySelector('#so').click());
  const after = await stored(page);
  same('the saved secs after the sound button (the new game writes it back as it came)', after.secs, [10, 10, 4, 0, 0, 0]);   // contract: spec «El que es desa», secs es conserva tal com és
  check(JSON.parse(mapBefore).notes === undefined, 'the seed already has notes: the test would say nothing');
  same('the saved notes after the sound button', after.notes, [80, 80, 80, 80, 0, 0, 0, 0, 0]);   // contract: spec «El que es desa», clean tradueix i es desa sencer
  // a save with nothing: every circle is shut (the Piscina comes in a later task)
  await ctx.close();
  const e = await open({}); const shut = await e.page.evaluate(() => [...document.querySelectorAll('.ring')].map(r => r.classList.contains('shut')));
  same('map from {}: circles shut', shut, [true, true, true]);   // contract: plan Task 10, un progrés sense Piscina veu el cercle 0 tancat
  await e.ctx.close();
});

// ---- a whole project at the first try gives 100 and is saved; doing it badly after does not lower it
await section('a whole project at the first try gives 100 and is saved; doing it badl', async () => {
  const { ctx, page, errors } = await open({ secs: [10, 10, 4, 0, 0, 0] });
  await openProject(page, 0);
  await play(page, 0);
  const txt = await panelText(page), s1 = await stored(page);
  check(/Nota 100/.test(txt), `a project at the first try: the panel says «${txt.replace(/\n/g, ' | ')}», expected Nota 100`);   // contract: spec «La nota», round(100 x 15 / 15)
  check(/\+20 XP/.test(txt), `a project at the first try over a stored 80: the panel says «${txt.replace(/\n/g, ' | ')}», expected +20 XP`);   // contract: spec «XP», en millorar, només la diferència (100 - 80)
  check(s1.notes[0] === 100, `a project at the first try: saved notes[0] is ${s1.notes[0]}, expected 100`);   // contract: plan Task 10
  same('after a project: the saved secs', s1.secs, [10, 10, 4, 0, 0, 0]);   // contract: spec «El que es desa», el joc nou no escriu mai secs
  await skew(page); await page.evaluate(() => document.querySelector('#rp').click()); await page.waitForSelector('#dots');
  await play(page, 0, { bad: () => true });
  const txt2 = await panelText(page), s2 = await stored(page);
  check(/Nota 0/.test(txt2) && /continua sent 100/.test(txt2), `a project redone badly: the panel says «${txt2.replace(/\n/g, ' | ')}», expected Nota 0 and the best mark 100 kept`);   // contract: spec «La nota», refer un projecte no la baixa mai
  check(s2.notes[0] === 100, `a project redone badly: saved notes[0] is ${s2.notes[0]}, expected 100`);   // contract: spec «La nota», es guarda la millor nota
  same('a project redone badly: the rest of the progress', { ...s2, notes: null }, { ...s1, notes: null });   // contract: spec «El que es desa», només hi ha pujades
  if (errors.length) check(false, 'page error: ' + errors[0]);
  await ctx.close();
});

// ---- 14 at the first try and one with the hint: round(100 x 14 / 15) = 93; a hint on a question of reading and on one of operation both stop counting
for (const [name, k] of [['operation', 0], ['reading', 2]]) await section(`a hint on a question of ${name}`, async () => {
  const { ctx, page } = await open({ piscina: true });
  await openProject(page, 1);
  await play(page, 1, { hinted: j => j === k });
  const txt = await panelText(page), s = await stored(page);
  check(/Nota 93/.test(txt) && s.notes[1] === 93, `14 at the first try and a hint on a question of ${name}: the panel says «${txt.replace(/\n/g, ' | ')}», saved notes[1] ${s.notes[1]}, expected Nota 93 and 93`);   // contract: spec «La nota», una pregunta amb pista no compta: round(100 x 14 / 15) = 93
  await ctx.close();
});

// ---- the double tap on «Comprova» with a wrong abacus is one attempt (Review Focus 1); then a second real mistake solves it, and the beads tapped meanwhile change nothing
await section('the double tap on «Comprova» with a wrong abacus is one attempt (Revie', async () => {
  const { ctx, page } = await open({ piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] });
  await openProject(page, 2);   // Sumes: 2 + 2 first, the abacus starts on 2
  await page.waitForSelector('#chk'); await skew(page);
  await page.evaluate(() => { const b = document.querySelector('#chk'); b.click(); b.click(); });
  await page.waitForTimeout(150);
  const s = await page.evaluate(() => ({ locked: document.querySelector('.abacus').classList.contains('locked'), tip: document.querySelector('#tip').textContent, late: document.querySelectorAll('#dots i.late').length, cur: [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) }));
  check(!s.locked && s.late === 0 && s.cur === 0 && /^Ara l'àbac marca 2; ha de marcar 4/.test(s.tip), `a double tap on «Comprova» with a wrong abacus: ${JSON.stringify(s)}, expected one mistake (the abacus free, the question open, the tip of the first mistake)`);   // contract: plan Task 10, Review Focus 1, un sol intent
  // the second mistake, a tap later: the abacus solves itself; the beads are tapped all the time and the value when it ends is the result
  await skew(page);
  const end = await page.evaluate(() => new Promise(done => {
    const value = () => [...document.querySelectorAll('.abacus .rod')].reduce((a, r) => a + (r.querySelectorAll('.bead.on[data-deck="lo"]').length + 5 * r.querySelectorAll('.bead.on[data-deck="hi"]').length) * 10 ** r.dataset.p, 0);
    new MutationObserver((_, o) => { if (/^Ara l'àbac marca \d+\./.test(document.querySelector('#tip').textContent)) { o.disconnect(); clearInterval(tap); done({ value: value(), cur: [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) }); } }).observe(document.querySelector('#tip'), { childList: true, characterData: true, subtree: true });
    const beads = [...document.querySelectorAll('.abacus .bead')], tap = setInterval(() => beads[Math.floor(Math.random() * beads.length)].click(), 5);
    document.querySelector('#chk').click();
  }));
  check(end.value === 4 && end.cur === 0, `beads tapped while the abacus solves itself: it ends on ${end.value} at question ${end.cur + 1}, expected 4 at question 1`);   // contract: plan Task 10, Review Focus 1, 2 + 2 = 4
  await page.waitForFunction(() => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) === 1);
  const d = await dots(page);
  check(d.ok === 0 && d.late === 1, `after two mistakes the question is recorded as missed once: ${JSON.stringify(d)}, expected 0 ok and 1 late`);   // contract: spec «La nota», una pregunta compta si s'encerta al primer «Comprova»
  await ctx.close();
});

// ---- the double tap on «Comprova» with the right abacus counts once and moves one question on, not two (a question skipped or kept twice would also push handIn past 15 results)
await section('the double tap on «Comprova» with the right abacus counts once and mov', async () => {
  const { ctx, page } = await open({ piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] });
  await openProject(page, 3);   // 4 + 1 = 5
  await skew(page); await setTo(page, 5);
  await page.evaluate(() => { const b = document.querySelector('#chk'); b.click(); b.click(); });
  await page.waitForFunction(() => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) >= 1, null, { timeout: 5000 });
  await page.waitForTimeout(500);
  const d = await dots(page);
  check(d.cur === 1 && d.ok === 1, `a double tap on «Comprova» with the right abacus: ${JSON.stringify(d)}, expected question 2 on screen and 1 right`);   // contract: plan Task 10, el projecte no pot registrar una pregunta dues vegades (una vegada de més cap a la nota 107)
  await ctx.close();
});

// ---- the right number on an abacus that is not tidy (five lower beads up) is a failed attempt, not a right answer (4 + 1, the first question of El canvi de 5: the abacus starts on 4 and the result is 5)
await section('the right number on an abacus that is not tidy (five lower beads up) i', async () => {
  const { ctx, page } = await open({ piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] });
  await openProject(page, 3);   // 4 + 1: the abacus starts on 4, the result is 5
  await skew(page);
  await page.evaluate(() => { const r = document.querySelector('.abacus .rod[data-p="0"]'); r.querySelector('.bead[data-deck="lo"][data-j="4"]').click(); document.querySelector('#chk').click(); });
  await page.waitForTimeout(100);
  const s = await page.evaluate(() => ({ tip: document.querySelector('#tip').textContent, cur: [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')), ok: document.querySelectorAll('#dots i.ok').length, lit: document.querySelectorAll('.abacus .bead.on').length }));
  check(/^El nombre és correcte, però cal endreçar/.test(s.tip) && s.cur === 0 && s.ok === 0 && s.lit === 5, `five lower beads up for 4 + 1: ${JSON.stringify(s)}, expected a failed attempt (the number is right, the abacus untidy) and the question still open`);   // contract: spec «Un projecte», bona quan l'àbac marca el resultat i està endreçat; plan Task 10
  // tidy it (the heaven bead alone) and the answer is right, but it does not count
  await page.evaluate(() => { const r = document.querySelector('.abacus .rod[data-p="0"]'); r.querySelector('.bead[data-deck="lo"][data-j="0"]').click(); r.querySelector('.bead[data-deck="hi"]').click(); });
  await skew(page); await page.evaluate(() => document.querySelector('#chk').click());
  await page.waitForFunction(() => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) === 1);
  const d = await dots(page);
  check(d.ok === 0 && d.late === 1, `the question right at the second try: ${JSON.stringify(d)}, expected 0 ok and 1 late`);   // contract: spec «La nota», només el primer «Comprova» compta
  await ctx.close();
});

// ---- leaving with «← Mapa» at question 7 saves nothing, and the project starts again at question 1 (Review Focus 2)
await section('leaving with «← Mapa» at question 7 saves nothing, and the project sta', async () => {
  const { ctx, page } = await open({ piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] });
  const before = JSON.stringify(await stored(page));
  await openProject(page, 3);
  await play(page, 3, { stopAt: 6 });
  await page.waitForFunction(() => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) === 6);
  const mid = await dots(page);
  check(mid.cur === 6 && mid.ok === 6, `before leaving: ${JSON.stringify(mid)}, expected question 7 on screen after 6 right`);   // contract: plan Task 10, Review Focus 2
  await skew(page); await page.evaluate(() => document.querySelector('#toM').click());
  await page.waitForSelector('.map');
  check(JSON.stringify(await stored(page)) === before, `leaving at question 7 changed the saved progress: ${JSON.stringify(await stored(page))}, expected ${before}`);   // contract: plan Task 10, Review Focus 2, sortir a mitges no desa res
  await openProject(page, 3);
  const again = await dots(page);
  check(again.cur === 0 && again.ok === 0 && again.late === 0, `coming back: ${JSON.stringify(again)}, expected question 1 and no dot filled`);   // contract: plan Task 10, Review Focus 2, tornar-hi comença per la pregunta 1
  await ctx.close();
});

// ---- the feet under the columns of a question of reading follow the table «Un projecte» too: digit and worth in ex00, the letter in ex01, nothing in ex02 until the hint
await section('feet of the questions of reading', async () => {
  const { page } = await open({ piscina: true });
  await openProject(page, 0);
  const foot = () => page.evaluate(() => [...document.querySelectorAll('.foot span')].map(s => [...s.children].map(c => c.textContent)));
  await play(page, 0, { stopAt: 4 });   // question 5 is the first of reading: 5, three columns
  same('ex00, reading (5): the digit and what it is worth under each column, left to right', await foot(), [['0', '0'], ['0', '0'], ['5', '5']]);   // contract: spec «Un projecte», ex00: sota cada columna, la xifra i el que val (4 i 40); la columna de les unitats marca 5
  await play(page, 0, { from: 4, stopAt: 8 });   // question 9 is the first of reading in ex01: 8
  same('ex01, reading (8): only the letter under each column', await foot(), [['', 'C'], ['', 'D'], ['', 'U']]);   // contract: spec «Un projecte», ex01: sota cada columna, només la lletra (U, D, C)
  await play(page, 0, { from: 8, stopAt: 12 });   // question 13 is the first of reading in ex02: 6
  same('ex02, reading (6): nothing under the columns', await foot(), [['', ''], ['', ''], ['', '']]);   // contract: spec «Un projecte», ex02: res, fins que es demana la pista
  await skew(page); await page.evaluate(() => document.querySelector('#hintb').click());
  same('ex02, reading, after the hint: the letters', await foot(), [['', 'C'], ['', 'D'], ['', 'U']]);   // contract: spec «Les pistes» i «Un projecte», a ex02 la pista posa les lletres
});

// ---- leaving during the step-by-step solve, and during the pause after a right answer: what the old screen still had to do (a timer, the next question) must not touch the new one
await section('leaving during the solve and during the pause', async () => {
  const seed = { piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] };
  const state = page => page.evaluate(() => ({ cur: [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')), ok: document.querySelectorAll('#dots i.ok').length, late: document.querySelectorAll('#dots i.late').length, tip: document.querySelector('#tip').textContent,
    value: [...document.querySelectorAll('.abacus .rod')].reduce((a, r) => a + (r.querySelectorAll('.bead.on[data-deck="lo"]').length + 5 * r.querySelectorAll('.bead.on[data-deck="hi"]').length) * 10 ** r.dataset.p, 0) }));
  {
    const { page } = await open(seed), before = JSON.stringify(await stored(page));
    await openProject(page, 2);   // Sumes, 2 + 2: the abacus starts on 2
    await skew(page); await page.evaluate(() => document.querySelector('#chk').click()); await skew(page); await page.evaluate(() => document.querySelector('#chk').click());
    await page.waitForFunction(() => document.querySelector('.abacus').classList.contains('locked'));   // the second mistake: it solves itself
    await skew(page); await page.evaluate(() => document.querySelector('#toM').click());
    await page.waitForSelector('.map'); await openProject(page, 2);
    await page.waitForTimeout(900);   // more than the rest of the old solve and the pause after it
    const s = await state(page);
    check(s.cur === 0 && s.ok === 0 && s.late === 0 && s.value === 2 && /^Fes l'operació/.test(s.tip), `back in the project after leaving in the middle of the solve: ${JSON.stringify(s)}, expected question 1, no dot filled, the abacus on 2 and the first tip`);   // contract: plan Task 10, Review Focus 2, tornar-hi comença per la pregunta 1, i res de l'anterior pantalla l'arriba a tocar
    check(JSON.stringify(await stored(page)) === before, 'leaving in the middle of the solve changed the saved progress');   // contract: plan Task 10, Review Focus 2, sortir a mitges no desa res
  }
  {
    const { page } = await open(seed);
    await openProject(page, 2);
    await skew(page); await page.evaluate(() => document.querySelector('#chk').click()); await skew(page); await page.evaluate(() => document.querySelector('#chk').click());
    await page.waitForFunction(() => /^Ara l'àbac marca \d+\./.test(document.querySelector('#tip').textContent));   // the solve is over, the pause after it is on
    await skew(page); await page.evaluate(() => document.querySelector('#toM').click());
    await page.waitForSelector('.map'); await openProject(page, 2);
    await page.waitForTimeout(600);
    const s = await state(page);
    check(s.cur === 0 && s.ok === 0 && s.late === 0 && s.value === 2 && /^Fes l'operació/.test(s.tip), `back in the project after leaving in the pause after the solve: ${JSON.stringify(s)}, expected question 1, no dot filled, the abacus on 2 and the first tip`);   // contract: plan Task 10, Review Focus 2, la pausa de la pantalla anterior no passa a la pregunta següent de la nova
  }
  {
    const { page } = await open(seed);
    await openProject(page, 3);   // 4 + 1 = 5: the abacus starts on 4
    await skew(page); await setTo(page, 5); await page.evaluate(() => document.querySelector('#chk').click());
    await skew(page); await page.evaluate(() => document.querySelector('#toM').click());   // inside the pause after the right answer
    await page.waitForSelector('.map'); await openProject(page, 3);
    await page.waitForTimeout(600);   // more than the pause
    const s = await state(page);
    check(s.cur === 0 && s.ok === 0 && s.late === 0 && s.value === 4 && /^Fes l'operació/.test(s.tip), `back in the project after leaving in the pause after a right answer: ${JSON.stringify(s)}, expected question 1, no dot filled, the abacus on 4 and the first tip`);   // contract: plan Task 10, Review Focus 2, la pausa de la pantalla anterior no passa a la pregunta següent de la nova
  }
});

// ---- every tap in the pause after the abacus has solved itself (the beads, «Comprova», «Reinicia», the hint) leaves it on the result, and the question is recorded once as missed
await section('taps in the pause after the solve', async () => {
  const { page } = await open({ piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] });
  await openProject(page, 2);   // 2 + 2 = 4
  await skew(page); await page.evaluate(() => document.querySelector('#chk').click()); await skew(page);
  const r = await page.evaluate(() => new Promise(done => {
    const tip = document.querySelector('#tip'), beads = [...document.querySelectorAll('.abacus .bead')], samples = [];
    const value = () => [...document.querySelectorAll('.abacus .rod')].reduce((a, r) => a + (r.querySelectorAll('.bead.on[data-deck="lo"]').length + 5 * r.querySelectorAll('.bead.on[data-deck="hi"]').length) * 10 ** r.dataset.p, 0);
    let pause = false, ticks = 0;
    const tap = setInterval(() => {
      const t = tip.textContent;
      if (pause && /^Fes l'operació/.test(t)) { clearInterval(tap); done(samples); return; }   // the next question has come up
      if (!pause && /^Ara l'àbac marca \d+\./.test(t)) pause = true;                                 // the solve is over, the pause is on
      if (++ticks > 3000) { clearInterval(tap); done(null); return; }
      for (const b of beads) b.click();
      for (const id of ['#chk', '#rst', '#hintb']) document.querySelector(id)?.click();
      if (pause) samples.push(value());
    }, 4);
    document.querySelector('#chk').click();   // the second mistake
  }));
  check(Array.isArray(r) && r.length >= 3 && r.every(v => v === 4), `taps in the pause after the solve: the abacus read ${JSON.stringify(r)}, expected 3 or more readings, all 4`);   // contract: plan Task 10, Review Focus 1, tocar boles durant (i just després de) play no deixa l'àbac en un valor que no sigui el resultat: 2 + 2 = 4
  await page.waitForFunction(() => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) === 1);
  const d = await dots(page);
  check(d.ok === 0 && d.late === 1, `taps in the pause after the solve: ${JSON.stringify(d)}, expected 0 ok and 1 late (one question, recorded once, and the hint of the pause did not change it)`);   // contract: spec «La nota», una pregunta que es resol sola no compta; un sol registre
});

// ---- the options of a question of reading: a double tap on wrong options is one attempt, and on the right one moves one question on
await section('the options of a question of reading', async () => {
  const { page } = await open({ piscina: true });
  await openProject(page, 0);
  await play(page, 0, { stopAt: 4 });   // question 5: 5, with the options 5, 3, 2 and 7
  await skew(page); await page.evaluate(() => { document.querySelector('.opts [data-v="3"]').click(); document.querySelector('.opts [data-v="2"]').click(); });
  const off = await page.evaluate(() => [...document.querySelectorAll('.opts [data-v]')].filter(b => b.disabled).map(b => b.dataset.v));
  same('two wrong options tapped together: the ones that are off', off, ['3']);   // contract: plan Task 10, una opció dolenta es desactiva i compta com a intent: un sol intent per doble toc
  await skew(page); await page.evaluate(() => { const b = document.querySelector('.opts [data-v="5"]'); b.click(); b.click(); });
  await page.waitForFunction(() => [...document.querySelectorAll('#dots i')].findIndex(d => d.classList.contains('cur')) >= 5, null, { timeout: 5000 });
  await page.waitForTimeout(500);
  const d = await dots(page);
  check(d.cur === 5 && d.ok === 4 && d.late === 1, `a double tap on the right option after a wrong one: ${JSON.stringify(d)}, expected question 6, 4 right and 1 late`);   // contract: plan Task 10, la pregunta es registra una sola vegada i es passa a la següent una sola vegada; el 5 va a la segona
});

// ---- the sound button in the middle of a project writes the progress as it is, not a mark; secs as it came
await section('the sound button in the middle of a project', async () => {
  const { page } = await open({ so: true, secs: [10, 10, 4, 0, 0, 0], piscina: true, exams: [true, false, false] });
  await openProject(page, 3);
  await play(page, 3, { stopAt: 6 });
  await skew(page); await page.evaluate(() => document.querySelector('#so').click());
  same('saved progress after the sound button at question 7', await stored(page), { so: false, secs: [10, 10, 4, 0, 0, 0], piscina: true, notes: [80, 80, 80, 80, 0, 0, 0, 0, 0], exams: [true, false, false], fulls: 0 });   // contract: spec «El que es desa», secs tal com és, notes de la traducció; plan Task 10, una nota no guanyada no es desa mai
});

// ---- leaving during the pause after question 15 keeps the mark (it is handed in on the last answer, before any wait)
await section('leaving in the pause after question 15', async () => {
  const { page } = await open({ piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] });
  await openProject(page, 3);
  await play(page, 3, { stopAt: 14 });
  await answer(page, PROJECTS[3].ex.flat()[14], true);
  await skew(page); await page.evaluate(() => document.querySelector('#toM').click());
  await page.waitForSelector('.map'); await page.waitForTimeout(400);
  check((await stored(page)).notes[3] === 100, `leaving in the pause after question 15: saved notes[3] is ${(await stored(page)).notes[3]}, expected 100`);   // contract: plan Task 10, en acabar: handIn i desar; spec «La nota», 15 de 15 és 100
});

// ---- a tap inside the guard window right after a question comes up is ignored (the second tap of a double tap must not press what took the place of the first)
await section('the tap inside the guard window', async () => {
  const { page } = await open({ piscina: true, exams: [true, false, false], notes: [80, 80, 0, 0, 0, 0, 0, 0, 0] });
  await openProject(page, 3);
  await play(page, 3, { stopAt: 1 });   // question 2 has just come up: 3 + 4, the abacus on 3, and the clock has not been moved
  await page.evaluate(() => { document.querySelector('.abacus .bead[data-p="0"][data-deck="hi"]').click(); document.querySelector('#hintb').click(); document.querySelector('#chk').click(); });
  const s = await page.evaluate(() => ({ lit: document.querySelectorAll('.abacus .bead.on').length, tip: document.querySelector('#tip').textContent }));
  check(s.lit === 3 && /^Fes l'operació/.test(s.tip), `taps right after a question comes up: ${JSON.stringify(s)}, expected the abacus untouched (3 beads) and the first tip`);   // contract: plan Task 10, guarda de 450 ms contra el doble toc
  await skew(page); await page.evaluate(() => document.querySelector('#hintb').click());
  const t = await page.evaluate(() => document.querySelector('#tip').textContent);
  check(/^Mira la pista/.test(t), `the hint after the window: the tip says «${t}», expected the hint to work again`);   // contract: plan Task 10, passada la guarda els botons responen
});

await browser.close();
if (fails) { console.error(`${fails} failures`); process.exit(1); }
console.log('flow-abac: ok');
