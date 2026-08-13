# /map — how related files/modules connect

A dependency map of a feature, module, or concept: entry file → downstream modules → data structures → exit points, with each edge labeled by what flows across it (references/response-format.md §13).

## Semantics

```
/devlens map                    # map the current learning unit (from checkpoint); prompt for a target if none
/devlens map <feature|module|concept>
```

## Protocol

1. **Resolve the target.** Bare: read state + the current unit's checkpoint; map that unit. No unit: prompt for a target.
2. **Read the code first.** From the entry point, follow the imports/calls to build the real dependency graph — never from memory.
3. **Output a text diagram per §13:**
   - `entry:` — the starting file(s) and what they do.
   - Downstream modules, each edge labeled with what flows across it (a value, a control call, an event).
   - `exit:` — where the flow terminates (output, return, side effect).
   - DATA STRUCTURES — the key ones and where they live.
   - BOUNDARIES — where modules meet and the contract at each boundary.
4. **Keep it a map** — labels, not lectures. Offer to zoom (`/devlens explain <file>`, `/devlens trace <thing>`).
5. **Record engagement** when a current unit exists (`set-understanding <unit-id> engaged`).

## Boundaries

- Follow real edges only — if a connection is dynamic (reflection, plugin registry, runtime lookup), say so instead of drawing a fake arrow.
- A map describes structure; it is not an opinion on quality.
