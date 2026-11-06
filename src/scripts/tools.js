import { ALL_TOOLS_FILTER } from '../data/tools.js';

export function initTools() {
  const root = document.getElementById('fig-tools');
  const cards = [...root.querySelectorAll('.tool')];
  const count = root.querySelector('[data-tools-count]');

  function showCount(visible) {
    count.textContent = `Показано ${visible} из ${cards.length}`;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tool-filter]');
    if (!button) return;
    const filterId = button.dataset.toolFilter;
    for (const other of root.querySelectorAll('[data-tool-filter]')) other.setAttribute('aria-pressed', String(other === button));
    for (const card of cards) card.hidden = filterId !== ALL_TOOLS_FILTER && !card.dataset.toolTags.split(' ').includes(filterId);
    showCount(cards.filter((card) => !card.hidden).length);
  });

  showCount(cards.length);
}
