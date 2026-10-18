import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice, pentatonic } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';
import { PROJECTS, CIRCLES, POOL, POINTS, EXAM_PASS, VALID, starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf,
  BADGES, badges, levelIn, poolIn, exam, examIn, examItem, sheet, sheetIn, streakIn, wordsIn, mockDone, round, pool, mock, VOCAB, W, LEARN } from './logic.js';
import { GROUPS } from './content.js';
import { speak, hush, canSpeak, english } from './speech.js';
import { FROG, RADIO, picHtml, monster, shape, HEX, CA } from './art.js';

const KEY = 'estany-parla-angles';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, stars, piscina, exams, fulls, ratxa, best, proves, words }. clean() makes a complete progress out of anything
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
// every new screen cancels the running one through this token, and stops the voice
let keyFn = null;
const fresh = tokens(() => { hush(); keyFn = null; });

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
const FX = pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');
const fanfare = () => chime([523, 659, 784, 1047, 1319]);
const up = pentatonic(523);

const HURRAY = ['Well done!', 'Great!', 'Super!', 'Fantastic!', 'Brilliant!', 'Yes!', 'Perfect!', 'Good job!'];
const HUES = [45, 200, 330, 140, 262, 20];
const again = e => { e.classList.remove('shake', 'pop'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 16, 130); } };
const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const count = a => a.filter(Boolean).length;

const HUB = ownPage(KEY);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });

/* ---------- small things that fly in: a new word in the album, a badge ---------- */
function toast(html) {
  const e = document.createElement('div'); e.className = 'toast'; e.innerHTML = html; e.setAttribute('role', 'status');
  document.body.append(e); setTimeout(() => e.remove(), 2600);
}
// the word of an item goes into the album the first time it is answered right
function collect(key) {
  if (!key || !W[key]) return;
  const r = wordsIn(prog, [key]);
  if (!r.got.length) return;
  prog = r.prog; save();
  toast(`<span class="tw">${picHtml(W[key].pic)}</span><span><small>Nova paraula a l'àlbum</small><b>${H(W[key].word)}</b></span>`);
  if (r.news.length) setTimeout(() => toast(`★ <b>${H(list(r.news))}</b>`), 900);
}
// the run of right answers in a row: the record is kept
let streak = 0;
function streakUp() {
  streak++; combo(streak);
  if (streak > prog.ratxa) { const r = streakIn(prog, streak); prog = r.prog; save(); if (r.news.length) toast(`★ <b>${H(list(r.news))}</b>`); }
}
function streakBreak() { streak = 0; combo(0); }

/* ---------- the voice ---------- */
// The play buttons of a recording. limit is how many times it can be heard (Infinity in the levels, 2 in exams and in the simulacre,
// as in the test). Without a voice in the browser, the words are shown instead
function audioHtml(label = 'Listen', small = false) {
  return `<div class="audio${small ? ' small' : ''}"><button class="play" data-play>🔊 <span>${label}</span></button><button class="slow" data-slow aria-label="A poc a poc">🐢</button><span class="left"></span></div>`;
}
function player(box, lines, limit) {
  let left = limit;
  const el = $('.audio', box);
  const paint = () => { const l = $('.left', el); if (l) l.textContent = Number.isFinite(left) ? (left ? `${left} ${left === 1 ? 'vegada' : 'vegades'}` : 'ja no') : ''; };
  if (!canSpeak && el) el.insertAdjacentHTML('beforeend', `<p class="heard">${H([].concat(lines).join(' '))}</p>`);
  function play(slow = false) {
    if (left <= 0) return false;
    if (Number.isFinite(left)) left--;
    paint(); el.classList.add('on'); el.classList.remove('wake');
    speak(lines, slow).then(() => el.classList.remove('on'));
    return true;
  }
  if (el) el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (!play('slow' in b.dataset) && Number.isFinite(limit)) b.closest('.audio').classList.add('shake'); };
  paint();
  return { play, get left() { return left; } };
}

/* ---------- the map ---------- */
const RING = [45, 200, 320];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><circle r="13" fill="#F7C64E" stroke="hsl(${RING[c]} 70% 62%)" stroke-width="2.4"/><text y="5" text-anchor="middle" font-size="13" font-weight="800" fill="#6B4A10">${c + 1}</text></svg>`;
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'stars' });
let here = -1;
function mapa() {
  fresh(); show("El mapa de l'anglès", false, 200);
  const w = count(prog.words), pct = Math.round(100 * w / VOCAB.length);
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${PROJECTS[i].icon}</span>`, pp: true,
    before: `<div class="hero">${FROG}<p class="bubble">Hello! A l'abril hi ha la prova d'anglès de 4t. Cada dia una mica, i la passarem!</p></div>
      <div class="cards"><button class="card mockc" id="mockb"><span class="ci" aria-hidden="true">🎯</span><b>Simulacre de la prova</b><span>20 preguntes, com a l'abril</span><span class="mk">${prog.proves ? `Rècord: ${prog.best} de 20` : 'Encara no l’has fet'}</span></button>
      <button class="card albc" id="albb"><span class="ci" aria-hidden="true">📒</span><b>Àlbum de paraules</b><span>${w} de ${VOCAB.length}</span><span class="meter" aria-hidden="true"><i style="width:${pct}%"></i></span></button></div>
      ${prog.ratxa ? `<p class="grow">🔥 Rècord de ratxa: ${prog.ratxa} encerts seguits</p>` : ''}
      ${canSpeak ? '<p class="grow novoice" id="novoice" hidden>Aquest aparell no té cap veu en anglès instal·lada: pot sonar estrany.</p>' : '<p class="grow novoice">Aquest navegador no pot parlar: les gravacions sortiran escrites.</p>'}`,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="full"${OPEN || validated(prog).length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full], ['#mockb', simulacre], ['#albb', album]] });
  here = -1;
  if (canSpeak) setTimeout(() => { const n = $('#novoice'); if (n && !english()) n.hidden = false; }, 1500);
}

/* ---------- what goes over the questions: the radio, the topic, the text ---------- */
const star = s => H(s).replace(/\*/g, '<sup>*</sup>');
function textHtml(T, learn) {
  return `<article class="text"><h3><span aria-hidden="true">${T.pic}</span> ${H(T.title.toUpperCase())}</h3>
    ${T.intro ? `<p class="sec intro" data-s="-1"><b>INTRODUCTION</b><br>${star(T.intro)}</p>` : ''}
    ${T.secs.map((s, i) => `<div class="sec" data-s="${i}"><span class="tp" aria-hidden="true">${s.pic}</span><div><h4>${H(s.h)}</h4><p>${star(s.body)}</p></div></div>`).join('')}
    ${T.vocab.length ? `<p class="voc"><b>VOCABULARY:</b> ${T.vocab.map(([w, c]) => `<span><sup>*</sup>${H(w)}: ${H(c)}</span>`).join(' ')}</p>` : ''}
    ${learn ? audioHtml('Escolta el text', true) : ''}</article>`;
}
// ctx { intro, topic, text, once }: puts it in #ctx and gives its player (or null). auto plays the recording at once
function context(ctx, env) {
  const box = $('#ctx'); let P = null;
  let html = '';
  if (ctx.who) html += `<p class="topic"><span aria-hidden="true">📻</span> Listen to ${H(ctx.who)}.</p>`;
  if (ctx.topic) html += `<p class="topic"><span aria-hidden="true">${ctx.topic.pic}</span> ${H(ctx.topic.en)}${env.ca ? `<small>${H(ctx.topic.ca)}</small>` : ''}</p>`;
  if (ctx.intro) html += `<div class="radiobox">${RADIO}<div class="rb"><p class="who">${ctx.topic ? 'Listen to the sentences.' : `Listen to ${H(ctx.intro.who)}.`}</p>${audioHtml(ctx.once ? 'Listen' : 'Listen to all')}</div></div>`;
  if (ctx.text) html += textHtml(ctx.text, env.mode === 'learn');
  box.innerHTML = html;
  if (ctx.intro) {
    P = player($('.radiobox', box), ctx.intro.lines, env.limit);
    const radio = $('.radiobox', box), obs = new MutationObserver(() => radio.classList.toggle('on', $('.audio', radio).classList.contains('on')));
    obs.observe($('.audio', radio), { attributes: true, attributeFilter: ['class'] });
    if (ctx.once && env.auto && prog.so) setTimeout(() => { if (env.t.on) P.play(); }, 500);
    else if (ctx.once) $('.audio', radio).classList.add('wake');
  }
  if (ctx.text && env.mode === 'learn') { const T = ctx.text; player($('.text', box), [T.title + '.', T.intro, ...T.secs.map(s => s.body.replace(/\*/g, ''))].filter(Boolean), Infinity); }
  return P;
}
// the radio only when the whole recording is what is heard; the rounds where each question has its own sentence only say who talks
const ctxOf = R => ({ intro: R.once ? R.intro : null, who: !R.once && R.intro ? R.intro.who : null, topic: R.topic || null, text: R.text || null, once: !!R.once });

/* ---------- one question: the heart of the game ---------- */
// The item it, in #q. env says how: mode 'learn' (a level or the Piscina: a wrong answer is a slip and it is tried again, hints are
// there), 'exam' (one try, the right answer is shown), 'mock' (one try, nothing is shown until the end). env.ca shows the Catalan
// under the English; env.limit the times a recording can be heard. Resolves { ok, slips } when the question is over
const wordsOf = s => s.split(' ').map((w, i) => `<span class="w" data-i="${i}">${H(w)}</span>`).join(' ');
function ask(it, env) {
  return new Promise(resolve => {
    const t = env.t, q = $('#q'), learn = env.mode === 'learn';
    let slips = 0, done = false;
    const inst = `<p class="inst">${H(it.en)}${it.ca ? (env.ca ? `<small>${H(it.ca)}</small>` : '<button class="link what" data-what>Què vol dir?</button>') : ''}</p>`;
    let prompt = '';
    if (it.big) prompt += `<div class="big">${picHtml(it.big)}</div>`;
    if (it.monster) prompt += `<div class="big mon">${monster(it.monster)}</div>`;
    if (it.show) prompt += `<p class="show${it.k === 'tf' ? ' sent' : ''}">${it.num ? `<b>${it.num}.</b> ` : ''}${wordsOf(it.show)}</p>`;
    if (it.caLine && env.ca) prompt += `<p class="mean">${H(it.caLine)}</p>`;
    q.innerHTML = `<div class="qcard">${inst}${prompt}${it.say ? audioHtml() : ''}<div class="ans" id="ans"></div></div>`;
    again($('.qcard', q)).add('pop');
    const ans = $('#ans', q), openAt = performance.now() + SETTLE;
    const P = it.say ? player($('.qcard', q), it.say, env.limit) : null;
    if (P && env.auto && prog.so) setTimeout(() => { if (t.on && !done) P.play(); }, 450);
    else if (P) $('.audio', q).classList.add('wake');
    $('[data-what]', q)?.addEventListener('click', e => { e.target.outerHTML = `<small>${H(it.ca)}</small>`; });

    const finish = r => { if (!t.on) return; keyFn = null; env.hint = null; resolve(r); };
    async function good(el) {
      if (done) return; done = true; keyFn = null;
      $('.qcard', q).classList.add('solved');
      if (env.mode !== 'mock') { spark(el || ans, 140); }
      env.right(it, slips);
      await sleep(env.mode === 'mock' ? 300 : 1200);
      finish({ ok: learn ? slips === 0 : true, slips });
    }
    const next = (label = 'Segueix') => new Promise(res => {
      ans.insertAdjacentHTML('beforeend', `<button class="btn nextb">${label}</button>`);
      const b = $('.nextb', ans), at = performance.now() + SETTLE; b.focus({ preventScroll: true });
      b.onclick = e => { if (e.timeStamp >= at) res(); };
    });
    // a wrong answer: in a level a slip and try again (false); in an exam or the simulacre the end of the question (true)
    async function bad(msg, reveal) {
      if (done) return true;
      if (learn) { slips++; env.slip(msg); return false; }
      done = true; keyFn = null;
      if (env.mode === 'exam') { reveal?.(); env.tip(msg, 'oops'); buzz(); await next(); } else await sleep(300);
      finish({ ok: false, slips: 1 });
      return true;
    }
    const glow = el => { if (el) again(el).add('glow'); };
    const hiSec = () => { if (it.sec == null) return false; const s = $(`#ctx .sec[data-s="${it.sec}"]`); if (!s) return false; again(s).add('glow'); s.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); return true; };

    /* --- choose one: pictures or words --- */
    if (it.k === 'pick') {
      const words = it.opts.every(o => o.t != null);
      ans.innerHTML = words ? `<div class="opts col">${it.opts.map((o, i) => `<button class="btn soft opt" data-o="${i}">${H(o.t)}</button>`).join('')}</div>`
        : `<div class="tiles n${it.opts.length}">${it.opts.map((o, i) => `<button class="tile" data-o="${i}">${picHtml(o.place || o.pic)}<span class="lbl">${H(o.word || '')}</span></button>`).join('')}</div>`;
      ans.onclick = async e => {
        const b = e.target.closest('[data-o]'); if (!b || b.disabled || done || e.timeStamp < openAt) return;
        const i = +b.dataset.o;
        if (i === it.ok) { b.classList.add('ok'); q.classList.add('told'); return good(b); }
        if (env.mode === 'mock') { b.classList.add('picked'); return bad(''); }
        b.classList.add('no'); b.disabled = true; again(b).add('shake');
        const right = $(`[data-o="${it.ok}"]`, ans);
        await bad(learn ? (it.say ? 'Oh, no! Torna-ho a escoltar.' : 'Oh, no! Torna-ho a mirar.') : `No! La bona era: ${it.opts[it.ok].t || it.opts[it.ok].word}.`, () => { right.classList.add('ok'); q.classList.add('told'); });
      };
      env.hint = () => {
        const left = [...ans.querySelectorAll('[data-o]')].filter(b => !b.disabled && +b.dataset.o !== it.ok);
        if (left.length > 1 || (left.length && !it.say && it.sec == null)) { left[0].disabled = true; left[0].classList.add('no'); }
        const sec = hiSec();
        if (P) { P.play(true); return 'Escolta-ho a poc a poc.' + (left.length > 1 ? ' I he tret una opció dolenta.' : ''); }
        return sec ? 'La resposta és a la part del text que brilla.' : 'He tret una opció dolenta.';
      };
    }

    /* --- TRUE or FALSE --- */
    else if (it.k === 'tf') {
      ans.innerHTML = `<div class="opts tf"><button class="btn tfb" data-v="1">TRUE <span aria-hidden="true">✓</span></button><button class="btn tfb no-b" data-v="0">FALSE <span aria-hidden="true">✗</span></button></div>`;
      const reveal = () => {
        $(`[data-v="${it.ok ? 1 : 0}"]`, ans).classList.add('ok');
        if (it.hl != null && !it.ok) $(`.show .w[data-i="${it.hl}"]`, q)?.classList.add('mark');
        if (it.hl != null) ans.insertAdjacentHTML('beforeend', `<p class="heard">Has sentit: «${H(it.learn)}»</p>`);
        else if (it.say && !it.ok) ans.insertAdjacentHTML('beforeend', `<p class="heard">Bé seria: «${H(it.learn)}»</p>`);
      };
      ans.onclick = async e => {
        const b = e.target.closest('[data-v]'); if (!b || b.disabled || done || e.timeStamp < openAt) return;
        const v = b.dataset.v === '1';
        if (v === it.ok) { b.classList.add('ok'); return good(b); }
        if (env.mode === 'mock') return bad('');
        again(b).add('shake');
        if (learn) {
          done = true; slips++; env.slip(`No! Era ${it.ok ? 'TRUE' : 'FALSE'}.${it.hl != null && !it.ok ? ' Mira la paraula que canvia.' : ''}`);
          ans.querySelectorAll('button').forEach(x => { x.disabled = true; }); reveal();
          await next('Continua'); return finish({ ok: false, slips });
        }
        await bad(`No! Era ${it.ok ? 'TRUE' : 'FALSE'}.`, reveal);
      };
      env.hint = () => {
        if (it.hl != null) $(`.show .w[data-i="${it.hl}"]`, q)?.classList.add('look');
        const sec = hiSec();
        if (P) { P.play(true); return it.hl != null ? 'Escolta-ho a poc a poc i fixa’t en la paraula marcada.' : 'Escolta-ho a poc a poc.'; }
        if (it.hl != null) return 'Fixa’t en la paraula marcada: és la que pot canviar. Torna a escoltar la gravació.';
        return sec ? 'Busca-ho a la part del text que brilla.' : 'Mira bé el dibuix.';
      };
    }

    /* --- tap in the order heard --- */
    else if (it.k === 'order') {
      let n = 0;
      ans.innerHTML = `<div class="tiles n${it.opts.length}">${it.opts.map((o, i) => `<button class="tile" data-o="${i}">${picHtml(o.pic)}<span class="lbl">${H(o.word)}</span><b class="ord"></b></button>`).join('')}</div>`;
      ans.onclick = async e => {
        const b = e.target.closest('[data-o]'); if (!b || b.disabled || done || e.timeStamp < openAt) return;
        const i = +b.dataset.o;
        if (i === it.seq[n]) {
          n++; b.disabled = true; b.classList.add('ok'); $('.ord', b).textContent = n; blip(up(n + 3));
          if (n === it.seq.length) { q.classList.add('told'); return good(b); }
          return;
        }
        again(b).add('shake');
        await bad(learn ? 'Aquest no va ara. Torna a escoltar l’ordre.' : 'No era aquest!', () => { it.seq.forEach((k, j) => { const x = $(`[data-o="${k}"]`, ans); x.classList.add('ok'); $('.ord', x).textContent = j + 1; }); q.classList.add('told'); });
      };
      env.hint = () => { glow($(`[data-o="${it.seq[n]}"]`, ans)); return 'El que brilla és el següent.'; };
    }

    /* --- listen and colour --- */
    else if (it.k === 'colour') {
      let sel = null;
      const ok = new Set(), targets = Object.keys(it.want);
      ans.innerHTML = `<div class="shapes">${it.shapes.map(s => `<button class="shp" data-s="${s}" aria-label="${s}">${shape(s)}</button>`).join('')}</div>
        <div class="palette" role="group" aria-label="Colors">${it.palette.map(c => `<button class="pot" data-c="${c}" style="--c:${HEX[c]}" aria-label="${c}"></button>`).join('')}</div>`;
      const fill = (s, c) => { $(`[data-s="${s}"] path`, ans).setAttribute('fill', c ? HEX[c] : '#FFFDF8'); };
      ans.onclick = async e => {
        if (done || e.timeStamp < openAt) return;
        const pot = e.target.closest('[data-c]');
        if (pot) { sel = pot.dataset.c; ans.querySelectorAll('.pot').forEach(x => x.classList.toggle('on', x === pot)); blip(700); return; }
        const b = e.target.closest('[data-s]'); if (!b || b.disabled) return;
        if (!sel) { env.tip('Primer tria un color de la paleta.', ''); again($('.palette', ans)).add('shake'); return; }
        const s = b.dataset.s; fill(s, sel);
        if (it.want[s] === sel) {
          ok.add(s); b.disabled = true; b.classList.add('ok'); blip(up(ok.size + 4)); spark(b, 50);
          if (ok.size === targets.length) return good(b);
          return;
        }
        again(b).add('shake');
        const over = await bad(learn ? 'Oh, no! Torna a escoltar: quina figura, i de quin color?' : 'No era així!', () => targets.forEach(x => fill(x, it.want[x])));
        if (!over) setTimeout(() => { if (!ok.has(s)) fill(s, null); }, 650);
      };
      env.hint = () => `Vol dir: pinta ${targets.map(s => `${CA[s]} de color ${CA[it.want[s]]}`).join(' i ')}.`;
    }

    /* --- spell a word with letters --- */
    else if (it.k === 'spell') {
      const target = it.target, slots = [...target];
      let n = 0;
      const skip = () => { while (n < slots.length && !/[a-z]/.test(slots[n])) n++; };
      ans.innerHTML = `<div class="slots" aria-live="polite">${slots.map(ch => /[a-z]/.test(ch) ? '<span class="ls"></span>' : `<span class="ls sep">${ch === ' ' ? '&nbsp;' : H(ch)}</span>`).join('')}</div>
        <div class="letters">${it.letters.map((l, i) => `<button class="lt" data-l="${l}" data-i="${i}">${l}</button>`).join('')}</div>`;
      skip();
      const put = async b => {
        if (done) return;
        const l = b.dataset.l;
        if (l === slots[n]) {
          const s = ans.querySelectorAll('.ls')[n]; s.textContent = l; s.classList.add('ok'); b.disabled = true; b.classList.add('used'); blip(up(n + 2));
          n++; skip();
          if (n >= slots.length) { $('.slots', ans).classList.add('ok'); return good($('.slots', ans)); }
          return;
        }
        again(b).add('shake');
        await bad(learn ? `Aquesta no és la lletra. ${P ? 'Escolta la paraula.' : ''}` : `No! S'escriu «${target}».`, () => { ans.querySelectorAll('.ls').forEach((s, i) => { s.textContent = slots[i]; }); });
      };
      ans.onclick = e => { const b = e.target.closest('[data-l]'); if (b && !b.disabled && e.timeStamp >= openAt) put(b); };
      keyFn = e => { if (/^[a-z]$/i.test(e.key)) { const b = [...ans.querySelectorAll('.lt:not(:disabled)')].find(x => x.dataset.l === e.key.toLowerCase()) || [...ans.querySelectorAll('.lt:not(:disabled)')][0]; if (b) { e.preventDefault(); if (b.dataset.l === e.key.toLowerCase()) put(b); else { again(b).add('shake'); bad(learn ? 'Aquesta no és la lletra.' : `No! S'escriu «${target}».`); } } } };
      env.hint = () => { glow([...ans.querySelectorAll('.lt:not(:disabled)')].find(x => x.dataset.l === slots[n])); if (P) P.play(true); return 'La lletra que brilla és la següent.'; };
    }

    /* --- put the words in order --- */
    else if (it.k === 'build') {
      let n = 0;
      ans.innerHTML = `<p class="line" aria-live="polite">${it.words.map(() => '<span class="ws"></span>').join(' ')}<span class="dot">.</span></p>
        <div class="wtiles">${it.tiles.map((w, i) => `<button class="wt" data-w="${H(w)}" data-i="${i}">${H(w)}</button>`).join('')}</div>`;
      ans.onclick = async e => {
        const b = e.target.closest('[data-w]'); if (!b || b.disabled || done || e.timeStamp < openAt) return;
        if (b.dataset.w === it.words[n]) {
          const s = ans.querySelectorAll('.ws')[n]; s.textContent = it.words[n]; s.classList.add('ok'); b.disabled = true; b.classList.add('used'); blip(up(n + 2));
          n++;
          if (n === it.words.length) { $('.line', ans).classList.add('ok'); return good($('.line', ans)); }
          return;
        }
        again(b).add('shake');
        await bad(learn ? (it.words.includes(b.dataset.w) ? 'Aquesta paraula va més endavant.' : 'Aquesta paraula sobra: no hi va.') : `No! La frase és: «${it.learn}»`,
          () => ans.querySelectorAll('.ws').forEach((s, i) => { s.textContent = it.words[i]; }));
      };
      env.hint = () => { glow([...ans.querySelectorAll('.wt:not(:disabled)')].find(x => x.dataset.w === it.words[n])); if (P) P.play(true); return 'La paraula que brilla és la següent.'; };
    }
    scrollTo({ top: 0, behavior: 'auto' });
  });
}

/* ---------- the frame of a level, the Piscina, an exam, a sheet, the simulacre ---------- */
function coachHtml() { return `<div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div>`; }
function tipper() {
  return (txt, cls = '') => { const e = $('#tip'); if (!e) return; e.className = 'status tip ' + cls; e.innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
}
const dotsHtml = (n, label) => `<span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span>`;
const paintDots = (k, run) => [...$('#dots').children].forEach((d, j) => { d.className = j === k ? 'cur' : run[j] === true ? 'ok' : run[j] === false ? 'late' : ''; });
// the env of the levels and the Piscina: a slip lowers the stars, a right answer grows the run and fills the album
function learnEnv(t, tip, onSlip) {
  return { t, mode: 'learn', limit: Infinity, auto: true, ca: true, tip,
    slip: msg => { onSlip(); buzz(); streakBreak(); tip(msg, 'oops'); },
    right: (it, s) => { if (!s) streakUp(); blip(up(Math.min(streak, 12) + 4)); setTimeout(() => blip(up(Math.min(streak, 12) + 6)), 90); if (!s) collect(it.word); tip(`${pick(HURRAY)}${it.learn ? ` <b>${H(it.learn)}</b>` : ''}`, 'go'); } };
}

/* ---------- the Piscina: three short rounds to learn the buttons ---------- */
const POOL_TIP = [
  'Hello! Aquí tot és en anglès. Prem 🔊 per escoltar (i 🐢 per escoltar-ho a poc a poc). Després toca el dibuix que has sentit.',
  'Ara escoltaràs una frase sobre el dibuix. Si és veritat, toca TRUE. Si és mentida, toca FALSE.',
  'Ara llegeix la paraula i toca el dibuix que diu.'];
function piscina() {
  const t = fresh(); show('La Piscina', true, 200); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  $('#game').innerHTML = `<div class="hud mid">${dotsHtml(POOL.length, 'Tres jocs')}<span class="combo" id="cb" hidden></span></div>${coachHtml()}<div class="stage" id="stage"><div id="ctx"></div><div id="q"></div></div>`;
  const tip = tipper(), run = [];
  (async () => {
    for (let k = 0; k < POOL.length; k++) {
      paintDots(k, run);
      const env = learnEnv(t, tip, () => {});
      $('#ctx').innerHTML = '';
      const items = pool(k, Math.random);
      for (let j = 0; j < items.length; j++) {
        const p = ask(items[j], env);
        if (j === 0) tip(POOL_TIP[k]);
        await p; if (!t.on) return;
      }
      run[k] = true; fanfare(); FX.celebrate(8);
    }
    paintDots(-1, run);
    const r = poolIn(prog); prog = r.prog; save();
    $('#ctx').innerHTML = $('#q').innerHTML = '';
    tip("Fantastic! Ja saps jugar. Ara entrem al mapa: tres cercles i, al final, el simulacre de la prova.", 'go'); fanfare(); FX.celebrate(16);
    await sleep(2600); if (t.on) mapa();
  })();
}

/* ---------- one level of a project: a round of questions ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), Lv = PROJECTS[sec].levels[idx], R = round(sec, idx, Math.random);
  let slips = 0, over = false;
  const wordsBefore = count(prog.words);
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${H(Lv.title)}</span><span class="chip" id="st"></span><span class="combo" id="cb" hidden></span><span class="tools"><button class="link" id="hintb">Dona'm una pista</button></span></div>
    ${coachHtml()}<div class="hud mid">${dotsHtml(R.items.length, `${R.items.length} preguntes`)}</div><div class="stage" id="stage"><div id="ctx"></div><div id="q"></div></div>`;
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.stars[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const tip = tipper(), stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const env = learnEnv(t, tip, () => { slips++; stars(); });
  env.ca = idx < 6; streakBreak();
  context(ctxOf(R), env);
  $('#hintb').onclick = () => { if (over || !env.hint) return; const txt = env.hint(); if (txt) { slips++; stars(); streakBreak(); tip(txt); } };
  stars();
  const run = [];
  (async () => {
    for (let k = 0; k < R.items.length; k++) {
      paintDots(k, run);
      const p = ask(R.items[k], env);
      if (k === 0) tip(R.once ? 'Primer escolta tota la gravació. Després respon les preguntes: la pots tornar a escoltar.' : R.text ? 'Llegeix el text amb calma. Les respostes hi són!' : PROJECTS[sec].sub + '. Som-hi!');
      const res = await p; if (!t.on) return;
      run[k] = res.ok;
    }
    paintDots(-1, run);
    win();
  })();

  async function win() {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9, got = count(prog.words) - wordsBefore;
    over = true; keyFn = null; prog = r.prog; save();
    fanfare(); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(500); if (!t.on) return;
    const stage = $('#stage');
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line2">${H(Lv.title)}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${got ? `<p class="lead go">📒 ${got} ${got === 1 ? 'paraula nova' : 'paraules noves'} a l'àlbum</p>` : ''}
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }
}

/* ---------- the exam of a circle: six questions of its projects, one try each, no hints; the recordings twice ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]); streakBreak();
  const qs = exam(c, Math.random), run = [];
  $('#game').innerHTML = `<div class="hud mid">${dotsHtml(qs.length, 'Sis preguntes')}<span class="chip" id="qn"></span></div>${coachHtml()}<div class="stage" id="stage"><div id="ctx"></div><div id="q"></div></div>`;
  const tip = tipper();
  const env = { t, mode: 'exam', limit: 2, auto: true, ca: false, tip, slip: () => {}, right: it => { chime([523, 659, 784]); FX.celebrate(4); collect(it.word); tip('Correct!', 'go'); } };
  (async () => {
    for (let k = 0; k < qs.length; k++) {
      paintDots(k, run); $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[qs[k].p].name}`;
      const it = examItem(qs[k], Math.random);
      context({ intro: it.intro || null, topic: it.topic || null, text: it.text || null, once: !!it.intro }, env);
      const p = ask(it, env);
      tip(k ? 'Següent pregunta. Només hi ha un intent!' : 'Examen! Sis preguntes, un sol intent cada una i les gravacions dues vegades, com a la prova.');
      run[k] = (await p).ok; if (!t.on) return;
    }
    paintDots(-1, run);
    const r = examIn(prog, c, qs, run), first = r.good && !prog.exams[c]; prog = r.prog; save();
    $('#ctx').innerHTML = $('#q').innerHTML = ''; $('#qn').hidden = true;
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    tip(r.good ? 'Exam passed!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) FX.celebrate(16);
    panel($('#stage'), `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  })();
}

/* ---------- the simulacre: the twenty questions of the test, in its three parts ---------- */
function simulacre() {
  const t = fresh(); show('Simulacre de la prova', true, 20); streakBreak();
  $('#game').innerHTML = `${coachHtml()}<div class="stage" id="stage"><div class="mockintro"><h2>🎯 Simulacre de la prova d'anglès</h2>
    <p>Com a l'abril: <b>20 preguntes</b> en tres parts.</p>
    <ol><li><b>Listening 1</b> (1-6): algú parla de si mateix. Tria el dibuix.</li><li><b>Listening 2</b> (7-10): TRUE o FALSE segons el que sents.</li><li><b>Reading</b> (11-20): llegeix un text i respon.</li></ol>
    <p>Cada gravació es pot escoltar <b>dues vegades</b>. No hi ha pistes, i no sabràs si encertes fins al final.</p>
    <button class="btn" id="go">Comença</button></div></div>`;
  const tip = tipper();
  tip('Concentra’t, com el dia de la prova. Tu pots!');
  $('#go').onclick = () => start();
  function start() {
    const S = mock(Math.random), all = S.flatMap((s, i) => s.items.map(it => ({ it, s: i }))), run = [];
    $('#game').innerHTML = `<div class="hud mid">${dotsHtml(all.length, 'Vint preguntes')}</div>${coachHtml()}<div class="stage" id="stage"><p class="sechead" id="sh"></p><div id="ctx"></div><div id="q"></div></div>`;
    const tip2 = tipper();
    const env = { t, mode: 'mock', limit: 2, auto: false, ca: false, tip: tip2, slip: () => {}, right: () => {} };
    (async () => {
      let k = 0;
      for (const [si, s] of S.entries()) {
        $('#sh').innerHTML = `<b>${H(s.title)}</b> · ${H(s.name)}`;
        context({ intro: s.intro || null, topic: s.topic || null, text: s.text || null, once: !!s.intro }, env);
        tip2(si === 0 ? 'Prem 🔊 per escoltar. La pots escoltar dues vegades.' : si === 1 ? 'Ara la segona part: escolta les frases i digues si són iguals que les escrites.' : 'Última part: llegeix el text amb calma.');
        for (const it of s.items) {
          paintDots(k, run);
          const r = await ask(it, env); if (!t.on) return;
          run[k++] = r.ok; blip(520);
        }
      }
      paintDots(-1, run);
      finish(S, all, run);
    })();
  }
  function finish(S, all, run) {
    const score = count(run), r = mockDone(prog, score); prog = r.prog; save();
    $('#ctx').innerHTML = $('#q').innerHTML = ''; $('#sh').textContent = '';
    const parts = S.map((s, i) => { const idx = all.map((a, j) => a.s === i ? j : -1).filter(j => j >= 0); return `${H(s.title.replace(/ \(.*/, ''))}: ${count(idx.map(j => run[j]))} de ${idx.length}`; });
    const say = score >= 18 ? 'Excel·lent!' : score >= 14 ? 'Molt bé!' : score >= 10 ? 'Aprovat!' : 'Continua entrenant: ho aconseguiràs!';
    score >= 10 ? (fanfare(), FX.celebrate(score >= 18 ? 24 : 14)) : click(196, 0, 0.5, 0.12, 'triangle');
    tipper()(score >= 10 ? `${say} Ho has fet molt bé.` : 'Cada simulacre t’ajuda a millorar. Repassa el que ha fallat i torna-hi!', score >= 10 ? 'go' : '');
    const missed = all.flatMap((a, j) => run[j] ? [] : [`<li><b>${j + 1}.</b> ${H(a.it.show || a.it.learn)} → <b>${H(a.it.k === 'tf' ? (a.it.ok ? 'TRUE' : 'FALSE') : (a.it.opts[a.it.ok].t || a.it.opts[a.it.ok].word))}</b></li>`]);
    panel($('#stage'), `<h2>${score} de 20</h2><p class="lead go">${say}</p><p class="lead">${parts.join(' · ')}</p>
      <p class="lead">${r.best ? 'Nou rècord!' : `Rècord: ${prog.best} de 20`} · Simulacres fets: ${prog.proves}</p>${news(r.news)}
      ${missed.length ? `<details class="review"><summary>Mira les que has fallat (${missed.length})</summary><ul>${missed.join('')}</ul></details>` : '<p class="lead go">Totes bé! 🎉</p>'}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre simulacre</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => simulacre();
  }
}

/* ---------- «Caça l'errada»: three sentences of the notebook; from none to two have a beginner's mistake ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40); streakBreak();
  const cs = sheet(Math.random), run = [];
  $('#game').innerHTML = `<div class="hud mid">${dotsHtml(cs.length, 'Tres frases')}</div>${coachHtml()}<div class="stage" id="stage"><div id="q"></div><div class="tail" id="tail"></div></div>`;
  const tip = tipper();
  let k = -1, C, busy = true, res = null, openAt = 0;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE; paintDots(k, run);
    $('#q').innerHTML = `<div class="qcard"><div class="big">${picHtml(C.pic)}</div><p class="mean">Vol dir: ${H(C.ca)}</p>
      <p class="ask claim">A la llibreta hi diu:</p><p class="claimbox">«${H(C.says)}»</p></div>`;
    $('#tail').innerHTML = `<div class="opts"><button class="btn" id="yes">És correcte</button><button class="btn soft" id="no">Té una errada</button></div>`;
    tip("Llegeix la frase en anglès. Està ben escrita?");
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; paintDots(k, run);
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of $('#tail').querySelectorAll('button')) b.disabled = true;
    if (ok) { tip(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { tip(said, 'oops'); buzz(); }
    await sleep(ok ? 1400 : 3000); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}»)`] : []);
    $('#q').innerHTML = $('#tail').innerHTML = ''; paintDots(-1, run);
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    tip(r.good ? 'Llibreta perfecta!' : 'Llibreta acabada.', r.good ? 'go' : '');
    panel($('#stage'), `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${H(list(bad))}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra llibreta</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  $('#tail').onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const bad = C.says !== C.real;
    if (b.id === 'yes') answer(!bad, bad ? `No ho era. La bona és: «${H(C.real)}»` : 'Yes! Era correcta.');
    else if (b.id === 'no') {
      if (!bad) return answer(false, `Sí que ho era: «${H(C.real)}»`);
      openAt = performance.now() + SETTLE;
      $('#tail').innerHTML = `<div class="opts col">${C.opts.map((v, i) => `<button class="btn soft" data-v="${i}">${H(v)}</button>`).join('')}</div>`;
      tip('Ben vist! Ara tria la frase ben escrita.', 'go');
    } else if ('v' in b.dataset) { const ok = C.opts[+b.dataset.v] === C.real; answer(ok, ok ? `Arreglada: «${H(C.real)}»` : `No era aquesta. La bona és: «${H(C.real)}»`); }
  };
  arm();
}

/* ---------- the album: every word, the ones found in colour; a tap opens its card ---------- */
// A found word: big, said aloud, with the play buttons. A word still missing: its shadow, and the level where it comes up, to go there
function album() {
  const t = fresh(); show("L'àlbum de paraules", true, 280);
  const n = count(prog.words);
  $('#game').innerHTML = `<div class="albhead"><h2>📒 ${n} de ${VOCAB.length} paraules</h2><p class="grow">Toca una paraula. Les que tens les pots escoltar; les que falten s'aconsegueixen encertant-les a la primera als nivells.</p></div>
    ${GROUPS.map(([g, name]) => { const ws = VOCAB.map((v, i) => [v, i]).filter(([v]) => v.cat === g); const got = ws.filter(([, i]) => prog.words[i]).length;
      return `<section class="agroup"><h3>${H(name)} <small>${got} de ${ws.length}</small></h3><div class="agrid">${ws.map(([v, i]) => prog.words[i]
        ? `<button class="aw" data-k="${v.key}">${picHtml(v.pic)}<span>${H(v.word)}</span></button>`
        : `<button class="aw no" data-k="${v.key}" aria-label="Paraula que falta">${picHtml(v.pic)}<span>?</span></button>`).join('')}</div></section>`; }).join('')}
    <button class="btn" id="bk">Torna al mapa</button><div class="zoom" id="zoom" hidden></div>`;
  const zoom = $('#zoom'), close = () => { hush(); zoom.hidden = true; keyFn = null; };
  function card(k) {
    const v = W[k], i = VOCAB.findIndex(x => x.key === k), got = prog.words[i];
    if (got) {
      zoom.innerHTML = `<div class="zcard" role="dialog" aria-modal="true" aria-label="${H(v.word)}"><div class="big">${picHtml(v.pic)}</div><p class="zword">${H(v.word)}</p>${audioHtml()}<button class="btn soft" data-close>Tanca</button></div>`;
      const P = player($('.zcard', zoom), v.word, Infinity);
      P.play(); blip(880);
    } else {
      const [p, idx] = LEARN[v.cat] || [1, 0], open = OPEN || isOpen(prog, circleOf(p));
      zoom.innerHTML = `<div class="zcard" role="dialog" aria-modal="true" aria-label="Paraula que falta"><div class="big no">${picHtml(v.pic)}</div><p class="zword">?</p>
        <p class="lead">Encara no l'has trobada. Surt a <b>${H(PROJECTS[p].name)}</b>, al nivell «${H(PROJECTS[p].levels[idx].title)}» i en altres. Encerta-la a la primera i entrarà a l'àlbum!</p>
        ${open ? `<button class="btn" data-go>Vés-hi</button>` : `<p class="lead">Aquest projecte encara està tancat.</p>`}<button class="${open ? 'link' : 'btn soft'}" data-close>Tanca</button></div>`;
      if (open) $('[data-go]', zoom).onclick = () => level(p, idx);
      blip(330);
    }
    zoom.hidden = false; $('.zcard', zoom).classList.add('pop');
    ($('[data-go]', zoom) || $('[data-close]', zoom)).focus({ preventScroll: true });
    keyFn = e => { if (e.key === 'Escape') close(); };
  }
  zoom.onclick = e => { if (e.target === zoom || e.target.closest('[data-close]')) close(); };
  $('#game').onclick = e => {
    if (!t.on || !zoom.hidden) return;
    const b = e.target.closest('.aw[data-k]');
    if (b) { again(b).add('pop'); if (!b.classList.contains('no')) spark(b, 140); card(b.dataset.k); }
    if (e.target.closest('#bk')) mapa();
  };
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
