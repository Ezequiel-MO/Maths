// The cards of the hotel: the paper a question is about (the rack of keys, the calendar, the bill, the chart...), drawn in SVG. card(c)
// gives the markup of card c of logic.js. What can be touched carries data-k (the key the rounds of logic.js speak of); a number still to
// find is a .blank, where main.js writes what the child types. Nothing here keeps state: main.js switches classes on what is touched.
import { WEEK, PLACES } from './logic.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, body, cls = '') => `<svg class="cv ${cls}" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;
const T = (x, y, s, o = '') => `<text x="${x}" y="${y}" ${o}>${esc(s)}</text>`;
const INK = '#23302D', BRASS = '#D9A441', CREAM = '#FFF8EA';

/* ---------- the guests, small ---------- */
export function face(sp, x, y, r = 10) {
  const eye = (dx, dy, s = 0.18) => `<circle cx="${x + dx * r}" cy="${y + dy * r}" r="${r * s}" fill="#fff"/><circle cx="${x + dx * r}" cy="${y + dy * r}" r="${r * s * 0.55}" fill="#111"/>`;
  if (sp === 'anec') return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#FBF7EC" stroke="#C9C2B0"/><path d="M${x - r * 0.35} ${y + r * 0.2}h${r * 0.7}l-${r * 0.35} ${r * 0.45}z" fill="#F2A23C"/>${eye(-0.38, -0.2, 0.14)}${eye(0.38, -0.2, 0.14)}</g>`;
  if (sp === 'tortuga') return `<g><path d="M${x - r} ${y + r * 0.35}a${r} ${r * 0.95} 0 0 1 ${2 * r} 0z" fill="#4E8A4A"/><path d="M${x - r * 0.5} ${y - r * 0.3}l${r * 0.5} -${r * 0.3} ${r * 0.5} ${r * 0.3}M${x} ${y - r * 0.6}v${r * 0.9}" stroke="#3A6E3A" fill="none"/><circle cx="${x + r * 0.95}" cy="${y + r * 0.1}" r="${r * 0.38}" fill="#9CC77A"/>${eye(1.05, 0, 0.12)}</g>`;
  if (sp === 'lludriga') return `<g><circle cx="${x - r * 0.62}" cy="${y - r * 0.72}" r="${r * 0.28}" fill="#8A5A3B"/><circle cx="${x + r * 0.62}" cy="${y - r * 0.72}" r="${r * 0.28}" fill="#8A5A3B"/><circle cx="${x}" cy="${y}" r="${r}" fill="#8A5A3B"/><ellipse cx="${x}" cy="${y + r * 0.35}" rx="${r * 0.5}" ry="${r * 0.35}" fill="#EED9B8"/><circle cx="${x}" cy="${y + r * 0.18}" r="${r * 0.13}" fill="#221511"/>${eye(-0.38, -0.25, 0.15)}${eye(0.38, -0.25, 0.15)}</g>`;
  return `<g><circle cx="${x}" cy="${y + r * 0.1}" r="${r * 0.95}" fill="#5DBB63"/><circle cx="${x - r * 0.45}" cy="${y - r * 0.55}" r="${r * 0.38}" fill="#5DBB63"/><circle cx="${x + r * 0.45}" cy="${y - r * 0.55}" r="${r * 0.38}" fill="#5DBB63"/>${eye(-0.45, -0.55, 0.22)}${eye(0.45, -0.55, 0.22)}<path d="M${x - r * 0.4} ${y + r * 0.35}q${r * 0.4} ${r * 0.3} ${r * 0.8} 0" stroke="#2F6B33" fill="none" stroke-width="${r * 0.12}"/></g>`;
}
// the bellhop of the reception, for the coach
export const GRUM = `<svg viewBox="-30 -34 60 62" aria-hidden="true" class="grum">
  <ellipse cx="0" cy="8" rx="25" ry="19" fill="#5DBB63"/><ellipse cx="0" cy="13" rx="15" ry="10" fill="#CFEAB0"/>
  <circle cx="-12" cy="-8" r="9.5" fill="#5DBB63"/><circle cx="12" cy="-8" r="9.5" fill="#5DBB63"/>
  <circle cx="-12" cy="-8" r="6" fill="#fff"/><circle cx="12" cy="-8" r="6" fill="#fff"/><circle class="pupil" cx="-11" cy="-7.5" r="3.2" fill="#111"/><circle class="pupil" cx="13" cy="-7.5" r="3.2" fill="#111"/>
  <path d="M-10 9q10 8 20 0" stroke="#2F6B33" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <rect x="-9" y="-29" width="18" height="10" rx="2" fill="#D9474F"/><rect x="-10" y="-21" width="20" height="3.5" rx="1.5" fill="#E0A93E"/><circle cx="0" cy="-30" r="2.2" fill="#E0A93E"/></svg>`;

/* ---------- small pictures ---------- */
const ICON = {
  key: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="6" fill="none" stroke="${BRASS}" stroke-width="3"/><path d="M0 6v16M0 14h5M0 19h4" stroke="${BRASS}" stroke-width="3"/></g>`,
  bed: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-13" y="-4" width="26" height="9" rx="2" fill="#FFFDF6" stroke="#9E8F75"/><rect x="-3" y="-5" width="16" height="10" rx="2" fill="#D9474F"/><rect x="-12" y="-3" width="7" height="6" rx="2" fill="#fff" stroke="#C9C2B0"/><path d="M-14 -9v15M14 -1v7" stroke="#8B5A3C" stroke-width="2.5"/></g>`,
  half: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><clipPath id="hc${x}${y}"><rect x="-14" y="-10" width="14" height="20"/></clipPath><g clip-path="url(#hc${x}${y})"><rect x="-13" y="-4" width="26" height="9" rx="2" fill="#FFFDF6" stroke="#9E8F75"/><rect x="-12" y="-3" width="7" height="6" rx="2" fill="#fff" stroke="#C9C2B0"/><path d="M-14 -9v15" stroke="#8B5A3C" stroke-width="2.5"/></g></g>`,
  suit: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-8" width="18" height="16" rx="3" fill="#D9474F"/><path d="M-4 -8v-3h8v3" stroke="#6E2A2E" stroke-width="2" fill="none"/><path d="M-9 -1h18" stroke="#B5363D" stroke-width="2"/></g>`,
  moon: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M3 -9a9 9 0 1 0 6 15a7 7 0 1 1 -6 -15z" fill="#F2C14E"/></g>`,
  towelB: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-11" width="18" height="22" rx="3" fill="#6FB7D9"/><path d="M-9 6h18" stroke="#fff" stroke-width="2"/></g>`,
  towelS: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="-7" width="12" height="14" rx="2" fill="#F2C14E"/><path d="M-6 3h12" stroke="#fff" stroke-width="2"/></g>`,
  glass: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 -10h12l-2 20h-8z" fill="#E7F6FA" stroke="#7BB5C6"/><path d="M-5 -2h10l-1.3 11h-7.4z" fill="#F7A440"/></g>`
};
const NOTE_ICON = { tower: '🏨', moon: '🌙', bed: '🛏️', table: '🍽️', bill: '🧾', pillow: '🛏️', wash: '🧺', clock: '⏱️', recipe: '🍳', croissant: '🥐', tag: '🏷️', cup: '☕' };

/* ---------- the cards ---------- */
const K = {
  // the rack of keys behind the desk: a row for each floor (the top floor on top) and a column for each door
  rack(c) {
    const cw = 34, ch = 40, x0 = 58, y0 = 34, w = x0 + c.doors * cw + 12, h = y0 + c.floors * ch + 10;
    let s = `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="10" fill="#6E4426" stroke="#4A2C17" stroke-width="3"/>`;
    for (let d = 1; d <= c.doors; d++) s += T(x0 + (d - 0.5) * cw, 24, d, 'class="lab"');
    for (let r = 0; r < c.floors; r++) {
      const f = c.floors - r, y = y0 + r * ch;
      s += T(30, y + 25, `Pl. ${f}`, 'class="lab"') + `<rect x="${x0 - 4}" y="${y + 3}" width="${c.doors * cw + 6}" height="3" fill="${BRASS}" opacity=".7"/>`;
      for (let d = 1; d <= c.doors; d++) {
        const x = x0 + (d - 0.5) * cw, k = `${f}-${d}`, lit = c.lit.includes(k);
        s += `<g class="key${lit ? ' lit' : ''}" data-k="${k}" tabindex="-1">${lit ? `<circle cx="${x}" cy="${y + 20}" r="16" class="halo"/>` : ''}<rect x="${x - 15}" y="${y + 4}" width="30" height="34" fill="transparent"/>
          <circle cx="${x}" cy="${y + 8}" r="2.5" fill="#2A1A0E"/>${ICON.key(x, y + 14, 0.7)}<rect x="${x - 12}" y="${y + 28}" width="24" height="10" rx="2" class="ktag"/>
          ${c.tags ? T(x, y + 36, f * 100 + d, 'class="ktxt"') : `<text x="${x}" y="${y + 36}" class="ktxt hid">${f * 100 + d}</text>`}</g>`;
      }
    }
    return svg(w, h, s, 'rack');
  },
  // one key and its tag, big
  tag(c) { return svg(220, 110, `${ICON.key(52, 30, 2.2)}<path d="M84 38h104a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-104l-14 -22z" fill="${CREAM}" stroke="${BRASS}" stroke-width="3"/><circle cx="86" cy="60" r="4" fill="${BRASS}"/>${T(140, 72, c.n, 'class="big"')}`, 'tag'); },
  tags(c) { return svg(320, 80, c.ns.map((n, i) => `<g transform="translate(${10 + i * 78} 10)"><path d="M14 10h52a8 8 0 0 1 8 8v24a8 8 0 0 1 -8 8h-52l-12 -20z" fill="${CREAM}" stroke="${BRASS}" stroke-width="2.5"/><circle cx="16" cy="30" r="3" fill="${BRASS}"/>${T(44, 38, n, 'class="mid"')}</g>`).join(''), 'tags'); },
  // brass plates of doors in a row; the last one is the one to find
  seq(c) { const n = c.items.length; return svg(n * 66 + 6, 76, c.items.map((v, i) => `<g transform="translate(${6 + i * 66} 8)"><rect width="58" height="58" rx="8" fill="${v == null ? '#0F3B36' : '#3B2A1C'}" stroke="${BRASS}" stroke-width="3"/>${v == null ? T(29, 39, '?', 'class="blank mid gold"') : T(29, 37, v, 'class="mid gold"')}</g>`).join(''), 'seq'); },
  note(c) { return `<div class="note"><span class="ni" aria-hidden="true">${NOTE_ICON[c.icon] || '🏨'}</span>${c.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`; },
  // the shaft of the lift from -2 to 5, the cabin at its floor
  lift(c) {
    const n = c.hi - c.lo + 1, fh = 24, h = n * fh + 16;
    let s = `<rect x="70" y="6" width="56" height="${n * fh + 4}" rx="6" fill="#0F3B36" stroke="${BRASS}" stroke-width="2"/>`;
    for (let f = c.hi; f >= c.lo; f--) {
      const y = 8 + (c.hi - f) * fh;
      s += `<rect x="128" y="${y}" width="${f < 0 ? 96 : 80}" height="${fh - 2}" rx="3" fill="${f < 0 ? '#7A4E2D' : f === 0 ? '#A9DCC6' : '#D8EFE5'}" opacity="${f < 0 ? 0.55 : 0.9}"/>` + T(56, y + 17, f, `class="lab${f === c.at ? ' gold' : ''}"`);
      if (f === 0) s += T(176, y + 16, 'planta baixa', 'class="tiny"');
      if (f === -1) s += T(176, y + 16, 'pàrquing', 'class="tiny light"');
    }
    const cy = 8 + (c.hi - c.at) * fh;
    s += `<g class="cab" style="transform: translateY(${cy}px)"><rect x="76" y="1" width="44" height="${fh - 4}" rx="4" fill="${BRASS}"/><rect x="86" y="5" width="24" height="${fh - 12}" rx="2" fill="#FFE6A0"/></g>`;
    return svg(240, h, s, 'lift');
  },
  load(c) {
    let s = `<rect x="6" y="6" width="${c.items ? 300 : 300}" height="96" rx="10" fill="${CREAM}" stroke="${BRASS}" stroke-width="3"/><rect x="16" y="16" width="80" height="76" rx="8" fill="#0F3B36"/>${T(56, 46, 'Màxim', 'class="tiny gold"')}${T(56, 74, '300 kg', 'class="mid gold"')}`;
    if (c.used) s += `${ICON.suit(140, 52, 1.4)}${ICON.suit(172, 56, 1.2)}${face('anec', 206, 50, 14)}${T(250, 58, `${c.used} kg`, 'class="mid"')}`;
    else c.items.forEach((it, i) => { const x = 136 + i * 92; s += it.suit ? `${Array.from({ length: Math.min(it.n, 5) }, (_, j) => ICON.suit(x + (j % 3) * 18, 40 + Math.floor(j / 3) * 22, 0.9)).join('')}${T(x + 18, 92, `${it.n > 1 ? it.n + ' × ' : ''}${it.kg} kg`, 'class="tiny"')}` : `${face(it.sp, x + 14, 48, 18)}${T(x + 14, 92, `${it.kg} kg`, 'class="tiny"')}`; });
    return svg(312, 108, s, 'load');
  },
  group(c) {
    const per = 10, rows = Math.ceil(c.n / per);
    let s = ''; for (let i = 0; i < c.n; i++) s += face(c.sp, 18 + (i % per) * 28, 18 + Math.floor(i / per) * 28, 11);
    return svg(290, rows * 28 + 8, s, 'group');
  },
  // a month: seven columns from Monday, the day of arrival with a suitcase and the day of leaving with a door
  cal(c) {
    const cw = 40, ch = 34, x0 = 6, y0 = 50, rows = Math.ceil((c.first + c.len) / 7);
    let s = `<rect x="2" y="2" width="${7 * cw + 8}" height="${y0 + rows * ch + 6}" rx="10" fill="${CREAM}" stroke="#D8C9A8" stroke-width="2"/><rect x="2" y="2" width="${7 * cw + 8}" height="24" rx="10" fill="#D9474F"/>
      ${T(x0 + 3.5 * cw, 20, c.m.charAt(0).toUpperCase() + c.m.slice(1), 'class="hd"')}`;
    ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg'].forEach((d, i) => { s += T(x0 + (i + 0.5) * cw, 44, d, `class="tiny${i > 4 ? ' red' : ''}"`); });
    for (let d = 1; d <= c.len; d++) {
      const p = c.first + d - 1, x = x0 + (p % 7) * cw, y = y0 + Math.floor(p / 7) * ch, a = d === c.a, b = d === c.b;
      s += `<g class="day${a ? ' in' : ''}${b ? ' out' : ''}"${c.pick ? ` data-k="${d}"` : ''}><rect x="${x + 2}" y="${y + 2}" width="${cw - 4}" height="${ch - 4}" rx="6"/>${T(x + cw / 2, y + 22, d)}
        ${a ? ICON.suit(x + cw - 9, y + 9, 0.45) : ''}${b ? `<path d="M${x + cw - 14} ${y + 4}h8v11h-8z" fill="#2F7A6C"/>` : ''}<g class="mn">${ICON.moon(x + cw - 10, y + ch - 10, 0.55)}</g></g>`;
    }
    return svg(7 * cw + 12, y0 + rows * ch + 10, s, 'cal');
  },
  // the end of a month and the start of the next, in one strip
  cal2(c) {
    const days = [...Array.from({ length: c.len1 - c.a + 2 }, (_, i) => [c.a - 1 + i, 0]).filter(([d]) => d <= c.len1), ...Array.from({ length: c.b + 1 }, (_, i) => [i + 1, 1])], cw = 34;
    let s = '';
    days.forEach(([d, m], i) => {
      const x = 4 + i * cw, a = m === 0 && d === c.a, b = m === 1 && d === c.b;
      s += `<g class="day${a ? ' in' : ''}${b ? ' out' : ''}${m ? ' m2' : ''}"><rect x="${x + 2}" y="30" width="${cw - 4}" height="34" rx="6"/>${T(x + cw / 2, 52, d)}${a ? ICON.suit(x + cw / 2, 76, 0.5) : ''}${b ? `<path d="M${x + cw / 2 - 4} 70h8v11h-8z" fill="#2F7A6C"/>` : ''}</g>`;
    });
    const split = 4 + days.findIndex(([, m]) => m === 1) * cw;
    s += T((4 + split) / 2, 20, c.m1, 'class="tiny"') + T(split + (days.length * cw + 4 - split) / 2, 20, c.m2, 'class="tiny"') + `<path d="M${split} 24v46" stroke="#D9474F" stroke-width="2" stroke-dasharray="4 3"/>`;
    return svg(days.length * cw + 8, 88, s, 'cal');
  },
  clock(c) { return svg(150, 150, clock(75, 75, 66, c.h, c.m), 'clock'); },
  clocks(c) {
    const one = (x, [h, m], l) => `${clock(x, 74, 56, h, m)}${T(x, 152, l, 'class="tiny"')}${T(x, 174, `${h}:${String(m).padStart(2, '0')}`, 'class="mid"')}`;
    return svg(300, 182, `${one(75, c.a, c.la)}${one(225, c.b, c.lb)}<path d="M138 74h22" stroke="${BRASS}" stroke-width="3" marker-end="url(#ar)"/><defs><marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${BRASS}"/></marker></defs>`, 'clock');
  },
  // rooms (or tables) with their beds, and the guests waiting for one
  rooms(c) {
    const n = c.rooms, cols = Math.min(n, 3), rw = 96, rh = c.table ? 92 : 78, rows = Math.ceil(n / cols), qh = Math.ceil(c.n / 10) * 26 + 10;
    let s = `<g class="queue">${Array.from({ length: c.n }, (_, i) => `<g class="tok" data-i="${i}">${face(c.sp, 16 + (i % 10) * 28, 16 + Math.floor(i / 10) * 26, 11)}</g>`).join('')}</g>`;
    for (let i = 0; i < n; i++) {
      const x = 4 + (i % cols) * (rw + 8), y = qh + Math.floor(i / cols) * (rh + 8);
      s += `<g class="room${c.fill ? ' tap' : ''}" data-k="R${i}"><rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="10" class="rm"/>`;
      if (c.table) { s += `<circle cx="${x + rw / 2}" cy="${y + rh / 2}" r="20" fill="#FFFDF6" stroke="#C9C2B0" stroke-width="2"/>`; for (let j = 0; j < c.cap; j++) { const a = j / c.cap * Math.PI * 2 - Math.PI / 2; s += `<circle class="seat" data-j="${j}" cx="${x + rw / 2 + Math.cos(a) * 33}" cy="${y + rh / 2 + Math.sin(a) * 33}" r="8"/>`; } }
      else for (let j = 0; j < c.cap; j++) s += `<g class="seat" data-j="${j}">${ICON.bed(x + 22 + (j % 2) * 48, y + 24 + Math.floor(j / 2) * 32, 1)}</g>`;
      s += `<g class="sit"></g></g>`;
    }
    return svg(Math.max(cols * (rw + 8), 290), qh + rows * (rh + 8), s, 'rooms');
  },
  kinds(c) {
    let s = Array.from({ length: c.n }, (_, i) => face(c.sp, 16 + i * 28, 18, 11)).join('');
    s += `<g transform="translate(10 44)"><rect width="128" height="62" rx="10" class="rm"/>${ICON.bed(36, 28, 1)}${ICON.bed(92, 28, 1)}${T(64, 56, 'Doble: 2 llits', 'class="tiny"')}</g>`;
    s += `<g transform="translate(150 44)"><rect width="150" height="62" rx="10" class="rm"/>${ICON.bed(30, 28, 0.9)}${ICON.bed(75, 28, 0.9)}${ICON.bed(120, 28, 0.9)}${T(75, 56, 'Triple: 3 llits', 'class="tiny"')}</g>`;
    return svg(310, 112, s, 'kinds');
  },
  // a room seen from above, tile by tile: the floor to cover, and its edge in metres
  grid(c) {
    const z = Math.min(34, Math.floor(280 / c.cols)), x0 = c.m ? 26 : 8, y0 = c.m ? 22 : 8, set = new Set(c.cells);
    let s = '';
    for (let r = 1; r <= c.rows; r++) for (let q = 1; q <= c.cols; q++) {
      const k = `${r}-${q}`; if (!set.has(k)) continue;
      s += `<rect class="tile${c.fill ? ' tap' : ''}" data-k="${k}" x="${x0 + (q - 1) * z}" y="${y0 + (r - 1) * z}" width="${z}" height="${z}"/>`;
    }
    if (c.edge) {
      s += `<rect x="${x0}" y="${y0}" width="${c.cols * z}" height="${c.rows * z}" fill="none" stroke="#8B5A3C" stroke-width="6" stroke-linejoin="round"/>`;
      for (let q = 0; q < c.cols; q++) s += T(x0 + (q + 0.5) * z, y0 - 6, '1 m', 'class="tiny"');
      for (let r = 0; r < c.rows; r++) s += T(x0 - 13, y0 + (r + 0.5) * z + 4, '1 m', 'class="tiny" transform="rotate(-90 ' + (x0 - 13) + ' ' + (y0 + (r + 0.5) * z) + ')"');
    }
    return svg(x0 + c.cols * z + 8, y0 + c.rows * z + 8, s, 'grid');
  },
  two(c) {
    const room = (x, [h, w], col, name) => { const z = 18; let s = ''; for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) s += `<rect x="${x + q * z}" y="${12 + r * z}" width="${z}" height="${z}" fill="${col}" stroke="#fff" stroke-width="1.5"/>`; return s + T(x + w * z / 2, 26 + h * z, name, 'class="tiny"'); };
    return svg(320, 180, room(8, c.a, '#6C9BD8', 'La blava') + room(170, c.b, '#F2C14E', 'La groga'), 'two');
  },
  towels(c) { return svg(300, 90, `<rect x="4" y="4" width="160" height="80" rx="10" class="rm"/>${Array.from({ length: c.big }, (_, i) => ICON.towelB(26 + i * 24, 34)).join('')}${Array.from({ length: c.small }, (_, i) => ICON.towelS(26 + i * 20, 66)).join('')}${T(232, 54, `× ${c.n} habitacions`, 'class="mid"')}`, 'towels'); },
  // the plan of the garden: rows numbered on the left (1 on top), columns on top
  plan(c) {
    const z = 44, x0 = 26, y0 = 24, ic = { piscina: '🏊', font: '⛲', arbre: '🌳', palmera: '🌴', restaurant: '🍽️', recepcio: '🛎️', tumbona: '⛱️' };
    let s = '';
    for (let q = 1; q <= c.cols; q++) s += T(x0 + (q - 0.5) * z, 16, q, 'class="lab"');
    for (let r = 1; r <= c.rows; r++) {
      s += T(12, y0 + (r - 0.5) * z + 6, r, 'class="lab"');
      for (let q = 1; q <= c.cols; q++) { const k = `${r}-${q}`, it = c.items[k]; s += `<g class="cell${c.pick ? ' tap' : ''}${c.from === k ? ' from' : ''}" data-k="${k}"><rect x="${x0 + (q - 1) * z + 1}" y="${y0 + (r - 1) * z + 1}" width="${z - 2}" height="${z - 2}" rx="5"/>${it ? `<text x="${x0 + (q - 0.5) * z}" y="${y0 + (r - 0.5) * z + 9}" class="emo">${ic[it]}</text>` : ''}${c.put ? `<text x="${x0 + (q - 0.5) * z}" y="${y0 + (r - 0.5) * z + 9}" class="emo put">${ic[c.put]}</text>` : ''}</g>`; }
    }
    return svg(x0 + c.cols * z + 4, y0 + c.rows * z + 4, s, 'plan');
  },
  // the front of the hotel: windows in rows and columns, with the mirror line in the middle
  facade(c) {
    const z = 42, x0 = 26, y0 = 22, lit = new Set(c.lit);
    let s = `<rect x="${x0 - 6}" y="${y0 - 6}" width="${c.cols * z + 12}" height="${c.rows * z + 12}" rx="6" fill="#A9DCC6"/>`;
    for (let q = 1; q <= c.cols; q++) s += T(x0 + (q - 0.5) * z, 12, q, 'class="lab"');
    for (let r = 1; r <= c.rows; r++) {
      s += T(10, y0 + (r - 0.5) * z + 6, r, 'class="lab"');
      for (let q = 1; q <= c.cols; q++) { const k = `${r}-${q}`, tap = c.pick && !lit.has(k) && (!c.half || q > c.cols / 2); s += `<g class="win${lit.has(k) ? ' lit' : ''}${tap ? ' tap' : ''}"${tap ? ` data-k="${k}"` : ''}><rect x="${x0 + (q - 1) * z + 7}" y="${y0 + (r - 1) * z + 5}" width="${z - 14}" height="${z - 10}" rx="3"/></g>`; }
    }
    s += `<path d="M${x0 + c.cols * z / 2} ${y0 - 10}v${c.rows * z + 20}" stroke="#D9474F" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    return svg(x0 + c.cols * z + 10, y0 + c.rows * z + 10, s, 'facade');
  },
  menu(c) {
    const heads = ['Primers', 'Segons', 'Postres'], cw = c.cols.length === 3 ? 104 : 150, rows = Math.max(...c.cols.map(a => a.length));
    let s = `<rect x="2" y="2" width="${c.cols.length * cw + 8}" height="${rows * 34 + 58}" rx="12" fill="${CREAM}" stroke="${BRASS}" stroke-width="2.5"/>${T((c.cols.length * cw + 12) / 2, 26, 'Menú del dia', 'class="hd ink"')}`;
    c.cols.forEach((col, j) => { s += T(8 + (j + 0.5) * cw, 48, heads[j], 'class="tiny red"'); col.forEach((d, i) => { s += `<g class="dish" data-k="${j}-${i}"><rect x="${12 + j * cw}" y="${56 + i * 34}" width="${cw - 8}" height="28" rx="8"/>${T(8 + (j + 0.5) * cw, 75 + i * 34, d)}</g>`; }); });
    return svg(c.cols.length * cw + 12, rows * 34 + 64, s, 'menu');
  },
  parts(c) { const per = 12; return svg(340, Math.ceil(c.n / per) * 27 + 6, Array.from({ length: c.n }, (_, i) => face(['anec', 'tortuga', 'lludriga', 'granota'][i % 4], 14 + (i % per) * 27, 15 + Math.floor(i / per) * 27, 10)).join(''), 'parts'); },
  jug(c) {
    const n = 1000 / c.ml; return svg(300, 110, `<path d="M30 20h30v10l10 14v58h-50v-58l10 -14z" fill="#DFF2F7" stroke="#7BB5C6" stroke-width="2"/><rect x="21" y="52" width="48" height="48" fill="#BFE6F2"/>${T(45, 84, '1 litre', 'class="tiny"')}
      ${Array.from({ length: Math.min(n, 5) }, (_, i) => ICON.glass(110 + i * 34, 70, 1.4)).join('')}${T(200, 104, `gots de ${c.ml} ml`, 'class="tiny"')}`, 'jug');
  },
  // the bill: a line for each thing, what it comes to, the total; ? where a number is still to find
  bill(c) {
    const w = 310, lh = 38, n = c.lines.length, hasTotal = 'total' in c, H = 62 + n * lh + (hasTotal ? 40 : 0) + (c.paid ? 64 : 0);
    // a number: the one to find now is the blank the keypad writes in; another one still unknown is a quiet ?
    const money = (v, now) => v == null ? (now ? '<tspan class="blank">?</tspan> €' : '<tspan class="unk">?</tspan> €') : `${v} €`;
    let zig = ''; for (let x = w - 4, i = 0; x > 4; x -= 12, i++) zig += `L${Math.max(4, x - 12)} ${H + (i % 2 ? 0 : 8)}`;
    let y = 58, s = `<path d="M4 4H${w - 4}V${H}${zig}Z" fill="#FFFDF6" stroke="#D8C9A8" stroke-width="1.5"/>
      ${T(w / 2, 26, "Hotel de l'Estany", 'class="hd ink"')}${T(w / 2, 44, c.who ? `Factura · ${c.who}` : 'Factura', 'class="tiny"')}`;
    c.lines.forEach((l, i) => {
      const now = c.blank === i;
      s += `<g class="bl${c.pick ? ' tap' : ''}${now ? ' now' : ''}"${c.pick ? ` data-k="L${i}"` : ''}><rect x="10" y="${y - 4}" width="${w - 20}" height="${lh - 4}" rx="6"/>${T(18, y + 12, l.t, 'class="lt"')}${l.q ? T(18, y + 27, l.q, 'class="tiny lq"') : ''}
        <text x="${w - 18}" y="${y + 21}" class="lv">${money(now ? null : l.tot, now)}</text></g>`;
      y += lh;
    });
    if (hasTotal) { const now = c.blank == null && c.total == null; s += `<path d="M14 ${y}h${w - 28}" stroke="${INK}" stroke-dasharray="3 3"/><g class="bl${now ? ' now' : ''}"><rect x="10" y="${y + 6}" width="${w - 20}" height="30" rx="6"/>${T(18, y + 27, 'Total', 'class="lt big2"')}<text x="${w - 18}" y="${y + 28}" class="lv big2">${money(c.total, now)}</text></g>`; y += 40; }
    if (c.paid) s += `<g class="bl">${T(18, y + 20, 'Paga amb', 'class="lt"')}<text x="${w - 18}" y="${y + 20}" class="lv">${c.paid} €</text></g><g class="bl now"><rect x="10" y="${y + 30}" width="${w - 20}" height="30" rx="6"/>${T(18, y + 51, 'Canvi', 'class="lt big2"')}<text x="${w - 18}" y="${y + 52}" class="lv big2">${money(null, true)}</text></g>`;
    return svg(w, H + 12, s, 'bill');
  },
  // the bars of a chart: guests by day; set: the bars are made by touching a column at its height
  bars(c) {
    const n = c.labels.length, bw = 44, x0 = 36, H = 170, top = 14, scale = H / c.max;
    let s = '';
    for (let v = 0; v <= c.max; v += c.step) { const y = top + H - v * scale; s += `<path d="M${x0} ${y}h${n * (bw + 14) + 6}" stroke="#D8C9A8"/>` + T(x0 - 8, y + 4, v, 'class="tiny ax"'); }
    for (let v = c.step / 2; v < c.max; v += c.step) { const y = top + H - v * scale; s += `<path d="M${x0} ${y}h${n * (bw + 14) + 6}" stroke="#EDE3CC" stroke-dasharray="2 4"/>`; }
    c.labels.forEach((l, i) => {
      const x = x0 + 10 + i * (bw + 14), v = c.set ? 0 : c.values[i], y = top + H - v * scale;
      s += `<g class="bar${c.pick ? ' tap' : ''}"${c.pick ? ` data-k="B${i}"` : ''} data-i="${i}"><rect class="col" x="${x - 4}" y="${top}" width="${bw + 8}" height="${H}" fill="transparent"/><rect class="b" x="${x}" y="${y}" width="${bw}" height="${v * scale}" rx="4"/></g>${T(x + bw / 2, top + H + 18, l, 'class="tiny"')}`;
      if (c.set) { s += `<rect x="${x}" y="${top}" width="${bw}" height="${H}" rx="4" fill="none" stroke="#C9B994" stroke-dasharray="4 4"/>`; for (let v = 5; v <= c.max; v += 5) s += `<rect class="lvl" data-k="${i}-${v}" x="${x - 4}" y="${top + H - (v + 2.5) * scale}" width="${bw + 8}" height="${5 * scale}" fill="transparent"/>`; }
    });
    return svg(x0 + n * (bw + 14) + 16, top + H + 28, s, `bars${c.set ? ' set' : ''}`);
  },
  pict(c) {
    let s = '';
    c.labels.forEach((l, i) => { const y = 22 + i * 32; s += T(18, y + 5, l, 'class="tiny"'); const v = c.values[i]; for (let j = 0; j < Math.floor(v / c.per); j++) s += ICON.bed(52 + j * 32, y, 0.95); if (v % c.per) s += ICON.half(52 + Math.floor(v / c.per) * 32, y, 0.95); });
    s += `<g transform="translate(12 ${18 + c.labels.length * 32})">${ICON.bed(14, 0, 0.8)}${T(70, 5, `= ${c.per} hostes`, 'class="tiny"')}</g>`;
    return svg(340, 34 + c.labels.length * 32, s, 'pict');
  },
  table(c) {
    const cw = [110, 56, 56, 56]; let s = '', y = 26;
    s += `<rect x="2" y="2" width="282" height="${30 + c.rows.length * 30}" rx="10" fill="${CREAM}" stroke="#D8C9A8" stroke-width="2"/>`;
    ['', ...c.heads].forEach((h, j) => { s += T(cw.slice(0, j).reduce((a, b) => a + b, 0) + cw[j] / 2 + 4, 22, h, 'class="tiny red"'); });
    c.rows.forEach(row => { y += 30; row.forEach((v, j) => { s += T(cw.slice(0, j).reduce((a, b) => a + b, 0) + cw[j] / 2 + 4, y - 6, v, j ? 'class="mid"' : 'class="lt"'); }); s += `<path d="M8 ${y + 2}h270" stroke="#EDE3CC"/>`; });
    return svg(288, 40 + c.rows.length * 30, s, 'table');
  },
  tally(c) {
    let s = '';
    c.what.forEach((w, i) => {
      const y = 24 + i * 34, v = c.values[i]; s += T(14, y + 6, w, 'class="lt" text-anchor="start"');
      for (let j = 0; j < v; j++) { const g = Math.floor(j / 5), k = j % 5, x = 130 + g * 46 + k * 8; s += k === 4 ? `<path d="M${x - 34} ${y + 8}L${x + 2} ${y - 10}" stroke="${INK}" stroke-width="2.5"/>` : `<path d="M${x} ${y - 10}v20" stroke="${INK}" stroke-width="2.5"/>`; }
    });
    return svg(340, 24 + c.what.length * 34, s, 'tally');
  },
  bag(c) {
    const col = { vermella: '#D9474F', blava: '#3E7CB1', groga: '#F2C14E', verda: '#4FA65A' }, balls = Object.entries(c.balls).flatMap(([k, n]) => Array(n).fill(col[k]));
    let s = `<path d="M70 30q-40 10 -50 70q0 50 70 50h60q70 0 70 -50q-10 -60 -50 -70z" fill="#B98A5A" stroke="#7A5230" stroke-width="3"/><path d="M80 30q40 -14 80 0" stroke="#7A5230" stroke-width="5" fill="none"/>`;
    balls.forEach((f, i) => { s += `<circle cx="${60 + (i % 5) * 30 + (Math.floor(i / 5) % 2) * 14}" cy="${70 + Math.floor(i / 5) * 28}" r="12" fill="${f}" stroke="rgba(0,0,0,.25)"/>`; });
    return svg(240, 160, s, 'bag');
  }
};
function clock(cx, cy, r, h, m) {
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${CREAM}" stroke="${BRASS}" stroke-width="5"/>`;
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; s += T(cx + Math.sin(a) * r * 0.78, cy - Math.cos(a) * r * 0.78 + 5, i, 'class="tiny"'); }
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r1 = i % 5 ? r * 0.92 : r * 0.88; s += `<path d="M${cx + Math.sin(a) * r1} ${cy - Math.cos(a) * r1}L${cx + Math.sin(a) * r * 0.97} ${cy - Math.cos(a) * r * 0.97}" stroke="${INK}" stroke-width="${i % 5 ? 1 : 2}"/>`; }
  const ah = ((h % 12) + m / 60) / 12 * Math.PI * 2, am = m / 60 * Math.PI * 2;
  s += `<path d="M${cx} ${cy}L${cx + Math.sin(ah) * r * 0.5} ${cy - Math.cos(ah) * r * 0.5}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  s += `<path d="M${cx} ${cy}L${cx + Math.sin(am) * r * 0.78} ${cy - Math.cos(am) * r * 0.78}" stroke="#D9474F" stroke-width="3.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="5" fill="${INK}"/>`;
  return s;
}

export const card = c => `<div class="card k-${c.k}">${(K[c.k] || K.note)(c)}</div>`;
// a short name of what a touched thing is, for a screen reader
export const keyName = (c, k) => c.k === 'cal' ? `${k}` : k;
export { WEEK, PLACES };
