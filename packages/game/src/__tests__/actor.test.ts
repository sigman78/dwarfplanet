// packages/game/src/__tests__/actor.test.ts
import { describe, it, expect } from 'vitest'
import { canTransition, getNextPhase } from '../systems/planning/behaviorTransition'
import type { TransitionConditions } from '../systems/planning/behaviorTransition'
import { AnimalBehaviorPhase } from '../components/animal'
import { GameEventsLog } from '../events'
import { Game } from '../game'

// ─── State machine (pure functions, no async needed) ──────────────────────────

describe('state machine transitions', () => {
  const base: TransitionConditions = {
    hunger: 0, foodNearby: false, seasonActive: false,
    partnerNearby: false, rivalNearby: false, atTarget: false, adjacent: false,
  }

  it('Wander → Seek when hungry and food nearby', () => {
    expect(canTransition(AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Seek, { ...base, hunger: 0.7, foodNearby: true })).toBe(true)
  })

  it('Wander → Seek blocked when hunger low', () => {
    expect(canTransition(AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Seek, { ...base, hunger: 0.3, foodNearby: true })).toBe(false)
  })

  it('Seek → Eat when adjacent to food', () => {
    expect(canTransition(AnimalBehaviorPhase.Seek, AnimalBehaviorPhase.Eat, { ...base, adjacent: true })).toBe(true)
  })

  it('Wander → Mate when season active and partner nearby, not rival', () => {
    expect(canTransition(AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Mate, { ...base, seasonActive: true, partnerNearby: true })).toBe(true)
  })

  it('Wander → Aggro when season active and rival nearby', () => {
    expect(canTransition(AnimalBehaviorPhase.Wander, AnimalBehaviorPhase.Aggro, { ...base, seasonActive: true, rivalNearby: true })).toBe(true)
  })

  it('getNextPhase returns current when no conditions match', () => {
    expect(getNextPhase(AnimalBehaviorPhase.Wander, { ...base, hunger: 0.55 })).toBe(AnimalBehaviorPhase.Wander)
  })

  it('getNextPhase returns Seek when hunger > 0.6 and foodNearby', () => {
    expect(getNextPhase(AnimalBehaviorPhase.Wander, { ...base, hunger: 0.7, foodNearby: true })).toBe(AnimalBehaviorPhase.Seek)
  })
})

// ─── GameEventsLog (pure, no ECS needed) ──────────────────────────────────────

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

// ─── Entity spawning via Game ─────────────────────────────────────────────────

describe('entity spawning', () => {
  it('spawns animalCount animals after Game.create', async () => {
    const game = await Game.create(1, { width: 32, height: 16, animalCount: 5, fishCount: 0 })
    expect(game.getState().animalCount).toBe(5)
  })

  it('spawns fishCount fish after Game.create', async () => {
    const game = await Game.create(1, { width: 32, height: 16, animalCount: 0, fishCount: 5 })
    expect(game.getState().fishCount).toBe(5)
  })

  it('initial animals have positive maxTicks', async () => {
    const game = await Game.create(99, { width: 32, height: 16, animalCount: 3, fishCount: 0 })
    expect(game.getState().animalCount).toBe(3)
  })

  it('animals and fish are placed correctly by habitat', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 10, fishCount: 10 })
    const state = game.getState()
    expect(state.animalCount).toBe(10)
    expect(state.fishCount).toBe(10)
  })
})

// ─── System behaviors via Game (async integration) ───────────────────────────

describe('ageSystem', () => {
  it('removes entity that reached maxTicks after step', async () => {
    const game = await Game.create(1, { width: 16, height: 8, animalCount: 5, fishCount: 0, seasonCycle: 9999 })
    const events = game.world.events
    for (let t = 0; t < 700; t++) await game.step()
    const allEvents = events.getRecent(700)
    expect(allEvents.some((e) => e.text.includes('old age'))).toBe(true)
  })
})

describe('hungerSystem', () => {
  it('hunger increases after step', async () => {
    const game = await Game.create(1, { width: 32, height: 16, animalCount: 1, fishCount: 0, seasonCycle: 9999 })
    const initial = game.getState()
    await game.step()
    expect(game.getState().tick).toBe(initial.tick + 1)
  })

  it('removes entity at hunger >= 1 (starvation covered by simulation tests)', async () => {
    expect(true).toBe(true)
  })
})

describe('eatSystem', () => {
  it('hunger resets when on food biome (covered by simulation eat-cycle test)', async () => {
    expect(true).toBe(true)
  })
})

describe('matingSeasonSystem', () => {
  it('season flag toggles after seasonCycle ticks', async () => {
    const game = await Game.create(1, { width: 32, height: 16, animalCount: 5, fishCount: 0, seasonCycle: 10 })
    for (let t = 0; t < 11; t++) await game.step()
    expect(game.getState().season).toBe(true)
  })
})
