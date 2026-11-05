import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, layersAt, compactCurve, spendAt, OUTPUT_KEEP, PRICES, COMPACT_WARN } from '../src/lib/sim.js';

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

test('/compact окупается за 6–10 ходов и убыточен перед концом задачи', () => {
  const far = compactCurve(50, 30, TERRA);
  assert.ok(far.steps >= 6 && far.steps <= 10, `окупился за ${far.steps}`);
  assert.ok(far.saved > 0);
  const late = compactCurve(32, 30, TERRA);
  assert.equal(late.breakEven, null);
  assert.ok(late.saved < 0);
});

test('до /compact кривые совпадают, суммаризация оплачена на ходу компакта', () => {
  const { plain, compacted } = compactCurve(40, 20, TERRA);
  assert.equal(plain[18], compacted[18]);
  assert.ok(compacted[19] > plain[19]);
});

test('карта расхода: слои равны контексту симуляции', () => {
  const cases = [{}, { outputsKeep: 0.5 }, { outputsKeep: 0.13, toolsShare: 0.25 }];
  for (const opts of cases) {
    const spend = spendAt(30, TERRA, opts);
    assert.ok(Math.abs(sum(spend.layers) - spend.ctx) <= 1);
  }
  assert.equal(spendAt(30, TERRA).ctx, simulate(30, {}, TERRA)[29].ctx);
  assert.equal(spendAt(30, TERRA).total, simulate(30, {}, TERRA)[29].total);
});

test('приёмы экономии снижают цену, а скрытие выводов слабее работы вне контекста', () => {
  const base = spendAt(30, TERRA).total;
  const masked = spendAt(30, TERRA, { outputsKeep: OUTPUT_KEEP.masked }).total;
  const sandbox = spendAt(30, TERRA, { outputsKeep: OUTPUT_KEEP.sandbox }).total;
  assert.ok(sandbox < masked && masked < base);
  assert.ok(spendAt(30, TERRA, { toolsShare: 0.25 }).ctx < spendAt(30, TERRA).ctx);
});

test('в пределах 40 ходов кривая совпадает с гайдом: за 1–4 хода до конца компакт убыточен', () => {
  const price = PRICES['GPT-6.1 Terra'];
  for (let length = 10; length <= 40; length++) {
    for (let left = 1; left <= 4; left++) {
      const at = length - left;
      if (at >= 5) assert.equal(compactCurve(length, at, price).breakEven, null, `${length}/${at}`);
    }
  }
  const { steps } = compactCurve(40, 30, price);
  assert.ok(steps >= 6 && steps <= 10, `окупаемость ${steps}`);
});
