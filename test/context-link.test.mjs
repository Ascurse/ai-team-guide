import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LINK_KEY, DEFAULT_STATE, parseState, contextAt, publishState, subscribeState,
} from '../src/lib/context-link.js';
import { simulate, PRICES, COMPACT_WARN, FRESH_SESSION_WARN, fmtK } from '../src/lib/sim.js';

const SOL = 'GPT-6.1 Sol';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    data,
  };
}

test('значения счётчика берутся из simulate, а не пересчитываются заново', () => {
  const state = { turn: 30, model: SOL, events: { 10: 'mcp', 20: 'compact' } };
  const expected = simulate(50, state.events, PRICES[SOL])[29];
  const got = contextAt(state);
  assert.equal(got.ctx, expected.ctx);
  assert.equal(got.cost, expected.cost);
  assert.equal(got.total, expected.total);
  assert.equal(got.turn, 30);
});

test('уровень предупреждения совпадает с порогами симулятора', () => {
  assert.equal(contextAt({ turn: 1, model: SOL, events: {} }).level, 'ok');
  const warn = contextAt({ turn: 30, model: SOL, events: {} });
  assert.ok(warn.ctx >= COMPACT_WARN && warn.ctx < FRESH_SESSION_WARN);
  assert.equal(warn.level, 'compact');
  assert.equal(contextAt({ turn: 50, model: SOL, events: {} }).level, 'fresh');
});

test('компактификация в симуляторе опускает счётчик', () => {
  const before = contextAt({ turn: 30, model: SOL, events: {} });
  const after = contextAt({ turn: 30, model: SOL, events: { 30: 'compact' } });
  assert.ok(after.ctx < before.ctx);
  // 9K системного + 16K инструментов + выжимка 15K + один новый ход 6K
  assert.equal(fmtK(after.ctx), '46K');
});

test('без сохранённого состояния берётся ход и модель по умолчанию, как в ContextSim', () => {
  assert.deepEqual(parseState(null), DEFAULT_STATE);
  assert.equal(DEFAULT_STATE.turn, 22);
  assert.equal(DEFAULT_STATE.model, Object.keys(PRICES)[0]);
});

test('битое или чужое состояние не ломает счётчик', () => {
  for (const raw of ['{', '"x"', '{"turn":0,"model":"GPT-6.1 Sol"}', '{"turn":51,"model":"GPT-6.1 Sol"}', '{"turn":5,"model":"нет такой"}', '{"turn":"7","model":"GPT-6.1 Sol"}']) {
    assert.deepEqual(parseState(raw), DEFAULT_STATE, raw);
  }
});

test('из событий остаются только известные типы на допустимых ходах', () => {
  const raw = JSON.stringify({ turn: 12, model: SOL, events: { 3: 'mcp', 4: 'drop', 99: 'mcp', x: 'compact' } });
  assert.deepEqual(parseState(raw).events, { 3: 'mcp' });
});

test('publishState пишет в хранилище и сообщает в том же документе', () => {
  const storage = fakeStorage();
  const target = new EventTarget();
  const seen = [];
  target.addEventListener('context-sim:change', (e) => seen.push(e.detail));
  const state = { turn: 9, model: SOL, events: { 4: 'mcp' } };
  publishState(state, { storage, target });
  assert.deepEqual(JSON.parse(storage.data[LINK_KEY]), state);
  assert.deepEqual(seen, [state]);
});

test('publishState не падает, когда хранилище недоступно', () => {
  const storage = { setItem() { throw new Error('QuotaExceededError'); } };
  const target = new EventTarget();
  let called = 0;
  target.addEventListener('context-sim:change', () => { called += 1; });
  assert.doesNotThrow(() => publishState(DEFAULT_STATE, { storage, target }));
  assert.equal(called, 1);
});

test('subscribeState: получает изменения из другой вкладки и из того же документа', () => {
  const doc = new EventTarget();
  const win = new EventTarget();
  const got = [];
  const stop = subscribeState((state) => got.push(state), { target: doc, win });

  const remote = { turn: 40, model: SOL, events: {} };
  const crossTab = new Event('storage');
  Object.assign(crossTab, { key: LINK_KEY, newValue: JSON.stringify(remote) });
  win.dispatchEvent(crossTab);

  const otherKey = new Event('storage');
  Object.assign(otherKey, { key: 'чужой-ключ', newValue: '{}' });
  win.dispatchEvent(otherKey);

  const local = { turn: 3, model: SOL, events: {} };
  publishState(local, { storage: fakeStorage(), target: doc });

  assert.deepEqual(got, [remote, local]);

  stop();
  win.dispatchEvent(crossTab);
  assert.equal(got.length, 2);
});

test('subscribeState: очистка хранилища в другой вкладке возвращает значения по умолчанию', () => {
  const win = new EventTarget();
  const got = [];
  subscribeState((state) => got.push(state), { target: new EventTarget(), win });
  const cleared = new Event('storage');
  Object.assign(cleared, { key: LINK_KEY, newValue: null });
  win.dispatchEvent(cleared);
  assert.deepEqual(got, [DEFAULT_STATE]);
});
