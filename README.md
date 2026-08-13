# DevLens

**See what your AI builds. Understand why it works.**
**North star: AI builds. Human understands.**

DevLens is a skill for AI coding agents that inserts human understanding checkpoints into agentic software development. It lets the AI do the heavy implementation while ensuring you periodically stop, understand what was built, why it was built, how it works, and how to review it yourself.

This repo is the DevLens skill source. Phases 1–2 (core loop + understanding & navigation) are implemented; Phase 3 (debugging & reinforcement) per the PRD roadmap comes next.

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

The full PRD (including the Phase 3–4 command set) lives in [PRD.md](PRD.md).

## How it works

- **Learning Mode** is a stateful execution mode: implement one *conceptual* learning unit, stop, explain (files → what they do → resulting flow → key concepts), and only continue on explicit `/learn continue`. The mode exits automatically when the plan completes.
- **Understanding is never assumed.** DevLens distinguishes EXPLAINED (explanation produced), ENGAGED (you interacted), and CONFIRMED (understanding tested) — and `/learn continue` is never treated as proof of understanding.
- **Caveman Mode** compresses DevLens's own output (checkpoints, maps) without ever stripping technical meaning, caveats, or risks.
- **State** lives in `.devlens/` in your project: `state/current.json` (mode, plan, current unit, awaiting-human flag) plus `checkpoints/` (one structured artifact per completed unit).

## Layout

```
SKILL.md              ← constitution: mission, principles, hard rules, dispatch
commands/             ← per-subcommand behavior (loaded on dispatch)
references/           ← protocols: state model, learning units, caveman, teaching, decision log, formats
scripts/              ← deterministic layer (Node.js, zero deps): state, checkpoint, decision, change tooling
templates/            ← state schema, checkpoint + decision artifact templates
adapters/             ← per-host installation/invocation (command-code done; others stubbed)
```

## Install (Command Code)

```bash
ln -s ~/D-drive/DevLens ~/.commandcode/skills/devlens
cmd skills list --debug          # devlens should appear, no warnings

mkdir -p ~/.commandcode/commands
cp adapters/command-code/commands/*.md ~/.commandcode/commands/
# gives /learn, /ask, /tour, /dl-review, /explain, /concept, /decision, /why,
# /compare, /map, /dl-trace, /changes (see note below)
```

`/review` and `/trace` collide with Command Code built-ins, so those wrappers are `/dl-review` and `/dl-trace`; `/skill:devlens review|trace` and `/devlens review|trace` always work.

See [adapters/command-code/README.md](adapters/command-code/README.md) for details and fallbacks.

## Quick start

```bash
# in any project, with the skill installed:
/devlens tour                 # get the lay of the land
/devlens learn                # build something in learning units
/devlens learn continue       # proceed to the next unit
/devlens ask "why did you use X?"   # interrogate the current unit
```

## Development

- Scripts are plain Node.js with zero dependencies — `node scripts/state.js get` etc. run from any project root.
- To smoke-test the deterministic layer in isolation: `node scripts/state.js init --plan-summary "t" --units "U1|U2"` inside a scratch git repo.
- The skill is valid standard Agent Skills (https://agentskills.io); the `name` in `SKILL.md` matches the directory name the installer expects (`devlens`).

## Status

- **Phase 1 (shipped):** core loop — `/learn`, `/learn continue`, `/learn review`, `/ask`, `/review`, `/tour`; Caveman protocol; learning-unit protocol; session state; Command Code adapter.
- **Phase 2 (shipped):** understanding & navigation — `/explain`, `/concept`, `/decision`, `/why`, `/compare`, `/map`, `/trace`, `/changes`; decision log + change extraction; decision artifacts.
- **Phase 3 (PRD §7.5/§7.6):** debugging & reinforcement — `/debug`, `/bugs`, `/postmortem`, `/recap`, `/checkpoint`, `/quiz` — next plan.
