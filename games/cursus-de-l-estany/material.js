// The material that moves: one function per figure, each filling a host element for one question. Added so far: fireflies; grid, bars and
// chunks come on the same pattern. Cancelling: every figure takes the screen's token t (what fresh() in main.js returns) in its options and
// checks t.on after every wait, so a screen that was left fires and saves nothing afterwards. Results come back through callbacks (onDone ...).
import { RM, sleep } from '../../shared/util.js';

const FLIGHT = 320;   // ms a firefly takes to cross to its pad
const $ = (s, r) => r.querySelector(s);

// D fireflies and d lily pads. A tap on a pad sends one firefly to it; when none are left, onDone() if every pad holds the same number, else onMiss(),
// the fireflies come back and the child tries again. q is { D, d }; more fields (hands, groups, leftovers) can be read here later without a change of signature.
// Returns { counts() }: how many fireflies each pad holds now, landed or not.
export function fireflies(host, q, { t, onDone = () => {}, onMiss = () => {} }) {
  const { D, d } = q, size = D <= 12 ? 24 : D <= 24 ? 18 : 13, small = Math.max(11, Math.round(size * 0.7));
  let left, n, flying, locked;
  // --s sizes the fireflies at rest, --ps the ones on a pad (pads are narrower); --pc is the pads per row: two rows at most on a phone
  host.innerHTML = `<div class="fly" style="--s:${size}px;--ps:${small}px;--pc:${d > 5 ? Math.ceil(d / 2) : d}">
    <div class="fsrc" role="img" aria-label="Les cuques de llum"></div>
    <div class="fpads">${Array.from({ length: d }, (_, i) => `<button class="fpad" data-i="${i}" aria-label="Nenúfar ${i + 1}"><span class="fbugs"></span></button>`).join('')}</div></div>`;
  const wrap = $('.fly', host), src = $('.fsrc', wrap), pads = [...wrap.querySelectorAll('.fpad')];
  const bug = () => '<i class="ff"></i>';
  // everything back at the start; the source keeps the height of its full rows so the pads do not move up as it empties
  function reset(arrive) {
    left = D; n = Array(d).fill(0); flying = 0; locked = false; wrap.classList.remove('leave');
    src.style.minHeight = ''; src.innerHTML = Array.from({ length: D }, bug).join(''); src.classList.toggle('arrive', !!arrive);
    src.style.minHeight = src.offsetHeight + 'px';
    pads.forEach((p, i) => { $('.fbugs', p).innerHTML = ''; p.setAttribute('aria-label', `Nenúfar ${i + 1}`); });
  }
  async function verdict() {
    locked = true;
    if (n.every(x => x === n[0])) return onDone();
    onMiss(); wrap.classList.add('shake'); await sleep(RM ? 0 : 700); if (!t.on) return;
    wrap.classList.remove('shake'); wrap.classList.add('leave'); await sleep(RM ? 0 : 400); if (!t.on) return;
    reset(true);
  }
  async function send(i) {
    if (locked || !left) return;
    const from = src.querySelector('.ff:last-child'), w = wrap.getBoundingClientRect(), a = from.getBoundingClientRect(), p = pads[i].getBoundingClientRect();
    left--; flying++; n[i]++;
    const fl = document.createElement('i');
    fl.className = 'ff flier'; fl.style.cssText = `left:${a.left - w.left}px;top:${a.top - w.top}px;width:${a.width}px;height:${a.height}px`;
    wrap.append(fl); from.remove(); void fl.offsetWidth;
    const k = small / a.width;
    fl.style.transform = `translate(${p.left + p.width / 2 - a.left - a.width / 2}px, ${p.top + p.height / 2 - a.top - a.height / 2}px) scale(${k})`;
    await sleep(RM ? 0 : FLIGHT); if (!t.on) return;
    fl.remove(); $('.fbugs', pads[i]).insertAdjacentHTML('beforeend', bug()); pads[i].setAttribute('aria-label', `Nenúfar ${i + 1}: ${n[i]} cuques`);
    flying--; if (!left && !flying) verdict();
  }
  wrap.onclick = e => { const b = e.target.closest('.fpad'); if (b) send(+b.dataset.i); };
  reset(false);
  return { counts: () => n.slice() };
}
