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
  constructor(public value = 100) {}
}

export class AnimalHunger {
  constructor(public value = 0) {}
}

export class AnimalAge {
  constructor(public ticks = 0, public maxTicks = 600) {}
}

export class SpeciesRef {
  constructor(public speciesId = 0) {}
}

export class AnimalBehaviorState {
  constructor(
    public phase: AnimalBehaviorPhase = AnimalBehaviorPhase.Wander,
    public timer = 0,
  ) {}
}

export class ReproductiveState {
  constructor(
    public phase: ReproductivePhase = ReproductivePhase.Idle,
    public timer = 0,
  ) {}
}

export class MigrationState {
  constructor(
    public targetX = 0,
    public targetY = 0,
    public active = false,
  ) {}
}
