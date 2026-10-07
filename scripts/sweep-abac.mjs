// Browser sweep of the level screen of l'àbac: every viewport of VIEWPORTS, every one of the 60 levels, each fresh and after the hint button
// once and twice (3 states), and the rules of the sizing contract (the board's piece of the plan, task 8):
//   1. the board lies inside its stage, no block of the screen overlaps the next one, and every button of the screen is the thing at its own
//      centre (nothing covers it or takes its taps), scrolling the page to it first if the page scrolls
//   2. no horizontal scroll; the page scrolls vertically only when the screen cannot hold what the level needs with the board at the floor.
//      That is decided from the screen, not from the stage: what is over #joc and under it, plus the head, the tail and the stage's minimum
//      in one column (or the taller of the left column and that minimum, on a screen on its side), against innerHeight. At the sizes of
//      MIN_U the page never scrolls at all, and at the sizes of MAY_SCROLL no more states scroll than the number written there
//   3. the fit does not depend on the size the board had before it: --u set by hand to 10px and to 60px gives the same --u
//   4. at the sizes of MIN_U the board is not left at the floor: --u is at least the number written there
//   8. on a screen on its side the board is never taller than the screen and is in view, with the page at the top and scrolled to the
//      bottom, whatever the left column holds: besides the 180 states, one more with 150px of filling in the tail, where --u must not grow
//   and reach: the level buttons, the back button (#toM) and a bead are checked like the other buttons
//  10. the hints (task 9), at HINT_SIZES: for each row of the spec table «Les pistes» the ghosts (tone and bead), the card and the label that the layer draws, each ghost
//      centred on its bead, the same after the screen changes size (Review Focus 5), a tap clears it (Review Focus 3), a set() and a strip() in one tick leave no ghost of the old
//      state, and no infinite animation under reduced motion
//   9. a hint on show (after the hint button) lies inside the board's own box, takes no taps, and its lines fit their panel; it adds no scroll (rule 2 judges that)
// It is not part of `npm run check` (it needs a browser). Not a dependency: playwright-core and Chrome come from outside.
// Run (the dev server must be up: `npm run dev`, which prints its port; on this machine it is 5199):
//   PLAYWRIGHT_CORE=/home/olive/.claude/jobs/90bddb97/tmp/node_modules BASE=http://localhost:5199 node scripts/sweep-abac.mjs [390x844,844x390 ...]
//   PLAYWRIGHT_CORE   the folder whose node_modules has playwright-core (the path to the node_modules directory itself)
//   CHROME            the browser to drive (default /usr/bin/google-chrome)
//   BASE              the server (default http://localhost:5199)
//   INJECT            a piece of CSS added to the page, to try the sweep itself against a broken layout (it must then fail)
// Prints one line per viewport (and the first failures of it); exits 1 on any failure. Later screens add their own states to STATES.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5199', CHROME = process.env.CHROME || '/usr/bin/google-chrome', CORE = process.env.PLAYWRIGHT_CORE;
if (!CORE || !existsSync(CORE + '/playwright-core')) { console.error('sweep-abac: set PLAYWRIGHT_CORE to the node_modules folder that holds playwright-core (it is not a dependency of the project)'); process.exit(1); }
if (!existsSync(CHROME)) { console.error(`sweep-abac: no browser at ${CHROME}; set CHROME to a Chrome or Chromium binary`); process.exit(1); }
const { chromium } = createRequire(CORE + '/')('playwright-core');

const VIEWPORTS = [[390, 844], [844, 390], [820, 1180], [375, 667], [360, 640], [320, 568], [667, 375], [740, 360], [568, 320], [1024, 600], [1366, 650], [1280, 720], [1024, 704], [1180, 820]];
// the least --u at these sizes, where the page never scrolls
const MIN_U = {
  '390x844': 31.25, '844x390': 25, '820x1180': 44,   // contract: plan Task 8, «a 390×844, 844×390 i 820×1180 … sense scroll vertical ni horitzontal»; the sizes are the ones measured at 137e082 (review finding B1)
  '1024x600': 28, '1366x650': 28, '1280x720': 28, '1024x704': 28, '1180x820': 35   // contract: sizing contract of Task 8, rule 6 (a laptop window gives 28px or more without scroll)
};
// the most states (of 180) in which the page may scroll at the small phones   // contract: sizing contract of Task 8, rule 2; the counts are the ones measured in fix round 4, so a layout that scrolls more often has to say why
const MAY_SCROLL = { '375x667': 9, '360x640': 27, '320x568': 180, '667x375': 9, '740x360': 9, '568x320': 180 };
const INJECT = process.env.INJECT || '';
const SAVE = { so: false, secs: [10, 10, 10, 10, 10, 10] };   // every level open
const FLOOR = 18.25;   // board.js MIN (18) and a step
const settle = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))))));

// what is wrong with the level screen as it is now: a list of sentences, and the numbers worth printing
const inspect = () => {
  const R = e => e.getBoundingClientRect(), q = s => document.querySelector(s), se = document.scrollingElement;
  const joc = q('#joc'), head = q('#joc > .head'), stage = q('#joc > .stage'), tail = q('#joc > .tail'), ab = stage?.querySelector('.abacus'), bad = [];
  if (!ab) return { u: NaN, bad: ['no abacus on the screen'] };
  scrollTo(0, 0);
  const a = R(ab), s = R(stage), land = getComputedStyle(joc).display === 'grid', stageMin = parseFloat(getComputedStyle(stage).minHeight) || 0;
  if (a.top < s.top - 1 || a.bottom > s.bottom + 1 || a.left < s.left - 1 || a.right > s.right + 1) bad.push('board outside its stage');
  // a hint on show (the hint button was pressed): everything it draws lies inside the board's own box, and none of it takes a tap   // contract: plan Task 9 and spec «Les pistes», tot es dibuixa sobre l'àbac amb pointer-events: none, sense canviar la mida de res
  const layer = ab.querySelector('.hints');
  if (layer) {
    for (const e of layer.querySelectorAll('*')) {
      const r = R(e);
      if (r.left < a.left - 1 || r.right > a.right + 1 || r.top < a.top - 1 || r.bottom > a.bottom + 1) { bad.push(`a hint (${e.className}) lies outside the board`); break; }
      if (getComputedStyle(e).pointerEvents !== 'none') { bad.push(`a hint (${e.className}) takes taps`); break; }
    }
    const wide = [...layer.querySelectorAll('.hpanel > *')].find(l => l.scrollWidth > l.parentElement.clientWidth + 1);
    if (wide) bad.push(`a line of the strip is wider than its panel (${wide.textContent})`);
  }
  const rows = [land ? [head, tail] : [head, stage, tail], [...head.children], [...tail.children]];
  for (const g of rows) for (let i = 0; i + 1 < g.length; i++) if (R(g[i]).bottom > R(g[i + 1]).top + 1) bad.push(`${g[i].className || g[i].id} overlaps ${g[i + 1].className || g[i + 1].id}`);
  if (se.scrollWidth > innerWidth) bad.push('horizontal scroll');
  // rule 2, from the screen: what the level needs with the board at the floor (the page is at the top here)
  const gap = parseFloat(getComputedStyle(joc).rowGap) || 0, around = R(joc).top + parseFloat(getComputedStyle(document.body).paddingBottom);
  const need = Math.ceil(around + (land ? Math.max(R(head).height + gap + R(tail).height, stageMin) : R(head).height + gap + stageMin + gap + R(tail).height));
  const scrolls = se.scrollHeight > innerHeight + 1;
  if (scrolls && need <= innerHeight + 1) bad.push(`the page scrolls (${se.scrollHeight}px) though the screen holds the level with the board at the floor (${need}px needed of ${innerHeight})`);
  // rule 8: on its side, the board no taller than the screen and in view at both ends of the page
  if (matchMedia('(orientation: landscape)').matches) {
    if (a.height > innerHeight) bad.push(`the board is ${Math.round(a.height)}px tall on a screen of ${innerHeight}px`);
    for (const y of [0, se.scrollHeight]) {
      scrollTo(0, y); const v = R(ab);
      if (v.top < -1 || v.bottom > innerHeight + 1) { bad.push(`the board is out of view (${Math.round(v.top)} to ${Math.round(v.bottom)} of ${innerHeight}) with the page at ${Math.round(scrollY)}`); break; }
    }
  }
  const reach = [...joc.querySelectorAll('.acts button, .opts button, .levels button'), q('#toM'), ab.querySelector('.bead')];
  for (const b of reach) {
    if (!b) { bad.push('no back button (#toM) or no bead on the screen'); break; }
    b.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = R(b), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (hit !== b && !b.contains(hit)) { bad.push(`${b.id ? '#' + b.id : b.className.includes('bead') ? 'a bead' : `button "${b.innerText.trim()}"`} is covered or out of reach`); break; }
  }
  scrollTo(0, 0);
  return { u: parseFloat(ab.style.getPropertyValue('--u')), scrolls, land, bad, info: `st ${Math.round(s.width)}x${Math.round(s.height)} ab ${Math.round(a.width)}x${Math.round(a.height)} needs ${need}` };
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

// ---- the hints (rule 10). Expected values are written here from the spec table «Les pistes», not worked out by hints.js. A ghost is `tone@place deck index` (place 0 is the units,
// index 0 the bead nearest the beam); the bead a ghost is on is the one the tap goes to (the far end of the group that travels), as in main.js. State: columns from the units, [lo, hi].
const HINT_SIZES = ['390x844', '844x390'];
const HINT_CASES = [
  // contract: spec «Les pistes», add: una bola fantasma verda a la bola que es posa
  { id: 'add 2+2', rods: [[2], [0], [0]], t: 4, ghosts: ['put@0lo3'], card: null, label: null, now: '2 = 2' },
  { id: 'add 4+1', rods: [[4], [0], [0]], t: 5, ghosts: ['put@0lo4'], card: null, label: null, now: '4 = 4' },
  // contract: spec «Les pistes», take: la fantasma vermella a la bola que es treu
  { id: 'take', rods: [[3], [0], [0]], t: 1, ghosts: ['take@0lo1'], card: null, label: null, now: '3 = 3' },
  // contract: spec «Les pistes», more: targeta +4 = +5 −1, la de dalt verda i la de baix vermella (també +1 = +5 −4 des de les cinc de baix)
  { id: 'more +4', rods: [[4], [0], [0]], t: 8, ghosts: ['put@0hi0', 'take@0lo3'], card: '+4 = +5 −1', label: null, now: '4 = 4' },
  { id: 'more +1', rods: [[5], [0], [0]], t: 6, ghosts: ['put@0hi0', 'take@0lo1'], card: '+1 = +5 −4', label: null, now: '5 = 5' },
  // contract: spec «Les pistes», less: targeta −4 = −5 +1, la de dalt vermella i la de baix verda
  { id: 'less -4', rods: [[3, 1], [0], [0]], t: 4, ghosts: ['take@0hi0', 'put@0lo3'], card: '−4 = −5 +1', label: null, now: '8 = 8' },
  // contract: spec «Les pistes», five: les 5 de baix cap a la de dalt, etiqueta 5 → 1
  { id: 'five', rods: [[3], [5], [0]], t: 53, ghosts: ['take@1lo0', 'take@1lo1', 'take@1lo2', 'take@1lo3', 'take@1lo4', 'put@1hi0'], card: null, label: '5 → 1', now: '50 + 3 = 53' },
  // contract: spec «Les pistes», ten: la columna plena es plega i una bola salta a la columna de l'esquerra, etiqueta 10 → 1
  { id: 'ten', rods: [[3], [5, 1], [0]], t: 103, ghosts: ['take@1lo0', 'take@1lo1', 'take@1lo2', 'take@1lo3', 'take@1lo4', 'take@1hi0', 'put@2lo0'], card: null, label: '10 → 1', now: '100 + 3 = 103' },
  // contract: spec «Les pistes», carry: targeta +8 = +10 −2, fantasma verda a la columna de l'esquerra i vermella a la pròpia
  { id: 'carry 7+8', rods: [[2, 1], [0], [0]], t: 15, ghosts: ['take@0lo0', 'put@1lo0'], card: '+8 = +10 −2', label: null, now: '7 = 7' },
  // contract: spec «Les pistes», borrow: targeta −8 = −10 +2, vermella a l'esquerra i verda a la pròpia (−3 = −10 +7 per a 10-3)
  { id: 'borrow 10-3', rods: [[0], [1], [0]], t: 7, ghosts: ['take@1lo0', 'put@0lo0'], card: '−3 = −10 +7', label: null, now: '10 = 10' },
  // contract: spec «Les pistes», borrow, i la quantitat és la veritable: 100-1 treu una bola de les centenes, que val 100 de les unitats, no 10 (−1 = −100 +99)
  { id: 'borrow 100-1', rods: [[0], [0], [1]], t: 99, ghosts: ['take@2lo0', 'put@0lo0'], card: '−1 = −100 +99', label: null, now: '100 = 100' }
];
// in the page: mount(case) puts a board in the stage with the hint of the case showing; read() says what the layer holds and whether each ghost is on its bead
const hintKit = () => {
  // two frames, and the glide of the beads (0.2s) over: a bead is only where the ghost is once it has arrived
  const frame = async () => { await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))); await Promise.all(document.getAnimations().filter(a => a instanceof CSSTransition).map(a => a.finished.catch(() => {}))); };
  window.__hint = {
    frame,
    async mount(sc, how = 'show') {
      const { board } = await import('/games/abac-xines/board.js'), { hints } = await import('/games/abac-xines/hints.js'), { nextMove } = await import('/games/abac-xines/logic.js');
      const host = document.querySelector('#joc > .stage'); host.querySelector('.abacus')?.remove();
      const b = board(host, { n: sc.rods.length, feet: 'letter' }), h = hints(b);
      b.set(sc.rods.map(([lo, hi = 0]) => ({ lo, hi })));
      window.__hb = b; window.__hh = h;
      if (how === 'show') h.show(nextMove(b.rods(), sc.t), sc.t);
      await frame();
    },
    read() {
      const b = window.__hb, layer = b.el.querySelector('.hints'), R = e => e.getBoundingClientRect(), C = r => [(r.left + r.right) / 2, (r.top + r.bottom) / 2];
      layer.getAnimations({ subtree: true }).forEach(a => a.cancel());
      const ghosts = [...layer.querySelectorAll('.ghost')], off = [];
      for (const g of ghosts) {
        const bead = b.bead(+g.dataset.p, g.dataset.deck, +g.dataset.j), a = C(R(g)), c = C(R(bead));
        if (Math.abs(a[0] - c[0]) > 1.5 || Math.abs(a[1] - c[1]) > 1.5) off.push(`${g.dataset.p}${g.dataset.deck}${g.dataset.j} by ${(a[0] - c[0]).toFixed(1)},${(a[1] - c[1]).toFixed(1)}`);
      }
      return {
        ghosts: ghosts.map(g => `${g.classList.contains('put') ? 'put' : g.classList.contains('take') ? 'take' : '?'}@${g.dataset.p}${g.dataset.deck}${g.dataset.j}`).sort(),
        card: layer.querySelector('.hcard')?.textContent ?? null, label: layer.querySelector('.hlab')?.textContent ?? null, now: layer.querySelector('.hnow')?.textContent ?? null,
        off, kids: layer.children.length
      };
    }
  };
};
const loops = () => document.getAnimations().filter(a => a.effect.getComputedTiming().iterations === Infinity && a.animationName === 'ghost').length;
async function hintChecks(page, w, h) {
  const out = [], same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  await page.evaluate(hintKit);
  for (const sc of HINT_CASES) {
    await page.evaluate(sc => window.__hint.mount(sc), sc);
    const r = await page.evaluate(() => window.__hint.read());
    if (!same(r.ghosts, [...sc.ghosts].sort())) out.push(`hint ${sc.id}: ghosts ${r.ghosts}, expected ${[...sc.ghosts].sort()}`);
    if (r.card !== sc.card) out.push(`hint ${sc.id}: card «${r.card}», expected «${sc.card}»`);
    if (r.label !== sc.label) out.push(`hint ${sc.id}: label «${r.label}», expected «${sc.label}»`);
    if (r.now !== sc.now) out.push(`hint ${sc.id}: strip «${r.now}», expected «${sc.now}»`);
    if (r.off.length) out.push(`hint ${sc.id}: ghost off its bead (${r.off.join('; ')})`);
  }
  const ten = HINT_CASES.find(c => c.id === 'ten'), carry = HINT_CASES.find(c => c.id === 'carry 7+8');
  // Review Focus 5: a new size of the screen with the hint on leaves it on the same beads
  await page.evaluate(sc => window.__hint.mount(sc), ten);
  for (const [vw, vh] of [[h, w], [w, h]]) {
    await page.setViewportSize({ width: vw, height: vh }); await settle(page); await page.evaluate(() => window.__hint.frame());
    const r = await page.evaluate(() => window.__hint.read());
    if (!same(r.ghosts, [...ten.ghosts].sort()) || r.off.length) out.push(`hint after ${vw}x${vh}: ghosts ${r.ghosts}${r.off.length ? ', off their beads: ' + r.off.join('; ') : ''}`);   // contract: plan Task 9, Review Focus 5, la pista queda sobre les mateixes boles o s'esborra, mai desplaçada
  }
  // Review Focus 3: a bead that moves clears the hint
  await page.evaluate(sc => window.__hint.mount(sc), carry);
  await page.evaluate(() => { window.__hb.bead(2, 'hi', 0).click(); });
  await page.waitForTimeout(80);
  const tapped = await page.evaluate(() => window.__hint.read());
  if (tapped.kids) out.push(`hint: ${tapped.kids} elements are still drawn after a bead was tapped`);   // contract: plan Task 9, Review Focus 3, board.onMove crida stop(): la pista no sobreviu a un moviment
  // a hint of the old state must not outlive a set() followed by strip() in the same tick
  await page.evaluate(sc => window.__hint.mount(sc, 'none'), HINT_CASES[0]);
  await page.evaluate(async () => {
    const { nextMove, write } = await import('/games/abac-xines/logic.js'), b = window.__hb, h = window.__hh;
    h.show(nextMove(b.rods(), 4), 4); b.set(write(47, 3)); h.strip(50);
    await window.__hint.frame();
  });
  const mixed = await page.evaluate(() => window.__hint.read());
  if (mixed.ghosts.length) out.push(`hint: ${mixed.ghosts.length} ghost(s) of the old state stay after set() and strip() in one tick`);   // contract: plan Task 9, Review Focus 3, la pista següent es calcula amb l'àbac d'aquell moment
  // no loops under reduced motion (and the check is not empty: with motion the ghosts do loop)
  await page.evaluate(sc => window.__hint.mount(sc), ten);
  const moving = await page.evaluate(loops);
  if (!moving) out.push('hint: the ghosts do not loop with motion on, so the reduced-motion check below would say nothing');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await settle(page);
  const still = await page.evaluate(() => document.getAnimations().filter(a => a.effect.getComputedTiming().iterations === Infinity).length);
  if (still) out.push(`hint: ${still} animation(s) still loop under prefers-reduced-motion`);   // contract: spec «Les pistes», amb moviment reduït no hi ha bucles
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await settle(page);
  return out;
}

const want = process.argv[2] ? process.argv[2].split(',').map(v => v.split('x').map(Number)) : VIEWPORTS;
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let failed = 0;
for (const [w, h] of want) {
  const name = `${w}x${h}`, ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + '/index.html');
  await page.evaluate(async save => { const P = await import('/shared/progress.js'); const a = P.add('Prova'); P.choose(a?.id ?? a); P.load('abac-xines'); P.save('abac-xines', save); }, SAVE);
  await page.goto(BASE + '/abac-xines.html'); if (INJECT) await page.addStyleTag({ content: INJECT }); await settle(page);
  const fails = [], us = []; let scrolling = 0;
  let cur = null;
  for (const st of STATES) {
    if (cur !== st.sec) { await page.evaluate(() => document.querySelector('#toM').click()); await page.evaluate(s => document.querySelectorAll('.sec')[s].click(), st.sec); cur = st.sec; }
    await page.evaluate(i => document.querySelectorAll('.levels button')[i].click(), st.i); await settle(page);
    for (let k = 0; k < st.hints; k++) { await page.evaluate(() => document.querySelector('#hintb').click()); await settle(page); }
    const r = await page.evaluate(inspect); us.push(r.u); if (r.scrolls) scrolling++;
    const need = MIN_U[name];
    if (need && !(r.u >= need)) r.bad.push(`--u is ${r.u}, at least ${need} expected at ${name}`);
    if (need && r.scrolls) r.bad.push(`the page scrolls at ${name}`);
    if (r.bad.length) fails.push(`s${st.sec + 1} l${st.i + 1} hint ${st.hints}: ${r.bad.join('; ')} (u ${r.u}, ${r.info})`);
  }
  await page.evaluate(() => document.querySelector('#toM').click()); await page.evaluate(() => document.querySelectorAll('.sec')[0].click());
  await page.evaluate(() => document.querySelectorAll('.levels button')[9].click()); await settle(page);
  // rule 8 with any content: a left column 150px taller must not make the board bigger (nor break anything else)
  const plain = await page.evaluate(inspect);
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'sweepfill'; d.style.cssText = 'height:150px;width:10px;flex:none'; document.querySelector('#joc > .tail').append(d); }); await settle(page);
  const full = await page.evaluate(inspect);
  await page.evaluate(() => document.querySelector('#sweepfill').remove()); await settle(page);
  if (full.land && !(full.u <= plain.u)) full.bad.push(`--u grew from ${plain.u} to ${full.u}`);
  if (full.bad.length) fails.push(`s1 l10 with 150px more in the tail: ${full.bad.join('; ')} (u ${full.u}, ${full.info})`);
  if (name in MAY_SCROLL && scrolling > MAY_SCROLL[name]) fails.push(`the page scrolls in ${scrolling} states, ${MAY_SCROLL[name]} at the most expected at ${name}`);
  if (HINT_SIZES.includes(name)) fails.push(...await hintChecks(page, w, h));
  const same = await page.evaluate(independent);
  if (Math.max(...same) - Math.min(...same) > 0.25) fails.push(`the fit depends on the previous size: --u after 10px and 60px was ${same.join(', ')}`);
  if (errors.length) fails.push('page error: ' + errors[0]);
  console.log(`${fails.length ? 'FAIL' : 'ok  '} ${name}: ${STATES.length} states, --u ${Math.min(...us)}..${Math.max(...us)}${scrolling ? `, scrolls in ${scrolling}` : ', no scroll'}${fails.length ? `, ${fails.length} failing` : ''}`);
  for (const f of fails.slice(0, 4)) console.log('     ' + f);
  failed += fails.length; await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
