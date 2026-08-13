# /decision — surface the decisions and why

Retrieves and explains recorded design decisions. Recording happens during implementation (`scripts/decision.js add`); this command is retrieval + explanation.

## Semantics

```
/devlens decision              # list all recorded decisions (id, title, one-line why)
/devlens decision <id-or-topic>  # detail one decision
```

## Protocol

1. **List:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" list
   ```
   Output per references/response-format.md §10. Empty state: "No decisions recorded yet." Then **derive candidate decisions from the actual code** — non-default choices worth explaining (an unusual state layout, a rejected-looking alternative made visible by the code, a dependency choice) — list them as candidates and offer to record them. Do not record without the user asking.
2. **Detail:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" get <id-or-topic>
   ```
   Output: WHAT / WHY / ALT / CONSEQ / UNIT / DATE per §10.
3. **If the user asks to capture a decision** (or confirms a candidate), record it:
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" add --title "<t>" --what "<chosen>" --why "<reason>" [--alternatives "a1,a2" --consequences "<text>"]
   ```
   The script auto-links the current in-progress unit.
4. **Record engagement** when a current unit exists (`set-understanding <unit-id> engaged`).

## Boundaries

- Retrieval vs. reconstruction: a recorded decision is authoritative; a code-derived candidate is explicitly a candidate, never presented as a recorded fact (references/decision-log.md).
- The command records nothing on its own — only on explicit user request.
