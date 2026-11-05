import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CYCLE_EDGES, CYCLE_FRAMES, CYCLE_NODES, VERDICT_NO, VERDICT_YES } from '../src/data/cycle.js';

const ids = CYCLE_NODES.map((node) => node.id);

test('рёбра и кадры ссылаются на существующие узлы', () => {
  CYCLE_EDGES.forEach(({ from, to }) => assert.ok(ids.includes(from) && ids.includes(to), `${from} → ${to}`));
  CYCLE_FRAMES.forEach(({ node }) => assert.ok(ids.includes(node), node));
});

test('соседние кадры идут только по рёбрам схемы', () => {
  CYCLE_FRAMES.slice(1).forEach((frame, i) => {
    const prev = CYCLE_FRAMES[i].node;
    assert.ok(CYCLE_EDGES.some(({ from, to }) => from === prev && to === frame.node), `${prev} → ${frame.node}`);
  });
});

test('проверка сначала говорит «нет», ревью идёт только после «да»', () => {
  const verdicts = CYCLE_FRAMES.filter((frame) => frame.verdict).map((frame) => frame.verdict);
  assert.deepEqual(verdicts, [VERDICT_NO, VERDICT_YES]);
  assert.equal(CYCLE_FRAMES.at(-2).verdict, VERDICT_YES);
  assert.equal(CYCLE_FRAMES.at(-1).node, 'review');
});
