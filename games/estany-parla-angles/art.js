// The pictures of «L'estany parla anglès», as SVG and HTML text: the frog with headphones, the radio, the pictures of the questions
// (an emoji, a colour, a number, a thing in a place), the monster of «True or false?» and the shapes to colour. Nothing here knows
// the progress or the page.

/* ---------- the frog of the pond, with headphones ---------- */
export const FROG = `<svg class="frog" viewBox="-40 -64 80 92" aria-hidden="true"><ellipse cx="0" cy="22" rx="28" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-24 14q-9-2-7-9q7 2 11 6ZM24 14q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-4" rx="25" ry="21" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <ellipse cx="0" cy="4" rx="15" ry="10" fill="#BDEFC4" opacity="0.6"/>
  <circle cx="-12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-25" r="4" fill="#0F3A40"/><circle cx="13" cy="-25" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-27" r="1.4" fill="#fff"/><circle cx="14.5" cy="-27" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -4 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-27 -22Q-27 -56 0 -56Q27 -56 27 -22" fill="none" stroke="#1B3F52" stroke-width="5" stroke-linecap="round"/>
  <rect x="-33" y="-28" width="11" height="17" rx="5" fill="#FF6B9A" stroke="#1B3F52" stroke-width="2"/><rect x="22" y="-28" width="11" height="17" rx="5" fill="#FF6B9A" stroke="#1B3F52" stroke-width="2"/>
  <path d="M-28 -12q2 10 12 12" fill="none" stroke="#1B3F52" stroke-width="2"/><circle cx="-15" cy="0" r="3" fill="#1B3F52"/></svg>`;

/* ---------- the radio of Ràdio Granota: its waves move while it speaks (class on) ---------- */
export const RADIO = `<svg class="radio" viewBox="0 0 120 92" aria-hidden="true">
  <path d="M30 22L58 4" stroke="#9EC3C0" stroke-width="3" stroke-linecap="round"/><circle cx="58" cy="4" r="3.5" fill="#F7C64E"/>
  <rect x="6" y="20" width="94" height="66" rx="14" fill="#FF8C2F" stroke="#7A3A10" stroke-width="3"/>
  <rect x="14" y="30" width="44" height="46" rx="10" fill="#7A3A10"/>
  <g fill="#FFC79A">${[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => `<circle cx="${22 + c * 9.5}" cy="${39 + r * 9.5}" r="2.6"/>`).join('')).join('')}</g>
  <rect x="64" y="30" width="28" height="16" rx="4" fill="#FFF3E0" stroke="#7A3A10" stroke-width="2"/><path d="M70 38H86" stroke="#E8443A" stroke-width="2"/><path d="M76 32V44" stroke="#1B3F52" stroke-width="2"/>
  <circle cx="72" cy="62" r="7" fill="#F7C64E" stroke="#7A3A10" stroke-width="2"/><circle cx="86" cy="62" r="7" fill="#F7C64E" stroke="#7A3A10" stroke-width="2"/>
  <g class="waves" fill="none" stroke="#6FE3FF" stroke-width="3" stroke-linecap="round"><path class="w1" d="M104 44q5 9 0 18"/><path class="w2" d="M110 38q9 15 0 30"/><path class="w3" d="M116 32q12 21 0 42"/></g></svg>`;

/* ---------- the pictures of a question ---------- */
// «~#E8443A» a colour, «=20» a number, { a, b, rel } a thing in a place, anything else an emoji (or a few of them)
export function picHtml(p) {
  if (p && typeof p === 'object') return `<span class="place r-${p.rel.replace(' ', '-')}" aria-hidden="true"><span class="b">${p.b}</span><span class="a">${p.a}</span></span>`;
  const s = String(p);
  if (s.startsWith('~')) return `<span class="sw" style="--c:${s.slice(1)}" aria-hidden="true"></span>`;
  if (s.startsWith('=')) return `<span class="num" aria-hidden="true">${s.slice(1)}</span>`;
  return `<span class="emo${[...s].length > 3 ? ' many' : ''}" aria-hidden="true">${s}</span>`;
}

/* ---------- the monster: a colour, some eyes, legs and arms ---------- */
export const HEX = { red: '#E8443A', blue: '#3B7BE8', green: '#3DB874', yellow: '#F7D24E', orange: '#FF8C2F', purple: '#8E5CD9', pink: '#FF8FC8', brown: '#8A5A2B', black: '#1A1A1A', white: '#FFFFFF' };
export function monster(M) {
  const c = HEX[M.col], eyes = Array.from({ length: M.eyes }, (_, i) => { const x = 60 + (i - (M.eyes - 1) / 2) * 19; return `<circle cx="${x}" cy="44" r="8" fill="#fff" stroke="#1B1B24" stroke-width="2"/><circle cx="${x + 1}" cy="45" r="3.6" fill="#1B1B24"/>`; }).join('');
  const legs = Array.from({ length: M.legs }, (_, i) => { const x = 60 + (i - (M.legs - 1) / 2) * 16; return `<path d="M${x} 92V110" stroke="${c}" stroke-width="7" stroke-linecap="round"/><ellipse cx="${x + 3}" cy="111" rx="7" ry="3.5" fill="${c}"/>`; }).join('');
  const arm = (side, y) => `<path d="M${60 + side * 30} ${y}q${side * 16} -2 ${side * 20} -14" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
  const arms = M.arms === 2 ? arm(-1, 66) + arm(1, 66) : arm(-1, 58) + arm(1, 58) + arm(-1, 76) + arm(1, 76);
  return `<svg class="monster" viewBox="0 0 120 120" role="img" aria-label="Un monstre">${legs}${arms}<ellipse cx="60" cy="64" rx="32" ry="32" fill="${c}" stroke="#1B1B24" stroke-width="2.5"/>
    ${eyes}<path d="M46 76q14 10 28 0" fill="none" stroke="#1B1B24" stroke-width="3" stroke-linecap="round"/><path d="M53 79l3 5 3-5M61 79l3 5 3-5" fill="#fff" stroke="#1B1B24" stroke-width="1"/></svg>`;
}

/* ---------- the shapes of «Listen and colour» ---------- */
function starPath() {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 19 : 42; d += (i ? 'L' : 'M') + (50 + rr * Math.cos(a)).toFixed(1) + ' ' + (54 + rr * Math.sin(a)).toFixed(1); }
  return d + 'Z';
}
const SHAPE = {
  star: starPath(), heart: 'M50 88C12 62 6 36 24 23C37 14 49 22 50 32C51 22 63 14 76 23C94 36 88 62 50 88Z', circle: 'M50 12A38 38 0 1 1 49.9 12Z',
  square: 'M15 15H85V85H15Z', triangle: 'M50 12L90 86H10Z', moon: 'M60 10A40 40 0 1 0 90 72A32 32 0 1 1 60 10Z'
};
export const shape = (name, fill = 'none') => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${SHAPE[name]}" fill="${fill === 'none' ? '#FFFDF8' : fill}" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/></svg>`;
// what the shapes and the colours are called in Catalan, for the hint
export const CA = { star: "l'estrella", heart: 'el cor', circle: 'el cercle', square: 'el quadrat', triangle: 'el triangle', moon: 'la lluna',
  red: 'vermell', blue: 'blau', green: 'verd', yellow: 'groc', orange: 'taronja', purple: 'lila', pink: 'rosa', brown: 'marró', black: 'negre', white: 'blanc',
  on: 'a sobre de', under: 'a sota de', 'next to': 'al costat de', in: 'dins de' };
