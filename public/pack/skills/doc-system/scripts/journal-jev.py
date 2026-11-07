#!/usr/bin/env python3
"""Сигналы устаревания и совет Jev по записям docs/journal/ (навык doc-system).

triage <docs/journal>  — таблица сигналов по записям активных файлов, журнал не правит;
                         совет Jev только с --jev (по замеру почти всегда «оставить»).
check [--journal DIR]  — черновик новой записи из stdin → куда его относить.
--selftest             — встроенные проверки на временном git-репозитории.
"""
import argparse
import contextlib
import functools
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

JOURNAL_FILES = ("decisions.md", "gotchas.md", "glossary.md")
GLOSSARY_FILE = "glossary.md"
CODE_FIELD = "Где это в коде"
CONFIDENCE_FLOOR = 0.6
MAX_FIELD_SENTENCES = 4
MAX_FIELD_CHARS = 600
SIMILAR_TITLE_JACCARD = 0.5
JEV_TIMEOUT_S = 30
NO_JEV = "без Jev"

DATE_RE = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
FIELD_RE = re.compile(r"^\*\*([^*]+?):\*\*\s*(.*)$")
# Запись глоссария — пункт списка `- **Термин** — определение. Где встречается.`
GLOSSARY_ITEM_RE = re.compile(r"^\s*[-*]\s+\*\*(.+?)\*\*")
# Путь без кавычек прямо перед якорем: `путь:символ1,символ2 (пояснение) @ SHA`.
ANCHOR_PATH_RE = re.compile(r"([\w./-]+\.\w+)(?::[\w.$,]+)?(?:\s*\([^)]*\))?\s*@\s*[0-9a-f]{7,40}\b")
SHA_RE = re.compile(r"@\s*([0-9a-f]{7,40})\b")
BACKTICK_RE = re.compile(r"`([^`\s]+)`")
MDLINK_RE = re.compile(r"\]\(([^)\s#]+)")
TRACKER_KEY_RE = re.compile(r"\b([A-Z]{2,})-\d+\b")
BRANCH_RE = re.compile(r"\bbd-[a-z0-9][\w.]*|\bfeature/[\w./-]+")
# Стандарты и алгоритмы выглядят как ключи задач, но ими не являются.
NOT_TRACKER_PREFIXES = {"UTF", "ISO", "SHA", "RFC", "CVE", "ES", "HTTP", "TLS", "WCAG", "AES", "RSA"}
SENTENCE_END_RE = re.compile(r"[.!?…](?=\s|$)")
WORD_RE = re.compile(r"\w{4,}")
FILE_EXTENSIONS = {"ts", "tsx", "js", "jsx", "mjs", "cjs", "json", "css", "scss", "html", "md", "py", "sh",
                   "yml", "yaml", "toml", "dart", "go", "rs", "svg", "lock", "env"}


def _strip_comments(text):
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def parse_entries(text, source):
    if source == GLOSSARY_FILE:
        return _parse_glossary(text, source)
    entries, current, in_fence = [], None, False
    for line in _strip_comments(text).splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
        if line.startswith("## ") and not in_fence:
            current = {"file": source, "title": line[3:].strip(), "lines": []}
            entries.append(current)
        elif current is not None:
            current["lines"].append(line)
    return [_finish_entry(e) for e in entries]


def _parse_glossary(text, source):
    # Заголовки `## ` в глоссарии — разделы, а не записи.
    entries, in_fence = [], False
    for line in _strip_comments(text).splitlines():
        if line.startswith("```"):
            in_fence = not in_fence
            continue
        match = None if in_fence else GLOSSARY_ITEM_RE.match(line)
        if match:
            # Ссылки в глоссарии необязательны («где встречается» бывает продуктом, а не кодом),
            # поэтому пути ищутся по всей строке.
            entries.append({"file": source, "title": match.group(1).strip(), "date": None,
                            "body": line.strip(), "fields": {}, "code_text": line})
    return entries


def _finish_entry(entry):
    body = "\n".join(entry.pop("lines")).strip()
    date = DATE_RE.search(entry["title"])
    return {**entry, "date": date.group(1) if date else None, "body": body, "fields": _parse_fields(body)}


def _parse_fields(body):
    fields, name = {}, None
    for line in body.splitlines():
        match = FIELD_RE.match(line)
        if match:
            name = match.group(1).strip()
            fields[name] = match.group(2).strip()
        elif name and line.strip():
            fields[name] += " " + line.strip()
    return fields


def _git(repo_root, *args):
    result = subprocess.run(["git", "-C", str(repo_root), *args], capture_output=True, text=True)
    return result.stdout if result.returncode == 0 else None


def repo_root_of(directory):
    out = _git(directory, "rev-parse", "--show-toplevel")
    return Path(out.strip()).resolve() if out else None


def _looks_like_path(text):
    # Не пути: шаблоны (`*`, `{a,b}`), npm-пакеты (`@scope/pkg`), CSS-классы (`.past`),
    # идентификаторы с точкой (`api.onQueryStarted`).
    if any(c in text for c in "*{") or text.startswith(("@", ".")):
        return False
    return "/" in text or Path(text).suffix.lstrip(".").lower() in FILE_EXTENSIONS


@functools.lru_cache(maxsize=None)
def _tracked_files(repo_root):
    out = _git(repo_root, "ls-files")
    return tuple(out.splitlines()) if out else ()


def _resolve_short_path(path, repo_root):
    """В журналах пишут `lib/x.ts` вместо `src/features/lib/x.ts` — достраиваем по git ls-files."""
    if (repo_root / path).exists():
        return path
    for tracked in _tracked_files(repo_root):
        if tracked.endswith("/" + path):
            return tracked
        if tracked.startswith(path + "/"):
            return path
        middle = tracked.find("/" + path + "/")
        if middle >= 0:
            return tracked[:middle + 1 + len(path)]
    return path


def extract_paths(code_field, journal_dir, repo_root):
    candidates = []  # (позиция конца упоминания, путь)
    for match in ANCHOR_PATH_RE.finditer(code_field):
        candidates.append((match.end(1), _resolve_short_path(match.group(1), repo_root)))
    for match in BACKTICK_RE.finditer(code_field):
        path = match.group(1).split(":")[0]
        if _looks_like_path(path):
            candidates.append((match.end(), _resolve_short_path(path, repo_root)))
    for match in MDLINK_RE.finditer(code_field):
        if ":" not in match.group(1):
            candidates.append((match.end(), os.path.relpath((journal_dir / match.group(1)).resolve(), repo_root)))
    candidates.sort()
    found = dict.fromkeys(path for _end, path in candidates)
    # Якорь `@ SHA` относится к ближайшему пути перед ним.
    for match in SHA_RE.finditer(code_field):
        before = [path for end, path in candidates if end <= match.start()]
        if before:
            found[before[-1]] = match.group(1)
    return [{"path": path, "sha": sha} for path, sha in found.items()]


def bad_anchors(paths, repo_root):
    return [f"{p['path']} @ {p['sha']}" for p in paths
            if p["sha"] and _git(repo_root, "cat-file", "-e", f"{p['sha']}^{{commit}}") is None]


def count_code_changes(paths, date, repo_root):
    commits, known = set(), False
    for item in paths:
        if not (repo_root / item["path"]).exists():
            continue
        if item["sha"]:
            out = _git(repo_root, "log", "--format=%H", f"{item['sha']}..HEAD", "--", item["path"])
        elif date:
            # Конец дня записи: коммит, к которому запись писалась, изменением не считается.
            out = _git(repo_root, "log", "--format=%H", f"--since={date} 23:59:59", "--", item["path"])
        else:
            continue
        if out is None:
            continue
        known = True
        commits.update(out.split())
    return len(commits) if known else None


def oversize_fields(fields):
    return [name for name, text in fields.items()
            if name != CODE_FIELD
            and (len(text) > MAX_FIELD_CHARS or len(SENTENCE_END_RE.findall(text)) > MAX_FIELD_SENTENCES)]


def chronicle_marks(text, repo_name=None):
    keys = [m.group(0) for m in TRACKER_KEY_RE.finditer(text) if m.group(1) not in NOT_TRACKER_PREFIXES]
    # bd по умолчанию берёт префикс бидов из имени репозитория: `psychologist-backoffice-2gnv.12`.
    beads = re.findall(rf"\b{re.escape(repo_name)}-[0-9a-z]{{3,}}(?:\.\d+)*\b", text) if repo_name else []
    return sorted(set(keys + beads + BRANCH_RE.findall(text)))


def entry_signals(entry, journal_dir, repo_root):
    paths = extract_paths(entry.get("code_text", entry["fields"].get(CODE_FIELD, "")), journal_dir, repo_root)
    return {
        "paths": [p["path"] for p in paths],
        "paths_missing": [p["path"] for p in paths if not (repo_root / p["path"]).exists()],
        "bad_anchors": bad_anchors(paths, repo_root),
        "code_changed": count_code_changes(paths, entry["date"], repo_root),
        "oversize": oversize_fields(entry["fields"]),
        "chronicle": chronicle_marks(entry["body"], repo_root.name),
    }


TRIAGE_QUESTIONS = [
    {"id": "action", "type": "choice",
     "instructions": "What should happen to this project-journal entry? Signals were computed mechanically from git and the filesystem.",
     "criteria": {
         "keep": "Still true, useful, and concise",
         "compress": "Still true but longer than it needs to be, or narrates work history",
         "archive": "No longer true, but explains why a past workaround existed",
         "delete": "No longer true and explains nothing worth keeping"}},
    {"id": "derivable", "type": "noul",
     "instructions": "A developer would learn this fact just by reading the referenced code"},
    {"id": "hypothesis", "type": "noul",
     "instructions": "The stated cause is a guess, not a confirmed finding"},
]
ACTION_RANK = {"delete": 0, "archive": 1, "compress": 2, "keep": 3}


def ask_jev(state, questions):
    # stderr самого jev не пересказываем: там могут быть подробности ключа.
    if shutil.which("jev") is None:
        return None, "jev не найден в PATH"
    payload = json.dumps({"state": state, "questions": questions}, ensure_ascii=False)
    try:
        result = subprocess.run(["jev", "ask"], input=payload, capture_output=True, text=True, timeout=JEV_TIMEOUT_S)
    except subprocess.TimeoutExpired:
        return None, f"jev ask: таймаут {JEV_TIMEOUT_S} с"
    except OSError:
        return None, "jev ask: не запускается"
    if result.returncode != 0:
        return None, f"jev ask: код выхода {result.returncode}"
    try:
        answers = json.loads(result.stdout)["answers"]
    except (json.JSONDecodeError, KeyError, TypeError):
        answers = None
    if not _answers_complete(answers, questions):
        return None, "jev ask: непонятный ответ"
    return answers, None


def _answers_complete(answers, questions):
    number = (int, float)
    for question in questions:
        answer = answers.get(question["id"]) if isinstance(answers, dict) else None
        if not isinstance(answer, dict):
            return False
        if question["type"] == "choice" and not (
                answer.get("choice") in question["criteria"] and isinstance(answer.get("confidence"), number)):
            return False
        if question["type"] == "noul" and not isinstance(answer.get("noul"), number):
            return False
    return True


def entry_state(entry, signals):
    return (f"Journal file: {entry['file']}\nEntry: ## {entry['title']}\n{entry['body']}\n\n"
            f"Signals: {json.dumps(signals, ensure_ascii=False)}")


def _triage_row(entry, signals, answers):
    action = answers["action"] if answers else None
    confidence = action["confidence"] if action else None
    return {
        "file": entry["file"], "title": entry["title"], **signals,
        "action": action["choice"] if action else None,
        "confidence": confidence,
        "derivable": answers["derivable"]["noul"] if answers else None,
        "hypothesis": answers["hypothesis"]["noul"] if answers else None,
        "needs_human": confidence is not None and confidence < CONFIDENCE_FLOOR,
    }


def triage(journal_dir, use_jev=True):
    journal_dir = Path(journal_dir).resolve()
    repo_root = repo_root_of(journal_dir)
    if repo_root is None:
        raise SystemExit(f"{journal_dir}: не внутри git-репозитория")
    jev_down = None if use_jev else NO_JEV
    rows = []
    for name in JOURNAL_FILES:
        path = journal_dir / name
        if not path.exists():
            continue
        for entry in parse_entries(path.read_text(encoding="utf-8"), name):
            signals = entry_signals(entry, journal_dir, repo_root)
            answers = None
            if jev_down is None:
                answers, jev_down = ask_jev(entry_state(entry, signals), TRIAGE_QUESTIONS)
                if jev_down:
                    print(jev_down, file=sys.stderr)
            rows.append(_triage_row(entry, signals, answers))
    return sorted(rows, key=lambda r: (ACTION_RANK.get(r["action"], 4),
                                       -len(r["paths_missing"]), -(r["code_changed"] or 0)))


def _cell(text):
    return str(text).replace("|", "\\|")


def _describe_signals(row):
    parts = []
    if row["paths_missing"]:
        parts.append("нет путей: " + ", ".join(row["paths_missing"]))
    if row["bad_anchors"]:
        parts.append("якорь не найден: " + ", ".join(row["bad_anchors"]))
    if row["code_changed"]:
        parts.append(f"код менялся: {row['code_changed']} комм.")
    if row["oversize"]:
        parts.append("длинно: " + ", ".join(row["oversize"]))
    if row["chronicle"]:
        parts.append("хроника: " + ", ".join(row["chronicle"]))
    if not row["paths"] and row.get("file") != GLOSSARY_FILE:
        parts.append("без ссылок на код")
    return "; ".join(parts) or "—"


def _verdict_label(row):
    if row["action"] is None:
        return NO_JEV
    return row["action"] + (" · на решение человеку" if row["needs_human"] else "")


def format_triage(rows):
    lines = ["| файл | запись | сигналы | вердикт | уверенность |", "|---|---|---|---|---|"]
    for row in rows:
        confidence = "—" if row["confidence"] is None else f"{row['confidence']:.2f}"
        lines.append("| " + " | ".join(_cell(c) for c in (
            row["file"], row["title"], _describe_signals(row), _verdict_label(row), confidence)) + " |")
    return "\n".join(lines)


CHECK_QUESTIONS = [
    {"id": "carrier", "type": "choice", "instructions": "Where does this draft note belong?",
     "criteria": {
         "code_comment": "Explains one place in the code; belongs in a comment next to that code",
         "gotcha": "A trap that spans several files or is invisible from the code",
         "decision": "An architectural decision with its reasoning",
         "glossary": "Defines a domain term",
         "not_journal": "Task status, a narrative of work done, or something the code already says"}},
    TRIAGE_QUESTIONS[2],
]


def _title_words(title):
    return {w.lower() for w in WORD_RE.findall(DATE_RE.sub("", title))}


def similar_titles(title, journal_dir):
    words = _title_words(title)
    if not words or journal_dir is None or not journal_dir.is_dir():
        return []
    similar = []
    for name in JOURNAL_FILES:
        path = journal_dir / name
        if not path.exists():
            continue
        for entry in parse_entries(path.read_text(encoding="utf-8"), name):
            other = _title_words(entry["title"])
            if other and len(words & other) / len(words | other) >= SIMILAR_TITLE_JACCARD:
                similar.append(f"{name}: {entry['title']}")
    return similar


def check(draft, journal_dir, use_jev=True):
    if not draft.strip():
        raise SystemExit("пустой черновик")
    text = draft if draft.lstrip().startswith("## ") else "## " + draft.lstrip()
    entry = parse_entries(text, "draft")[0]
    remarks = []
    # Поле обязательно только в формате подводного камня; у решений и терминов его может не быть.
    if "Симптом" in entry["fields"] and CODE_FIELD not in entry["fields"]:
        remarks.append(f"нет поля «{CODE_FIELD}»")
    remarks += [f"длинно: {name}" for name in oversize_fields(entry["fields"])]
    repo_root = repo_root_of(journal_dir) if journal_dir and journal_dir.is_dir() else None
    marks = chronicle_marks(entry["title"] + "\n" + entry["body"], repo_root.name if repo_root else None)
    if marks:
        remarks.append("хроника: " + ", ".join(marks))
    remarks += [f"похоже на: {t}" for t in similar_titles(entry["title"], journal_dir)]
    answers, reason = ask_jev(entry_state(entry, {"remarks": remarks}), CHECK_QUESTIONS) if use_jev else (None, None)
    if reason:
        print(reason, file=sys.stderr)
    if answers and answers["hypothesis"]["noul"] >= CONFIDENCE_FLOOR and "[гипотеза]" not in entry["body"]:
        remarks.append("похоже на догадку без метки [гипотеза]")
    carrier = answers["carrier"] if answers else None
    return {"carrier": carrier["choice"] if carrier else None,
            "confidence": carrier["confidence"] if carrier else None,
            "remarks": remarks}


def format_check(result):
    if result["carrier"] is None:
        verdict = NO_JEV
    else:
        verdict = f"{result['carrier']} ({result['confidence']:.2f})"
        if result["confidence"] < CONFIDENCE_FLOOR:
            verdict += " · на решение человеку"
    return f"{verdict} — " + ("; ".join(result["remarks"]) or "замечаний нет")


SELFTEST_JOURNAL = """# Gotchas

Формат:

```
## YYYY-MM-DD — Заголовок-образец внутри блока кода
```

<!--
## 2026-01-01 — Пример в комментарии
-->

## 2024-06-01 — Свежая запись про живой файл

**Симптом:** Что-то ломается. Второе предложение.
**Где это в коде:** `src/app.py:main`, [README](../../README.md).

## 2024-01-01 — Старая запись про изменившийся файл

**Симптом:** bd-abc и TECH-123 тут не к месту, а UTF-8 и SHA-256 — нормальный текст.
**Где это в коде:** `src/app.py`.

## Запись без даты и без кода

**Симптом:** раз. два. три. четыре. пять.

## 2024-06-01 — Запись с якорем и пропавшим файлом

**Где это в коде:** `src/app.py:main @ {sha}`, [gone](../../src/gone.py).
"""

SELFTEST_GIT_ENV = {
    "GIT_AUTHOR_DATE": "2024-06-01T12:00:00", "GIT_COMMITTER_DATE": "2024-06-01T12:00:00",
    "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t",
}


def _selftest_repo(tmp):
    # tmp не resolve()-ним: на macOS /var → /private/var, это часть проверки.
    env = {**os.environ, **SELFTEST_GIT_ENV}

    def run(*args):
        return subprocess.run(["git", "-C", str(tmp), *args], check=True, capture_output=True, text=True, env=env).stdout

    run("init", "-q")
    (tmp / "src").mkdir()
    (tmp / "src/app.py").write_text("x = 1\n")
    (tmp / "README.md").write_text("r\n")
    run("add", "src/app.py", "README.md")
    run("commit", "-qm", "init")
    sha = run("rev-parse", "HEAD").strip()
    (tmp / "src/app.py").write_text("x = 2\n")
    run("commit", "-qam", "change")
    journal = tmp / "docs/journal"
    journal.mkdir(parents=True)
    (journal / "gotchas.md").write_text(SELFTEST_JOURNAL.replace("{sha}", sha), encoding="utf-8")
    return journal, sha


def _selftest_signals(journal, sha):
    entries = parse_entries((journal / "gotchas.md").read_text(encoding="utf-8"), "gotchas.md")
    assert len(entries) == 4, [e["title"] for e in entries]
    fresh, old, undated, anchored = entries
    assert fresh["date"] == "2024-06-01" and undated["date"] is None, entries
    repo_root, journal_dir = repo_root_of(journal), journal.resolve()

    s = entry_signals(fresh, journal_dir, repo_root)
    assert s["paths"] == ["src/app.py", "README.md"], s
    # Коммиты в день записи не считаются изменением после неё.
    assert s["paths_missing"] == [] and s["code_changed"] == 0, s

    s = entry_signals(old, journal_dir, repo_root)
    assert s["code_changed"] == 2, s
    assert s["chronicle"] == ["TECH-123", "bd-abc"], s

    s = entry_signals(undated, journal_dir, repo_root)
    assert s["paths"] == [] and s["code_changed"] is None, s
    assert s["oversize"] == ["Симптом"], s

    s = entry_signals(anchored, journal_dir, repo_root)
    assert s["code_changed"] == 1, s
    assert s["paths_missing"] == ["src/gone.py"] and s["bad_anchors"] == [], s

    # Якорь после закрывающей кавычки, markdown-ссылки, пояснения в скобках, символов через запятую.
    for field in (f"`src/app.py:12` @ {sha}", f"[app](../../src/app.py) @ {sha}",
                  f"src/app.py (пояснение) @ {sha}", f"`src/app.py:1,2` (`.x`) @ {sha}",
                  f"src/app.py:a,b @ {sha}"):
        found = extract_paths(field, journal_dir, repo_root)
        assert found == [{"path": "src/app.py", "sha": sha}], (field, found)

    # Якорь на несуществующий коммит — сам по себе сигнал, а не тихий ноль.
    broken = {"date": None, "body": "", "fields": {CODE_FIELD: "`src/app.py:x @ deadbeef1`"}}
    s = entry_signals(broken, journal_dir, repo_root)
    assert s["bad_anchors"] == ["src/app.py @ deadbeef1"], s
    assert "якорь не найден" in _describe_signals({**s, "action": None}), s

    # Биды с префиксом-именем репозитория.
    assert chronicle_marks("см. myrepo-2gnv.12 и myrepo-33p0, путь myrepo/docs", "myrepo") == [
        "myrepo-2gnv.12", "myrepo-33p0"]

    # Короткий путь достраивается по git ls-files; шаблоны и CSS-классы — не пути.
    found = extract_paths("`app.py`, `src/*.py`, `.past`, `gone.ts`, `@scope/pkg`, `a/{b,c}.ts`, `api.onQueryStarted`",
                          journal_dir, repo_root)
    assert [p["path"] for p in found] == ["src/app.py", "gone.ts"], found


FAKE_ANSWERS = {"answers": {
    "action": {"type": "choice", "choice": "delete", "probabilities": {}, "confidence": 0.5},
    "derivable": {"type": "noul", "noul": 0.1},
    "hypothesis": {"type": "noul", "noul": 0.9},
    "carrier": {"type": "choice", "choice": "code_comment", "probabilities": {}, "confidence": 0.8},
}}


def _fake_bin(tmp, jev_body):
    bin_dir = Path(tempfile.mkdtemp(dir=tmp))
    (bin_dir / "git").symlink_to(shutil.which("git"))
    if jev_body is not None:
        jev = bin_dir / "jev"
        jev.write_text("#!/bin/sh\n" + jev_body)
        jev.chmod(0o755)
    return bin_dir


def _with_path(bin_dir, fn):
    saved = os.environ["PATH"]
    os.environ["PATH"] = str(bin_dir)
    try:
        return fn()
    finally:
        os.environ["PATH"] = saved


SELFTEST_GLOSSARY = """# Glossary

Формат: `**Термин** — определение. Где встречается.`

## Бизнес-домен

- **Компания** — клиент сервиса. `src/app.py`.
- **Тариф** — условия компании.

## Внешние системы

- **Sentry** — мониторинг. `src/gone.py`.
"""


def _selftest_glossary(journal):
    entries = parse_entries(SELFTEST_GLOSSARY, GLOSSARY_FILE)
    # Разделы `## ` — не записи; запись — пункт списка с термином.
    assert [e["title"] for e in entries] == ["Компания", "Тариф", "Sentry"], entries
    repo_root, journal_dir = repo_root_of(journal), journal.resolve()
    signals = [entry_signals(e, journal_dir, repo_root) for e in entries]
    assert signals[0]["paths"] == ["src/app.py"] and signals[2]["paths_missing"] == ["src/gone.py"], signals
    # Глоссарий не обязан ссылаться на код.
    described = _describe_signals({**signals[1], "file": GLOSSARY_FILE, "action": None})
    assert "без ссылок на код" not in described, described
    assert "без ссылок на код" in _describe_signals({**signals[1], "file": "gotchas.md", "action": None})


def _selftest_triage(journal, tmp):
    rows = _with_path(_fake_bin(tmp, None), lambda: triage(journal))
    assert len(rows) == 4 and all(r["action"] is None for r in rows), rows
    assert rows[0]["title"].endswith("пропавшим файлом"), [r["title"] for r in rows]
    assert NO_JEV in format_triage(rows)

    answer_file = tmp / "answers.json"
    answer_file.write_text(json.dumps(FAKE_ANSWERS))
    good_jev = _fake_bin(tmp, f"/bin/cat > /dev/null\n/bin/cat '{answer_file}'\n")
    rows = _with_path(good_jev, lambda: triage(journal))
    assert all(r["action"] == "delete" and r["needs_human"] for r in rows), rows
    assert rows[0]["hypothesis"] == 0.9 and "на решение человеку" in format_triage(rows), rows

    calls = tmp / "calls.log"
    broken_jev = _fake_bin(tmp, f"echo x >> '{calls}'\nexit 1\n")
    rows = _with_path(broken_jev, lambda: triage(journal))
    assert all(r["action"] is None for r in rows), rows
    assert calls.read_text().count("x") == 1, "после первого отказа Jev больше не вызывается"

    # Замер: в triage Jev почти всегда отвечает keep — из командной строки он только по --jev.
    cli_calls = tmp / "cli-calls.log"
    counting_jev = _fake_bin(tmp, f"echo x >> '{cli_calls}'\nexit 1\n")
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        _with_path(counting_jev, lambda: main(["triage", str(journal)]))
        assert not cli_calls.exists(), "triage без --jev не должен звать Jev"
        _with_path(counting_jev, lambda: main(["triage", str(journal), "--jev"]))
    assert cli_calls.exists(), "triage --jev должен звать Jev"

    # Ответ Jev без нужных полей — отказ с причиной, а не падение.
    for bad in ('{"answers": {"action": {"choice": "keep"}}}', "[1]", '{"answers": null}'):
        bad_file = tmp / "bad.json"
        bad_file.write_text(bad)
        bad_jev = _fake_bin(tmp, f"/bin/cat > /dev/null\n/bin/cat '{bad_file}'\n")
        with contextlib.redirect_stderr(io.StringIO()) as err:
            rows = _with_path(bad_jev, lambda: triage(journal))
        assert all(r["action"] is None for r in rows) and "непонятный ответ" in err.getvalue(), (bad, rows)

    piped = format_triage([{**rows[0], "title": "a | b"}])
    assert "a \\| b" in piped, piped

    # Отдельный каталог: всё внутри tmp лежит в тестовом репозитории.
    with tempfile.TemporaryDirectory() as outside:
        try:
            triage(Path(outside), use_jev=False)
        except SystemExit as exit_:
            assert "git" in str(exit_.code), exit_.code
        else:
            raise AssertionError("журнал вне git должен отклоняться")


def _selftest_check(journal, tmp):
    answer_file = tmp / "answers.json"
    good_jev = _fake_bin(tmp, f"/bin/cat > /dev/null\n/bin/cat '{answer_file}'\n")
    draft = ("## 2024-07-01 — Свежая запись про живой файл, снова\n\n"
             "**Симптом:** правка по TECH-9.\n**Причина:** наверное кэш.\n")
    result = _with_path(good_jev, lambda: check(draft, journal))
    assert result["carrier"] == "code_comment" and result["confidence"] == 0.8, result
    remarks = " ".join(result["remarks"])
    for expected in (CODE_FIELD, "TECH-9", "Свежая запись", "[гипотеза]"):
        assert expected in remarks, (expected, result)
    assert "code_comment" in format_check(result)

    # Без --journal журнал ищется от корня репозитория, а не от текущего каталога.
    saved_cwd, saved_stdin = os.getcwd(), sys.stdin
    try:
        os.chdir(journal.parent.parent / "src")
        sys.stdin = io.StringIO("## 2024-06-01 — Свежая запись про живой файл\n\nтекст\n")
        with contextlib.redirect_stdout(io.StringIO()) as out:
            main(["check", "--no-jev", "--json"])
    finally:
        os.chdir(saved_cwd)
        sys.stdin = saved_stdin
    assert "похоже на" in out.getvalue(), out.getvalue()

    clean = check("## Термин\n\n**Определение:** коротко.\n", journal, use_jev=False)
    assert clean == {"carrier": None, "confidence": None, "remarks": []}, clean
    assert "замечаний нет" in format_check(clean)

    try:
        check("   ", journal, use_jev=False)
    except SystemExit:
        pass
    else:
        raise AssertionError("пустой черновик должен отклоняться")


def selftest():
    with tempfile.TemporaryDirectory() as tmp:
        journal, _sha = _selftest_repo(Path(tmp))
        _selftest_signals(journal, _sha)
        _selftest_glossary(journal)
        _selftest_triage(journal, Path(tmp))
        _selftest_check(journal, Path(tmp))
    print("selftest: ok")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--selftest", action="store_true")
    sub = parser.add_subparsers(dest="mode")
    triage_parser = sub.add_parser("triage")
    triage_parser.add_argument("journal", type=Path)
    triage_parser.add_argument("--jev", action="store_true")
    check_parser = sub.add_parser("check")
    check_parser.add_argument("--journal", type=Path, help="по умолчанию <корень репозитория>/docs/journal")
    check_parser.add_argument("--no-jev", action="store_true")
    for mode_parser in (triage_parser, check_parser):
        mode_parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    if args.selftest:
        return selftest()
    if args.mode == "triage":
        rows = triage(args.journal, use_jev=args.jev)
        print(json.dumps(rows, ensure_ascii=False, indent=2) if args.json else format_triage(rows))
        return 0
    if args.mode == "check":
        journal = (args.journal or (repo_root_of(Path.cwd()) or Path.cwd()) / "docs/journal").resolve()
        if not journal.is_dir():
            print(f"журнал не найден: {journal} — поиск похожих записей пропущен", file=sys.stderr)
        result = check(sys.stdin.read(), journal, use_jev=not args.no_jev)
        print(json.dumps(result, ensure_ascii=False) if args.json else format_check(result))
        return 0
    parser.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
