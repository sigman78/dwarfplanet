export enum Biome {
  DeepWater = 0,
  CoastalWater = 1,
  Mountain = 2,
  Desert = 3,
  Savanna = 4,
  TropicalForest = 5,
  Shrubland = 6,
  Grassland = 7,
  TemperateForest = 8,
  Tundra = 9,
  BorealForest = 10,
  Snowfield = 11,
}

export const BIOME_GLYPH: Record<Biome, string> = {
  [Biome.DeepWater]: '=',
  [Biome.CoastalWater]: '~',
  [Biome.Mountain]: '^',
  [Biome.Desert]: '_',
  [Biome.Savanna]: ':',
  [Biome.TropicalForest]: 'T',
  [Biome.Shrubland]: '-',
  [Biome.Grassland]: '"',
  [Biome.TemperateForest]: 't',
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

export const FISH_PASSABLE_BIOMES = new Set<Biome>([Biome.DeepWater, Biome.CoastalWater])

export const ANIMAL_FOOD_BIOMES = new Set<Biome>([
  Biome.Grassland,
  Biome.Savanna,
  Biome.TropicalForest,
  Biome.TemperateForest,
  Biome.BorealForest,
])

export const FISH_FOOD_BIOMES = new Set<Biome>([Biome.CoastalWater])
