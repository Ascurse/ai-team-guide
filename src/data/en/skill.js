// Переводится на месте. id, URL, теги и порядок обязаны совпадать с ../skill.js: это проверяет test/i18n.test.mjs
import { skillLogic } from '../logic.js';

// Совпадает с шаблоном в разделе гайда, это проверяет тест
export const SKILL_PROMPT_TEMPLATE = `I want to make a skill for a recurring task: <what I do and how often>.
Here is what a good result looks like: <sample>.
First ask me questions, then create the skill and explain what it consists of.`;

export const SKILL_ROUTINES = [
  {
    id: 'report',
    label: 'Report',
    inGuide: 'a weekly report',
    task: 'every Monday I put together a sales report for the previous week',
    sample: '<attach the report from last week>',
    name: 'weekly-sales-report',
    description: 'Builds the weekly sales report. Use when asked for a weekly report or when given a sales export.',
    steps: ['Check that the export covers every day of the week.', 'Calculate revenue and orders, and compare them with the previous week.', 'Format the report like the sample.'],
    limits: 'Show the report to me. Do not send it to anyone.',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    inGuide: 'going through reviews',
    task: 'once a week I go through customer reviews and look for recurring complaints',
    sample: '<attach a review digest you were happy with>',
    name: 'review-digest',
    description: 'Analyzes customer reviews. Use when given a batch of reviews or asked to find recurring complaints.',
    steps: ['Sort the reviews into complaints, requests, and praise.', 'Count which themes come up most often.', 'Give a verbatim quote for each theme.'],
    limits: 'Do not reply to customers, and do not make up anything that is not in the reviews.',
  },
  {
    id: 'reply',
    label: 'Reply',
    inGuide: 'answering a standard request',
    task: 'several times a day I answer customer questions about returns',
    sample: '<attach a good reply and the return policy>',
    name: 'refund-reply',
    description: 'Drafts a reply to a customer about a return. Use when a question comes in about a refund or a product return.',
    steps: ['Work out what exactly the customer is asking.', 'Find the answer in the return policy.', 'Write a draft in the tone of the sample.'],
    limits: 'Do not send the reply yourself. If the policy has no answer, say so.',
  },
  {
    id: 'reconcile',
    label: 'Reconciliation',
    inGuide: 'reconciling two tables',
    task: 'once a month I reconcile the invoice table against the payment table',
    sample: '<attach the previous reconciliation>',
    name: 'invoice-reconciliation',
    description: 'Reconciles invoices against payments. Use when given two tables and asked to find discrepancies.',
    steps: ['Match rows by invoice number.', 'List the discrepancies in amounts and dates.', 'List rows with no match separately.'],
    limits: 'Do not change the source tables.',
  },
];

export const SKILL_PARTS = [
  { id: 'name', label: 'Name', note: 'A short name. The skill folder usually has the same one.' },
  { id: 'description', label: 'Description', note: 'The key line: the model uses it to decide whether to run the skill. If it is vague, the model may not run it.' },
  { id: 'steps', label: 'Steps', note: 'What you explain all over again every time.' },
  { id: 'limits', label: 'Limits', note: 'What the skill must not do. For a first try, forbid anything irreversible.' },
];

export const { skillPromptParts, skillPrompt, skillFile } = skillLogic(SKILL_PROMPT_TEMPLATE, SKILL_PARTS);
