# DevLens

**See what your AI builds. Understand why it works.**
**North star: AI builds. Human understands.**

DevLens is a skill for AI coding agents that inserts human understanding checkpoints into agentic software development. It lets the AI do the heavy implementation while ensuring you periodically stop, understand what was built, why it was built, how it works, and how to review it yourself.

This repo is the DevLens skill source. Phase 1 (the protected core loop) is implemented; later phases per the PRD roadmap are stubbed.

## Phase 1 commands

| Command | Purpose |
|---|---|
| `/devlens learn` | Enter Learning Mode; implement the next learning unit, then stop. |
| `/devlens learn continue` | Resume implementation and produce the next learning unit. |
| `/devlens learn review` | Recap what the most recent learning unit actually implemented. |
| `/devlens ask <question>` | Context-grounded question about the current unit/codebase. |
| `/devlens review [area]` | Guided walkthrough of how you should inspect the code yourself. |
| `/devlens tour [area]` | High-level map of the project or an area. |

The full PRD (including the Phase 2–4 command set) lives in [PRD.md](PRD.md).

## How it works

- **Learning Mode** is a stateful execution mode: implement one *conceptual* learning unit, stop, explain (files → what they do → resulting flow → key concepts), and only continue on explicit `/learn continue`. The mode exits automatically when the plan completes.
- **Understanding is never assumed.** DevLens distinguishes EXPLAINED (explanation produced), ENGAGED (you interacted), and CONFIRMED (understanding tested) — and `/learn continue` is never treated as proof of understanding.
- **Caveman Mode** compresses DevLens's own output (checkpoints, maps) without ever stripping technical meaning, caveats, or risks.
- **State** lives in `.devlens/` in your project: `state/current.json` (mode, plan, current unit, awaiting-human flag) plus `checkpoints/` (one structured artifact per completed unit).

## Layout

```
SKILL.md              ← constitution: mission, principles, hard rules, dispatch
commands/             ← per-subcommand behavior (loaded on dispatch)
references/           ← protocols: state model, learning units, caveman, teaching, formats
scripts/              ← deterministic layer (Node.js, zero deps): state + checkpoint tooling
templates/            ← state schema + checkpoint artifact template
adapters/             ← per-host installation/invocation (command-code done; others stubbed)
```

## Install (Command Code)

```bash
ln -s ~/D-drive/DevLens ~/.commandcode/skills/devlens
cmd skills list --debug          # devlens should appear, no warnings

mkdir -p ~/.commandcode/commands
cp adapters/command-code/commands/*.md ~/.commandcode/commands/
# gives /learn, /ask, /tour, /dl-review (see note below)
```

`/review` collides with a Command Code built-in, so the wrapper is `/dl-review`; `/skill:devlens review` and `/devlens review` always work.

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

- **Phase 1 (this repo):** core loop — `/learn`, `/learn continue`, `/learn review`, `/ask`, `/review`, `/tour`; Caveman protocol; learning-unit protocol; session state; Command Code adapter.
- **Phase 2–4 (PRD §11):** understanding & navigation, debugging, reinforcement commands — stubbed, not yet built.
