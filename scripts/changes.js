"use strict";
/**
 * DevLens change extraction — deterministic diff summaries from git.
 *
 * Usage:
 *   node scripts/changes.js since-last [--json]   # changes since checkpoint marker (or HEAD)
 *   node scripts/changes.js since <ref> [--json]  # changes against an arbitrary git ref
 *   node scripts/changes.js history [<n>] [--json] # last n checkpoints with their file lists
 *
 * Output is machine-readable (--json) so the agent writes the human narrative on top.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const util = require("./util");

const ROOT = util.projectRoot();
const MARKER_FILE = path.join(util.devlensDir(ROOT), "state", "last-checkpoint.json");
const CHECKPOINTS_DIR = util.checkpointsDir(ROOT);

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    return { error: (err.stderr || err.message).trim() };
  }
}

function isGitRepo() {
  const out = git(["rev-parse", "--is-inside-work-tree"]);
  return typeof out === "string" && out.trim() === "true";
}

function collect(base) {
  const result = { base, status: [], stat: [], files: [], error: null };
  const status = git(["status", "--short"]);
  const stat = git(["diff", "--stat", base]);
  const nameOnly = git(["diff", "--name-status", base]);
  if (typeof status === "object") result.error = status.error || "git error";
  else {
    result.status = status.trim().split("\n").filter(Boolean);
    result.files = result.status.map((l) => l.replace(/^\S+\s+/, "").replace(/^"|"$/g, "")).filter((f) => !f.startsWith(".devlens/"));
  }
  if (typeof stat === "string" && !stat.error) result.stat = stat.trim().split("\n").filter(Boolean);
  if (typeof nameOnly === "string" && !nameOnly.error) result.nameStatus = nameOnly.trim().split("\n").filter(Boolean);
  return result;
}

function cmdSinceLast(args) {
  if (!isGitRepo()) {
    if (args.json) {
      console.log(JSON.stringify({ base: "none", status: [], stat: [], files: [], error: "not a git repo" }));
    } else {
      console.log("not a git repo — no change summary available");
    }
    process.exit(args.exit0 ? 0 : 1);
  }
  const marker = util.readJson(MARKER_FILE);
  let base;
  if (marker && marker.headSha) {
    base = marker.headSha;
  } else {
    const head = git(["rev-parse", "HEAD"]);
    base = typeof head === "string" && !head.error ? head.trim() : "HEAD";
  }
  const result = collect(base);
  result.sinceMarker = marker !== null && marker.headSha === base;
  output(result, args.json);
}

function cmdSince(args) {
  const ref = args._[0];
  if (!ref) throw new Error("usage: changes since <ref>");
  const result = collect(ref);
  result.sinceMarker = false;
  output(result, args.json);
}

function cmdHistory(args) {
  const n = parseInt(args._[0] || "5", 10);
  let files = [];
  try {
    files = fs.readdirSync(CHECKPOINTS_DIR).filter((f) => f.endsWith(".json")).sort().slice(-n);
  } catch {
    files = [];
  }
  const entries = files.map((f) => {
    const d = util.readJson(path.join(CHECKPOINTS_DIR, f));
    return d
      ? { unitId: d.unitId, name: d.name, date: d.date, files: d.files || [], summary: d.summary || "" }
      : null;
  }).filter(Boolean);
  if (args.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }
  if (!entries.length) {
    console.log("no checkpoints yet");
    return;
  }
  for (const e of entries) {
    console.log(`[${e.date.slice(0, 10)}] ${e.name} (${e.unitId})`);
    console.log(`    files: ${e.files.length ? e.files.join(", ") : "(none)"}`);
  }
}

function output(result, json) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.error) {
    console.error(`error: ${result.error}`);
    process.exit(1);
  }
  console.log(result.status.join("\n") || "(no changes)");
  if (result.stat.length) {
    console.log("");
    console.log(result.stat.join("\n"));
  }
}

const COMMANDS = {
  "since-last": cmdSinceLast,
  since: cmdSince,
  history: cmdHistory,
};

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const fn = COMMANDS[cmd];
  if (!fn) {
    console.error(`unknown command: ${cmd || "(none)"}\n`);
    console.error(Object.keys(COMMANDS).join("\n"));
    process.exit(2);
  }
  const args = parseArgs(argv.slice(1));
  try {
    fn(args);
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

if (require.main === module) main();
