export const PACK_ZIP = 'ai-team-skills.zip';
export const PACK_DIR = 'pack';
export const ALL_AUDIENCES_FILTER = 'all';
export const ALL_CATEGORIES_FILTER = 'all';

export const PACK_AUDIENCES = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'dev', label: 'Claude Code и Codex' },
];

export const PACK_CATEGORIES = [
  { id: 'text', label: 'Тексты и факты', description: 'Для всех, кто пишет людям: письма, анонсы, отчёты.' },
  { id: 'plan', label: 'План и проверка', description: 'До кода: разбить работу, сверить план с документацией, не потерять старое поведение.' },
  { id: 'git', label: 'Git и задачи', description: 'Довести работу до коммита и мержа. Три из четырёх рассчитаны на трекер beads.' },
  { id: 'memory', label: 'Память и передача', description: 'Чтобы следующая сессия или другой агент не начинали с нуля.' },
  { id: 'config', label: 'Гигиена конфига', description: 'Раз в месяц: что в настройках агента лишнее, опасное или устарело.' },
];

export const PACK_INSTALL = [
  {
    id: 'claude',
    label: 'Claude Code',
    steps: ['mkdir -p ~/.claude/skills', 'cp -r skills/* ~/.claude/skills/'],
    note: 'Скиллы подхватываются в новой сессии. Проверка: /skills.',
  },
  {
    id: 'codex',
    label: 'Codex',
    steps: [
      'mkdir -p ~/.agents/skills ~/.codex/rules ~/.codex/agents',
      'cp -r skills/* ~/.agents/skills/',
      'cp codex/rules/team-guard.rules ~/.codex/rules/',
      'cp codex/agents/*.toml ~/.codex/agents/',
    ],
    note: 'Ещё одно: содержимое codex/config.snippet.toml дописать в ~/.codex/config.toml.',
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    steps: ['cd chatgpt && zip -r task-brief.zip task-brief && zip -r fact-check.zip fact-check'],
    note: 'Дальше ChatGPT → Skills → Create → загрузить архив. Тариф без Skills: текст chatgpt/project-instructions.md в инструкции проекта.',
  },
];

// manual: скилл не вызывается сам, только командой /имя.
export const PACK_SKILLS = [
  {
    id: 'task-brief', path: 'chatgpt/task-brief', audience: 'chatgpt', category: 'text',
    summary: 'Не пишет «вежливую воду», когда фактов не хватает: задаёт 1–3 вопроса и оставляет неизвестное в [скобках].',
    trigger: '«Срочно напиши клиенту, что поставка переносится»',
  },
  {
    id: 'fact-check', path: 'chatgpt/fact-check', audience: 'chatgpt', category: 'text',
    summary: 'Разбирает текст на утверждения и по каждому даёт вердикт с источником. «Модель помнит» проверкой не считается.',
    trigger: '«Проверь цифры в рассылке перед отправкой»',
  },
  {
    id: 'plan-slices', path: 'skills/plan-slices', audience: 'dev', category: 'plan',
    summary: 'План фичи вертикальными срезами: у каждого среза команда проверки и ожидаемый результат.',
    trigger: '«Распланируй фичу, она задевает базу, API и UI»',
  },
  {
    id: 'grill-with-docs', path: 'skills/grill-with-docs', audience: 'dev', category: 'plan', origin: 'bigpowers',
    summary: 'Ищет в плане выдуманные методы и опции библиотек. Каждое возражение обязано ссылаться на URL документации.',
    trigger: '«Сверь план с документацией, такой метод вообще есть?»',
  },
  {
    id: 'spec-vs-implementation-gap-report', path: 'skills/spec-vs-implementation-gap-report', audience: 'dev', category: 'plan',
    summary: 'Сверяет код с внешним документом (ТЗ, план MVP, задача в трекере): что сделано, что частично, чего нет.',
    trigger: '«Подготовься к созвону: что из инструкции бэкенда мы реализовали?»',
  },
  {
    id: 'legacy-migration', path: 'skills/legacy-migration', audience: 'dev', category: 'plan',
    summary: 'Сначала тесты на старое поведение и проверка их мутациями, потом миграция. Тесты во время миграции не правятся.',
    trigger: '«Перепиши с moment на date-fns, тестов там нет»',
  },
  {
    id: 'dependency-major-upgrade', path: 'skills/dependency-major-upgrade', audience: 'dev', category: 'plan',
    summary: 'Решает, стоит ли обновлять мажорную версию, и если да, делит миграцию по областям кода.',
    trigger: '«Стоит ли переезжать на Zod 4?»',
  },
  {
    id: 'test-coverage-improver', path: 'skills/test-coverage-improver', audience: 'dev', category: 'plan', manual: true,
    summary: 'Находит непокрытый код по отчёту покрытия и дописывает тесты на самые рискованные места.',
    trigger: '/test-coverage-improver',
  },
  {
    id: 'atomic-commit-split', path: 'skills/atomic-commit-split', audience: 'dev', category: 'git',
    summary: 'Разносит смешанный diff по коммитам: один коммит на одну задачу, а не «всё одним».',
    trigger: '«Закоммить это двумя коммитами»',
  },
  {
    id: 'ship', path: 'skills/ship', audience: 'dev', category: 'git', needs: 'beads',
    summary: 'Коммит, пуш, мерж и закрытие задачи одним сценарием, с проверками между шагами.',
    trigger: '«Закоммить, запушь и закрой задачу»',
  },
  {
    id: 'bd-branch-integration-merge', path: 'skills/bd-branch-integration-merge', audience: 'dev', category: 'git', needs: 'beads',
    summary: 'Сливает ветки параллельных агентов по одной, в порядке зависимостей, с проверками после каждой.',
    trigger: '«Смержи bd-12 и bd-14 в feature/payments»',
  },
  {
    id: 'bd-priorities', path: 'skills/bd-priorities', audience: 'dev', category: 'git', needs: 'beads',
    summary: 'Предлагает порядок работы по открытым задачам и находит забытые и задачи без описания.',
    trigger: '/bd-priorities',
  },
  {
    id: 'agents-md', path: 'skills/agents-md', audience: 'dev', category: 'memory',
    summary: 'AGENTS.md на 20–40 строк подвохов этого репозитория вместо листинга папок и общих правил.',
    trigger: '«Сделай AGENTS.md для этого репо»',
  },
  {
    id: 'doc-system', path: 'skills/doc-system', audience: 'dev', category: 'memory',
    summary: 'Заводит docs/journal (решения, подвохи, глоссарий) и правило в AGENTS.md: читать перед задачей, дописывать после находки.',
    trigger: '«Заведи документацию, понятную агентам»',
  },
  {
    id: 'handoff', path: 'skills/handoff', audience: 'dev', category: 'memory',
    summary: 'Готовый текст для передачи сессии в новый чат или другому агенту: решения, файлы, открытые вопросы.',
    trigger: '«Сделай хэндофф, продолжу в новой сессии»',
  },
  {
    id: 'pack', path: 'skills/pack', audience: 'dev', category: 'memory',
    summary: 'Собирает строку для /compact: насколько сжать и что считать важным. Сам компакт не запускает.',
    trigger: '/pack',
  },
  {
    id: 'research-synthesis', path: 'skills/research-synthesis', audience: 'dev', category: 'memory', origin: 'claude-code-recipes',
    summary: 'Сводит пачку отчётов в реестр утверждений, карту расхождений и список пробелов. Новые отчёты дописываются без пересборки.',
    trigger: '«Своди эти пять отчётов»',
  },
  {
    id: 'context-budget-audit', path: 'skills/context-budget-audit', audience: 'dev', category: 'config',
    summary: 'Показывает, куда уходят токены в начале каждой сессии, и что можно урезать без потери качества.',
    trigger: '«Почему лимит кончается так быстро?»',
  },
  {
    id: 'config-gc', path: 'skills/config-gc', audience: 'dev', category: 'config', origin: 'ECC', manual: true,
    summary: 'Ищет лишние скиллы, хуки, разрешения и MCP-серверы. Каждое удаление подтверждаете вы.',
    trigger: '/config-gc',
  },
  {
    id: 'security-scan', path: 'skills/security-scan', audience: 'dev', category: 'config', origin: 'ECC', needs: 'AgentShield',
    summary: 'Проверяет настройки агента на опасные разрешения, инъекции в хуках и подозрительные MCP-серверы.',
    trigger: '«Проверь мой .claude на дыры»',
  },
  {
    id: 'skill-stocktake', path: 'skills/skill-stocktake', audience: 'dev', category: 'config', origin: 'ECC', manual: true,
    summary: 'Ревизия скиллов: какие дублируют друг друга, какие устарели, какие стоит переписать.',
    trigger: '/skill-stocktake',
  },
  {
    id: 'rules-distill', path: 'skills/rules-distill', audience: 'dev', category: 'config', origin: 'ECC', manual: true,
    summary: 'Находит принципы, повторённые в нескольких скиллах, и выносит их в общие правила.',
    trigger: '/rules-distill',
  },
  {
    id: 'workspace-surface-audit', path: 'skills/workspace-surface-audit', audience: 'dev', category: 'config', manual: true,
    summary: 'Смотрит, что реально подключено (MCP, плагины, переменные окружения), и советует, чего не хватает.',
    trigger: '/workspace-surface-audit',
  },
];

export function filterPackSkills(skills, { audience = ALL_AUDIENCES_FILTER, category = ALL_CATEGORIES_FILTER, query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return skills.filter((skill) => (
    (audience === ALL_AUDIENCES_FILTER || skill.audience === audience)
    && (category === ALL_CATEGORIES_FILTER || skill.category === category)
    && (!needle || `${skill.id} ${skill.summary} ${skill.trigger}`.toLowerCase().includes(needle))
  ));
}

// Команда копирования выбранных скиллов: ChatGPT-скиллы ставятся загрузкой, в cp их нет.
export function installCommand(ids, target = '~/.claude/skills/') {
  const devIds = ids.filter((id) => PACK_SKILLS.some((skill) => skill.id === id && skill.audience === 'dev'));
  if (devIds.length === 0) return '';
  const source = devIds.length === 1 ? `skills/${devIds[0]}` : `skills/{${devIds.join(',')}}`;
  return `cp -r ${source} ${target}`;
}
