import { describe, it, expect } from 'vitest'
import { Rng } from '../rng'

describe('Rng', () => {
  it('produces deterministic integers with same seed', () => {
    const a = new Rng(42)
    const b = new Rng(42)
    expect(a.int(0, 100)).toBe(b.int(0, 100))
    expect(a.int(0, 100)).toBe(b.int(0, 100))
  })

  it('produces different sequences with different seeds', () => {
    const a = new Rng(1)
    const b = new Rng(2)
    const seqA = Array.from({ length: 5 }, () => a.int(0, 1000))
    const seqB = Array.from({ length: 5 }, () => b.int(0, 1000))
    expect(seqA).not.toEqual(seqB)
  })

  it('int stays within bounds', () => {
    const rng = new Rng(99)
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(5, 10)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThanOrEqual(10)
    }
  })

  it('float stays in [0, 1)', () => {
    const rng = new Rng(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng.float()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
