# How to Work with AI: ChatGPT, Codex, Claude, and Claude Code

The model answers quickly and confidently; the bottleneck is verification. Almost everything below is about what context to give it and how to tell whether you can trust the result.

This guide is split into pages in working order. **"For everyone"** is for people who work with AI in a chat or through an agent: managers, designers, analysts, marketing, developers. It goes from task setup to verifying the result, choosing a model, and your first skill. **"For developers"** is for people who write code in Claude Code and Codex: the same path, when the agent works in the repository on its own. **"Advanced"** covers how to hand work out to subagents and other vendors and keep spending under control. Reference material is separate: **"Models and pricing"**, **"Tools"**, and **"Download"**. Below on this page: where the data comes from and what we do not know yet.

Tags in parentheses: **(measured)** means checked on data or against the primary source, **(single source)** means one paper or vendor report, **(hypothesis)** means practice with no measurement. Most of the research is about agents in development; where I carry the conclusions over to chat work, it says "hypothesis". Models, features, and prices are current as of early November 2026 and change within a couple of months.

## Where this data comes from

This guide grew out of a pipeline I have been running for the last six months:

1. **Newsletters.** On a schedule, the Hermes agent reads my Gmail (read-only), throws out receipts and service mail, opens articles from tech digests, and writes an analysis into Obsidian.
2. **Research.** Topics pile up in a queue. For each one I write a prompt and run Gemini Deep Research. The raw report sits in the knowledge base and is not edited.
3. **Synthesis.** In Claude I compare the reports with each other and with primary sources and sort the conclusions into notes. Each note has a reliability tag: verified, single source, or hypothesis. The tags in parentheses in this guide come from there.
4. **Measurements.** Whatever can be checked on my own data, I check myself: knowledge base search, subagents, Jev, the tools from the "Tools" page.

In total, the knowledge base holds 68 research reports and 150+ analyzed newsletter articles.

The synthesis still has to be done by hand. I checked one digest against its sources: of 12 items, one held up. And a run through the research queue found an error in my own synthesis.

## What we do not know

- We have no team comparison of models on our own tasks. All the model tables are hypotheses.
- The data on the OpenAI lineup was collected through search: OpenAI help docs as a secondhand summary. I read the Codex models page directly on November 5, 2026. API prices were verified against the OpenAI price list on November 3, 2026. Sources disagree on the list of effort levels.
- Most of the numbers come from research on agents in development. They carry over to emails, analytics, and design by analogy, but they have not been measured there.
- I have no measurements of delegation on cheap models or of the effect of parallel worktrees. Typed judgments have not been tested on OpenAI.
- I have only tested installing claude-config-kit for Codex in a clean temporary HOME: the files land in the right place and parse. Nobody has yet tested how the kit's skills and subagents behave in live Codex sessions.
- Context loss on handoff between vendors and cache loss when switching vendors: I found no measurements. My trials of vendor combinations were one run each.
- I have only verified context hygiene on Claude Code. This procedure has not been verified for Codex.
- The threshold for "when to start a new chat" depends on the model. 30–40% of the context is a rough guideline.

A proposal: each person takes 5–10 of their typical tasks and runs them in two variants. For example, ChatGPT on Medium versus High, or implementation in Codex from a ready plan on Terra or Luna versus GPT-6.1 Sol, or with a template versus without one. We count how many results were accepted without rework and how much time went into edits. In a month we will have our own numbers instead of someone else's.

# Part 1. For everyone

## If you read only this

1. Explain why the task is needed and who the result is for. This affects quality more than the choice of model.
2. First have the model ask you questions or propose a plan. Then the result.
3. One task, one chat. A long conversation gets dumber toward the end.
4. Write important things down in a document: a decision left in a chat will get lost.
5. A confident tone means nothing. Check facts, numbers, and quotes against the source.
6. Allow the model to say "I don't know". Without that, it will make things up.
7. If it did not work, open a new chat with a refined task. Going around in circles with "redo it" does not help.
8. Hard work goes to ChatGPT on High or Pro. Routine work goes to Instant. The default is Medium.
9. Repeating the same task? Ask the model to make a skill for it.
10. Do not paste passwords, keys, or clients' personal data into a chat.

## How to set up a task

Everything starts with task setup: until you say why the task is needed, the model does not know.

- **The goal and why.** Not "write an email" but "an email to a client who has postponed payment for the third time; we want to keep the relationship but name a date". On one benchmark, explaining the goal raised the score from 18.5 to 61.7 (single source, agent benchmark).
- **Done criterion.** Length, format, tone, what absolutely must be there. The model does not know what "good" looks like for you.
- **Let it ask.** "Before you start, ask me about anything that is unclear." This is cheaper than three rounds of edits (hypothesis for chat; common practice in development).
- **An example instead of a description.** One good sample explains a style better than a paragraph of adjectives.
- **Roles do not work.** "You are a marketing expert with 20 years of experience" gives you nothing (single source). Constraints and criteria work.
- The model treats everything mentioned in the task as a requirement. Do not write "you could, for example, mention the discount" if the discount is not needed (single source: in development, a single mention of a tool increased its use ~160 times).

## Context

The task is set up. The next question is what the model sees along with it.

- **Less, but relevant.** A long conversation and ten files attached "just in case" make the answer worse. With long context, agent quality fell several times over (single source).
- **One task, one chat.** Quality sags long before the window limit.
- **Standing instructions** (projects in Claude, custom instructions in ChatGPT): keep them short, and include only what the model would get wrong without them: who you are, who the result is for, what never to do. Test every line with the question "if I delete this, will things get worse?". If not, delete it (hypothesis: carried over from the rules for AGENTS.md).
- **A document instead of chat memory.** For long work, keep a short file: the goal, the decisions made, what comes next. Start each new chat from it.
- **If the inputs change** (brief, budget, client requirements), start over. The model will stick to the old plan.

## Verification

You have an answer. Now you need to figure out whether you can trust it.

- The model does not distinguish knowledge from plausible fabrication. **Check facts, numbers, names, links, and quotes against the source.**
- Ask for links and open them: a link you have not opened confirms nothing.
- Add "if this is not in the materials, say you do not know". With this rule, in my measurement the reader made no reading errors: 0 of 15 questions against my knowledge base. Commercial assistants in the LongMemEval test make such errors 15–19% of the time (measured 2026-09-04, [[Second brain memory, reader evals 2026-09-04]]; the test setups differ, so this is a comparison, not a before and after).
- "Check yourself" helps little: the model is poor at assessing its own answer (single source). It is better to show the result to another model or a person.
- The more a mistake costs, the stricter the verification. A draft post and an email to a client are verified differently.

## If it fails

Verification showed that the result is bad. This is where people lose the most time.

- Do not paste a bad result back with the word "fix". The model clings to its attempt and repeats it. In an experiment on code this happened in 33–68% of cases, and with a clean restart in 2–14% (measured; carrying this over to chat is a hypothesis).
- It is better to open a new chat and state right in the task what was missing last time.

## Which model to use

The model is the last thing to choose: task setup affects the result more.

In ChatGPT there is one model, GPT-6. You choose the reasoning depth with the Thinking slider. What is available depends on your plan: according to third-party guides, Plus has Instant, Medium, and High, and Pro and Business also have Extra High and Pro (check against the help docs).

In Codex you choose two things: the model and the effort. There are four models: Luna, Terra, Sol, and Astra.

There are no team measurements; this breakdown is a hypothesis.

| Task | ChatGPT | Codex | Claude equivalent |
|---|---|---|---|
| Quick answer, reformatting, extracting fields, boilerplate translation | Instant | Luna, low | Haiku |
| Ordinary texts, emails, edits, meeting summaries | Medium | Terra, medium | Sonnet |
| Analysis, going through a contract or report, project plan | High | GPT-6.1 Sol, high | Opus |
| Strategic decision where a mistake is expensive; complex analytics | Extra High or Pro (on GPT-6 Astra) | Astra | Opus with extended thinking |
| Second check of something important | Another vendor: ChatGPT's answer goes into Claude, and vice versa | Another vendor: Codex's answer goes into Claude Code, and vice versa | — |

Examples:
- "Put these 40 reviews into a table: topic, tone, quote": Instant. There is nothing to think about here; it just takes care. Check 3–4 rows by eye.
- "Write a reply to this client's complaint, here is the correspondence": Medium. First ask it to put questions to you.
- "Go through the contract: what is unfavorable to us and where does the wording diverge from the appendix": High. Verify each finding against the contract clause.
- "Should we shut down line of business X, here are the numbers for the year": Pro. The decision is yours, and the answer is still a hypothesis. Ask separately for a list of assumptions.

The model lineup, caveats, prices, and Codex settings are collected on the "Models and pricing" page.

## Recurring tasks

When the same task comes back, there is no reason to set it up from scratch.

- If you do the same thing every week, turn it into a template: instructions, a sample, criteria. In ChatGPT this is a project, your own GPT, or a skill; in Claude, a project or a skill (check against the docs). Example: "weekly sales report" with a sample of the last report and a list of what to always check.
- The most valuable part of such a template is the list of places where the model has already made mistakes. A step-by-step recipe matters less.

## Try building your own skill

My advice: do not read about skills, make one. A skill is a written set of instructions that the model picks up on its own when it meets a suitable task. It is essentially the same template from the previous section, except that you do not have to launch it by hand.

1. **Pick a routine.** Take something that repeats and that you are tired of: a weekly report, going through reviews, answering a standard request, reconciling two tables. For a first try, choose a task where a mistake will not break anything: the skill should not send, delete, or pay on its own.
2. **Talk to the model.** Open ChatGPT, Codex, or Claude, whichever you have at hand, describe the task in ordinary words, and ask it to create a skill for it. If you have access to all three, give the same task to each: the difference explains a lot.
3. **Run it on a real task.** If it comes out badly, ask it to fix the skill, not just the result. That way the mistake will not come back next time.
4. **Open the file and read it.** It is usually a folder with `SKILL.md`: the name, the description, when to fire, and the instructions themselves. It is plain text, no programming needed. This is the moment it becomes clear how skills work.

You can start with a request like this:

```text
I want to make a skill for a recurring task: <what I do and how often>.
Here is what a good result looks like: <sample>.
First ask me questions, then create the skill and explain what it consists of.
```

Where this is done (verified against the help docs on November 6, 2026; the interface changes quickly):

- **ChatGPT.** Ask right in the chat: it will use the built-in skill-creator, ask you questions, and offer to install the result. Another path: Plugins in the sidebar, the Skills tab, Create, Create with chat. [OpenAI's help docs](https://help.openai.com/en/articles/20001066-skills-in-chatgpt) name the Business, Enterprise, Healthcare, and Edu plans, and no others.
- **Codex.** Invoke the built-in `$skill-creator`. It will ask what the skill does, when it fires, and whether it needs scripts ([docs](https://learn.chatgpt.com/docs/build-skills)).
- **Claude.** Open a new chat and write that you want to create a skill: Claude will ask questions and build `SKILL.md` ([tutorial](https://academy.claude.com/tutorials/how-to-create-a-skill-with-claude-through-conversation)). Skills are available on all plans, from Free to Enterprise, but code execution must be turned on, and ready-made skills are in Customize > Skills ([help docs](https://support.claude.com/en/articles/12512180-use-skills-in-claude)). In Claude Code a skill is also a folder with `SKILL.md`; ask for one to be created right in the course of your work ([docs](https://code.claude.com/docs/en/skills)).

One skill you built yourself explains more than any article: you see what the model understands right away and what has to be written down. After that you start noticing on your own the routine you can take off your plate (my experience, not measured). How to build skills for development is covered in the second part, in "Harness". Read other people's skills just as carefully before installing them: that is the next section.

## Data and security

The more the model can do and see, the more a mistake costs. So, separately, about limits.

- Do not paste passwords, tokens, keys, or clients' personal data into a chat. Company policy determines what is and is not allowed (hypothesis: our policy is not in the vault; check against it).
- Give an agent with access to email, calendar, or documents only the permissions it needs. If reading is enough, read-only.
- External content can contain instructions for the model. A known case: an agent took a marketplace review as a command to restock the warehouse (single source). Treat everything the model read from outside as data. If it calls for an action, a human confirms that action.
- Human confirmation is needed for anything irreversible: sending, paying, deleting, publishing. "Allow" on every step turns into "allow everything" a day later: people approve ~93% of requests and miss a third of the dangerous ones (single source).
- Other people's plugins, skills, and connectors only after a check. According to a Snyk audit, ~37% of public skills have security problems (measured, verified against the primary source).

## What not to do

- "Make it good" with no goal, criterion, or audience.
- One endless chat for all tasks.
- Going around in circles with "redo it" instead of a new chat.
- Numbers and quotes not checked against the source.
- Decisions that exist only in the conversation.
- Secrets and personal data in a chat. "Allow" on every step of the agent.

# Part 2. For developers: Claude Code and Codex

Everything from the first part applies here too. Below is what gets added when the agent itself reads the repository, runs commands, and writes code. The order is the same: first the work and its verification, then instructions, harness, and limits. Models and Codex settings are on the "Models and pricing" page; ready-made rules, skills, and subagents for both agents are on the "Download" page.

## If you read only this

1. Plan first, then code. Without an approved plan, the agent writes only one-line fixes.
2. Slice tasks vertically: schema → API → UI → test of one feature. Each slice is a new session.
3. "Done" is confirmed by a green test, tsc, a linter, or a screenshot. The agent's word is not enough.
4. Keep the context below ~40%. Roll back a failed attempt entirely; do not edit on top of it.
5. Write AGENTS.md by hand and keep it short. `/init` makes things worse.
6. Everything that can be checked by code goes into a hook or a linter. The model regularly skips a "MANDATORY" in the prompt.
7. Code search and review go to subagents. The reviewer is not the one who wrote the code.
8. Multi-agent setups only when necessary.
9. Protection is technical: sandbox, allowlist, narrow tokens, protected branches. Do not turn on `--dangerously-skip-permissions` anywhere near main.
10. Effort depends on the task. Maximum on everything costs several times more and is not always better.

## Task cycle

**Task setup.** The goal is measurable: "the component renders loading/empty/error, tests are green, tsc is clean". The budget and the point at which the agent calls a human are set in advance.

**Plan.** The agent asks questions first: UI states, props, API, edge cases. The plan is written as if a junior with no context will carry it out. For anything nontrivial, use plan mode. If it goes sideways, go back to planning.

**Library docs go through context7** (there is an MCP for both Claude Code and Codex). Even when the agent "already knows": its knowledge is older than the version in the lockfile. On a major version jump, state the version explicitly.

**Execution.**
- Vertical slices. Horizontal slicing, "all backend, then all frontend", gave ~75% rework; vertical gave 1–2 restarts per ticket (single source).
- A slice is a new session; a state file is passed between them.
- Small PRs, a commit every hour, squash on merge. The creator of Claude Code has a median of ~120 lines per PR.

**Verification.**
- "Done" is said by whatever could have said "no": a test, tsc, a linter, E2E, a screenshot.
- A normal finding: "`auth/session.ts` changed but not verified". An abnormal one: "8/10".
- An LLM judge on its own does not work. Maintainers would not have merged about half of the PRs that passed the SWE-bench tests (single source).
- For frontend, run it in a browser. A static validator gave 100/100 to a harness on which a neighboring audit of the same repository failed with exit 1 (run 2026-08-15, [[learn-harness-engineering — DR]]).
- Look at the diff, the database, and the files. The agent's report does not replace them.
- A check that cannot say "no" proves nothing. Comparing a value to itself or checking that "the code does what it does" is self-attestation.
- "All tests green" does not prove a specific criterion. For each criterion: a command, its output, and the case in which it would have failed.
- Data durability is verified by a new process that reads the state afresh. The process that wrote that state is no good for verifying it.
- A defect that keeps a criterion from being met is not renamed "tech debt" or "out of scope" in order to close the task. Either fix it or honestly write "criterion not met".

**Debugging.** For a bug with no stack trace, message, failing test, or reproduction steps: questions first, then work. If the cause is not obvious: 2–3 competing hypotheses, each with "what would confirm it, what would refute it", and check starting with the cheapest. After two failed attempts to fix it, stop and escalate. No third patch.

**Review.** A human looks at the contract: the intent, API, invariants, access. The internals go to agent review and automated checks. That is how the Codex team at OpenAI works. The review is done by a separate agent in a clean context that receives only the diff.

- A finding without `file:line` drops one level: blocker → warning, warning → suggestion.
- A comment can be rejected only with a one-line reason. Rejected comments are listed in the report alongside the accepted ones.
- Your own verdict is written down before anyone else's is opened. Otherwise the assessment bends toward whoever spoke first.
- Two agents with the same brief, model, and files are one source speaking twice. Agreement means something only if you varied the angle of the check, the files, or the model.

| Size | How |
|---|---|
| Bug in 1–2 files | Straight to work, verification is mandatory |
| Recurring scenario | Slash command or skill |
| Feature | Plan → slices → checks → review |
| Large feature | Orchestrator + subagents in separate git worktrees |
| Legacy, migrations | Separate mode, see below |

## AGENTS.md / CLAUDE.md

The cycle rests on what the agent knows about the project. That knowledge lives in the instructions.

- By hand, and only what is not obvious: nonstandard build and test commands, the package manager, critical prohibitions. The agent will read the folder structure on its own.
- `/init` hurts: a generated file lowered success and added ~20% to the cost, while a human-written one gave +4% (single source).
- No more than 20 lines.
- Rules live in one place, AGENTS.md: Codex, Cursor, and the others read it. CLAUDE.md is one line, `@AGENTS.md`, including in subprojects.
- If a CLAUDE.md sits next to it, Claude Code does not read AGENTS.md on its own, neither the root one nor nested ones. Without the import, your rules do not exist for it (measured on v2.1.289, check against the docs).
- The agent made a mistake and you corrected it → "update AGENTS.md so this does not happen again". Edits go through a PR.

## Context and sessions

Compact yourself, with a hint like "keep decisions X, questions Y, files Z": in Claude Code this is `/compact <what to keep>`, and for a new task `/clear`. Before compaction in long work, save the state to a file: there is a known case where auto-compaction ate 3 hours. Between sessions: `PLAN.md` (goal, decisions), `GATES.md` (what we verify with), `SESSION.md` (what is done, next step). For legacy: a memo, `docs/memos/<task>.md`, with invariants and what not to touch.

Claude Code memory has four layers: CLAUDE.md, auto memory, `/memory`, subagent memory. When it overflows, it stops working (check against the docs).

## Harness

The agent can skip a rule in the instructions. Everything that must fire every time goes into the harness.

The harness is everything around the model: instructions, hooks, skills, subagents, permissions, MCP. A working definition: **the harness is the list of mistakes the team has decided not to pay for twice.** A recurring review comment turns into a linter, a hook, a type, a test, or a skill.

Workarounds are temporary. After a model upgrade, run 20–50 tasks without the extension; if the result is no worse, delete it. Measure the cost of plugins the same way: `claude plugin eval` with and without the plugin, at least 3 runs on 10–20 tasks (check against the docs).

| Need | Tool |
|---|---|
| A check or prohibition expressible in code | Hook (PreToolUse / PostToolUse) |
| A scenario launched by hand | Slash command |
| Standards the agent pulls in on its own | Skill |
| Search, review, noisy work | Subagent |
| Access to an external system | MCP; when and how to call it goes in a skill |

**Hooks.**
- The basic set: after Edit/Write, a formatter and a linter; before Bash, a block on `rm -rf`, `git push --force` to main, and writes to `.env`.
- The model receives prose with a note saying "may not be relevant"; hook output gets no such discount.
- How I introduce a new prohibition: for a week the hook only logs what it would have blocked. If there are no false positives, I switch it to blocking.

**Skills.** The description says when to fire. A summary of the contents does not belong there. `SKILL.md` runs 50–200 lines, with details in `references/`. A skill for every little thing is noise; `/skill-doctor` shows the unused ones (check against the docs). Other people's skills: fork, read, pin by SHA. Check `.env`, `~/.ssh`, external addresses, `scripts/`, and `tests/`: malware in tests will fire on the next `npm test`.

**Subagents.** The benefit is context isolation. Limit `maxTurns` and `disallowedTools`, and use read-only where you can. Without limits, a subagent makes hundreds of pointless calls.

**Multi-agent setups.**
- One agent with five attempts and a vote beats automated multi-agent frameworks at the same cost (single source).
- Role graphs of the "PM → developer → QA" kind do not pay off: a linear pipeline with checks gets 27–33% on SWE-bench Lite versus <15%.
- Parallelism speeds up work but adds no quality. Without central verification, errors multiply ~17 times; with it, ~4 times.
- In practice: 3–5 sessions in separate git worktrees (the creator of Claude Code usually has five). The bottleneck is your acceptance.
- For how to combine different vendors, see "Multi-vendor team" in the third part.

**MCP.** Keep few servers, only for the project at hand, and do not change them mid-session. In your own servers, write proper descriptions: a poorly described one got 84% correct tool choice versus 100% (single source). For how to check this regularly, see "Context hygiene" in the third part.

**Permissions (check against the docs).** Known cases: a production database and its backups deleted in 9 seconds with an admin token from the code; a 108-hour run with `--dangerously-skip-permissions` pushed to main. Instead of the flag: `/sandbox` (according to Anthropic, −84% permission prompts), a narrow allowlist through `/permissions`, auto mode, `/fewer-permission-prompts`. A reviewer does not need merge, an explorer does not need write. CODEOWNERS and branch rules on `.github/`, migrations, auth, billing.

## Limits of autonomy

The harness determines what the agent can do. How much it may do without you depends on the task.

The agent's freedom is set by how strict the verification is and what a mistake costs. The model's confidence is no argument here.

| Zone | What | Mode |
|---|---|---|
| Green | Code under tests, UI drafts, scripts, docs | The agent does it, a human looks at the contract |
| Yellow | Legacy without tests, shared modules | First tests for the current behavior, in a separate pass |
| Red | DB migrations, infra, auth, payments | The agent proposes a Draft PR, a human applies it |

**Legacy.**
- The agent does not write tests for its own code: that way it locks in its own fabrications.
- Two passes: first tests for the original code, verified with mutation testing (≥80% of mutants killed); then the changes, with the tests read-only.
- A migration is finished when the old imports and the dependency are removed. Green tests alone do not mean that. On a migration benchmark, 5.4% of runs passed the full audit (measured).
- The agent copies the more frequent pattern, which is usually the old one. Name the target pattern explicitly.

**Background runs.** A spending limit, a timeout, a loop detector, a clean session for every run. Without these you get $23.82 a night on 97 idle runs.

## What not to do

- Code with no plan. Slicing into "all backend, then all frontend". The full process for a one-liner.
- `/init` instead of AGENTS.md, "MANDATORY" instead of a hook, different rules in CLAUDE.md and AGENTS.md.
- Acceptance on the agent's word. An agent that tests its own code and accepts its own work.
- Changing MCP servers mid-session. Maximum effort on everything.
- An "agent team" for show. Other people's skills without an audit. `--dangerously-skip-permissions` anywhere near main.
- Tokens and PR counts as a goal.

# Part 3. Advanced

This part is for people who already work confidently along the lines of Part 2. There are fewer measurements here and more of my own experience; the tags in parentheses still tell you how much to trust each claim. First we hand out work to subagents and other vendors, then we count what it costs. What stuck for me is collected on the "Tools" page.

## Delegating to subagents

A subagent is a separate agent with its own context: the main agent hands it a piece of work and gets the result back. **The main benefit is context isolation; speed is secondary:** 20 file reads stay with the subagent, and only the conclusion comes to you.

### When to delegate

| Delegate | Do not delegate |
|---|---|
| Code exploration: "where is this used", "how is the module built" | Bug in 1–2 files |
| Review of a diff in a clean context | A task where the steps depend on each other |
| Independent pieces: different modules, different sources | When one agent is already doing well |
| Noisy work: logs, long outputs, trying out variants | "For show" |

- Running in parallel saves time, but quality does not go up. 10 agents give ~3–5× the result and use noticeably more than that in tokens: at Anthropic, one agent spends ~4× the tokens of a chat, and a multi-agent system ~15× (single source, vendor data).
- On sequential tasks, coordination hurts: −70% versus +80% on divisible ones (single source). If a single agent already gives more than ~45% accuracy, an agent team does not help.
- Start with one agent and strict verification: a complicated scheme costs more and is no more accurate (single source). The numbers are in "Harness".

### How it works in Codex

Verified on Codex CLI 0.166 through the prompt the model sees. Check against the [docs](https://developers.openai.com/codex) if your version is different.

- Multi-agent setups are on by default. The model has `spawn_agent`, `wait_agent`, `followup_task`, `close_agent`.
- Built-in roles: `default`, `worker` (execution), `explorer`. A subagent inherits its parent's model and can launch its own subagents.
- `max_threads` limits the number of parallel agents. I set it to 4: beyond that, my acceptance is the bottleneck.
- Custom roles are defined in `config.toml`. A role file must contain `developer_instructions`, and it also holds the model, effort, and sandbox:

```toml
[agents]
max_threads = 4

[agents.explorer]
description = "Fast read-only exploration of the codebase. Returns a conclusion and links to lines."
config_file = "agents/explorer.toml"
```

```toml
# agents/explorer.toml
model = "gpt-6.1-terra"
model_reasoning_effort = "low"
sandbox_mode = "read-only"
developer_instructions = """
You are an explorer. You only read. Answer: a conclusion in 1–3 sentences, then `path:line - what is there`.
"""
```

- **Codex will not pick your custom role on its own.** The tool description says outright "do not specify a role unless explicitly asked". Say it in the request: "launch the explorer agent and find out...".
- Ready-made roles `explorer` (Terra, low, read-only) and `reviewer` (Sol, high, read-only, review against the acceptance criterion) are attached to this guide as separate files (`codex-agents/`). claude-config-kit does not have them: its reviewers are different, see "Ready-made pack".

### Subagent brief

A subagent does not see your conversation unless the history was passed to it. In Codex this is the `fork_turns` parameter: `none` is a clean slate, `all` is the whole history. Review needs a clean slate, and that means a full brief:

1. **Goal.** One sentence.
2. **Ownership.** Which files are its own and which must not be touched. Codex itself requires this of `worker`: "you are not alone in the codebase, do not revert other people's edits".
3. **Done criterion.** A command and the expected result.
4. **Response format.** What to return: a conclusion, a list of `file:line`, blockers.
5. **Orientation.** 2–6 specific files: AGENTS.md, the entry point, the task's modules. Not "figure out X".
6. **What does not count as a result.** Partial progress, a special case, a report on the work instead of the artifact. Each excluded outcome closes off one "looks like an answer" exit for the agent. State the return condition in terms of the artifact ("tests X and Y are green"). "The agent finished" does not count as a condition.
7. **Model, explicitly.** Without it, the subagent inherits the expensive model of the main session.

An empty result is a result too: the report must say "searched for Q, found nothing".

"You are a Senior Staff Engineer" in place of these seven items does not work.

### Verifying subagent results

- A subagent's report is only a claim. Verify it by the actual state: the file exists, the test is green, the API responds.
- A critical path needs at least one deterministic node: a compiler, tsc, a schema, tests. Three agents of the same model do not make an ensemble, because their errors coincide: ~30% misses at triple the budget (single source).
- Run checks sequentially, from cheap to expensive, with early exit. On average that is 1 + p + p² calls instead of 3: a saving of 63% at p = 10% and 10% at p = 90% (p is the share of runs where the check passes). Running checks in parallel wins only on time (single source).

### Cheap models for subagents

I hand exploration and mechanical work to Terra or Luna on low. The main agent does not have to stay on Sol, see "Models for development". A model that is too weak cannot carry the task even with a good harness.

My working example: a pre-check of the research queue, 6 parallel agents, 499 sources. The run found an error in my own synthesis: one company's numbers had been attributed to universities. The delegation paid off because the agents read the sources themselves, without my secondhand summary.

### My delegation rules

This is how I have it set up in Claude Code. It is practice with no measurements, except for the parallelism limit: that one appeared after a real failure.

1. **The main session runs the task, each other level covers its own part.** Sonnet 5.5 runs the task, hands out work, and writes code. Opus 5.5 acts as an advisor: a second opinion before a non-trivial plan and when the session is stuck. Decisions about interface, architecture, and disputed logic go to the `decider` subagent on Fable 5.2: it returns a decision, at least three rejected options, and acceptance criteria, and writes no code. Haiku 5.5 does the volume through `search` (a map of the area), `grep` (call sites), and `audit` (a check of the committed diff). Fable is not the advisor because an advisor cannot be limited to one kind of decision, and Fable is expensive.
2. **Jev settles the forks; a role or a lane picks the model.** For `search`, `grep`, `audit`, and `decider` the role fixes the model. For Orca and Herdr workers, `jev lane classify` names one of four lanes: small, medium, high, escalate. Inside a lane the rows go in order: a refusal, a quota, or a limit moves to the next one, and the same model sits at two vendors in a row. I go higher only if the lower lane has failed several times, and I turn Fable on in the escalate lane only after an explicit yes.
3. **I delegate when the gain exceeds the overhead.** A subagent studies the context from scratch, and then I read its report. Work that takes a couple of tool calls, and checking my own work, I keep for myself.
4. **No more than two subagents at a time.** Six parallel runs of vitest and tsc brought down my laptop (10 cores, 16 GB). A subagent checks only its own file; the full run happens once in the main session, when everyone has finished.
5. **A progress notification is not a result yet.** I wait for the final answer and reread the files myself, otherwise two agents will start writing to the same file.
6. **I accept subagent reviews by the rules in "Task cycle".**

## Multi-vendor team

Subagents usually run on the same model. The next step is to hand part of the work to another vendor.

I assemble a team of Claude, Gemini, DeepSeek, and Grok as a pipeline of files. There are no conversations between agents: one runs the work and launches the others by command, handoffs go through files, and verification decides.

**Why a second vendor.** It does not guarantee code quality: on SWE tasks, a lucky choice of roles gave +8 pp over the best single-vendor team, and an unlucky pair lost 36 pp (single source: [AgentCARD](https://arxiv.org/abs/2606.20629)). Order matters too: GPT-5.4→GLM 44, GLM→GPT-5.4 60. The pairs themselves do not carry over to current models. Several vendors are worth keeping for the price of volume, a large window, and a second opinion on review. Get the second opinion from a fresh session of the same model first: F1 40.7 versus 37.2 for GPT (single source: [Song](https://arxiv.org/abs/2610.01471)).

| Role | Who | What it passes on |
|---|---|---|
| Plan and acceptance | Main Claude session | Plan and criteria |
| Reading large context | Gemini | `HANDOFF.md` |
| Volume | DeepSeek in a separate git worktree | Code |
| Verification | Tests with a seeded bug | OK or FAILED |
| Review | Fresh session, then one strong external vendor | Findings |
| Decision | Human | Merge or rejection |

Inside Orca and Herdr the lanes set the order of models, and most models have a spare row at another vendor for when the first one runs out of quota (see “My delegation rules”).

I call other vendors' models from Bash through OpenCode. The `opencode-go` subscription gives DeepSeek, Gemini, GLM, Grok, and Kimi with one key (verified November 6, 2026):

```bash
opencode run --standalone --print-logs --log-level error --agent build \
  -m opencode-go/deepseek-v4.1-flash --format json --auto \
  "Read SPEC.md and HANDOFF.md. Create dur.py. Do not touch other files."
```

Before sending work code to a new vendor, consult "Data and security". I use DeepSeek only on my own projects.

**What the trial showed.** This was a plumbing check, one run each on a toy task. It does not compare model quality.

- The Gemini → file → DeepSeek → tests chain passed. A cycle cost $0.31–0.43 at the API price list. Nearly all of that is OpenCode's service preamble: 44–48K tokens per launch.
- The tests passed, but defects remained: the code accepted `"1h\n"`, and neither the handoff nor the tests covered that case.
- Of the two seeded bugs, the tests caught one. Neither of the two external reviewers got through the seeding completely, but each found what the other missed.
- A call can hang: with DeepSeek, 2 of ~6 did. You need a 180 s timeout and one retry.
- Each launch takes two steps, and the second nearly doubles the price. Take the first text response.

**Rules.**

- For every series of tasks, seed a known bug. The tests and the reviewer must catch it.
- A human verifies the findings of an external review. Such a review does not count as a merge gate.
- Checks at agent boundaries reduce hallucination survival from 58.4% to 16.2% (single source, n=346: [ICML 2026](https://icml.cc/virtual/2026/77915)).
- After 10–20 real tasks, calculate the cost per accepted result.
- On one machine, the A2A protocol is not needed and ACP is optional. A gateway router is for a product with users: in personal work, the cache loss easily eats what it saves.

## Saving tokens without losing quality

The more agents you run, the more noticeable the bill.

I save on what the model reads for nothing. I do not save on planning and verification: a cheap model without a plan ends up costing more because of rework. What you need to count is the cost per accepted task, not the price per token.

What cuts spending and barely affects quality:

| Technique | What it gives | Limit |
|---|---|---|
| Process large output outside the context: a script does the counting, and only the answer comes to the chat | ~84% of an agent session's tokens are raw tool outputs (single source: [Complexity Trap](https://arxiv.org/abs/2508.21433)). In one long session of mine, 33.1 MB shrank to 4.2 MB, −87% (context-mode self-report) | The model must see an error in the log verbatim, so the raw data stays available through search |
| Search instead of reading whole files: ygrep, code graph, reading only the needed lines | No measurement, same logic | The file is still read before an edit |
| Remove unneeded tools | ~16K of Hermes's ~25K standing context is tool schemas; the whole skill catalog is about 2.9K (measured). You will not get 20% by trimming instructions | Narrow the set before the session starts |
| Keep the start of the session unchanged | Cached input is 10 times cheaper, 30 hits out of 30 in a series (measured, Anthropic). Changing MCP or the system prompt mid-session resets the cache | Threshold of about 1024 tokens on Sonnet 4.6; anything shorter is not cached |
| New task in a new session | Every turn rereads everything, and spending grows faster than session length. The cache lowers it by 2–10 times but does not change the shape of the curve (single source) | Move memory out of the chat into rule files and the tracker |
| `/compact` at a phase boundary | Compaction resets the cache and pays off after 6–10 steps; 1–4 steps before the end of a task it is a net loss (calculation, single source) | Code quality drops after 40–60 steps or 40K–70K tokens (single source) |
| Your own compaction threshold | On a 1M window, compaction without configuration comes at about 967K. I have `"autoCompactWindow": 250000` in `settings.json` (verified against the config) | On long implementation work I go up to 250K and stop at a safe step |
| Hand volume to subagents | The noise stays in their context, and the main session gets the conclusion | A subagent studies the task from scratch, so small things are cheaper to do yourself |
| Model and effort by task | Plan on a strong model, implementation on Terra, exploration on Luna or Haiku. The numbers are in "Models for development" | A model that is too weak cannot carry the task even with a good harness |
| Accessibility tree instead of a screenshot | 200–500 tokens per step versus 1000–1600 (single source) | Where appearance matters, you need a screenshot: a text agent solves 1–7% of such tasks (single source) |
| Questions in one call | 10 typed questions in one call are 7 times faster, 1.56 s versus 10.92 s (measured) | Only where the questions read the same text |

What failed or hurts:

- **Compression on text.** Headroom took 51% off JSON and 0% off text (measured). First look at what is taking up your context.
- **Automatic model choice on every prompt.** Extra latency and no gain over one strong model, the numbers are in "Prices and measurements".
- **Frequently summarizing the history.** Simply hiding old outputs gave the same quality at half the cost, while a neural summary lengthened the agent's work by about 15% (single source). So keep compactions few, and drop history steps whole rather than rephrasing them.
- **A strong model reviewing itself, and maximum effort on everything.** Cost grows faster than quality, the numbers are in "Prices and measurements".

## Context hygiene: a monthly check

Savings quickly come to nothing if the tool set keeps growing.

Skills, MCP, plugins, and subagents pile up, and each one takes tokens at the start of every session. My startup takes 68.5K of 250K (measured). A one-off cleanup does not hold, so the check has to be regular and almost free. Everything below was verified on Claude Code 2.1.318.

| Step | What we do | Who decides |
|---|---|---|
| Measure | Capture `/context` and `/skill-doctor` | Script |
| Compare | Calls over 30 and 90 days against each tool's startup cost | Script |
| Decide | Turn off, or keep with a review date | Human |
| Turn off | One at a time, with a log and rollback | Human confirms |

What Claude Code already has:

- `claude -p "/context"` shows the cost by category and works without the model: `total_cost_usd 0`.
- `claude -p "/skill-doctor"` shows skills with no calls and their cost, also without the model. It does not see MCP.
- `/doctor` compares what is unused with its context cost and proposes edits, but it works only interactively.

The built-in commands measure, but they do not remember your decisions and offer no rollback. So my collector calls the built-in commands, counts calls from transcripts, and keeps a "keep until date" list, so that the same question does not come up every month. It takes 68 seconds, spends no model tokens (measured), and runs once a month. claude-config-kit does not have it yet.

Where it is easy to go wrong:

- **Zero calls proves nothing yet.** Only Claude Code transcripts on this machine are visible. A connector that lives on claude.ai or in Codex looks dead here, and a subagent for escalation is supposed to stay silent for months. Before turning something off, ask what error the tool prevents.
- **The sum of candidates is an upper bound.** I had 47 candidates for ~12.6K tokens. After going through them, ~6.5K remained: some servers stay silent but are still needed.
- **Schema size is not startup cost.** Under tool search I have 523.5K of deferred schemas. At startup a server pays only for names and instructions.
- **Check broken servers separately.** `claude mcp list` does not show the crashed ones. I had 13 servers that required authorization, were broken, or were not configured.
- **There is no reason to install a third-party cleaner.** unclog deletes without rollback; claude-slim rolls back but repeats what manual cleanup with confirmation already does. Read the code before installing.

## Typed judgments: the model as `if`

A separate way to save on checks: ask the model narrow questions and compute the decision in code.

This is a technique I have tried; it automates checks that a person now does by eye, and it is not only for developers.

**The idea.** Instead of "evaluate this text", the model answers atomic questions with fixed options: a choice from a list, a score on a scale, a probability of "yes". The final decision, weights, and thresholds are computed in code. The model works as a fast, smart `if`, and the code issues the verdict.

I ran this on Jev (TypeSafe). This model can give only such answers: in parallel, with probabilities, in fractions of a second and for cents.

### Where it works for me

| Task | Result | Cost |
|---|---|---|
| Checking a draft's numbers against sources before publication | 3/3 seeded errors caught; on a real draft, 4/5 facts confirmed, and the fifth went to a human | $0.0005 |
| NDA filter for drafts | Found a mention of an employer in a "finished" draft | $0.0018 for 13 drafts |
| Prompt injection protection on incoming material | 2/2 injections blocked | $0.0002 |
| Routing incoming material | 6/6 | $0.0003 |
| Decomposition versus one general question | General question: 0/3 matches with my labels; 10 atomic questions + a formula in code: 3/3 | $0.0009 for 10 documents |

All (measured), but on small samples.

### Where it does not work

- **A classifier of sessions by failure type** lost to a simple threshold of "how many events are in the session" (measured, 560 sessions).
- **A model router by request:** no better than "everything on a strong model". Rejected, the numbers are in "Prices and measurements".
- **Time and order.** On "the latest note", "received today", and zero-based numbering the model breaks. Code computes dates and indexes.
- **The form of the question changes the verdict.** The same text: 0.94 "needs edits" in a batch and 0.51 "done" on its own. Fix the wording of the question and do not touch it without remeasuring.
- **Decomposition does not guarantee improvement.** I split a question into binary ones with the old weights, and agreement with my labels fell to chance level (6/14). Only recalibration helped.
- **A model's self-reported "confidence" means nothing.** The confidence field on an ordinary model sat at 0.88–0.95 on every text in a row.

### Rules

1. One question, one judgment that a knowledgeable person makes in a second. All questions about one object go in one call: this is several times faster, the numbers are in "Saving tokens without losing quality".
2. Verdict, weights, and thresholds live in code. Raw answers are cached, so a threshold can change without repeat calls.
3. Three zones: confident goes automatic, medium gets a flag, unconfident goes to a human. The "human" zone is mandatory.
4. Thresholds come from your own labels, not from a feeling. With fewer than ~20 labeled examples, the auto zone is off: on 14 examples, even 14/14 gives a lower bound on accuracy of ~81%.
5. Always compare with a dumb baseline ("all yes", "by length"). Without it, 83% accuracy looks like success, though it may not be.
6. A veto is only for a critical defect. Style adds up into the score; otherwise rejection of honest texts grows with every veto question.

### How to do this on OpenAI

- **Structured Outputs.** The answer strictly follows a JSON schema: `enum` for a choice, a number for a score. This is the same guarantee of answer form. It does not guarantee that the judgment is right. I tested the same pattern on Gemini through `responseSchema`: 9/10 matches, a batch 7 times faster (measured). I did not test it on OpenAI (hypothesis: it should work the same way).
- **OpenAI Decisions API** (beta, on GPT-6 Luna). By its description, a direct analogue of Jev: "up to 10× faster than Responses API", from $0.10 per 1M input. I know it only from reviews and have not run it myself (single source, vendor data).

Candidates for the team: checking numbers in reports and newsletters before sending, a filter for confidential material in outgoing messages, labeling incoming requests, first-pass screening of PRs against a checklist.

## What not to do

- Subagents "for speed" on a sequential task. A brief with no file ownership and no done criterion.
- A subagent's report as proof. Three agents of one model as an "independent check".
- A confidence threshold tuned on a dozen examples. Trusting a confidence field the model assigned itself.
- A tool "because everyone has it", without an evening of measurement.
- A second vendor "for quality" without a seeded-bug check.
- Turning off a tool only because of zero calls.

# Models and pricing

A reference for both parts: what is in the lineup, what it costs, and how to set it up. Models and prices change within a couple of months, so the tables carry dates and links to sources.

## OpenAI lineup

As of November 2026, briefly:

| Model | Where | What for |
|---|---|---|
| GPT-6 Astra | ChatGPT Pro (Pro mode), Codex, API | The heaviest work. The most expensive |
| GPT-6.1 Sol | Codex (default on paid plans), API | Strong: feature plans, complex bugs, research, long tasks |
| GPT-6 Sol | ChatGPT (Instant–Extra High modes) | The main model in chat |
| GPT-6.1 Terra | ChatGPT Work, Codex, API | Fast: implementation from a plan, texts, images, computer control. Fabricates the least |
| GPT-6 Luna | Codex (default on Free/Go), API | Cheap: implementation from a plan, routine, classification, bulk operations. Not a source of facts |

The OpenAI data was collected from OpenAI's help docs, the Codex models page, and the [API price list](https://developers.openai.com/api/docs/pricing); before deciding, verify against [Codex models](https://developers.openai.com/codex/models) and the [ChatGPT help docs](https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt).

Caveats:
- A high reasoning level is not always needed. Each next step gives less gain and thinks longer (single source).
- On independent tests, Astra is not much smarter than GPT-6.1 Sol: 56.9 versus 54.5 on the Artificial Analysis composite index, at 5 times the price. GPT-6 Sol from chat has 47.6, a more noticeable gap. Terra has 51.0, Luna 27.8 (single source: [BenchLM on Artificial Analysis](https://benchlm.ai/blog/posts/gpt-6-models-compared), data as of October 28, 2026). On the [Artificial Analysis](https://artificialanalysis.ai/models/gpt-6-1-terra) pages, the same models at max effort are, rounded, 57, 55, 51, and 28; at lower effort the index is lower too. Pro is for heavy work; there is no reason to turn it on "just in case".
- An expensive mode does not guarantee a better result. Count how much time went into edits.

## Models for development

We count money per task that passed acceptance: inference, review, rework. Example: on a data-agent benchmark, GPT-6 Astra scored 51.8 points at $2.71 per task, GPT-6.1 Sol 49.5 at $0.49 (single source, vendor benchmark). The difference in quality is within the margin of error; the difference in price is 5.5 times. A counterexample: Fable 5.1 writes ~70% more tokens, and a task comes out ~20% more expensive, despite the cheap cache (single source).

| Task | Codex (OpenAI) | Claude Code (hypothesis) |
|---|---|---|
| Architecture, feature plan, non-obvious bug | GPT-6.1 Sol, effort high; Astra if Sol fails | Opus, effort high |
| Implementation from a ready plan | GPT-6.1 Terra, medium; fallback: GPT-6 Luna, high | Sonnet or Opus on medium |
| Code search, quick edits, layout from a screenshot | GPT-6.1 Terra | Haiku subagent |
| Bulk routine by schema, classification | GPT-6 Luna, low | Haiku, low |
| Review and QA | Another vendor: Claude reviews code from Codex, and vice versa | — |

**How this works for me.** About 80% of the time in Codex, Terra and Luna are enough for me. Once the system from this guide appeared, the work split into plans, stages, and delegation. The models started making fewer mistakes, and a strong model that can pull off a task from scratch from one prompt is rarely needed. My main model is Terra on medium. First came the system, then the cheap model.

### Codex models

What OpenAI claims ([Codex models page](https://developers.openai.com/codex/models), read November 5, 2026).

| Model | What for | Speed |
|---|---|---|
| GPT-6 Luna | Uniform volume: extraction, classification, template summaries, targeted code | High |
| GPT-6.1 Terra | Clear text, reading charts and screenshots, working in applications | High |
| GPT-6.1 Sol | Complex long work with code, applications, and documents, nearly Astra level | Medium |
| Astra | The hardest work from start to finish, where reasoning and judgment are needed | Lowest |

- **Effort.** This is the second knob: low, medium, high and above, up to Max and Ultra. In the app, low is called Light. OpenAI advises starting at the default level and raising it when the task lacks planning or analysis.
- **Max and Ultra.** Most tasks do not need them. Ultra launches subagents, so it suits only work that can be split into parts. Luna goes up to Max and has no Ultra.
- **App and Work.** There, presets replace the table: Power mode offers Luna High, GPT-6 Sol Light and Medium, Astra Light, Medium, and Extra High. That is GPT-6 Sol here, not 6.1. The Smarter/Faster slider moves the same setting, and in Advanced you can set the model, effort, and speed separately. Some paid plans do not see Astra Extra High.
- **What is available where.** The list depends on plan, client, and rollout. Terra's list does not include the IDE extension, and in the CLI it requires version 0.159.0 or newer. Check on your side: `/model` in the CLI or the model picker in the app.

Examples:
- "Put these 40 reviews into a table": Luna, low. Same logic as Instant.
- "Write a draft proposal, here are the charts for the quarter": Terra, medium. It reads the charts itself, but verify the numbers anyway.
- "Go through the contract and compare it with the appendix": GPT-6.1 Sol, high.
- "Should we shut down this line of business, here are the numbers and the billing code": Sol, high first. Astra only if the result was not enough.

### Prices and measurements

API prices per 1M tokens, input/output, Standard tier ([OpenAI price list](https://developers.openai.com/api/docs/pricing), verified November 3, 2026):

| Model | Price |
|---|---|
| Astra | $10 / $50 |
| Terra | $1 / $5 |
| Luna | $0.10 / $0.50 |
| Sol | $2 / $10 |

Input longer than 272K tokens: input ×2, output ×1.5, for all models. Fast is ×2, Batch and Flex are ×0.5. Cached input is 10 times cheaper than regular input.

A ChatGPT subscription and the API are counted differently: in Codex on a subscription you run into limits, not a bill.

- Fabrications when the model does not know the answer: Terra 34.5%, GPT-6.1 Sol 51.9%, Astra 49.8%, Luna 79.3% (single source: [BenchLM on Artificial Analysis](https://benchlm.ai/blog/posts/gpt-6-models-compared), a test of factual knowledge, not code). For data extraction and answers where it matters to say "I don't know", Terra is the first candidate. Luna is fit only when the facts are already in the input or the answer gets verified.
- At OpenAI, GPT-6.1 Sol on high scores 75.2% on a coding test, and 71.9% on max (single source, vendor chart).
- A small model does not always save money: it breaks tool arguments more often, and then the flagship has to fix things (single source).
- An auto-router that "will pick the model for the prompt on its own": I tried it, and got +1.6 s per request and no gain over "everything on a strong one" (measured, small sample).
- Effort: low→medium +17 points, medium→high +6, high→max +4 (single source, measured on Opus 5.5). Maximum spends up to 8× the tokens, and on some models produces more edits outside the task. At OpenAI, on xhigh, long multi-step tasks time out more often (single source). In Codex, the default effort for GPT-6.1 Sol, Astra, and Terra is **low**, and for Luna it is medium. Sol's levels: low, medium, high, xhigh, max, ultra (Codex CLI 0.166 model catalog; an account's live catalog may differ). So it is better to set effort explicitly for work from a plan.
- Self-review by a strong model: zero gain at +72% cost (single source).
- Prompts for Claude and GPT differ. Claude reads XML tags better; GPT/Codex reads Markdown and JSON better, with edits through `apply_patch`. Porting without adaptation cost up to 40% of accuracy. Example: a harness that gave 66.5% on GPT-5.2-Codex gave 59.6% on Opus 4.6 (single source).
- Cache: what resets it and how much it saves is covered in "Saving tokens without losing quality". The default TTL in Claude Code is one hour (measured, check against the docs).

## Codex

Config, sandbox modes, and exact values are in the [docs](https://developers.openai.com/codex). Below is what I gathered from them through secondhand summaries and third-party guides (check against the docs), and from the Codex team's principles.

**Model.**
- On paid plans, GPT-6.1 Sol is the recommended default; on Free/Go, GPT-6 Luna. GPT-5.5 was retired from Codex for ChatGPT sign-in on October 14, 2026.
- What is available to you specifically: `/model` in the CLI or the model picker in the app. If a model is rejected, your account does not have it yet.

**Default and one-off switching.** The default is set in `~/.codex/config.toml`:

```toml
model = "gpt-6.1-terra"
model_reasoning_effort = "medium"
```

For a single run, without editing the config:

```bash
codex -m gpt-6.1-sol -c model_reasoning_effort=high
```

How I divide it up:
- **Terra, medium.** The main work from a ready plan: features, tests, refactoring within a module. Medium is set explicitly in the config. Also data extraction, quick edits, layout from a screenshot, computer-control tasks.
- **Luna, high.** The fallback for work from a plan when price matters. We do not take facts from its answer without verification, so the plan and tests are mandatory.
- **Sol, high.** Feature plan, non-obvious bug, analysis of someone else's code. Start a new task here: the plan is worth more than the implementation.
- **Astra.** When Sol on high has failed twice. Not for every day: several times more expensive at almost the same intelligence by independent measurements, and subscription limits run out faster.
- **Luna, low.** Bulk mechanical work: renames from a list, fixture generation, labeling.

**Working rules:**
- AGENTS.md is mixed into every turn. Keep it short.
- Workarounds for model weaknesses are temporary: the reminder "run the tests" was removed when the model started doing it on its own; `/goal` went stale within a few months.
- Small and medium tasks need no harness.
- Switching to another provider takes ~10 lines of config.
- A good role alongside Claude Code is independent reviewer (hypothesis).

# Tools

The model and the environment around it are different things. Some tools read files, edit code, and run commands on their own; others spread parallel agents across branches and panes; still others serve as a fast working environment, a knowledge base, an interface generator, or a check filter. Below are twenty-one tools, split into four categories. The list will grow.

## My stack: what stuck and what did not

Everything mentioned in this guide and a few more tools, in one table.

| Tool | What for | Status | Conclusion |
|---|---|---|---|
| Claude Code + Hermes | Main agents: code and a "second brain" with memory, skills, cron | In use | Unneeded tools eat the most context, the numbers are in "Saving tokens without losing quality" |
| Orca | Parallel CLI agents: each task has its own folder in a git worktree | In use, daily | I like it a lot (opinion, not measured). It separates folders but does not replace an OS sandbox |
| Herdr | Background sessions of terminal agents, locally and over SSH; you can see who is waiting for an answer | In use, daily | I like it a lot (opinion, not measured). Sessions survive an SSH drop but not a full server reboot |
| Obsidian | Knowledge base that agents get context from | In use | Ranking by note freshness and status raised search accuracy from 13–20% to 73–87% (measured) |
| beads (`bd`) | Task tracker that agents read | In use | Tasks live in the tracker, not in chat or TODO files |
| Custom PreToolUse gate | "Do not touch X" rules in YAML, log-only at first | In use | I introduce new prohibitions in the order from "Harness"; the same order carries over to execpolicy in Codex |
| Artifact check script | A replacement for tests where there is no code: links, fields, indexes | In use | "Done" is checked by a predicate about the file |
| superpowers | Methodology as a set of skills: plan, TDD, review | Installed | A good starting point; on small things the process is excessive (opinion, not measured) |
| Exa | Search and research agents | In use | Fan-out across sources is the best case for parallel agents |
| Gemini Deep Research | Deep research on topics | In use | Gives a broad overview quickly, but citations must be verified against the primary source |
| context7 | Up-to-date library docs | In use | The model remembers a version older than the one in the lockfile |
| ygrep | Fast search over code and notes, including in plain language | In use | Answers "where does this live" |
| codebase-memory | Code graph | In use | Answers "who calls this and what will break", especially when reviewing a diff |
| ego-browser | Browser for the agent: QA, forms, screenshots | In use | I used it to check this guide in a browser. The agent does not enter logins or passwords |
| browser-use | Browser agent | Measured | A typical scenario in 12 s for half a cent; the demo is reproducible |
| Jev / typed judgments | Cheap checks and routing | In use on 4 loops | See "Typed judgments" |
| Headroom | Tool output compression | Installed in Codex (MCP) | JSON −51%, text 0%. Not needed unless tokens are a pain |
| context-mode | Large outputs are processed outside the context, the raw data sits in search | In use | Over 34 days, 126 MB stayed out of the context (tool self-report) |
| prompt-cache-control | Cache counter and countdown to its expiry above the input line | In use | Shows when `/compact` or `/clear` will cost more than continuing |
| agent-compact-advisor | A 0–100 score of whether this is a good moment for `/compact`, plus a ready command | In use | Does not compact anything itself. No measurement |
| Custom session classifier | Labeling agent failures | Measured, **does not work** | Lost to a simple threshold |
| Custom model router | Automatic model choice on every prompt; for subagents, four lanes: small (Haiku, low), medium (Sonnet, medium), high (Opus, medium), escalate (Opus, high) | Auto-router: measured, **rejected**; lanes: in use | The auto-router is slow and gives no gain. `jev lane classify` picks the lane; the hook before a subagent launch only reminds |
| mcpgrade | Quality scoring of MCP servers | Only read about | The criteria are useful for your own servers; do not introduce a score threshold without measuring |
| Toolshed | Narrowing the agent's tool list | Only read about | The security scanner returned a "dangerous" verdict, do not install |

Of twenty-four tools, I rejected two after measuring and one more after a security check. Installing a tool because "everyone has it" costs more than one evening of measurement.

# Download

The skills from this guide as an open archive, and the full kit of rules, hooks, and subagents for Claude Code and Codex.

## Skill pack

The skills from this guide and the ones I run every day are collected in one open archive: two for ChatGPT and twenty-one for Claude Code and Codex. It has no rules, hooks, or reviewer subagents; those stayed in claude-config-kit. Download the whole pack or tick the cards you need, and the install command will be built for your choice.

## Ready-made pack: claude-config-kit

You do not have to assemble the rules, skills, and subagents from the second part by hand.

Everything from the second part that installs as files is collected in the [Ascurse/claude-config-kit](https://github.com/Ascurse/claude-config-kit) repository. The repository is private: send me your GitHub login and I will add you. If you only need the skills, without rules and hooks, they are in an open archive in "Skill pack" above.

**What is inside.** Global rules: the verification, review, and delegation from this guide, written down for the agent. Thresholds, hooks, permissions, and the status line. 21 core skills, among them `doc-system`, `handoff`, `ship`, `security-scan`. 6 reviewer subagents: security, PR tests, swallowed errors, types, SQL, dead code. Optional packs: `frontend` (23 skills), `ideation` (11), `team-process` (5, written for Yandex Tracker and our Sentry, take them as a sample), and `stack-reviewers` (subagents for TS, React, Flutter, and Dart, Claude Code only).

**Installation.** Read `install.sh` first: the rule "other people's scripts only after a check" applies to mine too. Then:

```bash
git clone git@github.com:Ascurse/claude-config-kit.git && cd claude-config-kit && ./install.sh --all
```

This command installs the kit in Claude Code and in Codex. If you need only Claude Code, run `./install.sh --all --no-codex`; if only the core without packs, `./install.sh`. There is no "Codex only" flag. To see what lands where without touching anything of yours: `HOME=$(mktemp -d) ./install.sh --all`.

| | Claude Code | Codex |
|---|---|---|
| Skills | `~/.claude/skills/` | `~/.agents/skills/` |
| Rules | `~/.claude/CLAUDE.md` | `~/.codex/AGENTS.md` |
| Core subagents | `~/.claude/agents/*.md` | `~/.codex/agents/*.toml` |
| Hooks, permissions, status line | `~/.claude/` | not installed |

The Codex docs name only `~/.agents/skills/` for personal skills. Codex 0.160 and 0.162 also read the old `~/.codex/skills/` folder (measured, November 6, 2026), but this is promised nowhere, so put new skills in `~/.agents/skills/`.

**What the script does to your files.** If you already have `CLAUDE.md` or `~/.codex/AGENTS.md`, the new one lands next to it as `CLAUDE.kit.md` or `AGENTS.kit.md`, and you will have to merge by hand. Permissions in `settings.json` are merged with yours (this requires `jq`), and an already configured hooks section stays as it was. `settings.json`, `thresholds.yaml`, the status line, and same-named skills and subagents on the Codex side are copied to `~/.claude/backups/kit-<timestamp>/` before replacement. **Without a backup**, same-named skills in `~/.claude/skills/`, subagents in `~/.claude/agents/`, and files in `~/.claude/hooks/` are overwritten. If you have your own with the same names there, save them before running.

**After installation.**
1. The rules were written for me. Go through `CLAUDE.md`: the package manager, the language of comments and answers, mentions of tools you do not have. Codex has the same text with a header, so an edit to one copy has to be carried over to the other by hand.
2. External tools are installed separately: ygrep, beads (`bd`), context7, codebase-memory-mcp. The kit works without them too, but the rules that refer to them then do nothing. context7 for Codex is installed with `codex mcp add context7 -- npx -y @upstash/context7-mcp`.
3. Claude Code plugins are installed through `/plugin`: superpowers, template-bridge, ygrep, remember.
4. To update, do a `git pull` and run `./install.sh` again.

**Codex gotchas.**
- Hooks and permissions from the kit work only in Claude Code. Codex has its own formats (`config.toml`, `hooks.json`), and the kit does not touch them.
- Subagents in Codex have no `model` field, so they inherit the main session's model. If you want cheaper reviews, add `model` and `model_reasoning_effort` to the file yourself.
- Name the subagent's role directly: "launch security-reviewer and check...". The reason is explained in "How it works in Codex".
- The rules were originally written for Claude Code. The header in `AGENTS.md` explains to Codex how to read `@path`, multiple-choice questions, and the task plan, but I have not measured whether this translation works (hypothesis).
