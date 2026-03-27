import { Rng } from './rng'
import { GameWorld, type WorldConfig } from './world'

export class Game {
  private rng: Rng
  readonly world: GameWorld

  constructor(seed: number, config: WorldConfig = {}) {
    this.rng = new Rng(seed)
    this.world = new GameWorld(this.rng, config)
  }

  step(): void {
    this.world.step(this.rng)
  }

  getState() {
    return this.world.getState()
  }
}
