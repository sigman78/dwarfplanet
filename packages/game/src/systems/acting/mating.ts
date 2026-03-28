import type { World } from 'thyseus'
import { Entities, Entity, Query, Res } from 'thyseus'
import { Position, AnimalBehaviorState, AnimalBehaviorPhase, ReproductiveState, ReproductivePhase, SpeciesRef } from '@/components'
import { GameMap } from '@/map'
import { spawnAnimal } from '@/species/spawn'
import { Rng } from '@/rng'
import { GameEventsLog } from '@/events'
import { WorldState } from '@/worldstate'
import { getSpeciesDef } from '@/species/defs'
import type { EntityId } from '@/types'

export function matingSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, ReproductiveState, SpeciesRef]>,
  entities: Entities,
  map: Res<GameMap>,
  rng: Res<Rng>,
  events: Res<GameEventsLog>,
  worldState: Res<WorldState>,
): void {
  for (const [entity, pos, bstate, repro, speciesRef] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Mate) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    const count = rng.int(1, def.maxOffspring)
    for (let i = 0; i < count; i++) {
      const nx = map.wrapX(pos.x + rng.int(-2, 2))
      const ny = Math.max(0, Math.min(map.height - 1, pos.y + rng.int(-2, 2)))
      const lifespan = def.baseLifespan + rng.int(-def.lifespanVariance, def.lifespanVariance)
      spawnAnimal(entities, map, nx, ny, speciesRef.speciesId, lifespan, rng.float() * 0.3, rng.int(5, 15))
    }
    events.emit({
      tick: worldState.tick,
      origin: entity.id as EntityId,
      importance: 2,
      text: `mating: ${count} offspring`,
    })
    repro.phase = ReproductivePhase.Refractory
    repro.timer = 20
    bstate.phase = AnimalBehaviorPhase.Wander
    bstate.timer = 20
  }
}
matingSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, ReproductiveState, SpeciesRef]),
  w.entities,
  Res.intoArgument(w, GameMap),
  Res.intoArgument(w, Rng),
  Res.intoArgument(w, GameEventsLog),
  Res.intoArgument(w, WorldState),
]
