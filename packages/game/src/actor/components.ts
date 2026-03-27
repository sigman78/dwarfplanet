import type { ActorStateEnum } from './statemachine'

export type Position = { x: number; y: number }
export type Health = { current: number; max: number }
export type Subtype = { kind: 'animal' | 'fish' }
export type ActorStateComponent = { state: ActorStateEnum; timer: number }
export type Hunger = { value: number }
export type Age = { ticks: number; maxTicks: number }
export type Mating = { season: boolean; aggro: boolean }

export type EntityComponents = {
  id?: number
  position?: Position
  health?: Health
  subtype?: Subtype
  actorState?: ActorStateComponent
  hunger?: Hunger
  age?: Age
  mating?: Mating
  migrateTarget?: Position
}
