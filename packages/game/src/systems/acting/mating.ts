import type { World } from 'thyseus'
import { Entities, Entity, Query, Res } from 'thyseus'
import { Position } from '../../components/position'
import {
  AnimalBehaviorState, AnimalBehaviorPhase, AnimalHunger, AnimalAge,
  AnimalHealth, ReproductiveState, ReproductivePhase, MigrationState, SpeciesRef,
} from '../../components/animal'
import { AnimalAwareness, AnimalSocialAwareness } from '../../components/perception'
import { GameMap } from '../../map/map'
import { Rng } from '../../rng'
import { GameEventsLog } from '../../events'
import { WorldState } from '../../worldstate'
import { getSpeciesDef } from '../../species/defs'
import type { EntityId } from '../../types'

export function matingSystem(
  query: Query<[Entity, Position, AnimalBehaviorState, ReproductiveState, SpeciesRef]>,
  entities: Entities,
  map: Res<GameMap>,
  rng: Res<Rng>,
  events: Res<GameEventsLog>,
  worldState: Res<WorldState>,
): void {
  for (const [entity, pos, bstate, repro, speciesRef] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Mate) continue
    const def = getSpeciesDef(speciesRef.speciesId)
    const count = rng.int(1, def.maxOffspring)
    for (let i = 0; i < count; i++) {
      const nx = map.wrapX(pos.x + rng.int(-2, 2))
      const ny = Math.max(0, Math.min(map.height - 1, pos.y + rng.int(-2, 2)))
      const lifespan = def.baseLifespan + rng.int(-def.lifespanVariance, def.lifespanVariance)
      const child = entities.spawn()
        .add(new Position(nx, ny))
        .add(new AnimalHealth())
        .add(new AnimalHunger(rng.float() * 0.3))
        .add(new AnimalAge(0, lifespan))
        .add(new SpeciesRef(speciesRef.speciesId))
        .add(new AnimalBehaviorState(AnimalBehaviorPhase.Wander, rng.int(5, 15)))
        .add(new ReproductiveState(ReproductivePhase.Idle, 0))
        .add(new MigrationState())
        .add(new AnimalAwareness())
        .add(new AnimalSocialAwareness())
      map.addEntity(child.id as EntityId, nx, ny)
    }
    events.emit({
      tick: worldState.tick,
      origin: entity.id as EntityId,
      importance: 2,
      text: `mating: ${count} offspring`,
    })
    repro.phase = ReproductivePhase.Refractory
    repro.timer = 20
    bstate.phase = AnimalBehaviorPhase.Wander
    bstate.timer = 20
  }
}
matingSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, Position, AnimalBehaviorState, ReproductiveState, SpeciesRef]),
  w.entities,
  Res.intoArgument(w, GameMap),
  Res.intoArgument(w, Rng),
  Res.intoArgument(w, GameEventsLog),
  Res.intoArgument(w, WorldState),
]
