// Один HTML для релизов: стили, шрифты и скрипты внутри файла, сеть не нужна
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { PAGES } from '../src/lib/pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT_DIR = join(ROOT, 'dist-offline');
const BASE = '/ai-team-guide/';
const SITE_URL = 'https://ascurse.github.io/ai-team-guide/';
const MIME = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
const ARTICLE = /<article class="page"[^>]*>[\s\S]*?<\/article>/;
const PAGER = /<nav class="pager"[\s\S]*?<\/nav>/;
const CURRENT_TOC_PART = /<div class="toc-part current">[\s\S]*?<\/div><\/div>/;
const distPath = (url) => join(DIST, url.replace(BASE, ''));
const BUILDS = [
  { pageBase: BASE, file: 'ai-team-guide.html' },
  { pageBase: `${BASE}en/`, file: 'ai-team-guide.en.html' },
];

function inlineAssets(css) {
  return css.replace(/url\((["']?)(\/ai-team-guide\/[^"')]+)\1\)/g, (_, __, url) => {
    const data = readFileSync(distPath(url)).toString('base64');
    return `url(data:${MIME[extname(url)]};base64,${data})`;
  });
}

const pageStyles = (html) => [...html.matchAll(/<link rel="stylesheet"[^>]*>|<style[\s\S]*?<\/style>/g)].join('');

function extract(html, pattern, slug) {
  const found = html.match(pattern);
  if (!found) throw new Error(`Страница «${slug}»: не найдено ${pattern}`);
  return found[0];
}

// Офлайн остаётся одной лентой: шелл главной, статьи всех страниц подряд, разделы всех страниц в оглавлении
function mergePages({ pageBase }) {
  const pages = PAGES.map(({ slug }) => {
    const html = readFileSync(join(DIST, pageBase.replace(BASE, ''), slug, 'index.html'), 'utf8');
    const toc = extract(html, CURRENT_TOC_PART, slug);
    return {
      slug,
      html,
      article: extract(html, ARTICLE, slug).replace(PAGER, ''),
      toc: toc.replace('toc-part current', 'toc-part'),
      anchor: toc.match(/class="l1" href="#([^"]+)"/)[1],
    };
  });
  const [home] = pages;
  for (const page of pages) {
    if (pageStyles(page.html) !== pageStyles(home.html)) throw new Error(`Страница «${page.slug}»: стили отличаются от главной, в офлайн-файл они не попадут`);
  }

  const toc = pages.map((page) => page.toc).join('');
  const anchors = new Map(pages.map((page) => [page.slug, page.anchor]));
  const pageSlugs = pages.map((page) => page.slug).filter(Boolean).join('|');
  const pageLink = new RegExp(`href="${pageBase}(?:(${pageSlugs})/)?(#[^"]*)?"`, 'g');
  return home.html
    .replace(/(<nav class="toc"[^>]*>)[\s\S]*?(<\/nav>)/, (_, open, close) => open + toc + close)
    .replace(/(<div class="toc-list">)[\s\S]*?(<\/div><\/details>)/, (_, open, close) => open + toc + close)
    .replace(ARTICLE, () => pages.map((page) => page.article).join('\n'))
    .replace(pageLink, (_, slug = '', hash) => `href="${hash ?? `#${anchors.get(slug)}`}"`);
}

const bundled = await build({
  entryPoints: [join(ROOT, 'src/scripts/main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
});
const script = bundled.outputFiles[0].text.replaceAll('</script', '<\\/script');

mkdirSync(OUT_DIR, { recursive: true });
for (const target of BUILDS) {
  let html = mergePages(target);
  html = html.replace(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g, (_, url) => `<style>${inlineAssets(readFileSync(distPath(url), 'utf8'))}</style>`);
  html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${inlineAssets(css)}</style>`);
  // Минификатор срезает комментарии, а линтер читает решения из шапки CSS
  const lintHeader = readFileSync(join(ROOT, 'src/styles/base.css'), 'utf8').match(/^(?:\/\*.*\*\/\n)+/)[0];
  html = html.replace('<style>', () => `<style>${lintHeader}`);
  html = html.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, '');
  html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
  html = html.replace(/<link rel="icon"[^>]*>/, '');
  html = html.replace('</body>', () => `<script>${script}</script></body>`);
  // Картинки встраиваются в файл, ссылки на скачивание (архив, SKILL.md) ведут на опубликованный сайт
  html = html.replace(/src="(\/ai-team-guide\/[^"]+)"/g, (_, url) => {
    const data = readFileSync(distPath(url)).toString('base64');
    return `src="data:${MIME[extname(url)]};base64,${data}"`;
  });
  html = html.replace(/href="\/ai-team-guide\//g, `href="${SITE_URL}`);

  if (/(src|href)="\/ai-team-guide\//.test(html)) throw new Error('В офлайн-файле осталась внешняя ссылка');
  const out = join(OUT_DIR, target.file);
  writeFileSync(out, html);
  console.log(`${out}: ${Math.round(html.length / 1024)} KB`);
}
