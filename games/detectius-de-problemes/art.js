// The pictures of the detectives of problems, as SVG text: the detective frog, the buildings of the seven places, the scene on top of each
// case, the bar chart and the pictogram of the sports centre, the clock and the timetable of the station (their clues can be tapped)
// and the icons of the five steps. Nothing here
// knows the progress or the page.

/* ---------- the detective frog: the frog of the pond with a deerstalker and a magnifying glass ---------- */
export const FROG = `<svg class="frog" viewBox="-40 -64 92 92" aria-hidden="true"><ellipse cx="0" cy="22" rx="28" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-24 14q-9-2-7-9q7 2 11 6ZM24 14q9-2 7-9q-7 2-11 6Z" fill="#2F7F40"/><ellipse cx="0" cy="-4" rx="25" ry="21" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/>
  <path d="M-17 -3L0 15L17 -3L14 13Q0 21-14 13Z" fill="#E3B66F" stroke="#B98A3E" stroke-width="1.5"/><path d="M-6 1L0 8L6 1" fill="#FFF6EE"/><circle cy="12" r="1.6" fill="#7A5A28"/>
  <circle cx="-12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-26" r="10" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle cx="-11" cy="-25" r="4" fill="#0F3A40"/><circle cx="13" cy="-25" r="4" fill="#0F3A40"/><circle cx="-9.5" cy="-27" r="1.4" fill="#fff"/><circle cx="14.5" cy="-27" r="1.4" fill="#fff"/>
  <path d="M-9 -12Q0 -5 9 -12" fill="none" stroke="#1C5A3C" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M-20 -35q1-18 20-19q19 1 20 19Z" fill="#A07B4F" stroke="#5E4329" stroke-width="2"/>
  <path d="M-9 -52q-3 8-3 17M0 -54V-35M9 -52q3 8 3 17M-17 -44q17-6 34 0" fill="none" stroke="#C9A36F" stroke-width="1.6" opacity="0.8"/>
  <path d="M8 -36h18q4 4-3 7h-15Z" fill="#7E5D3A"/><path d="M-8 -36h-17q-4 4 3 7h14Z" fill="#7E5D3A"/><path d="M-20 -36h40" stroke="#5E4329" stroke-width="3"/><circle cy="-55" r="2.8" fill="#5E4329"/>
  <path d="M21 4q9-3 12-11" fill="none" stroke="#4FB562" stroke-width="6" stroke-linecap="round"/><path d="M32 -7l-5 9" stroke="#6E5235" stroke-width="4" stroke-linecap="round"/>
  <circle cx="37" cy="-15" r="9" fill="rgb(190 235 255 / 0.55)" stroke="#6E5235" stroke-width="3.5"/><path d="M32 -19q2-3 6-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;

/* ---------- pieces ---------- */
export function star(cx, cy, R, fill, stroke) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.48 : R;
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="${R * 0.14}" stroke-linejoin="round"` : ''}/>`;
}
function awning(x0, x1, yTop, yBot, inset, n, c1, c2) {
  let s = '';
  const w0 = (x1 - x0) / n, wt = (x1 - x0 - 2 * inset) / n;
  for (let i = 0; i < n; i++) {
    const bx = x0 + i * w0, tx = x0 + inset + i * wt;
    s += `<path d="M${tx} ${yTop} L${tx + wt} ${yTop} L${bx + w0} ${yBot} L${bx} ${yBot} Z" fill="${i % 2 ? c2 : c1}"/>`;
    s += `<path d="M${bx} ${yBot} a ${w0 / 2} ${w0 / 2.4} 0 0 0 ${w0} 0 Z" fill="${i % 2 ? c2 : c1}"/>`;
  }
  return s;
}
const shadow = (rx) => `<ellipse cx="0" cy="2" rx="${rx}" ry="${rx / 7}" fill="#22304F" opacity=".14"/>`;
function tree(x, y, s, c) {
  c = c || '#3DB874';
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="2" rx="22" ry="4" fill="#22304F" opacity=".12"/><rect x="-4" y="-30" width="8" height="32" rx="3" fill="#8B5A2B"/><circle cx="0" cy="-46" r="24" fill="${c}"/><circle cx="-14" cy="-36" r="16" fill="${c}"/><circle cx="14" cy="-34" r="16" fill="${c}"/><circle cx="-6" cy="-56" r="10" fill="#fff" opacity=".18"/></g>`;
}
function cloud(x, y, s, cls) {
  return `<g class="${cls || 'cloud'}" transform="translate(${x} ${y}) scale(${s})"><g fill="#fff"><ellipse cx="0" cy="0" rx="46" ry="16"/><circle cx="-18" cy="-8" r="16"/><circle cx="8" cy="-14" r="20"/><circle cx="28" cy="-4" r="13"/></g></g>`;
}

/* ---------- the buildings of the seven places (origin: the middle of the base) ---------- */
export const B = {};
B.mercat = () => {
  let fruit = '';
  const colors = ['#FF9F1C', '#E8476A', '#FFD23F', '#3DB874', '#8E6CDB'];
  for (let c = 0; c < 4; c++) {
    const cx = -48 + c * 32;
    fruit += `<rect x="${cx - 14}" y="-58" width="28" height="18" rx="3" fill="#B97A3D"/><path d="M${cx - 14} -50 h28" stroke="#9A6330" stroke-width="2"/>`;
    for (let k = 0; k < 3; k++) fruit += `<circle cx="${cx - 8 + k * 8}" cy="-61" r="6" fill="${colors[(c + k) % 5]}"/>`;
    fruit += `<circle cx="${cx - 4}" cy="-68" r="6" fill="${colors[(c + 2) % 5]}"/><circle cx="${cx + 4}" cy="-68" r="6" fill="${colors[c % 5]}"/>`;
  }
  return `<g>${shadow(74)}
    <rect x="-62" y="-104" width="8" height="104" rx="2" fill="#8B5A2B"/><rect x="54" y="-104" width="8" height="104" rx="2" fill="#8B5A2B"/>
    <rect x="-66" y="-42" width="132" height="42" rx="5" fill="#D9954F"/><rect x="-66" y="-42" width="132" height="9" rx="3" fill="#B97A3D"/>
    <path d="M-60 -24 h120 M-60 -12 h120" stroke="#C4843F" stroke-width="2"/>
    ${fruit}
    ${awning(-76, 76, -132, -104, 10, 8, '#E8476A', '#FFF6EE')}
    <rect x="-26" y="-152" width="52" height="22" rx="6" fill="#FFF6EE" stroke="#8B5A2B" stroke-width="3"/>
    <circle cx="-10" cy="-141" r="7" fill="#E8476A"/><path d="M-10 -148 q3 -5 7 -4" stroke="#3DB874" stroke-width="3" fill="none"/>
    <circle cx="8" cy="-141" r="7" fill="#FF9F1C"/></g>`;
};
B.excursio = () => `<g>${shadow(80)}
    <path d="M-82 -70 C -82 -84, -72 -90, -58 -90 L 50 -90 C 64 -90, 68 -82, 70 -70 L 84 -48 C 88 -40, 86 -16, 80 -14 L -78 -14 C -84 -14, -82 -22, -82 -30 Z" fill="#FFC93C"/>
    <path d="M-82 -44 L 86 -44" stroke="#22304F" stroke-width="5"/>
    <path d="M-82 -36 L 86 -36" stroke="#E09A12" stroke-width="3"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${-72 + i * 30}" y="-82" width="24" height="26" rx="4" fill="#BFE9FF" stroke="#22304F" stroke-width="2.5"/><path d="M${-68 + i * 30} -76 l8 -2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <path d="M52 -82 L64 -82 L78 -56 L52 -56 Z" fill="#BFE9FF" stroke="#22304F" stroke-width="2.5"/>
    <rect x="40" y="-82" width="10" height="66" rx="2" fill="#F0B429" stroke="#22304F" stroke-width="2"/>
    <circle cx="82" cy="-26" r="5" fill="#FFF6EE" stroke="#22304F" stroke-width="2"/>
    <rect x="-86" y="-30" width="8" height="10" rx="2" fill="#E8476A"/>
    <g class="wheel"><circle cx="-48" cy="-14" r="15" fill="#22304F"/><circle cx="-48" cy="-14" r="6" fill="#D8DEEA"/></g>
    <g class="wheel"><circle cx="54" cy="-14" r="15" fill="#22304F"/><circle cx="54" cy="-14" r="6" fill="#D8DEEA"/></g></g>`;
B.esports = () => `<g>${shadow(80)}
    <rect x="-70" y="-128" width="5" height="70" fill="#8A93A8"/><rect x="65" y="-128" width="5" height="70" fill="#8A93A8"/>
    <rect x="-80" y="-140" width="26" height="14" rx="3" fill="#FFF6EE" stroke="#8A93A8" stroke-width="2"/><rect x="54" y="-140" width="26" height="14" rx="3" fill="#FFF6EE" stroke="#8A93A8" stroke-width="2"/>
    <ellipse cx="0" cy="-62" rx="78" ry="36" fill="#4E6BD8"/>
    <ellipse cx="0" cy="-60" rx="70" ry="30" fill="#7B95F0"/>
    <path d="M-70 -60 a70 30 0 0 1 140 0" fill="none" stroke="#9FB2F5" stroke-width="5" stroke-dasharray="6 5"/>
    <ellipse cx="0" cy="-56" rx="54" ry="20" fill="#3DB874"/>
    <ellipse cx="0" cy="-56" rx="54" ry="20" fill="none" stroke="#FF9F1C" stroke-width="5" opacity=".9"/>
    <path d="M0 -76 L0 -36" stroke="#fff" stroke-width="2.5"/><ellipse cx="0" cy="-56" rx="10" ry="5" fill="none" stroke="#fff" stroke-width="2.5"/>
    <path d="M-78 -62 L-78 -24 C -78 -6, 78 -6, 78 -24 L 78 -62 C 78 -40, -78 -40, -78 -62 Z" fill="#3651BE"/>
    ${[-56, -28, 0, 28, 56].map((x) => `<rect x="${x - 7}" y="${-30 + Math.abs(x) / 9}" width="14" height="16" rx="3" fill="#FFC23D" opacity=".85"/>`).join('')}
    <path d="M-40 -96 L-40 -120 L-26 -114 L-40 -108" fill="#E8476A" stroke="#22304F" stroke-width="2"/>
    <path d="M40 -96 L40 -120 L54 -114 L40 -108" fill="#3DB874" stroke="#22304F" stroke-width="2"/></g>`;
B.pastisseria = () => `<g>${shadow(70)}
    <rect x="-64" y="-120" width="128" height="120" rx="4" fill="#FF9EB5"/>
    <rect x="-70" y="-128" width="140" height="14" rx="4" fill="#E86A8A"/>
    ${awning(-70, 70, -112, -88, 6, 7, '#FFF6EE', '#E86A8A')}
    <rect x="-54" y="-72" width="62" height="56" rx="6" fill="#BFE9FF" stroke="#C94F70" stroke-width="4"/>
    <rect x="-44" y="-36" width="42" height="10" rx="2" fill="#FFF6EE"/>
    <rect x="-40" y="-46" width="34" height="10" rx="2" fill="#E8476A"/><rect x="-36" y="-56" width="26" height="10" rx="2" fill="#FFF6EE"/>
    <circle cx="-23" cy="-60" r="4" fill="#E8476A"/>
    <rect x="18" y="-74" width="36" height="74" rx="4" fill="#9A4E2E"/><circle cx="46" cy="-36" r="3" fill="#FFC23D"/>
    <g transform="translate(0 -150)"><path d="M-16 0 L16 0 L12 20 L-12 20 Z" fill="#FF9F1C"/><path d="M-10 0 l2 20 M0 0 v20 M10 0 l-2 20" stroke="#E07B00" stroke-width="2"/>
    <circle cx="-10" cy="-4" r="10" fill="#FFF6EE"/><circle cx="10" cy="-4" r="10" fill="#FFF6EE"/><circle cx="0" cy="-12" r="11" fill="#FFF6EE"/><circle cx="0" cy="-24" r="5" fill="#E8476A"/></g></g>`;
B.cinema = () => {
  let bulbs = '';
  for (let i = 0; i < 9; i++) bulbs += `<circle class="bulb b${i % 3}" cx="${-58 + i * 14.5}" cy="-104" r="4" fill="#FFE27A"/><circle class="bulb b${(i + 1) % 3}" cx="${-58 + i * 14.5}" cy="-70" r="4" fill="#FFE27A"/>`;
  const word = 'CINEMA';
  return `<g>${shadow(72)}
    <rect x="-66" y="-130" width="132" height="130" rx="4" fill="#B3233B"/>
    <path d="M-66 -130 L0 -158 L66 -130 Z" fill="#8E1A2E"/>
    ${star(0, -138, 10, '#FFC23D', '#E09A12')}
    <rect x="-64" y="-112" width="128" height="50" rx="6" fill="#22304F"/>
    ${bulbs}
    <text x="0" y="-80" text-anchor="middle" font-family="Lilita One, Impact, sans-serif" font-size="${word.length > 4 ? 22 : 26}" fill="#FFC23D" letter-spacing="2">${word}</text>
    <rect x="-30" y="-52" width="60" height="52" rx="4" fill="#5A0F1E"/>
    <path d="M-30 -52 C -24 -30, -16 -14, -26 0 L -30 0 Z M30 -52 C 24 -30, 16 -14, 26 0 L 30 0 Z" fill="#E8476A"/>
    <rect x="-58" y="-50" width="20" height="28" rx="3" fill="#FFF6EE"/><rect x="-55" y="-46" width="14" height="10" fill="#36A9E1"/>
    <rect x="38" y="-50" width="20" height="28" rx="3" fill="#FFF6EE"/><rect x="41" y="-46" width="14" height="10" fill="#FF9F1C"/></g>`;
};
B.misteri = () => `<g>${shadow(78)}
    <rect x="-70" y="-90" width="96" height="90" fill="#6C5B9E"/>
    <path d="M-78 -88 L-22 -126 L34 -88 Z" fill="#3F3270"/>
    <rect x="22" y="-128" width="44" height="128" fill="#5A4A8C"/>
    <path d="M16 -126 L44 -172 L72 -126 Z" fill="#3F3270"/>
    <path d="M44 -172 L44 -192" stroke="#22304F" stroke-width="3"/><path d="M44 -192 L66 -186 L44 -178 Z" fill="#FFC23D"/>
    <text x="53" y="-182" font-family="Lilita One, sans-serif" font-size="10" fill="#22304F" text-anchor="middle">?</text>
    <circle cx="44" cy="-104" r="12" fill="#FFE27A" stroke="#3F3270" stroke-width="4"/><path d="M44 -116 v24 M32 -104 h24" stroke="#3F3270" stroke-width="3"/>
    ${[-56, -22].map((x) => `<rect x="${x}" y="-74" width="20" height="24" rx="10" fill="#FFE27A"/><path d="M${x + 10} -74 v24" stroke="#5A4A8C" stroke-width="3"/>`).join('')}
    <rect x="32" y="-70" width="24" height="26" rx="3" fill="#FFE27A"/><path d="M44 -70 v26 M32 -57 h24" stroke="#5A4A8C" stroke-width="3"/>
    <rect x="-42" y="-38" width="26" height="38" rx="13" fill="#2E2554"/><circle cx="-22" cy="-18" r="2.5" fill="#FFC23D"/>
    <rect x="-70" y="-10" width="136" height="10" fill="#4A3C78"/></g>`;
// the station: a clock on the front (ten past ten, the hour of the shop windows), three arches and the sign
B.estacio = () => `<g>${shadow(80)}
    <rect x="-76" y="-96" width="152" height="96" fill="#E9C46A"/>
    <rect x="-82" y="-104" width="164" height="12" rx="3" fill="#B5651D"/>
    <path d="M-30 -104 L0 -134 L30 -104 Z" fill="#B5651D"/>
    <rect x="-24" y="-176" width="48" height="74" fill="#E9C46A"/><path d="M-30 -176 L0 -196 L30 -176 Z" fill="#9C4A1A"/>
    <circle cx="0" cy="-146" r="19" fill="#FFF6EE" stroke="#22304F" stroke-width="3.5"/>
    ${[0, 3, 6, 9].map(k => { const a = k * Math.PI / 6; return `<path d="M${15 * Math.sin(a)} ${-146 - 15 * Math.cos(a)} L${12 * Math.sin(a)} ${-146 - 12 * Math.cos(a)}" stroke="#22304F" stroke-width="2.5"/>`; }).join('')}
    <path d="M0 -146 L-8 -151 M0 -146 L11 -153" stroke="#22304F" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-146" r="2.5" fill="#E8476A"/>
    <rect x="-46" y="-90" width="92" height="16" rx="3" fill="#22304F"/>
    <text x="0" y="-77" text-anchor="middle" font-family="Lilita One, Impact, sans-serif" font-size="13" fill="#FFC23D" letter-spacing="1.5">ESTACIÓ</text>
    ${[-50, 0, 50].map(x => `<path d="M${x - 16} 0 V-46 A16 16 0 0 1 ${x + 16} -46 V0 Z" fill="#7BAAD6" stroke="#B5651D" stroke-width="4"/><path d="M${x} -62 V0" stroke="#B5651D" stroke-width="2.5"/>`).join('')}</g>`;

/* ---------- the scene on top of a case (800 × 260) ---------- */
function sky(id, a, b) {
  return `<defs><linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="260" fill="url(#sky-${id})"/>`;
}
export function scene(wid) {
  let s = '';
  if (wid === 'mercat') {
    s = sky(wid, '#7FD3F5', '#D6F2FF') + `<circle cx="690" cy="58" r="30" fill="#FFE27A"/><circle cx="690" cy="58" r="44" fill="#FFE27A" opacity=".25"/>` +
      cloud(130, 50, 0.9) + cloud(470, 36, 0.7, 'cloud slow') +
      `<rect y="196" width="800" height="64" fill="#E9C99A"/>` +
      Array.from({ length: 22 }, (_, i) => `<ellipse cx="${20 + i * 37}" cy="${214 + (i % 2) * 18}" rx="15" ry="5" fill="#D9B27C"/>`).join('') +
      `<path d="M0 22 Q200 70 400 26 Q600 70 800 22" fill="none" stroke="#8B5A2B" stroke-width="2"/>` +
      Array.from({ length: 16 }, (_, i) => { const x = 25 + i * 50, y = 22 + Math.sin((x / 400) * Math.PI) * 28 * (x < 400 ? 1 : 1); return `<path class="flag" d="M${x - 11} ${y} L${x + 11} ${y} L${x} ${y + 22} Z" fill="${['#E8476A', '#FFC23D', '#36A9E1', '#3DB874'][i % 4]}"/>`; }).join('') +
      `<g transform="translate(250 214) scale(1.15)">${B.mercat()}</g>` +
      `<g transform="translate(560 214) scale(.9)">${B.mercat().replace(/#E8476A/g, '#3DB874')}</g>` +
      `<g transform="translate(420 218)"><rect x="-20" y="-26" width="40" height="26" rx="3" fill="#B97A3D"/><circle cx="-10" cy="-30" r="8" fill="#3DB874"/><circle cx="6" cy="-30" r="8" fill="#9BD34A"/><circle cx="-2" cy="-40" r="8" fill="#3DB874"/></g>` +
      `<g transform="translate(720 220)"><rect x="-22" y="-30" width="44" height="30" rx="3" fill="#B97A3D"/><circle cx="-10" cy="-34" r="10" fill="#FF9F1C"/><circle cx="10" cy="-34" r="10" fill="#FF9F1C"/><circle cx="0" cy="-46" r="10" fill="#FFB347"/></g>`;
  } else if (wid === 'excursio') {
    s = sky(wid, '#7FD3F5', '#E3F6FF') + cloud(170, 46, 0.8) + cloud(600, 60, 0.9, 'cloud slow') +
      `<path d="M0 170 L120 70 L220 150 L340 50 L470 160 L590 80 L720 150 L800 110 L800 200 L0 200 Z" fill="#9CC5E8"/>` +
      `<path d="M310 76 L340 50 L370 78 L355 74 L340 84 L325 72 Z" fill="#fff"/><path d="M570 98 L590 80 L612 100 L598 96 L590 104 L580 96 Z" fill="#fff"/>` +
      `<path d="M0 190 Q200 140 400 180 T800 170 L800 260 L0 260 Z" fill="#6CCB5F"/>` +
      `<rect y="212" width="800" height="30" fill="#5E6B85"/><path d="M0 227 H800" stroke="#FFF6EE" stroke-width="3" stroke-dasharray="26 18"/>` +
      tree(60, 206, 1) + tree(110, 200, 0.75, '#2FA25D') + tree(700, 204, 1.05) + tree(752, 198, 0.7, '#2FA25D') +
      `<g transform="translate(610 196)"><rect x="-34" y="-46" width="68" height="46" fill="#D9473F"/><path d="M-40 -44 L0 -74 L40 -44 Z" fill="#9C2F2A"/><rect x="-12" y="-28" width="24" height="28" fill="#FFF6EE"/><path d="M-12 -28 L12 0 M12 -28 L-12 0" stroke="#D9473F" stroke-width="3"/></g>` +
      `<g class="bus-drive" transform="translate(330 236) scale(1.25)">${B.excursio()}</g>`;
  } else if (wid === 'esports') {
    s = sky(wid, '#7FD3F5', '#E3F6FF') + cloud(120, 40, 0.7) + cloud(650, 50, 0.85, 'cloud slow') +
      `<rect y="180" width="800" height="80" fill="#6CCB5F"/>` +
      `<path d="M0 224 H800 V260 H0 Z" fill="#E9714B"/>` + [232, 242, 252].map((y) => `<path d="M0 ${y} H800" stroke="#FFF6EE" stroke-width="2" opacity=".8"/>`).join('') +
      `<g transform="translate(400 214) scale(1.3)">${B.esports()}</g>` +
      `<g transform="translate(110 210)"><rect x="-30" y="-52" width="5" height="52" fill="#fff"/><rect x="25" y="-52" width="5" height="52" fill="#fff"/><rect x="-30" y="-54" width="60" height="5" fill="#fff"/><path d="M-25 -49 L25 -49 L25 -2 L-25 -2 Z" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 4" opacity=".8"/></g>` +
      `<g class="ball-bounce" transform="translate(200 200)"><circle r="12" fill="#fff" stroke="#22304F" stroke-width="2"/><path d="M0 -5 L5 -1 L3 5 L-3 5 L-5 -1 Z" fill="#22304F"/></g>` +
      `<g transform="translate(680 206)"><circle r="13" fill="#FF7A2F" stroke="#22304F" stroke-width="2"/><path d="M-13 0 H13 M0 -13 V13 M-9 -9 Q0 0 -9 9 M9 -9 Q0 0 9 9" stroke="#22304F" stroke-width="1.6" fill="none"/></g>`;
  } else if (wid === 'pastisseria') {
    s = sky(wid, '#FFD6E0', '#FFF1E6') + cloud(110, 50, 0.7) + cloud(690, 40, 0.8, 'cloud slow') +
      `<rect y="200" width="800" height="60" fill="#E8D5C4"/>` + Array.from({ length: 16 }, (_, i) => `<path d="M${i * 50} 200 v60" stroke="#D6BFAA" stroke-width="2"/>`).join('') +
      `<rect y="196" width="800" height="8" fill="#C9AE96"/>` +
      `<g transform="translate(400 200) scale(1.25)">${B.pastisseria()}</g>` +
      `<g transform="translate(170 200)"><rect x="-55" y="-90" width="110" height="90" fill="#9CC5E8"/><rect x="-60" y="-96" width="120" height="10" fill="#7BAAD6"/><rect x="-42" y="-70" width="30" height="34" fill="#FFF6EE"/><rect x="10" y="-70" width="30" height="34" fill="#FFF6EE"/></g>` +
      `<g transform="translate(640 200)"><rect x="-55" y="-80" width="110" height="80" fill="#FFE27A"/><rect x="-60" y="-86" width="120" height="10" fill="#F0C43A"/><rect x="-40" y="-60" width="80" height="34" fill="#BFE9FF"/></g>` +
      `<g class="balloon"><path d="M730 140 Q726 170 734 200" stroke="#22304F" fill="none" stroke-width="1.5"/><ellipse cx="730" cy="118" rx="18" ry="22" fill="#E8476A"/></g>` +
      `<g class="balloon slow"><path d="M760 150 Q764 176 756 200" stroke="#22304F" fill="none" stroke-width="1.5"/><ellipse cx="760" cy="130" rx="15" ry="19" fill="#36A9E1"/></g>`;
  } else if (wid === 'cinema') {
    s = sky(wid, '#1E2A5A', '#3B4C8C') +
      Array.from({ length: 26 }, (_, i) => `<circle class="twinkle t${i % 3}" cx="${(i * 97) % 800}" cy="${12 + ((i * 53) % 120)}" r="${1.5 + (i % 3) * 0.7}" fill="#FFF6EE"/>`).join('') +
      `<circle cx="120" cy="60" r="26" fill="#FFF3C4"/><circle cx="132" cy="52" r="24" fill="#1E2A5A" opacity=".9"/>` +
      `<path class="beam" d="M300 210 L230 0 L280 0 Z" fill="#FFF3C4" opacity=".16"/><path class="beam b2" d="M500 210 L560 0 L610 0 Z" fill="#FFF3C4" opacity=".16"/>` +
      `<rect y="200" width="800" height="60" fill="#2A2E44"/><path d="M0 214 H800" stroke="#3B4060" stroke-width="3"/>` +
      `<rect x="250" y="206" width="300" height="10" fill="#B3233B"/>` +
      `<g transform="translate(400 206) scale(1.3)">${B.cinema()}</g>` +
      `<g transform="translate(150 206)"><path d="M-20 0 L-26 -46 L26 -46 L20 0 Z" fill="#FFF6EE"/><path d="M-14 0 L-18 -46 M0 0 V-46 M14 0 L18 -46" stroke="#E8476A" stroke-width="6"/>` +
      Array.from({ length: 9 }, (_, i) => `<circle cx="${-22 + (i % 5) * 11}" cy="${-50 - Math.floor(i / 5) * 9}" r="7" fill="#FFF3C4"/>`).join('') + `</g>` +
      `<g transform="translate(650 186)"><circle r="26" fill="#22304F" stroke="#8A93A8" stroke-width="4"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${14 * Math.cos((a * Math.PI) / 180)}" cy="${14 * Math.sin((a * Math.PI) / 180)}" r="6" fill="#8A93A8"/>`).join('')}<path d="M20 18 Q60 30 90 10" stroke="#22304F" stroke-width="10" fill="none"/></g>`;
  } else if (wid === 'estacio') {
    s = sky(wid, '#8FD3F5', '#E3F6FF') + cloud(150, 44, 0.8) + cloud(640, 56, 0.75, 'cloud slow') +
      `<path d="M0 176 Q200 140 400 168 T800 160 L800 200 L0 200 Z" fill="#9CC5E8"/>` +
      `<rect y="196" width="800" height="64" fill="#C9B79C"/><rect y="196" width="800" height="8" fill="#A8957A"/>` +
      `<path d="M0 236 H800 M0 252 H800" stroke="#6B7285" stroke-width="4"/>` + Array.from({ length: 27 }, (_, i) => `<rect x="${i * 30 + 4}" y="232" width="14" height="24" fill="#8B5A2B" opacity=".55"/>`).join('') +
      `<g transform="translate(400 208) scale(1.05)">${B.estacio()}</g>` +
      `<g transform="translate(120 200)"><rect x="-3" y="-80" width="6" height="80" fill="#22304F"/><rect x="-44" y="-96" width="88" height="22" rx="4" fill="#22304F"/><text x="0" y="-80" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="13" fill="#FFC23D">ANDANA 1</text></g>` +
      `<g class="bus-drive" transform="translate(660 232)"><rect x="-70" y="-46" width="140" height="40" rx="10" fill="#E8476A"/><rect x="-70" y="-20" width="140" height="6" fill="#FFF6EE"/>` +
      [-50, -22, 6, 34].map(x => `<rect x="${x}" y="-40" width="18" height="14" rx="3" fill="#BFE9FF"/>`).join('') +
      `<circle cx="-44" cy="-4" r="7" fill="#22304F"/><circle cx="44" cy="-4" r="7" fill="#22304F"/></g>`;
  } else {
    s = `<defs><linearGradient id="sky-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2A63"/><stop offset=".6" stop-color="#8C5A9E"/><stop offset="1" stop-color="#F2A271"/></linearGradient></defs><rect width="800" height="260" fill="url(#sky-m)"/>` +
      `<circle cx="640" cy="64" r="36" fill="#FFF3C4"/><circle cx="640" cy="64" r="56" fill="#FFF3C4" opacity=".18"/>` +
      Array.from({ length: 14 }, (_, i) => `<circle class="twinkle t${i % 3}" cx="${(i * 131) % 800}" cy="${10 + ((i * 37) % 80)}" r="1.6" fill="#FFF6EE"/>`).join('') +
      `<path d="M0 220 Q160 150 400 180 T800 190 L800 260 L0 260 Z" fill="#3F3270"/>` +
      `<path d="M0 240 Q240 200 460 228 T800 222 L800 260 L0 260 Z" fill="#2E2554"/>` +
      `<g transform="translate(400 196) scale(1.15)">${B.misteri()}</g>` +
      tree(150, 214, 0.9, '#2E5B4A') + tree(660, 220, 1, '#2E5B4A') +
      `<ellipse class="fog" cx="250" cy="226" rx="140" ry="12" fill="#fff" opacity=".18"/><ellipse class="fog slow" cx="560" cy="236" rx="160" ry="12" fill="#fff" opacity=".15"/>` +
      Array.from({ length: 7 }, (_, i) => `<circle class="firefly f${i % 3}" cx="${120 + i * 90}" cy="${150 + (i % 3) * 22}" r="3" fill="#FFE27A"/>`).join('');
  }
  return `<svg class="scene" viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
}

/* ---------- the charts of the sports centre ---------- */
function sportIcon(kind, x, y) {
  const g = (inner) => `<g transform="translate(${x} ${y})">${inner}</g>`;
  if (kind === 'foot') return g('<circle r="11" fill="#fff" stroke="#22304F" stroke-width="2"/><path d="M0 -4.5 L4.3 -1.4 L2.7 3.6 L-2.7 3.6 L-4.3 -1.4 Z" fill="#22304F"/>');
  if (kind === 'basket') return g('<circle r="11" fill="#FF7A2F" stroke="#22304F" stroke-width="2"/><path d="M-11 0 H11 M0 -11 V11 M-7.5 -8 Q-1 0 -7.5 8 M7.5 -8 Q1 0 7.5 8" stroke="#22304F" stroke-width="1.5" fill="none"/>');
  if (kind === 'swim') return g('<path d="M-12 2 q4 -5 8 0 t8 0 t8 0" stroke="#36A9E1" stroke-width="3" fill="none"/><path d="M-12 8 q4 -5 8 0 t8 0 t8 0" stroke="#36A9E1" stroke-width="3" fill="none"/><circle cx="2" cy="-7" r="5" fill="#FF9F1C"/>');
  if (kind === 'hand') return g('<circle r="10" fill="#E8476A" stroke="#22304F" stroke-width="2"/><path d="M-10 0 Q0 -6 10 0 M-6 -8 Q0 0 -6 8" stroke="#fff" stroke-width="1.6" fill="none"/>');
  return g('<rect x="-11" y="-4" width="22" height="8" rx="4" fill="#8E6CDB"/><circle cx="-6" cy="7" r="3.5" fill="#22304F"/><circle cx="6" cy="7" r="3.5" fill="#22304F"/><path d="M-6 -4 v-8 h6" stroke="#8E6CDB" stroke-width="4" fill="none"/>');
}
// chart: { type: 'bars', items }; sel: { [k]: 'ok' | 'bad' | 'hint' }; interactive: the clues can be tapped
function barChart(chart, sel, interactive) {
  const W = 520, H = 300, x0 = 46, y0 = 250, top = 30, n = chart.items.length;
  const maxV = Math.ceil(Math.max(...chart.items.map((i) => i.v)) / 10) * 10 + 10;
  const sy = (v) => y0 - ((y0 - top) * v) / maxV;
  const bw = (W - x0 - 10) / n;
  let g = '';
  for (let v = 0; v <= maxV; v += 10) g += `<path d="M${x0} ${sy(v)} H${W - 6}" class="grid-line"/><text x="${x0 - 8}" y="${sy(v) + 5}" text-anchor="end" class="axis-t">${v}</text>`;
  chart.items.forEach((it, i) => {
    const cx = x0 + bw * i + bw / 2, h = y0 - sy(it.v), state = sel[it.k] || '';
    g += `<g class="bar ${state} ${interactive ? 'tap' : ''}" ${interactive ? `data-tok="${it.k}" role="button" tabindex="0"` : ''} aria-label="${it.label}: ${it.v}">
      <rect x="${cx - bw / 2 + 2}" y="${top - 10}" width="${bw - 4}" height="${y0 - top + 52}" fill="transparent"/>
      <rect class="bar-r" x="${cx - bw * 0.3}" y="${sy(it.v)}" width="${bw * 0.6}" height="${h}" rx="6" fill="${it.color}"/>
      <rect x="${cx - bw * 0.3 + 5}" y="${sy(it.v) + 5}" width="${bw * 0.12}" height="${Math.max(0, h - 10)}" rx="3" fill="#fff" opacity=".28"/>
      <text x="${cx}" y="${sy(it.v) - 8}" text-anchor="middle" class="bar-v">${it.v}</text>
      ${sportIcon(it.icon, cx, y0 + 18)}
      <text x="${cx}" y="${y0 + 46}" text-anchor="middle" class="bar-l">${it.label}</text></g>`;
  });
  g += `<path d="M${x0} ${top - 6} V${y0} H${W - 6}" class="axis"/>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="${chart.title}">${g}</svg>`;
}
function medal(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 -16 L-2 -4 L2 -4 L6 -16 Z" fill="#E8476A"/><path d="M-1 -16 L3 -4 L7 -4 L11 -16 Z" fill="#36A9E1" transform="translate(-5 0)"/><circle cy="4" r="9" fill="#FFC23D" stroke="#E09A12" stroke-width="2.5"/>${star(0, 4.5, 4.5, '#FFF3C4')}</g>`;
}
function pictogram(chart, sel, interactive) {
  const W = 520, rowH = 58, top = 14, n = chart.rows.length;
  const H = top + n * rowH + 64;
  let g = '';
  chart.rows.forEach((row, i) => {
    const y = top + i * rowH, state = sel[row.k] || '';
    g += `<g class="prow ${state} ${interactive ? 'tap' : ''}" ${interactive ? `data-tok="${row.k}" role="button" tabindex="0"` : ''} aria-label="${row.label}: ${row.count}">
      <rect x="4" y="${y}" width="${W - 8}" height="${rowH - 6}" rx="12" class="prow-bg"/>
      <text x="16" y="${y + 34}" class="prow-l">${row.label}</text>
      ${Array.from({ length: row.count }, (_, k) => medal(124 + k * 47, y + 26, 1.4)).join('')}</g>`;
  });
  const ky = top + n * rowH + 8, state = sel[chart.keyK] || '';
  g += `<g class="pkey ${state} ${interactive ? 'tap' : ''}" ${interactive ? `data-tok="${chart.keyK}" role="button" tabindex="0"` : ''}>
    <rect x="120" y="${ky}" width="280" height="46" rx="23" class="pkey-bg"/>${medal(158, ky + 24, 1.2)}
    <text x="186" y="${ky + 30}" class="pkey-t">= ${chart.per}</text></g>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${chart.title}">${g}</svg>`;
}
// the clock of the station: { h, m, k }; the whole clock is one clue. The short hand moves on between two hours as the minutes go by
function clockChart(c, sel, interactive) {
  const cx = 260, cy = 128, R = 108, state = sel[c.k] || '', P = (deg, r) => { const a = deg * Math.PI / 180; return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; };
  let g = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#FFFDF8" stroke="#22304F" stroke-width="7"/>`;
  for (let i = 0; i < 60; i++) { const big = i % 5 === 0, [x1, y1] = P(i * 6, R - 6), [x2, y2] = P(i * 6, R - (big ? 20 : 12)); g += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#22304F" stroke-width="${big ? 4 : 1.6}" stroke-linecap="round"/>`; }
  for (let n = 1; n <= 12; n++) { const [x, y] = P(n * 30, R - 32); g += `<text x="${x}" y="${y + 9}" text-anchor="middle" class="clk-n">${n}</text>`; }
  const [hx, hy] = P(((c.h % 12) + c.m / 60) * 30, R * 0.42), [mx, my] = P(c.m * 6, R * 0.6);
  g += `<path d="M${cx} ${cy} L${hx} ${hy}" stroke="#22304F" stroke-width="11" stroke-linecap="round"/><path d="M${cx} ${cy} L${mx} ${my}" stroke="#E8476A" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="8" fill="#22304F"/>`;
  return `<svg class="chart" viewBox="${cx - 190} 0 380 256" role="img" aria-label="${c.title}"><g class="prow ${state} ${interactive ? 'tap' : ''}" ${interactive ? `data-tok="${c.k}" role="button" tabindex="0"` : ''} aria-label="El rellotge">
    <rect x="${cx - R - 14}" y="${cy - R - 14}" width="${2 * R + 28}" height="${2 * R + 28}" rx="28" class="prow-bg"/>${g}</g></svg>`;
}
// the timetable of the train: { head, rows: [{ k, label, v }] }; each row is a clue
function timetable(c, sel, interactive) {
  const W = 520, rowH = 44, top = 44, n = c.rows.length, H = top + n * rowH + 6;
  let g = `<text x="40" y="30" class="tt-h">${c.head[0]}</text><text x="${W - 40}" y="30" text-anchor="end" class="tt-h">${c.head[1]}</text>`;
  c.rows.forEach((row, i) => {
    const y = top + i * rowH, state = sel[row.k] || '';
    g += `<g class="prow ${state} ${interactive ? 'tap' : ''}" ${interactive ? `data-tok="${row.k}" role="button" tabindex="0"` : ''} aria-label="${row.label}: ${row.v}">
      <rect x="4" y="${y}" width="${W - 8}" height="${rowH - 6}" rx="10" class="prow-bg"/>
      <circle cx="26" cy="${y + 19}" r="7" fill="#E8476A"/><text x="44" y="${y + 28}" class="tt-l">${row.label}</text>
      <text x="${W - 40}" y="${y + 28}" text-anchor="end" class="tt-v">${row.v}</text></g>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.title}">${g}</svg>`;
}
export function chart(c, sel, interactive) {
  const f = { picto: pictogram, clock: clockChart, table: timetable }[c.type] || barChart;
  return f(c, sel || {}, interactive);
}

/* ---------- the icons of the five steps ---------- */
const ICON = {
  read: '<path d="M4 6 C 9 4, 13 5, 16 8 C 19 5, 23 4, 28 6 V25 C 23 23, 19 24, 16 27 C 13 24, 9 23, 4 25 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M16 8 V27" stroke="currentColor" stroke-width="2.6"/>',
  op: '<path d="M8 5 V15 M3 10 H13 M19 10 H29 M4 22 L12 30 M12 22 L4 30" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><circle cx="24" cy="21" r="2" fill="currentColor"/><circle cx="24" cy="29" r="2" fill="currentColor"/><path d="M19 25 H29" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
  est: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="16" cy="16" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="16" cy="16" r="2.2" fill="currentColor"/>',
  calc: '<path d="M6 26 L8 19 L22 5 L27 10 L13 24 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M19 8 L24 13" stroke="currentColor" stroke-width="2.6"/><path d="M5 29 H27" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  check: '<path d="M16 3 L27 7 V15 C 27 22, 22 27, 16 29 C 10 27, 5 22, 5 15 V7 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M10.5 16 L14.5 20 L22 11.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  sound: '<path d="M5 12 H10 L17 6 V26 L10 20 H5 Z" fill="currentColor"/><path d="M21 11 Q25 16 21 21 M24 7 Q31 16 24 25" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  mute: '<path d="M5 12 H10 L17 6 V26 L10 20 H5 Z" fill="currentColor"/><path d="M21 12 L29 20 M29 12 L21 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  speak: '<path d="M5 6 H27 V21 H14 L8 27 V21 H5 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M10 12 H22 M10 16 H18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  board: '<rect x="3" y="5" width="26" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M8 28 L12 23 M24 28 L20 23 M8 14 Q12 9 15 14 T22 13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  back: '<path d="M19 6 L9 16 L19 26" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
  home: '<path d="M4 15 L16 5 L28 15 M8 12 V27 H24 V12" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="13" y="18" width="6" height="9" fill="currentColor"/>',
  del: '<path d="M11 7 H28 V25 H11 L3 16 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M15 12 L23 20 M23 12 L15 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  trophy: '<path d="M9 5 H23 V12 C 23 17, 20 20, 16 20 C 12 20, 9 17, 9 12 Z" fill="currentColor"/><path d="M9 8 H4 C 4 13, 6 15, 9 15 M23 8 H28 C 28 13, 26 15, 23 15" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M16 20 V25 M10 28 H22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  chart: '<path d="M4 28 H28" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><rect x="6" y="16" width="5" height="10" rx="1.5" fill="currentColor"/><rect x="14" y="8" width="5" height="18" rx="1.5" fill="currentColor"/><rect x="22" y="12" width="5" height="14" rx="1.5" fill="currentColor"/>',
  map: '<path d="M3 8 L11 5 L21 9 L29 6 V25 L21 28 L11 24 L3 27 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><path d="M11 5 V24 M21 9 V28" stroke="currentColor" stroke-width="2.4"/>',
  lock: '<rect x="7" y="14" width="18" height="14" rx="3" fill="currentColor"/><path d="M11 14 V10 a5 5 0 0 1 10 0 V14" fill="none" stroke="currentColor" stroke-width="3"/>',
  clock: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M16 9 V16 L21 19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
};
export const icon = (k, cls) => `<svg class="ico ${cls || ''}" viewBox="0 0 32 32" aria-hidden="true">${ICON[k]}</svg>`;
