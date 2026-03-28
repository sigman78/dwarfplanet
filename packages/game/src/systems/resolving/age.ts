import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalAge } from '../../components/animal'
import { GameMap } from '../../map/map'
import { GameEventsLog } from '../../events'
import { WorldState } from '../../worldstate'
import type { EntityId } from '../../types'

export function ageSystem(
  query: Query<[Entity, Position, AnimalAge]>,
  map: Res<GameMap>,
  events: Res<GameEventsLog>,
  worldState: Res<WorldState>,
): void {
  for (const [entity, pos, age] of query) {
    if (!entity.isAlive || worldState.despawnedThisTick.has(entity.id)) continue
    age.ticks++
    if (age.ticks >= age.maxTicks) {
      map.removeEntity(entity.id as EntityId, pos.x, pos.y)
      events.emit({ tick: worldState.tick, origin: entity.id as EntityId, importance: 1, text: 'actor died (old age)' })
      worldState.despawnedThisTick.add(entity.id)
      entity.despawn()
    }
  }
}
ageSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalAge]),
  Res.intoArgument(w, GameMap),
  Res.intoArgument(w, GameEventsLog),
  Res.intoArgument(w, WorldState),
]
