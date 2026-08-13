# /ask — context-grounded question about the current unit / codebase

The universal, context-aware question mechanism (PRD §7.2). `/ask <question>` answers using the **current learning context first**, then the broader codebase — never generic chat (PRD §6.3 rule 5).

## Semantics

```
/devlens ask <question>          # answer grounded in current unit + code
```

With no question, prompt the user for one (do not invent a question).

## Answering protocol

1. **Read the current context first.** `state.js get` to find the current unit; if a checkpoint exists for it, `checkpoint.js latest` (or read the matching `.json` in `.devlens/checkpoints/`). Ground the answer in that unit's files, flow, and concepts.
2. **Ground in code.** Read the actual relevant files in the project before answering — never answer from memory of what the agent did. If the question is about a specific file, read it.
3. **Answer directly**, in project-specific terms (references/teaching-mode.md). Normal depth by default.
4. **Escalate to teaching mode** when the question reveals an unfamiliar concept (references/teaching-mode.md) — map the concept onto what the developer already knows, show it in this project.
5. **Record engagement.** A real question-and-answer interaction counts as `engaged` for the current unit:
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/state.js" set-understanding <unit-id> engaged
   ```
   Only if there is a current unit. `engaged` is a positive signal, not proof of understanding (PRD §6.4).

## Boundaries

- Never fabricate: if you don't know, say so and read the code to find out.
- Never claim understanding you can't verify — answering a question is `engaged`, not `confirmed`.
- Keep answers proportionate: short answer first, deeper on request.
- If the question is about the plan/decisions beyond the current unit, answer from the code and the recorded plan in state, and say what you're grounding on.

## Example

```
> /devlens ask why does Login call authApi.login twice?

(reads src/Login.jsx, src/auth/authApi.js, current checkpoint)

In Login.jsx the double call is the StrictMode double-invoke of the effect in dev —
the second call is the cleanup+re-run. In production it fires once. The checkpoint
notes the token persists via AuthContext; the duplicate is React StrictMode, not a bug.
```
