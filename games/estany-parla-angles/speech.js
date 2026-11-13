// The English voice of the game: the speech synthesis of the browser, with the best English voice it has (British first, as in the
// recordings of the test). speak() says some lines one after the other and resolves when the last one ends; a new speak() or hush()
// stops the one before. A browser with no voice at all gives false at once, and the game shows the words instead.
const S = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined' ? speechSynthesis : null;
let best = null;
function choose() {
  if (!S) return;
  const score = v => (/^en[-_]GB/i.test(v.lang) ? 6 : /^en[-_](US|AU|IE|CA|NZ)/i.test(v.lang) ? 4 : 2) + (/google|natural|neural|premium|enhanced|siri|daniel|serena|kate|libby|sonia/i.test(v.name) ? 3 : 0);
  best = S.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)).sort((a, b) => score(b) - score(a))[0] || null;
}
if (S) { choose(); S.addEventListener?.('voiceschanged', choose); }

export const canSpeak = !!S;
// whether an English voice was found (some browsers only list them a moment after the page loads)
export const english = () => !!best;
let gen = 0;
export function hush() { gen++; const t = talking; talking = null; t?.(false); if (S) { try { S.cancel(); } catch (e) {} } }

// says one line; resolves when it ends, or a while after it should have ended (some browsers never call onend). pitch: a conversation
// gives the second voice a higher one
function one(text, rate, my, pitch = 1.05) {
  return new Promise(done => {
    if (my !== gen) return done();
    let over = false;
    const end = () => { if (!over) { over = true; clearTimeout(guard); done(); } };
    const guard = setTimeout(end, 2000 + text.split(/\s+/).length * 700 / rate);
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = best ? best.lang : 'en-GB'; if (best) u.voice = best; u.rate = rate; u.pitch = pitch;
      u.onend = u.onerror = end;
      S.speak(u);
    } catch (e) { end(); }
  });
}
// Lines one after the other, with a short gap; slow is the turtle; duo, a conversation: every other line is the second voice, higher.
// on(true) when it starts talking and on(false) when it ends or is stopped (the frog of the studio moves its mouth). Resolves true
// when all were said, false when stopped or impossible
let talking = null;
export function speak(lines, slow = false, duo = false, on = null) {
  hush();
  const my = gen, list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  if (!S || !list.length) return Promise.resolve(false);
  const rate = slow ? 0.6 : 0.88;
  talking = on; on?.(true);
  return (async () => {
    for (let i = 0; i < list.length; i++) {
      if (my !== gen) return false;
      await one(list[i], rate, my, duo && i % 2 ? 1.45 : duo ? 0.85 : 1.05);
      if (i < list.length - 1) await new Promise(r => setTimeout(r, slow ? 650 : 420));
    }
    if (my !== gen) return false;
    const t = talking; talking = null; t?.(false);
    return true;
  })();
}
