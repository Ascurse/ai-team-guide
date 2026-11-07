---
name: security-scan
description: Scan your Claude Code configuration (.claude/ directory) for security vulnerabilities, misconfigurations, and injection risks using AgentShield, and apply the same checks to the Codex layout (~/.codex, AGENTS.md) when present. Checks CLAUDE.md/AGENTS.md, settings.json/config.toml, MCP servers, hooks, and agent definitions.
metadata:
  origin: ECC
---

# Security Scan Skill

Audit your Claude Code configuration for security issues using [AgentShield](https://github.com/affaan-m/agentshield). AgentShield is documented for the `.claude/` layout; if the machine also has Codex (`~/.codex/`, `.codex/`), review the Codex files from the table below by hand with the same checks. Skip a layout that isn't there.

## When to Activate

- Setting up a new Claude Code or Codex project
- After modifying `.claude/settings.json` / `.codex/config.toml`, `CLAUDE.md` / `AGENTS.md`, or MCP configs
- Before committing configuration changes
- When onboarding to a new repository with existing Claude Code or Codex configs
- Periodic security hygiene checks

## What It Scans

| File (Claude Code) | Codex counterpart (manual) | Checks |
|------|------|--------|
| `CLAUDE.md` | `AGENTS.md`, `~/.codex/AGENTS.md` | Hardcoded secrets, auto-run instructions, prompt injection patterns |
| `settings.json` | `~/.codex/config.toml` (`approval_policy`, `sandbox_mode`), `~/.codex/rules/*.rules` | Overly permissive allow lists, missing deny lists, dangerous bypass flags |
| `mcp.json` | `[mcp_servers.*]` in `config.toml` | Risky MCP servers, hardcoded env secrets, npx supply chain risks |
| `hooks/` | `~/.codex/hooks.json` or `[hooks]` in `config.toml` | Command injection via interpolation, data exfiltration, silent error suppression |
| `agents/*.md` | `~/.codex/agents/*.toml` | Unrestricted tool access, prompt injection surface, missing model specs |

## Prerequisites

AgentShield must be installed. Check and install if needed:

```bash
# Check if installed
npx ecc-agentshield --version

# Install globally (recommended)
npm install -g ecc-agentshield

# Or run directly via npx (no install needed)
npx ecc-agentshield scan .
```

## Usage

### Basic Scan

Run against the current project's `.claude/` directory (Codex files — by hand, see the table above):

```bash
# Scan current project
npx ecc-agentshield scan

# Scan a specific path
npx ecc-agentshield scan --path /path/to/.claude

# Scan with minimum severity filter
npx ecc-agentshield scan --min-severity medium
```

### Output Formats

```bash
# Terminal output (default) — colored report with grade
npx ecc-agentshield scan

# JSON — for CI/CD integration
npx ecc-agentshield scan --format json

# Markdown — for documentation
npx ecc-agentshield scan --format markdown

# HTML — self-contained dark-theme report
npx ecc-agentshield scan --format html > security-report.html
```

### Auto-Fix

Apply safe fixes automatically (only fixes marked as auto-fixable):

```bash
npx ecc-agentshield scan --fix
```

This will:
- Replace hardcoded secrets with environment variable references
- Tighten wildcard permissions to scoped alternatives
- Never modify manual-only suggestions

### Opus 4.6 Deep Analysis

Run the adversarial three-agent pipeline for deeper analysis (an AgentShield mode on the Anthropic API — works the same whichever agent you use):

```bash
# Requires ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY=your-key
npx ecc-agentshield scan --opus --stream
```

This runs:
1. **Attacker (Red Team)** — finds attack vectors
2. **Defender (Blue Team)** — recommends hardening
3. **Auditor (Final Verdict)** — synthesizes both perspectives

### Initialize Secure Config

Scaffold a new secure `.claude/` configuration from scratch (Claude Code layout only):

```bash
npx ecc-agentshield init
```

Creates:
- `settings.json` with scoped permissions and deny list
- `CLAUDE.md` with security best practices
- `mcp.json` placeholder

### GitHub Action

Add to your CI pipeline:

```yaml
- uses: affaan-m/agentshield@v1
  with:
    path: '.'
    min-severity: 'medium'
    fail-on-findings: true
```

## Severity Levels

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Secure configuration |
| B | 75-89 | Minor issues |
| C | 60-74 | Needs attention |
| D | 40-59 | Significant risks |
| F | 0-39 | Critical vulnerabilities |

## Interpreting Results

### Critical Findings (fix immediately)
- Hardcoded API keys or tokens in config files
- `Bash(*)` in the allow list (unrestricted shell access); Codex: an over-broad allow prefix rule in `~/.codex/rules/` or a no-approval `approval_policy` with a wide `sandbox_mode`
- Command injection in hooks via `${file}` interpolation
- Shell-running MCP servers

### High Findings (fix before production)
- Auto-run instructions in CLAUDE.md / AGENTS.md (prompt injection vector)
- Missing deny lists in permissions
- Agents with unnecessary Bash access

### Medium Findings (recommended)
- Silent error suppression in hooks (`2>/dev/null`, `|| true`)
- Missing PreToolUse security hooks (Claude `settings.json` / Codex `hooks.json`)
- `npx -y` auto-install in MCP server configs

### Info Findings (awareness)
- Missing descriptions on MCP servers
- Prohibitive instructions correctly flagged as good practice

## Links

- **GitHub**: [github.com/affaan-m/agentshield](https://github.com/affaan-m/agentshield)
- **npm**: [npmjs.com/package/ecc-agentshield](https://www.npmjs.com/package/ecc-agentshield)
