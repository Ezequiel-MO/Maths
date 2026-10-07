// The hints, drawn over the abacus: a layer of its own inside the board's element (so it is placed from the board and moves with it,
// whatever the page does around it), with pointer-events: none, so the beads can be touched while a hint is showing.
//
//   hints(b) -> { strip(target), show(move, target), play(target, on), stop() }
//   b            a board (board.js)
//   strip(t)     the value strip: every lit bead carries what it is worth (1, 10, 100; the heaven bead 5, 50, 500) and the sum of what the
//                abacus marks is written in the colour of each column (300 + 40 + 7 = 347). With a t, under it, the sum of what it has to mark
//   show(m, t)   the drawing of the move m ({ p, deck, to, why } of nextMove) as the table «Les pistes» of the spec says, with the strip.
//                t is the number the abacus has to mark: a borrow does not say its digit, and it is worked out from t
//   play(t, on)  solves the abacus step by step with nextMove; on() returning false stops it; a promise. The board is locked while it
//                runs (a tap would leave it in a value that is not the result) and gets its old lock back at the end
//   stop()       clears every layer, stops the loops, and stops a play that is running
// The hint is of the abacus as it was when it was drawn: when a bead moves (a tap, a set()) it is cleared (a hint for a state that no longer
// is would point at the wrong bead), and when the board changes size it is drawn again from the same state, on the same beads.
// Where everything goes comes from the layout of the board (the deck of a column, the slot of a bead and --u), never from where a bead is
// at this moment (they glide for 0.2s), and is written in pixels of the board's own element.
import { HUES } from './board.js';
import { rodVal, valueOf, tidy, write, nextMove } from './logic.js';
import { sleep } from '../../shared/util.js';

const LOOK = 1700, GLIDE = 450;   // ms: a step of play shows its drawing for LOOK, then the beads move and rest for GLIDE
const rm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// the terms of the sum of rods, left to right, as [value, place]; none lit gives a single 0
const terms = rods => {
  const t = rods.map((r, p) => [rodVal(r) * 10 ** p, p]).filter(x => x[0]).reverse();
  return t.length ? t : [[0, 0]];
};

export function hints(b) {
  const el = b.el, layer = document.createElement('div');
  layer.className = 'hints'; layer.setAttribute('aria-hidden', 'true');
  el.append(layer);
  // what is showing: the strip (t is the second line of it, or null), the move and the state they were drawn for
  let on = null, gen = 0, held = null;
  const snapOf = () => JSON.stringify(b.rods());

  const node = (cls, css, text) => {
    const e = document.createElement('div'); e.className = cls;
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  };
  const px = v => Math.round(v * 10) / 10 + 'px';

  // the place of a bead: the centre of the slot (counted from the top of its deck, as board.js does) in the board's own element
  function spot(p, deck, slot) {
    const ref = b.bead(p, deck, 0), dk = ref.parentElement, er = el.getBoundingClientRect(), dr = dk.getBoundingClientRect(), u = parseFloat(el.style.getPropertyValue('--u')) || 28;
    return { x: dr.left + dr.width / 2 - er.left - el.clientLeft, y: dr.top - er.top - el.clientTop + ref.offsetTop + slot * u + ref.offsetHeight / 2, w: ref.offsetWidth, h: ref.offsetHeight };
  }
  // the slot a bead stands in now (on: against the beam), and the other one
  const slotOf = (deck, j, onNow) => deck === 'hi' ? +onNow : onNow ? j : j + 1;
  const sum = (rods, cls) => {
    const l = node('hl ' + cls);
    terms(rods).forEach(([v, p], i) => {
      if (i) l.append(document.createTextNode(' + '));
      const s = document.createElement('span'); s.style.setProperty('--h', HUES[p]); s.textContent = v; l.append(s);
    });
    l.append(document.createTextNode(` = ${valueOf(rods)}`));
    return l;
  };

  function render() {
    layer.replaceChildren();
    if (!on || !el.offsetWidth) return;
    const rods = b.rods(), n = rods.length, m = on.move, add = e => layer.append(e), covered = new Set();
    // a ghost on the bead (p, deck, j), going to the slot (dp, ddeck, dslot) (by default the other place of its own deck); the arrow says which way
    const ghost = (p, deck, j, tone, dest, arrow = true) => {
      const onNow = deck === 'hi' ? rods[p].hi > 0 : j < rods[p][deck], s0 = spot(p, deck, slotOf(deck, j, onNow));
      const d = dest || { p, deck, slot: slotOf(deck, j, !onNow) }, s1 = spot(d.p, d.deck, d.slot), dx = s1.x - s0.x, dy = s1.y - s0.y;
      const g = node('ghost ' + tone, `left:${px(s0.x - s0.w / 2)};top:${px(s0.y - s0.h / 2)};width:${px(s0.w)};height:${px(s0.h)};--fx:${px(dx)};--fy:${px(dy)}`, arrow ? (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? '◀' : '▶') : dy < 0 ? '▲' : '▼') : '');
      g.dataset.p = p; g.dataset.deck = deck; g.dataset.j = j; add(g); covered.add(`${p}${deck}${j}`);
    };
    // the next bead that goes up in column q (a heaven bead when the earth ones are all up), or null
    const nextUp = q => q < 0 || q >= n ? null : rods[q].lo < 5 ? { deck: 'lo', j: rods[q].lo } : !rods[q].hi ? { deck: 'hi', j: 0 } : null;
    const put = q => { const x = nextUp(q); if (x) ghost(q, x.deck, x.j, 'put'); };
    // the label of an exchange, in the free slot at the foot of the column (five earth beads up leave the sixth slot of the deck empty)
    const label = (p, txt) => { const s = spot(p, 'lo', 5); add(node('hlab', `left:${px(s.x)};top:${px(s.y)};--h:${HUES[p]}`, txt)); };
    const card = [];
    if (m) {
      const p = m.p, deck = m.deck, up = m.to > rods[p][deck], r = rods[p];
      const own = () => ghost(p, deck, deck === 'hi' ? 0 : up ? m.to - 1 : m.to, up ? 'put' : 'take');
      if (m.why === 'add' || m.why === 'take') own();
      else if (m.why === 'five') {
        const home = { p, deck: 'hi', slot: 1 };
        for (let j = 0; j < r.lo; j++) ghost(p, 'lo', j, 'take', home, false);
        ghost(p, 'hi', 0, 'put'); label(p, '5 → 1');
      } else if (m.why === 'ten') {
        const x = nextUp(p + 1), home = x && { p: p + 1, deck: x.deck, slot: slotOf(x.deck, x.j, true) };
        for (let j = 0; j < r.lo; j++) ghost(p, 'lo', j, 'take', home, false);
        if (r.hi) ghost(p, 'hi', 0, 'take', home, false);
        put(p + 1); label(p, '10 → 1');
      } else if ((m.why === 'more' || m.why === 'less') && deck === 'lo') {
        own(); ghost(p, 'hi', 0, up ? 'take' : 'put');
        card.push(m.why === 'more' ? `+${m.d} = +5 −${5 - m.d}` : `−${m.d} = −5 +${5 - m.d}`);
      } else if (m.why === 'carry') {
        own(); put(p + 1);
        card.push(`+${m.d} = +10 −${10 - m.d}`);
      } else if (m.why === 'borrow') {
        own();
        // the own column q and the digit d come from the difference (nextMove does not say them). The move is on column p, further left (p > q):
        // one bead there is 10^(p-q) of the own column (five times that when it is the heaven bead), so the card says -d = -that + (that - d): -3 = -10 +7 next door, -1 = -100 +99 two columns away
        const diff = on.goal == null ? 0 : valueOf(rods) - on.goal;
        if (diff > 0) {
          const q = Math.min(String(diff).length - 1, n - 1), d = Math.min(10, Math.floor(diff / 10 ** q)), big = 10 ** (p - q) * (deck === 'hi' ? 5 : 1);
          if (p > q) { put(q); card.push(`−${d} = −${big} +${big - d}`); }
        }
      }
    }
    // what each lit bead is worth, under the ghosts (a ghost on a bead says enough about it)
    const worth = [];
    rods.forEach((r, p) => {
      const lit = (deck, j, v) => {
        if (covered.has(`${p}${deck}${j}`)) return;
        const s = spot(p, deck, slotOf(deck, j, true)); worth.push(node('hv', `left:${px(s.x)};top:${px(s.y)};--h:${HUES[p]}`, v));
      };
      for (let j = 0; j < r.lo; j++) lit('lo', j, 10 ** p);
      if (r.hi) lit('hi', 0, 5 * 10 ** p);
    });
    layer.prepend(...worth);
    // under the abacus (on the room the feet keep): what is shown and what it has to show
    const panel = node('hpanel');
    if (card.length) panel.append(node('hl hcard', null, card[0]));
    panel.append(sum(rods, 'hnow'));
    if (on.t != null) panel.append(sum(write(on.t, n), 'hgoal'));
    add(panel);
  }
  // clear: only the drawing; stop: everything, and a play that is running
  const clear = () => { on = null; layer.replaceChildren(); };
  function open(patch) {
    // strip() and show() add up while the board is the one the hint was drawn for; a board that changed since (the observer has not run yet when
    // this is called in the same tick as a set()) starts from nothing, so a ghost of the old state can never be carried onto the new one
    on = { t: null, move: null, goal: null, ...(on && on.snap === snapOf() ? on : {}), ...patch, snap: snapOf() };
    render();
  }

  // the state of the beads is the truth: what changes it (a tap, a set()) clears the hint; the observer is asked after, so a lock or a feet
  // change that leaves the beads where they were keeps it. A new size draws the same state again.
  const mo = new MutationObserver(() => { if (on && on.snap !== snapOf()) clear(); });
  mo.observe(el.firstElementChild, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
  const ro = new ResizeObserver(() => { if (on) render(); });
  ro.observe(el);

  function stop() {
    gen++; clear();
    if (held !== null) { b.lock(held); held = null; }
  }
  async function play(target, ok = () => true) {
    const my = ++gen, live = () => my === gen && ok() && el.isConnected;
    if (held === null) held = el.classList.contains('locked');
    b.lock(true);
    for (let i = 0; i < 80 && live(); i++) {
      const rods = b.rods(), m = nextMove(rods, target);
      if (!m) break;
      open({ move: m, goal: target }); await sleep(LOOK);
      if (!live()) break;
      clear(); b.set(rods.map((r, q) => q === m.p ? { ...r, [m.deck]: m.to } : { ...r }));
      await sleep(rm() ? 150 : GLIDE);
    }
    // the way ended before the number was reached (a move nextMove does not give): the abacus still ends up marking the result
    if (live() && (valueOf(b.rods()) !== target || !tidy(b.rods()))) b.set(write(target, b.rods().length));
    if (my === gen) { clear(); if (held !== null) { b.lock(held); held = null; } }
  }
  return {
    strip: t => open({ t: t ?? null }),
    show: (m, t) => open({ move: m || null, goal: t ?? null }),
    play, stop
  };
}
