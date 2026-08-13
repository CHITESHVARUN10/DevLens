# /tour — high-level map of the project or an area

A quick, human-readable map of the whole project, or one area (PRD §7.4). Caveman depth by default (references/caveman.md); Normal on request.

## Semantics

```
/devlens tour              # whole-project map
/devlens tour <area>       # map of one area (feature, module, subsystem)
```

## Protocol

1. **Resolve the target.** With no argument: the whole project. With an argument: the matching area — feature, module, directory, or subsystem. If the area doesn't exist, say so and offer the project map instead.
2. **Read the actual structure first.** List the top-level layout, read the entry points, and trace the main data/control flow before writing. Never map from memory.
3. **Produce the map** (references/response-format.md §4):
   - Entry point(s) and what they do (one line each).
   - The main layers/directories and their responsibility (one line each).
   - The primary flow through the system (`entry -> layer -> layer -> output`).
   - Hot spots — files that matter disproportionately (core logic, auth, config, the thing that's hardest to find).
4. **Keep it short.** A tour is a map, not a lecture: a handful of lines at Caveman depth. Offer to zoom into an area (`/devlens tour <area>`) or go deeper.
5. **Record engagement** (`set-understanding <unit-id> engaged`) if a current unit exists — touring the project is engagement with the material.

## Example

```
> /devlens tour

PROJECT MAP: devlens
ENTRY: SKILL.md — constitution + subcommand dispatch
LAYERS:
- commands/ — per-subcommand behavior (loaded on dispatch)
- references/ — protocols (caveman, units, state, teaching)
- scripts/ — deterministic state + checkpoint tooling
- templates/ — schema + checkpoint artifact template
- adapters/ — per-harness installation/invocation
FLOW: /devlens <cmd> -> commands/<cmd>.md -> scripts/ -> .devlens/state
HOT SPOTS: scripts/state.js (state machine), references/learning-unit.md (unit rules)
```

## Boundaries

- A tour describes structure and flow — it is not an opinion on quality and not a changelog.
- If the project has no clear entry point (library with many exports), say so and map the public surface instead.
