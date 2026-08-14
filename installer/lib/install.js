"use strict";
/**
 * Install helpers — copy the skill tree and wrapper commands into a harness's
 * location. Never deletes anything; overwrites are prompted for upstream.
 */

const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  let copied = 0;
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      copied += copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
      copied++;
    }
  }
  return copied;
}

/** Install the core skill tree into a harness's skill dir. */
function installSkill(skillSrc, skillDest) {
  const n = copyDir(skillSrc, skillDest);
  return { files: n, dest: skillDest };
}

/** Install wrapper commands from an adapter's commands/ dir. */
function installWrappers(wrapperSrc, wrapperDest) {
  const n = copyDir(wrapperSrc, wrapperDest);
  return { files: n, dest: wrapperDest };
}

/** Path exists? */
function exists(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

module.exports = { copyDir, installSkill, installWrappers, exists };
