import type { World } from 'miniplex'
import type { GameMap } from './map/map'
import type { Rng } from './rng'
import type { GameEventsLog } from './events'
import type { EntityComponents } from './actor/components'

export type WorldState = {
  tick: number
  season: boolean
  seasonCycle: number
  nextSeasonTick: number
  nextEntityId: number
}

export type SystemContext = {
  ecs: World<EntityComponents>
  map: GameMap
  rng: Rng
  worldState: WorldState
  events: GameEventsLog
}
