# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Overwatch Workshop game modes written in Workshop script (`.ow` files). There is no compiler, linter, or test suite — scripts are validated by pasting them into the in-game Overwatch Workshop editor. Node.js is used only for the assembly script.

## Build

Some game modes are assembled from reusable rule snippets via a manifest:

```
node assemble.js <manifest.owproj>     # e.g. node assemble.js rein-and-weave.owproj
```

A `.owproj` manifest is JSON listing the output file, variable slot declarations, and the source `.ow` files (from `lib/` and `rules/`) to concatenate. `assemble.js` merges all `variables` blocks into one (manifest wins on slot conflicts) and stitches the rules together.

**Never edit an assembled `.ow` file directly** — they start with a `// Assembled from: ... DO NOT EDIT` header (e.g. `rein-and-weave.ow`, `hello.ow`). Edit the sources in `lib/` or `rules/` and re-run `assemble.js`. Files without that header (`genjiball.ow`, `brigbonk.ow`, `stadium-try.ow`) are standalone hand-written scripts and are edited directly.

## Layout

- `lib/` — standalone reusable rule snippets (match control, movement, UI, effects, respawn, scoring); see `lib/README.md` for the rule inventory
- `rules/` — mode-specific rule files consumed by manifests
- `*.owproj` — assembly manifests
- `*.ow` (root) — final scripts, either assembled or standalone
- `.github/copilot-instructions.md` — detailed Workshop script reference (rule anatomy, events, physics patterns); read it before substantial script work

## Workshop script conventions

Key points from `.github/copilot-instructions.md`:

- A script is a `variables` block (numbered global/player slots, CamelCase names) followed by `rule(...)` blocks: `event` / optional `conditions` / `actions`. Indentation is tabs.
- **Rule order matters** — later rules depend on initialization rules having run first. Preserve ordering when editing.
- File organization: variable declarations, then settings rules, then initialization (per-map and per-player), then feature sections grouped by domain (HUD, game logic, controls, physics).
- Continuous loops use `Wait(<seconds>, Ignore Condition); Loop If Condition Is True;` — `Wait(0.016, ...)` is ~1 frame for physics precision.
- Prefer `Chase Global Variable At Rate(...)` over instant assignment for smooth value changes; use subroutines for repeated logic.
- Configurable knobs come from `Workshop Setting Integer/Toggle/Combo(...)`. Optional features ship as `disabled rule(...)` with a comment explaining what enabling them does.
- Map-specific values (bounds, centers, water level) each get their own initialization rule conditioned on `Current Map == Map(<Name>)`; test physics/boundary changes on every supported map.
