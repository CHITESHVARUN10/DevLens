#!/usr/bin/env node
"use strict";
/**
 * DevLens installer — interactive harness + component install.
 *
 * Usage: npx devlens-installer
 *
 * No shell scripts, no hidden writes. The user picks which harness(es) and
 * which components to install, reviews the exact copy plan, then confirms.
 * Nothing is ever deleted; re-running is safe (prompts on existing files).
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const { HARNESSES, BUNDLE_DIR, ADAPTERS_DIR, hasWrappers } = require("./lib/harnesses");
const { installSkill, installWrappers, exists } = require("./lib/install");
const { multiSelect, confirm, readAllLines } = require("./lib/prompts");

const SKILL_DIR = path.join(BUNDLE_DIR, "devlens");

function requireSkillBundle() {
  if (!exists(SKILL_DIR)) {
    console.error("DevLens skill bundle not found at " + SKILL_DIR);
    console.error("Run `npm run build` in the installer directory first, or install from the published package.");
    process.exit(1);
  }
}

async function main() {
  const harnessOptions = HARNESSES.map((h) => ({
    value: h.id,
    label: `${h.label} — ${h.home}${h.supported ? "" : " (adapter pending)"}`,
  }));

  console.log("DevLens installer — AI builds. Human understands.\n");
  requireSkillBundle();

  // piped mode: buffer all stdin answers up front (await so no race)
  if (!process.stdin.isTTY) await readAllLines();

  const selected = await multiSelect("Which harness(es) do you use?", harnessOptions);
  const chosen = selected.map((s) => HARNESSES.find((h) => h.id === s.value));

  // component selection per harness
  const plan = [];
  for (const h of chosen) {
    const comps = await multiSelect(
      `Components for ${h.label}:`,
      [
        { value: "skill", label: "Core skill (SKILL.md + commands + references + scripts + templates)" },
        ...(hasWrappers(h.id) ? [{ value: "wrappers", label: "Wrapper commands (short aliases: /learn, /ask, ...)" }] : []),
      ]
    );
    plan.push({ harness: h, skill: comps.some((c) => c.value === "skill"), wrappers: comps.some((c) => c.value === "wrappers") });
  }

  // review step
  console.log("\n=== INSTALL PLAN ===");
  for (const p of plan) {
    console.log(`${p.harness.label} (${p.harness.home}):`);
    if (p.skill) console.log(`  + core skill        -> ${p.harness.skillDir}`);
    if (p.wrappers) console.log(`  + wrapper commands  -> ${p.harness.wrapperDir}`);
  }

  const ok = await confirm("\nProceed?");
  if (!ok) {
    console.log("Cancelled — nothing was installed.");
    return;
  }

  // install
  for (const p of plan) {
    if (p.skill) {
      const r = installSkill(SKILL_DIR, p.harness.skillDir);
      console.log(`✓ ${p.harness.label}: skill installed (${r.files} files) -> ${r.dest}`);
    }
    if (p.wrappers) {
      const src = path.join(ADAPTERS_DIR, p.harness.id, "commands");
      const r = installWrappers(src, p.harness.wrapperDir);
      console.log(`✓ ${p.harness.label}: wrappers installed (${r.files} files) -> ${r.dest}`);
    }
  }

  // verify
  console.log("");
  for (const p of plan) {
    const v = p.harness.verify;
    if (v) {
      try {
        execFileSync(v[0], v.slice(1), { stdio: "ignore" });
        console.log(`✓ ${p.harness.label}: verify passed (${v.join(" ")})`);
      } catch {
        console.log(`⚠ ${p.harness.label}: verify command unavailable (${v.join(" ")}) — check manually.`);
      }
    } else {
      console.log(`✓ ${p.harness.label}: installed. Verify in your harness's skills menu.`);
    }
  }

  console.log("\nDone. Open a new session and try /devlens tour");
}

main();
