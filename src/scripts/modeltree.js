import { animate } from 'motion';
import * as ruTree from '../data/modeltree.js';
import * as enTree from '../data/en/modeltree.js';
import { LANG, T } from './lang.js';
import { isCalm } from './motion.js';

const { TREE_LANES, TREE_STEPS, moveOn } = LANG === 'en' ? enTree : ruTree;
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

  initLanes(map);
  show(0);
}

function initLanes(map) {
  const starts = [...document.querySelectorAll('[data-start]')];
  const eventButtons = [...document.querySelectorAll('[data-event]')];
  const rowEls = TREE_LANES.map((_, lane) => [...map.querySelectorAll(`[data-lane="${lane}"] [data-row]`)]);
  const message = $('mt-msg');
  let position = { lane: 0, row: 0 };
  let pending = null;
  const modelAt = ({ lane, row }) => TREE_LANES[lane].rows[row].model;

  function draw(text) {
    rowEls.forEach((rows, lane) => rows.forEach((el, row) => el.classList.toggle('is-here', lane === position.lane && row === position.row)));
    $('mt-confirm').hidden = !pending;
    eventButtons.forEach((b) => { b.disabled = Boolean(pending); });
    message.textContent = text;
  }

  function begin(lane) {
    position = { lane, row: 0 };
    pending = null;
    draw(S.begin(modelAt(position)));
  }

  function choose(start) {
    starts.forEach((b) => b.setAttribute('aria-pressed', String(b === start)));
    begin(+start.dataset.start);
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
  $('mt-reset').onclick = () => choose(starts[0]);
  starts.forEach((button) => { button.onclick = () => choose(button); });
  begin(0);
}
