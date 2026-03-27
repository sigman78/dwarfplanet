# File describing project changes made

## Bootstrap

- Initialized repo
- Added README
- Added generic AGENTS.md instructions
- Added @docs/* - initial project documentation

## Plan 01 — Bones Bootstrap (2026-03-27)

- pnpm workspace monorepo: root tooling (ESLint, Prettier, TypeScript 5 strict), stub packages (client, server, netproto, shared)
- `@dp/game` package: full game core implementation
  - Seeded RNG wrapper around pure-rand (xoroshiro128plus)
  - Map: Uint8Array tile storage, spatial hash, simplex noise layered map generation (Whittaker biome table), stub pathfinding
  - ECS actors via Miniplex: Animal + Fish archetypes with Age, Hunger, Mating season components
  - State machine: 6 states (Wander/Seek/Eat/Migrate/Mate/Aggro), 10 transitions
  - 10 ECS systems in fixed execution order: age, hunger, matingSeason, stateTransition, wander, seek, eat, migrate, mate, aggro
  - GameEventsLog: append-only event stream with tick-based compaction
  - Processor: registered system runner
  - GameWorld + Game: root seeded entry point, orchestrates map gen, population, simulation tick
  - Terminal verification CLI: ASCII map + sim output
- 43 passing tests (unit + simulation integration, deterministic via fixed seeds)
- Typecheck clean, lint clean

## Post-Plan-01 Refactors (2026-03-27)

- Enhanced verify CLI: actor overlay (`@`/`f`) on map, state distribution per interval, spotlight actor tracking, death summary
- 5 new simulation behavior tests (movement, eat cycle, aging, state transitions, fish lifecycle) — 48 tests total
- Naming refactor: `EntityComponents`→`PawnComponents`, `ActorStateEnum`→`PawnState`, `Subtype` wrapper→`PawnKind` flat union, `actorState`→`behaviorState`, `mating.aggro`→`mating.refractory`
- ECS query caching: all queries built once in `GameWorld` constructor, passed via `SystemContext.queries`
- `neighborById` map built once per tick in `GameWorld.step()`, shared across systems
- `aggroSystem` removal uses entity refs directly (no full-world scan)
- `hasFoodNearby`/`seekSystem` explicit Y-bounds clamping
- Biome split: `Water`→`DeepWater` (height<0.2) + `CoastalWater` (0.2–0.3); `CoastalWater` is fish food biome

