---
name: skill-stocktake
description: "Use when auditing agent skills (Claude Code / Codex) and commands for quality. Supports Quick Scan (changed skills only) and Full Stocktake modes with sequential subagent batch evaluation."
metadata:
  origin: ECC
disable-model-invocation: true
---

# skill-stocktake

Slash command (`/skill-stocktake`) that audits all skills (Claude Code and Codex layouts) and commands using a quality checklist + AI holistic judgment. Supports two modes: Quick Scan for recently changed skills, and Full Stocktake for a complete review.

## Scope

The command targets the following paths **relative to the directory where it is invoked**:

| Path | Description |
|------|-------------|
| `~/.claude/skills/` | Global skills, Claude Code |
| `{cwd}/.claude/skills/` | Project-level skills, Claude Code (if the directory exists) |
| `~/.agents/skills/` | Global skills, Codex (if the directory exists) |
| `{cwd}/.agents/skills/` | Project-level skills, Codex (if the directory exists) |

A missing layout is skipped and listed as `✗`, not an error. The same skill installed into both
layouts (kit `install.sh` does that) is evaluated once; the verdict applies to both copies.
`corpus.py` checks each layout as its own corpus — each harness loads only its own skills.

Below, `$SKILL_DIR` is this skill's directory: `~/.claude/skills/skill-stocktake` (Claude) /
`~/.agents/skills/skill-stocktake` (Codex).

**At the start of Phase 1, the command explicitly lists which paths were found and scanned.**

### Targeting a specific project

To include project-level skills, run from that project's root directory:

```bash
cd ~/path/to/my-project
/skill-stocktake
```

If the project has neither `.claude/skills/` nor `.agents/skills/`, only global skills and commands are evaluated.

## Modes

| Mode | Trigger | Duration |
|------|---------|---------|
| Quick Scan | `results.json` exists (default) | 5–10 min |
| Full Stocktake | `results.json` absent, or `/skill-stocktake full` | 20–30 min |

**Results cache:** `$SKILL_DIR/results.json`

## Quick Scan Flow

Re-evaluate only skills that have changed since the last run (5–10 min).

1. Read `$SKILL_DIR/results.json`
2. Run: `bash $SKILL_DIR/scripts/quick-diff.sh $SKILL_DIR/results.json`
   (Project dirs are auto-detected from `$PWD/.claude/skills` and `$PWD/.agents/skills`; pass the Claude one explicitly only if needed)
3. If output is `[]`: report "No changes since last run." and stop
4. Прогнать `bash $SKILL_DIR/scripts/lint.sh <изменённые SKILL.md>`
   (Phase 0 по списку изменений) — `FAIL` чинить до оценки
5. Re-evaluate only those changed files using the same Phase 2 criteria
6. Carry forward unchanged skills from previous results
7. Output only the diff
8. Run: `bash $SKILL_DIR/scripts/save-results.sh $SKILL_DIR/results.json <<< "$EVAL_RESULTS"`

## Full Stocktake Flow

### Phase 0 — Mechanical lint (обязательно, до субагентов)

Run: `bash $SKILL_DIR/scripts/lint.sh`

Детерминированная проверка: описание есть, короче 1024 знаков, не пересказывает
порядок шагов, не прячет в себе подсказку модели; `WARN` — SKILL.md крупнее
`skills.lint_warn_lines` из `~/.claude/thresholds.yaml` (скрипты читают его и под Codex; файла нет — дефолты; перекрывается переменной
окружения `SKILL_LINT_WARN_LINES`). Работает мгновенно и бесплатно —
поэтому идёт **перед** Phase 2: то, что ловится здесь, не должно попадать в разбор
субагентами.

- **FAIL** — исправить до запуска Phase 2, эти же навыки не оценивать «по содержанию»,
  пока описание сломано: субагент судит навык по описанию.
- **WARN** — не блокирует, но передать список в Phase 2 как повод проверить,
  не пора ли выносить часть в `references/`.

Тот же скрипт принимает пути: `bash .../lint.sh path/to/SKILL.md` — для Quick Scan
прогнать его только по изменённым файлам из `quick-diff.sh`.

Затем: `python3 $SKILL_DIR/scripts/corpus.py`

`lint.sh` смотрит на каждый навык отдельно, `corpus.py` — на связи между ними, и
ловит то, чего в одном файле не видно:

- **FAIL `name`** — имя во frontmatter разошлось с каталогом.
- **FAIL `link`** — ссылка из SKILL.md ведёт на несуществующий файл.
- **WARN `activation`** — два описания пересекаются выше `skills.activation_overlap`.
  Это главная находка скрипта: модель выбирает навык по описанию, и похожие
  описания означают, что вызовется не тот. Чинится правкой описаний, а не тела.
- **WARN `orphan`** — файл в корне навыка или в `references/` ни разу не упомянут
  в SKILL.md (кандидат в `config-gc`). Сгенерированные подкаталоги не проверяются.
- **WARN `startup`** — имена и описания всех навыков превысили
  `skills.startup_budget_tokens`; это плата за корпус в каждой сессии.

Обе последние проверки считают только навыки, видимые модели. Навык с
`disable-model-invocation: true` вызывается лишь руками: его описание не
попадает в стартовый список, ни за какой вызов не конкурирует и в бюджет старта
не входит. Итоговая строка печатает оба числа — сколько проверено и сколько из
них видно модели.

Пороги — в `~/.claude/thresholds.yaml` (общий для обоих харнессов), секция `skills`. `--json` даёт машинный
вывод, `--selfcheck` проверяет сам скрипт. Прогоняется по всему корпусу целиком —
для Quick Scan он тоже уместен, коллизия появляется от правки одного описания.

### Phase 1 — Inventory

Run: `bash $SKILL_DIR/scripts/scan.sh`

The script enumerates skill files, extracts frontmatter, and collects UTC mtimes.
Project dirs are auto-detected from `$PWD/.claude/skills` and `$PWD/.agents/skills`; pass the Claude one explicitly only if needed.
Present the scan summary and inventory table from the script output:

```
Scanning:
  ✓ ~/.claude/skills/         (17 files)
  ✗ {cwd}/.claude/skills/    (not found)
  ✓ ~/.agents/skills/         (17 files)
  ✗ {cwd}/.agents/skills/    (not found)
```

| Skill | Last modified | Description |
|-------|---------------|-------------|

**Usage counters are opt-in and off by default.** `scan.sh` reads them from
`$SKILL_STOCKTAKE_OBSERVATIONS` (default `~/.claude/observations.jsonl`, written by a Claude Code hook; Codex has no such collector, so under Codex expect *no data*). If that file
does not exist, every `use_7d`/`use_30d` is `0` — which means *no data*, not *unused*.
Check with `ls "${SKILL_STOCKTAKE_OBSERVATIONS:-$HOME/.claude/observations.jsonl}"` before
Phase 1 and:

- **file missing** → present the table above, say plainly in the report that usage data is
  not collected, and drop the usage line from the Phase 2 checklist
- **file present** → add `7d use` / `30d use` columns and keep the usage line in the checklist

Never let a structural zero read as evidence that a skill is unused — that turns a missing
telemetry file into a false Retire verdict.

### Phase 2 — Quality Evaluation

Launch a subagent with the full inventory and checklist — in Claude Code the Agent tool (**general-purpose agent**), in Codex its subagent if enabled; without subagents evaluate the same chunks in the main thread:

```text
Agent(
  subagent_type="general-purpose",
  prompt="
Evaluate the following skill inventory against the checklist.

[INVENTORY]

[CHECKLIST]

Return JSON for each skill:
{ \"verdict\": \"Keep\"|\"Improve\"|\"Update\"|\"Retire\"|\"Merge into [X]\", \"reason\": \"...\" }
"
)
```

The subagent reads each skill, applies the checklist, and returns per-skill JSON:

`{ "verdict": "Keep"|"Improve"|"Update"|"Retire"|"Merge into [X]", "reason": "..." }`

**Chunk guidance:** Process ~20 skills per subagent invocation to keep context manageable. Save intermediate results to `results.json` (`status: "in_progress"`) after each chunk.

After all skills are evaluated: set `status: "completed"`, proceed to Phase 3.

**Resume detection:** If `status: "in_progress"` is found on startup, resume from the first unevaluated skill.

Each skill is evaluated against this checklist:

```
- [ ] Content overlap with other skills checked
- [ ] Overlap with always-loaded context checked (MEMORY.md, CLAUDE.md, .claude/rules/*.md; Codex: AGENTS.md, ~/.codex/AGENTS.md)
- [ ] Every path the skill references actually exists (scripts/, references/, "Related" skill names)
- [ ] Freshness of technical references verified (use WebSearch if tool names / CLI flags / APIs are present)
- [ ] Invocation mode fits: model-invoked pays context load every session — is that reach earned, or should it be user-invoked?
- [ ] Failure modes named where present: sprawl, sediment, duplication, no-op lines, steering by negation, fuzzy completion criteria
- [ ] Usage frequency considered — INCLUDE THIS LINE ONLY IF the observations file exists (see Phase 1)
```

The last two items use the vocabulary in `~/.claude/references/skill-quality.md` (if present; the kit does not ship it to either harness) — pass that
file's path to the evaluating subagent and have it read the file before judging, so verdicts
name a diagnosed failure mode instead of a vague "too long".

Verdict criteria:

| Verdict | Meaning |
|---------|---------|
| Keep | Useful and current |
| Improve | Worth keeping, but specific improvements needed |
| Update | Referenced technology is outdated (verify with WebSearch) |
| Retire | Low quality, stale, or cost-asymmetric |
| Merge into [X] | Substantial overlap with another skill; name the merge target |

Перед оценкой прогнать пять жёстких гейтов из
`~/.claude/references/skill-change-rubric.md` (если есть — kit его не ставит ни в Claude, ни в Codex) (Часть 1): активация, исполнимость, место
в корпусе, проверяемость утверждений, цена сопровождения. Гейт не взвешивается и не
компенсируется — навык, заваливший G4 (утверждения без опоры) или G5 (волатильные числа
в теле вместо `references/`), получает `Improve` с названным гейтом, а не общий балл.
Путь к файлу передать оценивающему субагенту вместе с `skill-quality.md`.

Evaluation is **holistic AI judgment** — not a numeric rubric. Guiding dimensions:
- **Actionability**: code examples, commands, or steps that let you act immediately
- **Scope fit**: name, trigger, and content are aligned; not too broad or narrow
- **Uniqueness**: value not replaceable by MEMORY.md / CLAUDE.md / AGENTS.md / another skill
- **Currency**: technical references work in the current environment

**Reason quality requirements** — the `reason` field must be self-contained and decision-enabling:
- Do NOT write "unchanged" alone — always restate the core evidence
- For **Retire**: state (1) what specific defect was found, (2) what covers the same need instead
  - Bad: `"Superseded"`
  - Good: `"disable-model-invocation: true already set; superseded by continuous-learning-v2 which covers all the same patterns plus confidence scoring. No unique content remains."`
- For **Merge**: name the target and describe what content to integrate
  - Bad: `"Overlaps with X"`
  - Good: `"42-line thin content; Step 4 of chatlog-to-article already covers the same workflow. Integrate the 'article angle' tip as a note in that skill."`
- For **Improve**: describe the specific change needed (what section, what action, target size if relevant)
  - Bad: `"Too long"`
  - Good: `"276 lines; Section 'Framework Comparison' (L80–140) duplicates ai-era-architecture-principles; delete it to reach ~150 lines."`
- For **Keep** (mtime-only change in Quick Scan): restate the original verdict rationale, do not write "unchanged"
  - Bad: `"Unchanged"`
  - Good: `"mtime updated but content unchanged. Unique Python reference explicitly imported by rules/python/; no overlap found."`

### Phase 3 — Summary Table

| Skill | Lines | Verdict | Confidence | Reason |
|-------|-------|---------|------------|--------|

(Add a `7d use` column only when the observations file exists — see Phase 1.)

Каждый кандидат на Retire/Merge проверяется отдельно, до попадания в таблицу: маска, область
`grep` и угаданное написание (дефис против подчёркивания) — это гипотеза, а не доказательство.
Прямая проверка существования пути плюс прямой поиск ссылок по обоим написаниям в `~/.claude`,
`~/.codex`, `~/.agents` **и** в проектных настройках. Не подтвердился — кандидат выбывает, а не переезжает в низкую
уверенность. В колонке `Confidence` — что именно проверено.

### Phase 4 — Consolidation

1. **Retire / Merge**: present detailed justification per file before confirming with user:
   - What specific problem was found (overlap, staleness, broken references, etc.)
   - What alternative covers the same functionality (for Retire: which existing skill/rule; for Merge: the target file and what content to integrate)
   - Impact of removal (any dependent skills, MEMORY.md references, or workflows affected)
2. **Improve**: present specific improvement suggestions with rationale:
   - What to change and why (e.g., "trim 430→200 lines because sections X/Y duplicate python-patterns")
   - User decides whether to act
3. **Update**: present updated content with sources checked
4. Переписал навык и выбираешь между старой и новой редакцией — Часть 2
   `~/.claude/references/skill-change-rubric.md` (если есть): сравнение по пяти измерениям и
   тай-брейкеры при ничьей (проще → меньше волатильных утверждений → правка
   существующего, а не новый навык → внятнее gotchas → к человеку). Без этого
   выбор систематически уходит к более длинному варианту: объём читается как глубина.
5. Check MEMORY.md line count; propose compression if >100 lines

## Results File Schema

`$SKILL_DIR/results.json`:

**`evaluated_at`**: Must be set to the actual UTC time of evaluation completion.
Obtain via Bash: `date -u +%Y-%m-%dT%H:%M:%SZ`. Never use a date-only approximation like `T00:00:00Z`.

```json
{
  "evaluated_at": "2026-02-21T10:00:00Z",
  "mode": "full",
  "batch_progress": {
    "total": 80,
    "evaluated": 80,
    "status": "completed"
  },
  "skills": {
    "skill-name": {
      "path": "~/.claude/skills/skill-name/SKILL.md",
      "verdict": "Keep",
      "reason": "Concrete, actionable, unique value for X workflow",
      "mtime": "2026-01-15T08:30:00Z"
    },
    "codex-only-skill": {
      "path": "~/.agents/skills/codex-only-skill/SKILL.md",
      "verdict": "Keep",
      "reason": "...",
      "mtime": "2026-01-15T08:30:00Z"
    }
  }
}
```

## Notes

- Evaluation is blind: the same checklist applies to all skills regardless of origin (ECC, self-authored, auto-extracted)
- Archive / delete operations always require explicit user confirmation
- No verdict branching by skill origin
