import type { Answers, TestDefinition } from '../config/types'
import { evaluatePersonal } from './evaluation-pipeline'

export type QuizStage = 'personal' | 'chapter-transition' | 'checkpoint' | 'organization-transition' | 'organization' | 'complete'

export interface QuizProgress {
  testId: string
  testVersion: string
  answers: Answers
  currentQuestionIndex: number
  stage: QuizStage
  baseOutcomeFrozen: boolean
  frozenPersonalAnswers?: Answers
  pendingTransitionChapterId?: string
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseAnswers(value: unknown, definition: TestDefinition, label: string): Answers {
  if (!isRecord(value)) throw new Error(`${label} are invalid`)
  const answers: Answers = {}
  for (const [questionId, optionId] of Object.entries(value)) {
    const question = definition.questions.find((item) => item.id === questionId)
    if (!question) throw new Error(`${label} contain unknown question ${questionId}`)
    if (typeof optionId !== 'string' || !question.options.some((option) => option.id === optionId)) {
      throw new Error(`${label} contain invalid option for ${questionId}`)
    }
    answers[questionId] = optionId
  }
  return answers
}

function assertQuestionsAnswered(questionIds: string[], answers: Answers, label: string): void {
  for (const questionId of questionIds) {
    if (answers[questionId] === undefined) throw new Error(`${label} are incomplete at ${questionId}`)
  }
}

function assertNoAnswers(questionIds: string[], answers: Answers, label: string): void {
  if (questionIds.some((questionId) => answers[questionId] !== undefined)) throw new Error(`${label} contain answers from an invalid stage`)
}

export function parseProgress(serialized: string, definition: TestDefinition): QuizProgress {
  const value = JSON.parse(serialized) as unknown
  if (!isRecord(value)) throw new Error('Progress is invalid')
  const parsed = value as Partial<QuizProgress>
  if (parsed.testId !== definition.id) throw new Error('Progress test id mismatch')
  if (parsed.testVersion !== definition.version) throw new Error('Progress test version mismatch')
  const answers = parseAnswers(parsed.answers, definition, 'Progress answers')
  if (!Number.isInteger(parsed.currentQuestionIndex) || Number(parsed.currentQuestionIndex) < 0 || Number(parsed.currentQuestionIndex) >= definition.questions.length) {
    throw new Error('Progress question index is invalid')
  }
  const currentQuestionIndex = Number(parsed.currentQuestionIndex)
  const validStages: QuizStage[] = ['personal', 'chapter-transition', 'checkpoint', 'organization-transition', 'organization', 'complete']
  if (!parsed.stage || !validStages.includes(parsed.stage)) throw new Error('Progress stage is invalid')
  if (typeof parsed.baseOutcomeFrozen !== 'boolean') throw new Error('Progress frozen flag is invalid')
  if (typeof parsed.timestamp !== 'number' || !Number.isFinite(parsed.timestamp) || parsed.timestamp < 0) throw new Error('Progress timestamp is invalid')

  const firstOrganizationIndex = definition.questions.findIndex((question) => question.section === 'organization')
  if (firstOrganizationIndex <= 0 || definition.questions.slice(0, firstOrganizationIndex).some((question) => question.section !== 'personal')
    || definition.questions.slice(firstOrganizationIndex).some((question) => question.section !== 'organization')) {
    throw new Error('Test section layout is invalid')
  }
  const personalQuestions = definition.questions.slice(0, firstOrganizationIndex)
  const organizationQuestions = definition.questions.slice(firstOrganizationIndex)
  const personalIds = personalQuestions.map((question) => question.id)
  const organizationIds = organizationQuestions.map((question) => question.id)
  const currentQuestion = definition.questions[currentQuestionIndex]!

  assertQuestionsAnswered(definition.questions.slice(0, currentQuestionIndex).map((question) => question.id), answers, 'Progress answers')

  let frozenPersonalAnswers: Answers | undefined
  if (parsed.baseOutcomeFrozen) {
    frozenPersonalAnswers = parseAnswers(parsed.frozenPersonalAnswers, definition, 'Frozen personal answers')
    assertQuestionsAnswered(personalIds, frozenPersonalAnswers, 'Frozen personal answers')
    assertNoAnswers(organizationIds, frozenPersonalAnswers, 'Frozen personal answers')
    assertQuestionsAnswered(personalIds, answers, 'Progress answers')
    for (const questionId of personalIds) {
      if (answers[questionId] !== frozenPersonalAnswers[questionId]) throw new Error(`Frozen answer mismatch at ${questionId}`)
    }
  } else if (parsed.frozenPersonalAnswers !== undefined) {
    throw new Error('Unexpected frozen personal answers')
  }

  if (parsed.stage !== 'chapter-transition' && parsed.pendingTransitionChapterId !== undefined) {
    throw new Error('Unexpected pending chapter transition')
  }

  if (parsed.stage === 'personal') {
    if (parsed.baseOutcomeFrozen || currentQuestion.section !== 'personal') throw new Error('Personal stage is inconsistent')
    assertNoAnswers(organizationIds, answers, 'Progress answers')
  } else if (parsed.stage === 'chapter-transition') {
    if (parsed.baseOutcomeFrozen || currentQuestion.section !== 'personal' || typeof parsed.pendingTransitionChapterId !== 'string') {
      throw new Error('Chapter transition is inconsistent')
    }
    const chapter = definition.chapters.find((item) => item.id === parsed.pendingTransitionChapterId)
    const chapterIndices = chapter?.questionIds.map((questionId) => definition.questions.findIndex((question) => question.id === questionId)) ?? []
    if (!chapter?.transition || chapter.section !== 'personal' || chapterIndices.length === 0
      || Math.max(...chapterIndices) + 1 !== currentQuestionIndex) {
      throw new Error('Pending chapter transition is invalid')
    }
    assertQuestionsAnswered(chapter.questionIds, answers, 'Progress answers')
    assertNoAnswers(organizationIds, answers, 'Progress answers')
  } else if (parsed.stage === 'checkpoint') {
    if (parsed.baseOutcomeFrozen || currentQuestionIndex !== firstOrganizationIndex - 1) throw new Error('Checkpoint stage is inconsistent')
    assertQuestionsAnswered(personalIds, answers, 'Progress answers')
    assertNoAnswers(organizationIds, answers, 'Progress answers')
  } else if (parsed.stage === 'organization-transition') {
    if (!parsed.baseOutcomeFrozen || currentQuestionIndex !== firstOrganizationIndex) throw new Error('Organization transition is inconsistent')
    assertNoAnswers(organizationIds, answers, 'Progress answers')
  } else if (parsed.stage === 'organization') {
    if (!parsed.baseOutcomeFrozen || currentQuestion.section !== 'organization') throw new Error('Organization stage is inconsistent')
  } else {
    if (!parsed.baseOutcomeFrozen || currentQuestionIndex !== definition.questions.length - 1) throw new Error('Complete stage is inconsistent')
    assertQuestionsAnswered(definition.questions.map((question) => question.id), answers, 'Progress answers')
  }

  return {
    testId: parsed.testId,
    testVersion: parsed.testVersion,
    answers,
    currentQuestionIndex,
    stage: parsed.stage,
    baseOutcomeFrozen: parsed.baseOutcomeFrozen,
    ...(frozenPersonalAnswers ? { frozenPersonalAnswers } : {}),
    ...(parsed.pendingTransitionChapterId !== undefined ? { pendingTransitionChapterId: parsed.pendingTransitionChapterId } : {}),
    timestamp: parsed.timestamp,
  }
}
