import { describe, it, expect } from 'vitest'
import { Game } from '../game'

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
})
