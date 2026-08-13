import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { moveOutcome } from '../../miniprogram/domain/calibration'
import { evaluateComplete, outcomeForScore } from '../../miniprogram/domain/evaluation-pipeline'
import { allA, allD, answersFromLetters } from '../fixtures'

describe('evaluation pipeline', () => {
  it('implements exact base outcome boundaries', () => {
    expect(outcomeForScore(definition, 42.99)).toBe('3.25')
    expect(outcomeForScore(definition, 43)).toBe('3.5-')
    expect(outcomeForScore(definition, 49.99)).toBe('3.5-')
    expect(outcomeForScore(definition, 50)).toBe('3.5')
    expect(outcomeForScore(definition, 62)).toBe('3.5+')
    expect(outcomeForScore(definition, 70)).toBe('3.75')
  })

  it('clamps generic calibration at 3.75 and never reaches 4.0', () => {
    expect(moveOutcome('3.75', 1, definition.outcomeConfig.scale)).toBe('3.75')
    expect(moveOutcome('3.25', -1, definition.outcomeConfig.scale)).toBe('3.25')
  })

  it('allows 4.0 only through the configured special gate', () => {
    const answers = { ...allA, Q2: 'B', Q10: 'B' }
    const result = evaluateComplete(definition, answers)
    expect(result.baseOutcome).toBe('3.75')
    expect(result.organizationScore).toBeGreaterThanOrEqual(88)
    expect(result.finalOutcome).toBe('4.0')
    expect(result.hiddenResults).toEqual(['organization-legend'])
  })

  it('uses signals as evidence, not automatic one-step penalties', () => {
    const answers = answersFromLetters('AAAAAAAAAAAABAAA')
    const result = evaluateComplete(definition, answers)
    expect(result.signals).toEqual([])
    expect(result.calibrationDelta).toBeGreaterThanOrEqual(0)

    const lowSignalResult = evaluateComplete(definition, allD)
    expect(lowSignalResult.signals).toEqual(['credit_unclear', 'quota_tight', 'strategy_faded'])
    expect(lowSignalResult.calibrationDelta).toBe(-1)
  })

  it('is deterministic for identical config and answers', () => {
    expect(evaluateComplete(definition, allA)).toEqual(evaluateComplete(definition, allA))
  })

  it('preserves two different stories that end at the same outcome', () => {
    const down = evaluateComplete(definition, answersFromLetters('ABAAAAAAABAADDDD'))
    const up = evaluateComplete(definition, answersFromLetters('BBBBDBBBDCDCBABB'))
    expect({ base: down.baseOutcome, delta: down.calibrationDelta, final: down.finalOutcome }).toEqual({ base: '3.75', delta: -1, final: '3.5+' })
    expect({ base: up.baseOutcome, delta: up.calibrationDelta, final: up.finalOutcome }).toEqual({ base: '3.5', delta: 1, final: '3.5+' })
    expect(down.calibrationReason).not.toBe(up.calibrationReason)
  })
})
