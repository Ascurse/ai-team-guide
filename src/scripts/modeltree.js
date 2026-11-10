import { animate } from 'motion';
import * as ruTree from '../data/modeltree.js';
import * as enTree from '../data/en/modeltree.js';
import { MAX_SCALE, fmtK, money } from '../lib/sim.js';
import { browserStorage, contextAt, readState, subscribeState } from '../lib/context-link.js';
import { LANG, T } from './lang.js';
import { isCalm } from './motion.js';

const { TREE_LANES, TREE_NODES, TREE_STEPS, moveOn } = LANG === 'en' ? enTree : ruTree;
const S = T.modelTree;
const $ = (id) => document.getElementById(id);
const DOT_SIZE = 14;
const STEP_PAUSE_MS = 2800;
const FLIGHT = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };

export function initModelTree() {
  const figure = $('fig-modeltree');
  const map = $('mt-map');
  const dot = $('mt-dot');
  const nodes = Object.fromEntries([...map.querySelectorAll('[data-node]')].map((el) => [el.dataset.node, el]));
  const play = $('mt-play');
  let current = 0;
  let timer = null;

  figure.classList.add('is-live');
  $('fig-lanes').classList.add('is-live');
  dot.hidden = false;
  play.hidden = isCalm();

  const dotTarget = (id) => {
    const parent = map.getBoundingClientRect();
    const box = nodes[id].getBoundingClientRect();
    return { x: box.left - parent.left + box.width / 2 - DOT_SIZE / 2, y: box.top - parent.top - DOT_SIZE / 2 };
  };

  function show(index) {
    current = index;
    const [from, to] = TREE_STEPS[index].nodes;
    Object.values(nodes).forEach((el) => el.classList.remove('is-on'));
    [from, to].forEach((id) => nodes[id].classList.add('is-on'));
    $('mt-count').textContent = S.step(index + 1, TREE_STEPS.length);
    $('mt-text').textContent = TREE_STEPS[index].text;
    $('mt-who').textContent = whoIs(to);
    $('mt-prev').disabled = index === 0;
    $('mt-next').disabled = index === TREE_STEPS.length - 1;
    animate(dot, dotTarget(from), { duration: 0 });
    animate(dot, dotTarget(to), isCalm() ? { duration: 0 } : FLIGHT);
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
    play.textContent = S.play;
  }

  function tick() {
    if (current === TREE_STEPS.length - 1) return stop();
    show(current + 1);
    timer = setTimeout(tick, STEP_PAUSE_MS);
  }

  $('mt-prev').onclick = () => { stop(); show(current - 1); };
  $('mt-next').onclick = () => { stop(); show(current + 1); };
  play.onclick = () => {
    if (timer) return stop();
    if (current === TREE_STEPS.length - 1) show(0);
    play.textContent = S.pause;
    timer = setTimeout(tick, STEP_PAUSE_MS);
  };
  new ResizeObserver(() => animate(dot, dotTarget(TREE_STEPS[current].nodes[1]), { duration: 0 })).observe(map);

  initLanes();
  initContextCounter();
  show(0);
}

function whoIs(id) {
  const node = TREE_NODES.find((item) => item.id === id);
  return `${[node.label, node.model].filter(Boolean).join(' · ')}: ${node.role}`;
}

function initContextCounter() {
  const box = $('mt-ctx');
  const fill = $('mt-ctx-fill');

  function draw(state) {
    const { turn, model, ctx, cost, level } = contextAt(state);
    $('mt-ctx-size').textContent = fmtK(ctx);
    $('mt-ctx-meta').textContent = S.ctxMeta(turn, model);
    $('mt-ctx-cost').textContent = S.ctxCost(money(cost));
    $('mt-ctx-msg').textContent = S.ctxLevel[level];
    fill.style.width = `${Math.min(100, (ctx / MAX_SCALE) * 100)}%`;
    box.dataset.level = level;
  }

  draw(readState(browserStorage()));
  subscribeState(draw, { target: document, win: window });
}

function initLanes() {
  const lanes = [...$('mt-lanes').querySelectorAll('[data-lane]')];
  const starts = [...document.querySelectorAll('[data-start]')];
  const eventButtons = [...document.querySelectorAll('[data-event]')];
  const rowEls = lanes.map((lane) => [...lane.querySelectorAll('[data-row]')]);
  const message = $('mt-msg');
  let position = { lane: 0, row: 0 };
  let pending = null;
  const modelAt = ({ lane, row }) => TREE_LANES[lane].rows[row].model;

  function draw(text) {
    rowEls.forEach((rows, lane) => rows.forEach((el, row) => el.classList.toggle('is-here', lane === position.lane && row === position.row)));
    lanes.forEach((el, lane) => el.classList.toggle('is-open', lane === position.lane));
    starts.forEach((b, lane) => b.setAttribute('aria-pressed', String(lane === position.lane)));
    $('mt-confirm').hidden = !pending;
    eventButtons.forEach((b) => { b.disabled = Boolean(pending); });
    message.textContent = text;
  }

  function begin(lane) {
    position = { lane, row: 0 };
    pending = null;
    draw(S.begin(modelAt(position)));
  }

  function commit({ next, event, from }) {
    position = { lane: next.lane, row: next.row };
    pending = null;
    const model = modelAt(position);
    if (event === 'quota') draw(S.onQuota(from, model));
    else if (event === 'retry') draw(S.onRetry(model));
    else draw(S.onEscalate(TREE_LANES[position.lane].id, model));
  }

  eventButtons.forEach((button) => {
    button.onclick = () => {
      const event = button.dataset.event;
      const next = moveOn(position, event);
      if (next.stop) return draw(S.stop);
      const step = { next, event, from: modelAt(position) };
      if (!next.needsYes) return commit(step);
      pending = step;
      draw(S.needsYes(modelAt(next)));
    };
  });
  $('mt-yes').onclick = () => commit(pending);
  $('mt-no').onclick = () => { pending = null; draw(S.declined(modelAt(position))); };
  $('mt-reset').onclick = () => begin(0);
  starts.forEach((button) => { button.onclick = () => begin(+button.dataset.start); });
  begin(0);
}
