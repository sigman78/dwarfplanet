import { Game } from '../game'
import { BIOME_GLYPH } from '../map/tiles'

function parseArgs(): { ticks: number; seed: number; width: number; height: number } {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => a.replace('--', '').split('=')),
  )
  return {
    ticks: Number(args['ticks'] ?? 100),
    seed: Number(args['seed'] ?? 42),
    width: Number(args['width'] ?? 64),
    height: Number(args['height'] ?? 32),
  }
}

function renderMap(game: Game, width: number, height: number, seed: number): void {
  console.log(`\n[MAP ${width}x${height} seed=${seed}]`)
  for (let y = 0; y < height; y++) {
    let row = ''
    for (let x = 0; x < width; x++) {
      row += BIOME_GLYPH[game.world.map.getBiome(x, y)]
    }
    console.log(row)
  }
}

function main(): void {
  const { ticks, seed, width, height } = parseArgs()
  const game = new Game(seed, { width, height, animalCount: 20, fishCount: 15 })

  renderMap(game, width, height, seed)
  console.log('\n[SIM]')

  const PRINT_EVERY = Math.max(1, Math.floor(ticks / 20))

  for (let t = 0; t <= ticks; t++) {
    if (t > 0) game.step()

    const state = game.getState()
    const recentEvents = game.world.events
      .getRecent(state.tick, Math.max(0, state.tick - PRINT_EVERY + 1))
      .filter((e) => e.importance >= 2)
      .map((e) => e.text)

    if (t % PRINT_EVERY === 0 || recentEvents.length > 0) {
      const evStr = recentEvents.length ? ' | ' + recentEvents.slice(0, 3).join(' | ') : ''
      const line = `tick=${String(state.tick).padEnd(5)} animals=${String(state.animalCount).padEnd(4)} fish=${String(state.fishCount).padEnd(4)}${evStr}`
      console.log(line)
    }
  }

  const final = game.getState()
  console.log(`\n[DONE] tick=${final.tick} animals=${final.animalCount} fish=${final.fishCount}`)
}

main()
