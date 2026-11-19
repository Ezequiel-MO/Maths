// The real drums of the concert: the drawing of the child's own kit, and the levels of «Hakuna Matata» played on it and heard through
// the microphone (oida.js hears; logic.js keeps the pads and the bars of the song). Until the game has learnt how this kit sounds, a
// level first teaches it: the child hits each pad three times. With no microphone the pads of the drawing are tapped instead.
// While the game makes a sound of its own (a click, a slip, the bar it plays to listen to) it does not listen, or it would hear itself.
import { $, sleep } from '../../shared/util.js';
import { list } from '../../shared/shell.js';
import { KIT, PADS, BARS, drill } from './logic.js';
import { microphone, judge, learn, kept, keep, gap, apart, NB, SOFT } from './oida.js';

const IS = Object.fromEntries(PADS.map(p => [p.id, p.is]));
const padsOf = is => PADS.filter(p => p.is === is);
const cap = s => s[0].toUpperCase() + s.slice(1);
// things in words: «el charles i el bombo», and where to find them on the kit
const say = set => list([...set].map(is => KIT[is].el));
const both = set => [...set].length > 1 ? ' alhora' : '';
const look = is => padsOf(is).map(p => `${p.look}, on posa «${p.on}»`).join(', o ');
const again = e => { e.classList.remove('shake', 'ok', 'bad', 'heard'); void e.getBoundingClientRect(); return e.classList; };
// a box of the bar as a drummer counts it
const COUNT = ['1', 'i', '2', 'i', '3', 'i', '4', 'i'];
// the order the pads are learnt in: the ones of the song first, the cymbals at the end
const LEARN = ['bombo', 'caixa', 'charles', 'tom1', 'tom2', 'tom3', 'plat1', 'plat2', 'ride'];
// a hit that lies this far from the other two of its pad was another pad; after six tries the closest three are kept anyway
const ODD = 0.15, TRIES = 6;
// in time, how late a hit may come besides the leeway of each box: what the microphone takes to hear it
const LATE = 60;

// The mat seen from above: a dark hexagon under each pad, the speakers and the buttons at the back, and each pad with its colour,
// its name and the word printed on it. The bombo is a Y with a round pad at its foot
const hex = (x, y, r) => `<path d="${Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 3 * i + Math.PI / 6; return `${i ? 'L' : 'M'}${Math.round(x + r * Math.cos(a))} ${Math.round(y + r * Math.sin(a))}`; }).join('')}Z"/>`;
function padSvg(p) {
  const words = KIT[p.is].name.split(' '), two = words.length > 1;
  const name = two ? `<text class="bname" y="-34">${words[0]}</text><text class="bname" y="22">${words.slice(1).join(' ')}</text>` : `<text class="bname" y="0">${words[0]}</text>`;
  return `<g class="bpad" data-id="${p.id}" style="--c:${p.color}" transform="translate(${p.x} ${p.y})"><g class="bin">
    ${p.id === 'bombo' ? '<path class="by" d="M-235 -300L0 -40L235 -300"/>' : ''}
    <circle class="bring" r="${p.r}"/><circle class="bhole" r="${Math.round(p.r * 0.8)}"/><circle class="bline" r="${Math.round(p.r * 0.64)}"/>
    ${name}<text class="bon" y="${two ? 74 : 56}">${p.on}</text></g></g>`;
}
const drawing = () => `<svg class="bkit" viewBox="0 0 1400 1120" role="img" aria-label="La teva bateria, vista des d'on seus">
  <g class="bmat">${PADS.map(p => hex(p.x, p.y, p.r + 62)).join('')}${hex(440, 165, 170)}${hex(870, 165, 170)}<rect x="440" y="40" width="430" height="300" rx="30"/></g>
  <g class="bbox">${hex(440, 150, 105)}${hex(870, 150, 105)}<rect x="560" y="80" width="190" height="150" rx="22"/></g>
  <g class="bgrill"><circle cx="440" cy="150" r="70"/><circle cx="870" cy="150" r="70"/></g>
  ${PADS.map(padSvg).join('')}</svg>`;

// the steps of a song: every box of its bars that has hits, with the things hit in it
function stepsOf(L) {
  const out = [];
  L.bars.forEach((b, bar) => { for (let s = 0; s < 8; s++) { const want = L.rows.filter(d => BARS[b].rows[d]?.[s] === 'x'); if (want.length) out.push({ bar, s, want }); } });
  return out;
}
// the grid of one bar: a row for each thing of the song, a column for each box; showBar fills it with a bar of the song
const gridOf = L => `<p class="bbar" id="bbar"></p><div class="kit live bgrid" style="--n:8"><span class="kname"></span>${COUNT.map((c, s) => `<b class="num${s % 2 ? '' : ' alt'}">${c}</b>`).join('')}
  ${L.rows.map((d, i) => `<span class="kname"><i class="bdot" style="--c:${padsOf(d)[0].color}"></i><i>${KIT[d].name}</i></span>${COUNT.map((_, s) =>
    `<span class="cell fixed${Math.floor(s / 2) % 2 ? ' alt' : ''}" data-r="${i}" data-s="${s}"></span>`).join('')}`).join('')}</div>`;

// deps: hit(name) sounds a drum of the game, click(...) a tick of the metronome
export function bateria({ hit, click }) {
  // what the game learnt of this kit, kept on the device, and the judge made of it
  let cal = kept(), J = cal && judge(cal, IS);
  // a hook for the tests of the page: hits as if heard, with what they were, now or at a moment of performance.now(); t0 is when the
  // last song in time started
  let feed = null, t0 = 0;
  window.__bateria = { hit: (...is) => feed && feed({ at: performance.now(), got: is }), hitAt: (at, ...is) => feed && feed({ at, got: is }),
    get t0() { return t0; }, get learnt() { return !!cal; } };

  function bat({ t, L, stage, tip, slip: miss, spark, win }) {
    const M = microphone();
    let ear = null, deafTill = 0, screen = false, slip = () => { deaf(700); miss(); };
    const deaf = ms => { deafTill = Math.max(deafTill, performance.now() + ms); };
    // a sound much softer than the hits of the kit (the tail of a sound, a stick that bounced) is no hit: it is not even told
    const heard = h => { if (t.on && ear && h.at >= deafTill && !(h.f && cal && h.level < SOFT * cal.level)) ear(h); };
    feed = h => { if (t.on) heard(h); };
    // what a hit was, as the set of things heard (null: not a pad), when want was expected; and with nothing expected
    const what = (h, want) => h.got ? new Set(h.got) : J ? J(h.f, want).got : null;
    const guess = h => h.got ? new Set(h.got) : J ? J(h.f).best : null;

    // the grid of the song and the kit side by side where there is room, so both are seen while playing
    stage.innerHTML = `<p class="bmic" id="bmic">🎤 Un moment…</p><div class="bplay">${L.mode === 'pas' || L.mode === 'temps' ? `<div class="bgridw">${gridOf(L)}</div>` : ''}
      <div class="bwrap">${drawing()}</div></div><p class="bsaw" id="bsaw" aria-live="polite"></p><div class="opts bctl" id="bctl"></div>`;
    const svg = $('.bkit', stage), mic = $('#bmic', stage), saw = $('#bsaw', stage), ctl = $('#bctl', stage);
    const padEls = is => padsOf(is).map(p => svg.querySelector(`[data-id="${p.id}"]`));
    const light = set => svg.querySelectorAll('.bpad').forEach(g => g.classList.toggle('next', set.includes(IS[g.dataset.id])));
    const lightPad = id => svg.querySelectorAll('.bpad').forEach(g => g.classList.toggle('next', g.dataset.id === id));
    // a pad flashes for a moment: what it heard, a right hit or a wrong one
    const flash = (set, cls) => [...set].forEach(is => padEls(is).forEach(g => { again(g).add(cls); clearTimeout(g.fade); g.fade = setTimeout(() => g.classList.remove(cls), 650); }));

    // the pads of the drawing play when there is no microphone (a finger on a screen, or a mouse)
    svg.onpointerdown = e => {
      const g = e.target.closest('.bpad'); if (!screen || !g || !t.on) return;
      e.preventDefault(); const is = IS[g.dataset.id];
      hit(is); heard({ at: performance.now(), got: [is] });
    };
    function listen() {
      return M.start(heard, () => t.on).then(ok => {
        if (!t.on) return false;
        screen = !ok; stage.classList.toggle('btouch', screen);
        mic.innerHTML = ok ? '🎤 T\'escolto. La tauleta, a prop de la bateria, i el volum de la bateria ben alt.'
          : '🎤 No puc fer servir el micròfon, i sense ell no et sento. Toca els tambors del dibuix amb el dit. <button class="link" id="bretry">Torna-ho a provar</button>';
        if (!ok) $('#bretry', stage).onclick = () => listen().then(ok2 => { if (ok2) start(); });
        return ok;
      });
    }

    /* ---------- the game learns the kit: three hits of each pad ---------- */
    async function learnKit() {
      const hits = {}, dots = n => `<span class="bcal" aria-label="${n} de 3">${[0, 1, 2].map(i => `<i${i < n ? ' class="ok"' : ''}></i>`).join('')}</span>`;
      ctl.innerHTML = '';
      tip('Silenci un moment: escolto com sona l\'habitació…');
      await sleep(1200); if (!t.on) return false;
      // what is much softer than the loudest hit heard of any pad (some pads are twenty times softer than others) is a click; what is ten
      // times softer than the loudest hit of the same pad, a stick that bounced or the end of a sound
      let kitTop = 0;
      for (let k = 0; k < LEARN.length; k++) {
        const p = PADS.find(x => x.id === LEARN[k]), hs = hits[p.id] = [];
        let odd = 0;
        lightPad(p.id);
        const ask = (more = '') => tip(`${more}Tambor ${k + 1} de ${LEARN.length}: toca ${KIT[p.is].el} tres cops. És ${p.look}, on posa «${p.on}». ${dots(hs.length)}`);
        ask();
        await new Promise(done => {
          ear = h => {
            // a hit of the tests has no sound: it gets a shape of its own, one for each pad
            const f = h.f || Float64Array.from({ length: NB }, (_, b) => b === (2 * k) % NB || b === (2 * k + 7) % NB ? 1 : 0.01);
            const level = h.level ?? 1;
            kitTop = Math.max(kitTop, level);
            const top = Math.max(level, ...hs.map(x => x.level));
            if (level < kitTop / 300 || level < 0.1 * top) return;
            const n = hs.length;
            for (let i = hs.length - 1; i >= 0; i--) if (hs[i].level < 0.1 * top) hs.splice(i, 1);
            if (hs.length < n) odd = 0;
            hs.push({ f, level });
            if (hs.length < 3) { flash([p.is], 'ok'); return ask(); }
            // the one of the three that lies far from the other two was another pad: once more, unless it has been asked enough
            const gaps = hs.map((x, i) => gap(x.f, hs.filter((_, j) => j !== i).map(y => y.f))), worst = gaps.indexOf(Math.max(...gaps));
            if (gaps[worst] > ODD && odd < TRIES - 3) { odd++; hs.splice(worst, 1); flash([p.is], 'bad'); return ask('Un cop no sonava com els altres. '); }
            flash([p.is], 'ok'); spark(svg.querySelector(`[data-id="${p.id}"]`), 140); ask(); ear = null; done();
          };
        });
        if (!t.on) return false;
        await sleep(500); if (!t.on) return false;
      }
      cal = learn(Object.fromEntries(Object.entries(hits).map(([id, hs]) => [id, hs.map(h => h.f)]))); J = judge(cal, IS); keep(cal);
      lightPad('');
      return true;
    }
    // two pads that sound nearly the same may be taken for each other: the child is told which
    const twins = () => {
      const out = [];
      PADS.forEach((a, i) => PADS.slice(i + 1).forEach(b => { if (a.is !== b.is && cal.pads[a.id] && cal.pads[b.id] && apart(cal, a.id, b.id) < 0.08) out.push(`${KIT[a.is].el} i ${KIT[b.is].el}`); }));
      return out.length ? ` Compte: ${list(out)} sonen gairebé igual, i potser me'ls confondré.` : '';
    };

    /* ---------- coneix: learn the kit, then anything can be hit to see what is heard ---------- */
    async function coneix() {
      if (!screen && !await learnKit()) return;
      tip(`${screen ? 'Toca els tambors del dibuix i mira com es diuen.' : `Ja la conec! Ara toca el que vulguis i et dic què sento.${twins()}`} Quan acabis, prem «Fet!».`);
      ctl.innerHTML = `<button class="btn" id="bdone">Fet!</button>${screen ? '' : '<button class="link" id="bredo">Torna-la a aprendre</button>'}`;
      ear = h => {
        const g = guess(h);
        if (!g) { saw.textContent = 'No sé quin era. Torna-hi!'; return; }
        flash(g, 'heard'); saw.innerHTML = `Sento <b>${say(g)}</b>${both(g)}.`;
      };
      $('#bdone', stage).onclick = () => { ear = null; win('🥁 La teva bateria'); };
      if (!screen) $('#bredo', stage).onclick = () => { ear = null; saw.textContent = ''; coneix(); };
    }

    /* ---------- qui: the pad that lights up ---------- */
    function qui() {
      const seq = drill(L.set, L.n, Math.random);
      let k = 0, slipped = false;
      ctl.innerHTML = `<span class="steps bsteps">${seq.map(() => '<i></i>').join('')}</span>`;
      const dots = [...ctl.querySelectorAll('i')];
      const arm = () => { light([seq[k]]); dots.forEach((d, j) => d.classList.toggle('cur', j === k)); tip(k ? `Ara ${KIT[seq[k]].el}.` : `${L.say} Primer, ${KIT[seq[k]].el}.`); };
      ear = h => {
        const g = what(h, [seq[k]]);
        if (!g) { saw.textContent = 'No t\'he sentit bé. Torna-hi, una mica més fort.'; return; }
        if (g.size === 1 && g.has(seq[k])) {
          flash(g, 'ok'); spark(padEls(seq[k])[0], 140); dots[k].classList.add('ok'); saw.innerHTML = `Sí! <b>${cap(say(g))}</b>.`;
          k++; slipped = false;
          if (k === seq.length) { ear = null; light([]); return win('🥁 Ja coneixes tots els tambors'); }
          return arm();
        }
        if (!slipped) { slipped = true; slip(); }
        flash(g, 'bad'); saw.innerHTML = `Has tocat <b>${say(g)}</b>.`;
        tip(`Ui! Això era ${say(g)}. Busca ${KIT[seq[k]].el}: és ${look(seq[k])}.`, 'oops');
      };
      arm();
      return () => `${cap(KIT[seq[k]].el)} és ${look(seq[k])}. Al dibuix fa pampallugues.`;
    }

    /* ---------- the bars of the song on the grid ---------- */
    const cells = [...stage.querySelectorAll('.bgrid .cell')], bbar = $('#bbar', stage);
    let shown = -1;
    function showBar(k) {
      if (k === shown || !bbar) return;
      shown = k; const B = BARS[L.bars[k]];
      bbar.innerHTML = `<b>${B.name}</b> · compàs ${k + 1} de ${L.bars.length}`;
      cells.forEach(c => { const d = L.rows[+c.dataset.r]; c.className = `cell fixed${Math.floor(c.dataset.s / 2) % 2 ? ' alt' : ''}${B.rows[d]?.[+c.dataset.s] === 'x' ? ' x' : ''}`; });
    }
    const col = s => cells.forEach(c => c.classList.toggle('now', +c.dataset.s === s));
    const cellsAt = S => cells.filter(c => +c.dataset.s === S.s && S.want.includes(L.rows[+c.dataset.r]));
    // the song played by the game, at bpm, with the column moving: while it plays the game does not listen
    async function playSong(bpm) {
      const box = 60000 / bpm / 2, steps = stepsOf(L), n = L.bars.length * 8, start = performance.now() + 150;
      deaf(n * box + 900);
      for (const S of steps) setTimeout(() => { if (t.on) { S.want.forEach(d => hit(d)); flash(S.want, 'heard'); } }, start - performance.now() + (S.bar * 8 + S.s) * box);
      while (t.on) {
        const i = Math.floor((performance.now() - start) / box);
        if (i >= n) break;
        if (i >= 0) { showBar(Math.floor(i / 8)); col(i % 8); }
        await sleep(16);
      }
      col(-1);
      return t.on;
    }

    /* ---------- pas: each box waits for its hits ---------- */
    function pas() {
      const steps = stepsOf(L);
      let k = 0, got = new Set(), slipped = false, wait = null, busy = false;
      ctl.innerHTML = '<button class="btn soft" id="blisten">Escolta com sona</button>';
      function arm() {
        const S = steps[k];
        showBar(S.bar); col(S.s); light(S.want); got = new Set();
        saw.innerHTML = `Ara: <b>${say(S.want)}</b>${both(S.want)}.`;
      }
      ear = h => {
        const S = steps[k], g = what(h, S.want);
        if (busy || !g) return;
        clearTimeout(wait);
        if ([...g].some(x => !S.want.includes(x))) {
          got = new Set(); if (!slipped) { slipped = true; slip(); }
          flash(g, 'bad'); cellsAt(S).forEach(c => again(c).add('shake'));
          return tip(`Ui! Has tocat ${say(g)}. Ara toca ${say(S.want)}${both(S.want)}.`, 'oops');
        }
        g.forEach(x => got.add(x));
        if (S.want.every(x => got.has(x))) {
          flash(S.want, 'ok'); cellsAt(S).forEach(c => again(c).add('ok')); slipped = false;
          if (++k < steps.length) return arm();
          ear = null; light([]); col(-1); saw.textContent = '';
          return finish();
        }
        // one of the two came: the other must come with it
        wait = setTimeout(() => { if (!t.on) return; got = new Set(); tip(`Junts! ${cap(say(S.want))}${both(S.want)}: una mà a cada un.`); }, 700);
      };
      async function finish() {
        busy = true; tip('Molt bé! Ara escolta com sona.', 'go');
        if (!await playSong(70)) return;
        win(`♪ ${L.title}`);
      }
      $('#blisten', stage).onclick = async () => {
        if (busy) return; busy = true; light([]);
        if (await playSong(70)) { busy = false; arm(); }
      };
      tip(L.say); arm();
      return () => { const S = steps[k]; return busy ? '' : `Toca ${say(S.want)}${both(S.want)}: ${S.want.map(look).join('; ')}.`; };
    }

    /* ---------- temps: the song in time, after a bar of clicks ---------- */
    function temps() {
      const steps = stepsOf(L), box = 60000 / L.bpm / 2, n = L.bars.length * 8;
      const gaps = steps.slice(1).map((S, i) => ((S.bar - steps[i].bar) * 8 + S.s - steps[i].s) * box), tol = Math.min(170, 0.45 * Math.min(...gaps));
      let running = false;
      ctl.innerHTML = '<button class="btn" id="blisten">1 · Escolta</button><button class="btn soft" id="bmine">2 · Ara jo!</button><b class="countin" id="bcount" hidden></b>';
      const count = $('#bcount', stage), buttons = [...ctl.querySelectorAll('button')];
      async function go(mine) {
        if (running || !t.on) return;
        running = true; buttons.forEach(b => { b.hidden = true; }); count.hidden = false; light([]);
        // a bar of clicks to catch the beat: four clicks, one each beat
        const start = t0 = performance.now() + 8 * box + 100;
        deaf(start - performance.now() - (mine ? tol : -n * box - 900));
        for (let i = 0; i < 4; i++) setTimeout(() => { if (t.on && running) { count.textContent = i + 1; again(count).add('on'); click(i ? 880 : 1320, 0, 0.06, 0.1); } }, start - 8 * box - performance.now() + i * 2 * box);
        const evs = steps.map(S => ({ ...S, at: start + (S.bar * 8 + S.s) * box, got: new Set(), ok: false, bad: false }));
        let extra = 0;
        if (!mine) evs.forEach(E => setTimeout(() => { if (t.on && running) { E.want.forEach(d => hit(d)); flash(E.want, 'heard'); } }, E.at - performance.now()));
        ear = !mine ? null : h => {
          const near = evs.filter(E => !E.ok && h.at >= E.at - tol && h.at <= E.at + tol + LATE).sort((a, b) => Math.abs(h.at - a.at - LATE / 2) - Math.abs(h.at - b.at - LATE / 2))[0];
          if (!near) { const g = guess(h); if (g) { extra++; flash(g, 'bad'); } return; }
          const g = what(h, near.want); if (!g) return;
          if ([...g].some(x => !near.want.includes(x))) { near.bad = true; flash(g, 'bad'); if (near.bar === shown) cellsAt(near).forEach(c => again(c).add('shake')); return; }
          g.forEach(x => near.got.add(x));
          if (near.want.every(x => near.got.has(x))) { near.ok = true; flash(near.want, 'ok'); if (near.bar === shown) cellsAt(near).forEach(c => c.classList.add('ok')); }
        };
        await sleep(start - performance.now()); if (!t.on) return;
        count.textContent = mine ? 'Ara!' : 'Escolta…';
        const end = start + n * box;
        while (t.on && performance.now() < end) {
          const i = Math.floor((performance.now() - start) / box);
          if (Math.floor(i / 8) !== shown) { showBar(Math.floor(i / 8)); evs.filter(E => E.ok && E.bar === shown).forEach(E => cellsAt(E).forEach(c => c.classList.add('ok'))); }
          col(i % 8);
          // the pads of the box coming next light up a moment before it
          const next = evs.find(E => E.at > performance.now() - box * 0.3);
          light(next && next.at - performance.now() < box * 0.7 ? next.want : []);
          await sleep(16);
        }
        await sleep(tol + LATE + 250); if (!t.on) return;
        ear = null; running = false; col(-1); light([]); count.hidden = true; buttons.forEach(b => { b.hidden = false; });
        $('#blisten', stage).className = 'btn soft'; $('#bmine', stage).className = 'btn';
        if (!mine) return tip(`Ara tu! Prem «2 · Ara jo!». Primer sona un compàs de clics; després toca quan la columna arriba a cada rodona.`);
        const missed = evs.filter(E => !E.ok).length, wrong = evs.filter(E => E.ok && E.bad).length, errs = missed + wrong + extra, slack = Math.floor(evs.length / 8);
        if (errs <= slack) return win(`♪ ${L.title}${errs ? '' : ' · sense cap errada!'}`);
        slip();
        tip(`Gairebé! De ${evs.length} cops n'has fet bé ${evs.length - missed}.${wrong ? ` ${wrong} ${wrong > 1 ? 'tenien' : 'tenia'} un tambor de més.` : ''}${extra ? ` N'has tocat ${extra} fora de lloc.` : ''} Torna-hi!`, 'oops');
      }
      $('#blisten', stage).onclick = () => go(false); $('#bmine', stage).onclick = () => go(true);
      showBar(0); tip(`${L.say} Prem «1 · Escolta».`);
      return () => running ? '' : `Cada columna és mig temps: 1 i 2 i 3 i 4 i. Toca els tambors que tenen rodona just quan la columna hi arriba. ${L.rows.map(d => KIT[d].el).join(', ')}: cada un fa pampallugues al dibuix just abans de tocar-lo.`;
    }

    // the level starts once the microphone has answered; with it but without the kit learnt, the kit is learnt first
    let help = () => '';
    const RUN = { coneix, qui, pas, temps };
    async function start() {
      if (L.mode !== 'coneix' && !screen && !cal) {
        tip('Abans de tocar he d\'aprendre com sona la teva bateria.');
        if (!await learnKit()) return;
        tip(`Ja la conec!${twins()}`); await sleep(1500); if (!t.on) return;
      }
      help = RUN[L.mode]() || (() => '');
    }
    tip(L.say);
    listen().then(() => { if (t.on) start(); });
    // a hint costs a slip, and the slip makes a sound: the game stops listening for it
    return () => { const txt = help(); if (txt) deaf(700); return txt; };
  }
  return { bat };
}
