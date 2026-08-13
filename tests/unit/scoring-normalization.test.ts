import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { deriveTheoreticalRanges, normalizeValue } from '../../miniprogram/domain/normalization'
import { aggregateAnswers, questionsForSections } from '../../miniprogram/domain/scoring'

describe('scoring and theoretical normalization', () => {
  it('aggregates effects and signals without treating signals as scores', () => {
    const q13 = definition.questions.filter((question) => question.id === 'Q13')
    const result = aggregateAnswers(q13, { Q13: 'D' })
    expect(result.rawMetrics).toEqual({ R: -1 })
    expect(result.signals).toEqual(['credit_unclear'])
  })

  it('derives ranges from current option effects', () => {
    const personal = questionsForSections(definition, ['personal'])
    const personalRanges = deriveTheoreticalRanges(definition, personal)
    expect(personalRanges.P).toEqual({ min: 0, max: 8 })
    expect(personalRanges.V).toEqual({ min: 1, max: 12 })
    expect(personalRanges.K).toEqual({ min: 0, max: 13 })

    const allRanges = deriveTheoreticalRanges(definition, definition.questions)
    expect(allRanges.R).toEqual({ min: -1, max: 6 })
  })

  it('maps theoretical min and max to 0 and 100', () => {
    expect(normalizeValue(-1, { min: -1, max: 6 })).toBe(0)
    expect(normalizeValue(6, { min: -1, max: 6 })).toBe(100)
    expect(normalizeValue(2.5, { min: -1, max: 6 })).toBe(50)
  })
})
