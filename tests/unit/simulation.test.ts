import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { runSimulation } from '../../miniprogram/domain/simulation'

describe('fixed-seed simulation', () => {
  it('repeats exactly with the same seed', () => {
    const input = { definition, runs: 200, distribution: 'weighted' as const, seed: 42 }
    expect(runSimulation(input)).toEqual(runSimulation(input))
  })
})

