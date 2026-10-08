// The score as SVG text, with no page in it. The five lines are at y 0, 10, 20, 30 and 40, so a step of the scale is 5:
// Do sits at 50 on a line of its own and Do agut at 15. The signs are glyphs of Bravura, the engraving font the stylesheet loads,
// at 40 units (four spaces of the staff, as the font asks); stems and lines are drawn. Everything takes currentColor,
// so the page colours a note through its group.
import { FIGS } from './logic.js';

const CH = { clef: '', r: '', b: '', n: '', c: '', up: '', down: '', sb: '', sn: '', sc: '', digit: 0xE080 };
const mu = (ch, x, y) => `<text class="mu" x="${x}" y="${y}">${ch}</text>`;
// how much room each figure takes on the line: a long one gets more
const ROOM = { r: 46, b: 40, n: 32, c: 25, sb: 40, sn: 32, sc: 25 };

// one figure: a note with its head centred at (x, y), or a rest on the line y. down turns the stem down
export function fig(k, x, y, down = false) {
  if (FIGS[k].rest) return mu(CH[k], x - 5.5, y);
  const w = k === 'r' ? 8.4 : 5.9, s = down ? -1 : 1, sx = x + s * (w - 0.65);
  return mu(CH[k], x - w, y) + (k === 'r' ? '' : `<path class="stem" d="M${sx} ${y - s * 1.6}V${y - s * 35}"/>`) + (k === 'c' ? mu(down ? CH.down : CH.up, sx - 0.65, y - s * 35) : '');
}

// a figure on its own, for a button; a rest of two beats needs the line it sits on to be told from a dash
export const glyph = k => `<svg class="glyph" viewBox="-15 -42 30 54" aria-hidden="true">${FIGS[k].rest ? fig(k, 0, -14) + (k === 'sb' ? '<path class="ln thin" d="M-12 -14h24"/>' : '') : fig(k, 0, 0)}</svg>`;

// The staff with its clef and one group .nt per item, in order. An item is { step, fig } for a note, { steps, fig } for notes one over
// another (a chord), { fig } for a rest or { gap: true }
// for the box of a figure still to find; hue paints it and label writes a name under it. sig writes the time signature;
// bars draws a line after every `beats` beats, which only works while every item has a figure
export function staff(items, { beats = 4, sig = false, bars = true } = {}) {
  let x = sig ? 78 : 56, sum = 0, body = '';
  items.forEach((it, i) => {
    const room = it.gap ? 34 : ROOM[it.fig]; x += room / 2;
    const one = s => (s === 0 ? `<path class="ln thin" d="M${x - 11} 50h22"/>` : '') + fig(it.fig, x, s == null ? 20 : 50 - 5 * s, s >= 6);
    const inner = it.gap ? `<rect class="gapbox" x="${x - 13}" y="-8" width="26" height="56" rx="7"/><text class="q" x="${x}" y="28">?</text>` : (it.steps ?? [it.step]).map(one).join('');
    body += `<g class="nt${it.hue != null ? ' hue' : ''}" data-i="${i}"${it.hue != null ? ` style="--h:${it.hue}"` : ''}>${inner}${it.label ? `<text class="nm" x="${x}" y="78">${it.label}</text>` : ''}</g>`;
    sum += it.gap ? 0 : FIGS[it.fig].beats; x += room / 2;
    if (bars && sum % beats === 0 && i < items.length - 1) { body += `<path class="bar" d="M${x + 2} 0v40"/>`; x += 8; }
  });
  const W = Math.round(x + 14);
  return `<svg class="staff" viewBox="0 -44 ${W} 130" style="aspect-ratio:${W}/130" role="img" aria-label="Partitura">
    <path class="lines" d="${[0, 10, 20, 30, 40].map(y => `M0 ${y}H${W}`).join('')}"/>${mu(CH.clef, 8, 30).replace('"mu"', '"mu clef"')}
    ${sig ? [[beats, 10], [4, 30]].map(([n, y]) => `<text class="mu sig" x="62" y="${y}">${String.fromCharCode(CH.digit + n)}</text>`).join('') : ''}${body}
    <path class="bar" d="M${W - 7} 0v40"/><path class="bar thick" d="M${W - 2} 0v40"/></svg>`;
}

// A tall staff to put a note on: a band .spot for each place of the scale, lowest first, and a whole note at step sel once one is chosen;
// hue paints it and label writes its name under the staff. The short line of Do is always there, faint, so its place can be seen
export function board(sel = null, hue = null, label = '') {
  const W = 124, x = 82, y = s => 50 - 5 * s;
  const band = s => { const top = s === 7 ? -18 : y(s) - 2.5, bot = s === 0 ? 68 : y(s) + 2.5; return `<rect class="spot" data-s="${s}" x="36" y="${top}" width="${W - 36}" height="${bot - top}"/>`; };
  return `<svg class="staff" viewBox="0 -18 ${W} 86" style="aspect-ratio:${W}/86" role="img" aria-label="Pentagrama">
    <path class="lines" d="${[0, 10, 20, 30, 40].map(v => `M0 ${v}H${W}`).join('')}"/>${mu(CH.clef, 8, 30).replace('"mu"', '"mu clef"')}
    <path class="ln thin" d="M${x - 11} 50h22"${sel === 0 ? '' : ' opacity="0.3"'}/>
    ${sel == null ? '' : `<g class="nt${hue != null ? ' hue' : ''}"${hue != null ? ` style="--h:${hue}"` : ''}>${fig('r', x, y(sel))}${label ? `<text class="nm" x="${x}" y="66">${label}</text>` : ''}</g>`}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(band).join('')}</svg>`;
}
