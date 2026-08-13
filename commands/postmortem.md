# /postmortem — narrative postmortem of one bug

The reflective counterpart to `/debug`: a full narrative of one bug — expectation, first assumption, investigation, what was wrong, root cause, fix, verification, lesson. Written in Normal depth, **never Caveman** — this is the reflective artifact, not compressed output.

## Semantics

```
/devlens postmortem                # postmortem the most recent bug
/devlens postmortem <id-or-topic>  # postmortem a specific bug
```

## Protocol

1. **Get the bug artifact:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" latest        # most recent
   node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" get <id|topic> # specific
   ```
   If none: `No bugs recorded this session.` — offer `/devlens debug` to start one.
2. **Read the artifact's full record** — the postmortem narrative is built from the recorded fields, expanded into prose per references/response-format.md §18:
   - EXPECTATION — what should have happened.
   - FIRST ASSUMPTION — the first thing blamed, and whether it was right (from `hypothesis`).
   - INVESTIGATION — the path from assumption to truth (from `investigation`).
   - WHAT WAS WRONG — the actual defect (`rootCause`).
   - ROOT CAUSE — why it produced the symptom.
   - FIX / VERIFICATION — from the record.
   - LESSON — the distilled takeaway.
3. **Record engagement** when a current unit exists (`state.js set-understanding <unit-id> engaged`).

## Boundaries

- The postmortem is a narrative, not a checklist — it reads like a story with a lesson, per PRD §7.5.
- Never inflate: if the artifact is missing a field (no hypothesis recorded), say so rather than inventing it.
- Normal depth only — Caveman compression would strip exactly what a postmortem is for.
