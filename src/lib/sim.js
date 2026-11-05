// Учебная модель сессии: общая для 3D-сцены, 2D-симулятора и выбора модели
export const PRICES = { 'GPT-6.1 Terra': [1, 5], 'GPT-6 Luna': [0.1, 0.5], 'GPT-6.1 Sol': [2, 10], 'GPT-6 Astra': [10, 50] };
export const START = { sys: 9000, tools: 16000 };
export const PER_TURN = 6000;
export const OUTPUT = 1500;
export const MCP = 12000;
export const COMPACT_TO = 15000;
export const CACHED = 0.1;
export const LONG_INPUT = 272000;
export const MAX_SCALE = 350000;
export const MAX_TURNS = 50;
export const COMPACT_WARN = 200000;
export const FRESH_SESSION_WARN = 250000;

export const fmtK = (n) => Math.round(n / 1000) + 'K';
export const money = (v) => (v < 0.1 ? '$' + v.toFixed(3) : '$' + v.toFixed(2));

export function simulate(turns, events, price) {
  let tools = START.tools, hist = 0, prev = 0, total = 0;
  const out = [];
  for (let t = 1; t <= turns; t++) {
    const ev = events[t];
    let miss = t === 1;
    if (ev === 'mcp') { tools += MCP; miss = true; }
    if (ev === 'compact') { hist = Math.min(hist, COMPACT_TO); miss = true; }
    hist += PER_TURN;
    const ctx = START.sys + tools + hist;
    const cached = miss ? 0 : Math.min(prev, ctx);
    const fresh = ctx - cached;
    const long = ctx > LONG_INPUT;
    const inP = price[0] * (long ? 2 : 1);
    const outP = price[1] * (long ? 1.5 : 1);
    const cost = (cached * inP * CACHED + fresh * inP + OUTPUT * outP) / 1e6;
    total += cost;
    out.push({ ctx, tools, hist, cost, miss, total, ev });
    prev = ctx;
  }
  return out;
}

// Те же шаги, но как плиты стопки: сумма размеров обязана равняться ctx из simulate
export function layersAt(n, events) {
  const fixed = [{ id: 'sys', size: START.sys, kind: 'sys' }, { id: 'tools', size: START.tools, kind: 'tools' }];
  let hist = [];
  for (let t = 1; t <= n; t++) {
    if (events[t] === 'mcp') fixed.push({ id: 'mcp' + t, size: MCP, kind: 'tools' });
    if (events[t] === 'compact') {
      const size = hist.reduce((sum, l) => sum + l.size, 0);
      hist = [{ id: 'compact' + t, size: Math.min(size, COMPACT_TO), kind: 'hist' }];
    }
    hist.push({ id: 'turn' + t, size: PER_TURN, kind: 'hist', born: t });
  }
  return fixed.concat(hist);
}

export function message(cur, n) {
  if (cur.ctx > MAX_SCALE) return 'Контекст вышел за шкалу. Такая сессия уже не работает: начинайте новую.';
  if (cur.ev === 'mcp') return 'Набор инструментов изменился, кэш сброшен: весь контекст прочитан по полной цене. Поэтому посреди сессии набор не меняем.';
  if (cur.ev === 'compact') return 'История сжата до короткой выжимки. Сессия снова лёгкая, но детали из неё пропали: важное заранее записывайте в файлы.';
  if (cur.ctx >= FRESH_SESSION_WARN) return 'Больше 250K: модель быстро деградирует и путается в собственной истории. Лучше новая сессия.';
  if (cur.ctx >= COMPACT_WARN) return 'После 200K самое время сделать /compact или начать новую сессию.';
  if (n === 1) return 'Старт: контекст ещё пуст, но схемы инструментов уже заняли большую его часть. Лишние MCP отключаем.';
  return 'Всё в норме: старая часть контекста читается из кэша, платите в основном за новое. Качество падает задолго до лимита окна, поэтому одна задача — одна сессия.';
}
