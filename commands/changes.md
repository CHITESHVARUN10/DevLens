# /changes — human-readable summary of what changed

Summarizes the diff since the last checkpoint (or `HEAD` when no marker) — what changed, why it matters, what's new vs. moved vs. deleted. **Never a raw diff dump** (references/response-format.md §15).

## Semantics

```
/devlens changes              # changes since the last checkpoint marker (or HEAD)
/devlens changes <n>          # change history across the last n checkpoints
```

## Protocol

1. **Extract deterministically:**
   ```bash
   # changes since the last checkpoint marker (or HEAD when no marker)
   node "${COMMANDCODE_SKILL_DIR}/scripts/changes.js" since-last --json
   # or against an arbitrary ref
   node "${COMMANDCODE_SKILL_DIR}/scripts/changes.js" since <ref> --json
   # last n checkpoints with their file lists
   node "${COMMANDCODE_SKILL_DIR}/scripts/changes.js" history <n> --json
   ```
2. **Read the actual diff** for the files the extraction lists — the narrative must reflect the real content, not just the file names.
3. **Output per §15:** NEW / MOVED / DELETED / MODIFIED, each entry with *why it matters*, plus RISK SPOTS — anything in the diff that deserves a careful look (unexpected deletions, large rewrites, config changes).
4. **`/devlens changes <n>`:** one block per checkpoint (per §15), from oldest to newest.
5. **Record engagement** when a current unit exists (`set-understanding <unit-id> engaged`).

## Boundaries

- Summarize, never dump: no raw `git diff` output in the response.
- In a non-git project: `changes.js since-last` reports `not a git repo` — say that plainly and offer `/devlens checkpoint` (Phase 3) as the alternative.
- Files inside `.devlens/` are runtime state, never part of the change summary.
