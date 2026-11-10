// Схема из моей настройки Claude Code. Практика без замеров, как и весь раздел про делегацию
export const TREE_NODES = [
  { id: 'you', tier: 0, kind: 'you', model: '', label: 'Вы', role: 'Ставите задачу и принимаете результат' },
  { id: 'jev', tier: 1, kind: 'jev', model: 'Jev', label: 'Развилки', role: 'Повторить или поднять уровень, какой агент, какой навык, опасен ли вызов' },
  { id: 'main', tier: 1, kind: 'claude', model: 'Sonnet 5.5', label: 'Главная сессия', role: 'Ведёт задачу, раздаёт работу, пишет код' },
  { id: 'advisor', tier: 1, kind: 'claude', model: 'Opus 5.5', label: 'Советник', role: 'Второе мнение перед нетривиальным планом и когда застряли; видит всю переписку' },
  { id: 'decider', tier: 2, kind: 'claude', model: 'Fable 5.2', label: 'decider', role: 'Решения: интерфейс, архитектура, спорная логика. Кода не пишет' },
  { id: 'search', tier: 2, kind: 'claude', model: 'Haiku 5.5', label: 'search', role: 'Карта области: что где лежит' },
  { id: 'grep', tier: 2, kind: 'claude', model: 'Haiku 5.5', label: 'grep', role: 'Все места вызова названного символа' },
  { id: 'audit', tier: 2, kind: 'claude', model: 'Haiku 5.5', label: 'audit', role: 'Механическая проверка закоммиченного diff в отдельном worktree' },
  { id: 'orca', tier: 3, kind: 'vendor', model: 'Orca / Herdr', label: 'Воркеры', role: 'Модели других вендоров, только внутри Orca или Herdr' },
];

export const TREE_STEPS = [
  { id: 'task', nodes: ['you', 'main'], text: 'Вы ставите задачу. Главная сессия на Sonnet 5.5 берёт её и ведёт до конца.' },
  { id: 'fork', nodes: ['main', 'jev'], text: 'Перед выбором исполнителя главная сессия спрашивает Jev: какая полоса, какой агент, опасен ли вызов. Ответ Jev окончательный, если не нарушает жёсткое правило.' },
  { id: 'search', nodes: ['main', 'search'], text: 'Карту области строит search на Haiku 5.5. В главный контекст попадают только выводы с path:line, а не прочитанные файлы.' },
  { id: 'decide', nodes: ['main', 'decider'], text: 'Развилка в архитектуре или интерфейсе уходит в decider на Fable 5.2. Он возвращает решение, не меньше трёх отвергнутых вариантов с причинами, риски и критерии приёмки.' },
  { id: 'build', nodes: ['main', 'advisor'], text: 'Код пишет главная сессия. Перед нетривиальным планом и когда застряла, она зовёт советника на Opus 5.5.' },
  { id: 'audit', nodes: ['main', 'audit'], text: 'audit на Haiku 5.5 проверяет закоммиченный diff в отдельном worktree и гоняет узкие lint и тесты. Полный прогон один, в главной сессии, когда все агенты закончили.' },
  { id: 'workers', nodes: ['main', 'orca'], text: 'Внутри Orca или Herdr часть работы уходит воркерам других вендоров. Полоса задаёт порядок моделей: отказ, квота или лимит переводят на следующую строку.' },
  { id: 'step', nodes: ['orca', 'jev'], text: 'После отчёта воркера jev lane step решает: повторить, поднять уровень, вернуть решение мне или закончить.' },
];

// Порядок строк важен: отказ, квота или лимит ведут на следующую. needsYes: только после явного «да»
export const TREE_LANES = [
  {
    id: 'small',
    note: 'Механика по готовому описанию: переименование, опечатка, поиск',
    rows: [
      { vendor: 'qoder', model: 'Qwen3.8-Flash' },
      { vendor: 'opencode', model: 'opencode-go/qwen3.8-flash' },
      { vendor: 'qoder', model: 'GLM-5.3-Flash' },
      { vendor: 'opencode', model: 'opencode-go/glm-5.3-flash' },
      { vendor: 'qoder', model: 'DeepSeek-Flash' },
      { vendor: 'opencode', model: 'opencode-go/deepseek-v4.1-flash' },
      { vendor: 'antigravity', model: 'gemini-3.8-flash' },
      { vendor: 'claude', model: 'Claude Haiku 5.5' },
    ],
  },
  {
    id: 'medium',
    note: 'Обычная функция или исправление в нескольких файлах',
    rows: [
      { vendor: 'claude', model: 'Claude Sonnet 5.5' },
      { vendor: 'qoder', model: 'Qwen3.8-Max' },
      { vendor: 'opencode', model: 'opencode-go/qwen3.8-max' },
      { vendor: 'opencode', model: 'opencode-go/muse-spark-1.3-contributor' },
    ],
  },
  {
    id: 'high',
    note: 'Много файлов, неизвестная причина, выбор решения',
    rows: [
      { vendor: 'claude', model: 'Claude Opus 5.5' },
      { vendor: 'qoder', model: 'Kimi-K3.1-Pro' },
      { vendor: 'opencode', model: 'opencode-go/kimi-k3.1-pro' },
      { vendor: 'qoder', model: 'GLM-5.3' },
      { vendor: 'opencode', model: 'opencode-go/glm-5.3' },
    ],
  },
  {
    id: 'escalate',
    note: 'Только если нижняя полоса не справилась несколько раз. Fable дорогой: нужно моё «да»',
    rows: [
      { vendor: 'claude', model: 'Claude Opus 5.5 (high)' },
      { vendor: 'claude', model: 'Claude Fable 5.2', needsYes: true },
    ],
  },
];

// Итог шага: { lane, row, needsYes } либо { stop: true }, когда решение остаётся за человеком
export function moveOn({ lane, row }, event) {
  if (event === 'retry') return { lane, row, needsYes: false };
  const isTop = lane === TREE_LANES.length - 1;
  const targets = {
    quota: { lane, row: row + 1 },
    // Выше последней полосы подниматься некуда: остаётся следующая строка в ней же
    escalate: isTop ? { lane, row: row + 1 } : { lane: lane + 1, row: 0 },
  };
  const target = targets[event];
  if (!target) throw new Error(`Неизвестное событие: ${event}`);
  const found = TREE_LANES[target.lane].rows[target.row];
  return found ? { ...target, needsYes: Boolean(found.needsYes) } : { stop: true };
}
