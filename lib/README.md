# OW Workshop Rule Library

Each file is a standalone `.ow` snippet. Copy the rules you need into your script.

| File | Rules inside |
|------|-------------|
| `bots.ow` | Spawn Squad On Match Start, Quick Respawn, Name Tags, Acquire Nearest Enemy, Face Target Or Movement, Steer (subroutine), Approach Enemy, + disabled command examples (Move To Target, Jump, Despawn) |
| `squad-orders.ow` | Init Defaults, Maintain Leash Anchor, Seek Leash Anchor, Rally Marker Visuals, Expire Rally Marker — commander→squad order layer on top of `bots.ow`; the mode supplies the button/ability bindings (see `rules/reign.ow`) |
| `reinbot.ow` | Swing hammer in melee, Fire Strike at range, Charge a mid-range enemy — Reinhardt attack layer for `bots.ow` brains |
| `rounds.ow` | Init, Round Over — first-to-N custom rounds; a mode sets `roundWinner` to end a round; pair with Unlimited Match |
| `squad-hud.ow` | Army Status, Tracked Hero Status — live own/enemy bot counts, optional key-hero alive indicator |
| `buffs.ow` | Burn, Speed Boost — timed status effects driven by per-player `*EndTime` variables |
| `match-control.ow` | Skip Hero Select, Quick Start, Unlimited Match (disabled), Score On Kill (disabled) |
| `movement.ow` | Jump Boost, Ult Launch, Air Stabilize, Bot Patrol |
| `ui.ow` | In-World Text on Spawn, Persistent HUD Panel, Global Counter Display, Welcome Message, Big Message + Tip, Info Panel (Interact), Clear In-World Text |
| `effects.ow` | BONK On Damage, Good Pickup On Join, Ring On Jump Boost |
| `respawn.ow` | Quick Respawn (1 s), Immortal Heal |
| `scoring.ow` | Increment Counter On Join, +1 Per Kill |

## How to use

1. Open the target `.ow` file (or create a new one).
2. Copy the `variables` block from any lib file that declares variables you need.
3. Copy each rule you want into the file.
4. Paste the whole thing into the Overwatch Workshop editor.
