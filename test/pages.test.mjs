import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGES, buildPages, langBase, linkReferences, otherLang, pageUrl } from '../src/lib/pages.mjs';

const BASE = '/g/';
const Widget = () => 'widget';
const heading = (depth, text, slug) => ({ depth, text, slug });
const html = PAGES.map((page, i) => `<h1 id="p${i}">Страница ${i}</h1><p>Текст ${i}</p><h2 id="s${i}">Раздел ${i}</h2><p>Тело ${i}</p>`).join('\n');
const headings = PAGES.flatMap((page, i) => [heading(1, `Страница ${i}`, `p${i}`), heading(2, `Раздел ${i}`, `s${i}`)]);
const built = (widgets = []) => buildPages({ html, headings, base: BASE, widgets });

test('семь страниц, главная лежит в корне', () => {
  assert.equal(PAGES.length, 7);
  assert.equal(pageUrl(BASE, PAGES[0].slug), '/g/');
  assert.equal(pageUrl(BASE, PAGES[4].slug), '/g/models/');
});

test('главная отдаёт заголовок и абзац в шапку, остальные оставляют h1 в тексте', () => {
  const [home, second] = built();
  assert.equal(home.title, 'Страница 0');
  assert.equal(home.summary, 'Текст 0');
  assert.ok(!home.tail.includes('<h1'));
  assert.ok(second.tail.startsWith('<h1 id="p1"'));
});

test('оглавление страницы — только её разделы', () => {
  const [, second] = built();
  assert.equal(second.anchor, 'p1');
  assert.deepEqual(second.subs.map((s) => s.slug), ['s1']);
});

test('соседи: у главной нет «назад», у последней нет «дальше»', () => {
  const pages = built();
  assert.equal(pages[0].prev, undefined);
  assert.equal(pages[0].next.slug, PAGES[1].slug);
  assert.equal(pages.at(-1).next, undefined);
  assert.equal(pages.at(-1).prev.slug, PAGES.at(-2).slug);
});

test('виджет встаёт перед своим якорем на своей странице', () => {
  const pages = built([{ Widget, before: /<h2[^>]*>Раздел 2<\/h2>/g }]);
  assert.equal(pages[2].parts.length, 1);
  assert.ok(pages[2].parts[0].html.endsWith('<p>Текст 2</p>'));
  assert.equal(pages[2].parts[0].Widget, Widget);
  assert.ok(pages[2].tail.startsWith('<h2'));
  assert.equal(pages[3].parts.length, 0);
});

test('якорь обязан найтись ровно один раз на всём гайде', () => {
  assert.throws(() => built([{ Widget, before: /<h2[^>]*>Нет такого<\/h2>/g }]), /найден 0 раз/);
  assert.throws(() => built([{ Widget, before: /<h2[^>]*>Раздел \d<\/h2>/g }]), /найден 7 раз/);
});

test('неверное число h1 валит сборку', () => {
  assert.throws(() => buildPages({ html: '<h1>Одна</h1><p>x</p>', headings, base: BASE, widgets: [] }), /страниц/);
});

const INDEX = new Map([
  ['Модели и цены', { slug: 'models', id: 'm' }],
  ['Цены и замеры', { slug: 'models', id: 'prices', section: true }],
]);

test('ссылка на раздел другой страницы ведёт на страницу с якорем', () => {
  assert.equal(linkReferences('<p>см. «Цены и замеры»</p>', INDEX, 'dev', BASE), '<p>см. <a href="/g/models/#prices">«Цены и замеры»</a></p>');
});

test('ссылка на страницу ведёт на её адрес, внутри страницы — на якорь', () => {
  assert.equal(linkReferences('<p>«Модели и цены»</p>', INDEX, 'dev', BASE), '<p><a href="/g/models/">«Модели и цены»</a></p>');
  assert.equal(linkReferences('<p>«Цены и замеры»</p>', INDEX, 'models', BASE), '<p><a href="#prices">«Цены и замеры»</a></p>');
});

test('незнакомые кавычки, код, заголовки и готовые ссылки не трогаются', () => {
  for (const source of ['<p>«просто цитата»</p>', '<code>«Цены и замеры»</code>', '<pre>«Цены и замеры»</pre>', '<h2>«Цены и замеры»</h2>', '<a href="x">«Цены и замеры»</a>']) {
    assert.equal(linkReferences(source, INDEX, 'dev', BASE), source);
  }
});

test('раздел с повторяющимся названием в ссылки не попадает', () => {
  const repeated = [...headings, heading(2, 'Как не надо', 'a'), heading(2, 'Как не надо', 'b')];
  const withText = html.replace('<p>Тело 1</p>', '<p>«Как не надо» и «Раздел 3»</p>');
  const [, second] = buildPages({ html: withText, headings: repeated, base: BASE, widgets: [] });
  assert.ok(second.tail.includes('<p>«Как не надо» и <a href="/g/advanced/#s3">«Раздел 3»</a></p>'));
});

test('название раздела в ссылке берётся до двоеточия и скобки', () => {
  const custom = [...headings, heading(2, 'Обвязка (harness)', 'h'), heading(2, 'Гигиена: раз в месяц', 'g')];
  const withText = html.replace('<p>Тело 1</p>', '<p>«Обвязка» и «Гигиена»</p>');
  const [, second] = buildPages({ html: withText, headings: custom, base: BASE, widgets: [] });
  assert.ok(second.tail.includes('«Обвязка»</a>') && second.tail.includes('«Гигиена»</a>'));
});

const EN_BASE = langBase(BASE, 'en');
const enHtml = PAGES.map((page, i) => `<h1 id="p${i}">Page ${i}</h1><p>Text ${i}</p><h2 id="s${i}">Section ${i}</h2><p>Body ${i}</p>`).join('\n');
const enHeadings = PAGES.flatMap((page, i) => [heading(1, `Page ${i}`, `p${i}`), heading(2, `Section ${i}`, `s${i}`)]);
const builtEn = (source = enHtml, list = enHeadings) => buildPages({ html: source, headings: list, base: EN_BASE, widgets: [], lang: 'en' });

test('английские страницы лежат под en/ с теми же адресами', () => {
  assert.equal(EN_BASE, '/g/en/');
  assert.equal(langBase(BASE, 'ru'), BASE);
  assert.equal(pageUrl(EN_BASE, PAGES[4].slug), '/g/en/models/');
  assert.equal(pageUrl(EN_BASE, PAGES[0].slug), '/g/en/');
  assert.equal(otherLang('ru'), 'en');
  assert.equal(otherLang('en'), 'ru');
});

test('навигация своя у каждого языка', () => {
  assert.deepEqual(builtEn().map((page) => page.nav), ['Home', 'For everyone', 'For developers', 'Advanced', 'Models and pricing', 'Tools', 'Download']);
  assert.deepEqual(built().map((page) => page.nav), ['Главная', 'Для всех', 'Для разработки', 'Продвинутое', 'Модели и цены', 'Инструменты', 'Скачать']);
  const [home, second] = builtEn();
  assert.equal(home.next.nav, 'For everyone');
  assert.equal(second.prev.nav, 'Home');
});

const EN_INDEX = new Map([
  ['Models and pricing', { slug: 'models', id: 'm' }],
  ['Prices', { slug: 'models', id: 'prices', section: true }],
]);

test('в английском ссылкой становятся типографские кавычки', () => {
  assert.equal(linkReferences('<p>see “Prices”</p>', EN_INDEX, 'dev', EN_BASE, 'en'), '<p>see <a href="/g/en/models/#prices">“Prices”</a></p>');
  assert.equal(linkReferences('<p>“Models and pricing”</p>', EN_INDEX, 'dev', EN_BASE, 'en'), '<p><a href="/g/en/models/">“Models and pricing”</a></p>');
  assert.equal(linkReferences('<p>“Prices”</p>', EN_INDEX, 'models', EN_BASE, 'en'), '<p><a href="#prices">“Prices”</a></p>');
});

test('кавычки чужого языка, код и незнакомые названия в английском не трогаются', () => {
  for (const source of ['<p>«Prices»</p>', '<p>"Prices"</p>', '<p>“some quote”</p>', '<code>“Prices”</code>', '<h2>“Prices”</h2>', '<a href="x">“Prices”</a>']) {
    assert.equal(linkReferences(source, EN_INDEX, 'dev', EN_BASE, 'en'), source);
  }
  assert.equal(linkReferences('<p>“Цены и замеры”</p>', INDEX, 'dev', BASE), '<p>“Цены и замеры”</p>');
});

test('в английском название раздела тоже берётся до двоеточия и скобки', () => {
  const custom = [...enHeadings, heading(2, 'Harness (tooling)', 'h'), heading(2, 'Hygiene: monthly', 'g')];
  const withText = enHtml.replace('<p>Body 1</p>', '<p>“Harness” and “Hygiene” and “For developers”</p>');
  const [, second] = builtEn(withText, custom);
  assert.ok(second.tail.includes('<a href="#h">') === false);
  assert.ok(second.tail.includes('“Harness”</a>') && second.tail.includes('“Hygiene”</a>'));
  assert.ok(second.tail.includes('<a href="/g/en/dev/">“For developers”</a>'));
});
