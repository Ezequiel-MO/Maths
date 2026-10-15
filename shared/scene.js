// The moving pictures of the games. A picture that moves belongs to the screen it is on: its loop of animation frames runs while
// the screen is on show (the token t that fresh() of shared/shell.js gives) and its element is on the page, and it stops by itself
// when either goes, so nothing keeps drawing behind the map. A picture drawn with a library (Three.js, JSXGraph, a canvas of its
// own) hangs from the same loop: its frame function draws one frame and says whether to go on.
//
//   const F = frames(t, svg, dt => { yaw += dt * 0.5; draw(); });   F.start();
//
// Nothing here knows of a game. util.js RM (reduced motion) is for the game to look at: a picture that only decorates should not
// start its loop with it, and a picture that explains should settle at once.

export const NS = 'http://www.w3.org/2000/svg';
// an SVG element with its attributes (and its text)
export function svgEl(tag, attrs = {}, text = null) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}
// a number for an SVG attribute: one decimal is enough for a screen
export const fmt = (x, d = 1) => x.toFixed(d);

// Calls frame(dt, now) on every animation frame while t.on and el is on the page. dt is the seconds since the frame before, at most
// max, so a tab that comes back does not make things jump; a frame with no time at all gets idle. frame returns false to rest, and
// start() wakes the loop again (it does nothing while the loop runs). The clock starts with start(); with still it starts at the
// first frame instead, which then has dt 0 and draws the picture as it is.
export function frames(t, el, frame, { max = 0.05, idle = 0, still = false } = {}) {
  let raf = 0, last = 0;
  const tick = now => {
    raf = 0;
    if (!t.on || !el.isConnected) return;
    const dt = Math.min(max, (now - last) / 1000) || idle; last = now;
    if (frame(dt, now) !== false) raf = requestAnimationFrame(tick);
  };
  return {
    start() {
      if (raf || !t.on) return;
      if (still) raf = requestAnimationFrame(now => { last = now; tick(now); });
      else { last = performance.now(); raf = requestAnimationFrame(tick); }
    },
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; },
    get running() { return raf !== 0; }
  };
}

// A move of dur milliseconds: step(k) with k from 0 to 1, the first one at once (k is 1 at once when dur is 0). The promise
// resolves after the step with k = 1
export function tween(dur, step, t0 = performance.now()) {
  return new Promise(done => {
    (function frame(now) {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      step(k);
      k < 1 ? requestAnimationFrame(frame) : done();
    })(t0);
  });
}
