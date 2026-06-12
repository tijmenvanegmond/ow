#!/usr/bin/env node
// assemble.js — builds a .ow script from a .owproj manifest
//
// Usage:  node assemble.js <manifest.owproj>
//
// The manifest is a JSON file with this shape:
// {
//   "out": "my-mode.ow",
//   "settings": "settings/my-lobby.ow",        (optional, prepended verbatim)
//   "variables": {
//     "global": { "0": "someVar", "1": "otherVar" },
//     "player": { "0": "playerVar" }
//   },
//   "rules": [
//     "lib/match-control.ow",
//     "lib/movement.ow",
//     "rules/my-custom-rules.ow"
//   ]
// }
//
// Variables from the manifest are merged with any declared in lib files.
// Duplicate variable slot numbers keep the manifest's name.

const fs   = require("fs");
const path = require("path");

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error("Usage: node assemble.js <manifest.owproj>");
  process.exit(1);
}

const base     = path.dirname(path.resolve(manifestPath));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// ── collect variables ────────────────────────────────────────────────────────
const vars = { global: {}, player: {} };

// seed from manifest
for (const [scope, entries] of Object.entries(manifest.variables || {})) {
  for (const [slot, name] of Object.entries(entries)) {
    vars[scope][slot] = name;
  }
}

// ── collect rule text from each source file ──────────────────────────────────
const ruleSections = [];

for (const relPath of manifest.rules) {
  const fullPath = path.resolve(base, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [warn] file not found, skipping: ${relPath}`);
    continue;
  }

  let src = fs.readFileSync(fullPath, "utf8");

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

  // strip leading assembly comment lines (// Assembled from: ...)
  src = src.replace(/^\/\/ Assembled from:.*\n/m, "");

  const trimmed = src.trim();
  if (trimmed) {
    ruleSections.push(`// ── ${relPath} ${"─".repeat(Math.max(0, 60 - relPath.length))}\n${trimmed}`);
  }
}

// ── build variables block ────────────────────────────────────────────────────
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

// ── write output ─────────────────────────────────────────────────────────────
const sources  = manifest.rules.join(", ");
const header   = `// Assembled from: ${sources}\n// DO NOT EDIT — edit the source files and re-run assemble.js\n`;

let settingsBlock = "";
if (manifest.settings) {
  const settingsPath = path.resolve(base, manifest.settings);
  if (fs.existsSync(settingsPath)) {
    settingsBlock = fs.readFileSync(settingsPath, "utf8").trim();
  } else {
    console.warn(`  [warn] settings file not found, skipping: ${manifest.settings}`);
  }
}

const varBlock = buildVarsBlock(vars);
const body     = ruleSections.join("\n\n");
const output   = [header, settingsBlock, varBlock, body].filter(Boolean).join("\n\n");

const outPath  = path.resolve(base, manifest.out);
fs.writeFileSync(outPath, output, "utf8");
console.log(`✓  wrote ${manifest.out}  (${output.length} chars)`);
