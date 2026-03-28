import { World as ThyseusWorld, Entity, Query } from 'thyseus'
import { GameMap, generateMap } from '@/map'
import { GameEventsLog } from '@/events'
import { WorldState } from '@/worldstate'
import { Rng } from '@/rng'
import { Position, SpeciesRef, AnimalBehaviorPhase, AnimalHunger, AnimalAge, AnimalBehaviorState } from '@/components'
import { SPECIES_LIST, getSpeciesDef } from '@/species/defs'
import {
  SetupSchedule, PrePhaseSchedule, SensingSchedule, PlanningSchedule,
  ActingSchedule, ResolvingSchedule, registerSystems,
} from '@/schedule'
import { makePopulateSystem } from '@/systems/prephase'
import { applyEntityUpdates } from 'thyseus'
import type { EntityId } from '@/types'

export type WorldConfig = {
  width?: number
  height?: number
  animalCount?: number
  fishCount?: number
  seasonCycle?: number
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
      makePopulateSystem(animalCount, fishCount),
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
