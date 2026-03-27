import type { World as EcsWorld } from 'miniplex'
import type { GameMap } from './map/map'
import type { Rng } from './rng'
import type { GameEventsLog } from './events'
import type { PawnComponents, PawnKind, Mating } from './actor/components'
import type { EntityId } from './types'

export type WorldState = {
  tick: number
  season: boolean
  seasonCycle: number
  nextSeasonTick: number
}

export type PawnQueries = {
  withAge: ReturnType<EcsWorld<PawnComponents>['with']>
  withHunger: ReturnType<EcsWorld<PawnComponents>['with']>
  withMating: ReturnType<EcsWorld<PawnComponents>['with']>
  withNeighborData: ReturnType<EcsWorld<PawnComponents>['with']>
  withBehaviorState: ReturnType<EcsWorld<PawnComponents>['with']>
  withBehaviorStatePosition: ReturnType<EcsWorld<PawnComponents>['with']>
  withFullPawn: ReturnType<EcsWorld<PawnComponents>['with']>
  withMigrateTarget: ReturnType<EcsWorld<PawnComponents>['with']>
  withAggroActor: ReturnType<EcsWorld<PawnComponents>['with']>
  withHealth: ReturnType<EcsWorld<PawnComponents>['with']>
}

export type SystemContext = {
  ecs: EcsWorld<PawnComponents>
  map: GameMap
  rng: Rng
  worldState: WorldState
  events: GameEventsLog
  queries: PawnQueries
  neighborById: Map<EntityId, { kind: PawnKind; mating: Mating }>
}
