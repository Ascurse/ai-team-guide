export const PAGES = [
  { slug: '', nav: { ru: 'Главная', en: 'Home' } },
  { slug: 'everyone', nav: { ru: 'Для всех', en: 'For everyone' } },
  { slug: 'dev', nav: { ru: 'Для разработки', en: 'For developers' } },
  { slug: 'advanced', nav: { ru: 'Продвинутое', en: 'Advanced' } },
  { slug: 'models', nav: { ru: 'Модели и цены', en: 'Models and pricing' } },
  { slug: 'tools', nav: { ru: 'Инструменты', en: 'Tools' } },
  { slug: 'download', nav: { ru: 'Скачать', en: 'Download' } },
];

const EN_PATH = 'en/';

const MAX_REFERENCE_DEPTH = 3;
const INTRO = /^\s*<h1[^>]*>(.*?)<\/h1>\s*<p>(.*?)<\/p>/s;
const SKIPPED_TAGS = String.raw`<(code|pre|a|h[1-6])\b[^>]*>[\s\S]*?<\/\1>`;
// В английском markdown пишут прямые кавычки, до этого места они доходят типографскими после smartypants
const REFERENCE = {
  ru: new RegExp(`${SKIPPED_TAGS}|«([^«»<]+)»`, 'g'),
  en: new RegExp(`${SKIPPED_TAGS}|“([^“”<]+)”`, 'g'),
};

export const pageUrl = (base, slug) => (slug ? `${base}${slug}/` : base);
export const langBase = (base, lang) => (lang === 'en' ? `${base}${EN_PATH}` : base);
export const otherLang = (lang) => (lang === 'en' ? 'ru' : 'en');

function groupHeadings(headings) {
  const groups = [];
  for (const heading of headings) {
    if (heading.depth === 1) groups.push({ ...heading, items: [] });
    else groups.at(-1).items.push(heading);
  }
  return groups;
}

function buildReferenceIndex(groups, pages) {
  const index = new Map();
  groups.forEach((group, i) => {
    for (const heading of group.items.filter((item) => item.depth <= MAX_REFERENCE_DEPTH)) {
      // В тексте раздел называют коротко: «Обвязка» вместо «Обвязка (harness)»
      const name = heading.text.split(/[:(]/)[0].trim();
      index.set(name, index.has(name) ? null : { slug: pages[i].slug, id: heading.slug, section: true });
    }
  });
  groups.forEach((group, i) => index.set(pages[i].nav, { slug: pages[i].slug, id: group.slug }));
  return index;
}

export function linkReferences(html, index, currentSlug, base, lang = 'ru') {
  return html.replace(REFERENCE[lang], (match, skippedTag, name) => {
    const target = skippedTag ? null : index.get(name);
    if (!target) return match;
    const pageHref = pageUrl(base, target.slug);
    const href = target.slug === currentSlug ? `#${target.id}` : target.section ? `${pageHref}#${target.id}` : pageHref;
    return `<a href="${href}">${match}</a>`;
  });
}

function placeWidgets(bodies, widgets) {
  const placements = bodies.map(() => []);
  for (const { Widget, before } of widgets) {
    const found = bodies.flatMap((body, page) => [...body.matchAll(before)].map((match) => ({ page, at: match.index })));
    if (found.length !== 1) throw new Error(`Якорь ${before} найден ${found.length} раз`);
    placements[found[0].page].push({ Widget, at: found[0].at });
  }
  return placements.map((cuts) => cuts.sort((a, b) => a.at - b.at));
}

export function buildPages({ html, headings, base, widgets, lang = 'ru' }) {
  const pages = PAGES.map((page) => ({ slug: page.slug, nav: page.nav[lang] }));
  const chunks = html.split(/(?=<h1[\s>])/).filter((chunk) => chunk.trim());
  if (chunks.length !== pages.length) throw new Error(`Ожидалось ${pages.length} страниц, в гайде ${chunks.length}`);

  const groups = groupHeadings(headings);
  const index = buildReferenceIndex(groups, pages);
  const linked = chunks.map((chunk, i) => linkReferences(chunk, index, pages[i].slug, base, lang));
  const intro = linked[0].match(INTRO);
  if (!intro) throw new Error('Гайд должен начинаться с заголовка и абзаца');

  const bodies = linked.map((chunk, i) => (i ? chunk : chunk.slice(intro[0].length)));
  const placements = placeWidgets(bodies, widgets);

  return bodies.map((body, i) => {
    const cuts = placements[i];
    return {
      ...pages[i],
      title: i ? groups[i].text : intro[1],
      summary: i ? undefined : intro[2],
      anchor: groups[i].slug,
      subs: groups[i].items.filter((item) => item.depth === 2),
      parts: cuts.map((cut, n) => ({ html: body.slice(n ? cuts[n - 1].at : 0, cut.at), Widget: cut.Widget })),
      tail: body.slice(cuts.at(-1)?.at ?? 0),
      prev: pages[i - 1],
      next: pages[i + 1],
    };
  });
}
