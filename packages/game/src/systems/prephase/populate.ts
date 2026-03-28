import type { World } from 'thyseus'
import { Entities, Res } from 'thyseus'
import { GameMap } from '@/map'
import { Rng } from '@/rng'
import { SPECIES_LIST, SPECIES_DEFS } from '@/species/defs'
import { spawnAnimal } from '@/species/spawn'

export function makePopulateSystem(animalCount: number, fishCount: number) {
  const deerIdx = SPECIES_LIST.indexOf('deer')
  const salmonIdx = SPECIES_LIST.indexOf('salmon')

  function populateSystem(entities: Entities, map: GameMap, rng: Rng): void {
    let placed = 0
    while (placed < animalCount) {
      const x = rng.int(0, map.width - 1)
      const y = rng.int(0, map.height - 1)
      if (map.isPassable(x, y, true)) {
        const def = SPECIES_DEFS[SPECIES_LIST[deerIdx]]
        const lifespan = def.baseLifespan + rng.int(-def.lifespanVariance, def.lifespanVariance)
        spawnAnimal(entities, map, x, y, deerIdx, lifespan, rng.float() * 0.3, rng.int(5, 15))
        placed++
      }
    }
    placed = 0
    while (placed < fishCount) {
      const x = rng.int(0, map.width - 1)
      const y = rng.int(0, map.height - 1)
      if (map.isPassable(x, y, false)) {
        const def = SPECIES_DEFS[SPECIES_LIST[salmonIdx]]
        const lifespan = def.baseLifespan + rng.int(-def.lifespanVariance, def.lifespanVariance)
        spawnAnimal(entities, map, x, y, salmonIdx, lifespan, rng.float() * 0.3, rng.int(5, 15))
        placed++
      }
    }
  }
  populateSystem.getSystemArguments = (w: World) => [
    w.entities,
    Res.intoArgument(w, GameMap),
    Res.intoArgument(w, Rng),
  ]
  return populateSystem
}
