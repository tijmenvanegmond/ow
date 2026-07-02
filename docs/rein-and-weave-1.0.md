# Rein & Weave — road to 1.0

## Vision

Teams of humans + **Reinhardt bots** (lobby AI, Hard). Humans choose
**Reinhardt or LifeWeaver** freely; **one Ana per team** unlocks once the team
already fields a LW and a Rein. The LifeWeaver is a support/commander, not a
fighter — win by eliminating the enemy LifeWeaver while the Rein line fights.

## Current state (0.x)

Sources: `rules/rein-and-weave-rules.ow` + `lib/match-control.ow`,
lobby preset `settings/rein-and-weave.ow`. Build:
`node assemble.js rein-and-weave.owproj` → `build/rein-and-weave.ow`.

Implemented:

- Hero choice via a per-player `Set Player Allowed Heroes` loop: Rein/LW
  always; Ana added only when the team (excluding you) has ≥1 LW, ≥1 Rein
  (bots count), and no other Ana. Lobby bots force-locked to Reinhardt
  (Ana exempt — see solo mode)
- LW can't fight: Thorn Volley (Secondary Fire) disallowed
- LW support buffs: Life Grip cooldown capped at 4s; Healing Blossom grants
  the healed ally +50% move speed for 2s (not self)
- Rein flavor: Fire Strike applies a 3s burn (15 dps + orange aura)
- Bots respawn 2s after death
- Solo/practice: if a team has no human after 3s, an Ana dummy bot spawns as
  stand-in commander
- Scoring: +1 per Rein kill, +5 per Ana kill, +10 per LifeWeaver kill
- Lobby preset: 4v4 Team Deathmatch, score to win 40, maps Black Forest /
  Castillo / Ilios Well / Necropolis, Life Grip & Blossom range 200%,
  hero pool Ana/LW/Rein

## Gaps to close for 1.0

1. **Bot commanding** — the core fantasy. The machinery now exists as libs,
   proven in REIGN: `lib/bots.ow` (dummy-bot squad, perception, raycast
   steering), `lib/reinbot.ow` (Rein attacks), `lib/squad-orders.ow` (leash
   anchors, rally orders, markers). Remaining work: swap the lobby-AI Reins
   for `lib/bots.ow` dummy bots (lobby AI ignores throttle/facing), set each
   bot's `leashDefault` to its team's LifeWeaver so the army guards the
   commander, and write the LW-native binding rules: ping/look direction =
   attack-move there, Life Grip target = rally point, Tree of Life = bots
   group and hold.
2. **Win condition** — TDM score 40 is a proxy. 1.0: round ends when a
   LifeWeaver dies; first to N rounds wins. Needs the Unlimited Match rules
   from `lib/match-control.ow` (disable built-in completion) + a round
   reset routine (respawn all, reset cooldowns/scores).
3. **HUD** — army status (own/enemy Reins alive), enemy LW alive indicator,
   round score. Current HUD is just the title + tip.
4. **Workshop Settings** — expose balance levers: blossom speed-boost
   duration/amount, burn dps, grip cooldown cap, bot respawn delay, rounds
   to win.
5. **Polish** — round intro/outro messages, kill-feed flavor for LW kills,
   solo-mode Ana commander should also command (currently just exists).

## Post-1.0 — army sandbox features (planned)

1. **Reins out of the human player slots** — keep the joinable slots free for
   humans: cap max players per team in the lobby settings and spawn the army
   as dummy bots in the slots above that cap (`Create Dummy Bot` can fill
   slots the lobby won't give to humans), so bots never block a player
   joining and team-size UI stays honest.
2. **Teamless Reins + recruiting** — Reins spawn unaligned around the map
   (mechanically parked on a team but flagged unrecruited: grey name tag,
   attack nobody, hold position) and join whoever recruits them (proximity +
   heal/interact) via `Move Player to Team` + order-state reset. Army size
   becomes something you build, not something you're given.
3. **Converting enemy Reins** — a long-cooldown LW "grip" on an enemy Rein
   pulls it across and flips it to your team (`Move Player to Team`, clear
   its orders/leash, killfeed flavor). The counterpart threat to protecting
   your own army.
4. **General bot upgrades** — navigation: waypoint/path following beyond the
   local raycast steering in `lib/bots.ow`, so bots escape concave dead-ends
   (see `imports/HP2DG-deltins-pathfinding.ow` for a full pathfinding
   reference); looking: idle scanning and threat prioritization instead of
   nearest-enemy-only; communication: bots `Communicate` (voice lines/pings)
   to acknowledge orders, call out charges, and react to their LW dying.

## Lobby setup (manual, documented for hosts)

Each team: 1 human in Slot 0 + 3 AI Reinhardt (Hard). The settings preset
carries modes/maps/heroes; AI bots are added via the lobby UI (lobby AI is
not part of the settings text format).

