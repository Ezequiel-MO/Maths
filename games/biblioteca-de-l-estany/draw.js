// The pictures of the library of the pond: the frog with its round glasses and a book, the library of the map (a tower of three giant
// books on a lily pad, with an open book for a roof and the aerial of Ràdio Estany on top), the radio of the recordings, and the photos
// of the texts. The tower is drawn from what the child has done: a window lights up for each project validated, the gold bands of a
// book shine when the exam of its circle is passed, the aerial sends waves when the radio projects are done, and around the tower fly
// as many little books as texts are on the shelves.

const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// the frog of the library, in round glasses, with an open book
export const FROG = `<svg class="frog" viewBox="-42 -60 84 90" aria-hidden="true"><ellipse cx="0" cy="25" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 16q-10-1-8-9q7 2 11 6ZM25 16q10-1 8-9q-7 2-11 6Z" fill="#2F7F40"/>
  <ellipse cx="0" cy="-2" rx="26" ry="22" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/><ellipse cx="0" cy="7" rx="16" ry="11" fill="#D9F5C8"/>
  <circle cx="-12" cy="-25" r="10.5" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-25" r="10.5" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle class="eye" cx="-11" cy="-23" r="4.2" fill="#0F3A40"/><circle class="eye" cx="13" cy="-23" r="4.2" fill="#0F3A40"/><circle cx="-9.5" cy="-25" r="1.4" fill="#fff"/><circle cx="14.5" cy="-25" r="1.4" fill="#fff"/>
  <g fill="none" stroke="#7A4E26" stroke-width="2.4"><circle cx="-12" cy="-24" r="9"/><circle cx="12" cy="-24" r="9"/><path d="M-3 -25q3-3 6 0M-21 -25l-6-2M21 -25l6-2"/></g>
  <path d="M-8 -9Q0 -4 8 -9" fill="none" stroke="#1C5A3C" stroke-width="2.4" stroke-linecap="round"/>
  <g class="book"><path d="M-22 6Q-11 1 0 6V24Q-11 19 -22 24Z" fill="#FFF8E6" stroke="#B88A3A" stroke-width="1.4"/><path d="M22 6Q11 1 0 6V24Q11 19 22 24Z" fill="#FFF1D0" stroke="#B88A3A" stroke-width="1.4"/>
    <path d="M-18 10Q-11 7.5 -4 10M-18 14Q-11 11.5 -4 14M-18 18Q-11 15.5 -4 18M4 10Q11 7.5 18 10M4 14Q11 11.5 18 14" stroke="#D9C49A" stroke-width="1.2" fill="none"/>
    <path d="M-23 25Q-11 20 0 25Q11 20 23 25" fill="none" stroke="#B23A48" stroke-width="2.6" stroke-linecap="round"/></g>
  <ellipse cx="-17" cy="12" rx="6" ry="4.5" fill="#4FB562" stroke="#2F7F40" stroke-width="1.6"/><ellipse cx="17" cy="12" rx="6" ry="4.5" fill="#4FB562" stroke="#2F7F40" stroke-width="1.6"/></svg>`;

// the gradients of the library, once in the page
let defsDone = false;
function defs() {
  if (defsDone || typeof document === 'undefined') return;
  defsDone = true;
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>
    <radialGradient id="bl-moon" cx="40%" cy="38%"><stop offset="0" stop-color="#FFFBE6"/><stop offset="0.7" stop-color="#F3E3A6"/><stop offset="1" stop-color="#D9C27A"/></radialGradient>
    <radialGradient id="bl-halo"><stop offset="0" stop-color="#FFF3C4" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient>
    <linearGradient id="bl-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C3A4C"/><stop offset="1" stop-color="#04131C"/></linearGradient>
    <linearGradient id="bl-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F3446"/><stop offset="1" stop-color="#0A2433"/></linearGradient>
    <linearGradient id="bl-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset="0.55" stop-color="#FFC94D"/><stop offset="1" stop-color="#F08A24"/></linearGradient>
    <linearGradient id="bl-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F2C4D"/><stop offset="1" stop-color="#121A33"/></linearGradient>
    <linearGradient id="bl-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0B3"/><stop offset="0.5" stop-color="#E9B949"/><stop offset="1" stop-color="#A97A1E"/></linearGradient>
    <linearGradient id="bl-page" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9DDBF"/><stop offset="0.5" stop-color="#FFF8E6"/><stop offset="1" stop-color="#E9DDBF"/></linearGradient>
    <linearGradient id="bl-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="bl-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="bl-wclip"><rect x="0" y="206" width="360" height="60"/></clipPath>
  </defs></svg>`);
}

// a giant book lying flat, seen from its spine: x, y, w, h, its colour, and its three windows (0 dark, 1 a candle, 2 lit)
function book(c, x, y, w, h, hue, wins, gold, tilt) {
  const cx = x + w / 2, ww = Math.min(24, w / 7), wh = h * 0.56, wy = y + h * 0.24;
  const win = (i, s) => {
    const wx = x + w * (0.22 + 0.28 * i) - ww / 2, r = ww / 2;
    const arch = `M${wx} ${wy + wh}V${wy + r}A${r} ${r} 0 0 1 ${wx + ww} ${wy + r}V${wy + wh}Z`;
    const lit = s === 2, dim = s === 1;
    return `<g class="win w${s}" style="--d:${(c * 3 + i) * 0.12}s"><path d="${arch}" fill="${lit ? 'url(#bl-win)' : 'url(#bl-dark)'}" ${lit ? 'filter="url(#bl-glow)"' : ''} stroke="${lit ? '#FFE9A8' : 'hsl(' + hue + ' 30% 22%)'}" stroke-width="1.4"/>
      ${lit ? `<path d="M${wx + 3} ${wy + wh - 4}h${ww - 6}M${wx + 3} ${wy + wh - 9}h${ww - 6}" stroke="#B4521D" stroke-width="1.6" opacity="0.55"/><circle cx="${wx + ww / 2}" cy="${wy + wh * 0.42}" r="${ww * 0.18}" fill="#4FB562" opacity="0.85"/>`
        : dim ? `<circle class="candle" cx="${wx + ww / 2}" cy="${wy + wh * 0.7}" r="2.4" fill="#FFC94D" filter="url(#bl-glow)"/>` : ''}
      <path d="M${wx + ww / 2} ${wy + 2}V${wy + wh}" stroke="${lit ? '#C97A2A' : 'hsl(' + hue + ' 25% 16%)'}" stroke-width="1" opacity="0.6"/></g>`;
  };
  return `<g class="tome t${c}${gold ? ' gold' : ''}" transform="rotate(${tilt} ${cx} ${y + h / 2})">
    <rect x="${x - 4}" y="${y - 3}" width="${w + 8}" height="${h + 6}" rx="5" fill="hsl(${hue} 45% 22%)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="hsl(${hue} 58% 40%)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.22}" rx="4" fill="hsl(${hue} 60% 52%)" opacity="0.55"/>
    <g class="bands"><rect x="${x + 7}" y="${y + 2}" width="5" height="${h - 4}" rx="2" fill="url(#bl-gold)"/><rect x="${x + w - 12}" y="${y + 2}" width="5" height="${h - 4}" rx="2" fill="url(#bl-gold)"/></g>
    ${gold ? `<rect class="shine" x="${x}" y="${y}" width="${w * 0.3}" height="${h}" fill="url(#bl-shine)"/>` : ''}
    ${[0, 1, 2].map(i => win(i, wins[i])).join('')}</g>`;
}
// the little books that fly around the tower
function flyers(n) {
  const cols = [350, 200, 45, 140, 270, 20, 180, 310, 95];
  return Array.from({ length: Math.min(n, 18) }, (_, i) => {
    const rx = 120 + (i % 3) * 18, ry = 26 + (i % 4) * 6, cy = 62 + (i % 5) * 26, dur = 14 + (i % 6) * 2.5, h = cols[i % cols.length];
    return `<g class="fly"><g class="flap" style="animation-delay:${(i * 0.17).toFixed(2)}s"><path d="M0 0L-7 -4V3L0 6Z" fill="hsl(${h} 70% 62%)"/><path d="M0 0L7 -4V3L0 6Z" fill="hsl(${h} 70% 52%)"/><path d="M0 0V6" stroke="#FFF8E6" stroke-width="1.2"/></g>
      <animateMotion dur="${dur}s" begin="-${(i * 1.9).toFixed(1)}s" repeatCount="indefinite" path="M${180 - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 -${2 * rx} 0"/></g>`;
  }).join('');
}
// The library of the map in el. win[i]: 0 nothing yet, 1 begun, 2 validated (one per project, three per circle); exams[c] passed;
// radio: the aerial sends waves; books: how many texts are on the shelves
export function libraryMap(el, { win, exams, radio, books, all }) {
  defs();
  const stars = [[22, 18], [64, 8], [104, 30], [36, 58], [250, 12], [292, 40], [334, 70], [12, 96], [348, 120], [214, 6], [150, 14], [80, 80]]
    .map(([x, y], i) => `<circle class="star" cx="${x}" cy="${y}" r="${i % 3 ? 1.1 : 1.8}" style="animation-delay:${(i * 0.37).toFixed(2)}s"/>`).join('');
  const tower = `<g class="tower">
    ${book(0, 88, 150, 184, 50, 352, win.slice(0, 3), exams[0], 0)}
    ${book(1, 103, 104, 154, 46, 186, win.slice(3, 6), exams[1], -1.6)}
    ${book(2, 117, 64, 126, 42, 258, win.slice(6, 9), exams[2], 1.2)}
    <g class="roof"><path d="M114 66L180 22L246 66Z" fill="url(#bl-page)"/>${[0.2, 0.35, 0.5, 0.65, 0.8].map(k => `<path d="M180 24L${114 + 132 * k} 66" stroke="#D9C49A" stroke-width="0.9"/>`).join('')}
      <path d="M106 68L180 18L184 23L113 70Z" fill="hsl(40 62% 46%)" stroke="hsl(40 50% 26%)" stroke-width="1.2"/><path d="M254 68L180 18L176 23L247 70Z" fill="hsl(40 62% 40%)" stroke="hsl(40 50% 26%)" stroke-width="1.2"/>
      <path d="M180 22V44l-4 5V22Z" fill="#B23A48"/><path d="M180 22V44l4 5V22Z" fill="#8E2433"/></g>
    <g class="aerial${radio ? ' on' : ''}"><path d="M180 19V2" stroke="#9EC3C0" stroke-width="2"/><circle cx="180" cy="2" r="3" fill="#FF6B5E"/>
      ${[8, 15, 22].map((r, i) => `<path class="wave" d="M${180 - r} ${2 - r * 0.15}a${r} ${r} 0 0 1 ${2 * r} 0" fill="none" stroke="#6FE3FF" stroke-width="1.6" style="animation-delay:${i * 0.35}s"/>`).join('')}</g>
  </g>`;
  el.innerHTML = `<svg class="library${all ? ' all' : ''}" viewBox="0 0 360 262" role="img" aria-label="La biblioteca: ${win.filter(w => w === 2).length} de 9 finestres enceses, ${books} llibres a les prestatgeries">
    <circle cx="312" cy="40" r="34" fill="url(#bl-halo)"/><circle cx="312" cy="40" r="15" fill="url(#bl-moon)"/><circle cx="307" cy="36" r="3" fill="#E5D28E" opacity="0.6"/><circle cx="317" cy="46" r="2" fill="#E5D28E" opacity="0.5"/>${stars}
    <path d="M0 176Q60 140 120 168T240 160T360 150V210H0Z" fill="url(#bl-hill)"/>
    <rect x="0" y="206" width="360" height="56" fill="url(#bl-water)"/>
    <g clip-path="url(#bl-wclip)" opacity="0.22"><g transform="translate(0 414) scale(1 -1)">${tower}</g></g>
    ${[0, 1, 2, 3].map(i => `<path class="ripple" d="M${30 + i * 86} ${222 + (i % 2) * 14}h${46 - i * 5}" stroke="#6FE3FF" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round" style="animation-delay:${i * 0.7}s"/>`).join('')}
    <ellipse cx="180" cy="206" rx="132" ry="15" fill="#1F5A35"/><path d="M60 204Q180 192 300 204" fill="none" stroke="#4FB562" stroke-opacity="0.55" stroke-width="2"/><path d="M180 206L196 220" stroke="#123D25" stroke-width="3"/>
    ${tower}
    <g class="lamp"><path d="M62 204V176" stroke="#5B4636" stroke-width="2.4"/><path d="M55 176h14l-3-9h-8Z" fill="#2A2018"/><circle cx="62" cy="180" r="4" fill="#FFC94D" filter="url(#bl-glow)"/></g>
    <g transform="translate(290 190) scale(0.42)">${FROG.replace('<svg class="frog" viewBox="-42 -60 84 90" aria-hidden="true">', '<g class="mapfrog">').replace(/<\/svg>$/, '</g>')}</g>
    <g class="stack"><rect x="236" y="194" width="24" height="7" rx="1.5" fill="#B23A48"/><rect x="239" y="187" width="20" height="7" rx="1.5" fill="#2E8B8B"/><rect x="237" y="180" width="22" height="7" rx="1.5" fill="#E9B949"/></g>
    ${flyers(books)}
  </svg>`;
}

// the radio of the recordings: it plays when the box around it has the class on
export const RADIO = `<svg class="set" viewBox="0 0 120 84" aria-hidden="true">
  <path d="M86 12L104 0" stroke="#9EC3C0" stroke-width="2.4" stroke-linecap="round"/><circle cx="104" cy="0" r="3" fill="#FF6B5E"/>
  <rect x="4" y="12" width="112" height="70" rx="14" fill="#B4622F"/><rect x="4" y="12" width="112" height="70" rx="14" fill="none" stroke="#6E3815" stroke-width="2.5"/>
  <rect x="10" y="18" width="100" height="58" rx="10" fill="#C97A3D"/>
  <g class="grill"><circle cx="38" cy="47" r="22" fill="#3A2416"/>${[6, 11, 16, 20].map(r => `<circle cx="38" cy="47" r="${r}" fill="none" stroke="#6B4528" stroke-width="1.6"/>`).join('')}<circle class="cone" cx="38" cy="47" r="5" fill="#8A5A34"/></g>
  <rect x="66" y="26" width="38" height="18" rx="4" fill="#FFF3C4" stroke="#6E3815" stroke-width="1.6"/>${[70, 76, 82, 88, 94, 100].map(x => `<path d="M${x} 29v4" stroke="#B4622F" stroke-width="1"/>`).join('')}
  <path class="needle" d="M78 27V43" stroke="#FF6B5E" stroke-width="2" stroke-linecap="round"/>
  <circle cx="74" cy="60" r="7" fill="#6E3815"/><circle cx="74" cy="60" r="4.5" fill="#E9B949"/><circle cx="96" cy="60" r="7" fill="#6E3815"/><circle cx="96" cy="60" r="4.5" fill="#E9B949"/>
  <circle class="led" cx="85" cy="70" r="2.2" fill="#4FB562"/></svg>`;

// the photo of a text: a picture in a white frame, with its caption under
export const photoHtml = P => `<figure class="photo" data-s="photo"><div class="pimg" aria-hidden="true"><span>${P.pic}</span></div><figcaption><b>Fotografia.</b> ${H(P.cap)}</figcaption></figure>`;
