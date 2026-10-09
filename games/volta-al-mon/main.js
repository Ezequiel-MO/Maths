import { $, RM, sleep, pick, mid } from '../../shared/util.js';
import { voice } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { PROJECTS, CIRCLES, POOL, SOLIDS, NETS, NAMES, PEGS, COLS, DIRS, TURN, POINTS, VALID, EXAM_PASS, RAPID, MEDALS, xy, cellAt, free, poly, geoOk, paintOk, buildOk, views, starsFor, facet,
  clean, noteOf, reached, validated, medals, levelText, isOpen, examOpen, circleOf, exOf, BADGES, badges, poolIn, levelIn, rapidIn, exam, examIn, sheet, sheetIn, quick } from './logic.js';

const KEY = 'volta-al-mon';
// ?obert at the end of the address opens every circle, every exam and every level, to try the game out; without it a circle opens
// with the exam of the one before, an exam with its projects validated, and a level after the one before
const OPEN = new URLSearchParams(location.search).has('obert');

// Facts only: { so, stars, piscina, exams, fulls, rapid }. clean() makes a complete progress out of anything the browser holds
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
// The bar at the top of every screen: «Nivell 2,27», and the fill is the decimals, the part of the level that is done
function paintXp() {
  const box = $('#xp'), lv = levelText(prog), pct = +lv.split(',')[1];
  if (!box.firstChild) box.innerHTML = '<span class="xp-n"></span><span class="xp-bar" role="img"><i></i></span>';
  const [n, bar] = box.children;
  n.textContent = `Nivell ${lv}`; bar.setAttribute('aria-label', `${pct} % del nivell`); bar.firstChild.style.width = pct + '%';
}

// every new screen cancels the running one through this token
let tok = { on: true };
function fresh() { tok.on = false; tok = { on: true }; return tok; }

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');

/* ---------- the drawings ---------- */
// the frog of the pond on its trip: a gold medal round its neck and the Olympic torch in its hand
const FROG = `<svg class="frog" viewBox="-40 -60 88 82" aria-hidden="true"><ellipse cx="0" cy="16" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 12q-9-2-7-9q7 2 11 6ZM25 12q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-6" rx="25" ry="20" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <ellipse cx="0" cy="3" rx="15" ry="9" fill="#BFEFC2"/><path d="M-10 -6L0 6L10 -6" fill="none" stroke="#EE334E" stroke-width="3.5" stroke-linejoin="round"/><circle cx="0" cy="8" r="5.5" fill="#F7C64E" stroke="#B8860B" stroke-width="1.5"/>
  <circle cx="-12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-27" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-26" r="4" fill="#0F3A40"/><circle cx="13" cy="-26" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-28" r="1.4" fill="#fff"/><circle cx="14.5" cy="-28" r="1.4" fill="#fff"/>
  <path d="M-9 -13Q0 -6 9 -13" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M27 -22h14l-4 26h-6Z" fill="#DCE6EA" stroke="#7F949C" stroke-width="1.5" stroke-linejoin="round"/><g class="flame"><path d="M34 -23q-11-10 0-27q1 9 6 12t-6 15Z" fill="#FF8A3D"/><path d="M34 -24q-5-6 0-13q3 6 0 13Z" fill="#F7C64E"/></g>
  <circle cx="27" cy="-6" r="5" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/></svg>`;
// the five rings: Europe, Africa, Asia, America and Oceania, in the places and the colours they have on the flag
const RINGC = ['#2F9BE0', '#C9D6DB', '#FCB131', '#EE334E', '#2DBE6C'], RHUE = [205, 190, 45, 350, 146];
const RINGAT = [[22, 24], [45, 24], [33.5, 36], [68, 24], [56.5, 36]];
const ringsSvg = lit => `<svg class="rings" viewBox="8 10 74 40" role="img" aria-label="Les cinc anelles">${RINGAT.map(([x, y], c) => `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${RINGC[c]}" stroke-width="2.8"${lit(c) ? '' : ' class="off"'}/>`).join('')}</svg>`;
// the flags, each on its own canvas; np has no frame because it is not a rectangle
const band = (y, h, c) => `<rect y="${y}" width="90" height="${h}" fill="${c}"/>`, bar = (x, c) => `<rect x="${x}" width="30" height="60" fill="${c}"/>`;
const FLAGS = {
  oli: [90, 60, `<rect width="90" height="60" fill="#fff"/>${RINGAT.map(([x, y], c) => `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${['#0081C8', '#111', '#FCB131', '#EE334E', '#00A651'][c]}" stroke-width="2.8"/>`).join('')}`],
  fr: [90, 60, bar(0, '#0055A4') + bar(30, '#fff') + bar(60, '#EF4135')],
  cz: [90, 60, band(0, 30, '#fff') + band(30, 30, '#D7141A') + '<path d="M0 0L45 30L0 60Z" fill="#11457E"/>'],
  ch: [60, 60, '<rect width="60" height="60" fill="#DA291C"/><path d="M25 12h10v13h13v10h-13v13h-10v-13h-13v-10h13Z" fill="#fff"/>'],
  jp: [90, 60, '<rect width="90" height="60" fill="#fff"/><circle cx="45" cy="30" r="18" fill="#BC002D"/>'],
  br: [90, 60, '<rect width="90" height="60" fill="#009C3B"/><path d="M45 6L84 30L45 54L6 30Z" fill="#FFDF00"/><circle cx="45" cy="30" r="12" fill="#002776"/>'],
  jm: [90, 60, '<rect width="90" height="60" fill="#FED100"/><path d="M10 0H80L45 23ZM10 60H80L45 37Z" fill="#009B3A"/><path d="M0 7V53L35 30ZM90 7V53L55 30Z" fill="#111"/>'],
  kw: [90, 60, band(0, 20, '#007A3D') + band(20, 20, '#fff') + band(40, 20, '#CE1126') + '<path d="M0 0L22 20V40L0 60Z" fill="#111"/>'],
  np: [50, 60, '<path d="M1.500 1.500L46 28H21L46 58.500H1.500Z" fill="#DC143C" stroke="#003893" stroke-width="3" stroke-linejoin="miter"/><circle cx="13" cy="20" r="4" fill="#fff"/><circle cx="14" cy="43" r="5.5" fill="#fff"/>', true],
  tt: [90, 60, '<rect width="90" height="60" fill="#CE1126"/><path d="M4 0H34L86 60H56Z" fill="#fff"/><path d="M9 0H29L81 60H61Z" fill="#111"/>'],
  co: [90, 60, band(0, 30, '#FCD116') + band(30, 15, '#003893') + band(45, 15, '#CE1126')],
  th: [90, 60, band(0, 60, '#A51931') + band(10, 40, '#F4F5F8') + band(20, 20, '#2D2A4A')]
};
function flag(id, w = 210) {
  const [a, b, html, bare] = FLAGS[id];
  return `<svg class="flag" viewBox="0 0 ${a} ${b}" style="width:${Math.round(w * a / 90)}px" aria-hidden="true">${html}${bare ? '' : `<rect x="0.4" y="0.4" width="${a - 0.8}" height="${b - 0.8}" fill="none" stroke="rgb(255 255 255 / 0.55)" stroke-width="0.8"/>`}</svg>`;
}
// plane shapes by name, on a canvas of 100; lab is written under the bottom side
const reg = (n, r, off = -Math.PI / 2, dy = 0) => `<polygon points="${Array.from({ length: n }, (_, i) => { const a = off + i * 2 * Math.PI / n; return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + dy + r * Math.sin(a)).toFixed(1)}`; }).join(' ')}"/>`;
const SHAPES = { tri: reg(3, 46, -Math.PI / 2, 10), sq: '<rect x="14" y="14" width="72" height="72"/>', rect: '<rect x="6" y="26" width="88" height="48"/>', pent: reg(5, 42, -Math.PI / 2, 3), hex: reg(6, 42, 0),
  oct: reg(8, 43, Math.PI / 8), circ: '<circle cx="50" cy="50" r="38"/>' };
const shapeSvg = (id, w = 150, lab = '') => `<svg class="shape" viewBox="0 0 100 ${lab ? 112 : 100}" style="width:${w}px" aria-hidden="true">${SHAPES[id]}${lab ? `<text x="50" y="106">${lab}</text>` : ''}</svg>`;
// a rectangle of a by b with what its sides say; grid draws its squares and diag paints the half under a diagonal
function rectPic(P) {
  const s = Math.min(210 / P.a, 130 / P.b), w = P.a * s, h = P.b * s, la = P.la ?? (P.u ? `${P.a} ${P.u}` : ''), lb = P.lb ?? (P.u ? `${P.b} ${P.u}` : ''), pad = lb ? 52 : 6;
  const lines = P.grid ? Array.from({ length: P.a - 1 }, (_, i) => `M${(i + 1) * s} 0V${h}`).join('') + Array.from({ length: P.b - 1 }, (_, i) => `M0 ${(i + 1) * s}H${w}`).join('') : '';
  return `<svg class="fig" viewBox="${-pad} ${la ? -26 : -6} ${w + pad + 6} ${h + (la ? 32 : 12)}" style="width:${Math.round(w + pad + 6)}px" aria-hidden="true"><rect class="f" width="${w}" height="${h}"/>
    ${P.diag ? `<path class="half" d="M0 ${h}H${w}V0Z"/>` : ''}<path class="gl" d="${lines}"/>${P.diag ? `<path class="cut" d="M0 ${h}L${w} 0"/>` : ''}<rect class="o" width="${w}" height="${h}"/>
    ${la ? `<text x="${w / 2}" y="-9">${la}</text>` : ''}${lb ? `<text x="-8" y="${h / 2 + 6}" text-anchor="end">${lb}</text>` : ''}</svg>`;
}
// squares on a grid, drawn from rows of '#' and '.'
function cellsPic(rows) {
  const s = Math.min(30, 240 / rows[0].length), w = rows[0].length * s, h = rows.length * s;
  return `<svg class="fig" viewBox="-3 -3 ${w + 6} ${h + 6}" style="width:${w + 6}px" aria-hidden="true">${rows.map((r, y) => [...r].map((c, x) => `<rect class="${c === '#' ? 'f o' : 'e'}" x="${x * s}" y="${y * s}" width="${s}" height="${s}"/>`).join('')).join('')}</svg>`;
}
// a triangle with a right angle: sides writes on its bottom, its left side and its long side; ang at the right angle, the bottom corner and the top
function triPic(P) {
  const [bx, ty] = P.sides ? [140, 20] : [89, 10], S = P.sides, A = P.ang;
  return `<svg class="fig" viewBox="-30 -18 200 158" style="width:230px" aria-hidden="true"><path class="f o" d="M20 110H${bx}L20 ${ty}Z"/><path class="gl" d="M20 96H34V110"/>
    ${S ? `<text x="${(20 + bx) / 2}" y="130">${S[0]}</text><text x="12" y="${(110 + ty) / 2 + 5}" text-anchor="end">${S[1]}</text><text x="${(20 + bx) / 2 + 22}" y="${(110 + ty) / 2 - 4}">${S[2]}</text>`
      : `<text x="-4" y="126" class="sm">${A[0]}</text><text x="${bx + 24}" y="116" class="sm">${A[1]}</text><text x="20" y="${ty - 0}" dy="-6" class="sun">${A[2]}</text>`}</svg>`;
}
// two rays that open deg degrees, counted against the clock from the flat one; mark draws the little square of a right angle
function angleSvg(deg, mark = false, knob = false) {
  const r = deg * Math.PI / 180, c = Math.cos(r), s = -Math.sin(r), f = v => v.toFixed(1);
  const arc = deg >= 360 ? '<circle class="arc" r="36"/>' : deg > 0 ? `<path class="arc" d="M0 0H36A36 36 0 ${deg > 180 ? 1 : 0} 0 ${f(36 * c)} ${f(36 * s)}Z"/>` : '';
  return `<svg class="ang" viewBox="-104 -104 208 208" aria-hidden="true">${arc}${mark && deg === 90 ? '<path class="sqm" d="M18 0V-18H0"/>' : ''}<path class="ray" d="M0 0H90"/><path class="ray mv" d="M0 0L${f(90 * c)} ${f(90 * s)}"/><circle class="hub" r="6"/>${knob ? `<circle class="knob" cx="${f(90 * c)}" cy="${f(90 * s)}" r="11"/>` : ''}</svg>`;
}
// a clock at h o'clock
const clockPic = h => `<svg class="fig clock" viewBox="-70 -70 140 140" style="width:170px" aria-hidden="true"><circle class="f o" r="64"/>${Array.from({ length: 12 }, (_, i) => `<path class="gl" transform="rotate(${i * 30})" d="M0 -64V-${i % 3 ? 58 : 52}"/>`).join('')}
  <path class="hand" d="M0 0V-50"/><path class="hand hr" transform="rotate(${h * 30})" d="M0 0V-34"/><circle class="hub" r="5"/></svg>`;
// a turn: the part of a whole one that frac says, from the top and with the clock
function spinPic(frac) {
  const a = frac * 2 * Math.PI, x = 54 * Math.sin(a), y = -54 * Math.cos(a);
  return `<svg class="fig clock" viewBox="-70 -70 140 140" style="width:170px" aria-hidden="true"><circle class="f o" r="64"/>${frac >= 1 ? '<circle class="arc" r="54"/>' : `<path class="arc" d="M0 0V-54A54 54 0 ${frac > 0.5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}Z"/>`}
    <path class="gl" d="M0 -64V64M-64 0H64"/><path class="hand" d="M0 0V-54"/><path class="hand hr" d="M0 0L${(x * 0.999).toFixed(1)} ${y.toFixed(1)}"/><circle class="hub" r="5"/></svg>`;
}
const COMPASS = `<svg class="fig clock" viewBox="-70 -70 140 140" style="width:170px" aria-hidden="true"><circle class="f o" r="64"/><path d="M0 -44L9 0H-9Z" fill="#EE334E"/><path d="M0 44L9 0H-9Z" fill="#DCE6EA"/><circle class="hub" r="5"/>
  <text y="-48">N</text><text y="60">S</text><text x="54" y="6">E</text><text x="-54" y="6">O</text></svg>`;

// A solid seen from where yaw and pitch say, as the inside of an SVG of 220: the faces that look away are a dashed outline (so their
// edges and corners can be counted) and the ones that look at us are filled, lighter the more they face the light
const LIGHT = [-0.45, 0.75, 0.5], K = 46;
function solidInner(id, yaw, pitch) {
  const S = SOLIDS[id], cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const rot = ([x, y, z]) => { const x1 = x * cy + z * sy, z1 = z * cy - x * sy; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
  if (S.ball) {
    // a ball looks the same from everywhere: three parallels and three meridians turn with it
    const line = pts => { let d = '', pen = false; for (const p of pts.map(rot)) { if (p[2] > 0) { d += `${pen ? 'L' : 'M'}${(p[0] * 72).toFixed(1)} ${(-p[1] * 72).toFixed(1)}`; pen = true; } else pen = false; } return d; };
    const circle = f => Array.from({ length: 49 }, (_, i) => f(i / 48 * 2 * Math.PI));
    const lats = [-0.5, 0, 0.5].map(y => circle(a => [Math.sqrt(1 - y * y) * Math.cos(a), y, Math.sqrt(1 - y * y) * Math.sin(a)]));
    const lons = [0, 1, 2].map(k => circle(a => [Math.cos(a) * Math.cos(k * Math.PI / 3), Math.sin(a), Math.cos(a) * Math.sin(k * Math.PI / 3)]));
    return `<defs><radialGradient id="ballg" cx="34%" cy="28%" r="75%"><stop offset="0" stop-color="hsl(${S.hue} 90% 78%)"/><stop offset="1" stop-color="hsl(${S.hue} 75% 34%)"/></radialGradient></defs>
      <circle r="72" fill="url(#ballg)"/><path class="bline" d="${[...lats, ...lons].map(line).join('')}"/>`;
  }
  const R = S.V.map(rot), pts = f => f.map(i => `${(R[i][0] * K).toFixed(1)},${(-R[i][1] * K).toFixed(1)}`).join(' ');
  const faces = S.F.map(f => {
    const [a, b, c] = f.map(i => R[i]), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    // the solid sits round the middle of the space, so a face looks outwards when it looks away from there
    const m = f.reduce((s, i) => [s[0] + R[i][0], s[1] + R[i][1], s[2] + R[i][2]], [0, 0, 0]), l = Math.hypot(...n) || 1;
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) n = n.map(x => -x);
    return { f, z: n[2] / l, lit: Math.max(0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / l) };
  });
  const paint = F => { const c = `hsl(${S.hue} 72% ${(26 + 44 * F.lit).toFixed(0)}%)`; return `<polygon class="${S.round && F.f.length < 5 ? 'skin' : 'face'}" points="${pts(F.f)}" fill="${c}"${S.round && F.f.length < 5 ? ` stroke="${c}"` : ''}/>`; };
  return `${S.round ? '' : faces.filter(F => F.z <= 0).map(F => `<polygon class="hid" points="${pts(F.f)}"/>`).join('')}${faces.filter(F => F.z > 0).map(paint).join('')}`;
}
const solidSvg = (id, w = 220, yaw = 0.6, pitch = 0.42) => `<svg class="solid" viewBox="-110 -110 220 220" style="width:${w}px" aria-hidden="true">${solidInner(id, yaw, pitch)}</svg>`;
// the solid of a stage turns slowly by itself until it is touched; then it follows the finger
function mountSolid(svg, id, t) {
  let yaw = 0.6, pitch = 0.42, drag = null, spin = !RM, last = 0;
  const draw = () => { svg.innerHTML = solidInner(id, yaw, pitch); };
  svg.onpointerdown = e => { drag = [e.clientX, e.clientY]; spin = false; svg.setPointerCapture(e.pointerId); };
  svg.onpointermove = e => { if (!drag) return; yaw += (e.clientX - drag[0]) * 0.012; pitch = Math.min(1.35, Math.max(-1.35, pitch + (e.clientY - drag[1]) * 0.012)); drag = [e.clientX, e.clientY]; draw(); };
  svg.onpointerup = svg.onpointercancel = () => { drag = null; };
  const loop = now => { if (!t.on || !svg.isConnected || !spin) return; yaw += Math.min(0.05, (now - last) / 1000) * 0.5; last = now; draw(); requestAnimationFrame(loop); };
  if (spin) requestAnimationFrame(now => { last = now; loop(now); });
}
// A building of cubes seen from a corner, the front to the lower left and the right side to the lower right. Drawn from the back
// to the front, so the cubes in front cover the ones behind
function cubesSvg(h, w = 0) {
  const rows = h.length, cols = h[0].length, a = 24, c = 26, top = Math.max(1, ...h.flat());
  const P = (x, y, z) => `${(x - y) * a},${(x + y) * a / 2 - z * c}`, q = (...p) => p.map(v => P(...v)).join(' ');
  let s = '';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) s += `<polygon class="tile" points="${q([x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0])}"/>`;
  for (let k = 0; k <= rows + cols - 2; k++) for (let y = 0; y < rows; y++) {
    const x = k - y;
    if (x < 0 || x >= cols) continue;
    for (let z = 0; z < h[y][x]; z++) s += `<polygon class="ct" points="${q([x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1])}"/><polygon class="cl" points="${q([x, y + 1, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z], [x, y + 1, z])}"/><polygon class="cr" points="${q([x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x + 1, y + 1, z], [x + 1, y, z])}"/>`;
  }
  const x0 = -rows * a - 30, x1 = cols * a + 30, y0 = -top * c - 6, y1 = (rows + cols) * a / 2 + 26, fx = (cols / 2 - rows) * a, fy = (cols / 2 + rows) * a / 2, sx = (cols - rows / 2) * a, sy = (cols + rows / 2) * a / 2;
  return `<svg class="cubes" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" style="width:${w || Math.round((x1 - x0) * 1.25)}px" aria-hidden="true">${s}<text x="${fx - 10}" y="${fy + 20}" text-anchor="end">davant ↗</text><text x="${sx + 10}" y="${sy + 20}" text-anchor="start">↖ costat</text></svg>`;
}
// a view: towers of squares, as tall as cols says
const viewSvg = (cols, s = 17) => { const top = Math.max(...cols); return `<svg class="view" viewBox="-2 -2 ${cols.length * s + 4} ${top * s + 4}" style="width:${cols.length * s + 4}px" aria-hidden="true">${cols.map((n, x) => Array.from({ length: n }, (_, z) => `<rect x="${x * s}" y="${(top - 1 - z) * s}" width="${s}" height="${s}"/>`).join('')).join('')}</svg>`; };
const netSvg = (cells, s = 17) => { const w = Math.max(...cells.map(c => c[0])) + 1, h = Math.max(...cells.map(c => c[1])) + 1; return `<svg class="view net" viewBox="-2 -2 ${w * s + 4} ${h * s + 4}" style="width:${w * s + 4}px" aria-hidden="true">${cells.map(([x, y]) => `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}"/>`).join('')}</svg>`; };
// The map: a row for each number, the highest at the top, and the letters under it. o.frog is where the frog is (o.dir where it looks,
// as an arrow), o.goal the flag, o.sel the square picked; o.tap makes its squares buttons
function mapHtml(M, o = {}) {
  const tag = o.tap ? 'button' : 'span';
  const sq = (x, y) => {
    const c = cellAt(x, y), wet = !free(M, c), T = M.things?.[c];
    const inner = c === o.frog ? (o.dir ? `<i class="tok" style="--a:${TURN.indexOf(o.dir) * 90}deg">▲</i>` : '🐸') : c === o.goal ? '🚩' : T ? T[0] : '';
    return `<${tag} class="mc${wet ? ' wet' : ''}${c === o.sel ? ' sel' : ''}${c === o.frog ? ' here' : ''}" data-c="${c}"${o.tap ? ` aria-label="Casella ${c}"` : ''}>${inner}</${tag}>`;
  };
  return `<div class="mapg" style="--w:${M.w}">${Array.from({ length: M.h }, (_, i) => { const y = M.h - 1 - i; return `<b class="ax">${y + 1}</b>${Array.from({ length: M.w }, (_, x) => sq(x, y)).join('')}`; }).join('')}<b></b>${[...COLS.slice(0, M.w)].map(c => `<b class="ax">${c}</b>`).join('')}</div>`;
}
// the medal of a level: gold, silver or bronze
const medalSvg = n => `<svg class="medalv m${n}" viewBox="-30 -44 60 78" role="img" aria-label="Medalla ${n === 3 ? "d'or" : 'de ' + MEDALS[n]}"><path d="M-16 -44h12l8 22h-12ZM16 -44h-12l-8 22h12Z" fill="#EE334E"/><path d="M-4 -44h8v20h-8Z" fill="#2F9BE0"/><circle cy="6" r="24" class="rim"/><circle cy="6" r="18" class="in"/><text y="15">${4 - n}</text></svg>`;
const medalName = n => n === 3 ? 'Medalla d\'or' : n === 2 ? 'Medalla de plata' : 'Medalla de bronze';

const HURRAY = ['Molt bé!', 'Perfecte!', 'Genial!', 'Quin viatge!', 'Campió!'];
const news = a => a.length ? `<p class="lead go">${a.length > 1 ? 'Insígnies noves' : 'Insígnia nova'}: ${list(a)}</p>` : '';
const list = a => a.join(', ').replace(/, ([^,]*)$/, ' i $1');
// takes the one-shot classes off an element and gives its class list back, so the same animation can start again
const again = e => { e.classList.remove('shake', 'pop', 'ok'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 14, 120); } };

// the link to the page of all games only exists where this page is served under its own file name, next to the others
const HUB = /volta-al-mon\.html$/.test(location.pathname);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toS').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toS').onclick = () => mapa();
function soBtn() { $('#so').textContent = `So: ${prog.so ? 'sí' : 'no'}`; }
$('#so').onclick = () => { prog.so = !prog.so; save(); soBtn(); if (prog.so) tone(660, 0, 0.2); };

// a real keyboard: the level on screen says what its keys do
let keyFn = null;
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });
// a tap that comes less than SETTLE after a question came up was meant for the one before
const SETTLE = 450;
let openAt = 0;
// each kind of level draws its stage and gives back its hint: a function that shows the help and returns what the tip says
const KIND = { ask, geo, paint, turn, spot, walk, build };

/* ---------- the map: five bands, one for each ring, with a button for each project and the exam of the circle at the end ---------- */
const openC = c => OPEN || isOpen(prog, c), openX = c => OPEN || examOpen(prog, c);
const noteText = i => { const n = noteOf(prog, i), d = prog.stars.slice(i * 10, i * 10 + 10).filter(Boolean).length; return n >= VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer'; };
const examBtn = c => `<button class="proj exam${prog.exams[c] ? ' ok' : ''}" data-x="${c}" aria-label="Examen del cercle ${c}"${openX(c) ? '' : ' disabled'}><b>Examen</b><span class="mk">${prog.exams[c] ? 'Superat ✓' : openX(c) ? 'Sis preguntes' : openC(c) ? 'Valida els projectes' : 'Tancat'}</span></button>`;
// one line that says what to do now: the first project of an open circle that is not validated, or its exam; nothing when all is done
function advice() {
  for (let c = 0; c < CIRCLES.length && isOpen(prog, c); c++) {
    const i = CIRCLES[c].projects.find(i => noteOf(prog, i) < VALID);
    if (i !== undefined) return `Ara toca: ${PROJECTS[i].name}`;
    if (!prog.exams[c]) return `Ara toca: l'examen del cercle ${c}`;
  }
  return '';
}
let here = -1;   // the project just left: the map puts the focus back on its button
function mapa() {
  fresh(); show('El mapa', false, 165);
  const bandOf = c => `<section class="ring${openC(c) ? '' : ' shut'}" style="--rc:${RINGC[c]}" aria-labelledby="rh${c}"><h2 id="rh${c}"><i class="rdot"></i><span>Cercle ${c} · ${CIRCLES[c].name}</span><small>${CIRCLES[c].what}</small></h2>
      ${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${noteOf(prog, i) >= VALID ? ' ok' : ''}" data-p="${i}"${openC(c) ? '' : ' disabled'}><b><i class="ico">${PROJECTS[i].ico}</i>${PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span><span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
  const got = badges(prog), tip = advice(), [au, ag, br] = medals(prog), ok = validated(prog), any = OPEN || ok.length > 0;
  $('#game').innerHTML = `<div class="map">${ringsSvg(c => prog.exams[c])}${tip ? `<p class="next">${tip}</p>` : ''}
    <p class="tally" aria-label="Medaller"><span><i class="dot m3"></i>${au} d'or</span><span><i class="dot m2"></i>${ag} de plata</span><span><i class="dot m1"></i>${br} de bronze</span></p>
    ${CIRCLES.map((_, c) => bandOf(c)).join('')}
    <div class="extra"><button class="btn soft" id="full"${any ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button><button class="btn soft" id="rapid"${OPEN || prog.piscina ? '' : ' disabled'}>⚡ Repte llampec${prog.rapid ? ` · rècord ${prog.rapid}` : ''}</button></div>
    <div class="pass"><b>Passaport · ${ok.length} de ${PROJECTS.length} segells</b><ul class="stamps">${PROJECTS.map((P, i) => `<li class="${ok.includes(i) ? 'on' : ''}" title="${P.name}">${P.ico}</li>`).join('')}</ul></div>
    <ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul></div>`;
  $('#game').onclick = e => {
    const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
    if (b && !b.disabled) {
      // the first level that still has something to win, as far as the project is open
      const i = +b.dataset.p, k = prog.stars.slice(i * 10, i * 10 + 10).findIndex(n => n < 3);
      level(i, k < 0 ? 0 : Math.min(k, OPEN ? 9 : reached(prog, i), 9));
    }
    else if (x && !x.disabled) examen(+x.dataset.x);
    else if (e.target.closest('#full:not(:disabled)')) full();
    else if (e.target.closest('#rapid:not(:disabled)')) llampec();
  };
  ($(`#game [data-p="${here}"]:not(:disabled)`) || $('#game button:not(:disabled)'))?.focus({ preventScroll: true }); here = -1;
}

// the frame of the Piscina, of an exam and of a sheet: the dots of its steps, the frog with its tip, the stage and the room under it
function frame(n, label) {
  $('#game').innerHTML = `<div class="hud mid"><span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span><span class="chip" id="qn" hidden></span></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div><div class="stage" id="stage"></div><div class="tail" id="tail"></div>`;
  const say = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  return { stage: $('#stage'), tail: $('#tail'), dots: [...$('#dots').children], say };
}
// the answers that are drawings: a shape, a solid, a flag, a cut-out of a cube or a view of a building
const OPT = { shape: v => shapeSvg(v, 76), solid: v => solidSvg(v, 92), flag: v => flag(v, 96), net: v => netSvg(NETS[v]), view: v => viewSvg([...v].map(Number)) };
const OPTNAME = { shape: v => ({ ...NAMES, circ: 'un cercle', oct: 'un octàgon' })[v], solid: v => SOLIDS[v].name, flag: () => 'una bandera', net: () => 'un retallable', view: () => 'una vista' };
const optBtn = (v, as) => as ? `<button class="btn soft picb" data-v="${v}" aria-label="${OPTNAME[as](v)}">${OPT[as](v)}</button>` : '';

/* ---------- the Piscina: three shapes to touch, the first thing a profile with nothing saved meets ---------- */
// A wrong one only shakes. The third saves piscina and opens the map. There is no «← Mapa» here: the map would have every circle
// shut, so the way out is the page of all games.
function piscina() {
  const t = fresh(); show('La Piscina', true, 205); $('#toS').hidden = true; $('#toG').hidden = !HUB;
  const { stage, dots, say } = frame(POOL.length, 'Tres reptes');
  let k = -1, busy = false;
  function arm() {
    k++; busy = false;
    const Q = POOL[k];
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `<p class="ask">${Q.q}</p><div class="opts">${Q.opts.map(v => optBtn(v, Q.as)).join('')}</div>`;
    stage.querySelector('.opts').onclick = async e => {
      const b = e.target.closest('button'); if (!b || busy || !t.on) return;
      blip();
      if (b.dataset.v !== Q.want) return again(b).add('shake');
      const last = k === POOL.length - 1;
      busy = true; b.classList.add('won'); dots[k].classList.add('ok'); spark(b);
      if (last) { prog = poolIn(prog).prog; save(); }
      say(`Sí! ${Q.fact}`, 'go'); chime([523, 659, 784, 1047, 1319]); FX.celebrate(last ? 16 : 8);
      await sleep(1700); if (!t.on) return;
      last ? mapa() : arm();
    };
    if (!k) say('Comença la volta al món! Cinc continents, cinc anelles, i la geometria de tot el planeta. Primer, la Piscina: tres reptes.');
  }
  arm();
}

/* ---------- one level of a project: the frame is the same for all, the stage is of its kind ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`${CIRCLES[c].name} · ${PROJECTS[sec].name}`, true, RHUE[c]); here = sec;
  const root = $('#game'), L = PROJECTS[sec].levels[idx];
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${L.title}</span><span class="chip" id="st"></span><button class="link" id="hintb">Dona'm una pista</button></div>
    <div class="coach" id="coach">${FROG}<p class="status tip" id="tip"></p></div><div class="stage" id="stage"></div>`;
  // a level is marked done when it has a medal
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const stage = $('#stage');
  const tip = (txt, cls = '') => { $('#tip').className = 'status tip ' + cls; $('#tip').innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
  const stars = () => { const n = starsFor(slips); $('#st').innerHTML = `<i class="dot m${n}"></i>${n === 3 ? 'Or' : n === 2 ? 'Plata' : 'Bronze'}`; };
  const slip = () => { slips++; stars(); buzz(); };

  // the level is handed in at once, before any wait: its medal goes to the mark of the project, and the mark to the XP once the project is validated
  async function win(line) {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    chime([523, 659, 784, 1047, 1319]); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(900); if (!t.on) return;
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line">${line}</p>${medalSvg(n)}<p class="mname m${n}">${medalName(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ` · segell ${PROJECTS[sec].ico} al passaport` : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes, medalla d'or i 10 punts.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }

  const help = KIND[L.kind]({ t, L, stage, tip, slip, win });
  $('#hintb').onclick = () => { if (over) return; const txt = help(); if (txt) { slip(); tip(txt); } };
  stars();
  // on a short screen the end of the stage can be under the fold: start from the frog's tip
  if (stage.getBoundingClientRect().bottom > innerHeight) $('#coach').scrollIntoView({ block: 'start', behavior: 'auto' });
}

/* ---------- the exam of a circle: six levels of its projects, one try each, no hints, saved by the sixth ---------- */
// what the frog says instead of the tip of the level: only what there is to do. The questions over a drawing keep their own line, which says what the drawing is
const ASK = { geo: 'Fes al geoplà la figura que es demana.', paint: 'Pinta els quadrets que calen.', turn: 'Obre l\'angle que es demana.', spot: 'Toca la casella i prem «És aquí!».',
  walk: 'Porta la granota fins a la bandera, sense que et faltin passos.', build: 'Construeix amb cubs el que es demana.' };
// Each question is a level played as ever, but its first slip ends it as missed and there is no hint button: the level gets a token of its own
// that goes off with the answer, so nothing of it moves afterwards. Nothing is saved before the sixth answer, which is handed in at once (examIn).
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RHUE[c]);
  const qs = exam(c, Math.random), run = [], { stage, tail, dots, say } = frame(qs.length, 'Sis preguntes');
  let k = -1, res = null;
  const next = () => k === qs.length - 1 ? finish() : arm();
  function arm() {
    k++;
    const L = qs[k], last = k === qs.length - 1, qt = { get on() { return t.on && !done; } };
    let done = false, failed = false;
    const end = ok => {
      if (done || !t.on) return;
      done = true; failed = !ok; keyFn = null; stage.inert = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
      if (last) { res = examIn(prog, c, qs, run); res.first = res.good && !prog.exams[c]; prog = res.prog; save(); }
      if (ok) { say('Correcte!', 'go'); chime([523, 659, 784]); FX.celebrate(6); return sleep(1000).then(() => { if (t.on) next(); }); }
      say('No és correcte.', 'oops'); buzz(); openAt = performance.now() + SETTLE;
      tail.innerHTML = `<button class="btn" id="nx">${last ? 'Mira el resultat' : 'Segueix'}</button>`;
      $('#nx').onclick = e => { if (e.timeStamp >= openAt) next(); };
    };
    // of what the level says, the exam keeps the cheers while it runs and, once missed, why it was wrong
    const tip = (txt, cls = '') => { if (cls === 'oops' ? failed : cls === 'go' && !done) say(txt.replace(/^Ui! /, ''), cls); };
    stage.inert = false; tail.innerHTML = ''; dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    $('#qn').hidden = false; $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[L.p].name}`;
    say(ASK[L.kind] || L.say);
    KIND[L.kind]({ t: qt, L, stage, tip, slip: () => end(false), win: () => end(true) });
    scrollTo({ top: 0, behavior: 'auto' });
  }
  // the end: how many were right, whether the exam is passed and what that gives and opens, and what to go over
  function finish() {
    const r = res;
    stage.inert = false; stage.innerHTML = tail.innerHTML = ''; $('#qn').hidden = true;
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    if (r.first) FX.celebrate(20);
    say(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    panel(stage, `<h2>${r.score} de ${qs.length}</h2>${r.good ? ringsSvg(x => prog.exams[x]) : ''}
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? 'Molt bé! Però l\'examen només compta amb tots els projectes del cercle validats.' : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${r.first ? `<p class="lead go">S'ha encès l'anella d'${CIRCLES[c].name}${c < CIRCLES.length - 1 ? `, i s'ha obert el cercle ${c + 1}: ${CIRCLES[c + 1].name}` : '. Has fet la volta al món!'}</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    scrollTo({ top: 0, behavior: 'auto' });
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  }
  arm();
}

/* ---------- «Caça l'errada»: three things a sheet says, one after the other; from none to two of them are wrong ---------- */
// What each kind of claim draws, what it says, how one of its values is written and what was true
const OFWHAT = { f: 'de cares', v: 'de vèrtexs', e: "d'arestes" };
const CLAIMS = {
  perim: C => ({ pic: rectPic({ a: C.a, b: C.b, u: 'm' }), txt: `Un rectangle de ${C.a} m per ${C.b} m té <b>${C.says} m</b> de perímetre.`, val: v => `${v} m`, truth: `el perímetre és ${C.real} m` }),
  area: C => ({ pic: rectPic({ a: C.a, b: C.b, u: 'm' }), txt: `Un rectangle de ${C.a} m per ${C.b} m té <b>${C.says} m²</b> d'àrea.`, val: v => `${v} m²`, truth: `l'àrea és ${C.real} m²` }),
  solid: C => ({ pic: solidSvg(C.id, 170), txt: `Nombre ${OFWHAT[C.what]} ${SOLIDS[C.id].of}: <b>${C.says}</b>.`, val: v => `${v} ${facet(C.what)}`, truth: `té ${C.real} ${facet(C.what)}` }),
  tri: C => ({ pic: `<div class="tbox"><b class="huge">${C.a}° + ${C.b}° + ?</b><p class="cap">els tres angles d'un triangle</p></div>`, txt: `Un triangle té angles de ${C.a}° i ${C.b}°. El tercer fa <b>${C.says}°</b>.`, val: v => `${v}°`, truth: `el tercer fa ${C.real}°, perquè tots tres sumen 180°` }),
  scale: C => ({ pic: `<div class="tbox"><b class="huge">× ${C.k}</b><p class="cap">cada costat, ${C.k} cops més llarg</p></div>`, txt: `Un rectangle de ${C.a} × ${C.b} té àrea ${C.area}. Amb cada costat ${C.k} cops més llarg, l'àrea passa a ser <b>${C.says}</b>.`, val: v => `àrea ${v}`, truth: `l'àrea passa a ser ${C.real}: ${C.k * C.k} cops més` })
};
// «És correcte» of a wrong one, or «No és correcte» of a right one, is a miss; «No és correcte» of a wrong one asks for the value that makes it true,
// with one choice. The third is handed in at once (sheetIn), before any wait; leaving earlier keeps nothing.
function full() {
  const t = fresh(); show("Caça l'errada", true, 40);
  const cs = sheet(Math.random), run = [], { stage, tail, dots, say } = frame(cs.length, 'Tres fulls');
  let k = -1, C, D, busy, res = null;
  function arm() {
    k++; C = cs[k]; D = CLAIMS[C.kind](C); busy = false; openAt = performance.now() + SETTLE;
    dots.forEach((d, j) => d.classList.toggle('cur', j === k));
    stage.innerHTML = `${D.pic}<p class="ask claim">${D.txt}</p>`;
    tail.innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">No és correcte</button></div>`;
    say('Mira-ho bé: és veritat?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; dots[k].classList.add(ok ? 'ok' : 'late');
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of tail.querySelectorAll('button')) b.disabled = true;
    if (ok) { say(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); }
    else { say(said, 'oops'); buzz(); }
    await sleep(ok ? 1200 : 2600); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`el ${i + 1} (${CLAIMS[c.kind](c).truth})`] : []);
    stage.innerHTML = tail.innerHTML = '';
    r.good ? chime([523, 659, 784, 1047, 1319]) : click(196, 0, 0.5, 0.12, 'triangle');
    say(r.good ? 'Full perfecte!' : 'Full acabat.', r.good ? 'go' : '');
    panel(stage, `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar els tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${list(bad)}.` : 'Tots tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre full</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  tail.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era: ${D.truth}.` : 'Sí, era correcte!');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: ${D.truth}.`);
      openAt = performance.now() + SETTLE;
      tail.innerHTML = `<div class="opts">${C.opts.map(v => `<button class="btn soft" data-v="${v}">${D.val(v)}</button>`).join('')}</div>`;
      say('Ben vist! Ara tria el valor bo.', 'go');
    }
    else if ('v' in b.dataset) { const ok = +b.dataset.v === C.real; answer(ok, ok ? `Arreglat: ${D.truth}.` : `No era aquest: ${D.truth}.`); }
  };
  arm();
}

/* ---------- the lightning round: a minute of quick questions, one try each; the best count is kept ---------- */
function llampec() {
  const t = fresh(); show('Repte llampec', true, 48);
  $('#game').innerHTML = `<div class="intro"><h2>⚡ Repte llampec</h2><p class="lead">${RAPID} segons de preguntes ràpides de geometria, un sol intent per a cada una. Quantes n'encertaràs?</p>
    ${prog.rapid ? `<p class="lead go">El teu rècord: ${prog.rapid}</p>` : ''}<button class="btn" id="go">Som-hi!</button></div>`;
  $('#go').onclick = () => {
    if (!t.on) return;
    $('#game').innerHTML = `<div class="hud"><span class="chip" id="hits">0 encerts</span><span class="clockbar" role="img" aria-label="Temps"><i id="left"></i></span></div><div class="stage" id="stage"><p class="ask big" id="q"></p><div class="opts" id="ans"></div></div>`;
    const end = performance.now() + RAPID * 1000;
    let hits = 0, Q, over = false;
    const arm = () => { Q = quick(Math.random); $('#q').innerHTML = Q.q; $('#ans').innerHTML = Q.opts.map(v => `<button class="btn soft" data-v="${v}">${v}</button>`).join(''); };
    const tick = () => {
      if (!t.on || over) return;
      const left = end - performance.now();
      $('#left').style.width = Math.max(0, left / (RAPID * 10)) + '%';
      if (left > 0) return void setTimeout(tick, 100);
      over = true;
      const r = rapidIn(prog, hits); prog = r.prog; save();
      chime([523, 659, 784, 1047, 1319]); if (r.best) FX.celebrate(16);
      $('#ans').innerHTML = ''; $('#q').innerHTML = '';
      panel($('#stage'), `<h2>Temps!</h2><p class="line">${hits} ${hits === 1 ? 'encert' : 'encerts'}</p><p class="lead${r.best ? ' go' : ''}">${r.best ? 'Rècord nou!' : `El teu rècord: ${prog.rapid}`}</p>${news(r.news)}
        <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Torna-hi</button>`);
      $('#bk').onclick = () => mapa(); $('#rp').onclick = () => llampec();
    };
    $('#ans').onclick = e => {
      const b = e.target.closest('button'); if (!b || over) return;
      if (+b.dataset.v === Q.want) { hits++; $('#hits').textContent = `${hits} ${hits === 1 ? 'encert' : 'encerts'}`; click(660 * 2 ** (Math.min(hits, 12) / 12), 0, 0.14, 0.08); spark($('#hits')); }
      else { buzz(); again($('#q')).add('shake'); }
      arm();
    };
    arm(); tick();
  };
}

/* ---------- questions over a drawing: one, or several that lean on each other ---------- */
// what each kind of drawing shows
const PIC = {
  flag: P => flag(P.id),
  shape: P => shapeSvg(P.id, 150, P.lab),
  rect: P => rectPic(P),
  cells: P => cellsPic(P.rows),
  tri: P => triPic(P),
  angle: P => `<div class="angw still">${angleSvg(P.deg)}</div>`,
  clock: P => clockPic(P.h),
  spin: P => spinPic(P.frac),
  compass: () => COMPASS,
  map: P => mapHtml(P.M),
  solid: P => `<svg class="solid live" id="sol" viewBox="-110 -110 220 220" style="width:220px" role="img" aria-label="${SOLIDS[P.id].name}">${solidInner(P.id, 0.6, 0.42)}</svg><p class="cap">${SOLIDS[P.id].name} · com ${SOLIDS[P.id].like}</p>`,
  cubes: P => cubesSvg(P.h),
  text: P => `<div class="tbox"><b class="huge">${P.html}</b><p class="cap">${P.cap}</p></div>`
};
const KEYS = `<div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k => `<button class="key${k > -1 ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
function ask({ t, L, stage, tip, slip, win }) {
  const notes = [];
  let k = -1, S, buf = '', busy = false;
  stage.innerHTML = `${PIC[L.pic.t](L.pic)}<ol class="notes" id="notes"></ol><p class="ask" id="q"></p><div class="ans" id="ans"></div>`;
  if (L.pic.t === 'solid') mountSolid($('#sol'), L.pic.id, t);
  const val = v => `${v}${S.unit ? (S.unit === '°' ? '' : ' ') + S.unit : ''}`;
  const type = () => { $('#num').textContent = buf || '?'; };
  function arm() {
    k++; S = L.steps[k]; buf = ''; busy = false; openAt = performance.now() + SETTLE;
    $('#q').innerHTML = `${L.steps.length > 1 ? `<small>Pas ${k + 1} de ${L.steps.length}</small>` : ''}${S.q}`;
    $('#ans').innerHTML = S.opts ? `<div class="opts">${S.opts.map(v => S.as ? optBtn(v, S.as) : `<button class="btn soft" data-v="${v}">${val(v)}</button>`).join('')}</div>`
      : `<div class="disp"><b id="num">?</b>${S.unit ? `<span>${S.unit}</span>` : ''}</div>${KEYS}`;
  }
  async function answer(v, btn) {
    if (busy || !t.on) return;
    if (v !== String(S.want)) { slip(); if (btn) btn.disabled = true; else { buf = ''; type(); again($('.disp')).add('shake'); } return tip(`Ui! ${S.as ? 'Aquest no és.' : `${val(v)} no és.`} ${S.how}`, 'oops'); }
    busy = true; notes.push(S.done); $('#notes').innerHTML = notes.map(n => `<li>${n}</li>`).join(''); spark($('#notes').lastChild, 48);
    const last = k === L.steps.length - 1;
    tip(`${last ? 'Correcte!' : 'Molt bé!'} ${S.done}.`, 'go');
    if (!last) { chime([659, 784], 0.1); await sleep(900); if (t.on) arm(); return; }
    $('#ans').innerHTML = ''; $('#q').innerHTML = '';
    await sleep(1500); if (!t.on) return;
    win(`${S.done}${notes.length > 1 ? `<br><small>${notes.slice(0, -1).join('<br>')}</small>` : ''}`);
  }
  const press = key => {
    if (busy || S.opts) return;
    if (key === 'del') buf = buf.slice(0, -1); else if (key === 'ok') { if (buf) answer(String(+buf)); return; } else if (buf.length < 4) buf = buf === '0' ? key : buf + key;
    blip(); type();
  };
  $('#ans').onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || e.timeStamp < openAt) return;
    if ('v' in b.dataset) answer(b.dataset.v, b); else press(b.dataset.k);
  };
  keyFn = e => { const key = e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'del' : /^\d$/.test(e.key) ? e.key : null; if (key) { e.preventDefault(); press(key); } };
  arm(); tip(L.say);
  return () => busy ? '' : S.how;
}

/* ---------- the board of pegs: touch pegs to stretch the band round them, and the first one again to close it ---------- */
function geo({ t, L, stage, tip, slip, win }) {
  const N = PEGS, G = 44, at = i => [i % N, Math.floor(i / N)], px = v => 22 + v * G;
  let path = [], closed = false, busy = false;
  stage.innerHTML = `<p class="ask">${L.ask}</p><svg class="geob" id="gb" viewBox="0 0 ${px(N - 1) + 22} ${px(N - 1) + 22}" role="group" aria-label="Geoplà"></svg>
    <p class="cap" id="cnt">&nbsp;</p><div class="opts"><button class="btn" id="ok" disabled>Comprova</button><button class="btn soft" id="clr">Esborra</button></div>`;
  const draw = () => {
    const pts = path.map(i => at(i).map(px).join(',')).join(' ');
    $('#gb').innerHTML = `<path class="gl" d="${Array.from({ length: N }, (_, i) => `M${px(i)} ${px(0)}V${px(N - 1)}M${px(0)} ${px(i)}H${px(N - 1)}`).join('')}"/>
      ${closed ? `<polygon class="band shut" points="${pts}"/>` : `<polyline class="band" points="${pts}"/>`}
      ${Array.from({ length: N * N }, (_, i) => { const [x, y] = at(i).map(px); return `<g class="peg${path.includes(i) ? ' on' : ''}${path[0] === i && !closed && path.length > 2 ? ' first' : ''}" data-p="${i}" tabindex="0" role="button" aria-label="Clau ${i % N + 1}, ${Math.floor(i / N) + 1}"><circle class="hit" cx="${x}" cy="${y}" r="21"/><circle class="pin" cx="${x}" cy="${y}" r="7"/></g>`; }).join('')}`;
    $('#ok').disabled = !closed;
    $('#cnt').innerHTML = closed ? 'Figura tancada. Prem «Comprova».' : path.length > 2 ? 'Torna a tocar el <b>primer clau</b> per tancar la figura.' : path.length ? 'Segueix tocant claus.' : '&nbsp;';
  };
  const tap = i => {
    if (busy || closed) return;
    if (i === path[0] && path.length > 2) { closed = true; blip(880); }
    else if (!path.includes(i)) { path.push(i); blip(440 + path.length * 40); }
    else return;
    draw();
  };
  $('#gb').onclick = e => { const g = e.target.closest('.peg'); if (g) tap(+g.dataset.p); };
  $('#gb').onkeydown = e => { const g = e.target.closest('.peg'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tap(+g.dataset.p); $(`#gb [data-p="${g.dataset.p}"]`)?.focus(); } };
  $('#clr').onclick = () => { if (!busy) { path = []; closed = false; blip(330); draw(); } };
  $('#ok').onclick = async () => {
    if (busy || !closed || !t.on) return;
    const P = poly(path.map(at)), why = geoOk(L.want, P);
    if (why) { slip(); again($('#gb')).add('shake'); path = []; closed = false; tip(`Ui! ${why}`, 'oops'); return setTimeout(() => { if (t.on) draw(); }, 500); }
    busy = true; $('#gb').classList.add('won'); spark($('#gb'));
    const line = `${NAMES[P.name][0].toUpperCase() + NAMES[P.name].slice(1)}: ${P.n} costats`;
    tip(`Sí! ${line}${P.right ? `, ${P.right} ${P.right > 1 ? 'angles rectes' : 'angle recte'}` : ''} i ${String(P.area).replace('.', ',')} d'àrea.`, 'go');
    await sleep(1900); if (!t.on) return;
    win(`${line}<br><small>${String(P.area).replace('.', ',')} quadrets d'àrea</small>`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : L.how;
}

/* ---------- squares to paint: a figure with an area and a perimeter, the other half of a mirror, or a model made bigger ---------- */
function paint({ t, L, stage, tip, slip, win }) {
  const on = new Set(), W = L.want;
  let busy = false, mode = null;
  stage.innerHTML = `<p class="ask">${L.ask}</p><div class="pgrid" id="pg" style="--w:${L.w}">${Array.from({ length: L.w * L.h }, (_, i) => `<button class="pc${L.given.includes(i) ? ' given' : ''}" data-c="${i}"${L.given.includes(i) ? ' disabled' : ` aria-label="Quadret ${i % L.w + 1}, ${Math.floor(i / L.w) + 1}" aria-pressed="false"`}></button>`).join('')}
    ${W.mirror ? [...W.mirror].map(a => `<i class="axis ${a}"></i>`).join('') : ''}</div><p class="cap" id="cnt">&nbsp;</p>
    <div class="opts"><button class="btn" id="ok">Comprova</button><button class="btn soft" id="clr">Esborra</button></div>`;
  const cells = [...stage.querySelectorAll('.pc')];
  const set = (i, v) => {
    if (busy || L.given.includes(i) || on.has(i) === v) return;
    v ? on.add(i) : on.delete(i); cells[i].classList.toggle('on', v); cells[i].setAttribute('aria-pressed', v); blip(v ? 520 + on.size * 12 : 330);
    $('#cnt').innerHTML = on.size ? `Has pintat <b>${on.size}</b> ${on.size === 1 ? 'quadret' : 'quadrets'}.` : '&nbsp;';
  };
  // a finger that slides over the squares paints them all: the first one it touches says whether it paints or rubs out
  const under = e => document.elementFromPoint(e.clientX, e.clientY)?.closest?.('#pg .pc');
  $('#pg').onpointerdown = e => { const b = under(e); if (!b) return; mode = !on.has(+b.dataset.c); set(+b.dataset.c, mode); };
  $('#pg').onpointermove = e => { if (mode === null) return; const b = under(e); if (b) set(+b.dataset.c, mode); };
  $('#pg').onpointerup = $('#pg').onpointercancel = $('#pg').onpointerleave = () => { mode = null; };
  // a key press has no pointer before it
  $('#pg').onclick = e => { const b = e.target.closest('.pc'); if (b && e.detail === 0) set(+b.dataset.c, !on.has(+b.dataset.c)); };
  $('#clr').onclick = () => { if (!busy) { [...on].forEach(i => set(i, false)); } };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    const mine = [...on].sort((a, b) => a - b), why = paintOk(L, mine);
    if (why) { slip(); again($('#pg')).add('shake'); return tip(`Ui! ${why}`, 'oops'); }
    busy = true; $('#pg').classList.add('won'); spark($('#pg'));
    const line = W.mirror ? 'Simetria perfecta' : W.scale ? `Escala ${W.scale}: de ${L.given.length} a ${mine.length} quadrets` : `Àrea ${mine.length}${W.perim ? ` · perímetre ${W.perim}` : ''}`;
    tip(W.mirror ? 'Perfecte! Si pleguessis el full pel mirall, les dues meitats coincidirien.' : W.scale ? `Molt bé! Costats ${W.scale} cops més llargs, i l'àrea ${W.scale ** 2} cops més gran: de ${L.given.length} a ${mine.length} quadrets.` : `Molt bé! ${line}.`, 'go');
    await sleep(1900); if (!t.on) return;
    win(line);
  };
  tip(L.say);
  return () => busy ? '' : L.how;
}

/* ---------- an angle to open: drag the rod or use the arrows, in steps of 15 degrees ---------- */
function turn({ t, L, stage, tip, slip, win }) {
  let deg = 0, busy = false, drag = false;
  stage.innerHTML = `<p class="ask">${L.ask}</p><div class="angw" id="aw"></div>${L.show ? '<p class="read" id="rd"></p>' : ''}
    <div class="opts"><button class="btn soft" data-d="-15" aria-label="Tanca 15 graus">↻ Tanca</button><button class="btn soft" data-d="15" aria-label="Obre 15 graus">↺ Obre</button></div><button class="btn" id="ok">Comprova</button>`;
  const draw = () => { $('#aw').innerHTML = angleSvg(deg, L.show, true); if (L.show) $('#rd').textContent = `${deg}°`; };
  const set = v => { v = Math.min(360, Math.max(0, v)); if (v === deg || busy) return; deg = v; blip(330 + deg); draw(); };
  stage.querySelector('.opts').onclick = e => { const b = e.target.closest('[data-d]'); if (b) set(deg + +b.dataset.d); };
  const point = e => { const r = $('#aw').getBoundingClientRect(), a = Math.atan2(r.top + r.height / 2 - e.clientY, e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; set(Math.round(((a + 360) % 360) / 15) * 15); };
  $('#aw').onpointerdown = e => { drag = true; $('#aw').setPointerCapture(e.pointerId); point(e); };
  $('#aw').onpointermove = e => { if (drag) point(e); };
  $('#aw').onpointerup = $('#aw').onpointercancel = () => { drag = false; };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    if (deg !== L.want) { slip(); again($('#aw')).add('shake'); return tip(`Ui! ${L.show ? `Has fet ${deg}°. ` : ''}${deg < L.want ? 'Encara és massa tancat: obre\'l més.' : 'L\'has obert massa: tanca\'l una mica.'}`, 'oops'); }
    busy = true; $('#aw').classList.add('won'); spark($('#aw'));
    tip(`Clavat! Són ${L.want}°.`, 'go');
    await sleep(1600); if (!t.on) return;
    win(`${L.want}°<br><small>${L.want === 90 ? 'un angle recte' : L.want === 180 ? 'mitja volta: un angle pla' : L.want === 45 ? 'mig angle recte' : 'ben obert'}</small>`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : L.how;
}

/* ---------- a square of the map to find: touching one only picks it, the button under it answers ---------- */
function spot({ t, L, stage, tip, slip, win }) {
  let sel = null, busy = false;
  stage.innerHTML = `<p class="ask">${L.ask}</p><div id="mp"></div><button class="btn" id="ok" disabled>És aquí!</button>`;
  const draw = () => { $('#mp').innerHTML = mapHtml(L.M, { tap: true, sel, frog: L.start }); };
  $('#mp').onclick = e => { const b = e.target.closest('.mc'); if (!b || busy) return; sel = b.dataset.c; blip(440 + xy(sel)[1] * 60); draw(); $('#ok').disabled = false; };
  $('#ok').onclick = async () => {
    if (busy || !sel || !t.on) return;
    if (sel !== L.want) { slip(); again($('#mp')).add('shake'); return tip(`Ui! Has tocat ${sel}, i no és aquesta. Primer la lletra de la columna, després el número de la fila.`, 'oops'); }
    busy = true; $(`#mp [data-c="${sel}"]`).classList.add('won'); spark($(`#mp [data-c="${sel}"]`));
    tip(`Sí! És la casella ${L.want}.`, 'go');
    await sleep(1500); if (!t.on) return;
    win(`Casella ${L.want}<br><small>columna ${L.want[0]}, fila ${L.want.slice(1)}</small>`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : L.how;
}

/* ---------- a walk to the flag: north, south, east and west, or forward and the two turns; each square walked is a step ---------- */
function walk({ t, L, stage, tip, slip, win }) {
  let pos, dir, used, busy = false;
  const keys = L.rel ? [['L', '↺ Gira'], ['F', '▲ Avança'], ['R', 'Gira ↻']] : [['O', '← Oest'], ['N', '↑ Nord'], ['S', '↓ Sud'], ['E', 'Est →']];
  stage.innerHTML = `<p class="ask">Porta la granota fins a la bandera amb <b>${L.steps} passos</b>.</p><div id="mp"></div><p class="read sm" id="rd"></p>
    <div class="opts pads">${keys.map(([k, s]) => `<button class="btn soft" data-k="${k}">${s}</button>`).join('')}</div><button class="link" id="clr">Torna a començar</button>`;
  const draw = () => { $('#mp').innerHTML = mapHtml(L.M, { frog: pos, goal: L.goal, dir: L.rel ? dir : '' }); $('#rd').textContent = `Passos: ${used} de ${L.steps}`; };
  const reset = () => { pos = L.start; dir = L.dir; used = 0; draw(); };
  async function go(k) {
    if (busy || !t.on) return;
    if (k === 'L' || k === 'R') { dir = TURN[(TURN.indexOf(dir) + (k === 'R' ? 1 : 3)) % 4]; blip(520); return draw(); }
    const d = k === 'F' ? dir : k, [x, y] = xy(pos), to = cellAt(x + DIRS[d][0], y + DIRS[d][1]);
    if (x + DIRS[d][0] < 0 || y + DIRS[d][1] < 0 || !free(L.M, to)) { click(180, 0, 0.12, 0.1, 'triangle'); return again($('#mp')).add('shake'); }
    pos = to; used++; blip(440 + used * 30); draw();
    if (pos === L.goal) {
      busy = true; spark($('#mp .here')); tip(`Has arribat! ${used} passos.`, 'go');
      await sleep(1500); if (!t.on) return;
      return win(`De ${L.start} a ${L.goal}<br><small>${used} passos</small>`);
    }
    if (used >= L.steps) { busy = true; slip(); tip(`Ui! S'han acabat els ${L.steps} passos i encara no hi ets. Busca un camí més curt.`, 'oops'); await sleep(1300); if (!t.on) return; busy = false; reset(); }
  }
  stage.querySelector('.pads').onclick = e => { const b = e.target.closest('[data-k]'); if (b) go(b.dataset.k); };
  $('#clr').onclick = () => { if (!busy) reset(); };
  keyFn = e => { const k = { ArrowUp: L.rel ? 'F' : 'N', ArrowDown: L.rel ? '' : 'S', ArrowLeft: L.rel ? 'L' : 'O', ArrowRight: L.rel ? 'R' : 'E' }[e.key]; if (k) { e.preventDefault(); go(k); } };
  reset(); tip(L.say);
  return () => busy ? '' : `El camí més curt fa ${L.steps} passos${L.M.water ? ', fent la volta a l\'aigua' : ''}. ${L.rel ? 'La fletxa diu cap on mira la granota: gira-la primer cap on vols anar. Girar no gasta passos.' : `La bandera és a ${L.goal}: compta quantes columnes i quantes files et falten.`}`;
}

/* ---------- cubes to pile up: each square of the floor is a tower, and a touch adds a cube to it ---------- */
function build({ t, L, stage, tip, slip, win }) {
  const n = L.n, MAX = 3, h = Array.from({ length: n }, () => Array(n).fill(0)), W = L.want;
  let busy = false;
  const fig = (svg, cap) => `<figure>${svg}<figcaption>${cap}</figcaption></figure>`;
  stage.innerHTML = `<p class="ask">${L.ask}</p>
    ${L.model ? `<div class="views">${fig(cubesSvg(L.model, 150), 'el model')}</div>` : W.front ? `<div class="views">${fig(viewSvg(W.front, 20), 'de davant')}${W.side ? fig(viewSvg(W.side, 20), 'de costat') : ''}</div>` : ''}
    <div class="row"><div id="iso"></div><div class="side"><div class="pad" id="pad" style="--w:${n}">${Array.from({ length: n * n }, (_, i) => `<button class="key" data-i="${i}" aria-label="Torre de la fila ${Math.floor(i / n) + 1}, columna ${i % n + 1}">0</button>`).join('')}</div><small>el terra, vist des de dalt<br>(el davant és a baix)</small></div></div>
    <p class="cap" id="cnt">&nbsp;</p><div class="opts"><button class="btn" id="ok">Comprova</button><button class="btn soft" id="clr">Buida</button></div>`;
  const pads = [...stage.querySelectorAll('#pad .key')];
  const draw = () => {
    $('#iso').innerHTML = cubesSvg(h);
    pads.forEach((b, i) => { const v = h[Math.floor(i / n)][i % n]; b.textContent = v; b.classList.toggle('on', v > 0); });
    const c = views(h).count; $('#cnt').innerHTML = c ? `Hi ha <b>${c}</b> ${c === 1 ? 'cub' : 'cubs'}.` : 'Toca una casella del terra per posar-hi un cub.';
  };
  $('#pad').onclick = e => {
    const b = e.target.closest('.key'); if (!b || busy) return;
    const i = +b.dataset.i, y = Math.floor(i / n), x = i % n;
    h[y][x] = (h[y][x] + 1) % (MAX + 1); blip(h[y][x] ? 440 + h[y][x] * 90 : 300); draw();
  };
  $('#clr').onclick = () => { if (!busy) { h.forEach(r => r.fill(0)); blip(330); draw(); } };
  $('#ok').onclick = async () => {
    if (busy || !t.on) return;
    const why = buildOk(W, h);
    if (why) { slip(); again($('#iso')).add('shake'); return tip(`Ui! ${why}`, 'oops'); }
    busy = true; $('#iso').classList.add('won'); spark($('#iso'));
    const c = views(h).count;
    tip(`Ben construït! Has fet servir ${c} cubs.`, 'go');
    await sleep(1800); if (!t.on) return;
    win(`${c} cubs${W.box ? `<br><small>${W.box.join(' × ')} = ${c}</small>` : ''}`);
  };
  draw(); tip(L.say);
  return () => busy ? '' : L.how;
}

soBtn(); paintXp();
prog.piscina ? mapa() : piscina();
