import { describe, it, expect } from 'vitest'
import {
  Biome,
  BIOME_GLYPH,
  LAND_PASSABLE_BIOMES,
  FISH_PASSABLE_BIOMES,
  ANIMAL_FOOD_BIOMES,
  FISH_FOOD_BIOMES,
} from '../map/tiles'

describe('tiles', () => {
  it('every biome has a glyph', () => {
    const biomes = Object.values(Biome).filter((v) => typeof v === 'number') as Biome[]
    for (const b of biomes) {
      expect(BIOME_GLYPH[b]).toBeDefined()
    }
  })

  it('water is not land-passable', () => {
    expect(LAND_PASSABLE_BIOMES.has(Biome.Water)).toBe(false)
  })

  it('mountain is not land-passable', () => {
    expect(LAND_PASSABLE_BIOMES.has(Biome.Mountain)).toBe(false)
  })

  it('water is fish-passable', () => {
    expect(FISH_PASSABLE_BIOMES.has(Biome.Water)).toBe(true)
  })

  it('grassland is animal food', () => {
    expect(ANIMAL_FOOD_BIOMES.has(Biome.Grassland)).toBe(true)
  })

  it('water is fish food', () => {
    expect(FISH_FOOD_BIOMES.has(Biome.Water)).toBe(true)
  })
})
