import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EFFORT, LADDER, effortGainTo, ladderBars } from '../src/data/ladder.js';
import { PRICES } from '../src/lib/sim.js';

const guide = readFileSync(new URL('../src/content/guide.md', import.meta.url), 'utf8');

test('лестница покрывает все модели таблицы цен', () => {
  assert.deepEqual(LADDER.map((m) => m.id).sort(), Object.keys(PRICES).sort());
});

test('числа лестницы есть в тексте гайда', () => {
  for (const m of LADDER) {
    assert.ok(guide.includes(`${m.name === 'Sol' ? 'GPT-6.1 Sol' : m.name} — ${m.made}%`), m.name);
    if (m.index) assert.ok(guide.includes(String(m.index)), m.name);
  }
  assert.ok(guide.includes('low→medium +17 баллов, medium→high +6, high→max +4'));
});

test('высота ступени считается от максимума, пропуски не притворяются нулём цены', () => {
  const made = ladderBars('made');
  assert.equal(made.find((b) => b.name === 'Luna').share, 1);
  const index = ladderBars('index');
  assert.equal(index.find((b) => b.name === 'Terra').label, 'нет данных');
  assert.equal(index.find((b) => b.name === 'Astra').share, 1);
  assert.ok(ladderBars('session')[0].label.startsWith('$'));
});

test('прирост усилия накапливается ступенями', () => {
  assert.equal(EFFORT.length, 4);
  assert.equal(effortGainTo('low'), 0);
  assert.equal(effortGainTo('high'), 23);
  assert.equal(effortGainTo('max'), 27);
});
