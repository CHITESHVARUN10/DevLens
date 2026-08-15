---
name: devlens
description: Inserts human understanding checkpoints into agentic coding sessions — learning units with stop-and-review loops, guided code inspection, project tours, and context-aware Q&A. Use when the developer runs /devlens, /learn, /ask, /review, or /tour, or asks to understand what the AI built and why.
argument-hint: "learn [continue|review] | ask <question> | review [area] | tour [area]"
---

# DevLens

**North star: AI builds. Human understands.**

DevLens is a developer understanding and involvement layer for agentic coding. It turns AI plan execution into a sequence of human-paced learning units: implement a coherent chunk, stop, explain it, let the human interrogate it, and only continue on explicit request. It is not a code-quality reviewer, not a token-efficiency tool, and not a replacement for the coding agent.

## When to use this skill

Activate when the user runs any DevLens command (`/devlens`, `/learn`, `/ask`, `/review`, `/tour`) or asks to understand what was built and why. When the user asks to *build* something and then says "learn mode", "checkpoint me", or "explain as you go", suggest `/devlens learn`.

## Dispatch

Parse the first argument and load the matching subcommand file (progressive disclosure — load only what's needed):

| First argument | Load | Behavior |
|---|---|---|
| `learn` (bare, `continue`, `review`) | [commands/learn.md](commands/learn.md) | Learning Mode: implement one unit, stop, explain. |
| `ask` | [commands/ask.md](commands/ask.md) | Context-grounded Q&A about the current unit/codebase. |
| `review` | [commands/review.md](commands/review.md) | Guided walkthrough of how the developer inspects the code. |
| `tour` | [commands/tour.md](commands/tour.md) | High-level project/area map. |
| `explain` | [commands/explain.md](commands/explain.md) | Structured explanation of overall/architecture/area/file/flow. |
| `concept` | [commands/concept.md](commands/concept.md) | The project's programming concepts, in project terms. |
| `decision` | [commands/decision.md](commands/decision.md) | Surface recorded design decisions and why. |
| `why` | [commands/why.md](commands/why.md) | Reasoning behind one specific decision, with evidence. |
| `compare` | [commands/compare.md](commands/compare.md) | Chosen approach vs. a named alternative. |
| `map` | [commands/map.md](commands/map.md) | How related files/modules connect. |
| `trace` | [commands/trace.md](commands/trace.md) | One thing's journey through the code, hop by hop. |
| `changes` | [commands/changes.md](commands/changes.md) | Human-readable summary of what changed. |
| `debug` | [commands/debug.md](commands/debug.md) | Structured debugging walkthrough (six-stage protocol). |
| `bugs` | [commands/bugs.md](commands/bugs.md) | Bug history from `.devlens/bugs/`. |
| `postmortem` | [commands/postmortem.md](commands/postmortem.md) | Narrative postmortem of one bug. |
| `recap` | [commands/recap.md](commands/recap.md) | Session understanding summary from the artifacts. |
| `checkpoint` | [commands/checkpoint.md](commands/checkpoint.md) | Manual, user-triggered understanding save. |
| `quiz` | [commands/quiz.md](commands/quiz.md) | Quiz — the only path to CONFIRMED. |
| *(none)* | — | Status + help, per [references/response-format.md](references/response-format.md) §6. |

Anything else: show usage; never act on an unknown subcommand.

## Hard rules (non-negotiable — PRD §13)

1. `/learn` changes execution behavior — it is a stateful mode, not a passive explanation.
2. The agent **never proceeds past a learning checkpoint without an explicit `/learn continue`** — no exceptions, no "while I'm here".
3. Learning units are **conceptual** (coherent concept, inspectable size), never per-file or per-task checklists.
4. Learning Mode **exits automatically** when the active plan completes — it does not persist indefinitely.
5. `/ask` always uses the current learning context as **primary grounding**, not generic chat.
6. `/review` teaches the human to inspect code themselves — it is **never** an AI code-quality verdict.
7. Debugging is first-class learning material — never an invisible background process. Use `/debug` (six-stage protocol), record bugs as artifacts, and postmortem them. (PRD §7.5)
8. Caveman Mode compresses communication; it **never** removes technical meaning, caveats, or risk information.
9. DevLens **does not fabricate understanding**: EXPLAINED / ENGAGED / CONFIRMED are distinct states and are never conflated; `/learn continue` is a choice to proceed, **never** evidence of understanding. `/quiz` is the mechanism that reaches CONFIRMED.
10. `.devlens/` stores meaningful structured artifacts only — not a transcript.
11. DevLens state is session-scoped; it is not a long-term personal memory system.

## Learning Mode state machine

```
NORMAL MODE
   │  /devlens learn
   ▼
LEARNING MODE
   │  implement unit 1
   ▼
AWAITING CONTINUE   ← explanation delivered; agent stops
   │  /devlens learn continue
   ▼
LEARNING MODE
   │  ... repeat ...
   ▼
PLAN COMPLETE  →  NORMAL MODE (automatic)
```

State lives in `.devlens/state/current.json` in the **user's project** (git root, else cwd) — mode, active plan, current unit, awaiting-human flag. All state changes go through the scripts so transitions stay valid.

## Understanding states (never conflate)

- **EXPLAINED** — an explanation was produced. Weakest state; says nothing about the human.
- **ENGAGED** — the user actively interacted (`/ask`, `/review`, `/tour`). Positive signal, not proof.
- **CONFIRMED** — understanding was tested/demonstrated via `/quiz` (the only path), or an explicit user confirmation.

`/learn continue` is **never** any of these. Never claim the user understands anything without a CONFIRMED-level signal.

## References (load on demand)

- [references/state-model.md](references/state-model.md) — state schema + legal transitions
- [references/learning-unit.md](references/learning-unit.md) — what counts as a learning unit
- [references/caveman.md](references/caveman.md) — compression protocol + response depths
- [references/teaching-mode.md](references/teaching-mode.md) — how `/ask` escalates into teaching
- [references/decision-log.md](references/decision-log.md) — when and how design decisions get recorded
- [references/bug-protocol.md](references/bug-protocol.md) — the six-stage debugging protocol
- [references/quiz-protocol.md](references/quiz-protocol.md) — question design, grading, the CONFIRMED rules
- [references/response-format.md](references/response-format.md) — exact output templates

## Scripts (deterministic layer)

All paths below resolve to `${COMMANDCODE_SKILL_DIR}` (or fall back to the skill directory). Run from the project root.

```bash
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" get                     # current state
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" init --plan-summary "..." --plan-source agent --units "U1|U2"
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" set-mode learning
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" set-unit --name "..." --index 0
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" complete-unit
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" complete-plan
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" set-understanding <unit-id> engaged
node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint.js" write --unit <id> --name "..." --summary "..." --concepts "a,b" --flow "..." --diff
node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint.js" latest
node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" add --title "..." --what "..." --why "..." [--alternatives "a,b"] [--consequences "..."]
node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" list            # recorded decisions
node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" get <id|topic>  # one decision
node "${COMMANDCODE_SKILL_DIR}/scripts/changes.js" since-last --json  # diff since checkpoint marker (or HEAD)
node "${COMMANDCODE_SKILL_DIR}/scripts/changes.js" since <ref> --json  # diff against a ref
node "${COMMANDCODE_SKILL_DIR}/scripts/changes.js" history <n> --json  # last n checkpoints + their files
node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" add --title "..." --symptom "..." --root-cause "..." --fix "..." --verification "..." [--lesson "..."]
node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" list / get <id|topic> / latest
node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint-extra.js" save --name "..." --notes "..." [--area "..."]   # manual checkpoint
node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint-extra.js" list-manual
node "${COMMANDCODE_SKILL_DIR}/scripts/quiz.js" record --unit <unit-id> --result confirmed|partial|failed --detail "..."
node "${COMMANDCODE_SKILL_DIR}/scripts/quiz.js" summary [--unit <unit-id>]
node "${COMMANDCODE_SKILL_DIR}/scripts/quiz.js" set-confirmed <unit-id>   # the one place the confirmed transition lives
```

If a script fails, stop and report — never continue with broken or guessed state.

## Templates

- [templates/state.schema.json](templates/state.schema.json) — machine-readable state schema (validated on every read/write)
- [templates/decision.md](templates/decision.md) — decision artifact template
- [templates/bug.md](templates/bug.md) — bug artifact template
- [templates/quiz.md](templates/quiz.md) — quiz session template
