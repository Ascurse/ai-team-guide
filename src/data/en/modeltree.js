// Переводится на месте. id, модели и порядок строк обязаны совпадать с ../modeltree.js: это проверяет test/i18n.test.mjs
export const TREE_NODES = [
  { id: 'you', tier: 0, kind: 'you', model: '', label: 'You', role: 'You set the task and accept the result' },
  { id: 'jev', tier: 1, kind: 'jev', model: 'Jev', label: 'Forks', role: 'Retry or go up a level, which agent, which skill, is a call risky' },
  { id: 'main', tier: 1, kind: 'claude', model: 'Sonnet 5.5', label: 'Main session', role: 'Runs the task, hands out work, writes code' },
  { id: 'advisor', tier: 1, kind: 'claude', model: 'Opus 5.5', label: 'Advisor', role: 'A second opinion before a non-trivial plan and when stuck; sees the whole conversation' },
  { id: 'decider', tier: 2, kind: 'claude', model: 'Fable 5.2', label: 'decider', role: 'Decisions: interface, architecture, disputed logic. Writes no code' },
  { id: 'search', tier: 2, kind: 'claude', model: 'Haiku 5.5', label: 'search', role: 'A map of the area: what lives where' },
  { id: 'grep', tier: 2, kind: 'claude', model: 'Haiku 5.5', label: 'grep', role: 'Every call site of a named symbol' },
  { id: 'audit', tier: 2, kind: 'claude', model: 'Haiku 5.5', label: 'audit', role: 'A mechanical check of the committed diff in a separate worktree' },
  { id: 'orca', tier: 3, kind: 'vendor', model: 'Orca / Herdr', label: 'Workers', role: 'Other vendors’ models, only inside Orca or Herdr' },
];

export const TREE_STEPS = [
  { id: 'task', nodes: ['you', 'main'], text: 'You set the task. The main session on Sonnet 5.5 takes it and runs it to the end.' },
  { id: 'fork', nodes: ['main', 'jev'], text: 'Before choosing who does the work, the main session asks Jev: which lane, which agent, is the call risky. Jev’s answer is final unless it breaks a hard rule.' },
  { id: 'search', nodes: ['main', 'search'], text: 'search on Haiku 5.5 builds the map of the area. Only conclusions with path:line reach the main context, not the files it read.' },
  { id: 'decide', nodes: ['main', 'decider'], text: 'A fork in architecture or interface goes to decider on Fable 5.2. It returns a decision, at least three rejected options with reasons, the risks, and acceptance criteria.' },
  { id: 'build', nodes: ['main', 'advisor'], text: 'The main session writes the code. Before a non-trivial plan and when stuck, it calls the advisor on Opus 5.5.' },
  { id: 'audit', nodes: ['main', 'audit'], text: 'audit on Haiku 5.5 checks the committed diff in a separate worktree and runs narrow lint and tests. The full run happens once, in the main session, when all agents are done.' },
  { id: 'workers', nodes: ['main', 'orca'], text: 'Inside Orca or Herdr, part of the work goes to workers from other vendors. The lane sets the order of models: a refusal, a quota or a limit moves to the next row.' },
  { id: 'step', nodes: ['orca', 'jev'], text: 'After a worker’s report, jev lane step decides: retry, go up a level, hand the decision back to me, or finish.' },
];

// Row order matters: a refusal, a quota or a limit leads to the next one. needsYes: only after an explicit yes
export const TREE_LANES = [
  {
    id: 'small',
    note: 'Mechanical work from a ready description: a rename, a typo, a lookup',
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
    note: 'An ordinary function or a fix across a few files',
    rows: [
      { vendor: 'claude', model: 'Claude Sonnet 5.5' },
      { vendor: 'qoder', model: 'Qwen3.8-Max' },
      { vendor: 'opencode', model: 'opencode-go/qwen3.8-max' },
      { vendor: 'opencode', model: 'opencode-go/muse-spark-1.3-contributor' },
    ],
  },
  {
    id: 'high',
    note: 'Many files, an unknown cause, a choice of design',
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
    note: 'Only if a lower lane failed several times. Fable is expensive: it needs my yes',
    rows: [
      { vendor: 'claude', model: 'Claude Opus 5.5 (high)' },
      { vendor: 'claude', model: 'Claude Fable 5.2', needsYes: true },
    ],
  },
];

export { moveOn } from '../modeltree.js';
