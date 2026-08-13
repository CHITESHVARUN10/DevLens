# Decision Log

How DevLens captures and surfaces design decisions — what gets recorded, when, and how `/decision` and `/why` use the artifacts.

## What counts as a decision

Record a decision when **a non-default choice was made that the developer would want to know the reason for**:

- Architectural choices (layering, module boundaries, state model)
- Dependency additions ("why SQLite and not Postgres")
- Pattern adoptions ("why Context API and not Redux")
- Tradeoffs accepted (XSS risk from localStorage tokens, mutable global for speed)
- Constraints honored (zero-dependency rule, session-scoped state)

**Do not record:** choices that are obvious or forced (naming conventions, "we need a file for X"), or anything whose reason is self-evident from the code alone. Noise dilutes the log.

## When to record

The agent records **during implementation**, at the moment the choice is made — not retroactively. The natural trigger points:

- Before/while writing a new module or script: did this call for a design decision? Record it.
- When accepting a tradeoff: record the tradeoff with its reasoning, so `/why` has the answer ready.
- When a plan deviates (PRD §6.3): the deviation report is a decision in the making — record the resolution once the developer decides.

Use `scripts/decision.js add` — it auto-links to the current learning unit when one is in progress.

## What a record contains

- `title` — short, human: "JSON state over SQLite"
- `what` — what was chosen, concretely
- `why` — the actual reason, in project terms
- `alternatives` — what was considered and rejected (each on one line)
- `consequences` — what this choice costs or enables
- `unit` — the learning unit it belongs to, when any

## Retrieval vs. reconstruction

- **Retrieved:** a recorded decision exists → `/decision <id>` and `/why` answer directly from the artifact. The record is authoritative.
- **Reconstructed:** no record → `/why` derives the reasoning from the code (files/lines that embody the choice) and **says what it's grounding on** — it must never present reconstruction as a recorded fact. It then offers to record it (`decision.js add`).

`/decision` (list) with no records surfaces **candidate decisions derived from the code** — non-default choices worth explaining — and offers to capture them. It does not record without the user asking.

## Artifacts policy

`.devlens/decisions/` holds one `.json` + `.md` per decision, named `<timestamp>-<dec-id>`. Same discipline as checkpoints: meaningful, inspectable, session-scoped.
