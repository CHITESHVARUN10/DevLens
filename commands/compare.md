# /compare — chosen approach vs. a named alternative

Explains a decision by contrasting the chosen approach with a named alternative: the tradeoff actually made, when the alternative would win, and what would break if they switched. Evidence-based, never generic (references/response-format.md §12).

## Semantics

```
/devlens compare X vs Y        e.g. /devlens compare JSON state vs SQLite
```

## Protocol

1. **Resolve the pair.** Parse `X vs Y`. If the user names one thing ("why JSON?"), treat the code's choice as X and find the natural alternative from context — or ask which alternative they mean.
2. **Ground in code + recorded decisions.** Read where the choice lives; check `decision.js get X` / `get Y` for a recorded rationale.
3. **Output per §12:**
   - CHOSEN — what the code actually does, with evidence file:line.
   - ALTERNATIVE — how the alternative would differ concretely.
   - TRADEOFF — what was actually given up and gained (from code/decisions — never generic pros/cons lists).
   - ALTERNATIVE WINS WHEN — the conditions under which switching would make sense.
   - IF YOU SWITCHED — what would break or move in *this* codebase (which files, which behaviors).
4. **Record engagement** when a current unit exists (`set-understanding <unit-id> engaged`).

## Boundaries

- No generic "X is faster, Y is simpler" — every point must trace to this project's code.
- If the alternative is hypothetical (never considered), say so plainly and reason from the code's constraints.
