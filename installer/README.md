# devlens-installer

Interactive installer for the [DevLens](https://github.com/CHITESHVARUN10/DevLens) skill.

One command, no shell scripts:

```bash
npx devlens-installer
```

It asks which **harness(es)** you use (Command Code, Claude Code, Codex, Gemini CLI, OpenCode) and which **components** you want (core skill + per-harness wrapper commands), shows you the exact install plan, and installs everything for the selected harness in one go.

## What it installs

- **Core skill** — `SKILL.md`, `commands/`, `references/`, `scripts/`, `templates/` → each selected harness's skills directory (e.g. `~/.commandcode/skills/devlens/`).
- **Wrapper commands** — the short aliases (`/learn`, `/ask`, `/debug`, `/quiz`, …) → each selected harness's commands directory (e.g. `~/.commandcode/commands/`), only when that harness has an adapter with wrappers.

## Trust & safety

- No opaque shell script — the installer is a plain Node.js package you run with `npx`; you see exactly what it will copy before anything is written.
- Nothing is ever deleted; re-running is safe and idempotent.
- Every copy reports source → destination.

## Usage after install

```bash
/devlens tour          # get the lay of the land
/devlens learn         # start building in learning units
```

The plan → learn loop: `/plan <task>` → press `esc` (Cancel — the plan stays saved) → `/devlens learn` reads the saved plan and drives implementation with checkpoints.

## Development

```bash
npm run build   # stage the skill tree into bundle/ (run before publishing)
npm run test    # syntax-check all files
npm publish     # from this directory, after bumping the version
```
