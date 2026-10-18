// The pictures of the odometer of the pond: the dashboard with its six rolling wheels, the cars of a race, the road as a number line,
// the stones along the road, tiles, tokens, a road sign, an arcade screen and the map of the trip. Each scene is drawn from the plain
// data of logic.js. What a hint shows is drawn too, hidden (.hx), and comes up when the board gets the class hint.
import { punt, lletres, dig, HUES, SHORT, PLACES } from './logic.js';
import { RM, sleep } from '../../shared/util.js';

const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hue = p => `--h:${HUES[p]}`;

// the frog of the trip, in its racing cap with goggles
export const FROG = `<svg class="frog" viewBox="-40 -64 84 92" aria-hidden="true"><ellipse cx="0" cy="22" rx="28" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-24 14q-9-2-7-9q7 2 11 6ZM24 14q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-4" rx="25" ry="21" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <ellipse cx="0" cy="4" rx="15" ry="11" fill="#D9F5C8"/><path d="M-18 -12q18 10 36 0" fill="none" stroke="#FF6B5E" stroke-width="5" stroke-linecap="round"/><path d="M14 -10l6 10l-4 2Z" fill="#FF6B5E"/>
  <circle cx="-12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-25" r="4" fill="#0F3A40"/><circle cx="13" cy="-25" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-27" r="1.4" fill="#fff"/><circle cx="14.5" cy="-27" r="1.4" fill="#fff"/>
  <path d="M-9 -15Q0 -9 9 -15" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-21 -38q3-20 21-20q18 0 21 20Z" fill="#2B7BD6" stroke="#174A86" stroke-width="2"/><path d="M-4 -38h34q2 5-5 6h-29Z" fill="#174A86"/><path d="M-8 -57h16v4h-16Z" fill="#fff" opacity="0.8"/>
  <g transform="translate(0 -44)"><rect x="-17" y="-6" width="14" height="10" rx="5" fill="#9FE6FF" stroke="#3A4A55" stroke-width="2"/><rect x="3" y="-6" width="14" height="10" rx="5" fill="#9FE6FF" stroke="#3A4A55" stroke-width="2"/><path d="M-3 -1h6" stroke="#3A4A55" stroke-width="2"/><path d="M-14 -3l5 0" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g></svg>`;

/* ---------- the odometer ---------- */
// The six wheels of the odometer: places 5 (on the left) to 0. Each wheel is a strip 0..9 and 0 again that slides; the point of the
// thousands sits between the wheel of the thousands and the one of the hundreds, lit from 1.000 on
const STRIP = '<div class="strip">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<b>${d}</b>`).join('') + '</div>';
function odoHTML(sc) {
  const P = [5, 4, 3, 2, 1, 0];
  const wheel = p => `<div class="wheel${sc.hl === p ? ' hlp' : ''}" data-p="${p}" style="${hue(p)}">
      ${sc.spin ? `<button class="spin up" data-up="${p}" aria-label="Puja ${PLACES[p]}">▲</button>` : ''}
      <div class="win${sc.taps ? ' hit' : ''}"${sc.taps ? ` data-k="w${p}" tabindex="0" role="button" aria-label="Roda de ${PLACES[p]}"` : ''}>${STRIP}</div>
      ${sc.spin ? `<button class="spin dn" data-dn="${p}" aria-label="Baixa ${PLACES[p]}">▼</button>` : ''}
      ${sc.goal != null ? `<i class="hx goal">${dig(sc.goal, p)}</i>` : ''}${sc.add && sc.add[0] === p ? `<i class="hx add">${sc.add[1] > 0 ? '+1' : '−1'}</i>` : ''}</div>`;
  return `<div class="odo"><div class="places" aria-hidden="true">${P.map(p => `<span style="${hue(p)}"${sc.hl === p ? ' class="hlp"' : ''}>${SHORT[p]}</span>${p === 3 ? '<i></i>' : ''}`).join('')}</div>
    <div class="wheels">${P.map(p => wheel(p) + (p === 3 ? '<span class="pt" aria-hidden="true">.</span>' : '')).join('')}<span class="unit">km</span></div></div>`;
}
// the speedometer over the odometer: an arc of marks and a needle
const GAUGE = (() => {
  let ticks = '';
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * (1 - i / 12), c = Math.cos(a), s = Math.sin(a), r1 = i % 2 ? 84 : 78;
    ticks += `<path d="M${(150 + 92 * c).toFixed(1)} ${(112 - 92 * s).toFixed(1)}L${(150 + r1 * c).toFixed(1)} ${(112 - r1 * s).toFixed(1)}" stroke="${i > 9 ? '#FF6B5E' : '#CFEFFF'}" stroke-width="${i % 2 ? 2 : 3.5}" stroke-linecap="round"/>`;
    if (i % 2 === 0) ticks += `<text x="${(150 + 64 * c).toFixed(1)}" y="${(117 - 64 * s).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#9EC3C0">${i * 20}</text>`;
  }
  return `<svg class="gauge" viewBox="40 8 220 116" aria-hidden="true"><defs><linearGradient id="g-arc" x1="0" x2="1"><stop offset="0" stop-color="#4FB562"/><stop offset="0.6" stop-color="#F7C64E"/><stop offset="1" stop-color="#FF6B5E"/></linearGradient></defs>
    <path d="M52 112A98 98 0 0 1 248 112" fill="none" stroke="url(#g-arc)" stroke-width="7" stroke-linecap="round" opacity="0.85"/>${ticks}
    <text x="150" y="96" text-anchor="middle" font-size="10" font-weight="800" fill="#6FE3FF" letter-spacing="1">km/h</text>
    <g class="needle"><path d="M150 112L96 72" stroke="#FF6B5E" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="112" r="9" fill="#2A4B5C" stroke="#CFEFFF" stroke-width="2"/></g></svg>`;
})();

// a wheel shows digit d; with roll it slides there one step at a time in the direction dir (1 forward, −1 back), wrapping 9 → 0
function setWheel(w, d, roll = 0) {
  const strip = w.querySelector('.strip'), cur = +w.dataset.d || 0;
  w.dataset.d = d;
  const go = i => { strip.style.transform = `translateY(calc(-${i} * var(--wh)))`; };
  if (!roll || RM || cur === d) { strip.style.transition = 'none'; go(d); return; }
  strip.style.transition = 'none';
  if (roll > 0 && d < cur) { go(cur); void strip.offsetHeight; strip.style.transition = ''; go(10); strip.addEventListener('transitionend', () => { strip.style.transition = 'none'; go(d); }, { once: true }); return; }
  if (roll < 0 && d > cur) { go(cur === 0 ? 10 : cur); void strip.offsetHeight; strip.style.transition = ''; go(d === 9 && cur === 0 ? 9 : d); return; }
  go(cur); void strip.offsetHeight; strip.style.transition = ''; go(d);
}
// the odometer in el at n: { set(n), roll(to), value() }
function odometer(el, n) {
  const ws = [...el.querySelectorAll('.wheel')], needle = el.querySelector('.needle');
  let v = n;
  const paint = (x, roll = 0) => {
    const first = String(x).length - 1;
    ws.forEach(w => { const p = +w.dataset.p; setWheel(w, dig(x, p), roll); w.classList.toggle('lead', p > first && x < 10 ** p); });
    el.querySelector('.pt').classList.toggle('on', x >= 1000);
  };
  paint(n);
  return {
    value: () => v,
    set(x, dir = 0) { v = x; paint(x, dir); },
    // rolls from the value now to x, the wheels on the right first, as on a real car
    async roll(x) {
      const dir = x > v ? 1 : -1, from = v; v = x;
      if (needle) needle.style.transform = 'rotate(75deg)';
      const moving = ws.filter(w => dig(from, +w.dataset.p) !== dig(x, +w.dataset.p)).sort((a, b) => a.dataset.p - b.dataset.p);
      for (const w of moving) { setWheel(w, dig(x, +w.dataset.p), dir); w.classList.add('moved'); if (!RM) await sleep(170); }
      el.querySelector('.pt').classList.toggle('on', x >= 1000);
      ws.forEach(w => { const p = +w.dataset.p; w.classList.toggle('lead', p > String(x).length - 1); });
      await sleep(RM ? 0 : 500);
      if (needle) needle.style.transform = '';
    }
  };
}

/* ---------- a car seen from the side, with the frog at the wheel ---------- */
const carSVG = h => `<svg class="carsvg" viewBox="0 0 200 112" aria-hidden="true"><ellipse cx="102" cy="104" rx="92" ry="6" fill="rgb(0 0 0 / 0.35)"/>
  <path d="M10 72Q12 54 40 50L70 30Q79 23 96 23H130Q146 23 156 35L171 51Q193 53 195 70V82Q195 88 189 88H16Q10 88 10 82Z" fill="hsl(${h} 72% 52%)" stroke="hsl(${h} 70% 28%)" stroke-width="2.5"/>
  <path d="M18 66Q20 58 40 56H182" fill="none" stroke="hsl(${h} 90% 78%)" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
  <ellipse cx="112" cy="45" rx="15" ry="11" fill="#4FB562"/><circle cx="105" cy="35" r="6" fill="#fff" stroke="#2F7F40" stroke-width="1.5"/><circle cx="120" cy="35" r="6" fill="#fff" stroke="#2F7F40" stroke-width="1.5"/>
  <circle cx="107" cy="35" r="2.6" fill="#0F3A40"/><circle cx="122" cy="35" r="2.6" fill="#0F3A40"/><path d="M106 49q7 4 14 0" fill="none" stroke="#1C5A3C" stroke-width="2" stroke-linecap="round"/>
  <path d="M77 33L96 31H128Q138 32 146 41L155 50H66Z" fill="rgb(190 235 255 / 0.35)" stroke="hsl(${h} 70% 28%)" stroke-width="2.5"/><path d="M84 37L94 35" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <path d="M110 31V50" stroke="hsl(${h} 70% 28%)" stroke-width="2.5"/><rect x="184" y="60" width="10" height="7" rx="2" fill="#FFF3B0"/><rect x="10" y="62" width="7" height="6" rx="2" fill="#FF6B5E"/>
  ${[50, 156].map(x => `<g transform="translate(${x} 88)"><circle r="18" fill="#1B2730"/><g class="hub"><circle r="9" fill="#9AB0BC"/><path d="M-9 0H9M0 -9V9" stroke="#56707E" stroke-width="3"/></g></g>`).join('')}</svg>`;

/* ---------- the road as a number line ---------- */
function lineSVG(sc, tap) {
  const X0 = 46, X1 = 594, x = i => X0 + (X1 - X0) * i / sc.n, Y = 92;
  let marks = '', hits = '', labels = '';
  for (let i = 0; i <= sc.n; i++) {
    const end = i === 0 || i === sc.n, mid = sc.mid && i * 2 === sc.n, v = sc.from + i * sc.step;
    marks += `<path d="M${x(i)} ${Y - (end || mid ? 36 : 22)}V${Y + 22}" stroke="${mid ? '#F7C64E' : '#fff'}" stroke-width="${end ? 5 : 3}" stroke-linecap="round"${mid ? ' stroke-dasharray="5 5"' : ''}/>`;
    const show = sc.lab === 'all' || end, low = !end && i % 2 === 1;
    labels += `<text class="${show ? 'lb' : 'lb hx'}" x="${x(i)}" y="${low ? 178 : 148}" text-anchor="middle">${punt(v)}</text>`;
    if (mid) labels += `<text class="lb hx mid" x="${x(i)}" y="206" text-anchor="middle">la meitat: ${punt(v)}</text>`;
    if (tap && (!sc.only || sc.only.includes(i))) hits += `<g class="hit tick" data-k="t${i}" tabindex="0" role="button" aria-label="Marca ${i + 1}"><rect x="${x(i) - 26}" y="${Y - 46}" width="52" height="${sc.only ? 150 : 92}" rx="12"/></g>`;
  }
  const car = (cx, label) => `<g transform="translate(${cx.toFixed(1)} ${Y - 46})"><g class="lcar"><g transform="scale(0.4) translate(-102 -70)">${carSVG(355).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>${label ? `<text y="-34" text-anchor="middle" class="lv">${label}</text>` : ''}</g></g>`;
  const atX = sc.at != null ? X0 + (X1 - X0) * (sc.at - sc.from) / (sc.step * sc.n) : null;
  return `<svg class="road" viewBox="0 ${sc.at != null ? -40 : 0} 640 ${(sc.mid ? 216 : 190) + (sc.at != null ? 40 : 0)}" role="img" aria-label="Una carretera amb marques de ${punt(sc.step)} en ${punt(sc.step)}, des del ${punt(sc.from)}">
    <path d="M0 ${Y - 28}H640V${Y + 28}H0Z" fill="#33424B"/><path d="M0 ${Y - 28}H640M0 ${Y + 28}H640" stroke="#E8E2C8" stroke-width="3"/>
    <path d="M0 ${Y}H640" stroke="#F7C64E" stroke-width="3" stroke-dasharray="18 14" opacity="0.6" class="dash"/>${marks}${labels}
    ${sc.frog != null ? car(x(sc.frog), '') : ''}${atX != null ? car(atX, punt(sc.at)) : ''}${hits}</svg>`;
}

/* ---------- the stones along the road ---------- */
function postsSVG(sc) {
  const n = sc.nums.length, w = 640 / n;
  return `<svg class="posts" viewBox="0 0 640 190" role="img" aria-label="Fites de la carretera: ${sc.nums.map(x => x === null ? 'interrogant' : punt(x)).join(', ')}">
    <path d="M0 150Q320 132 640 150V190H0Z" fill="#33424B"/><path d="M0 160Q320 142 640 160" stroke="#F7C64E" stroke-width="3" stroke-dasharray="18 14" fill="none" opacity="0.6"/>
    ${sc.nums.map((v, i) => { const cx = w * i + w / 2; return `<g transform="translate(${cx} 0)"><g class="post${v === null ? ' q' : ''}" style="--d:${i * 0.12}s">
      <path d="M-52 128V52Q-52 22 0 22Q52 22 52 52V128Z" fill="#F4F1E8" stroke="#8C8778" stroke-width="2.5"/><path d="M-52 52Q-52 22 0 22Q52 22 52 52Z" fill="#E8443A"/>
      <text y="${v === null ? 100 : 94}" text-anchor="middle" class="pn${v === null ? ' qm' : ''}">${v === null ? '?' : punt(v)}</text><text y="116" text-anchor="middle" class="pk">km</text></g></g>
      ${i < n - 1 ? `<text class="hx step" x="${cx + w / 2}" y="16" text-anchor="middle">${sc.step > 0 ? '+' : '−'}${punt(Math.abs(sc.step))}</text>` : ''}`; }).join('')}</svg>`;
}

/* ---------- the map: the road of the trip, with a stop for each project ---------- */
export function tripMap(el, done, km, icons) {
  const pts = [[30, 128], [80, 98], [138, 118], [196, 84], [252, 104], [306, 68], [362, 88], [414, 54], [446, 30]];
  const d = 'M' + pts.map(p => p.join(' ')).join('L');
  const at = pts[Math.min(done, pts.length - 1)];
  el.innerHTML = `<svg class="trip" viewBox="0 0 470 160" role="img" aria-label="El viatge: ${done} de 9 parades">
    <defs><linearGradient id="t-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F6B4A"/><stop offset="1" stop-color="#0A2A3A"/></linearGradient></defs>
    <path d="M0 120Q60 70 120 110T240 90T360 70T470 50V160H0Z" fill="url(#t-hill)" opacity="0.8"/><path d="M0 140Q90 100 170 136T340 120T470 110V160H0Z" fill="#0E3B33" opacity="0.9"/>
    <path d="${d}" fill="none" stroke="#33424B" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#F7C64E" stroke-width="2" stroke-dasharray="8 8" opacity="0.7"/>
    ${pts.map((p, i) => `<g transform="translate(${p[0]} ${p[1]})" class="stop${i < done ? ' ok' : ''}"><path d="M0 0V-26" stroke="#CFEFFF" stroke-width="2"/><path d="M0 -26h16l-4 5l4 5h-16Z" fill="${i < done ? '#7CF5B0' : '#4D7486'}"/><text x="0" y="-30" text-anchor="middle" font-size="12">${icons[i]}</text></g>`).join('')}
    <g transform="translate(${at[0]} ${at[1] - 9})"><g class="tcar"><g transform="scale(0.2) translate(-102 -70)">${carSVG(355).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></g></g></svg>
    <div class="odo mini" aria-label="El teu cotxe ha fet ${punt(km)} km"><div class="wheels">${[5, 4, 3, 2, 1, 0].map(p => `<div class="wheel" style="${hue(p)}"><div class="win"><div class="strip" style="transform:translateY(calc(-${dig(km, p)} * var(--wh)))">${STRIP.replace(/^<div class="strip">|<\/div>$/g, '')}</div></div></div>${p === 3 ? `<span class="pt${km >= 1000 ? ' on' : ''}">.</span>` : ''}`).join('')}<span class="unit">km</span></div></div>`;
}

/* ---------- every scene ---------- */
// Draws the scene sc in board. tap: its things can be touched (a tap question). Returns { odo, answer(v), roll() }: odo the odometer
// when there is one; answer shows what was right (the sign, the point); roll makes the scene move to the number after the answer
export function scene(board, sc, { tap = false } = {}) {
  board.classList.remove('hint');
  if (!sc) { board.innerHTML = ''; return { answer() {}, roll: async () => {} }; }
  let api = { answer() {}, roll: async () => {} };
  if (sc.s === 'odo') {
    board.innerHTML = `<div class="scene s-odo"><div class="dash">${GAUGE}${odoHTML(sc)}</div></div>`;
    const o = odometer(board.querySelector('.dash'), sc.n);
    api = { odo: o, answer() {}, roll: async () => { if (sc.to != null) await o.roll(sc.to); } };
  } else if (sc.s === 'cars') {
    board.innerHTML = `<div class="scene s-cars">${sc.cars.map((c, i) => `<div class="car${tap ? ' hit' : ''}" data-k="${c.k}"${tap ? ` tabindex="0" role="button" aria-label="Cotxe de ${punt(c.n)} km"` : ''} style="--d:${i * 0.18}s">
      ${carSVG(c.h)}<span class="plate"><b>${punt(c.n)}</b> km</span><i class="hx">${String(c.n).length} xifres</i></div>`).join('')}</div>`;
  } else if (sc.s === 'tiles') {
    const ds = sc.d.split(''), k = ds.length;
    board.innerHTML = `<div class="scene s-tiles"><div class="tiles${sc.gaps ? ' gaps' : ''}">${ds.map((d, i) => {
      const p = k - 1 - i, gap = sc.gaps && i > 0 ? `<button class="gap${tap ? ' hit' : ''}" data-k="g${i}" aria-label="Entre la xifra ${i} i la ${i + 1}"><i></i></button>` : '';
      return `${gap}<span class="tile${sc.mark === i ? ' mark' : ''}${sc.gaps && p < 3 && k > 3 ? ' last3' : ''}" style="${hue(p)};--d:${i * 0.07}s">${d}<i class="hx">${SHORT[p]}</i></span>`; }).join('')}</div>
      ${sc.gaps ? `<i class="hx brace">${k > 3 ? '3 xifres' : `${k} xifr${k === 1 ? 'a' : 'es'}: no arriba als milers`}</i><button class="btn soft none${tap ? ' hit' : ''}" data-k="none">No porta punt</button>` : ''}</div>`;
    api.answer = () => {};
  } else if (sc.s === 'cmp') {
    const num = (v, w) => w ? `<span class="plate words">«${H(lletres(v))}»</span>` : `<span class="plate">${String(v).split('').map((d, i, a) => `<b style="${hue(a.length - 1 - i)}">${d}</b>${(a.length - 1 - i) % 3 === 0 && i < a.length - 1 ? '<s>.</s>' : ''}`).join('')}</span>`;
    board.innerHTML = `<div class="scene s-cmp"><div class="side">${num(sc.a, sc.aw)}<i class="hx">${sc.aw ? punt(sc.a) : String(sc.a).length + ' xifres'}</i></div><span class="sg" aria-live="polite">?</span><div class="side">${num(sc.b)}<i class="hx">${String(sc.b).length} xifres</i></div></div>`;
    api.answer = v => { const s = board.querySelector('.sg'); s.textContent = v; s.classList.add('on'); };
  } else if (sc.s === 'line') {
    board.innerHTML = `<div class="scene s-line">${lineSVG(sc, tap)}</div>`;
  } else if (sc.s === 'posts') {
    board.innerHTML = `<div class="scene s-posts">${postsSVG(sc)}</div>`;
    api.answer = v => { const q = board.querySelector('.qm'); if (q) { q.textContent = v; q.classList.add('on'); } };
  } else if (sc.s === 'cards') {
    board.innerHTML = `<div class="scene s-cards${sc.digits ? ' digits' : ''}">${sc.items.map((it, i) => `<div class="card${tap ? ' hit' : ''}" data-k="${it.k}"${tap ? ' tabindex="0" role="button"' : ''} style="--d:${i * 0.08}s">
      ${sc.digits ? `<b class="dg">${it.d}</b>` : `${it.e ? `<span class="em">${it.e}</span>` : ''}${it.cap ? `<span class="cp">${H(it.cap)}</span>` : ''}<b>${punt(it.n)}</b>${it.unit ? `<small>${H(it.unit)}</small>` : ''}<i class="hx">${String(it.n).length} xifres</i>`}</div>`).join('')}</div>`;
  } else if (sc.s === 'chips') {
    board.innerHTML = `<div class="scene s-chips">${sc.parts.map(([p, c]) => `<div class="col" style="${hue(p)}"><span class="cv">${punt(10 ** p)}</span>
      <div class="stack">${Array.from({ length: c }, (_, j) => `<i class="chip-t" style="--d:${j * 0.06}s"><span>${punt(10 ** p)}</span></i>`).join('')}</div><b class="hx">${c} × ${punt(10 ** p)} = ${punt(c * 10 ** p)}</b></div>`).join('')}</div>`;
  } else if (sc.s === 'thing') {
    board.innerHTML = `<div class="scene s-thing"><span class="big" aria-hidden="true">${sc.e}</span><p class="cp">${H(sc.cap)}</p><p class="plate"><b>${punt(sc.n)}</b>${sc.unit ? ` <small>${H(sc.unit)}</small>` : ''}</p></div>`;
  } else if (sc.s === 'lcd') {
    board.innerHTML = `<div class="scene s-lcd"><div class="cab"><span class="tt">${H(sc.t)}</span><b class="sc">${punt(sc.n)}</b><span class="coin">INSERT COIN</span></div></div>`;
    api.roll = async () => {
      if (sc.to == null) return;
      const b = board.querySelector('.sc'), from = sc.n, steps = RM ? 1 : 12;
      for (let i = 1; i <= steps; i++) { b.textContent = punt(Math.round(from + (sc.to - from) * i / steps)); await sleep(45); }
      b.classList.add('on');
    };
  } else if (sc.s === 'sign') {
    board.innerHTML = `<div class="scene s-sign"><div class="sign">${sc.rows.map(([c, k]) => `<p><span>${H(c)}</span><b>${punt(k)} km</b><i>➜</i></p>`).join('')}</div><div class="pole"></div></div>`;
  } else if (sc.s === 'words') {
    const t = sc.t, i = t.indexOf(' mil'), j = t.startsWith('mil') ? 3 : i >= 0 ? i + 4 : 0;
    board.innerHTML = `<div class="scene s-words"><p class="chalk">«<span class="th">${H(t.slice(0, j))}</span>${j && j < t.length ? ' ' : ''}<span class="rest">${H(t.slice(j).trim())}</span>»${sc.unit ? ` <small>${H(sc.unit)}</small>` : ''}</p>
      ${j ? '<p class="hx split"><span class="th">abans del punt</span><span class="rest">després del punt</span></p>' : ''}</div>`;
  }
  return api;
}
