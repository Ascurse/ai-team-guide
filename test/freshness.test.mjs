import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_DATE, dataNote } from '../src/data/freshness.js';

test('дата данных одна, подпись локализована', () => {
  assert.equal(DATA_DATE, '2026-11-05');
  assert.equal(dataNote('ru'), 'Данные на 5 ноября 2026; могут устареть');
  assert.equal(dataNote('en'), 'Data as of November 5, 2026; may go out of date');
});
