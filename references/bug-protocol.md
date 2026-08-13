# Bug Protocol

How DevLens turns a bug into a structured learning artifact. A bug is a **learning artifact first** — the explanation of why it happened is as important as the fix (PRD §7.5).

## The six stages

Every `/debug` run walks through these explicitly. Each stage is narrated before moving on — the developer must see the reasoning, not just the result.

1. **Symptom** — what the user is actually seeing/hitting. Written in their terms, quoted if possible. If the symptom is vague, ask rather than guess.
2. **Hypothesis** — one or more candidate causes, stated before investigating. The hypothesis is a guess and is labeled as such; it may be wrong and that's fine.
3. **Investigation** — the evidence gathering: read the relevant code, reproduce the bug, run tests, inspect logs. Each step names what it tests and what it rules in/out. Never jump from hypothesis to fix.
4. **Root cause** — the actual defect, stated precisely (file + mechanism). If the investigation doesn't produce a confident root cause, say so and stop rather than guess.
5. **Fix** — the change that addresses the root cause (not the symptom). Small and targeted.
6. **Verification** — the evidence the fix works: the reproduction now passes, tests green, the symptom is gone. A fix without verification is not done.

## What "done" means at each stage

| Stage | Done when |
|---|---|
| Symptom | You can state what the user sees in one line, in their terms |
| Hypothesis | It's a testable statement, not a vibe ("X causes Y because Z") |
| Investigation | Evidence rules hypotheses in/out; you can name what you looked at |
| Root cause | You can point at the file/mechanism and explain *why* it produces the symptom |
| Fix | The change is minimal and aimed at the root cause, not the symptom |
| Verification | The reproduction is run again and passes; tests green |

## When to stop and ask the human

- The symptom is ambiguous — ask instead of guessing a target.
- The bug touches code outside the current session's context (unfamiliar area, no checkpoint) — say so and ask if they want you to investigate anyway.
- Investigation stalls (no reproduction, dead end) — report where it went dark and propose next steps, don't fake progress.
- The fix would be risky or large (rewrite, behavior change beyond the bug) — present options, don't execute.

## Recording

When root cause + fix are confirmed, record via:

```bash
node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" add --title "<t>" --symptom "<s>" --root-cause "<r>" --fix "<f>" --verification "<v>" [--hypothesis "<h>"] [--investigation "<i>"] [--lesson "<l>"]
```

The script auto-links the current in-progress learning unit. A bug that stays unresolved is **not** recorded as an artifact (the investigation narrative can still be summarized in the response).

## Bugs and learning units

- A bug linked to a unit is material for that unit's understanding: `lesson` is the distilled takeaway ("the `dl-` prefix collision was why the wrapper didn't route").
- `/postmortem` is the reflective narrative; `/debug` is the working protocol. Both read the same artifacts.
- Bugs do not change the learning loop's state machine — they're parallel artifacts in `.devlens/bugs/`.
