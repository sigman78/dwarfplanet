import type { SystemContext } from '../context'
import { PawnState, getNextState } from './statemachine'
import { BIOME_DEFS } from '../map/tiles'
import { ANIMAL_DEFAULTS, FISH_DEFAULTS } from './archetypes'
import { spawnAnimal, spawnFish } from './actorgen'
import { getNextStep } from '../map/navigation'
import type { PawnComponents } from './components'
import type { EntityId } from '../types'

const SEARCH_RADIUS = 3

function isLandActor(kind: 'animal' | 'fish'): boolean {
  return kind === 'animal'
}

function isFoodTile(x: number, y: number, kind: 'animal' | 'fish', { map }: SystemContext): boolean {
  const biome = map.getBiome(x, y)
  return kind === 'animal' ? BIOME_DEFS[biome].animalFood : BIOME_DEFS[biome].fishFood
}

function hasFoodNearby(x: number, y: number, kind: 'animal' | 'fish', ctx: SystemContext): boolean {
  const { map } = ctx
  for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
    for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
      const ty = Math.max(0, Math.min(map.height - 1, y + dy))
      if (isFoodTile(map.wrapX(x + dx), ty, kind, ctx)) return true
    }
  }
  return false
}

export function ageSystem(ctx: SystemContext): void {
  const { ecs, events, worldState } = ctx
  const toRemove: PawnComponents[] = []
  for (const e of ctx.queries.withAge) {
    e.age!.ticks++
    if (e.age!.ticks >= e.age!.maxTicks) {
      toRemove.push(e)
      events.emit({ tick: worldState.tick, origin: ecs.id(e)! as EntityId, importance: 1, text: 'actor died (old age)' })
    }
  }
  for (const e of toRemove) {
    if (e.position) ctx.map.removeEntity(ecs.id(e)! as EntityId, e.position.x, e.position.y)
    ecs.remove(e)
  }
}

export function hungerSystem(ctx: SystemContext): void {
  const { ecs, events, worldState } = ctx
  const toRemove: PawnComponents[] = []
  for (const e of ctx.queries.withHunger) {
    const rate = e.kind === 'animal' ? ANIMAL_DEFAULTS.hungerRate : FISH_DEFAULTS.hungerRate
    e.hunger!.value = Math.min(1, e.hunger!.value + rate)
    if (e.hunger!.value >= 1) {
      toRemove.push(e)
      events.emit({ tick: worldState.tick, origin: ecs.id(e)! as EntityId, importance: 1, text: 'actor died (hunger)' })
    }
  }
  for (const e of toRemove) {
    if (e.position) ctx.map.removeEntity(ecs.id(e)! as EntityId, e.position.x, e.position.y)
    ecs.remove(e)
  }
}

export function matingSeasonSystem(ctx: SystemContext): void {
  const { worldState } = ctx
  for (const e of ctx.queries.withMating) {
    e.mating!.season = worldState.season
    if (!worldState.season) e.mating!.refractory = false
  }
}

export function stateTransitionSystem(ctx: SystemContext): void {
  const { map } = ctx
  for (const e of ctx.queries.withBehaviorStatePosition) {
    const s = e.behaviorState!
    s.timer--
    if (s.timer > 0) continue

    const { x, y } = e.position!
    const kind = e.kind!
    const foodNearby = hasFoodNearby(x, y, kind, ctx)
    const adjacentFood = isFoodTile(x, y, kind, ctx)

    const nearbyIds = ctx.map.getEntitiesInRadius(x, y, SEARCH_RADIUS)
    const myId = ctx.ecs.id(e) as EntityId
    let partnerNearby = false
    let rivalNearby = false

    for (const nid of nearbyIds) {
      if (nid === myId) continue
      const neighbor = ctx.neighborById.get(nid)
      if (!neighbor || neighbor.kind !== kind) continue
      if (e.mating!.season && neighbor.mating.refractory) {
        rivalNearby = true
      } else {
        partnerNearby = true
      }
    }

    const atTarget = e.migrateTarget
      ? Math.abs(e.position!.x - e.migrateTarget.x) < 3 && Math.abs(e.position!.y - e.migrateTarget.y) < 3
      : false

    const next = getNextState(s.state, {
      hunger: e.hunger!.value,
      foodNearby,
      seasonActive: e.mating!.season,
      partnerNearby,
      rivalNearby,
      atTarget,
      adjacent: adjacentFood,
    })

    if (next !== s.state) {
      if (s.state === PawnState.Migrate) {
        e.migrateTarget = undefined
      }
      s.state = next
      s.timer = 10
      if (next === PawnState.Migrate && !e.migrateTarget) {
        e.migrateTarget = {
          x: ctx.rng.int(0, map.width - 1),
          y: ctx.rng.int(0, map.height - 1),
        }
      }
    } else {
      s.timer = 5
    }
  }
}

export function wanderSystem(ctx: SystemContext): void {
  const { map, rng } = ctx
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const
  for (const e of ctx.queries.withBehaviorState) {
    if (e.behaviorState!.state !== PawnState.Wander) continue
    const { x, y } = e.position!
    const isLand = isLandActor(e.kind!)
    const order = [0, 1, 2, 3]
    for (let i = 3; i > 0; i--) {
      const j = rng.int(0, i)
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    for (const i of order) {
      const [dx, dy] = dirs[i]
      const nx = map.wrapX(x + dx)
      const ny = Math.max(0, Math.min(map.height - 1, y + dy))
      if (map.isPassable(nx, ny, isLand)) {
        map.moveEntity(ctx.ecs.id(e)! as EntityId, x, y, nx, ny)
        e.position!.x = nx
        e.position!.y = ny
        break
      }
    }
  }
}

export function seekSystem(ctx: SystemContext): void {
  const { map } = ctx
  for (const e of ctx.queries.withBehaviorState) {
    if (e.behaviorState!.state !== PawnState.Seek) continue
    const { x, y } = e.position!
    const kind = e.kind!
    const isLand = isLandActor(kind)
    let target: { x: number; y: number } | null = null
    let bestDist = Infinity
    for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
      for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
        const tx = map.wrapX(x + dx)
        const ty = Math.max(0, Math.min(map.height - 1, y + dy))
        if (isFoodTile(tx, ty, kind, ctx)) {
          const d = Math.abs(dx) + Math.abs(dy)
          if (d < bestDist) { bestDist = d; target = { x: tx, y: ty } }
        }
      }
    }
    if (!target) continue
    const next = getNextStep({ x, y }, target, isLand, map)
    if (next.x !== x || next.y !== y) {
      map.moveEntity(ctx.ecs.id(e)! as EntityId, x, y, next.x, next.y)
      e.position!.x = next.x
      e.position!.y = next.y
    }
  }
}

export function eatSystem(ctx: SystemContext): void {
  for (const e of ctx.queries.withFullPawn) {
    if (e.behaviorState!.state !== PawnState.Eat) continue
    if (isFoodTile(e.position!.x, e.position!.y, e.kind!, ctx)) {
      e.hunger!.value = 0
    }
  }
}

export function migrateSystem(ctx: SystemContext): void {
  const { map } = ctx
  for (const e of ctx.queries.withMigrateTarget) {
    if (e.behaviorState!.state !== PawnState.Migrate) continue
    const { x, y } = e.position!
    const isLand = isLandActor(e.kind!)
    const next = getNextStep({ x, y }, e.migrateTarget!, isLand, map)
    if (next.x !== x || next.y !== y) {
      map.moveEntity(ctx.ecs.id(e)! as EntityId, x, y, next.x, next.y)
      e.position!.x = next.x
      e.position!.y = next.y
    }
  }
}

export function mateSystem(ctx: SystemContext): void {
  const { ecs, rng, events, worldState } = ctx
  for (const e of ctx.queries.withBehaviorStatePosition) {
    if (e.behaviorState!.state !== PawnState.Mate) continue
    const myId = ecs.id(e) as EntityId
    const nearbyIds = ctx.map.getEntitiesInRadius(e.position!.x, e.position!.y, SEARCH_RADIUS)
    const hasPartner = [...nearbyIds].some((nid) => {
      if (nid === myId) return false
      const neighbor = ctx.neighborById.get(nid)
      return neighbor != null && neighbor.kind === e.kind && !neighbor.mating.refractory
    })
    if (!hasPartner) {
      e.behaviorState!.state = PawnState.Wander
      e.behaviorState!.timer = 5
      continue
    }
    const count = rng.int(1, 3)
    for (let i = 0; i < count; i++) {
      const pos = {
        x: ctx.map.wrapX(e.position!.x + rng.int(-2, 2)),
        y: Math.max(0, Math.min(ctx.map.height - 1, e.position!.y + rng.int(-2, 2))),
      }
      const newEntity = e.kind === 'animal' ? spawnAnimal(ecs, pos, rng) : spawnFish(ecs, pos, rng)
      ctx.map.addEntity(ecs.id(newEntity)! as EntityId, pos.x, pos.y)
    }
    events.emit({ tick: worldState.tick, origin: ecs.id(e)! as EntityId, importance: 2, text: `mating: ${count} offspring` })
    e.mating!.refractory = true
    e.behaviorState!.state = PawnState.Wander
    e.behaviorState!.timer = 20
  }
}

export function aggroSystem(ctx: SystemContext): void {
  const { ecs, worldState, events } = ctx

  const byId = new Map<EntityId, PawnComponents>()
  for (const e of ctx.queries.withHealth) {
    byId.set(ecs.id(e)! as EntityId, e)
  }

  const toRemove = new Set<PawnComponents>()

  for (const e of ctx.queries.withAggroActor) {
    if (e.behaviorState!.state !== PawnState.Aggro) continue
    const nearbyIds = ctx.map.getEntitiesInRadius(e.position!.x, e.position!.y, SEARCH_RADIUS)
    const myId = ecs.id(e) as EntityId
    for (const nid of nearbyIds) {
      if (nid === myId) continue
      const rival = byId.get(nid)
      if (!rival || rival.kind !== e.kind) continue
      rival.health!.current -= 20
      if (rival.health!.current <= 0 && !toRemove.has(rival)) {
        toRemove.add(rival)
        events.emit({ tick: worldState.tick, origin: nid, importance: 1, text: 'actor died (aggro)' })
      }
    }
  }

  for (const e of toRemove) {
    if (e.position) ctx.map.removeEntity(ecs.id(e)! as EntityId, e.position.x, e.position.y)
    ecs.remove(e)
  }
}
