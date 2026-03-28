import type { World } from 'thyseus'
import { Res } from 'thyseus'
import { GameEventsLog } from '../../events'
import { WorldState } from '../../worldstate'

export function eventCompactionSystem(
  events: Res<GameEventsLog>,
  worldState: Res<WorldState>,
): void {
  events.compact(worldState.tick)
}
eventCompactionSystem.getSystemArguments = (w: World) => [
  Res.intoArgument(w, GameEventsLog),
  Res.intoArgument(w, WorldState),
]
