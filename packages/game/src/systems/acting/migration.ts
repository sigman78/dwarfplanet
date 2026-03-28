import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalBehaviorState, AnimalBehaviorPhase, MigrationState, SpeciesRef } from '../../components/animal'
import { GameMap } from '../../map/map'
import { getNextStep } from '../../map/navigation'
import { getSpeciesDef } from '../../species/defs'
import type { EntityId } from '../../types'

export function migrationSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, MigrationState, SpeciesRef]>,
  map: Res<GameMap>,
): void {
  for (const [entity, pos, bstate, migration, speciesRef] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Migrate) continue
    if (!migration.active) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    const isLand = def.habitat === 'land'
    const target = { x: migration.targetX, y: migration.targetY }
    const next = getNextStep({ x: pos.x, y: pos.y }, target, isLand, map)
    if (next.x !== pos.x || next.y !== pos.y) {
      map.moveEntity(entity.id as EntityId, pos.x, pos.y, next.x, next.y)
      pos.x = next.x
      pos.y = next.y
    }
  }
}
migrationSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, MigrationState, SpeciesRef]),
  Res.intoArgument(w, GameMap),
]
