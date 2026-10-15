// What a saved game gives, kept. For every game a fixed set of saves (empty, garbage, the shapes of the old games, full ones made at random)
// goes through clean() and every function of the progress (the marks, the circles, the badges, what a level, an exam, a sheet or a record
// adds) and through the questions an exam, a sheet or a lightning round draws. The fingerprint of every answer must be the one written in
// scripts/golden.json: a change that makes a child's save read differently (a level lost, a mark that moves, an exam shut again) fails
// the build. Chance is seeded, Math.random too, so the same code always gives the same answers.
//   node scripts/check-golden.mjs            the check (part of npm run check)
//   node scripts/check-golden.mjs --write    writes golden.json anew: only when a change of what a save gives is wanted
//   DUMP=<game>:<name> node scripts/check-golden.mjs   prints every answer of one function, to compare two versions of the code
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url), FILE = new URL('scripts/golden.json', ROOT);
const WRITE = process.argv.includes('--write'), DUMP = process.env.DUMP;

// mulberry32: a small seeded generator, the same numbers on every machine
const seeded = s => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const hashOf = s => createHash('sha1').update(s).digest('hex').slice(0, 16);
const RANDOM = Math.random;

// a value as text, with what JSON drops kept (NaN, undefined, sets)
const text = v => JSON.stringify(v, (k, x) => x === undefined ? '~undef' : typeof x === 'number' && !Number.isFinite(x) ? `~${x}` : x instanceof Set ? { set: [...x] } : typeof x === 'function' ? `~fn${x.length}` : x);

/* ---------- the saves ---------- */
// every field any game keeps or ever kept, and what a value in it may look like
const ODD = [-1, 1.5, 2.7, NaN, Infinity, '2', null, true, undefined, {}];
const FIELDS = {
  lv: ['arr', 3], stars: ['arr', 3], secs: ['arr', 10], notes: ['arr', 100], exams: ['bools'],
  piscina: ['bool'], so: ['bool'], fulls: ['num', 30], rapid: ['num', 40], ratxa: ['num', 40], mosques: ['num', 700],
  best: ['num', 900], coet: ['num', 25], equip: ['num', 3], probs: ['num', 30], savi: ['num', 30]
};
function rawSave(r) {
  const int = n => Math.floor(r() * (n + 1)), odd = () => ODD[int(ODD.length - 1)];
  const num = hi => r() < 0.1 ? odd() : int(hi);
  const o = {};
  for (const [k, [kind, hi]] of Object.entries(FIELDS)) {
    if (r() < 0.45) continue;
    if (kind === 'arr') o[k] = r() < 0.05 ? odd() : Array.from({ length: [0, 5, 9, 10, 12, 30, 60, 90, 120][int(8)] }, () => r() < 0.4 ? 0 : num(hi));
    else if (kind === 'bools') o[k] = Array.from({ length: int(7) }, () => r() < 0.08 ? odd() : r() < 0.5);
    else if (kind === 'bool') o[k] = r() < 0.08 ? odd() : r() < 0.5;
    else o[k] = num(hi);
  }
  return o;
}
const FIXED = [undefined, null, [], 5, 'x', {}, { so: false }, { piscina: true }];
const SAVES = [...FIXED, ...Array.from({ length: 150 }, (_, i) => rawSave(seeded(1000 + i)))];

/* ---------- the functions of the progress, and what to call them with ---------- */
const PROGRESS = ['clean', 'xpOf', 'levelText', 'badges', 'isOpen', 'examOpen', 'noteOf', 'reached', 'validated', 'passed', 'begun', 'medals',
  'starsFor', 'circleOf', 'exOf', 'mark', 'firstTry', 'levelIn', 'examIn', 'sheetIn', 'poolIn', 'rapidIn', 'streakIn', 'fliesIn', 'freeIn',
  'handIn', 'roundIn', 'exam', 'sheet', 'sprint'];
const params = f => {
  const s = f.toString(), m = s.match(/^(?:async\s+)?(?:function\s*[\w$]*\s*)?\(([^)]*)\)/) || s.match(/^([\w$]+)\s*=>/);
  return m ? m[1].split(',').map(x => x.trim().split('=')[0].trim()).filter(Boolean) : [];
};

async function game(id) {
  const L = await import(new URL(`games/${id}/logic.js`, ROOT));
  const out = {}, dump = DUMP?.startsWith(id + ':') ? DUMP.slice(id.length + 1) : null;
  const add = (name, v) => { (out[name] ??= []).push(v); if (dump === name) console.log(v); };
  // the values the game exports: its projects, circles, badges and numbers
  for (const [k, v] of Object.entries(L)) if (typeof v !== 'function') add('=' + k, text(v));
  const nP = L.PROJECTS?.length || 1, nC = L.CIRCLES?.length || 1;
  SAVES.forEach((raw, s) => {
    const r = seeded(7 * s + 1), int = n => Math.floor(r() * (n + 1));
    const call = (name, args) => {
      Math.random = seeded(31 * s + name.length);
      try { add(name, text([args.map(text), L[name](...args)])); } catch (e) { add(name, 'ERR ' + e.message); } finally { Math.random = RANDOM; }
    };
    let p;
    try { p = L.clean(raw === undefined ? undefined : structuredClone(raw)); add('clean', text(p)); } catch (e) { add('clean', 'ERR ' + e.message); return; }
    for (const name of PROGRESS) {
      if (name === 'clean' || typeof L[name] !== 'function') continue;
      const names = params(L[name]);
      // three calls each, with arguments drawn for the names the function gives them
      for (let k = 0; k < 3; k++) {
        const c = int(nC), i = int(nP - 1), rnd = seeded(97 * s + k);
        const args = names.map(n => {
          if (n === 'p') return p;
          if (n === 'c' || n === 'circle') return c;
          if (n === 'i') return i;
          if (n === 'idx') return int(9);
          if (n === 'slips') return int(4);
          if (n === 'rnd') return rnd;
          if (n === 'qs') { try { Math.random = seeded(s); return L.exam ? L.exam(Math.min(c, nC - 1), seeded(s)) : []; } finally { Math.random = RANDOM; } }
          if (n === 'run') return name === 'handIn' ? Array.from({ length: int(16) }, () => ({ tries: int(2), helped: r() < 0.2 })) : Array.from({ length: name === 'examIn' ? 6 - int(1) : 3 - int(1) }, () => r() < 0.7);
          if (n === 'field') return r() < 0.5 ? 'probs' : 'savi';
          if (n === 'good' || n === 'all' || n === 'lines') return r() < 0.5;
          if (n === 'valid') return L.validated ? L.validated(p) : [];
          if (n === 'ps') return [int(nP - 1)];
          if (n === 'firsts') return int(15);
          if (n === 'r') return { tries: int(2), helped: r() < 0.3 };
          return int(n === 'slips' ? 4 : 600);   // n, hits, score, idx and any other number
        });
        call(name, args);
        if (!names.length) break;
      }
    }
  });
  return out;
}

const ids = readdirSync(new URL('games/', ROOT)).filter(id => existsSync(new URL(`games/${id}/logic.js`, ROOT))).sort();
const now = {};
for (const id of ids) { const o = await game(id); now[id] = Object.fromEntries(Object.entries(o).sort().map(([k, v]) => [k, hashOf(v.join('\n'))])); }

if (WRITE) { writeFileSync(FILE, JSON.stringify(now, null, 1) + '\n'); console.log(`golden: written for ${ids.length} games`); process.exit(0); }
if (DUMP) process.exit(0);
const was = JSON.parse(readFileSync(FILE, 'utf8'));
const bad = [];
for (const id of new Set([...Object.keys(was), ...ids])) for (const k of new Set([...Object.keys(was[id] || {}), ...Object.keys(now[id] || {})]))
  if (was[id]?.[k] !== now[id]?.[k]) bad.push(`${id} ${k}: ${was[id]?.[k] ? now[id]?.[k] ? 'gives other answers' : 'is gone' : 'is new'}`);
if (bad.length) { console.error('golden: what a save gives has changed\n  ' + bad.join('\n  ')); process.exit(1); }
console.log(`golden: ${ids.length} games, ${SAVES.length} saves each, the same answers as before`);
