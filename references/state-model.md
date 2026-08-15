# DevLens State Model

The authoritative schema and transition rules for `.devlens/state/current.json`. The deterministic scripts (`scripts/state.js`, `scripts/checkpoint.js`) enforce these rules; this file documents them for the agent. **Never hand-edit the state file** — always go through the scripts so validation runs.

## Where state lives

- **Project root:** the git root when the working directory is inside a repo, else the working directory. Never an unrelated parent — the resolved root is recorded in `state.root` for diagnostics.
- **File:** `.devlens/state/current.json` inside the project root.
- **Lifetime:** scoped to the current development session (PRD §6.6). DevLens is not a long-term memory system. If the harness supports session resume, state continues naturally; DevLens never accumulates history across sessions on its own.

## Schema (v1)

```json
{
  "version": 1,
  "root": "/absolute/path/to/project",
  "mode": "normal" | "learning",
  "plan": {
    "source": "plan-mode" | "agent" | "none",
    "path": "/absolute/path/to/plan-file.md",   // present when source is plan-mode
    "summary": "human-readable plan summary",
    "units": ["unit name 1", "unit name 2", "..."]
  },
  "currentUnit": null | {
    "id": "unit-<short-id>",
    "index": 0,
    "name": "unit name",
    "status": "in-progress" | "done"
  },
  "awaitingHuman": true | false,
  "understanding": {
    "<unit-id>": "explained" | "engaged" | "confirmed"
  },
  "updatedAt": "ISO-8601"
}
```

`templates/state.schema.json` is the machine-readable version; `scripts/state.js` validates against it on every read and write and refuses invalid states.

## Field meanings

| Field | Meaning |
|---|---|
| `root` | Resolved project root where `.devlens` lives (diagnostics). |
| `mode` | `normal` (default) or `learning`. `learning` means the agent is executing under the Learning Mode protocol. |
| `plan.source` | Where the plan came from: the harness plan-mode plan (`plan-mode`), the agent's own recorded plan (`agent`), or none. |
| `plan.path` | Absolute path of the source plan file (present when `source: plan-mode`); resolved by `scripts/plan.js locate`. |
| `plan.units` | Ordered list of learning-unit names — conceptual units, never file checklists (see `references/learning-unit.md`). |
| `currentUnit` | The unit currently in progress (`in-progress`) or just completed (`done`). `null` when no unit is active. |
| `awaitingHuman` | `true` when the agent has stopped at a checkpoint and must not continue until explicit `/learn continue`. |
| `understanding` | Per-unit understanding level: `explained` → `engaged` → `confirmed` (PRD §6.4). Never conflated, never inferred from `/learn continue`. |

## Legal transitions

| From | To | Via (script) | Rule |
|---|---|---|---|
| `normal` | `learning` | `set-mode learning` | Start Learning Mode. |
| `learning` | `normal` | `set-mode normal` | **Refused** while a unit is `in-progress`. Allowed after the current unit is `done`. |
| any | — | `set-plan` | Replace the plan; resets `currentUnit` to null. |
| — | unit `in-progress` | `set-unit` | Start a unit; sets `awaitingHuman` false. |
| `in-progress` | `done` | `complete-unit` | Only a unit `in-progress` can complete. Sets `awaitingHuman` true and records `explained` for the unit (if not already set). |
| — | — | `set-awaiting true\|false` | Toggle the awaiting flag (used at plan start/end and on interruption). |
| — | — | `set-understanding <unit> <level>` | Set/upgrade the understanding level for a unit. |
| `learning` | `normal` | `complete-plan` | **Refused** while a unit is `in-progress`. Only valid after the last unit is `done` (or plan aborted). Clears `currentUnit`, sets `awaitingHuman` false. |

`mode`/`currentUnit`/`awaitingHuman` never get out of sync with these rules: an in-progress unit always implies `mode: learning`, and `awaitingHuman: true` only ever accompanies a `done` unit (or the start/end of a plan).

## Interruption handling

When the user interrupts mid-unit (e.g. "stop", "actually, change the architecture"):

1. The unit stays `in-progress` (or is abandoned — see below). **No partial checkpoint is written.**
2. `awaitingHuman` stays `true`; the agent does not silently continue.
3. State is never corrupted: if the unit is abandoned, clear it with `set-unit` for a fresh start, or `set-plan` to replace the plan entirely.

Abandoning a unit mid-way is allowed — DevLens never blocks the human, it only makes the stop explicit.

## Artifacts policy

`.devlens/` stores meaningful structured artifacts only:

- `state/current.json` — the session state above
- `state/last-checkpoint.json` — the diff marker for the previous checkpoint (internal)
- `checkpoints/*.json` — **one artifact per completed learning unit** (no `.md`; the exact diff lives in git, the JSON carries the diff-verified file list + diff stat). Manual (user-triggered) checkpoints carry `"kind": "manual"` and are stored in the same directory with a `manual-<id>` id
- `bugs/*.json` + `*.md` — one artifact per debugged bug (PRD §9.3)
- `decisions/*.json` + `*.md` — one artifact per recorded design decision
- `quiz/<date>.jsonl` — the quiz audit trail (low ceremony, append-only)

**Never** store chat transcripts, raw diffs beyond the checkpoint summary, or arbitrary conversation content. `.devlens/` should stay small and inspectable.
