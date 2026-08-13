# /why — the reasoning behind one specific decision

Answers *why* a specific choice was made, grounded in the code and any recorded decision, with evidence (files/lines that embody the choice).

## Semantics

```
/devlens why <decision|question>    e.g. /devlens why use Redis?  /devlens why JSON state?
```

## Protocol

1. **Look up a recorded decision first:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/decision.js" get <topic>
   ```
   If found, answer from the artifact (authoritative).
2. **Reconstruct when not recorded:** read the code that embodies the choice and derive the reasoning. Per references/response-format.md §11:
   - ANSWER — the reasoning, grounded in what the code actually does.
   - EVIDENCE — file:line references that show the choice.
   - GROUNDED ON — **explicitly** `reconstructed from code`, never presented as a recorded fact.
   - End with: `Want me to record this? (decision.js add)` — recording only on the user's word.
3. **Keep it one decision.** If the question spans several ("why all this architecture?"), answer the core one and name the others.
4. **Record engagement** when a current unit exists (`set-understanding <unit-id> engaged`).

## Boundaries

- Never invent a reason that the code doesn't support — if the code doesn't show why, say so (the decision may predate the session or be lost).
- Evidence must be real: cite files you actually read.
