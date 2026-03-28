import { Game } from '../game'
import { BIOME_GLYPH } from '../map/tiles'
import { AnimalBehaviorPhase } from '../components/animal'

function parseArgs(): { ticks: number; seed: number; width: number; height: number; animalCount: number; fishCount: number } {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => a.replace('--', '').split('=')),
  )
  return {
    ticks: Number(args['ticks'] ?? 100),
    seed: Number(args['seed'] ?? 42),
    width: Number(args['width'] ?? 64),
    height: Number(args['height'] ?? 32),
    animalCount: Number(args['animalCount'] ?? 20),
    fishCount: Number(args['fishCount'] ?? 15),
  }
}

function buildActorMap(game: Game): Map<string, 'animal' | 'fish'> {
  const actorMap = new Map<string, 'animal' | 'fish'>()
  game.world.iterateActors((x, y, habitat) => {
    const key = `${x},${y}`
    if (habitat === 'water') {
      if (!actorMap.has(key)) actorMap.set(key, 'fish')
    } else {
      actorMap.set(key, 'animal')
    }
  })
  return actorMap
}

function renderMapWithActors(game: Game, width: number, height: number, seed: number): void {
  const actorMap = buildActorMap(game)
  console.log(`\n[MAP ${width}x${height} seed=${seed}]`)
  for (let y = 0; y < height; y++) {
    let row = ''
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`
      const actor = actorMap.get(key)
      if (actor === 'animal') {
        row += '@'
      } else if (actor === 'fish') {
        row += 'f'
      } else {
        row += BIOME_GLYPH[game.world.map.getBiome(x, y)]
      }
    }
    console.log(row)
  }
}

function phaseLabel(phase: AnimalBehaviorPhase): string {
  return AnimalBehaviorPhase[phase] ?? String(phase)
}

function countDeaths(events: Array<{ text: string }>, cause: string): number {
  let total = 0
  for (const e of events) {
    if (e.text.includes(cause)) {
      const match = e.text.match(/\(x(\d+)\)/)
      if (match) {
        total += Number(match[1])
      } else {
        total += 1
      }
    }
  }
  return total
}

async function main(): Promise<void> {
  const { ticks, seed, width, height, animalCount, fishCount } = parseArgs()
  const game = await Game.create(seed, { width, height, animalCount, fishCount })

  renderMapWithActors(game, width, height, seed)

  let spotlightId: number | null = null
  game.world.iterateActors((x, y, habitat) => {
    if (spotlightId === null && habitat === 'land') {
      const snapshot = game.world.snapshotActors()
      const match = snapshot.find((a) => a.x === x && a.y === y)
      if (match) spotlightId = match.id
    }
  })

  if (spotlightId !== null) {
    console.log(`spotlight: animal #${spotlightId}`)
  }

  console.log('\n[SIM]')
  const PRINT_EVERY = Math.max(1, Math.floor(ticks / 10))
  let lastPrintTick = -1

  for (let t = 0; t <= ticks; t++) {
    if (t > 0) await game.step()

    const state = game.getState()

    if (t % PRINT_EVERY === 0) {
      console.log(
        `tick=${String(state.tick).padEnd(5)} animals=${String(state.animalCount).padEnd(4)} fish=${String(state.fishCount).padEnd(4)} | [state counts not available]`,
      )

      if (spotlightId !== null) {
        const info = game.world.getEntityInfo(spotlightId)
        if (info) {
          console.log(
            `  spotlight #${spotlightId}  pos=(${info.x},${info.y}) hunger=${info.hunger.toFixed(2)} age=${info.ageTicks} phase=${phaseLabel(info.phase)}`,
          )
        } else {
          console.log(`  spotlight #${spotlightId}  (died)`)
        }
      }

      const events = game.world.events.getRecent(state.tick, Math.max(0, lastPrintTick + 1))
      for (const e of events) {
        console.log(`  [t${e.tick}] ${e.text}`)
      }
      lastPrintTick = state.tick
    }
  }

  const final = game.getState()

  console.log('\n')
  renderMapWithActors(game, width, height, seed)

  const allEvents = game.world.events.getRecent(final.tick, 0)
  const oldAgeDeaths = countDeaths(allEvents, 'old age')
  const hungerDeaths = countDeaths(allEvents, 'hunger')
  const aggroDeaths = countDeaths(allEvents, 'aggro')

  console.log(`\n[DONE] tick=${final.tick} animals=${final.animalCount} fish=${final.fishCount}`)
  console.log(`DEATHS: old-age=${oldAgeDeaths}  hunger=${hungerDeaths}  aggro=${aggroDeaths}`)
}

main()
