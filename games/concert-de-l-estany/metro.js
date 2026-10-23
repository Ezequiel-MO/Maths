// The metronome of the concert: a clock that runs moments in order, and the strip that shows the beat. The song in time that uses
// them lives in main.js. Nothing here plays a note: the strip is handed the click to sound on each beat.
import { RM } from '../../shared/util.js';

// the tempo, in beats a minute, and the word a child reads under it
export const BPM = { min: 40, max: 160, step: 10, start: 80 };
export const tempoWord = bpm => bpm <= 50 ? 'molt lent' : bpm <= 70 ? 'lent' : bpm <= 100 ? 'tranquil' : bpm <= 130 ? 'ràpid' : 'molt ràpid';

// Runs the moments of evs ({ at: ms after the start, fn }) as their time comes, all from one loop, so a click and a note due together
// come out together. alive() is asked on every turn: once it says no, nothing more runs and done gives false; after the last moment, true
export function clock(evs, alive) {
  const list = evs.slice().sort((a, b) => a.at - b.at), start = performance.now();
  let i = 0;
  const done = new Promise(res => {
    const f = () => {
      if (!alive()) return res(false);
      const now = performance.now() - start;
      while (i < list.length && list[i].at <= now) list[i++].fn();
      i < list.length ? setTimeout(f, 5) : res(true);
    };
    f();
  });
  return { start, done };
}

// a metronome with its weight on an arm that swings from a pivot at the bottom (the pivot is the origin, so the arm turns round it)
const PEND = `<svg class="pend" viewBox="-17 -36 34 42" aria-hidden="true"><path class="mbox" d="M-15 5L-6 -34h12L15 5Z"/><path class="mscale" d="M-3 -28h6M-3 -22h6M-3 -16h6M-3 -10h6"/>
  <g class="arm"><path d="M0 0V-33"/><rect x="-4.5" y="-24" width="9" height="6" rx="2"/></g><circle r="2.6"/></svg>`;

// The strip: the metronome, a numbered dot for each beat of the bar (the first one stands out: it starts the bar), the tempo with − and +,
// and the two buttons of a song in time. While a song runs both buttons give way to «Para»
export function metroStrip(beats, bpm) {
  return `<div class="metro" id="metro">
    <span class="mface">${PEND}<span class="mbeats" id="mbeats">${Array.from({ length: beats }, (_, i) => `<i${i ? '' : ' class="one"'}>${i + 1}</i>`).join('')}</span></span>
    <span class="mtempo"><button class="mstep" data-d="-1" aria-label="Més lent">−</button><span class="mbpm"><b id="bpm">${bpm}</b><small id="bpmw">${tempoWord(bpm)}</small></span><button class="mstep" data-d="1" aria-label="Més ràpid">+</button></span>
    <span class="mctl"><button class="btn soft" id="mlisten">Escolta a temps</button><button class="btn" id="mplay">Toca a temps</button><button class="btn soft" id="mstop" hidden>Para</button></span>
  </div>`;
}

// What the strip does. beats: the beats of a bar; get and set read and keep the tempo; tick(accent) sounds one click.
// beat(k) is the k-th click of a run, counted from the first one: it lights its dot and sends the arm to the other side, where it lands
// on the next click. still() puts it all at rest; busy(on) swaps the buttons for «Para» and locks the tempo while a song runs
export function metronome(root, { beats, get, set, tick }) {
  const arm = root.querySelector('.arm'), dots = [...root.querySelectorAll('.mbeats i')];
  const side = k => (k % 2 ? 1 : -1) * 24;
  const swing = (deg, ms) => { arm.style.transition = ms && !RM ? `transform ${ms}ms cubic-bezier(0.45, 0, 0.55, 1)` : 'none'; arm.style.transform = `rotate(${deg}deg)`; };
  const paint = () => { root.querySelector('#bpm').textContent = get(); root.querySelector('#bpmw').textContent = tempoWord(get()); };
  root.querySelectorAll('.mstep').forEach(b => { b.onclick = () => { set(Math.min(BPM.max, Math.max(BPM.min, get() + BPM.step * b.dataset.d))); paint(); tick(true); }; });
  return {
    get ms() { return 60000 / get(); },
    ready() { swing(side(0), 0); },
    beat(k) {
      const d = dots[k % beats];
      dots.forEach(e => e.classList.remove('on')); void d.offsetWidth; d.classList.add('on');
      tick(k % beats === 0); swing(side(k + 1), 60000 / get());
    },
    still() { dots.forEach(e => e.classList.remove('on')); swing(0, 300); },
    busy(on) {
      root.querySelector('#mlisten').hidden = root.querySelector('#mplay').hidden = on; root.querySelector('#mstop').hidden = !on;
      root.querySelectorAll('.mstep').forEach(b => { b.disabled = on; });
    }
  };
}
