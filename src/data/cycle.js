export const CYCLE_NODES = [
  { id: 'goal', name: 'Постановка' },
  { id: 'plan', name: 'План' },
  { id: 'build', name: 'Исполнение' },
  { id: 'check', name: 'Проверка' },
  { id: 'debug', name: 'Отладка' },
  { id: 'review', name: 'Ревью' },
];

export const CYCLE_EDGES = [
  { from: 'goal', to: 'plan' },
  { from: 'plan', to: 'build' },
  { from: 'build', to: 'check' },
  { from: 'check', to: 'review' },
  { from: 'check', to: 'debug', isLoop: true },
  { from: 'debug', to: 'build', isLoop: true },
];

export const VERDICT_NO = 'no';
export const VERDICT_YES = 'yes';

export const CYCLE_FRAMES = [
  { node: 'goal', text: 'Цель измеримая: компонент рендерит три состояния, тесты зелёные, tsc чистый.' },
  { node: 'plan', text: 'Агент сначала задаёт вопросы про состояния, API и крайние случаи. План пишется так, будто его исполнит джун без контекста.' },
  { node: 'build', text: 'Один вертикальный срез и маленький PR. Следующий срез начинается в новой сессии.' },
  { node: 'check', verdict: VERDICT_NO, text: 'Тест упал. Это рабочий исход: «готово» говорит тот, кто мог сказать «нет».' },
  { node: 'debug', text: 'Сначала стектрейс, падающий тест или шаги воспроизведения. Если причина неочевидна, 2–3 гипотезы и что опровергнет каждую.' },
  { node: 'build', text: 'Правка возвращается в тот же срез.' },
  { node: 'check', verdict: VERDICT_YES, text: 'На каждый критерий есть команда и её вывод. «Все тесты зелёные» конкретный критерий не доказывает.' },
  { node: 'review', text: 'Человек смотрит контракт: что задумано, API, инварианты, доступы.' },
];
