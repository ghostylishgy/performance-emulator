import {
  LOVE_PERSONA_IDS,
  type LoveAnswerId,
  type LoveAnswers,
  type LovePersonaId,
  type LoveScores,
  type LoveTestDefinition,
} from '../config/tests/love-accident/types'
import { evaluateLoveAccident } from './love-evaluation'

export interface LoveSimulationPersonaStats {
  wins: number
  winPercentage: number
  activations: number
  activationPercentage: number
  winGivenActivationPercentage: number
  averageRawScore: number
  averageConfidence: number
  firstWinningAnswers?: LoveAnswers
}

export interface LoveSimulationReport {
  metadata: { testId: string; testVersion: string; runs: number; seed: number; distribution: 'uniform' }
  personas: Record<LovePersonaId, LoveSimulationPersonaStats>
  noActiveCount: number
  noActivePercentage: number
  fallbackCount: number
  fallbackPercentage: number
  exactTopTieCount: number
  exactTopTiePercentage: number
  nearTopTieCount: number
  nearTopTiePercentage: number
}

function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

export function simulateLoveAccident(definition: LoveTestDefinition, runs: number, seed: number): LoveSimulationReport {
  if (!Number.isInteger(runs) || runs <= 0) throw new Error('runs must be a positive integer')
  const random = lcg(seed)
  const answerIds: LoveAnswerId[] = ['A', 'B', 'C', 'D']
  const wins = Object.fromEntries(LOVE_PERSONA_IDS.map((id) => [id, 0])) as unknown as LoveScores
  const activations = Object.fromEntries(LOVE_PERSONA_IDS.map((id) => [id, 0])) as unknown as LoveScores
  const rawSums = Object.fromEntries(LOVE_PERSONA_IDS.map((id) => [id, 0])) as unknown as LoveScores
  const confidenceSums = Object.fromEntries(LOVE_PERSONA_IDS.map((id) => [id, 0])) as unknown as LoveScores
  const firstWinningAnswers: Partial<Record<LovePersonaId, LoveAnswers>> = {}
  let noActiveCount = 0
  let fallbackCount = 0
  let exactTopTieCount = 0
  let nearTopTieCount = 0

  for (let run = 0; run < runs; run += 1) {
    const answers = Object.fromEntries(definition.questions.map((question) => [
      question.id,
      answerIds[Math.floor(random() * answerIds.length)]!,
    ])) as LoveAnswers
    const result = evaluateLoveAccident(definition, answers)
    wins[result.final_persona] += 1
    if (result.resolution_mode === 'fallback') fallbackCount += 1
    if (!firstWinningAnswers[result.final_persona]) firstWinningAnswers[result.final_persona] = answers
    for (const candidate of result.candidates) {
      if (candidate.active) activations[candidate.persona] += 1
      rawSums[candidate.persona] += candidate.rawScore
      confidenceSums[candidate.persona] += candidate.confidence
    }
    const resolutionPool = result.resolution_mode === 'gated'
      ? result.candidates.filter((candidate) => candidate.active)
      : result.candidates
    const maxConfidence = Math.max(...resolutionPool.map((candidate) => candidate.confidence))
    if (resolutionPool.filter((candidate) => candidate.confidence === maxConfidence).length > 1) exactTopTieCount += 1
    if (resolutionPool.filter((candidate) => maxConfidence - candidate.confidence <= definition.confidenceTieEpsilon + Number.EPSILON).length > 1) nearTopTieCount += 1
  }

  const personas = Object.fromEntries(LOVE_PERSONA_IDS.map((id) => {
    const activationCount = activations[id]
    return [id, {
      wins: wins[id],
      winPercentage: wins[id] / runs * 100,
      activations: activationCount,
      activationPercentage: activationCount / runs * 100,
      winGivenActivationPercentage: activationCount ? wins[id] / activationCount * 100 : 0,
      averageRawScore: rawSums[id] / runs,
      averageConfidence: confidenceSums[id] / runs,
      ...(firstWinningAnswers[id] ? { firstWinningAnswers: firstWinningAnswers[id] } : {}),
    }]
  })) as Record<LovePersonaId, LoveSimulationPersonaStats>

  return {
    metadata: { testId: definition.id, testVersion: definition.version, runs, seed, distribution: 'uniform' },
    personas,
    noActiveCount,
    noActivePercentage: noActiveCount / runs * 100,
    fallbackCount,
    fallbackPercentage: fallbackCount / runs * 100,
    exactTopTieCount,
    exactTopTiePercentage: exactTopTieCount / runs * 100,
    nearTopTieCount,
    nearTopTiePercentage: nearTopTieCount / runs * 100,
  }
}
