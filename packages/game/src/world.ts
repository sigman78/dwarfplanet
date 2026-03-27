import { World as EcsWorld } from 'miniplex'
import type { PawnComponents, PawnKind } from './actor/components'
import { GameMap } from './map/map'
import { generateMap } from './map/mapgen'
import { GameEventsLog } from './events'
import { Processor } from './processor'
import type { PawnQueries, WorldState } from './context'
import {
  ageSystem,
  hungerSystem,
  matingSeasonSystem,
  stateTransitionSystem,
  wanderSystem,
  seekSystem,
  eatSystem,
  migrateSystem,
  mateSystem,
  aggroSystem,
} from './actor/systems'
import type { Rng } from './rng'
import { spawnAnimal, spawnFish } from './actor/actorgen'

export type WorldConfig = {
  width?: number
  height?: number
  animalCount?: number
  fishCount?: number
  seasonCycle?: number
}

export class GameWorld {
  readonly ecs: EcsWorld<PawnComponents>
  readonly map: GameMap
  readonly events: GameEventsLog
  private readonly processor: Processor
  private worldState: WorldState
  private readonly queries: PawnQueries

  constructor(rng: Rng, config: WorldConfig = {}) {
    const width = config.width ?? 1024
    const height = config.height ?? 512

    this.ecs = new EcsWorld<PawnComponents>()
    this.map = new GameMap(width, height)
    this.events = new GameEventsLog()
    this.processor = new Processor()
    this.worldState = {
      tick: 0,
      season: false,
      seasonCycle: config.seasonCycle ?? 200,
      nextSeasonTick: config.seasonCycle ?? 200,
      nextEntityId: 1,
    }

    this.queries = {
      withAge: this.ecs.with('age', 'id'),
      withHunger: this.ecs.with('hunger', 'kind', 'id'),
      withMating: this.ecs.with('mating'),
      withNeighborData: this.ecs.with('id', 'kind', 'mating'),
      withBehaviorState: this.ecs.with('behaviorState', 'position', 'kind', 'id'),
      withBehaviorStatePosition: this.ecs.with('behaviorState', 'position', 'hunger', 'kind', 'mating', 'id'),
      withFullPawn: this.ecs.with('behaviorState', 'position', 'hunger', 'kind'),
      withMigrateTarget: this.ecs.with('behaviorState', 'position', 'kind', 'id', 'migrateTarget'),
      withAggroActor: this.ecs.with('behaviorState', 'position', 'health', 'kind', 'id', 'mating'),
      withHealth: this.ecs.with('id', 'kind', 'health'),
    }

    generateMap(this.map, rng)
    this.populate(rng, config.animalCount ?? 20, config.fishCount ?? 15)
    this.registerSystems()
  }

  private populate(rng: Rng, animalCount: number, fishCount: number): void {
    let placed = 0
    while (placed < animalCount) {
      const x = rng.int(0, this.map.width - 1)
      const y = rng.int(0, this.map.height - 1)
      if (this.map.isPassable(x, y, true)) {
        const id = this.worldState.nextEntityId++
        spawnAnimal(this.ecs, { x, y }, rng, id)
        this.map.addEntity(id, x, y)
        placed++
      }
    }
    placed = 0
    while (placed < fishCount) {
      const x = rng.int(0, this.map.width - 1)
      const y = rng.int(0, this.map.height - 1)
      if (this.map.isPassable(x, y, false)) {
        const id = this.worldState.nextEntityId++
        spawnFish(this.ecs, { x, y }, rng, id)
        this.map.addEntity(id, x, y)
        placed++
      }
    }
  }

  private registerSystems(): void {
    this.processor.register(ageSystem)
    this.processor.register(hungerSystem)
    this.processor.register(matingSeasonSystem)
    this.processor.register(stateTransitionSystem)
    this.processor.register(wanderSystem)
    this.processor.register(seekSystem)
    this.processor.register(eatSystem)
    this.processor.register(migrateSystem)
    this.processor.register(mateSystem)
    this.processor.register(aggroSystem)
  }

  step(rng: Rng): void {
    this.worldState.tick++
    if (this.worldState.tick >= this.worldState.nextSeasonTick) {
      this.worldState.season = !this.worldState.season
      this.worldState.nextSeasonTick = this.worldState.tick + this.worldState.seasonCycle
      this.events.emit({
        tick: this.worldState.tick,
        origin: 'global',
        importance: 2,
        text: this.worldState.season ? 'mating season began' : 'mating season ended',
      })
    }

    const neighborById = new Map<number, { id: number; kind: PawnKind; mating: { season: boolean; refractory: boolean } }>()
    for (const n of this.queries.withNeighborData) {
      neighborById.set(n.id!, { id: n.id!, kind: n.kind!, mating: n.mating! })
    }

    this.processor.tick({
      ecs: this.ecs,
      map: this.map,
      rng,
      worldState: this.worldState,
      events: this.events,
      queries: this.queries,
      neighborById,
    })

    this.events.compact(this.worldState.tick)
  }

  getState() {
    let animalCount = 0
    let fishCount = 0
    for (const e of this.ecs.with('kind')) {
      if (e.kind === 'animal') animalCount++
      else fishCount++
    }
    return {
      tick: this.worldState.tick,
      season: this.worldState.season,
      animalCount,
      fishCount,
    }
  }
}
