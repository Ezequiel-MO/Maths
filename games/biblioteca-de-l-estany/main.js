import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice, pentatonic } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';
import { PROJECTS, CIRCLES, POOL, POINTS, EXAM_PASS, VALID, starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf,
  BADGES, badges, levelIn, poolIn, exam, examPair, examIn, sheet, sheetIn, streakIn, booksIn, mockDone, round, pool, mock, BOOKS, SHELVES, bookIndex, bookOf, whereOf,
  wordKey, PROCS, MOCK_N, markOf, levelOf } from './logic.js';
import { speak, hush, canSpeak, catalan } from './speech.js';
import { FROG, RADIO, libraryMap, photoHtml } from './draw.js';

const KEY = 'biblioteca-de-l-estany';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, lv, piscina, exams, fulls, ratxa, best, proves, llibres }. clean() makes a complete progress out of anything
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
const page = () => { click(1800, 0, 0.05, 0.03, 'triangle'); click(1200, 0.04, 0.06, 0.03, 'triangle'); };
const up = pentatonic(523);

const HURRAY = ['Molt bé!', 'Genial!', 'Perfecte!', 'Fantàstic!', 'Ben trobat!', 'Així es llegeix!', 'Bravo!', 'Exacte!'];
const HUES = [45, 160, 300, 200, 20, 260, 340, 120, 230];
const again = e => { e.classList.remove('shake', 'pop', 'glow', 'flash'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 16, 130); } };
const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const count = a => a.filter(Boolean).length;
const LETTERS = ['a', 'b', 'c', 'd'];

const HUB = ownPage(KEY);
function show(kicker, playing, hue) {
  $('#app').classList.toggle('wide', playing); $('#toG').hidden = playing || !HUB; $('#toM').hidden = !playing; $('#kick').textContent = kicker;
  $('#game').onclick = null; keyFn = null; FX.mood(hue);
}
$('#toM').onclick = () => mapa();
const soBtn = soundButton(() => prog, () => save(), () => tone(660, 0, 0.2));
addEventListener('keydown', e => { if (keyFn && !e.ctrlKey && !e.metaKey && !e.altKey) keyFn(e); });

function toast(html) {
  const e = document.createElement('div'); e.className = 'toast'; e.innerHTML = html; e.setAttribute('role', 'status');
  e.style.top = `${56 + 68 * document.querySelectorAll('.toast').length}px`;
  document.body.append(e); setTimeout(() => e.remove(), 2800);
}
// the texts read go on the shelves: a toast for each new one
function shelve(ids) {
  const r = booksIn(prog, ids);
  if (!r.got.length) return 0;
  prog = r.prog; save();
  r.got.forEach((id, i) => setTimeout(() => { const T = bookOf(id); toast(`<span class="tw" style="--h:${T.hue}">${T.pic}</span><span><small>Nou a la biblioteca</small><b>${H(T.title)}</b></span>`); page(); }, 400 + i * 900));
  if (r.news.length) setTimeout(() => toast(`★ <b>${H(list(r.news))}</b>`), 600 + r.got.length * 900);
  return r.got.length;
}
// the run of right answers in a row: the record is kept
let streak = 0;
function streakUp() {
  streak++; combo(streak);
  if (streak > prog.ratxa) { const r = streakIn(prog, streak); prog = r.prog; save(); if (r.news.length) toast(`★ <b>${H(list(r.news))}</b>`); }
}
function streakBreak() { streak = 0; combo(0); }

/* ---------- the map ---------- */
const RING = [352, 186, 258];
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><rect x="-12" y="-9" width="24" height="18" rx="3" fill="hsl(${RING[c]} 58% 42%)" stroke="#E9B949" stroke-width="2"/><text y="5" text-anchor="middle" font-size="12" font-weight="800" fill="#FFF8E6">${c + 1}</text></svg>`;
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'lv' });
let here = -1;
function mapa() {
  fresh(); show('El mapa de la biblioteca', false, 200);
  const n = count(prog.llibres), pct = Math.round(100 * n / BOOKS.length), lit = validated(prog).length;
  const win = PROJECTS.map((_, i) => noteOf(prog, i) >= VALID ? 2 : M.starsOf(i).some(Boolean) ? 1 : 0);
  const mk = prog.proves ? markOf(prog.best) : 0;
  M.screen({ root: $('#game'), here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${PROJECTS[i].icon}</span>`, pp: true,
    before: `<div class="libmap" id="lib"></div>
      <div class="hero">${FROG}<p class="bubble">${lit >= 9 ? 'Totes les finestres enceses! Ja ets un gran lector.' : `Cada projecte encén una finestra de la biblioteca: <b>${lit} de 9</b>. A l'abril hi ha la prova de català. Llegim!`}</p></div>
      <div class="cards"><button class="card mockc" id="mockb"><span class="ci" aria-hidden="true">🎯</span><b>Simulacre de la prova</b><span>23 preguntes, com a l'abril</span><span class="mk">${prog.proves ? `Rècord: ${prog.best} de ${MOCK_N} · ${mk.toFixed(1).replace('.', ',')}` : 'Encara no l’has fet'}</span></button>
      <button class="card libc" id="libb"><span class="ci" aria-hidden="true">📚</span><b>La biblioteca</b><span>${n} de ${BOOKS.length} textos</span><span class="meter" aria-hidden="true"><i style="width:${pct}%"></i></span></button></div>
      ${prog.ratxa ? `<p class="grow">🔥 Rècord de ratxa: ${prog.ratxa} encerts seguits</p>` : ''}
      ${canSpeak ? '<p class="grow novoice" id="novoice" hidden>Aquest aparell no té cap veu en català: les gravacions de la ràdio sortiran escrites.</p>' : '<p class="grow novoice">Aquest navegador no pot parlar: les gravacions de la ràdio sortiran escrites.</p>'}`,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="full"${OPEN || validated(prog).length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full], ['#mockb', simulacre], ['#libb', biblioteca]] });
  libraryMap($('#lib'), { win, exams: prog.exams, radio: noteOf(prog, 5) >= VALID || noteOf(prog, 8) >= VALID, books: n, all: lit >= 9 });
  here = -1;
  if (canSpeak) setTimeout(() => { const e = $('#novoice'); if (e && !catalan()) e.hidden = false; }, 1500);
}

/* ---------- the paper of a text ---------- */
const star = s => s.replace(/\*/g, '<sup>*</sup>');
const wordsOf = t => t.split(/\s+/).filter(Boolean).map(w => `<span class="w" data-w="${H(wordKey(w))}">${star(H(w))}</span>`).join(' ');
const tableHtml = Tb => `<figure class="tbl" data-s="table"><figcaption>${H(Tb.cap)}</figcaption><table><thead><tr>${Tb.rows[0].map(c => `<th>${H(c)}</th>`).join('')}</tr></thead>
  <tbody>${Tb.rows.slice(1).map(r => `<tr>${r.map(c => `<td>${H(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></figure>`;
function paperHtml(T, title = true) {
  const head = T.title && title ? `<header class="ph"><span class="ppic" aria-hidden="true">${T.pic}</span><div><h3>${H(T.title)}</h3>${T.by ? `<p class="by">${H(T.by)}</p>` : ''}</div></header>`
    : T.pic ? `<span class="mpic" aria-hidden="true">${T.pic}</span>` : '';
  const last = T.paras.length - 1;
  const body = T.paras.map((ss, p) => {
    const h = T.heads?.[p] ? `<h4>${H(T.heads[p])}</h4>` : '';
    const cls = ['par', T.kind === 'conte' && p === 0 ? 'first' : '', /^—/.test(T.sents[ss[0]].t) ? 'dlg' : '',
      (T.kind === 'carta' || T.kind === 'diari') && p === 0 ? 'date' : '', T.kind === 'carta' && p >= last - 1 ? 'sign' : ''].filter(Boolean).join(' ');
    let out = `${h}<p class="${cls}">${ss.map(i => `<span class="s" data-s="${i}">${wordsOf(T.sents[i].t)}</span>`).join(T.kind === 'poema' ? '<br>' : ' ')}</p>`;
    if (T.photo && T.photo.at === p) out += photoHtml(T.photo);
    if (T.table && T.table.at === p) out += tableHtml(T.table);
    return out;
  }).join('');
  const gloss = T.gloss ? `<p class="gloss">${T.gloss.map(([w, d]) => `<span><sup>*</sup><b>${H(w)}</b>: ${H(d)}</span>`).join('')}</p>` : '';
  return `<article class="paper k-${T.kind}" style="--h:${T.hue ?? 200}">${head}<div class="pbody">${body}</div>${gloss}</article>`;
}
// the sentences that answer, lit like a highlighter, and brought into view inside the paper
function markEv(ev, cls = 'mark') {
  const els = ev.map(i => $(`#ctx [data-s="${i}"]`)).filter(Boolean);
  els.forEach(e => again(e).add(cls));
  els[0]?.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
  return els.length > 0;
}

/* ---------- the radio ---------- */
// The play buttons of a recording: limit is how many times it can be heard (Infinity in the levels, 2 in exams and the simulacre, as
// in the test). Without a Catalan voice the words are shown instead
function audioHtml(label = 'Escolta', small = false) {
  return `<div class="audio${small ? ' small' : ''}"><button class="play" data-play>▶ <span>${label}</span></button><button class="slow" data-slow aria-label="A poc a poc">🐢</button><span class="left"></span></div>`;
}
const linesOf = (T, idx) => idx.map(i => T.lines[i]);
function scriptHtml(T, idx) {
  return `<div class="script">${idx.map(i => { const [w, t] = T.lines[i]; return `<p data-s="${i}"><b>${H(T.who[w][0])}:</b> ${H(t)}</p>`; }).join('')}</div>`;
}
// box holds the .audio; T the recording, idx the lines it plays. Its onEnd(done), when set, is told each time a playing ends
function player(box, T, idx, limit) {
  let left = limit, busy = false;
  const el = $('.audio', box), radio = box.closest('.radio') || $('#ctx .radio');
  const paint = () => { const l = $('.left', el); if (l) l.textContent = Number.isFinite(left) ? (left ? `${left} ${left === 1 ? 'vegada' : 'vegades'}` : 'ja no') : ''; };
  const noVoice = !canSpeak || !catalan();
  if (noVoice && el) el.insertAdjacentHTML('afterend', scriptHtml(T, idx));
  function play(slow = false) {
    if (left <= 0 || noVoice) return false;
    if (Number.isFinite(left)) left--;
    busy = true; paint(); el.classList.add('on'); el.classList.remove('wake'); radio?.classList.add('on');
    const bar = radio && $('.rbar i', radio);
    speak(linesOf(T, idx), { slow, onLine: k => {
      if (!radio) return;
      radio.querySelectorAll('.who').forEach(w => w.classList.toggle('talk', w.dataset.who === T.lines[idx[k]][0]));
      if (bar) bar.style.width = `${Math.round(100 * (k + 1) / idx.length)}%`;
    } }).then(done => { busy = false; el.classList.remove('on'); radio?.classList.remove('on'); radio?.querySelectorAll('.who').forEach(w => w.classList.remove('talk')); api.onEnd?.(done); });
    return true;
  }
  if (el) el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (!play('slow' in b.dataset)) again(el).add('shake'); };
  paint();
  const api = { play, noVoice, onEnd: null, get left() { return left; }, get busy() { return busy; } };
  return api;
}
function radioHtml(T, whole) {
  const who = Object.entries(T.who).map(([k, [name, pic]]) => `<div class="who" data-who="${k}"><span class="av" aria-hidden="true">${pic}</span><b>${H(name)}</b></div>`).join('');
  return `<div class="radio" style="--h:${T.hue ?? 200}"><div class="rtop">${RADIO}<div class="rinfo"><p class="rt"><small>Ràdio Estany</small>${H(T.title)}</p><div class="cast">${who}</div></div></div>
    ${whole ? `${audioHtml('Escolta la gravació')}<div class="rbar" aria-hidden="true"><i></i></div>` : ''}</div>`;
}

/* ---------- what goes over the questions ---------- */
// the context on show: a paper or a radio. A new one comes when the item's ctx is another text
let shown = null, radioP = null;
function setCtx(T, whole, limit) {
  const box = $('#ctx'); shown = T; radioP = null;
  $('#stage')?.classList.toggle('duo', !!T && T.kind !== 'oral' && T.kind !== 'micro' && T.kind !== 'poema' && T.sents.length > 6);
  if (!T) { box.innerHTML = ''; return; }
  box.innerHTML = T.kind === 'oral' ? radioHtml(T, whole) : paperHtml(T, T.kind !== 'micro');
  again(box.firstElementChild).add('pop');
  if (T.kind === 'oral' && whole) radioP = player($('.radio', box), T, T.lines.map((_, i) => i), limit);
}
// the questions of a recording before it is heard (as the minute of the test to read them): a list and a button, or a clock
function readFirst(env, T, items) {
  return new Promise(res => {
    const q = $('#q'), secs = env.mode === 'mock' ? 60 : 0;
    q.innerHTML = `<div class="qcard first"><p class="inst">Abans d'escoltar, llegeix les preguntes. Així sabràs què has de buscar.</p>
      <ol class="pre">${items.map(it => `<li>${H(it.q)}</li>`).join('')}</ol>
      ${secs ? `<p class="clock" id="clock" aria-live="polite">⏱ <b>${secs}</b> s</p>` : ''}<button class="btn" id="ready">Ja les he llegides</button></div>`;
    again($('.qcard', q)).add('pop');
    const at = performance.now() + SETTLE; let left = secs, iv = 0;
    const go = () => { clearInterval(iv); res(); };
    $('#ready').onclick = e => { if (e.timeStamp >= at) go(); };
    if (secs) iv = setInterval(() => { if (!env.t.on) return clearInterval(iv); left--; const c = $('#clock b'); if (c) c.textContent = left; if (left <= 0) go(); }, 1000);
  });
}
// the whole recording heard before its questions: it plays by itself, and the questions come when it ends (or at once without voice)
function listenFirst(env) {
  return new Promise(res => {
    const q = $('#q'), P = radioP, voiced = !!P && !P.noVoice;
    q.innerHTML = `<div class="qcard listen"><p class="inst">${voiced ? 'Escolta tota la gravació. Després vindran les preguntes.' : 'Aquest aparell no té veu en català. Llegeix el que diuen i, després, respon.'}</p>
      <button class="btn${voiced ? ' soft' : ''}" id="go"${voiced ? ' disabled' : ''}>Ara, les preguntes</button></div>`;
    const go = $('#go'), open = () => { if (!go.disabled || !env.t.on) return; go.disabled = false; go.classList.remove('soft'); again(go).add('pop'); go.focus({ preventScroll: true }); };
    go.onclick = () => { if (!go.disabled) { if (P) P.onEnd = null; res(); } };
    if (!voiced) return;
    // the questions open when a hearing ends; a recording never played (no sound) opens them after a while too
    P.onEnd = () => open();
    if (prog.so) setTimeout(() => { if (env.t.on && !P.busy) P.play(); }, 500);
    else $('#ctx .audio')?.classList.add('wake');
    setTimeout(() => { if (env.t.on && !P.busy) open(); }, 15000);
  });
}
// before item k: the context it needs, and the steps a recording asks for before its questions
async function before(items, k, env) {
  const it = items[k];
  if (it.ctx === shown) return;
  const oral = it.oral, whole = !!oral && oral.mode !== 'step';
  setCtx(it.ctx, whole, oral ? oral.limit : Infinity);
  if (!whole) return;
  const mine = []; for (let j = k; j < items.length && items[j].ctx === it.ctx; j++) mine.push(items[j]);
  if (oral.mode === 'first') { env.tip(env.mode === 'mock' ? 'Tens un minut per llegir les preguntes, com a la prova.' : 'Primer llegeix les preguntes. Després escoltaràs la gravació.'); await readFirst(env, it.ctx, mine); if (!env.t.on) return; }
  env.tip(env.limit === 2 || oral.limit === 2 ? 'Escolta bé: la gravació només es pot escoltar dues vegades.' : 'Escolta la gravació. La pots tornar a escoltar sempre que vulguis.');
  await listenFirst(env);
}

/* ---------- one question: the heart of the game ---------- */
// The item it, in #q. env says how: mode 'learn' (a level or the Piscina: a wrong answer is a slip and it is tried again, the hint is
// there), 'exam' (one try, the right answer is shown), 'mock' (one try, nothing is shown until the end; with env.sheet the answer is
// marked with an X on the answer sheet, as in April). Resolves { ok, slips, pick } when the question is over
function ask(it, env) {
  return new Promise(resolve => {
    const t = env.t, q = $('#q'), learn = env.mode === 'learn', T = it.ctx;
    let slips = 0, done = false;
    // what the question before lit up in the text goes out
    document.querySelectorAll('#ctx .mark, #ctx .glow, #ctx .found').forEach(e => e.classList.remove('mark', 'glow', 'found'));
    const num = env.num ? `<b class="qn">${env.num}</b> ` : '';
    let prompt = '';
    if (it.k === 'find') prompt = `<p class="ask">${num}${H(it.q)}</p><p class="inst">🔍 Toca la frase del text on ho diu.</p>`;
    else if (it.k === 'clues') prompt = `<p class="ask">${num}${H(it.q)} <span class="ans-a">${H(it.a)}!</span></p><p class="inst">🕵️ Com ho sabem? Toca les ${it.clues.length} paraules del text que ho diuen.</p><p class="found" id="found" aria-live="polite">${'<i></i>'.repeat(it.clues.length)}</p>`;
    else if (it.k === 'order') prompt = `<p class="ask">${num}${H(it.q)}</p>`;
    else if (it.k === 'swap') prompt = `<p class="ask">${num}${H(it.q)}</p><p class="sent" id="sent">${H(it.s).replace(/\*([^*]+)\*/, '<mark class="hw">$1</mark>')}</p>`;
    else {
      prompt = `<p class="ask">${num}${H(it.q)}</p>`;
      if (it.mark) prompt += `<p class="sent">${H(it.mark).replace(/\*([^*]+)\*/, '<mark class="hw">$1</mark>')}</p>`;
      if (it.letters) prompt += `<ul class="abcd">${it.letters.map(([l, s]) => `<li><b>${l}</b> ${H(s)}</li>`).join('')}</ul>`;
    }
    const sayIt = it.say && it.say.length && T?.kind === 'oral';
    q.innerHTML = `<div class="qcard k-${it.k}">${prompt}${sayIt ? `<div class="mini">${audioHtml('Escolta', true)}</div>` : ''}<div class="ans" id="ans"></div></div>`;
    again($('.qcard', q)).add('pop');
    const ans = $('#ans', q), openAt = performance.now() + SETTLE;
    const P = sayIt ? player($('.mini', q), T, it.say, it.oral?.limit ?? Infinity) : null;
    if (P && prog.so && env.mode !== 'mock') setTimeout(() => { if (t.on && !done) P.play(); }, 450);
    else if (P) $('.mini .audio', q)?.classList.add('wake');
    // a short text and its question fit on the screen together; with a long one the child scrolls, and the text must not go off the top
    if (env.mode !== 'mock' && (!T || T.kind === 'micro')) q.scrollIntoView?.({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });

    const finish = r => { if (!t.on) return; keyFn = null; env.hint = null; const pp = $('#ctx .paper'); if (pp) { pp.classList.remove('tap', 'words'); pp.onclick = null; } resolve(r); };
    async function good(el, pickIdx) {
      if (done) return; done = true; keyFn = null;
      $('.qcard', q).classList.add('solved');
      let lit = false;
      if (env.mode !== 'mock') { spark(el || ans, 140); if (it.ev?.length && it.k !== 'find') lit = markEv(it.ev); }
      env.right(it, slips, lit);
      await sleep(env.mode === 'mock' ? 350 : lit ? 1900 : 1300);
      finish({ ok: learn ? slips === 0 : true, slips, pick: pickIdx });
    }
    const next = (label = 'Segueix') => new Promise(res => {
      ans.insertAdjacentHTML('beforeend', `<button class="btn nextb">${label}</button>`);
      const b = $('.nextb', ans), at = performance.now() + SETTLE; b.focus({ preventScroll: true });
      b.onclick = e => { if (e.timeStamp >= at) res(); };
    });
    // a wrong answer: in a level a slip and try again (false); in an exam or the simulacre the end of the question (true)
    async function bad(msg, reveal, pickIdx) {
      if (done) return true;
      if (learn) { slips++; env.slip(msg); return false; }
      done = true; keyFn = null;
      if (env.mode === 'exam') { reveal?.(); if (it.ev?.length) markEv(it.ev); env.tip(msg, 'oops'); buzz(); await next(); } else await sleep(350);
      finish({ ok: false, slips: 1, pick: pickIdx });
      return true;
    }
    const glow = el => { if (el) again(el).add('glow'); };
    // the hint of a question with sentences that answer it: they glow (and a recording plays them slowly)
    const hintEv = () => {
      if (T?.kind === 'oral' && it.ev?.length) {
        const lines = it.ev.filter(Number.isInteger);
        if (canSpeak && catalan() && lines.length) { speak(linesOf(T, lines), { slow: true }); return 'Escolta-ho a poc a poc: aquí hi ha la resposta.'; }
        return markEv(it.ev, 'glow') ? 'La resposta és a la part que brilla.' : '';
      }
      return it.ev?.length && markEv(it.ev, 'glow') ? 'La resposta és a la part del text que brilla. Llegeix-la a poc a poc.' : '';
    };

    /* --- choose one of four --- */
    if (it.k === 'pick' || it.k === 'swap') {
      if (env.sheet) {
        // as in April: the options in the booklet, and the X on the answer sheet
        ans.innerHTML = `<ol class="booklet">${it.opts.map((o, i) => `<li><b>${LETTERS[i]})</b> ${o.pic ? `<span aria-hidden="true">${o.pic}</span> ` : ''}${H(o.t)}</li>`).join('')}</ol>
          <div class="sheetrow" role="group" aria-label="Full de respostes"><span class="sr-n">${env.num}</span>${it.opts.map((_, i) => `<button class="box" data-o="${i}" aria-label="Resposta ${LETTERS[i]}"><span>${LETTERS[i]}</span></button>`).join('')}</div>`;
      } else ans.innerHTML = `<div class="opts${it.opts.some(o => o.pic) ? ' pics' : ''}">${it.opts.map((o, i) => `<button class="btn soft opt" data-o="${i}"><b class="lt">${LETTERS[i]}</b>${o.pic ? `<span class="op" aria-hidden="true">${o.pic}</span>` : ''}<span class="ot">${H(o.t)}</span></button>`).join('')}</div>`;
      const choose = async b => {
        if (!b || b.disabled || done) return;
        const i = +b.dataset.o;
        if (env.sheet) { ans.querySelectorAll('.box').forEach(x => { x.disabled = true; }); b.classList.add('x'); blip(520); }
        if (i === it.ok) {
          b.classList.add('ok'); q.classList.add('told');
          if (it.k === 'swap' && env.mode !== 'mock') { const hw = $('#sent .hw', q); if (hw) { hw.textContent = it.opts[i].t; again(hw).add('swapped'); } }
          return good(b, i);
        }
        if (env.mode === 'mock') { b.classList.add('picked'); return bad('', null, i); }
        b.classList.add('no'); b.disabled = true; again(b).add('shake');
        if (it.k === 'swap') { const hw = $('#sent .hw', q); if (hw) { const was = hw.textContent; hw.textContent = it.opts[i].t; hw.classList.add('wrong'); setTimeout(() => { hw.textContent = was; hw.classList.remove('wrong'); }, 900); } }
        const right = $(`[data-o="${it.ok}"]`, ans);
        const msg = learn ? (it.k === 'swap' ? 'Amb aquesta paraula, la frase no vol dir el mateix. Prova\'n una altra.'
          : T?.kind === 'oral' ? 'No és aquesta. Torna a escoltar la part que en parla.' : it.ev?.length ? 'No és aquesta. Torna a llegir el text: la resposta hi és.' : 'No és aquesta. Pensa-hi una mica més.')
          : `No! La bona era la ${LETTERS[it.ok]}: ${it.opts[it.ok].t}.`;
        await bad(msg, () => { right.classList.add('ok'); q.classList.add('told'); }, i);
      };
      ans.onclick = e => { if (e.timeStamp >= openAt) choose(e.target.closest('[data-o]')); };
      keyFn = e => { const k = LETTERS.indexOf(e.key.toLowerCase()), n = k >= 0 ? k : '1234'.indexOf(e.key); if (n >= 0 && n < it.opts.length) { e.preventDefault(); choose($(`[data-o="${n}"]`, ans)); } };
      env.hint = () => {
        if (it.clues && T) { const w = [...$('#ctx .paper').querySelectorAll('.w')].filter(x => it.clues.includes(x.dataset.w)); w.forEach(x => again(x).add('glow')); if (w.length) return 'Fixa’t en les paraules que brillen: són les pistes.'; }
        const txt = hintEv();
        if (txt) return txt;
        const left = [...ans.querySelectorAll('[data-o]')].filter(b => !b.disabled && +b.dataset.o !== it.ok);
        if (left.length > 1) { left[0].disabled = true; left[0].classList.add('no'); return 'He tret una opció que no és.'; }
        return 'Només en queden dues: rellegeix la pregunta amb calma.';
      };
    }

    /* --- the magnifying glass: tap the sentence that says it --- */
    else if (it.k === 'find') {
      const paper = $('#ctx .paper'); paper.classList.add('tap');
      paper.onclick = async e => {
        const s = e.target.closest('.s'); if (!s || done || e.timeStamp < openAt) return;
        const i = +s.dataset.s;
        if (it.ev.includes(i)) { markEv([i]); s.classList.add('found'); paper.onclick = null; return good(s); }
        again(s).add('flash');
        await bad(learn ? 'Aquesta frase no ho diu. Llegeix-la bé i busca\'n una altra.' : 'No era aquesta frase!', () => markEv(it.ev));
      };
      env.hint = () => { const p = T.sents[it.ev[0]].p, s = paper.querySelectorAll(`.s`); [...s].filter(x => T.sents[+x.dataset.s].p === p).forEach(x => again(x).add('glow')); return T.paras.length > 1 ? 'És en aquest tros del text.' : 'Llegeix les frases una per una i pregunta\'t: aquesta ho diu?'; };
    }

    /* --- the detective: tap the words that give the answer away --- */
    else if (it.k === 'clues') {
      const paper = $('#ctx .paper'), got = new Set(); paper.classList.add('words');
      const dots = () => [...$('#found', q).children].forEach((d, j) => d.classList.toggle('on', j < got.size));
      paper.onclick = async e => {
        const w = e.target.closest('.w'); if (!w || done || e.timeStamp < openAt) return;
        const key = w.dataset.w;
        if (it.clues.includes(key)) {
          if (got.has(key)) return;
          got.add(key); paper.querySelectorAll(`.w[data-w="${CSS.escape(key)}"]`).forEach(x => x.classList.add('clue')); dots(); blip(up(got.size + 4)); spark(w, 48);
          if (got.size === it.clues.length) return good(w);
          return;
        }
        again(w).add('flash');
        await bad(learn ? 'Aquesta paraula no ens ajuda a saber-ho. Busca\'n una altra.' : 'Aquesta no era una pista!', () => paper.querySelectorAll('.w').forEach(x => { if (it.clues.includes(x.dataset.w)) x.classList.add('clue'); }));
      };
      env.hint = () => { const k = it.clues.find(c => !got.has(c)), w = paper.querySelector(`.w[data-w="${CSS.escape(k)}"]`); glow(w); w?.scrollIntoView({ block: 'nearest' }); return 'La paraula que brilla és una pista.'; };
    }

    /* --- tap the events in the order they happen --- */
    else if (it.k === 'order') {
      let n = 0;
      ans.innerHTML = `<ol class="line" aria-label="L'ordre">${it.events.map(() => '<li class="slot"></li>').join('')}</ol><div class="cardsx">${it.events.map((ev, i) => `<button class="evt" data-o="${i}">${H(ev)}</button>`).join('')}</div>`;
      ans.onclick = async e => {
        const b = e.target.closest('[data-o]'); if (!b || b.disabled || done || e.timeStamp < openAt) return;
        const i = +b.dataset.o;
        if (i === it.seq[n]) {
          const slot = ans.querySelectorAll('.slot')[n]; slot.innerHTML = `<b>${n + 1}</b> ${H(it.events[i])}`; slot.classList.add('ok');
          n++; b.disabled = true; b.classList.add('used'); blip(up(n + 3));
          if (n === it.seq.length) return good(slot);
          return;
        }
        again(b).add('shake');
        await bad(learn ? (n ? 'Això encara no. Què passa just després?' : 'Això no és el primer que passa. Rellegeix el principi.') : 'No anava aquí!', () => {
          ans.querySelectorAll('.slot').forEach((s, j) => { s.innerHTML = `<b>${j + 1}</b> ${H(it.events[it.seq[j]])}`; s.classList.add('ok'); });
        });
      };
      env.hint = () => { glow($(`[data-o="${it.seq[n]}"]`, ans)); return n ? 'El que brilla és el que passa ara.' : 'El que brilla és el primer que passa.'; };
    }
  });
}

/* ---------- the frame of a level, the Piscina, an exam, a sheet, the simulacre ---------- */
function coachHtml() { return `<div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div>`; }
function tipper() {
  return (txt, cls = '') => { const e = $('#tip'); if (!e) return; e.className = 'status tip ' + cls; e.innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
}
const dotsHtml = (n, label) => `<span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span>`;
const paintDots = (k, run) => [...$('#dots').children].forEach((d, j) => { d.className = j === k ? 'cur' : run[j] === true ? 'ok' : run[j] === false ? 'late' : ''; });
const stageHtml = () => `<div class="stage" id="stage"><div id="ctx"></div><div id="q"></div></div>`;
// the env of the levels and the Piscina: a slip lowers the stars, a right answer grows the run
function learnEnv(t, tip, onSlip) {
  return { t, mode: 'learn', limit: Infinity, tip,
    slip: msg => { onSlip(); buzz(); streakBreak(); tip(msg, 'oops'); },
    right: (it, s, lit) => { if (!s) streakUp(); blip(up(Math.min(streak, 12) + 4)); setTimeout(() => blip(up(Math.min(streak, 12) + 6)), 90);
      tip(`${pick(HURRAY)}${it.k === 'find' ? ' <b>Aquesta frase ho diu.</b>' : lit ? ' <b>Mira on ho diu.</b>' : it.k === 'clues' ? ' <b>Bones pistes, detectiu!</b>' : ''}`, 'go'); } };
}
// the titled texts of a list of items, to put on the shelves
const titledOf = items => [...new Set(items.map(it => it.ctx?.id).filter(Boolean))];

/* ---------- the Piscina: three short rounds to learn the buttons ---------- */
const POOL_TIP = [
  'Hola! Soc la granota de la biblioteca. Llegeix el text i toca la resposta bona. Si t’equivoques, hi pots tornar.',
  'Ara tens la lupa! Llegeix la pregunta i toca la frase del text on hi ha la resposta.',
  'I ara, la ràdio. Prem ▶ per escoltar (🐢 ho diu a poc a poc) i tria la resposta.'];
function piscina() {
  const t = fresh(); show('La Piscina', true, 200); $('#toM').hidden = true; $('#toG').hidden = !HUB;
  $('#game').innerHTML = `<div class="hud mid">${dotsHtml(POOL.length, 'Tres jocs')}<span class="combo" id="cb" hidden></span></div>${coachHtml()}${stageHtml()}`;
  const tip = tipper(), run = [];
  shown = null;
  (async () => {
    for (let k = 0; k < POOL.length; k++) {
      paintDots(k, run);
      const env = learnEnv(t, tip, () => {}), items = pool(k, Math.random);
      for (let j = 0; j < items.length; j++) {
        await before(items, j, env); if (!t.on) return;
        const p = ask(items[j], env);
        if (j === 0) tip(POOL_TIP[k]);
        await p; if (!t.on) return;
      }
      run[k] = true; fanfare(); FX.celebrate(8); shown = null;
    }
    paintDots(-1, run);
    const r = poolIn(prog); prog = r.prog; save();
    $('#ctx').innerHTML = $('#q').innerHTML = '';
    tip('Fantàstic! Ja saps jugar. Ara anem al mapa: cada projecte encén una finestra de la biblioteca.', 'go'); fanfare(); FX.celebrate(16);
    await sleep(2800); if (t.on) mapa();
  })();
}

/* ---------- one level of a project ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = $('#game'), Lv = PROJECTS[sec].levels[idx], R = round(sec, idx, Math.random);
  let slips = 0, over = false;
  root.innerHTML = `${levelRow(PROJECTS[sec].levels, OPEN ? 10 : reached(prog, sec), idx)}
    <div class="hud"><span class="chip">ex0${exOf(idx)} · ${H(Lv.title)}</span><span class="chip" id="st"></span><span class="combo" id="cb" hidden></span><span class="tools"><button class="link" id="hintb">Dona'm una pista</button></span></div>
    ${coachHtml()}<div class="hud mid">${dotsHtml(R.items.length, `${R.items.length} preguntes`)}</div>${stageHtml()}`;
  root.querySelectorAll('.levels button').forEach((b, i) => b.classList.toggle('done', prog.lv[sec * 10 + i] > 0));
  wireLevels(root, i => level(sec, i));
  const tip = tipper(), stars = () => { $('#st').textContent = starRow(starsFor(slips)); };
  const env = learnEnv(t, tip, () => { slips++; stars(); });
  streakBreak(); shown = null;
  $('#hintb').onclick = () => { if (over || !env.hint) return; const txt = env.hint(); if (txt) { slips++; stars(); streakBreak(); tip(txt); } };
  stars();
  const first = { 0: 'Llegeix bé: la resposta és al text.', 1: 'La mateixa paraula pot voler dir coses diferents. Mira la frase!', 2: 'Què passa primer? I després?', 3: 'El text no ho diu, però ho deixa veure. Busca les pistes!',
    4: 'Mira com és el text: té títol? Té apartats? És un conte?', 5: 'Escolta amb atenció!', 6: 'Llegeix el conte amb calma. Pots tornar enrere sempre que vulguis.', 7: 'Llegeix els títols dels apartats: t’ajuden a trobar les coses.', 8: 'Escolta l’entrevista de Ràdio Estany.' };
  const run = [];
  (async () => {
    for (let k = 0; k < R.items.length; k++) {
      paintDots(k, run);
      await before(R.items, k, env); if (!t.on) return;
      const p = ask(R.items[k], env);
      if (k === 0 && (!R.items[k].oral || R.items[k].oral.mode === 'step')) tip(first[sec]);
      const res = await p; if (!t.on) return;
      run[k] = res.ok;
    }
    paintDots(-1, run);
    win();
  })();

  async function win() {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    const got = shelve(titledOf(R.items));
    fanfare(); FX.celebrate(end || r.valid ? 16 : 8);
    await sleep(500); if (!t.on) return;
    const stage = $('#stage');
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line2">${H(Lv.title)}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.valid ? '<p class="lead go">🪟 Una finestra nova s’encén a la biblioteca!</p>' : ''}
      ${got ? `<p class="lead go">📚 ${got === 1 ? 'Un text nou' : `${got} textos nous`} a la biblioteca</p>` : ''}
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length || r.valid ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }
}

/* ---------- the exam of a circle: six questions, one try each, no hints; the recordings twice ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]); streakBreak();
  const qs = exam(c, Math.random), run = [];
  const items = []; for (let i = 0; i < qs.length; i += 2) items.push(...examPair(qs[i].p, qs[i].idx, Math.random));
  $('#game').innerHTML = `<div class="hud mid">${dotsHtml(qs.length, 'Sis preguntes')}<span class="chip" id="qn"></span></div>${coachHtml()}${stageHtml()}`;
  const tip = tipper();
  const env = { t, mode: 'exam', limit: 2, tip, slip: () => {}, right: () => { chime([523, 659, 784]); FX.celebrate(4); tip('Correcte!', 'go'); } };
  shown = null;
  (async () => {
    for (let k = 0; k < items.length; k++) {
      paintDots(k, run); $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[qs[k].p].name}`;
      await before(items, k, env); if (!t.on) return;
      const p = ask(items[k], env);
      if (!items[k].oral || items[k].oral.mode === 'step') tip(k ? 'Següent pregunta. Només hi ha un intent!' : 'Examen! Sis preguntes, un sol intent cada una i les gravacions dues vegades, com a la prova.');
      run[k] = (await p).ok; if (!t.on) return;
    }
    paintDots(-1, run);
    const r = examIn(prog, c, qs, run), first = r.good && !prog.exams[c]; prog = r.prog; save();
    shelve(titledOf(items));
    $('#ctx').innerHTML = $('#q').innerHTML = ''; $('#qn').hidden = true; $('#stage').classList.remove('duo');
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    tip(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) FX.celebrate(16);
    panel($('#stage'), `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${first ? `<p class="lead go">✨ Les bandes daurades del llibre ${c + 1} brillen!</p>` : ''}${first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  })();
}

/* ---------- the simulacre: the 23 questions of the Catalan test, in its three parts ---------- */
// Two ways. «Pas a pas»: each question of the interview plays its own piece, and a wrong answer is tried again, as in a level (it
// does not count for the record). «Com a l'abril»: a minute to read the questions, the whole recording twice at most, one try, and
// every answer marked with an X on the answer sheet; the mark and its level at the end, as the report of the test gives them
function simulacre() {
  const t = fresh(); show('Simulacre de la prova', true, 20); streakBreak();
  $('#game').innerHTML = `${coachHtml()}<div class="stage" id="stage"><div class="mockintro"><h2>🎯 Simulacre de la prova de català</h2>
    <p>Com a l'abril: <b>23 preguntes</b> en tres parts, i una sola resposta bona a cada pregunta.</p>
    <ol><li><b>Comprensió oral</b> (1-9): una entrevista de Ràdio Estany. Primer llegeixes les preguntes, després l'escoltes (dues vegades com a molt).</li><li><b>Text narratiu</b> (10-15): un conte.</li><li><b>Text informatiu</b> (16-23): un text que explica coses.</li></ol>
    <div class="cards"><button class="card" id="step"><span class="ci" aria-hidden="true">👣</span><b>Pas a pas</b><span>Cada pregunta amb el seu tros de l'entrevista. Si t'equivoques, ho tornes a provar.</span></button>
      <button class="card" id="go"><span class="ci" aria-hidden="true">📝</span><b>Com a l'abril</b><span>Amb full de respostes: marques una X. No es pot esborrar, i la nota surt al final.</span></button></div></div></div>`;
  const tip = tipper();
  tip('Primer pas a pas. Quan et surti bé, prova-ho com a l’abril. Tu pots!');
  $('#step').onclick = () => start(true); $('#go').onclick = () => start(false);
  function start(step) {
    const S = mock(Math.random, step), all = S.flatMap((s, i) => s.items.map(it => ({ it, s: i }))), run = [], picks = [];
    $('#game').innerHTML = `<div class="hud mid">${dotsHtml(all.length, 'Vint-i-tres preguntes')}</div>${coachHtml()}<div class="stage" id="stage"><p class="sechead" id="sh"></p><div id="ctx"></div><div id="q"></div></div>`;
    const tip2 = tipper();
    let env = { t, mode: 'mock', sheet: true, limit: 2, tip: tip2, slip: () => {}, right: () => {} };
    if (step) env = { ...learnEnv(t, tip2, () => {}) };
    const TIPS = step ? ['Escolta cada tros i respon. Fins que no l’encertis, no passem a la següent.', 'Ara el conte. Llegeix-lo amb calma: les respostes hi són.', 'Última part: el text informatiu. Fixa’t en els títols dels apartats.']
      : ['', 'Ara el conte. Pots tornar al text tantes vegades com vulguis.', 'Última part. Llegeix els títols: t’ajuden a trobar les coses.'];
    shown = null;
    (async () => {
      let k = 0;
      for (const [si, s] of S.entries()) {
        $('#sh').innerHTML = `<b>${H(s.title)}</b> · preguntes ${s.range} · ${H(s.name)}`;
        for (let j = 0; j < s.items.length; j++) {
          env.num = k + 1; paintDots(k, run);
          await before(s.items, j, env); if (!t.on) return;
          const p = ask(s.items[j], env);
          if (j === 0 && TIPS[si]) tip2(TIPS[si]); else if (!step && j === 0) tip2('Respon les preguntes. Si cal, escolta la gravació una altra vegada.');
          const r = await p; if (!t.on) return;
          run[k] = r.ok; picks[k] = r.pick; k++;
        }
        shown = null;
      }
      paintDots(-1, run);
      finish(S, all, run, picks, step);
    })();
  }
  function finish(S, all, run, picks, step) {
    const score = count(run), r = step ? null : mockDone(prog, score), mk = markOf(score), lvl = levelOf(mk);
    if (r) { prog = r.prog; save(); }
    shelve([...new Set(S.map(s => s.ctx.id))]);
    $('#ctx').innerHTML = $('#q').innerHTML = ''; $('#sh').textContent = ''; $('#stage').classList.remove('duo'); $('#stage').classList.add('flat');
    const parts = S.map((s, i) => { const idx = all.map((a, j) => a.s === i ? j : -1).filter(j => j >= 0); return `${H(s.title)}: ${count(idx.map(j => run[j]))} de ${idx.length}`; });
    const by = Object.entries(PROCS).map(([p, name]) => { const idx = all.map((a, j) => a.it.proc === p ? j : -1).filter(j => j >= 0); return idx.length ? `<li><span>${H(name)}</span><b>${count(idx.map(j => run[j]))} de ${idx.length}</b><i style="--w:${Math.round(100 * count(idx.map(j => run[j])) / idx.length)}%"></i></li>` : ''; }).join('');
    const good = step || score >= 12;
    good ? (fanfare(), FX.celebrate(score >= 21 ? 24 : 14)) : click(196, 0, 0.5, 0.12, 'triangle');
    tipper()(step ? `Molt bé! ${score >= 18 ? 'Ara prova-ho com a l’abril.' : 'Torna-hi pas a pas fins que les encertis gairebé totes a la primera.'}` : good ? `${lvl}! Ho has fet molt bé.` : 'Cada simulacre t’ajuda a millorar. Mira què ha fallat i torna-hi!', good ? 'go' : '');
    const sheetGrid = step ? '' : `<details class="review"><summary>El full de respostes</summary><div class="fullsheet">${all.map((a, j) => `<div class="fr${run[j] ? ' ok' : ' no'}"><span>${j + 1}</span>${a.it.opts.map((_, i) => `<i class="${picks[j] === i ? 'x' : ''}${i === a.it.ok ? ' right' : ''}">${LETTERS[i]}</i>`).join('')}</div>`).join('')}</div></details>`;
    const missed = all.flatMap((a, j) => run[j] ? [] : [`<li><b>${j + 1}.</b> ${H(a.it.q)} → <b>${H(a.it.opts[a.it.ok].t)}</b></li>`]);
    panel($('#stage'), `<h2>${score} de ${MOCK_N}${step ? ' a la primera' : ''}</h2>
      ${step ? '' : `<p class="mark">Nota <b>${mk.toFixed(1).replace('.', ',')}</b> · <span class="lvl l${['Excel·lent', 'Notable', 'Satisfactori'].indexOf(lvl)}">${lvl}</span></p>`}
      <p class="lead">${parts.join(' · ')}</p><ul class="procs">${by}</ul>
      ${step ? '<p class="lead">Pas a pas no compta per al rècord.</p>' : `<p class="lead">${r.best ? 'Nou rècord!' : `Rècord: ${prog.best} de ${MOCK_N}`} · Simulacres fets: ${prog.proves}</p>${news(r.news)}`}
      ${sheetGrid}
      ${missed.length ? `<details class="review"><summary>${step ? 'Les que no has encertat a la primera' : 'Mira les que has fallat'} (${missed.length})</summary><ul>${missed.join('')}</ul></details>` : '<p class="lead go">Totes bé! 🎉</p>'}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre simulacre</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => simulacre();
  }
}

/* ---------- «Caça l'errada»: three answers about a text in the notebook; from none to two are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40); streakBreak();
  const S = sheet(Math.random), cs = S.claims, run = [];
  $('#game').innerHTML = `<div class="hud mid">${dotsHtml(cs.length, 'Tres respostes')}</div>${coachHtml()}<div class="stage" id="stage"><div id="ctx"></div><div id="q"></div></div>`;
  shown = null; setCtx(S.text, false, Infinity);
  const tip = tipper();
  let k = -1, C, busy = true, res = null, openAt = 0;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE; paintDots(k, run);
    $('#ctx').querySelectorAll('.mark').forEach(e => e.classList.remove('mark'));
    $('#q').innerHTML = `<div class="qcard"><p class="ask">${H(C.q)}</p><p class="inst">A la llibreta hi diu:</p><p class="claimbox">«${H(C.says)}»</p>
      <div class="opts two" id="tail"><button class="btn" id="yes">És correcta</button><button class="btn soft" id="no">Té una errada</button></div></div>`;
    tip(k ? 'Següent resposta. Mira-la al text!' : 'Llegeix el text. Després mira les respostes de la llibreta: són correctes?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; paintDots(k, run);
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of $('#q').querySelectorAll('button')) b.disabled = true;
    if (C.ev.length) markEv(C.ev);
    if (ok) { tip(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { tip(said, 'oops'); buzz(); }
    await sleep(ok ? 1700 : 3200); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}»)`] : []);
    $('#q').innerHTML = ''; paintDots(-1, run);
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    tip(r.good ? 'Llibreta perfecta!' : 'Llibreta acabada.', r.good ? 'go' : '');
    panel($('#stage'), `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Full perfecte ✓ · +${r.gain} XP` : 'Full perfecte ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${H(list(bad))}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra llibreta</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => full();
  }
  $('#q').onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled || busy || e.timeStamp < openAt) return;
    const wrong = C.says !== C.real;
    if (b.id === 'yes') answer(!wrong, wrong ? `No ho era. La bona és: «${H(C.real)}»` : 'Sí! Era correcta.');
    else if (b.id === 'no') {
      if (!wrong) return answer(false, `Sí que ho era: «${H(C.real)}»`);
      openAt = performance.now() + SETTLE;
      $('#tail').outerHTML = `<div class="opts" id="tail">${C.opts.map((v, i) => `<button class="btn soft opt" data-v="${i}"><b class="lt">${LETTERS[i]}</b><span class="ot">${H(v)}</span></button>`).join('')}</div>`;
      tip('Ben vist! Ara tria la resposta bona.', 'go');
    } else if ('v' in b.dataset) { const ok = C.opts[+b.dataset.v] === C.real; answer(ok, ok ? `Arreglada: «${H(C.real)}»` : `No era aquesta. La bona és: «${H(C.real)}»`); }
  };
  arm();
}

/* ---------- the library: every text on its shelf, the ones read in colour; a tap opens it ---------- */
function biblioteca() {
  const t = fresh(); show('La biblioteca', true, 30);
  const n = count(prog.llibres);
  $('#game').innerHTML = `<div class="albhead"><h2>📚 ${n} de ${BOOKS.length} textos</h2><p class="grow">Cada text que llegeixes en un nivell es queda a la biblioteca. Toca'n un per tornar-lo a llegir o a escoltar.</p></div>
    ${SHELVES.map(([name, texts]) => { const got = texts.filter(T => prog.llibres[bookIndex(T.id)]).length;
      return `<section class="shelf"><h3>${H(name)} <small>${got} de ${texts.length}</small></h3><div class="row">${texts.map(T => { const has = prog.llibres[bookIndex(T.id)];
        return `<button class="spine${has ? '' : ' no'}${T.kind === 'oral' ? ' disc' : ''}" data-id="${T.id}" style="--h:${T.hue ?? 200};--t:${(T.id.length % 5) * 4}px" aria-label="${has ? H(T.title) : 'Text que encara no tens'}"><span class="sp" aria-hidden="true">${has ? T.pic : '?'}</span><span class="st">${has ? H(T.title) : ''}</span></button>`; }).join('')}</div><div class="plank" aria-hidden="true"></div></section>`; }).join('')}
    <button class="btn" id="bk">Torna al mapa</button><div class="zoom" id="zoom" hidden></div>`;
  const zoom = $('#zoom'), close = () => { hush(); zoom.hidden = true; keyFn = null; shown = null; };
  function open(id) {
    const T = bookOf(id), has = prog.llibres[bookIndex(id)];
    if (has) {
      zoom.innerHTML = `<div class="zcard read" role="dialog" aria-modal="true" aria-label="${H(T.title)}"><div id="ctx"></div>${T.kind !== 'oral' ? `<div class="readaloud">${audioHtml('Escolta el text', true)}</div>` : ''}<button class="btn soft" data-close>Tanca</button></div>`;
      zoom.hidden = false;
      if (T.kind === 'oral') { setCtx(T, true, Infinity); $('#ctx .radio', zoom).insertAdjacentHTML('beforeend', scriptHtml(T, T.lines.map((_, i) => i))); }
      else {
        $('#ctx', zoom).innerHTML = paperHtml(T);
        const R = { ...T, kind: 'oral', who: { N: ['', ''] }, lines: T.paras.map(ss => ['N', ss.map(i => T.sents[i].t).join(' ')]) };
        if (canSpeak && catalan()) player($('.readaloud', zoom), { ...R, lines: [['N', T.title], ...R.lines] }, [0, ...R.lines.map((_, i) => i + 1)], Infinity);
        else $('.readaloud', zoom).remove();
      }
      page();
    } else {
      const [p, idx] = whereOf(id), ok = OPEN || isOpen(prog, circleOf(p));
      zoom.innerHTML = `<div class="zcard" role="dialog" aria-modal="true" aria-label="Text que encara no tens"><div class="ghost" style="--h:${T.hue ?? 200}">?</div>
        <p class="lead">Encara no l'has llegit. Surt a <b>${H(PROJECTS[p].name)}</b>, al nivell ${idx + 1}${p >= 6 ? ` («${H(PROJECTS[p].levels[idx].title)}»)` : ''}.</p>
        ${ok ? '<button class="btn" data-go>Vés-hi</button>' : '<p class="lead">Aquest projecte encara està tancat.</p>'}<button class="${ok ? 'link' : 'btn soft'}" data-close>Tanca</button></div>`;
      zoom.hidden = false;
      if (ok) $('[data-go]', zoom).onclick = () => level(p, idx);
      blip(330);
    }
    $('.zcard', zoom).classList.add('pop');
    ($('[data-go]', zoom) || $('[data-close]', zoom)).focus({ preventScroll: true });
    keyFn = e => { if (e.key === 'Escape') close(); };
  }
  zoom.onclick = e => { if (e.target === zoom || e.target.closest('[data-close]')) close(); };
  $('#game').onclick = e => {
    if (!t.on || !zoom.hidden) return;
    const b = e.target.closest('.spine[data-id]');
    if (b) { again(b).add('pop'); if (!b.classList.contains('no')) spark(b, 40); open(b.dataset.id); }
    if (e.target.closest('#bk')) mapa();
  };
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
