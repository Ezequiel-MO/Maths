# Maths

Jocs de l'estany: small maths and logic games for children, in Catalan. Live at https://ezequiel-mo.github.io/Maths/.

## Run it

```sh
npm install
npm run dev      # the site with live reload
npm run build    # checks the games' totals, then builds the site into dist/
npm run preview  # serves dist/ as it will be published
```

A push to `main` builds and publishes the site through `.github/workflows/pages.yml`.

## Where things are

- `index.html` and `hub/`: the home page, one card per game.
- `<game>.html` and `games/<game>/`: one page per game. `logic.js` is the game's rules and data, with no page in it;
  `main.js` is its screens; `style.css` is what only this game looks like.
- `shared/`: what the games have in common.
  - `base.css`: the palette, the page and the small pieces every game uses.
  - `fx.js`: the two canvases, the sky behind and the sparks in front. `audio.js`: the notes.
  - `sections.js` and `sections.css`: the menu of sections and the row of levels, for the games made of sections of ten levels.
  - `progress.js`: the only door to what a player has saved.
  - `games.js`: the list of games the home page shows.

## Add a game

1. Make `games/<id>/` with its `main.js` and `style.css` (start the stylesheet with `@import "../../shared/base.css";`),
   and `<id>.html` at the root, copied from another game's page.
2. Keep its progress with `load(id)` and `save(id, data)` from `shared/progress.js`. What a game saves must be numbers that only grow, booleans that only turn true, and lists of those, with no list inside a list; `so` is the only preference.
3. Add its card to `shared/games.js`. If the card states a total, add where it comes from to `scripts/check.mjs`.
