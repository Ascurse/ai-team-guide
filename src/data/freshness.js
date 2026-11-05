// Единственное место с датой данных: меняется здесь при сверке цен и бенчмарков
export const DATA_DATE = '2026-11-05';

const dateLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  .format(new Date(DATA_DATE))
  .replace(/\s*г\.$/, '');

export const DATA_NOTE = `Данные на ${dateLabel}; могут устареть`;
