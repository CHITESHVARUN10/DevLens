# /explain — deeper, structured explanation

A structured explanation of overall architecture, an area, a file, a function, or a flow. Depth tiers per references/caveman.md: Normal by default, `--deep` (or "go deep") for alternatives, tradeoffs, edge cases, architectural reasoning.

## Semantics

```
/devlens explain                    # explain the current learning unit (from state + checkpoint)
/devlens explain <target>           # target: overall | architecture | <feature area> | <file> | <function> | <flow>
/devlens explain <target> --deep    # full depth: alternatives, tradeoffs, edge cases
```

## Protocol

1. **Resolve the target.**
   - No target: read state + the current unit's checkpoint; explain that unit.
   - `overall` / `architecture`: the project's shape — entry points, layers, main flow (reuse the tour map as raw material, then go deeper than a map).
   - `<feature area>`: a feature/module/subsystem — its files, responsibilities, and how they cooperate.
   - `<file>`: that file's role, its key functions, and how it fits the surrounding code.
   - `<function>`: what it does, how, why, and what calls it / it calls.
   - `<flow>`: the journey of a named flow through the system.
2. **Ground in code.** Read the actual files before explaining — never explain from memory of what the agent did.
3. **Structure per references/response-format.md §8** — WHAT IT IS → HOW IT WORKS → WHY IT'S SHAPED THIS WAY → WHAT TO READ NEXT. Use project-specific terms (references/teaching-mode.md).
4. **Depth:** Normal by default. `--deep` adds ALTERNATIVES / TRADEOFFS / EDGE CASES after WHY.
5. **Record engagement** when a current unit exists:
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" set-understanding <unit-id> engaged
   ```

## Boundaries

- Explain, don't judge — no quality verdicts.
- If the target doesn't exist (unknown file/area), say so and offer the closest real target.
- A deep explanation is fuller, never longer-winded — keep every sentence meaningful (caveman rule).
