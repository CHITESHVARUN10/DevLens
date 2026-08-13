# Host Adapters

DevLens has a constant core/behavior plus per-host adapters that translate installation and invocation mechanics (PRD §9.5).

```
DEVLENS CORE
     │
HOST ADAPTER
     │
OpenCode / Gemini / Codex / Claude / ...
```

## The boundary contract

**The core (everything outside `adapters/`) never changes per host.** It assumes only the Agent Skills standard (https://agentskills.io): a `SKILL.md` with frontmatter, `commands/`, `references/`, `scripts/`, `templates/`, subcommand routing via the first argument, and `${COMMANDCODE_SKILL_DIR}`-style path substitution where the host provides it (each adapter documents its host's substitution variable).

**An adapter is responsible for:**
1. **Installation** — where the skill directory lives for that host, and how it's registered.
2. **Invocation** — whether the host supports subcommands natively, or needs thin wrapper commands to map `/learn`, `/ask`, etc. onto `/devlens learn`, `/devlens ask`, …
3. **Collision handling** — a subcommand name that collides with a host built-in (e.g. Command Code's `/review`) and how to route around it.
4. **Path substitution** — the skill-dir variable the host substitutes (Command Code: `${COMMANDCODE_SKILL_DIR}`).

## Adapter status

| Host | Status |
|---|---|
| `command-code/` | **Phase 1 target** — implemented and verified. |
| `opencode/`, `gemini/`, `codex/`, `claude/` | **Stub** — Phase 2+. The core works unchanged under any Agent Skills host; only the adapter mechanics are missing. See the README in each directory (or add one) for the host's skills layout. |

## Cross-harness common denominator (open question, PRD §12)

Phase 1 assumes only what the Agent Skills standard guarantees: a `SKILL.md` + supporting files, and the ability to run `node` scripts. Harness-specific features (plan-mode files, session resume, subcommand parsing) are treated as optional and detected at runtime, never assumed.
