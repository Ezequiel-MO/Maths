import { GAMES } from '../shared/games.js';
import { load } from '../shared/progress.js';

// one card per game, with what this player has won in it when there is something saved
document.querySelector('.games').innerHTML = GAMES.map(g => `<li><a class="game" href="${g.href}">
  ${g.icon}
  <span class="txt"><span class="tag">${g.tag}</span><b>${g.title}</b><span class="what">${g.what}</span><span class="rec">${g.record(load(g.store) || {}, g.total)}</span></span></a></li>`).join('');
