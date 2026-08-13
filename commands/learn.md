# /learn — Learning Mode: implement one unit, stop, explain

**Core of DevLens.** This subcommand changes execution behavior — it is a stateful mode, not a passive explanation command (PRD §6.1, rule 1).

Read `references/learning-unit.md`, `references/state-model.md`, `references/response-format.md`, and `references/caveman.md` before acting.

## Semantics

| Invocation | Behavior |
|---|---|
| `/devlens learn` | Enter Learning Mode; implement the next learning unit; stop at the checkpoint. |
| `/devlens learn continue` | Write the checkpoint for the just-completed unit, then implement the next unit and stop. |
| `/devlens learn review` | Recap the most recent learning unit from `.devlens/checkpoints/`. |
| `/devlens learn <anything-else>` | Show usage; do not act. |

## Scripts

```bash
# all from the project root (git root / cwd)
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" init --plan-summary "<summary>" --plan-source agent --units "U1|U2|U3"
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" set-mode learning
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" set-unit --name "<unit name>" --index <n>
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" complete-unit
node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" get
node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint.js" write --unit <unit-id> --name "<name>" --summary "<caveman summary>" --concepts "c1,c2" --flow "<flow>" --diff
node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint.js" latest
```

`${COMMANDCODE_SKILL_DIR}` is substituted by the harness (fall back to the repo path or `scripts/` relative to the skill). If a command fails, show its error and stop — never proceed with a broken state.

## 1. `/devlens learn` (enter Learning Mode)

1. `state.js get`. If `mode: learning` → you're already in Learning Mode; behave as `/devlens learn continue` (below) if `awaitingHuman` is false, else remind the user they must `/learn continue`.
2. If `mode: normal`:
   - Read the active plan: the harness plan-mode plan when available, else the user's request plus your own plan summary.
   - If no plan exists at all → show "No active plan — describe what to build, then run /devlens learn" and stop.
   - Split the plan into learning units (references/learning-unit.md). Record: `state.js init --plan-summary "<summary>" --plan-source <plan-mode|agent> --units "U1|U2|..."`
   - `state.js set-mode learning`
3. Implement unit 1 (index 0): `state.js set-unit --name "<unit name>" --index 0`
4. Implement the unit fully — all files, tests if the project convention has them, run whatever verification the project uses.
5. `state.js complete-unit` (marks unit done, `awaitingHuman: true`, understanding → `explained`).
6. Capture the diff and write the checkpoint artifact:
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint.js" write --unit <unit-id> --name "<unit name>" --summary "<caveman summary>" --concepts "c1,c2" --flow "<entry> -> <step> -> ..." --diff
   ```
7. **STOP.** Output the checkpoint per references/response-format.md §1 (Caveman summary + Normal flow), then the awaiting-continue notice (§2). Do **not** start the next unit. Do not run any further implementation work this turn.

## 2. `/devlens learn continue`

1. `state.js get`:
   - `mode: normal` → "Not in Learning Mode — run /devlens learn first." Stop.
   - No plan (`plan.source: none`) → "No active plan — run /devlens learn first." Stop.
   - `currentUnit.status: in-progress` → you were interrupted mid-unit. **Never fabricate a checkpoint.** Resume implementing that unit, then continue from step 5 of the flow above.
   - `currentUnit.status: done` and `awaitingHuman: true` → normal path, continue.
2. If the last checkpoint artifact was not written (e.g. a crash), write it now from the diff before moving on — but only for a unit that actually completed.
3. Determine the next unit:
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" mark-planned   # prints next unit name or PLAN-COMPLETE
   ```
4. If `PLAN-COMPLETE`:
   - `state.js complete-plan` (mode → normal, clears unit).
   - Output: "✅ PLAN COMPLETE — Learning Mode exited. Run /devlens learn review, /ask, or /tour to solidify understanding."
   - **Exit Learning Mode automatically. Do not invent further work.**
5. Else: `state.js set-unit --name "<next unit>" --index <n>`, implement it, complete-unit, write checkpoint, output checkpoint + awaiting-continue notice, **STOP** (same as `/devlens learn` steps 4–7).

## 3. `/devlens learn review`

1. `node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint.js" latest`
2. If none: "No checkpoints yet — start with /devlens learn."
3. Else recap: unit name/date, summary, flow, concepts, files. Offer to go deeper (`/ask`).

## Checkpoint output protocol (every stop)

1. What was created/modified — **diff-verified** via the checkpoint artifact (the `--diff` flag), not from memory. If the checkpoint's file list disagrees with what you think you did, trust the diff.
2. What each important file/module does (one line each).
3. The resulting flow (e.g. `Login -> AuthContext -> API -> JWT -> authenticated state`).
4. The key concepts involved.

Then the awaiting-continue notice. Understanding = `explained` — never higher, never claim the user understood (PRD §6.4, rule 9).

## Plan deviation (PRD §6.3)

If mid-implementation the plan becomes unviable (architectural conflict, missing dependency, wrong assumption):

1. **Stop immediately.** Do not adapt silently.
2. Report per references/response-format.md §3 — expected vs found vs why it matters, explicitly "PROCEEDED: NO".
3. Propose options but **do not execute** them.
4. Leave state untouched (unit stays `in-progress`; no checkpoint written).

## Interruption handling

If the user interrupts mid-unit ("stop", "change the architecture"):

- The unit stays `in-progress`; no partial checkpoint is ever written.
- `awaitingHuman` remains `true` for the current stop.
- If the user abandons the unit, clear state appropriately (`set-unit` fresh or `set-plan`), never leaving a half-done unit marked done.

## Hard rules (from SKILL.md)

- Never continue past a checkpoint without explicit `/learn continue`.
- Never treat `/learn continue` as evidence of understanding — it is a choice to proceed, nothing more.
- Units are conceptual, never per-file.
- Learning Mode exits automatically when the plan completes.
- If in doubt about state, `state.js get` and show the user — never guess.
