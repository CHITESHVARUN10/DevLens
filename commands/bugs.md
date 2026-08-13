# /bugs — bug history

Lists and details the structured bug artifacts in `.devlens/bugs/`.

## Semantics

```
/devlens bugs             # list all bugs (id, title, one-line root cause)
/devlens bugs <id|topic>  # full detail of one bug
```

## Protocol

1. **List:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" list
   ```
   Output per references/response-format.md §17. Empty state: `No bugs recorded this session.`
2. **Detail:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/bug.js" get <id|topic>
   ```
   Output: SYMPTOM / HYPOTHESIS / INVESTIGATION / ROOT CAUSE / FIX / VERIFY / LESSON / UNIT / DATE per §17.
3. **Record engagement** when a current unit exists (`state.js set-understanding <unit-id> engaged`).

## Boundaries

- This is retrieval — bugs are recorded by `/debug` (during the protocol) or by direct `bug.js add`. `/bugs` never records on its own.
- If no bugs are recorded, don't derive candidates from the code (unlike `/decision`) — the bug store records what actually happened this session.
