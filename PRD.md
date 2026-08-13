# DevLens — Product Requirements Document

**Tagline:** See what your AI builds. Understand why it works.
**Philosophy:** AI builds. Human understands.

---

## 1. Summary

DevLens is a skill for AI coding agents (Claude Code, Codex, Gemini CLI, OpenCode, and similar agentic coding harnesses) that intentionally inserts human understanding checkpoints into agentic software development. It allows the AI to continue doing the heavy implementation work, while ensuring the developer periodically stops, understands what was built, why it was built, how it works, how it was debugged, and how to review it themselves.

DevLens is best described as a **developer understanding and involvement layer**, not primarily an educational product. "Learning" is a useful internal concept (the system chunks work into "Learning Units" and has a "Learning Mode"), but the target user isn't necessarily learning a new skill — they might already know the language or framework and simply want to understand why the agent made the choices it made. This framing matters because it keeps DevLens relevant to experienced developers, not just students.

DevLens is **not** a code-quality reviewer, a token-efficiency tool, or a replacement for the coding agent.

---

## 2. Problem Statement

AI coding agents can now plan, write, run, test, and debug large amounts of code with minimal human input. This is powerful, but it creates a new failure mode, particularly for students and developers who are still learning:

> The human can become disconnected from the code being written.

A developer can ship a working, even impressive, project while not actually knowing what files exist and why, how data flows through the system, why a given architecture or dependency was chosen, where core logic like authentication lives, or why and how a bug occurred and was fixed.

This becomes acutely visible in situations like technical interviews, where a developer is asked to explain a system they nominally built but don't actually understand.

The traditional development loop (human thinks → designs → codes → hits an error → debugs → understands) is increasingly being replaced by a loop where the human just describes requirements and approves AI actions, without ever internalizing the "why." DevLens exists to reintroduce the missing understanding step without removing the speed benefits of AI-assisted development.

---

## 3. Vision & Core Principle

**North star:** AI builds. Human understands.

Every feature in DevLens should be evaluated against one question: does this help the developer understand, inspect, question, reason about, remember, or learn from what the AI is doing? If not, it doesn't belong in the core system.

DevLens is explicitly **not** optimizing for minimum token usage or maximum coding speed. It is optimizing, in priority order, for:

1. Developer understanding
2. Developer involvement
3. Useful learning
4. Reasonable token usage (via Caveman Mode, not by cutting scope)

---

## 4. Target Users

**Primary:** Students and developers who are learning while using AI coding agents — including developers using AI to build in languages or stacks they don't yet know (e.g., a React/JavaScript developer building a project in Rust with an agent's help). These users already understand programming concepts generally and need DevLens to map unfamiliar syntax and idioms onto concepts they already know, while staying engaged with what's being built rather than passively approving actions.

**Secondary:** Experienced developers who already know the stack but still want to stay engineering-literate about a codebase an agent is building on their behalf — understanding *why* the agent structured things a certain way, not learning the underlying technology itself. This is part of why DevLens is framed as an "understanding and involvement layer" rather than purely an educational tool.

---

## 5. Goals & Non-Goals

### Goals
- Keep the developer cognitively connected to AI-generated code throughout a build.
- Turn AI plan execution into a sequence of understandable, human-paced "learning units."
- Make engineering decisions, tradeoffs, and debugging reasoning visible instead of letting them disappear into the agent's internal process.
- Give the developer tools to question, review, and navigate what was built, in project-specific terms.
- Turn bugs into structured learning material (symptom → hypothesis → investigation → root cause → fix → verification).
- Work across multiple agentic coding harnesses via a common core plus host adapters.
- Distinguish between the agent *explaining* something and the human *actually understanding* it, rather than conflating the two.

### Non-Goals
- DevLens is not an AI code-quality reviewer or linter.
- DevLens is not trying to minimize token usage as a primary objective (Caveman Mode manages this as a secondary concern).
- DevLens is not a long-term, cross-session personal memory/learning-history system.
- DevLens does not aim to slow down or block AI coding capability — friction is intentional but bounded to comprehension checkpoints, not obstruction.

---

## 6. Core Concepts

### 6.1 Learning Mode: A Stateful Execution Mode

`/learn` is not just a command that produces an explanation — it switches the coding agent into a distinct, stateful execution mode that persists until the plan is complete or the user exits it.

```
NORMAL MODE
    │
    │  /learn
    ▼
LEARNING MODE
    │
    ▼
  Unit 1
    │
    ▼
AWAITING CONTINUE
    │
    │  /learn continue
    ▼
  Unit 2
    │
    ▼
AWAITING CONTINUE
    │
    ▼
   ...
    │
    ▼
PLAN COMPLETE
    │
    ▼
NORMAL MODE
```

Once the active plan is complete, DevLens automatically exits Learning Mode and returns control to the host agent's normal execution behavior. Learning Mode does not remain active indefinitely by default — it is scoped to the plan it was invoked against.

This is also *why* `.devlens/state/current.json` exists — it isn't a store of arbitrary information, it exists specifically to track: which mode the session is in (Normal vs. Learning), which plan is active, which learning unit is currently in progress, and whether the system is currently waiting on the human (`AWAITING CONTINUE`).

**What counts as a learning unit:** A learning unit should represent a coherent implementation concept whose files and changes can be understood together. A unit should be large enough to demonstrate a meaningful architectural or programming concept, but small enough that a developer can reasonably inspect and understand it before continuing.

- **Good learning units** (conceptual): "Authentication foundation," "Payment processing flow," "Database persistence layer," "React state management."
- **Bad learning units** (file checklist, too granular): "Create AuthContext.jsx," "Create Login.jsx," "Create auth.js."

The first list groups files around a concept the developer can hold in their head; the second is just a task list with no explanatory value on its own. This distinction is central to DevLens, even though the exact automated boundary-detection algorithm is still an open design question (see §12).

### 6.2 The Checkpoint Loop

After a learning unit is implemented, the agent:
1. States what was created/modified.
2. Explains what each important file/module does.
3. Explains the resulting flow (e.g., Login → AuthContext → API → JWT → authenticated state).
4. Surfaces the key concepts involved.

The user can then use `/ask`, `/why`, `/review`, or `/explain` to interrogate the current learning unit. The agent does **not** resume implementation on its own — only an explicit `/learn continue` moves the plan forward. This friction is intentional and treated as a feature, not a bug.

### 6.3 Plan Deviation Handling

If the agent discovers mid-implementation that the original plan is no longer viable (e.g., an architectural conflict), it must stop and report the situation — what was expected, what was found, why it matters, and that it has not proceeded — rather than silently changing approach. This mirrors real engineering practice (plan → investigate → discover → adapt) and is itself a teaching moment.

### 6.4 Measuring Understanding: Explained vs. Engaged vs. Confirmed

This is a core principle, not just an implementation detail: **DevLens creates an opportunity for the human to understand the code — it does not itself guarantee that understanding occurred.** The agent must never silently assume:

```
I explained it → therefore the user understands it
```

DevLens should internally distinguish at least three distinct states, and never conflate them:

- **EXPLAINED** — the agent produced an explanation for a learning unit or concept. This is the weakest state; it says nothing about the human's comprehension.
- **ENGAGED** — the user actively interacted with the material (e.g., asked a question via `/ask`, requested `/why`, or ran `/review`). Engagement is a positive signal, but still not proof of understanding.
- **CONFIRMED** — the user's understanding has been actively tested and demonstrated, e.g., via `/quiz`, an explicit confirmation, or another deliberate learning signal.

Critically, the user typing `/learn continue` only means **the user is choosing to proceed** — it must never be interpreted or reported by DevLens as evidence that the user understood the preceding unit. DevLens must never claim something like "user understands authentication" unless a CONFIRMED-level signal actually occurred.

### 6.5 Caveman Mode (Compression Layer)

A compact communication style used for DevLens's own outputs (checkpoints, flows, bug reports) to control the extra token overhead DevLens inherently introduces. Caveman Mode strips grammar, filler, and repeated context — it must never strip technical meaning, caveats, decisions, risks, or relevant implementation detail. DevLens is expected to support multiple response depths:
- **Caveman** — short, structured, highly compressed (likely default for frequent checkpoints).
- **Normal** — standard developer-level explanation.
- **Deep** — full detail including alternatives, tradeoffs, edge cases, and architectural reasoning (requested explicitly).

### 6.6 Session Model

DevLens state is scoped to the current development session, not a persistent personal-memory system across sessions. If the underlying harness supports session resume, DevLens continues naturally within that; DevLens itself is not responsible for long-term memory of what a user has learned over time.

---

## 7. Feature Set (Command Reference)

Commands are grouped into six functional areas. `/ask` functions as the universal, context-aware question mechanism underlying most of them rather than requiring many narrow single-purpose commands.

This is already an 18-command/subcommand candidate set. **It should not be expanded further before Phase 1 is prototyped** — the priority right now is nailing command *semantics*, not adding command *quantity*. The protected core, which should never be cut, is: `/learn`, `/learn continue`, `/learn review`, `/ask`, `/review`, `/tour`, `/debug`. Everything else is secondary and can be sequenced in later.

### 7.1 Learning Execution
| Command | Purpose |
|---|---|
| `/learn` | Enter Learning Mode; implement the next learning unit, then stop. |
| `/learn continue` | Resume implementation and produce the next learning unit. |
| `/learn review` | Recap what the most recent learning unit actually implemented. |

### 7.2 Understanding
| Command | Purpose |
|---|---|
| `/ask` | Ask a contextual question about the current learning unit/codebase; can escalate into a teaching-mode explanation for unfamiliar concepts. |
| `/explain` | Deeper, structured explanation (`overall`, `architecture`, a feature area, a file, a function, or a flow). |
| `/concept` | List or explain the programming concepts involved in the project or a specific concept in project-specific terms. |

### 7.3 Engineering Understanding
| Command | Purpose |
|---|---|
| `/decision` | Surface the important decisions the agent made during the build and why. |
| `/why` | Explain the reasoning behind a specific engineering decision (e.g., `/why use Redis?`). |
| `/compare` | Compare the chosen approach against a viable alternative and explain the tradeoff (e.g., `/compare Context vs Redux`). |

### 7.4 Human Code Navigation / Review
| Command | Purpose |
|---|---|
| `/review` | Guided, educational walkthrough of how the developer should personally inspect the implementation (not an AI-generated code review). |
| `/tour` | High-level map of the whole project, or a specific area (e.g., `/tour auth`). |
| `/map` | Show how a set of related files/modules connect to each other. |
| `/trace` | Trace one specific thing (a function, an action) as it moves through the codebase. |
| `/changes` | Human-readable summary of what actually changed, not a raw diff. |

### 7.5 Debugging
| Command | Purpose |
|---|---|
| `/debug` | Walk through symptom → hypothesis → investigation → root cause → fix → verification for the current bug. |
| `/bugs` | List bug history for the session; `/bugs <id>` inspects a specific one. |
| `/postmortem` | Full narrative postmortem of a specific bug — expectation, first assumption, investigation, what was wrong, root cause, fix, verification, lesson. |

### 7.6 Reinforcement
| Command | Purpose |
|---|---|
| `/recap` | Summarize what has been built, learned, debugged, and decided within the current session or context — usable after a feature (`/recap`), scoped to an area (`/recap auth`), or at the end of a session. Not exclusively an end-of-session command. |
| `/checkpoint` | Manually save the current understanding of an important feature, concept, or implementation state — a deliberate, user-triggered save, distinct from the automatic checkpoint that `/learn` already produces every time it stops. |
| `/quiz` | Ask the user questions based on what they actually just learned; identify strong vs. weak areas. This is DevLens's primary mechanism for reaching the CONFIRMED understanding state (§6.4). |

---

## 8. Primary User Flow

```
User asks agent to build a feature
        │
        ▼
Agent creates implementation plan
        │
        ▼
User runs /learn  →  enters Learning Mode
        │
        ▼
DevLens identifies next learning unit → agent implements it → STOPS
        │
        ▼
DevLens explains: files created, what they do, the resulting flow
   (state: EXPLAINED)
        │
        ▼
User investigates: /ask, /why, /explain, /review
   (state: ENGAGED, if used)
        │
        ▼
User runs /learn continue
   (proceeding — not itself evidence of understanding)
        │
        ▼
(repeat until plan complete → Learning Mode exits automatically)
        │
        ▼
/tour → /recap → /quiz
   (/quiz is the mechanism for reaching CONFIRMED understanding)
```

**Debugging sub-flow**, triggered whenever a bug occurs:

```
Bug occurs → /debug → hypothesis → investigation → root cause → fix → verification → /postmortem
```

---

## 9. Architecture

### 9.1 Design Ratio
DevLens should be approximately **80–90% instructions, 10–20% deterministic code**. The underlying LLM already reads repositories, explains architecture, traces flows, and reasons about bugs well — DevLens should not reimplement that in custom code.

The separation of responsibility is:

| LLM handles | Scripts handle |
|---|---|
| Reasoning | State read/write |
| Code understanding | Structured artifacts |
| Explanations | ID generation |
| Learning-unit identification | Validation |
| Debugging reasoning | Deterministic git diff extraction |
| Architecture analysis | Other deterministic operations |

### 9.2 Two-Part Structure
**Installed skill** (e.g. `~/.<agent>/skills/devlens/`) — contains DevLens's instructions, command definitions, references, scripts, templates, and host adapters. This is the portable, reusable part.

**Project-local state** (`.devlens/` inside the user's project) — contains runtime artifacts: session state, checkpoints, bugs, and decisions. This directory should stay minimal and structured — not a log of every conversational turn.

### 9.3 Proposed Filesystem

```
devlens/
├── SKILL.md                  ← constitution: mission, principles, rules
├── commands/
│   ├── learn.md
│   ├── ask.md
│   ├── review.md
│   ├── tour.md
│   ├── explain.md
│   ├── map.md
│   ├── trace.md
│   ├── why.md
│   ├── decision.md
│   ├── changes.md
│   ├── concept.md
│   ├── debug.md
│   ├── bugs.md
│   ├── postmortem.md
│   ├── recap.md
│   ├── checkpoint.md
│   └── quiz.md
├── references/
│   ├── learning-model.md
│   ├── caveman.md
│   ├── teaching-mode.md
│   ├── state-model.md
│   └── response-format.md
├── scripts/
│   ├── state.*
│   ├── checkpoint.*
│   └── utilities.*
├── templates/
│   ├── checkpoint.*
│   ├── bug.*
│   └── decision.*
└── adapters/
    ├── opencode/
    ├── gemini/
    ├── codex/
    └── claude/
```

`.devlens/` (project-local, runtime):
```
.devlens/
├── state/
│   └── current.json      ← mode, active plan, current unit, awaiting-human flag
├── checkpoints/
├── bugs/
└── decisions/
```

### 9.4 SKILL.md Responsibilities
`SKILL.md` acts as DevLens's constitution — mission, core principle ("AI builds. Human understands."), and hard rules, including: `/learn` changes execution behavior; learning units must be conceptually meaningful; the agent never continues past a checkpoint without explicit continuation; `/ask` uses current learning context first; `/review` is educational, not a quality audit; `/tour` maps the project; `/debug` exposes the debugging process; Caveman compresses language without removing technical meaning; the agent must not fabricate understanding (and must distinguish EXPLAINED / ENGAGED / CONFIRMED, per §6.4); and DevLens must not create unnecessary persistent artifacts.

### 9.5 Host Compatibility
DevLens must work across multiple agentic coding harnesses (Claude Code, Codex, Gemini CLI, OpenCode, and potentially others), which differ in how they implement skills, commands, session management, and tool permissions. The architecture separates a constant DevLens core/behavior from per-host adapters that translate installation and invocation mechanics for each harness.

```
DEVLENS CORE
     │
HOST ADAPTER
     │
OpenCode / Gemini / Codex / Claude / ...
```

---

## 10. Success Hypothesis

DevLens is fundamentally testing one hypothesis:

> Can AI coding agents become a tool for accelerated developer learning instead of simply becoming a replacement for developer involvement?

A successful outcome looks like a developer who, after a DevLens-assisted build, can explain their own architecture, defend their technology choices, and walk through how a real bug in their codebase was diagnosed and fixed — not just that "the AI fixed it."

### 10.1 Toward Measurable Success Criteria

When DevLens moves from PRD to implementation, this hypothesis should be tested with concrete, checkable criteria. After using DevLens to build a feature, can the developer:

1. Identify the important files involved?
2. Explain the feature's data/control flow?
3. Explain why major implementation decisions were made?
4. Explain at least one bug and its root cause?
5. Modify or extend the feature with understanding?

These map naturally onto `/quiz` and `/recap` as the mechanisms for actually testing them, rather than relying on `/learn continue` as a (false) proxy for understanding — consistent with the EXPLAINED / ENGAGED / CONFIRMED distinction in §6.4.

---

## 11. Phased Roadmap

**Phase 1 — Core Loop (prove the mechanism)**
- `/learn`, `/learn continue`, `/learn review`
- `/ask`, `/review`, `/tour`
- Caveman protocol, learning-unit protocol, session state (mode / active plan / current unit / awaiting-human)
- Validate on real projects before expanding scope

**Phase 2 — Understanding & Navigation**
- `/explain`, `/concept`, `/decision`, `/why`, `/compare`, `/map`, `/trace`, `/changes`

**Phase 3 — Debugging**
- `/debug`, `/bugs`, `/postmortem`

**Phase 4 — Reinforcement**
- `/recap`, `/checkpoint`, `/quiz`

---

## 12. Open Questions / Decisions Needed

- **Command syntax:** `/learn continue` vs. `/learn --continue` vs. `/learn:continue` — likely constrained by what each host harness supports.
- **Learning-unit boundary algorithm:** the design *principle* is now defined (§6.1 — coherent concept, inspectable size, illustrated with good/bad examples), but the concrete automated rule for "this is a good stopping point" is not yet defined.
- **State schema:** exact contents/shape of `.devlens/state/current.json` are undecided beyond the four fields identified in §6.1/§9.3 (mode, active plan, current unit, awaiting-human flag).
- **Plan detection:** how robustly DevLens can detect and read the "active plan" across different agent harnesses.
- **Interruption handling:** how `/learn` should behave when a user interrupts mid-unit (e.g., "stop," or requests an architecture change) — state transitions not yet defined.
- **Caveman triggering:** always-on for DevLens checkpoints vs. default-for-`/learn`-only vs. configurable vs. automatic based on response length vs. user-selectable depth — needs experimentation.
- **Cross-harness common denominator:** what capabilities can be assumed present across OpenCode, Gemini CLI, Codex, and Claude Code to design the adapter boundary correctly.

---

## 13. Non-Negotiable Design Rules

1. `/learn` changes agent execution behavior — it is not just a passive explanation command, it is a stateful mode (§6.1).
2. The agent never proceeds past a learning checkpoint without an explicit `/learn continue`.
3. Learning units are conceptual, not per-file or per-task.
4. Learning Mode automatically exits back to Normal Mode once the active plan is complete — it does not persist indefinitely by default.
5. `/ask` always uses the current learning context as primary grounding, not generic chat.
6. `/review` teaches the human to inspect code themselves — it is never an AI code-quality verdict.
7. Debugging is treated as a first-class learning artifact, not an invisible background process.
8. Caveman Mode compresses communication; it never removes technical meaning, caveats, or risk information.
9. DevLens does not fabricate understanding: it must distinguish EXPLAINED, ENGAGED, and CONFIRMED states, and must never treat `/learn continue` as proof the user understood the preceding unit (§6.4).
10. `.devlens/` stores meaningful structured artifacts only — not a transcript of every interaction.
11. DevLens state is session-scoped; it is not a long-term personal memory system.