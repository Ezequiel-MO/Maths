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
export function hush() { gen++; if (S) { try { S.cancel(); } catch (e) {} } }

// says one line; resolves when it ends, or a while after it should have ended (some browsers never call onend)
function one(text, rate, my) {
  return new Promise(done => {
    if (my !== gen) return done();
    let over = false;
    const end = () => { if (!over) { over = true; clearTimeout(guard); done(); } };
    const guard = setTimeout(end, 2000 + text.split(/\s+/).length * 700 / rate);
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = best ? best.lang : 'en-GB'; if (best) u.voice = best; u.rate = rate; u.pitch = 1.05;
      u.onend = u.onerror = end;
      S.speak(u);
    } catch (e) { end(); }
  });
}
// lines one after the other, with a short gap; slow is the turtle. Resolves true when all were said, false when stopped or impossible
export function speak(lines, slow = false) {
  hush();
  const my = gen, list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
  if (!S || !list.length) return Promise.resolve(false);
  const rate = slow ? 0.6 : 0.88;
  return (async () => {
    for (let i = 0; i < list.length; i++) {
      if (my !== gen) return false;
      await one(list[i], rate, my);
      if (i < list.length - 1) await new Promise(r => setTimeout(r, slow ? 650 : 420));
    }
    return my === gen;
  })();
}
