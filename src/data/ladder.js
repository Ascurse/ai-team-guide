import { PRICES, money, simulate } from '../lib/sim.js';

// Всё здесь повторяет гайд: test/ladder.test.mjs сверяет числа с его текстом
export const LADDER = [
  { id: 'GPT-6 Luna', name: 'Luna', use: 'Однотипный объём: извлечение, классификация, резюме по шаблону, точечный код', speed: 'высокая', made: 79.3, index: null },
  { id: 'GPT-6.1 Terra', name: 'Terra', use: 'Понятный текст, чтение графиков и скриншотов, работа в приложениях', speed: 'высокая', made: 34.5, index: null },
  { id: 'GPT-6.1 Sol', name: 'Sol', use: 'Сложная долгая работа с кодом, приложениями и документами, почти уровень Astra', speed: 'средняя', made: 51.9, index: 54.5 },
  { id: 'GPT-6 Astra', name: 'Astra', use: 'Самая трудная работа от начала до конца, где нужны рассуждение и суждение', speed: 'самая низкая', made: 49.8, index: 56.9 },
];

export const EFFORT = [
  { level: 'low', gain: 0 },
  { level: 'medium', gain: 17 },
  { level: 'high', gain: 6 },
  { level: 'max', gain: 4 },
];

export const SESSION_TURNS = 30;
const METRICS = {
  session: (m) => simulate(SESSION_TURNS, {}, PRICES[m.id]).at(-1).total,
  made: (m) => m.made,
  index: (m) => m.index,
};
const LABELS = { session: money, made: (v) => `${v}%`, index: String };

export function ladderBars(metric) {
  const values = LADDER.map(METRICS[metric]);
  const top = Math.max(...values);
  return LADDER.map((model, i) => ({
    id: model.id,
    name: model.name,
    label: values[i] === null ? 'нет данных' : LABELS[metric](values[i]),
    share: values[i] === null ? 0 : values[i] / top,
  }));
}

export const effortGainTo = (level) => {
  const end = EFFORT.findIndex((step) => step.level === level);
  return EFFORT.slice(0, end + 1).reduce((sum, step) => sum + step.gain, 0);
};
