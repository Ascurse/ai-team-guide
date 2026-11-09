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

export function simulate(turns, events, price, shape = {}) {
  const perTurn = shape.perTurn ?? PER_TURN;
  let tools = shape.tools ?? START.tools, hist = 0, prev = 0, total = 0;
  const out = [];
  for (let t = 1; t <= turns; t++) {
    const ev = events[t];
    let miss = t === 1;
    if (ev === 'mcp') { tools += MCP; miss = true; }
    if (ev === 'compact') { hist = Math.min(hist, COMPACT_TO); miss = true; }
    hist += perTurn;
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

// Выжимку пишет сама модель: читает контекст из кэша и платит за ответ по цене выхода
export function compactCurve(turns, at, price) {
  const plain = simulate(turns, {}, price).map((step) => step.total);
  const run = simulate(turns, { [at]: 'compact' }, price);
  const summary = (run[at - 2].ctx * price[0] * CACHED + COMPACT_TO * price[1]) / 1e6;
  const compacted = run.map((step, i) => step.total + (i >= at - 1 ? summary : 0));
  const firstAhead = compacted.findIndex((total, i) => i >= at - 1 && total < plain[i]);
  const breakEven = firstAhead < 0 ? null : firstAhead + 1;
  return { plain, compacted, breakEven, steps: breakEven && breakEven - at, saved: plain.at(-1) - compacted.at(-1) };
}

export const OUTPUT_SHARE = 0.84;
// masked: скрытие старых выводов вдвое дешевле; sandbox: −87% самоотчёта context-mode
export const OUTPUT_KEEP = { all: 1, masked: 0.5, sandbox: 0.13 };

export function spendAt(turn, price, { outputsKeep = OUTPUT_KEEP.all, toolsShare = 1 } = {}) {
  const outputs = Math.round(PER_TURN * OUTPUT_SHARE);
  const keptOutputs = Math.round(outputs * outputsKeep);
  const talk = PER_TURN - outputs;
  const tools = Math.round(START.tools * toolsShare);
  const { ctx, total } = simulate(turn, {}, price, { tools, perTurn: talk + keptOutputs })[turn - 1];
  const layers = [
    { id: 'sys', size: START.sys, kind: 'sys' },
    { id: 'tools', size: tools, kind: 'tools' },
    { id: 'out', size: keptOutputs * turn, kind: 'out' },
    { id: 'talk', size: talk * turn, kind: 'hist' },
  ];
  return { layers, ctx, total };
}

const MESSAGES = {
  ru: {
    offScale: 'Контекст вышел за шкалу. Такая сессия уже не работает: начинайте новую.',
    mcp: 'Набор инструментов изменился, кэш сброшен: весь контекст прочитан по полной цене. Поэтому посреди сессии набор не меняем.',
    compact: 'История сжата до короткой выжимки. Сессия снова лёгкая, но детали из неё пропали: важное заранее записывайте в файлы.',
    fresh: 'Больше 250K: модель быстро деградирует и путается в собственной истории. Лучше новая сессия.',
    compactWarn: 'После 200K самое время сделать /compact или начать новую сессию.',
    start: 'Старт: контекст ещё пуст, но схемы инструментов уже заняли большую его часть. Лишние MCP отключаем.',
    ok: 'Всё в норме: старая часть контекста читается из кэша, платите в основном за новое. Качество падает задолго до лимита окна, поэтому одна задача — одна сессия.',
  },
  en: {
    offScale: 'The context is off the scale. A session like this no longer works: start a new one.',
    mcp: 'The tool set changed and the cache was reset: the whole context was read at full price. That is why you do not change the tool set mid-session.',
    compact: 'The history was compressed into a short summary. The session is light again, but the details are gone: write anything important to files beforehand.',
    fresh: 'Over 250K: the model degrades quickly and gets lost in its own history. Better to start a new session.',
    compactWarn: 'Past 200K it is time to run /compact or start a new session.',
    start: 'Start: the context is still empty, but tool schemas already take up most of it. Turn off the MCP servers you do not need.',
    ok: 'All good: the old part of the context is read from cache, so you pay mostly for what is new. Quality drops long before the window limit, so keep one task per session.',
  },
};

export function message(cur, n, lang = 'ru') {
  const text = MESSAGES[lang];
  if (cur.ctx > MAX_SCALE) return text.offScale;
  if (cur.ev === 'mcp') return text.mcp;
  if (cur.ev === 'compact') return text.compact;
  if (cur.ctx >= FRESH_SESSION_WARN) return text.fresh;
  if (cur.ctx >= COMPACT_WARN) return text.compactWarn;
  if (n === 1) return text.start;
  return text.ok;
}
