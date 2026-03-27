import type { SystemContext } from './context'

type System = (ctx: SystemContext) => void

export class Processor {
  private systems: System[] = []

  register(system: System): void {
    this.systems.push(system)
  }

  tick(ctx: SystemContext): void {
    for (const system of this.systems) {
      system(ctx)
    }
  }
}
