import { ALL_AUDIENCES_FILTER, ALL_CATEGORIES_FILTER, installCommand } from '../data/pack.js';

const COPIED_LABEL = 'Скопировано';
const COPY_FAILED_LABEL = 'Не вышло, выделите текст вручную';
const LABEL_RESET_MS = 2000;
const EMPTY_CART_TEXT = 'Отметьте карточки «В мой набор», и здесь появится команда установки только их.';

function pressOnly(buttons, pressed) {
  for (const button of buttons) button.setAttribute('aria-pressed', String(button === pressed));
}

async function copyText(button, text) {
  const label = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = COPIED_LABEL;
  } catch {
    button.textContent = COPY_FAILED_LABEL;
  }
  setTimeout(() => { button.textContent = label; }, LABEL_RESET_MS);
}

export function initPack() {
  const root = document.getElementById('fig-pack');
  if (!root) return;
  const cards = [...root.querySelectorAll('.pack-skill')];
  const groups = [...root.querySelectorAll('[data-pack-group]')];
  const count = root.querySelector('[data-pack-count]');
  const search = root.querySelector('[data-pack-search]');
  const picks = [...root.querySelectorAll('[data-pack-pick]')];
  const cartStatus = root.querySelector('[data-pack-cart-status]');
  const cartCmd = root.querySelector('[data-pack-cart-cmd]');
  const cartCopy = root.querySelector('[data-pack-cart-copy]');
  const cartReset = root.querySelector('[data-pack-cart-reset]');
  let audience = ALL_AUDIENCES_FILTER;
  let category = ALL_CATEGORIES_FILTER;

  function applyFilters() {
    const needle = search.value.trim().toLowerCase();
    for (const card of cards) {
      const matches = (audience === ALL_AUDIENCES_FILTER || card.dataset.packAud === audience)
        && (category === ALL_CATEGORIES_FILTER || card.dataset.packCat === category)
        && (!needle || card.dataset.packText.includes(needle));
      card.hidden = !matches;
    }
    for (const group of groups) {
      const visible = group.querySelectorAll('.pack-skill:not([hidden])').length;
      group.querySelector('[data-pack-group-count]').textContent = String(visible);
      group.hidden = visible === 0;
    }
    const visibleTotal = cards.filter((card) => !card.hidden).length;
    count.textContent = visibleTotal ? `Показано ${visibleTotal} из ${cards.length}` : 'Ничего не нашлось, попробуйте другое слово';
  }

  function updateCart() {
    const ids = picks.filter((pick) => pick.checked).map((pick) => pick.dataset.packPick);
    for (const card of cards) card.classList.toggle('is-picked', ids.includes(card.dataset.packId));
    const command = installCommand(ids);
    cartCmd.hidden = !command;
    root.querySelector('[data-pack-cart]').classList.toggle('is-active', Boolean(command));
    cartCmd.firstElementChild.textContent = command;
    cartCopy.disabled = !command;
    cartReset.disabled = !command;
    cartStatus.textContent = command ? `В наборе ${ids.length}. Команда для Claude Code:` : EMPTY_CART_TEXT;
  }

  root.addEventListener('click', (event) => {
    const copyButton = event.target.closest('[data-copy]');
    if (copyButton) { copyText(copyButton, copyButton.dataset.copy); return; }

    const installButton = event.target.closest('[data-pack-install]');
    if (installButton) {
      pressOnly(root.querySelectorAll('[data-pack-install]'), installButton);
      for (const panel of root.querySelectorAll('[data-install-panel]')) {
        panel.hidden = panel.dataset.installPanel !== installButton.dataset.packInstall;
      }
      return;
    }

    const audienceButton = event.target.closest('[data-pack-audience]');
    if (audienceButton) {
      audience = audienceButton.dataset.packAudience;
      pressOnly(root.querySelectorAll('[data-pack-audience]'), audienceButton);
      applyFilters();
      return;
    }

    const categoryButton = event.target.closest('[data-pack-category]');
    if (categoryButton) {
      category = categoryButton.dataset.packCategory;
      pressOnly(root.querySelectorAll('[data-pack-category]'), categoryButton);
      applyFilters();
      return;
    }

    if (event.target.closest('[data-pack-cart-copy]')) { copyText(cartCopy, cartCmd.textContent); return; }

    if (event.target.closest('[data-pack-cart-reset]')) {
      for (const pick of picks) pick.checked = false;
      updateCart();
    }
  });

  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-pack-pick]')) updateCart();
  });
  search.addEventListener('input', applyFilters);

  applyFilters();
  updateCart();
}
