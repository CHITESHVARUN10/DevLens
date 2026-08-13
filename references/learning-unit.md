# Learning-Unit Protocol

The definition of a *learning unit* — the atomic chunk of work DevLens implements, explains, and stops for. The agent proposes units using these rules; the automated boundary-detection algorithm is an open design question (PRD §12) and is deferred.

## Definition

A learning unit is a **coherent implementation concept whose files and changes can be understood together**. It must be large enough to demonstrate a meaningful architectural or programming concept, and small enough that the developer can reasonably inspect and understand it before continuing.

## Good vs. bad units

**Good (conceptual):**
- "Authentication foundation"
- "Payment processing flow"
- "Database persistence layer"
- "React state management"

**Bad (file checklist, too granular):**
- "Create AuthContext.jsx"
- "Create Login.jsx"
- "Create auth.js"

The first list groups files around a concept the developer can hold in their head; the second is a task list with no explanatory value.

## Boundary heuristics

When splitting a plan into units, ask:

1. **Coherent concept** — does this chunk implement one concept the developer can name and hold in mind? If you need a conjunction to describe it ("auth and billing"), split it.
2. **Inspectable size** — can the developer read the changed files in a reasonable sitting and understand the whole chunk? If a unit would take hours to review, split it.
3. **Concept demonstrated** — does the unit show a meaningful architectural or programming pattern (a data flow, a state model, an integration), not just mechanical file creation?
4. **Files understood together** — do all files in the unit participate in the same flow/feature? If a file belongs to a different flow, it belongs to a different unit.

## Proposing units

When `/learn` starts, the agent:

1. Reads the active plan (harness plan-mode plan when available, else its own plan summary).
2. Proposes a unit sequence using the rules above, recording it in state via `scripts/state.js set-plan`.
3. Implements **one unit at a time**, stopping at each checkpoint.

## When a plan has no clear units

If the plan is a single small task with no meaningful conceptual split, a single unit is fine — the goal is human understanding, not ritual splitting. If the plan is too large to hold in one unit, split it into the fewest units that each demonstrate a concept.

## After the unit

The checkpoint protocol (see `commands/learn.md`) states what was created, what each important file does, the resulting flow, and the key concepts. Understanding is then `explained` — never higher (PRD §6.4).
