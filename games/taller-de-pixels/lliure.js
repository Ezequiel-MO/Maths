// The free workshop: an empty grid to draw whatever the child wants, with no marks and no stars. Every tool of the workshop is here
// (the bucket, a brush that paints in a mirror, undo), the turns and the filters of the projects with their pixels flying, the drawing
// walking across its screen, and under it the maths of what is drawn, always up to date: how many pixels, the fraction of each colour,
// the mirrors it keeps and its perimeter. A drawing can be kept in the gallery of this browser, and printed as a template of ironing
// beads with the beads to buy, in bags of ten.
import { $ } from '../../shared/util.js';
import { COLORS, W, blank, painted, colorsOf, count, simp, F, symV, symH, rot90, flipV, from, recolor, NEG, GRAY, GB, pixelate,
  scale, outline, anim, one } from './logic.js';
import { makeBoard, SCREENS, spriteSvg, hexOf } from './pixels.js';

const SIZES = [8, 12, 16];
const PAL = ['r', 'o', 'y', 'g', 'c', 'b', 'l', 'p', 't', 'm', 'w', 'n', 'k'];
const STORE = 'taller-de-pixels:galeria', MAX = 12;
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const many = ch => COLORS[ch].many;

// the gallery lives in this browser only: when it cannot be read or written, the workshop works the same with no gallery
function gallery() { try { const a = JSON.parse(localStorage.getItem(STORE) || '[]'); return Array.isArray(a) ? a.filter(g => Array.isArray(g) && g.length && g.every(r => typeof r === 'string' && r.length === g[0].length)) : []; } catch (e) { return []; } }
function keep(a) { try { localStorage.setItem(STORE, JSON.stringify(a.slice(0, MAX))); return true; } catch (e) { return false; } }

// the sides of pixel between a painted pixel and an empty one (or the edge): the perimeter of what is drawn
export const perimeter = g => g.reduce((n, r, i) => n + [...r].reduce((m, c, j) => c === '.' ? m
  : m + [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].filter(([a, b]) => (g[a]?.[b] ?? '.') === '.').length, 0), 0);
// the pixels of the same colour as (f, c) that touch it, and the ones that touch those, painted ch
function bucket(g, f, c, ch) {
  const rows = g.map(r => [...r]), was = rows[f - 1][c - 1];
  if (was === ch) return g;
  const todo = [[f - 1, c - 1]];
  while (todo.length) { const [i, j] = todo.pop(); if (rows[i]?.[j] !== was) continue; rows[i][j] = ch; todo.push([i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]); }
  return rows.map(r => r.join(''));
}

export function studio({ t, root, blip, chime, frog, celebrate }) {
  let n = 16, g = blank(n, n), brush = 'r', tool = 'brush', mirror = false, scr = 'monitor', B = null, walking = false, undo = [], echo = false;
  root.innerHTML = `<div class="coach" id="coach">${frog}<p class="status tip" id="tip"></p></div>
    <div class="studio">
      <div class="row"><span class="cap">Quadre</span>${SIZES.map(s => `<button class="chip pick" data-n="${s}">${s} × ${s}</button>`).join('')}</div>
      <div class="row"><span class="cap">Pantalla</span><select id="scr" class="chip">${Object.entries(SCREENS).map(([k, s]) => `<option value="${k}">${s.name}</option>`).join('')}<option value="">Cap</option></select></div>
      <div class="board" id="board"></div>
      <div class="palette" id="pal" role="radiogroup" aria-label="Colors">${[...PAL, '.'].map(ch => `<button class="pc${ch === '.' ? ' rub' : ''}" data-c="${ch}" role="radio" aria-label="${ch === '.' ? 'Goma' : one(ch)}" style="--c:${ch === '.' ? 'transparent' : COLORS[ch].hex}">${ch === '.' ? 'Goma' : ''}</button>`).join('')}</div>
      <div class="tools" id="tools">
        <button class="tool" data-t="brush">🖌️ Pinzell</button><button class="tool" data-t="fill">🪣 Galleda</button>
        <button class="tool" data-m="1" aria-pressed="false">🪞 Pinzell mirall</button><button class="tool" data-a="undo">↩️ Desfés</button><button class="tool" data-a="clear">🗑️ Esborra-ho</button>
      </div>
      <div class="tools">
        <button class="tool" data-a="rot">↻ Quart de volta</button><button class="tool" data-a="flip">⇆ Mirall</button>
        <button class="tool" data-a="neg">Negatiu</button><button class="tool" data-a="gray">Blanc i negre</button><button class="tool" data-a="gb">4 verds</button>
        <button class="tool" data-a="pix">Pixela</button><button class="tool" data-a="edge">Contorn</button><button class="tool" data-a="walk">🦀 Fes-lo caminar</button>
      </div>
      <div class="stats" id="stats" aria-live="polite"></div>
      <div class="tools"><button class="btn soft" data-a="save">💾 Desa a la galeria</button><button class="btn soft" data-a="print">🖨️ Plantilla de boletes</button></div>
      <div class="gallery" id="gal"></div>
    </div>`;
  const tip = txt => { $('#tip').innerHTML = `<span>${txt}</span>`; };
  tip('El taller lliure: dibuixa el que vulguis! A sota tens les matemàtiques del teu dibuix: quants píxels, quina fracció és de cada color i si és simètric.');

  const base = () => ({ g, screen: scr || null });
  function board() {
    $('#board').innerHTML = '';
    B = makeBoard($('#board'), t, { paint: { given: blank(n, n), brush: () => brush, onDown, onChange }, max: 520 });
    B.show(base(), { reveal: false });
  }
  const remember = () => { undo.push(g.slice()); if (undo.length > 40) undo.shift(); };
  function onDown(f, c) {
    if (walking) return true;
    remember();
    if (tool !== 'fill') return false;
    const next = bucket(g, f, c, brush);
    if (next !== g) { g = next; B.load(g); blip(520); stats(); }
    return true;
  }
  function onChange(f, c, ch) {
    g = B.grid();
    if (mirror && !echo) { echo = true; B.put(f, n + 1 - c, ch); echo = false; g = B.grid(); }
    stats();
  }
  // a change to the whole drawing: kept for undo, then flying (src) or turning over (a filter)
  function change(next, src) {
    remember(); const was = g; g = next;
    if (src) B.morph(base(), src(was)); else B.filter(base());
    blip(700); stats();
  }

  function stats() {
    const N = n * n, k = painted(g), cs = colorsOf(g).sort((a, b) => count(g, b) - count(g, a));
    const fr = (a, b) => { const [x, y] = simp(a, b); return x === a ? F(a, b) : `${F(a, b)} = ${F(x, y)}`; };
    $('#stats').innerHTML = k ? `<p><b>${plural(k, 'píxel pintat', 'píxels pintats')}</b> de ${n} × ${n} = ${N}: ${fr(k, N)} del quadre.</p>
      <ul>${cs.map(ch => `<li><b class="sw" style="--c:${COLORS[ch].hex}"></b>${count(g, ch)} ${count(g, ch) === 1 ? one(ch) : many(ch)}: ${fr(count(g, ch), N)} del quadre</li>`).join('')}</ul>
      <p>Mirall vertical: ${symV(g) ? '✓ simètric' : '✗ no'} · Mirall horitzontal: ${symH(g) ? '✓ simètric' : '✗ no'} · Perímetre: ${perimeter(g)} costats</p>`
      : '<p>Encara no hi ha res pintat. Tria un color i toca la quadrícula!</p>';
  }

  function paintGallery() {
    const a = gallery();
    $('#gal').innerHTML = a.length ? `<p class="cap">La teva galeria</p><div class="thumbs">${a.map((d, i) => `<span class="thumb"><button class="th" data-i="${i}" aria-label="Obre el dibuix ${i + 1}">${spriteSvg(d, '', '#0D2B39')}</button><button class="del" data-d="${i}" aria-label="Esborra el dibuix ${i + 1}">×</button></span>`).join('')}</div>` : '';
  }

  function setSize(s, keepG) {
    n = s; g = keepG || blank(n, n); undo = [];
    root.querySelectorAll('[data-n]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.n === n));
    board(); stats();
  }
  function pickTool(x) { tool = x; root.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tool)); }
  function pickC(ch) { brush = ch; $('#pal').querySelectorAll('.pc').forEach(b => b.setAttribute('aria-checked', b.dataset.c === ch)); }

  function walk() {
    if (walking) return stopWalk();
    if (!painted(g)) return tip('Primer dibuixa alguna cosa, i després la faràs caminar!');
    walking = true; $('#board').inert = true;
    root.querySelector('[data-a="walk"]').textContent = '⏹ Para';
    // the drawing runs to the right and comes back in from the left, hopping one row up at every other step
    const frames = Array.from({ length: n }, (_, k) => g.map((_, i) => { const r = g[i + (k % 2)] ?? '.'.repeat(n); return r.slice(n - k) + r.slice(0, n - k); }));
    B.show(anim(frames, { fps: 6, screen: scr || null }), { reveal: false });
    tip(`Camina ${n} passos i torna a començar: una columna a cada fotograma, 6 fotogrames per segon. Una volta sencera dura ${n} : 6 segons!`);
  }
  function stopWalk() {
    walking = false; $('#board').inert = false;
    root.querySelector('[data-a="walk"]').textContent = '🦀 Fes-lo caminar';
    B.show(base(), { reveal: false });
  }

  function print() {
    if (!painted(g)) return tip('La plantilla surt del teu dibuix: primer pinta alguna cosa!');
    const cs = colorsOf(g).sort((a, b) => count(g, b) - count(g, a)), k = painted(g), cell = Math.min(36, Math.floor(640 / n));
    const svg = `<svg viewBox="0 0 ${n * cell + 30} ${n * cell + 30}" width="${n * cell + 30}">${Array.from({ length: n }, (_, j) => `<text x="${30 + (j + 0.5) * cell}" y="18" font-size="11" text-anchor="middle">${j + 1}</text>`).join('')}${Array.from({ length: n }, (_, i) => `<text x="14" y="${30 + (i + 0.5) * cell + 4}" font-size="11" text-anchor="middle">${i + 1}</text>`).join('')}
      ${g.flatMap((r, i) => [...r].map((c, j) => `<circle cx="${30 + (j + 0.5) * cell}" cy="${30 + (i + 0.5) * cell}" r="${cell * 0.42}" fill="${c === '.' ? '#fff' : hexOf(c)}" stroke="#999" stroke-width="1"/>`)).join('')}</svg>`;
    let el = document.getElementById('print');
    if (!el) { el = document.createElement('section'); el.id = 'print'; document.body.append(el); }
    el.innerHTML = `<h1>El meu dibuix de boletes</h1><p>Un quadre de ${n} × ${n}. Cada cercle és una boleta: hi ha els números de les columnes a dalt i els de les files a l'esquerra.</p>${svg}
      <h2>La llista de la compra (bosses de 10 boletes)</h2><table><tr><th>Color</th><th>Boletes</th><th>Bosses</th><th>En sobren</th></tr>${cs.map(ch => { const m = count(g, ch), b = Math.ceil(m / 10);
        return `<tr><td><span class="dot" style="background:${hexOf(ch)}"></span>${one(ch)}</td><td>${m}</td><td>${b}</td><td>${b * 10 - m}</td></tr>`; }).join('')}
      <tr><th>Total</th><th>${k}</th><th>${cs.reduce((s, ch) => s + Math.ceil(count(g, ch) / 10), 0)}</th><th></th></tr></table>`;
    tip(`La plantilla té ${k} boletes. A la llista hi ha quantes bosses de 10 calen de cada color!`);
    setTimeout(() => globalThis.print?.(), 100);
  }

  root.onclick = async e => {
    const b = e.target.closest('button'); if (!b || !t.on) return;
    if (b.dataset.n) { if (+b.dataset.n !== n) { const old = g; setSize(+b.dataset.n); if (painted(old)) tip(`Quadre nou de ${n} × ${n}: ${n * n} píxels per pintar.`); } return; }
    if (b.dataset.c) { pickC(b.dataset.c); blip(520); return; }
    if (b.dataset.t) { pickTool(b.dataset.t); blip(600); tip(tool === 'fill' ? 'La galleda pinta tots els píxels del mateix color que es toquen.' : 'El pinzell pinta píxel a píxel. Arrossega el dit per pintar-ne molts.'); return; }
    if (b.dataset.m) { mirror = !mirror; b.setAttribute('aria-pressed', mirror); blip(600); tip(mirror ? `Pinzell mirall: cada píxel que pintes també es pinta a l'altra banda. La columna c i la ${n + 1} − c són bessones!` : 'Pinzell mirall apagat.'); return; }
    if (b.dataset.i) { const d = gallery()[+b.dataset.i]; if (d) { setSize(W(d), d.slice()); tip('Aquí tens el teu dibuix!'); } return; }
    if (b.dataset.d) { const a = gallery(); a.splice(+b.dataset.d, 1); keep(a); paintGallery(); return; }
    const a = b.dataset.a; if (!a) return;
    if (a === 'walk') return walk();
    if (walking) stopWalk();
    if (a === 'undo') { if (!undo.length) return tip('No hi ha res per desfer.'); g = undo.pop(); B.load(g); stats(); blip(440); return; }
    if (a === 'clear') { if (!painted(g)) return; remember(); g = blank(n, n); B.load(g); stats(); tip('Quadre net. Si t\'has equivocat, prem «Desfés».'); return; }
    if (!painted(g) && a !== 'save') return tip('Primer dibuixa alguna cosa!');
    if (a === 'rot') { change(rot90(g), from.rot90); tip('Un quart de volta: el píxel (f, c) va a parar a (c, ' + (n + 1) + ' − f).'); }
    else if (a === 'flip') { change(flipV(g), from.flipV); tip(`Mirall: el píxel (f, c) va a (f, ${n + 1} − c).`); }
    else if (a === 'neg') { change(recolor(g, NEG)); tip('Negatiu: cada color, el seu contrari. Hi ha els mateixos píxels pintats!'); }
    else if (a === 'gray') { change(recolor(g, GRAY)); tip('Blanc i negre: els colors canvien, però no quants píxels hi ha.'); }
    else if (a === 'gb') { change(recolor(g, GB)); tip('Els 4 verds de les consoles antigues de butxaca.'); }
    else if (a === 'pix') { change(scale(pixelate(g, 2), 2)); tip(`Pixelat: cada bloc de 2 × 2 es torna d'un sol color, el que hi ha més. Ara és com un dibuix de ${n / 2} × ${n / 2}.`); }
    else if (a === 'edge') { const before = painted(g); change(outline(g)); tip(`Contorn: queden els píxels de la vora. Abans n'hi havia ${before} i ara ${painted(g)}: se n'han esborrat ${before - painted(g)}.`); }
    else if (a === 'save') {
      if (!painted(g)) return tip('Un dibuix buit no es pot desar.');
      const list = gallery(); if (list.some(d => d.join() === g.join())) return tip('Aquest dibuix ja és a la galeria.');
      if (keep([g, ...list])) { paintGallery(); chime([660, 880]); celebrate(); tip(`Desat! A la galeria hi caben ${MAX} dibuixos.`); } else tip('No s\'ha pogut desar en aquest navegador.');
    }
    else if (a === 'print') print();
  };
  $('#scr').value = scr;
  $('#scr').onchange = () => { scr = $('#scr').value; if (walking) stopWalk(); B.show(base(), { reveal: false }); blip(600); tip(scr ? `Ara el teu dibuix és en una pantalla: ${SCREENS[scr].name.toLowerCase()}.` : 'Sense pantalla.'); };
  pickTool('brush'); pickC(brush); setSize(n); paintGallery();
}
