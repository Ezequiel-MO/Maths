import { pentatonic } from '../../shared/audio.js';

export const GRIDS = [3, 4, 5, 6], MINLEN = 2, MAXLEN = 5, LIVES = 3;
// a sequence never lights the same tile twice
export function makeSeq(cells, len, rand = Math.random) {
  const pool = Array.from({ length: cells }, (_, i) => i), out = [];
  while (out.length < len) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}
export const begin = () => ({ lvl: 0, len: MINLEN, lives: LIVES, score: 0, up: false, won: false, over: false });
// one round played: a miss costs a life and keeps the length; a hit grows the series, and after MAXLEN the grid gets finer
export function step(s, ok) {
  if (!ok) { const lives = s.lives - 1; return { ...s, lives, up: false, over: lives <= 0 }; }
  const score = s.score + s.len * (s.lvl + 1) * 10;
  if (s.len < MAXLEN) return { ...s, score, len: s.len + 1, up: false };
  if (s.lvl === GRIDS.length - 1) return { ...s, score, up: false, won: true, over: true };
  return { ...s, score, lvl: s.lvl + 1, len: MINLEN, up: true };
}
// colour and pitch follow the position: green and low at the bottom left, pink and high at the top right
export const hueOf = (r, c, n) => Math.round(140 + (n - 1 - r + c) / (2 * (n - 1)) * 200);
const scale = pentatonic(261.63);
export const pitchOf = (r, c, n) => scale(n - 1 - r + c);
