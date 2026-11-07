import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { PACK_CATEGORIES, PACK_SKILLS, filterPackSkills, installCommand } from '../src/data/pack.js';
import { PACK_DIR, listPackFiles } from '../scripts/pack.mjs';

const guide = readFileSync(new URL('../src/content/guide.md', import.meta.url), 'utf8');
const packFiles = listPackFiles().map((file) => relative(PACK_DIR, file).split(sep).join('/'));
const skillDirs = packFiles.filter((file) => file.endsWith('/SKILL.md')).map((file) => file.replace(/\/SKILL\.md$/, ''));
// Пак публичный: ни названия работодателя, ни внутренних путей автора
const LEAK_PATTERN = /zigmund|зигмунд|zigmund-rules/i;

test('карточка на каждый SKILL.md в паке и ни одной лишней', () => {
  assert.deepEqual(PACK_SKILLS.map((skill) => skill.path).sort(), skillDirs.sort());
});

test('id карточек уникальны и совпадают с именем папки', () => {
  assert.equal(new Set(PACK_SKILLS.map((skill) => skill.id)).size, PACK_SKILLS.length);
  for (const skill of PACK_SKILLS) assert.equal(skill.path.split('/').at(-1), skill.id);
});

test('у каждой карточки есть раздел, описание и способ вызова', () => {
  const categoryIds = new Set(PACK_CATEGORIES.map((category) => category.id));
  for (const skill of PACK_SKILLS) {
    assert.ok(categoryIds.has(skill.category), skill.id);
    assert.ok(skill.summary.length > 0, skill.id);
    assert.ok(skill.trigger.length > 0, skill.id);
    assert.match(readFileSync(new URL(`../public/pack/${skill.path}/SKILL.md`, import.meta.url), 'utf8'), /^description:\s*\S/m, skill.id);
  }
});

test('в паке нет командного процесса и утечек работодателя', () => {
  assert.ok(!packFiles.some((file) => file.includes('team-process')));
  for (const file of packFiles) {
    const text = readFileSync(new URL(`../public/pack/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(text, LEAK_PATTERN, file);
  }
  assert.ok(existsSync(new URL('../public/pack/THIRD_PARTY.md', import.meta.url)));
});

test('часть «Пак скиллов» стоит между «Инструменты» и «Напоследок»', () => {
  const tools = guide.indexOf('\n# Инструменты');
  const pack = guide.indexOf('\n# Пак скиллов');
  const finale = guide.indexOf('\n# Напоследок');
  assert.ok(tools !== -1 && tools < pack && pack < finale);
});

test('installCommand: одна, несколько, только ChatGPT, пусто', () => {
  assert.equal(installCommand(['ship']), 'cp -r skills/ship ~/.claude/skills/');
  assert.equal(installCommand(['ship', 'handoff']), 'cp -r skills/{ship,handoff} ~/.claude/skills/');
  assert.equal(installCommand(['task-brief', 'ship']), 'cp -r skills/ship ~/.claude/skills/');
  assert.equal(installCommand(['task-brief']), '');
  assert.equal(installCommand([]), '');
  assert.equal(installCommand(['ship'], '~/.agents/skills/'), 'cp -r skills/ship ~/.agents/skills/');
});

test('фильтр: аудитория, раздел и поиск сужают выдачу', () => {
  assert.equal(filterPackSkills(PACK_SKILLS).length, PACK_SKILLS.length);
  assert.ok(filterPackSkills(PACK_SKILLS, { audience: 'chatgpt' }).every((skill) => skill.audience === 'chatgpt'));
  assert.ok(filterPackSkills(PACK_SKILLS, { category: 'git' }).every((skill) => skill.category === 'git'));
  assert.deepEqual(filterPackSkills(PACK_SKILLS, { query: 'HANDOFF' }).map((skill) => skill.id), ['handoff']);
  assert.equal(filterPackSkills(PACK_SKILLS, { query: 'несуществующее слово' }).length, 0);
});
