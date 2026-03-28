import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position, AnimalBehaviorState, AnimalBehaviorPhase, SpeciesRef, AnimalAwareness } from '@/components'
import { GameMap, getNextStep } from '@/map'
import { getSpeciesDef } from '@/species/defs'
import type { EntityId } from '@/types'

export function seekSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, SpeciesRef, AnimalAwareness]>,
  map: Res<GameMap>,
): void {
  for (const [entity, pos, bstate, speciesRef, awareness] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Seek) continue
    if (!awareness.foodNearby) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    const isLand = def.habitat === 'land'
    const target = { x: awareness.foodX, y: awareness.foodY }
    const next = getNextStep({ x: pos.x, y: pos.y }, target, isLand, map)
    if (next.x !== pos.x || next.y !== pos.y) {
      map.moveEntity(entity.id as EntityId, pos.x, pos.y, next.x, next.y)
      pos.x = next.x
      pos.y = next.y
    }
  }
}
seekSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, SpeciesRef, AnimalAwareness]),
  Res.intoArgument(w, GameMap),
]
