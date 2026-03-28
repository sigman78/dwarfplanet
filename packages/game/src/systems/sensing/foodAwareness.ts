import type { World } from 'thyseus'
import { Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalAwareness } from '../../components/perception'
import { SpeciesRef } from '../../components/animal'
import { GameMap } from '../../map/map'
import { BIOME_DEFS } from '../../map/tiles'
import { getSpeciesDef } from '../../species/defs'

export function foodAwarenessSystem(
  query: Query<[Position, AnimalAwareness, SpeciesRef]>,
  map: GameMap,
): void {
  for (const [pos, awareness, speciesRef] of query) {
    const def = getSpeciesDef(speciesRef.speciesId)
    const r = def.senseRadius
    awareness.foodNearby = false
    awareness.foodX = 0
    awareness.foodY = 0
    outer: for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const tx = map.wrapX(pos.x + dx)
        const ty = Math.max(0, Math.min(map.height - 1, pos.y + dy))
        const biome = map.getBiome(tx, ty)
        const isFood = def.habitat === 'land' ? BIOME_DEFS[biome].animalFood : BIOME_DEFS[biome].fishFood
        if (isFood) {
          awareness.foodNearby = true
          awareness.foodX = tx
          awareness.foodY = ty
          break outer
        }
      }
    }
  }
}
foodAwarenessSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Position, AnimalAwareness, SpeciesRef]),
  Res.intoArgument(w, GameMap),
]
