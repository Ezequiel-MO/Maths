export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = (s, r = document) => r.querySelector(s);
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
// the middle of an element on the screen: where its sparks and rings start
export const mid = e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, bottom: r.bottom }; };
// ?obert at the end of the address opens everything a game keeps shut (circles, exams, levels), to look at any of it;
// the link back to the page of all games keeps it, and that page hands it on to every game
export const OBERT = /[?&]obert(=|&|$)/.test(location.search);
if (OBERT) document.querySelector('#toG')?.setAttribute('href', 'index.html?obert');
