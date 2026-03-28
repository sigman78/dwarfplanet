import type { World } from 'thyseus'
import { Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalBehaviorState, AnimalBehaviorPhase, AnimalHunger, SpeciesRef } from '../../components/animal'
import { GameMap } from '../../map/map'
import { BIOME_DEFS } from '../../map/tiles'
import { getSpeciesDef } from '../../species/defs'

export function eatSystem(
  query: Query<[Position, AnimalBehaviorState, AnimalHunger, SpeciesRef]>,
  map: Res<GameMap>,
): void {
  for (const [pos, bstate, hunger, speciesRef] of query) {
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
  Query.intoArgument(w, [Position, AnimalBehaviorState, AnimalHunger, SpeciesRef]),
  Res.intoArgument(w, GameMap),
]
