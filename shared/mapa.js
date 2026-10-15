// The map of a cursus (shared/curs.js), the same in every game: a band for each circle with its projects and its exam, the next thing
// to do on top, and what the map says of each project and exam. The game gives what is its own: how a ring and a project look, what
// goes under the circles (buttons, badges) and where each button leads.
import { $ } from './util.js';

// o, what the map reads:
//   prog          () => the progress (the game keeps it in its own let prog)
//   L             the game's logic: PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached
//   OPEN          ?obert: everything open
//   field         where the stars of each level are kept ('lv' or 'stars')
//   passed        (p, c) => whether the exam of circle c is passed (default p.exams[c])
//   done          i => how many levels of project i are done (default the ones with stars)
//   what          what the button of an open exam says ('Sis preguntes')
//   skipShut      the next thing to do may be in a circle after a shut one (circles that open by themselves)
export function cursusMap(o) {
  const P = o.prog, L = o.L, OPEN = o.OPEN, field = o.field || 'lv', what = o.what || 'Sis preguntes';
  const passed = o.passed || ((p, c) => p.exams[c]);
  const starsOf = i => P()[field].slice(i * 10, i * 10 + 10);
  const done = o.done || (i => starsOf(i).filter(Boolean).length);
  const openC = c => OPEN || L.isOpen(P(), c), openX = c => OPEN || L.examOpen(P(), c);
  const noteText = i => { const n = L.noteOf(P(), i), d = done(i); return n >= L.VALID ? `Nota ${n} · validat ✓` : d ? `Nota ${n} · ${d} de 10 nivells` : 'Per fer'; };
  const examBtn = c => `<button class="proj exam${passed(P(), c) ? ' ok' : ''}" data-x="${c}" aria-label="Examen del cercle ${c}"${openX(c) ? '' : ' disabled'}><b>Examen</b><span class="mk">${passed(P(), c) ? 'Superat ✓' : openX(c) ? what : openC(c) ? 'Valida els projectes' : 'Tancat'}</span></button>`;
  // the first project of an open circle still to validate, or the exam after them
  function advice() {
    for (let c = 0; c < L.CIRCLES.length && (o.skipShut || L.isOpen(P(), c)); c++) {
      if (!L.isOpen(P(), c)) continue;
      const i = L.CIRCLES[c].projects.find(i => L.noteOf(P(), i) < L.VALID);
      if (i !== undefined) return `Ara toca: ${L.PROJECTS[i].name}`;
      if (!passed(P(), c)) return `Ara toca: l'examen del cercle ${c}`;
    }
    return '';
  }
  // the level a project opens at: the first one that still has something to win, as far as the project is open
  const nextLevel = i => { const k = starsOf(i).findIndex(n => n < 3); return k < 0 ? 0 : Math.min(k, OPEN ? 9 : L.reached(P(), i), 9); };

  // The map in s.root. s says how it looks and what each button does:
  //   rings(c)          the emblem of circle c, before its name; head(c) instead gives the whole title
  //   ringCls(c), ringAttr(c), projAttr(i, c), icon(i, c), name(i)   classes, attributes and markup of a ring and of a project
  //   why(c)            a line of the circle before the one that says why it is shut
  //   pp                a row of stars under each project, one per level
  //   before, top       markup before and after the next thing to do; foot(got) markup after the circles (got: the badges)
  //   open(i), exam(c)  where a project and an exam lead; on: [[selector, fn]] the other buttons, the first that matches
  //   here              the project just left: the focus goes back to it
  function screen(s) {
    const { PROJECTS, CIRCLES } = L, root = s.root;
    const band = c => `<section class="ring${s.ringCls ? s.ringCls(c) : ''}${openC(c) ? '' : ' shut'}"${s.ringAttr ? s.ringAttr(c) : ''} aria-labelledby="rh${c}"><h2 id="rh${c}">${s.head ? s.head(c) : `${s.rings(c)}<span>Cercle ${c} · ${CIRCLES[c].name}</span>`}</h2>
      ${s.why ? s.why(c) : ''}${openC(c) ? '' : `<p class="why">Supera l'examen del cercle ${c - 1} per obrir-lo.</p>`}
      <div class="projs">${CIRCLES[c].projects.map(i => `<button class="proj${L.noteOf(P(), i) >= L.VALID ? ' ok' : ''}" data-p="${i}"${s.projAttr ? s.projAttr(i, c) : ''}${openC(c) ? '' : ' disabled'}>${s.icon ? s.icon(i, c) : ''}<b>${s.name ? s.name(i) : PROJECTS[i].name}</b><span>${PROJECTS[i].sub}</span>${s.pp ? `
        <span class="pp" aria-hidden="true">${starsOf(i).map(n => `<i class="s${n}"></i>`).join('')}</span>` : ''}<span class="mk">${noteText(i)}</span></button>`).join('')}${examBtn(c)}</div></section>`;
    const got = L.badges(P()), tip = advice();
    root.innerHTML = `<div class="map">${s.before || ''}${tip ? `<p class="next">${tip}</p>` : ''}${s.top || ''}${CIRCLES.map((_, c) => band(c)).join('')}${s.foot(got)}</div>`;
    root.onclick = e => {
      const b = e.target.closest('.proj:not(.exam)'), x = e.target.closest('.proj.exam');
      if (b && !b.disabled) s.open(+b.dataset.p);
      else if (x && !x.disabled) s.exam(+x.dataset.x);
      else for (const [sel, fn] of s.on || []) if (e.target.closest(sel)) { fn(); break; }
    };
    ($(`[data-p="${s.here}"]:not(:disabled)`, root) || $('button:not(:disabled)', root))?.focus({ preventScroll: true });
  }
  return { openC, openX, starsOf, noteText, examBtn, advice, nextLevel, screen };
}

// the badges of a game, the ones got lit
export const badgeList = (BADGES, got) => `<ul class="badges" aria-label="Insígnies">${BADGES.map((b, j) => `<li class="${got[j] ? 'on' : ''}" title="${b.what}">${got[j] ? '★' : '☆'} ${b.name}</li>`).join('')}</ul>`;
