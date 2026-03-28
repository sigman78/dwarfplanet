// packages/game/src/components/perception.ts

export class AnimalAwareness {
  constructor(
    public foodNearby = false,
    public foodX = 0,
    public foodY = 0,
    public canEatHere = false,
  ) {}
}

export class AnimalSocialAwareness {
  constructor(
    public mateNearby = false,
    public threatNearby = false,
  ) {}
}

// Sub-project 2 stub — no fields yet
export class ThreatAwareness {}
