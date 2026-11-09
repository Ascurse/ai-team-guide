import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { STRINGS } from '../src/scripts/strings.js';

const CYRILLIC = /[А-Яа-яЁё]/;
const TEXT = 'text';

// Поля, которые переводчик меняет. Всё остальное (id, URL, логотипы, теги, порядок) обязано совпасть с русским модулем
const TEXT_FIELDS = {
  brief: ['BRIEF_BASE', 'label', 'text', 'note', 'alt'],
  cycle: ['name', 'text'],
  delegation: ['name', 'why'],
  ladder: ['use', 'speed'],
  skill: ['SKILL_PROMPT_TEMPLATE', 'label', 'inGuide', 'task', 'sample', 'description', 'steps', 'limits', 'note'],
  pack: ['label', 'description', 'note', 'summary', 'trigger'],
  tools: ['label', 'description', 'vendor', 'summary', 'purpose', 'feature', 'pros', 'cons', 'when', 'docsLabel'],
};
const MODULES = Object.keys(TEXT_FIELDS);
const load = (dir, name) => import(new URL(`../src/data/${dir}${name}.js`, import.meta.url));

const maskText = (value) => (Array.isArray(value) ? value.map(maskText) : TEXT);

function skeleton(value, fields) {
  if (typeof value === 'function') return 'function';
  if (Array.isArray(value)) return value.map((item) => skeleton(item, fields));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fields.includes(key) ? maskText(item) : skeleton(item, fields)]));
}

function moduleSkeleton(module, fields) {
  return Object.fromEntries(Object.entries(module).map(([name, value]) => [name, fields.includes(name) ? maskText(value) : skeleton(value, fields)]));
}

test('в src/data/en лежат ровно те модули, что описаны здесь', () => {
  const files = readdirSync(new URL('../src/data/en/', import.meta.url)).sort();
  assert.deepEqual(files, MODULES.map((name) => `${name}.js`).sort());
});

for (const name of MODULES) {
  test(`data/en/${name}: те же экспорты и те же нетекстовые поля`, async () => {
    const [ru, en] = await Promise.all([load('', name), load('en/', name)]);
    assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort());
    assert.deepEqual(moduleSkeleton(en, TEXT_FIELDS[name]), moduleSkeleton(ru, TEXT_FIELDS[name]));
  });
}

test('tools: id, URL, логотипы, теги и порядок совпадают построчно', async () => {
  const [ru, en] = await Promise.all([load('', 'tools'), load('en/', 'tools')]);
  const fixed = (tool) => [tool.id, tool.name, tool.category, tool.logo, tool.fullLogo, tool.url, tool.docs, tool.tags];
  assert.deepEqual(en.TOOLS.map(fixed), ru.TOOLS.map(fixed));
});

test('шаблон скилла в английском модуле сохраняет два места для подстановки', async () => {
  const en = await load('en/', 'skill');
  assert.equal(en.SKILL_PROMPT_TEMPLATE.match(/<[^>]+>/g).length, 2);
  const routine = en.SKILL_ROUTINES[0];
  const prompt = en.skillPrompt(routine);
  assert.ok(prompt.includes(routine.task) && prompt.includes(routine.sample));
  assert.equal(en.skillFile(routine).length, en.SKILL_PARTS.length);
});

test('функции работают на английских данных, а не на русских', async () => {
  const en = await load('en/', 'brief');
  assert.ok(en.briefPrompt({}).startsWith(en.BRIEF_BASE));
  assert.ok(en.briefPrompt({ goal: true }).endsWith(en.BRIEF_PARTS[0].text));
});

function leaves(value, path = '') {
  if (typeof value === 'function') return [[path, value]];
  if (value === null || typeof value !== 'object') return [[path, value]];
  return Object.entries(value).flatMap(([key, item]) => leaves(item, `${path}.${key}`));
}

test('строки клиентских скриптов: у английского те же ключи и нет кириллицы', () => {
  const ru = leaves(STRINGS.ru);
  const en = leaves(STRINGS.en);
  assert.deepEqual(en.map(([path]) => path), ru.map(([path]) => path));
  for (const [path, value] of en) {
    const text = typeof value === 'function' ? value(1, 2, 3) : value;
    assert.doesNotMatch(String(text), CYRILLIC, path);
  }
});

test('английское склонение ходов', () => {
  assert.equal(STRINGS.en.curve.turns(1), '1 turn');
  assert.equal(STRINGS.en.curve.turns(5), '5 turns');
  assert.equal(STRINGS.ru.curve.turns(1), '1 ход');
  assert.equal(STRINGS.ru.curve.turns(3), '3 хода');
  assert.equal(STRINGS.ru.curve.turns(11), '11 ходов');
});
