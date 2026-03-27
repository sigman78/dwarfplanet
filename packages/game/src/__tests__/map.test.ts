import { describe, it, expect } from 'vitest'
import {
  Biome,
  BIOME_GLYPH,
  LAND_PASSABLE_BIOMES,
  FISH_PASSABLE_BIOMES,
  ANIMAL_FOOD_BIOMES,
  FISH_FOOD_BIOMES,
} from '../map/tiles'
import { GameMap } from '../map/map'

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

describe('GameMap', () => {
  it('stores and retrieves biomes', () => {
    const map = new GameMap(10, 10)
    map.setBiome(3, 4, Biome.Grassland)
    expect(map.getBiome(3, 4)).toBe(Biome.Grassland)
  })

  it('wraps x-axis left boundary', () => {
    const map = new GameMap(10, 10)
    map.setBiome(0, 0, Biome.Desert)
    expect(map.getBiome(-10, 0)).toBe(Biome.Desert)
    expect(map.getBiome(10, 0)).toBe(Biome.Desert)
  })

  it('isPassable: water blocks land actors', () => {
    const map = new GameMap(10, 10)
    map.setBiome(5, 5, Biome.Water)
    expect(map.isPassable(5, 5, true)).toBe(false)
    expect(map.isPassable(5, 5, false)).toBe(true)
  })

  it('isPassable: mountain blocks all', () => {
    const map = new GameMap(10, 10)
    map.setBiome(5, 5, Biome.Mountain)
    expect(map.isPassable(5, 5, true)).toBe(false)
    expect(map.isPassable(5, 5, false)).toBe(false)
  })

  it('spatial hash: findEntitiesInRadius returns inserted entity', () => {
    const map = new GameMap(32, 32)
    map.addEntity(7, 10, 10)
    const found = map.getEntitiesInRadius(10, 10, 3)
    expect(found.has(7)).toBe(true)
  })

  it('spatial hash: removeEntity is no longer found', () => {
    const map = new GameMap(32, 32)
    map.addEntity(3, 5, 5)
    map.removeEntity(3, 5, 5)
    const found = map.getEntitiesInRadius(5, 5, 3)
    expect(found.has(3)).toBe(false)
  })

  it('spatial hash: entity outside radius not returned', () => {
    const map = new GameMap(64, 64)
    map.addEntity(1, 0, 0)
    map.addEntity(2, 50, 50)
    const found = map.getEntitiesInRadius(0, 0, 3)
    expect(found.has(1)).toBe(true)
    expect(found.has(2)).toBe(false)
  })
})
