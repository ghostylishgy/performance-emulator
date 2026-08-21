import type { Answers, V3TestDefinition } from '../config/v3-types'

export type QuizStage = 'answering' | 'complete'

export interface QuizProgress {
  testId: string
  testVersion: string
  answers: Answers
  currentQuestionIndex: number
  stage: QuizStage
  timestamp: number
}

export function createProgress(definition: V3TestDefinition, now = Date.now()): QuizProgress {
  return { testId: definition.id, testVersion: definition.version, answers: {}, currentQuestionIndex: 0, stage: 'answering', timestamp: now }
}

export function setAnswer(progress: QuizProgress, definition: V3TestDefinition, questionId: string, optionId: string, now = Date.now()): QuizProgress {
  const question = definition.questions.find((item) => item.id === questionId)
  if (!question) throw new Error(`Unknown question: ${questionId}`)
  if (!question.options.some((option) => option.id === optionId)) throw new Error(`Unknown option ${optionId} for ${questionId}`)
  return { ...progress, answers: { ...progress.answers, [questionId]: optionId as Answers[string] }, timestamp: now }
}

export function advanceProgress(progress: QuizProgress, definition: V3TestDefinition, now = Date.now()): QuizProgress {
  const question = definition.questions[progress.currentQuestionIndex]
  if (!question || !progress.answers[question.id]) throw new Error('Current question must be answered before advancing')
  if (progress.currentQuestionIndex === definition.questions.length - 1) return { ...progress, stage: 'complete', timestamp: now }
  return { ...progress, currentQuestionIndex: progress.currentQuestionIndex + 1, timestamp: now }
}

export function moveBack(progress: QuizProgress, now = Date.now()): QuizProgress {
  if (progress.stage !== 'answering' || progress.currentQuestionIndex <= 0) return progress
  return { ...progress, currentQuestionIndex: progress.currentQuestionIndex - 1, timestamp: now }
}

export const serializeProgress = (progress: QuizProgress): string => JSON.stringify(progress)
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseProgress(serialized: string, definition: V3TestDefinition): QuizProgress {
  const value = JSON.parse(serialized) as unknown
  if (!isRecord(value)) throw new Error('Progress is invalid')
  const parsed = value as Partial<QuizProgress>
  if (parsed.testId !== definition.id || parsed.testVersion !== definition.version) throw new Error('Progress version mismatch')
  if (!isRecord(parsed.answers)) throw new Error('Progress answers are invalid')
  const answers: Answers = {}
  for (const [questionId, optionId] of Object.entries(parsed.answers)) {
    const question = definition.questions.find((item) => item.id === questionId)
    if (!question || typeof optionId !== 'string' || !question.options.some((option) => option.id === optionId)) throw new Error(`Invalid answer ${questionId}`)
    answers[questionId] = optionId as Answers[string]
  }
  const index = Number(parsed.currentQuestionIndex)
  if (!Number.isInteger(index) || index < 0 || index >= definition.questions.length) throw new Error('Progress question index is invalid')
  if (parsed.stage !== 'answering' && parsed.stage !== 'complete') throw new Error('Progress stage is invalid')
  if (typeof parsed.timestamp !== 'number' || !Number.isFinite(parsed.timestamp) || parsed.timestamp < 0) throw new Error('Progress timestamp is invalid')
  const requiredCount = parsed.stage === 'complete' ? definition.questions.length : index
  for (let cursor = 0; cursor < requiredCount; cursor += 1) {
    const question = definition.questions[cursor]!
    if (!answers[question.id]) throw new Error(`Progress answers are incomplete at ${question.id}`)
  }
  if (parsed.stage === 'complete' && index !== definition.questions.length - 1) throw new Error('Complete progress index is invalid')
  if (definition.questions.slice(index + 1).some((question) => answers[question.id])) throw new Error('Progress contains future answers')
  return { testId: parsed.testId, testVersion: parsed.testVersion, answers, currentQuestionIndex: index, stage: parsed.stage, timestamp: parsed.timestamp }
}
