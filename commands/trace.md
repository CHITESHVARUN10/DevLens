# /trace — one thing's journey through the code

Follows one specific thing — a function, action, request, or event — hop by hop from trigger to outcome. Skips nothing that changes state or routes control (references/response-format.md §14).

## Semantics

```
/devlens trace <function|action|request|event>
```

## Protocol

1. **Read the code along the whole path.** Find the trigger, then follow every hop: file, function, what it does, what it passes on. Skip nothing that changes state or routes control — the trace must be complete, not convenient.
2. **Output a numbered trace per §14:**
   ```
   TRACE: <thing>
   1. <file>:<fn> — <what it does> — passes <x> to
   2. <file>:<fn> — <what it does> — passes <y> to
   ...
   BOUNDARY CROSSINGS: <hop n> crosses from <module A> to <module B>
   OUTCOME: <the terminal state/return>
   ```
3. **Call out boundary crossings** explicitly — where the thing leaves one module and enters another, and what the contract at that boundary is.
4. **If the path forks** (conditional branches, error paths), trace the main path fully and note the forks with their conditions.
5. **Record engagement** when a current unit exists (`set-understanding <unit-id> engaged`).

## Boundaries

- If the trace can't be completed from code alone (external service, dynamic dispatch), say exactly where it goes dark rather than inventing hops.
- A trace is a journey, not an explanation of why the code is good or bad.
