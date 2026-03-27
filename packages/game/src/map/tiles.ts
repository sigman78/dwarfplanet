export enum Biome {
  Water = 0,
  Mountain = 1,
  Desert = 2,
  Savanna = 3,
  TropicalForest = 4,
  Shrubland = 5,
  Grassland = 6,
  TemperateForest = 7,
  Tundra = 8,
  BorealForest = 9,
  Snowfield = 10,
}

export const BIOME_GLYPH: Record<Biome, string> = {
  [Biome.Water]: '~',
  [Biome.Mountain]: '^',
  [Biome.Desert]: '_',
  [Biome.Savanna]: ':',
  [Biome.TropicalForest]: 'T',
  [Biome.Shrubland]: '=',
  [Biome.Grassland]: '"',
  [Biome.TemperateForest]: 'T',
  [Biome.Tundra]: ',',
  [Biome.BorealForest]: '*',
  [Biome.Snowfield]: '#',
}

export const LAND_PASSABLE_BIOMES = new Set<Biome>([
  Biome.Desert,
  Biome.Savanna,
  Biome.TropicalForest,
  Biome.Shrubland,
  Biome.Grassland,
  Biome.TemperateForest,
  Biome.Tundra,
  Biome.BorealForest,
  Biome.Snowfield,
])

export const FISH_PASSABLE_BIOMES = new Set<Biome>([Biome.Water])

export const ANIMAL_FOOD_BIOMES = new Set<Biome>([
  Biome.Grassland,
  Biome.Savanna,
  Biome.TropicalForest,
  Biome.TemperateForest,
  Biome.BorealForest,
])

export const FISH_FOOD_BIOMES = new Set<Biome>([Biome.Water])
