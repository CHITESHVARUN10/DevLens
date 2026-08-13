# /quiz — the CONFIRMED mechanism

Quizzes the developer on what they actually just learned, per references/quiz-protocol.md. This is the only path to the **CONFIRMED** understanding state (PRD §6.4, rule 9).

## Semantics

```
/devlens quiz              # quiz on the current unit (from state), else the session recap
/devlens quiz <area>       # quiz scoped to an area
```

## Protocol

1. **Pick the subject.** Current unit (from `state.js get`) → quiz that unit. No unit → quiz across the session's checkpoints/artifacts. Scoped form → that area's artifacts/checkpoints.
2. **Design questions per quiz-protocol:** grounded in the real code, one concept per question, mix recall/trace/explain. Read the actual files before asking.
3. **Ask one at a time** per references/response-format.md §21:
   - Q<n> with the kind tagged (recall | trace | explain).
   - Grade the answer: confirmed | partial | failed.
   - If wrong: give the correct answer + the artifact/checkpoint to re-read.
4. **Record each answer:**
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/quiz.js" record --unit <unit-id> --result confirmed|partial|failed --detail "<what was strong/weak>"
   ```
5. **After the session, report strong/weak** (response-format §21) and — **only if the unit's core concepts were demonstrated** — record confirmed:
   ```bash
   node "${COMMANDCODE_SKILL_DIR}/scripts/quiz.js" set-confirmed <unit-id>
   ```
   Never confirm a unit the developer got wrong or only partially answered.

## Boundaries

- One concept per question; questions grounded in this codebase's real behavior — never textbook trivia.
- Honest grading: partial credit is honest, not inflated. `EXPLAINED < ENGAGED < CONFIRMED` — the quiz is the only path to CONFIRMED; `/learn continue` never is.
- A single correct answer does not confirm a whole unit — only the unit's core concepts being demonstrated does.
