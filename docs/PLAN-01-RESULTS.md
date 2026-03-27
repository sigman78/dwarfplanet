# Plan 01 Results — Bones Bootstrap

**Date:** 2026-03-27
**Branch:** plan-01-bones (merged to master)
**Status:** Complete

---

## What Was Built

Full monorepo scaffold and `@dp/game` package implementing the game core simulation with no networking or rendering.

### Deliverables

| Item | Status |
|---|---|
| pnpm workspace monorepo | Done |
| Stub packages (client, server, netproto, shared) | Done |
| Root tooling (ESLint, Prettier, TypeScript 5 strict) | Done |
| Seeded RNG (`pure-rand` xoroshiro128plus) | Done |
| Layered noise map gen (Whittaker biome table) | Done |
| GameMap with spatial hash | Done |
| ECS actor system via Miniplex | Done |
| Actor state machine (6 states, 10 transitions) | Done |
| 10 ECS systems in order | Done |
| GameEventsLog with compaction | Done |
| GameWorld + Game root container | Done |
| Terminal verification CLI | Done |
| 43 passing tests | Done |
| Typecheck + lint clean | Done |

---

## Verification Results

```
pnpm --filter @dp/game verify -- --ticks=100 --seed=42 --width=64 --height=32
```

Produces ASCII map with biome glyphs (`~` water, `^` mountain, `T` forest, `"` grassland, `*` boreal, `,` tundra, `#` snowfield, `_` desert, `:` savanna, `=` shrubland) and simulation output showing actor population over time.

Test suite: 43 tests, 4 files (rng, map, actor, simulation). Includes 200-tick integration test verifying no extinction, no explosion, mating events, old-age deaths, and determinism.

---

## Bugs Fixed During Implementation

1. **eslint-plugin-import not wired** — installed but not configured in `.eslintrc.cjs`. Fixed + `eslint-import-resolver-typescript` added.
2. **Biased wander shuffle** — `.sort(() => rng.int(0,1) - 0.5)` produces non-uniform permutations. Replaced with Fisher-Yates.
3. **Aggro duplicate despawn** — same entity could appear twice in removal list. Fixed with Set-based dedup.
4. **Partner/rival detection entangled** — any same-kind neighbor set both flags; Wander→Mate was effectively blocked. Fixed: rivalNearby only when neighbor is aggro during season.
5. **migrateTarget not cleared on exit** — actor would re-enter Migrate to same stale target. Fixed: clear on state transition away from Migrate.
6. **Module-level nextId global** — broke GameWorld isolation between instances. Moved to WorldState.nextEntityId.
7. **mateSystem solo spawning** — spawned offspring without requiring a partner entity present. Added partner-presence guard.
8. **Seek state trap** — no exit transition when food disappears. Added Seek→Wander on !foodNearby.
9. **mateSystem population explosion** — setting aggro=false after mating allowed immediate re-mating in same season. Set aggro=true post-mating; matingSeasonSystem clears it at season end.
10. **Fish lifespan too long for tests** — FISH_DEFAULTS.baseMaxTicks=400 meant no old-age deaths in 200-tick window. Reduced to 200.
11. **O(n) ECS scan inside neighbor loops** — stateTransitionSystem and aggroSystem had linear scans inside inner loops. Fixed with pre-built ID→entity Maps.

---

## Architecture Decisions

- **WorldState carries nextEntityId** rather than module global, ensuring each Game instance manages its own ID space.
- **mating.aggro flag** serves as "already mated this season" marker — actors with aggro=true are treated as rivals, preventing re-mating. matingSeasonSystem clears it at season end.
- **Food model is biome-based** (Phase 1 simplification) — no item objects; certain biomes are renewable food tiles.
- **Seek→Wander fallback** ensures actors don't permanently lock in Seek when food moves out of radius.

---

## Known Limitations (Phase 1 by design)

- Stub pathfinding (greedy directional, no A*)
- No item objects or resource depletion
- No client/server networking
- No rendering (terminal ASCII only)
- Simple Whittaker biome table (no climate simulation)
- No fog of war, no persistence

---

## Next Steps (Plan 02)

- Colyseus server with room lifecycle
- Client with Canvas 2D rendering
- Viewport-aware delta sync
- Chunked map streaming
