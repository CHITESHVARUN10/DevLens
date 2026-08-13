# Caveman Mode (Compression Layer)

A compact communication style for DevLens's own outputs — checkpoints, flows, bug reports, tour maps — to control the token overhead DevLens inherently introduces (PRD §6.5).

## The one hard rule

**Compress language, never meaning.** Caveman Mode strips grammar, filler, and repeated context. It must **never** strip:

- technical meaning
- caveats
- decisions and their reasons
- risks
- relevant implementation detail
- anything that would mislead the developer if left out

A compressed statement is never an excuse to be vague about a tradeoff or a limitation.

## Response depths

DevLens supports three depths:

| Depth | Use | Default for |
|---|---|---|
| **Caveman** | Short, structured, highly compressed. Fragments over sentences; headers and bullets; no filler. | Checkpoint summaries, tour maps, plan-deviation reports |
| **Normal** | Standard developer-level explanation. Full sentences, proper structure. | Flow/concept explanations at checkpoints, `/ask` answers |
| **Deep** | Full detail: alternatives, tradeoffs, edge cases, architectural reasoning. | Explicit request only (`/devlens explain --deep`, or "go deeper") |

## Caveman style guide

- Drop articles and filler ("the", "a", "this means that").
- Use headers and bullet lists to structure information.
- Keep identifiers, file paths, and technical terms exact — never abbreviate code.
- Keep caveats and risks visible: prefix with `⚠` or `note:` when important.
- One line per fact. No prose paragraphs unless depth is Normal+.

### Example: caveman vs normal

**Caveman:**
```
CHECKPOINT: Auth foundation
FILES: src/auth/AuthContext.jsx, src/auth/authApi.js
FLOW: Login form -> authApi.login -> POST /auth -> JWT -> AuthContext -> persisted
CONCEPTS: JWT, context providers, async state
NOTE: tokens in localStorage — XSS risk accepted for phase 1
```

**Normal:**
```
Unit 1: Authentication foundation is complete. The login form calls authApi.login(),
which POSTs to /auth and receives a JWT. AuthContext stores the token and exposes
login/logout to the component tree via a provider. Tokens are persisted in
localStorage — an XSS risk we're accepting for phase 1 in favor of simplicity.
```

Both carry the same technical content; Caveman just carries less language.

## Never compress

- Error conditions and failure modes
- Security-sensitive choices and their rationale
- Anything the developer must know to review the work
- Deviations from the plan (always full Normal depth — PRD §6.3)

## Choosing the depth

- Checkpoint **summary blocks** and **tour maps**: Caveman by default.
- Flow/concept explanations at a checkpoint: Normal by default.
- Plan-deviation reports: Normal (never Caveman — the situation deserves full clarity).
- Deep only when explicitly requested.
- When in doubt, add the detail; a checkpoint that omits a caveat is a broken checkpoint.
