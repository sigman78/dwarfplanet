import { Entities } from 'thyseus'
import {
  Position, AnimalHealth, AnimalHunger, AnimalAge, SpeciesRef,
  AnimalBehaviorState, ReproductiveState, MigrationState,
  AnimalAwareness, AnimalSocialAwareness,
} from '@/components'
import { GameMap } from '@/map'
import type { EntityId } from '@/types'

export function spawnAnimal(
  entities: Entities,
  map: GameMap,
  x: number,
  y: number,
  speciesIdx: number,
  lifespan: number,
  initialHunger: number,
  behaviorTimer: number,
) {
  const entity = entities.spawn()
  entities.add(entity, Object.assign(new Position(), { x, y }))
  entities.add(entity, new AnimalHealth())
  entities.add(entity, Object.assign(new AnimalHunger(), { value: initialHunger }))
  entities.add(entity, Object.assign(new AnimalAge(), { maxTicks: lifespan }))
  entities.add(entity, Object.assign(new SpeciesRef(), { speciesId: speciesIdx }))
  entities.add(entity, Object.assign(new AnimalBehaviorState(), { timer: behaviorTimer }))
  entities.add(entity, new ReproductiveState())
  entities.add(entity, new MigrationState())
  entities.add(entity, new AnimalAwareness())
  entities.add(entity, new AnimalSocialAwareness())
  map.addEntity(entity.id as EntityId, x, y)
  return entity
}
