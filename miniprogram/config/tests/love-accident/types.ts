export const LOVE_PERSONA_IDS = [
  'MOON', 'AUDIT', 'REFUND', 'AI', 'PRIVATE', 'EVIDENCE',
  'DD', 'DOUBLE', 'POMP', 'CARD3', 'FUTURE', 'DIGNITY',
] as const

export type LovePersonaId = typeof LOVE_PERSONA_IDS[number]
export type LoveAnswerId = 'A' | 'B' | 'C' | 'D'
export type LoveQuestionId = `Q${number}`
export type LoveAnswers = Record<LoveQuestionId, LoveAnswerId>
export type LoveScores = Record<LovePersonaId, number>

export interface LoveQuestionOption {
  id: LoveAnswerId
  text: string
  scores: Partial<LoveScores>
}

export interface LoveQuestionDefinition {
  id: LoveQuestionId
  title: string
  prompt: string
  options: LoveQuestionOption[]
}

export interface LovePersonaDefinition {
  id: LovePersonaId
  name: string
  baseline: number
  priority: number
  resultCard: LoveResultCardContent | null
}

export interface LoveResultCardContent {
  summary: string
  detail: string
}

export interface LoveRuleCondition {
  questionId: LoveQuestionId
  answers: LoveAnswerId[]
}

export interface LoveCombinationRule {
  id: string
  label: string
  conditions: LoveRuleCondition[]
  bonuses: Partial<LoveScores>
  hiddenBadge?: string
}

export interface LoveTestDefinition {
  id: 'love-accident'
  version: string
  title: '恋爱事故鉴定书'
  questions: LoveQuestionDefinition[]
  personas: LovePersonaDefinition[]
  combinationRules: LoveCombinationRule[]
  confidenceTieEpsilon: number
}

export interface LoveCandidate {
  persona: LovePersonaId
  active: boolean
  rawScore: number
  confidence: number
  coreFiveCount: number
  combinationCount: number
  priority: number
}

export interface LoveEvaluationResult {
  final_persona: LovePersonaId
  raw_scores: LoveScores
  confidence_scores: LoveScores
  secondary_persona: LovePersonaId | null
  mirror_double_score: number
  hidden_badges: string[]
  answers: LoveAnswers
  test_version: string
  resolution_mode: 'gated' | 'fallback'
  fallback_reason: 'no_active_persona' | null
  activated_personas: LovePersonaId[]
  matched_combination_rules: string[]
  candidates: LoveCandidate[]
}
