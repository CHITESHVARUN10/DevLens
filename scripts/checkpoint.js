"use strict";
/**
 * DevLens checkpoint manager — deterministic checkpoint artifacts.
 *
 * Usage:
 *   node scripts/checkpoint.js write --unit <id> --name "<name>" --summary "<text>" [--concepts "c1,c2"] [--flow "<text>"] [--diff]
 *   node scripts/checkpoint.js latest [--json]
 *   node scripts/checkpoint.js diff          # raw git status/diff since last marker (read-only)
 *
 * Creates .devlens/checkpoints/<ts>-<unit-id>.json (structured) and .md
 * (human-readable, rendered from templates/checkpoint.md).
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const util = require("./util");

const ROOT = util.projectRoot();
const CHECKPOINTS_DIR = util.checkpointsDir(ROOT);
const TEMPLATE_FILE = path.join(util.skillRoot(), "templates", "checkpoint.md");

const MARKER_FILE = path.join(util.devlensDir(ROOT), "state", "last-checkpoint.json");
const DEVLENS_PREFIX = path.join(".devlens", path.sep);

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

function gitDiff() {
  const result = { status: [], stat: [], error: null };
  const status = git(["status", "--short"]);
  if (status && typeof status === "string" && !status.error) {
    result.status = status.trim().split("\n").filter(Boolean);
  }
  const stat = git(["diff", "--stat", "HEAD"]);
  if (stat && typeof stat === "string" && !stat.error) {
    result.stat = stat.trim().split("\n").filter(Boolean);
  }
  if (typeof status === "object") result.error = status.error;
  return result;
}

/** Changes since the last checkpoint marker (or since HEAD when no marker). */
function diffSinceLastMarker() {
  const marker = util.readJson(MARKER_FILE);
  const head = git(["rev-parse", "HEAD"]);
  const headSha = typeof head === "string" && !head.error ? head.trim() : null;

  if (marker && marker.headSha) {
    // uncommitted changes + committed changes since the marker commit
    const status = git(["status", "--short"]);
    const stat = git(["diff", "--stat", marker.headSha]);
    return {
      status: typeof status === "string" && !status.error ? status.trim().split("\n").filter(Boolean) : [],
      stat: typeof stat === "string" && !stat.error ? stat.trim().split("\n").filter(Boolean) : [],
      marker: marker,
    };
  }
  // first checkpoint — everything since HEAD
  const diff = gitDiff();
  return { ...diff, marker: null, headSha };
}

function renderMarkdown(data) {
  let template;
  try {
    template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  } catch {
    template = "# Checkpoint: {name}\n\n- **Unit ID:** {unitId}\n- **Date:** {date}\n\n## Summary\n\n{summary}\n\n## Flow\n\n{flow}\n\n## Concepts\n\n{concepts}\n\n## Files (diff-verified)\n\n{files}\n";
  }
  const files =
    data.files && data.files.length
      ? data.files.map((f) => "- `" + f + "`").join("\n")
      : "_No file changes detected._";
  const concepts = data.concepts && data.concepts.length ? data.concepts.map((c) => "- " + c).join("\n") : "_None recorded._";
  return template
    .replace(/\{name\}/g, data.name)
    .replace(/\{unitId\}/g, data.unitId)
    .replace(/\{date\}/g, data.date)
    .replace(/\{summary\}/g, data.summary || "")
    .replace(/\{flow\}/g, data.flow || "")
    .replace(/\{concepts\}/g, concepts)
    .replace(/\{files\}/g, files);
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

function cmdWrite(args) {
  const unitId = args.unit || args._[0];
  const name = args.name;
  if (!unitId || !name) throw new Error("write requires --unit <id> and --name <name>");
  if (!/^unit-[A-Za-z0-9]+$/.test(unitId)) throw new Error("--unit must match ^unit-[A-Za-z0-9]+$");

  fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true });
  const ts = util.fsTimestamp();
  const date = new Date().toISOString();
  const base = path.join(CHECKPOINTS_DIR, `${ts}-${unitId}`);
  const diff = args.diff ? diffSinceLastMarker() : { status: [], stat: [], marker: null };

  const data = {
    unitId,
    name,
    summary: args.summary || "",
    flow: args.flow || "",
    concepts: args.concepts ? args.concepts.split(",").map((c) => c.trim()).filter(Boolean) : [],
    files: diff.status
      .map((line) => line.replace(/^\S+\s+/, "").replace(/^"|"$/g, ""))
      .filter((f) => !f.startsWith(DEVLENS_PREFIX)),
    date,
    diff: {
      status: diff.status,
      stat: diff.stat,
      sinceMarker: diff.marker !== null,
    },
  };

  util.writeJson(base + ".json", data);
  fs.writeFileSync(base + ".md", renderMarkdown(data));

  // record the marker so the next checkpoint can diff against this point
  const marker = { headSha: diff.headSha || null, ts, date, unitId };
  util.writeJson(MARKER_FILE, marker);

  console.log(`checkpoint written: ${base}.json`);
  console.log(`                   ${base}.md`);
  if (diff.status.length) {
    console.log(`files changed: ${diff.status.length}`);
  } else {
    console.log("no file changes detected");
  }
}

function latestFile() {
  try {
    const files = fs.readdirSync(CHECKPOINTS_DIR).filter((f) => f.endsWith(".json")).sort();
    return files.length ? path.join(CHECKPOINTS_DIR, files[files.length - 1]) : null;
  } catch {
    return null;
  }
}

function cmdLatest(args) {
  const file = latestFile();
  if (!file) {
    console.log("no checkpoints yet");
    process.exit(args.exit0 ? 0 : 1);
  }
  const data = util.readJson(file);
  if (args.json) console.log(JSON.stringify(data, null, 2));
  else {
    console.log(`[${data.date}] ${data.name} (${data.unitId})`);
    console.log("");
    console.log(data.summary || "(no summary)");
    if (data.concepts && data.concepts.length) console.log("\nconcepts: " + data.concepts.join(", "));
  }
}

function cmdDiff(args) {
  const diff = diffSinceLastMarker();
  if (diff.error) {
    console.error(`error: ${diff.error}`);
    process.exit(1);
  }
  console.log(diff.status.join("\n") || "(no changes)");
  if (diff.stat.length) {
    console.log("");
    console.log(diff.stat.join("\n"));
  }
}

const COMMANDS = {
  write: cmdWrite,
  latest: cmdLatest,
  diff: cmdDiff,
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

if (require.main === module) main();
