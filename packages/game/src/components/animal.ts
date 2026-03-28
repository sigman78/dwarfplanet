// packages/game/src/components/animal.ts

export enum AnimalBehaviorPhase {
  Wander = 0,
  Seek = 1,
  Eat = 2,
  Migrate = 3,
  Mate = 4,
  Aggro = 5,
}

export enum ReproductivePhase {
  Idle = 0,
  Seeking = 1,
  Refractory = 2,
}

export class AnimalHealth {
  value = 100
}

export class AnimalHunger {
  value = 0
}

export class AnimalAge {
  ticks = 0
  maxTicks = 600
}

export class SpeciesRef {
  speciesId = 0
}

export class AnimalBehaviorState {
  phase: AnimalBehaviorPhase = AnimalBehaviorPhase.Wander
  timer = 0
}

export class ReproductiveState {
  phase: ReproductivePhase = ReproductivePhase.Idle
  timer = 0
}

export class MigrationState {
  targetX = 0
  targetY = 0
  active = false
}
