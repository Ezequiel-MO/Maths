// What the games share around their levels: the panel over the stage and the row of level buttons. Goes with sections.css.

// a glass card over the stage, with the focus on its first button
export function panel(host, html) {
  host.querySelector('.panel')?.remove();
  host.insertAdjacentHTML('beforeend', `<div class="panel">${html}</div>`);
  host.querySelector('.panel button').focus({ preventScroll: true });
}

// the row of level buttons of a section: done of them are done, idx is the one on screen, the ones after the next are closed
export const levelRow = (levels, done, idx) => `<nav class="levels" aria-label="Nivells">${levels.map((_, i) => `<button data-n="${i}" class="${i < done ? 'done' : ''}"${i === idx ? ' aria-current="true"' : ''}${i > done ? ' disabled title="Supera el nivell anterior"' : ''}>${i + 1}</button>`).join('')}</nav>`;
// the row scrolls sideways on a phone: start with the level on screen in the middle. go(level) is called when one is picked
export function wireLevels(root, go) {
  const nav = root.querySelector('.levels'), a = nav.getBoundingClientRect(), c = nav.querySelector('[aria-current]').getBoundingClientRect();
  nav.scrollLeft += c.left - a.left - (a.width - c.width) / 2;
  nav.onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) go(+b.dataset.n); };
}
