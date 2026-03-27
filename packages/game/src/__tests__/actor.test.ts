import { describe, it, expect } from 'vitest'
import { ActorStateEnum, canTransition } from '../actor/statemachine'

describe('state machine transitions', () => {
  it('Wander → Seek when hungry and food nearby', () => {
    expect(
      canTransition(ActorStateEnum.Wander, ActorStateEnum.Seek, {
        hunger: 0.7,
        foodNearby: true,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(true)
  })

  it('Wander → Seek blocked when hunger low', () => {
    expect(
      canTransition(ActorStateEnum.Wander, ActorStateEnum.Seek, {
        hunger: 0.3,
        foodNearby: true,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(false)
  })

  it('Seek → Eat when adjacent to food', () => {
    expect(
      canTransition(ActorStateEnum.Seek, ActorStateEnum.Eat, {
        hunger: 0.8,
        foodNearby: true,
        seasonActive: false,
        partnerNearby: false,
        rivalNearby: false,
        atTarget: false,
        adjacent: true,
      }),
    ).toBe(true)
  })

  it('Wander → Mate when season active and partner nearby, not aggro', () => {
    expect(
      canTransition(ActorStateEnum.Wander, ActorStateEnum.Mate, {
        hunger: 0.3,
        foodNearby: false,
        seasonActive: true,
        partnerNearby: true,
        rivalNearby: false,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(true)
  })

  it('Wander → Aggro when season active and rival nearby', () => {
    expect(
      canTransition(ActorStateEnum.Wander, ActorStateEnum.Aggro, {
        hunger: 0.3,
        foodNearby: false,
        seasonActive: true,
        partnerNearby: false,
        rivalNearby: true,
        atTarget: false,
        adjacent: false,
      }),
    ).toBe(true)
  })
})
