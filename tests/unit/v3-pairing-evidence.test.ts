import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import type { PairCodeRecord } from '../../miniprogram/domain/v3-pairing'
import { getPairRelationship, pairKey, resolvePairRecord } from '../../miniprogram/domain/v3-pairing'
import { evaluateComplete } from '../../miniprogram/domain/v3-evaluation'
import { allA } from '../fixtures'

describe('pair relationships and evidence capture', () => {
  it('contains all 36 unordered pair relationships exactly once', () => {
    expect(definition.pairRelationships).toHaveLength(36)
    expect(new Set(definition.pairRelationships.map((item) => item.key)).size).toBe(36)
  })

  it('returns the same relationship for A+B and B+A', () => {
    expect(pairKey('single_point_failure', 'stable_worker')).toBe(pairKey('stable_worker', 'single_point_failure'))
    expect(getPairRelationship(definition, 'single_point_failure', 'stable_worker'))
      .toEqual(getPairRelationship(definition, 'stable_worker', 'single_point_failure'))
  })

  it('handles successful, invalid and expired pair records', () => {
    const record: PairCodeRecord = {
      resultId: 'result-1', code: 'ABC234', createdAt: 100, expiresAt: 200,
      persona: 'stable_worker', score: '3.5', deathCause: 'none', evaluationVersion: 'engine-v3',
    }
    expect(resolvePairRecord(record, 150).status).toBe('success')
    expect(resolvePairRecord(null, 150).status).toBe('invalid')
    expect(resolvePairRecord(record, 200).status).toBe('expired')
  })

  it('selects only actual answers with category diversity', () => {
    const result = evaluateComplete(definition, allA)
    expect(result.evidence).toHaveLength(3)
    expect(new Set(result.evidence.map((item) => item.questionId)).size).toBe(3)
    for (const item of result.evidence) expect(allA[item.questionId]).toBe(item.optionId)
    expect(result.evidence.map((item) => item.category)).toContain('work_behavior')
    expect(result.evidence.map((item) => item.category)).toContain('expression_org')
    expect(new Set(result.evidence.map((item) => item.category)).size).toBeGreaterThanOrEqual(2)
  })
})
