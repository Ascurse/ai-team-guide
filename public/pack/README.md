# Пак скиллов из гайда

23 скилла для ChatGPT, Claude Code и Codex. Описания и выбор — на странице гайда, раздел «Пак скиллов».

## Что где лежит

- `chatgpt/` — `task-brief`, `fact-check` и `project-instructions.md` для тарифов без Skills.
- `skills/` — 21 скилл для Claude Code и Codex. Формат `SKILL.md` у них общий.
- `codex/` — правила `team-guard.rules` и роли субагентов `explorer` / `reviewer`.
- `THIRD_PARTY.md` — какие скиллы взяты из открытых наборов и под какой лицензией.

## Установка

Claude Code — все скиллы или выбранные:

```bash
mkdir -p ~/.claude/skills && cp -r skills/* ~/.claude/skills/
```

Codex — те же скиллы, плюс правила и роли:

```bash
mkdir -p ~/.agents/skills && cp -r skills/* ~/.agents/skills/
mkdir -p ~/.codex/rules && cp codex/rules/team-guard.rules ~/.codex/rules/
mkdir -p ~/.codex/agents && cp codex/agents/*.toml ~/.codex/agents/
```

Содержимое `codex/config.snippet.toml` дописать в `~/.codex/config.toml`.

ChatGPT с Skills (Business / Enterprise / Edu): заархивировать папку скилла (`cd chatgpt && zip -r task-brief.zip task-brief`), затем ChatGPT → Skills → Create → загрузить. Без Skills — вставить `chatgpt/project-instructions.md` в инструкции проекта.

## Перед установкой

Прочитайте `SKILL.md` каждого скилла, который ставите. Часть скиллов рассчитана на трекер beads (`bd`) — без него они бесполезны: `bd-priorities`, `bd-branch-integration-merge`, `ship`, `atomic-commit-split`.
