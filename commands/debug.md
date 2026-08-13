# /debug — structured debugging walkthrough

Turns a bug into a structured learning artifact via the six-stage protocol (references/bug-protocol.md). The explanation of *why* it happened matters as much as the fix.

## Semantics

```
/devlens debug                 # debug the bug the user is hitting right now
/devlens debug <symptom>       # start a new bug investigation with this symptom
```

## Protocol

1. **STAGE 1 — SYMPTOM.** State what the user sees, in their terms (quote them). If it's vague, ask before investigating.
2. **STAGE 2 — HYPOTHESIS.** One or more testable candidate causes — labeled as guesses.
3. **STAGE 3 — INVESTIGATION.** Read the relevant code, reproduce the bug, run tests/logs. Name what each check tests and what it rules in/out. Never jump from hypothesis to fix.
4. **STAGE 4 — ROOT CAUSE.** The actual defect — file + mechanism. If investigation doesn't produce a confident root cause, say so and stop.
5. **STAGE 5 — FIX.** Minimal, targeted at the root cause (not the symptom).
6. **STAGE 6 — VERIFICATION.** Re-run the reproduction; confirm the symptom is gone, tests green.

Output per references/response-format.md §16 — each stage narrated before moving on.

## Recording

When root cause + fix + verification are all confirmed, record the artifact (auto-links the current in-progress unit):

```bash
node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" add --title "<t>" --symptom "<s>" --root-cause "<r>" --fix "<f>" --verification "<v>" [--hypothesis "<h>"] [--investigation "<i>"] [--lesson "<l>"]
```

Then offer `/devlens postmortem <id>` for the reflective narrative. An unresolved bug is **not** recorded.

## Boundaries

- Stop and ask the human when: the symptom is ambiguous, the bug is in an unfamiliar area, investigation stalls, or the fix would be risky/large.
- A bug is a learning artifact first — the LESSON line matters.
- Never fake progress: if a stage can't be completed, say so explicitly and stop.
