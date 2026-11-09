// The pictures of the tricks drawn on the page, without WebGL: ten lily pads, bars and cubes, two rows of flowers and the number line
// (JSXGraph). They were in main.js and came here as they were; with WebGL the pond of world.js draws the same tricks in 3D, through the
// same calls. main.js gives them the sounds and the sparks of the page with hear().
import { $, RM, sleep, mid } from '../../shared/util.js';
import { tween } from '../../shared/scene.js';
import { bar, cub, num } from './logic.js';

// the sounds and sparks of the page, which follow the sound button of the player: main.js hands them in before the first picture
let tone = () => {}, noteAt = () => 440, FX = { ring() {}, burst() {} };
export function hear(o) { ({ tone, noteAt, FX } = o); }

// the frog sits with its feet at 0,0; its eyelids blink
export const FROG = `<g class="frog-art"><ellipse cx="-22" cy="-7" rx="13" ry="8" fill="#3C9A50" stroke="#1F6030" stroke-width="2"/><ellipse cx="22" cy="-7" rx="13" ry="8" fill="#3C9A50" stroke="#1F6030" stroke-width="2"/>
  <ellipse cx="0" cy="-19" rx="23" ry="18" fill="#58C46C" stroke="#1F6030" stroke-width="2"/><ellipse cx="0" cy="-12" rx="14" ry="9.500" fill="#D5F8C4"/>
  <circle cx="-11" cy="-36" r="9" fill="#58C46C" stroke="#1F6030" stroke-width="2"/><circle cx="11" cy="-36" r="9" fill="#58C46C" stroke="#1F6030" stroke-width="2"/>
  <circle cx="-11" cy="-37" r="6" fill="#fff"/><circle cx="11" cy="-37" r="6" fill="#fff"/><circle cx="-10" cy="-37" r="3.200" fill="#06220D"/><circle cx="12" cy="-37" r="3.200" fill="#06220D"/>
  <circle cx="-9" cy="-38.300" r="1.100" fill="#fff"/><circle cx="13" cy="-38.300" r="1.100" fill="#fff"/>
  <g class="lid" fill="#58C46C"><circle cx="-11" cy="-37" r="6.600"/><circle cx="11" cy="-37" r="6.600"/></g>
  <ellipse cx="-17" cy="-24" rx="4" ry="2.500" fill="#FF8FD0" opacity="0.75"/><ellipse cx="17" cy="-24" rx="4" ry="2.500" fill="#FF8FD0" opacity="0.75"/>
  <path d="M-9 -24 Q0 -16 9 -24" fill="none" stroke="#1F6030" stroke-width="2.400" stroke-linecap="round"/>
  <ellipse cx="-10" cy="-3" rx="6" ry="3.500" fill="#3C9A50" stroke="#1F6030" stroke-width="1.600"/><ellipse cx="10" cy="-3" rx="6" ry="3.500" fill="#3C9A50" stroke="#1F6030" stroke-width="1.600"/></g>`;

/* ---------- pictures: ten lily pads for the friends of 10, bars and cubes for the tens, two rows for the doubles, a number line for the rest ----------
   Each picture has n moves. jump(i, mask) plays move i; with mask, the move that ends on the result shows "?" in its place,
   and reveal() writes the result there. A hint plays one more move each time it is asked. */
export const Viz = (host, p) => ({ frame: frameViz, blocks: blockViz, twin: twinViz, line: lineViz })[p.viz](host, p);
// adding fills the empty pads with new flowers; taking away starts with ten flowers and some leave
function frameViz(host, p) {
  const keep = p.sub ? p.ans : p.a, first = i => p.sub || i < keep ? 'on' : '';
  host.innerHTML = `<div class="frame" role="img" aria-label="Deu nenúfars, ${p.sub ? 10 : keep} amb flor">${Array.from({ length: 10 }, (_, i) => `<span class="${first(i)}"></span>`).join('')}</div>`;
  const pads = [...host.querySelectorAll('span')];
  return {
    n: 1,
    async jump() { for (let i = keep; i < 10; i++) { pads[i].className = p.sub ? 'gone' : 'new'; tone(noteAt(i), 0, 0.12, 0.05); await sleep(RM ? 0 : 240); } },
    // counts the flowers that make the result: the new ones when adding, the ones left when taking away
    reveal() { pads.forEach((e, i) => { const k = p.sub ? (i < keep ? i + 1 : 0) : i - keep + 1; if (k > 0) e.innerHTML = `<b>${k}</b>`; }); },
    reset() { pads.forEach((e, i) => { e.className = first(i); e.replaceChildren(); }); }
  };
}
// tens as bars, units as cubes: ten loose cubes turn into a new bar, or a bar breaks into ten cubes to take some away
function blockViz(host, p) {
  const u = p.a % 10, t = (p.a - u) / 10;
  host.innerHTML = `<div class="blocks"><div class="col"><span class="h">Desenes</span><div class="bars"></div></div><div class="col"><span class="h">Unitats</span><div class="cubes"></div></div></div><p class="split"></p>`;
  const bars = $('.bars', host), cubes = $('.cubes', host), sp = $('.split', host);
  const add = (to, cls) => { const e = document.createElement('i'); e.className = cls; to.appendChild(e); return e; };
  // the line under the blocks once the last move is done: what is on the table, then the result or "?"
  const what = p.sub ? `${bar(t - 1)} i ${cub(10 - p.b)}` : bar(t + 1);
  let end = false;
  const total = mask => { end = true; sp.innerHTML = `<b>${what}</b> = ${mask ? '<b class="q">?</b>' : p.ans}`; };
  function reset() {
    bars.replaceChildren(); cubes.replaceChildren(); cubes.className = 'cubes'; end = false;
    for (let i = 0; i < t; i++) add(bars, 'bar');
    for (let i = 0; i < u; i++) add(cubes, 'cube');
    sp.innerHTML = `${bar(t)} i ${cub(u)}`;
  }
  async function take(i, mask) {
    if (i === 0) {
      bars.lastChild.classList.add('new'); await sleep(RM ? 0 : 600);
      bars.lastChild.remove(); tone(330, 0, 0.2, 0.08);
      for (let k = 0; k < 10; k++) add(cubes, 'cube new');
      sp.innerHTML = `${bar(t - 1)} i <b>10 cubets</b>`;
      return;
    }
    for (let k = 0; k < p.b; k++) { cubes.lastChild.remove(); tone(noteAt(9 - k), 0, 0.12, 0.05); await sleep(RM ? 0 : 200); }
    total(mask);
  }
  async function jump(i, mask) {
    if (p.sub) return take(i, mask);
    if (i === 0) {
      for (let k = 0; k < p.b; k++) { add(cubes, 'cube new'); tone(noteAt(u + k), 0, 0.12, 0.05); await sleep(RM ? 0 : 200); }
      sp.innerHTML = `${bar(t)} i <b>${u} + ${p.b} = 10 cubets</b>`;
      return;
    }
    cubes.classList.add('full'); await sleep(RM ? 0 : 600);
    const r0 = cubes.getBoundingClientRect();
    cubes.replaceChildren(); cubes.className = 'cubes';
    const nb = add(bars, 'bar new'), r1 = nb.getBoundingClientRect();
    if (!RM && nb.animate) await nb.animate([{ transform: `translate(${r0.left - r1.left}px, ${r0.top - r1.top}px)` }, { transform: 'none' }], { duration: 700, easing: 'ease-in-out' }).finished;
    tone(523, 0, 0.25, 0.08);
    total(mask);
  }
  reset();
  return { n: 2, jump, reset, reveal() { if (end) total(false); } };
}
// a double is two equal rows of flowers; a near double has one flower more in the second row
function twinViz(host, p) {
  const a = p.a, twin = p.b === a, row = n => `<div class="trow">${Array.from({ length: n }, (_, i) => `<i${i >= a ? ' class="extra"' : ''}></i>`).join('')}</div>`;
  host.innerHTML = `<div class="twin" style="--n:${p.b}" role="img" aria-label="Dues files: ${a} i ${p.b} flors">${row(a)}${row(p.b)}</div><p class="split"></p>`;
  const rows = [...host.querySelectorAll('.trow')], sp = $('.split', host);
  let end = false;
  const total = mask => { end = true; sp.innerHTML = `${twin ? `<b>${a} + ${a}</b>` : `<b>${2 * a} + 1</b>`} = ${mask ? '<b class="q">?</b>' : p.ans}`; };
  function reset() { host.querySelectorAll('.trow i').forEach(e => e.classList.remove('on')); end = false; sp.innerHTML = `${a} i ${p.b}`; }
  async function jump(i, mask) {
    if (i === 0) {
      // the two rows light up in pairs
      for (let k = 0; k < a; k++) { rows.forEach(r => r.children[k].classList.add('on')); tone(noteAt(k), 0, 0.12, 0.05); await sleep(RM ? 0 : 150); }
      if (twin) total(mask); else sp.innerHTML = `<b>${a} + ${a} = ${2 * a}</b> i 1 més`;
      return;
    }
    rows[1].lastChild.classList.add('on'); tone(noteAt(a + 2), 0, 0.2, 0.07);
    total(mask);
  }
  reset();
  return { n: twin ? 1 : 2, jump, reset, reveal() { if (end) total(false); } };
}
// The frog on the number line, drawn with JSXGraph (shared/jsx.js, loaded the first time a line comes on screen): a strip of water
// with a lily pad wherever it lands. Below zero the water is deeper. When the answer is the hops added up (p.gap), a line under the
// picture adds them. The picture keeps the units of the old drawing (VW wide, y downwards from the top); the board turns them round.
// hand() lets the child make the hops: she drags the frog (or moves it with the arrows), it stays on whole numbers, and a hop that
// lands where the next one of p.jumps goes is drawn like a hint draws it; one that lands anywhere else swims back.
const jsx = () => import('../../shared/jsx.js');
const FROG_SVG = `<svg class="frog-s" viewBox="-38 -50 76 58" aria-hidden="true">${FROG}</svg>`;
function lineViz(host, p) {
  // a narrow screen gets a shorter line with less room at the ends, so the numbers stay readable
  const tight = host.clientWidth < 560, VW = tight ? 640 : 1000;
  const pts = [p.from ?? p.a, ...p.jumps.map(j => j.to)], min = Math.min(...pts), max = Math.max(...pts), m = Math.max(tight ? 1 : 2, Math.round((max - min) * 0.05));
  const lo = min - m, hi = max + m, wide = hi - lo;
  // a long line has a tick every 5 or every 10, and fewer numbers under it
  const every = wide <= 46 ? 1 : wide <= 120 ? 5 : 10, named = wide <= 24 ? 5 : wide <= (tight ? 70 : 120) ? 10 : 20;
  const X = n => 50 + (n - lo) / wide * (VW - 100), N = x => Math.round(lo + (x - 50) / (VW - 100) * wide), Y = 150, low = lo < 0, H = low ? 236 : 212;
  host.innerHTML = `<div class="nlb" style="aspect-ratio:${VW} / ${H}" role="img" aria-label="Recta numèrica: ${num(lo)} a ${num(hi)}"></div>${p.gap ? '<p class="split"></p>' : ''}`;
  const box = $('.nlb', host), sp = $('.split', host), SC = tight ? 1.25 : 1.1;
  // what is drawn on the board as the hops go, to clear on reset: the arcs, their labels, the pads and the numbers on them
  let B = null, s = 1, dyn = [], pads = [], tls = [], hid = null, frog = null, handle = null, fx = X(pts[0]), fy = Y, squash = 0, at = pts[0], drag = null;
  const P = (x, y) => [x, -y];
  const px = u => u * s;
  // the colours of the old stylesheet: JSXGraph writes a text's colour on the text itself, so it is said here and not in style.css
  const INK = { tl: '#9EC3C0', zl: '#B7A8FF', pl: '#EAF8F4', q: '#F7C64E', jl: '#6FE3FF', back: '#F7C64E' };
  const txt = (x, y, html, cls, size, ink) => B.create('text', [x, -y, html], { display: 'html', anchorX: 'middle', anchorY: 'middle', fixed: true, highlight: false,
    strokeColor: ink, highlightStrokeColor: ink, fontSize: px(size), fontUnit: 'px', cssClass: 'nlt ' + cls, highlightCssClass: 'nlt ' + cls });
  // a rounded strip of water, as points
  const strip = (x1, x2, r) => {
    const out = [], y1 = Y - 9, y2 = Y + 21;
    for (const [cx, cy, a0] of [[x2 - r, y1 + r, -90], [x2 - r, y2 - r, 0], [x1 + r, y2 - r, 90], [x1 + r, y1 + r, 180]])
      for (let k = 0; k <= 6; k++) { const a = (a0 + k * 15) * Math.PI / 180; out.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a))); }
    return out;
  };
  const shape = (pts, attrs) => B.create('polygon', pts, { vertices: { visible: false }, borders: { strokeWidth: px(attrs.sw || 0), strokeColor: attrs.stroke || 'none', highlight: false },
    fillColor: attrs.fill, fillOpacity: attrs.alpha ?? 1, fixed: true, highlight: false, hasInnerPoints: false });
  // a lily pad seen from the side, with its notch: the ellipse of the old drawing (rx 28, ry 11) from 15° round to 345°
  const padAt = x => {
    const out = [P(x, Y), P(x + 27, Y - 3)];
    for (let a = -15.4; a >= -344.6; a -= 12) { const r = a * Math.PI / 180; out.push(P(x + 28 * Math.cos(r), Y + 11 * Math.sin(r))); }
    out.push(P(x + 27, Y + 3));
    return shape(out, { fill: '#4FB562', stroke: '#2F7F40', sw: 2 });
  };
  function build({ board, C }) {
    if (!box.isConnected) return;
    B = board({ on: true }, box, [0, 0, VW, -H]); s = box.clientWidth / VW || 1;
    B.suspendUpdate();
    shape(strip(8, VW - 8, 15), { fill: 'rgb(111,227,255)', alpha: 0.22, stroke: 'rgba(111,227,255,0.45)', sw: 2 });
    if (low) {
      shape(strip(8, X(0), 15), { fill: 'rgb(88,70,200)', alpha: 0.5 });
      txt((8 + X(0)) / 2, 222, 'sota zero', 'zl', 22, INK.zl);
      B.create('segment', [P(X(0), Y - 22), P(X(0), Y + 30)], { strokeColor: C.sun, strokeWidth: px(4), dash: 1, lineCap: 'round', fixed: true, highlight: false });
    }
    for (let n = Math.ceil(lo / every) * every; n <= hi; n += every) {
      const ten = n % 10 === 0;
      B.create('segment', [P(X(n), Y + 1), P(X(n), Y + (ten ? 19 : 13))], { strokeColor: ten ? C.ink : 'rgba(234,248,244,0.55)', strokeWidth: px(ten ? 4 : 2), lineCap: 'round', fixed: true, highlight: false });
      if (n % named === 0) tls.push({ x: X(n), t: txt(X(n), Y + 44, num(n), 'tl', 26, INK.tl) });
    }
    // the frog is HTML on the board, so its eyelids still blink; the handle under it is what a finger takes
    frog = B.create('text', [() => fx, () => -(fy - 4), FROG_SVG], { display: 'html', anchorX: 'middle', anchorY: 'bottom', fixed: true, highlight: false,
      cssClass: 'nlf', highlightCssClass: 'nlf', cssStyle: `width:${px(76 * SC)}px;height:${px(58 * SC)}px` });
    handle = B.create('point', P(fx, Y - 30), { name: '', size: 26, fillOpacity: 0, strokeOpacity: 0, highlightFillOpacity: 0, highlightStrokeOpacity: 0, fixed: true, showInfobox: false });
    B.unsuspendUpdate();
  }
  const ready = jsx().then(build);
  // every call waits for the board and for the call before it, in the order they were made
  let queue = ready;
  const later = f => (queue = queue.then(() => B && f()));
  const paint = () => { if (!B) return; const el = frog.rendNode?.firstChild; if (el) el.style.transform = squash ? `scale(${1 - 0.1 * squash}, ${1 + 0.18 * squash})` : ''; B.update(); };
  function land(n, mask) {
    const x = X(n);
    tls.forEach(l => { if (Math.abs(l.x - x) < 66) l.t.setAttribute({ visible: false }); });
    pads = pads.filter(q => Math.abs(q.x - x) >= 60 || (B.removeObject(q.lab), false));
    dyn.push(padAt(x));
    const lab = txt(x, Y + 42, mask ? '?' : num(n), 'pl', 36, mask ? INK.q : INK.pl);
    dyn.push(lab); pads.push({ x, lab });
    if (mask) hid = () => { lab.setText(num(n)); lab.setAttribute({ strokeColor: INK.pl, highlightStrokeColor: INK.pl }); };
  }
  const added = mask => { sp.innerHTML = `<b>${p.jumps.map(j => j.lab.slice(1)).join(' + ')}</b> = ${mask ? '<b class="q">?</b>' : p.ans}`; };
  function reveal() { if (hid) { hid(); hid = null; } }
  function reset() {
    dyn.forEach(o => B.removeObject(o)); dyn = []; pads = []; hid = null; tls.forEach(l => l.t.setAttribute({ visible: true }));
    if (sp) sp.innerHTML = '&nbsp;';
    at = pts[0]; fx = X(at); fy = Y; squash = 0; handle.moveTo(P(fx, Y - 30)); land(at); paint();
  }
  // the hop from pts[i] to pts[i + 1]: its arc drawn as the frog flies along it, its label on top, a pad where it lands
  async function jump(i, mask) {
    const x1 = X(pts[i]), x2 = X(pts[i + 1]), dx = Math.abs(x2 - x1), h = Math.min(100, 36 + dx * 0.15), mx = (x1 + x2) / 2, back = x2 < x1, end = i === p.jumps.length - 1;
    let k = 0;
    const bx = t => (1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t * t * x2, by = t => (1 - t) ** 2 * (Y - 10) + 2 * (1 - t) * t * (Y - 10 - 2 * h) + t * t * (Y - 10);
    dyn.push(B.create('curve', [t => bx(t), t => -by(t), 0, () => k], { strokeColor: back ? '#F7C64E' : '#6FE3FF', strokeWidth: px(5), lineCap: 'round', fixed: true, highlight: false }));
    const dur = RM ? 0 : Math.min(950, 380 + dx);
    const t0 = performance.now();
    tone(back ? 330 : 440, 0, 0.14, 0.06);
    await tween(dur, t => { k = t; const q = 1 - t; fx = q * q * x1 + 2 * q * t * mx + t * t * x2; fy = Y - 4 * h * q * t; squash = Math.sin(Math.PI * t); paint(); }, t0);
    // a single hop that is the whole answer keeps its size secret
    const secret = mask && p.gap && p.jumps.length === 1, ink = secret || back ? INK.back : INK.jl;
    const lab = txt(mx, Y - 10 - h - 24, secret ? '?' : p.jumps[i].lab, 'jl', 34, ink); dyn.push(lab);
    at = pts[i + 1]; fx = x2; fy = Y; squash = 0; handle.moveTo(P(fx, Y - 30));
    land(pts[i + 1], mask && !p.gap && pts[i + 1] === p.ans);
    if (p.gap && end) { added(mask); if (mask) hid = () => { const c = back ? INK.back : INK.jl; lab.setText(p.jumps[i].lab); lab.setAttribute({ strokeColor: c, highlightStrokeColor: c }); added(false); }; }
    paint();
    // the frog lands on the pad with a splash
    const el = frog.rendNode;
    if (el?.isConnected) { const c = mid(el), hue = back ? 45 : 190; FX.ring(c.x, c.bottom, hue, 4, c.w * 1.1); FX.burst(c.x, c.bottom, hue, 12, 110); tone(back ? 494 : 659, 0, 0.2, 0.07); }
  }

  // The child makes the hops. h says what the board may do and hears what she did:
  //   can()     whether the frog may move now (not while a hint plays, not once the answer is in)
  //   next()    the hop to make now (the moves on screen so far)
  //   hopped()  a hop landed where it goes: it is drawn, and the next one is due
  //   missed()  it landed somewhere else: the frog swims back to where it was
  //   hold(on)  the hop or the swim back is being drawn: nothing else may start meanwhile
  function hand(h) {
    later(() => {
      handle.setAttribute({ fixed: false });
      box.tabIndex = 0; box.setAttribute('role', 'slider'); box.setAttribute('aria-valuemin', lo); box.setAttribute('aria-valuemax', hi);
      box.setAttribute('aria-label', `La granota a la recta numèrica, de ${num(lo)} a ${num(hi)}. Arrossega-la o mou-la amb les fletxes per fer els salts.`);
      box.classList.add('hand');
      const show = n => { fx = X(n); fy = Y - 14; squash = 0; box.setAttribute('aria-valuenow', n); paint(); };
      const home = () => { fx = X(at); fy = Y; handle.moveTo(P(fx, Y - 30)); box.setAttribute('aria-valuenow', at); paint(); };
      // where the frog lands: the next hop is drawn, or it swims back gently
      async function drop(n) {
        drag = null;
        const i = h.next();
        if (n === at || !h.can() || i >= p.jumps.length) return home();
        h.hold(true);
        if (n === pts[i + 1]) {
          // the hop drawn as a hint draws it, from where she took the frog: the last one keeps the result secret as a hint does
          fx = X(at); fy = Y;
          await jump(i, i === p.jumps.length - 1);
          h.hold(false); return h.hopped();
        }
        tone(196, 0, 0.18, 0.05);
        const x0 = X(n), x1 = X(at);
        await tween(RM ? 0 : 320, t => { fx = x0 + (x1 - x0) * t; fy = Y - 14 * (1 - t); paint(); });
        home(); h.hold(false); h.missed();
      }
      handle.on('down', () => { if (!h.can()) return; drag = at; });
      handle.on('drag', () => { if (drag === null) return; show(Math.max(lo, Math.min(hi, N(handle.X())))); });
      handle.on('up', () => { if (drag === null) return home(); drop(Math.max(lo, Math.min(hi, N(handle.X())))); });
      // the arrows move the frog one by one (ten by ten with Shift); it hops when they stop for a moment
      let kn = null, wait = 0;
      box.addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault(); e.stopPropagation();
        if (!h.can()) return;
        kn = Math.max(lo, Math.min(hi, (kn ?? at) + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 1)));
        show(kn); clearTimeout(wait);
        wait = setTimeout(() => { const n = kn; kn = null; drop(n); }, 750);
      });
    });
  }
  later(reset);
  return { n: p.jumps.length, jump: (i, mask) => later(() => jump(i, mask)), reset: () => later(reset), reveal: () => later(reveal), hand };
}
