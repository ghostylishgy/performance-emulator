import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { calculateBaseScore, evaluateComplete, outcomeForBaseScore } from '../../miniprogram/domain/v3-evaluation'
import { allA, allB, allD, answersForCoefficient } from '../fixtures'

describe('V3 performance and organization scoring', () => {
  it('uses the configured BaseScore lower and upper bounds', () => {
    expect(calculateBaseScore(definition, answersForCoefficient('max'))).toBe(99.6)
    const minimum = calculateBaseScore(definition, answersForCoefficient('min'))
    expect(minimum).toBeGreaterThanOrEqual(0)
    expect(minimum).toBeLessThan(42)
  })

  it.each([
    [0, '3.25'], [41.99, '3.25'], [42, '3.5-'], [49.99, '3.5-'],
    [50, '3.5'], [66.99, '3.5'], [67, '3.5+'], [76.99, '3.5+'], [77, '3.75'], [100, '3.75'],
  ] as const)('maps BaseScore %s to %s', (score, outcome) => expect(outcomeForBaseScore(definition, score)).toBe(outcome))

  it('covers organization +1, 0 and -1 calibration', () => {
    expect(evaluateComplete(definition, allA).calibrationDelta).toBe(1)
    expect(evaluateComplete(definition, allB).calibrationDelta).toBe(0)
    expect(evaluateComplete(definition, allD).calibrationDelta).toBe(-1)
    expect(evaluateComplete(definition, allB).organizationScore).toBe(72.98)
    expect(evaluateComplete(definition, allD).organizationScore).toBe(31.43)
  })

  it('blocks upward adjustment when a strong negative organization signal exists', () => {
    const result = evaluateComplete(definition, { ...allA, Q24: 'D' })
    expect(result.organizationScore).toBeGreaterThanOrEqual(78)
    expect(result.organizationSignals).toContain('quota_tight')
    expect(result.calibrationDelta).toBe(0)
  })

  it('uses the independent 4.0 gate and never promotes 3.75 mechanically', () => {
    expect(evaluateComplete(definition, allA).finalOutcome).toBe('4.0')
    const belowGate = evaluateComplete(definition, { ...allA, Q1: 'D', Q2: 'D' })
    expect(belowGate.baseScore).toBeLessThan(86)
    expect(belowGate.finalOutcome).not.toBe('4.0')
  })

  it('does not penalize Q4C or Q18C for being transferable', () => {
    const maximum = answersForCoefficient('max')
    expect(maximum.Q4).toBe('C')
    expect(maximum.Q18).toBe('C')
    expect(definition.questions[3]!.options.find((option) => option.id === 'C')!.coefficient).toBe(1)
    expect(definition.questions[17]!.options.find((option) => option.id === 'C')!.coefficient).toBe(1)
    expect(calculateBaseScore(definition, maximum)).toBe(99.6)
  })

  it('is deterministic without a user-facing dimension report', () => {
    const first = evaluateComplete(definition, allB)
    expect(first).toEqual(evaluateComplete(definition, allB))
    expect(first).not.toHaveProperty('dimensions')
  })

  it('forces the special 4.0 ending to have no death cause', () => {
    const result = evaluateComplete(definition, allA)
    expect(result.finalOutcome).toBe('4.0')
    expect(result.deathCause).toBe('none')
  })
})
