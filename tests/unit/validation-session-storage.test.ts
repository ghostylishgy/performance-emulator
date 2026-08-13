import { describe, expect, it } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { createProgress, freezePersonalProgress, parseProgress, serializeProgress, setAnswer } from '../../miniprogram/domain/session'
import { validateTestDefinition } from '../../miniprogram/domain/validation'
import { inspectStoredProgress } from '../../miniprogram/platform/storage'
import { allA } from '../fixtures'

describe('configuration validation', () => {
  it('accepts the formal performance simulator definition', () => {
    expect(validateTestDefinition(definition)).toEqual([])
  })

  it('rejects organization effects that modify personal metrics', () => {
    const invalid = structuredClone(definition)
    invalid.questions[12]!.options[0]!.effects.P = 1
    expect(validateTestDefinition(invalid)).toContain('Q13.A: P cannot collect from organization')
  })

  it('requires question and chapter membership to agree in both directions', () => {
    const invalid = structuredClone(definition)
    invalid.chapters[0]!.questionIds = invalid.chapters[0]!.questionIds.filter((id) => id !== 'Q1')
    expect(validateTestDefinition(invalid)).toContain('Q1: missing from chapter chapter-1 questionIds')
  })
})

describe('progress freeze and storage serialization', () => {
  it('freezes a copy of Q1-Q12 and rejects later personal writes', () => {
    let progress = createProgress(definition, 1)
    for (let index = 1; index <= 12; index += 1) {
      progress = setAnswer(progress, definition, `Q${index}`, allA[`Q${index}`]!, index)
    }
    const frozen = freezePersonalProgress(progress, definition, 20)
    expect(frozen.progress.baseOutcomeFrozen).toBe(true)
    expect(frozen.progress.frozenPersonalAnswers).toEqual(Object.fromEntries(Object.entries(allA).slice(0, 12)))
    expect(() => setAnswer(frozen.progress, definition, 'Q1', 'B')).toThrow('Personal answers are frozen')
    expect(setAnswer(frozen.progress, definition, 'Q13', 'A').answers.Q13).toBe('A')
  })

  it('round-trips valid progress and protects test versions', () => {
    const progress = createProgress(definition, 123)
    expect(parseProgress(serializeProgress(progress), definition)).toEqual(progress)
    expect(inspectStoredProgress(serializeProgress(progress), definition).status).toBe('current')

    const old = JSON.stringify({ ...progress, testVersion: 'old' })
    expect(inspectStoredProgress(old, definition)).toEqual({ status: 'version-mismatch', storedVersion: 'old' })
  })
})
