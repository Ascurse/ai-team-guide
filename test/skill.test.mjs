import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKILL_PROMPT_TEMPLATE, SKILL_ROUTINES, skillFile, skillPrompt } from '../src/data/skill.js';

const guide = readFileSync(new URL('../src/content/guide.md', import.meta.url), 'utf8');

test('шаблон запроса дословно совпадает с гайдом', () => {
  assert.ok(guide.includes(SKILL_PROMPT_TEMPLATE));
});

test('в запросе не остаётся незаполненной задачи, образец заполняет читатель', () => {
  for (const routine of SKILL_ROUTINES) {
    const prompt = skillPrompt(routine);
    assert.ok(prompt.includes(routine.task), routine.id);
    assert.ok(!prompt.includes('<что делаю'), routine.id);
    assert.match(prompt, /результат: <[^>]+>\./, routine.id);
  }
});

test('рутины взяты из первого шага раздела', () => {
  const step = guide.split('\n').find((line) => line.startsWith('1. **Выберите рутину.**')).toLowerCase();
  for (const routine of SKILL_ROUTINES) assert.ok(step.includes(routine.inGuide), routine.id);
});

test('файл собран из четырёх подписанных частей в порядке SKILL.md', () => {
  for (const routine of SKILL_ROUTINES) {
    const parts = skillFile(routine);
    assert.deepEqual(parts.map((part) => part.id), ['name', 'description', 'steps', 'limits']);
    for (const part of parts) assert.ok(part.note && part.text, `${routine.id}/${part.id}`);
    assert.ok(parts[0].text.startsWith('---\nname: '));
    assert.ok(parts[1].text.endsWith('\n---'));
  }
});

test('имя скилла годится для папки, описание говорит, когда срабатывать', () => {
  for (const routine of SKILL_ROUTINES) {
    assert.match(routine.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.match(routine.description, /когда/i, routine.id);
  }
  assert.equal(new Set(SKILL_ROUTINES.map((routine) => routine.name)).size, SKILL_ROUTINES.length);
});

test('каждый скилл запрещает необратимое действие', () => {
  for (const routine of SKILL_ROUTINES) assert.match(routine.limits, /(^|\s)не\s/i, routine.id);
});
