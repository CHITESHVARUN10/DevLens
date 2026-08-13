# Command Code Adapter

Install DevLens for Command Code. The skill itself is standard Agent Skills; this adapter adds Command-Code-native wrapper commands so `/learn`, `/ask`, `/tour`, and the Phase 2 commands feel like first-class commands instead of `/devlens <subcommand>`.

## 1. Install the skill

The repo root IS the skill. Symlink it into the user skills directory under the name `devlens` (the directory name must match the skill `name` in `SKILL.md`):

```bash
ln -s ~/D-drive/DevLens ~/.commandcode/skills/devlens
```

Verify:

```bash
cmd skills list --debug
# devlens should appear with no warnings/skip
```

**Fallback (if symlink validation trips on the directory name):** add the repo path to the `skills` array in `~/.commandcode/settings.json` (or `.commandcode/settings.json`):

```json
{ "skills": ["/Users/chiteshvarun/D-drive/DevLens"] }
```

or load per-session with `cmd --skill ~/D-drive/DevLens`.

## 2. Install the wrapper commands

Copy the wrapper files into the Command Code custom-commands directory:

```bash
mkdir -p ~/.commandcode/commands
cp adapters/command-code/commands/*.md ~/.commandcode/commands/
```

This gives you:

| Command | Routes to |
|---|---|
| `/learn` | `/devlens learn $ARGUMENTS` (bare, `continue`, `review`) |
| `/ask` | `/devlens ask $ARGUMENTS` |
| `/tour` | `/devlens tour $ARGUMENTS` |
| `/dl-review` | `/devlens review $ARGUMENTS` |
| `/explain` | `/devlens explain $ARGUMENTS` |
| `/concept` | `/devlens concept $ARGUMENTS` |
| `/decision` | `/devlens decision $ARGUMENTS` |
| `/why` | `/devlens why $ARGUMENTS` |
| `/compare` | `/devlens compare $ARGUMENTS` |
| `/map` | `/devlens map $ARGUMENTS` |
| `/dl-trace` | `/devlens trace $ARGUMENTS` |
| `/changes` | `/devlens changes $ARGUMENTS` |

## 3. Collision handling

Command Code ships built-ins that win dispatch over custom commands with the same name. The affected DevLens subcommands:

- **`/review`** (built-in PR review) → wrapper is **`/dl-review`**
- **`/trace`** (built-in "copy the current trace id") → wrapper is **`/dl-trace`**

Both remain fully reachable inside the skill itself — `/devlens review`, `/devlens trace`, and `/skill:devlens review|trace` all work regardless of shadowing.

## 4. Try it

```bash
/devlens tour          # project map + state initialized
/devlens learn         # enter Learning Mode, implement unit 1, stop
/devlens learn review  # recap the latest checkpoint
/devlens explain architecture
/devlens concept       # the concepts this project uses
/devlens why "subcommand routing"
/devlens map commands
/devlens changes       # summary of what changed since the last checkpoint
```

## Notes

- **Skill-dir substitution:** Command Code substitutes `${COMMANDCODE_SKILL_DIR}` in skill bodies; the wrapper commands rely on the inline skill reference (`Follow /devlens …`) to pin the skill, and `$ARGUMENTS` passes the wrapper's arguments through.
- **State location:** `.devlens/` is created in the user's project root (git root, else cwd) — never inside the skill source.
