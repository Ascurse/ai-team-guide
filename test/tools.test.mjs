import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { TOOL_CATEGORIES, TOOL_FILTERS, TOOLS, filterTools } from '../src/data/tools.js';

const guide = readFileSync(new URL('../src/content/guide.md', import.meta.url), 'utf8');
const logoExists = (logo) => existsSync(new URL(`../public/logos/${logo}`, import.meta.url));

test('каждая карточка полна: ссылки, логотип, зачем нужен, фишка, плюс и минус', () => {
  for (const tool of TOOLS) {
    assert.ok(logoExists(tool.logo), `${tool.id}: нет файла ${tool.logo}`);
    assert.match(tool.url, /^https:\/\//, tool.id);
    assert.match(tool.docs, /^https:\/\//, tool.id);
    assert.notEqual(tool.url, tool.docs, tool.id);
    assert.ok(tool.summary.length > 0, tool.id);
    assert.ok(tool.purpose.length > 0, `${tool.id}: нет purpose`);
    assert.ok(tool.feature.length > 0, `${tool.id}: нет feature`);
    assert.ok(tool.when.length > 0, tool.id);
    assert.ok(tool.pros.length >= 1, tool.id);
    assert.ok(tool.cons.length >= 1, tool.id);
  }
});

test('id карточек уникальны', () => {
  assert.equal(new Set(TOOLS.map((tool) => tool.id)).size, TOOLS.length);
});

test('каждая карточка входит в объявленную категорию, и ни одна категория не пуста', () => {
  const knownCategories = new Set(TOOL_CATEGORIES.map((category) => category.id));
  for (const tool of TOOLS) {
    assert.ok(knownCategories.has(tool.category), `${tool.id}: неизвестная категория ${tool.category}`);
  }
  for (const category of TOOL_CATEGORIES) {
    const inCategory = filterTools(TOOLS, 'all', category.id);
    assert.ok(inCategory.length >= 1, category.id);
    assert.ok(inCategory.length < TOOLS.length, category.id);
  }
});

test('у карточек только объявленные метки и хотя бы одна из них', () => {
  const known = new Set(TOOL_FILTERS.map((filter) => filter.id));
  for (const tool of TOOLS) {
    assert.ok(tool.tags.length >= 1, tool.id);
    for (const tag of tool.tags) assert.ok(known.has(tag), `${tool.id}: ${tag}`);
  }
});

test('каждый фильтр меняет список, но не опустошает его', () => {
  for (const filter of TOOL_FILTERS) {
    const visible = filterTools(TOOLS, filter.id);
    assert.ok(visible.length >= 1, filter.id);
    assert.ok(visible.length < TOOLS.length, filter.id);
  }
});

test('комбинированная фильтрация по формату и категории работает согласованно', () => {
  const openAgents = filterTools(TOOLS, 'open', 'agents');
  assert.ok(openAgents.length >= 1);
  for (const tool of openAgents) {
    assert.equal(tool.category, 'agents');
    assert.ok(tool.tags.includes('open'));
  }
});

test('без фильтра видны все карточки', () => {
  assert.equal(filterTools(TOOLS, 'all').length, TOOLS.length);
});

test('в гайде есть отдельная страница перед «Скачать»', () => {
  assert.ok(guide.indexOf('\n# Инструменты\n') > 0);
  assert.ok(guide.indexOf('\n# Инструменты\n') < guide.indexOf('\n# Скачать\n'));
});

test('каталог идёт перед таблицей «Мой стек» на той же странице', () => {
  assert.ok(guide.indexOf('\n# Инструменты\n') < guide.indexOf('\n## Мой стек'));
  assert.ok(guide.indexOf('\n## Мой стек') < guide.indexOf('\n# Скачать\n'));
});
