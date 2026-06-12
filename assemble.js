#!/usr/bin/env node
// assemble.js — builds a .ow script from a .owproj manifest
//
// Usage:  node assemble.js <manifest.owproj>
//
// The manifest is a JSON file with this shape:
// {
//   "out": "my-mode.ow",
//   "settings": "settings/my-lobby.ow",     (optional lobby settings block,
//                                            prepended verbatim)
//   "variables": {
//     "global": { "0": "someVar", "1": "otherVar" },
//     "player": { "0": "playerVar" }
//   },
//   "subroutines": { "0": "MyRoutine" },
//   "rules": [
//     "lib/match-control.ow",
//     "rules/my-custom-rules.ow",
//     "imports/SHARECODE-some-mode.ow"
//   ]
// }
//
// variables/subroutines blocks in source files are harvested and merged into
// single blocks; duplicate slot numbers keep the manifest's name. If a source
// file starts with a settings block (a full lobby copy pasted from the game),
// that block is used when the manifest doesn't name a settings file, and
// dropped otherwise.

const fs   = require("fs");
const path = require("path");

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error("Usage: node assemble.js <manifest.owproj>");
  process.exit(1);
}

const base     = path.dirname(path.resolve(manifestPath));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// ── collect variables & subroutines ──────────────────────────────────────────
const vars = { global: {}, player: {} };
const subs = {};

// seed from manifest (manifest wins on slot conflicts)
for (const [scope, entries] of Object.entries(manifest.variables || {})) {
  for (const [slot, name] of Object.entries(entries)) {
    vars[scope][slot] = name;
  }
}
for (const [slot, name] of Object.entries(manifest.subroutines || {})) {
  subs[slot] = name;
}

// ── helpers ──────────────────────────────────────────────────────────────────
// If `src` starts with `keyword { ... }` (brace-balanced), return
// [block, remainder]; otherwise [null, src]. Needed for settings blocks,
// which nest braces.
function extractLeadingBlock(src, keyword) {
  const trimmed = src.trimStart();
  if (!trimmed.startsWith(keyword)) return [null, src];
  const offset     = src.length - trimmed.length;
  const braceStart = src.indexOf("{", offset + keyword.length);
  if (braceStart === -1) return [null, src];
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) {
      return [src.slice(offset, i + 1), src.slice(i + 1)];
    }
  }
  return [null, src];
}

// ── collect rule text from each source file ──────────────────────────────────
const ruleSections = [];
let harvestedSettings = "";

for (const relPath of manifest.rules) {
  const fullPath = path.resolve(base, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [warn] file not found, skipping: ${relPath}`);
    continue;
  }

  let src = fs.readFileSync(fullPath, "utf8");

  // full lobby copies start with a settings block — harvest the first one
  const [settingsBlock, rest] = extractLeadingBlock(src, "settings");
  if (settingsBlock) {
    if (!harvestedSettings) harvestedSettings = settingsBlock;
    src = rest;
  }

  // strip variable blocks and harvest their declarations
  src = src.replace(/variables\s*\{([\s\S]*?)\}/g, (_match, body) => {
    let scope = null;
    for (const line of body.split("\n")) {
      const scopeMatch = line.match(/^\s*(global|player)\s*:/i);
      if (scopeMatch) { scope = scopeMatch[1].toLowerCase(); continue; }
      const varMatch = line.match(/^\s*(\d+)\s*:\s*(\w+)/);
      if (varMatch && scope) {
        const [, slot, name] = varMatch;
        if (!vars[scope][slot]) vars[scope][slot] = name;  // manifest wins on conflict
      }
    }
    return "";
  });

  // strip subroutine blocks and harvest their declarations
  src = src.replace(/subroutines\s*\{([\s\S]*?)\}/g, (_match, body) => {
    for (const line of body.split("\n")) {
      const subMatch = line.match(/^\s*(\d+)\s*:\s*(\w+)/);
      if (subMatch && !subs[subMatch[1]]) subs[subMatch[1]] = subMatch[2];
    }
    return "";
  });

  // strip leading assembly comment lines (// Assembled from: ...)
  src = src.replace(/^\/\/ Assembled from:.*\n/m, "");

  const trimmed = src.trim();
  if (trimmed) {
    ruleSections.push(`// ── ${relPath} ${"─".repeat(Math.max(0, 60 - relPath.length))}\n${trimmed}`);
  }
}

// ── build declaration blocks ─────────────────────────────────────────────────
function buildVarsBlock(vars) {
  const lines = ["variables", "{"];
  for (const scope of ["global", "player"]) {
    const entries = Object.entries(vars[scope]);
    if (!entries.length) continue;
    lines.push(`\t${scope}:`);
    entries.sort((a, b) => Number(a[0]) - Number(b[0]));
    for (const [slot, name] of entries) {
      lines.push(`\t\t${slot}: ${name}`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

function buildSubsBlock(subs) {
  const entries = Object.entries(subs);
  if (!entries.length) return "";
  entries.sort((a, b) => Number(a[0]) - Number(b[0]));
  const lines = ["subroutines", "{"];
  for (const [slot, name] of entries) {
    lines.push(`\t${slot}: ${name}`);
  }
  lines.push("}");
  return lines.join("\n");
}

// ── resolve settings ─────────────────────────────────────────────────────────
let settingsBlock = "";
if (manifest.settings) {
  const settingsPath = path.resolve(base, manifest.settings);
  if (fs.existsSync(settingsPath)) {
    settingsBlock = fs.readFileSync(settingsPath, "utf8").trim();
  } else {
    console.warn(`  [warn] settings file not found, skipping: ${manifest.settings}`);
  }
}
if (!settingsBlock) settingsBlock = harvestedSettings;

// ── write output ─────────────────────────────────────────────────────────────
const sources  = manifest.rules.join(", ");
const header   = `// Assembled from: ${sources}\n// DO NOT EDIT — edit the source files and re-run assemble.js\n`;
const varBlock = buildVarsBlock(vars);
const subBlock = buildSubsBlock(subs);
const body     = ruleSections.join("\n\n");
const output   = [header, settingsBlock, varBlock, subBlock, body].filter(Boolean).join("\n\n");

const outPath  = path.resolve(base, manifest.out);
fs.writeFileSync(outPath, output, "utf8");
console.log(`✓  wrote ${manifest.out}  (${output.length} chars)`);
