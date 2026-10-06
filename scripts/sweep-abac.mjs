// Browser sweep of the level screen of l'àbac: every viewport of VIEWPORTS, every one of the 60 levels, each fresh and after the hint button
// once and twice (3 states), and the rules of the sizing contract (the board's piece of the plan, task 8):
//   1. the board lies inside its stage, no block of the screen overlaps the next one, and every button of the screen is the thing at its own
//      centre (nothing covers it or takes its taps), scrolling the page to it first if the page scrolls
//   2. no horizontal scroll; the page scrolls vertically only when the stage is at its minimum (the board at the floor) or when the left
//      column alone is taller than the screen
//   3. the fit does not depend on the size the board had before it: --u set by hand to 10px and to 60px gives the same --u
//   4. at the laptop sizes (LAPTOP) the board is not left at the floor: at least 28px, and 35px and 44px at the two tablet sizes
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
// Run (the dev server must be up: `npm run dev`, which prints its port; on this machine it is 5199):
//   PLAYWRIGHT_CORE=/home/olive/.claude/jobs/90bddb97/tmp/node_modules BASE=http://localhost:5199 node scripts/sweep-abac.mjs [390x844,844x390 ...]
//   PLAYWRIGHT_CORE   the folder whose node_modules has playwright-core (the path to the node_modules directory itself)
//   CHROME            the browser to drive (default /usr/bin/google-chrome)
//   BASE              the server (default http://localhost:5199)
// Prints one line per viewport (and the first failures of it); exits 1 on any failure. Later screens add their own states to STATES.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5199', CHROME = process.env.CHROME || '/usr/bin/google-chrome', CORE = process.env.PLAYWRIGHT_CORE;
if (!CORE || !existsSync(CORE + '/playwright-core')) { console.error('sweep-abac: set PLAYWRIGHT_CORE to the node_modules folder that holds playwright-core (it is not a dependency of the project)'); process.exit(1); }
if (!existsSync(CHROME)) { console.error(`sweep-abac: no browser at ${CHROME}; set CHROME to a Chrome or Chromium binary`); process.exit(1); }
const { chromium } = createRequire(CORE + '/')('playwright-core');

const VIEWPORTS = [[390, 844], [844, 390], [820, 1180], [375, 667], [360, 640], [320, 568], [667, 375], [740, 360], [568, 320], [1024, 600], [1366, 650], [1280, 720], [1024, 704], [1180, 820]];
const LAPTOP = { '1024x600': 28, '1366x650': 28, '1280x720': 28, '1024x704': 28, '1180x820': 35, '820x1180': 44 };   // the least --u at these sizes
const SAVE = { so: false, secs: [10, 10, 10, 10, 10, 10] };   // every level open
const FLOOR = 18.25;   // board.js MIN (18) and a step
const settle = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))))));

// what is wrong with the level screen as it is now: a list of sentences, and the numbers worth printing
const inspect = () => {
  const R = e => e.getBoundingClientRect(), q = s => document.querySelector(s), se = document.scrollingElement;
  const joc = q('#joc'), head = q('#joc > .head'), stage = q('#joc > .stage'), tail = q('#joc > .tail'), ab = stage?.querySelector('.abacus'), bad = [];
  if (!ab) return { u: NaN, bad: ['no abacus on the screen'] };
  const a = R(ab), s = R(stage), land = getComputedStyle(joc).display === 'grid', stageMin = parseFloat(getComputedStyle(stage).minHeight) || 0;
  if (a.top < s.top - 1 || a.bottom > s.bottom + 1 || a.left < s.left - 1 || a.right > s.right + 1) bad.push('board outside its stage');
  const rows = [land ? [head, tail] : [head, stage, tail], [...head.children], [...tail.children]];
  for (const g of rows) for (let i = 0; i + 1 < g.length; i++) if (R(g[i]).bottom > R(g[i + 1]).top + 1) bad.push(`${g[i].className || g[i].id} overlaps ${g[i + 1].className || g[i + 1].id}`);
  if (se.scrollWidth > innerWidth) bad.push('horizontal scroll');
  const scrolls = se.scrollHeight > innerHeight + 1, sideH = land ? R(tail).bottom - R(head).top : 0;
  if (scrolls && s.height > Math.max(stageMin, sideH) + 1) bad.push(`the page scrolls with the stage at ${Math.round(s.height)}px (minimum ${Math.round(stageMin)}, left column ${Math.round(sideH)})`);
  for (const b of joc.querySelectorAll('.acts button, .opts button')) {
    b.scrollIntoView({ block: 'center' });
    const r = R(b), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (hit !== b && !b.contains(hit)) { bad.push(`button "${b.innerText.trim()}" is covered or out of reach`); break; }
  }
  scrollTo(0, 0);
  return { u: parseFloat(ab.style.getPropertyValue('--u')), scrolls, bad, info: `st ${Math.round(s.width)}x${Math.round(s.height)} ab ${Math.round(a.width)}x${Math.round(a.height)}` };
};
// rule 3: a new board in the same stage, --u thrown to 10px and 60px, must come back to the same size each time
const independent = async () => {
  const { board } = await import('/games/abac-xines/board.js'), host = document.querySelector('#joc > .stage');
  host.querySelector('.abacus').remove();
  const b = board(host, { n: 3, feet: 'letter' }), us = [];
  b.fit();
  for (const u of [null, '10px', '60px', '10px']) { if (u) b.el.style.setProperty('--u', u); b.fit(); us.push(parseFloat(b.el.style.getPropertyValue('--u'))); }
  b.stop();
  return us;
};

// the screens of the sweep: [name, how to get there] for each; the level screen is the only one so far
const STATES = [];
for (let sec = 0; sec < 6; sec++) for (let i = 0; i < 10; i++) for (const hints of [0, 1, 2]) STATES.push({ sec, i, hints });

const want = process.argv[2] ? process.argv[2].split(',').map(v => v.split('x').map(Number)) : VIEWPORTS;
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let failed = 0;
for (const [w, h] of want) {
  const name = `${w}x${h}`, ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + '/index.html');
  await page.evaluate(async save => { const P = await import('/shared/progress.js'); const a = P.add('Prova'); P.choose(a?.id ?? a); P.load('abac-xines'); P.save('abac-xines', save); }, SAVE);
  await page.goto(BASE + '/abac-xines.html'); await settle(page);
  const fails = [], us = []; let noScroll = true;
  let cur = null;
  for (const st of STATES) {
    if (cur !== st.sec) { await page.evaluate(() => document.querySelector('#toM').click()); await page.evaluate(s => document.querySelectorAll('.sec')[s].click(), st.sec); cur = st.sec; }
    await page.evaluate(i => document.querySelectorAll('.levels button')[i].click(), st.i); await settle(page);
    for (let k = 0; k < st.hints; k++) { await page.evaluate(() => document.querySelector('#hintb').click()); await settle(page); }
    const r = await page.evaluate(inspect); us.push(r.u); if (r.scrolls) noScroll = false;
    const need = LAPTOP[name];
    if (need && !(r.u >= need)) r.bad.push(`--u is ${r.u}, at least ${need} expected at ${name}`);
    if (need && name !== '820x1180' && r.scrolls) r.bad.push(`the page scrolls at ${name}`);
    if (r.bad.length) fails.push(`s${st.sec + 1} l${st.i + 1} hint ${st.hints}: ${r.bad.join('; ')} (u ${r.u}, ${r.info})`);
  }
  await page.evaluate(() => document.querySelector('#toM').click()); await page.evaluate(() => document.querySelectorAll('.sec')[0].click());
  await page.evaluate(() => document.querySelectorAll('.levels button')[9].click()); await settle(page);
  const same = await page.evaluate(independent);
  if (Math.max(...same) - Math.min(...same) > 0.25) fails.push(`the fit depends on the previous size: --u after 10px and 60px was ${same.join(', ')}`);
  if (errors.length) fails.push('page error: ' + errors[0]);
  console.log(`${fails.length ? 'FAIL' : 'ok  '} ${name}: ${STATES.length} states, --u ${Math.min(...us)}..${Math.max(...us)}${noScroll ? ', no scroll' : ', scrolls in some'}${fails.length ? `, ${fails.length} failing` : ''}`);
  for (const f of fails.slice(0, 4)) console.log('     ' + f);
  failed += fails.length; await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
