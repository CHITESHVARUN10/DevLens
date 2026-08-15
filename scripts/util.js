"use strict";
/**
 * DevLens shared utilities — resolve project root, .devlens paths, IDs, atomic JSON I/O.
 * Zero dependencies, CommonJS. Runs anywhere Node runs.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

/**
 * Project root: the git root when the cwd is inside a repo, else the working
 * directory. Never climbs to an unrelated parent — if the detected git root
 * does not contain the cwd, the cwd wins.
 */
function projectRoot() {
  const cwd = process.cwd();
  try {
    const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (gitRoot) {
      const rel = path.relative(gitRoot, cwd);
      const inside = rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
      if (inside) return gitRoot;
    }
  } catch {
    /* not a git repo — fall through */
  }
  return cwd;
}

/** The skill's own directory (three levels up from scripts/). */
function skillRoot() {
  return path.resolve(__dirname, "..");
}

function devlensDir(root) {
  return path.join(root, ".devlens");
}

function stateFile(root) {
  return path.join(devlensDir(root), "state", "current.json");
}

function checkpointsDir(root) {
  return path.join(devlensDir(root), "checkpoints");
}

/** Short, sortable ID: `unit-<base36 timestamp><3 random chars>`. */
function newUnitId() {
  return "unit-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/** Filesystem-safe timestamp for checkpoint filenames: YYYYMMDD-HHMMSS. */
function fsTimestamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    p(date.getMonth() + 1) +
    p(date.getDate()) +
    "-" +
    p(date.getHours()) +
    p(date.getMinutes()) +
    p(date.getSeconds())
  );
}

function nowIso() {
  return new Date().toISOString();
}

/** Read JSON with a helpful error; returns null when missing (never throws on ENOENT). */
function readJson(file, { missingOk = true } = {}) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT" && missingOk) return null;
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${file}: invalid JSON — ${err.message}`);
  }
}

/** Atomic JSON write: temp sibling + rename, so a crash never leaves a half-written state file. */
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp-" + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

module.exports = {
  projectRoot,
  skillRoot,
  devlensDir,
  stateFile,
  checkpointsDir,
  newUnitId,
  fsTimestamp,
  nowIso,
  readJson,
  writeJson,
};
