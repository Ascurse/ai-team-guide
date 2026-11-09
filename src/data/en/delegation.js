// Переводится на месте. id, URL, теги и порядок обязаны совпадать с ../delegation.js: это проверяет test/i18n.test.mjs
export const DELEGATION_TASKS = [
  { name: 'Code exploration', yes: true, why: 'The reads stay with the subagent, and you get the answer: where this is used and how the module is built.' },
  { name: 'Review of a diff in a clean context', yes: true, why: 'A fresh context does not know how you got here, so it does not adjust to you.' },
  { name: 'Independent pieces: different modules, different sources', yes: true, why: 'The steps do not depend on each other, so running in parallel saves time.' },
  { name: 'Logs, long outputs, trying out variants', yes: true, why: 'The noise stays in the context of the subagent.' },
  { name: 'Bug in 1–2 files', yes: false, why: 'A subagent has to study the task from scratch, so a small thing is cheaper to do yourself.' },
  { name: 'The steps depend on each other', yes: false, why: 'On sequential tasks, coordination hurts.' },
  { name: 'One agent is already doing well', yes: false, why: 'Running in parallel does not raise quality, and it uses noticeably more tokens.' },
  { name: '"For show"', yes: false, why: 'Start with one agent and strict verification.' },
];

export { FILE_READS, MAX_PARALLEL, splitReads } from '../delegation.js';
