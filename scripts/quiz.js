"use strict";
/**
 * DevLens quiz bookkeeping — .devlens/quiz/<session>.jsonl audit trail.
 *
 * Usage:
 *   node scripts/quiz.js record --unit <unit-id> --result confirmed|partial|failed --detail "<what was strong/weak>"
 *   node scripts/quiz.js summary [--unit <unit-id>]
 *   node scripts/quiz.js set-confirmed <unit-id>
 *
 * The confirmed transition lives in exactly one place: set-confirmed delegates
 * to state.js set-understanding <unit-id> confirmed.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const util = require("./util");

const ROOT = util.projectRoot();
const QUIZ_DIR = path.join(util.devlensDir(ROOT), "quiz");

function sessionFile() {
  const d = new Date().toISOString().slice(0, 10);
  return path.join(QUIZ_DIR, `${d}.jsonl`);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
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

function readAll() {
  let entries = [];
  let files = [];
  try {
    files = fs.readdirSync(QUIZ_DIR).filter((f) => f.endsWith(".jsonl")).sort();
  } catch {
    return [];
  }
  for (const f of files) {
    const lines = fs.readFileSync(path.join(QUIZ_DIR, f), "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // skip malformed line
      }
    }
  }
  return entries;
}

function cmdRecord(args) {
  const unit = args.unit || args._[0];
  const result = args.result;
  if (!unit) throw new Error("record requires --unit <unit-id>");
  if (!/^unit-[A-Za-z0-9]+$/.test(unit)) throw new Error("--unit must match ^unit-[A-Za-z0-9]+$");
  if (!["confirmed", "partial", "failed"].includes(result)) {
    throw new Error("--result must be confirmed|partial|failed");
  }
  fs.mkdirSync(QUIZ_DIR, { recursive: true });
  const entry = {
    ts: new Date().toISOString(),
    unit,
    result,
    detail: args.detail || "",
  };
  fs.appendFileSync(sessionFile(), JSON.stringify(entry) + "\n");
  console.log(`quiz recorded: ${result} for ${unit}`);
}

function cmdSummary(args) {
  const entries = readAll();
  const unit = args.unit;
  const filtered = unit ? entries.filter((e) => e.unit === unit) : entries;
  if (args.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }
  if (!filtered.length) {
    console.log("no quiz records" + (unit ? ` for ${unit}` : " yet"));
    return;
  }
  const perUnit = {};
  for (const e of filtered) {
    if (!perUnit[e.unit]) perUnit[e.unit] = [];
    perUnit[e.unit].push(e.result);
  }
  for (const [u, results] of Object.entries(perUnit)) {
    const counts = { confirmed: 0, partial: 0, failed: 0 };
    for (const r of results) counts[r]++;
    console.log(`${u}: confirmed=${counts.confirmed} partial=${counts.partial} failed=${counts.failed}`);
  }
}

function cmdSetConfirmed(args) {
  const unit = args._[0];
  if (!unit) throw new Error("usage: quiz set-confirmed <unit-id>");
  try {
    execFileSync(
      process.execPath,
      [path.join(util.skillRoot(), "scripts", "state.js"), "set-understanding", unit, "confirmed"],
      { encoding: "utf8", stdio: "inherit" }
    );
  } catch (err) {
    console.error(`error: could not set confirmed for ${unit}: ${err.message}`);
    process.exit(1);
  }
}

const COMMANDS = {
  record: cmdRecord,
  summary: cmdSummary,
  "set-confirmed": cmdSetConfirmed,
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
