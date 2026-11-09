import { T } from './lang.js';

const LABEL_RESET_MS = 2000;

export function initSkill() {
  const root = document.getElementById('fig-skill');

  async function copy(button) {
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = T.copy.copied;
    } catch {
      button.textContent = T.copy.failed;
    }
    setTimeout(() => { button.textContent = label; }, LABEL_RESET_MS);
  }

  root.addEventListener('click', (event) => {
    const copyButton = event.target.closest('[data-copy]');
    if (copyButton) { copy(copyButton); return; }
    const button = event.target.closest('[data-routine]');
    if (!button) return;
    for (const other of root.querySelectorAll('[data-routine]')) other.setAttribute('aria-pressed', String(other === button));
    for (const panel of root.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== button.dataset.routine;
  });
}
