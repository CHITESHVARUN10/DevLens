"use strict";
/**
 * DevLens installer — harness + component definitions.
 *
 * Each harness maps to the repo's `adapters/<id>/` directory. The installer
 * copies whatever that directory contains; a stub adapter (no subdirs) still
 * installs the core skill but offers no wrapper commands.
 */

const path = require("path");
const fs = require("fs");

// The published package layout (self-contained):
//   <pkg>/bundle/devlens/   — the DevLens skill tree
//   <pkg>/bundle/adapters/  — per-harness extras
// In a dev checkout, fall back to the repo root's adapters/.
const BUNDLE_DIR = path.join(__dirname, "..", "bundle");
const ADAPTERS_DIR = fs.existsSync(path.join(BUNDLE_DIR, "adapters"))
  ? path.join(BUNDLE_DIR, "adapters")
  : path.join(__dirname, "..", "..", "adapters");

function expandHome(p) {
  if (p === "~") return process.env.HOME || process.cwd();
  if (p.startsWith("~/")) return path.join(process.env.HOME || process.cwd(), p.slice(2));
  return p;
}

const HARNESSES = [
  {
    id: "command-code",
    label: "Command Code",
    home: "~/.commandcode",
    skillDir: "~/.commandcode/skills/devlens",
    wrapperDir: "~/.commandcode/commands",
    verify: ["cmd", "skills", "list", "--debug"],
    supported: true,
  },
  {
    id: "claude",
    label: "Claude Code",
    home: "~/.claude",
    skillDir: "~/.claude/skills/devlens",
    wrapperDir: "~/.claude/commands",
    verify: null,
    supported: false,
  },
  {
    id: "codex",
    label: "Codex",
    home: "~/.codex",
    skillDir: "~/.codex/skills/devlens",
    wrapperDir: null,
    verify: null,
    supported: false,
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    home: "~/.gemini",
    skillDir: "~/.gemini/skills/devlens",
    wrapperDir: null,
    verify: null,
    supported: false,
  },
  {
    id: "opencode",
    label: "OpenCode",
    home: "~/.config/opencode",
    skillDir: "~/.config/opencode/skills/devlens",
    wrapperDir: null,
    verify: null,
    supported: false,
  },
].map((h) => ({
  ...h,
  home: expandHome(h.home),
  skillDir: expandHome(h.skillDir),
  wrapperDir: h.wrapperDir ? expandHome(h.wrapperDir) : null,
}));

/** Adapter dir for a harness id, when it exists in the repo. */
function adapterDir(id) {
  return path.join(ADAPTERS_DIR, id);
}

/** Does this harness have wrapper commands in the repo? */
function hasWrappers(id) {
  const dir = path.join(adapterDir(id), "commands");
  try {
    return require("fs").readdirSync(dir).length > 0;
  } catch {
    return false;
  }
}

module.exports = { HARNESSES, BUNDLE_DIR, ADAPTERS_DIR, hasWrappers };
