import type { Answers, V3TestDefinition } from '../config/v3-types'
import { evaluateComplete } from './v3-evaluation'

export type SimulationDistribution = 'uniform' | 'weighted'
type Distribution = Record<string, { count: number; percent: number }>

export interface SimulationReport {
  metadata: { testId: string; testVersion: string; evaluationVersion: string; runs: number; distribution: SimulationDistribution; seed: number; optionWeights: number[] }
  baseOutcomeDistribution: Distribution
  finalOutcomeDistribution: Distribution
  calibrationDistribution: Distribution
  personaDistribution: Distribution
  personaCandidateDistribution: Distribution
  deathCauseDistribution: Distribution
  fourPointZeroHitRate: number
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x9e3779b9
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000 }
}

const round = (value: number): number => Math.round(value * 10000) / 10000
const increment = (target: Record<string, number>, key: string): void => { target[key] = (target[key] ?? 0) + 1 }
const format = (counts: Record<string, number>, runs: number): Distribution => Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, { count, percent: round(count / runs * 100) }]))

function pickOption(random: () => number, weights: number[]): number {
  const value = random()
  let cumulative = 0
  for (let index = 0; index < weights.length; index += 1) { cumulative += weights[index] ?? 0; if (value < cumulative) return index }
  return weights.length - 1
}

export function runSimulation(input: { definition: V3TestDefinition; runs: number; distribution: SimulationDistribution; seed: number; weightedOptionProbabilities?: number[] }): SimulationReport {
  const { definition, runs, distribution, seed } = input
  if (!Number.isInteger(runs) || runs <= 0) throw new Error('runs must be a positive integer')
  const weights = distribution === 'uniform' ? [.25, .25, .25, .25] : input.weightedOptionProbabilities ?? [.35, .32, .20, .13]
  if (weights.length !== 4 || Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) > 1e-9) throw new Error('option weights must contain four values that sum to 1')
  const random = createRandom(seed)
  const base: Record<string, number> = {}, final: Record<string, number> = {}, calibration: Record<string, number> = {}
  const persona: Record<string, number> = {}, personaCandidates: Record<string, number> = {}, death: Record<string, number> = {}
  for (let run = 0; run < runs; run += 1) {
    const answers: Answers = {}
    for (const question of definition.questions) answers[question.id] = question.options[pickOption(random, weights)]!.id
    const result = evaluateComplete(definition, answers)
    increment(base, result.baseOutcome); increment(final, result.finalOutcome); increment(calibration, String(result.calibrationDelta))
    increment(persona, result.primaryPersona); increment(death, result.deathCause)
    for (const candidate of result.candidates) increment(personaCandidates, candidate.id)
  }
  return {
    metadata: { testId: definition.id, testVersion: definition.version, evaluationVersion: definition.evaluationVersion, runs, distribution, seed, optionWeights: weights },
    baseOutcomeDistribution: format(base, runs), finalOutcomeDistribution: format(final, runs), calibrationDistribution: format(calibration, runs),
    personaDistribution: format(persona, runs), personaCandidateDistribution: format(personaCandidates, runs), deathCauseDistribution: format(death, runs),
    fourPointZeroHitRate: round((final['4.0'] ?? 0) / runs * 100),
  }
}
