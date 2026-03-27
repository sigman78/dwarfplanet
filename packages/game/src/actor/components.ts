import type { PawnState } from './statemachine'
import type { Point2d } from '../types'

export type Position = { x: number; y: number }
export type Health = { current: number; max: number }
export type PawnKind = 'animal' | 'fish'
export type BehaviorState = { state: PawnState; timer: number }
export type Hunger = { value: number }
export type Age = { ticks: number; maxTicks: number }
export type Mating = { season: boolean; refractory: boolean }

export type PawnComponents = {
  position?: Position
  health?: Health
  kind?: PawnKind
  behaviorState?: BehaviorState
  hunger?: Hunger
  age?: Age
  mating?: Mating
  migrateTarget?: Point2d
}
