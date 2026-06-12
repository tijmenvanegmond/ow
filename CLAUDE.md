# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Overwatch Workshop game modes written in Workshop script (`.ow` files). There is no compiler, linter, or test suite — scripts are validated by pasting them into the in-game Overwatch custom game lobby. Node.js is used only for the assembly script.

## Build

Every mode is assembled from sources via a manifest:

```
node assemble.js <manifest.owproj>     # e.g. node assemble.js stadium-extended.owproj
```

Manifests exist for all modes: `hello`, `rein-and-weave`, `stadium-extended`, `jpc-racing`, `genjiball`. To rebuild everything: `for m in *.owproj; do node assemble.js $m; done` (bash).

A `.owproj` manifest is JSON: `out` (output file), optional `settings` (lobby settings file, prepended verbatim), optional `variables`/`subroutines` seed declarations, and `rules` (ordered list of source `.ow` files). `assemble.js` merges all `variables` and `subroutines` blocks found in sources into single declaration blocks (manifest wins on slot conflicts) and concatenates the rules. If a source file starts with a `settings` block (a full lobby copy), it is harvested as a fallback when the manifest names no settings file.

**Never edit an assembled `.ow` file directly** — root `.ow` files start with a `// Assembled from: ... DO NOT EDIT` header. Edit the sources and re-run `assemble.js`. The one exception is `brigbonk.ow`, which is still a standalone hand-written script.

## Layout

- `lib/` — standalone reusable rule snippets (match control, movement, UI, effects, respawn, scoring); see `lib/README.md` for the rule inventory
- `rules/` — mode-specific rule files consumed by manifests
- `settings/` — per-mode lobby settings blocks (`settings { lobby/modes/heroes ... }`), extracted from in-game lobby copies; referenced by the manifest's `settings` key
- `imports/` — raw rule pulls of external share codes, named `<CODE>-<description>.ow` (e.g. `7X3PY-stadium-sandbox.ow`, `3N0R2-jpc-racing.ow`, `genjiball-v1.3.ow`). Treat as vendored sources: don't hand-edit; layer changes in `rules/` files instead
- `*.owproj` — assembly manifests
- `*.ow` (root) — assembled outputs, ready to paste
- `.github/copilot-instructions.md` — detailed Workshop script reference (rule anatomy, events, physics patterns); read it before substantial script work

## Stadium mode: closed to Workshop (verified 2026-06-12)

Tested with `stadium-probe.owproj`: Workshop rules import into a lobby with Stadium modes (`Clash/Control/Payload Race/Push Stadium`), appear in the editor, and even fire during the match-start transition — but **Stadium match initialization tears down the Workshop runtime**: nothing executes in the match, no pre-planted artifacts (HUD text, effects, objective description) survive into it, and the script is wiped from the lobby afterwards. The settings text format is also lossy for Stadium both ways: the importer rejects per-mode blocks (`Competitive Rules`, `Limit Roles`) that the exporter writes (bare mode names import fine), and Stadium-only UI options (e.g. hero draft on/off) are not exported at all. Conclusion: "extending Stadium" is only possible by recreating Stadium-like systems in Workshop on non-Stadium modes (see `stadium-extended` — Workshop sandbox on the Stadium Practice Range map with a cash/upgrade shop). Don't retry running Workshop inside real Stadium.

## Round-tripping with the game

- Outputs that include a settings block must be imported from the **custom game lobby settings screen** (its paste/import action applies settings + rules together). The Workshop editor's paste only replaces rules.
- To capture lobby settings or a new external code, use the copy action on the lobby settings screen (copies settings + rules) and save it to a file; extract the leading `settings { ... }` block into `settings/<mode>.ow` and the rules into `imports/` or `rules/`.
- The game strips `//` comments and reformats on copy-out, so diffs between a lobby copy and repo sources are noisy — compare rule names/structure, not bytes.

## Workshop script conventions

Key points from `.github/copilot-instructions.md`:

- A script is an optional `settings` block, a `variables` block (numbered global/player slots, CamelCase names), an optional `subroutines` block, then `rule(...)` blocks: `event` / optional `conditions` / `actions`. Indentation is tabs.
- Single letters A–Z are implicit default slot names (A=0 … Z=25) and may be used without declaration.
- **Rule order matters** — later rules depend on initialization rules having run first. Preserve ordering when editing.
- Continuous loops use `Wait(<seconds>, Ignore Condition); Loop If Condition Is True;` — `Wait(0.016, ...)` is ~1 frame for physics precision. A stopwatch is `Chase Player Variable At Rate(var, <huge number>, 1, Destination and Rate)`.
- Prefer `Chase ... At Rate` over instant assignment for smooth value changes; use subroutines for repeated logic. Subroutine `Wait`s block the caller.
- Configurable knobs come from `Workshop Setting Integer/Toggle/Combo(...)`. Optional features ship as `disabled rule(...)` with a comment explaining what enabling them does.
- Map-specific values (spawns, checkpoints, button positions) each get their own initialization rule conditioned on `Current Map == Map(<Name>)`; test physics/boundary changes on every supported map.
