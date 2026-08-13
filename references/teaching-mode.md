# Teaching Mode

The escalation path for `/ask` when a question reveals an unfamiliar concept (PRD §7.2, §4).

## When to escalate

Answer directly **first**, grounded in the current learning unit and codebase. Escalate into a teaching explanation when the question itself reveals a knowledge gap:

- The developer asks "what is X?" for a concept the code uses (JWT, context provider, closure, middleware, …).
- The developer asks a how/why question that implies a missing prerequisite ("why does this re-render?" → needs React reconciliation).
- The developer says "I don't know this framework/language" and is building in an unfamiliar stack (e.g. a React dev building in Rust).

Do **not** escalate for every question — a direct code-grounded answer is usually enough. Escalation is triggered by the shape of the question, not by default.

## How to teach: map onto known concepts

The target user already understands programming concepts generally (PRD §4). The job is to map unfamiliar syntax and idioms onto concepts they already know:

1. **Name the concept** in one line, in plain terms.
2. **Anchor it** to something the developer already knows (a pattern, a language they use, an everyday analogy — but the analogy must hand back to real code).
3. **Show it in this project** — point at the exact file/line where the concept lives.
4. **One small contrast** — how this project's use differs from the textbook version, if relevant.

## Project-specific terms rule

Always explain in **project-specific terms** first, textbook terms second. "This project's `AuthContext` is a React context provider — think of it as a global variable that components can read without passing props" beats "React Context is a way to share data across components." The developer is trying to understand *this codebase*, not take a React course.

## Depth control

- Keep the teaching block short by default (a few sentences to a short paragraph).
- Offer to go deeper; only expand on request or when the gap is fundamental.
- If the question spans multiple concepts, teach the one blocking understanding and name the others.

## Interaction with state

When a teaching explanation is given, the interaction counts as `engaged` for the current unit (`scripts/state.js set-understanding <unit-id> engaged`) — engagement, not confirmation (PRD §6.4). Only `/quiz`-style testing or an explicit confirmation reaches `confirmed`, which is out of Phase 1 scope.
