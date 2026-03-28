// packages/game/src/worldstate.ts
export class WorldState {
  tick = 0
  season = false
  seasonCycle: number
  nextSeasonTick: number

  constructor(seasonCycle = 200) {
    this.seasonCycle = seasonCycle
    this.nextSeasonTick = seasonCycle
  }
}
