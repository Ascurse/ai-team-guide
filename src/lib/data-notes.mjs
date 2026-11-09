const PRICE = /\$\d/;
const BENCHMARK = /бенчмарк|[Bb]enchmark|SWE-bench|Artificial Analysis|BenchLM|\d\s?K\b|\d\s?%[^\n]*\((?:замер|один источник|measured|one source|single source)/;
const BLOCK_TAG = /<(\/?)(p|ul|ol|table|blockquote|pre|h[1-6])\b[^>]*>/g;

function topLevelBlocks(html) {
  const blocks = [];
  let depth = 0;
  let start = 0;
  for (const tag of html.matchAll(BLOCK_TAG)) {
    if (tag[1]) depth -= 1;
    else {
      if (depth === 0) start = tag.index;
      depth += 1;
    }
    if (depth === 0) blocks.push({ name: tag[2], start, end: tag.index + tag[0].length });
  }
  return blocks;
}

const plainText = (html) => html.replace(/<\/(?:li|tr)>/g, '\n').replace(/<[^>]+>/g, '');
const hasData = ({ name }, html) => name !== 'pre' && !/^h\d$/.test(name) && (PRICE.test(plainText(html)) || BENCHMARK.test(plainText(html)));

// Примечание ставится при сборке, чтобы guide.md оставался копией источника
export function addDataNotes(html, note) {
  const blocks = topLevelBlocks(html);
  const flags = blocks.map((block) => hasData(block, html.slice(block.start, block.end)));
  const insertAt = blocks.filter((_, i) => flags[i] && !flags[i + 1]).map((block) => block.end);
  let out = '';
  let from = 0;
  for (const at of insertAt) {
    out += `${html.slice(from, at)}<p class="data-note">${note}</p>`;
    from = at;
  }
  return out + html.slice(from);
}
