import type {
  LoveAnswerId,
  LoveAnswers,
  LoveQuestionId,
  LoveTestDefinition,
} from '../config/tests/love-accident/types'

export type LovePartialAnswers = Partial<LoveAnswers>
export type LoveQuizStage = 'answering' | 'complete'

export interface LoveQuizProgress {
  productId: 'love_accident'
  testId: 'love-accident'
  testVersion: string
  answers: LovePartialAnswers
  currentQuestionIndex: number
  stage: LoveQuizStage
  startedAt: number
  updatedAt: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const validTimestamp = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0

export function createLoveProgress(definition: LoveTestDefinition, now = Date.now()): LoveQuizProgress {
  return {
    productId: 'love_accident',
    testId: definition.id,
    testVersion: definition.version,
    answers: {},
    currentQuestionIndex: 0,
    stage: 'answering',
    startedAt: now,
    updatedAt: now,
  }
}

export function setLoveAnswer(
  progress: LoveQuizProgress,
  definition: LoveTestDefinition,
  questionId: LoveQuestionId,
  optionId: LoveAnswerId,
  now = Date.now(),
): LoveQuizProgress {
  const question = definition.questions.find((item) => item.id === questionId)
  if (!question) throw new Error(`Unknown love question: ${questionId}`)
  if (!question.options.some((option) => option.id === optionId)) throw new Error(`Unknown love option ${optionId} for ${questionId}`)
  return { ...progress, answers: { ...progress.answers, [questionId]: optionId }, updatedAt: now }
}

export function advanceLoveProgress(progress: LoveQuizProgress, definition: LoveTestDefinition, now = Date.now()): LoveQuizProgress {
  const question = definition.questions[progress.currentQuestionIndex]
  if (!question || !progress.answers[question.id]) throw new Error('Current love question must be answered before advancing')
  if (progress.currentQuestionIndex === definition.questions.length - 1) {
    return { ...progress, stage: 'complete', updatedAt: now }
  }
  return { ...progress, currentQuestionIndex: progress.currentQuestionIndex + 1, updatedAt: now }
}

export function moveBackLoveProgress(progress: LoveQuizProgress, now = Date.now()): LoveQuizProgress {
  if (progress.stage !== 'answering' || progress.currentQuestionIndex <= 0) return progress
  return { ...progress, currentQuestionIndex: progress.currentQuestionIndex - 1, updatedAt: now }
}

export const serializeLoveProgress = (progress: LoveQuizProgress): string => JSON.stringify(progress)

export function parseLoveProgress(serialized: string, definition: LoveTestDefinition): LoveQuizProgress {
  const value = JSON.parse(serialized) as unknown
  if (!isRecord(value)) throw new Error('Love progress is invalid')
  const parsed = value as Partial<LoveQuizProgress>
  if (parsed.productId !== 'love_accident' || parsed.testId !== definition.id || parsed.testVersion !== definition.version) {
    throw new Error('Love progress version mismatch')
  }
  if (!isRecord(parsed.answers)) throw new Error('Love progress answers are invalid')
  const answers: LovePartialAnswers = {}
  for (const [questionId, optionId] of Object.entries(parsed.answers)) {
    const question = definition.questions.find((item) => item.id === questionId)
    if (!question || typeof optionId !== 'string' || !question.options.some((option) => option.id === optionId)) {
      throw new Error(`Invalid love answer ${questionId}`)
    }
    answers[questionId as LoveQuestionId] = optionId as LoveAnswerId
  }
  const index = Number(parsed.currentQuestionIndex)
  if (!Number.isInteger(index) || index < 0 || index >= definition.questions.length) throw new Error('Love progress question index is invalid')
  if (parsed.stage !== 'answering' && parsed.stage !== 'complete') throw new Error('Love progress stage is invalid')
  if (!validTimestamp(parsed.startedAt) || !validTimestamp(parsed.updatedAt)) throw new Error('Love progress timestamp is invalid')
  const requiredCount = parsed.stage === 'complete' ? definition.questions.length : index
  for (let cursor = 0; cursor < requiredCount; cursor += 1) {
    const question = definition.questions[cursor]!
    if (!answers[question.id]) throw new Error(`Love progress answers are incomplete at ${question.id}`)
  }
  if (parsed.stage === 'complete' && index !== definition.questions.length - 1) throw new Error('Complete love progress index is invalid')
  if (definition.questions.slice(index + 1).some((question) => answers[question.id])) throw new Error('Love progress contains future answers')
  return {
    productId: parsed.productId,
    testId: parsed.testId,
    testVersion: parsed.testVersion,
    answers,
    currentQuestionIndex: index,
    stage: parsed.stage,
    startedAt: parsed.startedAt,
    updatedAt: parsed.updatedAt,
  }
}
