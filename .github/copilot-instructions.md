# Overwatch Workshop Project

This workspace contains Overwatch Workshop game modes written in Workshop script (.ow files):
- **brigbonk.ow**: Brigitte utility mod with "bonk" effects and Rally mechanics
- **genjiball.ow**: Genji Dodgeball v1.2.4 - competitive ball deflection game with tournament features

## Workshop Script Fundamentals

### File Structure
Workshop scripts follow this organization:
1. **Variable/Subroutine declarations** (global scope, at file start)
2. **Settings rules** (load Workshop customization options)
3. **Initialization rules** (per-map and per-player setup)
4. **Feature sections** (organized by domain: HUD, appearance, game logic, controls, physics, etc.)

### Rule Anatomy
```
rule("Descriptive Name")
{
    event { <trigger>; <team>; <hero>; }
    conditions { <boolean checks> }
    actions { <sequential operations> }
}
```

Common events:
- `Ongoing - Global` / `Ongoing - Each Player` - continuous loops
- `Player Took Damage`, `Player Died` - player action triggers
- `Subroutine; <name>` - callable with `Call Subroutine(<name>)`

## Variable Conventions

### Naming Patterns
- **CamelCase** for all variables
- **Boolean-like suffixes**: `*Enabled`, `*InProgress`, `*IsOut`, `is*`, `has*`, `can*`
- **Grouped by prefix**: `ball*` (ballSpeed, ballPosition, ballDirection), `bouncePad*`
- **State pairs**: `target` / `prevTarget`, `roundsUntilBreak` / `roundsUntilBreakInit`

### Global vs Player Variables
- **Global** (0-51): Game state, physics, configuration, map bounds, shared objects
- **Player** (per-player): Individual state, cooldowns, settings (HUD mode, anti-rubberbanding)

Always use descriptive slot numbers with comments when declaring:
```
global:
    0: target          # Current ball target player
    1: prevTarget      # Previous target (avoid re-targeting)
    2: ballSpeed       # Current ball velocity magnitude
```

## Common Patterns

### Continuous Loops
```
actions {
    <logic>
    Wait(0.250, Ignore Condition);
    Loop If Condition Is True;
}
```
Used for: HUD updates, physics simulation, state monitoring

### Smooth Value Changes
```
Chase Global Variable At Rate(ballSpeed, targetValue, ratePerSecond, Destination and Rate);
Stop Chasing Global Variable(ballSpeed);
```
Better than instant assignment for physics/animations

### Array Filtering for Targeting
```
Global.target = Random Value In Array(Filtered Array(
    All Living Players(All Teams),
    <conditions on Current Array Element>
));
```

### HUD Stack Management
Position parameter acts as z-index (layer depth):
```
Create HUD Text(player, header, subheader, text, position_id, colors, visibility);
Destroy All HUD Text;  // Clear before rebuilding
```

### Map-Specific Configuration
Each map needs a separate initialization rule:
```
rule("Initialization - Set <MapName>")
{
    conditions { Current Map == Map(<MapName>); }
    actions {
        Global.circleCenter = Vector(x, y, z);
        Global.SphereSize = radius;
        Global.waterLevel = depth;
    }
}
```

## Workshop Settings Integration

Load configurable knobs via:
- `Workshop Setting Integer(category, name, default, min, max, sortOrder)`
- `Workshop Setting Toggle(category, name, default, sortOrder)`
- `Workshop Setting Combo(category, name, default, options, sortOrder)`

Settings organize into categories (Ball, Misc, Tournament, Add-ons). Use presets to override multiple settings:
```
If(Global.presetMode == 1);
    Global.ballSpeed = 65;
    Global.waterLevel = 0;
End;
```

## Feature Organization

Group related rules sequentially by domain:
1. **Settings & Initialization**: Load config, set map bounds, initialize variables
2. **Appearance**: Visual effects, text displays
3. **Game Logic**: Win conditions, scoring, collision detection
4. **Controls**: Input mapping (Primary Fire, Ability buttons, Interact)
5. **Physics**: Motion types, velocity, trajectory, collision response
6. **Map Restrictions**: Boundaries, water zones, respawn areas
7. **Special Modes**: Tournament, duels, bot AI, endless mode

Use `disabled rule()` for optional features that users can enable

## Editing Guidelines

- **Preserve rule order**: Features depend on initialization completing first
- **Test map-specific changes on all 7 maps** if modifying physics/boundaries
- **Use subroutines** for repeated logic (collision, cleanup, effects)
- **Wait strategically**: `Wait(0.016, Ignore Condition)` = ~1 frame precision for physics
- **Comment disabled rules clearly**: Explain what enabling them does
- **Maintain consistent indentation**: Workshop uses tabs for rule structure

## Physics Precision

Genjiball demonstrates advanced collision:
- **Phasing protection**: Stores 4 intermediate ball positions per frame to catch fast-moving targets
- **Surface normals**: Projects ball direction onto collision surface for realistic bouncing
- **Motion types**: Different Chase patterns create distinct physics feels (modern/rapid/astro/retro)

When modifying physics, ensure ball motion remains consistent across all configured motion types.
