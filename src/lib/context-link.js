// Связь симулятора контекста (страница «Для всех») со счётчиком в дереве моделей («Продвинутое»).
// Цифры считает simulate из sim.js, здесь только передача состояния и выбор уровня предупреждения
import { PRICES, MAX_TURNS, COMPACT_WARN, FRESH_SESSION_WARN, simulate } from './sim.js';

export const LINK_KEY = 'ai-team-guide:context-sim';
export const LINK_EVENT = 'context-sim:change';
export const DEFAULT_STATE = { turn: 22, model: Object.keys(PRICES)[0], events: {} };

const EVENT_TYPES = ['mcp', 'compact'];
const defaults = () => ({ ...DEFAULT_STATE, events: {} });

function cleanEvents(raw) {
  const events = {};
  for (const [turn, type] of Object.entries(raw && typeof raw === 'object' ? raw : {})) {
    const n = Number(turn);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_TURNS && EVENT_TYPES.includes(type)) events[n] = type;
  }
  return events;
}

// Состояние пришло из хранилища, то есть извне: всё, что не сходится с моделью, заменяем значениями по умолчанию
export function parseState(raw) {
  let value;
  try { value = JSON.parse(raw); } catch { return defaults(); }
  const isValid = value && Number.isInteger(value.turn) && value.turn >= 1 && value.turn <= MAX_TURNS && value.model in PRICES;
  return isValid ? { turn: value.turn, model: value.model, events: cleanEvents(value.events) } : defaults();
}

function warningLevel(ctx) {
  if (ctx >= FRESH_SESSION_WARN) return 'fresh';
  if (ctx >= COMPACT_WARN) return 'compact';
  return 'ok';
}

export function contextAt({ turn, model, events }) {
  const { ctx, cost, total } = simulate(MAX_TURNS, events, PRICES[model])[turn - 1];
  return { turn, model, ctx, cost, total, level: warningLevel(ctx) };
}

// Хранилище может быть закрыто (приватное окно, блокировка данных сайта): тогда работает только тот же документ
export function publishState(state, { storage, target }) {
  try { storage.setItem(LINK_KEY, JSON.stringify(state)); } catch { /* счётчик останется без связи между вкладками */ }
  target.dispatchEvent(new CustomEvent(LINK_EVENT, { detail: state }));
}

export function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}

export function readState(storage) {
  try { return parseState(storage.getItem(LINK_KEY)); } catch { return defaults(); }
}

export function subscribeState(onChange, { target, win }) {
  const onLocal = (event) => onChange(event.detail);
  const onOtherTab = (event) => { if (event.key === LINK_KEY) onChange(parseState(event.newValue)); };
  target.addEventListener(LINK_EVENT, onLocal);
  win.addEventListener('storage', onOtherTab);
  return () => {
    target.removeEventListener(LINK_EVENT, onLocal);
    win.removeEventListener('storage', onOtherTab);
  };
}
