// Songs to rehearse: the ones a child is learning away from the game, played here with the tubes, the notes in colour with their
// names, and the metronome. No stars and no marks: the top of the map has a button for each song that has its notes.
// A song is cut into its phrases, each one written like a tune of logic.js: '0n 2b sn', the step of the scale (0 Do … 7 Do agut) and the
// figure, or a rest on its own; a '|' between bars is only there for whoever reads it. beats is the beats of a bar.
import { FIGS } from './logic.js';

const tune = s => s.split(' ').filter(x => x && x !== '|').map(x => FIGS[x] ? [null, x] : [+x[0], x.slice(1)]);

// Ximpleries, of the Conte de Nadal after Dickens: the phrases go in once its score is here
const RAW = [
  { title: 'Ximpleries', from: 'Conte de Nadal', beats: 4, phrases: [] }
];

export const SONGS = RAW.filter(s => s.phrases.length).map(s => ({ ...s, phrases: s.phrases.map(tune) }));
