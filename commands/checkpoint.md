# /checkpoint — manual understanding save

Saves the developer's current understanding of an important feature/concept/state as a deliberate user-triggered artifact. Distinct from the automatic `/learn` checkpoint (PRD §7.6).

## Semantics

```
/devlens checkpoint <name>     # save current understanding under this name
/devlens checkpoint <name> --notes "<notes>"   # with explicit notes
/devlens checkpoint <name> --area "<area>"     # tag an area
```

## Protocol

1. **Save the manual artifact:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/checkpoint-extra.js" save --name "<name>" --notes "<notes>" [--area "<area>"]
   ```
   Creates one artifact: `.devlens/checkpoints/<ts>-manual-<id>.json` with `"kind": "manual"`.
2. **If no `--notes` given:** ask the developer what they want to save, or synthesize notes from the current conversation context (what was just explained) and say so.
3. **Output per references/response-format.md §20** — MANUAL CHECKPOINT: name, notes, area, date.
4. **Record engagement** when a current unit exists (`state.js set-understanding <unit-id> engaged`).

## Boundaries

- **Never touches the diff marker** — `checkpoint-extra.js save` deliberately does not update `state/last-checkpoint.json`; that belongs to the learning loop only. A manual checkpoint is a note, not a learning-unit boundary.
- Never conflate with auto checkpoints: manual ones carry `"kind": "manual"` and are listed separately by `list-manual`.
- Manual checkpoints are user-triggered — do not create them proactively during implementation.
