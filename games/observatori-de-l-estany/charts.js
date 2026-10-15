// The charts of the observatory, drawn with D3 (https://d3js.org) as SVG inside the page, in the colours of the pond.
//   draw(el, chart)      a chart to read: a table, bars (standing or lying), a pie, a line, a Gantt chart, a Venn diagram, a dot plot or
//                        two charts side by side. What can be tapped (a row, a bar, a slice, a point, a thing) carries data-k, the key
//                        the questions of logic.js answer with; mark(el, k, cls) lights one up.
//   builders             charts the child makes with a finger: buildBars, buildLine, buildPie, buildVenn, buildGantt, buildBalance.
//                        Each gives back { value() } (what is made so far, in the shape logic.js checks) and { mark(bad) }.
// A finger drags; a tap puts; the arrows of a keyboard move what has the focus. Vite puts D3 only in this game's page.
import { select, scaleLinear, scaleBand, scalePoint, pie as d3pie, arc as d3arc, line as d3line, curveMonotoneX, drag, pointer, interpolate, easeCubicOut, easeBackOut } from 'd3';
import { RM } from '../../shared/util.js';
import { SETS, VENNS, GANTTS, STATS, num, cap, regionOf, lenOf } from './logic.js';

// the colours of the things of a chart, one each, bright on the night of the pond
export const PAL = ['#6FE3FF', '#F7C64E', '#7CF5B0', '#FF8FD0', '#B79CFF', '#FF9F5A', '#C9D6DB', '#FF6B5E'];
const NIGHT = '#04131C', INK = '#EAF8F4', MUTED = '#9EC3C0', GRID = 'rgb(160 230 220 / 0.16)', SUN = '#F7C64E';
const ms = t => RM ? 0 : t;
const ALL = n => Array.from({ length: n }, (_, i) => i);
const hueOf = C => `hsl(${C.hue} 80% 64%)`;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
// a name of two words on two lines under a bar or a point
const lines = (sel, s, x, y, size) => { const ws = s.split(' '), half = ws.length > 1 ? Math.ceil(ws.length / 2) : 1;
  [ws.slice(0, half).join(' '), ws.slice(half).join(' ')].filter(Boolean).forEach((t, k) => sel.append('text').attr('x', x).attr('y', y + k * (size + 1)).attr('class', 'lab').attr('font-size', size).text(t)); };

// a figure with its title and an svg of w × h in its own units; the svg grows with the width of the page
function figure(el, title, w, h, cls = '') {
  const fig = select(el).append('figure').attr('class', 'chart ' + cls);
  if (title) fig.append('figcaption').text(title);
  return fig.append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('role', 'group').attr('aria-label', title || 'Gràfic');
}
// what can be tapped: a group that is a button for the finger, the keyboard and a screen reader
const hit = (g, k, label) => g.attr('class', 'hit').attr('data-k', k).attr('tabindex', 0).attr('role', 'button').attr('aria-label', label);

/* ---------- charts to read ---------- */
export function draw(el, ch) {
  el.innerHTML = '';
  if (!ch) return;
  if (ch.type === 'pair') {
    const box = select(el).append('div').attr('class', 'pair');
    for (const [k, sub] of [['a', ch.a], ['b', ch.b]]) {
      const half = box.append('div').attr('class', 'half hit').attr('data-k', k).attr('tabindex', 0).attr('role', 'button').attr('aria-label', `Gràfic ${k.toUpperCase()}`);
      half.append('p').attr('class', 'tag').text(`Gràfic ${k.toUpperCase()}`);
      KIND[sub.type](half.node(), { ...sub, small: true, noHit: true });
    }
    return;
  }
  KIND[ch.type](el, ch);
}
export const mark = (el, k, cls) => el.querySelectorAll(`[data-k="${k}"]`).forEach(e => { e.classList.remove('ok', 'no', 'pulse'); void e.getBoundingClientRect(); e.classList.add(cls); });

function table(el, ch) {
  const S = SETS[ch.set], rows = ch.rows || ALL(S.rows.length), cols = ch.cols || ALL(S.cols.length);
  const unit = cols.length === 1 && S.cols[cols[0]].unit ? ` (${S.cols[cols[0]].unit})` : '';
  el.insertAdjacentHTML('beforeend', `<figure class="chart tbl${ch.small ? ' small' : ''}"><figcaption>${S.title}${unit}</figcaption><div class="scroll"><table>
    <thead><tr><th scope="col">${cap(S.who)}</th>${cols.map(c => `<th scope="col" style="--h:${S.cols[c].hue}">${S.cols[c].name}${S.cols[c].unit && cols.length > 1 && S.cols[c].unit.length < 6 ? ` <small>(${S.cols[c].unit})</small>` : ''}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((i, n) => { const r = S.rows[i];
      return `<tr${ch.noHit ? '' : ` class="hit" data-k="${i}" tabindex="0" role="button" aria-label="${r.n}"`} style="--d:${n * 60}ms"><th scope="row"><span class="ic">${r.i}</span>${r.n}</th>${cols.map(c => `<td>${num(r.v[c])}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div></figure>`);
}

// the value axis of a chart: its grid lines and their numbers, and a faint line for every unit when there are few
function axis(svg, y, hor, [a, b], from, top) {
  const g = svg.append('g').attr('class', 'grid');
  const span = top - from, minor = span <= 20 ? 1 : 0;
  if (minor) for (let v = from; v <= top; v += minor) hor ? g.append('line').attr('x1', y(v)).attr('x2', y(v)).attr('y1', a).attr('y2', b).attr('class', 'minor')
    : g.append('line').attr('y1', y(v)).attr('y2', y(v)).attr('x1', a).attr('x2', b).attr('class', 'minor');
  for (const v of y.ticks(span <= 6 ? span : 5)) {
    if (hor) { g.append('line').attr('x1', y(v)).attr('x2', y(v)).attr('y1', a).attr('y2', b); g.append('text').attr('x', y(v)).attr('y', b + 14).attr('class', 'num').attr('text-anchor', 'middle').text(num(v)); }
    else { g.append('line').attr('y1', y(v)).attr('y2', y(v)).attr('x1', a).attr('x2', b); g.append('text').attr('x', a - 6).attr('y', y(v) + 4).attr('class', 'num').attr('text-anchor', 'end').text(num(v)); }
  }
  // an axis that does not start at zero says so with a zigzag at its foot: the detective's clue
  if (from) { const p = hor ? `M${y(from) - 4} ${b + 1}l4 -5l4 5` : `M${a - 2} ${y(from) + 6}l-6 -3l6 -3l-6 -3`; g.append('path').attr('d', p).attr('class', 'zig'); }
}
const topOf = (from, hi) => scaleLinear().domain([from, hi]).nice().domain()[1];

function bars(el, ch) {
  const S = SETS[ch.set], c = ch.c || 0, C = S.cols[c], rows = ch.rows || ALL(S.rows.length), hor = ch.type === 'hbars';
  const vals = rows.map(i => S.rows[i].v[c]), from = ch.from || 0, top = topOf(from, Math.max(...vals));
  const w = 360, h = hor ? 34 + rows.length * 30 : (ch.small ? 220 : 240);
  const tilt = !hor && rows.length > 6, m = hor ? { l: 124, r: 30, t: 6, b: 24 } : { l: 46, r: 8, t: 14, b: tilt ? 70 : 50 };
  const svg = figure(el, ch.small ? '' : S.title, w, tilt ? h + 20 : h, ch.small ? 'small' : '');
  const H = tilt ? h + 20 : h;
  const y = scaleLinear().domain([from, top]).range(hor ? [m.l, w - m.r] : [H - m.b, m.t]);
  const x = scaleBand().domain(rows).range(hor ? [m.t, h - m.b] : [m.l, w - m.r]).padding(0.28);
  axis(svg, y, hor, hor ? [m.t, h - m.b] : [m.l, w - m.r], from, top);
  rows.forEach((i, n) => {
    const r = S.rows[i], v = r.v[c], g = svg.append('g');
    if (!ch.noHit) hit(g, i, `${r.n}: ${num(v)}`);
    const end = y(Math.max(from, v)), base = y(from);
    if (hor) {
      g.append('rect').attr('class', 'pad').attr('x', 0).attr('y', x(i) - 4).attr('width', w).attr('height', x.bandwidth() + 8);
      const b = g.append('rect').attr('class', 'bar').attr('x', base).attr('y', x(i)).attr('height', x.bandwidth()).attr('rx', 4).attr('fill', hueOf(C)).attr('width', 0);
      b.transition().delay(ms(n * 70)).duration(ms(600)).ease(easeCubicOut).attr('width', end - base);
      g.append('text').attr('class', 'lab').attr('x', m.l - 6).attr('y', x(i) + x.bandwidth() / 2 + 4).attr('text-anchor', 'end').text(`${r.i} ${r.n}`);
      if (ch.labels) g.append('text').attr('class', 'val').attr('x', end + 4).attr('y', x(i) + x.bandwidth() / 2 + 4).text(num(v));
    } else {
      g.append('rect').attr('class', 'pad').attr('x', x(i) - 4).attr('y', 0).attr('width', x.bandwidth() + 8).attr('height', H);
      const b = g.append('rect').attr('class', 'bar').attr('x', x(i)).attr('width', x.bandwidth()).attr('rx', 4).attr('fill', hueOf(C)).attr('y', base).attr('height', 0);
      b.transition().delay(ms(n * 70)).duration(ms(600)).ease(easeCubicOut).attr('y', end).attr('height', base - end);
      g.append('text').attr('class', 'ic').attr('x', x(i) + x.bandwidth() / 2).attr('y', H - m.b + 18).text(r.i);
      if (tilt) g.append('text').attr('class', 'lab').attr('font-size', 10).attr('text-anchor', 'end').attr('transform', `translate(${x(i) + x.bandwidth() / 2 + 3},${H - m.b + 28}) rotate(-38)`).text(r.n);
      else lines(g, r.n, x(i) + x.bandwidth() / 2, H - m.b + 32, 10);
      if (ch.labels) g.append('text').attr('class', 'val').attr('x', x(i) + x.bandwidth() / 2).attr('y', end - 4).text(num(v));
    }
  });
  svg.append('line').attr('class', 'base').call(l => hor ? l.attr('x1', m.l).attr('x2', m.l).attr('y1', m.t).attr('y2', h - m.b) : l.attr('x1', m.l).attr('x2', w - m.r).attr('y1', H - m.b).attr('y2', H - m.b));
}

function pieChart(el, ch) {
  const S = SETS[ch.set], c = ch.c || 0, rows = ch.rows || ALL(S.rows.length), w = ch.small ? 220 : 360, h = ch.small ? 250 : 220;
  const svg = figure(el, ch.small ? '' : S.title, w, h, ch.small ? 'small' : '');
  const cx = ch.small ? 110 : 108, cy = ch.small ? 92 : 110, R = ch.small ? 84 : 98;
  const arcs = d3pie().sort(null).value(i => S.rows[i].v[c])(rows), arc = d3arc().innerRadius(0).outerRadius(R);
  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
  arcs.forEach((a, n) => {
    const i = rows[n], r = S.rows[i], s = g.append('g');
    if (!ch.noHit) hit(s, i, `${r.n}: ${num(r.v[c])}${S.pct ? ' %' : ''}`);
    s.append('path').attr('class', 'slice').attr('fill', PAL[n % PAL.length]).attr('stroke', NIGHT).attr('stroke-width', 2)
      .transition().duration(ms(900)).ease(easeCubicOut).attrTween('d', () => t => arc({ ...a, startAngle: a.startAngle * t, endAngle: a.endAngle * t }));
    if (a.endAngle - a.startAngle > 0.32) { const [px, py] = d3arc().innerRadius(R * 0.58).outerRadius(R * 0.58).centroid(a);
      s.append('text').attr('class', 'in').attr('x', px).attr('y', py + 5).text(`${num(r.v[c])}${S.pct ? '%' : ''}`).attr('opacity', 0).transition().delay(ms(700)).attr('opacity', 1); }
  });
  // the legend: also something to tap, for a slice that is small
  const lx = ch.small ? 8 : 222, ly = ch.small ? 188 : Math.max(8, cy - rows.length * 12);
  rows.forEach((i, n) => {
    const r = S.rows[i], s = svg.append('g'), yy = ch.small ? ly + Math.floor(n / 2) * 20 : ly + n * 24, xx = ch.small ? lx + (n % 2) * 106 : lx;
    if (!ch.noHit) hit(s, i, `${r.n}: ${num(r.v[c])}${S.pct ? ' %' : ''}`);
    s.append('rect').attr('class', 'pad').attr('x', xx - 2).attr('y', yy - 2).attr('width', ch.small ? 104 : 136).attr('height', 22);
    s.append('rect').attr('x', xx).attr('y', yy + 3).attr('width', 13).attr('height', 13).attr('rx', 3).attr('fill', PAL[n % PAL.length]);
    s.append('text').attr('class', 'leg').attr('x', xx + 18).attr('y', yy + 14).text(`${r.i} ${r.n}${ch.small ? ` ${r.v[c]}%` : ''}`);
  });
}

function lineChart(el, ch) {
  const S = SETS[ch.set], c = ch.c || 0, rows = ch.rows || ALL(S.rows.length), vals = rows.map(i => S.rows[i].v[c]);
  const w = 360, h = 240, m = { l: 46, r: 12, t: 14, b: 44 };
  const svg = figure(el, S.title, w, h), top = topOf(0, Math.max(...vals));
  const y = scaleLinear().domain([0, top]).range([h - m.b, m.t]), x = scalePoint().domain(rows).range([m.l, w - m.r]).padding(0.4);
  axis(svg, y, false, [m.l, w - m.r], 0, top);
  const path = svg.append('path').attr('class', 'ln').attr('d', d3line().x(i => x(i)).y(i => y(S.rows[i].v[c]))(rows));
  const L = path.node().getTotalLength?.() || 600;
  path.attr('stroke-dasharray', `${L} ${L}`).attr('stroke-dashoffset', L).transition().duration(ms(1100)).ease(easeCubicOut).attr('stroke-dashoffset', 0);
  rows.forEach((i, n) => {
    const r = S.rows[i], g = svg.append('g');
    hit(g, i, `${r.n}: ${num(r.v[c])}`);
    g.append('rect').attr('class', 'pad').attr('x', x(i) - x.step() / 2).attr('y', 0).attr('width', x.step()).attr('height', h);
    g.append('circle').attr('class', 'dot').attr('cx', x(i)).attr('cy', y(r.v[c])).attr('r', 0).transition().delay(ms(120 + n * 120)).duration(ms(300)).ease(easeBackOut).attr('r', 5.5);
    if (r.i) g.append('text').attr('class', 'ic').attr('x', x(i)).attr('y', h - m.b + 16).text(r.i);
    lines(g, r.n, x(i), h - m.b + (r.i ? 29 : 16), rows.length > 8 ? 9.5 : 9);
    if (ch.labels) g.append('text').attr('class', 'val').attr('x', x(i)).attr('y', y(r.v[c]) - 9).text(num(r.v[c]));
  });
}

// a Gantt chart: a lane for each task, its name over its bar, and the days across
function ganttFrame(el, G, title, tasks, days) {
  const w = 360, lane = 38, m = { l: 8, r: 8, t: 24 }, h = m.t + tasks.length * lane + 8;
  const svg = figure(el, title, w, h, 'gantt');
  const x = scaleBand().domain(ALL(days).map(d => d + 1)).range([m.l, w - m.r]).paddingInner(0.08);
  const g = svg.append('g').attr('class', 'grid');
  for (let d = 1; d <= days; d++) {
    g.append('rect').attr('x', x(d)).attr('y', m.t - 4).attr('width', x.bandwidth()).attr('height', h - m.t).attr('class', d % 2 ? 'col' : 'col alt');
    g.append('text').attr('x', x(d) + x.bandwidth() / 2).attr('y', 14).attr('class', 'num').attr('text-anchor', 'middle').text(d);
  }
  return { svg, x, lane, m, w, h };
}
function gantt(el, ch) {
  const G = GANTTS[ch.gantt], { svg, x, lane, m } = ganttFrame(el, G, G.title + ' (dia a dia)', G.tasks, G.days);
  G.tasks.forEach((T, n) => {
    const y0 = m.t + n * lane, g = svg.append('g'); hit(g, n, `${T.n}: del dia ${T.a} al ${T.b}`);
    g.append('rect').attr('class', 'pad').attr('x', 0).attr('y', y0).attr('width', 360).attr('height', lane);
    g.append('text').attr('class', 'lab').attr('x', m.l + 2).attr('y', y0 + 12).attr('text-anchor', 'start').text(`${T.i} ${T.n}`);
    g.append('rect').attr('class', 'bar').attr('x', x(T.a)).attr('y', y0 + 17).attr('height', 15).attr('rx', 6).attr('fill', PAL[n % PAL.length]).attr('width', 0)
      .transition().delay(ms(n * 90)).duration(ms(550)).ease(easeCubicOut).attr('width', x(T.b) + x.bandwidth() - x(T.a));
  });
}

/* ---------- the Venn diagrams ---------- */
// where the circles are for one, two or three groups, inside the box of everything (the universe)
const GEO = { 1: { h: 220, cs: [[180, 112]], r: 86 }, 2: { h: 230, cs: [[136, 118], [224, 118]], r: 88 }, 3: { h: 262, cs: [[180, 96], [136, 170], [224, 170]], r: 74 } };
const VCOL = [PAL[0], PAL[1], PAL[3]];
const maskAt = (geo, k, [px, py]) => geo.cs.slice(0, k).map(([cx, cy]) => Math.hypot(px - cx, py - cy) <= geo.r ? 1 : 0).join('');
// n places for the things of one region, spread out and away from the lines
function spots(geo, k, region, n) {
  const pts = [];
  for (let py = 20; py < geo.h - 26; py += 6) for (let px = 20; px < 340; px += 6) {
    if (maskAt(geo, k, [px, py]) !== region) continue;
    const edge = Math.min(...geo.cs.slice(0, k).map(([cx, cy]) => Math.abs(Math.hypot(px - cx, py - cy) - geo.r)), px - 6, 354 - px, py - 6, geo.h - 6 - py);
    if (edge >= 17) pts.push([px, py, edge]);
  }
  pts.sort((a, b) => b[2] - a[2]);
  for (const [dx, dy] of [[52, 40], [44, 36], [36, 30], [0, 0]]) {
    const got = [];
    for (const p of pts) { if (got.length === n) break; if (got.every(q => Math.abs(q[0] - p[0]) >= dx || Math.abs(q[1] - p[1]) >= dy)) got.push(p); }
    if (got.length === n) return got;
  }
  return Array.from({ length: n }, (_, j) => pts[j % Math.max(1, pts.length)] || [180, 110]);
}
function vennFrame(svg, G, k, geo) {
  svg.append('rect').attr('class', 'universe').attr('x', 4).attr('y', 4).attr('width', 352).attr('height', geo.h - 8).attr('rx', 18);
  geo.cs.slice(0, k).forEach(([cx, cy], j) => svg.append('circle').attr('class', 'set').attr('cx', cx).attr('cy', cy).attr('r', 0).attr('fill', VCOL[j]).attr('stroke', VCOL[j])
    .transition().delay(ms(j * 150)).duration(ms(500)).ease(easeBackOut).attr('r', geo.r));
  // the name of each group, outside its circle
  const at = k === 3 ? [[180, 16, 'middle'], [20, geo.h - 12, 'start'], [340, geo.h - 12, 'end']] : k === 2 ? [[64, 22, 'start'], [296, 22, 'end']] : [[180, 18, 'middle']];
  G.groups.slice(0, k).forEach((gr, j) => svg.append('text').attr('class', 'gname').attr('x', at[j][0]).attr('y', at[j][1]).attr('text-anchor', at[j][2]).attr('fill', VCOL[j]).text(gr.name));
}
const token = (g, it) => { g.append('circle').attr('class', 'tk').attr('r', 15); g.append('text').attr('class', 'tki').attr('y', 5).text(it.i); g.append('text').attr('class', 'tkn').attr('y', 26).text(it.n); };
function venn(el, ch) {
  const G = VENNS[ch.venn], k = ch.k || G.groups.length, geo = GEO[k], items = (ch.items || ALL(G.items.length)).map(i => G.items[i]);
  const svg = figure(el, G.title, 360, geo.h, 'venn');
  vennFrame(svg, G, k, geo);
  const by = {};
  items.forEach((it, j) => (by[regionOf(it.m, k)] ??= []).push(j));
  for (const [region, js] of Object.entries(by)) spots(geo, k, region, js.length).forEach(([px, py], n) => {
    const it = items[js[n]], g = svg.append('g').attr('transform', `translate(${px},${py})`);
    hit(g, js[n], it.n); token(g, it);
    g.attr('opacity', 0).transition().delay(ms(400 + js[n] * 60)).duration(ms(300)).attr('opacity', 1);
  });
}

// a dot plot: one dot for each number, piled up over its place on the line
function dots(el, ch) {
  const D = STATS[ch.stats], w = 360, h = 190, m = { l: 20, r: 20, b: 36 };
  const svg = figure(el, D.title, w, h);
  const x = scaleLinear().domain([D.lo, D.hi]).range([m.l, w - m.r]);
  svg.append('line').attr('class', 'base').attr('x1', m.l - 8).attr('x2', w - m.r + 8).attr('y1', h - m.b).attr('y2', h - m.b);
  for (let v = D.lo; v <= D.hi; v++) { svg.append('line').attr('class', 'tick').attr('x1', x(v)).attr('x2', x(v)).attr('y1', h - m.b).attr('y2', h - m.b + 6); svg.append('text').attr('class', 'num').attr('x', x(v)).attr('y', h - m.b + 20).attr('text-anchor', 'middle').text(v); }
  const pile = {};
  D.vals.forEach((v, n) => { const k = pile[v] = (pile[v] || 0) + 1;
    svg.append('circle').attr('class', 'dot big').attr('cx', x(v)).attr('cy', -10).attr('r', 9).style('fill', PAL[n % PAL.length])
      .transition().delay(ms(n * 110)).duration(ms(500)).ease(easeBackOut).attr('cy', h - m.b - 12 - (k - 1) * 20); });
  svg.append('text').attr('class', 'unit').attr('x', w - m.r + 8).attr('y', h - 4).attr('text-anchor', 'end').text(D.unit);
}
const KIND = { table, bars, hbars: bars, pie: pieChart, line: lineChart, gantt, venn, dots };

/* ---------- charts to build ---------- */
// The value axis of a builder, and a drag on a column that sets its value: the column follows the finger, snapped to step
function columns(svg, keys, x, y, hi, lo, step, set, label) {
  const cols = keys.map((key, k) => {
    const g = svg.append('g').attr('class', 'col').attr('data-k', k).attr('tabindex', 0).attr('role', 'slider').attr('aria-label', label(k))
      .attr('aria-valuemin', lo).attr('aria-valuemax', hi);
    g.append('rect').attr('class', 'pad').attr('x', x(key) - 6).attr('y', 0).attr('width', (x.bandwidth?.() || 0) + 12).attr('height', 9999);
    return g;
  });
  const at = (k, py) => set(k, clamp(lo + Math.round((y.invert(py) - lo) / step) * step, lo, hi));
  cols.forEach((g, k) => {
    g.call(drag().container(svg.node()).on('start drag', e => at(k, e.y)));
    g.on('keydown', e => { const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); set(k, null, d * step); } });
  });
  return cols;
}

// The bars of rows, from lo up to hi, every step: they start at nothing and the child drags each one up to its value
export function buildBars(el, { set: id, rows, c = 0, hi, step }, onMove) {
  const S = SETS[id], C = S.cols[c], w = 360, h = 250, m = { l: 46, r: 8, t: 14, b: 50 };
  const svg = figure(el, `Fes-lo tu: ${S.title}`, w, h, 'build');
  const y = scaleLinear().domain([0, hi]).range([h - m.b, m.t]), x = scaleBand().domain(rows).range([m.l, w - m.r]).padding(0.3);
  axis(svg, y, false, [m.l, w - m.r], 0, hi);
  const vals = rows.map(() => 0);
  const cols = columns(svg, rows, x, y, hi, 0, step, (k, v, d) => { vals[k] = clamp(v ?? vals[k] + d, 0, hi); paint(k); onMove?.(); }, k => S.rows[rows[k]].n);
  const bar = [], val = [];
  rows.forEach((i, k) => {
    const r = S.rows[i], g = cols[k];
    bar.push(g.append('rect').attr('class', 'bar').attr('x', x(i)).attr('width', x.bandwidth()).attr('rx', 4).attr('fill', hueOf(C)).attr('y', y(0)).attr('height', 0));
    g.append('rect').attr('class', 'grip').attr('x', x(i) + x.bandwidth() / 2 - 12).attr('width', 24).attr('height', 6).attr('rx', 3);
    val.push(g.append('text').attr('class', 'val').attr('x', x(i) + x.bandwidth() / 2));
    g.append('text').attr('class', 'ic').attr('x', x(i) + x.bandwidth() / 2).attr('y', h - m.b + 18).text(r.i);
    lines(g, r.n, x(i) + x.bandwidth() / 2, h - m.b + 32, 10);
  });
  svg.append('line').attr('class', 'base').attr('x1', m.l).attr('x2', w - m.r).attr('y1', h - m.b).attr('y2', h - m.b);
  function paint(k) {
    bar[k].attr('y', y(vals[k])).attr('height', y(0) - y(vals[k]));
    cols[k].select('.grip').attr('y', y(vals[k]) - 10);
    val[k].attr('y', y(vals[k]) - 14).text(num(vals[k]));
    cols[k].attr('aria-valuenow', vals[k]);
  }
  rows.forEach((_, k) => paint(k));
  return { value: () => vals.slice(), mark: bad => cols.forEach((g, k) => g.classed('no', bad.includes(k)).classed('ok', !bad.includes(k))) };
}

// The points of a line, one per row, from lo to hi every step: each one is dragged up or down to its value
export function buildLine(el, { set: id, rows: R, c = 0, lo = 0, hi, step }, onMove) {
  const S = SETS[id], rows = R || ALL(S.rows.length), w = 360, h = 250, m = { l: 46, r: 12, t: 14, b: 44 };
  const svg = figure(el, `Fes-la tu: ${S.title}`, w, h, 'build');
  const y = scaleLinear().domain([lo, hi]).range([h - m.b, m.t]), x = scaleBand().domain(rows).range([m.l, w - m.r]).padding(0.2);
  axis(svg, y, false, [m.l, w - m.r], lo, hi);
  const cx = i => x(i) + x.bandwidth() / 2, vals = rows.map(() => lo);
  const path = svg.append('path').attr('class', 'ln');
  const cols = columns(svg, rows, x, y, hi, lo, step, (k, v, d) => { vals[k] = clamp(v ?? vals[k] + d, lo, hi); paint(); onMove?.(); }, k => S.rows[rows[k]].n);
  const dot = [], val = [];
  rows.forEach((i, k) => {
    const r = S.rows[i], g = cols[k];
    dot.push(g.append('circle').attr('class', 'dot handle').attr('cx', cx(i)).attr('r', 9));
    val.push(g.append('text').attr('class', 'val').attr('x', cx(i)));
    if (r.i) g.append('text').attr('class', 'ic').attr('x', cx(i)).attr('y', h - m.b + 16).text(r.i);
    lines(g, r.n, cx(i), h - m.b + (r.i ? 29 : 16), 9.5);
  });
  function paint() {
    path.attr('d', d3line().x((_, k) => cx(rows[k])).y(v => y(v)).curve(curveMonotoneX)(vals));
    vals.forEach((v, k) => { dot[k].attr('cy', y(v)); val[k].attr('y', y(v) - 14).text(num(v)); cols[k].attr('aria-valuenow', v); });
  }
  paint();
  return { value: () => vals.slice(), mark: bad => cols.forEach((g, k) => g.classed('no', bad.includes(k)).classed('ok', !bad.includes(k))) };
}

// A pie whose slices the child sizes: a sun on the rim between every two slices is dragged round, in steps of step %
export function buildPie(el, { set: id, step }, onMove) {
  const S = SETS[id], n = S.rows.length, U = 100 / step, w = 360, h = 250, cx = 120, cy = 125, R = 100;
  const svg = figure(el, `Fes-lo tu: ${S.title.replace(/ \(%\)$/, '')} (%)`, w, h, 'build');
  // cut[j] is where slice j ends, in steps from twelve o'clock; the last always ends at the whole
  const cut = Array.from({ length: n }, (_, j) => j === n - 1 ? U : Math.round((j + 1) * U / n));
  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
  svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', R).attr('class', 'rim');
  const arc = d3arc().innerRadius(0).outerRadius(R), ang = u => u / U * 2 * Math.PI;
  const slices = S.rows.map((_, j) => g.append('path').attr('class', 'slice').attr('fill', PAL[j % PAL.length]).attr('stroke', NIGHT).attr('stroke-width', 2));
  const labs = S.rows.map(() => g.append('text').attr('class', 'in'));
  const leg = S.rows.map((r, j) => { const yy = 16 + j * 26 + (5 - n) * 13, s = svg.append('g').attr('class', 'leg-row');
    s.append('rect').attr('x', 238).attr('y', yy + 3).attr('width', 13).attr('height', 13).attr('rx', 3).attr('fill', PAL[j % PAL.length]);
    return s.append('text').attr('class', 'leg').attr('x', 256).attr('y', yy + 14); });
  const handles = cut.slice(0, -1).map((_, j) => {
    const hd = g.append('g').attr('class', 'handle-sun').attr('tabindex', 0).attr('role', 'slider').attr('aria-label', `Entre ${S.rows[j].n} i ${S.rows[j + 1].n}`);
    hd.append('circle').attr('r', 20).attr('class', 'pad'); hd.append('circle').attr('r', 11).attr('class', 'sun');
    hd.call(drag().container(g.node()).on('start drag', e => { let a = Math.atan2(e.x, -e.y); if (a < 0) a += 2 * Math.PI; move(j, Math.round(a / (2 * Math.PI) * U)); }));
    hd.on('keydown', e => { const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); move(j, cut[j] + d); } });
    return hd;
  });
  function move(j, u) { cut[j] = clamp(u, j ? cut[j - 1] : 0, cut[j + 1]); paint(); onMove?.(); }
  const pcts = () => cut.map((u, j) => (u - (j ? cut[j - 1] : 0)) * step);
  function paint() {
    const p = pcts();
    S.rows.forEach((r, j) => {
      const a = { startAngle: ang(j ? cut[j - 1] : 0), endAngle: ang(cut[j]) };
      slices[j].attr('d', arc(a));
      const [px, py] = d3arc().innerRadius(R * 0.6).outerRadius(R * 0.6).centroid(a);
      labs[j].attr('x', px).attr('y', py + 5).text(p[j] >= 8 ? `${p[j]}%` : '');
      leg[j].text(`${r.i} ${r.n}: ${p[j]} %`);
    });
    handles.forEach((hd, j) => { const a = ang(cut[j]); hd.attr('transform', `translate(${R * Math.sin(a)},${-R * Math.cos(a)})`).attr('aria-valuenow', cut[j] * step); });
  }
  paint();
  return { value: pcts, mark: bad => leg.forEach((t, j) => t.classed('no', bad.includes(j)).classed('ok', !bad.includes(j))) };
}

// The things of a Venn diagram start in a tray under it. A finger drags each one to its place; or a tap picks one and a second tap,
// anywhere in the diagram, puts it there. value() gives the region of each thing ('10', '' outside every circle, null in the tray)
export function buildVenn(el, { venn: id, k: K, items: I }, onMove) {
  const G = VENNS[id], k = K || G.groups.length, geo = GEO[k], items = I.map(i => G.items[i]), tray = 96, h = geo.h + tray;
  const svg = figure(el, G.title, 360, h, 'venn build');
  vennFrame(svg, G, k, geo);
  svg.append('text').attr('class', 'traytext').attr('x', 180).attr('y', geo.h + 14).attr('text-anchor', 'middle').text('Arrossega cada un al seu lloc');
  const per = Math.ceil(items.length / 2), pos = items.map((_, j) => { const row = j < per ? 0 : 1, n = row ? items.length - per : per, col = row ? j - per : j;
    return { x: 180 + (col - (n - 1) / 2) * Math.min(64, 340 / n), y: geo.h + 38 + row * 44, home: true }; });
  let chosen = -1;
  const place = (j, p) => {
    const inside = p.x > 8 && p.x < 352 && p.y > 8 && p.y < geo.h - 8;
    pos[j] = inside ? { x: clamp(p.x, 22, 338), y: clamp(p.y, 20, geo.h - 30) } : { ...p, home: true };
    toks[j].attr('transform', `translate(${pos[j].x},${pos[j].y})`).classed('no', false).classed('ok', false);
    onMove?.();
  };
  const toks = items.map((it, j) => {
    const g = svg.append('g').attr('class', 'tok').attr('tabindex', 0).attr('role', 'button').attr('aria-label', `${it.n}: toca'l i després toca on va`)
      .attr('transform', `translate(${pos[j].x},${pos[j].y})`);
    token(g, it);
    g.datum(pos[j]).call(drag().container(svg.node()).subject(() => pos[j])
      .on('start', () => { g.raise().classed('lift', true); })
      .on('drag', e => { pos[j] = { x: e.x, y: e.y }; g.attr('transform', `translate(${e.x},${e.y})`); })
      .on('end', e => { g.classed('lift', false); place(j, { x: e.x, y: e.y }); }));
    g.on('click', e => { e.stopPropagation(); chosen = chosen === j ? -1 : j; toks.forEach((t, n) => t.classed('chosen', n === chosen)); });
    g.on('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chosen = j; toks.forEach((t, n) => t.classed('chosen', n === chosen)); } });
    return g;
  });
  svg.on('click', e => { if (chosen < 0) return; const [px, py] = pointer(e, svg.node()); const j = chosen; chosen = -1; toks[j].classed('chosen', false); place(j, { x: px, y: py }); });
  return {
    value: () => pos.map(p => p.home ? null : maskAt(geo, k, [p.x, p.y])),
    mark: bad => toks.forEach((t, j) => t.classed('no', bad.includes(j)).classed('ok', !bad.includes(j)))
  };
}

// A plan: each task is a bar as long as its days, dragged along its lane (or tapped where it should start). value() gives the first day of each
export function buildGantt(el, { days, tasks }, onMove) {
  const T = tasks.map(([n, i, len]) => ({ n, i, len }));
  const { svg, x, lane, m } = ganttFrame(el, null, 'El teu pla (dia a dia)', T, days);
  const bw = x.step(), dayAt = px => clamp(Math.floor((px - m.l) / bw) + 1, 1, days);
  const start = T.map(() => 1);
  const rows = T.map((t, n) => {
    const y0 = m.t + n * lane, g = svg.append('g').attr('class', 'lane').attr('data-k', n);
    g.append('rect').attr('class', 'pad').attr('x', 0).attr('y', y0).attr('width', 360).attr('height', lane);
    g.append('text').attr('class', 'lab').attr('x', m.l + 2).attr('y', y0 + 12).text(`${t.i} ${t.n} · ${t.len} ${t.len === 1 ? 'dia' : 'dies'}`);
    const bar = g.append('g').attr('class', 'gbar').attr('tabindex', 0).attr('role', 'slider').attr('aria-label', `${t.n}: arrossega-la`).attr('aria-valuemin', 1).attr('aria-valuemax', days - t.len + 1);
    bar.append('rect').attr('class', 'bar').attr('y', y0 + 16).attr('height', 18).attr('rx', 7).attr('fill', PAL[n % PAL.length]).attr('width', x(t.len) + x.bandwidth() - x(1));
    bar.append('text').attr('class', 'grip-t').attr('y', y0 + 29).text('⟷');
    let grab = 0;
    bar.call(drag().container(svg.node()).on('start', e => { grab = dayAt(e.x) - start[n]; bar.classed('lift', true); })
      .on('drag', e => set(n, dayAt(e.x) - grab)).on('end', () => bar.classed('lift', false)));
    bar.on('keydown', e => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]; if (d) { e.preventDefault(); set(n, start[n] + d); } });
    // a tap on the lane, away from the bar, moves the bar to start there
    g.on('click', e => { if (e.target.closest('.gbar')) return; set(n, dayAt(pointer(e, svg.node())[0])); });
    return { bar, t, y0 };
  });
  function set(n, d) { start[n] = clamp(d, 1, days - T[n].len + 1); paint(n); onMove?.(); }
  function paint(n) { const { bar, t } = rows[n]; bar.attr('transform', `translate(${x(start[n])},0)`).attr('aria-valuenow', start[n]); bar.select('.grip-t').attr('x', (x(t.len) + x.bandwidth() - x(1)) / 2); }
  T.forEach((_, n) => paint(n));
  return { value: () => start.slice(), mark: bad => rows.forEach(({ bar }, n) => bar.classed('no', bad.includes(n))) };
}

// The seesaw of the mean: every number is a dot on a beam, and the beam tips towards the heavy side of its pivot. The child drags the
// pivot until the beam lies flat: there, the dots on each side pull the same, and that is the mean
export function buildBalance(el, { stats }, onMove) {
  const D = STATS[stats], w = 360, h = 250, m = { l: 30, r: 30 }, beamY = 150;
  const svg = figure(el, `${D.title}: busca l'equilibri`, w, h, 'build balance');
  const x = scaleLinear().domain([D.lo, D.hi]).range([m.l, w - m.r]);
  let p = D.lo;
  const beam = svg.append('g').attr('class', 'beam');
  beam.append('rect').attr('x', x(D.lo) - 14).attr('y', beamY - 4).attr('width', x(D.hi) - x(D.lo) + 28).attr('height', 8).attr('rx', 4).attr('class', 'plank');
  for (let v = D.lo; v <= D.hi; v++) { beam.append('line').attr('class', 'tick').attr('x1', x(v)).attr('x2', x(v)).attr('y1', beamY + 4).attr('y2', beamY + 10); beam.append('text').attr('class', 'num').attr('x', x(v)).attr('y', beamY + 22).attr('text-anchor', 'middle').text(v); }
  const pile = {};
  D.vals.forEach((v, n) => { const k = pile[v] = (pile[v] || 0) + 1; beam.append('circle').attr('class', 'dot big').attr('cx', x(v)).attr('cy', beamY - 13 - (k - 1) * 19).attr('r', 9).style('fill', PAL[n % PAL.length]); });
  const piv = svg.append('g').attr('class', 'pivot').attr('tabindex', 0).attr('role', 'slider').attr('aria-label', 'El punt de recolzament: arrossega\'l').attr('aria-valuemin', D.lo).attr('aria-valuemax', D.hi);
  piv.append('rect').attr('class', 'pad').attr('x', -26).attr('y', beamY - 6).attr('width', 52).attr('height', 80);
  piv.append('path').attr('d', `M0 ${beamY + 5}L-17 ${beamY + 46}H17Z`).attr('class', 'tri');
  const pl = piv.append('text').attr('class', 'pval').attr('y', beamY + 66).attr('text-anchor', 'middle');
  svg.append('line').attr('class', 'ground').attr('x1', 6).attr('x2', w - 6).attr('y1', beamY + 46).attr('y2', beamY + 46);
  const set = v => { p = clamp(Math.round(v), D.lo, D.hi); paint(); onMove?.(); };
  piv.call(drag().container(svg.node()).on('start drag', e => set(x.invert(e.x))));
  svg.on('click', e => { if (!e.target.closest('.pivot')) set(x.invert(pointer(e, svg.node())[0])); });
  piv.on('keydown', e => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]; if (d) { e.preventDefault(); set(p + d); } });
  function paint() {
    const pull = D.vals.reduce((s, v) => s + (v - p), 0), deg = clamp(pull * 1.5, -9, 9);
    piv.attr('transform', `translate(${x(p)},0)`).attr('aria-valuenow', p); pl.text(p);
    beam.transition().duration(ms(350)).ease(easeCubicOut).attrTween('transform', function () {
      const from = this.getAttribute('data-deg') || 0, i = interpolate(+from, deg); this.setAttribute('data-deg', deg);
      return t => `rotate(${i(t)} ${x(p)} ${beamY})`; });
    beam.classed('flat', pull === 0);
  }
  paint();
  return { value: () => p, mark: () => {} };
}
