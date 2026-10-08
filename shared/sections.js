// What the games made of sections of ten levels share. Goes with sections.css.

// a glass card over the stage, with the focus on its first button
export function panel(host, html) {
  host.querySelector('.panel')?.remove();
  host.insertAdjacentHTML('beforeend', `<div class="panel">${html}</div>`);
  host.querySelector('.panel button').focus({ preventScroll: true });
}

// The menu of sections under a line of introduction. done[i] counts the levels done in section i: a section opens when
// the one before is complete, and go(section, level) is called with the first level of it still to do.
// note(i) adds something of the game's own after the count of section i. all opens every section whatever is done.
export function sectionMenu(root, intro, sections, done, go, note = () => '', all = false) {
  const open = s => all || s === 0 || done[s - 1] >= 10;
  root.innerHTML = `<p class="status tip">${intro}</p>
    <nav class="secs" aria-label="Seccions">${sections.map((s, i) => { const n = done[i]; return `<button class="sec${n >= 10 ? ' all' : ''}" data-s="${i}"${open(i) ? '' : ' disabled'}>
      <span class="sec-n">${i + 1}</span><span class="sec-t"><b>${s.name}</b><span>${open(i) ? s.sub : 'Acaba la secció anterior per obrir-la'}</span></span>
      <span class="sec-p"><span class="pips">${Array.from({ length: 10 }, (_, k) => `<i${k < n ? ' class="ok"' : ''}></i>`).join('')}</span>${n} de 10${note(i)}</span></button>`; }).join('')}</nav>`;
  root.querySelector('.secs').onclick = e => { const b = e.target.closest('.sec'); if (b && !b.disabled) go(+b.dataset.s, Math.min(done[+b.dataset.s], 9)); };
  root.querySelector('.sec:not(:disabled)').focus({ preventScroll: true });
}

// the row of level buttons of a section: done of them are done, idx is the one on screen, the ones after the next are closed
export const levelRow = (levels, done, idx) => `<nav class="levels" aria-label="Nivells">${levels.map((_, i) => `<button data-n="${i}" class="${i < done ? 'done' : ''}"${i === idx ? ' aria-current="true"' : ''}${i > done ? ' disabled title="Supera el nivell anterior"' : ''}>${i + 1}</button>`).join('')}</nav>`;
// the row scrolls sideways on a phone: start with the level on screen in the middle. go(level) is called when one is picked
export function wireLevels(root, go) {
  const nav = root.querySelector('.levels'), a = nav.getBoundingClientRect(), c = nav.querySelector('[aria-current]').getBoundingClientRect();
  nav.scrollLeft += c.left - a.left - (a.width - c.width) / 2;
  nav.onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) go(+b.dataset.n); };
}
