export type EventOrigin = 'global' | number | { x: number; y: number }

export type GameEvent = {
  tick: number
  origin: EventOrigin
  importance: 1 | 2 | 3
  text: string
}

export class GameEventsLog {
  private events: GameEvent[] = []

  emit(event: GameEvent): void {
    this.events.push(event)
  }

  getRecent(maxTick: number, minTick = 0): GameEvent[] {
    return this.events.filter((e) => e.tick >= minTick && e.tick <= maxTick)
  }

  compact(tick: number): void {
    const tickEvents = this.events.filter((e) => e.tick === tick)
    const other = this.events.filter((e) => e.tick !== tick)

    const grouped = new Map<string, GameEvent[]>()
    for (const e of tickEvents) {
      const key = e.text
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(e)
    }

    const compacted: GameEvent[] = []
    for (const [text, group] of grouped) {
      if (group.length > 5) {
        compacted.push({ tick, origin: 'global', importance: group[0].importance, text: `${text} (x${group.length})` })
      } else {
        compacted.push(...group)
      }
    }

    this.events = [...other, ...compacted]
  }
}
