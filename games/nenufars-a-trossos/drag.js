// The two figures of the fractions game that a child moves with a finger, drawn with JSXGraph (shared/jsx.js), which is loaded the first
// time one of them is needed so the map does not carry it:
//   lineBoard   the river from 0 to max with a lily pad every 1/d: the frog is dragged along it and lands on the nearest pad
//   roundBoard  a pizza, a lily pad or a clock cut in d slices: a handle on the edge is dragged round from twelve o'clock, and the slices
//               it passes are the chosen ones (on the clock the handle is the hand)
// Each gives back { set(v) } or null when JSXGraph cannot be loaded; the game then keeps its own drawing, which can be tapped.
// onMove(v) is called with the pad or the number of slices each time it changes. The board is freed by itself with the screen (t).
let lib = null;
export const loadJsx = () => (lib ??= import('../../shared/jsx.js').catch(() => { lib = null; return null; }));

const TAU = 2 * Math.PI;
const FROG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-34 -40 68 58"><ellipse cx="0" cy="7" rx="30" ry="10" fill="#2F7F40"/><ellipse cx="0" cy="-12" rx="22" ry="17" fill="#58C06D" stroke="#2F7F40" stroke-width="2"/><ellipse cx="0" cy="-6" rx="13" ry="8" fill="#B8F0C4"/><circle cx="-11" cy="-27" r="7.5" fill="#58C06D" stroke="#2F7F40" stroke-width="2"/><circle cx="11" cy="-27" r="7.5" fill="#58C06D" stroke="#2F7F40" stroke-width="2"/><circle cx="-11" cy="-27" r="3.5" fill="#06220D"/><circle cx="11" cy="-27" r="3.5" fill="#06220D"/><path d="M-8 -9 Q0 -2 8 -9" fill="none" stroke="#1C5A3C" stroke-width="2.5" stroke-linecap="round"/></svg>';
const FROG_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(FROG);
// what JSXGraph draws must never be picked or lit up by a finger unless it is the one thing to drag
const still = { fixed: true, highlight: false, withLabel: false };

// the river: pos is the pad (0 to d · max) the frog is on; lab writes the fraction of every pad
export async function lineBoard(t, el, { d, max = 1, pos = 0, lab = false }, onMove) {
  const J = await loadJsx();
  if (!J || !t.on || !el.isConnected) return null;
  const { board, C } = J, N = d * max, b = board(t, el, [-0.14 * max, 1.05, 1.14 * max, -0.95]);
  el.setAttribute('aria-label', `El riu del 0 al ${max}, amb un nenúfar a cada ${d === 1 ? 'sencer' : `1/${d}`}: arrossega la granota o fes servir les fletxes`);
  b.suspendUpdate();
  b.create('polygon', [[-0.06 * max, -0.24], [1.06 * max, -0.24], [1.06 * max, 0.24], [-0.06 * max, 0.24]],
    { ...still, layer: 0, fillColor: '#3CAAC8', fillOpacity: 0.22, borders: { strokeColor: '#78DCEB', strokeOpacity: 0.3, strokeWidth: 1, ...still }, vertices: { visible: false, ...still } });
  // the arcs of the jumps made, from 0 to the frog
  const arcs = Array.from({ length: N }, (_, i) => b.create('curve', [s => i / d + s / d, s => 0.12 + 0.42 * Math.min(1, 6 / N) * Math.sin(Math.PI * s), 0, 1],
    { ...still, layer: 3, strokeColor: C.sun, strokeWidth: 2.5, dash: 2, visible: false }));
  const pads = [];
  for (let i = 0; i <= N; i++) {
    // a lily pad: a flat ellipse, rx along the river, ry across it (the units of the two axes differ)
    const big = i % d === 0, rx = Math.min(0.42 / N + 0.012, 0.075) * max * (big ? 1.25 : 1), ry = big ? 0.15 : 0.12, cx = i / d;
    pads.push(b.create('curve', [a => cx + rx * Math.cos(a), a => ry * Math.sin(a), 0, TAU], { ...still, layer: 2, fillColor: big ? C.padDark : '#4DBB78', fillOpacity: 1, strokeColor: big ? '#7CF5B0' : C.padDark, strokeWidth: 1.5 }));
    if (big) b.create('text', [i / d, -0.62, String(i / d)], { ...still, layer: 4, display: 'internal', anchorX: 'middle', anchorY: 'middle', fontSize: 17, cssStyle: 'font-weight:800', strokeColor: C.ink });
    else if (lab) b.create('text', [i / d, N > 6 && i % 2 ? -0.82 : -0.48, `${i}/${d}`], { ...still, layer: 4, display: 'internal', anchorX: 'middle', anchorY: 'middle', fontSize: 12, strokeColor: C.sun });
  }
  // the frog: a point on the river that the finger drags, with the picture of the frog over it; it lands on the nearest pad
  const track = b.create('segment', [[0, 0], [max, 0]], { ...still, visible: false });
  const frog = b.create('glider', [pos / d, 0, track], { name: '', withLabel: false, size: 22, face: 'o', fillOpacity: 0, strokeOpacity: 0, highlight: false, showInfobox: false });
  b.create('image', [FROG_URL, [() => frog.X() - 0.07 * max, 0.02], [0.14 * max, 0.62]], { ...still, layer: 9 });
  let at = pos;
  const paint = () => {
    arcs.forEach((a, i) => a.setAttribute({ visible: i < at }));
    pads.forEach((p, i) => p.setAttribute(i <= at && i > 0 ? { fillColor: '#C9A227', strokeColor: C.sun } : { fillColor: i % d === 0 ? C.padDark : '#4DBB78', strokeColor: i % d === 0 ? '#7CF5B0' : C.padDark }));
  };
  const land = () => { frog.moveTo([at / d, 0]); paint(); b.update(); };
  let moved = false;
  frog.on('drag', () => { moved = true; const i = Math.max(0, Math.min(N, Math.round(frog.X() * d))); if (i !== at) { at = i; paint(); onMove(i); } });
  frog.on('up', land);
  // a tap anywhere on the river, without a drag, sends the frog to the nearest pad (a click of the page: JSXGraph only tells of the
  // ends of touches that began on something of its own)
  el.addEventListener('pointerdown', () => { moved = false; });
  el.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    const [x] = b.getUsrCoordsOfMouse(e), i = Math.max(0, Math.min(N, Math.round(x * d)));
    if (i !== at) { at = i; land(); onMove(i); }
  });
  paint(); b.unsuspendUpdate();
  return { set(i) { at = Math.max(0, Math.min(N, i)); land(); } };
}

// a round figure cut in d slices; k of them are chosen, from twelve o'clock clockwise
export async function roundBoard(t, el, { shape, d, k = 0 }, onMove) {
  const J = await loadJsx();
  if (!J || !t.on || !el.isConnected) return null;
  const { board, C } = J, b = board(t, el, [-1.18, 1.18, 1.18, -1.18], { keepaspectratio: true });
  el.setAttribute('aria-label', `${shape === 'pizza' ? 'Una pizza' : shape === 'clock' ? 'Un rellotge' : 'Un nenúfar'} en ${d} parts: arrossega el sol de la vora o fes servir les fletxes`);
  const pizza = shape === 'pizza', clock = shape === 'clock', R = pizza ? 0.88 : 1;
  // where angle a (in turns, from twelve o'clock clockwise) is, at radius r
  const P = (a, r = R) => [r * Math.sin(a * TAU), r * Math.cos(a * TAU)];
  const fill = on => clock ? { fillColor: C.sun, fillOpacity: on ? 0.9 : 0 } : pizza ? { fillColor: on ? '#FFD86B' : '#D2452C', fillOpacity: 1 } : { fillColor: on ? '#F7C64E' : '#2E8C57', fillOpacity: 1 };
  b.suspendUpdate();
  if (pizza) b.create('circle', [[0, 0], 1], { ...still, layer: 0, fillColor: '#E3A55A', fillOpacity: 1, strokeColor: '#A9651F', strokeWidth: 2, center: { visible: false } });
  if (clock) b.create('circle', [[0, 0], 1], { ...still, layer: 0, fillColor: '#123F52', fillOpacity: 1, strokeColor: C.ink, strokeWidth: 3, center: { visible: false } });
  const slices = Array.from({ length: d }, (_, i) => {
    const pts = [[0, 0], ...Array.from({ length: 25 }, (_, s) => P((i + s / 24) / d))];
    return b.create('polygon', pts, { ...still, layer: 1, ...fill(i < k), borders: { ...still, layer: 2, strokeColor: clock ? 'transparent' : pizza ? '#7A2A12' : '#124E36', strokeWidth: d > 1 ? 1.5 : 0 }, vertices: { visible: false, ...still } });
  });
  // pepperoni on the chosen slices of a pizza
  const pep = pizza ? Array.from({ length: d }, (_, i) => b.create('circle', [P((i + 0.5) / d, 0.55), Math.min(0.13, 0.9 / d)], { ...still, layer: 3, fillColor: '#B3261E', strokeColor: '#7A120E', strokeWidth: 1, center: { visible: false }, visible: i < k })) : [];
  if (clock) for (let h = 0; h < 12; h++) b.create('segment', [P(h / 12, 0.86), P(h / 12, 0.96)], { ...still, layer: 4, strokeColor: C.ink, strokeWidth: 2 });
  if (clock) [12, 3, 6, 9].forEach(h => b.create('text', [...P(h / 12, 0.7), String(h)], { ...still, layer: 4, display: 'internal', anchorX: 'middle', anchorY: 'middle', fontSize: 16, cssStyle: 'font-weight:800', strokeColor: C.ink }));
  // the edge the handle runs on, and the handle: a big sun to drag round
  const rim = b.create('circle', [[0, 0], R], { ...still, layer: 4, strokeColor: clock ? 'transparent' : C.edge, strokeWidth: 1, fillOpacity: 0, center: { visible: false } });
  const handle = b.create('glider', [...P(k / d), rim], { name: '', withLabel: false, size: 14, face: 'o', fillColor: C.sun, strokeColor: '#FFF3B8', strokeWidth: 3, highlight: false, showInfobox: false, layer: 9 });
  if (clock) b.create('segment', [[0, 0], handle], { ...still, strokeColor: C.ink, strokeWidth: 4, layer: 8 });
  b.create('point', [0, 0], { ...still, layer: 8, size: clock ? 4 : 3, face: 'o', fillColor: clock ? C.ink : '#FF8FD0', strokeColor: 'transparent', name: '' });
  let at = k;
  const paint = () => { slices.forEach((s, i) => s.setAttribute(fill(i < at))); pep.forEach((p, i) => p.setAttribute({ visible: i < at })); };
  // the turn of the handle, from twelve o'clock clockwise; a full turn and none look the same, so the slices it had decide
  const turns = () => { const a = Math.atan2(handle.X(), handle.Y()) / TAU; return a < 0 ? a + 1 : a; };
  let moved = false;
  handle.on('drag', () => {
    moved = true;
    let i = Math.round(turns() * d);
    if (i === d && at < d / 2) i = 0;
    if (i === 0 && at > d / 2) i = d;
    if (i !== at) { at = i; paint(); onMove(i); }
  });
  const land = () => { handle.moveTo(P(at / d)); paint(); b.update(); };
  handle.on('up', land);
  // a tap on a slice, without a drag, chooses up to that slice; on the last one chosen, it takes it back (as the jug does)
  el.addEventListener('pointerdown', () => { moved = false; });
  el.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    const [x, y] = b.getUsrCoordsOfMouse(e);
    if (Math.hypot(x, y) > 1.05 || Math.hypot(x - handle.X(), y - handle.Y()) < 0.16) return;
    let a = Math.atan2(x, y) / TAU; if (a < 0) a += 1;
    const s = Math.min(d - 1, Math.floor(a * d)), i = at === s + 1 ? s : s + 1;
    at = i; land(); onMove(i);
  });
  b.unsuspendUpdate();
  return { set(i) { at = Math.max(0, Math.min(d, i)); land(); } };
}
