// The abacus you touch, as a piece of its own: it paints itself, plays its notes when a bead is tapped, and measures itself.
// Several can live on one page (the sheet has three): nothing here is a page id, and the size --u is set on the board's own element.
//
//   board(host, { n, feet, tone }) -> { el, rods(), set(rods), lock(on), feet(mode), onMove(fn), fit(), bead(p, deck, j), rod(p), stop() }
//   host   an element that is attached and has a size of its own (its box does not grow with the board: the stylesheet gives it the
//          rest of the screen, and `contain: size`). The board is appended to it and fits inside it. fit() leaves two custom properties on
//          the host for the stylesheet: --board-min (the board at the floor of --u) and --board-max (the board at the most its width allows),
//          to be used as min-height and, where the host should hug the board, max-height
//   n      columns, 3 to 5. Place p = 0 is the units, drawn on the right.
//   feet   'full' (under each column its digit and what it is worth: 4 and 40), 'letter' (U, D, C, UM, DM) or 'none'. The room under the
//          columns is reserved in all three, so changing the mode never moves the beads.
//   tone   the sound function of voice() in shared/audio.js (freq, delay, length, volume, wave); without one the board is mute
//   rods() / set(rods)   the state lives in the rods ({ lo, hi } per place, units first), never in the DOM: a re-fit keeps every bead
//   onMove(fn)   fn(rods, { p, deck, j, was, bead }) after every tap that moved something
//   bead(p, deck, j) / rod(p)   the elements, which stay the same ones for the life of the board (a re-fit never rebuilds them), so
//          hints.js can lay its layer over them and find them again
//   lock(on)     a locked board ignores taps and takes its beads out of the tab order
//   fit() / stop()   fit measures the box and sets --u; a ResizeObserver calls it by itself; stop disconnects it and the taps
import { pentatonic } from '../../shared/audio.js';
import { rodVal, tap } from './logic.js';

export const HUES = [150, 190, 258, 325, 28], PLACE = ['U', 'D', 'C', 'UM', 'DM'];
export const COL = ['de les unitats', 'de les desenes', 'de les centenes', 'dels milers', 'de les desenes de miler'];
const noteOf = pentatonic(261.63);

// The size of one bead, --u, is the most that fits both ways. Height: the board is a straight line in --u (the decks are multiples of it,
// the frame, the beam and the feet are not), so two measurements at two sizes give the line and the size that fills the box exactly.
// Width: a column needs at least KOL units of room, so the beads never get thinner than that (they are wider than tall, as in the stylesheet).
const MIN = 18, MAX = 44, KOL = 1.7, SAFE = 2;

export function board(host, { n, feet = 'none', tone } = {}) {
  let st = Array.from({ length: n }, () => ({ lo: 0, hi: 0 })), mode = feet, locked = false, fn = null, seen = '';
  const el = document.createElement('div');
  el.className = 'abacus'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Àbac'); el.style.setProperty('--n', n);
  const btn = (p, deck, j) => `<button class="bead" data-p="${p}" data-deck="${deck}" data-j="${j}"></button>`;
  const cols = Array.from({ length: n }, (_, i) => n - 1 - i);   // left to right: the highest place first
  el.innerHTML = `<div class="well">${cols.map(p => `<div class="rod" data-p="${p}" style="--h:${HUES[p]}"><div class="deck hi">${btn(p, 'hi', 0)}</div><div class="beam"></div><div class="deck lo">${[0, 1, 2, 3, 4].map(j => btn(p, 'lo', j)).join('')}</div></div>`).join('')}</div>
    <div class="foot" aria-hidden="true">${cols.map(p => `<span style="--h:${HUES[p]}" data-p="${p}"><b></b><i></i></span>`).join('')}</div>`;
  host.append(el);
  const well = el.firstElementChild, beads = [...el.querySelectorAll('.bead')], rodEls = [...el.querySelectorAll('.rod')], feetEls = [...el.querySelectorAll('.foot span')];
  const bead = (p, deck, j) => beads.find(b => +b.dataset.p === p && b.dataset.deck === deck && +b.dataset.j === j);
  const rod = p => rodEls.find(r => +r.dataset.p === p);

  function draw() {
    for (const b of beads) {
      const p = +b.dataset.p, hi = b.dataset.deck === 'hi', j = +b.dataset.j, on = j < st[p][b.dataset.deck];
      // earth beads that count sit against the beam above them, the heaven bead against the beam below
      b.style.setProperty('--s', hi ? +on : on ? j : j + 1);
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', `Bola ${hi ? 'de dalt' : `de baix ${j + 1}`}, columna ${COL[p]}${on ? ', toca la barra' : ''}`);
      b.tabIndex = locked ? -1 : 0;
    }
    el.classList.toggle('locked', locked);
    for (const s of feetEls) {
      const p = +s.dataset.p, v = rodVal(st[p]), [d, w] = s.children;
      d.textContent = mode === 'full' ? v : ''; d.classList.toggle('over', v > 9);
      w.textContent = mode === 'full' ? v * 10 ** p : mode === 'letter' ? PLACE[p] : '';
      w.classList.toggle('val', mode === 'full');
    }
  }

  // true when --u was set; false when there was nothing to measure (hidden host, or a board whose height does not follow --u),
  // in which case the size from before (or the stylesheet's) stays
  function fit() {
    if (!el.isConnected) return false;
    const W = host.clientWidth, H = host.clientHeight;
    if (!W || !H) return false;   // hidden: the observer calls again when it is shown
    const was = el.style.getPropertyValue('--u');
    const at = u => { el.style.setProperty('--u', u + 'px'); return el.offsetHeight; };   // a custom property has no unit of its own: calc(var(--u) * 2) needs the px
    const h1 = at(10), h2 = at(30), a = (h2 - h1) / 20, b = h1 - 10 * a, pad = el.offsetWidth - well.offsetWidth;
    const uW = Math.max(MIN, Math.min(MAX, (W - pad) / (n * KOL)));   // what the width allows: it does not depend on the height or on how big the board was
    const u = Math.max(MIN, Math.min(uW, (H - b - SAFE) / a));
    if (!(a > 0) || !Number.isFinite(u)) { was ? el.style.setProperty('--u', was) : el.style.removeProperty('--u'); return false; }
    el.style.setProperty('--u', Math.floor(u * 4) / 4 + 'px');
    // what the host has to be, for the stylesheet to use: never smaller than the board at the floor (then the page grows, it never overlaps),
    // and where the host would take the free height of the screen, no taller than the board at the most the width allows (so the buttons stay under it)
    host.style.setProperty('--board-min', Math.ceil(a * MIN + b + SAFE) + 'px');
    host.style.setProperty('--board-max', Math.ceil(a * uW + b + SAFE) + 'px');
    return true;
  }
  // runs again only when the box really changed (it is also what a rotation or a resized window does)
  const ro = new ResizeObserver(() => { const k = host.clientWidth + 'x' + host.clientHeight; if (k !== seen && fit()) seen = k; });
  ro.observe(host);

  const click = e => {
    const b = e.target.closest('.bead'); if (!b || locked || !el.contains(b)) return;
    const p = +b.dataset.p, deck = b.dataset.deck, j = +b.dataset.j, was = st[p][deck];
    st = tap(st, p, deck, j); draw();
    if (tone) tone(noteOf(p * 2 + (deck === 'hi' ? 4 : 0) + st[p][deck]), 0, 0.16, 0.08, 'triangle');
    if (fn) fn(st, { p, deck, j, was, bead: b });
  };
  el.addEventListener('click', click);

  draw(); fit();
  return {
    el, bead, rod, fit,
    rods: () => st,
    set(r) { st = r; draw(); },
    lock(on) { locked = !!on; draw(); },
    feet(m) { mode = m; draw(); },
    onMove(f) { fn = f; },
    stop() { ro.disconnect(); el.removeEventListener('click', click); fn = null; }
  };
}
