// packages/game/src/systems/planning/reproductivePhase.ts
import type { World } from 'thyseus'
import { Query, Res } from 'thyseus'
import { ReproductiveState, ReproductivePhase } from '../../components/animal'
import { WorldState } from '../../worldstate'

export function reproductivePhaseSystem(
  query: Query<[ReproductiveState]>,
  worldState: Res<WorldState>,
): void {
  for (const [repro] of query) {
    if (repro.timer > 0) {
      repro.timer--
    }
    // When season ends, reset Seeking back to Idle; Refractory stays until timer expires
    if (!worldState.season && repro.phase === ReproductivePhase.Seeking) {
      repro.phase = ReproductivePhase.Idle
    }
    if (!worldState.season && repro.phase === ReproductivePhase.Refractory && repro.timer === 0) {
      repro.phase = ReproductivePhase.Idle
    }
    // When season starts and Idle, move to Seeking
    if (worldState.season && repro.phase === ReproductivePhase.Idle) {
      repro.phase = ReproductivePhase.Seeking
    }
  }
}
reproductivePhaseSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [ReproductiveState]),
  Res.intoArgument(w, WorldState),
]
