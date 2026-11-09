import { COMPACT_TO, COMPACT_WARN, MAX_TURNS, PER_TURN, PRICES, fmtK, layersAt, message, money, simulate } from '../lib/sim.js';
import { LANG, T } from './lang.js';

const $ = (id) => document.getElementById(id);
const PRICE = PRICES['GPT-6.1 Terra'];
const INTRO_LAST_TURN = 30;
const CALM_START_TURN = 22;
const INTRO_STEP_MS = 260;
const PLAY_STEP_MS = 520;

function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

export async function initHero() {
  if (!hasWebGL()) return;
  const root = $('scene');
  const fallback = $('scene-fallback');
  root.hidden = false;
  fallback.hidden = true;

  let scene;
  try {
    const { createScene } = await import('./scene.js');
    scene = createScene($('stage'));
  } catch {
    root.hidden = true;
    fallback.hidden = false;
    return;
  }

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const turn = $('h-turn');
  let events = {};
  let timer = null;

  function render() {
    const n = +turn.value;
    const cur = simulate(n, events, PRICE)[n - 1];
    const layers = layersAt(n, events);
    scene.show(layers, new Set(layers.filter((l) => cur.miss || l.born === n).map((l) => l.id)));
    $('h-n').textContent = n;
    $('h-ctx').textContent = fmtK(cur.ctx);
    $('h-cost').textContent = money(cur.cost);
    $('h-total').textContent = money(cur.total);
    $('h-msg').textContent = message(cur, n, LANG);
    $('h-msg').className = cur.ev || cur.ctx >= COMPACT_WARN ? 'alert' : '';
    $('h-next').disabled = $('h-mcp').disabled = n >= MAX_TURNS;
    $('h-compact').disabled = n >= MAX_TURNS || cur.hist <= COMPACT_TO + PER_TURN;
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    $('h-play').textContent = T.hero.play;
    $('h-play').setAttribute('aria-pressed', 'false');
  }

  function play(lastTurn, stepMs) {
    timer = setInterval(() => {
      if (+turn.value >= lastTurn) return stop();
      turn.value = +turn.value + 1;
      render();
    }, stepMs);
  }

  function act(type) {
    stop();
    const n = +turn.value + 1;
    if (n > MAX_TURNS) return;
    Object.keys(events).forEach((k) => { if (+k >= n) delete events[k]; });
    events[n] = type;
    turn.value = n;
    render();
  }

  turn.oninput = () => { stop(); render(); };
  $('h-next').onclick = () => { stop(); turn.value = +turn.value + 1; render(); };
  $('h-mcp').onclick = () => act('mcp');
  $('h-compact').onclick = () => act('compact');
  $('h-reset').onclick = () => { stop(); events = {}; turn.value = 1; render(); };
  $('h-play').onclick = () => {
    if (timer) return stop();
    $('h-play').textContent = T.hero.stop;
    $('h-play').setAttribute('aria-pressed', 'true');
    play(MAX_TURNS, PLAY_STEP_MS);
  };

  if (calm) {
    turn.value = CALM_START_TURN;
    render();
  } else {
    render();
    play(INTRO_LAST_TURN, INTRO_STEP_MS);
  }
}
