import * as prand from 'pure-rand'

export class Rng {
  private gen: prand.RandomGenerator

  constructor(seed: number) {
    this.gen = prand.xoroshiro128plus(seed)
  }

  int(min: number, max: number): number {
    return prand.unsafeUniformIntDistribution(min, max, this.gen)
  }

  float(): number {
    return this.int(0, 999_999) / 1_000_000
  }

  bool(probability = 0.5): boolean {
    return this.float() < probability
  }
}
