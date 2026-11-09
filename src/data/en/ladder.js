// Переводится на месте. id, URL, теги и порядок обязаны совпадать с ../ladder.js: это проверяет test/i18n.test.mjs
export const LADDER = [
  { id: 'GPT-6 Luna', name: 'Luna', use: 'Uniform volume: extraction, classification, template summaries, targeted code', speed: 'high', made: 79.3, index: 27.8 },
  { id: 'GPT-6.1 Terra', name: 'Terra', use: 'Clear text, reading charts and screenshots, working in applications', speed: 'high', made: 34.5, index: 51 },
  { id: 'GPT-6.1 Sol', name: 'Sol', use: 'Complex long work with code, applications, and documents, nearly Astra level', speed: 'medium', made: 51.9, index: 54.5 },
  { id: 'GPT-6 Astra', name: 'Astra', use: 'The hardest work from start to finish, where reasoning and judgment are needed', speed: 'lowest', made: 49.8, index: 56.9 },
];

export { EFFORT, SESSION_TURNS, effortGainTo, ladderBars } from '../ladder.js';
