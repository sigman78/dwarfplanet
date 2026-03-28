// packages/game/src/worldstate.ts
export class WorldState {
  tick = 0
  season = false
  seasonCycle: number
  nextSeasonTick: number
  despawnedThisTick: Set<number> = new Set()

  constructor(seasonCycle = 200) {
    this.seasonCycle = seasonCycle
    this.nextSeasonTick = seasonCycle
  }
}
