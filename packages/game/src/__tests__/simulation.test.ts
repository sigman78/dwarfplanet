import { describe, it, expect } from 'vitest'
import { Game } from '../game'
import { PawnState } from '../actor/statemachine'

describe('simulation integration', () => {
  it('runs 200 ticks without population extinction or explosion', () => {
    const game = new Game(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })

    for (let t = 0; t < 200; t++) {
      game.step()
      const { animalCount, fishCount } = game.getState()
      expect(animalCount + fishCount).toBeGreaterThan(0)
      expect(animalCount + fishCount).toBeLessThan(500)
    }
  })

  it('produces at least one mating event over 200 ticks', () => {
    const game = new Game(42, { width: 64, height: 32, animalCount: 20, fishCount: 15, seasonCycle: 30 })

    for (let t = 0; t < 200; t++) game.step()

    const allEvents = game.world.events.getRecent(200)
    const matingEvents = allEvents.filter((e) => e.text.includes('offspring'))
    expect(matingEvents.length).toBeGreaterThan(0)
  })

  it('produces at least one death by old age over 200 ticks', () => {
    const game = new Game(7, { width: 64, height: 32, animalCount: 30, fishCount: 20 })

    for (let t = 0; t < 200; t++) game.step()

    const allEvents = game.world.events.getRecent(200)
    const ageDeaths = allEvents.filter((e) => e.text.includes('old age'))
    expect(ageDeaths.length).toBeGreaterThan(0)
  })

  it('is deterministic: same seed produces same final state', () => {
    const runSim = () => {
      const g = new Game(123, { width: 32, height: 16, animalCount: 10, fishCount: 8 })
      for (let t = 0; t < 50; t++) g.step()
      return g.getState()
    }

    expect(runSim()).toEqual(runSim())
  })

  it('at least one actor moves position within 20 ticks', () => {
    const game = new Game(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })
    const initialPositions = new Map<number, { x: number; y: number }>()
    for (const e of game.world.ecs.with('id', 'position')) {
      initialPositions.set(e.id!, { x: e.position!.x, y: e.position!.y })
    }
    for (let t = 0; t < 20; t++) game.step()
    let moved = false
    for (const e of game.world.ecs.with('id', 'position')) {
      const init = initialPositions.get(e.id!)
      if (init && (e.position!.x !== init.x || e.position!.y !== init.y)) {
        moved = true
        break
      }
    }
    expect(moved).toBe(true)
  })

  it('at least one actor hunger resets to 0 within 200 ticks', () => {
    const game = new Game(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })
    let minHunger = Infinity
    for (let t = 0; t < 200; t++) {
      game.step()
      for (const e of game.world.ecs.with('hunger')) {
        if (e.hunger!.value < minHunger) minHunger = e.hunger!.value
      }
    }
    expect(minHunger).toBe(0)
  })

  it('all actors age by exactly 10 ticks over 10 steps', () => {
    const game = new Game(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })
    const initialAges = new Map<number, number>()
    for (const e of game.world.ecs.with('id', 'age')) {
      initialAges.set(e.id!, e.age!.ticks)
    }
    for (let t = 0; t < 10; t++) game.step()
    for (const e of game.world.ecs.with('id', 'age')) {
      const initial = initialAges.get(e.id!)
      if (initial === undefined) continue
      expect(e.age!.ticks).toBe(initial + 10)
    }
  })

  it('actors reach non-Wander states within 200 ticks', () => {
    const game = new Game(42, { width: 64, height: 32, animalCount: 50, fishCount: 0, seasonCycle: 30 })
    const nonWanderStates = new Set<string>()
    for (let t = 0; t < 200; t++) {
      game.step()
      for (const e of game.world.ecs.with('behaviorState')) {
        const s = e.behaviorState!.state
        if (s !== PawnState.Wander) nonWanderStates.add(s)
      }
    }
    expect(nonWanderStates.size).toBeGreaterThan(0)
  })

  it('fish population decreases after 250 ticks due to old age', () => {
    const game = new Game(42, { width: 64, height: 32, animalCount: 0, fishCount: 20 })
    for (let t = 0; t < 250; t++) game.step()
    expect(game.getState().fishCount).toBeLessThan(20)
  })
})
