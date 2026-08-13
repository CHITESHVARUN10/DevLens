# Response Formats

The exact output templates for DevLens's structured outputs, so every host renders consistently. Use the Caveman style (references/caveman.md) unless a depth is specified.

## 1. Checkpoint (end of a learning unit)

Default: Caveman summary + Normal flow/concept explanation.

```
CHECKPOINT: <unit name>

FILES:
- <path 1> — what it does (one line)
- <path 2> — what it does (one line)

FLOW: <step> -> <step> -> <step>          # Normal depth for the flow

CONCEPTS:
- <concept 1>
- <concept 2>

NOTE: <caveat, risk, or decision that matters>   # only when one exists
```

Then, in Normal depth, 1–3 sentences explaining the flow and the key concept in project-specific terms (references/teaching-mode.md).

Understanding state for the unit: `explained` (recorded by `scripts/state.js complete-unit`). Never claim more.

## 2. Awaiting-continue notice

Caveman, one line:

```
⏸ AWAITING CONTINUE — run /learn continue (or /devlens learn continue) to proceed. /learn continue is not a claim that you understood the unit; ask /ask, /why, /review if anything is unclear.
```

## 3. Plan deviation report

Normal depth, never Caveman (PRD §6.3). The agent has **not** proceeded past the deviation:

```
⚠ PLAN DEVIATION — STOPPED

EXPECTED:  <what the plan said>
FOUND:     <what the agent discovered>
WHY IT MATTERS: <impact on the plan, architecture, or deliverable>
PROCEEDED: NO

Proposed adjustments (not performed):
- <option 1>
- <option 2>

Waiting for the developer's decision.
```

## 4. Tour map

Caveman by default.

```
PROJECT MAP: <project name>

ENTRY: <entry point path> — <one line>
LAYERS:
- <dir/path> — <one line>
- <dir/path> — <one line>

FLOW: <entry> -> <layer> -> <layer> -> <output>

HOT SPOTS:
- <path> — <why it matters>
- <path> — <why it matters>
```

For `/tour <area>`: same shape, scoped to the area — entry, key files, flow, hot spots within the area.

## 5. Review walkthrough (educational)

Never an AI quality verdict (PRD §6.3 rule 6, §7.4). The agent teaches the developer how to inspect:

```
REVIEW GUIDE: <unit or area>

START HERE: <file 1> — open it and look for <what>
1. <step> — <what to look for / what question to ask yourself>
2. <step> — <what to look for / what question to ask yourself>
3. <step> — <what to look for / what question to ask yourself>

CHECK YOURSELF:
- Did <behavior> surprise you? Look at <path>.
- Trace <data> from <entry> to <output> — does every hop make sense?

If you can't answer <question>, that's the gap to work on — ask /ask or /why.
```

## 6. Status / help (bare `/devlens`)

```
DEVLENS: <mode>
PLAN: <summary> (<n> units) | none
UNIT: <current unit> | none
AWAITING CONTINUE: yes | no

Commands:
/devlens learn              — enter Learning Mode, implement next unit, stop
/devlens learn continue     — resume, implement next unit
/devlens learn review       — recap most recent unit
/devlens ask <question>     — context-grounded question about current unit/code
/devlens review [area]      — guided walkthrough of how to inspect the code
/devlens tour [area]        — project or area map
/devlens explain [target]   — structured explanation of overall/architecture/area/file/flow
/devlens concept [name]     — the programming concepts this project uses, in project terms
/devlens decision [id]      — recorded design decisions (list, or detail one)
/devlens why <decision>     — reasoning behind one specific decision, with evidence
/devlens compare X vs Y     — chosen approach vs. a named alternative
/devlens map [target]       — how related files/modules connect
/devlens trace <thing>      — one thing's journey through the code, hop by hop
/devlens changes [n]        — human-readable summary of what changed
```

## 7. Empty states

- No checkpoints yet (`/devlens learn review`): `No checkpoints yet — start with /devlens learn.`
- Not in Learning Mode but `/devlens learn continue` was run: `Not in Learning Mode — run /devlens learn first.`
- No active plan: `No active plan — describe what to build, then run /devlens learn.`

## 8. Explain (structured depth tiers)

Depth: Normal by default; `--deep` adds alternatives, tradeoffs, edge cases, architectural reasoning.

```
EXPLAIN: <target>

WHAT IT IS:   <one or two lines, project terms>
HOW IT WORKS: <the mechanism, concrete>
WHY IT'S SHAPED THIS WAY: <the reason, from code/decisions>
WHAT TO READ NEXT: <paths>
```

Deep adds `ALTERNATIVES / TRADEOFFS / EDGE CASES:` sections after WHY.

## 9. Concept (project-specific)

```
CONCEPT: <name>

IN THIS PROJECT: <one line, anchored to this codebase>
LIKE YOU ALREADY KNOW: <map onto a familiar concept>
WHERE IT LIVES: <file/line pointers>
HOW THIS PROJECT USES IT DIFFERENTLY: <contrast, when relevant>
```

Bare `/devlens concept`:

```
CONCEPTS IN THIS PROJECT

CORE:        <concept> — <where it lives>; <concept> — <where>
INCIDENTAL:  <concept> — <where>
ADVANCED:    <concept> — <where>
```

## 10. Decision (list / detail)

```
DECISIONS   (from .devlens/decisions/)

[dec-xxxx] <title> — why: <one line>
[dec-yyyy] <title> — why: <one line>
```

Detail (`/devlens decision <id>`):

```
DECISION: <title>  [dec-xxxx]

WHAT:   <chosen>
WHY:    <reason>
ALT:    <alternatives considered>
CONSEQ: <consequences>
UNIT:   <linked unit, when any>
```

Empty state: `No decisions recorded yet.` Then offer candidates derived from the code (non-default choices worth explaining) and offer to capture them.

## 11. Why (one decision, with evidence)

```
WHY: <decision>

ANSWER: <the reasoning, grounded>
EVIDENCE: <file:line or file references that embody the choice>
GROUNDED ON: <recorded decision | reconstructed from code — never present
              reconstruction as a recorded fact>
```

If reconstructed: end with `Want me to record this? (/devlens decision <id> — then decision.js add)`.

## 12. Compare (chosen vs. alternative)

```
COMPARE: <chosen> vs <alternative>

CHOSEN:      <what was chosen, with evidence file:line>
ALTERNATIVE: <how the alternative differs>
TRADEOFF:    <what was actually given up / gained>
ALTERNATIVE WINS WHEN: <conditions where the alternative would win>
IF YOU SWITCHED: <what would break or move>
```

## 13. Map (text diagram)

```
MAP: <feature/module>

entry: <file> — <one line>
  │ <what flows across>
  ▼
<module> — <one line>
  │ <what flows across>
  ▼
exit: <file> — <one line>

DATA STRUCTURES: <the key ones and where they live>
BOUNDARIES: <where modules meet, and the contract at each boundary>
```

Bare `/devlens map`: map the current unit from its checkpoint; if none, prompt for a target.

## 14. Trace (numbered hops)

```
TRACE: <thing>

1. <file>:<fn> — <what it does> — passes <x> to
2. <file>:<fn> — <what it does> — passes <y> to
3. <file>:<fn> — <what it does>

BOUNDARY CROSSINGS: <hop 2> crosses from <module A> to <module B>
OUTCOME: <the terminal state/return>
```

Skip nothing that changes state or routes control.

## 15. Changes (human summary, never raw diff)

```
CHANGES (since <base>)

NEW:      <file/feature> — <why it matters>
MOVED:    <file> -> <file> — <why>
DELETED:  <file> — <why>
MODIFIED: <file> — <what changed and why it matters>

RISK SPOTS: <anything in the diff that deserves a careful look>
```

`/devlens changes <n>`: same shape, but across the last n checkpoints — one block per unit.

## 16. Debug (six-stage narration)

Each stage is narrated explicitly, in order, before moving on (references/bug-protocol.md):

```
DEBUG: <symptom>

STAGE 1 — SYMPTOM: <what the user sees, in their terms>
STAGE 2 — HYPOTHESIS: <testable candidate cause(s)>
STAGE 3 — INVESTIGATION: <what was checked, what it ruled in/out>
STAGE 4 — ROOT CAUSE: <the actual defect — file + mechanism>
STAGE 5 — FIX: <the change, aimed at the root cause>
STAGE 6 — VERIFICATION: <the reproduction re-run, tests green>

LESSON: <the distilled takeaway>
```

If a stage can't be completed, say so explicitly and stop — never fake progress.

## 17. Bugs (list / detail)

```
BUGS   (from .devlens/bugs/)

[bug-xxxx] <title> — root cause: <one line>
[bug-yyyy] <title> — root cause: <one line>
```

Detail (`/devlens bugs <id>`):

```
BUG: <title>  [bug-xxxx]

SYMPTOM:   <what was seen>
HYPOTHESIS: <candidate cause>
INVESTIGATION: <what was checked>
ROOT CAUSE: <the defect>
FIX:       <the change>
VERIFY:    <evidence it works>
LESSON:    <distilled takeaway, when any>
UNIT:      <linked unit, when any>
```

Empty state: `No bugs recorded this session.`

## 18. Postmortem (narrative, Normal depth — never Caveman)

This is the reflective artifact; it is written out, not compressed:

```
POSTMORTEM: <title>

EXPECTATION:     <what should have happened>
FIRST ASSUMPTION: <the first thing blamed — and whether it was right>
INVESTIGATION:   <the path from assumption to truth>
WHAT WAS WRONG:  <the actual defect>
ROOT CAUSE:      <why it produced the symptom>
FIX:             <what changed>
VERIFICATION:    <evidence the fix holds>
LESSON:          <what this bug teaches>
```

## 19. Recap (session understanding summary)

```
RECAP: <session>

BUILT:   <units with checkpoint summaries>
LEARNED: <concepts across checkpoints/quiz>
DEBUGGED: <bugs, with one-line root causes>
DECIDED: <decisions, with one-line whys>

UNDERSTANDING (per unit — honest, never inflated):
<unit-name>: EXPLAINED | ENGAGED | CONFIRMED
```

Sources are artifacts only (`.devlens/checkpoints/`, `bugs/`, `decisions/`, state's `understanding` map) — never memory.

## 20. Manual checkpoint (`/devlens checkpoint <name>`)

Same shape as the auto checkpoint (response-format §1), but flagged manual and carrying the user's notes — distinct from learning-unit checkpoints:

```
MANUAL CHECKPOINT: <name>  [kind: manual]

NOTES: <what you asked to save>
AREA:  <area, when given>
DATE:  <date>
```

## 21. Quiz interaction

One question at a time; each is graded before the next:

```
QUIZ: <unit or area>

Q<n>. <question>  (recall | trace | explain)
<your answer> → GRADE: <confirmed | partial | failed>
[if wrong: the correct answer + the artifact to re-read]

QUIZ RESULT: <unit> — confirmed <n>, partial <n>, failed <n>

STRONG: <demonstrated>
WEAK:   <what to revisit — point at the artifact/checkpoint>
```
