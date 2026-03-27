import { describe, it, expect } from 'vitest'
import { Processor } from '../processor'
import { GameEventsLog } from '../events'
import { PawnState, canTransition, getNextState } from '../actor/statemachine'
import { World } from 'miniplex'
import type { PawnComponents } from '../actor/components'
import { spawnAnimal, spawnFish } from '../actor/actorgen'
import { Rng } from '../rng'
import { GameMap } from '../map/map'
import { Biome } from '../map/tiles'
import type { WorldState, SystemContext } from '../context'
import {
  ageSystem,
  hungerSystem,
  matingSeasonSystem,
  eatSystem,
} from '../actor/systems'

function makeCtx(ecs: World<PawnComponents>, map: GameMap, rng: Rng, worldState?: Partial<WorldState>): SystemContext {
  return {
    ecs,
    map,
    rng,
    events: new GameEventsLog(),
    worldState: {
      tick: 0,
      season: false,
      seasonCycle: 100,
      nextSeasonTick: 100,
      ...worldState,
    },
    queries: {
      withAge: ecs.with('age'),
      withHunger: ecs.with('hunger', 'kind'),
      withMating: ecs.with('mating'),
      withNeighborData: ecs.with('kind', 'mating'),
      withBehaviorState: ecs.with('behaviorState', 'position', 'kind'),
      withBehaviorStatePosition: ecs.with('behaviorState', 'position', 'hunger', 'kind', 'mating'),
      withFullPawn: ecs.with('behaviorState', 'position', 'hunger', 'kind'),
      withMigrateTarget: ecs.with('behaviorState', 'position', 'kind', 'migrateTarget'),
      withAggroActor: ecs.with('behaviorState', 'position', 'health', 'kind', 'mating'),
      withHealth: ecs.with('kind', 'health'),
    },
    neighborById: new Map(),
  }
}

describe('state machine transitions', () => {
  it('Wander → Seek when hungry and food nearby', () => {
    expect(
      canTransition(PawnState.Wander, PawnState.Seek, {
        hunger: 0.7,
        foodNearby: true,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(true)
  })

  it('Wander → Seek blocked when hunger low', () => {
    expect(
      canTransition(PawnState.Wander, PawnState.Seek, {
        hunger: 0.3,
        foodNearby: true,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(false)
  })

  it('Seek → Eat when adjacent to food', () => {
    expect(
      canTransition(PawnState.Seek, PawnState.Eat, {
        hunger: 0.8,
        foodNearby: true,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: true,
      }),
    ).toBe(true)
  })

  it('Wander → Mate when season active and partner nearby, not aggro', () => {
    expect(
      canTransition(PawnState.Wander, PawnState.Mate, {
        hunger: 0.3,
        foodNearby: false,
        seasonActive: true,
        partnerNearby: true,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(true)
  })

  it('Wander → Aggro when season active and rival nearby', () => {
    expect(
      canTransition(PawnState.Wander, PawnState.Aggro, {
        hunger: 0.3,
        foodNearby: false,
        seasonActive: true,
        partnerNearby: false,
        rivalNearby: true,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(true)
  })

  it('getNextState returns current state when no conditions match', () => {
    // hunger=0.55 avoids Wander->Seek (needs >0.6) and Wander->Migrate (needs <0.5); all boolean conditions false
    expect(
      getNextState(PawnState.Wander, {
        hunger: 0.55,
        foodNearby: false,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(PawnState.Wander)
  })

  it('getNextState returns Seek when hunger > 0.6 and foodNearby', () => {
    expect(
      getNextState(PawnState.Wander, {
        hunger: 0.7,
        foodNearby: true,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(PawnState.Seek)
  })
})

describe('actorgen', () => {
  it('spawnAnimal creates entity with all required components', () => {
    const ecs = new World<PawnComponents>()
    const rng = new Rng(1)
    spawnAnimal(ecs, { x: 5, y: 5 }, rng)
    const actors = ecs.with('position', 'health', 'kind', 'behaviorState', 'hunger', 'age', 'mating')
    expect([...actors].length).toBe(1)
    const e = [...actors][0]
    expect(e.kind).toBe('animal')
    expect(e.position!.x).toBe(5)
    expect(e.age!.maxTicks).toBeGreaterThan(0)
  })

  it('spawnFish creates entity with subtype fish', () => {
    const ecs = new World<PawnComponents>()
    spawnFish(ecs, { x: 2, y: 3 }, new Rng(2))
    const fish = ecs.with('kind')
    expect([...fish][0].kind).toBe('fish')
  })

  it('age maxTicks has variance between spawns', () => {
    const ecs = new World<PawnComponents>()
    const rng = new Rng(99)
    spawnAnimal(ecs, { x: 0, y: 0 }, rng)
    spawnAnimal(ecs, { x: 1, y: 0 }, rng)
    const actors = [...ecs.with('age')]
    const ticks = actors.map((e) => e.age!.maxTicks)
    expect(ticks[0]).toBeGreaterThan(0)
    expect(ticks[0]).not.toBe(ticks[1])
  })
})

describe('GameEventsLog', () => {
  it('emits and retrieves events', () => {
    const log = new GameEventsLog()
    log.emit({ tick: 1, origin: 'global', importance: 1, text: 'test event' })
    expect(log.getRecent(10).length).toBe(1)
    expect(log.getRecent(10)[0].text).toBe('test event')
  })

  it('compacts when more than 5 same-type events in one tick', () => {
    const log = new GameEventsLog()
    for (let i = 0; i < 7; i++) {
      log.emit({ tick: 5, origin: 'global', importance: 1, text: 'actor died' })
    }
    log.compact(5)
    const events = log.getRecent(10)
    expect(events.length).toBeLessThan(7)
    expect(events.some((e) => e.text.includes('7'))).toBe(true)
  })
})

describe('ageSystem', () => {
  it('removes entity that reached maxTicks', () => {
    const ecs = new World<PawnComponents>()
    spawnAnimal(ecs, { x: 0, y: 0 }, new Rng(1))
    const e = [...ecs.with('age')][0]
    e.age!.ticks = e.age!.maxTicks
    const map = new GameMap(10, 10)
    ageSystem(makeCtx(ecs, map, new Rng(1)))
    expect([...ecs.with('age')].length).toBe(0)
  })
})

describe('hungerSystem', () => {
  it('removes entity at hunger >= 1', () => {
    const ecs = new World<PawnComponents>()
    spawnAnimal(ecs, { x: 0, y: 0 }, new Rng(1))
    const e = [...ecs.with('hunger')][0]
    e.hunger!.value = 1.0
    hungerSystem(makeCtx(ecs, new GameMap(10, 10), new Rng(1)))
    expect([...ecs.with('hunger')].length).toBe(0)
  })

  it('increments hunger each tick', () => {
    const ecs = new World<PawnComponents>()
    spawnAnimal(ecs, { x: 0, y: 0 }, new Rng(1))
    const before = [...ecs.with('hunger')][0].hunger!.value
    hungerSystem(makeCtx(ecs, new GameMap(10, 10), new Rng(1)))
    const after = [...ecs.with('hunger')][0].hunger!.value
    expect(after).toBeGreaterThan(before)
  })
})

describe('eatSystem', () => {
  it('resets hunger when actor is on food biome', () => {
    const ecs = new World<PawnComponents>()
    const rng = new Rng(1)
    spawnAnimal(ecs, { x: 5, y: 5 }, rng)
    const map = new GameMap(10, 10)
    map.setBiome(5, 5, Biome.Grassland)
    const e = [...ecs.with('hunger', 'behaviorState')][0]
    e.hunger!.value = 0.8
    e.behaviorState!.state = PawnState.Eat
    eatSystem(makeCtx(ecs, map, rng))
    expect(e.hunger!.value).toBe(0)
  })
})

describe('matingSeasonSystem', () => {
  it('sets season flag on actors when world season is active', () => {
    const ecs = new World<PawnComponents>()
    spawnAnimal(ecs, { x: 0, y: 0 }, new Rng(1))
    matingSeasonSystem(makeCtx(ecs, new GameMap(10, 10), new Rng(1), { season: true }))
    const e = [...ecs.with('mating')][0]
    expect(e.mating!.season).toBe(true)
  })
})

describe('Processor', () => {
  it('executes registered systems in order', () => {
    const log: number[] = []
    const p = new Processor()
    p.register((_ctx: SystemContext) => { log.push(1) })
    p.register((_ctx: SystemContext) => { log.push(2) })
    const ctx = makeCtx(new World<PawnComponents>(), new GameMap(10, 10), new Rng(1))
    p.tick(ctx)
    expect(log).toEqual([1, 2])
  })
})
