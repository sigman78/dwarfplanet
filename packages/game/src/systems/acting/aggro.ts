import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalBehaviorState, AnimalBehaviorPhase, AnimalHealth } from '../../components/animal'
import { GameMap } from '../../map/map'
import { GameEventsLog } from '../../events'
import { WorldState } from '../../worldstate'
import type { EntityId } from '../../types'

const AGGRO_DAMAGE = 20

export function aggroSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, AnimalHealth]>,
  map: Res<GameMap>,
  events: Res<GameEventsLog>,
  worldState: Res<WorldState>,
): void {
  const healthById = new Map<number, AnimalHealth>()
  const posById = new Map<number, Position>()
  const entityById = new Map<number, Entity>()

  for (const [entity, pos, , health] of query) {
    healthById.set(entity.id, health)
    posById.set(entity.id, pos)
    entityById.set(entity.id, entity)
  }

  for (const [entity, pos, bstate] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Aggro) continue
    const nearbyIds = map.getEntitiesInRadius(pos.x, pos.y, 5)
    for (const nid of nearbyIds) {
      const nidNum = nid as unknown as number
      if (nidNum === entity.id) continue
      const rivalHealth = healthById.get(nidNum)
      if (!rivalHealth) continue
      rivalHealth.value -= AGGRO_DAMAGE
      if (rivalHealth.value <= 0) {
        const rival = entityById.get(nidNum)
        if (rival && rival.isAlive) {
          const rivalPos = posById.get(nidNum)
          if (rivalPos) map.removeEntity(nid as unknown as EntityId, rivalPos.x, rivalPos.y)
          events.emit({ tick: worldState.tick, origin: nidNum as EntityId, importance: 1, text: 'actor died (aggro)' })
          rival.despawn()
        }
      }
    }
  }
}
aggroSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, AnimalHealth]),
  Res.intoArgument(w, GameMap),
  Res.intoArgument(w, GameEventsLog),
  Res.intoArgument(w, WorldState),
]
