import type { World } from 'miniplex'
import type { PawnComponents, Position } from './components'
import { PawnState } from './statemachine'
import { ANIMAL_DEFAULTS, FISH_DEFAULTS } from './archetypes'
import type { Rng } from '../rng'

export function spawnAnimal(
  ecs: World<PawnComponents>,
  pos: Position,
  rng: Rng,
  id: number,
): void {
  const d = ANIMAL_DEFAULTS
  ecs.add({
    id,
    position: { ...pos },
    health: { current: d.maxHealth, max: d.maxHealth },
    kind: 'animal',
    behaviorState: { state: PawnState.Wander, timer: rng.int(5, 15) },
    hunger: { value: rng.float() * 0.3 },
    age: { ticks: 0, maxTicks: d.baseMaxTicks + rng.int(-d.ageTicks, d.ageTicks) },
    mating: { season: false, refractory: false },
  })
}

export function spawnFish(
  ecs: World<PawnComponents>,
  pos: Position,
  rng: Rng,
  id: number,
): void {
  const d = FISH_DEFAULTS
  ecs.add({
    id,
    position: { ...pos },
    health: { current: d.maxHealth, max: d.maxHealth },
    kind: 'fish',
    behaviorState: { state: PawnState.Wander, timer: rng.int(5, 15) },
    hunger: { value: rng.float() * 0.3 },
    age: { ticks: 0, maxTicks: d.baseMaxTicks + rng.int(-d.ageTicks, d.ageTicks) },
    mating: { season: false, refractory: false },
  })
}
