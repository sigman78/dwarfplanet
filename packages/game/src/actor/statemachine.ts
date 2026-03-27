export enum PawnState {
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

type Transition = [from: PawnState, to: PawnState, check: (c: TransitionConditions) => boolean]

// first matching rule wins; order encodes priority
const TRANSITIONS: Transition[] = [
  [PawnState.Wander, PawnState.Seek, (c) => c.hunger > 0.6 && c.foodNearby],
  [PawnState.Seek, PawnState.Eat, (c) => c.adjacent],
  [PawnState.Seek, PawnState.Wander, (c) => !c.foodNearby],
  [PawnState.Eat, PawnState.Wander, (c) => c.hunger < 0.2],
  [PawnState.Wander, PawnState.Migrate, (c) => !c.foodNearby && c.hunger < 0.5],
  [PawnState.Migrate, PawnState.Wander, (c) => c.atTarget],
  [PawnState.Wander, PawnState.Mate, (c) => c.seasonActive && c.partnerNearby && !c.rivalNearby],
  [PawnState.Mate, PawnState.Wander, (_c) => true], // timer in BehaviorState controls duration; this fires when timer expires
  [PawnState.Wander, PawnState.Aggro, (c) => c.seasonActive && c.rivalNearby],
  [PawnState.Aggro, PawnState.Wander, (c) => !c.rivalNearby],
]

export function canTransition(
  from: PawnState,
  to: PawnState,
  cond: TransitionConditions,
): boolean {
  const t = TRANSITIONS.find((tr) => tr[0] === from && tr[1] === to)
  return t ? t[2](cond) : false
}

export function getNextState(
  current: PawnState,
  cond: TransitionConditions,
): PawnState {
  for (const [from, to, check] of TRANSITIONS) {
    if (from === current && check(cond)) return to
  }
  return current
}
