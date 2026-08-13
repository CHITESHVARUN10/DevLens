"use strict";
/**
 * DevLens bug artifact store — .devlens/bugs/<ts>-<id>.json + .md.
 *
 * Usage:
 *   node scripts/bug.js add --title "<t>" --symptom "<s>" --root-cause "<r>" --fix "<f>" --verification "<v>"
 *       [--hypothesis "<h>"] [--investigation "<i>"] [--lesson "<l>"] [--unit <unit-id>]
 *   node scripts/bug.js list [--json]
 *   node scripts/bug.js get <id|topic> [--json]
 *   node scripts/bug.js latest [--json]
 *
 * IDs are prefixed `bug-`. Required fields enforced.
 */

const fs = require("fs");
const path = require("path");
const util = require("./util");

const ROOT = util.projectRoot();
const BUGS_DIR = path.join(util.devlensDir(ROOT), "bugs");
const TEMPLATE_FILE = path.join(util.skillRoot(), "templates", "bug.md");

function newBugId() {
  return "bug-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function renderMarkdown(data) {
  let template;
  try {
    template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  } catch {
    template =
      "# Bug: {title}\n\n- **Bug ID:** {bugId}\n- **Date:** {date}\n\n## Symptom\n\n{symptom}\n\n## Root cause\n\n{rootCause}\n\n## Fix\n\n{fix}\n\n## Verification\n\n{verification}\n\n## Lesson\n\n{lesson}\n\n## Linked unit\n\n{unit}\n";
  }
  return template
    .replace(/\{title\}/g, data.title)
    .replace(/\{bugId\}/g, data.bugId)
    .replace(/\{date\}/g, data.date)
    .replace(/\{symptom\}/g, data.symptom || "")
    .replace(/\{hypothesis\}/g, data.hypothesis || "")
    .replace(/\{investigation\}/g, data.investigation || "")
    .replace(/\{rootCause\}/g, data.rootCause || "")
    .replace(/\{fix\}/g, data.fix || "")
    .replace(/\{verification\}/g, data.verification || "")
    .replace(/\{lesson\}/g, data.lesson || "")
    .replace(/\{unit\}/g, data.unit || "_None._");
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

function allBugs() {
  let files = [];
  try {
    files = fs.readdirSync(BUGS_DIR).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  return files.map((f) => util.readJson(path.join(BUGS_DIR, f))).filter(Boolean);
}

function cmdAdd(args) {
  const title = args.title || args._[0];
  const symptom = args.symptom;
  const rootCause = args.rootCause;
  const fix = args.fix;
  const verification = args.verification;
  if (!title || !symptom || !rootCause || !fix || !verification) {
    throw new Error("add requires --title, --symptom, --root-cause, --fix, --verification");
  }
  // link to the active unit from state, unless --unit overrides
  let unit = args.unit || null;
  if (!unit) {
    const state = util.readJson(util.stateFile(ROOT));
    if (state && state.currentUnit && state.currentUnit.status === "in-progress") {
      unit = state.currentUnit.id;
    }
  }
  if (unit && !/^unit-[A-Za-z0-9]+$/.test(unit)) throw new Error("--unit must match ^unit-[A-Za-z0-9]+$");

  fs.mkdirSync(BUGS_DIR, { recursive: true });
  const bugId = newBugId();
  const ts = util.fsTimestamp();
  const base = path.join(BUGS_DIR, `${ts}-${bugId}`);
  const data = {
    bugId,
    title,
    symptom,
    hypothesis: args.hypothesis || "",
    investigation: args.investigation || "",
    rootCause,
    fix,
    verification,
    lesson: args.lesson || "",
    unit,
    date: new Date().toISOString(),
  };

  util.writeJson(base + ".json", data);
  fs.writeFileSync(base + ".md", renderMarkdown(data));
  console.log(`bug recorded: ${base}.json`);
  console.log(`              ${base}.md`);
}

function cmdList(args) {
  const bugs = allBugs();
  if (!bugs.length) {
    console.log("no bugs recorded this session");
    process.exit(args.exit0 ? 0 : 1);
  }
  if (args.json) {
    console.log(JSON.stringify(bugs.map((b) => ({ bugId: b.bugId, title: b.title, rootCause: b.rootCause, date: b.date })), null, 2));
    return;
  }
  for (const b of bugs) {
    console.log(`[${b.bugId}] ${b.title}`);
    console.log(`    root cause: ${b.rootCause}`);
  }
}

function cmdGet(args) {
  const topic = args._[0];
  if (!topic) throw new Error("usage: bug get <id|topic>");
  const bugs = allBugs();
  const match =
    bugs.find((b) => b.bugId === topic) ||
    bugs.find((b) => b.title.toLowerCase().includes(topic.toLowerCase())) ||
    bugs.find((b) => (b.symptom || "").toLowerCase().includes(topic.toLowerCase()));
  if (!match) {
    console.log(`no bug matching "${topic}"`);
    process.exit(1);
  }
  if (args.json) {
    console.log(JSON.stringify(match, null, 2));
    return;
  }
  console.log(`[${match.bugId}] ${match.title}`);
  console.log("");
  console.log(`SYMPTOM:   ${match.symptom}`);
  if (match.hypothesis) console.log(`HYPOTHESIS: ${match.hypothesis}`);
  if (match.investigation) console.log(`INVEST:    ${match.investigation}`);
  console.log(`ROOT CAUSE: ${match.rootCause}`);
  console.log(`FIX:       ${match.fix}`);
  console.log(`VERIFY:    ${match.verification}`);
  if (match.lesson) console.log(`LESSON:    ${match.lesson}`);
  if (match.unit) console.log(`UNIT:      ${match.unit}`);
  console.log(`DATE:      ${match.date}`);
}

function cmdLatest(args) {
  const bugs = allBugs();
  if (!bugs.length) {
    console.log("no bugs recorded this session");
    process.exit(args.exit0 ? 0 : 1);
  }
  const latest = bugs[bugs.length - 1];
  if (args.json) {
    console.log(JSON.stringify(latest, null, 2));
    return;
  }
  cmdGet({ _: [latest.bugId], json: false });
}

const COMMANDS = {
  add: cmdAdd,
  list: cmdList,
  get: cmdGet,
  latest: cmdLatest,
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
