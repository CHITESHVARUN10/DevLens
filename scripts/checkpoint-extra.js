"use strict";
/**
 * DevLens manual checkpoint — user-triggered understanding save.
 *
 * Usage:
 *   node scripts/checkpoint-extra.js save --name "<n>" --notes "<notes>" [--area "<area>"]
 *   node scripts/checkpoint-extra.js list-manual [--json]
 *
 * Creates ONE artifact: .devlens/checkpoints/<ts>-manual-<id>.json with
 * "kind": "manual". Distinct from the automatic /learn checkpoint: does NOT
 * touch the diff marker (that belongs to the learning loop only), and carries
 * user notes instead of a diff-verified file list.
 */

const fs = require("fs");
const path = require("path");
const util = require("./util");

const ROOT = util.projectRoot();
const CHECKPOINTS_DIR = util.checkpointsDir(ROOT);

function newManualId() {
  return "manual-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
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

function cmdSave(args) {
  const name = args.name;
  const notes = args.notes;
  if (!name || !notes) throw new Error("save requires --name and --notes");

  fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true });
  const id = newManualId();
  const ts = util.fsTimestamp();
  const base = path.join(CHECKPOINTS_DIR, `${ts}-${id}`);
  const data = {
    id,
    name,
    kind: "manual",
    notes,
    area: args.area || "",
    flow: args.flow || "",
    concepts: args.concepts ? args.concepts.split(",").map((c) => c.trim()).filter(Boolean) : [],
    files: [],
    date: new Date().toISOString(),
  };

  util.writeJson(base + ".json", data);
  console.log(`manual checkpoint saved: ${base}.json`);
}

function cmdListManual(args) {
  let files = [];
  try {
    files = fs.readdirSync(CHECKPOINTS_DIR).filter((f) => f.endsWith(".json") && f.includes("-manual-")).sort();
  } catch {
    files = [];
  }
  const entries = files
    .map((f) => {
      const d = util.readJson(path.join(CHECKPOINTS_DIR, f));
      return d && d.kind === "manual" ? d : null;
    })
    .filter(Boolean);
  if (args.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }
  if (!entries.length) {
    console.log("no manual checkpoints yet");
    return;
  }
  for (const e of entries) {
    console.log(`[${e.date.slice(0, 10)}] ${e.name} (${e.id})${e.area ? " — area: " + e.area : ""}`);
  }
}

const COMMANDS = {
  save: cmdSave,
  "list-manual": cmdListManual,
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
