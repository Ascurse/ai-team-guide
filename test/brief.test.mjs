import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { BRIEF_BASE, BRIEF_PARTS, BRIEF_RESULTS, briefFile, briefMask, briefPrompt } from '../src/data/brief.js';

const guide = readFileSync(new URL('../src/content/guide.md', import.meta.url), 'utf8');
const publicFile = (name) => new URL(`../public/${name}`, import.meta.url);

test('маска однозначно называет каждую из восьми комбинаций', () => {
  const masks = new Set();
  for (const goal of [false, true]) for (const done of [false, true]) for (const example of [false, true]) {
    masks.add(briefMask({ goal, done, example }));
  }
  assert.deepEqual([...masks].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(briefMask({ goal: true, done: false, example: true }), 5);
});

test('промпт показан дословно и в порядке отправки', () => {
  assert.equal(briefPrompt({}), BRIEF_BASE);
  assert.equal(
    briefPrompt({ example: true, goal: true }),
    `${BRIEF_BASE} ${BRIEF_PARTS[0].text} ${BRIEF_PARTS[2].text}`,
  );
});

test('у каждой комбинации есть файл, подпись и alt', () => {
  assert.equal(BRIEF_RESULTS.length, 8);
  BRIEF_RESULTS.forEach((result, mask) => {
    assert.ok(result.alt.length > 20, `alt ${mask}`);
    assert.ok(result.note.length > 20, `note ${mask}`);
    assert.ok(statSync(publicFile(briefFile(mask))).size > 0);
  });
});

test('картинки укладываются в 400 КБ вместе с образцом', () => {
  const names = [...BRIEF_RESULTS.keys()].map(briefFile).concat('brief/sample.webp');
  const total = names.reduce((sum, name) => sum + statSync(publicFile(name)).size, 0);
  assert.ok(total <= 400 * 1024, `${total} байт`);
});

test('переключатели названы как пункты раздела', () => {
  for (const part of BRIEF_PARTS) assert.ok(guide.includes(`**${part.label}.**`), part.label);
});
