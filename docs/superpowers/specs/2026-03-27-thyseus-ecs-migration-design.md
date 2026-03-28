# Thyseus ECS Migration — Architecture Design

## Context

Miniplex v2 has two structural limitations that constrain the current codebase:

1. **Query type erasure** — all queries return the same opaque type regardless of which components are requested, making system signatures unverifiable at the type level
2. **No DI for systems** — queries must be built outside systems and passed via a manual `SystemContext` bag; adding a new data dependency means touching `context.ts`, `world.ts`, and every system that receives the context

The migration is not a library swap. It is an architecture redesign informed by what we built in Plan 01, using Thyseus as the right foundation for that design. The scope is split into three sub-projects; only Sub-project 1 (architecture foundation) is fully specified here. Sub-projects 2 and 3 get named extension point stubs only.

---

## Sub-project Scope

| Sub-project | Scope | Treatment |
|---|---|---|
| 1 — Foundation | Animal agents, species config, 4-phase scheduling, perception components | Full spec + implementation plan |
| 2 — Person agents | `Person` branch of the Agent taxonomy | Stub components + empty systems only |
| 3 — Things | `Item`, `Structure`, `Resource` | Stub components + empty systems only |

---

## Section 1 — Component Schema

All components are Thyseus `@struct` classes (flat primitive fields, no object references in the struct itself).

### Core animal components

```ts
@struct class Position    { @f32 x = 0; @f32 y = 0 }
@struct class AnimalHealth { @f32 value = 1.0 }
@struct class AnimalHunger { @f32 value = 0.0 }
@struct class AnimalAge    { @u32 ticks = 0; @u32 maxTicks = 0 }
```

### Behavior / state components

```ts
export enum AnimalBehaviorPhase { Wander, Seek, Eat, Migrate, Mate, Aggro }

@struct class AnimalBehaviorState { @u8 phase = AnimalBehaviorPhase.Wander }

export enum ReproductivePhase { Idle, Seeking, Refractory }

@struct class ReproductiveState { @u8 phase = ReproductivePhase.Idle; @u32 timer = 0 }

@struct class MigrationState { @f32 targetX = 0; @f32 targetY = 0; @bool active = false }
```

### Perception components (written by sensing systems, read by planning)

```ts
@struct class AnimalAwareness {
  @bool foodNearby = false
  @f32  foodX = 0; @f32 foodY = 0
}

@struct class AnimalSocialAwareness {
  @bool mateNearby = false
  @bool threatNearby = false   // written by threatAwarenessSystem (SP2 stub in SP1)
}

@struct class ThreatAwareness {
  // stub — no fields in SP1; populated in SP2
  // Distinction from AnimalSocialAwareness.threatNearby:
  //   threatNearby = simple bool read by behaviorTransitionSystem (exists in SP1, stays false)
  //   ThreatAwareness = richer per-entity threat data (predator id, direction) added in SP2
}
```

### Species reference

```ts
@struct class SpeciesRef { @u8 speciesId = 0 }
// speciesId is an index into SPECIES_LIST → SPECIES_DEFS
```

### What was removed from Miniplex design

| Old | Removed because |
|---|---|
| Manual `id?` field on PawnComponents | Thyseus `Entity` query param provides stable IDs natively |
| `PawnKind` union on component | Replaced by `SpeciesRef` + `SpeciesDef.habitat` |
| `PawnQueries` bag in SystemContext | Thyseus DI — each system declares its own queries |
| `neighborById` rebuilt in world.ts per tick | `socialAwarenessSystem` owns this lookup internally |

---

## Section 2 — System Phases

Five Thyseus `Schedule` classes, run in fixed order each tick:

```
PrePhase → Sensing → Planning → Acting → Resolving
```

| Phase | Systems |
|---|---|
| PrePhase | `worldTickSystem` |
| Sensing | `foodAwarenessSystem`, `socialAwarenessSystem`, `threatAwarenessSystem` (stub) |
| Planning | `reproductivePhaseSystem`, `behaviorTransitionSystem` |
| Acting | `wanderSystem`, `seekSystem`, `eatSystem`, `migrationSystem`, `matingSystem`, `aggroSystem` |
| Resolving | `ageSystem`, `hungerSystem`, `eventCompactionSystem` |

### Entity death timing

`ageSystem` / `hungerSystem` call `map.removeEntity()` immediately in Resolving (spatial hash is clean), then call `entity.despawn()` (Thyseus deferred despawn — takes effect at end of schedule). Entities that die in Resolving were genuinely alive for all Sensing/Planning/Acting interactions that tick — semantically correct.

Extension point: a zero-cost `MarkedForDeath` tag component can be added in Resolving before despawn if future sensing systems need to filter dying entities mid-tick via `Without<MarkedForDeath>`. Not needed in SP1.

---

## Section 3 — Species Config

Static config lives outside the ECS. `SpeciesRef` holds only an index; systems call `getSpeciesDef(ref)` for a single array lookup with zero allocation.

```ts
export type SpeciesId = 'deer' | 'wolf' | 'salmon'

export type SpeciesDef = {
  readonly id: SpeciesId
  readonly habitat: 'land' | 'water'
  readonly hungerRate: number
  readonly baseLifespan: number
  readonly lifespanVariance: number
  readonly senseRadius: number
  readonly predatorIds: ReadonlySet<SpeciesId>
  readonly offspringCount: () => number
}

export const SPECIES_LIST: SpeciesId[] = ['deer', 'wolf', 'salmon']

export const SPECIES_DEFS: Record<SpeciesId, SpeciesDef> = {
  deer:   { id: 'deer',   habitat: 'land',  hungerRate: 0.002,  baseLifespan: 300, lifespanVariance: 50, senseRadius: 5, predatorIds: new Set(['wolf']), offspringCount: () => 1 },
  wolf:   { id: 'wolf',   habitat: 'land',  hungerRate: 0.003,  baseLifespan: 250, lifespanVariance: 40, senseRadius: 8, predatorIds: new Set([]),       offspringCount: () => 1 },
  salmon: { id: 'salmon', habitat: 'water', hungerRate: 0.0015, baseLifespan: 200, lifespanVariance: 50, senseRadius: 4, predatorIds: new Set([]),       offspringCount: () => 2 },
}

export function getSpeciesDef(ref: SpeciesRef): SpeciesDef {
  return SPECIES_DEFS[SPECIES_LIST[ref.speciesId]]
}
```

Replaces: `PawnKind` union, per-archetype `DEFAULTS` objects, `baseMaxTicks`/`ageTicks` spread in actorgen.

---

## Section 4 — File Structure

```
packages/game/src/
  species/
    defs.ts           # SpeciesId, SpeciesDef, SPECIES_DEFS, SPECIES_LIST, getSpeciesDef

  components/
    position.ts       # Position @struct
    animal.ts         # AnimalHealth, AnimalHunger, AnimalAge, SpeciesRef,
                      # AnimalBehaviorState, ReproductiveState, MigrationState
    perception.ts     # AnimalAwareness, AnimalSocialAwareness, ThreatAwareness (stub)

  systems/
    prephase/
      worldTick.ts
    sensing/
      foodAwareness.ts
      socialAwareness.ts
      threatAwareness.ts    # stub
    planning/
      reproductivePhase.ts
      behaviorTransition.ts
    acting/
      wander.ts
      seek.ts
      eat.ts
      migration.ts
      mating.ts
      aggro.ts
    resolving/
      age.ts
      hunger.ts
      eventCompaction.ts

  schedule.ts         # Schedule class definitions + system registration order
  world.ts            # GameWorld: owns App, map, events, rng; init + step
  game.ts             # Game root entry point

  map/                # unchanged
    map.ts
    mapgen.ts
    navigation.ts
    tiles.ts

  events.ts           # unchanged
  rng.ts              # unchanged
  types.ts            # EntityId, Point2d
  index.ts            # public exports
```

Key decisions:
- `components/` split by concern — each file small and focused
- `systems/` mirrored to phase folders — execution order visible at a glance
- `schedule.ts` is the single place that imports all systems and registers them into Thyseus Schedules
- `species/` is top-level, not under `components/` — it is static config, not ECS state
- `map/` unchanged in SP1

---

## Section 5 — Extension Point Stubs (SP2 + SP3)

Created in SP1, empty, registered in `schedule.ts`. Filled in by later sub-projects without touching the scheduler.

**Sub-project 2 — Person agents**

```
components/
  person.ts           # PersonBehaviorState, PersonNeeds (stub @structs, no fields)

systems/
  sensing/
    personAwareness.ts    # export function personAwarenessSystem() {}
  acting/
    personAct.ts          # export function personActSystem() {}
```

**Sub-project 3 — Things**

```
components/
  things.ts           # ItemRef, StructureRef, ResourceRef (stub @structs, no fields)

systems/
  resolving/
    thingDecay.ts         # export function thingDecaySystem() {}
```

Additional type in `types.ts`:

```ts
export type ThingKind = 'item' | 'structure' | 'resource'  // unused in SP1
```

**Not stubbed in SP1**: AI/pathfinding, crafting/inventory, network sync — no phase slot needed yet.

---

## Taxonomy Reference

```
Agents
  Animal    ← implemented in SP1
  Person    ← stub in SP1, implemented in SP2

Things
  Item      ← stub in SP1, implemented in SP3
  Structure ← stub in SP1, implemented in SP3
  Resource  ← stub in SP1, implemented in SP3
```

---

## Verification

After SP1 implementation:

```bash
# All existing tests must still pass (48 tests)
pnpm --filter @dp/game test

# Typecheck clean
pnpm --filter @dp/game typecheck

# Verify CLI: same observable behavior as pre-migration
pnpm --filter @dp/game verify -- --ticks=200 --seed=42 --width=64 --height=32
```

Acceptance: same animal/fish population dynamics, same deterministic output with same seed, typecheck and lint clean.
