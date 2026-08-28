import { loveActivationGates } from '../config/tests/love-accident/rules'
import {
  LOVE_PERSONA_IDS,
  type LoveAnswers,
  type LoveCandidate,
  type LoveCombinationRule,
  type LoveEvaluationResult,
  type LovePersonaId,
  type LoveScores,
  type LoveTestDefinition,
} from '../config/tests/love-accident/types'

export class InvalidLoveAnswersError extends Error {}

export function emptyLoveScores(): LoveScores {
  return Object.fromEntries(LOVE_PERSONA_IDS.map((persona) => [persona, 0])) as unknown as LoveScores
}

export function validateCompleteLoveAnswers(definition: LoveTestDefinition, answers: Partial<LoveAnswers>): asserts answers is LoveAnswers {
  const expectedIds = new Set(definition.questions.map((question) => question.id))
  const suppliedIds = Object.keys(answers)
  const missing = definition.questions.filter((question) => answers[question.id] === undefined).map((question) => question.id)
  const extra = suppliedIds.filter((questionId) => !expectedIds.has(questionId as `Q${number}`))
  const invalid = definition.questions.filter((question) => {
    const answer = answers[question.id]
    return answer !== undefined && !question.options.some((option) => option.id === answer)
  }).map((question) => question.id)
  if (missing.length || extra.length || invalid.length) {
    throw new InvalidLoveAnswersError(`Invalid love answers: missing=[${missing.join(',')}], extra=[${extra.join(',')}], invalid=[${invalid.join(',')}]`)
  }
}

export function ruleMatches(rule: LoveCombinationRule, answers: LoveAnswers): boolean {
  return rule.conditions.every((condition) => {
    const answer = answers[condition.questionId]
    return answer !== undefined && condition.answers.includes(answer)
  })
}

export function calculateLoveScores(definition: LoveTestDefinition, answers: LoveAnswers): {
  rawScores: LoveScores
  matchedRules: LoveCombinationRule[]
  coreFiveCounts: LoveScores
  combinationCounts: LoveScores
} {
  const rawScores = emptyLoveScores()
  const coreFiveCounts = emptyLoveScores()
  const combinationCounts = emptyLoveScores()
  for (const question of definition.questions) {
    const option = question.options.find((item) => item.id === answers[question.id])!
    for (const persona of LOVE_PERSONA_IDS) {
      const score = option.scores[persona] ?? 0
      rawScores[persona] += score
      if (score === 5) coreFiveCounts[persona] += 1
    }
  }
  const matchedRules = definition.combinationRules.filter((rule) => ruleMatches(rule, answers))
  for (const rule of matchedRules) {
    for (const persona of LOVE_PERSONA_IDS) {
      const bonus = rule.bonuses[persona] ?? 0
      rawScores[persona] += bonus
      if (bonus > 0) combinationCounts[persona] += 1
    }
  }
  return { rawScores, matchedRules, coreFiveCounts, combinationCounts }
}

function selectCandidate(candidates: LoveCandidate[], epsilon: number): LoveCandidate | undefined {
  if (!candidates.length) return undefined
  const maxConfidence = Math.max(...candidates.map((candidate) => candidate.confidence))
  const close = candidates.filter((candidate) => maxConfidence - candidate.confidence <= epsilon + Number.EPSILON)
  return close.sort((left, right) => (
    right.coreFiveCount - left.coreFiveCount
    || right.combinationCount - left.combinationCount
    || right.rawScore - left.rawScore
    || left.priority - right.priority
  ))[0]
}

export function evaluateLoveAccident(definition: LoveTestDefinition, input: Partial<LoveAnswers>): LoveEvaluationResult {
  validateCompleteLoveAnswers(definition, input)
  const answers = { ...input } as LoveAnswers
  const { rawScores, matchedRules, coreFiveCounts, combinationCounts } = calculateLoveScores(definition, answers)
  const confidenceScores = emptyLoveScores()
  const candidates = definition.personas.map((persona): LoveCandidate => {
    const confidence = rawScores[persona.id] / persona.baseline
    confidenceScores[persona.id] = confidence
    return {
      persona: persona.id,
      active: loveActivationGates[persona.id](answers, rawScores),
      rawScore: rawScores[persona.id],
      confidence,
      coreFiveCount: coreFiveCounts[persona.id],
      combinationCount: combinationCounts[persona.id],
      priority: persona.priority,
    }
  })
  const activeCandidates = candidates.filter((candidate) => candidate.active)
  const resolutionMode = activeCandidates.length ? 'gated' : 'fallback'
  const resolutionPool = activeCandidates.length ? activeCandidates : candidates
  const winner = selectCandidate(resolutionPool, definition.confidenceTieEpsilon)!
  const secondary = selectCandidate(resolutionPool.filter((candidate) => candidate.persona !== winner.persona), definition.confidenceTieEpsilon)
  return {
    final_persona: winner.persona,
    raw_scores: rawScores,
    confidence_scores: confidenceScores,
    secondary_persona: secondary?.persona ?? null,
    mirror_double_score: matchedRules.reduce((sum, rule) => sum + (rule.bonuses.DOUBLE ?? 0), 0),
    hidden_badges: matchedRules.flatMap((rule) => rule.hiddenBadge ? [rule.hiddenBadge] : []),
    answers,
    test_version: definition.version,
    resolution_mode: resolutionMode,
    fallback_reason: resolutionMode === 'fallback' ? 'no_active_persona' : null,
    activated_personas: activeCandidates.map((candidate) => candidate.persona),
    matched_combination_rules: matchedRules.map((rule) => rule.id),
    candidates,
  }
}

export function personaName(definition: LoveTestDefinition, personaId: LovePersonaId): string {
  const persona = definition.personas.find((item) => item.id === personaId)
  if (!persona) throw new Error(`Unknown love persona: ${personaId}`)
  return persona.name
}
