# /recap — session understanding summary

Summarizes the session from the artifacts — what was built (units + checkpoints), learned (concepts), debugged (bugs), and decided (decisions). **Never from memory — always from the artifacts.**

## Semantics

```
/devlens recap           # full session summary
/devlens recap <area>    # same, scoped to an area
```

## Protocol

1. **Gather the artifacts:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" get --json     # mode, units, understanding map
   node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint.js" latest     # recent checkpoint
   node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" list --json       # bugs
   node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" list --json  # decisions
   node "${COMMANDCODE_SKILL_DIR}/scripts/quiz.js" summary          # quiz history
   ```
   For checkpoints: read the full checkpoint files (not just latest) when more than one unit exists.
2. **Output per references/response-format.md §19:**
   - BUILT — units with their checkpoint summaries.
   - LEARNED — concepts across checkpoints/quiz.
   - DEBUGGED — bugs with one-line root causes.
   - DECIDED — decisions with one-line whys.
   - UNDERSTANDING — per-unit honest status: EXPLAINED / ENGAGED / CONFIRMED (from the state's `understanding` map — never inflate; a unit with no record is EXPLAINED at most).
3. **Scoped recap:** filter the same artifacts to the area — checkpoints/bugs/decisions touching that area, quiz records for its units.

## Boundaries

- Every claim traces to an artifact. If the artifacts are empty, the recap says so — it never "remembers" earlier work.
- Understanding status is reported, never upgraded (PRD §6.4, rule 9).
