import type { Answers, TestDefinition } from '../config/types'
import { evaluatePersonal } from './evaluation-pipeline'

export type QuizStage = 'personal' | 'checkpoint' | 'organization-transition' | 'organization' | 'complete'

export interface QuizProgress {
  testId: string
  testVersion: string
  answers: Answers
  currentQuestionIndex: number
  stage: QuizStage
  baseOutcomeFrozen: boolean
  frozenPersonalAnswers?: Answers
  timestamp: number
}

export function createProgress(definition: TestDefinition, now = Date.now()): QuizProgress {
  return {
    testId: definition.id,
    testVersion: definition.version,
    answers: {},
    currentQuestionIndex: 0,
    stage: 'personal',
    baseOutcomeFrozen: false,
    timestamp: now,
  }
}

export function setAnswer(
  progress: QuizProgress,
  definition: TestDefinition,
  questionId: string,
  optionId: string,
  now = Date.now(),
): QuizProgress {
  const question = definition.questions.find((item) => item.id === questionId)
  if (!question) throw new Error(`Unknown question: ${questionId}`)
  if (!question.options.some((option) => option.id === optionId)) throw new Error(`Unknown option ${optionId} for ${questionId}`)
  if (progress.baseOutcomeFrozen && question.section === 'personal') throw new Error('Personal answers are frozen')
  return { ...progress, answers: { ...progress.answers, [questionId]: optionId }, timestamp: now }
}

export function freezePersonalProgress(
  progress: QuizProgress,
  definition: TestDefinition,
  now = Date.now(),
): { progress: QuizProgress; baseOutcome: string } {
  if (progress.baseOutcomeFrozen && progress.frozenPersonalAnswers) {
    return { progress, baseOutcome: evaluatePersonal(definition, progress.frozenPersonalAnswers).baseOutcome }
  }
  const personal = evaluatePersonal(definition, progress.answers)
  const frozenPersonalAnswers = { ...personal.answers }
  return {
    baseOutcome: personal.baseOutcome,
    progress: {
      ...progress,
      answers: { ...progress.answers },
      frozenPersonalAnswers,
      baseOutcomeFrozen: true,
      stage: 'organization-transition',
      currentQuestionIndex: 12,
      timestamp: now,
    },
  }
}

export function serializeProgress(progress: QuizProgress): string {
  return JSON.stringify(progress)
}

export function parseProgress(serialized: string, definition: TestDefinition): QuizProgress {
  const parsed = JSON.parse(serialized) as Partial<QuizProgress>
  if (parsed.testId !== definition.id) throw new Error('Progress test id mismatch')
  if (parsed.testVersion !== definition.version) throw new Error('Progress test version mismatch')
  if (!parsed.answers || typeof parsed.answers !== 'object') throw new Error('Progress answers are invalid')
  if (!Number.isInteger(parsed.currentQuestionIndex) || Number(parsed.currentQuestionIndex) < 0 || Number(parsed.currentQuestionIndex) >= definition.questions.length) {
    throw new Error('Progress question index is invalid')
  }
  const validStages: QuizStage[] = ['personal', 'checkpoint', 'organization-transition', 'organization', 'complete']
  if (!parsed.stage || !validStages.includes(parsed.stage)) throw new Error('Progress stage is invalid')
  if (typeof parsed.baseOutcomeFrozen !== 'boolean') throw new Error('Progress frozen flag is invalid')
  if (parsed.baseOutcomeFrozen && (!parsed.frozenPersonalAnswers || typeof parsed.frozenPersonalAnswers !== 'object')) {
    throw new Error('Frozen personal answers are missing')
  }
  return parsed as QuizProgress
}

