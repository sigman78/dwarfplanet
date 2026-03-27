import { createNoise2D } from 'simplex-noise'
import type { GameMap } from './map'
import { Biome } from './tiles'
import type { Rng } from '../rng'

const BIOME_TABLE: Biome[][] = [
  // [tempBand][moistureBand]: 0=cold, 1=temperate, 2=hot × 0=dry, 1=moderate, 2=wet
  [Biome.Tundra, Biome.BorealForest, Biome.Snowfield],
  [Biome.Shrubland, Biome.Grassland, Biome.TemperateForest],
  [Biome.Desert, Biome.Savanna, Biome.TropicalForest],
]

export function generateMap(map: GameMap, rng: Rng): void {
  const heightNoise = createNoise2D(() => rng.float())
  const moistureNoise = createNoise2D(() => rng.float())
  const tempNoise = createNoise2D(() => rng.float())

  const hs = 0.04
  const ms = 0.02
  const ts = 0.03

  for (let y = 0; y < map.height; y++) {
    const latBias = 1 - Math.abs(2 * y / map.height - 1)
    for (let x = 0; x < map.width; x++) {
      const height = (heightNoise(x * hs, y * hs) + 1) / 2
      const moisture = (moistureNoise(x * ms, y * ms) + 1) / 2
      const tempRaw = (tempNoise(x * ts, y * ts) + 1) / 2
      const temp = tempRaw * 0.5 + latBias * 0.5

      if (height < 0.3) { map.setBiome(x, y, Biome.Water); continue }
      if (height > 0.85) { map.setBiome(x, y, Biome.Mountain); continue }

      const ti = temp < 0.4 ? 0 : temp < 0.7 ? 1 : 2
      const mi = moisture < 0.4 ? 0 : moisture < 0.7 ? 1 : 2
      map.setBiome(x, y, BIOME_TABLE[ti][mi])
    }
  }
}
