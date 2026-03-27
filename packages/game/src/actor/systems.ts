import type { SystemContext } from '../context'
import { ActorStateEnum, getNextState } from './statemachine'
import { ANIMAL_FOOD_BIOMES, FISH_FOOD_BIOMES } from '../map/tiles'
import { ANIMAL_DEFAULTS, FISH_DEFAULTS } from './archetypes'
import { spawnAnimal, spawnFish } from './actorgen'
import { getNextStep } from '../map/navigation'
import type { EntityComponents } from './components'

const SEARCH_RADIUS = 3
let nextId = 10_000

function isLandActor(kind: 'animal' | 'fish'): boolean {
  return kind === 'animal'
}

function isFoodTile(x: number, y: number, kind: 'animal' | 'fish', { map }: SystemContext): boolean {
  const biome = map.getBiome(x, y)
  return kind === 'animal' ? ANIMAL_FOOD_BIOMES.has(biome) : FISH_FOOD_BIOMES.has(biome)
}

function hasFoodNearby(x: number, y: number, kind: 'animal' | 'fish', ctx: SystemContext): boolean {
  const { map } = ctx
  for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
    for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
      if (isFoodTile(map.wrapX(x + dx), y + dy, kind, ctx)) return true
    }
  }
  return false
}

export function ageSystem(ctx: SystemContext): void {
  const { ecs, events, worldState } = ctx
  const toRemove: EntityComponents[] = []
  for (const e of ecs.with('age', 'id')) {
    e.age!.ticks++
    if (e.age!.ticks >= e.age!.maxTicks) {
      toRemove.push(e)
      events.emit({ tick: worldState.tick, origin: e.id!, importance: 1, text: 'actor died (old age)' })
    }
  }
  for (const e of toRemove) {
    if (e.position) ctx.map.removeEntity(e.id!, e.position.x, e.position.y)
    ecs.remove(e)
  }
}

export function hungerSystem(ctx: SystemContext): void {
  const { ecs, events, worldState } = ctx
  const toRemove: EntityComponents[] = []
  for (const e of ecs.with('hunger', 'subtype', 'id')) {
    const rate = e.subtype!.kind === 'animal' ? ANIMAL_DEFAULTS.hungerRate : FISH_DEFAULTS.hungerRate
    e.hunger!.value = Math.min(1, e.hunger!.value + rate)
    if (e.hunger!.value >= 1) {
      toRemove.push(e)
      events.emit({ tick: worldState.tick, origin: e.id!, importance: 1, text: 'actor died (hunger)' })
    }
  }
  for (const e of toRemove) {
    if (e.position) ctx.map.removeEntity(e.id!, e.position.x, e.position.y)
    ecs.remove(e)
  }
}

export function matingSeasonSystem(ctx: SystemContext): void {
  const { ecs, worldState } = ctx
  for (const e of ecs.with('mating')) {
    e.mating!.season = worldState.season
    if (!worldState.season) e.mating!.aggro = false
  }
}

export function stateTransitionSystem(ctx: SystemContext): void {
  const { ecs, map } = ctx
  for (const e of ecs.with('actorState', 'position', 'hunger', 'subtype', 'mating', 'id')) {
    const s = e.actorState!
    s.timer--
    if (s.timer > 0) continue

    const { x, y } = e.position!
    const kind = e.subtype!.kind
    const foodNearby = hasFoodNearby(x, y, kind, ctx)
    const adjacentFood = isFoodTile(x, y, kind, ctx)

    const nearbyIds = ctx.map.getEntitiesInRadius(x, y, SEARCH_RADIUS)
    let partnerNearby = false
    let rivalNearby = false

    for (const nid of nearbyIds) {
      if (nid === e.id) continue
      const neighbor = [...ecs.with('id', 'subtype', 'mating')].find((n) => n.id === nid)
      if (!neighbor || neighbor.subtype!.kind !== kind) continue
      if (e.mating!.season && neighbor.mating!.aggro) {
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
      if (s.state === ActorStateEnum.Migrate) {
        e.migrateTarget = undefined
      }
      s.state = next
      s.timer = 10
      if (next === ActorStateEnum.Migrate && !e.migrateTarget) {
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
  const { ecs, map, rng } = ctx
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const
  for (const e of ecs.with('actorState', 'position', 'subtype', 'id')) {
    if (e.actorState!.state !== ActorStateEnum.Wander) continue
    const { x, y } = e.position!
    const isLand = isLandActor(e.subtype!.kind)
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
        map.moveEntity(e.id!, x, y, nx, ny)
        e.position!.x = nx
        e.position!.y = ny
        break
      }
    }
  }
}

export function seekSystem(ctx: SystemContext): void {
  const { ecs, map } = ctx
  for (const e of ecs.with('actorState', 'position', 'subtype', 'id')) {
    if (e.actorState!.state !== ActorStateEnum.Seek) continue
    const { x, y } = e.position!
    const kind = e.subtype!.kind
    const isLand = isLandActor(kind)
    let target: { x: number; y: number } | null = null
    let bestDist = Infinity
    for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
      for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
        const tx = map.wrapX(x + dx)
        const ty = y + dy
        if (isFoodTile(tx, ty, kind, ctx)) {
          const d = Math.abs(dx) + Math.abs(dy)
          if (d < bestDist) { bestDist = d; target = { x: tx, y: ty } }
        }
      }
    }
    if (!target) continue
    const next = getNextStep({ x, y }, target, isLand, map)
    if (next.x !== x || next.y !== y) {
      map.moveEntity(e.id!, x, y, next.x, next.y)
      e.position!.x = next.x
      e.position!.y = next.y
    }
  }
}

export function eatSystem(ctx: SystemContext): void {
  const { ecs } = ctx
  for (const e of ecs.with('actorState', 'position', 'hunger', 'subtype')) {
    if (e.actorState!.state !== ActorStateEnum.Eat) continue
    if (isFoodTile(e.position!.x, e.position!.y, e.subtype!.kind, ctx)) {
      e.hunger!.value = 0
    }
  }
}

export function migrateSystem(ctx: SystemContext): void {
  const { ecs, map } = ctx
  for (const e of ecs.with('actorState', 'position', 'subtype', 'id', 'migrateTarget')) {
    if (e.actorState!.state !== ActorStateEnum.Migrate) continue
    const { x, y } = e.position!
    const isLand = isLandActor(e.subtype!.kind)
    const next = getNextStep({ x, y }, e.migrateTarget!, isLand, map)
    if (next.x !== x || next.y !== y) {
      map.moveEntity(e.id!, x, y, next.x, next.y)
      e.position!.x = next.x
      e.position!.y = next.y
    }
  }
}

export function mateSystem(ctx: SystemContext): void {
  const { ecs, rng, events, worldState } = ctx
  for (const e of ecs.with('actorState', 'position', 'subtype', 'id', 'mating')) {
    if (e.actorState!.state !== ActorStateEnum.Mate) continue
    const count = rng.int(1, 3)
    for (let i = 0; i < count; i++) {
      const id = ++nextId
      const pos = {
        x: ctx.map.wrapX(e.position!.x + rng.int(-2, 2)),
        y: Math.max(0, Math.min(ctx.map.height - 1, e.position!.y + rng.int(-2, 2))),
      }
      if (e.subtype!.kind === 'animal') spawnAnimal(ecs, pos, rng, id)
      else spawnFish(ecs, pos, rng, id)
      ctx.map.addEntity(id, pos.x, pos.y)
    }
    events.emit({ tick: worldState.tick, origin: e.id!, importance: 2, text: `mating: ${count} offspring` })
    e.mating!.aggro = false
    e.actorState!.state = ActorStateEnum.Wander
    e.actorState!.timer = 20
  }
}

export function aggroSystem(ctx: SystemContext): void {
  const { ecs, worldState, events } = ctx

  const byId = new Map<number, { id: number; subtype: { kind: 'animal' | 'fish' }; health: { current: number; max: number }; position?: { x: number; y: number } }>()
  for (const e of ecs.with('id', 'subtype', 'health')) {
    byId.set(e.id!, { id: e.id!, subtype: e.subtype!, health: e.health!, position: e.position })
  }

  const toRemoveIds = new Set<number>()

  for (const e of ecs.with('actorState', 'position', 'health', 'subtype', 'id', 'mating')) {
    if (e.actorState!.state !== ActorStateEnum.Aggro) continue
    const nearbyIds = ctx.map.getEntitiesInRadius(e.position!.x, e.position!.y, SEARCH_RADIUS)
    for (const nid of nearbyIds) {
      if (nid === e.id) continue
      const rival = byId.get(nid)
      if (!rival || rival.subtype.kind !== e.subtype!.kind) continue
      rival.health.current -= 20
      if (rival.health.current <= 0 && !toRemoveIds.has(nid)) {
        toRemoveIds.add(nid)
        events.emit({ tick: worldState.tick, origin: nid, importance: 1, text: 'actor died (aggro)' })
      }
    }
  }

  for (const e of ecs.with('id')) {
    if (e.id !== undefined && toRemoveIds.has(e.id)) {
      if (e.position) ctx.map.removeEntity(e.id, e.position.x, e.position.y)
      ecs.remove(e)
    }
  }
}
