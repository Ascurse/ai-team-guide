import test from 'node:test';
import assert from 'node:assert/strict';
import { addDataNotes } from '../src/lib/data-notes.mjs';

const NOTE = 'Данные на дату';
const noted = (html) => addDataNotes(html, NOTE);
const notesIn = (html) => html.split('class="data-note"').length - 1;

test('примечание встаёт сразу после блока с ценой', () => {
  assert.equal(noted('<p>Цена $0.23.</p><p>Дальше.</p>'), `<p>Цена $0.23.</p><p class="data-note">${NOTE}</p><p>Дальше.</p>`);
});

test('блок без цен и бенчмарков остаётся без примечания', () => {
  assert.equal(noted('<p>Просто текст.</p>'), '<p>Просто текст.</p>');
});

test('подряд идущие блоки получают одно примечание после последнего', () => {
  const out = noted('<p>$1</p>\n<table><tr><td>$2</td></tr></table>\n<p>конец</p>');
  assert.equal(notesIn(out), 1);
  assert.ok(out.indexOf('</table>') < out.indexOf('data-note'));
});

test('вложенный список не разрывается примечанием', () => {
  const out = noted('<ul><li><ul><li>205K</li></ul></li><li>хвост</li></ul>');
  assert.ok(out.indexOf('хвост') < out.indexOf('data-note'));
  assert.equal(notesIn(out), 1);
});

test('заголовки и код не считаются данными', () => {
  assert.equal(noted('<h2>$5</h2><pre><code>$5</code></pre>'), '<h2>$5</h2><pre><code>$5</code></pre>');
});

test('бенчмарк без знака доллара тоже получает примечание', () => {
  assert.equal(notesIn(noted('<p>Контекст 223K токенов.</p>')), 1);
});

test('английские бенчмарки и пометки об источнике тоже получают примечание', () => {
  assert.equal(notesIn(noted('<p>The Benchmark shows a gap.</p>')), 1);
  assert.equal(notesIn(noted('<p>Failure rate 12% (one source).</p>')), 1);
  assert.equal(notesIn(noted('<p>Failure rate 12% (measured on Opus).</p>')), 1);
  assert.equal(notesIn(noted('<p>Plain English text.</p>')), 0);
});
