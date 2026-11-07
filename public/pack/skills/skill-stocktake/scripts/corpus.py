#!/usr/bin/env python3
"""Корпусные проверки навыков — то, что не видно при взгляде на один файл.

Дополняет lint.sh (пофайловый) и не повторяет его: description, его длину,
пересказ шагов и размер SKILL.md проверяет он. Здесь — только связи между
навыками и цена корпуса целиком.

  FAIL  name во frontmatter не совпадает с именем каталога
  FAIL  ссылка из SKILL.md ведёт на несуществующий файл
  WARN  два описания слишком похожи — модель будет путать навыки при выборе
  WARN  файл лежит в каталоге навыка, но из SKILL.md на него никто не ссылается
  INFO  сколько токенов имена и описания занимают в каждой сессии

Без зависимостей и без сети. Пороги читаются из ~/.claude/thresholds.yaml
(секция skills), значения по умолчанию — в DEFAULTS.

  python3 corpus.py                  # Claude: ~/.claude/skills + $PWD/.claude/skills;
                                     # Codex:  ~/.agents/skills + $PWD/.agents/skills —
                                     # каждая раскладка — отдельный корпус, пустая пропускается
  python3 corpus.py --json
  python3 corpus.py ~/other/skills
  python3 corpus.py --selfcheck

Идея проверок взята из muratcankoylan/Agent-Skills-for-Context-Engineering
(researcher/scripts/skill_health.py, check_activation_cases.py), MIT.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from itertools import combinations
from pathlib import Path

DEFAULTS = {
    # Доля общих слов в описаниях, выше которой навыки конкурируют за вызов.
    "activation_overlap": 0.30,
    # Сколько похожих пар печатать.
    "overlap_report_limit": 15,
    # Оценка бюджета старта: имена + описания всех навыков, в токенах.
    "startup_budget_tokens": 6000,
}

THRESHOLDS_FILE = Path.home() / ".claude" / "thresholds.yaml"

# Служебные слова и общая лексика описаний: без выброса любые два навыка
# «use when the user asks to…» выглядят похожими.
STOPWORDS = {
    "use", "when", "the", "and", "for", "with", "that", "this", "from", "into",
    "before", "after", "any", "all", "not", "but", "its", "their", "you", "your",
    "user", "users", "asks", "wants", "needs", "task", "tasks", "skill", "skills",
    "claude", "agent", "agents", "triggers", "covers", "also", "than", "then",
    "используй", "когда", "если", "для", "или", "это", "как", "что", "чтобы",
    "пользователь", "просит", "хочет", "нужно", "надо", "уже", "ещё", "еще",
    "задача", "задачи", "навык", "навыка", "скилл", "скилла",
}

WORD = re.compile(r"[^\W\d_][\w-]{2,}", re.UNICODE)
# Ссылки вида [текст](путь) — интересуют только относительные, не http и не якоря.
MD_LINK = re.compile(r"\[[^\]]*\]\(([^)#][^)]*)\)")
FENCE_LINE = re.compile(r"^\s*```")
SKIP_FILES = {".DS_Store", "results.json", "SKILL.md"}
SKIP_DIRS = {"__pycache__", ".git", "node_modules"}


def read_thresholds() -> dict[str, float]:
    """Точечное чтение секции skills из thresholds.yaml. Полный YAML не нужен."""
    values = dict(DEFAULTS)
    if not THRESHOLDS_FILE.exists():
        return values
    in_section = False
    for line in THRESHOLDS_FILE.read_text(encoding="utf-8").splitlines():
        if re.match(r"^skills:\s*$", line):
            in_section = True
            continue
        if in_section:
            if line and not line.startswith((" ", "\t", "#")):
                break
            m = re.match(r"\s+([a-z_]+):\s*([0-9.]+)", line)
            if m and m.group(1) in values:
                values[m.group(1)] = float(m.group(2))
    return values


def parse_frontmatter(text: str) -> dict[str, str]:
    """name и description, включая блочную форму (> и |)."""
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    block = text[3:end]
    data: dict[str, str] = {}
    key = None
    for line in block.splitlines():
        m = re.match(r"^([a-z][\w-]*):\s*(.*)$", line)
        if m:
            key, value = m.group(1), m.group(2).strip()
            if value in ("", ">", "|", ">-", "|-"):
                data[key] = ""
            else:
                data[key] = value.strip("\"'")
                key = None
        elif key and line.startswith((" ", "\t")):
            data[key] = (data[key] + " " + line.strip()).strip()
    return data


def tokens(text: str) -> set[str]:
    return {w for w in (m.group(0).lower() for m in WORD.finditer(text)) if w not in STOPWORDS}


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def discover(roots: list[Path]) -> list[Path]:
    found: list[Path] = []
    for root in roots:
        if root.is_dir():
            found.extend(sorted(root.glob("*/SKILL.md")))
    return found


def strip_fences(text: str) -> str:
    """Выбросить блоки в тройных кавычках.

    Внутри них лежат шаблоны для вставки в чужой проект: их ссылки указывают на
    файлы целевого репозитория и здесь не должны существовать. Проверять их —
    значит требовать, чтобы шаблон был рабочим по месту написания.
    """
    out, fenced = [], False
    for line in text.splitlines():
        if FENCE_LINE.match(line):
            fenced = not fenced
            continue
        if not fenced:
            out.append(line)
    return "\n".join(out)


def dead_links(skill_dir: Path, text: str) -> list[str]:
    dead = []
    for target in MD_LINK.findall(strip_fences(text)):
        target = target.split("#", 1)[0].strip()
        if not target or "://" in target or target.startswith(("~", "/", "$")):
            continue
        if not (skill_dir / target).exists():
            dead.append(target)
    return dead


def orphan_files(skill_dir: Path, text: str) -> list[str]:
    """Смотрим только корень навыка и references/.

    Остальные подкаталоги (learnings/, runs/, кэши) навыки наполняют сами во
    время работы — там несвязанный файл это норма, а не находка. Проверка по
    ним давала на порядок больше шума, чем сигнала.
    """
    candidates = [p for p in skill_dir.iterdir()] + list((skill_dir / "references").glob("*"))
    orphans = []
    for path in sorted(candidates):
        if not path.is_file() or path.name in SKIP_FILES or path.name.startswith("."):
            continue
        rel = str(path.relative_to(skill_dir))
        # Достаточно упоминания имени файла где угодно в теле — ссылки бывают
        # и в виде кода, и внутри bash-команд, не только markdown-ссылкой.
        if rel not in text and path.name not in text:
            orphans.append(rel)
    return orphans


def analyze(paths: list[Path], limits: dict[str, float]) -> dict:
    skills = []
    problems = []
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        fm = parse_frontmatter(text)
        directory = path.parent
        name = fm.get("name", "")
        if name != directory.name:
            problems.append({
                "level": "FAIL", "skill": directory.name, "check": "name",
                "detail": f"name={name!r} не совпадает с каталогом {directory.name!r}",
            })
        for target in dead_links(directory, text):
            problems.append({
                "level": "FAIL", "skill": directory.name, "check": "link",
                "detail": f"ссылка на несуществующий {target}",
            })
        for rel in orphan_files(directory, text):
            problems.append({
                "level": "WARN", "skill": directory.name, "check": "orphan",
                "detail": f"{rel} не упомянут в SKILL.md",
            })
        # Навык с disable-model-invocation вызывается только руками: его описание
        # не попадает в стартовый список и не участвует в выборе моделью. Значит
        # ни в бюджет старта, ни в коллизии активации он не входит.
        skills.append({
            "name": directory.name,
            "path": str(path),
            "description": fm.get("description", ""),
            "tokens": tokens(fm.get("description", "")),
            "model_invocable": str(fm.get("disable-model-invocation", "")).lower() != "true",
        })

    routed = [s for s in skills if s["model_invocable"]]
    pairs = []
    for a, b in combinations(routed, 2):
        score = jaccard(a["tokens"], b["tokens"])
        if score >= limits["activation_overlap"]:
            shared = sorted(a["tokens"] & b["tokens"])
            pairs.append({"a": a["name"], "b": b["name"], "overlap": round(score, 3), "shared": shared})
    pairs.sort(key=lambda p: -p["overlap"])
    pairs = pairs[: int(limits["overlap_report_limit"])]
    for p in pairs:
        problems.append({
            "level": "WARN", "skill": f"{p['a']} ↔ {p['b']}", "check": "activation",
            "detail": f"описания совпадают на {p['overlap']:.0%}: {', '.join(p['shared'][:8])}",
        })

    startup_chars = sum(len(s["name"]) + len(s["description"]) for s in routed)
    startup_tokens = startup_chars // 4
    if startup_tokens > limits["startup_budget_tokens"]:
        problems.append({
            "level": "WARN", "skill": "(корпус)", "check": "startup",
            "detail": f"имена и описания ≈{startup_tokens} токенов при бюджете "
                      f"{int(limits['startup_budget_tokens'])} — грузится каждую сессию",
        })

    return {
        "skills_checked": len(skills),
        "model_invocable": len(routed),
        "startup_tokens": startup_tokens,
        "overlap_pairs": pairs,
        "problems": problems,
        "fails": sum(1 for p in problems if p["level"] == "FAIL"),
        "warns": sum(1 for p in problems if p["level"] == "WARN"),
    }


def selfcheck() -> None:
    assert parse_frontmatter("---\nname: a\ndescription: >\n  два\n  слова\n---\nтело") == {
        "name": "a", "description": "два слова"
    }
    assert parse_frontmatter('---\nname: b\ndescription: "тест"\n---\n')["description"] == "тест"
    assert parse_frontmatter("нет frontmatter") == {}
    assert tokens("Use when the user asks to deploy the app") == {"deploy", "app"}
    assert jaccard({"a", "b"}, {"a", "b"}) == 1.0
    assert jaccard({"a"}, {"b"}) == 0.0
    assert jaccard(set(), {"a"}) == 0.0
    assert MD_LINK.findall("см [x](references/y.md) и [z](https://a.b)") == ["references/y.md", "https://a.b"]
    assert strip_fences("живая [a](x.md)\n```\nшаблон [b](y.md)\n```\nхвост") == "живая [a](x.md)\nхвост"
    assert MD_LINK.findall(strip_fences("```\n[b](y.md)\n```")) == []
    print("corpus.py selfcheck: ok")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("roots", nargs="*", type=Path, help="каталоги со скиллами")
    parser.add_argument("--json", action="store_true", help="машинный вывод")
    parser.add_argument("--selfcheck", action="store_true", help="проверить сам скрипт")
    args = parser.parse_args()

    if args.selfcheck:
        selfcheck()
        return 0

    if args.roots:
        corpora = [("", args.roots)]
    else:
        # Каждый харнесс грузит только свою раскладку: одинаковые копии навыка в
        # Claude и Codex не конкурируют за вызов и не складываются в бюджет старта.
        home, cwd = Path.home(), Path(os.getcwd())
        corpora = [
            ("claude", [home / ".claude" / "skills", cwd / ".claude" / "skills"]),
            ("codex", [home / ".agents" / "skills", cwd / ".agents" / "skills"]),
        ]

    limits = read_thresholds()
    reports = {}
    for label, roots in corpora:
        paths = discover([Path(r).expanduser() for r in roots])
        if paths:
            reports[label] = analyze(paths, limits)
    if not reports:
        print("corpus: навыков не найдено", file=sys.stderr)
        return 1
    fails = sum(r["fails"] for r in reports.values())

    if args.json:
        # Явные корни — прежняя схема (один отчёт); по умолчанию — {раскладка: отчёт}.
        payload = reports[""] if "" in reports else reports
        print(json.dumps(payload, ensure_ascii=False, indent=2, default=list))
        return 1 if fails else 0

    for label, report in reports.items():
        prefix = f"[{label}] " if label else ""
        for p in report["problems"]:
            print(f"{prefix}{p['level']} {p['skill']} [{p['check']}] — {p['detail']}")
        print("---")
        print(f"{prefix}corpus: проверено {report['skills_checked']} "
              f"(из них {report['model_invocable']} видны модели), "
              f"ошибок {report['fails']}, предупреждений {report['warns']}, "
              f"старт ≈{report['startup_tokens']} токенов")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
