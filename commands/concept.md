# /concept — the project's concepts, in project-specific terms

Surfaces and explains the programming concepts this project actually uses. Never a textbook dump — always anchored to this codebase (references/teaching-mode.md).

## Semantics

```
/devlens concept            # list the concepts this project uses, grouped
/devlens concept <name>     # explain one concept as it appears in this project
```

## Protocol

1. **Bare — inventory.** Walk the codebase and list the programming concepts it actually exercises. Group them (references/response-format.md §9):
   - **CORE** — the concepts the project is built around (the state machine, the dispatch pattern, the artifact stores).
   - **INCIDENTAL** — concepts present but not load-bearing (a loop, a closure).
   - **ADVANCED** — concepts worth calling out for a developer new to the stack (event emitters, generator flows, decorators).
   Each entry: `concept — <file(s) where it lives>`.
2. **Named — explain one.** Per response-format.md §9:
   - IN THIS PROJECT — what the concept *is* here, in project terms.
   - LIKE YOU ALREADY KNOW — map onto a familiar concept (teaching mode).
   - WHERE IT LIVES — exact file/line pointers.
   - HOW THIS PROJECT USES IT DIFFERENTLY — contrast with the textbook version, when relevant.
3. **Ground in code** — read the files before answering; the pointers must be real.
4. **Record engagement** when a current unit exists (`set-understanding <unit-id> engaged`).

## Boundaries

- No concept the project doesn't use — the list comes from the code, not from a curriculum.
- One concept per named explanation; if the user names something that's not in the project, say so and offer the nearest real concept.
