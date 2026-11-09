import { ALL_CATEGORIES_FILTER, ALL_TOOLS_FILTER } from '../data/tools.js';
import { T } from './lang.js';

export function initTools() {
  const root = document.getElementById('fig-tools');
  const cards = [...root.querySelectorAll('.tool')];
  const groups = [...root.querySelectorAll('[data-tool-group]')];
  const count = root.querySelector('[data-tools-count]');
  let activeFilter = ALL_TOOLS_FILTER;
  let activeCategory = ALL_CATEGORIES_FILTER;

  function applyFilters() {
    for (const card of cards) {
      const matchesTag = activeFilter === ALL_TOOLS_FILTER || card.dataset.toolTags.split(' ').includes(activeFilter);
      const matchesCategory = activeCategory === ALL_CATEGORIES_FILTER || card.dataset.toolCat === activeCategory;
      card.hidden = !(matchesTag && matchesCategory);
    }

    for (const group of groups) {
      const visibleInGroup = group.querySelectorAll('.tool:not([hidden])').length;
      const badge = group.querySelector('[data-group-count]');
      if (badge) badge.textContent = String(visibleInGroup);
      group.hidden = visibleInGroup === 0;
    }

    const visibleTotal = cards.filter((card) => !card.hidden).length;
    count.textContent = T.tools.shown(visibleTotal, cards.length);
  }

  root.addEventListener('click', (event) => {
    const filterBtn = event.target.closest('[data-tool-filter]');
    if (filterBtn) {
      activeFilter = filterBtn.dataset.toolFilter;
      for (const other of root.querySelectorAll('[data-tool-filter]')) {
        other.setAttribute('aria-pressed', String(other === filterBtn));
      }
      applyFilters();
      return;
    }

    const categoryBtn = event.target.closest('[data-tool-category]');
    if (categoryBtn) {
      activeCategory = categoryBtn.dataset.toolCategory;
      for (const other of root.querySelectorAll('[data-tool-category]')) {
        other.setAttribute('aria-pressed', String(other === categoryBtn));
      }
      applyFilters();
    }
  });

  applyFilters();
}
