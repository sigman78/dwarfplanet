export enum ActorStateEnum {
  Wander = 'Wander',
  Seek = 'Seek',
  Eat = 'Eat',
  Migrate = 'Migrate',
  Mate = 'Mate',
  Aggro = 'Aggro',
}

export type TransitionConditions = {
  hunger: number
  foodNearby: boolean
  seasonActive: boolean
  partnerNearby: boolean
  rivalNearby: boolean
  atTarget: boolean
  adjacent: boolean
}

type Transition = [from: ActorStateEnum, to: ActorStateEnum, check: (c: TransitionConditions) => boolean]

// first matching rule wins; order encodes priority
const TRANSITIONS: Transition[] = [
  [ActorStateEnum.Wander, ActorStateEnum.Seek, (c) => c.hunger > 0.6 && c.foodNearby],
  [ActorStateEnum.Seek, ActorStateEnum.Eat, (c) => c.adjacent],
  [ActorStateEnum.Seek, ActorStateEnum.Wander, (c) => !c.foodNearby],
  [ActorStateEnum.Eat, ActorStateEnum.Wander, (c) => c.hunger < 0.2],
  [ActorStateEnum.Wander, ActorStateEnum.Migrate, (c) => !c.foodNearby && c.hunger < 0.5],
  [ActorStateEnum.Migrate, ActorStateEnum.Wander, (c) => c.atTarget],
  [ActorStateEnum.Wander, ActorStateEnum.Mate, (c) => c.seasonActive && c.partnerNearby && !c.rivalNearby],
  [ActorStateEnum.Mate, ActorStateEnum.Wander, (_c) => true], // timer in ActorStateComponent controls duration; this fires when timer expires
  [ActorStateEnum.Wander, ActorStateEnum.Aggro, (c) => c.seasonActive && c.rivalNearby],
  [ActorStateEnum.Aggro, ActorStateEnum.Wander, (c) => !c.rivalNearby],
]

export function canTransition(
  from: ActorStateEnum,
  to: ActorStateEnum,
  cond: TransitionConditions,
): boolean {
  const t = TRANSITIONS.find((tr) => tr[0] === from && tr[1] === to)
  return t ? t[2](cond) : false
}

export function getNextState(
  current: ActorStateEnum,
  cond: TransitionConditions,
): ActorStateEnum {
  for (const [from, to, check] of TRANSITIONS) {
    if (from === current && check(cond)) return to
  }
  return current
}
