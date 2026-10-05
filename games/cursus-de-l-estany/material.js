// The material that moves: one function per figure, each filling a host element for one question. Added so far: fireflies; grid, bars and
// chunks come on the same pattern. Cancelling: every figure needs the screen's token t (what fresh() in main.js returns; it throws without one) and
// checks t.on after every wait, so a screen that was left fires and saves nothing afterwards. A figure also has its own stop(), and a new figure on
// the same host stops the one that was there, so a stale instance can never fire its callbacks. Results come back through callbacks (onDone ...).
//
// THE CONTRACT of a figure: fn(host, q, { t, onDone, onMiss }) -> { stop(), solve(), ... }
//   host   an element that is attached and visible: figures measure it, so a screen builds a hidden figure only when it is shown
//   onDone the child is done moving the material (what a `hands` question waits for before the keypad opens)
//   solve() the figure shows itself solved, whatever the child did: stops it first (nothing fires afterwards), then draws the whole arrangement
// FIGURES says which figure a mode has. A mode that is not here has no material: the screen opens the keypad on its own, also under `hands`.
import { $, RM, sleep } from '../../shared/util.js';
import { want } from './logic.js';

const FLIGHT = 320;   // ms a firefly takes to cross to its pad
const LIVE = new WeakMap();   // host -> the figure now on it

// D fireflies and d lily pads. A tap on a pad sends one firefly to it; when none are left, onDone() if every pad holds the same number, else onMiss(),
// the fireflies come back and the child tries again. q is { D, d } (and mode): 'share' is the above; 'group' and 'rem' have no pads but a button,
// "Fes un grup de d", that moves d fireflies into a new ring. They are done when fewer than d are left; a remainder stays apart in the source
// ('rem', and the figure counts as done in that state). Returns { counts(), stop(), solve() }: how many fireflies each pad holds now
// (landed or not; the groups made, for the two modes with groups), and the cancel and the solved state of this instance.
export function fireflies(host, q, { t, onDone = () => {}, onMiss = () => {} } = {}) {
  if (!t) throw new Error('fireflies needs the token of the screen (t)');
  LIVE.get(host)?.stop();
  const { D, d } = q, size = D <= 12 ? 24 : D <= 24 ? 18 : 13, small = Math.max(11, Math.round(size * 0.7)), groups = q.mode === 'group' || q.mode === 'rem';
  let left, n, made, flying, locked, stopped = false;
  const live = () => t.on && !stopped, stop = () => { stopped = true; };
  LIVE.set(host, { stop });
  // --s sizes the fireflies at rest, --ps the ones on a pad or in a ring; --pc is the pads per row (two rows at most on a phone), --gw the fireflies per row of a ring
  host.innerHTML = `<div class="fly" style="--s:${size}px;--ps:${small}px;--pc:${d > 5 ? Math.ceil(d / 2) : d};--gw:${d > 5 ? Math.ceil(d / 2) : d}">
    <div class="fsrc" role="img" aria-label="Les cuques de llum"></div>
    ${groups ? `<p class="fcap" hidden></p><button class="btn soft fmk">Fes un grup de ${d}</button><div class="fgroups"></div>`
      : `<div class="fpads">${Array.from({ length: d }, (_, i) => `<button class="fpad" data-i="${i}" aria-label="Nenúfar ${i + 1}"><span class="fbugs"></span></button>`).join('')}</div>`}</div>`;
  const wrap = $('.fly', host), src = $('.fsrc', wrap), pads = [...wrap.querySelectorAll('.fpad')], mk = $('.fmk', wrap), ring = $('.fgroups', wrap), cap = $('.fcap', wrap);
  const bug = () => '<i class="ff"></i>', bugs = k => Array.from({ length: k }, bug).join('');
  const padLabel = i => pads[i].setAttribute('aria-label', n[i] ? `Nenúfar ${i + 1}: ${n[i]} ${n[i] === 1 ? 'cuca' : 'cuques'}` : `Nenúfar ${i + 1}`);
  const ringHtml = m => `<div class="fgrp" role="img" aria-label="Grup ${m}: ${d} cuques">${bugs(d)}</div>`;
  // with groups: once no more can be made the button goes, and what is left stays apart in the source under its label
  function groupsEnd() {
    const more = left >= d;
    mk.hidden = !more; src.hidden = !left; src.classList.toggle('spare', !more && left > 0); cap.hidden = more || !left;
    cap.textContent = left === 1 ? 'La que sobra' : 'Les que sobren';
    if (!more) src.style.minHeight = '';
  }
  // everything back at the start; the source keeps the height of its full rows so what is under it does not move up as it empties
  function reset(arrive) {
    left = D; n = Array(d).fill(0); made = 0; flying = 0; locked = false; wrap.classList.remove('leave');
    src.hidden = false; src.style.minHeight = ''; src.innerHTML = bugs(D); src.classList.remove('spare'); src.classList.toggle('arrive', !!arrive);
    src.style.minHeight = src.offsetHeight + 'px';
    if (groups) { ring.innerHTML = ''; mk.hidden = false; cap.hidden = true; }
    pads.forEach((p, i) => { $('.fbugs', p).innerHTML = ''; padLabel(i); });
  }
  async function verdict() {
    locked = true;
    if (n.every(x => x === n[0])) return onDone();
    onMiss(); wrap.classList.add('shake'); await sleep(RM ? 0 : 700); if (!live()) return;
    wrap.classList.remove('shake'); wrap.classList.add('leave'); await sleep(RM ? 0 : 400); if (!live()) return;
    reset(true);
  }
  async function send(i) {
    if (locked || !left) return;
    const from = src.querySelector('.ff:last-child'), w = wrap.getBoundingClientRect(), a = from.getBoundingClientRect(), p = pads[i].getBoundingClientRect();
    left--; flying++; n[i]++;
    const fl = document.createElement('i');
    fl.className = 'ff flier'; fl.style.cssText = `left:${a.left - w.left}px;top:${a.top - w.top}px;width:${a.width}px;height:${a.height}px`;
    wrap.append(fl); from.remove(); void fl.offsetWidth;
    const k = small / a.width;
    fl.style.transform = `translate(${p.left + p.width / 2 - a.left - a.width / 2}px, ${p.top + p.height / 2 - a.top - a.height / 2}px) scale(${k})`;
    await sleep(RM ? 0 : FLIGHT); if (!live()) return;
    fl.remove(); $('.fbugs', pads[i]).insertAdjacentHTML('beforeend', bug()); padLabel(i);
    flying--; if (!left && !flying) verdict();
  }
  function group() {
    if (locked || left < d) return;
    [...src.querySelectorAll('.ff')].slice(-d).forEach(f => f.remove());
    left -= d; made++; n[0] = made; ring.insertAdjacentHTML('beforeend', ringHtml(made)); groupsEnd();
    if (left < d) { locked = true; onDone(); }
  }
  function solve() {
    stop(); locked = true; wrap.querySelectorAll('.flier').forEach(f => f.remove()); wrap.classList.remove('shake', 'leave');
    src.classList.remove('arrive'); src.style.minHeight = '';
    if (groups) {
      left = D % d; made = Math.floor(D / d); n[0] = made; src.innerHTML = bugs(left); ring.innerHTML = Array.from({ length: made }, (_, m) => ringHtml(m + 1)).join(''); groupsEnd();
    } else {
      left = 0; n = Array.from({ length: d }, (_, i) => Math.floor(D / d) + (i < D % d ? 1 : 0)); src.innerHTML = ''; src.hidden = true;
      pads.forEach((p, i) => { $('.fbugs', p).innerHTML = bugs(n[i]); padLabel(i); });
    }
  }
  wrap.onclick = e => {
    if (!live()) return;
    const b = e.target.closest('.fpad');
    if (b) send(+b.dataset.i); else if (e.target.closest('.fmk')) group();
  };
  reset(false);
  return { counts: () => n.slice(), stop, solve };
}

export const FIGURES = { share: fireflies, group: fireflies, rem: fireflies };
// what to do with the material of a `hands` question, in the words of its figure
export const how = q => q.mode === 'share' ? 'Toca un nenúfar: hi vola una cuca. Quan les hagis repartides totes, escriu la resposta.'
  : `Prem «Fes un grup de ${q.d}» fins que no en puguis fer més.${q.mode === 'rem' ? ' Les que no arriben per fer un grup es queden a part.' : ''} Després escriu la resposta.`;

/* ---------- where the child writes: the pad of keys and the boxes of the answer ---------- */
// the 12 keys, as in Nenúfars a trossos; every one has data-k (digits, 'del', 'ok')
export const KEYS = `<div class="keys">${[1, 2, 3, 4, 5, 'del', 6, 7, 8, 9, 0, 'ok'].map(k =>
  `<button class="key${typeof k === 'number' ? '' : ' ' + k}" data-k="${k}"${k === 'del' ? ' aria-label="Esborra"' : k === 'ok' ? ' aria-label="Comprova"' : ''}>${k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}</button>`).join('')}</div>`;
// One box for each number want(q) asks for: a scalar is one box, a list is one per entry, in that order. hosts is the element they all go into
// (cleared first) or a list with one element for each box, which is left as it is: the boxes need not be siblings (chunks put them under the pieces).
// The caller routes taps: a [data-slot] under it is B.pick(slot), keys go to B.key(k). Returns B: { els, at, pick(i), key(k), ans(), clear() };
// ans() is the answer in the shape right() wants (a number, or a list of numbers in want order; '07' is 7), null while any box is empty.
export function boxes(hosts, q, labels = []) {
  const w = want(q), n = Array.isArray(w) ? w.length : 1, vals = Array(n).fill(''), els = [];
  const hs = Array.isArray(hosts) ? hosts : Array(n).fill(hosts);
  if (!Array.isArray(hosts)) hosts.innerHTML = '';
  hs.forEach((h, i) => {
    h.insertAdjacentHTML('beforeend', `<span class="bx">${labels[i] ? `<span class="lab">${labels[i]}</span>` : ''}<output class="in" data-slot="${i}" aria-label="${labels[i] || `Casella ${i + 1}`}"></output></span>`);
    els.push(h.lastElementChild.querySelector('output'));
  });
  const B = {
    els, at: 0,
    paint() { els.forEach((e, i) => { e.textContent = vals[i]; e.classList.toggle('cur', i === B.at); }); },
    pick(i) { if (i >= 0 && i < n) { B.at = i; B.paint(); } },
    // 'next' and 'prev' move between boxes (the arrow keys); a box takes three digits at most
    key(k) {
      if (k === 'next' || k === 'prev') B.at = (B.at + (k === 'next' ? 1 : n - 1)) % n;
      else vals[B.at] = k === 'del' ? vals[B.at].slice(0, -1) : (vals[B.at] + k).slice(0, 3);
      B.paint();
    },
    ans() { return vals.every(v => v !== '') ? (Array.isArray(w) ? vals.map(Number) : +vals[0]) : null; },
    clear() { vals.fill(''); B.at = 0; B.paint(); }
  };
  B.paint();
  return B;
}
