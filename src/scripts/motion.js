import { animate, inView, scroll, stagger } from 'motion';
import { CYCLE_EDGES, CYCLE_FRAMES, VERDICT_NO, VERDICT_YES } from '../data/cycle.js';

const $ = (id) => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';
const DOT_SIZE = 14;
const SPRING = { type: 'spring', stiffness: 260, damping: 26 };
const NODE_ENTER = 0.06;
const CHIP_ENTER = 0.02;
const READS_START = 0.3;
const FLIGHT_START = 0.9;
const FLIGHT_STAGGER = 0.09;
const FLIGHT_DURATION = 0.5;
const TICK_DURATION = 0.5;

export const isCalm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const centerOf = (box, parent) => ({
  x: box.left - parent.left + box.width / 2,
  y: box.top - parent.top + box.height / 2,
});

export function initCycle() {
  if (isCalm()) return;
  const figure = $('fig-cycle');
  const run = $('cy-run');
  const map = $('cy-map');
  const lines = $('cy-lines');
  const dot = $('cy-dot');
  const nodes = Object.fromEntries([...map.querySelectorAll('[data-node]')].map((el) => [el.dataset.node, el]));
  let current = -1;

  run.hidden = false;
  figure.classList.add('is-live');

  const dotTarget = (id) => {
    const parent = map.getBoundingClientRect();
    const box = nodes[id].getBoundingClientRect();
    return { x: box.left - parent.left + box.width / 2 - DOT_SIZE / 2, y: box.top - parent.top - DOT_SIZE / 2 };
  };

  function drawLines() {
    const parent = map.getBoundingClientRect();
    lines.setAttribute('viewBox', `0 0 ${parent.width} ${parent.height}`);
    lines.replaceChildren(...CYCLE_EDGES.map(({ from, to, isLoop }) => {
      const a = centerOf(nodes[from].getBoundingClientRect(), parent);
      const b = centerOf(nodes[to].getBoundingClientRect(), parent);
      const line = document.createElementNS(SVG_NS, 'line');
      Object.entries({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }).forEach(([key, value]) => line.setAttribute(key, value));
      if (isLoop) line.setAttribute('class', 'loop');
      return line;
    }));
  }

  function show(index) {
    const frame = CYCLE_FRAMES[index];
    const isFirstShow = current < 0;
    current = index;
    Object.values(nodes).forEach((el) => el.classList.remove('is-on', 'is-no', 'is-yes'));
    const node = nodes[frame.node];
    node.classList.add('is-on');
    if (frame.verdict === VERDICT_NO) node.classList.add('is-no');
    if (frame.verdict === VERDICT_YES) node.classList.add('is-yes');
    $('cy-count').textContent = `Шаг ${index + 1} из ${CYCLE_FRAMES.length}`;
    $('cy-text').textContent = frame.text;
    animate($('cy-text'), { opacity: [0, 1], y: [6, 0] }, { duration: 0.2 });
    animate(dot, dotTarget(frame.node), isFirstShow ? { duration: 0 } : SPRING);
  }

  new ResizeObserver(() => {
    drawLines();
    if (current >= 0) animate(dot, dotTarget(CYCLE_FRAMES[current].node), { duration: 0 });
  }).observe(map);

  show(0);
  scroll((progress) => {
    const index = Math.min(CYCLE_FRAMES.length - 1, Math.floor(progress * CYCLE_FRAMES.length));
    if (index !== current) show(index);
  }, { target: run });
}

let running = [];

function tick(el, delay) {
  const target = Number(el.textContent);
  el.textContent = 0;
  running.push(animate(0, target, { delay, duration: TICK_DURATION, onUpdate: (v) => { el.textContent = Math.round(v); } }));
}

function flyToMain(tree, sub, chip, delay) {
  const parent = tree.getBoundingClientRect();
  const from = sub.getBoundingClientRect();
  const to = chip.getBoundingClientRect();
  const fly = document.createElement('i');
  fly.className = 'k-result fly';
  fly.style.left = `${from.left - parent.left + from.width / 2}px`;
  fly.style.top = `${from.top - parent.top}px`;
  tree.append(fly);
  const flight = animate(fly, {
    x: [0, to.left - from.left - from.width / 2],
    y: [0, to.top - from.top],
    opacity: [0, 1],
  }, { delay, duration: FLIGHT_DURATION, ease: 'easeInOut' });
  running.push(flight);
  flight.then(() => {
    if (!fly.isConnected) return;
    fly.remove();
    chip.style.opacity = 1;
    running.push(animate(chip, { scale: [0, 1] }, SPRING));
  });
}

export function flowDelegation(tree, { main, subs, results }) {
  if (isCalm()) return;
  // stop() дописывает в счётчик промежуточное значение, поэтому итоги запоминаем до него
  const totals = [main, subs, results].map((el) => [el, el.textContent]);
  running.forEach((control) => control.stop());
  running = [];
  totals.forEach(([el, text]) => { el.textContent = text; });
  tree.querySelectorAll('.fly').forEach((fly) => fly.remove());
  const mainChips = [...tree.querySelector('.node').querySelectorAll('.chips i')];
  const subNodes = [...tree.querySelectorAll('.node-sub')];

  if (!subNodes.length) {
    mainChips.forEach((chip) => { chip.style.opacity = 0; });
    running.push(animate(mainChips, { opacity: [0, 1], scale: [0, 1] }, { delay: stagger(CHIP_ENTER), duration: 0.2 }));
    tick(main, 0);
    return;
  }

  const reads = subNodes.flatMap((node) => [...node.querySelectorAll('.chips i')]);
  [...mainChips, ...reads, ...subNodes].forEach((el) => { el.style.opacity = 0; });
  running.push(animate(subNodes, { opacity: [0, 1], y: [-8, 0] }, { delay: stagger(NODE_ENTER), duration: 0.25 }));
  running.push(animate(reads, { opacity: [0, 1], scale: [0, 1] }, { delay: stagger(CHIP_ENTER, { startDelay: READS_START }), duration: 0.2 }));
  tick(subs, READS_START);
  subNodes.forEach((node, i) => flyToMain(tree, node, mainChips[i], FLIGHT_START + i * FLIGHT_STAGGER));
  tick(results, FLIGHT_START);
}

export function onFirstView(el, callback) {
  inView(el, () => { callback(); }, { amount: 0.4 });
}
