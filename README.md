# Maths

Jocs de l'estany: small maths and logic games for children, in Catalan. Live at https://ezequiel-mo.github.io/Maths/.

## Run it

```sh
npm install
npm run dev      # the site with live reload
npm run build    # runs the checks (npm run check), then builds the site into dist/
npm run preview  # serves dist/ as it will be published
```

A push to `main` builds and publishes the site through `.github/workflows/pages.yml`.

## Where things are

- `index.html` and `hub/`: the home page, one card per game.
- `<game>.html` and `games/<game>/`: one page per game. `logic.js` is the game's rules and data, with no page in it;
  `main.js` is its screens; `style.css` is what only this game looks like.
- `shared/`: the engine, what the games have in common.
  - `curs.js`: the cursus every game is laid out as (Piscina, circles of projects of ten levels, marks, exams, sheets, XP,
    badges). `curs(cfg)` gives the rules of the progress; each `logic.js` gives it its projects, circles and badges and
    exports what it gets back. Also the helpers of numbers and chance (`whole`, `slots`, `at`, `int`, `shuffle`).
  - `shell.js`: the frame of every page: the token of the screen on show (`tokens`), the bar of the level, the sound
    button, `SETTLE` against the double tap, and the small texts the screens repeat.
  - `mapa.js`: the map of the cursus (`cursusMap`): rings, projects, exams, what to do now. A game says how its rings and
    projects look and where each button leads.
  - `scene.js`: the pictures that move. `frames(t, el, frame)` is a loop of animation frames that stops by itself when its
    screen goes; `tween` is a move with a duration; `svgEl` and `fmt` write SVG.
  - `base.css`: the palette, the page, the small pieces and the animations every game uses.
  - `fx.js`: the two canvases, the sky behind and the sparks in front. `audio.js`: the notes.
  - `sections.js` and `sections.css`: the panel over the stage and the row of level buttons.
  - `progress.js`: the only door to what a player has saved (`sync.js` and `cloud.js` keep it in Firestore).
  - `games.js`: the list of games the home page shows.

## The progress of the children

What a child has saved must never be lost by a change of the code. The save keys (`<profile>:<game>`, and the `store` of
`games.js`), the fields each game saves and `clean()` in each `logic.js` (it reads the saves of older versions too) stay as
they are; a new field is added, never renamed. `scripts/check-golden.mjs` runs 158 saves of every game (empty, garbage, old
shapes, full ones) through `clean()` and every function of the progress, and `npm run check` fails when any answer changes.
Only when a change of what a save gives is wanted, `node scripts/check-golden.mjs --write` writes the new answers.

## Add a game

1. Make `games/<id>/` with its `logic.js`, `main.js` and `style.css` (start the stylesheet with
   `@import "../../shared/base.css";`), and `<id>.html` at the root, copied from another game's page (the bar on top is
   `#toG`, `#toM`, `#xp` and `#so`).
2. In `logic.js`, give `curs()` of `shared/curs.js` the projects, circles and badges, and write `clean()`. In `main.js`,
   take the frame from `shared/shell.js` and the map from `shared/mapa.js`; a game that is not a cursus uses only the frame.
3. Keep its progress with `load(id)` and `save(id, data)` from `shared/progress.js`. What a game saves must be numbers that
   only grow, booleans that only turn true, and lists of those, with no list inside a list; `so` is the only preference.
4. Add its card to `shared/games.js`. If the card states a total, add where it comes from to `scripts/check.mjs`. Then
   `node scripts/check-golden.mjs --write` once, so its saves are kept from then on.

## Pictures and libraries

The pictures are SVG written by hand, and a loop of `shared/scene.js` moves them. A game that needs more installs the
library with npm and imports it in its own `main.js` (`npm install three`, `npm install jsxgraph`): Vite builds every page
apart, so only that game's page carries it. Its drawing goes inside `frames(t, el, ...)`, so it stops with its screen.

## Checks

- `npm run check` (before every build, and in CI): the totals of the cards, the deep checks of nenúfars, cursus and àbac,
  the progress and its cloud, the home page, and `check-golden`.
- `scripts/snap-games.mjs` (needs Chrome and playwright-core from outside): writes the HTML of every screen of every game,
  with what is saved under it, to compare two versions of the code. `scripts/flow-abac.mjs` and `sweep-abac.mjs` play l'àbac.
