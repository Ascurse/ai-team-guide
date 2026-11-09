// Переводится на месте. id, URL, теги и порядок обязаны совпадать с ../cycle.js: это проверяет test/i18n.test.mjs
import { CYCLE_EDGES, VERDICT_NO, VERDICT_YES } from '../cycle.js';

export const CYCLE_NODES = [
  { id: 'goal', name: 'Task setup' },
  { id: 'plan', name: 'Plan' },
  { id: 'build', name: 'Execution' },
  { id: 'check', name: 'Verification' },
  { id: 'debug', name: 'Debugging' },
  { id: 'review', name: 'Review' },
];

export { CYCLE_EDGES, VERDICT_NO, VERDICT_YES };

export const CYCLE_FRAMES = [
  { node: 'goal', text: 'The goal is measurable: the component renders three states, tests are green, tsc is clean.' },
  { node: 'plan', text: 'The agent asks questions first: about states, API, and edge cases. The plan is written as if a junior with no context will carry it out.' },
  { node: 'build', text: 'One vertical slice and a small PR. The next slice starts in a new session.' },
  { node: 'check', verdict: VERDICT_NO, text: 'A test failed. That is a working outcome: "done" is said by whatever could have said "no".' },
  { node: 'debug', text: 'First a stack trace, a failing test, or reproduction steps. If the cause is not obvious, 2–3 hypotheses and what would refute each.' },
  { node: 'build', text: 'The edit goes back into the same slice.' },
  { node: 'check', verdict: VERDICT_YES, text: 'Every criterion has a command and its output. "All tests green" does not prove a specific criterion.' },
  { node: 'review', text: 'A human looks at the contract: the intent, API, invariants, access.' },
];
