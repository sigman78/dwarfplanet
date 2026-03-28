import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position, AnimalHunger, SpeciesRef } from '@/components'
import { GameMap } from '@/map'
import { GameEventsLog } from '@/events'
import { WorldState } from '@/worldstate'
import { getSpeciesDef } from '@/species/defs'
import type { EntityId } from '@/types'

export function hungerSystem(
  query: Query<[Entity, Position, AnimalHunger, SpeciesRef]>,
  map: Res<GameMap>,
  events: Res<GameEventsLog>,
  worldState: Res<WorldState>,
): void {
  for (const [entity, pos, hunger, speciesRef] of query) {
    if (!entity.isAlive || worldState.despawnedThisTick.has(entity.id)) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    hunger.value = Math.min(1, hunger.value + def.hungerRate)
    if (hunger.value >= 1) {
      map.removeEntity(entity.id as EntityId, pos.x, pos.y)
      events.emit({ tick: worldState.tick, origin: entity.id as EntityId, importance: 1, text: 'actor died (hunger)' })
      worldState.despawnedThisTick.add(entity.id)
      entity.despawn()
    }
  }
}
hungerSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalHunger, SpeciesRef]),
  Res.intoArgument(w, GameMap),
  Res.intoArgument(w, GameEventsLog),
  Res.intoArgument(w, WorldState),
]
