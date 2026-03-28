import { Schedule, applyEntityUpdates } from 'thyseus'
import { worldTickSystem } from './systems/prephase/worldTick'
import { foodAwarenessSystem } from './systems/sensing/foodAwareness'
import { socialAwarenessSystem } from './systems/sensing/socialAwareness'
import { threatAwarenessSystem } from './systems/sensing/threatAwareness'
import { personAwarenessSystem } from './systems/sensing/personAwareness'
import { reproductivePhaseSystem } from './systems/planning/reproductivePhase'
import { behaviorTransitionSystem } from './systems/planning/behaviorTransition'
import { wanderSystem } from './systems/acting/wander'
import { seekSystem } from './systems/acting/seek'
import { eatSystem } from './systems/acting/eat'
import { migrationSystem } from './systems/acting/migration'
import { matingSystem } from './systems/acting/mating'
import { aggroSystem } from './systems/acting/aggro'
import { personActSystem } from './systems/acting/personAct'
import { ageSystem } from './systems/resolving/age'
import { hungerSystem } from './systems/resolving/hunger'
import { eventCompactionSystem } from './systems/resolving/eventCompaction'
import { thingDecaySystem } from './systems/resolving/thingDecay'

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
