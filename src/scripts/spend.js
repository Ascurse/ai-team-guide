import { MAX_SCALE, OUTPUT_KEEP, PRICES, fmtK, money, spendAt } from '../lib/sim.js';

const $ = (id) => document.getElementById(id);
const PRICE = PRICES['GPT-6.1 Terra'];
const TOOLS_KEPT = 0.25;
const TOWER_SPOTS = [-2.5, 2.5];
const TOWER_WIDTH = 2.2;
const TOWER_MARGIN = 0.8;
const LOAD_AHEAD = '300px';

const MESSAGES = {
  none: 'Выводы инструментов занимают большую часть истории, поэтому экономить надо на них.',
  tools: 'Схемы лежат в контексте с первого хода. Набор сужайте до начала сессии, посреди неё смена сбросит кэш.',
  masked: 'Старые выводы скрыты: то же качество вдвое дешевле (один источник).',
  sandbox: 'Скрипт считает вне контекста, в чат приходит ответ. Сырьё остаётся доступно через поиск: ошибку в логе модель должна видеть дословно.',
};

export function initSpend() {
  const turn = $('m-turn');
  const buttons = { tools: $('m-tools'), masked: $('m-masked'), sandbox: $('m-sandbox') };
  const opts = { tools: false, outputs: null };
  let scene = null;

  const setFlat = (id, layers) => {
    [...$(id).children].forEach((bar, i) => { bar.style.width = `${(layers[i].size / MAX_SCALE) * 100}%`; });
  };

  function render() {
    const n = +turn.value;
    const base = spendAt(n, PRICE);
    const now = spendAt(n, PRICE, {
      outputsKeep: OUTPUT_KEEP[opts.outputs ?? 'all'],
      toolsShare: opts.tools ? TOOLS_KEPT : 1,
    });
    $('m-n').textContent = n;
    $('m-ctx').textContent = fmtK(now.ctx);
    $('m-total').textContent = money(now.total);
    $('m-saved').textContent = `${Math.round((1 - now.total / base.total) * 100)}%`;
    $('m-msg').textContent = MESSAGES[opts.outputs ?? (opts.tools ? 'tools' : 'none')];
    buttons.tools.setAttribute('aria-pressed', String(opts.tools));
    buttons.masked.setAttribute('aria-pressed', String(opts.outputs === 'masked'));
    buttons.sandbox.setAttribute('aria-pressed', String(opts.outputs === 'sandbox'));
    setFlat('m-flat-base', base.layers);
    setFlat('m-flat-now', now.layers);
    if (scene) {
      const tower = (result, spot) => result.layers.map((l) => ({ ...l, id: `${spot}-${l.id}`, spot }));
      scene.show([...tower(base, 0), ...tower(now, 1)], new Set());
    }
  }

  const toggleOutputs = (name) => () => {
    opts.outputs = opts.outputs === name ? null : name;
    render();
  };
  turn.oninput = render;
  buttons.tools.onclick = () => { opts.tools = !opts.tools; render(); };
  buttons.masked.onclick = toggleOutputs('masked');
  buttons.sandbox.onclick = toggleOutputs('sandbox');
  render();

  async function loadScene() {
    if (!document.createElement('canvas').getContext('webgl2')) return;
    const stage = $('m-stage');
    try {
      const { createScene } = await import('./scene.js');
      stage.hidden = false;
      scene = createScene(stage, { spots: TOWER_SPOTS, names: ['Как есть', 'С приёмами'], width: TOWER_WIDTH, margin: TOWER_MARGIN });
      $('m-flat').hidden = true;
      render();
    } catch {
      stage.hidden = true;
      scene = null;
    }
  }

  // Второй WebGL-контекст поднимаем, только когда карта рядом с экраном
  const watcher = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    watcher.disconnect();
    loadScene();
  }, { rootMargin: LOAD_AHEAD });
  watcher.observe($('fig-spend'));
}
