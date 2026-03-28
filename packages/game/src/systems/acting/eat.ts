import type { World } from 'thyseus'
import { Entity, Query } from 'thyseus'
import { AnimalBehaviorState, AnimalBehaviorPhase, AnimalHunger, AnimalAwareness } from '@/components'

export function eatSystem(
  query: Query<[Entity, AnimalBehaviorState, AnimalHunger, AnimalAwareness]>,
): void {
  for (const [, bstate, hunger, awareness] of query) {
    if (bstate.phase !== AnimalBehaviorPhase.Eat) continue
    if (awareness.canEatHere) {
      hunger.value = 0
    }
  }
}
eatSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Entity, AnimalBehaviorState, AnimalHunger, AnimalAwareness]),
]
