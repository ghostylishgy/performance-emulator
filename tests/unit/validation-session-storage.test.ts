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
  const personalAnswers = Object.fromEntries(Object.entries(allA).slice(0, 12))

  function frozenProgress() {
    return {
      ...createProgress(definition, 20),
      answers: { ...personalAnswers },
      currentQuestionIndex: 12,
      stage: 'organization-transition' as const,
      baseOutcomeFrozen: true,
      frozenPersonalAnswers: { ...personalAnswers },
    }
  }

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

  it('round-trips a resumable manual chapter transition', () => {
    const progress = {
      ...createProgress(definition, 123),
      answers: Object.fromEntries(Object.entries(allA).slice(0, 4)),
      stage: 'chapter-transition' as const,
      currentQuestionIndex: 4,
      pendingTransitionChapterId: 'chapter-1',
    }
    expect(parseProgress(serializeProgress(progress), definition)).toEqual(progress)
  })

  it('round-trips every resumable stage produced by the quiz flow', () => {
    const personal = {
      ...createProgress(definition, 10),
      answers: Object.fromEntries(Object.entries(allA).slice(0, 5)),
      currentQuestionIndex: 4,
    }
    const checkpoint = {
      ...createProgress(definition, 11),
      answers: { ...personalAnswers },
      currentQuestionIndex: 11,
      stage: 'checkpoint' as const,
    }
    const organizationTransition = frozenProgress()
    const organization = {
      ...organizationTransition,
      answers: Object.fromEntries(Object.entries(allA).slice(0, 14)),
      currentQuestionIndex: 13,
      stage: 'organization' as const,
    }
    const complete = {
      ...organizationTransition,
      answers: { ...allA },
      currentQuestionIndex: 15,
      stage: 'complete' as const,
    }

    for (const progress of [personal, checkpoint, organizationTransition, organization, complete]) {
      expect(parseProgress(serializeProgress(progress), definition)).toEqual(progress)
      expect(inspectStoredProgress(serializeProgress(progress), definition).status).toBe('current')
    }
  })

  it.each([
    ['complete progress missing organization answers', () => ({ ...frozenProgress(), stage: 'complete', currentQuestionIndex: 15 })],
    ['an unknown question', () => ({ ...createProgress(definition, 1), answers: { Q99: 'A' } })],
    ['an invalid option', () => ({ ...createProgress(definition, 1), answers: { Q1: 'Z' } })],
    ['incomplete frozen answers', () => ({ ...frozenProgress(), frozenPersonalAnswers: Object.fromEntries(Object.entries(personalAnswers).slice(0, 11)) })],
    ['mismatched frozen answers', () => ({ ...frozenProgress(), frozenPersonalAnswers: { ...personalAnswers, Q1: 'B' } })],
    ['a complete stage at the wrong index', () => ({ ...frozenProgress(), answers: { ...allA }, stage: 'complete', currentQuestionIndex: 14 })],
    ['an organization stage without a frozen result', () => ({ ...createProgress(definition, 1), answers: { ...personalAnswers }, stage: 'organization', currentQuestionIndex: 12 })],
    ['a personal stage pointing at an organization question', () => ({ ...createProgress(definition, 1), answers: { ...personalAnswers }, currentQuestionIndex: 12 })],
  ])('marks %s as corrupt', (_label, createInvalidProgress) => {
    expect(inspectStoredProgress(JSON.stringify(createInvalidProgress()), definition)).toEqual({ status: 'corrupt' })
  })
})
