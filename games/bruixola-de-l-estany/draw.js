// The pictures of the compass game: the frog with its compass, and the rose behind the six stages.
export const FROG = `<svg class="frog" viewBox="-42 -60 84 90" aria-hidden="true"><ellipse cx="0" cy="25" rx="30" ry="5" fill="rgb(0 0 0 / 0.3)"/>
  <path d="M-25 16q-10-1-8-9q7 2 11 6ZM25 16q10-1 8-9q-7 2-11 6Z" fill="#2F7F40"/>
  <ellipse cx="0" cy="-2" rx="26" ry="22" fill="#4FB562" stroke="#2F7F40" stroke-width="2"/><ellipse cx="0" cy="7" rx="16" ry="11" fill="#D9F5C8"/>
  <circle cx="-12" cy="-25" r="10.5" fill="#fff" stroke="#2F7F40" stroke-width="2"/><circle cx="12" cy="-25" r="10.5" fill="#fff" stroke="#2F7F40" stroke-width="2"/>
  <circle class="eye" cx="-11" cy="-23" r="4.2" fill="#0F3A40"/><circle class="eye" cx="13" cy="-23" r="4.2" fill="#0F3A40"/><circle cx="-9.5" cy="-25" r="1.4" fill="#fff"/><circle cx="14.5" cy="-25" r="1.4" fill="#fff"/>
  <path d="M-8 -9Q0 -4 8 -9" fill="none" stroke="#1C5A3C" stroke-width="2.4" stroke-linecap="round"/>
  <g class="disc"><circle cx="0" cy="14" r="12" fill="#F7C64E" stroke="#B88A3A" stroke-width="2"/><circle cx="0" cy="14" r="8.5" fill="#FFF8E6" stroke="#B88A3A" stroke-width="1.2"/>
    <path class="hand" d="M0 14L-3 17L0 6L3 17Z" fill="#D2283F"/><circle cx="0" cy="14" r="1.6" fill="#2B2118"/></g>
  <ellipse cx="-17" cy="10" rx="6" ry="4.5" fill="#4FB562" stroke="#2F7F40" stroke-width="1.6"/><ellipse cx="17" cy="10" rx="6" ry="4.5" fill="#4FB562" stroke="#2F7F40" stroke-width="1.6"/></svg>`;

// the rose under the stages: a ring, the six marks and arrows that say which way the path goes (clockwise, like a clock)
export const ROSE = `<svg class="rose" viewBox="-50 -50 100 100" aria-hidden="true">
  <circle r="46" fill="rgb(8 32 44 / 0.5)" stroke="rgb(160 230 220 / 0.25)" stroke-width="1"/>
  <circle r="38" fill="none" stroke="#F7C64E" stroke-width="1.6" stroke-dasharray="3 5" opacity="0.7"/>
  ${[0, 60, 120, 180, 240, 300].map(a => `<g transform="rotate(${a + 30})"><path d="M-2.4 -40.5L0 -35.5L2.4 -40.5Z" fill="#F7C64E"/></g>`).join('')}
  <circle r="4" fill="#F7C64E"/></svg>`;
