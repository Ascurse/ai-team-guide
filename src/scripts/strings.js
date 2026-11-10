// Все строки клиентских скриптов. Формы слов считаем здесь же, чтобы скрипты не знали про язык
const ruPlural = (n, one, few, many) => {
  const tens = n % 100;
  const ones = n % 10;
  if (tens > 10 && tens < 20) return `${n} ${many}`;
  if (ones === 1) return `${n} ${one}`;
  return `${n} ${ones > 1 && ones < 5 ? few : many}`;
};
const ruTurns = (n) => ruPlural(n, 'ход', 'хода', 'ходов');
const ruPoints = (n) => ruPlural(n, 'балл', 'балла', 'баллов');
const enPlural = (n, one) => `${n} ${one}${n === 1 ? '' : 's'}`;
const enTurns = (n) => enPlural(n, 'turn');
const enPoints = (n) => enPlural(n, 'point');

export const STRINGS = {
  ru: {
    sim: {
      compactMark: '200K: пора /compact',
      instructions: 'Инструкции',
      schemas: 'Схемы инструментов',
      history: 'История и файлы',
    },
    guess: {
      known: {
        text: 'Столица Франции —',
        words: [['Париж', 97], ['город', 1.5], ['Лион', 0.5], ['Марсель', 0.5], ['не знаю', 0.5]],
        msg: 'Вероятность почти вся на одном слове, ответ стабилен при каждом запуске.',
      },
      unknown: {
        text: 'Наш договор с поставщиком истекает',
        words: [['31 декабря', 24], ['в конце года', 17], ['1 марта', 15], ['30 июня', 14], ['через год', 12], ['1 сентября', 11], ['не знаю', 7]],
        msg: 'Факта нет, вероятности размазаны, и каждый запуск даёт новую дату с той же уверенностью. «Не знаю» надо разрешить явно, а факты дать во входе.',
      },
    },
    picker: {
      tasks: [
        ['Реализация по готовому плану', 'GPT-6.1 Terra', 'medium', 'Основная модель. Effort задайте явно: по умолчанию у Terra low. Запасной вариант: Luna на high.', 'Sonnet или Opus на medium'],
        ['Архитектура, план фичи, неочевидный баг', 'GPT-6.1 Sol', 'high', 'План стоит дороже реализации, поэтому здесь берём сильную модель.', 'Opus, effort high'],
        ['Поиск по коду, быстрые правки, вёрстка по скриншоту', 'GPT-6.1 Terra', 'low или medium', 'Быстрая, и реже всех выдумывает.', 'Субагент на Haiku'],
        ['Извлечение данных из документа', 'GPT-6.1 Terra', 'medium', 'Когда не знает ответа, выдумывает реже всех в линейке.', 'Haiku или Sonnet'],
        ['Массовая рутина и классификация', 'GPT-6 Luna', 'low', 'Только если факты уже во входе или ответ потом проверяется.', 'Haiku, low'],
        ['Sol на high дважды не справился', 'GPT-6 Astra', 'high', 'В разы дороже при почти том же интеллекте. Не на каждый день.', 'Opus, effort high'],
      ],
      sizes: [['Короткая, 10 ходов', 10], ['Обычная, 30 ходов', 30], ['Длинная, 60 ходов', 60]],
      inClaude: (advice) => `В Claude Code: ${advice}.`,
    },
    hero: { play: 'Автоход', stop: 'Стоп' },
    copy: { copied: 'Скопировано', failed: 'Не вышло, выделите текст вручную' },
    tools: { shown: (visible, total) => `Показано ${visible} из ${total}` },
    pack: {
      shown: (visible, total) => `Показано ${visible} из ${total}`,
      empty: 'Ничего не нашлось, попробуйте другое слово',
      emptyCart: 'Отметьте карточки «В мой набор», и здесь появится команда установки только их.',
      cart: (count) => `В наборе ${count}. Команда для Claude Code:`,
    },
    ladder: {
      facts: (speed, input, output) => `Скорость: ${speed}. Цена за 1M: $${input.toFixed(2)} вход, $${output.toFixed(2)} выход.`,
      effortLow: 'Точка отсчёта: быстро и дёшево. Годится, когда думать не о чем.',
      effortMax: (gain) => `+${ruPoints(gain)} к low, но последняя ступень даёт только +4 при расходе до 8× токенов.`,
      effortGain: (gain) => `+${ruPoints(gain)} к low.`,
    },
    delegation: {
      subagent: 'Субагент',
      subagentRole: 'Делает объём: Haiku или Sonnet',
      main: 'Главная сессия',
      mainRole: 'Думает и проверяет: Opus',
      noSubagents: 'Весь шум лежит в главной сессии и читается заново на каждом ходу.',
      overLimit: 'Выше моего лимита. Шесть параллельных прогонов vitest и tsc положили мой ноутбук (10 ядер, 16 GB). Каждый субагент проверяет только свой файл, полный прогон один, в главной сессии.',
      withSubagents: 'В главную сессию приходят только выводы. Перечитайте результат сами: уведомление о прогрессе ещё не результат.',
      yes: 'Делегировать',
      no: 'Не делегировать',
    },
    curve: {
      turns: ruTurns,
      paidBack: (steps) => `Окупился через ${ruTurns(steps)}: дальше каждый ход дешевле.`,
      tooLate: (left) => `До конца всего ${ruTurns(left)}, компакт не успел окупиться.`,
      tooEarly: 'Контекст ещё лёгкий и почти весь из кэша: выжимка стоит дороже, чем сэкономит.',
      axisTurn: (n) => `ход ${n}`,
    },
    spend: {
      none: 'Выводы инструментов занимают большую часть истории, поэтому экономить надо на них.',
      tools: 'Схемы лежат в контексте с первого хода. Набор сужайте до начала сессии, посреди неё смена сбросит кэш.',
      masked: 'Старые выводы скрыты: то же качество вдвое дешевле (один источник).',
      sandbox: 'Скрипт считает вне контекста, в чат приходит ответ. Сырьё остаётся доступно через поиск: ошибку в логе модель должна видеть дословно.',
      asIs: 'Как есть',
      withTricks: 'С приёмами',
    },
    cycle: { step: (current, total) => `Шаг ${current} из ${total}` },
    modelTree: {
      step: (current, total) => `Шаг ${current} из ${total}`,
      prev: 'Назад',
      next: 'Дальше',
      play: 'Проиграть',
      pause: 'Пауза',
      start: 'Старт в полосе:',
      quota: 'Квота кончилась',
      retry: 'Повторить',
      escalate: 'Поднять уровень',
      reset: 'Сначала',
      yes: 'Да, звать Fable',
      no: 'Нет',
      begin: (model) => `Работа идёт на первой строке полосы: ${model}.`,
      onQuota: (from, to) => `Квота кончилась у ${from}. Та же полоса, следующая строка: ${to}.`,
      onRetry: (model) => `Повтор на той же строке: ${model}.`,
      onEscalate: (lane, model) => `Поднимаюсь в полосу ${lane}: ${model}.`,
      needsYes: (model) => `Дальше ${model}. Он дорогой, поэтому нужен мой явный ответ.`,
      declined: (model) => `Остаюсь на строке: ${model}.`,
      stop: 'Строки кончились. Решение за человеком.',
    },
    scene: { compactHint: ': пора /compact', freshHint: ': лучше новая сессия' },
  },
  en: {
    sim: {
      compactMark: '200K: time for /compact',
      instructions: 'Instructions',
      schemas: 'Tool schemas',
      history: 'History and files',
    },
    guess: {
      known: {
        text: 'The capital of France is',
        words: [['Paris', 97], ['a city', 1.5], ['Lyon', 0.5], ['Marseille', 0.5], ['I don’t know', 0.5]],
        msg: 'Almost all the probability sits on one word, so the answer is the same on every run.',
      },
      unknown: {
        text: 'Our contract with the supplier expires',
        words: [['on December 31', 24], ['at the end of the year', 17], ['on March 1', 15], ['on June 30', 14], ['in a year', 12], ['on September 1', 11], ['I don’t know', 7]],
        msg: 'The fact is missing, the probabilities are spread out, and every run gives a new date with the same confidence. Allow “I don’t know” explicitly and put the facts in the input.',
      },
    },
    picker: {
      tasks: [
        ['Implementing a finished plan', 'GPT-6.1 Terra', 'medium', 'The main model. Set effort explicitly: Terra defaults to low. Fallback: Luna on high.', 'Sonnet or Opus on medium'],
        ['Architecture, feature planning, a non-obvious bug', 'GPT-6.1 Sol', 'high', 'A plan costs more than its implementation, so use a strong model here.', 'Opus, effort high'],
        ['Code search, quick edits, layout from a screenshot', 'GPT-6.1 Terra', 'low or medium', 'Fast, and makes things up less often than the others.', 'A subagent on Haiku'],
        ['Extracting data from a document', 'GPT-6.1 Terra', 'medium', 'When it does not know the answer, it makes things up less often than any other model in the lineup.', 'Haiku or Sonnet'],
        ['Bulk routine work and classification', 'GPT-6 Luna', 'low', 'Only if the facts are already in the input or the answer gets checked afterwards.', 'Haiku, low'],
        ['Sol on high failed twice', 'GPT-6 Astra', 'high', 'Several times more expensive for almost the same intelligence. Not for every day.', 'Opus, effort high'],
      ],
      sizes: [['Short, 10 turns', 10], ['Normal, 30 turns', 30], ['Long, 60 turns', 60]],
      inClaude: (advice) => `In Claude Code: ${advice}.`,
    },
    hero: { play: 'Auto-play', stop: 'Stop' },
    copy: { copied: 'Copied', failed: 'That failed, select the text by hand' },
    tools: { shown: (visible, total) => `Showing ${visible} of ${total}` },
    pack: {
      shown: (visible, total) => `Showing ${visible} of ${total}`,
      empty: 'Nothing found, try another word',
      emptyCart: 'Tick “Add to my set” on the cards, and the install command for just those skills appears here.',
      cart: (count) => `In your set: ${count}. Command for Claude Code:`,
    },
    ladder: {
      facts: (speed, input, output) => `Speed: ${speed}. Price per 1M: $${input.toFixed(2)} input, $${output.toFixed(2)} output.`,
      effortLow: 'The starting point: fast and cheap. Fine when there is nothing to think about.',
      effortMax: (gain) => `+${enPoints(gain)} over low, but the last step adds only +4 while using up to 8× the tokens.`,
      effortGain: (gain) => `+${enPoints(gain)} over low.`,
    },
    delegation: {
      subagent: 'Subagent',
      subagentRole: 'Handles the volume: Haiku or Sonnet',
      main: 'Main session',
      mainRole: 'Thinks and checks: Opus',
      noSubagents: 'All the noise stays in the main session and is read again on every turn.',
      overLimit: 'Above my limit. Six parallel vitest and tsc runs brought down my laptop (10 cores, 16 GB). Each subagent checks only its own file; the full run happens once, in the main session.',
      withSubagents: 'Only the outputs reach the main session. Re-read the result yourself: a progress notification is not a result.',
      yes: 'Delegate',
      no: 'Do not delegate',
    },
    curve: {
      turns: enTurns,
      paidBack: (steps) => `Paid off after ${enTurns(steps)}: every turn after that is cheaper.`,
      tooLate: (left) => `Only ${enTurns(left)} left, so the compact had no time to pay off.`,
      tooEarly: 'The context is still light and almost all cached: the summary costs more than it saves.',
      axisTurn: (n) => `turn ${n}`,
    },
    spend: {
      none: 'Tool outputs take up most of the history, so that is where to save.',
      tools: 'Schemas sit in the context from the first turn. Narrow the set before the session starts: changing it midway resets the cache.',
      masked: 'Old outputs are hidden: the same quality at half the price (one source).',
      sandbox: 'A script does the work outside the context and only the answer reaches the chat. The raw data stays available through search: the model must see an error in a log word for word.',
      asIs: 'As is',
      withTricks: 'With techniques',
    },
    cycle: { step: (current, total) => `Step ${current} of ${total}` },
    modelTree: {
      step: (current, total) => `Step ${current} of ${total}`,
      prev: 'Back',
      next: 'Next',
      play: 'Play',
      pause: 'Pause',
      start: 'Start in lane:',
      quota: 'Quota ran out',
      retry: 'Retry',
      escalate: 'Go up a level',
      reset: 'Start over',
      yes: 'Yes, call Fable',
      no: 'No',
      begin: (model) => `Work runs on the first row of the lane: ${model}.`,
      onQuota: (from, to) => `The quota ran out at ${from}. Same lane, next row: ${to}.`,
      onRetry: (model) => `Retry on the same row: ${model}.`,
      onEscalate: (lane, model) => `Going up to the ${lane} lane: ${model}.`,
      needsYes: (model) => `Next is ${model}. It is expensive, so it needs my explicit yes.`,
      declined: (model) => `Staying on the row: ${model}.`,
      stop: 'The rows have run out. The decision is the person’s.',
    },
    scene: { compactHint: ': time for /compact', freshHint: ': better start a new session' },
  },
};
