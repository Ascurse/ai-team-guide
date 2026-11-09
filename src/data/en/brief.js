// Переводится на месте. id, URL, теги и порядок обязаны совпадать с ../brief.js: это проверяет test/i18n.test.mjs
import { briefPromptFor } from '../logic.js';

export const BRIEF_BASE = 'A picture about an office move.';

// Порядок и текст совпадают с тем, что ушло в генерацию
export const BRIEF_PARTS = [
  { id: 'goal', bit: 1, label: 'The goal and why', text: 'It goes into an email to employees: the move is on December 1, and people need to pack their things calmly and ahead of time, without anxiety.' },
  { id: 'done', bit: 2, label: 'Done criterion', text: 'Done if: one main subject, a cardboard box of belongings, a calm empty background, no people and no text.' },
  { id: 'example', bit: 4, label: 'An example instead of a description', text: 'Style as in the attached sample.' },
];

// Индекс массива равен маске из BRIEF_PARTS
export const BRIEF_RESULTS = [
  {
    note: 'The model decided everything: a photo, people, a van, lettering on the boxes. You made none of these decisions.',
    alt: 'Photo: people carry boxes through an office, a van stands at the entrance, the boxes are lettered in Russian "Office move".',
  },
  {
    note: 'The model understood the audience: a date and tips for employees appeared. It also added a poster and a cat, because there were no limits.',
    alt: 'Photo: a box of belongings with a cat asleep beside it; on the wall, a poster in Russian saying "We are moving to a new office!" with the date December 1.',
  },
  {
    note: 'The criterion is met: one box, an empty background, no people, no text. The model chose the style on its own.',
    alt: 'Photo: an open cardboard box with a plant and folders on an empty light background.',
  },
  {
    note: 'Almost the same as without the goal. The criterion already set the frame, and the goal has nothing to change here.',
    alt: 'Photo: an open cardboard box with a plant and notebooks on an empty light background.',
  },
  {
    note: 'The style carried over, the scene is again up to the model: the people and the van came back.',
    alt: 'Flat geometric illustration: people carry things to a van between two buildings.',
  },
  {
    note: 'The goal and the style together produced a poster with a date. Nobody forbade text, so it is there, and so is the cat.',
    alt: 'Flat illustration: a heading in Russian saying "Office move", the date December 1 in Russian, a desk lamp, a box, and a cat.',
  },
  {
    note: 'The lamp from the sample got into the frame: a sample passes on not only the style but also the objects. If you do not want them, say so.',
    alt: 'Flat illustration: an open box with folders and a plant, and above it a desk lamp from the sample.',
  },
  {
    note: 'Everything together: a box, an empty background, the style of the sample, no people and no lettering. The lamp stayed, because nobody mentioned it.',
    alt: 'Flat illustration: an open box with books and a plant, next to it a desk lamp from the sample.',
  },
];

export const briefPrompt = briefPromptFor(BRIEF_BASE, BRIEF_PARTS);

export { briefFile, briefMask } from '../brief.js';
