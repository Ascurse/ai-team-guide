import test from 'node:test';
import assert from 'node:assert/strict';
import { TREE_LANES, TREE_NODES, TREE_STEPS, moveOn } from '../src/data/modeltree.js';

const laneIndex = (id) => TREE_LANES.findIndex((lane) => lane.id === id);
const bare = (model) => model.replace('opencode-go/', '').toLowerCase();

test('полосы идут от small до escalate', () => {
  assert.deepEqual(TREE_LANES.map((lane) => lane.id), ['small', 'medium', 'high', 'escalate']);
});

test('квота: следующая строка той же полосы', () => {
  assert.deepEqual(moveOn({ lane: 0, row: 0 }, 'quota'), { lane: 0, row: 1, needsYes: false });
});

test('квота: ту же модель берут у другого вендора', () => {
  const pairs = [['small', 0], ['small', 2], ['medium', 1], ['high', 1], ['high', 3]];
  for (const [id, row] of pairs) {
    const lane = laneIndex(id);
    const next = moveOn({ lane, row }, 'quota');
    const [from, to] = [TREE_LANES[lane].rows[row], TREE_LANES[lane].rows[next.row]];
    assert.notEqual(from.vendor, to.vendor);
    assert.equal(bare(from.model), bare(to.model));
  }
});

test('квота: DeepSeek у Qoder и OpenCode называется по-разному, но это одна модель', () => {
  const rows = TREE_LANES[laneIndex('small')].rows;
  assert.ok(bare(rows[4].model).startsWith('deepseek') && bare(rows[5].model).startsWith('deepseek'));
  assert.notEqual(rows[4].vendor, rows[5].vendor);
});

test('квота на последней строке полосы отдаёт решение человеку', () => {
  assert.deepEqual(moveOn({ lane: laneIndex('medium'), row: 3 }, 'quota'), { stop: true });
});

test('повтор остаётся на той же строке', () => {
  assert.deepEqual(moveOn({ lane: 1, row: 2 }, 'retry'), { lane: 1, row: 2, needsYes: false });
});

test('подъём: первая строка следующей полосы', () => {
  assert.deepEqual(moveOn({ lane: 0, row: 5 }, 'escalate'), { lane: 1, row: 0, needsYes: false });
  assert.deepEqual(moveOn({ lane: laneIndex('high'), row: 3 }, 'escalate'), { lane: laneIndex('escalate'), row: 0, needsYes: false });
});

test('Fable требует «да» и при подъёме, и при квоте', () => {
  const top = laneIndex('escalate');
  assert.deepEqual(moveOn({ lane: top, row: 0 }, 'escalate'), { lane: top, row: 1, needsYes: true });
  assert.deepEqual(moveOn({ lane: top, row: 0 }, 'quota'), { lane: top, row: 1, needsYes: true });
});

test('после Fable подниматься некуда', () => {
  assert.deepEqual(moveOn({ lane: laneIndex('escalate'), row: 1 }, 'escalate'), { stop: true });
});

test('неизвестное событие — ошибка, а не молчаливый повтор', () => {
  assert.throws(() => moveOn({ lane: 0, row: 0 }, 'boom'), /boom/);
});

test('восемь шагов, каждый ссылается на существующие узлы', () => {
  const ids = new Set(TREE_NODES.map((node) => node.id));
  assert.equal(TREE_STEPS.length, 8);
  for (const step of TREE_STEPS) step.nodes.forEach((id) => assert.ok(ids.has(id), `${step.id}: ${id}`));
});
