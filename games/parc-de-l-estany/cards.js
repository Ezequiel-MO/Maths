// The cards of the park: the paper a question is about (the tickets, the measuring board, the horses, the big wheel, the track of the
// roller coaster, the pizza, the shapes, the tables, the bag of the tombola...), drawn in SVG. card(c) gives the markup of card c of
// logic.js. What can be touched carries data-k (the key the rounds of logic.js speak of); a number still to find is a .blank, where main.js
// writes what the child types. Nothing here keeps state: main.js switches classes on what is touched, or draws the card again.
import { COLORS, BALLS, POSTS, HOURS, SOLIDS, fmt } from './logic.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, body, cls = '') => `<svg class="cv ${cls}" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
const T = (x, y, s, o = '') => `<text x="${r2(x)}" y="${r2(y)}" ${o}>${esc(s)}</text>`;
const r2 = x => +(+x).toFixed(2);
const INK = '#2A2540', GOLD = '#F2B53A', CREAM = '#FFF8EA', RED = '#E5484D';
const col = c => COLORS[c] || BALLS[c] || '#FFFFFF';

/* ---------- the people, small ---------- */
// A visitor standing, H tall with the feet at foot: children with a cap or a ponytail, a father, a mother and a granny with her bun.
// Skin and hair change with the place on the card, so a card always looks the same
const SKIN = ['#F6D2B5', '#EBB991', '#C98E63', '#9A6440', '#6B4328'], HAIR = ['#2B1D16', '#5A3A22', '#8A5A2B', '#D9A55A', '#B0442A'];
const LOOKS = {
  nen: { top: '#3D7BE0', legs: '#2A3550', cap: '#E5484D' }, nena: { top: '#E86CA8', legs: '#4E5378', tail: true },
  pare: { top: '#38A169', legs: '#5A4A3A' }, mare: { top: '#F28C28', legs: '#2E3A59', long: true }, avia: { top: '#9B6ADB', legs: '#4E5378', hair: '#E9E5DC', bun: true, skirt: '#4E5378' }
};
export function person(sp, x, foot, H, seed = 0) {
  const L = LOOKS[sp] || LOOKS.pare, v = Math.abs(Math.round(x * 7 + seed * 13 + H)), skin = SKIN[v % 5], hair = L.hair || HAIR[Math.floor(v / 5) % 5];
  const hr = H * 0.14, hy = foot - H + hr, top = hy + hr * 0.92, hip = foot - H * 0.4, w = H * 0.15;
  let s = '';
  for (const k of [-1, 1]) s += `<rect x="${r2(x + (k < 0 ? -w * 0.62 : w * 0.12))}" y="${r2(hip - 1)}" width="${r2(w * 0.5)}" height="${r2(foot - hip + 1)}" rx="${r2(w * 0.22)}" fill="${L.legs}"/>`;
  if (L.skirt) s += `<path d="M${r2(x - w * 0.9)} ${r2(hip + H * 0.16)}L${r2(x - w * 0.7)} ${r2(hip - H * 0.04)}H${r2(x + w * 0.7)}L${r2(x + w * 0.9)} ${r2(hip + H * 0.16)}Z" fill="${L.skirt}"/>`;
  for (const k of [-1, 1]) s += `<rect x="${r2(x + k * w * 1.02 - w * 0.22)}" y="${r2(top + H * 0.03)}" width="${r2(w * 0.44)}" height="${r2(H * 0.3)}" rx="${r2(w * 0.22)}" fill="${L.top}"/><circle cx="${r2(x + k * w * 1.02)}" cy="${r2(top + H * 0.34)}" r="${r2(w * 0.24)}" fill="${skin}"/>`;
  s += `<rect x="${r2(x - w)}" y="${r2(top)}" width="${r2(2 * w)}" height="${r2(hip - top + H * 0.03)}" rx="${r2(w * 0.55)}" fill="${L.top}"/>`;
  if (L.long) s += `<rect x="${r2(x - hr * 1.05)}" y="${r2(hy - hr * 0.2)}" width="${r2(hr * 2.1)}" height="${r2(hr * 1.6)}" rx="${r2(hr * 0.6)}" fill="${hair}"/>`;
  if (L.tail) s += `<ellipse cx="${r2(x + hr * 1.05)}" cy="${r2(hy + hr * 0.1)}" rx="${r2(hr * 0.38)}" ry="${r2(hr * 0.7)}" fill="${hair}"/>`;
  s += `<circle cx="${r2(x)}" cy="${r2(hy)}" r="${r2(hr)}" fill="${skin}"/>`;
  s += `<path d="M${r2(x - hr * 1.02)} ${r2(hy)}A${r2(hr * 1.02)} ${r2(hr * 1.02)} 0 0 1 ${r2(x + hr * 1.02)} ${r2(hy)}Q${r2(x + hr * 0.2)} ${r2(hy - hr * 0.55)} ${r2(x - hr * 1.02)} ${r2(hy)}Z" fill="${hair}"/>`;
  if (L.bun) s += `<circle cx="${r2(x)}" cy="${r2(hy - hr * 1.05)}" r="${r2(hr * 0.42)}" fill="${hair}"/>`;
  if (L.cap) s += `<path d="M${r2(x - hr * 1.05)} ${r2(hy - hr * 0.15)}A${r2(hr * 1.05)} ${r2(hr * 1.05)} 0 0 1 ${r2(x + hr * 1.05)} ${r2(hy - hr * 0.15)}Z" fill="${L.cap}"/><rect x="${r2(x)}" y="${r2(hy - hr * 0.3)}" width="${r2(hr * 1.4)}" height="${r2(hr * 0.28)}" rx="${r2(hr * 0.14)}" fill="${L.cap}"/>`;
  for (const k of [-1, 1]) s += `<circle cx="${r2(x + k * hr * 0.38)}" cy="${r2(hy + hr * 0.05)}" r="${r2(hr * 0.13)}" fill="#1E1611"/>`;
  s += `<path d="M${r2(x - hr * 0.32)} ${r2(hy + hr * 0.42)}Q${r2(x)} ${r2(hy + hr * 0.7)} ${r2(x + hr * 0.32)} ${r2(hy + hr * 0.42)}" stroke="#8A3A2E" stroke-width="${r2(hr * 0.12)}" fill="none" stroke-linecap="round"/>`;
  return s;
}
// the guide of the park, for the coach: a girl of the staff in a yellow shirt and a cap
export const GUIA = `<svg viewBox="-30 -34 60 62" aria-hidden="true" class="grum">
  <path d="M-24 28q0-17 24-17t24 17Z" fill="#F5C33B"/><path d="M-7 11l7 6 7-6Z" fill="#fff"/><circle cx="0" cy="21" r="2.2" fill="#E5484D"/>
  <path d="M-15 -6Q-19 10 -12 14H12Q19 10 15 -6Z" fill="#8A5A2B"/>
  <circle cx="0" cy="-5" r="15" fill="#EBB991"/>
  <circle cx="-5.5" cy="-4" r="3.6" fill="#fff"/><circle cx="5.5" cy="-4" r="3.6" fill="#fff"/><circle class="pupil" cx="-5" cy="-3.6" r="2.1" fill="#1E1611"/><circle class="pupil" cx="6" cy="-3.6" r="2.1" fill="#1E1611"/>
  <circle cx="-9.5" cy="2.5" r="2.4" fill="#F29A8C" opacity=".6"/><circle cx="9.5" cy="2.5" r="2.4" fill="#F29A8C" opacity=".6"/>
  <path d="M-5 3q5 4.5 10 0" stroke="#8A3A2E" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M-16 -9A16 15 0 0 1 16 -9Z" fill="#3D7BE0"/><path d="M4 -10H24Q22 -6 4 -7Z" fill="#2C5DB0"/><circle cx="0" cy="-20" r="2.4" fill="#F5C33B"/></svg>`;

/* ---------- small pictures ---------- */
const NOTE_ICON = { ticket: '🎟️', ruler: '📏', coaster: '🎢', walk: '🚶', queue: '👥', shape: '🔷' };
// a carousel horse looking right, about 40 × 34, its pole through the saddle; fill c, or a dashed white horse still to paint
function horse(x, y, c, k = null, n = null) {
  const empty = !c || c === '?', f = empty ? '#FFFFFF' : col(c);
  const body = 'M6 18C6 12 12 11 18 11H27L31 4C33 2 37 3 38 6V9C37 10 35 10 34 9L31 14C32 18 31 22 28 24L30 31H27L25 25H14L12 31H9L10 24C7 23 6 21 6 18Z';
  return `<g transform="translate(${r2(x)} ${r2(y)})"${k ? ` class="hz${empty ? ' empty' : ''}" data-k="${k}"` : ''}>
    <rect x="18.6" y="-8" width="2.8" height="44" rx="1.4" fill="${GOLD}"/>
    <path d="${body}" fill="${f}" stroke="${empty ? '#B4A9C8' : INK}" stroke-width="${empty ? 1.6 : 1.4}" ${empty ? 'stroke-dasharray="3 2"' : ''} stroke-linejoin="round"/>
    <path d="M6 15C2 14 1 18 2.5 22" stroke="${empty ? '#B4A9C8' : INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${empty ? '' : `<path d="M28 11L31 5" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/><rect x="15" y="9" width="9" height="4" rx="2" fill="${GOLD}"/><circle cx="34.5" cy="6" r="1.1" fill="${INK}"/>`}
    ${c === '?' ? T(20, 22, '?', 'class="mid q"') : ''}${n != null ? T(20, 46, n, 'class="tiny"') : ''}</g>`;
}

/* ---------- the solids ---------- */
// Each solid drawn in a box of 100 × 100 at (x, y) scaled by s: the faces filled, the edges you see in ink and the hidden ones dashed
const SOL_C = { cub: ['#FF9E7A', '#FFC2A8', '#E07B5A'], prisma: ['#7FC8F8', '#B5E0FB', '#5AA8DA'], piramide: ['#F5C33B', '#FFE08A', '#D9A520'], triangular: ['#9BD77F', '#C6EBB4', '#73B85A'],
  cilindre: ['#B79CF0'], con: ['#F59CC6'], esfera: ['#7FD8D0'] };
const poly = (pts, fill) => `<path d="M${pts.map(p => p.map(r2).join(' ')).join('L')}Z" fill="${fill}" stroke="none"/>`;
const ln = (a, b, hid) => `<path d="M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}" class="${hid ? 'hid' : 'edge'}"/>`;
function solidArt(s) {
  const C = SOL_C[s], add = (p, d) => [p[0] + d[0], p[1] + d[1]];
  if (s === 'cub' || s === 'prisma') {
    const F = s === 'cub' ? [[18, 40], [62, 40], [62, 84], [18, 84]] : [[8, 50], [70, 50], [70, 84], [8, 84]], d = [22, -18], B = F.map(p => add(p, d));
    return poly([F[0], F[1], F[2], F[3]], C[0]) + poly([F[0], B[0], B[1], F[1]], C[1]) + poly([F[1], B[1], B[2], F[2]], C[2])
      + ln(B[3], B[0], 1) + ln(B[3], B[2], 1) + ln(B[3], F[3], 1)
      + [[F[0], F[1]], [F[1], F[2]], [F[2], F[3]], [F[3], F[0]], [F[0], B[0]], [F[1], B[1]], [F[2], B[2]], [B[0], B[1]], [B[1], B[2]]].map(([a, b]) => ln(a, b)).join('');
  }
  if (s === 'piramide') {
    const FL = [14, 82], FR = [64, 82], BR = [86, 64], BL = [36, 64], A = [50, 12];
    return poly([FL, FR, A], C[0]) + poly([FR, BR, A], C[2]) + ln(BR, BL, 1) + ln(BL, FL, 1) + ln(A, BL, 1) + [[FL, FR], [FR, BR], [A, FL], [A, FR], [A, BR]].map(([a, b]) => ln(a, b)).join('');
  }
  if (s === 'triangular') {
    const F = [[12, 84], [58, 84], [35, 46]], d = [28, -20], B = F.map(p => add(p, d));
    return poly(F, C[0]) + poly([F[1], B[1], B[2], F[2]], C[2]) + ln(F[0], B[0], 1) + ln(B[0], B[1], 1) + ln(B[0], B[2], 1)
      + [[F[0], F[1]], [F[1], F[2]], [F[2], F[0]], [F[2], B[2]], [F[1], B[1]], [B[1], B[2]]].map(([a, b]) => ln(a, b)).join('');
  }
  if (s === 'cilindre') return `<path d="M22 24V80A28 9 0 0 0 78 80V24Z" fill="${C[0]}"/><ellipse cx="50" cy="24" rx="28" ry="9" fill="#D7C8F8" class="edge"/><path d="M22 24V80M78 24V80M22 80A28 9 0 0 0 78 80" class="edge" fill="none"/><path d="M22 80A28 9 0 0 1 78 80" class="hid" fill="none"/>`;
  if (s === 'con') return `<path d="M50 12L20 80A30 10 0 0 0 80 80Z" fill="${C[0]}"/><path d="M50 12L20 80M50 12L80 80M20 80A30 10 0 0 0 80 80" class="edge" fill="none"/><path d="M20 80A30 10 0 0 1 80 80" class="hid" fill="none"/>`;
  return `<circle cx="50" cy="50" r="34" fill="${C[0]}" class="edge"/><path d="M16 50A34 9 0 0 0 84 50" class="edge" fill="none" opacity=".5"/><path d="M16 50A34 9 0 0 1 84 50" class="hid" fill="none" opacity=".5"/><ellipse cx="38" cy="36" rx="9" ry="6" fill="#fff" opacity=".45"/>`;
}
const solidAt = (s, x, y, sc, k = null) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${sc})"${k ? ` class="sol" data-k="${k}"` : ''}>${k ? '<rect x="-4" y="0" width="108" height="100" rx="12" class="hit"/>' : ''}${solidArt(s)}</g>`;

/* ---------- the pile of cubes ---------- */
// oblique: the front of every cube looks at us and the rows behind go up and to the right
function pileArt(h, x0, yb, s = 30) {
  const dx = s * 0.42, dy = s * 0.34;
  let out = `<path d="M${r2(x0)} ${r2(yb)}H${r2(x0 + 3 * s)}L${r2(x0 + 3 * s + 3 * dx)} ${r2(yb - 3 * dy)}H${r2(x0 + 3 * dx)}Z" fill="#E7DDC8" stroke="#CFC2A6"/>`;
  for (let d = 0; d < 3; d++) for (let c = 0; c < 3; c++) for (let z = 0; z < h[d][c]; z++) {
    const back = 2 - d, x = x0 + c * s + back * dx, y = yb - back * dy - z * s;
    out += `<g class="cube"><path d="M${r2(x)} ${r2(y)}h${s}v${-s}h${-s}Z" fill="#7FC8F8"/><path d="M${r2(x)} ${r2(y - s)}h${s}l${r2(dx)} ${r2(-dy)}h${-s}Z" fill="#C4E6FC"/><path d="M${r2(x + s)} ${r2(y)}v${-s}l${r2(dx)} ${r2(-dy)}v${s}Z" fill="#4F9AD0"/></g>`;
  }
  return out;
}
// a view of the pile, in a box: from the top (which squares of the floor have a tower: the back row on top) or from the front (how tall each column is)
function viewArt(o, x, y, s = 20) {
  let out = '';
  if (o.v === 'top') for (let d = 0; d < 3; d++) for (let c = 0; c < 3; c++) out += `<rect x="${r2(x + c * s)}" y="${r2(y + d * s)}" width="${s}" height="${s}" fill="${o.g[d][c] ? '#4F9AD0' : '#FFFFFF'}" stroke="#9AA7B8"/>`;
  else for (let c = 0; c < 3; c++) for (let z = 0; z < 3; z++) out += `<rect x="${r2(x + c * s)}" y="${r2(y + (2 - z) * s)}" width="${s}" height="${s}" fill="${z < o.g[c] ? '#7FC8F8' : '#FFFFFF'}" stroke="${z < o.g[c] ? '#3F7FB0' : '#E3E8EE'}"/>`;
  return out;
}

/* ---------- graphs ---------- */
// a smooth line through the points
function smooth(pts) {
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]), cl = y => Math.min(hi, Math.max(lo, y));
    d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(cl(p1[1] + (p2[1] - p0[1]) / 6))} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(cl(p2[1] - (p3[1] - p1[1]) / 6))} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}
// the track of a roller coaster: posts A, B, C... and their heights in metres, with the grid every 5 m
function profileArt(c, w = 340, h = 236, title = null) {
  const x0 = 44, x1 = w - 16, y0 = h - 30, top = title ? 34 : 26, sc = (y0 - top) / c.max, n = c.ys.length, X = i => x0 + i * (x1 - x0) / (n - 1), Y = v => y0 - v * sc;
  let s = title ? T(w / 2, 18, title, 'class="hd ink"') : '';
  for (let v = 0; v <= c.max; v += 5) s += `<path d="M${x0} ${r2(Y(v))}H${x1}" class="${v % 10 ? 'g5' : 'g10'}"/>${v % 10 ? '' : T(x0 - 8, Y(v) + 4, v, 'class="ax"')}`;
  s += T(x0 - 24, top + 4, 'm', 'class="ax"');
  const pts = c.ys.map((v, i) => [X(i), Y(v)]), live = c.set ? c.ys.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0) : pts.map((_, i) => i);
  if (c.set) for (let i = 0; i < n; i++) for (let v = 5; v <= c.max; v += 5) s += `<rect class="lvl" data-k="${i}-${v}" x="${r2(X(i) - 16)}" y="${r2(Y(v) - sc * 2.5)}" width="32" height="${r2(sc * 5)}"/>`;
  for (const i of live) s += `<path d="M${r2(X(i))} ${r2(Y(c.ys[i]))}V${y0}" class="pillar"/>`;
  if (live.length > 1) s += `<path d="${smooth(live.map(i => pts[i]))}" class="rail"/><path d="${smooth(live.map(i => pts[i]))}" class="rail2"/>`;
  s += `<path d="M${x0 - 4} ${y0}H${x1 + 4}" class="ground"/>`;
  c.ys.forEach((v, i) => {
    const hl = (c.hl || []).includes(i);
    if (!c.set || v > 0) s += `<g class="pt${hl ? ' hl' : ''}"${c.pick ? ` data-k="P${i}"` : ''}>${c.pick ? `<circle cx="${r2(X(i))}" cy="${r2(Y(v))}" r="15" class="hit"/>` : ''}<circle cx="${r2(X(i))}" cy="${r2(Y(v))}" r="${hl ? 7 : 5.5}" class="dotp"/></g>`;
    s += T(X(i), y0 + 18, POSTS[i], `class="lab${hl ? ' red' : ''}"`);
  });
  return s;
}

/* ---------- the cards ---------- */
const K = {
  // the tickets of the box office: boxes of 1.000, packs of 100, strips of 10 and loose ones, each kind in its column
  packs(c) {
    const W = 360, H = 262, cx = [48, 138, 226, 310], heads = ['1.000', '100', '10', '1'];
    let s = cx.map((x, i) => `<rect x="${x - 42}" y="4" width="84" height="${H - 8}" rx="12" class="pcol"/>${T(x, 26, heads[i], 'class="hd ink"')}${T(x, H - 14, `× ${c.v[i]}`, 'class="mid"')}`).join('');
    for (let k = 0; k < c.v[0]; k++) { const y = 212 - k * 21; s += `<g><rect x="16" y="${y}" width="64" height="19" rx="3" fill="#B0773F" stroke="#7A4E25"/><path d="M16 ${y + 6}h64M16 ${y + 13}h64" stroke="#8E5C2E" stroke-width="1"/>${T(48, y + 14, '1.000', 'class="ptx light"')}</g>`; }
    for (let k = 0; k < c.v[1]; k++) { const y = 216 - k * 21; s += `<g><rect x="110" y="${y}" width="56" height="16" rx="3" fill="${RED}" stroke="#A8282D"/><rect x="134" y="${y}" width="8" height="16" fill="#FFF1C9"/>${T(124, y + 12, '100', 'class="ptx light"')}</g>`; }
    for (let k = 0; k < c.v[2]; k++) { const y = 220 - k * 21; s += `<g><rect x="198" y="${y}" width="56" height="12" rx="2" fill="#F5C33B" stroke="#C99A1A"/>${[1, 2, 3, 4].map(j => `<path d="M${198 + j * 11.2} ${y}v12" stroke="#C99A1A" stroke-dasharray="2 2"/>`).join('')}</g>`; }
    for (let k = 0; k < c.v[3]; k++) { const x = 290 + (k % 3) * 15, y = 220 - Math.floor(k / 3) * 21; s += `<rect x="${x - 6}" y="${y}" width="12" height="12" rx="2" fill="#7FD8D0" stroke="#3E9E95"/>`; }
    return svg(W, H, s, 'packs');
  },
  // the counter of visitors: a drum for each figure, the point of the thousands, and the name of each place under it
  counter(c) {
    const d = String(c.n).split(''), n = d.length, w = 46, gap = 16, W = n * w + gap + 40, x0 = 20, PL = ['DM', 'UM', 'C', 'D', 'U'].slice(5 - n);
    let s = `<rect x="4" y="4" width="${W - 8}" height="112" rx="16" fill="#2A2540"/>${T(W / 2, 26, 'VISITANTS', 'class="tiny light"')}`, x = x0;
    d.forEach((ch, i) => {
      if (i === n - 3) { s += `<circle cx="${x + gap / 2}" cy="82" r="4" fill="${GOLD}"/>`; x += gap; }
      const hl = c.hl === i;
      s += `<rect x="${x}" y="36" width="${w - 6}" height="56" rx="8" fill="${hl ? '#FFF1C9' : '#FFFFFF'}" stroke="${hl ? GOLD : '#C9C2D8'}" stroke-width="${hl ? 4 : 2}"/><path d="M${x} 64h${w - 6}" stroke="#E6E1EE"/>${T(x + (w - 6) / 2, 77, ch, 'class="big2"')}${T(x + (w - 6) / 2, 108, PL[i], `class="tiny ${hl ? 'gold' : 'light'}"`)}`;
      x += w;
    });
    return svg(W, 120, s, 'counter');
  },
  note(c) { return `<div class="note"><span class="ni" aria-hidden="true">${NOTE_ICON[c.icon] || '🎡'}</span>${c.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`; },
  // the board at the gate: the visitors of each day
  days(c) { return svg(300, 20 + c.days.length * 40, c.days.map((d, i) => `<g transform="translate(10 ${10 + i * 40})"><rect width="280" height="34" rx="8" fill="${i % 2 ? '#FFFFFF' : '#FFF1C9'}" stroke="#E6DAC0"/>${T(18, 23, d[0].toUpperCase() + d.slice(1), 'class="lt"')}${T(262, 24, fmt(c.ns[i]), 'class="lv"')}</g>`).join(''), 'days'); },
  // the number line between two round numbers, with the one in the middle and a flag on the number
  line(c) {
    const x0 = 24, x1 = 316, X = v => x0 + (v - c.a) / (c.b - c.a) * (x1 - x0), mid = (c.a + c.b) / 2;
    let s = `<path d="M${x0} 70H${x1}" stroke="${INK}" stroke-width="3"/>`;
    for (let k = 0; k <= 10; k++) { const x = x0 + k * (x1 - x0) / 10; s += `<path d="M${r2(x)} ${k % 5 ? 64 : 58}V${k % 5 ? 76 : 82}" stroke="${INK}" stroke-width="${k % 5 ? 1.5 : 3}"/>`; }
    s += T(x0, 102, fmt(c.a), 'class="lab"') + T(x1, 102, fmt(c.b), 'class="lab"') + T(X(mid), 102, fmt(mid), 'class="tiny"');
    s += `<g><path d="M${r2(X(c.n))} 70V24" stroke="${RED}" stroke-width="2.5"/><path d="M${r2(X(c.n))} 24h28l-6 7l6 7h-28Z" fill="${RED}"/><circle cx="${r2(X(c.n))}" cy="70" r="6" fill="${RED}"/></g>${T(X(c.n), 16, fmt(c.n), 'class="lab red"')}`;
    return svg(340, 112, s, 'line');
  },
  // the measuring board of a ride: a child against a ruler of 0 to 170 cm; with tap, the numbers of the ruler are buttons
  ruler(c) {
    const G = 352, Y = cm => G - 2 * cm, rx = 150;
    let s = `<rect x="0" y="${G}" width="240" height="18" fill="#7BC96F"/><rect x="${rx}" y="${Y(170)}" width="58" height="${340}" rx="6" fill="#FFE08A" stroke="#C99A1A" stroke-width="2"/>`;
    for (let cm = 0; cm <= 170; cm += 5) s += `<path d="M${rx} ${Y(cm)}h${cm % 10 ? 9 : 18}" stroke="${INK}" stroke-width="${cm % 10 ? 1.2 : 2}"/>`;
    for (let cm = 10; cm <= 170; cm += 10) s += c.tap && cm >= 60 ? `<g class="mk" data-k="${cm}"><rect x="${rx + 20}" y="${Y(cm) - 9}" width="36" height="18" rx="6"/>${T(rx + 38, Y(cm) + 4.5, cm, 'class="tiny"')}</g>` : T(rx + 38, Y(cm) + 4.5, cm, 'class="tiny"');
    if (c.min) s += `<path d="M6 ${Y(c.min)}H${rx + 58}" stroke="${RED}" stroke-width="3" stroke-dasharray="7 4"/>${T(34, Y(c.min) - 6, `${c.min} cm`, 'class="tiny red"')}`;
    s += person(c.sp, 84, G, 2 * c.h, 3) + `<path d="M60 ${Y(c.h)}H${rx}" stroke="#3D7BE0" stroke-width="2" stroke-dasharray="4 3"/>${T(84, G + 14, c.who, 'class="tiny"')}`;
    return svg(240, 372, s, 'ruler');
  },
  // children side by side against the red line of the minimum height, each with its height
  kids(c) {
    const G = 262, sc = 1.4, Y = cm => G - sc * cm, n = c.row.length, dx = 320 / n;
    let s = `<rect x="0" y="${G}" width="340" height="30" fill="#7BC96F"/><path d="M4 ${Y(c.min)}H336" stroke="${RED}" stroke-width="3" stroke-dasharray="7 4"/>${T(36, Y(c.min) - 6, `${c.min} cm`, 'class="tiny red"')}`;
    c.row.forEach((k, i) => { const x = 10 + dx * (i + 0.5); s += `<g class="kid"${c.tap ? ` data-k="K${i}"` : ''}><rect x="${r2(x - dx / 2 + 3)}" y="${r2(Y(k.h) - 20)}" width="${r2(dx - 6)}" height="${r2(G - Y(k.h) + 46)}" rx="10" class="hit"/>${person(k.sp, x, G, sc * k.h, i)}${T(x, Y(k.h) - 6, `${k.h} cm`, 'class="tiny"')}${T(x, G + 18, k.who, 'class="tiny light"')}</g>`; });
    return svg(340, 292, s, 'kids');
  },
  // a measuring tape, with its metre and the length on it
  tape(c) {
    const max = Math.max(200, Math.ceil(c.cm / 100) * 100), x0 = 14, x1 = 326, X = cm => x0 + cm / max * (x1 - x0);
    let s = `<rect x="${x0}" y="34" width="${x1 - x0}" height="30" rx="4" fill="#FFE08A" stroke="#C99A1A"/><rect x="${x0}" y="34" width="${r2(X(c.cm) - x0)}" height="30" rx="4" fill="#F59C4B" opacity=".55"/>`;
    for (let cm = 0; cm <= max; cm += 10) s += `<path d="M${r2(X(cm))} 34v${cm % 100 ? cm % 50 ? 7 : 12 : 30}" stroke="${INK}" stroke-width="${cm % 100 ? 1.2 : 2.4}"/>`;
    for (let m = 0; m <= max / 100; m++) s += T(X(m * 100), 84, `${m} m`, 'class="lab"');
    s += `<path d="M${r2(X(c.cm))} 24V72" stroke="${RED}" stroke-width="3"/>${T(X(c.cm), 18, `${c.cm} cm`, 'class="lab red"')}`;
    return svg(340, 92, s, 'tape');
  },
  // the sign at the entrance of a ride
  sign(c) { return svg(240, 150, `<path d="M118 110V146M122 110V146" stroke="#7A4E25" stroke-width="5"/><rect x="14" y="8" width="212" height="104" rx="16" fill="#2C5DB0" stroke="${GOLD}" stroke-width="5"/>${T(120, 40, 'ALÇADA MÍNIMA', 'class="tiny light"')}${T(120, 88, c.txt, 'class="big light"')}`, 'sign'); },
  // the horses of the carousel in a row; model: the row to copy, smaller, above; nums: the number of each horse under it
  horses(c) {
    const n = c.row.length, per = n > 8 ? Math.ceil(n / 2) : n, rows = Math.ceil(n / per), w = 42, W = per * w + 12, rh = c.nums ? 66 : 56, top = c.model ? 70 : 14;
    let s = c.model ? `<g opacity=".95">${c.model.map((m, i) => horse(6 + i * w, 14, m)).join('')}</g><path d="M6 64H${W - 6}" stroke="#E6DAC0" stroke-dasharray="4 4"/>` : '';
    for (let r = 0; r < rows; r++) s += `<path d="M2 ${top + r * rh - 10}H${W - 2}" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>`;
    s += c.row.map((m, i) => horse(6 + (i % per) * w, top + Math.floor(i / per) * rh, m, c.row[i] === null ? 'H' + i : null, c.nums ? i + 1 : null)).join('');
    return svg(W, top + (rows - 1) * rh + (c.nums ? 56 : 46), s, 'horses');
  },
  // the numbers on the poles of the horses; the one to find is a blank
  poles(c) {
    const n = c.items.length, w = 56, W = n * w + 8;
    return svg(W, 96, `<path d="M4 10H${W - 4}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>` + c.items.map((v, i) => { const x = 4 + i * w + w / 2; return `<g><path d="M${x} 10V92" stroke="${GOLD}" stroke-width="4"/><circle cx="${x}" cy="52" r="23" fill="${v == null ? '#2A2540' : '#FFFFFF'}" stroke="${GOLD}" stroke-width="3"/>${v == null ? T(x, 60, '?', 'class="blank mid gold"') : T(x, 59, v, 'class="mid"')}</g>`; }).join(''), 'poles');
  },
  // figures of lamps that grow; the next one is a «?»
  grow(c) {
    const dot = (x, y) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="5.5" class="bulb"/>`, g = 13, out = [];
    for (let k = 1; k <= c.n; k++) {
      const cx = 30 + (k - 1) * 100 + 30, cy = 92; let s = '';
      if (c.kind === 'rows') for (let j = 0; j < k; j++) s += dot(cx - (k - 1) * g / 2 + j * g, cy - 8) + dot(cx - (k - 1) * g / 2 + j * g, cy + 8);
      else {
        s += dot(cx, cy);
        const dirs = [[1, 0], [0, -1], [-1, 0], [0, 1]].slice(0, c.kind);
        for (const [dx, dy] of dirs) for (let j = 1; j < k; j++) s += dot(cx + dx * j * g, cy + dy * j * g);
      }
      out.push(`<g>${s}${T(cx, 150, `Figura ${k}`, 'class="tiny"')}</g>`);
    }
    return svg(100 * c.n + 80, 160, out.join('') + T(100 * c.n + 40, 98, '?', 'class="big"'), 'grow');
  },
  // the big wheel: eight cabins, the platform below, an arrow for the way it turns; quarters: the four quarters marked; sweep: the part
  // of a turn already done; pair: two spokes and the angle between them; lit: a cabin in gold
  wheel(c) {
    const cx = 160, cy = 132, R = 96, at = p => { const a = (-90 - 45 * p) * Math.PI / 180; return [cx + R * Math.cos(a), cy - R * Math.sin(a)]; }, pos = j => ((c.r - (j - 1)) % 8 + 8) % 8;
    let s = `<path d="M${cx} ${cy}L${cx - 70} 262M${cx} ${cy}L${cx + 70} 262" stroke="#8C93A8" stroke-width="8" stroke-linecap="round"/><rect x="${cx - 60}" y="256" width="120" height="12" rx="4" fill="#B0773F"/>`;
    if (c.sweep) {
      const k = c.sweep, e = at(k % 8);
      s += k >= 8 ? `<circle cx="${cx}" cy="${cy}" r="${R}" class="sweep"/>` : `<path d="M${cx} ${cy}L${cx} ${cy + R}A${R} ${R} 0 ${k > 4 ? 1 : 0} 1 ${r2(e[0])} ${r2(e[1])}Z" class="sweep"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#6E7690" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="${R - 14}" fill="none" stroke="#B9BFD0" stroke-width="2"/>`;
    for (let p = 0; p < 8; p++) { const [x, y] = at(p); s += `<path d="M${cx} ${cy}L${r2(x)} ${r2(y)}" stroke="#9AA2BA" stroke-width="2.5"/>`; }
    if (c.quarters) for (let p = 0; p < 8; p += 2) { const [x, y] = at(p); s += `<path d="M${cx} ${cy}L${r2(cx + (x - cx) * 1.22)} ${r2(cy + (y - cy) * 1.22)}" stroke="${GOLD}" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>`; }
    if (c.pair) {
      const [a, b] = c.pair.map(j => at(pos(j))), k = ((pos(c.pair[0]) - pos(c.pair[1])) % 8 + 8) % 8, rr = 34;
      const pa = [cx + (a[0] - cx) * rr / R, cy + (a[1] - cy) * rr / R], pb = [cx + (b[0] - cx) * rr / R, cy + (b[1] - cy) * rr / R];
      s += `<path d="M${r2(pa[0])} ${r2(pa[1])}A${rr} ${rr} 0 0 0 ${r2(pb[0])} ${r2(pb[1])}" fill="none" stroke="${RED}" stroke-width="3"/>` + [a, b].map(([x, y]) => `<path d="M${cx} ${cy}L${r2(x)} ${r2(y)}" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`).join('');
    }
    s += `<circle cx="${cx}" cy="${cy}" r="12" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>`;
    for (let j = 1; j <= 8; j++) {
      const [x, y] = at(pos(j)), lit = c.lit === j, bottom = pos(j) === 0;
      s += `<g><path d="M${r2(x)} ${r2(y)}v8" stroke="${INK}" stroke-width="2"/><rect x="${r2(x - 15)}" y="${r2(y + 6)}" width="30" height="24" rx="8" fill="${lit ? GOLD : ['#E5484D', '#3D7BE0', '#38A169', '#F28C28'][j % 4]}" stroke="${bottom ? '#FFFFFF' : INK}" stroke-width="${bottom ? 3 : 1.5}"/>${T(x, y + 23.5, j, `class="cab${lit ? '' : ' light'}"`)}</g>`;
    }
    if (c.arrow) {
      const cw = c.arrow === 'cw', r = R + 26, a0 = (cw ? 130 : 50) * Math.PI / 180, a1 = (cw ? 50 : 130) * Math.PI / 180, p0 = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
      s += `<path d="M${r2(p0[0])} ${r2(p0[1])}A${r} ${r} 0 0 ${cw ? 1 : 0} ${r2(p1[0])} ${r2(p1[1])}" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round" marker-end="url(#arw)"/>`;
    }
    return svg(320, 272, `<defs><marker id="arw" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${RED}"/></marker></defs>${s}`, 'wheel');
  },
  // two spokes of the wheel and the angle between them
  angle(c) {
    const cx = 160, cy = 130, R = 100, dir = a => [cx + R * Math.cos(a * Math.PI / 180), cy - R * Math.sin(a * Math.PI / 180)], a0 = c.rot, a1 = c.rot + c.deg, p0 = dir(a0), p1 = dir(a1), rr = 30;
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#D9D3E6" stroke-width="5"/>`;
    s += c.deg === 90 ? `<path d="M${r2(cx + 20 * Math.cos(a0 * Math.PI / 180))} ${r2(cy - 20 * Math.sin(a0 * Math.PI / 180))}L${r2(cx + 28.3 * Math.cos((a0 + 45) * Math.PI / 180))} ${r2(cy - 28.3 * Math.sin((a0 + 45) * Math.PI / 180))}L${r2(cx + 20 * Math.cos(a1 * Math.PI / 180))} ${r2(cy - 20 * Math.sin(a1 * Math.PI / 180))}" fill="none" stroke="${GOLD}" stroke-width="3"/>`
      : `<path d="M${r2(cx + rr * Math.cos(a0 * Math.PI / 180))} ${r2(cy - rr * Math.sin(a0 * Math.PI / 180))}A${rr} ${rr} 0 0 0 ${r2(cx + rr * Math.cos(a1 * Math.PI / 180))} ${r2(cy - rr * Math.sin(a1 * Math.PI / 180))}" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
    s += [p0, p1].map(([x, y]) => `<path d="M${cx} ${cy}L${r2(x)} ${r2(y)}" stroke="${RED}" stroke-width="6" stroke-linecap="round"/><rect x="${r2(x - 13)}" y="${r2(y - 9)}" width="26" height="20" rx="6" fill="#3D7BE0" stroke="${INK}"/>`).join('');
    return svg(320, 260, s + `<circle cx="${cx}" cy="${cy}" r="10" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>`, 'angle');
  },
  profile(c) { return svg(340, 236, profileArt(c), `profile${c.set ? ' set' : ''}`); },
  profiles(c) { return svg(340, 420, `<g>${profileArt({ ys: c.a, max: 40 }, 340, 205, c.names[0])}</g><g transform="translate(0 212)">${profileArt({ ys: c.b, max: 40 }, 340, 205, c.names[1])}</g>`, 'profile'); },
  // the train of the roller coaster seen from above: wagons with their rows of seats
  train(c) {
    const ww = 24 + c.s * 18, W = c.w * (ww + 10) + 40;
    let s = `<path d="M6 ${16 + c.r * 22}H${W - 6}" stroke="#8C93A8" stroke-width="3"/>`;
    for (let i = 0; i < c.w; i++) {
      const x = 10 + i * (ww + 10);
      s += `<rect x="${x}" y="8" width="${ww}" height="${c.r * 22 + 12}" rx="10" fill="${['#E5484D', '#3D7BE0', '#F5C33B', '#38A169', '#9B6ADB', '#F28C28'][i % 6]}" stroke="${INK}" stroke-width="1.5"/>`;
      for (let r = 0; r < c.r; r++) for (let k = 0; k < c.s; k++) s += `<rect x="${x + 12 + k * 18}" y="${15 + r * 22}" width="14" height="16" rx="4" fill="#FFF8EA" stroke="${INK}" stroke-width="1"/>`;
    }
    s += `<path d="M${W - 30} 8Q${W - 6} ${14 + c.r * 11} ${W - 30} ${20 + c.r * 22}Z" fill="#E5484D" stroke="${INK}" stroke-width="1.5"/>`;
    return svg(W, c.r * 22 + 32, s, 'train');
  },
  // a pizza, a cake (a circle) or a coca (a rectangle) cut in n equal parts; on: the parts with the topping; tap: the parts are buttons
  food(c) { return svg(240, c.food === 'coca' ? 170 : 230, foodArt(c.food, c.n, c.on, 120, c.food === 'coca' ? 85 : 115, c.tap), 'food'); },
  two(c) { return svg(340, 180, foodArt(c.food, c.A.n, Array.from({ length: c.A.on }, (_, i) => i), 85, 90, false, 0.68) + foodArt(c.food, c.B.n, Array.from({ length: c.B.on }, (_, i) => i), 255, 90, false, 0.68), 'food'); },
  // a group of n things in rows, one row for each part
  group(c) {
    const per = c.n / c.rows, w = 30, W = Math.max(per * w + 24, 200), H = c.rows * 44 + 10;
    let s = '';
    for (let r = 0; r < c.rows; r++) {
      if (r) s += `<path d="M6 ${8 + r * 44}H${W - 6}" stroke="#C9C2D8" stroke-dasharray="5 4"/>`;
      for (let k = 0; k < per; k++) s += itemArt(c.item, 12 + w / 2 + k * w, 30 + r * 44, r * 7 + k);
    }
    return svg(W, H, s, 'group');
  },
  // a clock with the part of the hour shaded, from the 12 round to the right
  clockq(c) {
    const cx = 90, cy = 90, R = 74, a = 2 * Math.PI * c.a / c.b, e = [cx + R * Math.sin(a), cy - R * Math.cos(a)];
    let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/><path d="M${cx} ${cy}V${cy - R}A${R} ${R} 0 ${c.a / c.b > 0.5 ? 1 : 0} 1 ${r2(e[0])} ${r2(e[1])}Z" fill="#F5C33B" opacity=".7"/>`;
    for (let m = 0; m < 60; m += 5) { const t = m / 60 * 2 * Math.PI; s += `<path d="M${r2(cx + (R - (m % 15 ? 6 : 12)) * Math.sin(t))} ${r2(cy - (R - (m % 15 ? 6 : 12)) * Math.cos(t))}L${r2(cx + R * Math.sin(t))} ${r2(cy - R * Math.cos(t))}" stroke="${INK}" stroke-width="${m % 15 ? 1.5 : 3}"/>`; }
    for (const [h, t] of [[12, 0], [3, 90], [6, 180], [9, 270]]) s += T(cx + (R - 24) * Math.sin(t * Math.PI / 180), cy - (R - 24) * Math.cos(t * Math.PI / 180) + 6, h, 'class="lab"');
    return svg(180, 180, s + `<circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`, 'clockq');
  },
  // the buildings of the square of shapes, side by side; tap: they are buttons
  solids(c) { return svg(c.list.length * 112 + 8, 110, c.list.map((s, i) => solidAt(s, 8 + i * 112, 4, 1, c.tap ? s : null)).join(''), 'solids'); },
  solid(c) { return svg(220, 210, solidAt(c.s, 10, 4, 2), 'solid'); },
  // a solid opened flat
  net(c) {
    const f = SOL_C[c.s]?.[0] || '#ccc', sq = (x, y, w = 40, h = 40) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" class="edge"/>`, tri = (pts) => `<path d="M${pts.map(p => p.join(' ')).join('L')}Z" fill="${f}" class="edge"/>`;
    let s = '';
    if (c.s === 'cub') s = [0, 1, 2, 3].map(i => sq(40 + i * 40, 80)).join('') + sq(80, 40) + sq(80, 120);
    else if (c.s === 'piramide') s = sq(95, 75, 50, 50) + tri([[95, 75], [145, 75], [120, 30]]) + tri([[145, 75], [145, 125], [190, 100]]) + tri([[95, 125], [145, 125], [120, 170]]) + tri([[95, 75], [95, 125], [50, 100]]);
    else if (c.s === 'triangular') s = [0, 1, 2].map(i => sq(60 + i * 40, 66, 40, 70)).join('') + tri([[100, 66], [140, 66], [120, 31]]) + tri([[100, 136], [140, 136], [120, 171]]);
    else if (c.s === 'cilindre') s = sq(60, 70, 120, 62) + `<circle cx="120" cy="50" r="19" fill="${f}" class="edge"/><circle cx="120" cy="151" r="19" fill="${f}" class="edge"/>`;
    else s = `<path d="M120 10L${r2(120 - 110 * Math.sin(0.55))} ${r2(10 + 110 * Math.cos(0.55))}A110 110 0 0 0 ${r2(120 + 110 * Math.sin(0.55))} ${r2(10 + 110 * Math.cos(0.55))}Z" fill="${f}" class="edge"/><circle cx="120" cy="${r2(10 + 110 + 26)}" r="26" fill="${f}" class="edge"/>`;
    return svg(240, 200, s, 'net');
  },
  stack(c) { return svg(220, 190, pileArt(c.h, 30, 172, 36), 'stack'); },
  // the pile and three drawings of it, A, B and C, to choose from
  views(c) {
    let s = pileArt(c.h, 95, 128, 26);
    c.opts.forEach((o, i) => { const x = 14 + i * 108; s += `<g class="vw" data-k="V${i}"><rect x="${x}" y="146" width="96" height="104" rx="12" class="hit"/>${T(x + 14, 166, 'ABC'[i], 'class="lab"')}${viewArt(o, x + 18, 176, 20)}</g>`; });
    return svg(340, 258, s, 'views');
  },
  // the queue of a ride, between its ropes; tap: each person is a button
  queue(c) {
    const n = c.q.length, dx = 32, W = n * dx + 20, G = 104, H = { nen: 46, nena: 44, pare: 78, mare: 74, avia: 66 };
    let s = `<rect x="0" y="${G}" width="${W}" height="14" fill="#C9B994"/><path d="M8 ${G - 40}H${W - 8}" stroke="${RED}" stroke-width="3"/>`;
    for (let k = 0; k <= n; k += 5) s += `<rect x="${6 + k * dx}" y="${G - 46}" width="6" height="46" rx="2" fill="${GOLD}"/>`;
    c.q.forEach((sp, i) => { const x = 22 + i * dx; s += `<g class="who"${c.tap ? ` data-k="Q${i}"` : ''}><rect x="${x - 15}" y="${G - H[sp] - 6}" width="30" height="${H[sp] + 12}" rx="8" class="hit"/>${person(sp, x, G, H[sp], i)}</g>`; });
    return svg(W, G + 16, s, 'queue');
  },
  // the tally of each ride: bundles of five
  tally(c) {
    const H = c.what.length * 38 + 10;
    return svg(340, H, c.what.map((w, i) => {
      const y = 12 + i * 38, n = c.values[i]; let marks = '';
      for (let k = 0; k < n; k++) { const g = Math.floor(k / 5), j = k % 5, x = 150 + g * 40 + j * 7; marks += j < 4 ? `<path d="M${x} ${y + 3}v22" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` : `<path d="M${x - 31} ${y + 20}L${x - 1} ${y + 6}" stroke="${RED}" stroke-width="2.4" stroke-linecap="round"/>`; }
      return `<g><rect x="6" y="${y - 4}" width="328" height="34" rx="8" fill="${i % 2 ? '#FFFFFF' : '#FFF1C9'}"/>${T(16, y + 18, w, 'class="lt"')}${marks}</g>`;
    }).join(''), 'tally');
  },
  // a two-way table, in HTML
  table2(c) {
    return `<table class="t2"><thead><tr><th></th>${c.cols.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${c.rows.map((r, i) => `<tr><th>${esc(r)}</th>${c.cells[i].map(v => v == null ? '<td class="blank">?</td>' : `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  },
  // the minutes of queue at each hour, as a line
  waits(c) {
    const x0 = 44, x1 = 326, y0 = 196, top = 22, max = 60, sc = (y0 - top) / max, n = c.m.length, X = i => x0 + i * (x1 - x0) / (n - 1), Y = v => y0 - v * sc;
    let s = '';
    for (let v = 0; v <= max; v += 5) s += `<path d="M${x0} ${r2(Y(v))}H${x1}" class="${v % 10 ? 'g5' : 'g10'}"/>${v % 10 ? '' : T(x0 - 8, Y(v) + 4, v, 'class="ax"')}`;
    s += T(x0 - 8, top - 10, 'min', 'class="ax"') + `<path d="M${c.m.map((v, i) => `${r2(X(i))} ${r2(Y(v))}`).join('L')}" class="wline"/>`;
    c.m.forEach((v, i) => { const hl = (c.hl || []).includes(i); s += `<g class="pt${hl ? ' hl' : ''}"${c.pick ? ` data-k="H${i}"` : ''}>${c.pick ? `<circle cx="${r2(X(i))}" cy="${r2(Y(v))}" r="15" class="hit"/>` : ''}<circle cx="${r2(X(i))}" cy="${r2(Y(v))}" r="${hl ? 7 : 5.5}" class="dotw"/></g>${T(X(i), y0 + 18, HOURS[i], `class="tiny${hl ? ' red' : ''}"`)}`; });
    return svg(340, 222, s + `<path d="M${x0} ${y0}H${x1}" class="ground"/>`, 'waits');
  },
  // the bag of the tombola, a jar of glass with its balls; drawn: the balls taken out, in a row below, and the count of each colour
  urn(c) {
    const balls = Object.entries(c.balls).flatMap(([k, n]) => Array(n).fill(k)), W = 240, d = c.drawn;
    let s = jarArt(balls, 120, 10, 1);
    if (d) {
      s += `<rect x="10" y="156" width="${W - 20}" height="34" rx="10" fill="#F3EEFA"/>`;
      d.forEach((k, i) => { s += `<circle cx="${26 + i * 24}" cy="173" r="9" fill="${col(k)}" stroke="${INK}" stroke-width="1"/>`; });
      if (!d.length) s += T(W / 2, 178, 'Encara no has tret cap bola.', 'class="tiny"');
      const cnt = Object.keys(c.balls).map(k => `${k}: ${d.filter(x => x === k).length}`).join('  ·  ');
      s += T(W / 2, 210, cnt, 'class="tiny"');
    }
    return svg(W, d ? 220 : 150, s, 'urn');
  },
  urns(c) { return svg(340, 170, jarArt(Object.entries(c.A).flatMap(([k, n]) => Array(n).fill(k)), 85, 8, 0.9) + T(85, 164, 'Bossa A', 'class="lab"') + jarArt(Object.entries(c.B).flatMap(([k, n]) => Array(n).fill(k)), 255, 8, 0.9) + T(255, 164, 'Bossa B', 'class="lab"'), 'urn'); },
  // the roulette of the tombola, with its arrow on top; paint: each sector is a button
  roulette(c) {
    const n = c.sectors.length, cx = 130, cy = 136, R = 104;
    let s = `<path d="M${cx} ${cy}L${cx - 54} 262H${cx + 54}Z" fill="#B0773F"/>`;
    c.sectors.forEach((k, i) => {
      const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n, p0 = [cx + R * Math.sin(a0), cy - R * Math.cos(a0)], p1 = [cx + R * Math.sin(a1), cy - R * Math.cos(a1)];
      s += `<path d="M${cx} ${cy}L${r2(p0[0])} ${r2(p0[1])}A${R} ${R} 0 0 1 ${r2(p1[0])} ${r2(p1[1])}Z" fill="${k ? col(k) : '#FFFFFF'}" stroke="${INK}" stroke-width="2"${c.paint ? ` class="sec" data-k="S${i}"` : ''}/>`;
    });
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${GOLD}" stroke-width="7"/>` + Array.from({ length: 16 }, (_, i) => `<circle cx="${r2(cx + R * Math.sin(i * Math.PI / 8))}" cy="${r2(cy - R * Math.cos(i * Math.PI / 8))}" r="3" fill="#FFF8D0"/>`).join('');
    s += `<circle cx="${cx}" cy="${cy}" r="12" fill="${GOLD}" stroke="${INK}" stroke-width="2"/><path d="M${cx - 12} 6H${cx + 12}L${cx} 34Z" fill="${RED}" stroke="${INK}" stroke-width="2"/>`;
    return svg(260, 268, s, 'roulette');
  },
  // the six faces of a die
  dice() {
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    return svg(340, 70, [1, 2, 3, 4, 5, 6].map(n => { const x = 30 + (n - 1) * 56; return `<g><rect x="${x - 23}" y="12" width="46" height="46" rx="9" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>${P[n].map(([a, b]) => `<circle cx="${x + a * 12}" cy="${35 + b * 12}" r="4.5" fill="${n === 1 ? RED : INK}"/>`).join('')}</g>`; }).join(''), 'dice');
  }
};
// the jar of the tombola with its balls, at the top centre (x, y)
function jarArt(balls, x, y, s) {
  const n = balls.length, per = n > 8 ? 4 : 3, rows = Math.ceil(n / per), r = 11;
  let out = `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-62 26Q-70 140 0 140Q70 140 62 26Z" fill="#EAF6FF" stroke="#8FB8D8" stroke-width="3"/><rect x="-50" y="12" width="100" height="16" rx="6" fill="#E5484D"/>`;
  balls.forEach((k, i) => { const row = Math.floor(i / per), inRow = Math.min(per, n - row * per), j = i % per; out += `<circle cx="${r2((j - (inRow - 1) / 2) * 25)}" cy="${r2(122 - row * 23)}" r="${r}" fill="${col(k)}" stroke="${INK}" stroke-width="1"/><circle cx="${r2((j - (inRow - 1) / 2) * 25 - 3)}" cy="${r2(118 - row * 23)}" r="3" fill="#fff" opacity=".6"/>`; });
  return out + (rows > 4 ? '' : '') + '</g>';
}
// the food of the snack bar cut in n parts round (x, y): the parts in on with the topping; tap: they are buttons
function foodArt(kind, n, on, x, y, tap, sc = 1) {
  const has = i => on.includes(i), top = { pizza: '#E5484D', coca: '#6B3A1E', pastis: '#E86CA8' }[kind], base = { pizza: '#F5C66B', coca: '#E8B86A', pastis: '#FFF1D6' }[kind];
  let s = '';
  if (kind === 'coca') {
    const W = 200 * sc, H = 120 * sc, rows = n >= 8 ? 2 : 1, cols = n / rows, w = W / cols, h = H / rows, x0 = x - W / 2, y0 = y - H / 2;
    s += `<rect x="${r2(x0 - 6)}" y="${r2(y0 - 6)}" width="${r2(W + 12)}" height="${r2(H + 12)}" rx="10" fill="#C98A4B"/>`;
    for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), k = i % cols; s += `<rect x="${r2(x0 + k * w)}" y="${r2(y0 + r * h)}" width="${r2(w)}" height="${r2(h)}" fill="${has(i) ? top : base}" stroke="#8E5C2E" stroke-width="2"${tap ? ` class="sl" data-k="S${i}"` : ''}/>`; }
    return s;
  }
  const R = 100 * sc;
  s += `<circle cx="${x}" cy="${y}" r="${r2(R + 7)}" fill="${kind === 'pizza' ? '#C98A4B' : '#F3D9E6'}"/>`;
  for (let i = 0; i < n; i++) {
    const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n, p0 = [x + R * Math.sin(a0), y - R * Math.cos(a0)], p1 = [x + R * Math.sin(a1), y - R * Math.cos(a1)];
    s += `<path d="M${x} ${y}L${r2(p0[0])} ${r2(p0[1])}A${r2(R)} ${r2(R)} 0 0 1 ${r2(p1[0])} ${r2(p1[1])}Z" fill="${has(i) ? top : base}" stroke="#8E5C2E" stroke-width="2"${tap ? ` class="sl" data-k="S${i}"` : ''}/>`;
    if (has(i) && kind !== 'coca') { const am = (a0 + a1) / 2, d = R * 0.6; s += `<circle cx="${r2(x + d * Math.sin(am))}" cy="${r2(y - d * Math.cos(am))}" r="${r2(7 * sc)}" fill="${kind === 'pizza' ? '#FFD9A8' : '#FFFFFF'}" opacity=".8" pointer-events="none"/>`; }
  }
  return s;
}
// a thing of a group: a balloon, an ice cream, a sweet or a ticket
function itemArt(it, x, y, k) {
  const C = ['#E5484D', '#3D7BE0', '#F5C33B', '#38A169', '#9B6ADB', '#F28C28'][k % 6];
  if (it === 'globus') return `<path d="M${x} ${y + 9}q-3 6 1 12" stroke="#8C93A8" fill="none"/><ellipse cx="${x}" cy="${y}" rx="10" ry="12" fill="${C}"/><ellipse cx="${x - 3}" cy="${y - 4}" rx="2.5" ry="4" fill="#fff" opacity=".5"/>`;
  if (it === 'gelats') return `<path d="M${x - 8} ${y}L${x} ${y + 18}L${x + 8} ${y}Z" fill="#E8B86A" stroke="#B5853E"/><circle cx="${x}" cy="${y - 4}" r="9" fill="${['#F7B6D2', '#FFF1D6', '#8A5A2B'][k % 3]}"/>`;
  if (it === 'caramels') return `<path d="M${x - 15} ${y - 7}L${x - 8} ${y}L${x - 15} ${y + 7}ZM${x + 15} ${y - 7}L${x + 8} ${y}L${x + 15} ${y + 7}Z" fill="${C}"/><ellipse cx="${x}" cy="${y}" rx="9" ry="7" fill="${C}" stroke="#fff" stroke-width="1.5"/>`;
  return `<rect x="${x - 12}" y="${y - 8}" width="24" height="16" rx="3" fill="#F5C33B" stroke="#C99A1A"/><circle cx="${x - 12}" cy="${y}" r="3" fill="#FFF8EA"/><circle cx="${x + 12}" cy="${y}" r="3" fill="#FFF8EA"/>`;
}
export const card = c => `<div class="card k-${c.k}">${(K[c.k] || K.note)(c)}</div>`;
export { SOLIDS };
