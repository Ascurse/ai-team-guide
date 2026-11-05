import { DELEGATION_TASKS, FILE_READS, MAX_PARALLEL, splitReads } from '../data/delegation.js';
import { LADDER, effortGainTo, ladderBars } from '../data/ladder.js';
import { PRICES, compactCurve, money } from '../lib/sim.js';

const $ = (id) => document.getElementById(id);
const MIN_STAIR = 0.02;
const LATE_COMPACT = 4;
const PHASE_SHARE = 0.6;
const CURVE_HEIGHT = 240;
const CURVE_PAD = { top: 16, right: 8, bottom: 22, left: 8 };

const plural = (n, one, few, many) => {
  const tens = n % 100;
  const ones = n % 10;
  if (tens > 10 && tens < 20) return `${n} ${many}`;
  if (ones === 1) return `${n} ${one}`;
  return `${n} ${ones > 1 && ones < 5 ? few : many}`;
};
const pluralTurns = (n) => plural(n, 'ход', 'хода', 'ходов');
const pluralPoints = (n) => plural(n, 'балл', 'балла', 'баллов');

const press = (buttons, active) => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === active)));

export function initLadder() {
  const stairs = [...document.querySelectorAll('#l-stairs .stair')];
  const metrics = [...document.querySelectorAll('[data-metric]')];
  const levels = [...document.querySelectorAll('[data-level]')];

  function showMetric(button) {
    press(metrics, button);
    ladderBars(button.dataset.metric).forEach((bar, i) => {
      stairs[i].querySelector('.stair-value').textContent = bar.label;
      stairs[i].querySelector('i').style.transform = `scaleY(${bar.share && Math.max(bar.share, MIN_STAIR)})`;
    });
  }

  function showModel(button) {
    press(stairs, button);
    const model = LADDER.find((m) => m.id === button.dataset.id);
    const [input, output] = PRICES[model.id];
    $('l-name').textContent = model.name;
    $('l-use').textContent = model.use;
    $('l-facts').textContent = `Скорость: ${model.speed}. Цена за 1M: $${input.toFixed(2)} вход, $${output.toFixed(2)} выход.`;
  }

  function showEffort(button) {
    press(levels, button);
    const { level } = button.dataset;
    const msg = $('l-effort-msg');
    msg.className = level === 'max' ? 'msg alert' : 'msg';
    msg.textContent = level === 'low'
      ? 'Точка отсчёта: быстро и дёшево. Годится, когда думать не о чем.'
      : level === 'max'
        ? `+${pluralPoints(effortGainTo(level))} к low, но последняя ступень даёт только +4 при расходе до 8× токенов.`
        : `+${pluralPoints(effortGainTo(level))} к low.`;
  }

  metrics.forEach((b) => { b.onclick = () => showMetric(b); });
  stairs.forEach((b) => { b.onclick = () => showModel(b); });
  levels.forEach((b) => { b.onclick = () => showEffort(b); });
}

const chips = (kind, count) => `<i class="k-${kind}"></i>`.repeat(count);

export function initDelegation() {
  const counts = [...document.querySelectorAll('[data-count]')];

  function render(button) {
    press(counts, button);
    const count = +button.dataset.count;
    const shares = splitReads(count);
    const mainChips = count ? chips('result', count) : chips('read', FILE_READS);
    const subs = shares.map((reads) => `<div class="node node-sub"><strong>Субагент</strong><div>Делает объём: Haiku или Sonnet</div><div class="chips">${chips('read', reads)}</div></div>`).join('');
    $('d-tree').innerHTML = `<div class="node"><strong>Главная сессия</strong><div>Думает и проверяет: Opus</div><div class="chips">${mainChips}</div></div>${count ? `<div class="subs">${subs}</div>` : ''}`;
    $('d-main').textContent = count ? 0 : FILE_READS;
    $('d-subs').textContent = count ? FILE_READS : 0;
    $('d-results').textContent = count;
    const msg = $('d-msg');
    msg.className = count > MAX_PARALLEL ? 'msg alert' : 'msg';
    msg.textContent = count === 0
      ? 'Весь шум лежит в главной сессии и читается заново на каждом ходу.'
      : count > MAX_PARALLEL
        ? 'Выше моего лимита. Шесть параллельных прогонов vitest и tsc положили мой ноутбук (10 ядер, 16 GB). Каждый субагент проверяет только свой файл, полный прогон один, в главной сессии.'
        : 'В главную сессию приходят только выводы. Перечитайте результат сами: уведомление о прогрессе ещё не результат.';
  }

  function renderTask() {
    const task = DELEGATION_TASKS[+$('d-task').value];
    $('d-verdict').textContent = task.yes ? 'Делегировать' : 'Не делегировать';
    $('d-why').textContent = task.why;
  }

  counts.forEach((b) => { b.onclick = () => render(b); });
  $('d-task').onchange = renderTask;
  render(counts.find((b) => b.getAttribute('aria-pressed') === 'true'));
  renderTask();
}

function drawCurve(svg, length, at, { plain, compacted, breakEven }) {
  const width = svg.clientWidth;
  const top = Math.max(...plain, ...compacted);
  const x = (turn) => CURVE_PAD.left + ((turn - 1) / (length - 1)) * (width - CURVE_PAD.left - CURVE_PAD.right);
  const y = (cost) => CURVE_HEIGHT - CURVE_PAD.bottom - (cost / top) * (CURVE_HEIGHT - CURVE_PAD.top - CURVE_PAD.bottom);
  const line = (totals) => totals.map((cost, i) => `${i ? 'L' : 'M'}${x(i + 1).toFixed(1)} ${y(cost).toFixed(1)}`).join('');
  const anchor = x(at) > width * 0.75 ? 'end' : 'start';
  const shift = anchor === 'end' ? -6 : 6;
  const paid = breakEven && `<circle class="dot" cx="${x(breakEven)}" cy="${y(compacted[breakEven - 1])}" r="5"/>`;
  svg.setAttribute('viewBox', `0 0 ${width} ${CURVE_HEIGHT}`);
  svg.innerHTML = `<line class="axis" x1="${CURVE_PAD.left}" x2="${width - CURVE_PAD.right}" y1="${CURVE_HEIGHT - CURVE_PAD.bottom}" y2="${CURVE_HEIGHT - CURVE_PAD.bottom}"/>
<line class="mark-line" x1="${x(at)}" x2="${x(at)}" y1="${CURVE_PAD.top}" y2="${CURVE_HEIGHT - CURVE_PAD.bottom}"/>
<text x="${x(at) + shift}" y="${CURVE_PAD.top + 4}" text-anchor="${anchor}">/compact</text>
<text x="${CURVE_PAD.left}" y="${CURVE_HEIGHT - 6}">ход 1</text>
<text x="${width - CURVE_PAD.right}" y="${CURVE_HEIGHT - 6}" text-anchor="end">ход ${length}</text>
<path class="plain" d="${line(plain)}"/><path class="comp" d="${line(compacted)}"/>${paid || ''}`;
}

export function initCurve() {
  const price = PRICES['GPT-6.1 Terra'];
  const length = $('c-length');
  const at = $('c-at');
  const svg = $('c-svg');

  function render() {
    at.max = +length.value - 1;
    const turns = +length.value;
    const turn = Math.min(+at.value, +at.max);
    at.value = turn;
    const curve = compactCurve(turns, turn, price);
    $('c-length-n').textContent = turns;
    $('c-at-n').textContent = turn;
    $('c-plain').textContent = money(curve.plain.at(-1));
    $('c-comp').textContent = money(curve.compacted.at(-1));
    $('c-saved').textContent = (curve.saved < 0 ? '−' : '') + money(Math.abs(curve.saved));
    const msg = $('c-msg');
    msg.className = curve.breakEven ? 'msg' : 'msg alert';
    msg.textContent = curve.breakEven
      ? `Окупился через ${pluralTurns(curve.steps)}: дальше каждый ход дешевле.`
      : turns - turn <= LATE_COMPACT
        ? `До конца всего ${pluralTurns(turns - turn)}, компакт не успел окупиться.`
        : 'Контекст ещё лёгкий и почти весь из кэша: выжимка стоит дороже, чем сэкономит.';
    drawCurve(svg, turns, turn, curve);
  }

  length.oninput = render;
  at.oninput = render;
  $('c-phase').onclick = () => { at.value = Math.round(+length.value * PHASE_SHARE); render(); };
  $('c-late').onclick = () => { at.value = +length.value - 2; render(); };
  new ResizeObserver(render).observe(svg);
  render();
}
