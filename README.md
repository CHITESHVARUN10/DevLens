# DevLens

**See what your AI builds. Understand why it works.**
**North star: AI builds. Human understands.**

DevLens is a skill for AI coding agents that inserts human understanding checkpoints into agentic software development. It lets the AI do the heavy implementation while ensuring you periodically stop, understand what was built, why it was built, how it works, and how to review it yourself.

This repo is the DevLens skill source. All three phases are implemented — the complete PRD §7 command set (18 commands) is shipped.

## Commands

| Command | Purpose |
|---|---|
| `/devlens learn` | Enter Learning Mode; implement the next learning unit, then stop. |
| `/devlens learn continue` | Resume implementation and produce the next learning unit. |
| `/devlens learn review` | Recap what the most recent learning unit actually implemented. |
| `/devlens ask <question>` | Context-grounded question about the current unit/codebase. |
| `/devlens review [area]` | Guided walkthrough of how you should inspect the code yourself. |
| `/devlens tour [area]` | High-level map of the project or an area. |
| `/devlens explain [target]` | Structured explanation of overall/architecture/area/file/flow. |
| `/devlens concept [name]` | The programming concepts this project uses, in project terms. |
| `/devlens decision [id]` | Recorded design decisions (list, or detail one). |
| `/devlens why <decision>` | Reasoning behind one specific decision, with evidence. |
| `/devlens compare X vs Y` | Chosen approach vs. a named alternative. |
| `/devlens map [target]` | How related files/modules connect. |
| `/devlens trace <thing>` | One thing's journey through the code, hop by hop. |
| `/devlens changes [n]` | Human-readable summary of what changed. |
| `/devlens debug [symptom]` | Structured debugging walkthrough (six stages). |
| `/devlens bugs [id]` | Bug history (list, or detail one). |
| `/devlens postmortem [id]` | Narrative postmortem of one bug. |
| `/devlens recap [area]` | Session understanding summary from the artifacts. |
| `/devlens checkpoint <name>` | Manual, user-triggered understanding save. |
| `/devlens quiz [area]` | Quiz — the only path to CONFIRMED understanding. |

The full PRD lives in [PRD.md](PRD.md).

## How it works

- **Learning Mode** is a stateful execution mode: implement one *conceptual* learning unit, stop, explain (files → what they do → resulting flow → key concepts), and only continue on explicit `/learn continue`. The mode exits automatically when the plan completes.
- **Understanding is never assumed.** DevLens distinguishes EXPLAINED (explanation produced), ENGAGED (you interacted), and CONFIRMED (understanding tested) — and `/learn continue` is never treated as proof of understanding.
- **Caveman Mode** compresses DevLens's own output (checkpoints, maps) without ever stripping technical meaning, caveats, or risks.
- **State** lives in `.devlens/` in your project: `state/current.json` (mode, plan, current unit, awaiting-human flag) plus `checkpoints/` (one `.json` artifact per completed unit — no `.md`; the diff lives in git).

## Layout

```
SKILL.md              ← constitution: mission, principles, hard rules, dispatch
commands/             ← per-subcommand behavior (loaded on dispatch)
references/           ← protocols: state model, learning units, caveman, teaching, decision log, bug + quiz protocols, formats
scripts/              ← deterministic layer (Node.js, zero deps): state, checkpoint, decision, change, bug, quiz tooling
templates/            ← state schema, decision, bug + quiz artifact templates
adapters/             ← per-host installation/invocation (command-code done; others stubbed)
installer/            ← interactive npx installer (zero-dep Node.js; builds a self-contained package)
```

## Install

The interactive installer asks which harness(es) you use and which components you want, then installs everything in one go — no shell scripts, no manual copying:

```bash
npx devlens-installer
```

- **Core skill** → each selected harness's skills directory (e.g. `~/.commandcode/skills/devlens/`)
- **Wrapper commands** → each selected harness's commands directory (e.g. `~/.commandcode/commands/`), giving you the short aliases: `/learn`, `/ask`, `/tour`, `/dl-review`, `/explain`, `/concept`, `/decision`, `/why`, `/compare`, `/map`, `/dl-trace`, `/changes`, `/debug`, `/bugs`, `/postmortem`, `/recap`, `/checkpoint`, `/quiz`

`/review` and `/trace` collide with Command Code built-ins, so those wrappers are `/dl-review` and `/dl-trace`; `/skill:devlens review|trace` and `/devlens review|trace` always work.

The installer lives in [installer/](installer/) (zero-dependency Node.js); build the self-contained package with `npm run build`, then `npm publish`.

## The plan → learn loop

This is the intended way to build with DevLens:

1. `/plan <task>` — Command Code plans read-only; the plan is saved to `~/.commandcode/plans/<name>.md`.
2. In plan review press **`esc`** (Cancel) — the plan stays saved with status `not-implemented`. Do **not** press `ctrl+a` (Approve), which starts raw agent implementation without DevLens.
3. `/devlens learn` — DevLens finds the saved plan file (`scripts/plan.js locate`), splits it into learning units, implements unit 1, stops with a single-file checkpoint.
4. `/devlens learn continue` — review the checkpoint, then proceed to the next unit. Repeat until the plan completes and Learning Mode exits.

See [adapters/command-code/README.md](adapters/command-code/README.md) for details and fallbacks.

## Quick start

```bash
# in any project, with the skill installed:
/devlens tour                 # get the lay of the land
/devlens learn                # build something in learning units
/devlens learn continue       # proceed to the next unit
/devlens ask "why did you use X?"   # interrogate the current unit
/devlens debug                # structured debugging when something breaks
/devlens quiz                 # confirm your understanding
```

## Development

- Scripts are plain Node.js with zero dependencies — `node scripts/state.js get` etc. run from any project root.
- To smoke-test the deterministic layer in isolation: `node scripts/state.js init --plan-summary "t" --units "U1|U2"` inside a scratch git repo.
- The skill is valid standard Agent Skills (https://agentskills.io); the `name` in `SKILL.md` matches the directory name the installer expects (`devlens`).

## Status

- **Phase 1 (shipped):** core loop — `/learn`, `/learn continue`, `/learn review`, `/ask`, `/review`, `/tour`; Caveman protocol; learning-unit protocol; session state; Command Code adapter.
- **Phase 2 (shipped):** understanding & navigation — `/explain`, `/concept`, `/decision`, `/why`, `/compare`, `/map`, `/trace`, `/changes`; decision log + change extraction; decision artifacts.
- **Phase 3 (shipped):** debugging & reinforcement — `/debug`, `/bugs`, `/postmortem`, `/recap`, `/checkpoint`, `/quiz`; bug protocol + quiz protocol; bug artifacts, manual checkpoints, quiz audit trail.

**All 18 PRD §7 commands shipped across the three phases.** Deferred PRD §12 open questions: algorithmic learning-unit boundary detection, cross-harness plan detection, non-Command-Code adapters.
