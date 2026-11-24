import { $, RM, sleep, pick, mid, OBERT } from '../../shared/util.js';
import { voice, pentatonic } from '../../shared/audio.js';
import { pond } from '../../shared/fx.js';
import { panel, levelRow, wireLevels } from '../../shared/sections.js';
import { load, save as store } from '../../shared/progress.js';
import { cursusMap, badgeList } from '../../shared/mapa.js';
import { SETTLE, ownPage, tokens, xpBar, soundButton, list, news, starRow, combo } from '../../shared/shell.js';
import { ETAPES, PROJECTS, CIRCLES, POOL, POINTS, EXAM_PASS, VALID, starsFor, clean, noteOf, reached, validated, levelText, isOpen, examOpen, circleOf, exOf,
  BADGES, badges, levelIn, poolIn, exam, examIn, sheet, sheetIn, streakIn, round, pool, meuOf, meuIn, meuNou } from './logic.js';
import { PRIMER } from './contingut.js';
import { speak, hush, canSpeak, catalan } from './speech.js';
import { FROG, ROSE } from './draw.js';
import { island3d, RING as WRING } from './world.js';
import { playNew, sceneOf } from './proves.js';

const KEY = 'bruixola-de-l-estany';
// ?obert at the end of the address (shared/util.js) opens every circle, every exam and every level, to try the game out
const OPEN = OBERT;

// Facts only: { so, lv, piscina, exams, fulls, ratxa, meu }. clean() makes a complete progress out of anything
let prog = clean(load(KEY));
const save = () => { store(KEY, prog); paintXp(); };
const paintXp = () => xpBar(levelText(prog));
// every new screen cancels the running one through this token, and stops the voice
let keyFn = null;
const fresh = tokens(() => { hush(); keyFn = null; });

const { tone, chime } = voice(() => prog.so), { tone: click } = voice(() => prog.so, false);
// the island in 3D is the picture behind the page; without WebGL its calls do nothing and the page draws as before
const W = island3d($('#world'));
document.body.classList.toggle('nogl', !W.ok);
window.__illa = W;
const FX = W.ok ? { burst() {}, ring() {}, celebrate: n => W.celebrate(n >= 16 ? 3 : n >= 8 ? 2 : 1), mood() {} } : pond(tone);
const blip = (f = 660) => click(f, 0, 0.08, 0.06);
const buzz = () => click(150, 0, 0.3, 0.12, 'triangle');
const fanfare = () => chime([523, 659, 784, 1047, 1319]);
const up = pentatonic(523);

const HURRAY = ['Molt bé!', 'Genial!', 'Perfecte!', 'Fantàstic!', 'Ben vist!', 'Exacte!', 'Així es fa!', 'Bravo!'];
const HUES = [45, 200, 15, 40, 190, 300, 330, 280, 120, 260, 150, 30];
const RING = WRING;
const again = e => { e.classList.remove('shake', 'pop', 'glow', 'flash'); void e.getBoundingClientRect(); return e.classList; };
const spark = (e, h = 48) => { if (e) { const p = mid(e); FX.burst(p.x, p.y, h, 16, 130); } };
const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const LETTERS = ['a', 'b', 'c', 'd'];
const voiced = () => canSpeak && catalan();

const HUB = ownPage(KEY);
// the island is framed in the part of the screen the panel leaves free: on its left when the screen is wide, above it otherwise
const WIDE = matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');
function frame3d() {
  if (!W.ok) return;
  if (WIDE.matches) W.layout('right', $('#app').getBoundingClientRect().width + 24);
  else { const v = $('.view'); W.layout('bottom', v ? Math.max(0.3, 1 - v.getBoundingClientRect().bottom / innerHeight) : 0.55); }
}
WIDE.addEventListener?.('change', () => frame3d());
{ let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(frame3d, 150); }); }
// a screen: the room the island is seen through (h tall on a narrow screen) and the panel of glass under it
function pane3d(h) { $('#game').innerHTML = `<div class="view" style="height:${h}" aria-hidden="true"></div><div class="pane" id="pane"></div>`; frame3d(); return $('#pane'); }
function worldState() {
  const open = PROJECTS.map((_, i) => OPEN || isOpen(prog, circleOf(i))), valid = validated(prog);
  W.state({ lv: prog.lv, valid, open, exams: prog.exams, next: PROJECTS.findIndex((_, i) => open[i] && !valid.includes(i)) });
}
function show(kicker, playing, hue) {
  document.body.classList.toggle('playing', playing); W.onPick = null; W.highlight(null);
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
// the run of right answers in a row: the record is kept
let streak = 0;
function streakUp() {
  streak++; combo(streak);
  if (streak > prog.ratxa) { const r = streakIn(prog, streak); prog = r.prog; save(); if (r.news.length) toast(`★ <b>${H(list(r.news))}</b>`); }
}
function streakBreak() { streak = 0; combo(0); }

/* ---------- the compass: the six stages around a ring, like the hours of a clock, and a needle that points at one ---------- */
const PX = [50, 86, 86, 50, 14, 14], PY = [8, 29, 71, 92, 71, 29];
function compassHtml(sel = -1, { tap = true, small = false, grid = false } = {}) {
  const pts = ETAPES.map((E, e) => `<button class="pt${sel === e ? ' on' : ''}" data-e="${e}" style="--x:${PX[e]}%;--y:${PY[e]}%;--h:${E.hue}"${tap ? '' : ' tabindex="-1"'} aria-label="${H(E.nom)}"><span class="pi" aria-hidden="true">${E.icona}</span><b>${H(E.nom)}</b></button>`).join('');
  return `<div class="compass${small ? ' small' : ''}${tap ? ' tap' : ''}${grid ? ' grid' : ''}" style="--a:${sel < 0 ? 0 : sel * 60}deg">${ROSE}${pts}<div class="needle" aria-hidden="true"><i></i></div></div>`;
}
// the needle turns to stage e, and that point lights up
function point(box, e) {
  box.style.setProperty('--a', `${e * 60}deg`);
  box.querySelectorAll('.pt').forEach(b => b.classList.toggle('on', +b.dataset.e === e));
}
// a small speaker that reads a text aloud, when the browser has a Catalan voice
const sayBtn = (text, cls = '') => (voiced() ? `<button class="say ${cls}" data-say="${H(text)}" aria-label="Escolta">🔊</button>` : '');
document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { again(b).add('pop'); speak(b.dataset.say); } });

/* ---------- the paper of a text ---------- */
function paperHtml(T) {
  return `<article class="paper" style="--h:${T.hue}"><header class="ph"><span class="ppic" aria-hidden="true">${T.icona}</span><h3>${H(T.titol)}</h3>${sayBtn(`${T.titol}. ${T.sents.join(' ')}`, 'ps')}</header>
    <div class="pbody"><p class="par">${T.sents.map((t, i) => `<span class="s" data-s="${i}">${H(t)}</span>`).join(' ')}</p></div></article>`;
}
// the sentences that answer, lit like a highlighter
function markEv(ev, cls = 'mark') {
  const els = ev.map(i => $(`#ctx [data-s="${i}"]`)).filter(Boolean);
  els.forEach(e => again(e).add(cls));
  els[0]?.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
  return els.length > 0;
}
let shown = null;
function setCtx(T) {
  const box = $('#ctx'); shown = T || null;
  box.innerHTML = T ? paperHtml(T) : '';
  if (T) again(box.firstElementChild).add('pop');
}
const before = it => { if (it.ctx !== shown) setCtx(it.ctx); };

/* ---------- one question: the heart of the game ---------- */
// The item it, in #q. env says how: mode 'learn' (a level or the Piscina: a wrong answer is a slip and it is tried again, the hint is
// there) or 'exam' (one try, the right answer is shown). Resolves { ok, slips } when the question is over
function ask(it, env) {
  return new Promise(resolve => {
    const t = env.t, q = $('#q'), learn = env.mode === 'learn';
    let slips = 0, done = false, hinted = false;
    document.querySelectorAll('#ctx .mark, #ctx .glow, #ctx .found').forEach(e => e.classList.remove('mark', 'glow', 'found'));
    const num = env.num ? `<b class="qn">${env.num}</b> ` : '';
    let prompt = `<p class="ask">${num}${H(it.q)}${sayBtn([it.q, it.pre, it.text].filter(Boolean).join('. '))}</p>`;
    if (it.pre) prompt += `<p class="moment">${H(it.pre)}</p>`;
    if (it.text) prompt += `<p class="moment big">${H(it.text)}</p>`;
    if (it.inst) prompt += `<p class="inst">${H(it.inst)}</p>`;
    q.innerHTML = `<div class="qcard k-${it.k}">${prompt}<div class="ans" id="ans"></div></div>`;
    again($('.qcard', q)).add('pop');
    const ans = $('#ans', q), openAt = performance.now() + SETTLE;
    // what is on screen, for the browser tests
    window.__bruixola = { it, mode: env.mode };
    W.scene(sceneOf(it));
    let onStage = null;
    W.onPick = (kind, key) => { if (kind === 'stage') onStage?.(+key); };
    if (it.s !== undefined && it.ctx) markEv([it.s], 'glow');
    if (!it.ctx) q.scrollIntoView?.({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });

    const finish = r => { if (!t.on) return; keyFn = null; env.hint = null; const pp = $('#ctx .paper'); if (pp) { pp.classList.remove('tap'); pp.onclick = null; } resolve(r); };
    async function good(el) {
      if (done) return; done = true; keyFn = null;
      $('.qcard', q).classList.add('solved');
      spark(el || ans, 140); W.cheer();
      if (it.marks?.length) markEv(it.marks);
      env.right(it, slips);
      await sleep(it.per && learn ? 2300 : 1300);
      finish({ ok: learn ? slips === 0 : true, slips });
    }
    const next = (label = 'Segueix') => new Promise(res => {
      ans.insertAdjacentHTML('beforeend', `<button class="btn nextb">${label}</button>`);
      const b = $('.nextb', ans), at = performance.now() + SETTLE; b.focus({ preventScroll: true });
      b.onclick = e => { if (e.timeStamp >= at) res(); };
    });
    // a wrong answer: in a level a slip and try again (false); in an exam the end of the question (true)
    async function bad(msg, reveal) {
      if (done) return true;
      W.oops();
      if (learn) { slips++; env.slip(msg); return false; }
      done = true; keyFn = null;
      reveal?.(); env.tip(msg, 'oops'); buzz(); await next();
      finish({ ok: false, slips: 1 });
      return true;
    }
    const glow = el => { if (el) again(el).add('glow'); };
    // the hint of a question that says one: its words the first time, then a wrong option goes out
    const dropOne = sel => { const left = [...ans.querySelectorAll(sel)].filter(b => !b.disabled && !b.classList.contains('ok') && !b.classList.contains('right')); if (left.length > 1) { left[0].disabled = true; left[0].classList.add('no'); return true; } return false; };

    /* --- watch the path: the six stages light up in order --- */
    if (it.k === 'mira') {
      ans.innerHTML = `${compassHtml(-1, { tap: false, grid: W.ok })}<p class="walk" id="walk" aria-live="polite"></p><button class="btn" id="go" disabled>Ara ordena-les tu</button><button class="link" id="re" hidden>Torna-ho a veure</button>`;
      const box = $('.compass', ans), walk = $('#walk', ans), go = $('#go', ans), re = $('#re', ans);
      let my = 0;
      async function walkIt() {
        const mine = ++my; go.disabled = true; re.hidden = true;
        for (let e = 0; e < 6 && t.on && mine === my; e++) {
          point(box, e); W.visit(e, 1000); const E = ETAPES[e];
          walk.innerHTML = `<b>${e + 1}. ${H(E.nom)}</b> · ${H(E.que)}`; again(walk).add('pop'); blip(up(e + 3));
          if (prog.so && voiced()) { await speak(`${e + 1}. ${E.nom}. ${E.que}`); await sleep(300); } else await sleep(2600);
        }
        if (!t.on || mine !== my) return;
        walk.innerHTML = '<b>Sis etapes, sempre en aquest ordre.</b> Com les hores d’un rellotge.';
        go.disabled = false; again(go).add('pop'); go.focus({ preventScroll: true }); re.hidden = false;
      }
      go.onclick = e => { if (!go.disabled && e.timeStamp >= openAt) { hush(); good(go); } };
      re.onclick = () => walkIt();
      env.hint = () => 'Mira com la fletxa va d’una etapa a la següent.';
      walkIt();
    }

    /* --- put the six stages in order --- */
    else if (it.k === 'ordre') {
      let n = 0;
      ans.innerHTML = `<ol class="line" aria-label="L'ordre">${ETAPES.map(() => '<li class="slot"></li>').join('')}</ol><div class="cardsx">${it.cards.map(e => `<button class="evt" data-e="${e}" style="--h:${ETAPES[e].hue}"><span class="pi" aria-hidden="true">${ETAPES[e].icona}</span>${H(ETAPES[e].nom)}</button>`).join('')}</div>`;
      ans.onclick = async e => {
        const b = e.target.closest('[data-e]'); if (!b || b.disabled || done || e.timeStamp < openAt) return;
        const i = +b.dataset.e;
        if (i === n) {
          const slot = ans.querySelectorAll('.slot')[n]; slot.innerHTML = `<b>${n + 1}</b> <span class="pi" aria-hidden="true">${ETAPES[i].icona}</span> ${H(ETAPES[i].nom)}`; slot.classList.add('ok'); slot.style.setProperty('--h', ETAPES[i].hue);
          W.needle(i); n++; b.disabled = true; b.classList.add('used'); blip(up(n + 3));
          if (n === 6) return good(slot);
          return;
        }
        again(b).add('shake');
        await bad(learn ? (n ? `Això encara no. Després de «${ETAPES[n - 1].nom}», què ve?` : 'Això no és el primer. Un projecte comença amb una pregunta.') : 'No anava aquí!', () => {
          ans.querySelectorAll('.slot').forEach((s, j) => { s.innerHTML = `<b>${j + 1}</b> ${H(ETAPES[j].nom)}`; s.classList.add('ok'); });
        });
      };
      env.hint = () => { glow($(`[data-e="${n}"]`, ans)); return n ? 'La que brilla és la que ve ara.' : 'La que brilla és la primera.'; };
    }

    /* --- which stage: tap it on the compass --- */
    else if (it.k === 'etapa') {
      ans.innerHTML = compassHtml(-1, { tap: true, grid: W.ok });
      const box = $('.compass', ans);
      onStage = e => choose($(`[data-e="${e}"]`, ans));
      const choose = async b => {
        if (!b || b.disabled || done) return;
        const i = +b.dataset.e;
        if (i === it.ok) { point(box, i); W.needle(i); b.classList.add('ok'); return good(b); }
        b.classList.add('no'); b.disabled = true; again(b).add('shake');
        await bad(learn ? 'No és aquesta etapa. Rellegeix què passa: què estan fent?' : `No! Era «${ETAPES[it.ok].nom}».`, () => { point(box, it.ok); $(`[data-e="${it.ok}"]`, ans).classList.add('ok'); });
      };
      ans.onclick = e => { if (e.timeStamp >= openAt) choose(e.target.closest('.pt')); };
      keyFn = e => { const n = '123456'.indexOf(e.key); if (n >= 0) { e.preventDefault(); choose($(`[data-e="${n}"]`, ans)); } };
      env.hint = () => {
        const left = [...ans.querySelectorAll('.pt')].filter(b => !b.disabled && +b.dataset.e !== it.ok);
        if (left.length > 2) { left.slice(0, 2).forEach(b => { b.disabled = true; b.classList.add('no'); }); return 'He apagat dues etapes que no són.'; }
        if (left.length > 1) { left[0].disabled = true; left[0].classList.add('no'); return 'Només en queden dues. Què estan fent: començar, planificar, buscar, fer, explicar o mirar enrere?'; }
        return `Pregunta't: ${ETAPES[it.ok].preguntes[0]}`;
      };
    }

    /* --- choose one of three or four --- */
    else if (it.k === 'pick') {
      ans.innerHTML = `<div class="opts${it.opts.some(o => o.pic) ? ' pics' : ''}">${it.opts.map((o, i) => `<button class="btn soft opt" data-o="${i}"><b class="lt">${LETTERS[i]}</b>${o.pic ? `<span class="op" aria-hidden="true">${o.pic}</span>` : ''}<span class="ot">${H(o.t)}</span></button>`).join('')}</div>`;
      const choose = async b => {
        if (!b || b.disabled || done) return;
        const i = +b.dataset.o;
        if (i === it.ok) { b.classList.add('ok'); q.classList.add('told'); return good(b); }
        b.classList.add('no'); b.disabled = true; again(b).add('shake');
        const right = $(`[data-o="${it.ok}"]`, ans);
        const msg = learn ? (it.opts[i].no || (it.ctx ? 'No és aquesta. Torna a llegir el text: la resposta hi és.' : 'No és aquesta. Pensa-hi una mica més.')) : `No! La bona era la ${LETTERS[it.ok]}: ${it.opts[it.ok].t}`;
        await bad(msg, () => { right.classList.add('ok'); q.classList.add('told'); });
      };
      ans.onclick = e => { if (e.timeStamp >= openAt) choose(e.target.closest('[data-o]')); };
      keyFn = e => { const k = LETTERS.indexOf(e.key.toLowerCase()), n = k >= 0 ? k : '1234'.indexOf(e.key); if (n >= 0 && n < it.opts.length) { e.preventDefault(); choose($(`[data-o="${n}"]`, ans)); } };
      env.hint = () => {
        if (it.hint && !hinted) { hinted = true; return it.hint; }
        if (it.ctx && it.marks?.length && !hinted) { hinted = true; markEv(it.marks, 'glow'); return 'Les frases que brillen responen dues de les preguntes. Quina queda sense resposta?'; }
        if (dropOne(`[data-o]:not([data-o="${it.ok}"])`)) return 'He tret una opció que no és.';
        return 'Només en queden dues: rellegeix la pregunta amb calma.';
      };
    }

    /* --- the magnifying glass: tap the sentence that answers --- */
    else if (it.k === 'frase') {
      const paper = $('#ctx .paper'); paper.classList.add('tap');
      paper.onclick = async e => {
        const s = e.target.closest('.s'); if (!s || done || e.timeStamp < openAt) return;
        const i = +s.dataset.s;
        if (i === it.ok) { markEv([i]); s.classList.add('found'); paper.onclick = null; return good(s); }
        again(s).add('flash');
        await bad(learn ? 'Aquesta frase no ho diu. Busca la que parla del que pregunten.' : 'No era aquesta frase!', () => markEv([it.ok]));
      };
      env.hint = () => { if (!hinted) { hinted = true; return `Busca al text la paraula «${it.kw[0]}».`; } markEv([it.ok], 'glow'); return 'La frase que brilla ho diu. Llegeix-la a poc a poc.'; };
    }

    /* --- tap the n right ones --- */
    else if (it.k === 'multi') {
      const got = new Set();
      ans.innerHTML = `<div class="chips">${it.opts.map((o, i) => `<button class="chipo" data-o="${i}" aria-pressed="false">${H(o.t)}</button>`).join('')}</div><p class="found" id="found" aria-live="polite">${'<i></i>'.repeat(it.n)}</p>`;
      const dots = () => [...$('#found', q).children].forEach((d, j) => d.classList.toggle('on', j < got.size));
      ans.onclick = async e => {
        const b = e.target.closest('[data-o]'); if (!b || b.disabled || done || e.timeStamp < openAt) return;
        const i = +b.dataset.o;
        if (got.has(i)) { got.delete(i); b.classList.remove('sel'); b.setAttribute('aria-pressed', 'false'); dots(); return; }
        got.add(i); b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); dots(); blip(up(got.size + 4));
        if (got.size < it.n) return;
        const rights = it.oks.filter(k => got.has(k)), wrongs = [...got].filter(k => !it.oks.includes(k));
        if (!wrongs.length) { rights.forEach(k => $(`[data-o="${k}"]`, ans).classList.add('ok')); return good(b); }
        // the wrong ones go out and the right ones stay: pick again
        wrongs.forEach(k => { const w = $(`[data-o="${k}"]`, ans); got.delete(k); w.classList.remove('sel'); w.classList.add('no'); w.disabled = true; again(w).add('shake'); });
        dots();
        await bad(learn ? (wrongs.length === 1 ? 'Una no era. S’ha apagat: tria’n una altra.' : 'Aquestes no eren. S’han apagat: tria’n unes altres.') : 'No eren aquestes!', () => it.oks.forEach(k => $(`[data-o="${k}"]`, ans).classList.add('ok')));
      };
      env.hint = () => { const k = it.oks.find(k => !got.has(k)); glow($(`[data-o="${k}"]`, ans)); return it.ctx && it.s !== undefined ? 'La que brilla és una de les paraules clau: és a la frase que brilla al text.' : 'La que brilla és una de les bones.'; };
    }

    /* --- the new trials (proves.js) --- */
    else {
      const c = { ans, q, t, learn, openAt, W, H, good, bad, again, spark, blip, up, point, tip: env.tip, streakBreak, isDone: () => done,
        stages: () => compassHtml(-1, { tap: true, grid: W.ok }), key: f => { keyFn = f; }, hint: f => { env.hint = f; }, mark: (ev, cls) => markEv(ev, cls),
        clearMarks: () => document.querySelectorAll('#ctx .mark, #ctx .glow').forEach(e => e.classList.remove('mark', 'glow')),
        say: text => { if (prog.so && voiced()) speak(text); },
        set onStage(f) { onStage = f; } };
      playNew(it, c);
    }
  });
}

/* ---------- the frame of a level, the Piscina, an exam, a sheet ---------- */
function coachHtml() { return `<div class="coach" id="coach">${FROG}<p class="status tip" id="tip" role="status" aria-live="polite"></p></div>`; }
function tipper() {
  return (txt, cls = '') => { const e = $('#tip'); if (!e) return; e.className = 'status tip ' + cls; e.innerHTML = `<span>${txt}</span>`; again($('#coach')); $('#coach').className = 'coach ' + cls; };
}
const dotsHtml = (n, label) => `<span class="steps" id="dots" role="img" aria-label="${label}">${'<i></i>'.repeat(n)}</span>`;
const paintDots = (k, run) => [...$('#dots').children].forEach((d, j) => { d.className = j === k ? 'cur' : run[j] === true ? 'ok' : run[j] === false ? 'late' : ''; });
const stageHtml = () => `<div class="stage" id="stage"><div id="ctx"></div><div id="q"></div></div>`;
// the env of the levels and the Piscina: a slip lowers the stars, a right answer grows the run and the frog says why it was right
function learnEnv(t, tip, onSlip) {
  return { t, mode: 'learn', tip,
    slip: msg => { onSlip(); buzz(); streakBreak(); tip(msg, 'oops'); },
    right: (it, s) => { if (!s) streakUp(); blip(up(Math.min(streak, 12) + 4)); setTimeout(() => blip(up(Math.min(streak, 12) + 6)), 90);
      const why = it.per ? ` <b>${H(it.per)}</b>` : it.k === 'frase' ? ' <b>Aquesta frase ho diu.</b>' : it.k === 'etapa' ? ` <b>${H(ETAPES[it.ok].nom)}: ${H(ETAPES[it.ok].que)}</b>` : '';
      tip(`${pick(HURRAY)}${why}`, 'go'); } };
}

/* ---------- the map ---------- */
const rings = c => `<svg viewBox="-15 -15 30 30" aria-hidden="true"><circle r="12" fill="hsl(${RING[c]} 58% 42%)" stroke="#E9B949" stroke-width="2"/><text y="4.5" text-anchor="middle" font-size="12" font-weight="800" fill="#FFF8E6">${c}</text></svg>`;
const M = cursusMap({ prog: () => prog, L: { PROJECTS, CIRCLES, VALID, noteOf, isOpen, examOpen, reached, badges }, OPEN, field: 'lv' });
let here = -1;
function mapa() {
  fresh(); show('El mapa de la brúixola', false, 200);
  const m = meuOf(prog), lit = validated(prog).length, mapRoot = pane3d('44vh');
  worldState(); W.go('map'); W.home();
  W.onPick = (kind, key) => {
    if (kind === 'proj' && (OPEN || isOpen(prog, circleOf(+key)))) level(+key, M.nextLevel(+key));
    else if (kind === 'stage') { const E = ETAPES[+key]; W.needle(+key); blip(up(+key + 3)); toast(`<span aria-hidden="true">${E.icona}</span> <b>${H(E.nom)}</b>`); }
  };
  M.screen({ root: mapRoot, here, rings, ringCls: c => ` r${c}`, icon: i => `<span class="pi" aria-hidden="true">${PROJECTS[i].icon}</span>`, pp: true,
    before: `<div class="hero">${FROG}<p class="bubble">${lit >= PROJECTS.length ? 'Tens la brúixola d’or: saps on ets a cada projecte!' : 'Un projecte de classe és un camí de <b>sis etapes</b>. Aquí aprens a saber <b>on sou</b>, <b>què toca fer</b> i <b>què dir</b>.'}</p></div>
      <button class="card meuc" id="meub"><span class="ci" aria-hidden="true">🧭</span><b>El meu projecte</b>${m.nom ? `<span class="mk">${H(m.nom)}</span><span class="mstage" style="--h:${ETAPES[m.etapa].hue}">${ETAPES[m.etapa].icona} ${H(ETAPES[m.etapa].nom)}</span>` : '<span>Posa-hi el projecte de la teva classe i marca on sou</span>'}</button>
      ${prog.ratxa ? `<p class="grow">🔥 Rècord de ratxa: ${prog.ratxa} encerts seguits</p>` : ''}`,
    foot: got => `\n    <div class="extra"><button class="btn soft" id="full"${OPEN || validated(prog).length ? '' : ' disabled title="Valida un projecte per obrir-lo"'}>Caça l'errada</button>
      ${badgeList(BADGES, got)}</div>`,
    open: i => level(i, M.nextLevel(i)), exam: examen, on: [['#full:not(:disabled)', full], ['#meub', meu]] });
  here = -1;
}

/* ---------- the Piscina: three short rounds to learn the buttons ---------- */
const POOL_TIP = [
  'Hola! Soc la granota de la brúixola. Mira les sis etapes d’un projecte i després posa-les en ordre.',
  'Ara, la brúixola: llegeix què passa a classe i toca l’etapa. Si t’equivoques, hi pots tornar.',
  'I la lupa: llegeix què vol saber el projecte i toca la frase del text que ho diu.'];
function piscina() {
  const t = fresh(); show('La Piscina', true, 200); $('#toM').hidden = true; $('#toG').hidden = !HUB; worldState();
  pane3d('30vh').innerHTML = `<div class="hud mid">${dotsHtml(POOL.length, 'Tres jocs')}<span class="combo" id="cb" hidden></span></div>${coachHtml()}${stageHtml()}`;
  const tip = tipper(), run = [];
  shown = null;
  (async () => {
    for (let k = 0; k < POOL.length; k++) {
      paintDots(k, run);
      const env = learnEnv(t, tip, () => {}), items = pool(k, Math.random);
      for (let j = 0; j < items.length; j++) {
        before(items[j]);
        const p = ask(items[j], env);
        if (j === 0) tip(POOL_TIP[k]);
        await p; if (!t.on) return;
      }
      run[k] = true; fanfare(); FX.celebrate(8); setCtx(null);
    }
    paintDots(-1, run);
    const r = poolIn(prog); prog = r.prog; save();
    $('#ctx').innerHTML = $('#q').innerHTML = '';
    tip('Fantàstic! Ja saps jugar. Al mapa hi ha els projectes i, a dalt, la brúixola del projecte de la teva classe.', 'go'); fanfare(); FX.celebrate(16);
    await sleep(3000); if (t.on) mapa();
  })();
}

/* ---------- one level of a project ---------- */
function level(sec, idx) {
  const c = circleOf(sec), t = fresh(); show(`Cercle ${c} · ${PROJECTS[sec].name}`, true, HUES[sec]); here = sec;
  const root = pane3d('30vh'), Lv = PROJECTS[sec].levels[idx], R = round(sec, idx, Math.random);
  worldState();
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
  const run = [];
  (async () => {
    for (let k = 0; k < R.items.length; k++) {
      paintDots(k, run);
      before(R.items[k]);
      const p = ask(R.items[k], env);
      if (k === 0) tip(PRIMER[sec]);
      const res = await p; if (!t.on) return;
      run[k] = res.ok;
    }
    paintDots(-1, run);
    win();
  })();

  async function win() {
    const r = levelIn(prog, sec, idx, slips), n = r.n, end = idx === 9;
    over = true; keyFn = null; prog = r.prog; save();
    fanfare(); FX.celebrate(end || r.valid ? 16 : 8);
    worldState(); W.reward(sec, { valid: r.valid });
    await sleep(500); if (!t.on) return;
    const stage = $('#stage');
    panel(stage, `<h2>${r.valid ? 'Projecte validat!' : end ? 'Projecte acabat!' : pick(HURRAY)}</h2>
      <p class="line2">${H(Lv.title)}</p><p class="won" role="img" aria-label="${n} de 3 estrelles">${starRow(n)}</p>
      <p class="lead${r.valid ? ' go' : ''}">Nota del projecte: ${r.note} de 100${r.valid ? ' · validat ✓' : ''}${r.gain ? ` · +${r.gain} XP` : ''}</p>
      ${r.exam ? `<p class="lead go">S'ha obert l'examen del cercle ${c}.</p>` : ''}${news(r.news)}
      ${r.exam || r.news.length || r.valid ? '' : `<p class="lead">${n === 3 ? 'Ni un sol error: 10 punts!' : `Aquest nivell dona ${POINTS[n]} punts. Sense errors ni pistes en dona 10.`}</p>`}
      <button class="btn" id="nx">${end ? 'Torna al mapa' : 'Nivell següent'}</button>${n < 3 ? '<button class="link" id="ag">Torna-hi</button>' : ''}`);
    stage.querySelector('.panel').scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' });
    $('#nx').onclick = () => end ? mapa() : level(sec, idx + 1);
    if (n < 3) $('#ag').onclick = () => level(sec, idx);
  }
}

/* ---------- the exam of a circle: six questions, one try each, no hints ---------- */
function examen(c) {
  const t = fresh(); show(`Examen del cercle ${c}`, true, RING[c]); streakBreak();
  const qs = exam(c, Math.random), run = [];
  worldState();
  pane3d('30vh').innerHTML = `<div class="hud mid">${dotsHtml(qs.length, 'Sis preguntes')}<span class="chip" id="qn"></span></div>${coachHtml()}${stageHtml()}`;
  const tip = tipper();
  const env = { t, mode: 'exam', tip, slip: () => {}, right: () => { chime([523, 659, 784]); FX.celebrate(4); tip('Correcte!', 'go'); } };
  shown = null;
  (async () => {
    for (let k = 0; k < qs.length; k++) {
      paintDots(k, run); $('#qn').textContent = `${k + 1} de ${qs.length} · ${PROJECTS[qs[k].p].name}`;
      before(qs[k]);
      const p = ask(qs[k], env);
      tip(k ? 'Següent pregunta. Només hi ha un intent!' : 'Examen! Sis preguntes i un sol intent cada una.');
      run[k] = (await p).ok; if (!t.on) return;
    }
    paintDots(-1, run);
    const r = examIn(prog, c, qs, run), first = r.good && !prog.exams[c]; prog = r.prog; save();
    $('#ctx').innerHTML = $('#q').innerHTML = ''; $('#qn').hidden = true;
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    tip(r.good ? 'Examen superat!' : 'Examen acabat. Mira què cal repassar.', r.good ? 'go' : '');
    if (r.good) FX.celebrate(16);
    worldState(); if (first) W.flag(c); else W.go('map');
    panel($('#stage'), `<h2>${r.score} de ${qs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? `Superat ✓${r.gain ? ` · +${r.gain} XP` : ' · 0 XP: ja el tenies superat.'}` : r.score >= EXAM_PASS ? "Molt bé! Però l'examen només compta amb tots els projectes del cercle validats." : `Per superar l'examen calen ${EXAM_PASS} de ${qs.length}.`}</p>
      ${first && c < CIRCLES.length - 1 ? `<p class="lead go">S'ha obert el cercle ${c + 1}.</p>` : ''}
      ${r.redo.length ? `<p class="lead">Per repassar: ${list(r.redo.map(i => PROJECTS[i].name))}.</p>` : ''}${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Un altre examen</button>`);
    $('#bk').onclick = () => mapa(); $('#rp').onclick = () => examen(c);
  })();
}

/* ---------- «Caça l'errada»: three notes on the card about a text; from none to two are wrong ---------- */
function full() {
  const t = fresh(); show("Caça l'errada", true, 40); streakBreak();
  const S = sheet(Math.random), cs = S.claims, run = [];
  W.scene(2);
  pane3d('26vh').innerHTML = `<div class="hud mid">${dotsHtml(cs.length, 'Tres notes')}</div>${coachHtml()}${stageHtml()}`;
  shown = null; setCtx(S.text);
  const tip = tipper();
  let k = -1, C, busy = true, res = null, openAt = 0;
  function arm() {
    k++; C = cs[k]; busy = false; openAt = performance.now() + SETTLE; paintDots(k, run);
    window.__bruixola = { sheet: S, claim: C };
    $('#ctx').querySelectorAll('.mark').forEach(e => e.classList.remove('mark'));
    $('#q').innerHTML = `<div class="qcard"><p class="ask">${H(C.q)}</p><p class="inst">A la fitxa del grup hi diu:</p><p class="claimbox">«${H(C.says)}»</p>
      <div class="opts two" id="tail"><button class="btn" id="yes">És correcta</button><button class="btn soft" id="no">Té una errada</button></div></div>`;
    tip(k ? 'Següent nota. Mira-la al text!' : 'Llegeix el text. Després mira les notes de la fitxa: diuen el que diu el text?');
  }
  async function answer(ok, said) {
    const last = k === cs.length - 1;
    busy = true; run[k] = ok; paintDots(k, run);
    if (last) { res = sheetIn(prog, run); prog = res.prog; save(); }
    for (const b of $('#q').querySelectorAll('button')) b.disabled = true;
    markEv([C.s]);
    if (ok) { tip(said, 'go'); chime([523, 659, 784]); FX.celebrate(6); } else { tip(said, 'oops'); buzz(); }
    await sleep(ok ? 1700 : 3200); if (!t.on) return;
    last ? finish() : arm();
  }
  function finish() {
    const r = res, bad = cs.flatMap((c, i) => c.says !== c.real ? [`la ${i + 1} (és «${c.real}»)`] : []);
    $('#q').innerHTML = ''; paintDots(-1, run);
    r.good ? fanfare() : click(196, 0, 0.5, 0.12, 'triangle');
    tip(r.good ? 'Fitxa perfecta!' : 'Fitxa acabada.', r.good ? 'go' : '');
    panel($('#stage'), `<h2>${cs.length - r.missed.length} de ${cs.length}</h2>
      <p class="lead${r.good ? ' go' : ''}">${r.good ? (r.gain ? `Fitxa perfecta ✓ · +${r.gain} XP` : 'Fitxa perfecta ✓ · 0 XP: valida més projectes per sumar-ne.') : 'Per sumar XP cal encertar les tres.'}</p>
      <p class="lead">${bad.length ? `Tenien una errada: ${H(list(bad))}.` : 'Totes tres eren correctes.'}</p>${news(r.news)}
      <button class="btn" id="bk">Torna al mapa</button><button class="link" id="rp">Una altra fitxa</button>`);
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
      tip('Ben vist! Ara tria la nota bona.', 'go');
    } else if ('v' in b.dataset) { const ok = C.opts[+b.dataset.v] === C.real; answer(ok, ok ? `Arreglada: «${H(C.real)}»` : `No era aquesta. La bona és: «${H(C.real)}»`); }
  };
  arm();
}

/* ---------- «El meu projecte»: the compass of the real class project, to know where we are and what I can do today ---------- */
function meu() {
  const t = fresh(); show('El meu projecte', true, 190);
  const root = pane3d('26vh');
  { const e = meuOf(prog).etapa; W.visit(e); }
  let m = meuOf(prog);
  const keep = (next, say) => { const r = meuIn(prog, next); prog = r.prog; m = meuOf(prog); save(); if (r.news.length) toast(`★ <b>${H(list(r.news))}</b>`); if (say) tip(say, 'go'); };
  root.innerHTML = `${coachHtml()}<div class="meu" id="meu"></div>`;
  const tip = tipper();
  function paint() {
    const E = ETAPES[m.etapa], nxt = ETAPES[m.etapa + 1];
    $('#meu').innerHTML = `<div class="meuname"><label for="nom">El projecte de la meva classe</label>
        <div class="row"><input id="nom" maxlength="40" autocomplete="off" placeholder="Com es diu? (Els volcans, L'hort…)" value="${H(m.nom)}"><button class="btn soft" id="desa">Desa</button></div></div>
      <h2 class="onsom">On som?</h2><p class="grow">Toca l'etapa on és la classe ara. Si no ho saps, pregunta-ho: «En quina etapa som?»</p>
      ${compassHtml(m.etapa, { tap: true })}
      <section class="ecard" style="--h:${E.hue}">
        <h3><span class="pi" aria-hidden="true">${E.icona}</span> ${H(E.nom)} <small>${H(E.curt)}</small>${sayBtn(`${E.nom}. ${E.que} Què puc fer jo: ${E.jo.join('. ')}. Frases que puc dir: ${E.frases.join('. ')}`)}</h3>
        <p class="que">${H(E.que)}</p>
        <div class="cols">
          <div><h4>Què fem en aquesta etapa</h4><ul>${E.fem.map(f => `<li>${H(f)}</li>`).join('')}</ul></div>
          <div><h4>Què puc fer jo avui</h4><ul class="checks">${E.jo.map((j, i) => `<li><label><input type="checkbox" data-j="${i}"${m.fets[m.etapa][i] ? ' checked' : ''}><span>${H(j)}</span></label></li>`).join('')}</ul></div>
          <div><h4>Frases que puc dir</h4><ul class="frases">${E.frases.map(f => `<li><span>«${H(f)}»</span>${sayBtn(f)}</li>`).join('')}</ul></div>
        </div>
        <p class="nextline">${nxt ? `Després ve: <b>${nxt.icona} ${H(nxt.nom)}</b>` : 'És l’última etapa: quan acabi, el projecte s’ha acabat.'}</p>
      </section>
      <div class="extra"><button class="btn soft" id="nou">Projecte nou</button><button class="btn" id="bk">Torna al mapa</button></div>
      <div class="confirm" id="confirm" hidden><p>Es tanca <b>«${H(m.nom || 'aquest projecte')}»</b> i en comença un de nou?</p><div class="opts two"><button class="btn" id="si">Sí, comença</button><button class="btn soft" id="cancel">No</button></div></div>`;
    $('#nom').onkeydown = e => { if (e.key === 'Enter') $('#desa').click(); };
  }
  paint();
  tip(m.nom ? `Aquesta és la brúixola de «${H(m.nom)}». Quan la classe canviï d'etapa, toca-la aquí.` : 'Escriu com es diu el projecte que feu a classe i marca en quina etapa sou.');
  root.onclick = e => {
    if (!t.on) return;
    const pt = e.target.closest('.compass .pt');
    if (pt) { const en = +pt.dataset.e; if (en !== m.etapa) { W.visit(en); keep({ ...m, etapa: en }, `Som a «${ETAPES[en].nom}». ${ETAPES[en].que}`); paint(); blip(up(en + 3)); spark($('.compass .pt.on', root), ETAPES[en].hue); } return; }
    if (e.target.closest('#desa')) { const nom = $('#nom').value.trim().slice(0, 40); keep({ ...m, nom }, nom ? `Desat: «${H(nom)}». Ara toca l'etapa on sou.` : 'Nom esborrat.'); paint(); return; }
    if (e.target.closest('#nou')) { $('#confirm').hidden = false; $('#si').focus(); return; }
    if (e.target.closest('#cancel')) { $('#confirm').hidden = true; return; }
    if (e.target.closest('#si')) { const r = meuNou(prog, ''); prog = r.prog; m = meuOf(prog); save(); paint(); tip('Projecte nou. Escriu com es diu i comencem pel punt de partida.', 'go'); $('#nom').focus(); return; }
    if (e.target.closest('#bk')) mapa();
  };
  root.onchange = e => {
    const cb = e.target.closest('input[data-j]'); if (!cb || !t.on) return;
    const fets = m.fets.map(a => a.slice()); fets[m.etapa][+cb.dataset.j] = cb.checked;
    keep({ ...m, fets }); if (cb.checked) { blip(up(8)); spark(cb, ETAPES[m.etapa].hue); }
  };
}

soBtn(); paintXp();
prog.piscina || OPEN ? mapa() : piscina();
