import type { World } from 'thyseus'
import { Entity, Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import { AnimalSocialAwareness } from '../../components/perception'
import { SpeciesRef, ReproductiveState, ReproductivePhase } from '../../components/animal'
import { GameMap } from '../../map/map'
import { getSpeciesDef } from '../../species/defs'
import type { EntityId } from '../../types'

export function socialAwarenessSystem(
  query: Query<[Entity, Position, AnimalSocialAwareness, SpeciesRef, ReproductiveState]>,
  map: GameMap,
): void {
  // Build snapshot once: entity.id -> { speciesId, reproPhase }
  const snapshot = new Map<number, { speciesId: number; reproPhase: ReproductivePhase }>()
  for (const [entity, , , speciesRef, repro] of query) {
    snapshot.set(entity.id, { speciesId: speciesRef.speciesId, reproPhase: repro.phase })
  }

  for (const [entity, pos, awareness, speciesRef, repro] of query) {
    const def = getSpeciesDef(speciesRef.speciesId)
    const nearbyIds = map.getEntitiesInRadius(pos.x, pos.y, def.senseRadius)
    let mateNearby = false
    let threatNearby = false
    for (const nid of nearbyIds) {
      const nidNum = nid as unknown as number
      if (nidNum === entity.id) continue
      const neighbor = snapshot.get(nidNum)
      if (!neighbor) continue
      if (neighbor.speciesId === speciesRef.speciesId) {
        if (repro.phase === ReproductivePhase.Seeking && neighbor.reproPhase !== ReproductivePhase.Refractory) {
          mateNearby = true
        } else if (repro.phase === ReproductivePhase.Seeking && neighbor.reproPhase === ReproductivePhase.Refractory) {
          threatNearby = true
        }
      }
    }
    awareness.mateNearby = mateNearby
    awareness.threatNearby = threatNearby
  }
}
socialAwarenessSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalSocialAwareness, SpeciesRef, ReproductiveState]),
  Res.intoArgument(w, GameMap),
]
