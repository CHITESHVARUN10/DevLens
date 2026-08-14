"use strict";
/**
 * Tiny interactive prompt helpers on plain readline — no dependencies.
 *
 * Two modes:
 *  - TTY: prompts interactively (readline.question on stdout).
 *  - Piped: cli.js calls readAllLines() at startup to buffer every line of
 *    stdin to EOF, then ask() serves the answers FIFO. A script pipes one
 *    answer per line: printf 'all\nall\ny\n' | cli.js
 */

const readline = require("readline");

let pipedLines = null;
let pipedIndex = 0;
let pipedWaiters = [];

function isTTY() {
  return Boolean(process.stdin.isTTY);
}

/** Read every line of stdin to EOF (piped mode only). Returns array. */
function readAllLines() {
  if (pipedLines !== null) return pipedLines;
  pipedLines = [];
  pipedIndex = 0;
  const rl = readline.createInterface({ input: process.stdin });
  return new Promise((resolve) => {
    rl.on("line", (l) => {
      pipedLines.push(l.trim());
      // wake any waiter (next queued ask)
      while (pipedWaiters.length) pipedWaiters.shift()();
    });
    rl.on("close", () => resolve(pipedLines));
  });
}

/** In piped mode, wait until a line is available (or EOF default). */
function nextPiped(defaultValue) {
  if (pipedIndex < pipedLines.length) return Promise.resolve(pipedLines[pipedIndex++]);
  if (pipedLines.length === 0 && pipedIndex === 0 && pipedWaiters.length === 0) {
    // stream not yet closed — wait for a line
    return new Promise((resolve) => pipedWaiters.push(() => resolve(pipedLines[pipedIndex++])));
  }
  return Promise.resolve(defaultValue !== undefined ? defaultValue : "");
}

/**
 * Ask one question.
 */
async function ask(question, { defaultValue } = {}) {
  if (!isTTY()) {
    // ensure buffer is primed (readAllLines called at startup)
    if (pipedLines === null) await readAllLines();
    const a = await nextPiped(defaultValue);
    if (a === "" && defaultValue !== undefined) return defaultValue;
    return a;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue !== undefined ? ` [${defaultValue}]` : "";
  const answer = await new Promise((resolve) =>
    rl.question(`${question}${suffix} `, (a) => {
      rl.close();
      resolve(a.trim() === "" && defaultValue !== undefined ? defaultValue : a.trim());
    })
  );
  return answer;
}

/**
 * Checkbox multi-select. `items` = [{value, label}].
 * The user answers with a comma-separated list of numbers (e.g. "1,3").
 */
async function multiSelect(title, items, { atLeastOne = true } = {}) {
  console.log(`\n${title}`);
  items.forEach((it, i) => console.log(`  ${i + 1}. ${it.label}`));
  for (;;) {
    const raw = await ask("Select (comma-separated numbers, or 'all'):");
    const sel = new Set();
    let ok = true;
    if (raw.toLowerCase() === "all") {
      items.forEach((_, i) => sel.add(i));
    } else {
      for (const part of raw.split(",")) {
        const n = parseInt(part.trim(), 10);
        if (!Number.isInteger(n) || n < 1 || n > items.length) {
          ok = false;
          break;
        }
        sel.add(n - 1);
      }
    }
    if (ok && (sel.size > 0 || !atLeastOne)) {
      return items.filter((_, i) => sel.has(i));
    }
    console.log("  Invalid selection — try again.\n");
  }
}

function confirm(question) {
  return ask(question, { defaultValue: "y" }).then((a) => /^y(es)?$/i.test(a));
}

module.exports = { ask, multiSelect, confirm, readAllLines };
