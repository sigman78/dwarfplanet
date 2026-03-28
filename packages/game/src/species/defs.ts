export type SpeciesId = 'deer' | 'wolf' | 'salmon'

export type SpeciesDef = {
  readonly id: SpeciesId
  readonly habitat: 'land' | 'water'
  readonly hungerRate: number
  readonly baseLifespan: number
  readonly lifespanVariance: number
  readonly senseRadius: number
  readonly predatorIds: ReadonlySet<SpeciesId>
  readonly maxOffspring: number
}

export const SPECIES_LIST: SpeciesId[] = ['deer', 'wolf', 'salmon']

export const SPECIES_DEFS: Record<SpeciesId, SpeciesDef> = {
  deer: {
    id: 'deer',
    habitat: 'land',
    hungerRate: 0.003,
    baseLifespan: 600,
    lifespanVariance: 200,
    senseRadius: 5,
    predatorIds: new Set(['wolf']),
    maxOffspring: 1,
  },
  wolf: {
    id: 'wolf',
    habitat: 'land',
    hungerRate: 0.004,
    baseLifespan: 500,
    lifespanVariance: 150,
    senseRadius: 7,
    predatorIds: new Set([]),
    maxOffspring: 1,
  },
  salmon: {
    id: 'salmon',
    habitat: 'water',
    hungerRate: 0.004,
    baseLifespan: 200,
    lifespanVariance: 50,
    senseRadius: 4,
    predatorIds: new Set([]),
    maxOffspring: 3,
  },
}

export function getSpeciesDef(speciesId: number): SpeciesDef {
  return SPECIES_DEFS[SPECIES_LIST[speciesId]]
}
