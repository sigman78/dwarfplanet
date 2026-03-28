import { World as ThyseusWorld, Entity, Entities, Query } from 'thyseus'
import { GameMap } from './map/map'
import { generateMap } from './map/mapgen'
import { GameEventsLog } from './events'
import { WorldState } from './worldstate'
import { Rng } from './rng'
import { Position } from './components/position'
import {
  AnimalHealth, AnimalHunger, AnimalAge, SpeciesRef,
  AnimalBehaviorState, AnimalBehaviorPhase, ReproductiveState, ReproductivePhase, MigrationState,
} from './components/animal'
import { AnimalAwareness, AnimalSocialAwareness } from './components/perception'
import { SPECIES_LIST, SPECIES_DEFS, getSpeciesDef } from './species/defs'
import {
  SetupSchedule, PrePhaseSchedule, SensingSchedule, PlanningSchedule,
  ActingSchedule, ResolvingSchedule, registerSystems,
} from './schedule'
import { applyEntityUpdates } from 'thyseus'
import type { EntityId } from './types'

export type WorldConfig = {
  width?: number
  height?: number
  animalCount?: number
  fishCount?: number
  seasonCycle?: number
}

function makePopulateSystem(map: GameMap, rng: Rng, animalCount: number, fishCount: number) {
  const deerIdx = SPECIES_LIST.indexOf('deer')
  const salmonIdx = SPECIES_LIST.indexOf('salmon')

  function populateSystem(entities: Entities): void {
    let placed = 0
    while (placed < animalCount) {
      const x = rng.int(0, map.width - 1)
      const y = rng.int(0, map.height - 1)
      if (map.isPassable(x, y, true)) {
        const def = SPECIES_DEFS[SPECIES_LIST[deerIdx]]
        const lifespan = def.baseLifespan + rng.int(-def.lifespanVariance, def.lifespanVariance)
        const entity = entities.spawn()
        entities.add(entity, new Position(x, y))
        entities.add(entity, new AnimalHealth())
        entities.add(entity, new AnimalHunger(rng.float() * 0.3))
        entities.add(entity, new AnimalAge(0, lifespan))
        entities.add(entity, new SpeciesRef(deerIdx))
        entities.add(entity, new AnimalBehaviorState(AnimalBehaviorPhase.Wander, rng.int(5, 15)))
        entities.add(entity, new ReproductiveState(ReproductivePhase.Idle, 0))
        entities.add(entity, new MigrationState())
        entities.add(entity, new AnimalAwareness())
        entities.add(entity, new AnimalSocialAwareness())
        map.addEntity(entity.id as EntityId, x, y)
        placed++
      }
    }

    placed = 0
    while (placed < fishCount) {
      const x = rng.int(0, map.width - 1)
      const y = rng.int(0, map.height - 1)
      if (map.isPassable(x, y, false)) {
        const def = SPECIES_DEFS[SPECIES_LIST[salmonIdx]]
        const lifespan = def.baseLifespan + rng.int(-def.lifespanVariance, def.lifespanVariance)
        const entity = entities.spawn()
        entities.add(entity, new Position(x, y))
        entities.add(entity, new AnimalHealth())
        entities.add(entity, new AnimalHunger(rng.float() * 0.3))
        entities.add(entity, new AnimalAge(0, lifespan))
        entities.add(entity, new SpeciesRef(salmonIdx))
        entities.add(entity, new AnimalBehaviorState(AnimalBehaviorPhase.Wander, rng.int(5, 15)))
        entities.add(entity, new ReproductiveState(ReproductivePhase.Idle, 0))
        entities.add(entity, new MigrationState())
        entities.add(entity, new AnimalAwareness())
        entities.add(entity, new AnimalSocialAwareness())
        map.addEntity(entity.id as EntityId, x, y)
        placed++
      }
    }
  }
  populateSystem.getSystemArguments = (w: ThyseusWorld) => [w.entities]
  return populateSystem
}

export class GameWorld {
  readonly map: GameMap
  readonly events: GameEventsLog
  private readonly thyseusWorld: ThyseusWorld
  private readonly worldState: WorldState
  private readonly speciesRefQuery: Query<[Entity, SpeciesRef]>
  private readonly posSpeciesQuery: Query<[Entity, Position, SpeciesRef]>
  private readonly fullAnimalQuery: Query<[Entity, Position, AnimalHunger, AnimalAge, AnimalBehaviorState]>

  private constructor(
    map: GameMap,
    events: GameEventsLog,
    thyseusWorld: ThyseusWorld,
    worldState: WorldState,
    speciesRefQuery: Query<[Entity, SpeciesRef]>,
    posSpeciesQuery: Query<[Entity, Position, SpeciesRef]>,
    fullAnimalQuery: Query<[Entity, Position, AnimalHunger, AnimalAge, AnimalBehaviorState]>,
  ) {
    this.map = map
    this.events = events
    this.thyseusWorld = thyseusWorld
    this.worldState = worldState
    this.speciesRefQuery = speciesRefQuery
    this.posSpeciesQuery = posSpeciesQuery
    this.fullAnimalQuery = fullAnimalQuery
  }

  static async create(rng: Rng, config: WorldConfig = {}): Promise<GameWorld> {
    const width = config.width ?? 1024
    const height = config.height ?? 512
    const seasonCycle = config.seasonCycle ?? 200
    const animalCount = config.animalCount ?? 20
    const fishCount = config.fishCount ?? 15

    const map = new GameMap(width, height)
    const events = new GameEventsLog()
    const worldState = new WorldState(seasonCycle)

    generateMap(map, rng)

    const world = new ThyseusWorld()
    world.insertResource(map)
    world.insertResource(events)
    world.insertResource(worldState)
    world.insertResource(rng)

    registerSystems(world)

    world.addSystems(SetupSchedule, [
      makePopulateSystem(map, rng, animalCount, fishCount),
      applyEntityUpdates,
    ])

    const speciesRefQuery = Query.intoArgument(world, [Entity, SpeciesRef]) as Query<[Entity, SpeciesRef]>
    const posSpeciesQuery = Query.intoArgument(world, [Entity, Position, SpeciesRef]) as Query<[Entity, Position, SpeciesRef]>
    const fullAnimalQuery = Query.intoArgument(world, [Entity, Position, AnimalHunger, AnimalAge, AnimalBehaviorState]) as Query<[Entity, Position, AnimalHunger, AnimalAge, AnimalBehaviorState]>

    await world.prepare()
    await world.runSchedule(SetupSchedule)

    return new GameWorld(map, events, world, worldState, speciesRefQuery, posSpeciesQuery, fullAnimalQuery)
  }

  async step(): Promise<void> {
    await this.thyseusWorld.runSchedule(PrePhaseSchedule)
    await this.thyseusWorld.runSchedule(SensingSchedule)
    await this.thyseusWorld.runSchedule(PlanningSchedule)
    await this.thyseusWorld.runSchedule(ActingSchedule)
    await this.thyseusWorld.runSchedule(ResolvingSchedule)
  }

  getState() {
    let animalCount = 0
    let fishCount = 0
    for (const [, speciesRef] of this.speciesRefQuery) {
      const def = getSpeciesDef(speciesRef.speciesId)
      if (def.habitat === 'land') animalCount++
      else fishCount++
    }
    return {
      tick: this.worldState.tick,
      season: this.worldState.season,
      animalCount,
      fishCount,
    }
  }

  iterateActors(callback: (x: number, y: number, habitat: 'land' | 'water') => void): void {
    for (const [, pos, speciesRef] of this.posSpeciesQuery) {
      const def = getSpeciesDef(speciesRef.speciesId)
      callback(pos.x, pos.y, def.habitat)
    }
  }

  getEntityInfo(index: number): { x: number; y: number; hunger: number; ageTicks: number; phase: AnimalBehaviorPhase } | null {
    for (const [entity, pos, hunger, age, bstate] of this.fullAnimalQuery) {
      if (entity.id === index) return { x: pos.x, y: pos.y, hunger: hunger.value, ageTicks: age.ticks, phase: bstate.phase }
    }
    return null
  }

  snapshotActors(): Array<{ id: number; x: number; y: number; hunger: number; ageTicks: number; phase: AnimalBehaviorPhase }> {
    const result: Array<{ id: number; x: number; y: number; hunger: number; ageTicks: number; phase: AnimalBehaviorPhase }> = []
    for (const [entity, pos, hunger, age, bstate] of this.fullAnimalQuery) {
      result.push({ id: entity.id, x: pos.x, y: pos.y, hunger: hunger.value, ageTicks: age.ticks, phase: bstate.phase })
    }
    return result
  }
}
