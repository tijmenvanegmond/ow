# Rein & Weave — road to 1.0

## Vision

Teams of humans + **Reinhardt bots** (lobby AI, Hard). Humans choose
**Reinhardt or LifeWeaver** freely; **one Ana per team** unlocks once the team
already fields a LW and a Rein. The LifeWeaver is a support/commander, not a
fighter — win by eliminating the enemy LifeWeaver while the Rein line fights.

## Current state (1.0-rc — built, needs in-game validation)

Sources: `rules/rein-and-weave-rules.ow` + libs (`match-control`, a `bots`
subset, `squad-orders`, `reinbot`, `rounds`, `squad-hud`, `buffs`), lobby
preset `settings/rein-and-weave.ow`. Build:
`node assemble.js rein-and-weave.owproj` → `build/rein-and-weave.ow`.

Implemented:

- **The army**: 3 Reinhardt dummy bots per team (slots 1-3) on the
  `lib/bots.ow` brain (perception, raycast steering) with `lib/reinbot.ow`
  attacks; 2s respawn; humans are auto-claimed so the brain never drives
  them. No lobby AI anywhere (it ignores throttle/facing)
- **Commanding** (`lib/squad-orders.ow` bindings): the team's LW (or Ana
  stand-in) is every bot's default leash anchor — the army fights near its
  commander and marches back when it strays (leash radius 20). Hold Interact
  = send the army to your reticle (team-visible rally marker); hold
  Secondary Fire (freed up by the Thorn Volley block) to prime a charge —
  every ready Rein braces (crouched, smoothly live-tracking your reticle,
  power ring growing on the bot; an active Charge's orientation is
  engine-locked, so the real Charge only starts at release) — release to
  snap them to your cursor and launch the real Charge at speed scaled by
  windup time (full power at 2s, max speed a Workshop Setting);
  casting Life Grip or Tree of Life rallies the army to you
- Hero choice via a per-player `Set Player Allowed Heroes` loop: Rein/LW
  always; Ana added only when the team (excluding you) has ≥1 LW, ≥1 Rein
  (bots count), and no other Ana
- LW can't fight: Thorn Volley disallowed; Life Grip cooldown capped;
  Healing Blossom grants the healed ally a timed speed boost (`lib/buffs`)
- Rein flavor: Fire Strike direct damage scaled down (default 50% — three
  bots spamming it at full damage shredded everyone) + burn DoT with orange
  aura (`lib/buffs`, aura handle stored per player)
- **Rounds** (`lib/rounds.ow` + Unlimited Match): a LifeWeaver death ends
  the round; announce, tally, reset, first to N wins. Only real LWs count —
  when the solo Ana stand-in could end rounds, her constant brain-driven
  deaths mass-respawned the lobby ("random" respawn waves)
- **HUD**: army counts + enemy-LW-alive line (`lib/squad-hud.ow`), round
  score (`lib/rounds.ow`), title/tip + commander hint
- **Workshop Settings**: Fire Strike damage %, burn DPS/duration, blossom
  boost %/duration, grip cooldown cap, rounds to win
- Solo/practice: Ana dummy-bot stand-in commander (left unclaimed so the
  brain moves her; her Reins guard her; worth +5 but never ends a round)
- Scoring kept as scoreboard flavor: +1 Rein / +5 Ana / +10 LW kill

## Remaining for 1.0

1. **In-game validation** — the whole 1.0 stack is untested in the lobby:
   steering with a moving LW anchor, round reset flow, buffs, HUD lines,
   solo mode.
2. **Binding polish** — Interact-send feel (hold vs. toggle), whether the
   Grip/Tree panic rally should hold longer than the standard rally decay,
   and an attack-move binding (the real ping system is not exposed to
   Workshop, so it needs a button or look-direction gesture).
3. **Round reset extras** — clear stale rally/order state and ability
   cooldowns on round start if the natural 8s rally decay isn't enough in
   practice.

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

## Lobby setup (documented for hosts)

Humans join Slot 0 of each team; the mode spawns 3 Reinhardt dummy bots per
team into slots 1-3 at match start. **Do not add lobby AI** — lobby AI can't
be commanded (ignores throttle/facing) and would fight the dummy-bot spawn
for slots. The settings preset carries modes/maps/heroes.

