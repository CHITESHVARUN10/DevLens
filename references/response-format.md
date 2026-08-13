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
```

## 7. Empty states

- No checkpoints yet (`/devlens learn review`): `No checkpoints yet — start with /devlens learn.`
- Not in Learning Mode but `/devlens learn continue` was run: `Not in Learning Mode — run /devlens learn first.`
- No active plan: `No active plan — describe what to build, then run /devlens learn.`
