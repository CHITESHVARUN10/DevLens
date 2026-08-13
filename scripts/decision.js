"use strict";
/**
 * DevLens decision artifact store — .devlens/decisions/<ts>-<id>.json + .md.
 *
 * Usage:
 *   node scripts/decision.js add --title "<t>" --what "<chosen>" --why "<reason>"
 *       [--alternatives "a1,a2"] [--consequences "<text>"] [--unit <unit-id>]
 *   node scripts/decision.js list [--json]
 *   node scripts/decision.js get <id|topic-substring>
 *
 * IDs are prefixed `dec-`. Required fields enforced.
 */

const fs = require("fs");
const path = require("path");
const util = require("./util");

const ROOT = util.projectRoot();
const DECISIONS_DIR = path.join(util.devlensDir(ROOT), "decisions");
const TEMPLATE_FILE = path.join(util.skillRoot(), "templates", "decision.md");

function newDecisionId() {
  return "dec-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function renderMarkdown(data) {
  let template;
  try {
    template = fs.readFileSync(TEMPLATE_FILE, "utf8");
  } catch {
    template =
      "# Decision: {title}\n\n- **Decision ID:** {decisionId}\n- **Date:** {date}\n\n## What\n\n{what}\n\n## Why\n\n{why}\n\n## Alternatives considered\n\n{alternatives}\n\n## Consequences\n\n{consequences}\n\n## Linked unit\n\n{unit}\n";
  }
  const alternatives = data.alternatives && data.alternatives.length ? data.alternatives.map((a) => "- " + a).join("\n") : "_None recorded._";
  const unit = data.unit || "_None._";
  return template
    .replace(/\{title\}/g, data.title)
    .replace(/\{decisionId\}/g, data.decisionId)
    .replace(/\{date\}/g, data.date)
    .replace(/\{what\}/g, data.what || "")
    .replace(/\{why\}/g, data.why || "")
    .replace(/\{alternatives\}/g, alternatives)
    .replace(/\{consequences\}/g, data.consequences || "")
    .replace(/\{unit\}/g, unit);
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

function allDecisions() {
  let files = [];
  try {
    files = fs.readdirSync(DECISIONS_DIR).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  return files.map((f) => util.readJson(path.join(DECISIONS_DIR, f))).filter(Boolean);
}

function cmdAdd(args) {
  const title = args.title || args._[0];
  const what = args.what;
  const why = args.why;
  if (!title || !what || !why) {
    throw new Error("add requires --title, --what, --why");
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

  fs.mkdirSync(DECISIONS_DIR, { recursive: true });
  const decisionId = newDecisionId();
  const ts = util.fsTimestamp();
  const base = path.join(DECISIONS_DIR, `${ts}-${decisionId}`);
  const data = {
    decisionId,
    title,
    what,
    why,
    alternatives: args.alternatives ? args.alternatives.split(",").map((a) => a.trim()).filter(Boolean) : [],
    consequences: args.consequences || "",
    unit,
    date: new Date().toISOString(),
  };

  util.writeJson(base + ".json", data);
  fs.writeFileSync(base + ".md", renderMarkdown(data));
  console.log(`decision recorded: ${base}.json`);
  console.log(`                   ${base}.md`);
}

function cmdList(args) {
  const decisions = allDecisions();
  if (!decisions.length) {
    console.log("no decisions recorded yet");
    process.exit(args.exit0 ? 0 : 1);
  }
  if (args.json) {
    console.log(JSON.stringify(decisions.map((d) => ({ decisionId: d.decisionId, title: d.title, why: d.why, date: d.date })), null, 2));
    return;
  }
  for (const d of decisions) {
    console.log(`[${d.decisionId}] ${d.title}`);
    console.log(`    why: ${d.why}`);
  }
}

function cmdGet(args) {
  const topic = args._[0];
  if (!topic) throw new Error("usage: decision get <id|topic>");
  const decisions = allDecisions();
  const match =
    decisions.find((d) => d.decisionId === topic) ||
    decisions.find((d) => d.title.toLowerCase().includes(topic.toLowerCase())) ||
    decisions.find((d) => (d.what || "").toLowerCase().includes(topic.toLowerCase()));
  if (!match) {
    console.log(`no decision matching "${topic}"`);
    process.exit(1);
  }
  if (args.json) {
    console.log(JSON.stringify(match, null, 2));
    return;
  }
  console.log(`[${match.decisionId}] ${match.title}`);
  console.log("");
  console.log(`WHAT:  ${match.what}`);
  console.log(`WHY:   ${match.why}`);
  if (match.alternatives && match.alternatives.length) {
    console.log(`ALT:   ${match.alternatives.join(" | ")}`);
  }
  if (match.consequences) {
    console.log(`CONSEQ: ${match.consequences}`);
  }
  if (match.unit) {
    console.log(`UNIT:  ${match.unit}`);
  }
  console.log(`DATE:  ${match.date}`);
}

const COMMANDS = {
  add: cmdAdd,
  list: cmdList,
  get: cmdGet,
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
