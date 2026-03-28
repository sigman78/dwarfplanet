import { Schedule, applyEntityUpdates } from 'thyseus'
import { worldTickSystem } from '@/systems/prephase'
import { foodAwarenessSystem, socialAwarenessSystem, threatAwarenessSystem, personAwarenessSystem } from '@/systems/sensing'
import { reproductivePhaseSystem, behaviorTransitionSystem } from '@/systems/planning'
import { wanderSystem, seekSystem, eatSystem, migrationSystem, matingSystem, aggroSystem, personActSystem } from '@/systems/acting'
import { ageSystem, hungerSystem, eventCompactionSystem, thingDecaySystem } from '@/systems/resolving'

export class SetupSchedule extends Schedule {}
export class PrePhaseSchedule extends Schedule {}
export class SensingSchedule extends Schedule {}
export class PlanningSchedule extends Schedule {}
export class ActingSchedule extends Schedule {}
export class ResolvingSchedule extends Schedule {}

export function registerSystems(world: import('thyseus').World): import('thyseus').World {
  return world
    .addSystems(PrePhaseSchedule, worldTickSystem)
    .addSystems(SensingSchedule, [
      foodAwarenessSystem,
      socialAwarenessSystem,
      threatAwarenessSystem,
      personAwarenessSystem,
    ])
    .addSystems(PlanningSchedule, [
      reproductivePhaseSystem,
      behaviorTransitionSystem,
    ])
    .addSystems(ActingSchedule, [
      wanderSystem,
      seekSystem,
      eatSystem,
      migrationSystem,
      matingSystem,
      aggroSystem,
      personActSystem,
      applyEntityUpdates,
    ])
    .addSystems(ResolvingSchedule, [
      ageSystem,
      hungerSystem,
      thingDecaySystem,
      applyEntityUpdates,
      eventCompactionSystem,
    ])
}
