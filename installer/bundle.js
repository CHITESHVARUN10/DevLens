"use strict";
/**
 * Stage the DevLens skill tree + adapters into installer/bundle/ so the npm
 * package is fully self-contained. Run before publishing: npm run build.
 *
 * Produces:
 *   bundle/devlens/    — the core skill (SKILL.md, commands/, references/, scripts/, templates/)
 *   bundle/adapters/   — per-harness extras (wrappers, README, ...)
 *
 * Excludes dev artifacts (.devlens/, .git/, README, the installer itself).
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const BUNDLE = path.join(__dirname, "bundle");
const CORE = ["SKILL.md", "commands", "references", "scripts", "templates"];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  let n = 0;
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else {
      fs.copyFileSync(s, d);
      n++;
    }
  }
  return n;
}

fs.rmSync(BUNDLE, { recursive: true, force: true });
let total = 0;

// 1. core skill
for (const item of CORE) {
  const src = path.join(REPO_ROOT, item);
  if (!fs.existsSync(src)) {
    console.error(`missing: ${src}`);
    process.exit(1);
  }
  if (fs.statSync(src).isDirectory()) {
    total += copyDir(src, path.join(BUNDLE, "devlens", item));
  } else {
    fs.mkdirSync(path.join(BUNDLE, "devlens"), { recursive: true });
    fs.copyFileSync(src, path.join(BUNDLE, "devlens", item));
    total++;
  }
}

// 2. adapters
const adaptersSrc = path.join(REPO_ROOT, "adapters");
if (fs.existsSync(adaptersSrc)) {
  total += copyDir(adaptersSrc, path.join(BUNDLE, "adapters"));
}

console.log(`bundled ${total} files into ${BUNDLE}`);
