#!/usr/bin/env python3
"""PreToolUse-хук Claude Code (Edit|Write|MultiEdit): точечный retrieval из docs/journal/.

Перед правкой файла находит записи активного журнала (decisions/gotchas/glossary, без *-archive.md),
которые упоминают этот файл, и отдаёт их агенту через hookSpecificOutput.additionalContext.
Никогда не блокирует правку: ошибка или пустой результат — пустой stdout и код 0.

--selftest — проверки на временном каталоге.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

JOURNAL_DIR = Path("docs/journal")
JOURNAL_FILES = ("decisions.md", "gotchas.md", "glossary.md")
GLOSSARY_FILE = "glossary.md"
# Такие имена есть почти в каждом каталоге: по одному имени — шум, ищем только по полному пути.
GENERIC_BASENAMES = {
    "index.ts", "index.tsx", "index.js", "index.jsx", "index.scss", "index.vue", "styles.scss",
    "types.ts", "constants.ts", "model.ts", "config.ts", "utils.ts", "mod.rs", "lib.rs", "main.rs",
    "__init__.py", "package.json", "README.md",
}
MAX_CONTEXT_CHARS = 3000
MAX_ANCHOR_CHECKS = 5
GIT_TIMEOUT_S = 3
ANCHOR_SHA_RE = re.compile(r"@\s*([0-9a-f]{7,40})\b")
GLOSSARY_ITEM_RE = re.compile(r"^\s*[-*]\s+\*\*")


def split_entries(text, journal_name):
    """Записи decisions/gotchas — секции `## `; записи глоссария — пункты списка `- **Термин** — …`."""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    is_glossary = journal_name == GLOSSARY_FILE
    entries, current, in_fence = [], None, False
    for line in text.splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
        starts_entry = not in_fence and (
            GLOSSARY_ITEM_RE.match(line) if is_glossary else line.startswith("## "))
        if starts_entry:
            current = [line]
            entries.append(current)
        elif is_glossary and (line.startswith("#") or not line.strip()):
            current = None
        elif current is not None:
            current.append(line)
    return ["\n".join(lines).strip() for lines in entries]


def needle_patterns(rel_path):
    """Полный путь — сильное совпадение; имя файла — слабое (журналы часто пишут короткий путь)."""
    full = re.compile(r"(?<![\w./-])" + re.escape(rel_path.as_posix()) + r"(?![\w-])")
    if rel_path.name in GENERIC_BASENAMES or rel_path.name == rel_path.as_posix():
        return full, None
    return full, re.compile(r"(?<![\w.-])" + re.escape(rel_path.name) + r"(?![\w-])")


def find_matches(root, rel_path):
    full, short = needle_patterns(rel_path)
    strong, weak = [], []
    for name in JOURNAL_FILES:
        path = root / JOURNAL_DIR / name
        if not path.is_file():
            continue
        for entry in split_entries(path.read_text(encoding="utf-8"), name):
            if full.search(entry):
                strong.append((name, entry))
            elif short and short.search(entry):
                weak.append((name, entry))
    return strong + weak


def anchor_note(root, rel_path, sha):
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "rev-list", "--count", f"{sha}..HEAD", "--", rel_path.as_posix()],
            capture_output=True, text=True, timeout=GIT_TIMEOUT_S)
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return f"якорь {sha} не найден в git-истории"
    count = int(result.stdout.strip() or 0)
    return f"файл менялся после якоря {sha}: {count} комм." if count else None


def render(root, rel_path, matches):
    header = f"Журнал проекта (docs/journal/) упоминает `{rel_path.as_posix()}` — прочитай до правки:"
    parts, used, shown = [header], len(header), 0
    checked = 0
    for name, entry in matches:
        notes = []
        for sha in dict.fromkeys(ANCHOR_SHA_RE.findall(entry)):
            if checked >= MAX_ANCHOR_CHECKS:
                break
            checked += 1
            note = anchor_note(root, rel_path, sha)
            if note:
                notes.append(note)
        block = f"[{name}]\n{entry}" + "".join(f"\n⚠ {n}" for n in notes)
        room = MAX_CONTEXT_CHARS - used - 2
        if len(block) > room:
            # Первую запись режем, а не теряем целиком: без неё хук бесполезен.
            if shown == 0 and room > 200:
                parts.append(block[:room - 1] + "…")
                shown += 1
            break
        parts.append(block)
        used += len(block) + 2
        shown += 1
    if shown < len(matches) or parts[-1].endswith("…"):
        parts.append(f"(обрезано: показано {shown} из {len(matches)}; полностью — "
                     f"grep -n \"{rel_path.name}\" docs/journal/{{decisions,gotchas,glossary}}.md)")
    return "\n\n".join(parts)


def edited_rel_path(payload):
    file_path = (payload.get("tool_input") or {}).get("file_path")
    if not file_path:
        return None, None
    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()).resolve()
    path = Path(file_path)
    path = (path if path.is_absolute() else root / path).resolve()
    try:
        return root, path.relative_to(root)
    except ValueError:
        return root, None


def run_hook(stdin_text):
    root, rel_path = edited_rel_path(json.loads(stdin_text))
    if rel_path is None or rel_path.parts[:2] == JOURNAL_DIR.parts:
        return None
    matches = find_matches(root, rel_path)
    if not matches:
        return None
    context = render(root, rel_path, matches)
    return json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": context}},
                      ensure_ascii=False)


SELFTEST_GOTCHAS = """# Gotchas

```
## YYYY-MM-DD — образец в блоке кода про src/app.py
```

## 2026-01-02 — Запись про модуль

**Симптом:** ломается.
**Где это в коде:** `src/app.py:main`.

## 2026-01-01 — Запись про другой файл

**Где это в коде:** `src/other.py`.

## 2026-01-03 — Короткий путь

**Где это в коде:** `lib/helper.ts`.
"""
SELFTEST_GLOSSARY = """# Glossary

## Бизнес-домен

- **Компания** — клиент. `src/app.py`.
- **Тариф** — условия. `src/rates.py`.
"""


def _selftest_call(root, stdin_text):
    env = {**os.environ, "CLAUDE_PROJECT_DIR": str(root)}
    result = subprocess.run([sys.executable, "-I", __file__], input=stdin_text,
                            capture_output=True, text=True, env=env, timeout=30)
    assert result.returncode == 0, result
    return result.stdout, result.stderr


def _payload(path):
    return json.dumps({"tool_name": "Edit", "tool_input": {"file_path": str(path)}})


def selftest():
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp).resolve()
        journal = root / JOURNAL_DIR
        journal.mkdir(parents=True)
        (journal / "gotchas.md").write_text(SELFTEST_GOTCHAS, encoding="utf-8")
        (journal / "glossary.md").write_text(SELFTEST_GLOSSARY, encoding="utf-8")
        (journal / "gotchas-archive.md").write_text(
            "## 2020-01-01 — Архивная про src/archived.py\n\n`src/archived.py`\n", encoding="utf-8")

        out, _ = _selftest_call(root, _payload(root / "src/app.py"))
        context = json.loads(out)["hookSpecificOutput"]
        assert context["hookEventName"] == "PreToolUse", context
        text = context["additionalContext"]
        assert "Запись про модуль" in text and "**Компания**" in text, text
        assert "другой файл" not in text and "Тариф" not in text and "YYYY" not in text, text
        print("ok: есть записи — полный путь, лишние записи и образцы из блока кода не попадают")

        # Относительный путь и слабое совпадение по имени файла.
        out, _ = _selftest_call(root, _payload("src/features/lib/helper.ts"))
        assert "Короткий путь" in json.loads(out)["hookSpecificOutput"]["additionalContext"], out
        print("ok: есть записи — относительный путь, совпадение по имени файла")

        silent_cases = (
            ("запись только в архиве — тишина", _payload(root / "src/archived.py")),
            ("нет записей — тишина", _payload(root / "src/none.py")),
            ("правка самого журнала — тишина", _payload(journal / "gotchas.md")),
            ("файл вне проекта — тишина", _payload("/elsewhere/app.py")),
        ) + tuple((f"сбой внутри хука ({bad!r}) — код 0, пустые stdout и stderr", bad)
                  for bad in ("", "not json", "[1]", '{"tool_input": null}'))
        for name, stdin_text in silent_cases:
            assert _selftest_call(root, stdin_text) == ("", ""), name
            print(f"ok: {name}")

        # Лимит размера: много длинных записей → обрезка с пометкой.
        big = "".join(f"## 2026-02-{i:02d} — Длинная {i}\n\n`src/app.py` " + "x" * 900 + "\n\n" for i in range(1, 9))
        (journal / "decisions.md").write_text(big, encoding="utf-8")
        out, _ = _selftest_call(root, _payload(root / "src/app.py"))
        text = json.loads(out)["hookSpecificOutput"]["additionalContext"]
        assert len(text) <= MAX_CONTEXT_CHARS + 200 and "обрезано" in text, len(text)
        print("ok: лимит размера — обрезка с пометкой")
    print("selftest: ok")
    return 0


def main():
    if sys.argv[1:] == ["--selftest"]:
        return selftest()
    try:
        output = run_hook(sys.stdin.read())
    except Exception:  # noqa: BLE001 — хук не должен мешать правке
        output = None
    if output:
        print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
