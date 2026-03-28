import { Rng } from './rng'
import { GameWorld, type WorldConfig } from './world'

export class Game {
  readonly world: GameWorld

  private constructor(world: GameWorld) {
    this.world = world
  }

  static async create(seed: number, config: WorldConfig = {}): Promise<Game> {
    const rng = new Rng(seed)
    const world = await GameWorld.create(rng, config)
    return new Game(world)
  }

  async step(): Promise<void> {
    await this.world.step()
  }

  getState() {
    return this.world.getState()
  }
}
