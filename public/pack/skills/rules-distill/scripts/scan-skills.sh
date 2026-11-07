#!/usr/bin/env bash
# scan-skills.sh — enumerate skill files, extract frontmatter and UTC mtime
# Usage: scan-skills.sh [CWD_SKILLS_DIR]
# Output: JSON to stdout
#
# When CWD_SKILLS_DIR is omitted, defaults to $PWD/.claude/skills so the
# script always picks up project-level skills without relying on the caller.
# Codex layout is scanned too when present: ~/.agents/skills (global) and
# $PWD/.agents/skills (project). Missing dirs are skipped. Skills installed in
# both layouts are deduplicated by name (first occurrence wins).
#
# Environment:
#   RULES_DISTILL_GLOBAL_DIR   Override ~/.claude/skills (for testing only;
#                              do not set in production — intended for bats tests).
#                              When set, the real ~/.agents/skills is not scanned.
#   RULES_DISTILL_CODEX_GLOBAL_DIR  Override ~/.agents/skills (for testing only)
#   RULES_DISTILL_PROJECT_DIR  Override project dir detection (for testing only)

set -euo pipefail

GLOBAL_DIR="${RULES_DISTILL_GLOBAL_DIR:-$HOME/.claude/skills}"
CODEX_GLOBAL_DIR="${RULES_DISTILL_CODEX_GLOBAL_DIR:-}"
if [[ -z "$CODEX_GLOBAL_DIR" && -z "${RULES_DISTILL_GLOBAL_DIR:-}" ]]; then
  CODEX_GLOBAL_DIR="$HOME/.agents/skills"
fi
CWD_SKILLS_DIR="${RULES_DISTILL_PROJECT_DIR:-${1:-$PWD/.claude/skills}}"
CODEX_PROJECT_DIR=""
if [[ -z "${RULES_DISTILL_PROJECT_DIR:-}" && -z "${1:-}" ]]; then
  CODEX_PROJECT_DIR="$PWD/.agents/skills"
fi
# Validate CWD_SKILLS_DIR looks like a .claude/skills or .agents/skills path (defense-in-depth).
# Only warn when the path exists — a nonexistent path poses no traversal risk.
if [[ -n "$CWD_SKILLS_DIR" && -d "$CWD_SKILLS_DIR" && "$CWD_SKILLS_DIR" != */.claude/skills* && "$CWD_SKILLS_DIR" != */.agents/skills* ]]; then
  echo "Warning: CWD_SKILLS_DIR does not look like a .claude/skills or .agents/skills path: $CWD_SKILLS_DIR" >&2
fi

# Extract a frontmatter field (handles both quoted and unquoted single-line values).
# Does NOT support multi-line YAML blocks (| or >) or nested YAML keys.
extract_field() {
  local file="$1" field="$2"
  awk -v f="$field" '
    BEGIN { fm=0 }
    /^---$/ { fm++; next }
    fm==1 {
      n = length(f) + 2
      if (substr($0, 1, n) == f ": ") {
        val = substr($0, n+1)
        gsub(/^"/, "", val)
        gsub(/"$/, "", val)
        print val
        exit
      }
    }
    fm>=2 { exit }
  ' "$file"
}

# Get file mtime in UTC ISO8601 (portable: GNU and BSD)
get_mtime() {
  local file="$1"
  local secs
  secs=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null) || return 1
  date -u -d "@$secs" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null ||
  date -u -r "$secs" +%Y-%m-%dT%H:%M:%SZ
}

# Scan a directory and produce a JSON array of skill objects
scan_dir_to_json() {
  local dir="$1"

  local tmpdir
  tmpdir=$(mktemp -d)
  local _scan_tmpdir="$tmpdir"
  _scan_cleanup() { rm -rf "$_scan_tmpdir"; }
  trap _scan_cleanup RETURN

  local i=0
  while IFS= read -r file; do
    local name desc mtime dp
    name=$(extract_field "$file" "name")
    desc=$(extract_field "$file" "description")
    mtime=$(get_mtime "$file")
    dp="${file/#$HOME/~}"

    jq -n \
      --arg path "$dp" \
      --arg name "$name" \
      --arg description "$desc" \
      --arg mtime "$mtime" \
      '{path:$path,name:$name,description:$description,mtime:$mtime}' \
      > "$tmpdir/$i.json"
    i=$((i+1))
  done < <(find "$dir" -name "SKILL.md" -type f 2>/dev/null | sort)

  if [[ $i -eq 0 ]]; then
    echo "[]"
  else
    jq -s '.' "$tmpdir"/*.json
  fi
}

# --- Main ---

global_found="false"
global_count=0
global_skills="[]"

if [[ -d "$GLOBAL_DIR" ]]; then
  global_found="true"
  global_skills=$(scan_dir_to_json "$GLOBAL_DIR")
  global_count=$(echo "$global_skills" | jq 'length')
fi

project_found="false"
project_path=""
project_count=0
project_skills="[]"

if [[ -n "$CWD_SKILLS_DIR" && -d "$CWD_SKILLS_DIR" ]]; then
  project_found="true"
  project_path="$CWD_SKILLS_DIR"
  project_skills=$(scan_dir_to_json "$CWD_SKILLS_DIR")
  project_count=$(echo "$project_skills" | jq 'length')
fi

codex_global_found="false"
codex_global_count=0
codex_global_skills="[]"

if [[ -n "$CODEX_GLOBAL_DIR" && -d "$CODEX_GLOBAL_DIR" ]]; then
  codex_global_found="true"
  codex_global_skills=$(scan_dir_to_json "$CODEX_GLOBAL_DIR")
  codex_global_count=$(echo "$codex_global_skills" | jq 'length')
fi

codex_project_found="false"
codex_project_count=0
codex_project_skills="[]"

if [[ -n "$CODEX_PROJECT_DIR" && -d "$CODEX_PROJECT_DIR" ]]; then
  codex_project_found="true"
  codex_project_skills=$(scan_dir_to_json "$CODEX_PROJECT_DIR")
  codex_project_count=$(echo "$codex_project_skills" | jq 'length')
fi

# Merge all layouts; the same skill installed for Claude and Codex counts once,
# otherwise it would inflate the "2+ skills" evidence in Phase 2.
all_skills=$(jq -s 'add
  | reduce .[] as $s ({seen: {}, out: []};
      if ($s.name != "" and .seen[$s.name]) then .
      else .seen[$s.name] = true | .out += [$s] end)
  | .out' \
  <(echo "$global_skills") <(echo "$project_skills") \
  <(echo "$codex_global_skills") <(echo "$codex_project_skills"))

jq -n \
  --arg global_found "$global_found" \
  --argjson global_count "$global_count" \
  --arg project_found "$project_found" \
  --arg project_path "$project_path" \
  --argjson project_count "$project_count" \
  --arg codex_global_found "$codex_global_found" \
  --argjson codex_global_count "$codex_global_count" \
  --arg codex_project_found "$codex_project_found" \
  --argjson codex_project_count "$codex_project_count" \
  --argjson skills "$all_skills" \
  '{
    scan_summary: {
      global: { found: ($global_found == "true"), count: $global_count },
      project: { found: ($project_found == "true"), path: $project_path, count: $project_count },
      codex_global: { found: ($codex_global_found == "true"), count: $codex_global_count },
      codex_project: { found: ($codex_project_found == "true"), count: $codex_project_count }
    },
    skills: $skills
  }'
