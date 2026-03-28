import { describe, it, expect } from 'vitest'
import { World, Schedule, Query, Res, Entities, applyEntityUpdates } from 'thyseus'

class Pos { constructor(public x = 0, public y = 0) {} }
class Vel { constructor(public dx = 0, public dy = 1) {} }
class Counter { value = 0 }

class UpdateSchedule extends Schedule {}

function moveSystem(q: Query<[Pos, Vel]>) {
  for (const [pos, vel] of q) { pos.x += vel.dx; pos.y += vel.dy }
}
moveSystem.getSystemArguments = (w: World) => [Query.intoArgument(w, [Pos, Vel])]

function spawnSystem(entities: Entities) {
  const e = entities.spawn()
  e.add(new Pos(0, 0))
  e.add(new Vel(1, 0))
}
spawnSystem.getSystemArguments = (w: World) => [w.entities]

function readSystem(q: Query<[Pos]>, counter: Res<Counter>) {
  for (const [pos] of q) { (counter as Counter).value = pos.x }
}
readSystem.getSystemArguments = (w: World) => [
  Query.intoArgument(w, [Pos]),
  Res.intoArgument(w, Counter),
]

class ReadSchedule extends Schedule {}

describe('thyseus sanity', () => {
  it('DI, query, entities, async step', async () => {
    const counter = new Counter()
    const world = await new World()
      .insertResource(counter)
      .addSystems(UpdateSchedule, [spawnSystem, applyEntityUpdates, moveSystem])
      .addSystems(ReadSchedule, [readSystem])
      .prepare()

    await world.runSchedule(UpdateSchedule)  // spawn + apply
    await world.runSchedule(UpdateSchedule)  // move

    await world.runSchedule(ReadSchedule)
    expect(counter.value).toBe(1)
  })
})
