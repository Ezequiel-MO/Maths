// The instruments of the concert, made with the browser's own Web Audio and nothing else. on() says whether the player has
// the sound switched on. Everything goes through one compressor, so many notes at once do not crackle, and a short echo gives the pond some air.
export function band(on) {
  let ac, out, hiss;
  function ctx() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor(), echo = ac.createDelay(0.5), back = ac.createGain(), wet = ac.createGain();
      out = ac.createGain(); out.gain.value = 0.9;
      echo.delayTime.value = 0.17; back.gain.value = 0.28; wet.gain.value = 0.22;
      out.connect(comp); out.connect(echo); echo.connect(back).connect(echo); echo.connect(wet).connect(comp); comp.connect(ac.destination);
      // two seconds of white noise: the breath of a tube and the skin of the drum
      hiss = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = hiss.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  const noise = (a, t, stop) => { const n = a.createBufferSource(); n.buffer = hiss; n.loop = true; n.start(t, Math.random()); n.stop(stop); return n; };

  // A blown tube: the note with a few quieter harmonics over it (the odd ones louder, as in a tube closed at one end),
  // a puff of breath at the start that stays as a whisper, and a slow tremble once the note is held
  function pipe(f, dur = 0.5, vol = 0.22) {
    if (!on()) return;
    try {
      const a = ctx(), t = a.currentTime, end = t + Math.max(dur, 0.22), stop = end + 0.5, g = a.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.045); g.gain.setTargetAtTime(vol * 0.75, t + 0.05, 0.15); g.gain.setTargetAtTime(0.0001, end, 0.07);
      g.connect(out);
      const lfo = a.createOscillator(), depth = a.createGain();
      lfo.frequency.value = 5; depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(f * 0.005, t + 0.5); lfo.connect(depth); lfo.start(t); lfo.stop(stop);
      [[1, 1], [2, 0.14], [3, 0.3], [4, 0.04], [5, 0.08]].forEach(([h, v]) => {
        const o = a.createOscillator(), og = a.createGain();
        o.frequency.value = f * h; og.gain.value = v * 0.6; depth.connect(o.frequency); o.connect(og).connect(g); o.start(t); o.stop(stop);
      });
      const band = a.createBiquadFilter(), ng = a.createGain();
      band.type = 'bandpass'; band.frequency.value = f * 2; band.Q.value = 2.5;
      ng.gain.setValueAtTime(1.6, t); ng.gain.setTargetAtTime(0.22, t + 0.02, 0.05);
      noise(a, t, stop).connect(band).connect(ng).connect(g);
    } catch (e) {}
  }

  // A drum: a low thump that drops fast, and the slap of the stick on the skin
  function drum(vol = 0.9) {
    if (!on()) return;
    try {
      const a = ctx(), t = a.currentTime, o = a.createOscillator(), g = a.createGain(), hp = a.createBiquadFilter(), ng = a.createGain();
      o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.13);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.36);
      hp.type = 'bandpass'; hp.frequency.value = 1900; hp.Q.value = 0.8;
      ng.gain.setValueAtTime(vol * 0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      noise(a, t, t + 0.12).connect(hp).connect(ng).connect(out);
    } catch (e) {}
  }
  return { pipe, drum };
}
