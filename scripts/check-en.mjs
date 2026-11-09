// Ручная проверка английской версии после `yarn build && yarn offline`. В CI не входит
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../src/lib/pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OFFLINE = join(ROOT, 'dist-offline');
const CYRILLIC = /[Ѐ-ӿ]+/g;
const MAX_SHOWN_PER_FILE = 5;
const SNIPPET_RADIUS = 30;

const ALLOWED = [
  // Подпись переключателя языка
  /<a [^>]*class="[^"]*lang-switch[^>]*>Русский<\/a>/g,
  // description из SKILL.md: цитата из архива скиллов, он остаётся частично на русском
  /<details class="pack-desc">[\s\S]*?<\/details>/g,
];
const WIDGET = /<section class="fig"/g;
const AUTO_LINK = { ru: /<a href="[^"]*">«[^<]*»<\/a>/g, en: /<a href="[^"]*">“[^<]*”<\/a>/g };

const PAIRS = [
  ...PAGES.map(({ slug }) => ({
    name: join('en', slug, 'index.html'),
    en: join(DIST, 'en', slug, 'index.html'),
    ru: join(DIST, slug, 'index.html'),
  })),
  { name: 'ai-team-guide.en.html', en: join(OFFLINE, 'ai-team-guide.en.html'), ru: join(OFFLINE, 'ai-team-guide.html') },
];

const count = (text, pattern) => (text.match(pattern) ?? []).length;
const withoutCode = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');

function cyrillicHits(html) {
  const text = ALLOWED.reduce((rest, pattern) => rest.replace(pattern, ''), withoutCode(html));
  return [...text.matchAll(CYRILLIC)].map((match) => text.slice(Math.max(0, match.index - SNIPPET_RADIUS), match.index + match[0].length + SNIPPET_RADIUS).replace(/\s+/g, ' '));
}

function checkPair({ name, en, ru }) {
  const missing = [en, ru].filter((path) => !existsSync(path));
  if (missing.length) return [`нет файла ${missing.join(', ')}: сначала yarn build && yarn offline`];
  const enHtml = readFileSync(en, 'utf8');
  const ruHtml = readFileSync(ru, 'utf8');
  const problems = [];
  const hits = cyrillicHits(enHtml);
  if (hits.length) {
    problems.push(`кириллица: ${hits.length} вхождений`);
    problems.push(...hits.slice(0, MAX_SHOWN_PER_FILE).map((hit) => `  …${hit}…`));
  }
  const widgets = [count(enHtml, WIDGET), count(ruHtml, WIDGET)];
  if (widgets[0] !== widgets[1]) problems.push(`виджеты: en ${widgets[0]}, ru ${widgets[1]}`);
  const links = [count(enHtml, AUTO_LINK.en), count(ruHtml, AUTO_LINK.ru)];
  if (links[0] !== links[1]) problems.push(`автоссылки на разделы: en ${links[0]}, ru ${links[1]}`);
  return problems.map((problem) => `${name}: ${problem}`);
}

const problems = PAIRS.flatMap(checkPair);
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\ncheck:en не пройдена: проблем ${problems.length}`);
  process.exit(1);
}
console.log(`check:en пройдена: файлов ${PAIRS.length}`);
