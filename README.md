# Как работать с AI: ChatGPT, Codex, Claude и Claude Code

Практический гайд на русском: как ставить задачу, управлять контекстом, проверять результат и выбирать модель. Главный экран показывает 3D-стопку контекста, в тексте есть интерактивные симуляторы.

Сайт: https://ascurse.github.io/ai-team-guide/

Файл для чтения без сети лежит в [релизах](https://github.com/Ascurse/ai-team-guide/releases/latest).

## Разработка

```bash
yarn install
yarn dev
```

- `yarn test` проверяет учебную модель сессии.
- `yarn build` собирает сайт в `dist/`.
- `yarn offline` после сборки делает один HTML в `dist-offline/`.

Текст лежит в `src/content/guide.md`, модель сессии в `src/lib/sim.js`.

Сайт выкатывается на GitHub Pages при пуше в `main`. Релиз с офлайн-файлом создаётся тегом `v*`.

## Лицензии

Шрифты Jost, Golos Text и IBM Plex Mono распространяются по SIL Open Font License.
