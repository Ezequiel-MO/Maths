// The ear of the drum kit: the microphone hears the child's own electronic drums, finds each hit and tells which pad sounded.
// Every pad of a kit plays the same recorded sound each time, louder or softer, so the game learns them first: the child hits each
// pad three times and the game keeps the shape of its sound (how its energy spreads from the low notes to the high ones). After that,
// a hit is the pad whose shape it is closest to, or two pads hit together: the shape of a mix of two. Everything up to judge() is
// numbers only, nothing of the page, so it runs in Node too; the microphone is at the end.

// A hit is looked at in windows of N samples, one every HOP: 21 ms seen every 5 ms at 48 000 samples a second
export const N = 1024, HOP = 256;
// the bands its energy is cut into, in Hz: narrow at the bottom, where the drums differ by a few notes, wide at the top, where cymbals hiss
export const EDGES = [50, 100, 150, 200, 260, 330, 420, 530, 670, 850, 1070, 1350, 1700, 2150, 2700, 3400, 4300, 5400, 6800, 8600, 10800, 13600, 17000];
export const NB = EDGES.length - 1;

// The FFT of N points, worked out in place (the iterative radix 2 of every textbook): re, im in, the spectrum out
function fftOf(n) {
  const bits = Math.log2(n), rev = new Uint32Array(n), cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = -Math.sin(2 * Math.PI * i / n); }
  return (re, im) => {
    for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let i = 0; i < n; i += size) for (let j = 0, k = 0; j < half; j++, k += step) {
        const a = i + j, b = a + half, tr = re[b] * cos[k] - im[b] * sin[k], ti = re[b] * sin[k] + im[b] * cos[k];
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
  };
}

// What makes a hit: how much the WIDE bands that jump most must jump at once (in dB, on average: a charles only lights the top few
// bands), and how long one hit lasts before another can start (two pads hit closer than that are heard as one hit of both). A hit
// must also bring LOUD times the energy of the room: what is softer is the end of a sound that was cut, or a breath
export const RISE = 9, WIDE = 6, MERGE = 0.045, LOUD = 6;
// the energy of a band under which it is silence: about what the last bit of 16-bit sound leaves in it
const QUIET = 1e-7;
// The shape of a hit comes from a longer window, L samples from just before it starts (PRE): 85 ms, long enough to tell the low
// drums apart, which differ by a few notes. The window rises fast and falls slowly, so it weighs most the first ms of the hit, where
// a charles is: a click that the long tail of a caixa would hide. What was already sounding is the same window turned round over the
// samples just before the hit (it weighs most the last ones), and is taken away
export const L = 4096, PRE = 384;
const RISEN = 2 * PRE, rising = Float64Array.from({ length: L }, (_, i) => i < RISEN ? 0.5 - 0.5 * Math.cos(Math.PI * i / RISEN) : 0.5 + 0.5 * Math.cos(Math.PI * (i - RISEN) / (L - RISEN)));
const falling = rising.slice().reverse();

// the energy of each band in a spectrum of n points
const bandsOf = (sr, n) => {
  const df = sr / n;
  return EDGES.slice(0, -1).map((lo, b) => { const a = Math.max(1, Math.ceil(lo / df)), z = Math.min(n / 2, Math.ceil(EDGES[b + 1] / df)); return [a, Math.max(a + 1, z)]; });
};
const hann = n => Float64Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n));
function spectrum(fft, win, bins, ring, from) {
  const n = win.length, re = new Float64Array(n), im = new Float64Array(n), R = ring.length, E = new Float64Array(NB);
  for (let i = 0; i < n; i++) re[i] = ring[(((from + i) % R) + R) % R] * win[i];
  fft(re, im);
  bins.forEach(([a, z], b) => { let s = 0; for (let k = a; k < z; k++) s += re[k] * re[k] + im[k] * im[k]; E[b] = s; });
  return E;
}

// The detector: push() takes the next samples as they come and gives back the hits that are over, { at, f, level, snr }: at is the
// sample the hit started on (counted from the first one pushed), f the energy each band gained with it, level its sum and snr how
// many times louder it was than the room. Every HOP samples the bands of the last N are compared with how they were a whole window
// before, so a hit over a cymbal that still rings is heard too. A slow floor follows the noise of the room, so a hum is not a hit
export function oida(sr) {
  const fft = fftOf(N), fftL = fftOf(L), win = hann(N), bins = bandsOf(sr, N), binsL = bandsOf(sr, L);
  const R = 4 * L, ring = new Float64Array(R), past = [], merge = Math.round(MERGE * sr / HOP), wait = [];
  let count = 0, hop = 0, floor = null, quiet = 0;
  function push(x) {
    const out = [];
    for (let i = 0; i < x.length; i++) {
      ring[count % R] = x[i]; count++;
      // a hit whose long window is complete
      while (wait.length && count >= wait[0].at - PRE + L) {
        const h = wait.shift(), E = spectrum(fftL, rising, binsL, ring, h.at - PRE), B = spectrum(fftL, falling, binsL, ring, h.at - PRE - L), f = new Float64Array(NB);
        for (let b = 0; b < NB; b++) f[b] = Math.max(0, E[b] - B[b]);
        const level = f.reduce((a, v) => a + v, 0), snr = level / (h.floor * L / N);
        if (snr >= LOUD) out.push({ at: h.at, f, level, snr });
      }
      if (count % HOP || count < N) continue;
      const E = spectrum(fft, win, bins, ring, count - N); hop++;
      // digital silence, as a browser gives before the microphone is really on: nothing to hear, and nothing to learn of the room
      if (E.reduce((a, v) => a + v, 0) < NB * QUIET) { past.length = 0; continue; }
      if (!floor) floor = E.map(v => Math.max(v, QUIET));
      const before = past.length >= 5 ? past[past.length - 4].map((v, b) => Math.max(v, past[past.length - 5][b])) : null;
      if (before && hop >= quiet && count > L + PRE) {
        const up = Array.from(E, (v, b) => 10 * Math.log10((v + 2 * floor[b] + 1e-12) / (before[b] + 2 * floor[b] + 1e-12))).sort((a, b) => b - a);
        if (up.slice(0, WIDE).reduce((a, v) => a + v, 0) / WIDE > RISE) { wait.push({ at: count - HOP, floor: floor.reduce((a, v) => a + v, 0) + 1e-12 }); quiet = hop + merge; }
      }
      // the floor comes down at once to a quieter frame and goes up slowly, about 2 dB a second: a cymbal that rings does not lift it
      for (let b = 0; b < NB; b++) floor[b] = Math.max(QUIET, E[b] < floor[b] ? 0.8 * floor[b] + 0.2 * E[b] : floor[b] * (1 + 0.4 * HOP / sr));
      past.push(E); if (past.length > 8) past.shift();
    }
    return out;
  }
  return { push };
}

/* ---------- what a hit was ---------- */
// The shape of a hit is its bands as shares of the whole, compared on a log scale, so a soft hit has the same shape as a hard one
// and the quiet bands count as much as the loud ones. EPS is the share under which a band is as good as silent
const EPS = 0.002;
export const shape = f => { const s = f.reduce((a, v) => a + v, 0) || 1; return Array.from(f, v => v / s); };
const logs = s => s.map(v => Math.log10(v + EPS));
// how far the shape lx (already in logs) is from the shape m: the mean gap of their bands, in tenths of dB… in powers of ten
const far = (lx, m) => { let d = 0; for (let b = 0; b < NB; b++) d += Math.abs(lx[b] - Math.log10(m[b] + EPS)); return d / NB; };
// the shares of a mix of two pads tried for a hit of both: one can be much softer than the other (a charles over a bombo)
const MIX = [0.03, 0.06, 0.1, 0.15, 0.22, 0.3, 0.4, 0.5, 0.6, 0.7, 0.78, 0.85, 0.9, 0.94, 0.97];

// What the game keeps of a kit, learnt from three hits of each pad: { pads: { pad: shape }, spread, level }. spread is how far a hit
// was, on average, from the shape of its own pad, and level the usual loudness of a hit (what is much softer is not a hit of the kit)
export function learn(hits) {
  const pads = {}, gaps = [], levels = [];
  for (const [pad, fs] of Object.entries(hits)) {
    const ss = fs.map(f => shape(f)), m = Array.from({ length: NB }, (_, b) => ss.reduce((a, s) => a + s[b], 0) / ss.length);
    pads[pad] = m;
    ss.forEach(s => gaps.push(far(logs(s), m)));
    fs.forEach(f => levels.push(f.reduce((a, v) => a + v, 0)));
  }
  const mid = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] || 0;
  return { v: 1, pads, spread: gaps.length ? gaps.reduce((a, v) => a + v, 0) / gaps.length : 0.1, level: mid(levels) };
}
// how far one hit of a pad is from what the others of the same pad gave: the one that lies far away was another pad, or a knock
export const gap = (f, fs) => far(logs(shape(f)), learn({ x: fs }).pads.x);
// how far apart two pads of a kit learnt sound: two that are very close may be taken for each other
export const apart = (cal, a, b) => far(logs(cal.pads[a]), cal.pads[b]);

// The judge of a kit learnt as above. is maps each pad to what it is (the two cymbals of a kit are both a plat). For a hit f and
// the set of things it should be, want (one thing, or two hit together), it gives { got, best }: got is the set it hears, or null
// for a sound that is no pad at all (a voice, a knock), and best what it would say with nothing expected. A hit of two is only
// heard when it is clearly closer than any one pad alone (PAIR). got is want itself when want is as many things as best and sounds
// nearly as close (LEEWAY): a child is not told wrong for a hit the ear is unsure of, but one pad is never taken for two, nor two for one
export const PAIR = 0.02, LEEWAY = 0.06, LOST = 0.5, SOFT = 0.03;
export function judge(cal, is) {
  const pads = Object.keys(cal.pads).filter(p => is[p]), lost = Math.max(LOST, 4 * cal.spread);
  return (f, want = []) => {
    if (f.reduce((a, v) => a + v, 0) < SOFT * cal.level) return { got: null, best: null, soft: true };
    const lx = logs(shape(f)), one = {}, two = {};
    for (const p of pads) { const d = far(lx, cal.pads[p]); one[is[p]] = Math.min(one[is[p]] ?? Infinity, d); }
    pads.forEach((p, i) => pads.slice(i + 1).forEach(q => {
      if (is[p] === is[q]) return;
      const A = cal.pads[p], B = cal.pads[q], key = [is[p], is[q]].sort().join('+');
      let d = Infinity;
      for (const a of MIX) d = Math.min(d, far(lx, A.map((v, b) => a * v + (1 - a) * B[b])));
      two[key] = Math.min(two[key] ?? Infinity, d);
    }));
    // the pair the child is asked for pays half the price of a pair: a charles over a caixa is a faint trace, and it is expected
    const ws = [...new Set(want)].sort(), key = ws.join('+'), size = k => k.split('+').length, all = [...Object.keys(one), ...Object.keys(two)];
    const score = (k, w) => k.includes('+') ? two[k] + (k === w ? PAIR / 2 : PAIR) : one[k];
    const top = w => all.reduce((b, k) => b === null || score(k, w) < score(b, w) ? k : b, null);
    const best = top(''), first = top(key);
    if (best === null || score(best, '') > lost) return { got: null, best: null };
    const got = ws.length && size(key) === size(first) && score(key, key) <= score(first, key) + LEEWAY ? key : first;
    return { got: new Set(got.split('+')), best: new Set(best.split('+')), one, two };
  };
}

/* ---------- the microphone ---------- */
// One for the page. start(fn, alive) asks for it (the browser asks once, the first time) and sends fn each hit it hears as
// { at, f, level }, with at on the clock of performance.now(); it lets the microphone go once alive() says no. It gives false when
// there is no microphone or it was not allowed. The sound is read raw: the filters that clean a voice for a call would eat the hits
let mic = null;
// The samples are read in the thread of the sound (an AudioWorklet) and sent to the page in blocks, which wait in a queue while the
// page is busy: none is lost. The old ScriptProcessor, where there is no worklet, runs on the page itself, and a page busy drawing
// can lose a block, which sounds like a click
const TAKER = `registerProcessor('oida', class extends AudioWorkletProcessor {
  constructor() { super(); this.b = new Float32Array(1024); this.n = 0; }
  process(ins) { const x = ins[0] && ins[0][0]; if (x) for (let i = 0; i < x.length; i++) { this.b[this.n++] = x[i]; if (this.n === 1024) { this.port.postMessage(this.b, [this.b.buffer]); this.b = new Float32Array(1024); this.n = 0; } } return true; }
});`;
export function microphone() {
  if (mic) return mic;
  let ac = null, stream = null, node = null, fn = null, alive = () => false, ear = null, count = 0, base = Infinity, asking = null, worklet = null;
  function stop() {
    if (node) { node.onaudioprocess = null; if (node.port) node.port.onmessage = null; try { node.disconnect(); } catch (e) {} node = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    fn = null;
  }
  // the clock of the sound and the clock of the page: a block that arrives late only makes its guess later, so the earliest guess is the true one
  function take(x) {
    if (!alive()) return stop();
    const sr = ac.sampleRate;
    count += x.length; base = Math.min(base, performance.now() - count / sr * 1000);
    for (const h of ear.push(x)) if (fn) fn({ at: base + h.at / sr * 1000, f: h.f, level: h.level });
  }
  async function open() {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) { stream = null; return false; }
    if (worklet === null) worklet = !!ac.audioWorklet && await ac.audioWorklet.addModule(URL.createObjectURL(new Blob([TAKER], { type: 'text/javascript' }))).then(() => true, () => false);
    const src = ac.createMediaStreamSource(stream), mute = ac.createGain();
    mute.gain.value = 0;
    ear = oida(ac.sampleRate); count = 0; base = Infinity;
    if (worklet) { node = new AudioWorkletNode(ac, 'oida'); node.port.onmessage = e => take(e.data); }
    else { node = ac.createScriptProcessor(1024, 1, 1); node.onaudioprocess = e => take(e.inputBuffer.getChannelData(0)); }
    src.connect(node); node.connect(mute).connect(ac.destination);
    return true;
  }
  mic = {
    // asked from the tap that opened the level, so the sound may start
    start(f, live) {
      fn = f; alive = live;
      if (ac && ac.state === 'suspended') ac.resume();
      if (node) return Promise.resolve(true);
      return asking || (asking = open().finally(() => { asking = null; }));
    },
    stop,
    get on() { return !!node; },
    // how the samples are read: 'worklet', or 'script' where there is no worklet
    get kind() { return node ? (node.port ? 'worklet' : 'script') : ''; }
  };
  return mic;
}

// what the game learnt of the kit of this device: it stays here, not in the progress, because it belongs to the drums and the microphone
const KEY = 'concert-de-l-estany-bateria';
export function kept() {
  try { const c = JSON.parse(localStorage.getItem(KEY)); return c && c.v === 1 && c.pads && Object.values(c.pads).every(s => Array.isArray(s) && s.length === NB) ? c : null; }
  catch (e) { return null; }
}
export const keep = cal => { try { localStorage.setItem(KEY, JSON.stringify(cal)); } catch (e) {} };
