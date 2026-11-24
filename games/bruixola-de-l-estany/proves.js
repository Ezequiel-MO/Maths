// The screens of the new trials of «La brúixola de l'estany»: each one takes its item (logic.js) and the pieces of the question that main.js
// is asking (c), and calls c.good() when it is solved and c.bad(msg, reveal) for a mistake. Everything can be done by tapping, and the cards
// can also be dragged.
import { $, RM, sleep } from '../../shared/util.js';
import { ETAPES, DIES } from './logic.js';

// where in the island each kind of trial is played
export const SCENES = { mira: 'dial', ordre: 'dial', etapa: 'dial', intrus: 'dial', caixes: 'dial', diari: 'dial', riu: 'riu', frase: 2, multi: 2, subratlla: 2, fitxa: 2, vfn: 2, casa: 2, mural: 3, discurs: 4 };
export const sceneOf = it => it.st ?? (it.k === 'pick' ? (it.ctx ? 2 : it.e ?? 'dial') : SCENES[it.k] ?? 'dial');

/* ---------- cards that are tapped and then placed, or dragged ---------- */
// box holds cards (.dc) and places (.ds); drop(card, place) is called when one is put on the other
function tray(box, drop, openAt) {
  let sel = null, skip = 0;
  const choose = x => { sel?.classList.remove('sel'); sel = x; x?.classList.add('sel'); box.classList.toggle('picking', !!x); };
  box.addEventListener('pointerdown', e => {
    const card = e.target.closest('.dc'); if (!card || card.disabled || e.button > 0 || performance.now() < openAt) return;
    const x0 = e.clientX, y0 = e.clientY, id = e.pointerId; let ghost = null, over = null;
    const placeAt = (x, y) => document.elementFromPoint(x, y)?.closest('.ds:not(.shut)');
    const move = ev => {
      if (ev.pointerId !== id) return;
      if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 9) {
        const r = card.getBoundingClientRect(); ghost = card.cloneNode(true); ghost.classList.add('ghost'); ghost.style.width = r.width + 'px'; document.body.append(ghost); choose(card); card.classList.add('lifted');
      }
      if (ghost) {
        ghost.style.transform = 'translate(' + (ev.clientX - ghost.offsetWidth / 2) + 'px,' + (ev.clientY - ghost.offsetHeight / 2) + 'px) rotate(-2deg) scale(1.05)';
        const p = placeAt(ev.clientX, ev.clientY); if (p !== over) { over?.classList.remove('over'); over = box.contains(p) ? p : null; over?.classList.add('over'); }
      }
    };
    const end = ev => {
      if (ev.pointerId !== id) return;
      removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end);
      if (!ghost) return;
      ghost.remove(); card.classList.remove('lifted'); over?.classList.remove('over'); skip = performance.now() + 80;
      if (ev.type === 'pointerup' && over) drop(card, over); else choose(null);
    };
    addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
  });
  box.addEventListener('click', e => {
    if (performance.now() < skip || performance.now() < openAt) return;
    const card = e.target.closest('.dc'), place = e.target.closest('.ds');
    if (card && !card.disabled) { choose(sel === card ? null : card); return; }
    if (place && sel && !place.classList.contains('shut')) drop(sel, place);
  });
  return { clear: () => choose(null), get sel() { return sel; } };
}
const shake = (c, el) => c.again(el).add('shake');

/* ---------- the bottles of the river ---------- */
function riu(it, c) {
  const { ans, t, W, H } = c, queue = it.cards.slice(), total = queue.length;
  ans.innerHTML = '<div class="bottle" id="bot"><span class="bpic" aria-hidden="true">📜</span><p id="bmsg"></p><div class="tbar" aria-hidden="true"><i id="tb"></i></div></div><p class="found" id="fnd">' + '<i></i>'.repeat(total) + '</p>' + c.stages();
  const msg = $('#bmsg', ans), bar = $('#tb', ans), box = $('.compass', ans), bot = $('#bot', ans);
  let cur = null, t0 = 0, extra = 0, got = 0, wait = true, raf = 0;
  const dots = () => [...$('#fnd', ans).children].forEach((d, j) => d.classList.toggle('on', j < got));
  const enable = () => box.querySelectorAll('.pt').forEach(b => { b.disabled = false; b.classList.remove('no', 'ok', 'on'); });
  function next() {
    if (!t.on) return;
    if (!queue.length) { cancelAnimationFrame(raf); return c.good(bot); }
    cur = queue.shift(); wait = false; t0 = performance.now(); extra = 0; enable();
    msg.textContent = cur.t; c.again(bot).add('pop'); bar.style.width = '100%'; W.bottle();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!t.on) return;
    if (wait) return;
    const k = Math.min(1, (now - t0) / (it.secs * 1000 + extra));
    bar.style.width = (100 - k * 100) + '%'; bar.classList.toggle('late', k > 0.72); W.bottleAt(k);
    if (k >= 1) { wait = true; queue.push(cur); W.bottleMiss(); c.tip("S'ha escapat! Tornarà a passar.", 'oops'); c.streakBreak(); sleep(900).then(next); return; }
    raf = requestAnimationFrame(tick);
  }
  const choose = async b => {
    if (!b || b.disabled || wait || c.isDone()) return;
    const e = +b.dataset.e;
    if (e === cur.e) { wait = true; cancelAnimationFrame(raf); got++; dots(); c.point(box, e); b.classList.add('ok'); c.blip(c.up(got + 3)); W.bottleTo(e); c.spark(b, ETAPES[e].hue); c.tip(ETAPES[e].icona + ' <b>' + H(ETAPES[e].nom) + '</b>', 'go'); await sleep(620); next(); return; }
    b.classList.add('no'); b.disabled = true; shake(c, b);
    const over = await c.bad('No és aquesta etapa. Pensa: què estan fent?', () => {}); if (over) cancelAnimationFrame(raf);
  };
  ans.onclick = e => { if (e.timeStamp >= c.openAt) choose(e.target.closest('.pt')); };
  c.onStage = e => choose($('[data-e="' + e + '"]', box));
  c.key(e => { const n = '123456'.indexOf(e.key); if (n >= 0) { e.preventDefault(); choose($('[data-e="' + n + '"]', box)); } });
  c.hint(() => {
    extra += 6000;
    const left = [...box.querySelectorAll('.pt')].filter(b => !b.disabled && +b.dataset.e !== cur.e);
    left.slice(0, Math.max(0, left.length - 1)).forEach(b => { b.disabled = true; b.classList.add('no'); });
    return "T'he donat més temps i només en queden dues.";
  });
  sleep(350).then(next);
}

/* ---------- the odd one out ---------- */
function intrus(it, c) {
  const { ans, H } = c;
  ans.innerHTML = '<div class="grid2">' + it.opts.map((o, i) => '<button class="tcard" data-o="' + i + '">' + H(o.t) + '<small hidden>' + ETAPES[o.e].icona + ' ' + H(ETAPES[o.e].nom) + '</small></button>').join('') + '</div>';
  const reveal = () => ans.querySelectorAll('.tcard small').forEach(s => { s.hidden = false; });
  const choose = async b => {
    if (!b || b.disabled || c.isDone()) return;
    if (+b.dataset.o === it.ok) { b.classList.add('ok'); reveal(); return c.good(b); }
    b.classList.add('no'); b.disabled = true; shake(c, b);
    b.querySelector('small').hidden = false;
    await c.bad('Aquesta sí que hi va. Busca la que parla d’una altra etapa.', () => { reveal(); $('[data-o="' + it.ok + '"]', ans).classList.add('ok'); });
  };
  ans.onclick = e => { if (e.timeStamp >= c.openAt) choose(e.target.closest('[data-o]')); };
  c.hint(() => 'Tres cartes són de «' + ETAPES[it.e].nom + '»: ' + ETAPES[it.e].que);
}

/* ---------- each card in the box of its stage ---------- */
function caixes(it, c) {
  const { ans, H, W } = c;
  ans.innerHTML = '<div class="dbox"><div class="tray">' + it.cards.map((x, i) => '<button class="dc" data-i="' + i + '">' + H(x.t) + '</button>').join('') + '</div><div class="boxes n' + it.boxes.length + '">' + it.boxes.map(e => '<div class="ds cbox" data-e="' + e + '" style="--h:' + ETAPES[e].hue + '" role="button" tabindex="0"><span class="bh"><span aria-hidden="true">' + ETAPES[e].icona + '</span> ' + H(ETAPES[e].nom) + '</span><span class="bq">' + H(ETAPES[e].curt) + '</span><div class="inb"></div></div>').join('') + '</div></div>';
  const box = $('.dbox', ans);
  let left = it.cards.length;
  const T = tray(box, async (card, place) => {
    if (c.isDone()) return;
    const x = it.cards[+card.dataset.i], e = +place.dataset.e;
    T.clear();
    if (x.e === e) {
      card.disabled = true; card.classList.add('gone'); $('.inb', place).insertAdjacentHTML('beforeend', '<span class="mini">' + H(x.t) + '</span>');
      c.again(place).add('pop'); c.blip(c.up(it.cards.length - left + 4)); W.needle(e); c.spark(place, ETAPES[e].hue);
      if (--left === 0) c.good(place);
      return;
    }
    shake(c, card); await c.bad('Aquesta no va aquí. Pregunta’t: «' + ETAPES[x.e].preguntes[0] + '»', () => {});
  }, c.openAt);
  c.hint(() => { const b = T.sel || box.querySelector('.dc:not(:disabled)'); if (!b) return ''; const x = it.cards[+b.dataset.i]; c.again($('.cbox[data-e="' + x.e + '"]', ans)).add('glow'); c.again(b).add('glow'); return 'La caixa que brilla és la d’aquesta targeta.'; });
}

/* ---------- the steps of a project, in order ---------- */
function diari(it, c) {
  const { ans, H, W } = c, order = it.cards.map(x => x.e).sort((a, b) => a - b);
  let n = 0;
  ans.innerHTML = '<ol class="strip">' + order.map((_, j) => '<li class="slot st" data-n="' + j + '"><b>' + (j + 1) + '</b><span></span></li>').join('') + '</ol><div class="tray col">' + it.cards.map((x, i) => '<button class="tcard" data-i="' + i + '">' + H(x.t) + '</button>').join('') + '</div>';
  const choose = async b => {
    if (!b || b.disabled || c.isDone()) return;
    const x = it.cards[+b.dataset.i];
    if (x.e === order[n]) {
      const s = ans.querySelectorAll('.st')[n]; s.querySelector('span').textContent = x.t; s.classList.add('ok'); s.style.setProperty('--h', ETAPES[x.e].hue); s.querySelector('b').textContent = ETAPES[x.e].icona;
      b.disabled = true; b.classList.add('gone'); n++; c.blip(c.up(n + 3)); W.needle(x.e);
      if (n === order.length) return c.good(s);
      return;
    }
    shake(c, b); await c.bad(n ? 'Això encara no ha passat. Què ve just després de l’últim pas?' : 'Això no és el principi. Tot projecte comença amb una pregunta.', () => {});
  };
  ans.onclick = e => { if (e.timeStamp >= c.openAt) choose(e.target.closest('.tcard')); };
  c.hint(() => { const k = it.cards.findIndex(x => x.e === order[n]); c.again($('.tcard[data-i="' + k + '"]', ans)).add('glow'); return 'La que brilla és la que ve ara.'; });
}

/* ---------- the puzzle of who does what, or of the week ---------- */
function pla(it, c) {
  const { ans, H, W } = c;
  ans.innerHTML = '<ul class="clues">' + it.clues.map(t => '<li><button class="clue" aria-pressed="false">' + H(t) + '</button></li>').join('') + '</ul><div class="dbox"><div class="tray">' + it.cards.map((x, i) => '<button class="dc" data-i="' + i + '"><span aria-hidden="true">' + x.pic + '</span> ' + H(x.t) + '</button>').join('') + '</div>' +
    '<div class="plan' + (it.days ? ' days' : '') + '">' + it.slots.map((s, i) => '<div class="ds pslot' + (s.shut ? ' shut' : '') + '" data-s="' + i + '" role="button" tabindex="0">' + (s.pic ? '<span class="who" aria-hidden="true">' + s.pic + '</span>' : '') + '<b>' + H(s.t) + '</b><span class="inb">' + (s.shut ? '🎉 Festa' : '') + '</span></div>').join('') + '</div></div>';
  ans.querySelectorAll('.clue').forEach(b => { b.onclick = () => { const on = b.classList.toggle('used'); b.setAttribute('aria-pressed', String(on)); }; });
  const box = $('.dbox', ans);
  let left = it.cards.length;
  const T = tray(box, async (card, place) => {
    if (c.isDone()) return;
    const x = it.cards[+card.dataset.i], s = +place.dataset.s;
    T.clear();
    if (x.to === s) {
      card.disabled = true; card.classList.add('gone'); $('.inb', place).innerHTML = '<span class="mini">' + x.pic + ' ' + H(x.t) + '</span>'; place.classList.add('full');
      c.again(place).add('pop'); c.blip(c.up(it.cards.length - left + 4)); if (!it.days) W.crewHop(s); c.spark(place, 200);
      if (--left === 0) c.good(place);
      return;
    }
    shake(c, card); await c.bad(it.days ? 'Aquest dia no. Recorda l’ordre de les etapes i els dies de festa.' : 'Això no encaixa amb les pistes. Torna-les a llegir.', () => {});
  }, c.openAt);
  c.hint(() => { const b = T.sel || box.querySelector('.dc:not(:disabled)'); if (!b) return ''; c.again($('.pslot[data-s="' + it.cards[+b.dataset.i].to + '"]', ans)).add('glow'); c.again(b).add('glow'); return 'Aquesta feina va al lloc que brilla.'; });
}

/* ---------- a conversation: three turns ---------- */
function conversa(it, c) {
  const { ans, t, H, W } = c;
  let k = 0;
  ans.innerHTML = '<div class="chat" id="chat"></div><div class="hearts" aria-hidden="true">' + '<i></i>'.repeat(it.torns.length) + '</div><div class="opts" id="reply"></div>';
  const chat = $('#chat', ans), rep = $('#reply', ans);
  const add = (cls, html) => { chat.insertAdjacentHTML('beforeend', '<div class="msg ' + cls + '">' + html + '</div>'); chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); };
  const them = txt => add('them', '<span class="who" aria-hidden="true">' + it.who.pic + '</span><p><b>' + H(it.who.nom) + '</b>' + H(txt) + '</p>');
  function turn() {
    const T = it.torns[k]; them(T.diu); c.say(T.diu);
    rep.innerHTML = T.o.map((o, i) => '<button class="btn soft opt" data-o="' + i + '"><span class="ot">' + H(o.t) + '</span></button>').join('');
  }
  rep.onclick = async e => {
    const b = e.target.closest('[data-o]'); if (!b || b.disabled || c.isDone() || e.timeStamp < c.openAt) return;
    const T = it.torns[k], i = +b.dataset.o, o = T.o[i];
    if (i !== T.ok) { b.classList.add('no'); b.disabled = true; shake(c, b); await c.bad(it.who.nom + ': «' + H(o.re) + '»', () => {}); return; }
    rep.innerHTML = ''; add('me', '<p>' + H(o.t) + '</p>'); c.blip(c.up(k + 5));
    ans.querySelectorAll('.hearts i')[k].classList.add('on');
    await sleep(RM ? 150 : 550); if (!t.on) return;
    them(o.re); c.say(o.re); W.crewHop(['🐢', '🐿️', '🐰', '🦊'].indexOf(it.who.pic)); k++;
    await sleep(RM ? 300 : 1300); if (!t.on) return;
    if (k === it.torns.length) return c.good(chat);
    turn();
  };
  c.hint(() => { const T = it.torns[k], l = [...rep.querySelectorAll('[data-o]')].filter(b => !b.disabled && +b.dataset.o !== T.ok); if (l.length > 1) { l[0].disabled = true; l[0].classList.add('no'); return 'He tret una resposta que no ajuda.'; } return 'La bona és la que ajuda el grup a avançar.'; });
  turn();
}

/* ---------- underline the key words in the sentence ---------- */
function subratlla(it, c) {
  const { ans, H } = c, got = new Set();
  ans.innerHTML = '<p class="under">' + it.chunks.map((x, i) => '<button class="wd" data-w="' + i + '">' + H(x.t) + '</button>' + H(x.tail)).join(' ') + '</p><p class="found" id="fnd">' + '<i></i>'.repeat(it.n) + '</p>';
  const dots = () => [...$('#fnd', ans).children].forEach((d, j) => d.classList.toggle('on', j < got.size));
  ans.onclick = async e => {
    const b = e.target.closest('.wd'); if (!b || b.disabled || c.isDone() || e.timeStamp < c.openAt) return;
    const i = +b.dataset.w;
    if (got.has(i)) { got.delete(i); b.classList.remove('sel'); dots(); return; }
    got.add(i); b.classList.add('sel'); dots(); c.blip(c.up(got.size + 4));
    if (got.size < it.n) return;
    const wrong = [...got].filter(k => !it.chunks[k].key);
    if (!wrong.length) { got.forEach(k => $('[data-w="' + k + '"]', ans).classList.add('ok')); return c.good(b); }
    wrong.forEach(k => { const w = $('[data-w="' + k + '"]', ans); got.delete(k); w.classList.remove('sel'); w.classList.add('no'); w.disabled = true; shake(c, w); });
    dots(); await c.bad(wrong.length === 1 ? 'Aquesta paraula no és clau. Quina diu la dada?' : 'Aquestes no són clau. Busca les que diuen la dada.', () => {});
  };
  c.hint(() => { const k = it.chunks.findIndex((x, i) => x.key && !got.has(i)); c.again($('[data-w="' + k + '"]', ans)).add('glow'); return 'La que brilla és una paraula clau.'; });
}

/* ---------- fill the gaps of the note ---------- */
function fitxa(it, c) {
  const { ans, H } = c, left = new Set(it.parts.filter(p => p.b).map(p => p.b));
  ans.innerHTML = '<p class="note">' + it.parts.map(p => (p.b ? '<span class="gap" data-b="' + H(p.b) + '"></span>' + H(p.tail || '') : H(p.t))).join(' ') + '</p><div class="chips">' + it.opts.map((t, i) => '<button class="chipo" data-o="' + i + '">' + H(t) + '</button>').join('') + '</div>';
  ans.onclick = async e => {
    const b = e.target.closest('[data-o]'); if (!b || b.disabled || c.isDone() || e.timeStamp < c.openAt) return;
    const w = it.opts[+b.dataset.o];
    if (left.has(w)) {
      left.delete(w); b.disabled = true; b.classList.add('ok');
      const g = [...ans.querySelectorAll('.gap')].find(x => x.dataset.b === w); g.textContent = w; g.classList.add('full'); c.again(g).add('pop'); c.blip(c.up(5 + it.n - left.size));
      if (!left.size) c.good(g);
      return;
    }
    b.classList.add('no'); b.disabled = true; shake(c, b); await c.bad('Aquesta paraula no va a la fitxa. Mira la frase que brilla.', () => {});
  };
  c.hint(() => { const w = [...left][0], i = it.opts.indexOf(w); c.again($('[data-o="' + i + '"]', ans)).add('glow'); return 'La que brilla va a la fitxa.'; });
}

/* ---------- true, false or «it does not say» ---------- */
function vfn(it, c) {
  const { ans, t, H } = c, N = it.claims.length;
  let k = 0, busy = false;
  ans.innerHTML = '<p class="found" id="fnd">' + '<i></i>'.repeat(N) + '</p><div class="claim" id="cl"></div><div class="stamps"><button class="stamp v" data-a="v">✔ Veritat</button><button class="stamp f" data-a="f">✘ Fals</button><button class="stamp n" data-a="n">? No ho diu</button></div>';
  const cl = $('#cl', ans), reset = () => ans.querySelectorAll('.stamp').forEach(b => { b.disabled = false; b.classList.remove('no', 'ok'); });
  const show = () => { cl.textContent = '«' + it.claims[k].t + '»'; c.again(cl).add('pop'); reset(); c.clearMarks(); };
  ans.onclick = async e => {
    const b = e.target.closest('.stamp'); if (!b || b.disabled || busy || c.isDone() || e.timeStamp < c.openAt) return;
    const C = it.claims[k];
    if (b.dataset.a !== C.a) { b.classList.add('no'); b.disabled = true; shake(c, b); await c.bad(C.a === 'n' ? 'Busca-ho bé al text: hi surt?' : C.a === 'f' ? 'Compara-ho amb el text: diu ben bé això?' : 'Torna-ho a mirar: al text hi és.', () => {}); return; }
    busy = true; b.classList.add('ok'); if (C.s !== undefined) c.mark([C.s]); c.blip(c.up(k + 5)); c.tip(H(C.per), 'go'); k++;
    [...$('#fnd', ans).children].forEach((d, j) => d.classList.toggle('on', j < k));
    await sleep(RM ? 500 : 1700); if (!t.on) return;
    busy = false; if (k === N) return c.good(cl);
    show();
  };
  c.hint(() => { const C = it.claims[k]; if (C.s !== undefined) { c.mark([C.s], 'glow'); return 'Compara-ho amb la frase que brilla.'; } return 'Cap frase del text en parla.'; });
  show();
}

/* ---------- each sentence with the question it answers ---------- */
function casa(it, c) {
  const { ans, H } = c;
  ans.innerHTML = '<div class="dbox"><div class="tray col">' + it.cards.map((x, i) => '<button class="dc long" data-i="' + i + '">' + H(x.t) + '</button>').join('') + '</div><div class="board">' + it.qs.map((q, i) => '<div class="ds qslot" data-q="' + i + '" role="button" tabindex="0"><b>' + H(q) + '</b><div class="inb"></div></div>').join('') + '<div class="ds qslot bin" data-q="-1" role="button" tabindex="0"><b>🗑️ No respon cap pregunta</b><div class="inb"></div></div></div></div>';
  const box = $('.dbox', ans);
  let left = it.cards.length;
  const T = tray(box, async (card, place) => {
    if (c.isDone()) return;
    const x = it.cards[+card.dataset.i], q = +place.dataset.q;
    T.clear();
    if (x.to === q) {
      card.disabled = true; card.classList.add('gone'); $('.inb', place).insertAdjacentHTML('beforeend', '<span class="mini">' + H(x.t) + '</span>');
      c.again(place).add('pop'); c.blip(c.up(it.cards.length - left + 4)); c.spark(place, 280);
      if (--left === 0) c.good(place);
      return;
    }
    shake(c, card); await c.bad(q < 0 ? 'Aquesta frase sí que respon una pregunta. Quina?' : x.to < 0 ? 'Aquesta frase no respon cap de les preguntes.' : 'Aquesta frase respon una altra pregunta.', () => {});
  }, c.openAt);
  c.hint(() => { const b = T.sel || box.querySelector('.dc:not(:disabled)'); if (!b) return ''; c.again($('.qslot[data-q="' + it.cards[+b.dataset.i].to + '"]', ans)).add('glow'); c.again(b).add('glow'); return 'Aquesta frase va al lloc que brilla.'; });
}

/* ---------- the mural ---------- */
function mural(it, c) {
  const { ans, H, W } = c, m = { titol: '', pic: '', dades: [], hue: it.tema.hue };
  W.mural({ ...m }); W.scene(3, { view: 'mural' });
  ans.innerHTML = '<div class="dbox"><div class="poster" style="--h:' + it.tema.hue + '"><div class="ds zone ztit" data-z="titol" role="button" tabindex="0"><span>Títol</span></div><div class="ds zone zpic" data-z="dibuix" role="button" tabindex="0"><span>Dibuix</span></div><div class="ds zone zdad" data-z="dada" role="button" tabindex="0"><span>Tres dades</span><div class="inb"></div></div></div>' +
    '<div class="tray tight">' + it.cards.map((x, i) => '<button class="dc' + (x.pic ? ' pic' : '') + '" data-i="' + i + '">' + H(x.t) + '</button>').join('') + '</div></div>';
  const box = $('.dbox', ans), need = () => (m.titol ? 0 : 1) + (m.pic ? 0 : 1) + (3 - m.dades.length);
  const T = tray(box, async (card, place) => {
    if (c.isDone()) return;
    const x = it.cards[+card.dataset.i], z = place.dataset.z;
    T.clear();
    if (x.zone !== z) { shake(c, card); await c.bad(x.zone === 'titol' ? 'Això és un títol: va a dalt.' : x.zone === 'dibuix' ? 'Això és un dibuix.' : 'Això és una dada: va a la part de les dades.', () => {}); return; }
    if (x.no) { card.disabled = true; card.classList.add('wrongc'); shake(c, card); await c.bad(x.no, () => {}); return; }
    card.disabled = true; card.classList.add('gone');
    if (z === 'titol') { m.titol = x.t; place.innerHTML = '<b>' + H(x.t) + '</b>'; } else if (z === 'dibuix') { m.pic = x.t; place.innerHTML = '<span class="bigpic">' + H(x.t) + '</span>'; } else { m.dades.push(x.t); $('.inb', place).insertAdjacentHTML('beforeend', '<span class="mini">' + H(x.t) + '</span>'); }
    place.classList.add('full'); c.again(place).add('pop'); c.blip(c.up(9 - need())); W.mural({ ...m }); c.spark(place, it.tema.hue);
    if (!need()) c.good(place);
  }, c.openAt);
  c.hint(() => {
    const k = it.cards.findIndex((x, i) => !x.no && !$('[data-i="' + i + '"]', box).disabled && (x.zone !== 'titol' || !m.titol));
    if (k < 0) return ''; const b = $('[data-i="' + k + '"]', box); c.again(b).add('glow'); c.again($('[data-z="' + it.cards[k].zone + '"]', box)).add('glow'); return 'Aquesta targeta va al lloc que brilla.';
  });
}

/* ---------- the presentation, in front of the audience ---------- */
function discurs(it, c) {
  const { ans, t, H, W } = c, facts = it.cards.filter(x => x.role === 'dada').length, total = facts + 2;
  let n = 0;
  ans.innerHTML = '<div class="meter" aria-hidden="true"><span>👏</span><div class="tbar"><i id="ap" style="width:0%"></i></div></div><ol class="speech" id="sp"></ol><div class="tray col">' + it.cards.map((x, i) => '<button class="tcard" data-i="' + i + '">' + H(x.t) + '</button>').join('') + '</div>';
  const want = () => (n === 0 ? 'obre' : n <= facts ? 'dada' : 'tanca');
  ans.onclick = async e => {
    const b = e.target.closest('.tcard'); if (!b || b.disabled || c.isDone() || e.timeStamp < c.openAt) return;
    const x = it.cards[+b.dataset.i];
    if (x.role === want()) {
      b.disabled = true; b.classList.add('gone'); n++; $('#sp', ans).insertAdjacentHTML('beforeend', '<li>' + H(x.t) + '</li>'); $('#ap', ans).style.width = (n / total * 100) + '%';
      W.crowd('clap', n / total); c.blip(c.up(n + 4)); c.say(x.t);
      if (n === total) { W.celebrate(2); await sleep(RM ? 100 : 500); if (t.on) c.good($('#sp', ans)); }
      return;
    }
    shake(c, b); W.crowd('yawn');
    if (x.role === 'no') { b.disabled = true; b.classList.add('no'); }
    await c.bad(x.role === 'no' ? 'El públic badalla! Digues una frase clara.' : want() === 'obre' ? 'Primer has de saludar i dir de què parlaràs.' : want() === 'dada' ? 'Encara no has acabat: explica les dades.' : 'Ja has dit les dades. Ara toca tancar.', () => {});
  };
  c.hint(() => { const k = it.cards.findIndex((x, i) => x.role === want() && !$('[data-i="' + i + '"]', ans).disabled); c.again($('[data-i="' + k + '"]', ans)).add('glow'); return 'La que brilla és la que toca ara.'; });
}

const KINDS = { riu, intrus, caixes, diari, pla, conversa, subratlla, fitxa, vfn, casa, mural, discurs };
export function playNew(it, c) { const f = KINDS[it.k]; if (!f) return false; f(it, c); return true; }
