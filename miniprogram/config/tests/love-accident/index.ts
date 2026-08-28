import { loveQuestions } from './questions'
import { loveCombinationRules, lovePersonas } from './rules'
import type { LoveTestDefinition } from './types'

export const loveAccidentTest: LoveTestDefinition = {
  id: 'love-accident',
  version: 'v1',
  title: '恋爱事故鉴定书',
  questions: loveQuestions,
  personas: lovePersonas,
  combinationRules: loveCombinationRules,
  confidenceTieEpsilon: 0.02,
}
