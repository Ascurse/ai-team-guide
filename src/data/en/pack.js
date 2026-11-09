// Переводится на месте. id, URL, теги и порядок обязаны совпадать с ../pack.js: это проверяет test/i18n.test.mjs
export const PACK_AUDIENCES = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'dev', label: 'Claude Code and Codex' },
];

export const PACK_CATEGORIES = [
  { id: 'text', label: 'Texts and facts', description: 'For everyone who writes to people: emails, announcements, reports.' },
  { id: 'plan', label: 'Plan and verification', description: 'Before the code: break down the work, verify the plan against the documentation, keep the old behavior intact.' },
  { id: 'git', label: 'Git and tasks', description: 'Take the work through to commit and merge. Three of the four are built for the beads tracker.' },
  { id: 'memory', label: 'Memory and handoff', description: 'So that the next session or another agent does not start from scratch.' },
  { id: 'config', label: 'Config hygiene', description: 'Once a month: what in your agent settings is unnecessary, dangerous, or out of date.' },
];

export const PACK_INSTALL = [
  {
    id: 'claude',
    label: 'Claude Code',
    steps: ['mkdir -p ~/.claude/skills', 'cp -r skills/* ~/.claude/skills/'],
    note: 'Skills are picked up in a new session. To check: /skills.',
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
    note: 'One more thing: append the contents of codex/config.snippet.toml to ~/.codex/config.toml.',
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    steps: ['cd chatgpt && zip -r task-brief.zip task-brief && zip -r fact-check.zip fact-check'],
    note: 'Then ChatGPT → Skills → Create → upload the archive. On a plan without Skills: put the text of chatgpt/project-instructions.md into the project instructions.',
  },
];

// manual: скилл не вызывается сам, только командой /имя.
export const PACK_SKILLS = [
  {
    id: 'task-brief', path: 'chatgpt/task-brief', audience: 'chatgpt', category: 'text',
    summary: 'Does not write "polite filler" when facts are missing: it asks 1–3 questions and leaves the unknowns in [brackets].',
    trigger: '"Write to the client urgently that the delivery is being postponed"',
  },
  {
    id: 'fact-check', path: 'chatgpt/fact-check', audience: 'chatgpt', category: 'text',
    summary: 'Breaks a text into claims and gives a verdict with a source for each one. "The model remembers" does not count as a check.',
    trigger: '"Check the numbers in the newsletter before it goes out"',
  },
  {
    id: 'plan-slices', path: 'skills/plan-slices', audience: 'dev', category: 'plan',
    summary: 'A feature plan in vertical slices: each slice has a check command and an expected result.',
    trigger: '"Plan this feature, it touches the database, API, and UI"',
  },
  {
    id: 'grill-with-docs', path: 'skills/grill-with-docs', audience: 'dev', category: 'plan', origin: 'bigpowers',
    summary: 'Looks for fabricated methods and library options in a plan. Every objection must link to a documentation URL.',
    trigger: '"Verify the plan against the docs, does this method even exist?"',
  },
  {
    id: 'spec-vs-implementation-gap-report', path: 'skills/spec-vs-implementation-gap-report', audience: 'dev', category: 'plan',
    summary: 'Verifies code against an external document (a spec, an MVP plan, a tracker task): what is done, what is partial, what is missing.',
    trigger: '"Get ready for the call: what have we implemented from the backend instructions?"',
  },
  {
    id: 'legacy-migration', path: 'skills/legacy-migration', audience: 'dev', category: 'plan',
    summary: 'First tests for the old behavior, checked with mutations, then the migration. Tests are not edited during the migration.',
    trigger: '"Rewrite this from moment to date-fns, there are no tests"',
  },
  {
    id: 'dependency-major-upgrade', path: 'skills/dependency-major-upgrade', audience: 'dev', category: 'plan',
    summary: 'Decides whether a major version upgrade is worth it and, if so, splits the migration by code area.',
    trigger: '"Is it worth moving to Zod 4?"',
  },
  {
    id: 'test-coverage-improver', path: 'skills/test-coverage-improver', audience: 'dev', category: 'plan', manual: true,
    summary: 'Finds uncovered code from the coverage report and adds tests for the riskiest places.',
    trigger: '/test-coverage-improver',
  },
  {
    id: 'atomic-commit-split', path: 'skills/atomic-commit-split', audience: 'dev', category: 'git',
    summary: 'Splits a mixed diff into commits: one commit per task, not "everything in one".',
    trigger: '"Commit this as two commits"',
  },
  {
    id: 'ship', path: 'skills/ship', audience: 'dev', category: 'git', needs: 'beads',
    summary: 'Commit, push, merge, and closing the task in one scenario, with checks between the steps.',
    trigger: '"Commit, push, and close the task"',
  },
  {
    id: 'bd-branch-integration-merge', path: 'skills/bd-branch-integration-merge', audience: 'dev', category: 'git', needs: 'beads',
    summary: 'Merges the branches of parallel agents one at a time, in dependency order, with checks after each.',
    trigger: '"Merge bd-12 and bd-14 into feature/payments"',
  },
  {
    id: 'bd-priorities', path: 'skills/bd-priorities', audience: 'dev', category: 'git', needs: 'beads',
    summary: 'Proposes a working order for open tasks and finds forgotten tasks and tasks with no description.',
    trigger: '/bd-priorities',
  },
  {
    id: 'agents-md', path: 'skills/agents-md', audience: 'dev', category: 'memory',
    summary: 'An AGENTS.md of 20–40 lines with the gotchas of this repository, instead of folder listings and general rules.',
    trigger: '"Make an AGENTS.md for this repo"',
  },
  {
    id: 'doc-system', path: 'skills/doc-system', audience: 'dev', category: 'memory',
    summary: 'Sets up docs/journal (decisions, gotchas, glossary) and a rule in AGENTS.md: read it before a task, add to it after a finding.',
    trigger: '"Set up documentation that agents can understand"',
  },
  {
    id: 'handoff', path: 'skills/handoff', audience: 'dev', category: 'memory',
    summary: 'Ready-made text for passing a session to a new chat or another agent: decisions, files, open questions.',
    trigger: '"Make a handoff, I will continue in a new session"',
  },
  {
    id: 'pack', path: 'skills/pack', audience: 'dev', category: 'memory',
    summary: 'Builds the line for /compact: how much to compact and what to treat as important. It does not run the compaction itself.',
    trigger: '/pack',
  },
  {
    id: 'research-synthesis', path: 'skills/research-synthesis', audience: 'dev', category: 'memory', origin: 'claude-code-recipes',
    summary: 'Synthesizes a batch of reports into a claims register, a map of discrepancies, and a list of gaps. New reports are added without a rebuild.',
    trigger: '"Synthesize these five reports"',
  },
  {
    id: 'context-budget-audit', path: 'skills/context-budget-audit', audience: 'dev', category: 'config',
    summary: 'Shows where tokens go at the start of every session and what can be cut without losing quality.',
    trigger: '"Why does the limit run out so fast?"',
  },
  {
    id: 'config-gc', path: 'skills/config-gc', audience: 'dev', category: 'config', origin: 'ECC', manual: true,
    summary: 'Looks for unnecessary skills, hooks, permissions, and MCP servers. You confirm every deletion.',
    trigger: '/config-gc',
  },
  {
    id: 'security-scan', path: 'skills/security-scan', audience: 'dev', category: 'config', origin: 'ECC', needs: 'AgentShield',
    summary: 'Checks agent settings for dangerous permissions, injections in hooks, and suspicious MCP servers.',
    trigger: '"Check my .claude for holes"',
  },
  {
    id: 'skill-stocktake', path: 'skills/skill-stocktake', audience: 'dev', category: 'config', origin: 'ECC', manual: true,
    summary: 'A skill audit: which ones duplicate each other, which are out of date, which are worth rewriting.',
    trigger: '/skill-stocktake',
  },
  {
    id: 'rules-distill', path: 'skills/rules-distill', audience: 'dev', category: 'config', origin: 'ECC', manual: true,
    summary: 'Finds principles repeated across several skills and moves them into shared rules.',
    trigger: '/rules-distill',
  },
  {
    id: 'workspace-surface-audit', path: 'skills/workspace-surface-audit', audience: 'dev', category: 'config', manual: true,
    summary: 'Looks at what is actually connected (MCP, plugins, environment variables) and advises what is missing.',
    trigger: '/workspace-surface-audit',
  },
];

export { ALL_AUDIENCES_FILTER, ALL_CATEGORIES_FILTER, PACK_DIR, PACK_ZIP, filterPackSkills, installCommand } from '../pack.js';
