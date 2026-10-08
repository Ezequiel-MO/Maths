// The score as SVG text, with no page in it. The five lines are at y 0, 10, 20, 30 and 40, so a step of the scale is 5:
// Do sits at 50 on a line of its own and Do agut at 15. Everything is drawn in currentColor, so the page colours a note through its group.
import { FIGS } from './logic.js';

const CLEF = `<g class="clef"><path d="M17 52C17 60 28 60 27 50L21 2C20 -8 26 -14 28 -8C30 -1 24 8 18 15C10 23 8 30 12 36C16 42 28 41 29 33C30 26 22 23 18 27C15 30 16 35 20 36"/><circle cx="17" cy="52" r="3"/></g>`;

// one figure: a note with its head at (x, y), or a rest centred there. down turns the stem down
export function fig(k, x, y, down = false) {
  if (k === 'sn') return `<path class="ln" d="M${x - 3} ${y - 12}l6 8l-6 7l6 8q-8 -3 -5 5"/>`;
  if (k === 'sb') return `<rect class="fl" x="${x - 7}" y="${y - 5}" width="14" height="5"/><path class="ln thin" d="M${x - 11} ${y}h22"/>`;
  if (k === 'sc') return `<circle class="fl" cx="${x - 3}" cy="${y - 4}" r="2.6"/><path class="ln" d="M${x - 3} ${y - 2}q5 1 7 -3l-5 17"/>`;
  const s = down ? -1 : 1, sx = x + s * 5.6;
  return `<ellipse class="${k === 'r' || k === 'b' ? 'ho' : 'fl'}" cx="${x}" cy="${y}" rx="${k === 'r' ? 7 : 6.2}" ry="4.4" transform="rotate(-20 ${x} ${y})"/>`
    + (k === 'r' ? '' : `<path class="ln" d="M${sx} ${y - s}V${y - s * 30}${k === 'c' ? `q1 ${s * 8} 8 ${s * 12}q4 ${s * 4} 1 ${s * 11}` : ''}"/>`);
}

// a figure on its own, for a button
export const glyph = k => `<svg class="glyph" viewBox="-14 -36 28 46" aria-hidden="true">${fig(k, 0, FIGS[k].rest ? -12 : 0)}</svg>`;

// The staff with its clef and one group .nt per item, in order. An item is { step, fig } for a note, { fig } for a rest or { gap: true }
// for the box of a figure still to find; hue paints it and label writes a name under it. sig writes the time signature;
// bars draws a line after every `beats` beats, which only works while every item has a figure
export function staff(items, { beats = 4, sig = false, bars = true } = {}) {
  let x = sig ? 80 : 58, sum = 0, body = '';
  items.forEach((it, i) => {
    const y = it.step == null ? 20 : 50 - 5 * it.step;
    const inner = it.gap ? `<rect class="gapbox" x="${x - 13}" y="-6" width="26" height="52" rx="7"/><text class="q" x="${x}" y="28">?</text>`
      : (it.step === 0 ? `<path class="ln thin" d="M${x - 11} 50h22"/>` : '') + fig(it.fig, x, y, it.step >= 6);
    body += `<g class="nt${it.hue != null ? ' hue' : ''}" data-i="${i}"${it.hue != null ? ` style="--h:${it.hue}"` : ''}>${inner}${it.label ? `<text class="nm" x="${x}" y="76">${it.label}</text>` : ''}</g>`;
    sum += it.gap ? 0 : FIGS[it.fig].beats; x += 34;
    if (bars && sum % beats === 0 && i < items.length - 1) { body += `<path class="bar" d="M${x - 15} 0v40"/>`; x += 6; }
  });
  const W = x + 4;
  return `<svg class="staff" viewBox="0 -34 ${W} 116" style="max-width:${Math.round(W * 1.8)}px" role="img" aria-label="Partitura">
    <path class="lines" d="${[0, 10, 20, 30, 40].map(y => `M0 ${y}H${W}`).join('')}"/>${CLEF}
    ${sig ? `<text class="sig" x="62" y="19">${beats}</text><text class="sig" x="62" y="39">4</text>` : ''}${body}
    <path class="bar" d="M${W - 7} 0v40"/><path class="bar thick" d="M${W - 2} 0v40"/></svg>`;
}
