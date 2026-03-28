import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position, AnimalBehaviorState, AnimalBehaviorPhase, AnimalHunger, SpeciesRef } from '@/components'
import { GameMap, BIOME_DEFS } from '@/map'
import { getSpeciesDef } from '@/species/defs'

export function eatSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, AnimalHunger, SpeciesRef]>,
  map: Res<GameMap>,
): void {
  for (const [, pos, bstate, hunger, speciesRef] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Eat) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    const biome = map.getBiome(pos.x, pos.y)
    const isFood = def.habitat === 'land' ? BIOME_DEFS[biome].animalFood : BIOME_DEFS[biome].fishFood
    if (isFood) {
      hunger.value = 0
    }
  }
}
eatSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, AnimalHunger, SpeciesRef]),
  Res.intoArgument(w, GameMap),
]
