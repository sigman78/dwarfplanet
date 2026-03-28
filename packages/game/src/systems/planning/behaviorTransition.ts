// packages/game/src/systems/planning/behaviorTransition.ts
import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import {
  AnimalBehaviorState, AnimalBehaviorPhase,
  AnimalHunger, MigrationState, ReproductiveState, ReproductivePhase,
  SpeciesRef, AnimalAwareness, AnimalSocialAwareness, Position,
} from '@/components'
import { GameMap, BIOME_DEFS } from '@/map'
import { Rng } from '@/rng'
import { getSpeciesDef } from '@/species/defs'
import { WorldState } from '@/worldstate'

export type TransitionConditions = {
  hunger: number
  foodNearby: boolean
  seasonActive: boolean
  partnerNearby: boolean
  rivalNearby: boolean
  atTarget: boolean
  adjacent: boolean
}

type Transition = [
  from: AnimalBehaviorPhase,
  to: AnimalBehaviorPhase,
  check: (c: TransitionConditions) => boolean,
]

const TRANSITIONS: Transition[] = [
  [AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Seek,    (c) => c.hunger > 0.6 && c.foodNearby],
  [AnimalBehaviorPhase.Seek,   AnimalBehaviorPhase.Eat,     (c) => c.adjacent],
  [AnimalBehaviorPhase.Seek,   AnimalBehaviorPhase.Wander,  (c) => !c.foodNearby],
  [AnimalBehaviorPhase.Eat,    AnimalBehaviorPhase.Wander,  (c) => c.hunger < 0.2],
  [AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Migrate, (c) => !c.foodNearby && c.hunger < 0.5],
  [AnimalBehaviorPhase.Migrate,AnimalBehaviorPhase.Wander,  (c) => c.atTarget],
  [AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Mate,    (c) => c.seasonActive && c.partnerNearby && !c.rivalNearby],
  [AnimalBehaviorPhase.Mate,   AnimalBehaviorPhase.Wander,  (_c) => true],
  [AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Aggro,   (c) => c.seasonActive && c.rivalNearby],
  [AnimalBehaviorPhase.Aggro,  AnimalBehaviorPhase.Wander,  (c) => !c.rivalNearby],
]

export function canTransition(
  from: AnimalBehaviorPhase,
  to: AnimalBehaviorPhase,
  cond: TransitionConditions,
): boolean {
  const t = TRANSITIONS.find((tr) => tr[0] === from && tr[1] === to)
  return t ? t[2](cond) : false
}

export function getNextPhase(
  current: AnimalBehaviorPhase,
  cond: TransitionConditions,
): AnimalBehaviorPhase {
  for (const [from, to, check] of TRANSITIONS) {
    if (from === current && check(cond)) return to
  }
  return current
}

export function behaviorTransitionSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, AnimalHunger, MigrationState, ReproductiveState, AnimalAwareness, AnimalSocialAwareness, SpeciesRef]>,
  map: Res<GameMap>,
  rng: Res<Rng>,
  worldState: Res<WorldState>,
): void {
  for (const [, pos, bstate, hunger, migration, repro, awareness, social, speciesRef] of query) {
    bstate.timer--
    if (bstate.timer > 0) continue

    const def = getSpeciesDef(speciesRef.speciesId)
    const biome = map.getBiome(pos.x, pos.y)
    const adjacentFood = def.habitat === 'land' ? BIOME_DEFS[biome].animalFood : BIOME_DEFS[biome].fishFood

    const atTarget = migration.active
      ? Math.abs(pos.x - migration.targetX) < 3 && Math.abs(pos.y - migration.targetY) < 3
      : false

    const next = getNextPhase(bstate.phase, {
      hunger: hunger.value,
      foodNearby: awareness.foodNearby,
      seasonActive: worldState.season,
      partnerNearby: social.mateNearby && repro.phase === ReproductivePhase.Seeking,
      rivalNearby: social.threatNearby,
      atTarget,
      adjacent: adjacentFood,
    })

    if (next !== bstate.phase) {
      if (bstate.phase === AnimalBehaviorPhase.Migrate) {
        migration.active = false
      }
      bstate.phase = next
      bstate.timer = 10
      if (next === AnimalBehaviorPhase.Migrate && !migration.active) {
        migration.targetX = rng.int(0, map.width - 1)
        migration.targetY = rng.int(0, map.height - 1)
        migration.active = true
      }
    } else {
      bstate.timer = 5
    }
  }
}
behaviorTransitionSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, AnimalHunger, MigrationState, ReproductiveState, AnimalAwareness, AnimalSocialAwareness, SpeciesRef]),
  Res.intoArgument(w, GameMap),
  Res.intoArgument(w, Rng),
  Res.intoArgument(w, WorldState),
]
