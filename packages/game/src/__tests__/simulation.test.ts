import { describe, it, expect } from 'vitest'
import { Game } from '@/game'
import { AnimalBehaviorPhase } from '@/components'

describe('simulation integration', () => {
  it('runs 200 ticks without population extinction or explosion', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })

    for (let t = 0; t < 200; t++) {
      await game.step()
      const { animalCount, fishCount } = game.getState()
      expect(animalCount + fishCount).toBeGreaterThan(0)
      expect(animalCount + fishCount).toBeLessThan(500)
    }
  })

  it('produces at least one mating event over 200 ticks', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 20, fishCount: 15, seasonCycle: 30 })

    for (let t = 0; t < 200; t++) await game.step()

    const allEvents = game.world.events.getRecent(200)
    const matingEvents = allEvents.filter((e) => e.text.includes('offspring'))
    expect(matingEvents.length).toBeGreaterThan(0)
  })

  it('produces at least one death by old age over 200 ticks', async () => {
    const game = await Game.create(7, { width: 64, height: 32, animalCount: 30, fishCount: 20 })

    for (let t = 0; t < 200; t++) await game.step()

    const allEvents = game.world.events.getRecent(200)
    const ageDeaths = allEvents.filter((e) => e.text.includes('old age'))
    expect(ageDeaths.length).toBeGreaterThan(0)
  })

  it('is deterministic: same seed produces same final state', async () => {
    const runSim = async () => {
      const g = await Game.create(123, { width: 32, height: 16, animalCount: 10, fishCount: 8 })
      for (let t = 0; t < 50; t++) await g.step()
      return g.getState()
    }

    const [a, b] = await Promise.all([runSim(), runSim()])
    expect(a).toEqual(b)
  })

  it('at least one actor moves position within 20 ticks', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })
    const initial = game.world.snapshotActors()
    const initialPos = new Map(initial.map((a) => [a.id, { x: a.x, y: a.y }]))
    for (let t = 0; t < 20; t++) await game.step()
    const after = game.world.snapshotActors()
    const moved = after.some((a) => {
      const init = initialPos.get(a.id)
      return init !== undefined && (a.x !== init.x || a.y !== init.y)
    })
    expect(moved).toBe(true)
  })

  it('at least one actor hunger resets near 0 within 200 ticks (eat-cycle)', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })
    let minHunger = Infinity
    for (let t = 0; t < 200; t++) {
      await game.step()
      for (const actor of game.world.snapshotActors()) {
        if (actor.hunger < minHunger) minHunger = actor.hunger
      }
    }
    expect(minHunger).toBeLessThan(0.05)
  })

  it('all actors age by exactly 10 ticks over 10 steps', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 20, fishCount: 15 })
    const initialAges = new Map(game.world.snapshotActors().map((a) => [a.id, a.ageTicks]))
    for (let t = 0; t < 10; t++) await game.step()
    for (const actor of game.world.snapshotActors()) {
      const initial = initialAges.get(actor.id)
      if (initial === undefined) continue
      expect(actor.ageTicks).toBe(initial + 10)
    }
  })

  it('actors reach non-Wander states within 200 ticks', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 50, fishCount: 0, seasonCycle: 30 })
    const nonWanderStates = new Set<AnimalBehaviorPhase>()
    for (let t = 0; t < 200; t++) {
      await game.step()
      for (const actor of game.world.snapshotActors()) {
        if (actor.phase !== AnimalBehaviorPhase.Wander) nonWanderStates.add(actor.phase)
      }
    }
    expect(nonWanderStates.size).toBeGreaterThan(0)
  })

  it('fish population decreases after 250 ticks due to old age', async () => {
    const game = await Game.create(42, { width: 64, height: 32, animalCount: 0, fishCount: 20 })
    for (let t = 0; t < 250; t++) await game.step()
    expect(game.getState().fishCount).toBeLessThan(20)
  })
})
