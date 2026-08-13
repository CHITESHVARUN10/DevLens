# /review — guided, educational walkthrough of how to inspect the code

**Never an AI code-quality verdict** (PRD §6.3 rule 6, §7.4). `/review` teaches the developer to inspect the implementation themselves: what to open, what to look for, what questions to ask. The agent is a guide, not a reviewer.

## Semantics

```
/devlens review            # guided walkthrough of the current learning unit
/devlens review <area>     # guided walkthrough of an area (feature, module, file)
```

## Protocol

1. **Resolve the target.** With no argument: the current learning unit (from state + latest checkpoint). With an argument: the matching area of the codebase (feature/module/file). If neither resolves, ask what they want to review.
2. **Build the walkthrough as a path for the developer's eyes**, not a summary of the agent's opinion:
   - Where to start reading (entry point of the unit/area).
   - A sequence of inspection steps, each with: what to open, what to look for, and a question to ask yourself (references/response-format.md §5).
   - The key flow to trace by hand.
   - What "looks right" vs. what should raise suspicion — in terms the developer can verify themselves.
3. **Never output:**
   - A verdict ("this code is good/bad").
   - A lint-style list of issues.
   - A corrected version of their code (unless explicitly asked as a separate step).
4. **End with check-yourself questions** that expose gaps ("If you can't trace X, that's the gap — /ask or /why"). The point is the developer's understanding, not the agent's approval.
5. **Record engagement** (`set-understanding <unit-id> engaged`) when a meaningful review interaction happened.

## Shape (references/response-format.md §5)

```
REVIEW GUIDE: <unit or area>
START HERE: <file> — open it and look for <what>
1. <step> — <what to look for>
2. <step> — <what to look for>
3. <step> — <what to look for>
CHECK YOURSELF: <question 1> / <question 2>
```

## Boundaries

- If the code has a real bug, the review walkthrough can surface it as a step ("trace the token expiry path — does it match the 15-minute claim?") — but diagnosing it is `/debug`'s job, and Phase 1 doesn't ship `/debug`. Say so and point to where the bug lives; do not turn the guide into an audit.
- Never fabricate inspection steps for files that don't exist — read the code first.
