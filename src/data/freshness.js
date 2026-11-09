// Единственное место с датой данных: меняется здесь при сверке цен и бенчмарков
export const DATA_DATE = '2026-11-05';

const LOCALES = { ru: 'ru-RU', en: 'en-US' };
const NOTES = {
  ru: (date) => `Данные на ${date}; могут устареть`,
  en: (date) => `Data as of ${date}; may go out of date`,
};

export function dataNote(lang) {
  const date = new Intl.DateTimeFormat(LOCALES[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(DATA_DATE))
    .replace(/\s*г\.$/, '');
  return NOTES[lang](date);
}
