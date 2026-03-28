import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalBehaviorState, AnimalBehaviorPhase, SpeciesRef } from '../../components/animal'
import { GameMap } from '../../map/map'
import { Rng } from '../../rng'
import { getSpeciesDef } from '../../species/defs'
import type { EntityId } from '../../types'

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const

export function wanderSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, SpeciesRef]>,
  map: Res<GameMap>,
  rng: Res<Rng>,
): void {
  for (const [entity, pos, bstate, speciesRef] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Wander) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    const isLand = def.habitat === 'land'
    const order = [0, 1, 2, 3]
    for (let i = 3; i > 0; i--) {
      const j = rng.int(0, i)
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    for (const i of order) {
      const [dx, dy] = DIRS[i]
      const nx = map.wrapX(pos.x + dx)
      const ny = Math.max(0, Math.min(map.height - 1, pos.y + dy))
      if (map.isPassable(nx, ny, isLand)) {
        map.moveEntity(entity.id as EntityId, pos.x, pos.y, nx, ny)
        pos.x = nx
        pos.y = ny
        break
      }
    }
  }
}
wanderSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, SpeciesRef]),
  Res.intoArgument(w, GameMap),
  Res.intoArgument(w, Rng),
]
