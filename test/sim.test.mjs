import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, layersAt, PRICES, COMPACT_WARN } from '../src/lib/sim.js';

const TERRA = PRICES['GPT-6.1 Terra'];
const sum = (ls) => ls.reduce((a, l) => a + l.size, 0);

test('контекст на контрольных ходах', () => {
  assert.equal(simulate(1, {}, TERRA)[0].ctx, 31000);
  assert.equal(simulate(30, {}, TERRA)[29].ctx, 205000);
  assert.equal(simulate(32, { 31: 'mcp', 32: 'compact' }, TERRA)[31].ctx, 58000);
});

test('стопка равна контексту при любой последовательности событий', () => {
  const scenarios = [{}, { 5: 'mcp' }, { 3: 'compact' }, { 10: 'compact', 11: 'compact' }, { 7: 'mcp', 20: 'compact', 21: 'mcp', 40: 'compact' }];
  for (const events of scenarios) {
    const run = simulate(50, events, TERRA);
    for (let n = 1; n <= 50; n++) assert.equal(sum(layersAt(n, events)), run[n - 1].ctx, `ход ${n}`);
  }
});

test('промах кэша дороже попадания', () => {
  const run = simulate(31, { 31: 'mcp' }, TERRA);
  assert.equal(run[30].miss, true);
  assert.ok(run[30].cost > run[29].cost * 3);
});

test('порог /compact достигается на тридцатом ходу', () => {
  const run = simulate(30, {}, TERRA);
  assert.ok(run[28].ctx < COMPACT_WARN && run[29].ctx >= COMPACT_WARN);
});
