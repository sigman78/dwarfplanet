import type { World } from 'miniplex'
import type { EntityComponents, Position } from './components'
import { ActorStateEnum } from './statemachine'
import { ANIMAL_DEFAULTS, FISH_DEFAULTS } from './archetypes'
import type { Rng } from '../rng'

export function spawnAnimal(
  ecs: World<EntityComponents>,
  pos: Position,
  rng: Rng,
  id: number,
): void {
  const d = ANIMAL_DEFAULTS
  ecs.add({
    id,
    position: { ...pos },
    health: { current: d.maxHealth, max: d.maxHealth },
    subtype: { kind: 'animal' },
    actorState: { state: ActorStateEnum.Wander, timer: rng.int(5, 15) },
    hunger: { value: rng.float() * 0.3 },
    age: { ticks: 0, maxTicks: d.baseMaxTicks + rng.int(-d.ageTicks, d.ageTicks) },
    mating: { season: false, aggro: false },
  })
}

export function spawnFish(
  ecs: World<EntityComponents>,
  pos: Position,
  rng: Rng,
  id: number,
): void {
  const d = FISH_DEFAULTS
  ecs.add({
    id,
    position: { ...pos },
    health: { current: d.maxHealth, max: d.maxHealth },
    subtype: { kind: 'fish' },
    actorState: { state: ActorStateEnum.Wander, timer: rng.int(5, 15) },
    hunger: { value: rng.float() * 0.3 },
    age: { ticks: 0, maxTicks: d.baseMaxTicks + rng.int(-d.ageTicks, d.ageTicks) },
    mating: { season: false, aggro: false },
  })
}
