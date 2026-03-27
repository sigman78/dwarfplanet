import { Biome, BIOME_DEFS } from './tiles'
import type { EntityId } from '../types'

export class GameMap {
  readonly width: number
  readonly height: number
  readonly biomes: Uint8Array
  private readonly spatialHash: Map<number, Set<EntityId>> = new Map()
  private readonly cellSize = 4

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.biomes = new Uint8Array(width * height)
  }

  wrapX(x: number): number {
    return ((x % this.width) + this.width) % this.width
  }

  clampY(y: number): number {
    return Math.max(0, Math.min(this.height - 1, y))
  }

  getBiome(x: number, y: number): Biome {
    return this.biomes[this.wrapX(x) + this.clampY(y) * this.width] as Biome
  }

  setBiome(x: number, y: number, biome: Biome): void {
    this.biomes[this.wrapX(x) + this.clampY(y) * this.width] = biome
  }

  isPassable(x: number, y: number, isLand: boolean): boolean {
    const biome = this.getBiome(x, y)
    return isLand ? BIOME_DEFS[biome].walkable : BIOME_DEFS[biome].swimmable
  }

  private cellKey(x: number, y: number): number {
    const cellCols = Math.ceil(this.width / this.cellSize)
    return Math.floor(x / this.cellSize) + Math.floor(y / this.cellSize) * cellCols
  }

  addEntity(id: EntityId, x: number, y: number): void {
    const key = this.cellKey(x, y)
    if (!this.spatialHash.has(key)) this.spatialHash.set(key, new Set())
    this.spatialHash.get(key)!.add(id)
  }

  removeEntity(id: EntityId, x: number, y: number): void {
    this.spatialHash.get(this.cellKey(x, y))?.delete(id)
  }

  moveEntity(id: EntityId, fromX: number, fromY: number, toX: number, toY: number): void {
    this.removeEntity(id, fromX, fromY)
    this.addEntity(id, toX, toY)
  }

  getEntitiesInRadius(cx: number, cy: number, radius: number): Set<EntityId> {
    const result = new Set<EntityId>()
    const cellCols = Math.ceil(this.width / this.cellSize)
    const cellRows = Math.ceil(this.height / this.cellSize)
    const cellRadius = Math.ceil(radius / this.cellSize) + 1
    const ccx = Math.floor(cx / this.cellSize)
    const ccy = Math.floor(cy / this.cellSize)

    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const ncx = ccx + dx
        const ncy = ccy + dy
        if (ncx < 0 || ncx >= cellCols || ncy < 0 || ncy >= cellRows) continue
        const cell = this.spatialHash.get(ncx + ncy * cellCols)
        if (cell) for (const id of cell) result.add(id)
      }
    }
    return result
  }
}
