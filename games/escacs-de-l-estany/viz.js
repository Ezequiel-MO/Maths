// The board and the pieces drawn on the page, in SVG. They were in main.js and came here as they were. Without WebGL tauler() is the
// board of the game; with it the terrace of world.js plays the same calls in 3D, and these drawings stay for what is paper or text:
// the sheets of «Caça l'errada», the pieces on the buttons and in the lines of text. main.js gives the sound of a move with hear().
import { RM, sleep, mid } from '../../shared/util.js';
import { FILES, fr, dark, white } from './logic.js';

// the sound of the page, which follows the sound button of the player: main.js hands it in before the first board
let tone = () => {};
export function hear(o) { ({ tone } = o); }

/* ---------- figures ---------- */
// The six pieces, each drawn in a box of 100: its body in pieces of class body, its details in class dt. The colour comes from the stylesheet
const D = (d, c = 'body') => `<path class="${c}" d="${d}"/>`, O = (x, y, r, c = 'body') => `<circle class="${c}" cx="${x}" cy="${y}" r="${r}"/>`;
const FOOT = D('M24 91 Q24 80 35 80 H65 Q76 80 76 91Z');
export const SHAPE = {
  P: D('M38 81 C43 68 46 60 46 52 H54 C54 60 57 68 62 81Z') + D('M37 46 H63 Q66 49.500 63 53 H37 Q34 49.500 37 46Z') + O(50, 33, 13.5) + FOOT,
  R: D('M36 42 H64 L67 81 H33Z') + D('M29 18 H40 V26 H45 V18 H55 V26 H60 V18 H71 V38 Q71 43 66 43 H34 Q29 43 29 38Z') + FOOT,
  B: D('M41 58 H59 C59 68 62 74 66 81 H34 C38 74 41 68 41 58Z') + D('M50 17 C64 30 66 43 58 53 H42 C34 43 36 30 50 17Z') + D('M53 27 L46 39', 'dt') + D('M36 52 H64 Q67 55.500 64 59 H36 Q33 55.500 36 52Z') + O(50, 13, 5) + FOOT,
  N: D('M33 81 C33 64 42 56 46 46 C40 50 33 54 27 51 C21 48 22 41 27 36 L41 23 L39 10 L50 19 C67 22 75 42 69 81Z') + O(43, 32, 3, 'dt') + D('M57 27 C64 38 66 52 63 68', 'dt') + FOOT,
  Q: D('M23 37 L33 59 L37 29 L44 57 L50 25 L56 57 L63 29 L67 59 L77 37 L68 81 H32Z') + [[23, 33], [37, 25], [50, 21], [63, 25], [77, 33]].map(([x, y]) => O(x, y, 5)).join('') + D('M33 71 H67', 'dt') + FOOT,
  K: D('M50 41 C44 30 27 32 27 47 C27 59 36 65 36 81 H64 C64 65 73 59 73 47 C73 32 56 30 50 41Z') + D('M46 7 H54 V14 H61 V22 H54 V33 H46 V22 H39 V14 H46Z') + D('M36 71 H64', 'dt') + FOOT
};
const fx1 = n => +n.toFixed(1);
export const STAR = `<path d="M${Array.from({ length: 10 }, (_, i) => { const a = Math.PI * i / 5 - Math.PI / 2, R = i % 2 ? 14 : 32; return `${fx1(50 + R * Math.cos(a))} ${fx1(50 + R * Math.sin(a))}`; }).join('L')}Z"/>`;
export const ROCK = '<path d="M17 70 C9 50 24 26 48 24 C73 22 90 44 83 66 C79 82 28 86 17 70Z"/><path class="sh" d="M30 46 C36 36 48 32 58 34"/>';
// a piece on its own, to sit in a line of text or on a button
export const ico = p => `<svg class="ico" viewBox="0 0 100 100" aria-hidden="true"><g class="pc ${white(p) ? 'w' : 'b'}">${SHAPE[p.toUpperCase()]}</g></svg>`;
const XY = s => { const [f, r] = fr(s); return [f * 100, (7 - r) * 100]; };
const tr = s => { const [x, y] = XY(s); return `transform:translate(${x}px,${y}px)`; };
const pcHtml = (s, p) => `<g class="pc ${white(p) ? 'w' : 'b'}" data-s="${s}" data-p="${p}" style="${tr(s)}"><g class="pi">${SHAPE[p.toUpperCase()]}</g></g>`;
const thingsHtml = pos => pos.rocks.map(s => `<g class="rock" style="${tr(s)}">${ROCK}</g>`).join('') + pos.stars.map(s => `<g class="star" data-s="${s}" style="${tr(s)}"><g>${STAR}</g></g>`).join('');
const markHtml = (cls, list) => list.map(s => { const [x, y] = XY(s); return cls.startsWith('dot') ? `<circle class="m ${cls}" cx="${x + 50}" cy="${y + 50}" r="17"/>` : `<rect class="m ${cls}" x="${x + 4}" y="${y + 4}" width="92" height="92" rx="12"/>`; }).join('');
// The board as a drawing: a1 at the bottom left, the letters under it and the numbers on its left. blind leaves those out, plain paints every
// square the same; sel and ask are squares to ring
export function svgOf(pos, o = {}) {
  let sqs = '';
  for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) { const n = FILES[f] + (r + 1); sqs += `<rect class="s ${o.plain ? 'p' : dark(n) ? 'd' : 'l'}" data-s="${n}" x="${f * 100}" y="${(7 - r) * 100}" width="100" height="100"/>`; }
  const labs = o.blind ? '' : [...FILES].map((ch, f) => `<text class="lab" data-l="${ch}" x="${f * 100 + 50}" y="850">${ch}</text>`).join('') + Array.from({ length: 8 }, (_, r) => `<text class="lab" data-l="${r + 1}" x="-32" y="${(7 - r) * 100 + 64}">${r + 1}</text>`).join('');
  return `<svg class="bd" viewBox="-62 -10 874 ${o.blind ? 824 : 884}" role="img" aria-label="El tauler d'escacs"><defs><clipPath id="bdc"><rect width="800" height="800" rx="16"/></clipPath></defs>
    <rect class="frame" x="-10" y="-10" width="820" height="820" rx="24"/><g clip-path="url(#bdc)">${sqs}<g class="hi"></g></g><g class="mk">${markHtml('sel', o.sel || [])}${markHtml('ask', o.ask || [])}</g><g class="th">${thingsHtml(pos)}</g><g class="pcs">${Object.keys(pos.at).map(s => pcHtml(s, pos.at[s])).join('')}</g>${labs}</svg>`;
}
// A board that lives in host: draw(pos, o) makes it, set(pos) puts the pieces back, go(from, to, pos) slides one, mark and clear ring squares,
// preview shows what is typed (a letter lights its column, a letter and a number their square), point gives the middle of a square on the screen
export function tauler(host) {
  let svg;
  const g = c => svg.querySelector('.' + c);
  return {
    draw(pos, o) { host.innerHTML = svgOf(pos, o); svg = host.firstElementChild; },
    set(pos) { g('th').innerHTML = thingsHtml(pos); g('pcs').innerHTML = Object.keys(pos.at).map(s => pcHtml(s, pos.at[s])).join(''); },
    async go(from, to, pos) {
      const e = svg.querySelector(`.pc[data-s="${from}"]`), x = svg.querySelector(`.pc[data-s="${to}"]`), st = svg.querySelector(`.star[data-s="${to}"]`);
      tone(330, 0, 0.12, 0.06, 'triangle');
      // on top of the others, and then on its way: a node put back in the page only moves smoothly after it has been laid out once
      g('pcs').append(e); void e.getBoundingClientRect(); e.dataset.s = to; e.style.cssText = tr(to);
      await sleep(RM ? 0 : 380);
      for (const gone of [x, st]) if (gone) { gone.removeAttribute('data-s'); gone.classList.add('gone'); setTimeout(() => gone.remove(), 450); }
      if (pos.at[to] !== e.dataset.p) { e.dataset.p = pos.at[to]; e.firstElementChild.innerHTML = SHAPE[pos.at[to].toUpperCase()]; e.classList.add('crown'); }
      await sleep(RM ? 0 : 120);
    },
    mark(cls, list) { g('mk').insertAdjacentHTML('beforeend', markHtml(cls, list)); },
    clear(cls) { svg.querySelectorAll('.m.' + cls).forEach(e => e.remove()); },
    preview(part) {
      const f = FILES.indexOf(part[0] || '?'), r = part[1] ? +part[1] - 1 : -1;
      g('hi').innerHTML = (f < 0 ? '' : `<rect class="col" x="${f * 100}" y="0" width="100" height="800"/>`) + (r < 0 ? '' : `<rect class="row" x="0" y="${(7 - r) * 100}" width="800" height="100"/><rect class="cell" x="${f * 100 + 3}" y="${(7 - r) * 100 + 3}" width="94" height="94" rx="12"/>`);
      svg.querySelectorAll('.lab').forEach(e => e.classList.toggle('on', e.dataset.l === part[0] || e.dataset.l === part[1]));
    },
    point(s) { return mid(svg.querySelector(`.s[data-s="${s}"]`)); }
  };
}
