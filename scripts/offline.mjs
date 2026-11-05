// Один HTML для релизов: стили, шрифты и скрипты внутри файла, сеть не нужна
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'dist-offline/ai-team-guide.html');
const BASE = '/ai-team-guide/';
const MIME = { '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const distPath = (url) => join(DIST, url.replace(BASE, ''));

function inlineAssets(css) {
  return css.replace(/url\((["']?)(\/ai-team-guide\/[^"')]+)\1\)/g, (_, __, url) => {
    const data = readFileSync(distPath(url)).toString('base64');
    return `url(data:${MIME[extname(url)]};base64,${data})`;
  });
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

let html = readFileSync(join(DIST, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g, (_, url) => `<style>${inlineAssets(readFileSync(distPath(url), 'utf8'))}</style>`);
html = html.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${inlineAssets(css)}</style>`);
// Минификатор срезает комментарии, а линтер читает решения из шапки CSS
const lintHeader = readFileSync(join(ROOT, 'src/styles/base.css'), 'utf8').match(/^(?:\/\*.*\*\/\n)+/)[0];
html = html.replace('<style>', () => `<style>${lintHeader}`);
html = html.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, '');
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
html = html.replace(/<link rel="icon"[^>]*>/, '');
html = html.replace('</body>', () => `<script>${script}</script></body>`);

if (/(src|href)="\/ai-team-guide\//.test(html)) throw new Error('В офлайн-файле осталась внешняя ссылка');
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log(`${OUT}: ${Math.round(html.length / 1024)} KB`);
