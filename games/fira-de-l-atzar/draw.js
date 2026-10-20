// The pictures of the fair of chance: the frog in its boater, coins, dice, bags of balls, spinners, the probability line, the bars of an
// experiment, the bag and the spinner the child makes, the builder of combinations with its gallery, trees, tables and the ring of frogs
// that greet. Each scene is drawn from the plain data of logic.js. What a hint shows is drawn too, hidden (.hx), and comes up when the
// board gets the class hint.
import { COLORS, METER, outcomes, ways, nameOf, throwOf, comboKey, branches, punt } from './logic.js';
import { RM, sleep } from '../../shared/util.js';

const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const hex = c => COLORS[c]?.hex || '#4D7486';

// the frog of the fair, in a striped boater
export const FROG = `<svg class="frog" viewBox="-40 -64 84 92" aria-hidden="true"><ellipse cx="0" cy="22" rx="28" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-24 14q-9-2-7-9q7 2 11 6ZM24 14q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-4" rx="25" ry="21" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <ellipse cx="0" cy="4" rx="15" ry="11" fill="#D9F5C8"/><path d="M-7 -12l7 5l7-5l-2 9l-5-3l-5 3Z" fill="#FF6B5E" stroke="#8A2A22" stroke-width="1.2" stroke-linejoin="round"/>
  <circle cx="-12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-25" r="4" fill="#0F3A40"/><circle cx="13" cy="-25" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-27" r="1.4" fill="#fff"/><circle cx="14.5" cy="-27" r="1.4" fill="#fff"/>
  <path d="M-9 -15Q0 -9 9 -15" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <ellipse cx="0" cy="-37" rx="27" ry="5" fill="#E9C77B" stroke="#8A6A2A" stroke-width="1.6"/><path d="M-16 -38v-13q16-5 32 0v13Z" fill="#F3D88E" stroke="#8A6A2A" stroke-width="1.6"/>
  <path d="M-16 -44q16-4 32 0v5q-16-4-32 0Z" fill="#FF6B5E"/></svg>`;

/* ---------- the things of chance ---------- */
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
// one face of a die: pips from 1 to 6, the number otherwise
export const dieFace = (v, cls = '') => `<svg class="face ${cls}" viewBox="-20 -20 40 40" aria-label="${v}"><rect x="-18" y="-18" width="36" height="36" rx="8" fill="#FFFDF5" stroke="#22304F" stroke-width="2"/>
  ${PIPS[v] ? PIPS[v].map(([x, y]) => `<circle cx="${x * 9}" cy="${y * 9}" r="3.6" fill="#22304F"/>`).join('') : `<text y="7" text-anchor="middle" font-size="20" font-weight="800" fill="#22304F">${H(v)}</text>`}</svg>`;
const coinFace = side => `<svg class="coinsvg" viewBox="-30 -30 60 60" aria-label="${side}"><circle r="27" fill="#E2BA4C" stroke="#8E6A1E" stroke-width="3"/><circle r="21" fill="none" stroke="#8E6A1E" stroke-width="1.5" stroke-dasharray="3 3"/>
  ${side === 'cara' ? '<text y="9" text-anchor="middle" font-size="26">🐸</text>' : '<text y="9" text-anchor="middle" font-size="24" font-weight="800" fill="#6B4A10">1€</text>'}</svg>`;
// the balls of a bag in a sack; hidden ones are a question mark
function bagSVG(b, hidden = false, big = false) {
  const balls = Object.keys(COLORS).flatMap(c => Array(b[c] || 0).fill(c)), n = balls.length, per = n > 12 ? 6 : n > 6 ? 4 : 3, r = n > 12 ? 7 : 9;
  const w = 120, rows = Math.ceil(n / per);
  const pos = balls.map((c, i) => { const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, n - row * per); return [60 + (col - (inRow - 1) / 2) * (2 * r + 3), 118 - r - row * (2 * r + 2), c]; });
  return `<svg class="bagsvg${big ? ' big' : ''}" viewBox="0 0 ${w} 135" aria-label="${hidden ? 'Una bossa tancada' : `Una bossa amb ${Object.keys(COLORS).filter(c => b[c]).map(c => `${b[c]} ${b[c] === 1 ? COLORS[c].f : COLORS[c].fp}`).join(', ')}`}">
    <path d="M24 34Q8 70 12 104Q16 132 60 132Q104 132 108 104Q112 70 96 34Z" fill="#C79A5B" stroke="#7A5428" stroke-width="3"/><path d="M30 34Q60 24 90 34" fill="none" stroke="#7A5428" stroke-width="5" stroke-linecap="round"/>
    <path d="M44 30L36 12M76 30L84 12" stroke="#7A5428" stroke-width="3" stroke-linecap="round"/>
    ${hidden ? '<text x="60" y="100" text-anchor="middle" font-size="44" font-weight="800" fill="#7A5428">?</text>'
      : pos.map(([x, y, c]) => `<circle cx="${x}" cy="${Math.max(y, 44)}" r="${r}" fill="${hex(c)}" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.5"/><circle cx="${x - r / 3}" cy="${Math.max(y, 44) - r / 3}" r="${r / 3.5}" fill="#fff" opacity="0.6"/>`).join('')}
    ${rows > 4 ? '' : ''}</svg>`;
}
// a spinner of equal pieces, with its arrow; paint: its pieces can be touched (data-i) to paint them
export function spinSVG(secs, { paint = false, label = '' } = {}) {
  const n = secs.length, R = 46;
  const piece = (c, i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2, big = n === 1 ? 1 : 0;
    const p = n === 1 ? `<circle r="${R}"/>` : `<path d="M0 0L${(R * Math.cos(a0)).toFixed(2)} ${(R * Math.sin(a0)).toFixed(2)}A${R} ${R} 0 ${big} 1 ${(R * Math.cos(a1)).toFixed(2)} ${(R * Math.sin(a1)).toFixed(2)}Z"/>`;
    return `<g class="sec${paint ? ' hit' : ''}" data-i="${i}" fill="${c ? hex(c) : '#1B3442'}" stroke="#0A1B24" stroke-width="2"${paint ? ` role="button" tabindex="0" aria-label="Tros ${i + 1}"` : ''}>${p}</g>`;
  };
  return `<svg class="spinsvg" viewBox="-54 -62 108 118" aria-label="${H(label || 'Una ruleta')}"><g class="wheel">${secs.map(piece).join('')}</g><circle r="6" fill="#FFFDF5" stroke="#0A1B24" stroke-width="2"/>
    <path d="M0 -50L-7 -61H7Z" fill="#FFFDF5" stroke="#0A1B24" stroke-width="2"/></svg>`;
}
const twoDice = () => `<span class="pair">${dieFace(3)}${dieFace(4)}</span>`;
// the thing itself, as a picture
function devHTML(dev, big = true) {
  if (dev.d === 'coin') return `<span class="coins">${coinFace('cara')}${coinFace('creu')}</span>`;
  if (dev.d === 'die') return `<span class="faces">${dev.faces.map(f => dieFace(f)).join('')}</span>`;
  if (dev.d === 'bag') return bagSVG(dev.balls, dev.hidden, big);
  if (dev.d === 'spin') return spinSVG(dev.secs);
  return twoDice();
}
// the outcomes as chips: colour chips for bags and spinners, faces for a die, the two sides of a coin
function chip(dev, k, tap, cls = '') {
  const lab = nameOf(dev, k), attrs = tap ? ` data-k="${H(k)}" role="button" tabindex="0" aria-label="${H(lab)}"` : '';
  if (COLORS[k]) return `<span class="oc col${tap ? ' hit' : ''} ${cls}"${attrs} style="--c:${hex(k)}"><i></i>${COLORS[k].m}</span>`;
  if (dev.d === 'coin') return `<span class="oc${tap ? ' hit' : ''} ${cls}"${attrs}>${coinFace(k)}<b>${k}</b></span>`;
  return `<span class="oc${tap ? ' hit' : ''} ${cls}"${attrs}>${dev.d === 'dice2' ? `<b class="sumk">${k}</b>` : dieFace(k)}</span>`;
}
function devScene(dev) {
  const os = outcomes(dev), t = ways(dev), many = dev.d === 'bag' ? 'boles' : dev.d === 'spin' ? 'trossos' : 'cares';
  const tapFaces = dev.tap && dev.d === 'die';
  const pic = tapFaces ? `<span class="faces">${dev.faces.map(f => `<span class="hit fc" data-k="${f}" role="button" tabindex="0" aria-label="${f}">${dieFace(f)}</span>`).join('')}</span>` : devHTML(dev);
  return `<div class="scene s-dev"><div class="thing">${pic}</div>
    ${dev.tap && !tapFaces ? `<div class="ocs">${os.map(o => chip(dev, o.k, true)).join('')}</div>` : ''}
    ${dev.hist ? `<p class="hist" aria-label="Abans ha sortit: ${H(dev.hist.join(', '))}">${dev.hist.map(h => `<span>${H(h)}</span>`).join('')}<b>?</b></p>` : ''}
    ${dev.d !== 'coin' && dev.d !== 'dice2' && !dev.hidden ? `<p class="hx tally">${os.map(o => `${COLORS[o.k] ? COLORS[o.k].m : o.k}: ${o.n}`).join(' · ')} — ${t} ${many}</p>` : ''}</div>`;
}

/* ---------- the experiment: the thing, the buttons are below it, and a bar for each outcome ---------- */
function expScene(board, dev) {
  const os = outcomes(dev), counts = Object.fromEntries(os.map(o => [o.k, 0])), last = [];
  let total = 0;
  board.innerHTML = `<div class="scene s-exp"><div class="thing small">${dev.d === 'coin' ? `<span class="coins one" id="ex-coin">${coinFace('cara')}</span>` : dev.d === 'die' ? `<span class="faces one" id="ex-die">${dieFace(dev.faces[0])}</span>` : devHTML(dev, false)}</div>
    <p class="total"><b id="ex-n">0</b> tirades</p>
    <div class="bars${os.length > 6 ? ' many' : ''}">${os.map(o => `<div class="bar" data-k="${H(o.k)}" aria-label="${H(nameOf(dev, o.k))}"><b class="bn">0</b><i class="bf" style="--c:${COLORS[o.k] ? hex(o.k) : 'var(--cyan)'}"></i><span class="bl">${COLORS[o.k] ? `<i style="background:${hex(o.k)}"></i>` : dev.d === 'coin' ? o.k : H(o.k)}</span></div>`).join('')}</div>
    <p class="last" id="ex-last" aria-live="polite"></p></div>`;
  const bars = Object.fromEntries([...board.querySelectorAll('.bar')].map(b => [b.dataset.k, b]));
  const paint = () => {
    const hi = Math.max(1, ...Object.values(counts));
    for (const o of os) { const b = bars[o.k]; b.querySelector('.bn').textContent = punt(counts[o.k]); b.querySelector('.bf').style.height = `${(100 * counts[o.k] / hi).toFixed(1)}%`; }
    board.querySelector('#ex-n').textContent = punt(total);
    board.querySelector('#ex-last').innerHTML = last.map(k => `<span${COLORS[k] ? ` style="background:${hex(k)}"` : ''}>${COLORS[k] ? '' : H(k)}</span>`).join('');
  };
  const one = () => { const k = throwOf(dev); counts[k]++; total++; last.push(k); if (last.length > 12) last.shift(); return k; };
  return {
    counts: () => ({ ...counts }), total: () => total,
    // n throws: one by one, slowly, when few; in steps when many
    async run(n, t) {
      if (n === 1) {
        const k = one(), show = board.querySelector('#ex-coin, #ex-die');
        if (show && !RM) { show.classList.remove('flip'); void show.getBoundingClientRect(); show.classList.add('flip'); }
        if (show) show.innerHTML = dev.d === 'coin' ? coinFace(k) : dieFace(k);
        paint(); return;
      }
      const steps = RM ? 1 : Math.min(10, n);
      for (let s = 0; s < steps; s++) { for (let i = 0; i < n / steps; i++) one(); paint(); if (s < steps - 1) { await sleep(60); if (t && !t.on) return; } }
    },
    tapBars() { for (const b of Object.values(bars)) { b.classList.add('hit'); b.tabIndex = 0; b.setAttribute('role', 'button'); } }
  };
}

/* ---------- make a bag, paint a spinner ---------- */
function buildScene(board, sc) {
  const k = Object.fromEntries(sc.colors.map(c => [c, 0])), secs = Array(sc.n).fill(null);
  const draw = () => {
    if (sc.look === 'bag') board.querySelector('.thing').innerHTML = bagSVG(k, false, true);
    else board.querySelector('.thing').innerHTML = spinSVG(secs, { paint: true });
    board.querySelectorAll('.cnt').forEach(e => { e.textContent = sc.look === 'bag' ? k[e.dataset.c] : secs.filter(x => x === e.dataset.c).length; });
  };
  board.innerHTML = `<div class="scene s-build"><div class="thing"></div>
    ${sc.look === 'bag' ? `<div class="adders">${sc.colors.map(c => `<div class="adder" style="--c:${hex(c)}"><button class="key mini" data-c="${c}" data-d="-1" aria-label="Treu una bola ${COLORS[c].f}">−</button><span><i></i><b class="cnt" data-c="${c}">0</b></span><button class="key mini" data-c="${c}" data-d="1" aria-label="Posa una bola ${COLORS[c].f}">+</button></div>`).join('')}</div>`
      : `<div class="paints">${sc.colors.map(c => `<span class="oc col" style="--c:${hex(c)}"><i></i><b class="cnt" data-c="${c}">0</b></span>`).join('')}</div><p class="how">👆 Toca un tros per pintar-lo. Cada toc canvia el color.</p>`}</div>`;
  draw();
  board.querySelector('.s-build').addEventListener('click', e => {
    const b = e.target.closest('[data-d]'), s = e.target.closest('.sec');
    if (api.locked) return;
    if (b) { const c = b.dataset.c, d = +b.dataset.d, tot = Object.values(k).reduce((a, x) => a + x, 0); if (d > 0 && tot >= sc.max) return; k[c] = Math.max(0, k[c] + d); draw(); api.changed?.(); }
    else if (s) { const i = +s.dataset.i, now = sc.colors.indexOf(secs[i]); secs[i] = sc.colors[(now + 1) % sc.colors.length]; draw(); api.changed?.(); }
  });
  const api = {
    counts: () => sc.look === 'bag' ? { ...k } : Object.fromEntries(sc.colors.map(c => [c, secs.filter(x => x === c).length])),
    full: () => sc.look === 'bag' ? Object.values(k).some(x => x > 0) : secs.every(Boolean), changed: null
  };
  return api;
}

/* ---------- every combination: pick one of each slot, save it, and the gallery grows ---------- */
const itemHTML = (it, cls = '') => `<span class="it ${cls}"${it.c ? ` style="--c:${hex(it.c)}"` : ''}>${it.e ? `<b>${it.e}</b>` : ''}</span>`;
function preview(sc, sel) {
  const it = i => sel[i] == null ? null : (sc.same ? sc.slots[0] : sc.slots[i]).items.find(x => x.k === sel[i]);
  if (sc.look === 'frog') {
    const shirt = it(0), hat = it(1), shoe = it(2);
    return `<svg class="dress" viewBox="-40 -70 80 104" aria-hidden="true"><ellipse cx="0" cy="28" rx="26" ry="5" fill="rgb(0 0 0 / 0.3)"/>
      <ellipse cx="0" cy="0" rx="24" ry="22" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
      <path d="M-22 -2Q-22 22 0 22Q22 22 22 -2Q12 -10 0 -10Q-12 -10 -22 -2Z" fill="${shirt ? hex(shirt.c) : 'rgb(255 255 255 / 0.12)'}" stroke="rgb(0 0 0 / 0.3)" stroke-width="1.5"${shirt ? '' : ' stroke-dasharray="3 3"'}/>
      <circle cx="-11" cy="-22" r="9" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="11" cy="-22" r="9" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="-10" cy="-21" r="3.5" fill="#0F3A40"/><circle cx="12" cy="-21" r="3.5" fill="#0F3A40"/>
      <path d="M-8 -12Q0 -7 8 -12" fill="none" stroke="#1C5A3C" stroke-width="2.4" stroke-linecap="round"/>
      ${hat ? `<text x="0" y="-31" text-anchor="middle" font-size="26">${hat.e}</text>` : '<text x="0" y="-34" text-anchor="middle" font-size="18" fill="rgb(255 255 255 / 0.3)">?</text>'}
      ${sc.slots.length > 2 ? (shoe ? `<text x="-12" y="34" text-anchor="middle" font-size="14">${shoe.e}</text><text x="12" y="34" text-anchor="middle" font-size="14">${shoe.e}</text>` : '<text x="0" y="36" text-anchor="middle" font-size="12" fill="rgb(255 255 255 / 0.3)">? ?</text>') : ''}</svg>`;
  }
  if (sc.look === 'flag') return `<svg class="flagsvg" viewBox="0 0 120 ${24 * sc.slots.length + 8}" aria-hidden="true"><rect x="2" y="2" width="6" height="${24 * sc.slots.length + 6}" fill="#9AB0BC"/>${sc.slots.map((_, i) => `<rect x="8" y="${4 + 24 * i}" width="108" height="24" fill="${it(i) ? hex(it(i).c) : 'rgb(255 255 255 / 0.08)'}" stroke="rgb(0 0 0 / 0.35)"/>`).join('')}</svg>`;
  if (sc.look === 'cone') return `<div class="cone">${[1, 0].map(i => `<span class="scoop${it(i) ? '' : ' empty'}" style="--c:${it(i) ? hex(it(i).c) : 'transparent'}">${it(i) ? it(i).e : '?'}</span>`).join('')}<span class="wafer"></span></div>`;
  if (sc.look === 'cup') return `<div class="cup"><span class="scoops">${[0, 1].map(i => `<span class="scoop${it(i) ? '' : ' empty'}" style="--c:${it(i) ? hex(it(i).c) : 'transparent'}">${it(i) ? it(i).e : '?'}</span>`).join('')}</span><span class="tub"></span></div>`;
  if (sc.look === 'podium') return `<div class="podium">${[1, 0, 2].map(i => `<div class="step s${i + 1}">${it(i) ? itemHTML(it(i), 'big') : '<span class="it big empty">?</span>'}<b>${i + 1}</b></div>`).join('')}</div>`;
  if (sc.look === 'lock') return `<div class="lock"><span class="shackle"></span><div class="body">${sc.slots.map((_, i) => `<b class="dw">${it(i) ? it(i).e : '·'}</b>`).join('')}</div></div>`;
  if (sc.look === 'pair') return `<div class="greet">${it(0) ? itemHTML(it(0), 'big') : '<span class="it big empty">?</span>'}<span class="hand">🤝</span>${it(1) ? itemHTML(it(1), 'big') : '<span class="it big empty">?</span>'}</div>`;
  return `<div class="tray">${sc.slots.map((s, i) => `<span class="plate">${it(i) ? `<b>${it(i).e}</b>` : '<b class="empty">?</b>'}<small>${H(s.name)}</small></span>`).join('')}</div>`;
}
const galleryItem = (sc, key) => { const ks = key.split('+'), pool = i => (sc.same ? sc.slots[0] : sc.slots[i]).items; return `<span class="gc">${ks.map((k, i) => itemHTML(pool(i).find(x => x.k === k), 'mini')).join('')}</span>`; };
function comboScene(board, sc) {
  const sel = sc.slots.map(() => null), found = [];
  board.innerHTML = `<div class="scene s-combo"><div class="prev" id="cb-prev"></div>
    <div class="slots">${sc.slots.map((s, i) => `<div class="slot"><span class="sn">${H(s.name)}</span><span class="row">${(sc.same ? sc.slots[0] : s).items.map(it => `<button class="opt" data-s="${i}" data-k="${H(it.k)}" aria-label="${H(it.t)}" title="${H(it.t)}"${it.c ? ` style="--c:${hex(it.c)}"` : ''}>${it.e ? it.e : ''}</button>`).join('')}</span></div>`).join('')}</div>
    <p class="found"><b id="cb-n">0</b> trobades</p><div class="gallery" id="cb-gal"></div></div>`;
  const paint = () => {
    board.querySelector('#cb-prev').innerHTML = preview(sc, sel);
    board.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', sel[+b.dataset.s] === b.dataset.k));
    board.querySelector('#cb-n').textContent = found.length;
  };
  board.querySelector('.slots').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || api.locked) return; const i = +b.dataset.s; sel[i] = sel[i] === b.dataset.k ? null : b.dataset.k; paint(); api.changed?.(); });
  const api = {
    locked: false, changed: null, found: () => found.length,
    // keeps the combination picked: 'part' (a slot empty), 'twice' (the same thing twice where it may not), 'dup' (found already) or 'new'
    keep() {
      if (sel.some(x => x == null)) return 'part';
      if (sc.distinct && new Set(sel).size !== sel.length) return 'twice';
      const key = comboKey(sel, sc);
      if (found.includes(key)) { const g = board.querySelectorAll('.gallery .gc')[found.indexOf(key)]; if (g) { g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); } return 'dup'; }
      found.push(key); board.querySelector('#cb-gal').insertAdjacentHTML('beforeend', galleryItem(sc, key)); sel.fill(null); paint(); return 'new';
    }
  };
  paint();
  return api;
}

/* ---------- the tree to count with: under a button, the child touches its nodes and they grow their branches ---------- */
// Every tip is a whole way, and the tips are numbered from the top, so the last number says how many there are. A node with a single
// branch grows it by itself (the last frog of a row has no choice). With t.miss the last level is the group the question asks for, and
// the child tries how big it is with − and +. ping() hears every growth
function grower(box, t, ping) {
  const L = t.slots.length + (t.miss ? 1 : 0), open = new Set(['']), seen = new Set(), key = path => path.join('/');
  let n = 1;
  box.innerHTML = `<button class="btn soft tbtn">🌳 Compta-ho amb un arbre</button><div class="tpanel" hidden>
    <p class="how">Toca les rodones que bateguen i en sortiran les branques. Cada punta és una manera.</p>
    ${t.miss ? `<p class="tmiss">${H(t.miss.name)}: <button class="key mini" data-m="-1" aria-label="Un menys">−</button><b>1</b><button class="key mini" data-m="1" aria-label="Un més">+</button></p>` : ''}
    <div class="tsvg"></div></div>`;
  const grow = path => {
    open.add(key(path));
    if (!t.miss) for (const x of branches(t, path, n)) { const p = [...path, x.k]; if (p.length < L && branches(t, p, n).length === 1) grow(p); }
  };
  function paint() {
    const nodes = [], edges = [];
    let rows = 0, tip = 0;
    // the visible nodes, top to bottom: a node with no branches out takes a row, one with branches sits in the middle of them
    const walk = (path, it) => {
      const p = key(path), kids = open.has(p) ? branches(t, path, n) : [], me = { p, d: path.length, it, can: path.length < L && !open.has(p) };
      if (kids.length) { const cs = kids.map(x => walk([...path, x.k], x)); me.y = (cs[0].y + cs[cs.length - 1].y) / 2; cs.forEach(c => edges.push([me, c])); }
      else me.y = rows++;
      if (me.d === L) me.tip = ++tip;
      nodes.push(me);
      return me;
    };
    const root = walk([], null), rh = rows > 12 ? 22 : 28, r = rows > 12 ? 10 : 12, W = 320, dx = Math.min(96, (W - 56) / L);
    const x0 = Math.max(14, (W - L * dx - 30) / 2), X = d => x0 + d * dx, Y = row => 24 + row * rh + rh / 2, fresh = m => seen.has(m.p) ? '' : ' new';
    const name = d => d < t.slots.length ? t.slots[d].name : t.miss.name;
    const node = m => {
      const x = X(m.d), y = Y(m.y), it = m.it;
      return `<g class="tn${m.can ? ' grow' : ''}${fresh(m)}"${m.can ? ` data-p="${H(m.p)}" role="button" tabindex="0" aria-label="Fes créixer: ${H(it.t)}"` : ''}>
        ${m.can ? `<circle class="ring" cx="${x}" cy="${y}" r="${r + 5}"/><circle cx="${x}" cy="${y}" r="${r + 10}" fill="transparent"/>` : ''}
        <circle cx="${x}" cy="${y}" r="${r}" fill="${it.c ? hex(it.c) : '#2A4B5C'}" stroke="${m.d > t.slots.length ? '#9EC3C0' : 'rgb(0 0 0 / 0.35)'}"${m.d > t.slots.length ? ' stroke-dasharray="3 2"' : ''}/>
        <text x="${x}" y="${(y + r * 0.45).toFixed(1)}" text-anchor="middle" font-size="${(r * 1.25).toFixed(1)}">${H(it.e || '')}</text>
        ${m.tip ? `<text class="tipn" x="${x + r + 7}" y="${y + 5}">${m.tip}</text>` : ''}</g>`;
    };
    box.querySelector('.tsvg').innerHTML = `<svg class="treecount" viewBox="0 0 ${W} ${24 + rows * rh + 4}" aria-label="L'arbre: ${tip === 1 ? '1 punta' : `${tip} puntes`}">
      ${Array.from({ length: L }, (_, d) => `<text class="thead" x="${X(d + 1)}" y="12" text-anchor="middle">${H(name(d))}</text>`).join('')}
      ${edges.map(([a, b]) => `<path class="${fresh(b)}" d="M${X(a.d)} ${Y(a.y)}L${X(b.d)} ${Y(b.y)}"/>`).join('')}
      <circle cx="${X(0)}" cy="${Y(root.y)}" r="6" fill="#F7C64E"/>${nodes.filter(m => m.d).map(node).join('')}</svg>`;
    nodes.forEach(m => seen.add(m.p));
  }
  const touch = g => { grow(g.dataset.p.split('/')); paint(); ping?.(); };
  box.addEventListener('click', e => {
    const b = e.target.closest('.tbtn, [data-m], .grow[data-p]');
    if (!b) return;
    if (b.matches('.tbtn')) { b.hidden = true; box.querySelector('.tpanel').hidden = false; paint(); ping?.(); }
    else if (b.dataset.m) { n = Math.max(1, Math.min(9, n + +b.dataset.m)); box.querySelector('.tmiss b').textContent = n; paint(); ping?.(); }
    else touch(b);
  });
  // a node grows with Enter too, and the keys of the number do not hear it
  box.addEventListener('keydown', e => { const g = e.target.closest?.('.grow[data-p]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); touch(g); } });
}

/* ---------- the other scenes ---------- */
const meterHTML = tap => `<div class="meter"><div class="mline"></div>${METER.map((m, i) => `<div class="mm${tap ? ' hit' : ''}" data-k="m${i}" style="--x:${i * 25}%"${tap ? ` role="button" tabindex="0" aria-label="${m}"` : ''}><i></i><span>${m}</span></div>`).join('')}</div>`;
function treeSVG(a, b) {
  const W = 300, H = Math.max(120, a.length * b.length * 26 + 10), leaves = a.length * b.length, ly = i => 14 + i * (H - 28) / Math.max(1, leaves - 1);
  const ay = j => (ly(j * b.length) + ly(j * b.length + b.length - 1)) / 2;
  const node = (it, x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${it.c ? hex(it.c) : '#2A4B5C'}" stroke="rgb(0 0 0 / 0.35)"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="16">${it.e || ''}</text>`;
  let s = '';
  a.forEach((x, j) => { s += `<path d="M20 ${H / 2}L110 ${ay(j)}" stroke="#9EC3C0" stroke-width="2"/>`; b.forEach((y, k) => { s += `<path d="M110 ${ay(j)}L220 ${ly(j * b.length + k)}" stroke="#9EC3C0" stroke-width="1.6"/>`; }); });
  a.forEach((x, j) => { s += node(x, 110, ay(j), 13); b.forEach((y, k) => { s += node(y, 220, ly(j * b.length + k), 11); s += `<text class="hx" x="${244}" y="${ly(j * b.length + k) + 5}" font-size="12" font-weight="800" fill="#F7C64E">${j * b.length + k + 1}</text>`; }); });
  return `<svg class="treesvg" viewBox="0 0 ${W} ${H}" aria-label="Un arbre de ${a.length} per ${b.length}"><circle cx="20" cy="${H / 2}" r="7" fill="#F7C64E"/>${s}</svg>`;
}
function tableHTML(sc) {
  const lit = new Set(sc.hl);
  return `<table class="tbl${sc.dice ? ' dice' : ''}"><tr><th>${H(sc.corner || '×')}</th>${sc.cols.map(c => `<th>${sc.dice ? dieFace(c, 'mini') : H(c)}</th>`).join('')}</tr>
    ${sc.rows.map((r, i) => `<tr><th${sc.rowc ? ` style="background:${hex(sc.rowc[i])}"` : ''}>${sc.dice ? dieFace(r, 'mini') : H(r)}</th>${sc.cols.map((_, j) => `<td class="${lit.has(sc.dice ? `${i + 1}-${j + 1}` : `${i}-${j}`) ? 'lit' : ''}">${H(sc.cells[i][j])}</td>`).join('')}</tr>`).join('')}</table>`;
}
function crowdSVG(n) {
  const P = Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [Math.cos(a) * 62, Math.sin(a) * 62]; });
  const cs = ['r', 'b', 'g', 'y', 'p', 'r'];
  let lines = '';
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) lines += `<path d="M${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)}L${P[j][0].toFixed(1)} ${P[j][1].toFixed(1)}" stroke="#F7C64E" stroke-width="2"/>`;
  return `<svg class="crowdsvg" viewBox="-86 -86 172 172" aria-label="${n} granotes"><g class="hx">${lines}</g>${P.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="17" fill="${hex(cs[i])}" stroke="rgb(0 0 0 / 0.35)" stroke-width="2"/><text x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}" text-anchor="middle" font-size="20">🐸</text>`).join('')}</svg>`;
}

/* ---------- the map of the fair: nine stalls that light up ---------- */
export function fairMap(el, valid, icons) {
  el.innerHTML = `<div class="fair" role="img" aria-label="La fira: ${valid.length} de 9 parades obertes">${icons.map((ic, i) => `<span class="stall${valid.includes(i) ? ' on' : ''}" style="--d:${i * 0.12}s"><i class="roof"></i><b>${ic}</b></span>`).join('')}</div>`;
}

/* ---------- every scene ---------- */
// Draws the scene sc in board. tap: its things can be touched (a tap question). Returns the api of the scene: answer(v) shows what was
// right; roll() moves it after a right answer; the experiment, the builders and the combinations add their own
export function scene(board, sc, { tap = false } = {}) {
  board.classList.remove('hint');
  let api = { answer() {}, roll: async () => {} };
  if (!sc) { board.innerHTML = ''; return api; }
  if (sc.s === 'dev') board.innerHTML = devScene({ ...sc, tap: tap && sc.tap });
  else if (sc.s === 'many') {
    const tell = d => { const o = outcomes(d).find(x => x.k === sc.c); return `${o ? o.n : 0} de ${ways(d)}`; };
    board.innerHTML = `<div class="scene s-many">${sc.devs.map(d => `<div class="one${tap ? ' hit' : ''}" data-k="${d.k}"${tap ? ` role="button" tabindex="0" aria-label="${d.d === 'bag' ? 'Bossa' : 'Ruleta'} ${d.k.toUpperCase()}"` : ''}><b class="lab">${d.k.toUpperCase()}</b>${devHTML(d, false)}<i class="hx">${tell(d)}</i></div>`).join('')}</div>`;
  } else if (sc.s === 'event') board.innerHTML = `<div class="scene s-event"><span class="big" aria-hidden="true">${sc.e}</span><p class="cap">${H(sc.cap)}</p></div>`;
  else if (sc.s === 'meter') board.innerHTML = `<div class="scene s-meter"><div class="thing small">${devHTML(sc.dev, false)}</div>${meterHTML(tap)}<p class="hx tally">${outcomes(sc.dev).map(o => `${COLORS[o.k] ? COLORS[o.k].m : o.k}: ${o.n}`).join(' · ')} — ${ways(sc.dev)} en total</p></div>`;
  else if (sc.s === 'cards') board.innerHTML = `<div class="scene s-cards">${sc.items.map((it, i) => `<div class="card${tap ? ' hit' : ''}" data-k="${it.k}"${tap ? ' tabindex="0" role="button"' : ''} style="--d:${i * 0.08}s"><span class="em">${it.e}</span><span class="cp">${H(it.cap)}</span><i class="hx">${it.n} de ${it.t}</i></div>`).join('')}</div>`;
  // these keep their own object, so what play() sets on it (locked, changed) reaches the scene
  else if (sc.s === 'exp') api = Object.assign(expScene(board, sc.dev), api);
  else if (sc.s === 'build') api = Object.assign(buildScene(board, sc), api);
  else if (sc.s === 'combo') api = Object.assign(comboScene(board, sc), api);
  else if (sc.s === 'outfit') {
    board.innerHTML = `<div class="scene s-outfit">${sc.groups.map(g => `<div class="grp"><span class="sn">${H(g.name)}: ${g.items.length}</span><span class="row">${g.items.map(it => itemHTML(it)).join('')}</span></div>`).join('')}
    ${sc.groups.length > 1 ? `<p class="hx tally">${sc.groups.map(g => g.items.length).join(' × ')}</p>` : ''}</div>${sc.tree ? '<div class="counter"></div>' : ''}`;
    if (sc.tree) grower(board.querySelector('.counter'), sc.tree, () => api.changed?.());
  }
  else if (sc.s === 'tree') board.innerHTML = `<div class="scene s-tree">${treeSVG(sc.a, sc.b)}</div>`;
  else if (sc.s === 'table') board.innerHTML = `<div class="scene s-table">${tableHTML(sc)}</div>`;
  else if (sc.s === 'crowd') board.innerHTML = `<div class="scene s-crowd">${crowdSVG(sc.n)}</div>`;
  return api;
}
