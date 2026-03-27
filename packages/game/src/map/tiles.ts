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

export type BiomeDef = {
  readonly glyph: string
  readonly walkable: boolean
  readonly swimmable: boolean
  readonly animalFood: boolean
  readonly fishFood: boolean
}

export const BIOME_DEFS: Record<Biome, BiomeDef> = {
  [Biome.DeepWater]:       { glyph: '=', walkable: false, swimmable: true,  animalFood: false, fishFood: false },
  [Biome.CoastalWater]:    { glyph: '~', walkable: false, swimmable: true,  animalFood: false, fishFood: true  },
  [Biome.Mountain]:        { glyph: '^', walkable: false, swimmable: false, animalFood: false, fishFood: false },
  [Biome.Desert]:          { glyph: '_', walkable: true,  swimmable: false, animalFood: false, fishFood: false },
  [Biome.Savanna]:         { glyph: ':', walkable: true,  swimmable: false, animalFood: true,  fishFood: false },
  [Biome.TropicalForest]:  { glyph: 'T', walkable: true,  swimmable: false, animalFood: true,  fishFood: false },
  [Biome.Shrubland]:       { glyph: '-', walkable: true,  swimmable: false, animalFood: false, fishFood: false },
  [Biome.Grassland]:       { glyph: '"', walkable: true,  swimmable: false, animalFood: true,  fishFood: false },
  [Biome.TemperateForest]: { glyph: 't', walkable: true,  swimmable: false, animalFood: true,  fishFood: false },
  [Biome.Tundra]:          { glyph: ',', walkable: true,  swimmable: false, animalFood: false, fishFood: false },
  [Biome.BorealForest]:    { glyph: '*', walkable: true,  swimmable: false, animalFood: true,  fishFood: false },
  [Biome.Snowfield]:       { glyph: '#', walkable: true,  swimmable: false, animalFood: false, fishFood: false },
}

const BIOME_KEYS: Biome[] = [
  Biome.DeepWater, Biome.CoastalWater, Biome.Mountain, Biome.Desert,
  Biome.Savanna, Biome.TropicalForest, Biome.Shrubland, Biome.Grassland,
  Biome.TemperateForest, Biome.Tundra, Biome.BorealForest, Biome.Snowfield,
]

export const BIOME_GLYPH = Object.fromEntries(BIOME_KEYS.map(b => [b, BIOME_DEFS[b].glyph])) as Record<Biome, string>
export const LAND_PASSABLE_BIOMES = new Set(BIOME_KEYS.filter(b => BIOME_DEFS[b].walkable))
export const FISH_PASSABLE_BIOMES = new Set(BIOME_KEYS.filter(b => BIOME_DEFS[b].swimmable))
export const ANIMAL_FOOD_BIOMES = new Set(BIOME_KEYS.filter(b => BIOME_DEFS[b].animalFood))
export const FISH_FOOD_BIOMES = new Set(BIOME_KEYS.filter(b => BIOME_DEFS[b].fishFood))
