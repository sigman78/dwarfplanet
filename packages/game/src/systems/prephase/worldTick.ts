import type { World } from 'thyseus'
import { Res } from 'thyseus'
import { WorldState } from '@/worldstate'
import { GameEventsLog } from '@/events'

export function worldTickSystem(state: WorldState, events: GameEventsLog): void {
  state.despawnedThisTick.clear()
  state.tick++
  if (state.tick >= state.nextSeasonTick) {
    state.season = !state.season
    state.nextSeasonTick = state.tick + state.seasonCycle
    events.emit({
      tick: state.tick,
      origin: 'global',
      importance: 2,
      text: state.season ? 'mating season began' : 'mating season ended',
    })
  }
}
worldTickSystem.getSystemArguments = (w: World) => [
  Res.intoArgument(w, WorldState),
  Res.intoArgument(w, GameEventsLog),
]
