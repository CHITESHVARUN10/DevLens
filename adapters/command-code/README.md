# Command Code Adapter

Install DevLens for Command Code. The skill itself is standard Agent Skills; this adapter adds Command-Code-native wrapper commands so `/learn`, `/ask`, `/tour`, and `/dl-review` feel like first-class commands instead of `/devlens <subcommand>`.

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

## 3. The `/review` collision

Command Code ships a built-in `/review` (PR review). Built-ins always win dispatch, so the skill's `review` subcommand is reachable as:

- `/dl-review` (the wrapper above), or
- `/skill:devlens review` — the namespaced form always resolves to the skill, shadowed or not.

The core skill itself is unaffected — `/devlens review` and `/skill:devlens review` both work.

## 4. Try it

```bash
/devlens tour          # project map + state initialized
/devlens learn         # enter Learning Mode, implement unit 1, stop
/devlens learn review  # recap the latest checkpoint
```

## Notes

- **Skill-dir substitution:** Command Code substitutes `${COMMANDCODE_SKILL_DIR}` in skill bodies; the wrapper commands rely on the inline skill reference (`Follow /devlens …`) to pin the skill, and `$ARGUMENTS` passes the wrapper's arguments through.
- **State location:** `.devlens/` is created in the user's project root (git root, else cwd) — never inside the skill source.
