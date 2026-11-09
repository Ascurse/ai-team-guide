import * as guideRu from '../content/guide.md';
import * as guideEn from '../content/guide.en.md';
import BriefBuilder from '../components/BriefBuilder.astro';
import ContextSim from '../components/ContextSim.astro';
import DelegationTree from '../components/DelegationTree.astro';
import GuessDemo from '../components/GuessDemo.astro';
import ModelLadder from '../components/ModelLadder.astro';
import ModelPicker from '../components/ModelPicker.astro';
import SessionCurve from '../components/SessionCurve.astro';
import SkillBuilder from '../components/SkillBuilder.astro';
import ToolsCatalog from '../components/ToolsCatalog.astro';
import SkillPack from '../components/SkillPack.astro';
import SpendMap from '../components/SpendMap.astro';
import TaskCycle from '../components/TaskCycle.astro';
import { dataNote } from '../data/freshness.js';
import { addDataNotes } from './data-notes.mjs';
import { buildPages, langBase } from './pages.mjs';

const GUIDES = { ru: guideRu, en: guideEn };

const widgetAnchors = () => [
  { Widget: BriefBuilder, before: { ru: /<h2[^>]*>Контекст<\/h2>/g, en: /<h2[^>]*>Context<\/h2>/g } },
  { Widget: ContextSim, before: { ru: /<h2[^>]*>Проверка<\/h2>/g, en: /<h2[^>]*>Verification<\/h2>/g } },
  { Widget: GuessDemo, before: { ru: /<h2[^>]*>Если не получилось<\/h2>/g, en: /<h2[^>]*>If it fails<\/h2>/g } },
  { Widget: ModelLadder, before: { ru: /<h2[^>]*>Модели в разработке<\/h2>/g, en: /<h2[^>]*>Models for development<\/h2>/g } },
  { Widget: ModelPicker, before: { ru: /<p>Цены API за 1M токенов/g, en: /<p>API prices per 1M tokens/g } },
  { Widget: SkillBuilder, before: { ru: /<p>Где это делается/g, en: /<p>Where this is done/g } },
  { Widget: TaskCycle, before: { ru: /<p><strong>Постановка\.<\/strong>/g, en: /<p><strong>Task setup\.<\/strong>/g } },
  { Widget: DelegationTree, before: { ru: /<h3[^>]*>Как это устроено в Codex<\/h3>/g, en: /<h3[^>]*>How it works in Codex<\/h3>/g } },
  { Widget: SpendMap, before: { ru: /<p>Что режет расход/g, en: /<p>What cuts spending/g } },
  { Widget: SessionCurve, before: { ru: /<p>Что не сработало или вредит/g, en: /<p>What failed or hurts/g } },
  { Widget: ToolsCatalog, before: { ru: /<h2[^>]*>Мой стек/g, en: /<h2[^>]*>My stack/g } },
  { Widget: SkillPack, before: { ru: /<h2[^>]*>Готовый набор/g, en: /<h2[^>]*>Ready-made pack/g } },
];

export async function guidePaths(lang) {
  const guide = GUIDES[lang];
  const widgets = widgetAnchors().map(({ Widget, before }) => ({ Widget, before: before[lang] }));
  // Вики-ссылки vault снимаются здесь: guide.md побайтно совпадает с источником
  const html = addDataNotes((await guide.compiledContent()).replace(/\[\[([^\]]+)\]\]/g, '$1'), dataNote(lang)).replaceAll('<table>', '<div class="tw"><table>').replaceAll('</table>', '</table></div>');
  const base = langBase(import.meta.env.BASE_URL.replace(/\/?$/, '/'), lang);
  const pages = buildPages({ html, headings: guide.getHeadings(), base, widgets, lang });
  return pages.map((current) => ({ params: { page: current.slug || undefined }, props: { current, pages } }));
}
