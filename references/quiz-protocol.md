# Quiz Protocol

How DevLens quizzes the developer — the mechanism that reaches the **CONFIRMED** understanding state (PRD §6.4, rule 9). The quiz is never a test of trivia; it tests whether the developer can reason about *this* codebase.

## Question design

- **Grounded in the real code.** Every question must trace to actual files/lines the developer can have seen. Never textbook trivia ("what is a closure?") — always project-anchored ("where does DevLens record the diff marker?").
- **One concept per question.** A question tests one thing; ambiguity ruins grading.
- **Mix the three kinds:**
  - *Recall* — "What does `state.js mark-planned` print when the plan is done?"
  - *Trace* — "Walk `/devlens learn continue` from wrapper to checkpoint — what does it check first?"
  - *Explain* — "Why is the state kept as JSON files instead of a DB?"
- **Asked one at a time.** Short answer or multiple choice; the developer answers, you grade, then the next question.
- **Scoped.** `/devlens quiz` quizzes the current unit (else the session recap). `/devlens quiz <area>` scopes to an area — questions come from that area's artifacts/checkpoints.

## Grading

- **confirmed** — the answer is correct and shows understanding (not a lucky guess). Trace/explain answers must be structurally right, not just contain the right words.
- **partial** — some correct, some wrong or missing; the developer has gaps.
- **failed** — the answer is wrong or the developer can't engage with the concept.

Grade honestly. Partial credit is honest, not inflated.

## Strong vs. weak reporting

After the quiz session, report per area/unit:

```
QUIZ RESULT: <unit> — confirmed <n>, partial <n>, failed <n>

STRONG: <what was demonstrated>
WEAK:   <what to revisit — point at the artifact/checkpoint to re-read>
```

## The CONFIRMED transition — honesty rules

- `confirmed` is recorded **only** for units the developer demonstrated. A single correct answer on one concept does not confirm a whole unit — confirm at the unit level only when the unit's core concepts were demonstrated.
- A wrong or partial answer records `partial`/`failed` — **never** `confirmed`. Understanding is never assumed (PRD §6.4, rule 9).
- Recording is via `scripts/quiz.js record` (audit trail) and `scripts/quiz.js set-confirmed <unit-id>` (the one place the confirmed transition lives).
- `EXPLAINED < ENGAGED < CONFIRMED` — the quiz is the only path to CONFIRMED. `/learn continue` is never confirmation.
