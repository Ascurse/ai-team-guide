import { BRIEF_PARTS, BRIEF_RESULTS, briefFile, briefMask } from '../data/brief.js';

export function initBrief() {
  const root = document.getElementById('fig-brief');
  const { base } = root.dataset;
  const result = document.getElementById('brief-result');
  const sample = document.getElementById('brief-sample');
  const msg = document.getElementById('brief-msg');
  const on = {};

  function render() {
    for (const part of BRIEF_PARTS) {
      root.querySelector(`[data-part="${part.id}"]`).setAttribute('aria-pressed', String(Boolean(on[part.id])));
      root.querySelector(`[data-text="${part.id}"]`).hidden = !on[part.id];
    }
    sample.hidden = !on.example;
    const mask = briefMask(on);
    result.src = base + briefFile(mask);
    result.alt = BRIEF_RESULTS[mask].alt;
    msg.textContent = BRIEF_RESULTS[mask].note;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-part]');
    if (!button) return;
    on[button.dataset.part] = !on[button.dataset.part];
    render();
  });

  // Варианты грузятся на подходе к блоку, чтобы переключение было без пустого кадра
  const preload = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    preload.disconnect();
    BRIEF_RESULTS.forEach((_, mask) => { new Image().src = base + briefFile(mask); });
  }, { rootMargin: '600px' });
  preload.observe(root);
}
