import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalBehaviorState, AnimalBehaviorPhase, SpeciesRef } from '../../components/animal'
import { GameMap } from '../../map/map'
import { BIOME_DEFS } from '../../map/tiles'
import { getNextStep } from '../../map/navigation'
import { getSpeciesDef } from '../../species/defs'
import type { EntityId } from '../../types'

const SEARCH_RADIUS = 3

export function seekSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, SpeciesRef]>,
  map: Res<GameMap>,
): void {
  for (const [entity, pos, bstate, speciesRef] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Seek) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    const isLand = def.habitat === 'land'
    let target: { x: number; y: number } | null = null
    let bestDist = Infinity
    for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
      for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
        const tx = map.wrapX(pos.x + dx)
        const ty = Math.max(0, Math.min(map.height - 1, pos.y + dy))
        const biome = map.getBiome(tx, ty)
        const isFood = isLand ? BIOME_DEFS[biome].animalFood : BIOME_DEFS[biome].fishFood
        if (isFood) {
          const d = Math.abs(dx) + Math.abs(dy)
          if (d < bestDist) { bestDist = d; target = { x: tx, y: ty } }
        }
      }
    }
    if (!target) continue
    const next = getNextStep({ x: pos.x, y: pos.y }, target, isLand, map)
    if (next.x !== pos.x || next.y !== pos.y) {
      map.moveEntity(entity.id as EntityId, pos.x, pos.y, next.x, next.y)
      pos.x = next.x
      pos.y = next.y
    }
  }
}
seekSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, SpeciesRef]),
  Res.intoArgument(w, GameMap),
]
