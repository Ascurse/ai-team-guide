import { STRINGS } from './strings.js';

export const LANG = document.documentElement.lang === 'en' ? 'en' : 'ru';
export const T = STRINGS[LANG];
