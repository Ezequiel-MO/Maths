// The voice of a game: short synth notes. on() says whether the player has the sound switched on;
// rich adds a quieter octave over each note, plain leaves the bare note for sounds that click.
export function voice(on, rich = true) {
  let ac;
  function tone(f, at = 0, dur = 0.34, vol = 0.15, type = 'sine') {
    if (!on()) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime + at;
      (rich ? [[f, vol, type], [f * 2, vol * 0.3, 'triangle']] : [[f, vol, type]]).forEach(([fr, v, ty]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = ty; o.frequency.value = fr;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
      });
    } catch (e) {}
  }
  const chime = (notes, gap = 0.08) => notes.forEach((f, i) => tone(f, i * gap, 0.4, 0.12));
  return { tone, chime };
}

const PENTA = [0, 2, 4, 7, 9];
// the k-th note of a pentatonic scale that starts at base: whatever is played together sounds right
export const pentatonic = base => k => base * 2 ** ((12 * Math.floor(k / 5) + PENTA[k % 5]) / 12);
