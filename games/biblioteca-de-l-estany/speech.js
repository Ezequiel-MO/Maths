// The Catalan voice of the library: the speech synthesis of the browser, with the best Catalan voice it has. A recording is said line
// by line, and each line sentence by sentence (a long line is cut off by some browsers). Who says a line changes the voice: the Nora of
// the radio (A) and who she talks to (B) get two voices when the browser has two, and a higher and a lower pitch of the same voice when
// it has one. speak() resolves when the last line ends; a new speak() or hush() stops the one before. With no Catalan voice at all,
// catalan() is false and the page shows the words instead.
const S = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined' ? speechSynthesis : null;
let voices = [];
function choose() {
  if (!S) return;
  const score = v => (/natural|neural|online|premium|enhanced|google/i.test(v.name) ? 4 : 0) + (/^ca[-_]ES/i.test(v.lang) ? 1 : 0) + (v.localService === false ? 1 : 0);
  voices = S.getVoices().filter(v => /^ca([-_]|$)/i.test(v.lang)).sort((a, b) => score(b) - score(a));
}
if (S) { choose(); S.addEventListener?.('voiceschanged', choose); }

export const canSpeak = !!S;
// whether a Catalan voice was found (some browsers only list them a moment after the page loads)
export const catalan = () => voices.length > 0;
let gen = 0;
export function hush() { gen++; if (S) { try { S.cancel(); } catch (e) {} } }

// the voice and the pitch of each speaker
function voiceOf(who) {
  const two = voices.length > 1;
  if (who === 'B') return { v: two ? voices[1] : voices[0], pitch: two ? 1 : 0.85 };
  if (who === 'A') return { v: voices[0], pitch: two ? 1.08 : 1.22 };
  return { v: voices[0], pitch: 1 };
}
// says one sentence; resolves when it ends, or a while after it should have ended (some browsers never call onend)
function one(text, who, rate, my) {
  return new Promise(done => {
    if (my !== gen) return done();
    let over = false;
    const end = () => { if (!over) { over = true; clearTimeout(guard); done(); } };
    const guard = setTimeout(end, 2500 + text.split(/\s+/).length * 650 / rate);
    try {
      const u = new SpeechSynthesisUtterance(text), V = voiceOf(who);
      u.lang = V.v ? V.v.lang : 'ca-ES'; if (V.v) u.voice = V.v; u.rate = rate; u.pitch = V.pitch;
      u.onend = u.onerror = end;
      S.speak(u);
    } catch (e) { end(); }
  });
}
const cut = t => t.replace(/[«»—*]/g, ' ').split(/(?<=[.!?…:])\s+/).map(s => s.trim()).filter(Boolean);
// lines: strings, or [who, text]; slow is the turtle; onLine(i) is told when line i starts. Resolves true when all were said, false
// when stopped or impossible
export function speak(lines, { slow = false, onLine = null } = {}) {
  hush();
  const my = gen, list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean).map(l => Array.isArray(l) ? l : ['N', l]);
  if (!S || !list.length) return Promise.resolve(false);
  const rate = slow ? 0.7 : 0.95;
  return (async () => {
    for (let i = 0; i < list.length; i++) {
      if (my !== gen) return false;
      onLine?.(i);
      for (const s of cut(list[i][1])) { if (my !== gen) return false; await one(s, list[i][0], rate, my); }
      if (i < list.length - 1) await new Promise(r => setTimeout(r, slow ? 600 : 380));
    }
    return my === gen;
  })();
}
