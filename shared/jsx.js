// JSXGraph (https://jsxgraph.org) for the pictures a child moves with a finger: number lines, points to drag, shapes that
// follow. board(t, el, box) makes a board inside el in the colours of the pond and gives it back; it is freed by itself when the
// screen of t goes (shared/shell.js tokens) or el leaves the page. What goes on the board is each game's own: JXG is exported
// for that, and C holds the colours. Vite puts JSXGraph only in the pages that import this file.
import JXG from 'jsxgraph';
import '../node_modules/jsxgraph/distrib/jsxgraph.css';
import { whenGone } from './scene.js';

export { JXG };
// the palette of base.css, for what JSXGraph draws (it does not read CSS variables)
export const C = { ink: '#EAF8F4', muted: '#9EC3C0', pad: '#4FB562', padDark: '#2F7F40', sun: '#F7C64E', bad: '#FF6B5E', night: '#04131C', edge: 'rgba(160,230,220,0.35)' };

let seq = 0;
// box is [left, top, right, bottom] in the board's own units. The board has no grid, no axes, no zoom and no pan: the game draws what
// it needs, and a finger on it only moves what the game lets move. el gets an id if it has none (JSXGraph asks for one)
export function board(t, el, box, attrs = {}) {
  if (!el.id) el.id = 'jxg' + ++seq;
  el.classList.add('jxgbox');
  const b = JXG.JSXGraph.initBoard(el.id, {
    boundingbox: box, keepaspectratio: false, axis: false, grid: false,
    showCopyright: false, showNavigation: false, showInfobox: false,
    pan: { enabled: false }, zoom: { enabled: false }, browserPan: true,
    defaultAxes: {}, ...attrs
  });
  whenGone(t, el, () => JXG.JSXGraph.freeBoard(b));
  return b;
}
