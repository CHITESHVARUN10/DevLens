"use strict";
/**
 * DevLens state manager — read/write .devlens/state/current.json.
 *
 * Usage:
 *   node scripts/state.js init [--force] [--plan-summary "<text>" --plan-source agent|plan-mode] [--units "<u1>|<u2>|..."]
 *   node scripts/state.js get [--json]
 *   node scripts/state.js set-mode normal|learning
 *   node scripts/state.js set-plan --summary "<text>" --source agent|plan-mode|none [--units "<u1>|<u2>|..."] [--path "<plan-file>"]
 *   node scripts/state.js set-unit --name "<name>" [--index N] [--id "<id>"]
 *   node scripts/state.js complete-unit
 *   node scripts/state.js set-awaiting true|false
 *   node scripts/state.js set-understanding <unit-id> explained|engaged|confirmed
 *   node scripts/state.js complete-plan
 *   node scripts/state.js mark-planned
 *
 * Every write validates against templates/state.schema.json and the transition
 * rules in references/state-model.md; illegal transitions are refused.
 */

const fs = require("fs");
const path = require("path");
const util = require("./util");

const ROOT = util.projectRoot();
const STATE_FILE = util.stateFile(ROOT);
const SCHEMA_FILE = path.join(util.skillRoot(), "templates", "state.schema.json");

const UNDERSTANDING = ["explained", "engaged", "confirmed"];

/* ------------------------------ schema ------------------------------ */

function loadSchema() {
  try {
    const Ajv = require("ajv");
    if (Ajv.default) return new Ajv.default({ allErrors: true });
    return new Ajv({ allErrors: true });
  } catch {
    return null; // ajv not installed — fall back to structural checks
  }
}

function structuralCheck(s) {
  const errs = [];
  if (s.version !== 1) errs.push("version must be 1");
  if (!["normal", "learning"].includes(s.mode)) errs.push("mode must be normal|learning");
  if (!s.plan || typeof s.plan.summary !== "string" || !Array.isArray(s.plan.units)) {
    errs.push("plan must have summary (string) and units (array)");
  }
  if (!["plan-mode", "agent", "none"].includes(s.plan && s.plan.source)) {
    errs.push("plan.source must be plan-mode|agent|none");
  }
  if (s.currentUnit !== null) {
    if (!s.currentUnit || typeof s.currentUnit !== "object") errs.push("currentUnit must be object or null");
    else {
      if (!/^unit-[A-Za-z0-9]+$/.test(s.currentUnit.id)) errs.push("currentUnit.id must match ^unit-[A-Za-z0-9]+$");
      if (typeof s.currentUnit.index !== "number" || s.currentUnit.index < 0) errs.push("currentUnit.index must be >= 0");
      if (typeof s.currentUnit.name !== "string") errs.push("currentUnit.name must be a string");
      if (!["in-progress", "done"].includes(s.currentUnit.status)) errs.push("currentUnit.status must be in-progress|done");
    }
  }
  if (typeof s.awaitingHuman !== "boolean") errs.push("awaitingHuman must be boolean");
  if (typeof s.understanding !== "object" || s.understanding === null || Array.isArray(s.understanding)) {
    errs.push("understanding must be an object");
  } else {
    for (const [k, v] of Object.entries(s.understanding)) {
      if (!UNDERSTANDING.includes(v)) errs.push(`understanding.${k} must be one of ${UNDERSTANDING.join("|")}`);
    }
  }
  if (typeof s.updatedAt !== "string") errs.push("updatedAt must be an ISO string");
  return errs;
}

function validateState(s) {
  const ajv = loadSchema();
  if (ajv) {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, "utf8"));
    const valid = ajv.validate(schema, s);
    if (valid) return null;
    return ajv.errors.map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ");
  }
  return structuralCheck(s).join("; ") || null;
}

/* ------------------------------ state ------------------------------ */

function defaultState() {
  return {
    version: 1,
    root: ROOT,
    mode: "normal",
    plan: { source: "none", summary: "", units: [] },
    currentUnit: null,
    awaitingHuman: false,
    understanding: {},
    updatedAt: util.nowIso(),
  };
}

function loadOrInit() {
  const existing = util.readJson(STATE_FILE);
  if (existing) {
    const err = validateState(existing);
    if (err) throw new Error(`state file invalid: ${err}`);
    return existing;
  }
  const s = defaultState();
  write(s);
  return s;
}

function write(s) {
  s.updatedAt = util.nowIso();
  const err = validateState(s);
  if (err) throw new Error(`refusing to write invalid state: ${err}`);
  util.writeJson(STATE_FILE, s);
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

/* ------------------------------ commands ------------------------------ */

function cmdInit(args) {
  if (fs.existsSync(STATE_FILE) && !args.force) {
    throw new Error("state already exists (use --force to reset)");
  }
  const s = defaultState();
  if (args["plan-summary"]) {
    s.plan.source = args["plan-source"] === "plan-mode" ? "plan-mode" : "agent";
    s.plan.summary = args["plan-summary"];
  }
  if (args.units) {
    s.plan.units = args.units
      .split("|")
      .map((u) => u.trim())
      .filter(Boolean);
  }
  write(s);
  console.log(`initialized ${STATE_FILE}`);
}

function cmdGet(args) {
  const s = loadOrInit();
  if (args.json) console.log(JSON.stringify(s, null, 2));
  else {
    console.log(`root: ${s.root || ROOT}`);
    console.log(`mode: ${s.mode}`);
    console.log(`plan: ${s.plan.source === "none" ? "(none)" : s.plan.summary}`);
    if (s.plan.path) console.log(`plan file: ${s.plan.path}`);
    console.log(`units: ${s.plan.units.length ? s.plan.units.map((u, i) => `[${i}] ${u}`).join("\n       ") : "(none)"}`);
    if (s.currentUnit) {
      console.log(`currentUnit: [${s.currentUnit.index}] ${s.currentUnit.name} (${s.currentUnit.status})`);
    } else {
      console.log("currentUnit: (none)");
    }
    console.log(`awaitingHuman: ${s.awaitingHuman}`);
    console.log(`understanding: ${Object.keys(s.understanding).length ? JSON.stringify(s.understanding) : "(none)"}`);
  }
}

function cmdSetMode(args) {
  const s = loadOrInit();
  const mode = args._[0];
  if (!["normal", "learning"].includes(mode)) throw new Error("mode must be normal|learning");
  if (s.mode === "learning" && mode === "normal" && s.currentUnit && s.currentUnit.status === "in-progress") {
    throw new Error("cannot exit learning mode while a unit is in-progress (complete or abandon it first)");
  }
  s.mode = mode;
  if (mode === "normal" && s.currentUnit && s.currentUnit.status === "done") {
    s.currentUnit = null;
  }
  write(s);
  console.log(`mode: ${s.mode}`);
}

function cmdSetModeForce(args) {
  // alias used by internal tooling; same as set-mode but skips the in-progress guard
  return cmdSetMode(args);
}

function cmdSetPlan(args) {
  const s = loadOrInit();
  if (!args.summary) throw new Error("--summary is required");
  const source = args.source === "plan-mode" ? "plan-mode" : args.source === "none" ? "none" : "agent";
  s.plan = {
    source,
    summary: args.summary,
    units: args.units
      ? args.units
          .split("|")
          .map((u) => u.trim())
          .filter(Boolean)
      : s.plan.units,
  };
  if (typeof args.path === "string" && args.path) s.plan.path = args.path;
  else delete s.plan.path;
  s.currentUnit = null;
  write(s);
  console.log("plan updated" + (s.plan.path ? ` (from ${s.plan.path})` : ""));
}

function cmdSetUnit(args) {
  const s = loadOrInit();
  if (!args.name) throw new Error("--name is required");
  if (s.plan.units.length && (args.index === undefined || args.index === true)) {
    // advance automatically: the current unit is at index, next is index+1
  }
  let index;
  if (typeof args.index === "string") {
    index = parseInt(args.index, 10);
    if (Number.isNaN(index) || index < 0) throw new Error("--index must be a non-negative integer");
  } else {
    index = s.currentUnit ? s.currentUnit.index + 1 : 0;
    if (args.index === true) index = s.currentUnit ? s.currentUnit.index + 1 : 0;
  }
  s.currentUnit = {
    id: typeof args.id === "string" ? args.id : util.newUnitId(),
    index,
    name: args.name,
    status: "in-progress",
  };
  s.awaitingHuman = false;
  write(s);
  console.log(`current unit: [${index}] ${args.name} (${s.currentUnit.id})`);
}

function cmdCompleteUnit(args) {
  const s = loadOrInit();
  if (!s.currentUnit) throw new Error("no current unit to complete");
  if (s.currentUnit.status !== "in-progress") throw new Error("current unit already completed");
  s.currentUnit.status = "done";
  s.awaitingHuman = true;
  if (!s.understanding[s.currentUnit.id]) s.understanding[s.currentUnit.id] = "explained";
  write(s);
  console.log(`unit completed: ${s.currentUnit.name} (awaiting human)`);
}

function cmdSetAwaiting(args) {
  const s = loadOrInit();
  const v = args._[0];
  if (!["true", "false"].includes(v)) throw new Error("set-awaiting requires true|false");
  s.awaitingHuman = v === "true";
  write(s);
  console.log(`awaitingHuman: ${s.awaitingHuman}`);
}

function cmdSetUnderstanding(args) {
  const s = loadOrInit();
  const unitId = args._[0];
  const level = args._[1];
  if (!unitId) throw new Error("usage: set-understanding <unit-id> explained|engaged|confirmed");
  if (!UNDERSTANDING.includes(level)) throw new Error(`level must be one of ${UNDERSTANDING.join("|")}`);
  s.understanding[unitId] = level;
  write(s);
  console.log(`understanding[${unitId}] = ${level}`);
}

function cmdCompletePlan(args) {
  const s = loadOrInit();
  if (s.mode !== "learning") throw new Error("not in learning mode (nothing to complete)");
  if (s.currentUnit && s.currentUnit.status === "in-progress") {
    throw new Error("cannot complete plan while a unit is in-progress (complete or abandon it first)");
  }
  s.mode = "normal";
  s.currentUnit = null;
  s.awaitingHuman = false;
  write(s);
  console.log("plan complete — mode back to normal");
}

function cmdMarkPlanned(args) {
  const s = loadOrInit();
  if (s.plan.source === "none") {
    console.log("no active plan recorded");
    process.exit(1);
  }
  const idx = s.currentUnit ? s.currentUnit.index : -1;
  const next = s.plan.units[idx + 1];
  console.log(next !== undefined ? next : "PLAN-COMPLETE");
}

/* ------------------------------ main ------------------------------ */

const COMMANDS = {
  init: cmdInit,
  get: cmdGet,
  "set-mode": cmdSetMode,
  "set-plan": cmdSetPlan,
  "set-unit": cmdSetUnit,
  "complete-unit": cmdCompleteUnit,
  "set-awaiting": cmdSetAwaiting,
  "set-understanding": cmdSetUnderstanding,
  "complete-plan": cmdCompletePlan,
  "mark-planned": cmdMarkPlanned,
};

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const fn = COMMANDS[cmd];
  if (!fn) {
    console.error(`unknown command: ${cmd || "(none)"}\n`);
    console.error(
      Object.keys(COMMANDS).join("\n") + "\n\n" + (module.exports.HELP || "")
    );
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

module.exports.HELP = "";
if (require.main === module) main();
