import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { advanceProgress, createProgress, parseProgress, serializeProgress, setAnswer } from '../../miniprogram/domain/session'
import { validateTestDefinition } from '../../miniprogram/domain/validation'
import { inspectStoredProgress } from '../../miniprogram/platform/storage'

describe('V3 continuous 25-question session', () => {
  it('validates the complete V3 configuration', () => expect(validateTestDefinition(definition)).toEqual([]))

  it('walks all 25 questions without checkpoint or section stages', () => {
    let progress = createProgress(definition, 1)
    for (const question of definition.questions) {
      progress = setAnswer(progress, definition, question.id, 'A', 2)
      progress = advanceProgress(progress, definition, 3)
    }
    expect(Object.keys(progress.answers)).toHaveLength(25)
    expect(progress.stage).toBe('complete')
    expect(progress.currentQuestionIndex).toBe(24)
    expect(parseProgress(serializeProgress(progress), definition)).toEqual(progress)
  })

  it('rejects incomplete complete sessions and future answers', () => {
    const incomplete = { ...createProgress(definition), stage: 'complete' as const, currentQuestionIndex: 24 }
    expect(() => parseProgress(JSON.stringify(incomplete), definition)).toThrow('incomplete')
    const future = { ...createProgress(definition), answers: { Q2: 'A' } }
    expect(() => parseProgress(JSON.stringify(future), definition)).toThrow('future')
  })

  it('isolates old progress by test version', () => {
    const old = { ...createProgress(definition), testVersion: 'v1' }
    expect(inspectStoredProgress(JSON.stringify(old), definition)).toEqual({ status: 'version-mismatch', storedVersion: 'v1' })
  })
})
