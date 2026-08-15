"use strict";
/**
 * DevLens plan locator — deterministically find the active harness plan file.
 *
 * Usage:
 *   node scripts/plan.js locate            # prints the most recent plan file path, or exits 1
 *   node scripts/plan.js locate --json     # { path, mtime, source } or { path: null }
 *   node scripts/plan.js list              # all plan files, newest first
 *
 * The agent no longer guesses where plans live; it runs this script. Search
 * covers the harness plan directories, newest .md first, plus any plan the
 * user copied into the project's .devlens/plans/.
 */

const fs = require("fs");
const path = require("path");
const util = require("./util");

const HOME = process.env.HOME || process.cwd();

/** Harness plan directories, in priority order. */
function planDirs() {
  return [
    path.join(HOME, ".commandcode", "plans"),
    path.join(HOME, ".claude", "plans"),
    path.join(HOME, ".config", "opencode", "plans"),
    path.join(HOME, ".gemini", "plans"),
    path.join(HOME, ".codex", "plans"),
    path.join(util.projectRoot(), ".devlens", "plans"),
  ];
}

/** All plan files (.md) in the dirs, newest first, each with mtime + source dir. */
function findAll() {
  const out = [];
  for (const dir of planDirs()) {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue; // dir missing — skip
    }
    for (const name of entries) {
      if (!name.endsWith(".md")) continue;
      const full = path.join(dir, name);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      if (!stat.isFile()) continue;
      out.push({
        path: full,
        mtime: stat.mtimeMs,
        source: dir.includes(".devlens") ? "local" : "harness",
      });
    }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

function cmdLocate(args) {
  const all = findAll();
  if (!all.length) {
    if (args.json) console.log(JSON.stringify({ path: null }));
    else {
      console.error("no plan files found");
      console.error("looked in:");
      for (const d of planDirs()) console.error("  " + d);
      process.exit(1);
    }
    return;
  }
  const top = all[0];
  if (args.json) console.log(JSON.stringify({ path: top.path, mtime: top.mtime, source: top.source }, null, 2));
  else console.log(top.path);
}

function cmdList() {
  const all = findAll();
  if (!all.length) {
    console.log("(no plan files)");
    return;
  }
  for (const p of all) {
    console.log(`${new Date(p.mtime).toISOString()}  ${p.path}`);
  }
}

const COMMANDS = {
  locate: cmdLocate,
  list: cmdList,
};

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = { _: [], json: argv.includes("--json") };
  const fn = COMMANDS[cmd];
  if (!fn) {
    console.error(`unknown command: ${cmd || "(none)"}\n`);
    console.error(Object.keys(COMMANDS).join("\n"));
    process.exit(2);
  }
  try {
    fn(args);
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();
