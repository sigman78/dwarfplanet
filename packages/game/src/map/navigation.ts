import type { GameMap } from './map'
import type { Point2d } from '../types'

export function getNextStep(from: Point2d, to: Point2d, isLand: boolean, map: GameMap): Point2d {
  const dx = Math.sign(to.x - from.x)
  const dy = Math.sign(to.y - from.y)
  const nx = map.wrapX(from.x + dx)
  const ny = Math.max(0, Math.min(map.height - 1, from.y + dy))
  if (map.isPassable(nx, ny, isLand)) return { x: nx, y: ny }
  if (dx !== 0 && map.isPassable(map.wrapX(from.x + dx), from.y, isLand)) {
    return { x: map.wrapX(from.x + dx), y: from.y }
  }
  if (dy !== 0 && map.isPassable(from.x, Math.max(0, Math.min(map.height - 1, from.y + dy)), isLand)) {
    return { x: from.x, y: Math.max(0, Math.min(map.height - 1, from.y + dy)) }
  }
  return from
}
